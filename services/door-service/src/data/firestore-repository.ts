import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeEvent, normalizeRevocation, normalizeSession, normalizeStaff, normalizeStoredEvent, normalizeStoredSequence, normalizeTicket } from './normalize.js'
import { isRecord, safeDocumentId } from '../utils/values.js'
import type {
  AttendanceCommitInput,
  AttendanceCommitResult,
  AttendanceDecision,
  AttendanceSessionSnapshot,
  DeviceKeyRecord,
  DoorRepository,
  EventRecord,
  RevocationRecord,
  StaffRecord,
  StoredAttendanceEvent,
  TicketRecord
} from '../types.js'

const asData = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const sequenceDocumentId = (deviceId: string, deviceSequence: number): string => safeDocumentId(`${deviceId}:${deviceSequence}`)

export class FirestoreDoorRepository implements DoorRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async getStaff(businessId: string, uid: string): Promise<StaffRecord | null> {
    const snapshot = await this.businessCollection(businessId, 'staff').doc(uid).get()
    return snapshot.exists ? normalizeStaff(businessId, uid, snapshot.data()) : null
  }

  async getTicket(businessId: string, ticketId: string): Promise<TicketRecord | null> {
    const ticketSnapshot = await this.businessCollection(businessId, 'tickets').doc(safeDocumentId(ticketId)).get()
    if (ticketSnapshot.exists) return normalizeTicket(businessId, ticketId, ticketSnapshot.data())
    const reservationSnapshot = await this.businessCollection(businessId, 'reservations').doc(safeDocumentId(ticketId)).get()
    return reservationSnapshot.exists ? normalizeTicket(businessId, ticketId, reservationSnapshot.data()) : null
  }

  async getEvent(businessId: string, eventId: string): Promise<EventRecord | null> {
    const snapshot = await this.businessCollection(businessId, 'events').doc(safeDocumentId(eventId)).get()
    return snapshot.exists ? normalizeEvent(businessId, eventId, snapshot.data()) : null
  }

  async getRevocations(businessId: string, eventId?: string, deviceId?: string): Promise<RevocationRecord[]> {
    const collections = [
      this.businessCollection(businessId, 'emergencyRevocations'),
      this.businessCollection(businessId, 'emergency_revocations')
    ]
    const records: RevocationRecord[] = []
    const seen = new Set<string>()
    let successfulRead = false
    let collectionRead = false
    let firstError: unknown

    try {
      const businessSnapshot = await this.db.collection('businesses').doc(businessId).get()
      if (businessSnapshot.exists) {
        const business = asData(businessSnapshot.data())
        const emergency = business.emergencyRevocation
        if (isRecord(emergency)) {
          const emergencyData = { ...emergency }
          if (emergencyData.revocationVersion === undefined && emergencyData.version === undefined && business.emergencyRevocationVersion !== undefined) emergencyData.revocationVersion = business.emergencyRevocationVersion
          const record = normalizeRevocation(businessId, 'business-emergency', emergencyData)
          if (this.matchesRevocation(record, eventId, deviceId)) {
            records.push(record)
            seen.add(`${record.scope}:${record.eventId ?? ''}:${record.deviceId ?? ''}:${record.revocationVersion}:${record.revokedBefore ?? ''}`)
          }
        }
        successfulRead = true
      }
    } catch (error) {
      if (firstError === undefined) firstError = error
    }

    for (const collection of collections) {
      try {
        const snapshot = await collection.limit(100).get()
        successfulRead = true
        collectionRead = true
        for (const document of snapshot.docs) {
          const normalized = normalizeRevocation(businessId, document.id, document.data())
          if (!this.matchesRevocation(normalized, eventId, deviceId)) continue
          const key = `${normalized.scope}:${normalized.eventId ?? ''}:${normalized.deviceId ?? ''}:${normalized.revocationVersion}:${normalized.revokedBefore ?? ''}`
          if (seen.has(key)) continue
          seen.add(key)
          records.push(normalized)
        }
      } catch (error) {
        if (firstError === undefined) firstError = error
      }
    }

    if ((!successfulRead || !collectionRead) && firstError !== undefined) throw firstError
    return records
  }

  async getDeviceKey(businessId: string, kid: string): Promise<DeviceKeyRecord | null> {
    const snapshot = await this.businessCollection(businessId, 'deviceKeys').doc(safeDocumentId(kid)).get()
    if (!snapshot.exists) return null
    const data = asData(snapshot.data())
    const publicKey = data.publicKey
    if (!isRecord(publicKey)) return null
    const deviceId = typeof data.deviceId === 'string' && data.deviceId.length > 0 ? data.deviceId : kid
    return {
      businessId,
      kid,
      deviceId,
      publicKey,
      enrolledAt: typeof data.enrolledAt === 'number' ? data.enrolledAt : undefined,
      active: data.active !== false
    }
  }

  async putDeviceKey(record: DeviceKeyRecord): Promise<void> {
    await this.businessCollection(record.businessId, 'deviceKeys').doc(safeDocumentId(record.kid)).set({
      businessId: record.businessId,
      kid: record.kid,
      deviceId: record.deviceId,
      publicKey: record.publicKey,
      enrolledAt: record.enrolledAt ?? Date.now(),
      active: record.active !== false,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })
  }

  async commitAttendance(input: AttendanceCommitInput): Promise<AttendanceCommitResult> {
    const eventReference = this.businessCollection(input.businessId, 'attendanceEvents').doc(safeDocumentId(input.jti))
    const sequenceReference = this.businessCollection(input.businessId, 'attendanceSequences').doc(sequenceDocumentId(input.deviceId, input.deviceSequence))
    const sessionReference = this.businessCollection(input.businessId, 'attendanceSessions').doc(safeDocumentId(input.ticketId))

    return this.db.runTransaction(async (transaction) => {
      const [eventSnapshot, sequenceSnapshot, sessionSnapshot] = await Promise.all([
        transaction.get(eventReference),
        transaction.get(sequenceReference),
        transaction.get(sessionReference)
      ])

      const existingEvent = eventSnapshot.exists ? normalizeStoredEvent(eventSnapshot.data()) : null
      const existingSequence = sequenceSnapshot.exists ? normalizeStoredSequence(sequenceSnapshot.data()) : null
      const session = normalizeSession(sessionSnapshot.exists ? sessionSnapshot.data() : undefined)
      const decision = input.decide(session, existingEvent, existingSequence)

      if (existingEvent && existingEvent.jti === input.jti && existingEvent.payloadHash === input.payloadHash) {
        return this.resultFromStored(existingEvent, true)
      }

      if (existingEvent && existingEvent.jti === input.jti && existingEvent.payloadHash !== input.payloadHash) {
        const conflict = this.conflictResult(input, session, 'JTI_PAYLOAD_MISMATCH')
        transaction.set(this.collisionReference(input), this.collisionData(input, existingEvent.jti, conflict.reason ?? 'JTI_PAYLOAD_MISMATCH'), { merge: true })
        return conflict
      }

      if (existingSequence && (existingSequence.jti !== input.jti || existingSequence.payloadHash !== input.payloadHash)) {
        const conflict = this.conflictResult(input, session, 'DEVICE_SEQUENCE_COLLISION')
        transaction.set(this.collisionReference(input), this.collisionData(input, existingSequence.jti, conflict.reason ?? 'DEVICE_SEQUENCE_COLLISION'), { merge: true })
        transaction.set(eventReference, this.eventData(input, conflict.event, decision), { merge: false })
        return conflict
      }

      const event = this.storedEvent(input, decision)
      if (decision.status === 'CONFLICT') {
        if (this.isCollisionReason(decision.reason)) {
          transaction.set(this.collisionReference(input), this.collisionData(input, input.jti, decision.reason ?? 'ATTENDANCE_COLLISION'), { merge: true })
        }
        transaction.set(eventReference, this.eventData(input, event, decision), { merge: false })
        if (!existingSequence) {
          transaction.set(sequenceReference, {
            deviceId: input.deviceId,
            deviceSequence: input.deviceSequence,
            jti: input.jti,
            payloadHash: input.payloadHash,
            createdAt: FieldValue.serverTimestamp()
          })
        }
        return {
          status: 'CONFLICT',
          duplicate: false,
          stateBefore: event.stateBefore,
          stateAfter: event.stateAfter,
          reentryCount: decision.reentryCount,
          reentryExpiresAt: decision.reentryExpiresAt,
          reason: decision.reason ?? 'CONFLICT',
          event
        }
      }

      transaction.set(eventReference, this.eventData(input, event, decision), { merge: false })
      transaction.set(sequenceReference, {
        deviceId: input.deviceId,
        deviceSequence: input.deviceSequence,
        jti: input.jti,
        payloadHash: input.payloadHash,
        createdAt: FieldValue.serverTimestamp()
      })
      const sessionData: Record<string, unknown> = {
        businessId: input.businessId,
        eventId: input.eventId,
        venueId: input.venueId,
        ticketId: input.ticketId,
        state: decision.stateAfter,
        lastDeviceSequence: decision.lastDeviceSequence,
        reentryCount: decision.reentryCount,
        lastEventJti: input.jti,
        lastOccurredAt: input.occurredAt,
        updatedAt: FieldValue.serverTimestamp()
      }
      sessionData.reentryExpiresAt = decision.reentryExpiresAt === undefined ? FieldValue.delete() : decision.reentryExpiresAt
      transaction.set(sessionReference, sessionData, { merge: true })
      return {
        status: 'ACCEPTED',
        duplicate: false,
        stateBefore: decision.stateBefore,
        stateAfter: decision.stateAfter,
        reentryCount: decision.reentryCount,
        reentryExpiresAt: decision.reentryExpiresAt,
        event
      }
    })
  }

  private businessCollection(businessId: string, name: string) {
    return this.db.collection('businesses').doc(businessId).collection(name)
  }

  private matchesRevocation(record: RevocationRecord, eventId: string | undefined, deviceId: string | undefined): boolean {
    if (eventId && record.scope === 'EVENT' && record.eventId && record.eventId !== eventId) return false
    if (deviceId && record.scope === 'DEVICE' && record.deviceId && record.deviceId !== deviceId) return false
    if (eventId && record.scope === 'BUSINESS') return true
    if (deviceId && record.scope === 'BUSINESS') return true
    if (eventId && record.scope === 'EVENT') return true
    if (deviceId && record.scope === 'DEVICE') return true
    return !eventId && !deviceId
  }

  private isCollisionReason(reason: string | undefined): boolean {
    return reason === 'ALREADY_INSIDE' || reason === 'OUT_OF_ORDER' || reason === 'DEVICE_SEQUENCE_COLLISION' || reason === 'JTI_PAYLOAD_MISMATCH'
  }

  private collisionReference(input: AttendanceCommitInput) {
    return this.businessCollection(input.businessId, 'securityIncidents').doc(safeDocumentId(`${input.jti}:${input.deviceId}:${input.deviceSequence}`))
  }

  private collisionData(input: AttendanceCommitInput, conflictingJti: string, reason: string): Record<string, unknown> {
    return {
      businessId: input.businessId,
      eventId: input.eventId,
      venueId: input.venueId,
      ticketId: input.ticketId,
      type: 'ATTENDANCE_COLLISION',
      status: 'OPEN',
      reason,
      sanction: 'NONE',
      automaticPenalty: false,
      requiresManualReview: true,
      incomingJti: input.jti,
      conflictingJti,
      deviceId: input.deviceId,
      deviceSequence: input.deviceSequence,
      occurredAt: input.occurredAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  }

  private storedEvent(input: AttendanceCommitInput, decision: AttendanceDecision): StoredAttendanceEvent {
    return {
      jti: input.jti,
      deviceId: input.deviceId,
      deviceSequence: input.deviceSequence,
      payloadHash: input.payloadHash,
      status: decision.status === 'CONFLICT' ? 'CONFLICT' : 'ACCEPTED',
      stateBefore: decision.stateBefore,
      stateAfter: decision.stateAfter,
      reason: decision.reason,
      action: input.action,
      signature: input.signature,
      reentryCount: decision.reentryCount,
      reentryExpiresAt: decision.reentryExpiresAt,
      occurredAt: input.occurredAt
    }
  }

  private eventData(input: AttendanceCommitInput, event: StoredAttendanceEvent, decision: AttendanceDecision): Record<string, unknown> {
    const data: Record<string, unknown> = {
      id: input.jti,
      jti: input.jti,
      businessId: input.businessId,
      eventId: input.eventId,
      venueId: input.venueId,
      ticketId: input.ticketId,
      deviceId: input.deviceId,
      deviceSequence: input.deviceSequence,
      payloadHash: input.payloadHash,
      status: event.status,
      stateBefore: event.status === 'CONFLICT' ? event.stateBefore : decision.stateBefore,
      stateAfter: event.status === 'CONFLICT' ? event.stateAfter : decision.stateAfter,
      action: input.action,
      signature: input.signature,
      reentryCount: decision.reentryCount,
      occurredAt: input.occurredAt,
      syncedAt: FieldValue.serverTimestamp(),
      sanction: 'NONE'
    }
    const reason = event.status === 'CONFLICT' ? event.reason : decision.reason
    if (reason) {
      data.reason = reason
      data.conflictReason = reason
    }
    const reentryExpiresAt = event.status === 'CONFLICT' ? event.reentryExpiresAt : decision.reentryExpiresAt
    if (reentryExpiresAt !== undefined) data.reentryExpiresAt = reentryExpiresAt
    return data
  }

  private conflictResult(
    input: AttendanceCommitInput,
    session: AttendanceSessionSnapshot,
    reason: string
  ): AttendanceCommitResult {
    const event: StoredAttendanceEvent = {
      jti: input.jti,
      deviceId: input.deviceId,
      deviceSequence: input.deviceSequence,
      payloadHash: input.payloadHash,
      status: 'CONFLICT',
      stateBefore: session.state,
      stateAfter: session.state,
      reason,
      action: input.action,
      signature: input.signature,
      reentryCount: session.reentryCount,
      reentryExpiresAt: session.reentryExpiresAt,
      occurredAt: input.occurredAt
    }
    return {
      status: 'CONFLICT',
      duplicate: false,
      stateBefore: session.state,
      stateAfter: session.state,
      reentryCount: session.reentryCount,
      reentryExpiresAt: session.reentryExpiresAt,
      reason,
      event
    }
  }

  private resultFromStored(event: StoredAttendanceEvent, duplicate: boolean): AttendanceCommitResult {
    return {
      status: event.status === 'CONFLICT' ? 'CONFLICT' : 'ACCEPTED',
      duplicate,
      stateBefore: event.stateBefore,
      stateAfter: event.stateAfter,
      reentryCount: event.reentryCount ?? 0,
      reentryExpiresAt: event.reentryExpiresAt,
      reason: event.reason,
      event
    }
  }
}

export const firestoreData = (value: unknown): Record<string, unknown> => asData(value)

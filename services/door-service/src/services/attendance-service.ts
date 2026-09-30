import type { ServiceConfig } from '../config.js'
import { BadRequestError, HttpError, ServiceUnavailableError } from '../errors.js'
import { assertSafeId, dateMillis, hashValue, integerValue, isRecord } from '../utils/values.js'
import type {
  AttendanceAction,
  AttendanceCommitInput,
  AttendanceEventStatus,
  AttendanceSessionSnapshot,
  DoorRepository,
  EmergencyStatus,
  EventRecord,
  PresenceState,
  TicketRecord
} from '../types.js'
import { EmergencyService } from './emergency-service.js'
import { AttendanceSignatureService } from './attendance-signature-service.js'

export interface AttendanceResult {
  jti?: string
  deviceId?: string
  deviceSequence?: number
  status: AttendanceEventStatus
  previousPresence: PresenceState
  previousState: PresenceState
  presence: PresenceState
  state: PresenceState
  sanction: 'NONE'
  idempotent: boolean
  reentryCount: number
  reentryExpiresAt?: string
  reason?: string
}

export interface AttendanceSyncResponse {
  results: AttendanceResult[]
  accepted: number
  conflicts: number
  rejected: number
}

interface NormalizedAttendanceEvent {
  businessId: string
  eventId: string
  venueId: string
  ticketId: string
  deviceId: string
  jti: string
  deviceSequence: number
  action: AttendanceAction
  requestedState?: PresenceState
  occurredAt: number
  revocationVersion: number
  signature: string
  signedPayload: Record<string, unknown>
}

export class AttendanceService {
  private readonly repository: DoorRepository
  private readonly signatures: AttendanceSignatureService
  private readonly emergency: EmergencyService
  private readonly config: ServiceConfig

  constructor(repository: DoorRepository, signatures: AttendanceSignatureService, emergency: EmergencyService, config: ServiceConfig) {
    this.repository = repository
    this.signatures = signatures
    this.emergency = emergency
    this.config = config
  }

  async sync(businessId: string, rawEvents: unknown, now = Date.now()): Promise<AttendanceSyncResponse> {
    if (!Array.isArray(rawEvents)) throw new BadRequestError('events debe ser un array')
    if (rawEvents.length === 0) throw new BadRequestError('events no puede estar vacío')
    if (rawEvents.length > this.config.maxBatchSize) throw new BadRequestError('events excede el tamaño máximo')

    const results: AttendanceResult[] = []
    for (const rawEvent of rawEvents) {
      results.push(await this.syncOne(businessId, rawEvent, now))
    }
    return {
      results,
      accepted: results.filter((result) => result.status === 'ACCEPTED').length,
      conflicts: results.filter((result) => result.status === 'CONFLICT').length,
      rejected: results.filter((result) => result.status === 'REJECTED').length
    }
  }

  private async syncOne(businessId: string, rawEvent: unknown, now: number): Promise<AttendanceResult> {
    if (!isRecord(rawEvent)) throw new BadRequestError('Cada evento debe ser un objeto')
    let event: NormalizedAttendanceEvent
    try {
      event = await this.normalizeEvent(businessId, rawEvent, now)
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 401) {
        const reason = error.message === 'DEVICE_NOT_ENROLLED' || error.message === 'DEVICE_SIGNATURE_INVALID'
          ? error.message
          : 'DEVICE_SIGNATURE_INVALID'
        return this.rejected(this.fallbackEvent(businessId, rawEvent, now), reason)
      }
      throw error
    }
    if (this.trueClaim(event.signedPayload, 'eventCanceled', 'event_canceled', 'canceled', 'cancelled', 'revoked')) {
      return this.rejected(event, 'EVENT_CANCELED')
    }
    const [eventRecord, ticketRecord] = await Promise.all([
      this.readEvent(event.businessId, event.eventId),
      this.readTicket(event.businessId, event.ticketId)
    ])

    if (!eventRecord) {
      return this.rejected(event, 'EVENT_NOT_FOUND')
    }
    if (!ticketRecord) {
      return this.rejected(event, 'TICKET_NOT_FOUND')
    }
    if (eventRecord.canceled) {
      return this.rejected(event, 'EVENT_CANCELED')
    }
    if (ticketRecord.eventCanceled) {
      return this.rejected(event, 'EVENT_CANCELED')
    }
    if (ticketRecord.revoked) {
      return this.rejected(event, 'TICKET_REVOKED')
    }
    if (eventRecord.venueId && eventRecord.venueId !== event.venueId) {
      return this.rejected(event, 'VENUE_MISMATCH')
    }
    if (ticketRecord.eventId && ticketRecord.eventId !== event.eventId) {
      return this.rejected(event, 'EVENT_MISMATCH')
    }
    if (ticketRecord.venueId && ticketRecord.venueId !== event.venueId) {
      return this.rejected(event, 'VENUE_MISMATCH')
    }
    if (ticketRecord.deviceId && ticketRecord.deviceId !== event.deviceId) {
      return this.rejected(event, 'DEVICE_MISMATCH')
    }
    if (ticketRecord.revocationVersion > event.revocationVersion || eventRecord.revocationVersion > event.revocationVersion) {
      return this.rejected(event, 'TOKEN_REVOKED')
    }

    const emergency = await this.readEmergency(event.businessId, event.eventId, event.deviceId, event.revocationVersion, event.occurredAt)
    if (!emergency.allowed) {
      return this.rejected(event, emergency.reason ?? 'REVOKED')
    }

    const commitInput: AttendanceCommitInput = {
      businessId: event.businessId,
      eventId: event.eventId,
      venueId: event.venueId,
      ticketId: event.ticketId,
      deviceId: event.deviceId,
      jti: event.jti,
      deviceSequence: event.deviceSequence,
      occurredAt: event.occurredAt,
      action: event.action,
      signature: event.signature,
      payloadHash: hashValue({
        jti: event.jti,
        businessId: event.businessId,
        eventId: event.eventId,
        venueId: event.venueId,
        ticketId: event.ticketId,
        deviceId: event.deviceId,
        deviceSequence: event.deviceSequence,
        action: event.action,
        requestedState: event.requestedState,
        occurredAt: event.occurredAt,
        claims: event.signedPayload
      }),
      decide: (session) => this.decide(session, event, eventRecord, ticketRecord, emergency.status, now)
    }

    try {
      const committed = await this.repository.commitAttendance(commitInput)
      return {
        jti: event.jti,
        deviceId: event.deviceId,
        deviceSequence: event.deviceSequence,
        status: committed.status,
        previousPresence: committed.stateBefore,
        previousState: committed.stateBefore,
        presence: committed.stateAfter,
        state: committed.stateAfter,
        sanction: 'NONE',
        idempotent: committed.duplicate,
        reentryCount: committed.reentryCount,
        reentryExpiresAt: committed.reentryExpiresAt === undefined ? undefined : new Date(committed.reentryExpiresAt).toISOString(),
        reason: committed.reason
      }
    } catch (error) {
      if (this.isDependencyFailure(error)) {
        throw new ServiceUnavailableError('Firestore no está disponible')
      }
      throw error
    }
  }

  private async normalizeEvent(businessId: string, rawEvent: Record<string, unknown>, now: number): Promise<NormalizedAttendanceEvent> {
    const verified = await this.signatures.verify(rawEvent, businessId)
    const signedValue = verified.signature
    const signedPayload = verified.payload
    this.validateTemporalClaims(signedPayload, now)
    const signedEvent = isRecord(signedPayload.event) ? signedPayload.event : signedPayload
    const payload = isRecord(signedPayload.payload) ? signedPayload.payload : {}
    const signedClaims = { ...payload, ...signedPayload, ...signedEvent }
    const eventId = assertSafeId(this.firstString(signedClaims.eventId, signedClaims.event_id, signedClaims.eventContext, signedClaims.event_context), 'eventId')
    const venueId = assertSafeId(this.firstString(signedClaims.venueId, signedClaims.venue_id), 'venueId')
    const ticketId = assertSafeId(this.firstString(signedClaims.ticketId, signedClaims.ticket_id), 'ticketId')
    const deviceId = assertSafeId(this.firstString(signedClaims.deviceId, signedClaims.device_id), 'deviceId')
    const jti = assertSafeId(this.firstString(signedClaims.jti, signedClaims.id, signedClaims.gatewayEventId), 'jti')
    const deviceSequence = integerValue(this.firstValue(signedClaims.deviceSequence, signedClaims.device_sequence, signedClaims.sequence))
    if (deviceSequence === undefined || deviceSequence < 0) throw new BadRequestError('deviceSequence debe ser un entero no negativo')
    const signedBusinessId = this.firstString(signedClaims.businessId, signedClaims.business_id)
    if (signedBusinessId !== businessId) throw new BadRequestError('El evento no pertenece al business autorizado')
    if (rawEvent.businessId !== undefined && rawEvent.businessId !== businessId) throw new BadRequestError('businessId no coincide')
    if (rawEvent.business_id !== undefined && rawEvent.business_id !== businessId) throw new BadRequestError('businessId no coincide')
    if (rawEvent.ticketId !== undefined && rawEvent.ticketId !== ticketId) throw new BadRequestError('ticketId no coincide')
    if (rawEvent.deviceId !== undefined && rawEvent.deviceId !== deviceId) throw new BadRequestError('deviceId no coincide')
    if (rawEvent.eventId !== undefined && rawEvent.eventId !== eventId) throw new BadRequestError('eventId no coincide')
    if (rawEvent.venueId !== undefined && rawEvent.venueId !== venueId) throw new BadRequestError('venueId no coincide')
    if (rawEvent.jti !== undefined && rawEvent.jti !== jti) throw new BadRequestError('jti no coincide')
    if (verified.header?.kid !== undefined && rawEvent.kid !== undefined && verified.header.kid !== rawEvent.kid) throw new BadRequestError('kid no coincide')
    const actionValue = this.firstString(signedClaims.action, signedClaims.type, signedClaims.eventType, signedClaims.event_type)
    const presenceValue = this.firstString(signedClaims.presence, signedClaims.state, signedClaims.presenceState, signedClaims.presence_state)
    const action = this.normalizeAction(actionValue, presenceValue)
    const requestedState = this.normalizeState(presenceValue)
    if (rawEvent.action !== undefined && typeof rawEvent.action === 'string') {
      const rawNormalized = this.normalizeAction(rawEvent.action, rawEvent.presence)
      if (rawNormalized !== action) {
        throw new BadRequestError('action en rawEvent no coincide con el payload firmado')
      }
    }
    if (rawEvent.presence !== undefined && typeof rawEvent.presence === 'string') {
      const rawState = this.normalizeState(rawEvent.presence)
      if (rawState !== requestedState) {
        throw new BadRequestError('presence en rawEvent no coincide con el payload firmado')
      }
    }
    const occurredAt = dateMillis(this.firstValue(signedClaims.occurredAt, signedClaims.occurred_at, signedPayload.iat ? Number(signedPayload.iat) * 1000 : undefined)) ?? now
    if (occurredAt > now + this.config.clockSkewSeconds * 1000) throw new BadRequestError('occurredAt está en el futuro')
    const revocationVersion = integerValue(this.firstValue(signedClaims.revocationVersion, signedClaims.revocation_version, signedPayload.revocationVersion)) ?? 0

    return {
      businessId,
      eventId,
      venueId,
      ticketId,
      deviceId,
      jti,
      deviceSequence,
      action,
      requestedState,
      occurredAt,
      revocationVersion,
      signature: signedValue,
      signedPayload
    }
  }

  private validateTemporalClaims(payload: Record<string, unknown>, now: number): void {
    const currentSeconds = Math.floor(now / 1000)
    const exp = integerValue(payload.exp)
    const nbf = integerValue(payload.nbf)
    const iat = integerValue(payload.iat)
    if (exp !== undefined && currentSeconds > exp + this.config.clockSkewSeconds) throw new BadRequestError('La firma del evento expiró')
    if (nbf !== undefined && currentSeconds + this.config.clockSkewSeconds < nbf) throw new BadRequestError('La firma del evento todavía no es válida')
    if (iat !== undefined && currentSeconds + this.config.clockSkewSeconds < iat) throw new BadRequestError('La firma del evento tiene un iat inválido')
    if (payload.iss !== undefined && payload.iss !== this.config.issuer) throw new BadRequestError('Issuer de la firma inválido')
    const audienceMatches = payload.aud === this.config.audience || Array.isArray(payload.aud) && payload.aud.includes(this.config.audience)
    if (payload.aud !== undefined && !audienceMatches) throw new BadRequestError('Audience de la firma inválido')
  }

  private decide(
    session: AttendanceSessionSnapshot,
    event: NormalizedAttendanceEvent,
    eventRecord: EventRecord,
    ticketRecord: TicketRecord,
    emergencyStatus: EmergencyStatus,
    now: number
  ) {
    if (event.deviceSequence < session.lastDeviceSequence) {
      return this.conflict(session, 'OUT_OF_ORDER')
    }

    const stateBefore = session.state
    const policy = this.reentryPolicy(eventRecord, ticketRecord)
    const expiry = session.reentryExpiresAt
    const entering = event.action === 'REENTRY' || event.action === 'CHECK_IN' || (event.action === 'MANUAL_OVERRIDE' && event.requestedState === 'INSIDE')
    if (entering && stateBefore === 'OUTSIDE_TEMPORARY' && expiry !== undefined && expiry <= now) {
      return this.conflict(session, 'REENTRY_WINDOW_EXPIRED')
    }
    if (entering && policy.maxReentries !== undefined && session.reentryCount >= policy.maxReentries && stateBefore === 'OUTSIDE_TEMPORARY') {
      return this.conflict(session, 'REENTRY_LIMIT_REACHED')
    }
    if (emergencyStatus.eventCanceled || eventRecord.canceled || ticketRecord.revoked) {
      return this.conflict(session, emergencyStatus.eventCanceled ? 'EVENT_CANCELED' : 'TICKET_REVOKED')
    }
    if (emergencyStatus.revocationVersion > event.revocationVersion || emergencyStatus.revokedBefore !== undefined && emergencyStatus.revokedBefore >= event.occurredAt) {
      return this.conflict(session, emergencyStatus.revocationVersion > event.revocationVersion ? 'TOKEN_REVOKED' : 'EVENT_REVOKED_BEFORE')
    }

    if (event.action === 'EXIT') {
      if (stateBefore !== 'INSIDE') return this.conflict(session, stateBefore === 'OUTSIDE_TEMPORARY' ? 'ALREADY_OUTSIDE' : 'EXIT_WITHOUT_INSIDE')
      const reentryExpiresAt = now + policy.minutes * 60 * 1000
      return {
        status: 'ACCEPTED' as const,
        stateBefore,
        stateAfter: 'OUTSIDE_TEMPORARY' as const,
        lastDeviceSequence: event.deviceSequence,
        reentryCount: session.reentryCount,
        reentryExpiresAt,
        reason: undefined
      }
    }

    if (event.action === 'REENTRY' && stateBefore !== 'OUTSIDE_TEMPORARY') {
      return this.conflict(session, 'INVALID_REENTRY_STATE')
    }

    if (event.action === 'CHECK_IN' || event.action === 'REENTRY') {
      if (stateBefore === 'INSIDE') return this.conflict(session, 'ALREADY_INSIDE')
      const reentryCount = stateBefore === 'OUTSIDE_TEMPORARY' ? session.reentryCount + 1 : session.reentryCount
      return {
        status: 'ACCEPTED' as const,
        stateBefore,
        stateAfter: 'INSIDE' as const,
        lastDeviceSequence: event.deviceSequence,
        reentryCount,
        reentryExpiresAt: undefined,
        reason: undefined
      }
    }

    const target = event.requestedState
    if (!target || target === 'ABSENT' && stateBefore === 'ABSENT') return this.conflict(session, 'INVALID_MANUAL_OVERRIDE')
    if (target === stateBefore) {
      return {
        status: 'ACCEPTED' as const,
        stateBefore,
        stateAfter: stateBefore,
        lastDeviceSequence: event.deviceSequence,
        reentryCount: session.reentryCount,
        reentryExpiresAt: session.reentryExpiresAt,
        reason: undefined
      }
    }
    if (target === 'OUTSIDE_TEMPORARY' && stateBefore !== 'INSIDE') return this.conflict(session, 'EXIT_WITHOUT_INSIDE')
    return {
      status: 'ACCEPTED' as const,
      stateBefore,
      stateAfter: target,
      lastDeviceSequence: event.deviceSequence,
      reentryCount: target === 'INSIDE' && stateBefore === 'OUTSIDE_TEMPORARY' ? session.reentryCount + 1 : session.reentryCount,
      reentryExpiresAt: target === 'OUTSIDE_TEMPORARY' ? now + policy.minutes * 60 * 1000 : undefined,
      reason: undefined
    }
  }

  private reentryPolicy(eventRecord: EventRecord, ticketRecord: TicketRecord): { minutes: number; maxReentries?: number } {
    const raw = { ...ticketRecord.raw, ...eventRecord.raw }
    const nested = isRecord(raw.reentryPolicy) ? raw.reentryPolicy : {}
    const minutes = integerValue(raw.reentryMinutes ?? raw.reentry_minutes ?? nested.minutes) ?? 30
    const max = integerValue(raw.maxReentries ?? raw.max_reentries ?? raw.reentryLimit ?? raw.reentry_limit ?? nested.maxReentries ?? nested.max)
    return { minutes: Math.max(1, minutes), maxReentries: max !== undefined && max >= 0 ? max : undefined }
  }

  private conflict(session: AttendanceSessionSnapshot, reason: string) {
    return {
      status: 'CONFLICT' as const,
      stateBefore: session.state,
      stateAfter: session.state,
      lastDeviceSequence: session.lastDeviceSequence,
      reentryCount: session.reentryCount,
      reentryExpiresAt: session.reentryExpiresAt,
      reason
    }
  }

  private rejected(event: NormalizedAttendanceEvent, reason: string): AttendanceResult {
    return {
      jti: event.jti,
      deviceId: event.deviceId,
      deviceSequence: event.deviceSequence,
      status: 'REJECTED',
      previousPresence: 'ABSENT',
      previousState: 'ABSENT',
      presence: 'ABSENT',
      state: 'ABSENT',
      sanction: 'NONE',
      idempotent: false,
      reentryCount: 0,
      reason
    }
  }

  private fallbackEvent(businessId: string, rawEvent: Record<string, unknown>, now: number): NormalizedAttendanceEvent {
    const claims = isRecord(rawEvent.claims) ? rawEvent.claims : {}
    const pick = (...values: unknown[]): string | undefined => {
      for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) return value.trim()
      }
      return undefined
    }
    return {
      businessId,
      eventId: pick(rawEvent.eventId, rawEvent.event_id, claims.eventId) ?? '',
      venueId: pick(rawEvent.venueId, rawEvent.venue_id, claims.venueId) ?? '',
      ticketId: pick(rawEvent.ticketId, rawEvent.ticket_id, claims.ticketId) ?? '',
      deviceId: pick(rawEvent.deviceId, rawEvent.device_id, claims.deviceId) ?? '',
      jti: pick(rawEvent.jti, claims.jti) ?? crypto.randomUUID(),
      deviceSequence: integerValue(this.firstValue(rawEvent.deviceSequence, rawEvent.device_sequence, claims.deviceSequence)) ?? 0,
      action: 'CHECK_IN',
      occurredAt: dateMillis(this.firstValue(rawEvent.occurredAt, rawEvent.occurred_at, claims.occurredAt)) ?? now,
      revocationVersion: integerValue(this.firstValue(rawEvent.revocationVersion, rawEvent.revocation_version, claims.revocationVersion)) ?? 0,
      signature: '',
      signedPayload: claims
    }
  }

  private async readEvent(businessId: string, eventId: string): Promise<EventRecord | null> {
    try {
      return await this.repository.getEvent(businessId, eventId)
    } catch (error) {
      if (this.isDependencyFailure(error)) throw new ServiceUnavailableError('Firestore no está disponible')
      throw error
    }
  }

  private async readTicket(businessId: string, ticketId: string): Promise<TicketRecord | null> {
    try {
      return await this.repository.getTicket(businessId, ticketId)
    } catch (error) {
      if (this.isDependencyFailure(error)) throw new ServiceUnavailableError('Firestore no está disponible')
      throw error
    }
  }

  private async readEmergency(businessId: string, eventId: string, deviceId: string, revocationVersion: number, occurredAt: number): Promise<{ allowed: boolean; reason?: string; status: EmergencyStatus }> {
    try {
      return await this.emergency.check(businessId, eventId, deviceId, revocationVersion, occurredAt)
    } catch (error) {
      if (this.isDependencyFailure(error)) throw new ServiceUnavailableError('Firestore no está disponible')
      throw error
    }
  }

  private firstString(...values: unknown[]): unknown {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    }
    return undefined
  }

  private firstValue(...values: unknown[]): unknown {
    return values.find((value) => value !== undefined && value !== null)
  }

  private normalizeAction(value: unknown, presence: unknown): AttendanceAction {
    const normalized = typeof value === 'string' ? value.trim().toUpperCase().replace(/[-\s]/gu, '_') : ''
    if (['CHECK_IN', 'CHECKIN', 'ENTER', 'ENTRY', 'ARRIVAL'].includes(normalized)) return 'CHECK_IN'
    if (['REENTRY', 'RE_ENTER', 'RE_ENTERED'].includes(normalized)) return 'REENTRY'
    if (['EXIT', 'LEAVE', 'DEPARTURE'].includes(normalized)) return 'EXIT'
    if (normalized === 'MANUAL_OVERRIDE' || normalized === 'OVERRIDE') return 'MANUAL_OVERRIDE'
    const state = this.normalizeState(presence)
    if (state === 'INSIDE') return 'CHECK_IN'
    if (state === 'OUTSIDE_TEMPORARY') return 'EXIT'
    if (state === 'ABSENT') return 'MANUAL_OVERRIDE'
    throw new BadRequestError('Acción de attendance no válida')
  }

  private normalizeState(value: unknown): PresenceState | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const normalized = String(value).trim().toUpperCase().replace(/[-\s]/gu, '_')
    if (normalized === 'ABSENT' || normalized === 'OUT' || normalized === 'OUTSIDE') return normalized === 'OUT' || normalized === 'OUTSIDE' ? 'OUTSIDE_TEMPORARY' : 'ABSENT'
    if (normalized === 'INSIDE' || normalized === 'IN' || normalized === 'ENTERED') return 'INSIDE'
    if (normalized === 'OUTSIDE_TEMPORARY' || normalized === 'TEMPORARY_OUT') return 'OUTSIDE_TEMPORARY'
    throw new BadRequestError('Estado de presencia no válido')
  }

  private trueClaim(payload: Record<string, unknown>, ...keys: string[]): boolean {
    return keys.some((key) => payload[key] === true || payload[key] === 1 || payload[key] === 'true')
  }

  private isDependencyFailure(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
    return ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'deadline-exceeded', 'unavailable', 'internal', 'permission-denied'].includes(code)
  }
}

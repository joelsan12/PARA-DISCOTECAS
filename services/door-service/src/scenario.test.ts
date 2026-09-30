import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { loadConfig } from './config.js'
import { normalizeSession, normalizeStoredEvent, normalizeStoredSequence, normalizeTicket } from './data/normalize.js'
import { AttendanceSignatureService } from './services/attendance-signature-service.js'
import { AttendanceService } from './services/attendance-service.js'
import { EmergencyService } from './services/emergency-service.js'
import { KeyService } from './services/key-service.js'
import { TicketService } from './services/ticket-service.js'
import type {
  AttendanceCommitInput,
  AttendanceCommitResult,
  AttendanceSessionSnapshot,
  CustomerRecord,
  DeviceKeyRecord,
  DoorRepository,
  EventRecord,
  RevocationRecord,
  StaffRecord,
  StoredAttendanceEvent,
  StoredAttendanceSequence,
  TicketRecord
} from './types.js'

const HMAC_SECRET = 'scenario-attendance-secret'
const BUSINESS_ID = 'club_scenario_02am'
const EVENT_ID = 'evt_scenario_vip'
const VENUE_ID = 'venue_main'
const TICKET_ID = 'tkt_scenario_01'

const canonical = (value: unknown): string => {
  if (value === undefined) return 'null'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
}

const signEvent = (fields: Record<string, unknown>): Record<string, unknown> => {
  const signature = createHmac('sha256', HMAC_SECRET).update(canonical(fields), 'utf8').digest('hex')
  return { ...fields, signature }
}

const conflictResult = (
  input: AttendanceCommitInput,
  session: AttendanceSessionSnapshot,
  reason: string
): AttendanceCommitResult => {
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

const resultFromStored = (event: StoredAttendanceEvent, duplicate: boolean): AttendanceCommitResult => ({
  status: event.status === 'CONFLICT' ? 'CONFLICT' : 'ACCEPTED',
  duplicate,
  stateBefore: event.stateBefore,
  stateAfter: event.stateAfter,
  reentryCount: event.reentryCount ?? 0,
  reentryExpiresAt: event.reentryExpiresAt,
  reason: event.reason,
  event
})

class MemoryDoorRepository implements DoorRepository {
  readonly tickets = new Map<string, TicketRecord>()
  readonly events = new Map<string, EventRecord>()
  readonly revocationRecords: RevocationRecord[] = []
  readonly deviceKeyRecords = new Map<string, DeviceKeyRecord>()
  readonly staffRecords = new Map<string, StaffRecord>()
  readonly customerRecords = new Map<string, CustomerRecord>()
  readonly holdRecords = new Map<string, { businessId: string; state: string; data: Record<string, unknown> }>()
  readonly sessions = new Map<string, AttendanceSessionSnapshot>()
  readonly attendanceEvents = new Map<string, StoredAttendanceEvent>()
  readonly sequences = new Map<string, StoredAttendanceSequence>()
  readonly incidents: Array<Record<string, unknown>> = []

  async getStaff(businessId: string, uid: string): Promise<StaffRecord | null> {
    return this.staffRecords.get(`${businessId}:${uid}`) ?? null
  }

  async getCustomer(businessId: string, uid: string): Promise<CustomerRecord | null> {
    return this.customerRecords.get(`${businessId}:${uid}`) ?? null
  }

  async getTicket(businessId: string, ticketId: string): Promise<TicketRecord | null> {
    const direct = this.tickets.get(`${businessId}:${ticketId}`)
    if (direct) return direct
    const hold = this.holdRecords.get(ticketId)
    if (hold && hold.businessId === businessId && hold.state === 'CONFIRMED') {
      return normalizeTicket(businessId, ticketId, { ...hold.data, status: 'CONFIRMED' })
    }
    return null
  }

  async getEvent(businessId: string, eventId: string): Promise<EventRecord | null> {
    return this.events.get(`${businessId}:${eventId}`) ?? null
  }

  async getRevocations(businessId: string, eventId?: string, deviceId?: string): Promise<RevocationRecord[]> {
    return this.revocationRecords.filter((record) => {
      if (record.businessId !== businessId) return false
      if (record.scope === 'EVENT' && eventId && record.eventId && record.eventId !== eventId) return false
      if (record.scope === 'DEVICE' && deviceId && record.deviceId && record.deviceId !== deviceId) return false
      return true
    })
  }

  async getDeviceKey(businessId: string, kid: string): Promise<DeviceKeyRecord | null> {
    return this.deviceKeyRecords.get(`${businessId}:${kid}`) ?? null
  }

  async putDeviceKey(record: DeviceKeyRecord): Promise<void> {
    this.deviceKeyRecords.set(`${record.businessId}:${record.kid}`, record)
  }

  async commitAttendance(input: AttendanceCommitInput): Promise<AttendanceCommitResult> {
    const eventReferenceKey = input.jti
    const sequenceKey = `${input.deviceId}:${input.deviceSequence}`
    const existingEvent = this.attendanceEvents.get(eventReferenceKey) ?? null
    const existingSequence = this.sequences.get(sequenceKey) ?? null
    const session = this.sessions.get(input.ticketId) ?? normalizeSession(undefined)
    const decision = input.decide(session, existingEvent, existingSequence)

    if (existingEvent && existingEvent.jti === input.jti && existingEvent.payloadHash === input.payloadHash) {
      return resultFromStored(existingEvent, true)
    }

    if (existingEvent && existingEvent.jti === input.jti && existingEvent.payloadHash !== input.payloadHash) {
      const conflict = conflictResult(input, session, 'JTI_PAYLOAD_MISMATCH')
      this.recordIncident(input, existingEvent.jti, conflict.reason ?? 'JTI_PAYLOAD_MISMATCH')
      return conflict
    }

    if (existingSequence && (existingSequence.jti !== input.jti || existingSequence.payloadHash !== input.payloadHash)) {
      const conflict = conflictResult(input, session, 'DEVICE_SEQUENCE_COLLISION')
      this.recordIncident(input, existingSequence.jti, conflict.reason ?? 'DEVICE_SEQUENCE_COLLISION')
      this.attendanceEvents.set(eventReferenceKey, conflict.event)
      return conflict
    }

    const stored: StoredAttendanceEvent = {
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

    if (decision.status === 'CONFLICT') {
      if (decision.reason === 'ALREADY_INSIDE' || decision.reason === 'OUT_OF_ORDER' || decision.reason === 'DEVICE_SEQUENCE_COLLISION' || decision.reason === 'JTI_PAYLOAD_MISMATCH') {
        this.recordIncident(input, input.jti, decision.reason)
      }
      this.attendanceEvents.set(eventReferenceKey, stored)
      if (!existingSequence) {
        this.sequences.set(sequenceKey, {
          deviceId: input.deviceId,
          deviceSequence: input.deviceSequence,
          jti: input.jti,
          payloadHash: input.payloadHash
        })
      }
      return {
        status: 'CONFLICT',
        duplicate: false,
        stateBefore: decision.stateBefore,
        stateAfter: decision.stateAfter,
        reentryCount: decision.reentryCount,
        reentryExpiresAt: decision.reentryExpiresAt,
        reason: decision.reason ?? 'CONFLICT',
        event: stored
      }
    }

    this.attendanceEvents.set(eventReferenceKey, stored)
    this.sequences.set(sequenceKey, {
      deviceId: input.deviceId,
      deviceSequence: input.deviceSequence,
      jti: input.jti,
      payloadHash: input.payloadHash
    })
    const nextSession: AttendanceSessionSnapshot = {
      state: decision.stateAfter,
      lastDeviceSequence: decision.lastDeviceSequence,
      reentryCount: decision.reentryCount,
      reentryExpiresAt: decision.reentryExpiresAt
    }
    this.sessions.set(input.ticketId, nextSession)
    return {
      status: 'ACCEPTED',
      duplicate: false,
      stateBefore: decision.stateBefore,
      stateAfter: decision.stateAfter,
      reentryCount: decision.reentryCount,
      reentryExpiresAt: decision.reentryExpiresAt,
      event: stored
    }
  }

  private recordIncident(input: AttendanceCommitInput, conflictingJti: string, reason: string): void {
    this.incidents.push({
      businessId: input.businessId,
      eventId: input.eventId,
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
      deviceSequence: input.deviceSequence
    })
  }
}

const seedWorld = (repo: MemoryDoorRepository, overrides: {
  ticket?: Partial<TicketRecord>
  event?: Partial<EventRecord>
} = {}): void => {
  repo.tickets.set(`${BUSINESS_ID}:${TICKET_ID}`, {
    businessId: BUSINESS_ID,
    ticketId: TICKET_ID,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    revoked: false,
    eventCanceled: false,
    revocationVersion: 0,
    raw: {},
    ...overrides.ticket
  })
  repo.events.set(`${BUSINESS_ID}:${EVENT_ID}`, {
    businessId: BUSINESS_ID,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    canceled: false,
    revocationVersion: 0,
    raw: {},
    ...overrides.event
  })
}

const createService = (repo: MemoryDoorRepository): AttendanceService => {
  const config = loadConfig({ ATTENDANCE_HMAC_SECRET: HMAC_SECRET })
  const keys = new KeyService({}, config)
  const signatures = new AttendanceSignatureService(keys, config, repo)
  const emergency = new EmergencyService(repo)
  return new AttendanceService(repo, signatures, emergency, config)
}

const baseFields = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  businessId: BUSINESS_ID,
  eventId: EVENT_ID,
  venueId: VENUE_ID,
  ticketId: TICKET_ID,
  occurredAt: Date.now(),
  revocationVersion: 0,
  ...overrides
})

test('Test #1a: QR con ventana expirada (45s) es rechazado', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)
  const expiredSeconds = Math.floor(Date.now() / 1000) - 120
  const event = signEvent(baseFields({
    jti: 'jti_expired_qr',
    deviceId: 'door-1',
    deviceSequence: 1,
    action: 'CHECK_IN',
    exp: expiredSeconds
  }))
  await assert.rejects(
    () => service.sync(BUSINESS_ID, [event]),
    (error: unknown) => error instanceof Error && /expiró/i.test(error.message)
  )
})

test('Test #1b: screenshot reenviado sin token rotativo (firma inválida) es rechazado', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)
  const fields = baseFields({
    jti: 'jti_screenshot_replay',
    deviceId: 'door-1',
    deviceSequence: 2,
    action: 'CHECK_IN'
  })
  const event = signEvent(fields)
  const tampered = { ...event, signature: '00'.repeat(32) }
  const response = await service.sync(BUSINESS_ID, [tampered])
  assert.equal(response.results[0]?.status, 'REJECTED')
  assert.equal(response.results[0]?.reason, 'DEVICE_SIGNATURE_INVALID')
  assert.equal(repo.sessions.get(TICKET_ID)?.state ?? 'ABSENT', 'ABSENT')
})

test('Test #2: reingreso de persona/distinto dispositivo sin passkey original es rechazado', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo, { ticket: { deviceId: 'door-original' } })
  const service = createService(repo)

  const checkIn = signEvent(baseFields({
    jti: 'jti_checkin_orig',
    deviceId: 'door-original',
    deviceSequence: 1,
    action: 'CHECK_IN'
  }))
  const first = await service.sync(BUSINESS_ID, [checkIn])
  assert.equal(first.results[0]?.status, 'ACCEPTED')

  const exit = signEvent(baseFields({
    jti: 'jti_exit_orig',
    deviceId: 'door-original',
    deviceSequence: 2,
    action: 'EXIT'
  }))
  const afterExit = await service.sync(BUSINESS_ID, [exit])
  assert.equal(afterExit.results[0]?.status, 'ACCEPTED')
  assert.equal(afterExit.results[0]?.presence, 'OUTSIDE_TEMPORARY')

  const foreignReentry = signEvent(baseFields({
    jti: 'jti_reentry_attacker',
    deviceId: 'door-attacker',
    deviceSequence: 1,
    action: 'REENTRY'
  }))
  const rejected = await service.sync(BUSINESS_ID, [foreignReentry])
  assert.equal(rejected.results[0]?.status, 'REJECTED')
  assert.equal(rejected.results[0]?.reason, 'DEVICE_MISMATCH')
  assert.equal(repo.sessions.get(TICKET_ID)?.state, 'OUTSIDE_TEMPORARY')

  const legitReentry = signEvent(baseFields({
    jti: 'jti_reentry_original',
    deviceId: 'door-original',
    deviceSequence: 3,
    action: 'REENTRY'
  }))
  const acceptedReentry = await service.sync(BUSINESS_ID, [legitReentry])
  assert.equal(acceptedReentry.results[0]?.status, 'ACCEPTED')
  assert.equal(acceptedReentry.results[0]?.presence, 'INSIDE')

  const invalidState = signEvent(baseFields({
    jti: 'jti_reentry_invalid_state',
    deviceId: 'door-original',
    deviceSequence: 4,
    action: 'REENTRY'
  }))
  const conflict = await service.sync(BUSINESS_ID, [invalidState])
  assert.equal(conflict.results[0]?.status, 'CONFLICT')
  assert.equal(conflict.results[0]?.reason, 'INVALID_REENTRY_STATE')
})

test('Test #3: reingreso legítimo con passkey original dentro de 30 minutos', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo, { ticket: { deviceId: 'door-original' } })
  const service = createService(repo)

  const checkIn = signEvent(baseFields({
    jti: 'jti_legit_checkin',
    deviceId: 'door-original',
    deviceSequence: 10,
    action: 'CHECK_IN'
  }))
  assert.equal((await service.sync(BUSINESS_ID, [checkIn])).results[0]?.status, 'ACCEPTED')

  const exit = signEvent(baseFields({
    jti: 'jti_legit_exit',
    deviceId: 'door-original',
    deviceSequence: 11,
    action: 'EXIT'
  }))
  const exitResponse = await service.sync(BUSINESS_ID, [exit])
  assert.equal(exitResponse.results[0]?.status, 'ACCEPTED')
  assert.equal(exitResponse.results[0]?.presence, 'OUTSIDE_TEMPORARY')
  assert.ok(exitResponse.results[0]?.reentryExpiresAt)

  const reentry = signEvent(baseFields({
    jti: 'jti_legit_reentry',
    deviceId: 'door-original',
    deviceSequence: 12,
    action: 'REENTRY'
  }))
  const reentryResponse = await service.sync(BUSINESS_ID, [reentry])
  assert.equal(reentryResponse.results[0]?.status, 'ACCEPTED')
  assert.equal(reentryResponse.results[0]?.presence, 'INSIDE')
  assert.equal(reentryResponse.results[0]?.reentryCount, 1)
  assert.equal(repo.incidents.length, 0)
})

test('Test #4: dos porteros offline — provisional, colisión por jti al reconectar, sin sanción automática', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)

  const offlineA = signEvent(baseFields({
    jti: 'jti_offline_door_a',
    deviceId: 'door-a',
    deviceSequence: 1,
    action: 'CHECK_IN'
  }))
  const offlineB = signEvent(baseFields({
    jti: 'jti_offline_door_b',
    deviceId: 'door-b',
    deviceSequence: 1,
    action: 'CHECK_IN'
  }))

  const first = await service.sync(BUSINESS_ID, [offlineA])
  assert.equal(first.results[0]?.status, 'ACCEPTED')
  assert.equal(first.results[0]?.presence, 'INSIDE')

  const second = await service.sync(BUSINESS_ID, [offlineB])
  assert.equal(second.results[0]?.status, 'CONFLICT')
  assert.equal(second.results[0]?.reason, 'ALREADY_INSIDE')
  assert.equal(second.results[0]?.sanction, 'NONE')
  assert.equal(second.conflicts, 1)

  assert.equal(repo.incidents.length, 1)
  const incident = repo.incidents[0]
  assert.equal(incident?.status, 'OPEN')
  assert.equal(incident?.sanction, 'NONE')
  assert.equal(incident?.automaticPenalty, false)
  assert.equal(incident?.requiresManualReview, true)
  assert.equal(incident?.incomingJti, 'jti_offline_door_b')
  assert.equal(incident?.conflictingJti, 'jti_offline_door_b')
  assert.equal(repo.sessions.get(TICKET_ID)?.state, 'INSIDE')
})

test('Test #6: sincronización duplicada por pérdida de ACK es idempotente por jti', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)
  const event = signEvent(baseFields({
    jti: 'jti_lost_ack',
    deviceId: 'door-1',
    deviceSequence: 20,
    action: 'CHECK_IN'
  }))

  const first = await service.sync(BUSINESS_ID, [event])
  assert.equal(first.results[0]?.status, 'ACCEPTED')
  assert.equal(first.results[0]?.idempotent, false)

  const retry = await service.sync(BUSINESS_ID, [event])
  assert.equal(retry.results[0]?.status, 'ACCEPTED')
  assert.equal(retry.results[0]?.idempotent, true)
  assert.equal(retry.accepted, 1)
  assert.equal(repo.sessions.get(TICKET_ID)?.reentryCount, 0)
  assert.equal(repo.incidents.length, 0)
  assert.equal([...repo.attendanceEvents.values()].filter((item) => item.jti === 'jti_lost_ack').length, 1)
})

test('Test #9: botón de pánico / robo de terminal — revocación bloquea escaneos posteriores', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)

  const beforePanic = signEvent(baseFields({
    jti: 'jti_before_panic',
    deviceId: 'door-stolen',
    deviceSequence: 1,
    action: 'CHECK_IN'
  }))
  assert.equal((await service.sync(BUSINESS_ID, [beforePanic])).results[0]?.status, 'ACCEPTED')

  repo.revocationRecords.push({
    id: 'rev_panic_device',
    businessId: BUSINESS_ID,
    scope: 'DEVICE',
    eventId: EVENT_ID,
    deviceId: 'door-stolen',
    eventCanceled: false,
    revocationVersion: 5,
    raw: { reason: 'panic_button', createdAt: new Date().toISOString() }
  })

  const afterPanic = signEvent(baseFields({
    jti: 'jti_after_panic',
    deviceId: 'door-stolen',
    deviceSequence: 2,
    action: 'CHECK_IN',
    revocationVersion: 0
  }))
  const rejected = await service.sync(BUSINESS_ID, [afterPanic])
  assert.equal(rejected.results[0]?.status, 'REJECTED')
  assert.equal(rejected.results[0]?.reason, 'TOKEN_REVOKED')
  assert.equal(rejected.results[0]?.sanction, 'NONE')

  const newTicket = 'tkt_after_panic_other'
  repo.tickets.set(`${BUSINESS_ID}:${newTicket}`, {
    businessId: BUSINESS_ID,
    ticketId: newTicket,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    revoked: false,
    eventCanceled: false,
    revocationVersion: 0,
    raw: {}
  })
  const otherDoor = signEvent(baseFields({
    ticketId: newTicket,
    jti: 'jti_other_door_after_panic',
    deviceId: 'door-healthy',
    deviceSequence: 1,
    action: 'CHECK_IN'
  }))
  const healthy = await service.sync(BUSINESS_ID, [otherDoor])
  assert.equal(healthy.results[0]?.status, 'ACCEPTED', 'el pánico solo debe bloquear la terminal comprometida')
})

test('Test #10: evento cancelado durante offline + bump de revocación se rechaza al reconectar', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)

  const offlineQueued = signEvent(baseFields({
    jti: 'jti_offline_cancel',
    deviceId: 'door-1',
    deviceSequence: 30,
    action: 'CHECK_IN'
  }))

  const eventRecord = repo.events.get(`${BUSINESS_ID}:${EVENT_ID}`)
  assert.ok(eventRecord)
  eventRecord.canceled = true

  const canceled = await service.sync(BUSINESS_ID, [offlineQueued])
  assert.equal(canceled.results[0]?.status, 'REJECTED')
  assert.equal(canceled.results[0]?.reason, 'EVENT_CANCELED')

  const repo2 = new MemoryDoorRepository()
  seedWorld(repo2)
  const service2 = createService(repo2)
  const ticket = repo2.tickets.get(`${BUSINESS_ID}:${TICKET_ID}`)
  assert.ok(ticket)
  ticket.revocationVersion = 3

  const staleToken = signEvent(baseFields({
    jti: 'jti_stale_revocation_version',
    deviceId: 'door-2',
    deviceSequence: 1,
    action: 'CHECK_IN',
    revocationVersion: 0
  }))
  const revoked = await service2.sync(BUSINESS_ID, [staleToken])
  assert.equal(revoked.results[0]?.status, 'REJECTED')
  assert.equal(revoked.results[0]?.reason, 'TOKEN_REVOKED')
})

test('escenario base: check-in normal acepta y registra presencia', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)
  const event = signEvent(baseFields({
    jti: 'jti_baseline',
    deviceId: 'door-1',
    deviceSequence: 100,
    action: 'CHECK_IN'
  }))
  const response = await service.sync(BUSINESS_ID, [event])
  assert.equal(response.accepted, 1)
  assert.equal(repo.sessions.get(TICKET_ID)?.state, 'INSIDE')
  assert.equal(normalizeStoredEvent(repo.attendanceEvents.get('jti_baseline')).status, 'ACCEPTED')
  assert.equal(normalizeStoredSequence(repo.sequences.get('door-1:100') ?? undefined).jti, 'jti_baseline')
})

test('getTicket resuelve holds CONFIRMED y rechaza HELD o negocios ajenos (hueco B)', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)

  repo.holdRecords.set('hold_confirmed_vip', {
    businessId: BUSINESS_ID,
    state: 'CONFIRMED',
    data: {
      eventId: EVENT_ID,
      venueId: VENUE_ID,
      customerUid: 'cust_vip',
      resourceId: 'tbl_01',
      amount: 150
    }
  })
  repo.holdRecords.set('hold_pending_held', {
    businessId: BUSINESS_ID,
    state: 'HELD',
    data: { eventId: EVENT_ID, customerUid: 'cust_held' }
  })
  repo.holdRecords.set('hold_other_club', {
    businessId: 'other_club',
    state: 'CONFIRMED',
    data: { eventId: EVENT_ID, customerUid: 'cust_other' }
  })

  const confirmedTicket = await repo.getTicket(BUSINESS_ID, 'hold_confirmed_vip')
  assert.ok(confirmedTicket)
  assert.equal(confirmedTicket.ticketId, 'hold_confirmed_vip')
  assert.equal(confirmedTicket.customerUid, 'cust_vip')
  assert.equal(confirmedTicket.status, 'CONFIRMED')
  assert.equal(confirmedTicket.revoked, false)

  const heldTicket = await repo.getTicket(BUSINESS_ID, 'hold_pending_held')
  assert.equal(heldTicket, null, 'Un hold HELD nunca debe dar entrada')

  const otherTicket = await repo.getTicket(BUSINESS_ID, 'hold_other_club')
  assert.equal(otherTicket, null, 'Un hold de otro club debe ser rechazado')
})

test('check-in exitoso con ticketId correspondiente a un hold CONFIRMED (hueco B)', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  const service = createService(repo)

  repo.holdRecords.set('hold_checkin_01', {
    businessId: BUSINESS_ID,
    state: 'CONFIRMED',
    data: {
      eventId: EVENT_ID,
      venueId: VENUE_ID,
      customerUid: 'cust_checkin_01',
      resourceId: 'tbl_02'
    }
  })

  const event = signEvent(baseFields({
    ticketId: 'hold_checkin_01',
    jti: 'jti_hold_checkin_01',
    deviceId: 'door-1',
    deviceSequence: 101,
    action: 'CHECK_IN'
  }))

  const response = await service.sync(BUSINESS_ID, [event])
  assert.equal(response.accepted, 1)
  assert.equal(response.results[0]?.status, 'ACCEPTED')
  assert.equal(repo.sessions.get('hold_checkin_01')?.state, 'INSIDE')
})

test('TicketService.rotate autoriza al titular cliente y rechaza a cliente ajeno (hueco A)', async () => {
  const repo = new MemoryDoorRepository()
  seedWorld(repo)
  repo.tickets.set(`${BUSINESS_ID}:tkt_cust_vip`, {
    businessId: BUSINESS_ID,
    ticketId: 'tkt_cust_vip',
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    customerUid: 'cust_legit_01',
    revoked: false,
    eventCanceled: false,
    revocationVersion: 0,
    raw: {}
  })

  const testConfig = loadConfig({
    DOOR_KEY_ID: 'door-test-key',
    DOOR_PRIVATE_KEY_BASE64: 'MC4CAQAwBQYDK2VwBCIEIHrcrp269fz13XwffpVNDYEhOYXAE09RBPZsgLwS03wd',
    DOOR_PUBLIC_KEY: 'MCowBQYDK2VwAyEAI99TCPATDIAvjx/x6fAz+i6ZCIZytEPJQOFkrEfMcJg='
  })
  const keys = new KeyService({
    DOOR_KEY_ID: 'door-test-key',
    DOOR_PRIVATE_KEY_BASE64: 'MC4CAQAwBQYDK2VwBCIEIHrcrp269fz13XwffpVNDYEhOYXAE09RBPZsgLwS03wd',
    DOOR_PUBLIC_KEY: 'MCowBQYDK2VwAyEAI99TCPATDIAvjx/x6fAz+i6ZCIZytEPJQOFkrEfMcJg='
  }, testConfig)
  const emergency = new EmergencyService(repo)
  const ticketService = new TicketService(repo, keys, emergency, testConfig)

  // 1. Cliente legítimo titular rota pase -> OK
  const result = await ticketService.rotate(BUSINESS_ID, {
    ticketId: 'tkt_cust_vip',
    deviceId: 'dev_cust_phone_1'
  }, { uid: 'cust_legit_01', role: 'customer' })
  assert.ok(result.token)
  assert.equal(result.claims.ticketId, 'tkt_cust_vip')

  // 2. Cliente distinto intenta rotar pase ajeno -> 403 CUSTOMER_MISMATCH
  await assert.rejects(async () => {
    await ticketService.rotate(BUSINESS_ID, {
      ticketId: 'tkt_cust_vip',
      deviceId: 'dev_cust_phone_2'
    }, { uid: 'cust_impostor_02', role: 'customer' })
  }, (err: any) => {
    assert.equal(err.statusCode, 403)
    assert.equal(err.code, 'CUSTOMER_MISMATCH')
    return true
  })

  // 3. Staff rota pase del cliente -> OK
  const staffResult = await ticketService.rotate(BUSINESS_ID, {
    ticketId: 'tkt_cust_vip',
    deviceId: 'dev_cust_phone_1'
  }, { uid: 'staff_door_01', role: 'staff' })
  assert.ok(staffResult.token)
})

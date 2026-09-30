import { booleanValue, dateMillis, integerValue, isRecord, numberValue, optionalString } from '../utils/values.js'
import type {
  AttendanceSessionSnapshot,
  CustomerRecord,
  EventRecord,
  PresenceState,
  RevocationRecord,
  StaffRecord,
  StoredAttendanceEvent,
  StoredAttendanceSequence,
  TicketRecord
} from '../types.js'

const firstDefined = (...values: unknown[]): unknown => values.find((value) => value !== undefined)

const record = (value: unknown): Record<string, unknown> => isRecord(value) ? value : {}

const stringValue = (source: Record<string, unknown>, ...keys: string[]): string | undefined => {
  return optionalString(firstDefined(...keys.map((key) => source[key])))
}

const numberValueOr = (source: Record<string, unknown>, fallback: number, ...keys: string[]): number => {
  return integerValue(firstDefined(...keys.map((key) => source[key]))) ?? numberValue(firstDefined(...keys.map((key) => source[key]))) ?? fallback
}

const booleanOr = (source: Record<string, unknown>, fallback: boolean, ...keys: string[]): boolean => {
  return booleanValue(firstDefined(...keys.map((key) => source[key]))) ?? fallback
}

const revokedStatus = (value: string | undefined): boolean => {
  if (!value) return false
  return ['REVOKED', 'CANCELLED', 'CANCELED', 'VOID', 'INVALID', 'BLOCKED'].includes(value.toUpperCase())
}

const canceledStatus = (value: string | undefined): boolean => {
  if (!value) return false
  return ['CANCELED', 'CANCELLED', 'REVOKED', 'CLOSED'].includes(value.toUpperCase())
}

export const normalizeStaff = (businessId: string, uid: string, value: unknown): StaffRecord => {
  const raw = record(value)
  const status = stringValue(raw, 'status', 'state')
  const activeFlag = booleanValue(firstDefined(raw.active, raw.enabled, raw.isActive))
  const disabled = booleanValue(firstDefined(raw.disabled, raw.isDisabled)) ?? false
  const active = activeFlag ?? (status ? status.toUpperCase() === 'ACTIVE' : true)
  return {
    businessId,
    uid,
    role: stringValue(raw, 'role', 'staffRole'),
    status,
    active: active && !disabled,
    raw
  }
}

export const normalizeCustomer = (businessId: string, uid: string, value: unknown): CustomerRecord => {
  const raw = record(value)
  const status = stringValue(raw, 'status', 'state')
  const activeFlag = booleanValue(firstDefined(raw.active, raw.enabled, raw.isActive))
  const disabled = booleanValue(firstDefined(raw.disabled, raw.isDisabled)) ?? false
  const active = activeFlag ?? (status ? status.toUpperCase() === 'ACTIVE' : true)
  return {
    businessId,
    uid,
    status,
    active: active && !disabled,
    raw
  }
}

export const normalizeTicket = (businessId: string, ticketId: string, value: unknown): TicketRecord => {
  const raw = record(value)
  const status = stringValue(raw, 'status', 'state')
  const revokedFlag = booleanValue(firstDefined(raw.revoked, raw.isRevoked, raw.invalid))
  return {
    businessId,
    ticketId,
    eventId: stringValue(raw, 'eventId', 'event_id'),
    venueId: stringValue(raw, 'venueId', 'venue_id'),
    customerUid: stringValue(raw, 'customerUid', 'customer_uid', 'uid', 'userId', 'user_id'),
    deviceId: stringValue(raw, 'deviceId', 'device_id'),
    status,
    revoked: revokedFlag ?? revokedStatus(status),
    eventCanceled: booleanOr(raw, false, 'eventCanceled', 'event_canceled', 'canceled', 'cancelled', 'revoked', 'isRevoked') || canceledStatus(status),
    revocationVersion: numberValueOr(raw, 0, 'revocationVersion', 'revocation_version'),
    raw
  }
}

export const normalizeEvent = (businessId: string, eventId: string, value: unknown): EventRecord => {
  const raw = record(value)
  const status = stringValue(raw, 'status', 'state')
  return {
    businessId,
    eventId,
    venueId: stringValue(raw, 'venueId', 'venue_id'),
    canceled: booleanOr(raw, false, 'eventCanceled', 'event_canceled', 'canceled', 'cancelled', 'isCanceled', 'isCancelled', 'revoked', 'isRevoked') || canceledStatus(status),
    revocationVersion: numberValueOr(raw, 0, 'revocationVersion', 'revocation_version'),
    raw
  }
}

const normalizeScope = (value: unknown, eventId: string | undefined, deviceId: string | undefined): RevocationRecord['scope'] => {
  const scope = optionalString(value)?.toUpperCase()
  if (scope === 'DEVICE' || scope === 'EVENT' || scope === 'BUSINESS') return scope
  if (deviceId && eventId) return 'DEVICE'
  if (eventId) return 'EVENT'
  return 'BUSINESS'
}

export const normalizeRevocation = (businessId: string, id: string, value: unknown): RevocationRecord => {
  const raw = record(value)
  const eventId = stringValue(raw, 'eventId', 'event_id')
  const deviceId = stringValue(raw, 'deviceId', 'device_id')
  const status = stringValue(raw, 'status', 'state')
  return {
    id,
    businessId,
    scope: normalizeScope(stringValue(raw, 'scope'), eventId, deviceId),
    eventId,
    deviceId,
    revokedBefore: dateMillis(firstDefined(raw.revokedBefore, raw.revoked_before, raw.revokedBeforeAt, raw.revoked_before_at)),
    eventCanceled: booleanOr(raw, false, 'eventCanceled', 'event_canceled', 'canceled', 'cancelled', 'revoked', 'isRevoked') || canceledStatus(status),
    revocationVersion: numberValueOr(raw, 0, 'revocationVersion', 'revocation_version', 'version', 'emergencyRevocationVersion'),
    raw
  }
}

export const normalizeSession = (value: unknown): AttendanceSessionSnapshot => {
  const raw = record(value)
  const stateValue = stringValue(raw, 'state', 'presence', 'presenceState', 'presence_state')?.toUpperCase()
  const state: PresenceState = stateValue === 'INSIDE' || stateValue === 'OUTSIDE_TEMPORARY' ? stateValue : 'ABSENT'
  return {
    state,
    lastDeviceSequence: numberValueOr(raw, 0, 'lastDeviceSequence', 'last_device_sequence', 'deviceSequence', 'device_sequence'),
    reentryCount: numberValueOr(raw, 0, 'reentryCount', 'reentry_count'),
    reentryExpiresAt: dateMillis(firstDefined(raw.reentryExpiresAt, raw.reentry_expires_at)),
    updatedAt: dateMillis(firstDefined(raw.updatedAt, raw.updated_at, raw.lastUpdatedAt, raw.last_updated_at))
  }
}

export const normalizeStoredEvent = (value: unknown): StoredAttendanceEvent => {
  const raw = record(value)
  const statusValue = stringValue(raw, 'status')?.toUpperCase()
  const status: StoredAttendanceEvent['status'] = statusValue === 'CONFLICT' || statusValue === 'REJECTED' || statusValue === 'PENDING' ? statusValue : 'ACCEPTED'
  const stateBefore = stringValue(raw, 'stateBefore', 'state_before')?.toUpperCase()
  const stateAfter = stringValue(raw, 'stateAfter', 'state_after')?.toUpperCase()
  return {
    jti: stringValue(raw, 'jti', 'id') ?? '',
    deviceId: stringValue(raw, 'deviceId', 'device_id') ?? '',
    deviceSequence: numberValueOr(raw, 0, 'deviceSequence', 'device_sequence'),
    payloadHash: stringValue(raw, 'payloadHash', 'payload_hash') ?? '',
    status,
    stateBefore: stateBefore === 'INSIDE' || stateBefore === 'OUTSIDE_TEMPORARY' ? stateBefore : 'ABSENT',
    stateAfter: stateAfter === 'INSIDE' || stateAfter === 'OUTSIDE_TEMPORARY' ? stateAfter : 'ABSENT',
    reason: stringValue(raw, 'reason', 'conflictReason', 'conflict_reason'),
    action: stringValue(raw, 'action') as StoredAttendanceEvent['action'],
    signature: stringValue(raw, 'signature'),
    reentryCount: numberValueOr(raw, 0, 'reentryCount', 'reentry_count'),
    reentryExpiresAt: dateMillis(firstDefined(raw.reentryExpiresAt, raw.reentry_expires_at)),
    occurredAt: dateMillis(firstDefined(raw.occurredAt, raw.occurred_at)) ?? Date.now(),
    syncedAt: dateMillis(firstDefined(raw.syncedAt, raw.synced_at)),
    raw
  }
}

export const normalizeStoredSequence = (value: unknown): StoredAttendanceSequence => {
  const raw = record(value)
  return {
    deviceId: stringValue(raw, 'deviceId', 'device_id') ?? '',
    deviceSequence: numberValueOr(raw, 0, 'deviceSequence', 'device_sequence'),
    jti: stringValue(raw, 'jti', 'eventId') ?? '',
    payloadHash: stringValue(raw, 'payloadHash', 'payload_hash') ?? ''
  }
}

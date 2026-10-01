export type PresenceState = 'ABSENT' | 'INSIDE' | 'OUTSIDE_TEMPORARY'
export type AttendanceAction = 'CHECK_IN' | 'EXIT' | 'REENTRY' | 'MANUAL_OVERRIDE'
export type AttendanceEventStatus = 'PENDING' | 'ACCEPTED' | 'CONFLICT' | 'REJECTED'
export type EmergencyScope = 'DEVICE' | 'EVENT' | 'BUSINESS'
export type TokenRevocationState = 'ACTIVE' | 'REVOKED'

export interface AuthenticatedUser {
  uid: string
  claims: Record<string, unknown>
}

export interface StaffRecord {
  businessId: string
  uid: string
  role?: string
  status?: string
  active: boolean
  raw: Record<string, unknown>
}

export interface CustomerRecord {
  businessId: string
  uid: string
  status?: string
  active: boolean
  raw: Record<string, unknown>
}

export interface TicketRecord {
  businessId: string
  ticketId: string
  eventId?: string
  venueId?: string
  customerUid?: string
  deviceId?: string
  status?: string
  revoked: boolean
  eventCanceled: boolean
  revocationVersion: number
  raw: Record<string, unknown>
}

export interface EventRecord {
  businessId: string
  eventId: string
  venueId?: string
  canceled: boolean
  revocationVersion: number
  raw: Record<string, unknown>
}

export interface RevocationRecord {
  id: string
  businessId: string
  scope: EmergencyScope
  eventId?: string
  deviceId?: string
  revokedBefore?: number
  eventCanceled: boolean
  revocationVersion: number
  raw: Record<string, unknown>
}

export interface EmergencyStatus {
  businessId: string
  eventId?: string
  deviceId?: string
  active: boolean
  eventCanceled: boolean
  revocationVersion: number
  revokedBefore?: number
  reason?: string
  actorUid?: string
  createdAt?: string
  records: RevocationRecord[]
}

export interface AttendanceSessionSnapshot {
  state: PresenceState
  lastDeviceSequence: number
  reentryCount: number
  reentryExpiresAt?: number
  updatedAt?: number
}

export interface StoredAttendanceEvent {
  jti: string
  deviceId: string
  deviceSequence: number
  payloadHash: string
  status: AttendanceEventStatus
  stateBefore: PresenceState
  stateAfter: PresenceState
  reason?: string
  action?: AttendanceAction
  signature?: string
  reentryCount?: number
  reentryExpiresAt?: number
  occurredAt: number
  syncedAt?: number
  raw?: Record<string, unknown>
}

export interface StoredAttendanceSequence {
  deviceId: string
  deviceSequence: number
  jti: string
  payloadHash: string
}

export interface AttendanceCommitInput {
  businessId: string
  eventId: string
  venueId: string
  ticketId: string
  deviceId: string
  jti: string
  deviceSequence: number
  occurredAt: number
  payloadHash: string
  action: AttendanceAction
  signature: string
  decide: (
    session: AttendanceSessionSnapshot,
    event: StoredAttendanceEvent | null,
    sequence: StoredAttendanceSequence | null
  ) => AttendanceDecision
}

export interface AttendanceDecision {
  status: 'ACCEPTED' | 'CONFLICT'
  stateBefore: PresenceState
  stateAfter: PresenceState
  lastDeviceSequence: number
  reentryCount: number
  reentryExpiresAt?: number
  reason?: string
}

export interface AttendanceCommitResult {
  status: 'ACCEPTED' | 'CONFLICT'
  duplicate: boolean
  stateBefore: PresenceState
  stateAfter: PresenceState
  reentryCount: number
  reentryExpiresAt?: number
  reason?: string
  event: StoredAttendanceEvent
}

export interface DeviceKeyRecord {
  businessId: string
  kid: string
  deviceId: string
  publicKey: Record<string, unknown>
  enrolledAt?: number
  active?: boolean
}

export interface DoorRepository {
  getStaff(businessId: string, uid: string): Promise<StaffRecord | null>
  getCustomer(businessId: string, uid: string): Promise<CustomerRecord | null>
  getTicket(businessId: string, ticketId: string): Promise<TicketRecord | null>
  getEvent(businessId: string, eventId: string): Promise<EventRecord | null>
  getRevocations(businessId: string, eventId?: string, deviceId?: string): Promise<RevocationRecord[]>
  getDeviceKey(businessId: string, kid: string): Promise<DeviceKeyRecord | null>
  putDeviceKey(record: DeviceKeyRecord): Promise<void>
  commitAttendance(input: AttendanceCommitInput): Promise<AttendanceCommitResult>
  commitAttendanceBatch?(inputs: AttendanceCommitInput[]): Promise<AttendanceCommitResult[]>
}

export interface AttendanceEventRequest {
  jti?: string
  deviceId?: string
  deviceSequence?: number
  businessId?: string
  eventId?: string
  venueId?: string
  ticketId?: string
  action?: string
  presence?: string
  state?: string
  occurredAt?: string | number
  kid?: string
  signature?: string
  signedEvent?: string
  jws?: string
  token?: string
  claims?: Record<string, unknown>
  [key: string]: unknown
}

export interface RotateTicketRequest {
  businessId?: string
  eventId?: string
  venueId?: string
  ticketId?: string
  customerUid?: string
  subject?: string
  deviceId?: string
  revocationVersion?: number
  currentToken?: string
  claims?: Record<string, unknown>
  [key: string]: unknown
}

export interface TokenClaims {
  iss: string
  aud: string
  sub: string
  jti: string
  businessId: string
  eventId: string
  venueId: string
  ticketId: string
  deviceId: string
  revocationVersion: number
  timeBucket: number
  iat: number
  nbf: number
  exp: number
}

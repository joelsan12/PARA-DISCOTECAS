import type { VenueType } from './domain';

export type BusinessDirectoryStatus = 'active' | 'trial' | 'hidden';
export type CustomerAuthMethod = 'password' | 'email_otp' | 'whatsapp_otp' | 'sms_otp';
export type BusinessStaffRole = 'owner' | 'manager' | 'door' | 'finance';
export type ReentryMode = 'digital_passkey' | 'physical_band';
export type PresenceState = 'ABSENT' | 'INSIDE' | 'OUTSIDE_TEMPORARY';
export type AttendanceAction = 'CHECK_IN' | 'EXIT' | 'REENTRY' | 'MANUAL_OVERRIDE';
export type HoldState = 'AVAILABLE' | 'HELD' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'EXPIRED';
export type PaymentState = 'PENDING' | 'PAID' | 'REFUND_REQUIRED' | 'FAILED';
export type EmergencyScope = 'DEVICE' | 'EVENT' | 'BUSINESS';

export interface BusinessDirectoryEntry {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  venueType: VenueType;
  logo: string;
  banner: string;
  primaryColor: string;
  accentColor: string;
  verified: boolean;
  status: BusinessDirectoryStatus;
  authMethods: CustomerAuthMethod[];
  reentryMode: ReentryMode;
  reentryMinutes: number;
}

export interface GlobalUserProfile {
  uid: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCustomerProfile {
  businessId: string;
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETION_PENDING';
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK';
  loyaltyPoints: number;
  marketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessStaffProfile {
  businessId: string;
  uid: string;
  role: BusinessStaffRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  deviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteBusiness {
  businessId: string;
  slug: string;
  name: string;
  city: string;
  logo: string;
}

export interface AttendanceSession {
  id: string;
  businessId: string;
  eventId: string;
  venueId: string;
  reservationId: string;
  ticketId: string;
  customerUid: string;
  state: PresenceState;
  checkedInAt?: string;
  lastExitAt?: string;
  reentryExpiresAt?: string;
  reentryCount: number;
  lastDeviceSequence: number;
  updatedAt: string;
}

export interface AttendanceEvent {
  id: string;
  businessId: string;
  eventId: string;
  ticketId: string;
  action: AttendanceAction;
  deviceId: string;
  deviceSequence: number;
  occurredAt: string;
  syncedAt?: string;
  signature: string;
  status: 'PENDING' | 'ACCEPTED' | 'CONFLICT' | 'REJECTED';
  conflictReason?: string;
}

export interface InventoryHold {
  id: string;
  businessId: string;
  eventId: string;
  resourceId: string;
  customerUid: string;
  holdToken: string;
  state: HoldState;
  paymentState: PaymentState;
  amount: number;
  currency: 'USD';
  createdAt: string;
  expiresAt: string;
  paymentReference?: string;
}

export interface EmergencyRevocation {
  businessId: string;
  scope: EmergencyScope;
  eventId?: string;
  deviceId?: string;
  revokedBefore: string;
  eventCanceled: boolean;
  revocationVersion: number;
  actorUid: string;
  reason: string;
  createdAt: string;
}

export interface TicketClaims {
  iss: 'nightflow';
  aud: 'nightflow-door';
  sub: string;
  jti: string;
  businessId: string;
  eventId: string;
  venueId: string;
  ticketId: string;
  deviceId: string;
  revocationVersion: number;
  timeBucket: number;
  iat: number;
  nbf: number;
  exp: number;
}

export interface OtpChallengeRequest {
  businessId: string;
  identifier: string;
  channel: 'email' | 'whatsapp' | 'sms';
  appCheckToken?: string;
  captchaToken?: string;
  returnPath?: string;
}

export interface OtpChallengeResponse {
  challengeId: string;
  expiresAt: string;
  retryAfterSeconds: number;
}

export interface OtpVerifyRequest {
  businessId: string;
  challengeId: string;
  code: string;
  appCheckToken?: string;
  captchaToken?: string;
}

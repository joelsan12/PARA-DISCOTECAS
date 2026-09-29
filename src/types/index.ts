export * from './domain';
export * from './saas';
import type {
  VenueType, SubscriptionPlanTier, FeatureFlag,
  BookingMode, SchedulingMode, ExperienceType,
  ReservationItem
} from './domain';

export type SubscriptionPlanId = 'basic' | 'pro' | 'enterprise';

export interface Plan {
  id: SubscriptionPlanId;
  name: string;
  monthly_price: number;
  max_events_per_month: number;
  features: string[];
  plan_tier?: SubscriptionPlanTier;
  enabled_features?: FeatureFlag[];
}

export type SubscriptionPlan = Plan;

export type ClubStatus = 'active' | 'suspended' | 'trial';

export type ClubLayoutType = 'horseshoe_vip' | 'u_amphitheater' | 'downtown_suites' | 'custom_open';

export interface Club {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  banner: string;
  address: string;
  city: string;
  instagram: string;
  whatsapp_number: string;
  plan_id: SubscriptionPlanId;
  status: ClubStatus;
  primary_color: string;
  accent_color: string;
  created_at: string;
  layout_type?: ClubLayoutType;
  // Domain extensions
  tenant_id?: string;
  venue_type?: VenueType;
  scheduling_mode?: SchedulingMode;
  enabled_features?: FeatureFlag[];
  active_floor_plan_version_id?: string;
}

export type TableZone = string;

export interface ClubTable {
  id: string;
  club_id: string;
  table_code: string; // e.g. 'VIP-01', 'D-02'
  zone: TableZone;
  capacity: number;
  x: number; // percentage in floor plan (0-100)
  y: number; // percentage in floor plan (0-100)
  width?: number;
  height?: number;
  shape: 'rect' | 'circle' | 'pill' | 'square';
  badge_number?: string;
  tier_color?: string;
  tier_name?: string;
  rotation?: number; // rotation in degrees for curved layouts
  // Domain extensions
  booking_mode?: BookingMode;
  is_active?: boolean;
}

export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  day_label: string; // e.g. "Viernes 21"
  door_time: string; // "22:00"
  cover_price: number;
  dj_guest: string;
  genre: string;
  flyer_url: string;
  is_published: boolean;
  // Domain extensions
  experience_type?: ExperienceType;
  floor_plan_version_id?: string;
}

export type TableReservationStatus = 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'EXPIRED';

export interface EventTablePricing {
  table_id: string;
  event_id: string;
  status: TableReservationStatus;
  min_spend: number;
  deposit_required: number;
  includes: string[];
  hold_expires_at?: number; // timestamp ms
  held_by_session?: string;
  active_reservation_id?: string;
}

export interface Reservation {
  id: string;
  code: string; // e.g. 'VIP-7492'
  club_id: string;
  event_id: string;
  table_id: string;
  table_code: string;
  zone: TableZone;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  guest_count: number;
  deposit_amount: number;
  min_spend: number;
  status: TableReservationStatus;
  payment_method: 'credit_card' | 'transfer' | 'cash_door';
  payment_status: 'paid' | 'pending';
  qr_token: string;
  hold_expires_at: number; // epoch ms
  checked_in_at?: string;
  created_at: string;
  // Domain extension: multi-item support (tables, seats, general tickets)
  items?: ReservationItem[];
}

export interface AuditLog {
  id: string;
  club_id?: string;
  actor: string;
  role: 'super_admin' | 'club_owner' | 'door_staff' | 'client' | 'system';
  action: string;
  details: string;
  timestamp: string;
}

export type ViewRole = 'CLIENT' | 'CLUB_ADMIN' | 'DOOR_CHECKIN' | 'SUPER_ADMIN';

export type ClientAuthProvider = 'phone_otp' | 'whatsapp' | 'apple' | 'google' | 'password' | 'email_otp' | 'sms_otp';

export type VIPTier = 'SILVER' | 'GOLD_VIP' | 'BLACK_DIAMOND';

export interface ClientUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  auth_provider: ClientAuthProvider;
  tier: VIPTier;
  created_at: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'CLUB_ADMIN' | 'DOOR_CHECKIN' | 'SUPER_ADMIN';
  club_id?: string;
  two_factor_verified: boolean;
}

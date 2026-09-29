/**
 * DOMAIN MODEL — VENUE & ENTERTAINMENT OPERATING SYSTEM
 * Core multi-tenant architecture decoupling Plan capabilities from Venue operational types.
 */

export type VenueType =
  | 'BAR'
  | 'NIGHTCLUB'
  | 'RESTAURANT'
  | 'LOUNGE'
  | 'ROOFTOP'
  | 'THEATER'
  | 'SPORTS_CLUB'
  | 'EVENT_VENUE'
  | 'OTHER';

export type SubscriptionPlanTier = 'BASIC' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

export type FeatureFlag =
  | 'RESERVATIONS'
  | 'EVENTS'
  | 'FLOOR_PLAN'
  | 'TABLE_SELECTION'
  | 'SEAT_SELECTION'
  | 'CAPACITY_POOL'
  | 'ONLINE_PAYMENT'
  | 'QR_CHECKIN'
  | 'STAFF_MANAGEMENT'
  | 'ADVANCED_ANALYTICS'
  | 'CUSTOM_DOMAIN'
  | 'MULTI_LOCATION';

export type BookingMode =
  | 'UNIT'          // Entire table, booth, or cabana reserved as 1 unit
  | 'SEAT_BY_SEAT'  // Individual numbered seats (theater, concert hall)
  | 'CAPACITY_POOL';// General admission without fixed spatial seat (covers, bar)

export type SchedulingMode =
  | 'EVENT_LOCKED'  // 1 reservation locks the resource for the entire event/night
  | 'TIME_SLOTS';   // Time slot intervals & table turnover (restaurants, lunches)

export type ExperienceType =
  | 'QUICK_FORM'        // Fast form reservation (date, time, guests, zone)
  | 'INTERACTIVE_UNIT'  // Interactive 2D map selecting VIP tables / booths
  | 'SEAT_BY_SEAT'      // Interactive seating map selecting numbered chairs
  | 'CAPACITY_POOL';    // Ticket quantity selector for general entry covers

export interface TenantBranding {
  primary_color: string;
  accent_color: string;
  logo_url: string;
  banner_url: string;
  font_family?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string;
  plan_tier: SubscriptionPlanTier;
  enabled_features: FeatureFlag[];
  status: 'active' | 'suspended' | 'trial';
  branding: TenantBranding;
  created_at: string;
}

export interface Venue {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  type: VenueType;
  scheduling_mode: SchedulingMode;
  address: string;
  city: string;
  instagram?: string;
  whatsapp_number?: string;
  branding: TenantBranding;
  active_floor_plan_version_id?: string;
  created_at: string;
}

export interface Resource {
  id: string;
  venue_id: string;
  code: string;
  label?: string;
  zone: string;
  booking_mode: BookingMode;
  capacity: number;
  x: number; // percentage in floor plan (0-100)
  y: number; // percentage in floor plan (0-100)
  width?: number;
  height?: number;
  shape: 'rect' | 'circle' | 'pill' | 'square';
  rotation?: number;
  is_active: boolean;
  badge_number?: string;
  tier_color?: string;
  tier_name?: string;
}

export interface FloorPlanVersion {
  id: string;
  venue_id: string;
  version_number: number;
  name: string;
  resources: Resource[];
  background_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface FloorPlan {
  id: string;
  venue_id: string;
  name: string;
  active_version_id: string;
  versions: FloorPlanVersion[];
}

export interface ReservationItem {
  id: string;
  item_type: 'RESOURCE' | 'TICKET_TIER';
  resource_id?: string;
  resource_code?: string;
  tier_name?: string;
  quantity: number;
  unit_price: number;
  min_spend?: number;
  subtotal: number;
}

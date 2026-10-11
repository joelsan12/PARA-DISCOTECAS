/**
 * Tipos canónicos de Suscripciones SaaS y Facturación de NIGHTFLOW
 * Fase C - Flujo B (PayPhone / Manual / Trial)
 */

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'expired';

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionPaymentMethod =
  | 'payphone_token'
  | 'payphone_sale'
  | 'transfer'
  | 'none';

export type CanonicalPlanId =
  | 'free'
  | 'starter'
  | 'club_pro'
  | 'black_vip'
  | 'beta_vip';

export interface SubscriptionData {
  businessId: string;
  planId: CanonicalPlanId;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  trialEndsAt?: number;
  currentPeriodEnd: number;
  payphoneCardTokenId?: string;
  paymentMethod: SubscriptionPaymentMethod;
  startedAt: number;
  updatedAt: number;
}

export interface PlatformSubscriptionRecord {
  id: string;
  businessId: string;
  planId: CanonicalPlanId;
  cycle: BillingCycle;
  amount: number;
  currency: 'USD';
  method: SubscriptionPaymentMethod;
  reference?: string;
  payphoneTransactionId?: string;
  periodStart: number;
  periodEnd: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  actorUid?: string;
  notes?: string;
  createdAt: number;
}

export interface PlanDefinition {
  id: CanonicalPlanId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

export const CANONICAL_PLANS: Record<CanonicalPlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Lounge Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['RESERVATIONS', 'EVENTS'],
  },
  starter: {
    id: 'starter',
    name: 'Starter Club',
    monthlyPrice: 5,
    annualPrice: 50,
    features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'QR_CHECKIN'],
  },
  club_pro: {
    id: 'club_pro',
    name: 'Club Pro',
    monthlyPrice: 15,
    annualPrice: 150,
    features: [
      'RESERVATIONS',
      'EVENTS',
      'FLOOR_PLAN',
      'TABLE_SELECTION',
      'ONLINE_PAYMENT',
      'QR_CHECKIN',
      'STAFF_MANAGEMENT',
      'LIVE_FLOOR_OPS',
    ],
  },
  black_vip: {
    id: 'black_vip',
    name: 'Black VIP',
    monthlyPrice: 45,
    annualPrice: 450,
    features: [
      'RESERVATIONS',
      'EVENTS',
      'FLOOR_PLAN',
      'TABLE_SELECTION',
      'SEAT_SELECTION',
      'CAPACITY_POOL',
      'ONLINE_PAYMENT',
      'QR_CHECKIN',
      'STAFF_MANAGEMENT',
      'LIVE_FLOOR_OPS',
      'ADVANCED_ANALYTICS',
      'CUSTOM_DOMAIN',
      'MULTI_LOCATION',
    ],
  },
  beta_vip: {
    id: 'beta_vip',
    name: 'Beta Privada VIP',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'RESERVATIONS',
      'EVENTS',
      'FLOOR_PLAN',
      'TABLE_SELECTION',
      'SEAT_SELECTION',
      'CAPACITY_POOL',
      'ONLINE_PAYMENT',
      'QR_CHECKIN',
      'STAFF_MANAGEMENT',
      'LIVE_FLOOR_OPS',
      'ADVANCED_ANALYTICS',
      'CUSTOM_DOMAIN',
      'MULTI_LOCATION',
    ],
  },
};

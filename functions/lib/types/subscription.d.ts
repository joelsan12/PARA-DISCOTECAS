/**
 * Tipos canónicos de Suscripciones SaaS y Facturación de NIGHTFLOW
 * Fase C - Flujo B (PayPhone / Manual / Trial)
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'expired';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionPaymentMethod = 'payphone_token' | 'payphone_sale' | 'transfer' | 'none';
export type CanonicalPlanId = 'free' | 'starter' | 'club_pro' | 'black_vip' | 'beta_vip';
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
export declare const CANONICAL_PLANS: Record<CanonicalPlanId, PlanDefinition>;

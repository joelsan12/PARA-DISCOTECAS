/**
 * Motor de Suscripciones SaaS y Facturación de NIGHTFLOW
 * Fase C - Flujo B (PayPhone / Manual / Trial de 30 días)
 */
import type { CallableRequest } from 'firebase-functions/v2/https';
import { type BillingCycle, type CanonicalPlanId, type SubscriptionPaymentMethod, type SubscriptionStatus } from './types/subscription.js';
export declare function normalizeToCanonicalPlanId(planId: string): CanonicalPlanId;
export declare function getBusinessSubscriptionFor(businessId: string, authUid: string | null): Promise<{
    isFounderBypass: boolean;
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
}>;
export declare function getBusinessSubscription(request: CallableRequest<unknown>): Promise<{
    isFounderBypass: boolean;
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
}>;
export interface SelectPlanInput {
    businessId: string;
    planId: string;
    cycle?: 'monthly' | 'annual' | undefined;
    paymentMethod?: SubscriptionPaymentMethod | undefined;
    responseUrl?: string | undefined;
}
export declare function parseSelectPlanInput(value: unknown): SelectPlanInput;
export declare function selectSubscriptionPlanFor(input: SelectPlanInput, authUid: string | null): Promise<{
    success: boolean;
    planId: string;
    status: string;
    currentPeriodEnd: number;
    trialGranted?: never;
    trialEndsAt?: never;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    trialGranted: boolean;
    status: string;
    planId: "beta_vip" | "black_vip" | "starter" | "club_pro";
    trialEndsAt: number;
    currentPeriodEnd: number;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    pendingTransfer: boolean;
    reference: string;
    amount: number;
    planId: "beta_vip" | "black_vip" | "starter" | "club_pro";
    cycle: "monthly" | "annual" | undefined;
    status?: never;
    currentPeriodEnd?: never;
    trialGranted?: never;
    trialEndsAt?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    checkoutUrl: string;
    paymentId: string | number;
    clientTransactionId: string;
    planId?: never;
    status?: never;
    currentPeriodEnd?: never;
    trialGranted?: never;
    trialEndsAt?: never;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
}>;
export declare function selectSubscriptionPlan(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    planId: string;
    status: string;
    currentPeriodEnd: number;
    trialGranted?: never;
    trialEndsAt?: never;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    trialGranted: boolean;
    status: string;
    planId: "beta_vip" | "black_vip" | "starter" | "club_pro";
    trialEndsAt: number;
    currentPeriodEnd: number;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    pendingTransfer: boolean;
    reference: string;
    amount: number;
    planId: "beta_vip" | "black_vip" | "starter" | "club_pro";
    cycle: "monthly" | "annual" | undefined;
    status?: never;
    currentPeriodEnd?: never;
    trialGranted?: never;
    trialEndsAt?: never;
    checkoutUrl?: never;
    paymentId?: never;
    clientTransactionId?: never;
} | {
    success: boolean;
    checkoutUrl: string;
    paymentId: string | number;
    clientTransactionId: string;
    planId?: never;
    status?: never;
    currentPeriodEnd?: never;
    trialGranted?: never;
    trialEndsAt?: never;
    pendingTransfer?: never;
    reference?: never;
    amount?: never;
    cycle?: never;
}>;
export interface RegisterTransferInput {
    businessId: string;
    planId: string;
    cycle?: 'monthly' | 'annual' | undefined;
    amount: number;
    reference?: string | undefined;
    notes?: string | undefined;
}
export declare function registerSubscriptionTransferFor(input: RegisterTransferInput, authUid: string | null): Promise<{
    success: boolean;
    status: string;
    planId: CanonicalPlanId;
    currentPeriodEnd: number;
}>;
export declare function registerSubscriptionTransfer(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    status: string;
    planId: CanonicalPlanId;
    currentPeriodEnd: number;
}>;
export interface UpdateSubscriptionStatusInput {
    businessId: string;
    status: SubscriptionStatus;
    planId?: string | undefined;
    extendDays?: number | undefined;
    notes?: string | undefined;
}
export declare function updateSubscriptionStatusManualFor(input: UpdateSubscriptionStatusInput, authUid: string | null): Promise<{
    success: boolean;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
}>;
export declare function updateSubscriptionStatusManual(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
}>;
export declare function listPlatformSubscriptionsFor(authUid: string | null, limit?: number): Promise<{
    records: {
        id: string;
    }[];
    count: number;
}>;
export declare function listPlatformSubscriptions(request: CallableRequest<unknown>): Promise<{
    records: {
        id: string;
    }[];
    count: number;
}>;
export declare function requireActiveSubscription(businessId: string): Promise<void>;
export declare function handlePayPhoneWebhook(req: {
    body: unknown;
}, res: {
    status: (code: number) => {
        json: (data: unknown) => void;
        send: (msg: string) => void;
    };
}): Promise<void>;
export declare function processSubscriptionTicker(): Promise<number>;

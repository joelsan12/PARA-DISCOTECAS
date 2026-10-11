import { releaseHoldTask } from "./tasks.js";
export { releaseHoldTask };
export declare const createBusinessTenant: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    businessId: string;
    directoryId: string;
    resourceIds: string[];
}>, unknown>;
export declare const updateBusinessLegalProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const upsertBusinessEvent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    eventId: string;
    event: Record<string, unknown>;
}>, unknown>;
export declare const getPaymentAccount: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const configurePaymentAccount: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const listPaymentTransactions: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    transactions: Array<Record<string, unknown>>;
}>, unknown>;
export declare const createPaymentRefund: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    replay: boolean;
    status: string;
    refundId: string;
}>, unknown>;
export declare const requestOtp: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    challengeId: string;
    expiresAt: string;
    retryAfterSeconds: number;
    channel: import("./otp.js").OtpChannel;
}>, unknown>;
export declare const verifyOtp: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./otp.js").OtpVerifyResult>, unknown>;
export declare const createBusinessCustomerProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const createReservationHold: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./reservations.js").ReservationHoldResult>, unknown>;
export declare const releaseHold: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./reservations.js").ReleaseResult>, unknown>;
export declare const createPaymentSession: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./paymentSession.js").PaymentSessionResult>, unknown>;
export declare const createBusinessSession: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const emergencyRevoke: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const privacyDeletionRequest: import("firebase-functions/v2/https").CallableFunction<any, Promise<Record<string, unknown>>, unknown>;
export declare const requestOtpHttp: import("firebase-functions/v2/https").HttpsFunction;
export declare const verifyOtpHttp: import("firebase-functions/v2/https").HttpsFunction;
export declare const paymentWebhook: import("firebase-functions/v2/https").HttpsFunction;
export declare const registerBetaClub: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./betaRegistration.js").RegisterBetaClubResult>, unknown>;
export declare const registerBetaClubHttp: import("firebase-functions/v2/https").HttpsFunction;
export declare const submitBetaFeedback: import("firebase-functions/v2/https").CallableFunction<any, Promise<import("./feedback.js").FeedbackResult>, unknown>;
export declare const submitBetaFeedbackHttp: import("firebase-functions/v2/https").HttpsFunction;
export declare const getBusinessSubscription: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    isFounderBypass: boolean;
    businessId: string;
    planId: import("./types/subscription.js").CanonicalPlanId;
    cycle: import("./types/subscription.js").BillingCycle;
    status: import("./types/subscription.js").SubscriptionStatus;
    trialEndsAt?: number;
    currentPeriodEnd: number;
    payphoneCardTokenId?: string;
    paymentMethod: import("./types/subscription.js").SubscriptionPaymentMethod;
    startedAt: number;
    updatedAt: number;
}>, unknown>;
export declare const selectSubscriptionPlan: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
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
}>, unknown>;
export declare const registerSubscriptionTransfer: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    status: string;
    planId: import("./types/subscription.js").CanonicalPlanId;
    currentPeriodEnd: number;
}>, unknown>;
export declare const updateSubscriptionStatusManual: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    status: import("./types/subscription.js").SubscriptionStatus;
    currentPeriodEnd: number;
}>, unknown>;
export declare const listPlatformSubscriptions: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    records: {
        id: string;
    }[];
    count: number;
}>, unknown>;
export declare const payphoneWebhook: import("firebase-functions/v2/https").HttpsFunction;
export declare const syncFloorPlanInventory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    businessId: string;
    syncedCount: number;
    deactivatedCount: number;
    skippedHoldsCount: number;
}>, unknown>;
export declare const listBusinessStaff: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    staff: import("./staffAdmin.js").StaffMemberRecord[];
}>, unknown>;
export declare const upsertStaffMember: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    uid: string;
    name: string;
    email: string;
    whatsapp?: string | null;
    role: import("./auth.js").StaffRole;
    status: "ACTIVE";
    assignedZones: string[];
    temporaryPassword?: string;
}>, unknown>;
export declare const revokeStaffMember: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    uid: string;
    status: "REVOKED";
}>, unknown>;
export declare const getConsumptionCatalog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    items: import("./consumption.js").ConsumptionCatalogItem[];
}>, unknown>;
export declare const saveConsumptionCatalog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: true;
    count: number;
}>, unknown>;
export declare const addConsumptionItem: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    tab: import("./consumption.js").TableTabRecord;
}>, unknown>;
export declare const settleTableTab: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    status: "SETTLED";
    reservationId: string;
    subtotal: number;
    settledBy: string;
    replay?: boolean;
}>, unknown>;
export declare const createConciergeRequest: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    requestId: string;
    request: import("./concierge.js").ConciergeRequestRecord;
}>, unknown>;
export declare const updateConciergeRequestStatus: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    requestId: string;
    status: import("./concierge.js").ConciergeRequestStatus;
    replay?: boolean;
}>, unknown>;
export declare const cancelConciergeRequest: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: true;
    requestId: string;
    status: "CANCELLED";
    replay?: boolean;
}>, unknown>;

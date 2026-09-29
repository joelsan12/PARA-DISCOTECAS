import { releaseHoldTask } from "./tasks.js";
export { releaseHoldTask };
export declare const createBusinessTenant: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    businessId: string;
    directoryId: string;
    resourceIds: string[];
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

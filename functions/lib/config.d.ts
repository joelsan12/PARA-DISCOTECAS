export declare const db: FirebaseFirestore.Firestore;
export declare const auth: import("firebase-admin/auth").Auth;
export declare const appCheck: import("firebase-admin/app-check").AppCheck;
export declare class ConfigurationError extends Error {
    readonly code: "failed-precondition";
    constructor(message: string);
}
export declare const runtimeConfig: Readonly<{
    region: string;
    appCheckEnforced: boolean;
    appCheckRequiredForHttp: boolean;
    captchaRequired: boolean;
    otpTtlSeconds: number;
    otpMaxAttempts: number;
    otpRequestWindowSeconds: number;
    otpRequestLimit: number;
    otpVerifyWindowSeconds: number;
    otpVerifyLimit: number;
    holdDurationSeconds: number;
    sessionDurationSeconds: number;
    privacyProcessingLeaseSeconds: number;
    paymentSignatureToleranceSeconds: number;
    cloudTasksQueue: string | undefined;
    cloudTasksLocation: string;
    cloudTasksTargetUrl: string | undefined;
    cloudTasksServiceAccountEmail: string | undefined;
    projectId: string | undefined;
}>;
export declare function optionalEnv(name: string): string | undefined;
export declare function requiredSecret(name: string): string;
export declare function otpHashSecret(): string;
export declare function identifierHashSecret(): string;
export declare function holdTokenSecret(): string;
export declare function resendConfig(): {
    apiKey: string;
    from: string;
} | null;
export declare function twilioConfig(): {
    accountSid: string;
    authToken: string;
    serviceSid: string;
} | null;
export declare function captchaConfig(): {
    secret: string;
    url: string;
} | null;
export declare function paymentWebhookSecret(): string;

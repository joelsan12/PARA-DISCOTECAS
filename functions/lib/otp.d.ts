import type { CallableRequest } from "firebase-functions/v2/https";
export type OtpChannel = "email" | "whatsapp" | "sms";
export interface OtpVerifyResult {
    verified: boolean;
    businessId: string;
    challengeId: string;
    channel: OtpChannel;
    uid: string;
    customToken: string;
}
export declare function requestOtpFor(value: unknown, ipAddress: string): Promise<{
    challengeId: string;
    expiresAt: string;
    retryAfterSeconds: number;
    channel: OtpChannel;
}>;
export declare function verifyOtpFor(value: unknown, ipAddress: string): Promise<OtpVerifyResult>;
export declare function otpCallableData(request: CallableRequest<unknown>): unknown;

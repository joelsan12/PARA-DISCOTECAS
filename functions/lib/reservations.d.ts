import type { CallableRequest } from "firebase-functions/v2/https";
export interface ReservationHoldResult {
    holdId: string;
    holdToken: string;
    businessId: string;
    eventId: string;
    resourceId: string;
    state: "HELD";
    paymentState: "PENDING";
    amount: number;
    currency: string;
    expiresAt: string;
    idempotentReplay: boolean;
}
export declare function createReservationHoldFor(request: CallableRequest<unknown>): Promise<ReservationHoldResult>;
export interface ReleaseResult {
    holdId: string;
    released: boolean;
    state: string;
    reason?: string;
}
export declare function releaseHoldById(holdId: string, expectedTokenHash?: string, onlyIfExpired?: boolean): Promise<ReleaseResult>;
export declare function releaseHoldFor(request: CallableRequest<unknown>): Promise<ReleaseResult>;

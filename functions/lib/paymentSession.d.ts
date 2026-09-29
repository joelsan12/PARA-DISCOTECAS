import type { CallableRequest } from "firebase-functions/v2/https";
export interface PaymentSessionResult {
    holdId: string;
    paymentSessionId: string;
    state: "PAYMENT_PENDING";
    amount: number;
    currency: string;
    expiresAt: string;
    checkoutUrl: string | null;
    provider: string;
    idempotentReplay: boolean;
}
export declare function createPaymentSessionFor(request: CallableRequest<unknown>): Promise<PaymentSessionResult>;

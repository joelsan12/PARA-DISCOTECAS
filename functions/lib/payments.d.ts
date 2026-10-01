import type { PaymentTransaction, PaymentTransactionStatus } from "./types/payments.js";
export type CanonicalFinancialStatus = PaymentTransactionStatus;
export interface PaymentResult {
    duplicate: boolean;
    status: CanonicalFinancialStatus;
    reservationId?: string;
    refundRequired: boolean;
}
export interface PaymentWebhookRouting {
    provider?: string | undefined;
    merchantId?: string | undefined;
    businessId?: string | undefined;
}
export declare function processPaymentWebhook(raw: Buffer, signatureHeader: string | undefined, routing?: PaymentWebhookRouting, headers?: Record<string, string | string[] | undefined>): Promise<PaymentResult>;
/**
 * Función de conciliación de estado financiero (Fase A)
 */
export declare function verifyPayment(businessId: string, transactionId: string): Promise<PaymentTransaction | null>;

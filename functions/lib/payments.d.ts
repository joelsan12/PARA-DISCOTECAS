interface PaymentResult {
    duplicate: boolean;
    status: "PAID" | "FAILED" | "REFUND_REQUIRED";
    reservationId?: string;
    refundRequired: boolean;
}
export interface PaymentWebhookRouting {
    provider?: string | undefined;
    merchantId?: string | undefined;
    businessId?: string | undefined;
}
export declare function processPaymentWebhook(raw: Buffer, signatureHeader: string | undefined, routing?: PaymentWebhookRouting): Promise<PaymentResult>;
export {};

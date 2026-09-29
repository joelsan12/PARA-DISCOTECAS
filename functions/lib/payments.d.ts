interface PaymentResult {
    duplicate: boolean;
    status: "PAID" | "FAILED" | "REFUND_REQUIRED";
    reservationId?: string;
    refundRequired: boolean;
}
export declare function processPaymentWebhook(raw: Buffer, signatureHeader: string | undefined): Promise<PaymentResult>;
export {};

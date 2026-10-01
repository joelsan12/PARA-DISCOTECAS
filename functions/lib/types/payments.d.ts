/**
 * Especificación Canónica de Pagos Multi-Tenant y Cumplimiento
 * NIGHTFLOW VIP (AGENTS.md Fase 7 / Fase A-E)
 */
export type PaymentTransactionStatus = 'CREATED' | 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_REQUIRED' | 'REFUND_PENDING' | 'REFUNDED' | 'CHARGEBACK';
export type PaymentMode = 'PAY_AT_DOOR' | 'CLIENT_GATEWAY' | 'ASSISTED_GATEWAY';
export type PaymentProviderType = 'none' | 'kushki' | 'payphone' | 'deuna';
export type PaymentAccountStatus = 'PENDING_CONFIG' | 'ACTIVE' | 'DISABLED';
export interface BusinessLegalProfile {
    legalName: string;
    ruc: string;
    taxAddress: string;
    supportEmail: string;
    supportPhone?: string;
    refundPolicyUrl?: string;
    termsAndConditionsUrl?: string;
    updatedAt: number;
}
export interface PaymentAccount {
    businessId: string;
    provider: PaymentProviderType;
    environment: 'sandbox' | 'production';
    merchantId: string;
    publicApiKey?: string;
    secretReference?: string;
    paymentMode: PaymentMode;
    status: PaymentAccountStatus;
    updatedAt: number;
}
export interface PaymentSecrets {
    privateApiKey?: string;
    webhookSecret: string;
}
export interface PaymentTransaction {
    id: string;
    businessId: string;
    holdId: string;
    orderId: string;
    provider: string;
    providerMerchantId: string;
    providerTransactionId?: string;
    amount: number;
    currency: 'USD';
    status: PaymentTransactionStatus;
    idempotencyKey: string;
    failureCode?: string;
    failureMessage?: string;
    refundedAmount?: number;
    chargebackReason?: string;
    createdAt: number;
    updatedAt: number;
}
export interface PaymentTransactionEvent {
    eventKey: string;
    providerEventId: string;
    eventType: string;
    canonicalStatus: PaymentTransactionStatus;
    receivedAt: number;
    rawPayloadHash: string;
    signatureVerified: boolean;
    processingResult: 'ACCEPTED' | 'DUPLICATE' | 'IGNORED' | 'ERROR';
    details?: Record<string, unknown>;
}
export interface CreatePaymentInput {
    businessId: string;
    holdId: string;
    orderId: string;
    amount: number;
    currency: 'USD';
    description: string;
    customer: {
        uid: string;
        email: string;
        fullName?: string;
        phone?: string;
    };
    returnUrl: string;
}
export interface PaymentSession {
    sessionId: string;
    checkoutUrl: string;
    expiresAt: number;
}
export interface WebhookVerificationInput {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
    merchantId: string;
}
export interface VerifiedPaymentEvent {
    provider: string;
    merchantId: string;
    providerTransactionId: string;
    providerEventId: string;
    eventType: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REFUND' | 'CHARGEBACK' | 'UNSUPPORTED';
    orderId: string;
    holdId: string;
    amount: number;
    currency: string;
    rawPayload: Record<string, unknown>;
}
export interface RefundInput {
    businessId: string;
    transactionId: string;
    providerTransactionId: string;
    amount: number;
    currency: 'USD';
    reason?: string;
}
export interface RefundResult {
    refundId: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    rawResponse?: Record<string, unknown>;
}
export interface PaymentProvider {
    readonly name: string;
    createSession(account: PaymentAccount, secrets: PaymentSecrets, input: CreatePaymentInput): Promise<PaymentSession>;
    verifyWebhook(account: PaymentAccount, secrets: PaymentSecrets, input: WebhookVerificationInput): Promise<VerifiedPaymentEvent>;
    verifyPayment(account: PaymentAccount, secrets: PaymentSecrets, transactionId: string): Promise<VerifiedPaymentEvent>;
    refund?(account: PaymentAccount, secrets: PaymentSecrets, input: RefundInput): Promise<RefundResult>;
}

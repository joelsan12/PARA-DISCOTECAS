/**
 * Adaptador de Pagos PayPhone Business para Suscripciones SaaS (NIGHTFLOW)
 * Flujo B (Dueño del club -> NIGHTFLOW)
 * Documentación y requisitos: docs/SAAS-BILLING-PAYPHONE-ONBOARDING.md
 */
export interface PayPhoneConfig {
    token: string;
    storeId?: string | undefined;
    environment: 'sandbox' | 'production';
}
export interface PreparePayPhoneSessionInput {
    businessId: string;
    planId: string;
    amount: number;
    reference: string;
    clientTransactionId: string;
    responseUrl: string;
}
export interface PreparePayPhoneSessionResult {
    paymentId: number | string;
    payUrl: string;
    clientTransactionId: string;
}
export interface ConfirmPayPhoneResult {
    transactionId: number | string;
    status: 'Approved' | 'Rejected' | 'Canceled' | 'Pending';
    amount: number;
    cardToken?: string | undefined;
    authorizationCode?: string | undefined;
}
export declare class PayPhoneSaasClient {
    private getBaseUrl;
    /**
     * Prepara una sesión de pago (Web Checkout de PayPhone)
     */
    preparePayment(config: PayPhoneConfig, input: PreparePayPhoneSessionInput): Promise<PreparePayPhoneSessionResult>;
    /**
     * Verifica activamente una transacción contra la API de PayPhone (Fail-closed).
     */
    confirmPayment(config: PayPhoneConfig, paymentId: number | string, clientTxId: string): Promise<ConfirmPayPhoneResult>;
    /**
     * Cobra recurrentemente usando un token de tarjeta (CardToken).
     */
    chargeWithToken(config: PayPhoneConfig, cardTokenId: string, amount: number, reference: string, clientTxId: string): Promise<ConfirmPayPhoneResult>;
}
export declare const payPhoneSaasClient: PayPhoneSaasClient;

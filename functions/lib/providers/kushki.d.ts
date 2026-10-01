/**
 * KushkiAdapter — Adaptador de Kushki Ecuador para NIGHTFLOW VIP (Fase C)
 *
 * Documentación oficial:
 *  - WebCheckout: POST /smartlink/v1/webcheckout
 *  - Webhooks: X-Kushki-Signature, X-Kushki-SimpleSignature, X-Kushki-Id, X-Kushki-Key
 *  - Transacciones: GET /v1/transactions/{transactionId}
 *  - Reembolsos: POST /v1/refund/{transactionId}
 *
 * Reglas de seguridad (AGENTS.md):
 *  - Raw body preservado byte-exacto para verificación HMAC.
 *  - Orden de verificación: shape -> timestamp -> HMAC -> JSON parse.
 *  - Cero almacenamiento de PAN/CVV.
 *  - Fail-closed: 503 si credenciales no resuelven.
 */
import type { PaymentAccount, PaymentSecrets, CreatePaymentInput, PaymentSession, WebhookVerificationInput, VerifiedPaymentEvent, PaymentProvider, RefundInput, RefundResult } from "../types/payments.js";
export declare class KushkiAdapter implements PaymentProvider {
    readonly name = "kushki";
    /**
     * createSession — Genera sesión de Hosted Checkout en Kushki
     */
    createSession(account: PaymentAccount, secrets: PaymentSecrets, input: CreatePaymentInput): Promise<PaymentSession>;
    /**
     * verifyWebhook — Verificación HMAC y extracción de eventos de pago de Kushki
     *
     * Soporta cabeceras canónicas de Kushki:
     *  - x-kushki-id: timestamp Unix
     *  - x-kushki-signature: HMAC(secret, rawBody + x-kushki-id) o HMAC(secret, rawBody)
     *  - x-kushki-simplesignature: HMAC(secret, x-kushki-id)
     * Y formato estándar de interoperabilidad (t=..., v1=...)
     */
    verifyWebhook(account: PaymentAccount, secrets: PaymentSecrets, input: WebhookVerificationInput): Promise<VerifiedPaymentEvent>;
    /**
     * verifyPayment — Consulta activa del estado de una transacción en Kushki
     */
    verifyPayment(account: PaymentAccount, secrets: PaymentSecrets, transactionId: string): Promise<VerifiedPaymentEvent>;
    /**
     * refund — Reembolso vía API de Kushki
     */
    refund(account: PaymentAccount, secrets: PaymentSecrets, input: RefundInput): Promise<RefundResult>;
}

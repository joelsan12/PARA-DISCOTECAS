import type { PaymentAccount, PaymentSecrets, PaymentProvider, CreatePaymentInput, PaymentSession, WebhookVerificationInput, VerifiedPaymentEvent } from "../types/payments.js";
import { KushkiAdapter } from "./kushki.js";
/**
 * Proveedor nulo / para pruebas locales herméticas o PAY_AT_DOOR.
 * No genera redirección externa ni Hosted Checkout.
 */
export declare class NonePaymentProvider implements PaymentProvider {
    readonly name = "none";
    createSession(_account: PaymentAccount, _secrets: PaymentSecrets, _input: CreatePaymentInput): Promise<PaymentSession>;
    verifyWebhook(_account: PaymentAccount, _secrets: PaymentSecrets, _input: WebhookVerificationInput): Promise<VerifiedPaymentEvent>;
    verifyPayment(_account: PaymentAccount, _secrets: PaymentSecrets, _transactionId: string): Promise<VerifiedPaymentEvent>;
}
/**
 * Registry de adaptadores de pasarela de pago (Fase A y Fase C).
 * Los adaptadores específicos (Kushki, PayPhone, DeUna) se registran aquí.
 */
declare class PaymentProviderRegistry {
    private providers;
    constructor();
    register(provider: PaymentProvider): void;
    get(providerName: string): PaymentProvider;
    has(providerName: string): boolean;
}
export declare const paymentRegistry: PaymentProviderRegistry;
export { KushkiAdapter };

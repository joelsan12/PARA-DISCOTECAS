import { AppError } from "../errors.js";
/**
 * Proveedor nulo / para pruebas locales herméticas o PAY_AT_DOOR.
 * No genera redirección externa ni Hosted Checkout.
 */
export class NonePaymentProvider {
    name = "none";
    async createSession(_account, _secrets, _input) {
        throw new AppError("failed-precondition", "El modo PAY_AT_DOOR no utiliza sesión de pasarela de pago online", 400);
    }
    async verifyWebhook(_account, _secrets, _input) {
        throw new AppError("failed-precondition", "El proveedor 'none' no procesa webhooks", 400);
    }
    async verifyPayment(_account, _secrets, _transactionId) {
        throw new AppError("failed-precondition", "El proveedor 'none' no soporta consulta de pagos", 400);
    }
}
/**
 * Registry de adaptadores de pasarela de pago (Fase A y Fase C).
 * Los adaptadores específicos (Kushki, PayPhone, DeUna) se registran aquí.
 */
class PaymentProviderRegistry {
    providers = new Map();
    constructor() {
        this.register(new NonePaymentProvider());
    }
    register(provider) {
        this.providers.set(provider.name.toLowerCase(), provider);
    }
    get(providerName) {
        const normalized = (providerName || "none").toLowerCase();
        const provider = this.providers.get(normalized);
        if (!provider) {
            throw new AppError("failed-precondition", `Proveedor de pago no soportado: ${providerName}`, 400);
        }
        return provider;
    }
}
export const paymentRegistry = new PaymentProviderRegistry();
//# sourceMappingURL=index.js.map
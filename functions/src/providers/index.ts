import type {
  PaymentAccount,
  PaymentSecrets,
  PaymentProvider,
  CreatePaymentInput,
  PaymentSession,
  WebhookVerificationInput,
  VerifiedPaymentEvent
} from "../types/payments.js";
import { AppError } from "../errors.js";
import { KushkiAdapter } from "./kushki.js";

/**
 * Proveedor nulo / para pruebas locales herméticas o PAY_AT_DOOR.
 * No genera redirección externa ni Hosted Checkout.
 */
export class NonePaymentProvider implements PaymentProvider {
  readonly name = "none";

  async createSession(
    _account: PaymentAccount,
    _secrets: PaymentSecrets,
    _input: CreatePaymentInput
  ): Promise<PaymentSession> {
    throw new AppError("failed-precondition", "El modo PAY_AT_DOOR no utiliza sesión de pasarela de pago online", 400);
  }

  async verifyWebhook(
    _account: PaymentAccount,
    _secrets: PaymentSecrets,
    _input: WebhookVerificationInput
  ): Promise<VerifiedPaymentEvent> {
    throw new AppError("failed-precondition", "El proveedor 'none' no procesa webhooks", 400);
  }

  async verifyPayment(
    _account: PaymentAccount,
    _secrets: PaymentSecrets,
    _transactionId: string
  ): Promise<VerifiedPaymentEvent> {
    throw new AppError("failed-precondition", "El proveedor 'none' no soporta consulta de pagos", 400);
  }
}

/**
 * Registry de adaptadores de pasarela de pago (Fase A y Fase C).
 * Los adaptadores específicos (Kushki, PayPhone, DeUna) se registran aquí.
 */
class PaymentProviderRegistry {
  private providers = new Map<string, PaymentProvider>();

  constructor() {
    this.register(new NonePaymentProvider());
    this.register(new KushkiAdapter());
  }

  register(provider: PaymentProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(providerName: string): PaymentProvider {
    const normalized = (providerName || "none").toLowerCase();
    const provider = this.providers.get(normalized);
    if (!provider) {
      throw new AppError("failed-precondition", `Proveedor de pago no soportado: ${providerName}`, 400);
    }
    return provider;
  }

  has(providerName: string): boolean {
    return this.providers.has((providerName || "").toLowerCase());
  }
}

export const paymentRegistry = new PaymentProviderRegistry();
export { KushkiAdapter };

import type { PaymentSecrets } from "./types/payments.js";
/**
 * Resuelve el valor real de un secreto a partir de su secretReference.
 * En producción contra GCP, accede a Secret Manager mediante credenciales de servicio mínimas (roles/secretmanager.secretAccessor).
 * En desarrollo/test, soporta referencias locales controladas.
 */
export declare function resolveSecretPayload(secretReference: string): Promise<string>;
/**
 * Resuelve y parsea los secretos de un PaymentAccount (API key y webhookSecret).
 */
export declare function resolvePaymentSecrets(secretReference: string): Promise<PaymentSecrets>;
export declare function clearSecretCache(): void;

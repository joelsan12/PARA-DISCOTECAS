import type { OtpChannel } from "./otp.js";
export type PaidChannel = "sms" | "whatsapp";
/**
 * Presupuesto diario de mensajeria por negocio (AGENTS 4). El limite de los
 * canales de pago es el que dispara el circuit breaker: al agotarse, el canal
 * de pago queda suspendido para el resto del dia y el cliente degrada a correo,
 * que es gratuito y no puede ser explotado para SMS pumping. El consumo se
 * reserva antes de invocar al proveedor para que un envio fallido no devuelva
 * el cupo al atacante.
 */
export declare function consumeMessagingBudget(businessId: string, channel: OtpChannel): Promise<void>;

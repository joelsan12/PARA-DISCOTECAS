import { FieldValue } from "firebase-admin/firestore";
import { db, runtimeConfig } from "./config.js";
import { AppError } from "./errors.js";
import type { OtpChannel } from "./otp.js";

export type PaidChannel = "sms" | "whatsapp";

interface QuotaState {
  email: number;
  sms: number;
  whatsapp: number;
  paidDisabled: boolean;
}

function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function isPaidChannel(channel: OtpChannel): channel is PaidChannel {
  return channel === "sms" || channel === "whatsapp";
}

function limitFor(channel: OtpChannel): number {
  return isPaidChannel(channel) ? runtimeConfig.otpPaidChannelDailyLimit : runtimeConfig.otpEmailDailyLimit;
}

/**
 * Presupuesto diario de mensajeria por negocio (AGENTS 4). El limite de los
 * canales de pago es el que dispara el circuit breaker: al agotarse, el canal
 * de pago queda suspendido para el resto del dia y el cliente degrada a correo,
 * que es gratuito y no puede ser explotado para SMS pumping. El consumo se
 * reserva antes de invocar al proveedor para que un envio fallido no devuelva
 * el cupo al atacante.
 */
export async function consumeMessagingBudget(businessId: string, channel: OtpChannel): Promise<void> {
  const dayKey = utcDayKey();
  const businessReference = db.collection("businesses").doc(businessId);
  const quotaReference = businessReference.collection("messagingQuota").doc(dayKey);
  const limit = limitFor(channel);
  const verdict = await db.runTransaction(async (transaction) => {
    const [businessSnapshot, quotaSnapshot] = await Promise.all([
      transaction.get(businessReference),
      transaction.get(quotaReference)
    ]);
    const business = businessSnapshot.data() ?? {};
    const quota = (quotaSnapshot.data() ?? {}) as Partial<QuotaState>;
    const state: QuotaState = {
      email: typeof quota.email === "number" ? quota.email : 0,
      sms: typeof quota.sms === "number" ? quota.sms : 0,
      whatsapp: typeof quota.whatsapp === "number" ? quota.whatsapp : 0,
      paidDisabled: quota.paidDisabled === true || business.otpPaidChannelsSuspended === true
    };
    if (isPaidChannel(channel) && state.paidDisabled) {
      return {
        allowed: false,
        code: "failed-precondition" as const,
        status: 412,
        message: "Paid OTP channels are suspended for this business; use email"
      };
    }
    const current = state[channel];
    if (current >= limit) {
      if (isPaidChannel(channel)) {
        transaction.set(quotaReference, {
          businessId,
          dayKey,
          paidDisabled: true,
          paidDisabledAt: FieldValue.serverTimestamp(),
          paidDisabledReason: `daily_limit_reached:${limit}`,
          [channel]: current,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        transaction.update(businessReference, {
          otpPaidChannelsSuspended: true,
          otpPaidChannelsSuspendedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      return {
        allowed: false,
        code: "resource-exhausted" as const,
        status: 429,
        message: `Daily messaging budget exhausted for ${channel}`
      };
    }
    transaction.set(quotaReference, {
      businessId,
      dayKey,
      [channel]: current + 1,
      paidDisabled: state.paidDisabled,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return { allowed: true, code: undefined, status: 0, message: undefined };
  });
  if (!verdict.allowed) {
    throw new AppError(verdict.code ?? "resource-exhausted", verdict.message ?? "Messaging budget exhausted", verdict.status || 429);
  }
}
/**
 * KushkiAdapter — Adaptador de Kushki Ecuador para NIGHTFLOW VIP (Fase C)
 *
 * Documentación oficial:
 *  - WebCheckout: POST /smartlink/v1/webcheckout
 *  - Webhooks: X-Kushki-Signature, X-Kushki-SimpleSignature, X-Kushki-Id, X-Kushki-Key
 *  - Transacciones: GET /v1/transactions/{transactionId}
 *  - Reembolsos: POST /v1/transactions/{transactionId}/refund (alternativa: /v1/refund/{transactionId})
 *
 * Reglas de seguridad (AGENTS.md):
 *  - Raw body preservado byte-exacto para verificación HMAC.
 *  - Orden de verificación: shape -> timestamp -> HMAC -> JSON parse.
 *  - Cero almacenamiento de PAN/CVV.
 *  - Fail-closed: 503 si credenciales no resuelven.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentAccount,
  PaymentSecrets,
  CreatePaymentInput,
  PaymentSession,
  WebhookVerificationInput,
  VerifiedPaymentEvent,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "../types/payments.js";
import { AppError } from "../errors.js";

const KUSHKI_SANDBOX_BASE = "https://api-uat.kushkipagos.com";
const KUSHKI_PROD_BASE = "https://api.kushkipagos.com";
const SMARTLINK_PATH = "/smartlink/v1/webcheckout";
const TX_PATH = "/v1/transactions";
const TS_TOLERANCE_SECONDS = 300;

function baseUrl(env: string): string {
  return env === "production" ? KUSHKI_PROD_BASE : KUSHKI_SANDBOX_BASE;
}

function hmacHex(secret: string, data: string | Buffer): string {
  return createHmac("sha256", secret)
    .update(typeof data === "string" ? Buffer.from(data, "utf8") : data)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a.toLowerCase().trim());
  const bb = Buffer.from(b.toLowerCase().trim());
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) {
      if (Array.isArray(v)) return v[0] ?? "";
      return typeof v === "string" ? v : "";
    }
  }
  return "";
}

function parseKushkiStatus(status: string): VerifiedPaymentEvent["eventType"] {
  // Normaliza "APPROVED_TRANSACTION", "Approved Transaction", etc.
  const normalized = status.toLowerCase().replace(/[^a-z0-9]/gu, "");
  if (["approvedtransaction", "approved", "approval", "paid", "succeeded", "success", "completed"].includes(normalized)) {
    return "PAYMENT_SUCCESS";
  }
  if (["declinedtransaction", "declined", "rejected", "failed", "failure", "cancelled", "canceled", "expired"].includes(normalized)) {
    return "PAYMENT_FAILED";
  }
  if (["refunded", "reversed", "refund"].includes(normalized)) {
    return "REFUND";
  }
  if (["chargeback", "dispute", "disputed"].includes(normalized)) {
    return "CHARGEBACK";
  }
  return "UNSUPPORTED";
}

function extractNumber(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function extractString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  return "";
}

export class KushkiAdapter implements PaymentProvider {
  readonly name = "kushki";

  /**
   * createSession — Genera sesión de Hosted Checkout en Kushki
   */
  async createSession(
    account: PaymentAccount,
    secrets: PaymentSecrets,
    input: CreatePaymentInput
  ): Promise<PaymentSession> {
    if (!secrets.privateApiKey) {
      throw new AppError("failed-precondition", "Kushki privateApiKey not configured", 503);
    }
    if (input.amount <= 0) {
      throw new AppError("invalid-argument", "Payment amount must be greater than zero", 400);
    }
    if (!input.returnUrl) {
      throw new AppError("invalid-argument", "returnUrl is required", 400);
    }

    const url = baseUrl(account.environment) + SMARTLINK_PATH;
    const requestBody = {
      kind: "webcheckout",
      redirectURL: input.returnUrl,
      products: [
        {
          name: input.description.slice(0, 100),
          description: input.description.slice(0, 200),
          quantity: 1,
          unitPrice: input.amount,
        },
      ],
      paymentConfig: {
        amount: {
          currency: input.currency,
          subtotalIva: 0,
          subtotalIva0: input.amount,
          iva: 0,
        },
        paymentMethod: ["credit-card", "debit-card", "transfer"],
      },
      contactDetail: {
        email: input.customer.email,
        name: (input.customer.fullName ?? input.customer.email).slice(0, 100),
        ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      },
      metadata: {
        holdId: input.holdId,
        orderId: input.orderId,
        businessId: input.businessId,
        customerUid: input.customer.uid,
        nightflowVersion: "1",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Private-Merchant-Id": secrets.privateApiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new AppError(
        "unavailable",
        `Kushki WebCheckout error (${response.status}): ${errorText.slice(0, 200)}`,
        502
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const checkoutUrl =
      extractString(data, "webcheckoutUrl", "url", "redirectUrl") || "";
    const sessionId =
      extractString(data, "webcheckoutId", "token", "sessionId", "id") || "";

    if (!checkoutUrl || !sessionId) {
      throw new AppError(
        "unavailable",
        "Kushki did not return a valid webcheckoutUrl",
        502
      );
    }

    return {
      sessionId,
      checkoutUrl,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
  }

  /**
   * verifyWebhook — Verificación HMAC y extracción de eventos de pago de Kushki
   *
   * Soporta cabeceras canónicas de Kushki:
   *  - x-kushki-id: timestamp Unix
   *  - x-kushki-signature: HMAC(secret, rawBody + x-kushki-id) o HMAC(secret, rawBody)
   *  - x-kushki-simplesignature: HMAC(secret, x-kushki-id)
   * Y formato estándar de interoperabilidad (t=..., v1=...)
   */
  async verifyWebhook(
    account: PaymentAccount,
    secrets: PaymentSecrets,
    input: WebhookVerificationInput
  ): Promise<VerifiedPaymentEvent> {
    const { rawBody, headers } = input;
    const secret = secrets.webhookSecret;
    if (!secret || secret.length < 16) {
      throw new AppError("failed-precondition", "Webhook secret is not configured", 503);
    }

    const kushkiId = getHeader(headers, "x-kushki-id");
    const kushkiSig = getHeader(headers, "x-kushki-signature");
    const kushkiSimpleSig = getHeader(headers, "x-kushki-simplesignature");
    const standardSig = getHeader(headers, "signature") || getHeader(headers, "x-signature");

    let isSignatureValid = false;

    // Caso 1: Cabeceras nativas Kushki
    if (kushkiSig) {
      // Si incluye x-kushki-id, validar timestamp si tiene formato numérico
      if (kushkiId) {
        const ts = Number(kushkiId);
        if (Number.isInteger(ts)) {
          // Si el timestamp está en ms, normalizar a segundos
          const tsSeconds = ts > 1e11 ? Math.floor(ts / 1000) : ts;
          const age = Math.abs(Math.floor(Date.now() / 1000) - tsSeconds);
          if (age > TS_TOLERANCE_SECONDS) {
            throw new AppError("permission-denied", "Kushki webhook timestamp outside allowed window", 401);
          }
        }
      }

      // Verificación de firma combinada con x-kushki-id
      const payloadWithId = kushkiId
        ? Buffer.concat([rawBody, Buffer.from(kushkiId, "utf8")])
        : rawBody;
      const expectedSig = hmacHex(secret, payloadWithId);
      const expectedSigRaw = hmacHex(secret, rawBody);

      if (safeEqual(expectedSig, kushkiSig) || safeEqual(expectedSigRaw, kushkiSig)) {
        isSignatureValid = true;
      }

      // Si viene simpleSignature, verificar contra el timestamp/id
      if (kushkiSimpleSig && kushkiId) {
        const expectedSimple = hmacHex(secret, kushkiId);
        if (!safeEqual(expectedSimple, kushkiSimpleSig)) {
          isSignatureValid = false;
        }
      }
    }

    // Caso 2: Formato estándar t=...,v1=...
    if (!isSignatureValid && standardSig) {
      const parts = standardSig.split(",").map((p) => p.trim()).filter(Boolean);
      const tsPart = parts.find((p) => p.startsWith("t="));
      const sigPart = parts.find((p) => p.startsWith("v1=")) ?? (parts.length === 1 ? parts[0] : undefined);

      if (tsPart && sigPart) {
        const timestamp = tsPart.slice(2);
        const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
        if (age > TS_TOLERANCE_SECONDS) {
          throw new AppError("permission-denied", "Payment signature timestamp is outside the allowed window", 401);
        }
        const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), rawBody]);
        const expectedHex = hmacHex(secret, signedPayload);
        const supplied = sigPart.replace(/^v1=/i, "").replace(/^sha256=/i, "");
        if (safeEqual(expectedHex, supplied)) {
          isSignatureValid = true;
        }
      }
    }

    if (!isSignatureValid) {
      throw new AppError("permission-denied", "Kushki webhook signature verification failed", 401);
    }

    // Parseo seguro del cuerpo JSON autenticado
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    } catch {
      throw new AppError("invalid-argument", "Kushki webhook body is not valid JSON", 400);
    }

    // Extraer campos de la transacción
    const txId =
      extractString(payload, "transaction_id", "transactionId", "ticketNumber", "token") ||
      "";
    const eventId =
      extractString(payload, "eventId", "id", "notificationId", "transaction_id", "transactionId") ||
      txId;

    if (!txId && !eventId) {
      throw new AppError("invalid-argument", "Kushki webhook missing transaction identification", 400);
    }

    const rawStatus = extractString(payload, "status", "transactionStatus", "response_code");
    const eventType = parseKushkiStatus(rawStatus);

    const meta =
      payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : {};

    const holdId = extractString(meta, "holdId") || extractString(payload, "holdId", "hold_id");
    const orderId =
      extractString(meta, "orderId") ||
      extractString(payload, "orderId", "order_id") ||
      holdId;

    if (!holdId && !orderId) {
      throw new AppError("invalid-argument", "Kushki webhook missing holdId in metadata", 400);
    }

    const amtObj =
      payload.amount && typeof payload.amount === "object" && !Array.isArray(payload.amount)
        ? (payload.amount as Record<string, unknown>)
        : {};

    const subtotalIva0 = extractNumber(amtObj, "subtotalIva0");
    const iva = extractNumber(amtObj, "iva");
    const subtotalIva = extractNumber(amtObj, "subtotalIva");
    const amount =
      subtotalIva0 + iva + subtotalIva ||
      extractNumber(amtObj, "total", "amount") ||
      extractNumber(payload, "totalAmount", "amount");

    const currency = extractString(amtObj, "currency") || extractString(payload, "currency") || "USD";

    return {
      provider: "kushki",
      merchantId: account.merchantId || input.merchantId,
      providerTransactionId: txId || eventId,
      providerEventId: eventId || txId,
      eventType,
      orderId: orderId || holdId,
      holdId: holdId || orderId,
      amount,
      currency: currency.toUpperCase(),
      rawPayload: payload,
    };
  }

  /**
   * verifyPayment — Consulta activa del estado de una transacción en Kushki
   */
  async verifyPayment(
    account: PaymentAccount,
    secrets: PaymentSecrets,
    transactionId: string
  ): Promise<VerifiedPaymentEvent> {
    if (!secrets.privateApiKey) {
      throw new AppError("failed-precondition", "Kushki privateApiKey not configured", 503);
    }

    const url = `${baseUrl(account.environment)}${TX_PATH}/${encodeURIComponent(transactionId)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Private-Merchant-Id": secrets.privateApiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new AppError(
        "unavailable",
        `Kushki transaction query error (${response.status})`,
        502
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const status = extractString(data, "transactionStatus", "status");
    const holdId = extractString(data, "holdId") || transactionId;

    return {
      provider: "kushki",
      merchantId: account.merchantId,
      providerTransactionId: transactionId,
      providerEventId: transactionId,
      eventType: parseKushkiStatus(status),
      orderId: holdId,
      holdId,
      amount: extractNumber(data, "totalAmount", "amount"),
      currency: "USD",
      rawPayload: data,
    };
  }

  /**
   * refund — Reembolso vía API de Kushki
   */
  async refund(
    account: PaymentAccount,
    secrets: PaymentSecrets,
    input: RefundInput
  ): Promise<RefundResult> {
    if (!secrets.privateApiKey) {
      throw new AppError("failed-precondition", "Kushki privateApiKey not configured", 503);
    }

    const url = `${baseUrl(account.environment)}${TX_PATH}/${encodeURIComponent(input.providerTransactionId)}/refund`;
    const body = {
      amount: {
        subtotalIva: 0,
        subtotalIva0: input.amount,
        iva: 0,
        currency: input.currency,
      },
      ...(input.reason ? { reason: input.reason.slice(0, 200) } : {}),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Private-Merchant-Id": secrets.privateApiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await response.json().catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;
    if (!response.ok) {
      return { refundId: "", status: "FAILED", rawResponse: data };
    }

    const refundId = extractString(data, "refundId", "ticketNumber") || `ref_${Date.now()}`;
    return { refundId, status: "COMPLETED", rawResponse: data };
  }
}

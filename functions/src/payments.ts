import { FieldValue, type DocumentReference, type DocumentSnapshot } from "firebase-admin/firestore";
import { db, paymentWebhookSecret, runtimeConfig } from "./config.js";
import { hmacSha256, randomId, safeEqual, sha256, hashToken } from "./crypto.js";
import { AppError } from "./errors.js";
import { asRecord, requiredId, stringValue } from "./validation.js";
import { dataNumber, dataRecord, timestampMillis } from "./firestore.js";
import { writeAudit } from "./audit.js";

interface PaymentEventInput {
  eventId: string;
  holdId?: string;
  reservationId?: string;
  status: string;
  amount?: number;
  currency?: string;
  paymentReference?: string;
}

interface PaymentResult {
  duplicate: boolean;
  status: "PAID" | "FAILED" | "REFUND_REQUIRED";
  reservationId?: string;
  refundRequired: boolean;
}

function parseAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parsePaymentInput(value: unknown): PaymentEventInput {
  const record = asRecord(value, "payment event");
  const nested = record.data && typeof record.data === "object" && !Array.isArray(record.data)
    ? dataRecord(record.data)
    : record;
  const eventIdValue = record.id ?? record.eventId ?? record.event_id ?? nested.id ?? nested.eventId;
  if (typeof eventIdValue !== "string" || eventIdValue.length < 1 || eventIdValue.length > 200) {
    throw new AppError("invalid-argument", "Payment event id is required");
  }
  const statusValue = record.status ?? record.eventType ?? record.type ?? nested.status ?? nested.eventType ?? nested.type;
  const status = stringValue(statusValue).toLowerCase();
  if (!status) throw new AppError("invalid-argument", "Payment status is required");
  const holdIdValue = record.holdId ?? record.hold_id ?? nested.holdId ?? nested.hold_id;
  const reservationIdValue = record.reservationId ?? record.reservation_id ?? nested.reservationId ?? nested.reservation_id;
  const holdId = holdIdValue === undefined || holdIdValue === null ? undefined : requiredId({ holdId: stringValue(holdIdValue) }, "holdId");
  const reservationId = reservationIdValue === undefined || reservationIdValue === null
    ? undefined
    : requiredId({ reservationId: stringValue(reservationIdValue) }, "reservationId");
  if (!holdId && !reservationId) throw new AppError("invalid-argument", "holdId or reservationId is required");
  const amount = parseAmount(record.amount ?? nested.amount);
  const currencyValue = record.currency ?? nested.currency;
  const currency = currencyValue === undefined || currencyValue === null ? undefined : stringValue(currencyValue).toUpperCase();
  if (currency !== undefined && !/^[A-Z]{3}$/.test(currency)) throw new AppError("invalid-argument", "currency is invalid");
  const paymentReferenceValue = record.paymentReference ?? record.payment_reference ?? nested.paymentReference ?? nested.payment_reference;
  const paymentReference = paymentReferenceValue === undefined || paymentReferenceValue === null
    ? undefined
    : stringValue(paymentReferenceValue).slice(0, 256);
  return {
    eventId: eventIdValue,
    ...(holdId ? { holdId } : {}),
    ...(reservationId ? { reservationId } : {}),
    status,
    ...(amount === undefined ? {} : { amount }),
    ...(currency ? { currency } : {}),
    ...(paymentReference ? { paymentReference } : {})
  };
}

function verifySignature(raw: Buffer, header: string | undefined, secret: string): void {
  if (!header) throw new AppError("permission-denied", "Payment signature is required", 401);
  const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signaturePart = parts.find((part) => part.startsWith("v1=")) ?? (parts.length === 1 ? parts[0] : undefined);
  if (!signaturePart) throw new AppError("permission-denied", "Payment signature is invalid", 401);
  const timestamp = timestampPart?.slice(2);
  if (timestamp !== undefined) {
    const timestampNumber = Number(timestamp);
    if (!Number.isInteger(timestampNumber)) throw new AppError("permission-denied", "Payment signature timestamp is invalid", 401);
    const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
    if (age > runtimeConfig.paymentSignatureToleranceSeconds) {
      throw new AppError("permission-denied", "Payment signature timestamp is outside the allowed window", 401);
    }
  }
  const signedPayload = timestamp === undefined ? raw : Buffer.from(`${timestamp}.`, "utf8");
  const payload = timestamp === undefined ? signedPayload : Buffer.concat([signedPayload, raw]);
  const expectedHex = hmacSha256(secret, payload, "hex");
  const expectedBase64 = hmacSha256(secret, payload, "base64url");
  const supplied = signaturePart
    .replace(/^v1=/i, "")
    .replace(/^sha256=/i, "");
  const matchesHex = safeEqual(expectedHex, supplied.toLowerCase());
  const matchesBase64 = safeEqual(expectedBase64, supplied);
  if (!matchesHex && !matchesBase64) throw new AppError("permission-denied", "Payment signature is invalid", 401);
}

function statusKind(status: string): "PAID" | "FAILED" {
  const normalized = status.toLowerCase();
  if (["paid", "succeeded", "success", "completed", "confirmed", "settled"].includes(normalized)) return "PAID";
  if (["failed", "failure", "declined", "canceled", "cancelled", "expired"].includes(normalized)) return "FAILED";
  throw new AppError("invalid-argument", "Payment status is not supported");
}

async function resolveHoldId(input: PaymentEventInput): Promise<string | undefined> {
  if (input.holdId) return input.holdId;
  if (!input.reservationId) return undefined;
  const snapshot = await db.collection("holds")
    .where("reservationId", "==", input.reservationId)
    .limit(1)
    .get();
  return snapshot.empty ? undefined : snapshot.docs[0]?.id;
}

export async function processPaymentWebhook(raw: Buffer, signatureHeader: string | undefined): Promise<PaymentResult> {
  let secret: string;
  try {
    secret = paymentWebhookSecret();
  } catch {
    throw new AppError("failed-precondition", "Payment webhook is not configured", 503);
  }
  verifySignature(raw, signatureHeader, secret);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new AppError("invalid-argument", "Payment body must be valid JSON");
  }
  const input = parsePaymentInput(parsed);
  const kind = statusKind(input.status);
  const holdId = await resolveHoldId(input);
  const eventReference = db.collection("paymentEvents").doc(sha256(input.eventId).slice(0, 48));
  const financialReference = db.collection("financialRecords").doc(sha256(input.eventId).slice(0, 48));
  const bodyHash = sha256(raw);
  let auditBusinessId = "unknown";
  const result = await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventReference);
    if (eventSnapshot.exists) {
      const existing = dataRecord(eventSnapshot.data());
      return {
        duplicate: true,
        status: existing.resultStatus === "PAID" || existing.resultStatus === "FAILED"
          ? existing.resultStatus
          : "REFUND_REQUIRED",
        refundRequired: existing.resultStatus === "REFUND_REQUIRED",
        ...(typeof existing.reservationId === "string" ? { reservationId: existing.reservationId } : {})
      } satisfies PaymentResult;
    }
    const holdReference = holdId ? db.collection("holds").doc(holdId) : undefined;
    const holdSnapshot = holdReference ? await transaction.get(holdReference) : undefined;
    const hold = holdSnapshot?.exists ? dataRecord(holdSnapshot.data()) : undefined;
    const now = Date.now();
    const holdExpiry = hold ? timestampMillis(hold.expiresAt) : undefined;
    const resourceId = typeof hold?.resourceId === "string" ? hold.resourceId : undefined;
    const businessId = typeof hold?.businessId === "string" ? hold.businessId : stringValue(recordBusinessId(parsed), "unknown");
    auditBusinessId = businessId;
    const resourceReference = businessId !== "unknown" && resourceId
      ? db.collection("businesses").doc(businessId).collection("resources").doc(resourceId)
      : undefined;
    const resourceSnapshot = resourceReference ? await transaction.get(resourceReference) : undefined;
    const resource = resourceSnapshot?.exists ? dataRecord(resourceSnapshot.data()) : undefined;
    const active = Boolean(
      hold &&
      resource &&
      (hold.state === "HELD" || hold.state === "PAYMENT_PENDING") &&
      holdExpiry !== undefined &&
      holdExpiry > now &&
      resource.activeHoldId === holdId
    );
    const amountMatches = input.amount === undefined || hold === undefined || Math.abs(input.amount - (dataNumber(hold, "amount") ?? input.amount)) < 0.000001;
    const currencyMatches = input.currency === undefined || hold === undefined || input.currency === stringValue(hold.currency, "USD").toUpperCase();
    let resultStatus: PaymentResult["status"] = kind;
    let refundRequired = false;
    let reservationId = input.reservationId;
    if (kind === "PAID" && (!active || !amountMatches || !currencyMatches)) {
      resultStatus = "REFUND_REQUIRED";
      refundRequired = true;
    }
    let reservationReference: DocumentReference | undefined;
    let existingReservation: DocumentSnapshot | undefined;
    if (resultStatus === "PAID" && hold && holdReference && resourceReference) {
      reservationId = reservationId ?? `res_${sha256(holdId as string).slice(0, 40)}`;
      reservationReference = db.collection("businesses").doc(businessId).collection("reservations").doc(reservationId);
      existingReservation = await transaction.get(reservationReference);
    }
    if (hold && holdReference) {
      const update: Record<string, unknown> = {
        paymentState: resultStatus === "PAID" ? "PAID" : resultStatus === "FAILED" ? "FAILED" : "REFUND_REQUIRED",
        paymentReference: input.paymentReference ?? null,
        lastPaymentEventIdHash: sha256(input.eventId),
        updatedAt: FieldValue.serverTimestamp()
      };
      if (resultStatus === "PAID") {
        update.state = "CONFIRMED";
        update.confirmedAt = FieldValue.serverTimestamp();
        update.confirmedBy = "payment_webhook";
        if (reservationId) update.reservationId = reservationId;
      } else if (resultStatus === "REFUND_REQUIRED") {
        update.state = "EXPIRED";
        update.refundStatus = "REQUIRED";
        update.refundRequiredAt = FieldValue.serverTimestamp();
      } else if (hold.state !== "CONFIRMED") {
        update.state = "EXPIRED";
      }
      transaction.update(holdReference, update);
      if (resourceReference && resource && resource.activeHoldId === holdId && resultStatus !== "PAID") {
        transaction.set(resourceReference, {
          status: "AVAILABLE",
          activeHoldId: FieldValue.delete(),
          holdTokenHash: FieldValue.delete(),
          holdExpiresAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
    if (resultStatus === "PAID" && hold && holdReference && resourceReference && reservationReference) {
      const reservationData = {
        reservationId,
        businessId: stringValue(hold.businessId),
        eventId: stringValue(hold.eventId),
        resourceId: stringValue(hold.resourceId),
        customerUid: hold.customerUid ?? null,
        holdId,
        amount: dataNumber(hold, "amount") ?? 0,
        currency: stringValue(hold.currency, "USD"),
        status: "CONFIRMED",
        paymentState: "PAID",
        paymentStatus: "paid",
        paymentReference: input.paymentReference ?? null,
        qrTokenHash: hashToken(randomId("qr")),
        confirmedAt: FieldValue.serverTimestamp(),
        createdAt: existingReservation?.exists ? existingReservation.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      transaction.set(reservationReference, reservationData, { merge: true });
      transaction.set(resourceReference, {
        status: "CONFIRMED",
        activeReservationId: reservationId,
        activeHoldId: FieldValue.delete(),
        holdTokenHash: FieldValue.delete(),
        holdExpiresAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    transaction.set(eventReference, {
      eventIdHash: sha256(input.eventId),
      idempotencyKeyHash: sha256(input.eventId),
      bodyHash,
      businessId,
      holdId: holdId ?? null,
      reservationId: reservationId ?? null,
      paymentReference: input.paymentReference ?? null,
      receivedStatus: input.status,
      resultStatus,
      refundRequired,
      createdAt: FieldValue.serverTimestamp(),
      processedAt: FieldValue.serverTimestamp()
    });
    transaction.set(financialReference, {
      recordId: financialReference.id,
      businessId,
      type: "PAYMENT",
      status: resultStatus,
      amount: input.amount ?? dataNumber(hold ?? {}, "amount") ?? 0,
      currency: input.currency ?? stringValue(hold?.currency, "USD"),
      reservationId: reservationId ?? null,
      customerUid: hold?.customerUid ?? null,
      holdId: holdId ?? null,
      paymentReference: input.paymentReference ?? null,
      paymentEventIdHash: sha256(input.eventId),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { duplicate: false, status: resultStatus, refundRequired, ...(reservationId ? { reservationId } : {}) } satisfies PaymentResult;
  });
  await writeAudit(
    result.duplicate ? "payment.webhook_duplicate" : "payment.webhook_processed",
    "paymentEvent",
    eventReference.id,
    { ...(auditBusinessId === "unknown" ? {} : { businessId: auditBusinessId }), actorRole: "payment_webhook" },
    { resultStatus: result.status, refundRequired: result.refundRequired }
  );
  return result;
}

function recordBusinessId(value: unknown): string {
  const record = asRecord(value, "payment event");
  const nested = record.data && typeof record.data === "object" && !Array.isArray(record.data) ? dataRecord(record.data) : record;
  const candidate = record.businessId ?? nested.businessId;
  return typeof candidate === "string" ? candidate : "unknown";
}

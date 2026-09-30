import { FieldValue } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db, optionalEnv, runtimeConfig } from "./config.js";
import { randomId, sha256, stableStringify } from "./crypto.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid } from "./auth.js";
import { asRecord, assertAllowedKeys, optionalString, requiredId, safeReturnPath } from "./validation.js";
import { dataRecord, timestampMillis } from "./firestore.js";
import { writeAudit } from "./audit.js";

export interface PaymentSessionResult {
  holdId: string;
  paymentSessionId: string;
  state: "PAYMENT_PENDING" | "CONFIRMED";
  amount: number;
  currency: string;
  expiresAt: string;
  checkoutUrl: string | null;
  provider: string;
  idempotentReplay: boolean;
}

interface PaymentSessionInput {
  holdId: string;
  holdToken?: string;
  returnUrl?: string;
}

function parseInput(value: unknown): PaymentSessionInput {
  const record = asRecord(value);
  assertAllowedKeys(record, ["holdId", "holdToken", "returnUrl"]);
  const holdId = requiredId(record, "holdId");
  const holdToken = optionalString(record, "holdToken", 20, 256);
  const returnUrl = safeReturnPath(record, "returnUrl");
  return {
    holdId,
    ...(holdToken ? { holdToken } : {}),
    ...(returnUrl ? { returnUrl } : {})
  };
}

function buildCheckoutUrl(provider: string, sessionId: string, holdId: string, returnUrl?: string): string | null {
  const base = optionalEnv("PAYMENT_CHECKOUT_BASE_URL");
  if (provider === "mock") return null;
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("session_id", sessionId);
  url.searchParams.set("hold_id", holdId);
  if (returnUrl) url.searchParams.set("return_url", returnUrl);
  return url.toString();
}

export async function createPaymentSessionFor(request: CallableRequest<unknown>): Promise<PaymentSessionResult> {
  const uid = callableUid(request);
  const input = parseInput(request.data);
  const holdReference = db.collection("holds").doc(input.holdId);
  const paymentSessionId = `ps_${randomId("sess").slice(3, 31)}`;
  const requestHash = sha256(stableStringify({ holdId: input.holdId, returnUrl: input.returnUrl ?? null }));

  const provider = (optionalEnv("PAYMENT_PROVIDER") ?? "none").toLowerCase();
  const result = await db.runTransaction(async (transaction) => {
    const holdSnapshot = await transaction.get(holdReference);
    if (!holdSnapshot.exists) throw new AppError("not-found", "Hold not found", 404);
    const hold = dataRecord(holdSnapshot.data());
    const holdCustomerUid = typeof hold.customerUid === "string" ? hold.customerUid : undefined;
    if (!holdCustomerUid || holdCustomerUid !== uid) {
      throw new AppError("permission-denied", "Only the hold owner can start payment", 403);
    }
    if (hold.state === "CONFIRMED") {
      throw new AppError("failed-precondition", "Hold is already confirmed", 412);
    }
    if (hold.state === "EXPIRED" || hold.state === "CANCELLED") {
      throw new AppError("failed-precondition", "Hold has expired", 412);
    }
    const expiry = timestampMillis(hold.expiresAt);
    if (expiry !== undefined && expiry <= Date.now()) {
      throw new AppError("failed-precondition", "Hold has expired", 412);
    }
    if (hold.paymentState === "PAID") {
      throw new AppError("failed-precondition", "Hold is already paid", 412);
    }
    const existingSessionId = typeof hold.paymentSessionId === "string" ? hold.paymentSessionId : undefined;
    const existingHash = typeof hold.paymentSessionHash === "string" ? hold.paymentSessionHash : undefined;
    if (existingSessionId && hold.state === "PAYMENT_PENDING" && existingHash === requestHash) {
      return {
        idempotentReplay: true,
        paymentSessionId: existingSessionId,
        amount: typeof hold.amount === "number" ? hold.amount : 0,
        currency: typeof hold.currency === "string" ? hold.currency : "USD",
        expiresAt: expiry ?? Date.now() + runtimeConfig.holdDurationSeconds * 1000
      };
    }
    if (hold.state === "HELD") {
      const businessId = typeof hold.businessId === "string" ? hold.businessId : "";
      const resourceId = typeof hold.resourceId === "string" ? hold.resourceId : "";
      if (businessId && resourceId) {
        const resourceReference = db.collection("businesses").doc(businessId).collection("resources").doc(resourceId);
        const resourceSnapshot = await transaction.get(resourceReference);
        if (resourceSnapshot.exists) {
          const resource = dataRecord(resourceSnapshot.data());
          if (resource.activeHoldId !== input.holdId) {
            throw new AppError("failed-precondition", "Hold no longer owns the resource", 412);
          }
        }
      }
    }
    const isPayAtDoor = provider === "none" || provider === "pay_at_door";
    if (isPayAtDoor) {
      const businessId = typeof hold.businessId === "string" ? hold.businessId : "";
      const resourceId = typeof hold.resourceId === "string" ? hold.resourceId : "";
      const customerUid = typeof hold.customerUid === "string" ? hold.customerUid : "";
      const eventId = typeof hold.eventId === "string" ? hold.eventId : "";
      const amount = typeof hold.amount === "number" ? hold.amount : 0;
      const currency = typeof hold.currency === "string" ? hold.currency : "USD";

      if (businessId && resourceId) {
        const resourceReference = db.collection("businesses").doc(businessId).collection("resources").doc(resourceId);
        transaction.update(resourceReference, {
          status: "CONFIRMED",
          activeReservationId: input.holdId,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      if (businessId) {
        const reservationReference = db.collection("businesses").doc(businessId).collection("reservations").doc(input.holdId);
        transaction.set(reservationReference, {
          id: input.holdId,
          holdId: input.holdId,
          businessId,
          eventId,
          resourceId,
          customerUid,
          status: "CONFIRMED",
          paymentProvider: "pay_at_door",
          paymentState: "UNPAID",
          amount,
          currency,
          source: "functions",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      transaction.update(holdReference, {
        state: "CONFIRMED",
        paymentState: "UNPAID",
        paymentSessionId,
        paymentSessionHash: requestHash,
        paymentProvider: "pay_at_door",
        confirmedAt: FieldValue.serverTimestamp(),
        paymentStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      transaction.update(holdReference, {
        state: "PAYMENT_PENDING",
        paymentState: "PENDING",
        paymentSessionId,
        paymentSessionHash: requestHash,
        paymentProvider: provider,
        paymentStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    return {
      idempotentReplay: false,
      paymentSessionId,
      amount: typeof hold.amount === "number" ? hold.amount : 0,
      currency: typeof hold.currency === "string" ? hold.currency : "USD",
      expiresAt: expiry ?? Date.now() + runtimeConfig.holdDurationSeconds * 1000
    };
  });

  const isPayAtDoor = provider === "none" || provider === "pay_at_door";
  const holdSnapshotForAudit = await holdReference.get();
  const auditBusinessId = holdSnapshotForAudit.exists
    ? String(dataRecord(holdSnapshotForAudit.data()).businessId ?? "unknown")
    : "unknown";
  await writeAudit(
    result.idempotentReplay ? "payment.session_replayed" : "payment.session_started",
    "hold",
    input.holdId,
    {
      businessId: auditBusinessId,
      actorUid: uid,
      actorRole: "customer",
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    { paymentSessionId: result.paymentSessionId, provider: isPayAtDoor ? "pay_at_door" : provider }
  );

  return {
    holdId: input.holdId,
    paymentSessionId: result.paymentSessionId,
    state: isPayAtDoor ? "CONFIRMED" : "PAYMENT_PENDING",
    amount: result.amount,
    currency: result.currency,
    expiresAt: new Date(result.expiresAt).toISOString(),
    checkoutUrl: isPayAtDoor ? null : buildCheckoutUrl(provider, result.paymentSessionId, input.holdId, input.returnUrl),
    provider: isPayAtDoor ? "pay_at_door" : provider,
    idempotentReplay: result.idempotentReplay
  };
}

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db, runtimeConfig } from "./config.js";
import { hmacSha256, hashToken, sha256, stableStringify } from "./crypto.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid, getStaffProfile, roleAtLeast } from "./auth.js";
import { asRecord, assertAllowedKeys, optionalId, optionalNumber, optionalString, requiredId, requiredString } from "./validation.js";
import { dataNumber, dataRecord, timestampMillis } from "./firestore.js";
import { writeAudit } from "./audit.js";
import { enqueueReleaseTask } from "./taskQueue.js";
import { holdTokenSecret } from "./config.js";
import { enforceRateLimit } from "./rateLimit.js";

export interface ReservationHoldResult {
  holdId: string;
  holdToken: string;
  businessId: string;
  eventId: string;
  resourceId: string;
  state: "HELD";
  paymentState: "PENDING";
  amount: number;
  currency: string;
  expiresAt: string;
  idempotentReplay: boolean;
}

interface ReservationInput {
  businessId: string;
  eventId: string;
  resourceId: string;
  customerUid: string;
  amount?: number;
  currency: string;
  idempotencyKey: string;
}

function parseInput(value: unknown, authenticatedUid: string): ReservationInput {
  const record = asRecord(value);
  assertAllowedKeys(record, ["businessId", "eventId", "resourceId", "customerUid", "amount", "currency", "idempotencyKey"]);
  const businessId = requiredId(record, "businessId");
  const eventId = requiredId(record, "eventId");
  const resourceId = requiredId(record, "resourceId");
  const customerUid = optionalId(record, "customerUid") ?? authenticatedUid;
  if (record.customerUid !== undefined && record.customerUid !== authenticatedUid) {
    throw new AppError("permission-denied", "customerUid must match the authenticated user", 403);
  }
  const amount = optionalNumber(record, "amount", 0, 10_000_000);
  const currency = (optionalString(record, "currency", 3, 3) ?? "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new AppError("invalid-argument", "currency is invalid");
  const idempotencyKey = requiredString(record, "idempotencyKey", 8, 256);
  return {
    businessId,
    eventId,
    resourceId,
    customerUid,
    ...(amount === undefined ? {} : { amount }),
    currency,
    idempotencyKey
  };
}

function requestHash(input: ReservationInput): string {
  return sha256(stableStringify({
    businessId: input.businessId,
    eventId: input.eventId,
    resourceId: input.resourceId,
    customerUid: input.customerUid,
    amount: input.amount ?? null,
    currency: input.currency
  }));
}

function tokenForHold(holdId: string): string {
  return hmacSha256(holdTokenSecret(), holdId, "base64url");
}

function resourceAmount(data: Record<string, unknown>, requested: number | undefined): number {
  const configured = dataNumber(data, "holdAmount") ?? dataNumber(data, "depositRequired") ?? dataNumber(data, "price") ?? dataNumber(data, "amount");
  if (configured === undefined || !Number.isFinite(configured) || configured < 0 || configured > 10_000_000) {
    throw new AppError("failed-precondition", "Resource pricing is not configured", 412);
  }
  if (requested !== undefined && Number.isFinite(requested) && Math.abs(requested - configured) > 0.01) {
    throw new AppError("invalid-argument", `Requested amount (${requested}) does not match configured price (${configured})`, 400);
  }
  return configured;
}

function isHeldState(value: unknown): boolean {
  return value === "HELD" || value === "PAYMENT_PENDING";
}

export async function createReservationHoldFor(request: CallableRequest<unknown>): Promise<ReservationHoldResult> {
  const authenticatedUid = callableUid(request);
  const input = parseInput(request.data, authenticatedUid);
  await enforceRateLimit("hold-create", [input.customerUid, input.businessId, input.resourceId], 10, 60);
  const businessReference = db.collection("businesses").doc(input.businessId);
  const resourceReference = businessReference.collection("resources").doc(input.resourceId);
  const holdId = `hold_${sha256(`${input.businessId}:${input.customerUid}:${input.idempotencyKey}`).slice(0, 40)}`;
  const holdReference = db.collection("holds").doc(holdId);
  const holdToken = tokenForHold(holdId);
  const expiresAt = Timestamp.fromMillis(Date.now() + runtimeConfig.holdDurationSeconds * 1000);
  const inputRequestHash = requestHash(input);
  const transactionResult = await db.runTransaction(async (transaction) => {
    const [businessSnapshot, resourceSnapshot, holdSnapshot] = await Promise.all([
      transaction.get(businessReference),
      transaction.get(resourceReference),
      transaction.get(holdReference)
    ]);
    if (!businessSnapshot.exists) throw new AppError("not-found", "Business not found", 404);
    const business = dataRecord(businessSnapshot.data());
    const status = typeof business.status === "string" ? business.status.toLowerCase() : "";
    if (status !== "active" && status !== "trial") throw new AppError("failed-precondition", "Business is not active", 412);
    if (holdSnapshot.exists) {
      const existing = dataRecord(holdSnapshot.data());
      if (existing.requestHash !== inputRequestHash) {
        throw new AppError("already-exists", "Idempotency key was already used with different data", 409);
      }
      return {
        replay: true,
        enqueueNeeded: runtimeConfig.cloudTasksQueue !== undefined && existing.releaseTaskEnqueued !== true,
        amount: dataNumber(existing, "amount") ?? input.amount ?? 0,
        expiresAt: timestampMillis(existing.expiresAt) ?? expiresAt.toMillis()
      };
    }
    if (!resourceSnapshot.exists) throw new AppError("not-found", "Reservation resource not found", 404);
    const resource = dataRecord(resourceSnapshot.data());
    if (resource.active === false || resource.isActive === false) {
      throw new AppError("failed-precondition", "Reservation resource is inactive", 412);
    }
    if (resource.eventId !== undefined && resource.eventId !== input.eventId) {
      throw new AppError("failed-precondition", "Resource is not assigned to this event", 412);
    }
    if (resource.status === "CONFIRMED" || resource.status === "CHECKED_IN") {
      throw new AppError("resource-exhausted", "Resource is already reserved", 409);
    }
    const now = Date.now();
    const activeHoldId = typeof resource.activeHoldId === "string" ? resource.activeHoldId : undefined;
    if (activeHoldId) {
      const activeHoldReference = db.collection("holds").doc(activeHoldId);
      const activeHoldSnapshot = await transaction.get(activeHoldReference);
      if (activeHoldSnapshot.exists) {
        const activeHold = dataRecord(activeHoldSnapshot.data());
        const activeExpiry = timestampMillis(activeHold.expiresAt);
        if (isHeldState(activeHold.state) && activeExpiry !== undefined && activeExpiry > now) {
          throw new AppError("resource-exhausted", "Resource is currently held by another session", 409);
        }
        if (activeHold.state === "CONFIRMED") {
          throw new AppError("resource-exhausted", "Resource is already reserved", 409);
        }
        transaction.update(activeHoldReference, {
          state: "EXPIRED",
          releasedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
    const amount = resourceAmount(resource, input.amount);
    transaction.set(holdReference, {
      holdId,
      businessId: input.businessId,
      eventId: input.eventId,
      resourceId: input.resourceId,
      customerUid: input.customerUid,
      holdTokenHash: hashToken(holdToken),
      idempotencyKeyHash: sha256(input.idempotencyKey),
      requestHash: inputRequestHash,
      state: "HELD",
      paymentState: "PENDING",
      amount,
      currency: input.currency,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      releaseTaskEnqueued: false
    });
    transaction.set(resourceReference, {
      status: "HELD",
      activeHoldId: holdId,
      holdTokenHash: hashToken(holdToken),
      holdExpiresAt: expiresAt,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return { replay: false, enqueueNeeded: runtimeConfig.cloudTasksQueue !== undefined, amount, expiresAt: expiresAt.toMillis() };
  });
  let taskScheduled = false;
  if (transactionResult.enqueueNeeded) {
    taskScheduled = await enqueueReleaseTask({ holdId, businessId: input.businessId, expiresAt: new Date(transactionResult.expiresAt).toISOString() });
    await holdReference.update({ releaseTaskEnqueued: taskScheduled, updatedAt: FieldValue.serverTimestamp() });
  }
  await writeAudit(
    transactionResult.replay ? "reservation.hold_replayed" : "reservation.hold_created",
    "hold",
    holdId,
    {
      businessId: input.businessId,
      actorUid: authenticatedUid,
      actorRole: "customer",
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    { eventId: input.eventId, resourceId: input.resourceId, taskScheduled }
  );
  return {
    holdId,
    holdToken,
    businessId: input.businessId,
    eventId: input.eventId,
    resourceId: input.resourceId,
    state: "HELD",
    paymentState: "PENDING",
    amount: transactionResult.amount,
    currency: input.currency,
    expiresAt: new Date(transactionResult.expiresAt).toISOString(),
    idempotentReplay: transactionResult.replay
  };
}

export interface ReleaseResult {
  holdId: string;
  released: boolean;
  state: string;
  reason?: string;
}

export async function releaseHoldById(holdId: string, expectedTokenHash?: string, onlyIfExpired = false): Promise<ReleaseResult> {
  const reference = db.collection("holds").doc(holdId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return { holdId, released: false, state: "NOT_FOUND" };
    const hold = dataRecord(snapshot.data());
    if (expectedTokenHash && hold.holdTokenHash !== expectedTokenHash) {
      throw new AppError("permission-denied", "Hold token is invalid", 403);
    }
    if (hold.state === "CONFIRMED") return { holdId, released: false, state: "CONFIRMED" };
    if (hold.state === "EXPIRED" || hold.state === "CANCELLED") {
      return { holdId, released: false, state: hold.state };
    }
    const expiry = timestampMillis(hold.expiresAt);
    if (onlyIfExpired && expiry !== undefined && expiry > Date.now()) {
      return { holdId, released: false, state: "HELD", reason: "NOT_EXPIRED" };
    }
    const businessId = typeof hold.businessId === "string" ? hold.businessId : "";
    const resourceId = typeof hold.resourceId === "string" ? hold.resourceId : "";
    if (businessId && resourceId) {
      const resourceReference = db.collection("businesses").doc(businessId).collection("resources").doc(resourceId);
      const resourceSnapshot = await transaction.get(resourceReference);
      if (resourceSnapshot.exists) {
        const resource = dataRecord(resourceSnapshot.data());
        if (resource.activeHoldId === holdId) {
          transaction.set(resourceReference, {
            status: "AVAILABLE",
            activeHoldId: FieldValue.delete(),
            holdTokenHash: FieldValue.delete(),
            holdExpiresAt: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
    }
    transaction.update(reference, {
      state: "EXPIRED",
      releasedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { holdId, released: true, state: "EXPIRED" };
  });
}

export async function releaseHoldFor(request: CallableRequest<unknown>): Promise<ReleaseResult> {
  const uid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["holdId", "holdToken"]);
  const holdId = requiredId(record, "holdId");
  const holdToken = requiredString(record, "holdToken", 20, 256);
  const holdSnapshot = await db.collection("holds").doc(holdId).get();
  if (!holdSnapshot.exists) throw new AppError("not-found", "Hold not found", 404);
  const hold = dataRecord(holdSnapshot.data());
  const businessId = typeof hold.businessId === "string" ? hold.businessId : "";
  if (hold.customerUid !== uid) await getStaffProfile(uid, businessId).then((profile) => {
    if (!profile || profile.status !== "ACTIVE" || !roleAtLeast(profile.role, "manager")) {
      throw new AppError("permission-denied", "Only the hold owner or business manager can release it", 403);
    }
  });
  const result = await releaseHoldById(holdId, hashToken(holdToken), false);
  await writeAudit("reservation.hold_released", "hold", holdId, {
    businessId,
    actorUid: uid,
    actorRole: "customer",
    requestId: getRequestId(request.rawRequest),
    ip: getClientIp(request.rawRequest)
  }, { released: result.released });
  return result;
}

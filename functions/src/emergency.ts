import { FieldValue } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid, requireStaff, type StaffRole } from "./auth.js";
import { asRecord, assertAllowedKeys, optionalId, requiredId, requiredString } from "./validation.js";
import { dataRecord } from "./firestore.js";
import { revokeBusinessSessionsForScope } from "./sessions.js";
import { writeAudit } from "./audit.js";

type EmergencyScope = "DEVICE" | "EVENT" | "BUSINESS";

interface EmergencyInput {
  businessId: string;
  scope: EmergencyScope;
  eventId?: string;
  deviceId?: string;
  reason: string;
}

const minimumRole: Record<EmergencyScope, StaffRole> = {
  DEVICE: "door",
  EVENT: "manager",
  BUSINESS: "owner"
};

function parseInput(value: unknown): EmergencyInput {
  const record = asRecord(value);
  assertAllowedKeys(record, ["businessId", "scope", "eventId", "deviceId", "reason"]);
  const businessId = requiredId(record, "businessId");
  const scopeValue = requiredString(record, "scope", 6, 20).toUpperCase();
  if (scopeValue !== "DEVICE" && scopeValue !== "EVENT" && scopeValue !== "BUSINESS") {
    throw new AppError("invalid-argument", "scope is invalid");
  }
  const scope = scopeValue as EmergencyScope;
  const eventId = scope === "EVENT" ? requiredId(record, "eventId") : optionalId(record, "eventId");
  const deviceId = scope === "DEVICE" ? requiredString(record, "deviceId", 3, 128) : optionalStringDevice(record);
  if (scope === "DEVICE" && !deviceId) throw new AppError("invalid-argument", "deviceId is required");
  const reason = requiredString(record, "reason", 3, 500);
  return {
    businessId,
    scope,
    ...(eventId ? { eventId } : {}),
    ...(deviceId ? { deviceId } : {}),
    reason
  };
}

function optionalStringDevice(record: Record<string, unknown>): string | undefined {
  const value = record.deviceId;
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(value)) {
    throw new AppError("invalid-argument", "deviceId is invalid");
  }
  return value;
}

export async function emergencyRevokeFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>> {
  const uid = callableUid(request);
  const input = parseInput(request.data);
  const staff = await requireStaff(uid, input.businessId, minimumRole[input.scope]);
  if (input.scope === "DEVICE" && staff.role === "door" && !staff.deviceIds.includes(input.deviceId ?? "")) {
    throw new AppError("permission-denied", "Door staff can only revoke enrolled devices", 403);
  }
  const businessReference = db.collection("businesses").doc(input.businessId);
  const result = await db.runTransaction(async (transaction) => {
    const businessSnapshot = await transaction.get(businessReference);
    if (!businessSnapshot.exists) throw new AppError("not-found", "Business not found", 404);
    const business = dataRecord(businessSnapshot.data());
    const previous = business.emergencyRevocation;
    const previousRecord = previous && typeof previous === "object" && !Array.isArray(previous) ? dataRecord(previous) : {};
    const version = (typeof previousRecord.version === "number" ? previousRecord.version : 0) + 1;
    const eventReference = input.scope === "EVENT" && input.eventId
      ? businessReference.collection("events").doc(input.eventId)
      : undefined;
    const eventSnapshot = eventReference ? await transaction.get(eventReference) : undefined;
    const revocation = {
      version,
      scope: input.scope,
      eventId: input.eventId ?? null,
      deviceId: input.deviceId ?? null,
      revokedBefore: new Date().toISOString(),
      reason: input.reason,
      actorUid: uid,
      actorRole: staff.role,
      eventCanceled: input.scope === "EVENT" || input.scope === "BUSINESS",
      createdAt: FieldValue.serverTimestamp()
    };
    transaction.update(businessReference, {
      emergencyRevocation: revocation,
      emergencyRevocationVersion: version,
      updatedAt: FieldValue.serverTimestamp()
    });
    if (eventReference && eventSnapshot?.exists) {
      transaction.update(eventReference, {
          canceled: true,
          canceledAt: FieldValue.serverTimestamp(),
          cancellationReason: input.reason,
          revocationVersion: version,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    if (input.scope === "DEVICE" && input.deviceId) {
      const deviceReference = businessReference.collection("devices").doc(input.deviceId);
      transaction.set(deviceReference, {
        businessId: input.businessId,
        deviceId: input.deviceId,
        active: false,
        revokedAt: FieldValue.serverTimestamp(),
        revokedBefore: revocation.revokedBefore,
        revocationVersion: version,
        actorUid: uid,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    return { version };
  });
  const revokedSessions = await revokeBusinessSessionsForScope(
    input.businessId,
    input.scope,
    { ...(input.deviceId ? { deviceId: input.deviceId } : {}), ...(input.eventId ? { eventId: input.eventId } : {}) },
    result.version
  );
  await writeAudit("emergency.revoke", "business", input.businessId, {
    businessId: input.businessId,
    actorUid: uid,
    actorRole: staff.role,
    requestId: getRequestId(request.rawRequest),
    ip: getClientIp(request.rawRequest)
  }, { scope: input.scope, eventId: input.eventId ?? null, deviceId: input.deviceId ?? null, version: result.version, revokedSessions });
  return {
    businessId: input.businessId,
    scope: input.scope,
    eventId: input.eventId ?? null,
    deviceId: input.deviceId ?? null,
    version: result.version,
    revokedSessions,
    eventCanceled: input.scope === "EVENT" || input.scope === "BUSINESS"
  };
}

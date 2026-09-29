import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { auth, db, runtimeConfig } from "./config.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid, getStaffProfile, roleAtLeast } from "./auth.js";
import { asRecord, assertAllowedKeys, requiredId, requiredString } from "./validation.js";
import { dataRecord } from "./firestore.js";
import { randomId } from "./crypto.js";
import { writeAudit } from "./audit.js";
const roles = ["owner", "manager", "door", "finance"];
function parseInput(value) {
    const record = asRecord(value);
    assertAllowedKeys(record, ["businessId", "role", "deviceId", "eventId"]);
    const businessId = requiredId(record, "businessId");
    const roleValue = requiredString(record, "role", 4, 20).toLowerCase();
    if (!roles.includes(roleValue))
        throw new AppError("invalid-argument", "role is invalid");
    const deviceId = requiredString(record, "deviceId", 3, 128);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(deviceId))
        throw new AppError("invalid-argument", "deviceId is invalid");
    const eventId = record.eventId === undefined ? undefined : requiredId(record, "eventId");
    return {
        businessId,
        role: roleValue,
        deviceId,
        ...(eventId ? { eventId } : {})
    };
}
export async function createBusinessSessionFor(request) {
    const uid = callableUid(request);
    const input = parseInput(request.data);
    const businessSnapshot = await db.collection("businesses").doc(input.businessId).get();
    if (!businessSnapshot.exists)
        throw new AppError("not-found", "Business not found", 404);
    const business = dataRecord(businessSnapshot.data());
    const status = typeof business.status === "string" ? business.status.toLowerCase() : "";
    if (status !== "active" && status !== "trial")
        throw new AppError("failed-precondition", "Business is not active", 412);
    const staff = await getStaffProfile(uid, input.businessId);
    if (!staff || staff.status !== "ACTIVE")
        throw new AppError("permission-denied", "Active business staff access is required", 403);
    if (input.role !== staff.role && !(staff.role === "owner" && roleAtLeast(staff.role, input.role))) {
        throw new AppError("permission-denied", "Requested role exceeds staff permissions", 403);
    }
    if (staff.deviceIds.length > 0 && !staff.deviceIds.includes(input.deviceId)) {
        throw new AppError("permission-denied", "Device is not enrolled for this staff account", 403);
    }
    const sessionId = randomId("business_session");
    const expiresAt = Timestamp.fromMillis(Date.now() + runtimeConfig.sessionDurationSeconds * 1000);
    const sessionReference = db.collection("businessSessions").doc(sessionId);
    await sessionReference.set({
        sessionId,
        businessId: input.businessId,
        uid,
        role: input.role,
        deviceId: input.deviceId,
        eventId: input.eventId ?? null,
        status: "ACTIVE",
        issuedAt: FieldValue.serverTimestamp(),
        expiresAt,
        revokedAt: null,
        createdAt: FieldValue.serverTimestamp()
    });
    let token;
    try {
        token = await auth.createCustomToken(uid, {
            platformRole: "tenant_staff",
            claimsVersion: 2
        });
    }
    catch {
        await sessionReference.update({ status: "REVOKED", revokedAt: FieldValue.serverTimestamp() });
        throw new AppError("unavailable", "Business session could not be created", 503);
    }
    await writeAudit("business_session.created", "businessSession", sessionId, {
        businessId: input.businessId,
        actorUid: uid,
        actorRole: input.role,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, { deviceId: input.deviceId, expiresAt: expiresAt.toDate().toISOString() });
    return {
        sessionId,
        token,
        businessId: input.businessId,
        role: input.role,
        deviceId: input.deviceId,
        expiresAt: expiresAt.toDate().toISOString()
    };
}
export async function revokeBusinessSessionsForScope(businessId, scope, target, version) {
    const snapshot = await db.collection("businessSessions").where("businessId", "==", businessId).limit(500).get();
    const batch = db.batch();
    let count = 0;
    for (const document of snapshot.docs) {
        const data = dataRecord(document.data());
        const matches = scope === "BUSINESS"
            || (scope === "DEVICE" && data.deviceId === target.deviceId)
            || (scope === "EVENT" && data.eventId === target.eventId);
        if (matches && data.status === "ACTIVE") {
            batch.update(document.ref, {
                status: "REVOKED",
                revokedAt: FieldValue.serverTimestamp(),
                revocationVersion: version,
                updatedAt: FieldValue.serverTimestamp()
            });
            count += 1;
        }
    }
    if (count > 0)
        await batch.commit();
    return count;
}
//# sourceMappingURL=sessions.js.map
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { asRecord } from "./validation.js";
const roleRank = {
    door: 1,
    finance: 2,
    manager: 3,
    owner: 4
};
export function callableUid(request) {
    const uid = request.auth?.uid;
    if (!uid)
        throw new AppError("unauthenticated", "Authentication is required", 401);
    return uid;
}
export function roleAtLeast(role, minimum) {
    return roleRank[role] >= roleRank[minimum];
}
export function isStaffRole(value) {
    return value === "owner" || value === "manager" || value === "door" || value === "finance";
}
export async function getStaffProfile(uid, businessId) {
    const snapshot = await db.collection("businesses").doc(businessId).collection("staff").doc(uid).get();
    if (!snapshot.exists)
        return null;
    const data = asRecord(snapshot.data(), "staff profile");
    if (!isStaffRole(data.role))
        return null;
    const deviceIds = Array.isArray(data.deviceIds)
        ? data.deviceIds.filter((value) => typeof value === "string")
        : [];
    const status = data.status === "ACTIVE" || data.status === "SUSPENDED" || data.status === "REVOKED"
        ? data.status
        : "REVOKED";
    return { uid, businessId, role: data.role, status, deviceIds };
}
export async function requireStaff(uid, businessId, minimumRole = "door") {
    const profile = await getStaffProfile(uid, businessId);
    if (!profile || profile.status !== "ACTIVE") {
        throw new AppError("permission-denied", "Active business staff access is required", 403);
    }
    if (!roleAtLeast(profile.role, minimumRole)) {
        throw new AppError("permission-denied", "Insufficient business role", 403);
    }
    return profile;
}
export async function isSuperAdmin(uid) {
    const snapshot = await db.collection("users").doc(uid).get();
    return snapshot.exists && snapshot.data()?.superAdmin === true;
}
//# sourceMappingURL=auth.js.map
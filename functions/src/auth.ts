import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { asRecord } from "./validation.js";

export type StaffRole = "owner" | "manager" | "door" | "finance";

export interface StaffProfile {
  uid: string;
  businessId: string;
  role: StaffRole;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  deviceIds: string[];
}

const roleRank: Record<StaffRole, number> = {
  door: 1,
  finance: 2,
  manager: 3,
  owner: 4
};

export function callableUid(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) throw new AppError("unauthenticated", "Authentication is required", 401);
  return uid;
}

export function roleAtLeast(role: StaffRole, minimum: StaffRole): boolean {
  return roleRank[role] >= roleRank[minimum];
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "owner" || value === "manager" || value === "door" || value === "finance";
}

export async function getStaffProfile(uid: string, businessId: string): Promise<StaffProfile | null> {
  const snapshot = await db.collection("businesses").doc(businessId).collection("staff").doc(uid).get();
  if (!snapshot.exists) return null;
  const data = asRecord(snapshot.data(), "staff profile");
  if (!isStaffRole(data.role)) return null;
  const deviceIds = Array.isArray(data.deviceIds)
    ? data.deviceIds.filter((value): value is string => typeof value === "string")
    : [];
  const status = data.status === "ACTIVE" || data.status === "SUSPENDED" || data.status === "REVOKED"
    ? data.status
    : "REVOKED";
  return { uid, businessId, role: data.role, status, deviceIds };
}

export async function requireStaff(
  uid: string,
  businessId: string,
  minimumRole: StaffRole = "door"
): Promise<StaffProfile> {
  const profile = await getStaffProfile(uid, businessId);
  if (!profile || profile.status !== "ACTIVE") {
    throw new AppError("permission-denied", "Active business staff access is required", 403);
  }
  if (!roleAtLeast(profile.role, minimumRole)) {
    throw new AppError("permission-denied", "Insufficient business role", 403);
  }
  return profile;
}

export async function isSuperAdmin(uid: string): Promise<boolean> {
  const snapshot = await db.collection("users").doc(uid).get();
  return snapshot.exists && snapshot.data()?.superAdmin === true;
}

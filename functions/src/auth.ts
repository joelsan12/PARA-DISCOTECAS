import type { CallableRequest } from "firebase-functions/v2/https";
import { auth, db } from "./config.js";
import { AppError } from "./errors.js";
import { asRecord } from "./validation.js";

export type StaffRole = "owner" | "manager" | "door" | "finance" | "waiter";

export interface StaffProfile {
  uid: string;
  businessId: string;
  role: StaffRole;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  deviceIds: string[];
}

const roleRank: Record<StaffRole, number> = {
  waiter: 0,
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
  return value === "owner" || value === "manager" || value === "door" || value === "finance" || value === "waiter";
}

export async function isSuperAdmin(uid: string): Promise<boolean> {
  try {
    const snapshot = await db.collection("users").doc(uid).get();
    if (snapshot.exists) {
      const data = snapshot.data();
      if (
        data?.superAdmin === true ||
        data?.platformRole === "superadmin" ||
        (typeof data?.email === "string" && data.email.toLowerCase() === "superadmin@nightflow.vip")
      ) {
        return true;
      }
    }

    const userAuth = await auth.getUser(uid).catch(() => null);
    if (userAuth) {
      if (userAuth.customClaims?.platformRole === "superadmin") return true;
      if (userAuth.email?.toLowerCase() === "superadmin@nightflow.vip") return true;
    }
  } catch {
    // Retornar false ante fallo
  }
  return false;
}

export async function getStaffProfile(uid: string, businessId: string): Promise<StaffProfile | null> {
  const snapshot = await db.collection("businesses").doc(businessId).collection("staff").doc(uid).get();
  if (snapshot.exists) {
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

  // Fallback: verificar si el usuario es el propietario registrado en el documento principal del negocio
  try {
    const bizSnap = await db.collection("businesses").doc(businessId).get();
    if (bizSnap.exists) {
      const bData = bizSnap.data();
      if (bData?.ownerUid === uid) {
        return { uid, businessId, role: "owner", status: "ACTIVE", deviceIds: [] };
      }
    }
  } catch {
    // Continuar
  }

  return null;
}

export async function requireStaff(
  uid: string,
  businessId: string,
  minimumRole: StaffRole = "door"
): Promise<StaffProfile> {
  // 1. Superadministrador de plataforma: autoridad de "owner" activa en todos los clubes
  if (await isSuperAdmin(uid)) {
    return {
      uid,
      businessId,
      role: "owner",
      status: "ACTIVE",
      deviceIds: []
    };
  }

  // 2. Verificación estándar de colaborador en el negocio
  const profile = await getStaffProfile(uid, businessId);
  if (!profile || profile.status !== "ACTIVE") {
    throw new AppError("permission-denied", "Active business staff access is required", 403);
  }
  if (!roleAtLeast(profile.role, minimumRole)) {
    throw new AppError("permission-denied", "Insufficient business role", 403);
  }
  return profile;
}


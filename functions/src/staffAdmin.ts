import type { CallableRequest } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import crypto from "node:crypto";
import { auth, db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isStaffRole, requireStaff, type StaffRole } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { asRecord, assertAllowedKeys, requiredId, requiredString } from "./validation.js";

export interface StaffMemberRecord {
  uid: string;
  businessId: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  role: StaffRole;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  assignedZones: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export async function listBusinessStaffFor(
  request: CallableRequest<unknown>
): Promise<{ staff: StaffMemberRecord[] }> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["businessId"]);
  const businessId = requiredId(record, "businessId");

  await requireStaff(callerUid, businessId, "manager");

  const snapshot = await db.collection("businesses").doc(businessId).collection("staff").get();

  const staff: StaffMemberRecord[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const createdAt = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (typeof data.createdAt === "string" ? data.createdAt : null);
    const updatedAt = data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : (typeof data.updatedAt === "string" ? data.updatedAt : null);

    return {
      uid: docSnap.id,
      businessId,
      name: typeof data.name === "string" && data.name.trim().length > 0 ? data.name : "Staff",
      email: typeof data.email === "string" ? data.email : "",
      whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : null,
      role: isStaffRole(data.role) ? data.role : "waiter",
      status: data.status === "ACTIVE" || data.status === "SUSPENDED" || data.status === "REVOKED"
        ? data.status
        : "REVOKED",
      assignedZones: Array.isArray(data.assignedZones)
        ? data.assignedZones.filter((z): z is string => typeof z === "string")
        : [],
      createdAt,
      updatedAt
    };
  });

  return { staff };
}

export async function upsertStaffMemberFor(
  request: CallableRequest<unknown>
): Promise<{
  ok: true;
  uid: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  role: StaffRole;
  status: "ACTIVE";
  assignedZones: string[];
  temporaryPassword?: string;
}> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["businessId", "uid", "email", "name", "whatsapp", "role", "assignedZones"]);

  const businessId = requiredId(record, "businessId");
  const callerProfile = await requireStaff(callerUid, businessId, "manager");

  const rawRole = requiredString(record, "role", 3, 20).toLowerCase();
  if (!isStaffRole(rawRole)) {
    throw new AppError("invalid-argument", "role must be one of: owner, manager, door, finance, waiter");
  }
  const role: StaffRole = rawRole;

  if (role === "owner" && callerProfile.role !== "owner") {
    throw new AppError("permission-denied", "Solo un propietario puede asignar el rol de propietario", 403);
  }

  let assignedZones: string[] = [];
  if (record.assignedZones !== undefined) {
    if (!Array.isArray(record.assignedZones)) {
      throw new AppError("invalid-argument", "assignedZones must be an array");
    }
    if (record.assignedZones.length > 9) {
      throw new AppError("invalid-argument", "assignedZones cannot exceed 9 zones");
    }
    assignedZones = record.assignedZones.map((z, idx) => {
      if (typeof z !== "string" || z.trim().length === 0) {
        throw new AppError("invalid-argument", `Invalid zone at index ${idx}`);
      }
      return z.trim().slice(0, 50);
    });
  }

  const rawName = typeof record.name === "string" ? record.name.trim().slice(0, 100) : "";
  const rawWhatsapp = typeof record.whatsapp === "string" ? record.whatsapp.trim().slice(0, 30) : null;

  let targetUid = typeof record.uid === "string" ? record.uid.trim() : "";
  let targetEmail = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  let temporaryPassword: string | undefined = undefined;

  if (!targetUid && !targetEmail) {
    throw new AppError("invalid-argument", "Either uid or email must be provided");
  }

  if (targetEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    throw new AppError("invalid-argument", "El correo electrónico no tiene un formato válido");
  }

  if (!targetUid && targetEmail) {
    try {
      const existingUser: UserRecord = await auth.getUserByEmail(targetEmail);
      targetUid = existingUser.uid;
    } catch (err: unknown) {
      const isNotFound = err && typeof err === "object" && "code" in err && (err as { code: string }).code === "auth/user-not-found";
      if (!isNotFound) {
        if (process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          targetUid = `mock_uid_${crypto.createHash("sha256").update(targetEmail).digest("hex").slice(0, 16)}`;
          temporaryPassword = `${crypto.randomBytes(6).toString("hex")}!Aa1`;
        } else {
          throw new AppError("internal", "No se pudo consultar el servicio de identidad", 500);
        }
      } else {
        temporaryPassword = `${crypto.randomBytes(6).toString("hex")}!Aa1`;
        try {
          const newUser = await auth.createUser({
            email: targetEmail,
            password: temporaryPassword,
            displayName: rawName || "Staff",
            emailVerified: false
          });
          targetUid = newUser.uid;
          await auth.setCustomUserClaims(targetUid, {
            platformRole: "tenant_staff",
            claimsVersion: 2
          });
        } catch {
          if (process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
            targetUid = `mock_uid_${crypto.createHash("sha256").update(targetEmail).digest("hex").slice(0, 16)}`;
          } else {
            throw new AppError("internal", "No se pudo crear la cuenta de usuario", 500);
          }
        }
      }
    }
  }

  if (targetUid && !targetEmail) {
    try {
      const user = await auth.getUser(targetUid);
      targetEmail = user.email ?? "";
    } catch {
      // Ignorar en entorno de pruebas
    }
  }

  const staffRef = db.collection("businesses").doc(businessId).collection("staff").doc(targetUid);
  const staffDoc = await staffRef.get();
  const isNew = !staffDoc.exists;

  if (isNew) {
    const currentCountSnap = await db.collection("businesses").doc(businessId).collection("staff").count().get();
    if (currentCountSnap.data().count >= 50) {
      throw new AppError("resource-exhausted", "El límite de personal para este negocio ha sido alcanzado (máx. 50)", 429);
    }
  }

  const existingData = staffDoc.data();
  const finalName = rawName || (typeof existingData?.name === "string" ? existingData.name : "Staff");
  const finalEmail = targetEmail || (typeof existingData?.email === "string" ? existingData.email : "");
  const finalWhatsapp = rawWhatsapp ?? (typeof existingData?.whatsapp === "string" ? existingData.whatsapp : null);

  const staffPayload = {
    uid: targetUid,
    businessId,
    name: finalName,
    email: finalEmail,
    whatsapp: finalWhatsapp,
    role,
    status: "ACTIVE" as const,
    assignedZones,
    updatedAt: FieldValue.serverTimestamp(),
    ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {})
  };

  await staffRef.set(staffPayload, { merge: true });

  // Registro de referencia del negocio en users/{uid}
  const userRef = db.collection("users").doc(targetUid);
  await userRef.set({
    uid: targetUid,
    businessId,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  await writeAudit(
    "staff.upserted",
    "staff",
    targetUid,
    {
      businessId,
      actorUid: callerUid,
      actorRole: callerProfile.role,
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      targetUid,
      role,
      status: "ACTIVE",
      isNew
    }
  );

  return {
    ok: true,
    uid: targetUid,
    name: finalName,
    email: finalEmail,
    whatsapp: finalWhatsapp,
    role,
    status: "ACTIVE",
    assignedZones,
    ...(temporaryPassword ? { temporaryPassword } : {})
  };
}

export async function revokeStaffMemberFor(
  request: CallableRequest<unknown>
): Promise<{ ok: true; uid: string; status: "REVOKED" }> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["businessId", "uid"]);

  const businessId = requiredId(record, "businessId");
  const targetUid = requiredId(record, "uid");

  const callerProfile = await requireStaff(callerUid, businessId, "manager");

  if (callerUid === targetUid) {
    throw new AppError("failed-precondition", "No puedes revocar tu propio acceso", 400);
  }

  const staffRef = db.collection("businesses").doc(businessId).collection("staff").doc(targetUid);
  const staffDoc = await staffRef.get();
  if (!staffDoc.exists) {
    throw new AppError("not-found", "Miembro del personal no encontrado", 404);
  }

  const targetData = staffDoc.data()!;
  if (targetData.role === "owner" && callerProfile.role !== "owner") {
    throw new AppError("permission-denied", "Solo un propietario puede revocar a otro propietario", 403);
  }

  await staffRef.update({
    status: "REVOKED",
    revokedAt: FieldValue.serverTimestamp(),
    revokedBy: callerUid,
    updatedAt: FieldValue.serverTimestamp()
  });

  await writeAudit(
    "staff.revoked",
    "staff",
    targetUid,
    {
      businessId,
      actorUid: callerUid,
      actorRole: callerProfile.role,
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      targetUid,
      previousRole: typeof targetData.role === "string" ? targetData.role : "unknown",
      status: "REVOKED"
    }
  );

  return {
    ok: true,
    uid: targetUid,
    status: "REVOKED"
  };
}

import { Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { auth, db } from "./config.js";
import { sha256 } from "./crypto.js";
import { AppError } from "./errors.js";
import { asRecord, optionalString, requiredEmail, requiredString } from "./validation.js";
import { sendWelcomeCredentialsEmail } from "./email.js";

export interface RegisterBetaClubInput {
  clubName: string;
  city: string;
  ownerName: string;
  email: string;
  whatsapp: string;
  plan?: string;
  source?: string;
}

export interface RegisterBetaClubResult {
  success: boolean;
  businessId: string;
  clubName: string;
  city: string;
  slug: string;
  credentials: {
    email: string;
    temporaryPassword: string;
    adminUrl: string;
    brandUrl: string;
  };
  emailSent: boolean;
  message: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateTemporaryPassword(): string {
  const pin = Math.floor(1000 + Math.random() * 9000);
  return `NF-${pin}!Vip`;
}

export const BETA_VIP_FEATURES = [
  "RESERVATIONS",
  "EVENTS",
  "FLOOR_PLAN",
  "TABLE_SELECTION",
  "SEAT_SELECTION",
  "CAPACITY_POOL",
  "ONLINE_PAYMENT",
  "QR_CHECKIN",
  "STAFF_MANAGEMENT",
  "ADVANCED_ANALYTICS",
  "CUSTOM_DOMAIN",
  "MULTI_LOCATION"
];

export function normalizePlanId(planInput?: string): string {
  if (!planInput) return "beta_vip";
  const clean = planInput.trim().toLowerCase();
  if (clean.includes("enter") || clean.includes("empres")) return "enterprise";
  if (clean.includes("basic") || clean.includes("básic")) return "basic";
  if (
    clean.includes("beta") ||
    clean.includes("pro") ||
    clean.includes("vip")
  ) {
    return "beta_vip";
  }
  return "beta_vip";
}

export function parseRegisterBetaInput(value: unknown): RegisterBetaClubInput {
  const record = asRecord(value, "registro beta");
  const clubName = requiredString(record, "clubName", 2, 80);
  const city = requiredString(record, "city", 2, 80);
  const ownerName = requiredString(record, "ownerName", 2, 80);
  const email = requiredEmail(record, "email").toLowerCase();
  const whatsapp = requiredString(record, "whatsapp", 7, 30);
  const plan = optionalString(record, "plan", 1, 50) || "Club Pro";
  const source = optionalString(record, "source", 1, 120) || "/software";

  return {
    clubName,
    city,
    ownerName,
    email,
    whatsapp,
    plan,
    source
  };
}

export async function registerAndActivateBetaClub(
  input: RegisterBetaClubInput
): Promise<RegisterBetaClubResult> {
  const { clubName, city, ownerName, email, whatsapp, plan, source } = input;

  const temporaryPassword = generateTemporaryPassword();
  const slug = generateSlug(clubName) || "club";
  const businessId = `club_${sha256(`${clubName}:${city}`).slice(0, 16)}`;
  const now = Timestamp.now();

  // 1. Firebase Auth: Buscar usuario existente o crear nuevo
  let userRecord: UserRecord;
  let isExisting = false;
  try {
    userRecord = await auth.getUserByEmail(email);
    isExisting = true;
    await auth.updateUser(userRecord.uid, {
      password: temporaryPassword,
      displayName: ownerName
    });
  } catch (error: unknown) {
    const isNotFound = error && typeof error === "object" && "code" in error && (error as { code: string }).code === "auth/user-not-found";
    if (!isNotFound) {
      console.error("❌ [Beta] Error al consultar usuario en Auth:", error);
      throw new AppError("internal", "No se pudo verificar el usuario en el servicio de identidad", 500);
    }
    userRecord = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: ownerName,
      emailVerified: false
    });
  }

  // 2. Custom Claims estrictamente < 300 bytes conforme a AGENTS §2.3
  await auth.setCustomUserClaims(userRecord.uid, {
    platformRole: "tenant_staff",
    claimsVersion: 2
  });

  // 3. Provisionamiento Atómico en Cloud Firestore
  const batch = db.batch();

  // 3.1 Directorio Público (estrictamente 9 campos permitidos por firestore.rules)
  const directoryRef = db.collection("businessDirectory").doc(businessId);
  batch.set(directoryRef, {
    name: clubName,
    slug,
    city,
    businessType: "NIGHTCLUB",
    logoUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80",
    coverUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80",
    status: "active",
    verified: true,
    authMethods: ["password", "email_otp"]
  });

  // 3.2 Documento Principal del Negocio (businesses/{businessId})
  const businessRef = db.collection("businesses").doc(businessId);
  batch.set(businessRef, {
    name: clubName,
    slug,
    city,
    businessType: "NIGHTCLUB",
    logoUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80",
    coverUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80",
    status: "active",
    verified: true,
    tagline: "Experiencia nocturna de primer nivel",
    primaryColor: "#a855f7",
    accentColor: "#06b6d4",
    authMethods: ["password", "email_otp"],
    reentryMode: "digital_passkey",
    reentryMinutes: 30,
    customerCount: 0,
    planId: normalizePlanId(plan),
    enabled_features: BETA_VIP_FEATURES,
    contactEmail: email,
    contactPhone: whatsapp,
    createdAt: now,
    updatedAt: now
  });

  // 3.3 Inicialización de inventario limpio (sin mesas pre-fabricadas; el club diseña su propio plano)
  // resources se deja vacío para que el establecimiento arranque 100% nuevo.

  // 3.4 Ficha de Personal como OWNER (businesses/{businessId}/staff/{uid})
  const staffRef = businessRef.collection("staff").doc(userRecord.uid);
  batch.set(staffRef, {
    uid: userRecord.uid,
    businessId,
    role: "owner",
    status: "ACTIVE",
    name: ownerName,
    email,
    whatsapp,
    deviceIds: [],
    createdAt: now,
    updatedAt: now
  });

  // 3.5 Identidad Global Vinculada (users/{uid})
  const userRef = db.collection("users").doc(userRecord.uid);
  batch.set(userRef, {
    uid: userRecord.uid,
    email,
    displayName: ownerName,
    businessId,
    platformRole: "tenant_staff",
    superAdmin: false,
    createdAt: now,
    updatedAt: now
  }, { merge: true });

  // 3.6 Registro de Lead en betaLeads
  const leadRef = db.collection("betaLeads").doc();
  batch.set(leadRef, {
    clubName,
    city,
    ownerName,
    email,
    whatsapp,
    plan,
    source,
    status: "AUTO_ACTIVATED",
    businessId,
    uid: userRecord.uid,
    clientVersion: "1.0.0-beta",
    createdAt: now
  });

  await batch.commit();

  console.info(`🎉 [Beta] Club activado exitosamente: ${clubName} (${businessId}) para ${email} (uid: ${userRecord.uid}, existente: ${isExisting})`);

  // 4. Envío de Correo con Credenciales
  const adminUrl = "https://nightflow-admin.web.app";
  const brandUrl = `https://nightflow-vip.web.app/negocio/${slug}`;

  const emailResult = await sendWelcomeCredentialsEmail({
    to: email,
    ownerName,
    clubName,
    city,
    tempPassword: temporaryPassword,
    adminUrl,
    brandUrl
  });

  return {
    success: true,
    businessId,
    clubName,
    city,
    slug,
    credentials: {
      email,
      temporaryPassword,
      adminUrl,
      brandUrl
    },
    emailSent: emailResult.sent,
    message: emailResult.sent
      ? `Se ha enviado un correo con tus credenciales a ${email}.`
      : "Tu club ha sido activado. Guarda tus credenciales para acceder."
  };
}

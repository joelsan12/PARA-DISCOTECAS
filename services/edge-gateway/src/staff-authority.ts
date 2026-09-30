import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { GatewayConfig } from "./types.js";

/**
 * Autoridad de rol y tenant del gateway (AGENTS §6.3, §13).
 *
 * El ID token de Firebase demuestra *quién* se presenta, nunca *qué rol*
 * tiene en este negocio. El rol y el tenant se resuelven exclusivamente desde
 * `businesses/{businessId}/staff/{uid}`, igual que en door-service. Confiar en
 * el rol que declara el cliente convertiría el Edge en un punto de inyección
 * de eventos para cualquier usuario registrado del proyecto.
 */

export type StaffRole = "owner" | "manager" | "door" | "finance";

export interface StaffAuthorization {
  uid: string;
  businessId: string;
  role: StaffRole;
  deviceIds: string[];
}

export class StaffAuthority {
  private readonly firestore: Firestore | null;
  private readonly cache = new Map<string, { authorization: StaffAuthorization | null; expiresAt: number }>();
  private readonly cacheTtlMs = 30_000;

  public constructor(private readonly config: GatewayConfig) {
    this.firestore = this.openFirestore(config);
  }

  public get available(): boolean {
    return this.firestore !== null && this.config.idTokenConfigured;
  }

  /**
   * Resuelve la autorización de un uid ya verificado criptográficamente.
   * Devuelve `null` si el usuario no es staff activo del negocio configurado.
   */
  public async authorize(uid: string, requestedDeviceId: string): Promise<StaffAuthorization | null> {
    if (!this.firestore || !this.config.idTokenConfigured) {
      return null;
    }
    const cacheKey = `${uid}:${requestedDeviceId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.authorization;
    }
    const authorization = await this.load(uid, requestedDeviceId);
    this.cache.set(cacheKey, { authorization, expiresAt: Date.now() + this.cacheTtlMs });
    if (this.cache.size > 5_000) {
      const oldest = this.cache.keys().next();
      if (!oldest.done) {
        this.cache.delete(oldest.value);
      }
    }
    return authorization;
  }

  public invalidate(): void {
    this.cache.clear();
  }

  private async load(uid: string, requestedDeviceId: string): Promise<StaffAuthorization | null> {
    const firestore = this.firestore;
    if (!firestore) {
      return null;
    }
    const reference = firestore
      .collection("businesses")
      .doc(this.config.businessId)
      .collection("staff")
      .doc(uid);
    const snapshot = await reference.get();
    if (!snapshot.exists) {
      return null;
    }
    const data = snapshot.data() as Record<string, unknown>;
    if (data.uid !== uid || data.businessId !== this.config.businessId) {
      return null;
    }
    if (typeof data.status !== "string" || data.status.toUpperCase() !== "ACTIVE") {
      return null;
    }
    const role = normalizeRole(data.role);
    if (!role) {
      return null;
    }
    const deviceIds = Array.isArray(data.deviceIds)
      ? data.deviceIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    // Un terminal solo puede presentarse como sí mismo si está enrolado.
    if (requestedDeviceId.length > 0 && !deviceIds.includes(requestedDeviceId)) {
      return null;
    }
    return { uid, businessId: this.config.businessId, role, deviceIds };
  }

  private openFirestore(config: GatewayConfig): Firestore | null {
    if (!config.idTokenConfigured) {
      return null;
    }
    try {
      if (getApps().length === 0) {
        const serialized = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
        const projectId = config.firebaseProjectId;
        if (serialized) {
          const parsed = JSON.parse(serialized) as Record<string, unknown>;
          const project = typeof parsed.project_id === "string" ? parsed.project_id : projectId;
          const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email : undefined;
          const privateKey = typeof parsed.private_key === "string" ? parsed.private_key : undefined;
          if (!project || !clientEmail || !privateKey) {
            return null;
          }
          initializeApp({ credential: cert({ projectId: project, clientEmail, privateKey }), projectId: project });
        } else {
          // ADC (Cloud Run / GCP) o emulador: projectId explícito para no
          // depender de la detección de GOOGLE_APPLICATION_CREDENTIALS.
          initializeApp({ projectId });
        }
      }
      return getFirestore();
    } catch {
      return null;
    }
  }
}

function normalizeRole(value: unknown): StaffRole | null {
  if (typeof value !== "string") {
    return null;
  }
  const role = value.trim().toLowerCase();
  return role === "owner" || role === "manager" || role === "door" || role === "finance" ? role : null;
}
import { AppError } from "./errors.js";
import type { PaymentSecrets } from "./types/payments.js";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de caché para proteger cuota de 10.000 ops/mes
const secretCache = new Map<string, CacheEntry>();

/**
 * Resuelve el valor real de un secreto a partir de su secretReference.
 * En producción contra GCP, accede a Secret Manager mediante credenciales de servicio mínimas (roles/secretmanager.secretAccessor).
 * En desarrollo/test, soporta referencias locales controladas.
 */
export async function resolveSecretPayload(secretReference: string): Promise<string> {
  if (!secretReference || typeof secretReference !== "string") {
    throw new AppError("failed-precondition", "Referencia de secreto no válida", 503);
  }

  const now = Date.now();
  const cached = secretCache.get(secretReference);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  // Si la referencia tiene prefijo env:// (útil para pruebas locales sin mockear red)
  if (secretReference.startsWith("env://")) {
    const envVar = secretReference.slice(6);
    const value = process.env[envVar];
    if (!value) throw new AppError("failed-precondition", `Variable de secreto no configurada: ${envVar}`, 503);
    secretCache.set(secretReference, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  }

  // Intento de resolución mediante @google-cloud/secret-manager si está disponible
  try {
    const sm = await import("@google-cloud/secret-manager" as string).catch(() => null);
    if (sm && typeof sm.SecretManagerServiceClient === "function") {
      const client = new sm.SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({ name: secretReference });
      const payload = version?.payload?.data;
      if (payload) {
        const secretString = typeof payload === "string" ? payload : Buffer.from(payload as Uint8Array).toString("utf8");
        secretCache.set(secretReference, { value: secretString, expiresAt: now + CACHE_TTL_MS });
        return secretString;
      }
    }
  } catch (err) {
    // Si falla el acceso formal a GCP Secret Manager, registrar y fallar cerrado
    console.error("⚠️ [SecretManager] Error accediendo a Secret Manager:", err instanceof Error ? err.message : err);
  }

  // Si no se pudo resolver el secreto, fallar cerrado
  throw new AppError("failed-precondition", `No se pudo acceder al secreto referenciado: ${secretReference}`, 503);
}

/**
 * Resuelve y parsea los secretos de un PaymentAccount (API key y webhookSecret).
 */
export async function resolvePaymentSecrets(secretReference: string): Promise<PaymentSecrets> {
  const raw = await resolveSecretPayload(secretReference);
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const webhookSecret = typeof parsed.webhookSecret === "string" ? parsed.webhookSecret : raw;
      const privateApiKey = typeof parsed.privateApiKey === "string" ? parsed.privateApiKey : undefined;
      return { webhookSecret, ...(privateApiKey ? { privateApiKey } : {}) };
    }
  } catch {
    // Si no es JSON, se asume que el secreto plano es directamente el webhookSecret
  }
  return { webhookSecret: raw };
}

export function clearSecretCache(): void {
  secretCache.clear();
}

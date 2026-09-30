import { createHash, randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveQueueKey } from "./queue-crypto.js";
import type { GatewayConfig } from "./types.js";

const DEFAULT_PORT = 8787;
const DEFAULT_BODY_BYTES = 1_048_576;
const DEFAULT_MESSAGE_BYTES = 262_144;
const DEFAULT_AUTH_WINDOW_MS = 300_000;
const DEFAULT_AUTH_TIMEOUT_MS = 10_000;
const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_MAX_CONNECTIONS = 500;
const MIN_HMAC_SECRET_LENGTH = 32;
const MAX_TRACKED_NONCES = 10_000;

export class ConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const isProduction = env.NODE_ENV === "production";
  const hmacSecret = value(env.EDGE_HMAC_SECRET);
  const secretConfigured = hmacSecret.length > 0;
  const firebaseProjectId = value(env.EDGE_FIREBASE_PROJECT_ID) || value(env.FIREBASE_PROJECT_ID) || value(env.GCLOUD_PROJECT);
  const idTokenConfigured = firebaseProjectId.length > 0;

  // Fail-hard: el gateway firma los eventos que persiste y verifica los que
  // recibe. Una clave vacía o débil convertiría `secretConfigured` en una
  // promesa falsa y permitiría firmar con HMAC(""), que cualquiera puede calcular.
  if (hmacSecret.length > 0 && hmacSecret.length < MIN_HMAC_SECRET_LENGTH) {
    throw new ConfigurationError(`EDGE_HMAC_SECRET must be at least ${MIN_HMAC_SECRET_LENGTH} characters`);
  }
  if (isProduction && !secretConfigured) {
    throw new ConfigurationError("EDGE_HMAC_SECRET is required in production (the gateway signs persisted events with it)");
  }

  const businessId = value(env.BUSINESS_ID) || "local-business";
  const eventId = value(env.EVENT_ID) || "local-event";
  const gatewayId = value(env.GATEWAY_ID) || deriveGatewayId(businessId, eventId);

  // Clave de la cola offline (AGENTS §6.3): derivada del secreto HMAC con
  // HKDF salvo que el operador defina EDGE_QUEUE_KEY explícita. Un valor
  // malformado debe frenar el arranque, no degradar a texto plano.
  let queueKey: Buffer;
  try {
    queueKey = deriveQueueKey({ queueKeyBase64: value(env.EDGE_QUEUE_KEY), hmacSecret, gatewayId });
  } catch (error) {
    throw new ConfigurationError(error instanceof Error ? error.message : "EDGE_QUEUE_KEY is invalid");
  }

  // Compatibilidad de despliegue: la PWA publicada en Hosting y el gateway
  // instalado en el club se actualizan en momentos distintos, así que el token
  // en la query string sigue admitido hasta que esta bandera se apague.
  const allowQueryAuth = parseBoolean(env.EDGE_ALLOW_QUERY_AUTH, true);
  const dataFileValue = value(env.EDGE_DATA_FILE) || value(env.DATA_FILE);
  const serviceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dataFile = dataFileValue ? resolve(dataFileValue) : resolve(serviceRoot, "data/events.jsonl");

  return {
    port: parseInteger(env.PORT, DEFAULT_PORT, 0, 65535, "PORT"),
    businessId,
    eventId,
    hmacSecret,
    secretConfigured,
    queueKey,
    allowQueryAuth,
    firebaseProjectId,
    idTokenConfigured,
    allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS),
    gatewayId,
    instanceId: value(env.INSTANCE_ID) || randomUUID(),
    dataFile,
    authWindowMs: parseInteger(env.EDGE_AUTH_WINDOW_MS, DEFAULT_AUTH_WINDOW_MS, 1_000, 86_400_000, "EDGE_AUTH_WINDOW_MS"),
    authTimeoutMs: parseInteger(env.EDGE_AUTH_TIMEOUT_MS, DEFAULT_AUTH_TIMEOUT_MS, 1_000, 120_000, "EDGE_AUTH_TIMEOUT_MS"),
    heartbeatIntervalMs: parseInteger(env.EDGE_HEARTBEAT_MS, DEFAULT_HEARTBEAT_MS, 1_000, 3_600_000, "EDGE_HEARTBEAT_MS"),
    maxBodyBytes: parseInteger(env.EDGE_MAX_BODY_BYTES, DEFAULT_BODY_BYTES, 1_024, 16_777_216, "EDGE_MAX_BODY_BYTES"),
    maxMessageBytes: parseInteger(env.EDGE_MAX_MESSAGE_BYTES, DEFAULT_MESSAGE_BYTES, 1_024, 16_777_216, "EDGE_MAX_MESSAGE_BYTES"),
    maxConnections: parseInteger(env.EDGE_MAX_CONNECTIONS, DEFAULT_MAX_CONNECTIONS, 1, 100_000, "EDGE_MAX_CONNECTIONS"),
    maxTrackedNonces: MAX_TRACKED_NONCES,
    isProduction,
    startedAt: new Date().toISOString()
  };
}

export function parseOrigins(value: string | undefined): string[] {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? [];
  return [...new Set(origins)];
}

function value(input: string | undefined): string {
  return input?.trim() ?? "";
}

function parseInteger(input: string | undefined, fallback: number, minimum: number, maximum: number, name: string): number {
  if (input === undefined || input.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new ConfigurationError(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  const normalized = value(input).toLowerCase();
  if (normalized.length === 0) {
    return fallback;
  }
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }
  throw new ConfigurationError("EDGE_ALLOW_QUERY_AUTH must be a boolean (true/false)");
}

function deriveGatewayId(businessId: string, eventId: string): string {
  const digest = createHash("sha256").update(`${businessId}:${eventId}`).digest("hex").slice(0, 16);
  return `edge-${digest}`;
}

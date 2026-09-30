import type { IncomingHttpHeaders } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { canonicalJson, extractSignature, isRecord, sha256Hex, signatureMatches, stripSignatureFields } from "./crypto.js";
import { normalizeRole } from "./protocol.js";
import type { ReplayGuard } from "./replay-guard.js";
import type { StaffAuthority, StaffRole } from "./staff-authority.js";
import type { AuthIdentity, GatewayConfig, GatewayRole } from "./types.js";

export interface AuthenticationResult {
  ok: boolean;
  identity: AuthIdentity | null;
  reason: string;
  method: "hmac" | "token" | null;
}

let firebaseJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getFirebaseJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!firebaseJwks) {
    firebaseJwks = createRemoteJWKSet(
      new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
    );
  }
  return firebaseJwks;
}

export async function verifyFirebaseSessionToken(config: GatewayConfig, token: string): Promise<string | null> {
  if (!config.idTokenConfigured || token.length === 0 || token.length > 8192) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getFirebaseJwks(), {
      issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
      audience: config.firebaseProjectId
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

export function isOriginAllowed(origin: string | null | undefined, allowedOrigins: string[], requestHost?: string): boolean {
  if (!origin || origin === "null") {
    return true;
  }
  if (allowedOrigins.includes("*")) {
    return true;
  }
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.some((allowed) => normalizeOrigin(allowed) === normalizedOrigin)) {
    return true;
  }
  if (requestHost && normalizedOrigin) {
    try {
      if (new URL(normalizedOrigin).host === requestHost) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return allowedOrigins.some((allowed) => wildcardMatches(normalizeOrigin(allowed), normalizedOrigin));
}

export interface AuthContext {
  config: GatewayConfig;
  replay: ReplayGuard;
  staff: StaffAuthority;
}

export async function authenticateUpgrade(context: AuthContext, headers: IncomingHttpHeaders, url: URL): Promise<AuthenticationResult> {
  const { config } = context;
  const identity = readIdentity(config, url.searchParams, headers, undefined);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  const timestampError = validateFreshness(identity, config);
  if (timestampError) {
    return failed(timestampError);
  }
  return completeAuthentication(
    context,
    identity,
    readSessionToken(url.searchParams, headers, undefined),
    () => readSignature(headers, url.searchParams, undefined, url.pathname, "GET"),
    url.pathname,
    sha256Hex("")
  );
}

export async function authenticateHttp(
  context: AuthContext,
  method: string,
  url: URL,
  headers: IncomingHttpHeaders,
  body: string,
  parsedBody?: unknown
): Promise<AuthenticationResult> {
  const { config } = context;
  const bodyRecord = isRecord(parsedBody) ? parsedBody : undefined;
  const identity = readIdentity(config, url.searchParams, headers, bodyRecord);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  const timestampError = validateFreshness(identity, config);
  if (timestampError) {
    return failed(timestampError);
  }
  return completeAuthentication(
    context,
    identity,
    readSessionToken(url.searchParams, headers, bodyRecord),
    () => readSignature(headers, url.searchParams, bodyRecord, url.pathname, method.toUpperCase()),
    url.pathname,
    sha256Hex(body)
  );
}

export async function authenticateMessage(context: AuthContext, message: unknown): Promise<AuthenticationResult> {
  const { config } = context;
  if (!isRecord(message)) {
    return failed("authentication message must be an object");
  }
  const authRecord = isRecord(message.auth) ? message.auth : message;
  const identity = readIdentity(config, new URLSearchParams(), {}, authRecord);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  const timestampError = validateFreshness(identity, config);
  if (timestampError) {
    return failed(timestampError);
  }
  return completeAuthentication(
    context,
    identity,
    readSessionToken(new URLSearchParams(), {}, authRecord),
    () => extractSignature(message) ?? extractSignature(authRecord),
    "",
    sha256Hex(canonicalJson(stripSignatureFields(message)))
  );
}

async function completeAuthentication(
  context: AuthContext,
  identity: AuthIdentity,
  token: string,
  readSignature: () => string | null,
  path: string,
  bodyDigest: string
): Promise<AuthenticationResult> {
  const { config, replay, staff } = context;

  // Un nonce nunca se reutiliza, ni entre conexiones ni entre peticiones.
  if (!replay.claim(identity.nonce, identityScope(identity))) {
    return failed("nonce already used or missing");
  }

  if (token) {
    const uid = await verifyFirebaseSessionToken(config, token);
    if (!uid) {
      return failed("invalid session token");
    }
    const authorization = await staff.authorize(uid, identity.deviceId);
    if (!authorization) {
      return failed("caller is not active staff of this business");
    }
    return {
      ok: true,
      // Rol derivado del servidor, nunca del header del cliente.
      identity: { ...identity, role: toGatewayRole(authorization.role) },
      reason: "authenticated",
      method: "token"
    };
  }

  if (!config.secretConfigured) {
    return failed("EDGE_HMAC_SECRET is not configured");
  }
  const signature = readSignature();
  if (!signature) {
    return failed("missing HMAC signature");
  }
  // Única canonicalización posible: identidad + ruta + digest del cuerpo.
  // Cualquier lista de candidatos convierte la firma en maleable, porque
  // una firma sobre el subconjunto mínimo autentica todos los demás campos.
  if (!signatureMatches(config.hmacSecret, canonicalAuthString(identity, path, bodyDigest), signature)) {
    return failed("invalid HMAC signature");
  }
  // El secreto HMAC es del gateway local: quien lo posee es el propio local,
  // nunca un cliente de la PWA. El rol se degrada para que un header no
  // pueda escalar privilegios.
  const role: GatewayRole = identity.deviceId.length > 0 ? "terminal" : "client";
  return { ok: true, identity: { ...identity, role }, reason: "authenticated", method: "hmac" };
}

/**
 * Serialización única y firmada del handshake (identity + path + body digest).
 */
export function canonicalAuthString(identity: AuthIdentity, path: string, bodyDigest: string): string {
  return canonicalJson({
    v: 1,
    kind: "edge-auth",
    businessId: identity.businessId,
    eventId: identity.eventId,
    deviceId: identity.deviceId,
    clientId: identity.clientId,
    role: identity.role,
    timestamp: identity.timestamp,
    nonce: identity.nonce,
    path,
    bodyDigest
  });
}

function identityScope(identity: AuthIdentity): string {
  return `${identity.businessId}:${identity.clientId}`;
}

function toGatewayRole(role: StaffRole): GatewayRole {
  return role === "door" ? "terminal" : "admin";
}

function validateFreshness(identity: AuthIdentity, config: GatewayConfig): string | null {
  if (identity.timestamp.length === 0) {
    return "authentication timestamp is required";
  }
  if (identity.nonce.length === 0) {
    return "authentication nonce is required";
  }
  const windowMs = config.authWindowMs;
  if (!isTimestampValid(identity.timestamp, windowMs)) {
    return "expired authentication timestamp";
  }
  return null;
}

function readSessionToken(
  searchParams: URLSearchParams,
  headers: IncomingHttpHeaders,
  body: Record<string, unknown> | undefined
): string {
  const queryToken = searchParams.get("token")?.trim();
  if (queryToken) return queryToken;
  const bodyToken = body?.token;
  if (typeof bodyToken === "string" && bodyToken.trim().length > 0) return bodyToken.trim();
  const authorization = headerValue(headers, "authorization");
  if (authorization) {
    const bearer = /^(?:Bearer)\s+(.+)$/iu.exec(authorization.trim());
    if (bearer?.[1]) return bearer[1].trim();
  }
  const idToken = headerValue(headers, "x-id-token") ?? headerValue(headers, "x-firebase-id-token");
  return idToken?.trim() ?? "";
}

export function readIdentity(
  config: GatewayConfig,
  searchParams: URLSearchParams,
  headers: IncomingHttpHeaders,
  body?: Record<string, unknown>
): AuthIdentity | null {
  const businessId = valueFrom(searchParams, headers, body, ["businessId", "business_id"], "x-edge-business-id") || config.businessId;
  const eventId = valueFrom(searchParams, headers, body, ["eventId", "event_id"], "x-edge-event-id") || config.eventId;
  if (businessId !== config.businessId || eventId !== config.eventId) {
    return null;
  }
  const deviceId = valueFrom(searchParams, headers, body, ["deviceId", "device_id", "terminalId", "terminal_id"], "x-edge-device-id") || "";
  const clientId = valueFrom(searchParams, headers, body, ["clientId", "client_id", "client"], "x-edge-client-id") || deviceId || "anonymous";
  const roleValue = valueFrom(searchParams, headers, body, ["role"], "x-edge-role");
  const role = normalizeRole(roleValue, deviceId.length > 0);
  if (!role || (deviceId.length === 0 && role === "terminal")) {
    return null;
  }
  const timestamp = valueFrom(searchParams, headers, body, ["timestamp", "ts", "t"], "x-edge-timestamp") || "";
  const nonce = valueFrom(searchParams, headers, body, ["nonce", "n"], "x-edge-nonce") || "";
  return {
    businessId,
    eventId,
    deviceId,
    clientId,
    role,
    timestamp,
    nonce
  };
}

export function extractRequestSignature(headers: IncomingHttpHeaders, url: URL, body?: Record<string, unknown>): string | null {
  return readSignature(headers, url.searchParams, body, url.pathname, "POST");
}

function readSignature(
  headers: IncomingHttpHeaders,
  searchParams: URLSearchParams,
  body?: Record<string, unknown>,
  _path?: string,
  _method?: string
): string | null {
  const headerNames = ["x-edge-signature", "x-edge-hmac", "x-gateway-signature", "x-signature", "x-hmac", "x-hmac-signature", "x-edge-token"];
  for (const name of headerNames) {
    const value = headerValue(headers, name);
    if (value) {
      const parsed = parseSignatureHeader(value);
      if (parsed) {
        return parsed;
      }
    }
  }
  const authorization = headerValue(headers, "authorization");
  if (authorization) {
    const parsed = parseSignatureHeader(authorization);
    if (parsed) {
      return parsed;
    }
  }
  for (const name of ["signature", "sig", "hmac", "mac", "auth"]) {
    const value = searchParams.get(name);
    if (value) {
      return extractSignature(value);
    }
  }
  if (body) {
    return extractSignature(body);
  }
  return null;
}

function parseSignatureHeader(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parameterMatch = trimmed.match(/(?:signature|sig|hmac|mac|v1)\s*=\s*"?([^",\s]+)"?/iu);
  if (parameterMatch?.[1]) {
    return extractSignature(parameterMatch[1]);
  }
  const schemeMatch = trimmed.match(/^(?:hmac|sha256|bearer|signature)\s+(.+)$/iu);
  if (schemeMatch?.[1]) {
    const value = schemeMatch[1].replace(/^([^,]+),\s*.*$/u, "$1");
    const parts = value.split(":");
    if (parts.length > 1) {
      return extractSignature(parts.at(-1));
    }
    return extractSignature(value);
  }
  return extractSignature(trimmed);
}

function valueFrom(
  searchParams: URLSearchParams,
  headers: IncomingHttpHeaders,
  body: Record<string, unknown> | undefined,
  names: string[],
  headerName: string
): string {
  for (const name of names) {
    const queryValue = searchParams.get(name);
    if (queryValue !== null && queryValue.trim().length > 0) {
      return queryValue.trim();
    }
    const bodyValue = body?.[name];
    if (typeof bodyValue === "string" && bodyValue.trim().length > 0) {
      return bodyValue.trim();
    }
    if (typeof bodyValue === "number" && Number.isFinite(bodyValue)) {
      return String(bodyValue);
    }
  }
  const headerValueResult = headerValue(headers, headerName);
  return headerValueResult?.trim() ?? "";
}

function headerValue(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isTimestampValid(timestamp: string, windowMs: number): boolean {
  if (timestamp.length === 0) {
    return false;
  }
  const numeric = Number(timestamp);
  const time = Number.isFinite(numeric) ? (numeric < 10_000_000_000 ? numeric * 1000 : numeric) : Date.parse(timestamp);
  if (!Number.isFinite(time)) {
    return false;
  }
  return Math.abs(Date.now() - time) <= windowMs;
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/u, "").toLowerCase();
}

function wildcardMatches(pattern: string, value: string): boolean {
  if (!pattern.includes("*")) {
    return false;
  }
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "u").test(value);
}

function failed(reason: string): AuthenticationResult {
  return { ok: false, identity: null, reason, method: null };
}

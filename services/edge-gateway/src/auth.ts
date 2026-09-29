import type { IncomingHttpHeaders } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { canonicalJson, extractSignature, isRecord, sha256Hex, signatureMatchesAny, stripSignatureFields } from "./crypto.js";
import { normalizeRole } from "./protocol.js";
import type { AuthIdentity, GatewayConfig } from "./types.js";

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

export async function verifyFirebaseSessionToken(config: GatewayConfig, token: string): Promise<boolean> {
  if (!config.idTokenConfigured || token.length === 0 || token.length > 8192) {
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, getFirebaseJwks(), {
      issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
      audience: config.firebaseProjectId
    });
    return typeof payload.sub === "string" && payload.sub.length > 0 && payload.sub.length <= 128;
  } catch {
    return false;
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

export async function authenticateUpgrade(
  config: GatewayConfig,
  headers: IncomingHttpHeaders,
  url: URL
): Promise<AuthenticationResult> {
  const identity = readIdentity(config, url.searchParams, headers, undefined);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  if (!isTimestampValid(identity.timestamp, config.authWindowMs)) {
    return failed("expired authentication timestamp");
  }
  const token = readSessionToken(url.searchParams, headers, undefined);
  if (token) {
    if (!(await verifyFirebaseSessionToken(config, token))) {
      return failed("invalid session token");
    }
    return { ok: true, identity, reason: "authenticated", method: "token" };
  }
  if (!config.secretConfigured) {
    return failed("EDGE_HMAC_SECRET is not configured");
  }
  const signature = readSignature(headers, url.searchParams, undefined);
  if (!signature) {
    return failed("missing HMAC signature");
  }
  const candidates = [
    ...identityCandidates(identity),
    ...requestCandidates("GET", url, "", identity),
    url.search,
    url.pathname
  ];
  if (!signatureMatchesAny(config.hmacSecret, unique(candidates), signature)) {
    return failed("invalid HMAC signature");
  }
  return { ok: true, identity, reason: "authenticated", method: "hmac" };
}

export async function authenticateHttp(
  config: GatewayConfig,
  method: string,
  url: URL,
  headers: IncomingHttpHeaders,
  body: string,
  parsedBody?: unknown
): Promise<AuthenticationResult> {
  const bodyRecord = isRecord(parsedBody) ? parsedBody : undefined;
  const identity = readIdentity(config, url.searchParams, headers, bodyRecord);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  if (!isTimestampValid(identity.timestamp, config.authWindowMs)) {
    return failed("expired authentication timestamp");
  }
  const token = readSessionToken(url.searchParams, headers, bodyRecord);
  if (token) {
    if (!(await verifyFirebaseSessionToken(config, token))) {
      return failed("invalid session token");
    }
    return { ok: true, identity, reason: "authenticated", method: "token" };
  }
  if (!config.secretConfigured) {
    return failed("EDGE_HMAC_SECRET is not configured");
  }
  const signature = readSignature(headers, url.searchParams, bodyRecord);
  if (!signature) {
    return failed("missing HMAC signature");
  }
  const bodyWithoutSignature = bodyRecord ? JSON.stringify(stripSignatureFields(bodyRecord)) : "";
  const candidates = [
    ...identityCandidates(identity),
    ...requestCandidates(method.toUpperCase(), url, body, identity),
    body,
    bodyWithoutSignature
  ];
  if (!signatureMatchesAny(config.hmacSecret, unique(candidates), signature)) {
    return failed("invalid HMAC signature");
  }
  return { ok: true, identity, reason: "authenticated", method: "hmac" };
}

export async function authenticateMessage(config: GatewayConfig, message: unknown): Promise<AuthenticationResult> {
  if (!isRecord(message)) {
    return failed("authentication message must be an object");
  }
  const authRecord = isRecord(message.auth) ? message.auth : message;
  const identity = readIdentity(config, new URLSearchParams(), {}, authRecord);
  if (!identity) {
    return failed("invalid gateway identity");
  }
  if (!isTimestampValid(identity.timestamp, config.authWindowMs)) {
    return failed("expired authentication timestamp");
  }
  const token = readSessionToken(new URLSearchParams(), {}, authRecord);
  if (token) {
    if (!(await verifyFirebaseSessionToken(config, token))) {
      return failed("invalid session token");
    }
    return { ok: true, identity, reason: "authenticated", method: "token" };
  }
  if (!config.secretConfigured) {
    return failed("EDGE_HMAC_SECRET is not configured");
  }
  const signature = extractSignature(message) ?? extractSignature(authRecord);
  if (!signature) {
    return failed("missing HMAC signature");
  }
  const withoutSignature = stripSignatureFields(message);
  const authWithoutSignature = stripSignatureFields(authRecord);
  const candidates = [
    ...identityCandidates(identity),
    canonicalJson(withoutSignature),
    JSON.stringify(withoutSignature),
    canonicalJson(authWithoutSignature),
    JSON.stringify(authWithoutSignature)
  ];
  if (!signatureMatchesAny(config.hmacSecret, unique(candidates), signature)) {
    return failed("invalid HMAC signature");
  }
  return { ok: true, identity, reason: "authenticated", method: "hmac" };
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
  return readSignature(headers, url.searchParams, body);
}

function readSignature(headers: IncomingHttpHeaders, searchParams: URLSearchParams, body?: Record<string, unknown>): string | null {
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
  for (const name of ["signature", "sig", "hmac", "mac", "token", "auth"]) {
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

function identityCandidates(identity: AuthIdentity): string[] {
  const compact = [
    identity.businessId,
    identity.eventId,
    identity.deviceId,
    identity.clientId,
    identity.role,
    identity.timestamp,
    identity.nonce
  ];
  const base = {
    businessId: identity.businessId,
    eventId: identity.eventId,
    deviceId: identity.deviceId,
    clientId: identity.clientId,
    role: identity.role,
    timestamp: identity.timestamp,
    nonce: identity.nonce
  };
  return [
    canonicalJson(base),
    JSON.stringify(base),
    canonicalJson({ businessId: identity.businessId, eventId: identity.eventId }),
    JSON.stringify({ businessId: identity.businessId, eventId: identity.eventId }),
    JSON.stringify({ businessId: identity.businessId, eventId: identity.eventId, deviceId: identity.deviceId, clientId: identity.clientId, role: identity.role }),
    compact.join(":"),
    compact.join("."),
    `${identity.businessId}:${identity.eventId}`,
    `${identity.businessId}.${identity.eventId}`,
    identity.businessId,
    identity.eventId,
    identity.deviceId,
    identity.clientId,
    identity.deviceId + identity.timestamp,
    identity.deviceId + ":" + identity.timestamp,
    identity.deviceId + "." + identity.timestamp,
    identity.deviceId + ":" + identity.clientId + ":" + identity.timestamp,
    identity.clientId + ":" + identity.timestamp
  ];
}

function requestCandidates(method: string, url: URL, body: string, identity: AuthIdentity): string[] {
  const path = url.pathname + url.search;
  const bodyDigest = sha256Hex(body);
  const timestamp = identity.timestamp;
  return [
    `${timestamp}.${method}.${path}.${bodyDigest}`,
    `${timestamp}\n${method}\n${path}\n${bodyDigest}`,
    `${method}.${path}.${bodyDigest}`,
    `${method}\n${path}\n${bodyDigest}`,
    `${method}:${path}:${bodyDigest}`,
    `${method}:${url.pathname}:${bodyDigest}`,
    `${method}:${url.pathname}`,
    `${method}${url.pathname}`,
    `${timestamp}:${method}:${path}:${bodyDigest}`,
    `${timestamp}.${method}.${path}`,
    `${timestamp}.${path}`,
    `${timestamp}:${path}`,
    `${timestamp}.${body}`,
    `${timestamp}:${body}`,
    `${timestamp}.${bodyDigest}`,
    `${method}${path}${body}`,
    body
  ];
}

function isTimestampValid(timestamp: string, windowMs: number): boolean {
  if (timestamp.length === 0) {
    return true;
  }
  const numeric = Number(timestamp);
  const time = Number.isFinite(numeric) ? (numeric < 10_000_000_000 ? numeric * 1000 : numeric) : Date.parse(timestamp);
  if (!Number.isFinite(time)) {
    return false;
  }
  return Math.abs(Date.now() - time) <= windowMs;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
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

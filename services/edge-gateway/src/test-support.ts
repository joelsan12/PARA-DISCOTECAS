import { createHmac } from "node:crypto";
import { canonicalJson, sha256Hex, stripSignatureFields } from "./crypto.js";
import { canonicalAuthString } from "./auth.js";
import type { AuthIdentity, GatewayConfig } from "./types.js";

/**
 * Utilidades de firma para las pruebas del gateway. Reproducen exactamente la
 * canonicalización única que exige la implementación; si divergen, las pruebas
 * deben fallar (que es el objetivo).
 */

export const testSecret = "edge-test-secret-0123456789abcdef-32+";

export function hmacHex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function buildIdentity(config: GatewayConfig, overrides: Partial<AuthIdentity> = {}): AuthIdentity {
  return {
    businessId: config.businessId,
    eventId: config.eventId,
    deviceId: "dev-test-1",
    clientId: "dev-test-1",
    role: "terminal",
    timestamp: String(Date.now()),
    nonce: `nonce-${Math.random().toString(16).slice(2)}-${Date.now()}`,
    ...overrides
  };
}

export function signAuth(config: GatewayConfig, identity: AuthIdentity, path: string, bodyDigest = sha256Hex("")): string {
  return hmacHex(config.hmacSecret, canonicalAuthString(identity, path, bodyDigest));
}

export function identityParams(
  config: GatewayConfig,
  deviceId: string,
  options: { path?: string; overrides?: Partial<AuthIdentity> } = {}
): URLSearchParams {
  const identity = buildIdentity(config, { deviceId, clientId: deviceId, ...options.overrides });
  const path = options.path ?? "/v1/events";
  return new URLSearchParams({
    businessId: identity.businessId,
    eventId: identity.eventId,
    deviceId: identity.deviceId,
    clientId: identity.clientId,
    role: identity.role,
    timestamp: identity.timestamp,
    nonce: identity.nonce,
    signature: signAuth(config, identity, path)
  });
}

export function signEventBody(config: GatewayConfig, body: Record<string, unknown>): string {
  return hmacHex(config.hmacSecret, canonicalJson(stripSignatureFields(body)));
}
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_FIELDS = new Set(["signature", "hmac", "mac", "digest", "auth", "eventSignature", "revocationSignature"]);

export function canonicalJson(value: unknown): string {
  return serialize(value, new Set<object>());
}

export function stripSignatureFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSignatureFields(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!SIGNATURE_FIELDS.has(key)) {
      result[key] = value[key];
    }
  }
  return result;
}

export function hmacHex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function hmacBase64Url(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function signatureMatches(secret: string, value: string, signature: string): boolean {
  const extracted = extractSignature(signature);
  if (!extracted) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(value, "utf8").digest();
  const provided = decodeSignature(extracted);
  if (!provided) {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function signatureMatchesAny(secret: string, values: string[], signature: string): boolean {
  return values.some((value) => signatureMatches(secret, value, signature));
}

export function signValue(secret: string, value: unknown, encoding: "hex" | "base64url" = "hex"): string {
  const serialized = canonicalJson(value);
  return encoding === "hex" ? hmacHex(secret, serialized) : hmacBase64Url(secret, serialized);
}

export function extractSignature(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const withoutPrefix = trimmed.replace(/^(?:hmac(?:-sha256)?|sha256)\s*[:=]?\s*/i, "");
    return withoutPrefix;
  }
  if (!isRecord(value)) {
    return null;
  }
  for (const key of ["signature", "hmac", "mac", "digest", "value", "eventSignature", "revocationSignature"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return extractSignature(candidate);
    }
  }
  return null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeSignature(value: string): Buffer | null {
  const normalized = value.replace(/^sha256=/i, "").trim();
  if (/^[a-f0-9]+$/i.test(normalized) && normalized.length % 2 === 0) {
    return Buffer.from(normalized, "hex");
  }
  const base64 = normalized.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  try {
    const decoded = Buffer.from(padded, "base64");
    if (decoded.length === 32 && decoded.toString("base64").replace(/=+$/, "") === base64.replace(/=+$/, "")) {
      return decoded;
    }
  } catch {
    return null;
  }
  return null;
}

function serialize(value: unknown, seen: Set<object>): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Non-finite numbers cannot be signed");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new TypeError("Unsupported value in signed payload");
  }
  if (typeof value !== "object") {
    throw new TypeError("Unsupported value in signed payload");
  }
  if (seen.has(value)) {
    throw new TypeError("Circular values cannot be signed");
  }
  seen.add(value);
  let result: string;
  if (Array.isArray(value)) {
    result = `[${value.map((item) => serialize(item, seen)).join(",")}]`;
  } else {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${serialize(record[key], seen)}`);
    result = `{${entries.join(",")}}`;
  }
  seen.delete(value);
  return result;
}

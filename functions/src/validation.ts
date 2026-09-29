import { AppError } from "./errors.js";

export function asRecord(value: unknown, name = "request"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError("invalid-argument", `${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function assertAllowedKeys(record: Record<string, unknown>, allowed: readonly string[]): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(record).some((key) => !allowedSet.has(key))) {
    throw new AppError("invalid-argument", "Request contains unsupported fields");
  }
}

export function requiredString(record: Record<string, unknown>, key: string, minimum = 1, maximum = 256): string {
  const value = record[key];
  if (typeof value !== "string") throw new AppError("invalid-argument", `${key} is required`);
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new AppError("invalid-argument", `${key} has an invalid length`);
  }
  return normalized;
}

export function optionalString(record: Record<string, unknown>, key: string, minimum = 1, maximum = 256): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new AppError("invalid-argument", `${key} must be a string`);
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new AppError("invalid-argument", `${key} has an invalid length`);
  }
  return normalized;
}

export function requiredId(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 1, 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) {
    throw new AppError("invalid-argument", `${key} has an invalid format`);
  }
  return value;
}

export function optionalId(record: Record<string, unknown>, key: string): string | undefined {
  const value = optionalString(record, key, 1, 128);
  if (value === undefined) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) {
    throw new AppError("invalid-argument", `${key} has an invalid format`);
  }
  return value;
}

export function requiredEmail(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 3, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return value;
}

export function optionalEmail(record: Record<string, unknown>, key: string): string | undefined {
  const value = optionalString(record, key, 3, 320);
  if (value === undefined) return undefined;
  const normalized = value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return normalized;
}

export function requiredPhone(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 8, 32);
  const normalized = normalizePhone(value);
  if (normalized === undefined) throw new AppError("invalid-argument", `${key} is invalid`);
  return normalized;
}

export function optionalPhone(record: Record<string, unknown>, key: string): string | undefined {
  const value = optionalString(record, key, 8, 32);
  if (value === undefined) return undefined;
  const normalized = normalizePhone(value);
  if (normalized === undefined) throw new AppError("invalid-argument", `${key} is invalid`);
  return normalized;
}

export function normalizePhone(value: string): string | undefined {
  const trimmed = value.trim().replace(/^whatsapp:/i, "");
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return `${hasPlus ? "+" : ""}${digits}`;
}

export function requiredNumber(record: Record<string, unknown>, key: string, minimum: number, maximum: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return value;
}

export function optionalNumber(record: Record<string, unknown>, key: string, minimum: number, maximum: number): number | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return value;
}

export function requiredBoolean(record: Record<string, unknown>, key: string, fallback?: boolean): boolean {
  const value = record[key];
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "boolean") throw new AppError("invalid-argument", `${key} must be boolean`);
  return value;
}

export function requiredEnum<T extends string>(record: Record<string, unknown>, key: string, values: readonly T[]): T {
  const value = record[key];
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return value as T;
}

export function safeReturnPath(record: Record<string, unknown>, key: string): string | undefined {
  const value = optionalString(record, key, 1, 512);
  if (value === undefined) return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    throw new AppError("invalid-argument", `${key} is invalid`);
  }
  return value;
}

export function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

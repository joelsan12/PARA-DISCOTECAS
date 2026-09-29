import { Timestamp } from "firebase-admin/firestore";
import { db } from "./config.js";
import { asRecord, numberValue, stringValue } from "./validation.js";

export function timestampMillis(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const seconds = numberValue(record.seconds);
    const nanos = numberValue(record.nanoseconds) ?? 0;
    if (seconds !== undefined) return Math.floor(seconds * 1000 + nanos / 1_000_000);
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function isActiveBusinessStatus(value: unknown): boolean {
  return value === "active" || value === "trial";
}

export async function requireActiveBusiness(businessId: string): Promise<void> {
  const snapshot = await db.collection("businesses").doc(businessId).get();
  if (!snapshot.exists) throw new Error("Business not found");
  const data = asRecord(snapshot.data(), "business");
  if (!isActiveBusinessStatus(data.status)) throw new Error("Business is not active");
}

export function dataString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function dataNumber(data: Record<string, unknown>, key: string): number | undefined {
  return numberValue(data[key]);
}

export function dataRecord(value: unknown): Record<string, unknown> {
  return asRecord(value, "document");
}

export function dataBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function dataStringOrEmpty(value: unknown): string {
  return stringValue(value);
}

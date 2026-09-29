import { randomUUID } from "node:crypto";
import { extractSignature, isRecord } from "./crypto.js";
import type { GatewayRole } from "./types.js";

export interface NormalizedEvent {
  kind: "event";
  eventId: string;
  deviceId: string;
  deviceSequence: number;
  eventType: string;
  occurredAt: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  signature: string | null;
}

export interface NormalizedRevocation {
  kind: "revocation";
  revocationId: string;
  subject: string;
  subjectType: string;
  reason: string;
  revokedAt: string;
  expiresAt: string | null;
  issuedBy: string;
  metadata: Record<string, unknown>;
  signature: string | null;
}

export class ProtocolError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}

export function normalizeEvent(value: unknown): NormalizedEvent {
  const outer = isRecord(value) ? value : {};
  const nested = isRecord(outer.event) ? outer.event : isRecord(outer.data) && looksLikeEvent(outer.data) ? outer.data : undefined;
  const source = nested ?? outer;
  const eventId = firstString(source.eventId, source.event_id, source.messageId, nested?.eventId, outer.eventId, nested?.id, outer.id);
  const deviceId = firstString(source.deviceId, source.device_id, source.terminalId, source.terminal_id, nested?.deviceId, outer.deviceId);
  const deviceSequence = firstInteger(source.deviceSequence, source.device_sequence, source.sequence, source.seq, nested?.deviceSequence, outer.deviceSequence);
  if (!eventId || eventId.length > 256) {
    throw new ProtocolError("eventId is required");
  }
  if (!deviceId || deviceId.length > 256) {
    throw new ProtocolError("deviceId is required");
  }
  if (deviceSequence === null || deviceSequence < 0) {
    throw new ProtocolError("deviceSequence must be a non-negative integer");
  }
  const outerType = firstString(outer.type);
  const eventType = firstString(source.eventType, source.event_type, source.kind, nested?.eventType, outer.eventType)
    ?? (outerType && outerType !== "event" && outerType !== "terminal_event" && outerType !== "door_event" && outerType !== "access_event" ? outerType : "door_event");
  const occurredAt = normalizeDate(firstString(source.occurredAt, source.occurred_at, source.timestamp, source.createdAt, nested?.occurredAt, outer.occurredAt, outer.timestamp), "occurredAt");
  const payload = source.payload ?? source.data ?? source.result ?? {};
  const metadata = isRecord(source.metadata) ? { ...source.metadata } : {};
  const signature = extractSignature(outer) ?? extractSignature(source);
  return {
    kind: "event",
    eventId,
    deviceId,
    deviceSequence,
    eventType: eventType.slice(0, 128),
    occurredAt,
    payload,
    metadata,
    signature
  };
}

export function normalizeRevocation(value: unknown, fallbackIssuer = "api"): NormalizedRevocation {
  const outer = isRecord(value) ? value : {};
  const nested = isRecord(outer.revocation) ? outer.revocation : isRecord(outer.data) && looksLikeRevocation(outer.data) ? outer.data : undefined;
  const source = nested ?? outer;
  const suppliedRevocationId = firstString(source.revocationId, source.revocation_id, source.id, nested?.revocationId, outer.revocationId);
  const subject = firstString(source.subject, source.target, source.ticketId, source.ticket_id, source.credentialId, source.credential_id, source.deviceId, nested?.subject, outer.subject) ?? "all";
  const revocationId = suppliedRevocationId ?? (subject === "all" ? `revocation-${randomUUID()}` : `subject-${subject}`.slice(0, 256));
  if (revocationId.length > 256) {
    throw new ProtocolError("revocationId is too long");
  }
  const subjectTypeValue = firstString(source.subjectType, source.subject_type, source.type, nested?.subjectType, outer.subjectType);
  const subjectType = subjectTypeValue && subjectTypeValue !== "revocation" && subjectTypeValue !== "revoke"
    ? subjectTypeValue
    : inferSubjectType(source, subject);
  const reason = firstString(source.reason, source.note, nested?.reason, outer.reason) ?? "revoked";
  const revokedAt = normalizeDate(firstString(source.revokedAt, source.revoked_at, source.timestamp, nested?.revokedAt), "revokedAt");
  const expiresAtValue = firstString(source.expiresAt, source.expires_at, nested?.expiresAt, outer.expiresAt);
  const issuedBy = firstString(source.issuedBy, source.issued_by, source.issuer, nested?.issuedBy, outer.issuedBy) ?? fallbackIssuer;
  const metadata = isRecord(source.metadata) ? { ...source.metadata } : {};
  const signature = extractSignature(outer) ?? extractSignature(source);
  return {
    kind: "revocation",
    revocationId,
    subject,
    subjectType: subjectType.slice(0, 64),
    reason: reason.slice(0, 1024),
    revokedAt,
    expiresAt: expiresAtValue ? normalizeDate(expiresAtValue, "expiresAt") : null,
    issuedBy: issuedBy.slice(0, 256),
    metadata,
    signature
  };
}

export function normalizeRole(value: unknown, hasDeviceId: boolean): GatewayRole | null {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (role === "terminal" || role === "device") {
    return "terminal";
  }
  if (role === "client" || role === "observer" || role === "admin" || role === "gateway") {
    return role === "gateway" ? "client" : role;
  }
  if (role.length === 0) {
    return hasDeviceId ? "terminal" : "client";
  }
  return null;
}

function looksLikeEvent(value: Record<string, unknown>): boolean {
  return value.eventId !== undefined || value.event_id !== undefined || value.deviceId !== undefined || value.device_id !== undefined || value.deviceSequence !== undefined || value.device_sequence !== undefined;
}

function looksLikeRevocation(value: Record<string, unknown>): boolean {
  return value.revocationId !== undefined || value.revocation_id !== undefined || value.subject !== undefined || value.ticketId !== undefined || value.ticket_id !== undefined;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function firstInteger(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/u.test(value.trim())) {
      return Number(value);
    }
  }
  return null;
}

function normalizeDate(value: string | null, name: string): string {
  if (!value) {
    return new Date().toISOString();
  }
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ProtocolError(`${name} must be a valid date`);
  }
  return date.toISOString();
}

function inferSubjectType(source: Record<string, unknown>, subject: string): string {
  if (subject === "all") {
    return "all";
  }
  if (typeof source.ticketId === "string" || typeof source.ticket_id === "string" || subject.startsWith("ticket:")) {
    return "ticket";
  }
  if (typeof source.credentialId === "string" || typeof source.credential_id === "string" || subject.startsWith("credential:")) {
    return "credential";
  }
  if (typeof source.deviceId === "string" || typeof source.device_id === "string" || subject === "all") {
    return source.deviceId === undefined && subject !== "all" ? "unknown" : "device";
  }
  return "unknown";
}

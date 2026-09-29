import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { isRecord } from "./crypto.js";
import type { PersistedRecord, StoredEvent, StoredRevocation } from "./types.js";

export type EventClaim = "accepted" | "duplicate-event-id" | "duplicate-device-sequence" | "stale-device-sequence";

export interface EventQuery {
  since?: string;
  limit?: number;
}

export interface RevocationQuery {
  limit?: number;
}

export class JsonlStore {
  private readonly filePath: string;
  private readonly eventIds = new Set<string>();
  private readonly deviceSequences = new Map<string, Set<number>>();
  private readonly lastSequences = new Map<string, number>();
  private readonly revocationIds = new Set<string>();
  private readonly events: StoredEvent[] = [];
  private readonly revocations: StoredRevocation[] = [];
  private appendChain: Promise<void> = Promise.resolve();

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    let content = "";
    try {
      content = await readFile(this.filePath, "utf8");
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }
    for (const line of content.split(/\r?\n/u)) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const record: unknown = JSON.parse(line);
        if (isRecord(record) && record.kind === "event") {
          this.restoreEvent(record);
        } else if (isRecord(record) && record.kind === "revocation") {
          this.restoreRevocation(record);
        }
      } catch {
        continue;
      }
    }
  }

  public claimEvent(eventId: string, deviceId: string, deviceSequence: number): EventClaim {
    if (this.eventIds.has(eventId)) {
      return "duplicate-event-id";
    }
    if (this.deviceSequences.get(deviceId)?.has(deviceSequence)) {
      return "duplicate-device-sequence";
    }
    const lastSequence = this.lastSequences.get(deviceId);
    if (lastSequence !== undefined && deviceSequence <= lastSequence) {
      return "stale-device-sequence";
    }
    this.eventIds.add(eventId);
    const deviceSet = this.deviceSequences.get(deviceId) ?? new Set<number>();
    deviceSet.add(deviceSequence);
    this.deviceSequences.set(deviceId, deviceSet);
    this.lastSequences.set(deviceId, deviceSequence);
    return "accepted";
  }

  public releaseEvent(eventId: string, deviceId: string, deviceSequence: number): void {
    this.eventIds.delete(eventId);
    const deviceSet = this.deviceSequences.get(deviceId);
    deviceSet?.delete(deviceSequence);
    if (deviceSet && deviceSet.size > 0) {
      this.lastSequences.set(deviceId, Math.max(...deviceSet));
    } else {
      this.deviceSequences.delete(deviceId);
      this.lastSequences.delete(deviceId);
    }
  }

  public async appendEvent(event: StoredEvent): Promise<void> {
    await this.appendRecord(event);
    this.events.push(event);
  }

  public async appendRevocation(revocation: StoredRevocation): Promise<void> {
    await this.appendRecord(revocation);
    this.revocations.push(revocation);
  }

  public claimRevocation(revocationId: string): boolean {
    if (this.revocationIds.has(revocationId)) {
      return false;
    }
    this.revocationIds.add(revocationId);
    return true;
  }

  public releaseRevocation(revocationId: string): void {
    this.revocationIds.delete(revocationId);
  }

  public hasRevocation(revocationId: string): boolean {
    return this.revocationIds.has(revocationId);
  }

  public getRevocation(revocationId: string): StoredRevocation | null {
    return this.revocations.find((item) => item.revocationId === revocationId) ?? null;
  }

  public getEvents(query: EventQuery = {}): StoredEvent[] {
    const limit = boundedLimit(query.limit, 500);
    const since = query.since ? Date.parse(query.since) : Number.NaN;
    const filtered = Number.isNaN(since)
      ? this.events
      : this.events.filter((event) => Date.parse(event.occurredAt) >= since || Date.parse(event.persistedAt) >= since);
    return filtered.slice(-limit);
  }

  public getRevocations(query: RevocationQuery = {}): StoredRevocation[] {
    return this.revocations.slice(-boundedLimit(query.limit, 500));
  }

  public get eventCount(): number {
    return this.events.length;
  }

  public get revocationCount(): number {
    return this.revocations.length;
  }

  public get recordCount(): number {
    return this.events.length + this.revocations.length;
  }

  public async flush(): Promise<void> {
    await this.appendChain;
  }

  private async appendRecord(record: PersistedRecord): Promise<void> {
    const operation = this.appendChain.then(() => appendFile(this.filePath, `${JSON.stringify(record)}\n`, "utf8"));
    this.appendChain = operation.catch(() => undefined);
    await operation;
  }

  private restoreEvent(record: Record<string, unknown>): void {
    const eventId = stringValue(record.eventId);
    const deviceId = stringValue(record.deviceId);
    const deviceSequence = numberValue(record.deviceSequence);
    if (!eventId || !deviceId || deviceSequence === null || deviceSequence < 0 || this.eventIds.has(eventId)) {
      return;
    }
    this.eventIds.add(eventId);
    const deviceSet = this.deviceSequences.get(deviceId) ?? new Set<number>();
    deviceSet.add(deviceSequence);
    this.deviceSequences.set(deviceId, deviceSet);
    this.lastSequences.set(deviceId, Math.max(this.lastSequences.get(deviceId) ?? -1, deviceSequence));
    this.events.push(record as unknown as StoredEvent);
  }

  private restoreRevocation(record: Record<string, unknown>): void {
    const revocationId = stringValue(record.revocationId);
    if (!revocationId || this.revocationIds.has(revocationId)) {
      return;
    }
    this.revocationIds.add(revocationId);
    this.revocations.push(record as unknown as StoredRevocation);
  }
}

function boundedLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(500, Math.floor(value)));
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/u.test(value)) {
    return Number(value);
  }
  return null;
}

function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

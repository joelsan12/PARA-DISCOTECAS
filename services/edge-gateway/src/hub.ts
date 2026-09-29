import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import WebSocket, { type RawData } from "ws";
import { authenticateMessage, authenticateUpgrade } from "./auth.js";
import { canonicalJson, hmacHex, isRecord, signatureMatchesAny, stripSignatureFields } from "./crypto.js";
import { JsonlStore } from "./persistence.js";
import { normalizeEvent, normalizeRevocation, ProtocolError, type NormalizedEvent, type NormalizedRevocation } from "./protocol.js";
import type { AuthIdentity, GatewayConfig, PresenceEntry, StoredEvent, StoredRevocation, SyncSnapshot } from "./types.js";

interface ClientRecord {
  socket: WebSocket;
  id: string;
  identity: AuthIdentity | null;
  authMethod: "hmac" | "token" | null;
  remoteAddress: string;
  connectedAt: number;
  lastSeen: number;
  authTimer: NodeJS.Timeout | null;
  deviceKey: string | null;
}

export interface HubCounts {
  total: number;
  authenticated: number;
  pending: number;
  devices: number;
}

export class GatewayHub {
  private readonly clients = new Map<string, ClientRecord>();
  private readonly pendingRevocations = new Map<string, StoredRevocation>();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  public constructor(
    private readonly config: GatewayConfig,
    private readonly store: JsonlStore
  ) {}

  public handleConnection(socket: WebSocket, request: IncomingMessage, url: URL): void {
    if (this.clients.size >= this.config.maxConnections) {
      socket.close(1013, "gateway connection limit reached");
      return;
    }
    const record: ClientRecord = {
      socket,
      id: randomUUID(),
      identity: null,
      authMethod: null,
      remoteAddress: request.socket.remoteAddress ?? "",
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      authTimer: null,
      deviceKey: null
    };
    this.clients.set(record.id, record);
    socket.on("message", (data, isBinary) => {
      record.lastSeen = Date.now();
      if (isBinary) {
        this.sendError(record, "BINARY_NOT_ALLOWED", "binary messages are not supported");
        return;
      }
      void this.handleMessage(record, data).catch(() => {
        this.sendError(record, "INTERNAL_ERROR", "gateway could not process the message");
      });
    });
    socket.on("pong", () => {
      record.lastSeen = Date.now();
    });
    socket.on("error", () => undefined);
    socket.on("close", () => this.handleClose(record));

    void (async () => {
      const handshake = await authenticateUpgrade(this.config, request.headers, url);
      if (handshake.ok && handshake.identity) {
        this.activate(record, handshake.identity, handshake.method, url.searchParams.get("since") ?? url.searchParams.get("cursor") ?? undefined, queryLimit(url.searchParams.get("limit")));
        return;
      }
      if (!this.config.secretConfigured && !this.config.idTokenConfigured) {
        this.send(record, {
          type: "error",
          code: "AUTH_NOT_CONFIGURED",
          message: "EDGE_HMAC_SECRET or EDGE_FIREBASE_PROJECT_ID is not configured"
        });
        socket.close(1008, "authentication is not configured");
        return;
      }
      this.send(record, this.authRequiredMessage());
      record.authTimer = setTimeout(() => {
        if (!record.identity) {
          this.sendError(record, "AUTH_TIMEOUT", "authentication is required");
          socket.close(1008, "authentication timeout");
        }
      }, this.config.authTimeoutMs);
      record.authTimer.unref();
    })().catch(() => {
      this.sendError(record, "AUTH_FAILED", "authentication could not be verified");
      socket.close(1008, "authentication failed");
    });
  }

  public getCounts(): HubCounts {
    const authenticated = [...this.clients.values()].filter((client) => client.identity !== null);
    return {
      total: this.clients.size,
      authenticated: authenticated.length,
      pending: this.clients.size - authenticated.length,
      devices: new Set(authenticated.map((client) => identityKey(client.identity))).size
    };
  }

  public getPresence(): PresenceEntry[] {
    const entries = new Map<string, PresenceEntry>();
    for (const client of this.clients.values()) {
      if (!client.identity) {
        continue;
      }
      const identity = client.identity;
      const key = identityKey(identity);
      entries.set(key, {
        deviceId: identity.deviceId,
        clientId: identity.clientId,
        role: identity.role,
        state: "online",
        connectedAt: new Date(client.connectedAt).toISOString(),
        lastSeenAt: new Date(client.lastSeen).toISOString(),
        remoteAddress: client.remoteAddress
      });
    }
    return [...entries.values()].sort((left, right) => left.deviceId.localeCompare(right.deviceId) || left.clientId.localeCompare(right.clientId));
  }

  public getSnapshot(since?: string, limit?: number): SyncSnapshot {
    return {
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      generatedAt: new Date().toISOString(),
      events: this.store.getEvents({ since, limit }),
      revocations: this.store.getRevocations({ limit }),
      presence: this.getPresence()
    };
  }

  public startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.heartbeatIntervalMs * 2;
      for (const client of this.clients.values()) {
        if (now - client.lastSeen > timeout) {
          client.socket.terminate();
          continue;
        }
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      }
    }, this.config.heartbeatIntervalMs);
    this.heartbeatTimer.unref();
  }

  public close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      if (client.authTimer) {
        clearTimeout(client.authTimer);
      }
      client.socket.terminate();
    }
    this.clients.clear();
  }

  private activate(record: ClientRecord, identity: AuthIdentity, method: "hmac" | "token" | null, since?: string, limit?: number): void {
    if (record.identity) {
      return;
    }
    if (identity.deviceId.length > 0) {
      for (const existing of this.clients.values()) {
        if (existing.id !== record.id && existing.identity?.deviceId === identity.deviceId) {
          existing.socket.close(4001, "device replaced by a newer connection");
        }
      }
    }
    record.identity = identity;
    record.authMethod = method;
    record.deviceKey = identityKey(identity);
    if (record.authTimer) {
      clearTimeout(record.authTimer);
      record.authTimer = null;
    }
    this.send(record, {
      type: "ready",
      connectionId: record.id,
      gateway: this.gatewayPayload(),
      authenticatedAt: new Date().toISOString(),
      identity
    });
    this.sendSync(record, since, limit);
    this.broadcastPresence("online", identity);
  }

  private async handleMessage(record: ClientRecord, data: RawData): Promise<void> {
    const text = rawDataToString(data);
    if (Buffer.byteLength(text, "utf8") > this.config.maxMessageBytes) {
      this.sendError(record, "MESSAGE_TOO_LARGE", "message exceeds the configured limit");
      return;
    }
    let message: unknown;
    try {
      message = JSON.parse(text) as unknown;
    } catch {
      this.sendError(record, "INVALID_JSON", "message must be valid JSON");
      return;
    }
    if (!isRecord(message)) {
      this.sendError(record, "INVALID_MESSAGE", "message must be a JSON object");
      return;
    }
    const messageType = stringValue(message.type) ?? stringValue(message.action) ?? stringValue(message.kind) ?? "";
    if (!record.identity && (messageType === "auth" || messageType === "authenticate" || messageType === "hello" || messageType === "register" || messageType === "login")) {
      const authentication = await authenticateMessage(this.config, message);
      if (!authentication.ok || !authentication.identity) {
        this.sendError(record, "AUTH_INVALID", authentication.reason);
        return;
      }
      this.activate(record, authentication.identity, authentication.method);
      return;
    }
    if (!record.identity) {
      this.sendError(record, "AUTH_REQUIRED", "authenticate before sending gateway messages");
      return;
    }
    if (messageType === "ping") {
      this.send(record, { type: "pong", gatewayId: this.config.gatewayId, serverTime: new Date().toISOString() });
      return;
    }
    if (messageType === "heartbeat" || messageType === "presence") {
      this.handlePresenceMessage(record);
      return;
    }
    if (messageType === "sync" || messageType === "sync_request" || messageType === "snapshot" || messageType === "subscribe" || messageType === "subscribe_revocations" || messageType === "get_revocations") {
      this.sendSync(record, stringValue(message.since) ?? stringValue(message.cursor), optionalLimit(message.limit));
      return;
    }
    if (messageType === "event" || messageType === "terminal_event" || messageType === "door_event" || messageType === "access_event" || isRecord(message.event)) {
      await this.processEvent(record, message);
      return;
    }
    if (messageType === "revoke" || messageType === "revocation") {
      await this.processRevocation(record, message);
      return;
    }
    this.sendError(record, "UNKNOWN_MESSAGE_TYPE", `unsupported message type: ${messageType || "missing"}`);
  }

  private async processEvent(record: ClientRecord, message: Record<string, unknown>): Promise<void> {
    let event: NormalizedEvent;
    try {
      event = normalizeEvent(message);
    } catch (error) {
      this.sendProtocolError(record, error);
      return;
    }
    const tokenAuthed = record.authMethod === "token";
    if (!event.signature) {
      if (!tokenAuthed) {
        this.sendError(record, "EVENT_SIGNATURE_REQUIRED", "events must include an HMAC signature");
        return;
      }
    } else if (!verifyEventSignature(this.config.hmacSecret, message, event, event.signature)) {
      this.sendError(record, "EVENT_SIGNATURE_INVALID", "event HMAC signature is invalid");
      return;
    }
    const identity = record.identity;
    if (identity && identity.role === "terminal" && identity.deviceId.length > 0 && identity.deviceId !== event.deviceId) {
      this.sendError(record, "DEVICE_MISMATCH", "event deviceId does not match the authenticated terminal");
      return;
    }
    const claim = this.store.claimEvent(event.eventId, event.deviceId, event.deviceSequence);
    if (claim !== "accepted") {
      this.send(record, {
        type: "event_ack",
        status: "duplicate",
        duplicate: true,
        reason: claim,
        eventId: event.eventId,
        deviceId: event.deviceId,
        deviceSequence: event.deviceSequence
      });
      return;
    }
    const receivedAt = new Date().toISOString();
    const persistedAt = receivedAt;
    const unsigned: Omit<StoredEvent, "signature" | "hmac"> = {
      kind: "event",
      eventId: event.eventId,
      deviceId: event.deviceId,
      deviceSequence: event.deviceSequence,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      payload: event.payload,
      metadata: event.metadata,
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventContext: this.config.eventId,
      gatewayEventId: this.config.eventId,
      receivedAt,
      persistedAt
    };
    const signature = hmacHex(this.config.hmacSecret, canonicalJson(unsigned));
    const stored: StoredEvent = { ...unsigned, signature, hmac: signature };
    try {
      await this.store.appendEvent(stored);
    } catch {
      this.store.releaseEvent(event.eventId, event.deviceId, event.deviceSequence);
      this.sendError(record, "PERSISTENCE_ERROR", "event could not be persisted");
      return;
    }
    this.broadcast({
      type: "event",
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      emittedAt: receivedAt,
      event: stored,
      eventIdValue: stored.eventId,
      eventType: stored.eventType,
      occurredAt: stored.occurredAt,
      signature: stored.signature,
      deviceId: stored.deviceId,
      deviceSequence: stored.deviceSequence
    });
    this.send(record, {
      type: "event_ack",
      status: "accepted",
      duplicate: false,
      eventId: stored.eventId,
      deviceId: stored.deviceId,
      deviceSequence: stored.deviceSequence,
      signature: stored.signature
    });
  }

  public async acceptRevocation(
    revocation: NormalizedRevocation,
    issuer: string
  ): Promise<{ stored: StoredRevocation; duplicate: boolean }> {
    const existing = this.store.getRevocation(revocation.revocationId) ?? this.pendingRevocations.get(revocation.revocationId);
    if (existing) {
      return { stored: existing, duplicate: true };
    }
    if (!this.store.claimRevocation(revocation.revocationId)) {
      const duplicate = this.store.getRevocation(revocation.revocationId) ?? this.pendingRevocations.get(revocation.revocationId);
      if (duplicate) {
        return { stored: duplicate, duplicate: true };
      }
      throw new Error("revocation state changed while accepting record");
    }
    const stored = this.signedRevocation(revocation, issuer);
    this.pendingRevocations.set(revocation.revocationId, stored);
    try {
      await this.store.appendRevocation(stored);
      this.pendingRevocations.delete(revocation.revocationId);
    } catch (error) {
      this.pendingRevocations.delete(revocation.revocationId);
      this.store.releaseRevocation(revocation.revocationId);
      throw error;
    }
    this.broadcast({
      type: "revocation",
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      emittedAt: stored.persistedAt,
      revocation: stored,
      revocations: [stored],
      revocationId: stored.revocationId,
      subject: stored.subject,
      signature: stored.signature
    });
    return { stored, duplicate: false };
  }

  private async processRevocation(record: ClientRecord, message: Record<string, unknown>): Promise<void> {
    let revocation: NormalizedRevocation;
    try {
      revocation = normalizeRevocation(message, record.identity?.clientId ?? "api");
    } catch (error) {
      this.sendProtocolError(record, error);
      return;
    }
    if (!revocation.signature) {
      this.sendError(record, "REVOCATION_SIGNATURE_REQUIRED", "revocations must include an HMAC signature");
      return;
    }
    if (!verifyRevocationSignature(this.config.hmacSecret, message, revocation, revocation.signature)) {
      this.sendError(record, "REVOCATION_SIGNATURE_INVALID", "revocation HMAC signature is invalid");
      return;
    }
    try {
      const result = await this.acceptRevocation(revocation, record.identity?.clientId ?? "api");
      this.send(record, {
        type: "revocation_ack",
        status: result.duplicate ? "duplicate" : "accepted",
        duplicate: result.duplicate,
        revocationId: result.stored.revocationId,
        signature: result.duplicate ? undefined : result.stored.signature
      });
    } catch {
      this.sendError(record, "PERSISTENCE_ERROR", "revocation could not be persisted");
    }
  }

  private signedRevocation(revocation: NormalizedRevocation, issuer: string): StoredRevocation {
    const persistedAt = new Date().toISOString();
    const unsigned: Omit<StoredRevocation, "signature" | "hmac"> = {
      kind: "revocation",
      revocationId: revocation.revocationId,
      subject: revocation.subject,
      subjectType: revocation.subjectType,
      reason: revocation.reason,
      revokedAt: revocation.revokedAt,
      expiresAt: revocation.expiresAt,
      issuedBy: revocation.issuedBy || issuer,
      metadata: revocation.metadata,
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      persistedAt
    };
    const signature = hmacHex(this.config.hmacSecret, canonicalJson(unsigned));
    return { ...unsigned, signature, hmac: signature };
  }

  private handlePresenceMessage(record: ClientRecord): void {
    if (!record.identity) {
      return;
    }
    record.lastSeen = Date.now();
    this.send(record, {
      type: "presence_ack",
      gatewayId: this.config.gatewayId,
      presence: this.getPresence().find((entry) => identityKeyFromEntry(entry) === identityKey(record.identity)) ?? null,
      serverTime: new Date().toISOString()
    });
  }

  private handleClose(record: ClientRecord): void {
    if (record.authTimer) {
      clearTimeout(record.authTimer);
    }
    this.clients.delete(record.id);
    if (record.identity && this.isCurrentIdentity(record.identity)) {
      this.broadcastPresence("offline", record.identity);
    }
  }

  private isCurrentIdentity(identity: AuthIdentity): boolean {
    const key = identityKey(identity);
    return [...this.clients.values()].some((client) => client.identity && identityKey(client.identity) === key);
  }

  private broadcastPresence(state: "online" | "offline", identity: AuthIdentity): void {
    const entry: PresenceEntry = {
      deviceId: identity.deviceId,
      clientId: identity.clientId,
      role: identity.role,
      state,
      connectedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      remoteAddress: ""
    };
    const existing = this.getPresence().find((item) => identityKeyFromEntry(item) === identityKey(identity));
    this.broadcast({
      type: "presence",
      state,
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      presence: existing ? { ...existing, state } : entry,
      deviceId: identity.deviceId,
      clientId: identity.clientId,
      role: identity.role,
      emittedAt: new Date().toISOString()
    });
  }

  private sendSync(record: ClientRecord, since: string | undefined, limit: number | undefined): void {
    const snapshot = this.getSnapshot(since, limit);
    this.send(record, {
      type: "sync",
      requestType: "sync",
      gatewayId: snapshot.gatewayId,
      businessId: snapshot.businessId,
      eventId: snapshot.eventId,
      generatedAt: snapshot.generatedAt,
      snapshot,
      events: snapshot.events,
      revocations: snapshot.revocations,
      presence: snapshot.presence
    });
  }

  private gatewayPayload(): Record<string, unknown> {
    return {
      service: "edge-gateway",
      gatewayId: this.config.gatewayId,
      instanceId: this.config.instanceId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      protocol: "door-link",
      protocolVersion: 1,
      websocketPath: "/v1/door-link",
      hmacConfigured: this.config.secretConfigured,
      idTokenConfigured: this.config.idTokenConfigured
    };
  }

  private authRequiredMessage(): Record<string, unknown> {
    return {
      type: "auth_required",
      gateway: this.gatewayPayload(),
      message: "send an HMAC-signed auth message or a Firebase session token",
      expiresInMs: this.config.authTimeoutMs
    };
  }

  private broadcast(message: Record<string, unknown>): void {
    for (const client of this.clients.values()) {
      if (client.identity) {
        this.send(client, message);
      }
    }
  }

  private send(record: ClientRecord, message: Record<string, unknown>): void {
    if (record.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      record.socket.send(JSON.stringify(message));
    } catch {
      record.socket.terminate();
    }
  }

  private sendError(record: ClientRecord, code: string, message: string): void {
    this.send(record, {
      type: "error",
      code,
      message,
      gatewayId: this.config.gatewayId,
      serverTime: new Date().toISOString()
    });
  }

  private sendProtocolError(record: ClientRecord, error: unknown): void {
    const message = error instanceof ProtocolError ? error.message : "invalid protocol message";
    const code = error instanceof ProtocolError ? "PROTOCOL_ERROR" : "INVALID_MESSAGE";
    this.sendError(record, code, message);
  }
}

function identityKey(identity: AuthIdentity | null): string {
  if (!identity) {
    return "";
  }
  return identity.deviceId || identity.clientId;
}

function identityKeyFromEntry(entry: PresenceEntry): string {
  return entry.deviceId || entry.clientId;
}

function verifyEventSignature(secret: string, message: Record<string, unknown>, event: NormalizedEvent, signature: string): boolean {
  const nested = isRecord(message.event) ? message.event : isRecord(message.data) && looksLikeEventRecord(message.data) ? message.data : message;
  const withoutSignature = stripSignatureFields(nested);
  const withoutControlFields = removeControlFields(withoutSignature);
  const normalized = { ...event, signature: undefined, hmac: undefined };
  return signatureMatchesAny(secret, unique([
    canonicalJson(withoutSignature),
    JSON.stringify(withoutSignature),
    canonicalJson(withoutControlFields),
    JSON.stringify(withoutControlFields),
    canonicalJson(normalized),
    JSON.stringify(normalized),
    canonicalJson(event.payload),
    JSON.stringify(event.payload),
    event.eventId + ":" + event.deviceId + ":" + event.deviceSequence,
    event.eventId + ":" + event.deviceSequence,
    event.eventId + ":" + event.deviceId,
    event.eventId,
    JSON.stringify({ eventId: event.eventId, deviceId: event.deviceId, deviceSequence: event.deviceSequence }),
    JSON.stringify({ eventId: event.eventId, deviceSequence: event.deviceSequence }),
    event.deviceId + ":" + event.deviceSequence + ":" + event.occurredAt
  ]), signature);
}

function verifyRevocationSignature(secret: string, message: Record<string, unknown>, revocation: NormalizedRevocation, signature: string): boolean {
  const nested = isRecord(message.revocation) ? message.revocation : isRecord(message.data) && looksLikeRevocationRecord(message.data) ? message.data : message;
  const withoutSignature = stripSignatureFields(nested);
  const withoutControlFields = removeControlFields(withoutSignature);
  const normalized = { ...revocation, signature: undefined, hmac: undefined };
  return signatureMatchesAny(secret, unique([
    canonicalJson(withoutSignature),
    JSON.stringify(withoutSignature),
    canonicalJson(withoutControlFields),
    JSON.stringify(withoutControlFields),
    canonicalJson(normalized),
    JSON.stringify(normalized),
    revocation.revocationId + ":" + revocation.subject,
    revocation.revocationId + ":" + revocation.subjectType,
    revocation.revocationId,
    JSON.stringify({ revocationId: revocation.revocationId, subject: revocation.subject }),
    JSON.stringify({ revocationId: revocation.revocationId })
  ]), signature);
}

function looksLikeEventRecord(value: Record<string, unknown>): boolean {
  return value.eventId !== undefined || value.event_id !== undefined || value.deviceId !== undefined || value.device_id !== undefined || value.deviceSequence !== undefined || value.device_sequence !== undefined;
}

function looksLikeRevocationRecord(value: Record<string, unknown>): boolean {
  return value.revocationId !== undefined || value.revocation_id !== undefined || value.subject !== undefined || value.ticketId !== undefined || value.ticket_id !== undefined;
}

function removeControlFields(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (key !== "type" && key !== "action" && key !== "kind") {
      result[key] = value[key];
    }
  }
  return result;
}

function rawDataToString(data: RawData): string {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }
  return Buffer.from(data).toString("utf8");
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function queryLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalLimit(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

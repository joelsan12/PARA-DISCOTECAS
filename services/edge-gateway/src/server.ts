import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { basename } from "node:path";
import { WebSocketServer } from "ws";
import { authenticateHttp, isOriginAllowed, type AuthContext } from "./auth.js";
import { isRecord } from "./crypto.js";
import { loadConfig } from "./config.js";
import { GatewayHub } from "./hub.js";
import { JsonlStore } from "./persistence.js";
import { QueueCrypto } from "./queue-crypto.js";
import { ReplayGuard } from "./replay-guard.js";
import { StaffAuthority } from "./staff-authority.js";
import { normalizeRevocation, ProtocolError, type NormalizedRevocation } from "./protocol.js";
import type { GatewayConfig, ServiceStatus, StoredRevocation } from "./types.js";
import type { Duplex } from "node:stream";

export interface GatewayAddress {
  address: string;
  port: number;
  url: string;
}

export class EdgeGateway {
  private readonly config: GatewayConfig;
  private readonly store: JsonlStore;
  private readonly hub: GatewayHub;
  private readonly authContext: AuthContext;
  private server: Server | null = null;
  private webSocketServer: WebSocketServer | null = null;
  private startPromise: Promise<GatewayAddress> | null = null;
  private stopped = false;

  public constructor(config: GatewayConfig = loadConfig()) {
    this.config = config;
    this.store = new JsonlStore(config.dataFile, new QueueCrypto(config.queueKey));
    this.authContext = {
      config,
      replay: new ReplayGuard(config),
      staff: new StaffAuthority(config)
    };
    this.hub = new GatewayHub(config, this.store, this.authContext);
  }

  public async start(): Promise<GatewayAddress> {
    if (this.startPromise) {
      return this.startPromise;
    }
    this.stopped = false;
    this.startPromise = this.startInternal();
    try {
      return await this.startPromise;
    } catch (error) {
      try {
        await this.stop();
      } catch {
        this.server = null;
        this.webSocketServer = null;
      }
      this.startPromise = null;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.stopped = true;
    this.hub.close();
    const webSocketServer = this.webSocketServer;
    this.webSocketServer = null;
    if (webSocketServer) {
      await new Promise<void>((resolve) => {
        webSocketServer.close(() => resolve());
      });
    }
    const server = this.server;
    this.server = null;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeIdleConnections?.();
      });
    }
    await this.store.flush();
    this.startPromise = null;
  }

  public getStatus(): ServiceStatus {
    const listening = this.server?.listening ?? false;
    const counts = this.hub.getCounts();
    return {
      service: "edge-gateway",
      status: listening ? "ready" : this.stopped ? "stopped" : "starting",
      healthy: listening,
      gatewayId: this.config.gatewayId,
      instanceId: this.config.instanceId,
      businessId: this.config.businessId,
      eventId: this.config.eventId,
      mode: this.config.isProduction ? "production" : "non-production",
      hmacConfigured: this.config.secretConfigured,
      startedAt: this.config.startedAt,
      uptimeSeconds: Math.max(0, Math.floor((Date.now() - Date.parse(this.config.startedAt)) / 1000)),
      websocketPath: "/v1/door-link",
      endpoints: this.endpoints(),
      connections: counts,
      persistence: {
        format: "jsonl",
        fileName: basename(this.config.dataFile),
        encryption: "aes-256-gcm",
        events: this.store.eventCount,
        revocations: this.store.revocationCount,
        records: this.store.recordCount,
        unreadable: this.store.unreadableCount,
        migratedFromPlaintext: this.store.migratedPlaintextCount
      },
      capabilities: [
        "http-health",
        "gateway-discovery",
        "door-link-websocket",
        "subprotocol-auth",
        "hmac-events",
        "event-id-deduplication",
        "device-sequence-deduplication",
        "revocations",
        "presence",
        "jsonl-append-only",
        "jsonl-encrypted-at-rest"
      ]
    };
  }

  public getIdentity(): Record<string, unknown> {
    const status = this.getStatus();
    return {
      service: "edge-gateway",
      status: status.status,
      state: status.status,
      gatewayId: this.config.gatewayId,
      gateway_id: this.config.gatewayId,
      instanceId: this.config.instanceId,
      businessId: this.config.businessId,
      business_id: this.config.businessId,
      eventId: this.config.eventId,
      event_id: this.config.eventId,
      protocol: "door-link",
      protocolVersion: 1,
      websocketPath: "/v1/door-link",
      websocket_path: "/v1/door-link",
      endpoints: this.endpoints(),
      capabilities: status.capabilities,
      authentication: {
        required: true,
        algorithm: "HMAC-SHA256",
        configured: this.config.secretConfigured
      },
      startedAt: this.config.startedAt,
      serverTime: new Date().toISOString()
    };
  }

  private async startInternal(): Promise<GatewayAddress> {
    await this.store.initialize();
    const webSocketServer = new WebSocketServer({
      noServer: true,
      maxPayload: this.config.maxMessageBytes,
      clientTracking: false
    });
    this.webSocketServer = webSocketServer;
    const server = createServer((request, response) => {
      void this.handleHttp(request, response).catch(() => {
        if (!response.headersSent) {
          this.sendJson(response, 500, { ok: false, error: { code: "INTERNAL_ERROR", message: "internal server error" } });
        } else {
          response.destroy();
        }
      });
    });
    this.server = server;
    server.on("upgrade", (request, socket, head) => {
      this.handleUpgrade(request, socket, head);
    });
    server.on("clientError", (_error, socket) => {
      socket.destroy();
    });
    this.hub.startHeartbeat();
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        server.off("listening", onListening);
        reject(error);
      };
      const onListening = (): void => {
        server.off("error", onError);
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(this.config.port, "0.0.0.0");
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("gateway server did not expose a TCP address");
    }
    return {
      address: address.address,
      port: address.port,
      url: `http://${address.address}:${address.port}`
    };
  }

  private handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const requestUrl = requestUrlFrom(request);
    if (normalizePath(requestUrl.pathname) !== "/v1/door-link") {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }
    const origin = headerValue(request.headers.origin);
    if (!isOriginAllowed(origin, this.config.allowedOrigins, headerValue(request.headers.host))) {
      rejectUpgrade(socket, 403, "Origin Not Allowed");
      return;
    }
    if (!this.config.secretConfigured && !this.config.idTokenConfigured) {
      rejectUpgrade(socket, 503, "EDGE_HMAC_SECRET or EDGE_FIREBASE_PROJECT_ID is not configured");
      return;
    }
    const webSocketServer = this.webSocketServer;
    if (!webSocketServer) {
      rejectUpgrade(socket, 503, "Gateway is not ready");
      return;
    }
    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      this.hub.handleConnection(webSocket, request, requestUrl);
    });
  }

  private async handleHttp(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = requestUrlFrom(request);
    const origin = headerValue(request.headers.origin);
    if (!isOriginAllowed(origin, this.config.allowedOrigins, headerValue(request.headers.host))) {
      this.sendJson(response, 403, { ok: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "origin is not allowed" } });
      return;
    }
    this.setCors(response, origin, headerValue(request.headers.host));
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    const path = normalizePath(url.pathname);
    if (request.method === "GET" && isHealthPath(path)) {
      const status = this.getStatus();
      this.sendJson(response, 200, {
        ok: true,
        status: "ok",
        service: status.service,
        gatewayId: status.gatewayId,
        businessId: status.businessId,
        eventId: status.eventId,
        hmacConfigured: status.hmacConfigured,
        mode: status.mode,
        uptimeSeconds: status.uptimeSeconds,
        timestamp: new Date().toISOString()
      });
      return;
    }
    if (request.method === "GET" && isStatusPath(path)) {
      this.sendJson(response, 200, { ok: true, ...this.getStatus() });
      return;
    }
    if (request.method === "GET" && isDiscoveryPath(path)) {
      this.sendJson(response, 200, { ok: true, gateway: this.getIdentity(), ...this.getIdentity() });
      return;
    }
    if (path === "/v1/presence" || path === "/v1/door-link/presence") {
      await this.handleAuthorizedGet(request, response, url, () => ({
        ok: true,
        presence: this.hub.getPresence(),
        count: this.hub.getCounts().devices
      }));
      return;
    }
    if (path === "/v1/events" || path === "/v1/door-link/events") {
      await this.handleAuthorizedGet(request, response, url, () => ({
        ok: true,
        events: this.store.getEvents({ since: url.searchParams.get("since") ?? undefined, limit: queryLimit(url) }),
        count: this.store.eventCount
      }));
      return;
    }
    if (path === "/v1/sync" || path === "/v1/door-link/sync") {
      await this.handleAuthorizedGet(request, response, url, () => ({
        ok: true,
        snapshot: this.hub.getSnapshot(url.searchParams.get("since") ?? undefined, queryLimit(url))
      }));
      return;
    }
    if (isRevocationPath(path)) {
      await this.handleRevocations(request, response, url, path);
      return;
    }
    this.sendJson(response, 404, { ok: false, error: { code: "NOT_FOUND", message: "route not found" } });
  }

  private async handleAuthorizedGet(
    request: IncomingMessage,
    response: ServerResponse,
    url: URL,
    payload: () => Record<string, unknown>
  ): Promise<void> {
    if (request.method !== "GET") {
      this.sendJson(response, 405, { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "method not allowed" } });
      return;
    }
    const authentication = await authenticateHttp(this.authContext, request.method, url, request.headers, "");
    if (!authentication.ok) {
      this.sendAuthenticationFailure(response, authentication.reason);
      return;
    }
    this.sendJson(response, 200, payload());
  }

  private async handleRevocations(
    request: IncomingMessage,
    response: ServerResponse,
    url: URL,
    path: string
  ): Promise<void> {
    if (request.method === "GET") {
      const authentication = await authenticateHttp(this.authContext, request.method, url, request.headers, "");
      if (!authentication.ok) {
        this.sendAuthenticationFailure(response, authentication.reason);
        return;
      }
      const revocations = this.store.getRevocations({ limit: queryLimit(url) });
      this.sendJson(response, 200, {
        ok: true,
        revocations,
        count: revocations.length,
        gatewayId: this.config.gatewayId,
        businessId: this.config.businessId,
        eventId: this.config.eventId,
        generatedAt: new Date().toISOString()
      });
      return;
    }
    if (request.method !== "POST" && request.method !== "DELETE") {
      this.sendJson(response, 405, { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "method not allowed" } });
      return;
    }
    let rawBody = "";
    if (request.method === "POST" || request.method === "DELETE") {
      try {
        rawBody = await readBody(request, this.config.maxBodyBytes);
      } catch (error) {
        this.sendHttpError(response, error);
        return;
      }
    }
    let parsedBody: unknown;
    if (rawBody.length > 0) {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch {
        this.sendJson(response, 400, { ok: false, error: { code: "INVALID_JSON", message: "request body must be valid JSON" } });
        return;
      }
    }
    const authentication = await authenticateHttp(this.authContext, request.method, url, request.headers, rawBody, parsedBody);
    if (!authentication.ok || !authentication.identity) {
      this.sendAuthenticationFailure(response, authentication.reason);
      return;
    }
    let values: unknown[];
    const pathId = revocationIdFromPath(path);
    if (request.method === "DELETE") {
      if (!pathId) {
        this.sendJson(response, 400, { ok: false, error: { code: "REVOCATION_ID_REQUIRED", message: "revocation id is required" } });
        return;
      }
      values = [{ revocationId: pathId, subject: pathId, reason: "revoked", issuedBy: authentication.identity.clientId }];
    } else if (pathId && isRecord(parsedBody)) {
      values = [{ ...parsedBody, revocationId: pathId }];
    } else if (Array.isArray(parsedBody)) {
      values = parsedBody;
    } else if (isRecord(parsedBody) && Array.isArray(parsedBody.revocations)) {
      values = parsedBody.revocations;
    } else if (parsedBody !== undefined) {
      values = [parsedBody];
    } else {
      values = [];
    }
    if (values.length === 0) {
      this.sendJson(response, 400, { ok: false, error: { code: "REVOCATION_REQUIRED", message: "revocation payload is required" } });
      return;
    }
    const normalized: NormalizedRevocation[] = [];
    try {
      for (const value of values) {
        normalized.push(normalizeRevocation(value, authentication.identity.clientId));
      }
    } catch (error) {
      this.sendHttpError(response, error);
      return;
    }
    const results: Array<{ stored: StoredRevocation; duplicate: boolean }> = [];
    for (const revocation of normalized) {
      try {
        const result = await this.hub.acceptRevocation(revocation, authentication.identity.clientId);
        results.push(result);
      } catch {
        this.sendJson(response, 503, { ok: false, error: { code: "PERSISTENCE_ERROR", message: "revocation could not be persisted" } });
        return;
      }
    }
    const revocations = results.map((result) => result.stored);
    this.sendJson(response, results.some((result) => result.duplicate) ? 200 : 201, {
      ok: true,
      revocations,
      count: revocations.length,
      duplicates: results.filter((result) => result.duplicate).map((result) => result.stored.revocationId),
      gatewayId: this.config.gatewayId,
      businessId: this.config.businessId,
      eventId: this.config.eventId
    });
  }

  private sendAuthenticationFailure(response: ServerResponse, reason: string): void {
    if (!this.config.secretConfigured && !this.config.idTokenConfigured) {
      this.sendJson(response, 503, { ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: reason } });
      return;
    }
    response.setHeader("WWW-Authenticate", "HMAC");
    this.sendJson(response, 401, { ok: false, error: { code: "UNAUTHORIZED", message: reason } });
  }

  private setCors(response: ServerResponse, origin: string | undefined, requestHost?: string): void {
    response.setHeader("Vary", "Origin");
    const wildcard = this.config.allowedOrigins.includes("*");
    if (origin && isOriginAllowed(origin, this.config.allowedOrigins, requestHost)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Edge-Signature,X-Edge-HMAC,X-HMAC-Signature,X-Edge-Timestamp,X-Edge-Nonce,X-Edge-Device-Id,X-Edge-Client-Id,X-Edge-Business-Id,X-Edge-Event-Id,X-Edge-Role");
    if (!wildcard) {
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }
    response.setHeader("Access-Control-Allow-Private-Network", "true");
  }

  private sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
    const body = JSON.stringify(payload);
    response.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(body);
  }

  private sendHttpError(response: ServerResponse, error: unknown): void {
    if (error instanceof HttpError) {
      this.sendJson(response, error.statusCode, { ok: false, error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof ProtocolError) {
      this.sendJson(response, 400, { ok: false, error: { code: "PROTOCOL_ERROR", message: error.message } });
      return;
    }
    this.sendJson(response, 500, { ok: false, error: { code: "INTERNAL_ERROR", message: "internal server error" } });
  }

  private endpoints(): Record<string, string> {
    return {
      health: "/health",
      status: "/status",
      discovery: "/v1/gateway/discover",
      identity: "/v1/gateway/identity",
      revocations: "/v1/revocations",
      presence: "/v1/presence",
      events: "/v1/events",
      sync: "/v1/sync",
      websocket: "/v1/door-link"
    };
  }
}

class HttpError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function isHealthPath(path: string): boolean {
  return path === "/health" || path === "/healthz" || path === "/live" || path === "/v1/health";
}

function isStatusPath(path: string): boolean {
  return path === "/status" || path === "/v1/status" || path === "/v1/gateway/status";
}

function isDiscoveryPath(path: string): boolean {
  return path === "/v1/gateway" || path === "/v1/gateway/identity" || path === "/v1/gateway/discover" || path === "/v1/gateway/discovery" || path === "/v1/discovery" || path === "/.well-known/edge-gateway" || path === "/v1/door-link/discovery" || path === "/v1/door-link/identity" || path === "/v1/door-link/info" || path === "/v1/identity";
}

function isRevocationPath(path: string): boolean {
  return path === "/v1/revocations" || path === "/v1/door-link/revocations" || path === "/api/v1/revocations" || path.startsWith("/v1/revocations/") || path.startsWith("/v1/door-link/revocations/") || path.startsWith("/api/v1/revocations/");
}

function revocationIdFromPath(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  const markerIndex = parts.lastIndexOf("revocations");
  if (markerIndex < 0 || markerIndex + 1 >= parts.length) {
    return null;
  }
  const candidate = parts[markerIndex + 1];
  if (!candidate || candidate === "revoke") {
    return null;
  }
  try {
    return decodeURIComponent(candidate);
  } catch {
    return null;
  }
}

function requestUrlFrom(request: IncomingMessage): URL {
  const host = headerValue(request.headers.host) || "localhost";
  return new URL(request.url || "/", `http://${host}`);
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.replace(/\/+$/u, "") || "/";
  }
  return path;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function queryLimit(url: URL): number | undefined {
  const value = url.searchParams.get("limit");
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function readBody(request: IncomingMessage, maximumBytes: number): Promise<string> {
  const contentLength = request.headers["content-length"];
  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > maximumBytes) {
      throw new HttpError(413, "BODY_TOO_LARGE", "request body exceeds the configured limit");
    }
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) {
      throw new HttpError(413, "BODY_TOO_LARGE", "request body exceeds the configured limit");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function rejectUpgrade(socket: Duplex, statusCode: number, message: string): void {
  const statusText = statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : statusCode === 503 ? "Service Unavailable" : "Bad Request";
  socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`);
  socket.destroy();
}

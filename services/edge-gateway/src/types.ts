export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type GatewayRole = "terminal" | "client" | "admin" | "observer";

export interface GatewayConfig {
  port: number;
  businessId: string;
  eventId: string;
  hmacSecret: string;
  secretConfigured: boolean;
  firebaseProjectId: string;
  idTokenConfigured: boolean;
  allowedOrigins: string[];
  gatewayId: string;
  instanceId: string;
  dataFile: string;
  authWindowMs: number;
  authTimeoutMs: number;
  heartbeatIntervalMs: number;
  maxBodyBytes: number;
  maxMessageBytes: number;
  maxConnections: number;
  maxTrackedNonces: number;
  isProduction: boolean;
  startedAt: string;
}

export interface AuthIdentity {
  businessId: string;
  eventId: string;
  deviceId: string;
  clientId: string;
  role: GatewayRole;
  timestamp: string;
  nonce: string;
}

export interface StoredEvent {
  kind: "event";
  eventId: string;
  jti: string;
  deviceId: string;
  deviceSequence: number;
  eventType: string;
  occurredAt: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  gatewayId: string;
  businessId: string;
  eventContext: string;
  gatewayEventId: string;
  receivedAt: string;
  persistedAt: string;
  signature: string;
  hmac: string;
}

export interface StoredRevocation {
  kind: "revocation";
  revocationId: string;
  subject: string;
  subjectType: string;
  reason: string;
  revokedAt: string;
  expiresAt: string | null;
  issuedBy: string;
  metadata: Record<string, unknown>;
  gatewayId: string;
  businessId: string;
  eventId: string;
  persistedAt: string;
  signature: string;
  hmac: string;
}

export type PersistedRecord = StoredEvent | StoredRevocation;

export interface PresenceEntry {
  deviceId: string;
  clientId: string;
  role: GatewayRole;
  state: "online" | "offline";
  connectedAt: string;
  lastSeenAt: string;
  remoteAddress: string;
}

export interface SyncSnapshot {
  gatewayId: string;
  businessId: string;
  eventId: string;
  generatedAt: string;
  events: StoredEvent[];
  revocations: StoredRevocation[];
  presence: PresenceEntry[];
}

export interface ServiceStatus {
  service: string;
  status: "ready" | "starting" | "stopped";
  healthy: boolean;
  gatewayId: string;
  instanceId: string;
  businessId: string;
  eventId: string;
  mode: "production" | "non-production";
  hmacConfigured: boolean;
  startedAt: string;
  uptimeSeconds: number;
  websocketPath: string;
  endpoints: Record<string, string>;
  connections: {
    total: number;
    authenticated: number;
    pending: number;
    devices: number;
  };
  persistence: {
    format: "jsonl";
    fileName: string;
    events: number;
    revocations: number;
    records: number;
  };
  capabilities: string[];
}

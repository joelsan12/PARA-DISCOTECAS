const EDGE_URL_RAW = (import.meta.env.VITE_EDGE_WS_URL as string | undefined) ?? '';
const EDGE_BUSINESS_ID = (import.meta.env.VITE_EDGE_BUSINESS_ID as string | undefined) ?? '';
const EDGE_EVENT_ID = (import.meta.env.VITE_EDGE_EVENT_ID as string | undefined) ?? '';

export type EdgeConnectionState = 'disabled' | 'connecting' | 'connected' | 'error' | 'closed';

export interface EdgeRevocationMessage {
  kind: 'revocation';
  revocationId?: string;
  subject?: string;
  subjectType?: string;
  reason?: string;
  issuedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface EdgePresenceMessage {
  kind: 'presence';
  devices?: Array<{ deviceId?: string; state?: string; [key: string]: unknown }>;
}

export type EdgeInboundMessage = EdgeRevocationMessage | EdgePresenceMessage | { kind: string; [key: string]: unknown };

export interface EdgeGatewayClientOptions {
  deviceId: string;
  businessId?: string;
  eventId?: string;
  getSessionToken?: () => Promise<string | undefined>;
  onMessage: (message: EdgeInboundMessage) => void;
  onState?: (state: EdgeConnectionState, detail?: string) => void;
  onEventAck?: (ack: { eventId?: string; accepted?: boolean; duplicate?: boolean }) => void;
}

export const isEdgeGatewayConfigured = (): boolean => EDGE_URL_RAW.trim().length > 0;

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
};

/**
 * La identidad y el token viajan en el subprotocolo `nfa.<base64url(JSON)>`,
 * nunca en la query string: los access logs de proxies y balanceadores solo
 * deben ver la ruta del upgrade (AGENTS §6.3 / §13). Si el gateway no entiende
 * el subprotocolo responde `auth_required` y el handshake se completa con el
 * primer frame, que además lleva el token en el cuerpo del mensaje.
 */
const buildIdentity = (
  deviceId: string,
  businessId: string,
  eventId: string,
  token: string | undefined
): Record<string, unknown> => ({
  businessId,
  eventId,
  deviceId,
  clientId: deviceId,
  role: 'terminal',
  timestamp: String(Date.now()),
  nonce: crypto.randomUUID(),
  ...(token ? { token } : {})
});

export class EdgeGatewayClient {
  private socket: WebSocket | null = null;
  private options: EdgeGatewayClientOptions;
  private reconnectTimer: number | null = null;
  private attempts = 0;
  private closedByUser = false;
  private businessId: string;
  private eventId: string;
  private cachedToken: string | undefined;

  constructor(options: EdgeGatewayClientOptions) {
    this.options = options;
    this.businessId = options.businessId ?? EDGE_BUSINESS_ID;
    this.eventId = options.eventId ?? EDGE_EVENT_ID;
  }

  async connect(): Promise<void> {
    if (!isEdgeGatewayConfigured() || !this.businessId || !this.eventId) {
      this.options.onState?.('disabled', 'Edge no configurado (VITE_EDGE_WS_URL).');
      return;
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.closedByUser = false;
    this.options.onState?.('connecting');
    try {
      this.cachedToken = this.options.getSessionToken ? await this.options.getSessionToken() : this.cachedToken;
      if (!this.cachedToken) {
        this.options.onState?.('error', 'Se requiere una sesión de puerta activa para enlazar con Edge.');
        this.scheduleReconnect();
        return;
      }
      const identity = buildIdentity(this.options.deviceId, this.businessId, this.eventId, this.cachedToken);
      const base = EDGE_URL_RAW.trim().replace(/\/+$/u, '');
      const wsBase = base.replace(/^http/u, 'ws');
      const url = new URL(`${wsBase}/v1/door-link`);
      const socket = new WebSocket(url.toString(), [`nfa.${toBase64Url(JSON.stringify(identity))}`]);
      this.socket = socket;
      socket.addEventListener('open', () => {
        this.attempts = 0;
        this.options.onState?.('connected');
      });
      socket.addEventListener('message', (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as EdgeInboundMessage & {
            type?: string;
            ack?: { eventId?: string; accepted?: boolean; duplicate?: boolean };
          };
          if (parsed.type === 'auth_required') {
            void this.sendAuthMessage(socket, identity);
            return;
          }
          if (parsed.type === 'event_ack' && parsed.ack) {
            this.options.onEventAck?.(parsed.ack);
            return;
          }
          if (parsed.kind === 'event_ack' && 'eventId' in parsed) {
            this.options.onEventAck?.(parsed as { eventId?: string; accepted?: boolean; duplicate?: boolean });
            return;
          }
          this.options.onMessage(parsed);
        } catch {
          return;
        }
      });
      socket.addEventListener('error', () => {
        this.options.onState?.('error', 'Error de socket Edge.');
      });
      socket.addEventListener('close', () => {
        this.socket = null;
        if (this.closedByUser) {
          this.options.onState?.('closed');
          return;
        }
        this.options.onState?.('error', 'Conexión Edge perdida; reintentando…');
        this.scheduleReconnect();
      });
    } catch {
      this.options.onState?.('error', 'No se pudo abrir el enlace Edge.');
      this.scheduleReconnect();
    }
  }

  private async sendAuthMessage(socket: WebSocket, identity: Record<string, unknown>): Promise<void> {
    const token = this.options.getSessionToken ? await this.options.getSessionToken() : this.cachedToken;
    if (!token) return;
    this.cachedToken = token;
    socket.send(JSON.stringify({
      type: 'auth',
      auth: { ...identity, timestamp: String(Date.now()), nonce: crypto.randomUUID(), token }
    }));
  }

  private scheduleReconnect(): void {
    if (this.closedByUser || this.reconnectTimer !== null) return;
    this.attempts += 1;
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(this.attempts, 5));
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  async publishEvent(payload: {
    eventId: string;
    deviceId: string;
    deviceSequence: number;
    eventType?: string;
    occurredAt?: string;
    payload?: unknown;
    metadata?: Record<string, unknown>;
    signature?: string;
  }): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    const token = this.options.getSessionToken ? await this.options.getSessionToken() : this.cachedToken;
    const timestamp = String(Date.now());
    const nonce = crypto.randomUUID();
    const message = {
      kind: 'event' as const,
      eventId: payload.eventId,
      deviceId: payload.deviceId,
      deviceSequence: payload.deviceSequence,
      eventType: payload.eventType ?? 'attendance',
      occurredAt: payload.occurredAt ?? new Date().toISOString(),
      payload: payload.payload ?? {},
      metadata: {
        businessId: this.businessId,
        eventIdDomain: this.eventId,
        ...(payload.metadata ?? {})
      },
      signature: null,
      auth: {
        businessId: this.businessId,
        eventId: this.eventId,
        deviceId: payload.deviceId,
        clientId: payload.deviceId,
        role: 'terminal',
        timestamp,
        nonce,
        ...(token ? { token } : {})
      }
    };
    this.socket.send(JSON.stringify(message));
    return true;
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.cachedToken = undefined;
    this.options.onState?.('closed');
  }
}

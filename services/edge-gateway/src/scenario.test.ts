import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import WebSocket from "ws";
import { EdgeGateway } from "./server.js";
import { loadConfig } from "./config.js";
import { hmacHex, identityParams, signEventBody, testSecret } from "./test-support.js";
import type { GatewayConfig } from "./types.js";

const BUSINESS = "local-business";
const EVENT = "local-event";

const testConfig = (overrides: Partial<NodeJS.ProcessEnv> = {}): GatewayConfig =>
  loadConfig({
    ...process.env,
    NODE_ENV: "test",
    EDGE_HMAC_SECRET: testSecret,
    BUSINESS_ID: BUSINESS,
    EVENT_ID: EVENT,
    EDGE_DATA_FILE: join(tmpdir(), `edge-scenario-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`),
    ALLOWED_ORIGINS: "*",
    PORT: "0",
    ...overrides
  } as NodeJS.ProcessEnv);

const withGateway = async (run: (baseUrl: string, config: GatewayConfig) => Promise<void>): Promise<void> => {
  const config = testConfig();
  const gateway = new EdgeGateway(config);
  const address = await gateway.start();
  try {
    await run(`http://127.0.0.1:${address.port}`, config);
  } finally {
    await gateway.stop();
  }
};

interface DoorClient {
  socket: WebSocket;
  deviceId: string;
  messages: Array<Record<string, unknown>>;
  waitFor: (predicate: (message: Record<string, unknown>) => boolean, timeoutMs?: number) => Promise<Record<string, unknown>>;
  send: (payload: Record<string, unknown>) => void;
  close: () => Promise<void>;
}

const connectDoor = async (baseUrl: string, config: GatewayConfig, deviceId: string): Promise<DoorClient> => {
  const params = identityParams(config, deviceId, { path: "/v1/door-link" });
  const wsUrl = baseUrl.replace("http://", "ws://") + `/v1/door-link?${params.toString()}`;
  const socket = new WebSocket(wsUrl);
  const messages: Array<Record<string, unknown>> = [];
  const waiters: Array<{ predicate: (message: Record<string, unknown>) => boolean; resolve: (message: Record<string, unknown>) => void }> = [];

  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString()) as Record<string, unknown>;
      messages.push(message);
      for (let index = waiters.length - 1; index >= 0; index -= 1) {
        const waiter = waiters[index];
        if (waiter && waiter.predicate(message)) {
          waiters.splice(index, 1);
          waiter.resolve(message);
        }
      }
    } catch {
      return;
    }
  });

  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", (error) => reject(error));
  });

  const client: DoorClient = {
    socket,
    deviceId,
    messages,
    waitFor: (predicate, timeoutMs = 4000) =>
      new Promise((resolve, reject) => {
        const existing = messages.find(predicate);
        if (existing) {
          resolve(existing);
          return;
        }
        const timer = setTimeout(() => {
          const index = waiters.findIndex((waiter) => waiter.resolve === wrappedResolve);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error(`timeout waiting for message on ${deviceId}`));
        }, timeoutMs);
        const wrappedResolve = (message: Record<string, unknown>): void => {
          clearTimeout(timer);
          resolve(message);
        };
        waiters.push({ predicate, resolve: wrappedResolve });
      }),
    send: (payload) => {
      socket.send(JSON.stringify(payload));
    },
    close: () =>
      new Promise((resolve) => {
        if (socket.readyState === WebSocket.CLOSED) {
          resolve();
          return;
        }
        socket.once("close", () => resolve());
        socket.close();
      })
  };

  await client.waitFor((message) => message.type === "ready");
  return client;
};

test("Test #5: tres puertas en red local — Edge rechaza el segundo pase antes que la nube", async () => {
  await withGateway(async (baseUrl, config) => {
    const doorA = await connectDoor(baseUrl, config, "door-a");
    const doorB = await connectDoor(baseUrl, config, "door-b");
    const doorC = await connectDoor(baseUrl, config, "door-c");

    const scanEventId = "pass-scan-shared-001";
    const deviceId = "door-a";
    const deviceSequence = 1;

    const firstPassBody = {
      type: "event",
      eventId: scanEventId,
      jti: scanEventId,
      deviceId,
      deviceSequence,
      eventType: "CHECK_IN",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "tkt_edge_pass", action: "CHECK_IN" }
    };
    doorA.send({ ...firstPassBody, signature: signEventBody(config, firstPassBody) });
    const ackA = await doorA.waitFor((message) => message.type === "event_ack");
    assert.equal(ackA.status, "accepted");
    assert.equal(ackA.duplicate, false);

    const secondFromBBody = { ...firstPassBody, deviceId: "door-b" };
    doorB.send({ ...secondFromBBody, signature: signEventBody(config, secondFromBBody) });
    const ackB = await doorB.waitFor((message) => message.type === "event_ack");
    assert.equal(ackB.status, "duplicate");
    assert.equal(ackB.duplicate, true);
    assert.equal(ackB.reason, "duplicate-event-id");

    const broadcastToC = await doorC.waitFor(
      (message) => message.type === "event" && (message.eventIdValue === scanEventId || (message.event as { eventId?: string } | undefined)?.eventId === scanEventId)
    );
    assert.ok(broadcastToC);

    const otherBody = {
      type: "event",
      eventId: "pass-scan-door-c-002",
      jti: "pass-scan-door-c-002",
      deviceId: "door-c",
      deviceSequence: 1,
      eventType: "CHECK_IN",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "tkt_edge_other", action: "CHECK_IN" }
    };
    doorC.send({ ...otherBody, signature: signEventBody(config, otherBody) });
    const ackC = await doorC.waitFor((message) => message.type === "event_ack" && message.eventId === "pass-scan-door-c-002");
    assert.equal(ackC.status, "accepted");

    await Promise.all([doorA.close(), doorB.close(), doorC.close()]);
  });
});

test("B4: una firma sobre el eventId aislado NO autentica el evento (regresión)", async () => {
  await withGateway(async (baseUrl, config) => {
    const door = await connectDoor(baseUrl, config, "door-forged");
    const body = {
      type: "event",
      eventId: "forged-event-001",
      jti: "forged-event-001",
      deviceId: "door-forged",
      deviceSequence: 7,
      eventType: "CHECK_IN",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "tkt_victim", action: "CHECK_IN" }
    };
    // La vulnerabilidad original aceptaba `HMAC(secret, event.eventId)`.
    door.send({ ...body, signature: hmacHex(config.hmacSecret, "forged-event-001") });
    const error = await door.waitFor((message) => message.type === "error" && message.code === "EVENT_SIGNATURE_INVALID");
    assert.ok(error);
    await door.close();
  });
});

test("presencia reporta las tres terminales autenticadas", async () => {
  await withGateway(async (baseUrl, config) => {
    const doorA = await connectDoor(baseUrl, config, "presence-a");
    const doorB = await connectDoor(baseUrl, config, "presence-b");
    const doorC = await connectDoor(baseUrl, config, "presence-c");

    const presenceAuth = identityParams(config, "presence-probe", { path: "/v1/presence" });
    const response = await fetch(`${baseUrl}/v1/presence?${presenceAuth.toString()}`);
    assert.equal(response.status, 200);
    const body = await response.json() as { presence: Array<{ deviceId: string; state: string }> };
    const ids = body.presence.map((entry) => entry.deviceId).sort();
    assert.deepEqual(ids, ["presence-a", "presence-b", "presence-c"]);
    assert.ok(body.presence.every((entry) => entry.state === "online"));

    await Promise.all([doorA.close(), doorB.close(), doorC.close()]);
  });
});

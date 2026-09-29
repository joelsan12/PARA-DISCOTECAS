import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import WebSocket from "ws";
import { EdgeGateway } from "./server.js";
import { loadConfig } from "./config.js";
import type { GatewayConfig } from "./types.js";

const SECRET = "edge-scenario-secret";
const BUSINESS = "local-business";
const EVENT = "local-event";

const testConfig = (overrides: Partial<NodeJS.ProcessEnv> = {}): GatewayConfig =>
  loadConfig({
    ...process.env,
    NODE_ENV: "test",
    EDGE_HMAC_SECRET: SECRET,
    BUSINESS_ID: BUSINESS,
    EVENT_ID: EVENT,
    EDGE_DATA_FILE: join(tmpdir(), `edge-scenario-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`),
    ALLOWED_ORIGINS: "*",
    PORT: "0",
    ...overrides
  } as NodeJS.ProcessEnv);

const hmacHex = (value: string): string =>
  createHmac("sha256", SECRET).update(value, "utf8").digest("hex");

const identityParams = (deviceId: string): URLSearchParams => {
  const timestamp = String(Date.now());
  const nonce = `n-${Math.random().toString(16).slice(2)}`;
  const role = "terminal";
  const clientId = deviceId;
  const canonical = [BUSINESS, EVENT, deviceId, clientId, role, timestamp, nonce].join(":");
  return new URLSearchParams({
    businessId: BUSINESS,
    eventId: EVENT,
    deviceId,
    clientId,
    role,
    timestamp,
    nonce,
    signature: hmacHex(canonical)
  });
};

interface DoorClient {
  socket: WebSocket;
  deviceId: string;
  messages: Array<Record<string, unknown>>;
  waitFor: (predicate: (message: Record<string, unknown>) => boolean, timeoutMs?: number) => Promise<Record<string, unknown>>;
  send: (payload: Record<string, unknown>) => void;
  close: () => Promise<void>;
}

const connectDoor = async (baseUrl: string, deviceId: string): Promise<DoorClient> => {
  const wsUrl = baseUrl.replace("http://", "ws://") + `/v1/door-link?${identityParams(deviceId).toString()}`;
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

const withGateway = async (run: (baseUrl: string) => Promise<void>): Promise<void> => {
  const gateway = new EdgeGateway(testConfig());
  const address = await gateway.start();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await gateway.stop();
  }
};

test("Test #5: tres puertas en red local — Edge rechaza el segundo pase antes que la nube", async () => {
  await withGateway(async (baseUrl) => {
    const doorA = await connectDoor(baseUrl, "door-a");
    const doorB = await connectDoor(baseUrl, "door-b");
    const doorC = await connectDoor(baseUrl, "door-c");

    const scanEventId = "pass-scan-shared-001";
    const deviceId = "door-a";
    const deviceSequence = 1;
    const signature = hmacHex(`${scanEventId}:${deviceId}:${deviceSequence}`);

    const firstPass = {
      type: "event",
      eventId: scanEventId,
      deviceId,
      deviceSequence,
      eventType: "CHECK_IN",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "tkt_edge_pass", action: "CHECK_IN" },
      signature
    };
    doorA.send(firstPass);
    const ackA = await doorA.waitFor((message) => message.type === "event_ack");
    assert.equal(ackA.status, "accepted");
    assert.equal(ackA.duplicate, false);

    const secondFromB = {
      ...firstPass,
      deviceId: "door-b"
    };
    const signatureB = hmacHex(`${scanEventId}:door-b:${deviceSequence}`);
    doorB.send({ ...secondFromB, signature: signatureB });
    const ackB = await doorB.waitFor((message) => message.type === "event_ack");
    assert.equal(ackB.status, "duplicate");
    assert.equal(ackB.duplicate, true);
    assert.equal(ackB.reason, "duplicate-event-id");

    const broadcastToC = await doorC.waitFor(
      (message) => message.type === "event" && (message.eventIdValue === scanEventId || (message.event as { eventId?: string } | undefined)?.eventId === scanEventId)
    );
    assert.ok(broadcastToC);

    const otherScanId = "pass-scan-door-c-002";
    const signatureC = hmacHex(`${otherScanId}:door-c:1`);
    doorC.send({
      type: "event",
      eventId: otherScanId,
      deviceId: "door-c",
      deviceSequence: 1,
      eventType: "CHECK_IN",
      occurredAt: new Date().toISOString(),
      payload: { ticketId: "tkt_edge_other", action: "CHECK_IN" },
      signature: signatureC
    });
    const ackC = await doorC.waitFor((message) => message.type === "event_ack" && message.eventId === otherScanId);
    assert.equal(ackC.status, "accepted");

    await Promise.all([doorA.close(), doorB.close(), doorC.close()]);
  });
});

test("presencia reporta las tres terminales autenticadas", async () => {
  await withGateway(async (baseUrl) => {
    const doorA = await connectDoor(baseUrl, "presence-a");
    const doorB = await connectDoor(baseUrl, "presence-b");
    const doorC = await connectDoor(baseUrl, "presence-c");

    const presenceAuth = identityParams("presence-probe");
    const response = await fetch(`${baseUrl}/v1/presence?${presenceAuth.toString()}`);
    assert.equal(response.status, 200);
    const body = await response.json() as { presence: Array<{ deviceId: string; state: string }> };
    const ids = body.presence.map((entry) => entry.deviceId).sort();
    assert.deepEqual(ids, ["presence-a", "presence-b", "presence-c"]);
    assert.ok(body.presence.every((entry) => entry.state === "online"));

    await Promise.all([doorA.close(), doorB.close(), doorC.close()]);
  });
});

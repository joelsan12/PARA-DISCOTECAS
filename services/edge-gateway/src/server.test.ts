import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EdgeGateway } from "./server.js";
import { loadConfig } from "./config.js";
import type { GatewayConfig } from "./types.js";

const SECRET = "edge-test-secret";
const BUSINESS = "local-business";
const EVENT = "local-event";

const testConfig = (overrides: Partial<NodeJS.ProcessEnv> = {}): GatewayConfig =>
  loadConfig({
    ...process.env,
    NODE_ENV: "test",
    EDGE_HMAC_SECRET: SECRET,
    BUSINESS_ID: BUSINESS,
    EVENT_ID: EVENT,
    EDGE_DATA_FILE: join(tmpdir(), `edge-test-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`),
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

const withGateway = async (run: (baseUrl: string) => Promise<void>): Promise<void> => {
  const gateway = new EdgeGateway(testConfig());
  const address = await gateway.start();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await gateway.stop();
  }
};

test("health responde sin autenticación", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = await response.json() as { ok: boolean; status: string };
    assert.equal(body.ok, true);
    assert.equal(body.status, "ok");
  });
});

test("events sin firma devuelve 401", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/events`);
    assert.equal(response.status, 401);
  });
});

test("events con identidad HMAC válida devuelve 200", async () => {
  await withGateway(async (baseUrl) => {
    const params = identityParams("dev-health-1");
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 200);
    const body = await response.json() as { ok: boolean; events: unknown[] };
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.events));
  });
});

test("events con firma inválida devuelve 401", async () => {
  await withGateway(async (baseUrl) => {
    const params = identityParams("dev-bad-1");
    params.set("signature", "deadbeef".repeat(8));
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 401);
  });
});

test("descubrimiento expone identidad del gateway", async () => {
  await withGateway(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/gateway/discover`);
    assert.equal(response.status, 200);
    const body = await response.json() as { businessId: string; eventId: string; websocketPath: string };
    assert.equal(body.businessId, BUSINESS);
    assert.equal(body.eventId, EVENT);
    assert.equal(body.websocketPath, "/v1/door-link");
  });
});

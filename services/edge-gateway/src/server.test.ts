import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EdgeGateway } from "./server.js";
import { loadConfig } from "./config.js";
import { buildIdentity, hmacHex, identityParams, signAuth, testSecret } from "./test-support.js";
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
    EDGE_DATA_FILE: join(tmpdir(), `edge-test-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`),
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
  await withGateway(async (baseUrl, config) => {
    const params = identityParams(config, "dev-health-1");
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 200);
    const body = await response.json() as { ok: boolean; events: unknown[] };
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.events));
  });
});

test("events con firma inválida devuelve 401", async () => {
  await withGateway(async (baseUrl, config) => {
    const params = identityParams(config, "dev-bad-1");
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

test("B2: sin timestamp la autenticación es rechazada", async () => {
  await withGateway(async (baseUrl, config) => {
    const identity = buildIdentity(config, { deviceId: "dev-no-ts", clientId: "dev-no-ts", timestamp: "" });
    const params = new URLSearchParams({
      businessId: identity.businessId,
      eventId: identity.eventId,
      deviceId: identity.deviceId,
      clientId: identity.clientId,
      role: identity.role,
      nonce: identity.nonce,
      signature: signAuth(config, identity, "/v1/events")
    });
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 401);
  });
});

test("B2: sin nonce la autenticación es rechazada", async () => {
  await withGateway(async (baseUrl, config) => {
    const identity = buildIdentity(config, { deviceId: "dev-no-nonce", clientId: "dev-no-nonce", nonce: "" });
    const params = new URLSearchParams({
      businessId: identity.businessId,
      eventId: identity.eventId,
      deviceId: identity.deviceId,
      clientId: identity.clientId,
      role: identity.role,
      timestamp: identity.timestamp,
      signature: signAuth(config, identity, "/v1/events")
    });
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 401);
  });
});

test("B2: reutilizar un nonce se rechaza (anti-replay)", async () => {
  await withGateway(async (baseUrl, config) => {
    const params = identityParams(config, "dev-replay-1");
    const first = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(first.status, 200);
    const second = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(second.status, 401);
  });
});

test("B1/C1: una firma sobre el businessId aislado NO autentica (regresión)", async () => {
  await withGateway(async (baseUrl, config) => {
    const params = identityParams(config, "dev-leak-1");
    // La vulnerabilidad original aceptaba `HMAC(secret, businessId)` como
    // credencial estática reutilizable. Ahora debe rechazarse.
    params.set("signature", hmacHex(config.hmacSecret, BUSINESS));
    const response = await fetch(`${baseUrl}/v1/events?${params.toString()}`);
    assert.equal(response.status, 401);
  });
});

test("B1: EDGE_HMAC_SECRET ausente en producción aborta el arranque", () => {
  assert.throws(
    () => loadConfig({
      NODE_ENV: "production",
      EDGE_HMAC_SECRET: "",
      EDGE_FIREBASE_PROJECT_ID: "demo-project",
      BUSINESS_ID: BUSINESS,
      EVENT_ID: EVENT
    } as NodeJS.ProcessEnv),
    /EDGE_HMAC_SECRET is required in production/u
  );
});

test("B1: un secreto corto se rechaza por configuración", () => {
  assert.throws(
    () => loadConfig({
      NODE_ENV: "test",
      EDGE_HMAC_SECRET: "corto",
      BUSINESS_ID: BUSINESS,
      EVENT_ID: EVENT
    } as NodeJS.ProcessEnv),
    /at least 32 characters/u
  );
});
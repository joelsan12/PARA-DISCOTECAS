import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JsonlStore } from "./persistence.js";
import { QueueCrypto, deriveQueueKey, isSealedRecord } from "./queue-crypto.js";
import type { StoredEvent } from "./types.js";

const KEY_A = Buffer.alloc(32, 7);
const KEY_B = Buffer.alloc(32, 9);

const tempPath = (label: string): string => join(tmpdir(), `edge-queue-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`);

const sampleEvent = (eventId: string, deviceSequence = 1): StoredEvent => ({
  kind: "event",
  eventId,
  jti: eventId,
  deviceId: "door-1",
  deviceSequence,
  eventType: "CHECK_IN",
  occurredAt: new Date().toISOString(),
  payload: { ticketId: "tkt-secret-1234" },
  metadata: {},
  gatewayId: "gw-test",
  businessId: "local-business",
  eventContext: "local-business:local-event",
  gatewayEventId: `${eventId}:gw`,
  receivedAt: new Date().toISOString(),
  persistedAt: new Date().toISOString(),
  signature: "a".repeat(128),
  hmac: "b".repeat(128)
});

test("E1: los eventos se sellan en disco y se restauran al reabrir", async () => {
  const file = tempPath("roundtrip");
  try {
    const store = new JsonlStore(file, new QueueCrypto(KEY_A));
    await store.initialize();
    await store.appendEvent(sampleEvent("evt-sealed-001"));
    await store.flush();

    const raw = await readFile(file, "utf8");
    const line = raw.split(/\r?\n/u)[0] ?? "";
    const parsed = JSON.parse(line) as Record<string, unknown>;
    assert.equal(isSealedRecord(parsed), true);
    assert.ok(!raw.includes("evt-sealed-001"), "el eventId no debe quedar en texto plano");
    assert.ok(!raw.includes("tkt-secret-1234"), "el payload no debe quedar en texto plano");

    const reopened = new JsonlStore(file, new QueueCrypto(KEY_A));
    await reopened.initialize();
    assert.equal(reopened.eventCount, 1);
    assert.equal(reopened.getEvents()[0]?.eventId, "evt-sealed-001");
    assert.equal(reopened.unreadableCount, 0);
    assert.equal(reopened.migratedPlaintextCount, 0);
    assert.equal(reopened.claimEvent("evt-sealed-001", "door-1", 1), "duplicate-event-id");
  } finally {
    await rm(file, { force: true });
  }
});

test("E1: migra texto plano heredado a líneas selladas sin perder registros", async () => {
  const file = tempPath("migration");
  try {
    const legacy = [
      JSON.stringify(sampleEvent("evt-legacy-001")),
      JSON.stringify(sampleEvent("evt-legacy-002", 2)),
      "linea-ilegible",
      JSON.stringify({ kind: "desconocido" })
    ].join("\n");
    await writeFile(file, legacy, "utf8");

    const store = new JsonlStore(file, new QueueCrypto(KEY_A));
    await store.initialize();
    assert.equal(store.eventCount, 2);
    assert.equal(store.migratedPlaintextCount, 2);
    // La línea ilegible y el registro de tipo desconocido no se migran.
    assert.equal(store.unreadableCount, 2);

    const migrated = await readFile(file, "utf8");
    assert.ok(!migrated.includes("evt-legacy-001"), "la migración debe cifrar el texto plano");
    for (const line of migrated.split(/\r?\n/u).filter((entry) => entry.trim().length > 0)) {
      assert.equal(isSealedRecord(JSON.parse(line) as Record<string, unknown>), true);
    }

    const reopened = new JsonlStore(file, new QueueCrypto(KEY_A));
    await reopened.initialize();
    assert.equal(reopened.eventCount, 2);
    assert.equal(reopened.unreadableCount, 0);
    assert.equal(reopened.migratedPlaintextCount, 0);
  } finally {
    await rm(file, { force: true });
  }
});

test("E1: una línea alterada se descarta y se contabiliza como unreadable", async () => {
  const file = tempPath("tamper");
  try {
    const store = new JsonlStore(file, new QueueCrypto(KEY_A));
    await store.initialize();
    await store.appendEvent(sampleEvent("evt-tamper-001"));
    await store.flush();

    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw.trim()) as { ct: string };
    const ct = parsed.ct.split("");
    ct[0] = ct[0] === "A" ? "B" : "A";
    await writeFile(file, `${JSON.stringify({ ...parsed, ct: ct.join("") })}\n`, "utf8");

    const reopened = new JsonlStore(file, new QueueCrypto(KEY_A));
    await reopened.initialize();
    assert.equal(reopened.unreadableCount, 1);
    assert.equal(reopened.eventCount, 0);
  } finally {
    await rm(file, { force: true });
  }
});

test("E1: una clave distinta no puede leer la cola de otro gateway", async () => {
  const file = tempPath("wrong-key");
  try {
    const store = new JsonlStore(file, new QueueCrypto(KEY_A));
    await store.initialize();
    await store.appendEvent(sampleEvent("evt-keyed-001"));
    await store.flush();

    const foreign = new JsonlStore(file, new QueueCrypto(KEY_B));
    await foreign.initialize();
    assert.equal(foreign.unreadableCount, 1);
    assert.equal(foreign.eventCount, 0);
  } finally {
    await rm(file, { force: true });
  }
});

test("E1: EDGE_QUEUE_KEY malformada se rechaza al derivar la clave", () => {
  assert.throws(
    () => deriveQueueKey({ queueKeyBase64: Buffer.alloc(16).toString("base64"), hmacSecret: "s", gatewayId: "gw" }),
    /32 bytes/u
  );
  const explicit = Buffer.alloc(32, 3).toString("base64");
  assert.deepEqual(
    deriveQueueKey({ queueKeyBase64: explicit, hmacSecret: "s", gatewayId: "gw" }),
    Buffer.alloc(32, 3)
  );
  const derived = deriveQueueKey({ hmacSecret: "segredo-largo", gatewayId: "gw-1" });
  assert.equal(derived.length, 32);
  assert.notDeepEqual(derived, deriveQueueKey({ hmacSecret: "segredo-largo", gatewayId: "gw-2" }));
});

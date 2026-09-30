import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.IDENTIFIER_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { emergencyRevokeFor } = await import("./emergency.js");
const { db } = await import("./config.js");

const BUSINESS_ID = "club_panic_02am";
const OWNER_UID = "uid_owner_panic";
const TERMINAL_A = "term_puerta_principal";
const TERMINAL_B = "term_puerta_vip";

function callableRequest(data: Record<string, unknown>, uid: string): Parameters<typeof emergencyRevokeFor>[0] {
  const headers: Record<string, string> = { "x-forwarded-for": "127.0.0.1", "x-request-id": "req_panic_test" };
  const rawRequest = {
    headers,
    method: "POST",
    rawBody: Buffer.from(JSON.stringify(data)),
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    acceptsStreaming: false,
    get(header: string) {
      return headers[header.toLowerCase()];
    }
  } as unknown as FirebaseRequest;
  return {
    data,
    auth: { uid, token: {} as never },
    rawRequest,
    acceptsStreaming: false
  } as unknown as Parameters<typeof emergencyRevokeFor>[0];
}

async function seedFixture(): Promise<void> {
  const batch = db.batch();
  batch.set(db.collection("businesses").doc(BUSINESS_ID), {
    status: "active",
    name: "Club Panic 02AM",
    updatedAt: new Date().toISOString()
  });
  batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(OWNER_UID), {
    businessId: BUSINESS_ID,
    uid: OWNER_UID,
    role: "owner",
    status: "ACTIVE",
    deviceIds: [TERMINAL_A, TERMINAL_B]
  });
  batch.set(db.collection("businessSessions").doc("sess_a"), {
    sessionId: "sess_a",
    businessId: BUSINESS_ID,
    uid: OWNER_UID,
    role: "owner",
    deviceId: TERMINAL_A,
    eventId: null,
    status: "ACTIVE"
  });
  batch.set(db.collection("businessSessions").doc("sess_b"), {
    sessionId: "sess_b",
    businessId: BUSINESS_ID,
    uid: OWNER_UID,
    role: "owner",
    deviceId: TERMINAL_B,
    eventId: null,
    status: "ACTIVE"
  });
  await batch.commit();
}

async function revokeDevice(deviceId: string): Promise<Record<string, unknown>> {
  const result = await emergencyRevokeFor(callableRequest({
    businessId: BUSINESS_ID,
    scope: "DEVICE",
    deviceId,
    reason: "TerminalDQ robado"
  }, OWNER_UID));
  return result;
}

describe("emergencyRevokeFor acumulativo", () => {
  before(async () => {
    await seedFixture();
  });

  after(async () => {
    await Promise.all([
      db.collection("businesses").doc(BUSINESS_ID).delete(),
      db.collection("businesses").doc(BUSINESS_ID).collection("emergencyRevocations").doc("v1").delete(),
      db.collection("businesses").doc(BUSINESS_ID).collection("emergencyRevocations").doc("v2").delete(),
      db.collection("businesses").doc(BUSINESS_ID).collection("devices").doc(TERMINAL_A).delete(),
      db.collection("businesses").doc(BUSINESS_ID).collection("devices").doc(TERMINAL_B).delete(),
      db.collection("businessSessions").doc("sess_a").delete(),
      db.collection("businessSessions").doc("sess_b").delete()
    ]);
  });

  it("mantiene vigente un terminal ya revocado cuando se revoca otro", async () => {
    const first = await revokeDevice(TERMINAL_A);
    assert.equal(first.version, 1);
    assert.equal(first.revokedSessions, 1);

    const second = await revokeDevice(TERMINAL_B);
    assert.equal(second.version, 2);
    assert.equal(second.revokedSessions, 1);

    const business = await db.collection("businesses").doc(BUSINESS_ID).get();
    const emergency = business.get("emergencyRevocation") as Record<string, unknown>;
    const devices = emergency.devices as Record<string, Record<string, string>>;

    assert.equal(business.get("emergencyRevocationVersion"), 2);
    assert.ok(devices[TERMINAL_A], "el primer terminal debe seguir revocado");
    assert.ok(devices[TERMINAL_B], "el segundo terminal debe quedar revocado");
  });

  it("deja un documento por revocacion para la puerta", async () => {
    const first = await db.collection("businesses").doc(BUSINESS_ID).collection("emergencyRevocations").doc("v1").get();
    const second = await db.collection("businesses").doc(BUSINESS_ID).collection("emergencyRevocations").doc("v2").get();
    assert.equal(first.exists, true);
    assert.equal(first.get("scope"), "DEVICE");
    assert.equal(first.get("deviceId"), TERMINAL_A);
    assert.equal(second.exists, true);
    assert.equal(second.get("deviceId"), TERMINAL_B);
    assert.ok(typeof first.get("revokedBefore") === "string");
  });

  it("mantiene revocadas las sesiones de ambos terminales", async () => {
    const a = await db.collection("businessSessions").doc("sess_a").get();
    const b = await db.collection("businessSessions").doc("sess_b").get();
    assert.equal(a.get("status"), "REVOKED");
    assert.equal(b.get("status"), "REVOKED");
  });
});
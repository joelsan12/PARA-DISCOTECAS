import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";

process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { processPaymentWebhook } = await import("./payments.js");
const { db } = await import("./config.js");

const TENANT_SECRET = "tenant_secret_native_000000000000000001";
const BUSINESS_ID = "club_native_psp";
const OTHER_BUSINESS_ID = "club_native_otro";
const RESOURCE_ID = "tbl_native_01";
const CUSTOMER_UID = "uid_native_subject";

function nativeSignature(body: string, secret: string): string {
  return createHmac("sha256", secret).update(Buffer.from(body, "utf8")).digest("hex");
}

function nativeHeaders(body: string, secret: string, id?: string): Record<string, string> {
  return {
    "x-kushki-signature": nativeSignature(body, secret),
    "x-kushki-id": id ?? String(Math.floor(Date.now() / 1000))
  };
}

function houseSignature(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const payload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), Buffer.from(body, "utf8")]);
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

function bodyFor(eventId: string, holdId: string, status = "APPROVED_TRANSACTION"): string {
  return JSON.stringify({
    id: eventId,
    transaction_id: `kushki_tx_${eventId}`,
    status,
    holdId,
    metadata: { holdId, orderId: holdId, businessId: BUSINESS_ID },
    amount: { subtotalIva0: 150, subtotalIva: 0, iva: 0, currency: "USD" }
  });
}

async function seedHold(holdId: string, businessId: string, secret: string): Promise<void> {
  const batch = db.batch();
  batch.set(db.collection("businesses").doc(businessId), {
    status: "active",
    name: "Club Native",
    paymentWebhookSecret: secret,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  batch.set(db.collection("businesses").doc(businessId).collection("resources").doc(RESOURCE_ID), {
    eventId: "evt_native",
    status: "HELD",
    active: true,
    holdAmount: 150,
    activeHoldId: holdId,
    holdTokenHash: "hash",
    holdExpiresAt: new Date(Date.now() + 600_000).toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
  batch.set(db.collection("holds").doc(holdId), {
    holdId,
    businessId,
    eventId: "evt_native",
    resourceId: RESOURCE_ID,
    customerUid: CUSTOMER_UID,
    holdTokenHash: "hash",
    idempotencyKeyHash: "hash",
    state: "HELD",
    paymentState: "PENDING",
    amount: 150,
    currency: "USD",
    expiresAt: Timestamp.fromMillis(Date.now() + 600_000),
    createdAt: Timestamp.fromMillis(Date.now()),
    updatedAt: new Date().toISOString()
  });
  await batch.commit();
}

async function cleanup(): Promise<void> {
  const holds = await db.collection("holds").where("resourceId", "==", RESOURCE_ID).get();
  const events = await db.collection("paymentEvents").get();
  const batch = db.batch();
  holds.forEach((document) => batch.delete(document.ref));
  for (const businessId of [BUSINESS_ID, OTHER_BUSINESS_ID]) {
    batch.delete(db.collection("businesses").doc(businessId));
    batch.delete(db.collection("businesses").doc(businessId).collection("resources").doc(RESOURCE_ID));
    const transactions = await db.collection("businesses").doc(businessId).collection("paymentTransactions").get();
    transactions.forEach((document) => batch.delete(document.ref));
  }
  await batch.commit();
  const eventBatch = db.batch();
  events.docs.forEach((document) => {
    const data = document.data() as { holdId?: string };
    if (data.holdId?.startsWith("hold_native")) eventBatch.delete(document.ref);
  });
  await eventBatch.commit().catch(() => undefined);
}

async function errorOf(promise: Promise<unknown>): Promise<{ code: string; message: string }> {
  try {
    await promise;
  } catch (error) {
    const record = error as { code?: string; message?: string };
    return { code: String(record?.code ?? ""), message: String(record?.message ?? "") };
  }
  return { code: "", message: "" };
}

describe("webhook de pago — firma nativa del PSP delegada al adaptador", () => {
  before(async () => {
    await cleanup();
  });

  after(async () => {
    await cleanup();
  });

  it("acepta la firma nativa hex de Kushki y confirma el hold", async () => {
    const holdId = "hold_native_ok";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const eventId = `evt_native_ok_${Date.now()}`;
    const body = bodyFor(eventId, holdId);
    const result = await processPaymentWebhook(
      Buffer.from(body, "utf8"),
      nativeSignature(body, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      nativeHeaders(body, TENANT_SECRET)
    );
    assert.equal(result.duplicate, false);
    assert.equal(result.status, "PAID");

    const holdDoc = await db.collection("holds").doc(holdId).get();
    assert.equal(holdDoc.get("state"), "CONFIRMED");
    assert.equal(holdDoc.get("paymentState"), "PAID");

    const eventDoc = await db.collection("paymentEvents").doc(
      createHash("sha256").update(eventId).digest("hex").slice(0, 48)
    ).get();
    assert.equal(eventDoc.exists, true);
    assert.equal(eventDoc.get("resultStatus"), "PAID");

    const txId = `tx_${createHash("sha256").update(holdId).digest("hex").slice(0, 24)}`;
    const txDoc = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("paymentTransactions").doc(txId).get();
    assert.equal(txDoc.exists, true, "debe escribir la PaymentTransaction determinista del hold");
    assert.equal(txDoc.get("status"), "PAID");
    assert.equal(txDoc.get("provider"), "kushki");
    assert.equal(txDoc.get("providerTransactionId"), `kushki_tx_${eventId}`);
  });

  it("rechaza una firma hex calculada sobre un cuerpo alterado", async () => {
    const holdId = "hold_native_tamper";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const signedBody = bodyFor(`evt_native_signed_${Date.now()}`, holdId);
    const tamperedBody = bodyFor(`evt_native_tamper_${Date.now()}`, holdId);
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(tamperedBody, "utf8"),
      nativeSignature(signedBody, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      nativeHeaders(signedBody, TENANT_SECRET)
    ));
    assert.equal(error.code, "permission-denied");

    const holdDoc = await db.collection("holds").doc(holdId).get();
    assert.equal(holdDoc.get("state"), "HELD", "un webhook rechazado no confirma el hold");
  });

  it("rechaza una firma nativa con forma inválida (no hex de 64)", async () => {
    const holdId = "hold_native_shape";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const body = bodyFor(`evt_native_shape_${Date.now()}`, holdId);
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(body, "utf8"),
      "deadbeef",
      { provider: "kushki", businessId: BUSINESS_ID },
      { "x-kushki-signature": "deadbeef" }
    ));
    assert.equal(error.code, "permission-denied");
    assert.match(error.message, /Native payment signature is invalid/i);
  });

  it("rechaza x-kushki-id fuera de la ventana de tolerancia", async () => {
    const holdId = "hold_native_stale";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const body = bodyFor(`evt_native_stale_${Date.now()}`, holdId);
    const staleId = String(Math.floor(Date.now() / 1000) - 7200);
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(body, "utf8"),
      nativeSignature(body, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      nativeHeaders(body, TENANT_SECRET, staleId)
    ));
    assert.equal(error.code, "permission-denied");
    assert.match(error.message, /timestamp is outside/i);
  });

  it("el secreto de un negocio no confirma holds de otro club", async () => {
    const holdId = "hold_native_cruzado";
    await seedHold(holdId, OTHER_BUSINESS_ID, "tenant_secret_otro_nat_000000000000000002");
    const body = bodyFor(`evt_native_cruzado_${Date.now()}`, holdId);
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(body, "utf8"),
      nativeSignature(body, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      nativeHeaders(body, TENANT_SECRET)
    ));
    assert.equal(error.code, "permission-denied");
    assert.match(error.message, /Hold does not belong to the authenticated merchant/i);
  });

  it("el segundo evento con el mismo id se marca como duplicado", async () => {
    const holdId = "hold_native_dup";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const eventId = `evt_native_dup_${Date.now()}`;
    const body = bodyFor(eventId, holdId);
    const routing = { provider: "kushki", businessId: BUSINESS_ID };
    const headers = nativeHeaders(body, TENANT_SECRET);

    const first = await processPaymentWebhook(Buffer.from(body, "utf8"), nativeSignature(body, TENANT_SECRET), routing, headers);
    assert.equal(first.duplicate, false);
    assert.equal(first.status, "PAID");

    const second = await processPaymentWebhook(Buffer.from(body, "utf8"), nativeSignature(body, TENANT_SECRET), routing, headers);
    assert.equal(second.duplicate, true);
    assert.equal(second.status, "PAID");
  });

  it("conserva el camino genérico para el formato t=...,v1=... con provider en la URL", async () => {
    const holdId = "hold_native_house";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const eventId = `evt_native_house_${Date.now()}`;
    const body = bodyFor(eventId, holdId, "succeeded");
    const result = await processPaymentWebhook(
      Buffer.from(body, "utf8"),
      houseSignature(body, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      {}
    );
    assert.equal(result.status, "PAID");
  });

  it("rechaza eventos con estado no soportado", async () => {
    const holdId = "hold_native_unsupported";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const body = bodyFor(`evt_native_pending_${Date.now()}`, holdId, "PENDING");
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(body, "utf8"),
      nativeSignature(body, TENANT_SECRET),
      { provider: "kushki", businessId: BUSINESS_ID },
      nativeHeaders(body, TENANT_SECRET)
    ));
    assert.equal(error.code, "invalid-argument");
    assert.match(error.message, /not supported/i);
  });

  it("un proveedor sin adaptador registrado cae al camino genérico y rechaza el hex", async () => {
    const holdId = "hold_native_unknown_provider";
    await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
    const body = bodyFor(`evt_native_deuna_${Date.now()}`, holdId);
    const error = await errorOf(processPaymentWebhook(
      Buffer.from(body, "utf8"),
      nativeSignature(body, TENANT_SECRET),
      { provider: "deuna", businessId: BUSINESS_ID },
      nativeHeaders(body, TENANT_SECRET)
    ));
    assert.equal(error.code, "permission-denied");
    assert.match(error.message, /t= and v1=/i);
  });
});

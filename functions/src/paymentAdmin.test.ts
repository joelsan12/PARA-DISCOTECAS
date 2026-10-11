import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { listPaymentTransactionsFor, createPaymentRefundFor } = await import("./paymentAdmin.js");
const { db } = await import("./config.js");

const BUSINESS_ID = "club_test_payments_admin";
const OTHER_BUSINESS_ID = "club_test_other_admin";
const FINANCE_UID = "uid_test_admin_finance";
const DOOR_UID = "uid_test_admin_door";
const STRANGER_UID = "uid_test_admin_stranger";
const SUPERADMIN_UID = "uid_test_admin_super";

const TX_ID_1 = "tx_admin_test_001";
const TX_ID_OTHER = "tx_admin_other_002";
const TX_ID_REFUNDED = "tx_admin_already_refunded_003";

function callableRequest(data: Record<string, unknown>, uid?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": "127.0.0.1" };
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
    ...(uid ? { auth: { uid, token: {} as never } } : {}),
    rawRequest,
    acceptsStreaming: false
  } as unknown as Parameters<typeof listPaymentTransactionsFor>[0];
}

describe("Fase C — Administración de pagos y reembolsos (paymentAdmin)", () => {
  before(async () => {
    const batch = db.batch();

    // Negocio principal
    batch.set(db.collection("businesses").doc(BUSINESS_ID), {
      name: "Club Admin Payments",
      status: "active"
    }, { merge: true });

    // Negocio ajeno
    batch.set(db.collection("businesses").doc(OTHER_BUSINESS_ID), {
      name: "Club Other Business",
      status: "active"
    }, { merge: true });

    // Staff
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(FINANCE_UID), {
      role: "finance",
      status: "ACTIVE"
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(DOOR_UID), {
      role: "door",
      status: "ACTIVE"
    }, { merge: true });

    // SuperAdmin
    batch.set(db.collection("users").doc(SUPERADMIN_UID), {
      superAdmin: true
    }, { merge: true });

    // Transacción 1 (PAID)
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_1), {
      id: TX_ID_1,
      businessId: BUSINESS_ID,
      holdId: "hold_test_admin_001",
      provider: "kushki",
      providerTransactionId: "kushki_tx_001",
      amount: 150,
      currency: "USD",
      status: "PAID",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Transacción de otro negocio
    batch.set(db.collection("businesses").doc(OTHER_BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_OTHER), {
      id: TX_ID_OTHER,
      businessId: OTHER_BUSINESS_ID,
      holdId: "hold_test_other_002",
      amount: 200,
      status: "PAID",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Transacción ya reembolsada
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_REFUNDED), {
      id: TX_ID_REFUNDED,
      businessId: BUSINESS_ID,
      holdId: "hold_test_admin_003",
      amount: 100,
      status: "REFUNDED",
      refundId: "ref_orig_12345",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Hold asociado para enriquecimiento
    batch.set(db.collection("holds").doc("hold_test_admin_001"), {
      id: "hold_test_admin_001",
      businessId: BUSINESS_ID,
      state: "CONFIRMED",
      paymentState: "PAID"
    }, { merge: true });

    await batch.commit();
  });

  after(async () => {
    const batch = db.batch();
    batch.delete(db.collection("businesses").doc(BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_1));
    batch.delete(db.collection("businesses").doc(BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_REFUNDED));
    batch.delete(db.collection("businesses").doc(OTHER_BUSINESS_ID).collection("paymentTransactions").doc(TX_ID_OTHER));
    batch.delete(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(FINANCE_UID));
    batch.delete(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(DOOR_UID));
    batch.delete(db.collection("businesses").doc(BUSINESS_ID));
    batch.delete(db.collection("businesses").doc(OTHER_BUSINESS_ID));
    batch.delete(db.collection("users").doc(SUPERADMIN_UID));
    batch.delete(db.collection("holds").doc("hold_test_admin_001"));
    await batch.commit().catch(() => {});
  });

  describe("listPaymentTransactions", () => {
    it("rechaza llamada sin autenticación (401)", async () => {
      await assert.rejects(
        () => listPaymentTransactionsFor(callableRequest({ businessId: BUSINESS_ID })),
        (err: any) => err.code === "unauthenticated" || err.status === 401
      );
    });

    it("rechaza llamada con rol door insuficiente (403)", async () => {
      await assert.rejects(
        () => listPaymentTransactionsFor(callableRequest({ businessId: BUSINESS_ID }, DOOR_UID)),
        (err: any) => err.code === "permission-denied" || err.status === 403
      );
    });

    it("rechaza a un usuario ajeno sin personal en el club (403)", async () => {
      await assert.rejects(
        () => listPaymentTransactionsFor(callableRequest({ businessId: BUSINESS_ID }, STRANGER_UID)),
        (err: any) => err.code === "permission-denied" || err.status === 403
      );
    });

    it("permite lectura al rol finance y devuelve transacciones enriquecidas", async () => {
      const result = await listPaymentTransactionsFor(callableRequest({ businessId: BUSINESS_ID }, FINANCE_UID));
      assert.equal(result.success, true);
      assert.ok(Array.isArray(result.transactions));
      assert.ok(result.transactions.length >= 2);
      const tx = result.transactions.find((t) => t.id === TX_ID_1);
      assert.ok(tx);
      assert.equal(tx?.amount, 150);
      assert.equal(tx?.holdState, "CONFIRMED");
      assert.equal(tx?.holdPaymentState, "PAID");
    });

    it("permite lectura al superadmin", async () => {
      const result = await listPaymentTransactionsFor(callableRequest({ businessId: BUSINESS_ID }, SUPERADMIN_UID));
      assert.equal(result.success, true);
    });
  });

  describe("createPaymentRefund", () => {
    it("rechaza llamada sin autenticación (401)", async () => {
      await assert.rejects(
        () => createPaymentRefundFor(callableRequest({ businessId: BUSINESS_ID, transactionId: TX_ID_1 })),
        (err: any) => err.code === "unauthenticated" || err.status === 401
      );
    });

    it("rechaza llamada con rol door insuficiente (403)", async () => {
      await assert.rejects(
        () => createPaymentRefundFor(callableRequest({ businessId: BUSINESS_ID, transactionId: TX_ID_1 }, DOOR_UID)),
        (err: any) => err.code === "permission-denied" || err.status === 403
      );
    });

    it("rechaza transacción inexistente con 404", async () => {
      await assert.rejects(
        () => createPaymentRefundFor(callableRequest({ businessId: BUSINESS_ID, transactionId: "tx_fantasma_404" }, FINANCE_UID)),
        (err: any) => err.code === "not-found" || err.status === 404
      );
    });

    it("rechaza intento cross-tenant si la transacción pertenece a otro club (403)", async () => {
      await assert.rejects(
        () => createPaymentRefundFor(callableRequest({ businessId: BUSINESS_ID, transactionId: TX_ID_OTHER }, FINANCE_UID)),
        (err: any) => err.code === "not-found" || err.status === 404 // En subcolección de BUSINESS_ID no existe
      );
    });

    it("doble refund idempotente: transacción ya REFUNDED devuelve replay: true sin re-cobrar", async () => {
      const result = await createPaymentRefundFor(
        callableRequest({ businessId: BUSINESS_ID, transactionId: TX_ID_REFUNDED }, FINANCE_UID)
      );
      assert.equal(result.success, true);
      assert.equal(result.replay, true);
      assert.equal(result.status, "REFUNDED");
      assert.equal(result.refundId, "ref_orig_12345");
    });

    it("falla cerrado con 503 si el negocio no tiene cuenta de pasarela configurada", async () => {
      await assert.rejects(
        () => createPaymentRefundFor(callableRequest({ businessId: BUSINESS_ID, transactionId: TX_ID_1 }, FINANCE_UID)),
        (err: any) => err.code === "failed-precondition" || err.status === 503
      );
    });
  });
});

process.env.NODE_ENV = "test";
process.env.GCLOUD_PROJECT = "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { KushkiAdapter } from "./providers/kushki.js";
import { paymentRegistry } from "./providers/index.js";
import type { PaymentAccount, PaymentSecrets, CreatePaymentInput } from "./types/payments.js";

const TEST_SECRET = "kushki_webhook_secret_key_123456789";
const TEST_PRIVATE_KEY = "kushki_private_merchant_api_key_abc";

const mockAccount: PaymentAccount = {
  businessId: "club_barahunda",
  provider: "kushki",
  environment: "sandbox",
  merchantId: "merchant_kushki_01",
  paymentMode: "CLIENT_GATEWAY",
  status: "ACTIVE",
  updatedAt: Date.now(),
};

const mockSecrets: PaymentSecrets = {
  privateApiKey: TEST_PRIVATE_KEY,
  webhookSecret: TEST_SECRET,
};

const mockInput: CreatePaymentInput = {
  businessId: "club_barahunda",
  holdId: "hold_kushki_test_01",
  orderId: "order_kushki_test_01",
  amount: 75.5,
  currency: "USD",
  description: "Mesa VIP Barahunda - 4 personas",
  customer: {
    uid: "cust_12345",
    email: "vip@nightflow.club",
    fullName: "Juan Perez VIP",
    phone: "+593991234567",
  },
  returnUrl: "https://nightflow.club/r/hold_kushki_test_01",
};

describe("Fase C — KushkiAdapter (Integración PSP Ecuador)", () => {
  const adapter = new KushkiAdapter();

  it("Registry: KushkiAdapter registrado canónicamente como 'kushki'", () => {
    const resolved = paymentRegistry.get("kushki");
    assert.ok(resolved instanceof KushkiAdapter);
    assert.equal(resolved.name, "kushki");
  });

  describe("createSession (WebCheckout)", () => {
    it("Falla cerrado si no está configurada la privateApiKey (503)", async () => {
      await assert.rejects(
        async () => adapter.createSession(mockAccount, { webhookSecret: TEST_SECRET }, mockInput),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "failed-precondition");
          assert.equal(error.status, 503);
          return true;
        }
      );
    });

    it("Rechaza montos menores o iguales a cero (400)", async () => {
      await assert.rejects(
        async () => adapter.createSession(mockAccount, mockSecrets, { ...mockInput, amount: 0 }),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "invalid-argument");
          assert.equal(error.status, 400);
          return true;
        }
      );
    });

    it("Rechaza returnUrl vacía (400)", async () => {
      await assert.rejects(
        async () => adapter.createSession(mockAccount, mockSecrets, { ...mockInput, returnUrl: "" }),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "invalid-argument");
          assert.equal(error.status, 400);
          return true;
        }
      );
    });

    it("Genera sesión de Hosted Checkout exitosa llamando a la API de Kushki", async () => {
      const originalFetch = globalThis.fetch;
      try {
        let requestedUrl = "";
        let requestedHeaders: Record<string, string> = {};
        let requestedBody: Record<string, unknown> = {};

        globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
          requestedUrl = String(url);
          requestedHeaders = (init?.headers as Record<string, string>) || {};
          requestedBody = JSON.parse(String(init?.body || "{}"));

          return new Response(
            JSON.stringify({
              webcheckoutUrl: "https://uat-checkout.kushkipagos.com/smartlink/token_kushki_999",
              webcheckoutId: "kushki_sess_999",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }) as typeof fetch;

        const session = await adapter.createSession(mockAccount, mockSecrets, mockInput);

        assert.equal(requestedUrl, "https://api-uat.kushkipagos.com/smartlink/v1/webcheckout");
        assert.equal(requestedHeaders["Private-Merchant-Id"], TEST_PRIVATE_KEY);
        assert.equal(requestedHeaders["Content-Type"], "application/json");
        assert.equal(requestedBody.kind, "webcheckout");
        assert.deepEqual((requestedBody.metadata as Record<string, unknown>).holdId, "hold_kushki_test_01");

        assert.equal(session.checkoutUrl, "https://uat-checkout.kushkipagos.com/smartlink/token_kushki_999");
        assert.equal(session.sessionId, "kushki_sess_999");
        assert.ok(session.expiresAt > Date.now());
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("Maneja error HTTP del PSP retornando 502 unavailable", async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async () => {
          return new Response(
            JSON.stringify({ code: "E001", message: "Merchant inactive in Kushki" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }) as typeof fetch;

        await assert.rejects(
          async () => adapter.createSession(mockAccount, mockSecrets, mockInput),
          (err: unknown) => {
            const error = err as { code: string; status: number };
            assert.equal(error.code, "unavailable");
            assert.equal(error.status, 502);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("verifyWebhook (HMAC & Parseo)", () => {
    const rawPayload = JSON.stringify({
      transaction_id: "tx_kushki_123456",
      status: "approvedTransaction",
      totalAmount: 75.5,
      currency: "USD",
      metadata: {
        holdId: "hold_kushki_test_01",
        orderId: "order_kushki_test_01",
        businessId: "club_barahunda",
      },
    });
    const rawBuffer = Buffer.from(rawPayload, "utf8");

    it("Valida webhook con cabeceras nativas de Kushki (x-kushki-id, x-kushki-signature)", async () => {
      const nowTs = String(Math.floor(Date.now() / 1000));
      const payloadWithId = Buffer.concat([rawBuffer, Buffer.from(nowTs, "utf8")]);
      const sig = createHmac("sha256", TEST_SECRET).update(payloadWithId).digest("hex");
      const simpleSig = createHmac("sha256", TEST_SECRET).update(nowTs).digest("hex");

      const event = await adapter.verifyWebhook(mockAccount, mockSecrets, {
        rawBody: rawBuffer,
        headers: {
          "x-kushki-id": nowTs,
          "x-kushki-signature": sig,
          "x-kushki-simplesignature": simpleSig,
        },
        merchantId: "merchant_kushki_01",
      });

      assert.equal(event.provider, "kushki");
      assert.equal(event.eventType, "PAYMENT_SUCCESS");
      assert.equal(event.providerTransactionId, "tx_kushki_123456");
      assert.equal(event.holdId, "hold_kushki_test_01");
      assert.equal(event.orderId, "order_kushki_test_01");
      assert.equal(event.amount, 75.5);
      assert.equal(event.currency, "USD");
    });

    it("Valida webhook con formato interoperable (signature: t=...,v1=...)", async () => {
      const nowTs = Math.floor(Date.now() / 1000);
      const signed = Buffer.concat([Buffer.from(`${nowTs}.`, "utf8"), rawBuffer]);
      const sig = createHmac("sha256", TEST_SECRET).update(signed).digest("hex");

      const event = await adapter.verifyWebhook(mockAccount, mockSecrets, {
        rawBody: rawBuffer,
        headers: {
          signature: `t=${nowTs},v1=${sig}`,
        },
        merchantId: "merchant_kushki_01",
      });

      assert.equal(event.provider, "kushki");
      assert.equal(event.eventType, "PAYMENT_SUCCESS");
      assert.equal(event.holdId, "hold_kushki_test_01");
    });

    it("Rechaza webhook con firma HMAC alterada o inválida (401)", async () => {
      const nowTs = String(Math.floor(Date.now() / 1000));

      await assert.rejects(
        async () =>
          adapter.verifyWebhook(mockAccount, mockSecrets, {
            rawBody: rawBuffer,
            headers: {
              "x-kushki-id": nowTs,
              "x-kushki-signature": "bad_hex_signature_000000000000000000000000000000000000000000000000",
            },
            merchantId: "merchant_kushki_01",
          }),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "permission-denied");
          assert.equal(error.status, 401);
          return true;
        }
      );
    });

    it("Rechaza webhook con timestamp fuera de tolerancia >300s (401)", async () => {
      const staleTs = String(Math.floor(Date.now() / 1000) - 600);
      const payloadWithId = Buffer.concat([rawBuffer, Buffer.from(staleTs, "utf8")]);
      const sig = createHmac("sha256", TEST_SECRET).update(payloadWithId).digest("hex");

      await assert.rejects(
        async () =>
          adapter.verifyWebhook(mockAccount, mockSecrets, {
            rawBody: rawBuffer,
            headers: {
              "x-kushki-id": staleTs,
              "x-kushki-signature": sig,
            },
            merchantId: "merchant_kushki_01",
          }),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "permission-denied");
          assert.equal(error.status, 401);
          return true;
        }
      );
    });

    it("Rechaza webhook sin holdId en metadatos (400)", async () => {
      const invalidPayload = JSON.stringify({
        transaction_id: "tx_kushki_no_hold",
        status: "approved",
      });
      const invalidBuffer = Buffer.from(invalidPayload, "utf8");
      const nowTs = String(Math.floor(Date.now() / 1000));
      const payloadWithId = Buffer.concat([invalidBuffer, Buffer.from(nowTs, "utf8")]);
      const sig = createHmac("sha256", TEST_SECRET).update(payloadWithId).digest("hex");

      await assert.rejects(
        async () =>
          adapter.verifyWebhook(mockAccount, mockSecrets, {
            rawBody: invalidBuffer,
            headers: {
              "x-kushki-id": nowTs,
              "x-kushki-signature": sig,
            },
            merchantId: "merchant_kushki_01",
          }),
        (err: unknown) => {
          const error = err as { code: string; status: number };
          assert.equal(error.code, "invalid-argument");
          assert.equal(error.status, 400);
          return true;
        }
      );
    });

    it("Mapea estados canónicos de Kushki: declined -> PAYMENT_FAILED, refunded -> REFUND", async () => {
      const nowTs = String(Math.floor(Date.now() / 1000));

      const declinedPayload = Buffer.from(
        JSON.stringify({
          transaction_id: "tx_dec_1",
          status: "declinedTransaction",
          metadata: { holdId: "hold_dec_01" },
        }),
        "utf8"
      );
      const sigDec = createHmac("sha256", TEST_SECRET)
        .update(Buffer.concat([declinedPayload, Buffer.from(nowTs, "utf8")]))
        .digest("hex");

      const eventDec = await adapter.verifyWebhook(mockAccount, mockSecrets, {
        rawBody: declinedPayload,
        headers: { "x-kushki-id": nowTs, "x-kushki-signature": sigDec },
        merchantId: "merchant_kushki_01",
      });
      assert.equal(eventDec.eventType, "PAYMENT_FAILED");

      const refundPayload = Buffer.from(
        JSON.stringify({
          transaction_id: "tx_ref_1",
          status: "refunded",
          metadata: { holdId: "hold_ref_01" },
        }),
        "utf8"
      );
      const sigRef = createHmac("sha256", TEST_SECRET)
        .update(Buffer.concat([refundPayload, Buffer.from(nowTs, "utf8")]))
        .digest("hex");

      const eventRef = await adapter.verifyWebhook(mockAccount, mockSecrets, {
        rawBody: refundPayload,
        headers: { "x-kushki-id": nowTs, "x-kushki-signature": sigRef },
        merchantId: "merchant_kushki_01",
      });
      assert.equal(eventRef.eventType, "REFUND");
    });
  });

  describe("verifyPayment (Consulta activa)", () => {
    it("Consulta estado de transacción exitosamente", async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async (url: string | URL | Request) => {
          assert.ok(String(url).includes("/v1/transactions/tx_query_123"));
          return new Response(
            JSON.stringify({
              transactionStatus: "APPROVAL",
              totalAmount: 100,
              holdId: "hold_queried_01",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }) as typeof fetch;

        const event = await adapter.verifyPayment(mockAccount, mockSecrets, "tx_query_123");
        assert.equal(event.eventType, "PAYMENT_SUCCESS");
        assert.equal(event.holdId, "hold_queried_01");
        assert.equal(event.amount, 100);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("refund (Reembolso)", () => {
    it("Ejecuta reembolso exitosamente", async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async (url: string | URL | Request) => {
          assert.ok(String(url).includes("/v1/transactions/tx_ref_123/refund"));
          return new Response(
            JSON.stringify({
              refundId: "ref_kushki_999",
              ticketNumber: "tkt_ref_123",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }) as typeof fetch;

        const result = await adapter.refund(mockAccount, mockSecrets, {
          businessId: "club_barahunda",
          transactionId: "tx_local_123",
          providerTransactionId: "tx_ref_123",
          amount: 50,
          currency: "USD",
          reason: "Cancelación VIP a tiempo",
        });

        assert.equal(result.status, "COMPLETED");
        assert.equal(result.refundId, "ref_kushki_999");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

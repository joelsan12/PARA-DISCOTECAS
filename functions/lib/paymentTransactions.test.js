process.env.NODE_ENV = "test";
process.env.GCLOUD_PROJECT = "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { resolvePaymentSecrets, clearSecretCache } from "./secretManager.js";
import { paymentRegistry, NonePaymentProvider } from "./providers/index.js";
const { processPaymentWebhook } = await import("./payments.js");
describe("Fase A — Pagos Multi-Tenant, Secret Manager y Abstracción", () => {
    it("SecretManager: resuelve secretos en formato JSON desde referencia env://", async () => {
        clearSecretCache();
        process.env.TEST_SECRET_JSON = JSON.stringify({
            webhookSecret: "super_secret_webhook_key_1234567890",
            privateApiKey: "private_api_key_test_abcdef"
        });
        const secrets = await resolvePaymentSecrets("env://TEST_SECRET_JSON");
        assert.equal(secrets.webhookSecret, "super_secret_webhook_key_1234567890");
        assert.equal(secrets.privateApiKey, "private_api_key_test_abcdef");
        // Verificar caché
        delete process.env.TEST_SECRET_JSON;
        const cachedSecrets = await resolvePaymentSecrets("env://TEST_SECRET_JSON");
        assert.equal(cachedSecrets.webhookSecret, "super_secret_webhook_key_1234567890");
        clearSecretCache();
    });
    it("SecretManager: resuelve secretos en texto plano como webhookSecret", async () => {
        clearSecretCache();
        process.env.TEST_SECRET_PLAIN = "plain_webhook_secret_value_9876543210";
        const secrets = await resolvePaymentSecrets("env://TEST_SECRET_PLAIN");
        assert.equal(secrets.webhookSecret, "plain_webhook_secret_value_9876543210");
        assert.equal(secrets.privateApiKey, undefined);
        clearSecretCache();
    });
    it("SecretManager: falla cerrado con error 503 ante referencia inválida o vacía", async () => {
        await assert.rejects(async () => resolvePaymentSecrets(""), (err) => {
            const error = err;
            assert.equal(error.code, "failed-precondition");
            assert.equal(error.status, 503);
            return true;
        });
    });
    it("PaymentRegistry: registra y resuelve proveedores canónicos", () => {
        const noneProvider = paymentRegistry.get("none");
        assert.ok(noneProvider instanceof NonePaymentProvider);
        assert.equal(noneProvider.name, "none");
        assert.throws(() => paymentRegistry.get("unsupported_provider_xyz"), /Proveedor de pago no soportado/);
    });
    it("Webhook: rechaza llamada sin firma temporal (t=)", async () => {
        const body = Buffer.from(JSON.stringify({ id: "evt_123", status: "paid", holdId: "hold_123" }));
        await assert.rejects(async () => processPaymentWebhook(body, undefined), (err) => {
            const error = err;
            assert.equal(error.code, "permission-denied");
            assert.equal(error.status, 401);
            return true;
        });
    });
    it("Webhook: rechaza firma con timestamp fuera de tolerancia (>300s)", async () => {
        const secret = "test-webhook-secret";
        const staleTime = Math.floor(Date.now() / 1000) - 600;
        const body = Buffer.from(JSON.stringify({ id: "evt_123", status: "paid", holdId: "hold_123" }));
        const signedPayload = Buffer.concat([Buffer.from(`${staleTime}.`, "utf8"), body]);
        const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
        const header = `t=${staleTime},v1=${sig}`;
        await assert.rejects(async () => processPaymentWebhook(body, header, { merchantId: "test_merchant" }), (err) => {
            const error = err;
            assert.equal(error.code, "permission-denied");
            assert.equal(error.status, 401);
            return true;
        });
    });
    it("Webhook: rechaza firma HMAC inválida (tampered)", async () => {
        const nowTime = Math.floor(Date.now() / 1000);
        const body = Buffer.from(JSON.stringify({ id: "evt_123", status: "paid", holdId: "hold_123" }));
        const header = `t=${nowTime},v1=bad_hex_signature_0000000000000000000000000000000000000000000000000000000000000000`;
        await assert.rejects(async () => processPaymentWebhook(body, header, { merchantId: "test_merchant" }), (err) => {
            const error = err;
            assert.equal(error.code, "permission-denied");
            assert.equal(error.status, 401);
            return true;
        });
    });
    it("Webhook: rechaza body que no es JSON válido tras validar firma", async () => {
        const secret = "test-webhook-secret";
        const nowTime = Math.floor(Date.now() / 1000);
        const body = Buffer.from("NOT_VALID_JSON_PAYLOAD_<<<>>>", "utf8");
        const signedPayload = Buffer.concat([Buffer.from(`${nowTime}.`, "utf8"), body]);
        const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
        const header = `t=${nowTime},v1=${sig}`;
        await assert.rejects(async () => processPaymentWebhook(body, header, { merchantId: "test_merchant" }), (err) => {
            const error = err;
            assert.equal(error.code, "invalid-argument");
            assert.match(error.message, /valid JSON/i);
            return true;
        });
    });
    it("Webhook: rechaza estado de pago desconocido o no soportado", async () => {
        const secret = "test-webhook-secret";
        const nowTime = Math.floor(Date.now() / 1000);
        const body = Buffer.from(JSON.stringify({ id: "evt_123", status: "UNKNOWN_WEIRD_STATUS", holdId: "hold_123" }));
        const signedPayload = Buffer.concat([Buffer.from(`${nowTime}.`, "utf8"), body]);
        const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
        const header = `t=${nowTime},v1=${sig}`;
        await assert.rejects(async () => processPaymentWebhook(body, header, { merchantId: "test_merchant" }), (err) => {
            const error = err;
            assert.equal(error.code, "invalid-argument");
            assert.match(error.message, /not supported/i);
            return true;
        });
    });
    it("Webhook: rechaza evento sin eventId ni holdId/reservationId", async () => {
        const secret = "test-webhook-secret";
        const nowTime = Math.floor(Date.now() / 1000);
        const body = Buffer.from(JSON.stringify({ status: "paid" })); // Falta id y holdId
        const signedPayload = Buffer.concat([Buffer.from(`${nowTime}.`, "utf8"), body]);
        const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
        const header = `t=${nowTime},v1=${sig}`;
        await assert.rejects(async () => processPaymentWebhook(body, header, { merchantId: "test_merchant" }), (err) => {
            const error = err;
            assert.equal(error.code, "invalid-argument");
            return true;
        });
    });
});
//# sourceMappingURL=paymentTransactions.test.js.map
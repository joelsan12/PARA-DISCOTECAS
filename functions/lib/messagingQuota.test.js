import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.IDENTIFIER_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.CAPTCHA_REQUIRED ||= "false";
const { requestOtpFor } = await import("./otp.js");
const { consumeMessagingBudget } = await import("./messagingQuota.js");
const { db } = await import("./config.js");
const NO_METHODS_BUSINESS = "club_no_authmethods";
const BUDGET_BUSINESS = "club_budget_breaker";
const PHONE = "+593999000222";
const EMAIL = `budget_${Date.now()}@nightflow.test`;
const IP_ADDRESS = "198.51.100.44";
function dayKey() {
    return new Date().toISOString().slice(0, 10);
}
function quotaReference(businessId) {
    return db.collection("businesses").doc(businessId).collection("messagingQuota").doc(dayKey());
}
async function seedFixture() {
    const batch = db.batch();
    batch.set(db.collection("businesses").doc(NO_METHODS_BUSINESS), {
        status: "active",
        name: "Club sin metodos"
    });
    batch.set(db.collection("businessDirectory").doc(NO_METHODS_BUSINESS), {
        name: "Club sin metodos",
        slug: "club-sin-metodos",
        city: "Quito",
        businessType: "discoteca",
        status: "active"
    });
    batch.set(db.collection("businesses").doc(BUDGET_BUSINESS), {
        status: "active",
        name: "Club presupuesto",
        authMethods: ["email_otp", "sms_otp"]
    });
    await batch.commit();
}
async function cleanupFixture() {
    await Promise.all([
        db.collection("businesses").doc(NO_METHODS_BUSINESS).delete(),
        db.collection("businessDirectory").doc(NO_METHODS_BUSINESS).delete(),
        db.collection("businesses").doc(BUDGET_BUSINESS).delete(),
        quotaReference(NO_METHODS_BUSINESS).delete(),
        quotaReference(BUDGET_BUSINESS).delete()
    ]).catch(() => undefined);
}
async function errorOf(promise) {
    try {
        await promise;
    }
    catch (error) {
        const record = error;
        return { code: String(record?.code ?? ""), message: String(record?.message ?? "") };
    }
    return { code: "", message: "" };
}
describe("AGENTS 4 — presupuesto de mensajeria y circuit breaker", () => {
    before(seedFixture);
    after(cleanupFixture);
    it("rechaza SMS si el negocio no habilito el canal (default-deny)", async () => {
        const error = await errorOf(requestOtpFor({ businessId: NO_METHODS_BUSINESS, identifier: PHONE, channel: "sms" }, IP_ADDRESS));
        assert.equal(error.code, "failed-precondition");
        assert.match(error.message, /not enabled/);
    });
    it("admite correo cuando no hay authMethods, sin habilitar los canales de pago", async () => {
        const error = await errorOf(requestOtpFor({ businessId: NO_METHODS_BUSINESS, identifier: EMAIL, channel: "email" }, IP_ADDRESS));
        // El canal de correo pasa la comprobacion de negocio; el fallo posterior, si
        // lo hay, es de proveedor configurado y no del gate de canales.
        assert.doesNotMatch(error.message, /not enabled/);
    });
    it("el circuit breaker suspende el canal de pago al agotar el presupuesto diario", async () => {
        await quotaReference(BUDGET_BUSINESS).set({
            businessId: BUDGET_BUSINESS,
            dayKey: dayKey(),
            sms: 1_000_000,
            whatsapp: 0,
            email: 0,
            paidDisabled: false
        });
        const first = await errorOf(consumeMessagingBudget(BUDGET_BUSINESS, "sms"));
        assert.equal(first.code, "resource-exhausted");
        const quota = await quotaReference(BUDGET_BUSINESS).get();
        assert.equal(quota.get("paidDisabled"), true);
        const business = await db.collection("businesses").doc(BUDGET_BUSINESS).get();
        assert.equal(business.get("otpPaidChannelsSuspended"), true);
        const second = await errorOf(consumeMessagingBudget(BUDGET_BUSINESS, "whatsapp"));
        assert.equal(second.code, "failed-precondition");
    });
    it("el correo sigue disponible con el canal de pago suspendido", async () => {
        await quotaReference(BUDGET_BUSINESS).update({ email: 0 });
        await consumeMessagingBudget(BUDGET_BUSINESS, "email");
        const quota = await quotaReference(BUDGET_BUSINESS).get();
        assert.equal(quota.get("email"), 1);
    });
    it("el consumo es contable por canal", async () => {
        await consumeMessagingBudget(BUDGET_BUSINESS, "email");
        await consumeMessagingBudget(BUDGET_BUSINESS, "email");
        const quota = await quotaReference(BUDGET_BUSINESS).get();
        assert.equal(quota.get("email"), 3);
    });
});
//# sourceMappingURL=messagingQuota.test.js.map
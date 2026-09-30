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
const GLOBAL_SECRET = process.env.PAYMENT_WEBHOOK_SECRET;
const TENANT_SECRET = "tenant_secret_per_business_0000000000000001";
const BUSINESS_ID = "club_webhook_tenant";
const OTHER_BUSINESS_ID = "club_webhook_otro";
const RESOURCE_ID = "tbl_webhook_01";
const CUSTOMER_UID = "uid_webhook_subject";
function sign(body, secret, timestamp = Math.floor(Date.now() / 1000)) {
    const payload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), Buffer.from(body, "utf8")]);
    return `t=${timestamp},v1=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
function signWithoutTimestamp(body, secret) {
    return `v1=${createHmac("sha256", secret).update(Buffer.from(body, "utf8")).digest("hex")}`;
}
function bodyFor(eventId, holdId, businessId) {
    return JSON.stringify({
        id: eventId,
        status: "succeeded",
        holdId,
        businessId,
        amount: 150,
        currency: "USD"
    });
}
async function seedHold(holdId, businessId, secret) {
    const batch = db.batch();
    batch.set(db.collection("businesses").doc(businessId), {
        status: "active",
        name: "Club Webhook",
        paymentWebhookSecret: secret,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    batch.set(db.collection("businesses").doc(businessId).collection("resources").doc(RESOURCE_ID), {
        eventId: "evt_webhook",
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
        eventId: "evt_webhook",
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
async function cleanup() {
    const holds = await db.collection("holds").where("resourceId", "==", RESOURCE_ID).get();
    const events = await db.collection("paymentEvents").get();
    const batch = db.batch();
    holds.forEach((document) => batch.delete(document.ref));
    for (const businessId of [BUSINESS_ID, OTHER_BUSINESS_ID]) {
        batch.delete(db.collection("businesses").doc(businessId));
        batch.delete(db.collection("businesses").doc(businessId).collection("resources").doc(RESOURCE_ID));
    }
    await batch.commit();
    const cleanupBatch = db.batch();
    events.docs.forEach((document) => {
        const data = document.data();
        if (data.holdId?.startsWith("hold_webhook"))
            cleanupBatch.delete(document.ref);
    });
    await cleanupBatch.commit().catch(() => undefined);
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
describe("webhook de pago — firma temporal y secreto por tenant", () => {
    before(async () => {
        await cleanup();
    });
    after(async () => {
        await cleanup();
    });
    it("rechaza una firma sin timestamp, que quedaria como credencial permanente", async () => {
        const holdId = "hold_webhook_sin_ts";
        await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
        const body = bodyFor(`evt_sin_ts_${Date.now()}`, holdId, BUSINESS_ID);
        const error = await errorOf(processPaymentWebhook(Buffer.from(body, "utf8"), signWithoutTimestamp(body, TENANT_SECRET)));
        assert.equal(error.code, "permission-denied");
        assert.match(error.message, /t= and v1=|timestamp/i);
    });
    it("rechaza una firma fuera de la ventana de tolerancia", async () => {
        const holdId = "hold_webhook_tViejo";
        await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
        const body = bodyFor(`evt_viejo_${Date.now()}`, holdId, BUSINESS_ID);
        const stale = Math.floor(Date.now() / 1000) - 7200;
        const error = await errorOf(processPaymentWebhook(Buffer.from(body, "utf8"), sign(body, TENANT_SECRET, stale)));
        assert.equal(error.code, "permission-denied");
    });
    it("rechaza la firma del secreto global sobre un negocio con secreto propio", async () => {
        const holdId = "hold_webhook_global";
        await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
        const body = bodyFor(`evt_global_${Date.now()}`, holdId, BUSINESS_ID);
        const error = await errorOf(processPaymentWebhook(Buffer.from(body, "utf8"), sign(body, GLOBAL_SECRET)));
        assert.equal(error.code, "permission-denied");
    });
    it("acepta el secreto del negocio y confirma el hold", async () => {
        const holdId = "hold_webhook_ok";
        await seedHold(holdId, BUSINESS_ID, TENANT_SECRET);
        const eventId = `evt_ok_${Date.now()}`;
        const body = bodyFor(eventId, holdId, BUSINESS_ID);
        const result = await processPaymentWebhook(Buffer.from(body, "utf8"), sign(body, TENANT_SECRET));
        assert.equal(result.duplicate, false);
        assert.equal(result.status, "PAID");
        const eventDoc = await db.collection("paymentEvents").doc(createHash("sha256").update(eventId).digest("hex").slice(0, 48)).get();
        assert.equal(eventDoc.get("resultStatus"), "PAID");
        assert.equal(eventDoc.get("businessId"), BUSINESS_ID);
    });
    it("el secreto de un negocio no confirma holds de otro", async () => {
        const holdId = "hold_webhook_cruzado";
        await seedHold(holdId, OTHER_BUSINESS_ID, "tenant_secret_otro_negocio_000000000000000002");
        const body = bodyFor(`evt_cruzado_${Date.now()}`, holdId, OTHER_BUSINESS_ID);
        const error = await errorOf(processPaymentWebhook(Buffer.from(body, "utf8"), sign(body, TENANT_SECRET)));
        assert.equal(error.code, "permission-denied");
    });
});
//# sourceMappingURL=paymentsWebhook.test.js.map
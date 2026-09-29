import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const { createReservationHoldFor, releaseHoldById } = await import("./reservations.js");
const { processPaymentWebhook } = await import("./payments.js");
const { db } = await import("./config.js");
const BUSINESS_ID = "club_test_holds";
const EVENT_ID = "evt_test_vip";
const RESOURCE_ID = "tbl_vip_01";
const CUSTOMER_UID = "uid_test_customer";
function callableRequest(data, uid) {
    const headers = { "x-forwarded-for": "127.0.0.1" };
    const rawRequest = {
        headers,
        method: "POST",
        rawBody: Buffer.from(JSON.stringify(data)),
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
        acceptsStreaming: false,
        get(header) {
            return headers[header.toLowerCase()];
        }
    };
    return {
        data,
        ...(uid ? { auth: { uid, token: {} } } : {}),
        rawRequest,
        acceptsStreaming: false
    };
}
async function seedFixture() {
    const businessRef = db.collection("businesses").doc(BUSINESS_ID);
    const resourceRef = businessRef.collection("resources").doc(RESOURCE_ID);
    const leftoverHolds = await db.collection("holds")
        .where("resourceId", "==", RESOURCE_ID)
        .where("state", "==", "HELD")
        .get();
    const batch = db.batch();
    leftoverHolds.forEach((docSnap) => {
        batch.set(docSnap.ref, {
            state: "EXPIRED",
            updatedAt: new Date().toISOString()
        }, { merge: true });
    });
    batch.set(businessRef, {
        status: "active",
        name: "Club Test Holds",
        updatedAt: new Date().toISOString()
    }, { merge: true });
    batch.set(resourceRef, {
        eventId: EVENT_ID,
        status: "AVAILABLE",
        active: true,
        holdAmount: 150,
        activeHoldId: null,
        holdTokenHash: null,
        holdExpiresAt: null,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    await batch.commit();
}
async function cleanupTestHolds() {
    const leftoverHolds = await db.collection("holds")
        .where("resourceId", "==", RESOURCE_ID)
        .get();
    const batch = db.batch();
    leftoverHolds.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
}
function signWebhook(body) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), Buffer.from(body, "utf8")]);
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    return `t=${timestamp},v1=${signature}`;
}
describe("Escenario 02:00 AM — Fase 7 holds y pagos", () => {
    before(async () => {
        await seedFixture();
    });
    after(async () => {
        await cleanupTestHolds().catch(() => undefined);
        await db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc(RESOURCE_ID).delete().catch(() => undefined);
    });
    it("Test #7: 20 holds concurrentes — solo 1 gana, 19 sin sobreventa", async () => {
        const attempts = Array.from({ length: 20 }, (_, index) => createReservationHoldFor(callableRequest({
            businessId: BUSINESS_ID,
            eventId: EVENT_ID,
            resourceId: RESOURCE_ID,
            amount: 150,
            currency: "USD",
            idempotencyKey: `concurrent-key-${index}-${Date.now()}`
        }, `${CUSTOMER_UID}_${index}`))
            .then(() => ({ ok: true }))
            .catch((error) => ({
            ok: false,
            code: error && typeof error === "object" && "code" in error
                ? String(error.code)
                : "unknown"
        })));
        const results = await Promise.all(attempts);
        const successes = results.filter((result) => result.ok);
        const exhausted = results.filter((result) => !result.ok && result.code === "resource-exhausted");
        const otherFailures = results.filter((result) => !result.ok && result.code !== "resource-exhausted");
        assert.equal(successes.length, 1, `Esperaba 1 hold exitoso, obtuve ${successes.length}. Fallos: ${JSON.stringify(otherFailures)} / exhausted: ${exhausted.length}`);
        assert.equal(exhausted.length, 19, `Esperaba 19 resource-exhausted, obtuve ${exhausted.length}`);
        assert.equal(otherFailures.length, 0, `Fallos inesperados: ${JSON.stringify(otherFailures)}`);
        const resource = await db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc(RESOURCE_ID).get();
        const resourceData = resource.data() ?? {};
        assert.equal(resourceData.status, "HELD", "El recurso debe quedar HELD exactamente una vez");
        assert.ok(typeof resourceData.activeHoldId === "string" && resourceData.activeHoldId.length > 0);
        const holdsSnapshot = await db.collection("holds")
            .where("resourceId", "==", RESOURCE_ID)
            .where("state", "==", "HELD")
            .get();
        const activeHolds = holdsSnapshot.docs.filter((docSnap) => {
            const expiresAt = docSnap.get("expiresAt");
            const millis = expiresAt?.toMillis?.() ?? 0;
            return millis > Date.now();
        });
        assert.equal(activeHolds.length, 1, "Solo puede haber un hold vigente por recurso");
        await releaseHoldById(String(resourceData.activeHoldId), undefined, false);
    });
    it("Test #8: webhook de pago tras expirar el hold → REFUND_REQUIRED, sin sobreventa", async () => {
        const holdId = `hold_late_${Date.now()}`;
        const holdRef = db.collection("holds").doc(holdId);
        const resourceRef = db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc(RESOURCE_ID);
        const setup = db.batch();
        setup.set(holdRef, {
            holdId,
            businessId: BUSINESS_ID,
            eventId: EVENT_ID,
            resourceId: RESOURCE_ID,
            customerUid: `${CUSTOMER_UID}_late`,
            state: "EXPIRED",
            paymentState: "PENDING",
            amount: 150,
            currency: "USD",
            expiresAt: new Date(Date.now() - 60_000),
            createdAt: new Date(Date.now() - 20 * 60 * 1000),
            updatedAt: new Date(Date.now() - 60_000)
        });
        setup.set(resourceRef, {
            eventId: EVENT_ID,
            status: "AVAILABLE",
            active: true,
            holdAmount: 150,
            activeHoldId: "hold_other_user",
            updatedAt: new Date().toISOString()
        }, { merge: true });
        await setup.commit();
        const eventId = `evt_late_${Date.now()}`;
        const body = JSON.stringify({
            id: eventId,
            status: "succeeded",
            holdId,
            amount: 150,
            currency: "USD",
            businessId: BUSINESS_ID,
            paymentReference: "pi_late_test"
        });
        const raw = Buffer.from(body, "utf8");
        const result = await processPaymentWebhook(raw, signWebhook(body));
        assert.equal(result.duplicate, false);
        assert.equal(result.status, "REFUND_REQUIRED");
        assert.equal(result.refundRequired, true);
        const holdAfter = await holdRef.get();
        assert.equal(holdAfter.get("state"), "EXPIRED");
        assert.equal(holdAfter.get("refundStatus"), "REQUIRED");
        const resourceAfter = await resourceRef.get();
        assert.notEqual(resourceAfter.get("status"), "CONFIRMED", "Nunca debe sobreconfirmar un recurso ajeno");
        assert.equal(resourceAfter.get("activeHoldId"), "hold_other_user", "El hold activo de otro usuario no se toca");
        const eventDoc = await db.collection("paymentEvents").doc(createHash("sha256").update(eventId).digest("hex").slice(0, 48)).get();
        assert.equal(eventDoc.exists, true);
        assert.equal(eventDoc.get("resultStatus"), "REFUND_REQUIRED");
        const financialDoc = await db.collection("financialRecords").doc(createHash("sha256").update(eventId).digest("hex").slice(0, 48)).get();
        assert.equal(financialDoc.exists, true);
        assert.equal(financialDoc.get("status"), "REFUND_REQUIRED");
        assert.equal(financialDoc.get("customerUid"), `${CUSTOMER_UID}_late`);
        const duplicate = await processPaymentWebhook(raw, signWebhook(body));
        assert.equal(duplicate.duplicate, true);
        assert.equal(duplicate.status, "REFUND_REQUIRED");
    });
});
//# sourceMappingURL=holdScenario.test.js.map
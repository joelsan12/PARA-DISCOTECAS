import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.IDENTIFIER_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const { privacyDeletionRequestFor } = await import("./privacy.js");
const { db } = await import("./config.js");
const BUSINESS_ID = "club_lopdp_02am";
const TARGET_UID = "uid_lopdp_subject";
const RESERVATION_ID = "res_lopdp_001";
const FINANCIAL_ID = "fin_lopdp_001";
function callableRequest(data, uid) {
    const headers = { "x-forwarded-for": "127.0.0.1", "x-request-id": "req_lopdp_test" };
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
        auth: { uid, token: {} },
        rawRequest,
        acceptsStreaming: false
    };
}
async function seedFixture() {
    const batch = db.batch();
    batch.set(db.collection("businesses").doc(BUSINESS_ID), {
        status: "active",
        name: "Club LOPDP 02AM",
        updatedAt: new Date().toISOString()
    });
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("customers").doc(TARGET_UID), {
        businessId: BUSINESS_ID,
        displayName: "Cliente Fiscal",
        email: "cliente@fiscal.test",
        phone: "+593999000111",
        status: "ACTIVE"
    });
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("reservations").doc(RESERVATION_ID), {
        businessId: BUSINESS_ID,
        customerUid: TARGET_UID,
        customerName: "Maria Perez",
        customerEmail: "cliente@fiscal.test",
        customerPhone: "+593999000111",
        documentId: "1712345678",
        cedula: "1712345678",
        taxId: "1712345678001",
        paymentToken: "tok_secret",
        cardLast4: "4242",
        ip: "203.0.113.10",
        biometrics: { faceHash: "bio_abc" },
        amount: 150,
        taxes: 24,
        currency: "USD",
        receiptNumber: "RC-LOPDP-0001",
        status: "CONFIRMED"
    });
    batch.set(db.collection("financialRecords").doc(FINANCIAL_ID), {
        businessId: BUSINESS_ID,
        customerUid: TARGET_UID,
        customerName: "Maria Perez",
        customerEmail: "cliente@fiscal.test",
        customerPhone: "+593999000111",
        documentId: "1712345678",
        cedula: "1712345678",
        taxId: "1712345678001",
        paymentToken: "tok_secret",
        cardLast4: "4242",
        ip: "203.0.113.10",
        amount: 150,
        taxes: 24,
        currency: "USD",
        receiptNumber: "RC-LOPDP-0001",
        status: "CONFIRMED",
        createdAt: new Date().toISOString()
    });
    await batch.commit();
}
async function cleanupFixture() {
    const { sha256 } = await import("./crypto.js");
    const privacyRequestId = `privacy_${sha256(`${BUSINESS_ID}:${TARGET_UID}`).slice(0, 40)}`;
    const paths = [
        db.collection("businesses").doc(BUSINESS_ID),
        db.collection("businesses").doc(BUSINESS_ID).collection("customers").doc(TARGET_UID),
        db.collection("businesses").doc(BUSINESS_ID).collection("reservations").doc(RESERVATION_ID),
        db.collection("businesses").doc(BUSINESS_ID).collection("securityIncidents").doc("cleanup"),
        db.collection("financialRecords").doc(FINANCIAL_ID),
        db.collection("privacyRequests").doc(privacyRequestId),
        db.collection("users").doc(TARGET_UID)
    ];
    const batch = db.batch();
    for (const path of paths)
        batch.delete(path);
    await batch.commit().catch(() => undefined);
}
async function resetPrivacyRequest() {
    const { sha256 } = await import("./crypto.js");
    const privacyRequestId = `privacy_${sha256(`${BUSINESS_ID}:${TARGET_UID}`).slice(0, 40)}`;
    await db.collection("privacyRequests").doc(privacyRequestId).delete().catch(() => undefined);
}
describe("Escenario 02:00 AM — Fase 9 privacidad LOPDP (Test #11)", () => {
    before(async () => {
        await resetPrivacyRequest();
        await seedFixture();
    });
    after(async () => {
        await cleanupFixture().catch(() => undefined);
    });
    it("Test #11: eliminación LOPDP destruye la ficha y preserva el comprobante fiscal bajo subjectPseudonym", async () => {
        const result = await privacyDeletionRequestFor(callableRequest({ businessId: BUSINESS_ID, targetUid: TARGET_UID }, TARGET_UID));
        assert.equal(result.status, "COMPLETED");
        assert.equal(result.businessId, BUSINESS_ID);
        assert.equal(result.anonymizedReservationCount, 1);
        assert.equal(typeof result.subjectPseudonym, "string");
        const subjectPseudonym = String(result.subjectPseudonym);
        assert.match(subjectPseudonym, /^sp_[a-f0-9]{24}$/);
        assert.ok(!subjectPseudonym.includes(TARGET_UID));
        assert.ok(!subjectPseudonym.includes("Maria"));
        assert.ok(!subjectPseudonym.includes("cliente@"));
        const reservation = await db
            .collection("businesses")
            .doc(BUSINESS_ID)
            .collection("reservations")
            .doc(RESERVATION_ID)
            .get();
        assert.equal(reservation.exists, true);
        const reservationData = reservation.data() ?? {};
        assert.equal(reservationData.customerUid, undefined, "customerUid debe eliminarse");
        assert.equal(reservationData.customerName, "ANONYMIZED");
        assert.equal(reservationData.customerEmail, undefined);
        assert.equal(reservationData.customerPhone, undefined);
        assert.equal(reservationData.documentId, undefined);
        assert.equal(reservationData.cedula, undefined);
        assert.equal(reservationData.paymentToken, undefined);
        assert.equal(reservationData.cardLast4, undefined);
        assert.equal(reservationData.ip, undefined);
        assert.equal(reservationData.biometrics, undefined);
        assert.equal(reservationData.anonymized, true);
        assert.equal(reservationData.subjectPseudonym, subjectPseudonym);
        assert.equal(reservationData.amount, 150, "monto fiscal debe preservarse");
        assert.equal(reservationData.taxes, 24, "impuestos deben preservarse");
        assert.equal(reservationData.currency, "USD");
        assert.equal(reservationData.receiptNumber, "RC-LOPDP-0001", "número de comprobante debe preservarse");
        const financial = await db.collection("financialRecords").doc(FINANCIAL_ID).get();
        assert.equal(financial.exists, true);
        const financialData = financial.data() ?? {};
        assert.equal(financialData.customerUid, undefined);
        assert.equal(financialData.customerName, undefined);
        assert.equal(financialData.customerEmail, undefined);
        assert.equal(financialData.paymentToken, undefined);
        assert.equal(financialData.subjectPseudonym, subjectPseudonym);
        assert.equal(financialData.amount, 150);
        assert.equal(financialData.taxes, 24);
        assert.equal(financialData.receiptNumber, "RC-LOPDP-0001");
        assert.equal(financialData.anonymized, true);
        const customer = await db
            .collection("businesses")
            .doc(BUSINESS_ID)
            .collection("customers")
            .doc(TARGET_UID)
            .get();
        const customerData = customer.data() ?? {};
        assert.equal(customerData.status, "ANONYMIZED");
        assert.equal(customerData.displayName, "ANONYMIZED");
        assert.equal(customerData.email, undefined);
        assert.equal(customerData.phone, undefined);
        const privacyRequest = await db
            .collection("privacyRequests")
            .doc(String(result.requestId))
            .get();
        assert.equal(privacyRequest.exists, true);
        assert.equal(privacyRequest.get("status"), "COMPLETED");
        assert.equal(privacyRequest.get("subjectPseudonym"), subjectPseudonym);
        assert.equal(privacyRequest.get("subjectUidHash").length, 64);
    });
});
//# sourceMappingURL=privacyScenario.test.js.map
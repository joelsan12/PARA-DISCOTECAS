import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const { upsertBusinessEventFor, parseUpsertEventInput } = await import("./events.js");
const { db } = await import("./config.js");
const BUSINESS_ID = "club_test_events";
const OWNER_UID = "uid_test_event_owner";
const MANAGER_UID = "uid_test_event_manager";
const DOOR_UID = "uid_test_event_door";
const STRANGER_UID = "uid_test_event_stranger";
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
const VALID_EVENT_PAYLOAD = {
    businessId: BUSINESS_ID,
    title: "Viernes Black Diamond VIP",
    subtitle: "Noche de música urbana y suites exclusivas",
    date: "2026-11-20",
    day_label: "Viernes 20 Nov",
    door_time: "22:30",
    cover_price: 25,
    dj_guest: "DJ Nightflow",
    genre: "Tech House / Urban",
    flyer_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200",
    is_published: true
};
describe("R2 & R3 — Cartelera de Eventos End-to-End (callable)", () => {
    before(async () => {
        const batch = db.batch();
        batch.set(db.collection("businesses").doc(BUSINESS_ID), {
            name: "Club Test Events",
            status: "active"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(OWNER_UID), {
            uid: OWNER_UID,
            businessId: BUSINESS_ID,
            role: "owner",
            status: "ACTIVE",
            deviceIds: []
        });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(MANAGER_UID), {
            uid: MANAGER_UID,
            businessId: BUSINESS_ID,
            role: "manager",
            status: "ACTIVE",
            deviceIds: []
        });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(DOOR_UID), {
            uid: DOOR_UID,
            businessId: BUSINESS_ID,
            role: "door_staff",
            status: "ACTIVE",
            deviceIds: []
        });
        await batch.commit();
    });
    after(async () => {
        const businessRef = db.collection("businesses").doc(BUSINESS_ID);
        const events = await businessRef.collection("events").get();
        const batch = db.batch();
        events.forEach(snap => batch.delete(snap.ref));
        batch.delete(businessRef.collection("staff").doc(OWNER_UID));
        batch.delete(businessRef.collection("staff").doc(MANAGER_UID));
        batch.delete(businessRef.collection("staff").doc(DOOR_UID));
        batch.delete(businessRef);
        await batch.commit();
    });
    it("parseUpsertEventInput valida campos obligatorios y formato de fecha", () => {
        const parsed = parseUpsertEventInput(VALID_EVENT_PAYLOAD);
        assert.equal(parsed.title, "Viernes Black Diamond VIP");
        assert.equal(parsed.date, "2026-11-20");
        assert.equal(parsed.cover_price, 25);
        assert.equal(parsed.is_published, true);
        // Fecha con formato inválido debe arrojar error
        assert.throws(() => {
            parseUpsertEventInput({
                ...VALID_EVENT_PAYLOAD,
                date: "20-11-2026"
            });
        }, /YYYY-MM-DD/);
    });
    it("Owner da de alta un evento con auto-id exitosamente", async () => {
        const result = await upsertBusinessEventFor(callableRequest(VALID_EVENT_PAYLOAD, OWNER_UID));
        assert.equal(result.success, true);
        assert.ok(result.eventId.startsWith("evt_"));
        assert.equal(result.event.title, "Viernes Black Diamond VIP");
        // Verificar persistencia en Firestore
        const savedSnap = await db.collection("businesses").doc(BUSINESS_ID).collection("events").doc(result.eventId).get();
        assert.ok(savedSnap.exists);
        assert.equal(savedSnap.data()?.title, "Viernes Black Diamond VIP");
    });
    it("Manager actualiza un evento existente", async () => {
        const createResult = await upsertBusinessEventFor(callableRequest(VALID_EVENT_PAYLOAD, OWNER_UID));
        const eventId = createResult.eventId;
        const updatePayload = {
            ...VALID_EVENT_PAYLOAD,
            eventId,
            title: "Viernes VIP — Edición Especial",
            cover_price: 35
        };
        const updateResult = await upsertBusinessEventFor(callableRequest(updatePayload, MANAGER_UID));
        assert.equal(updateResult.success, true);
        assert.equal(updateResult.eventId, eventId);
        const savedSnap = await db.collection("businesses").doc(BUSINESS_ID).collection("events").doc(eventId).get();
        assert.equal(savedSnap.data()?.title, "Viernes VIP — Edición Especial");
        assert.equal(savedSnap.data()?.cover_price, 35);
    });
    it("Personal de puerta (door_staff) es rechazado al intentar modificar o crear eventos", async () => {
        await assert.rejects(async () => {
            await upsertBusinessEventFor(callableRequest(VALID_EVENT_PAYLOAD, DOOR_UID));
        }, (error) => {
            assert.ok(typeof error === "object" && error !== null);
            assert.equal(error.code, "permission-denied");
            return true;
        });
    });
    it("Usuario ajeno (stranger) es rechazado con permission-denied", async () => {
        await assert.rejects(async () => {
            await upsertBusinessEventFor(callableRequest(VALID_EVENT_PAYLOAD, STRANGER_UID));
        }, (error) => {
            assert.ok(typeof error === "object" && error !== null);
            assert.equal(error.code, "permission-denied");
            return true;
        });
    });
    it("Petición sin autenticación es rechazada", async () => {
        await assert.rejects(async () => {
            await upsertBusinessEventFor(callableRequest(VALID_EVENT_PAYLOAD, undefined));
        }, (error) => {
            assert.ok(typeof error === "object" && error !== null);
            assert.equal(error.code, "unauthenticated");
            return true;
        });
    });
});
//# sourceMappingURL=events.test.js.map
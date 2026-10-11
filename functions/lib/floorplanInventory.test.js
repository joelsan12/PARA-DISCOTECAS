import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const { syncFloorPlanInventoryFor } = await import("./floorplanInventory.js");
const { db } = await import("./config.js");
const BUSINESS_ID = "club_test_inventory";
const OTHER_BUSINESS_ID = "club_test_other";
const OWNER_UID = "uid_test_inv_owner";
const MANAGER_UID = "uid_test_inv_manager";
const DOOR_UID = "uid_test_inv_door";
const STRANGER_UID = "uid_test_inv_stranger";
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
describe("O.0.2 — Sincronización de Inventario de Plano (syncFloorPlanInventory)", () => {
    before(async () => {
        const batch = db.batch();
        batch.set(db.collection("businesses").doc(BUSINESS_ID), {
            name: "Club Test Inventory",
            status: "active"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(OTHER_BUSINESS_ID), {
            name: "Club Other",
            status: "active"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(OWNER_UID), {
            uid: OWNER_UID,
            role: "owner",
            status: "ACTIVE"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(MANAGER_UID), {
            uid: MANAGER_UID,
            role: "manager",
            status: "ACTIVE"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(DOOR_UID), {
            uid: DOOR_UID,
            role: "door",
            status: "ACTIVE"
        }, { merge: true });
        // Sembrar mesa existente con hold activo que no debe ser eliminada
        batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc("tbl_held"), {
            resourceId: "tbl_held",
            businessId: BUSINESS_ID,
            name: "VIP-HELD",
            label: "VIP-HELD",
            zone: "VIP Stage",
            status: "HELD",
            activeHoldId: "hold_active_123",
            holdExpiresAt: new Date(Date.now() + 600000).toISOString(),
            source: "floorplan",
            is_active: true,
            active: true
        }, { merge: true });
        await batch.commit();
    });
    after(async () => {
        // Limpieza
        const resourcesSnap = await db.collection("businesses").doc(BUSINESS_ID).collection("resources").get();
        const batch = db.batch();
        for (const doc of resourcesSnap.docs) {
            batch.delete(doc.ref);
        }
        batch.delete(db.collection("businesses").doc(BUSINESS_ID));
        batch.delete(db.collection("businesses").doc(OTHER_BUSINESS_ID));
        await batch.commit();
    });
    it("1. Rechaza llamadas sin autenticación (401)", async () => {
        await assert.rejects(async () => {
            await syncFloorPlanInventoryFor(callableRequest({
                businessId: BUSINESS_ID,
                tables: []
            }));
        }, (err) => err.code === "unauthenticated" || err.httpErrorCode?.status === 401);
    });
    it("2. Rechaza a usuarios sin rol de staff en el club (403)", async () => {
        await assert.rejects(async () => {
            await syncFloorPlanInventoryFor(callableRequest({
                businessId: BUSINESS_ID,
                tables: []
            }, STRANGER_UID));
        }, (err) => err.code === "permission-denied" || err.httpErrorCode?.status === 403);
    });
    it("3. Rechaza a staff con rol insuficiente 'door' (403)", async () => {
        await assert.rejects(async () => {
            await syncFloorPlanInventoryFor(callableRequest({
                businessId: BUSINESS_ID,
                tables: []
            }, DOOR_UID));
        }, (err) => err.code === "permission-denied" || err.httpErrorCode?.status === 403);
    });
    it("4. Rechaza llamadas cross-tenant hacia otro club (403)", async () => {
        await assert.rejects(async () => {
            await syncFloorPlanInventoryFor(callableRequest({
                businessId: OTHER_BUSINESS_ID,
                tables: []
            }, MANAGER_UID));
        }, (err) => err.code === "permission-denied" || err.httpErrorCode?.status === 403);
    });
    it("5. Manager sincroniza mesas exitosamente (upsert de recursos)", async () => {
        const result = await syncFloorPlanInventoryFor(callableRequest({
            businessId: BUSINESS_ID,
            tables: [
                {
                    id: "tbl_1",
                    table_code: "VIP-1",
                    zone: "Stage",
                    capacity: 8,
                    min_spend: 500,
                    deposit_required: 100
                },
                {
                    id: "tbl_2",
                    table_code: "VIP-2",
                    zone: "Balcony",
                    capacity: 4,
                    min_spend: 300,
                    deposit_required: 50
                }
            ]
        }, MANAGER_UID));
        assert.equal(result.success, true);
        assert.equal(result.syncedCount, 2);
        // Verificar en Firestore
        const tbl1Doc = await db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc("tbl_1").get();
        assert.equal(tbl1Doc.exists, true);
        const tbl1 = tbl1Doc.data();
        assert.equal(tbl1.label, "VIP-1");
        assert.equal(tbl1.zone, "Stage");
        assert.equal(tbl1.capacity, 8);
        assert.equal(tbl1.status, "AVAILABLE");
        assert.equal(tbl1.source, "floorplan");
        assert.equal(tbl1.is_active, true);
    });
    it("6. Mesas removidas del plano se desactivan (soft-delete), preservando mesas con hold", async () => {
        // Sincronizar solo tbl_1 (tbl_2 queda omitida y tbl_held no estaba enviada)
        const result = await syncFloorPlanInventoryFor(callableRequest({
            businessId: BUSINESS_ID,
            tables: [
                {
                    id: "tbl_1",
                    table_code: "VIP-1",
                    zone: "Stage",
                    capacity: 8,
                    min_spend: 500,
                    deposit_required: 100
                }
            ]
        }, OWNER_UID));
        assert.equal(result.success, true);
        assert.equal(result.syncedCount, 1);
        assert.equal(result.deactivatedCount, 1); // tbl_2 fue desactivada
        assert.equal(result.skippedHoldsCount, 1); // tbl_held fue omitida porque tiene hold activo
        const tbl2Doc = await db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc("tbl_2").get();
        assert.equal(tbl2Doc.data()?.is_active, false);
        // tbl_held debe seguir activa con su hold intacto
        const tblHeldDoc = await db.collection("businesses").doc(BUSINESS_ID).collection("resources").doc("tbl_held").get();
        assert.equal(tblHeldDoc.data()?.activeHoldId, "hold_active_123");
        assert.equal(tblHeldDoc.data()?.status, "HELD");
    });
    it("7. Idempotencia en segunda sincronización consecutiva", async () => {
        const result = await syncFloorPlanInventoryFor(callableRequest({
            businessId: BUSINESS_ID,
            tables: [
                {
                    id: "tbl_1",
                    table_code: "VIP-1",
                    zone: "Stage",
                    capacity: 8,
                    min_spend: 500,
                    deposit_required: 100
                }
            ]
        }, MANAGER_UID));
        assert.equal(result.success, true);
        assert.equal(result.syncedCount, 1);
        assert.equal(result.deactivatedCount, 0); // Ya estaba desactivada tbl_2
    });
});
//# sourceMappingURL=floorplanInventory.test.js.map
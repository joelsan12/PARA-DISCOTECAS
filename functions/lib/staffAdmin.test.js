import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const { listBusinessStaffFor, upsertStaffMemberFor, revokeStaffMemberFor } = await import("./staffAdmin.js");
const { db } = await import("./config.js");
const BUSINESS_A = "club_test_staff_a";
const BUSINESS_B = "club_test_staff_b";
const OWNER_A_UID = "uid_staff_test_owner_a";
const MANAGER_A_UID = "uid_staff_test_manager_a";
const DOOR_A_UID = "uid_staff_test_door_a";
const WAITER_A_UID = "uid_staff_test_waiter_a";
const MANAGER_B_UID = "uid_staff_test_manager_b";
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
describe("O.1.B — Gestión de Personal (staffAdmin)", () => {
    before(async () => {
        const batch = db.batch();
        // Business A & B
        batch.set(db.collection("businesses").doc(BUSINESS_A), { name: "Club Alpha", status: "active" }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_B), { name: "Club Beta", status: "active" }, { merge: true });
        // Staff in Club A
        batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(OWNER_A_UID), {
            uid: OWNER_A_UID,
            businessId: BUSINESS_A,
            name: "Owner Alpha",
            email: "owner@alpha.club",
            role: "owner",
            status: "ACTIVE"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(MANAGER_A_UID), {
            uid: MANAGER_A_UID,
            businessId: BUSINESS_A,
            name: "Manager Alpha",
            email: "manager@alpha.club",
            role: "manager",
            status: "ACTIVE"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(DOOR_A_UID), {
            uid: DOOR_A_UID,
            businessId: BUSINESS_A,
            name: "Door Alpha",
            email: "door@alpha.club",
            role: "door",
            status: "ACTIVE"
        }, { merge: true });
        batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(WAITER_A_UID), {
            uid: WAITER_A_UID,
            businessId: BUSINESS_A,
            name: "Waiter Alpha",
            email: "waiter@alpha.club",
            role: "waiter",
            status: "ACTIVE",
            assignedZones: ["VIP 1", "VIP 2"]
        }, { merge: true });
        // Staff in Club B
        batch.set(db.collection("businesses").doc(BUSINESS_B).collection("staff").doc(MANAGER_B_UID), {
            uid: MANAGER_B_UID,
            businessId: BUSINESS_B,
            name: "Manager Beta",
            email: "manager@beta.club",
            role: "manager",
            status: "ACTIVE"
        }, { merge: true });
        await batch.commit();
    });
    after(async () => {
        // Limpieza
        const colls = [
            db.collection("businesses").doc(BUSINESS_A).collection("staff"),
            db.collection("businesses").doc(BUSINESS_B).collection("staff")
        ];
        for (const coll of colls) {
            const snap = await coll.get();
            const batch = db.batch();
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
    });
    describe("listBusinessStaff", () => {
        it("falla con 401 si no está autenticado", async () => {
            await assert.rejects(() => listBusinessStaffFor(callableRequest({ businessId: BUSINESS_A })), (err) => err.status === 401 || err.httpStatus === 401);
        });
        it("falla con 403 si el rol es insuficiente (door o waiter)", async () => {
            await assert.rejects(() => listBusinessStaffFor(callableRequest({ businessId: BUSINESS_A }, DOOR_A_UID)), (err) => err.status === 403 || err.httpStatus === 403);
            await assert.rejects(() => listBusinessStaffFor(callableRequest({ businessId: BUSINESS_A }, WAITER_A_UID)), (err) => err.status === 403 || err.httpStatus === 403);
        });
        it("falla con 403 ante acceso cross-tenant (manager de B intentando listar A)", async () => {
            await assert.rejects(() => listBusinessStaffFor(callableRequest({ businessId: BUSINESS_A }, MANAGER_B_UID)), (err) => err.status === 403 || err.httpStatus === 403);
        });
        it("permite a manager y owner listar el personal del club con datos correctos", async () => {
            const result = await listBusinessStaffFor(callableRequest({ businessId: BUSINESS_A }, MANAGER_A_UID));
            assert.ok(Array.isArray(result.staff));
            assert.ok(result.staff.length >= 4);
            const waiter = result.staff.find((s) => s.uid === WAITER_A_UID);
            assert.ok(waiter);
            assert.equal(waiter.role, "waiter");
            assert.deepEqual(waiter.assignedZones, ["VIP 1", "VIP 2"]);
            assert.equal(waiter.status, "ACTIVE");
        });
    });
    describe("upsertStaffMember", () => {
        it("falla con 403 si el que intenta crear no es manager o es rol insuficiente", async () => {
            await assert.rejects(() => upsertStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                email: "newwaiter@alpha.club",
                role: "waiter"
            }, WAITER_A_UID)), (err) => err.status === 403 || err.httpStatus === 403);
        });
        it("falla si se intenta asignar más de 9 zonas", async () => {
            const tenZones = Array.from({ length: 10 }, (_, i) => `Zona ${i + 1}`);
            await assert.rejects(() => upsertStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                email: "mesero10@alpha.club",
                role: "waiter",
                assignedZones: tenZones
            }, MANAGER_A_UID)), (err) => err.status === 400 || err.httpStatus === 400);
        });
        it("falla si manager intenta asignar rol de owner", async () => {
            await assert.rejects(() => upsertStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                email: "newowner@alpha.club",
                role: "owner"
            }, MANAGER_A_UID)), (err) => err.status === 403 || err.httpStatus === 403);
        });
        it("da de alta un nuevo mesero con email y contraseña temporal devuelta", async () => {
            const result = await upsertStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                name: "Carlos Mesero",
                email: "carlos.mesero@alpha.club",
                whatsapp: "+593991234567",
                role: "waiter",
                assignedZones: ["Terraza", "Platino"]
            }, MANAGER_A_UID));
            assert.equal(result.ok, true);
            assert.ok(result.uid);
            assert.equal(result.role, "waiter");
            assert.equal(result.name, "Carlos Mesero");
            assert.deepEqual(result.assignedZones, ["Terraza", "Platino"]);
            assert.ok(result.temporaryPassword, "Debe generar y devolver contraseña temporal para usuario nuevo");
            // Verificar persistencia en Firestore
            const snap = await db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(result.uid).get();
            assert.ok(snap.exists);
            assert.equal(snap.data()?.role, "waiter");
            assert.equal(snap.data()?.status, "ACTIVE");
        });
        it("actualiza un miembro existente manteniendo idempotencia y sin regenerar contraseña", async () => {
            const updateResult = await upsertStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                uid: WAITER_A_UID,
                name: "Waiter Alpha Modificado",
                role: "waiter",
                assignedZones: ["VIP 1", "VIP 2", "VIP 3"]
            }, MANAGER_A_UID));
            assert.equal(updateResult.ok, true);
            assert.equal(updateResult.name, "Waiter Alpha Modificado");
            assert.deepEqual(updateResult.assignedZones, ["VIP 1", "VIP 2", "VIP 3"]);
            assert.equal(updateResult.temporaryPassword, undefined);
            const snap = await db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(WAITER_A_UID).get();
            assert.equal(snap.data()?.name, "Waiter Alpha Modificado");
            assert.deepEqual(snap.data()?.assignedZones, ["VIP 1", "VIP 2", "VIP 3"]);
        });
    });
    describe("revokeStaffMember", () => {
        it("falla si el usuario intenta revocarse a sí mismo", async () => {
            await assert.rejects(() => revokeStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                uid: MANAGER_A_UID
            }, MANAGER_A_UID)), (err) => err.status === 400 || err.httpStatus === 400);
        });
        it("falla si manager intenta revocar a owner", async () => {
            await assert.rejects(() => revokeStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                uid: OWNER_A_UID
            }, MANAGER_A_UID)), (err) => err.status === 403 || err.httpStatus === 403);
        });
        it("revoca exitosamente a un miembro de personal cambiando status a REVOKED sin borrar", async () => {
            const result = await revokeStaffMemberFor(callableRequest({
                businessId: BUSINESS_A,
                uid: WAITER_A_UID
            }, MANAGER_A_UID));
            assert.equal(result.ok, true);
            assert.equal(result.status, "REVOKED");
            const snap = await db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(WAITER_A_UID).get();
            assert.ok(snap.exists, "El documento nunca debe eliminarse de la colección");
            assert.equal(snap.data()?.status, "REVOKED");
        });
    });
});
//# sourceMappingURL=staffAdmin.test.js.map
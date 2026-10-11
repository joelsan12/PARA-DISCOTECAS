import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const {
  getConsumptionCatalogFor,
  saveConsumptionCatalogFor,
  addConsumptionItemFor,
  settleTableTabFor
} = await import("./consumption.js");
const { db } = await import("./config.js");

const BUSINESS_A = "club_test_consump_a";
const BUSINESS_B = "club_test_consump_b";
const OWNER_A = "uid_consump_owner_a";
const MANAGER_A = "uid_consump_manager_a";
const FINANCE_A = "uid_consump_finance_a";
const WAITER_A = "uid_consump_waiter_a";
const DOOR_A = "uid_consump_door_a";
const WAITER_B = "uid_consump_waiter_b";

const RES_CONFIRMED = "res_test_confirmed_123";
const RES_CANCELLED = "res_test_cancelled_456";

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
  } as unknown as Parameters<typeof addConsumptionItemFor>[0];
}

describe("O.2 — Consumo de Mesas & Cierre Manual (consumption)", () => {
  before(async () => {
    const batch = db.batch();

    // Club A & B
    batch.set(db.collection("businesses").doc(BUSINESS_A), { name: "Club Consump A", status: "active" }, { merge: true });
    batch.set(db.collection("businesses").doc(BUSINESS_B), { name: "Club Consump B", status: "active" }, { merge: true });

    // Staff in Club A
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(OWNER_A), {
      uid: OWNER_A,
      businessId: BUSINESS_A,
      name: "Owner A",
      role: "owner",
      status: "ACTIVE"
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(MANAGER_A), {
      uid: MANAGER_A,
      businessId: BUSINESS_A,
      name: "Manager A",
      role: "manager",
      status: "ACTIVE"
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(FINANCE_A), {
      uid: FINANCE_A,
      businessId: BUSINESS_A,
      name: "Finance A",
      role: "finance",
      status: "ACTIVE"
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(WAITER_A), {
      uid: WAITER_A,
      businessId: BUSINESS_A,
      name: "Waiter A",
      role: "waiter",
      status: "ACTIVE",
      assignedZones: ["VIP Stage"]
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(DOOR_A), {
      uid: DOOR_A,
      businessId: BUSINESS_A,
      name: "Door A",
      role: "door",
      status: "ACTIVE"
    }, { merge: true });

    // Staff in Club B
    batch.set(db.collection("businesses").doc(BUSINESS_B).collection("staff").doc(WAITER_B), {
      uid: WAITER_B,
      businessId: BUSINESS_B,
      name: "Waiter B",
      role: "waiter",
      status: "ACTIVE"
    }, { merge: true });

    // Reservas de prueba
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("reservations").doc(RES_CONFIRMED), {
      id: RES_CONFIRMED,
      businessId: BUSINESS_A,
      status: "CONFIRMED",
      resourceId: "table_vip_01",
      eventId: "evt_sabado_vip",
      customerName: "Juan Pérez",
      depositAmount: 100,
      minSpend: 300
    }, { merge: true });

    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("reservations").doc(RES_CANCELLED), {
      id: RES_CANCELLED,
      businessId: BUSINESS_A,
      status: "CANCELLED",
      resourceId: "table_vip_02",
      eventId: "evt_sabado_vip"
    }, { merge: true });

    await batch.commit();
  });

  after(async () => {
    const tabsSnap = await db.collection("businesses").doc(BUSINESS_A).collection("tableTabs").get();
    const batch = db.batch();
    tabsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  });

  describe("Catálogo de Consumo", () => {
    it("permite a un mesero consultar el catálogo de consumo", async () => {
      const res = await getConsumptionCatalogFor(callableRequest({ businessId: BUSINESS_A }, WAITER_A));
      assert.ok(Array.isArray(res.items));
      assert.ok(res.items.length > 0);
      assert.ok(res.items.some((i) => i.category === "Tequila"));
    });

    it("falla con 403 si un mesero intenta guardar/modificar el catálogo", async () => {
      await assert.rejects(
        () => saveConsumptionCatalogFor(callableRequest({
          businessId: BUSINESS_A,
          items: [{ sku: "TEST-1", name: "Producto Test", price: 50, category: "Test" }]
        }, WAITER_A)),
        (err: any) => err.status === 403 || err.httpStatus === 403
      );
    });

    it("permite al gerente guardar un catálogo personalizado", async () => {
      const customItems = [
        { sku: "BTL-GIN-1", name: "Gin Botanist 750ml", price: 130, category: "Gin" },
        { sku: "MIX-TONIC-1", name: "Agua Tónica Fever Tree", price: 6, category: "Mixers" }
      ];
      const res = await saveConsumptionCatalogFor(callableRequest({
        businessId: BUSINESS_A,
        items: customItems
      }, MANAGER_A));
      assert.equal(res.success, true);
      assert.equal(res.count, 2);

      const catalog = await getConsumptionCatalogFor(callableRequest({ businessId: BUSINESS_A }, WAITER_A));
      assert.equal(catalog.items.length, 2);
      assert.equal(catalog.items[0]?.sku, "BTL-GIN-1");
    });
  });

  describe("addConsumptionItem", () => {
    it("falla con 401 si no está autenticado", async () => {
      await assert.rejects(
        () => addConsumptionItemFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CONFIRMED,
          item: { name: "Don Julio 70", qty: 1, price: 195 }
        })),
        (err: any) => err.status === 401 || err.httpStatus === 401
      );
    });

    it("falla con 404 si la reserva no existe", async () => {
      await assert.rejects(
        () => addConsumptionItemFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: "res_inexistente_999",
          item: { name: "Cerveza Corona", qty: 2, price: 6 }
        }, WAITER_A)),
        (err: any) => err.status === 404 || err.httpStatus === 404
      );
    });

    it("falla con 409 si la reserva no está confirmada (ej. CANCELLED)", async () => {
      await assert.rejects(
        () => addConsumptionItemFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CANCELLED,
          item: { name: "Cerveza Corona", qty: 2, price: 6 }
        }, WAITER_A)),
        (err: any) => err.status === 409 || err.httpStatus === 409
      );
    });

    it("falla con 403 ante acceso cross-tenant (mesero de club B intentando cargar en club A)", async () => {
      await assert.rejects(
        () => addConsumptionItemFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CONFIRMED,
          item: { name: "Don Julio 70", qty: 1, price: 195 }
        }, WAITER_B)),
        (err: any) => err.status === 403 || err.httpStatus === 403
      );
    });

    it("permite al mesero añadir un ítem de consumo a la mesa con recálculo de subtotal y status OPEN", async () => {
      const res = await addConsumptionItemFor(callableRequest({
        businessId: BUSINESS_A,
        reservationId: RES_CONFIRMED,
        idempotencyKey: "item_order_1",
        item: {
          sku: "BTL-TEQ-DONJULIO70",
          name: "Don Julio 70 Cristalino",
          qty: 1,
          price: 195
        }
      }, WAITER_A));

      assert.equal(res.ok, true);
      assert.equal(res.tab.status, "OPEN");
      assert.equal(res.tab.subtotal, 195);
      assert.equal(res.tab.depositAmount, 100);
      assert.equal(res.tab.minSpend, 300);
      assert.equal(res.tab.items.length, 1);
      assert.equal(res.tab.items[0]?.addedBy, WAITER_A);
    });

    it("es idempotente ante reintentos con la misma idempotencyKey (no duplica subtotal)", async () => {
      const res = await addConsumptionItemFor(callableRequest({
        businessId: BUSINESS_A,
        reservationId: RES_CONFIRMED,
        idempotencyKey: "item_order_1",
        item: {
          sku: "BTL-TEQ-DONJULIO70",
          name: "Don Julio 70 Cristalino",
          qty: 1,
          price: 195
        }
      }, WAITER_A));

      assert.equal(res.ok, true);
      assert.equal(res.tab.items.length, 1, "No debe duplicar el ítem si la clave ya existe");
      assert.equal(res.tab.subtotal, 195);
    });

    it("permite acumular ítems adicionales incrementando el subtotal", async () => {
      const res = await addConsumptionItemFor(callableRequest({
        businessId: BUSINESS_A,
        reservationId: RES_CONFIRMED,
        idempotencyKey: "item_order_2",
        item: {
          sku: "MIX-RED-BULL",
          name: "Red Bull Pack x4",
          qty: 2,
          price: 24
        }
      }, WAITER_A));

      assert.equal(res.ok, true);
      assert.equal(res.tab.items.length, 2);
      // 195 + (2 * 24) = 195 + 48 = 243
      assert.equal(res.tab.subtotal, 243);
    });
  });

  describe("settleTableTab", () => {
    it("falla con 403 si un mesero intenta cerrar la cuenta (el mesero nunca cierra)", async () => {
      await assert.rejects(
        () => settleTableTabFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CONFIRMED,
          settlementMethod: "cash"
        }, WAITER_A)),
        (err: any) => err.status === 403 || err.httpStatus === 403
      );
    });

    it("falla con 403 si un portero intenta cerrar la cuenta", async () => {
      await assert.rejects(
        () => settleTableTabFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CONFIRMED,
          settlementMethod: "cash"
        }, DOOR_A)),
        (err: any) => err.status === 403 || err.httpStatus === 403
      );
    });

    it("permite al personal de finanzas o gerencia realizar el cierre manual de la cuenta", async () => {
      const res = await settleTableTabFor(callableRequest({
        businessId: BUSINESS_A,
        reservationId: RES_CONFIRMED,
        settlementMethod: "card_manual",
        notes: "Cobrado con voucher terminal POS #4"
      }, FINANCE_A));

      assert.equal(res.ok, true);
      assert.equal(res.status, "SETTLED");
      assert.equal(res.subtotal, 243);
      assert.equal(res.settledBy, FINANCE_A);

      // Verificar en Firestore
      const snap = await db.collection("businesses").doc(BUSINESS_A).collection("tableTabs").doc(RES_CONFIRMED).get();
      assert.equal(snap.data()?.status, "SETTLED");
      assert.equal(snap.data()?.settlementMethod, "card_manual");
    });

    it("es idempotente ante llamadas repetidas de cierre (devuelve replay: true)", async () => {
      const res = await settleTableTabFor(callableRequest({
        businessId: BUSINESS_A,
        reservationId: RES_CONFIRMED,
        settlementMethod: "card_manual"
      }, MANAGER_A));

      assert.equal(res.ok, true);
      assert.equal(res.status, "SETTLED");
      assert.equal(res.replay, true);
    });

    it("bloquea añadir nuevos consumos una vez que la mesa está en estado SETTLED", async () => {
      await assert.rejects(
        () => addConsumptionItemFor(callableRequest({
          businessId: BUSINESS_A,
          reservationId: RES_CONFIRMED,
          item: { name: "Agua Evian", qty: 1, price: 8 }
        }, WAITER_A)),
        (err: any) => err.status === 409 || err.httpStatus === 409
      );
    });
  });
});

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const {
  createConciergeRequestFor,
  updateConciergeRequestStatusFor,
  cancelConciergeRequestFor
} = await import("./concierge.js");
const { db } = await import("./config.js");

const BUSINESS_A = "club_test_concierge_a";
const BUSINESS_B = "club_test_concierge_b";
const OWNER_A = "uid_concierge_owner_a";
const MANAGER_A = "uid_concierge_manager_a";
const WAITER_A = "uid_concierge_waiter_a";
const WAITER_B = "uid_concierge_waiter_b";
const CUSTOMER_1 = "uid_concierge_cust_1";
const CUSTOMER_2 = "uid_concierge_cust_2";

const RES_CONFIRMED = "res_test_concierge_101";

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
  } as unknown as Parameters<typeof createConciergeRequestFor>[0];
}

describe("O.3 — Concierge Digital (concierge)", () => {
  before(async () => {
    const batch = db.batch();

    // Businesses
    batch.set(db.collection("businesses").doc(BUSINESS_A), { name: "Club Concierge A", status: "active" }, { merge: true });
    batch.set(db.collection("businesses").doc(BUSINESS_B), { name: "Club Concierge B", status: "active" }, { merge: true });

    // Staff in Club A
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(OWNER_A), {
      uid: OWNER_A,
      businessId: BUSINESS_A,
      role: "owner",
      status: "ACTIVE",
      name: "Owner A"
    });
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(MANAGER_A), {
      uid: MANAGER_A,
      businessId: BUSINESS_A,
      role: "manager",
      status: "ACTIVE",
      name: "Manager A"
    });
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("staff").doc(WAITER_A), {
      uid: WAITER_A,
      businessId: BUSINESS_A,
      role: "waiter",
      status: "ACTIVE",
      name: "Waiter Juan",
      assignedZones: ["VIP Stage", "Palco"]
    });

    // Staff in Club B
    batch.set(db.collection("businesses").doc(BUSINESS_B).collection("staff").doc(WAITER_B), {
      uid: WAITER_B,
      businessId: BUSINESS_B,
      role: "waiter",
      status: "ACTIVE",
      name: "Waiter B"
    });

    // Confirmed reservation for CUSTOMER_1 in Club A
    batch.set(db.collection("businesses").doc(BUSINESS_A).collection("reservations").doc(RES_CONFIRMED), {
      businessId: BUSINESS_A,
      customerUid: CUSTOMER_1,
      status: "CONFIRMED",
      resourceId: "table_vip_01",
      tableCode: "VIP-01",
      zone: "VIP Stage",
      customerName: "Carlos VIP",
      customerPhone: "+593991234567"
    });

    await batch.commit();
  });

  after(async () => {
    const collections = [
      db.collection("businesses").doc(BUSINESS_A).collection("conciergeRequests"),
      db.collection("businesses").doc(BUSINESS_B).collection("conciergeRequests")
    ];
    for (const col of collections) {
      const snap = await col.get();
      const b = db.batch();
      snap.docs.forEach(d => b.delete(d.ref));
      await b.commit();
    }
  });

  it("1. Rechaza creación de solicitud sin autenticación (401)", async () => {
    await assert.rejects(
      async () => {
        await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "WAITER" }));
      },
      (err: { code?: string; status?: number }) => {
        return err.code === "unauthenticated" || err.status === 401;
      }
    );
  });

  it("2. Rechaza tipo de solicitud no permitido (400)", async () => {
    await assert.rejects(
      async () => {
        await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "INVALID_TYPE" }, CUSTOMER_1));
      },
      (err: { code?: string; status?: number }) => {
        return err.code === "invalid-argument" || err.status === 400;
      }
    );
  });

  it("3. Cliente crea solicitud y se auto-asocia con su reserva confirmada", async () => {
    const res = await createConciergeRequestFor(
      callableRequest(
        {
          businessId: BUSINESS_A,
          type: "WAITER",
          message: "Por favor traer copas adicionales"
        },
        CUSTOMER_1
      )
    );

    assert.strictEqual(res.ok, true);
    assert.ok(res.requestId.startsWith("req_"));
    assert.strictEqual(res.request.status, "PENDING");
    assert.strictEqual(res.request.type, "WAITER");
    assert.strictEqual(res.request.reservationId, RES_CONFIRMED);
    assert.strictEqual(res.request.tableCode, "VIP-01");
    assert.strictEqual(res.request.zone, "VIP Stage");
  });

  it("4. Mitigación anti-spam: rechaza la 4ta solicitud cuando ya existen 3 PENDING", async () => {
    // Ya tenemos 1 del test anterior, creamos 2 más
    await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "SERVICE", message: "Hielo" }, CUSTOMER_1));
    await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "HOOKAH", message: "Menta" }, CUSTOMER_1));

    // La 4ta debe ser bloqueada por resource-exhausted (429)
    await assert.rejects(
      async () => {
        await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "OTHER", message: "Cuarta solicitud spam" }, CUSTOMER_1));
      },
      (err: { code?: string; status?: number }) => {
        return err.code === "resource-exhausted" || err.status === 429;
      }
    );
  });

  it("5. Rechaza actualización de estado sin staff o cross-tenant (403)", async () => {
    const created = await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "BOTTLE" }, CUSTOMER_2));

    // Usuario cliente normal no puede actualizar
    await assert.rejects(
      async () => {
        await updateConciergeRequestStatusFor(
          callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "IN_PROGRESS" }, CUSTOMER_2)
        );
      },
      (err: { code?: string; status?: number }) => err.code === "permission-denied" || err.status === 403
    );

    // Mesero de otro negocio (B) no puede tocar solicitud de A
    await assert.rejects(
      async () => {
        await updateConciergeRequestStatusFor(
          callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "IN_PROGRESS" }, WAITER_B)
        );
      },
      (err: { code?: string; status?: number }) => err.code === "permission-denied" || err.status === 403
    );
  });

  it("6. Mesero toma solicitud a IN_PROGRESS y la completa a DONE", async () => {
    const created = await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "BOTTLE", message: "Moët" }, CUSTOMER_2));

    // Mesero A toma la solicitud
    const progressRes = await updateConciergeRequestStatusFor(
      callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "IN_PROGRESS" }, WAITER_A)
    );
    assert.strictEqual(progressRes.ok, true);
    assert.strictEqual(progressRes.status, "IN_PROGRESS");

    // Verificar en base de datos la asignación del mesero
    const snap = await db.collection("businesses").doc(BUSINESS_A).collection("conciergeRequests").doc(created.requestId).get();
    assert.strictEqual(snap.data()?.assignedWaiterUid, WAITER_A);
    assert.strictEqual(snap.data()?.assignedWaiterName, "Waiter Juan");

    // Mesero completa la solicitud a DONE
    const doneRes = await updateConciergeRequestStatusFor(
      callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "DONE" }, WAITER_A)
    );
    assert.strictEqual(doneRes.ok, true);
    assert.strictEqual(doneRes.status, "DONE");

    // Idempotencia: enviar DONE de nuevo devuelve replay: true
    const replayRes = await updateConciergeRequestStatusFor(
      callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "DONE" }, WAITER_A)
    );
    assert.strictEqual(replayRes.replay, true);
  });

  it("7. Mesero no puede cancelar solicitudes (403), pero Gerente sí puede", async () => {
    const created = await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "SERVICE", message: "Servilletas" }, CUSTOMER_2));

    // Mesero intenta cancelar -> 403
    await assert.rejects(
      async () => {
        await updateConciergeRequestStatusFor(
          callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "CANCELLED" }, WAITER_A)
        );
      },
      (err: { code?: string; status?: number }) => err.code === "permission-denied" || err.status === 403
    );

    // Gerente cancela -> OK
    const cancelRes = await updateConciergeRequestStatusFor(
      callableRequest({ businessId: BUSINESS_A, requestId: created.requestId, status: "CANCELLED" }, MANAGER_A)
    );
    assert.strictEqual(cancelRes.ok, true);
    assert.strictEqual(cancelRes.status, "CANCELLED");
  });

  it("8. Cliente puede cancelar su propia solicitud pendiente", async () => {
    const created = await createConciergeRequestFor(callableRequest({ businessId: BUSINESS_A, type: "WAITER", message: "Olvidar pedido" }, CUSTOMER_2));

    // Otro cliente intenta cancelar la solicitud -> 403
    await assert.rejects(
      async () => {
        await cancelConciergeRequestFor(
          callableRequest({ businessId: BUSINESS_A, requestId: created.requestId }, CUSTOMER_1)
        );
      },
      (err: { code?: string; status?: number }) => err.code === "permission-denied" || err.status === 403
    );

    // El cliente titular la cancela -> OK
    const cancelRes = await cancelConciergeRequestFor(
      callableRequest({ businessId: BUSINESS_A, requestId: created.requestId }, CUSTOMER_2)
    );
    assert.strictEqual(cancelRes.ok, true);
    assert.strictEqual(cancelRes.status, "CANCELLED");
  });
});

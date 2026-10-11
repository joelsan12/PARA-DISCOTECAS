import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { asRecord, assertAllowedKeys, requiredId, requiredString } from "./validation.js";
import { randomId } from "./crypto.js";
const DEFAULT_CATALOG = [
    { sku: "BTL-TEQ-DONJULIO70", name: "Don Julio 70 Cristalino 750ml", price: 195, category: "Tequila" },
    { sku: "BTL-WHK-BLUE", name: "Johnnie Walker Blue Label 750ml", price: 340, category: "Whisky" },
    { sku: "BTL-WHK-BLACK", name: "Johnnie Walker Black Label 750ml", price: 110, category: "Whisky" },
    { sku: "BTL-GIN-HENDRICKS", name: "Hendrick's Gin 750ml", price: 125, category: "Gin" },
    { sku: "BTL-VOD-GREYGOOSE", name: "Grey Goose Vodka 750ml", price: 120, category: "Vodka" },
    { sku: "BTL-CHP-DOMPERIGNON", name: "Dom Pérignon Vintage 750ml", price: 420, category: "Champagne" },
    { sku: "BTL-CHP-MOET", name: "Moët & Chandon Brut Imperial", price: 160, category: "Champagne" },
    { sku: "MIX-RED-BULL", name: "Red Bull Energy Drink (Pack x4)", price: 24, category: "Mixers" },
    { sku: "MIX-AGUA-EVIAN", name: "Agua Evian 750ml", price: 8, category: "Mixers" }
];
export async function getConsumptionCatalogFor(request) {
    const callerUid = callableUid(request);
    const record = asRecord(request.data);
    assertAllowedKeys(record, ["businessId"]);
    const businessId = requiredId(record, "businessId");
    await requireStaff(callerUid, businessId, "waiter");
    const docSnap = await db
        .collection("businesses")
        .doc(businessId)
        .collection("consumptionCatalog")
        .doc("main")
        .get();
    if (!docSnap.exists) {
        return { items: DEFAULT_CATALOG };
    }
    const data = docSnap.data();
    const rawItems = Array.isArray(data?.items) ? data.items : [];
    const items = rawItems
        .filter((it) => typeof it === "object" && it !== null)
        .map((it) => ({
        sku: typeof it.sku === "string" ? it.sku.trim() : randomId("sku"),
        name: typeof it.name === "string" ? it.name.trim().slice(0, 80) : "Ítem",
        price: typeof it.price === "number" && Number.isFinite(it.price) && it.price >= 0 ? it.price : 0,
        category: typeof it.category === "string" ? it.category.trim().slice(0, 40) : "General"
    }));
    return { items: items.length > 0 ? items : DEFAULT_CATALOG };
}
export async function saveConsumptionCatalogFor(request) {
    const callerUid = callableUid(request);
    const record = asRecord(request.data);
    assertAllowedKeys(record, ["businessId", "items"]);
    const businessId = requiredId(record, "businessId");
    const callerProfile = await requireStaff(callerUid, businessId, "manager");
    if (!Array.isArray(record.items)) {
        throw new AppError("invalid-argument", "items debe ser un array de productos", 400);
    }
    if (record.items.length > 100) {
        throw new AppError("invalid-argument", "El catálogo no puede superar los 100 productos", 400);
    }
    const cleanItems = record.items.map((it, idx) => {
        if (typeof it !== "object" || it === null) {
            throw new AppError("invalid-argument", `Producto en índice ${idx} no es válido`);
        }
        const itemObj = it;
        const sku = typeof itemObj.sku === "string" && itemObj.sku.trim().length > 0
            ? itemObj.sku.trim().slice(0, 40)
            : randomId("sku");
        const name = requiredString(itemObj, "name", 1, 80);
        const rawPrice = itemObj.price;
        if (typeof rawPrice !== "number" || !Number.isFinite(rawPrice) || rawPrice < 0) {
            throw new AppError("invalid-argument", `Precio inválido para ${name}`);
        }
        const category = typeof itemObj.category === "string" ? itemObj.category.trim().slice(0, 40) : "General";
        return {
            sku,
            name,
            price: Math.round(rawPrice * 100) / 100,
            category
        };
    });
    const catalogRef = db.collection("businesses").doc(businessId).collection("consumptionCatalog").doc("main");
    await catalogRef.set({
        items: cleanItems,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: callerUid
    }, { merge: true });
    await writeAudit("consumption.catalog_updated", "business", businessId, {
        businessId,
        actorUid: callerUid,
        actorRole: callerProfile.role,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, {
        count: cleanItems.length
    });
    return { success: true, count: cleanItems.length };
}
export async function addConsumptionItemFor(request) {
    const callerUid = callableUid(request);
    const record = asRecord(request.data);
    assertAllowedKeys(record, ["businessId", "reservationId", "idempotencyKey", "item", "items"]);
    const businessId = requiredId(record, "businessId");
    const reservationId = requiredId(record, "reservationId");
    const callerProfile = await requireStaff(callerUid, businessId, "waiter");
    // 1. Validar que la reserva pertenezca al negocio y esté CONFIRMED / ACTIVA
    const resDoc = await db.collection("businesses").doc(businessId).collection("reservations").doc(reservationId).get();
    if (!resDoc.exists) {
        throw new AppError("not-found", "La reserva no existe en este establecimiento", 404);
    }
    const resData = resDoc.data();
    const resStatus = String(resData.status || "").toUpperCase();
    if (resStatus !== "CONFIRMED" && resStatus !== "PAID" && resStatus !== "CHECKED_IN") {
        throw new AppError("failed-precondition", `No se puede registrar consumo en una reserva con estado ${resStatus}`, 409);
    }
    const resourceId = String(resData.resourceId || resData.tableId || resData.table_id || "table_main");
    const eventId = String(resData.eventId || resData.event_id || "evt_active");
    const depositAmount = typeof resData.depositAmount === "number" ? resData.depositAmount : (typeof resData.paidAmount === "number" ? resData.paidAmount : 0);
    const minSpend = typeof resData.minSpend === "number" ? resData.minSpend : (typeof resData.min_spend === "number" ? resData.min_spend : 0);
    // 2. Normalizar ítems a añadir
    const rawItemsList = record.items !== undefined
        ? (Array.isArray(record.items) ? record.items : [])
        : (record.item !== undefined && typeof record.item === "object" ? [record.item] : []);
    if (rawItemsList.length === 0) {
        throw new AppError("invalid-argument", "Debe proporcionar al menos un ítem para agregar al consumo", 400);
    }
    const newItems = [];
    const idempotencyKey = typeof record.idempotencyKey === "string" ? record.idempotencyKey.trim() : null;
    for (let idx = 0; idx < rawItemsList.length; idx++) {
        const rawIt = rawItemsList[idx];
        const name = requiredString(rawIt, "name", 1, 80);
        const rawQty = rawIt.qty ?? rawIt.quantity ?? 1;
        if (typeof rawQty !== "number" || !Number.isInteger(rawQty) || rawQty < 1 || rawQty > 50) {
            throw new AppError("invalid-argument", `Cantidad inválida para ${name} (1 a 50)`);
        }
        const rawUnitPrice = rawIt.unitPrice ?? rawIt.price ?? 0;
        if (typeof rawUnitPrice !== "number" || !Number.isFinite(rawUnitPrice) || rawUnitPrice < 0) {
            throw new AppError("invalid-argument", `Precio unitario inválido para ${name}`);
        }
        const unitPrice = Math.round(rawUnitPrice * 100) / 100;
        const total = Math.round(rawQty * unitPrice * 100) / 100;
        const sku = typeof rawIt.sku === "string" ? rawIt.sku.trim() : undefined;
        const id = idempotencyKey && rawItemsList.length === 1 ? idempotencyKey : randomId("item");
        newItems.push({
            id,
            sku,
            name,
            qty: rawQty,
            unitPrice,
            total,
            addedBy: callerUid,
            addedAt: new Date().toISOString()
        });
    }
    // 3. Transacción o lectura/escritura atómica sobre tableTabs/{reservationId}
    const tabRef = db.collection("businesses").doc(businessId).collection("tableTabs").doc(reservationId);
    const tabSnap = await tabRef.get();
    let existingItems = [];
    let isNew = true;
    if (tabSnap.exists) {
        isNew = false;
        const tabData = tabSnap.data();
        if (tabData.status === "SETTLED") {
            throw new AppError("failed-precondition", "La cuenta de esta mesa ya está cerrada (SETTLED). No se pueden agregar consumos.", 409);
        }
        if (Array.isArray(tabData.items)) {
            existingItems = tabData.items;
        }
    }
    // Idempotencia: Si newItems contiene un id que ya existe en existingItems, deduplicar
    const existingIds = new Set(existingItems.map((i) => i.id));
    const trulyNewItems = newItems.filter((i) => !existingIds.has(i.id));
    const mergedItems = [...existingItems, ...trulyNewItems];
    const subtotal = Math.round(mergedItems.reduce((acc, it) => acc + it.total, 0) * 100) / 100;
    const tabPayload = {
        businessId,
        reservationId,
        resourceId,
        eventId,
        items: mergedItems,
        subtotal,
        depositAmount,
        minSpend,
        status: "OPEN",
        updatedAt: FieldValue.serverTimestamp(),
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {})
    };
    await tabRef.set(tabPayload, { merge: true });
    await writeAudit("consumption.item_added", "tableTab", reservationId, {
        businessId,
        actorUid: callerUid,
        actorRole: callerProfile.role,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, {
        reservationId,
        itemsAddedCount: trulyNewItems.length,
        subtotal,
        resourceId
    });
    const returnedTab = {
        businessId,
        reservationId,
        resourceId,
        eventId,
        items: mergedItems,
        subtotal,
        depositAmount,
        minSpend,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    return { ok: true, tab: returnedTab };
}
export async function settleTableTabFor(request) {
    const callerUid = callableUid(request);
    const record = asRecord(request.data);
    assertAllowedKeys(record, ["businessId", "reservationId", "settlementMethod", "notes"]);
    const businessId = requiredId(record, "businessId");
    const reservationId = requiredId(record, "reservationId");
    // AGENTS O.2: Exige rol finance o superior (finance, manager, owner). Waiter y door reciben 403.
    const callerProfile = await requireStaff(callerUid, businessId, "finance");
    const rawMethod = requiredString(record, "settlementMethod", 3, 20).toLowerCase();
    if (rawMethod !== "cash" && rawMethod !== "card_manual" && rawMethod !== "transfer" && rawMethod !== "other") {
        throw new AppError("invalid-argument", "settlementMethod debe ser uno de: cash, card_manual, transfer, other");
    }
    const tabRef = db.collection("businesses").doc(businessId).collection("tableTabs").doc(reservationId);
    const tabSnap = await tabRef.get();
    if (!tabSnap.exists) {
        throw new AppError("not-found", "No existe una cuenta abierta para esta reserva", 404);
    }
    const tabData = tabSnap.data();
    // Idempotencia: si ya estaba SETTLED, devolver éxito
    if (tabData.status === "SETTLED") {
        return {
            ok: true,
            status: "SETTLED",
            reservationId,
            subtotal: tabData.subtotal ?? 0,
            settledBy: tabData.settledBy ?? callerUid,
            replay: true
        };
    }
    const nowIso = new Date().toISOString();
    await tabRef.update({
        status: "SETTLED",
        settlementMethod: rawMethod,
        settledBy: callerUid,
        settledAt: FieldValue.serverTimestamp(),
        notes: typeof record.notes === "string" ? record.notes.trim().slice(0, 200) : null,
        updatedAt: FieldValue.serverTimestamp()
    });
    await writeAudit("consumption.tab_settled", "tableTab", reservationId, {
        businessId,
        actorUid: callerUid,
        actorRole: callerProfile.role,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, {
        reservationId,
        subtotal: tabData.subtotal ?? 0,
        settlementMethod: rawMethod,
        settledAt: nowIso
    });
    return {
        ok: true,
        status: "SETTLED",
        reservationId,
        subtotal: tabData.subtotal ?? 0,
        settledBy: callerUid
    };
}
//# sourceMappingURL=consumption.js.map
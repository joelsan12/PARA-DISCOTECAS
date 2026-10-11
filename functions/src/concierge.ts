import type { CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { asRecord, assertAllowedKeys, requiredId, requiredString } from "./validation.js";
import { randomId } from "./crypto.js";

export type ConciergeRequestType = "SERVICE" | "BOTTLE" | "HOOKAH" | "WAITER" | "OTHER";
export type ConciergeRequestStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface ConciergeRequestRecord {
  requestId: string;
  businessId: string;
  uid: string;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  reservationId?: string | undefined;
  resourceId?: string | undefined;
  tableCode?: string | undefined;
  zone?: string | undefined;
  type: ConciergeRequestType;
  message: string;
  status: ConciergeRequestStatus;
  assignedWaiterUid?: string | undefined;
  assignedWaiterName?: string | undefined;
  source: "in_app" | "whatsapp";
  createdAt: string | null;
  updatedAt: string | null;
}

const ALLOWED_TYPES = new Set<ConciergeRequestType>(["SERVICE", "BOTTLE", "HOOKAH", "WAITER", "OTHER"]);
const ALLOWED_STATUSES = new Set<ConciergeRequestStatus>(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]);

export async function createConciergeRequestFor(
  request: CallableRequest<unknown>
): Promise<{ ok: true; requestId: string; request: ConciergeRequestRecord }> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, [
    "businessId",
    "type",
    "message",
    "reservationId",
    "resourceId",
    "tableCode",
    "zone",
    "source",
    "customerName",
    "customerPhone"
  ]);

  const businessId = requiredId(record, "businessId");
  const rawType = requiredString(record, "type", 3, 20).toUpperCase() as ConciergeRequestType;
  if (!ALLOWED_TYPES.has(rawType)) {
    throw new AppError("invalid-argument", "Tipo de solicitud inválido (debe ser SERVICE, BOTTLE, HOOKAH, WAITER u OTHER)", 400);
  }

  const rawMessage = typeof record.message === "string" ? record.message.trim().slice(0, 300) : "";
  const message = rawMessage || (rawType === "WAITER" ? "Solicitud de atención de mesero en mesa" : "Solicitud de asistencia VIP");

  // Mitigación anti-spam: máximo 3 solicitudes en estado PENDING por usuario en este negocio
  const pendingSnap = await db
    .collection("businesses")
    .doc(businessId)
    .collection("conciergeRequests")
    .where("uid", "==", callerUid)
    .where("status", "==", "PENDING")
    .get();

  if (pendingSnap.size >= 3) {
    throw new AppError(
      "resource-exhausted",
      "Ya tienes 3 solicitudes pendientes en atención. Espera a que el equipo de sala las atienda antes de enviar otra.",
      429
    );
  }

  // Auto-asociación de reserva activa si no fue provista explícitamente
  let reservationId = typeof record.reservationId === "string" ? record.reservationId.trim() : undefined;
  let resourceId = typeof record.resourceId === "string" ? record.resourceId.trim() : undefined;
  let tableCode = typeof record.tableCode === "string" ? record.tableCode.trim() : undefined;
  let zone = typeof record.zone === "string" ? record.zone.trim() : undefined;
  let customerName = typeof record.customerName === "string" ? record.customerName.trim().slice(0, 80) : undefined;
  let customerPhone = typeof record.customerPhone === "string" ? record.customerPhone.trim().slice(0, 25) : undefined;

  if (reservationId) {
    const resDoc = await db.collection("businesses").doc(businessId).collection("reservations").doc(reservationId).get();
    if (resDoc.exists) {
      const resData = resDoc.data()!;
      if (!resourceId) resourceId = String(resData.resourceId || resData.tableId || resData.table_id || "");
      if (!tableCode) tableCode = String(resData.tableCode || resData.table_code || "");
      if (!zone) zone = String(resData.zone || "");
      if (!customerName) customerName = String(resData.customerName || resData.holderName || "");
      if (!customerPhone) customerPhone = String(resData.customerPhone || resData.phone || "");
    }
  } else {
    // Buscar la última reserva confirmada del usuario
    const resListSnap = await db
      .collection("businesses")
      .doc(businessId)
      .collection("reservations")
      .where("customerUid", "==", callerUid)
      .where("status", "in", ["CONFIRMED", "CHECKED_IN"])
      .limit(1)
      .get();

    if (!resListSnap.empty) {
      const firstRes = resListSnap.docs[0];
      if (firstRes) {
        const resData = firstRes.data();
        reservationId = firstRes.id;
        resourceId = String(resData.resourceId || resData.tableId || resData.table_id || "");
        tableCode = String(resData.tableCode || resData.table_code || "");
        zone = String(resData.zone || "");
        if (!customerName) customerName = String(resData.customerName || resData.holderName || "");
        if (!customerPhone) customerPhone = String(resData.customerPhone || resData.phone || "");
      }
    }
  }

  const requestId = randomId("req");
  const source = record.source === "whatsapp" ? "whatsapp" : "in_app";
  const nowIso = new Date().toISOString();

  const docPayload = {
    requestId,
    businessId,
    uid: callerUid,
    customerName: customerName ?? null,
    customerPhone: customerPhone ?? null,
    reservationId: reservationId ?? null,
    resourceId: resourceId ?? null,
    tableCode: tableCode ?? null,
    zone: zone ?? null,
    type: rawType,
    message,
    status: "PENDING" as const,
    assignedWaiterUid: null,
    assignedWaiterName: null,
    source,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await db
    .collection("businesses")
    .doc(businessId)
    .collection("conciergeRequests")
    .doc(requestId)
    .set(docPayload);

  await writeAudit(
    "concierge.request_created",
    "conciergeRequest",
    requestId,
    {
      businessId,
      actorUid: callerUid,
      actorRole: "customer",
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      type: rawType,
      reservationId: reservationId ?? null,
      tableCode: tableCode ?? null,
      zone: zone ?? null,
      source
    }
  );

  const requestRecord: ConciergeRequestRecord = {
    requestId,
    businessId,
    uid: callerUid,
    customerName,
    customerPhone,
    reservationId,
    resourceId,
    tableCode,
    zone,
    type: rawType,
    message,
    status: "PENDING",
    source,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  return { ok: true, requestId, request: requestRecord };
}

export async function updateConciergeRequestStatusFor(
  request: CallableRequest<unknown>
): Promise<{ ok: true; requestId: string; status: ConciergeRequestStatus; replay?: boolean }> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["businessId", "requestId", "status", "assignedWaiterUid", "assignedWaiterName"]);

  const businessId = requiredId(record, "businessId");
  const requestId = requiredId(record, "requestId");
  const targetStatus = requiredString(record, "status", 3, 20).toUpperCase() as ConciergeRequestStatus;

  if (!ALLOWED_STATUSES.has(targetStatus)) {
    throw new AppError("invalid-argument", "Estado de concierge inválido (debe ser PENDING, IN_PROGRESS, DONE o CANCELLED)", 400);
  }

  // Debe ser al menos personal activo del establecimiento
  const callerProfile = await requireStaff(callerUid, businessId, "waiter");

  const docRef = db.collection("businesses").doc(businessId).collection("conciergeRequests").doc(requestId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new AppError("not-found", "La solicitud de concierge no existe en este establecimiento", 404);
  }

  const reqData = docSnap.data()!;
  const currentStatus = (reqData.status || "PENDING") as ConciergeRequestStatus;

  // Idempotencia
  if (currentStatus === targetStatus) {
    return { ok: true, requestId, status: targetStatus, replay: true };
  }

  // Transiciones whitelist estrictas
  if (currentStatus === "DONE" || currentStatus === "CANCELLED") {
    throw new AppError("failed-precondition", `La solicitud ya se encuentra finalizada (${currentStatus}) y no puede reabrirse`, 409);
  }

  // Reglas por rol: Mesero solo puede tomar (IN_PROGRESS) o completar (DONE); NO puede cancelar solicitudes
  if (callerProfile.role === "waiter") {
    if (targetStatus === "CANCELLED") {
      throw new AppError("permission-denied", "Solo un gerente o administrador del local puede cancelar solicitudes de clientes", 403);
    }
  }

  let assignedWaiterUid = typeof record.assignedWaiterUid === "string" ? record.assignedWaiterUid.trim() : undefined;
  let assignedWaiterName = typeof record.assignedWaiterName === "string" ? record.assignedWaiterName.trim() : undefined;

  // Si un mesero toma la solicitud a IN_PROGRESS y no especificó otro, auto-asignarlo
  if (targetStatus === "IN_PROGRESS" && !assignedWaiterUid) {
    assignedWaiterUid = callerUid;
    const staffDoc = await db.collection("businesses").doc(businessId).collection("staff").doc(callerUid).get();
    assignedWaiterName = String(staffDoc.data()?.name || "Mesero en Sala");
  }

  const updatePayload: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (assignedWaiterUid) {
    updatePayload.assignedWaiterUid = assignedWaiterUid;
    updatePayload.assignedWaiterName = assignedWaiterName ?? "Mesero en Sala";
  }

  await docRef.update(updatePayload);

  await writeAudit(
    "concierge.status_updated",
    "conciergeRequest",
    requestId,
    {
      businessId,
      actorUid: callerUid,
      actorRole: callerProfile.role,
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      previousStatus: currentStatus,
      newStatus: targetStatus,
      assignedWaiterUid: assignedWaiterUid ?? null
    }
  );

  return { ok: true, requestId, status: targetStatus };
}

export async function cancelConciergeRequestFor(
  request: CallableRequest<unknown>
): Promise<{ ok: true; requestId: string; status: "CANCELLED"; replay?: boolean }> {
  const callerUid = callableUid(request);
  const record = asRecord(request.data);
  assertAllowedKeys(record, ["businessId", "requestId"]);

  const businessId = requiredId(record, "businessId");
  const requestId = requiredId(record, "requestId");

  const docRef = db.collection("businesses").doc(businessId).collection("conciergeRequests").doc(requestId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new AppError("not-found", "La solicitud no existe", 404);
  }

  const reqData = docSnap.data()!;
  // El cliente solo puede cancelar sus propias solicitudes
  if (reqData.uid !== callerUid) {
    throw new AppError("permission-denied", "No tienes permisos para cancelar esta solicitud", 403);
  }

  if (reqData.status === "CANCELLED") {
    return { ok: true, requestId, status: "CANCELLED", replay: true };
  }

  if (reqData.status === "DONE") {
    throw new AppError("failed-precondition", "La solicitud ya fue completada y no se puede cancelar", 409);
  }

  await docRef.update({
    status: "CANCELLED",
    updatedAt: FieldValue.serverTimestamp()
  });

  await writeAudit(
    "concierge.request_cancelled_by_customer",
    "conciergeRequest",
    requestId,
    {
      businessId,
      actorUid: callerUid,
      actorRole: "customer",
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      requestId
    }
  );

  return { ok: true, requestId, status: "CANCELLED" };
}

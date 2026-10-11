import { FieldValue } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isSuperAdmin, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { resolvePaymentSecrets } from "./secretManager.js";
import { paymentRegistry } from "./providers/index.js";
import {
  asRecord,
  assertAllowedKeys,
  optionalNumber,
  optionalString,
  requiredId,
  requiredString
} from "./validation.js";
import type {
  PaymentAccount,
  PaymentSecrets,
  PaymentTransaction
} from "./types/payments.js";
import { createHash } from "node:crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface ListPaymentTransactionsInput {
  businessId: string;
  limit?: number;
}

export function parseListTransactionsInput(value: unknown): ListPaymentTransactionsInput {
  const record = asRecord(value, "list transactions");
  assertAllowedKeys(record, ["businessId", "limit"]);
  const businessId = requiredId(record, "businessId");
  const limit = optionalNumber(record, "limit", 1, 100) ?? 50;
  return { businessId, limit };
}

export interface CreatePaymentRefundInput {
  businessId: string;
  transactionId: string;
  reason?: string;
}

export function parseCreateRefundInput(value: unknown): CreatePaymentRefundInput {
  const record = asRecord(value, "create refund");
  assertAllowedKeys(record, ["businessId", "transactionId", "reason"]);
  const businessId = requiredId(record, "businessId");
  const transactionId = requiredString(record, "transactionId", 3, 100);
  const reason = optionalString(record, "reason", 1, 200);
  return { businessId, transactionId, ...(reason ? { reason } : {}) };
}

/**
 * listPaymentTransactions — Consulta segura de transacciones para rol finance/manager
 */
export async function listPaymentTransactionsFor(
  request: CallableRequest<unknown>
): Promise<{ success: boolean; transactions: Array<Record<string, unknown>> }> {
  const uid = callableUid(request);
  const input = parseListTransactionsInput(request.data);

  if (!(await isSuperAdmin(uid))) {
    await requireStaff(uid, input.businessId, "finance");
  }

  const txCollection = db
    .collection("businesses")
    .doc(input.businessId)
    .collection("paymentTransactions");

  // Leer documentos ordenados por fecha de actualización descendente
  let snapshot;
  try {
    snapshot = await txCollection.orderBy("updatedAt", "desc").limit(input.limit ?? 50).get();
  } catch {
    snapshot = await txCollection.limit(input.limit ?? 50).get();
  }

  const transactions: Array<Record<string, unknown>> = [];
  const holdIdsToFetch = new Set<string>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.holdId === "string" && data.holdId) {
      holdIdsToFetch.add(data.holdId);
    }
  }

  // Pre-cargar holds asociados para enriquecer estados
  const holdsMap = new Map<string, { state?: string | undefined; paymentState?: string | undefined; refundStatus?: string | undefined }>();
  for (const holdId of holdIdsToFetch) {
    try {
      const holdSnap = await db.collection("holds").doc(holdId).get();
      if (holdSnap.exists) {
        const hData = holdSnap.data() as Record<string, unknown>;
        holdsMap.set(holdId, {
          state: typeof hData.state === "string" ? hData.state : undefined,
          paymentState: typeof hData.paymentState === "string" ? hData.paymentState : undefined,
          refundStatus: typeof hData.refundStatus === "string" ? hData.refundStatus : undefined
        });
      }
    } catch {
      // Continuar si falla lectura de hold individual
    }
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const holdInfo = data.holdId ? holdsMap.get(data.holdId) : undefined;
    transactions.push({
      id: doc.id,
      businessId: input.businessId,
      holdId: data.holdId ?? null,
      orderId: data.orderId ?? null,
      provider: data.provider ?? "unknown",
      providerTransactionId: data.providerTransactionId ?? null,
      amount: data.amount ?? 0,
      currency: data.currency ?? "USD",
      status: data.status ?? "UNKNOWN",
      refundId: data.refundId ?? null,
      refundedAt: data.refundedAt ? data.refundedAt.toDate?.()?.toISOString?.() ?? data.refundedAt : null,
      holdState: holdInfo?.state ?? null,
      holdPaymentState: holdInfo?.paymentState ?? null,
      refundStatus: holdInfo?.refundStatus ?? null,
      createdAt: data.createdAt ? data.createdAt.toDate?.()?.toISOString?.() ?? data.createdAt : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate?.()?.toISOString?.() ?? data.updatedAt : null
    });
  }

  return { success: true, transactions };
}

/**
 * createPaymentRefund — Emisión de reembolsos vía PSP y actualización atómica en Firestore
 */
export async function createPaymentRefundFor(
  request: CallableRequest<unknown>
): Promise<{ success: boolean; replay: boolean; status: string; refundId: string }> {
  const uid = callableUid(request);
  const input = parseCreateRefundInput(request.data);

  let actorRole = "super_admin";
  if (!(await isSuperAdmin(uid))) {
    const staff = await requireStaff(uid, input.businessId, "finance");
    actorRole = staff.role;
  }

  const txRef = db
    .collection("businesses")
    .doc(input.businessId)
    .collection("paymentTransactions")
    .doc(input.transactionId);

  const txSnap = await txRef.get();
  if (!txSnap.exists) {
    throw new AppError("not-found", "Transacción no encontrada", 404);
  }

  const txData = txSnap.data() as PaymentTransaction & Record<string, unknown>;

  // Cross-tenant guard
  if (txData.businessId && txData.businessId !== input.businessId) {
    throw new AppError("permission-denied", "Operación no autorizada para este establecimiento", 403);
  }

  // Idempotencia: si ya está REFUNDED, retorna respuesta exitosa inmediatamente (replay)
  if (txData.status === "REFUNDED") {
    return {
      success: true,
      replay: true,
      status: "REFUNDED",
      refundId: (txData.refundId as string) || `ref_replay_${input.transactionId}`
    };
  }

  // Resolver configuración de pasarela del negocio
  const accSnap = await db
    .collection("businesses")
    .doc(input.businessId)
    .collection("private")
    .doc("paymentAccount")
    .get();

  if (!accSnap.exists) {
    throw new AppError("failed-precondition", "La pasarela de pagos del establecimiento no está configurada", 503);
  }

  const accData = accSnap.data() as Record<string, unknown>;
  const secretRef = typeof accData.secretReference === "string" ? accData.secretReference : "";
  let secrets: PaymentSecrets | null = null;

  if (secretRef) {
    try {
      secrets = await resolvePaymentSecrets(secretRef);
    } catch {
      throw new AppError("failed-precondition", "No se pudieron resolver los secretos de pasarela", 503);
    }
  }

  if (!secrets || !secrets.privateApiKey) {
    // Si no tiene privateApiKey en secretRef, comprobar si existe directa
    if (typeof accData.privateApiKey === "string" && accData.privateApiKey.length >= 10) {
      secrets = {
        privateApiKey: accData.privateApiKey,
        webhookSecret: typeof accData.webhookSecret === "string" ? accData.webhookSecret : ""
      };
    } else {
      throw new AppError("failed-precondition", "Claves privadas de pasarela incompletas para reembolso", 503);
    }
  }

  const providerName = String(accData.provider || txData.provider || "kushki").toLowerCase();
  const adapter = paymentRegistry.get(providerName);
  if (!adapter) {
    throw new AppError("failed-precondition", `Proveedor de pagos "${providerName}" no soportado para reembolsos`, 400);
  }
  if (typeof adapter.refund !== "function") {
    throw new AppError("failed-precondition", `El proveedor "${providerName}" no soporta reembolsos automáticos`, 400);
  }

  const paymentAccount: PaymentAccount = {
    businessId: input.businessId,
    provider: providerName as any,
    environment: accData.environment === "production" ? "production" : "sandbox",
    merchantId: String(accData.merchantId || txData.providerMerchantId || ""),
    paymentMode: "CLIENT_GATEWAY",
    status: "ACTIVE",
    updatedAt: Date.now()
  };

  const refundInput = {
    businessId: input.businessId,
    transactionId: input.transactionId,
    providerTransactionId: String(txData.providerTransactionId || txData.id),
    amount: Number(txData.amount || 0),
    currency: "USD" as const,
    ...(input.reason ? { reason: input.reason } : {})
  };

  const refundResult = await adapter.refund(paymentAccount, secrets, refundInput);
  if (refundResult.status !== "COMPLETED") {
    throw new AppError("unavailable", "El proveedor de pagos rechazó la solicitud de reembolso", 502);
  }

  const refundId = refundResult.refundId || `ref_${Date.now()}`;
  const now = FieldValue.serverTimestamp();

  // Actualización atómica en Cloud Firestore
  await db.runTransaction(async (transaction) => {
    // 1. Actualizar PaymentTransaction a REFUNDED
    transaction.update(txRef, {
      status: "REFUNDED",
      refundId,
      refundedAt: now,
      updatedAt: now
    });

    // 2. Si tiene holdId asociado, marcar refundStatus = COMPLETED en holds/{holdId}
    if (typeof txData.holdId === "string" && txData.holdId) {
      const holdRef = db.collection("holds").doc(txData.holdId);
      const holdSnap = await transaction.get(holdRef);
      if (holdSnap.exists) {
        transaction.update(holdRef, {
          refundStatus: "COMPLETED",
          refundId,
          refundedAt: now,
          updatedAt: now
        });
      }
    }

    // 3. Registrar asiento contable en financialRecords
    const finRef = db.collection("financialRecords").doc(sha256(refundId).slice(0, 48));
    transaction.set(finRef, {
      id: finRef.id,
      type: "REFUND",
      businessId: input.businessId,
      transactionId: input.transactionId,
      holdId: txData.holdId ?? null,
      amount: -Math.abs(Number(txData.amount || 0)),
      currency: txData.currency || "USD",
      refundId,
      reason: input.reason ?? null,
      createdAt: now
    });
  });

  // 4. Auditoría inmutable
  await writeAudit(
    "payment.refund_issued",
    "transaction",
    input.transactionId,
    {
      businessId: input.businessId,
      actorUid: uid,
      actorRole,
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      amount: txData.amount ?? 0,
      refundId,
      reason: input.reason ?? null
    }
  );

  return {
    success: true,
    replay: false,
    status: "REFUNDED",
    refundId
  };
}

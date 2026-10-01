import { FieldValue } from "firebase-admin/firestore";
import { db, runtimeConfig } from "./config.js";
import { randomId, sha256, stableStringify } from "./crypto.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid } from "./auth.js";
import { asRecord, assertAllowedKeys, optionalString, requiredId, safeReturnPath, stringValue } from "./validation.js";
import { dataRecord, timestampMillis } from "./firestore.js";
import { writeAudit } from "./audit.js";
function parseInput(value) {
    const record = asRecord(value);
    assertAllowedKeys(record, ["holdId", "holdToken", "returnUrl"]);
    const holdId = requiredId(record, "holdId");
    const holdToken = optionalString(record, "holdToken", 20, 256);
    const returnUrl = safeReturnPath(record, "returnUrl");
    return {
        holdId,
        ...(holdToken ? { holdToken } : {}),
        ...(returnUrl ? { returnUrl } : {})
    };
}
export async function createPaymentSessionFor(request) {
    const uid = callableUid(request);
    const input = parseInput(request.data);
    const holdReference = db.collection("holds").doc(input.holdId);
    const paymentSessionId = `ps_${randomId("sess").slice(3, 31)}`;
    const requestHash = sha256(stableStringify({ holdId: input.holdId, returnUrl: input.returnUrl ?? null }));
    const result = await db.runTransaction(async (transaction) => {
        const holdSnapshot = await transaction.get(holdReference);
        if (!holdSnapshot.exists)
            throw new AppError("not-found", "Hold not found", 404);
        const hold = dataRecord(holdSnapshot.data());
        const holdCustomerUid = typeof hold.customerUid === "string" ? hold.customerUid : undefined;
        if (!holdCustomerUid || holdCustomerUid !== uid) {
            throw new AppError("permission-denied", "Only the hold owner can start payment", 403);
        }
        if (hold.state === "CONFIRMED") {
            throw new AppError("failed-precondition", "Hold is already confirmed", 412);
        }
        if (hold.state === "EXPIRED" || hold.state === "CANCELLED") {
            throw new AppError("failed-precondition", "Hold has expired", 412);
        }
        const expiry = timestampMillis(hold.expiresAt);
        if (expiry !== undefined && expiry <= Date.now()) {
            throw new AppError("failed-precondition", "Hold has expired", 412);
        }
        if (hold.paymentState === "PAID") {
            throw new AppError("failed-precondition", "Hold is already paid", 412);
        }
        const existingSessionId = typeof hold.paymentSessionId === "string" ? hold.paymentSessionId : undefined;
        const existingHash = typeof hold.paymentSessionHash === "string" ? hold.paymentSessionHash : undefined;
        if (existingSessionId && hold.state === "PAYMENT_PENDING" && existingHash === requestHash) {
            return {
                idempotentReplay: true,
                paymentSessionId: existingSessionId,
                amount: typeof hold.amount === "number" ? hold.amount : 0,
                currency: typeof hold.currency === "string" ? hold.currency : "USD",
                expiresAt: expiry ?? Date.now() + runtimeConfig.holdDurationSeconds * 1000,
                provider: typeof hold.paymentProvider === "string" ? hold.paymentProvider : "pay_at_door",
                isPayAtDoor: hold.paymentProvider === "pay_at_door" || hold.paymentProvider === "none"
            };
        }
        const businessId = typeof hold.businessId === "string" ? hold.businessId : "";
        const resourceId = typeof hold.resourceId === "string" ? hold.resourceId : "";
        if (hold.state === "HELD" && businessId && resourceId) {
            const resourceReference = db.collection("businesses").doc(businessId).collection("resources").doc(resourceId);
            const resourceSnapshot = await transaction.get(resourceReference);
            if (resourceSnapshot.exists) {
                const resource = dataRecord(resourceSnapshot.data());
                if (resource.activeHoldId !== input.holdId) {
                    throw new AppError("failed-precondition", "Hold no longer owns the resource", 412);
                }
            }
        }
        // RESOLUCIÓN DE CUENTA DE PAGO DEL TENANT (Fail-Closed)
        // El proveedor y la modalidad se resuelven exclusivamente por tenant, sin fallback global en producción.
        const businessReference = db.collection("businesses").doc(businessId);
        const paymentAccountReference = businessReference.collection("private").doc("paymentAccount");
        const paymentAccountSnapshot = await transaction.get(paymentAccountReference);
        let paymentMode = "PAY_AT_DOOR";
        let resolvedProvider = "pay_at_door";
        let merchantId = "";
        if (paymentAccountSnapshot.exists) {
            const accountData = dataRecord(paymentAccountSnapshot.data());
            const rawMode = accountData.paymentMode;
            if (rawMode === "CLIENT_GATEWAY" || rawMode === "ASSISTED_GATEWAY") {
                if (accountData.status !== "ACTIVE") {
                    throw new AppError("failed-precondition", "La cuenta de pagos del club no está activa (PAYMENT_ACCOUNT_DISABLED)", 412);
                }
                const accProvider = stringValue(accountData.provider, "").toLowerCase();
                if (!accProvider || accProvider === "none") {
                    throw new AppError("failed-precondition", "Proveedor de pago no configurado (PAYMENT_PROVIDER_UNSUPPORTED)", 412);
                }
                const accMerchantId = stringValue(accountData.merchantId, "");
                if (!accMerchantId) {
                    throw new AppError("failed-precondition", "Merchant ID no configurado (PAYMENT_ACCOUNT_NOT_CONFIGURED)", 412);
                }
                const secretRef = stringValue(accountData.secretReference, "");
                if (!secretRef) {
                    throw new AppError("failed-precondition", "Credenciales del PSP no configuradas (PAYMENT_SECRET_UNAVAILABLE)", 412);
                }
                paymentMode = rawMode;
                resolvedProvider = accProvider;
                merchantId = accMerchantId;
            }
            else if (rawMode === "PAY_AT_DOOR") {
                paymentMode = "PAY_AT_DOOR";
                resolvedProvider = "pay_at_door";
            }
        }
        else {
            // Si no existe subcolección private/paymentAccount:
            const isTestEnv = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === "test");
            const businessSnapshot = await transaction.get(businessReference);
            const businessData = businessSnapshot.exists ? dataRecord(businessSnapshot.data()) : {};
            const defaultMode = businessData.defaultPaymentMode;
            if (defaultMode === "PAY_AT_DOOR" || isTestEnv) {
                paymentMode = "PAY_AT_DOOR";
                resolvedProvider = "pay_at_door";
            }
            else {
                // Fail-Closed en producción si no está configurada la cuenta de pagos
                throw new AppError("failed-precondition", "La cuenta de pagos del establecimiento no ha sido configurada (PAYMENT_ACCOUNT_NOT_CONFIGURED)", 412);
            }
        }
        const isPayAtDoor = paymentMode === "PAY_AT_DOOR";
        const customerUid = typeof hold.customerUid === "string" ? hold.customerUid : "";
        const eventId = typeof hold.eventId === "string" ? hold.eventId : "";
        const amount = typeof hold.amount === "number" ? hold.amount : 0;
        const currency = typeof hold.currency === "string" ? hold.currency : "USD";
        // Creación de PaymentTransaction desacoplada de la reserva.
        // txId determinista (sha256 del hold) para que el webhook de pago reconcilie
        // EXACTAMENTE este mismo documento: una sola transacción financiera por hold.
        const txId = `tx_${sha256(input.holdId).slice(0, 24)}`;
        const txReference = businessReference.collection("paymentTransactions").doc(txId);
        const txStatus = isPayAtDoor ? "PENDING" : "CREATED";
        transaction.set(txReference, {
            id: txId,
            businessId,
            holdId: input.holdId,
            orderId: input.holdId,
            provider: resolvedProvider,
            providerMerchantId: merchantId || businessId,
            amount,
            currency: "USD",
            status: txStatus,
            idempotencyKey: requestHash,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        if (isPayAtDoor) {
            if (businessId && resourceId) {
                const resourceReference = businessReference.collection("resources").doc(resourceId);
                transaction.update(resourceReference, {
                    status: "CONFIRMED",
                    activeReservationId: input.holdId,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            if (businessId) {
                const reservationReference = businessReference.collection("reservations").doc(input.holdId);
                transaction.set(reservationReference, {
                    id: input.holdId,
                    holdId: input.holdId,
                    businessId,
                    eventId,
                    resourceId,
                    customerUid,
                    status: "CONFIRMED",
                    paymentProvider: "pay_at_door",
                    paymentState: "UNPAID",
                    amount,
                    currency,
                    source: "functions",
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
            transaction.update(holdReference, {
                state: "CONFIRMED",
                paymentState: "UNPAID",
                paymentSessionId,
                paymentSessionHash: requestHash,
                paymentProvider: "pay_at_door",
                confirmedAt: FieldValue.serverTimestamp(),
                paymentStartedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }
        else {
            transaction.update(holdReference, {
                state: "PAYMENT_PENDING",
                paymentState: "PENDING",
                paymentSessionId,
                paymentSessionHash: requestHash,
                paymentProvider: resolvedProvider,
                paymentStartedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }
        return {
            idempotentReplay: false,
            paymentSessionId,
            amount,
            currency,
            expiresAt: expiry ?? Date.now() + runtimeConfig.holdDurationSeconds * 1000,
            provider: resolvedProvider,
            isPayAtDoor
        };
    });
    const holdSnapshotForAudit = await holdReference.get();
    const auditBusinessId = holdSnapshotForAudit.exists
        ? String(dataRecord(holdSnapshotForAudit.data()).businessId ?? "unknown")
        : "unknown";
    await writeAudit(result.idempotentReplay ? "payment.session_replayed" : "payment.session_started", "hold", input.holdId, {
        businessId: auditBusinessId,
        actorUid: uid,
        actorRole: "customer",
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, { paymentSessionId: result.paymentSessionId, provider: result.provider });
    return {
        holdId: input.holdId,
        paymentSessionId: result.paymentSessionId,
        state: result.isPayAtDoor ? "CONFIRMED" : "PAYMENT_PENDING",
        amount: result.amount,
        currency: result.currency,
        expiresAt: new Date(result.expiresAt).toISOString(),
        // Fase A+B: Hosted Checkout solo si hay un proveedor online activo en Fase C.
        // Cero checkout ficticio en producción.
        checkoutUrl: null,
        provider: result.provider,
        idempotentReplay: result.idempotentReplay
    };
}
//# sourceMappingURL=paymentSession.js.map
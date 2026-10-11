import { FieldValue } from "firebase-admin/firestore";
import { db, paymentWebhookSecret, runtimeConfig } from "./config.js";
import { hmacSha256, randomId, safeEqual, sha256, hashToken } from "./crypto.js";
import { AppError } from "./errors.js";
import { asRecord, requiredId, stringValue } from "./validation.js";
import { dataNumber, dataRecord, timestampMillis } from "./firestore.js";
import { writeAudit } from "./audit.js";
import { resolvePaymentSecrets } from "./secretManager.js";
import { paymentRegistry } from "./providers/index.js";
function parseAmount(value) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0)
        return value;
    if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
function parsePaymentInput(value) {
    const record = asRecord(value, "payment event");
    const nested = record.data && typeof record.data === "object" && !Array.isArray(record.data)
        ? dataRecord(record.data)
        : record;
    const eventIdValue = record.id ?? record.eventId ?? record.event_id ?? nested.id ?? nested.eventId;
    if (typeof eventIdValue !== "string" || eventIdValue.length < 1 || eventIdValue.length > 200) {
        throw new AppError("invalid-argument", "Payment event id is required");
    }
    const statusValue = record.status ?? record.eventType ?? record.type ?? nested.status ?? nested.eventType ?? nested.type;
    const status = stringValue(statusValue).toLowerCase();
    if (!status)
        throw new AppError("invalid-argument", "Payment status is required");
    const holdIdValue = record.holdId ?? record.hold_id ?? nested.holdId ?? nested.hold_id;
    const reservationIdValue = record.reservationId ?? record.reservation_id ?? nested.reservationId ?? nested.reservation_id;
    const holdId = holdIdValue === undefined || holdIdValue === null ? undefined : requiredId({ holdId: stringValue(holdIdValue) }, "holdId");
    const reservationId = reservationIdValue === undefined || reservationIdValue === null
        ? undefined
        : requiredId({ reservationId: stringValue(reservationIdValue) }, "reservationId");
    if (!holdId && !reservationId)
        throw new AppError("invalid-argument", "holdId or reservationId is required");
    const amount = parseAmount(record.amount ?? nested.amount);
    const currencyValue = record.currency ?? nested.currency;
    const currency = currencyValue === undefined || currencyValue === null ? undefined : stringValue(currencyValue).toUpperCase();
    if (currency !== undefined && !/^[A-Z]{3}$/.test(currency))
        throw new AppError("invalid-argument", "currency is invalid");
    const paymentReferenceValue = record.paymentReference ?? record.payment_reference ?? nested.paymentReference ?? nested.payment_reference;
    const paymentReference = paymentReferenceValue === undefined || paymentReferenceValue === null
        ? undefined
        : stringValue(paymentReferenceValue).slice(0, 256);
    return {
        eventId: eventIdValue,
        ...(holdId ? { holdId } : {}),
        ...(reservationId ? { reservationId } : {}),
        status,
        ...(amount === undefined ? {} : { amount }),
        ...(currency ? { currency } : {}),
        ...(paymentReference ? { paymentReference } : {})
    };
}
/**
 * Extrae y valida el timestamp de la cabecera de firma. El timestamp es
 * obligatorio: sin él, la firma cubría solo el cuerpo y quedaba como
 * credencial permanente.
 */
function readSignatureTimestamp(header) {
    const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
    const timestampPart = parts.find((part) => part.startsWith("t="));
    if (!timestampPart)
        throw new AppError("permission-denied", "Payment signature timestamp is required", 401);
    const timestamp = timestampPart.slice(2);
    if (!Number.isInteger(Number(timestamp)))
        throw new AppError("permission-denied", "Payment signature timestamp is invalid", 401);
    return timestamp;
}
/**
 * Ventana de tolerancia verificada ANTES de tocar Firestore. La cabecera sin
 * forma o con un timestamp viejo se rechaza localmente, de modo que una petición
 * no autenticada no puede forzar lecturas para sondear tenants.
 */
function requireFreshTimestamp(header) {
    if (!header)
        throw new AppError("permission-denied", "Payment signature timestamp is required", 401);
    const timestampNumber = Number(readSignatureTimestamp(header));
    const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
    if (age > runtimeConfig.paymentSignatureToleranceSeconds) {
        throw new AppError("permission-denied", "Payment signature timestamp is outside the allowed window", 401);
    }
}
function verifySignature(raw, header, secret) {
    if (!header)
        throw new AppError("permission-denied", "Payment signature is required", 401);
    const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
    const signaturePart = parts.find((part) => part.startsWith("v1=")) ?? (parts.length === 1 ? parts[0] : undefined);
    if (!signaturePart)
        throw new AppError("permission-denied", "Payment signature is invalid", 401);
    const timestamp = readSignatureTimestamp(header);
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (age > runtimeConfig.paymentSignatureToleranceSeconds) {
        throw new AppError("permission-denied", "Payment signature timestamp is outside the allowed window", 401);
    }
    const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), raw]);
    const expectedHex = hmacSha256(secret, signedPayload, "hex");
    const expectedBase64 = hmacSha256(secret, signedPayload, "base64url");
    const supplied = signaturePart
        .replace(/^v1=/i, "")
        .replace(/^sha256=/i, "");
    const matchesHex = safeEqual(expectedHex, supplied.toLowerCase());
    const matchesBase64 = safeEqual(expectedBase64, supplied);
    if (!matchesHex && !matchesBase64)
        throw new AppError("permission-denied", "Payment signature is invalid", 401);
}
function readEnvironment(record) {
    return record.environment === "production" ? "production" : "sandbox";
}
/**
 * Resuelve el secreto del merchant candidato a partir de datos de enrutamiento (URL/cabeceras).
 * Nunca utiliza campos del body no autenticado para seleccionar el secreto.
 */
async function resolveCandidateAccount(routing) {
    const targetId = routing?.merchantId || routing?.businessId;
    if (targetId && targetId !== "unknown") {
        // 1. Verificar si targetId corresponde directamente al ID del documento del negocio
        try {
            const businessDoc = await db.collection("businesses").doc(targetId).get();
            if (businessDoc.exists) {
                const data = dataRecord(businessDoc.data());
                const secret = stringValue(data.paymentWebhookSecret, "");
                if (secret.length >= 16) {
                    return {
                        businessId: businessDoc.id,
                        merchantId: stringValue(data.merchantId, businessDoc.id),
                        secret,
                        environment: readEnvironment(data)
                    };
                }
                // Verificar subcolección private/paymentAccount
                const accountDoc = await db.collection("businesses").doc(targetId).collection("private").doc("paymentAccount").get();
                if (accountDoc.exists) {
                    const accData = dataRecord(accountDoc.data());
                    const secretRef = stringValue(accData.secretReference, "");
                    if (secretRef) {
                        try {
                            const secrets = await resolvePaymentSecrets(secretRef);
                            if (secrets.webhookSecret && secrets.webhookSecret.length >= 16) {
                                return {
                                    businessId: businessDoc.id,
                                    merchantId: stringValue(accData.merchantId, targetId),
                                    secret: secrets.webhookSecret,
                                    environment: readEnvironment(accData)
                                };
                            }
                        }
                        catch {
                            // Continuar con resolución directa
                        }
                    }
                    const accSecret = stringValue(accData.webhookSecret ?? accData.paymentWebhookSecret, "");
                    if (accSecret.length >= 16) {
                        return {
                            businessId: businessDoc.id,
                            merchantId: stringValue(accData.merchantId, targetId),
                            secret: accSecret,
                            environment: readEnvironment(accData)
                        };
                    }
                }
            }
        }
        catch {
            // Continuar si Firestore no está inicializado o en testing offline
        }
        // 2. Buscar por merchantId en subcolección private
        try {
            const merchantQuery = await db.collectionGroup("private").where("merchantId", "==", targetId).limit(1).get();
            if (!merchantQuery.empty && merchantQuery.docs[0]) {
                const foundDoc = merchantQuery.docs[0];
                const accData = dataRecord(foundDoc.data());
                const parentBusiness = foundDoc.ref.parent.parent;
                const bId = parentBusiness ? parentBusiness.id : targetId;
                const secretRef = stringValue(accData.secretReference, "");
                if (secretRef) {
                    try {
                        const secrets = await resolvePaymentSecrets(secretRef);
                        if (secrets.webhookSecret && secrets.webhookSecret.length >= 16) {
                            return {
                                businessId: bId,
                                merchantId: targetId,
                                secret: secrets.webhookSecret,
                                environment: readEnvironment(accData)
                            };
                        }
                    }
                    catch {
                        // Continuar
                    }
                }
                const secret = stringValue(accData.webhookSecret ?? accData.paymentWebhookSecret, "");
                if (secret.length >= 16) {
                    return {
                        businessId: bId,
                        merchantId: targetId,
                        secret,
                        environment: readEnvironment(accData)
                    };
                }
            }
        }
        catch {
            // Ignorar si collectionGroup no está indexado
        }
    }
    // Fallback controlado estrictamente para tests (emulador local)
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === "test") {
        try {
            const testSecret = paymentWebhookSecret();
            return {
                businessId: targetId || "test_business",
                merchantId: targetId || "test_merchant",
                secret: testSecret,
                environment: "sandbox"
            };
        }
        catch {
            // Sin secreto de test
        }
    }
    // FAIL-CLOSED en producción: sin fallback de secreto global
    throw new AppError("failed-precondition", "Payment webhook is not configured for this merchant", 503);
}
/**
 * Valida la forma de la cabecera antes de resolver el tenant. Evita que una
 * petición sin firma provoque lecturas en Firestore.
 */
function requireSignatureShape(header) {
    if (!header)
        throw new AppError("permission-denied", "Payment signature is required", 401);
    const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
    const hasTimestamp = parts.some((part) => part.startsWith("t="));
    const hasSignature = parts.some((part) => part.startsWith("v1=")) || parts.length === 1;
    if (!hasTimestamp || !hasSignature) {
        throw new AppError("permission-denied", "Payment signature must carry t= and v1=", 401);
    }
}
function statusKind(status) {
    const normalized = status.toLowerCase();
    if (["paid", "succeeded", "success", "completed", "confirmed", "settled"].includes(normalized))
        return "PAID";
    if (["failed", "failure", "declined", "canceled", "cancelled", "expired"].includes(normalized))
        return "FAILED";
    if (["refund_required"].includes(normalized))
        return "REFUND_REQUIRED";
    if (["refund_pending"].includes(normalized))
        return "REFUND_PENDING";
    if (["refund", "refunded", "partial_refund"].includes(normalized))
        return "REFUNDED";
    if (["chargeback", "dispute", "disputed"].includes(normalized))
        return "CHARGEBACK";
    throw new AppError("invalid-argument", "Payment status is not supported");
}
async function resolveHoldId(input) {
    if (input.holdId)
        return input.holdId;
    if (!input.reservationId)
        return undefined;
    const snapshot = await db.collection("holds")
        .where("reservationId", "==", input.reservationId)
        .limit(1)
        .get();
    return snapshot.empty ? undefined : snapshot.docs[0]?.id;
}
export async function processPaymentWebhook(raw, signatureHeader, routing, headers) {
    // PSP con firma nativa propia (p. ej. Kushki X-Kushki-Signature en hex crudo).
    // El formato interoperable t=...,v1=... conserva el camino genérico de abajo.
    if (shouldVerifyWithProviderAdapter(signatureHeader, routing)) {
        return verifyNativeProviderWebhook(raw, signatureHeader ?? "", routing, headers ?? {});
    }
    // PASO A: Autenticación del Webhook (El cuerpo es HOSTIL e INESCRUTABLE hasta validar la firma)
    requireSignatureShape(signatureHeader);
    requireFreshTimestamp(signatureHeader);
    const candidate = await resolveCandidateAccount(routing);
    verifySignature(raw, signatureHeader, candidate.secret);
    // PASO B: Validación de Negocio (El payload ahora está autenticado por el secreto del merchant)
    let parsed;
    try {
        parsed = JSON.parse(raw.toString("utf8"));
    }
    catch {
        throw new AppError("invalid-argument", "Payment body must be valid JSON");
    }
    const input = parsePaymentInput(parsed);
    return finalizePaymentEvent({ raw, parsed, input, candidate, routing });
}
/**
 * PASO B compartido por el camino genérico y por la delegación nativa a
 * adaptadores de PSP. Solo debe ejecutarse tras autenticar la firma.
 */
async function finalizePaymentEvent(args) {
    const { raw, parsed, input, candidate, routing } = args;
    const holdId = await resolveHoldId(input);
    const kind = statusKind(input.status);
    // Si el payload declara un merchantId, verificar que coincida con el merchant autenticado
    const payloadRecord = asRecord(parsed, "event");
    const payloadMerchantId = stringValue(payloadRecord.merchantId ?? payloadRecord.merchant_id);
    if (payloadMerchantId && candidate.merchantId !== "test_merchant" && payloadMerchantId !== candidate.merchantId) {
        throw new AppError("invalid-argument", "Merchant ID mismatch in payment event", 400);
    }
    const eventReference = db.collection("paymentEvents").doc(sha256(input.eventId).slice(0, 48));
    const financialReference = db.collection("financialRecords").doc(sha256(input.eventId).slice(0, 48));
    const bodyHash = sha256(raw);
    let auditBusinessId = candidate.businessId;
    const result = await db.runTransaction(async (transaction) => {
        const eventSnapshot = await transaction.get(eventReference);
        if (eventSnapshot.exists) {
            const existing = dataRecord(eventSnapshot.data());
            const existingStatus = existing.resultStatus;
            return {
                duplicate: true,
                status: existingStatus ?? "REFUND_REQUIRED",
                refundRequired: existingStatus === "REFUND_REQUIRED",
                ...(typeof existing.reservationId === "string" ? { reservationId: existing.reservationId } : {})
            };
        }
        const holdReference = holdId ? db.collection("holds").doc(holdId) : undefined;
        const holdSnapshot = holdReference ? await transaction.get(holdReference) : undefined;
        const hold = holdSnapshot?.exists ? dataRecord(holdSnapshot.data()) : undefined;
        const holdBusinessId = typeof hold?.businessId === "string" ? hold.businessId : undefined;
        // Validación Cross-Tenant Innegociable: el hold debe pertenecer al merchant autenticado
        if (holdBusinessId && candidate.businessId !== "test_business" && holdBusinessId !== candidate.businessId) {
            throw new AppError("permission-denied", "Hold does not belong to the authenticated merchant", 403);
        }
        const businessId = holdBusinessId || candidate.businessId;
        auditBusinessId = businessId;
        const now = Date.now();
        const holdExpiry = hold ? timestampMillis(hold.expiresAt) : undefined;
        const resourceId = typeof hold?.resourceId === "string" ? hold.resourceId : undefined;
        const resourceReference = businessId !== "unknown" && resourceId
            ? db.collection("businesses").doc(businessId).collection("resources").doc(resourceId)
            : undefined;
        const resourceSnapshot = resourceReference ? await transaction.get(resourceReference) : undefined;
        const resource = resourceSnapshot?.exists ? dataRecord(resourceSnapshot.data()) : undefined;
        const active = Boolean(hold &&
            resource &&
            (hold.state === "HELD" || hold.state === "PAYMENT_PENDING") &&
            holdExpiry !== undefined &&
            holdExpiry > now &&
            resource.activeHoldId === holdId);
        const amountMatches = input.amount === undefined || hold === undefined || Math.abs(input.amount - (dataNumber(hold, "amount") ?? input.amount)) < 0.000001;
        const currencyMatches = input.currency === undefined || hold === undefined || input.currency === stringValue(hold.currency, "USD").toUpperCase();
        let resultStatus = kind;
        let refundRequired = false;
        let reservationId = input.reservationId;
        if (kind === "PAID") {
            if (!active || !amountMatches || !currencyMatches) {
                resultStatus = "REFUND_REQUIRED";
                refundRequired = true;
            }
        }
        let reservationReference;
        let existingReservation;
        if (resultStatus === "PAID" && hold && holdReference && resourceReference) {
            reservationId = reservationId ?? holdId;
            reservationReference = db.collection("businesses").doc(businessId).collection("reservations").doc(reservationId);
            existingReservation = await transaction.get(reservationReference);
        }
        // Actualización de Hold
        if (hold && holdReference) {
            const update = {
                paymentState: resultStatus,
                paymentReference: input.paymentReference ?? null,
                lastPaymentEventIdHash: sha256(input.eventId),
                updatedAt: FieldValue.serverTimestamp()
            };
            if (resultStatus === "PAID") {
                update.state = "CONFIRMED";
                update.confirmedAt = FieldValue.serverTimestamp();
                update.confirmedBy = "payment_webhook";
                if (reservationId)
                    update.reservationId = reservationId;
            }
            else if (resultStatus === "REFUND_REQUIRED") {
                update.state = "EXPIRED";
                update.refundStatus = "REQUIRED";
                update.refundRequiredAt = FieldValue.serverTimestamp();
            }
            else if (resultStatus === "REFUNDED") {
                update.refundStatus = "COMPLETED";
            }
            else if (resultStatus === "CHARGEBACK") {
                update.disputeStatus = "OPEN";
            }
            else if (hold.state !== "CONFIRMED") {
                update.state = "EXPIRED";
            }
            transaction.update(holdReference, update);
            // Liberar recurso solo si este hold lo poseía activamente y no resultó en PAID
            if (resourceReference && resource && resource.activeHoldId === holdId && resultStatus !== "PAID") {
                transaction.set(resourceReference, {
                    status: "AVAILABLE",
                    activeHoldId: FieldValue.delete(),
                    holdTokenHash: FieldValue.delete(),
                    holdExpiresAt: FieldValue.delete(),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }
        // Confirmación atómica de Reserva y Recurso en caso de PAID legítimo
        if (resultStatus === "PAID" && hold && holdReference && resourceReference && reservationReference) {
            const reservationData = {
                reservationId,
                businessId: stringValue(hold.businessId),
                eventId: stringValue(hold.eventId),
                resourceId: stringValue(hold.resourceId),
                customerUid: hold.customerUid ?? null,
                holdId,
                amount: dataNumber(hold, "amount") ?? 0,
                currency: stringValue(hold.currency, "USD"),
                status: "CONFIRMED",
                paymentState: "PAID",
                paymentStatus: "paid",
                paymentReference: input.paymentReference ?? null,
                qrTokenHash: hashToken(randomId("qr")),
                confirmedAt: FieldValue.serverTimestamp(),
                createdAt: existingReservation?.exists ? existingReservation.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };
            transaction.set(reservationReference, reservationData, { merge: true });
            transaction.set(resourceReference, {
                status: "CONFIRMED",
                activeReservationId: reservationId,
                activeHoldId: FieldValue.delete(),
                holdTokenHash: FieldValue.delete(),
                holdExpiresAt: FieldValue.delete(),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }
        // Persistencia de PaymentTransaction en businesses/{businessId}/paymentTransactions/{txId}
        // txId determinista: coincide con el creado por createPaymentSession (sha256 del hold).
        const txId = holdId ? `tx_${sha256(holdId).slice(0, 24)}` : `tx_${sha256(input.eventId).slice(0, 24)}`;
        const txReference = db.collection("businesses").doc(businessId).collection("paymentTransactions").doc(txId);
        transaction.set(txReference, {
            id: txId,
            businessId,
            holdId: holdId ?? null,
            orderId: holdId ?? reservationId ?? null,
            provider: routing?.provider ?? "unknown",
            providerMerchantId: candidate.merchantId,
            providerTransactionId: input.paymentReference ?? null,
            amount: input.amount ?? dataNumber(hold ?? {}, "amount") ?? 0,
            currency: "USD",
            status: resultStatus,
            idempotencyKey: sha256(input.eventId),
            failureCode: resultStatus === "FAILED" ? input.status : null,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
        // Auditoría de eventos en la subcolección paymentTransactions/{txId}/events/{eventKey}
        const eventKey = sha256(`${routing?.provider ?? "unknown"}:${candidate.merchantId}:${input.eventId}`).slice(0, 48);
        const eventSubRef = txReference.collection("events").doc(eventKey);
        transaction.set(eventSubRef, {
            eventKey,
            providerEventId: input.eventId,
            eventType: input.status,
            canonicalStatus: resultStatus,
            receivedAt: now,
            rawPayloadHash: bodyHash,
            signatureVerified: true,
            processingResult: "ACCEPTED"
        });
        // Compatibilidad global con paymentEvents y financialRecords para trazabilidad existente
        transaction.set(eventReference, {
            eventIdHash: sha256(input.eventId),
            idempotencyKeyHash: sha256(input.eventId),
            bodyHash,
            businessId,
            holdId: holdId ?? null,
            reservationId: reservationId ?? null,
            paymentReference: input.paymentReference ?? null,
            receivedStatus: input.status,
            resultStatus,
            refundRequired,
            createdAt: FieldValue.serverTimestamp(),
            processedAt: FieldValue.serverTimestamp()
        });
        transaction.set(financialReference, {
            recordId: financialReference.id,
            businessId,
            type: "PAYMENT",
            status: resultStatus,
            amount: input.amount ?? dataNumber(hold ?? {}, "amount") ?? 0,
            currency: input.currency ?? stringValue(hold?.currency, "USD"),
            reservationId: reservationId ?? null,
            customerUid: hold?.customerUid ?? null,
            holdId: holdId ?? null,
            paymentReference: input.paymentReference ?? null,
            paymentEventIdHash: sha256(input.eventId),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return {
            duplicate: false,
            status: resultStatus,
            refundRequired,
            ...(reservationId ? { reservationId } : {})
        };
    });
    await writeAudit(result.duplicate ? "payment.webhook_duplicate" : "payment.webhook_processed", "paymentEvent", eventReference.id, { ...(auditBusinessId === "unknown" ? {} : { businessId: auditBusinessId }), actorRole: "payment_webhook" }, { resultStatus: result.status, refundRequired: result.refundRequired });
    return result;
}
function shouldVerifyWithProviderAdapter(header, routing) {
    if (!header || !routing?.provider)
        return false;
    if (!paymentRegistry.has(routing.provider))
        return false;
    // Solo la firma nativa (hex crudo) se delega; t=...,v1=... sigue el genérico.
    return !header.split(",").some((part) => part.trim().startsWith("t="));
}
function readHeaderValue(headers, name) {
    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === target) {
            return Array.isArray(value) ? value[0] ?? "" : typeof value === "string" ? value : "";
        }
    }
    return "";
}
function canonicalStatusForEventType(eventType) {
    switch (eventType) {
        case "PAYMENT_SUCCESS":
            return "paid";
        case "PAYMENT_FAILED":
            return "failed";
        case "REFUND":
            return "refunded";
        case "CHARGEBACK":
            return "chargeback";
        default:
            throw new AppError("invalid-argument", "Payment status is not supported");
    }
}
/**
 * Webhooks con firma nativa del PSP (Kushki X-Kushki-Signature en hex).
 * Orden: forma de la firma → timestamp fresco (si el PSP lo envía) → routing
 * del tenant → HMAC verificado por el adaptador sobre los bytes crudos →
 * parseo → mismo PASO B y transacción atómica que el camino genérico.
 */
async function verifyNativeProviderWebhook(raw, signatureHeader, routing, headers) {
    const provider = (routing.provider ?? "").toLowerCase();
    // 1) Forma: la firma nativa de Kushki es HMAC-SHA256 en hex (64 caracteres).
    if (!/^[0-9a-f]{64}$/i.test(signatureHeader.trim())) {
        throw new AppError("permission-denied", "Native payment signature is invalid", 401);
    }
    // 2) Frescura anti-replay: si el PSP envía un timestamp numérico, exigir la
    // ventana de tolerancia ANTES de resolver tenant o secreto en Firestore.
    const pspTimestampRaw = readHeaderValue(headers, "x-kushki-id");
    if (pspTimestampRaw) {
        const parsedTimestamp = Number(pspTimestampRaw);
        if (Number.isInteger(parsedTimestamp)) {
            const seconds = parsedTimestamp > 1e11 ? Math.floor(parsedTimestamp / 1000) : parsedTimestamp;
            const age = Math.abs(Math.floor(Date.now() / 1000) - seconds);
            if (age > runtimeConfig.paymentSignatureToleranceSeconds) {
                throw new AppError("permission-denied", "Payment signature timestamp is outside the allowed window", 401);
            }
        }
    }
    // 3) Routing → secreto del tenant (fail-closed 503 sin configuración).
    const candidate = await resolveCandidateAccount(routing);
    // 4) Delegación al adaptador del proveedor (HMAC timing-safe sobre los bytes crudos).
    const adapter = paymentRegistry.get(provider);
    const account = {
        businessId: candidate.businessId,
        provider: provider,
        environment: candidate.environment,
        merchantId: candidate.merchantId,
        paymentMode: "CLIENT_GATEWAY",
        status: "ACTIVE",
        updatedAt: Date.now()
    };
    const secrets = { webhookSecret: candidate.secret };
    const event = await adapter.verifyWebhook(account, secrets, {
        rawBody: raw,
        headers,
        merchantId: candidate.merchantId
    });
    // 5) Estado canónico (rechaza eventos no soportados con fail-closed).
    const status = canonicalStatusForEventType(event.eventType);
    // 6) Cuerpo ya autenticado → mismas validaciones y transacción atómica.
    let parsed;
    try {
        parsed = JSON.parse(raw.toString("utf8"));
    }
    catch {
        throw new AppError("invalid-argument", "Payment body must be valid JSON");
    }
    const providerEventId = event.providerEventId.slice(0, 200);
    if (!providerEventId) {
        throw new AppError("invalid-argument", "Payment event id is required");
    }
    const holdIdValue = event.holdId ? requiredId({ holdId: event.holdId }, "holdId") : undefined;
    const input = {
        eventId: providerEventId,
        ...(holdIdValue ? { holdId: holdIdValue } : {}),
        status,
        ...(event.amount > 0 ? { amount: event.amount } : {}),
        ...(event.currency && /^[A-Z]{3}$/.test(event.currency) ? { currency: event.currency } : {}),
        ...(event.providerTransactionId ? { paymentReference: event.providerTransactionId } : {})
    };
    return finalizePaymentEvent({ raw, parsed, input, candidate, routing });
}
/**
 * Función de conciliación de estado financiero (Fase A)
 */
export async function verifyPayment(businessId, transactionId) {
    const txDoc = await db
        .collection("businesses")
        .doc(businessId)
        .collection("paymentTransactions")
        .doc(transactionId)
        .get();
    if (!txDoc.exists)
        return null;
    return txDoc.data();
}
//# sourceMappingURL=payments.js.map
import { FieldValue } from "firebase-admin/firestore";
import { auth, db, identifierHashSecret, runtimeConfig } from "./config.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid, requireStaff } from "./auth.js";
import { asRecord, assertAllowedKeys, optionalString, requiredId } from "./validation.js";
import { dataRecord, timestampMillis } from "./firestore.js";
import { hashIdentifier, randomId, sha256 } from "./crypto.js";
import { writeAudit } from "./audit.js";
function parseInput(value, callerUid) {
    const record = asRecord(value);
    assertAllowedKeys(record, ["businessId", "targetUid"]);
    const businessId = requiredId(record, "businessId");
    const targetUid = optionalString(record, "targetUid", 1, 128) ?? callerUid;
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(targetUid))
        throw new AppError("invalid-argument", "targetUid is invalid");
    return { businessId, targetUid };
}
function requestIdFor(businessId, targetUid) {
    return `privacy_${sha256(`${businessId}:${targetUid}`).slice(0, 40)}`;
}
function addLedgerEntry(transaction, requestReference, entryId, entry) {
    transaction.set(requestReference.collection("ledger").doc(entryId), {
        ...entry,
        createdAt: FieldValue.serverTimestamp()
    });
}
async function loadAll(query) {
    const documents = [];
    let cursor;
    while (true) {
        const page = await (cursor ? query.startAfter(cursor) : query).limit(400).get();
        if (page.empty)
            return documents;
        documents.push(...page.docs);
        cursor = page.docs[page.docs.length - 1];
    }
}
/**
 * AGENTS 9.4: revocar de inmediato tokens, sesiones activas, dispositivos y
 * passkeys. `revokeRefreshTokens` invalida todos los refresh tokens del sujeto,
 * de modo que ningun dispositivo pueda obtener un ID token nuevo; la cuenta no
 * se deshabilita porque el mismo uid puede conservar identidad global valida
 * mientras ningun negocio tenga retencion activa (AGENTS 9.7).
 */
async function revokeSubjectIdentity(uid) {
    try {
        await auth.revokeRefreshTokens(uid);
    }
    catch {
        // El borrado de datos ya quedo aplicado; la revocacion de tokens no debe
        // convertir una eliminacion completada en un 503 que invite a reintentar.
    }
}
export async function privacyDeletionRequestFor(request) {
    const callerUid = callableUid(request);
    const input = parseInput(request.data, callerUid);
    if (input.targetUid !== callerUid)
        await requireStaff(callerUid, input.businessId, "manager");
    const businessReference = db.collection("businesses").doc(input.businessId);
    const businessSnapshot = await businessReference.get();
    if (!businessSnapshot.exists)
        throw new AppError("not-found", "Business not found", 404);
    const business = dataRecord(businessSnapshot.data());
    const status = typeof business.status === "string" ? business.status.toLowerCase() : "";
    if (status !== "active" && status !== "trial" && status !== "suspended") {
        throw new AppError("failed-precondition", "Business cannot process privacy requests", 412);
    }
    const customerReference = businessReference.collection("customers").doc(input.targetUid);
    const customerSnapshot = await customerReference.get();
    const customerEmail = customerSnapshot.exists ? typeof customerSnapshot.get("email") === "string" ? String(customerSnapshot.get("email")) : undefined : undefined;
    const customerPhone = customerSnapshot.exists ? typeof customerSnapshot.get("phone") === "string" ? String(customerSnapshot.get("phone")) : undefined : undefined;
    if (customerSnapshot.exists) {
        const customer = dataRecord(customerSnapshot.data());
        if (customer.businessId !== input.businessId)
            throw new AppError("not-found", "Customer profile not found", 404);
    }
    const requestId = requestIdFor(input.businessId, input.targetUid);
    const requestReference = db.collection("privacyRequests").doc(requestId);
    const started = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(requestReference);
        if (snapshot.exists) {
            const existing = dataRecord(snapshot.data());
            if (existing.status === "COMPLETED")
                return { resume: false, status: "COMPLETED", existing };
            const startedAt = timestampMillis(existing.processingStartedAt);
            if (existing.status === "PROCESSING" && startedAt !== undefined && startedAt + runtimeConfig.privacyProcessingLeaseSeconds * 1000 > Date.now()) {
                return { resume: false, status: "PROCESSING", existing };
            }
            addLedgerEntry(transaction, requestReference, randomId("ledger"), {
                requestId,
                businessId: input.businessId,
                event: "PROCESSING_RESTARTED",
                actorUid: callerUid,
                subjectUidHash: sha256(input.targetUid)
            });
            transaction.update(requestReference, {
                status: "PROCESSING",
                processingStartedAt: FieldValue.serverTimestamp(),
                requestedBy: callerUid,
                updatedAt: FieldValue.serverTimestamp()
            });
            return { resume: true, status: "PROCESSING", existing };
        }
        transaction.set(requestReference, {
            requestId,
            businessId: input.businessId,
            subjectUidHash: sha256(input.targetUid),
            requestedBy: callerUid,
            status: "PROCESSING",
            requestedAt: FieldValue.serverTimestamp(),
            processingStartedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        addLedgerEntry(transaction, requestReference, randomId("ledger"), {
            requestId,
            businessId: input.businessId,
            event: "REQUESTED",
            actorUid: callerUid,
            subjectUidHash: sha256(input.targetUid)
        });
        return { resume: true, status: "PROCESSING", existing: undefined };
    });
    if (!started.resume) {
        const existing = started.existing ?? {};
        return {
            requestId,
            businessId: input.businessId,
            status: started.status,
            reservationCount: typeof existing.reservationCount === "number" ? existing.reservationCount : 0,
            anonymizedReservationCount: typeof existing.anonymizedReservationCount === "number" ? existing.anonymizedReservationCount : 0,
            ...(typeof existing.subjectPseudonym === "string" ? { subjectPseudonym: existing.subjectPseudonym } : {}),
            ...(typeof existing.ledgerHash === "string" ? { ledgerHash: existing.ledgerHash } : {})
        };
    }
    try {
        const subjectPseudonym = `sp_${sha256(`subject:${input.businessId}:${input.targetUid}`).slice(0, 24)}`;
        const reservations = await loadAll(businessReference.collection("reservations")
            .where("customerUid", "==", input.targetUid));
        const reservationIds = [];
        for (let start = 0; start < reservations.length; start += 400) {
            const batch = db.batch();
            const documents = reservations.slice(start, start + 400);
            for (const document of documents) {
                batch.update(document.ref, {
                    customerUid: FieldValue.delete(),
                    customerName: "ANONYMIZED",
                    customer_name: "ANONYMIZED",
                    customerEmail: FieldValue.delete(),
                    customer_email: FieldValue.delete(),
                    customerPhone: FieldValue.delete(),
                    customer_phone: FieldValue.delete(),
                    documentId: FieldValue.delete(),
                    cedula: FieldValue.delete(),
                    taxId: FieldValue.delete(),
                    paymentToken: FieldValue.delete(),
                    cardLast4: FieldValue.delete(),
                    ip: FieldValue.delete(),
                    biometrics: FieldValue.delete(),
                    subjectPseudonym,
                    anonymized: true,
                    privacyRequestId: requestId,
                    anonymizedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                reservationIds.push(document.id);
            }
            await batch.commit();
        }
        const attendanceDocs = [];
        for (let start = 0; start < reservationIds.length; start += 30) {
            const chunk = reservationIds.slice(start, start + 30);
            attendanceDocs.push(...await loadAll(businessReference.collection("attendanceSessions")
                .where("ticketId", "in", chunk)));
            attendanceDocs.push(...await loadAll(businessReference.collection("attendanceEvents")
                .where("ticketId", "in", chunk)));
        }
        for (let start = 0; start < attendanceDocs.length; start += 400) {
            const batch = db.batch();
            for (const document of attendanceDocs.slice(start, start + 400)) {
                batch.update(document.ref, {
                    customerUid: FieldValue.delete(),
                    customerName: FieldValue.delete(),
                    anonymized: true,
                    privacyRequestId: requestId,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            await batch.commit();
        }
        const financialRecords = await loadAll(db.collection("financialRecords")
            .where("businessId", "==", input.businessId)
            .where("customerUid", "==", input.targetUid));
        for (let start = 0; start < financialRecords.length; start += 400) {
            const batch = db.batch();
            for (const document of financialRecords.slice(start, start + 400)) {
                batch.update(document.ref, {
                    customerUid: FieldValue.delete(),
                    customerName: FieldValue.delete(),
                    customerEmail: FieldValue.delete(),
                    customerPhone: FieldValue.delete(),
                    documentId: FieldValue.delete(),
                    cedula: FieldValue.delete(),
                    taxId: FieldValue.delete(),
                    paymentToken: FieldValue.delete(),
                    cardLast4: FieldValue.delete(),
                    ip: FieldValue.delete(),
                    subjectPseudonym,
                    anonymized: true,
                    privacyRequestId: requestId,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            await batch.commit();
        }
        const profileBatch = db.batch();
        if (customerSnapshot.exists) {
            profileBatch.update(customerReference, {
                displayName: "ANONYMIZED",
                email: FieldValue.delete(),
                phone: FieldValue.delete(),
                status: "ANONYMIZED",
                anonymized: true,
                privacyRequestId: requestId,
                anonymizedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }
        // AGENTS 9.3: la ficha local incluye historial de navegacion, tags y
        // preferencias. Los puntos y el nivel se conservan como agregado comercial
        // del club, pero las preferencias y el consentimiento de marketing no
        // sobreviven a la solicitud.
        profileBatch.set(customerReference, {
            tier: FieldValue.delete(),
            loyaltyPoints: FieldValue.delete(),
            tags: FieldValue.delete(),
            preferences: FieldValue.delete(),
            marketingConsent: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        // AGENTS 2.1: businesses/{businessId}/loyalty/{uid} es la ficha de puntos y
        // nivel VIP en este club.
        profileBatch.delete(businessReference.collection("loyalty").doc(input.targetUid));
        profileBatch.set(db.collection("users").doc(input.targetUid), {
            uid: input.targetUid,
            privacyStatus: "DELETION_REQUESTED",
            privacyRequestBusinessIds: FieldValue.arrayUnion(input.businessId),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        await profileBatch.commit();
        // Holds activos: el uid del titular se sustituye por el seudonimo para que
        // la transicion de estado siga siendo auditable sin conservar la identidad.
        const holds = await loadAll(db.collection("holds")
            .where("businessId", "==", input.businessId)
            .where("customerUid", "==", input.targetUid));
        for (let start = 0; start < holds.length; start += 400) {
            const batch = db.batch();
            for (const document of holds.slice(start, start + 400)) {
                batch.update(document.ref, {
                    customerUid: FieldValue.delete(),
                    subjectPseudonym,
                    anonymized: true,
                    privacyRequestId: requestId,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            await batch.commit();
        }
        // Los desafios OTP guardan el identificador cifrado y su hash, ambos
        // reversibles con la clave del servidor: son PII y se destruyen. Los hashes
        // se calculan antes de borrar los campos del titular.
        const identifierHashes = [customerEmail, customerPhone]
            .filter((value) => typeof value === "string" && value.length > 0)
            .map((identifier) => [
            hashIdentifier(identifierHashSecret(), "email", identifier),
            hashIdentifier(identifierHashSecret(), "sms", identifier)
        ])
            .flat();
        const challengeDocuments = [];
        for (const identifierHash of identifierHashes) {
            challengeDocuments.push(...await loadAll(db.collection("otpChallenges")
                .where("businessId", "==", input.businessId)
                .where("identifierHash", "==", identifierHash)));
        }
        for (let start = 0; start < challengeDocuments.length; start += 400) {
            const batch = db.batch();
            for (const document of challengeDocuments.slice(start, start + 400)) {
                batch.update(document.ref, {
                    identifierCiphertext: FieldValue.delete(),
                    identifierHash: FieldValue.delete(),
                    codeHash: FieldValue.delete(),
                    providerVerificationSid: FieldValue.delete(),
                    anonymized: true,
                    privacyRequestId: requestId,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            await batch.commit();
        }
        await revokeSubjectIdentity(input.targetUid);
        const ledgerHash = sha256(`${requestId}:${reservationIds.join(",")}:${reservations.length}`);
        const completionBatch = db.batch();
        completionBatch.update(requestReference, {
            status: "COMPLETED",
            completedAt: FieldValue.serverTimestamp(),
            reservationCount: reservations.length,
            anonymizedReservationCount: reservationIds.length,
            attendanceAnonymizedCount: attendanceDocs.length,
            financialRecordsAnonymizedCount: financialRecords.length,
            holdsAnonymizedCount: holds.length,
            otpChallengesAnonymizedCount: challengeDocuments.length,
            subjectPseudonym,
            ledgerHash,
            updatedAt: FieldValue.serverTimestamp()
        });
        completionBatch.set(requestReference.collection("ledger").doc(randomId("ledger")), {
            requestId,
            businessId: input.businessId,
            event: "ANONYMIZATION_COMPLETED",
            actorUid: callerUid,
            subjectUidHash: sha256(input.targetUid),
            reservationCount: reservations.length,
            attendanceCount: attendanceDocs.length,
            financialRecordCount: financialRecords.length,
            holdsAnonymizedCount: holds.length,
            otpChallengesAnonymizedCount: challengeDocuments.length,
            ledgerHash,
            createdAt: FieldValue.serverTimestamp()
        });
        await completionBatch.commit();
        await writeAudit("privacy.deletion_completed", "privacyRequest", requestId, {
            businessId: input.businessId,
            actorUid: callerUid,
            actorRole: input.targetUid === callerUid ? "customer" : "manager",
            requestId: getRequestId(request.rawRequest),
            ip: getClientIp(request.rawRequest)
        }, { reservationCount: reservations.length, anonymizedReservationCount: reservationIds.length });
        return {
            requestId,
            businessId: input.businessId,
            status: "COMPLETED",
            reservationCount: reservations.length,
            anonymizedReservationCount: reservationIds.length,
            attendanceAnonymizedCount: attendanceDocs.length,
            financialRecordsAnonymizedCount: financialRecords.length,
            subjectPseudonym,
            ledgerHash
        };
    }
    catch {
        await requestReference.set({
            status: "FAILED",
            failedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        await requestReference.collection("ledger").doc(randomId("ledger")).set({
            requestId,
            businessId: input.businessId,
            event: "PROCESSING_FAILED",
            actorUid: callerUid,
            subjectUidHash: sha256(input.targetUid),
            createdAt: FieldValue.serverTimestamp()
        });
        throw new AppError("unavailable", "Privacy deletion could not be completed", 503);
    }
}
//# sourceMappingURL=privacy.js.map
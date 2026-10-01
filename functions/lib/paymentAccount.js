import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isSuperAdmin, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { assertAllowedKeys, asRecord, optionalString, requiredId, requiredString } from "./validation.js";
/**
 * Configuración de la pasarela de pagos del negocio (AGENTS.md Fase C).
 *
 * La credencial privada del PSP NUNCA viaja al navegador: el cliente solo
 * envía el identificador público (merchantId) y una referencia al secreto
 * (env://NAME o recurso de Secret Manager) que el backend resuelve de forma
 * hermética. Este callable es el único camino de escritura sobre
 * businesses/{businessId}/private/paymentAccount (las reglas de Firestore
 * bloquean toda escritura directa desde el cliente).
 */
const PAYMENT_MODES = ["PAY_AT_DOOR", "CLIENT_GATEWAY", "ASSISTED_GATEWAY"];
const PROVIDERS = ["none", "kushki", "payphone", "deuna"];
const ENVIRONMENTS = ["sandbox", "production"];
function isValidSecretReference(reference) {
    return /^env:\/\/[A-Za-z0-9_]+$/.test(reference)
        || /^projects\/[a-z0-9-]+\/secrets\/[A-Za-z0-9_-]+(\/versions\/[A-Za-z0-9_-]+)?$/.test(reference);
}
export function parsePaymentAccountInput(value) {
    const record = asRecord(value);
    // Cualquier campo ajeno (webhookSecret, privateApiKey, tarjetas...) se rechaza.
    assertAllowedKeys(record, [
        "businessId",
        "paymentMode",
        "provider",
        "environment",
        "merchantId",
        "publicApiKey",
        "secretReference"
    ]);
    const businessId = requiredId(record, "businessId");
    const paymentMode = requiredString(record, "paymentMode", 1, 40);
    if (!PAYMENT_MODES.includes(paymentMode)) {
        throw new AppError("invalid-argument", "paymentMode is not supported");
    }
    const provider = requiredString(record, "provider", 1, 24);
    if (!PROVIDERS.includes(provider)) {
        throw new AppError("invalid-argument", "provider is not supported");
    }
    const environment = requiredString(record, "environment", 1, 12);
    if (!ENVIRONMENTS.includes(environment)) {
        throw new AppError("invalid-argument", "environment must be sandbox or production");
    }
    const merchantId = requiredString(record, "merchantId", 3, 120);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(merchantId)) {
        throw new AppError("invalid-argument", "merchantId has an invalid format");
    }
    const publicApiKey = optionalString(record, "publicApiKey", 3, 200);
    if (publicApiKey && !/^[A-Za-z0-9_.:-]+$/.test(publicApiKey)) {
        throw new AppError("invalid-argument", "publicApiKey has an invalid format");
    }
    const secretReference = optionalString(record, "secretReference", 1, 500);
    if (secretReference && !isValidSecretReference(secretReference)) {
        throw new AppError("invalid-argument", "secretReference must be env://NAME or a Secret Manager resource name");
    }
    if (paymentMode !== "PAY_AT_DOOR" && provider !== "none" && !secretReference) {
        throw new AppError("failed-precondition", "Credenciales del PSP no configuradas (PAYMENT_SECRET_UNAVAILABLE)", 412);
    }
    return {
        businessId,
        paymentMode,
        provider,
        environment: environment,
        merchantId,
        ...(publicApiKey ? { publicApiKey } : {}),
        ...(secretReference ? { secretReference } : {})
    };
}
async function authorizePaymentAccountAccess(uid, businessId) {
    const businessRef = db.collection("businesses").doc(businessId);
    const businessSnapshot = await businessRef.get();
    if (!businessSnapshot.exists)
        throw new AppError("not-found", "Business not found", 404);
    if (await isSuperAdmin(uid))
        return "super_admin";
    const staff = await requireStaff(uid, businessId, "manager");
    return staff.role;
}
function sanitizeAccount(data) {
    return {
        paymentMode: typeof data.paymentMode === "string" ? data.paymentMode : "PAY_AT_DOOR",
        provider: typeof data.provider === "string" ? data.provider : "none",
        environment: data.environment === "production" ? "production" : "sandbox",
        merchantId: typeof data.merchantId === "string" ? data.merchantId : "",
        publicApiKey: typeof data.publicApiKey === "string" ? data.publicApiKey : null,
        secretReference: typeof data.secretReference === "string" ? data.secretReference : null,
        status: typeof data.status === "string" ? data.status : "PENDING_CONFIG",
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : null
    };
}
export async function getPaymentAccountFor(request) {
    const uid = callableUid(request);
    const record = asRecord(request.data);
    assertAllowedKeys(record, ["businessId"]);
    const businessId = requiredId(record, "businessId");
    await authorizePaymentAccountAccess(uid, businessId);
    const snapshot = await db.collection("businesses").doc(businessId)
        .collection("private").doc("paymentAccount").get();
    return {
        businessId,
        paymentAccount: snapshot.exists ? sanitizeAccount(dataRecordSafe(snapshot.data())) : null
    };
}
function dataRecordSafe(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
export async function configurePaymentAccountFor(request) {
    const uid = callableUid(request);
    const input = parsePaymentAccountInput(request.data);
    const actorRole = await authorizePaymentAccountAccess(uid, input.businessId);
    const config = {
        paymentMode: input.paymentMode,
        provider: input.provider,
        environment: input.environment,
        merchantId: input.merchantId,
        publicApiKey: input.publicApiKey ?? null,
        secretReference: input.secretReference ?? null,
        status: "ACTIVE",
        updatedBy: uid,
        updatedAt: Date.now()
    };
    await db.collection("businesses").doc(input.businessId)
        .collection("private").doc("paymentAccount")
        .set(config, { merge: true });
    await writeAudit("payment_account_configured", "business", input.businessId, {
        businessId: input.businessId,
        actorUid: uid,
        actorRole,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, {
        provider: input.provider,
        environment: input.environment,
        merchantId: input.merchantId,
        paymentMode: input.paymentMode
    });
    return { businessId: input.businessId, paymentAccount: config };
}
//# sourceMappingURL=paymentAccount.js.map
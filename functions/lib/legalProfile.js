import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isSuperAdmin, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { assertAllowedKeys, asRecord, optionalPhone, optionalString, requiredEmail, requiredId, requiredString } from "./validation.js";
const NATURAL_COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];
const PUBLIC_ENTITY_COEFFICIENTS = [3, 2, 7, 6, 5, 4, 3, 2];
const PRIVATE_COMPANY_COEFFICIENTS = [4, 3, 2, 7, 6, 5, 4, 3, 2];
/**
 * Valida la estructura matemática de un RUC ecuatoriano de 13 dígitos
 * (no consulta el SRI; solo el dígito verificador oficial):
 *  - Tercer dígito 0-5: persona natural, módulo 10, verificador en posición 10.
 *  - Tercer dígito 6: sociedad pública, módulo 11, verificador en posición 9.
 *  - Tercer dígito 9: sociedad privada / extranjero, módulo 11, verificador en posición 10.
 *  - Tercer dígito 7 u 8: códigos no asignados por el SRI.
 */
export function isValidEcuadorRuc(ruc) {
    if (!/^\d{13}$/.test(ruc))
        return false;
    const province = Number(ruc.slice(0, 2));
    if (province < 1 || province > 24)
        return false;
    const contributorType = Number(ruc[2]);
    if (contributorType <= 5) {
        let sum = 0;
        for (let index = 0; index < NATURAL_COEFFICIENTS.length; index += 1) {
            const coefficient = NATURAL_COEFFICIENTS[index] ?? 0;
            let product = Number(ruc.charAt(index)) * coefficient;
            if (product > 9)
                product -= 9;
            sum += product;
        }
        const digit = 10 - (sum % 10);
        return Number(ruc.charAt(9)) === (digit === 10 ? 0 : digit);
    }
    if (contributorType === 6) {
        let sum = 0;
        for (let index = 0; index < PUBLIC_ENTITY_COEFFICIENTS.length; index += 1) {
            sum += Number(ruc.charAt(index)) * (PUBLIC_ENTITY_COEFFICIENTS[index] ?? 0);
        }
        const remainder = sum % 11;
        const digit = remainder === 0 ? 0 : 11 - remainder;
        return digit <= 9 && Number(ruc.charAt(8)) === digit;
    }
    if (contributorType === 9) {
        let sum = 0;
        for (let index = 0; index < PRIVATE_COMPANY_COEFFICIENTS.length; index += 1) {
            sum += Number(ruc.charAt(index)) * (PRIVATE_COMPANY_COEFFICIENTS[index] ?? 0);
        }
        const remainder = sum % 11;
        const digit = remainder === 0 ? 0 : 11 - remainder;
        return digit <= 9 && Number(ruc.charAt(9)) === digit;
    }
    return false;
}
function optionalAbsoluteUrl(record, key) {
    const value = optionalString(record, key, 1, 500);
    if (value === undefined)
        return undefined;
    if (!/^https?:\/\/\S+$/i.test(value)) {
        throw new AppError("invalid-argument", `${key} must be an absolute http(s) URL`);
    }
    return value;
}
export function parseLegalProfileInput(value) {
    const record = asRecord(value);
    assertAllowedKeys(record, [
        "businessId",
        "legalName",
        "ruc",
        "taxAddress",
        "supportEmail",
        "supportPhone",
        "refundPolicyUrl",
        "termsAndConditionsUrl"
    ]);
    const businessId = requiredId(record, "businessId");
    const legalName = requiredString(record, "legalName", 3, 120);
    const ruc = requiredString(record, "ruc", 13, 13);
    if (!isValidEcuadorRuc(ruc)) {
        throw new AppError("invalid-argument", "ruc is not a valid Ecuadorian tax identification number");
    }
    const taxAddress = requiredString(record, "taxAddress", 3, 200);
    const supportEmail = requiredEmail(record, "supportEmail");
    const supportPhone = optionalPhone(record, "supportPhone");
    const refundPolicyUrl = optionalAbsoluteUrl(record, "refundPolicyUrl");
    const termsAndConditionsUrl = optionalAbsoluteUrl(record, "termsAndConditionsUrl");
    return {
        businessId,
        legalName,
        ruc,
        taxAddress,
        supportEmail,
        ...(supportPhone ? { supportPhone } : {}),
        ...(refundPolicyUrl ? { refundPolicyUrl } : {}),
        ...(termsAndConditionsUrl ? { termsAndConditionsUrl } : {})
    };
}
export async function updateBusinessLegalProfileFor(request) {
    const uid = callableUid(request);
    const input = parseLegalProfileInput(request.data);
    const businessRef = db.collection("businesses").doc(input.businessId);
    const businessSnapshot = await businessRef.get();
    if (!businessSnapshot.exists)
        throw new AppError("not-found", "Business not found", 404);
    let actorRole = "super_admin";
    if (!(await isSuperAdmin(uid))) {
        const staff = await requireStaff(uid, input.businessId, "manager");
        actorRole = staff.role;
    }
    const profile = {
        legalName: input.legalName,
        ruc: input.ruc,
        taxAddress: input.taxAddress,
        supportEmail: input.supportEmail,
        supportPhone: input.supportPhone ?? null,
        refundPolicyUrl: input.refundPolicyUrl ?? null,
        termsAndConditionsUrl: input.termsAndConditionsUrl ?? null,
        updatedAt: Date.now()
    };
    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.set(businessRef, { legalProfile: profile, updatedAt: now }, { merge: true });
    batch.set(businessRef.collection("public").doc("legalProfile"), {
        businessId: input.businessId,
        legalName: profile.legalName,
        ruc: profile.ruc,
        taxAddress: profile.taxAddress,
        supportEmail: profile.supportEmail,
        supportPhone: profile.supportPhone,
        refundPolicyUrl: profile.refundPolicyUrl,
        termsAndConditionsUrl: profile.termsAndConditionsUrl,
        updatedAt: now
    }, { merge: true });
    await batch.commit();
    await writeAudit("legal_profile_updated", "business", input.businessId, {
        businessId: input.businessId,
        actorUid: uid,
        actorRole,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, { legalName: input.legalName, ruc: input.ruc });
    return { businessId: input.businessId, legalProfile: profile };
}
//# sourceMappingURL=legalProfile.js.map
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "./config.js";
import { AppError } from "./errors.js";
import { getClientIp, getRequestId } from "./http.js";
import { callableUid } from "./auth.js";
import { writeAudit } from "./audit.js";
import { asRecord, assertAllowedKeys, optionalEmail, optionalPhone, optionalString, requiredId, requiredString } from "./validation.js";
import { dataRecord } from "./firestore.js";
function parseInput(value) {
    const record = asRecord(value);
    assertAllowedKeys(record, ["businessId", "displayName", "email", "phone", "marketingConsent", "tier"]);
    const businessId = requiredId(record, "businessId");
    const displayName = requiredString(record, "displayName", 2, 80);
    const email = optionalEmail(record, "email");
    const phone = optionalPhone(record, "phone");
    const marketingConsentValue = record.marketingConsent;
    if (typeof marketingConsentValue !== "boolean")
        throw new AppError("invalid-argument", "marketingConsent is required");
    const tierValue = optionalString(record, "tier", 1, 20) ?? "STANDARD";
    if (tierValue !== "STANDARD" && tierValue !== "SILVER" && tierValue !== "GOLD" && tierValue !== "BLACK") {
        throw new AppError("invalid-argument", "tier is invalid");
    }
    if (!email && !phone)
        throw new AppError("invalid-argument", "email or phone is required");
    return {
        businessId,
        displayName,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        marketingConsent: marketingConsentValue,
        tier: tierValue
    };
}
export async function createBusinessCustomerProfileFor(request) {
    const uid = callableUid(request);
    const input = parseInput(request.data);
    const businessSnapshot = await db.collection("businesses").doc(input.businessId).get();
    if (!businessSnapshot.exists)
        throw new AppError("not-found", "Business not found", 404);
    const business = dataRecord(businessSnapshot.data());
    const businessStatus = typeof business.status === "string" ? business.status.toLowerCase() : "";
    if (businessStatus !== "active" && businessStatus !== "trial") {
        throw new AppError("failed-precondition", "Business is not active", 412);
    }
    const user = await auth.getUser(uid);
    const authEmail = user.email?.toLowerCase();
    const authPhone = user.phoneNumber;
    if (input.email && authEmail && input.email !== authEmail) {
        throw new AppError("permission-denied", "Email does not match the authenticated account", 403);
    }
    if (input.phone && authPhone && input.phone !== authPhone) {
        throw new AppError("permission-denied", "Phone does not match the authenticated account", 403);
    }
    const isPasswordAccount = user.providerData.some((p) => p.providerId === "password");
    if (!isPasswordAccount && input.email && !user.emailVerified) {
        throw new AppError("failed-precondition", "Email must be verified before creating a profile", 412);
    }
    if (input.phone && !user.phoneNumber) {
        throw new AppError("failed-precondition", "Phone must be linked before creating a profile", 412);
    }
    const customerReference = db.collection("businesses").doc(input.businessId).collection("customers").doc(uid);
    const userReference = db.collection("users").doc(uid);
    const now = FieldValue.serverTimestamp();
    const result = await db.runTransaction(async (transaction) => {
        const [customerSnapshot, userSnapshot, businessForUpdate] = await Promise.all([
            transaction.get(customerReference),
            transaction.get(userReference),
            transaction.get(db.collection("businesses").doc(input.businessId))
        ]);
        const existing = customerSnapshot.data();
        const existingData = existing ? dataRecord(existing) : undefined;
        if (existingData && existingData.businessId !== input.businessId) {
            throw new AppError("already-exists", "Customer profile belongs to another business", 409);
        }
        if (existingData?.status === "DELETION_PENDING" || existingData?.status === "ANONYMIZED") {
            throw new AppError("failed-precondition", "Customer profile is not active", 412);
        }
        const createdAt = existingData?.createdAt ?? now;
        const customer = {
            customerId: uid,
            businessId: input.businessId,
            uid,
            displayName: input.displayName,
            email: input.email ?? authEmail ?? null,
            phone: input.phone ?? authPhone ?? null,
            status: "ACTIVE",
            tier: input.tier,
            loyaltyPoints: existingData?.loyaltyPoints ?? 0,
            marketingConsent: input.marketingConsent,
            createdAt,
            updatedAt: now
        };
        transaction.set(customerReference, customer, { merge: false });
        const userData = userSnapshot.data() ? dataRecord(userSnapshot.data()) : {};
        transaction.set(userReference, {
            uid,
            email: authEmail ?? null,
            phone: authPhone ?? null,
            emailVerified: user.emailVerified,
            phoneVerified: Boolean(user.phoneNumber),
            disabled: user.disabled,
            globalRole: "CUSTOMER",
            createdAt: userData.createdAt ?? now,
            updatedAt: now
        }, { merge: true });
        if (!existingData && businessForUpdate.exists) {
            transaction.update(db.collection("businesses").doc(input.businessId), {
                customerCount: FieldValue.increment(1),
                updatedAt: now
            });
        }
        return { customer, created: !existingData };
    });
    await writeAudit(result.created ? "customer.profile_created" : "customer.profile_updated", "customer", uid, { businessId: input.businessId, actorUid: uid, actorRole: "customer", requestId: getRequestId(request.rawRequest), ip: getClientIp(request.rawRequest) }, { marketingConsent: input.marketingConsent, tier: input.tier });
    return {
        customerId: result.customer.customerId,
        businessId: result.customer.businessId,
        uid: result.customer.uid,
        displayName: result.customer.displayName,
        email: result.customer.email,
        phone: result.customer.phone,
        status: result.customer.status,
        tier: result.customer.tier,
        loyaltyPoints: result.customer.loyaltyPoints,
        marketingConsent: result.customer.marketingConsent,
        createdAt: result.customer.createdAt,
        updatedAt: result.customer.updatedAt
    };
}
//# sourceMappingURL=profile.js.map
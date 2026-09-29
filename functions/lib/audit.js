import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { randomId, sha256 } from "./crypto.js";
export async function writeAudit(action, targetType, targetId, context, metadata = {}) {
    const reference = context.businessId
        ? db.collection("businesses").doc(context.businessId).collection("securityIncidents").doc(randomId("audit"))
        : db.collection("auditLogs").doc(randomId("audit"));
    const safeMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === "string")
            safeMetadata[key] = value.slice(0, 256);
        else
            safeMetadata[key] = value;
    }
    await reference.set({
        type: "AUDIT_EVENT",
        status: "CLOSED",
        businessId: context.businessId ?? null,
        actorUid: context.actorUid ?? null,
        actorRole: context.actorRole ?? "system",
        action,
        targetType,
        targetId,
        requestId: context.requestId ?? null,
        ipHash: context.ip ? sha256(context.ip) : null,
        metadata: safeMetadata,
        createdAt: FieldValue.serverTimestamp()
    });
}
//# sourceMappingURL=audit.js.map
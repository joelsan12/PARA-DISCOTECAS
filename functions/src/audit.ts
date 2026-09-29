import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { randomId, sha256 } from "./crypto.js";

export interface AuditContext {
  businessId?: string;
  actorUid?: string;
  actorRole?: string;
  requestId?: string;
  ip?: string;
}

export type AuditMetadata = Record<string, string | number | boolean | null>;

export async function writeAudit(
  action: string,
  targetType: string,
  targetId: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  const reference = context.businessId
    ? db.collection("businesses").doc(context.businessId).collection("securityIncidents").doc(randomId("audit"))
    : db.collection("auditLogs").doc(randomId("audit"));
  const safeMetadata: AuditMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") safeMetadata[key] = value.slice(0, 256);
    else safeMetadata[key] = value;
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

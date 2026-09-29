export interface AuditContext {
    businessId?: string;
    actorUid?: string;
    actorRole?: string;
    requestId?: string;
    ip?: string;
}
export type AuditMetadata = Record<string, string | number | boolean | null>;
export declare function writeAudit(action: string, targetType: string, targetId: string, context: AuditContext, metadata?: AuditMetadata): Promise<void>;

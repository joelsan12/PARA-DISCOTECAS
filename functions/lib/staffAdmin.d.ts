import type { CallableRequest } from "firebase-functions/v2/https";
import { type StaffRole } from "./auth.js";
export interface StaffMemberRecord {
    uid: string;
    businessId: string;
    name: string;
    email: string;
    whatsapp?: string | null;
    role: StaffRole;
    status: "ACTIVE" | "SUSPENDED" | "REVOKED";
    assignedZones: string[];
    createdAt: string | null;
    updatedAt: string | null;
}
export declare function listBusinessStaffFor(request: CallableRequest<unknown>): Promise<{
    staff: StaffMemberRecord[];
}>;
export declare function upsertStaffMemberFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    uid: string;
    name: string;
    email: string;
    whatsapp?: string | null;
    role: StaffRole;
    status: "ACTIVE";
    assignedZones: string[];
    temporaryPassword?: string;
}>;
export declare function revokeStaffMemberFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    uid: string;
    status: "REVOKED";
}>;

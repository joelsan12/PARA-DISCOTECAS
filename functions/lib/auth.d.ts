import type { CallableRequest } from "firebase-functions/v2/https";
export type StaffRole = "owner" | "manager" | "door" | "finance";
export interface StaffProfile {
    uid: string;
    businessId: string;
    role: StaffRole;
    status: "ACTIVE" | "SUSPENDED" | "REVOKED";
    deviceIds: string[];
}
export declare function callableUid(request: CallableRequest<unknown>): string;
export declare function roleAtLeast(role: StaffRole, minimum: StaffRole): boolean;
export declare function isStaffRole(value: unknown): value is StaffRole;
export declare function getStaffProfile(uid: string, businessId: string): Promise<StaffProfile | null>;
export declare function requireStaff(uid: string, businessId: string, minimumRole?: StaffRole): Promise<StaffProfile>;
export declare function isSuperAdmin(uid: string): Promise<boolean>;

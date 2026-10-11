import type { CallableRequest } from "firebase-functions/v2/https";
export type ConciergeRequestType = "SERVICE" | "BOTTLE" | "HOOKAH" | "WAITER" | "OTHER";
export type ConciergeRequestStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export interface ConciergeRequestRecord {
    requestId: string;
    businessId: string;
    uid: string;
    customerName?: string | undefined;
    customerPhone?: string | undefined;
    reservationId?: string | undefined;
    resourceId?: string | undefined;
    tableCode?: string | undefined;
    zone?: string | undefined;
    type: ConciergeRequestType;
    message: string;
    status: ConciergeRequestStatus;
    assignedWaiterUid?: string | undefined;
    assignedWaiterName?: string | undefined;
    source: "in_app" | "whatsapp";
    createdAt: string | null;
    updatedAt: string | null;
}
export declare function createConciergeRequestFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    requestId: string;
    request: ConciergeRequestRecord;
}>;
export declare function updateConciergeRequestStatusFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    requestId: string;
    status: ConciergeRequestStatus;
    replay?: boolean;
}>;
export declare function cancelConciergeRequestFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    requestId: string;
    status: "CANCELLED";
    replay?: boolean;
}>;

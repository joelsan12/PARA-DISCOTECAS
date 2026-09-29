import type { CallableRequest } from "firebase-functions/v2/https";
export declare function createBusinessSessionFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>>;
export declare function revokeBusinessSessionsForScope(businessId: string, scope: "DEVICE" | "EVENT" | "BUSINESS", target: {
    deviceId?: string;
    eventId?: string;
}, version: number): Promise<number>;

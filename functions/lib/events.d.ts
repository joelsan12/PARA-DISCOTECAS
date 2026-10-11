import type { CallableRequest } from "firebase-functions/v2/https";
export interface UpsertEventInput {
    businessId: string;
    eventId?: string;
    title: string;
    subtitle?: string;
    date: string;
    day_label?: string;
    door_time?: string;
    cover_price?: number;
    dj_guest?: string;
    genre?: string;
    flyer_url?: string;
    is_published?: boolean;
    experience_type?: string;
    floor_plan_version_id?: string;
}
export declare function parseUpsertEventInput(value: unknown): UpsertEventInput;
export declare function upsertBusinessEventFor(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    eventId: string;
    event: Record<string, unknown>;
}>;

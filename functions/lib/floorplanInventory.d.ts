import type { CallableRequest } from "firebase-functions/v2/https";
export interface FloorPlanTableItem {
    id: string;
    tableCode: string;
    zone: string;
    capacity: number;
    minSpend: number;
    depositRequired: number;
    isActive: boolean;
}
export interface SyncFloorPlanInventoryInput {
    businessId: string;
    tables: FloorPlanTableItem[];
}
export declare function parseSyncInventoryInput(data: unknown): SyncFloorPlanInventoryInput;
export declare function syncFloorPlanInventoryFor(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    businessId: string;
    syncedCount: number;
    deactivatedCount: number;
    skippedHoldsCount: number;
}>;

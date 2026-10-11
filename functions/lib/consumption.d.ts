import type { CallableRequest } from "firebase-functions/v2/https";
export interface ConsumptionCatalogItem {
    sku: string;
    name: string;
    price: number;
    category: string;
}
export interface ConsumptionItem {
    id: string;
    sku?: string | undefined;
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    addedBy: string;
    addedAt: string;
}
export interface TableTabRecord {
    businessId: string;
    reservationId: string;
    resourceId: string;
    eventId: string;
    items: ConsumptionItem[];
    subtotal: number;
    depositAmount: number;
    minSpend: number;
    status: "OPEN" | "SETTLED";
    settlementMethod?: "cash" | "card_manual" | "transfer" | "other" | null | undefined;
    settledBy?: string | null | undefined;
    settledAt?: string | null | undefined;
    createdAt: string | null;
    updatedAt: string | null;
}
export declare function getConsumptionCatalogFor(request: CallableRequest<unknown>): Promise<{
    items: ConsumptionCatalogItem[];
}>;
export declare function saveConsumptionCatalogFor(request: CallableRequest<unknown>): Promise<{
    success: true;
    count: number;
}>;
export declare function addConsumptionItemFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    tab: TableTabRecord;
}>;
export declare function settleTableTabFor(request: CallableRequest<unknown>): Promise<{
    ok: true;
    status: "SETTLED";
    reservationId: string;
    subtotal: number;
    settledBy: string;
    replay?: boolean;
}>;

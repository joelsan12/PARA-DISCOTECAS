import type { CallableRequest } from "firebase-functions/v2/https";
export type CustomerTier = "STANDARD" | "SILVER" | "GOLD" | "BLACK";
export declare function createBusinessCustomerProfileFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>>;

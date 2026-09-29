export declare function timestampMillis(value: unknown): number | undefined;
export declare function isActiveBusinessStatus(value: unknown): boolean;
export declare function requireActiveBusiness(businessId: string): Promise<void>;
export declare function dataString(data: Record<string, unknown>, key: string): string | undefined;
export declare function dataNumber(data: Record<string, unknown>, key: string): number | undefined;
export declare function dataRecord(value: unknown): Record<string, unknown>;
export declare function dataBoolean(value: unknown): boolean | undefined;
export declare function dataStringOrEmpty(value: unknown): string;

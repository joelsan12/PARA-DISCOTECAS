import { HttpsError, type FunctionsErrorCode } from "firebase-functions/v2/https";
export type AppErrorCode = Exclude<FunctionsErrorCode, "ok">;
export declare class AppError extends Error {
    readonly code: AppErrorCode;
    readonly status: number;
    constructor(code: AppErrorCode, message: string, status?: number);
}
export declare function toHttpsError(error: unknown): HttpsError;
export declare function statusForCode(code: FunctionsErrorCode): number;
export declare function toHttpError(error: unknown): {
    status: number;
    body: {
        error: string;
        message: string;
    };
};

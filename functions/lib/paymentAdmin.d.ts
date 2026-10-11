import type { CallableRequest } from "firebase-functions/v2/https";
export interface ListPaymentTransactionsInput {
    businessId: string;
    limit?: number;
}
export declare function parseListTransactionsInput(value: unknown): ListPaymentTransactionsInput;
export interface CreatePaymentRefundInput {
    businessId: string;
    transactionId: string;
    reason?: string;
}
export declare function parseCreateRefundInput(value: unknown): CreatePaymentRefundInput;
/**
 * listPaymentTransactions — Consulta segura de transacciones para rol finance/manager
 */
export declare function listPaymentTransactionsFor(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    transactions: Array<Record<string, unknown>>;
}>;
/**
 * createPaymentRefund — Emisión de reembolsos vía PSP y actualización atómica en Firestore
 */
export declare function createPaymentRefundFor(request: CallableRequest<unknown>): Promise<{
    success: boolean;
    replay: boolean;
    status: string;
    refundId: string;
}>;

import type { CallableRequest } from "firebase-functions/v2/https";
import type { PaymentMode, PaymentProviderType } from "./types/payments.js";
export interface PaymentAccountConfigInput {
    businessId: string;
    paymentMode: PaymentMode;
    provider: PaymentProviderType;
    environment: "sandbox" | "production";
    merchantId: string;
    publicApiKey?: string;
    secretReference?: string;
}
export declare function parsePaymentAccountInput(value: unknown): PaymentAccountConfigInput;
export declare function getPaymentAccountFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>>;
export declare function configurePaymentAccountFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>>;

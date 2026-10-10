export declare const ALLOWED_FEEDBACK_CATEGORIES: readonly ["suggestion", "bug", "reservation", "design"];
export type FeedbackCategory = (typeof ALLOWED_FEEDBACK_CATEGORIES)[number];
export interface FeedbackInput {
    rating: number;
    category: FeedbackCategory;
    message: string;
    contact?: string | undefined;
    portal?: string | undefined;
    path?: string | undefined;
    context?: Record<string, unknown> | undefined;
    clientVersion?: string | undefined;
}
export interface FeedbackResult {
    success: boolean;
    id: string;
    emailSent: boolean;
    message: string;
}
export declare function parseFeedbackInput(value: unknown): FeedbackInput;
export declare function submitFeedbackAndNotify(input: FeedbackInput): Promise<FeedbackResult>;

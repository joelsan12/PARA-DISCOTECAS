export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}
export interface SendEmailResult {
    sent: boolean;
    messageId?: string | undefined;
    provider?: string | undefined;
    error?: string | undefined;
}
/**
 * Envia correos transaccionales con reintentos limpios y fail-safe.
 * Soporta Resend (nativo en config) y SendGrid como alternativa vía env.
 */
export declare function sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
export interface WelcomeCredentialsOptions {
    to: string;
    ownerName: string;
    clubName: string;
    city: string;
    tempPassword: string;
    adminUrl: string;
    brandUrl: string;
}
export declare function sendWelcomeCredentialsEmail(options: WelcomeCredentialsOptions): Promise<SendEmailResult>;
export interface FeedbackNotificationOptions {
    to?: string | undefined;
    rating: number;
    category: string;
    message: string;
    contact?: string | undefined;
    path?: string | undefined;
    portal?: string | undefined;
    clientVersion?: string | undefined;
}
export declare function sendFeedbackNotificationEmail(options: FeedbackNotificationOptions): Promise<SendEmailResult>;

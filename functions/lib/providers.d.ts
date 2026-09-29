export declare function sendResendOtp(email: string, code: string): Promise<string | undefined>;
export declare function sendTwilioVerification(channel: "whatsapp" | "sms", phone: string): Promise<string>;
export declare function checkTwilioVerification(channel: "whatsapp" | "sms", phone: string, code: string): Promise<boolean>;
export declare function verifyCaptchaToken(token: string): Promise<void>;

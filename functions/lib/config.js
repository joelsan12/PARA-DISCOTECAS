import { getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
const existingApp = getApps()[0];
const adminApp = existingApp ?? initializeApp();
export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
export const appCheck = getAppCheck(adminApp);
function readEnv(name) {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
}
function readNumber(name, fallback, minimum, maximum) {
    const raw = readEnv(name);
    if (!raw)
        return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum)
        return fallback;
    return Math.floor(parsed);
}
function readBoolean(name, fallback) {
    const raw = readEnv(name)?.toLowerCase();
    if (raw === undefined)
        return fallback;
    if (raw === "true" || raw === "1" || raw === "yes")
        return true;
    if (raw === "false" || raw === "0" || raw === "no")
        return false;
    return fallback;
}
export class ConfigurationError extends Error {
    code = "failed-precondition";
    constructor(message) {
        super(message);
        this.name = "ConfigurationError";
    }
}
const region = readEnv("FUNCTIONS_REGION") ?? "us-central1";
const functionsEmulator = readBoolean("FUNCTIONS_EMULATOR", false);
setGlobalOptions({
    region,
    maxInstances: readNumber("FUNCTIONS_MAX_INSTANCES", 20, 1, 1000),
    timeoutSeconds: readNumber("FUNCTIONS_TIMEOUT_SECONDS", 120, 1, 540)
});
export const runtimeConfig = Object.freeze({
    region,
    appCheckEnforced: readBoolean("APP_CHECK_ENFORCED", !functionsEmulator),
    appCheckRequiredForHttp: readBoolean("APP_CHECK_REQUIRED", !functionsEmulator),
    captchaRequired: readBoolean("CAPTCHA_REQUIRED", false),
    otpTtlSeconds: readNumber("OTP_TTL_SECONDS", 300, 60, 1800),
    otpMaxAttempts: readNumber("OTP_MAX_ATTEMPTS", 3, 1, 10),
    otpRequestWindowSeconds: readNumber("OTP_REQUEST_WINDOW_SECONDS", 900, 60, 86400),
    otpRequestLimit: readNumber("OTP_REQUEST_LIMIT", 5, 1, 100),
    otpVerifyWindowSeconds: readNumber("OTP_VERIFY_WINDOW_SECONDS", 900, 60, 86400),
    otpVerifyLimit: readNumber("OTP_VERIFY_LIMIT", 10, 1, 100),
    otpEmailDailyLimit: readNumber("OTP_EMAIL_DAILY_LIMIT", 500, 1, 1_000_000),
    otpPaidChannelDailyLimit: readNumber("OTP_PAID_CHANNEL_DAILY_LIMIT", 100, 1, 1_000_000),
    trustedProxyCidrs: readEnv("TRUSTED_PROXY_CIDRS") ?? "",
    holdDurationSeconds: 12 * 60,
    sessionDurationSeconds: readNumber("BUSINESS_SESSION_TTL_SECONDS", 900, 300, 3600),
    privacyProcessingLeaseSeconds: readNumber("PRIVACY_PROCESSING_LEASE_SECONDS", 300, 60, 3600),
    paymentSignatureToleranceSeconds: readNumber("PAYMENT_SIGNATURE_TOLERANCE_SECONDS", 300, 30, 3600),
    cloudTasksQueue: readEnv("CLOUD_TASKS_QUEUE"),
    cloudTasksLocation: readEnv("CLOUD_TASKS_LOCATION") ?? region,
    cloudTasksTargetUrl: readEnv("CLOUD_TASKS_TARGET_URL"),
    cloudTasksServiceAccountEmail: readEnv("CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL"),
    projectId: readEnv("GCLOUD_PROJECT") ?? readEnv("GCP_PROJECT") ?? readEnv("FIREBASE_PROJECT_ID")
});
export function optionalEnv(name) {
    return readEnv(name);
}
export function requiredSecret(name) {
    const value = readEnv(name);
    if (!value)
        throw new ConfigurationError(`Missing required secret ${name}`);
    return value;
}
export function otpHashSecret() {
    return requiredSecret("OTP_HASH_SECRET");
}
export function identifierHashSecret() {
    return optionalEnv("IDENTIFIER_HASH_SECRET") ?? requiredSecret("OTP_HASH_SECRET");
}
export function holdTokenSecret() {
    return optionalEnv("HOLD_TOKEN_SECRET") ?? requiredSecret("APP_SECRET");
}
export function resendConfig() {
    const apiKey = readEnv("RESEND_API_KEY");
    const from = readEnv("RESEND_FROM_EMAIL") ?? readEnv("RESEND_FROM");
    if (!apiKey && !from)
        return null;
    if (!apiKey || !from)
        throw new ConfigurationError("Resend requires RESEND_API_KEY and RESEND_FROM_EMAIL");
    return { apiKey, from };
}
export function twilioConfig() {
    const accountSid = readEnv("TWILIO_ACCOUNT_SID");
    const authToken = readEnv("TWILIO_AUTH_TOKEN");
    const serviceSid = readEnv("TWILIO_VERIFY_SERVICE_SID");
    if (!accountSid && !authToken && !serviceSid)
        return null;
    if (!accountSid || !authToken || !serviceSid) {
        throw new ConfigurationError("Twilio Verify requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID");
    }
    return { accountSid, authToken, serviceSid };
}
export function captchaConfig() {
    const turnstileSecret = readEnv("TURNSTILE_SECRET_KEY");
    const hcaptchaSecret = readEnv("HCAPTCHA_SECRET_KEY");
    const genericSecret = readEnv("CAPTCHA_SECRET_KEY");
    const secret = turnstileSecret ?? hcaptchaSecret ?? genericSecret;
    if (!secret) {
        if (runtimeConfig.captchaRequired) {
            throw new ConfigurationError("CAPTCHA_REQUIRED is enabled but no captcha secret is configured");
        }
        return null;
    }
    const defaultUrl = turnstileSecret
        ? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        : "https://api.hcaptcha.com/siteverify";
    return { secret, url: readEnv("CAPTCHA_VERIFY_URL") ?? defaultUrl };
}
export function paymentWebhookSecret() {
    return requiredSecret("PAYMENT_WEBHOOK_SECRET");
}
//# sourceMappingURL=config.js.map
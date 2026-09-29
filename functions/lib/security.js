import { appCheck, captchaConfig, runtimeConfig } from "./config.js";
import { AppError } from "./errors.js";
import { getHeader } from "./http.js";
function getAppCheckToken(request) {
    return getHeader(request, "x-firebase-app-check") ?? getHeader(request, "x-firebase-appcheck");
}
export async function verifyAppCheckToken(token) {
    if (!token)
        return false;
    try {
        const result = await appCheck.verifyToken(token, { consume: true });
        return !result.alreadyConsumed;
    }
    catch {
        return false;
    }
}
export async function assertHttpAppCheck(request, required) {
    const token = getAppCheckToken(request);
    if (!token && !required)
        return;
    if (!token || !(await verifyAppCheckToken(token))) {
        throw new AppError("unauthenticated", "Valid App Check is required", 401);
    }
}
export function assertCallableAppCheck(request) {
    if (!runtimeConfig.appCheckEnforced)
        return;
    if (!request.app || request.app.alreadyConsumed) {
        throw new AppError("unauthenticated", "Valid App Check is required", 401);
    }
}
export async function assertCaptcha(token) {
    const provider = captchaConfig();
    if (!provider)
        return;
    if (!token)
        throw new AppError("invalid-argument", "Captcha token is required", 400);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
        const response = await fetch(provider.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ secret: provider.secret, response: token }),
            signal: controller.signal
        });
        if (!response.ok)
            throw new Error("captcha provider unavailable");
        const result = await response.json();
        if (typeof result !== "object" || result === null || Array.isArray(result)) {
            throw new Error("captcha provider response invalid");
        }
        const record = result;
        if (record.success !== true)
            throw new AppError("permission-denied", "Captcha validation failed", 403);
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError("unavailable", "Captcha validation is temporarily unavailable", 503);
    }
    finally {
        clearTimeout(timeout);
    }
}
//# sourceMappingURL=security.js.map
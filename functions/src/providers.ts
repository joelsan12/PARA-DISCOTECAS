import { AppError } from "./errors.js";
import { captchaConfig, resendConfig, twilioConfig } from "./config.js";
import { asRecord } from "./validation.js";

async function fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new AppError("unavailable", "External provider request failed", 503);
    if (!text) return {};
    try {
      return asRecord(JSON.parse(text), "provider response");
    } catch {
      throw new AppError("unavailable", "External provider returned an invalid response", 503);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("unavailable", "External provider is temporarily unavailable", 503);
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendResendOtp(email: string, code: string): Promise<string | undefined> {
  const provider = resendConfig();
  if (!provider) throw new AppError("failed-precondition", "Email OTP provider is not configured", 503);
  const result = await fetchJson("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${provider.apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: provider.from,
      to: [email],
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
    })
  });
  const id = result.id;
  return typeof id === "string" ? id : undefined;
}

export async function sendTwilioVerification(channel: "whatsapp" | "sms", phone: string): Promise<string> {
  const provider = twilioConfig();
  if (!provider) throw new AppError("failed-precondition", "Twilio Verify provider is not configured", 503);
  const body = new URLSearchParams({ To: phone, Channel: channel });
  const authorization = Buffer.from(`${provider.accountSid}:${provider.authToken}`).toString("base64");
  const result = await fetchJson(
    `https://verify.twilio.com/v2/Services/${encodeURIComponent(provider.serviceSid)}/Verifications`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${authorization}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    }
  );
  const sid = result.sid;
  if (typeof sid !== "string" || !sid) throw new AppError("unavailable", "Twilio did not return a verification SID", 503);
  return sid;
}

export async function checkTwilioVerification(channel: "whatsapp" | "sms", phone: string, code: string): Promise<boolean> {
  const provider = twilioConfig();
  if (!provider) throw new AppError("failed-precondition", "Twilio Verify provider is not configured", 503);
  const body = new URLSearchParams({ To: phone, Code: code });
  const authorization = Buffer.from(`${provider.accountSid}:${provider.authToken}`).toString("base64");
  const result = await fetchJson(
    `https://verify.twilio.com/v2/Services/${encodeURIComponent(provider.serviceSid)}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${authorization}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    }
  );
  if (result.status === "approved") return true;
  if (result.status === "pending") return false;
  throw new AppError("invalid-argument", "Verification code is invalid", 400);
}

export async function verifyCaptchaToken(token: string): Promise<void> {
  const provider = captchaConfig();
  if (!provider) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: provider.secret, response: token }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("captcha provider unavailable");
    const result = asRecord(await response.json(), "captcha response");
    if (result.success !== true) throw new AppError("permission-denied", "Captcha validation failed", 403);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("unavailable", "Captcha validation is temporarily unavailable", 503);
  } finally {
    clearTimeout(timeout);
  }
}

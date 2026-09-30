import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { auth, db, identifierHashSecret, otpHashSecret, resendConfig, runtimeConfig, twilioConfig } from "./config.js";
import { encryptIdentifier, decryptIdentifier, hashIdentifier, hashOtpCode, randomId, randomOtpCode, safeEqual, sha256 } from "./crypto.js";
import { AppError } from "./errors.js";
import { verifyCaptchaToken } from "./providers.js";
import { enforceRateLimit } from "./rateLimit.js";
import { consumeMessagingBudget } from "./messagingQuota.js";
import { asRecord, assertAllowedKeys, optionalString, requiredEmail, requiredId, requiredPhone, requiredString } from "./validation.js";
import { dataRecord, timestampMillis } from "./firestore.js";

export type OtpChannel = "email" | "whatsapp" | "sms";

interface OtpRequestData {
  businessId: string;
  identifier: string;
  channel: OtpChannel;
  captchaToken?: string;
  returnPath?: string;
  appCheckToken?: string;
}

interface OtpVerifyData {
  businessId: string;
  challengeId: string;
  code: string;
  captchaToken?: string;
  appCheckToken?: string;
  displayName?: string;
}

export interface OtpVerifyResult {
  verified: boolean;
  businessId: string;
  challengeId: string;
  channel: OtpChannel;
  uid: string;
  customToken: string;
}

interface ChallengeData extends Record<string, unknown> {
  challengeId: string;
  businessId: string;
  channel: OtpChannel;
  identifierHash: string;
  identifierCiphertext: string;
  codeHash: string | null;
  provider: "resend" | "twilio_verify";
  providerVerificationSid: string | null;
  state: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
  attempts: number;
  maxAttempts: number;
  expiresAt: Timestamp;
  createdAt: unknown;
  verifiedAt?: unknown;
}

function parseRequestData(value: unknown): OtpRequestData {
  const record = asRecord(value);
  assertAllowedKeys(record, ["businessId", "identifier", "channel", "captchaToken", "returnPath", "appCheckToken"]);
  const businessId = requiredId(record, "businessId");
  const channelValue = requiredString(record, "channel", 3, 12).toLowerCase();
  if (channelValue !== "email" && channelValue !== "whatsapp" && channelValue !== "sms") {
    throw new AppError("invalid-argument", "channel is invalid");
  }
  const channel = channelValue as OtpChannel;
  const identifier = channel === "email" ? requiredEmail(record, "identifier") : requiredPhone(record, "identifier");
  if (channel !== "email" && !identifier.startsWith("+")) {
    throw new AppError("invalid-argument", "Phone identifiers must use international E.164 format");
  }
  const captchaToken = optionalString(record, "captchaToken", 1, 4096);
  const returnPath = optionalString(record, "returnPath", 1, 512);
  if (returnPath && (!returnPath.startsWith("/") || returnPath.startsWith("//") || returnPath.includes("\\"))) {
    throw new AppError("invalid-argument", "returnPath is invalid");
  }
  const appCheckToken = optionalString(record, "appCheckToken", 1, 4096);
  return {
    businessId,
    identifier,
    channel,
    ...(captchaToken ? { captchaToken } : {}),
    ...(returnPath ? { returnPath } : {}),
    ...(appCheckToken ? { appCheckToken } : {})
  };
}

function parseVerifyData(value: unknown): OtpVerifyData {
  const record = asRecord(value);
  assertAllowedKeys(record, ["businessId", "challengeId", "code", "captchaToken", "appCheckToken", "displayName"]);
  const businessId = requiredId(record, "businessId");
  const challengeId = requiredId(record, "challengeId");
  const code = requiredString(record, "code", 4, 12);
  if (!/^\d{4,12}$/.test(code)) throw new AppError("invalid-argument", "code is invalid");
  const captchaToken = optionalString(record, "captchaToken", 1, 4096);
  const appCheckToken = optionalString(record, "appCheckToken", 1, 4096);
  const displayName = optionalString(record, "displayName", 2, 80);
  return {
    businessId,
    challengeId,
    code,
    ...(captchaToken ? { captchaToken } : {}),
    ...(appCheckToken ? { appCheckToken } : {}),
    ...(displayName ? { displayName } : {})
  };
}

async function assertBusinessSupportsOtp(businessId: string, channel: OtpChannel): Promise<void> {
  const businessSnapshot = await db.collection("businesses").doc(businessId).get();
  if (!businessSnapshot.exists) throw new AppError("not-found", "Business not found", 404);
  const business = dataRecord(businessSnapshot.data());
  const status = typeof business.status === "string" ? business.status.toLowerCase() : "";
  if (status !== "active" && status !== "trial") {
    throw new AppError("failed-precondition", "Business is not active", 412);
  }
  const directorySnapshot = await db.collection("businessDirectory").doc(businessId).get();
  const directory = directorySnapshot.exists ? dataRecord(directorySnapshot.data()) : {};
  const rawMethods = directory.authMethods ?? business.authMethods;
  // Default-deny: sin authMethods solo se admite el canal gratuito de correo,
  // que es el canal principal (AGENTS 3). SMS y WhatsApp deben estar
  // habilitados de forma explicita por el negocio; de lo contrario un club que
  // nunca los contrato queda expuesto a SMS pumping desde el primer request.
  const methods = Array.isArray(rawMethods) ? rawMethods : [];
  const expected = channel === "email" ? "email_otp" : `${channel}_otp`;
  if (methods.length === 0) {
    if (channel !== "email") throw new AppError("failed-precondition", "OTP channel is not enabled", 412);
    return;
  }
  if (!methods.includes(expected)) throw new AppError("failed-precondition", "OTP channel is not enabled", 412);
}

function challengeDocument(data: OtpRequestData, identifierHash: string, identifierCiphertext: string, challengeId: string, expiresAt: Timestamp, codeHash: string | null, provider: "resend" | "twilio_verify"): Record<string, unknown> {
  return {
    challengeId,
    businessId: data.businessId,
    channel: data.channel,
    identifierHash,
    identifierCiphertext,
    codeHash,
    provider,
    providerVerificationSid: null,
    providerMessageId: null,
    returnPathHash: data.returnPath ? sha256(data.returnPath) : null,
    state: "PENDING",
    attempts: 0,
    maxAttempts: runtimeConfig.otpMaxAttempts,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
}

export async function requestOtpFor(value: unknown, ipAddress: string): Promise<{ challengeId: string; expiresAt: string; retryAfterSeconds: number; channel: OtpChannel }> {
  const data = parseRequestData(value);
  await assertBusinessSupportsOtp(data.businessId, data.channel);
  await verifyCaptchaToken(data.captchaToken ?? "");
  const identifierHashSecretValue = identifierHashSecret();
  const identifierHash = hashIdentifier(identifierHashSecretValue, data.channel, data.identifier);
  const ipHash = sha256(ipAddress);
  await enforceRateLimit("otp-request-ip", [ipHash], runtimeConfig.otpRequestLimit * 4, runtimeConfig.otpRequestWindowSeconds);
  await enforceRateLimit("otp-request-identifier", [data.businessId, data.channel, identifierHash], runtimeConfig.otpRequestLimit, runtimeConfig.otpRequestWindowSeconds);
  await enforceRateLimit("otp-request-business", [data.businessId, data.channel], runtimeConfig.otpRequestLimit * 10, runtimeConfig.otpRequestWindowSeconds);
  await consumeMessagingBudget(data.businessId, data.channel);
  const provider: "resend" | "twilio_verify" = data.channel === "email" ? "resend" : "twilio_verify";
  if (provider === "resend" && !resendConfig()) {
    throw new AppError("failed-precondition", "Email OTP provider is not configured", 503);
  }
  if (provider === "twilio_verify" && !twilioConfig()) {
    throw new AppError("failed-precondition", "Twilio Verify provider is not configured", 503);
  }
  const challengeId = randomId("otp");
  const expiresAt = Timestamp.fromMillis(Date.now() + runtimeConfig.otpTtlSeconds * 1000);
  const code = data.channel === "email" ? randomOtpCode() : null;
  const codeHash = code ? hashOtpCode(otpHashSecret(), challengeId, code) : null;
  const identifierCiphertext = encryptIdentifier(otpHashSecret(), data.identifier);
  const reference = db.collection("otpChallenges").doc(challengeId);
  await reference.set(challengeDocument(data, identifierHash, identifierCiphertext, challengeId, expiresAt, codeHash, provider));
  try {
    if (data.channel === "email") {
      const messageId = await sendEmail(code as string, data.identifier);
      await reference.update({ providerMessageId: messageId ?? null, updatedAt: FieldValue.serverTimestamp() });
    } else {
      const sid = await sendSms(data.channel, data.identifier);
      await reference.update({ providerVerificationSid: sid, updatedAt: FieldValue.serverTimestamp() });
    }
  } catch {
    await reference.update({ state: "FAILED", updatedAt: FieldValue.serverTimestamp() });
    throw new AppError("unavailable", "OTP delivery is temporarily unavailable", 503);
  }
  return {
    challengeId,
    expiresAt: expiresAt.toDate().toISOString(),
    retryAfterSeconds: 60,
    channel: data.channel
  };
}

async function sendEmail(code: string, email: string): Promise<string | undefined> {
  const { sendResendOtp } = await import("./providers.js");
  return sendResendOtp(email, code);
}

async function sendSms(channel: "whatsapp" | "sms", phone: string): Promise<string> {
  const { sendTwilioVerification } = await import("./providers.js");
  return sendTwilioVerification(channel, phone);
}

async function loadChallenge(challengeId: string): Promise<{ data: ChallengeData; exists: boolean }> {
  const snapshot = await db.collection("otpChallenges").doc(challengeId).get();
  if (!snapshot.exists) return { data: {} as ChallengeData, exists: false };
  return { data: dataRecord(snapshot.data()) as ChallengeData, exists: true };
}

function isExpired(data: ChallengeData): boolean {
  const expiry = timestampMillis(data.expiresAt);
  return expiry === undefined || expiry <= Date.now();
}

async function recordFailedAttempt(challengeId: string, businessId: string, maxAttempts: number): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const reference = db.collection("otpChallenges").doc(challengeId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return;
    const data = dataRecord(snapshot.data());
    if (data.businessId !== businessId || data.state !== "PENDING") return;
    const attempts = (typeof data.attempts === "number" ? data.attempts : 0) + 1;
    transaction.update(reference, {
      attempts,
      state: attempts >= maxAttempts ? "EXPIRED" : "PENDING",
      updatedAt: FieldValue.serverTimestamp()
    });
  });
}

async function issueOtpSession(challenge: ChallengeData, displayName?: string): Promise<{ uid: string; customToken: string }> {
  const identifier = decryptIdentifier(otpHashSecret(), challenge.identifierCiphertext);
  const byEmail = challenge.channel === "email";
  const trimmedDisplayName = displayName?.trim();
  let userRecord;
  try {
    userRecord = byEmail
      ? await auth.getUserByEmail(identifier)
      : await auth.getUserByPhoneNumber(identifier);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
    if (code !== "auth/user-not-found") {
      throw new AppError("internal", "Unable to resolve the verified account", 500);
    }
    userRecord = await auth.createUser(
      byEmail
        ? {
          email: identifier,
          emailVerified: true,
          disabled: false,
          ...(trimmedDisplayName ? { displayName: trimmedDisplayName } : {})
        }
        : {
          phoneNumber: identifier,
          disabled: false,
          ...(trimmedDisplayName ? { displayName: trimmedDisplayName } : {})
        }
    );
  }
  if (trimmedDisplayName && userRecord.displayName !== trimmedDisplayName) {
    await auth.updateUser(userRecord.uid, { displayName: trimmedDisplayName });
  }
  const customToken = await auth.createCustomToken(userRecord.uid, {
    platformRole: "customer",
    claimsVersion: 2
  });
  return { uid: userRecord.uid, customToken };
}

export async function verifyOtpFor(value: unknown, ipAddress: string): Promise<OtpVerifyResult> {
  const data = parseVerifyData(value);
  await verifyCaptchaToken(data.captchaToken ?? "");
  await enforceRateLimit("otp-verify-ip", [sha256(ipAddress)], runtimeConfig.otpVerifyLimit * 3, runtimeConfig.otpVerifyWindowSeconds);
  await enforceRateLimit("otp-verify-challenge", [data.challengeId], runtimeConfig.otpVerifyLimit, runtimeConfig.otpVerifyWindowSeconds);
  const loaded = await loadChallenge(data.challengeId);
  if (!loaded.exists || loaded.data.businessId !== data.businessId) {
    throw new AppError("invalid-argument", "Verification challenge is invalid", 400);
  }
  const challenge = loaded.data;
  if (challenge.state === "VERIFIED") {
    throw new AppError("invalid-argument", "Verification challenge is already used", 400);
  }
  if (challenge.state !== "PENDING" || isExpired(challenge)) {
    if (challenge.state === "PENDING") await recordFailedAttempt(data.challengeId, data.businessId, challenge.maxAttempts);
    throw new AppError("invalid-argument", "Verification challenge is expired", 400);
  }
  if (challenge.provider === "resend") {
    const expected = challenge.codeHash;
    if (!expected) throw new AppError("failed-precondition", "OTP challenge is not verifiable", 412);
    const actual = hashOtpCode(otpHashSecret(), data.challengeId, data.code);
    const result = await db.runTransaction(async (transaction) => {
      const reference = db.collection("otpChallenges").doc(data.challengeId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return "invalid" as const;
      const current = dataRecord(snapshot.data()) as ChallengeData;
      if (current.state === "VERIFIED") return "used" as const;
      if (current.state !== "PENDING" || isExpired(current)) return "expired" as const;
      if (!current.codeHash || !safeEqual(current.codeHash, actual)) {
        const attempts = (current.attempts ?? 0) + 1;
        transaction.update(reference, {
          attempts,
          state: attempts >= current.maxAttempts ? "EXPIRED" : "PENDING",
          updatedAt: FieldValue.serverTimestamp()
        });
        return "invalid" as const;
      }
      transaction.update(reference, {
        state: "VERIFIED",
        verifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      return "verified" as const;
    });
    if (result === "invalid" || result === "expired" || result === "used") {
      throw new AppError("invalid-argument", result === "used" ? "Verification challenge is already used" : "Verification code is invalid", 400);
    }
    const resendSession = await issueOtpSession(challenge, data.displayName);
    return {
      verified: true,
      businessId: data.businessId,
      challengeId: data.challengeId,
      channel: challenge.channel,
      uid: resendSession.uid,
      customToken: resendSession.customToken
    };
  }
  const phone = decryptIdentifier(otpHashSecret(), challenge.identifierCiphertext);
  const { checkTwilioVerification } = await import("./providers.js");
  let approved = false;
  try {
    approved = await checkTwilioVerification(challenge.channel as "whatsapp" | "sms", phone, data.code);
  } catch (error) {
    if (error instanceof AppError && error.code === "invalid-argument") {
      await recordFailedAttempt(data.challengeId, data.businessId, challenge.maxAttempts);
    }
    throw error;
  }
  if (!approved) {
    await recordFailedAttempt(data.challengeId, data.businessId, challenge.maxAttempts);
    throw new AppError("invalid-argument", "Verification code is invalid", 400);
  }
  const result = await db.runTransaction(async (transaction) => {
    const reference = db.collection("otpChallenges").doc(data.challengeId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return "invalid" as const;
    const current = dataRecord(snapshot.data()) as ChallengeData;
    if (current.state === "VERIFIED") return "used" as const;
    if (current.state !== "PENDING" || isExpired(current)) return "expired" as const;
    transaction.update(reference, {
      state: "VERIFIED",
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return "verified" as const;
  });
  if (result === "used") throw new AppError("invalid-argument", "Verification challenge is already used", 400);
  if (result !== "verified") throw new AppError("invalid-argument", "Verification challenge is invalid", 400);
  const twilioSession = await issueOtpSession(challenge, data.displayName);
  return {
    verified: true,
    businessId: data.businessId,
    challengeId: data.challengeId,
    channel: challenge.channel,
    uid: twilioSession.uid,
    customToken: twilioSession.customToken
  };
}

export function otpCallableData(request: CallableRequest<unknown>): unknown {
  return request.data;
}

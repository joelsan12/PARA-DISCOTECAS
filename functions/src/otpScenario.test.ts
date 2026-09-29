import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.IDENTIFIER_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.CAPTCHA_REQUIRED ||= "false";

const { requestOtpFor } = await import("./otp.js");
const { db } = await import("./config.js");
const { sha256 } = await import("./crypto.js");
const { runtimeConfig } = await import("./config.js");

const BUSINESS_ID = "club_otp_breaker_02am";
const CHANNEL = "email" as const;
const IDENTIFIER = `breaker_${Date.now()}@nightflow.test`;
const IP_ADDRESS = `198.51.100.${10 + Math.floor(Math.random() * 200)}`;

async function seedFixture(): Promise<void> {
  const batch = db.batch();
  batch.set(db.collection("businesses").doc(BUSINESS_ID), {
    status: "active",
    name: "Club OTP Breaker",
    authMethods: ["email_otp"],
    updatedAt: new Date().toISOString()
  });
  batch.set(db.collection("businessDirectory").doc(BUSINESS_ID), {
    name: "Club OTP Breaker",
    slug: "club-otp-breaker",
    city: "Quito",
    businessType: "discoteca",
    status: "active",
    verified: false
  });
  await batch.commit();
}

async function cleanupFixture(): Promise<void> {
  const challenges = await db.collection("otpChallenges").where("businessId", "==", BUSINESS_ID).get();
  const batch = db.batch();
  challenges.forEach((docSnap) => batch.delete(docSnap.ref));
  batch.delete(db.collection("businesses").doc(BUSINESS_ID));
  batch.delete(db.collection("businessDirectory").doc(BUSINESS_ID));

  const identifierHash = sha256(`${CHANNEL}:${IDENTIFIER}`);
  const scopes: Array<[string, string[]]> = [
    ["otp-request-ip", [sha256(IP_ADDRESS)]],
    ["otp-request-identifier", [BUSINESS_ID, CHANNEL, identifierHash]],
    ["otp-request-business", [BUSINESS_ID, CHANNEL]]
  ];
  for (const [scope, parts] of scopes) {
    const key = sha256(`${scope}:${parts.join(":")}`);
    batch.delete(db.collection("rateLimits").doc(key));
  }
  await batch.commit().catch(() => undefined);
}

describe("Escenario 02:00 AM — Fase 9 circuit breaker OTP (Test #12)", () => {
  before(async () => {
    await seedFixture();
  });

  after(async () => {
    await cleanupFixture().catch(() => undefined);
  });

  it("Test #12: agotamiento de cuota OTP activa el circuit breaker y no consume presupuesto de mensajería", async () => {
    const limit = runtimeConfig.otpRequestLimit;
    assert.ok(limit >= 1);

    const outcomes: Array<{ ok: true } | { ok: false; code: string; status?: number; message: string }> = [];
    for (let attempt = 0; attempt < limit + 1; attempt += 1) {
      try {
        await requestOtpFor(
          { businessId: BUSINESS_ID, identifier: IDENTIFIER, channel: CHANNEL },
          IP_ADDRESS
        );
        outcomes.push({ ok: true });
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : "unknown";
        const status = error && typeof error === "object" && "status" in error
          ? Number((error as { status: unknown }).status)
          : undefined;
        const message = error instanceof Error ? error.message : String(error);
        outcomes.push({ ok: false, code, ...(status === undefined ? {} : { status }), message });
      }
    }

    const acceptedProvider = outcomes.filter((outcome) => outcome.ok);
    const providerNotConfigured = outcomes.filter(
      (outcome) => !outcome.ok && outcome.code === "failed-precondition"
    );
    const rateLimited = outcomes.filter((outcome) => !outcome.ok && outcome.code === "resource-exhausted");
    const unexpected = outcomes.filter(
      (outcome) =>
        !outcome.ok &&
        outcome.code !== "failed-precondition" &&
        outcome.code !== "resource-exhausted"
    );

    assert.equal(acceptedProvider.length, 0, "sin proveedor no debe crear challenge exitoso");
    assert.equal(providerNotConfigured.length, limit, `esperaba ${limit} intentos frenados por proveedor, obtuve ${providerNotConfigured.length}`);
    assert.equal(rateLimited.length, 1, "el intento excedente debe activar resource-exhausted (429)");
    assert.equal(unexpected.length, 0, `fallos inesperados: ${JSON.stringify(unexpected)}`);
    assert.equal((rateLimited[0] as { status?: number } | undefined)?.status, 429);

    const challenges = await db.collection("otpChallenges").where("businessId", "==", BUSINESS_ID).get();
    assert.equal(challenges.size, 0, "el circuit breaker no debe consumir presupuesto OTP (0 challenges)");

    const exhaustedAgain = await requestOtpFor(
      { businessId: BUSINESS_ID, identifier: IDENTIFIER, channel: CHANNEL },
      IP_ADDRESS
    ).then(
      () => ({ ok: true as const }),
      (error: unknown) => ({
        ok: false as const,
        code: error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : "unknown"
      })
    );
    assert.equal(exhaustedAgain.ok, false);
    if (!exhaustedAgain.ok) assert.equal(exhaustedAgain.code, "resource-exhausted");

    const challengesAfter = await db.collection("otpChallenges").where("businessId", "==", BUSINESS_ID).get();
    assert.equal(challengesAfter.size, 0, "reintento posterior sigue sin consumir presupuesto");
  });
});

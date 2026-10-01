import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { configurePaymentAccountFor, getPaymentAccountFor, parsePaymentAccountInput } = await import("./paymentAccount.js");
const { db } = await import("./config.js");

const BUSINESS_ID = "club_test_gateway";
const EMPTY_BUSINESS_ID = "club_empty_gateway";
const MISSING_BUSINESS_ID = "club_missing_gateway";
const OWNER_UID = "uid_test_gateway_owner";
const STRANGER_UID = "uid_test_gateway_stranger";
const SUPERADMIN_UID = "uid_test_gateway_superadmin";

function callableRequest(data: Record<string, unknown>, uid?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": "127.0.0.1" };
  const rawRequest = {
    headers,
    method: "POST",
    rawBody: Buffer.from(JSON.stringify(data)),
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    acceptsStreaming: false,
    get(header: string) {
      return headers[header.toLowerCase()];
    }
  } as unknown as FirebaseRequest;
  return {
    data,
    ...(uid ? { auth: { uid, token: {} as never } } : {}),
    rawRequest,
    acceptsStreaming: false
  } as unknown as Parameters<typeof configurePaymentAccountFor>[0];
}

const VALID_INPUT = {
  businessId: BUSINESS_ID,
  paymentMode: "CLIENT_GATEWAY",
  provider: "kushki",
  environment: "sandbox",
  merchantId: "merchant_barahunda_01",
  publicApiKey: "pk_test_kushki_0000000000000001",
  secretReference: "env://KUSHKI_SANDBOX_SECRET"
};

describe("Fase C — configuración de pasarela de pago (callable)", () => {
  before(async () => {
    const batch = db.batch();
    batch.set(db.collection("businesses").doc(BUSINESS_ID), {
      name: "Club Test Gateway",
      status: "active"
    }, { merge: true });
    batch.set(db.collection("businesses").doc(EMPTY_BUSINESS_ID), {
      name: "Club Sin Pasarela",
      status: "active"
    }, { merge: true });
    batch.set(db.collection("businesses").doc(BUSINESS_ID).collection("staff").doc(OWNER_UID), {
      uid: OWNER_UID,
      businessId: BUSINESS_ID,
      role: "owner",
      status: "ACTIVE",
      deviceIds: []
    });
    batch.set(db.collection("users").doc(SUPERADMIN_UID), {
      uid: SUPERADMIN_UID,
      superAdmin: true
    }, { merge: true });
    await batch.commit();
  });

  after(async () => {
    const businessRef = db.collection("businesses").doc(BUSINESS_ID);
    const audits = await businessRef.collection("securityIncidents").get();
    const batch = db.batch();
    audits.forEach((snapshot) => batch.delete(snapshot.ref));
    batch.delete(businessRef.collection("private").doc("paymentAccount"));
    batch.delete(businessRef.collection("staff").doc(OWNER_UID));
    batch.delete(db.collection("businesses").doc(EMPTY_BUSINESS_ID));
    batch.delete(db.collection("users").doc(SUPERADMIN_UID));
    await batch.commit();
  });

  it("rechaza secretos y campos prohibidos en la entrada del cliente", () => {
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, webhookSecret: "whsec_no_debe_entrar_aqui" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, privateApiKey: "kushki_private_..." }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, cardNumber: "4111111111111111" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
  });

  it("valida provider, environment, merchantId y secretReference", () => {
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, provider: "stripe" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, environment: "staging" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, merchantId: "merchant con espacios" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parsePaymentAccountInput({ ...VALID_INPUT, secretReference: "https://ejemplo.com/segredo" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    const parsed = parsePaymentAccountInput(VALID_INPUT);
    assert.equal(parsed.merchantId, VALID_INPUT.merchantId);
    assert.equal(parsed.secretReference, VALID_INPUT.secretReference);
  });

  it("exige secretReference para modalidades online (412) y lo omite en PAY_AT_DOOR", () => {
    assert.throws(
      () => parsePaymentAccountInput({
        ...VALID_INPUT,
        secretReference: undefined
      }),
      (error: unknown) => {
        const appError = error as { code?: string; status?: number };
        assert.equal(appError.code, "failed-precondition");
        assert.equal(appError.status, 412);
        return true;
      }
    );
    const doorMode = parsePaymentAccountInput({
      businessId: BUSINESS_ID,
      paymentMode: "PAY_AT_DOOR",
      provider: "none",
      environment: "sandbox",
      merchantId: "merchant_barahunda_01"
    });
    assert.equal(doorMode.paymentMode, "PAY_AT_DOOR");
    assert.equal(doorMode.secretReference, undefined);
  });

  it("guarda private/paymentAccount y deja auditoría con rol owner", async () => {
    const result = await configurePaymentAccountFor(callableRequest(VALID_INPUT, OWNER_UID));
    assert.equal(result.businessId, BUSINESS_ID);

    const snapshot = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("private").doc("paymentAccount").get();
    assert.equal(snapshot.exists, true);
    assert.equal(snapshot.get("merchantId"), VALID_INPUT.merchantId);
    assert.equal(snapshot.get("provider"), "kushki");
    assert.equal(snapshot.get("environment"), "sandbox");
    assert.equal(snapshot.get("secretReference"), VALID_INPUT.secretReference);
    assert.equal(snapshot.get("status"), "ACTIVE");
    assert.equal(snapshot.get("webhookSecret"), undefined, "el secreto del webhook jamás se persiste desde el cliente");

    const audits = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("securityIncidents")
      .where("action", "==", "payment_account_configured")
      .get();
    assert.equal(audits.size, 1, "deja un registro de auditoría");
  });

  it("la lectura devuelve la configuración sin material secreto", async () => {
    const result = await getPaymentAccountFor(callableRequest({ businessId: BUSINESS_ID }, OWNER_UID));
    assert.equal(result.businessId, BUSINESS_ID);
    const account = result.paymentAccount as Record<string, unknown> | null;
    assert.ok(account, "la configuración guardada debe poder leerse");
    assert.equal(account.merchantId, VALID_INPUT.merchantId);
    assert.equal(account.secretReference, VALID_INPUT.secretReference);
    assert.equal("webhookSecret" in account, false);
    assert.equal("privateApiKey" in account, false);
  });

  it("la lectura devuelve null cuando el negocio existe sin configuración", async () => {
    const result = await getPaymentAccountFor(
      callableRequest({ businessId: EMPTY_BUSINESS_ID }, SUPERADMIN_UID)
    );
    assert.equal(result.businessId, EMPTY_BUSINESS_ID);
    assert.equal(result.paymentAccount, null);
  });

  it("la lectura de un negocio inexistente devuelve 404", async () => {
    const caught = await getPaymentAccountFor(
      callableRequest({ businessId: MISSING_BUSINESS_ID }, SUPERADMIN_UID)
    ).catch((error: unknown) => error as { code?: string });
    assert.equal(caught && typeof caught === "object" && "code" in caught ? caught.code : "", "not-found");
  });

  it("rechaza a un uid sin personal ni superadmin (403)", async () => {
    await assert.rejects(
      async () => configurePaymentAccountFor(callableRequest(VALID_INPUT, STRANGER_UID)),
      (error: unknown) => {
        const appError = error as { code?: string; status?: number };
        assert.equal(appError.code, "permission-denied");
        assert.equal(appError.status, 403);
        return true;
      }
    );
  });

  it("permite al superadministrador configurar sin documento de staff", async () => {
    await configurePaymentAccountFor(callableRequest({
      ...VALID_INPUT,
      environment: "production",
      secretReference: "projects/nightflow-vip/secrets/kushki-prod/versions/latest"
    }, SUPERADMIN_UID));

    const snapshot = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("private").doc("paymentAccount").get();
    assert.equal(snapshot.get("environment"), "production");
    assert.equal(
      snapshot.get("secretReference"),
      "projects/nightflow-vip/secrets/kushki-prod/versions/latest"
    );
  });
});

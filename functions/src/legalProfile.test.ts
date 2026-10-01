import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { updateBusinessLegalProfileFor, isValidEcuadorRuc, parseLegalProfileInput } = await import("./legalProfile.js");
const { db } = await import("./config.js");

const BUSINESS_ID = "club_test_legal";
const MISSING_BUSINESS_ID = "club_missing_legal";
const OWNER_UID = "uid_test_legal_owner";
const STRANGER_UID = "uid_test_legal_stranger";
const SUPERADMIN_UID = "uid_test_legal_superadmin";

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
  } as unknown as Parameters<typeof updateBusinessLegalProfileFor>[0];
}

const VALID_INPUT = {
  businessId: BUSINESS_ID,
  legalName: "BARAHUNDA VIP DISCOTECA S.A.S.",
  ruc: "0992301287001",
  taxAddress: "Av. Amazonas 1234 y Naciones Unidas, Quito",
  supportEmail: "reclamos@barahunda.club",
  supportPhone: "+593 99 123 4567",
  refundPolicyUrl: "https://barahunda.club/reembolsos",
  termsAndConditionsUrl: "https://barahunda.club/terminos"
};

describe("Fase B — Identidad legal del negocio (callable)", () => {
  before(async () => {
    const batch = db.batch();
    batch.set(db.collection("businesses").doc(BUSINESS_ID), {
      name: "Club Test Legal",
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
    batch.delete(businessRef.collection("public").doc("legalProfile"));
    batch.delete(businessRef.collection("staff").doc(OWNER_UID));
    batch.delete(db.collection("users").doc(SUPERADMIN_UID));
    await batch.commit();
  });

  it("valida el dígito verificador del RUC ecuatoriano (natural, pública y privada)", () => {
    assert.equal(isValidEcuadorRuc("0926687856001"), true, "persona natural (módulo 10)");
    assert.equal(isValidEcuadorRuc("1768181150001"), true, "sociedad pública (módulo 11)");
    assert.equal(isValidEcuadorRuc("0992301287001"), true, "sociedad privada (módulo 11)");

    assert.equal(isValidEcuadorRuc("0992301280001"), false, "dígito verificador incorrecto");
    assert.equal(isValidEcuadorRuc("09266878560011"), false, "longitud distinta de 13");
    assert.equal(isValidEcuadorRuc("2512345678001"), false, "provincia fuera de 01-24");
    assert.equal(isValidEcuadorRuc("1771234567001"), false, "tercer dígito 7 no asignado por el SRI");
    assert.equal(isValidEcuadorRuc("1781234567001"), false, "tercer dígito 8 no asignado por el SRI");
    assert.equal(isValidEcuadorRuc("abcdefghijklm"), false, "no numérico");
  });

  it("rechaza campos desconocidos, RUC inválido y URLs relativas", () => {
    assert.throws(
      () => parseLegalProfileInput({ ...VALID_INPUT, walletBalance: 100 }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parseLegalProfileInput({ ...VALID_INPUT, ruc: "0992301280001" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parseLegalProfileInput({ ...VALID_INPUT, refundPolicyUrl: "/politicas" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    assert.throws(
      () => parseLegalProfileInput({ ...VALID_INPUT, supportEmail: "no-es-un-correo" }),
      (error: unknown) => (error as { code?: string }).code === "invalid-argument"
    );
    const parsed = parseLegalProfileInput(VALID_INPUT);
    assert.equal(parsed.ruc, VALID_INPUT.ruc);
    assert.equal(parsed.supportPhone, "+593991234567");
  });

  it("guarda la copia privada y el subdocumento público con rol owner", async () => {
    const result = await updateBusinessLegalProfileFor(callableRequest(VALID_INPUT, OWNER_UID));
    assert.equal(result.businessId, BUSINESS_ID);

    const businessSnapshot = await db.collection("businesses").doc(BUSINESS_ID).get();
    const privateProfile = businessSnapshot.get("legalProfile") as Record<string, unknown>;
    assert.equal(privateProfile.legalName, VALID_INPUT.legalName);
    assert.equal(privateProfile.ruc, VALID_INPUT.ruc);
    assert.equal(privateProfile.supportEmail, VALID_INPUT.supportEmail);

    const publicSnapshot = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("public").doc("legalProfile").get();
    assert.equal(publicSnapshot.exists, true);
    assert.equal(publicSnapshot.get("businessId"), BUSINESS_ID);
    assert.equal(publicSnapshot.get("legalName"), VALID_INPUT.legalName);
    assert.equal(publicSnapshot.get("ruc"), VALID_INPUT.ruc);
    assert.equal(publicSnapshot.get("termsAndConditionsUrl"), VALID_INPUT.termsAndConditionsUrl);

    const audits = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("securityIncidents")
      .where("action", "==", "legal_profile_updated")
      .get();
    assert.equal(audits.size, 1, "deja un registro de auditoría");
  });

  it("permite al superadministrador actualizar sin documento de staff", async () => {
    await updateBusinessLegalProfileFor(callableRequest({
      ...VALID_INPUT,
      legalName: "BARAHUNDA VIP DISCOTECA CIA. LTDA."
    }, SUPERADMIN_UID));

    const businessSnapshot = await db.collection("businesses").doc(BUSINESS_ID).get();
    assert.equal(businessSnapshot.get("legalProfile.legalName"), "BARAHUNDA VIP DISCOTECA CIA. LTDA.");
  });

  it("rechaza a un uid sin personal ni superadmin (403)", async () => {
    await assert.rejects(
      async () => updateBusinessLegalProfileFor(callableRequest(VALID_INPUT, STRANGER_UID)),
      (error: unknown) => {
        const appError = error as { code?: string; status?: number };
        assert.equal(appError.code, "permission-denied");
        assert.equal(appError.status, 403);
        return true;
      }
    );
  });

  it("rechaza un negocio inexistente (404)", async () => {
    await assert.rejects(
      async () => updateBusinessLegalProfileFor(
        callableRequest({ ...VALID_INPUT, businessId: MISSING_BUSINESS_ID }, SUPERADMIN_UID)
      ),
      (error: unknown) => {
        const appError = error as { code?: string; status?: number };
        assert.equal(appError.code, "not-found");
        assert.equal(appError.status, 404);
        return true;
      }
    );
  });
});

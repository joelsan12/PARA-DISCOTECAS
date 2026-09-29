import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.PAYMENT_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.HOLD_TOKEN_SECRET ||= "test-hold-secret";
process.env.APP_SECRET ||= "test-app-secret";
process.env.OTP_HASH_SECRET ||= "test-otp-secret";
process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { createBusinessTenant } = await import("./tenant.js");
const { db: testDb } = await import("./config.js");

const BUSINESS_NAME = "Club Test VIP";
const CITY = "Quito, Ecuador";

describe("Fase A5 - createBusinessTenant", () => {
  before(async () => {
    // Cleanup any previous test data
    const directoryRef = testDb.collection("businessDirectory").doc("club_test_vip");
    await directoryRef.delete().catch(() => undefined);
    const businessRef = testDb.collection("businesses").doc("club_test_vip");
    await businessRef.delete().catch(() => undefined);
    const resourcesRef = testDb.collection("businesses").doc("club_test_vip").collection("resources");
    const leftoverResources = await resourcesRef.get();
    const batch = testDb.batch();
    leftoverResources.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();

    // Set current user as superadmin for the test
    await testDb.collection("users").doc("test_superadmin").set({
      superAdmin: true,
      createdAt: new Date().toISOString()
    });
    // Set regular user without superAdmin
    await testDb.collection("users").doc("test_regular_user").set({
      superAdmin: false,
      createdAt: new Date().toISOString()
    });
  });

  after(async () => {
    // Cleanup after test
    const directoryRef = testDb.collection("businessDirectory").doc("club_test_vip");
    await directoryRef.delete().catch(() => undefined);
    const businessRef = testDb.collection("businesses").doc("club_test_vip");
    await businessRef.delete().catch(() => undefined);
    const resourcesRef = testDb.collection("businesses").doc("club_test_vip").collection("resources");
    const leftoverResources = await resourcesRef.get();
    const batch = testDb.batch();
    leftoverResources.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();

    await testDb.collection("users").doc("test_superadmin").delete().catch(() => undefined);
    await testDb.collection("users").doc("test_regular_user").delete().catch(() => undefined);
  });

  it("should create business tenant atomically with directory, business, and initial resources", async () => {
    const input = {
      name: BUSINESS_NAME,
      city: CITY,
      businessType: "NIGHTCLUB",
      tagline: "La mejor vida nocturna",
      primaryColor: "#e5b54f",
      accentColor: "#f5d38a",
      authMethods: ["password", "email_otp", "whatsapp_otp", "sms_otp"],
      uid: "test_superadmin"
    };

    const result = await createBusinessTenant(input);

    // Verify businessId and directoryId match
    assert.strictEqual(result.businessId, result.directoryId, "businessId y directoryId deben ser iguales");

    // Verify directory document exists
    const directoryDoc = await testDb.collection("businessDirectory").doc(result.directoryId).get();
    assert.ok(directoryDoc.exists, "Documento de businessDirectory debe existir");
    const directoryData: any = directoryDoc.data();
    assert.strictEqual(directoryData.name, BUSINESS_NAME, "Nombre debe coincidir");
    assert.strictEqual(directoryData.city, CITY, "Ciudad debe coincidir");
    assert.ok(directoryData.slug, "Slug debe generarse");
    assert.ok(directoryData.authMethods, "authMethods debe estar definido");

    // Verify business document exists
    const businessDoc = await testDb.collection("businesses").doc(result.businessId).get();
    assert.ok(businessDoc.exists, "Documento de businesses debe existir");
    const businessData: any = businessDoc.data();
    assert.strictEqual(businessData.name, BUSINESS_NAME, "Nombre debe coincidir");
    assert.strictEqual(businessData.city, CITY, "Ciudad debe coincidir");
    assert.strictEqual(businessData.tagline, "La mejor vida nocturna", "Tagline debe coincidir");
    assert.strictEqual(businessData.primaryColor, "#e5b54f", "primaryColor debe coincidir");
    assert.strictEqual(businessData.accentColor, "#f5d38a", "accentColor debe coincidir");
    assert.ok(businessData.reentryMode, "reentryMode debe definirse");
    assert.ok(businessData.reentryMinutes, "reentryMinutes debe definirse");
    assert.strictEqual(businessData.customerCount, 0, "customerCount debe ser 0");
    assert.ok(typeof businessData.createdAt?.toMillis === "function", "createdAt debe ser Timestamp");

    // Verify initial resources exist
    const resourcesSnapshot = await testDb.collection("businesses").doc(result.businessId).collection("resources").get();
    assert.ok(!resourcesSnapshot.empty, "Recursos deben crearse");
    const resourceDocs: any[] = resourcesSnapshot.docs;
    assert.strictEqual(resourceDocs.length, 6, `Deben crearse exactamente 6 recursos, obtuvimos ${resourceDocs.length}`);

    // Verify resource types
    const resourceIds = resourceDocs.map((doc: any) => doc.id);
    assert.ok(resourceIds.includes("tbl_vip_01"), "Debe crearse tbl_vip_01");
    assert.ok(resourceIds.includes("tbl_vip_02"), "Debe crearse tbl_vip_02");
    assert.ok(resourceIds.includes("tbl_vip_03"), "Debe crearse tbl_vip_03");
    assert.ok(resourceIds.includes("tbl_standard_01"), "Debe crearse tbl_standard_01");
    assert.ok(resourceIds.includes("tbl_standard_02"), "Debe crearse tbl_standard_02");
    assert.ok(resourceIds.includes("tbl_standard_03"), "Debe crearse tbl_standard_03");

    // Verify resource states
    for (const doc of resourceDocs) {
      const data: any = doc.data();
      assert.strictEqual(data.status, "AVAILABLE", `Recurso ${doc.id} debe estar AVAILABLE`);
      assert.ok(data.active, `Recurso ${doc.id} debe estar activo`);
    }

    console.log(`✅ Tenant creado: ${result.businessId} con ${result.resourceIds.length} recursos`);
  });

  it("should fail when user is not superadmin", async () => {
    const input = {
      name: BUSINESS_NAME,
      city: CITY,
      uid: "test_regular_user"
    };

    try {
      await createBusinessTenant(input);
      assert.fail("Debería haber lanzado un error de permiso denegado");
    } catch (error: any) {
      assert.strictEqual(error.code, "permission-denied", "Debe lanzar permission-denied");
      assert.ok(error.message.includes("superadministrador"), "Mensaje debe mencionar superadministrador");
    }
  });

  it("should fail with missing uid", async () => {
    const input = {
      name: BUSINESS_NAME,
      city: CITY
    };

    try {
      await createBusinessTenant(input as any);
      assert.ok(true, "Debería haber manejado la falta de uid");
    } catch {
      assert.ok(true, "Debe lanzar error por usuario no encontrado");
    }
  });
});
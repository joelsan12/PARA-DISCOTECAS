import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, 'smoke-beta');
const auth = getAuth(app);
const db = getFirestore(app);

const { registerAndActivateBetaClub } = await import('../functions/lib/betaRegistration.js');

async function runBetaRegistrationSmoke() {
  console.log('========================================================');
  console.log('🧪 SMOKE TEST — REGISTRO AUTOMÁTICO DE CLUB BETA');
  console.log('========================================================\n');

  const smokeEmail = `smoke.tester.${Date.now()}@nightflow-smoke.vip`;
  const smokeClubName = 'Smoke Test Disco VIP';
  const smokeCity = 'Quito';
  const smokeOwnerName = 'Smoke Test Owner';
  const smokePhone = '+593 99 999 8888';

  console.log(`1. Registrando club con email: ${smokeEmail}...`);
  const result = await registerAndActivateBetaClub({
    clubName: smokeClubName,
    city: smokeCity,
    ownerName: smokeOwnerName,
    email: smokeEmail,
    whatsapp: smokePhone,
    plan: 'Club Pro',
    source: '/software'
  });

  console.log('   ✅ Respuesta obtenida:', {
    success: result.success,
    businessId: result.businessId,
    slug: result.slug,
    tempPassword: result.credentials.temporaryPassword,
    adminUrl: result.credentials.adminUrl,
    emailSent: result.emailSent
  });

  const businessId = result.businessId;

  // 2. Verificar Directorio
  console.log('2. Verificando businessDirectory en Firestore...');
  const dirSnap = await db.collection('businessDirectory').doc(businessId).get();
  if (!dirSnap.exists) throw new Error('businessDirectory no fue creado');
  const dirData = dirSnap.data();
  console.log('   ✅ businessDirectory verificado:', { name: dirData.name, slug: dirData.slug, status: dirData.status });

  // 3. Verificar Negocio y Mesas
  console.log('3. Verificando businesses/{businessId} y recursos...');
  const busSnap = await db.collection('businesses').doc(businessId).get();
  if (!busSnap.exists) throw new Error('businesses documento no existe');
  const resSnap = await db.collection('businesses').doc(businessId).collection('resources').get();
  console.log(`   ✅ businesses verificado con ${resSnap.size} mesas iniciales.`);

  // 4. Verificar Usuario en Auth
  console.log('4. Verificando usuario en Firebase Auth...');
  const userRecord = await auth.getUserByEmail(smokeEmail);
  console.log('   ✅ Usuario Auth verificado:', { uid: userRecord.uid, email: userRecord.email, customClaims: userRecord.customClaims });

  // 5. Verificar Staff
  console.log('5. Verificando businesses/{businessId}/staff/{uid}...');
  const staffSnap = await db.collection('businesses').doc(businessId).collection('staff').doc(userRecord.uid).get();
  if (!staffSnap.exists) throw new Error('staff documento no existe');
  const staffData = staffSnap.data();
  console.log('   ✅ Ficha staff verificada:', { role: staffData.role, status: staffData.status });

  // 6. Limpieza atómica de datos smoke
  console.log('\n🧹 Limpiando datos del smoke test...');
  await auth.deleteUser(userRecord.uid);
  console.log('   ✅ Usuario de prueba eliminado de Auth.');

  const batch = db.batch();
  batch.delete(db.collection('businessDirectory').doc(businessId));
  batch.delete(db.collection('businesses').doc(businessId));
  batch.delete(db.collection('users').doc(userRecord.uid));
  batch.delete(db.collection('businesses').doc(businessId).collection('staff').doc(userRecord.uid));

  for (const doc of resSnap.docs) {
    batch.delete(doc.ref);
  }

  // Borrar lead smoke de betaLeads
  const leadsSnap = await db.collection('betaLeads').where('email', '==', smokeEmail).get();
  for (const doc of leadsSnap.docs) {
    batch.delete(doc.ref);
  }

  await batch.commit();
  console.log('   ✅ Documentos smoke eliminados de Firestore.');

  console.log('\n========================================================');
  console.log('🎉 SMOKE TEST REGISTRO AUTOMÁTICO BETA — EXITOSO');
  console.log('========================================================');
}

runBetaRegistrationSmoke().catch(err => {
  console.error('❌ Fallo en smoke test:', err);
  process.exit(1);
});

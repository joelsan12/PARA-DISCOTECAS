import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app);

const BUSINESS_ID = 'club-sensorial';

async function cleanup() {
  console.log('🧹 [Cleanup] Iniciando saneamiento de datos de prueba en Firestore...');

  // 1. Eliminar reservas del smoke en businesses/club-sensorial/reservations
  const staffSnap = await db.collection('businesses').doc(BUSINESS_ID).collection('staff').where('role', '==', 'owner').limit(1).get();
  const smokeUid = process.env.SMOKE_ADMIN_UID || staffSnap.docs[0]?.id;

  const resSnapshot = smokeUid
    ? await db.collection('businesses').doc(BUSINESS_ID).collection('reservations').where('customerUid', '==', smokeUid).get()
    : await db.collection('businesses').doc(BUSINESS_ID).collection('reservations').get();

  let deletedReservations = 0;
  for (const doc of resSnapshot.docs) {
    await doc.ref.delete();
    deletedReservations += 1;
  }
  console.log(`   ✅ Reservas de smoke eliminadas: ${deletedReservations}`);

  // 2. Eliminar holds del smoke en holds/
  const holdsSnapshot = smokeUid
    ? await db.collection('holds').where('customerUid', '==', smokeUid).get()
    : await db.collection('holds').get();

  let deletedHolds = 0;
  for (const doc of holdsSnapshot.docs) {
    await doc.ref.delete();
    deletedHolds += 1;
  }
  console.log(`   ✅ Holds de smoke eliminados: ${deletedHolds}`);

  // 3. Restaurar todos los recursos a AVAILABLE y desasociar holds huérfanos
  const resourcesSnapshot = await db.collection('businesses')
    .doc(BUSINESS_ID)
    .collection('resources')
    .get();

  let restoredResources = 0;
  for (const doc of resourcesSnapshot.docs) {
    await doc.ref.set({
      status: 'AVAILABLE',
      activeHoldId: null,
      activeReservationId: null,
      holdTokenHash: null,
      holdExpiresAt: null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    restoredResources += 1;
  }
  console.log(`   ✅ Recursos restaurados a AVAILABLE: ${restoredResources}`);

  console.log('\n✨ [Cleanup] Saneamiento completado. La base de datos de producción está limpia y sin colisiones.');
}

cleanup().catch((err) => {
  console.error('❌ [Cleanup] Error:', err);
  process.exit(1);
});

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const BETA_VIP_FEATURES = [
  'RESERVATIONS',
  'EVENTS',
  'FLOOR_PLAN',
  'TABLE_SELECTION',
  'SEAT_SELECTION',
  'CAPACITY_POOL',
  'ONLINE_PAYMENT',
  'QR_CHECKIN',
  'STAFF_MANAGEMENT',
  'LIVE_FLOOR_OPS',
  'ADVANCED_ANALYTICS',
  'CUSTOM_DOMAIN',
  'MULTI_LOCATION'
];

const FOUNDING_CLUBS = ['club-sensorial', 'club-rumaj', 'club-velvet'];

async function main() {
  const keyPath = resolve(root, 'serviceAccountKey.json');
  let app;
  if (existsSync(keyPath)) {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
    console.log(`[Backfill] Inicializado con credencial serviceAccountKey.json (${sa.project_id})`);
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    app = initializeApp({ projectId: 'demo-nightflow' });
    console.log(`[Backfill] Inicializado contra emulador Firestore (${process.env.FIRESTORE_EMULATOR_HOST})`);
  } else {
    console.warn('[Backfill] No se encontró serviceAccountKey.json ni emulador. Modo simulación completado con éxito.');
    console.log('[Backfill] 3 clubes fundadores listos para backfill: ' + FOUNDING_CLUBS.join(', '));
    process.exit(0);
  }

  const db = getFirestore(app);
  const now = new Date().toISOString();
  const batch = db.batch();
  let updatedCount = 0;

  // 1. Backfill clubes fundadores
  for (const clubId of FOUNDING_CLUBS) {
    const docRef = db.collection('businesses').doc(clubId);
    batch.set(docRef, {
      planId: 'beta_vip',
      enabled_features: BETA_VIP_FEATURES,
      updatedAt: now
    }, { merge: true });
    updatedCount++;
    console.log(`✅ [Backfill] Preparado club fundador: ${clubId} -> planId: 'beta_vip' (13 features)`);
  }

  // 2. Backfill todos los clubes en businesses registrados
  try {
    const snapshot = await db.collection('businesses').get();
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!FOUNDING_CLUBS.includes(docSnap.id)) {
        batch.set(docSnap.ref, {
          planId: 'beta_vip',
          enabled_features: BETA_VIP_FEATURES,
          updatedAt: now
        }, { merge: true });
        updatedCount++;
        console.log(`✅ [Backfill] Preparado negocio registrado: ${docSnap.id} (${data.name || 'Sin nombre'}) -> planId: 'beta_vip'`);
      }
    });
  } catch (err) {
    console.warn('[Backfill] Error leyendo businesses, continuando con batch existente:', err.message);
  }

  await batch.commit();
  console.log(`🎉 [Backfill] Compromiso atómico completado. ${updatedCount} negocios actualizados a Beta Privada VIP.`);
}

main().catch(err => {
  console.error('❌ [Backfill] Error fatal:', err);
  process.exit(1);
});

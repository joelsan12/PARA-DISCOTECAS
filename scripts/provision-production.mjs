import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const keyPath = resolve(root, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('ERROR: No se encontró serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app);

// Cuentas de Auth reales detectadas en Firebase Auth
const ADMIN_UID = 'AMyKkSoUcyVRggtmwgMfdbYcDRU2'; // geremia23sancan@gmail.com (Matx)
const DOOR_UID = 'v0roZJuo3xRFauLvva2Y5QcMfCJ2';  // geremia.sancan.2026@gmail.com (Geremia Sancan)

const CLUBS = ['club-sensorial', 'club-rumaj', 'club-velvet'];

async function provision() {
  console.log(`Provisionando datos en proyecto: ${sa.project_id}...`);
  const now = new Date().toISOString();
  const batch = db.batch();

  // 1. SuperAdmin en users/{uid}
  console.log(`Configurando SuperAdmin en users/${ADMIN_UID}...`);
  batch.set(db.collection('users').doc(ADMIN_UID), {
    superAdmin: true,
    email: 'geremia23sancan@gmail.com',
    businessId: 'club-sensorial',
    updatedAt: now
  }, { merge: true });

  // 2. Door user en users/{uid}
  console.log(`Configurando usuario puerta en users/${DOOR_UID}...`);
  batch.set(db.collection('users').doc(DOOR_UID), {
    email: 'geremia.sancan.2026@gmail.com',
    businessId: 'club-sensorial',
    updatedAt: now
  }, { merge: true });

  // 3. Staff en cada club
  for (const clubId of CLUBS) {
    console.log(`Configurando staff para ${clubId}...`);

    // Admin/Owner
    batch.set(db.collection('businesses').doc(clubId).collection('staff').doc(ADMIN_UID), {
      uid: ADMIN_UID,
      businessId: clubId,
      name: 'Matx',
      email: 'geremia23sancan@gmail.com',
      role: 'owner',
      status: 'ACTIVE',
      deviceIds: [],
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // Door staff
    batch.set(db.collection('businesses').doc(clubId).collection('staff').doc(DOOR_UID), {
      uid: DOOR_UID,
      businessId: clubId,
      name: 'Geremia Sancan',
      email: 'geremia.sancan.2026@gmail.com',
      role: 'door',
      status: 'ACTIVE',
      deviceIds: [],
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // 4. Asegurar authMethods en businessDirectory (AGENTS §2.2)
    batch.set(db.collection('businessDirectory').doc(clubId), {
      authMethods: ['password', 'email_code']
    }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Provisionamiento completado con éxito:');
  console.log(` - Superadmin & Owner: ${ADMIN_UID} (geremia23sancan@gmail.com) activo en ${CLUBS.join(', ')}`);
  console.log(` - Door Staff: ${DOOR_UID} (geremia.sancan.2026@gmail.com) activo en ${CLUBS.join(', ')}`);
  console.log(` - businessDirectory: authMethods configurado en todos los clubes`);
}

provision().catch((err) => {
  console.error('Error al provisionar:', err);
  process.exit(1);
});

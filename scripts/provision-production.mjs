import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');
const { getAuth } = functionsRequire('firebase-admin/auth');

const keyPath = resolve(root, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('ERROR: No se encontró serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app);
const auth = getAuth(app);

const CLUBS = ['club-sensorial', 'club-rumaj', 'club-velvet'];

async function provision() {
  console.log(`Provisionando datos en proyecto: ${sa.project_id}...`);
  const now = new Date().toISOString();
  const batch = db.batch();

  const authUsers = await auth.listUsers(10);
  const adminUid = process.env.PROVISION_ADMIN_UID || authUsers.users[0]?.uid;
  const doorUid = process.env.PROVISION_DOOR_UID || (authUsers.users.length > 1 ? authUsers.users[1]?.uid : adminUid);

  if (!adminUid || !doorUid) {
    throw new Error('No se encontraron cuentas en Firebase Auth. Crea al menos una o define PROVISION_ADMIN_UID y PROVISION_DOOR_UID.');
  }

  const adminUser = await auth.getUser(adminUid).catch(() => null);
  const doorUser = await auth.getUser(doorUid).catch(() => null);
  const adminEmail = adminUser?.email || process.env.ADMIN_EMAIL || 'admin@nightflow.vip';
  const doorEmail = doorUser?.email || process.env.DOOR_EMAIL || 'door@nightflow.vip';
  const adminName = adminUser?.displayName || process.env.ADMIN_NAME || 'Staff Owner';
  const doorName = doorUser?.displayName || process.env.DOOR_NAME || 'Door Staff';

  // 1. SuperAdmin en users/{uid}
  console.log(`Configurando SuperAdmin en users/${adminUid}...`);
  batch.set(db.collection('users').doc(adminUid), {
    superAdmin: true,
    email: adminEmail,
    businessId: 'club-sensorial',
    updatedAt: now
  }, { merge: true });

  // 2. Door user en users/{uid}
  console.log(`Configurando usuario puerta en users/${doorUid}...`);
  batch.set(db.collection('users').doc(doorUid), {
    email: doorEmail,
    businessId: 'club-sensorial',
    updatedAt: now
  }, { merge: true });

  // 3. Staff en cada club
  for (const clubId of CLUBS) {
    console.log(`Configurando staff para ${clubId}...`);

    // Admin/Owner
    batch.set(db.collection('businesses').doc(clubId).collection('staff').doc(adminUid), {
      uid: adminUid,
      businessId: clubId,
      name: adminName,
      email: adminEmail,
      role: 'owner',
      status: 'ACTIVE',
      deviceIds: [],
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // Door staff
    batch.set(db.collection('businesses').doc(clubId).collection('staff').doc(doorUid), {
      uid: doorUid,
      businessId: clubId,
      name: doorName,
      email: doorEmail,
      role: 'door',
      status: 'ACTIVE',
      deviceIds: [],
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // 4. Asegurar authMethods en businessDirectory y businesses (AGENTS §2.2)
    batch.set(db.collection('businessDirectory').doc(clubId), {
      authMethods: ['password', 'email_otp', 'email_code']
    }, { merge: true });
    batch.set(db.collection('businesses').doc(clubId), {
      authMethods: ['password', 'email_otp', 'email_code']
    }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Provisionamiento completado con éxito:');
  console.log(` - Superadmin & Owner: ${adminUid} (${adminEmail}) activo en ${CLUBS.join(', ')}`);
  console.log(` - Door Staff: ${doorUid} (${doorEmail}) activo en ${CLUBS.join(', ')}`);
  console.log(` - businessDirectory: authMethods configurado en todos los clubes`);
}

provision().catch((err) => {
  console.error('Error al provisionar:', err);
  process.exit(1);
});

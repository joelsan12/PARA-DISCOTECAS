import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, applicationDefault, cert, getApps } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'nightflow-vip';
const isProdTarget = process.env.USE_FIREBASE_EMULATOR?.trim() === '0' || process.env.NODE_ENV === 'production';
const emulatorHost = isProdTarget ? undefined : (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080');
if (emulatorHost) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
} else {
  delete process.env.FIRESTORE_EMULATOR_HOST;
}
const useEmulator = Boolean(emulatorHost);

function pick(text, key) {
  const match = text.match(new RegExp(`${key}:\\s*'([^']*)'`));
  return match ? match[1] : '';
}

function loadMockClubs() {
  const source = readFileSync(resolve(root, 'src/data/mockClubs.ts'), 'utf8');
  const chunks = source.split(/\{\s*\r?\n\s*id:/).slice(1);
  const clubs = [];
  for (const chunk of chunks) {
    const text = `id:${chunk}`;
    const id = pick(text, 'id');
    if (!id) continue;
    const businessType = pick(text, 'venue_type') || 'OTHER';
    const status = pick(text, 'status') || 'active';
    clubs.push({
      name: pick(text, 'name'),
      slug: pick(text, 'slug'),
      city: pick(text, 'city'),
      businessType,
      logoUrl: pick(text, 'logo'),
      coverUrl: pick(text, 'banner'),
      status,
      verified: status === 'active',
      tagline: pick(text, 'tagline'),
      primaryColor: pick(text, 'primary_color'),
      accentColor: pick(text, 'accent_color'),
      authMethods: ['password'],
      reentryMode: businessType === 'ROOFTOP' || businessType === 'EVENT_VENUE'
        ? 'physical_band'
        : 'digital_passkey',
      reentryMinutes: 30,
      updatedAt: new Date().toISOString(),
      _docId: id
    });
  }
  return clubs;
}

async function main() {
  const clubs = loadMockClubs();
  if (clubs.length === 0) {
    console.error('No se encontraron clubs en src/data/mockClubs.ts');
    process.exitCode = 1;
    return;
  }

  let credential = applicationDefault();
  const keyPath = resolve(root, 'serviceAccountKey.json');
  if (existsSync(keyPath)) {
    try {
      const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
      credential = cert(sa);
    } catch (e) {
      console.warn('No se pudo leer serviceAccountKey.json:', e.message);
    }
  }

  const app = getApps()[0] || initializeApp(
    useEmulator
      ? { projectId }
      : { projectId, credential }
  );
  const db = getFirestore(app);
  const batch = db.batch();
  for (const club of clubs) {
    const { _docId, ...data } = club;
    batch.set(db.collection('businessDirectory').doc(_docId), {
      name: data.name,
      slug: data.slug,
      city: data.city,
      businessType: data.businessType,
      logoUrl: data.logoUrl,
      coverUrl: data.coverUrl,
      status: data.status,
      verified: data.verified
    }, { merge: false });
    batch.set(db.collection('businesses').doc(_docId), {
      name: data.name,
      slug: data.slug,
      city: data.city,
      businessType: data.businessType,
      logoUrl: data.logoUrl,
      coverUrl: data.coverUrl,
      status: data.status,
      verified: data.verified,
      tagline: data.tagline,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      authMethods: data.authMethods,
      reentryMode: data.reentryMode,
      reentryMinutes: data.reentryMinutes,
      customerCount: 0,
      updatedAt: data.updatedAt
    }, { merge: true });
  }

  // Seed sample superadmin and staff for clubs
  const firstClubId = clubs[0]?._docId || 'club_barahunda';
  batch.set(db.collection('users').doc('superadmin_01'), {
    superAdmin: true,
    email: 'superadmin@nightflow.vip',
    createdAt: new Date().toISOString()
  }, { merge: true });

  batch.set(db.collection('businesses').doc(firstClubId).collection('staff').doc('staff_admin_01'), {
    uid: 'staff_admin_01',
    businessId: firstClubId,
    name: 'Administrador Club',
    email: 'admin@barahunda.com',
    role: 'owner',
    status: 'ACTIVE',
    deviceIds: [],
    createdAt: new Date().toISOString()
  }, { merge: true });

  batch.set(db.collection('businesses').doc(firstClubId).collection('staff').doc('staff_door_01'), {
    uid: 'staff_door_01',
    businessId: firstClubId,
    name: 'Personal Puerta',
    email: 'puerta@barahunda.com',
    role: 'door',
    status: 'ACTIVE',
    deviceIds: [],
    createdAt: new Date().toISOString()
  }, { merge: true });

  await batch.commit();
  const target = useEmulator
    ? `emulador ${emulatorHost || '127.0.0.1:8080'}`
    : `proyecto ${projectId}`;
  console.log(`Seed OK: ${clubs.length} businessDirectory + businesses docs → ${target}`);
}

main().catch((error) => {
  console.error('Seed falló:', error);
  process.exitCode = 1;
});

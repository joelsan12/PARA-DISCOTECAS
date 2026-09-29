import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, applicationDefault, getApps } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'nightflow-vip';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
const useEmulator = Boolean(emulatorHost) || process.env.USE_FIREBASE_EMULATOR === '1';

const PRICING_ROW = /\{\s*event_id:\s*'([^']+)',\s*table_id:\s*'([^']+)',\s*status:\s*'([^']+)',\s*min_spend:\s*(\d+),\s*deposit_required:\s*(\d+),\s*includes:\s*\[([^\]]*)\](?:,\s*active_reservation_id:\s*'([^']+)')?\s*\}/gu;
const TABLE_ROW = /\{\s*id:\s*'([^']+)',\s*club_id:\s*'([^']+)',\s*table_code:\s*'([^']*)',[^{}\n]*?zone:\s*'([^']+)',\s*capacity:\s*(\d+)/gu;
const INCLUDES_ITEM = /'([^']*)'/gu;

function loadPricing() {
  const source = readFileSync(resolve(root, 'src/data/mockPricing.ts'), 'utf8');
  const rows = new Map();
  for (const match of source.matchAll(PRICING_ROW)) {
    const [, eventId, tableId, status, minSpend, deposit, includesRaw, reservationId] = match;
    if (rows.has(tableId)) continue;
    const includes = [...includesRaw.matchAll(INCLUDES_ITEM)].map((item) => item[1]);
    rows.set(tableId, {
      eventId,
      status,
      minSpend: Number(minSpend),
      depositRequired: Number(deposit),
      includes,
      ...(reservationId ? { reservationId } : {})
    });
  }
  return rows;
}

function loadTables() {
  const source = readFileSync(resolve(root, 'src/data/mockTables.ts'), 'utf8');
  const tables = [];
  const seen = new Set();
  for (const match of source.matchAll(TABLE_ROW)) {
    const [, tableId, clubId, tableCode, zone, capacity] = match;
    if (seen.has(tableId)) continue;
    seen.add(tableId);
    tables.push({ tableId, clubId, tableCode, zone, capacity: Number(capacity) });
  }
  return tables;
}

async function main() {
  const pricing = loadPricing();
  const tables = loadTables();
  if (tables.length === 0) {
    console.error('No se encontraron mesas en src/data/mockTables.ts');
    process.exitCode = 1;
    return;
  }

  const app = getApps()[0] || initializeApp(
    useEmulator
      ? { projectId }
      : { projectId, credential: applicationDefault() }
  );
  const db = getFirestore(app);

  const clubs = new Set(tables.map((table) => table.clubId));
  const missingBusinesses = [];
  for (const clubId of clubs) {
    const snapshot = await db.collection('businesses').doc(clubId).get();
    if (!snapshot.exists) missingBusinesses.push(clubId);
  }
  if (missingBusinesses.length > 0) {
    console.error(`Faltan negocios en Firestore (ejecuta primero npm run seed:directory): ${missingBusinesses.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  let batch = db.batch();
  let pending = 0;
  let seeded = 0;
  let reserved = 0;

  for (const table of tables) {
    const resourceReference = db.collection('businesses').doc(table.clubId).collection('resources').doc(table.tableId);
    const row = pricing.get(table.tableId);
    const document = {
      businessId: table.clubId,
      resourceId: table.tableId,
      name: table.tableCode,
      zone: table.zone,
      capacity: table.capacity,
      currency: 'USD',
      active: true,
      activeHoldId: null,
      holdTokenHash: null,
      holdExpiresAt: null,
      updatedAt: new Date().toISOString()
    };
    if (row) {
      document.status = row.status;
      document.holdAmount = row.depositRequired;
      document.minSpend = row.minSpend;
      document.includes = row.includes;
      if (row.reservationId) {
        document.activeReservationId = row.reservationId;
        reserved += 1;
      }
    } else {
      document.status = 'AVAILABLE';
    }
    batch.set(resourceReference, document, { merge: false });
    pending += 1;
    seeded += 1;
    if (pending >= 450) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  await batch.commit();
  const target = useEmulator
    ? `emulador ${emulatorHost || '127.0.0.1:8080'}`
    : `proyecto ${projectId}`;
  console.log(`Seed OK: ${seeded} resources en businesses/*/resources (${reserved} ya reservadas) → ${target}`);
}

main().catch((error) => {
  console.error('Seed falló:', error);
  process.exitCode = 1;
});

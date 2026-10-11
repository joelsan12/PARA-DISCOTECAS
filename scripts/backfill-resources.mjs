import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('========================================================');
  console.log(`🔄 BACKFILL DE RECURSOS OPERATIVOS (O.0.1) ${isDryRun ? '[DRY RUN]' : ''}`);
  console.log('========================================================');

  const keyPath = resolve(root, 'serviceAccountKey.json');
  let app;
  if (existsSync(keyPath)) {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
    console.log(`[Backfill] Conectado con serviceAccountKey.json (${sa.project_id})`);
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    app = initializeApp({ projectId: 'nightflow-vip-local' });
    console.log(`[Backfill] Conectado a emulador Firestore (${process.env.FIRESTORE_EMULATOR_HOST})`);
  } else {
    console.error('❌ No se encontró serviceAccountKey.json ni FIRESTORE_EMULATOR_HOST.');
    process.exit(1);
  }

  const db = getFirestore(app);
  const now = new Date().toISOString();

  // 1. Obtener todos los negocios
  const businessesSnap = await db.collection('businesses').get();
  if (businessesSnap.empty) {
    console.log('ℹ️ No se encontraron negocios en la colección businesses.');
    process.exit(0);
  }

  console.log(`Total negocios evaluados: ${businessesSnap.size}\n`);

  let totalUpdated = 0;
  let totalSkippedHolds = 0;

  for (const bDoc of businessesSnap.docs) {
    const businessId = bDoc.id;
    const layoutSnap = await db.collection('businesses').doc(businessId).collection('layout').doc('main').get();

    if (!layoutSnap.exists) {
      console.log(`- ${businessId}: Sin layout/main. Omitiendo.`);
      continue;
    }

    const layoutData = layoutSnap.data() || {};
    const tables = Array.isArray(layoutData.tables) ? layoutData.tables : [];

    if (tables.length === 0) {
      console.log(`- ${businessId}: layout/main sin mesas definidas.`);
      continue;
    }

    console.log(`🔍 Procesando ${businessId} (${tables.length} mesas en plano)...`);

    // Leer recursos existentes para detectar holds activos y no sobreescribir estado
    const existingResourcesSnap = await db.collection('businesses').doc(businessId).collection('resources').get();
    const existingMap = new Map();
    for (const rDoc of existingResourcesSnap.docs) {
      existingMap.set(rDoc.id, rDoc.data());
    }

    const batch = db.batch();
    let batchOperations = 0;

    for (const tbl of tables) {
      const tableId = tbl.id || tbl.table_id || tbl.tableId;
      if (!tableId) continue;

      const resourceRef = db.collection('businesses').doc(businessId).collection('resources').doc(tableId);
      const existing = existingMap.get(tableId);

      const hasActiveHold = Boolean(existing?.activeHoldId && (!existing.holdExpiresAt || new Date(existing.holdExpiresAt).getTime() > Date.now()));

      if (hasActiveHold) {
        totalSkippedHolds++;
        console.log(`   ⚠️ Mesa ${tableId} (${tbl.table_code || tbl.tableCode}) tiene hold activo (${existing.activeHoldId}). Preservando estado.`);
      }

      const resourceData = {
        businessId,
        resourceId: tableId,
        name: tbl.table_code || tbl.tableCode || tableId,
        label: tbl.table_code || tbl.tableCode || tableId,
        zone: tbl.zone || 'VIP',
        capacity: Number(tbl.capacity) || 4,
        booking_mode: 'table',
        source: 'floorplan',
        is_active: tbl.is_active !== false,
        active: tbl.is_active !== false,
        currency: 'USD',
        minSpendDefault: Number(tbl.min_spend ?? tbl.minSpendDefault ?? existing?.minSpend ?? 0),
        depositRequired: Number(tbl.deposit_required ?? tbl.depositRequired ?? existing?.holdAmount ?? 0),
        updatedAt: now
      };

      // Si no tiene hold ni estado especial, asegurar status AVAILABLE por defecto
      if (!existing || (!existing.status && !hasActiveHold)) {
        resourceData.status = 'AVAILABLE';
        resourceData.activeHoldId = null;
        resourceData.holdTokenHash = null;
        resourceData.holdExpiresAt = null;
      }

      if (!isDryRun) {
        batch.set(resourceRef, resourceData, { merge: true });
        batchOperations++;
      }
      totalUpdated++;
    }

    if (!isDryRun && batchOperations > 0) {
      await batch.commit();
      console.log(`   ✅ Sincronizadas ${batchOperations} mesas en businesses/${businessId}/resources/`);
    } else if (isDryRun) {
      console.log(`   [DRY RUN] ${tables.length} mesas candidatas para sincronización en ${businessId}`);
    }
  }

  console.log('\n========================================================');
  console.log('📊 RESUMEN DE BACKFILL:');
  console.log(`   - Mesas procesadas:        ${totalUpdated}`);
  console.log(`   - Mesas con holds activos: ${totalSkippedHolds} (preservadas intactas)`);
  console.log(`   - Modo:                    ${isDryRun ? 'SIMULACIÓN (dry-run)' : 'APLICADO EN FIRESTORE'}`);
  console.log('========================================================\n');
}

main().catch((err) => {
  console.error('❌ Error en script de backfill:', err);
  process.exit(1);
});

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

if (!existsSync('./serviceAccountKey.json')) {
  console.error('❌ Falta serviceAccountKey.json en el directorio raíz.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, `purge-all-${Date.now()}`);
const db = getFirestore(app);

async function purgeAllBusinesses() {
  console.log('========================================================');
  console.log('🗑️ PURGA TOTAL DE NEGOCIOS — CLOUD FIRESTORE');
  console.log(`Proyecto GCP: ${sa.project_id}`);
  console.log('========================================================\n');

  // 1. Obtener todos los IDs de businessDirectory
  const dirSnap = await db.collection('businessDirectory').get();
  const dirIds = dirSnap.docs.map(d => d.id);

  // 2. Obtener todos los IDs de businesses
  const bizSnap = await db.collection('businesses').get();
  const bizIds = bizSnap.docs.map(d => d.id);

  const allClubIds = Array.from(new Set([...dirIds, ...bizIds]));

  console.log(`Negocios detectados para purga (${allClubIds.length}):`);
  for (const id of allClubIds) {
    console.log(` - ${id}`);
  }
  console.log('');

  if (allClubIds.length === 0) {
    console.log('ℹ️ No hay negocios registrados en Firestore.');
    return;
  }

  for (const clubId of allClubIds) {
    console.log(`Eliminando negocio y subcolecciones: ${clubId}...`);

    // Eliminar businesses/{clubId} recursivamente (incluye staff, resources, events, private, etc.)
    const bizRef = db.collection('businesses').doc(clubId);
    try {
      if (typeof db.recursiveDelete === 'function') {
        await db.recursiveDelete(bizRef);
      } else {
        // Fallback si no está disponible recursiveDelete
        const subcollections = await bizRef.listCollections();
        for (const sub of subcollections) {
          const docs = await sub.get();
          for (const d of docs.docs) {
            await d.ref.delete();
          }
        }
        await bizRef.delete();
      }
      console.log(`   ✔ businesses/${clubId} y todas sus subcolecciones eliminadas.`);
    } catch (err) {
      console.warn(`   ⚠️ Error al eliminar businesses/${clubId}:`, err.message);
    }

    // Eliminar businessDirectory/{clubId}
    const dirRef = db.collection('businessDirectory').doc(clubId);
    try {
      await dirRef.delete();
      console.log(`   ✔ businessDirectory/${clubId} eliminado.`);
    } catch (err) {
      console.warn(`   ⚠️ Error al eliminar businessDirectory/${clubId}:`, err.message);
    }
  }

  // 3. Limpiar holds residuales
  const holdsSnap = await db.collection('holds').get();
  if (!holdsSnap.empty) {
    console.log(`\nLimpiando ${holdsSnap.size} holds residuales...`);
    const batch = db.batch();
    for (const hDoc of holdsSnap.docs) {
      batch.delete(hDoc.ref);
    }
    await batch.commit();
    console.log('   ✔ Colección holds purgada.');
  }

  console.log('\n========================================================');
  console.log('✅ PURGA TOTAL COMPLETADA EXITOSAMENTE');
  console.log('Firestore ha quedado 100% limpio de negocios.');
  console.log('========================================================\n');
}

purgeAllBusinesses().catch(err => {
  console.error('❌ Error durante la purga:', err);
  process.exit(1);
});

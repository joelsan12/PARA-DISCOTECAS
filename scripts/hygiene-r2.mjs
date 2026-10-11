import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');
const { getAuth } = functionsRequire('firebase-admin/auth');

const sa = JSON.parse(readFileSync(resolve(root, 'serviceAccountKey.json'), 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, 'hygiene-r2');
const db = getFirestore(app);
const auth = getAuth(app);

const FOUNDING_CLUBS = ['club-sensorial', 'club-rumaj', 'club-velvet'];

async function runHygiene() {
  console.log('========================================================');
  console.log('🧹 PLAN DE HIGIENE PRODUCCIÓN — R2 (SMOKE PURGE & BACKFILL)');
  console.log('========================================================\n');

  // --- 1. PURGA DE SMOKE EN BUSINESSES ---
  console.log('1. Buscando negocios temporales de smoke (club_smoke_r2_*)...');
  const busSnapshot = await db.collection('businesses').get();
  const smokeClubDocs = busSnapshot.docs.filter(d => d.id.startsWith('club_smoke_r2_'));
  console.log(`   Se encontraron ${smokeClubDocs.length} negocios de smoke para eliminar.`);

  let deletedSubdocs = 0;
  for (const clubDoc of smokeClubDocs) {
    const clubId = clubDoc.id;
    console.log(`   🗑️ Purgando árbol completo de: ${clubId}...`);

    for (const subcol of ['resources', 'staff', 'events', 'reservations']) {
      const snap = await db.collection('businesses').doc(clubId).collection(subcol).get();
      for (const d of snap.docs) {
        await d.ref.delete();
        deletedSubdocs++;
      }
    }

    await clubDoc.ref.delete();

    // Comprobar si existiera en businessDirectory
    const dirDoc = await db.collection('businessDirectory').doc(clubId).get();
    if (dirDoc.exists) {
      await dirDoc.ref.delete();
      console.log(`      Directorio eliminado para ${clubId}`);
    }
  }
  console.log(`   ✅ Negocios smoke eliminados: ${smokeClubDocs.length} (subdocs: ${deletedSubdocs})`);

  // --- 1.1 PURGA DE HOLDS RESIDUALES ---
  console.log('\n1.1 Buscando holds residuales de smoke...');
  const holdsSnap = await db.collection('holds').get();
  let deletedHolds = 0;
  for (const holdDoc of holdsSnap.docs) {
    const hData = holdDoc.data();
    const isSmokeClub = hData.businessId && hData.businessId.startsWith('club_smoke_r2_');
    const isSmokeCust = hData.customerUid && hData.customerUid.startsWith('cust_smoke_');
    const isSmokeId = holdDoc.id.startsWith('smoke_');
    if (isSmokeClub || isSmokeCust || isSmokeId) {
      await holdDoc.ref.delete();
      deletedHolds++;
      console.log(`   🗑️ Hold residual eliminado: ${holdDoc.id}`);
    }
  }
  console.log(`   ✅ Holds residuales eliminados: ${deletedHolds}`);

  // --- 1.2 PURGA DE USUARIOS SMOKE EN AUTH ---
  console.log('\n1.2 Purgando usuarios smoke en Firebase Auth...');
  const listUsersResult = await auth.listUsers(100);
  let deletedUsers = 0;
  for (const user of listUsersResult.users) {
    const isSmokeEmail = user.email && (user.email.endsWith('@nightflow-smoke.vip') || user.email.includes('smoke.tester'));
    const isSmokeUid = user.uid.startsWith('smoke_') || user.uid.startsWith('cust_smoke_');
    if (isSmokeEmail || isSmokeUid) {
      await auth.deleteUser(user.uid);
      deletedUsers++;
      console.log(`   🗑️ Usuario smoke eliminado: ${user.uid} (${user.email})`);
    }
  }
  console.log(`   ✅ Usuarios smoke eliminados de Auth: ${deletedUsers}`);

  // --- 2. BACKFILL IS_PUBLISHED: TRUE Y CANONIZACIÓN DE CAMPOS EN EVENTOS FUNDADORES ---
  console.log('\n2. Aplicando backfill is_published: true y saneando esquema hasOnly en eventos fundadores...');
  let eventsUpdated = 0;
  for (const clubId of FOUNDING_CLUBS) {
    const eventsSnap = await db.collection('businesses').doc(clubId).collection('events').get();
    for (const evtDoc of eventsSnap.docs) {
      const data = evtDoc.data();
      const cleanDoc = {
        id: evtDoc.id,
        club_id: clubId,
        title: data.title || 'Evento Especial',
        subtitle: data.subtitle || '',
        date: data.date || '',
        day_label: data.day_label || data.dayLabel || data.date || '',
        door_time: data.door_time || data.doorTime || '22:00',
        cover_price: Number(data.cover_price ?? data.coverPrice ?? 0),
        dj_guest: data.dj_guest || data.djGuest || '',
        genre: data.genre || '',
        flyer_url: data.flyer_url || data.flyerUrl || '',
        is_published: true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (data.experience_type) cleanDoc.experience_type = data.experience_type;
      if (data.floor_plan_version_id) cleanDoc.floor_plan_version_id = data.floor_plan_version_id;

      // set sin merge para purgar campos camelCase heredados (djGuest, isPublished, etc.)
      await evtDoc.ref.set(cleanDoc);
      eventsUpdated++;
      console.log(`   ✅ Evento canonizado y publicado: [${clubId}] ${evtDoc.id} — "${cleanDoc.title}"`);
    }
  }
  console.log(`   ✅ Total eventos fundadores canonizados y publicados: ${eventsUpdated}`);

  // --- 3. RE-VERIFICACIÓN DE PRODUCCIÓN ---
  console.log('\n3. Re-verificación final del estado de producción:');
  const finalBusSnapshot = await db.collection('businesses').get();
  console.log(`   🏢 Total negocios en businesses/: ${finalBusSnapshot.size} (esperado: 4)`);
  for (const doc of finalBusSnapshot.docs) {
    const d = doc.data();
    const evSnap = await doc.ref.collection('events').get();
    const publishedEvts = evSnap.docs.filter(e => e.data().is_published === true).length;
    console.log(`      • ${doc.id} | "${d.name}" | planId: ${d.planId} | Eventos: ${evSnap.size} (${publishedEvts} publicados)`);
  }

  const finalDirSnapshot = await db.collection('businessDirectory').get();
  console.log(`   📋 Total en businessDirectory/: ${finalDirSnapshot.size}`);

  const finalHoldsSnapshot = await db.collection('holds').get();
  console.log(`   🎟️ Total en holds/: ${finalHoldsSnapshot.size}`);

  console.log('\n========================================================');
  console.log('🎉 HIGIENE Y BACKFILL R2 COMPLETADOS AL 100%');
  console.log('========================================================');
}

runHygiene().catch(err => {
  console.error('❌ Error fatal en higiene:', err);
  process.exit(1);
});

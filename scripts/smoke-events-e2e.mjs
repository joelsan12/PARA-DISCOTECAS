import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

process.env.APP_SECRET = process.env.APP_SECRET || 'smoke_app_secret_32_characters_long_min_len';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore, Timestamp } = functionsRequire('firebase-admin/firestore');

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, 'smoke-events-r2');
const auth = getAuth(app);
const db = getFirestore(app);

const { upsertBusinessEventFor } = await import('../functions/lib/events.js');
const { createReservationHoldFor } = await import('../functions/lib/reservations.js');

async function runEventsE2ESmoke() {
  console.log('========================================================');
  console.log('🧪 SMOKE TEST E2E — CARTELERA DE EVENTOS Y RESERVAS (R2)');
  console.log('========================================================\n');

  const smokeUid = `smoke_owner_${Date.now()}`;
  const smokeBusinessId = `club_smoke_r2_${Date.now()}`;
  const smokeEventId = `evt_smoke_${Date.now()}`;
  const smokeResourceId = `tbl_smoke_vip_01`;
  const smokeCustomerUid = `cust_smoke_${Date.now()}`;

  console.log(`1. Preparando Club Beta de prueba: ${smokeBusinessId}...`);
  // Crear usuario en Auth
  const userRecord = await auth.createUser({
    uid: smokeUid,
    email: `${smokeUid}@nightflow-smoke.vip`,
    displayName: 'Smoke Event Master'
  });

  // Sembrar business y staff
  await db.collection('businesses').doc(smokeBusinessId).set({
    name: 'Smoke Club R2 VIP',
    slug: `smoke-club-r2-${Date.now()}`,
    status: 'active',
    planId: 'beta_vip',
    createdAt: new Date().toISOString()
  });

  await db.collection('businesses').doc(smokeBusinessId).collection('staff').doc(smokeUid).set({
    role: 'owner',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // Crear recurso (mesa) para reservas
  await db.collection('businesses').doc(smokeBusinessId).collection('resources').doc(smokeResourceId).set({
    name: 'Mesa VIP Gold #1',
    capacity: 6,
    status: 'AVAILABLE',
    holdAmount: 150,
    depositAmount: 150,
    updatedAt: new Date().toISOString()
  });

  console.log('   ✅ Club Beta, staff y recurso inicializados.');

  // 2. Crear Evento mediante upsertBusinessEventFor (callable simulado)
  console.log('\n2. Invocando callable upsertBusinessEventFor como owner...');
  const fakeRequest = {
    auth: { uid: smokeUid, token: {} },
    data: {
      businessId: smokeBusinessId,
      eventId: smokeEventId,
      title: 'Grand Opening Smoke Night',
      subtitle: 'Noche exclusiva de inauguración VIP',
      date: '2026-10-31',
      day_label: 'Sábado 31 de Octubre',
      door_time: '23:00',
      cover_price: 35,
      dj_guest: 'DJ Axwell Guest',
      genre: 'Progressive House',
      flyer_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
      is_published: true
    },
    rawRequest: { ip: '127.0.0.1', get: () => undefined }
  };

  const createResult = await upsertBusinessEventFor(fakeRequest);
  console.log('   ✅ Evento creado exitosamente:', {
    success: createResult.success,
    eventId: createResult.eventId,
    title: createResult.event.title,
    is_published: createResult.event.is_published
  });
  assert.equal(createResult.success, true);
  assert.equal(createResult.eventId, smokeEventId);

  // 3. Verificar persistencia en Firestore y esquema hasOnly
  console.log('\n3. Verificando documento en businesses/{businessId}/events/{eventId}...');
  const eventSnap = await db.collection('businesses').doc(smokeBusinessId).collection('events').doc(smokeEventId).get();
  assert.ok(eventSnap.exists, 'El evento debe existir en Firestore');
  const eventData = eventSnap.data();
  console.log('   ✅ Evento persistido con campos canónicos:', {
    title: eventData.title,
    date: eventData.date,
    door_time: eventData.door_time,
    is_published: eventData.is_published
  });
  assert.equal(eventData.is_published, true);
  assert.equal(eventData.title, 'Grand Opening Smoke Night');

  // 4. Intentar crear Hold legítimo contra el evento publicado
  console.log('\n4. Creando hold de reserva legítimo contra el evento publicado...');
  const holdRequest = {
    auth: { uid: smokeCustomerUid, token: {} },
    data: {
      businessId: smokeBusinessId,
      eventId: smokeEventId,
      resourceId: smokeResourceId,
      currency: 'USD',
      idempotencyKey: `idemp_${Date.now()}`
    },
    rawRequest: { ip: '127.0.0.1', get: () => undefined }
  };

  const holdResult = await createReservationHoldFor(holdRequest);
  console.log('   ✅ Hold de reserva generado con éxito:', {
    holdId: holdResult.holdId,
    state: holdResult.state,
    amount: holdResult.amount,
    expiresAt: holdResult.expiresAt
  });
  assert.equal(holdResult.state, 'HELD');
  assert.equal(holdResult.amount, 150);

  // 5. Endurecimiento: Probar rechazo con evento fantasma (inexistente)
  console.log('\n5. Verificando endurecimiento: rechazo contra evento fantasma...');
  let ghostRejected = false;
  try {
    await createReservationHoldFor({
      auth: { uid: smokeCustomerUid, token: {} },
      data: {
        businessId: smokeBusinessId,
        eventId: 'evt_fantasma_inexistente',
        resourceId: smokeResourceId,
        currency: 'USD',
        idempotencyKey: `idemp_ghost_${Date.now()}`
      },
      rawRequest: { ip: '127.0.0.1', get: () => undefined }
    });
  } catch (err) {
    ghostRejected = true;
    console.log('   ✅ Rechazo verificado (Evento no encontrado):', err.message);
  }
  assert.ok(ghostRejected, 'Debe rechazar reservas contra eventos que no existen');

  // 6. Endurecimiento: Despublicar evento y probar rechazo
  console.log('\n6. Despublicando evento (is_published: false) y verificando rechazo...');
  await db.collection('businesses').doc(smokeBusinessId).collection('events').doc(smokeEventId).update({
    is_published: false
  });

  let unpublishedRejected = false;
  try {
    await createReservationHoldFor({
      auth: { uid: smokeCustomerUid, token: {} },
      data: {
        businessId: smokeBusinessId,
        eventId: smokeEventId,
        resourceId: smokeResourceId,
        currency: 'USD',
        idempotencyKey: `idemp_unpub_${Date.now()}`
      },
      rawRequest: { ip: '127.0.0.1', get: () => undefined }
    });
  } catch (err) {
    unpublishedRejected = true;
    console.log('   ✅ Rechazo verificado (Evento no publicado):', err.message);
  }
  assert.ok(unpublishedRejected, 'Debe rechazar reservas contra eventos despublicados');

  // 7. Limpieza completa
  console.log('\n🧹 Limpiando registros temporales de smoke...');
  await auth.deleteUser(userRecord.uid);
  const holdSnap = await db.collection('holds').doc(holdResult.holdId).get();
  if (holdSnap.exists) await holdSnap.ref.delete();

  const batch = db.batch();
  batch.delete(db.collection('businesses').doc(smokeBusinessId).collection('events').doc(smokeEventId));
  batch.delete(db.collection('businesses').doc(smokeBusinessId).collection('resources').doc(smokeResourceId));
  batch.delete(db.collection('businesses').doc(smokeBusinessId).collection('staff').doc(smokeUid));
  batch.delete(db.collection('businesses').doc(smokeBusinessId));
  await batch.commit();
  console.log('   ✅ Datos de prueba eliminados limpiamente de Firebase.');

  console.log('\n========================================================');
  console.log('🎉 SMOKE TEST E2E R2 SUPERADO AL 100%');
  console.log('========================================================');
}

runEventsE2ESmoke().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST E2E:', err);
  process.exit(1);
});

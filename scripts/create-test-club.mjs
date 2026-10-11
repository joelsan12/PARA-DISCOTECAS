import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore, Timestamp } = functionsRequire('firebase-admin/firestore');

if (!existsSync('./serviceAccountKey.json')) {
  console.error('❌ Falta serviceAccountKey.json');
  process.exit(1);
}

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, `create-club-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

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
  'MULTI_LOCATION',
];

async function main() {
  const clubId = 'club-aura';
  const clubName = 'Aura Rooftop & Club';
  const slug = 'aura-rooftop-club';
  const city = 'Guayaquil';
  const ownerEmail = 'matxsancan@gmail.com';
  const doorEmail = 'puerta@sensorial.vip';

  console.log('========================================================');
  console.log(`✨ CREANDO NUEVO NEGOCIO EN VIVO: ${clubName.toUpperCase()}`);
  console.log('========================================================');
  console.log(`ID:     ${clubId}`);
  console.log(`Slug:   ${slug}`);
  console.log(`Ciudad: ${city}`);
  console.log(`Owner:  ${ownerEmail}`);
  console.log('========================================================\n');

  const now = new Date().toISOString();
  const _tsNow = Timestamp.now();

  // 1. Obtener UID de owner y door
  const ownerUser = await auth.getUserByEmail(ownerEmail);
  const doorUser = await auth.getUserByEmail(doorEmail).catch(() => null);

  const batch = db.batch();

  // 2. businessDirectory/{clubId} — estrictamente 9 campos públicos
  const dirRef = db.collection('businessDirectory').doc(clubId);
  batch.set(dirRef, {
    name: clubName,
    slug,
    city,
    businessType: 'ROOFTOP',
    logoUrl: 'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    authMethods: ['password', 'email_otp', 'email_code']
  });

  // 3. businesses/{clubId}
  const bizRef = db.collection('businesses').doc(clubId);
  batch.set(bizRef, {
    name: clubName,
    slug,
    city,
    businessType: 'ROOFTOP',
    logoUrl: 'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    tagline: 'Vistas panorámicas y coctelería de autor en las alturas',
    primaryColor: '#06b6d4',
    accentColor: '#3b82f6',
    authMethods: ['password', 'email_otp', 'email_code'],
    reentryMode: 'physical_band',
    reentryMinutes: 30,
    customerCount: 0,
    planId: 'beta_vip',
    enabled_features: BETA_VIP_FEATURES,
    createdAt: now,
    updatedAt: now
  });

  // 4. Staff owner
  const staffOwnerRef = bizRef.collection('staff').doc(ownerUser.uid);
  batch.set(staffOwnerRef, {
    uid: ownerUser.uid,
    businessId: clubId,
    name: 'Joel (Owner)',
    email: ownerEmail,
    role: 'owner',
    status: 'ACTIVE',
    deviceIds: [],
    createdAt: now,
    updatedAt: now
  });

  // 5. Staff door
  if (doorUser) {
    const staffDoorRef = bizRef.collection('staff').doc(doorUser.uid);
    batch.set(staffDoorRef, {
      uid: doorUser.uid,
      businessId: clubId,
      name: 'Portero Aura VIP',
      email: doorEmail,
      role: 'door',
      status: 'ACTIVE',
      deviceIds: [],
      createdAt: now,
      updatedAt: now
    });
  }

  // 6. Cuenta privada de pagos: PAY_AT_DOOR
  const payAccountRef = bizRef.collection('private').doc('paymentAccount');
  batch.set(payAccountRef, {
    businessId: clubId,
    provider: 'pay_at_door',
    paymentMode: 'PAY_AT_DOOR',
    status: 'ACTIVE',
    updatedAt: Date.now()
  });

  // 7. Evento publicado
  const eventId = 'evt_estreno_aura';
  const eventRef = bizRef.collection('events').doc(eventId);
  batch.set(eventRef, {
    id: eventId,
    businessId: clubId,
    name: 'Grand Opening — Aura Rooftop Night',
    description: 'Noche de inauguración con DJ internacional y coctelería de autor.',
    date: '2026-10-17',
    start_time: '21:00',
    end_time: '04:00',
    status: 'published',
    is_published: true,
    banner: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    cover_price: 25,
    min_spend: 150,
    created_at: now,
    updatedAt: now
  });

  // 8. Mesas y Layout
  const sampleTables = [
    { tableId: 'aura-sky-1', name: 'Mesa Sky VIP 1', zone: 'Sky View', capacity: 6, minSpend: 300, deposit: 100 },
    { tableId: 'aura-sky-2', name: 'Mesa Sky VIP 2', zone: 'Sky View', capacity: 6, minSpend: 300, deposit: 100 },
    { tableId: 'aura-lounge-1', name: 'Lounge Central 1', zone: 'Lounge Bar', capacity: 4, minSpend: 150, deposit: 50 },
    { tableId: 'aura-lounge-2', name: 'Lounge Central 2', zone: 'Lounge Bar', capacity: 4, minSpend: 150, deposit: 50 },
    { tableId: 'aura-bar-1', name: 'Barra Alta 1', zone: 'Bar', capacity: 2, minSpend: 80, deposit: 30 },
    { tableId: 'aura-bar-2', name: 'Barra Alta 2', zone: 'Bar', capacity: 2, minSpend: 80, deposit: 30 },
  ];

  const layoutRef = bizRef.collection('layout').doc('main');
  batch.set(layoutRef, {
    businessId: clubId,
    name: 'Plano Principal Rooftop',
    tables: sampleTables.map((t, idx) => ({
      id: t.tableId,
      table_code: t.name,
      zone: t.zone,
      capacity: t.capacity,
      min_spend: t.minSpend,
      deposit_required: t.deposit,
      x: 100 + (idx % 3) * 180,
      y: 100 + Math.floor(idx / 3) * 180,
      width: 120,
      height: 120,
      shape: 'round',
      is_active: true
    })),
    updatedAt: now
  });

  for (const t of sampleTables) {
    const resRef = bizRef.collection('resources').doc(t.tableId);
    batch.set(resRef, {
      businessId: clubId,
      resourceId: t.tableId,
      name: t.name,
      label: t.name,
      zone: t.zone,
      capacity: t.capacity,
      booking_mode: 'table',
      source: 'floorplan',
      is_active: true,
      active: true,
      status: 'AVAILABLE',
      currency: 'USD',
      minSpendDefault: t.minSpend,
      depositRequired: t.deposit,
      activeHoldId: null,
      holdExpiresAt: null,
      updatedAt: now
    });
  }

  await batch.commit();

  console.log('✅ Club creado exitosamente con todas las colecciones canónicas:');
  console.log(`   - businessDirectory/${clubId} (9 campos strict)`);
  console.log(`   - businesses/${clubId} (Plan beta_vip fundador, 13 features)`);
  console.log(`   - businesses/${clubId}/staff/${ownerUser.uid} (Owner: ${ownerEmail})`);
  console.log(`   - businesses/${clubId}/private/paymentAccount (PAY_AT_DOOR)`);
  console.log(`   - businesses/${clubId}/events/${eventId} (Publicado)`);
  console.log(`   - businesses/${clubId}/layout/main (${sampleTables.length} mesas)`);
  console.log(`   - businesses/${clubId}/resources/ (${sampleTables.length} recursos sincronizados 1:1)`);
  console.log('\n========================================================');
}

main().catch((err) => {
  console.error('❌ Error creando nuevo club:', err);
  process.exit(1);
});

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore, FieldValue } = functionsRequire('firebase-admin/firestore');

const saPath = resolve(root, 'serviceAccountKey.json');
const sa = JSON.parse(readFileSync(saPath, 'utf8'));
initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

const CLUB_ID = 'club_15c5b4cf616b6cec';

const demoUsers = [
  {
    email: 'carlos.mendoza@vipclub.ec',
    password: 'Nightflow2026!',
    displayName: 'Carlos Mendoza',
    phone: '+593998765432',
    rawPhone: '0998765432',
    reservationId: 'res_vip_carlos_01',
    code: 'VIP-7492',
    table: 'SUI-01',
    tier: 'BLACK',
    status: 'CHECKED_IN'
  },
  {
    email: 'mateo.guerrero@gmail.com',
    password: 'Nightflow2026!',
    displayName: 'Mateo Guerrero',
    phone: '+593984433221',
    rawPhone: '0984433221',
    reservationId: 'res_vip_mateo_04',
    code: 'VIP-8841',
    table: 'PST-01',
    tier: 'GOLD',
    status: 'CONFIRMED'
  },
  {
    email: 'valentina.morales@gmail.com',
    password: 'Nightflow2026!',
    displayName: 'Valentina Morales',
    phone: '+593987654321',
    rawPhone: '0987654321',
    reservationId: 'res_vip_valentina_02',
    code: 'VIP-3810',
    table: 'AMP-01',
    tier: 'GOLD',
    status: 'CHECKED_IN'
  }
];

async function run() {
  console.log('Creando cuentas de acceso de clientes VIP en Firebase Auth...');

  for (const u of demoUsers) {
    let authRecord;
    try {
      authRecord = await auth.getUserByEmail(u.email);
      console.log(`Usuario existente encontrado: ${u.email} (${authRecord.uid})`);
      await auth.updateUser(authRecord.uid, {
        password: u.password,
        displayName: u.displayName
      });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        authRecord = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
          emailVerified: true
        });
        console.log(`Usuario creado exitosamente: ${u.email} (${authRecord.uid})`);
      } else {
        throw e;
      }
    }

    const uid = authRecord.uid;

    // 1. Guardar en users/{uid} (identidad global)
    await db.collection('users').doc(uid).set({
      uid,
      displayName: u.displayName,
      email: u.email,
      phone: u.rawPhone,
      tier: u.tier,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Guardar en businesses/{clubId}/customers/{uid} (ficha local)
    await db.collection('businesses').doc(CLUB_ID).collection('customers').doc(uid).set({
      uid,
      displayName: u.displayName,
      email: u.email,
      phone: u.rawPhone,
      tier: u.tier,
      visitsCount: u.status === 'CHECKED_IN' ? 1 : 0,
      totalSpend: u.status === 'CHECKED_IN' ? 450 : 0,
      tags: ['VIP', 'RESERVAS'],
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Vincular la reserva a este UID
    const resRef = db.collection('businesses').doc(CLUB_ID).collection('reservations').doc(u.reservationId);
    await resRef.set({
      customerId: uid,
      customerUid: uid,
      userId: uid,
      uid: uid,
      customer_email: u.email,
      customer_name: u.displayName,
      customer_phone: u.rawPhone
    }, { merge: true });

    console.log(`Perfil de cliente y reserva ${u.code} vinculados con éxito a UID: ${uid}`);
  }

  console.log('¡Listo! Todos los clientes VIP tienen acceso configurado.');
}

run().catch(err => {
  console.error('Error configurando clientes:', err);
  process.exit(1);
});

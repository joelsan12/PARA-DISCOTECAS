import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore, FieldValue } = functionsRequire('firebase-admin/firestore');

const saPath = resolve(root, 'serviceAccountKey.json');
const sa = JSON.parse(readFileSync(saPath, 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const CLUB_ID = 'club_15c5b4cf616b6cec';
const EVENT_ID = 'evt_noche_vip_sabado';
const TODAY = new Date().toISOString().slice(0, 10);

async function seed() {
  console.log(`Seeding reservations for club: ${CLUB_ID}...`);

  // 1. Crear / actualizar evento activo de noche
  const eventRef = db.collection('businesses').doc(CLUB_ID).collection('events').doc(EVENT_ID);
  await eventRef.set({
    title: 'Noche VIP — Black Diamond Edition',
    subtitle: 'Fiesta Exclusiva con Reservas & Concierge',
    date: TODAY,
    day_label: 'Sábado VIP Oficial',
    door_time: '22:00',
    cover_price: 25,
    dj_guest: 'DJ Kiko & Artistas Invitados',
    genre: 'Tech House & Melodic Techno',
    flyer_url: '',
    is_published: true,
    experience_type: 'tables_and_general',
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('Evento creado/actualizado exitosamente:', EVENT_ID);

  // 2. Definir reservas de muestra
  const reservations = [
    {
      id: 'res_vip_carlos_01',
      code: 'VIP-7492',
      customer_name: 'Carlos Mendoza',
      customer_phone: '0998765432',
      customer_email: 'carlos.mendoza@vipclub.ec',
      resourceId: 'tbl-club_15c5b4cf616b6cec-1-3833',
      table_code: 'SUI-01',
      zone: 'Skyline Suite 1',
      guest_count: 8,
      deposit_amount: 450,
      min_spend: 900,
      status: 'CHECKED_IN',
      checked_in_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      attendanceState: 'INSIDE',
      payment_method: 'credit_card',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_valentina_02',
      code: 'VIP-3810',
      customer_name: 'Valentina Morales',
      customer_phone: '0987654321',
      customer_email: 'valentina.morales@gmail.com',
      resourceId: 'tbl-club_15c5b4cf616b6cec-1-7091',
      table_code: 'AMP-01',
      zone: 'Gradas VIP Nivel 1',
      guest_count: 5,
      deposit_amount: 250,
      min_spend: 500,
      status: 'CHECKED_IN',
      checked_in_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      attendanceState: 'INSIDE',
      payment_method: 'transfer',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_camila_03',
      code: 'VIP-5120',
      customer_name: 'Camila Echeverría',
      customer_phone: '0995544332',
      customer_email: 'camila.echeverria@outlook.com',
      resourceId: 'tbl-club_15c5b4cf616b6cec-2-3833',
      table_code: 'SUI-02',
      zone: 'Skyline Suite 2',
      guest_count: 10,
      deposit_amount: 600,
      min_spend: 1200,
      status: 'CHECKED_IN',
      checked_in_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      attendanceState: 'INSIDE',
      payment_method: 'credit_card',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_mateo_04',
      code: 'VIP-8841',
      customer_name: 'Mateo Guerrero',
      customer_phone: '0984433221',
      customer_email: 'mateo.guerrero@gmail.com',
      resourceId: 'tbl-club_15c5b4cf616b6cec-11-7091',
      table_code: 'PST-01',
      zone: 'Pista Central',
      guest_count: 4,
      deposit_amount: 200,
      min_spend: 400,
      status: 'CONFIRMED',
      attendanceState: 'ABSENT',
      payment_method: 'credit_card',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_andrea_05',
      code: 'VIP-9204',
      customer_name: 'Andrea Benítez',
      customer_phone: '0993322110',
      customer_email: 'andrea.benitez@empresa.ec',
      resourceId: 'tbl-club_15c5b4cf616b6cec-7-3833',
      table_code: 'ROOF-01',
      zone: 'Terraza Rooftop',
      guest_count: 6,
      deposit_amount: 350,
      min_spend: 700,
      status: 'CONFIRMED',
      attendanceState: 'ABSENT',
      payment_method: 'transfer',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_sebastian_06',
      code: 'VIP-6415',
      customer_name: 'Sebastián Córdova',
      customer_phone: '0982211009',
      customer_email: 'sebastian.cordova@icloud.com',
      resourceId: 'tbl-club_15c5b4cf616b6cec-5-3833',
      table_code: 'BLC-01',
      zone: 'Balcón Panorámico',
      guest_count: 4,
      deposit_amount: 250,
      min_spend: 500,
      status: 'CONFIRMED',
      attendanceState: 'ABSENT',
      payment_method: 'credit_card',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_diego_07',
      code: 'VIP-4089',
      customer_name: 'Diego Salazar',
      customer_phone: '0991122334',
      customer_email: 'diego.salazar@uio.ec',
      resourceId: 'tbl-club_15c5b4cf616b6cec-2-7091',
      table_code: 'AMP-02',
      zone: 'Gradas VIP Nivel 1',
      guest_count: 4,
      deposit_amount: 250,
      min_spend: 500,
      status: 'CONFIRMED',
      attendanceState: 'ABSENT',
      payment_method: 'transfer',
      payment_status: 'paid',
      paymentState: 'PAID'
    },
    {
      id: 'res_vip_lucia_08',
      code: 'VIP-2933',
      customer_name: 'Lucía Paredes',
      customer_phone: '0989988776',
      customer_email: 'lucia.paredes@hotmail.com',
      resourceId: 'tbl-club_15c5b4cf616b6cec-7-7091',
      table_code: 'CRV-01',
      zone: 'Curva Panorámica',
      guest_count: 6,
      deposit_amount: 350,
      min_spend: 700,
      status: 'CONFIRMED',
      attendanceState: 'ABSENT',
      payment_method: 'cash_door',
      payment_status: 'paid',
      paymentState: 'PAID'
    }
  ];

  const batch = db.batch();

  for (const r of reservations) {
    const resRef = db.collection('businesses').doc(CLUB_ID).collection('reservations').doc(r.id);
    batch.set(resRef, {
      code: r.code,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      customer_email: r.customer_email,
      resourceId: r.resourceId,
      table_id: r.resourceId,
      table_code: r.table_code,
      zone: r.zone,
      guest_count: r.guest_count,
      deposit_amount: r.deposit_amount,
      min_spend: r.min_spend,
      status: r.status,
      payment_method: r.payment_method,
      payment_status: r.payment_status,
      paymentState: r.paymentState,
      businessId: CLUB_ID,
      club_id: CLUB_ID,
      eventId: EVENT_ID,
      event_id: EVENT_ID,
      qr_token: `token_${r.code}_${Date.now()}`,
      checked_in_at: r.checked_in_at || null,
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Actualizar resource con reserva activa
    const tableRef = db.collection('businesses').doc(CLUB_ID).collection('resources').doc(r.resourceId);
    batch.set(tableRef, {
      activeReservationId: r.id,
      status: r.status === 'CHECKED_IN' ? 'CHECKED_IN' : 'CONFIRMED'
    }, { merge: true });

    // Si está checked_in, crear sesión de asistencia en door
    if (r.status === 'CHECKED_IN') {
      const sessionRef = db.collection('businesses').doc(CLUB_ID).collection('sessions').doc(r.id);
      batch.set(sessionRef, {
        state: 'INSIDE',
        lastAction: 'CHECK_IN',
        checkedInAt: r.checked_in_at,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // También abrir tableTab para consumo
      const tabRef = db.collection('businesses').doc(CLUB_ID).collection('tableTabs').doc(r.id);
      batch.set(tabRef, {
        reservationId: r.id,
        status: 'OPEN',
        subtotal: r.deposit_amount,
        depositAmount: r.deposit_amount,
        minSpend: r.min_spend,
        items: [
          { name: 'Botella Tequila Don Julio 70 (Cover Anticipo)', price: r.deposit_amount, quantity: 1 }
        ],
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  await batch.commit();
  console.log(`Se sembraron exitosamente ${reservations.length} reservas en Cloud Firestore.`);
}

seed().catch(err => {
  console.error('Error sembrando reservas:', err);
  process.exit(1);
});

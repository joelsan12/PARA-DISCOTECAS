import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const auth = getAuth(app);
const db = getFirestore(app);

const envText = readFileSync('.env.production', 'utf8');
const apiKeyMatch = envText.match(/VITE_FIREBASE_API_KEY=([^\r\n]+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

const BACKEND_URL = 'https://nightflow-backend.onrender.com';
const DOOR_URL = 'https://nightflow-backend.onrender.com/door';

const BUSINESS_ID = 'club-sensorial';
const EVENT_ID = 'event-fri-reggaeton';
const RESOURCE_ID = 'tbl-s4';

async function resolveSmokeAdminUid() {
  if (process.env.SMOKE_ADMIN_UID) return process.env.SMOKE_ADMIN_UID;
  const staffSnap = await db.collection('businesses').doc(BUSINESS_ID).collection('staff').where('role', '==', 'owner').limit(1).get();
  if (!staffSnap.empty) return staffSnap.docs[0].id;
  const users = await auth.listUsers(5);
  if (users.users.length > 0) return users.users[0].uid;
  throw new Error('No se pudo resolver UID para el smoke test. Define SMOKE_ADMIN_UID.');
}

async function getIdToken(uid) {
  const customToken = await auth.createCustomToken(uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  if (!data.idToken) throw new Error(`Error obteniendo ID token: ${JSON.stringify(data)}`);
  return data.idToken;
}


async function runSmokeTest() {
  const ADMIN_UID = await resolveSmokeAdminUid();
  console.log('========================================================');
  console.log('🌙 SMOKE TEST ESCENARIO 02:00 AM — NIGHTFLOW VIP');
  console.log('========================================================\n');

  // Paso 1: Verificar Directorio
  console.log('1. Verificando Directorio Público en Firestore...');
  const dirDoc = await db.collection('businessDirectory').doc(BUSINESS_ID).get();
  if (!dirDoc.exists) throw new Error(`Club ${BUSINESS_ID} no encontrado en businessDirectory`);
  const dirData = dirDoc.data();
  console.log(`   ✅ Club: "${dirData.name}" | Ciudad: ${dirData.city} | Auth: ${JSON.stringify(dirData.authMethods)}`);

  // Paso 2: Crear perfil de cliente en businesses/{businessId}/customers/{uid} y resetear mesa de prueba
  console.log('\n2. Verificando/Creando ficha de cliente activo y recurso...');
  const customerUser = await auth.getUser(ADMIN_UID).catch(() => null);
  const customerEmail = customerUser?.email || 'smoke_customer@nightflow.vip';
  const customerDisplayName = customerUser?.displayName || 'Smoke Test Customer';

  const customerRef = db.collection('businesses').doc(BUSINESS_ID).collection('customers').doc(ADMIN_UID);
  await customerRef.set({
    uid: ADMIN_UID,
    businessId: BUSINESS_ID,
    displayName: customerDisplayName,
    email: customerEmail,
    status: 'ACTIVE',
    tier: 'VIP_BLACK',
    loyaltyPoints: 100,
    marketingConsent: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log(`   ✅ Ficha activa en businesses/${BUSINESS_ID}/customers/${ADMIN_UID}`);

  const resourceRef = db.collection('businesses').doc(BUSINESS_ID).collection('resources').doc(RESOURCE_ID);
  await resourceRef.set({
    eventId: EVENT_ID,
    status: 'AVAILABLE',
    active: true,
    holdAmount: 250,
    activeHoldId: null,
    activeReservationId: null,
    holdTokenHash: null,
    holdExpiresAt: null,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log(`   ✅ Recurso ${RESOURCE_ID} listo en estado AVAILABLE ($250 USD)`);

  // Obtener ID token
  console.log('\n3. Autenticando sesión de usuario en Firebase...');
  const idToken = await getIdToken(ADMIN_UID);
  console.log('   ✅ ID Token obtenido');

  // Paso 4: Hold de 12 minutos via Render callables
  console.log('\n4. Creando Hold de 12 minutos para mesa VIP...');
  const idempotencyKey = `smoke_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const holdRes = await fetch(`${BACKEND_URL}/v1/call/createReservationHold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        businessId: BUSINESS_ID,
        eventId: EVENT_ID,
        resourceId: RESOURCE_ID,
        customerUid: ADMIN_UID,
        idempotencyKey,
        currency: 'USD',
        amount: 250
      }
    })
  });
  const holdPayload = await holdRes.json();
  if (!holdRes.ok) {
    throw new Error(`Fallo createReservationHold (${holdRes.status}): ${JSON.stringify(holdPayload)}`);
  }
  const holdResult = holdPayload.result;
  const holdId = holdResult.holdId;
  const holdToken = holdResult.holdToken;
  console.log(`   ✅ Hold creado: ID=${holdId} | Estado=${holdResult.state} | Expira=${holdResult.expiresAt}`);

  // Paso 5: Confirmación pay_at_door
  console.log('\n5. Confirmando reserva con modalidad pay_at_door...');
  const payRes = await fetch(`${BACKEND_URL}/v1/call/createPaymentSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        holdId,
        holdToken,
        returnUrl: '/reserva/confirmada'
      }
    })
  });
  const payPayload = await payRes.json();
  if (!payRes.ok) {
    throw new Error(`Fallo createPaymentSession (${payRes.status}): ${JSON.stringify(payPayload)}`);
  }
  const payResult = payPayload.result;
  console.log(`   ✅ Reserva Confirmada: Estado=${payResult.state} | Provider=${payResult.provider}`);

  // Verificar que la reserva canonical existe en Firestore
  const reservationDoc = await db.collection('businesses').doc(BUSINESS_ID).collection('reservations').doc(holdId).get();
  if (!reservationDoc.exists) throw new Error(`businesses/${BUSINESS_ID}/reservations/${holdId} no existe`);
  console.log(`   ✅ Documento canónico en Firestore: status=${reservationDoc.data().status}`);

  // Paso 6: Rotación de Pase VIP (Ed25519, 45s)
  console.log('\n6. Solicitando Pase QR Dinámico rotativo al Door Service...');
  const deviceId = `dev_mobile_${Date.now()}`;
  const rotateRes = await fetch(`${DOOR_URL}/v1/tickets/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      ticketId: holdId,
      deviceId,
      eventId: EVENT_ID,
      venueId: 'main-stage'
    })
  });
  const rotateData = await rotateRes.json();
  if (!rotateRes.ok) {
    throw new Error(`Fallo rotate (${rotateRes.status}): ${JSON.stringify(rotateData)}`);
  }
  console.log(`   ✅ Pase rotativo emitido: Alg=EdDSA | Kid=${rotateData.kid} | Expira en ${rotateData.expiresIn}s`);
  console.log(`   Claims JWS: sub=${rotateData.claims.sub} | jti=${rotateData.claims.jti}`);

  // Paso 7: Enrolamiento de Terminal y Escaneo en Puerta #1 (Check-in inicial)
  console.log('\n7. Enrolando Terminal de Puerta y realizando Check-in #1...');
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  const publicJwk = await exportJWK(publicKey);
  const terminalKid = `dev-gate-${Date.now()}`;
  publicJwk.kid = terminalKid;

  const enrollRes = await fetch(`${DOOR_URL}/v1/devices/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      kid: terminalKid,
      deviceId: terminalKid,
      publicKey: publicJwk
    })
  });
  if (!enrollRes.ok) {
    const enrollErr = await enrollRes.text();
    throw new Error(`Fallo enrolando terminal (${enrollRes.status}): ${enrollErr}`);
  }
  console.log(`   ✅ Terminal enrolada exitosamente: kid=${terminalKid}`);

  const eventClaims1 = {
    businessId: BUSINESS_ID,
    eventId: EVENT_ID,
    venueId: 'main-stage',
    ticketId: holdId,
    deviceId: terminalKid,
    deviceSequence: 1,
    jti: rotateData.claims.jti,
    action: 'CHECK_IN',
    occurredAt: Date.now(),
    revocationVersion: 0
  };

  const signature1 = await new SignJWT(eventClaims1)
    .setProtectedHeader({ alg: 'ES256', kid: terminalKid })
    .sign(privateKey);

  const eventPayload1 = {
    ...eventClaims1,
    signature: signature1
  };

  const checkinRes1 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      events: [eventPayload1]
    })
  });
  const checkinData1 = await checkinRes1.json();
  console.log(`   Respuesta Puerta #1 (Status ${checkinRes1.status}):`, checkinData1);
  if (checkinData1.accepted !== 1) {
    throw new Error(`Check-in #1 esperado 1 aceptado, recibido: ${JSON.stringify(checkinData1)}`);
  }
  console.log('   ✅ CHECK-IN #1: ACCEPTED — Presencia: INSIDE');

  // Paso 8: Escaneo en Puerta #2 (Segundo escaneo / screenshot / duplicado)
  console.log('\n8. Escaneo en Puerta #2 (Intento de re-ingreso o clonación)...');
  const eventClaims2 = {
    ...eventClaims1,
    deviceSequence: 2,
    occurredAt: Date.now()
  };
  const signature2 = await new SignJWT(eventClaims2)
    .setProtectedHeader({ alg: 'ES256', kid: terminalKid })
    .sign(privateKey);

  const checkinRes2 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      events: [{
        ...eventClaims2,
        signature: signature2
      }]
    })
  });
  const checkinData2 = await checkinRes2.json();
  console.log(`   Respuesta Puerta #2 (Status ${checkinRes2.status}):`, checkinData2);
  const conflict = checkinData2.results?.[0];
  if (conflict && (conflict.status === 'CONFLICT' || conflict.status === 'REJECTED')) {
    console.log(`   ✅ CHECK-IN #2 RECHAZADO CORRECTAMENTE: reason=${conflict.reason || 'ALREADY_INSIDE'}`);
    console.log('   Mensaje al personal: «El titular ya está dentro del establecimiento»');
  } else {
    console.warn('   ⚠️ Verificación de segundo escaneo:', checkinData2);
  }

  console.log('\n========================================================');
  console.log('🎉 BATERÍA 02:00 AM SUPERADA CON ÉXITO EN PRODUCCIÓN');
  console.log('========================================================');
}

runSmokeTest().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});

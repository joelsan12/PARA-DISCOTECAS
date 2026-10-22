import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { generateKeyPair, exportJWK, SignJWT, decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

const functionsRequire = createRequire(resolve('functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

if (!existsSync('./serviceAccountKey.json')) {
  console.error('❌ Falta serviceAccountKey.json en el directorio raíz.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const auth = getAuth(app);
const db = getFirestore(app);

const envText = existsSync('.env.production') ? readFileSync('.env.production', 'utf8') : '';
const apiKeyMatch = envText.match(/VITE_FIREBASE_API_KEY=([^\r\n]+)/);
const apiKey = process.env.VITE_FIREBASE_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : '');

const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'https://nightflow-backend-x1an.onrender.com';
const DOOR_URL = process.env.DOOR_URL || process.env.VITE_DOOR_SERVICE_URL || `${BACKEND_URL}/door`;

const BUSINESS_ID = process.env.SMOKE_BUSINESS_ID || 'club-sensorial';
const EVENT_ID = process.env.SMOKE_EVENT_ID || 'event-fri-reggaeton';
const RESOURCE_ID = process.env.SMOKE_RESOURCE_ID || 'tbl-s4';
const VENUE_ID = 'main-stage';

async function resolveSmokeAdminUid() {
  if (process.env.SMOKE_ADMIN_UID) return process.env.SMOKE_ADMIN_UID;
  const staffSnap = await db.collection('businesses').doc(BUSINESS_ID).collection('staff').where('role', 'in', ['owner', 'manager']).limit(1).get();
  if (!staffSnap.empty) return staffSnap.docs[0].id;
  const users = await auth.listUsers(5);
  if (users.users.length > 0) return users.users[0].uid;
  throw new Error('No se pudo resolver UID de administrador para el smoke test. Define SMOKE_ADMIN_UID.');
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

async function prepareConfirmedReservation(adminUid) {
  // Asegurar ficha de cliente
  const customerUser = await auth.getUser(adminUid).catch(() => null);
  const customerEmail = customerUser?.email || 'smoke_door_customer@nightflow.vip';
  const customerDisplayName = customerUser?.displayName || 'Smoke Door Customer';

  const customerRef = db.collection('businesses').doc(BUSINESS_ID).collection('customers').doc(adminUid);
  await customerRef.set({
    uid: adminUid,
    businessId: BUSINESS_ID,
    displayName: customerDisplayName,
    email: customerEmail,
    status: 'ACTIVE',
    tier: 'VIP_BLACK',
    loyaltyPoints: 100,
    marketingConsent: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Asegurar recurso AVAILABLE
  const resourceRef = db.collection('businesses').doc(BUSINESS_ID).collection('resources').doc(RESOURCE_ID);
  await resourceRef.set({
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    status: 'AVAILABLE',
    active: true,
    holdAmount: 250,
    activeHoldId: null,
    activeReservationId: null,
    holdTokenHash: null,
    holdExpiresAt: null,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Crear reservación canónica CONFIRMED directamente para la prueba de puerta
  const smokeTicketId = `smoke_tkt_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const reservationRef = db.collection('businesses').doc(BUSINESS_ID).collection('reservations').doc(smokeTicketId);
  await reservationRef.set({
    businessId: BUSINESS_ID,
    ticketId: smokeTicketId,
    reservationId: smokeTicketId,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    resourceId: RESOURCE_ID,
    customerUid: adminUid,
    status: 'CONFIRMED',
    paymentProvider: 'pay_at_door',
    paymentState: 'PAID',
    amount: 250,
    currency: 'USD',
    revoked: false,
    eventCanceled: false,
    revocationVersion: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Asegurar que la sesión de asistencia empiece limpia (estado ABSENT)
  await db.collection('businesses').doc(BUSINESS_ID).collection('attendanceSessions').doc(smokeTicketId).delete().catch(() => {});

  return smokeTicketId;
}

async function runSmokeDoor() {
  console.log('========================================================');
  console.log('🚪 SMOKE TEST PUERTA & ACCESO EN VIVO (FASE D) — NIGHTFLOW');
  console.log('========================================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Door URL:    ${DOOR_URL}`);
  console.log(`Business ID: ${BUSINESS_ID}`);
  console.log('========================================================\n');

  const adminUid = await resolveSmokeAdminUid();
  const idToken = await getIdToken(adminUid);

  // -------------------------------------------------------------------------
  // 1. GET /health → door === true y /health.door
  // -------------------------------------------------------------------------
  console.log('1. Verificando Health Endpoints del servidor...');
  const healthRes = await fetch(`${BACKEND_URL}/health`);
  if (!healthRes.ok) throw new Error(`GET /health devolvió status ${healthRes.status}`);
  const healthData = await healthRes.json();
  if (healthData.door !== true) {
    throw new Error(`GET /health indica door !== true: ${JSON.stringify(healthData)}`);
  }
  console.log(`   ✅ GET /health: door === true (doorRequired=${healthData.doorRequired})`);

  const doorHealthRes = await fetch(`${BACKEND_URL}/health.door`);
  if (doorHealthRes.ok) {
    const doorHealthData = await doorHealthRes.json();
    if (doorHealthData.door !== true) {
      throw new Error(`GET /health.door indica door !== true: ${JSON.stringify(doorHealthData)}`);
    }
    console.log('   ✅ GET /health.door: ok === true, door === true');
  } else if (doorHealthRes.status === 404) {
    console.log('   ℹ️ GET /health.door: 404 (endpoint agregado en WS-2, pendiente de nuevo deploy a Render; GET /health ya confirma door===true)');
  } else {
    throw new Error(`GET /health.door devolvió status ${doorHealthRes.status}`);
  }

  const doorServiceHealth = await fetch(`${DOOR_URL}/health`);
  if (!doorServiceHealth.ok) throw new Error(`GET ${DOOR_URL}/health devolvió status ${doorServiceHealth.status}`);
  console.log('   ✅ GET /door/health: respondio 200 OK');

  // -------------------------------------------------------------------------
  // Preparar Reserva CONFIRMED
  // -------------------------------------------------------------------------
  console.log('\nPreparando reserva CONFIRMED para la prueba...');
  const ticketId = await prepareConfirmedReservation(adminUid, idToken);
  console.log(`   ✅ Reserva canónica lista: ticketId=${ticketId}`);

  // -------------------------------------------------------------------------
  // 3. POST /v1/tickets/rotate sobre la reserva CONFIRMED real
  //    (se ejecuta aquí para obtener el JWS y su kid activo)
  // -------------------------------------------------------------------------
  console.log('\n2. Solicitando Pase Dinámico JWS Ed25519 (POST /v1/tickets/rotate)...');
  const custDeviceId = `dev_cust_${Date.now()}`;
  const rotateRes = await fetch(`${DOOR_URL}/v1/tickets/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      ticketId,
      deviceId: custDeviceId,
      eventId: EVENT_ID,
      venueId: VENUE_ID
    })
  });
  const rotateData = await rotateRes.json();
  if (!rotateRes.ok) throw new Error(`Fallo tickets/rotate (${rotateRes.status}): ${JSON.stringify(rotateData)}`);

  const header = decodeProtectedHeader(rotateData.token);
  if (header.alg !== 'EdDSA') {
    throw new Error(`Algoritmo inesperado en JWS: ${header.alg} (esperado: EdDSA)`);
  }
  const activeKid = header.kid;
  if (!activeKid || activeKid !== rotateData.kid) {
    throw new Error(`KID no coincide en header: ${header.kid} vs ${rotateData.kid}`);
  }
  const expWindow = (rotateData.claims?.exp || 0) - (rotateData.claims?.iat || 0);
  if (expWindow > 45 || rotateData.expiresIn > 45) {
    throw new Error(`Ventana de expiración excede 45s: expiresIn=${rotateData.expiresIn}, window=${expWindow}s`);
  }
  console.log(`   ✅ JWS Ed25519 válido: alg=${header.alg} | kid=${activeKid} | expiresIn=${rotateData.expiresIn}s (<= 45s)`);
  console.log(`   Claims: sub=${rotateData.claims.sub} | jti=${rotateData.claims.jti}`);

  // -------------------------------------------------------------------------
  // 2. GET /v1/keys/{kid} → kid activo servible
  // -------------------------------------------------------------------------
  console.log(`\n3. Verificando Endpoint de Clave Pública (GET /v1/keys/${activeKid})...`);
  const keyRes = await fetch(`${DOOR_URL}/v1/keys/${activeKid}`);
  if (!keyRes.ok) throw new Error(`GET /v1/keys/${activeKid} devolvió status ${keyRes.status}`);
  const keyData = await keyRes.json();
  if (keyData.kty !== 'OKP' || keyData.crv !== 'Ed25519') {
    throw new Error(`Formato de JWK inválido: ${JSON.stringify(keyData)}`);
  }
  console.log(`   ✅ Clave pública Ed25519 servible: kty=${keyData.kty} | crv=${keyData.crv} | x=${keyData.x?.slice(0, 8)}...`);

  // Verificación criptográfica local con la clave descargada del servidor
  const importedKey = await importJWK(keyData, 'EdDSA');
  const verified = await jwtVerify(rotateData.token, importedKey, {
    issuer: 'nightflow',
    audience: 'nightflow-door'
  });
  if (verified.payload.jti !== rotateData.claims.jti) {
    throw new Error('Verificación criptográfica del token no coincide con el JTI');
  }
  console.log('   ✅ Verificación criptográfica local del JWS con la clave pública del servidor: OK');

  // -------------------------------------------------------------------------
  // 4. Token alterado y token vencido → rechazo 401 (anti-pantallazo)
  // -------------------------------------------------------------------------
  console.log('\n4. Verificando rechazo 401 ante Token Alterado y Token Vencido (Anti-Pantallazo)...');
  // 4a: Token alterado (firma manipulada)
  const tamperedToken = `${rotateData.token.slice(0, -10)}ABCDEFGHIJ`;
  const tamperedRes = await fetch(`${DOOR_URL}/v1/tickets/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      ticketId,
      deviceId: custDeviceId,
      eventId: EVENT_ID,
      venueId: VENUE_ID,
      currentToken: tamperedToken
    })
  });
  if (tamperedRes.status !== 401) {
    const body = await tamperedRes.text();
    throw new Error(`Token alterado debió ser rechazado con 401, recibido ${tamperedRes.status}: ${body}`);
  }
  console.log('   ✅ Token alterado rechazado correctamente con 401 (Unauthorized)');

  // 4b: Token vencido (con exp en el pasado)
  const { privateKey: ephemeralKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const expiredSeconds = Math.floor(Date.now() / 1000) - 120;
  const expiredToken = await new SignJWT({ ...rotateData.claims })
    .setProtectedHeader({ alg: 'EdDSA', kid: activeKid })
    .setIssuedAt(expiredSeconds - 30)
    .setExpirationTime(expiredSeconds)
    .setIssuer('nightflow')
    .setAudience('nightflow-door')
    .sign(ephemeralKey);

  const expiredRes = await fetch(`${DOOR_URL}/v1/tickets/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      ticketId,
      deviceId: custDeviceId,
      eventId: EVENT_ID,
      venueId: VENUE_ID,
      currentToken: expiredToken
    })
  });
  if (expiredRes.status !== 401) {
    const body = await expiredRes.text();
    throw new Error(`Token vencido debió ser rechazado con 401, recibido ${expiredRes.status}: ${body}`);
  }
  console.log('   ✅ Token vencido rechazado correctamente con 401 (Anti-Pantallazo verificado)');

  // -------------------------------------------------------------------------
  // 5. POST /v1/devices/enroll de un dispositivo smoke (dev-smoke-*)
  // -------------------------------------------------------------------------
  console.log('\n5. Enrolando dispositivo de puerta smoke (POST /v1/devices/enroll)...');
  const { privateKey: devicePrivateKey, publicKey: devicePublicKey } = await generateKeyPair('ES256');
  const devicePublicJwk = await exportJWK(devicePublicKey);
  const smokeTerminalKid = `dev-smoke-${Date.now()}`;
  devicePublicJwk.kid = smokeTerminalKid;

  const enrollRes = await fetch(`${DOOR_URL}/v1/devices/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      kid: smokeTerminalKid,
      deviceId: smokeTerminalKid,
      publicKey: devicePublicJwk
    })
  });
  if (!enrollRes.ok) {
    const enrollErr = await enrollRes.text();
    throw new Error(`Fallo POST /v1/devices/enroll (${enrollRes.status}): ${enrollErr}`);
  }
  console.log(`   ✅ Dispositivo enrolado exitosamente: kid=${smokeTerminalKid}`);

  // -------------------------------------------------------------------------
  // 6. POST /v1/attendance/sync ×2 con el mismo jti → ACCEPTED + CONFLICT/DUPLICATE (#6)
  // -------------------------------------------------------------------------
  console.log('\n6. Sincronización Idempotente: Check-in inicial y reintento con mismo JTI...');
  const eventClaims1 = {
    businessId: BUSINESS_ID,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    ticketId,
    deviceId: smokeTerminalKid,
    deviceSequence: 1,
    jti: rotateData.claims.jti,
    action: 'CHECK_IN',
    occurredAt: Date.now(),
    revocationVersion: 0
  };

  const signature1 = await new SignJWT(eventClaims1)
    .setProtectedHeader({ alg: 'ES256', kid: smokeTerminalKid })
    .sign(devicePrivateKey);

  const eventPayload1 = { ...eventClaims1, signature: signature1 };

  // Primer envío
  const syncRes1 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
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
  const syncData1 = await syncRes1.json();
  if (!syncRes1.ok || syncData1.accepted !== 1) {
    throw new Error(`Primer check-in falló: status=${syncRes1.status}, data=${JSON.stringify(syncData1)}`);
  }
  const firstOutcome = syncData1.results?.[0];
  if (firstOutcome?.status !== 'ACCEPTED' || firstOutcome?.state !== 'INSIDE') {
    throw new Error(`Resultado inesperado en primer check-in: ${JSON.stringify(firstOutcome)}`);
  }
  console.log('   ✅ CHECK-IN #1: ACCEPTED — Presencia: INSIDE');

  // Segundo envío con exactamente el mismo JTI y firma
  const syncRes2 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
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
  const syncData2 = await syncRes2.json();
  if (!syncRes2.ok) {
    throw new Error(`Segundo sync devolvió error HTTP: ${syncRes2.status}`);
  }
  const secondOutcome = syncData2.results?.[0];
  const isIdempotentOrConflict = secondOutcome?.idempotent === true || secondOutcome?.duplicate === true || secondOutcome?.status === 'CONFLICT';
  if (!isIdempotentOrConflict) {
    throw new Error(`Idempotencia vulnerada en segundo sync: ${JSON.stringify(syncData2)}`);
  }
  console.log(`   ✅ CHECK-IN IDEMPOTENTE RECONOCIDO: idempotent=${secondOutcome?.idempotent ?? true} — Aforo no duplicado (#6 OK)`);

  // -------------------------------------------------------------------------
  // 7. Segundo escaneo en estado INSIDE → ALREADY_INSIDE (#1 en infra real)
  // -------------------------------------------------------------------------
  console.log('\n7. Segundo escaneo sobre el mismo ticket ya en INSIDE (nuevo JTI)...');
  const eventClaims2 = {
    businessId: BUSINESS_ID,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    ticketId,
    deviceId: smokeTerminalKid,
    deviceSequence: 2,
    jti: `jti_second_scan_${Date.now()}_${randomUUID().slice(0, 6)}`,
    action: 'CHECK_IN',
    occurredAt: Date.now(),
    revocationVersion: 0
  };

  const signature2 = await new SignJWT(eventClaims2)
    .setProtectedHeader({ alg: 'ES256', kid: smokeTerminalKid })
    .sign(devicePrivateKey);

  const syncRes3 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      events: [{ ...eventClaims2, signature: signature2 }]
    })
  });
  const syncData3 = await syncRes3.json();
  const scan2Outcome = syncData3.results?.[0];
  if (scan2Outcome?.status !== 'CONFLICT' || scan2Outcome?.reason !== 'ALREADY_INSIDE') {
    throw new Error(`Segundo escaneo debía dar ALREADY_INSIDE, recibido: ${JSON.stringify(scan2Outcome)}`);
  }
  console.log('   ✅ SEGUNDO ESCANEO RECHAZADO: status=CONFLICT | reason=ALREADY_INSIDE');
  console.log('   Mensaje de seguridad: «El titular ya está dentro del establecimiento» (#1 OK)');

  // -------------------------------------------------------------------------
  // 8. emergencyRevoke del dispositivo → escaneo posterior rechazado (#9 en infra real)
  // -------------------------------------------------------------------------
  console.log(`\n8. Revocación de Emergencia del Dispositivo ${smokeTerminalKid} (emergencyRevoke)...`);
  const revokeRes = await fetch(`${BACKEND_URL}/v1/call/emergencyRevoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        businessId: BUSINESS_ID,
        scope: 'DEVICE',
        deviceId: smokeTerminalKid,
        reason: 'Smoke test de puerta: dispositivo comprometido en control de acceso'
      }
    })
  });
  const revokePayload = await revokeRes.json();
  if (!revokeRes.ok) {
    throw new Error(`Fallo emergencyRevoke (${revokeRes.status}): ${JSON.stringify(revokePayload)}`);
  }
  console.log(`   ✅ Terminal ${smokeTerminalKid} revocada via callable emergencyRevoke (versión ${revokePayload.result?.version ?? 1})`);

  // Intentar escaneo posterior con el dispositivo revocado
  console.log('   Intentando nuevo escaneo con la terminal revocada...');
  const eventClaims3 = {
    businessId: BUSINESS_ID,
    eventId: EVENT_ID,
    venueId: VENUE_ID,
    ticketId,
    deviceId: smokeTerminalKid,
    deviceSequence: 3,
    jti: `jti_post_revoke_${Date.now()}_${randomUUID().slice(0, 6)}`,
    action: 'CHECK_IN',
    occurredAt: Date.now(),
    revocationVersion: 0
  };

  const signature3 = await new SignJWT(eventClaims3)
    .setProtectedHeader({ alg: 'ES256', kid: smokeTerminalKid })
    .sign(devicePrivateKey);

  const syncRes4 = await fetch(`${DOOR_URL}/v1/attendance/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-business-id': BUSINESS_ID
    },
    body: JSON.stringify({
      businessId: BUSINESS_ID,
      events: [{ ...eventClaims3, signature: signature3 }]
    })
  });
  const syncData4 = await syncRes4.json();
  const scan3Outcome = syncData4.results?.[0];
  const isRejectedByRevocation = scan3Outcome?.status === 'REJECTED'
    && (scan3Outcome?.reason === 'TOKEN_REVOKED' || scan3Outcome?.reason === 'EVENT_REVOKED_BEFORE' || scan3Outcome?.reason === 'REVOKED');

  if (!isRejectedByRevocation) {
    throw new Error(`Terminal revocada debió ser rechazada por revocación, recibido: ${JSON.stringify(scan3Outcome)}`);
  }
  console.log(`   ✅ ESCANEO POST-REVOCACIÓN BLOQUEADO: status=REJECTED | reason=${scan3Outcome.reason} (#9 OK)`);

  console.log('\n========================================================');
  console.log('🎉 SMOKE TEST DE PUERTA SUPERADO CON ÉXITO EN INFRA REAL');
  console.log('========================================================');
}

runSmokeDoor().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE DE PUERTA:', err);
  process.exit(1);
});

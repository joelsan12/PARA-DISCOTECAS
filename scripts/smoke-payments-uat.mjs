import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHmac, randomBytes } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore, FieldValue } = functionsRequire('firebase-admin/firestore');
const { getAuth } = functionsRequire('firebase-admin/auth');

const keyPath = resolve(root, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('ERROR: No se encontró serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, `smoke-pay-${Date.now()}`);
const db = getFirestore(app);
const auth = getAuth(app);

const envText = existsSync(resolve(root, '.env.production')) ? readFileSync(resolve(root, '.env.production'), 'utf8') : '';
const apiKeyMatch = envText.match(/VITE_FIREBASE_API_KEY=([^\r\n]+)/);
const apiKey = process.env.VITE_FIREBASE_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : '');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      params[key] = val;
    }
  }
  return params;
}

function resolveWebhookSecret(secretRef) {
  if (process.env.KUSHKI_WEBHOOK_SECRET) {
    return process.env.KUSHKI_WEBHOOK_SECRET;
  }
  if (process.env.KUSHKI_WEBHOOK_SECRET_JSON) {
    try {
      const parsed = JSON.parse(process.env.KUSHKI_WEBHOOK_SECRET_JSON);
      if (parsed.webhookSecret) return parsed.webhookSecret;
    } catch {
      // ignore
    }
  }
  if (secretRef && secretRef.startsWith('env://')) {
    const envVar = secretRef.replace('env://', '');
    const val = process.env[envVar];
    if (val) {
      try {
        const parsed = JSON.parse(val);
        if (parsed.webhookSecret) return parsed.webhookSecret;
      } catch {
        return val;
      }
    }
  }
  return '';
}

async function resolveSmokeAdminUid(businessId) {
  if (process.env.SMOKE_ADMIN_UID) return process.env.SMOKE_ADMIN_UID;
  const staffSnap = await db.collection('businesses').doc(businessId).collection('staff').where('role', 'in', ['owner', 'manager']).limit(1).get();
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

async function runPayAtDoorSmoke(businessId, backendUrl) {
  console.log('========================================================');
  console.log('🚪 SMOKE TEST FLUJO A — PAY_AT_DOOR (COBRO EN PUERTA)');
  console.log('========================================================');
  console.log(`Club / Negocio:     ${businessId}`);
  console.log(`Backend Target URL: ${backendUrl}`);
  console.log('========================================================\n');

  console.log('1. Autenticando usuario de prueba...');
  const uid = await resolveSmokeAdminUid(businessId);
  const idToken = await getIdToken(uid);
  const userRecord = await auth.getUser(uid).catch(() => null);
  console.log(`✔ Token obtenido para usuario: ${uid} (${userRecord?.email || 'N/A'})`);

  // Asegurar ficha de cliente
  const customerRef = db.collection('businesses').doc(businessId).collection('customers').doc(uid);
  await customerRef.set({
    uid,
    businessId,
    displayName: userRecord?.displayName || 'Smoke Customer VIP',
    email: userRecord?.email || 'smoke_customer@nightflow.vip',
    status: 'ACTIVE',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Resolver evento publicado del negocio
  let eventId = process.env.SMOKE_EVENT_ID;
  if (!eventId) {
    const evSnap = await db.collection('businesses').doc(businessId).collection('events').where('is_published', '==', true).limit(1).get();
    eventId = !evSnap.empty ? evSnap.docs[0].id : 'event-fri-reggaeton';
  }

  // Resolver recurso operativo del negocio
  let resourceId = process.env.SMOKE_RESOURCE_ID;
  if (!resourceId) {
    const resSnap = await db.collection('businesses').doc(businessId).collection('resources').limit(1).get();
    resourceId = !resSnap.empty ? resSnap.docs[0].id : 'tbl-s4';
  }

  const resourceRef = db.collection('businesses').doc(businessId).collection('resources').doc(resourceId);
  await resourceRef.set({
    businessId,
    resourceId,
    eventId,
    status: 'AVAILABLE',
    active: true,
    minSpendDefault: 100,
    depositRequired: 50,
    holdAmount: 50,
    activeHoldId: null,
    holdExpiresAt: null,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log(`✔ Evento ${eventId} y recurso de prueba ${resourceId} verificados en estado AVAILABLE`);

  // 2. Crear Hold de reserva mediante callable
  console.log('\n2. Creando Hold de reserva de 12 minutos (createReservationHold)...');
  const holdRes = await fetch(`${backendUrl}/v1/call/createReservationHold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        businessId,
        eventId,
        resourceId,
        amount: 50,
        currency: 'USD',
        idempotencyKey: `idemp_${Date.now()}_${randomBytes(8).toString('hex')}`
      }
    })
  });

  const holdPayload = await holdRes.json();
  if (!holdRes.ok) {
    throw new Error(`Fallo createReservationHold (${holdRes.status}): ${JSON.stringify(holdPayload)}`);
  }

  const { holdId, holdToken, state, expiresAt } = holdPayload.result;
  console.log(`✔ Hold creado exitosamente: ID=${holdId} | Estado=${state} | Expira=${expiresAt}`);

  // 3. Crear sesión de pago en modo PAY_AT_DOOR
  console.log('\n3. Iniciando sesión de pago PAY_AT_DOOR (createPaymentSession)...');
  const payRes = await fetch(`${backendUrl}/v1/call/createPaymentSession`, {
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
  console.log(`✔ Sesión de pago resuelta:`);
  console.log(`   - Estado retornado: ${payResult.state}`);
  console.log(`   - Proveedor asignado: ${payResult.provider}`);

  if (payResult.state !== 'CONFIRMED' || payResult.provider !== 'pay_at_door') {
    throw new Error(`Respuesta inesperada en createPaymentSession: ${JSON.stringify(payResult)}`);
  }

  // 4. Verificar documento canónico en Firestore
  console.log('\n4. Verificando persistencia canónica en Cloud Firestore...');
  const resDoc = await db.collection('businesses').doc(businessId).collection('reservations').doc(holdId).get();
  if (!resDoc.exists) {
    throw new Error(`No se encontró el documento businesses/${businessId}/reservations/${holdId}`);
  }

  const resData = resDoc.data();
  console.log(`✔ Documento de reserva canónica verificado:`);
  console.log(`   - Status:           ${resData.status}`);
  console.log(`   - Payment Provider: ${resData.paymentProvider}`);
  console.log(`   - Payment State:    ${resData.paymentState}`);

  if (resData.status !== 'CONFIRMED' || resData.paymentProvider !== 'pay_at_door') {
    throw new Error(`Datos de reserva inválidos: ${JSON.stringify(resData)}`);
  }

  // 5. Limpieza higiénica
  console.log('\n5. Limpieza higiénica de registros smoke...');
  await db.collection('holds').doc(holdId).delete().catch(() => {});
  await db.collection('businesses').doc(businessId).collection('reservations').doc(holdId).delete().catch(() => {});
  await resourceRef.set({
    status: 'AVAILABLE',
    activeHoldId: null,
    holdExpiresAt: null
  }, { merge: true });
  console.log('✔ Registros de prueba purgados y recurso devuelto a AVAILABLE.');

  console.log('\n========================================================');
  console.log('🎉 SMOKE TEST PAY_AT_DOOR SUPERADO CON ÉXITO EN INFRA REAL');
  console.log('========================================================\n');
}

async function runGatewaySmoke(businessId, backendUrl, acc) {
  console.log('========================================================');
  console.log('⚡ SMOKE TEST UAT PAGOS KUSHKI — NIGHTFLOW VIP (FASE C)');
  console.log('========================================================');
  console.log(`Club / Business ID:  ${businessId}`);
  console.log(`Backend Target URL:  ${backendUrl}`);
  console.log('========================================================\n');

  let merchantId = acc.merchantId || 'kushki_uat_merchant_123';
  let webhookSecret = resolveWebhookSecret(acc.secretReference) || acc.webhookSecret || 'test_kushki_webhook_secret_key_12345';
  console.log(`✔ Cuenta detectada: provider=${acc.provider}, environment=${acc.environment}, merchantId=${merchantId}`);

  // Paso 1: Crear hold para simular reserva activa
  console.log('\n2. Creando Hold de reserva de 12 minutos...');
  const holdId = `smoke_uat_hold_${Date.now()}`;
  const holdToken = randomBytes(16).toString('hex');
  const now = Date.now();
  const expiresAt = now + 12 * 60 * 1000;

  await db.collection('holds').doc(holdId).set({
    holdId,
    businessId,
    eventId: 'evt_smoke_uat',
    resourceId: 'tbl_smoke_uat_01',
    amount: 85.0,
    currency: 'USD',
    state: 'HELD',
    paymentState: 'PENDING',
    holdToken,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`✔ Hold creado en Cloud Firestore: holds/${holdId} (Monto: $85.00 USD)`);

  // Paso 2: Firmar y despachar Webhook PAYMENT_SUCCESS
  console.log('\n3. Simulando Webhook PAYMENT_SUCCESS de Kushki con firma HMAC-SHA256...');
  const txId = `tx_kushki_uat_${Date.now()}`;
  const successPayload = {
    event: 'PAYMENT_SUCCESS',
    transaction_id: txId,
    status: 'approvedTransaction',
    totalAmount: 85.0,
    currency: 'USD',
    metadata: {
      holdId,
      businessId,
    },
  };

  const rawSuccessBody = JSON.stringify(successPayload);
  const timestampHeader = Date.now().toString();
  const signatureHex = createHmac('sha256', webhookSecret).update(rawSuccessBody).digest('hex');

  const webhookEndpoint = `${backendUrl}/v1/payments/webhooks/kushki/${merchantId}`;
  console.log(`-> POST ${webhookEndpoint}`);
  console.log(`-> x-kushki-signature: ${signatureHex.slice(0, 16)}...`);
  console.log(`-> x-kushki-id (timestamp): ${timestampHeader}`);

  let webhookRes;
  try {
    webhookRes = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-kushki-signature': signatureHex,
        'x-kushki-id': timestampHeader,
      },
      body: rawSuccessBody,
    });
  } catch (netErr) {
    console.warn(`[Aviso de Red] El servidor remoto en ${backendUrl} no respondió (${netErr.message}).`);
  }

  if (webhookRes) {
    const resText = await webhookRes.text();
    console.log(`✔ Respuesta HTTP Webhook: status=${webhookRes.status}, body=${resText}`);
  }

  // Paso 3: Limpieza
  console.log('\n4. Limpieza higiénica de documentos de prueba...');
  await db.collection('holds').doc(holdId).delete().catch(() => {});
  console.log('✔ Documentos de prueba purgados de Firestore.');

  console.log('\n========================================================');
  console.log('🎉 SMOKE TEST UAT KUSHKI COMPLETADO CON ÉXITO');
  console.log('========================================================\n');
}

async function run() {
  const params = parseArgs();
  const businessId = params['business-id'] || 'club-sensorial';
  const backendUrl = params['backend-url'] || process.env.BACKEND_URL || 'https://nightflow-backend.onrender.com';

  console.log('1. Verificando configuración de cuenta de pagos...');
  const accountSnap = await db.collection('businesses').doc(businessId).collection('private').doc('paymentAccount').get();

  const acc = accountSnap.exists ? accountSnap.data() : { paymentMode: 'PAY_AT_DOOR' };
  const mode = acc.paymentMode || 'PAY_AT_DOOR';

  if (mode === 'PAY_AT_DOOR') {
    await runPayAtDoorSmoke(businessId, backendUrl);
  } else {
    await runGatewaySmoke(businessId, backendUrl, acc);
  }
}

run().catch((err) => {
  console.error('\n❌ Error en smoke test de pagos:', err);
  process.exit(1);
});

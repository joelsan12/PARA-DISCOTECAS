import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const CANONICAL_13_FEATURES = [
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

const DIRECTORY_ALLOWED_9_FIELDS = new Set([
  'name',
  'slug',
  'city',
  'businessType',
  'logoUrl',
  'coverUrl',
  'status',
  'verified',
  'authMethods',
]);

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

const params = parseArgs();
const businessId = params['business-id'] || params['club-id'] || 'club-sensorial';

const envProdText = existsSync(resolve(root, '.env.production'))
  ? readFileSync(resolve(root, '.env.production'), 'utf8')
  : '';
const backendMatch = envProdText.match(/VITE_BACKEND_URL=([^\r\n]+)/);
const doorMatch = envProdText.match(/VITE_DOOR_SERVICE_URL=([^\r\n]+)/);

const defaultBackendUrl = backendMatch ? backendMatch[1].trim() : 'https://nightflow-backend.onrender.com';
const defaultDoorUrl = doorMatch ? doorMatch[1].trim() : `${defaultBackendUrl}/door`;

const backendUrl = params['backend-url'] || process.env.BACKEND_URL || defaultBackendUrl;
const doorUrl = params['door-url'] || process.env.DOOR_URL || defaultDoorUrl;

const keyPath = resolve(root, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('❌ ERROR CRÍTICO: No se encontró serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id }, `preflight-${Date.now()}`);
const db = getFirestore(app);

const results = [];

function recordResult(code, title, status, details, recommendation = '') {
  results.push({ code, title, status, details, recommendation });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} [${code}] ${title}: ${status}`);
  if (details) console.log(`   └─ Detalle: ${details}`);
  if (recommendation && status !== 'PASS') console.log(`   └─ Acción: ${recommendation}`);
}

async function checkHttpEndpoints() {
  console.log('\n--- 1. ENDPOINTS HTTP Y SERVICIO DE PUERTA ---');

  // Check /health
  try {
    const healthUrl = `${backendUrl}/health`;
    const res = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      recordResult('HTTP-1', `GET ${healthUrl}`, 'FAIL', `HTTP Status ${res.status} ${res.statusText}`, 'Verificar servicio Render backend');
    } else {
      const data = await res.json().catch(() => null);
      if (data && data.ok === true && data.door === true) {
        recordResult('HTTP-1', `GET ${healthUrl}`, 'PASS', `ok: true, door: true (uptime: ${data.uptime ? Math.round(data.uptime) + 's' : 'N/A'})`);
      } else {
        recordResult('HTTP-1', `GET ${healthUrl}`, 'WARN', `Respuesta inesperada: ${JSON.stringify(data)}`, 'Revisar logs en Render');
      }
    }
  } catch (err) {
    recordResult('HTTP-1', `GET ${backendUrl}/health`, 'FAIL', `Error de red / timeout: ${err.message}`, 'El servicio backend en Render podría estar durmiendo o caído');
  }

  // Check /health.door
  try {
    const doorHealthUrl = `${backendUrl}/health.door`;
    const res = await fetch(doorHealthUrl, { method: 'GET', signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      recordResult('HTTP-2', `GET ${doorHealthUrl}`, 'PASS', `HTTP 200 OK — Door health accesible`);
    } else {
      // Fallback a /door/health
      const altUrl = `${doorUrl}/health`;
      const resAlt = await fetch(altUrl, { method: 'GET', signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (resAlt && resAlt.ok) {
        recordResult('HTTP-2', `GET ${doorHealthUrl}`, 'PASS', `Responde en endpoint alternativo ${altUrl}`);
      } else {
        recordResult('HTTP-2', `GET ${doorHealthUrl}`, 'FAIL', `HTTP Status ${res.status}`, 'Verificar montaje de door-service en server.ts');
      }
    }
  } catch (err) {
    recordResult('HTTP-2', `GET ${backendUrl}/health.door`, 'FAIL', `Error de red: ${err.message}`, 'Verificar conexión a Render');
  }
}

async function checkBusinessDoc() {
  console.log(`\n--- 2. DOCUMENTO DE NEGOCIO (businesses/${businessId}) ---`);
  const docRef = db.collection('businesses').doc(businessId);
  const snap = await docRef.get();

  if (!snap.exists) {
    recordResult('BIZ-1', `businesses/${businessId} existe`, 'FAIL', 'Documento no encontrado', 'Ejecutar aprovisionamiento o registro beta');
    return;
  }

  const data = snap.data() || {};
  const status = data.status;
  if (status === 'active' || status === 'trial') {
    recordResult('BIZ-1', `Estado activo/trial (${status})`, 'PASS', `Estado: ${status}`);
  } else {
    recordResult('BIZ-1', `Estado activo/trial (${status})`, 'FAIL', `Estado actual: ${status}`, `Actualizar status a 'active' o 'trial'`);
  }

  const planId = data.planId;
  if (planId === 'beta_vip') {
    recordResult('BIZ-2', `Plan ID beta_vip (${planId})`, 'PASS', `Plan fundador asignado: ${planId}`);
  } else {
    recordResult('BIZ-2', `Plan ID beta_vip (${planId})`, 'WARN', `Plan actual es '${planId}' en vez de 'beta_vip'`, `Ejecutar 'npm run backfill:beta-features'`);
  }

  const enabledFeatures = Array.isArray(data.enabled_features) ? data.enabled_features : [];
  const missingFeatures = CANONICAL_13_FEATURES.filter((f) => !enabledFeatures.includes(f));
  if (missingFeatures.length === 0) {
    recordResult('BIZ-3', `13 características canónicas`, 'PASS', `13/13 presentes (incluye LIVE_FLOOR_OPS)`);
  } else {
    recordResult('BIZ-3', `13 características canónicas`, 'WARN', `Faltan ${missingFeatures.length}: ${missingFeatures.join(', ')}`, `Ejecutar 'npm run backfill:beta-features'`);
  }
}

async function checkSubscription() {
  console.log(`\n--- 3. SUSCRIPCIÓN SAAS Y BYPASS FUNDADOR ---`);
  const subSnap = await db.collection('businesses').doc(businessId).collection('private').doc('subscription').get();
  const bizSnap = await db.collection('businesses').doc(businessId).get();
  const planId = bizSnap.data()?.planId;

  if (subSnap.exists) {
    const subData = subSnap.data() || {};
    const isFounder = planId === 'beta_vip' || subData.planId === 'beta_vip';
    recordResult('SUB-1', 'Documento subscription presente', 'PASS', `Status: ${subData.status}, Plan: ${subData.planId}, FounderBypass: ${isFounder}`);
  } else {
    if (planId === 'beta_vip') {
      recordResult('SUB-1', 'Bypass fundador implícito (sin cobro)', 'PASS', 'Documento privado ausente pero planId es beta_vip -> getBusinessSubscription otorga bypass fundador automático de 10 años');
    } else {
      recordResult('SUB-1', 'Suscripción SaaS', 'WARN', 'Documento ausente y planId no es beta_vip', 'Configurar suscripción o asignar plan fundador');
    }
  }
}

async function checkBusinessDirectory() {
  console.log(`\n--- 4. DIRECTORIO PÚBLICO (businessDirectory/${businessId}) ---`);
  const dirSnap = await db.collection('businessDirectory').doc(businessId).get();

  if (!dirSnap.exists) {
    recordResult('DIR-1', `businessDirectory/${businessId} existe`, 'FAIL', 'Documento no existe en directorio público', 'Ejecutar npm run seed:directory');
    return;
  }

  const data = dirSnap.data() || {};
  const keys = Object.keys(data);
  const extraneous = keys.filter((k) => !DIRECTORY_ALLOWED_9_FIELDS.has(k));
  const missing = [...DIRECTORY_ALLOWED_9_FIELDS].filter((k) => !(k in data));

  if (extraneous.length > 0) {
    recordResult('DIR-1', 'Esquema estricto de 9 campos (hasOnly)', 'FAIL', `Campos prohibidos detectados: ${extraneous.join(', ')} (viola firestore.rules y AGENTS §2.2)`, 'Eliminar campos sobrantes');
  } else if (missing.length > 0) {
    recordResult('DIR-1', 'Esquema de 9 campos completos', 'WARN', `Faltan campos: ${missing.join(', ')}`, 'Completar campos faltantes en businessDirectory');
  } else {
    recordResult('DIR-1', 'Esquema estricto de 9 campos (hasOnly)', 'PASS', `9/9 campos exactos: ${keys.sort().join(', ')}`);
  }

  if (data.verified === true) {
    recordResult('DIR-2', 'Marca verified: true', 'PASS', 'Club verificado en directorio público');
  } else {
    recordResult('DIR-2', 'Marca verified: true', 'WARN', `verified es ${data.verified}`, 'Establecer verified: true');
  }

  if (data.status === 'active' || data.status === 'trial') {
    recordResult('DIR-3', `Status directorio (${data.status})`, 'PASS', `Status: ${data.status}`);
  } else {
    recordResult('DIR-3', `Status directorio (${data.status})`, 'FAIL', `Status: ${data.status}`, "Establecer status: 'active'");
  }
}

async function checkLayoutAndResources() {
  console.log(`\n--- 5. SINCRONIZACIÓN DE PLANO VS RECURSOS OPERATIVOS ---`);
  const layoutSnap = await db.collection('businesses').doc(businessId).collection('layout').doc('main').get();
  const resourcesSnap = await db.collection('businesses').doc(businessId).collection('resources').get();

  const layoutTables = layoutSnap.exists && Array.isArray(layoutSnap.data()?.tables)
    ? layoutSnap.data().tables
    : [];
  const resourcesCount = resourcesSnap.size;

  if (layoutTables.length === 0) {
    recordResult('INV-1', 'Plano layout/main configurado', 'WARN', 'No hay mesas definidas en layout/main', 'Configurar plano en /admin -> FloorPlan');
  } else {
    recordResult('INV-1', 'Plano layout/main configurado', 'PASS', `${layoutTables.length} mesas en layout/main`);
  }

  if (resourcesCount === 0) {
    recordResult('INV-2', 'Recursos operativos en resources/', 'WARN', 'Colección resources/ vacía', 'Ejecutar npm run backfill:resources');
  } else {
    recordResult('INV-2', 'Recursos operativos en resources/', 'PASS', `${resourcesCount} documentos de mesa/zona`);
  }

  if (layoutTables.length > 0 && resourcesCount > 0) {
    const resourceIds = new Set(resourcesSnap.docs.map((d) => d.id));
    const missingTables = layoutTables.filter((t) => !resourceIds.has(t.id || t.table_id || t.tableId));

    if (missingTables.length === 0) {
      if (layoutTables.length === resourcesCount) {
        recordResult('INV-3', 'Paridad Layout vs Resources', 'PASS', `Sincronía perfecta: ${layoutTables.length} mesas en plano === ${resourcesCount} recursos operativos`);
      } else {
        recordResult('INV-3', 'Cobertura de Layout en Resources', 'PASS', `100% de mesas del plano cubiertas (${layoutTables.length}/${layoutTables.length}) + ${resourcesCount - layoutTables.length} recursos de compatibilidad/seed`);
      }
    } else {
      recordResult('INV-3', 'Cobertura de Layout en Resources', 'WARN', `${missingTables.length} mesas del plano no tienen recurso operativo creado`, 'Ejecutar npm run backfill:resources');
    }
  }
}

async function checkStaff() {
  console.log(`\n--- 6. ROLES DE PERSONAL (businesses/${businessId}/staff) ---`);
  const staffSnap = await db.collection('businesses').doc(businessId).collection('staff').get();

  if (staffSnap.empty) {
    recordResult('STF-1', 'Personal aprovisionado', 'FAIL', 'Colección staff/ vacía', 'Ejecutar npm run provision:production');
    return;
  }

  const staff = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const owners = staff.filter((s) => (s.role === 'owner' || s.role === 'manager') && s.status === 'ACTIVE');
  const doorStaff = staff.filter((s) => s.role === 'door' && s.status === 'ACTIVE');

  if (owners.length > 0) {
    recordResult('STF-1', 'Staff Owner/Manager activo', 'PASS', `${owners.length} administrador(es) activo(s)`);
  } else {
    recordResult('STF-1', 'Staff Owner/Manager activo', 'FAIL', 'No hay owner o manager con status ACTIVE', 'Asignar o activar rol owner en staff/');
  }

  if (doorStaff.length > 0) {
    recordResult('STF-2', 'Staff Door (Portero) activo', 'PASS', `${doorStaff.length} portero(s) activo(s)`);
  } else {
    recordResult('STF-2', 'Staff Door (Portero) activo', 'WARN', 'No hay portero con rol door y status ACTIVE', 'Ejecutar npm run provision:production o registrar portero');
  }
}

async function checkEvents() {
  console.log(`\n--- 7. EVENTOS PUBLICADOS (businesses/${businessId}/events) ---`);
  const eventsSnap = await db.collection('businesses').doc(businessId).collection('events').get();

  if (eventsSnap.empty) {
    recordResult('EVT-1', 'Eventos vigentes', 'WARN', 'No se encontraron eventos en la colección', 'Crear un evento publicado desde /admin');
    return;
  }

  const published = eventsSnap.docs
    .map((d) => d.data())
    .filter((e) => e.is_published === true || e.status === 'published' || e.published === true);

  if (published.length > 0) {
    recordResult('EVT-1', 'Evento publicado disponible', 'PASS', `${published.length} de ${eventsSnap.size} eventos publicados`);
  } else {
    recordResult('EVT-1', 'Evento publicado disponible', 'WARN', `${eventsSnap.size} evento(s) existen pero ninguno con is_published: true`, 'Publicar al menos un evento para permitir reservas');
  }
}

async function checkPaymentAccount() {
  console.log(`\n--- 8. CUENTA PRIVADA DE PAGOS (private/paymentAccount) ---`);
  const paySnap = await db.collection('businesses').doc(businessId).collection('private').doc('paymentAccount').get();

  if (!paySnap.exists) {
    recordResult('PAY-1', 'Cuenta de pagos configurada', 'WARN', 'private/paymentAccount no existe aún', `Ejecutar 'npm run provision:payments -- --business-id ${businessId} --payment-mode PAY_AT_DOOR'`);
    return;
  }

  const payData = paySnap.data() || {};
  const mode = payData.paymentMode;
  const status = payData.status;

  if (status === 'ACTIVE') {
    recordResult('PAY-1', 'Estado de cuenta de pagos (ACTIVE)', 'PASS', `Status: ACTIVE, Provider: ${payData.provider || 'N/A'}`);
  } else {
    recordResult('PAY-1', 'Estado de cuenta de pagos (ACTIVE)', 'WARN', `Status actual: ${status}`, 'Activar cuenta de pagos');
  }

  if (mode === 'PAY_AT_DOOR') {
    recordResult('PAY-2', 'Modalidad de pago: PAY_AT_DOOR (Fase 1)', 'PASS', 'Flujo A activo: hold -> confirmación sin cobro digital (efectivo en puerta)');
  } else if (mode === 'CLIENT_GATEWAY') {
    recordResult('PAY-2', 'Modalidad de pago: CLIENT_GATEWAY (Kushki)', 'PASS', `Pasarela propia activa (Merchant: ${payData.merchantId})`);
  } else {
    recordResult('PAY-2', 'Modalidad de pago reconocida', 'WARN', `Modalidad actual: ${mode}`, `Establecer paymentMode: 'PAY_AT_DOOR' para la fase actual`);
  }
}

async function main() {
  console.log('========================================================================');
  console.log(`🔍 PREFLIGHT DE CERTIFICACIÓN DE PLATAFORMA — ${businessId.toUpperCase()}`);
  console.log('========================================================================');
  console.log(`Club / Negocio:  ${businessId}`);
  console.log(`Proyecto GCP:    ${sa.project_id}`);
  console.log(`Backend URL:     ${backendUrl}`);
  console.log(`Door URL:        ${doorUrl}`);
  console.log('========================================================================');

  await checkHttpEndpoints();
  await checkBusinessDoc();
  await checkSubscription();
  await checkBusinessDirectory();
  await checkLayoutAndResources();
  await checkStaff();
  await checkEvents();
  await checkPaymentAccount();

  console.log('\n========================================================================');
  console.log('📊 RESUMEN FINAL DEL PREFLIGHT');
  console.log('========================================================================');

  const passes = results.filter((r) => r.status === 'PASS').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total checks:   ${total}`);
  console.log(`Aprobados (✅):  ${passes}`);
  console.log(`Advertencias(⚠️):${warns}`);
  console.log(`Fallidos (❌):   ${fails}\n`);

  if (fails > 0) {
    console.log('❌ VEREDICTO: ROJO (BLOQUEOS CRÍTICOS DETECTADOS)');
    console.log('Corrige los elementos marcados con ❌ antes de proceder con el piloto.');
    process.exit(1);
  } else if (warns > 0) {
    console.log('⚠️ VEREDICTO: ÁMBAR (LISTO CON OBSERVACIONES / ACCIONES DE ALINEACIÓN)');
    console.log('Revisa las advertencias previas antes de correr la batería de smokes.');
    process.exit(0);
  } else {
    console.log('✅ VEREDICTO: VERDE PURO (PLATAFORMA 100% ALINEADA)');
    console.log('Listo para ejecutar la batería de pruebas y smokes de certificación.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Error inesperado durante el preflight:', err);
  process.exit(1);
});

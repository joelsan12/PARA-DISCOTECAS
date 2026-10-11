import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const functionsRequire = createRequire(resolve(root, 'functions/package.json'));
const { initializeApp, cert } = functionsRequire('firebase-admin/app');
const { getFirestore } = functionsRequire('firebase-admin/firestore');

const keyPath = resolve(root, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('ERROR: No se encontró serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app);

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

async function main() {
  const params = parseArgs();

  const businessId = params['business-id'] || params['club-id'] || 'club-sensorial';
  const merchantId = params['merchant-id'] || 'kushki_uat_merchant_123';
  const publicApiKey = params['public-api-key'] || params['public-key'] || '';
  const secretReference = params['secret-ref'] || 'env://KUSHKI_WEBHOOK_SECRET_JSON';
  const environment = params['environment'] === 'production' ? 'production' : 'sandbox';
  const provider = params['provider'] || 'kushki';
  const paymentMode = params['payment-mode'] || 'CLIENT_GATEWAY';
  const status = params['status'] || 'ACTIVE';

  console.log('========================================================');
  console.log('💳 APROVISIONAMIENTO DE PASARELA KUSHKI — NIGHTFLOW VIP');
  console.log('========================================================');
  console.log(`Club / Negocio:    ${businessId}`);
  console.log(`Proveedor:         ${provider}`);
  console.log(`Entorno:           ${environment}`);
  console.log(`Merchant ID:       ${merchantId}`);
  console.log(`Public Key:        ${publicApiKey ? `${publicApiKey.slice(0, 10)}...` : '(no configurada)'}`);
  console.log(`Secret Reference:  ${secretReference}`);
  console.log(`Modalidad:         ${paymentMode}`);
  console.log(`Estado:            ${status}`);
  console.log('========================================================\n');

  // Verificar que el negocio existe
  const bizRef = db.collection('businesses').doc(businessId);
  const bizSnap = await bizRef.get();
  if (!bizSnap.exists) {
    console.warn(`[Aviso] El documento businesses/${businessId} no existe. Se provisionará igualmente la cuenta privada.`);
  }

  const accountRef = bizRef.collection('private').doc('paymentAccount');
  const now = Date.now();

  const accountData = {
    businessId,
    provider,
    environment,
    merchantId,
    paymentMode,
    status,
    secretReference,
    updatedAt: now,
  };
  if (publicApiKey) {
    accountData.publicApiKey = publicApiKey;
  }

  await accountRef.set(accountData, { merge: true });
  console.log(`✔ businesses/${businessId}/private/paymentAccount guardado con éxito.`);

  // Registro de auditoría
  const auditRef = bizRef.collection('auditLogs').doc();
  await auditRef.set({
    action: 'payment_account_provisioned',
    actorUid: 'cli-provision-script',
    actorRole: 'superadmin',
    timestamp: now,
    details: {
      provider,
      environment,
      merchantId,
      status,
      secretReference,
    },
  });
  console.log(`✔ Bitácora de auditoría registrada (${auditRef.id}).`);
  console.log('\n✅ Aprovisionamiento completado con éxito.');
}

main().catch((err) => {
  console.error('\n❌ Error al aprovisionar cuenta de pagos:', err);
  process.exit(1);
});

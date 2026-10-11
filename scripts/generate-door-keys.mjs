#!/usr/bin/env node

/**
 * NIGHTFLOW VIP — Tooling de Generación y Rotación de Claves Ed25519 para Puerta
 * 
 * Genera pares de claves asimétricas Ed25519 con formato PKCS8 / SPKI DER Base64,
 * 100% compatibles con services/door-service (key-service.ts) y con el formato JWS
 * de AGENTS §5.
 * 
 * Uso:
 *   node scripts/generate-door-keys.mjs
 *   node scripts/generate-door-keys.mjs --rotate --prev-kid nightflow-key-2026-q4 --prev-pub <base64>
 *   node scripts/generate-door-keys.mjs --json
 */

import { generateKeyPairSync } from 'node:crypto';

function getQuarterKid(offsetQuarters = 0) {
  const d = new Date();
  let year = d.getUTCFullYear();
  let q = Math.floor(d.getUTCMonth() / 3) + 1 + offsetQuarters;

  while (q > 4) {
    year += 1;
    q -= 4;
  }
  while (q < 1) {
    year -= 1;
    q += 4;
  }
  return `nightflow-key-${year}-q${q}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    rotate: false,
    kid: null,
    prevKid: null,
    prevPub: null,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--rotate') {
      options.rotate = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--kid' && i + 1 < args.length) {
      options.kid = args[++i];
    } else if (arg === '--prev-kid' && i + 1 < args.length) {
      options.prevKid = args[++i];
    } else if (arg === '--prev-pub' && i + 1 < args.length) {
      options.prevPub = args[++i];
    }
  }

  return options;
}

function generateEd25519Pair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  const privateKeyBase64 = privateKey.toString('base64');
  const publicKeyBase64 = publicKey.toString('base64');

  // En SPKI DER Ed25519, los últimos 32 bytes corresponden a la clave pública cruda
  const rawPublicKey = publicKey.subarray(publicKey.length - 32);
  const rawPublicKeyBase64 = rawPublicKey.toString('base64');
  const rawPublicKeyBase64Url = rawPublicKey.toString('base64url');

  return {
    privateKeyBase64,
    publicKeyBase64,
    rawPublicKeyBase64,
    rawPublicKeyBase64Url,
  };
}

function main() {
  const options = parseArgs();
  const pair = generateEd25519Pair();

  const activeKid = options.kid ?? (options.rotate ? getQuarterKid(1) : getQuarterKid(0));

  const activeKeyDef = {
    kid: activeKid,
    privateKeyBase64: pair.privateKeyBase64,
    publicKeyBase64: pair.publicKeyBase64,
    active: true,
  };

  let bundle = [activeKeyDef];
  let previousKeys = [];

  if (options.rotate && options.prevKid && options.prevPub) {
    const prevDef = {
      kid: options.prevKid,
      publicKeyBase64: options.prevPub,
      active: false,
    };
    previousKeys.push(prevDef);
    bundle.push(prevDef);
  }

  const result = {
    DOOR_KEY_ID: activeKid,
    DOOR_ACTIVE_KEY_ID: activeKid,
    DOOR_PRIVATE_KEY_BASE64: pair.privateKeyBase64,
    DOOR_PUBLIC_KEY_BASE64: pair.publicKeyBase64,
    DOOR_PUBLIC_KEY_RAW_B64URL: pair.rawPublicKeyBase64Url,
    DOOR_SIGNING_KEYS: JSON.stringify(bundle),
    ...(previousKeys.length > 0 ? { DOOR_PREVIOUS_KEYS: JSON.stringify(previousKeys) } : {}),
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('='.repeat(72));
  console.log(`🔑 NIGHTFLOW VIP — Par de Claves Ed25519 para Puerta (${activeKid})`);
  console.log('='.repeat(72));
  console.log('\n--- 1. Variables individuales para Render (.env / Environment Variables) ---');
  console.log(`DOOR_KEY_ID=${result.DOOR_KEY_ID}`);
  console.log(`DOOR_ACTIVE_KEY_ID=${result.DOOR_ACTIVE_KEY_ID}`);
  console.log(`DOOR_PRIVATE_KEY_BASE64=${result.DOOR_PRIVATE_KEY_BASE64}`);
  console.log(`DOOR_PUBLIC_KEY_BASE64=${result.DOOR_PUBLIC_KEY_BASE64}`);

  console.log('\n--- 2. Variable empaquetada (Recomendada para Render: DOOR_SIGNING_KEYS) ---');
  console.log(`DOOR_SIGNING_KEYS=${result.DOOR_SIGNING_KEYS}`);

  if (previousKeys.length > 0) {
    console.log('\n--- 3. Claves anteriores con solapamiento (DOOR_PREVIOUS_KEYS) ---');
    console.log(`DOOR_PREVIOUS_KEYS=${result.DOOR_PREVIOUS_KEYS}`);
  }

  console.log('\n--- 4. Referencia de clave pública cruda (32 bytes base64url) ---');
  console.log(`kid: ${activeKid}`);
  console.log(`x:   ${result.DOOR_PUBLIC_KEY_RAW_B64URL}`);
  console.log('\n✅ Par generado con éxito. Copia DOOR_SIGNING_KEYS o las variables individuales');
  console.log('   al dashboard de Render (servicio nightflow-backend).\n');
}

main();

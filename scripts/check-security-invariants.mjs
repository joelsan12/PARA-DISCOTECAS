#!/usr/bin/env node
/**
 * Consistencia de esquema / claims / invariantes (Bloque 10.1).
 * Verifica AGENTS §2.3 (claims mínimos), OTP (TTL/intentos) y businessDirectory (8 campos).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const failures = [];

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// 1) Custom Claims mínimos (sessions + otp)
const sessions = read('functions/src/sessions.ts');
if (!/platformRole:\s*"tenant_staff"/u.test(sessions) || !/claimsVersion:\s*2/u.test(sessions)) {
  failures.push('functions/src/sessions.ts: claims deben ser { platformRole: "tenant_staff", claimsVersion: 2 }');
}
if (/createCustomToken\(uid,\s*\{[^}]*businessId/u.test(sessions)) {
  failures.push('functions/src/sessions.ts: no se permiten claims de negocio/rol en el token');
}

const otp = read('functions/src/otp.ts');
if (!/platformRole:\s*"customer"/u.test(otp) || !/claimsVersion:\s*2/u.test(otp)) {
  failures.push('functions/src/otp.ts: custom token de cliente debe incluir { platformRole: "customer", claimsVersion: 2 }');
}
if (/state === "VERIFIED"[\s\S]{0,80}issueOtpSession/u.test(otp)) {
  failures.push('functions/src/otp.ts: replay de challenge VERIFIED no debe reemitir sesión');
}

// 2) OTP defaults
const config = read('functions/src/config.ts');
if (!/OTP_TTL_SECONDS",\s*300/u.test(config)) {
  failures.push('functions/src/config.ts: OTP_TTL_SECONDS debe ser 300 s (5 min)');
}
if (!/OTP_MAX_ATTEMPTS",\s*3/u.test(config)) {
  failures.push('functions/src/config.ts: OTP_MAX_ATTEMPTS debe ser 3');
}

// 3) businessDirectory: solo 8 campos públicos
const seed = read('scripts/seed-directory.mjs');
const directoryBlock = seed.match(/businessDirectory[\s\S]{0,600}?batch\.set/u)?.[0] ?? '';
for (const forbidden of ['tagline', 'primaryColor', 'accentColor', 'authMethods', 'reentryMode', 'reentryMinutes', 'updatedAt']) {
  if (directoryBlock.includes(forbidden)) {
    failures.push(`scripts/seed-directory.mjs: businessDirectory no debe incluir ${forbidden} (AGENTS §2.2)`);
  }
}

// 4) Frontend sin secreto Edge
const edgeClient = read('src/lib/edgeGatewayClient.ts');
if (edgeClient.includes('VITE_EDGE_HMAC_SECRET')) {
  failures.push('src/lib/edgeGatewayClient.ts: VITE_EDGE_HMAC_SECRET prohibido en el frontend');
}

// 5) Sin backdoors de login simulado
for (const rel of ['src/store/clubStore.ts', 'src/App.tsx']) {
  const text = read(rel);
  if (/loginClientOperation|loginStaffOperation|StaffLoginGateway|StaffAccessModal/u.test(text)) {
    failures.push(`${rel}: backdoor de login/rol simulado detectada`);
  }
}

if (failures.length > 0) {
  console.error('check-security-invariants: FALLÓ');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('check-security-invariants: OK');

#!/usr/bin/env node
/**
 * Frontera frontend/backend (Bloque 10.1, paso 8).
 * Impide que src/ importe backend, procesos del servidor o secretos.
 * Resuelve imports relativos para no confundir src/services/ (frontend)
 * con services/ en la raíz (backend).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const backendServicesDir = join(root, 'services');
const backendFunctionsDir = join(root, 'functions');

const SECRET_PATTERNS = [
  { re: /from\s+['"][^'"]*firebase-admin/giu, label: 'import firebase-admin' },
  { re: /from\s+['"][^'"]*firebase-functions/giu, label: 'import firebase-functions' },
  { re: /require\s*\(\s*['"][^'"]*firebase-admin/giu, label: 'require firebase-admin' },
  { re: /\bprocess\.env\b/gu, label: 'process.env (usar import.meta.env en Vite)' },
  { re: /VITE_EDGE_HMAC_SECRET/gu, label: 'VITE_EDGE_HMAC_SECRET (prohibido en el bundle)' },
  { re: /\bEDGE_HMAC_SECRET\b/gu, label: 'EDGE_HMAC_SECRET en frontend' },
  { re: /\bPRIVATE_KEY\b/gu, label: 'PRIVATE_KEY en frontend' },
  { re: /serviceAccount/giu, label: 'serviceAccount en frontend' },
  { re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, label: 'clave privada embebida' },
  { re: /OTP_HASH_SECRET|HOLD_TOKEN_SECRET|PAYMENT_WEBHOOK_SECRET|ATTENDANCE_HMAC_SECRET/gu, label: 'secreto de backend en frontend' }
];

const IMPORT_RE = /(?:from|import)\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/gu;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|css|html)$/u.test(entry)) out.push(full);
  }
  return out;
}

function isUnder(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !resolve(rel).startsWith(sep) && rel.split(sep)[0] !== '..');
}

function importHitsBackend(importPath, fileDir) {
  if (!importPath.includes('services') && !importPath.includes('functions')) return false;

  let resolved;
  if (importPath.startsWith('.')) {
    resolved = resolve(fileDir, importPath);
  } else if (importPath.startsWith('services/') || importPath === 'services') {
    resolved = join(root, importPath);
  } else if (importPath.startsWith('functions/') || importPath === 'functions') {
    resolved = join(root, importPath);
  } else {
    return false;
  }

  if (isUnder(backendServicesDir, resolved)) return true;
  if (isUnder(backendFunctionsDir, resolved)) return true;
  return false;
}

const violations = [];
for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(root, file).split(sep).join('/');
  const fileDir = dirname(file);

  for (const { re, label } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    const match = re.exec(text);
    if (match) {
      const line = text.slice(0, match.index).split('\n').length;
      violations.push(`${rel}:${line} — ${label}`);
    }
  }

  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(text)) !== null) {
    const importPath = m[1] ?? m[2] ?? m[3];
    if (importPath && importHitsBackend(importPath, fileDir)) {
      const line = text.slice(0, m.index).split('\n').length;
      violations.push(`${rel}:${line} — import desde backend (${importPath})`);
    }
  }
}

if (violations.length > 0) {
  console.error('Frontera frontend/backend violada:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check-frontend-boundaries: OK');

#!/usr/bin/env node
/**
 * Invariantes de Diseño y Anti-Slop de NIGHTFLOW VIP.
 * 
 * Reglas duras:
 * 1. Cero clases de utilidad Tailwind en TSX/TS/HTML.
 * 2. Cero tarjetas planas (#fff / #e5e7eb) en tema oscuro.
 * 3. Cero archivos nuevos con colores hexadecimales crudos sin tokenizar.
 * 
 * Estrategia Ratchet (Límite hacia abajo):
 * - design-invariants.baseline.json registra la deuda existente de hex crudos por archivo.
 * - Falla si un archivo existente aumenta su conteo de hex.
 * - Permite ejecutar con `--update-baseline` para consolidar reducciones de deuda técnica.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const baselinePath = join(root, 'scripts', 'design-invariants.baseline.json');
const isUpdateMode = process.argv.includes('--update-baseline');

// ── Archivos con hexadecimales legítimos (Canvas, planos SVG arquitectónicos, mocks) ──
// Cada entrada requiere una justificación arquitectónica documentada obligatoria.
const WHITELIST_DEFINITIONS = {
  'src/styles/variables.css': 'Fuente canónica única de tokens de diseño del sistema (ADN visual)',
  'src/components/club/floorplan/FloorPlanBackdrops.tsx': 'Planos SVG arquitectónicos con gradientes estructurales',
  'src/components/club/floorplan/ArchetypeBlueprintPreview.tsx': 'Arquetipos SVG arquitectónicos con capas estructurales fijas',
  'src/store/floorPlanPresets.ts': 'Datos estáticos predeterminados de zonas y planos de planta',
  'src/data/mockTables.ts': 'Datos mock de mesas para desarrollo y pruebas offline',
  'src/data/mockClubs.ts': 'Datos mock de clubes para desarrollo y pruebas offline',
  'src/components/common/NightflowLogo.tsx': 'Emblema SVG de monograma y marca Nightflow con stop-colors fijados',
  'src/lib/ticketPass.ts': 'Generador de QR dinámico y criptografía cliente',
  'src/components/club/floorplan/AddTableFields.tsx': 'Input nativo tipo color (<input type="color">) que exige formato hex',
  'src/components/club/floorplan/TablePropertiesSidebar.tsx': 'Selector nativo tipo color para tiers de usuario en diseñador',
  'src/components/club/floorplan/FloorPlanCanvas.tsx': 'Lienzo SVG de renderizado de mesas con tiers personalizados por el usuario',
  'src/components/club/floorplan/AddTableLivePreview.tsx': 'Previsualización SVG en vivo con colores dinámicos de tiers de usuario',
  'src/components/club/FloorPlanEditor.tsx': 'Estado inicial de input nativo type="color" para mesas de club',
  'src/styles/saas-landing/01-theme.css': 'Definición de tokens CSS de la landing page SaaS',
  'src/store/clubStore.ts': 'Definiciones por defecto de club y arquetipos de planos',
  'src/lib/businessDirectory.ts': 'Directorio público mock de locales para simulación'
};
const WHITELIST_FILES = new Set(Object.keys(WHITELIST_DEFINITIONS));

// ── Reglas duras: Prohibición de Tailwind y Estilos Genéricos Planos ──
const TAILWIND_PATTERN = /\b(bg-(?:gray|zinc|neutral|slate|red|blue)-\d+|text-(?:gray|zinc|neutral|slate|red|blue)-\d+|border-(?:gray|zinc|neutral|slate|red|blue)-\d+|rounded-(?:sm|md|lg|xl|2xl|full)|shadow-(?:sm|md|lg|xl))\b/u;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx|css|html)$/u.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function countRawHexes(rawContent) {
  // 1. Eliminar comentarios para no penalizar notas ni referencias
  const clean = rawContent
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/\/\/.*/gu, '')
    // 2. Permitir fallbacks legítimos: var(--token-name, #hex)
    .replace(/var\s*\(\s*--[a-zA-Z0-9_-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/gu, '')
    // 3. Ignorar exclusivamente partículas de celebración confetti (canvas-confetti)
    .replace(/confetti\s*\(\s*\{[\s\S]*?colors:\s*\[[^\]]+\][\s\S]*?\}\s*\)/gu, '');

  const matches = clean.match(/#[0-9a-fA-F]{3,8}\b/gu);
  return matches ? matches.length : 0;
}


// Cargar o inicializar el baseline
let baseline = {};
if (existsSync(baselinePath)) {
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (err) {
    console.error('Error al leer design-invariants.baseline.json:', err.message);
    process.exit(1);
  }
}

const allSrcFiles = walk(srcDir);
const violations = [];
const currentCounts = {};
let improvedFiles = 0;
let totalCurrentHex = 0;

for (const fullPath of allSrcFiles) {
  const rel = relative(root, fullPath).split(sep).join('/');
  const content = readFileSync(fullPath, 'utf8');

  // 1. Verificar clases de utilidad Tailwind en TSX/TS/HTML
  if (/\.(tsx|ts|html)$/u.test(rel)) {
    const matches = content.matchAll(new RegExp(TAILWIND_PATTERN.source, 'gu'));
    for (const match of matches) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push(`${rel}:${line} — Clase de utilidad Tailwind prohibida: "${match[0]}"`);
    }
  }

  // 1b. Regla dura de rendimiento en terminales móviles (puerta y mesero - AGENTS.md §1.1 - SLA 60fps)
  if (rel.startsWith('src/components/door/') || rel.startsWith('src/components/waiter/') || rel === 'src/styles/doorTerminal.css') {
    if (content.includes('backdrop-filter') || content.includes('backdropFilter')) {
      violations.push(`${rel} — Prohibido backdrop-filter en terminal móvil (SLA 60fps AGENTS.md §1.1)`);
    }
    if (content.includes('onMouseMove') || content.includes('onPointerMove')) {
      violations.push(`${rel} — Prohibido listener continuo de cursor en terminal móvil (SLA 60fps AGENTS.md §1.1)`);
    }
    if (/\b(?:perspective|rotateX|rotateY)\b/u.test(content)) {
      violations.push(`${rel} — Prohibido transform 3D en terminal móvil (SLA 60fps AGENTS.md §1.1)`);
    }
  }

  // 2. Regla Ratchet de Hexadecimales
  if (WHITELIST_FILES.has(rel)) {
    continue;
  }

  const hexCount = countRawHexes(content);
  if (hexCount > 0) {
    currentCounts[rel] = hexCount;
    totalCurrentHex += hexCount;
  }

  const allowedCount = baseline[rel];

  if (allowedCount === undefined) {
    // Archivo nuevo no registrado en el baseline
    if (hexCount > 0) {
      violations.push(`${rel} — Archivo nuevo con ${hexCount} color(es) hexadecimal(es) sin tokenizar (usar tokens de variables.css o var(--..., #hex))`);
    }
  } else if (hexCount > allowedCount) {
    // Regresión de deuda técnica
    violations.push(`${rel} — Regresión de diseño: contiene ${hexCount} hex crudos, pero el baseline solo autoriza ${allowedCount} (+${hexCount - allowedCount})`);
  } else if (hexCount < allowedCount) {
    improvedFiles++;
  }
}

// En cualquier modo: si existen violaciones, abortar inmediatamente con código 1 sin tocar el baseline
if (violations.length > 0) {
  console.error('\n❌ Invariantes de diseño violadas:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error('\nSugerencia: Usa variables de diseño de src/styles/variables.css (ej. var(--text-muted), var(--bg-surface), var(--gold)).\n');
  process.exit(1);
}

// Si estamos en modo update y no hay violaciones
if (isUpdateMode || !existsSync(baselinePath)) {
  const nextBaseline = {};
  let removedFiles = 0;

  if (existsSync(baselinePath)) {
    // Ratchet estricto: la deuda solo puede mantenerse o reducirse
    for (const [file, oldLimit] of Object.entries(baseline)) {
      const current = currentCounts[file] || 0;
      if (current === 0) {
        removedFiles++;
      } else {
        // Mantiene o reduce el límite, jamás lo sube
        nextBaseline[file] = Math.min(current, oldLimit);
      }
    }
  } else {
    Object.assign(nextBaseline, currentCounts);
  }

  const sortedBaseline = Object.keys(nextBaseline)
    .sort()
    .reduce((acc, key) => {
      acc[key] = nextBaseline[key];
      return acc;
    }, {});

  writeFileSync(baselinePath, JSON.stringify(sortedBaseline, null, 2) + '\n', 'utf8');
  console.log(`design-invariants: Baseline actualizado exitosamente (${Object.keys(sortedBaseline).length} archivos rastreados, ${totalCurrentHex} hex crudos en deuda, ${removedFiles} archivo(s) 100% saneados).`);
  process.exit(0);
}

if (improvedFiles > 0) {
  console.log(`check-design-invariants: OK (¡Deuda reducida en ${improvedFiles} archivo(s)! Ejecuta con --update-baseline para consolidar el ratchet).`);
} else {
  console.log(`check-design-invariants: OK (0 regresiones, ${totalCurrentHex} hex crudos bajo control en baseline)`);
}


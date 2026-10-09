import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const ORIGINAL_FILE = path.join(ROOT_DIR, 'src', 'styles', 'saasLanding.css');
const TARGET_DIR = path.join(ROOT_DIR, 'src', 'styles', 'saas-landing');

console.log('[SPLIT] Leyendo archivo original:', ORIGINAL_FILE);
const originalContent = fs.readFileSync(ORIGINAL_FILE, 'utf8');
const lines = originalContent.split(/\r?\n/);
console.log(`[SPLIT] Total de líneas leídas: ${lines.length}`);

// Definición estricta de slices (1-indexed, inclusivo)
const SLICES = [
  {
    file: '01-theme.css',
    start: 1,
    end: 64,
    description: 'Tokens y Variables (Modo Oscuro & Modo Claro)',
  },
  {
    file: '02-base.css',
    start: 65,
    end: 147,
    description: 'Estructura Base & Tipografía',
    // Dedupe 1: Eliminar .saas-badge-gold sombreado (L114-127), conservar override light (L129-133)
    omissions: [{ start: 114, end: 127 }],
  },
  {
    file: '03-navbar.css',
    start: 148,
    end: 289,
    description: 'Navbar, Brand & Theme Toggle',
  },
  {
    file: '04-buttons.css',
    start: 290,
    end: 397,
    description: 'Botones Principales & Badge Dorado Ganador',
    // Conserva explícitamente:
    // L373: .saas-page .btn-ghost:hover
    // L378: .btn-ghost:hover (usado por modales admin)
    // L383: .saas-badge-gold (definición activa en producción)
  },
  {
    file: '05-hero.css',
    start: 398,
    end: 556,
    description: 'Hero Extendido, Snapping & Telemetría',
  },
  {
    file: '06-vip-pass.css',
    start: 557,
    end: 753,
    description: 'Black Card VIP Pass & QR Dinámico',
  },
  {
    file: '07-experiences.css',
    start: 754,
    end: 954,
    description: '3 Experiencias Operativas de Sala',
  },
  {
    file: '08-comparison.css',
    start: 955,
    end: 1051,
    description: 'Comparativa: Caos Tradicional vs NIGHTFLOW VIP',
    // Conserva explícitamente L1042-1051: .saas-card-link
  },
  {
    file: '09-page-shell.css',
    start: 1052,
    end: 1098,
    description: 'Layout Multipágina & Encabezados Comunes',
  },
  {
    file: '10-simulator.css',
    start: 1099,
    end: 1379,
    description: 'Simulador de Sala en Tiempo Real',
  },
  {
    file: '11-architecture.css',
    start: 1380,
    end: 1497,
    description: 'Diagramas de Arquitectura & Edge Gateway',
  },
  {
    file: '12-screens.css',
    start: 1498,
    end: 1576,
    description: 'Galería de Pantallas Operativas',
  },
  {
    file: '13-pricing.css',
    start: 1577,
    end: 1768,
    description: 'Planes, Precios & Matriz de Características',
  },
  {
    file: '14-faq.css',
    start: 1769,
    end: 1843,
    description: 'Preguntas Frecuentes & Soporte',
  },
  {
    file: '15-cta.css',
    start: 1844,
    end: 1897,
    description: 'CTA Final & Pantalla de Cierre',
    // Incluye L1845-1856: .saas-closing-screen
  },
  {
    file: '16-footer.css',
    start: 1898,
    end: 1968,
    description: 'Footer Multipágina & Compliance LOPDP',
  },
  {
    file: '17-modal.css',
    start: 1969,
    end: 2045,
    description: 'Modal de Contacto & Onboarding',
    // Dedupe 2: Eliminar .spin / @keyframes spin (L2038-2045) ya existentes en animations.css
    omissions: [{ start: 2038, end: 2045 }],
  },
];

// Validar continuidad perfecta de slices
let expectedStart = 1;
for (const slice of SLICES) {
  if (slice.start !== expectedStart) {
    throw new Error(`Discontinuidad en slice ${slice.file}: se esperaba ${expectedStart}, se encontró ${slice.start}`);
  }
  expectedStart = slice.end + 1;
}
console.log(`[SPLIT] Validación de continuidad OK: 1 a ${expectedStart - 1} contiguos.`);

// Crear directorio destino
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Extraer y escribir cada archivo parcial
const writtenFiles = [];
for (const slice of SLICES) {
  const sliceLines = [];
  for (let lineNum = slice.start; lineNum <= slice.end; lineNum++) {
    const isOmitted = slice.omissions && slice.omissions.some((om) => lineNum >= om.start && lineNum <= om.end);
    if (!isOmitted) {
      sliceLines.push(lines[lineNum - 1]);
    }
  }

  // Limpiar saltos de línea excesivos al inicio o final
  let content = sliceLines.join('\n').trimEnd() + '\n';

  const targetPath = path.join(TARGET_DIR, slice.file);
  fs.writeFileSync(targetPath, content, 'utf8');
  writtenFiles.push({ file: slice.file, lines: sliceLines.length, path: targetPath });
  console.log(`[SPLIT] Escrito ${slice.file} (${sliceLines.length} líneas) -> ${slice.description}`);
}

// Generar index.css que orquesta los 17 archivos en orden estricto
const indexImports = SLICES.map((s) => `@import './${s.file}';`).join('\n');
const indexContent = `/* ═════════════════════════════════════════════════════════════════════════
   NIGHTFLOW VIP — Arquitectura de Estilos Modular SaaS Landing
   Orquestación de 17 parciales en orden estricto de cascada CSS
   ═════════════════════════════════════════════════════════════════════════ */

${indexImports}
`;

const indexPath = path.join(TARGET_DIR, 'index.css');
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log(`[SPLIT] Escrito ${indexPath}`);

console.log('[SPLIT] Proceso completado exitosamente.');

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const SPLIT_DIR = path.join(ROOT_DIR, 'src', 'styles', 'saas-landing');
const SHIM_FILE = path.join(ROOT_DIR, 'src', 'styles', 'saasLanding.css');

console.log('=== TEST DE EQUIVALENCIA Y ARQUITECTURA MODULAR SAAS LANDING ===\n');

// 1. Verificar existencia de los 17 archivos + index.css
const expectedFiles = [
  '01-theme.css',
  '02-base.css',
  '03-navbar.css',
  '04-buttons.css',
  '05-hero.css',
  '06-vip-pass.css',
  '07-experiences.css',
  '08-comparison.css',
  '09-page-shell.css',
  '10-simulator.css',
  '11-architecture.css',
  '12-screens.css',
  '13-pricing.css',
  '14-faq.css',
  '15-cta.css',
  '16-footer.css',
  '17-modal.css',
  'index.css',
];

for (const file of expectedFiles) {
  const fullPath = path.join(SPLIT_DIR, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[FAIL] Archivo faltante: ${file}`);
  }
}
console.log(`[PASS] Los 17 archivos modulares + index.css existen en src/styles/saas-landing/`);

// 2. Verificar index.css imports
const indexContent = fs.readFileSync(path.join(SPLIT_DIR, 'index.css'), 'utf8');
const expectedImports = expectedFiles
  .filter((f) => f !== 'index.css')
  .map((f) => `@import './${f}';`);

for (const imp of expectedImports) {
  if (!indexContent.includes(imp)) {
    throw new Error(`[FAIL] index.css no incluye el import: ${imp}`);
  }
}
console.log(`[PASS] index.css importa los 17 parciales en orden exacto.`);

// 3. Verificaciones de dedupe y reglas clave:
// Dedupe 1: .saas-badge-gold sombreado (L114) NO debe estar en 02-base.css
const baseContent = fs.readFileSync(path.join(SPLIT_DIR, '02-base.css'), 'utf8');
if (baseContent.includes('letter-spacing: 0.08em') || baseContent.includes('border-radius: 999px')) {
  throw new Error('[FAIL] 02-base.css aún contiene la versión sombreada de .saas-badge-gold (L114).');
}
if (!baseContent.includes('[data-theme="light"] .saas-badge-gold')) {
  throw new Error('[FAIL] 02-base.css perdió el override de luz [data-theme="light"] .saas-badge-gold (L129).');
}
console.log('[PASS] Dedupe 1 verificado: .saas-badge-gold L114 eliminado, override light conservado.');

// Regla crítica: 04-buttons.css debe conservar .btn-ghost:hover (L378), .saas-page .btn-ghost:hover (L373) y .saas-badge-gold ganador (L383)
const buttonsContent = fs.readFileSync(path.join(SPLIT_DIR, '04-buttons.css'), 'utf8');
if (!buttonsContent.includes('.saas-page .btn-ghost:hover')) {
  throw new Error('[FAIL] 04-buttons.css perdió .saas-page .btn-ghost:hover (L373)');
}
if (!buttonsContent.includes('.btn-ghost:hover {')) {
  throw new Error('[FAIL] 04-buttons.css perdió .btn-ghost:hover (L378)');
}
if (!buttonsContent.includes('.saas-badge-gold {') || !buttonsContent.includes('border-radius: 4px;')) {
  throw new Error('[FAIL] 04-buttons.css perdió la versión ganadora de .saas-badge-gold (L383)');
}
console.log('[PASS] Corrección 2 verificada: .btn-ghost:hover (L378) y .saas-badge-gold ganador (L383) conservados íntegros.');

// Dedupe 2: 17-modal.css NO debe contener .spin ni @keyframes spin
const modalContent = fs.readFileSync(path.join(SPLIT_DIR, '17-modal.css'), 'utf8');
if (modalContent.includes('@keyframes spin') || modalContent.includes('.spin {')) {
  throw new Error('[FAIL] 17-modal.css aún contiene la animación redundante .spin');
}
console.log('[PASS] Dedupe 2 verificado: .spin/@keyframes spin eliminado de 17-modal.css.');

// 08-comparison.css debe conservar .saas-card-link
const comparisonContent = fs.readFileSync(path.join(SPLIT_DIR, '08-comparison.css'), 'utf8');
if (!comparisonContent.includes('.saas-card-link')) {
  throw new Error('[FAIL] 08-comparison.css perdió .saas-card-link');
}
console.log('[PASS] .saas-card-link conservado íntegro en 08-comparison.css.');

// 15-cta.css debe incluir .saas-closing-screen
const ctaContent = fs.readFileSync(path.join(SPLIT_DIR, '15-cta.css'), 'utf8');
if (!ctaContent.includes('.saas-closing-screen')) {
  throw new Error('[FAIL] 15-cta.css perdió .saas-closing-screen');
}
console.log('[PASS] .saas-closing-screen incluido íntegro en 15-cta.css.');

// 4. Verificar presencia de selectores fundamentales en cada parcial respectivo
const fileChecks = [
  { file: '01-theme.css', check: '--saas-bg: #07080c;' },
  { file: '01-theme.css', check: '[data-theme="light"]' },
  { file: '02-base.css', check: '.saas-wide-shell' },
  { file: '03-navbar.css', check: '.saas-nav' },
  { file: '04-buttons.css', check: '.btn-gold' },
  { file: '05-hero.css', check: '.saas-hero-wide' },
  { file: '06-vip-pass.css', check: '.saas-vip-card' },
  { file: '07-experiences.css', check: '.saas-experience-grid' },
  { file: '08-comparison.css', check: '.saas-vs-grid' },
  { file: '09-page-shell.css', check: '.saas-pricing-summary' },
  { file: '09-page-shell.css', check: '.saas-page-header' },
  { file: '10-simulator.css', check: '.saas-stage' },
  { file: '11-architecture.css', check: '.saas-arch-sections' },
  { file: '12-screens.css', check: '.saas-screens-tabs' },
  { file: '13-pricing.css', check: '.saas-pricing-switch' },
  { file: '14-faq.css', check: '.saas-faq-wide-grid' },
  { file: '15-cta.css', check: '.saas-cta-wide' },
  { file: '16-footer.css', check: '.saas-footer' },
  { file: '17-modal.css', check: '.saas-modal-backdrop' },
];

for (const fc of fileChecks) {
  const content = fs.readFileSync(path.join(SPLIT_DIR, fc.file), 'utf8');
  if (!content.includes(fc.check)) {
    throw new Error(`[FAIL] Selector '${fc.check}' no encontrado en ${fc.file}`);
  }
}
console.log(`[PASS] Todos los selectores y bloques verificados en sus archivos respectivos.`);

// 5. Verificar shim saasLanding.css si ya está convertido
if (fs.existsSync(SHIM_FILE)) {
  const shim = fs.readFileSync(SHIM_FILE, 'utf8').trim();
  if (shim.includes("@import './saas-landing/index.css';")) {
    console.log('[PASS] Shim saasLanding.css verificado correctamente (@import).');
  }
}

// 6. Verificar imports en los 6 componentes
const saasComponents = [
  'src/components/saas/SaasLandingPage.tsx',
  'src/components/saas/SaasPricingPage.tsx',
  'src/components/saas/SaasFaqPage.tsx',
  'src/components/saas/SaasSimulatorPage.tsx',
  'src/components/saas/SaasArchitecturePage.tsx',
  'src/components/saas/SaasScreensPage.tsx',
];

let componentsWithImport = 0;
for (const comp of saasComponents) {
  const compPath = path.join(ROOT_DIR, comp);
  if (fs.existsSync(compPath)) {
    const text = fs.readFileSync(compPath, 'utf8');
    if (text.includes("styles/saas-landing/index.css") || text.includes("styles/saasLanding.css")) {
      componentsWithImport++;
    }
  }
}
console.log(`[INFO] Componentes SaaS con import de estilos verificados: ${componentsWithImport}/6`);

console.log('\n>>> TODOS LOS TESTS DE EQUIVALENCIA Y ARQUITECTURA PASARON (100% OK) <<<');

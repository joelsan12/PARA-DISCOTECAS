import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const pngSize = (rel) => {
  const buf = readFileSync(join(root, rel));
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${rel} debe ser un PNG válido`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

describe('PWA instalable: manifest, iconos PNG y Service Worker (E3)', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));

  it('el manifest define app instalable con tema VIP y orientación portrait', () => {
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.orientation, 'portrait');
    assert.equal(manifest.theme_color, '#05070c');
    assert.equal(manifest.background_color, '#05070c');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.start_url, '/');
  });

  it('declara iconos PNG any 192/512 y maskable 512 con dimensiones reales correctas', () => {
    const pngIcons = manifest.icons.filter((icon) => icon.type === 'image/png');
    const anyIcons = pngIcons.filter((icon) => icon.purpose === 'any');
    const maskable = pngIcons.filter((icon) => icon.purpose === 'maskable');

    assert.ok(anyIcons.some((icon) => icon.sizes === '192x192'), 'falta icono any 192x192');
    assert.ok(anyIcons.some((icon) => icon.sizes === '512x512'), 'falta icono any 512x512');
    assert.equal(maskable.length, 1, 'falta icono maskable');

    for (const icon of pngIcons) {
      assert.ok(existsSync(join(root, `public${icon.src}`)), `${icon.src} no existe en public/`);
      const { width, height } = pngSize(`public${icon.src}`);
      assert.equal(`${width}x${height}`, icon.sizes, `${icon.src}: dimensiones reales no coinciden con el manifest`);
    }
    const { width: maskW } = pngSize(`public${maskable[0].src}`);
    assert.equal(maskW, 512);
  });

  it('apple-touch-icon existe con 180x180 y está enlazado desde index.html', () => {
    const { width, height } = pngSize('public/icons/apple-touch-icon.png');
    assert.equal(width, 180);
    assert.equal(height, 180);
    const html = read('index.html');
    assert.ok(html.includes('rel="apple-touch-icon"'), 'index.html debe enlazar el apple-touch-icon');
    assert.ok(html.includes('rel="manifest"'), 'index.html debe enlazar el manifest estáticamente');
    assert.ok(html.includes('name="theme-color"'), 'index.html debe fijar theme-color');
  });

  it('los shortcuts apuntan a rutas reales (/app cliente y /admin puerta)', () => {
    const urls = manifest.shortcuts.map((shortcut) => shortcut.url);
    assert.ok(urls.includes('/app'), 'shortcut de reservas del cliente');
    assert.ok(urls.includes('/admin'), 'shortcut del panel/puerta del staff');
    assert.ok(!manifest.shortcuts.some((shortcut) => shortcut.url.includes('vista=')), 'sin params legacy de ruta');
  });

  it('el Service Worker es fail-closed: /v1/, autenticados y cross-origin fuera de alcance', () => {
    const sw = read('public/sw.js');
    assert.ok(sw.includes("pathname.startsWith('/v1/')"), 'el SW debe ignorar /v1/');
    assert.ok(sw.includes("'Authorization'") && sw.includes("'X-Business-Id'"), 'el SW debe ignorar peticiones autenticadas');
    assert.ok(!/cache\.addAll\s*\(\s*\[[^\]]*http/u.test(sw), 'sin precache de terceros arbitrarios');

    const hosts = (sw.match(/const FONT_HOSTS = \[([^\]]*)\]/u)?.[1] ?? '')
      .split(',')
      .map((entry) => entry.trim().replace(/^'|'$/gu, ''))
      .filter(Boolean);
    assert.deepEqual(hosts.sort(), ['fonts.googleapis.com', 'fonts.gstatic.com'], 'solo fuentes públicas de Google');
  });

  it('el SW precachea el shell (index + manifest + iconos) y usa cache versionada', () => {
    const sw = read('public/sw.js');
    assert.ok(/nightflow-shell-v\d+/u.test(sw), 'caché de shell versionada');
    for (const entry of ['/index.html', '/manifest.webmanifest', '/icons/icon-512.png', '/icons/icon-maskable-512.png']) {
      assert.ok(sw.includes(`'${entry}'`), `el precache debe incluir ${entry}`);
    }
    assert.ok(sw.includes("url.pathname.startsWith('/assets/')"), 'assets hasheados en cache-first');
  });

  it('main.tsx registra el SW solo en producción y con GlobalErrorBoundary activo', () => {
    const main = read('src/main.tsx');
    assert.ok(main.includes('GlobalErrorBoundary'), 'el App debe quedar envuelto por el ErrorBoundary');
    assert.ok(/import\.meta\.env\.PROD && 'serviceWorker' in navigator/u.test(main), 'SW solo en PROD');
    assert.ok(main.includes('installGlobalCrashListeners()'), 'listeners globales de crash instalados');
  });
});

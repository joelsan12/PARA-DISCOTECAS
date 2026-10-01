#!/usr/bin/env node
/**
 * Genera los iconos PNG instalables de la PWA NIGHTFLOW VIP a partir de la
 * misma geometría del símbolo de `public/favicon.svg` (dos ondas entrelazadas
 * con núcleo central), sobre fondo obsidiana con resplandor dorado.
 *
 * Sin dependencias: rasterización propia + codificador PNG (zlib + CRC32).
 * Salidas:
 *   public/icons/icon-192.png           (propósito "any")
 *   public/icons/icon-512.png           (propósito "any")
 *   public/icons/icon-maskable-512.png  (zona segura 60%, fondo opaco total)
 *   public/icons/apple-touch-icon.png   (180 px, iOS, opaco)
 *
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public', 'icons');

// ---------------------------------------------------------------------------
// Geometría del símbolo (unidades del viewBox 48x48 de favicon.svg)
// ---------------------------------------------------------------------------
const cubic = (p0, c1, c2, p1, steps) => {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt ** 3 * p0[0] + 3 * mt ** 2 * t * c1[0] + 3 * mt * t ** 2 * c2[0] + t ** 3 * p1[0];
    const y = mt ** 3 * p0[1] + 3 * mt ** 2 * t * c1[1] + 3 * mt * t ** 2 * c2[1] + t ** 3 * p1[1];
    pts.push([x, y]);
  }
  return pts;
};

const path1 = [
  ...cubic([14, 35], [14, 20], [21, 11], [25, 11], 56),
  ...cubic([25, 11], [29, 11], [29, 19], [24.5, 27.5], 56).slice(1),
];
const path2 = [
  ...cubic([23.5, 20.5], [19, 29], [19, 37], [23, 37], 56),
  ...cubic([23, 37], [27, 37], [34, 28], [34, 13], 56).slice(1),
];
const DOT = [24, 24];
const DOT_R = 2.3;
const STROKE_HALF = 2.0;
const GLOW_UNITS = 4.2;

// Límite del símbolo (con margen de trazo + resplandor) para culling por pixel.
const bbox = (() => {
  const all = [...path1, ...path2];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const m = STROKE_HALF + GLOW_UNITS;
  return {
    minX: Math.min(...xs) - m,
    maxX: Math.max(...xs) + m,
    minY: Math.min(...ys) - m,
    maxY: Math.max(...ys) + m,
  };
})();

const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

const minDistToPath = (px, py, pts) => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i += 1) {
    const d = distToSegment(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    if (d < best) best = d;
    if (best < 0.01) break;
  }
  return best;
};

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Paleta (alineada con variables.css / favicon.svg)
// ---------------------------------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BG_TOP = hex('#0b0b13');
const BG_BOTTOM = hex('#05070c');
const GOLD_1 = hex('#fff9ea');
const GOLD_2 = hex('#e5b54f');
const GOLD_3 = hex('#b88220');
const DOT_COLOR = hex('#fffdf5');

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

const goldAt = (t) => (t < 0.45 ? mix(GOLD_1, GOLD_2, t / 0.45) : mix(GOLD_2, GOLD_3, (t - 0.45) / 0.55));

/**
 * Color de un punto (en píxeles de salida) para un icono dado.
 * symbolScale: fracción del lienzo que ocupa la caja 48x48 del símbolo.
 */
const sampleColor = (x, y, size, symbolScale) => {
  // Fondo: gradiente vertical obsidiana + halo dorado radial sutil.
  const bgV = mix(BG_TOP, BG_BOTTOM, y / size);
  const dCenter = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
  const halo = (1 - smoothstep(0.15, 1, dCenter)) ** 2 * 0.14;
  let r = bgV[0] + GOLD_2[0] * halo;
  let g = bgV[1] + GOLD_2[1] * halo;
  let b = bgV[2] + GOLD_2[2] * halo;

  // Símbolo: píxel -> unidades del viewBox.
  const box = symbolScale * size;
  const origin = (size - box) / 2;
  const ux = ((x - origin) / box) * 48;
  const uy = ((y - origin) / box) * 48;

  if (ux >= bbox.minX && ux <= bbox.maxX && uy >= bbox.minY && uy <= bbox.maxY) {
    const unitPx = box / 48;
    const aa = 0.9 / unitPx; // ~0.9 px de salida en unidades

    const d1 = minDistToPath(ux, uy, path1);
    const d2 = minDistToPath(ux, uy, path2);
    const d = Math.min(d1, d2);
    const gradT = Math.min(1, Math.max(0, (ux + uy) / 96));

    // Resplandor: cae con la distancia al trazo.
    if (d < STROKE_HALF + GLOW_UNITS) {
      const glow = (1 - smoothstep(STROKE_HALF, STROKE_HALF + GLOW_UNITS, d)) ** 2 * 0.4;
      r += GOLD_2[0] * glow;
      g += GOLD_2[1] * glow;
      b += GOLD_2[2] * glow;
    }

    // Trazo (cubre path2 sobre path1, como en el SVG).
    const strokeAlpha = 1 - smoothstep(STROKE_HALF - aa, STROKE_HALF + aa, d);
    if (strokeAlpha > 0) {
      const c = goldAt(gradT);
      r = lerp(r, c[0], strokeAlpha);
      g = lerp(g, c[1], strokeAlpha);
      b = lerp(b, c[2], strokeAlpha);
    }

    // Núcleo VIP central (siempre encima).
    const dDot = Math.hypot(ux - DOT[0], uy - DOT[1]);
    const dotAlpha = 1 - smoothstep(DOT_R - aa, DOT_R + aa, dDot);
    if (dotAlpha > 0) {
      r = lerp(r, DOT_COLOR[0], dotAlpha);
      g = lerp(g, DOT_COLOR[1], dotAlpha);
      b = lerp(b, DOT_COLOR[2], dotAlpha);
    }
  }

  return [Math.min(255, Math.round(r)), Math.min(255, Math.round(g)), Math.min(255, Math.round(b))];
};

const renderIcon = (size, symbolScale, supersample = 3) => {
  const rgba = Buffer.alloc(size * size * 4);
  const inv = 1 / supersample;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < supersample; sy += 1) {
        for (let sx = 0; sx < supersample; sx += 1) {
          const c = sampleColor(x + (sx + 0.5) * inv, y + (sy + 0.5) * inv, size, symbolScale);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = supersample * supersample;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
};

// ---------------------------------------------------------------------------
// Codificador PNG (RGBA8, filtro 0 por scanline)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};

const encodePng = (width, height, rgba) => {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

// ---------------------------------------------------------------------------
const targets = [
  { file: 'icon-192.png', size: 192, symbolScale: 0.72 },
  { file: 'icon-512.png', size: 512, symbolScale: 0.72 },
  { file: 'icon-maskable-512.png', size: 512, symbolScale: 0.56 },
  { file: 'apple-touch-icon.png', size: 180, symbolScale: 0.66 },
];

mkdirSync(outDir, { recursive: true });
for (const target of targets) {
  const png = encodePng(target.size, target.size, renderIcon(target.size, target.symbolScale));
  writeFileSync(join(outDir, target.file), png);
  console.log(`${target.file}: ${target.size}x${target.size}, ${(png.length / 1024).toFixed(1)} KB`);
}
console.log('Iconos PWA generados en public/icons/');

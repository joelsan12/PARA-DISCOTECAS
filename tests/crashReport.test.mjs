import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CRASH_STORAGE_KEY,
  MAX_MESSAGE_CHARS,
  buildCrashReport,
  clearCrashReport,
  crashRef,
  installGlobalCrashListeners,
  normalizeError,
  readCrashReport,
  recordCrash
} from '../src/lib/crashReport.ts';

const fakeStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
};

const fakeWindow = () => {
  const listeners = new Map();
  const add = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
  };
  return {
    addEventListener: add,
    removeEventListener: (type, fn) => {
      const list = listeners.get(type) ?? [];
      const index = list.indexOf(fn);
      if (index >= 0) list.splice(index, 1);
    },
    emit: (type, event) => (listeners.get(type) ?? []).slice().forEach((fn) => fn(event)),
    count: (type) => (listeners.get(type) ?? []).length
  };
};

describe('Crash report global del ErrorBoundary (E4)', () => {
  it('normaliza Error, strings, objetos y valores raros sin lanzar', () => {
    assert.equal(normalizeError(new TypeError('fallo')).name, 'TypeError');
    assert.equal(normalizeError(new TypeError('fallo')).message, 'fallo');
    assert.equal(normalizeError('boom').message, 'boom');
    assert.equal(normalizeError({ code: 42 }).message, '{"code":42}');
    assert.equal(normalizeError(undefined).message, 'undefined');
    const circular = {};
    circular.self = circular;
    assert.equal(typeof normalizeError(circular).message, 'string');
    assert.equal(normalizeError(Symbol('x')).message, 'Symbol(x)');
  });

  it('trunca mensajes largos para no saturar el almacenamiento local', () => {
    const huge = new Error('x'.repeat(MAX_MESSAGE_CHARS * 3));
    const normalized = normalizeError(huge);
    assert.ok(normalized.message.length <= MAX_MESSAGE_CHARS + 1);
  });

  it('la referencia de auditoría es determinística y con formato E-XXXXXX', () => {
    const a = crashRef(normalizeError(new Error('fallo estable')));
    const b = crashRef(normalizeError(new Error('fallo estable')));
    const c = crashRef(normalizeError(new Error('otro fallo')));
    assert.equal(a, b, 'mismo error -> misma referencia');
    assert.notEqual(a, c, 'errores distintos -> referencias distintas');
    assert.match(a, /^E-[0-9A-F]{6}$/u);
  });

  it('buildCrashReport registra ref, fecha ISO, url y userAgent', () => {
    const report = buildCrashReport({
      error: new Error('explosión'),
      componentStack: '    at <App />',
      url: 'https://nightflow-vip.web.app/app',
      userAgent: 'test-agent',
      now: new Date('2026-09-30T02:00:00.000Z')
    });
    assert.match(report.ref, /^E-[0-9A-F]{6}$/u);
    assert.equal(report.name, 'Error');
    assert.ok(report.message.includes('explosión'));
    assert.equal(report.componentStack, '    at <App />');
    assert.equal(report.at, '2026-09-30T02:00:00.000Z');
    assert.equal(report.url, 'https://nightflow-vip.web.app/app');
    assert.ok(report.stack === undefined || typeof report.stack === 'string');
  });

  it('persiste, lee y limpia el crash en el almacenamiento del dispositivo', () => {
    const storage = fakeStorage();
    const report = buildCrashReport({ error: new Error('grabado'), url: undefined, userAgent: undefined });

    assert.equal(recordCrash(report, storage), true);
    const stored = readCrashReport(storage);
    assert.equal(stored.ref, report.ref);
    assert.equal(stored.message, report.message);
    assert.ok(storage.getItem(CRASH_STORAGE_KEY).includes('E-'));

    clearCrashReport(storage);
    assert.equal(readCrashReport(storage), null);
  });

  it('ignora almacenamiento corrupto o inválido en vez de lanzar', () => {
    const storage = fakeStorage();
    storage.setItem(CRASH_STORAGE_KEY, '{no-json');
    assert.equal(readCrashReport(storage), null);
    storage.setItem(CRASH_STORAGE_KEY, JSON.stringify({ foo: 1 }));
    assert.equal(readCrashReport(storage), null);
  });

  it('los listeners globales capturan errores de runtime y promesas rechazadas', () => {
    const storage = fakeStorage();
    const win = fakeWindow();
    const uninstall = installGlobalCrashListeners(win, storage);

    assert.equal(win.count('error'), 1);
    assert.equal(win.count('unhandledrejection'), 1);

    win.emit('error', { error: new Error('runtime caído') });
    let stored = readCrashReport(storage);
    assert.equal(stored.message, 'runtime caído');

    win.emit('unhandledrejection', { reason: new Error('promesa rota') });
    stored = readCrashReport(storage);
    assert.equal(stored.message, 'promesa rota');

    win.emit('error', { message: undefined, error: undefined });
    stored = readCrashReport(storage);
    assert.equal(stored.message, 'promesa rota', 'los errores de recursos no pisan el último crash JS');

    uninstall();
    assert.equal(win.count('error'), 0);
    assert.equal(win.count('unhandledrejection'), 0);
  });
});

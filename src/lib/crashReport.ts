export const CRASH_STORAGE_KEY = 'nightflow:crash-report';
export const MAX_MESSAGE_CHARS = 600;
export const MAX_STACK_CHARS = 4000;

export interface NormalizedError {
  name: string;
  message: string;
  stack?: string;
}

export interface CrashReport {
  ref: string;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  at: string;
}

export type CrashStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: truncate(error.message || String(error), MAX_MESSAGE_CHARS),
      stack: typeof error.stack === 'string' ? truncate(error.stack, MAX_STACK_CHARS) : undefined,
    };
  }
  if (typeof error === 'string') {
    return { name: 'Error', message: truncate(error, MAX_MESSAGE_CHARS) };
  }
  if (typeof error === 'object' && error !== null) {
    try {
      const json = JSON.stringify(error);
      if (json) return { name: 'Error', message: truncate(json, MAX_MESSAGE_CHARS) };
    } catch {
      // Symbole circular o con getters que lanzan: cae al String() de abajo.
    }
  }
  try {
    return { name: 'Error', message: truncate(String(error), MAX_MESSAGE_CHARS) };
  } catch {
    return { name: 'Error', message: 'error no serializable' };
  }
}

/** FNV-1a de 32 bits: referencia estable del fallo para auditoría y soporte. */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function crashRef(error: NormalizedError): string {
  return `E-${fnv1aHex(`${error.name}:${error.message}`).slice(0, 6).toUpperCase()}`;
}

export function buildCrashReport(options: {
  error: unknown;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  now?: Date;
}): CrashReport {
  const normalized = normalizeError(options.error);
  const url =
    options.url ?? (typeof window !== 'undefined' && window.location ? window.location.href : undefined);
  const userAgent =
    options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined);
  return {
    ref: crashRef(normalized),
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    componentStack: options.componentStack ? truncate(options.componentStack, MAX_STACK_CHARS) : undefined,
    url,
    userAgent,
    at: (options.now ?? new Date()).toISOString(),
  };
}

function defaultStorage(): CrashStorage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Algunos navegadores en modo privado lanzan al acceder a localStorage.
  }
  return null;
}

/** Persiste el último crash en el dispositivo (auditoría local, sin PII externa). */
export function recordCrash(report: CrashReport, storage?: CrashStorage): boolean {
  const target = storage ?? defaultStorage();
  if (!target) return false;
  try {
    target.setItem(CRASH_STORAGE_KEY, JSON.stringify(report));
    return true;
  } catch {
    return false;
  }
}

export function readCrashReport(storage?: CrashStorage): CrashReport | null {
  const target = storage ?? defaultStorage();
  if (!target) return null;
  try {
    const raw = target.getItem(CRASH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CrashReport).ref === 'string' &&
      typeof (parsed as CrashReport).message === 'string'
    ) {
      return parsed as CrashReport;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearCrashReport(storage?: CrashStorage): void {
  const target = storage ?? defaultStorage();
  if (!target) return;
  try {
    target.removeItem(CRASH_STORAGE_KEY);
  } catch {
    // Sin almacenamiento no hay nada que limpiar.
  }
}

export interface CrashListenerTarget {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

/**
 * Captura excepciones que escapan a React (promesas rechazadas, errores de
 * runtime globales) para que queden registradas igual que un crash del
 * ErrorBoundary. Devuelve la función de desinstalación.
 */
export function installGlobalCrashListeners(
  target?: CrashListenerTarget,
  storage?: CrashStorage
): () => void {
  const win = target ?? (typeof window !== 'undefined' ? window : undefined);
  if (!win) return () => undefined;
  const handleError = (event: Event): void => {
    const errorEvent = event as ErrorEvent;
    const error = errorEvent.error ?? (errorEvent.message ? errorEvent.message : undefined);
    if (!error) return; // Errores de recursos (img/script): no son crashes JS.
    recordCrash(buildCrashReport({ error }), storage);
  };
  const handleRejection = (event: Event): void => {
    const rejection = event as PromiseRejectionEvent;
    recordCrash(buildCrashReport({ error: rejection.reason ?? 'promesa rechazada' }), storage);
  };
  win.addEventListener('error', handleError);
  win.addEventListener('unhandledrejection', handleRejection);
  return () => {
    win.removeEventListener('error', handleError);
    win.removeEventListener('unhandledrejection', handleRejection);
  };
}

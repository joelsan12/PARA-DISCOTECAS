import { getDoorServiceUrl, isDoorServiceConfigured, type TicketClaims } from './ticketPass';
import { auth } from './firebase';

const DB_NAME = 'nightflow.door.queue.v1';
const DB_VERSION = 1;
const MEMORY_ONLY = typeof indexedDB === 'undefined';
const MAX_QUEUE = 200;
const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 100;
const FLIGHT_WINDOW_MS = 60000;

export type AttendanceAction = 'CHECK_IN' | 'EXIT' | 'REENTRY' | 'MANUAL_OVERRIDE';

export interface AttendanceEventInput {
  businessId: string;
  eventId: string;
  venueId: string;
  ticketId: string;
  deviceId: string;
  jti: string;
  deviceSequence: number;
  action: AttendanceAction;
  requestedState?: 'INSIDE' | 'OUTSIDE_TEMPORARY' | 'ABSENT';
  occurredAt: number;
  revocationVersion: number;
  claims: TicketClaims;
  signature: string;
}

export interface QueuedAttendanceRecord {
  jti: string;
  ticketId: string;
  businessId: string;
  deviceSequence: number;
  iv: string;
  ct: string;
  attempts: number;
  createdAt: number;
  inFlightUntil?: number;
}

export interface AttendanceSyncResult {
  jti?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'CONFLICT' | 'REJECTED';
  presence?: string;
  state?: string;
  idempotent?: boolean;
  reentryExpiresAt?: string;
  reentryCount?: number;
  reason?: string;
}

export interface AttendanceSyncResponse {
  results?: AttendanceSyncResult[];
  accepted?: number;
  conflicts?: number;
  rejected?: number;
}

export interface FlushOutcome {
  sent: number;
  removed: string[];
  kept: number;
  results: AttendanceSyncResult[];
  error?: string;
}

interface MemoryRecord {
  record: QueuedAttendanceRecord;
  plaintext: string;
}

const memoryRecords = new Map<string, MemoryRecord>();
let queueKey: CryptoKey | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;
let flushing = false;
const listeners = new Set<(count: number) => void>();

const openDb = (): Promise<IDBDatabase> => {
  if (MEMORY_ONLY) return Promise.reject(new Error('IndexedDB no disponible'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'jti' });
        if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir la cola offline'));
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
};

const readEntry = async <T>(store: string, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error('Lectura fallida'));
  });
};

const writeEntry = async (store: string, value: unknown, key?: IDBValidKey): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    if (key === undefined) transaction.objectStore(store).put(value);
    else transaction.objectStore(store).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Escritura fallida'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Escritura abortada'));
  });
};

const deleteEntry = async (store: string, key: IDBValidKey): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Borrado fallido'));
  });
};

const allEntries = async <T>(store: string): Promise<T[]> => {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error('Lectura fallida'));
  });
};

const getQueueKey = async (): Promise<CryptoKey> => {
  if (queueKey) return queueKey;
  if (MEMORY_ONLY) {
    queueKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return queueKey;
  }
  try {
    const stored = await readEntry<CryptoKey>('keys', 'queueKey');
    if (stored) {
      queueKey = stored;
      return stored;
    }
  } catch {
    queueKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return queueKey;
  }
  const created = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  try {
    await writeEntry('keys', created, 'queueKey');
  } catch {
    return created;
  }
  queueKey = created;
  return created;
};

const toBase64 = (bytes: ArrayBuffer): string => {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]!);
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const notify = async (): Promise<void> => {
  const count = await getPendingCount();
  listeners.forEach(listener => listener(count));
};

const readAllRecords = async (): Promise<Array<{ record: QueuedAttendanceRecord; plaintext?: string }>> => {
  if (MEMORY_ONLY) return [...memoryRecords.values()].map(entry => ({ record: entry.record, plaintext: entry.plaintext }));
  try {
    const records = await allEntries<QueuedAttendanceRecord>('events');
    return records.map(record => ({ record }));
  } catch {
    return [...memoryRecords.values()].map(entry => ({ record: entry.record, plaintext: entry.plaintext }));
  }
};

const decryptRecord = async (entry: { record: QueuedAttendanceRecord; plaintext?: string }): Promise<AttendanceEventInput | null> => {
  if (entry.plaintext) {
    try {
      return JSON.parse(entry.plaintext) as AttendanceEventInput;
    } catch {
      return null;
    }
  }
  try {
    const key = await getQueueKey();
    const iv = fromBase64(entry.record.iv);
    const ct = fromBase64(entry.record.ct);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain)) as AttendanceEventInput;
  } catch {
    return null;
  }
};

export async function enqueueAttendance(event: AttendanceEventInput): Promise<void> {
  const plaintext = JSON.stringify(event);
  const key = await getQueueKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const record: QueuedAttendanceRecord = {
    jti: event.jti,
    ticketId: event.ticketId,
    businessId: event.businessId,
    deviceSequence: event.deviceSequence,
    iv: toBase64(iv.buffer as ArrayBuffer),
    ct: toBase64(ct),
    attempts: 0,
    createdAt: Date.now()
  };
  if (MEMORY_ONLY) {
    memoryRecords.set(record.jti, { record, plaintext });
    await pruneMemory();
    await notify();
    return;
  }
  try {
    const existing = await readEntry<QueuedAttendanceRecord>('events', record.jti);
    if (existing) return;
    await writeEntry('events', record);
    await pruneIdb();
  } catch {
    memoryRecords.set(record.jti, { record, plaintext });
  }
  await notify();
};

const pruneMemory = async (): Promise<void> => {
  if (memoryRecords.size <= MAX_QUEUE) return;
  const sorted = [...memoryRecords.values()].sort((left, right) => left.record.createdAt - right.record.createdAt);
  const excess = memoryRecords.size - MAX_QUEUE;
  for (let index = 0; index < excess; index += 1) {
    const entry = sorted[index];
    if (entry) memoryRecords.delete(entry.record.jti);
  }
};

const pruneIdb = async (): Promise<void> => {
  const records = await allEntries<QueuedAttendanceRecord>('events');
  if (records.length <= MAX_QUEUE) return;
  const sorted = [...records].sort((left, right) => left.createdAt - right.createdAt);
  const excess = records.length - MAX_QUEUE;
  for (let index = 0; index < excess; index += 1) {
    const record = sorted[index];
    if (record) await deleteEntry('events', record.jti);
  }
};

export async function getPendingCount(): Promise<number> {
  if (MEMORY_ONLY) return memoryRecords.size;
  try {
    const records = await allEntries<QueuedAttendanceRecord>('events');
    return records.length;
  } catch {
    return memoryRecords.size;
  }
};

export async function clearAttendanceQueue(): Promise<void> {
  memoryRecords.clear();
  if (MEMORY_ONLY) {
    await notify();
    return;
  }
  const records = await allEntries<QueuedAttendanceRecord>('events').catch(() => []);
  for (const record of records) {
    await deleteEntry('events', record.jti).catch(() => undefined);
  }
  await notify();
};

const currentIdToken = async (): Promise<string | undefined> => {
  try {
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : undefined;
  } catch {
    return undefined;
  }
};

const deleteRecords = async (jtis: Set<string>): Promise<void> => {
  for (const jti of jtis) {
    memoryRecords.delete(jti);
    if (!MEMORY_ONLY) await deleteEntry('events', jti).catch(() => undefined);
  }
};

const bumpAttempts = async (entries: Array<{ record: QueuedAttendanceRecord }>, removable: Set<string>): Promise<void> => {
  const toDelete = new Set<string>(removable);
  for (const entry of entries) {
    if (toDelete.has(entry.record.jti)) continue;
    const attempts = entry.record.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      toDelete.add(entry.record.jti);
      continue;
    }
    const updated: QueuedAttendanceRecord = { ...entry.record, attempts, inFlightUntil: undefined };
    if (MEMORY_ONLY) {
      const memoryEntry = memoryRecords.get(updated.jti);
      if (memoryEntry) memoryEntry.record = updated;
      continue;
    }
    await writeEntry('events', updated).catch(() => undefined);
  }
  await deleteRecords(toDelete);
};

export async function flushAttendanceQueue(options?: { baseUrl?: string }): Promise<FlushOutcome | null> {
  if (flushing) return null;
  const baseUrl = (options?.baseUrl ?? (isDoorServiceConfigured() ? getDoorServiceUrl() : '')).replace(/\/+$/u, '');
  if (!baseUrl) return null;
  flushing = true;
  try {
    const now = Date.now();
    const all = await readAllRecords();
    const batch = all
      .filter(entry => (entry.record.inFlightUntil ?? 0) < now)
      .sort((left, right) => left.record.deviceSequence - right.record.deviceSequence)
      .slice(0, BATCH_SIZE);
    if (batch.length === 0) return null;

    const decrypted: Array<{ record: QueuedAttendanceRecord; event: AttendanceEventInput }> = [];
    for (const entry of batch) {
      const event = await decryptRecord(entry);
      if (event) decrypted.push({ record: entry.record, event });
    }
    if (decrypted.length === 0) return null;

    const idToken = await currentIdToken();
    const businessId = decrypted[0]?.event.businessId;
    if (!businessId) return null;

    for (const item of decrypted) {
      const updated: QueuedAttendanceRecord = { ...item.record, inFlightUntil: Date.now() + FLIGHT_WINDOW_MS };
      if (MEMORY_ONLY) {
        const memoryEntry = memoryRecords.get(updated.jti);
        if (memoryEntry) memoryEntry.record = updated;
      } else {
        await writeEntry('events', updated).catch(() => undefined);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${baseUrl}/v1/attendance/sync`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Business-Id': businessId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ events: decrypted.map(item => ({ ...item.event, businessId })) })
      });
      const body = await response.json().catch(() => null) as AttendanceSyncResponse | null;
      const results = Array.isArray(body?.results) ? body!.results! : [];
      const sentJtis = new Set(decrypted.map(item => item.record.jti));

      if (response.status === 401) {
        for (const item of decrypted) {
          const updated: QueuedAttendanceRecord = { ...item.record, inFlightUntil: undefined };
          if (MEMORY_ONLY) {
            const memoryEntry = memoryRecords.get(updated.jti);
            if (memoryEntry) memoryEntry.record = updated;
          } else {
            await writeEntry('events', updated).catch(() => undefined);
          }
        }
        return { sent: decrypted.length, removed: [], kept: all.length, results, error: 'Sesión de puerta no autenticada' };
      }

      if (results.length > 0) {
        const removable = new Set<string>();
        for (const result of results) {
          if (!result.jti || !sentJtis.has(result.jti)) continue;
          if (result.status === 'ACCEPTED' || result.status === 'CONFLICT') removable.add(result.jti);
          if (result.status === 'REJECTED' && result.reason && !/DISPOSITIV|FIRMA|ENROLAD|DEVICE_/iu.test(result.reason)) {
            removable.add(result.jti);
          }
        }
        await deleteRecords(removable);
        await bumpAttempts(
          decrypted.filter(item => sentJtis.has(item.record.jti)).map(item => ({ record: item.record })),
          removable
        );
        const removed = [...removable];
        await notify();
        return { sent: decrypted.length, removed, kept: Math.max(0, all.length - removed.length), results };
      }

      if (response.ok) {
        await deleteRecords(sentJtis);
        await notify();
        return { sent: decrypted.length, removed: [...sentJtis], kept: Math.max(0, all.length - sentJtis.size), results };
      }

      await bumpAttempts(decrypted.map(item => ({ record: item.record })), new Set());
      await notify();
      return {
        sent: decrypted.length,
        removed: [],
        kept: all.length,
        results,
        error: `Cloud Run respondió ${response.status}`
      };
    } finally {
      clearTimeout(timeout);
    }
  } finally {
    flushing = false;
  }
};

export function subscribeQueue(listener: (count: number) => void): () => void {
  listeners.add(listener);
  void getPendingCount().then(count => listener(count));
  return () => {
    listeners.delete(listener);
  };
};

let autoFlushTimer: number | null = null;

export function startQueueAutoFlush(): () => void {
  const run = () => {
    void flushAttendanceQueue().catch(() => undefined);
  };
  const onOnline = () => run();
  if (autoFlushTimer !== null) window.clearInterval(autoFlushTimer);
  autoFlushTimer = window.setInterval(run, 15000);
  window.addEventListener('online', onOnline);
  return () => {
    if (autoFlushTimer !== null) window.clearInterval(autoFlushTimer);
    autoFlushTimer = null;
    window.removeEventListener('online', onOnline);
  };
};

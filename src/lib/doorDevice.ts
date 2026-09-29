import { SignJWT } from 'jose';

const DB_NAME = 'nightflow.door.device.v1';
const DB_VERSION = 1;
const MEMORY_ONLY = typeof indexedDB === 'undefined';

export type DoorPresenceState = 'ABSENT' | 'INSIDE' | 'OUTSIDE_TEMPORARY';

export interface DoorDeviceInfo {
  deviceId: string;
  kid: string;
  publicKeyJwk: JsonWebKey;
  createdAt: string;
}

export interface DoorDeviceSession {
  ticketId: string;
  state: DoorPresenceState;
  reentryCount: number;
  reentryExpiresAt?: number;
  lastJti?: string;
  lastAction?: string;
  updatedAt: number;
}

interface DeviceMeta {
  device?: DoorDeviceInfo;
  sequence?: number;
}

const memoryMeta: DeviceMeta = {};
const memorySessions = new Map<string, DoorDeviceSession>();
let memoryPrivateKey: CryptoKey | null = null;
let cachedDevice: DoorDeviceInfo | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (MEMORY_ONLY) return Promise.reject(new Error('IndexedDB no disponible'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'ticketId' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacén del dispositivo'));
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

const loadMeta = async (): Promise<DeviceMeta> => {
  if (MEMORY_ONLY) return { ...memoryMeta };
  try {
    return (await readEntry<DeviceMeta>('meta', 'device')) ?? {};
  } catch {
    return { ...memoryMeta };
  }
};

const saveMeta = async (meta: DeviceMeta): Promise<void> => {
  memoryMeta.device = meta.device;
  memoryMeta.sequence = meta.sequence;
  if (MEMORY_ONLY) return;
  try {
    await writeEntry('meta', meta, 'device');
  } catch {
    return;
  }
};

const persistPrivateKey = async (privateKey: CryptoKey): Promise<void> => {
  memoryPrivateKey = privateKey;
  if (MEMORY_ONLY) return;
  try {
    await writeEntry('meta', privateKey, 'privateKey');
  } catch {
    return;
  }
};

const readPersistedPrivateKey = async (): Promise<CryptoKey | null> => {
  if (memoryPrivateKey) return memoryPrivateKey;
  if (MEMORY_ONLY) return null;
  try {
    const stored = await readEntry<CryptoKey>('meta', 'privateKey');
    if (stored) memoryPrivateKey = stored;
    return stored ?? null;
  } catch {
    return null;
  }
};

const createKeyPair = async (): Promise<CryptoKeyPair> => crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  false,
  ['sign', 'verify']
);

const toPublicJwk = async (keyPair: CryptoKeyPair): Promise<JsonWebKey> => {
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { ...jwk, alg: 'ES256', use: 'sig' };
};

const resolveDevice = async (): Promise<{ device: DoorDeviceInfo; privateKey: CryptoKey }> => {
  const meta = await loadMeta();
  if (meta.device?.deviceId && meta.device.publicKeyJwk) {
    const persisted = await readPersistedPrivateKey();
    if (persisted) return { device: meta.device, privateKey: persisted };
    const keyPair = await createKeyPair();
    const device: DoorDeviceInfo = { ...meta.device, publicKeyJwk: await toPublicJwk(keyPair) };
    await saveMeta({ ...meta, device });
    await persistPrivateKey(keyPair.privateKey);
    return { device, privateKey: keyPair.privateKey };
  }
  const keyPair = await createKeyPair();
  const device: DoorDeviceInfo = {
    deviceId: `dev-${crypto.randomUUID()}`,
    kid: '',
    publicKeyJwk: await toPublicJwk(keyPair),
    createdAt: new Date().toISOString()
  };
  device.kid = device.deviceId;
  await saveMeta({ device, sequence: meta.sequence ?? 0 });
  await persistPrivateKey(keyPair.privateKey);
  return { device, privateKey: keyPair.privateKey };
};

export async function ensureDoorDevice(): Promise<DoorDeviceInfo> {
  if (cachedDevice) return cachedDevice;
  const resolved = await resolveDevice();
  cachedDevice = resolved.device;
  memoryPrivateKey = resolved.privateKey;
  return resolved.device;
}

export async function signDevicePayload(payload: Record<string, unknown>): Promise<string> {
  const resolved = await resolveDevice();
  cachedDevice = resolved.device;
  memoryPrivateKey = resolved.privateKey;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid: resolved.device.kid, typ: 'JWT' })
    .setIssuedAt()
    .sign(resolved.privateKey);
};

export async function nextDeviceSequence(): Promise<number> {
  const meta = await loadMeta();
  const next = (meta.sequence ?? 0) + 1;
  await saveMeta({ ...meta, sequence: next });
  return next;
};

export async function peekDeviceSequence(): Promise<number> {
  const meta = await loadMeta();
  return meta.sequence ?? 0;
};

const emptySession = (ticketId: string): DoorDeviceSession => ({
  ticketId,
  state: 'ABSENT',
  reentryCount: 0,
  updatedAt: Date.now()
});

export async function getDoorSession(ticketId: string): Promise<DoorDeviceSession> {
  if (MEMORY_ONLY) return memorySessions.get(ticketId) ?? emptySession(ticketId);
  try {
    const stored = await readEntry<DoorDeviceSession>('sessions', ticketId);
    if (stored) return stored;
  } catch {
    return memorySessions.get(ticketId) ?? emptySession(ticketId);
  }
  return emptySession(ticketId);
};

export async function saveDoorSession(session: DoorDeviceSession): Promise<DoorDeviceSession> {
  const next: DoorDeviceSession = { ...session, updatedAt: Date.now() };
  memorySessions.set(next.ticketId, next);
  if (MEMORY_ONLY) return next;
  try {
    await writeEntry('sessions', next);
  } catch {
    return next;
  }
  return next;
};

export const REENTRY_GRACE_MS = 30 * 60 * 1000;

export const isWithinReentryWindow = (reentryExpiresAt: number | undefined, now = Date.now()): boolean => (
  typeof reentryExpiresAt === 'number' && reentryExpiresAt > now
);

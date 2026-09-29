const DB_NAME = 'nightflow.reentry.passkey.v1';
const DB_VERSION = 1;
const MEMORY_ONLY = typeof indexedDB === 'undefined';

export const REENTRY_GRACE_MS = 30 * 60 * 1000;

export interface PasskeyRegistration {
  cid: string;
  alg: number;
  jwk: JsonWebKey;
  o: string;
  rp: string;
}

export interface ReentryProof {
  ad: string;
  cd: string;
  sig: string;
}

interface StoredPasskey {
  ticketId: string;
  cid: string;
  alg: number;
  jwk: JsonWebKey;
  origin: string;
  rpId: string;
  rawId: ArrayBuffer;
  createdAt: string;
}

interface StoredDoorPasskey {
  ticketId: string;
  registration: PasskeyRegistration;
  storedAt: string;
}

const memoryClient = new Map<string, StoredPasskey>();
const memoryDoor = new Map<string, StoredDoorPasskey>();
let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (MEMORY_ONLY) return Promise.reject(new Error('IndexedDB no disponible'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('client')) db.createObjectStore('client', { keyPath: 'ticketId' });
        if (!db.objectStoreNames.contains('door')) db.createObjectStore('door', { keyPath: 'ticketId' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacén de passkeys'));
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
};

const readEntry = async <T>(store: string, key: string): Promise<T | undefined> => {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error('Lectura fallida'));
  });
};

const writeEntry = async (store: string, value: unknown): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Escritura fallida'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Escritura abortada'));
  });
};

export const toBase64Url = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const sha256 = async (data: BufferSource): Promise<ArrayBuffer> => crypto.subtle.digest('SHA-256', data);

export const challengeForJws = async (jws: string): Promise<string> => toBase64Url(await sha256(new TextEncoder().encode(jws)));

export const isPasskeySupported = (): boolean => (
  typeof window !== 'undefined'
  && typeof window.PublicKeyCredential !== 'undefined'
  && Boolean(navigator.credentials?.create)
);

export const isWithinReentryWindow = (reentryExpiresAt: number | undefined, now = Date.now()): boolean => (
  typeof reentryExpiresAt === 'number' && reentryExpiresAt > now
);

interface CborRead {
  value: unknown;
  offset: number;
}

const readCborLength = (bytes: Uint8Array, offset: number, additional: number): { value: number; next: number } => {
  if (additional < 24) return { value: additional, next: offset };
  const size = additional === 24 ? 1 : additional === 25 ? 2 : additional === 26 ? 4 : 8;
  if (offset + size > bytes.length) throw new Error('CBOR truncado');
  let value = 0;
  for (let index = 0; index < size; index += 1) value = value * 256 + bytes[offset + index]!;
  return { value, next: offset + size };
};

const readCbor = (bytes: Uint8Array, start: number): CborRead => {
  if (start >= bytes.length) throw new Error('CBOR truncado');
  const initial = bytes[start]!;
  const major = initial >> 5;
  const additional = initial & 0x1f;
  let offset = start + 1;
  if (major === 7) {
    if (additional === 20) return { value: false, offset };
    if (additional === 21) return { value: true, offset };
    if (additional === 22 || additional === 23) return { value: null, offset };
    if (additional === 24) {
      if (offset >= bytes.length) throw new Error('CBOR truncado');
      return { value: bytes[offset]!, offset: offset + 1 };
    }
    throw new Error('Tipo CBOR no soportado');
  }
  const length = readCborLength(bytes, offset, additional);
  offset = length.next;
  const size = length.value;
  if (major === 0) return { value: size, offset: offset + size };
  if (major === 1) return { value: -1 - size, offset: offset + size };
  if (major === 2) {
    if (offset + size > bytes.length) throw new Error('CBOR truncado');
    return { value: bytes.slice(offset, offset + size), offset: offset + size };
  }
  if (major === 3) {
    if (offset + size > bytes.length) throw new Error('CBOR truncado');
    return { value: new TextDecoder().decode(bytes.slice(offset, offset + size)), offset: offset + size };
  }
  if (major === 4) {
    const items: unknown[] = [];
    for (let index = 0; index < size; index += 1) {
      const item = readCbor(bytes, offset);
      items.push(item.value);
      offset = item.offset;
    }
    return { value: items, offset };
  }
  if (major === 5) {
    const map = new Map<unknown, unknown>();
    for (let index = 0; index < size; index += 1) {
      const key = readCbor(bytes, offset);
      const value = readCbor(bytes, key.offset);
      map.set(key.value, value.value);
      offset = value.offset;
    }
    return { value: map, offset };
  }
  if (major === 6) return readCbor(bytes, offset);
  throw new Error('Tipo CBOR no soportado');
};

const bytesToBase64Url = (bytes: Uint8Array): string => toBase64Url(bytes);

const coseToJwk = (cose: Map<unknown, unknown>): { alg: number; jwk: JsonWebKey } => {
  const kty = cose.get(1);
  const alg = cose.get(3);
  if (typeof alg !== 'number') throw new Error('Clave COSE sin algoritmo');
  if (kty === 2) {
    const crv = cose.get(-1);
    const x = cose.get(-2);
    const y = cose.get(-3);
    if (crv !== 1 || !(x instanceof Uint8Array) || !(y instanceof Uint8Array)) throw new Error('Clave EC2 no soportada');
    return {
      alg,
      jwk: { kty: 'EC', crv: 'P-256', x: bytesToBase64Url(x), y: bytesToBase64Url(y), alg: 'ES256' }
    };
  }
  if (kty === 3) {
    const n = cose.get(-1);
    const e = cose.get(-2);
    if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array)) throw new Error('Clave RSA inválida');
    return {
      alg,
      jwk: { kty: 'RSA', n: bytesToBase64Url(n), e: bytesToBase64Url(e), alg: 'RS256' }
    };
  }
  if (kty === 1) {
    const crv = cose.get(-1);
    const x = cose.get(-2);
    if (crv !== 6 || !(x instanceof Uint8Array)) throw new Error('Clave OKP no soportada');
    return {
      alg,
      jwk: { kty: 'OKP', crv: 'Ed25519', x: bytesToBase64Url(x), alg: 'EdDSA' }
    };
  }
  throw new Error('Tipo de clave COSE no soportado');
};

const extractRegistration = async (attestationObject: ArrayBuffer): Promise<{ alg: number; jwk: JsonWebKey }> => {
  const bytes = new Uint8Array(attestationObject);
  const root = readCbor(bytes, 0);
  if (!(root.value instanceof Map)) throw new Error('Attestación inválida');
  const authData = root.value.get('authData');
  if (!(authData instanceof Uint8Array) || authData.length < 39) throw new Error('authData inválida');
  const flags = authData[32]!;
  if ((flags & 0x40) === 0) throw new Error('La credencial no incluye clave pública');
  const cose = readCbor(authData, 37);
  if (!(cose.value instanceof Map)) throw new Error('Clave COSE inválida');
  return coseToJwk(cose.value);
};

export async function getRegisteredPasskey(ticketId: string): Promise<StoredPasskey | null> {
  if (MEMORY_ONLY) return memoryClient.get(ticketId) ?? null;
  try {
    return (await readEntry<StoredPasskey>('client', ticketId)) ?? null;
  } catch {
    return memoryClient.get(ticketId) ?? null;
  }
}

export async function registerReentryPasskey(ticketId: string): Promise<PasskeyRegistration> {
  if (!isPasskeySupported()) throw new Error('Este dispositivo no soporta passkeys');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(`pase-${ticketId}`);
  const credential = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'NIGHTFLOW VIP', id: window.location.hostname },
      user: { id: userId, name: `pase-${ticketId}`.slice(0, 64), displayName: `Pase ${ticketId}`.slice(0, 64) },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
        { type: 'public-key', alg: -8 }
      ],
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
      timeout: 60000,
      attestation: 'none'
    }
  });
  if (!credential || !('response' in credential)) throw new Error('No se pudo registrar la passkey');
  const publicKeyCredential = credential as PublicKeyCredential;
  const response = publicKeyCredential.response as AuthenticatorAttestationResponse;
  const { alg, jwk } = await extractRegistration(response.attestationObject);
  const registration: PasskeyRegistration = {
    cid: toBase64Url(publicKeyCredential.rawId),
    alg,
    jwk,
    o: window.location.origin,
    rp: window.location.hostname
  };
  const stored: StoredPasskey = {
    ticketId,
    cid: registration.cid,
    alg,
    jwk,
    origin: registration.o,
    rpId: registration.rp,
    rawId: publicKeyCredential.rawId,
    createdAt: new Date().toISOString()
  };
  memoryClient.set(ticketId, stored);
  if (!MEMORY_ONLY) {
    try {
      await writeEntry('client', stored);
    } catch {
      return registration;
    }
  }
  return registration;
};

export const toPasskeyRegistration = (stored: StoredPasskey): PasskeyRegistration => ({
  cid: stored.cid,
  alg: stored.alg,
  jwk: stored.jwk,
  o: stored.origin,
  rp: stored.rpId
});

export async function createReentryProof(
  ticketId: string,
  jws: string,
  options?: { gesture?: boolean }
): Promise<ReentryProof> {
  const stored = await getRegisteredPasskey(ticketId);
  if (!stored) throw new Error('Este pase aún no tiene passkey registrada');
  const challenge = fromBase64Url(await challengeForJws(jws));
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{ id: stored.rawId, type: 'public-key' }],
    userVerification: 'preferred',
    timeout: 60000
  };
  let assertion: Credential | null = null;
  if (options?.gesture) {
    assertion = await navigator.credentials.get({ publicKey });
  } else {
    try {
      assertion = await navigator.credentials.get({ publicKey, mediation: 'silent' });
    } catch {
      throw new Error('REQUIRES_GESTURE');
    }
  }
  if (!assertion || !('response' in assertion)) throw new Error('No se pudo firmar el reingreso');
  const response = assertion.response as AuthenticatorAssertionResponse;
  return {
    ad: toBase64Url(response.authenticatorData),
    cd: toBase64Url(response.clientDataJSON),
    sig: toBase64Url(response.signature)
  };
};

const importAssertionKey = async (jwk: JsonWebKey, alg: number): Promise<CryptoKey> => {
  if (alg === -7) return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  if (alg === -257) return crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);
};

const verifySignature = async (
  key: CryptoKey,
  alg: number,
  signature: BufferSource,
  data: BufferSource
): Promise<boolean> => {
  if (alg === -7) {
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, data);
  }
  return crypto.subtle.verify({ name: alg === -257 ? 'RSASSA-PKCS1-v1_5' : 'Ed25519' }, key, signature, data);
};

export async function verifyReentryProof(jws: string, proof: ReentryProof, registration: PasskeyRegistration): Promise<boolean> {
  try {
    const clientDataBytes = fromBase64Url(proof.cd);
    const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes)) as {
      type?: string;
      challenge?: string;
      origin?: string;
      crossOrigin?: boolean;
    };
    if (clientData.type !== 'webauthn.get') return false;
    if (clientData.crossOrigin === true) return false;
    if (clientData.origin !== registration.o) return false;
    const expectedChallenge = await challengeForJws(jws);
    if (clientData.challenge !== expectedChallenge) return false;
    const authenticatorData = fromBase64Url(proof.ad);
    if (authenticatorData.length < 37) return false;
    if (registration.rp) {
      const rpHash = new Uint8Array(await sha256(new TextEncoder().encode(registration.rp)));
      for (let index = 0; index < 32; index += 1) {
        if (authenticatorData[index] !== rpHash[index]) return false;
      }
    }
    const signature = fromBase64Url(proof.sig);
    const signed = new Uint8Array(authenticatorData.length + 32);
    signed.set(authenticatorData, 0);
    signed.set(new Uint8Array(await sha256(clientDataBytes)), authenticatorData.length);
    const key = await importAssertionKey(registration.jwk, registration.alg);
    return await verifySignature(key, registration.alg, signature, signed);
  } catch {
    return false;
  }
};

export async function storeDoorPasskey(ticketId: string, registration: PasskeyRegistration): Promise<void> {
  const stored: StoredDoorPasskey = { ticketId, registration, storedAt: new Date().toISOString() };
  memoryDoor.set(ticketId, stored);
  if (MEMORY_ONLY) return;
  try {
    await writeEntry('door', stored);
  } catch {
    return;
  }
};

export async function getDoorPasskey(ticketId: string): Promise<PasskeyRegistration | null> {
  if (MEMORY_ONLY) return memoryDoor.get(ticketId)?.registration ?? null;
  try {
    const stored = await readEntry<StoredDoorPasskey>('door', ticketId);
    if (stored?.registration) return stored.registration;
  } catch {
    return memoryDoor.get(ticketId)?.registration ?? null;
  }
  return memoryDoor.get(ticketId)?.registration ?? null;
};

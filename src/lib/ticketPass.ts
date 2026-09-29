import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';
import { auth } from './firebase.ts';
import {
  createReentryProof,
  fromBase64Url,
  getRegisteredPasskey,
  isPasskeySupported,
  registerReentryPasskey,
  toBase64Url,
  toPasskeyRegistration,
  type PasskeyRegistration,
  type ReentryProof
} from './reentryPasskey.ts';

export const ROTATION_SECONDS = 30;
export const TOKEN_TTL_SECONDS = 45;
const ISSUER = 'nightflow';
const AUDIENCE = 'nightflow-door';
const CLIENT_DEVICE_STORAGE_KEY = 'nightflow.client.device.v1';
const REQUEST_TIMEOUT_MS = 8000;

const globalEnv = (globalThis as unknown as { __NIGHTFLOW_ENV__?: Record<string, string | undefined> }).__NIGHTFLOW_ENV__;
const env: Record<string, string | undefined> = (typeof import.meta !== 'undefined' && import.meta.env)
  ? (import.meta.env as unknown as Record<string, string | undefined>)
  : (globalEnv ?? {});
const rawDoorUrl = (env.VITE_DOOR_SERVICE_URL as string | undefined) ?? '';
const DOOR_SERVICE_URL = rawDoorUrl.trim().replace(/\/+$/u, '');

export interface TicketClaims {
  iss?: string;
  aud?: string;
  sub?: string;
  jti?: string;
  businessId?: string;
  eventId?: string;
  venueId?: string;
  ticketId?: string;
  deviceId?: string;
  revocationVersion?: number;
  iat?: number;
  nbf?: number;
  exp?: number;
  [claim: string]: unknown;
}

export type PassStatus = 'loading' | 'active' | 'demo' | 'unavailable' | 'expired' | 'error';

export type PassProofState = 'idle' | 'attached' | 'required' | 'unsupported' | 'failed';

export interface PassPayload {
  v: 1;
  t?: string;
  reg?: PasskeyRegistration;
  pr?: ReentryProof;
}

export type DecodedScan =
  | { kind: 'pass'; jws: string; reg?: PasskeyRegistration; pr?: ReentryProof }
  | { kind: 'demo'; body: Record<string, unknown> }
  | { kind: 'code'; text: string };

export const isDoorServiceConfigured = (): boolean => DOOR_SERVICE_URL.length > 0;

export const getDoorServiceUrl = (): string => DOOR_SERVICE_URL;

export function getClientDeviceId(): string {
  if (typeof window === 'undefined') return 'dev-cust-sin-sesion';
  try {
    const existing = window.localStorage.getItem(CLIENT_DEVICE_STORAGE_KEY);
    if (existing) return existing;
    const created = `dev-cust-${crypto.randomUUID()}`;
    window.localStorage.setItem(CLIENT_DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return `dev-cust-${crypto.randomUUID()}`;
  }
}

const publicKeys = new Map<string, JWK>();
const importedKeys = new Map<string, CryptoKey>();
const prefetchInflight = new Map<string, Promise<JWK>>();

const fetchPublicJwk = async (kid: string): Promise<JWK> => {
  const cached = publicKeys.get(kid);
  if (cached) return cached;
  const inflight = prefetchInflight.get(kid);
  if (inflight) return inflight;
  if (!isDoorServiceConfigured()) throw new Error('El servicio de puerta no está configurado');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const promise = (async () => {
    try {
      const response = await fetch(`${DOOR_SERVICE_URL}/v1/keys/${encodeURIComponent(kid)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Clave pública no disponible');
      const jwk = await response.json() as JWK;
      if (!jwk || typeof jwk.kty !== 'string') throw new Error('Clave pública inválida');
      publicKeys.set(kid, jwk);
      return jwk;
    } finally {
      clearTimeout(timeout);
      prefetchInflight.delete(kid);
    }
  })();
  prefetchInflight.set(kid, promise);
  return promise;
};

const importPublicKey = async (kid: string, jwk: JWK): Promise<CryptoKey> => {
  const cached = importedKeys.get(kid);
  if (cached) return cached;
  const key = await importJWK(jwk, 'EdDSA');
  if (key instanceof Uint8Array) throw new Error('Clave pública inválida');
  importedKeys.set(kid, key);
  return key;
};

export async function prefetchPublicKeys(kids: string[]): Promise<void> {
  await Promise.allSettled(kids.filter(Boolean).map(async (kid) => {
    const jwk = await fetchPublicJwk(kid);
    await importPublicKey(kid, jwk);
  }));
}

export async function preloadKnownDoorKeys(): Promise<void> {
  if (!isDoorServiceConfigured()) return;
  const known = [...publicKeys.keys()];
  if (known.length === 0) return;
  await prefetchPublicKeys(known);
}

export interface VerifyTicketBenchmark {
  ok: boolean;
  durationMs: number;
  kid?: string;
  error?: string;
}

export async function benchmarkVerifyTicket(token: string): Promise<VerifyTicketBenchmark> {
  const started = performance.now();
  try {
    await verifyTicketToken(token);
    return { ok: true, durationMs: performance.now() - started, kid: decodeProtectedHeader(token).kid };
  } catch (error) {
    return {
      ok: false,
      durationMs: performance.now() - started,
      error: error instanceof Error ? error.message : 'verify failed'
    };
  }
}

export async function verifyTicketToken(token: string): Promise<TicketClaims> {
  const header = decodeProtectedHeader(token);
  if (header.alg !== 'EdDSA' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('Cabecera de pase inválida');
  }
  const cachedImported = importedKeys.get(header.kid);
  if (!cachedImported) {
    const jwk = await fetchPublicJwk(header.kid);
    await importPublicKey(header.kid, jwk);
  }
  const key = importedKeys.get(header.kid);
  if (!key) throw new Error('Clave pública inválida');
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['EdDSA'],
    clockTolerance: 30
  });
  return payload as TicketClaims;
}

const currentIdToken = async (): Promise<string | undefined> => {
  try {
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : undefined;
  } catch {
    return undefined;
  }
};

export interface RotateTicketInput {
  businessId: string;
  eventId: string;
  venueId: string;
  ticketId: string;
  deviceId?: string;
  subject?: string;
  currentToken?: string;
  revocationVersion?: number;
}

export interface RotateTicketResult {
  token: string;
  kid: string;
  claims: TicketClaims;
  expiresIn: number;
}

export async function rotateTicketPass(input: RotateTicketInput): Promise<RotateTicketResult> {
  if (!isDoorServiceConfigured()) throw new Error('El servicio de puerta no está configurado');
  const idToken = await currentIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${DOOR_SERVICE_URL}/v1/tickets/rotate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Business-Id': input.businessId,
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        businessId: input.businessId,
        eventId: input.eventId,
        venueId: input.venueId,
        ticketId: input.ticketId,
        deviceId: input.deviceId ?? getClientDeviceId(),
        ...(input.subject ? { subject: input.subject } : {}),
        ...(input.currentToken ? { currentToken: input.currentToken } : {}),
        ...(input.revocationVersion !== undefined ? { revocationVersion: input.revocationVersion } : {})
      })
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(detail?.error?.message ?? `Cloud Run rechazó la rotación (${response.status})`);
    }
    const body = await response.json() as { token?: string; kid?: string; claims?: TicketClaims; expiresIn?: number };
    if (!body.token || !body.kid) throw new Error('Respuesta de rotación incompleta');
    const claims = await verifyTicketToken(body.token);
    return {
      token: body.token,
      kid: body.kid,
      claims,
      expiresIn: typeof body.expiresIn === 'number' ? body.expiresIn : TOKEN_TTL_SECONDS
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function encodePassPayload(parts: { jws: string; reg?: PasskeyRegistration | null; pr?: ReentryProof | null }): string {
  const payload: PassPayload = { v: 1, t: parts.jws };
  if (parts.reg) payload.reg = parts.reg;
  if (parts.pr) payload.pr = parts.pr;
  return JSON.stringify(payload);
}

export function decodePassPayload(text: string): DecodedScan {
  const trimmed = text.trim();
  if (trimmed.startsWith('NIGHTFLOW-DEMO|')) {
    try {
      const encoded = trimmed.slice('NIGHTFLOW-DEMO|'.length);
      const body = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Record<string, unknown>;
      return { kind: 'demo', body };
    } catch {
      return { kind: 'demo', body: { demo: true } };
    }
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as PassPayload;
      if (parsed.v === 1 && typeof parsed.t === 'string' && parsed.t.split('.').length === 3) {
        return {
          kind: 'pass',
          jws: parsed.t,
          ...(parsed.reg ? { reg: parsed.reg } : {}),
          ...(parsed.pr ? { pr: parsed.pr } : {})
        };
      }
    } catch {
      return { kind: 'code', text: trimmed };
    }
  }
  if (trimmed.split('.').length === 3) return { kind: 'pass', jws: trimmed };
  return { kind: 'code', text: trimmed };
}

export function buildDemoPassPayload(reservationCode: string): string {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    demo: true,
    rid: reservationCode,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    note: 'QR de demostracion sin firma criptografica'
  };
  return `NIGHTFLOW-DEMO|${toBase64Url(new TextEncoder().encode(JSON.stringify(body)))}`;
}

export async function generatePassQr(payloadText: string): Promise<string> {
  return QRCode.toDataURL(payloadText, {
    errorCorrectionLevel: payloadText.length > 1400 ? 'L' : 'M',
    margin: 1,
    width: 260,
    color: { dark: '#05070c', light: '#ffffff' }
  });
}

export interface TicketPassParams {
  businessId: string;
  eventId: string;
  venueId: string;
  ticketId: string;
  subject?: string;
  enabled?: boolean;
}

export interface TicketPassView {
  status: PassStatus;
  message: string;
  secondsToExpire: number;
  secondsToRotate: number;
  verifiedLocally: boolean;
  qrDataUrl: string;
  passkeySupported: boolean;
  passkeyRegistered: boolean;
  proofState: PassProofState;
  activatePasskey: () => Promise<boolean>;
  signReentry: () => Promise<boolean>;
  retry: () => void;
}

interface PassInternalState {
  status: PassStatus;
  message: string;
  token?: string;
  claims?: TicketClaims;
  verified: boolean;
  demoPayload?: string;
}

const secondsNow = (): number => Math.floor(Date.now() / 1000);

const bucketIndex = (): number => Math.floor(Date.now() / (ROTATION_SECONDS * 1000));

export function useTicketPass(params: TicketPassParams): TicketPassView {
  const configured = isDoorServiceConfigured();
  const devMode = import.meta.env.DEV;
  const [passkeySupported] = useState(() => isPasskeySupported());
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [proofState, setProofState] = useState<PassProofState>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [view, setView] = useState<PassInternalState>(() => ({
    status: params.enabled === false ? 'unavailable' : 'loading',
    message: params.enabled === false ? 'Este pase está inactivo.' : 'Obteniendo pase rotativo…',
    verified: false
  }));
  const [countdown, setCountdown] = useState({ secondsToExpire: 0, secondsToRotate: ROTATION_SECONDS });
  const [attempt, setAttempt] = useState(0);
  const rotatingRef = useRef(false);
  const bucketRef = useRef(-1);
  const claimsRef = useRef<TicketClaims | undefined>(undefined);
  const tokenRef = useRef<string | undefined>(undefined);
  const proofRef = useRef<ReentryProof | null>(null);
  const proofJwsRef = useRef<string>('');
  const registrationRef = useRef<PasskeyRegistration | null>(null);

  const attachProof = useCallback(async (jws: string, ticketId: string, gesture: boolean): Promise<boolean> => {
    try {
      const proof = await createReentryProof(ticketId, jws, { gesture });
      proofRef.current = proof;
      proofJwsRef.current = jws;
      setProofState('attached');
      return true;
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'REQUIRES_GESTURE') setProofState('required');
      else setProofState(gesture ? 'failed' : 'required');
      proofRef.current = null;
      proofJwsRef.current = '';
      return false;
    }
  }, []);

  const performRotation = useCallback(async () => {
    if (rotatingRef.current || params.enabled === false) return;
    rotatingRef.current = true;
    try {
      if (!configured) {
        if (!devMode) {
          claimsRef.current = undefined;
          setView({
            status: 'unavailable',
            message: 'El servicio de puerta de Cloud Run no está configurado. Tu pase se activará al conectar el entorno de producción.',
            verified: false
          });
          return;
        }
        claimsRef.current = undefined;
        setView({
          status: 'demo',
          message: 'Modo demostración local: QR claramente marcado y sin firma criptográfica.',
          demoPayload: buildDemoPassPayload(params.ticketId),
          verified: false
        });
        return;
      }
      const result = await rotateTicketPass({
        businessId: params.businessId,
        eventId: params.eventId,
        venueId: params.venueId,
        ticketId: params.ticketId,
        ...(params.subject ? { subject: params.subject } : {})
      });
      claimsRef.current = result.claims;
      tokenRef.current = result.token;
      proofRef.current = null;
      proofJwsRef.current = '';
      setView({
        status: 'active',
        message: 'Pase rotativo activo y verificado localmente con la clave pública de Cloud Run.',
        token: result.token,
        claims: result.claims,
        verified: true
      });
      if (registrationRef.current) {
        await attachProof(result.token, params.ticketId, false);
      } else if (!passkeySupported) {
        setProofState('unsupported');
      } else {
        setProofState('idle');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo renovar el pase.';
      const previousClaims = claimsRef.current;
      if (previousClaims && (previousClaims.exp ?? 0) > secondsNow()) {
        setView({
          status: 'active',
          message: `Renovación pendiente: ${message}`,
          token: tokenRef.current,
          claims: previousClaims,
          verified: true
        });
      } else {
        setView({ status: 'expired', message, verified: false });
        tokenRef.current = undefined;
        claimsRef.current = undefined;
        setQrDataUrl('');
      }
    } finally {
      rotatingRef.current = false;
    }
  }, [attachProof, configured, devMode, params.businessId, params.eventId, params.enabled, params.subject, params.ticketId, params.venueId, passkeySupported]);

  useEffect(() => {
    registrationRef.current = null;
    proofRef.current = null;
    proofJwsRef.current = '';
    claimsRef.current = undefined;
    tokenRef.current = undefined;
    bucketRef.current = -1;
    let cancelled = false;

    const bootstrap = async () => {
      setPasskeyRegistered(false);
      setProofState('idle');
      const stored = await getRegisteredPasskey(params.ticketId);
      if (cancelled || !stored) return;
      registrationRef.current = toPasskeyRegistration(stored);
      setPasskeyRegistered(true);
    };
    void bootstrap();

    const tick = async () => {
      if (cancelled || params.enabled === false) return;
      const nowSeconds = secondsNow();
      const bucket = bucketIndex();
      const secondsToRotate = ROTATION_SECONDS - (nowSeconds % ROTATION_SECONDS);
      const claims = claimsRef.current;
      const secondsToExpire = claims?.exp ? claims.exp - nowSeconds : 0;
      setCountdown({ secondsToExpire: Math.max(0, secondsToExpire), secondsToRotate });
      const bucketChanged = bucket !== bucketRef.current;
      if (bucketChanged || bucketRef.current === -1) {
        bucketRef.current = bucket;
        await performRotation();
        return;
      }
      if (claims && secondsToExpire > 0 && secondsToExpire <= 10) {
        proofRef.current = null;
        proofJwsRef.current = '';
      }
    };

    void tick();
    const interval = window.setInterval(() => {
      void tick();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [params.ticketId, params.enabled, performRotation, attempt]);

  useEffect(() => {
    let cancelled = false;
    const isInactive = view.status === 'loading' || view.status === 'error' || view.status === 'expired';
    const payloadText = !isInactive
      ? (view.status === 'demo'
        ? view.demoPayload
        : view.status === 'active' && view.token
          ? encodePassPayload({
            jws: view.token,
            reg: registrationRef.current,
            pr: proofJwsRef.current === view.token ? proofRef.current : null
          })
          : undefined)
      : undefined;

    if (!payloadText) {
      Promise.resolve().then(() => {
        if (!cancelled) setQrDataUrl('');
      });
      return () => {
        cancelled = true;
      };
    }

    generatePassQr(payloadText)
      .then(url => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [view, proofState, passkeyRegistered]);

  const activatePasskey = useCallback(async (): Promise<boolean> => {
    if (!isPasskeySupported()) return false;
    try {
      const registration = await registerReentryPasskey(params.ticketId);
      registrationRef.current = registration;
      setPasskeyRegistered(true);
      const token = view.token;
      if (token && view.status === 'active') {
        await attachProof(token, params.ticketId, false);
      } else {
        setProofState('required');
      }
      setView(previous => ({ ...previous }));
      return true;
    } catch {
      setProofState('failed');
      return false;
    }
  }, [attachProof, params.ticketId, view]);

  const signReentry = useCallback(async (): Promise<boolean> => {
    const token = view.token;
    if (!token || view.status !== 'active') return false;
    const ok = await attachProof(token, params.ticketId, true);
    setView(previous => ({ ...previous }));
    return ok;
  }, [attachProof, params.ticketId, view]);

  const retry = useCallback(() => {
    claimsRef.current = undefined;
    tokenRef.current = undefined;
    bucketRef.current = -1;
    setView({ status: 'loading', message: 'Obteniendo pase rotativo…', verified: false });
    setAttempt(value => value + 1);
  }, []);

  return {
    status: view.status,
    message: view.message,
    secondsToExpire: countdown.secondsToExpire,
    secondsToRotate: countdown.secondsToRotate,
    verifiedLocally: view.verified,
    qrDataUrl,
    passkeySupported,
    passkeyRegistered,
    proofState,
    activatePasskey,
    signReentry,
    retry
  };
}

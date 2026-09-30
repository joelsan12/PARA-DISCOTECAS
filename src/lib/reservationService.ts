import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import {
  callFunctionWithHttpFallback,
  callFunctions,
  FunctionsClientError,
  isFunctionsClientAvailable
} from './functionsClient.ts';

export const HOLD_DURATION_SECONDS = 12 * 60;
export const HOLD_DURATION_MS = HOLD_DURATION_SECONDS * 1000;
export const RESERVATION_CURRENCY = 'USD';

const IDEMPOTENCY_STORAGE_PREFIX = 'nightflow.reservation.hold.v1';

export type ReservationHoldSource = 'functions' | 'local';

export interface ReservationHoldRequest {
  businessId: string;
  eventId: string;
  resourceId: string;
  amount?: number;
  currency?: string;
  idempotencyKey: string;
}

export interface ReservationHoldOutcome {
  source: ReservationHoldSource;
  holdId: string;
  holdToken?: string;
  businessId: string;
  eventId: string;
  resourceId: string;
  state: 'HELD';
  paymentState: 'PENDING';
  amount: number;
  currency: string;
  expiresAt: string;
  idempotentReplay: boolean;
}

export class ReservationServiceError extends Error {
  readonly code: string;

  constructor(message: string, code = 'reservation/unknown') {
    super(message);
    this.name = 'ReservationServiceError';
    this.code = code;
  }
}

function canUseDomStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isDevBuild(): boolean {
  try {
    return (import.meta as unknown as { env?: { DEV?: unknown } }).env?.DEV === true;
  } catch {
    return false;
  }
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function idempotencyStorageKey(businessId: string, eventId: string, resourceId: string): string {
  return `${IDEMPOTENCY_STORAGE_PREFIX}.${businessId}.${eventId}.${resourceId}`;
}

export function getReservationIdempotencyKey(
  businessId: string,
  eventId: string,
  resourceId: string
): string {
  const storageKey = idempotencyStorageKey(businessId, eventId, resourceId);
  const now = Date.now();
  if (canUseDomStorage()) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { key?: unknown; expiresAt?: unknown };
        if (
          typeof parsed.key === 'string' &&
          parsed.key.length >= 8 &&
          typeof parsed.expiresAt === 'number' &&
          parsed.expiresAt > now
        ) {
          return parsed.key;
        }
      }
    } catch {
      return createIdempotencyKey();
    }
    const key = createIdempotencyKey();
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ key, expiresAt: now + HOLD_DURATION_MS })
      );
    } catch {
      return key;
    }
    return key;
  }
  return createIdempotencyKey();
}

export function clearReservationIdempotencyKey(
  businessId: string,
  eventId: string,
  resourceId: string
): void {
  if (!canUseDomStorage()) return;
  try {
    window.localStorage.removeItem(idempotencyStorageKey(businessId, eventId, resourceId));
  } catch {
    return;
  }
}

export function isBackendReservationAvailable(): boolean {
  return isFirebaseConfigured && isFunctionsClientAvailable();
}

function parseHoldResult(value: unknown, fallback: ReservationHoldRequest, source: ReservationHoldSource): ReservationHoldOutcome {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  if (!record || typeof record.holdId !== 'string' || !record.holdId) {
    throw new ReservationServiceError('El servidor de reservas no devolvió una referencia de hold válida.', 'reservation/invalid-response');
  }
  const expiresAtRaw = typeof record.expiresAt === 'string' ? record.expiresAt : '';
  const expiresAtMs = expiresAtRaw ? Date.parse(expiresAtRaw) : Number.NaN;
  const expiresAt = Number.isFinite(expiresAtMs)
    ? new Date(expiresAtMs).toISOString()
    : new Date(Date.now() + HOLD_DURATION_MS).toISOString();
  const amount = typeof record.amount === 'number' && Number.isFinite(record.amount)
    ? record.amount
    : fallback.amount ?? 0;
  const currency = typeof record.currency === 'string' && record.currency
    ? record.currency.toUpperCase()
    : RESERVATION_CURRENCY;
  return {
    source,
    holdId: record.holdId,
    ...(typeof record.holdToken === 'string' && record.holdToken ? { holdToken: record.holdToken } : {}),
    businessId: typeof record.businessId === 'string' && record.businessId ? record.businessId : fallback.businessId,
    eventId: typeof record.eventId === 'string' && record.eventId ? record.eventId : fallback.eventId,
    resourceId: typeof record.resourceId === 'string' && record.resourceId ? record.resourceId : fallback.resourceId,
    state: 'HELD',
    paymentState: 'PENDING',
    amount,
    currency,
    expiresAt,
    idempotentReplay: record.idempotentReplay === true
  };
}

function localHold(request: ReservationHoldRequest): ReservationHoldOutcome {
  return {
    source: 'local',
    holdId: `hold_local_${request.resourceId}_${Date.now()}`,
    businessId: request.businessId,
    eventId: request.eventId,
    resourceId: request.resourceId,
    state: 'HELD',
    paymentState: 'PENDING',
    amount: request.amount ?? 0,
    currency: (request.currency || RESERVATION_CURRENCY).toUpperCase(),
    expiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
    idempotentReplay: false
  };
}

export async function createReservationHold(
  request: ReservationHoldRequest
): Promise<ReservationHoldOutcome> {
  const payload = {
    businessId: request.businessId,
    eventId: request.eventId,
    resourceId: request.resourceId,
    ...(request.amount === undefined ? {} : { amount: request.amount }),
    currency: (request.currency || RESERVATION_CURRENCY).toUpperCase(),
    idempotencyKey: request.idempotencyKey
  };
  if (isBackendReservationAvailable()) {
    try {
      const result = await callFunctionWithHttpFallback<unknown>(
        'createReservationHold',
        'createReservationHold',
        payload
      );
      return parseHoldResult(result, request, 'functions');
    } catch (error) {
      // Solo el build de desarrollo degrada a hold local. En cualquier otro
      // entorno el fallo debe propagarse: un hold simulado que llega al
      // checkout se confundiría con una reserva real (AGENTS §7 / §13).
      if (isDevBuild()) return localHold(request);
      if (error instanceof ReservationServiceError) throw error;
      if (error instanceof FunctionsClientError) {
        throw new ReservationServiceError(error.message, error.code);
      }
      throw new ReservationServiceError('No pudimos reservar la mesa en este momento.', 'reservation/create-failed');
    }
  }
  return localHold(request);
}

export interface PaymentSessionOutcome {
  holdId: string;
  paymentSessionId: string;
  state: 'PAYMENT_PENDING' | 'CONFIRMED';
  amount: number;
  currency: string;
  expiresAt: string;
  checkoutUrl: string | null;
  provider: string;
  idempotentReplay: boolean;
}

export interface HoldStatusUpdate {
  holdId: string;
  state: string;
  paymentState: string;
  reservationId?: string;
  expiresAt?: string;
}

export async function startPaymentSession(
  holdId: string,
  holdToken?: string,
  returnUrl?: string
): Promise<PaymentSessionOutcome> {
  if (!isBackendReservationAvailable()) {
    throw new ReservationServiceError(
      'El pago en línea no está disponible sin Cloud Functions.',
      'reservation/payment-unavailable'
    );
  }
  try {
    const result = await callFunctionWithHttpFallback<unknown>(
      'createPaymentSession',
      'createPaymentSession',
      {
        holdId,
        ...(holdToken ? { holdToken } : {}),
        ...(returnUrl ? { returnUrl } : {})
      }
    );
    const record = result && typeof result === 'object' && !Array.isArray(result)
      ? result as Record<string, unknown>
      : null;
    if (!record || typeof record.paymentSessionId !== 'string' || (record.state !== 'PAYMENT_PENDING' && record.state !== 'CONFIRMED')) {
      throw new ReservationServiceError(
        'El servidor de pagos no devolvió una sesión válida.',
        'reservation/invalid-payment-session'
      );
    }
    return {
      holdId: typeof record.holdId === 'string' ? record.holdId : holdId,
      paymentSessionId: record.paymentSessionId,
      state: record.state === 'CONFIRMED' ? 'CONFIRMED' : 'PAYMENT_PENDING',
      amount: typeof record.amount === 'number' ? record.amount : 0,
      currency: typeof record.currency === 'string' ? record.currency : RESERVATION_CURRENCY,
      expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
      checkoutUrl: typeof record.checkoutUrl === 'string' && record.checkoutUrl ? record.checkoutUrl : null,
      provider: typeof record.provider === 'string' ? record.provider : 'mock',
      idempotentReplay: record.idempotentReplay === true
    };
  } catch (error) {
    if (error instanceof ReservationServiceError) throw error;
    if (error instanceof FunctionsClientError) {
      throw new ReservationServiceError(error.message, error.code);
    }
    throw new ReservationServiceError('No pudimos iniciar el pago.', 'reservation/payment-failed');
  }
}

export function subscribeToReservationHold(
  holdId: string,
  onUpdate: (update: HoldStatusUpdate) => void,
  onError?: (error: Error) => void
): (() => void) | null {
  if (!isFirebaseConfigured || !db) return null;
  try {
    return onSnapshot(
      doc(db, 'holds', holdId),
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({ holdId, state: 'EXPIRED', paymentState: 'FAILED' });
          return;
        }
        const data = snapshot.data() as Record<string, unknown>;
        onUpdate({
          holdId,
          state: typeof data.state === 'string' ? data.state : 'HELD',
          paymentState: typeof data.paymentState === 'string' ? data.paymentState : 'PENDING',
          ...(typeof data.reservationId === 'string' ? { reservationId: data.reservationId } : {}),
          ...(data.expiresAt && typeof data.expiresAt === 'object' && 'seconds' in (data.expiresAt as object)
            ? { expiresAt: new Date(((data.expiresAt as { seconds: number }).seconds) * 1000).toISOString() }
            : typeof data.expiresAt === 'string' ? { expiresAt: data.expiresAt } : {})
        });
      },
      (error) => {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    );
  } catch {
    return null;
  }
}

export async function releaseReservationHold(
  holdId: string,
  holdToken?: string
): Promise<void> {
  if (!isBackendReservationAvailable()) return;
  if (!holdToken) return;
  try {
    await callFunctions('releaseHold', { holdId, holdToken });
  } catch {
    return;
  }
}

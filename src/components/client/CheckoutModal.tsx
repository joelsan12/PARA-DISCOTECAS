import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ClubTable, EventTablePricing, Reservation } from '../../types';
import { useClubStore } from '../../store/clubStore';
import { formatUsd } from '../../lib/formatUsd';
import { esVipTier } from '../../lib/esLabels';
import { ECUADOR_MOBILE_PLACEHOLDER, formatEcuadorPhone, isValidEcuadorMobile, normalizeEcuadorPhone } from '../../lib/formatEcuador';
import {
  clearReservationIdempotencyKey,
  createReservationHold,
  getReservationIdempotencyKey,
  HOLD_DURATION_MS,
  HOLD_DURATION_SECONDS,
  isBackendReservationAvailable,
  releaseReservationHold,
  startPaymentSession,
  subscribeToReservationHold,
  type ReservationHoldOutcome
} from '../../lib/reservationService';
import { CheckoutTimerBar } from './checkout/CheckoutTimerBar';
import { PaymentMethodSelector, type CheckoutPaymentMethod } from './checkout/PaymentMethodSelector';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Clock } from 'lucide-react';

interface Props {
  table: ClubTable;
  pricing: EventTablePricing;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

const isValidPaymentMethod = (method: CheckoutPaymentMethod): boolean => (
  method === 'credit_card' || method === 'transfer'
);

export const CheckoutModal = ({
  table,
  pricing,
  onClose,
  onSuccess
}: Props) => {
  const store = useClubStore();
  const [timeLeft, setTimeLeft] = useState<number>(HOLD_DURATION_SECONDS);
  const [name, setName] = useState(store.clientUser?.name || '');
  const [phone, setPhone] = useState(
    formatEcuadorPhone(store.clientUser?.phone || '+593 99 000 0001')
  );
  const [email, setEmail] = useState(store.clientUser?.email || '');
  const [guests, setGuests] = useState(table.capacity);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hold, setHold] = useState<ReservationHoldOutcome | null>(null);
  const [holdError, setHoldError] = useState('');
  const [paymentPhase, setPaymentPhase] = useState<'form' | 'pending' | 'confirmed'>('form');
  const holdCreatedRef = useRef(false);
  const unsubscribeHoldRef = useRef<(() => void) | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const hasTimedOutRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const releaseTargetsRef = useRef({ tableId: table.id, eventId: store.activeEventId, clubId: store.activeClubId });
  const backendEnabled = isBackendReservationAvailable();

  const idempotencyKey = useMemo(
    () => getReservationIdempotencyKey(store.activeClubId, store.activeEventId, table.id),
    [store.activeClubId, store.activeEventId, table.id]
  );

  const syncTimerToHold = useCallback((nextHold: ReservationHoldOutcome) => {
    const expiresAtMs = Date.parse(nextHold.expiresAt);
    deadlineRef.current = Number.isFinite(expiresAtMs) ? expiresAtMs : Date.now() + HOLD_DURATION_MS;
    hasTimedOutRef.current = false;
    const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);
    if (Number.isFinite(remaining) && remaining > 0) {
      setTimeLeft(Math.min(remaining, HOLD_DURATION_SECONDS));
    } else {
      setTimeLeft(HOLD_DURATION_SECONDS);
    }
  }, []);

  const ensureBackendHold = useCallback(async (): Promise<ReservationHoldOutcome | null> => {
    if (!backendEnabled) return null;
    if (hold) return hold;
    if (holdCreatedRef.current && !hold) return null;
    holdCreatedRef.current = true;
    try {
      const outcome = await createReservationHold({
        businessId: store.activeClubId,
        eventId: store.activeEventId,
        resourceId: table.id,
        amount: pricing.deposit_required,
        currency: 'USD',
        idempotencyKey
      });
      setHold(outcome);
      setHoldError('');
      syncTimerToHold(outcome);
      return outcome;
    } catch (error) {
      holdCreatedRef.current = false;
      const message = error instanceof Error
        ? error.message
        : 'No pudimos bloquear la mesa en el servidor.';
      setHoldError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, [backendEnabled, hold, holdCreatedRef, store.activeClubId, store.activeEventId, table.id, pricing.deposit_required, idempotencyKey, syncTimerToHold]);

  useEffect(() => {
    let cancelled = false;
    const createOnOpen = async () => {
      if (!backendEnabled) return;
      try {
        const outcome = await createReservationHold({
          businessId: store.activeClubId,
          eventId: store.activeEventId,
          resourceId: table.id,
          amount: pricing.deposit_required,
          currency: 'USD',
          idempotencyKey
        });
        if (cancelled) return;
        holdCreatedRef.current = true;
        setHold(outcome);
        setHoldError('');
        syncTimerToHold(outcome);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error
          ? error.message
          : 'No pudimos bloquear la mesa en el servidor.';
        setHoldError(message);
      }
    };
    void createOnOpen();
    return () => {
      cancelled = true;
    };
  }, [backendEnabled, store.activeClubId, store.activeEventId, table.id, pricing.deposit_required, idempotencyKey, syncTimerToHold]);

  useEffect(() => () => {
    unsubscribeHoldRef.current?.();
    unsubscribeHoldRef.current = null;
  }, []);

  const watchHoldConfirmation = useCallback((outcome: ReservationHoldOutcome) => {
    unsubscribeHoldRef.current?.();
    const unsubscribe = subscribeToReservationHold(
      outcome.holdId,
      (update) => {
        if (update.state === 'CONFIRMED' || update.paymentState === 'PAID') {
          setPaymentPhase('confirmed');
          unsubscribeHoldRef.current?.();
          unsubscribeHoldRef.current = null;
          clearReservationIdempotencyKey(store.activeClubId, store.activeEventId, table.id);
          const confirmed: Reservation = {
            id: update.reservationId || outcome.holdId,
            code: `VIP-${outcome.holdId.slice(-4).toUpperCase()}`,
            club_id: store.activeClubId,
            event_id: store.activeEventId,
            table_id: table.id,
            table_code: table.table_code,
            zone: table.zone,
            customer_name: name || 'Invitado',
            customer_phone: phone,
            customer_email: email,
            guest_count: guests,
            deposit_amount: outcome.amount,
            min_spend: pricing.min_spend,
            status: 'CONFIRMED',
            payment_method: paymentMethod,
            payment_status: 'paid',
            qr_token: outcome.holdId,
            hold_expires_at: 0,
            created_at: new Date().toISOString()
          };
          onSuccess(confirmed);
        }
      },
      () => undefined
    );
    unsubscribeHoldRef.current = unsubscribe;
  }, [email, guests, name, onSuccess, paymentMethod, phone, pricing.min_spend, store.activeClubId, store.activeEventId, table.id, table.table_code, table.zone]);

  const handleTimeout = useCallback(() => {
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    const targets = releaseTargetsRef.current;
    store.releaseHold(targets.tableId, targets.eventId);
    clearReservationIdempotencyKey(targets.clubId, targets.eventId, targets.tableId);
    onCloseRef.current();
  }, [store]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    releaseTargetsRef.current = {
      tableId: table.id,
      eventId: store.activeEventId,
      clubId: store.activeClubId
    };
  }, [store.activeClubId, store.activeEventId, table.id]);

  useEffect(() => {
    const tick = () => {
      if (deadlineRef.current === null) {
        deadlineRef.current = Date.now() + HOLD_DURATION_MS;
      }
      const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);
      if (Number.isFinite(remaining) && remaining > 0) {
        setTimeLeft(remaining);
        return;
      }
      setTimeLeft(0);
      handleTimeout();
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [handleTimeout]);

  const releaseLocalAndClose = () => {
    store.releaseHold(table.id, store.activeEventId);
    if (hold?.source === 'functions' && hold.holdToken) {
      void releaseReservationHold(hold.holdId, hold.holdToken);
    }
    clearReservationIdempotencyKey(store.activeClubId, store.activeEventId, table.id);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setHoldError('Por favor completa tu nombre');
      return;
    }
    if (!isValidEcuadorMobile(phone)) {
      setHoldError('Ingresa un número móvil ecuatoriano válido con formato +593 9XX XXX XXX');
      return;
    }
    if (!isValidPaymentMethod(paymentMethod)) {
      setPaymentMethod('credit_card');
    }

    const normalizedPhone = normalizeEcuadorPhone(phone);
    setPhone(formatEcuadorPhone(normalizedPhone));
    setIsProcessing(true);
    setHoldError('');

    try {
      if (!backendEnabled) {
        throw new Error('El servicio de reservas requiere conexión activa con el servidor. Por favor, verifica tu conexión o intenta más tarde.');
      }
      const activeHold = await ensureBackendHold();
      if (!activeHold || activeHold.source !== 'functions') {
        throw new Error('No se pudo asegurar el bloqueo de la mesa en el servidor.');
      }
      const paymentSession = await startPaymentSession(
        activeHold.holdId,
        activeHold.holdToken,
        window.location.pathname
      );
      if (paymentSession.provider === 'pay_at_door' || paymentSession.state === 'CONFIRMED') {
        clearReservationIdempotencyKey(store.activeClubId, store.activeEventId, table.id);
        const confirmed: Reservation = {
          id: activeHold.holdId,
          code: `VIP-${activeHold.holdId.slice(-4).toUpperCase()}`,
          club_id: store.activeClubId,
          event_id: store.activeEventId,
          table_id: table.id,
          table_code: table.table_code,
          zone: table.zone,
          customer_name: name || 'Invitado',
          customer_phone: normalizedPhone,
          customer_email: email,
          guest_count: guests,
          deposit_amount: activeHold.amount,
          min_spend: pricing.min_spend,
          status: 'CONFIRMED',
          payment_method: paymentMethod,
          payment_status: paymentSession.provider === 'pay_at_door' ? 'pending' : 'paid',
          qr_token: activeHold.holdId,
          hold_expires_at: 0,
          created_at: new Date().toISOString()
        };
        setIsProcessing(false);
        onSuccess(confirmed);
        return;
      }
      watchHoldConfirmation(activeHold);
      setPaymentPhase('pending');
      setIsProcessing(false);
      if (paymentSession.checkoutUrl && typeof window !== 'undefined') {
        window.open(paymentSession.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    } catch (error) {
      setIsProcessing(false);
      setHoldError(error instanceof Error ? error.message : 'No pudimos procesar la reserva.');
    }
  };

  const handleCancel = () => {
    releaseLocalAndClose();
  };

  const isDevMode = import.meta.env.DEV;

  if (paymentPhase === 'pending' && hold) {
    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
          <CheckoutTimerBar table={table} timeLeft={timeLeft} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '4px 0 8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              <Clock size={18} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pago pendiente de confirmación
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fff', marginTop: '2px' }}>
                  Mesa {table.table_code} bloqueada por 12 minutos
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>Referencia de reserva</span>
                <span className="font-mono" style={{ color: '#fff', fontWeight: 700 }}>{hold.holdId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>Anticipo</span>
                <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 800 }}>{formatUsd(hold.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>Estado del pago</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>PENDIENTE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>Moneda</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>USD · Ecuador</span>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: isDevMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isDevMode ? 'rgba(59, 130, 246, 0.35)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.76rem',
              color: isDevMode ? '#93c5fd' : '#fca5a5',
              lineHeight: 1.45
            }}>
              {isDevMode
                ? 'MODO DESARROLLO (DEV): no hay webhook de pago real configurado. La reserva queda PENDIENTE y no se confirma desde el navegador.'
                : 'El pago se confirma únicamente cuando el webhook del proveedor notifica a Nightflow. No se marcó como pagado desde el cliente.'}
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px' }}
            >
              Entendido
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Hold idempotente · Liberación automática a los 12 minutos</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <CheckoutTimerBar table={table} timeLeft={timeLeft} />

        {store.clientUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(229, 181, 79, 0.12)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            marginBottom: '14px',
            fontSize: '0.75rem',
            color: '#e5b54f',
          }}>
            <ShieldCheck size={16} />
            <span>
              <strong>VIP {esVipTier(store.clientUser.tier)}:</strong> Datos autocompletados para confirmación inmediata.
            </span>
          </div>
        )}

        {holdError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '14px',
            fontSize: '0.78rem',
            color: '#fca5a5'
          }} role="alert">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{holdError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Nombre del Titular *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Mateo Gómez"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                WhatsApp Móvil *
              </label>
              <input
                type="tel"
                required
                placeholder={ECUADOR_MOBILE_PLACEHOLDER}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onBlur={() => setPhone(formatEcuadorPhone(phone))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Correo Electrónico (para pase QR)
              </label>
              <input
                type="email"
                placeholder="mateo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Nº Invitados
              </label>
              <select
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: table.capacity }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n} style={{ background: '#0e121a' }}>
                    {n} personas
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            depositRequired={pricing.deposit_required}
          />

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Anticipo Requerido Hoy
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Se deduce del consumo total ({formatUsd(pricing.min_spend)})
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
              {formatUsd(pricing.deposit_required)}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: backendEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${backendEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.3)'}`,
            fontSize: '0.74rem',
            color: backendEnabled ? '#6ee7b7' : '#93c5fd',
            lineHeight: 1.4
          }}>
            <ShieldCheck size={14} style={{ flexShrink: 0 }} />
            <span>
              {backendEnabled
                ? 'Hold seguro de 12 min en Nightflow Cloud. El pago se confirma solo con el webhook del proveedor.'
                : 'Hold seguro de 12 min activo. Confirmación de reserva VIP directa con registro en discoteca.'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary"
              style={{ flex: 2, padding: '12px' }}
            >
              {isProcessing ? (
                <span>Procesando Reserva...</span>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Confirmar &amp; Emitir Pase VIP</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <ShieldCheck size={13} color="#10b981" />
            <span>Encriptación Bancaria SSL · Hold de 12 minutos · USD</span>
          </div>
        </form>
      </div>
    </div>
  );
};

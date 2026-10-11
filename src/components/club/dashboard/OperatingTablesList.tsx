import { useState } from 'react';
import type { ClubTable, EventTablePricing } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';
import type { OperationalTableItem } from '../../../services/operationsService';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { canStaffSettleTab } from '../../../lib/clubPermissions';
import { callFunctions } from '../../../lib/functionsClient';
import { ReceiptText, CheckCircle2, AlertCircle, X, DollarSign, CreditCard, Banknote } from 'lucide-react';

interface Props {
  tables: ClubTable[];
  eventPricings: EventTablePricing[];
  operationalTables?: OperationalTableItem[] | null;
  session?: AdminStaffSession;
  activeClubId?: string;
}

interface SettleModalState {
  reservationId: string;
  tableCode: string;
  consumptionTotal: number;
  minSpend: number;
  depositAmount: number;
}

export const OperatingTablesList = ({
  tables,
  eventPricings,
  operationalTables,
  session,
  activeClubId
}: Props) => {
  const [settlingModal, setSettlingModal] = useState<SettleModalState | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<'cash' | 'card_manual' | 'transfer' | 'other'>('cash');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const canSettleAny = canStaffSettleTab(session?.staffRole, session?.isSuperAdmin);

  const handleConfirmSettlement = async () => {
    if (!settlingModal || !activeClubId) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await callFunctions('settleTableTab', {
        businessId: activeClubId,
        reservationId: settlingModal.reservationId,
        settlementMethod,
        notes: settlementNotes.trim() || undefined
      });
      setFeedback({
        kind: 'success',
        message: `Cuenta de Mesa ${settlingModal.tableCode} cerrada exitosamente.`
      });
      setTimeout(() => {
        setSettlingModal(null);
        setFeedback(null);
      }, 1100);
    } catch (err: unknown) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al registrar el cierre de la cuenta.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
        border: '1px solid rgba(229, 181, 79, 0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="font-brand" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Estado Operativo de Mesas
        </h3>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(229, 181, 79, 0.12)',
            color: 'var(--brand-gold)',
            border: '1px solid rgba(229, 181, 79, 0.25)',
          }}
        >
          {tables.length} MESAS EN SALA
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
        {tables.map(t => {
          const pricing = eventPricings.find(p => p.table_id === t.id);
          const op = operationalTables?.find(o => o.resourceId === t.id);
          const consumption = op?.consumptionTotal ?? 0;
          const minSpend = pricing?.min_spend ?? op?.minSpend ?? 0;
          const depositRequired = op?.depositRequired ?? pricing?.deposit_required ?? 0;
          const hasOpenTab = Boolean(op?.activeReservationId) && (op?.tabStatus === 'OPEN' || op?.tableTab?.status === 'OPEN');
          const isSettled = op?.tabStatus === 'SETTLED' || op?.tableTab?.status === 'SETTLED';
          const canSettleThisTable = canSettleAny && hasOpenTab && Boolean(op?.activeReservationId);

          return (
            <div
              key={t.id}
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: t.tier_color || 'var(--brand-gold)',
                      boxShadow: `0 0 6px ${t.tier_color || 'var(--brand-gold)'}`,
                      flexShrink: 0,
                    }}
                  />
                  <span className="font-brand" style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>
                    Mesa {t.table_code}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({esTableZone(t.zone)})</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px', marginLeft: '16px' }}>
                  Capacidad: {t.capacity} personas · Anticipo: {formatUsd(depositRequired)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Badge de Consumo en vivo vs Mínimo */}
                {(consumption > 0 || hasOpenTab) && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.28)',
                      fontFamily: 'monospace',
                    }}
                  >
                    Consumo {formatUsd(consumption)} / Mín {formatUsd(minSpend)}
                  </span>
                )}

                {/* Si no hay consumo activo, mostrar mínimo regular */}
                {consumption === 0 && !hasOpenTab && (
                  <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a' }}>
                    Mínimo {formatUsd(minSpend)}
                  </span>
                )}

                {/* Estado de cuenta cerrada */}
                {isSettled && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    CUENTA CERRADA
                  </span>
                )}

                {/* Badge de estado de reserva */}
                {pricing && !isSettled && (
                  <span className={`badge ${
                    pricing.status === 'AVAILABLE' ? 'badge-available'
                      : pricing.status === 'HELD' ? 'badge-held'
                        : pricing.status === 'CONFIRMED' ? 'badge-confirmed'
                          : pricing.status === 'CHECKED_IN' ? 'badge-checkedin'
                            : 'badge-expired'
                  }`}>
                    {esTableStatus(pricing.status)}
                  </span>
                )}

                {/* Botón «Cerrar cuenta» — Exclusivo roles finance, manager, owner (oculto a mesero y puerta) */}
                {canSettleThisTable && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettlingModal({
                        reservationId: op!.activeReservationId!,
                        tableCode: t.table_code,
                        consumptionTotal: consumption,
                        minSpend,
                        depositAmount: depositRequired
                      });
                      setSettlementMethod('cash');
                      setSettlementNotes('');
                      setFeedback(null);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.08) 100%)',
                      border: '1px solid rgba(229, 181, 79, 0.45)',
                      color: 'var(--brand-gold)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ReceiptText size={13} />
                    <span>Cerrar cuenta</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
            No hay mesas configuradas en sala.
          </div>
        )}
      </div>

      {/* Modal Cierre de Cuenta Manual */}
      {settlingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => !isSubmitting && setSettlingModal(null)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #121622 0%, #0a0d14 100%)',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(229, 181, 79, 0.12)',
                  border: '1px solid rgba(229, 181, 79, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-gold)'
                }}>
                  <ReceiptText size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                    Cierre de Mesa {settlingModal.tableCode}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Reserva #{settlingModal.reservationId.slice(-8)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettlingModal(null)}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Summary */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Consumo Total Registrado:</span>
                <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatUsd(settlingModal.consumptionTotal)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Anticipo de Reserva Aplicado:</span>
                <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>
                  -{formatUsd(settlingModal.depositAmount)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontWeight: 800
              }}>
                <span>Saldo por Cobrar en Caja:</span>
                <span style={{ color: 'var(--brand-gold)', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                  {formatUsd(Math.max(0, settlingModal.consumptionTotal - settlingModal.depositAmount))}
                </span>
              </div>
            </div>

            {/* Settlement Method Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                MÉTODO DE PAGO FINAL
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Efectivo', icon: Banknote },
                  { id: 'card_manual', label: 'Tarjeta POS Físico', icon: CreditCard },
                  { id: 'transfer', label: 'Transferencia', icon: DollarSign },
                  { id: 'other', label: 'Otro / Cortesía', icon: ReceiptText },
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = settlementMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettlementMethod(m.id as typeof settlementMethod)}
                      style={{
                        background: isSelected ? 'rgba(229, 181, 79, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: isSelected ? 'var(--brand-gold)' : '#cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                NOTAS O REFERENCIA (OPCIONAL)
              </label>
              <input
                type="text"
                value={settlementNotes}
                onChange={e => setSettlementNotes(e.target.value)}
                placeholder="Ej: Lote POS 8841 / Pagó titular en barra"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Feedback Message */}
            {feedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: feedback.kind === 'success' ? '#34d399' : '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {feedback.kind === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setSettlingModal(null)}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSettlement}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  color: '#0a0d14',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 16px rgba(229, 181, 79, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Mesa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

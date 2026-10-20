import { useState } from 'react';
import { CheckCircle2, Search, Users, Copy, Check, Ticket, MessageSquare } from 'lucide-react';
import type { Reservation } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { formatEcuadorPhone, isValidEcuadorMobile } from '../../../lib/formatEcuador';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';

interface Props {
  reservations: Reservation[];
}

const formatReservationPhone = (phone: string) => {
  if (!phone) return 'No registrado';
  return isValidEcuadorMobile(phone) ? formatEcuadorPhone(phone) : 'Revisar teléfono';
};

const formatEntryTime = (value?: string) => {
  if (!value) return 'Ingreso registrado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ingreso registrado';

  return date.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Guayaquil',
  });
};

const getPaymentBadge = (res: Reservation) => {
  const state = (res.paymentState || (res.payment_status === 'paid' ? 'PAID' : 'PENDING')).toUpperCase();
  if (res.refundStatus === 'REQUIRED' || state === 'REFUND_REQUIRED') {
    return {
      label: 'REEMBOLSO REQ.',
      bg: 'rgba(239, 68, 68, 0.2)',
      color: 'var(--state-danger, #f87171)',
      border: '1px solid rgba(239, 68, 68, 0.4)'
    };
  }
  if (res.refundStatus === 'COMPLETED' || state === 'REFUNDED') {
    return {
      label: 'REEMBOLSADO',
      bg: 'rgba(168, 85, 247, 0.15)',
      color: 'var(--violet, #c084fc)',
      border: '1px solid rgba(168, 85, 247, 0.3)'
    };
  }
  if (state === 'PAID') {
    return {
      label: 'PAGADO',
      bg: 'rgba(34, 197, 94, 0.15)',
      color: 'var(--state-success, #4ade80)',
      border: '1px solid rgba(34, 197, 94, 0.3)'
    };
  }
  if (state === 'FAILED') {
    return {
      label: 'FALLIDO',
      bg: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--state-danger-text, #fca5a5)',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    };
  }
  return {
    label: res.payment_method === 'cash_door' ? 'PUERTA' : 'PENDIENTE',
    bg: 'rgba(234, 179, 8, 0.15)',
    color: 'var(--state-hold, #facc15)',
    border: '1px solid rgba(234, 179, 8, 0.3)'
  };
};

export const ReservationsTable = ({ reservations }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(`#${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = reservations.filter(r => {
    const matchesFilter =
      statusFilter === 'ALL' ? true :
      statusFilter === 'CONFIRMED' ? r.status === 'CONFIRMED' :
      r.status === 'CHECKED_IN';

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const matchesSearch =
      r.code.toLowerCase().includes(q) ||
      r.table_code.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.customer_phone.includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalGuests = reservations.reduce((acc, r) => acc + (r.guest_count || 0), 0);
  const totalDeposits = reservations.reduce((acc, r) => acc + (r.deposit_amount || 0), 0);

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Header & Metric Chips */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--brand-gold)',
              boxShadow: '0 0 10px rgba(229, 181, 79, 0.6)'
            }} />
            <h3 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
              Bitácora Oficial de Reservas &amp; Anticipos
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Control de titulares, depósitos retenidos y validación biométrica/QR en puerta.
          </p>
        </div>

        {/* Quick summary stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(229, 181, 79, 0.12)',
            color: 'var(--brand-gold)',
            border: '1px solid rgba(229, 181, 79, 0.3)'
          }}>
            {reservations.length} Reservas
          </span>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            color: 'var(--text-main, #e2e8f0)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {totalGuests} Invitados
          </span>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--state-success, #34d399)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            {formatUsd(totalDeposits)} Recaudados
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
        padding: '12px 16px',
        background: 'var(--bg-elevated, rgba(8, 8, 12, 0.75))',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-focus, rgba(229, 181, 79, 0.15))'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: 'var(--radius-xs)',
          padding: '6px 12px',
          flex: '1 1 260px',
          maxWidth: '380px'
        }}>
          <Search size={14} color="var(--brand-gold)" />
          <input
            type="text"
            placeholder="Buscar por código, titular, mesa o teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-high, #ffffff)',
              fontSize: '0.82rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['ALL', 'CONFIRMED', 'CHECKED_IN'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === f ? 'rgba(229, 181, 79, 0.2)' : 'transparent',
                color: statusFilter === f ? 'var(--brand-gold)' : 'var(--text-dim)',
                border: statusFilter === f ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {f === 'ALL' ? 'Todas' : f === 'CONFIRMED' ? 'Confirmadas' : 'En Sala (Ingresadas)'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(229, 181, 79, 0.2)',
              textAlign: 'left',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              <th style={{ padding: '12px 10px' }}>CÓDIGO</th>
              <th style={{ padding: '12px 10px' }}>MESA</th>
              <th style={{ padding: '12px 10px' }}>TITULAR</th>
              <th style={{ padding: '12px 10px' }}>CONTACTO</th>
              <th style={{ padding: '12px 10px' }}>INVITADOS</th>
              <th style={{ padding: '12px 10px' }}>ANTICIPO</th>
              <th style={{ padding: '12px 10px' }}>PAGO</th>
              <th style={{ padding: '12px 10px' }}>ESTADO</th>
              <th style={{ padding: '12px 10px', textAlign: 'right' }}>INGRESO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(res => (
              <tr
                key={res.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 181, 79, 0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Código */}
                <td style={{ padding: '14px 10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(res.code)}
                    title="Copiar código de reserva"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(229, 181, 79, 0.1)',
                      border: '1px solid rgba(229, 181, 79, 0.25)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: 'var(--brand-gold)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span>#{res.code}</span>
                    {copiedCode === res.code ? <Check size={11} color="var(--state-success, #34d399)" /> : <Copy size={11} color="rgba(229, 181, 79, 0.6)" />}
                  </button>
                </td>

                {/* Mesa */}
                <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-high, #ffffff)' }}>{res.table_code}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {esTableZone(res.zone)}
                    </span>
                  </div>
                </td>

                {/* Titular */}
                <td style={{ padding: '14px 10px', color: 'var(--text-high, #ffffff)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'var(--accent-subtle, rgba(229, 181, 79, 0.25))',
                      border: '1px solid var(--border-focus, rgba(229, 181, 79, 0.4))',
                      color: 'var(--brand-gold)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {res.customer_name.charAt(0).toUpperCase()}
                    </span>
                    <span>{res.customer_name}</span>
                  </div>
                </td>

                {/* Contacto */}
                <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{formatReservationPhone(res.customer_phone)}</span>
                    {isValidEcuadorMobile(res.customer_phone) && (
                      <a
                        href={`https://wa.me/593${res.customer_phone.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Contactar por WhatsApp"
                        style={{
                          color: 'var(--state-success, #34d399)',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <MessageSquare size={13} />
                      </a>
                    )}
                  </div>
                </td>

                {/* Invitados */}
                <td style={{ padding: '14px 10px', color: 'var(--state-neutral, #cbd5e1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={13} color="var(--text-dim)" />
                    <span>{res.guest_count} personas</span>
                  </div>
                </td>

                {/* Anticipo */}
                <td style={{
                  padding: '14px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: res.deposit_amount > 0 ? 'var(--state-success, #34d399)' : 'var(--text-dim)'
                }}>
                  {res.deposit_amount > 0 ? formatUsd(res.deposit_amount) : '—'}
                </td>

                {/* Pago (Fase C) */}
                <td style={{ padding: '14px 10px' }}>
                  {(() => {
                    const badge = getPaymentBadge(res);
                    return (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                        }}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>

                {/* Estado */}
                <td style={{ padding: '14px 10px' }}>
                  <span className={`badge ${
                    res.status === 'CHECKED_IN' ? 'badge-checkedin'
                      : res.status === 'HELD' ? 'badge-held'
                        : res.status === 'EXPIRED' ? 'badge-expired'
                          : res.status === 'AVAILABLE' ? 'badge-available'
                            : 'badge-confirmed'
                  }`}>
                    {esTableStatus(res.status)}
                  </span>
                </td>

                {/* Ingreso */}
                <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                  {res.status === 'CHECKED_IN' ? (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--state-success, #34d399)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      <CheckCircle2 size={13} />
                      <span>{formatEntryTime(res.checked_in_at)}</span>
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-dim)',
                      fontStyle: 'italic'
                    }}>
                      Pendiente en puerta QR
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--text-muted)'
          }}>
            <Ticket size={36} color="rgba(229, 181, 79, 0.4)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: 'var(--text-high, #ffffff)', fontSize: '1rem', fontWeight: 700, margin: '0 0 6px' }}>
              No se encontraron reservas
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? 'No hay registros que coincidan con la búsqueda ingresada.'
                : 'Aún no hay reservas registradas para este evento. Las compras confirmadas desde el portal de clientes se listarán aquí en tiempo real.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


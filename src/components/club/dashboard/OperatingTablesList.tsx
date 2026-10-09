import type { ClubTable, EventTablePricing } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';

interface Props {
  tables: ClubTable[];
  eventPricings: EventTablePricing[];
}

export const OperatingTablesList = ({ tables, eventPricings }: Props) => {
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
                  Capacidad: {t.capacity} personas · Anticipo: {formatUsd(pricing?.deposit_required ?? 0)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a' }}>
                  Mínimo {formatUsd(pricing?.min_spend ?? 0)}
                </span>
                {pricing && (
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

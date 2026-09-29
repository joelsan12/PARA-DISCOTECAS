import type { ClubTable, EventTablePricing } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';

interface Props {
  tables: ClubTable[];
  eventPricings: EventTablePricing[];
}

export const OperatingTablesList = ({ tables, eventPricings }: Props) => {
  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
        Estado Operativo de Mesas
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
        {tables.map(t => {
          const pricing = eventPricings.find(p => p.table_id === t.id);
          return (
            <div
              key={t.id}
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-brand" style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                    Mesa {t.table_code}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({esTableZone(t.zone)})</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Capacidad: {t.capacity} personas · Anticipo requerido: {formatUsd(pricing?.deposit_required ?? 0)}
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
                          : 'badge-checkedin'
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

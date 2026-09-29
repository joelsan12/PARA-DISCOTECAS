import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import type { ClubTable, EventTablePricing, ClubEvent } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableZone } from '../../../lib/esLabels';

interface Props {
  clubTables: ClubTable[];
  eventPricings: EventTablePricing[];
  activeEvent?: ClubEvent;
  onUpdatePricing: (tableId: string, minSpend: number, deposit: number) => void;
}

export const PricingManager = ({
  clubTables,
  eventPricings,
  activeEvent,
  onUpdatePricing,
}: Props) => {
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [newMinSpend, setNewMinSpend] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);

  const handleStartEditPricing = (tableId: string, currentMin: number, currentDeposit: number) => {
    setEditingTableId(tableId);
    setNewMinSpend(currentMin);
    setNewDeposit(currentDeposit);
  };

  const handleSave = (tableId: string) => {
    onUpdatePricing(tableId, newMinSpend, newDeposit);
    setEditingTableId(null);
  };

  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        Ajuste de Precios & Consumos Dinámicos
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
        Define el consumo mínimo y anticipo de cada mesa para el evento actual: <strong>{activeEvent?.title}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {clubTables.map(t => {
          const pricing = eventPricings.find(p => p.table_id === t.id);
          const isEditing = editingTableId === t.id;

          return (
            <div
              key={t.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span className="font-brand" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                    {t.table_code}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{esTableZone(t.zone)} · {t.capacity} personas</div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => handleStartEditPricing(t.id, pricing?.min_spend || 0, pricing?.deposit_required || 0)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Consumo Mínimo (USD)</label>
                    <input
                      type="number"
                      value={newMinSpend}
                      onChange={e => setNewMinSpend(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: '#fff',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Anticipo Requerido (USD)</label>
                    <input
                      type="number"
                      value={newDeposit}
                      onChange={e => setNewDeposit(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: '#fff',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button onClick={() => setEditingTableId(null)} className="btn-secondary" style={{ flex: 1, padding: '6px' }}>
                      Cancelar
                    </button>
                    <button onClick={() => handleSave(t.id)} className="btn-primary" style={{ flex: 1, padding: '6px' }}>
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '10px', borderRadius: 'var(--radius-xs)' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Consumo Mín.</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fde68a' }}>
                      {formatUsd(pricing?.min_spend ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Anticipo</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {formatUsd(pricing?.deposit_required ?? 0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

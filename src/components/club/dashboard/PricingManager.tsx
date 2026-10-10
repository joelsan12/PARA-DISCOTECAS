import { useState } from 'react';
import { Edit3, Check, X, Coins, DollarSign, Users, Shield } from 'lucide-react';
import type { ClubTable, EventTablePricing, ClubEvent } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableZone } from '../../../lib/esLabels';

interface Props {
  clubTables: ClubTable[];
  eventPricings: EventTablePricing[];
  activeEvent?: ClubEvent;
  onUpdatePricing: (tableId: string, minSpend: number, deposit: number) => void;
  onGoToDesigner?: () => void;
}

export const PricingManager = ({
  clubTables,
  eventPricings,
  activeEvent,
  onUpdatePricing,
  onGoToDesigner,
}: Props) => {
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [newMinSpend, setNewMinSpend] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  if (clubTables.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(16, 17, 26, 0.95) 0%, rgba(10, 11, 16, 0.98) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.25)',
          borderRadius: '18px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(229, 181, 79, 0.12)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--brand-gold)',
          }}
        >
          <Coins size={28} />
        </div>

        <h3 className="font-brand" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
          Sin mesas configuradas para tarifar
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.5 }}>
          Para establecer consumos mínimos y anticipos requeridos en pasarela, primero debes diseñar y ubicar las mesas de tu sala en el diseñador.
        </p>

        {onGoToDesigner && (
          <button
            type="button"
            onClick={onGoToDesigner}
            className="btn-gold"
            style={{ padding: '10px 24px' }}
          >
            Ir al Diseñador de Planos →
          </button>
        )}
      </div>
    );
  }

  const handleStartEditPricing = (tableId: string, currentMin: number, currentDeposit: number) => {
    setEditingTableId(tableId);
    setNewMinSpend(currentMin);
    setNewDeposit(currentDeposit);
  };

  const handleSave = (tableId: string) => {
    onUpdatePricing(tableId, newMinSpend, newDeposit);
    setEditingTableId(null);
  };

  const zones = Array.from(new Set(clubTables.map(t => t.zone)));
  const filteredTables = selectedZone === 'ALL'
    ? clubTables
    : clubTables.filter(t => t.zone === selectedZone);

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Top Header */}
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
            <h3 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Tarifario &amp; Anticipos Dinámicos
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configuración de consumos mínimos y depósitos requeridos en pasarela para el evento actual.
          </p>
        </div>

        {/* Active Event Badge */}
        {activeEvent && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(229, 181, 79, 0.12)',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <Coins size={15} color="var(--brand-gold)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
              {activeEvent.day_label} — {activeEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* Zone Filters Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        marginBottom: '20px',
        paddingBottom: '6px'
      }}>
        <button
          type="button"
          onClick={() => setSelectedZone('ALL')}
          style={{
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: selectedZone === 'ALL' ? 'rgba(229, 181, 79, 0.22)' : 'rgba(255, 255, 255, 0.04)',
            color: selectedZone === 'ALL' ? 'var(--brand-gold)' : 'var(--text-dim)',
            border: selectedZone === 'ALL' ? '1px solid rgba(229, 181, 79, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
            whiteSpace: 'nowrap'
          }}
        >
          Todas las Zonas ({clubTables.length})
        </button>
        {zones.map(z => (
          <button
            key={z}
            type="button"
            onClick={() => setSelectedZone(z)}
            style={{
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedZone === z ? 'rgba(229, 181, 79, 0.22)' : 'rgba(255, 255, 255, 0.04)',
              color: selectedZone === z ? 'var(--brand-gold)' : 'var(--text-dim)',
              border: selectedZone === z ? '1px solid rgba(229, 181, 79, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
              whiteSpace: 'nowrap'
            }}
          >
            {esTableZone(z)}
          </button>
        ))}
      </div>

      {/* Tables Pricing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
        {filteredTables.map(t => {
          const pricing = eventPricings.find(p => p.table_id === t.id);
          const isEditing = editingTableId === t.id;
          const tierColor = t.tier_color || 'var(--brand-gold)';

          return (
            <div
              key={t.id}
              style={{
                background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.9) 0%, rgba(8, 8, 12, 0.95) 100%)',
                border: '1px solid rgba(229, 181, 79, 0.18)',
                borderTop: `3px solid ${tierColor}`,
                borderRadius: 'var(--radius-sm)',
                padding: '18px',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: tierColor,
                      boxShadow: `0 0 8px ${tierColor}`
                    }} />
                    <span className="font-brand" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
                      {t.table_code}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px'
                  }}>
                    <span>{esTableZone(t.zone)}</span>
                    <span>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={11} color="var(--text-dim)" /> {t.capacity} pers.
                    </span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleStartEditPricing(t.id, pricing?.min_spend || 0, pricing?.deposit_required || 0)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: 'rgba(229, 181, 79, 0.1)',
                      border: '1px solid rgba(229, 181, 79, 0.3)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--brand-gold)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {/* Editing Form vs Display */}
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Min Spend Input */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fde68a',
                      marginBottom: '4px'
                    }}>
                      <DollarSign size={12} />
                      Consumo Mínimo (USD)
                    </label>
                    <input
                      type="number"
                      value={newMinSpend}
                      onChange={e => setNewMinSpend(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(8, 8, 12, 0.85)',
                        border: '1px solid rgba(229, 181, 79, 0.4)',
                        color: '#fff',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    />
                    {/* Quick increment helpers */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {[50, 100, 200].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setNewMinSpend(curr => curr + inc)}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--brand-gold)',
                            cursor: 'pointer'
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deposit Input */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--brand-gold)',
                      marginBottom: '4px'
                    }}>
                      <Shield size={12} />
                      Anticipo Requerido (USD)
                    </label>
                    <input
                      type="number"
                      value={newDeposit}
                      onChange={e => setNewDeposit(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(8, 8, 12, 0.85)',
                        border: '1px solid rgba(229, 181, 79, 0.4)',
                        color: '#fff',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    />
                    {/* Quick increment helpers */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {[25, 50, 100].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setNewDeposit(curr => curr + inc)}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--brand-gold)',
                            cursor: 'pointer'
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingTableId(null)}
                      style={{
                        flex: 1,
                        padding: '7px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(t.id)}
                      style={{
                        flex: 1,
                        padding: '7px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 55%, #cfa038 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#08080c',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 10px rgba(229, 181, 79, 0.3)'
                      }}
                    >
                      <Check size={13} />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'rgba(8, 8, 12, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Consumo Mín.
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fde68a', marginTop: '2px' }}>
                      {formatUsd(pricing?.min_spend ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Anticipo
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-gold)', marginTop: '2px' }}>
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


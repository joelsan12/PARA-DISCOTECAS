import { Activity, Clock, Users, DollarSign, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import type { Club, ClubEvent } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esPlan } from '../../../lib/esLabels';

interface Props {
  activeClub: Club;
  clubEvents: ClubEvent[];
  activeEventId: string;
  onSelectEvent: (id: string) => void;
  availableCount: number;
  totalTables: number;
  heldCount: number;
  confirmedCount: number;
  checkedInCount: number;
  totalDeposits: number;
}

export const ClubMetricsHeader = ({
  activeClub,
  clubEvents,
  activeEventId,
  onSelectEvent,
  availableCount,
  totalTables,
  heldCount,
  confirmedCount,
  checkedInCount,
  totalDeposits,
}: Props) => {
  const freeCapPercent = Math.round((availableCount / (totalTables || 1)) * 100);

  return (
    <>
      {/* Top Executive Header Bar */}
      <div className="glass-card" style={{
        padding: '22px 28px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Gold Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '15%',
          width: '320px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(229, 181, 79, 0.12) 0%, rgba(229, 181, 79, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--brand-gold)',
              boxShadow: '0 0 12px rgba(229, 181, 79, 0.75)'
            }} />
            <h1 className="font-brand" style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              margin: 0
            }}>
              {activeClub.name}
            </h1>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(229, 181, 79, 0.14)',
              color: 'var(--brand-gold)',
              border: '1px solid rgba(229, 181, 79, 0.35)'
            }}>
              Centro de Operaciones
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            flexWrap: 'wrap',
            fontSize: '0.76rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontWeight: 600
            }}>
              <Sparkles size={11} color="var(--brand-gold)" />
              Plan {esPlan(activeClub.plan_id)}
            </span>
            <span>·</span>
            <span>Sede {activeClub.city}</span>
            <span>·</span>
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              ID: {activeClub.id}
            </span>
          </div>
        </div>

        {/* Event Selector Pill */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--brand-gold)',
            marginBottom: '4px'
          }}>
            Evento en Cartelera:
          </label>
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(8, 8, 12, 0.85)',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px 2px 12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
          }}>
            <Calendar size={14} color="var(--brand-gold)" style={{ marginRight: '8px', flexShrink: 0 }} />
            <select
              value={activeEventId}
              onChange={e => onSelectEvent(e.target.value)}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '7px 24px 7px 0',
                outline: 'none',
                minWidth: '220px'
              }}
            >
              {clubEvents.map(e => (
                <option key={e.id} value={e.id} style={{ background: '#0e121a', color: '#fff' }}>
                  {e.day_label} — {e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="rgba(229, 181, 79, 0.8)"
              style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* KPI 1: Mesas Disponibles */}
        <div className="glass-card" style={{
          padding: '20px 22px',
          borderTop: '2px solid var(--brand-gold)',
          background: 'linear-gradient(180deg, rgba(229, 181, 79, 0.04) 0%, rgba(8, 8, 12, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Mesas Disponibles
            </span>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(229, 181, 79, 0.12)',
              border: '1px solid rgba(229, 181, 79, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={16} color="var(--brand-gold)" />
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {availableCount} <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {totalTables}</span>
          </div>
          {/* Progress bar */}
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${freeCapPercent}%`,
              background: 'linear-gradient(90deg, #cfa038 0%, #e5b54f 100%)',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f5d38a', marginTop: '6px', fontWeight: 600 }}>
            {freeCapPercent}% capacidad libre
          </div>
        </div>

        {/* KPI 2: Bloqueos temporales */}
        <div className="glass-card" style={{
          padding: '20px 22px',
          borderTop: '2px solid #f59e0b',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(8, 8, 12, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Holds Temporales (12 min)
            </span>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} color="#f59e0b" />
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
            {heldCount}
          </div>
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, heldCount * 25)}%`,
              background: '#f59e0b',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fde68a', marginTop: '6px', fontWeight: 600 }}>
            Transacciones en curso (checkout)
          </div>
        </div>

        {/* KPI 3: Confirmadas / Ingresadas */}
        <div className="glass-card" style={{
          padding: '20px 22px',
          borderTop: '2px solid #10b981',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(8, 8, 12, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Confirmadas / Puerta
            </span>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={16} color="#10b981" />
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '8px' }}>
            {confirmedCount + checkedInCount}
          </div>
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.round(((confirmedCount + checkedInCount) / (totalTables || 1)) * 100))}%`,
              background: '#10b981',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#86efac', marginTop: '6px', fontWeight: 600 }}>
            {checkedInCount} validadas en puerta QR
          </div>
        </div>

        {/* KPI 4: Anticipos Recaudados */}
        <div className="glass-card" style={{
          padding: '20px 22px',
          borderTop: '2px solid var(--brand-gold)',
          background: 'linear-gradient(180deg, rgba(229, 181, 79, 0.05) 0%, rgba(8, 8, 12, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-gold)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Anticipos Recaudados
            </span>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(229, 181, 79, 0.15)',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={16} color="var(--brand-gold)" />
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f5d38a', marginTop: '8px' }}>
            {formatUsd(totalDeposits)}
          </div>
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: totalDeposits > 0 ? '100%' : '0%',
              background: 'linear-gradient(90deg, #cfa038 0%, #f5d38a 100%)',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--brand-gold)', marginTop: '6px', fontWeight: 600 }}>
            Depósitos confirmados en pasarela
          </div>
        </div>
      </div>
    </>
  );
};


import { Activity, Clock, Users, DollarSign } from 'lucide-react';
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
  return (
    <>
      {/* Top Bar */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00f0ff',
              boxShadow: '0 0 10px #00f0ff'
            }} />
            <h1 className="font-brand" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {activeClub.name} — Centro de Operaciones
            </h1>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Suscripción: <strong style={{ color: '#fbbf24' }}>{esPlan(activeClub.plan_id)}</strong> · Sede {activeClub.city} · ID del club: {activeClub.id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Evento Activo:
          </span>
          <select
            value={activeEventId}
            onChange={e => onSelectEvent(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {clubEvents.map(e => (
              <option key={e.id} value={e.id} style={{ background: '#0e121a' }}>
                {e.day_label} — {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '3px solid #00f0ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Mesas Disponibles
            </span>
            <Activity size={16} color="var(--accent)" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            {availableCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {totalTables}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px' }}>
            {Math.round((availableCount / (totalTables || 1)) * 100)}% capacidad libre
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Bloqueos temporales (10 min)
            </span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '6px' }}>
            {heldCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fde68a', marginTop: '4px' }}>
            Transacciones en curso
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Confirmadas / Ingresadas
            </span>
            <Users size={16} color="#10b981" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
            {confirmedCount + checkedInCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#86efac', marginTop: '4px' }}>
            {checkedInCount} ya pasaron por puerta
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '3px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Anticipos Recaudados
            </span>
            <DollarSign size={16} color="#a855f7" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e9d5ff', marginTop: '6px' }}>
            {formatUsd(totalDeposits)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#c084fc', marginTop: '4px' }}>
            Fondo asegurado en caja
          </div>
        </div>
      </div>
    </>
  );
};

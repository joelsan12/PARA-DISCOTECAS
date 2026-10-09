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
  const occupiedPercent = Math.min(
    100,
    Math.round(((confirmedCount + checkedInCount) / (totalTables || 1)) * 100)
  );

  return (
    <>
      {/* Executive Header Bar */}
      <div
        className="glass-card"
        style={{
          padding: '22px 28px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--brand-gold)',
              }}
            />
            <h1 className="admin-club-title">{activeClub.name}</h1>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '9999px',
                background: 'rgba(229, 181, 79, 0.1)',
                color: 'var(--brand-gold)',
                border: '1px solid rgba(229, 181, 79, 0.3)',
              }}
            >
              Centro de Operaciones
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
              flexWrap: 'wrap',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                fontWeight: 600,
              }}
            >
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

        {/* Event Selector Pill (único selector de evento) */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold)',
              marginBottom: '4px',
            }}
          >
            Evento en Cartelera:
          </label>
          <div className="admin-select-wrap">
            <span className="admin-select-icon">
              <Calendar size={14} />
            </span>
            <select
              className="admin-quiet-select admin-quiet-select--lg"
              value={activeEventId}
              onChange={(e) => onSelectEvent(e.target.value)}
              style={{ minWidth: '220px' }}
            >
              {clubEvents.map((e) => (
                <option key={e.id} value={e.id} style={{ background: '#0e121a', color: '#fff' }}>
                  {e.day_label} — {e.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="admin-select-chevron" />
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* KPI 1: Mesas Disponibles (barra real) */}
        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Mesas Disponibles</span>
            <span className="kpi-icon">
              <Activity size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {availableCount} <span className="unit">/ {totalTables}</span>
          </div>
          <div className="kpi-track">
            <div className="kpi-fill" style={{ width: `${freeCapPercent}%` }} />
          </div>
          <div className="kpi-caption">{freeCapPercent}% capacidad libre</div>
        </div>

        {/* KPI 2: Holds Temporales (sin barra) */}
        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Holds Temporales (12 min)</span>
            <span className="kpi-icon kpi-icon--amber">
              <Clock size={16} />
            </span>
          </div>
          <div className="kpi-value kpi-value--amber">{heldCount}</div>
          <div className="kpi-caption kpi-caption--amber">
            Transacciones en curso (checkout)
          </div>
        </div>

        {/* KPI 3: Confirmadas / Puerta (barra real) */}
        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Confirmadas / Puerta</span>
            <span className="kpi-icon kpi-icon--emerald">
              <Users size={16} />
            </span>
          </div>
          <div className="kpi-value kpi-value--emerald">
            {confirmedCount + checkedInCount}
          </div>
          <div className="kpi-track">
            <div className="kpi-fill kpi-fill--emerald" style={{ width: `${occupiedPercent}%` }} />
          </div>
          <div className="kpi-caption kpi-caption--emerald">
            {checkedInCount} validadas en puerta QR
          </div>
        </div>

        {/* KPI 4: Anticipos Recaudados (sin barra) */}
        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label" style={{ color: 'var(--brand-gold)' }}>
              Anticipos Recaudados
            </span>
            <span className="kpi-icon">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="kpi-value kpi-value--champagne">{formatUsd(totalDeposits)}</div>
          <div className="kpi-caption kpi-caption--gold">
            Depósitos confirmados en pasarela
          </div>
        </div>
      </div>
    </>
  );
};

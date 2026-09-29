import { TrendingUp, Building2, Layers, Sparkles } from 'lucide-react';
import { formatUsd } from '../../lib/formatUsd';

interface Props {
  mrr: number;
  activeClubs: number;
  totalClubs: number;
  totalVolume: number;
  reservationsCount: number;
}

export const SaaSMetricsCards = ({
  mrr,
  activeClubs,
  totalClubs,
  totalVolume,
  reservationsCount,
}: Props) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Ingresos recurrentes mensuales · Suscripciones de la plataforma
          </span>
          <TrendingUp size={16} color="#10b981" />
        </div>
        <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          {formatUsd(mrr)} <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>/ mes</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '4px' }}>
          Ingresos recurrentes garantizados
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #00f0ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Discotecas conectadas
          </span>
          <Building2 size={16} color="var(--accent)" />
        </div>
        <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginTop: '6px' }}>
          {activeClubs} <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>/ {totalClubs}</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '4px' }}>
          Instancias multiempresa activas
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Volumen bruto de anticipos
          </span>
          <Layers size={16} color="#f59e0b" />
        </div>
        <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fde68a', marginTop: '6px' }}>
          {formatUsd(totalVolume)}
        </div>
        <div style={{ fontSize: '0.74rem', color: '#fbbf24', marginTop: '4px' }}>
          Procesado a través de pasarelas
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Total de pases VIP emitidos
          </span>
          <Sparkles size={16} color="#8b5cf6" />
        </div>
        <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e9d5ff', marginTop: '6px' }}>
          {reservationsCount}
        </div>
        <div style={{ fontSize: '0.74rem', color: '#c084fc', marginTop: '4px' }}>
          Transacciones completadas con QR
        </div>
      </div>
    </div>
  );
};

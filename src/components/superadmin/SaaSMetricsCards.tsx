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
    <div className="dev-hud-strip">
      {/* 1. MRR */}
      <div className="dev-hud-cell">
        <div className="dev-hud-cell__header">
          <span className="dev-hud-cell__label">Ingresos Recurrentes (MRR)</span>
          <div className="dev-hud-cell__icon">
            <TrendingUp size={13} />
          </div>
        </div>
        <div className="dev-hud-cell__value-row">
          <span className="font-mono dev-hud-cell__value">
            {formatUsd(mrr)}
          </span>
          <span className="dev-hud-cell__unit">/ mes</span>
        </div>
        <div className="dev-hud-cell__sub">
          Suscripciones SaaS activas
        </div>
      </div>

      {/* 2. Discotecas */}
      <div className="dev-hud-cell">
        <div className="dev-hud-cell__header">
          <span className="dev-hud-cell__label">Discotecas Afiliadas</span>
          <div className="dev-hud-cell__icon">
            <Building2 size={13} />
          </div>
        </div>
        <div className="dev-hud-cell__value-row">
          <span className="font-mono dev-hud-cell__value">
            {activeClubs}
          </span>
          <span className="dev-hud-cell__badge dev-hud-cell__badge--neutral">
            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', marginRight: '4px' }} />
            {activeClubs} de {totalClubs} activas
          </span>
        </div>
        <div className="dev-hud-cell__sub">
          Instancias multi-tenant
        </div>
      </div>

      {/* 3. Volumen */}
      <div className="dev-hud-cell">
        <div className="dev-hud-cell__header">
          <span className="dev-hud-cell__label">Volumen Transaccionado</span>
          <div className="dev-hud-cell__icon">
            <Layers size={13} />
          </div>
        </div>
        <div className="dev-hud-cell__value-row">
          <span className="font-mono dev-hud-cell__value">
            {formatUsd(totalVolume)}
          </span>
          <span className="dev-hud-cell__unit">total</span>
        </div>
        <div className="dev-hud-cell__sub">
          Anticipos y reservas procesadas
        </div>
      </div>

      {/* 4. Pases VIP */}
      <div className="dev-hud-cell">
        <div className="dev-hud-cell__header">
          <span className="dev-hud-cell__label">Pases VIP Emitidos</span>
          <div className="dev-hud-cell__icon">
            <Sparkles size={13} />
          </div>
        </div>
        <div className="dev-hud-cell__value-row">
          <span className="font-mono dev-hud-cell__value">
            {reservationsCount}
          </span>
          <span className="dev-hud-cell__badge dev-hud-cell__badge--neutral">
            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#e5b54f', marginRight: '4px' }} />
            JWS Ed25519
          </span>
        </div>
        <div className="dev-hud-cell__sub">
          Accesos verificados con JWS
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import type { TableZone } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableZone } from '../../../lib/esLabels';

interface Props {
  newTableCode: string;
  newTableBadge: string;
  newTableZone: TableZone;
  newTableCapacity: number;
  newTableShape: 'circle' | 'pill' | 'square' | 'rect';
  newTableColor: string;
  newTableMinSpend: number;
  newTableDeposit: number;
}

export const AddTableLivePreview: React.FC<Props> = ({
  newTableCode,
  newTableBadge,
  newTableZone,
  newTableCapacity,
  newTableShape,
  newTableColor,
  newTableMinSpend,
  newTableDeposit,
}) => {
  return (
    <div style={{
      background: '#04070e',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid rgba(0, 240, 255, 0.25)',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.9)'
    }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
          Visualizador en Vivo
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '2px 8px',
          borderRadius: '10px',
          fontWeight: 800
        }}>
          En Directo
        </span>
      </div>

      {/* SVG Visualizer */}
      <div style={{ width: '160px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <svg width="100%" height="100%" viewBox="0 0 200 150">
          {newTableShape === 'pill' ? (
            <rect x="68" y="40" width="64" height="70" rx="32" fill={newTableColor} stroke="#ffffff" strokeWidth="2.5" />
          ) : newTableShape === 'square' ? (
            <rect x="74" y="49" width="52" height="52" rx="8" fill={newTableColor} stroke="#ffffff" strokeWidth="2.5" />
          ) : newTableShape === 'rect' ? (
            <rect x="54" y="55" width="92" height="40" rx="8" fill={newTableColor} stroke="#ffffff" strokeWidth="2.5" />
          ) : (
            <circle cx="100" cy="75" r="30" fill={newTableColor} stroke="#ffffff" strokeWidth="2.5" />
          )}
          <text x="100" y="77" fill="#ffffff" fontSize={newTableBadge && newTableBadge.length > 3 ? 11 : 14} fontWeight="900" textAnchor="middle" dominantBaseline="middle">
            {newTableBadge || newTableCode || 'VIP'}
          </text>
        </svg>
      </div>

      {/* Live Specifications Card */}
      <div style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        fontSize: '0.75rem',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
          <span style={{ color: 'var(--text-muted)' }}>Mesa:</span>
          <strong style={{ color: '#fff' }}>{newTableCode || 'VIP-01'} ({newTableBadge || newTableCode || '01'})</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
          <span style={{ color: 'var(--text-muted)' }}>Zona y capacidad:</span>
          <span>{esTableZone(newTableZone)} · <strong style={{ color: '#00f0ff' }}>{newTableCapacity} personas</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
          <span style={{ color: 'var(--text-muted)' }}>Consumo Mínimo:</span>
          <strong style={{ color: '#22d3ee' }}>{formatUsd(newTableMinSpend)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
          <span style={{ color: 'var(--text-muted)' }}>Anticipo Reserva:</span>
          <strong style={{ color: '#facc15' }}>{formatUsd(newTableDeposit)}</strong>
        </div>
      </div>
    </div>
  );
};

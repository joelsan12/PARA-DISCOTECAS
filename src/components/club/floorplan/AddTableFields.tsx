import React from 'react';
import type { TableZone } from '../../../types';
import { esTableZone } from '../../../lib/esLabels';

interface Props {
  newTableCode: string;
  setNewTableCode: (code: string) => void;
  newTableBadge: string;
  setNewTableBadge: (badge: string) => void;
  newTableZone: TableZone;
  setNewTableZone: (zone: TableZone) => void;
  newTableCapacity: number;
  setNewTableCapacity: (cap: number) => void;
  newTableShape: 'circle' | 'pill' | 'square' | 'rect';
  setNewTableShape: (shape: 'circle' | 'pill' | 'square' | 'rect') => void;
  newTableColor: string;
  setNewTableColor: (color: string) => void;
  newTableMinSpend: number;
  setNewTableMinSpend: (spend: number) => void;
  newTableDeposit: number;
  setNewTableDeposit: (dep: number) => void;
}

const TIER_COLORS = [
  { label: 'Oro VIP', color: '#eab308' },
  { label: 'Cian Neón', color: '#06b6d4' },
  { label: 'Rubí Exclusivo', color: '#f43f5e' },
  { label: 'Púrpura terciopelo', color: '#c084fc' },
  { label: 'Naranja Eléctrico', color: '#f97316' },
  { label: 'Rojo Fuego', color: '#ef4444' },
  { label: 'Plata', color: '#94a3b8' },
  { label: 'Esmeralda', color: '#10b981' }
];

const ZONE_OPTIONS: TableZone[] = [
  'VIP Stage',
  'DJ Booth',
  'Dance Floor',
  'Suites VIP',
  'Palco',
  'Platinum',
  'Gold',
  'Silver',
  'Terrace Lounge'
];

export const AddTableFields: React.FC<Props> = ({
  newTableCode,
  setNewTableCode,
  newTableBadge,
  setNewTableBadge,
  newTableZone,
  setNewTableZone,
  newTableCapacity,
  setNewTableCapacity,
  newTableShape,
  setNewTableShape,
  newTableColor,
  setNewTableColor,
  newTableMinSpend,
  setNewTableMinSpend,
  newTableDeposit,
  setNewTableDeposit,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Código de Mesa *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. VIP-10"
            value={newTableCode}
            onChange={e => setNewTableCode(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Identificador corto en el plano
          </label>
          <input
            type="text"
            placeholder="Ej. 10 o V10"
            value={newTableBadge}
            onChange={e => setNewTableBadge(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Zona del Club
          </label>
          <select
            value={newTableZone}
            onChange={e => setNewTableZone(e.target.value as TableZone)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0d131f',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            {ZONE_OPTIONS.map(z => (
              <option key={z} value={z}>{esTableZone(z)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Capacidad (personas)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={newTableCapacity}
            onChange={e => setNewTableCapacity(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          />
        </div>
      </div>

      {/* Forma Geométrica */}
      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Forma Geométrica
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {(['circle', 'pill', 'square', 'rect'] as const).map(shape => (
            <button
              key={shape}
              type="button"
              onClick={() => setNewTableShape(shape)}
              style={{
                padding: '8px 6px',
                background: newTableShape === shape ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: newTableShape === shape ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-xs)',
                color: newTableShape === shape ? '#00f0ff' : '#94a3b8',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>
                {shape === 'circle' ? '⚪' : shape === 'pill' ? '💊' : shape === 'square' ? '⏹️' : '▭'}
              </span>
              <span>{shape === 'circle' ? 'Círculo' : shape === 'pill' ? 'Cápsula' : shape === 'square' ? 'Cuadrado' : 'Rectángulo'}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Consumo mínimo (USD)
          </label>
          <input
            type="number"
            step={50}
            value={newTableMinSpend}
            onChange={e => setNewTableMinSpend(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#22d3ee',
              fontSize: '0.85rem',
              fontWeight: 800
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Anticipo (USD)
          </label>
          <input
            type="number"
            step={25}
            value={newTableDeposit}
            onChange={e => setNewTableDeposit(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xs)',
              color: '#facc15',
              fontSize: '0.85rem',
              fontWeight: 800
            }}
          />
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Color de Categoría VIP
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TIER_COLORS.map(t => (
            <button
              key={t.color}
              type="button"
              onClick={() => setNewTableColor(t.color)}
              title={t.label}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: t.color,
                border: newTableColor === t.color ? '3px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                boxShadow: newTableColor === t.color ? `0 0 10px ${t.color}` : 'none'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

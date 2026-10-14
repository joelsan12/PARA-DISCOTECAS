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
          <label className="floorplan-label">
            Código de Mesa *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. VIP-10"
            value={newTableCode}
            onChange={e => setNewTableCode(e.target.value)}
            className="floorplan-input"
          />
        </div>

        <div>
          <label className="floorplan-label">
            Identificador corto en el plano
          </label>
          <input
            type="text"
            placeholder="Ej. 10 o V10"
            value={newTableBadge}
            onChange={e => setNewTableBadge(e.target.value)}
            className="floorplan-input"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
        <div>
          <label className="floorplan-label">
            Zona del Club
          </label>
          <select
            value={newTableZone}
            onChange={e => setNewTableZone(e.target.value as TableZone)}
            className="floorplan-input"
          >
            {ZONE_OPTIONS.map(z => (
              <option key={z} value={z}>{esTableZone(z)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="floorplan-label">
            Capacidad (personas)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={newTableCapacity}
            onChange={e => setNewTableCapacity(Number(e.target.value))}
            className="floorplan-input"
          />
        </div>
      </div>

      {/* Forma Geométrica */}
      <div>
        <label className="floorplan-label" style={{ marginBottom: '6px' }}>
          Forma Geométrica
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {(['circle', 'pill', 'square', 'rect'] as const).map(shape => (
            <button
              key={shape}
              type="button"
              onClick={() => setNewTableShape(shape)}
              className={`floorplan-option-btn ${newTableShape === shape ? 'active' : ''}`}
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
          <label className="floorplan-label">
            Consumo mínimo (USD)
          </label>
          <input
            type="number"
            step={50}
            value={newTableMinSpend}
            onChange={e => setNewTableMinSpend(Number(e.target.value))}
            className="floorplan-input"
            style={{ color: 'var(--state-info, #22d3ee)' }}
          />
        </div>

        <div>
          <label className="floorplan-label">
            Anticipo (USD)
          </label>
          <input
            type="number"
            step={25}
            value={newTableDeposit}
            onChange={e => setNewTableDeposit(Number(e.target.value))}
            className="floorplan-input"
            style={{ color: 'var(--brand-gold, #facc15)' }}
          />
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <label className="floorplan-label" style={{ marginBottom: '6px' }}>
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
                border: newTableColor === t.color ? '3px solid var(--text-high, #fff)' : '1px solid var(--border-light, rgba(255, 255, 255, 0.2))',
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

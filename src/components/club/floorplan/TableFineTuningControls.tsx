import React, { useState } from 'react';
import type { ClubTable, EventTablePricing } from '../../../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, DollarSign, Target } from 'lucide-react';

interface Props {
  selectedTable: ClubTable;
  selectedPricing: EventTablePricing | null | undefined;
  onUpdateTable: (id: string, partial: Partial<ClubTable>) => void;
  onUpdatePricing?: (tableId: string, minSpend: number, deposit: number) => void;
}

export const TableFineTuningControls: React.FC<Props> = ({
  selectedTable,
  selectedPricing,
  onUpdateTable,
  onUpdatePricing,
}) => {
  const [stepSize, setStepSize] = useState<1 | 5>(1);

  const currentRotation = selectedTable.rotation || 0;

  const moveTable = (dx: number, dy: number) => {
    const nextX = Math.max(2, Math.min(98, Math.round((selectedTable.x + dx) * 10) / 10));
    const nextY = Math.max(2, Math.min(98, Math.round((selectedTable.y + dy) * 10) / 10));
    onUpdateTable(selectedTable.id, { x: nextX, y: nextY });
  };

  const setRotation = (deg: number) => {
    onUpdateTable(selectedTable.id, { rotation: (deg % 360 + 360) % 360 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Precision Position Card */}
      <div className="floorplan-subcard">
        {/* Header with Step Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--brand-gold)',
            textTransform: 'uppercase',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Target size={13} color="var(--brand-gold)" />
            Posición Milimétrica
          </span>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setStepSize(1)}
              className={`floorplan-preset-pill ${stepSize === 1 ? 'active' : ''}`}
              title="Mover de 1% en 1%"
            >
              1%
            </button>
            <button
              type="button"
              onClick={() => setStepSize(5)}
              className={`floorplan-preset-pill ${stepSize === 5 ? 'active' : ''}`}
              title="Mover de 5% en 5%"
            >
              5%
            </button>
          </div>
        </div>

        {/* Direct Numerical X / Y Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="floorplan-label">
              Coordenada X (Horizontal)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min={2}
                max={98}
                step={stepSize}
                value={selectedTable.x}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    onUpdateTable(selectedTable.id, { x: Math.max(2, Math.min(98, val)) });
                  }
                }}
                className="floorplan-input"
                style={{
                  padding: '7px 24px 7px 10px',
                  color: 'var(--brand-gold)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}
              />
              <span style={{ position: 'absolute', right: '8px', top: '7px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                %
              </span>
            </div>
          </div>

          <div>
            <label className="floorplan-label">
              Coordenada Y (Vertical)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min={2}
                max={98}
                step={stepSize}
                value={selectedTable.y}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    onUpdateTable(selectedTable.id, { y: Math.max(2, Math.min(98, val)) });
                  }
                }}
                className="floorplan-input"
                style={{
                  padding: '7px 24px 7px 10px',
                  color: 'var(--brand-gold)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}
              />
              <span style={{ position: 'absolute', right: '8px', top: '7px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                %
              </span>
            </div>
          </div>
        </div>

        {/* Ergonomic D-Pad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 38px)',
          gridTemplateRows: 'repeat(2, 34px)',
          gap: '6px',
          justifyContent: 'center',
          margin: '2px 0'
        }}>
          <div />
          <button
            type="button"
            onClick={() => moveTable(0, -stepSize)}
            className="floorplan-dpad-btn"
            title={`Mover Arriba (-${stepSize}%)`}
          >
            <ArrowUp size={15} />
          </button>
          <div />

          <button
            type="button"
            onClick={() => moveTable(-stepSize, 0)}
            className="floorplan-dpad-btn"
            title={`Mover Izquierda (-${stepSize}%)`}
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => moveTable(0, stepSize)}
            className="floorplan-dpad-btn"
            title={`Mover Abajo (+${stepSize}%)`}
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            onClick={() => moveTable(stepSize, 0)}
            className="floorplan-dpad-btn"
            title={`Mover Derecha (+${stepSize}%)`}
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Rotation Control Card */}
      <div className="floorplan-subcard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <RotateCw size={12} color="var(--brand-gold)" />
            Orientación / Giro
          </span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-high, #ffffff)', fontWeight: 800 }}>
            {currentRotation}°
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[0, 45, 90, 180].map(deg => (
            <button
              key={deg}
              type="button"
              onClick={() => setRotation(deg)}
              className={`floorplan-preset-pill ${currentRotation === deg ? 'active' : ''}`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Event Pricing (if pricing exists) */}
      {selectedPricing && onUpdatePricing && (
        <div className="floorplan-subcard" style={{
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: 'rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{
            fontSize: '0.72rem',
            color: '#10b981',
            textTransform: 'uppercase',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <DollarSign size={13} color="#10b981" />
            Tarifario para Evento Activo
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="floorplan-label">
                Consumo Mínimo (USD)
              </label>
              <input
                type="number"
                min={0}
                value={selectedPricing.min_spend}
                onChange={e => onUpdatePricing(selectedTable.id, Number(e.target.value), selectedPricing.deposit_required)}
                className="floorplan-input"
                style={{
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label className="floorplan-label">
                Anticipo Requerido (USD)
              </label>
              <input
                type="number"
                min={0}
                value={selectedPricing.deposit_required}
                onChange={e => onUpdatePricing(selectedTable.id, selectedPricing.min_spend, Number(e.target.value))}
                className="floorplan-input"
                style={{
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


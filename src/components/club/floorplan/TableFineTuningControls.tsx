import React from 'react';
import type { ClubTable, EventTablePricing } from '../../../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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
  return (
    <>
      {/* Coordenadas X / Y Milimétricas */}
      <div style={{
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Ajuste Fino de Posición
          </span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#00f0ff' }}>
            X: {selectedTable.x}% · Y: {selectedTable.y}%
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
          <button
            onClick={() => onUpdateTable(selectedTable.id, { x: Math.max(0, selectedTable.x - 1) })}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Mover Izquierda (-1%)"
          >
            <ArrowLeft size={13} />
          </button>
          <button
            onClick={() => onUpdateTable(selectedTable.id, { y: Math.max(0, selectedTable.y - 1) })}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Mover Arriba (-1%)"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onUpdateTable(selectedTable.id, { y: Math.min(100, selectedTable.y + 1) })}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Mover Abajo (+1%)"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={() => onUpdateTable(selectedTable.id, { x: Math.min(100, selectedTable.x + 1) })}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Mover Derecha (+1%)"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Pricing for Active Event */}
      {selectedPricing && onUpdatePricing && (
        <div style={{
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Consumo mínimo (USD)
            </label>
            <input
              type="number"
              min={0}
              value={selectedPricing.min_spend}
              onChange={e => onUpdatePricing(selectedTable.id, Number(e.target.value), selectedPricing.deposit_required)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-xs)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Anticipo requerido (USD)
            </label>
            <input
              type="number"
              min={0}
              value={selectedPricing.deposit_required}
              onChange={e => onUpdatePricing(selectedTable.id, selectedPricing.min_spend, Number(e.target.value))}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-xs)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

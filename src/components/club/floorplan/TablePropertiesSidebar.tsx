import React from 'react';
import type { ClubTable, EventTablePricing, TableZone } from '../../../types';
import { Trash2, Copy } from 'lucide-react';
import { TableFineTuningControls } from './TableFineTuningControls';
import { esTableZone } from '../../../lib/esLabels';

interface Props {
  selectedTable: ClubTable | null;
  selectedPricing: EventTablePricing | null | undefined;
  confirmDeleteId: string | null;
  onDeleteSelected: () => void;
  onCancelDelete: () => void;
  onDuplicateSelected: () => void;
  onUpdateTable: (id: string, partial: Partial<ClubTable>) => void;
  onUpdatePricing?: (tableId: string, minSpend: number, deposit: number) => void;
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

export const TablePropertiesSidebar: React.FC<Props> = ({
  selectedTable,
  selectedPricing,
  confirmDeleteId,
  onDeleteSelected,
  onCancelDelete,
  onDuplicateSelected,
  onUpdateTable,
  onUpdatePricing,
}) => {
  if (!selectedTable) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '0.85rem' }}>Selecciona una mesa en el plano para inspeccionar y editar sus propiedades.</p>
      </div>
    );
  }

  const isConfirmedForDelete = confirmDeleteId === selectedTable.id;

  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
          Propiedades: {selectedTable.table_code}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onDuplicateSelected}
            title="Duplicar Mesa"
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Copy size={13} />
            <span>Duplicar</span>
          </button>

          <button
            onClick={onDeleteSelected}
            title={isConfirmedForDelete ? "Haz clic de nuevo para confirmar eliminación" : "Eliminar Mesa"}
            style={{
              padding: '7px 12px',
              background: isConfirmedForDelete ? '#dc2626' : 'rgba(239, 68, 68, 0.15)',
              border: isConfirmedForDelete ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xs)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              fontWeight: isConfirmedForDelete ? 800 : 600,
              boxShadow: isConfirmedForDelete ? '0 0 14px rgba(239, 68, 68, 0.6)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Trash2 size={14} />
            {isConfirmedForDelete ? '¿Confirmar?' : 'Borrar'}
          </button>

          {isConfirmedForDelete && (
            <button
              onClick={onCancelDelete}
              title="Cancelar"
              style={{
                padding: '7px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-xs)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Código de Mesa
            </label>
            <input
              type="text"
              value={selectedTable.table_code}
              onChange={e => onUpdateTable(selectedTable.id, { table_code: e.target.value })}
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
              Identificador en el plano (corto)
            </label>
            <input
              type="text"
              value={selectedTable.badge_number || ''}
              onChange={e => onUpdateTable(selectedTable.id, { badge_number: e.target.value })}
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
              value={selectedTable.zone}
              onChange={e => onUpdateTable(selectedTable.id, { zone: e.target.value as TableZone, tier_name: e.target.value })}
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
              value={selectedTable.capacity}
              onChange={e => onUpdateTable(selectedTable.id, { capacity: Number(e.target.value) })}
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
                onClick={() => onUpdateTable(selectedTable.id, { shape })}
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: selectedTable.shape === shape ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedTable.shape === shape ? '#00f0ff' : 'var(--text-muted)',
                  border: selectedTable.shape === shape ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer'
                }}
              >
                {shape === 'circle' ? 'Círculo' : shape === 'pill' ? 'Cápsula' : shape === 'square' ? 'Cuadrado' : 'Rectángulo'}
              </button>
            ))}
          </div>
        </div>

        {/* Color de Nivel */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Color de Nivel / Categoría VIP
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TIER_COLORS.map(t => (
              <button
                key={t.color}
                type="button"
                onClick={() => onUpdateTable(selectedTable.id, { tier_color: t.color })}
                title={t.label}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: t.color,
                  border: selectedTable.tier_color === t.color ? '3px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  boxShadow: selectedTable.tier_color === t.color ? `0 0 10px ${t.color}` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Coordenadas Fina & Precios */}
        <TableFineTuningControls
          selectedTable={selectedTable}
          selectedPricing={selectedPricing}
          onUpdateTable={onUpdateTable}
          onUpdatePricing={onUpdatePricing}
        />
      </div>
    </div>
  );
};

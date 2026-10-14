import React from 'react';
import type { ClubTable, EventTablePricing, TableZone } from '../../../types';
import { Trash2, Copy, Users, LayoutGrid } from 'lucide-react';
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
  { label: 'Púrpura Terciopelo', color: '#c084fc' },
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
      <div className="floorplan-panel-card" style={{
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'var(--accent-subtle, rgba(229, 181, 79, 0.08))',
          border: '1px solid var(--border-light, rgba(229, 181, 79, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LayoutGrid size={22} color="var(--brand-gold)" />
        </div>
        <div>
          <h4 className="floorplan-panel-title" style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
            Inspector de Mesas
          </h4>
          <p className="floorplan-panel-subtitle" style={{ maxWidth: '280px', lineHeight: 1.5 }}>
            Selecciona cualquier mesa en el plano para editar su capacidad, forma, color y posición milimétrica.
          </p>
        </div>
      </div>
    );
  }

  const isConfirmedForDelete = confirmDeleteId === selectedTable.id;
  const activeColorObj = TIER_COLORS.find(c => c.color.toLowerCase() === (selectedTable.tier_color || '#eab308').toLowerCase()) || TIER_COLORS[0];

  return (
    <div className="floorplan-panel-card" style={{ padding: '20px' }}>
      {/* Top Gold Horizon Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(229, 181, 79, 0.6), transparent)',
        pointerEvents: 'none'
      }} />

      {/* Header with Live Preview Chip and Quick Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live Preview Chip */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: selectedTable.shape === 'circle' ? '50%' : selectedTable.shape === 'pill' ? '12px' : '6px',
            background: selectedTable.tier_color || '#eab308',
            border: '2px solid #ffffff',
            boxShadow: `0 0 12px ${selectedTable.tier_color || '#eab308'}88`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#08080c',
            fontWeight: 900,
            fontSize: '0.65rem'
          }}>
            {selectedTable.badge_number || selectedTable.table_code}
          </div>

          <div>
            <h3 className="floorplan-panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>
              Propiedades: <span style={{ color: 'var(--brand-gold)' }}>{selectedTable.table_code}</span>
            </h3>
            <span className="floorplan-panel-subtitle">
              {esTableZone(selectedTable.zone)} · {selectedTable.capacity} Personas
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onDuplicateSelected}
            title="Duplicar Mesa"
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Copy size={13} />
            <span>Duplicar</span>
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            title={isConfirmedForDelete ? "Haz clic de nuevo para confirmar eliminación" : "Eliminar Mesa"}
            style={{
              padding: '6px 12px',
              background: isConfirmedForDelete ? '#dc2626' : 'rgba(239, 68, 68, 0.12)',
              border: isConfirmedForDelete ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xs)',
              color: isConfirmedForDelete ? '#ffffff' : 'var(--state-danger-text, #f87171)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.74rem',
              fontWeight: isConfirmedForDelete ? 800 : 700,
              boxShadow: isConfirmedForDelete ? '0 0 14px rgba(239, 68, 68, 0.6)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Trash2 size={13} />
            {isConfirmedForDelete ? '¿Confirmar?' : 'Borrar'}
          </button>

          {isConfirmedForDelete && (
            <button
              type="button"
              onClick={onCancelDelete}
              title="Cancelar eliminación"
              className="btn-ghost"
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                fontSize: '0.72rem'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Card Section 1: Identificación & Capacidad */}
        <div className="floorplan-subcard">
          {/* Row: Código + Etiqueta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="floorplan-label">
                Código de Mesa
              </label>
              <input
                type="text"
                className="floorplan-input"
                value={selectedTable.table_code}
                onChange={e => onUpdateTable(selectedTable.id, { table_code: e.target.value })}
              />
            </div>

            <div>
              <label className="floorplan-label">
                Etiqueta en Plano (Corta)
              </label>
              <input
                type="text"
                className="floorplan-input"
                value={selectedTable.badge_number || ''}
                onChange={e => onUpdateTable(selectedTable.id, { badge_number: e.target.value })}
                placeholder={selectedTable.table_code}
              />
            </div>
          </div>

          {/* Row: Zona + Capacidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label className="floorplan-label">
                Zona del Club
              </label>
              <select
                className="floorplan-input"
                value={selectedTable.zone}
                onChange={e => onUpdateTable(selectedTable.id, { zone: e.target.value as TableZone, tier_name: e.target.value })}
              >
                {ZONE_OPTIONS.map(z => (
                  <option key={z} value={z}>{esTableZone(z)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="floorplan-label">
                Capacidad (Personas)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="floorplan-input"
                value={selectedTable.capacity}
                onChange={e => onUpdateTable(selectedTable.id, { capacity: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Quick Capacity Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={11} />
              Presets:
            </span>
            {[2, 4, 6, 8, 10, 12].map(cap => (
              <button
                key={cap}
                type="button"
                onClick={() => onUpdateTable(selectedTable.id, { capacity: cap })}
                className={`floorplan-preset-pill ${selectedTable.capacity === cap ? 'active' : ''}`}
              >
                {cap}p
              </button>
            ))}
          </div>
        </div>

        {/* Card Section 2: Morfología Geométrica */}
        <div className="floorplan-subcard">
          <label className="floorplan-label">
            Forma Geométrica de la Mesa
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {([
              { shape: 'circle', label: 'Círculo' },
              { shape: 'pill', label: 'Cápsula' },
              { shape: 'square', label: 'Cuadrado' },
              { shape: 'rect', label: 'Rectángulo' }
            ] as const).map(({ shape, label }) => {
              const isCurrent = selectedTable.shape === shape;
              return (
                <button
                  key={shape}
                  type="button"
                  onClick={() => onUpdateTable(selectedTable.id, { shape })}
                  className={`floorplan-option-btn ${isCurrent ? 'active' : ''}`}
                >
                  {/* SVG Shape Icon */}
                  <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    {shape === 'circle' && (
                      <circle cx="11" cy="9" r="7" stroke={isCurrent ? 'var(--brand-gold)' : 'currentColor'} strokeWidth="1.8" />
                    )}
                    {shape === 'pill' && (
                      <rect x="2" y="4" width="18" height="10" rx="5" stroke={isCurrent ? 'var(--brand-gold)' : 'currentColor'} strokeWidth="1.8" />
                    )}
                    {shape === 'square' && (
                      <rect x="5" y="3" width="12" height="12" rx="2" stroke={isCurrent ? 'var(--brand-gold)' : 'currentColor'} strokeWidth="1.8" />
                    )}
                    {shape === 'rect' && (
                      <rect x="2" y="4" width="18" height="10" rx="2" stroke={isCurrent ? 'var(--brand-gold)' : 'currentColor'} strokeWidth="1.8" />
                    )}
                  </svg>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Section 3: Color de Nivel / Categoría VIP */}
        <div className="floorplan-subcard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="floorplan-label" style={{ margin: 0 }}>
              Color de Nivel / Categoría VIP
            </label>
            <span style={{ fontSize: '0.7rem', color: activeColorObj.color, fontWeight: 700 }}>
              {activeColorObj.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TIER_COLORS.map(t => {
              const isSelected = (selectedTable.tier_color || '#eab308').toLowerCase() === t.color.toLowerCase();
              return (
                <button
                  key={t.color}
                  type="button"
                  onClick={() => onUpdateTable(selectedTable.id, { tier_color: t.color })}
                  title={t.label}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: t.color,
                    border: isSelected ? '3px solid var(--text-high, #ffffff)' : '1px solid var(--border-light, rgba(255, 255, 255, 0.2))',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 12px ${t.color}` : 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Card Section 4: Ajuste Milimétrico, D-Pad, Rotación y Precios */}
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


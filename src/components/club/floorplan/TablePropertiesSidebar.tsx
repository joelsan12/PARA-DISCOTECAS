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
      <div style={{
        padding: '36px 24px',
        background: 'linear-gradient(180deg, #0b0e17 0%, #07090f 100%)',
        border: '1px solid rgba(229, 181, 79, 0.2)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'rgba(229, 181, 79, 0.08)',
          border: '1px solid rgba(229, 181, 79, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LayoutGrid size={22} color="var(--brand-gold)" />
        </div>
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
            Inspector de Mesas
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: 1.5 }}>
            Selecciona cualquier mesa en el plano para editar su capacidad, forma, color y posición milimétrica.
          </p>
        </div>
      </div>
    );
  }

  const isConfirmedForDelete = confirmDeleteId === selectedTable.id;
  const activeColorObj = TIER_COLORS.find(c => c.color.toLowerCase() === (selectedTable.tier_color || '#eab308').toLowerCase()) || TIER_COLORS[0];

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(180deg, #0b0e17 0%, #07090f 100%)',
      border: '1px solid rgba(229, 181, 79, 0.22)',
      borderRadius: 'var(--radius-md)',
      position: 'relative',
      boxShadow: '0 18px 45px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(229, 181, 79, 0.15)',
      overflow: 'hidden'
    }}>
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
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
              Propiedades: <span style={{ color: 'var(--brand-gold)' }}>{selectedTable.table_code}</span>
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
              background: isConfirmedForDelete ? '#dc2626' : 'rgba(239, 68, 68, 0.14)',
              border: isConfirmedForDelete ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xs)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.74rem',
              fontWeight: isConfirmedForDelete ? 800 : 600,
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
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-xs)',
                color: '#94a3b8',
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
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Row: Código + Etiqueta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Código de Mesa
              </label>
              <input
                type="text"
                value={selectedTable.table_code}
                onChange={e => onUpdateTable(selectedTable.id, { table_code: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(8, 10, 16, 0.9)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Etiqueta en Plano (Corta)
              </label>
              <input
                type="text"
                value={selectedTable.badge_number || ''}
                onChange={e => onUpdateTable(selectedTable.id, { badge_number: e.target.value })}
                placeholder={selectedTable.table_code}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(8, 10, 16, 0.9)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800
                }}
              />
            </div>
          </div>

          {/* Row: Zona + Capacidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Zona del Club
              </label>
              <select
                value={selectedTable.zone}
                onChange={e => onUpdateTable(selectedTable.id, { zone: e.target.value as TableZone, tier_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(8, 10, 16, 0.9)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                {ZONE_OPTIONS.map(z => (
                  <option key={z} value={z} style={{ background: '#0e121a' }}>{esTableZone(z)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Capacidad (Personas)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={selectedTable.capacity}
                onChange={e => onUpdateTable(selectedTable.id, { capacity: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(8, 10, 16, 0.9)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 800
                }}
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
                style={{
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  background: selectedTable.capacity === cap ? 'rgba(229, 181, 79, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedTable.capacity === cap ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: selectedTable.capacity === cap ? 'var(--brand-gold)' : 'var(--text-muted)',
                  transition: 'all 0.12s ease'
                }}
              >
                {cap}p
              </button>
            ))}
          </div>
        </div>

        {/* Card Section 2: Morfología Geométrica */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
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
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    background: isCurrent ? 'rgba(229, 181, 79, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isCurrent ? 'var(--brand-gold)' : 'var(--text-muted)',
                    border: isCurrent ? '1.5px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 0 10px rgba(229, 181, 79, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* SVG Shape Icon */}
                  <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    {shape === 'circle' && (
                      <circle cx="11" cy="9" r="7" stroke={isCurrent ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.8" />
                    )}
                    {shape === 'pill' && (
                      <rect x="2" y="4" width="18" height="10" rx="5" stroke={isCurrent ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.8" />
                    )}
                    {shape === 'square' && (
                      <rect x="5" y="3" width="12" height="12" rx="2" stroke={isCurrent ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.8" />
                    )}
                    {shape === 'rect' && (
                      <rect x="2" y="4" width="18" height="10" rx="2" stroke={isCurrent ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.8" />
                    )}
                  </svg>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Section 3: Color de Nivel / Categoría VIP */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
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
                    border: isSelected ? '3px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
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


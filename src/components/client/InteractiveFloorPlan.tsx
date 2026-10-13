import React, { useState } from 'react';
import type { ClubTable, EventTablePricing, ClubLayoutType } from '../../types';
import { useClubStore } from '../../store/clubStore';
import { FloorPlanBackdrops } from '../club/floorplan/FloorPlanBackdrops';

export interface TableStateOverride {
  state?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  label?: string;
  clickable?: boolean;
}

interface Props {
  tables?: ClubTable[];
  eventPricings?: EventTablePricing[];
  selectedTableId: string | null;
  onSelectTable: (table: ClubTable) => void;
  tableStateOverrides?: Record<string, TableStateOverride>;
  layoutType?: ClubLayoutType;
}

export const InteractiveFloorPlan: React.FC<Props> = ({
  tables,
  eventPricings = [],
  selectedTableId,
  onSelectTable,
  tableStateOverrides,
  layoutType: propLayoutType
}) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const effectiveLayoutType: ClubLayoutType = propLayoutType || activeClub?.layout_type || 'custom_open';

  const venueTables = tables ?? store.tables.filter(t => t.club_id === activeClub?.id);
  const clubEvents = store.events.filter(e => e.club_id === activeClub?.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];
  const venuePricings = activeEvent
    ? store.eventPricing.filter(p => p.event_id === activeEvent.id)
    : [];

  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const getTableStatus = (tableId: string): string => {
    const pricing = venuePricings.find(p => p.table_id === tableId) || eventPricings.find(p => p.table_id === tableId);
    return pricing?.status || 'AVAILABLE';
  };

  const viewBoxWidth = effectiveLayoutType === 'horseshoe_vip' ? 800 : effectiveLayoutType === 'u_amphitheater' ? 600 : effectiveLayoutType === 'downtown_suites' ? 600 : 800;
  const viewBoxHeight = effectiveLayoutType === 'horseshoe_vip' ? 800 : effectiveLayoutType === 'u_amphitheater' ? 780 : effectiveLayoutType === 'downtown_suites' ? 960 : 650;
  const isAmphi = effectiveLayoutType === 'u_amphitheater';
  const radius = isAmphi ? 14 : 24;

  const hoveredTable = venueTables.find(t => t.id === hoveredTableId);

  const watermarkTitle = effectiveLayoutType === 'horseshoe_vip'
    ? 'HERRADURA VIP · PLANO CENITAL'
    : effectiveLayoutType === 'u_amphitheater'
    ? 'ANFITEATRO CURVO · PLANO CENITAL'
    : effectiveLayoutType === 'downtown_suites'
    ? 'SUITES URBANAS · PLANO CENITAL'
    : 'PLANTA LIBRE · PLANO CENITAL';

  const clientUser = store.clientUser;
  const clientReservation = clientUser
    ? store.reservations.find(r => (r.club_id === activeClub?.id || !r.club_id) && (
        r.customer_name === clientUser.name ||
        (clientUser.email && r.customer_email === clientUser.email) ||
        (clientUser.phone && r.customer_phone === clientUser.phone) ||
        r.id.includes(clientUser.id)
      ))
    : null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: effectiveLayoutType === 'downtown_suites' ? '0.62/1' : effectiveLayoutType === 'u_amphitheater' ? '0.77/1' : '1/1',
      maxHeight: '640px',
      margin: '0 auto',
      background: effectiveLayoutType === 'u_amphitheater' ? '#171c26' : '#080c14',
      borderRadius: effectiveLayoutType === 'u_amphitheater' ? '28px' : '16px',
      border: '1.5px solid rgba(229, 181, 79, 0.25)',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.85), 0 10px 30px rgba(0,0,0,0.5)',
      userSelect: 'none'
    }}>
      {/* Blueprint Grid Texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(229, 181, 79, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        opacity: 0.6
      }} />

      {/* Watermark de Zona / Arquetipo */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        fontSize: '0.62rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'rgba(229, 181, 79, 0.45)',
        fontWeight: 800,
        pointerEvents: 'none',
        fontFamily: 'var(--font-brand), system-ui, sans-serif',
        zIndex: 5
      }}>
        {watermarkTitle}
      </div>

      {/* Floating Real-Time Hover HUD Tooltip */}
      {hoveredTable && (() => {
        const hPricing = venuePricings.find(p => p.table_id === hoveredTable.id) || eventPricings.find(p => p.table_id === hoveredTable.id);
        const hOverride = tableStateOverrides ? (tableStateOverrides[hoveredTable.id] || tableStateOverrides[hoveredTable.table_code]) : undefined;
        const hStatus = hOverride?.label || (
          hOverride?.state === 'INSIDE'
            ? 'En Sala'
            : hOverride?.state === 'HELD'
            ? 'Hold (12 min)'
            : hPricing?.status === 'CONFIRMED'
            ? 'Reservada'
            : 'Disponible'
        );

        return (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            background: 'rgba(8, 12, 20, 0.94)',
            border: '1px solid rgba(229, 181, 79, 0.45)',
            borderRadius: '8px',
            padding: '5px 12px',
            color: '#fff',
            fontSize: '0.74rem',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <span style={{ fontWeight: 800, color: 'var(--brand-gold)' }}>{hoveredTable.table_code}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{hoveredTable.zone}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{hoveredTable.capacity}p</span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 700,
              background: hOverride?.state === 'INSIDE'
                ? 'rgba(52, 211, 153, 0.2)'
                : hOverride?.state === 'HELD'
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(229, 181, 79, 0.15)',
              color: hOverride?.state === 'INSIDE'
                ? '#34d399'
                : hOverride?.state === 'HELD'
                ? '#f59e0b'
                : 'var(--brand-gold)'
            }}>
              {hStatus}
            </span>
          </div>
        );
      })()}

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <defs>
          {/* Blueprint Grid */}
          <pattern id="interactive-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1" fill="rgba(229, 181, 79, 0.15)" />
          </pattern>

          {/* Glowing Filters */}
          <filter id="interactive-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="interactive-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(0,0,0,0.7)" />
          </filter>
        </defs>

        {/* CAD Grid Layer */}
        <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#interactive-grid)" pointerEvents="none" />

        {/* CAD Alignment Markers */}
        <g stroke="rgba(229, 181, 79, 0.3)" strokeWidth="1.5" fill="none" pointerEvents="none">
          <path d="M 16 32 L 16 16 L 32 16" />
          <path d={`M ${viewBoxWidth - 32} 16 L ${viewBoxWidth - 16} 16 L ${viewBoxWidth - 16} 32`} />
          <path d={`M 16 ${viewBoxHeight - 32} L 16 ${viewBoxHeight - 16} L 32 ${viewBoxHeight - 16}`} />
          <path d={`M ${viewBoxWidth - 32} ${viewBoxHeight - 16} L ${viewBoxWidth - 16} ${viewBoxHeight - 16} L ${viewBoxWidth - 16} ${viewBoxHeight - 32}`} />
        </g>

        {/* Architectural Backdrop del Negocio */}
        <FloorPlanBackdrops layoutType={effectiveLayoutType} />

        {/* Renderizado de Mesas Interactivas */}
        {venueTables.map(table => {
          const override = tableStateOverrides ? (tableStateOverrides[table.id] || tableStateOverrides[table.table_code]) : undefined;
          const status = override?.state || getTableStatus(table.id);
          const isSelected = selectedTableId === table.id;
          const isHovered = hoveredTableId === table.id;

          const isInside = status === 'INSIDE';
          const isConfirmed = status === 'CONFIRMED' || status === 'CHECKED_IN';
          const isHeld = status === 'HELD';
          const isSettled = status === 'SETTLED';
          const isAvailable = status === 'AVAILABLE';

          const isMyTable = Boolean(
            clientReservation &&
            (table.table_code === clientReservation.table_code || table.id === clientReservation.table_id)
          );

          const isClickable = override
            ? (override.clickable !== undefined ? override.clickable : true)
            : (isAvailable || isSelected || isMyTable);

          const cx = (table.x / 100) * viewBoxWidth;
          const cy = (table.y / 100) * viewBoxHeight;
          const rot = table.rotation || 0;
          const capacity = Math.max(1, table.capacity || 4);

          // Colores de estado operativo y estético
          let fillColor = table.tier_color || '#eab308';
          let strokeColor = '#ffffff';
          let strokeWidth = isSelected ? 2.5 : 1.5;

          if (isMyTable) {
            fillColor = '#b45309';
            strokeColor = '#e5b54f';
            strokeWidth = 3;
          } else if (isInside) {
            fillColor = override?.backgroundColor || '#064e3b';
            strokeColor = override?.borderColor || '#34d399';
          } else if (isConfirmed) {
            fillColor = override?.backgroundColor || '#78350f';
            strokeColor = override?.borderColor || '#e5b54f';
          } else if (isHeld) {
            fillColor = override?.backgroundColor || '#7c2d12';
            strokeColor = override?.borderColor || '#f59e0b';
          } else if (isSettled) {
            fillColor = override?.backgroundColor || '#3b0764';
            strokeColor = override?.borderColor || '#a855f7';
          }

          const badgeText = table.badge_number || table.table_code.replace(/^VIP-/, '').replace(/^[A-Z]+-/, '');
          const displayText = badgeText.length > 3 ? badgeText.slice(0, 3) : badgeText;
          const textColor = (isInside || isConfirmed || isHeld || isSettled || isMyTable) ? '#ffffff' : '#08080c';

          return (
            <g
              key={table.id}
              onClick={() => isClickable && onSelectTable(table)}
              onMouseEnter={() => setHoveredTableId(table.id)}
              onMouseLeave={() => setHoveredTableId(null)}
              style={{
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <g
                transform={`rotate(${rot}, ${cx}, ${cy})`}
                style={{
                  filter: isSelected
                    ? 'drop-shadow(0 0 10px rgba(229, 181, 79, 0.85))'
                    : isInside
                    ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))'
                    : isHeld
                    ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                    : isHovered
                    ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45))'
                    : 'url(#interactive-shadow)'
                }}
              >
                {/* Asientos VIP perimetrales */}
                {table.shape === 'circle' && (() => {
                  const seatCount = Math.min(12, capacity);
                  const seatOrbit = radius + (isAmphi ? 6 : 9);
                  const seats = [];
                  for (let i = 0; i < seatCount; i++) {
                    const angle = (i * 2 * Math.PI) / seatCount - Math.PI / 2;
                    const sx = cx + Math.cos(angle) * seatOrbit;
                    const sy = cy + Math.sin(angle) * seatOrbit;
                    seats.push(
                      <circle
                        key={i}
                        cx={sx}
                        cy={sy}
                        r={isAmphi ? 2.2 : 3.2}
                        fill={isSelected ? 'var(--brand-gold)' : isInside ? '#34d399' : 'rgba(255, 255, 255, 0.4)'}
                        stroke="#080c14"
                        strokeWidth="0.8"
                        opacity={isSelected || isInside ? 0.95 : 0.65}
                      />
                    );
                  }
                  return <g pointerEvents="none">{seats}</g>;
                })()}

                {/* Anillo de Selección Activa / Pulsante */}
                {isSelected && (
                  table.shape === 'pill' ? (
                    <rect
                      x={isAmphi ? cx - 18 : cx - 44}
                      y={isAmphi ? cy - 27 : cy - 28}
                      width={isAmphi ? 36 : 88}
                      height={isAmphi ? 54 : 56}
                      rx={isAmphi ? 18 : 22}
                      fill="none"
                      stroke="var(--brand-gold)"
                      strokeWidth="2.5"
                    />
                  ) : (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + (isAmphi ? 6 : 10)}
                      fill="none"
                      stroke="var(--brand-gold)"
                      strokeWidth="2.5"
                    />
                  )
                )}

                {/* Superficie de la mesa según forma geométrica */}
                {table.shape === 'pill' ? (
                  <g>
                    <rect
                      x={isAmphi ? cx - 13 : cx - 36}
                      y={isAmphi ? cy - 22 : cy - 20}
                      width={isAmphi ? 26 : 72}
                      height={isAmphi ? 44 : 40}
                      rx={isAmphi ? 13 : 16}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    <rect
                      x={isAmphi ? cx - 10 : cx - 32}
                      y={isAmphi ? cy - 19 : cy - 17}
                      width={isAmphi ? 20 : 64}
                      height={isAmphi ? 8 : 8}
                      rx={4}
                      fill="rgba(255, 255, 255, 0.35)"
                      pointerEvents="none"
                    />
                  </g>
                ) : table.shape === 'square' || table.shape === 'rect' ? (
                  <g>
                    <rect
                      x={cx - (isAmphi ? 15 : 22)}
                      y={cy - (isAmphi ? 15 : 22)}
                      width={isAmphi ? 30 : 44}
                      height={isAmphi ? 30 : 44}
                      rx="7"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    <rect
                      x={cx - (isAmphi ? 12 : 18)}
                      y={cy - (isAmphi ? 12 : 18)}
                      width={isAmphi ? 24 : 36}
                      height="6"
                      rx="3"
                      fill="rgba(255, 255, 255, 0.35)"
                      pointerEvents="none"
                    />
                  </g>
                ) : (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    <ellipse
                      cx={cx}
                      cy={cy - (isAmphi ? 4.5 : 7.5)}
                      rx={radius * 0.65}
                      ry={radius * 0.3}
                      fill="rgba(255, 255, 255, 0.35)"
                      pointerEvents="none"
                    />
                  </g>
                )}

                {/* Identificador / Código de Mesa */}
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize={isAmphi ? (displayText.length > 2 ? 8 : 9) : (displayText.length > 2 ? 11 : 13)}
                  fontWeight="900"
                  fontFamily="var(--font-brand), system-ui, sans-serif"
                  pointerEvents="none"
                >
                  {displayText}
                </text>

                {/* Distintivo de Mesa Propia (TU MESA) */}
                {isMyTable && (
                  <g pointerEvents="none">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + (isAmphi ? 8 : 12)}
                      fill="none"
                      stroke="#e5b54f"
                      strokeWidth="2"
                      strokeDasharray="4 2.5"
                      opacity="0.95"
                    />
                    <rect
                      x={cx - 24}
                      y={cy - radius - (isAmphi ? 15 : 20)}
                      width={48}
                      height={12}
                      rx={6}
                      fill="#e5b54f"
                      stroke="#080c14"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={cy - radius - (isAmphi ? 8 : 13)}
                      textAnchor="middle"
                      fill="#0d0d16"
                      fontSize="6.8"
                      fontWeight="900"
                      fontFamily="var(--font-brand), system-ui, sans-serif"
                      letterSpacing="0.4"
                    >
                      TU MESA
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Estado vacío si no hay mesas */}
      {venueTables.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(10, 11, 16, 0.9)',
          border: '1px solid rgba(229, 181, 79, 0.35)',
          borderRadius: '14px',
          padding: '16px 24px',
          textAlign: 'center',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          maxWidth: '300px',
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Plano en Configuración
          </span>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0', lineHeight: 1.4 }}>
            Este establecimiento aún no ha publicado la distribución de sus mesas.
          </p>
        </div>
      )}
    </div>
  );
};

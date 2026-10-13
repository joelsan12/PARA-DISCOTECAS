import React from 'react';
import type { ClubLayoutType, ClubTable } from '../../../types';
import { FloorPlanBackdrops } from './FloorPlanBackdrops';
import { Grid, Crosshair, Compass } from 'lucide-react';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
  layoutType: ClubLayoutType;
  clubTables: ClubTable[];
  selectedTableId: string | null;
  draggedTableId: string | null;
  draggedTable: ClubTable | null;
  dragCoords: { x: number; y: number } | null;
  hoveredTableId: string | null;
  isDragging: boolean;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  setHoveredTableId: (id: string | null) => void;
  handlePointerDown: (table: ClubTable, e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export const FloorPlanCanvas: React.FC<Props> = ({
  svgRef,
  layoutType,
  clubTables,
  selectedTableId,
  draggedTableId,
  draggedTable,
  dragCoords,
  hoveredTableId,
  isDragging,
  snapToGrid,
  setSnapToGrid,
  setHoveredTableId,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  viewBoxWidth,
  viewBoxHeight,
}) => {
  const isAmphi = layoutType === 'u_amphitheater';
  const viewBoxX = isAmphi ? 45 : 0;
  const viewBoxY = isAmphi ? 0 : 0;
  const effectiveViewBoxWidth = isAmphi ? 510 : viewBoxWidth;
  const effectiveViewBoxHeight = isAmphi ? 545 : viewBoxHeight;
  const baseWidth = isAmphi ? 600 : viewBoxWidth;
  const baseHeight = isAmphi ? 660 : viewBoxHeight;

  const activeDraggedX = isDragging && dragCoords ? dragCoords.x : draggedTable?.x ?? 0;
  const activeDraggedY = isDragging && dragCoords ? dragCoords.y : draggedTable?.y ?? 0;

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

      {/* Header Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(229, 181, 79, 0.12)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={14} color="var(--brand-gold)" />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Plano Operativo de Sala</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {clubTables.length} {clubTables.length === 1 ? 'mesa' : 'mesas'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Haz clic y arrastra cualquier mesa · Guías láser activas en tiempo real
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Active Dragging Real-Time Coordinates Badge */}
          {isDragging && draggedTable && (
            <div style={{
              fontSize: '0.74rem',
              color: '#ffffff',
              background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
              border: '1px solid var(--accent)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'monospace',
              boxShadow: '0 0 16px rgba(229, 181, 79, 0.45)',
              animation: 'pulse 1.5s infinite'
            }}>
              <Crosshair size={13} color="var(--brand-gold)" />
              <span>{draggedTable.table_code}</span>
              <span style={{ color: 'var(--brand-gold)' }}>X: {activeDraggedX}% · Y: {activeDraggedY}%</span>
            </div>
          )}

          {/* Snap to Grid Toggle Button */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              fontSize: '0.74rem',
              borderRadius: '16px',
              cursor: 'pointer',
              background: snapToGrid ? 'rgba(229, 181, 79, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              border: snapToGrid ? '1px solid rgba(229, 181, 79, 0.55)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: snapToGrid ? 'var(--brand-gold)' : 'var(--text-muted)',
              fontWeight: 700,
              boxShadow: snapToGrid ? '0 0 10px rgba(229, 181, 79, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Ajustar mesas a saltos de rejilla limpia (1%) o movimiento milimétrico libre"
          >
            <Grid size={13} color={snapToGrid ? 'var(--brand-gold)' : 'currentColor'} />
            <span>Imán 1%: {snapToGrid ? 'Activado' : 'Libre'}</span>
          </button>
        </div>
      </div>

      {/* Architectural SVG Canvas Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: layoutType === 'downtown_suites' ? '0.62/1' : isAmphi ? '0.94/1' : '1/1',
        maxHeight: '660px',
        margin: '0 auto',
        background: isAmphi ? '#121622' : '#080c14',
        borderRadius: isAmphi ? '24px' : '14px',
        border: '1.5px solid rgba(229, 181, 79, 0.25)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.85), 0 10px 30px rgba(0,0,0,0.5)',
        userSelect: 'none'
      }}>
        {/* Subtle Ambient Blueprint Grid Texture via CSS background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(229, 181, 79, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.6
        }} />

        <svg
          ref={svgRef}
          viewBox={`${viewBoxX} ${viewBoxY} ${effectiveViewBoxWidth} ${effectiveViewBoxHeight}`}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'default',
            touchAction: 'none'
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Architectural Blueprint CAD Grid Pattern */}
            <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1" fill="rgba(229, 181, 79, 0.15)" />
            </pattern>

            {/* Glowing Laser Filters */}
            <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="table-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(0,0,0,0.7)" />
            </filter>
            <filter id="table-active-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(229, 181, 79, 0.6)" />
            </filter>
          </defs>

          {/* Background CAD Grid Layer */}
          <rect x={viewBoxX} y={viewBoxY} width={effectiveViewBoxWidth} height={effectiveViewBoxHeight} fill="url(#cad-grid)" pointerEvents="none" />

          {/* Corner CAD Alignment Markers */}
          <g stroke="rgba(229, 181, 79, 0.35)" strokeWidth="1.5" fill="none" pointerEvents="none">
            {/* Top-Left */}
            <path d={`M ${viewBoxX + 16} ${viewBoxY + 32} L ${viewBoxX + 16} ${viewBoxY + 16} L ${viewBoxX + 32} ${viewBoxY + 16}`} />
            {/* Top-Right */}
            <path d={`M ${viewBoxX + effectiveViewBoxWidth - 32} ${viewBoxY + 16} L ${viewBoxX + effectiveViewBoxWidth - 16} ${viewBoxY + 16} L ${viewBoxX + effectiveViewBoxWidth - 16} ${viewBoxY + 32}`} />
            {/* Bottom-Left */}
            <path d={`M ${viewBoxX + 16} ${viewBoxY + effectiveViewBoxHeight - 32} L ${viewBoxX + 16} ${viewBoxY + effectiveViewBoxHeight - 16} L ${viewBoxX + 32} ${viewBoxY + effectiveViewBoxHeight - 16}`} />
            {/* Bottom-Right */}
            <path d={`M ${viewBoxX + effectiveViewBoxWidth - 32} ${viewBoxY + effectiveViewBoxHeight - 16} L ${viewBoxX + effectiveViewBoxWidth - 16} ${viewBoxY + effectiveViewBoxHeight - 16} L ${viewBoxX + effectiveViewBoxWidth - 16} ${viewBoxY + effectiveViewBoxHeight - 32}`} />
          </g>

          {/* Layout-Specific Architectural Backdrop (Amphitheater / Horseshoe / Suites) */}
          <FloorPlanBackdrops layoutType={layoutType} />

          {/* Laser Alignment Crosshairs when Dragging */}
          {isDragging && draggedTable && (() => {
            const cx = (activeDraggedX / 100) * baseWidth;
            const cy = (activeDraggedY / 100) * baseHeight;
            return (
              <g pointerEvents="none" filter="url(#laser-glow)">
                {/* Full Horizontal & Vertical Laser Lines */}
                <line
                  x1={viewBoxX}
                  y1={cy}
                  x2={viewBoxX + effectiveViewBoxWidth}
                  y2={cy}
                  stroke="var(--brand-gold)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <line
                  x1={cx}
                  y1={viewBoxY}
                  x2={cx}
                  y2={viewBoxY + effectiveViewBoxHeight}
                  stroke="var(--brand-gold)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />

                {/* Laser Targeting Radar Circles */}
                <circle cx={cx} cy={cy} r="32" fill="none" stroke="var(--brand-gold)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                <circle cx={cx} cy={cy} r="52" fill="none" stroke="var(--brand-gold)" strokeWidth="0.8" strokeDasharray="5 5" opacity="0.4" />

                {/* Floating HUD Coordinate Badge Directly Above Dragged Table */}
                <g transform={`translate(${cx}, ${Math.max(34, cy - 44)})`}>
                  <rect
                    x="-55"
                    y="-14"
                    width="110"
                    height="22"
                    rx="11"
                    fill="rgba(8, 12, 20, 0.95)"
                    stroke="var(--brand-gold)"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="1"
                    fill="var(--brand-gold)"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    X:{activeDraggedX}% · Y:{activeDraggedY}%
                  </text>
                </g>
              </g>
            );
          })()}

          {/* RENDER DRAGGABLE TABLES */}
          {clubTables.map(table => {
            const isSelected = selectedTableId === table.id;
            const isBeingDragged = draggedTableId === table.id;
            const isHovered = hoveredTableId === table.id;

            // Use live drag coordinates when this specific table is being dragged!
            const currentX = isBeingDragged && isDragging ? activeDraggedX : table.x;
            const currentY = isBeingDragged && isDragging ? activeDraggedY : table.y;

            const cx = (currentX / 100) * baseWidth;
            const cy = (currentY / 100) * baseHeight;
            const radius = isAmphi ? 25 : 24;
            const tokenColor = table.tier_color || '#eab308';
            const rot = table.rotation || 0;
            const capacity = Math.max(1, table.capacity || 4);
            const displayText = table.badge_number || table.table_code;

            return (
              <g
                key={table.id}
                onPointerDown={(e) => handlePointerDown(table, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onMouseEnter={() => setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
                style={{
                  cursor: isBeingDragged ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              >
                <g
                  transform={`rotate(${rot}, ${cx}, ${cy})`}
                  style={{
                    filter: isBeingDragged
                      ? 'url(#table-active-shadow)'
                      : isSelected
                      ? 'drop-shadow(0 0 10px rgba(229, 181, 79, 0.75))'
                      : isHovered
                      ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45))'
                      : 'url(#table-drop-shadow)',
                    transition: isBeingDragged ? 'none' : 'filter 0.15s ease'
                  }}
                >
                  {/* VIP Seating Dots Surrounding Table Perimeter */}
                  {table.shape === 'circle' && (() => {
                    const seatCount = Math.min(12, capacity);
                    const seatOrbit = radius + (isAmphi ? 7.5 : 9);
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
                          r={isAmphi ? 3.0 : 3.2}
                          fill={isSelected || isBeingDragged ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.4)'}
                          stroke="#080c14"
                          strokeWidth="0.8"
                          opacity={isSelected || isBeingDragged ? 0.95 : 0.65}
                        />
                      );
                    }
                    return <g pointerEvents="none">{seats}</g>;
                  })()}

                  {/* Active Selection / Drag Glowing Ring */}
                  {(isSelected || isBeingDragged) && (
                    table.shape === 'pill' ? (
                      <rect
                        x={isAmphi ? cx - 24 : cx - 44}
                        y={isAmphi ? cy - 34 : cy - 28}
                        width={isAmphi ? 48 : 88}
                        height={isAmphi ? 68 : 56}
                        rx={isAmphi ? 24 : 22}
                        fill="none"
                        stroke="var(--brand-gold)"
                        strokeWidth="2.5"
                        strokeDasharray={isBeingDragged ? '4 4' : 'none'}
                        opacity={1}
                      />
                    ) : (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + (isAmphi ? 8 : 10)}
                        fill="none"
                        stroke="var(--brand-gold)"
                        strokeWidth="2.5"
                        strokeDasharray={isBeingDragged ? '4 4' : 'none'}
                        opacity={1}
                      />
                    )
                  )}

                  {/* Table Token Shape Surface */}
                  {table.shape === 'pill' ? (
                    <g>
                      <rect
                        x={isAmphi ? cx - 19 : cx - 36}
                        y={isAmphi ? cy - 29 : cy - 20}
                        width={isAmphi ? 38 : 72}
                        height={isAmphi ? 58 : 40}
                        rx={isAmphi ? 19 : 16}
                        fill={tokenColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected || isBeingDragged ? 2.5 : 1.5}
                      />
                      {/* Subtle Inner Highlight Glass Sheen */}
                      <rect
                        x={isAmphi ? cx - 14 : cx - 32}
                        y={isAmphi ? cy - 25 : cy - 17}
                        width={isAmphi ? 28 : 64}
                        height={isAmphi ? 11 : 8}
                        rx={5}
                        fill="rgba(255, 255, 255, 0.35)"
                        pointerEvents="none"
                      />
                    </g>
                  ) : table.shape === 'square' || table.shape === 'rect' ? (
                    <g>
                      <rect
                        x={cx - (isAmphi ? 22 : 22)}
                        y={cy - (isAmphi ? 22 : 22)}
                        width={isAmphi ? 44 : 44}
                        height={isAmphi ? 44 : 44}
                        rx={isAmphi ? 9 : 7}
                        fill={tokenColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected || isBeingDragged ? 2.5 : 1.5}
                      />
                      {/* Glass Sheen */}
                      <rect
                        x={cx - (isAmphi ? 18 : 18)}
                        y={cy - (isAmphi ? 18 : 18)}
                        width={isAmphi ? 36 : 36}
                        height="9"
                        rx="4"
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
                        fill={tokenColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected || isBeingDragged ? 2.5 : 1.5}
                      />
                      {/* Radial Glass Sheen */}
                      <ellipse
                        cx={cx}
                        cy={cy - (isAmphi ? 7 : radius * 0.35)}
                        rx={radius * 0.65}
                        ry={radius * 0.3}
                        fill="rgba(255, 255, 255, 0.4)"
                        pointerEvents="none"
                      />
                    </g>
                  )}

                  {/* Centered Table Code Badge */}
                  <text
                    x={cx}
                    y={cy + 0.5}
                    fill="#08080c"
                    fontSize={displayText.length > 2 ? (isAmphi ? '11.5' : '10.5') : (isAmphi ? '13.5' : '12')}
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontFamily: 'var(--font-brand), system-ui, -apple-system, sans-serif',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {displayText}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Empty Floor Plan Notice */}
          {clubTables.length === 0 && (
            <g pointerEvents="none">
              <rect
                x={viewBoxX + effectiveViewBoxWidth * 0.18}
                y={viewBoxY + effectiveViewBoxHeight * 0.41}
                width={effectiveViewBoxWidth * 0.64}
                height={effectiveViewBoxHeight * 0.18}
                rx="14"
                fill="rgba(10, 11, 16, 0.94)"
                stroke="rgba(229, 181, 79, 0.35)"
                strokeWidth="1.5"
              />
              <text
                x={viewBoxX + effectiveViewBoxWidth / 2}
                y={viewBoxY + effectiveViewBoxHeight * 0.48}
                fill="#ffffff"
                fontSize="14"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-brand)', letterSpacing: '0.04em' }}
              >
                DISTRIBUCIÓN DE SALA · SIN MESAS REGISTRADAS
              </text>
              <text
                x={viewBoxX + effectiveViewBoxWidth / 2}
                y={viewBoxY + effectiveViewBoxHeight * 0.54}
                fill="#94a3b8"
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                Haz clic en "+ Nueva Mesa" o elige una plantilla arquitectónica
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};


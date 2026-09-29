import React from 'react';
import type { ClubLayoutType, ClubTable } from '../../../types';
import { FloorPlanBackdrops } from './FloorPlanBackdrops';
import { Move, Grid, Crosshair } from 'lucide-react';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
  layoutType: ClubLayoutType;
  clubTables: ClubTable[];
  selectedTableId: string | null;
  draggedTableId: string | null;
  draggedTable: ClubTable | null;
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
  return (
    <div className="glass-card" style={{
      padding: '20px',
      background: '#070a0f',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 'var(--radius-md)',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Move size={14} color="#00f0ff" />
          Haz clic y <strong>arrastra cualquier mesa</strong> para reposicionarla con guías láser
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Snap to Grid Toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              fontSize: '0.73rem',
              borderRadius: '12px',
              cursor: 'pointer',
              background: snapToGrid ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)',
              border: snapToGrid ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
              color: snapToGrid ? '#00f0ff' : 'var(--text-muted)',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            title="Ajusta mesas a coordenadas de rejilla limpia"
          >
            <Grid size={12} />
            <span>Ajuste 1%: {snapToGrid ? 'Activado' : 'Libre'}</span>
          </button>

          {/* Active Dragging HUD Badge */}
          {isDragging && draggedTable && (
            <span style={{
              fontSize: '0.73rem',
              color: '#00f0ff',
              background: 'rgba(0, 240, 255, 0.18)',
              border: '1px solid #00f0ff',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'monospace',
              boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)'
            }}>
              <Crosshair size={12} className="animate-spin" />
              {draggedTable.table_code} · X:{draggedTable.x}% Y:{draggedTable.y}%
            </span>
          )}
        </div>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: layoutType === 'downtown_suites' ? '0.62/1' : layoutType === 'u_amphitheater' ? '0.77/1' : '1/1',
        maxHeight: '620px',
        margin: '0 auto',
        background: layoutType === 'u_amphitheater' ? '#212734' : '#080c13',
        borderRadius: layoutType === 'u_amphitheater' ? '32px' : '12px',
        border: '2px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.8)',
        userSelect: 'none'
      }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          style={{
            width: '100%',
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'default',
            touchAction: 'none'
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Layout Specific Architectural Backdrop */}
          <FloorPlanBackdrops layoutType={layoutType} />

          {/* Laser Alignment Crosshairs when Dragging */}
          {isDragging && draggedTable && (() => {
            const cx = (draggedTable.x / 100) * viewBoxWidth;
            const cy = (draggedTable.y / 100) * viewBoxHeight;
            return (
              <g pointerEvents="none" opacity="0.9">
                <line x1="0" y1={cy} x2={viewBoxWidth} y2={cy} stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="4 4" />
                <line x1={cx} y1="0" x2={cx} y2={viewBoxHeight} stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="4 4" />
                <circle cx={cx} cy={cy} r="28" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                <circle cx={cx} cy={cy} r="46" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.35" />
              </g>
            );
          })()}

          {/* RENDER DRAGGABLE TABLES */}
          {clubTables.map(table => {
            const isSelected = selectedTableId === table.id;
            const isBeingDragged = draggedTableId === table.id;
            const isHovered = hoveredTableId === table.id;

            const cx = (table.x / 100) * viewBoxWidth;
            const cy = (table.y / 100) * viewBoxHeight;
            const isAmphi = layoutType === 'u_amphitheater';
            const radius = isAmphi ? 13 : 24;
            const tokenColor = table.tier_color || '#eab308';
            const rot = table.rotation || 0;

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
                      ? 'drop-shadow(0 0 14px rgba(0, 240, 255, 0.9))'
                      : isSelected
                      ? 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))'
                      : isHovered
                      ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.35))'
                      : 'none',
                    transition: isBeingDragged ? 'none' : 'filter 0.15s ease'
                  }}
                >
                  {/* Selection / Drag Active Ring */}
                  {(isSelected || isBeingDragged) && (
                    table.shape === 'pill' ? (
                      <rect
                        x={isAmphi ? cx - 16 : cx - 42}
                        y={isAmphi ? cy - 25 : cy - 26}
                        width={isAmphi ? 32 : 84}
                        height={isAmphi ? 50 : 52}
                        rx={isAmphi ? 16 : 20}
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="3"
                        strokeDasharray={isBeingDragged ? '4 4' : 'none'}
                        opacity={1}
                      />
                    ) : (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + (isAmphi ? 5 : 8)}
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="3"
                        strokeDasharray={isBeingDragged ? '4 4' : 'none'}
                        opacity={1}
                      />
                    )
                  )}

                  {/* Table Token Shape */}
                  {table.shape === 'pill' ? (
                    <rect
                      x={isAmphi ? cx - 12 : cx - 36}
                      y={isAmphi ? cy - 21 : cy - 20}
                      width={isAmphi ? 24 : 72}
                      height={isAmphi ? 42 : 40}
                      rx={isAmphi ? 12 : 16}
                      fill={tokenColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected || isBeingDragged ? 3 : 1.5}
                    />
                  ) : table.shape === 'square' || table.shape === 'rect' ? (
                    <rect
                      x={cx - 20}
                      y={cy - 20}
                      width="40"
                      height="40"
                      rx="6"
                      fill={tokenColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected || isBeingDragged ? 3 : 1.5}
                    />
                  ) : (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={tokenColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected || isBeingDragged ? 3 : 1.5}
                    />
                  )}

                  {/* Number / Code in center */}
                  <text
                    x={cx}
                    y={cy}
                    fill="#000000"
                    fontSize={isAmphi ? '10' : '12'}
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {table.badge_number || table.table_code}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

import { useState } from 'react';
import type { ClubTable, EventTablePricing, ClubLayoutType } from '../../types';
import { useClubStore } from '../../store/clubStore';

interface Props {
  tables: ClubTable[];
  eventPricings: EventTablePricing[];
  selectedTableId: string | null;
  onSelectTable: (table: ClubTable) => void;
}

export const InteractiveFloorPlan = ({
  eventPricings,
  selectedTableId,
  onSelectTable
}: Props) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const layoutType: ClubLayoutType = activeClub.layout_type || 'horseshoe_vip';

  const venueTables = store.tables.filter(t => t.club_id === activeClub.id);
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];
  const venuePricings = store.eventPricing.filter(p => p.event_id === activeEvent?.id);

  const [, setHoveredTableId] = useState<string | null>(null);

  const getTableStatus = (tableId: string) => {
    const pricing = venuePricings.find(p => p.table_id === tableId) || eventPricings.find(p => p.table_id === tableId);
    return pricing?.status || 'AVAILABLE';
  };

  // Metadatos y referencias espaciales según el arquetipo del establecimiento
  const config = {
    horseshoe_vip: {
      title: 'Herradura VIP • Plano Cenital',
      danceFloorTitle: 'PISTA CENTRAL',
      danceFloorSubtitle: 'PISTA PRINCIPAL',
      stageLabel: 'CABINA DJ',
      entranceLabel: '▼ ACCESO PRINCIPAL',
      stageStyle: { top: '84%', left: '50%' },
      danceFloorStyle: { top: '42.5%', left: '50%', width: '44%', height: '24%' },
    },
    u_amphitheater: {
      title: 'Anfiteatro Curvo • Plano Cenital',
      danceFloorTitle: 'PISTA ARENA',
      danceFloorSubtitle: 'PISO DE CONCIERTOS Y ESPECTÁCULOS',
      stageLabel: 'ESCENARIO & DJ',
      entranceLabel: '▼ ACCESO PRINCIPAL',
      stageStyle: { top: '84%', left: '50%' },
      danceFloorStyle: { top: '48%', left: '50%', width: '42%', height: '22%' },
    },
    downtown_suites: {
      title: 'Suites Urbanas • Plano Cenital',
      danceFloorTitle: 'AZOTEA',
      danceFloorSubtitle: 'VISTA PANORÁMICA',
      stageLabel: 'BARRA DJ DE LA AZOTEA',
      entranceLabel: '▼ ASCENSORES VIP & ACCESO',
      stageStyle: { top: '84%', left: '50%' },
      danceFloorStyle: { top: '38%', left: '32%', width: '36%', height: '18%' },
    },
    custom_open: {
      title: 'Planta Libre • Plano Cenital',
      danceFloorTitle: 'PISTA PRINCIPAL',
      danceFloorSubtitle: 'PLANTA ABIERTA',
      stageLabel: 'CABINA DJ',
      entranceLabel: '▼ ACCESO PRINCIPAL',
      stageStyle: { top: '84%', left: '50%' },
      danceFloorStyle: { top: '45%', left: '50%', width: '44%', height: '24%' },
    },
  }[layoutType] || {
    title: 'Plano Arquitectónico Cenital',
    danceFloorTitle: 'PISTA CENTRAL',
    danceFloorSubtitle: 'PISTA PRINCIPAL',
    stageLabel: 'CABINA DJ',
    entranceLabel: '▼ ACCESO PRINCIPAL',
    stageStyle: { top: '84%', left: '50%' },
    danceFloorStyle: { top: '42.5%', left: '50%', width: '44%', height: '24%' },
  };

  return (
    <div className="floorplan-canvas">
      {/* ── 1. Capa de líneas arquitectónicas ── */}
      <div className="floorplan-grid-v" />
      <div className="floorplan-grid-h" />

      {/* Watermark de Zona / Arquetipo */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.52rem',
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: 'rgba(229, 181, 79, 0.35)',
        fontWeight: 800,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 2,
        fontFamily: 'var(--font-brand)',
      }}>
        {config.title}
      </div>

      {/* ── 2. Capa de zonas de referencia centrales ── */}
      {/* Pista Central (Dance Floor) adaptada al arquetipo */}
      <div className="floorplan-dancefloor" style={config.danceFloorStyle}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '0.75rem',
          border: '1px dashed rgba(229, 181, 79, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          background: 'radial-gradient(ellipse at center, rgba(229, 181, 79, 0.08) 0%, transparent 80%)',
        }}>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'var(--font-brand)',
          }}>
            {config.danceFloorTitle}
          </span>
          <span style={{
            fontSize: '0.48rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand-gold)',
            fontWeight: 600,
            marginTop: '3px',
            opacity: 0.85,
          }}>
            {config.danceFloorSubtitle}
          </span>
        </div>
      </div>

      {/* Cabina DJ / Escenario */}
      <div className="floorplan-djbooth" style={config.stageStyle}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#e5b54f',
          boxShadow: '0 0 8px #e5b54f',
          display: 'inline-block',
        }} />
        <span>{config.stageLabel}</span>
      </div>

      {/* Indicador de Entrada */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.52rem',
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: 700,
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        {config.entranceLabel}
      </div>

      {/* ── 3. Capa de nodos / mesas interactivas (HTML Buttons) ── */}
      {venueTables.map(table => {
        const status = getTableStatus(table.id);
        const isSelected = selectedTableId === table.id;
        const isOccupied = status === 'CONFIRMED' || status === 'CHECKED_IN';
        const isHeld = status === 'HELD';
        const isAvailable = status === 'AVAILABLE';

        const badgeText = table.badge_number || table.table_code.replace(/^VIP-/, '').replace(/^[A-Z]+-/, '');
        const displayText = badgeText.length > 3 ? badgeText.slice(0, 3) : badgeText;

        const buttonClass = isSelected
          ? 'table-node-btn selected'
          : isOccupied || isHeld
          ? 'table-node-btn occupied'
          : 'table-node-btn available';

        return (
          <button
            key={table.id}
            type="button"
            className={buttonClass}
            onClick={() => {
              if (isAvailable) onSelectTable(table);
            }}
            disabled={!isAvailable}
            aria-label={`Mesa ${table.table_code} (${displayText})`}
            onMouseEnter={() => isAvailable && setHoveredTableId(table.id)}
            onMouseLeave={() => setHoveredTableId(null)}
            style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
            }}
          >
            <span>{displayText}</span>
          </button>
        );
      })}
    </div>
  );
};

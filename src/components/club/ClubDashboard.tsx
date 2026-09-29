import { useClubStore } from '../../store/clubStore';
import { InteractiveFloorPlan } from '../client/InteractiveFloorPlan';
import { FloorPlanEditor } from './FloorPlanEditor';
import { ClubMetricsHeader } from './dashboard/ClubMetricsHeader';
import { OperatingTablesList } from './dashboard/OperatingTablesList';
import { ReservationsTable } from './dashboard/ReservationsTable';
import { PricingManager } from './dashboard/PricingManager';
import { AuditLogsView } from './dashboard/AuditLogsView';

export const ClubDashboard = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];

  const activeTab = (store.dashboardTab as 'MONITOR' | 'LAYOUT_BUILDER' | 'RESERVATIONS' | 'PRICING' | 'AUDIT') || 'MONITOR';
  const setActiveTab = (tab: 'MONITOR' | 'LAYOUT_BUILDER' | 'RESERVATIONS' | 'PRICING' | 'AUDIT') => {
    store.setDashboardTab(tab);
  };

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const eventPricings = store.eventPricing.filter(p => p.event_id === activeEvent?.id);
  const eventReservations = store.reservations.filter(r => r.club_id === activeClub.id && r.event_id === activeEvent?.id);

  const totalTables = clubTables.length;
  const availableCount = eventPricings.filter(p => p.status === 'AVAILABLE').length;
  const heldCount = eventPricings.filter(p => p.status === 'HELD').length;
  const confirmedCount = eventPricings.filter(p => p.status === 'CONFIRMED').length;
  const checkedInCount = eventPricings.filter(p => p.status === 'CHECKED_IN').length;
  const totalDeposits = eventReservations.reduce((acc, curr) => acc + curr.deposit_amount, 0);

  const handleUpdatePricing = (tableId: string, minSpend: number, deposit: number) => {
    if (activeEvent) {
      store.updateEventTablePricing(activeEvent.id, tableId, minSpend, deposit);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Top Bar & 4 Executive KPI Cards */}
      <ClubMetricsHeader
        activeClub={activeClub}
        clubEvents={clubEvents}
        activeEventId={store.activeEventId}
        onSelectEvent={id => store.setActiveEvent(id)}
        availableCount={availableCount}
        totalTables={totalTables}
        heldCount={heldCount}
        confirmedCount={confirmedCount}
        checkedInCount={checkedInCount}
        totalDeposits={totalDeposits}
      />

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {([
          { key: 'MONITOR', label: 'Panel de sala en vivo' },
          { key: 'LAYOUT_BUILDER', label: 'Diseñador de Plano & Mesas 📐' },
          { key: 'RESERVATIONS', label: `Reservas Activas (${eventReservations.length})` },
          { key: 'PRICING', label: 'Tarifario & Anticipos' },
          { key: 'AUDIT', label: 'Bitácora de Auditoría' }
        ] as const).map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: isActive ? 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#040d1a' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: isActive ? 'transparent' : 'rgba(255, 255, 255, 0.07)',
                boxShadow: isActive ? '0 0 16px rgba(0, 240, 255, 0.35)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: MONITOR */}
      {activeTab === 'MONITOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
          <InteractiveFloorPlan
            tables={clubTables}
            eventPricings={eventPricings}
            selectedTableId={null}
            onSelectTable={() => {}}
          />
          <OperatingTablesList tables={clubTables} eventPricings={eventPricings} />
        </div>
      )}

      {/* Tab: LAYOUT_BUILDER */}
      {activeTab === 'LAYOUT_BUILDER' && (
        <FloorPlanEditor />
      )}

      {/* Tab: RESERVATIONS */}
      {activeTab === 'RESERVATIONS' && (
        <ReservationsTable
          reservations={eventReservations}
        />
      )}

      {/* Tab: PRICING */}
      {activeTab === 'PRICING' && (
        <PricingManager
          clubTables={clubTables}
          eventPricings={eventPricings}
          activeEvent={activeEvent}
          onUpdatePricing={handleUpdatePricing}
        />
      )}

      {/* Tab: AUDIT */}
      {activeTab === 'AUDIT' && (
        <AuditLogsView auditLogs={store.auditLogs} />
      )}
    </div>
  );
};

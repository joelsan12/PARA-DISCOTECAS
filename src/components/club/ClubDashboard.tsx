import { useEffect, useState } from 'react';
import { useClubStore } from '../../store/clubStore';
import { InteractiveFloorPlan } from '../client/InteractiveFloorPlan';
import { FloorPlanEditor } from './FloorPlanEditor';
import { ClubMetricsHeader } from './dashboard/ClubMetricsHeader';
import { OperatingTablesList } from './dashboard/OperatingTablesList';
import { ReservationsTable } from './dashboard/ReservationsTable';
import { PricingManager } from './dashboard/PricingManager';
import { AuditLogsView } from './dashboard/AuditLogsView';
import { LegalProfileForm } from './dashboard/LegalProfileForm';
import { PaymentGatewayManager } from './dashboard/PaymentGatewayManager';
import { ClubPlanAndProposalsView } from './dashboard/ClubPlanAndProposalsView';
import { ClubFloorPlanEmptyState } from './dashboard/ClubFloorPlanEmptyState';
import { CustomFloorPlanRequestModal } from './floorplan/CustomFloorPlanRequestModal';
import { isDashboardTabAllowed } from '../../lib/clubPermissions';
import type { DashboardTabKey } from './AdminSidebar';

export const ClubDashboard = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const activePlan = store.plans.find(p => p.id === activeClub?.plan_id);
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];

  const activeTab = (store.dashboardTab as DashboardTabKey) || 'MONITOR';
  const [isCustomPlanModalOpen, setIsCustomPlanModalOpen] = useState(false);

  // Si la pestaña actual no está permitida por el plan del club, regresar a MONITOR
  useEffect(() => {
    if (!isDashboardTabAllowed(activeTab, activeClub, activePlan)) {
      store.setDashboardTab('MONITOR');
    }
  }, [activeTab, activeClub, activePlan, store]);

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const clubTableIds = new Set(clubTables.map(t => t.id));
  const eventPricings = store.eventPricing.filter(
    p => p.event_id === activeEvent?.id && clubTableIds.has(p.table_id)
  );
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
    <div style={{ width: '100%' }}>
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

      {/* La navegación vive exclusivamente en el AdminSidebar (una sola fuente) */}

      {/* Tab: MONITOR */}
      {activeTab === 'MONITOR' && (
        clubTables.length === 0 ? (
          <ClubFloorPlanEmptyState
            clubName={activeClub.name}
            onGoToDesigner={() => store.setDashboardTab('LAYOUT_BUILDER')}
            onRequestCustomPlan={() => setIsCustomPlanModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
            <InteractiveFloorPlan
              tables={clubTables}
              eventPricings={eventPricings}
              selectedTableId={null}
              onSelectTable={() => {}}
            />
            <OperatingTablesList tables={clubTables} eventPricings={eventPricings} />
          </div>
        )
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
          onGoToDesigner={() => store.setDashboardTab('LAYOUT_BUILDER')}
        />
      )}

      {/* Tab: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <PaymentGatewayManager key={activeClub.id} activeClub={activeClub} />
      )}

      {/* Tab: LEGAL */}
      {activeTab === 'LEGAL' && (
        <LegalProfileForm key={activeClub.id} activeClub={activeClub} />
      )}

      {/* Tab: AUDIT */}
      {activeTab === 'AUDIT' && (
        <AuditLogsView auditLogs={store.auditLogs} />
      )}

      {/* Tab: SUBSCRIPTION */}
      {activeTab === 'SUBSCRIPTION' && (
        <ClubPlanAndProposalsView activeClub={activeClub} />
      )}

      {/* Modal para solicitar digitalización de croquis */}
      <CustomFloorPlanRequestModal
        isOpen={isCustomPlanModalOpen}
        onClose={() => setIsCustomPlanModalOpen(false)}
        clubName={activeClub.name}
        clubCity={activeClub.city}
      />
    </div>
  );
};

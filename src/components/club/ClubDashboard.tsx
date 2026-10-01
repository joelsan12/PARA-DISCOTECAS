import { useClubStore } from '../../store/clubStore';
import { MonitorPlay, Sliders, Ticket, Coins, CreditCard, Building2, ShieldCheck } from 'lucide-react';
import { InteractiveFloorPlan } from '../client/InteractiveFloorPlan';
import { FloorPlanEditor } from './FloorPlanEditor';
import { ClubMetricsHeader } from './dashboard/ClubMetricsHeader';
import { OperatingTablesList } from './dashboard/OperatingTablesList';
import { ReservationsTable } from './dashboard/ReservationsTable';
import { PricingManager } from './dashboard/PricingManager';
import { AuditLogsView } from './dashboard/AuditLogsView';
import { LegalProfileForm } from './dashboard/LegalProfileForm';
import { PaymentGatewayManager } from './dashboard/PaymentGatewayManager';

export const ClubDashboard = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];

  const activeTab = (store.dashboardTab as 'MONITOR' | 'LAYOUT_BUILDER' | 'RESERVATIONS' | 'PRICING' | 'PAYMENTS' | 'LEGAL' | 'AUDIT') || 'MONITOR';
  const setActiveTab = (tab: 'MONITOR' | 'LAYOUT_BUILDER' | 'RESERVATIONS' | 'PRICING' | 'PAYMENTS' | 'LEGAL' | 'AUDIT') => {
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

      {/* Luxury Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(229, 181, 79, 0.18)',
        paddingBottom: '14px',
        overflowX: 'auto',
        alignItems: 'center'
      }}>
        {([
          { key: 'MONITOR', label: 'Sala en Vivo', icon: MonitorPlay },
          { key: 'LAYOUT_BUILDER', label: 'Diseñador de Plano & Mesas', icon: Sliders },
          { key: 'RESERVATIONS', label: `Reservas Activas (${eventReservations.length})`, icon: Ticket },
          { key: 'PRICING', label: 'Tarifario & Anticipos', icon: Coins },
          { key: 'PAYMENTS', label: 'Pasarela & Cobros (Kushki)', icon: CreditCard },
          { key: 'LEGAL', label: 'Identidad Legal & SRI', icon: Building2 },
          { key: 'AUDIT', label: 'Bitácora de Auditoría', icon: ShieldCheck }
        ] as const).map(tab => {
          const isActive = activeTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                background: isActive
                  ? 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 55%, #cfa038 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#08080c' : 'rgba(255, 255, 255, 0.7)',
                border: '1px solid',
                borderColor: isActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(229, 181, 79, 0.12)',
                boxShadow: isActive ? '0 0 20px rgba(229, 181, 79, 0.4)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(229, 181, 79, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.3)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.12)';
                }
              }}
            >
              <TabIcon size={15} color={isActive ? '#08080c' : 'var(--brand-gold)'} />
              <span>{tab.label}</span>
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
    </div>
  );
};

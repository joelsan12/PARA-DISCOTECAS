import { useEffect, useState } from 'react';
import { Building } from 'lucide-react';
import { useClubStore } from '../../store/clubStore';
import { FloorPlanEditor } from './FloorPlanEditor';
import { ClubMetricsHeader } from './dashboard/ClubMetricsHeader';
import { ReservationsTable } from './dashboard/ReservationsTable';
import { PricingManager } from './dashboard/PricingManager';
import { AuditLogsView } from './dashboard/AuditLogsView';
import { LegalProfileForm } from './dashboard/LegalProfileForm';
import { PaymentGatewayManager } from './dashboard/PaymentGatewayManager';
import { PaymentTransactionsManager } from './dashboard/PaymentTransactionsManager';
import { StaffManager } from './dashboard/StaffManager';
import { ConsumptionCatalogManager } from './dashboard/ConsumptionCatalogManager';
import { ClubPlanAndProposalsView } from './dashboard/ClubPlanAndProposalsView';
import { ClubFloorPlanEmptyState } from './dashboard/ClubFloorPlanEmptyState';
import { EventsManager } from './dashboard/EventsManager';
import { FloorOpsView } from './dashboard/FloorOpsView';
import { CustomFloorPlanRequestModal } from './floorplan/CustomFloorPlanRequestModal';
import { isDashboardTabAllowed, normalizeCanonicalPlanId } from '../../lib/clubPermissions';
import { subscribeOperations, type OperationalTableItem } from '../../services/operationsService';
import type { DashboardTabKey } from './AdminSidebar';
import type { AdminStaffSession } from '../../lib/adminAuth';
import type { ClubTable, EventTablePricing, Reservation, TableReservationStatus, TableZone } from '../../types';

interface ClubDashboardProps {
  session?: AdminStaffSession;
}

export const ClubDashboard = ({ session }: ClubDashboardProps = {}) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const activePlan = store.plans.find(p => p.id === activeClub?.plan_id)
    || store.plans.find(p => normalizeCanonicalPlanId(p.id) === normalizeCanonicalPlanId(activeClub?.plan_id));
  const clubEvents = store.events.filter(e => e.club_id === activeClub?.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];

  const activeTab = (store.dashboardTab as DashboardTabKey) || 'MONITOR';
  const [isCustomPlanModalOpen, setIsCustomPlanModalOpen] = useState(false);

  // Suscripción reactiva multiusuario a operaciones (resources + reservations + door sessions)
  const [operationalTables, setOperationalTables] = useState<OperationalTableItem[] | null>(null);
  const [liveReservations, setLiveReservations] = useState<Reservation[] | null>(null);

  useEffect(() => {
    if (!activeClub?.id) return;
    const unsub = subscribeOperations({
      businessId: activeClub.id,
      eventId: activeEvent?.id,
      onUpdate: (tables, reservations) => {
        setOperationalTables(tables);
        if (reservations) {
          setLiveReservations(reservations);
        }
      },
      onError: (err) => {
        console.warn('[ClubDashboard] Error sincronizando operaciones en vivo:', err);
      }
    });
    return () => unsub();
  }, [activeClub?.id, activeEvent?.id]);

  // Si la pestaña actual no está permitida por el plan del club, regresar a MONITOR
  useEffect(() => {
    if (!isDashboardTabAllowed(activeTab, activeClub, activePlan)) {
      store.setDashboardTab('MONITOR');
    }
  }, [activeTab, activeClub, activePlan, store]);

  if (!activeClub) {
    return (
      <div style={{
        padding: '4rem 1.5rem',
        maxWidth: '680px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(229, 181, 79, 0.1)',
          border: '1px solid rgba(229, 181, 79, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-gold)',
          marginBottom: '1.5rem'
        }}>
          <Building size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          No hay negocios registrados
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '480px', marginBottom: '1.75rem' }}>
          La base de datos se encuentra completamente limpia y sin negocios activos.
          Puedes registrar un nuevo establecimiento desde la página de onboarding o solicitar acceso a la Beta Privada VIP.
        </p>
        <a
          href="/beta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #e5b54f 0%, #c49632 100%)',
            color: '#0a0a0f',
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(229, 181, 79, 0.3)'
          }}
        >
          Registrar Nuevo Negocio (Beta VIP)
        </a>
      </div>
    );
  }

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const clubTableIds = new Set(clubTables.map(t => t.id));
  const eventPricings = store.eventPricing.filter(
    p => p.event_id === activeEvent?.id && clubTableIds.has(p.table_id)
  );
  const eventReservations = store.reservations.filter(r => r.club_id === activeClub.id && r.event_id === activeEvent?.id);

  // Sintetizar mesas si store.tables aún no se ha poblado visualmente pero existen recursos activos
  const activeOperational = (operationalTables || []).filter(t => t.isActive);
  const effectiveTables: ClubTable[] = clubTables.length > 0
    ? clubTables.map(t => {
        const op = activeOperational.find(o => o.resourceId === t.id);
        return {
          ...t,
          min_spend: t.min_spend ?? (op?.minSpend && op.minSpend > 0 ? op.minSpend : undefined) ?? 0,
          deposit_required: t.deposit_required ?? (op?.depositRequired && op.depositRequired > 0 ? op.depositRequired : undefined) ?? 0
        };
      })
    : activeOperational.map(t => ({
        id: t.resourceId,
        club_id: activeClub.id,
        table_code: t.tableCode,
        zone: t.zone as TableZone,
        capacity: t.capacity,
        x: 0,
        y: 0,
        shape: 'circle' as const,
        is_active: t.isActive,
        min_spend: t.minSpend ?? 0,
        deposit_required: t.depositRequired ?? 0
      }));

  // Combinar tarifas y estados en tiempo real desde Firestore
  const effectiveEventPricings: EventTablePricing[] = effectiveTables.map(t => {
    const localPricing = eventPricings.find(p => p.table_id === t.id);
    const op = activeOperational.find(o => o.resourceId === t.id);
    const resolvedMin = localPricing?.min_spend ?? (t.min_spend && t.min_spend > 0 ? t.min_spend : undefined) ?? op?.minSpend ?? 0;
    const resolvedDeposit = localPricing?.deposit_required ?? (t.deposit_required && t.deposit_required > 0 ? t.deposit_required : undefined) ?? op?.depositRequired ?? 0;

    return {
      table_id: t.id,
      event_id: activeEvent?.id || '',
      status: (op?.state === 'INSIDE' ? 'CHECKED_IN' : (op?.state as TableReservationStatus)) || localPricing?.status || 'AVAILABLE',
      min_spend: resolvedMin,
      deposit_required: resolvedDeposit,
      includes: localPricing?.includes || [`${t.capacity} Pases VIP`],
      active_reservation_id: op?.activeReservationId || localPricing?.active_reservation_id || undefined
    };
  });

  const effectiveReservations = (liveReservations && liveReservations.length > 0)
    ? liveReservations
    : eventReservations;

  const totalTables = effectiveTables.length;
  const availableCount = (activeOperational.length > 0)
    ? activeOperational.filter(t => t.state === 'AVAILABLE').length
    : eventPricings.filter(p => p.status === 'AVAILABLE').length;

  const heldCount = (activeOperational.length > 0)
    ? activeOperational.filter(t => t.state === 'HELD').length
    : eventPricings.filter(p => p.status === 'HELD').length;

  const confirmedCount = (activeOperational.length > 0)
    ? activeOperational.filter(t => t.state === 'CONFIRMED').length
    : eventPricings.filter(p => p.status === 'CONFIRMED').length;

  const checkedInCount = (activeOperational.length > 0)
    ? activeOperational.filter(t => t.state === 'INSIDE').length
    : eventPricings.filter(p => p.status === 'CHECKED_IN').length;

  const totalDeposits = effectiveReservations.reduce((acc, curr) => acc + (curr.deposit_amount || 0), 0);

  const handleUpdatePricing = async (tableId: string, minSpend: number, deposit: number) => {
    // 1. Si no existe en store.tables aún, asegurar que esté registrada
    const existingTable = store.tables.find(t => t.id === tableId);
    if (!existingTable) {
      const eff = effectiveTables.find(t => t.id === tableId);
      if (eff) {
        store.tables.push({ ...eff, min_spend: minSpend, deposit_required: deposit });
      }
    }

    // 2. Si hay evento activo, actualizar tarifa del evento; siempre actualizar mesa base
    if (activeEvent) {
      store.updateEventTablePricing(activeEvent.id, tableId, minSpend, deposit);
    } else {
      store.updateTable(tableId, { min_spend: minSpend, deposit_required: deposit });
    }

    // 3. Optimistic update en la lista operacional en memoria local
    setOperationalTables(prev => {
      if (!prev) return prev;
      return prev.map(t => {
        if (t.resourceId === tableId) {
          return {
            ...t,
            minSpend,
            depositRequired: deposit
          };
        }
        return t;
      });
    });

    // 4. Persistir en Firestore (businesses/{clubId}/layout/main y sincronizar recursos operativos)
    try {
      await store.syncLayoutAsync();
    } catch (err) {
      console.warn('[PricingManager] Advertencia al persistir en Firestore:', err);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Bar & 4 Executive KPI Cards (oculto en diseñador de plano, catálogo de consumo, personal y meseros, finanzas, pasarelas, gobernanza y suscripción) */}
      {!['LAYOUT_BUILDER', 'CONSUMPTION', 'STAFF', 'PAYMENTS', 'TRANSACTIONS', 'SUBSCRIPTION', 'LEGAL', 'AUDIT'].includes(activeTab) && (
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
      )}

      {/* La navegación vive exclusivamente en el AdminSidebar (una sola fuente) */}

      {/* Tab: MONITOR o FLOOR_OPS (Unificado: Sala & Concierge) */}
      {(activeTab === 'MONITOR' || activeTab === 'FLOOR_OPS') && (
        effectiveTables.length === 0 ? (
          <ClubFloorPlanEmptyState
            clubName={activeClub.name}
            onGoToDesigner={() => store.setDashboardTab('LAYOUT_BUILDER')}
            onRequestCustomPlan={() => setIsCustomPlanModalOpen(true)}
          />
        ) : (
          <FloorOpsView
            activeClub={activeClub}
            session={session}
            initialMode={activeTab === 'FLOOR_OPS' ? 'CONCIERGE' : 'MAP'}
          />
        )
      )}

      {/* Tab: LAYOUT_BUILDER */}
      {activeTab === 'LAYOUT_BUILDER' && (
        <FloorPlanEditor />
      )}

      {/* Tab: EVENTS */}
      {activeTab === 'EVENTS' && (
        <EventsManager activeClub={activeClub} />
      )}

      {/* Tab: RESERVATIONS */}
      {activeTab === 'RESERVATIONS' && (
        <ReservationsTable
          reservations={effectiveReservations}
        />
      )}

      {/* Tab: PRICING */}
      {activeTab === 'PRICING' && (
        <PricingManager
          clubTables={effectiveTables}
          eventPricings={effectiveEventPricings}
          activeEvent={activeEvent}
          onUpdatePricing={handleUpdatePricing}
          onGoToDesigner={() => store.setDashboardTab('LAYOUT_BUILDER')}
        />
      )}

      {/* Tab: CONSUMPTION (Catálogo de Consumo en Sala) */}
      {activeTab === 'CONSUMPTION' && (
        <ConsumptionCatalogManager activeClub={activeClub} session={session} />
      )}

      {/* Tab: TRANSACTIONS (Historial de Cobros & Reembolsos) */}
      {activeTab === 'TRANSACTIONS' && (
        <PaymentTransactionsManager key={activeClub.id} activeClub={activeClub} session={session} />
      )}

      {/* Tab: PAYMENTS (Pasarelas de Pago) */}
      {activeTab === 'PAYMENTS' && (
        <PaymentGatewayManager key={activeClub.id} activeClub={activeClub} session={session} />
      )}

      {/* Tab: STAFF */}
      {activeTab === 'STAFF' && session && (
        <StaffManager key={activeClub.id} activeClub={activeClub} session={session} />
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

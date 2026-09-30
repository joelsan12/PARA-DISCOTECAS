import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClubStore } from '../../store/clubStore';
import { formatEcuadorPhone, isValidEcuadorMobile, normalizeEcuadorPhone } from '../../lib/formatEcuador';
import { getClientDeviceId } from '../../lib/ticketPass';
import type { ClubTable, Reservation } from '../../types';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';
import { CheckoutModal } from './CheckoutModal';
import { DigitalPassModal } from './DigitalPassModal';
import { ClientHeader } from './landing/ClientHeader';
import { TableReservationDrawer } from './landing/TableReservationDrawer';

interface ClubLandingProps {
  hideClubSelector?: boolean;
  onBack?: () => void;
  onSignOut?: () => void;
}

export const ClubLanding = ({ hideClubSelector = false, onBack, onSignOut }: ClubLandingProps) => {
  const store = useClubStore();
  const navigate = useNavigate();

  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];
  const conciergePhone = isValidEcuadorMobile(activeClub.whatsapp_number)
    ? formatEcuadorPhone(activeClub.whatsapp_number)
    : '';

  const [selectedTable, setSelectedTable] = useState<ClubTable | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const eventPricings = store.eventPricing.filter(p => p.event_id === activeEvent?.id);

  const selectedPricing = selectedTable
    ? eventPricings.find(p => p.table_id === selectedTable.id) || null
    : null;

  const handleSelectTable = (table: ClubTable) => {
    const status = eventPricings.find(p => p.table_id === table.id)?.status;
    if (status === 'CONFIRMED' || status === 'CHECKED_IN') return;
    setSelectedTable(prev => prev?.id === table.id ? null : table);
  };

  const handleProceedToHold = () => {
    if (!selectedTable) return;
    if (!activeEvent) {
      alert('No hay eventos activos programados en este club.');
      return;
    }
    // Defensa en profundidad: el hold en el servidor exige ID token (§7/§13).
    // Los mounts ya exigen sesión, pero si ClubLanding se monta sin ella el
    // flujo debe redirigir en vez de dejar que el backend rechace la llamada.
    if (!store.clientUser) {
      const slug = activeClub.slug;
      navigate(slug ? `/negocio/${slug}/acceso` : '/', { replace: true });
      return;
    }
    const deviceId = getClientDeviceId();
    const res = store.holdTable(selectedTable.id, activeEvent.id, deviceId);
    if (res.success) {
      setIsCheckoutOpen(true);
    } else {
      alert(res.message);
    }
  };

  const handleReservationSuccess = (res: Reservation) => {
    setIsCheckoutOpen(false);
    setSelectedTable(null);
    setCompletedReservation(res);
  };

  const whatsappUrl = conciergePhone
    ? `https://wa.me/${normalizeEcuadorPhone(conciergePhone).replace(/\D/g, '')}?text=Hola,%20quisiera%20reservar%20una%20mesa%20VIP%20en%20${encodeURIComponent(activeClub.name)}`
    : undefined;

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100dvh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#090A0F',
      overflow: 'hidden',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ════════ TOP HEADER ════════ */}
      <ClientHeader
        activeClub={activeClub}
        clubs={store.clubs}
        activeEvent={activeEvent}
        clientUser={store.clientUser}
        hideClubSwitcher={hideClubSelector}
        onBack={onBack}
        onSignOut={onSignOut}
        onSelectClub={clubId => {
          store.setActiveClub(clubId);
          setSelectedTable(null);
        }}
        onOpenIdentity={() => store.setClientSubTab('IDENTITY')}
      />

      {/* ════════ INTERACTIVE MAP (center) ════════ */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <InteractiveFloorPlan
          tables={clubTables}
          eventPricings={eventPricings}
          selectedTableId={selectedTable?.id || null}
          onSelectTable={handleSelectTable}
        />
      </main>

      {/* ════════ BOTTOM DRAWER ════════ */}
      <TableReservationDrawer
        selectedTable={selectedTable}
        selectedPricing={selectedPricing}
        totalTablesCount={clubTables.length}
        activeEvent={activeEvent}
        whatsappUrl={whatsappUrl}
        onProceedToHold={handleProceedToHold}
      />

      {/* ════════ MODALS ════════ */}
      {selectedTable && isCheckoutOpen && selectedPricing && activeEvent && (
        <CheckoutModal
          table={selectedTable}
          pricing={selectedPricing}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

      {completedReservation && activeEvent && (
        <DigitalPassModal
          reservation={completedReservation}
          club={activeClub}
          event={activeEvent}
          onClose={() => setCompletedReservation(null)}
        />
      )}
    </div>
  );
};

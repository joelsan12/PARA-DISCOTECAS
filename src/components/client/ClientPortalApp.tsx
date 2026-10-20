import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useClubStore } from '../../store/clubStore';
import { ClubLanding } from './ClubLanding';
import { ClientIdentityHub } from './ClientIdentityHub';
import { ConciergeView } from './ConciergeView';
import { subscribeToBusinessAuth, signOutBusinessCustomer, type BusinessAuthUser } from '../../lib/businessAuth';
import { QrCode, LayoutGrid, Sparkles } from 'lucide-react';

interface ClientPortalAppProps {
  businessScoped?: boolean;
  businessSlug?: string;
  onSignOut?: () => void;
}

export function ClientPortalApp({ businessScoped = false, businessSlug, onSignOut }: ClientPortalAppProps = {}) {
  const store = useClubStore();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<BusinessAuthUser | null>(null);
  const [authReady, setAuthReady] = useState(businessScoped);

  useEffect(() => {
    if (businessScoped) return;
    return subscribeToBusinessAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        store.clearBusinessPortalSession();
        store.logoutClient();
      }
    });
  }, [businessScoped, store]);

  // Si se accede a /app o /portal sin scope de negocio y sin autenticación real, redirige al directorio
  if (!businessScoped && authReady && !authUser) {
    return <Navigate to="/" replace />;
  }

  // Si no está listo aún el auth en /app, pantalla de carga mínima
  if (!businessScoped && !authReady) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }} />;
  }

  const handleGlobalSignOut = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    void signOutBusinessCustomer().finally(() => {
      store.clearBusinessPortalSession();
      store.logoutClient();
      navigate('/', { replace: true });
    });
  };

  const showIdentity = store.clientSubTab === 'IDENTITY' && Boolean(store.clientUser);
  const showConcierge = store.clientSubTab === 'CONCIERGE' && Boolean(store.clientUser);

  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clientUser = store.clientUser;
  const hasReservation = Boolean(
    clientUser &&
    store.reservations.some(r =>
      (r.club_id === activeClub?.id || !r.club_id) &&
      (
        r.customer_name === clientUser.name ||
        (clientUser.email && r.customer_email === clientUser.email) ||
        (clientUser.phone && r.customer_phone === clientUser.phone) ||
        r.id.includes(clientUser.id)
      )
    )
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', overflow: 'hidden', position: 'relative' }}>
      {showIdentity ? (
        <ClientIdentityHub onGoToMap={() => store.setClientSubTab('MAP')} onSignOut={handleGlobalSignOut} />
      ) : showConcierge ? (
        <ConciergeView onBack={() => store.setClientSubTab('MAP')} />
      ) : (
        <ClubLanding
          hideClubSelector={businessScoped}
          onBack={businessScoped && businessSlug ? () => navigate(`/negocio/${businessSlug}`) : undefined}
          onSignOut={handleGlobalSignOut}
        />
      )}

      {/* ════════ FLOATING VIP DOCK NAVIGATION ════════ */}
      {clientUser && (
        <nav
          aria-label="Navegación VIP"
          style={{
            position: 'fixed',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 28px)',
            maxWidth: '430px',
            zIndex: 90,
            background: 'var(--bg-glass-strong)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            borderRadius: '24px',
            padding: '5px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(229, 181, 79, 0.15)',
          }}
        >
          {/* Tab 1: Mi Pase VIP */}
          <button
            id="vip-dock-pass-btn"
            type="button"
            onClick={() => store.setClientSubTab('IDENTITY')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '16px',
              background: showIdentity ? 'rgba(229, 181, 79, 0.16)' : 'transparent',
              border: showIdentity ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid transparent',
              color: showIdentity ? 'var(--gold)' : 'rgba(255, 255, 255, 0.55)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background var(--dur-fast) var(--ease-operational), color var(--dur-fast) var(--ease-operational)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <QrCode size={19} color={showIdentity ? 'var(--gold)' : 'rgba(255, 255, 255, 0.65)'} />
              {hasReservation && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--state-success)',
                    boxShadow: '0 0 6px var(--state-success)',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: '0.64rem', fontWeight: showIdentity ? 800 : 600, letterSpacing: '0.02em' }}>
              Mi Pase VIP
            </span>
          </button>

          {/* Tab 2: Plano de Sala */}
          <button
            id="vip-dock-map-btn"
            type="button"
            onClick={() => store.setClientSubTab('MAP')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '16px',
              background: !showIdentity && !showConcierge ? 'rgba(229, 181, 79, 0.16)' : 'transparent',
              border: !showIdentity && !showConcierge ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid transparent',
              color: !showIdentity && !showConcierge ? 'var(--gold)' : 'rgba(255, 255, 255, 0.55)',
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease-operational), color var(--dur-fast) var(--ease-operational)',
            }}
          >
            <LayoutGrid size={19} color={!showIdentity && !showConcierge ? 'var(--gold)' : 'rgba(255, 255, 255, 0.65)'} />
            <span style={{ fontSize: '0.64rem', fontWeight: !showIdentity && !showConcierge ? 800 : 600, letterSpacing: '0.02em' }}>
              Plano de Sala
            </span>
          </button>

          {/* Tab 3: Concierge */}
          <button
            id="vip-dock-concierge-btn"
            type="button"
            onClick={() => store.setClientSubTab('CONCIERGE')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '16px',
              background: showConcierge ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
              border: showConcierge ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              color: showConcierge ? 'var(--state-info)' : 'rgba(255, 255, 255, 0.55)',
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease-operational), color var(--dur-fast) var(--ease-operational)',
            }}
          >
            <Sparkles size={19} color={showConcierge ? 'var(--state-info)' : 'rgba(255, 255, 255, 0.65)'} />
            <span style={{ fontSize: '0.64rem', fontWeight: showConcierge ? 800 : 600, letterSpacing: '0.02em' }}>
              Concierge
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default ClientPortalApp;

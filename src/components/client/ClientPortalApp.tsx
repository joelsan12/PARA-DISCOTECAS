import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useClubStore } from '../../store/clubStore';
import { ClubLanding } from './ClubLanding';
import { ClientIdentityHub } from './ClientIdentityHub';
import { subscribeToBusinessAuth, signOutBusinessCustomer, type BusinessAuthUser } from '../../lib/businessAuth';

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
    return <div style={{ minHeight: '100vh', background: '#090A0F' }} />;
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

  return (
    <div style={{ minHeight: '100vh', background: '#090A0F', overflow: 'hidden' }}>
      {showIdentity ? (
        <ClientIdentityHub onGoToMap={() => store.setClientSubTab('MAP')} onSignOut={handleGlobalSignOut} />
      ) : (
        <ClubLanding
          hideClubSelector={businessScoped}
          onBack={businessScoped && businessSlug ? () => navigate(`/negocio/${businessSlug}`) : undefined}
          onSignOut={handleGlobalSignOut}
        />
      )}
    </div>
  );
}

export default ClientPortalApp;

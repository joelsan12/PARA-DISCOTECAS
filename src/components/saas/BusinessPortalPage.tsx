import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BusinessCustomerProfile, BusinessDirectoryEntry } from '../../types/saas';
import type { ClientUser } from '../../types';
import { findBusinessBySlug } from '../../lib/businessDirectory';
import { useBusinessDirectory } from '../../lib/useBusinessDirectory';
import {
  getCurrentBusinessUser,
  signOutBusinessCustomer,
  subscribeToBusinessAuth,
  type BusinessAuthUser
} from '../../lib/businessAuth';
import { ensureBusinessCustomerProfile } from '../../lib/businessCustomer';
import { useClubStore } from '../../store/clubStore';
import { ClientPortalApp } from '../client/ClientPortalApp';
import { SaasAmbient, SaasFooter, SaasHeader } from './saas-ui';

const toClientUser = (authUser: BusinessAuthUser, profile: BusinessCustomerProfile | null): ClientUser => {
  const name = profile?.displayName?.trim()
    || authUser.displayName?.trim()
    || authUser.email?.split('@')[0]
    || authUser.phone
    || 'Invitado Nightflow';
  const tier = profile?.tier === 'BLACK'
    ? 'BLACK_DIAMOND'
    : profile?.tier === 'GOLD' ? 'GOLD_VIP' : 'SILVER';
  const email = profile?.email || authUser.email;
  return {
    id: authUser.uid,
    name,
    phone: profile?.phone || authUser.phone || '',
    ...(email ? { email } : {}),
    auth_provider: authUser.email ? 'password' : 'phone_otp',
    tier,
    created_at: profile?.createdAt || authUser.createdAt
  };
};

function PortalBusy({ business }: { business: BusinessDirectoryEntry }) {
  return (
    <div className="saas-app saas-simple-page">
      <SaasAmbient />
      <SaasHeader business={business} backTo={`/negocio/${business.slug}`} />
      <main className="saas-container saas-simple-page__content">
        <span className="saas-404-code">NIGHTFLOW / PORTAL</span>
        <h1>Abriendo tu espacio.</h1>
        <p>Estamos vinculando tu identidad con {business.name} para mostrarte solo tus mesas, tus reservas y tu pase.</p>
        <span className="saas-kicker" style={{ marginTop: '28px' }}>
          <Loader2 size={12} style={{ animation: 'saas-spin 700ms linear infinite' }} />
          Verificando tu sesión
        </span>
      </main>
      <SaasFooter />
    </div>
  );
}

function PortalNotFound() {
  return (
    <div className="saas-app saas-simple-page">
      <SaasAmbient />
      <SaasHeader />
      <main className="saas-container saas-simple-page__content">
        <span className="saas-404-code">404 / PORTAL</span>
        <h1>Este portal no está disponible.</h1>
        <p>El venue solicitado no existe o ya no forma parte del directorio de Nightflow.</p>
        <Link className="saas-button saas-button--gold" to="/"><ArrowLeft size={16} /> Volver al directorio</Link>
      </main>
      <SaasFooter />
    </div>
  );
}

export function BusinessPortalPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { entries } = useBusinessDirectory();
  const business = useMemo(() => findBusinessBySlug(entries, slug), [slug, entries]);
  const store = useClubStore();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<BusinessAuthUser | null>(() => getCurrentBusinessUser());
  const [authReady, setAuthReady] = useState(() => Boolean(getCurrentBusinessUser()));

  useEffect(() => subscribeToBusinessAuth((nextUser) => {
    setAuthUser(nextUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (authReady && business && !authUser) {
      navigate(`/negocio/${business.slug}/acceso`, { replace: true });
    }
  }, [authReady, authUser, business, navigate]);

  useEffect(() => {
    if (!business || !authUser) return;
    if (store.activeClubId !== business.id || store.clientUser?.id !== authUser.uid) {
      store.setBusinessPortalSession(business.id, toClientUser(authUser, null));
      let cancelled = false;
      void ensureBusinessCustomerProfile(business.id, {
        uid: authUser.uid,
        displayName: authUser.displayName,
        email: authUser.email,
        phone: authUser.phone
      })
        .catch(() => null)
        .then((profile) => {
          if (cancelled || !profile) return;
          store.setBusinessPortalSession(business.id, toClientUser(authUser, profile));
        });
      return () => { cancelled = true; };
    }
  }, [authUser, business, store]);

  const handleSignOut = () => {
    void signOutBusinessCustomer()
      .catch(() => undefined)
      .finally(() => {
        store.clearBusinessPortalSession();
        setAuthUser(null);
      });
  };

  if (!business) return <PortalNotFound />;
  if (!authReady || !authUser) return <PortalBusy business={business} />;

  return (
    <ClientPortalApp
      businessScoped
      businessSlug={business.slug}
      onSignOut={handleSignOut}
    />
  );
}

export default BusinessPortalPage;

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClubStore } from '../../store/clubStore';
import { ClubDashboard } from './ClubDashboard';
import { DoorCheckIn } from '../door/DoorCheckIn';
import { WaiterPwaApp } from '../waiter/WaiterPwaApp';
import { AdminSidebar, type DashboardTabKey } from './AdminSidebar';
import { AdminCommandBar } from './AdminCommandBar';
import { AdminLoginView } from './AdminLoginView';
import { subscribeToAdminAuth, signOutAdmin, type AdminAuthState } from '../../lib/adminAuth';
import { NightflowLogoMark } from '../common/NightflowLogo';
import '../../styles/adminLayout.css';

export type AdminView = 'DASHBOARD' | 'DOOR' | 'WAITER';

function normalizePlanId(rawPlanId?: string): string {
  if (!rawPlanId) return 'beta_vip';
  const clean = rawPlanId.trim().toLowerCase();
  if (clean === 'enterprise' || clean === 'plan empresarial') return 'enterprise';
  if (clean === 'basic' || clean === 'plan básico' || clean === 'plan basico') return 'basic';
  if (clean.includes('black')) return 'black_vip';
  if (clean.includes('starter')) return 'starter';
  if (clean.includes('free') || clean.includes('lounge')) return 'free';
  if (
    clean.includes('beta') ||
    clean.includes('pro') ||
    clean.includes('vip')
  ) {
    return 'beta_vip';
  }
  return 'beta_vip';
}

/**
 * Portal Exclusivo para Administradores, Staff y Personal de Puerta de Sensorial Club VIP.
 * Arquitectura ejecutiva de consola de mando con barra lateral, command bar
 * y control criptográfico estricto conforme a AGENTS §10 y §13.
 */
export function AdminPortalApp() {
  const store = useClubStore();
  const [authState, setAuthState] = useState<AdminAuthState>({ status: 'loading' });
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Garantizar que la consola de club tenga un club base seleccionado si aún no hay uno
  useEffect(() => {
    if (!store.activeClubId) {
      store.setActiveClub('club-sensorial');
    }
  }, [store]);

  const activeClubId = store.activeClubId || undefined;

  useEffect(() => {
    const unsubscribe = subscribeToAdminAuth(activeClubId, state => {
      setAuthState(state);
      if (state.status === 'authenticated') {
        const session = state.session;
        // Si el usuario autenticado pertenece a un club específico (ej. club activado en la beta),
        // hidratar los datos de su club desde Firestore y sincronizar la consola de mando:
        if (session.clubId) {
          const clubExists = store.clubs.some(c => c.id === session.clubId);
          const firestore = db;
          if (!clubExists && firestore) {
            getDoc(doc(firestore, 'businesses', session.clubId)).then(bizSnap => {
              if (bizSnap.exists()) {
                const data = bizSnap.data();
                store.registerClubFromRemote({
                  id: session.clubId!,
                  name: data.name || 'Mi Establecimiento',
                  slug: data.slug || session.clubId,
                  city: data.city || 'Ecuador',
                  plan_id: normalizePlanId(data.planId || data.plan_id),
                  enabled_features: data.enabled_features,
                  custom_features: data.custom_features,
                  logo: data.logoUrl || data.logo,
                  banner: data.coverUrl || data.banner,
                  status: data.status || 'active',
                  layout_type: data.layout_type || 'horseshoe_vip'
                });
                store.setActiveClub(session.clubId!);
              } else {
                getDoc(doc(firestore, 'businessDirectory', session.clubId!)).then(dirSnap => {
                  if (dirSnap.exists()) {
                    const data = dirSnap.data();
                    store.registerClubFromRemote({
                      id: session.clubId!,
                      name: data.name || 'Mi Establecimiento',
                      slug: data.slug || session.clubId,
                      city: data.city || 'Ecuador',
                      plan_id: normalizePlanId(data.planId || data.plan_id),
                      logo: data.logoUrl || data.logo,
                      banner: data.coverUrl || data.banner,
                      status: data.status || 'active'
                    });
                    store.setActiveClub(session.clubId!);
                  }
                }).catch(() => {});
              }
            }).catch(() => {});
          } else if (session.clubId !== store.activeClubId) {
            store.setActiveClub(session.clubId);
          }
        }
        if (session.role === 'WAITER') {
          setCurrentView('WAITER');
        } else if (session.role === 'DOOR_CHECKIN') {
          setCurrentView('DOOR');
        } else {
          setCurrentView('DASHBOARD');
        }
      }
    });

    return () => unsubscribe();
  }, [activeClubId, store]);

  if (authState.status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08080c',
        color: '#fff',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <NightflowLogoMark size={52} theme="gold" />
            <div style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '16px',
              border: '2px solid rgba(229, 181, 79, 0.45)',
              borderTopColor: 'transparent',
              animation: 'spin 1.2s linear infinite',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="font-brand" style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', margin: 0 }}>
              NIGHTFLOW VIP
            </p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Verificando credenciales corporativas en el servidor...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (authState.status === 'unauthenticated') {
    return <AdminLoginView />;
  }

  if (authState.status === 'unauthorized') {
    return (
      <AdminLoginView
        unauthorizedReason={authState.reason}
        onSignOut={signOutAdmin}
      />
    );
  }

  const session = authState.session;
  const canAccessDashboard = session.isSuperAdmin || session.role === 'CLUB_ADMIN';
  const canAccessDoor = session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'DOOR_CHECKIN';
  const canAccessWaiter = session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'WAITER';

  const activeTab = (store.dashboardTab as DashboardTabKey) || 'MONITOR';

  return (
    <div className="admin-layout-root">
      {/* 1. Barra Lateral de Mando Ejecutivo (Sidebar) */}
      <AdminSidebar
        currentView={currentView}
        dashboardTab={activeTab}
        onSelectView={setCurrentView}
        onSelectTab={(tab) => store.setDashboardTab(tab)}
        session={session}
        onSignOut={signOutAdmin}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* 2. Área Principal de Trabajo */}
      <div className="admin-main-viewport">
        {/* Barra Superior de Comandos y Estado */}
        <AdminCommandBar
          currentView={currentView}
          dashboardTab={activeTab}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
        />

        {/* Lienzo Dinámico según sección activa */}
        <main className="admin-canvas">
          {currentView === 'DASHBOARD' && canAccessDashboard && <ClubDashboard session={session} />}
          {currentView === 'DOOR' && canAccessDoor && <DoorCheckIn />}
          {currentView === 'WAITER' && canAccessWaiter && <WaiterPwaApp session={session} />}
        </main>
      </div>
    </div>
  );
}

export default AdminPortalApp;


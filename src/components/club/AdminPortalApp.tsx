import { useEffect, useState } from 'react';
import { useClubStore } from '../../store/clubStore';
import { ClubDashboard } from './ClubDashboard';
import { DoorCheckIn } from '../door/DoorCheckIn';
import { SuperAdminDashboard } from '../superadmin/SuperAdminDashboard';
import { AdminNavbar } from '../common/AdminNavbar';
import { AdminLoginView } from './AdminLoginView';
import { subscribeToAdminAuth, signOutAdmin, type AdminAuthState } from '../../lib/adminAuth';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { NightflowLogoMark } from '../common/NightflowLogo';

type AdminView = 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN';

/**
 * Portal Exclusivo para Administradores, Staff y Personal de Puerta.
 * Protegido rigurosamente con Firebase Authentication y validación en Firestore
 * conforme a AGENTS §10 y §13 (los roles se asignan exclusivamente desde el servidor).
 */
export function AdminPortalApp() {
  const store = useClubStore();
  const [authState, setAuthState] = useState<AdminAuthState>({ status: 'loading' });
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');

  const activeClubId = store.activeClubId;

  useEffect(() => {
    const unsubscribe = subscribeToAdminAuth(activeClubId, state => {
      setAuthState(state);
      if (state.status === 'authenticated') {
        const session = state.session;
        if (session.isSuperAdmin) {
          setCurrentView('SUPER_ADMIN');
        } else if (session.role === 'DOOR_CHECKIN') {
          setCurrentView('DOOR');
        } else {
          setCurrentView('DASHBOARD');
        }
      }
    });

    return () => unsubscribe();
  }, [activeClubId]);

  if (authState.status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090A0F',
        color: '#fff',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <NightflowLogoMark size={52} theme="cyan" />
            <div style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '16px',
              border: '2px solid rgba(0, 240, 255, 0.4)',
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
  const canAccessSuperAdmin = session.isSuperAdmin;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090A0F' }}>
      {/* Top Banner de Identidad Corporativa */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(0, 240, 255, 0.1))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '6px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.76rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
          <ShieldCheck size={14} color="#00f0ff" />
          <span style={{ fontWeight: 600 }}>PORTAL CORPORATIVO AUTENTICADO</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>Sesión: {session.email}</span>
        </div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#eab308',
            textDecoration: 'none',
            fontWeight: 700,
            background: 'rgba(234, 179, 8, 0.12)',
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <span>Abrir Portal de Clientes (5173)</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Barra de navegación de administración vinculada a sesión del servidor */}
      <AdminNavbar
        currentView={currentView}
        onSelectView={setCurrentView}
        session={session}
        onSignOut={signOutAdmin}
      />

      {/* Contenido principal estrictamente según permisos de la sesión */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {currentView === 'DASHBOARD' && canAccessDashboard && <ClubDashboard />}
        {currentView === 'DOOR' && canAccessDoor && <DoorCheckIn />}
        {currentView === 'SUPER_ADMIN' && canAccessSuperAdmin && <SuperAdminDashboard />}
      </main>

      {/* Footer corporativo */}
      <footer style={{
        background: 'rgba(6, 8, 12, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }} />
          <span className="font-brand" style={{ color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.04em' }}>
            NIGHTFLOW · CONSOLA DE OPERACIONES VIP
          </span>
        </div>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          Autenticación criptográfica con Firebase Auth · Aislamiento multi-tenant · Cumplimiento de seguridad AGENTS.md
        </p>
      </footer>
    </div>
  );
}

export default AdminPortalApp;

import { useClubStore } from '../../store/clubStore';
import { LayoutDashboard, ScanLine, ExternalLink, ShieldCheck, ChevronDown, Building2, LogOut, User } from 'lucide-react';
import type { AdminStaffSession } from '../../lib/adminAuth';

interface AdminNavbarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN';
  onSelectView: (view: 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN') => void;
  session: AdminStaffSession;
  onSignOut: () => void;
}

export const AdminNavbar = ({ currentView, onSelectView, session, onSignOut }: AdminNavbarProps) => {
  const store = useClubStore();

  const roleLabel = session.isSuperAdmin
    ? 'SUPER ADMIN'
    : session.role === 'DOOR_CHECKIN'
      ? 'PERSONAL PUERTA'
      : 'ADMIN CLUB';

  const roleBadgeColor = session.isSuperAdmin
    ? '#a855f7'
    : session.role === 'DOOR_CHECKIN'
      ? '#34d399'
      : '#00f0ff';

  const canAccessDashboard = session.isSuperAdmin || session.role === 'CLUB_ADMIN';
  const canAccessDoor = session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'DOOR_CHECKIN';
  const canAccessSuperAdmin = session.isSuperAdmin;

  return (
    <header style={{
      background: 'rgba(10, 14, 22, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px',
    }}>
      {/* Left: Brand + Active Club Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#00f0ff',
            boxShadow: '0 0 12px #00f0ff',
          }} />
          <span className="font-brand" style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            letterSpacing: '0.06em',
            background: 'linear-gradient(135deg, #ffffff 40%, #00f0ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            NIGHTFLOW
          </span>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0, 240, 255, 0.1)',
            color: '#00f0ff',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            letterSpacing: '0.05em',
          }}>
            PORTAL CORPORATIVO
          </span>
        </div>

        {/* Club Selector (solo si puede ver dashboard de clubs) */}
        {canAccessDashboard && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '5px 12px',
            position: 'relative',
          }}>
            <Building2 size={14} color="rgba(255, 255, 255, 0.5)" />
            <select
              value={store.activeClubId}
              onChange={(e) => store.setActiveClub(e.target.value)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                paddingRight: '18px',
              }}
            >
              {store.clubs.map(club => (
                <option key={club.id} value={club.id} style={{ background: '#0e121a', color: '#fff' }}>
                  {club.name} ({club.city})
                </option>
              ))}
            </select>
            <ChevronDown size={12} color="rgba(255, 255, 255, 0.5)" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      {/* Center: Server-Authorized Navigation Tabs (sin cambio de rol) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {canAccessDashboard && (
          <button
            type="button"
            onClick={() => onSelectView('DASHBOARD')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: currentView === 'DASHBOARD' ? 700 : 500,
              background: currentView === 'DASHBOARD'
                ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              color: currentView === 'DASHBOARD' ? '#00f0ff' : 'rgba(255, 255, 255, 0.7)',
              border: currentView === 'DASHBOARD'
                ? '1px solid rgba(0, 240, 255, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              boxShadow: currentView === 'DASHBOARD' ? '0 0 14px rgba(0, 240, 255, 0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={15} />
            <span>Control Club & Plano</span>
          </button>
        )}

        {canAccessDoor && (
          <button
            type="button"
            onClick={() => onSelectView('DOOR')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: currentView === 'DOOR' ? 700 : 500,
              background: currentView === 'DOOR'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              color: currentView === 'DOOR' ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
              border: currentView === 'DOOR'
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              boxShadow: currentView === 'DOOR' ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ScanLine size={15} />
            <span>Escáner de acceso QR</span>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              EN VIVO
            </span>
          </button>
        )}

        {canAccessSuperAdmin && (
          <button
            type="button"
            onClick={() => onSelectView('SUPER_ADMIN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: currentView === 'SUPER_ADMIN' ? 700 : 500,
              background: currentView === 'SUPER_ADMIN'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              color: currentView === 'SUPER_ADMIN' ? '#c084fc' : 'rgba(255, 255, 255, 0.7)',
              border: currentView === 'SUPER_ADMIN'
                ? '1px solid rgba(168, 85, 247, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              boxShadow: currentView === 'SUPER_ADMIN' ? '0 0 14px rgba(168, 85, 247, 0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={15} />
            <span>Consola SuperAdmin SaaS</span>
          </button>
        )}
      </nav>

      {/* Right: Enlace externo al portal de clientes y sesión del usuario con rol verificado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            background: 'rgba(229, 181, 79, 0.1)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            color: 'var(--brand-gold)',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ExternalLink size={13} />
          <span>Portal Clientes (5173)</span>
        </a>

        {/* Authenticated Staff User Pill with Server Verified Role */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}>
          <User size={13} color={roleBadgeColor} />
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 600,
            color: '#e2e8f0',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {session.displayName}
          </span>
          <span style={{
            fontSize: '0.6rem',
            background: `${roleBadgeColor}22`,
            color: roleBadgeColor,
            border: `1px solid ${roleBadgeColor}44`,
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            title="Cerrar sesión corporativa"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              marginLeft: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};

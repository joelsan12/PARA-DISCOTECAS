import React from 'react';
import { useClubStore } from '../../store/clubStore';
import {
  MonitorPlay,
  Sliders,
  Ticket,
  Coins,
  CreditCard,
  Building2,
  ShieldCheck,
  ScanLine,
  ShieldAlert,
  ExternalLink,
  LogOut,
  X,
  ChevronDown,
  Building
} from 'lucide-react';
import type { AdminStaffSession } from '../../lib/adminAuth';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { esPlan } from '../../lib/esLabels';

export type DashboardTabKey =
  | 'MONITOR'
  | 'LAYOUT_BUILDER'
  | 'RESERVATIONS'
  | 'PRICING'
  | 'PAYMENTS'
  | 'LEGAL'
  | 'AUDIT';

interface AdminSidebarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN';
  dashboardTab: DashboardTabKey;
  onSelectView: (view: 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN') => void;
  onSelectTab: (tab: DashboardTabKey) => void;
  session: AdminStaffSession;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  dashboardTab,
  onSelectView,
  onSelectTab,
  session,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
}) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const activeEvent = store.events.find(e => e.club_id === activeClub?.id) || store.events[0];
  const eventReservations = store.reservations.filter(
    r => r.club_id === activeClub?.id && r.event_id === activeEvent?.id
  );

  const roleLabel = session.isSuperAdmin
    ? 'SUPER ADMIN'
    : session.role === 'DOOR_CHECKIN'
      ? 'PERSONAL PUERTA'
      : 'ADMIN CLUB';

  const roleBadgeColor = session.isSuperAdmin
    ? '#c084fc'
    : session.role === 'DOOR_CHECKIN'
      ? '#34d399'
      : '#e5b54f';

  const canAccessDashboard = session.isSuperAdmin || session.role === 'CLUB_ADMIN';
  const canAccessDoor = session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'DOOR_CHECKIN';
  const canAccessSuperAdmin = session.isSuperAdmin;

  const handleTabClick = (tab: DashboardTabKey) => {
    onSelectView('DASHBOARD');
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleDoorClick = () => {
    onSelectView('DOOR');
    onCloseMobile();
  };

  const handleSuperAdminClick = () => {
    onSelectView('SUPER_ADMIN');
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 4, 7, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 95,
          }}
        />
      )}

      <aside className={`admin-sidebar ${isOpenMobile ? 'open' : ''}`}>
        {/* 1. Header with Logo & Brand */}
        <div className="admin-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NightflowLogoMark size={32} theme="gold" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="font-brand" style={{
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  letterSpacing: '0.1em',
                  background: 'linear-gradient(135deg, #ffffff 40%, #e5b54f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  NIGHTFLOW
                </span>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(229, 181, 79, 0.14)',
                  color: '#e5b54f',
                  border: '1px solid rgba(229, 181, 79, 0.35)',
                  letterSpacing: '0.06em',
                }}>
                  VIP
                </span>
              </div>
              <span style={{
                fontSize: '0.55rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'rgba(229, 181, 79, 0.85)',
                textTransform: 'uppercase',
              }}>
                Consola Operativa
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
            }}
            className="mobile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Scrollable Navigation */}
        <div className="admin-sidebar-scroll">
          {/* Venue Card */}
          {activeClub && canAccessDashboard && (
            <div className="admin-venue-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(229, 181, 79, 0.15)',
                    border: '1px solid rgba(229, 181, 79, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-gold)'
                  }}>
                    <Building size={14} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', lineHeight: 1.2 }}>
                      {activeClub.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {activeClub.city} · Plan {esPlan(activeClub.plan_id)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de local si existen varios */}
              {store.clubs.length > 1 && (
                <div style={{ position: 'relative', marginTop: '2px' }}>
                  <select
                    value={store.activeClubId}
                    onChange={(e) => store.setActiveClub(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 24px 5px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#cbd5e1',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                  >
                    {store.clubs.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0e121a', color: '#fff' }}>
                        Cambiar a: {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    color="rgba(255, 255, 255, 0.4)"
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Section: Operaciones de Sala */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Operaciones de Sala</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'MONITOR' ? 'active' : ''}`}
                onClick={() => handleTabClick('MONITOR')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <MonitorPlay size={15} />
                  </span>
                  <span>Sala en Vivo</span>
                </div>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  LIVE
                </span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'LAYOUT_BUILDER' ? 'active' : ''}`}
                onClick={() => handleTabClick('LAYOUT_BUILDER')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <Sliders size={15} />
                  </span>
                  <span>Diseñador de Plano</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'RESERVATIONS' ? 'active' : ''}`}
                onClick={() => handleTabClick('RESERVATIONS')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <Ticket size={15} />
                  </span>
                  <span>Reservas Activas</span>
                </div>
                {eventReservations.length > 0 && (
                  <span className="admin-nav-item-badge">
                    {eventReservations.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Section: Comercial & Finanzas */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Comercial &amp; Finanzas</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'PRICING' ? 'active' : ''}`}
                onClick={() => handleTabClick('PRICING')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <Coins size={15} />
                  </span>
                  <span>Tarifario &amp; Anticipos</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'PAYMENTS' ? 'active' : ''}`}
                onClick={() => handleTabClick('PAYMENTS')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <CreditCard size={15} />
                  </span>
                  <span>Pasarela Kushki 💳</span>
                </div>
              </button>
            </div>
          )}

          {/* Section: Gobernanza & Fiscal */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Gobernanza &amp; Fiscal</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'LEGAL' ? 'active' : ''}`}
                onClick={() => handleTabClick('LEGAL')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <Building2 size={15} />
                  </span>
                  <span>Identidad Legal SRI</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'AUDIT' ? 'active' : ''}`}
                onClick={() => handleTabClick('AUDIT')}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <ShieldCheck size={15} />
                  </span>
                  <span>Bitácora de Auditoría</span>
                </div>
              </button>
            </div>
          )}

          {/* Section: Puerta en Vivo */}
          {canAccessDoor && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Control de Acceso</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DOOR' ? 'active' : ''}`}
                onClick={handleDoorClick}
                style={{
                  background: currentView === 'DOOR'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.15) 100%)'
                    : undefined,
                  borderColor: currentView === 'DOOR' ? 'rgba(16, 185, 129, 0.45)' : undefined,
                  color: currentView === 'DOOR' ? '#34d399' : undefined,
                }}
              >
                <div className="admin-nav-item-left">
                  <span
                    className="admin-nav-item-icon"
                    style={{
                      background: currentView === 'DOOR' ? 'rgba(16, 185, 129, 0.2)' : undefined,
                      color: currentView === 'DOOR' ? '#34d399' : undefined,
                    }}
                  >
                    <ScanLine size={15} />
                  </span>
                  <span>Escáner Puerta QR</span>
                </div>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ACTIVO
                </span>
              </button>
            </div>
          )}

          {/* Section: SaaS SuperAdmin */}
          {canAccessSuperAdmin && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Consola de Plataforma</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'SUPER_ADMIN' ? 'active' : ''}`}
                onClick={handleSuperAdminClick}
                style={{
                  background: currentView === 'SUPER_ADMIN'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(147, 51, 234, 0.15) 100%)'
                    : undefined,
                  borderColor: currentView === 'SUPER_ADMIN' ? 'rgba(168, 85, 247, 0.45)' : undefined,
                  color: currentView === 'SUPER_ADMIN' ? '#c084fc' : undefined,
                }}
              >
                <div className="admin-nav-item-left">
                  <span
                    className="admin-nav-item-icon"
                    style={{
                      background: currentView === 'SUPER_ADMIN' ? 'rgba(168, 85, 247, 0.2)' : undefined,
                      color: currentView === 'SUPER_ADMIN' ? '#c084fc' : undefined,
                    }}
                  >
                    <ShieldAlert size={15} />
                  </span>
                  <span>SuperAdmin SaaS</span>
                </div>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  GLOBAL
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Footer with User Profile & Portal Link */}
        <div className="admin-sidebar-footer">
          {/* Staff Member Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.25), rgba(8, 8, 12, 0.9))',
                border: '1px solid rgba(229, 181, 79, 0.4)',
                color: 'var(--brand-gold)',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {session.displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {session.displayName}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  color: roleBadgeColor,
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}>
                  {roleLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar sesión corporativa"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* External Link to Client Portal */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(229, 181, 79, 0.08)',
              border: '1px solid rgba(229, 181, 79, 0.25)',
              color: 'var(--brand-gold)',
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(229, 181, 79, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(229, 181, 79, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.25)';
            }}
          >
            <ExternalLink size={12} />
            <span>Portal de Clientes (5173)</span>
          </a>
        </div>
      </aside>
    </>
  );
};

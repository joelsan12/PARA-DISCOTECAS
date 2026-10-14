import React from 'react';
import { useClubStore } from '../../store/clubStore';
import {
  MonitorPlay,
  Sliders,
  CalendarDays,
  Ticket,
  Coins,
  CreditCard,
  Building2,
  ShieldCheck,
  ScanLine,
  LogOut,
  X,
  Building,
  Crown,
  Users,
  Wine,
  History,
  UserCog,
  UserCheck,
} from 'lucide-react';
import type { AdminStaffSession } from '../../lib/adminAuth';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
import { esPlan } from '../../lib/esLabels';
import { isDashboardTabAllowed, isDoorAccessAllowed, normalizeCanonicalPlanId } from '../../lib/clubPermissions';


export type DashboardTabKey =
  | 'MONITOR'
  | 'FLOOR_OPS'
  | 'LAYOUT_BUILDER'
  | 'EVENTS'
  | 'RESERVATIONS'
  | 'DOOR_LOG'
  | 'PRICING'
  | 'CONSUMPTION'
  | 'TRANSACTIONS'
  | 'PAYMENTS'
  | 'STAFF'
  | 'LEGAL'
  | 'AUDIT'
  | 'SUBSCRIPTION';

interface AdminSidebarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'WAITER';
  dashboardTab: DashboardTabKey;
  onSelectView: (view: 'DASHBOARD' | 'DOOR' | 'WAITER') => void;
  onSelectTab: (tab: DashboardTabKey) => void;
  session: AdminStaffSession;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenProfile?: () => void;
}

function formatPlanSidebarTag(planId?: string): string {
  const raw = (planId || '').toLowerCase();
  if (raw.includes('beta')) return 'BETA VIP';
  if (raw.includes('black') || raw.includes('enterprise')) return 'VIP';
  if (raw.includes('pro')) return 'PRO';
  if (raw.includes('starter') || raw.includes('basic')) return 'STARTER';
  if (raw.includes('free') || raw.includes('lounge')) return 'FREE';
  return 'VIP';
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
  onOpenProfile,
}) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const activePlan = store.plans.find(p => p.id === activeClub?.plan_id)
    || store.plans.find(p => normalizeCanonicalPlanId(p.id) === normalizeCanonicalPlanId(activeClub?.plan_id));
  const clubEvents = store.events.filter(e => e.club_id === activeClub?.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];
  const eventReservations = activeEvent
    ? store.reservations.filter(r => r.club_id === activeClub?.id && r.event_id === activeEvent.id)
    : [];
  const checkedInCount = store.reservations.filter(
    r => r.club_id === activeClub?.id && r.status === 'CHECKED_IN'
  ).length;

  const roleLabel = session.role === 'WAITER' || session.staffRole === 'waiter'
    ? 'MESERO SALA'
    : session.role === 'DOOR_CHECKIN'
    ? 'PERSONAL PUERTA'
    : 'ADMIN CLUB VIP';

  const roleBadgeColor = session.role === 'WAITER' || session.staffRole === 'waiter'
    ? '#38bdf8'
    : session.role === 'DOOR_CHECKIN'
    ? '#34d399'
    : 'var(--brand-gold)';

  const canAccessDashboard = session.isSuperAdmin || session.role === 'CLUB_ADMIN';
  const canAccessDoor = (session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'DOOR_CHECKIN')
    && isDoorAccessAllowed(activeClub, activePlan);
  const canAccessWaiter = session.isSuperAdmin || session.role === 'CLUB_ADMIN' || session.role === 'WAITER';

  const handleTabClick = (tab: DashboardTabKey) => {
    onSelectView('DASHBOARD');
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleDoorClick = () => {
    onSelectView('DOOR');
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
                  color: 'var(--text-high, #f4f1ea)',
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

          {/* Mobile Close Button — visibility controlled by .mobile-close-btn CSS */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar navegación"
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, rgba(255, 255, 255, 0.5))',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Scrollable Navigation */}
        <div className="admin-sidebar-scroll">
          {/* Venue Card (Exclusivo para la sede oficial, sin opción de cambiar de negocio) */}
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-high, #ffffff)', display: 'block', lineHeight: 1.2 }}>
                      {activeClub.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {activeClub.city} · Plan {esPlan(activeClub.plan_id)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador de sede conectada fija (sin selector) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
                fontSize: '0.64rem',
                color: '#10b981'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.7)'
                }} />
                <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>Sede Oficial Conectada</span>
              </div>
            </div>
          )}

          {/* Section: Operaciones de Sala */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Operaciones de Sala</span>
              </span>

              {(isDashboardTabAllowed('MONITOR', activeClub, activePlan) || isDashboardTabAllowed('FLOOR_OPS', activeClub, activePlan)) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && (dashboardTab === 'MONITOR' || dashboardTab === 'FLOOR_OPS') ? 'active' : ''}`}
                  onClick={() => handleTabClick('MONITOR')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <MonitorPlay size={15} />
                    </span>
                    <span>Sala &amp; Concierge</span>
                  </div>
                  <span className="admin-nav-item-tag admin-nav-item-tag--live">
                    LIVE
                  </span>
                </button>
              )}

              {isDashboardTabAllowed('LAYOUT_BUILDER', activeClub, activePlan) && (
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
              )}

              {isDashboardTabAllowed('EVENTS', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'EVENTS' ? 'active' : ''}`}
                  onClick={() => handleTabClick('EVENTS')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <CalendarDays size={15} />
                    </span>
                    <span>Cartelera de Eventos</span>
                  </div>
                  {clubEvents.length > 0 && (
                    <span className="admin-nav-item-tag">
                      {clubEvents.length}
                    </span>
                  )}
                </button>
              )}

              {isDashboardTabAllowed('RESERVATIONS', activeClub, activePlan) && (
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
                    <span className="admin-nav-item-tag">
                      {eventReservations.length}
                    </span>
                  )}
                </button>
              )}

              {isDashboardTabAllowed('DOOR_LOG', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'DOOR_LOG' ? 'active' : ''}`}
                  onClick={() => handleTabClick('DOOR_LOG')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <UserCheck size={15} />
                    </span>
                    <span>Bitácora de Puerta</span>
                  </div>
                  {checkedInCount > 0 && (
                    <span className="admin-nav-item-tag admin-nav-item-tag--live">
                      {checkedInCount} IN
                    </span>
                  )}
                </button>
              )}

              {isDashboardTabAllowed('STAFF', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'STAFF' ? 'active' : ''}`}
                  onClick={() => handleTabClick('STAFF')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <Users size={15} />
                    </span>
                    <span>Personal &amp; Meseros</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Section: Comercial & Finanzas (filtrado según plan) */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Comercial &amp; Finanzas</span>
              </span>

              {isDashboardTabAllowed('PRICING', activeClub, activePlan) && (
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
              )}

              {isDashboardTabAllowed('CONSUMPTION', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'CONSUMPTION' ? 'active' : ''}`}
                  onClick={() => handleTabClick('CONSUMPTION')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <Wine size={15} />
                    </span>
                    <span>Catálogo de Consumo</span>
                  </div>
                </button>
              )}

              {isDashboardTabAllowed('TRANSACTIONS', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'TRANSACTIONS' ? 'active' : ''}`}
                  onClick={() => handleTabClick('TRANSACTIONS')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <History size={15} />
                    </span>
                    <span>Cobros &amp; Reembolsos</span>
                  </div>
                </button>
              )}

              {isDashboardTabAllowed('PAYMENTS', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'PAYMENTS' ? 'active' : ''}`}
                  onClick={() => handleTabClick('PAYMENTS')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <CreditCard size={15} />
                    </span>
                    <span>Pasarelas de Pago</span>
                  </div>
                </button>
              )}

              {isDashboardTabAllowed('SUBSCRIPTION', activeClub, activePlan) && (
                <button
                  type="button"
                  className={`admin-nav-item ${currentView === 'DASHBOARD' && dashboardTab === 'SUBSCRIPTION' ? 'active' : ''}`}
                  onClick={() => handleTabClick('SUBSCRIPTION')}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-item-icon">
                      <Crown size={15} />
                    </span>
                    <span>Mi Plan</span>
                  </div>
                  <span
                    className="admin-nav-item-tag"
                    style={{
                      background: 'rgba(229, 181, 79, 0.15)',
                      color: '#e5b54f',
                      borderColor: 'rgba(229, 181, 79, 0.35)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {activeClub.custom_features && activeClub.custom_features.length > 0
                      ? 'VIP'
                      : formatPlanSidebarTag(activeClub.plan_id)}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Section: Gobernanza & Fiscal */}
          {canAccessDashboard && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Gobernanza &amp; Fiscal</span>
              </span>

              {isDashboardTabAllowed('LEGAL', activeClub, activePlan) && (
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
              )}

              {isDashboardTabAllowed('AUDIT', activeClub, activePlan) && (
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
              )}
            </div>
          )}

          {/* Section: Puerta en Vivo (exclusivo si el rol y el plan lo permiten) */}
          {canAccessDoor && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Control de Acceso</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'DOOR' ? 'active' : ''}`}
                onClick={handleDoorClick}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <ScanLine size={15} />
                  </span>
                  <span>Escáner Puerta QR</span>
                </div>
                <span className="admin-nav-item-tag admin-nav-item-tag--live">
                  ACTIVO
                </span>
              </button>
            </div>
          )}

          {/* Section: Terminal Mesero */}
          {canAccessWaiter && (
            <div className="admin-sidebar-section">
              <span className="admin-sidebar-section-title">
                <span>Servicio de Sala</span>
              </span>

              <button
                type="button"
                className={`admin-nav-item ${currentView === 'WAITER' ? 'active' : ''}`}
                onClick={() => {
                  onSelectView('WAITER');
                  onCloseMobile();
                }}
              >
                <div className="admin-nav-item-left">
                  <span className="admin-nav-item-icon">
                    <Wine size={15} />
                  </span>
                  <span>Terminal de Mesero</span>
                </div>
                <span className="admin-nav-item-tag admin-nav-item-tag--live" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  PWA
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Footer with Theme Switch & User Profile */}
        <div className="admin-sidebar-footer">
          <ThemeToggleSwitch variant="detailed" className="admin-sidebar-theme-toggle" />

          <div
            className="admin-user-card"
            onClick={onOpenProfile}
            style={{ cursor: onOpenProfile ? 'pointer' : 'default' }}
            title="Haz clic para ver y editar tu perfil"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <div className="admin-user-avatar" style={{ overflow: 'hidden' }}>
                {session.photoURL ? (
                  <img
                    src={session.photoURL}
                    alt={session.displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  session.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span
                  className="admin-user-name"
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-high, #ffffff)',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {session.displayName}
                </span>
                <span
                  className="admin-user-role"
                  style={{
                    fontSize: '0.6rem',
                    color: roleBadgeColor,
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProfile();
                  }}
                  title="Editar mi perfil"
                  className="admin-icon-btn"
                >
                  <UserCog size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOut();
                }}
                title="Cerrar sesión corporativa"
                className="admin-icon-btn"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

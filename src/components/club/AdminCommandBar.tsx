import React, { useState, useEffect } from 'react';
import { useClubStore } from '../../store/clubStore';
import { Menu, Calendar, ChevronDown, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import type { DashboardTabKey } from './AdminSidebar';

interface AdminCommandBarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'SUPER_ADMIN';
  dashboardTab: DashboardTabKey;
  onOpenMobileMenu: () => void;
}

export const AdminCommandBar: React.FC<AdminCommandBarProps> = ({
  currentView,
  dashboardTab,
  onOpenMobileMenu,
}) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubEvents = store.events.filter(e => e.club_id === activeClub?.id);

  // Live Ecuador Clock (America/Guayaquil)
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString('es-EC', {
          timeZone: 'America/Guayaquil',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumb = () => {
    if (currentView === 'DOOR') {
      return { category: 'Control de Puerta', section: 'Escáner QR en Vivo' };
    }
    if (currentView === 'SUPER_ADMIN') {
      return { category: 'Plataforma SaaS', section: 'Consola SuperAdmin Global' };
    }
    switch (dashboardTab) {
      case 'MONITOR':
        return { category: 'Operaciones', section: 'Sala en Vivo' };
      case 'LAYOUT_BUILDER':
        return { category: 'Operaciones', section: 'Diseñador de Plano & Mesas' };
      case 'RESERVATIONS':
        return { category: 'Operaciones', section: 'Bitácora Oficial de Reservas' };
      case 'PRICING':
        return { category: 'Comercial', section: 'Tarifario & Anticipos' };
      case 'PAYMENTS':
        return { category: 'Finanzas', section: 'Pasarela de Cobros Kushki' };
      case 'LEGAL':
        return { category: 'Gobernanza', section: 'Identidad Legal & SRI' };
      case 'AUDIT':
        return { category: 'Gobernanza', section: 'Bitácora de Auditoría' };
      default:
        return { category: 'Consola', section: 'Panel de Control' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="admin-command-bar">
      {/* Left: Mobile hamburger + Breadcrumbs + Live Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="admin-mobile-toggle"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(229, 181, 79, 0.25)',
            borderRadius: '6px',
            color: 'var(--brand-gold)',
            padding: '6px',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb strip */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>NIGHTFLOW VIP</span>
            <span>/</span>
            <span style={{ color: 'rgba(229, 181, 79, 0.8)', fontWeight: 600 }}>{breadcrumb.category}</span>
          </div>
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            {breadcrumb.section}
          </h2>
        </div>

        {/* Live Ecuador Clock */}
        {localTime && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginLeft: '8px'
          }}>
            <Clock size={11} color="var(--brand-gold)" />
            <span>{localTime}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>ECU</span>
          </div>
        )}
      </div>

      {/* Right: Active Event Selector + Security status badge + Client Portal link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Active Event Selector (only in dashboard) */}
        {currentView === 'DASHBOARD' && clubEvents.length > 0 && (
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(8, 8, 12, 0.85)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            borderRadius: 'var(--radius-xs, 6px)',
            padding: '2px 8px 2px 10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
          }}>
            <Calendar size={13} color="var(--brand-gold)" style={{ marginRight: '6px', flexShrink: 0 }} />
            <select
              value={store.activeEventId}
              onChange={e => store.setActiveEvent(e.target.value)}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '5px 20px 5px 0',
                outline: 'none',
                maxWidth: '180px',
              }}
            >
              {clubEvents.map(e => (
                <option key={e.id} value={e.id} style={{ background: '#0e121a', color: '#fff' }}>
                  {e.day_label} — {e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              color="rgba(229, 181, 79, 0.8)"
              style={{ position: 'absolute', right: '8px', pointerEvents: 'none' }}
            />
          </div>
        )}

        {/* Security / SRI Status Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.72rem',
          color: '#34d399',
          fontWeight: 600,
        }}>
          <ShieldCheck size={13} color="#34d399" />
          <span style={{ letterSpacing: '0.02em' }}>SRI &amp; KMS Activo</span>
        </div>

        {/* Direct Link to Client Portal (5173) */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--brand-gold)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.76rem',
            background: 'rgba(229, 181, 79, 0.1)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(229, 181, 79, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(229, 181, 79, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.3)';
          }}
        >
          <span>Portal Clientes (5173)</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
};

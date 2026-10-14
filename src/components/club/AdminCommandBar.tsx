import React, { useState, useEffect } from 'react';
import { Menu, ExternalLink, Clock, MessageSquareText } from 'lucide-react';
import type { DashboardTabKey } from './AdminSidebar';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';

import type { AdminStaffSession } from '../../lib/adminAuth';

interface AdminCommandBarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'WAITER';
  dashboardTab: DashboardTabKey;
  onOpenMobileMenu: () => void;
  session?: AdminStaffSession;
  onOpenProfile?: () => void;
  onOpenFeedback?: () => void;
}

export const AdminCommandBar: React.FC<AdminCommandBarProps> = ({
  currentView,
  dashboardTab,
  onOpenMobileMenu,
  session,
  onOpenProfile,
  onOpenFeedback,
}) => {
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
    if (currentView === 'WAITER') {
      return { category: 'Servicio de Sala', section: 'Terminal de Mesero PWA' };
    }
    if (currentView === 'DOOR') {
      return { category: 'Control de Puerta', section: 'Escáner QR en Vivo' };
    }
    switch (dashboardTab) {
      case 'MONITOR':
      case 'FLOOR_OPS':
        return { category: 'Operaciones', section: 'Sala & Concierge en Vivo' };
      case 'LAYOUT_BUILDER':
        return { category: 'Operaciones', section: 'Diseñador de Plano' };
      case 'RESERVATIONS':
        return { category: 'Operaciones', section: 'Bitácora Oficial de Reservas' };
      case 'DOOR_LOG':
        return { category: 'Operaciones', section: 'Bitácora de Ingresos en Puerta' };
      case 'PRICING':
        return { category: 'Comercial', section: 'Tarifario & Anticipos' };
      case 'CONSUMPTION':
        return { category: 'Comercial', section: 'Catálogo de Consumo en Sala' };
      case 'TRANSACTIONS':
        return { category: 'Finanzas', section: 'Historial de Cobros & Reembolsos' };
      case 'PAYMENTS':
        return { category: 'Finanzas', section: 'Pasarelas de Pago' };
      case 'STAFF':
        return { category: 'Equipo', section: 'Gestión de Personal & Meseros' };
      case 'SUBSCRIPTION':
        return { category: 'Comercial', section: 'Mi Plan & Propuestas' };
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
      {/* Left: Mobile hamburger + Breadcrumb + Live Clock */}
      <div className="admin-command-bar-left">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="admin-mobile-toggle"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={18} />
        </button>

        <div className="admin-breadcrumb">
          <div className="admin-breadcrumb-path">
            <span>Nightflow</span>
            <span className="sep">/</span>
            <span className="category">{breadcrumb.category}</span>
          </div>
          <h2 className="admin-command-title">{breadcrumb.section}</h2>
        </div>

        {localTime && (
          <div className="admin-clock-chip">
            <Clock size={11} color="var(--brand-gold)" />
            <span>{localTime}</span>
            <span className="tz">ECU</span>
          </div>
        )}
      </div>

      {/* Right: Feedback Button + User Profile Chip + Theme Toggle Switch + Direct Link to Client Portal */}
      <div className="admin-command-bar-right">
        {onOpenFeedback && (
          <button
            type="button"
            onClick={onOpenFeedback}
            className="admin-feedback-btn"
            title="Dar feedback o reportar error al equipo técnico"
          >
            <MessageSquareText size={13} color="var(--brand-gold)" />
            <span>Feedback</span>
          </button>
        )}

        {session && onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Perfil: ${session.displayName}`}
            className="admin-profile-chip"
          >
            <div className="admin-profile-avatar">
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
            <span className="admin-profile-name">
              {session.displayName}
            </span>
          </button>
        )}

        <ThemeToggleSwitch variant="compact" />

        <a
          href={import.meta.env.PROD ? 'https://nightflow-vip.web.app' : 'http://localhost:5173'}
          target="_blank"
          rel="noreferrer"
          className="admin-portal-link"
          aria-label="Abrir el portal de clientes en una nueva pestaña"
        >
          <span>Portal Clientes</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
};

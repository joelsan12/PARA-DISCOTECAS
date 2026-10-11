import React, { useState, useEffect } from 'react';
import { Menu, ExternalLink, Clock } from 'lucide-react';
import type { DashboardTabKey } from './AdminSidebar';

interface AdminCommandBarProps {
  currentView: 'DASHBOARD' | 'DOOR' | 'WAITER';
  dashboardTab: DashboardTabKey;
  onOpenMobileMenu: () => void;
}

export const AdminCommandBar: React.FC<AdminCommandBarProps> = ({
  currentView,
  dashboardTab,
  onOpenMobileMenu,
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
        return { category: 'Operaciones', section: 'Sala en Vivo' };
      case 'FLOOR_OPS':
        return { category: 'Operaciones', section: 'Piso & Concierge' };
      case 'LAYOUT_BUILDER':
        return { category: 'Operaciones', section: 'Diseñador de Plano & Mesas' };
      case 'RESERVATIONS':
        return { category: 'Operaciones', section: 'Bitácora Oficial de Reservas' };
      case 'PRICING':
        return { category: 'Comercial', section: 'Tarifario & Anticipos' };
      case 'PAYMENTS':
        return { category: 'Finanzas', section: 'Pasarela de Cobros Kushki' };
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

      {/* Right: Direct Link to Client Portal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

import { Link, useLocation } from 'react-router-dom';
import { Compass, ExternalLink, Sun, Moon } from 'lucide-react';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { useSaasTheme } from './useSaasTheme';

interface SaasNavbarProps {
  onOpenModal?: (plan?: string) => void;
}

export function SaasNavbar({ onOpenModal }: SaasNavbarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useSaasTheme();

  const navLinks = [
    { to: '/software', label: 'Inicio' },
    { to: '/software/simulador', label: 'Simulador' },
    { to: '/software/arquitectura', label: 'Arquitectura' },
    { to: '/software/pantallas', label: 'Pantallas' },
    { to: '/software/faq', label: 'Preguntas' },
  ];

  const handleCta = () => {
    if (onOpenModal) {
      onOpenModal('Beta Privada');
    }
  };

  return (
    <header className="saas-nav">
      <div className="saas-nav__inner">
        <Link to="/software" className="saas-nav__brand">
          <NightflowLogoMark size={24} theme="gold" />
          <span className="saas-nav__logo-title">NIGHTFLOW VIP</span>
        </Link>

        <nav className="saas-nav__links">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`saas-nav__link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="saas-nav__actions">
          {/* Botón de alternancia de tema claro/oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="saas-theme-toggle"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Cambiar tema claro u oscuro"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon size={15} />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>

          <Link to="/negocios" className="saas-nav__btn-link">
            <Compass size={14} />
            <span>Directorio</span>
          </Link>

          <a
            href="https://nightflow-admin.web.app/"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <span>Acceso Club</span>
            <ExternalLink size={12} />
          </a>

          <button
            type="button"
            onClick={handleCta}
            className="btn-gold"
          >
            Acceso Beta
          </button>
        </div>
      </div>
    </header>
  );
}

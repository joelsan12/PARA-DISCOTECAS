import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { SaasVipPassMockup } from './SaasVipPassMockup';

interface SaasHeroSectionProps {
  onOpenModal?: (plan?: string) => void;
}

export function SaasHeroSection({ onOpenModal }: SaasHeroSectionProps) {
  return (
    <section className="saas-hero-wide saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-hero-split">
          {/* Columna Izquierda Editorial */}
          <div className="saas-hero-content">
            <h1 className="saas-hero__title-wide">
              Vende tus mesas VIP por internet y <span>controla la puerta sin enredos</span>.
            </h1>

            <p className="saas-hero__lead">
              Tus clientes eligen su mesa en un mapa y pagan su anticipo al instante. Sin mesas vendidas dos veces, sin entradas clonadas por capturas de pantalla y con un escáner que funciona incluso si se cae el internet.
            </p>

            <div className="saas-hero__btn-row">
              <Link to="/software/simulador" className="btn-gold">
                <Zap size={14} fill="currentColor" />
                <span>Probar Simulador de Mesas</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => onOpenModal?.('Beta Privada')}
                className="btn-secondary"
              >
                <span>Solicitar Acceso Beta</span>
              </button>
            </div>

            {/* Micro-telemetría de confianza y garantías operativas */}
            <div className="saas-hero__trust">
              <span className="saas-hero__trust-item">
                <span className="saas-hero__trust-dot" aria-hidden="true" />
                <span>HOLDS ATÓMICOS 12 MIN</span>
              </span>
              <span className="saas-hero__trust-sep" aria-hidden="true">·</span>
              <span className="saas-hero__trust-item">
                <span className="saas-hero__trust-dot" aria-hidden="true" />
                <span>OFFLINE ED25519 &lt;50MS</span>
              </span>
              <span className="saas-hero__trust-sep" aria-hidden="true">·</span>
              <span className="saas-hero__trust-item">
                <span className="saas-hero__trust-dot" aria-hidden="true" />
                <span>SRI + 15% IVA COMPLIANT</span>
              </span>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta VIP Black Card compacta */}
          <SaasVipPassMockup />
        </div>
      </div>
    </section>
  );
}

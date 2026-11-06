import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, DoorOpen, Landmark } from 'lucide-react';
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
              Tus mesas VIP vendidas antes de abrir. <span>Tu puerta bajo control.</span>
            </h1>

            <p className="saas-hero__lead">
              Tus clientes eligen su mesa en un mapa y pagan su anticipo al instante. Sin mesas vendidas dos veces, sin entradas clonadas por WhatsApp y con un escáner que funciona incluso si se cae el internet.
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
                <span>Solicitar Acceso Privado</span>
              </button>
            </div>

            {/* Beneficios operativos verificables */}
            <div className="saas-hero__trust">
              <span className="saas-hero__trust-item">
                <ShieldCheck size={13} className="saas-hero__trust-icon" />
                <span>UNA MESA, UN SOLO COMPRADOR</span>
              </span>
              <span className="saas-hero__trust-sep" aria-hidden="true">·</span>
              <span className="saas-hero__trust-item">
                <DoorOpen size={13} className="saas-hero__trust-icon" />
                <span>ESCANEA SIN INTERNET</span>
              </span>
              <span className="saas-hero__trust-sep" aria-hidden="true">·</span>
              <span className="saas-hero__trust-item">
                <Landmark size={13} className="saas-hero__trust-icon" />
                <span>DESGLOSE DE IVA 15% SRI</span>
              </span>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta VIP limpia con interacción memorable */}
          <SaasVipPassMockup />
        </div>
      </div>
    </section>
  );
}

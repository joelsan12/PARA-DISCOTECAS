import { ArrowRight, Sparkles } from 'lucide-react';

interface SaasCtaBannerProps {
  onOpenModal: (plan: string) => void;
}

export function SaasCtaBanner({ onOpenModal }: SaasCtaBannerProps) {
  return (
    <div className="saas-cta-wide">
      <div className="saas-wide-shell">
        <div className="saas-cta-monument">
          <div className="saas-cta-monument__aura" aria-hidden="true" />
          <div className="saas-cta-monument__content">
            <div className="saas-cta-monument__eyebrow">
              <span className="saas-cta-monument__dot" aria-hidden="true" />
              <span>DISPONIBILIDAD INMEDIATA // ECUADOR &amp; LATAM</span>
            </div>
            <h2 className="saas-cta-monument__title">
              Activa tu discoteca para este fin de semana.
            </h2>
            <p className="saas-cta-monument__desc">
              Subimos el plano interactivo de tus mesas y capacitamos a tu equipo en menos de 24 horas. Cero contratos forzados ni hardware costoso.
            </p>
            <div className="saas-cta-monument__actions">
              <button
                type="button"
                className="btn-gold saas-cta-monument__btn"
                onClick={() => onOpenModal('Beta Privada')}
              >
                <Sparkles size={16} />
                <span>Solicitar Acceso a la Beta VIP</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="saas-cta-monument__meta">
              <span>● Despliegue en 24h</span>
              <span className="saas-cta-sep">·</span>
              <span>● Sin tarjeta requerida</span>
              <span className="saas-cta-sep">·</span>
              <span>● Soporte en vivo a las 02:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

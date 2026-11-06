import { ArrowRight } from 'lucide-react';

interface SaasCtaBannerProps {
  onOpenModal: (plan: string) => void;
}

const GUARANTEES = [
  'DESPLIEGUE EN 24H',
  'SIN TARJETA REQUERIDA',
  'SOPORTE EN VIVO A LAS 02:00 AM',
];

export function SaasCtaBanner({ onOpenModal }: SaasCtaBannerProps) {
  return (
    <div className="saas-cta-wide">
      <div className="saas-wide-shell">
        <div className="saas-cta-monument">
          <div className="saas-cta-monument__content">
            <div className="saas-cta-monument__eyebrow">
              <span className="saas-cta-monument__dot" aria-hidden="true" />
              <span>SOLICITUD DE ADMISIÓN</span>
            </div>
            <h2 className="saas-cta-monument__title">
              Tu local listo para este fin de semana.
            </h2>
            <p className="saas-cta-monument__desc">
              Configuramos el mapa de tus mesas y capacitamos a tu equipo de puerta en
              menos de 24 horas. Sin contratos forzados y sin hardware propietario.
            </p>
            <div className="saas-cta-monument__actions">
              <button
                type="button"
                className="btn-gold saas-cta-monument__btn"
                onClick={() => onOpenModal('Beta Privada')}
              >
                <span>Solicitar Credencial de Acceso</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="saas-cta-monument__meta">
              {GUARANTEES.map((item) => (
                <span key={item} className="saas-cta-monument__meta-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

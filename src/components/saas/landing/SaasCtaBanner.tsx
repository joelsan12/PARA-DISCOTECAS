import { ArrowRight } from 'lucide-react';

interface SaasCtaBannerProps {
  onOpenModal: (plan: string) => void;
}

export function SaasCtaBanner({ onOpenModal }: SaasCtaBannerProps) {
  return (
    <div className="saas-cta-wide">
      <div className="saas-wide-shell">
        <div className="saas-cta-wide__box">
          <div>
            <h2>Activa tu discoteca para este fin de semana.</h2>
            <p>Subimos el mapa de tus mesas y dejamos listo el sistema para tu equipo en menos de 24 horas.</p>
          </div>
          <button
            type="button"
            className="btn-gold"
            onClick={() => onOpenModal('Beta Privada')}
            style={{ padding: '14px 32px', fontSize: '0.94rem' }}
          >
            <span>Solicitar Acceso a la Beta</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

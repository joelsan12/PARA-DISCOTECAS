import React from 'react';
import { Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface SaasBetaTeaserBannerProps {
  onOpenBetaModal: () => void;
}

export const SaasBetaTeaserBanner: React.FC<SaasBetaTeaserBannerProps> = ({ onOpenBetaModal }) => {
  return (
    <section className="saas-beta-teaser-section">
      <div className="saas-wide-shell">
        <div className="saas-beta-teaser-box">
          <div className="saas-beta-teaser-left">
            <div className="saas-beta-badge-row" style={{ marginBottom: '10px' }}>
              <span className="saas-beta-pulse-dot" />
              <span className="saas-beta-badge-text">KERNEL v2.6.4 // COCKPIT OPERATIVO EN VIVO</span>
            </div>

            <h3 className="saas-beta-teaser-title">
              Consola de Mando VIP & Simulador de Alta Concurrencia
            </h3>

            <p className="saas-beta-teaser-desc">
              Explora en tiempo real la suite completa: plano cenital reactivo, escáner óptico con verificación KMS Ed25519 en 0.04s, tokenización Black Card y despacho a barra.
            </p>

            <div className="saas-beta-teaser-chips">
              <span className="saas-beta-teaser-chip">
                <Zap size={13} color="var(--brand-gold, #e5b54f)" />
                5 Terminales de Mando
              </span>
              <span className="saas-beta-teaser-chip">
                <ShieldCheck size={13} color="var(--state-success, #34d399)" />
                0.04s Latencia de Puerta
              </span>
            </div>
          </div>

          <div className="saas-beta-teaser-right">
            <button
              type="button"
              onClick={onOpenBetaModal}
              className="btn-gold saas-beta-teaser-btn"
            >
              <Sparkles size={16} />
              <span>Abrir Cockpit de Mando</span>
              <ArrowRight size={15} />
            </button>
            <span className="saas-beta-teaser-note">
              Acceso libre interactivo sin instalación
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

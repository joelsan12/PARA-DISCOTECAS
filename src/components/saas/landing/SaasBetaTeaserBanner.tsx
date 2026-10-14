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
              <span className="saas-beta-badge-text">FASE BETA ABIERTA 2026</span>
            </div>

            <h3 className="saas-beta-teaser-title">
              Prueba los 5 Módulos Operativos en Vivo
            </h3>

            <p className="saas-beta-teaser-desc">
              Consola interactiva de sala, escáner criptográfico offline en 0.04s, reservas 3D, comandas PWA de meseros y diseñador de planos.
            </p>

            <div className="saas-beta-teaser-chips">
              <span className="saas-beta-teaser-chip">
                <Zap size={13} color="#e5b54f" />
                5 Módulos Listos
              </span>
              <span className="saas-beta-teaser-chip">
                <ShieldCheck size={13} color="#34d399" />
                100% en Navegador
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
              <span>Abrir Entorno de Pruebas</span>
              <ArrowRight size={15} />
            </button>
            <span className="saas-beta-teaser-note">
              Acceso libre sin registro forzado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

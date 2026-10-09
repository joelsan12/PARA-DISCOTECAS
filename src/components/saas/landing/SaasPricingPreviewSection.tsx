import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SaasPricingPreviewSectionProps {
  onOpenModal: (plan: string) => void;
}

export function SaasPricingPreviewSection({ onOpenModal }: SaasPricingPreviewSectionProps) {
  return (
    <section className="saas-pricing-summary saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <span className="saas-badge-gold">PLANES TRANSPARENTES</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="saas-section-title-left">Comienza Gratis o Escala desde $5/mes</h2>
              <p className="saas-section-desc-left">
                Sin comisiones sobre tu facturación ni contratos obligatorios.
              </p>
            </div>
            <Link to="/software/planes" className="btn-secondary" style={{ padding: '10px 20px' }}>
              <span>Ver Tabla Comparativa Completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="saas-pricing-grid" style={{ marginTop: '28px' }}>
          {/* Lounge Free */}
          <div className="saas-plan-card">
            <div className="saas-plan-name">Lounge Free</div>
            <div className="saas-plan-desc">Bares, pubs y rooftops pequeños.</div>
            <div className="saas-plan-price-row">
              <span className="saas-plan-amount">$0</span>
              <span className="saas-plan-cycle">/mes</span>
            </div>
            <ul className="saas-plan-features">
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Hasta 8 mesas en sala</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>2 eventos por mes</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Reservas a WhatsApp</span></li>
            </ul>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpenModal('Lounge Free')}
              style={{ width: '100%' }}
            >
              Comenzar Gratis
            </button>
          </div>

          {/* Starter Club */}
          <div className="saas-plan-card">
            <div className="saas-plan-name">Starter Club</div>
            <div className="saas-plan-desc">Discotecas en crecimiento.</div>
            <div className="saas-plan-price-row">
              <span className="saas-plan-amount">$5</span>
              <span className="saas-plan-cycle">USD / mes</span>
            </div>
            <ul className="saas-plan-features">
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>16 mesas con plano</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>6 eventos por mes</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>1 escáner de puerta QR</span></li>
            </ul>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpenModal('Starter Club')}
              style={{ width: '100%' }}
            >
              Elegir Starter
            </button>
          </div>

          {/* Club Pro */}
          <div className="saas-plan-card featured">
            <span className="saas-plan-badge">MÁS POPULAR</span>
            <div className="saas-plan-name">Club Pro</div>
            <div className="saas-plan-desc">Clubes con anticipos online y múltiples puertas.</div>
            <div className="saas-plan-price-row">
              <span className="saas-plan-amount gold">$15</span>
              <span className="saas-plan-cycle">USD / mes</span>
            </div>
            <ul className="saas-plan-features">
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>45 mesas con diseñador</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Eventos ilimitados</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Pasarela Kushki directa</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>4 terminales de puerta</span></li>
            </ul>
            <button
              type="button"
              className="btn-gold"
              onClick={() => onOpenModal('Club Pro')}
              style={{ width: '100%' }}
            >
              Elegir Club Pro
            </button>
          </div>

          {/* Black VIP */}
          <div className="saas-plan-card">
            <div className="saas-plan-name">Black VIP</div>
            <div className="saas-plan-desc">Macro-discotecas, festivales y cadenas.</div>
            <div className="saas-plan-price-row">
              <span className="saas-plan-amount">$45</span>
              <span className="saas-plan-cycle">USD / mes</span>
            </div>
            <ul className="saas-plan-features">
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Mesas ilimitadas</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Multi-sala &amp; palcos</span></li>
              <li className="saas-plan-feature"><CheckCircle2 size={13} /><span>Bitácora forense de caja</span></li>
            </ul>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpenModal('Black VIP')}
              style={{ width: '100%' }}
            >
              Elegir Black VIP
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

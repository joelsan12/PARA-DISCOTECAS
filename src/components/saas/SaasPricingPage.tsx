import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import { INITIAL_PLANS } from '../../data/mockPlans';
import '../../styles/saas-landing/index.css';

export function SaasPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Club Pro');

  const openModalWith = (plan: string) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const plans = INITIAL_PLANS
    .filter(p => ['free', 'starter', 'club_pro', 'black_vip'].includes(p.id))
    .map(p => ({
      name: p.name,
      desc: p.description || '',
      price: p.monthly_price === 0
        ? '$0'
        : (billingCycle === 'annual' ? `$${p.annual_price}` : `$${p.monthly_price}`),
      cycle: p.monthly_price === 0
        ? '/mes'
        : (billingCycle === 'annual' ? 'USD / año' : 'USD / mes'),
      featured: p.id === 'club_pro',
      badge: p.id === 'club_pro' ? 'MÁS POPULAR' : undefined,
      features: p.features,
      ctaText: p.id === 'free' ? 'Comenzar Gratis' : `Elegir ${p.name}`,
      ctaClass: p.id === 'club_pro' ? 'btn-gold' : 'btn-secondary',
    }));

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={(p) => openModalWith(p || 'Club Pro')} />

      <main className="saas-main">
        <div className="saas-wide-shell">
          <div className="saas-page-header">
            <Link to="/software" className="saas-back-link">
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <div className="saas-badge-gold">TARIFARIO TRANSPARENTE</div>
            <h1 className="saas-page-title">
              Planes Diseñados para Escalar con tu Discoteca
            </h1>
            <p className="saas-page-lead">
              Comienza 100% gratis con Lounge Free o potencia la operación completa de tu sala desde $5 al mes. Sin comisiones sorpresa sobre tu facturación ni contratos forzosos.
            </p>
          </div>

          {/* Switch de ciclo de facturación */}
          <div className="saas-pricing-switch" style={{ justifyContent: 'flex-start', marginBottom: '40px' }}>
            <div className="saas-switch-box">
              <button
                type="button"
                className={`saas-switch-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annual')}
              >
                PAGO ANUAL (-17% DE DESCUENTO)
              </button>
              <button
                type="button"
                className={`saas-switch-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                PAGO MENSUAL
              </button>
            </div>
          </div>

          {/* Cuadrícula de 4 tarjetas de planes */}
          <div className="saas-pricing-grid">
            {plans.map((p) => (
              <div key={p.name} className={`saas-plan-card ${p.featured ? 'featured' : ''}`}>
                {p.badge && <span className="saas-plan-badge">{p.badge}</span>}
                <div className="saas-plan-name">{p.name}</div>
                <div className="saas-plan-desc">{p.desc}</div>

                <div className="saas-plan-price-row">
                  <span className={`saas-plan-amount ${p.featured ? 'gold' : ''}`}>
                    {p.price}
                  </span>
                  <span className="saas-plan-cycle">{p.cycle}</span>
                </div>

                <ul className="saas-plan-features">
                  {p.features.map((f, i) => (
                    <li key={i} className="saas-plan-feature">
                      <CheckCircle2 size={14} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={p.ctaClass}
                  onClick={() => openModalWith(p.name)}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <span>{p.ctaText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="saas-legal-notice" style={{ marginTop: '32px' }}>
            Precios en USD. Aplica +15% de IVA según normativa del SRI en Ecuador. Sin penalizaciones por cancelación.
          </div>

          {/* Tabla Comparativa Amplia */}
          <div className="saas-comparison-block" style={{ marginTop: '56px' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--saas-text-primary)', marginBottom: '24px' }}>
              Tabla Comparativa de Capacidades
            </h2>
            <div className="saas-comparison-table-wrapper">
              <table className="saas-comparison-table">
                <thead>
                  <tr>
                    <th>Característica</th>
                    <th>Lounge Free</th>
                    <th>Starter Club</th>
                    <th className="highlight-col">Club Pro</th>
                    <th>Black VIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Mesas en plano</td>
                    <td>8</td>
                    <td>16</td>
                    <td className="highlight-col">45</td>
                    <td>Ilimitadas</td>
                  </tr>
                  <tr>
                    <td>Eventos mensuales</td>
                    <td>2</td>
                    <td>6</td>
                    <td className="highlight-col">Ilimitados</td>
                    <td>Ilimitados</td>
                  </tr>
                  <tr>
                    <td>Escáner de puerta QR</td>
                    <td>-</td>
                    <td>1 terminal</td>
                    <td className="highlight-col">4 terminales</td>
                    <td>Ilimitadas</td>
                  </tr>
                  <tr>
                    <td>Cobro de anticipos (Kushki)</td>
                    <td>-</td>
                    <td>-</td>
                    <td className="highlight-col">Directo a tu banco</td>
                    <td>Directo a tu banco</td>
                  </tr>
                  <tr>
                    <td>Operación Offline a las 02:00 AM</td>
                    <td>-</td>
                    <td>Básica</td>
                    <td className="highlight-col">NIGHTFLOW Edge</td>
                    <td>NIGHTFLOW Edge + Sync</td>
                  </tr>
                  <tr>
                    <td>Reingreso con Passkey Biométrica</td>
                    <td>-</td>
                    <td>-</td>
                    <td className="highlight-col">Incluido</td>
                    <td>Incluido</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <SaasFooterBar />
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}

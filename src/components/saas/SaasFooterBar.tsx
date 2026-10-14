import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { NightflowLogoMark } from '../common/NightflowLogo';

export function SaasFooterBar() {
  return (
    <footer className="saas-footer">
      <div className="saas-wide-shell">
        <div className="saas-footer__top">
          {/* Columna Marca & Misión Operativa */}
          <div className="saas-footer__brand-block">
            <div className="saas-footer__brand-header">
              <NightflowLogoMark size={22} theme="gold" />
              <span className="saas-footer__brand-name">NIGHTFLOW VIP</span>
            </div>

            <p className="saas-footer__brand-desc">
              El sistema operativo de alta disponibilidad para vender mesas VIP, sincronizar consumos en barra y blindar el acceso en discotecas y clubes nocturnos sin caídas.
            </p>

            <div className="saas-footer__status-badge">
              <span className="saas-footer__status-dot" />
              <span>SLA 99.9% · Noche 02:00 AM Ready</span>
            </div>

            <div className="saas-footer__tags">
              <span>Discotecas</span>
              <span className="saas-footer__tag-sep">·</span>
              <span>Rooftops</span>
              <span className="saas-footer__tag-sep">·</span>
              <span>Lounges VIP</span>
              <span className="saas-footer__tag-sep">·</span>
              <span>Festivales</span>
            </div>
          </div>

          {/* Enlaces y Navegación en Columnas Holgadas */}
          <div className="saas-footer__links-grid">
            <div className="saas-footer__col">
              <span className="saas-footer__col-title">Plataforma</span>
              <Link to="/software">Inicio / Resumen</Link>
              <Link to="/software/simulador">Simulador en Vivo</Link>
              <Link to="/software/precios">Tarifario y Planes</Link>
              <Link to="/software/arquitectura">Arquitectura &amp; Edge</Link>
              <Link to="/software/pantallas">Galería de Interfaces</Link>
            </div>

            <div className="saas-footer__col">
              <span className="saas-footer__col-title">Ecosistema</span>
              <Link to="/software" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Acceso Beta Privada</span>
                <span className="saas-footer__badge-pill">Activa</span>
              </Link>
              <Link to="/software/faq">Preguntas Frecuentes</Link>
              <Link to="/negocios">Directorio de Clubes</Link>
              <a
                href="https://nightflow-admin.web.app/"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Consola para Clubes</span>
                <ArrowUpRight size={13} style={{ opacity: 0.8 }} />
              </a>
              <Link to="/dev">Portal Dev &amp; APIs</Link>
            </div>

            <div className="saas-footer__col">
              <span className="saas-footer__col-title">
                <ShieldCheck size={14} style={{ color: 'var(--saas-gold)' }} />
                <span>Cumplimiento</span>
              </span>
              <span className="saas-footer__compliance-item">
                <span className="saas-footer__compliance-bullet" />
                <span>Ecuador &amp; Latam</span>
              </span>
              <span className="saas-footer__compliance-item">
                <span className="saas-footer__compliance-bullet" />
                <span>SRI Compliant (+15% IVA)</span>
              </span>
              <span className="saas-footer__compliance-item">
                <span className="saas-footer__compliance-bullet" />
                <span>Protección LOPDP Art. 15</span>
              </span>
              <span className="saas-footer__compliance-item">
                <span className="saas-footer__compliance-bullet" />
                <span>Criptografía Ed25519</span>
              </span>
              <span className="saas-footer__compliance-item">
                <span className="saas-footer__compliance-bullet" />
                <span>Passkey Biométrica</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fila Inferior de Copyright & Disclaimer Holgada */}
        <div className="saas-footer__bottom">
          <div className="saas-footer__bottom-left">
            <span>&copy; {new Date().getFullYear()} NIGHTFLOW VIP. Todos los derechos reservados.</span>
            <span className="saas-footer__cities">Quito · Guayaquil · Cuenca · Latam</span>
          </div>
          <div className="saas-footer__bottom-right">
            <span>Desarrollado para la noche que opera sin fallos a las 02:00 AM.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

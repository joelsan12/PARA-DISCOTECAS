import { Link } from 'react-router-dom';
import { NightflowLogoMark } from '../common/NightflowLogo';

export function SaasFooterBar() {
  return (
    <footer className="saas-footer">
      <div className="saas-wide-shell">
        <div className="saas-footer__top">
          <div className="saas-footer__brand-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <NightflowLogoMark size={20} theme="gold" />
              <span className="saas-nav__logo-title" style={{ fontSize: '1.05rem' }}>NIGHTFLOW VIP</span>
            </div>
            <p style={{ color: 'var(--saas-text-secondary)', fontSize: '0.82rem', margin: 0, maxWidth: '360px', lineHeight: 1.5 }}>
              El sistema para vender mesas VIP y controlar los accesos en discotecas y clubes nocturnos sin errores.
            </p>
          </div>

          <div className="saas-footer__links-grid">
            <div className="saas-footer__col">
              <span className="saas-footer__col-title">Plataforma</span>
              <Link to="/software">Inicio / Resumen</Link>
              <Link to="/software/simulador">Simulador en Vivo</Link>
              <Link to="/software/arquitectura">Arquitectura &amp; Edge</Link>
              <Link to="/software/pantallas">Galería de Interfaces</Link>
            </div>

            <div className="saas-footer__col">
              <span className="saas-footer__col-title">Comunidad</span>
              <span style={{ color: 'var(--saas-gold)', fontSize: '0.78rem' }}>Acceso Beta Privada</span>
              <Link to="/software/faq">Preguntas Frecuentes</Link>
              <Link to="/negocios">Directorio de Clubes</Link>
              <a href="https://nightflow-admin.web.app/" target="_blank" rel="noreferrer">
                Consola para Clubes ↗
              </a>
            </div>

            <div className="saas-footer__col">
              <span className="saas-footer__col-title">Cumplimiento</span>
              <span>Ecuador &amp; Latam</span>
              <span>SRI Compliant (+15% IVA)</span>
              <span>Protección LOPDP Art. 15</span>
              <span>Criptografía Ed25519</span>
            </div>
          </div>
        </div>

        <div className="saas-footer__bottom">
          <span>&copy; {new Date().getFullYear()} NIGHTFLOW VIP. Todos los derechos reservados.</span>
          <span>Desarrollado para la noche que opera sin fallos a las 02:00 AM.</span>
        </div>
      </div>
    </footer>
  );
}

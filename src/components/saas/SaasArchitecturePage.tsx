import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  WifiOff,
  Cpu,
  KeyRound,
  Fingerprint,
  RefreshCw,
  Database
} from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

export function SaasArchitecturePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={() => setIsModalOpen(true)} />

      <main className="saas-main">
        <div className="saas-wide-shell">
          <div className="saas-page-header">
            <Link to="/software" className="saas-back-link">
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <div className="saas-badge-gold">INGENIERÍA PARA LA NOCHE</div>
            <h1 className="saas-page-title">
              Cómo protegemos tu discoteca para que opere sin fallos a las 02:00 AM
            </h1>
            <p className="saas-page-lead">
              Un sábado por la noche no puedes arriesgarte a que se vendan mesas dos veces, que personas se cuelen con capturas de pantalla reenviadas por WhatsApp o que la entrada colapse si se cae el internet. Aquí te explicamos cómo NIGHTFLOW VIP cuida tu negocio en cada detalle.
            </p>
          </div>

          {/* Tres Grandes Pilares de Protección */}
          <div className="saas-arch-sections">
            {/* Pilar 1 */}
            <div className="saas-arch-block">
              <div className="saas-arch-block__header">
                <div className="saas-arch-block__icon">
                  <Database size={24} color="var(--saas-gold)" />
                </div>
                <div>
                  <span className="saas-badge-gold">01 // CERO MESAS VENDIDAS DOS VECES</span>
                  <h2>Apartado de 12 minutos: Si un cliente está pagando, nadie más puede quitársela</h2>
                </div>
              </div>
              <p className="saas-arch-block__text">
                En una noche concurrida, varios clientes o promotores intentan reservar la misma mesa VIP al mismo tiempo. Para evitar discusiones y sobreventas, el sistema congela la mesa elegida durante exactamente 12 minutos mientras la persona completa su pago:
              </p>
              <div className="saas-arch-steps">
                <div className="saas-arch-step-item">
                  <strong>1. MESA LIBRE</strong>
                  <span>Visible en el mapa de tu local para que cualquier cliente o promotor pueda verla y seleccionarla.</span>
                </div>
                <div className="saas-arch-step-item highlight">
                  <strong>2. APARTADA (12 MIN)</strong>
                  <span>El sistema la congela al instante con un reloj en cuenta regresiva. Nadie más puede seleccionarla ni pagarla.</span>
                </div>
                <div className="saas-arch-step-item">
                  <strong>3. PAGO DEL ANTICIPO</strong>
                  <span>El cliente paga con tarjeta o transferencia segura. El anticipo va directo a la cuenta bancaria de tu club.</span>
                </div>
                <div className="saas-arch-step-item success">
                  <strong>4. CONFIRMADA AL 100%</strong>
                  <span>Mesa vendida. El cliente recibe en su teléfono su pase VIP oficial listo para ingresar por la puerta.</span>
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="saas-arch-block">
              <div className="saas-arch-block__header">
                <div className="saas-arch-block__icon">
                  <KeyRound size={24} color="var(--saas-gold)" />
                </div>
                <div>
                  <span className="saas-badge-gold">02 // ENTRADAS ANTI-PANTALLAZO</span>
                  <h2>Pases VIP que cambian solos: Imposible compartirlos o duplicarlos por chat</h2>
                </div>
              </div>
              <p className="saas-arch-block__text">
                Una entrada normal en PDF o imagen se puede reenviar a 20 personas por WhatsApp para que todas intenten entrar gratis. En NIGHTFLOW VIP cada entrada está viva y protegida con tecnología de seguridad bancaria:
              </p>
              <div className="saas-feature-columns">
                <div className="saas-feature-point">
                  <RefreshCw size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>El código cambia cada 30 segundos</h4>
                    <p>El código QR se actualiza constantemente. Si un cliente le toma una captura de pantalla a las 10:00 PM y se la pasa a un amigo, para cuando lleguen a la puerta a medianoche la foto ya estará vencida e inservible.</p>
                  </div>
                </div>
                <div className="saas-feature-point">
                  <Fingerprint size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>Pertenece a un solo teléfono</h4>
                    <p>La entrada queda vinculada exclusivamente al celular del comprador original. Nadie puede abrirla en otro teléfono para intentar colarse sin permiso.</p>
                  </div>
                </div>
                <div className="saas-feature-point">
                  <Shield size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>Control de múltiples puertas</h4>
                    <p>Si dos personas intentan usar la misma entrada al mismo tiempo en dos accesos diferentes de tu club, el sistema lo detecta de inmediato y solo deja pasar a la primera.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="saas-arch-block">
              <div className="saas-arch-block__header">
                <div className="saas-arch-block__icon">
                  <WifiOff size={24} color="var(--saas-gold)" />
                </div>
                <div>
                  <span className="saas-badge-gold">03 // FUNCIONA INCLUSO SIN INTERNET</span>
                  <h2>Tu entrada sigue escaneando aunque se caiga el internet o no haya señal</h2>
                </div>
              </div>
              <p className="saas-arch-block__text">
                Las discotecas suelen estar en sótanos, zonas con paredes gruesas o áreas con saturación celular extrema. La fila de tu entrada no puede detenerse ni un segundo si la red falla:
              </p>
              <div className="saas-feature-columns">
                <div className="saas-feature-point">
                  <Cpu size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>Escaneo ultra rápido en 0.04s</h4>
                    <p>El teléfono del portero verifica la autenticidad de la entrada directamente en su cámara, sin tener que esperar a que un servidor lejano responda. La fila avanza sin pausas.</p>
                  </div>
                </div>
                <div className="saas-feature-point">
                  <Database size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>Guarda los accesos en memoria</h4>
                    <p>Si no hay señal, el teléfono del guardia sigue admitiendo entradas y las guarda en su memoria segura. En cuanto vuelve el internet, actualiza el aforo automáticamente.</p>
                  </div>
                </div>
                <div className="saas-feature-point">
                  <Shield size={18} color="var(--saas-gold)" />
                  <div>
                    <h4>Avisos discretos de seguridad</h4>
                    <p>Si alguien presenta una entrada duplicada mientras no había conexión, el sistema registra una alerta discreta para que el jefe de seguridad revise el caso sin armar alboroto en la fila.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="saas-page-cta">
            <div>
              <h3>¿Listo para proteger la entrada y las mesas de tu discoteca?</h3>
              <p>Cargamos el plano de tu local y dejamos las terminales listas para tu equipo en menos de 24 horas.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/software/simulador" className="btn-secondary" style={{ padding: '12px 22px' }}>
                Probar en el Simulador
              </Link>
              <button
                type="button"
                className="btn-gold"
                onClick={() => setIsModalOpen(true)}
                style={{ padding: '12px 26px' }}
              >
                <span>Solicitar Activación</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <SaasFooterBar />
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

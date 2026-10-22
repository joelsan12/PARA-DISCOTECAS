import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  Smartphone,
  Shield,
  Layers,
  FileSpreadsheet,
  Maximize2,
  X,
  Lock,
} from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

type ScreenId = 'dashboard' | 'door' | 'door-logs' | 'designer' | 'reservations';

interface ScreenItem {
  id: ScreenId;
  label: string;
  icon: typeof Monitor;
  title: string;
  desc: string;
  img: string;
  type: 'desktop' | 'mobile';
  url: string;
  telemetry: string;
  points: string[];
}

export function SaasScreensPage() {
  const [activeTab, setActiveTab] = useState<ScreenId>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const screens: ScreenItem[] = [
    {
      id: 'dashboard',
      label: '1. Consola de Sala en Vivo',
      icon: Monitor,
      title: 'Consola Central de Operaciones & Concierge en Vivo',
      desc: 'Supervisión en tiempo real del plano cenital de mesas, aforo actual, anticipos recaudados por pasarela bancaria y estados de consumo para gerencia y barra.',
      img: '/showcase/panel-admin-plano.jpg',
      type: 'desktop',
      url: 'https://nightflow.vip/admin/consola/sala-vivo',
      telemetry: 'LATENCIA < 20MS · 12 MESAS EN SALA · LIVE SYNC',
      points: [
        'Mapa interactivo de mesas con código de estados (En Sala, Hold 12 min, Reservada, Cerrada, Disponible).',
        'Total de anticipos cobrados y consumos mínimos en tiempo real.',
        'Sincronización instantánea con terminales PWA de meseros y barra 360°.',
        'Liberación forzada o reasignación manual de mesas con 1 solo clic.'
      ]
    },
    {
      id: 'door',
      label: '2. Escáner de Puerta PWA',
      icon: Smartphone,
      title: 'Terminal Criptográfica de Puerta (KMS Ed25519)',
      desc: 'Interfaz para porteros y guardias de seguridad en cualquier smartphone. Verificación óptica en menos de 0.04s, detección infalible de capturas reenviadas con token dinámico y operación offline ininterrumpida.',
      img: '/showcase/door-scanner-vip.jpg',
      type: 'mobile',
      url: 'https://nightflow.vip/puerta/terminal-01',
      telemetry: 'OPTICAL RETICLE · KMS Ed25519 · BUFFER IDB 100%',
      points: [
        'Lectura de código QR en 0.04 segundos verificada por hardware KMS.',
        'Protección anti-screenshot con token dinámico rotativo cada 30 segundos.',
        'Operación 100% offline con almacenamiento en IndexedDB cifrada.',
        'Confirmación de check-in y registro de salida temporal con passkey.'
      ]
    },
    {
      id: 'door-logs',
      label: '3. Bitácora de Accesos',
      icon: Shield,
      title: 'Bitácora Oficial de Ingresos en Puerta (Turno Nocturno)',
      desc: 'Registro inmutable de admisiones, check-ins validados y aforo en tiempo real. Trazabilidad absoluta de titulares, códigos de pases (#VIP-XXXX) y hora de entrada.',
      img: '/showcase/panel-admin-bitacora-puerta.jpg',
      type: 'desktop',
      url: 'https://nightflow.vip/admin/bitacora-puerta',
      telemetry: 'REGISTRO INMUTABLE · AFORO AUDITADO · EXPORTABLE CSV',
      points: [
        'Bitácora segundo a segundo con hora exacta de admisión y número de invitados.',
        'Control de aforo real en sala (ingresados vs. reservas pendientes por llegar).',
        'Alerta automática ante colisiones o intentos de reutilización de pases.',
        'Exportación de bitácora transaccional a formato CSV para auditoría.'
      ]
    },
    {
      id: 'designer',
      label: '4. Diseñador CAD de Plano',
      icon: Layers,
      title: 'Estudio CAD de Arquitectura de Sala & Mesas',
      desc: 'Editor visual escalado para diseñar la distribución de tu club: mesas circulares, cápsulas, rectangulares, suites VIP, cabina DJ y barras perimetrales con imán magnético al 1%.',
      img: '/showcase/panel-admin-disenador-plano.jpg',
      type: 'desktop',
      url: 'https://nightflow.vip/admin/disenador-plano',
      telemetry: 'IMÁN 1% · GUÍAS LÁSER · PREVIEW CLIENTE 1-CLIC',
      points: [
        'Dibujo vectorial milimétrico con coordenadas X/Y reales y giro de orientación.',
        'Asignación de categorías de color (Oro VIP, Gradas, Palcos Elevados, Pista).',
        'Configuración de consumos mínimos y tarifas según temporada o evento.',
        'Publicación instantánea sin necesidad de compilaciones ni redespliegues.'
      ]
    },
    {
      id: 'reservations',
      label: '5. Reservas & Anticipos SRI',
      icon: FileSpreadsheet,
      title: 'Bitácora Oficial de Reservas & Cumplimiento Fiscal',
      desc: 'Control integral de clientes, anticipos recaudados a través de pasarelas bancarias ecuatorianas, números de contacto (+593) y facturación con 15% de IVA.',
      img: '/showcase/panel-admin-reservas.jpg',
      type: 'desktop',
      url: 'https://nightflow.vip/admin/reservas-anticipos',
      telemetry: 'KUSHKI / PAYPHONE · SRI 15% IVA · COBRO DIRECTO',
      points: [
        'Gestión centralizada de depósitos retenidos y anticipos acreditados a tu cuenta.',
        'Búsqueda rápida por nombre de cliente, código de pase (#VIP) o número de mesa.',
        'Validación biométrica Passkey y estados de ingreso en vivo.',
        'Cumplimiento tributario conforme a la Ley de Protección de Datos (LOPDP).'
      ]
    }
  ];

  const current = screens.find((s) => s.id === activeTab) || screens[0];

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
            <div className="saas-badge-gold">INTERFACES EN PRODUCCIÓN</div>
            <h1 className="saas-page-title">
              Diseñado para la Oscuridad y la Velocidad de la Sala
            </h1>
            <p className="saas-page-lead">
              NIGHTFLOW VIP sincroniza en milisegundos todas las áreas del establecimiento: desde la consola de gerencia y barra hasta la terminal del guardia y la bitácora fiscal de reservas.
            </p>
          </div>

          {/* Selector de pantallas */}
          <div className="saas-screens-tabs" style={{ justifyContent: 'flex-start', marginBottom: '28px' }}>
            {screens.map((s) => {
              const IconComp = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`saas-screen-tab ${activeTab === s.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(s.id)}
                >
                  <IconComp size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ventana de Sistema de Alta Gama */}
          <div className="saas-screen-window">
            <div className="saas-window-chrome">
              <div className="saas-window-dots">
                <span className="saas-window-dot saas-window-dot--red" />
                <span className="saas-window-dot saas-window-dot--yellow" />
                <span className="saas-window-dot saas-window-dot--green" />
              </div>
              <div className="saas-window-url-bar">
                <Lock size={11} style={{ color: 'var(--saas-gold)' }} />
                <span>{current.url}</span>
              </div>
              <div className="saas-window-telemetry">
                <span>{current.telemetry}</span>
              </div>
            </div>

            {/* Visor de la pantalla con botón de ampliación */}
            <div className={`saas-screen-viewport ${current.type === 'mobile' ? 'saas-screen-viewport--mobile' : 'saas-screen-viewport--desktop'}`}>
              <button
                type="button"
                className="saas-screen-zoom-btn"
                onClick={() => setIsLightboxOpen(true)}
                title="Ampliar captura en alta resolución"
              >
                <Maximize2 size={13} />
                <span>Ampliar Resolución 4K</span>
              </button>
              <img
                src={current.img}
                alt={current.title}
                onClick={() => setIsLightboxOpen(true)}
              />
            </div>

            <div className="saas-screen-caption">
              <div>
                <strong style={{ color: 'var(--saas-text-primary)', display: 'block', fontSize: '0.96rem', marginBottom: '4px' }}>
                  {current.title}
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--saas-text-secondary)', lineHeight: 1.5 }}>
                  {current.desc}
                </span>
              </div>
            </div>
          </div>

          {/* Puntos clave de esta interfaz */}
          <div className="saas-screen-details" style={{ marginTop: '36px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--saas-text-primary)', marginBottom: '18px' }}>
              Capacidades de esta interfaz:
            </h3>
            <div className="saas-points-grid">
              {current.points.map((pt, i) => (
                <div key={i} className="saas-point-card">
                  <Shield size={16} color="var(--saas-gold)" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Footer */}
          <div className="saas-page-cta">
            <div>
              <h3>¿Quieres personalizar estas interfaces con el logo de tu club?</h3>
              <p>Cada local cuenta con su propia marca, logotipo, planos y tarifas personalizados.</p>
            </div>
            <button
              type="button"
              className="btn-gold"
              onClick={() => setIsModalOpen(true)}
              style={{ padding: '12px 28px', fontSize: '0.9rem' }}
            >
              <span>Configurar Mi Marca</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </main>

      {/* Lightbox Modal de Alta Resolución */}
      {isLightboxOpen && (
        <div className="saas-lightbox-backdrop" onClick={() => setIsLightboxOpen(false)}>
          <div className="saas-lightbox-topbar" onClick={(e) => e.stopPropagation()}>
            <div className="saas-lightbox-title">{current.title}</div>
            <button
              type="button"
              className="saas-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={15} />
              <span>Cerrar Vista</span>
            </button>
          </div>
          <div className="saas-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={current.img} alt={current.title} />
          </div>
        </div>
      )}

      <SaasFooterBar />
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

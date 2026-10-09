import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Monitor, Smartphone, Shield } from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

export function SaasScreensPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'door' | 'client'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const screens = [
    {
      id: 'dashboard',
      label: '1. Consola de Sala',
      icon: Monitor,
      title: 'Consola Operativa en Vivo (Sensorial VIP)',
      desc: 'El monitor central para el gerente de sala, los capitanes de meseros y la barra. Muestra el estado en tiempo real de hasta 45 mesas, clientes presentes, ocupación porcentual y anticipos facturados.',
      img: '/showcase/dashboard-preview.png',
      points: [
        'Mapa interactivo de mesas con código de colores según ocupación.',
        'Total de anticipos cobrados y pendientes por mesa.',
        'Registro en vivo de ingresos reportados desde todas las puertas.',
        'Liberación forzada o reasignación manual de mesas con 1 clic.'
      ]
    },
    {
      id: 'door',
      label: '2. Escáner de Puerta',
      icon: Smartphone,
      title: 'Terminal PWA para Personal de Puerta',
      desc: 'La interfaz ultraligera para porteros y guardias de seguridad. Se ejecuta directamente en el navegador de cualquier teléfono Android o iPhone sin instalaciones pesadas ni descargas desde tiendas.',
      img: '/showcase/door-scanner-vip.jpg',
      points: [
        'Lectura de código QR en menos de 0.04 segundos con la cámara.',
        'Alerta sonora y háptica inmediata: verde para legítimo, rojo para captura.',
        'Soporte completo offline: sigue validando si se corta el internet.',
        'Modo noche de alto contraste para evitar deslumbramientos.'
      ]
    },
    {
      id: 'client',
      label: '3. Portal del Invitado',
      icon: Smartphone,
      title: 'Experiencia Móvil para el Cliente VIP',
      desc: 'La webapp donde tus invitados descubren los eventos del fin de semana, tocan su mesa favorita en el plano y abonan su anticipo de forma directa sin fricciones.',
      img: '/showcase/client-portal.png',
      points: [
        'Selección visual de mesas (Palco, Terraza, Suite, Pista).',
        'Checkout con Kushki para pagos inmediatos con tarjeta o transferencia.',
        'Pase dinámico automático guardado en el navegador.',
        'Cero descargas de apps requeridas por parte del cliente.'
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
              NIGHTFLOW VIP se compone de tres terminales sincronizadas: desde la consola central del gerente hasta el escáner del guardia y la pantalla de reserva del cliente.
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
                  onClick={() => setActiveTab(s.id as any)}
                >
                  <IconComp size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Visor amplio de la pantalla */}
          <div className="saas-screen-viewport">
            <img src={current.img} alt={current.title} />
            <div className="saas-screen-caption">
              <div>
                <strong style={{ color: 'var(--saas-text-primary)', display: 'block', fontSize: '0.94rem' }}>
                  {current.title}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--saas-text-secondary)' }}>
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
              <p>Cada local cuenta con su propia marca, logotipo y colores personalizados.</p>
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

      <SaasFooterBar />
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlan="Beta Privada"
      />
    </div>
  );
}

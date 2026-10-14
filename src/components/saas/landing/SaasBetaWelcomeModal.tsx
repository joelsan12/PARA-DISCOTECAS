import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MonitorPlay,
  ScanLine,
  Crown,
  Wine,
  LayoutGrid,
  Star,
  Send,
  MessageCircle,
  Lightbulb,
  Sparkles,
  Bug,
  CheckCircle2,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { submitBetaFeedback, type FeedbackCategory } from '../../../lib/betaIntake';

interface SaasBetaWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaasBetaWelcomeModal: React.FC<SaasBetaWelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Tabs: 'modules' (explorar módulos) o 'feedback' (dejar sugerencia)
  const [activeTab, setActiveTab] = useState<'modules' | 'feedback'>('modules');

  // Estado del Formulario de Feedback
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cerrar con Escape y bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calificación textual dinámica
  const getRatingText = (val: number) => {
    switch (val) {
      case 5: return '¡Impecable! Excelente experiencia VIP';
      case 4: return 'Muy buena, tengo ideas para mejorar';
      case 3: return 'Funciona bien, pero falta pulir detalles';
      case 2: return 'Encontré cosas confusas o difíciles';
      case 1: return 'Tuve problemas para probar el módulo';
      default: return 'Selecciona tu calificación';
    }
  };

  const handleSelectModuleFeedback = (moduleName: string, defaultCategory: FeedbackCategory = 'suggestion') => {
    setCategory(defaultCategory);
    setMessage(`[${moduleName}]: `);
    setActiveTab('feedback');
    // Scroll hacia el formulario de feedback si es necesario
    const formEl = document.getElementById('beta-modal-feedback-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Por favor, escribe tu sugerencia o comentario antes de enviar.');
      return;
    }

    setStatus('sending');
    setErrorMessage(null);

    try {
      await submitBetaFeedback({
        rating,
        category,
        message: message.trim(),
        contact: contact.trim() || undefined,
        portal: 'saas',
      });
      setStatus('success');
    } catch (err: unknown) {
      console.warn('[BetaWelcomeModal] Error enviando feedback:', err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar en este momento. Puedes escribirnos directo por WhatsApp.'
      );
    }
  };

  const modules = [
    {
      id: 'floor-ops',
      name: 'Consola de Sala en Vivo',
      roleTag: 'MANAGER & BARRA',
      icon: MonitorPlay,
      desc: 'Controla el mapa interactivo de mesas, aforo en sala sincronizado y conciliación de cuentas al instante.',
      features: [
        'Mapa cenital en vivo con códigos de color por ocupación',
        'Conciliación de consumos y cobros de barra',
        'Alertas de servicio y llamadas de concierge VIP',
      ],
      primaryLink: '/software/pantallas',
      primaryLabel: 'Probar Consola',
      badge: 'PROBAR DEMO',
    },
    {
      id: 'door-scanner',
      name: 'Escáner de Puerta Offline',
      roleTag: 'PUERTA & SEGURIDAD',
      icon: ScanLine,
      desc: 'Lectura de pases con cámara en 0.04s. Detección criptográfica infalible de capturas de pantalla reenviadas.',
      features: [
        'Validación instantánea con firmas Ed25519',
        'Rechazo automático de fotos de WhatsApp',
        'Opera sin internet guardando encriptado local',
      ],
      primaryLink: '/software/simulador',
      primaryLabel: 'Probar Escáner',
      badge: 'INTERACTIVO',
    },
    {
      id: 'vip-client',
      name: 'Portal del Invitado & Black Card',
      roleTag: 'EXPERIENCIA CLIENTE',
      icon: Crown,
      desc: 'El cliente toca su mesa favorita en el mapa cenital, abona su anticipo y recibe un pase digital rotativo.',
      features: [
        'Reserva visual en plano arquitectónico 3D',
        'Hold automático de 12 min anti-sobreventas',
        'Pase Black Card con QR dinámico cada 30s',
      ],
      primaryLink: '/negocios',
      primaryLabel: 'Probar Reserva',
      badge: 'VIP ACCESS',
    },
    {
      id: 'waiter-terminal',
      name: 'Terminal PWA de Meseros',
      roleTag: 'SERVICIO DE PISO',
      icon: Wine,
      desc: 'Comandas digitales directas a barra, asignación de botellas a la mesa y estado de gasto mínimo.',
      features: [
        'Menú digital rápido de licores y botellas VIP',
        'Cero tickets impresos o pedidos perdidos',
        'Cierre de cuenta asistido para cajero o capitán',
      ],
      primaryLink: '/software/pantallas',
      primaryLabel: 'Ver Meseros',
      badge: 'PWA SPEED',
    },
    {
      id: 'blueprint-editor',
      name: 'Diseñador de Planos de Discoteca',
      roleTag: 'ARQUITECTURA DEL LOCAL',
      icon: LayoutGrid,
      desc: 'Personaliza la distribución exacta de tu discoteca: suites, palcos, cabina DJ, barras y terrazas.',
      features: [
        'Diseño cenital adaptado a las medidas de tu local',
        'Calibración de anticipos y consumos mínimos',
        'Aislamiento multi-tenant 100% privado',
      ],
      primaryLink: '/software/arquitectura',
      primaryLabel: 'Ver Arquitectura',
      badge: 'CAD BLUEPRINT',
    },
  ];

  return (
    <div
      className="saas-beta-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
    >
      <div className="saas-beta-modal-dialog">
        {/* Barra Superior con Badge de Bienvenida y Botón de Cierre */}
        <div className="saas-beta-modal-header">
          <div className="saas-beta-modal-header-left">
            <div className="saas-beta-badge-row">
              <span className="saas-beta-pulse-dot" />
              <span className="saas-beta-badge-text">FASE BETA ABIERTA 2026 · ENTORNO DE PRUEBAS EN VIVO</span>
            </div>
            <h2 id="beta-modal-title" className="saas-beta-modal-title">
              Prueba Cada Módulo en Vivo y <span>Ayúdanos a Mejorar</span>
            </h2>
            <p className="saas-beta-modal-subtitle">
              Tienes acceso completo a toda la plataforma. Explora libremente la consola de sala, el escáner de puerta y las reservas móviles. Puedes cerrar esta ventana cuando desees para explorar la web.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="saas-beta-modal-close-btn"
            title="Cerrar y continuar a la web (Esc)"
            aria-label="Cerrar modal"
          >
            <X size={20} />
            <span className="saas-beta-modal-close-hint">ESC</span>
          </button>
        </div>

        {/* Barra de Pestañas / Navegación Interna */}
        <div className="saas-beta-modal-nav">
          <div className="saas-beta-modal-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`saas-beta-modal-tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
            >
              <Zap size={15} />
              <span>5 Módulos Operativos</span>
              <span className="saas-beta-modal-tab-count">En Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`saas-beta-modal-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            >
              <Lightbulb size={15} />
              <span>Dejar Sugerencia o Feedback</span>
              <span className="saas-beta-modal-tab-badge">VIP</span>
            </button>
          </div>

          <div className="saas-beta-modal-stats-pills">
            <span className="saas-beta-stat-pill">
              <ShieldCheck size={13} color="#34d399" />
              100% en Navegador
            </span>
            <span className="saas-beta-stat-pill">
              <Sparkles size={13} color="#e5b54f" />
              Sin Instalación Requerida
            </span>
          </div>
        </div>

        {/* Contenido Principal según Pestaña */}
        <div className="saas-beta-modal-body">
          {activeTab === 'modules' ? (
            <div className="saas-beta-modal-modules-section">
              <div className="saas-beta-modal-modules-grid">
                {modules.map((mod) => {
                  const IconComp = mod.icon;
                  return (
                    <div key={mod.id} className="saas-beta-module-card">
                      <div>
                        <div className="saas-beta-module-top">
                          <div className="saas-beta-module-icon-wrap">
                            <IconComp size={20} />
                          </div>
                          <span className="saas-beta-module-tag">{mod.roleTag}</span>
                        </div>

                        <h3 className="saas-beta-module-title">{mod.name}</h3>
                        <p className="saas-beta-module-desc">{mod.desc}</p>

                        <div className="saas-beta-module-features">
                          {mod.features.map((feat, idx) => (
                            <div key={idx} className="saas-beta-module-feature-item">
                              <Check size={13} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="saas-beta-module-actions">
                        <Link
                          to={mod.primaryLink}
                          onClick={onClose}
                          className="saas-beta-btn-action saas-beta-btn-action--primary"
                        >
                          <span>{mod.primaryLabel}</span>
                          <ArrowRight size={13} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleSelectModuleFeedback(mod.name)}
                          className="saas-beta-btn-action saas-beta-btn-action--ghost"
                          title={`Dejar sugerencia sobre ${mod.name}`}
                        >
                          <Lightbulb size={13} />
                          <span>Sugerir</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner de llamada rápida al feedback dentro de la vista de módulos */}
              <div className="saas-beta-modal-feedback-banner">
                <div className="saas-beta-modal-feedback-banner-text">
                  <Sparkles size={18} style={{ color: 'var(--saas-gold)' }} />
                  <div>
                    <strong>¿Tienes una sugerencia o encontraste un detalle al probar?</strong>
                    <span>Tu aporte ayuda a construir la mejor plataforma nocturna de la región.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className="btn-gold"
                  style={{ fontSize: '0.84rem', padding: '9px 18px' }}
                >
                  <MessageCircle size={14} />
                  <span>Escribir Sugerencia</span>
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Formulario de Feedback */
            <div id="beta-modal-feedback-form" className="saas-beta-feedback-box saas-beta-modal-feedback-view">
              <div className="saas-beta-feedback-grid">
                {/* Columna Izquierda: Información */}
                <div className="saas-beta-feedback-intro">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-gold, #e5b54f)', marginBottom: '8px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Sparkles size={14} />
                    <span>Buzón VIP de Mejora Continua</span>
                  </div>

                  <h3>¿Qué función te gustaría ver en tu discoteca?</h3>
                  <p>
                    Diseñamos este software para solucionar los cuellos de botella reales de la noche. Si probaste los módulos y tienes una idea o requerimiento particular, compártelo aquí.
                  </p>

                  <div className="saas-beta-reward-card">
                    <Crown size={20} />
                    <span>
                      Los dueños de clubes y usuarios que aporten feedback activo obtienen <strong>acceso prioritario y beneficios VIP exclusivos</strong> en el lanzamiento oficial.
                    </span>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('modules')}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Zap size={14} />
                      <span>Volver a la Lista de Módulos</span>
                    </button>
                  </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="saas-beta-feedback-form-wrap">
                  {status === 'success' ? (
                    <div className="saas-beta-success-message">
                      <CheckCircle2 size={44} color="#34d399" />
                      <h4>¡Muchas gracias por tu sugerencia!</h4>
                      <p>
                        Tu aporte ha sido registrado en nuestro sistema. El equipo de ingeniería lo revisará en la próxima ronda de optimización.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setStatus('idle');
                            setMessage('');
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                        >
                          <span>Enviar otra sugerencia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('modules')}
                          className="btn-gold"
                          style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                        >
                          <span>Volver a Probar Módulos</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="saas-beta-form">
                      {/* Calificación Interactiva por Estrellas */}
                      <div className="saas-beta-rating-wrap">
                        <span className="saas-beta-rating-label">¿Cómo calificas tu experiencia?</span>
                        <div className="saas-beta-stars">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (hoverRating || rating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                className={`saas-beta-star-btn ${isFilled ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                aria-label={`Calificar con ${star} estrellas`}
                              >
                                <Star size={20} fill={isFilled ? 'currentColor' : 'none'} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold, #e5b54f)', fontWeight: 600, marginTop: '-10px' }}>
                        {getRatingText(hoverRating || rating)}
                      </div>

                      {/* Selector de Categorías de Feedback */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tipo de Aporte:
                        </label>
                        <div className="saas-beta-categories">
                          {[
                            { id: 'suggestion', label: 'Sugerencia de Función', icon: Lightbulb },
                            { id: 'design', label: 'Diseño y Visuales', icon: Sparkles },
                            { id: 'reservation', label: 'Flujo de Mesas y Puerta', icon: Zap },
                            { id: 'bug', label: 'Reportar Detalle', icon: Bug },
                          ].map((cat) => {
                            const CatIcon = cat.icon;
                            const isSelected = category === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id as FeedbackCategory)}
                                className={`saas-beta-cat-chip ${isSelected ? 'active' : ''}`}
                              >
                                <CatIcon size={12} />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Campo de Mensaje */}
                      <div>
                        <label htmlFor="modal-feedback-message" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tu Sugerencia o Comentario: <span style={{ color: 'var(--brand-gold, #e5b54f)' }}>*</span>
                        </label>
                        <textarea
                          id="modal-feedback-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ej: Me gustaría que los meseros puedan dividir cuentas automáticamente por persona..."
                          rows={4}
                          className="saas-beta-textarea"
                          required
                        />
                      </div>

                      {/* Campo Opcional de Contacto */}
                      <div>
                        <label htmlFor="modal-feedback-contact" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tu WhatsApp o Correo (Opcional, para darte respuesta):
                        </label>
                        <input
                          id="modal-feedback-contact"
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="099 123 4567 o gerente@tudiscoteca.com"
                          className="saas-beta-input"
                        />
                      </div>

                      {errorMessage && (
                        <div className="saas-beta-error-alert">
                          {errorMessage}
                        </div>
                      )}

                      {/* Botones de Envío y WhatsApp */}
                      <div className="saas-beta-form-actions">
                        <button
                          type="submit"
                          disabled={status === 'sending' || !message.trim()}
                          className="btn-gold"
                          style={{ flex: 1, padding: '12px 20px', fontSize: '0.88rem' }}
                        >
                          <Send size={15} />
                          <span>{status === 'sending' ? 'Enviando aporte...' : 'Enviar Sugerencia'}</span>
                        </button>

                        <a
                          href={`https://wa.me/593988888888?text=${encodeURIComponent(`Hola NIGHTFLOW, tengo feedback de la Beta: ${message || 'Quisiera sugerir una mejora'}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="saas-beta-btn-whatsapp"
                          title="Escribir por WhatsApp directamente"
                        >
                          <MessageCircle size={15} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior del Modal: Botón de Cierre y Continuación */}
        <div className="saas-beta-modal-footer">
          <div className="saas-beta-modal-footer-hint">
            <span>¿Prefieres ver la presentación oficial? Puedes volver a abrir esta consola cuando quieras.</span>
          </div>

          <div className="saas-beta-modal-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="saas-beta-modal-btn-dismiss"
            >
              <span>Explorar la Web Completa</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

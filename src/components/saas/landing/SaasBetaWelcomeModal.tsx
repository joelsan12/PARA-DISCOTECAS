import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Star,
  Send,
  MessageCircle,
  Lightbulb,
  Sparkles,
  Bug,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { submitBetaFeedback, type FeedbackCategory } from '../../../lib/betaIntake';
import { BETA_MODULES } from './betaModules.data';
import { BetaModuleCard } from './SaasBetaModuleCard';

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
        {/* Barra Superior con Telemetría de Kernel y Botón de Cierre */}
        <div className="saas-beta-modal-header">
          <div className="saas-beta-modal-header-left">
            <div className="saas-beta-badge-row">
              <span className="saas-beta-pulse-dot" />
              <span className="saas-beta-badge-text">KERNEL v2.6.4 // NIGHTFLOW VIP SUITE · ACCESO DIRECTO AL SISTEMA</span>
            </div>
            <h2 id="beta-modal-title" className="saas-beta-modal-title">
              Cockpit de Mando VIP <span>& Control de Alta Concurrencia</span>
            </h2>
            <p className="saas-beta-modal-subtitle">
              Acceso directo a los 5 motores centrales de la plataforma: telemetría cenital de sala, verificación asimétrica en puerta en 0.04s, tokenización Black Card anti-screenshot y despacho instantáneo de botellería a barra.
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
              className={`saas-beta-modal-tab ${activeTab === 'modules' ? 'active' : ''}`}
            >
              <Zap size={14} />
              <span>5 Terminales de Mando</span>
              <span className="saas-beta-tab-live-dot" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`saas-beta-modal-tab ${activeTab === 'feedback' ? 'active' : ''}`}
            >
              <Lightbulb size={14} />
              <span>Mesa de Requerimientos VIP</span>
            </button>
          </div>

          <div className="saas-beta-modal-metrics">
            <span className="saas-beta-tel-metric">
              <ShieldCheck size={12} />
              LATENCIA &lt; 50ms
            </span>
            <span className="saas-beta-tel-metric">
              <Sparkles size={12} />
              ENCLAVE Ed25519
            </span>
            <span className="saas-beta-tel-metric">
              <Crown size={12} />
              MULTI-TENANT AISLADO
            </span>
          </div>
        </div>

        {/* Contenido Principal según Pestaña */}
        <div className="saas-beta-modal-body">
          {activeTab === 'modules' ? (
            <div className="saas-beta-modal-modules-section">
              <div className="saas-beta-modal-modules-grid">
                {BETA_MODULES.map((mod) => (
                  <BetaModuleCard
                    key={mod.id}
                    mod={mod}
                    onSuggest={handleSelectModuleFeedback}
                    onNavigate={onClose}
                  />
                ))}
              </div>

              {/* Banner de llamada rápida al feedback dentro de la vista de módulos */}
              <div className="saas-beta-modal-feedback-banner">
                <div className="saas-beta-modal-feedback-banner-text">
                  <Crown size={18} style={{ color: 'var(--brand-gold, #e5b54f)' }} />
                  <div>
                    <strong>¿Operas un club o discoteca con requerimientos de flujo particulares?</strong>
                    <span>Nuestro equipo de ingeniería diseña adaptaciones a medida para locales de alta concurrencia.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className="btn-gold"
                  style={{ fontSize: '0.84rem', padding: '9px 18px' }}
                >
                  <MessageCircle size={14} />
                  <span>Abrir Mesa Técnica</span>
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
                    <span>Mesa Técnica de Directores VIP</span>
                  </div>

                  <h3>¿Qué requerimiento operativo necesita tu establecimiento?</h3>
                  <p>
                    Arquitecturamos NIGHTFLOW VIP para erradicar los cuellos de botella de la noche: colas de puerta, sobreventas de mesas, comandas perdidas y descontrol de botellería. Plantea tus escenarios críticos aquí.
                  </p>

                  <div className="saas-beta-reward-card">
                    <Crown size={20} />
                    <span>
                      Los directores de club que aporten requerimientos operativos obtienen <strong>incorporación prioritaria con SLA de soporte nocturno exclusivo</strong>.
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
                      <span>Volver a la Consola de Módulos</span>
                    </button>
                  </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="saas-beta-feedback-form-wrap">
                  {status === 'success' ? (
                    <div className="saas-beta-success-message">
                      <CheckCircle2 size={44} color="var(--state-success, #34d399)" />
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
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                        <label htmlFor="modal-feedback-message" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                        <label htmlFor="modal-feedback-contact" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            <span>¿Deseas examinar la propuesta ejecutiva? Puedes regresar a este cockpit interactivo en cualquier momento.</span>
          </div>

          <div className="saas-beta-modal-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="saas-beta-modal-btn-dismiss"
            >
              <span>Ver Presentación Ejecutiva</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


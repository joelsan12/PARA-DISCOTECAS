import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Send,
  MessageCircle,
  Lightbulb,
  Sparkles,
  Bug,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { submitBetaFeedback, type FeedbackCategory } from '../../../lib/betaIntake';
import { BETA_MODULES } from './betaModules.data';
import { BetaModuleCard } from './SaasBetaModuleCard';

interface SaasBetaPlaygroundSectionProps {
  onOpenModal?: (plan?: string) => void;
}

export const SaasBetaPlaygroundSection: React.FC<SaasBetaPlaygroundSectionProps> = ({ onOpenModal: _onOpenModal }) => {
  // Estado del Formulario de Feedback
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Revelado escalonado del bento: se arma el estado oculto y el observer de
  // viewport añade .is-visible al entrar en pantalla (una sola vez).
  const modulesGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = modulesGridRef.current;
    if (!grid) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || typeof IntersectionObserver === 'undefined') {
      grid.dataset.reveal = 'off';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            grid.classList.add('is-visible');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

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
    if (!message || message.startsWith('[')) {
      setMessage(`[${moduleName}]: `);
    }
    // Scroll suave a la caja de feedback
    const feedbackBox = document.getElementById('beta-feedback-box');
    if (feedbackBox) {
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      console.warn('[BetaPlayground] Error enviando feedback:', err);
      // Fallback amigable: permitir reintento o WhatsApp
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar en este momento. Puedes escribirnos directo por WhatsApp.'
      );
    }
  };

  return (
    <section id="beta-playground" className="saas-beta-playground-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        {/* Encabezado Principal de la Beta — franja limpia sin cajas */}
        <div className="saas-beta-header">
          <div className="saas-beta-badge-row">
            <span className="saas-beta-pulse-dot" />
            <span className="saas-beta-badge-text">KERNEL v2.6.4 // SUITE OPERATIVA NIGHTFLOW VIP · CONSOLA EN VIVO</span>
          </div>

          <h2 className="saas-beta-title">
            Cockpit de Mando VIP <span>& Control de Alta Concurrencia</span>
          </h2>

          <p className="saas-beta-lead">
            Experimenta la velocidad de respuesta, precisión criptográfica y diseño de alta concurrencia de <strong>NIGHTFLOW VIP</strong> antes de activarlo en tu establecimiento. Los 5 motores operativos están listos para interactuar directamente desde tu navegador.
          </p>

          {/* Telemetría sin caja: estados a la izquierda, métricas a la derecha */}
          <div className="saas-beta-telemetry">
            <div className="saas-beta-telemetry-states">
              <span className="saas-beta-tel-item">
                <span className="saas-beta-tel-dot saas-beta-tel-dot--live" />
                <span>5 Terminales de Mando en Vivo</span>
              </span>
              <span className="saas-beta-tel-item">
                <span className="saas-beta-tel-dot saas-beta-tel-dot--gold" />
                <span>Firma Asimétrica Ed25519</span>
              </span>
              <span className="saas-beta-tel-item">
                <span className="saas-beta-tel-dot" />
                <span>Multi-Tenant Aislado</span>
              </span>
            </div>

            <div className="saas-beta-telemetry-metrics">
              <span className="saas-beta-tel-metric">
                <Zap size={12} />
                LATENCIA &lt; 50ms
              </span>
              <span className="saas-beta-tel-metric">
                <ShieldCheck size={12} />
                ENCLAVE Ed25519
              </span>
            </div>
          </div>
        </div>

        {/* Bento de Consola: los 5 módulos listos para probar */}
        <div ref={modulesGridRef} data-reveal="armed" className="saas-beta-modules-grid">
          {BETA_MODULES.map((mod) => (
            <BetaModuleCard
              key={mod.id}
              mod={mod}
              onSuggest={handleSelectModuleFeedback}
            />
          ))}
        </div>

        {/* Caja de Feedback Integrada y Atractiva */}
        <div id="beta-feedback-box" className="saas-beta-feedback-box">
          <div className="saas-beta-feedback-grid">
            {/* Columna Izquierda: Mensaje inspirador */}
            <div className="saas-beta-feedback-intro">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-gold, #e5b54f)', marginBottom: '8px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Sparkles size={14} />
                <span>Buzón VIP de Mejora Continua</span>
              </div>

              <h3>¿Qué función te gustaría ver en tu discoteca?</h3>
              <p>
                Diseñamos este software para solucionar los problemas reales de la noche. 
                Si probaste los módulos y tienes una idea, encontraste un detalle o quieres una integración especial para tu local, compártela aquí.
              </p>

              <div className="saas-beta-reward-card">
                <Crown size={20} />
                <span>
                  Los dueños de clubes y usuarios que aporten feedback activo obtienen <strong>acceso prioritario y beneficios VIP exclusivos</strong> en el lanzamiento oficial.
                </span>
              </div>
            </div>

            {/* Columna Derecha: Formulario Interactivo */}
            <div className="saas-beta-feedback-form-wrap">
              {status === 'success' ? (
                <div className="saas-beta-success-message">
                  <CheckCircle2 size={44} color="var(--state-success, #34d399)" />
                  <h4>¡Muchas gracias por tu sugerencia!</h4>
                  <p>
                    Tu aporte ha sido registrado en nuestro sistema. El equipo de ingeniería lo revisará en la próxima ronda de optimización.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setMessage('');
                    }}
                    className="btn-secondary"
                    style={{ marginTop: '10px', fontSize: '0.76rem', padding: '6px 14px' }}
                  >
                    <span>Enviar otra sugerencia</span>
                  </button>
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

                  {/* Textarea del Mensaje */}
                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu sugerencia, idea o qué te gustaría que tenga NIGHTFLOW VIP para tu club..."
                      maxLength={1000}
                      className="saas-beta-textarea"
                      rows={3}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {message.length} / 1000 caracteres
                    </div>
                  </div>

                  {/* Contacto Opcional */}
                  <div>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Tu nombre, discoteca o WhatsApp (opcional, para avisarte cuando esté listo)"
                      className="saas-beta-input-contact"
                      maxLength={120}
                    />
                  </div>

                  {errorMessage && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--state-danger, #f87171)', fontWeight: 600 }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Botón de Envío & Canal WhatsApp Directo */}
                  <div className="saas-beta-submit-row">
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="saas-beta-submit-btn"
                    >
                      <Send size={14} />
                      <span>{status === 'sending' ? 'Guardando sugerencia...' : 'Enviar Sugerencia a los Desarrolladores'}</span>
                    </button>

                    <a
                      href="https://wa.me/593995559876?text=Hola%20NIGHTFLOW%2C%20estoy%20probando%20la%20versi%C3%B3n%20beta%20y%20tengo%20una%20sugerencia%20para%20mi%20discoteca%3A"
                      target="_blank"
                      rel="noreferrer"
                      className="saas-beta-whatsapp-alt"
                    >
                      <MessageCircle size={14} />
                      <span>O chatear directo por WhatsApp</span>
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SaasBetaPlaygroundSection;

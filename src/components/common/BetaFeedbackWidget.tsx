import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquareText,
  Star,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageCircle,
  RotateCw,
  Lightbulb,
  Bug,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  submitBetaFeedback,
  type FeedbackCategory,
  ALLOWED_FEEDBACK_CATEGORIES
} from '../../lib/betaIntake';
import '../../styles/betaFeedback.css';

const CATEGORY_CONFIG: Record<
  FeedbackCategory,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  suggestion: { label: 'Sugerencia', icon: Lightbulb },
  bug: { label: 'Reportar Error', icon: Bug },
  reservation: { label: 'Reservas', icon: Calendar },
  design: { label: 'Diseño VIP', icon: Sparkles }
};

export interface BetaFeedbackWidgetProps {
  portal?: 'client' | 'saas' | 'admin';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingTrigger?: boolean;
}

export function BetaFeedbackWidget({
  portal: portalProp,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideFloatingTrigger = false
}: BetaFeedbackWidgetProps = {}) {
  const location = useLocation();
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setIsOpen = useCallback((next: boolean) => {
    if (!isControlled) {
      setUncontrolledIsOpen(next);
    }
    onOpenChange?.(next);
  }, [isControlled, onOpenChange]);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Escuchar evento personalizado para abrir el modal desde cualquier lugar (ej: navbar, concierge, perfil, admin)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-beta-feedback', handleOpen);
    return () => window.removeEventListener('open-beta-feedback', handleOpen);
  }, [setIsOpen]);

  // Auto-cierre a los 2 segundos tras envío exitoso
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setMessage('');
        setContact('');
        setErrorMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, setIsOpen]);

  // Cierre por click exterior o tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const isSaas =
    location.pathname.startsWith('/software') ||
    location.pathname.startsWith('/saas') ||
    location.pathname === '/' ||
    location.pathname.startsWith('/para-clubes') ||
    location.pathname.startsWith('/simulador') ||
    location.pathname.startsWith('/arquitectura') ||
    location.pathname.startsWith('/pantallas') ||
    location.pathname.startsWith('/faq');

  // En rutas operativas con barra inferior fija (ej. VIP dock en /app o /portal),
  // el botón flotante inferior se oculta para no tapar la navegación de sala (Pase VIP / Plano / Concierge).
  const isOperationalRoute =
    location.pathname.endsWith('/app') ||
    location.pathname.includes('/app') ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/puerta') ||
    location.pathname.startsWith('/mesero') ||
    location.pathname.startsWith('/barra') ||
    location.pathname.startsWith('/seguridad');

  const resolvedPortal: 'client' | 'saas' | 'admin' =
    portalProp ?? (isSaas ? 'saas' : 'client');

  const categoryLabel = CATEGORY_CONFIG[category].label;
  const roleContext = resolvedPortal === 'admin' ? '[Consola Admin] ' : '';
  const whatsappMessage = encodeURIComponent(
    `Hola Nightflow VIP, tengo feedback ${roleContext}sobre la beta:\n• Categoría: ${categoryLabel}\n• Valoración: ${rating}/5 estrellas\n• Portal: ${resolvedPortal}\n• Ruta: ${location.pathname}${
      message ? `\n• Mensaje: ${message}` : ''
    }${contact ? `\n• Contacto: ${contact}` : ''}`
  );
  const whatsappUrl = `https://wa.me/593979116551?text=${whatsappMessage}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    setErrorMessage(null);

    try {
      await submitBetaFeedback({
        rating,
        category,
        message: message.trim(),
        contact: contact.trim(),
        portal: resolvedPortal
      });
      setStatus('success');
    } catch (err) {
      console.error('Error al registrar feedback beta:', err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'No pudimos registrar tu feedback. Puedes enviarlo directamente por WhatsApp.'
      );
    }
  };

  return (
    <>
      {/* Backdrop oscuro para aislar el modal y evitar ruidos visuales de fondo */}
      {isOpen && (
        <div
          className="beta-feedback-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {((!hideFloatingTrigger && (!isOperationalRoute || isOpen)) || isOpen) && (
        <aside className="beta-feedback-container" aria-label="Widget de feedback para la beta">
          {/* Panel Desplegable */}
          {isOpen && (
            <div
              ref={panelRef}
              className="beta-feedback-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="beta-feedback-heading"
            >
              <div className="beta-feedback-header">
                <div>
                  <span className="beta-feedback-badge">
                    {resolvedPortal === 'admin' ? 'BETA ADMIN' : 'BETA VIP'}
                  </span>
                  <h3 id="beta-feedback-heading" className="beta-feedback-title">
                    {resolvedPortal === 'admin' ? 'Feedback del Administrador' : 'Tu Experiencia VIP'}
                  </h3>
                  <p className="beta-feedback-subtitle">
                    {resolvedPortal === 'admin'
                      ? '¿Detectaste un fallo o tienes sugerencias para optimizar la sala o tu consola? Envíanoslo directamente.'
                      : 'Ayúdanos a perfeccionar Nightflow. Tu opinión va directa al equipo técnico.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="beta-feedback-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar panel de feedback"
                >
                  <X size={18} />
                </button>
              </div>

              {status === 'success' ? (
                <div className="beta-feedback-success">
                  <CheckCircle2 size={44} color="var(--state-success, #34d399)" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ color: 'var(--text-high, #ffffff)', fontSize: '1.1rem', margin: '0 0 6px', fontWeight: 800 }}>
                    ¡Feedback Recibido!
                  </h4>
                  <p style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '0.82rem', margin: 0 }}>
                    Gracias por ayudarnos a elevar la experiencia nocturna. Cerrando ventana...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <div className="beta-feedback-error-banner" role="alert">
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <div>
                        <span>{errorMessage || 'Ocurrió un error al enviar el feedback.'}</span>
                      </div>
                    </div>
                  )}

                  {/* Puntuación con estrellas */}
                  <div className="beta-feedback-section">
                    <label className="beta-feedback-label">Calificación de la experiencia</label>
                    <div className="beta-feedback-stars" role="radiogroup" aria-label="Calificación en estrellas">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isActive = (hoverRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                            className={`beta-feedback-star-btn ${isActive ? 'is-active' : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                          >
                            <Star size={24} fill={isActive ? 'currentColor' : 'none'} strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categorías en Grid 2x2 con Iconos Lucide */}
                  <div className="beta-feedback-section">
                    <label className="beta-feedback-label">Tipo de comentario</label>
                    <div className="beta-feedback-chips" role="radiogroup" aria-label="Categoría del feedback">
                      {ALLOWED_FEEDBACK_CATEGORIES.map((catKey) => {
                        const config = CATEGORY_CONFIG[catKey];
                        const Icon = config.icon;
                        const isSelected = category === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`beta-feedback-chip ${isSelected ? 'is-active' : ''}`}
                            onClick={() => setCategory(catKey)}
                          >
                            <Icon size={14} className="beta-feedback-chip-icon" />
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mensaje */}
                  <div className="beta-feedback-section">
                    <label htmlFor="beta-feedback-message" className="beta-feedback-label">Detalles o sugerencia</label>
                    <textarea
                      id="beta-feedback-message"
                      required
                      rows={3}
                      maxLength={1000}
                      placeholder="¿Qué podemos mejorar? ¿Encontraste algún problema visual o de reserva?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="beta-feedback-textarea"
                      disabled={status === 'sending'}
                    />
                    <span className="beta-feedback-char-count">{message.length}/1000</span>
                  </div>

                  {/* Contacto opcional */}
                  <div className="beta-feedback-section">
                    <label htmlFor="beta-feedback-contact" className="beta-feedback-label">Contacto (opcional)</label>
                    <input
                      id="beta-feedback-contact"
                      type="text"
                      maxLength={60}
                      placeholder="Email o WhatsApp si deseas respuesta"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="beta-feedback-input"
                      disabled={status === 'sending'}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="beta-feedback-actions">
                    <button
                      type="submit"
                      className="beta-feedback-btn-primary"
                      disabled={status === 'sending' || !message.trim()}
                    >
                      {status === 'sending' ? (
                        <>
                          <RotateCw size={15} className="spin" />
                          <span>Enviando feedback...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Enviar a Soporte Beta</span>
                        </>
                      )}
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="beta-feedback-btn-whatsapp"
                    >
                      <MessageCircle size={15} />
                      <span>Soporte Directo por WhatsApp</span>
                    </a>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Botón Flotante (se oculta al abrir el modal, con hideFloatingTrigger y en rutas operativas con dock inferior) */}
          {!hideFloatingTrigger && !isOpen && !isOperationalRoute && (
            <button
              ref={triggerRef}
              type="button"
              className="beta-feedback-trigger"
              onClick={() => setIsOpen(true)}
              aria-expanded={false}
              aria-label="Abrir panel de feedback de la beta"
            >
              <MessageSquareText size={17} />
              <span>Feedback Beta</span>
              <span className="beta-feedback-trigger__badge">VIP</span>
            </button>
          )}
        </aside>
      )}
    </>
  );
}

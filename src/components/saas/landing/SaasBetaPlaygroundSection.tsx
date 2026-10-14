import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
        'Alertas de servicio y llamadas de concierge VIP'
      ],
      primaryLink: '/software/pantallas',
      primaryLabel: 'Explorar Consola en Pantallas',
      badge: 'PROBAR DEMO'
    },
    {
      id: 'door-scanner',
      name: 'Escáner de Puerta Offline',
      roleTag: 'PUERTA & SEGURIDAD',
      icon: ScanLine,
      desc: 'Lectura de pases con cámara en 0.04s. Detección criptográfica infalible de capturas de pantalla reenviadas.',
      features: [
        'Validación instantánea con firmas Ed25519',
        'Rechazo automático de fotos o capturas de WhatsApp',
        'Opera sin internet guardando encriptado en el teléfono'
      ],
      primaryLink: '/software/simulador',
      primaryLabel: 'Probar Simulador de Escáner',
      badge: 'INTERACTIVO'
    },
    {
      id: 'vip-client',
      name: 'Portal del Invitado & Black Card',
      roleTag: 'EXPERIENCIA CLIENTE',
      icon: Crown,
      desc: 'El cliente toca su mesa favorita en el mapa cenital, abona su anticipo y recibe un pase digital rotativo.',
      features: [
        'Reserva visual en plano arquitectónico 3D',
        'Hold automático de 12 minutos anti-sobreventas',
        'Pase Black Card con QR dinámico cada 30 segundos'
      ],
      primaryLink: '/negocios',
      primaryLabel: 'Probar Reserva como Cliente',
      badge: 'VIP ACCESS'
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
        'Cierre de cuenta asistido para cajero o capitán'
      ],
      primaryLink: '/software/pantallas',
      primaryLabel: 'Ver Flujo de Meseros',
      badge: 'PWA SPEED'
    },
    {
      id: 'blueprint-editor',
      name: 'Diseñador de Planos de Discoteca',
      roleTag: 'ARQUITECTURA DEL LOCAL',
      icon: LayoutGrid,
      desc: 'Personaliza la distribución exacta de tu discoteca: suites, palcos, cabina DJ, barras y terrazas.',
      features: [
        'Diseño cenital adaptado a las medidas de tu local',
        'Calibración de anticipos y consumos mínimos por mesa',
        'Aislamiento multi-tenant 100% privado'
      ],
      primaryLink: '/software/arquitectura',
      primaryLabel: 'Ver Arquitectura del Plano',
      badge: 'CAD BLUEPRINT'
    }
  ];

  return (
    <section id="beta-playground" className="saas-beta-playground-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        {/* Encabezado Principal de la Beta */}
        <div className="saas-beta-header">
          <div className="saas-beta-badge-row">
            <span className="saas-beta-pulse-dot" />
            <span className="saas-beta-badge-text">FASE BETA ABIERTA 2026 · PRUEBA TODOS LOS MÓDULOS</span>
          </div>

          <h2 className="saas-beta-title">
            Prueba Cada Módulo en Vivo y <span>Ayúdanos a Mejorar</span>
          </h2>

          <p className="saas-beta-lead">
            Queremos que vivas la velocidad de <strong>NIGHTFLOW VIP</strong> antes de implementarlo en tu local. 
            Prueba libremente la consola de sala, el escáner de puerta y las reservas móviles. Tu feedback moldea directamente las próximas actualizaciones.
          </p>

          <div className="saas-beta-stats-bar">
            <div className="saas-beta-stat-chip">
              <Zap size={14} />
              <span>5 Módulos Operativos Activos</span>
            </div>
            <div className="saas-beta-stat-chip">
              <ShieldCheck size={14} />
              <span>100% en Navegador sin Descargas</span>
            </div>
            <div className="saas-beta-stat-chip">
              <Sparkles size={14} />
              <span>Tu Sugerencia se Implementa Rápido</span>
            </div>
          </div>
        </div>

        {/* Grid de los 5 Módulos Listos para Probar */}
        <div className="saas-beta-modules-grid">
          {modules.map((mod) => {
            const IconComp = mod.icon;
            return (
              <div key={mod.id} className="saas-beta-module-card">
                <div>
                  <div className="saas-beta-module-top">
                    <div className="saas-beta-module-icon-wrap">
                      <IconComp size={22} />
                    </div>
                    <span className="saas-beta-module-tag">{mod.roleTag}</span>
                  </div>

                  <h3 className="saas-beta-module-title">{mod.name}</h3>
                  <p className="saas-beta-module-desc">{mod.desc}</p>

                  <div className="saas-beta-module-features">
                    {mod.features.map((feat, idx) => (
                      <div key={idx} className="saas-beta-module-feature-item">
                        <Check size={14} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="saas-beta-module-actions">
                  <Link to={mod.primaryLink} className="saas-beta-btn-action saas-beta-btn-action--primary">
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
                  <CheckCircle2 size={44} color="#34d399" />
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
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
                    <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
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

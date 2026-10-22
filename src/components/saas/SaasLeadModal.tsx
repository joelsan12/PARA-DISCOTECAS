import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  RotateCw,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Lock,
  Mail,
  Building,
  UserCheck,
  BookOpen,
  FileText,
  Download
} from 'lucide-react';
import {
  registerBetaClubOnline,
  OFFICIAL_VISUAL_GUIDES,
  type RegisterBetaClubOnlineResponse
} from '../../lib/betaIntake';

const ECUADOR_CITIES = [
  'Quito',
  'Guayaquil',
  'Cuenca',
  'Manta',
  'Samborondón',
  'Montañita',
  'Salinas',
  'Ambato',
  'Loja',
  'Machala',
  'Santo Domingo',
  'Ibarra',
  'Riobamba',
  'Portoviejo',
  'Baños de Agua Santa',
  'Cumbayá',
  'Esmeraldas',
  'Latacunga',
  'Quevedo',
  'Babahoyo',
  'Tulcán',
  'Otra ciudad...'
] as const;

interface SaasLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
}

export function SaasLeadModal({ isOpen, onClose }: SaasLeadModalProps) {
  const location = useLocation();
  const [clubName, setClubName] = useState<string>('');
  const [city, setCity] = useState<string>('Quito');
  const [customCity, setCustomCity] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Modo asistido: la activación automática no está disponible (backend caído
  // o mantenimiento). El lead ya quedó registrado en Firestore y se ofrece
  // continuar por WhatsApp con los datos del formulario, sin perder el prospecto.
  const [isAssisted, setIsAssisted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [result, setResult] = useState<RegisterBetaClubOnlineResponse | null>(null);

  if (!isOpen) return null;

  const resolvedCity = city === 'Otra ciudad...' ? customCity.trim() || 'Ecuador' : city.trim();

  const whatsappMessage = encodeURIComponent(
    `Hola Nightflow VIP, he activado mi club en la beta:\n• Club: ${clubName.trim() || 'Mi Club'}\n• Ciudad: ${resolvedCity}\n• Responsable: ${ownerName.trim() || 'Propietario'}\n• Correo: ${email.trim() || 'Sin especificar'}\n• Acceso: Beta Privada VIP`
  );
  const whatsappUrl = `https://wa.me/593979116551?text=${whatsappMessage}`;

  // Enlace a la consola con el correo precargado en el login (?email=)
  const adminLoginUrl = (() => {
    const base = result?.credentials.adminUrl || 'https://nightflow-admin.web.app';
    if (!result?.credentials.email) return base;
    return `${base}${base.includes('?') ? '&' : '?'}email=${encodeURIComponent(result.credentials.email)}`;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (city === 'Otra ciudad...' && !customCity.trim()) {
      setErrorMessage('Por favor escribe el nombre de tu ciudad.');
      return;
    }

    if (!clubName.trim() || !resolvedCity || !ownerName.trim() || !email.trim() || !whatsapp.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setIsAssisted(false);

    try {
      const response = await registerBetaClubOnline({
        clubName: clubName.trim(),
        city: resolvedCity,
        ownerName: ownerName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        plan: 'Beta Privada VIP',
        source: location.pathname || '/software'
      });
      setResult(response);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error al activar club beta:', err);
      const raw = err instanceof Error ? err.message : '';
      // Fallo de conectividad/backend caído: el lead ya quedó guardado en
      // betaLeads dentro de registerBetaClubOnline. Se degrada con elegancia a
      // activación asistida por WhatsApp en vez de mostrar un error seco.
      const isConnectivity =
        !raw ||
        /no se pudo activar|no está disponible|no está desplegada|no pudimos conectar|failed to fetch|network|load failed|timed? ?out|unavailable|internal|not[- ]?found|unimplemented|50[0-4]/i.test(raw);
      if (isConnectivity) {
        setIsAssisted(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(raw || 'No se pudo completar la activación en este momento. Puedes continuar directamente por WhatsApp.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!result?.credentials.temporaryPassword) return;
    navigator.clipboard.writeText(result.credentials.temporaryPassword);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="saas-modal-backdrop" onClick={onClose}>
      <div
        className="saas-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: isSubmitted ? '520px' : '480px' }}
      >
        <button
          type="button"
          className="saas-modal-close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="saas-badge-gold">
                <Sparkles size={12} />
                <span>BETA PRIVADA VIP • ACCESO TOTAL</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--saas-text-primary)', fontWeight: 800, marginTop: '8px', marginBottom: '4px' }}>
                Acceso Instantáneo a la Beta
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--saas-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Prueba la plataforma completa con tu discoteca sin costo durante la fase beta. Recibirás tus credenciales de consola al instante.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--state-danger-text, #fda4af)',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                role="alert"
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="saas-form-group" style={{ marginBottom: '10px' }}>
              <label className="saas-form-label">Nombre del Club o Discoteca</label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Ej. Sensorial Club VIP"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="saas-form-input"
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-form-label" htmlFor="saas-lead-city">Ciudad</label>
                <select
                  id="saas-lead-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="saas-form-select"
                  disabled={isSubmitting}
                >
                  {ECUADOR_CITIES.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                {city === 'Otra ciudad...' && (
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="Escribe tu ciudad..."
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="saas-form-input"
                    style={{ marginTop: '6px' }}
                    disabled={isSubmitting}
                    autoFocus
                  />
                )}
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-form-label">Tu Nombre / Responsable</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Ej. Carlos Ramos"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="saas-form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="saas-form-group" style={{ marginBottom: '10px' }}>
              <label className="saas-form-label">Correo Electrónico (Para recibir credenciales)</label>
              <input
                type="email"
                required
                maxLength={90}
                placeholder="carlos@tudiscoteca.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="saas-form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="saas-form-group" style={{ marginBottom: '18px' }}>
              <label className="saas-form-label">Número de WhatsApp (Contacto Directo VIP)</label>
              <input
                type="tel"
                required
                maxLength={25}
                placeholder="+593 99 123 4567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="saas-form-input"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              style={{ width: '100%', padding: '13px', fontSize: '0.92rem', fontWeight: 800 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RotateCw size={16} className="spin" />
                  <span>Configurando sala y credenciales...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Activar mi Club y Acceder al Instante</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {isAssisted && (
              <div
                role="status"
                style={{
                  marginTop: '12px',
                  background: 'rgba(229, 181, 79, 0.06)',
                  border: '1px solid var(--saas-border-gold)',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <MessageCircle size={15} color="var(--gold, #e5b54f)" />
                  <strong style={{ fontSize: '0.82rem', color: 'var(--saas-text-primary)' }}>
                    Activación asistida disponible
                  </strong>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--saas-text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  El alta automática está en mantenimiento. Tu solicitud quedó registrada con los datos de este formulario: activamos tu consola manualmente en minutos.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '11px',
                    background: 'rgba(37, 211, 102, 0.14)',
                    border: '1px solid rgba(37, 211, 102, 0.45)',
                    color: 'var(--brand-whatsapp, #25d366)',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Activar mi consola por WhatsApp</span>
                </a>
                <button
                  type="submit"
                  onClick={() => setIsAssisted(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--saas-text-secondary)',
                    fontSize: '0.74rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCw size={12} />
                  <span>Reintentar activación automática</span>
                </button>
                <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '9px' }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--saas-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Mientras tanto, explora las guías del producto
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {OFFICIAL_VISUAL_GUIDES.map((guide) => (
                      <a
                        key={guide.id}
                        href={guide.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: 'var(--gold, #e5b54f)',
                          textDecoration: 'none'
                        }}
                      >
                        <FileText size={12} />
                        <span>{guide.title}</span>
                        <Download size={11} style={{ marginLeft: 'auto', opacity: 0.8 }} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px',
                  marginTop: '10px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  color: 'var(--brand-whatsapp, #25d366)',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <MessageCircle size={16} />
                <span>Continuar por WhatsApp Directo</span>
              </a>
            )}
          </form>
        ) : (
          <div style={{ textAlign: 'left', padding: '6px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--state-success, #34d399)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <span className="saas-badge-gold" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.35)', color: 'var(--state-success, #34d399)' }}>
                ¡CLUB ACTIVADO CON ÉXITO!
              </span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--saas-text-primary)', fontWeight: 800, marginTop: '6px', marginBottom: '4px' }}>
                Tu Consola de Mando está Lista
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--saas-text-secondary)', margin: 0 }}>
                {result?.emailSent ? (
                  <>✉️ Enviamos una copia de tus credenciales a <strong style={{ color: 'var(--text-high, #ffffff)' }}>{result.credentials.email}</strong>.</>
                ) : (
                  <>Tus credenciales temporales han sido generadas. Guárdalas para iniciar sesión:</>
                )}
              </p>
            </div>

            {/* Tarjeta de Credenciales */}
            <div
              style={{
                background: 'rgba(17, 18, 25, 0.95)',
                border: '1px solid rgba(229, 181, 79, 0.35)',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '18px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Building size={16} color="var(--gold, #e5b54f)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high, #ffffff)' }}>
                  {result?.clubName} <span style={{ color: 'var(--saas-text-secondary)', fontWeight: 400 }}>({result?.city})</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--saas-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> Correo / Usuario:
                  </span>
                  <span style={{ color: 'var(--text-high, #ffffff)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {result?.credentials.email}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--saas-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} /> Contraseña:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--gold, #e5b54f)', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                      {result?.credentials.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      style={{
                        background: copiedKey ? 'rgba(52, 211, 153, 0.2)' : 'rgba(229, 181, 79, 0.15)',
                        border: '1px solid',
                        borderColor: copiedKey ? 'rgba(52, 211, 153, 0.4)' : 'rgba(229, 181, 79, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: copiedKey ? 'var(--state-success, #34d399)' : 'var(--gold, #e5b54f)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 700
                      }}
                      title="Copiar contraseña"
                    >
                      {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ color: 'var(--saas-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={14} /> Rol:
                  </span>
                  <span style={{ color: 'var(--state-success, #34d399)', fontWeight: 700, fontSize: '0.78rem' }}>
                    PROPIETARIO (Beta Privada VIP • Acceso Total)
                  </span>
                </div>
              </div>
            </div>

            {/* Sección de Descarga Directa de Guías Visuales */}
            <div
              style={{
                background: 'rgba(229, 181, 79, 0.05)',
                border: '1px solid rgba(229, 181, 79, 0.28)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="var(--gold, #e5b54f)" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--gold, #e5b54f)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Guías Visuales Prácticas (PDF)
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--state-success, #34d399)', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                  INCLUIDAS
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--saas-text-secondary)', margin: '0 0 10px', lineHeight: 1.45 }}>
                Enviamos estas guías a tu correo junto con tus credenciales. También puedes descargarlas o abrirlas directamente aquí para tu equipo:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(result?.guides || OFFICIAL_VISUAL_GUIDES).map((guide) => (
                  <a
                    key={guide.id}
                    href={guide.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'var(--text-high, #ffffff)',
                      fontSize: '0.78rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <FileText size={13} color="var(--gold, #e5b54f)" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {guide.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold, #e5b54f)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontWeight: 700 }}>
                      PDF <Download size={11} />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={adminLoginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '13px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              >
                <span>Ingresar a mi Consola de Club</span>
                <ExternalLink size={15} />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  color: 'var(--brand-whatsapp, #25d366)',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <MessageCircle size={16} />
                <span>Contactar a Soporte VIP en WhatsApp</span>
              </a>

              {result?.credentials.brandUrl && (
                <a
                  href={result.credentials.brandUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--saas-text-secondary)',
                    textDecoration: 'underline',
                    padding: '4px'
                  }}
                >
                  <span>Ver página pública de mi club ({result.slug})</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ width: '100%', padding: '9px', marginTop: '4px', fontSize: '0.82rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

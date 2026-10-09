import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, CheckCircle2, ArrowRight, MessageCircle, RotateCw, AlertCircle } from 'lucide-react';
import { submitBetaLead } from '../../lib/betaIntake';

interface SaasLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
}

export function SaasLeadModal({ isOpen, onClose, selectedPlan }: SaasLeadModalProps) {
  const location = useLocation();
  const [clubName, setClubName] = useState<string>('');
  const [city, setCity] = useState<string>('Quito');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Hola Nightflow VIP, solicito acceso a la beta:\n• Discoteca / Club: ${clubName.trim() || 'Por definir'}\n• Ciudad: ${city.trim() || 'Ecuador'}\n• Plan Seleccionado: ${selectedPlan || 'Club Pro'}\n• WhatsApp de Contacto: ${whatsapp.trim() || 'Sin especificar'}`
  );
  const whatsappUrl = `https://wa.me/593979116551?text=${whatsappMessage}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !city.trim() || !whatsapp.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitBetaLead({
        clubName: clubName.trim(),
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        plan: selectedPlan || 'Club Pro',
        source: location.pathname || '/software'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error al registrar lead beta:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la solicitud en este momento. Puedes continuar directamente por WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="saas-modal-backdrop" onClick={onClose}>
      <div className="saas-modal-box" onClick={(e) => e.stopPropagation()}>
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
            <div style={{ marginBottom: '18px' }}>
              <span className="saas-badge-gold">BETA PRIVADA VIP</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--saas-text-primary)', fontWeight: 800, marginTop: '6px' }}>
                {selectedPlan && selectedPlan !== 'Club Pro' ? `Activar ${selectedPlan}` : 'Solicitar Acceso a la Beta'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--saas-text-secondary)', margin: 0 }}>
                Déjanos los datos de tu discoteca y te contactaremos para habilitar tu consola en menos de 24 horas.
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
                  color: '#fda4af',
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

            <div className="saas-form-group">
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

            <div className="saas-form-group">
              <label className="saas-form-label">Ciudad</label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Quito, Guayaquil, Cuenca..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="saas-form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="saas-form-group" style={{ marginBottom: '22px' }}>
              <label className="saas-form-label">Número de WhatsApp</label>
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
              style={{ width: '100%', padding: '12px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RotateCw size={14} className="spin" />
                  <span>Enviando solicitud...</span>
                </>
              ) : (
                <>
                  <span>Solicitar Activación en 24h</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

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
                  color: '#25d366',
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
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={42} color="#34d399" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--saas-text-primary)', fontWeight: 800, marginBottom: '6px' }}>
              ¡Solicitud Enviada con Éxito!
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--saas-text-secondary)', marginBottom: '20px' }}>
              Te contactaremos al WhatsApp ({whatsapp}) para habilitar tu consola y cargar tu plano de sala.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <MessageCircle size={16} />
                <span>Continuar en WhatsApp</span>
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ width: '100%', padding: '10px' }}
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

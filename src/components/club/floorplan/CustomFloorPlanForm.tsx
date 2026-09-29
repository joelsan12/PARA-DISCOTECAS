import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { ECUADOR_MOBILE_PLACEHOLDER, formatEcuadorPhone, isValidEcuadorMobile } from '../../../lib/formatEcuador';

interface Props {
  clubName: string;
  venueType: string;
  setVenueType: (v: string) => void;
  estimatedTables: string;
  setEstimatedTables: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onSubmitWhatsApp: (phone: string) => void;
}

export const CustomFloorPlanForm: React.FC<Props> = ({
  clubName,
  venueType,
  setVenueType,
  estimatedTables,
  setEstimatedTables,
  phone,
  setPhone,
  notes,
  setNotes,
  onSubmitWhatsApp
}) => {
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneBlur = () => {
    if (isValidEcuadorMobile(phone)) {
      setPhone(formatEcuadorPhone(phone));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValidEcuadorMobile(phone)) {
      setPhoneError('Ingresa un número móvil válido de Ecuador con el código +593.');
      return;
    }

    setPhoneError('');
    onSubmitWhatsApp(formatEcuadorPhone(phone));
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Establecimiento
          </label>
          <input
            type="text"
            value={clubName}
            disabled
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '0.82rem'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Tipo de Espacio
            </label>
            <select
              value={venueType}
              onChange={e => setVenueType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                background: '#12141f',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            >
              <option value="NIGHTCLUB">Discoteca</option>
              <option value="ROOFTOP">Terraza panorámica</option>
              <option value="EVENT_VENUE">Club de playa</option>
              <option value="LOUNGE">Salón y suites privadas</option>
              <option value="THEATER">Sala de conciertos o teatro</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Mesas Estimadas
            </label>
            <select
              value={estimatedTables}
              onChange={e => setEstimatedTables(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                background: '#12141f',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            >
              <option value="Hasta 15 mesas">Hasta 15 mesas</option>
              <option value="15 - 25 mesas">15 - 25 mesas</option>
              <option value="25 - 40 mesas">25 - 40 mesas</option>
              <option value="Más de 40 mesas">Más de 40 mesas</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            WhatsApp del Encargado / Propietario
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              setPhoneError('');
            }}
            onBlur={handlePhoneBlur}
            placeholder={ECUADOR_MOBILE_PLACEHOLDER}
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? 'custom-plan-phone-error' : undefined}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              background: '#12141f',
              border: `1px solid ${phoneError ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#fff',
              fontSize: '0.82rem'
            }}
          />
          {phoneError && (
            <p id="custom-plan-phone-error" role="alert" style={{ margin: '5px 0 0', color: '#fca5a5', fontSize: '0.7rem' }}>
              {phoneError}
            </p>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Instrucciones o Enlace a Plano / Fotos
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ejemplo: tenemos 3 zonas: palcos VIP a la izquierda, pista central y cabina del DJ..."
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              background: '#12141f',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '0.8rem',
              resize: 'none'
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '11px 18px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
          color: '#ffffff',
          border: 'none',
          fontSize: '0.84rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 18px rgba(37, 211, 102, 0.35)',
          transition: 'all 0.15s ease'
        }}
      >
        <Send size={16} />
        <span>Enviar solicitud a soporte por WhatsApp</span>
      </button>
    </form>
  );
};

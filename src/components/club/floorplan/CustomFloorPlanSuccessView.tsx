import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CustomFloorPlanSuccessView: React.FC<Props> = ({ onClose }) => {
  return (
    <div style={{ textAlign: 'center', padding: '24px 10px' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1.5px solid #10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: '#10b981'
      }}>
        <CheckCircle2 size={32} />
      </div>
      <h3 className="font-brand" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        ¡Solicitud Enviada a Soporte!
      </h3>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
        Hemos abierto una conversación de WhatsApp con el equipo de soporte técnico y registrado tu solicitud en el sistema. Te responderemos en menos de 24 horas para recibir las fotos o el croquis de tu establecimiento.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="btn-primary"
        style={{ padding: '8px 24px', margin: '0 auto' }}
      >
        Entendido
      </button>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Building2, ShieldAlert } from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import { CustomFloorPlanSuccessView } from './CustomFloorPlanSuccessView';
import { CustomFloorPlanForm } from './CustomFloorPlanForm';
import { formatUsd } from '../../../lib/formatUsd';
import { esPlan, esVenueType } from '../../../lib/esLabels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clubName: string;
  clubCity?: string;
}

export const CustomFloorPlanRequestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clubName,
  clubCity = 'Quito'
}) => {
  const store = useClubStore();
  const [venueType, setVenueType] = useState('NIGHTCLUB');
  const [estimatedTables, setEstimatedTables] = useState('15 - 25 mesas');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentClub = store.clubs.find(c => c.id === store.activeClubId);
  const currentPlan = store.plans.find(p => p.id === currentClub?.plan_id);
  const hasInteractivePlan = currentPlan?.enabled_features?.includes('FLOOR_PLAN') ?? true;

  const handleSendWhatsApp = (formattedPhone: string) => {
    const text = `🏛️ *SOLICITUD DE PLANO A MEDIDA NIGHTFLOW*
---------------------------------------
📍 *Establecimiento:* ${clubName} (${clubCity})
🏢 *Tipo de espacio:* ${esVenueType(venueType)}
🪑 *Mesas estimadas:* ${estimatedTables}
📱 *Contacto directo:* ${formattedPhone}
📋 *Detalles:* ${notes || 'Adjunto plano o fotos de la discoteca a continuación'}

_Acepto la tarifa única de configuración y calibración arquitectónica (${formatUsd(49)}) para activar el plan Profesional o Empresarial._`;

    const supportPhone = '+593 99 911 1222';
    const url = `https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    store.addAuditLog({
      club_id: store.activeClubId,
      actor: 'Administrador del Club',
      role: 'club_owner',
      action: 'CUSTOM_FLOORPLAN_REQUESTED',
      details: `Solicitud de modelado a medida para ${clubName} (${esVenueType(venueType)})`
    });

    setIsSubmitted(true);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '26px',
        border: '1px solid rgba(229, 181, 79, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
        borderRadius: 'var(--radius-md)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={15} />
        </button>

        {isSubmitted ? (
          <CustomFloorPlanSuccessView onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 100%)',
                color: '#08080c',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Solicitar Plano a Medida de tu Local
                </h2>
                <p style={{ fontSize: '0.74rem', color: 'var(--brand-gold)', margin: 0, fontWeight: 600 }}>
                  Modelado digital a escala para reservas interactivas
                </p>
              </div>
            </div>

            {/* Pricing Notice & Plan Requirements */}
            <div style={{
              background: 'rgba(229, 181, 79, 0.08)',
              border: '1px solid rgba(229, 181, 79, 0.25)',
              borderRadius: 'var(--radius-xs)',
              padding: '10px 14px',
              marginTop: '14px',
              marginBottom: '16px',
              fontSize: '0.76rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.4'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, color: '#e5b54f' }}>Tarifa única de configuración: {formatUsd(49)}</span>
                <span style={{
                  fontSize: '0.66rem',
                  background: 'rgba(229, 181, 79, 0.2)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  color: '#e5b54f',
                  fontWeight: 800
                }}>
                  PAGO ÚNICO
                </span>
              </div>
              <span>
                Disponible para planes con mapa interactivo ({esPlan('pro')} o {esPlan('enterprise')}). Un arquitecto digital modelará tu discoteca basándose en fotos, plano de evacuación o boceto.
              </span>
            </div>

            {!hasInteractivePlan && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius-xs)',
                padding: '8px 12px',
                marginBottom: '14px',
                fontSize: '0.74rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={16} color="#ef4444" />
                <span>Tu plan actual no incluye mapa interactivo. Al solicitar este servicio se activará el plan {esPlan('pro')}.</span>
              </div>
            )}

            {/* Form Fields Component */}
            <CustomFloorPlanForm
              clubName={clubName}
              venueType={venueType}
              setVenueType={setVenueType}
              estimatedTables={estimatedTables}
              setEstimatedTables={setEstimatedTables}
              phone={phone}
              setPhone={setPhone}
              notes={notes}
              setNotes={setNotes}
              onSubmitWhatsApp={handleSendWhatsApp}
            />
          </>
        )}
      </div>
    </div>
  );
};

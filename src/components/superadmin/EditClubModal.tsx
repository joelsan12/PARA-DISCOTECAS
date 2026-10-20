import { useState, type FormEvent } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import { formatEcuadorPhone, normalizeEcuadorPhone } from '../../lib/formatEcuador';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan, esClubStatus } from '../../lib/esLabels';
import type { Club, SubscriptionPlan, SubscriptionPlanId, ClubStatus, VenueType } from '../../types';
import { ConfirmPlanChangeModal } from './ConfirmPlanChangeModal';

interface Props {
  club: Club | null;
  plans: SubscriptionPlan[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (clubId: string, updates: Partial<Club>) => void;
  onUpdatePlan?: (clubId: string, newPlanId: SubscriptionPlanId) => void;
}

const BUSINESS_TYPE_OPTIONS = [
  { value: 'NIGHTCLUB', label: 'Discoteca / Club VIP' },
  { value: 'BAR', label: 'Bar de Coctelería' },
  { value: 'ROOFTOP', label: 'Rooftop Lounge' },
  { value: 'LOUNGE', label: 'Lounge / Gastrobar' },
  { value: 'EVENT_VENUE', label: 'Espacio de Eventos' },
  { value: 'RESTAURANT', label: 'Restaurante / Club' },
  { value: 'OTHER', label: 'Otro formato nocturno' }
];

export const EditClubModal = ({ club, plans, isOpen, onClose, onSave, onUpdatePlan }: Props) => {
  const [name, setName] = useState(() => club?.name || '');
  const [city, setCity] = useState(() => club?.city || '');
  const [address, setAddress] = useState(() => club?.address || '');
  const [whatsapp, setWhatsapp] = useState(() => club ? (formatEcuadorPhone(club.whatsapp_number) || club.whatsapp_number || '+593 ') : '+593 ');
  const [tagline, setTagline] = useState(() => club?.tagline || '');
  const [businessType, setBusinessType] = useState<VenueType>(() => (club?.venue_type as VenueType) || 'NIGHTCLUB');
  const [planId, setPlanId] = useState<SubscriptionPlanId>(() => club?.plan_id || 'pro');
  const [status, setStatus] = useState<ClubStatus>(() => club?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanConfirm, setPendingPlanConfirm] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Club> | null>(null);

  if (!isOpen || !club) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeEcuadorPhone(whatsapp);
    if (!name.trim() || !city.trim() || !normalizedPhone) {
      setError('Por favor completa los campos requeridos con un número de teléfono válido.');
      return;
    }

    const updates: Partial<Club> = {
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      whatsapp_number: normalizedPhone,
      tagline: tagline.trim(),
      venue_type: businessType as Club['venue_type'],
      status: status
    };

    // Invariante de seguridad: Ningún cambio de plan se ejecuta sin confirmación
    if (planId !== club.plan_id) {
      setPendingUpdates(updates);
      setPendingPlanConfirm(true);
      return;
    }

    try {
      onSave(club.id, updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar modificaciones.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(229, 181, 79, 0.15)',
              border: '1px solid rgba(229, 181, 79, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-gold)'
            }}>
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
                Modificar Discoteca / Tenant
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                ID: <code style={{ color: 'var(--brand-gold)' }}>{club.id}</code> · Slug: {club.slug}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px' }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: 'var(--state-danger-text, #fca5a5)',
            fontSize: '0.8rem'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              NOMBRE COMERCIAL *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.85)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                TIPO DE ESTABLECIMIENTO
              </label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value as VenueType)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {BUSINESS_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                CIUDAD *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              DIRECCIÓN EXACTA
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ej. Av. Whymper N30-141 y Coruña"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.85)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.84rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              WHATSAPP DE ATENCIÓN (+593 ECUADOR) *
            </label>
            <input
              type="tel"
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              onBlur={() => setWhatsapp(formatEcuadorPhone(whatsapp) || '+593 ')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.85)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.86rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              LEMA / SUBTÍTULO DE MARCA
            </label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Ej. Experiencia nocturna exclusiva y reservas VIP"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.85)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.84rem'
              }}
            />
          </div>

          {/* Plan y Estado */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '12px',
            padding: '14px',
            borderRadius: '8px',
            background: 'rgba(229, 181, 79, 0.05)',
            border: '1px solid rgba(229, 181, 79, 0.2)'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-gold)', marginBottom: '5px' }}>
                PLAN DE SUSCRIPCIÓN ACTIVO
              </label>
              <select
                value={planId}
                onChange={e => setPlanId(e.target.value as SubscriptionPlanId)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.95)',
                  border: '1px solid rgba(229, 181, 79, 0.4)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-gold)', marginBottom: '5px' }}>
                ESTADO OPERATIVO
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ClubStatus)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.95)',
                  border: '1px solid rgba(229, 181, 79, 0.4)',
                  color: status === 'active' ? 'var(--state-success, #34d399)' : 'var(--state-danger, #f87171)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <option value="active" style={{ color: 'var(--state-success, #34d399)' }}>● {esClubStatus('active')}</option>
                <option value="suspended" style={{ color: 'var(--state-danger, #f87171)' }}>● {esClubStatus('suspended')}</option>
                <option value="trial" style={{ color: 'var(--state-hold, #fbbf24)' }}>● En Prueba / Trial</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px', borderRadius: '6px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                flex: 1.4,
                padding: '11px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal de confirmación obligatoria si el plan cambió en este formulario */}
      <ConfirmPlanChangeModal
        isOpen={pendingPlanConfirm}
        club={club}
        newPlanId={planId}
        plans={plans}
        onConfirm={(clubId, newPlan) => {
          if (onUpdatePlan) {
            onUpdatePlan(clubId, newPlan);
          } else {
            onSave(clubId, { plan_id: newPlan });
          }
          if (pendingUpdates) {
            onSave(clubId, pendingUpdates);
          }
          setPendingPlanConfirm(false);
          setPendingUpdates(null);
          onClose();
        }}
        onCancel={() => {
          setPendingPlanConfirm(false);
          setPendingUpdates(null);
        }}
      />
    </div>
  );
};

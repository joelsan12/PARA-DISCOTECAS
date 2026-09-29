import { useState, type FormEvent } from 'react';
import { X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { formatEcuadorPhone, normalizeEcuadorPhone } from '../../lib/formatEcuador';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan } from '../../lib/esLabels';
import type { SubscriptionPlan, SubscriptionPlanId } from '../../types';

interface Props {
  isOpen: boolean;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onCreate: (data: {
    name: string;
    city: string;
    plan_id: SubscriptionPlanId;
    whatsapp_number: string;
    businessType?: string;
    tagline?: string;
  }) => Promise<void> | void;
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

export const CreateClubModal = ({ isOpen, plans, onClose, onCreate }: Props) => {
  const [newClubName, setNewClubName] = useState('');
  const [newClubCity, setNewClubCity] = useState('');
  const [newClubWhatsapp, setNewClubWhatsapp] = useState('+593 ');
  const [newClubPlan, setNewClubPlan] = useState<SubscriptionPlanId>('pro');
  const [newClubType, setNewClubType] = useState('NIGHTCLUB');
  const [newClubTagline, setNewClubTagline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeEcuadorPhone(newClubWhatsapp);
    if (!newClubName.trim() || !newClubCity.trim() || !normalizedPhone) {
      setError('Por favor completa todos los campos obligatorios con un número de teléfono válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate({
        name: newClubName.trim(),
        city: newClubCity.trim(),
        plan_id: newClubPlan,
        whatsapp_number: normalizedPhone,
        businessType: newClubType,
        tagline: newClubTagline.trim() || undefined
      });

      setNewClubName('');
      setNewClubCity('');
      setNewClubWhatsapp('+593 ');
      setNewClubTagline('');
      setError(null);
      onClose();
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'Error al aprovisionar la discoteca en el servidor Cloud Function.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '500px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 17, 26, 0.95)',
          border: '1px solid rgba(229, 181, 79, 0.25)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(229, 181, 79, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent)" />
              <h3 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Aprovisionar nueva discoteca
              </h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Crea atómicamente el tenant en Firestore, directorio y recursos iniciales
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="btn-ghost"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                Error de aprovisionamiento
              </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Nombre de la discoteca / negocio *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="Ej. Octava Club VIP"
              value={newClubName}
              onChange={e => setNewClubName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tipo de establecimiento *
              </label>
              <select
                disabled={isSubmitting}
                value={newClubType}
                onChange={e => setNewClubType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {BUSINESS_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Ciudad *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="Ej. Quito / Guayaquil"
                value={newClubCity}
                onChange={e => setNewClubCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Lema o subtítulo de marca
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Ej. Experiencia nocturna exclusiva en Cumbayá"
              value={newClubTagline}
              onChange={e => setNewClubTagline(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '0.84rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              WhatsApp de operaciones (Ecuador +593) *
            </label>
            <input
              type="tel"
              required
              disabled={isSubmitting}
              inputMode="tel"
              placeholder="+593 9XX XXX XXX"
              value={newClubWhatsapp}
              onChange={e => setNewClubWhatsapp(e.target.value)}
              onBlur={() => setNewClubWhatsapp(formatEcuadorPhone(newClubWhatsapp) || '+593 ')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Plan de suscripción inicial *
            </label>
            <select
              disabled={isSubmitting}
              value={newClubPlan}
              onChange={e => setNewClubPlan(e.target.value as SubscriptionPlanId)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {plans.length === 0 ? (
                <option value="">No hay planes disponibles</option>
              ) : (
                plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {esPlan(plan.id)} · {formatUsd(plan.monthly_price)} / mes
                    {plan.id === 'pro' ? ' · Recomendado' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px', opacity: isSubmitting ? 0.6 : 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                flex: 1.4,
                padding: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.8 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Aprovisionando en servidor...</span>
                </>
              ) : (
                'Crear discoteca'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

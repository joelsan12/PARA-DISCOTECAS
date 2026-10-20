import { useState, type FormEvent } from 'react';
import { X, Sparkles, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { esPlan } from '../../lib/esLabels';
import type { SubscriptionPlan, SubscriptionPlanId, SubscriptionPlanTier } from '../../types';

interface Props {
  plan: SubscriptionPlan | null; // null if creating a new plan
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: SubscriptionPlan, isNew: boolean) => void;
}

export const EditPlanModal = ({ plan, isOpen, onClose, onSave }: Props) => {
  const isNew = plan === null;
  const [id, setId] = useState(() => plan?.id || '');
  const [name, setName] = useState(() => plan?.name || '');
  const [monthlyPrice, setMonthlyPrice] = useState(() => plan ? plan.monthly_price : 149);
  const [maxEvents, setMaxEvents] = useState(() => plan ? plan.max_events_per_month : 15);
  const [features, setFeatures] = useState<string[]>(() => plan ? [...plan.features] : [
    'Sitio público de reservas',
    'Gestión de eventos',
    'Control de puerta QR'
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [tier, setTier] = useState<SubscriptionPlanTier>(() =>
    plan?.plan_tier || (plan?.id === 'enterprise' ? 'ENTERPRISE' : plan?.id === 'pro' ? 'PRO' : 'BASIC')
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    const text = newFeatureText.trim();
    if (!text) return;
    if (features.includes(text)) {
      setError('Esa característica ya está en la lista.');
      return;
    }
    setFeatures([...features, text]);
    setNewFeatureText('');
    setError(null);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!finalId) {
      setError('El identificador del plan es obligatorio (ej. rooftop_starter).');
      return;
    }
    if (!name.trim()) {
      setError('El nombre del plan es obligatorio.');
      return;
    }
    if (monthlyPrice < 0) {
      setError('El precio mensual no puede ser negativo.');
      return;
    }
    if (features.length === 0) {
      setError('Debes incluir al menos una característica en el plan.');
      return;
    }

    try {
      const planPayload: SubscriptionPlan = {
        id: finalId as SubscriptionPlanId,
        name: name.trim(),
        monthly_price: Number(monthlyPrice),
        max_events_per_month: Number(maxEvents),
        features: features,
        plan_tier: tier,
        enabled_features: plan?.enabled_features || ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN']
      };

      onSave(planPayload, isNew);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el plan de suscripción.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
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
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
                {isNew ? 'Crear Nuevo Plan de Suscripción' : `Modificar Plan: ${esPlan(plan.id)}`}
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Configuración SaaS global de tarifas y límites operativos
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                ID ÚNICO DEL PLAN *
              </label>
              <input
                type="text"
                required
                disabled={!isNew}
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="ej. custom_vip"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: isNew ? 'rgba(8, 8, 12, 0.85)' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  color: isNew ? 'var(--text-high, #ffffff)' : 'var(--text-dim)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: isNew ? 'text' : 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                NOMBRE PÚBLICO DEL MODELO *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej. Plan Rooftop Boutique"
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                PRECIO MENSUAL (USD) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={1}
                value={monthlyPrice}
                onChange={e => setMonthlyPrice(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(229, 181, 79, 0.35)',
                  color: 'var(--state-hold, #fbbf24)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                EVENTOS / MES *
              </label>
              <input
                type="number"
                required
                min={1}
                max={9999}
                value={maxEvents}
                onChange={e => setMaxEvents(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                TIER ARQUITECTÓNICO
              </label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as SubscriptionPlanTier)}
                style={{
                  width: '100%',
                  padding: '10px 10px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <option value="BASIC">BASIC (Estándar)</option>
                <option value="PRO">PRO (Interactivo)</option>
                <option value="PREMIUM">PREMIUM (VIP Total)</option>
                <option value="ENTERPRISE">ENTERPRISE (SaaS Ilimitado)</option>
              </select>
            </div>
          </div>

          {/* Características del Plan */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-gold)', marginBottom: '8px' }}>
              CARACTERÍSTICAS INCLUIDAS EN ESTE MODELO ({features.length})
            </label>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newFeatureText}
                onChange={e => setNewFeatureText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Escribe una nueva característica (ej. Control de guardarropa)..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(8, 8, 12, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem'
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.78rem',
                    color: 'var(--text-main, #e2e8f0)'
                  }}
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    title="Eliminar característica"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--state-danger, #ef4444)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
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
              <span>{isNew ? 'Registrar Plan' : 'Guardar Modificaciones'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

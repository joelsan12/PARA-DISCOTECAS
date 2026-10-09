import React from 'react';
import { ShieldAlert, ArrowRight, Check, X, Sparkles, Building } from 'lucide-react';
import type { Club, SubscriptionPlan, SubscriptionPlanId } from '../../types';
import { esPlan } from '../../lib/esLabels';
import { formatUsd } from '../../lib/formatUsd';

interface ConfirmPlanChangeModalProps {
  isOpen: boolean;
  club: Club | null;
  newPlanId: SubscriptionPlanId | null;
  plans: SubscriptionPlan[];
  onConfirm: (clubId: string, newPlanId: SubscriptionPlanId) => void;
  onCancel: () => void;
}

export const ConfirmPlanChangeModal: React.FC<ConfirmPlanChangeModalProps> = ({
  isOpen,
  club,
  newPlanId,
  plans,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !club || !newPlanId) return null;

  const currentPlan = plans.find(p => p.id === club.plan_id);
  const targetPlan = plans.find(p => p.id === newPlanId);

  const isUpgrade = (targetPlan?.monthly_price || 0) >= (currentPlan?.monthly_price || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'linear-gradient(180deg, #111119 0%, #090a0f 100%)',
          border: '1px solid rgba(229, 181, 79, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(229, 181, 79, 0.1)',
          overflow: 'hidden',
          animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(229, 181, 79, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.12)',
                border: '1px solid rgba(229, 181, 79, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e5b54f',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Confirmar Cambio de Plan SaaS
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Autorización de desarrollador para actualización de tenancy
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Club Info Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <Building size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                {club.name}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                {club.city} · ID: <code style={{ color: '#e5b54f' }}>{club.id}</code>
              </span>
            </div>
          </div>

          {/* Plan Comparison Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Current Plan */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.45)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Plan Actual
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                {esPlan(club.plan_id)}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                {formatUsd(currentPlan?.monthly_price || 0)}/mes
              </div>
            </div>

            <div style={{ color: '#e5b54f', display: 'flex', justifyContent: 'center' }}>
              <ArrowRight size={20} />
            </div>

            {/* Target Plan */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: isUpgrade ? 'rgba(229, 181, 79, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${isUpgrade ? 'rgba(229, 181, 79, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isUpgrade ? '#e5b54f' : '#60a5fa',
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 700,
                }}
              >
                Nuevo Plan
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                {esPlan(newPlanId)}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isUpgrade ? '#e5b54f' : '#60a5fa' }}>
                {formatUsd(targetPlan?.monthly_price || 0)}/mes
              </div>
            </div>
          </div>

          {/* New Plan Features Preview */}
          {targetPlan && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.04)',
                border: '1px solid rgba(229, 181, 79, 0.15)',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#e5b54f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={13} />
                Capacidades operativas incluidas en {esPlan(newPlanId)}:
              </span>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {targetPlan.features.slice(0, 4).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Caution Note */}
          <p
            style={{
              margin: 0,
              fontSize: '0.76rem',
              lineHeight: 1.45,
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
            }}
          >
            ⚠️ <strong>Confirmación obligatoria:</strong> Al confirmar, se actualizarán los límites de aforo, comisiones y herramientas operativas para esta discoteca en el motor multi-tenant de Nightflow.
          </p>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onConfirm(club.id, newPlanId)}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(229, 181, 79, 0.6)',
              background: 'linear-gradient(135deg, #e5b54f 0%, #d4a33d 100%)',
              color: '#08080c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(229, 181, 79, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={14} />
            Confirmar Cambio de Plan
          </button>
        </div>
      </div>
    </div>
  );
};

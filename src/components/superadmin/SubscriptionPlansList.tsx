import { Check, Edit3, Plus, Trash2, Users, DollarSign, Sparkles } from 'lucide-react';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan } from '../../lib/esLabels';
import type { SubscriptionPlan, Club } from '../../types';

interface Props {
  plans: SubscriptionPlan[];
  clubs: Club[];
  onEditPlan: (plan: SubscriptionPlan) => void;
  onCreatePlan: () => void;
  onDeletePlan: (planId: string) => void;
}

export const SubscriptionPlansList = ({
  plans,
  clubs,
  onEditPlan,
  onCreatePlan,
  onDeletePlan,
}: Props) => {
  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--brand-gold)" />
            <h3 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
              Modelos y Tarifas de Suscripción SaaS ({plans.length})
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
            Límites configurables de eventos, comisiones y capacidades operativas por club
          </p>
        </div>

        <button
          type="button"
          onClick={onCreatePlan}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Crear Nuevo Plan de Suscripción</span>
        </button>
      </div>

      {/* Grid of Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '18px'
      }}>
        {plans.map(p => {
          const subscriberClubs = clubs.filter(c => c.plan_id === p.id);
          const subscriberCount = subscriberClubs.length;
          const monthlyRevenue = subscriberCount * p.monthly_price;
          const isPro = p.id === 'pro';

          return (
            <div
              key={p.id}
              className="glass-card"
              style={{
                border: `1px solid ${isPro ? 'var(--border-focus, rgba(229, 181, 79, 0.4))' : 'var(--border, rgba(255, 255, 255, 0.1))'}`,
                borderRadius: 'var(--radius-md, 12px)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isPro ? '0 10px 30px rgba(229, 181, 79, 0.1)' : '0 6px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div>
                {/* Plan Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
                      {esPlan(p.id)}
                    </h4>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      ({p.id})
                    </span>
                  </div>

                  {isPro && (
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(229, 181, 79, 0.18)',
                      border: '1px solid rgba(229, 181, 79, 0.4)',
                      color: 'var(--brand-gold)'
                    }}>
                      MÁS POPULAR
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
                  <span className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-high, #ffffff)' }}>
                    {formatUsd(p.monthly_price)}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>/ mes</span>
                </div>

                {/* Subscriptions & Revenue Metrics */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  marginBottom: '16px',
                  fontSize: '0.74rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--state-neutral, #cbd5e1)' }}>
                    <Users size={13} color="var(--brand-gold)" />
                    <span><strong>{subscriberCount}</strong> {subscriberCount === 1 ? 'discoteca' : 'discotecas'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--state-neutral, #cbd5e1)' }}>
                    <DollarSign size={13} color="var(--state-success, #4ade80)" />
                    <span><strong>{formatUsd(monthlyRevenue)}</strong>/mes recurrente</span>
                  </div>
                </div>

                {/* Limits & Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-high, #ffffff)', fontWeight: 600 }}>
                    <Check size={14} color="var(--brand-gold)" style={{ flexShrink: 0 }} />
                    <span>Hasta {p.max_events_per_month} eventos mensuales</span>
                  </div>

                  {p.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ lineHeight: 1.35 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => onEditPlan(p)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(229, 181, 79, 0.12)',
                    border: '1px solid rgba(229, 181, 79, 0.3)',
                    color: 'var(--brand-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(229, 181, 79, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(229, 181, 79, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.3)';
                  }}
                >
                  <Edit3 size={13} />
                  <span>Modificar Tarifas & Límites</span>
                </button>

                {subscriberCount === 0 && !['basic', 'pro', 'enterprise'].includes(p.id) && (
                  <button
                    type="button"
                    onClick={() => onDeletePlan(p.id)}
                    title="Eliminar este plan personalizado (sin suscriptores)"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--state-danger, #f87171)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Zap
} from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import type { Club, SubscriptionPlanId } from '../../../types';
import { esPlan } from '../../../lib/esLabels';
import { formatUsd } from '../../../lib/formatUsd';

interface ClubPlanAndProposalsViewProps {
  activeClub: Club;
}

export const ClubPlanAndProposalsView: React.FC<ClubPlanAndProposalsViewProps> = ({ activeClub }) => {
  const store = useClubStore();

  // Filter proposals submitted by this club
  const clubProposals = store.proposals.filter(p => p.club_id === activeClub.id);

  // Form states for sending new proposal
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [targetPlanId, setTargetPlanId] = useState<SubscriptionPlanId>(activeClub.plan_id);
  const [description, setDescription] = useState('');
  const [proposedBenefit, setProposedBenefit] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenUpgrade = (planId: SubscriptionPlanId) => {
    setTargetPlanId(planId);
    setProposalTitle(`Solicitud de Upgrade a Plan ${esPlan(planId)}`);
    setProposedBenefit(`Deseamos contratar el plan ${esPlan(planId)} para aumentar nuestro alcance y capacidades operativas.`);
    setShowProposalForm(true);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim() || !description.trim() || !proposedBenefit.trim()) {
      return;
    }

    store.submitClubProposal({
      club_id: activeClub.id,
      club_name: activeClub.name,
      requested_plan_id: targetPlanId,
      title: proposalTitle.trim(),
      description: description.trim(),
      proposed_benefit: proposedBenefit.trim(),
    });

    setSuccessMessage('¡Tu propuesta ha sido enviada exitosamente al equipo de desarrollo! Se encuentra en revisión técnica.');
    setProposalTitle('');
    setDescription('');
    setProposedBenefit('');
    setShowProposalForm(false);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.1) 0%, rgba(17, 18, 26, 0.95) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.3)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(229, 181, 79, 0.15)',
                color: '#e5b54f',
                border: '1px solid rgba(229, 181, 79, 0.35)',
              }}
            >
              Suscripción &amp; Escalabilidad
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {activeClub.name}
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 8px',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            Tu Plan Actual: <span style={{ color: '#e5b54f' }}>Plan {esPlan(activeClub.plan_id)}</span>
          </h1>

          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.75)' }}>
            Administra tu membresía SaaS en Nightflow VIP. Puedes solicitar una actualización de plan o enviar propuestas técnicas para que nuestro equipo desarrolle funcionalidades a medida <strong>exclusivas para tu discoteca</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowProposalForm(true)}
            style={{
              padding: '11px 22px',
              borderRadius: '10px',
              border: '1px solid rgba(229, 181, 79, 0.6)',
              background: 'linear-gradient(135deg, #e5b54f 0%, #d4a33d 100%)',
              color: '#08080c',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(229, 181, 79, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} />
            Enviar Propuesta al Desarrollador
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#34d399',
            fontSize: '0.86rem',
            fontWeight: 600,
            animation: 'fadeInModal 0.25s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Custom Exclusive Features (Activated by Dev ONLY for this club) */}
      {activeClub.custom_features && activeClub.custom_features.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(180deg, #10121d 0%, #0a0b12 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Zap size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Módulos &amp; Beneficios Exclusivos Activados
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#34d399' }}>
                Desarrollados y habilitados únicamente para {activeClub.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {activeClub.custom_features.map(feat => (
              <div
                key={feat.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    {feat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: feat.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: feat.enabled ? '#34d399' : '#f87171',
                      border: `1px solid ${feat.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {feat.enabled ? 'ACTIVO' : 'PAUSADO'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.4 }}>
                  {feat.description}
                </p>
                {feat.notes && (
                  <div style={{ fontSize: '0.72rem', color: '#e5b54f', marginTop: '4px', fontStyle: 'italic' }}>
                    ℹ️ {feat.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Proposal Submission Modal / Drawer */}
      {showProposalForm && (
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
          onClick={() => setShowProposalForm(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              background: 'linear-gradient(180deg, #11111a 0%, #090a0f 100%)',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(229, 181, 79, 0.15)',
              overflow: 'hidden',
              animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(229, 181, 79, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="#e5b54f" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Enviar Propuesta al Equipo de Desarrollo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProposal} style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                ¿Tienes una idea, integración con tus puntos de venta o necesidad técnica específica? Envíanos tu propuesta. El desarrollador podrá evaluar la viabilidad e <strong>implementarla exclusivamente para tu discoteca</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Proposal Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                    Título de la Propuesta / Solicitud
                  </label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={e => setProposalTitle(e.target.value)}
                    placeholder="Ej: Integración con lector de inventario de barra o split de cuentas"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                {/* Target Plan Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                    Plan que Deseas Asociar o Contratar
                  </label>
                  <select
                    value={targetPlanId}
                    onChange={e => setTargetPlanId(e.target.value as SubscriptionPlanId)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#12141f',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {store.plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                    Detalle de la Propuesta o Funcionalidad
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Explica qué requerimiento operativo o técnico te gustaría tener..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    required
                  />
                </div>

                {/* Proposed Benefit */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                    ¿Cómo beneficiaría esta propuesta a tu discoteca?
                  </label>
                  <textarea
                    value={proposedBenefit}
                    onChange={e => setProposedBenefit(e.target.value)}
                    placeholder="Ej: Aumentaría las ventas de mesas VIP en un 30% y agilizaría el check-in de barra..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
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
                  }}
                >
                  <Send size={14} />
                  Enviar Propuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Plans Comparison Showcase */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            Planes Disponibles en la Plataforma
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Compara los planes y solicita una mejora directa o personalizada para {activeClub.name}.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {store.plans.map(plan => {
            const isCurrent = plan.id === activeClub.plan_id;

            return (
              <div
                key={plan.id}
                style={{
                  background: isCurrent
                    ? 'linear-gradient(180deg, rgba(229, 181, 79, 0.08) 0%, #0d0f18 100%)'
                    : 'linear-gradient(180deg, #10111a 0%, #0a0b10 100%)',
                  border: `1px solid ${isCurrent ? 'rgba(229, 181, 79, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isCurrent ? '0 12px 32px rgba(229, 181, 79, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '14px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(229, 181, 79, 0.2)',
                      border: '1px solid rgba(229, 181, 79, 0.4)',
                      color: '#e5b54f',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    PLAN VIGENTE
                  </div>
                )}

                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                    {esPlan(plan.id)}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#e5b54f' }}>
                      {formatUsd(plan.monthly_price)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      / mes
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      padding: '6px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      marginBottom: '16px',
                    }}
                  >
                    Hasta {plan.max_events_per_month} eventos/mes
                  </div>

                  {/* Features list */}
                  <ul
                    style={{
                      margin: '0 0 20px',
                      padding: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Check size={14} color="#e5b54f" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan Action Button */}
                {isCurrent ? (
                  <div
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      background: 'rgba(229, 181, 79, 0.1)',
                      border: '1px solid rgba(229, 181, 79, 0.3)',
                      color: '#e5b54f',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Plan Activo en tu Local
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenUpgrade(plan.id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Solicitar Cambio a {esPlan(plan.id)}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Historical Proposals & Requests submitted by this club */}
      <div
        style={{
          background: 'linear-gradient(180deg, #10111a 0%, #0a0b10 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            Historial de Solicitudes y Propuestas de {activeClub.name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Seguimiento en tiempo real de tus solicitudes de upgrade y desarrollos a medida.
          </p>
        </div>

        {clubProposals.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              No has enviado propuestas o solicitudes de cambio de plan aún.
            </p>
            <button
              type="button"
              onClick={() => setShowProposalForm(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e5b54f',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Envía tu primera propuesta aquí
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {clubProposals.map(prop => (
              <div
                key={prop.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                      {prop.title}
                    </span>
                    {prop.requested_plan_id && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(229, 181, 79, 0.12)',
                          color: '#e5b54f',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                        }}
                      >
                        Plan solicitado: {esPlan(prop.requested_plan_id)}
                      </span>
                    )}
                  </div>

                  <div>
                    {prop.status === 'PENDING' && (
                      <span className="status-chip status-chip--pending">
                        <Clock size={12} /> Pendiente de Evaluación
                      </span>
                    )}
                    {prop.status === 'IN_REVIEW' && (
                      <span className="status-chip status-chip--review">
                        <AlertCircle size={12} /> En Revisión Técnica
                      </span>
                    )}
                    {prop.status === 'IMPLEMENTED' && (
                      <span className="status-chip status-chip--done">
                        <CheckCircle2 size={12} /> Implementada &amp; Activa
                      </span>
                    )}
                    {prop.status === 'REJECTED' && (
                      <span className="status-chip status-chip--rejected">
                        <X size={12} /> Rechazada
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45 }}>
                  {prop.description}
                </p>

                {prop.proposed_benefit && (
                  <div style={{ fontSize: '0.75rem', color: '#e5b54f' }}>
                    <strong>Beneficio esperado:</strong> {prop.proposed_benefit}
                  </div>
                )}

                {prop.dev_response && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '0.76rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                    }}
                  >
                    💬 <strong>Respuesta del Desarrollador:</strong> {prop.dev_response}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

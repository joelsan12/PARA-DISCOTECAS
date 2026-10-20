import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Building,
  Filter,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import type { Club, ClubProposal, SubscriptionPlan, SubscriptionPlanId, ProposalStatus } from '../../types';
import { esPlan } from '../../lib/esLabels';
import { formatUsd } from '../../lib/formatUsd';

interface DevProposalsManagerProps {
  proposals: ClubProposal[];
  clubs: Club[];
  plans: SubscriptionPlan[];
  onRequestPlanChange: (club: Club, newPlanId: SubscriptionPlanId) => void;
  onOpenImplementModal: (club: Club, proposal: ClubProposal) => void;
  onUpdateStatus: (proposalId: string, status: ProposalStatus, devResponse?: string) => void;
}

export const DevProposalsManager: React.FC<DevProposalsManagerProps> = ({
  proposals,
  clubs,
  plans,
  onRequestPlanChange,
  onOpenImplementModal,
  onUpdateStatus,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'IMPLEMENTED' | 'REJECTED'>('ALL');
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredProposals = proposals.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;
  const inReviewCount = proposals.filter(p => p.status === 'IN_REVIEW').length;
  const implementedCount = proposals.filter(p => p.status === 'IMPLEMENTED').length;
  const rejectedCount = proposals.filter(p => p.status === 'REJECTED').length;

  const handleSaveResponse = (proposalId: string, targetStatus: ProposalStatus) => {
    onUpdateStatus(proposalId, targetStatus, responseText.trim());
    setEditingResponseId(null);
    setResponseText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Metric Chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-high, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Sparkles size={22} color="var(--gold, #e5b54f)" />
            Propuestas &amp; Solicitudes de Planes de Clientes
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Revisa contrataciones de planes, evalúa propuestas de los clubes e implementa módulos exclusivos por cliente.
          </p>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-elevated)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <Filter size={13} color="var(--text-dim)" style={{ marginLeft: '6px' }} />
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: filter === 'ALL' ? 'var(--gold, #e5b54f)' : 'transparent',
              color: filter === 'ALL' ? 'var(--bg-void, #08080c)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: filter === 'ALL' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Todas ({proposals.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: filter === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: filter === 'PENDING' ? 'var(--state-hold, #fbbf24)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.74rem',
              fontWeight: filter === 'PENDING' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Pendientes {pendingCount > 0 && <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--state-hold, #f59e0b)', color: 'var(--bg-void, #08080c)', fontSize: '0.65rem', fontWeight: 800 }}>{pendingCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setFilter('IN_REVIEW')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: filter === 'IN_REVIEW' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: filter === 'IN_REVIEW' ? 'var(--state-info, #60a5fa)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.74rem',
              fontWeight: filter === 'IN_REVIEW' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            En Revisión ({inReviewCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('IMPLEMENTED')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: filter === 'IMPLEMENTED' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: filter === 'IMPLEMENTED' ? 'var(--state-success, #34d399)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.74rem',
              fontWeight: filter === 'IMPLEMENTED' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            Implementadas ({implementedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('REJECTED')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: filter === 'REJECTED' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              color: filter === 'REJECTED' ? 'var(--state-danger, #fda4af)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.74rem',
              fontWeight: filter === 'REJECTED' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            Rechazadas ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '14px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <Sparkles size={32} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', color: 'var(--text-high, #ffffff)', fontSize: '0.95rem' }}>
            No hay solicitudes en este filtro
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cuando una discoteca solicite contratar un plan o envíe una propuesta, aparecerá aquí inmediatamente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProposals.map(prop => {
            const club = clubs.find(c => c.id === prop.club_id);
            const currentPlan = plans.find(p => p.id === club?.plan_id);
            const requestedPlan = plans.find(p => p.id === prop.requested_plan_id);
            const isPlanDifferent = prop.requested_plan_id && club && prop.requested_plan_id !== club.plan_id;

            return (
              <div
                key={prop.id}
                className="glass-card"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Top Strip: Club info + Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(229, 181, 79, 0.12)',
                        border: '1px solid rgba(229, 181, 79, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold, #e5b54f)',
                      }}
                    >
                      <Building size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                          {prop.club_name}
                        </span>
                        {club && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({club.city})
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Enviada el {new Date(prop.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {prop.status === 'PENDING' && (
                      <span className="status-chip status-chip--pending">
                        <Clock size={11} /> Pendiente de Evaluación
                      </span>
                    )}
                    {prop.status === 'IN_REVIEW' && (
                      <span className="status-chip status-chip--review">
                        <AlertCircle size={11} /> En Revisión Técnica
                      </span>
                    )}
                    {prop.status === 'IMPLEMENTED' && (
                      <span className="status-chip status-chip--done">
                        <CheckCircle2 size={11} /> Implementada &amp; Activa
                      </span>
                    )}
                    {prop.status === 'REJECTED' && (
                      <span className="status-chip status-chip--rejected">
                        <X size={11} /> Rechazada
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan Request Comparison if applicable */}
                {prop.requested_plan_id && club && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(229, 181, 79, 0.04)',
                      border: '1px solid rgba(229, 181, 79, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block' }}>
                          Plan Actual del Club
                        </span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                          {esPlan(club.plan_id)} ({formatUsd(currentPlan?.monthly_price || 0)}/m)
                        </span>
                      </div>

                      <ArrowRight size={16} color="var(--gold, #e5b54f)" />

                      <div>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--gold, #e5b54f)', fontWeight: 700, display: 'block' }}>
                          Plan que Desea Contratar
                        </span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--gold, #e5b54f)' }}>
                          {esPlan(prop.requested_plan_id)} ({formatUsd(requestedPlan?.monthly_price || 0)}/m)
                        </span>
                      </div>
                    </div>

                    {isPlanDifferent && (
                      <button
                        type="button"
                        onClick={() => onRequestPlanChange(club, prop.requested_plan_id!)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(229, 181, 79, 0.6)',
                          background: 'linear-gradient(135deg, var(--gold, #e5b54f) 0%, var(--gold-hover, #d4a33d) 100%)',
                          color: 'var(--bg-void, #08080c)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Zap size={13} />
                        Aprobar y Cambiar Plan...
                      </button>
                    )}
                  </div>
                )}

                {/* Proposal Title & Description */}
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                    {prop.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {prop.description}
                  </p>
                </div>

                {/* Proposed Benefit Callout */}
                {prop.proposed_benefit && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      borderLeft: '3px solid var(--gold, #e5b54f)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--gold, #e5b54f)',
                        display: 'block',
                        marginBottom: '3px',
                      }}
                    >
                      Beneficio esperado para el club:
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      {prop.proposed_benefit}
                    </span>
                  </div>
                )}

                {/* If Implemented: Show Activated Feature */}
                {prop.activated_feature && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="var(--state-success, #10b981)" />
                      <div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high, #ffffff)', display: 'block' }}>
                          Módulo Activo Exclusivo: {prop.activated_feature.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Flag: <code style={{ color: 'var(--state-success, #34d399)' }}>{prop.activated_feature.key}</code> · {prop.activated_feature.description}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--state-success, #34d399)',
                      }}
                    >
                      ACTIVADO SOLO PARA ESTE CLUB
                    </span>
                  </div>
                )}

                {/* Dev Response Notes */}
                {prop.dev_response && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    <strong>Nota del desarrollador:</strong> {prop.dev_response}
                  </div>
                )}

                {/* Action Bar for Dev */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {prop.status !== 'IMPLEMENTED' && club && (
                      <button
                        type="button"
                        onClick={() => onOpenImplementModal(club, prop)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(229, 181, 79, 0.5)',
                          background: 'rgba(229, 181, 79, 0.12)',
                          color: 'var(--gold, #e5b54f)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Zap size={13} />
                        Implementar y Activar solo para {club.name}
                      </button>
                    )}

                    {prop.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(prop.id, 'IN_REVIEW', 'Equipo de desarrollo evaluando factibilidad técnica')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--state-info, #60a5fa)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Marcar En Revisión
                      </button>
                    )}

                    {prop.status !== 'REJECTED' && prop.status !== 'IMPLEMENTED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingProposalId(prop.id);
                          setRejectReason('');
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          background: 'rgba(244, 63, 94, 0.06)',
                          color: 'var(--state-danger, #fda4af)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <X size={12} />
                        Rechazar
                      </button>
                    )}
                  </div>

                  {/* Feedback response editor */}
                  {editingResponseId === prop.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
                      <input
                        type="text"
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder="Mensaje o feedback al cliente..."
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: 'var(--text-high, #ffffff)',
                          fontSize: '0.76rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveResponse(prop.id, prop.status)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'var(--gold, #e5b54f)',
                          color: 'var(--bg-void, #08080c)',
                          border: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingResponseId(null)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          border: 'none',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingResponseId(prop.id);
                        setResponseText(prop.dev_response || '');
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <MessageSquare size={12} />
                      {prop.dev_response ? 'Editar Respuesta' : 'Responder al Cliente'}
                    </button>
                  )}
                </div>

                {/* Inline Rejection Box */}
                {rejectingProposalId === prop.id && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.06)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', color: 'var(--state-danger, #fda4af)', fontWeight: 600 }}>
                      ¿Confirmar rechazo de la propuesta?
                    </span>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Motivo del rechazo para el club (opcional)..."
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-input)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: 'var(--text-high, #ffffff)',
                        fontSize: '0.76rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateStatus(
                           prop.id,
                          'REJECTED',
                          rejectReason.trim() || 'Propuesta no viable técnicamente o fuera de alcance actual.'
                        );
                        setRejectingProposalId(null);
                        setRejectReason('');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--state-danger, #f43f5e)',
                        color: 'var(--text-high, #ffffff)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Confirmar Rechazo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingProposalId(null);
                        setRejectReason('');
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

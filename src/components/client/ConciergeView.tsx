import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Bell,
  Wine,
  Flame,
  HelpCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useClubStore } from '../../store/clubStore';
import { callFunctions } from '../../lib/functionsClient';
import { subscribeCustomerConciergeRequests } from '../../services/conciergeService';
import type { ConciergeRequestRecord, ConciergeRequestType } from '../../types/saas';
import { normalizeEcuadorPhone } from '../../lib/formatEcuador';

interface Props {
  onBack: () => void;
}

const TYPE_OPTIONS: { id: ConciergeRequestType; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: 'WAITER', label: 'Llamar Mesero', icon: Bell },
  { id: 'BOTTLE', label: 'Botella VIP', icon: Wine },
  { id: 'HOOKAH', label: 'Hookah / Narguile', icon: Flame },
  { id: 'SERVICE', label: 'Servicio / Hielo', icon: Sparkles },
  { id: 'OTHER', label: 'Otro Pedido', icon: HelpCircle }
];

export const ConciergeView: React.FC<Props> = ({ onBack }) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clientUser = store.clientUser;

  const [selectedType, setSelectedType] = useState<ConciergeRequestType>('WAITER');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [myRequests, setMyRequests] = useState<ConciergeRequestRecord[]>([]);

  // 1. Suscripción reactiva a solicitudes propias del cliente
  useEffect(() => {
    if (!activeClub?.id || !clientUser?.id) return;
    const unsub = subscribeCustomerConciergeRequests({
      businessId: activeClub.id,
      uid: clientUser.id,
      onUpdate: (list) => {
        setMyRequests(list);
      },
      onError: (err) => {
        console.warn('[ConciergeView] Error suscripción cliente:', err);
      }
    });
    return () => unsub();
  }, [activeClub?.id, clientUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientUser?.id || !activeClub?.id) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await callFunctions('createConciergeRequest', {
        businessId: activeClub.id,
        type: selectedType,
        message: message.trim() || undefined,
        customerName: clientUser.name,
        customerPhone: clientUser.phone
      });

      setMessage('');
      setFeedback({
        kind: 'success',
        message: '¡Tu solicitud fue enviada a los meseros de sala!'
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al enviar la solicitud.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!activeClub?.id) return;
    try {
      await callFunctions('cancelConciergeRequest', {
        businessId: activeClub.id,
        requestId
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la solicitud.');
    }
  };

  // WhatsApp Fallback Link
  const rawWa = activeClub?.whatsapp_number ? normalizeEcuadorPhone(activeClub.whatsapp_number).replace(/\D/g, '') : '';
  const waUrl = rawWa
    ? `https://wa.me/${rawWa}?text=Hola,%20solicito%20asistencia%20en%20sala%20en%20${encodeURIComponent(activeClub.name)}`
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100dvh',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'linear-gradient(180deg, #090A0F 0%, #050608 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(15, 17, 24, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(229, 181, 79, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              Concierge en Sala
            </h3>
            <span style={{ fontSize: '0.68rem', color: 'var(--brand-gold)', fontWeight: 700 }}>
              {activeClub.name}
            </span>
          </div>
        </div>

        <span style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          ATENCIÓN EN VIVO
        </span>
      </div>

      {/* Main Scrollable Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* WhatsApp Fallback Banner */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(37, 211, 102, 0.1)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: '#25d366',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} />
              <span>¿Urgente? Contactar vía WhatsApp oficial</span>
            </div>
            <span style={{ fontSize: '0.72rem', textDecoration: 'underline' }}>Abrir chat</span>
          </a>
        )}

        {/* Formulario de Solicitud */}
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--brand-gold)', letterSpacing: '0.04em' }}>
            NUEVA SOLICITUD A SALA
          </span>

          {/* Chips de tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedType(opt.id)}
                  style={{
                    background: isSelected ? 'rgba(229, 181, 79, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    padding: '10px 8px',
                    color: isSelected ? 'var(--brand-gold)' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={18} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mensaje opcional */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              DETALLES O INSTRUCCIÓN (OPCIONAL)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 300))}
              placeholder="Ej: Copas de champán adicionales, hielo o encendedor para la mesa..."
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>
              {message.length} / 300 caracteres
            </div>
          </div>

          {feedback && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: feedback.kind === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {feedback.kind === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
              color: '#0a0d14',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: isSubmitting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(229, 181, 79, 0.25)'
            }}
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Enviando...' : 'Llamar al Personal'}</span>
          </button>
        </form>

        {/* Sección: Mis Solicitudes en Vivo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#cbd5e1' }}>
              MIS SOLICITUDES EN SALA
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              {myRequests.length} registradas
            </span>
          </div>

          {myRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '28px 16px',
              background: 'rgba(255, 255, 255, 0.015)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              color: '#64748b',
              fontSize: '0.8rem'
            }}>
              No tienes solicitudes activas. Al enviar una, verás aquí el estado en vivo del mesero.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myRequests.map(req => {
                const isPending = req.status === 'PENDING';
                const isInProgress = req.status === 'IN_PROGRESS';
                const isDone = req.status === 'DONE';
                const isCancelled = req.status === 'CANCELLED';

                let statusLabel = 'PENDIENTE';
                let statusColor = '#fbbf24';
                let statusBg = 'rgba(251, 191, 36, 0.12)';

                if (isInProgress) {
                  statusLabel = req.assignedWaiterName ? `EN ATENCIÓN (${req.assignedWaiterName})` : 'EN ATENCIÓN';
                  statusColor = '#38bdf8';
                  statusBg = 'rgba(56, 189, 248, 0.15)';
                } else if (isDone) {
                  statusLabel = 'ATENDIDA';
                  statusColor = '#34d399';
                  statusBg = 'rgba(52, 211, 153, 0.12)';
                } else if (isCancelled) {
                  statusLabel = 'CANCELADA';
                  statusColor = '#94a3b8';
                  statusBg = 'rgba(148, 163, 184, 0.1)';
                }

                return (
                  <div
                    key={req.requestId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                          {req.type}
                        </span>
                        {req.tableCode && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--brand-gold)', fontWeight: 700 }}>
                            · Mesa {req.tableCode}
                          </span>
                        )}
                      </div>

                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`
                      }}>
                        {statusLabel}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {req.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                      </span>

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(req.requestId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                        >
                          Cancelar solicitud
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

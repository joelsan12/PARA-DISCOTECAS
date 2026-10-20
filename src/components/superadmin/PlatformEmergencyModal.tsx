import { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import type { Club, AuditLog } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  revocationVersion: number;
  onIncrementRevocation: (clubId?: string) => number;
  auditLogs: AuditLog[];
}

export const PlatformEmergencyModal = ({
  isOpen,
  onClose,
  clubs,
  revocationVersion,
  onIncrementRevocation,
  auditLogs,
}: Props) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isConfirmingGlobal, setIsConfirmingGlobal] = useState(false);

  if (!isOpen) return null;

  const handleClubRevoke = () => {
    const club = clubs.find(c => c.id === selectedClubId);
    const newVersion = onIncrementRevocation(selectedClubId);
    setActionFeedback(
      `Revocación registrada en el panel para ${club?.name || selectedClubId} (revocationVersion: ${newVersion}). El invalidado efectivo de sesiones y pases se aplicará cuando este panel quede conectado al backend §8 (Cloud Run / Render).`
    );
  };

  const handleGlobalRevoke = () => {
    const newVersion = onIncrementRevocation();
    setIsConfirmingGlobal(false);
    setActionFeedback(
      `Versión global elevada a ${newVersion} en este panel. Las terminales de puerta la adoptarán cuando el backend §8 confirme la nueva versión; mientras tanto no se ha notificado a ningún dispositivo.`
    );
  };

  const securityLogs = auditLogs
    .filter(l => l.role === 'super_admin' || l.action.includes('REVOCATION') || l.action.includes('INCIDENT') || l.action.includes('TENANT'))
    .slice(0, 8);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(22, 10, 15, 0.98) 0%, rgba(10, 6, 8, 0.99) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.15)',
          padding: '28px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--state-danger, #f43f5e)'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-brand" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
                Mando de Emergencia y Revocación Escalonada
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--state-danger-text, #fda4af)' }}>
                Diseño AGENTS §8 · intervención de nivel SuperAdmin · ejecución local pendiente de backend
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

        {/* Versión activa banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Versión Criptográfica de Revocación Activa
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-high, #ffffff)', fontFamily: 'var(--font-mono)' }}>
              revocationVersion: <span style={{ color: 'var(--state-danger, #f43f5e)' }}>{revocationVersion}</span>
            </div>
          </div>

          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(229, 181, 79, 0.15)',
            color: 'var(--brand-gold)',
            border: '1px solid rgba(229, 181, 79, 0.3)'
          }}>
            REVOCACIÓN LOCAL · BACKEND PENDIENTE
          </span>
        </div>

        {actionFeedback && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: 'var(--state-success, #86efac)',
            fontSize: '0.8rem',
            marginBottom: '18px',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--state-success, #4ade80)' }} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Control 1: Revocación por Discoteca */}
        <div style={{
          padding: '18px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={15} color="var(--gold, #e5b54f)" />
            <span>1. Revocación Selectiva por Establecimiento</span>
          </h4>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Invalida de inmediato todos los pases QR emitidos y sesiones de escáner en la terminal de puerta de un club específico ante sospecha de compromiso físico o reenvío masivo.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedClubId}
              onChange={e => setSelectedClubId(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.95)',
                border: '1px solid rgba(229, 181, 79, 0.3)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleClubRevoke}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                background: 'rgba(229, 181, 79, 0.15)',
                border: '1px solid rgba(229, 181, 79, 0.4)',
                color: 'var(--brand-gold)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <RefreshCw size={13} />
              <span>Revocar Sesiones del Club</span>
            </button>
          </div>
        </div>

        {/* Control 2: Revocación Masiva Global */}
        <div style={{
          padding: '18px',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.05)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--state-danger-text, #fda4af)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--state-danger, #f43f5e)" />
            <span>2. Revocación Global de Emergencia (Plataforma Completa)</span>
          </h4>
          <p style={{ fontSize: '0.76rem', color: 'var(--state-neutral, #cbd5e1)', margin: '0 0 14px', lineHeight: 1.4 }}>
            <strong>Acción Crítica:</strong> Eleva la versión global de revocación. Todos los pases de acceso activo en toda la plataforma son forzados a refresh con la autoridad de validación.
          </p>

          {!isConfirmingGlobal ? (
            <button
              type="button"
              onClick={() => setIsConfirmingGlobal(true)}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.18)',
                border: '1px solid rgba(244, 63, 94, 0.45)',
                color: 'var(--state-danger, #f43f5e)',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ShieldAlert size={15} />
              <span>Iniciar Protocolo de Revocación Global</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '12px',
              borderRadius: '6px',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid var(--state-danger, #f43f5e)'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-high, #ffffff)', fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center' }}>
                ¿Confirmas elevar la versión global de seguridad?
              </span>
              <button
                type="button"
                onClick={() => setIsConfirmingGlobal(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGlobalRevoke}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'var(--state-danger, #f43f5e)',
                  border: 'none',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Sí, Ejecutar Revocación
              </button>
            </div>
          )}
        </div>

        {/* Registro de Auditoría de Emergencia */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ÚLTIMOS REGISTROS DE SEGURIDAD Y TENANCY (AUDIT LOGS)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
            {securityLogs.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', padding: '8px' }}>
                Sin incidentes recientes registrados.
              </div>
            ) : (
              securityLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.72rem'
                  }}
                >
                  <span style={{ color: 'var(--state-neutral, #cbd5e1)' }}>{log.details}</span>
                  <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.66rem' }}>
                    {log.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

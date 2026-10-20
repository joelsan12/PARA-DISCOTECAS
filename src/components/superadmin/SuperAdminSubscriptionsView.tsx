import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  PlusCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  X,
  Layers,
} from 'lucide-react';
import { callFunctions } from '../../lib/functionsClient';
import type { Club, SubscriptionPlanId } from '../../types';
import { esPlan } from '../../lib/esLabels';
import { formatUsd } from '../../lib/formatUsd';

interface PlatformSubscriptionRecord {
  id: string;
  businessId: string;
  planId: string;
  cycle: string;
  amount: number;
  currency: string;
  method: string;
  reference?: string;
  periodStart?: number;
  periodEnd?: number;
  status: string;
  createdAt?: number;
}

interface SuperAdminSubscriptionsViewProps {
  clubs: Club[];
  onRefreshClubs?: () => void;
}

export const SuperAdminSubscriptionsView: React.FC<SuperAdminSubscriptionsViewProps> = ({
  clubs,
  onRefreshClubs,
}) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PlatformSubscriptionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal registrar transferencia
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
  const [transferPlanId, setTransferPlanId] = useState<SubscriptionPlanId>('club_pro');
  const [transferCycle, setTransferCycle] = useState<'monthly' | 'annual'>('monthly');
  const [transferAmount, setTransferAmount] = useState<number>(15);
  const [transferReference, setTransferReference] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Modal modificar estado manual
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusClubId, setStatusClubId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('active');
  const [extendDays, setExtendDays] = useState<number>(30);
  const [statusPlanId, setStatusPlanId] = useState<string>('club_pro');
  const [statusNotes, setStatusNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callFunctions<{ records: PlatformSubscriptionRecord[] }>(
        'listPlatformSubscriptions',
        { limit: 50 }
      );
      setRecords(res.records || []);
    } catch (err) {
      console.warn('Error cargando historial de suscripciones SaaS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    callFunctions<{ records: PlatformSubscriptionRecord[] }>(
      'listPlatformSubscriptions',
      { limit: 50 }
    )
      .then((res) => {
        if (active && res.records) {
          setRecords(res.records);
        }
      })
      .catch((err) => {
        console.warn('Error cargando historial de suscripciones SaaS:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenTransfer = (clubId?: string) => {
    if (clubId) setSelectedClubId(clubId);
    setTransferReference(`TRF-${Date.now().toString().slice(-6)}`);
    setTransferModalOpen(true);
  };

  const handleOpenStatus = (club: Club) => {
    setStatusClubId(club.id);
    setStatusPlanId(club.plan_id);
    setNewStatus('active');
    setExtendDays(30);
    setStatusModalOpen(true);
  };

  const handleRegisterTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId) return;
    setSubmittingTransfer(true);
    setError(null);
    try {
      await callFunctions('registerSubscriptionTransfer', {
        businessId: selectedClubId,
        planId: transferPlanId,
        cycle: transferCycle,
        amount: Number(transferAmount),
        reference: transferReference.trim(),
        notes: transferNotes.trim() || undefined,
      });
      setSuccess(`Transferencia registrada para ${selectedClubId}. Periodo extendido exitosamente.`);
      setTransferModalOpen(false);
      setTransferNotes('');
      fetchLedgers();
      onRefreshClubs?.();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar transferencia');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusClubId) return;
    setSubmittingStatus(true);
    setError(null);
    try {
      await callFunctions('updateSubscriptionStatusManual', {
        businessId: statusClubId,
        status: newStatus,
        planId: statusPlanId,
        extendDays: Number(extendDays),
        notes: statusNotes.trim() || undefined,
      });
      setSuccess(`Estado de suscripción actualizado para ${statusClubId}.`);
      setStatusModalOpen(false);
      setStatusNotes('');
      fetchLedgers();
      onRefreshClubs?.();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al modificar estado');
    } finally {
      setSubmittingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alertas */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: 'var(--state-danger, #f87171)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--state-success, #34d399)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-high, #ffffff)' }}>
            Control de Suscripciones SaaS &amp; Facturación
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Supervisa el estado de membresías de los clubes, activa trials, registra transferencias y administra periodos de gracia.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchLedgers}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => handleOpenTransfer()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--gold, #e5b54f) 0%, var(--gold-hover, #d4a33d) 100%)',
              border: '1px solid rgba(229, 181, 79, 0.6)',
              color: 'var(--bg-void, #08080c)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(229, 181, 79, 0.25)',
            }}
          >
            <PlusCircle size={15} />
            Registrar Transferencia
          </button>
        </div>
      </div>

      {/* Tabla de Clubes & Estado de Suscripción */}
      <div
        className="glass-card"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--gold, #e5b54f)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
              Estado de Membresías por Establecimiento ({clubs.length})
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Establecimiento</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Plan Actual</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Tipo de Acceso</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Estado Operativo</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Acciones SaaS</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => {
                const isFounder = club.plan_id === 'beta_vip';
                const isFree = club.plan_id === 'free';

                return (
                  <tr
                    key={club.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>{club.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {club.id}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isFounder
                            ? 'rgba(229, 181, 79, 0.15)'
                            : 'var(--bg-elevated)',
                          color: isFounder ? 'var(--gold, #e5b54f)' : 'var(--text-muted)',
                          border: `1px solid ${isFounder ? 'rgba(229, 181, 79, 0.35)' : 'var(--border)'}`,
                        }}
                      >
                        {esPlan(club.plan_id)}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {isFounder ? (
                        <span style={{ color: 'var(--gold, #e5b54f)', fontSize: '0.76rem', fontWeight: 600 }}>
                          👑 Fundador Beta (Ilimitado)
                        </span>
                      ) : isFree ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                          Lounge Free ($0/mes)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--state-success, #34d399)', fontSize: '0.76rem', fontWeight: 600 }}>
                          Comercial SaaS
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: club.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: club.status === 'active' ? 'var(--state-success, #34d399)' : 'var(--state-danger, #f87171)',
                          border: `1px solid ${club.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        {club.status === 'active' ? 'ACTIVO' : 'SUSPENDIDO'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTransfer(club.id)}
                          title="Registrar pago recibido por transferencia"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(229, 181, 79, 0.1)',
                            border: '1px solid rgba(229, 181, 79, 0.3)',
                            color: 'var(--gold, #e5b54f)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <DollarSign size={13} />
                          Cobro
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenStatus(club)}
                          title="Ajustar periodo o estado de suscripción"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'var(--text-muted, #d4d4d8)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={13} />
                          Ajustar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Cobros y Ledgers de Plataforma */}
      <div
        className="glass-card"
        style={{
          border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="var(--gold, #e5b54f)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
              Libro Mayor de Cobros SaaS (Platform Ledgers)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {records.length} transacciones registradas
          </span>
        </div>

        {records.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            No hay registros de cobros aún. Los cobros de PayPhone y transferencias aparecerán aquí.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Establecimiento</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Plan / Ciclo</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Monto</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Método</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Referencia</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-main)' }}>
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('es-EC') : '—'}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-high, #ffffff)' }}>
                      {rec.businessId}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {esPlan(rec.planId)} ({rec.cycle === 'annual' ? 'Anual' : 'Mensual'})
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--gold, #e5b54f)' }}>
                      {formatUsd(rec.amount)}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-main)' }}>
                      {rec.method === 'transfer' ? 'Transferencia' : rec.method === 'payphone_token' ? 'PayPhone (Token)' : 'PayPhone (Web)'}
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      {rec.reference || rec.id}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: rec.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: rec.status === 'PAID' ? 'var(--state-success, #34d399)' : 'var(--state-hold, #facc15)',
                          border: `1px solid ${rec.status === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                        }}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Transferencia */}
      {transferModalOpen && (
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
          onClick={() => !submittingTransfer && setTransferModalOpen(false)}
        >
          <div
            className="modal-content glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              border: '1px solid var(--border-focus, rgba(229, 181, 79, 0.4))',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(229, 181, 79, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={18} color="var(--gold, #e5b54f)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                  Registrar Cobro por Transferencia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                disabled={submittingTransfer}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterTransfer} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Establecimiento
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Plan Contratado
                  </label>
                  <select
                    value={transferPlanId}
                    onChange={(e) => {
                      const p = e.target.value as SubscriptionPlanId;
                      setTransferPlanId(p);
                      if (p === 'starter') setTransferAmount(transferCycle === 'annual' ? 50 : 5);
                      if (p === 'club_pro') setTransferAmount(transferCycle === 'annual' ? 150 : 15);
                      if (p === 'black_vip') setTransferAmount(transferCycle === 'annual' ? 450 : 45);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-high, #ffffff)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="starter">Starter Club</option>
                    <option value="club_pro">Club Pro</option>
                    <option value="black_vip">Black VIP</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Ciclo de Facturación
                  </label>
                  <select
                    value={transferCycle}
                    onChange={(e) => {
                      const c = e.target.value as 'monthly' | 'annual';
                      setTransferCycle(c);
                      if (transferPlanId === 'starter') setTransferAmount(c === 'annual' ? 50 : 5);
                      if (transferPlanId === 'club_pro') setTransferAmount(c === 'annual' ? 150 : 15);
                      if (transferPlanId === 'black_vip') setTransferAmount(c === 'annual' ? 450 : 45);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-high, #ffffff)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="monthly">Mensual (+30 días)</option>
                    <option value="annual">Anual (+365 días)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Monto Cobrado ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-high, #ffffff)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Referencia / Comprobante
                  </label>
                  <input
                    type="text"
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    required
                    placeholder="Ej: DEP-109283"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-high, #ffffff)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Notas Administrativas (Opcional)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Ej: Transferencia Banco Pichincha verificada"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  disabled={submittingTransfer}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingTransfer}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--gold, #e5b54f) 0%, var(--gold-hover, #d4a33d) 100%)',
                    border: '1px solid rgba(229, 181, 79, 0.6)',
                    color: 'var(--bg-void, #08080c)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submittingTransfer ? 'Registrando...' : 'Confirmar & Activar Periodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Estado Manual */}
      {statusModalOpen && (
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
          onClick={() => !submittingStatus && setStatusModalOpen(false)}
        >
          <div
            className="modal-content glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.2))',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                Ajustar Periodo &amp; Estado de Suscripción
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={submittingStatus}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Estado de Suscripción
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="active">Activo (Vigente)</option>
                  <option value="trialing">En Trial (Prueba de 30 días)</option>
                  <option value="past_due">Past Due (Gracia de 3 días)</option>
                  <option value="expired">Expirado (Bloqueado/Degradado)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Extender Periodo (+ Días adicionales)
                </label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="0">Sin extender días (solo cambiar estado)</option>
                  <option value="15">+15 días</option>
                  <option value="30">+30 días (1 mes de cortesía)</option>
                  <option value="60">+60 días (2 meses)</option>
                  <option value="90">+90 días (1 trimestre)</option>
                  <option value="365">+365 días (1 año completo)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Plan Asignado
                </label>
                <select
                  value={statusPlanId}
                  onChange={(e) => setStatusPlanId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="free">Lounge Free</option>
                  <option value="starter">Starter Club</option>
                  <option value="club_pro">Club Pro</option>
                  <option value="black_vip">Black VIP</option>
                  <option value="beta_vip">Beta Privada VIP</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Motivo / Notas
                </label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Ej: Periodo de prueba extendido para festival de apertura"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={submittingStatus}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--gold, #e5b54f) 0%, var(--gold-hover, #d4a33d) 100%)',
                    border: '1px solid rgba(229, 181, 79, 0.6)',
                    color: 'var(--bg-void, #08080c)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submittingStatus ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

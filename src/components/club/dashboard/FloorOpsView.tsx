import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  MonitorPlay,
  Wine,
  Bell,
  AlertCircle,
  Check,
  X,
  MessageCircle,
  Receipt,
  User,
  Sparkles,
  Flame,
  HelpCircle
} from 'lucide-react';
import type { Club, ClubTable } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { useClubStore } from '../../../store/clubStore';
import { subscribeOperations, type OperationalTableItem } from '../../../services/operationsService';
import { subscribeVenueConciergeRequests } from '../../../services/conciergeService';
import { InteractiveFloorPlan, type TableStateOverride } from '../../client/InteractiveFloorPlan';
import { OperatingTablesList } from './OperatingTablesList';
import { callFunctions } from '../../../lib/functionsClient';
import { canStaffSettleTab, isDashboardTabAllowed, normalizeCanonicalPlanId } from '../../../lib/clubPermissions';
import { normalizeEcuadorPhone } from '../../../lib/formatEcuador';
import type { ConciergeRequestRecord } from '../../../types/saas';

interface FloorOpsViewProps {
  activeClub: Club;
  session?: AdminStaffSession;
  initialMode?: 'MAP' | 'CONCIERGE';
}

export const FloorOpsView: React.FC<FloorOpsViewProps> = ({ activeClub, session, initialMode }) => {
  const store = useClubStore();
  const activePlan = store.plans.find(p => p.id === activeClub?.plan_id)
    || store.plans.find(p => normalizeCanonicalPlanId(p.id) === normalizeCanonicalPlanId(activeClub?.plan_id));
  const canAccessConcierge = isDashboardTabAllowed('FLOOR_OPS', activeClub, activePlan);

  const [modeOverride, setModeOverride] = useState<'MAP' | 'CONCIERGE' | null>(null);
  const opsMode = modeOverride ?? (initialMode || (store.dashboardTab === 'FLOOR_OPS' && canAccessConcierge ? 'CONCIERGE' : 'MAP'));
  const setOpsMode = (mode: 'MAP' | 'CONCIERGE') => setModeOverride(mode);

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent = clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0];
  const eventPricings = activeEvent
    ? store.eventPricing.filter(p => p.event_id === activeEvent.id)
    : [];

  // Live operational data
  const [operationalTables, setOperationalTables] = useState<OperationalTableItem[]>([]);
  const [conciergeRequests, setConciergeRequests] = useState<ConciergeRequestRecord[]>([]);
  const [selectedTable, setSelectedTable] = useState<ClubTable | null>(null);

  // Filters & Actions State
  const [conciergeFilter, setConciergeFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // Settlement Drawer/Modal State
  const [isSettlingOpen, setIsSettlingOpen] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState<'cash' | 'card_manual' | 'transfer' | 'other'>('cash');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSettlingSubmitting, setIsSettlingSubmitting] = useState(false);

  const canSettle = canStaffSettleTab(session?.staffRole, session?.isSuperAdmin);

  // 1. Subscribe to Live Operations (Tables, presence, consumption)
  useEffect(() => {
    if (!activeClub?.id) return;

    const unsubscribe = subscribeOperations({
      businessId: activeClub.id,
      eventId: activeEvent?.id,
      onUpdate: (items) => {
        setOperationalTables(items);
      },
      onError: (err) => {
        console.warn('[FloorOpsView] Error en suscripción a operaciones:', err);
      }
    });

    return () => unsubscribe();
  }, [activeClub?.id, activeEvent?.id]);

  // 2. Subscribe to Venue Concierge Requests
  useEffect(() => {
    if (!activeClub?.id) return;

    const unsubscribe = subscribeVenueConciergeRequests({
      businessId: activeClub.id,
      onUpdate: (requests) => {
        setConciergeRequests(requests);
      },
      onError: (err) => {
        console.warn('[FloorOpsView] Error en suscripción concierge:', err);
      }
    });

    return () => unsubscribe();
  }, [activeClub?.id]);

  // Map operational data to ClubTable IDs
  const opMap = useMemo(() => {
    const map = new Map<string, OperationalTableItem>();
    for (const op of operationalTables) {
      if (op.resourceId) map.set(op.resourceId, op);
      if (op.tableCode) map.set(op.tableCode, op);
    }
    return map;
  }, [operationalTables]);

  // Generate TableStateOverride for each table on the floor plan
  const tableStateOverrides = useMemo(() => {
    const overrides: Record<string, TableStateOverride> = {};

    for (const table of clubTables) {
      const op = opMap.get(table.id) || opMap.get(table.table_code);
      const state = op?.state || 'AVAILABLE';

      let borderColor = 'rgba(255, 255, 255, 0.15)';
      let backgroundColor = 'rgba(15, 23, 42, 0.85)';
      let color = '#94a3b8';
      let label = 'Disponible';

      switch (state) {
        case 'INSIDE':
          borderColor = '#34d399';
          backgroundColor = 'rgba(6, 40, 23, 0.95)';
          color = '#34d399';
          label = 'Cliente en Sala (INSIDE)';
          break;
        case 'CONFIRMED':
          borderColor = '#e5b54f';
          backgroundColor = 'rgba(40, 32, 10, 0.95)';
          color = '#e5b54f';
          label = 'Reserva Confirmada';
          break;
        case 'HELD':
          borderColor = '#f59e0b';
          backgroundColor = 'rgba(40, 24, 8, 0.95)';
          color = '#fbbf24';
          label = 'Hold Activo (12 min)';
          break;
        case 'SETTLED':
          borderColor = '#a855f7';
          backgroundColor = 'rgba(30, 15, 45, 0.95)';
          color = '#c084fc';
          label = 'Cuenta Cerrada (SETTLED)';
          break;
        default:
          borderColor = 'rgba(100, 116, 139, 0.4)';
          backgroundColor = 'rgba(15, 23, 42, 0.85)';
          color = '#cbd5e1';
          label = 'Disponible';
          break;
      }

      overrides[table.id] = {
        state,
        borderColor,
        backgroundColor,
        color,
        label,
        clickable: true
      };
    }

    return overrides;
  }, [clubTables, opMap]);

  // Counters for Legend
  const counts = useMemo(() => {
    let available = 0;
    let held = 0;
    let confirmed = 0;
    let inside = 0;
    let settled = 0;

    for (const table of clubTables) {
      const op = opMap.get(table.id) || opMap.get(table.table_code);
      const state = op?.state || 'AVAILABLE';
      if (state === 'INSIDE') inside++;
      else if (state === 'CONFIRMED') confirmed++;
      else if (state === 'HELD') held++;
      else if (state === 'SETTLED') settled++;
      else available++;
    }

    return { available, held, confirmed, inside, settled };
  }, [clubTables, opMap]);

  // Selected table operational details
  const selectedOp = useMemo(() => {
    if (!selectedTable) return null;
    return opMap.get(selectedTable.id) || opMap.get(selectedTable.table_code) || null;
  }, [selectedTable, opMap]);

  // Concierge requests for selected table
  const selectedTableRequests = useMemo(() => {
    if (!selectedTable) return [];
    return conciergeRequests.filter(req => {
      if (selectedTable.id && (req.resourceId === selectedTable.id || req.tableCode === selectedTable.table_code)) return true;
      if (selectedOp?.activeReservationId && req.reservationId === selectedOp.activeReservationId) return true;
      return false;
    });
  }, [selectedTable, selectedOp, conciergeRequests]);

  // Filtered venue concierge requests
  const filteredVenueRequests = useMemo(() => {
    return conciergeRequests.filter(req => {
      if (conciergeFilter === 'PENDING') return req.status === 'PENDING';
      if (conciergeFilter === 'IN_PROGRESS') return req.status === 'IN_PROGRESS';
      if (conciergeFilter === 'DONE') return req.status === 'DONE';
      return true;
    });
  }, [conciergeRequests, conciergeFilter]);

  const pendingRequestsCount = useMemo(() => {
    return conciergeRequests.filter(r => r.status === 'PENDING').length;
  }, [conciergeRequests]);

  // Handler for Updating Concierge Request Status
  const handleUpdateConciergeStatus = async (requestId: string, status: 'IN_PROGRESS' | 'DONE') => {
    setUpdatingReqId(requestId);
    setActionFeedback(null);
    try {
      await callFunctions('updateConciergeRequestStatus', {
        businessId: activeClub.id,
        requestId,
        status
      });
      setActionFeedback({
        kind: 'success',
        message: status === 'IN_PROGRESS' ? 'Solicitud asignada a atención.' : 'Solicitud marcada como completada.'
      });
    } catch (err: unknown) {
      setActionFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al actualizar la solicitud.'
      });
    } finally {
      setUpdatingReqId(null);
    }
  };

  // Handler for Settling Table Tab
  const handleConfirmSettlement = async () => {
    if (!selectedOp?.activeReservationId || !activeClub?.id) return;
    setIsSettlingSubmitting(true);
    setActionFeedback(null);
    try {
      await callFunctions('settleTableTab', {
        businessId: activeClub.id,
        reservationId: selectedOp.activeReservationId,
        settlementMethod,
        notes: settlementNotes.trim() || undefined
      });
      setActionFeedback({
        kind: 'success',
        message: `Cuenta de Mesa ${selectedTable?.table_code} cerrada exitosamente.`
      });
      setIsSettlingOpen(false);
      setSettlementNotes('');
    } catch (err: unknown) {
      setActionFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al registrar el cierre de la comanda.'
      });
    } finally {
      setIsSettlingSubmitting(false);
    }
  };

  const getConciergeTypeMeta = (type: string) => {
    switch (type) {
      case 'WAITER':
        return { label: 'Llamar Mesero', color: '#38bdf8', icon: Bell };
      case 'BOTTLE':
        return { label: 'Botella VIP', color: '#a855f7', icon: Wine };
      case 'HOOKAH':
        return { label: 'Hookah / Narguile', color: '#f97316', icon: Flame };
      case 'SERVICE':
        return { label: 'Servicio / Hielo', color: '#34d399', icon: Sparkles };
      default:
        return { label: 'Otro Pedido', color: '#e5b54f', icon: HelpCircle };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── Banner de Feedback Global ── */}
      {actionFeedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: actionFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${actionFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: actionFeedback.kind === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionFeedback.kind === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Cabecera Ejecutiva Unificada: Sala & Concierge ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 20, 30, 0.95) 0%, rgba(8, 11, 18, 0.98) 100%)',
        border: '1px solid rgba(229, 181, 79, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      }}>
        {/* Fila Superior: Título + Selector de Modo Segmentado */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: 'rgba(229, 181, 79, 0.12)',
              border: '1px solid rgba(229, 181, 79, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e5b54f',
              boxShadow: '0 0 16px rgba(229, 181, 79, 0.15)',
            }}>
              {opsMode === 'MAP' ? <MonitorPlay size={20} /> : <Compass size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#f4f1ea' }}>
                  {opsMode === 'MAP' ? 'Sala en Vivo · Plano & Mesas' : 'Piso & Concierge · Control de Operaciones'}
                </h3>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}>
                  LIVE
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                {activeClub.name} · {clubTables.length} mesas configuradas · Sincronización en vivo
              </p>
            </div>
          </div>

          {/* Selector Segmentado de Modo (Colores VIP Nightflow) */}
          {canAccessConcierge && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(229, 181, 79, 0.22)',
            }}>
              <button
                type="button"
                onClick={() => setOpsMode('MAP')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: opsMode === 'MAP' ? '1px solid rgba(229, 181, 79, 0.45)' : '1px solid transparent',
                  background: opsMode === 'MAP' ? 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.08) 100%)' : 'transparent',
                  color: opsMode === 'MAP' ? '#f4f1ea' : 'rgba(255, 255, 255, 0.55)',
                  fontSize: '0.8rem',
                  fontWeight: opsMode === 'MAP' ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: opsMode === 'MAP' ? '0 2px 10px rgba(229, 181, 79, 0.18)' : 'none',
                }}
              >
                <MonitorPlay size={14} style={{ color: opsMode === 'MAP' ? '#e5b54f' : 'inherit' }} />
                <span>Sala en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setOpsMode('CONCIERGE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: opsMode === 'CONCIERGE' ? '1px solid rgba(229, 181, 79, 0.45)' : '1px solid transparent',
                  background: opsMode === 'CONCIERGE' ? 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.08) 100%)' : 'transparent',
                  color: opsMode === 'CONCIERGE' ? '#f4f1ea' : 'rgba(255, 255, 255, 0.55)',
                  fontSize: '0.8rem',
                  fontWeight: opsMode === 'CONCIERGE' ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: opsMode === 'CONCIERGE' ? '0 2px 10px rgba(229, 181, 79, 0.18)' : 'none',
                }}
              >
                <Compass size={14} style={{ color: opsMode === 'CONCIERGE' ? '#e5b54f' : 'inherit' }} />
                <span>Piso &amp; Concierge</span>
                {pendingRequestsCount > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                  }}>
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Fila Inferior: Contadores de Estados de Mesas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            fontSize: '0.72rem',
            color: '#34d399',
            fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
            <span>En Sala ({counts.inside})</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(229, 181, 79, 0.1)',
            border: '1px solid rgba(229, 181, 79, 0.25)',
            fontSize: '0.72rem',
            color: '#e5b54f',
            fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#e5b54f' }} />
            <span>Reservada ({counts.confirmed})</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '0.72rem',
            color: '#fbbf24',
            fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
            <span>Hold ({counts.held})</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            fontSize: '0.72rem',
            color: '#c084fc',
            fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a855f7' }} />
            <span>Cerrada ({counts.settled})</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(100, 116, 139, 0.1)',
            border: '1px solid rgba(100, 116, 139, 0.25)',
            fontSize: '0.72rem',
            color: '#cbd5e1',
            fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#64748b' }} />
            <span>Disponible ({counts.available})</span>
          </div>
        </div>
      </div>

      {/* ── Distribución en 2 Columnas: Plano & Drawer (Izquierda) + Cola Concierge (Derecha) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Columna Izquierda: Plano Interactivo con Sobreescrituras de Estado + Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(16, 20, 30, 0.95) 0%, rgba(9, 11, 16, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <InteractiveFloorPlan
              tables={clubTables}
              eventPricings={eventPricings}
              selectedTableId={selectedTable?.id || null}
              onSelectTable={(table) => {
                setSelectedTable(table);
                setIsSettlingOpen(false);
              }}
              tableStateOverrides={tableStateOverrides}
            />
          </div>

          {/* Drawer / Inspector de la Mesa Seleccionada */}
          {selectedTable ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.98) 0%, rgba(9, 12, 18, 0.99) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              {/* Header Mesa */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f4f1ea' }}>
                      {selectedTable.table_code}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8'
                    }}>
                      {selectedTable.zone}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#94a3b8'
                    }}>
                      Capacidad: {selectedTable.capacity} pers.
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Estado actual: <strong style={{ color: tableStateOverrides[selectedTable.id]?.color }}>{tableStateOverrides[selectedTable.id]?.label}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Ficha de Reserva & Cliente */}
              {selectedOp?.activeReservationId ? (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} style={{ color: '#e5b54f' }} />
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f4f1ea' }}>
                        {selectedOp.guestName || 'Titular de Reserva'}
                      </span>
                    </div>

                    {selectedOp.reservation?.customer_phone && (
                      <a
                        href={`https://wa.me/${normalizeEcuadorPhone(selectedOp.reservation.customer_phone).replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(selectedOp.guestName || '')},%20te%20contactamos%20desde%20${encodeURIComponent(activeClub.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#34d399',
                          background: 'rgba(52, 211, 153, 0.12)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
                    <div>
                      <span>Reserva: </span>
                      <strong style={{ color: '#cbd5e1' }}>{selectedOp.activeReservationId.slice(0, 12)}...</strong>
                    </div>
                    <div>
                      <span>Presencia: </span>
                      <strong style={{ color: selectedOp.state === 'INSIDE' ? '#34d399' : '#94a3b8' }}>
                        {selectedOp.state === 'INSIDE' ? 'EN SALA' : 'FUERA / PENDIENTE'}
                      </strong>
                    </div>
                  </div>

                  {/* Bloque de Consumo */}
                  <div style={{
                    marginTop: '4px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Consumo: <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>${(selectedOp.consumptionTotal || 0).toFixed(2)}</strong>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Mínimo: ${(selectedOp.minSpend || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((selectedOp.consumptionTotal || 0) / (selectedOp.minSpend || 1)) * 100)}%`,
                        background: (selectedOp.consumptionTotal || 0) >= (selectedOp.minSpend || 0)
                          ? '#34d399'
                          : 'linear-gradient(90deg, #38bdf8 0%, #e5b54f 100%)',
                        borderRadius: '999px'
                      }} />
                    </div>

                    {/* Botón de Cierre de Cuenta */}
                    {canSettle && selectedOp.state !== 'SETTLED' && (
                      <div style={{ marginTop: '10px' }}>
                        {!isSettlingOpen ? (
                          <button
                            type="button"
                            onClick={() => setIsSettlingOpen(true)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#c084fc',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Receipt size={14} />
                            <span>Cerrar Cuenta &amp; Cobrar Mesa</span>
                          </button>
                        ) : (
                          <div style={{
                            marginTop: '6px',
                            padding: '12px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '8px',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f4f1ea' }}>
                              Confirmar Liquidación de Mesa
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              {(['cash', 'card_manual', 'transfer'] as const).map(method => (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => setSettlementMethod(method)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: settlementMethod === method ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
                                    background: settlementMethod === method ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                    color: settlementMethod === method ? '#f4f1ea' : '#94a3b8'
                                  }}
                                >
                                  {method === 'cash' ? 'Efectivo' : method === 'card_manual' ? 'Tarjeta' : 'Transferencia'}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              placeholder="Notas opcionales (recibo, voucher...)"
                              value={settlementNotes}
                              onChange={e => setSettlementNotes(e.target.value)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: '#f4f1ea',
                                fontSize: '0.74rem'
                              }}
                            />

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setIsSettlingOpen(false)}
                                style={{
                                  flex: 1,
                                  padding: '7px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: 'none',
                                  color: '#94a3b8',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={isSettlingSubmitting}
                                onClick={handleConfirmSettlement}
                                style={{
                                  flex: 2,
                                  padding: '7px',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: isSettlingSubmitting ? 'wait' : 'pointer'
                                }}
                              >
                                {isSettlingSubmitting ? 'Cerrando...' : 'Confirmar Cierre'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  textAlign: 'center'
                }}>
                  Esta mesa no tiene una reserva activa asignada en este momento.
                </div>
              )}

              {/* Solicitudes Concierge de esta mesa */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f4f1ea', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} style={{ color: '#fbbf24' }} />
                  <span>Peticiones de esta Mesa ({selectedTableRequests.length})</span>
                </div>

                {selectedTableRequests.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
                    Sin peticiones activas de concierge.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTableRequests.map(req => {
                      const meta = getConciergeTypeMeta(req.type);
                      const isPending = req.status === 'PENDING';
                      const isInProgress = req.status === 'IN_PROGRESS';

                      return (
                        <div
                          key={req.requestId}
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: meta.color }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: isPending ? '#fbbf24' : '#38bdf8' }}>
                              {req.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                            "{req.message}"
                          </div>
                          {(isPending || isInProgress) && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                              {isPending && (
                                <button
                                  type="button"
                                  disabled={updatingReqId === req.requestId}
                                  onClick={() => handleUpdateConciergeStatus(req.requestId, 'IN_PROGRESS')}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    color: '#fbbf24',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Tomar
                                </button>
                              )}
                              {isInProgress && (
                                <button
                                  type="button"
                                  disabled={updatingReqId === req.requestId}
                                  onClick={() => handleUpdateConciergeStatus(req.requestId, 'DONE')}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(52, 211, 153, 0.2)',
                                    border: '1px solid rgba(52, 211, 153, 0.4)',
                                    color: '#34d399',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Completar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}>
              <Compass size={14} style={{ color: '#e5b54f' }} />
              <span>Toca cualquier mesa en el plano para ver comanda, pedidos y gestionar cuenta.</span>
            </div>
          )}
        </div>

        {/* Columna Derecha: Dinámica según modo seleccionado */}
        {opsMode === 'MAP' ? (
          <OperatingTablesList
            tables={clubTables}
            eventPricings={eventPricings}
            operationalTables={operationalTables}
            session={session}
            activeClubId={activeClub.id}
          />
        ) : (
        <div style={{
          background: 'linear-gradient(180deg, rgba(16, 20, 30, 0.95) 0%, rgba(9, 11, 16, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header Cola */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}>
                <Bell size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#f4f1ea' }}>
                  Cola Concierge en Vivo
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  Atención directa de solicitudes de clientes
                </p>
              </div>
            </div>

            {pendingRequestsCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
              }}>
                {pendingRequestsCount} pendientes
              </span>
            )}
          </div>

          {/* Subfiltros por estado */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'ALL' as const, label: `Todas (${conciergeRequests.length})` },
              { id: 'PENDING' as const, label: `Pendientes (${pendingRequestsCount})` },
              { id: 'IN_PROGRESS' as const, label: 'En atención' },
              { id: 'DONE' as const, label: 'Completadas' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setConciergeFilter(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: conciergeFilter === f.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: conciergeFilter === f.id ? '#fbbf24' : '#94a3b8',
                  border: conciergeFilter === f.id ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Listado de Solicitudes */}
          {filteredVenueRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              color: '#64748b'
            }}>
              <Bell size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.84rem' }}>
                No hay solicitudes de concierge con el filtro seleccionado.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px', overflowY: 'auto' }}>
              {filteredVenueRequests.map(req => {
                const meta = getConciergeTypeMeta(req.type);
                const IconComponent = meta.icon;
                const isPending = req.status === 'PENDING';
                const isInProgress = req.status === 'IN_PROGRESS';
                const isDone = req.status === 'DONE';
                const isUpdating = updatingReqId === req.requestId;

                let statusBorder = 'rgba(255, 255, 255, 0.08)';
                let statusBadgeBg = 'rgba(148, 163, 184, 0.15)';
                let statusBadgeColor = '#94a3b8';

                if (isPending) {
                  statusBorder = 'rgba(245, 158, 11, 0.4)';
                  statusBadgeBg = 'rgba(245, 158, 11, 0.15)';
                  statusBadgeColor = '#fbbf24';
                } else if (isInProgress) {
                  statusBorder = 'rgba(56, 189, 248, 0.4)';
                  statusBadgeBg = 'rgba(56, 189, 248, 0.15)';
                  statusBadgeColor = '#38bdf8';
                } else if (isDone) {
                  statusBorder = 'rgba(52, 211, 153, 0.3)';
                  statusBadgeBg = 'rgba(52, 211, 153, 0.15)';
                  statusBadgeColor = '#34d399';
                }

                return (
                  <div
                    key={req.requestId}
                    style={{
                      background: 'linear-gradient(145deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 18, 0.98) 100%)',
                      border: `1px solid ${statusBorder}`,
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(229, 181, 79, 0.15)',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                          color: '#e5b54f',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '2px 7px',
                          borderRadius: '5px'
                        }}>
                          {req.tableCode ? `Mesa ${req.tableCode}` : (req.resourceId ? `Mesa ${req.resourceId}` : 'General')}
                        </span>
                        {req.zone && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#94a3b8',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {req.zone}
                          </span>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: `${meta.color}15`,
                          color: meta.color,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}>
                          <IconComponent size={12} />
                          <span>{meta.label}</span>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '5px',
                        background: statusBadgeBg,
                        color: statusBadgeColor
                      }}>
                        {req.status}
                      </span>
                    </div>

                    {/* Mensaje */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#f4f1ea',
                      fontSize: '0.82rem',
                      lineHeight: 1.4
                    }}>
                      "{req.message}"
                    </div>

                    {/* Cliente / Atendido / Acciones */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {req.customerName && (
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                            {req.customerName} ·{' '}
                          </span>
                        )}
                        {req.assignedWaiterName && (
                          <span style={{ color: '#38bdf8' }}>
                            Por: {req.assignedWaiterName} ·{' '}
                          </span>
                        )}
                        <span>
                          {req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isPending && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateConciergeStatus(req.requestId, 'IN_PROGRESS')}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              color: '#0a0d14',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: isUpdating ? 'wait' : 'pointer'
                            }}
                          >
                            Tomar
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateConciergeStatus(req.requestId, 'DONE')}
                            style={{
                              background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              color: '#0a0d14',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: isUpdating ? 'wait' : 'pointer'
                            }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default FloorOpsView;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wine,
  User,
  Layers,
  Plus,
  Minus,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  ReceiptText,
  Bell,
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import type { AdminStaffSession } from '../../lib/adminAuth';
import { useClubStore } from '../../store/clubStore';
import { subscribeOperations, type OperationalTableItem } from '../../services/operationsService';
import { subscribeVenueConciergeRequests } from '../../services/conciergeService';
import { callFunctions } from '../../lib/functionsClient';
import type { ConsumptionCatalogItem, ConciergeRequestRecord } from '../../types/saas';

interface Props {
  session: AdminStaffSession;
}

export const WaiterPwaApp: React.FC<Props> = ({ session }) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];

  const [mainTab, setMainTab] = useState<'TABLES' | 'CONCIERGE'>('TABLES');
  const [tables, setTables] = useState<OperationalTableItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<OperationalTableItem | null>(null);
  const selectedTableRef = useRef<OperationalTableItem | null>(null);

  useEffect(() => {
    selectedTableRef.current = selectedTable;
  }, [selectedTable]);

  // Consumption State
  const [catalog, setCatalog] = useState<ConsumptionCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, { item: ConsumptionCatalogItem; qty: number }>>({});
  const [addingConsumption, setAddingConsumption] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // Concierge Requests State
  const [conciergeRequests, setConciergeRequests] = useState<ConciergeRequestRecord[]>([]);
  const [conciergeFilter, setConciergeFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const [conciergeFeedback, setConciergeFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const assignedZones = session.assignedZones && session.assignedZones.length > 0
    ? session.assignedZones
    : [];

  const activeClubId = activeClub?.id;

  // 1. Subscribe to Live Operations
  useEffect(() => {
    if (!activeClubId) return;

    const unsubscribe = subscribeOperations({
      businessId: activeClubId,
      eventId: store.activeEventId,
      onUpdate: (updatedTables) => {
        setTables(updatedTables);
        if (selectedTableRef.current) {
          const fresh = updatedTables.find(t => t.resourceId === selectedTableRef.current?.resourceId);
          if (fresh) setSelectedTable(fresh);
        }
      },
      onError: (err) => {
        console.error('[WaiterPWA] Error en suscripción:', err);
      }
    });

    return () => unsubscribe();
  }, [activeClubId, store.activeEventId]);

  // 2. Subscribe to Venue Concierge Requests
  useEffect(() => {
    if (!activeClubId) return;

    const unsubscribe = subscribeVenueConciergeRequests({
      businessId: activeClubId,
      onUpdate: (requests) => {
        setConciergeRequests(requests);
      },
      onError: (err) => {
        console.error('[WaiterPWA] Error en suscripción concierge:', err);
      }
    });

    return () => unsubscribe();
  }, [activeClubId]);

  const handleUpdateConciergeStatus = async (requestId: string, status: 'IN_PROGRESS' | 'DONE') => {
    if (!activeClubId) return;
    setUpdatingReqId(requestId);
    setConciergeFeedback(null);
    try {
      await callFunctions('updateConciergeRequestStatus', {
        businessId: activeClubId,
        requestId,
        status
      });
      setConciergeFeedback({
        kind: 'success',
        message: status === 'IN_PROGRESS' ? '¡Has tomado la solicitud! Atendiendo ahora.' : '¡Solicitud completada con éxito!'
      });
    } catch (err: unknown) {
      setConciergeFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al actualizar la solicitud.'
      });
    } finally {
      setUpdatingReqId(null);
    }
  };

  // 3. Fetch Catalog when Drawer Opens
  const loadCatalog = useCallback(async () => {
    if (!activeClubId) return;
    setCatalogLoading(true);
    try {
      const res = await callFunctions<{ items: ConsumptionCatalogItem[] }>('getConsumptionCatalog', {
        businessId: activeClubId
      });
      setCatalog(res.items || []);
    } catch (err) {
      console.error('[WaiterPWA] Error cargando catálogo:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, [activeClubId]);

  const selectedTableId = selectedTable?.resourceId;
  useEffect(() => {
    if (selectedTableId) {
      void loadCatalog();
      setCart({});
      setOrderFeedback(null);
    }
  }, [selectedTableId, loadCatalog]);

  // Filter tables by waiter assigned zones
  const visibleTables = tables.filter(t => {
    if (assignedZones.length > 0 && !assignedZones.includes(String(t.zone))) {
      return false;
    }
    if (selectedZone !== 'all' && t.zone !== selectedZone) {
      return false;
    }
    return true;
  });

  const uniqueZones = Array.from(new Set(
    assignedZones.length > 0
      ? assignedZones
      : tables.map(t => String(t.zone))
  ));

  const waiterRequests = conciergeRequests.filter(req => {
    if (assignedZones.length > 0 && req.zone && !assignedZones.includes(req.zone)) {
      return false;
    }
    if (selectedZone !== 'all' && req.zone && req.zone !== selectedZone) {
      return false;
    }
    if (conciergeFilter === 'PENDING') return req.status === 'PENDING';
    if (conciergeFilter === 'IN_PROGRESS') return req.status === 'IN_PROGRESS';
    if (conciergeFilter === 'DONE') return req.status === 'DONE';
    return true;
  });

  const pendingRequestsCount = conciergeRequests.filter(req => {
    if (assignedZones.length > 0 && req.zone && !assignedZones.includes(req.zone)) {
      return false;
    }
    return req.status === 'PENDING';
  }).length;

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
        return { label: 'Otro Pedido', color: '#e5b54f', icon: AlertCircle };
    }
  };

  const updateCartQty = (item: ConsumptionCatalogItem, delta: number) => {
    setCart(prev => {
      const existing = prev[item.sku]?.qty || 0;
      const nextQty = Math.max(0, existing + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[item.sku];
        return copy;
      }
      return {
        ...prev,
        [item.sku]: { item, qty: nextQty }
      };
    });
  };

  const handleSendOrder = async () => {
    if (!selectedTable?.activeReservationId || !activeClub?.id) {
      setOrderFeedback({
        kind: 'error',
        message: 'Esta mesa no cuenta con una reserva activa o confirmada.'
      });
      return;
    }

    const itemsToSend = Object.values(cart).map(({ item, qty }) => ({
      sku: item.sku,
      name: item.name,
      qty,
      price: item.price
    }));

    if (itemsToSend.length === 0) return;

    setAddingConsumption(true);
    setOrderFeedback(null);

    try {
      await callFunctions('addConsumptionItem', {
        businessId: activeClub.id,
        reservationId: selectedTable.activeReservationId,
        idempotencyKey: `waiter_${session.uid}_${Date.now()}`,
        items: itemsToSend
      });

      setCart({});
      setOrderFeedback({
        kind: 'success',
        message: '¡Consumo registrado exitosamente en la comanda de la mesa!'
      });
    } catch (err: unknown) {
      setOrderFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al registrar el pedido.'
      });
    } finally {
      setAddingConsumption(false);
    }
  };

  const cartTotal = Object.values(cart).reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const cartItemsCount = Object.values(cart).reduce((acc, curr) => acc + curr.qty, 0);

  const categories = Array.from(new Set(catalog.map(c => c.category)));

  return (
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      minHeight: '100%',
      paddingBottom: '80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* 1. Header Mesero VIP */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 20, 30, 0.95) 0%, rgba(8, 11, 18, 0.98) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '18px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Wine size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f4f1ea' }}>
                {session.displayName}
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                letterSpacing: '0.04em'
              }}>
                MESERO EN SALA
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
              {activeClub?.name} · {visibleTables.length} mesas activas
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#34d399',
          background: 'rgba(52, 211, 153, 0.1)',
          padding: '4px 10px',
          borderRadius: '999px',
          border: '1px solid rgba(52, 211, 153, 0.25)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
          <span>EN VIVO</span>
        </div>
      </div>

      {/* 2. Navegación Principal: Mesas vs Concierge */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={() => setMainTab('TABLES')}
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            background: mainTab === 'TABLES' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: mainTab === 'TABLES' ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          <Wine size={16} />
          <span>Mesas ({visibleTables.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('CONCIERGE')}
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            background: mainTab === 'CONCIERGE' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: mainTab === 'CONCIERGE' ? '#fbbf24' : '#94a3b8',
            transition: 'all 0.15s ease',
            position: 'relative'
          }}
        >
          <Bell size={16} />
          <span>Concierge</span>
          {pendingRequestsCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '999px',
              marginLeft: '4px'
            }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Banner Feedback Concierge */}
      {conciergeFeedback && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: conciergeFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${conciergeFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: conciergeFeedback.kind === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {conciergeFeedback.kind === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{conciergeFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setConciergeFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Filtro de Zonas (Compartido) */}
      {uniqueZones.length > 1 && (
        <div
          className="waiter-pill-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 2px 10px 2px',
            flexShrink: 0,
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedZone('all')}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: selectedZone === 'all' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.07)',
              color: selectedZone === 'all' ? '#38bdf8' : '#e2e8f0',
              border: selectedZone === 'all' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: selectedZone === 'all' ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Todas mis zonas ({visibleTables.length})
          </button>
          {uniqueZones.map(z => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedZone === z ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.07)',
                color: selectedZone === z ? '#38bdf8' : '#e2e8f0',
                border: selectedZone === z ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: selectedZone === z ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* 3. Table Cards Grid */}
      {mainTab === 'TABLES' ? (
        visibleTables.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'rgba(14, 18, 26, 0.6)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          color: '#64748b'
        }}>
          <Layers size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
            No hay mesas asignadas en tus zonas activas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
          {visibleTables.map(t => {
            const isInside = t.state === 'INSIDE';
            const isConfirmed = t.state === 'CONFIRMED';
            const isSettled = t.state === 'SETTLED';
            const consumption = t.consumptionTotal || 0;
            const minSpend = t.minSpend || 0;
            const progress = minSpend > 0 ? Math.min(100, (consumption / minSpend) * 100) : 0;

            let badgeColor = '#94a3b8';
            let badgeBg = 'rgba(148, 163, 184, 0.1)';
            let badgeText = 'DISPONIBLE';

            if (isInside) {
              badgeColor = '#34d399';
              badgeBg = 'rgba(52, 211, 153, 0.15)';
              badgeText = 'CLIENTE EN SALA';
            } else if (isSettled) {
              badgeColor = '#a855f7';
              badgeBg = 'rgba(168, 85, 247, 0.15)';
              badgeText = 'CUENTA CERRADA';
            } else if (isConfirmed) {
              badgeColor = '#e5b54f';
              badgeBg = 'rgba(229, 181, 79, 0.15)';
              badgeText = 'RESERVADA';
            } else if (t.state === 'HELD') {
              badgeColor = '#f59e0b';
              badgeBg = 'rgba(245, 158, 11, 0.15)';
              badgeText = 'HOLD ACTIVO';
            }

            return (
              <div
                key={t.resourceId}
                onClick={() => (isInside || isConfirmed || isSettled) && setSelectedTable(t)}
                style={{
                  background: 'linear-gradient(145deg, rgba(16, 20, 30, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
                  border: isInside ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: (isInside || isConfirmed || isSettled) ? 'pointer' : 'default',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  boxShadow: isInside ? '0 4px 20px rgba(52, 211, 153, 0.08)' : 'none'
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f1ea' }}>
                        {t.tableCode}
                      </h4>
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8'
                      }}>
                        {t.zone}
                      </span>
                    </div>
                    {t.guestName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <User size={12} style={{ color: '#e5b54f' }} />
                        <span>{t.guestName}</span>
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}40`,
                    letterSpacing: '0.04em'
                  }}>
                    {badgeText}
                  </span>
                </div>

                {/* Consumption Bar */}
                {(isInside || isConfirmed || isSettled) && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                        Consumo: <strong style={{ color: '#38bdf8' }}>${consumption.toFixed(2)}</strong>
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Mínimo: ${minSpend.toFixed(2)}
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
                        width: `${progress}%`,
                        background: progress >= 100 ? '#34d399' : 'linear-gradient(90deg, #38bdf8 0%, #e5b54f 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                {(isInside || isConfirmed) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(t);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Añadir Pedido / Ver Comanda</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )
    ) : (
        /* Peticiones Concierge */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Subfiltros por estado */}
          <div
            className="waiter-pill-scroll"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '4px 2px 10px 2px',
              flexShrink: 0,
              alignItems: 'center'
            }}
          >
            {[
              { id: 'ALL' as const, label: `Todas (${waiterRequests.length})` },
              { id: 'PENDING' as const, label: `Pendientes (${pendingRequestsCount})` },
              { id: 'IN_PROGRESS' as const, label: 'En atención' },
              { id: 'DONE' as const, label: 'Atendidas' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setConciergeFilter(f.id)}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: conciergeFilter === f.id ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.07)',
                  color: conciergeFilter === f.id ? '#fbbf24' : '#e2e8f0',
                  border: conciergeFilter === f.id ? '1.5px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: conciergeFilter === f.id ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {waiterRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'rgba(14, 18, 26, 0.6)',
              borderRadius: '16px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              color: '#64748b'
            }}>
              <Bell size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: '#fbbf24' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#f4f1ea' }}>
                No hay peticiones de concierge en este filtro.
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                Las solicitudes en vivo de tus zonas asignadas aparecerán aquí.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {waiterRequests.map(req => {
                const meta = getConciergeTypeMeta(req.type);
                const IconComponent = meta.icon;
                const isPending = req.status === 'PENDING';
                const isInProgress = req.status === 'IN_PROGRESS';
                const isDone = req.status === 'DONE';
                const isUpdating = updatingReqId === req.requestId;

                let statusBorder = 'rgba(255, 255, 255, 0.08)';
                let statusBadgeBg = 'rgba(148, 163, 184, 0.15)';
                let statusBadgeColor = '#94a3b8';
                let statusText: string = req.status;

                if (isPending) {
                  statusBorder = 'rgba(245, 158, 11, 0.4)';
                  statusBadgeBg = 'rgba(245, 158, 11, 0.15)';
                  statusBadgeColor = '#fbbf24';
                  statusText = 'PENDIENTE';
                } else if (isInProgress) {
                  statusBorder = 'rgba(56, 189, 248, 0.4)';
                  statusBadgeBg = 'rgba(56, 189, 248, 0.15)';
                  statusBadgeColor = '#38bdf8';
                  statusText = 'EN ATENCIÓN';
                } else if (isDone) {
                  statusBorder = 'rgba(52, 211, 153, 0.3)';
                  statusBadgeBg = 'rgba(52, 211, 153, 0.15)';
                  statusBadgeColor = '#34d399';
                  statusText = 'COMPLETADA';
                }

                return (
                  <div
                    key={req.requestId}
                    style={{
                      background: 'linear-gradient(145deg, rgba(16, 20, 30, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
                      border: `1px solid ${statusBorder}`,
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isPending ? '0 4px 20px rgba(245, 158, 11, 0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(229, 181, 79, 0.15)',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                          color: '#e5b54f',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {req.tableCode ? `Mesa ${req.tableCode}` : (req.resourceId ? `Mesa ${req.resourceId}` : 'General')}
                        </span>
                        {req.zone && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#94a3b8',
                            fontWeight: 700,
                            fontSize: '0.72rem',
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
                          border: `1px solid ${meta.color}35`,
                          fontSize: '0.72rem',
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
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: statusBadgeBg,
                        color: statusBadgeColor,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap'
                      }}>
                        {statusText}
                      </span>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f4f1ea',
                      fontSize: '0.86rem',
                      lineHeight: 1.4
                    }}>
                      "{req.message}"
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        {req.customerName && (
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                            Cliente: {req.customerName} {req.customerPhone ? `(${req.customerPhone})` : ''} ·{' '}
                          </span>
                        )}
                        {req.assignedWaiterName && (
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                            Atendido por {req.assignedWaiterName} ·{' '}
                          </span>
                        )}
                        <span>
                          {req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isPending && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateConciergeStatus(req.requestId, 'IN_PROGRESS')}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              color: '#0a0d14',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: isUpdating ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            <Bell size={14} />
                            <span>{isUpdating ? 'Asignando...' : 'Tomar Solicitud'}</span>
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
                              borderRadius: '8px',
                              padding: '8px 14px',
                              color: '#0a0d14',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: isUpdating ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)'
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>{isUpdating ? 'Guardando...' : 'Marcar Atendida'}</span>
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

      {/* 4. Bottom Sheet / Drawer de Comanda */}
      {selectedTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 4, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #121722 0%, #080c14 100%)',
            borderTop: '1px solid rgba(56, 189, 248, 0.3)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: '90vh',
            width: '100%',
            maxWidth: '1020px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Sheet Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f4f1ea' }}>
                    {selectedTable.tableCode}
                  </h3>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8'
                  }}>
                    {selectedTable.zone}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {selectedTable.guestName || 'Invitado'} · Consumo actual: ${(selectedTable.consumptionTotal || 0).toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Feedback alert */}
            {orderFeedback && (
              <div style={{
                margin: '12px 20px 0 20px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: orderFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${orderFeedback.kind === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: orderFeedback.kind === 'success' ? '#34d399' : '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {orderFeedback.kind === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{orderFeedback.message}</span>
              </div>
            )}

            {/* Scrollable Content (Catálogo & Comanda) */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Category Pills */}
              <div
                className="waiter-pill-scroll"
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '4px 2px 10px 2px',
                  flexShrink: 0,
                  alignItems: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedCategory === 'all' ? 'rgba(229, 181, 79, 0.22)' : 'rgba(255, 255, 255, 0.07)',
                    color: selectedCategory === 'all' ? '#e5b54f' : '#e2e8f0',
                    border: selectedCategory === 'all' ? '1.5px solid #e5b54f' : '1px solid rgba(255, 255, 255, 0.16)',
                    boxShadow: selectedCategory === 'all' ? '0 0 12px rgba(229, 181, 79, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Todo el Catálogo
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      height: '36px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: selectedCategory === cat ? 'rgba(229, 181, 79, 0.22)' : 'rgba(255, 255, 255, 0.07)',
                      color: selectedCategory === cat ? '#e5b54f' : '#e2e8f0',
                      border: selectedCategory === cat ? '1.5px solid #e5b54f' : '1px solid rgba(255, 255, 255, 0.16)',
                      boxShadow: selectedCategory === cat ? '0 0 12px rgba(229, 181, 79, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items List */}
              {catalogLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                  Cargando productos de carta...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {catalog
                    .filter(c => selectedCategory === 'all' || c.category === selectedCategory)
                    .map(it => {
                      const inCart = cart[it.sku]?.qty || 0;
                      return (
                        <div
                          key={it.sku}
                          style={{
                            background: inCart > 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: inCart > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f4f1ea' }}>
                              {it.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#e5b54f', fontWeight: 700, marginTop: '2px' }}>
                              ${it.price.toFixed(2)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {inCart > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(it, -1)}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: 'none',
                                    color: '#f4f1ea',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Minus size={14} />
                                </button>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', minWidth: '18px', textAlign: 'center' }}>
                                  {inCart}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => updateCartQty(it, 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: inCart > 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.15)',
                                border: 'none',
                                color: inCart > 0 ? '#0a0d14' : '#38bdf8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Sheet Footer with Cart & Send Button */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(8, 12, 18, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>
                  Total Pedido a Cargar:
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                  ${cartTotal.toFixed(2)} ({cartItemsCount} {cartItemsCount === 1 ? 'ítem' : 'ítems'})
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendOrder}
                disabled={addingConsumption || cartItemsCount === 0}
                style={{
                  width: '100%',
                  background: cartItemsCount > 0
                    ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)'
                    : 'rgba(255, 255, 255, 0.07)',
                  border: cartItemsCount > 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: cartItemsCount > 0 ? '#0a0d14' : '#cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: cartItemsCount > 0 && !addingConsumption ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: cartItemsCount > 0 ? '0 4px 16px rgba(56, 189, 248, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {addingConsumption ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Registrando en comanda...</span>
                  </>
                ) : (
                  <>
                    <ReceiptText size={16} />
                    <span>
                      {cartItemsCount > 0 ? 'Confirmar Pedido a la Mesa' : 'Confirmar Pedido a la Mesa (0 ítems)'}
                    </span>
                  </>
                )}
              </button>

              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
                El cierre definitivo y cobro se realiza exclusivamente por caja o gerencia.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

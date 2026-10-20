import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { callFunctions } from '../../../lib/functionsClient';
import type { Club } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { canStaffRefund } from '../../../lib/clubPermissions';
import { formatUsd } from '../../../lib/formatUsd';

interface Props {
  activeClub: Club;
  session?: AdminStaffSession;
}

export interface EnrichedTransaction {
  id: string;
  holdId?: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  paymentMode?: string;
  providerTransactionId?: string;
  refundId?: string;
  refundedAt?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  holdState?: string;
  paymentState?: string;
  refundStatus?: string;
}

interface ListTransactionsResponse {
  businessId: string;
  transactions: EnrichedTransaction[];
  count: number;
}

function readableError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Error desconocido al contactar con el servidor.';
}

function formatTxDate(val: unknown): string {
  if (!val) return '—';
  let date: Date;
  if (typeof val === 'number') {
    date = new Date(val);
  } else if (typeof val === 'object' && val !== null && '_seconds' in val) {
    date = new Date((val as { _seconds: number })._seconds * 1000);
  } else if (typeof val === 'string') {
    date = new Date(val);
  } else {
    return '—';
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Guayaquil',
  });
}

type FilterStatus = 'ALL' | 'PAID' | 'REFUNDED' | 'REFUND_REQUIRED' | 'FAILED';

export const PaymentTransactionsManager = ({ activeClub, session }: Props) => {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Estados de reembolso
  const [refundingTxId, setRefundingTxId] = useState<string | null>(null);
  const [refundConfirmTx, setRefundConfirmTx] = useState<EnrichedTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  const canRefund = canStaffRefund(session?.staffRole, session?.isSuperAdmin);

  const loadTransactions = useCallback(() => {
    setLoadingTx(true);
    setTxError(null);
    callFunctions<ListTransactionsResponse>('listPaymentTransactions', {
      businessId: activeClub.id,
      limit: 100,
    })
      .then((res) => {
        setTransactions(res.transactions || []);
      })
      .catch((err) => {
        setTxError(readableError(err));
      })
      .finally(() => {
        setLoadingTx(false);
      });
  }, [activeClub.id]);

  useEffect(() => {
    let cancelled = false;
    callFunctions<ListTransactionsResponse>('listPaymentTransactions', {
      businessId: activeClub.id,
      limit: 100,
    })
      .then((res) => {
        if (!cancelled) setTransactions(res.transactions || []);
      })
      .catch((err) => {
        if (!cancelled) setTxError(readableError(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingTx(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClub.id]);

  const handleExecuteRefund = async () => {
    if (!refundConfirmTx) return;
    setRefundingTxId(refundConfirmTx.id);
    setRefundError(null);
    setRefundSuccess(null);
    try {
      const res = await callFunctions<{ status: string; refundId: string; replay?: boolean }>(
        'createPaymentRefund',
        {
          businessId: activeClub.id,
          transactionId: refundConfirmTx.id,
          reason: refundReason.trim() || 'Reembolso administrativo desde consola',
        }
      );
      setRefundSuccess(`Reembolso emitido con éxito (#${res.refundId}).`);
      setRefundConfirmTx(null);
      setRefundReason('');
      loadTransactions();
    } catch (err) {
      setRefundError(readableError(err));
    } finally {
      setRefundingTxId(null);
    }
  };

  // Métricas ejecutivas
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalRefunded = 0;
    let paidCount = 0;
    let refundRequiredCount = 0;

    for (const tx of transactions) {
      const amount = tx.amount || 0;
      if (tx.status === 'PAID') {
        totalCollected += amount;
        paidCount++;
      } else if (tx.status === 'REFUNDED') {
        totalRefunded += amount;
      } else if (tx.status === 'REFUND_REQUIRED') {
        refundRequiredCount++;
      }
    }

    return {
      totalCollected,
      totalRefunded,
      paidCount,
      refundRequiredCount,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filtro de estado
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
        return false;
      }

      // Búsqueda por texto (id, holdId, provider, monto)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = tx.id.toLowerCase().includes(query);
        const holdMatch = tx.holdId ? tx.holdId.toLowerCase().includes(query) : false;
        const providerMatch = tx.provider ? tx.provider.toLowerCase().includes(query) : false;
        const amountMatch = String(tx.amount || '').includes(query);
        return idMatch || holdMatch || providerMatch || amountMatch;
      }

      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Ejecutivo & KPIs de Cobros */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.12)',
                border: '1px solid rgba(229, 181, 79, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-gold)',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h2 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-high, #ffffff)' }}>
                Historial de Cobros &amp; Reembolsos
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Auditoría en tiempo real de transacciones procesadas, conciliación con reservas y gestión de devoluciones.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'var(--bg-elevated, rgba(255, 255, 255, 0.05))',
                color: 'var(--text-muted)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {stats.totalCount} {stats.totalCount === 1 ? 'registro' : 'registros'}
            </span>

            <button
              type="button"
              onClick={loadTransactions}
              disabled={loadingTx}
              className="btn-secondary"
              style={{
                padding: '7px 14px',
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} style={{ animation: loadingTx ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loadingTx ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen Financiero */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          {/* KPI 1: Cobrado Exitoso */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--state-success-subtle, rgba(34, 197, 94, 0.05))',
              border: '1px solid var(--state-success-border, rgba(34, 197, 94, 0.2))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--state-success, #4ade80)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Cobrado en Pasarela
              </span>
              <ArrowDownLeft size={16} color="var(--state-success, #4ade80)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--state-success, #34d399)' }}>
              {formatUsd(stats.totalCollected)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stats.paidCount} transacciones liquidadas
            </div>
          </div>

          {/* KPI 2: Reembolsos Emitidos */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--violet-subtle, rgba(168, 85, 247, 0.05))',
              border: '1px solid var(--border-focus, rgba(168, 85, 247, 0.2))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--violet, #c084fc)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Reembolsos Devueltos
              </span>
              <ArrowUpRight size={16} color="var(--violet, #c084fc)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--violet, #c084fc)' }}>
              {formatUsd(stats.totalRefunded)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Devoluciones procesadas
            </div>
          </div>

          {/* KPI 3: Reembolsos Pendientes/Requeridos */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: stats.refundRequiredCount > 0 ? 'var(--state-danger-subtle, rgba(239, 68, 68, 0.08))' : 'var(--bg-elevated, rgba(255, 255, 255, 0.02))',
              border: stats.refundRequiredCount > 0 ? '1px solid var(--state-danger-border, rgba(239, 68, 68, 0.35))' : '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: stats.refundRequiredCount > 0 ? 'var(--state-danger, #f87171)' : 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Reembolsos Pendientes
              </span>
              <ShieldAlert size={16} color={stats.refundRequiredCount > 0 ? 'var(--state-danger, #f87171)' : 'var(--text-muted)'} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: stats.refundRequiredCount > 0 ? 'var(--state-danger, #f87171)' : 'var(--text-high, #ffffff)' }}>
              {stats.refundRequiredCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stats.refundRequiredCount > 0 ? 'Requiere atención inmediata' : 'Todo conciliado al día'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Feedback Banners (Éxito o Error) */}
      {refundSuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'var(--state-success-subtle, rgba(34, 197, 94, 0.12))',
            border: '1px solid var(--state-success-border, rgba(34, 197, 94, 0.35))',
            color: 'var(--state-success, #4ade80)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{refundSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefundSuccess(null)}
            style={{ background: 'none', border: 'none', color: 'var(--state-success, #4ade80)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {(txError || refundError) && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'var(--state-danger-subtle, rgba(239, 68, 68, 0.12))',
            border: '1px solid var(--state-danger-border, rgba(239, 68, 68, 0.35))',
            color: 'var(--state-danger-text, var(--state-danger, #f87171))',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{txError || refundError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTxError(null);
              setRefundError(null);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--state-danger, #f87171)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Panel Principal: Filtros y Tabla de Transacciones */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Selector de Estado */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(
              [
                { key: 'ALL', label: 'Todas' },
                { key: 'PAID', label: 'Pagadas' },
                { key: 'REFUNDED', label: 'Reembolsadas' },
                { key: 'REFUND_REQUIRED', label: 'Reembolso Req.' },
                { key: 'FAILED', label: 'Fallidas' },
              ] as const
            ).map((filter) => {
              const active = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: active ? 700 : 500,
                    background: active ? 'var(--accent-subtle, rgba(229, 181, 79, 0.16))' : 'var(--bg-elevated, rgba(255, 255, 255, 0.04))',
                    color: active ? 'var(--brand-gold)' : 'var(--text-muted)',
                    border: active ? '1px solid var(--border-focus, rgba(229, 181, 79, 0.4))' : '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Input de Búsqueda */}
          <div
            style={{
              position: 'relative',
              minWidth: '220px',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Buscar por ID, Hold o Proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                borderRadius: '6px',
                background: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-main, #ffffff)',
                fontSize: '0.76rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tabla o Estados Vacíos */}
        {loadingTx && transactions.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-gold)', marginBottom: '10px' }} />
            <p style={{ fontSize: '0.84rem', margin: 0 }}>Consultando transacciones en Cloud Firestore...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div
            style={{
              padding: '44px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              background: 'var(--bg-elevated, rgba(255, 255, 255, 0.02))',
              border: '1px dashed var(--border, rgba(229, 181, 79, 0.2))',
            }}
          >
            <History size={38} color="rgba(229, 181, 79, 0.35)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '0.94rem', color: 'var(--text-high, #ffffff)', margin: '0 0 6px 0', fontWeight: 700 }}>
              {transactions.length === 0
                ? 'No hay transacciones registradas'
                : 'No se encontraron resultados con los filtros actuales'}
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.45' }}>
              {transactions.length === 0
                ? 'Las confirmaciones o intentos de pago procesados por pasarelas (Kushki, PayPhone, DeUna) aparecerán aquí automáticamente para conciliación y reembolsos directos.'
                : 'Intenta limpiar el término de búsqueda o selecciona "Todas" para ver la totalidad del historial.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border, rgba(229, 181, 79, 0.2))',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '10px 8px' }}>FECHA (ECUADOR)</th>
                  <th style={{ padding: '10px 8px' }}>HOLD / REF</th>
                  <th style={{ padding: '10px 8px' }}>MONTO</th>
                  <th style={{ padding: '10px 8px' }}>PROVEEDOR</th>
                  <th style={{ padding: '10px 8px' }}>ESTADO</th>
                  <th style={{ padding: '10px 8px' }}>HOLD ASOCIADO</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const shortHold = tx.holdId ? (tx.holdId.length > 14 ? `${tx.holdId.slice(0, 10)}...` : tx.holdId) : '—';
                  const isPaid = tx.status === 'PAID';
                  const isRefundRequired = tx.status === 'REFUND_REQUIRED';
                  const isRefunded = tx.status === 'REFUNDED';
                  const canBeRefunded = canRefund && (isPaid || isRefundRequired);

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.05))',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-subtle, rgba(229, 181, 79, 0.04))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Fecha */}
                      <td style={{ padding: '12px 8px', color: 'var(--text-main, #e2e8f0)', whiteSpace: 'nowrap' }}>
                        {formatTxDate(tx.createdAt || tx.updatedAt)}
                      </td>

                      {/* Hold / Ref */}
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          className="font-mono"
                          title={tx.holdId || tx.id}
                          style={{
                            fontSize: '0.74rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-elevated, rgba(255, 255, 255, 0.05))',
                            color: 'var(--brand-gold)',
                          }}
                        >
                          {shortHold}
                        </span>
                      </td>

                      {/* Monto */}
                      <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--state-success, #34d399)' }}>
                        {formatUsd(tx.amount || 0)}
                      </td>

                      {/* Proveedor */}
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                        {tx.provider || 'kushki'}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            background:
                              isPaid
                                ? 'rgba(34, 197, 94, 0.15)'
                                : isRefunded
                                ? 'rgba(168, 85, 247, 0.15)'
                                : isRefundRequired
                                ? 'rgba(239, 68, 68, 0.2)'
                                : tx.status === 'FAILED'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(234, 179, 8, 0.15)',
                            color:
                              isPaid
                                ? 'var(--state-success, #4ade80)'
                                : isRefunded
                                ? 'var(--violet, #c084fc)'
                                : isRefundRequired
                                ? 'var(--state-danger, #f87171)'
                                : tx.status === 'FAILED'
                                ? 'var(--state-danger, #fca5a5)'
                                : 'var(--state-hold, #facc15)',
                            border: `1px solid ${
                              isPaid
                                ? 'rgba(34, 197, 94, 0.3)'
                                : isRefunded
                                ? 'rgba(168, 85, 247, 0.3)'
                                : isRefundRequired
                                ? 'rgba(239, 68, 68, 0.4)'
                                : tx.status === 'FAILED'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(234, 179, 8, 0.3)'
                            }`,
                          }}
                        >
                          {isPaid
                            ? 'PAGADO'
                            : isRefunded
                            ? 'REEMBOLSADO'
                            : isRefundRequired
                            ? 'REEMBOLSO REQ.'
                            : tx.status}
                        </span>
                      </td>

                      {/* Hold Asociado */}
                      <td style={{ padding: '12px 8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {tx.holdState ? (
                          <span style={{ color: tx.holdState === 'CONFIRMED' ? 'var(--state-success, #4ade80)' : 'var(--state-hold, #f59e0b)' }}>
                            {tx.holdState}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {canBeRefunded && (
                          <button
                            type="button"
                            onClick={() => setRefundConfirmTx(tx)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: 'var(--state-danger, #f87171)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                          >
                            <RotateCcw size={11} />
                            <span>Reembolsar</span>
                          </button>
                        )}

                        {isRefunded && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--violet, #c084fc)', fontStyle: 'italic' }}>
                            {tx.refundId ? `#${tx.refundId.slice(0, 10)}` : 'Devuelto'}
                          </span>
                        )}

                        {!canBeRefunded && !isRefunded && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Diálogo de Confirmación de Reembolso */}
      {refundConfirmTx && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!refundingTxId) {
              setRefundConfirmTx(null);
              setRefundReason('');
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'var(--bg-surface, #0d0f17)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--state-danger, #f87171)',
                }}
              >
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 className="font-brand" style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-high, #ffffff)' }}>
                  Confirmar Reembolso Irreversible
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Operación definitiva mediante la API de {refundConfirmTx.provider || 'Pasarela'}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--state-danger, #fca5a5)',
                lineHeight: '1.45',
                marginBottom: '16px',
              }}
            >
              <strong>ADVERTENCIA:</strong> Esta acción devolverá los fondos directamente a la tarjeta o cuenta del cliente a través del procesador de pagos. <strong>No puede cancelarse ni revertirse.</strong>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monto a devolver:</span>
                <span style={{ color: 'var(--state-success, #34d399)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {formatUsd(refundConfirmTx.amount || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID Transacción:</span>
                <span className="font-mono" style={{ color: 'var(--text-high, #ffffff)', fontSize: '0.74rem' }}>
                  {refundConfirmTx.id}
                </span>
              </div>
              {refundConfirmTx.holdId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hold Asociado:</span>
                  <span className="font-mono" style={{ color: 'var(--brand-gold)', fontSize: '0.74rem' }}>
                    {refundConfirmTx.holdId}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Motivo del reembolso (opcional, para bitácora fiscal):
              </label>
              <input
                type="text"
                placeholder="ej: Solicitud de cliente / pago tardío mesa liberada"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setRefundConfirmTx(null);
                  setRefundReason('');
                }}
                disabled={Boolean(refundingTxId)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.78rem' }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={Boolean(refundingTxId)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, var(--state-danger, #ef4444), var(--state-danger, #dc2626))',
                  color: 'var(--text-high, #ffffff)',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: refundingTxId ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {refundingTxId ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
                <span>{refundingTxId ? 'Emitiendo Reembolso...' : 'Confirmar Reembolso'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTransactionsManager;

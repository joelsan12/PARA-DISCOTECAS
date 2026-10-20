import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Users,
  Copy,
  Check,
  Download,
  Clock,
  Filter
} from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import type { Club } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { formatUsd } from '../../../lib/formatUsd';
import { formatEcuadorPhone, isValidEcuadorMobile } from '../../../lib/formatEcuador';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';

interface DoorAccessLogViewProps {
  activeClub: Club;
  session?: AdminStaffSession;
}

const formatEntryTime = (value?: string) => {
  if (!value) return 'Hora no registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const match = value.match(/(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AP])\s*M)?/i);
    if (!match) return value;
    return value;
  }
  return date.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Guayaquil',
  });
};

export const DoorAccessLogView: React.FC<DoorAccessLogViewProps> = ({ activeClub }) => {
  const store = useClubStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'CONFIRMED'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Reservas del club activo
  const clubReservations = useMemo(() => {
    return store.reservations.filter(r => r.club_id === activeClub.id);
  }, [store.reservations, activeClub.id]);

  // Lista de ingresados hoy
  const checkedInList = useMemo(() => {
    return clubReservations.filter(r => r.status === 'CHECKED_IN');
  }, [clubReservations]);

  // Total de personas ingresadas hoy
  const totalGuestsEntered = useMemo(() => {
    return checkedInList.reduce((acc, r) => acc + (r.guest_count || 1), 0);
  }, [checkedInList]);

  // Pendientes de ingreso
  const pendingArrivals = useMemo(() => {
    return clubReservations.filter(r => r.status === 'CONFIRMED');
  }, [clubReservations]);

  // Último ingreso
  const lastEntry = useMemo(() => {
    if (checkedInList.length === 0) return null;
    return checkedInList[checkedInList.length - 1];
  }, [checkedInList]);

  // Filtrado de reservas
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return clubReservations.filter(r => {
      // Filtro de estado
      if (statusFilter === 'CHECKED_IN' && r.status !== 'CHECKED_IN') return false;
      if (statusFilter === 'CONFIRMED' && r.status !== 'CONFIRMED') return false;

      // Filtro de búsqueda
      if (!query) return true;
      const matchName = (r.customer_name || '').toLowerCase().includes(query);
      const matchCode = (r.code || '').toLowerCase().includes(query);
      const matchTable = (r.table_code || '').toLowerCase().includes(query);
      const matchPhone = (r.customer_phone || '').includes(query);
      return matchName || matchCode || matchTable || matchPhone;
    });
  }, [clubReservations, statusFilter, searchQuery]);

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Código', 'Cliente', 'Teléfono', 'Mesa', 'Zona', 'Invitados', 'Estado', 'Hora de Ingreso', 'Monto Pagado'];
    const rows = filteredList.map(r => [
      `"${r.code}"`,
      `"${r.customer_name}"`,
      `"${r.customer_phone || ''}"`,
      `"${r.table_code}"`,
      `"${esTableZone(r.zone || '')}"`,
      r.guest_count || 1,
      `"${esTableStatus(r.status)}"`,
      `"${r.checked_in_at || ''}"`,
      r.deposit_amount || r.min_spend || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_puerta_${activeClub.slug || 'club'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ─── ENCABEZADO OFICIAL DE LA BITÁCORA ─────────────────────────── */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '24px 28px',
          border: '1px solid var(--border-focus, rgba(229, 181, 79, 0.28))',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.22) 0%, rgba(229, 181, 79, 0.05) 100%)',
            border: '1.5px solid var(--brand-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(229, 181, 79, 0.25)',
            flexShrink: 0
          }}>
            <UserCheck size={26} color="var(--brand-gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--state-success, #10b981)', boxShadow: '0 0 10px var(--state-success, #10b981)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--state-success, #34d399)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Control de Accesos en Vivo · Turno Nocturno
              </span>
            </div>
            <h1 className="font-brand" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0, letterSpacing: '0.02em' }}>
              Bitácora de Ingresos en Puerta
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
              Registro inmutable de admisiones, check-ins validados y aforo en tiempo real para {activeClub.name}.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Exportar Bitácora CSV</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE MÉTRICAS OPERATIVAS (KPIS) ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Total Personas Ingresadas */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personas Ingresadas
            </span>
            <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--state-success, #059669)', fontSize: '0.68rem', fontWeight: 800 }}>
              AFORO REAL
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--state-success, #059669)', fontFamily: 'var(--font-mono)', marginTop: '8px', lineHeight: 1 }}>
            {totalGuestsEntered}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {checkedInList.length} grupos / reservas validadas
          </div>
        </div>

        {/* Mesas / Grupos Recibidos */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(229, 181, 79, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Grupos en Sala
            </span>
            <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(229, 181, 79, 0.15)', color: 'var(--brand-gold)', fontSize: '0.68rem', fontWeight: 800 }}>
              CHECKED-IN
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--brand-gold)', fontFamily: 'var(--font-mono)', marginTop: '8px', lineHeight: 1 }}>
            {checkedInList.length} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {clubReservations.length}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {clubReservations.length > 0
              ? `${Math.round((checkedInList.length / clubReservations.length) * 100)}% de reservas confirmadas arribaron`
              : 'Sin reservas en el turno'}
          </div>
        </div>

        {/* Pendientes de Arribo */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pendientes en Puerta
            </span>
            <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-elevated, rgba(255, 255, 255, 0.08))', color: 'var(--text-muted, #94a3b8)', fontSize: '0.68rem', fontWeight: 800 }}>
              POR LLEGAR
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', fontFamily: 'var(--font-mono)', marginTop: '8px', lineHeight: 1 }}>
            {pendingArrivals.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Mesas reservadas con hold confirmado
          </div>
        </div>

        {/* Último Ingreso */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(229, 181, 79, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Último Check-in
            </span>
            <Clock size={16} color="var(--brand-gold)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', marginTop: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lastEntry ? lastEntry.customer_name : 'Sin registros aún'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--brand-gold)', marginTop: '6px', fontWeight: 600 }}>
            {lastEntry ? `Mesa ${lastEntry.table_code} · ${formatEntryTime(lastEntry.checked_in_at)}` : 'A la espera del primer ingreso'}
          </div>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        borderRadius: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Input de búsqueda */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, mesa (#VIP-01) o código…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              background: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
              color: 'var(--text-high, #ffffff)',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filtros de estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, marginRight: '4px' }}>
            <Filter size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            FILTRAR:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Todos ({clubReservations.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CHECKED_IN')}
            className={statusFilter === 'CHECKED_IN' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Ingresados ({checkedInList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={statusFilter === 'CONFIRMED' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Pendientes ({pendingArrivals.length})
          </button>
        </div>
      </div>

      {/* ─── TABLA DE BITÁCORA VIP ─────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '0',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-light, rgba(255, 255, 255, 0.09))'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))', borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Cliente / Titular VIP
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Mesa &amp; Zona
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Pase Digital
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Invitados
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Hora Check-in
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Estado
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Anticipo / Consumo
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((res) => {
                const isChecked = res.status === 'CHECKED_IN';
                return (
                  <tr
                    key={res.id}
                    style={{
                      borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.05))',
                      background: isChecked ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Cliente */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.05))',
                          border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-light, rgba(255, 255, 255, 0.1))'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isChecked ? 'var(--state-success, #059669)' : 'var(--text-high, #ffffff)',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          flexShrink: 0
                        }}>
                          {res.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-high, #ffffff)', fontSize: '0.88rem' }}>
                            {res.customer_name}
                          </div>
                          {res.customer_phone && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {isValidEcuadorMobile(res.customer_phone) ? formatEcuadorPhone(res.customer_phone) : res.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mesa & Zona */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--brand-gold)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
                        Mesa {res.table_code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {esTableZone(res.zone || '')}
                      </div>
                    </td>

                    {/* Código con Copiar */}
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(res.code)}
                        title="Copiar código de pase"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-elevated, rgba(255, 255, 255, 0.04))',
                          border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          color: 'var(--text-high, #ffffff)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span>#{res.code}</span>
                        {copiedCode === res.code ? <Check size={12} color="var(--state-success, #059669)" /> : <Copy size={12} color="var(--text-dim)" />}
                      </button>
                    </td>

                    {/* Invitados */}
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-elevated, rgba(255, 255, 255, 0.05))',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--text-high, #ffffff)'
                      }}>
                        <Users size={12} color="var(--brand-gold)" />
                        {res.guest_count || 1} pers.
                      </span>
                    </td>

                    {/* Hora */}
                    <td style={{ padding: '14px 18px' }}>
                      {isChecked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--state-success, #059669)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--state-success, #059669)', fontWeight: 700 }}>
                            {formatEntryTime(res.checked_in_at)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Pendiente de llegada
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '14px 18px' }}>
                      {isChecked ? (
                        <span className="badge badge-checkedin" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                          {esTableStatus(res.status)}
                        </span>
                      ) : (
                        <span className="badge badge-held" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                          {esTableStatus(res.status)}
                        </span>
                      )}
                    </td>

                    {/* Monto */}
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-high, #ffffff)' }}>
                        {formatUsd(res.deposit_amount || res.min_spend || 0)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={36} color="var(--text-dim)" />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                        No se encontraron registros de ingreso
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '380px' }}>
                        {searchQuery
                          ? 'No hay check-ins que coincidan con los criterios de búsqueda aplicados.'
                          : 'Aún no se han registrado ingresos en puerta para esta noche.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DoorAccessLogView;

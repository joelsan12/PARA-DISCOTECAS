import { useState } from 'react';
import {
  LogIn,
  Search,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone
} from 'lucide-react';
import { formatEcuadorPhone } from '../../lib/formatEcuador';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan, esRole } from '../../lib/esLabels';
import type { Club, SubscriptionPlan, ClubTable, SubscriptionPlanId } from '../../types';

interface Props {
  clubs: Club[];
  plans: SubscriptionPlan[];
  tables: ClubTable[];
  onImpersonate: (clubId: string) => void;
  onEditClub: (club: Club) => void;
  onToggleStatus: (clubId: string) => void;
  onUpdatePlan: (clubId: string, newPlanId: SubscriptionPlanId) => void;
}

export const TenantClubsTable = ({
  clubs,
  plans,
  tables,
  onImpersonate,
  onEditClub,
  onToggleStatus,
  onUpdatePlan,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const filteredClubs = clubs.filter(club => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && club.status === 'active') ||
      (filterStatus === 'suspended' && club.status !== 'active');

    const matchesPlan = filterPlan === 'all' || club.plan_id === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Table Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div>
          <h3 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Directorio de Discotecas y Negocios ({clubs.length})
          </h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: '3px 0 0' }}>
            Aprovisionamiento, asignación de planes, cambio de estado y acceso administrativo
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, ciudad o ID..."
              style={{
                padding: '7px 12px 7px 30px',
                borderRadius: '6px',
                background: 'rgba(8, 8, 12, 0.85)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: '#fff',
                fontSize: '0.78rem',
                minWidth: '220px',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'suspended')}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(8, 8, 12, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Operativos</option>
            <option value="suspended">Solo Suspendidos</option>
          </select>

          {/* Filter Plan */}
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(8, 8, 12, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">Todos los planes</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{esPlan(p.id)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(229, 181, 79, 0.15)', textAlign: 'left', color: 'var(--brand-gold)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
              <th style={{ padding: '10px 10px' }}>ESTABLECIMIENTO</th>
              <th style={{ padding: '10px 10px' }}>UBICACIÓN</th>
              <th style={{ padding: '10px 10px' }}>PLAN ASIGNADO (MODIFICABLE)</th>
              <th style={{ padding: '10px 10px' }}>ESTADO</th>
              <th style={{ padding: '10px 10px' }}>MESAS</th>
              <th style={{ padding: '10px 10px' }}>WHATSAPP</th>
              <th style={{ padding: '10px 10px', textAlign: 'right' }}>ACCIONES DE DESARROLLADOR</th>
            </tr>
          </thead>
          <tbody>
            {filteredClubs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No se encontraron discotecas que coincidan con la búsqueda o filtro.
                </td>
              </tr>
            ) : (
              filteredClubs.map(club => {
                const tableCount = tables.filter(t => t.club_id === club.id).length;
                const isOperativo = club.status === 'active';

                return (
                  <tr
                    key={club.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229, 181, 79, 0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Club info */}
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(229, 181, 79, 0.12)',
                          border: '1px solid rgba(229, 181, 79, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--brand-gold)',
                          flexShrink: 0
                        }}>
                          <Building size={14} />
                        </div>
                        <div>
                          <div className="font-brand" style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>
                            {club.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            ID: {club.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ciudad */}
                    <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                      <div>{club.city}</div>
                      {club.address && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.address}
                        </div>
                      )}
                    </td>

                    {/* Plan Selector interactivo */}
                    <td style={{ padding: '14px 10px' }}>
                      <select
                        value={club.plan_id}
                        onChange={e => onUpdatePlan(club.id, e.target.value as SubscriptionPlanId)}
                        title="Cambiar plan del club inmediatamente"
                        style={{
                          padding: '5px 8px',
                          borderRadius: '4px',
                          background: 'rgba(229, 181, 79, 0.12)',
                          border: '1px solid rgba(229, 181, 79, 0.35)',
                          color: 'var(--brand-gold)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id} style={{ background: '#0e121a', color: '#fff' }}>
                            {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Estado toggle */}
                    <td style={{ padding: '14px 10px' }}>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(club.id)}
                        title={`Haz clic para ${isOperativo ? 'suspender' : 'reactivar'} este club`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isOperativo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${isOperativo ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                          color: isOperativo ? '#4ade80' : '#f87171',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isOperativo ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        <span>{isOperativo ? 'Operativo' : 'Suspendido'}</span>
                      </button>
                    </td>

                    {/* Mesas */}
                    <td style={{ padding: '14px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                      {tableCount} {tableCount === 1 ? 'mesa' : 'mesas'}
                    </td>

                    {/* WhatsApp */}
                    <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={11} color="var(--brand-gold)" />
                        <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                          {formatEcuadorPhone(club.whatsapp_number) || 'Sin registrar'}
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => onEditClub(club)}
                          title="Editar detalles del establecimiento"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '5px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(229, 181, 79, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.35)';
                            e.currentTarget.style.color = 'var(--brand-gold)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.color = '#cbd5e1';
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>

                        {/* Ingresar como Admin */}
                        <button
                          type="button"
                          onClick={() => onImpersonate(club.id)}
                          className="btn-primary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <LogIn size={12} />
                          <span>Ingresar como {esRole('CLUB_ADMIN')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

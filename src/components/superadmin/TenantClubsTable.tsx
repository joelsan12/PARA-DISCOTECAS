import { useState } from 'react';
import {
  LogIn,
  Search,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  LayoutGrid,
  List
} from 'lucide-react';
import { formatEcuadorPhone } from '../../lib/formatEcuador';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan } from '../../lib/esLabels';
import type { Club, SubscriptionPlan, ClubTable, SubscriptionPlanId } from '../../types';
import { ConfirmPlanChangeModal } from './ConfirmPlanChangeModal';

interface Props {
  clubs: Club[];
  plans: SubscriptionPlan[];
  tables: ClubTable[];
  onImpersonate: (clubId: string) => void;
  onEditClub: (club: Club) => void;
  onToggleStatus: (clubId: string) => void;
  onUpdatePlan: (clubId: string, newPlanId: SubscriptionPlanId) => void;
  onManageCustomFeatures?: (club: Club) => void;
}

export const TenantClubsTable = ({
  clubs,
  plans,
  tables,
  onImpersonate,
  onEditClub,
  onToggleStatus,
  onUpdatePlan,
  onManageCustomFeatures,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pendingPlanChange, setPendingPlanChange] = useState<{ club: Club; newPlanId: SubscriptionPlanId } | null>(null);

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
    <div className="dev-tenant-section">
      {/* Header & Controls Bar */}
      <div className="dev-tenant-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="font-brand dev-tenant-title">
              Directorio de Discotecas y Negocios
            </h3>
            <span className="dev-tenant-pill">
              {clubs.length} {clubs.length === 1 ? 'club' : 'clubes'}
            </span>
          </div>
          <p className="dev-tenant-sub">
            Aprovisionamiento multi-tenant, asignación de planes y acceso administrativo
          </p>
        </div>

        {/* Search, Filters & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar club, ciudad o ID..."
              className="dev-search-input"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'suspended')}
            className="dev-select-filter"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Operativos</option>
            <option value="suspended">Solo Suspendidos</option>
          </select>

          {/* Filter Plan */}
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="dev-select-filter"
          >
            <option value="all">Todos los planes</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{esPlan(p.id)}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="dev-view-switcher">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`dev-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Vista en Cuadrícula de Tarjetas"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`dev-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Vista en Lista de Tabla"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>
      {/* Content: Empty State, Grid View, or Table View */}
      {filteredClubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#71717a' }}>
          No se encontraron discotecas que coincidan con la búsqueda o filtro.
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA 1: CUADRÍCULA DE TARJETAS DE LUJO */
        <div className="dev-clubs-grid">
          {filteredClubs.map(club => {
            const tableCount = tables.filter(t => t.club_id === club.id).length;
            const isOperativo = club.status === 'active';

            return (
              <div key={club.id} className="dev-club-card">
                {/* Cabecera de la Tarjeta */}
                <div className="dev-club-card__header">
                  <div className="dev-club-card__brand">
                    <div className="dev-club-card__avatar">
                      <Building size={16} />
                    </div>
                    <div>
                      <h4 className="dev-club-card__title font-brand">{club.name}</h4>
                      <span className="dev-club-card__city">{club.city}{club.address ? ` · ${club.address}` : ''}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(club.id)}
                    className={`dev-club-card__status ${isOperativo ? 'active' : 'suspended'}`}
                    title={`Haz clic para ${isOperativo ? 'suspender' : 'reactivar'}`}
                  >
                    {isOperativo ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                    <span>{isOperativo ? 'Operativo' : 'Suspendido'}</span>
                  </button>
                </div>

                {/* Cuerpo: Métricas Clave y Plan */}
                <div className="dev-club-card__body">
                  <div className="dev-club-card__plan-row">
                    <span className="dev-club-card__plan-label">Plan Asignado</span>
                    <select
                      value={club.plan_id}
                      onChange={e => setPendingPlanChange({ club, newPlanId: e.target.value as SubscriptionPlanId })}
                      className="dev-club-card__plan-select"
                      title="Cambiar plan del club (requiere confirmación obligatoria)"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id} style={{ background: '#0e121a', color: '#fff' }}>
                          {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                        </option>
                      ))}
                    </select>
                  </div>

                  {club.custom_features && club.custom_features.length > 0 && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                        ✨ {club.custom_features.length} Beneficio(s) VIP Exclusivo(s)
                      </span>
                      {onManageCustomFeatures && (
                        <button
                          type="button"
                          onClick={() => onManageCustomFeatures(club)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#e5b54f',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  )}

                  <div className="dev-club-card__info-strip">
                    <div className="dev-club-card__info-item">
                      <span className="dev-club-card__info-val font-mono">{tableCount}</span>
                      <span className="dev-club-card__info-lbl">Mesas VIP</span>
                    </div>

                    <div className="dev-club-card__info-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={10} color="#94a3b8" />
                        <span className="dev-club-card__info-val font-mono" style={{ fontSize: '0.74rem' }}>
                          {formatEcuadorPhone(club.whatsapp_number) || 'Sin línea'}
                        </span>
                      </div>
                      <span className="dev-club-card__info-lbl">WhatsApp Concierge</span>
                    </div>
                  </div>
                </div>

                {/* Pie: Acciones */}
                <div className="dev-club-card__actions">
                  <button
                    type="button"
                    onClick={() => onEditClub(club)}
                    className="dev-club-card__btn-edit"
                  >
                    <Edit3 size={13} />
                    <span>Editar Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onImpersonate(club.id)}
                    className="dev-club-card__btn-manage"
                  >
                    <LogIn size={13} />
                    <span>Gestionar Club ↗</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: LISTA DE TABLA CLÁSICA */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
                color: '#94a3b8',
                fontSize: '0.7rem',
                letterSpacing: '0.06em',
                fontWeight: 600
              }}>
                <th style={{ padding: '10px 12px' }}>ESTABLECIMIENTO</th>
                <th style={{ padding: '10px 12px' }}>UBICACIÓN</th>
                <th style={{ padding: '10px 12px' }}>PLAN</th>
                <th style={{ padding: '10px 12px' }}>ESTADO</th>
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>MESAS</th>
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>WHATSAPP</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredClubs.map(club => {
                const tableCount = tables.filter(t => t.club_id === club.id).length;
                const isOperativo = club.status === 'active';

                return (
                  <tr
                    key={club.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f5d38a',
                          flexShrink: 0
                        }}>
                          <Building size={14} />
                        </div>
                        <div>
                          <div className="font-brand" style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                            {club.name}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                            ID: {club.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 12px', color: '#cbd5e1' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{club.city}</div>
                      {club.address && (
                        <div style={{ fontSize: '0.68rem', color: '#71717a', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.address}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <select
                        value={club.plan_id}
                        onChange={e => setPendingPlanChange({ club, newPlanId: e.target.value as SubscriptionPlanId })}
                        className="dev-club-card__plan-select"
                        title="Cambiar plan del club (requiere confirmación obligatoria)"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id} style={{ background: '#0e121a', color: '#fff' }}>
                            {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(club.id)}
                        className={`dev-club-card__status ${isOperativo ? 'active' : 'suspended'}`}
                      >
                        {isOperativo ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        <span>{isOperativo ? 'Operativo' : 'Suspendido'}</span>
                      </button>
                    </td>

                    <td style={{ padding: '12px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap' }}>
                      {tableCount} {tableCount === 1 ? 'mesa' : 'mesas'}
                    </td>

                    <td style={{ padding: '12px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={11} color="#94a3b8" />
                        <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                          {formatEcuadorPhone(club.whatsapp_number) || 'Sin registrar'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onEditClub(club)}
                          className="dev-club-card__btn-edit"
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onImpersonate(club.id)}
                          className="dev-club-card__btn-manage"
                        >
                          <LogIn size={12} />
                          <span>Gestionar ↗</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación obligatoria para cambios de plan */}
      <ConfirmPlanChangeModal
        isOpen={!!pendingPlanChange}
        club={pendingPlanChange?.club || null}
        newPlanId={pendingPlanChange?.newPlanId || null}
        plans={plans}
        onConfirm={(clubId, newPlanId) => {
          onUpdatePlan(clubId, newPlanId);
          setPendingPlanChange(null);
        }}
        onCancel={() => setPendingPlanChange(null)}
      />
    </div>
  );
};

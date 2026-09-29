import { LogIn } from 'lucide-react';
import { formatEcuadorPhone } from '../../lib/formatEcuador';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan, esRole } from '../../lib/esLabels';
import type { Club, SubscriptionPlan, ClubTable } from '../../types';

interface Props {
  clubs: Club[];
  plans: SubscriptionPlan[];
  tables: ClubTable[];
  onImpersonate: (clubId: string) => void;
}

export const TenantClubsTable = ({
  clubs,
  plans,
  tables,
  onImpersonate,
}: Props) => {
  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
        Directorio de discotecas clientes
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-dim)' }}>
              <th style={{ padding: '12px 10px' }}>DISCOTECA</th>
              <th style={{ padding: '12px 10px' }}>CIUDAD</th>
              <th style={{ padding: '12px 10px' }}>PLAN</th>
              <th style={{ padding: '12px 10px' }}>ESTADO</th>
              <th style={{ padding: '12px 10px' }}>MESAS</th>
              <th style={{ padding: '12px 10px' }}>WHATSAPP</th>
              <th style={{ padding: '12px 10px', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map(club => {
              const plan = plans.find(p => p.id === club.plan_id);
              const tableCount = tables.filter(t => t.club_id === club.id).length;

              return (
                <tr key={club.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 10px' }}>
                    <div className="font-brand" style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{club.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ID: {club.id}</div>
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                    {club.city}
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {plan ? `${esPlan(plan.id)} · ${formatUsd(plan.monthly_price)} / mes` : esPlan(club.plan_id)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <span className="badge badge-checkedin" style={{ fontSize: '0.7rem' }}>
                      {club.status === 'active' ? 'Operativo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                    {tableCount} {tableCount === 1 ? 'mesa' : 'mesas'}
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>
                    {formatEcuadorPhone(club.whatsapp_number) || 'Sin número registrado'}
                  </td>
                  <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => onImpersonate(club.id)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)' }}
                    >
                      <LogIn size={13} />
                      <span>Ingresar como {esRole('CLUB_ADMIN')}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

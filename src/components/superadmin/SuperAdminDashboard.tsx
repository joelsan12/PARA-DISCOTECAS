import { useState } from 'react';
import { useClubStore } from '../../store/clubStore';
import { esRole } from '../../lib/esLabels';
import { Plus, ShieldCheck } from 'lucide-react';
import { SaaSMetricsCards } from './SaaSMetricsCards';
import { TenantClubsTable } from './TenantClubsTable';
import { SubscriptionPlansList } from './SubscriptionPlansList';
import { CreateClubModal } from './CreateClubModal';

export const SuperAdminDashboard = () => {
  const store = useClubStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeClubs = store.clubs.filter(c => c.status === 'active').length;
  const totalClubs = store.clubs.length;

  const mrr = store.clubs.reduce((acc, club) => {
    if (club.status !== 'active') return acc;
    const plan = store.plans.find(p => p.id === club.plan_id);
    return acc + (plan?.monthly_price ?? 0);
  }, 0);

  const totalVolume = store.reservations.reduce((acc, r) => acc + r.deposit_amount, 0);

  const handleImpersonate = (clubId: string) => {
    store.setActiveClub(clubId);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 80px' }}>
      <div className="glass-card" style={{
        padding: '22px 26px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--accent)" />
            <h1 className="font-brand" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>
              Plataforma de gestión para discotecas · {esRole('SUPER_ADMIN')}
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Aprovisionamiento global de discotecas, planes de suscripción y volumen transaccional de anticipos
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px' }}>
          <Plus size={16} />
          <span>Registrar nueva discoteca</span>
        </button>
      </div>

      <SaaSMetricsCards
        mrr={mrr}
        activeClubs={activeClubs}
        totalClubs={totalClubs}
        totalVolume={totalVolume}
        reservationsCount={store.reservations.length}
      />

      <TenantClubsTable
        clubs={store.clubs}
        plans={store.plans}
        tables={store.tables}
        onImpersonate={handleImpersonate}
      />

      <SubscriptionPlansList plans={store.plans} />

      <CreateClubModal
        plans={store.plans}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async data => {
          await store.createClub(data);
        }}
      />
    </div>
  );
};

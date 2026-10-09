import { useState } from 'react';
import { useClubStore } from '../../store/clubStore';
import { esRole } from '../../lib/esLabels';
import {
  Plus,
  ShieldCheck,
  ShieldAlert,
  Building,
  Layers,
  History
} from 'lucide-react';
import { SaaSMetricsCards } from './SaaSMetricsCards';
import { TenantClubsTable } from './TenantClubsTable';
import { SubscriptionPlansList } from './SubscriptionPlansList';
import { CreateClubModal } from './CreateClubModal';
import { EditClubModal } from './EditClubModal';
import { EditPlanModal } from './EditPlanModal';
import { PlatformEmergencyModal } from './PlatformEmergencyModal';
import type { Club, SubscriptionPlan, SubscriptionPlanId } from '../../types';

export type SuperAdminTab = 'CLUBS' | 'PLANS' | 'AUDIT';

export interface SuperAdminDashboardProps {
  hideHeader?: boolean;
  hideSubtabs?: boolean;
  controlledTab?: SuperAdminTab;
  onTabChange?: (tab: SuperAdminTab) => void;
  hideMetrics?: boolean;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  openEmergencyModal?: boolean;
  onCloseEmergencyModal?: () => void;
}

export const SuperAdminDashboard = ({
  hideHeader = false,
  hideSubtabs = false,
  controlledTab,
  onTabChange,
  hideMetrics = false,
  openCreateModal,
  onCloseCreateModal,
  openEmergencyModal,
  onCloseEmergencyModal,
}: SuperAdminDashboardProps = {}) => {
  const store = useClubStore();
  const [internalTab, setInternalTab] = useState<SuperAdminTab>('CLUBS');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: SuperAdminTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Modals state
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // SaaS aggregated metrics
  const activeClubs = store.clubs.filter(c => c.status === 'active').length;
  const totalClubs = store.clubs.length;

  const mrr = store.clubs.reduce((acc, club) => {
    if (club.status !== 'active') return acc;
    const plan = store.plans.find(p => p.id === club.plan_id);
    return acc + (plan?.monthly_price ?? 0);
  }, 0);

  const totalVolume = store.reservations.reduce((acc, r) => acc + r.deposit_amount, 0);

  // Handlers
  const handleImpersonate = (clubId: string) => {
    store.setActiveClub(clubId);
  };

  const handleToggleClubStatus = (clubId: string) => {
    store.toggleClubStatus(clubId);
  };

  const handleUpdateClubPlan = (clubId: string, newPlanId: SubscriptionPlanId) => {
    store.updateClubPlan(clubId, newPlanId);
  };

  const handleSaveClubDetails = (clubId: string, updates: Partial<Club>) => {
    store.updateClubDetails(clubId, updates);
  };

  const handleSavePlan = (planData: SubscriptionPlan, isNew: boolean) => {
    if (isNew) {
      store.addPlan(planData);
    } else {
      store.updatePlan(planData.id, planData);
    }
  };

  const handleDeletePlan = (planId: string) => {
    store.deletePlan(planId);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Header Banner & Developer Console Bar */}
      {!hideHeader && (
        <div className="glass-card" style={{
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          background: 'linear-gradient(180deg, rgba(16, 17, 26, 0.95) 0%, rgba(10, 11, 17, 0.98) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(229, 181, 79, 0.08)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-gold)'
              }}>
                <ShieldCheck size={18} />
              </div>
              <h1 className="font-brand" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Consola de Plataforma &amp; SuperAdministrador · {esRole('SUPER_ADMIN')}
              </h1>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Aprovisionamiento global de discotecas, planes de suscripción, mando de seguridad y volumen transaccional
            </p>
          </div>

          {/* Global Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.24)',
                color: '#fda4af',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.45)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.24)';
                e.currentTarget.style.color = '#fda4af';
              }}
            >
              <ShieldAlert size={14} />
              <span>Mando de Seguridad (AGENTS §8)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateClubOpen(true)}
              style={{
                padding: '8px 15px',
                borderRadius: '6px',
                background: 'rgba(229, 181, 79, 0.12)',
                border: '1px solid rgba(229, 181, 79, 0.38)',
                color: '#f5d38a',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(229, 181, 79, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.6)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(229, 181, 79, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.38)';
                e.currentTarget.style.color = '#f5d38a';
              }}
            >
              <Plus size={15} />
              <span>Registrar nueva discoteca</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. SaaS Metrics Overview */}
      {!hideMetrics && (
        <SaaSMetricsCards
          mrr={mrr}
          activeClubs={activeClubs}
          totalClubs={totalClubs}
          totalVolume={totalVolume}
          reservationsCount={store.reservations.length}
        />
      )}

      {/* 3. Sub-navigation Tabs */}
      {!hideSubtabs && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '10px'
        }}>
        <button
          type="button"
          onClick={() => setActiveTab('CLUBS')}
          style={{
            padding: '7px 15px',
            borderRadius: '6px',
            background: activeTab === 'CLUBS' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'CLUBS' ? 'rgba(229, 181, 79, 0.35)' : 'transparent',
            color: activeTab === 'CLUBS' ? '#f5d38a' : '#71717a',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'CLUBS' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Building size={14} color={activeTab === 'CLUBS' ? '#e5b54f' : '#71717a'} />
          <span>Discotecas &amp; Clientes ({store.clubs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PLANS')}
          style={{
            padding: '7px 15px',
            borderRadius: '6px',
            background: activeTab === 'PLANS' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'PLANS' ? 'rgba(229, 181, 79, 0.35)' : 'transparent',
            color: activeTab === 'PLANS' ? '#f5d38a' : '#71717a',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'PLANS' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={14} color={activeTab === 'PLANS' ? '#e5b54f' : '#71717a'} />
          <span>Modelos de Suscripción ({store.plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          style={{
            padding: '7px 15px',
            borderRadius: '6px',
            background: activeTab === 'AUDIT' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'AUDIT' ? 'rgba(229, 181, 79, 0.35)' : 'transparent',
            color: activeTab === 'AUDIT' ? '#f5d38a' : '#71717a',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'AUDIT' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={14} color={activeTab === 'AUDIT' ? '#e5b54f' : '#71717a'} />
          <span>Bitácora de Auditoría Global ({store.auditLogs.length})</span>
        </button>
      </div>
      )}

      {/* 4. Tab Content */}
      {activeTab === 'CLUBS' && (
        <TenantClubsTable
          clubs={store.clubs}
          plans={store.plans}
          tables={store.tables}
          onImpersonate={handleImpersonate}
          onEditClub={club => setEditingClub(club)}
          onToggleStatus={handleToggleClubStatus}
          onUpdatePlan={handleUpdateClubPlan}
        />
      )}

      {activeTab === 'PLANS' && (
        <SubscriptionPlansList
          plans={store.plans}
          clubs={store.clubs}
          onEditPlan={plan => {
            setEditingPlan(plan);
            setIsPlanModalOpen(true);
          }}
          onCreatePlan={() => {
            setEditingPlan(null);
            setIsPlanModalOpen(true);
          }}
          onDeletePlan={handleDeletePlan}
        />
      )}

      {activeTab === 'AUDIT' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Registro de Auditoría Unificado de Plataforma
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
            Traza de eventos de tenancy, cambios de planes, reservas, inicios de sesión y seguridad (AGENTS §2)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {store.auditLogs.slice(0, 30).map(log => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(229, 181, 79, 0.15)',
                    color: 'var(--brand-gold)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {log.action}
                  </span>
                  <span style={{ color: '#fff' }}>{log.details}</span>
                  {log.club_id && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      [Club: {log.club_id}]
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  <span>Actor: <strong style={{ color: '#cbd5e1' }}>{log.actor}</strong> ({log.role})</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {/* Create Club Modal */}
      <CreateClubModal
        plans={store.plans}
        isOpen={openCreateModal !== undefined ? openCreateModal : isCreateClubOpen}
        onClose={() => {
          setIsCreateClubOpen(false);
          onCloseCreateModal?.();
        }}
        onCreate={async data => {
          await store.createClub(data);
        }}
      />

      {/* Edit Club Modal */}
      {editingClub && (
        <EditClubModal
          key={editingClub.id}
          club={editingClub}
          plans={store.plans}
          isOpen={true}
          onClose={() => setEditingClub(null)}
          onSave={handleSaveClubDetails}
          onUpdatePlan={handleUpdateClubPlan}
        />
      )}

      {/* Edit/Create Plan Modal */}
      {isPlanModalOpen && (
        <EditPlanModal
          key={editingPlan?.id || 'new_plan'}
          plan={editingPlan}
          isOpen={true}
          onClose={() => {
            setIsPlanModalOpen(false);
            setEditingPlan(null);
          }}
          onSave={handleSavePlan}
        />
      )}

      {/* Platform Emergency / Revocation Modal */}
      <PlatformEmergencyModal
        isOpen={openEmergencyModal !== undefined ? openEmergencyModal : isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false);
          onCloseEmergencyModal?.();
        }}
        clubs={store.clubs}
        revocationVersion={store.platformRevocationVersion}
        onIncrementRevocation={(clubId?: string) => store.incrementRevocationVersion(clubId)}
        auditLogs={store.auditLogs}
      />
    </div>
  );
};

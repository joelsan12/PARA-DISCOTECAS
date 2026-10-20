import { useEffect, useState } from 'react';
import {
  Terminal,
  ExternalLink,
  ShieldAlert,
  Server,
  Database,
  Globe,
  Lock,
  Building,
  Layers,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  Plus,
  Sparkles
} from 'lucide-react';
import { SuperAdminDashboard } from '../superadmin/SuperAdminDashboard';
import { DevProposalsManager } from '../superadmin/DevProposalsManager';
import { ConfirmPlanChangeModal } from '../superadmin/ConfirmPlanChangeModal';
import { ImplementCustomFeatureModal } from '../superadmin/ImplementCustomFeatureModal';
import { useClubStore } from '../../store/clubStore';
import type { Club, ClubProposal, SubscriptionPlanId } from '../../types';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { NightflowInterruptionScreen } from '../common/NightflowInterruptionScreen';
import {
  subscribeToAdminAuth,
  signInAdminWithPassword,
  signOutAdmin,
  type AdminAuthState
} from '../../lib/adminAuth';
import '../../styles/adminLayout.css';
import '../../styles/components.css';
import '../../styles/devPortal.css';

type MainDevTab = 'CLUBS' | 'PROPOSALS' | 'PLANS' | 'LINKS' | 'SECURITY';

export function DevPortalApp() {
  const store = useClubStore();
  const [authState, setAuthState] = useState<AdminAuthState>({ status: 'loading' });
  const [activeTab, setActiveTab] = useState<MainDevTab>('CLUBS');
  const [emailInput, setEmailInput] = useState('admin@nightflow.vip');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modales de planes y propuestas
  const [confirmPlanModal, setConfirmPlanModal] = useState<{ club: Club; newPlanId: SubscriptionPlanId } | null>(null);
  const [implementModal, setImplementModal] = useState<{ club: Club; proposal: ClubProposal | null } | null>(null);

  // Modales compartidos con SuperAdminDashboard
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isPreviewInterruptionOpen, setIsPreviewInterruptionOpen] = useState(false);

  const pendingProposalsCount = store.proposals.filter(p => p.status === 'PENDING').length;

  useEffect(() => {
    const unsubscribe = subscribeToAdminAuth(undefined, state => {
      setAuthState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      await signInAdminWithPassword(emailInput, passwordInput);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al autenticar credenciales de desarrollador.';
      setLoginError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Estado de Carga Minimalista
  if (authState.status === 'loading') {
    return (
      <div className="dev-boot">
        <div style={{ position: 'relative' }}>
          <NightflowLogoMark size={44} theme="gold" />
          <div className="dev-boot__ring" />
        </div>
        <p className="dev-boot__title">NIGHTFLOW DEV</p>
        <span className="dev-boot__log">Iniciando consola...</span>
      </div>
    );
  }

  // 2. Pantalla de Acceso Monocromática y Simple
  if (authState.status === 'unauthenticated' || authState.status === 'unauthorized') {
    return (
      <div className="dev-gate">
        <div className="dev-gate__inner">
          <div className="dev-card">
            {/* Header del Login */}
            <div className="dev-head">
              <div className="dev-head__mark">
                <Terminal size={24} color="var(--text-main, #e4e4e7)" strokeWidth={1.8} />
              </div>
              <h1 className="dev-title">Consola de Desarrollador</h1>
              <p className="dev-sub">Gestión de Plataforma &amp; Multi-Tenant</p>
            </div>

            {/* Accesos rápidos de 1 clic (Neutros) */}
            <div className="dev-quickfill">
              <button
                type="button"
                className="dev-chip"
                onClick={() => {
                  setEmailInput('superadmin@nightflow.vip');
                  setPasswordInput('Nightflow2026!');
                }}
              >
                SuperAdmin
              </button>
              <button
                type="button"
                className="dev-chip"
                onClick={() => {
                  setEmailInput('admin@nightflow.vip');
                  setPasswordInput('Nightflow2026!');
                }}
              >
                Desarrollador
              </button>
            </div>

            {loginError && (
              <div className="dev-alert dev-alert--error">
                <ShieldAlert size={15} />
                <span>{loginError}</span>
              </div>
            )}

            {authState.status === 'unauthorized' && (
              <div className="dev-alert dev-alert--warn">
                <Lock size={15} />
                <span>Esta cuenta no posee privilegios de Desarrollador.</span>
              </div>
            )}

            <form onSubmit={handleDevLogin} className="dev-form">
              <div>
                <label className="dev-label" htmlFor="dev-email">
                  Correo Electrónico
                </label>
                <input
                  id="dev-email"
                  type="email"
                  className="dev-input"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="admin@nightflow.vip"
                />
              </div>

              <div>
                <label className="dev-label" htmlFor="dev-password">
                  Contraseña
                </label>
                <input
                  id="dev-password"
                  type="password"
                  className="dev-input"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="dev-submit"
              >
                {isSubmitting ? 'Accediendo...' : 'Ingresar a la Consola'}
              </button>
            </form>

            {/* Enlaces secundarios a los otros 2 portales */}
            <div className="dev-foot">
              <span className="dev-foot__label">Otros portales</span>
              <div className="dev-foot__links">
                <a
                  href="https://nightflow-vip.web.app"
                  target="_blank"
                  rel="noreferrer"
                  className="dev-portal-link"
                >
                  <span>Portal Clientes</span>
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://nightflow-admin.web.app"
                  target="_blank"
                  rel="noreferrer"
                  className="dev-portal-link"
                >
                  <span>Portal Administración</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Consola Studio de Alta Gama (Sidebar + Main Stage)
  const user = authState.user;

  return (
    <div className="dev-studio-root">
      {/* 3.1 SIDEBAR / COMMAND RAIL LATERAL */}
      <aside className="dev-sidebar">
        {/* Identidad / Brand */}
        <div className="dev-sidebar__brand">
          <div className="dev-sidebar__logo">
            <NightflowLogoMark size={28} theme="gold" />
          </div>
          <div className="dev-sidebar__title-wrap">
            <span className="dev-sidebar__brand-name font-brand">NIGHTFLOW</span>
            <span className="dev-sidebar__badge">DEV STUDIO</span>
          </div>
        </div>

        {/* Grupo 1: Navegación de Plataforma */}
        <div className="dev-sidebar__nav-group">
          <span className="dev-sidebar__group-title">Plataforma</span>
          <nav className="dev-sidebar__nav">
            <button
              type="button"
              className={`dev-sidebar__item ${activeTab === 'CLUBS' ? 'active' : ''}`}
              onClick={() => setActiveTab('CLUBS')}
            >
              <div className="dev-sidebar__item-left">
                <Building size={16} />
                <span>Discotecas</span>
              </div>
              <span className="dev-sidebar__counter">{store.clubs.length}</span>
            </button>

            <button
              type="button"
              className={`dev-sidebar__item ${activeTab === 'PROPOSALS' ? 'active' : ''}`}
              onClick={() => setActiveTab('PROPOSALS')}
            >
              <div className="dev-sidebar__item-left">
                <Sparkles size={16} />
                <span>Propuestas &amp; Upgrades</span>
              </div>
              {pendingProposalsCount > 0 && (
                <span className="dev-sidebar__counter" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--state-hold, #fbbf24)' }}>
                  {pendingProposalsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`dev-sidebar__item ${activeTab === 'PLANS' ? 'active' : ''}`}
              onClick={() => setActiveTab('PLANS')}
            >
              <div className="dev-sidebar__item-left">
                <Layers size={16} />
                <span>Planes SaaS</span>
              </div>
            </button>

            <button
              type="button"
              className={`dev-sidebar__item ${activeTab === 'LINKS' ? 'active' : ''}`}
              onClick={() => setActiveTab('LINKS')}
            >
              <div className="dev-sidebar__item-left">
                <Globe size={16} />
                <span>Enlaces</span>
              </div>
            </button>

            <button
              type="button"
              className={`dev-sidebar__item ${activeTab === 'SECURITY' ? 'active' : ''}`}
              onClick={() => setActiveTab('SECURITY')}
            >
              <div className="dev-sidebar__item-left">
                <ShieldCheck size={16} />
                <span>Seguridad &amp; KMS</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Grupo 2: Enlaces a Portales en Producción */}
        <div className="dev-sidebar__nav-group">
          <span className="dev-sidebar__group-title">Portales en Vivo</span>
          <nav className="dev-sidebar__nav">
            <a
              href="https://nightflow-vip.web.app"
              target="_blank"
              rel="noreferrer"
              className="dev-sidebar__external-link"
            >
              <span>Portal Clientes VIP</span>
              <ExternalLink size={12} />
            </a>

            <a
              href="https://nightflow-admin.web.app"
              target="_blank"
              rel="noreferrer"
              className="dev-sidebar__external-link"
            >
              <span>Portal Administración</span>
              <ExternalLink size={12} />
            </a>
          </nav>
        </div>

        {/* Pie de Sidebar: Estado de Infraestructura & Perfil */}
        <div className="dev-sidebar__footer">
          <div className="dev-sidebar__system-status">
            <span className="dev-sidebar__beacon" />
            <span>Infraestructura Online</span>
          </div>

          <div className="dev-sidebar__user-card">
            <div className="dev-sidebar__user-avatar">
              <span>{(user.email || 'D').charAt(0).toUpperCase()}</span>
            </div>
            <div className="dev-sidebar__user-info">
              <span className="dev-sidebar__user-email">{user.email || 'admin@nightflow.vip'}</span>
              <span className="dev-sidebar__user-role">SuperAdmin</span>
            </div>
            <button
              type="button"
              onClick={() => signOutAdmin()}
              className="dev-sidebar__btn-logout"
              title="Cerrar Sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* 3.2 MAIN STAGE */}
      <div className="dev-main-wrap">
        {/* Top Header */}
        <header className="dev-topbar">
          <div className="dev-topbar__left">
            <span className="dev-topbar__breadcrumb">Nightflow</span>
            <span className="dev-topbar__sep">/</span>
            <span className="dev-topbar__current">
              {activeTab === 'CLUBS' && 'Discotecas & Tenancy Multi-Club'}
              {activeTab === 'PROPOSALS' && 'Propuestas de Clientes & Módulos Exclusivos'}
              {activeTab === 'PLANS' && 'Planes & Tarifas SaaS'}
              {activeTab === 'LINKS' && 'Ecosistema de Portales'}
              {activeTab === 'SECURITY' && 'Seguridad & Invariantes Criptográficas'}
            </span>
          </div>

          <div className="dev-topbar__actions">
            <button
              type="button"
              onClick={() => setIsPreviewInterruptionOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '8px',
                background: 'rgba(229, 181, 79, 0.08)',
                border: '1px solid rgba(229, 181, 79, 0.3)',
                color: 'var(--gold, #e5b54f)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Previsualizar pantallas de Nueva Implementación, Error o Mantenimiento"
            >
              <Sparkles size={13} />
              <span>Simular Pantalla de Interrupción</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="dev-btn-danger"
            >
              <ShieldAlert size={14} />
              <span>Mando de Emergencia</span>
            </button>

            {activeTab === 'CLUBS' && (
              <button
                type="button"
                onClick={() => setIsCreateClubOpen(true)}
                className="dev-btn-gold"
              >
                <Plus size={14} />
                <span>Nueva Discoteca</span>
              </button>
            )}
          </div>
        </header>

        {/* Contenido Dinámico del Workspace */}
        <main className="dev-workspace">
          {/* PESTAÑA 1: DISCOTECAS / TENANTS */}
          {activeTab === 'CLUBS' && (
            <SuperAdminDashboard
              hideHeader={true}
              hideSubtabs={true}
              controlledTab="CLUBS"
              openCreateModal={isCreateClubOpen}
              onCloseCreateModal={() => setIsCreateClubOpen(false)}
              openEmergencyModal={isEmergencyModalOpen}
              onCloseEmergencyModal={() => setIsEmergencyModalOpen(false)}
            />
          )}

          {/* PESTAÑA 2: PROPUESTAS DE CLIENTES & UPGRADES */}
          {activeTab === 'PROPOSALS' && (
            <DevProposalsManager
              proposals={store.proposals}
              clubs={store.clubs}
              plans={store.plans}
              onRequestPlanChange={(club, newPlanId) => {
                setConfirmPlanModal({ club, newPlanId });
              }}
              onOpenImplementModal={(club, proposal) => {
                setImplementModal({ club, proposal });
              }}
              onUpdateStatus={(propId, status, devResponse) => {
                store.updateProposalStatus(propId, status, devResponse);
              }}
            />
          )}

          {/* PESTAÑA 3: PLANES SAAS */}
          {activeTab === 'PLANS' && (
            <SuperAdminDashboard
              hideHeader={true}
              hideSubtabs={true}
              hideMetrics={false}
              controlledTab="PLANS"
            />
          )}

          {/* PESTAÑA 3: ECOSISTEMA DE ENLACES */}
          {activeTab === 'LINKS' && (
            <div>
              {/* Grid de las 3 URLs */}
              <div className="dev-links-grid">
                {/* Tarjeta 1: Clientes */}
                <div className="dev-link-card">
                  <div className="dev-link-card__top">
                    <div className="dev-link-card__icon">
                      <Globe size={18} />
                    </div>
                    <span className="dev-link-card__badge">PRODUCCIÓN</span>
                  </div>

                  <h3 className="dev-link-card__title">Portal de Clientes</h3>
                  <p className="dev-link-card__desc">
                    Directorio público, catálogo de mesas VIP y pases digitales Black Card.
                  </p>

                  <div className="dev-link-card__url-box">
                    <code>https://nightflow-vip.web.app</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://nightflow-vip.web.app', 'client')}
                      className="dev-link-card__copy-btn"
                      title="Copiar enlace"
                    >
                      {copiedKey === 'client' ? <Check size={14} color="var(--gold, #e5b54f)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <a
                    href="https://nightflow-vip.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-link-card__action"
                  >
                    <span>Abrir Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Tarjeta 2: Administración */}
                <div className="dev-link-card">
                  <div className="dev-link-card__top">
                    <div className="dev-link-card__icon">
                      <Server size={18} />
                    </div>
                    <span className="dev-link-card__badge">PRODUCCIÓN</span>
                  </div>

                  <h3 className="dev-link-card__title">Portal de Administración</h3>
                  <p className="dev-link-card__desc">
                    Gestión del plano de mesas, pasarelas de pago y scanner PWA de puerta.
                  </p>

                  <div className="dev-link-card__url-box">
                    <code>https://nightflow-admin.web.app</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://nightflow-admin.web.app', 'admin')}
                      className="dev-link-card__copy-btn"
                      title="Copiar enlace"
                    >
                      {copiedKey === 'admin' ? <Check size={14} color="var(--gold, #e5b54f)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <a
                    href="https://nightflow-admin.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-link-card__action"
                  >
                    <span>Abrir Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Tarjeta 3: Desarrollador */}
                <div className="dev-link-card dev-link-card--active">
                  <div className="dev-link-card__top">
                    <div className="dev-link-card__icon">
                      <Terminal size={18} />
                    </div>
                    <span className="dev-link-card__badge dev-link-card__badge--active">ESTE PANEL</span>
                  </div>

                  <h3 className="dev-link-card__title">Portal del Desarrollador</h3>
                  <p className="dev-link-card__desc">
                    Consola de tenants, configuración de planes, seguridad e infraestructura.
                  </p>

                  <div className="dev-link-card__url-box">
                    <code>https://nightflow-dev.web.app</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://nightflow-dev.web.app', 'dev')}
                      className="dev-link-card__copy-btn"
                      title="Copiar enlace"
                    >
                      {copiedKey === 'dev' ? <Check size={14} color="var(--gold, #e5b54f)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <a
                    href="https://nightflow-dev.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-link-card__action"
                  >
                    <span>Abrir Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Accesos Directos a Firebase Console */}
              <div className="dev-cloud-box">
                <div className="dev-cloud-box__header">
                  <Database size={15} color="var(--gold, #e5b54f)" />
                  <span>Accesos directos a Google Cloud / Firebase Console</span>
                </div>

                <div className="dev-cloud-box__grid">
                  <a
                    href="https://console.firebase.google.com/project/nightflow-vip/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-cloud-link"
                  >
                    <span>Resumen del Proyecto</span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href="https://console.firebase.google.com/project/nightflow-vip/firestore"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-cloud-link"
                  >
                    <span>Cloud Firestore</span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href="https://console.firebase.google.com/project/nightflow-vip/authentication"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-cloud-link"
                  >
                    <span>Authentication</span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href="https://console.firebase.google.com/project/nightflow-vip/hosting"
                    target="_blank"
                    rel="noreferrer"
                    className="dev-cloud-link"
                  >
                    <span>Firebase Hosting</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: SEGURIDAD & INVARIANTES */}
          {activeTab === 'SECURITY' && (
            <div>
              {/* Tarjetas de invariantes simplificadas */}
              <div className="dev-invariants-grid">
                {[
                  { id: 1, title: 'Tokens Rotativos (Anti-Pantallazo)', desc: 'Pases firmados JWS con caducidad corta (30-45s).' },
                  { id: 2, title: 'Anti-Transferencia Passkey', desc: 'Reingreso ligado al enclave seguro del teléfono original.' },
                  { id: 3, title: 'Reingreso en Ventana de 30m', desc: 'Control de cortesía para salidas temporales.' },
                  { id: 4, title: 'Colisiones Offline entre Puertas', desc: 'Idempotencia transaccional sin penalizar al cliente.' },
                  { id: 5, title: 'Coordinación NIGHTFLOW Edge', desc: 'Sincronización LAN local ante cortes de conectividad.' },
                  { id: 6, title: 'Desduplicación de Cola Offline', desc: 'Idempotencia estricta por ticketId y jti.' },
                  { id: 7, title: 'Holds de Mesas de 12 Minutos', desc: 'Cero sobreventa garantizada en compras concurrentes.' },
                  { id: 8, title: 'Rechazo de Pagos Tardíos', desc: 'Enrutamiento a saldo a favor si el hold ya expiró.' },
                  { id: 9, title: 'Botón de Pánico de Terminal', desc: 'Revocación inmediata ante robo de terminal de guardia.' },
                  { id: 10, title: 'Revocación de Versión', desc: 'Invalida tokens de puerta anteriores a la versión activa.' },
                  { id: 11, title: 'Anonimización Fiscal LOPDP', desc: 'Eliminación de PII preservando el registro contable.' },
                  { id: 12, title: 'Protección Antifraude OTP', desc: 'Circuit breaker contra picos anómalos de SMS/email.' }
                ].map(item => (
                  <div key={item.id} className="dev-invariant-card">
                    <div className="dev-invariant-card__header">
                      <span className="dev-invariant-card__num">#{item.id.toString().padStart(2, '0')}</span>
                      <span className="dev-invariant-card__status">OK</span>
                    </div>
                    <h4 className="dev-invariant-card__title">{item.title}</h4>
                    <p className="dev-invariant-card__desc">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Bitácora de auditoría embebida */}
              <div style={{ marginTop: '24px' }}>
                <SuperAdminDashboard
                  hideHeader={true}
                  hideSubtabs={true}
                  hideMetrics={true}
                  controlledTab="AUDIT"
                  openEmergencyModal={isEmergencyModalOpen}
                  onCloseEmergencyModal={() => setIsEmergencyModalOpen(false)}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de confirmación para cambios de plan solicitados */}
      <ConfirmPlanChangeModal
        isOpen={!!confirmPlanModal}
        club={confirmPlanModal?.club || null}
        newPlanId={confirmPlanModal?.newPlanId || null}
        plans={store.plans}
        onConfirm={(clubId, newPlanId) => {
          store.updateClubPlan(clubId, newPlanId);
          setConfirmPlanModal(null);
        }}
        onCancel={() => setConfirmPlanModal(null)}
      />

      {/* Modal para implementar y activar beneficio exclusivo solo para ese cliente */}
      <ImplementCustomFeatureModal
        isOpen={!!implementModal}
        club={implementModal?.club || null}
        proposal={implementModal?.proposal || null}
        onImplement={(clubId, featureData, proposalId) => {
          store.activateCustomFeatureForClub(clubId, featureData, proposalId);
          setImplementModal(null);
        }}
        onClose={() => setImplementModal(null)}
      />

      {/* Simulador Interactivo de Pantallas de Interrupción (Error, Nueva Implementación, Mantenimiento) */}
      {isPreviewInterruptionOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <NightflowInterruptionScreen
            showModeSwitcher={true}
            onRetry={() => setIsPreviewInterruptionOpen(false)}
            onReload={() => setIsPreviewInterruptionOpen(false)}
          />
          <button
            type="button"
            onClick={() => setIsPreviewInterruptionOpen(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 100000,
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'var(--text-high, #ffffff)',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(10px)',
            }}
          >
            ✕ Cerrar Simulador
          </button>
        </div>
      )}
    </div>
  );
}

export default DevPortalApp;

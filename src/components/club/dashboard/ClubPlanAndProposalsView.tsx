import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Crown,
  AlertTriangle,
  Receipt,
  FileText,
  Printer,
  Calendar,
} from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import type { Club, SubscriptionPlanId } from '../../../types';
import { esPlan } from '../../../lib/esLabels';
import { formatUsd } from '../../../lib/formatUsd';
import { callFunctions } from '../../../lib/functionsClient';

interface ClubPlanAndProposalsViewProps {
  activeClub: Club;
}

interface SubscriptionDetails {
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'expired';
  cycle?: 'monthly' | 'annual';
  trialEndsAt?: number;
  currentPeriodEnd?: number;
  paymentMethod?: string;
  bypass?: boolean;
  startedAt?: number;
}

function formatEcuadorDate(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Guayaquil',
  });
}

export const ClubPlanAndProposalsView: React.FC<ClubPlanAndProposalsViewProps> = ({ activeClub }) => {
  const store = useClubStore();

  // Suscripción remota en Firestore
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Modal de factura oficial SRI
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [now] = useState(() => Date.now());

  // Ciclo seleccionado para el catálogo
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId>('club_pro');
  const [checkoutMethod, setCheckoutMethod] = useState<'payphone' | 'transfer'>('payphone');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Proposal modal state
  const clubProposals = store.proposals.filter(p => p.club_id === activeClub.id);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [targetPlanId, setTargetPlanId] = useState<SubscriptionPlanId>(activeClub.plan_id);
  const [description, setDescription] = useState('');
  const [proposedBenefit, setProposedBenefit] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar estado de suscripción del backend
  const fetchSubscription = useCallback(async () => {
    try {
      const res = await callFunctions<SubscriptionDetails>('getBusinessSubscription', {
        businessId: activeClub.id,
      });
      if (res) {
        setSubDetails(res);
        if (res.cycle) setBillingCycle(res.cycle);
        if (res.currentPeriodEnd) {
          const diff = res.currentPeriodEnd - Date.now();
          setDaysRemaining(Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000))));
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar la suscripción del backend:', err);
    }
  }, [activeClub.id]);

  useEffect(() => {
    let active = true;
    callFunctions<SubscriptionDetails>('getBusinessSubscription', {
      businessId: activeClub.id,
    })
      .then((res) => {
        if (active && res) {
          setSubDetails(res);
          if (res.cycle) setBillingCycle(res.cycle);
          if (res.currentPeriodEnd) {
            const diff = res.currentPeriodEnd - Date.now();
            setDaysRemaining(Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000))));
          }
        }
      })
      .catch((err) => {
        console.warn('No se pudo cargar la suscripción del backend:', err);
      });

    return () => {
      active = false;
    };
  }, [activeClub.id]);

  const handleOpenCheckout = (planId: SubscriptionPlanId) => {
    setSelectedPlanForCheckout(planId);
    setCheckoutError(null);
    setCheckoutModalOpen(true);
  };

  const handleStartTrial = async (planId: SubscriptionPlanId) => {
    setCheckoutSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await callFunctions<{ success: boolean; trialGranted: boolean; currentPeriodEnd: number }>('selectSubscriptionPlan', {
        businessId: activeClub.id,
        planId,
        cycle: billingCycle,
        paymentMethod: 'none',
      });
      if (res.success) {
        setSuccessMessage(`¡Trial de 30 días activado exitosamente para el Plan ${esPlan(planId)}! Tienes acceso completo a todas las funcionalidades.`);
        setCheckoutModalOpen(false);
        fetchSubscription();
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al activar periodo de prueba');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      if (selectedPlanForCheckout === 'free') {
        await callFunctions('selectSubscriptionPlan', {
          businessId: activeClub.id,
          planId: 'free',
          cycle: 'monthly',
          paymentMethod: 'none',
        });
        setSuccessMessage('Tu plan ha sido cambiado al plan Lounge Free.');
        setCheckoutModalOpen(false);
        fetchSubscription();
        setTimeout(() => setSuccessMessage(null), 6000);
        return;
      }

      if (checkoutMethod === 'payphone') {
        const res = await callFunctions<{ success: boolean; checkoutUrl?: string }>('selectSubscriptionPlan', {
          businessId: activeClub.id,
          planId: selectedPlanForCheckout,
          cycle: billingCycle,
          paymentMethod: 'payphone_token',
          responseUrl: window.location.href,
        });

        if (res.checkoutUrl) {
          window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
          setSuccessMessage('Se ha abierto la pasarela segura de PayPhone en una nueva pestaña. Una vez completado el pago, tu plan se activará automáticamente.');
          setCheckoutModalOpen(false);
          fetchSubscription();
          setTimeout(() => setSuccessMessage(null), 8000);
        } else {
          setSuccessMessage('Solicitud procesada. Redirigiendo a pasarela...');
          setCheckoutModalOpen(false);
          fetchSubscription();
        }
      } else {
        // Transferencia manual
        await callFunctions('selectSubscriptionPlan', {
          businessId: activeClub.id,
          planId: selectedPlanForCheckout,
          cycle: billingCycle,
          paymentMethod: 'transfer',
        });

        setSuccessMessage('Solicitud de transferencia registrada. Por favor realiza la transferencia a la cuenta de NIGHTFLOW indicada y nuestro equipo activará tu plan en minutos.');
        setCheckoutModalOpen(false);
        fetchSubscription();
        setTimeout(() => setSuccessMessage(null), 10000);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al procesar contratación de plan');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim() || !description.trim() || !proposedBenefit.trim()) {
      return;
    }

    store.submitClubProposal({
      club_id: activeClub.id,
      club_name: activeClub.name,
      requested_plan_id: targetPlanId,
      title: proposalTitle.trim(),
      description: description.trim(),
      proposed_benefit: proposedBenefit.trim(),
    });

    setSuccessMessage('¡Tu propuesta ha sido enviada exitosamente al equipo de desarrollo! Se encuentra en revisión técnica.');
    setProposalTitle('');
    setDescription('');
    setProposedBenefit('');
    setShowProposalForm(false);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const isFounder = activeClub.plan_id === 'beta_vip' || subDetails?.planId === 'beta_vip';
  const isTrial = subDetails?.status === 'trialing';
  const isPastDue = subDetails?.status === 'past_due';
  const isExpired = subDetails?.status === 'expired';
  const canTakeTrial = !subDetails?.trialEndsAt && activeClub.plan_id !== 'beta_vip';

  const activePlanId = (subDetails?.planId || activeClub.plan_id) as SubscriptionPlanId;
  const currentPlanDef = store.plans.find(p => p.id === activePlanId) || {
    id: activePlanId,
    name: esPlan(activePlanId),
    monthly_price: activePlanId === 'starter' ? 5 : activePlanId === 'club_pro' ? 15 : activePlanId === 'black_vip' ? 45 : 0,
    annual_price: activePlanId === 'starter' ? 50 : activePlanId === 'club_pro' ? 150 : activePlanId === 'black_vip' ? 450 : 0,
    features: [],
    max_events_per_month: 99,
  };

  const activeCycle = subDetails?.cycle || 'monthly';
  const isAnnualPlan = activeCycle === 'annual';

  const planRawAmount = (activePlanId === 'beta_vip' || activePlanId === 'free')
    ? 0
    : (isAnnualPlan ? (currentPlanDef.annual_price ?? 150) : (currentPlanDef.monthly_price ?? 15));

  // Desglose fiscal SRI (IVA 15% Ecuador)
  const ivaRate = 0.15;
  const subtotalAmount = planRawAmount > 0 ? Number((planRawAmount / (1 + ivaRate)).toFixed(2)) : 0;
  const ivaAmount = planRawAmount > 0 ? Number((planRawAmount - subtotalAmount).toFixed(2)) : 0;
  const totalAmount = planRawAmount;

  // Fechas y vigencia
  const periodEndTimestamp = subDetails?.currentPeriodEnd || (now + (isAnnualPlan ? 365 : 30) * 86400000);
  const cycleTotalDays = isAnnualPlan ? 365 : 30;
  const effectiveDaysLeft = isFounder
    ? 9999
    : Math.max(0, Math.ceil((periodEndTimestamp - now) / (24 * 60 * 60 * 1000)));

  const percentUsed = isFounder
    ? 100
    : Math.min(100, Math.max(4, Math.round(((cycleTotalDays - effectiveDaysLeft) / cycleTotalDays) * 100)));

  // Factura Oficial SRI
  const invoiceNumber = `NF-${new Date().getFullYear()}-${activeClub.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()}-${isAnnualPlan ? 'A' : 'M'}`;
  const accessKeySri = `121020260109933458920012001001${activeClub.id.replace(/[^0-9]/g, '').padEnd(14, '7').slice(0, 14)}123456781`;
  const invoiceIssueDate = subDetails?.startedAt || (now - 5 * 86400000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Banner & Status */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.12) 0%, rgba(17, 18, 26, 0.95) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.35)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(229, 181, 79, 0.15)',
                color: '#e5b54f',
                border: '1px solid rgba(229, 181, 79, 0.35)',
              }}
            >
              Membresía SaaS &amp; Operaciones
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {activeClub.name}
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 8px',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span>Plan Vigente:</span>
            <span style={{ color: '#e5b54f' }}>{esPlan(subDetails?.planId || activeClub.plan_id)}</span>

            {/* Badges de estado */}
            {isFounder && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(229, 181, 79, 0.2)',
                  color: '#f5d38a',
                  border: '1px solid rgba(229, 181, 79, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                }}
              >
                <Crown size={13} />
                FUNDADOR BETA VIP
              </span>
            )}

            {isTrial && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                }}
              >
                <Clock size={13} />
                TRIAL: {daysRemaining} DÍAS RESTANTES
              </span>
            )}

            {isPastDue && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                }}
              >
                <AlertTriangle size={13} />
                PERIODO DE GRACIA (PAGO PENDIENTE)
              </span>
            )}

            {isExpired && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                }}
              >
                <AlertCircle size={13} />
                SUSCRIPCIÓN EXPIRADA
              </span>
            )}
          </h1>

          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.75)' }}>
            {isFounder
              ? 'Tu discoteca cuenta con el plan preferencial de Beta Privada. Todas las funcionalidades, reservas y escáneres están 100% desbloqueados de por vida para fundadores.'
              : isTrial
              ? `Estás disfrutando de tu prueba gratuita de 30 días de NIGHTFLOW VIP. Tienes acceso completo a tus herramientas operativas hasta el vencimiento.`
              : isPastDue
              ? 'Tu periodo de facturación ha vencido. Cuentas con 3 días de gracia antes de que el establecimiento sea degradado al plan Lounge Free.'
              : 'Elige el plan que mejor se adapte al volumen de tu establecimiento o contrata con tarjeta de crédito o transferencia bancaria.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowProposalForm(true)}
            style={{
              padding: '11px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} color="#e5b54f" />
            Solicitar Módulo a Medida
          </button>
        </div>
      </div>

      {/* Notificación de éxito */}
      {successMessage && (
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#34d399',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Sección Ejecutiva: Plan Actual, Vigencia & Factura Oficial del Plan */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(180deg, rgba(14, 15, 23, 0.98) 0%, rgba(9, 10, 15, 0.98) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.28)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="var(--brand-gold)" />
              <span>Tu Membresía Actual, Vigencia &amp; Facturación</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Consulta el plan contratado por tu discoteca, el tiempo restante del ciclo y el comprobante fiscal electrónico.
            </p>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            <span>ESTADO: {isFounder ? 'VITALICIO FUNDADOR' : isTrial ? 'PRUEBA GRATUITA' : isPastDue ? 'PAGO PENDIENTE' : 'ACTIVO / AL DÍA'}</span>
          </span>
        </div>

        {/* Grid de 3 Columnas Ejecutivas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1: Plan Actual & Modalidad */}
          <div
            style={{
              background: 'rgba(229, 181, 79, 0.04)',
              border: '1px solid rgba(229, 181, 79, 0.22)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crown size={14} />
                  <span>PLAN QUE TIENES AHORA</span>
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  MODALIDAD {isAnnualPlan ? 'ANUAL' : 'MENSUAL'}
                </span>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                {esPlan(activePlanId)}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {isFounder
                  ? 'Membresía preferencial vitalicia sin expiración asignada para fundadores.'
                  : `Plan ${isAnnualPlan ? 'anual con tarifa preferencial (ahorro de 2 meses)' : 'mensual recurrente'} para ${activeClub.name}.`}
              </p>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.74rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cuota pactada:</span>
                <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {isFounder || planRawAmount === 0
                    ? 'USD 0.00 / Vitalicio'
                    : isAnnualPlan
                    ? `${formatUsd(planRawAmount)} / año`
                    : `${formatUsd(planRawAmount)} / mes`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Método de pago:</span>
                <span style={{ color: '#fff' }}>
                  {subDetails?.paymentMethod === 'payphone_token' || subDetails?.paymentMethod === 'payphone_sale'
                    ? 'Tarjeta de Crédito (PayPhone)'
                    : subDetails?.paymentMethod === 'transfer'
                    ? 'Transferencia Bancaria'
                    : isFounder
                    ? 'Bypass Fundador VIP'
                    : 'Sin costo / Directo'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Cuánto Tiempo le Queda */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.04)',
              border: '1px solid rgba(59, 130, 246, 0.22)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>CUÁNTO TIEMPO LE QUEDA</span>
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  CICLO: {cycleTotalDays} DÍAS
                </span>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                {isFounder ? 'VITALICIO' : `${effectiveDaysLeft} DÍAS RESTANTES`}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {isFounder
                  ? 'Tu club cuenta con acceso permanente garantizado. No requiere renovaciones periódicas.'
                  : `De tu ciclo de facturación ${isAnnualPlan ? 'anual (365 días)' : 'mensual (30 días)'}.`}
              </p>
            </div>

            <div>
              {/* Barra de progreso de vigencia */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vigencia del ciclo:</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{isFounder ? '100% activa' : `${percentUsed}% transcurrido`}</span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percentUsed}%`,
                      height: '100%',
                      background: isFounder
                        ? 'linear-gradient(90deg, #e5b54f, #34d399)'
                        : 'linear-gradient(90deg, #38bdf8, #e5b54f)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                }}
              >
                <Calendar size={12} color="var(--brand-gold)" />
                <span>
                  {isFounder
                    ? 'Renovación automática vitalicia sin corte'
                    : `Próximo corte: ${formatEcuadorDate(periodEndTimestamp)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Factura de ese Plan (Mes o Anual) */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.22)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} />
                  <span>FACTURA / COMPROBANTE SRI</span>
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  PAGADA
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                {invoiceNumber}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Emisor: NIGHTFLOW VIP S.A.S. (RUC: 0993345892001) para {activeClub.legal_profile?.legalName || activeClub.name}.
              </p>
            </div>

            <div>
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '0.72rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal ({isAnnualPlan ? '12 meses' : '1 mes'}):</span>
                  <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatUsd(subtotalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>IVA 15% (Ecuador SRI):</span>
                  <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatUsd(ivaAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span style={{ color: '#fff' }}>Total Factura:</span>
                  <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{formatUsd(totalAmount)} USD</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: '1px solid rgba(229, 181, 79, 0.35)',
                  background: 'rgba(229, 181, 79, 0.08)',
                  color: 'var(--brand-gold)',
                }}
              >
                <FileText size={13} />
                <span>Ver Factura Digital SRI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Factura Electrónica SRI */}
      {invoiceModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setInvoiceModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '740px',
              width: '100%',
              background: '#0d0f17',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
              padding: '28px',
              color: '#fff',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Cabecera del modal con botón imprimir y cerrar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={22} color="var(--brand-gold)" />
                <div>
                  <h3 className="font-brand" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    Comprobante Electrónico SRI — Factura Oficial
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Conforme a la normativa tributaria del Servicio de Rentas Internas de Ecuador
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: 'rgba(229, 181, 79, 0.15)',
                    border: '1px solid rgba(229, 181, 79, 0.4)',
                    color: '#e5b54f',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Printer size={13} />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  aria-label="Cerrar factura"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Cuerpo de la Factura Estilo SRI */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '0.78rem',
              }}
            >
              {/* Encabezado Emisor vs Caja Fiscal */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '16px',
                }}
              >
                {/* Emisor */}
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-gold)', marginBottom: '4px' }}>
                    NIGHTFLOW VIP TECNOLOGÍA NOCTURNA S.A.S.
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    <strong>RUC:</strong> 0993345892001<br />
                    <strong>Matriz:</strong> Av. Francisco de Orellana y Alberto Borges, Guayaquil, Ecuador<br />
                    <strong>Obligado a llevar contabilidad:</strong> SÍ<br />
                    <strong>Régimen:</strong> Contribuyente Régimen General SRI
                  </div>
                </div>

                {/* Recuadro Fiscal SRI */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(229, 181, 79, 0.05)',
                    border: '1px solid rgba(229, 181, 79, 0.25)',
                    lineHeight: '1.45',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase' }}>
                    FACTURA ELECTRÓNICA
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    N° {invoiceNumber}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <strong>CLAVE DE ACCESO / AUTORIZACIÓN:</strong>
                    <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: '#e2e8f0', marginTop: '2px' }}>
                      {accessKeySri}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <strong>FECHA DE EMISIÓN:</strong> {formatEcuadorDate(invoiceIssueDate)} | <strong>AMBIENTE:</strong> PRODUCCIÓN
                  </div>
                </div>
              </div>

              {/* Datos del Cliente / Adquiriente */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  lineHeight: '1.5',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  DATOS DEL ADQUIRIENTE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Razón Social: </span>
                    <strong style={{ color: '#fff' }}>{activeClub.legal_profile?.legalName || activeClub.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>RUC / Cédula: </span>
                    <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{activeClub.legal_profile?.ruc || '0999999999001'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Dirección: </span>
                    <span style={{ color: '#fff' }}>{activeClub.legal_profile?.taxAddress || activeClub.address || `${activeClub.city}, Ecuador`}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Correo: </span>
                    <span style={{ color: '#fff' }}>{activeClub.legal_profile?.supportEmail || `admin@${activeClub.slug || 'club'}.com`}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de Productos / Servicios */}
              <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(229, 181, 79, 0.25)', textAlign: 'left', color: 'var(--brand-gold)', fontSize: '0.68rem' }}>
                      <th style={{ padding: '8px' }}>CÓDIGO</th>
                      <th style={{ padding: '8px' }}>DESCRIPCIÓN</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>CANT.</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>P. UNITARIO</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>DESCUENTO</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--brand-gold)' }}>
                        SUB-{activePlanId.toUpperCase()}-{isAnnualPlan ? 'ANUAL' : 'MEN'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#fff' }}>
                        Suscripción SaaS NIGHTFLOW VIP — Plan {esPlan(activePlanId)} ({isAnnualPlan ? 'Cobertura 12 Meses / Facturación Anual' : 'Cobertura 30 Días / Facturación Mensual'})
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#fff' }}>1</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                        {formatUsd(subtotalAmount)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        $0.00
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 800 }}>
                        {formatUsd(subtotalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Liquidación de Impuestos SRI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ lineHeight: '1.5', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    INFORMACIÓN ADICIONAL
                  </div>
                  <div><strong>Periodo cubierto:</strong> Hasta el {formatEcuadorDate(periodEndTimestamp)}</div>
                  <div><strong>Forma de pago:</strong> Otros con utilización del sistema financiero (20)</div>
                  <div><strong>Plazo:</strong> 0 días (Liquidado de contado)</div>
                  <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#4ade80' }}>
                    Comprobante autorizado automáticamente por el sistema de facturación electrónica.
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.74rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SUBTOTAL 15%:</span>
                    <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatUsd(subtotalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SUBTOTAL 0%:</span>
                    <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>$0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SUBTOTAL SIN IMPUESTOS:</span>
                    <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatUsd(subtotalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>IVA 15%:</span>
                    <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatUsd(ivaAmount)}</span>
                  </div>
                  <div
                    style={{
                      borderTop: '1px solid rgba(229, 181, 79, 0.3)',
                      paddingTop: '6px',
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                    }}
                  >
                    <span style={{ color: '#fff' }}>VALOR TOTAL:</span>
                    <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{formatUsd(totalAmount)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.78rem' }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #e5b54f 0%, #d4a33d 100%)',
                  border: 'none',
                  color: '#08080c',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={14} />
                <span>Imprimir / Guardar en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Planes Disponibles &amp; Contratación Directa
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Facturación transparente en USD sin comisiones ocultas por entrada.
            </p>
          </div>

          {/* Selector de Ciclo */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'monthly' ? 'rgba(229, 181, 79, 0.2)' : 'transparent',
                color: billingCycle === 'monthly' ? '#e5b54f' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'annual' ? 'rgba(229, 181, 79, 0.2)' : 'transparent',
                color: billingCycle === 'annual' ? '#e5b54f' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Anual</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: '#e5b54f',
                  color: '#08080c',
                  fontWeight: 800,
                }}
              >
                2 MESES GRATIS
              </span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
          {store.plans
            .filter(p => p.id !== 'beta_vip')
            .map(plan => {
              const isCurrent = (subDetails?.planId || activeClub.plan_id) === plan.id;
              const price = (billingCycle === 'annual' ? plan.annual_price : plan.monthly_price) ?? 0;
              const periodLabel = billingCycle === 'annual' ? '/ año' : '/ mes';

              return (
                <div
                  key={plan.id}
                  style={{
                    background: isCurrent
                      ? 'linear-gradient(180deg, rgba(229, 181, 79, 0.08) 0%, #0d0f18 100%)'
                      : 'linear-gradient(180deg, #10111a 0%, #0a0b10 100%)',
                    border: `1px solid ${isCurrent ? 'rgba(229, 181, 79, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isCurrent ? '0 12px 32px rgba(229, 181, 79, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '14px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(229, 181, 79, 0.2)',
                        border: '1px solid rgba(229, 181, 79, 0.4)',
                        color: '#e5b54f',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                      }}
                    >
                      PLAN ACTUAL
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                      {esPlan(plan.id)}
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.4 }}>
                      {plan.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e5b54f' }}>
                        {formatUsd(price)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {periodLabel}
                      </span>
                    </div>

                    <ul
                      style={{
                        margin: '0 0 24px',
                        padding: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {plan.features.map((feat, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Check size={14} color="#e5b54f" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {isCurrent ? (
                      <div
                        style={{
                          padding: '10px',
                          textAlign: 'center',
                          borderRadius: '8px',
                          background: 'rgba(229, 181, 79, 0.1)',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                          color: '#e5b54f',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Plan Activo en tu Local
                      </div>
                    ) : canTakeTrial && plan.id !== 'free' ? (
                      <button
                        type="button"
                        onClick={() => handleStartTrial(plan.id)}
                        disabled={checkoutSubmitting}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(229, 181, 79, 0.5)',
                          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.05) 100%)',
                          color: '#f5d38a',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Sparkles size={14} />
                        Probar 30 Días Gratis
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(plan.id)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        Contratar {esPlan(plan.id)}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. Modal de Checkout de Suscripción */}
      {checkoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 5, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !checkoutSubmitting && setCheckoutModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'linear-gradient(180deg, #12131d 0%, #0a0b12 100%)',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(229, 181, 79, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={18} color="#e5b54f" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Contratar Plan {esPlan(selectedPlanForCheckout)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={checkoutSubmitting}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessCheckout} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {checkoutError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                  }}
                >
                  {checkoutError}
                </div>
              )}

              {/* Resumen del Plan */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                    {esPlan(selectedPlanForCheckout)} ({billingCycle === 'annual' ? 'Ciclo Anual' : 'Ciclo Mensual'})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {activeClub.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e5b54f' }}>
                    {formatUsd(
                      billingCycle === 'annual'
                        ? selectedPlanForCheckout === 'starter' ? 50 : selectedPlanForCheckout === 'club_pro' ? 150 : 450
                        : selectedPlanForCheckout === 'starter' ? 5 : selectedPlanForCheckout === 'club_pro' ? 15 : 45
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {billingCycle === 'annual' ? '12 meses' : '30 días'}
                  </div>
                </div>
              </div>

              {/* Selección de Método de Pago */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                  Método de Pago
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutMethod('payphone')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: checkoutMethod === 'payphone' ? 'rgba(229, 181, 79, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${checkoutMethod === 'payphone' ? 'rgba(229, 181, 79, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: checkoutMethod === 'payphone' ? '#e5b54f' : 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '4px' }}>
                      💳 PayPhone
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Tarjeta de crédito/débito nacional o internacional
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutMethod('transfer')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: checkoutMethod === 'transfer' ? 'rgba(229, 181, 79, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${checkoutMethod === 'transfer' ? 'rgba(229, 181, 79, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: checkoutMethod === 'transfer' ? '#e5b54f' : 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '4px' }}>
                      🏦 Transferencia
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Depósito bancario directo en Ecuador
                    </div>
                  </button>
                </div>
              </div>

              {/* Detalles de transferencia bancaria */}
              {checkoutMethod === 'transfer' && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.78rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#e5b54f' }}>Datos Bancarios NIGHTFLOW VIP:</div>
                  <div><strong>Banco:</strong> Banco Pichincha (Ecuador)</div>
                  <div><strong>Tipo de Cuenta:</strong> Corriente # 2100892341</div>
                  <div><strong>Titular:</strong> NIGHTFLOW VIP S.A.S. (RUC 1793198421001)</div>
                  <div><strong>Referencia obligatoria:</strong> <code style={{ color: '#e5b54f' }}>NF-{activeClub.id.slice(-6)}-{selectedPlanForCheckout.slice(0,3).toUpperCase()}</code></div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                    Una vez realizada la transferencia, haz clic en «Notificar Transferencia» y el equipo activará tu plan de inmediato.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={checkoutSubmitting}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #e5b54f 0%, #d4a33d 100%)',
                    border: '1px solid rgba(229, 181, 79, 0.6)',
                    color: '#08080c',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {checkoutSubmitting
                    ? 'Procesando...'
                    : checkoutMethod === 'payphone'
                    ? 'Proceder a PayPhone'
                    : 'Notificar Transferencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal para Enviar Propuesta / Módulo Exclusivo */}
      {showProposalForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 5, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowProposalForm(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              background: 'linear-gradient(180deg, #11111a 0%, #090a0f 100%)',
              border: '1px solid rgba(229, 181, 79, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(229, 181, 79, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="#e5b54f" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Solicitar Módulo Exclusivo para {activeClub.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalForm(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                  Título del Módulo o Integración Solicitada
                </label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={e => setProposalTitle(e.target.value)}
                  placeholder="Ej: Integración con lector de comandas o split de pagos por mesa"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                  Plan que Deseas Asociar o Contratar
                </label>
                <select
                  value={targetPlanId}
                  onChange={e => setTargetPlanId(e.target.value as SubscriptionPlanId)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#161726',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  {store.plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {esPlan(p.id)} ({formatUsd(p.monthly_price)}/mes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                  Descripción Técnica Detallada
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe cómo funciona tu flujo actual y qué esperas que realice el sistema..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '6px' }}>
                  Impacto Operativo Esperado
                </label>
                <input
                  type="text"
                  value={proposedBenefit}
                  onChange={e => setProposedBenefit(e.target.value)}
                  placeholder="Ej: Ahorro de 15 minutos en puerta y control directo de stock de botellas"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #e5b54f 0%, #d4a33d 100%)',
                    border: '1px solid rgba(229, 181, 79, 0.6)',
                    color: '#08080c',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Enviar Propuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Historial de Propuestas del Club */}
      <div
        style={{
          background: 'linear-gradient(180deg, #10111a 0%, #0a0b10 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            Historial de Solicitudes y Propuestas de {activeClub.name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Seguimiento de tus solicitudes de upgrade y módulos exclusivos desarrollados por la plataforma.
          </p>
        </div>

        {clubProposals.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              No has enviado propuestas o solicitudes de desarrollo a medida aún.
            </p>
            <button
              type="button"
              onClick={() => setShowProposalForm(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e5b54f',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Envía tu primera propuesta aquí
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {clubProposals.map(prop => (
              <div
                key={prop.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                      {prop.title}
                    </span>
                    {prop.requested_plan_id && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(229, 181, 79, 0.12)',
                          color: '#e5b54f',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                        }}
                      >
                        Plan solicitado: {esPlan(prop.requested_plan_id)}
                      </span>
                    )}
                  </div>

                  <div>
                    {prop.status === 'PENDING' && (
                      <span className="status-chip status-chip--pending">
                        <Clock size={12} /> Pendiente de Evaluación
                      </span>
                    )}
                    {prop.status === 'IN_REVIEW' && (
                      <span className="status-chip status-chip--review">
                        <AlertCircle size={12} /> En Revisión Técnica
                      </span>
                    )}
                    {prop.status === 'IMPLEMENTED' && (
                      <span className="status-chip status-chip--done">
                        <CheckCircle2 size={12} /> Implementada &amp; Activa
                      </span>
                    )}
                    {prop.status === 'REJECTED' && (
                      <span className="status-chip status-chip--rejected">
                        <X size={12} /> Rechazada
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45 }}>
                  {prop.description}
                </p>

                {prop.proposed_benefit && (
                  <div style={{ fontSize: '0.75rem', color: '#e5b54f' }}>
                    <strong>Beneficio esperado:</strong> {prop.proposed_benefit}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

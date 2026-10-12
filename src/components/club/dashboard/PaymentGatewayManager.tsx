import { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  RefreshCw,
  Globe,
  Landmark,
  Save,
  Zap,
  ArrowRight,
  Shield,
  KeyRound,
  AlertTriangle,
  Smartphone,
  QrCode,
  ChevronDown,
  ChevronUp,
  Headphones,
  Info,
} from 'lucide-react';
import { callFunctions } from '../../../lib/functionsClient';
import type { Club } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';

interface Props {
  activeClub: Club;
  session?: AdminStaffSession;
}

export type PaymentModeOption = 'PAY_AT_DOOR' | 'CLIENT_GATEWAY' | 'ASSISTED_GATEWAY';
export type PaymentEnvironment = 'sandbox' | 'production';

interface PaymentAccountState {
  paymentMode: PaymentModeOption;
  provider: 'kushki' | 'payphone' | 'deuna' | 'none';
  environment: PaymentEnvironment;
  merchantId: string;
  publicApiKey: string;
  secretReference: string;
}

interface RemotePaymentAccount extends Partial<PaymentAccountState> {
  status?: string;
  updatedAt?: number | null;
}

interface PaymentAccountResponse {
  businessId: string;
  paymentAccount: RemotePaymentAccount | null;
}

type RemoteStatus = 'loading' | 'missing' | 'configured';

const EMPTY_CONFIG: PaymentAccountState = {
  paymentMode: 'CLIENT_GATEWAY',
  provider: 'kushki',
  environment: 'sandbox',
  merchantId: '',
  publicApiKey: '',
  secretReference: '',
};

function readableError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Error desconocido al contactar con el servidor.';
}

export const PaymentGatewayManager = ({ activeClub, session: _session }: Props) => {
  const [config, setConfig] = useState<PaymentAccountState>(EMPTY_CONFIG);
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    // El componente se remonta por club (key={activeClub.id}), por lo que el
    // estado inicial ya está limpio y solo se necesita la consulta remota.
    let cancelled = false;

    callFunctions<PaymentAccountResponse>('getPaymentAccount', { businessId: activeClub.id })
      .then((result) => {
        if (cancelled) return;
        const remote = result.paymentAccount;
        if (remote) {
          setConfig({
            paymentMode: (remote.paymentMode as PaymentModeOption) ?? 'CLIENT_GATEWAY',
            provider: (remote.provider as PaymentAccountState['provider']) ?? 'kushki',
            environment: (remote.environment as PaymentEnvironment) ?? 'sandbox',
            merchantId: remote.merchantId ?? '',
            publicApiKey: remote.publicApiKey ?? '',
            secretReference: remote.secretReference ?? '',
          });
          setRemoteStatus('configured');
        } else {
          setRemoteStatus('missing');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(readableError(error));
        setRemoteStatus('missing');
      });

    return () => {
      cancelled = true;
    };
  }, [activeClub.id]);

  const [showTechDetails, setShowTechDetails] = useState(false);

  const backendBaseUrl =
    typeof window !== 'undefined'
      ? (import.meta.env.VITE_BACKEND_URL as string) || window.location.origin
      : 'https://nightflow-vip.onrender.com';

  const webhookPath =
    config.provider === 'payphone'
      ? `/v1/payments/webhooks/payphone/${config.merchantId || activeClub.id}`
      : config.provider === 'deuna'
      ? `/v1/payments/webhooks/deuna/${config.merchantId || activeClub.id}`
      : `/v1/payments/webhooks/kushki/${config.merchantId || activeClub.id}`;

  const webhookUrl = `${backendBaseUrl}${webhookPath}`;

  const getConsoleInfo = () => {
    if (config.provider === 'payphone') {
      return {
        url: 'https://developer.payphonetodoesposible.com',
        label: 'Consola PayPhone Developers',
      };
    }
    if (config.provider === 'deuna') {
      return {
        url: 'https://deuna.app',
        label: 'Portal DeUna',
      };
    }
    return {
      url:
        config.environment === 'production'
          ? 'https://console.kushkipagos.com'
          : 'https://uat-console.kushkipagos.com',
      label: `Consola Kushki ${config.environment === 'sandbox' ? 'UAT' : 'Prod'}`,
    };
  };

  const consoleInfo = getConsoleInfo();

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSavedSuccess(false);
    try {
      const isDoor = config.paymentMode === 'PAY_AT_DOOR';
      const effectiveMerchantId = isDoor
        ? (config.merchantId.trim() || `door_${activeClub.id.replace(/[^A-Za-z0-9_]/g, '')}`)
        : config.merchantId.trim();

      if (!isDoor && !effectiveMerchantId) {
        setSaveError('El identificador de comercio (Merchant ID o Store ID) es obligatorio.');
        setSaving(false);
        return;
      }

      const defaultSecret =
        config.provider === 'payphone'
          ? 'env://PAYPHONE_SECRET'
          : config.provider === 'deuna'
          ? 'env://DEUNA_SECRET'
          : 'env://KUSHKI_SECRET';

      const effectiveSecret = isDoor ? undefined : (config.secretReference.trim() || defaultSecret);

      await callFunctions<PaymentAccountResponse>('configurePaymentAccount', {
        businessId: activeClub.id,
        paymentMode: config.paymentMode,
        provider: isDoor ? 'none' : config.provider,
        environment: config.environment,
        merchantId: effectiveMerchantId,
        ...(config.publicApiKey.trim() ? { publicApiKey: config.publicApiKey.trim() } : {}),
        ...(effectiveSecret ? { secretReference: effectiveSecret } : {}),
      });
      setRemoteStatus('configured');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: unknown) {
      setSaveError(readableError(error));
    } finally {
      setSaving(false);
    }
  };

  const isDoor = config.paymentMode === 'PAY_AT_DOOR';
  const isAssisted = config.paymentMode === 'ASSISTED_GATEWAY';
  const providerLabel =
    config.provider === 'payphone'
      ? 'PayPhone'
      : config.provider === 'deuna'
      ? 'DeUna'
      : 'Kushki';

  const statusBadge = isDoor
    ? { label: 'COBRO EN PUERTA ACTIVO (SIN PASARELA ONLINE)', color: '#4ade80' as const }
    : isAssisted
    ? { label: 'ASISTENCIA TÉCNICA NIGHTFLOW', color: 'var(--brand-gold)' as const }
    : remoteStatus === 'configured'
    ? { label: `CONECTADO A ${providerLabel.toUpperCase()}`, color: '#4ade80' as const }
    : remoteStatus === 'loading'
    ? { label: 'CONSULTANDO SERVIDOR…', color: 'var(--brand-gold)' as const }
    : { label: 'PENDIENTE DE CONFIGURAR', color: '#f59e0b' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Encabezado Principal — Executive Hero Card */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '24px 28px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.1) 0%, rgba(14, 14, 21, 0.96) 60%, rgba(8, 8, 12, 0.98) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(229, 181, 79, 0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            left: '20px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(229, 181, 79, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '740px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.15)',
                border: '1px solid rgba(229, 181, 79, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(229, 181, 79, 0.2)',
              }}
            >
              <CreditCard size={20} color="var(--brand-gold)" />
            </div>

            <h2 className="font-brand" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.02em' }}>
              Cobro de Reservas &amp; Pasarelas de Pago
            </h2>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: `${statusBadge.color}1f`,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.color}4d`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: statusBadge.color,
                  boxShadow: `0 0 8px ${statusBadge.color}`,
                }}
              />
              {statusBadge.label}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            Tus ingresos por reservas y mesas VIP van <strong style={{ color: '#fff' }}>100% directos a la cuenta bancaria</strong> de <strong style={{ color: 'var(--brand-gold)' }}>{activeClub.name}</strong>.
            NIGHTFLOW VIP no interviene como captador de fondos ni retiene comisiones sobre tus ventas.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isDoor && consoleInfo && (
            <a
              href={consoleInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                color: 'var(--brand-gold)',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <ExternalLink size={14} />
              <span>{consoleInfo.label}</span>
            </a>
          )}

          <button
            onClick={handleSave}
            type="button"
            disabled={saving || remoteStatus === 'loading'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 22px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #e5b54f 0%, #cfa038 100%)',
              color: '#08080c',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || remoteStatus === 'loading' ? 0.7 : 1,
              boxShadow: '0 0 20px rgba(229, 181, 79, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {savedSuccess ? <Check size={16} /> : saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            <span>{savedSuccess ? '¡Guardado correctamente!' : saving ? 'Guardando…' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Educativa y Guía: Información para el Dueño del Negocio */}
      <div
        className="glass-card"
        style={{
          padding: '22px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(229, 181, 79, 0.15)',
                border: '1px solid rgba(229, 181, 79, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Info size={17} color="var(--brand-gold)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Información para el Dueño del Negocio: Modalidades de Cobro
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                NIGHTFLOW se adapta a tus herramientas actuales en Ecuador. Elige cómo recaudar según tu operación:
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'rgba(229, 181, 79, 0.14)',
              color: 'var(--brand-gold)',
              border: '1px solid rgba(229, 181, 79, 0.3)',
            }}
          >
            GUÍA PARA EL PROPIETARIO
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Caso 1: Datáfono Datafast o Medianet */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CreditCard size={15} color="#4ade80" />
              <strong style={{ fontSize: '0.84rem', color: '#fff' }}>Cobro con Datáfonos Datafast o POS Físico</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              Si cobras en caja con máquina de Datafast o Medianet: activa la opción <strong style={{ color: '#4ade80' }}>Cobro en Puerta</strong> abajo. Tus clientes reservan su mesa online y cancelan de forma presencial con tu datáfono habitual al ingresar al club. Cero trámites ni comisiones web.
            </p>
          </div>

          {/* Caso 2: Transferencia Bancaria Directa */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Landmark size={15} color="var(--brand-gold)" />
              <strong style={{ fontSize: '0.84rem', color: '#fff' }}>Cobro por Transferencia Directa o DeUna</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              Si prefieres transferencias a tu cuenta de Banco Pichincha, Guayaquil o Produbanco: el cliente aparta su mesa online y envía el comprobante por WhatsApp o lo presenta en taquilla. Tu personal valida su pase QR en puerta en segundos.
            </p>
          </div>

          {/* Caso 3: Otra Pasarela Online (PlacetoPay, Stripe, Nuvei...) */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Headphones size={15} color="#38bdf8" />
              <strong style={{ fontSize: '0.84rem', color: '#fff' }}>Pasarelas Online o Contratos Existentes</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              Si deseas cobro web automático (Kushki, PayPhone, DeUna) o ya tienes un contrato con otra pasarela bancaria (PlacetoPay, Nuvei, Stripe): conecta tus llaves abajo o solicita <strong style={{ color: '#38bdf8' }}>Asistencia NIGHTFLOW</strong> para enlazar tu cuenta sin costo adicional.
            </p>
          </div>
        </div>
      </div>

      {/* Errores de carga / guardado */}
      {loadError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px 14px',
            borderRadius: '8px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>No se pudo consultar la configuración del servidor: {loadError}</span>
        </div>
      )}
      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px 14px',
            borderRadius: '8px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Grid Principal: Modalidad + Configuración & Webhooks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '22px' }}>
        {/* Columna Izquierda: Modalidad y Credenciales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* PASO 01: Selector de Modalidad */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
              border: '1px solid rgba(229, 181, 79, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(229, 181, 79, 0.15)',
                  color: 'var(--brand-gold)',
                  border: '1px solid rgba(229, 181, 79, 0.3)',
                }}
              >
                PASO 01
              </span>
              <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                ¿Cómo deseas cobrar las reservas de {activeClub.name}?
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                {
                  id: 'PAY_AT_DOOR',
                  badge: 'MÁS SENCILLO & 0% COMISIÓN',
                  badgeColor: '#4ade80',
                  title: 'Cobro en Puerta / Datafast / Transferencia Bancaria',
                  desc: 'El cliente reserva en la web y el cupo se aparta por 12 min. El cobro del anticipo o mesa se efectúa presencialmente con tu datáfono Datafast, transferencia o efectivo.',
                  icon: <Landmark size={18} color="#4ade80" />,
                },
                {
                  id: 'CLIENT_GATEWAY',
                  badge: 'COBRO ONLINE AUTOMÁTICO',
                  badgeColor: 'var(--brand-gold)',
                  title: 'Pasarela de Cobro Online Directa (Kushki, PayPhone, DeUna)',
                  desc: 'Tus clientes pagan con tarjeta de crédito/débito o app móvil al reservar en la web. La mesa se confirma al instante y el dinero entra directo a tu banco.',
                  icon: <Zap size={18} color="var(--brand-gold)" />,
                },
                {
                  id: 'ASSISTED_GATEWAY',
                  badge: 'SOPORTE TÉCNICO',
                  badgeColor: '#38bdf8',
                  title: 'Asistencia Técnica & Conexión NIGHTFLOW',
                  desc: 'NIGHTFLOW VIP apoya técnicamente a tu club para conectar tu pasarela actual o crear tu cuenta oficial manteniendo la recaudación directa a tu banco.',
                  icon: <ShieldCheck size={18} color="#38bdf8" />,
                },
              ] as const).map(mode => {
                const isSelected = config.paymentMode === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setConfig(prev => ({ ...prev, paymentMode: mode.id }))}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '10px',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(229, 181, 79, 0.12) 0%, rgba(14, 14, 21, 0.95) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(229, 181, 79, 0.45)' : 'rgba(255, 255, 255, 0.07)',
                      boxShadow: isSelected ? '0 0 18px rgba(229, 181, 79, 0.15)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        marginTop: '2px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(229, 181, 79, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isSelected ? 'rgba(229, 181, 79, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {mode.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: isSelected ? '#fff' : '#cbd5e1',
                          }}
                        >
                          {mode.title}
                        </span>

                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: `${mode.badgeColor}18`,
                            color: mode.badgeColor,
                            border: `1px solid ${mode.badgeColor}33`,
                          }}
                        >
                          {mode.badge}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                        {mode.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Si está en Cobro en Puerta: Panel de Confirmación Limpio y Tranquilizador */}
          {config.paymentMode === 'PAY_AT_DOOR' && (
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(14, 14, 21, 0.95) 100%)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle2 size={20} color="#4ade80" />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Modo de Cobro en Puerta y Local Activo
                </h4>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 14px 0' }}>
                Tu establecimiento está listo para operar sin necesidad de pasarelas online ni cuentas bancarias conectadas por API.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#4ade80" />
                  <span><strong>Mesas protegidas:</strong> El stock se reserva por 12 minutos mientras el cliente llega o confirma.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#4ade80" />
                  <span><strong>Pase VIP QR:</strong> El cliente recibe su pase digital rotativo para presentarlo en la entrada.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#4ade80" />
                  <span><strong>Cobro presencial:</strong> Cobras el anticipo o consumo en tu datáfono físico (Datafast/Medianet), transferencia o efectivo.</span>
                </div>
              </div>
            </div>
          )}

          {/* Si está en Cobro Online: PASO 02 (Seleccionar Pasarela) y PASO 03 (Credenciales) */}
          {config.paymentMode === 'CLIENT_GATEWAY' && (
            <>
              {/* Selector de Pasarela */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
                  border: '1px solid rgba(229, 181, 79, 0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(229, 181, 79, 0.15)',
                      color: 'var(--brand-gold)',
                      border: '1px solid rgba(229, 181, 79, 0.3)',
                    }}
                  >
                    PASO 02
                  </span>
                  <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Selecciona tu Pasarela de Pago Online
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {([
                    {
                      id: 'kushki' as const,
                      name: 'Kushki Ecuador',
                      tag: 'Tarjetas de Crédito / Débito',
                      desc: 'Visa, Mastercard, Diners, Amex con depósito bancario directo.',
                      icon: <CreditCard size={18} />,
                    },
                    {
                      id: 'payphone' as const,
                      name: 'PayPhone Ecuador',
                      tag: 'App Móvil & Tarjetas',
                      desc: 'Cobros rápidos con app PayPhone o links de pago directos.',
                      icon: <Smartphone size={18} />,
                    },
                    {
                      id: 'deuna' as const,
                      name: 'DeUna (Pichincha)',
                      tag: 'Código QR & Débito',
                      desc: 'Cobros inmediatos a cuenta Banco Pichincha mediante QR.',
                      icon: <QrCode size={18} />,
                    },
                  ]).map(prov => {
                    const isSelected = config.provider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => setConfig(prev => ({ ...prev, provider: prov.id }))}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(229, 181, 79, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: isSelected ? 'var(--brand-gold)' : 'var(--text-muted)' }}>
                            {prov.icon}
                          </span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: isSelected ? 'rgba(229, 181, 79, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              color: isSelected ? 'var(--brand-gold)' : 'var(--text-dim)',
                            }}
                          >
                            {prov.tag}
                          </span>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.84rem', color: isSelected ? '#fff' : '#cbd5e1', display: 'block', marginBottom: '2px' }}>
                            {prov.name}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.35', display: 'block' }}>
                            {prov.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formulario de Credenciales de la pasarela seleccionada */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
                  border: '1px solid rgba(229, 181, 79, 0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(229, 181, 79, 0.15)',
                        color: 'var(--brand-gold)',
                        border: '1px solid rgba(229, 181, 79, 0.3)',
                      }}
                    >
                      PASO 03
                    </span>
                    <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      Credenciales de tu Comercio en {providerLabel}
                    </h3>
                  </div>

                  {/* Switch Sandbox / Producción */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: 'rgba(0, 0, 0, 0.55)',
                      padding: '3px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(229, 181, 79, 0.2)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, environment: 'sandbox' }))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: config.environment === 'sandbox' ? 'rgba(229, 181, 79, 0.25)' : 'transparent',
                        color: config.environment === 'sandbox' ? 'var(--brand-gold)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Modo Pruebas (Sandbox)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, environment: 'production' }))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: config.environment === 'production' ? 'linear-gradient(135deg, #e5b54f 0%, #cfa038 100%)' : 'transparent',
                        color: config.environment === 'production' ? '#08080c' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Modo Real (Producción)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Campo Merchant ID */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                      <span>
                        {config.provider === 'payphone' ? 'Store ID / Merchant ID de PayPhone' : 'Merchant ID (Identificador de Comercio)'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--brand-gold)' }}>Obligatorio</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={15} color="rgba(229, 181, 79, 0.5)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={config.merchantId}
                        onChange={e => setConfig(prev => ({ ...prev, merchantId: e.target.value.trim() }))}
                        placeholder={config.provider === 'payphone' ? 'ej. 8a818181-xxxx-xxxx-xxxx' : 'ej. merchant_barahunda_01'}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: '8px',
                          background: 'rgba(8, 8, 12, 0.85)',
                          border: '1px solid rgba(229, 181, 79, 0.22)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono, monospace)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Lo encuentras en la sección de Configuración / Perfil de Comercio de tu panel de {providerLabel}.
                    </span>
                  </div>

                  {/* Campo Public API Key */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                      <span>
                        {config.provider === 'payphone' ? 'Token Público de PayPhone' : `Public API Key (${providerLabel} Frontend)`}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Token Público</span>
                    </label>
                    <input
                      type="text"
                      value={config.publicApiKey}
                      onChange={e => setConfig(prev => ({ ...prev, publicApiKey: e.target.value.trim() }))}
                      placeholder={config.provider === 'payphone' ? 'Token de desarrollador...' : 'pk_test_... o pk_live_...'}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(8, 8, 12, 0.85)',
                        border: '1px solid rgba(229, 181, 79, 0.22)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono, monospace)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Campo Referencia Secreta */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                      <span>Referencia Secreta (Almacenamiento Cifrado en Servidor)</span>
                      <span style={{ fontSize: '0.68rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Shield size={11} /> Cifrado en Servidor
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={config.secretReference}
                        onChange={e => setConfig(prev => ({ ...prev, secretReference: e.target.value.trim() }))}
                        placeholder={config.provider === 'payphone' ? 'env://PAYPHONE_SECRET' : 'env://KUSHKI_SECRET'}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: '8px',
                          background: 'rgba(8, 8, 12, 0.85)',
                          border: '1px solid rgba(229, 181, 79, 0.22)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono, monospace)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Solo viaja la <strong style={{ color: 'var(--brand-gold)' }}>referencia interna</strong>. La clave privada bancaria nunca se expone en la web.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Si está en Soporte Asistido */}
          {config.paymentMode === 'ASSISTED_GATEWAY' && (
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(14, 14, 21, 0.95) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Headphones size={20} color="#38bdf8" />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Acompañamiento VIP de Configuración
                </h4>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 14px 0' }}>
                Si tu discoteca ya trabaja con otra pasarela bancaria (Datafast, PlacetoPay, Nuvei, Stripe) o necesitas ayuda para tramitar tus credenciales comerciales con Kushki o PayPhone:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#38bdf8" />
                  <span>Un especialista de NIGHTFLOW se conecta contigo para validar el contrato bancario.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#38bdf8" />
                  <span>Configuramos las llaves encriptadas y webhooks sin que tengas que programar nada.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#38bdf8" />
                  <span>Hacemos pruebas de cobro reales de $1.00 para verificar que el dinero entra a tu cuenta bancaria.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Sincronización Webhook y Ciclo de Cobro VIP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Tarjeta de Sincronización Automática (Webhook) */}
          {config.paymentMode === 'CLIENT_GATEWAY' ? (
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(180deg, rgba(229, 181, 79, 0.08) 0%, rgba(14, 14, 21, 0.95) 100%)',
                border: '1px solid rgba(229, 181, 79, 0.28)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--brand-gold)" />
                  <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Sincronización Automática de Pagos
                  </h3>
                </div>

                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(229, 181, 79, 0.12)',
                    color: 'var(--brand-gold)',
                    border: '1px solid rgba(229, 181, 79, 0.3)',
                  }}
                >
                  NOTIFICACIÓN EN VIVO
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                Copia este enlace y pégalo en la sección de <strong>Webhooks</strong> de tu consola de {providerLabel} para que Nightflow reciba la confirmación instantánea cuando tu cliente pague:
              </p>

              {/* Bloque URL del Webhook */}
              <div
                style={{
                  borderRadius: '8px',
                  background: 'rgba(6, 8, 12, 0.95)',
                  border: '1px solid rgba(229, 181, 79, 0.25)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(229, 181, 79, 0.18)',
                    color: 'var(--brand-gold)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  POST
                </span>

                <code
                  style={{
                    fontSize: '0.77rem',
                    color: '#f5d38a',
                    wordBreak: 'break-all',
                    flex: 1,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {webhookUrl}
                </code>

                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: copiedWebhook ? 'rgba(34, 197, 94, 0.2)' : 'rgba(229, 181, 79, 0.12)',
                    color: copiedWebhook ? '#4ade80' : 'var(--brand-gold)',
                    border: '1px solid',
                    borderColor: copiedWebhook ? '#4ade80' : 'rgba(229, 181, 79, 0.3)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedWebhook ? '¡Copiado!' : 'Copiar URL'}</span>
                </button>
              </div>

              {/* Botón desplegable para ver detalles técnicos (evita asustar al dueño) */}
              <button
                type="button"
                onClick={() => setShowTechDetails(prev => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: showTechDetails ? '12px' : 0,
                }}
              >
                <span>{showTechDetails ? 'Ocultar especificaciones técnicas' : 'Ver especificaciones técnicas de seguridad (para ingenieros)'}</span>
                {showTechDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showTechDetails && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#e2e8f0' }}>
                    <CheckCircle2 size={13} color="#4ade80" style={{ flexShrink: 0 }} />
                    <span><strong>Firma Criptográfica:</strong> HMAC-SHA256 estricto sobre cuerpo crudo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#e2e8f0' }}>
                    <CheckCircle2 size={13} color="#4ade80" style={{ flexShrink: 0 }} />
                    <span><strong>Anti-Replay:</strong> Ventana de timestamp estricta de 300 segundos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#e2e8f0' }}>
                    <CheckCircle2 size={13} color="#4ade80" style={{ flexShrink: 0 }} />
                    <span><strong>Idempotencia:</strong> Clave única para evitar duplicidades de cobro</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Landmark size={18} color="#4ade80" />
                <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Flujo de Cobro Presencial
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                En esta modalidad tus clientes reservan desde su móvil y el cobro se realiza directamente en tu negocio al ingresar.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontWeight: 800, fontSize: '0.7rem' }}>1</div>
                  <span>Cliente elige mesa VIP y número de acompañantes.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontWeight: 800, fontSize: '0.7rem' }}>2</div>
                  <span>Mesa queda bloqueada por 12 min en el plano de la sala.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontWeight: 800, fontSize: '0.7rem' }}>3</div>
                  <span>Cliente recibe Pase VIP QR Black Card en su teléfono.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontWeight: 800, fontSize: '0.7rem' }}>4</div>
                  <span>Portero o cajero valida el QR y cobra en tu datáfono habitual.</span>
                </div>
              </div>
            </div>
          )}

          {/* Card del Proceso Completo de Reserva VIP */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(180deg, rgba(14, 14, 21, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%)',
              border: '1px solid rgba(229, 181, 79, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowRight size={16} color="var(--brand-gold)" />
              <h4 className="font-brand" style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Ciclo de Seguridad &amp; Confirmación VIP
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {[
                {
                  step: '01',
                  title: 'Bloqueo Exclusivo de 12 Minutos',
                  desc: 'El cliente selecciona la mesa en la web y nadie más puede comprarla durante ese tiempo.',
                },
                {
                  step: '02',
                  title: 'Cobro Seguro Directo a tu Cuenta',
                  desc: 'El pago viaja encriptado y se deposita directamente en la cuenta bancaria de tu club.',
                },
                {
                  step: '03',
                  title: 'Emisión de Pase VIP Black Card',
                  desc: 'El cliente recibe su pase digital con código QR dinámico protegido contra capturas de pantalla.',
                },
                {
                  step: '04',
                  title: 'Check-in Ultra Rápido en Puerta',
                  desc: 'Tu personal escanea el pase en menos de 0.3 segundos desde su teléfono móvil.',
                },
              ].map((item, idx, arr) => (
                <div key={item.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(229, 181, 79, 0.15)',
                      border: '1px solid rgba(229, 181, 79, 0.35)',
                      color: 'var(--brand-gold)',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.title}</span>
                      {idx < arr.length - 1 && <ArrowRight size={11} color="rgba(229, 181, 79, 0.4)" />}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayManager;

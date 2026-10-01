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
} from 'lucide-react';
import { callFunctions } from '../../../lib/functionsClient';
import type { Club } from '../../../types';

interface Props {
  activeClub: Club;
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

export const PaymentGatewayManager = ({ activeClub }: Props) => {
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

  const backendBaseUrl =
    typeof window !== 'undefined'
      ? (import.meta.env.VITE_BACKEND_URL as string) || window.location.origin
      : 'https://nightflow-vip.onrender.com';

  const webhookUrl = `${backendBaseUrl}/v1/payments/webhooks/kushki/${config.merchantId || activeClub.id}`;
  const kushkiConsoleUrl =
    config.environment === 'production'
      ? 'https://console.kushkipagos.com'
      : 'https://uat-console.kushkipagos.com';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSave = async () => {
    if (!config.merchantId.trim()) {
      setSaveError('El Merchant ID es obligatorio.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSavedSuccess(false);
    try {
      await callFunctions<PaymentAccountResponse>('configurePaymentAccount', {
        businessId: activeClub.id,
        paymentMode: config.paymentMode,
        provider: config.provider,
        environment: config.environment,
        merchantId: config.merchantId.trim(),
        ...(config.publicApiKey.trim() ? { publicApiKey: config.publicApiKey.trim() } : {}),
        ...(config.secretReference.trim() ? { secretReference: config.secretReference.trim() } : {}),
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

  const statusBadge = remoteStatus === 'configured'
    ? { label: 'CONFIGURADO EN SERVIDOR', color: '#4ade80' as const }
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
        {/* Subtle decorative glow effect */}
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
              Pasarela de Pagos & Cobros — Kushki Ecuador
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
            Arquitectura de <strong style={{ color: '#fff' }}>liquidación directa al club</strong>: los fondos pagados por anticipos y mesas VIP
            llegan directamente a la cuenta bancaria de <strong style={{ color: 'var(--brand-gold)' }}>{activeClub.name}</strong> a través de Kushki Ecuador.
            NIGHTFLOW VIP no interviene como captador de fondos.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href={kushkiConsoleUrl}
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
            <span>Consola Kushki {config.environment === 'sandbox' ? 'UAT' : 'Prod'}</span>
          </a>

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
            <span>{savedSuccess ? '¡Guardado en el servidor!' : saving ? 'Guardando…' : 'Guardar Cambios'}</span>
          </button>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '22px' }}>
        {/* Columna Izquierda: Modalidad y Credenciales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Selector de Modalidad */}
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
                Modalidad Operativa de Cobro para {activeClub.name}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                {
                  id: 'CLIENT_GATEWAY',
                  badge: 'RECOMENDADO ECUADOR',
                  badgeColor: '#4ade80',
                  title: 'CLIENT_GATEWAY (Kushki Directo al Club)',
                  desc: 'El club conecta sus credenciales oficiales de Kushki. Liquidación bancaria 100% directa sin intermediación financiera.',
                  icon: <Zap size={18} color="var(--brand-gold)" />,
                },
                {
                  id: 'ASSISTED_GATEWAY',
                  badge: 'ASISTENCIA TÉCNICA',
                  badgeColor: 'var(--brand-gold)',
                  title: 'ASSISTED_GATEWAY (Soporte NIGHTFLOW)',
                  desc: 'NIGHTFLOW VIP apoya técnicamente al club para habilitar y validar su cuenta Kushki, manteniendo la recaudación directa al club.',
                  icon: <ShieldCheck size={18} color="var(--brand-gold)" />,
                },
                {
                  id: 'PAY_AT_DOOR',
                  badge: 'PAGO PRESENCIAL',
                  badgeColor: '#a1a1aa',
                  title: 'PAY_AT_DOOR (Cobro en Puerta / Taquilla Física)',
                  desc: 'La reserva mantiene el stock bloqueado por 12 minutos. El cobro del anticipo o mesa se efectúa presencialmente en el acceso.',
                  icon: <Landmark size={18} color="#a1a1aa" />,
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

          {/* Formulario de Credenciales Kushki */}
          {config.paymentMode !== 'PAY_AT_DOOR' && (
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
                    PASO 02
                  </span>
                  <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Credenciales del Comercio Kushki
                  </h3>
                </div>

                {/* Switch Sandbox / Producción estilo pill */}
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
                    Sandbox UAT
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
                    Producción
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                    <span>Merchant ID (Identificador Público del Comercio)</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--brand-gold)' }}>Público</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={15} color="rgba(229, 181, 79, 0.5)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={config.merchantId}
                      onChange={e => setConfig(prev => ({ ...prev, merchantId: e.target.value.trim() }))}
                      placeholder="ej. merchant_barahunda_01"
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
                    Se utiliza para enrutar el webhook y vincular el token de WebCheckout.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                    <span>Public Merchant API Key (Kushki Frontend)</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--brand-gold)' }}>Token WebCheckout</span>
                  </label>
                  <input
                    type="text"
                    value={config.publicApiKey}
                    onChange={e => setConfig(prev => ({ ...prev, publicApiKey: e.target.value.trim() }))}
                    placeholder="pk_test_..."
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

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                    <span>Referencia Secreta (Vault Seguro de Servidor)</span>
                    <span style={{ fontSize: '0.68rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Shield size={11} /> Resuelta en el backend
                    </span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Lock size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={config.secretReference}
                        onChange={e => setConfig(prev => ({ ...prev, secretReference: e.target.value.trim() }))}
                        placeholder="env://KUSHKI_SECRET o projects/.../secrets/..."
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
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Solo se envía la <strong style={{ color: 'var(--brand-gold)' }}>referencia</strong> al secreto; la clave privada del comercio
                    <strong> nunca viaja al navegador</strong> ni se almacena en el cliente.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Webhook URL & Pipeline VIP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Card del Webhook — Elevated Developer Card */}
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
                  Webhook URL para la Consola Kushki
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
                RUTA DEL BACKEND
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
              Pega esta URL en tu <strong>Consola Kushki &gt; Configuración &gt; Webhooks</strong> para recibir las
              notificaciones de confirmación de pago:
            </p>

            {/* Terminal Style Endpoint Block */}
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
                {copiedWebhook ? '¡Copiado!' : 'Copiar URL'}
              </button>
            </div>

            {/* Verificación Criptográfica Chips */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                <span><strong>Firma Criptográfica:</strong> HMAC-SHA256 estricto sobre cuerpo crudo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                <span><strong>Anti-Replay:</strong> ventana de timestamp estricta de 300 segundos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                <span><strong>Idempotencia:</strong> hash SHA-256 único de eventId y txId</span>
              </div>
            </div>
          </div>

          {/* Card de Flujo Hosted Checkout — 4-Step VIP Pipeline */}
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
                Pipeline VIP de WebCheckout & Confirmación
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {[
                {
                  step: '01',
                  title: 'Hold Temporal de 12 Minutos',
                  desc: 'El cliente selecciona una mesa VIP en la PWA y se retiene el stock en Cloud Firestore.',
                },
                {
                  step: '02',
                  title: 'Sesión Firmada createPaymentSession',
                  desc: 'El backend genera el token de transacción seguro directo con la API de Kushki Ecuador.',
                },
                {
                  step: '03',
                  title: 'Hosted Checkout gestionado por Kushki',
                  desc: 'El cliente completa el pago en el entorno del PSP (los datos de tarjeta no tocan los servidores de Nightflow).',
                },
                {
                  step: '04',
                  title: 'Emisión de Pase Black Card VIP',
                  desc: 'Webhook validado por HMAC confirma la mesa y emite el QR rotativo Ed25519.',
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

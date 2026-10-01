import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import {
  EMPTY_LEGAL_PROFILE,
  validateLegalProfile,
  type LegalProfile,
  type LegalProfileFieldErrors
} from '../../../lib/legalProfile';
import type { Club } from '../../../types';

interface Props {
  activeClub: Club;
}

type SaveStatus = { kind: 'idle' } | { kind: 'synced' } | { kind: 'local' };

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '6px'
} as const;

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: '#fff',
  fontSize: '0.88rem',
  fontWeight: 600,
  fontFamily: 'inherit'
} as const;

const errorStyle = {
  display: 'block',
  marginTop: '5px',
  fontSize: '0.7rem',
  color: '#f87171'
} as const;

const inputWithBorder = (hasError: boolean) => ({
  ...inputStyle,
  border: hasError ? '1px solid #f87171' : inputStyle.border
});

export const LegalProfileForm = ({ activeClub }: Props) => {
  const store = useClubStore();
  const [values, setValues] = useState<LegalProfile>({
    ...EMPTY_LEGAL_PROFILE,
    ...activeClub.legal_profile
  });
  const [errors, setErrors] = useState<LegalProfileFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const updateField = (key: keyof LegalProfile, value: string) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateLegalProfile(values);
    setErrors(validation.errors);
    if (!validation.valid) {
      setStatus({ kind: 'idle' });
      return;
    }
    setSaving(true);
    setStatus({ kind: 'idle' });
    try {
      const normalized: LegalProfile = {
        legalName: values.legalName.trim(),
        ruc: values.ruc.trim(),
        taxAddress: values.taxAddress.trim(),
        supportEmail: values.supportEmail.trim().toLowerCase(),
        supportPhone: (values.supportPhone ?? '').trim(),
        refundPolicyUrl: (values.refundPolicyUrl ?? '').trim(),
        termsAndConditionsUrl: (values.termsAndConditionsUrl ?? '').trim()
      };
      const result = await store.updateClubLegalProfile(activeClub.id, normalized);
      setStatus({ kind: result });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        Identidad Legal & Fiscal del Club
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Estos datos identifican al <strong>organizador y vendedor real</strong> de las entradas y reservas.
        Se muestran en el checkout antes de cobrar: los precios, cobros y políticas de reembolso
        pertenecen exclusivamente a <strong>{activeClub.name}</strong>.
      </p>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        NIGHTFLOW VIP es únicamente el proveedor SaaS de infraestructura (encargado de tratamiento
        de datos). No procesa ni custodia fondos de los clubes.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle} htmlFor="legal-legalName">Razón social (SRI) *</label>
            <input
              id="legal-legalName"
              type="text"
              value={values.legalName}
              onChange={event => updateField('legalName', event.target.value)}
              placeholder="Ej. BARAHUNDA VIP DISCOTECA S.A.S."
              maxLength={120}
              style={inputWithBorder(Boolean(errors.legalName))}
            />
            {errors.legalName && <span style={errorStyle} role="alert">{errors.legalName}</span>}
          </div>

          <div>
            <label style={labelStyle} htmlFor="legal-ruc">RUC del establecimiento *</label>
            <input
              id="legal-ruc"
              type="text"
              inputMode="numeric"
              value={values.ruc}
              onChange={event => updateField('ruc', event.target.value.replace(/\D/g, '').slice(0, 13))}
              placeholder="13 dígitos (ej. 0992301287001)"
              style={{ ...inputWithBorder(Boolean(errors.ruc)), fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            />
            {errors.ruc && <span style={errorStyle} role="alert">{errors.ruc}</span>}
          </div>

          <div>
            <label style={labelStyle} htmlFor="legal-supportEmail">Correo oficial de soporte *</label>
            <input
              id="legal-supportEmail"
              type="email"
              value={values.supportEmail}
              onChange={event => updateField('supportEmail', event.target.value)}
              placeholder="reclamos@tudominio.com"
              style={inputWithBorder(Boolean(errors.supportEmail))}
            />
            {errors.supportEmail && <span style={errorStyle} role="alert">{errors.supportEmail}</span>}
          </div>

          <div>
            <label style={labelStyle} htmlFor="legal-supportPhone">Teléfono de soporte (opcional)</label>
            <input
              id="legal-supportPhone"
              type="tel"
              value={values.supportPhone ?? ''}
              onChange={event => updateField('supportPhone', event.target.value)}
              placeholder="+593 99 123 4567"
              style={inputWithBorder(Boolean(errors.supportPhone))}
            />
            {errors.supportPhone && <span style={errorStyle} role="alert">{errors.supportPhone}</span>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="legal-taxAddress">Dirección tributaria registrada *</label>
            <input
              id="legal-taxAddress"
              type="text"
              value={values.taxAddress}
              onChange={event => updateField('taxAddress', event.target.value)}
              placeholder="Av. Amazonas 1234, Quito, Pichincha"
              maxLength={200}
              style={inputWithBorder(Boolean(errors.taxAddress))}
            />
            {errors.taxAddress && <span style={errorStyle} role="alert">{errors.taxAddress}</span>}
          </div>

          <div>
            <label style={labelStyle} htmlFor="legal-terms">URL de Términos y Condiciones del club</label>
            <input
              id="legal-terms"
              type="url"
              value={values.termsAndConditionsUrl ?? ''}
              onChange={event => updateField('termsAndConditionsUrl', event.target.value)}
              placeholder="https://tudominio.com/terminos"
              style={inputWithBorder(Boolean(errors.termsAndConditionsUrl))}
            />
            {errors.termsAndConditionsUrl && <span style={errorStyle} role="alert">{errors.termsAndConditionsUrl}</span>}
          </div>

          <div>
            <label style={labelStyle} htmlFor="legal-refunds">URL de Política de Devoluciones</label>
            <input
              id="legal-refunds"
              type="url"
              value={values.refundPolicyUrl ?? ''}
              onChange={event => updateField('refundPolicyUrl', event.target.value)}
              placeholder="https://tudominio.com/reembolsos"
              style={inputWithBorder(Boolean(errors.refundPolicyUrl))}
            />
            {errors.refundPolicyUrl && <span style={errorStyle} role="alert">{errors.refundPolicyUrl}</span>}
          </div>
        </div>

        {status.kind === 'synced' && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#86efac',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={16} />
            Guardado y sincronizado con la nube. El checkout mostrará estos datos en todos los dispositivos.
          </div>
        )}

        {status.kind === 'local' && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              color: '#fde68a',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            Guardado solo en este dispositivo: el negocio aún no está aprovisionado en la nube o el
            servicio no respondió. Los datos se sincronizarán cuando el club exista como tenant activo.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} />
            Los campos con * son obligatorios. El RUC se valida con el dígito verificador oficial del SRI.
          </span>
          <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}>
            {saving ? <Loader2 size={15} /> : <Save size={15} />}
            {saving ? 'Guardando…' : 'Guardar identidad legal'}
          </button>
        </div>
      </form>
    </div>
  );
};

import type { Club } from '../types';

/**
 * Identidad legal del negocio (AGENTS.md Fase B).
 * Validadores espejo de functions/src/legalProfile.ts para que el formulario
 * del panel admin rechace datos inválidos antes de llamar al servidor.
 */

export type LegalProfile = NonNullable<Club['legal_profile']>;

export interface LegalProfileFieldErrors {
  legalName?: string;
  ruc?: string;
  taxAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  refundPolicyUrl?: string;
  termsAndConditionsUrl?: string;
}

const NATURAL_COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];
const PUBLIC_ENTITY_COEFFICIENTS = [3, 2, 7, 6, 5, 4, 3, 2];
const PRIVATE_COMPANY_COEFFICIENTS = [4, 3, 2, 7, 6, 5, 4, 3, 2];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ABSOLUTE_URL_PATTERN = /^https?:\/\/\S+$/i;

export const EMPTY_LEGAL_PROFILE: LegalProfile = {
  legalName: '',
  ruc: '',
  taxAddress: '',
  supportEmail: '',
  supportPhone: '',
  refundPolicyUrl: '',
  termsAndConditionsUrl: ''
};

/**
 * Valida la estructura matemática de un RUC ecuatoriano de 13 dígitos
 * (dígito verificador oficial; no consulta el SRI):
 *  - Tercer dígito 0-5: persona natural, módulo 10, verificador en posición 10.
 *  - Tercer dígito 6: sociedad pública, módulo 11, verificador en posición 9.
 *  - Tercer dígito 9: sociedad privada / extranjero, módulo 11, verificador en posición 10.
 *  - Tercer dígito 7 u 8: códigos no asignados por el SRI.
 */
export function isValidEcuadorRuc(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false;
  const province = Number(ruc.slice(0, 2));
  if (province < 1 || province > 24) return false;
  const contributorType = Number(ruc[2]);
  if (contributorType <= 5) {
    let sum = 0;
    for (let index = 0; index < NATURAL_COEFFICIENTS.length; index += 1) {
      const coefficient = NATURAL_COEFFICIENTS[index] ?? 0;
      let product = Number(ruc.charAt(index)) * coefficient;
      if (product > 9) product -= 9;
      sum += product;
    }
    const digit = 10 - (sum % 10);
    return Number(ruc.charAt(9)) === (digit === 10 ? 0 : digit);
  }
  if (contributorType === 6) {
    let sum = 0;
    for (let index = 0; index < PUBLIC_ENTITY_COEFFICIENTS.length; index += 1) {
      sum += Number(ruc.charAt(index)) * (PUBLIC_ENTITY_COEFFICIENTS[index] ?? 0);
    }
    const remainder = sum % 11;
    const digit = remainder === 0 ? 0 : 11 - remainder;
    return digit <= 9 && Number(ruc.charAt(8)) === digit;
  }
  if (contributorType === 9) {
    let sum = 0;
    for (let index = 0; index < PRIVATE_COMPANY_COEFFICIENTS.length; index += 1) {
      sum += Number(ruc.charAt(index)) * (PRIVATE_COMPANY_COEFFICIENTS[index] ?? 0);
    }
    const remainder = sum % 11;
    const digit = remainder === 0 ? 0 : 11 - remainder;
    return digit <= 9 && Number(ruc.charAt(9)) === digit;
  }
  return false;
}

export function validateLegalProfile(values: LegalProfile): {
  errors: LegalProfileFieldErrors;
  valid: boolean;
} {
  const errors: LegalProfileFieldErrors = {};

  const legalName = (values.legalName ?? '').trim();
  if (legalName.length < 3 || legalName.length > 120) {
    errors.legalName = 'Ingresa la razón social completa (entre 3 y 120 caracteres).';
  }

  const ruc = (values.ruc ?? '').trim();
  if (!isValidEcuadorRuc(ruc)) {
    errors.ruc = 'RUC inválido: deben ser 13 dígitos con dígito verificador correcto (provincia 01-24).';
  }

  const taxAddress = (values.taxAddress ?? '').trim();
  if (taxAddress.length < 3 || taxAddress.length > 200) {
    errors.taxAddress = 'Ingresa la dirección tributaria registrada (entre 3 y 200 caracteres).';
  }

  const supportEmail = (values.supportEmail ?? '').trim();
  if (!EMAIL_PATTERN.test(supportEmail)) {
    errors.supportEmail = 'Ingresa un correo válido para reclamos y devoluciones.';
  }

  const supportPhone = (values.supportPhone ?? '').trim();
  if (supportPhone) {
    const digits = supportPhone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      errors.supportPhone = 'Teléfono inválido: debe tener entre 8 y 15 dígitos.';
    }
  }

  const refundPolicyUrl = (values.refundPolicyUrl ?? '').trim();
  if (refundPolicyUrl && !ABSOLUTE_URL_PATTERN.test(refundPolicyUrl)) {
    errors.refundPolicyUrl = 'Debe ser una URL absoluta (https://…).';
  }

  const termsAndConditionsUrl = (values.termsAndConditionsUrl ?? '').trim();
  if (termsAndConditionsUrl && !ABSOLUTE_URL_PATTERN.test(termsAndConditionsUrl)) {
    errors.termsAndConditionsUrl = 'Debe ser una URL absoluta (https://…).';
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Convierte el subdocumento Firestore businesses/{id}/public/legalProfile en un
 * perfil de club. Devuelve null si el documento está incompleto o el RUC no
 * supera la validación estructural (defensa ante documentos alterados).
 */
export function parseLegalProfileDocument(value: unknown): LegalProfile | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const legalName = optionalText(record.legalName);
  const ruc = optionalText(record.ruc);
  const taxAddress = optionalText(record.taxAddress);
  const supportEmail = optionalText(record.supportEmail);
  if (!legalName || !ruc || !taxAddress || !supportEmail) return null;
  if (!isValidEcuadorRuc(ruc)) return null;
  return {
    legalName,
    ruc,
    taxAddress,
    supportEmail,
    supportPhone: optionalText(record.supportPhone),
    refundPolicyUrl: optionalText(record.refundPolicyUrl),
    termsAndConditionsUrl: optionalText(record.termsAndConditionsUrl)
  };
}

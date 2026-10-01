import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_LEGAL_PROFILE,
  isValidEcuadorRuc,
  parseLegalProfileDocument,
  validateLegalProfile
} from '../src/lib/legalProfile.ts';

const VALID_PROFILE = {
  legalName: 'BARAHUNDA VIP DISCOTECA S.A.S.',
  ruc: '0992301287001',
  taxAddress: 'Av. Amazonas 1234 y Naciones Unidas, Quito',
  supportEmail: 'reclamos@barahunda.club',
  supportPhone: '+593 99 123 4567',
  refundPolicyUrl: 'https://barahunda.club/reembolsos',
  termsAndConditionsUrl: 'https://barahunda.club/terminos'
};

describe('Fase B — Validadores de identidad legal (checkout)', () => {
  it('valida el dígito verificador del RUC ecuatoriano', () => {
    assert.equal(isValidEcuadorRuc('0926687856001'), true, 'persona natural');
    assert.equal(isValidEcuadorRuc('1768181150001'), true, 'sociedad pública');
    assert.equal(isValidEcuadorRuc('0992301287001'), true, 'sociedad privada');

    assert.equal(isValidEcuadorRuc('0992301280001'), false, 'verificador incorrecto');
    assert.equal(isValidEcuadorRuc('09266878560011'), false, 'longitud 14');
    assert.equal(isValidEcuadorRuc('092668785600'), false, 'longitud 12');
    assert.equal(isValidEcuadorRuc('2512345678001'), false, 'provincia inválida');
    assert.equal(isValidEcuadorRuc('1771234567001'), false, 'tercer dígito 7 no asignado');
    assert.equal(isValidEcuadorRuc('1781234567001'), false, 'tercer dígito 8 no asignado');
    assert.equal(isValidEcuadorRuc('not-a-ruc'), false, 'no numérico');
  });

  it('acepta un perfil legal completo', () => {
    const { valid, errors } = validateLegalProfile(VALID_PROFILE);
    assert.equal(valid, true, JSON.stringify(errors));
    assert.deepEqual(errors, {});
  });

  it('marca cada campo obligatorio inválido', () => {
    const { valid, errors } = validateLegalProfile({
      ...EMPTY_LEGAL_PROFILE,
      legalName: 'AB',
      ruc: '1234567890123',
      taxAddress: 'x',
      supportEmail: 'no-es-correo'
    });
    assert.equal(valid, false);
    assert.match(errors.legalName ?? '', /razón social/);
    assert.match(errors.ruc ?? '', /RUC inválido/);
    assert.match(errors.taxAddress ?? '', /dirección tributaria/);
    assert.match(errors.supportEmail ?? '', /correo válido/);
  });

  it('valida formatos opcionales de teléfono y URL', () => {
    const { valid, errors } = validateLegalProfile({
      ...VALID_PROFILE,
      supportPhone: '123',
      refundPolicyUrl: 'politicas/sin-esquema',
      termsAndConditionsUrl: 'ftp://insegura'
    });
    assert.equal(valid, false);
    assert.match(errors.supportPhone ?? '', /Teléfono inválido/);
    assert.match(errors.refundPolicyUrl ?? '', /URL absoluta/);
    assert.match(errors.termsAndConditionsUrl ?? '', /URL absoluta/);
  });

  it('descarta documentos públicos incompletos o con RUC alterado', () => {
    assert.equal(parseLegalProfileDocument(null), null);
    assert.equal(parseLegalProfileDocument('texto'), null);
    assert.equal(parseLegalProfileDocument({ legalName: 'Solo nombre' }), null);
    assert.equal(
      parseLegalProfileDocument({ ...VALID_PROFILE, ruc: '0992301280001' }),
      null,
      'RUC con verificador incorrecto no debe hidratarse'
    );

    const parsed = parseLegalProfileDocument({ ...VALID_PROFILE, refundPolicyUrl: null });
    assert.ok(parsed);
    assert.equal(parsed.legalName, VALID_PROFILE.legalName);
    assert.equal(parsed.ruc, VALID_PROFILE.ruc);
    assert.equal(parsed.refundPolicyUrl, undefined, 'null de Firestore se convierte en undefined');
  });
});

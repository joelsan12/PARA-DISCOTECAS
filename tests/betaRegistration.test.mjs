import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRegisterBetaInput, normalizePlanId, BETA_VIP_FEATURES } from '../functions/lib/betaRegistration.js';
import { sendWelcomeCredentialsEmail } from '../functions/lib/email.js';

describe('Beta Registration & Instant Provisioning Suite', () => {
  describe('normalizePlanId', () => {
    it('normaliza aliases de beta y pro a beta_vip canónico con 13 features', () => {
      assert.equal(normalizePlanId('Club Pro'), 'beta_vip');
      assert.equal(normalizePlanId('Beta Privada'), 'beta_vip');
      assert.equal(normalizePlanId('Beta Privada VIP'), 'beta_vip');
      assert.equal(normalizePlanId('beta'), 'beta_vip');
      assert.equal(normalizePlanId(undefined), 'beta_vip');
      assert.equal(normalizePlanId(''), 'beta_vip');
      assert.equal(BETA_VIP_FEATURES.length, 13);
      assert.ok(BETA_VIP_FEATURES.includes('ADVANCED_ANALYTICS'));
      assert.ok(BETA_VIP_FEATURES.includes('FLOOR_PLAN'));
      assert.ok(BETA_VIP_FEATURES.includes('LIVE_FLOOR_OPS'));
    });

    it('respeta planes explícitos no beta', () => {
      assert.equal(normalizePlanId('enterprise'), 'enterprise');
      assert.equal(normalizePlanId('Plan Empresarial'), 'enterprise');
      assert.equal(normalizePlanId('Plan Básico'), 'basic');
    });
  });
  describe('parseRegisterBetaInput', () => {
    it('valida y normaliza un payload completo de registro beta', () => {
      const input = {
        clubName: '  Sensorial VIP Club  ',
        city: '  Quito  ',
        ownerName: '  Carlos Ramos  ',
        email: '  Carlos@Sensorial.VIP  ',
        whatsapp: '  +593 99 123 4567  ',
        plan: '  Club Pro  ',
        source: '  /software  '
      };

      const parsed = parseRegisterBetaInput(input);
      assert.equal(parsed.clubName, 'Sensorial VIP Club');
      assert.equal(parsed.city, 'Quito');
      assert.equal(parsed.ownerName, 'Carlos Ramos');
      assert.equal(parsed.email, 'carlos@sensorial.vip');
      assert.equal(parsed.whatsapp, '+593 99 123 4567');
      assert.equal(parsed.plan, 'Club Pro');
      assert.equal(parsed.source, '/software');
    });

    it('asigna valores por defecto para plan y source cuando se omiten', () => {
      const input = {
        clubName: 'Discoteca Paradiso',
        city: 'Guayaquil',
        ownerName: 'Andrea Torres',
        email: 'andrea@paradiso.ec',
        whatsapp: '+593 98 765 4321'
      };

      const parsed = parseRegisterBetaInput(input);
      assert.equal(parsed.plan, 'Club Pro');
      assert.equal(parsed.source, '/software');
    });

    it('falla con error cuando falta el clubName', () => {
      assert.throws(() => {
        parseRegisterBetaInput({
          clubName: '',
          city: 'Quito',
          ownerName: 'Carlos',
          email: 'carlos@club.com',
          whatsapp: '+593 99 123 4567'
        });
      }, /clubName/);
    });

    it('falla con error cuando el correo es inválido', () => {
      assert.throws(() => {
        parseRegisterBetaInput({
          clubName: 'Club VIP',
          city: 'Quito',
          ownerName: 'Carlos',
          email: 'no-es-un-correo',
          whatsapp: '+593 99 123 4567'
        });
      }, /email/);
    });

    it('falla con error cuando el whatsapp es demasiado corto', () => {
      assert.throws(() => {
        parseRegisterBetaInput({
          clubName: 'Club VIP',
          city: 'Quito',
          ownerName: 'Carlos',
          email: 'carlos@club.com',
          whatsapp: '123'
        });
      }, /whatsapp/);
    });
  });

  describe('sendWelcomeCredentialsEmail', () => {
    it('ejecuta de forma fail-safe sin arrojar excepción cuando no hay proveedor configurado', async () => {
      const result = await sendWelcomeCredentialsEmail({
        to: 'tester@example.com',
        ownerName: 'Juan Pérez',
        clubName: 'Club Neón VIP',
        city: 'Cuenca',
        tempPassword: 'mock-temp-password',
        adminUrl: 'https://nightflow-admin.web.app',
        brandUrl: 'https://nightflow-vip.web.app/negocio/club-neon-vip'
      });

      assert.equal(typeof result.sent, 'boolean');
      // En entorno de prueba sin RESEND_API_KEY, sent debe ser false y no lanzar error
      if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
        assert.equal(result.sent, false);
      }
    });
  });
});

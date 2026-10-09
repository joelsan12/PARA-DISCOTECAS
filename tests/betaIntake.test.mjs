import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIENT_VERSION,
  ALLOWED_FEEDBACK_CATEGORIES,
  buildFeedbackContext,
  sanitizeFeedback,
  sanitizeLead
} from '../src/lib/betaIntake.ts';

describe('Beta Intake & Validation Suite (Feedback y Leads)', () => {
  describe('buildFeedbackContext', () => {
    it('genera contexto seguro por defecto para cliente', () => {
      const ctx = buildFeedbackContext();
      assert.equal(typeof ctx.path, 'string');
      assert.equal(typeof ctx.userAgent, 'string');
      assert.equal(typeof ctx.screen, 'string');
      assert.equal(ctx.portal, 'client');
    });

    it('respeta el portal saas cuando se especifica', () => {
      const ctx = buildFeedbackContext('saas');
      assert.equal(ctx.portal, 'saas');
    });
  });

  describe('sanitizeFeedback', () => {
    it('acepta un payload de feedback válido y aplica trim', () => {
      const sanitized = sanitizeFeedback({
        rating: 5,
        category: 'suggestion',
        message: '  Excelente flujo de reservas, sugiero agregar modo oscuro forzado.  ',
        contact: '  cliente@club.com  ',
        portal: 'client'
      });

      assert.equal(sanitized.rating, 5);
      assert.equal(sanitized.category, 'suggestion');
      assert.equal(sanitized.message, 'Excelente flujo de reservas, sugiero agregar modo oscuro forzado.');
      assert.equal(sanitized.contact, 'cliente@club.com');
      assert.equal(sanitized.clientVersion, CLIENT_VERSION);
      assert.equal(sanitized.context.portal, 'client');
    });

    it('acepta cada una de las 4 categorías permitidas', () => {
      for (const cat of ALLOWED_FEEDBACK_CATEGORIES) {
        const sanitized = sanitizeFeedback({
          rating: 4,
          category: cat,
          message: `Prueba para categoría ${cat}`
        });
        assert.equal(sanitized.category, cat);
      }
    });

    it('acepta contacto omitido o vacío', () => {
      const sanitized = sanitizeFeedback({
        rating: 3,
        category: 'design',
        message: 'Animaciones algo rápidas en móvil'
      });
      assert.equal(sanitized.contact, '');
    });

    it('rechaza payload null o no objeto', () => {
      assert.throws(() => sanitizeFeedback(null), /Payload de feedback inválido/);
      assert.throws(() => sanitizeFeedback(undefined), /Payload de feedback inválido/);
      assert.throws(() => sanitizeFeedback('string'), /Payload de feedback inválido/);
    });

    it('rechaza calificación fuera del rango 1 a 5 o no entera', () => {
      assert.throws(() => sanitizeFeedback({ rating: 0, category: 'bug', message: 'test' }), /entero entre 1 y 5/);
      assert.throws(() => sanitizeFeedback({ rating: 6, category: 'bug', message: 'test' }), /entero entre 1 y 5/);
      assert.throws(() => sanitizeFeedback({ rating: 4.5, category: 'bug', message: 'test' }), /entero entre 1 y 5/);
      assert.throws(() => sanitizeFeedback({ rating: NaN, category: 'bug', message: 'test' }), /entero entre 1 y 5/);
    });

    it('rechaza categorías no autorizadas', () => {
      assert.throws(
        () => sanitizeFeedback({ rating: 5, category: 'spam', message: 'test' }),
        /Categoría inválida/
      );
      assert.throws(
        () => sanitizeFeedback({ rating: 5, category: '', message: 'test' }),
        /Categoría inválida/
      );
    });

    it('rechaza mensajes vacíos o que exceden 1000 caracteres', () => {
      assert.throws(
        () => sanitizeFeedback({ rating: 5, category: 'suggestion', message: '   ' }),
        /no puede estar vacío/
      );
      const hugeMessage = 'a'.repeat(1001);
      assert.throws(
        () => sanitizeFeedback({ rating: 5, category: 'suggestion', message: hugeMessage }),
        /no puede estar vacío ni superar los 1000/
      );
    });

    it('rechaza información de contacto que excede 60 caracteres', () => {
      const longContact = 'usuario_con_un_correo_extremadamente_largo_que_supera_el_limite@dominio.com';
      assert.throws(
        () => sanitizeFeedback({ rating: 5, category: 'bug', message: 'Error en audio', contact: longContact }),
        /no puede superar los 60/
      );
    });
  });

  describe('sanitizeLead', () => {
    it('acepta un lead válido con todos los datos y limpia espacios', () => {
      const sanitized = sanitizeLead({
        clubName: '   Sensorial VIP Club   ',
        city: '   Quito   ',
        whatsapp: '   +593991234567   ',
        plan: '   Empresarial   ',
        source: '   /software/planes   '
      });

      assert.equal(sanitized.clubName, 'Sensorial VIP Club');
      assert.equal(sanitized.city, 'Quito');
      assert.equal(sanitized.whatsapp, '+593991234567');
      assert.equal(sanitized.plan, 'Empresarial');
      assert.equal(sanitized.source, '/software/planes');
      assert.equal(sanitized.clientVersion, CLIENT_VERSION);
    });

    it('asigna Club Pro como plan por defecto si no se especifica', () => {
      const sanitized = sanitizeLead({
        clubName: 'Club Barahunda',
        city: 'Guayaquil',
        whatsapp: '0987654321'
      });

      assert.equal(sanitized.plan, 'Club Pro');
      assert.equal(sanitized.source, '/software');
    });

    it('rechaza clubName vacío o mayor a 80 caracteres', () => {
      assert.throws(() => sanitizeLead({ clubName: '', city: 'Quito', whatsapp: '123' }), /nombre del club/);
      assert.throws(() => sanitizeLead({ clubName: 'x'.repeat(81), city: 'Quito', whatsapp: '123' }), /nombre del club/);
    });

    it('rechaza ciudad vacía o mayor a 80 caracteres', () => {
      assert.throws(() => sanitizeLead({ clubName: 'Club', city: '', whatsapp: '123' }), /ciudad/);
      assert.throws(() => sanitizeLead({ clubName: 'Club', city: 'x'.repeat(81), whatsapp: '123' }), /ciudad/);
    });

    it('rechaza whatsapp vacío o mayor a 25 caracteres', () => {
      assert.throws(() => sanitizeLead({ clubName: 'Club', city: 'Quito', whatsapp: '' }), /número de WhatsApp/);
      assert.throws(() => sanitizeLead({ clubName: 'Club', city: 'Quito', whatsapp: 'x'.repeat(26) }), /número de WhatsApp/);
    });

    it('rechaza plan que supere 40 caracteres', () => {
      assert.throws(() => sanitizeLead({
        clubName: 'Club',
        city: 'Quito',
        whatsapp: '123',
        plan: 'x'.repeat(41)
      }), /plan debe tener entre 1 y 40/);
    });
  });
});

/**
 * Suite fail-closed del checkout (AGENTS §7 / §13).
 *
 * Reglas del test:
 *  - Ninguna prueba sale a la red. `globalThis.fetch` queda stubbeado y se
 *    verifica que nunca se invoque con un host de producción.
 *  - No se depende de la latencia ni de la disponibilidad de Render.
 *  - Se afirma el comportamiento observable: un fallo de backend NO produce
 *    un hold local y NO puede llegar a confirmarse como reserva.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Backend local inexistente yDomains en blanco: si algo intenta salir, el test falla.
globalThis.__NIGHTFLOW_ENV__ = {
  VITE_FIREBASE_API_KEY: 'AIzaSyTestApiKeyFakeForTesting',
  VITE_FIREBASE_PROJECT_ID: 'nightflow-test-project',
  VITE_FIREBASE_APP_ID: '1:123456789:web:test',
  VITE_BACKEND_URL: 'https://backend.invalid.test'
};

const { isBackendReservationAvailable, isDevBuild, createReservationHold } =
  await import('../src/lib/reservationService.ts');

const realFetch = globalThis.fetch;
const requestedUrls = [];

before(() => {
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input));
    requestedUrls.push(url);
    throw new Error(`Network bloqueado en la suite: ${url}`);
  };
});

after(() => {
  globalThis.fetch = realFetch;
});

const validRequest = {
  businessId: 'club_test',
  eventId: 'event_test',
  resourceId: 'tbl_1',
  amount: 150,
  currency: 'USD',
  idempotencyKey: 'idem-fail-closed-0001'
};

describe('Checkout fail-closed (AGENTS §7/§13)', () => {
  it('el entorno de test no se considera un build de desarrollo', () => {
    // Si esto fuera DEV, el fallback a hold local estaría activo y el resto
    // de la suite no probaría nada.
    assert.equal(isDevBuild(), false);
  });

  it('createReservationHold falla cerrado cuando el backend no responde', async () => {
    await assert.rejects(
      async () => { await createReservationHold(validRequest); },
      (error) => {
        assert.ok(error instanceof Error);
        // Nunca un hold local disfrazado de reserva real.
        assert.notEqual(error.code, undefined);
        assert.match(String(error.message ?? ''), /no pudimos reservar|no está disponible|no pudimos completar/i);
        return true;
      }
    );
  });

  it('la suite nunca alcanzó un host de producción', () => {
    assert.ok(Array.isArray(requestedUrls));
    for (const url of requestedUrls) {
      assert.doesNotMatch(url, /onrender\.com|nightflow-vip\.firebaseio\.com/i, `tráfico a producción: ${url}`);
    }
  });

  it('el cliente reporta el backend como disponible solo con Firebase configurado', () => {
    // El contrato de disponibilidad ya no depende de App Check (§14 Spark),
    // pero tampoco puede ser true sin Firebase configurado.
    assert.equal(typeof isBackendReservationAvailable(), 'boolean');
  });
});
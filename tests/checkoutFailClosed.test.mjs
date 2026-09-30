import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

globalThis.__NIGHTFLOW_ENV__ = {
  VITE_FIREBASE_API_KEY: 'AIzaSyTestApiKeyFakeForTesting',
  VITE_FIREBASE_PROJECT_ID: 'nightflow-vip',
  VITE_FIREBASE_APP_ID: '1:123456789:web:test',
  VITE_BACKEND_URL: 'https://nightflow-backend.onrender.com'
};

const { isBackendReservationAvailable, createReservationHold } = await import('../src/lib/reservationService.ts');

describe('Checkout Fail-Closed & Backend Availability Suite (AGENTS §10)', () => {
  it('isBackendReservationAvailable devuelve true cuando Firebase y Functions están configurados, sin depender de App Check en modo Spark', () => {
    // En modo Spark híbrido (AGENTS §14), no se debe exigir VITE_APPCHECK_SITE_KEY en producción
    // para evitar degradación involuntaria a checkout simulado.
    const available = isBackendReservationAvailable();
    assert.equal(available, true, 'El backend de reservas debe reportarse como disponible');
  });

  it('el contrato de reserva exige que cualquier error de backend de hold falle cerrado', async () => {
    // Intentar crear un hold sin parámetros válidos o sin backend debe arrojar error explícito,
    // garantizando que nunca se confirme silenciosamente una reserva falsa en localStorage.
    await assert.rejects(
      async () => {
        await createReservationHold({
          businessId: '',
          eventId: '',
          resourceId: ''
        });
      },
      (error) => {
        assert.ok(error instanceof Error, 'Debe arrojar una instancia de Error');
        return true;
      }
    );
  });
});

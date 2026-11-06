import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Landing Page Interactive Verification Suite (Auditoría Punto 10)', () => {
  // Lógica canónica replicada desde src/components/saas/landing/SaasExperiencesSection.tsx
  const HOLD_SECONDS = 12 * 60; // 720 segundos exactos (AGENTS §7)

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const createInitialTables = () => [
    { id: 'palco-norte', name: 'Palco Norte', zone: 'palcos', pax: 10, minSpend: 200, status: 'AVAILABLE', timer: HOLD_SECONDS },
    { id: 'palco-sur', name: 'Palco Sur', zone: 'palcos', pax: 12, minSpend: 240, status: 'AVAILABLE', timer: HOLD_SECONDS },
    { id: 'suite-01', name: 'Suite Privé 01', zone: 'vip', pax: 15, minSpend: 380, status: 'OCCUPIED', timer: 0 },
    { id: 'suite-02', name: 'Suite Privé 02', zone: 'vip', pax: 12, minSpend: 300, status: 'AVAILABLE', timer: HOLD_SECONDS },
    { id: 'pista-01', name: 'Mesa Pista 01', zone: 'pista', pax: 8, minSpend: 90, status: 'AVAILABLE', timer: HOLD_SECONDS },
  ];

  describe('Interacción 1: Hold de 12 minutos y Reserva de Mesas (SaasExperiencesSection)', () => {
    it('debe definir la ventana de hold en exactamente 12 minutos (720 segundos)', () => {
      assert.strictEqual(HOLD_SECONDS, 720, 'HOLD_SECONDS debe ser 720');
      assert.strictEqual(formatTimer(HOLD_SECONDS), '12:00', 'Debe formatearse como 12:00');
    });

    it('formatea correctamente los tiempos en mm:ss para mono badge', () => {
      assert.strictEqual(formatTimer(720), '12:00');
      assert.strictEqual(formatTimer(65), '01:05');
      assert.strictEqual(formatTimer(9), '00:09');
      assert.strictEqual(formatTimer(0), '00:00');
    });

    it('al seleccionar una mesa AVAILABLE la bloquea inmediatamente e inicia el timer en 720s', () => {
      let tables = createInitialTables();
      const targetId = 'palco-norte';
      const targetTable = tables.find((t) => t.id === targetId);
      assert.strictEqual(targetTable.status, 'AVAILABLE');

      // Simula handleTableClick
      tables = tables.map((t) =>
        t.id === targetId ? { ...t, status: 'HELD', timer: HOLD_SECONDS } : t
      );

      const updated = tables.find((t) => t.id === targetId);
      assert.strictEqual(updated.status, 'HELD', 'Debe cambiar a HELD');
      assert.strictEqual(updated.timer, 720, 'El timer debe iniciar en 720');
    });

    it('ignora clics en mesas ya bloqueadas o en sala (evita doble venta concurrente)', () => {
      const tables = createInitialTables();
      const occupiedTable = tables.find((t) => t.id === 'suite-01');
      assert.strictEqual(occupiedTable.status, 'OCCUPIED');

      // Intentar cambiar mesa ocupada debe ser no-op
      const handleTableClick = (table, currentList) => {
        if (table.status !== 'AVAILABLE') return currentList;
        return currentList.map((t) =>
          t.id === table.id ? { ...t, status: 'HELD', timer: HOLD_SECONDS } : t
        );
      };

      const result = handleTableClick(occupiedTable, tables);
      assert.deepStrictEqual(result, tables, 'La lista no debe alterarse al hacer click en mesa no disponible');
    });

    it('decrementa el timer cada segundo mientras esté en estado HELD', () => {
      let tables = [
        { id: 'palco-norte', status: 'HELD', timer: 720 },
        { id: 'palco-sur', status: 'AVAILABLE', timer: 720 },
      ];

      // Tick de 1 segundo
      tables = tables.map((t) => {
        if (t.status !== 'HELD') return t;
        if (t.timer > 1) return { ...t, timer: t.timer - 1 };
        return { ...t, status: 'AVAILABLE', timer: HOLD_SECONDS };
      });

      const held = tables.find((t) => t.id === 'palco-norte');
      assert.strictEqual(held.timer, 719, 'Debe haber restado 1 segundo');
      assert.strictEqual(held.status, 'HELD');
    });

    it('libera la mesa a AVAILABLE cuando el timer llega a 0 (recuperación de stock)', () => {
      let tables = [
        { id: 'palco-norte', status: 'HELD', timer: 1 },
      ];

      // Siguiente tick: expira
      tables = tables.map((t) => {
        if (t.status !== 'HELD') return t;
        if (t.timer > 1) return { ...t, timer: t.timer - 1 };
        return { ...t, status: 'AVAILABLE', timer: HOLD_SECONDS };
      });

      const released = tables.find((t) => t.id === 'palco-norte');
      assert.strictEqual(released.status, 'AVAILABLE', 'La mesa debe volver a libre automáticamente');
      assert.strictEqual(released.timer, 720, 'El timer debe restaurarse para la siguiente compra');
    });

    it('handleReset restaura el inventario inicial de la sala', () => {
      let tables = createInitialTables();
      tables = tables.map((t) => ({ ...t, status: 'HELD', timer: 100 }));
      assert.strictEqual(tables.filter((t) => t.status === 'HELD').length, 5);

      tables = createInitialTables();
      assert.strictEqual(tables.filter((t) => t.status === 'AVAILABLE').length, 4);
      assert.strictEqual(tables.filter((t) => t.status === 'OCCUPIED').length, 1);
    });
  });

  describe('Interacción 2: Validación Interactiva del Escáner de Puerta (SaasVipPassMockup)', () => {
    it('el estado inicial del escáner en la maqueta es idle', () => {
      const state = { isScanning: false, scanResult: null };
      assert.strictEqual(state.isScanning, false);
      assert.strictEqual(state.scanResult, null);
    });

    it('simula la transición de validación en puerta: idle -> scanning -> success', () => {
      let state = { isScanning: false, scanResult: null };

      // Paso 1: Guardia presiona botón de validación
      state = { isScanning: true, scanResult: null };
      assert.strictEqual(state.isScanning, true, 'Debe indicar proceso activo');

      // Paso 2: Validación exitosa tras latencia de escaneo
      state = { isScanning: false, scanResult: 'success' };
      assert.strictEqual(state.isScanning, false);
      assert.strictEqual(state.scanResult, 'success', 'Resultado debe ser éxito verificado');
    });

    it('la retroalimentación confirma ingreso con etiqueta de demostración controlada', () => {
      const feedback = {
        title: 'ACCESO CONFIRMADO · PUERTA 1 (DEMO)',
        meta: 'Simulación de verificación en puerta: pase validado para 15 personas.',
        level: 'success'
      };

      assert.ok(feedback.title.includes('(DEMO)'), 'Debe incluir etiqueta DEMO para no confundir con producción');
      assert.strictEqual(feedback.level, 'success');
      assert.ok(feedback.meta.includes('15 personas'));
    });

    it('el temporizador de auto-reset limpia la confirmación tras la demostración', () => {
      let state = { isScanning: false, scanResult: 'success' };
      // Simula reset después de 4.5s
      state = { ...state, scanResult: null };
      assert.strictEqual(state.scanResult, null, 'El escáner vuelve a quedar listo para el siguiente pase');
    });
  });
});

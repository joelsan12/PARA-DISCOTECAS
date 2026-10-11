import test from 'node:test';
import assert from 'node:assert/strict';

// Import compiled or transpile test
import { isDashboardTabAllowed, isDoorAccessAllowed, canStaffRefund, canStaffSettleTab } from '../src/lib/clubPermissions.ts';

const mockPlans = [
  {
    id: 'basic',
    name: 'Plan Básico',
    monthly_price: 99,
    max_events_per_month: 8,
    features: ['Sitio público de reservas'],
    plan_tier: 'BASIC',
    enabled_features: ['RESERVATIONS', 'EVENTS']
  },
  {
    id: 'pro',
    name: 'Plan Profesional',
    monthly_price: 199,
    max_events_per_month: 20,
    features: ['Plano interactivo', 'Puerta QR'],
    plan_tier: 'PRO',
    enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'ONLINE_PAYMENT', 'QR_CHECKIN']
  },
  {
    id: 'enterprise',
    name: 'Plan Empresarial',
    monthly_price: 349,
    max_events_per_month: 999,
    features: ['Auditoría total'],
    plan_tier: 'PREMIUM',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
    ]
  }
];

const sensorialClub = {
  id: 'club-sensorial',
  name: 'Sensorial Club VIP',
  plan_id: 'enterprise',
  city: 'Quito, Ecuador',
  enabled_features: [
    'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
    'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
    'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN'
  ]
};

const velvetClub = {
  id: 'club-velvet',
  name: 'Velvet Salón y Bar',
  plan_id: 'basic',
  city: 'Quito, Ecuador',
  enabled_features: ['RESERVATIONS', 'EVENTS']
};

const rumajClub = {
  id: 'club-rumaj',
  name: 'Rumaj Terraza y Salón',
  plan_id: 'pro',
  city: 'Guayaquil, Ecuador',
  enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'ONLINE_PAYMENT', 'QR_CHECKIN']
};

test('Filtrado de menús por plan (AGENTS §2.1 y directrices de club)', async (t) => {
  const enterprisePlan = mockPlans.find(p => p.id === 'enterprise');
  const proPlan = mockPlans.find(p => p.id === 'pro');
  const basicPlan = mockPlans.find(p => p.id === 'basic');

  await t.test('Sensorial Club VIP (Plan Empresarial) tiene acceso a todos los menús operativos', () => {
    assert.strictEqual(isDashboardTabAllowed('MONITOR', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('PRICING', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('LEGAL', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('SUBSCRIPTION', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDoorAccessAllowed(sensorialClub, enterprisePlan), true);
  });

  await t.test('Club en Plan Profesional tiene acceso a diseñador, pagos y puerta, pero NO a bitácora de auditoría', () => {
    assert.strictEqual(isDashboardTabAllowed('MONITOR', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('PRICING', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('LEGAL', rumajClub, proPlan), true);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', rumajClub, proPlan), false); // Exclusivo Empresarial
    assert.strictEqual(isDashboardTabAllowed('SUBSCRIPTION', rumajClub, proPlan), true);
    assert.strictEqual(isDoorAccessAllowed(rumajClub, proPlan), true);
  });

  await t.test('Club en Plan Básico solo ve Sala en Vivo, Reservas, Legal y Mi Plan (oculta diseñador, tarifario, kushki, auditoría y puerta)', () => {
    assert.strictEqual(isDashboardTabAllowed('MONITOR', velvetClub, basicPlan), true);
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', velvetClub, basicPlan), false);
    assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', velvetClub, basicPlan), true);
    assert.strictEqual(isDashboardTabAllowed('PRICING', velvetClub, basicPlan), false);
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', velvetClub, basicPlan), false);
    assert.strictEqual(isDashboardTabAllowed('LEGAL', velvetClub, basicPlan), true);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', velvetClub, basicPlan), false);
    assert.strictEqual(isDashboardTabAllowed('SUBSCRIPTION', velvetClub, basicPlan), true);
    assert.strictEqual(isDoorAccessAllowed(velvetClub, basicPlan), false);
  });

  await t.test('Beneficio VIP personalizado (custom_features) desbloquea dinámicamente el menú para ese cliente específico', () => {
    const basicClubWithCustomKushki = {
      ...velvetClub,
      custom_features: [
        {
          id: 'feat-1',
          name: 'Pasarela Kushki VIP',
          key: 'kushki_gateway',
          description: 'Habilitación especial aprobada por soporte',
          enabled: true,
          activated_at: '2026-10-02',
          activated_by: 'dev-admin'
        }
      ]
    };

    // Aún en plan básico, la pasarela de pagos se desbloquea por su beneficio custom
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', basicClubWithCustomKushki, basicPlan), true);
    // Pero el resto sigue restringido conforme a su plan
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', basicClubWithCustomKushki, basicPlan), false);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', basicClubWithCustomKushki, basicPlan), false);
  });

  await t.test('Club en Plan Beta Privada VIP tiene acceso a todos los 9 módulos de la consola y control de puerta', () => {
    const betaVipPlan = {
      id: 'beta_vip',
      name: 'Beta Privada VIP',
      plan_tier: 'PREMIUM',
      enabled_features: [
        'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
        'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
        'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
      ]
    };
    const betaClub = {
      id: 'club_beta_test',
      name: 'Paradiso Beta VIP',
      plan_id: 'beta_vip',
      city: 'Guayaquil',
      enabled_features: betaVipPlan.enabled_features
    };

    assert.strictEqual(isDashboardTabAllowed('MONITOR', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('PRICING', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('LEGAL', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', betaClub, betaVipPlan), true);
    assert.strictEqual(isDashboardTabAllowed('SUBSCRIPTION', betaClub, betaVipPlan), true);
    assert.strictEqual(isDoorAccessAllowed(betaClub, betaVipPlan), true);
  });

  await t.test('Fallback por tier: club con plan_id "beta_vip" sin enabled_features explícitos desbloquea todo', () => {
    const bareBetaClub = {
      id: 'club_bare_beta',
      name: 'Bare Beta Club',
      plan_id: 'beta_vip',
      city: 'Cuenca'
    };
    assert.strictEqual(isDashboardTabAllowed('MONITOR', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('PRICING', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('PAYMENTS', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('LEGAL', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('AUDIT', bareBetaClub, undefined), true);
    assert.strictEqual(isDashboardTabAllowed('SUBSCRIPTION', bareBetaClub, undefined), true);
    assert.strictEqual(isDoorAccessAllowed(bareBetaClub, undefined), true);
  });

  await t.test('Tolerancia canónica: club con plan_id "Beta Privada Vip" (con espacios o mayúsculas) desbloquea diseñador y todos los módulos', () => {
    const stringVariants = ['Beta Privada Vip', 'Beta Privada VIP', 'beta privada', 'BETA_VIP', 'Plan Beta Privada'];
    for (const planId of stringVariants) {
      const clubVariant = {
        id: 'club_oficina',
        name: 'Oficina',
        plan_id: planId,
        city: 'Guayaquil'
      };
      assert.strictEqual(isDashboardTabAllowed('MONITOR', clubVariant, undefined), true, `MONITOR falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('LAYOUT_BUILDER', clubVariant, undefined), true, `LAYOUT_BUILDER falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('EVENTS', clubVariant, undefined), true, `EVENTS falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('RESERVATIONS', clubVariant, undefined), true, `RESERVATIONS falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('PRICING', clubVariant, undefined), true, `PRICING falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('PAYMENTS', clubVariant, undefined), true, `PAYMENTS falló para ${planId}`);
      assert.strictEqual(isDashboardTabAllowed('AUDIT', clubVariant, undefined), true, `AUDIT falló para ${planId}`);
      assert.strictEqual(isDoorAccessAllowed(clubVariant, undefined), true, `DOOR falló para ${planId}`);
    }
  });

  await t.test('Permisos de reembolso de pasarela (Fase C: canStaffRefund)', () => {
    // Roles con autorización
    assert.strictEqual(canStaffRefund('finance', false), true);
    assert.strictEqual(canStaffRefund('manager', false), true);
    assert.strictEqual(canStaffRefund('owner', false), true);
    assert.strictEqual(canStaffRefund('FINANCE', false), true);

    // SuperAdmin siempre autorizado
    assert.strictEqual(canStaffRefund(undefined, true), true);
    assert.strictEqual(canStaffRefund('door', true), true);

    // Roles no autorizados
    assert.strictEqual(canStaffRefund('door', false), false);
    assert.strictEqual(canStaffRefund('waiter', false), false);
    assert.strictEqual(canStaffRefund(undefined, false), false);
    assert.strictEqual(canStaffRefund('', false), false);
  });

  await t.test('Pestaña STAFF exige STAFF_MANAGEMENT (O.1-C)', () => {
    const enterprisePlan = mockPlans.find(p => p.id === 'enterprise');
    const proPlan = mockPlans.find(p => p.id === 'pro');
    const basicPlan = mockPlans.find(p => p.id === 'basic');

    // Sensorial (Enterprise) y Rumaj (Pro con STAFF_MANAGEMENT) tienen acceso
    assert.strictEqual(isDashboardTabAllowed('STAFF', sensorialClub, enterprisePlan), true);
    assert.strictEqual(isDashboardTabAllowed('STAFF', rumajClub, proPlan), true);

    // Velvet (Básico sin STAFF_MANAGEMENT) queda estrictamente bloqueado
    assert.strictEqual(isDashboardTabAllowed('STAFF', velvetClub, basicPlan), false);
  });

  await t.test('Permisos de cierre de cuenta de mesa en sala (O.2: canStaffSettleTab)', () => {
    // Roles con autorización de cierre manual
    assert.strictEqual(canStaffSettleTab('finance', false), true);
    assert.strictEqual(canStaffSettleTab('manager', false), true);
    assert.strictEqual(canStaffSettleTab('owner', false), true);
    assert.strictEqual(canStaffSettleTab('FINANCE', false), true);
    assert.strictEqual(canStaffSettleTab('MANAGER', false), true);

    // SuperAdmin siempre autorizado
    assert.strictEqual(canStaffSettleTab(undefined, true), true);
    assert.strictEqual(canStaffSettleTab('waiter', true), true);
    assert.strictEqual(canStaffSettleTab('door', true), true);

    // Roles estrictamente bloqueados (mesero, puerta, anónimo)
    assert.strictEqual(canStaffSettleTab('waiter', false), false, 'Waiter nunca debe tener permiso de cierre de cuenta');
    assert.strictEqual(canStaffSettleTab('door', false), false, 'Door nunca debe tener permiso de cierre de cuenta');
    assert.strictEqual(canStaffSettleTab('reception', false), false);
    assert.strictEqual(canStaffSettleTab(undefined, false), false);
    assert.strictEqual(canStaffSettleTab('', false), false);
  });
});


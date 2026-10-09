import test from 'node:test';
import assert from 'node:assert/strict';

// Import compiled or transpile test
import { isDashboardTabAllowed, isDoorAccessAllowed } from '../src/lib/clubPermissions.ts';

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
});

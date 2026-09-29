import type { Plan } from '../types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Plan Básico',
    monthly_price: 99,
    max_events_per_month: 8,
    features: [
      'Sitio público de reservas',
      'Formulario directo a WhatsApp',
      'Gestión de eventos',
      'Sin mapa interactivo (solo lista estándar)',
      'Soporte estándar'
    ],
    plan_tier: 'BASIC',
    enabled_features: ['RESERVATIONS', 'EVENTS']
  },
  {
    id: 'pro',
    name: 'Plan Profesional (recomendado)',
    monthly_price: 199,
    max_events_per_month: 20,
    features: [
      'Todo lo del plan básico',
      'Mapa visual interactivo con plantillas cenitales',
      'Editor de mesas y arquetipos arquitectónicos',
      'Solicitud de plano a medida por soporte',
      'Control de puerta con escáner QR',
      'Precios dinámicos por evento',
      'Bloqueo temporal de concurrencia (10 minutos)'
    ],
    plan_tier: 'PRO',
    enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'ONLINE_PAYMENT', 'QR_CHECKIN']
  },
  {
    id: 'enterprise',
    name: 'Plan Empresarial',
    monthly_price: 349,
    max_events_per_month: 999,
    features: [
      'Todo lo del plan profesional',
      'Plano cenital a medida modelado por soporte técnico',
      'Auditoría total en vivo y atención VIP',
      'Módulo de butacas y entradas generales',
      'Dominio personalizado',
      'Promotores múltiples y relaciones públicas',
      'Soporte VIP 24/7 con arquitecto dedicado'
    ],
    plan_tier: 'PREMIUM',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
    ]
  }
];

import type { Plan } from '../types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Lounge Free',
    description: 'Para bares, pubs y rooftops pequeños que están digitalizando sus reservas.',
    monthly_price: 0,
    annual_price: 0,
    max_events_per_month: 2,
    features: [
      'Hasta 8 mesas en sala',
      '2 eventos por mes',
      'Reservas enviadas al WhatsApp del club',
      '1 usuario administrador',
      'Soporte por correo electrónico'
    ],
    plan_tier: 'BASIC',
    enabled_features: ['RESERVATIONS', 'EVENTS']
  },
  {
    id: 'starter',
    name: 'Starter Club',
    description: 'Para discotecas en crecimiento que necesitan control de entradas con QR en puerta.',
    monthly_price: 5,
    annual_price: 50,
    max_events_per_month: 6,
    features: [
      'Hasta 16 mesas con plano cenital',
      '6 eventos por mes',
      '1 escáner de puerta QR PWA',
      'Holds automáticos de 12 minutos',
      '2 usuarios del personal',
      'Soporte estándar'
    ],
    plan_tier: 'BASIC',
    enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'QR_CHECKIN']
  },
  {
    id: 'club_pro',
    name: 'Club Pro',
    description: 'El estándar de la industria nocturna: anticipos bancarios directos y 4 puertas activas.',
    monthly_price: 15,
    annual_price: 150,
    max_events_per_month: 999,
    features: [
      'Hasta 45 mesas con editor de planos',
      'Eventos ilimitados todo el año',
      'Pasarela Kushki: anticipos directos a tu banco',
      '4 terminales de puerta simultáneas',
      'Reingreso con Passkey Biométrica',
      'Soporte prioritario WhatsApp'
    ],
    plan_tier: 'PRO',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'ONLINE_PAYMENT', 'QR_CHECKIN', 'STAFF_MANAGEMENT'
    ]
  },
  {
    id: 'black_vip',
    name: 'Black VIP',
    description: 'Macro-discotecas, cadenas de ocio, palcos y festivales multi-sala de alta escala.',
    monthly_price: 45,
    annual_price: 450,
    max_events_per_month: 999,
    features: [
      'Mesas ilimitadas (sin ningún tope)',
      'Soporte multi-sala (Rooftop, VIP, Main Room)',
      'Terminales de puerta ilimitadas',
      'Bitácora forense de auditoría en vivo',
      'SLA garantizado 99.9% a las 02:00 AM',
      'Atención 24/7 con ingeniero dedicado'
    ],
    plan_tier: 'PREMIUM',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
    ]
  },
  {
    id: 'beta_vip',
    name: 'Beta Privada VIP',
    description: 'Plan exclusivo de acceso anticipado para clubes fundadores con todas las capacidades desbloqueadas.',
    monthly_price: 0,
    annual_price: 0,
    max_events_per_month: 999,
    features: [
      'Acceso total a todos los módulos operativos (Early Access)',
      'Diseñador de planos y arquetipos arquitectónicos',
      'Cartelera y gestión de eventos en tiempo real',
      'Reservas y tarifario dinámico por evento',
      'Pasarela de pagos y depósitos en línea',
      'Control de acceso con escáner QR y passkeys',
      'Bitácora de auditoría y seguridad',
      'Soporte prioritario directo con fundadores'
    ],
    plan_tier: 'PREMIUM',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
    ]
  },
  // Compatibilidad legacy
  {
    id: 'basic',
    name: 'Plan Básico (Legacy)',
    monthly_price: 5,
    annual_price: 50,
    max_events_per_month: 8,
    features: ['Sitio público de reservas', 'Formulario directo a WhatsApp'],
    plan_tier: 'BASIC',
    enabled_features: ['RESERVATIONS', 'EVENTS']
  },
  {
    id: 'pro',
    name: 'Plan Profesional (Legacy)',
    monthly_price: 15,
    annual_price: 150,
    max_events_per_month: 20,
    features: ['Plano cenital', 'Control QR'],
    plan_tier: 'PRO',
    enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'ONLINE_PAYMENT', 'QR_CHECKIN']
  },
  {
    id: 'enterprise',
    name: 'Plan Empresarial (Legacy)',
    monthly_price: 45,
    annual_price: 450,
    max_events_per_month: 999,
    features: ['Acceso total'],
    plan_tier: 'PREMIUM',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN', 'MULTI_LOCATION'
    ]
  }
];

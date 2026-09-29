import type { Club } from '../types';

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-sensorial',
    slug: 'sensorial-vip',
    name: 'Sensorial Club VIP',
    tagline: 'La mejor vida nocturna y una experiencia de alta energía',
    logo: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
    address: 'Av. Amazonas N34-271, La Floresta',
    city: 'Quito, Ecuador',
    instagram: '@sensorialclubvip',
    whatsapp_number: '+593 99 555 9876',
    plan_id: 'enterprise',
    status: 'active',
    primary_color: '#e5b54f', // Champagne Gold
    accent_color: '#f5d38a',  // Luminous Gold Glow
    created_at: '2026-08-01',
    layout_type: 'horseshoe_vip',
    // Domain fields
    tenant_id: 'tenant-sensorial-group',
    venue_type: 'NIGHTCLUB',
    scheduling_mode: 'EVENT_LOCKED',
    active_floor_plan_version_id: 'fpv-sensorial-v1',
    enabled_features: [
      'RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION',
      'SEAT_SELECTION', 'CAPACITY_POOL', 'ONLINE_PAYMENT', 'QR_CHECKIN',
      'STAFF_MANAGEMENT', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN'
    ]
  },
  {
    id: 'club-velvet',
    slug: 'velvet-underground',
    name: 'Velvet Salón y Bar',
    tagline: 'Cócteles, buena música y público selecto',
    logo: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    address: 'Av. Los Ríos y Boyacá, La Carolina',
    city: 'Quito, Ecuador',
    instagram: '@velvetloungeco',
    whatsapp_number: '+593 99 777 1234',
    plan_id: 'basic',
    status: 'active',
    primary_color: '#3b82f6',
    accent_color: '#10b981',
    created_at: '2026-08-20',
    layout_type: 'u_amphitheater',
    // Domain fields: Demonstrates a Bar/Lounge operating with TIME_SLOTS
    tenant_id: 'tenant-velvet-hospitality',
    venue_type: 'BAR',
    scheduling_mode: 'TIME_SLOTS',
    enabled_features: ['RESERVATIONS', 'EVENTS']
  },
  {
    id: 'club-rumaj',
    slug: 'rumaj-rooftop',
    name: 'Rumaj Terraza y Salón',
    tagline: 'Ritmos profundos y servicio de botellas de lujo',
    logo: 'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&auto=format&fit=crop&q=80',
    address: 'Av. 6 de Diciembre y Los Ríos',
    city: 'Guayaquil, Ecuador',
    instagram: '@rumajnightclub',
    whatsapp_number: '+593 99 444 3210',
    plan_id: 'pro',
    status: 'active',
    primary_color: '#ec4899',
    accent_color: '#8b5cf6',
    created_at: '2026-08-15',
    layout_type: 'downtown_suites',
    // Domain fields: Demonstrates a Rooftop operating in PRO
    tenant_id: 'tenant-rumaj-ventures',
    venue_type: 'ROOFTOP',
    scheduling_mode: 'EVENT_LOCKED',
    active_floor_plan_version_id: 'fpv-rumaj-v1',
    enabled_features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'ONLINE_PAYMENT', 'QR_CHECKIN']
  }
];

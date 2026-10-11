/**
 * Tipos canónicos de Suscripciones SaaS y Facturación de NIGHTFLOW
 * Fase C - Flujo B (PayPhone / Manual / Trial)
 */
export const CANONICAL_PLANS = {
    free: {
        id: 'free',
        name: 'Lounge Free',
        monthlyPrice: 0,
        annualPrice: 0,
        features: ['RESERVATIONS', 'EVENTS'],
    },
    starter: {
        id: 'starter',
        name: 'Starter Club',
        monthlyPrice: 5,
        annualPrice: 50,
        features: ['RESERVATIONS', 'EVENTS', 'FLOOR_PLAN', 'TABLE_SELECTION', 'QR_CHECKIN'],
    },
    club_pro: {
        id: 'club_pro',
        name: 'Club Pro',
        monthlyPrice: 15,
        annualPrice: 150,
        features: [
            'RESERVATIONS',
            'EVENTS',
            'FLOOR_PLAN',
            'TABLE_SELECTION',
            'ONLINE_PAYMENT',
            'QR_CHECKIN',
            'STAFF_MANAGEMENT',
        ],
    },
    black_vip: {
        id: 'black_vip',
        name: 'Black VIP',
        monthlyPrice: 45,
        annualPrice: 450,
        features: [
            'RESERVATIONS',
            'EVENTS',
            'FLOOR_PLAN',
            'TABLE_SELECTION',
            'SEAT_SELECTION',
            'CAPACITY_POOL',
            'ONLINE_PAYMENT',
            'QR_CHECKIN',
            'STAFF_MANAGEMENT',
            'ADVANCED_ANALYTICS',
            'CUSTOM_DOMAIN',
            'MULTI_LOCATION',
        ],
    },
    beta_vip: {
        id: 'beta_vip',
        name: 'Beta Privada VIP',
        monthlyPrice: 0,
        annualPrice: 0,
        features: [
            'RESERVATIONS',
            'EVENTS',
            'FLOOR_PLAN',
            'TABLE_SELECTION',
            'SEAT_SELECTION',
            'CAPACITY_POOL',
            'ONLINE_PAYMENT',
            'QR_CHECKIN',
            'STAFF_MANAGEMENT',
            'ADVANCED_ANALYTICS',
            'CUSTOM_DOMAIN',
            'MULTI_LOCATION',
        ],
    },
};
//# sourceMappingURL=subscription.js.map
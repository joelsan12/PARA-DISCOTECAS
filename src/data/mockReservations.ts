import type { Reservation } from '../types';

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-101',
    code: 'VIP-9821',
    club_id: 'club-sensorial',
    event_id: 'event-fri-reggaeton',
    table_id: 'tbl-s2',
    table_code: '2',
    zone: 'Palcos VIP',
    customer_name: 'Santiago Mendoza',
    customer_phone: '+593 99 890 1234',
    customer_email: 'santiago.m@gmail.com',
    guest_count: 6,
    deposit_amount: 150,
    min_spend: 600,
    status: 'CONFIRMED',
    payment_method: 'credit_card',
    payment_status: 'paid',
    qr_token: 'QR-SNS-VIP-9821-TOK77',
    hold_expires_at: 0,
    created_at: '2026-09-02 18:20:00',
    items: [
      {
        id: 'item-101-1',
        item_type: 'RESOURCE',
        resource_id: 'tbl-s2',
        resource_code: '2',
        tier_name: 'Palcos VIP',
        quantity: 1,
        unit_price: 150,
        min_spend: 600,
        subtotal: 150
      }
    ]
  },
  {
    id: 'res-102',
    code: 'VIP-3419',
    club_id: 'club-sensorial',
    event_id: 'event-fri-reggaeton',
    table_id: 'tbl-s20',
    table_code: '20',
    zone: 'Cabina DJ VIP',
    customer_name: 'Valeria Restrepo',
    customer_phone: '+593 99 455 6789',
    customer_email: 'valeria.restrepo@empresa.com',
    guest_count: 10,
    deposit_amount: 500,
    min_spend: 1800,
    status: 'CHECKED_IN',
    payment_method: 'transfer',
    payment_status: 'paid',
    qr_token: 'QR-SNS-VIP-3419-TOK88',
    hold_expires_at: 0,
    checked_in_at: '22:42',
    created_at: '2026-09-01 14:10:00',
    items: [
      {
        id: 'item-102-1',
        item_type: 'RESOURCE',
        resource_id: 'tbl-s20',
        resource_code: '20',
        tier_name: 'Cabina DJ VIP',
        quantity: 1,
        unit_price: 500,
        min_spend: 1800,
        subtotal: 500
      }
    ]
  }
];

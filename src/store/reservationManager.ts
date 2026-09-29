import type { EventTablePricing, Reservation, ClubTable } from '../types';

const checkedInTimeFormatter = new Intl.DateTimeFormat('es-EC', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Guayaquil'
});

export function cleanupExpiredHolds(eventPricing: EventTablePricing[]): boolean {
  const now = Date.now();
  let updated = false;
  eventPricing.forEach(p => {
    if (p.status === 'HELD' && p.hold_expires_at && p.hold_expires_at < now) {
      p.status = 'AVAILABLE';
      p.held_by_session = undefined;
      p.hold_expires_at = undefined;
      updated = true;
    }
  });
  return updated;
}

export function holdTableOperation(
  eventPricing: EventTablePricing[],
  tableId: string,
  eventId: string,
  sessionId: string
): { success: boolean; message: string } {
  cleanupExpiredHolds(eventPricing);
  const pricing = eventPricing.find(p => p.table_id === tableId && p.event_id === eventId);
  if (!pricing) return { success: false, message: 'Mesa no configurada para este evento' };
  if (pricing.status === 'CONFIRMED' || pricing.status === 'CHECKED_IN') return { success: false, message: 'Esta mesa ya está reservada' };
  if (pricing.status === 'HELD' && pricing.held_by_session !== sessionId) return { success: false, message: 'Alguien más está reservando esta mesa (bloqueo de 12 min)' };

  pricing.status = 'HELD';
  pricing.held_by_session = sessionId;
  pricing.hold_expires_at = Date.now() + 12 * 60 * 1000;
  return { success: true, message: 'Mesa bloqueada por 12 minutos' };
}

export function releaseHoldOperation(
  eventPricing: EventTablePricing[],
  tableId: string,
  eventId: string
): boolean {
  const pricing = eventPricing.find(p => p.table_id === tableId && p.event_id === eventId);
  if (pricing && pricing.status === 'HELD') {
    pricing.status = 'AVAILABLE';
    pricing.held_by_session = undefined;
    pricing.hold_expires_at = undefined;
    return true;
  }
  return false;
}

export function confirmReservationOperation(
  eventPricing: EventTablePricing[],
  tables: ClubTable[],
  reservations: Reservation[],
  data: {
    club_id: string;
    event_id: string;
    table_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    guest_count: number;
    payment_method: 'credit_card' | 'transfer' | 'cash_door';
  }
): Reservation {
  const pricing = eventPricing.find(p => p.table_id === data.table_id && p.event_id === data.event_id)!;
  const table = tables.find(t => t.id === data.table_id)!;
  const resId = 'res-' + Date.now();
  const code = 'VIP-' + Math.floor(1000 + Math.random() * 9000);

  const reservation: Reservation = {
    id: resId,
    code,
    club_id: data.club_id,
    event_id: data.event_id,
    table_id: data.table_id,
    table_code: table.table_code,
    zone: table.zone,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_email: data.customer_email,
    guest_count: data.guest_count,
    deposit_amount: pricing.deposit_required,
    min_spend: pricing.min_spend,
    status: 'CONFIRMED',
    payment_method: data.payment_method,
    payment_status: 'paid',
    qr_token: `QR-${data.club_id.toUpperCase().slice(-3)}-${code}-${Date.now().toString().slice(-4)}`,
    hold_expires_at: 0,
    created_at: new Date().toISOString(),
    // Domain multi-item specification
    items: [
      {
        id: 'item-' + Date.now(),
        item_type: 'RESOURCE',
        resource_id: data.table_id,
        resource_code: table.table_code,
        tier_name: table.zone,
        quantity: 1,
        unit_price: pricing.deposit_required,
        min_spend: pricing.min_spend,
        subtotal: pricing.deposit_required
      }
    ]
  };

  pricing.status = 'CONFIRMED';
  pricing.active_reservation_id = resId;
  pricing.held_by_session = undefined;
  pricing.hold_expires_at = undefined;

  reservations.unshift(reservation);
  return reservation;
}

export function checkInReservationOperation(
  reservations: Reservation[],
  eventPricing: EventTablePricing[],
  reservationIdOrCode: string,
  staffName: string = 'Personal de puerta'
): { success: boolean; message: string; reservation?: Reservation } {
  const res = reservations.find(r => r.id === reservationIdOrCode || r.code === reservationIdOrCode);
  if (!res) return { success: false, message: 'Reserva no encontrada' };
  if (res.status === 'CHECKED_IN') return { success: false, message: `Pase ya utilizado a las ${res.checked_in_at || 'antes'}` };

  res.status = 'CHECKED_IN';
  res.checked_in_at = `${checkedInTimeFormatter.format(new Date())} (${staffName})`;
  const pricing = eventPricing.find(p => p.table_id === res.table_id && p.event_id === res.event_id);
  if (pricing) pricing.status = 'CHECKED_IN';

  return { success: true, message: 'Pase VIP verificado con éxito', reservation: res };
}

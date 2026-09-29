import { useEffect } from 'react';
import type { Reservation, Club, ClubEvent } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { esTableZone } from '../../lib/esLabels';
import { MessageCircle, CheckCircle, X, ArrowLeft, Share2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlackCardVipPass } from './identity/BlackCardVipPass';

const eventTitleLabels: Record<string, string> = {
  'Viernes de Perreo & Neon Night': 'Viernes de Perreo & Noche Neón',
  'Sábado Electric Midnight VIP': 'Sábado de Medianoche Eléctrica VIP',
  'Velvet Champagne & Afro-House Night': 'Velvet Champagne & Noche Afro-House',
  'Downtown Experience & Suites VIP': 'Experiencia Urbana & Suites VIP',
};

const formatEventDate = (date: string) => {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha por confirmar';

  const label = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(parsedDate);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatEventTime = (time: string) => {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!match) return 'Hora por confirmar';

  const minute = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();
  let hour = Number(match[1]);
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  hour %= 24;

  return new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(2000, 0, 1, hour, minute));
};

interface Props {
  reservation: Reservation;
  club: Club;
  event: ClubEvent;
  onClose: () => void;
}

export const DigitalPassModal = ({
  reservation,
  club,
  event,
  onClose
}: Props) => {
  const eventTitle = eventTitleLabels[event.title] ?? event.title;

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#e5b54f', '#f5d78a', '#d4af37', '#ffffff', '#cfa038']
      });
    } catch {
      // safe fallback
    }
  }, []);

  const whatsappMessage = encodeURIComponent(
    `🎟️ *PASE VIP NIGHTFLOW — ${club.name}*\n` +
    `Mesa: *${reservation.table_code}* (${esTableZone(reservation.zone)})\n` +
    `Evento: *${eventTitle}* (${formatEventDate(event.date)} - ${formatEventTime(event.door_time)})\n` +
    `Titular: *${reservation.customer_name}* (${reservation.guest_count} personas)\n` +
    `Código de acceso: *${reservation.code}*\n` +
    `Anticipo pagado: *${formatUsd(reservation.deposit_amount)}*\n\n` +
    `¡Nos vemos esta noche en la puerta VIP!`
  );

  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      minHeight: '100vh',
      height: '100%',
      backgroundColor: '#08080c',
      background: 'radial-gradient(ellipse at top, #161224 0%, #08080c 80%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      overflowX: 'hidden',
      color: '#ffffff',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* ── BARRA SUPERIOR PANTALLA COMPLETA ── */}
      <header className="safe-top" style={{
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto',
        padding: '16px 20px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e5b54f',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={15} />
          <span>Volver al Club</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          padding: '5px 12px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#34d399'
        }}>
          <CheckCircle size={13} />
          <span>RESERVA CONFIRMADA</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a1a1aa',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>
      </header>

      {/* ── CONTENIDO PRINCIPAL: PASE VIP BLACK CARD DIRECTO ── */}
      <main style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '12px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1
      }}>
        {/* Black Card VIP Pass Directo */}
        <BlackCardVipPass
          reservation={reservation}
          club={club}
          event={event}
        />

        {/* Botones de Acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="active-scale"
            style={{
              width: '100%',
              textDecoration: 'none',
              padding: '13px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
              boxShadow: '0 4px 18px rgba(34, 197, 94, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <MessageCircle size={16} />
            <span>Compartir Pase por WhatsApp</span>
            <Share2 size={14} />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="active-scale"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Finalizar &amp; Cerrar
          </button>
        </div>
      </main>

      {/* ── FOOTER DE SEGURIDAD ── */}
      <footer className="safe-bottom" style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '10px 20px 20px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.35)'
      }}>
        <ShieldCheck size={13} color="#e5b54f" />
        <span>Pase Digital Nominativo • Acceso Puerta VIP</span>
      </footer>
    </div>
  );
};

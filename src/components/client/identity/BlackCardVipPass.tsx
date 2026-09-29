import { Fingerprint, KeyRound, QrCode, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Reservation, Club, ClubEvent } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableZone } from '../../../lib/esLabels';
import { ROTATION_SECONDS, TOKEN_TTL_SECONDS, useTicketPass } from '../../../lib/ticketPass';
import { NightflowLogoMark } from '../../common/NightflowLogo';

interface Props {
  reservation: Reservation;
  club: Club;
  event: ClubEvent;
}

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

export const BlackCardVipPass = ({ reservation, club, event }: Props) => {
  const pass = useTicketPass({
    businessId: reservation.club_id || club.id,
    eventId: reservation.event_id || event.id,
    venueId: `venue-${reservation.club_id || club.id}`,
    ticketId: reservation.id,
    subject: reservation.customer_email || reservation.code
  });

  const progressPercent = Math.max(0, Math.min(100, (pass.secondsToExpire / TOKEN_TTL_SECONDS) * 100));
  const showQr = Boolean(pass.qrDataUrl);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #131926 0%, #080b12 100%)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      marginBottom: '18px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Metallic Top Sheen */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #f5d38a, #e5b54f, transparent)'
      }} />

      {/* Club Header & Code */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NightflowLogoMark size={20} theme="gold" />
            <span className="font-brand" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '0.02em' }}>
              {club.name}
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Pase VIP de mesa • Acceso prioritario
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
            Reserva #
          </span>
          <span className="font-mono" style={{ fontSize: '0.92rem', color: '#e5b54f', fontWeight: 800 }}>
            {reservation.code}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mesa asignada</span>
          <div className="font-brand" style={{ fontSize: '1.1rem', color: '#e5b54f', fontWeight: 800 }}>
            {reservation.table_code}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{esTableZone(reservation.zone)}</span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Invitados</span>
          <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
            {reservation.guest_count} personas
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mesa Completa</span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evento y fecha</span>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
            {formatEventDate(event.date)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Puertas: {formatEventTime(event.door_time)}</span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Titular</span>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {reservation.customer_name}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
            Anticipo pagado: {formatUsd(reservation.deposit_amount)}
          </span>
        </div>
      </div>

      {/* QR rotativo */}
      <div style={{
        background: 'rgba(5, 7, 12, 0.7)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px',
        textAlign: 'center',
        border: '1px dashed rgba(255, 255, 255, 0.12)'
      }}>
        {pass.status === 'demo' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(251, 191, 36, 0.14)',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            color: '#fbbf24',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.66rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            marginBottom: '10px'
          }}>
            <ShieldAlert size={12} />
            MODO DEMOSTRACIÓN · QR SIN VALOR EN PUERTA
          </div>
        )}

        {showQr ? (
          <div style={{
            background: '#fff',
            display: 'inline-block',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            <img
              src={pass.qrDataUrl}
              alt="Pase VIP rotativo firmado - ventana 30s"
              width={148}
              height={148}
              style={{ display: 'block', width: '148px', height: '148px', borderRadius: '4px' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '4px',
              border: '1px solid rgba(229, 181, 79, 0.35)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
  fontSize: '0.6rem',
  padding: '2px 6px',
  borderRadius: '9999px',
  fontFamily: 'var(--font-mono)'
}}>
30s
</div>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '168px',
            height: '168px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.16)',
            padding: '12px'
          }}>
            <QrCode size={30} color={pass.status === 'loading' ? 'var(--accent)' : '#71717a'} />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              {pass.status === 'loading'
                ? 'Generando pase rotativo seguro…'
                : pass.status === 'expired'
                  ? 'El pase expiró. Intenta renovarlo.'
                  : 'Pase no disponible sin conexión a Cloud Run.'}
            </span>
            {(pass.status === 'expired' || pass.status === 'error') && (
              <button
                type="button"
                onClick={() => pass.retry()}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '9999px' }}
              >
                <RefreshCw size={12} />
                Renovar
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <div style={{
            height: '4px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #e5b54f, #f5d38a)',
              boxShadow: '0 0 10px rgba(229, 181, 79, 0.6)',
              transition: 'width 1s linear'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              RENUEVA {pass.secondsToRotate}s · {ROTATION_SECONDS}s
            </span>
            <span style={{ color: pass.secondsToExpire <= 10 ? '#f43f5e' : 'var(--text-dim)', fontWeight: 700 }}>
              EXPIRA {pass.secondsToExpire}s · {TOKEN_TTL_SECONDS}s
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {pass.status === 'active' && pass.verifiedLocally && (
            <span className="badge badge-checkedin" style={{ fontSize: '0.64rem' }}>
              <ShieldCheck size={11} />
              FIRMA LOCAL VERIFICADA
            </span>
          )}
          {pass.status === 'active' && !pass.verifiedLocally && (
            <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.14)', color: '#fda4af', fontSize: '0.64rem' }}>
              <ShieldAlert size={11} />
              SIN VERIFICACIÓN CRIPTOGRÁFICA
            </span>
          )}
          {pass.passkeySupported && !pass.passkeyRegistered && (
            <button
              type="button"
              onClick={() => void pass.activatePasskey()}
              className="btn-gold"
              style={{ padding: '5px 12px', fontSize: '0.66rem', borderRadius: '9999px' }}
            >
              <Fingerprint size={12} />
              Activar huella en este pase
            </button>
          )}
          {pass.passkeyRegistered && pass.proofState === 'attached' && (
            <span className="badge badge-vip" style={{ fontSize: '0.64rem' }}>
              <KeyRound size={11} />
              PASSKEY LISTA PARA REINGRESO
            </span>
          )}
          {pass.passkeyRegistered && pass.proofState === 'required' && (
            <button
              type="button"
              onClick={() => void pass.signReentry()}
              className="btn-primary"
              style={{ padding: '5px 12px', fontSize: '0.66rem', borderRadius: '9999px' }}
            >
              <Fingerprint size={12} />
              Firmar reingreso
            </button>
          )}
          {pass.passkeyRegistered && pass.proofState === 'failed' && (
            <button
              type="button"
              onClick={() => void pass.signReentry()}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.66rem', borderRadius: '9999px' }}
            >
              <Fingerprint size={12} />
              Reintentar firma biométrica
            </button>
          )}
          {!pass.passkeySupported && (
            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', fontSize: '0.64rem' }}>
              SIN PASSKEY · REINGRESO POR REVISIÓN MANUAL
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '10px', lineHeight: 1.5 }}>
          {pass.status === 'active'
            ? 'Este código se renueva solo. Presenta el pase recién abierto al personal de seguridad en la entrada VIP.'
            : pass.message}
        </div>
      </div>
    </div>
  );
};

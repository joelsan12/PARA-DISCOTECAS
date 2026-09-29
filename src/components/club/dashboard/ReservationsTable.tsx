import { CheckCircle2 } from 'lucide-react';
import type { Reservation } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { formatEcuadorPhone, isValidEcuadorMobile } from '../../../lib/formatEcuador';
import { esTableStatus, esTableZone } from '../../../lib/esLabels';

interface Props {
  reservations: Reservation[];
}

const formatReservationPhone = (phone: string) => {
  if (!phone) return 'No registrado';
  return isValidEcuadorMobile(phone) ? formatEcuadorPhone(phone) : 'Revisar teléfono';
};

const formatEntryTime = (value?: string) => {
  if (!value) return 'Ingreso registrado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ingreso registrado';

  return date.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Guayaquil',
  });
};

export const ReservationsTable = ({ reservations }: Props) => {
  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
        Listado Oficial de Reservas ({reservations.length})
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-dim)' }}>
              <th style={{ padding: '12px 8px' }}>CÓDIGO</th>
              <th style={{ padding: '12px 8px' }}>MESA</th>
              <th style={{ padding: '12px 8px' }}>TITULAR</th>
              <th style={{ padding: '12px 8px' }}>CONTACTO</th>
              <th style={{ padding: '12px 8px' }}>INVITADOS</th>
              <th style={{ padding: '12px 8px' }}>ANTICIPO</th>
              <th style={{ padding: '12px 8px' }}>ESTADO</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>INGRESO</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                  #{res.code}
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 700, color: '#fff' }}>
                  {res.table_code} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({esTableZone(res.zone)})</span>
                </td>
                <td style={{ padding: '12px 8px', color: '#fff' }}>
                  {res.customer_name}
                </td>
                <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                  {formatReservationPhone(res.customer_phone)}
                </td>
                <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>
                  {res.guest_count} personas
                </td>
                <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>
                  {formatUsd(res.deposit_amount)}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span className={`badge ${res.status === 'CHECKED_IN' ? 'badge-checkedin' : 'badge-confirmed'}`}>
                    {esTableStatus(res.status)}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  {res.status === 'CHECKED_IN' ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> {formatEntryTime(res.checked_in_at)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      Validar con escáner QR en puerta
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import { useClubStore } from '../../store/clubStore';
import { esTableStatus } from '../../lib/esLabels';
import { UserCheck } from 'lucide-react';
import { DoorPwaApp } from './DoorPwaApp';
import '../../styles/doorTerminal.css';

const timeFormatter = new Intl.DateTimeFormat('es-EC', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatLocalTime = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AP])\s*M)?/i);
  if (!match) return 'Hora no registrada';

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const marker = match[3]?.toLowerCase();

  if (marker === 'p' && hour < 12) hour += 12;
  if (marker === 'a' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return 'Hora no registrada';

  return timeFormatter.format(new Date(2000, 0, 1, hour, minute));
};

export const DoorCheckIn = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubReservations = store.reservations.filter(r => r.club_id === activeClub.id);

  const checkedInList = clubReservations.filter(r => r.status === 'CHECKED_IN');
  const pendingList = clubReservations.filter(r => r.status === 'CONFIRMED');

  return (
    <div className="door-terminal-root">
      <div className="door-venue-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.08em' }}>
              TERMINAL DE ACCESO · CONTROL DE PUERTA
            </span>
          </div>
          <h2 className="font-brand door-venue-title">
            {activeClub.name}
          </h2>
        </div>

        <div className="door-count-pill">
          <div className="door-count-number">
            {checkedInList.length}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ingresados hoy
          </div>
        </div>
      </div>

      <DoorPwaApp
        demoReservations={pendingList.map(res => ({
          code: res.code,
          customer_name: res.customer_name,
          table_code: res.table_code
        }))}
      />

      <div className="door-log-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="var(--accent)" />
            <h3 className="font-brand" style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Bitácora de ingresos en puerta
            </h3>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            Turno nocturno activo
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {checkedInList.map(res => (
            <div
              key={res.id}
              className="door-log-item"
            >
              <div>
                <span style={{ fontWeight: 700, color: '#fff' }}>{res.customer_name}</span>
                <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 600 }}>Mesa {res.table_code}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.45)', marginLeft: '6px' }}>({res.guest_count} p.)</span>
              </div>
              <span className="badge badge-checkedin font-mono" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                {esTableStatus(res.status)} · {formatLocalTime(res.checked_in_at || '')}
              </span>
            </div>
          ))}

          {checkedInList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem' }}>
              No hay ingresos registrados todavía para esta noche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

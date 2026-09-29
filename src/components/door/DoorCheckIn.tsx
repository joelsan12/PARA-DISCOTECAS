import { useClubStore } from '../../store/clubStore';
import { esTableStatus } from '../../lib/esLabels';
import { UserCheck } from 'lucide-react';
import { DoorPwaApp } from './DoorPwaApp';

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
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '24px 16px 80px' }}>
      <div className="glass-card" style={{
        padding: '20px',
        marginBottom: '20px',
        background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.9) 0%, rgba(8, 11, 18, 0.95) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <h2 className="font-brand" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {activeClub.name}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
              {checkedInList.length}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ingresados hoy
            </div>
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

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="var(--accent)" />
            <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              Bitácora de ingresos en puerta
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Turno nocturno activo
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {checkedInList.map(res => (
            <div
              key={res.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: '#fff' }}>{res.customer_name}</span>
                <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 600 }}>Mesa {res.table_code}</span>
                <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>({res.guest_count} personas)</span>
              </div>
              <span className="badge badge-checkedin font-mono" style={{ fontSize: '0.72rem' }}>
                {esTableStatus(res.status)} · {formatLocalTime(res.checked_in_at || '')}
              </span>
            </div>
          ))}

          {checkedInList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
              No hay ingresos registrados todavía para esta noche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

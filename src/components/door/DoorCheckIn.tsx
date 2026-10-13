import { useClubStore } from '../../store/clubStore';
import { DoorPwaApp } from './DoorPwaApp';
import '../../styles/doorTerminal.css';

export const DoorCheckIn = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clubReservations = store.reservations.filter(r => r.club_id === activeClub?.id);
  const pendingList = clubReservations.filter(r => r.status === 'CONFIRMED');

  return (
    <div className="door-terminal-root">
      <DoorPwaApp
        demoReservations={pendingList.map(res => ({
          code: res.code,
          customer_name: res.customer_name,
          table_code: res.table_code
        }))}
      />
    </div>
  );
};

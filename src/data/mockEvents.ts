import type { ClubEvent } from '../types';

export const INITIAL_EVENTS: ClubEvent[] = [
  {
    id: 'evt_noche_vip_sabado',
    club_id: 'club_15c5b4cf616b6cec',
    title: 'Noche VIP — Black Diamond Edition',
    subtitle: 'Fiesta Exclusiva con Reservas & Concierge',
    date: new Date().toISOString().slice(0, 10),
    day_label: 'Sábado VIP Oficial',
    door_time: '22:00',
    cover_price: 25,
    dj_guest: 'DJ Kiko & Artistas Invitados',
    genre: 'Tech House & Melodic Techno',
    flyer_url: '',
    is_published: true,
    experience_type: 'INTERACTIVE_UNIT'
  }
];

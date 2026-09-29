import type { ClubEvent } from '../types';

export const INITIAL_EVENTS: ClubEvent[] = [
  // Sensorial Club Events
  {
    id: 'event-fri-reggaeton',
    club_id: 'club-sensorial',
    title: 'Viernes de Perreo y Noche de Neón',
    subtitle: 'La fiesta más intensa de la ciudad',
    date: '2026-09-04',
    day_label: 'Viernes 04 de septiembre',
    door_time: '22:00',
    cover_price: 15,
    dj_guest: 'DJ Snakebite y DJ Fox',
    genre: 'Reggaetón clásico y techno latino',
    flyer_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    is_published: true
  },
  {
    id: 'event-sat-electric',
    club_id: 'club-sensorial',
    title: 'Sábado Eléctrico Medianoche VIP',
    subtitle: 'Edición exclusiva con espectáculo de luces, pirotecnia y visuales 4K',
    date: '2026-09-05',
    day_label: 'Sábado 05 de septiembre',
    door_time: '22:30',
    cover_price: 20,
    dj_guest: 'Set en vivo de Alesso',
    genre: 'Techno melódico y fiesta House',
    flyer_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    is_published: true
  },
  // Velvet Lounge Events
  {
    id: 'event-velvet-sat',
    club_id: 'club-velvet',
    title: 'Velvet Champagne y Noche Afro-House',
    subtitle: 'Ambiente exclusivo estilo anfiteatro con DJs residentes',
    date: '2026-09-05',
    day_label: 'Sábado 05 de septiembre',
    door_time: '22:00',
    cover_price: 18,
    dj_guest: 'Homenaje a Black Coffee',
    genre: 'Afro-House y Deep Tech',
    flyer_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    is_published: true
  },
  // Rumaj Downtown Events
  {
    id: 'event-rumaj-fri',
    club_id: 'club-rumaj',
    title: 'Experiencia urbana y Suites VIP',
    subtitle: 'Noche de suites privadas y palcos exclusivos en el corazón de la fiesta',
    date: '2026-09-04',
    day_label: 'Viernes 04 de septiembre',
    door_time: '22:30',
    cover_price: 25,
    dj_guest: 'Estilo DJ Marco Carola',
    genre: 'Tech House y éxitos del club',
    flyer_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&auto=format&fit=crop&q=80',
    is_published: true
  }
];

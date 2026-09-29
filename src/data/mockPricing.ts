import type { EventTablePricing } from '../types';

export const INITIAL_EVENT_PRICING: EventTablePricing[] = [
  // ==========================================
  // PRICING FOR SENSORIAL CLUB VIP (event-fri-reggaeton & event-sat-electric)
  // ==========================================
  // Left Wing Palcos (1 to 5)
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s1', status: 'AVAILABLE', min_spend: 600, deposit_required: 150, includes: ['6 Pases VIP', '1 Botella Premium'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s2', status: 'CONFIRMED', min_spend: 600, deposit_required: 150, includes: ['6 Pases VIP', '1 Botella Premium'], active_reservation_id: 'res-101' },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s3', status: 'AVAILABLE', min_spend: 750, deposit_required: 200, includes: ['8 Pases VIP', '2 Botellas'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s4', status: 'AVAILABLE', min_spend: 900, deposit_required: 250, includes: ['10 Pases VIP', '2 Botellas Premium'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s5', status: 'AVAILABLE', min_spend: 900, deposit_required: 250, includes: ['10 Pases VIP', '2 Botellas Premium'] },

  // Balcón Ultra VIP (6 to 9)
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s6', status: 'AVAILABLE', min_spend: 1200, deposit_required: 350, includes: ['12 Pases VIP', '3 Botellas Premium', 'Vista Panorámica'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s7', status: 'AVAILABLE', min_spend: 1200, deposit_required: 350, includes: ['12 Pases VIP', '3 Botellas Premium', 'Vista Panorámica'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s8', status: 'AVAILABLE', min_spend: 1200, deposit_required: 350, includes: ['12 Pases VIP', '3 Botellas Premium', 'Vista Panorámica'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s9', status: 'AVAILABLE', min_spend: 1200, deposit_required: 350, includes: ['12 Pases VIP', '3 Botellas Premium', 'Vista Panorámica'] },

  // Right Wing Palcos (10 to 14)
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s10', status: 'AVAILABLE', min_spend: 900, deposit_required: 250, includes: ['10 Pases VIP', '2 Botellas Premium'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s11', status: 'AVAILABLE', min_spend: 900, deposit_required: 250, includes: ['10 Pases VIP', '2 Botellas Premium'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s12', status: 'AVAILABLE', min_spend: 750, deposit_required: 200, includes: ['8 Pases VIP', '2 Botellas'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s13', status: 'AVAILABLE', min_spend: 600, deposit_required: 150, includes: ['6 Pases VIP', '1 Botella Premium'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s14', status: 'AVAILABLE', min_spend: 600, deposit_required: 150, includes: ['6 Pases VIP', '1 Botella Premium'] },

  // Pista VIP Front Row (15 to 18)
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s15', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['8 Pases VIP', '3 Botellas Premium', 'Frente a Pista'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s16', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['8 Pases VIP', '3 Botellas Premium', 'Frente a Pista'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s17', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['8 Pases VIP', '3 Botellas Premium', 'Frente a Pista'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s18', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['8 Pases VIP', '3 Botellas Premium', 'Frente a Pista'] },

  // Cabina DJ Exclusive Boxes (19 & 20)
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s19', status: 'AVAILABLE', min_spend: 1800, deposit_required: 500, includes: ['10 Pases VIP', '4 Botellas Ultra Premium', 'Acceso a la cabina del DJ'] },
  { event_id: 'event-fri-reggaeton', table_id: 'tbl-s20', status: 'CONFIRMED', min_spend: 1800, deposit_required: 500, includes: ['10 Pases VIP', '4 Botellas Ultra Premium', 'Acceso a la cabina del DJ'], active_reservation_id: 'res-102' },

  // ==========================================
  // PRICING FOR VELVET LOUNGE (event-velvet-sat)
  // ==========================================
  // Yellow Pills (12 pax - $1,000)
  { event_id: 'event-velvet-sat', table_id: 'tbl-v01', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne', 'Servicio exclusivo'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v02', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v03', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v04', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v05', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v06', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v07', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v08', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v09', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v10', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v11', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-v12', status: 'AVAILABLE', min_spend: 1000, deposit_required: 300, includes: ['12 Entradas VIP', '3 Botellas Champagne'] },
  // Red Circles (6 pax - $550)
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr1', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr2', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr3', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr4', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr5', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr6', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr7', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr8', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr9', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr10', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr11', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr12', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vr13', status: 'AVAILABLE', min_spend: 550, deposit_required: 150, includes: ['6 Entradas', '2 Botellas'] },
  // Blue Circles (4 pax - $350)
  { event_id: 'event-velvet-sat', table_id: 'tbl-vb1', status: 'AVAILABLE', min_spend: 350, deposit_required: 100, includes: ['4 Entradas', '1 Botella Premium'] },
  { event_id: 'event-velvet-sat', table_id: 'tbl-vb2', status: 'AVAILABLE', min_spend: 350, deposit_required: 100, includes: ['4 Entradas', '1 Botella Premium'] },

  // ==========================================
  // PRICING FOR RUMAJ NIGHTCLUB (event-rumaj-fri)
  // ==========================================
  // Suites VIP ($1500 - $2000)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-s1', status: 'AVAILABLE', min_spend: 2000, deposit_required: 600, includes: ['15 Pases VIP', 'Suite Privada con Balcón', 'Barman Exclusivo'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-s2', status: 'AVAILABLE', min_spend: 1500, deposit_required: 500, includes: ['15 Pases VIP', 'Suite Privada'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-s3', status: 'AVAILABLE', min_spend: 1500, deposit_required: 500, includes: ['15 Pases VIP', 'Suite Privada'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-s4', status: 'AVAILABLE', min_spend: 1500, deposit_required: 500, includes: ['15 Pases VIP', 'Suite Privada'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-sv', status: 'AVAILABLE', min_spend: 1000, deposit_required: 350, includes: ['12 Pases VIP', 'Palco de espectáculo VIP'] },
  // Palco Stage ($800)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pal1', status: 'AVAILABLE', min_spend: 800, deposit_required: 250, includes: ['8 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pal2', status: 'AVAILABLE', min_spend: 800, deposit_required: 250, includes: ['8 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pal3', status: 'AVAILABLE', min_spend: 800, deposit_required: 250, includes: ['8 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-st1', status: 'AVAILABLE', min_spend: 800, deposit_required: 250, includes: ['8 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-st2', status: 'AVAILABLE', min_spend: 800, deposit_required: 250, includes: ['8 Pases', '2 Botellas'] },
  // Platinum ($400)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl1', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl2', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl3', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl4', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl5', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-pl6', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  // Gold ($600)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-g1', status: 'AVAILABLE', min_spend: 600, deposit_required: 180, includes: ['6 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-g2', status: 'AVAILABLE', min_spend: 600, deposit_required: 180, includes: ['6 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-g3', status: 'AVAILABLE', min_spend: 600, deposit_required: 180, includes: ['6 Pases', '2 Botellas'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-g4', status: 'AVAILABLE', min_spend: 600, deposit_required: 180, includes: ['6 Pases', '2 Botellas'] },
  // Pista ($150)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-p1', status: 'AVAILABLE', min_spend: 150, deposit_required: 50, includes: ['4 Pases', 'Mezcladores'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-p2', status: 'AVAILABLE', min_spend: 150, deposit_required: 50, includes: ['4 Pases', 'Mezcladores'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-p3', status: 'AVAILABLE', min_spend: 150, deposit_required: 50, includes: ['4 Pases', 'Mezcladores'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-p4', status: 'AVAILABLE', min_spend: 150, deposit_required: 50, includes: ['4 Pases', 'Mezcladores'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-p5', status: 'AVAILABLE', min_spend: 150, deposit_required: 50, includes: ['4 Pases', 'Mezcladores'] },
  // Silver ($400)
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-sil1', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] },
  { event_id: 'event-rumaj-fri', table_id: 'tbl-ru-sil2', status: 'AVAILABLE', min_spend: 400, deposit_required: 120, includes: ['6 Pases', '1 Botella'] }
];

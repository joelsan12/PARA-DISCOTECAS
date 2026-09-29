import type { ClubTable } from '../types';

export const INITIAL_TABLES: ClubTable[] = [
  // =========================================================================
  // CLUB 1: SENSORIAL VIP (Herradura VIP Layout - 100% Symmetrical)
  // =========================================================================
  // Left Wing (Palcos Izquierda - 1 to 5)
  { id: 'tbl-s1', club_id: 'club-sensorial', table_code: '1', badge_number: '1', zone: 'Palcos VIP', capacity: 6, x: 16, y: 76, shape: 'circle', tier_color: '#ef4444', tier_name: 'Palco salón 6 personas' },
  { id: 'tbl-s2', club_id: 'club-sensorial', table_code: '2', badge_number: '2', zone: 'Palcos VIP', capacity: 6, x: 16, y: 64, shape: 'circle', tier_color: '#ef4444', tier_name: 'Palco salón 6 personas' },
  { id: 'tbl-s3', club_id: 'club-sensorial', table_code: '3', badge_number: '3', zone: 'Palcos VIP', capacity: 8, x: 16, y: 52, shape: 'circle', tier_color: '#f97316', tier_name: 'Palco VIP 8 personas' },
  { id: 'tbl-s4', club_id: 'club-sensorial', table_code: '4', badge_number: '4', zone: 'Palcos VIP', capacity: 10, x: 16, y: 40, shape: 'circle', tier_color: '#eab308', tier_name: 'Palco premium 10 personas' },
  { id: 'tbl-s5', club_id: 'club-sensorial', table_code: '5', badge_number: '5', zone: 'Palcos VIP', capacity: 10, x: 16, y: 28, shape: 'circle', tier_color: '#eab308', tier_name: 'Palco premium 10 personas' },

  // Balcón Ultra VIP (Top Row - 6 to 9)
  { id: 'tbl-s6', club_id: 'club-sensorial', table_code: '6', badge_number: '6', zone: 'Balcón Ultra VIP', capacity: 12, x: 32, y: 18, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Balcón Ultra VIP 12 personas' },
  { id: 'tbl-s7', club_id: 'club-sensorial', table_code: '7', badge_number: '7', zone: 'Balcón Ultra VIP', capacity: 12, x: 44, y: 18, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Balcón Ultra VIP 12 personas' },
  { id: 'tbl-s8', club_id: 'club-sensorial', table_code: '8', badge_number: '8', zone: 'Balcón Ultra VIP', capacity: 12, x: 56, y: 18, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Balcón Ultra VIP 12 personas' },
  { id: 'tbl-s9', club_id: 'club-sensorial', table_code: '9', badge_number: '9', zone: 'Balcón Ultra VIP', capacity: 12, x: 68, y: 18, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Balcón Ultra VIP 12 personas' },

  // Right Wing (Palcos Derecha - 10 to 14)
  { id: 'tbl-s10', club_id: 'club-sensorial', table_code: '10', badge_number: '10', zone: 'Palcos VIP', capacity: 10, x: 84, y: 28, shape: 'circle', tier_color: '#eab308', tier_name: 'Palco premium 10 personas' },
  { id: 'tbl-s11', club_id: 'club-sensorial', table_code: '11', badge_number: '11', zone: 'Palcos VIP', capacity: 10, x: 84, y: 40, shape: 'circle', tier_color: '#eab308', tier_name: 'Palco premium 10 personas' },
  { id: 'tbl-s12', club_id: 'club-sensorial', table_code: '12', badge_number: '12', zone: 'Palcos VIP', capacity: 8, x: 84, y: 52, shape: 'circle', tier_color: '#f97316', tier_name: 'Palco VIP 8 personas' },
  { id: 'tbl-s13', club_id: 'club-sensorial', table_code: '13', badge_number: '13', zone: 'Palcos VIP', capacity: 6, x: 84, y: 64, shape: 'circle', tier_color: '#ef4444', tier_name: 'Palco salón 6 personas' },
  { id: 'tbl-s14', club_id: 'club-sensorial', table_code: '14', badge_number: '14', zone: 'Palcos VIP', capacity: 6, x: 84, y: 76, shape: 'circle', tier_color: '#ef4444', tier_name: 'Palco salón 6 personas' },

  // Dance Floor Front Row (Pista VIP - 15 to 18)
  { id: 'tbl-s15', club_id: 'club-sensorial', table_code: '15', badge_number: '15', zone: 'Pista VIP', capacity: 8, x: 32, y: 67, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista VIP 8 personas' },
  { id: 'tbl-s16', club_id: 'club-sensorial', table_code: '16', badge_number: '16', zone: 'Pista VIP', capacity: 8, x: 44, y: 67, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista VIP 8 personas' },
  { id: 'tbl-s17', club_id: 'club-sensorial', table_code: '17', badge_number: '17', zone: 'Pista VIP', capacity: 8, x: 56, y: 67, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista VIP 8 personas' },
  { id: 'tbl-s18', club_id: 'club-sensorial', table_code: '18', badge_number: '18', zone: 'Pista VIP', capacity: 8, x: 68, y: 67, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista VIP 8 personas' },

  // Cabina DJ Exclusive Boxes (19 & 20)
  { id: 'tbl-s19', club_id: 'club-sensorial', table_code: '19', badge_number: '19', zone: 'Cabina DJ VIP', capacity: 10, x: 26, y: 84, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Cabina del DJ 10 personas' },
  { id: 'tbl-s20', club_id: 'club-sensorial', table_code: '20', badge_number: '20', zone: 'Cabina DJ VIP', capacity: 10, x: 74, y: 84, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Cabina del DJ 10 personas' },

  // =========================================================================
  // CLUB 2: VELVET LOUNGE (Foto 1 - U-Amphitheater Stadium Layout)
  // =========================================================================
  // Top Balcony VIP Stage (12 pax)
  { id: 'tbl-v01', club_id: 'club-velvet', table_code: 'SV-1', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 18, y: 14, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v02', club_id: 'club-velvet', table_code: 'SV-2', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 34, y: 12, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v03', club_id: 'club-velvet', table_code: 'SV-3', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 50, y: 11, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v04', club_id: 'club-velvet', table_code: 'SV-4', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 66, y: 12, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v05', club_id: 'club-velvet', table_code: 'SV-5', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 82, y: 14, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },

  // Outer Left VIP Wing (12 pax)
  { id: 'tbl-v06', club_id: 'club-velvet', table_code: 'SV-6', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 14, y: 26, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v07', club_id: 'club-velvet', table_code: 'SV-7', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 14, y: 40, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v08', club_id: 'club-velvet', table_code: 'SV-8', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 14, y: 54, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v09', club_id: 'club-velvet', table_code: 'SV-9', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 14, y: 68, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v10', club_id: 'club-velvet', table_code: 'SV-10', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 22, y: 80, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },

  // Outer Right VIP Wing (12 pax)
  { id: 'tbl-v11', club_id: 'club-velvet', table_code: 'SV-11', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 86, y: 26, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },
  { id: 'tbl-v12', club_id: 'club-velvet', table_code: 'SV-12', badge_number: '12p', zone: 'Escenario VIP', capacity: 12, x: 86, y: 40, shape: 'circle', tier_color: '#facc15', tier_name: '12 personas VIP' },

  // Inner Left Dance Floor Lounge (6 pax)
  { id: 'tbl-vr1', club_id: 'club-velvet', table_code: 'R-1', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 25, y: 28, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr2', club_id: 'club-velvet', table_code: 'R-2', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 25, y: 42, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr3', club_id: 'club-velvet', table_code: 'R-3', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 25, y: 56, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr4', club_id: 'club-velvet', table_code: 'R-4', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 25, y: 70, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },

  // Inner Right Dance Floor Lounge (6 pax)
  { id: 'tbl-vr5', club_id: 'club-velvet', table_code: 'R-5', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 75, y: 28, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr6', club_id: 'club-velvet', table_code: 'R-6', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 75, y: 42, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr7', club_id: 'club-velvet', table_code: 'R-7', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 75, y: 56, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr8', club_id: 'club-velvet', table_code: 'R-8', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 75, y: 70, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr9', club_id: 'club-velvet', table_code: 'R-9', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 86, y: 54, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr10', club_id: 'club-velvet', table_code: 'R-10', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 86, y: 68, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr11', club_id: 'club-velvet', table_code: 'R-11', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 78, y: 80, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr12', club_id: 'club-velvet', table_code: 'R-12', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 50, y: 25, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },
  { id: 'tbl-vr13', club_id: 'club-velvet', table_code: 'R-13', badge_number: '6p', zone: 'Pista de baile', capacity: 6, x: 50, y: 67, shape: 'circle', tier_color: '#f87171', tier_name: 'Salón para 6 personas' },

  // Front DJ Cocktail Tables (4 pax)
  { id: 'tbl-vb1', club_id: 'club-velvet', table_code: 'B-1', badge_number: '4p', zone: 'Terraza', capacity: 4, x: 36, y: 82, shape: 'circle', tier_color: '#38bdf8', tier_name: 'Cóctel para 4 personas' },
  { id: 'tbl-vb2', club_id: 'club-velvet', table_code: 'B-2', badge_number: '4p', zone: 'Terraza', capacity: 4, x: 64, y: 82, shape: 'circle', tier_color: '#38bdf8', tier_name: 'Cóctel para 4 personas' },

  // =========================================================================
  // CLUB 3: RUMAJ NIGHTCLUB (Foto 3 - Suites urbanas y escenarios)
  // =========================================================================
  // Right Lateral VIP Suites (Foto 3)
  { id: 'tbl-ru-s1', club_id: 'club-rumaj', table_code: 'SUITE 1', badge_number: 'S1', zone: 'Suites VIP', capacity: 15, x: 78, y: 8, width: 9, height: 6, shape: 'rect', tier_color: '#f43f5e', tier_name: 'Suite VIP 1' },
  { id: 'tbl-ru-s2', club_id: 'club-rumaj', table_code: 'SUITE 2', badge_number: 'S2', zone: 'Suites VIP', capacity: 15, x: 78, y: 15, width: 9, height: 6, shape: 'rect', tier_color: '#f43f5e', tier_name: 'Suite VIP 2' },
  { id: 'tbl-ru-s3', club_id: 'club-rumaj', table_code: 'SUITE 3', badge_number: 'S3', zone: 'Suites VIP', capacity: 15, x: 78, y: 32, width: 9, height: 6, shape: 'rect', tier_color: '#f43f5e', tier_name: 'Suite VIP 3' },
  { id: 'tbl-ru-sv', club_id: 'club-rumaj', table_code: 'ESPECTÁCULO VIP', badge_number: 'ESP.', zone: 'Suites VIP', capacity: 12, x: 78, y: 48, width: 9, height: 5, shape: 'rect', tier_color: '#ef4444', tier_name: 'Sala de espectáculo VIP' },
  { id: 'tbl-ru-s4', club_id: 'club-rumaj', table_code: 'SUITE 4', badge_number: 'S4', zone: 'Suites VIP', capacity: 15, x: 78, y: 54, width: 9, height: 6, shape: 'rect', tier_color: '#f43f5e', tier_name: 'Suite VIP 4' },

  // Top Palco & Stage (Cyan Circles)
  { id: 'tbl-ru-pal1', club_id: 'club-rumaj', table_code: 'PALCO 1', badge_number: 'P1', zone: 'Palco', capacity: 8, x: 44, y: 6, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Palco 800 USD' },
  { id: 'tbl-ru-pal2', club_id: 'club-rumaj', table_code: 'PALCO 2', badge_number: 'P2', zone: 'Palco', capacity: 8, x: 55, y: 6, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Palco 800 USD' },
  { id: 'tbl-ru-pal3', club_id: 'club-rumaj', table_code: 'PALCO 3', badge_number: 'P3', zone: 'Palco', capacity: 8, x: 65, y: 8, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Palco 800 USD' },
  { id: 'tbl-ru-st1', club_id: 'club-rumaj', table_code: 'ESCENARIO 1', badge_number: 'ST1', zone: 'Palco', capacity: 8, x: 44, y: 11, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Escenario 800 USD' },
  { id: 'tbl-ru-st2', club_id: 'club-rumaj', table_code: 'ESCENARIO 2', badge_number: 'ST2', zone: 'Palco', capacity: 8, x: 60, y: 11, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Escenario 800 USD' },

  // Platinum Grid (Purple squares & circles)
  { id: 'tbl-ru-pl1', club_id: 'club-rumaj', table_code: 'PL-01', badge_number: 'PL1', zone: 'Platino', capacity: 6, x: 42, y: 19, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },
  { id: 'tbl-ru-pl2', club_id: 'club-rumaj', table_code: 'PL-02', badge_number: 'PL2', zone: 'Platino', capacity: 6, x: 49, y: 19, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },
  { id: 'tbl-ru-pl3', club_id: 'club-rumaj', table_code: 'PL-03', badge_number: 'PL3', zone: 'Platino', capacity: 6, x: 56, y: 19, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },
  { id: 'tbl-ru-pl4', club_id: 'club-rumaj', table_code: 'PL-04', badge_number: 'PL4', zone: 'Platino', capacity: 6, x: 63, y: 19, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },
  { id: 'tbl-ru-pl5', club_id: 'club-rumaj', table_code: 'PL-05', badge_number: 'PL5', zone: 'Platino', capacity: 6, x: 63, y: 23, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },
  { id: 'tbl-ru-pl6', club_id: 'club-rumaj', table_code: 'PL-06', badge_number: 'PL6', zone: 'Platino', capacity: 6, x: 63, y: 27, width: 4, height: 3.5, shape: 'square', tier_color: '#c084fc', tier_name: 'Platino 400 USD' },

  // Pista (Orange circles)
  { id: 'tbl-ru-p1', club_id: 'club-rumaj', table_code: 'P-01', badge_number: 'P1', zone: 'Pista de baile', capacity: 4, x: 40, y: 51, shape: 'circle', tier_color: '#fb923c', tier_name: 'Pista 150 USD' },
  { id: 'tbl-ru-p2', club_id: 'club-rumaj', table_code: 'P-02', badge_number: 'P2', zone: 'Pista de baile', capacity: 4, x: 46, y: 51, shape: 'circle', tier_color: '#fb923c', tier_name: 'Pista 150 USD' },
  { id: 'tbl-ru-p3', club_id: 'club-rumaj', table_code: 'P-03', badge_number: 'P3', zone: 'Pista de baile', capacity: 4, x: 52, y: 51, shape: 'circle', tier_color: '#fb923c', tier_name: 'Pista 150 USD' },
  { id: 'tbl-ru-p4', club_id: 'club-rumaj', table_code: 'P-04', badge_number: 'P4', zone: 'Pista de baile', capacity: 4, x: 58, y: 51, shape: 'circle', tier_color: '#fb923c', tier_name: 'Pista 150 USD' },
  { id: 'tbl-ru-p5', club_id: 'club-rumaj', table_code: 'P-05', badge_number: 'P5', zone: 'Pista de baile', capacity: 4, x: 64, y: 51, shape: 'circle', tier_color: '#fb923c', tier_name: 'Pista 150 USD' },

  // Gold Grid (Yellow squares)
  { id: 'tbl-ru-g1', club_id: 'club-rumaj', table_code: 'G-01', badge_number: 'G1', zone: 'Oro', capacity: 6, x: 34, y: 56, width: 4.5, height: 3.5, shape: 'square', tier_color: '#facc15', tier_name: 'Oro 600 USD' },
  { id: 'tbl-ru-g2', club_id: 'club-rumaj', table_code: 'G-02', badge_number: 'G2', zone: 'Oro', capacity: 6, x: 43, y: 56, width: 4.5, height: 3.5, shape: 'square', tier_color: '#facc15', tier_name: 'Oro 600 USD' },
  { id: 'tbl-ru-g3', club_id: 'club-rumaj', table_code: 'G-03', badge_number: 'G3', zone: 'Oro', capacity: 6, x: 52, y: 56, width: 4.5, height: 3.5, shape: 'square', tier_color: '#facc15', tier_name: 'Oro 600 USD' },
  { id: 'tbl-ru-g4', club_id: 'club-rumaj', table_code: 'G-04', badge_number: 'G4', zone: 'Oro', capacity: 6, x: 61, y: 56, width: 4.5, height: 3.5, shape: 'square', tier_color: '#facc15', tier_name: 'Oro 600 USD' },

  // Silver Row (Silver/grey squares)
  { id: 'tbl-ru-sil1', club_id: 'club-rumaj', table_code: 'PLATA-1', badge_number: 'S1', zone: 'Plata', capacity: 6, x: 44, y: 68, width: 4.5, height: 3.5, shape: 'square', tier_color: '#94a3b8', tier_name: 'Plata 400 USD' },
  { id: 'tbl-ru-sil2', club_id: 'club-rumaj', table_code: 'PLATA-2', badge_number: 'S2', zone: 'Plata', capacity: 6, x: 52, y: 68, width: 4.5, height: 3.5, shape: 'square', tier_color: '#94a3b8', tier_name: 'Plata 400 USD' }
];

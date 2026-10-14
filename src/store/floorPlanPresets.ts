import type { ClubLayoutType, ClubTable, EventTablePricing, ClubEvent } from '../types';

export function generateArchetypeTables(
  clubId: string,
  presetType: ClubLayoutType,
  _initialTables?: ClubTable[]
): ClubTable[] {
  let templateTables: ClubTable[] = [];

  if (presetType === 'horseshoe_vip') {
    templateTables = [
      { id: 'h-1', club_id: clubId, table_code: 'VIP-01', badge_number: '1', zone: 'Balcón VIP Central', capacity: 10, x: 18, y: 22, shape: 'pill', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'h-2', club_id: clubId, table_code: 'VIP-02', badge_number: '2', zone: 'Balcón VIP Central', capacity: 10, x: 34, y: 20, shape: 'circle', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'h-3', club_id: clubId, table_code: 'VIP-03', badge_number: '3', zone: 'Palco Presidencial', capacity: 14, x: 50, y: 19, shape: 'pill', tier_color: '#f59e0b', tier_name: 'Ultra VIP' },
      { id: 'h-4', club_id: clubId, table_code: 'VIP-04', badge_number: '4', zone: 'Balcón VIP Central', capacity: 10, x: 66, y: 20, shape: 'circle', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'h-5', club_id: clubId, table_code: 'VIP-05', badge_number: '5', zone: 'Balcón VIP Central', capacity: 10, x: 82, y: 22, shape: 'pill', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'h-6', club_id: clubId, table_code: 'PAL-01', badge_number: '6', zone: 'Palco Lateral Oeste', capacity: 8, x: 15, y: 44, shape: 'square', tier_color: '#a855f7', tier_name: 'Palco VIP' },
      { id: 'h-7', club_id: clubId, table_code: 'PAL-02', badge_number: '7', zone: 'Palco Lateral Oeste', capacity: 8, x: 14, y: 64, shape: 'square', tier_color: '#a855f7', tier_name: 'Palco VIP' },
      { id: 'h-8', club_id: clubId, table_code: 'PAL-03', badge_number: '8', zone: 'Palco Lateral Este', capacity: 8, x: 85, y: 44, shape: 'square', tier_color: '#a855f7', tier_name: 'Palco VIP' },
      { id: 'h-9', club_id: clubId, table_code: 'PAL-04', badge_number: '9', zone: 'Palco Lateral Este', capacity: 8, x: 86, y: 64, shape: 'square', tier_color: '#a855f7', tier_name: 'Palco VIP' },
      { id: 'h-10', club_id: clubId, table_code: 'STAGE-01', badge_number: '10', zone: 'Front Stage DJ', capacity: 8, x: 33, y: 67, shape: 'circle', tier_color: '#34d399', tier_name: 'Stage VIP' },
      { id: 'h-11', club_id: clubId, table_code: 'STAGE-02', badge_number: '11', zone: 'Front Stage DJ', capacity: 8, x: 67, y: 67, shape: 'circle', tier_color: '#34d399', tier_name: 'Stage VIP' },
      { id: 'h-12', club_id: clubId, table_code: 'PST-01', badge_number: '12', zone: 'Pista Arena', capacity: 6, x: 50, y: 88, shape: 'circle', tier_color: '#38bdf8', tier_name: 'Pista de Baile' }
    ];
  } else if (presetType === 'u_amphitheater') {
    templateTables = [
      { id: 'u-1', club_id: clubId, table_code: 'AMP-01', badge_number: '1', zone: 'Gradas VIP Nivel 1', capacity: 8, x: 24, y: 18, shape: 'circle', tier_color: '#38bdf8', tier_name: 'Anfiteatro Frontal' },
      { id: 'u-2', club_id: clubId, table_code: 'AMP-02', badge_number: '2', zone: 'Gradas VIP Nivel 1', capacity: 8, x: 76, y: 18, shape: 'circle', tier_color: '#38bdf8', tier_name: 'Anfiteatro Frontal' },
      { id: 'u-3', club_id: clubId, table_code: 'AMP-03', badge_number: '3', zone: 'Gradas VIP Nivel 2', capacity: 10, x: 21, y: 34, shape: 'pill', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'u-4', club_id: clubId, table_code: 'AMP-04', badge_number: '4', zone: 'Gradas VIP Nivel 2', capacity: 10, x: 79, y: 34, shape: 'pill', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'u-5', club_id: clubId, table_code: 'AMP-05', badge_number: '5', zone: 'Palcos Elevados Nivel 3', capacity: 14, x: 18, y: 52, shape: 'pill', tier_color: '#f59e0b', tier_name: 'Ultra VIP' },
      { id: 'u-6', club_id: clubId, table_code: 'AMP-06', badge_number: '6', zone: 'Palcos Elevados Nivel 3', capacity: 14, x: 82, y: 52, shape: 'pill', tier_color: '#f59e0b', tier_name: 'Ultra VIP' },
      { id: 'u-7', club_id: clubId, table_code: 'CRV-01', badge_number: '7', zone: 'Curva Panorámica', capacity: 8, x: 28, y: 68, shape: 'circle', tier_color: '#a855f7', tier_name: 'Curva Lounge' },
      { id: 'u-8', club_id: clubId, table_code: 'CRV-02', badge_number: '8', zone: 'Curva Panorámica', capacity: 8, x: 42, y: 72, shape: 'circle', tier_color: '#a855f7', tier_name: 'Curva Lounge' },
      { id: 'u-9', club_id: clubId, table_code: 'CRV-03', badge_number: '9', zone: 'Curva Panorámica', capacity: 8, x: 58, y: 72, shape: 'circle', tier_color: '#a855f7', tier_name: 'Curva Lounge' },
      { id: 'u-10', club_id: clubId, table_code: 'CRV-04', badge_number: '10', zone: 'Curva Panorámica', capacity: 8, x: 72, y: 68, shape: 'circle', tier_color: '#a855f7', tier_name: 'Curva Lounge' },
      { id: 'u-11', club_id: clubId, table_code: 'PST-01', badge_number: '11', zone: 'Pista Central', capacity: 6, x: 38, y: 38, shape: 'circle', tier_color: '#34d399', tier_name: 'Pista Central' },
      { id: 'u-12', club_id: clubId, table_code: 'PST-02', badge_number: '12', zone: 'Pista Central', capacity: 6, x: 62, y: 38, shape: 'circle', tier_color: '#34d399', tier_name: 'Pista Central' }
    ];
  } else if (presetType === 'downtown_suites') {
    templateTables = [
      { id: 'd-1', club_id: clubId, table_code: 'SUI-01', badge_number: '1', zone: 'Skyline Suite 1', capacity: 12, x: 22, y: 15, shape: 'rect', tier_color: '#e5b54f', tier_name: 'Master Suite' },
      { id: 'd-2', club_id: clubId, table_code: 'SUI-02', badge_number: '2', zone: 'Skyline Suite 2', capacity: 12, x: 78, y: 15, shape: 'rect', tier_color: '#e5b54f', tier_name: 'Master Suite' },
      { id: 'd-3', club_id: clubId, table_code: 'SUI-03', badge_number: '3', zone: 'Skyline Suite 3', capacity: 10, x: 22, y: 35, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Private Suite' },
      { id: 'd-4', club_id: clubId, table_code: 'SUI-04', badge_number: '4', zone: 'Skyline Suite 4', capacity: 10, x: 78, y: 35, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Private Suite' },
      { id: 'd-5', club_id: clubId, table_code: 'BLC-01', badge_number: '5', zone: 'Balcón Panorámico', capacity: 8, x: 30, y: 55, shape: 'pill', tier_color: '#a855f7', tier_name: 'Balcony Lounge' },
      { id: 'd-6', club_id: clubId, table_code: 'BLC-02', badge_number: '6', zone: 'Balcón Panorámico', capacity: 8, x: 70, y: 55, shape: 'pill', tier_color: '#a855f7', tier_name: 'Balcony Lounge' },
      { id: 'd-7', club_id: clubId, table_code: 'ROOF-01', badge_number: '7', zone: 'Terraza Rooftop', capacity: 6, x: 25, y: 78, shape: 'circle', tier_color: '#34d399', tier_name: 'Open Air Lounge' },
      { id: 'd-8', club_id: clubId, table_code: 'ROOF-02', badge_number: '8', zone: 'Terraza Rooftop', capacity: 6, x: 50, y: 82, shape: 'circle', tier_color: '#34d399', tier_name: 'Open Air Lounge' },
      { id: 'd-9', club_id: clubId, table_code: 'ROOF-03', badge_number: '9', zone: 'Terraza Rooftop', capacity: 6, x: 75, y: 78, shape: 'circle', tier_color: '#34d399', tier_name: 'Open Air Lounge' }
    ];
  } else if (presetType === 'macro_blueprint') {
    // ── Plano Arquitectónico Cenital Blueprint 2D (Recreación exacta Imagen 1) ──
    templateTables = [
      // Fila Superior (Norte)
      { id: 'mb-1', club_id: clubId, table_code: 'VIP-01', badge_number: '1', zone: 'Balcón VIP Norte', capacity: 8, x: 29.5, y: 15.5, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-2', club_id: clubId, table_code: 'VIP-02', badge_number: '2', zone: 'Balcón VIP Norte', capacity: 8, x: 37.0, y: 14.5, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-3', club_id: clubId, table_code: 'VIP-03', badge_number: '3', zone: 'Balcón VIP Norte', capacity: 8, x: 44.5, y: 14.5, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-4', club_id: clubId, table_code: 'VIP-04', badge_number: '4', zone: 'Balcón VIP Norte', capacity: 8, x: 51.5, y: 14.5, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-5', club_id: clubId, table_code: 'VIP-05', badge_number: '5', zone: 'Balcón VIP Norte', capacity: 8, x: 59.0, y: 14.5, shape: 'rect', tier_color: '#f59e0b', tier_name: 'VIP Oro' },
      { id: 'mb-6', club_id: clubId, table_code: 'VIP-06', badge_number: '6', zone: 'Balcón VIP Norte', capacity: 8, x: 66.0, y: 14.5, shape: 'rect', tier_color: '#a855f7', tier_name: 'VIP Púrpura' },
      { id: 'mb-7', club_id: clubId, table_code: 'VIP-07', badge_number: '7', zone: 'Balcón VIP Norte', capacity: 8, x: 73.5, y: 14.5, shape: 'rect', tier_color: '#38bdf8', tier_name: 'VIP Platino' },
      // Pared Oeste (Izquierda)
      { id: 'mb-8', club_id: clubId, table_code: 'VIP-08', badge_number: '8', zone: 'Lateral Oeste', capacity: 8, x: 26.5, y: 29.0, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-9', club_id: clubId, table_code: 'VIP-09', badge_number: '9', zone: 'Lateral Oeste', capacity: 8, x: 26.5, y: 44.0, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      { id: 'mb-10', club_id: clubId, table_code: 'VIP-10', badge_number: '10', zone: 'Lateral Oeste', capacity: 8, x: 26.5, y: 58.0, shape: 'rect', tier_color: '#10b981', tier_name: 'VIP Esmeralda' },
      // Arena Central Octagonal
      { id: 'mb-11', club_id: clubId, table_code: 'ARENA-01', badge_number: '11', zone: 'Arena Central', capacity: 6, x: 35.5, y: 39.0, shape: 'rect', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'mb-12', club_id: clubId, table_code: 'ARENA-02', badge_number: '12', zone: 'Arena Central', capacity: 6, x: 35.5, y: 51.0, shape: 'rect', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'mb-13', club_id: clubId, table_code: 'ARENA-03', badge_number: '13', zone: 'Arena Central', capacity: 6, x: 44.5, y: 31.0, shape: 'rect', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'mb-14', club_id: clubId, table_code: 'ARENA-04', badge_number: '14', zone: 'Arena Central', capacity: 6, x: 52.5, y: 31.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      { id: 'mb-15', club_id: clubId, table_code: 'ARENA-05', badge_number: '15', zone: 'Arena Central', capacity: 6, x: 60.5, y: 31.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      { id: 'mb-16', club_id: clubId, table_code: 'ARENA-06', badge_number: '16', zone: 'Arena Central', capacity: 6, x: 44.5, y: 61.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      { id: 'mb-17', club_id: clubId, table_code: 'ARENA-07', badge_number: '17', zone: 'Arena Central', capacity: 6, x: 52.5, y: 61.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      { id: 'mb-18', club_id: clubId, table_code: 'ARENA-08', badge_number: '18', zone: 'Arena Central', capacity: 6, x: 60.5, y: 61.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'Arena VIP' },
      { id: 'mb-19', club_id: clubId, table_code: 'ARENA-09', badge_number: '19', zone: 'Arena Central', capacity: 6, x: 70.5, y: 40.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'Arena VIP' },
      { id: 'mb-20', club_id: clubId, table_code: 'ARENA-10', badge_number: '20', zone: 'Arena Central', capacity: 6, x: 70.5, y: 52.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'Arena VIP' },
      // Fila Inferior (Sur)
      { id: 'mb-21', club_id: clubId, table_code: 'VIP-11', badge_number: '21', zone: 'Lounge Sur', capacity: 8, x: 44.5, y: 80.0, shape: 'rect', tier_color: '#a855f7', tier_name: 'VIP Púrpura' },
      { id: 'mb-22', club_id: clubId, table_code: 'VIP-12', badge_number: '22', zone: 'Lounge Sur', capacity: 8, x: 50.5, y: 80.0, shape: 'rect', tier_color: '#a855f7', tier_name: 'VIP Púrpura' },
      { id: 'mb-23', club_id: clubId, table_code: 'VIP-13', badge_number: '23', zone: 'Lounge Sur', capacity: 8, x: 56.5, y: 80.0, shape: 'rect', tier_color: '#a855f7', tier_name: 'VIP Púrpura' },
      { id: 'mb-24', club_id: clubId, table_code: 'VIP-14', badge_number: '24', zone: 'Lounge Sur', capacity: 8, x: 62.5, y: 80.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'VIP Platino' },
      { id: 'mb-25', club_id: clubId, table_code: 'VIP-15', badge_number: '25', zone: 'Lounge Sur', capacity: 8, x: 70.5, y: 80.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'VIP Platino' },
      { id: 'mb-26', club_id: clubId, table_code: 'VIP-16', badge_number: '26', zone: 'Lounge Sur', capacity: 8, x: 77.5, y: 80.0, shape: 'rect', tier_color: '#38bdf8', tier_name: 'VIP Platino' },
      // Estaciones de Acceso / Host Derecha
      { id: 'mb-27', club_id: clubId, table_code: 'HOST-01', badge_number: '27', zone: 'Recepción & Acceso', capacity: 4, x: 84.5, y: 27.0, shape: 'square', tier_color: '#38bdf8', tier_name: 'Host VIP' },
      { id: 'mb-28', club_id: clubId, table_code: 'HOST-02', badge_number: '28', zone: 'Recepción & Acceso', capacity: 4, x: 84.5, y: 65.0, shape: 'square', tier_color: '#38bdf8', tier_name: 'Host VIP' },
    ];
  } else if (presetType === 'arena_vip_3d') {
    // ── Arena 3D Haute Nocturne con Suites & Palcos (Recreación exacta Imagen 2) ──
    templateTables = [
      // Suites VIP Privadas Superiores
      { id: 'ar-1', club_id: clubId, table_code: 'SUI-01', badge_number: '1', zone: 'Suites VIP', capacity: 12, x: 24.5, y: 28.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Master Suite 1' },
      { id: 'ar-2', club_id: clubId, table_code: 'SUI-02', badge_number: '2', zone: 'Suites VIP', capacity: 12, x: 35.5, y: 28.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Master Suite 2' },
      // Boxes VIP Oeste en Fila
      { id: 'ar-3', club_id: clubId, table_code: 'BOX-01', badge_number: '3', zone: 'Boxes VIP Oeste', capacity: 8, x: 19.0, y: 39.0, shape: 'rect', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'ar-4', club_id: clubId, table_code: 'BOX-02', badge_number: '4', zone: 'Boxes VIP Oeste', capacity: 8, x: 19.0, y: 51.0, shape: 'rect', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'ar-5', club_id: clubId, table_code: 'BOX-03', badge_number: '5', zone: 'Boxes VIP Oeste', capacity: 8, x: 19.0, y: 63.0, shape: 'rect', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'ar-6', club_id: clubId, table_code: 'BOX-04', badge_number: '6', zone: 'Boxes VIP Oeste', capacity: 8, x: 19.0, y: 75.0, shape: 'rect', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      { id: 'ar-7', club_id: clubId, table_code: 'BOX-05', badge_number: '7', zone: 'Boxes VIP Oeste', capacity: 8, x: 19.0, y: 87.0, shape: 'rect', tier_color: '#e5b54f', tier_name: 'VIP Oro' },
      // Cabina DJ VIP Frontal
      { id: 'ar-8', club_id: clubId, table_code: 'DJ-01', badge_number: '8', zone: 'Cabina DJ VIP', capacity: 10, x: 51.0, y: 44.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Ultra Stage VIP' },
      // Arena Central Pit (Sofás envolventes)
      { id: 'ar-9', club_id: clubId, table_code: 'ARENA-01', badge_number: '9', zone: 'Arena Central', capacity: 8, x: 33.5, y: 50.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'ar-10', club_id: clubId, table_code: 'ARENA-02', badge_number: '10', zone: 'Arena Central', capacity: 8, x: 33.5, y: 60.5, shape: 'pill', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      { id: 'ar-11', club_id: clubId, table_code: 'ARENA-03', badge_number: '11', zone: 'Arena Central', capacity: 6, x: 34.0, y: 69.5, shape: 'circle', tier_color: '#e5b54f', tier_name: 'Arena VIP' },
      { id: 'ar-12', club_id: clubId, table_code: 'ARENA-04', badge_number: '12', zone: 'Arena Central', capacity: 10, x: 47.5, y: 72.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'ar-13', club_id: clubId, table_code: 'ARENA-05', badge_number: '13', zone: 'Arena Central', capacity: 10, x: 53.5, y: 72.0, shape: 'pill', tier_color: '#10b981', tier_name: 'Arena VIP' },
      { id: 'ar-14', club_id: clubId, table_code: 'ARENA-06', badge_number: '14', zone: 'Arena Central', capacity: 8, x: 61.5, y: 66.5, shape: 'pill', tier_color: '#f59e0b', tier_name: 'Arena VIP' },
      // Palcos Este (Graderías en ángulo)
      { id: 'ar-15', club_id: clubId, table_code: 'PALCO-01', badge_number: '15', zone: 'Palcos VIP Este', capacity: 12, x: 70.0, y: 35.0, shape: 'pill', tier_color: '#e5b54f', tier_name: 'Palco Presidencial' },
      { id: 'ar-16', club_id: clubId, table_code: 'PALCO-02', badge_number: '16', zone: 'Palcos VIP Este', capacity: 10, x: 76.5, y: 47.0, shape: 'pill', tier_color: '#e5b54f', tier_name: 'Palco VIP 2' },
      { id: 'ar-17', club_id: clubId, table_code: 'PALCO-03', badge_number: '17', zone: 'Palcos VIP Este', capacity: 8, x: 80.5, y: 58.0, shape: 'pill', tier_color: '#e5b54f', tier_name: 'Palco VIP 3' },
      { id: 'ar-18', club_id: clubId, table_code: 'PALCO-04', badge_number: '18', zone: 'Palcos VIP Este', capacity: 8, x: 71.0, y: 75.0, shape: 'pill', tier_color: '#e5b54f', tier_name: 'Palco Terraza' },
      // Lounges Sur en Fila
      { id: 'ar-19', club_id: clubId, table_code: 'SUR-01', badge_number: '19', zone: 'Lounge Sur', capacity: 6, x: 32.5, y: 88.0, shape: 'rect', tier_color: '#10b981', tier_name: 'Lounge Esmeralda' },
      { id: 'ar-20', club_id: clubId, table_code: 'SUR-02', badge_number: '20', zone: 'Lounge Sur', capacity: 6, x: 41.5, y: 88.0, shape: 'rect', tier_color: '#10b981', tier_name: 'Lounge Esmeralda' },
      { id: 'ar-21', club_id: clubId, table_code: 'SUR-03', badge_number: '21', zone: 'Lounge Sur', capacity: 6, x: 50.5, y: 88.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Lounge Oro' },
      { id: 'ar-22', club_id: clubId, table_code: 'SUR-04', badge_number: '22', zone: 'Lounge Sur', capacity: 6, x: 59.5, y: 88.0, shape: 'rect', tier_color: '#f59e0b', tier_name: 'Lounge Oro' },
    ];
  } else {
    // custom_open o cualquier otro
    templateTables = [
      { id: 'c-1', club_id: clubId, table_code: 'VIP-01', badge_number: '1', zone: 'Escenario VIP', capacity: 10, x: 25, y: 30, shape: 'circle', tier_color: '#eab308', tier_name: 'VIP Oro' },
      { id: 'c-2', club_id: clubId, table_code: 'VIP-02', badge_number: '2', zone: 'Escenario VIP', capacity: 10, x: 40, y: 25, shape: 'circle', tier_color: '#eab308', tier_name: 'VIP Oro' },
      { id: 'c-3', club_id: clubId, table_code: 'VIP-03', badge_number: '3', zone: 'Escenario VIP', capacity: 10, x: 60, y: 25, shape: 'circle', tier_color: '#eab308', tier_name: 'VIP Oro' },
      { id: 'c-4', club_id: clubId, table_code: 'VIP-04', badge_number: '4', zone: 'Escenario VIP', capacity: 10, x: 75, y: 30, shape: 'circle', tier_color: '#eab308', tier_name: 'VIP Oro' },
      { id: 'c-5', club_id: clubId, table_code: 'M-05', badge_number: '5', zone: 'Pista de baile', capacity: 6, x: 25, y: 65, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista de baile' },
      { id: 'c-6', club_id: clubId, table_code: 'M-06', badge_number: '6', zone: 'Pista de baile', capacity: 6, x: 40, y: 70, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista de baile' },
      { id: 'c-7', club_id: clubId, table_code: 'M-07', badge_number: '7', zone: 'Pista de baile', capacity: 6, x: 60, y: 70, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista de baile' },
      { id: 'c-8', club_id: clubId, table_code: 'M-08', badge_number: '8', zone: 'Pista de baile', capacity: 6, x: 75, y: 65, shape: 'circle', tier_color: '#06b6d4', tier_name: 'Pista de baile' }
    ];
  }

  return templateTables.map((tmpl, idx) => ({
    ...tmpl,
    id: `tbl-${clubId.replace('club-', '')}-${idx + 1}-${Date.now().toString().slice(-4)}`,
    club_id: clubId
  }));
}

export function generateDefaultPricingsForTables(
  tables: ClubTable[],
  events: ClubEvent[]
): EventTablePricing[] {
  const pricings: EventTablePricing[] = [];
  events.forEach(evt => {
    tables.forEach(t => {
      pricings.push({
        event_id: evt.id,
        table_id: t.id,
        status: 'AVAILABLE',
        min_spend: t.capacity >= 12 ? 1100 : t.capacity >= 8 ? 800 : 450,
        deposit_required: t.capacity >= 12 ? 300 : t.capacity >= 8 ? 200 : 120,
        includes: [`${t.capacity} Pases VIP`, '1 Botella Premium']
      });
    });
  });
  return pricings;
}

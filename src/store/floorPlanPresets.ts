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

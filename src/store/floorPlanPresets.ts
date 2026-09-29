import type { ClubLayoutType, ClubTable, EventTablePricing, ClubEvent } from '../types';

export function generateArchetypeTables(
  clubId: string,
  presetType: ClubLayoutType,
  initialTables: ClubTable[]
): ClubTable[] {
  let templateTables: ClubTable[] = [];

  if (presetType === 'custom_open') {
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
  } else {
    let sourceClubId = 'club-sensorial';
    if (presetType === 'u_amphitheater') sourceClubId = 'club-velvet';
    if (presetType === 'downtown_suites') sourceClubId = 'club-rumaj';
    templateTables = initialTables.filter(t => t.club_id === sourceClubId);
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

import type { ClubTable, EventTablePricing, ClubEvent, ClubLayoutType, Club } from '../types';
import { generateArchetypeTables } from './floorPlanPresets';
import { INITIAL_TABLES } from '../data';

export function addTableOperation(
  tables: ClubTable[],
  eventPricing: EventTablePricing[],
  events: ClubEvent[],
  clubIdOrData: string | Omit<ClubTable, 'id'>,
  tableData?: Partial<ClubTable>,
  customPricing?: { min_spend?: number; deposit_required?: number; includes?: string[] }
): ClubTable {
  const newId = 'tbl-' + Date.now().toString().slice(-6);
  let table: ClubTable;
  if (typeof clubIdOrData === 'string') {
    table = {
      id: newId,
      club_id: clubIdOrData,
      table_code: tableData?.table_code || 'VIP-' + (tables.length + 1),
      zone: tableData?.zone || 'Escenario VIP',
      capacity: tableData?.capacity || 6,
      x: tableData?.x ?? 50,
      y: tableData?.y ?? 50,
      shape: tableData?.shape || 'circle'
    };
    if (tableData?.badge_number) table.badge_number = tableData.badge_number;
    if (tableData?.tier_color) table.tier_color = tableData.tier_color;
    if (tableData?.tier_name) table.tier_name = tableData.tier_name;
    if (tableData?.rotation !== undefined) table.rotation = tableData.rotation;
    if (tableData?.width !== undefined) table.width = tableData.width;
    if (tableData?.height !== undefined) table.height = tableData.height;
    if (tableData?.booking_mode) table.booking_mode = tableData.booking_mode;
    if (tableData?.is_active !== undefined) table.is_active = tableData.is_active;
  } else {
    table = { ...clubIdOrData, id: newId };
  }
  tables.push(table);

  const clubEvents = events.filter(e => e.club_id === table.club_id);
  clubEvents.forEach(evt => {
    eventPricing.push({
      event_id: evt.id,
      table_id: newId,
      status: 'AVAILABLE',
      min_spend: customPricing?.min_spend ?? (table.capacity >= 10 ? 1000 : 500),
      deposit_required: customPricing?.deposit_required ?? (table.capacity >= 10 ? 300 : 150),
      includes: customPricing?.includes ?? [`${table.capacity} Pases VIP`, '1 Botella']
    });
  });

  return table;
}

export function duplicateTableOperation(
  tables: ClubTable[],
  eventPricing: EventTablePricing[],
  events: ClubEvent[],
  tableId: string
): ClubTable | null {
  const source = tables.find(t => t.id === tableId);
  if (!source) return null;

  const newId = 'tbl-' + Date.now().toString().slice(-6);
  const clonedTable: ClubTable = {
    ...source,
    id: newId,
    table_code: `${source.table_code}-C`,
    x: Math.min(95, source.x + 3),
    y: Math.min(95, source.y + 3)
  };
  if (source.badge_number) {
    clonedTable.badge_number = `${source.badge_number}B`;
  } else {
    delete clonedTable.badge_number;
  }
  // Eliminar cualquier propiedad residual con valor undefined
  for (const [k, v] of Object.entries(clonedTable)) {
    if (v === undefined) {
      delete (clonedTable as unknown as Record<string, unknown>)[k];
    }
  }
  tables.push(clonedTable);

  const clubEvents = events.filter(e => e.club_id === source.club_id);
  clubEvents.forEach(evt => {
    const existingPricing = eventPricing.find(p => p.table_id === source.id && p.event_id === evt.id);
    eventPricing.push({
      event_id: evt.id,
      table_id: newId,
      status: 'AVAILABLE',
      min_spend: existingPricing?.min_spend ?? 600,
      deposit_required: existingPricing?.deposit_required ?? 150,
      includes: existingPricing?.includes ? [...existingPricing.includes] : [`${clonedTable.capacity} Pases VIP`]
    });
  });

  return clonedTable;
}

export function deleteTableOperation(
  tables: ClubTable[],
  eventPricing: EventTablePricing[],
  tableId: string
): { tables: ClubTable[]; eventPricing: EventTablePricing[] } {
  return {
    tables: tables.filter(t => t.id !== tableId),
    eventPricing: eventPricing.filter(p => p.table_id !== tableId)
  };
}

export function updateTablePositionHelper(tables: ClubTable[], tableId: string, x: number, y: number) {
  const table = tables.find(t => t.id === tableId);
  if (table) {
    table.x = Math.round(x * 10) / 10;
    table.y = Math.round(y * 10) / 10;
  }
}

export function batchUpdateTablePositionsHelper(tables: ClubTable[], updates: Array<{ id: string; x: number; y: number }>) {
  updates.forEach(u => {
    const table = tables.find(t => t.id === u.id);
    if (table) {
      table.x = Math.round(u.x * 10) / 10;
      table.y = Math.round(u.y * 10) / 10;
    }
  });
}

export function updateTablePropertiesHelper(tables: ClubTable[], tableId: string, updates: Partial<ClubTable>) {
  const table = tables.find(t => t.id === tableId);
  if (table) {
    const tableRec = table as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        tableRec[k] = v;
      } else {
        delete tableRec[k];
      }
    }
  }
}

export function updateTablePricingHelper(eventPricing: EventTablePricing[], tableId: string, eventId: string, updates: Partial<EventTablePricing>) {
  const pricing = eventPricing.find(p => p.table_id === tableId && p.event_id === eventId);
  if (pricing) {
    const pricingRec = pricing as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        pricingRec[k] = v;
      } else {
        delete pricingRec[k];
      }
    }
  }
}

export function updateTableHelper(
  tables: ClubTable[],
  eventPricing: EventTablePricing[],
  activeEventId: string,
  tableId: string,
  partial: Partial<ClubTable>,
  pricingPartial?: Partial<EventTablePricing>
) {
  const table = tables.find(t => t.id === tableId);
  if (table) {
    const tableRec = table as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        tableRec[k] = v;
      } else {
        delete tableRec[k];
      }
    }
  }
  if (pricingPartial) {
    const pricing = eventPricing.find(p => p.table_id === tableId && p.event_id === activeEventId);
    if (pricing) {
      const pricingRec = pricing as unknown as Record<string, unknown>;
      for (const [k, v] of Object.entries(pricingPartial)) {
        if (v !== undefined) {
          pricingRec[k] = v;
        } else {
          delete pricingRec[k];
        }
      }
    }
  }
}


export function applyArchetypePresetOperation(
  clubs: Club[],
  tables: ClubTable[],
  eventPricing: EventTablePricing[],
  events: ClubEvent[],
  clubId: string,
  presetType: ClubLayoutType
): { tables: ClubTable[]; eventPricing: EventTablePricing[]; club?: Club } {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return { tables, eventPricing };

  let filteredTables = tables.filter(t => t.club_id !== clubId);
  const clubEventIds = new Set(events.filter(e => e.club_id === clubId).map(e => e.id));
  let filteredPricing = eventPricing.filter(p => !clubEventIds.has(p.event_id));

  const newTables = generateArchetypeTables(clubId, presetType, INITIAL_TABLES);
  filteredTables.push(...newTables);

  const clubEvents = events.filter(e => e.club_id === clubId);
  clubEvents.forEach(evt => {
    newTables.forEach(tmpl => {
      filteredPricing.push({
        event_id: evt.id,
        table_id: tmpl.id,
        status: 'AVAILABLE',
        min_spend: tmpl.capacity >= 12 ? 1100 : tmpl.capacity >= 8 ? 800 : 450,
        deposit_required: tmpl.capacity >= 12 ? 300 : tmpl.capacity >= 8 ? 200 : 120,
        includes: [`${tmpl.capacity} Pases VIP`, '1 Botella Premium']
      });
    });
  });

  club.layout_type = presetType;
  return { tables: filteredTables, eventPricing: filteredPricing, club };
}

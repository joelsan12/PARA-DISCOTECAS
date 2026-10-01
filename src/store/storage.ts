import type {
  Club,
  ClubTable,
  EventTablePricing,
  Reservation,
  ViewRole,
  ClientUser,
  StaffUser
} from '../types';

export const STORAGE_KEYS = {
  TABLES: 'nightflow_tables_v6',
  PRICING: 'nightflow_pricing_v6',
  CLUBS: 'nightflow_clubs_v6',
  RESERVATIONS: 'nightflow_reservations_v6',
  ACTIVE_CLUB: 'nightflow_active_club_id_v6',
  ACTIVE_EVENT: 'nightflow_active_event_id_v6',
  CURRENT_ROLE: 'nightflow_current_role_v6',
  DASHBOARD_TAB: 'nightflow_dashboard_tab_v6',
  ARCHETYPE_PRESETS: 'nightflow_archetype_presets_v6',
  CLIENT_USER: 'nightflow_client_user_v6',
  STAFF_USER: 'nightflow_staff_user_v6',
  CLIENT_SUBTAB: 'nightflow_client_subtab_v6'
};

export interface LoadedStorageData {
  tables?: ClubTable[];
  pricing?: EventTablePricing[];
  clubs?: Club[];
  reservations?: Reservation[];
  activeClubId?: string;
  activeEventId?: string;
  currentRole?: ViewRole;
  dashboardTab?: string;
  customArchetypeLayouts?: Record<string, { tables: ClubTable[]; pricings?: EventTablePricing[] }>;
  clientUser?: ClientUser | null;
  staffUser?: StaffUser | null;
  clientSubTab?: 'MAP' | 'IDENTITY' | 'PASS' | 'CONCIERGE' | 'TIER';
}

export function loadStorageState(): LoadedStorageData {
  const result: LoadedStorageData = {};
  if (typeof window === 'undefined' || !window.localStorage) return result;

  try {
    const rawTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (rawTables) result.tables = JSON.parse(rawTables);

    const rawPricing = localStorage.getItem(STORAGE_KEYS.PRICING);
    if (rawPricing) result.pricing = JSON.parse(rawPricing);

    const rawClubs = localStorage.getItem(STORAGE_KEYS.CLUBS);
    if (rawClubs) result.clubs = JSON.parse(rawClubs);

    const rawRes = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (rawRes && import.meta.env.DEV) result.reservations = JSON.parse(rawRes);

    const storedClub = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLUB);
    if (storedClub) result.activeClubId = storedClub;

    const storedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    if (storedRole && ['CLIENT', 'CLUB_ADMIN', 'DOOR_CHECKIN', 'SUPER_ADMIN'].includes(storedRole)) {
      result.currentRole = storedRole as ViewRole;
    }

    const storedTab = localStorage.getItem(STORAGE_KEYS.DASHBOARD_TAB);
    if (storedTab) result.dashboardTab = storedTab;

    const storedPresets = localStorage.getItem(STORAGE_KEYS.ARCHETYPE_PRESETS);
    if (storedPresets) result.customArchetypeLayouts = JSON.parse(storedPresets);

    const storedEvent = localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT);
    if (storedEvent) result.activeEventId = storedEvent;

    const storedClient = localStorage.getItem(STORAGE_KEYS.CLIENT_USER);
    if (storedClient) result.clientUser = JSON.parse(storedClient);

    const storedStaff = localStorage.getItem(STORAGE_KEYS.STAFF_USER);
    if (storedStaff) result.staffUser = JSON.parse(storedStaff);

    const storedSubTab = localStorage.getItem(STORAGE_KEYS.CLIENT_SUBTAB);
    if (storedSubTab && ['MAP', 'IDENTITY', 'PASS', 'CONCIERGE', 'TIER'].includes(storedSubTab)) {
      result.clientSubTab = storedSubTab as 'MAP' | 'IDENTITY' | 'PASS' | 'CONCIERGE' | 'TIER';
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }

  return result;
}

export function applyLoadedStorageData(target: any, d: LoadedStorageData) {
  if (d.tables) target.tables = d.tables;
  if (d.pricing) target.eventPricing = d.pricing;
  if (d.clubs) target.clubs = d.clubs;
  if (d.reservations) target.reservations = d.reservations;
  if (d.activeClubId) target.activeClubId = d.activeClubId;
  if (d.currentRole) target.currentRole = d.currentRole;
  if (d.dashboardTab) target.dashboardTab = d.dashboardTab;
  if (d.customArchetypeLayouts) target.customArchetypeLayouts = d.customArchetypeLayouts;
  if (d.clientUser) target.clientUser = d.clientUser;
  if (d.staffUser) target.staffUser = d.staffUser;
  if (d.clientSubTab) target.clientSubTab = d.clientSubTab;

  const clubEvts = target.events.filter((e: any) => e.club_id === target.activeClubId);
  if (d.activeEventId && clubEvts.some((e: any) => e.id === d.activeEventId)) {
    target.activeEventId = d.activeEventId;
  } else if (clubEvts.length > 0) {
    target.activeEventId = clubEvts[0].id;
  }
}

export function saveStorageState(data: {

  tables: ClubTable[];
  eventPricing: EventTablePricing[];
  clubs: Club[];
  reservations: Reservation[];
  activeClubId: string;
  activeEventId: string;
  currentRole: ViewRole;
  dashboardTab: string;
  customArchetypeLayouts: Record<string, { tables: ClubTable[]; pricings?: EventTablePricing[] }>;
  clientUser: ClientUser | null;
  staffUser: StaffUser | null;
  clientSubTab: 'MAP' | 'IDENTITY' | 'PASS' | 'CONCIERGE' | 'TIER';
}) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(data.tables));
    localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(data.eventPricing));
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(data.clubs));
    if (import.meta.env.DEV) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(data.reservations));
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLUB, data.activeClubId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EVENT, data.activeEventId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, data.currentRole);
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_TAB, data.dashboardTab);
    localStorage.setItem(STORAGE_KEYS.ARCHETYPE_PRESETS, JSON.stringify(data.customArchetypeLayouts));

    if (data.clientUser) {
      localStorage.setItem(STORAGE_KEYS.CLIENT_USER, JSON.stringify(data.clientUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CLIENT_USER);
    }

    if (data.staffUser) {
      localStorage.setItem(STORAGE_KEYS.STAFF_USER, JSON.stringify(data.staffUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.STAFF_USER);
    }

    localStorage.setItem(STORAGE_KEYS.CLIENT_SUBTAB, data.clientSubTab);
  } catch (err) {
    console.warn('Error writing to localStorage:', err);
  }
}

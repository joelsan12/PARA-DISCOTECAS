import { useState, useEffect } from 'react';
import type {
  Club, ClubEvent, ClubTable, EventTablePricing, Reservation, AuditLog,
  Plan, SubscriptionPlanId, ViewRole, ClubLayoutType, ClientUser, StaffUser
} from '../types';
import {
  INITIAL_PLANS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_TABLES,
  INITIAL_EVENT_PRICING, INITIAL_RESERVATIONS, INITIAL_AUDIT_LOGS
} from '../data';
import { loadStorageState, saveStorageState, applyLoadedStorageData } from './storage';
import {
  cleanupExpiredHolds, holdTableOperation, releaseHoldOperation,
  confirmReservationOperation
} from './reservationManager';
import {
  addTableOperation, duplicateTableOperation, deleteTableOperation, applyArchetypePresetOperation,
  updateTablePositionHelper, batchUpdateTablePositionsHelper,
  updateTablePropertiesHelper, updateTablePricingHelper, updateTableHelper
} from './tableManager';
import { toggleClubStatusOperation, updateClubPlanOperation } from './tenantManager';
import { createAuditLogger } from './auditManager';
import { firebaseBridge } from './firebaseBridge';
import { callFunctions } from '../lib/functionsClient';
import { formatUsd } from '../lib/formatUsd';
import { esClubStatus, esLayout, esPlan } from '../lib/esLabels';

export { INITIAL_PLANS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_TABLES, INITIAL_EVENT_PRICING, INITIAL_RESERVATIONS, INITIAL_AUDIT_LOGS };

class ClubStore {
  clubs: Club[] = INITIAL_CLUBS;
  events: ClubEvent[] = INITIAL_EVENTS;
  tables: ClubTable[] = INITIAL_TABLES;
  eventPricing: EventTablePricing[] = INITIAL_EVENT_PRICING;
  reservations: Reservation[] = INITIAL_RESERVATIONS;
  plans: Plan[] = INITIAL_PLANS;
  private logger = createAuditLogger(INITIAL_AUDIT_LOGS);

  activeClubId: string = 'club-sensorial';
  activeEventId: string = 'event-fri-reggaeton';
  currentRole: ViewRole = 'CLIENT';
  dashboardTab: string = 'MONITOR';
  customArchetypeLayouts: Record<string, { tables: ClubTable[]; pricings?: EventTablePricing[] }> = {};
  clientUser: ClientUser | null = null;
  staffUser: StaffUser | null = null;
  clientSubTab: 'MAP' | 'IDENTITY' | 'PASS' | 'CONCIERGE' | 'TIER' = 'MAP';

  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
    this.cleanupExpiredHolds();
    this.initFirebase();
    if (typeof window !== 'undefined') setInterval(() => this.cleanupExpiredHolds(), 15000);
  }

  private initFirebase() {
    firebaseBridge.attachClubListeners(
      this.activeClubId,
      (remoteTables, layoutType) => {
        const others = this.tables.filter(t => t.club_id !== this.activeClubId);
        this.tables = [...others, ...remoteTables];
        if (layoutType) {
          const club = this.clubs.find(c => c.id === this.activeClubId);
          if (club) club.layout_type = layoutType;
        }
        this.saveToStorage();
        this.notify();
      }
    );
  }

  get auditLogs(): AuditLog[] { return this.logger.logs; }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  notify() { this.listeners.forEach(l => l()); }

  private persistAndNotify() {
    this.saveToStorage();
    this.notify();
  }

  loadFromStorage() { applyLoadedStorageData(this, loadStorageState()); }

  saveToStorage() {
    saveStorageState({
      tables: this.tables, eventPricing: this.eventPricing, clubs: this.clubs,
      reservations: this.reservations, activeClubId: this.activeClubId, activeEventId: this.activeEventId,
      currentRole: this.currentRole, dashboardTab: this.dashboardTab,
      customArchetypeLayouts: this.customArchetypeLayouts,
      clientUser: this.clientUser, staffUser: this.staffUser, clientSubTab: this.clientSubTab
    });
  }

  setClientSubTab(tab: 'MAP' | 'IDENTITY' | 'PASS' | 'CONCIERGE' | 'TIER') {
    this.clientSubTab = tab;
    this.persistAndNotify();
  }

  logoutClient() { this.clientUser = null; this.persistAndNotify(); }

  setBusinessPortalSession(businessId: string, user: ClientUser) {
    this.clientUser = user;
    this.clientSubTab = 'MAP';
    this.currentRole = 'CLIENT';
    if (this.activeClubId !== businessId) {
      this.activeClubId = businessId;
      const evts = this.events.filter(e => e.club_id === businessId);
      if (evts.length > 0) this.activeEventId = evts[0].id;
      this.initFirebase();
    }
    this.addAuditLog({
      club_id: businessId, actor: user.name, role: 'client', action: 'CLIENT_LOGIN',
      details: `Portal de cliente activo en ${businessId}`
    });
    this.persistAndNotify();
  }

  clearBusinessPortalSession() {
    this.clientUser = null;
    this.clientSubTab = 'MAP';
    this.persistAndNotify();
  }

  logoutStaff() { this.staffUser = null; this.persistAndNotify(); }

  persistNow(): boolean {
    const club = this.clubs.find(c => c.id === this.activeClubId);
    const clubTables = this.tables.filter(t => t.club_id === this.activeClubId);
    firebaseBridge.syncClubLayout(this.activeClubId, clubTables, club?.layout_type);
    this.persistAndNotify();
    return true;
  }

  resetToDefaults(clubId?: string) {
    if (clubId) {
      this.tables = [...this.tables.filter(t => t.club_id !== clubId), ...INITIAL_TABLES.filter(t => t.club_id === clubId)];
      const ids = new Set(this.events.filter(e => e.club_id === clubId).map(e => e.id));
      this.eventPricing = [...this.eventPricing.filter(p => !ids.has(p.event_id)), ...INITIAL_EVENT_PRICING.filter(p => ids.has(p.event_id))];
    } else {
      this.tables = [...INITIAL_TABLES]; this.eventPricing = [...INITIAL_EVENT_PRICING];
      this.clubs = [...INITIAL_CLUBS]; this.reservations = [...INITIAL_RESERVATIONS];
    }
    this.persistAndNotify();
  }

  setActiveClub(clubId: string) {
    this.activeClubId = clubId;
    const evts = this.events.filter(e => e.club_id === clubId);
    if (evts.length > 0) this.activeEventId = evts[0].id;
    this.initFirebase();
    this.persistAndNotify();
  }

  setActiveEvent(eventId: string) { this.activeEventId = eventId; this.persistAndNotify(); }
  /**
   * Sincroniza el rol activo exclusivamente con la verificación del servidor (AGENTS §10).
   * Lanzamiento controlado: este método está blindado y solo puede ser invocado
   * por el sincronizador interno del servicio de auth, no desde la interfaz.
   */
  setRole() { 
    throw new Error('AGENTS §10: La sincronización de roles está prohibida desde el cliente. Los privilegios se resuelven exclusivamente desde Firestore (businesses/{clubId}/staff/{uid}).'); 
  }
  setDashboardTab(tab: string) { this.dashboardTab = tab; this.persistAndNotify(); }
  cleanupExpiredHolds() { if (cleanupExpiredHolds(this.eventPricing)) this.persistAndNotify(); }

  holdTable(tableId: string, eventId: string, sessionId: string) {
    const res = holdTableOperation(this.eventPricing, tableId, eventId, sessionId);
    if (res.success) this.persistAndNotify();
    return res;
  }

  releaseHold(tableId: string, eventId: string) {
    if (releaseHoldOperation(this.eventPricing, tableId, eventId)) this.persistAndNotify();
  }

  confirmReservation(data: {
    club_id: string; event_id: string; table_id: string; customer_name: string; customer_phone: string;
    customer_email: string; guest_count: number; payment_method: 'credit_card' | 'transfer' | 'cash_door';
  }) {
    const res = confirmReservationOperation(this.eventPricing, this.tables, this.reservations, data);
    const table = this.tables.find(t => t.id === data.table_id);
    this.addAuditLog({
      club_id: data.club_id, actor: data.customer_name, role: 'client', action: 'RESERVATION_CONFIRMED',
      details: `Mesa ${table?.table_code || data.table_id} confirmada (${formatUsd(res.deposit_amount)})`
    });
    this.persistAndNotify();
    return res;
  }

  checkInReservation(_reservationId: string, _staffName: string = 'Personal de puerta'): { success: boolean; message: string } {
    // AGENTS §10 & §13: El check-in oficial se ejecuta exclusivamente vía Cloud Run door-service con validación criptográfica JWS
    throw new Error('AGENTS §13: El check-in no es modificable directamente desde el cliente. Use la terminal PWA de puerta con verificación JWS.');
  }

  updateTablePosition(tableId: string, x: number, y: number) { updateTablePositionHelper(this.tables, tableId, x, y); this.persistAndNotify(); }
  batchUpdateTablePositions(updates: Array<{ id: string; x: number; y: number }>) { batchUpdateTablePositionsHelper(this.tables, updates); this.persistAndNotify(); }
  updateTableProperties(tableId: string, updates: Partial<ClubTable>) { updateTablePropertiesHelper(this.tables, tableId, updates); this.persistAndNotify(); }

  updateTable(tableId: string, partial: Partial<ClubTable>, pricingPartial?: Partial<EventTablePricing>, skipNotify?: boolean) {
    updateTableHelper(this.tables, this.eventPricing, this.activeEventId, tableId, partial, pricingPartial);
    if (!skipNotify) this.persistAndNotify();
  }

  updateTablePricing(tableId: string, eventId: string, updates: Partial<EventTablePricing>) { updateTablePricingHelper(this.eventPricing, tableId, eventId, updates); this.persistAndNotify(); }
  updateEventTablePricing(eventId: string, tableId: string, minSpend: number, deposit: number) { this.updateTablePricing(tableId, eventId, { min_spend: minSpend, deposit_required: deposit }); }

  addTable(
    clubIdOrData: string | Omit<ClubTable, 'id'>,
    tableData?: Partial<ClubTable>,
    customPricing?: { min_spend?: number; deposit_required?: number; includes?: string[] }
  ) {
    const table = addTableOperation(this.tables, this.eventPricing, this.events, clubIdOrData, tableData, customPricing);
    this.persistAndNotify();
    return table;
  }

  duplicateTable(tableId: string) {
    const copy = duplicateTableOperation(this.tables, this.eventPricing, this.events, tableId);
    if (copy) this.persistAndNotify();
    return copy;
  }

  deleteTable(tableId: string) {
    const res = deleteTableOperation(this.tables, this.eventPricing, tableId);
    this.tables = res.tables; this.eventPricing = res.eventPricing;
    this.persistAndNotify();
  }

  applyArchetypePreset(clubId: string, presetType: ClubLayoutType) {
    const res = applyArchetypePresetOperation(this.clubs, this.tables, this.eventPricing, this.events, clubId, presetType);
    this.tables = res.tables;
    this.eventPricing = res.eventPricing;
    if (res.club) {
      this.addAuditLog({
        club_id: clubId, actor: 'Administrador del Club', role: 'club_owner', action: 'PRESET_APPLIED',
        details: `Arquetipo ${esLayout(presetType)} cargado en ${res.club.name}`
      });
    }
    this.persistAndNotify();
  }

  loadLayoutPreset(clubId: string, presetType: ClubLayoutType) { this.applyArchetypePreset(clubId, presetType); }

  async createClub(data: {
    name: string;
    city: string;
    plan_id: SubscriptionPlanId;
    whatsapp_number: string;
    businessType?: string;
    tagline?: string;
  }): Promise<Club> {
    const result = await callFunctions<{ businessId: string; directoryId: string; resourceIds: string[] }>(
      'createBusinessTenant',
      {
        name: data.name,
        city: data.city,
        planId: data.plan_id,
        whatsappNumber: data.whatsapp_number,
        businessType: data.businessType ?? 'NIGHTCLUB',
        tagline: data.tagline
      }
    );

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const newClub: Club = {
      id: result.businessId,
      slug,
      name: data.name,
      tagline: data.tagline || 'Experiencia nocturna de primer nivel',
      logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
      address: 'Zona de entretenimiento',
      city: data.city,
      instagram: '@' + slug,
      whatsapp_number: data.whatsapp_number,
      plan_id: data.plan_id,
      status: 'active',
      primary_color: '#a855f7',
      accent_color: '#06b6d4',
      created_at: new Date().toISOString().split('T')[0]
    };

    const newTables: ClubTable[] = result.resourceIds.map((resId, idx) => ({
      id: `${result.businessId}_${resId}`,
      club_id: result.businessId,
      table_code: resId.toUpperCase().replace('TBL_', ''),
      zone: resId.includes('vip') ? 'Zona VIP' : 'General',
      capacity: resId.includes('vip') ? 8 : 4,
      x: 20 + (idx % 3) * 30,
      y: 30 + Math.floor(idx / 3) * 30,
      rotation: 0,
      shape: 'circle',
      min_spend: resId.includes('vip') ? 150 : 80,
      is_active: true
    }));

    this.clubs = [newClub, ...this.clubs.filter(c => c.id !== newClub.id)];
    this.tables = [...this.tables, ...newTables];

    this.addAuditLog({
      actor: 'Superadministrador',
      role: 'super_admin',
      action: 'TENANT_CREATED',
      details: `Nuevo club aprovisionado en Firestore: ${newClub.name} (${result.businessId}) con ${result.resourceIds.length} mesas`
    });

    this.persistAndNotify();
    return newClub;
  }

  toggleClubStatus(clubId: string) {
    const club = toggleClubStatusOperation(this.clubs, clubId);
    if (club) {
      this.addAuditLog({
        club_id: clubId, actor: 'Superadministrador', role: 'super_admin',
        action: club.status === 'active' ? 'TENANT_REACTIVATED' : 'TENANT_SUSPENDED',
        details: `Club ${club.name}: estado ${esClubStatus(club.status)}`
      });
      this.persistAndNotify();
    }
  }

  updateClubPlan(clubId: string, newPlanId: SubscriptionPlanId) {
    const club = updateClubPlanOperation(this.clubs, clubId, newPlanId);
    if (club) {
      this.addAuditLog({
        club_id: clubId, actor: 'Superadministrador', role: 'super_admin', action: 'PLAN_CHANGED',
        details: `Plan de ${club.name} actualizado a ${esPlan(newPlanId)}`
      });
      this.persistAndNotify();
    }
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) { this.logger.add(log); }
}

export const clubStore = new ClubStore();

export function useClubStore() {
  const [, setTick] = useState(0);
  useEffect(() => { return clubStore.subscribe(() => setTick(t => t + 1)); }, []);
  return clubStore;
}

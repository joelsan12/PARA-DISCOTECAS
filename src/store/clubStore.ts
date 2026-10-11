import { useState, useEffect } from 'react';
import type {
  Club, ClubEvent, ClubTable, EventTablePricing, Reservation, AuditLog,
  Plan, SubscriptionPlanId, ViewRole, ClubLayoutType, ClientUser, StaffUser,
  ClubProposal, CustomClubFeature, ProposalStatus
} from '../types';
import {
  INITIAL_PLANS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_TABLES,
  INITIAL_EVENT_PRICING, INITIAL_RESERVATIONS, INITIAL_AUDIT_LOGS, INITIAL_PROPOSALS
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
import { toggleClubStatusOperation, updateClubPlanOperation, updateClubLegalProfileOperation, updateClubDetailsOperation } from './tenantManager';
import { createAuditLogger } from './auditManager';
import { firebaseBridge } from './firebaseBridge';
import { fetchBusinessLegalProfile } from '../services/firebaseService';
import type { LegalProfile } from '../lib/legalProfile';
import { callFunctions } from '../lib/functionsClient';
import { formatUsd } from '../lib/formatUsd';
import { esClubStatus, esLayout, esPlan } from '../lib/esLabels';

export { INITIAL_PLANS, INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_TABLES, INITIAL_EVENT_PRICING, INITIAL_RESERVATIONS, INITIAL_AUDIT_LOGS, INITIAL_PROPOSALS };

class ClubStore {
  clubs: Club[] = INITIAL_CLUBS;
  events: ClubEvent[] = INITIAL_EVENTS;
  tables: ClubTable[] = INITIAL_TABLES;
  eventPricing: EventTablePricing[] = INITIAL_EVENT_PRICING;
  reservations: Reservation[] = import.meta.env.DEV ? INITIAL_RESERVATIONS : [];
  plans: Plan[] = INITIAL_PLANS;
  proposals: ClubProposal[] = INITIAL_PROPOSALS;
  private logger = createAuditLogger(import.meta.env.DEV ? INITIAL_AUDIT_LOGS : []);

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
    void this.hydrateLegalProfile(this.activeClubId);
  }

  /**
   * Hidrata la identidad legal del negocio desde el subdoc público de
   * Firestore (Fase B) para que el checkout muestre al vendedor real.
   * Silencioso: sin sesión, sin documento o con reglas que rechazan la lectura,
   * el checkout conserva los respaldos visibles.
   */
  private async hydrateLegalProfile(clubId: string) {
    const profile = await fetchBusinessLegalProfile(clubId);
    if (!profile || this.activeClubId !== clubId) return;
    const club = this.clubs.find(c => c.id === clubId);
    if (!club) return;
    club.legal_profile = profile;
    this.saveToStorage();
    this.notify();
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
      plans: this.plans, proposals: this.proposals,
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

  logoutClient() { this.clientUser = null; this.currentRole = 'CLIENT'; this.persistAndNotify(); }

  setBusinessPortalSession(businessId: string, user: ClientUser) {
    this.clientUser = user;
    this.clientSubTab = 'MAP';
    this.currentRole = 'CLIENT';
    const matchingClub = this.clubs.find(c => c.id === businessId || c.slug === businessId);
    const resolvedClubId = matchingClub ? matchingClub.id : businessId;
    if (this.activeClubId !== resolvedClubId) {
      this.activeClubId = resolvedClubId;
      const evts = this.events.filter(e => e.club_id === resolvedClubId);
      if (evts.length > 0) this.activeEventId = evts[0].id;
      this.initFirebase();
    }
    this.addAuditLog({
      club_id: resolvedClubId, actor: user.name, role: 'client', action: 'CLIENT_LOGIN',
      details: `Portal de cliente activo en ${resolvedClubId}`
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
      this.clubs = [...INITIAL_CLUBS]; this.reservations = import.meta.env.DEV ? [...INITIAL_RESERVATIONS] : [];
    }
    this.persistAndNotify();
  }

  registerClubFromRemote(clubData: Partial<Club> & { id: string }) {
    const existingIndex = this.clubs.findIndex(c => c.id === clubData.id);
    if (existingIndex >= 0) {
      this.clubs[existingIndex] = { ...this.clubs[existingIndex], ...clubData };
    } else {
      const newClub: Club = {
        id: clubData.id,
        name: clubData.name || 'Mi Establecimiento',
        slug: clubData.slug || clubData.id,
        city: clubData.city || 'Ecuador',
        tagline: clubData.tagline || 'Sala VIP & Club',
        logo: clubData.logo || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
        banner: clubData.banner || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200',
        address: clubData.address || 'Zona de entretenimiento',
        instagram: clubData.instagram || '@' + (clubData.slug || 'nightflow'),
        whatsapp_number: clubData.whatsapp_number || '',
        status: clubData.status || 'active',
        plan_id: clubData.plan_id || 'beta_vip',
        enabled_features: clubData.enabled_features,
        custom_features: clubData.custom_features,
        layout_type: clubData.layout_type || 'horseshoe_vip',
        primary_color: clubData.primary_color || '#e5b54f',
        accent_color: clubData.accent_color || '#06b6d4',
        created_at: clubData.created_at || new Date().toISOString().split('T')[0]
      };
      this.clubs.push(newClub);
    }
    this.persistAndNotify();
  }

  setActiveClub(clubId: string) {
    this.activeClubId = clubId;
    const evts = this.events.filter(e => e.club_id === clubId);
    this.activeEventId = evts.length > 0 ? evts[0].id : '';
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
      id: resId,
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
      details: `Nuevo club aprovisionado en Firestore: ${newClub.name} (${result.businessId}) con sala limpia (0 mesas iniciales)`
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

  submitClubProposal(proposalData: {
    club_id: string;
    club_name: string;
    requested_plan_id?: SubscriptionPlanId;
    title: string;
    description: string;
    proposed_benefit: string;
  }): ClubProposal {
    const newProp: ClubProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      club_id: proposalData.club_id,
      club_name: proposalData.club_name,
      requested_plan_id: proposalData.requested_plan_id,
      title: proposalData.title.trim(),
      description: proposalData.description.trim(),
      proposed_benefit: proposalData.proposed_benefit.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.proposals = [newProp, ...this.proposals];
    this.addAuditLog({
      club_id: proposalData.club_id,
      actor: 'Administrador del Club',
      role: 'club_owner',
      action: 'PROPOSAL_SUBMITTED',
      details: `Propuesta "${newProp.title}" enviada al equipo de desarrollo`
    });
    this.persistAndNotify();
    return newProp;
  }

  updateProposalStatus(proposalId: string, status: ProposalStatus, devResponse?: string) {
    const prop = this.proposals.find(p => p.id === proposalId);
    if (!prop) return;
    prop.status = status;
    prop.updated_at = new Date().toISOString();
    if (devResponse !== undefined) prop.dev_response = devResponse;
    this.addAuditLog({
      club_id: prop.club_id,
      actor: 'Desarrollador (SuperAdmin)',
      role: 'super_admin',
      action: 'PROPOSAL_STATUS_CHANGED',
      details: `Propuesta "${prop.title}" marcada como ${status}`
    });
    this.persistAndNotify();
  }

  activateCustomFeatureForClub(
    clubId: string,
    featureData: { name: string; key: string; description: string; notes?: string },
    proposalId?: string
  ) {
    const club = this.clubs.find(c => c.id === clubId);
    if (!club) return;
    if (!club.custom_features) club.custom_features = [];

    const existingIdx = club.custom_features.findIndex(f => f.key === featureData.key);
    const feature: CustomClubFeature = {
      id: existingIdx >= 0 ? club.custom_features[existingIdx].id : `feat-${Date.now()}`,
      name: featureData.name.trim(),
      key: featureData.key.trim().toUpperCase(),
      description: featureData.description.trim(),
      enabled: true,
      activated_at: new Date().toISOString(),
      activated_by: 'Desarrollador (SuperAdmin)',
      notes: featureData.notes?.trim()
    };

    if (existingIdx >= 0) {
      club.custom_features[existingIdx] = feature;
    } else {
      club.custom_features.push(feature);
    }

    if (proposalId) {
      const prop = this.proposals.find(p => p.id === proposalId);
      if (prop) {
        prop.status = 'IMPLEMENTED';
        prop.updated_at = new Date().toISOString();
        prop.dev_response = `Módulo "${feature.name}" implementado y activado exclusivamente para ${club.name}.`;
        prop.activated_feature = feature;
      }
    }

    this.addAuditLog({
      club_id: clubId,
      actor: 'Desarrollador (SuperAdmin)',
      role: 'super_admin',
      action: 'CUSTOM_FEATURE_ACTIVATED',
      details: `Beneficio exclusivo "${feature.name}" activado únicamente para ${club.name}`
    });
    this.persistAndNotify();
  }

  toggleCustomFeatureForClub(clubId: string, featureKey: string, enabled: boolean) {
    const club = this.clubs.find(c => c.id === clubId);
    if (!club || !club.custom_features) return;
    const feat = club.custom_features.find(f => f.key === featureKey);
    if (feat) {
      feat.enabled = enabled;
      this.addAuditLog({
        club_id: clubId,
        actor: 'Desarrollador (SuperAdmin)',
        role: 'super_admin',
        action: enabled ? 'CUSTOM_FEATURE_ENABLED' : 'CUSTOM_FEATURE_DISABLED',
        details: `Beneficio exclusivo "${feat.name}" ${enabled ? 'reactivado' : 'pausado'} para ${club.name}`
      });
      this.persistAndNotify();
    }
  }


  /**
   * Actualiza la identidad legal del negocio (Fase B). La fuente de verdad es
   * la callable updateBusinessLegalProfile (Admin SDK, rol manager+ o
   * superadmin); si el negocio aún no está aprovisionado en la nube o el
   * backend no responde, se persiste localmente y se devuelve 'local' para que
   * la interfaz lo declare explícitamente.
   */
  async updateClubLegalProfile(clubId: string, profile: LegalProfile): Promise<'synced' | 'local'> {
    let syncResult: 'synced' | 'local' = 'local';
    try {
      await callFunctions('updateBusinessLegalProfile', {
        businessId: clubId,
        legalName: profile.legalName,
        ruc: profile.ruc,
        taxAddress: profile.taxAddress,
        supportEmail: profile.supportEmail,
        ...(profile.supportPhone ? { supportPhone: profile.supportPhone } : {}),
        ...(profile.refundPolicyUrl ? { refundPolicyUrl: profile.refundPolicyUrl } : {}),
        ...(profile.termsAndConditionsUrl ? { termsAndConditionsUrl: profile.termsAndConditionsUrl } : {})
      });
      syncResult = 'synced';
    } catch (error) {
      console.warn('[LegalProfile] Sin sincronización con el servidor; guardando localmente:', error);
    }
    const club = updateClubLegalProfileOperation(this.clubs, clubId, profile);
    if (club) {
      this.addAuditLog({
        club_id: clubId, actor: 'Administrador del Club', role: 'club_owner', action: 'LEGAL_PROFILE_UPDATED',
        details: `Identidad legal de ${club.name} actualizada (${syncResult === 'synced' ? 'sincronizada con la nube' : 'solo en este dispositivo'})`
      });
      this.persistAndNotify();
    }
    return syncResult;
  }

  updateClubDetails(clubId: string, updates: Partial<Club>): Club | undefined {
    const club = updateClubDetailsOperation(this.clubs, clubId, updates);
    if (club) {
      this.addAuditLog({
        club_id: clubId,
        actor: 'Superadministrador',
        role: 'super_admin',
        action: 'TENANT_UPDATED',
        details: `Detalles de ${club.name} actualizados por SuperAdmin`
      });
      this.persistAndNotify();
    }
    return club;
  }

  updatePlan(planId: string, updates: Partial<Plan>): Plan | undefined {
    const plan = this.plans.find(p => p.id === planId);
    if (plan) {
      Object.assign(plan, updates);
      this.addAuditLog({
        actor: 'Superadministrador',
        role: 'super_admin',
        action: 'PLAN_MODIFIED',
        details: `Plan ${plan.name} (${planId}) actualizado: USD ${plan.monthly_price}/mes`
      });
      this.persistAndNotify();
    }
    return plan;
  }

  addPlan(newPlan: Plan): Plan {
    if (this.plans.some(p => p.id === newPlan.id)) {
      throw new Error(`Ya existe un plan con el identificador "${newPlan.id}".`);
    }
    this.plans = [...this.plans, newPlan];
    this.addAuditLog({
      actor: 'Superadministrador',
      role: 'super_admin',
      action: 'PLAN_CREATED',
      details: `Nuevo plan creado: ${newPlan.name} (${formatUsd(newPlan.monthly_price)}/mes)`
    });
    this.persistAndNotify();
    return newPlan;
  }

  deletePlan(planId: string): boolean {
    const isUsed = this.clubs.some(c => c.plan_id === planId);
    if (isUsed) {
      throw new Error(`No se puede eliminar el plan "${planId}" porque tiene discotecas clientes asignadas.`);
    }
    this.plans = this.plans.filter(p => p.id !== planId);
    this.addAuditLog({
      actor: 'Superadministrador',
      role: 'super_admin',
      action: 'PLAN_DELETED',
      details: `Plan "${planId}" retirado del catálogo global`
    });
    this.persistAndNotify();
    return true;
  }

  platformRevocationVersion: number = 2;

  incrementRevocationVersion(clubId?: string): number {
    this.platformRevocationVersion += 1;
    this.addAuditLog({
      club_id: clubId,
      actor: 'Superadministrador',
      role: 'super_admin',
      action: 'PLATFORM_PANIC_REVOCATION',
      details: clubId
        ? `Revocación de emergencia para club ${clubId}: versión incrementada a ${this.platformRevocationVersion} (AGENTS §8)`
        : `Revocación global de sesiones y pases: versión incrementada a ${this.platformRevocationVersion} (AGENTS §8)`
    });
    this.persistAndNotify();
    return this.platformRevocationVersion;
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) { this.logger.add(log); }
}

export const clubStore = new ClubStore();

export function useClubStore() {
  const [, setTick] = useState(0);
  useEffect(() => { return clubStore.subscribe(() => setTick(t => t + 1)); }, []);
  return clubStore;
}

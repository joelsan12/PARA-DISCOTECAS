import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { clubStore } from '../store/clubStore';
import type { ClubTable, Reservation, TableZone } from '../types';

export type OperationalTableState = 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'INSIDE' | 'SETTLED';

export interface OperationalTableItem {
  resourceId: string;
  tableCode: string;
  zone: TableZone | string;
  capacity: number;
  minSpend: number;
  depositRequired: number;
  isActive: boolean;
  state: OperationalTableState;
  activeHoldId?: string | null;
  activeReservationId?: string | null;
  reservation?: Reservation | null;
  attendanceState?: 'INSIDE' | 'OUTSIDE_TEMPORARY' | 'ABSENT';
  guestName?: string;
  partySize?: number;
  tableTab?: {
    reservationId: string;
    subtotal: number;
    depositAmount: number;
    minSpend: number;
    status: 'OPEN' | 'SETTLED';
    itemsCount: number;
    settlementMethod?: string | null;
  } | null;
  consumptionTotal?: number;
  tabStatus?: 'OPEN' | 'SETTLED';
}

export interface OperationsSubscriptionOptions {
  businessId: string;
  eventId?: string;
  onUpdate: (tables: OperationalTableItem[], reservations: Reservation[]) => void;
  onError?: (error: Error) => void;
}

export function deriveTableOperationalState(
  resource: {
    status?: string;
    activeHoldId?: string | null;
    holdExpiresAt?: string | null;
    activeReservationId?: string | null;
    is_active?: boolean;
    active?: boolean;
  },
  reservation?: { status?: string; id?: string } | null,
  attendanceSession?: { state?: string } | null,
  tableTab?: { status?: string } | null
): OperationalTableState {
  // 1. Si la mesa está liquidada (tab SETTLED)
  if (tableTab?.status === 'SETTLED') {
    return 'SETTLED';
  }

  // 2. Si hay sesión de asistencia en puerta y el cliente ya ingresó
  if (attendanceSession?.state === 'INSIDE' || attendanceSession?.state === 'OUTSIDE_TEMPORARY') {
    return 'INSIDE';
  }

  // 3. Si hay reserva confirmada
  const isReservationConfirmed = reservation && (
    reservation.status === 'CONFIRMED' ||
    reservation.status === 'PAID' ||
    reservation.status === 'CHECKED_IN'
  );
  if (isReservationConfirmed || resource.activeReservationId) {
    if (reservation?.status === 'CHECKED_IN') return 'INSIDE';
    return 'CONFIRMED';
  }

  // 4. Si hay un hold activo y vigente
  const hasValidHold = Boolean(
    resource.activeHoldId &&
    (!resource.holdExpiresAt || new Date(resource.holdExpiresAt).getTime() > Date.now())
  );
  if (hasValidHold || resource.status === 'HELD') {
    return 'HELD';
  }

  return 'AVAILABLE';
}

export function subscribeOperations(options: OperationsSubscriptionOptions): Unsubscribe {
  const { businessId, eventId, onUpdate, onError } = options;

  // Fallback dev si Firebase no está configurado
  if (!isFirebaseConfigured || !db || !businessId) {
    const clubTables = clubStore.tables.filter((t: ClubTable) => t.club_id === businessId);
    const storeReservations = clubStore.reservations.filter((r: Reservation) => r.club_id === businessId);
    const storePricings = clubStore.eventPricing;

    const fallbackItems: OperationalTableItem[] = clubTables.map((t: ClubTable) => {
      const res = storeReservations.find((r: Reservation) => r.table_id === t.id && (!eventId || r.event_id === eventId));
      const pricing = storePricings.find((p) => p.table_id === t.id && (!eventId || p.event_id === eventId));
      let state: OperationalTableState = 'AVAILABLE';
      if (res) {
        state = res.status === 'CONFIRMED' ? 'CONFIRMED' : res.status === 'HELD' ? 'HELD' : 'AVAILABLE';
      }

      return {
        resourceId: t.id,
        tableCode: t.table_code,
        zone: t.zone,
        capacity: t.capacity,
        minSpend: pricing?.min_spend || 0,
        depositRequired: pricing?.deposit_required || 0,
        isActive: t.is_active !== false,
        state,
        activeReservationId: res?.id || null,
        reservation: res || null,
        guestName: res?.customer_name,
        partySize: res?.guest_count
      };
    });

    onUpdate(fallbackItems, storeReservations);
    return () => {};
  }

  // En producción: cuádruple onSnapshot unificado (resources, reservations, sessions, tableTabs)
  let resourcesData: Array<Record<string, unknown>> = [];
  let reservationsData: Array<Record<string, unknown>> = [];
  let sessionsData: Map<string, Record<string, unknown>> = new Map();
  let tabsData: Map<string, Record<string, unknown>> = new Map();

  function recalculateAndNotify() {
    try {
      const resourcesById = new Map<string, Record<string, unknown>>();
      for (const res of resourcesData) {
        const id = (res.resourceId || res.id) as string;
        if (id) resourcesById.set(id, res);
      }

      const reservationsByResource = new Map<string, Record<string, unknown>>();
      for (const res of reservationsData) {
        const resId = (res.resourceId || res.resource_id || res.tableId || res.table_id || res.id) as string;
        if (resId) {
          reservationsByResource.set(resId, res);
        }
      }

      const operationalTables: OperationalTableItem[] = resourcesData
        .filter((r) => r.is_active !== false && r.active !== false)
        .map((resData) => {
        const resourceId = (resData.resourceId || resData.id) as string;
        const matchingReservation = reservationsByResource.get(resourceId);

        // Buscar sesión de asistencia por ID de reserva o ID de ticket
        const ticketId = matchingReservation
          ? ((matchingReservation.ticketId || matchingReservation.reservationId || matchingReservation.id) as string)
          : resourceId;
        const matchingSession = ticketId ? sessionsData.get(ticketId) : null;

        // Buscar cuenta de consumo (tableTab) por reservationId
        const resIdKey = matchingReservation
          ? ((matchingReservation.id || matchingReservation.reservationId) as string)
          : null;
        const matchingTab = resIdKey ? tabsData.get(resIdKey) : null;

        const state = deriveTableOperationalState(
          resData as any,
          matchingReservation as any,
          matchingSession as any,
          matchingTab as any
        );

        const tableCode = (resData.label || resData.name || resourceId) as string;
        const zone = (resData.zone || 'VIP') as TableZone | string;
        const capacity = Number(resData.capacity) || 4;
        const minSpend = Number(resData.minSpendDefault ?? resData.minSpend ?? 0);
        const depositRequired = Number(resData.depositRequired ?? resData.holdAmount ?? 0);
        const isActive = resData.is_active !== false && resData.active !== false;

        const customerName = matchingReservation
          ? (matchingReservation.customerName || matchingReservation.customer_name || matchingReservation.displayName) as string | undefined
          : undefined;

        const partySize = matchingReservation
          ? Number(matchingReservation.guests_count || matchingReservation.partySize || capacity)
          : undefined;

        const rawSubtotal = matchingTab ? Number(matchingTab.subtotal || 0) : 0;
        const tabStatus = matchingTab ? ((matchingTab.status as 'OPEN' | 'SETTLED') || 'OPEN') : undefined;
        const itemsCount = matchingTab && Array.isArray(matchingTab.items) ? matchingTab.items.length : 0;

        return {
          resourceId,
          tableCode,
          zone,
          capacity,
          minSpend,
          depositRequired,
          isActive,
          state,
          activeHoldId: (resData.activeHoldId as string) || null,
          activeReservationId: matchingReservation ? ((matchingReservation.id || matchingReservation.reservationId) as string) : null,
          reservation: matchingReservation as unknown as Reservation | null,
          attendanceState: matchingSession?.state as 'INSIDE' | 'OUTSIDE_TEMPORARY' | 'ABSENT' | undefined,
          guestName: customerName,
          partySize,
          consumptionTotal: rawSubtotal,
          tabStatus,
          tableTab: matchingTab ? {
            reservationId: resIdKey || '',
            subtotal: rawSubtotal,
            depositAmount: Number(matchingTab.depositAmount ?? depositRequired),
            minSpend: Number(matchingTab.minSpend ?? minSpend),
            status: tabStatus || 'OPEN',
            itemsCount,
            settlementMethod: (matchingTab.settlementMethod as string | null) ?? null
          } : null
        };
      });

      // Normalizar lista completa de reservas para bitácoras y tablas de administración
      const normalizedReservations: Reservation[] = reservationsData.map((docData) => {
        const id = (docData.id || docData.reservationId || docData.holdId || 'res_unknown') as string;
        const resId = (docData.resourceId || docData.resource_id || docData.tableId || docData.table_id || '') as string;
        const matchedResource = resId ? resourcesById.get(resId) : undefined;
        const tableCode = (docData.table_code || docData.tableCode || matchedResource?.label || matchedResource?.name || resId || 'Mesa') as string;
        const zone = (docData.zone || matchedResource?.zone || 'VIP') as TableZone;
        const code = (docData.code || docData.reservationCode || id.slice(-6).toUpperCase()) as string;

        const createdIso = docData.createdAt && typeof (docData.createdAt as any).toDate === 'function'
          ? (docData.createdAt as any).toDate().toISOString()
          : (docData.created_at || docData.createdAt || new Date().toISOString()) as string;

        return {
          id,
          code,
          club_id: (docData.businessId || docData.club_id || businessId) as string,
          event_id: (docData.eventId || docData.event_id || eventId || '') as string,
          table_id: resId,
          table_code: tableCode,
          zone,
          customer_name: (docData.customer_name || docData.customerName || docData.displayName || 'Invitado VIP') as string,
          customer_phone: (docData.customer_phone || docData.customerPhone || docData.phone || '') as string,
          customer_email: (docData.customer_email || docData.customerEmail || docData.email || '') as string,
          guest_count: Number(docData.guest_count || docData.guests_count || docData.partySize || matchedResource?.capacity || 4),
          deposit_amount: Number(docData.deposit_amount || docData.depositAmount || docData.amount || 0),
          min_spend: Number(docData.min_spend || docData.minSpend || matchedResource?.minSpendDefault || 0),
          status: (docData.status as any) || 'CONFIRMED',
          payment_method: (docData.payment_method || docData.paymentProvider || 'transfer') as any,
          payment_status: docData.paymentState === 'PAID' ? 'paid' : (docData.payment_status as any) || 'pending',
          paymentState: docData.paymentState as string | undefined,
          refundStatus: docData.refundStatus as string | undefined,
          qr_token: (docData.qr_token || docData.qrToken || id) as string,
          hold_expires_at: docData.hold_expires_at ? Number(docData.hold_expires_at) : (docData.expiresAt ? new Date(docData.expiresAt as any).getTime() : 0),
          checked_in_at: (docData.checked_in_at || docData.checkedInAt) as string | undefined,
          created_at: createdIso
        };
      });

      onUpdate(operationalTables, normalizedReservations);
    } catch (err) {
      if (onError && err instanceof Error) onError(err);
      else console.error('[OperationsService] Error calculando estado:', err);
    }
  }

  // 1. Suscribirse a resources
  const resourcesRef = collection(db, 'businesses', businessId, 'resources');
  const unsubResources = onSnapshot(
    resourcesRef,
    (snapshot) => {
      resourcesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      recalculateAndNotify();
    },
    (err) => {
      console.warn('[OperationsService] Error en snapshot de resources:', err);
      if (onError) onError(err);
    }
  );

  // 2. Suscribirse a reservations
  const reservationsRef = collection(db, 'businesses', businessId, 'reservations');
  const reservationsQuery = eventId
    ? query(reservationsRef, where('eventId', '==', eventId))
    : reservationsRef;

  const unsubReservations = onSnapshot(
    reservationsQuery,
    (snapshot) => {
      reservationsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      recalculateAndNotify();
    },
    (err) => {
      console.warn('[OperationsService] Error en snapshot de reservations:', err);
      if (onError) onError(err);
    }
  );

  // 3. Suscribirse a attendanceSessions
  const sessionsRef = collection(db, 'businesses', businessId, 'attendanceSessions');
  const unsubSessions = onSnapshot(
    sessionsRef,
    (snapshot) => {
      const nextMap = new Map<string, Record<string, unknown>>();
      for (const doc of snapshot.docs) {
        nextMap.set(doc.id, doc.data());
      }
      sessionsData = nextMap;
      recalculateAndNotify();
    },
    (err) => {
      console.warn('[OperationsService] Error en snapshot de attendanceSessions:', err);
      if (onError) onError(err);
    }
  );

  // 4. Suscribirse a tableTabs (Consumos y Cierres en vivo)
  const tabsRef = collection(db, 'businesses', businessId, 'tableTabs');
  const unsubTabs = onSnapshot(
    tabsRef,
    (snapshot) => {
      const nextMap = new Map<string, Record<string, unknown>>();
      for (const doc of snapshot.docs) {
        nextMap.set(doc.id, doc.data());
      }
      tabsData = nextMap;
      recalculateAndNotify();
    },
    (err) => {
      console.warn('[OperationsService] Error en snapshot de tableTabs:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubResources();
    unsubReservations();
    unsubSessions();
    unsubTabs();
  };
}

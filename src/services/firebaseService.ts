import {
  collection, doc, getDoc, setDoc, onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { parseLegalProfileDocument, type LegalProfile } from '../lib/legalProfile';
import { callFunctions } from '../lib/functionsClient';
import type { ClubTable, ClubLayoutType, ClubEvent } from '../types';

export function subscribeToClubLayout(
  clubId: string,
  onUpdate: (data: { tables?: ClubTable[]; layout_type?: ClubLayoutType }) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const layoutRef = doc(db, 'businesses', clubId, 'layout', 'main');
    return onSnapshot(layoutRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          tables: (Array.isArray(data.tables) ? data.tables : []) as ClubTable[],
          layout_type: (data.layout_type || 'custom_open') as ClubLayoutType
        });
      } else {
        onUpdate({
          tables: [],
          layout_type: 'custom_open'
        });
      }
    }, (err) => {
      console.warn('[Firebase] Error en suscripción de plano de club:', err);
    });
  } catch (err) {
    console.warn('[Firebase] Excepción al suscribir a plano:', err);
    return null;
  }
}

export interface SaveClubLayoutResult {
  success: boolean;
  inventorySynced?: boolean;
  error?: string;
}

/**
 * Elimina recursivamente cualquier clave con valor 'undefined'
 * para evitar que Firestore rechace la operación con:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
function removeUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(removeUndefinedDeep) as unknown as T;
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        result[key] = removeUndefinedDeep(val);
      }
    }
    return result as T;
  }
  return value;
}

export async function saveClubLayoutToFirebase(
  clubId: string,
  tables: ClubTable[],
  layoutType?: ClubLayoutType
): Promise<SaveClubLayoutResult> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, error: 'Firebase no está configurado' };
  }

  try {
    const layoutRef = doc(db, 'businesses', clubId, 'layout', 'main');

    // Sanitización profunda: limpiar cualquier clave con valor undefined
    const sanitizedTables = tables.map((t) => {
      const clean: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(t)) {
        if (val !== undefined) {
          clean[key] = val;
        }
      }
      return clean;
    });

    const payload = removeUndefinedDeep({
      businessId: clubId,
      tables: sanitizedTables,
      layout_type: layoutType || 'custom_open',
      updated_at: new Date().toISOString()
    });

    await setDoc(layoutRef, payload, { merge: true });

    // O.0.3: Sincronización one-way hacia inventario operativo (businesses/{id}/resources/{id})
    let inventorySynced = false;
    try {
      const operationalTables = tables.map(t => ({
        id: t.id,
        table_code: t.table_code,
        zone: t.zone,
        capacity: t.capacity,
        min_spend: (t as unknown as { min_spend?: number; minSpendDefault?: number }).min_spend ?? (t as unknown as { minSpendDefault?: number }).minSpendDefault ?? 0,
        deposit_required: (t as unknown as { deposit_required?: number; depositRequired?: number }).deposit_required ?? (t as unknown as { depositRequired?: number }).depositRequired ?? 0,
        is_active: (t as unknown as { is_active?: boolean }).is_active !== false
      }));

      await callFunctions('syncFloorPlanInventory', {
        businessId: clubId,
        tables: operationalTables
      });
      inventorySynced = true;
    } catch (invErr) {
      console.warn('[Firebase] Warning: no se pudo sincronizar inventario de recursos automáticamente:', invErr);
      return {
        success: true,
        inventorySynced: false,
        error: invErr instanceof Error ? invErr.message : 'Error sincronizando inventario'
      };
    }

    return { success: true, inventorySynced };
  } catch (err) {
    console.error('[Firebase] Error al guardar plano en Firestore:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error al guardar plano' };
  }
}

/**
 * Lee la identidad legal pública del negocio (Fase B) desde el subdocumento
 * businesses/{id}/public/legalProfile, que las reglas solo permiten leer con
 * sesión activa. Devuelve null si no existe, no hay sesión o el documento no
 * supera la validación estructural.
 */
export async function fetchBusinessLegalProfile(clubId: string): Promise<LegalProfile | null> {
  if (!isFirebaseConfigured || !db || !clubId) return null;
  try {
    const snapshot = await getDoc(doc(db, 'businesses', clubId, 'public', 'legalProfile'));
    if (!snapshot.exists()) return null;
    return parseLegalProfileDocument(snapshot.data());
  } catch {
    return null;
  }
}

export function subscribeToBusinessEvents(
  clubId: string,
  onUpdate: (events: ClubEvent[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db || !clubId) return null;

  try {
    const eventsRef = collection(db, 'businesses', clubId, 'events');
    return onSnapshot(eventsRef, (snapshot) => {
      const events: ClubEvent[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        events.push({
          id: docSnap.id,
          club_id: clubId,
          title: data.title || 'Evento Especial',
          subtitle: data.subtitle || '',
          date: data.date || '',
          day_label: data.day_label || data.date || '',
          door_time: data.door_time || '22:00',
          cover_price: Number(data.cover_price) || 0,
          dj_guest: data.dj_guest || '',
          genre: data.genre || '',
          flyer_url: data.flyer_url || '',
          is_published: data.is_published === true,
          experience_type: data.experience_type,
          floor_plan_version_id: data.floor_plan_version_id
        });
      });
      events.sort((a, b) => a.date.localeCompare(b.date));
      onUpdate(events);
    }, (err) => {
      console.warn('[Firebase] Error en suscripción de eventos de negocio:', err);
    });
  } catch (err) {
    console.warn('[Firebase] Excepción al suscribir a eventos:', err);
    return null;
  }
}

export async function upsertBusinessEventRemote(
  eventData: {
    businessId: string;
    eventId?: string;
    title: string;
    subtitle?: string;
    date: string;
    day_label?: string;
    door_time?: string;
    cover_price?: number;
    dj_guest?: string;
    genre?: string;
    flyer_url?: string;
    is_published: boolean;
    experience_type?: string;
    floor_plan_version_id?: string;
  }
): Promise<{ success: boolean; eventId: string; event: Record<string, unknown> }> {
  return await callFunctions('upsertBusinessEvent', eventData);
}


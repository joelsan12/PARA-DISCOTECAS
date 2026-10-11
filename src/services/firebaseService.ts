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
          tables: data.tables as ClubTable[],
          layout_type: data.layout_type as ClubLayoutType
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

export async function saveClubLayoutToFirebase(
  clubId: string,
  tables: ClubTable[],
  layoutType?: ClubLayoutType
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const layoutRef = doc(db, 'businesses', clubId, 'layout', 'main');
    await setDoc(layoutRef, {
      businessId: clubId,
      tables,
      layout_type: layoutType,
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error al guardar plano en Firestore:', err);
    return false;
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


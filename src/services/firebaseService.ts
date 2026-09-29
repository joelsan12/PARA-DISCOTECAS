import {
  doc, setDoc, onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { ClubTable, ClubLayoutType } from '../types';

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

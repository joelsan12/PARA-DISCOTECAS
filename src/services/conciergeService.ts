import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { ConciergeRequestRecord } from '../types/saas';

export interface ConciergeSubscriptionParams {
  businessId: string;
  uid?: string;
  onUpdate: (requests: ConciergeRequestRecord[]) => void;
  onError?: (error: Error) => void;
}

/**
  * Suscribe a un cliente a sus propias solicitudes de concierge en tiempo real (AGENTS §3).
  */
export function subscribeCustomerConciergeRequests({
  businessId,
  uid,
  onUpdate,
  onError
}: ConciergeSubscriptionParams): Unsubscribe {
  if (!isFirebaseConfigured || !db || !businessId || !uid) {
    onUpdate([]);
    return () => {};
  }

  const colRef = collection(db, 'businesses', businessId, 'conciergeRequests');
  const q = query(colRef, where('uid', '==', uid));

  return onSnapshot(
    q,
    (snap) => {
      const list: ConciergeRequestRecord[] = snap.docs.map(doc => {
        const d = doc.data();
        return {
          requestId: doc.id,
          businessId,
          uid: String(d.uid || ''),
          customerName: d.customerName ? String(d.customerName) : undefined,
          customerPhone: d.customerPhone ? String(d.customerPhone) : undefined,
          reservationId: d.reservationId ? String(d.reservationId) : undefined,
          resourceId: d.resourceId ? String(d.resourceId) : undefined,
          tableCode: d.tableCode ? String(d.tableCode) : undefined,
          zone: d.zone ? String(d.zone) : undefined,
          type: d.type || 'OTHER',
          message: String(d.message || ''),
          status: d.status || 'PENDING',
          assignedWaiterUid: d.assignedWaiterUid ? String(d.assignedWaiterUid) : undefined,
          assignedWaiterName: d.assignedWaiterName ? String(d.assignedWaiterName) : undefined,
          source: d.source || 'in_app',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d.createdAt === 'string' ? d.createdAt : null),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (typeof d.updatedAt === 'string' ? d.updatedAt : null)
        };
      });

      // Ordenar: más recientes primero
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      onUpdate(list);
    },
    (err) => {
      console.warn('[ConciergeService] Error suscripción cliente:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Suscribe al personal (meseros / piso & concierge) a todas las solicitudes del establecimiento.
 */
export function subscribeVenueConciergeRequests({
  businessId,
  onUpdate,
  onError
}: {
  businessId: string;
  onUpdate: (requests: ConciergeRequestRecord[]) => void;
  onError?: (error: Error) => void;
}): Unsubscribe {
  if (!isFirebaseConfigured || !db || !businessId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = collection(db, 'businesses', businessId, 'conciergeRequests');

  return onSnapshot(
    colRef,
    (snap) => {
      const list: ConciergeRequestRecord[] = snap.docs.map(doc => {
        const d = doc.data();
        return {
          requestId: doc.id,
          businessId,
          uid: String(d.uid || ''),
          customerName: d.customerName ? String(d.customerName) : undefined,
          customerPhone: d.customerPhone ? String(d.customerPhone) : undefined,
          reservationId: d.reservationId ? String(d.reservationId) : undefined,
          resourceId: d.resourceId ? String(d.resourceId) : undefined,
          tableCode: d.tableCode ? String(d.tableCode) : undefined,
          zone: d.zone ? String(d.zone) : undefined,
          type: d.type || 'OTHER',
          message: String(d.message || ''),
          status: d.status || 'PENDING',
          assignedWaiterUid: d.assignedWaiterUid ? String(d.assignedWaiterUid) : undefined,
          assignedWaiterName: d.assignedWaiterName ? String(d.assignedWaiterName) : undefined,
          source: d.source || 'in_app',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d.createdAt === 'string' ? d.createdAt : null),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (typeof d.updatedAt === 'string' ? d.updatedAt : null)
        };
      });

      // Ordenar por prioridad: PENDING > IN_PROGRESS > DONE/CANCELLED y luego por fecha
      const rank = (status: string) => {
        if (status === 'PENDING') return 0;
        if (status === 'IN_PROGRESS') return 1;
        return 2;
      };

      list.sort((a, b) => {
        const diffRank = rank(a.status) - rank(b.status);
        if (diffRank !== 0) return diffRank;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      onUpdate(list);
    },
    (err) => {
      console.warn('[ConciergeService] Error suscripción venue:', err);
      if (onError) onError(err);
    }
  );
}

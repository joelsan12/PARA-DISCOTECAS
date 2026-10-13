import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import type { ViewRole } from '../types';

export interface AdminStaffSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: ViewRole;
  isSuperAdmin: boolean;
  clubId?: string;
  staffRole?: 'owner' | 'manager' | 'door' | 'finance' | 'waiter';
  assignedZones?: string[];
}

export type AdminAuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'unauthorized'; user: User; reason: string }
  | { status: 'authenticated'; user: User; session: AdminStaffSession };

export async function signInAdminWithPassword(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth no está inicializado.');
  }
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function resolveAdminStaffSession(user: User, currentClubId?: string): Promise<AdminStaffSession | null> {
  if (!db) return null;

  try {
    const tokenResult = await user.getIdTokenResult().catch(() => null);
    const isClaimSuperAdmin = tokenResult?.claims?.platformRole === 'superadmin';

    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef).catch(() => null);
    const userData = userSnapshot?.exists() ? userSnapshot.data() : null;

    // 1. Verificar si el usuario está registrado como colaborador activo en este club o su negocio asignado
    const candidates = Array.from(new Set([
      userData?.businessId as string | undefined,
      currentClubId
    ].filter((id): id is string => Boolean(id && typeof id === 'string'))));

    if (candidates.length === 0) {
      try {
        const { collectionGroup, query, where, getDocs, limit } = await import('firebase/firestore');
        const staffGroupSnap = await getDocs(
          query(collectionGroup(db, 'staff'), where('uid', '==', user.uid), where('status', '==', 'ACTIVE'), limit(1))
        );
        if (!staffGroupSnap.empty) {
          const clubIdFromPath = staffGroupSnap.docs[0].ref.parent.parent?.id;
          if (clubIdFromPath) candidates.push(clubIdFromPath);
        }
      } catch {
        // Fallback silencioso si no hay índice
      }
    }

    for (const targetClubId of candidates) {
      try {
        const staffDocRef = doc(db, 'businesses', targetClubId, 'staff', user.uid);
        const staffSnapshot = await getDoc(staffDocRef);
        if (staffSnapshot.exists()) {
          const data = staffSnapshot.data();
          if (data?.status === 'ACTIVE') {
            const rawRole = (data.role || 'manager').toLowerCase();
            let role: ViewRole = 'CLUB_ADMIN';
            if (rawRole === 'door') {
              role = 'DOOR_CHECKIN';
            } else if (rawRole === 'waiter') {
              role = 'WAITER';
            }
            const assignedZones = Array.isArray(data.assignedZones)
              ? data.assignedZones.filter((z): z is string => typeof z === 'string')
              : [];

            // Regla de aislamiento estricto: Si el rol asignado es operativo (puerta o mesero),
            // se restringe ESTRICTAMENTE a su terminal operativa, sin privilegios administrativos.
            const isOperationalOnly = rawRole === 'door' || rawRole === 'waiter';

            return {
              uid: user.uid,
              email: user.email || '',
              displayName: data.name || user.displayName || user.email?.split('@')[0] || 'Staff',
              photoURL: user.photoURL || (data.photoUrl as string | undefined) || (data.avatarUrl as string | undefined) || (userData?.photoUrl as string | undefined),
              role,
              isSuperAdmin: !isOperationalOnly && (Boolean(isClaimSuperAdmin) || userData?.superAdmin === true),
              clubId: targetClubId,
              staffRole: rawRole as AdminStaffSession['staffRole'],
              assignedZones
            };
          }
        }
      } catch (staffErr) {
        console.warn(`No se pudo verificar staff en ${targetClubId}:`, staffErr);
      }
    }

    // 2. Si no es un colaborador operativo específico, comprobar si es SuperAdministrador de la plataforma
    if (isClaimSuperAdmin || userData?.superAdmin === true || user.email === 'superadmin@nightflow.vip') {
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'SuperAdmin',
        photoURL: user.photoURL || (userData?.photoUrl as string | undefined),
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        clubId: (userData?.businessId as string | undefined) || currentClubId || ''
      };
    }

    return null;
  } catch (error) {
    console.error('Error al resolver sesión de administración:', error);
    return null;
  }
}

export function subscribeToAdminAuth(
  activeClubId: string | undefined,
  onStateChange: (state: AdminAuthState) => void
): () => void {
  if (!auth || !isFirebaseConfigured) {
    onStateChange({ status: 'unauthenticated' });
    return () => {};
  }

  onStateChange({ status: 'loading' });

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onStateChange({ status: 'unauthenticated' });
      return;
    }

    const session = await resolveAdminStaffSession(user, activeClubId);
    if (!session) {
      onStateChange({
        status: 'unauthorized',
        user,
        reason: 'Tu cuenta no tiene permisos de administración o personal activo en este establecimiento.'
      });
      return;
    }

    onStateChange({
      status: 'authenticated',
      user,
      session
    });
  });

  return unsubscribe;
}

export async function updateAdminProfileInFirestore(params: {
  uid: string;
  clubId?: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
}): Promise<void> {
  if (!db) return;
  const { uid, clubId, displayName, photoURL, email } = params;

  // 1. users/{uid}
  try {
    const userRef = doc(db, 'users', uid);
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (displayName) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoUrl = photoURL;
    if (email) updates.email = email;
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userRef, updates, { merge: true });
  } catch (err) {
    console.warn('[AdminAuth] Error actualizando users/{uid}:', err);
  }

  // 2. businesses/{clubId}/staff/{uid}
  if (clubId) {
    try {
      const staffRef = doc(db, 'businesses', clubId, 'staff', uid);
      const staffUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (displayName) staffUpdates.name = displayName;
      if (photoURL !== undefined) {
        staffUpdates.photoUrl = photoURL;
        staffUpdates.avatarUrl = photoURL;
      }
      if (email) staffUpdates.email = email;
      const { setDoc } = await import('firebase/firestore');
      await setDoc(staffRef, staffUpdates, { merge: true });
    } catch (err) {
      console.warn(`[AdminAuth] Error actualizando staff en ${clubId}:`, err);
    }
  }
}

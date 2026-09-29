import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import type { ViewRole } from '../types';

export interface AdminStaffSession {
  uid: string;
  email: string;
  displayName: string;
  role: ViewRole;
  isSuperAdmin: boolean;
  clubId?: string;
  staffRole?: 'owner' | 'manager' | 'door' | 'finance';
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
    // 1. Check if user is SuperAdmin in users/{uid}
    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.exists() ? userSnapshot.data() : null;
    if (userData?.superAdmin === true) {
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'SuperAdmin',
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        clubId: currentClubId
      };
    }

    // 2. Check if user is staff in targetClubId (users/{uid}.businessId -> staff/{uid}.ACTIVE)
    const targetClubId = (userData?.businessId as string | undefined) || currentClubId;
    if (targetClubId) {
      const staffDocRef = doc(db, 'businesses', targetClubId, 'staff', user.uid);
      const staffSnapshot = await getDoc(staffDocRef);
      if (staffSnapshot.exists()) {
        const data = staffSnapshot.data();
        if (data?.status === 'ACTIVE') {
          const rawRole = (data.role || 'manager').toLowerCase();
          const role: ViewRole = rawRole === 'door' ? 'DOOR_CHECKIN' : 'CLUB_ADMIN';
          return {
            uid: user.uid,
            email: user.email || '',
            displayName: data.name || user.displayName || user.email?.split('@')[0] || 'Staff',
            role,
            isSuperAdmin: false,
            clubId: targetClubId,
            staffRole: rawRole as AdminStaffSession['staffRole']
          };
        }
      }
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

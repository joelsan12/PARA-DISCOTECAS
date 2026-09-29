import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { callFunctions, isFunctionsClientAvailable } from './functionsClient';
import type { BusinessCustomerProfile } from '../types/saas';

export interface BusinessCustomerIdentity {
  uid: string;
  displayName?: string;
  email?: string;
  phone?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildProfile(
  businessId: string,
  identity: BusinessCustomerIdentity,
  existing?: Partial<BusinessCustomerProfile>
): BusinessCustomerProfile {
  const createdAt = existing?.createdAt ?? nowIso();
  const displayName = identity.displayName?.trim() || existing?.displayName?.trim() || 'Invitado Nightflow';
  const email = identity.email?.trim() || existing?.email?.trim() || '';
  const phone = identity.phone?.trim() || existing?.phone?.trim() || '';
  return {
    businessId,
    uid: identity.uid,
    displayName: displayName.length >= 2 ? displayName : 'Invitado Nightflow',
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    status: existing?.status ?? 'ACTIVE',
    tier: existing?.tier ?? 'STANDARD',
    loyaltyPoints: existing?.loyaltyPoints ?? 0,
    marketingConsent: existing?.marketingConsent ?? false,
    createdAt,
    updatedAt: nowIso()
  };
}

function toIso(value: unknown): string {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  }
  return nowIso();
}

function profileFromFunctionResponse(value: unknown): BusinessCustomerProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.businessId !== 'string' || typeof record.uid !== 'string') return null;
  return {
    businessId: record.businessId,
    uid: record.uid,
    displayName: typeof record.displayName === 'string' && record.displayName
      ? record.displayName
      : 'Invitado Nightflow',
    ...(typeof record.email === 'string' && record.email ? { email: record.email } : {}),
    ...(typeof record.phone === 'string' && record.phone ? { phone: record.phone } : {}),
    status: record.status === 'ACTIVE' || record.status === 'BLOCKED' || record.status === 'DELETION_PENDING'
      ? record.status
      : 'ACTIVE',
    tier: record.tier === 'SILVER' || record.tier === 'GOLD' || record.tier === 'BLACK'
      ? record.tier
      : 'STANDARD',
    loyaltyPoints: typeof record.loyaltyPoints === 'number' ? record.loyaltyPoints : 0,
    marketingConsent: record.marketingConsent === true,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt)
  };
}

async function ensureViaCloudFunction(
  businessId: string,
  identity: BusinessCustomerIdentity,
  marketingConsent: boolean
): Promise<BusinessCustomerProfile | null> {
  if (!isFunctionsClientAvailable()) return null;
  try {
    const response = await callFunctions<unknown>('createBusinessCustomerProfile', {
      businessId,
      displayName: identity.displayName?.trim() || 'Invitado Nightflow',
      ...(identity.email ? { email: identity.email.trim() } : {}),
      ...(identity.phone ? { phone: identity.phone.trim() } : {}),
      marketingConsent
    });
    return profileFromFunctionResponse(response);
  } catch {
    return null;
  }
}

async function ensureViaClientRules(
  businessId: string,
  identity: BusinessCustomerIdentity
): Promise<BusinessCustomerProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const customerRef = doc(db, 'businesses', businessId, 'customers', identity.uid);
  try {
    const snapshot = await getDoc(customerRef);
    if (!snapshot.exists()) {
      const profile = buildProfile(businessId, identity);
      await setDoc(customerRef, profile);
      return profile;
    }
    const existing = snapshot.data() as Partial<BusinessCustomerProfile>;
    const nextDisplayName = identity.displayName?.trim() || existing.displayName?.trim() || 'Invitado Nightflow';
    const email = identity.email?.trim() || existing.email?.trim() || '';
    const phone = identity.phone?.trim() || existing.phone?.trim() || '';
    const update: Record<string, unknown> = {
      displayName: nextDisplayName.length >= 2 ? nextDisplayName : 'Invitado Nightflow',
      marketingConsent: existing.marketingConsent ?? false,
      updatedAt: nowIso()
    };
    if (email) update.email = email;
    if (phone) update.phone = phone;
    await setDoc(customerRef, update, { merge: true });
    return {
      ...existing,
      businessId,
      uid: identity.uid,
      displayName: String(update.displayName),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      status: existing.status ?? 'ACTIVE',
      tier: existing.tier ?? 'STANDARD',
      loyaltyPoints: existing.loyaltyPoints ?? 0,
      marketingConsent: update.marketingConsent === true,
      createdAt: existing.createdAt ?? nowIso(),
      updatedAt: String(update.updatedAt)
    } as BusinessCustomerProfile;
  } catch (error) {
    console.warn('[Customer] Falló fallback cliente al asegurar perfil:', error);
    return null;
  }
}

export async function ensureBusinessCustomerProfile(
  businessId: string,
  identity: BusinessCustomerIdentity,
  options?: { marketingConsent?: boolean }
): Promise<BusinessCustomerProfile | null> {
  if (!businessId.trim() || !identity.uid.trim()) {
    throw new Error('El negocio y el usuario son obligatorios para crear el perfil.');
  }
  const normalizedBusinessId = businessId.trim();
  const uid = identity.uid.trim();
  const normalizedIdentity = { ...identity, uid };
  const marketingConsent = options?.marketingConsent === true;

  if (!isFirebaseConfigured || !db) {
    return import.meta.env.DEV
      ? buildProfile(normalizedBusinessId, normalizedIdentity)
      : null;
  }

  const viaFunction = await ensureViaCloudFunction(normalizedBusinessId, normalizedIdentity, marketingConsent);
  if (viaFunction) return viaFunction;

  return ensureViaClientRules(normalizedBusinessId, normalizedIdentity);
}

export async function getBusinessCustomerProfile(
  businessId: string,
  uid: string
): Promise<BusinessCustomerProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const customerRef = doc(db, 'businesses', businessId, 'customers', uid);
  const snapshot = await getDoc(customerRef);
  return snapshot.exists() ? snapshot.data() as BusinessCustomerProfile : null;
}

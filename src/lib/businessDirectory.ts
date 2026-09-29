import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { INITIAL_CLUBS } from '../data/mockClubs';
import type { VenueType } from '../types/domain';
import type {
  BusinessDirectoryEntry,
  BusinessDirectoryStatus,
  CustomerAuthMethod,
  ReentryMode
} from '../types/saas';

export interface DirectoryFilters {
  city?: string;
  venueType?: VenueType | 'ALL';
}

export interface LoadDirectoryOptions {
  force?: boolean;
  filters?: DirectoryFilters;
}

export const BUSINESS_AUTH_METHODS: CustomerAuthMethod[] = [
  'password',
  'email_otp',
  'whatsapp_otp',
  'sms_otp'
];

export const VENUE_TYPE_OPTIONS: Array<{ value: VenueType; label: string }> = [
  { value: 'NIGHTCLUB', label: 'Nightclubs' },
  { value: 'BAR', label: 'Bares' },
  { value: 'ROOFTOP', label: 'Rooftops' },
  { value: 'LOUNGE', label: 'Lounges' },
  { value: 'RESTAURANT', label: 'Restaurantes' },
  { value: 'THEATER', label: 'Teatros' },
  { value: 'SPORTS_CLUB', label: 'Clubes deportivos' },
  { value: 'EVENT_VENUE', label: 'Espacios de eventos' },
  { value: 'OTHER', label: 'Otros' }
];

const PUBLIC_STATUSES = ['active', 'trial'] as const;

const normalizeText = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .trim();

const toDirectoryStatus = (status: string): BusinessDirectoryStatus => {
  if (status === 'trial') return 'trial';
  if (status === 'active') return 'active';
  return 'hidden';
};

const toReentryMode = (venueType: VenueType): ReentryMode => (
  venueType === 'ROOFTOP' || venueType === 'EVENT_VENUE' ? 'physical_band' : 'digital_passkey'
);

const toVenueType = (value: unknown): VenueType => {
  const allowed: VenueType[] = VENUE_TYPE_OPTIONS.map((option) => option.value);
  return allowed.includes(value as VenueType) ? (value as VenueType) : 'OTHER';
};

const toBusinessEntry = (club: (typeof INITIAL_CLUBS)[number]): BusinessDirectoryEntry => {
  const venueType = club.venue_type ?? 'OTHER';
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    tagline: club.tagline,
    city: club.city,
    venueType,
    logo: club.logo,
    banner: club.banner,
    primaryColor: club.primary_color,
    accentColor: club.accent_color,
    verified: club.status === 'active',
    status: toDirectoryStatus(club.status),
    authMethods: [...BUSINESS_AUTH_METHODS],
    reentryMode: toReentryMode(venueType),
    reentryMinutes: 30
  };
};

const MOCK_DIRECTORY: BusinessDirectoryEntry[] = INITIAL_CLUBS.map(toBusinessEntry);

export const BUSINESS_DIRECTORY = MOCK_DIRECTORY;
export const INITIAL_BUSINESSES = BUSINESS_DIRECTORY;

function mapPublicDocument(id: string, data: DocumentData): BusinessDirectoryEntry {
  const venueType = toVenueType(data.businessType);
  const status = toDirectoryStatus(typeof data.status === 'string' ? data.status : 'hidden');
  const logo = typeof data.logoUrl === 'string' ? data.logoUrl : '';
  const banner = typeof data.coverUrl === 'string' ? data.coverUrl : '';
  return {
    id,
    slug: typeof data.slug === 'string' && data.slug ? data.slug : id,
    name: typeof data.name === 'string' && data.name ? data.name : id,
    tagline: typeof data.tagline === 'string' ? data.tagline : '',
    city: typeof data.city === 'string' ? data.city : '',
    venueType,
    logo,
    banner,
    primaryColor: typeof data.primaryColor === 'string' && data.primaryColor ? data.primaryColor : '#e5b54f',
    accentColor: typeof data.accentColor === 'string' && data.accentColor ? data.accentColor : '#f5d38a',
    verified: data.verified === true,
    status,
    authMethods: Array.isArray(data.authMethods) && data.authMethods.length > 0
      ? (data.authMethods as CustomerAuthMethod[])
      : [...BUSINESS_AUTH_METHODS],
    reentryMode: data.reentryMode === 'physical_band' ? 'physical_band' : toReentryMode(venueType),
    reentryMinutes: typeof data.reentryMinutes === 'number' && data.reentryMinutes > 0
      ? data.reentryMinutes
      : 30
  };
}

function filterLocal(
  entries: BusinessDirectoryEntry[],
  queryText = '',
  venueType: VenueType | 'ALL' = 'ALL',
  city = ''
): BusinessDirectoryEntry[] {
  const normalizedQuery = normalizeText(queryText);
  const normalizedCity = normalizeText(city);
  return entries.filter((business) => {
    if (business.status === 'hidden') return false;
    if (venueType !== 'ALL' && business.venueType !== venueType) return false;
    if (normalizedCity && normalizeText(business.city) !== normalizedCity) return false;
    if (!normalizedQuery) return true;
    return [
      business.name,
      business.city,
      business.tagline,
      getBusinessTypeLabel(business.venueType),
      business.venueType
    ].some((value) => normalizeText(value).includes(normalizedQuery));
  });
}

function mapSnapshot(snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] }): BusinessDirectoryEntry[] {
  return snapshot.docs
    .map((doc) => mapPublicDocument(doc.id, doc.data()))
    .filter((entry) => entry.status !== 'hidden');
}

/**
 * Consulta pública base: siempre filtra status in ['active','trial'] para
 * satisfacer `allow list` en firestore.rules. City y businessType aprovechan
 * los índices compuestos de firestore.indexes.json.
 */
function buildPublicDirectoryQuery(filters?: DirectoryFilters) {
  if (!db) throw new Error('Firestore no está configurado.');
  const constraints: QueryConstraint[] = [
    where('status', 'in', [...PUBLIC_STATUSES])
  ];
  if (filters?.city) {
    constraints.push(where('city', '==', filters.city));
  }
  if (filters?.venueType && filters.venueType !== 'ALL') {
    constraints.push(where('businessType', '==', filters.venueType));
  }
  return query(collection(db, 'businessDirectory'), ...constraints);
}

function fallbackDirectory(): BusinessDirectoryEntry[] {
  return import.meta.env.DEV ? MOCK_DIRECTORY : [];
}

let directoryCache: BusinessDirectoryEntry[] = import.meta.env.DEV ? MOCK_DIRECTORY : [];
let directoryLoaded = false;
let directoryLoad: Promise<BusinessDirectoryEntry[]> | null = null;

function applyCache(entries: BusinessDirectoryEntry[]): BusinessDirectoryEntry[] {
  directoryCache = entries;
  directoryLoaded = true;
  return directoryCache;
}

async function fetchPublicDirectory(filters?: DirectoryFilters): Promise<BusinessDirectoryEntry[]> {
  if (!isFirebaseConfigured || !db) return fallbackDirectory();
  try {
    const snapshot = await getDocs(buildPublicDirectoryQuery(filters));
    const entries = mapSnapshot(snapshot);
    if (entries.length > 0) return entries;
    return filters?.city || (filters?.venueType && filters.venueType !== 'ALL') ? [] : fallbackDirectory();
  } catch (error) {
    if (!import.meta.env.DEV) {
      console.error('[Directorio] Error al cargar directorio desde Firestore:', error);
      return [];
    }
    console.warn('[Directorio] Firestore no respondió; usando respaldo local:', error);
    return MOCK_DIRECTORY;
  }
}

export async function loadBusinessDirectory(options: LoadDirectoryOptions = {}): Promise<BusinessDirectoryEntry[]> {
  const { force = false, filters } = options;
  const isBaseQuery = !filters?.city && (!filters?.venueType || filters.venueType === 'ALL');

  if (!force && isBaseQuery && directoryLoaded && directoryCache.length > 0) {
    return directoryCache;
  }
  if (!force && directoryLoad) return directoryLoad;

  if (!isFirebaseConfigured || !db) {
    return applyCache(MOCK_DIRECTORY);
  }

  const request = (async () => {
    const entries = await fetchPublicDirectory(filters);
    if (isBaseQuery) return applyCache(entries);
    return entries;
  })();

  if (isBaseQuery) {
    directoryLoad = request.finally(() => {
      directoryLoad = null;
    });
    return directoryLoad;
  }

  return request;
}

export function getCachedBusinessDirectory(): BusinessDirectoryEntry[] {
  return directoryCache;
}

export function isBusinessDirectoryLoaded(): boolean {
  return directoryLoaded;
}

export function getBusinessById(businessId: string): BusinessDirectoryEntry | undefined {
  return directoryCache.find((business) => business.id === businessId)
    ?? MOCK_DIRECTORY.find((business) => business.id === businessId);
}

export function findBusinessBySlug(entries: BusinessDirectoryEntry[], slug: string): BusinessDirectoryEntry | undefined {
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }
  return entries.find((entry) => entry.slug === decodedSlug && entry.status !== 'hidden');
}

export function getBusinessBySlug(slug: string): BusinessDirectoryEntry | undefined {
  return findBusinessBySlug(directoryCache, slug) ?? findBusinessBySlug(MOCK_DIRECTORY, slug);
}

export function searchBusinesses(
  queryText = '',
  venueType: VenueType | 'ALL' = 'ALL',
  source: BusinessDirectoryEntry[] = directoryCache,
  city = ''
): BusinessDirectoryEntry[] {
  return filterLocal(source, queryText, venueType, city);
}

export function getCities(entries: BusinessDirectoryEntry[] = directoryCache): string[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (entry.city && entry.status !== 'hidden') seen.add(entry.city);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'es'));
}

export function getBusinessTypeLabel(venueType: VenueType): string {
  return VENUE_TYPE_OPTIONS.find((option) => option.value === venueType)?.label ?? 'Experiencias';
}

export function getBusinessTypeShortLabel(venueType: VenueType): string {
  switch (venueType) {
    case 'NIGHTCLUB':
      return 'Nightclub';
    case 'BAR':
      return 'Bar';
    case 'RESTAURANT':
      return 'Restaurante';
    case 'LOUNGE':
      return 'Lounge';
    case 'ROOFTOP':
      return 'Rooftop';
    case 'THEATER':
      return 'Teatro';
    case 'SPORTS_CLUB':
      return 'Club deportivo';
    case 'EVENT_VENUE':
      return 'Eventos';
    case 'OTHER':
      return 'Experiencia';
  }
}

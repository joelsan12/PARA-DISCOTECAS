import type { BusinessDirectoryEntry, FavoriteBusiness } from '../types/saas';

export const FAVORITES_STORAGE_KEY = 'nightflow.saas.favorites.v1';

type FavoritesListener = (favorites: FavoriteBusiness[]) => void;

const listeners = new Set<FavoritesListener>();

const canUseLocalStorage = (): boolean => (
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const toFavorite = (value: unknown): FavoriteBusiness | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const businessId = typeof record.businessId === 'string' ? record.businessId.trim() : '';
  const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const city = typeof record.city === 'string' ? record.city.trim() : '';
  const logo = typeof record.logo === 'string' ? record.logo.trim() : '';
  if (!businessId || !slug || !name || !city || !logo) return null;
  return { businessId, slug, name, city, logo };
};

const uniqueFavorites = (favorites: FavoriteBusiness[]): FavoriteBusiness[] => {
  const seen = new Set<string>();
  return favorites.filter((favorite) => {
    if (seen.has(favorite.businessId)) return false;
    seen.add(favorite.businessId);
    return true;
  });
};

export function getFavorites(): FavoriteBusiness[] {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return uniqueFavorites(parsed.map(toFavorite).filter((favorite): favorite is FavoriteBusiness => favorite !== null));
  } catch {
    return [];
  }
}

function notifyListeners(): void {
  const favorites = getFavorites();
  listeners.forEach((listener) => listener(favorites));
}

function persistFavorites(favorites: FavoriteBusiness[]): void {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      return;
    }
  }
  notifyListeners();
}

export function subscribeToFavorites(listener: FavoritesListener): () => void {
  listeners.add(listener);
  listener(getFavorites());
  return () => listeners.delete(listener);
}

export function isFavorite(businessId: string): boolean {
  return getFavorites().some((favorite) => favorite.businessId === businessId);
}

const getBusinessId = (business: BusinessDirectoryEntry | FavoriteBusiness): string => (
  'id' in business ? business.id : business.businessId
);

export function addFavorite(business: BusinessDirectoryEntry | FavoriteBusiness): FavoriteBusiness {
  const favorite: FavoriteBusiness = {
    businessId: getBusinessId(business),
    slug: business.slug,
    name: business.name,
    city: business.city,
    logo: business.logo
  };
  const favorites = getFavorites();
  const nextFavorites = uniqueFavorites([
    ...favorites.filter((item) => item.businessId !== favorite.businessId),
    favorite
  ]);
  persistFavorites(nextFavorites);
  return favorite;
}

export function removeFavorite(businessId: string): boolean {
  const favorites = getFavorites();
  const nextFavorites = favorites.filter((favorite) => favorite.businessId !== businessId);
  if (nextFavorites.length === favorites.length) return false;
  persistFavorites(nextFavorites);
  return true;
}

export function toggleFavorite(business: BusinessDirectoryEntry | FavoriteBusiness): boolean {
  const businessId = getBusinessId(business);
  if (isFavorite(businessId)) {
    removeFavorite(businessId);
    return false;
  }
  addFavorite(business);
  return true;
}

export function clearFavorites(): void {
  persistFavorites([]);
}

import { useCallback, useEffect, useState } from 'react';
import type { BusinessDirectoryEntry, FavoriteBusiness } from '../../types/saas';
import { getFavorites, subscribeToFavorites, toggleFavorite } from '../../lib/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>(getFavorites);

  useEffect(() => subscribeToFavorites(setFavorites), []);

  const isFavorite = useCallback(
    (businessId: string) => favorites.some((favorite) => favorite.businessId === businessId),
    [favorites]
  );
  const toggle = useCallback((business: BusinessDirectoryEntry | FavoriteBusiness) => {
    toggleFavorite(business);
  }, []);

  return { favorites, isFavorite, toggle };
}

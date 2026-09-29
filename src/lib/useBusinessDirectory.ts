import { useEffect, useState } from 'react';
import {
  getCachedBusinessDirectory,
  isBusinessDirectoryLoaded,
  loadBusinessDirectory,
  type DirectoryFilters
} from './businessDirectory';
import type { BusinessDirectoryEntry } from '../types/saas';

export function useBusinessDirectory(filters?: DirectoryFilters) {
  const filtersKey = JSON.stringify(filters ?? {});
  const [entries, setEntries] = useState<BusinessDirectoryEntry[]>(getCachedBusinessDirectory);
  const [loading, setLoading] = useState(() => !isBusinessDirectoryLoaded());

  useEffect(() => {
    let cancelled = false;
    const parsed = filtersKey === '{}' ? undefined : (JSON.parse(filtersKey) as DirectoryFilters);
    void loadBusinessDirectory(parsed ? { filters: parsed } : {}).then((next) => {
      if (cancelled) return;
      setEntries(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filtersKey]);

  return { entries, loading, refresh: () => loadBusinessDirectory({ force: true }) };
}

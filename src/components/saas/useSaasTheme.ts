import { useState, useEffect, useCallback } from 'react';

export type SaasTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'nightflow_theme';
export const THEME_CHANGE_EVENT = 'nightflow_theme_changed';

function getInitialTheme(): SaasTheme {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
}

export function useSaasTheme() {
  const [theme, setThemeState] = useState<SaasTheme>(getInitialTheme);

  useEffect(() => {
    // 1. Storage listener (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    // 2. Custom event listener (in-app cross-component reactive sync)
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<SaasTheme>;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setThemeState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);

    // Keep DOM in sync
    document.documentElement.setAttribute('data-theme', theme);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    };
  }, [theme]);

  const setTheme = useCallback((nextTheme: SaasTheme) => {
    setThemeState(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
}


import { useState, useEffect } from 'react';

export type SaasTheme = 'dark' | 'light';

export function useSaasTheme() {
  const [theme, setTheme] = useState<SaasTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nightflow_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nightflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}

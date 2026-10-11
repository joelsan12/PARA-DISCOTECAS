import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSaasTheme } from '../saas/useSaasTheme';

interface ThemeToggleSwitchProps {
  /**
   * 'compact': Sleek hardware slider pill for the top CommandBar (no text labels).
   * 'detailed': Executive console tile with label, status indicator, and slider for the Sidebar.
   */
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { toggleTheme, isDark } = useSaasTheme();


  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    }
  };

  if (variant === 'detailed') {
    return (
      <div className={`theme-switch-detailed-card ${className}`}>
        <div className="theme-switch-detailed-info">
          <span className="theme-switch-detailed-label">Tema de Consola</span>
          <span className="theme-switch-detailed-state">
            {isDark ? (
              <>
                <span className="theme-status-dot theme-status-dot--dark" />
                <span>Oscuro VIP</span>
              </>
            ) : (
              <>
                <span className="theme-status-dot theme-status-dot--light" />
                <span>Claro Alabaster</span>
              </>
            )}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={!isDark}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          onClick={toggleTheme}
          onKeyDown={handleKeyDown}
          className={`theme-slider-track ${isDark ? 'track-dark' : 'track-light'}`}
        >
          <span className="track-icon track-icon--moon" aria-hidden="true">
            <Moon size={11} />
          </span>
          <span className="track-icon track-icon--sun" aria-hidden="true">
            <Sun size={11} />
          </span>
          <span className={`theme-slider-thumb ${isDark ? 'thumb-dark' : 'thumb-light'}`}>
            {isDark ? <Moon size={11} /> : <Sun size={11} />}
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a Modo Claro (Alabaster)' : 'Cambiar a Modo Oscuro (Obsidiana)'}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className={`theme-slider-track theme-slider-track--compact ${isDark ? 'track-dark' : 'track-light'} ${className}`}
    >
      <span className="track-icon track-icon--moon" aria-hidden="true">
        <Moon size={11} />
      </span>
      <span className="track-icon track-icon--sun" aria-hidden="true">
        <Sun size={11} />
      </span>
      <span className={`theme-slider-thumb ${isDark ? 'thumb-dark' : 'thumb-light'}`}>
        {isDark ? <Moon size={11} /> : <Sun size={11} />}
      </span>
    </button>
  );
};

import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

export interface NightflowLogoProps {
  /** Variant of the logo display */
  variant?: 'full' | 'mark' | 'horizontal';
  /** Preset size or explicit pixel height */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Primary accent tone */
  theme?: 'gold' | 'cyan' | 'monochrome';
  /** Show or hide the descriptor subline */
  showSubtitle?: boolean;
  /** Custom subtitle text */
  subtitle?: string;
  /** Whether the logo links to home */
  href?: string;
  /** Custom additional class */
  className?: string;
  /** Additional style overrides */
  style?: CSSProperties;
}

export function NightflowLogoMark({
  size = 36,
  theme = 'gold',
  className = '',
  style,
}: {
  size?: number;
  theme?: 'gold' | 'cyan' | 'monochrome';
  className?: string;
  style?: CSSProperties;
}) {
  const gradientId = `nf-sym-grad-${theme}`;
  const filterId = `nf-sym-glow-${theme}`;

  const colors = {
    gold: {
      stop1: '#FFF8E7',
      stop2: '#E5B54F',
      stop3: '#B88220',
      glow: 'rgba(229, 181, 79, 0.45)',
      dot: '#FFFDF5',
    },
    cyan: {
      stop1: '#E6FFFF',
      stop2: '#00F0FF',
      stop3: '#0090B0',
      glow: 'rgba(0, 240, 255, 0.45)',
      dot: '#F0FFFF',
    },
    monochrome: {
      stop1: '#FFFFFF',
      stop2: '#E4E4E7',
      stop3: '#A1A1AA',
      glow: 'rgba(255, 255, 255, 0.25)',
      dot: '#FFFFFF',
    },
  }[theme];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: `drop-shadow(0 0 8px ${colors.glow})`,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease',
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.stop1} />
          <stop offset="45%" stopColor={colors.stop2} />
          <stop offset="100%" stopColor={colors.stop3} />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={colors.stop2} floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Símbolos juntos / entrelazados: dos ondas de flujo y noche con pulso central, formando la 'N' */}
      <g filter={`url(#${filterId})`}>
        {/* Símbolo 1: Onda ascendente de pulso izquierdo */}
        <path
          d="M14 35C14 20 21 11 25 11C29 11 29 19 24.5 27.5"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* Símbolo 2: Onda descendente de flujo derecho entrelazada */}
        <path
          d="M23.5 20.5C19 29 19 37 23 37C27 37 34 28 34 13"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* Núcleo de acceso VIP */}
        <circle cx="24" cy="24" r="2.2" fill={colors.dot} />
      </g>
    </svg>
  );
}

export function NightflowLogo({
  variant = 'full',
  size = 'md',
  theme = 'gold',
  showSubtitle = true,
  subtitle = 'VIP HOSPITALITY NETWORK',
  href,
  className = '',
  style,
}: NightflowLogoProps) {
  const pixelSize = typeof size === 'number' ? size : { sm: 26, md: 34, lg: 44 }[size];
  const isCompact = variant === 'mark';

  const content = (
    <div
      className={`nightflow-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: pixelSize > 34 ? '12px' : '9px',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <NightflowLogoMark size={pixelSize} theme={theme} />
      
      {!isCompact && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-brand, "Outfit", sans-serif)',
                fontWeight: 800,
                fontSize: pixelSize >= 40 ? '1.18rem' : pixelSize >= 32 ? '0.98rem' : '0.84rem',
                letterSpacing: '0.22em',
                color: '#F4F4F6',
              }}
            >
              NIGHTFLOW
            </span>
            <span
              style={{
                fontFamily: 'var(--font-brand, "Outfit", sans-serif)',
                fontWeight: 800,
                fontSize: pixelSize >= 40 ? '0.70rem' : '0.60rem',
                letterSpacing: '0.08em',
                color: theme === 'cyan' ? '#00F0FF' : '#E5B54F',
                padding: '1px 5px',
                borderRadius: '3px',
                background: theme === 'cyan' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(229, 181, 79, 0.12)',
                border: `1px solid ${theme === 'cyan' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(229, 181, 79, 0.3)'}`,
              }}
            >
              VIP
            </span>
          </div>

          {showSubtitle && (
            <span
              style={{
                fontFamily: 'var(--font-brand, "Outfit", sans-serif)',
                fontSize: pixelSize >= 40 ? '0.58rem' : '0.50rem',
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'var(--text-muted, #A1A1AA)',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} style={{ textDecoration: 'none', display: 'inline-flex' }} aria-label="Nightflow VIP Home">
        {content}
      </Link>
    );
  }

  return content;
}

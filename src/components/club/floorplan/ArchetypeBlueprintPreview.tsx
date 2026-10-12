import React from 'react';
import type { ClubLayoutType } from '../../../types';

interface Props {
  layoutType: ClubLayoutType;
}

export const ArchetypeBlueprintPreview: React.FC<Props> = ({ layoutType }) => {
  if (layoutType === 'horseshoe_vip') {
    return (
      <svg
        viewBox="0 0 400 240"
        style={{
          width: '100%',
          height: '150px',
          background: '#07080f',
          borderRadius: '8px',
          border: '1px solid rgba(229, 181, 79, 0.25)',
          display: 'block',
        }}
      >
        <defs>
          <pattern id="mini-grid-horseshoe" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="240" fill="url(#mini-grid-horseshoe)" />

        {/* U-Shape Mezzanine */}
        <polygon
          points="35,40 365,40 370,205 330,220 310,195 300,120 300,80 100,80 100,120 90,195 70,220 30,205"
          fill="rgba(229, 181, 79, 0.08)"
          stroke="#e5b54f"
          strokeWidth="2"
        />

        {/* Dance Floor label */}
        <text
          x="200"
          y="118"
          fill="rgba(255, 255, 255, 0.35)"
          fontSize="10"
          fontWeight="800"
          letterSpacing="3"
          textAnchor="middle"
        >
          PISTA VIP
        </text>

        {/* DJ Booth */}
        <rect x="175" y="155" width="50" height="24" rx="4" fill="#14141e" stroke="#e5b54f" strokeWidth="1.5" />
        <text x="200" y="171" fill="#e5b54f" fontSize="10" fontWeight="900" letterSpacing="1" textAnchor="middle">
          DJ
        </text>

        {/* Sample Tables (circles with numbers) */}
        {[
          { x: 65, y: 58, n: '1' },
          { x: 130, y: 58, n: '2' },
          { x: 200, y: 58, n: '3' },
          { x: 270, y: 58, n: '4' },
          { x: 335, y: 58, n: '5' },
          { x: 65, y: 125, n: '6' },
          { x: 60, y: 175, n: '7' },
          { x: 335, y: 125, n: '8' },
          { x: 340, y: 175, n: '9' },
          { x: 140, y: 167, n: '10' },
          { x: 260, y: 167, n: '11' },
        ].map((t) => (
          <g key={t.n}>
            <circle cx={t.x} cy={t.y} r="8" fill="#e5b54f" stroke="#08080c" strokeWidth="1.5" />
            <text x={t.x} y={t.y} fill="#08080c" fontSize="7" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              {t.n}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (layoutType === 'u_amphitheater') {
    return (
      <svg
        viewBox="0 0 400 240"
        style={{
          width: '100%',
          height: '150px',
          background: '#07080f',
          borderRadius: '8px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'block',
        }}
      >
        <defs>
          <pattern id="mini-grid-amphi" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="240" fill="url(#mini-grid-amphi)" />

        {/* Stage */}
        <rect x="110" y="16" width="180" height="28" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="200" y="34" fill="#38bdf8" fontSize="10" fontWeight="900" letterSpacing="2" textAnchor="middle">
          ESCENARIO
        </text>

        {/* Concentric Terraces */}
        <path d="M 60,65 C 130,125 270,125 340,65" fill="none" stroke="#252d3d" strokeWidth="14" />
        <path d="M 80,125 C 140,175 260,175 320,125" fill="none" stroke="#1e2736" strokeWidth="14" />
        <path d="M 110,180 C 150,215 250,215 290,180" fill="none" stroke="#151b24" strokeWidth="14" />

        {/* Dance Pit */}
        <text x="200" y="115" fill="rgba(255, 255, 255, 0.35)" fontSize="10" fontWeight="800" letterSpacing="3" textAnchor="middle">
          PISTA CENTRAL
        </text>

        {/* Stepped Tables */}
        {[
          { x: 90, y: 72, n: '1' },
          { x: 150, y: 92, n: '2' },
          { x: 250, y: 92, n: '3' },
          { x: 310, y: 72, n: '4' },
          { x: 110, y: 132, n: '5' },
          { x: 170, y: 152, n: '6' },
          { x: 230, y: 152, n: '7' },
          { x: 290, y: 132, n: '8' },
          { x: 145, y: 190, n: '9' },
          { x: 200, y: 198, n: '10' },
          { x: 255, y: 190, n: '11' },
        ].map((t) => (
          <g key={t.n}>
            <circle cx={t.x} cy={t.y} r="8" fill="#38bdf8" stroke="#08080c" strokeWidth="1.5" />
            <text x={t.x} y={t.y} fill="#08080c" fontSize="7" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              {t.n}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (layoutType === 'downtown_suites') {
    return (
      <svg
        viewBox="0 0 400 240"
        style={{
          width: '100%',
          height: '150px',
          background: '#07080f',
          borderRadius: '8px',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          display: 'block',
        }}
      >
        <defs>
          <pattern id="mini-grid-suites" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="240" fill="url(#mini-grid-suites)" />

        {/* Private Suites along right edge */}
        <rect x="295" y="20" width="80" height="42" rx="4" fill="#111827" stroke="#ec4899" strokeWidth="1.5" />
        <text x="335" y="44" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle">SUITE 1</text>

        <rect x="295" y="70" width="80" height="42" rx="4" fill="#111827" stroke="#ec4899" strokeWidth="1.5" />
        <text x="335" y="94" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle">SUITE 2</text>

        <rect x="295" y="120" width="80" height="42" rx="4" fill="#111827" stroke="#ec4899" strokeWidth="1.5" />
        <text x="335" y="144" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle">SUITE 3</text>

        <rect x="295" y="170" width="80" height="42" rx="4" fill="#111827" stroke="#ef4444" strokeWidth="1.5" />
        <text x="335" y="194" fill="#fff" fontSize="8" fontWeight="900" textAnchor="middle">EVENTO VIP</text>

        {/* Bar on left */}
        <rect x="35" y="75" width="45" height="90" rx="5" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="57" y="124" fill="#ec4899" fontSize="10" fontWeight="800" letterSpacing="1" textAnchor="middle">
          BAR
        </text>

        {/* DJ booth */}
        <rect x="215" y="90" width="45" height="35" rx="4" fill="#111827" stroke="#fff" strokeWidth="1.5" />
        <text x="237" y="112" fill="#fff" fontSize="9" fontWeight="900" textAnchor="middle">
          DJ
        </text>

        {/* Main Lounge text */}
        <text x="145" y="125" fill="rgba(255, 255, 255, 0.35)" fontSize="10" fontWeight="800" letterSpacing="3" textAnchor="middle">
          SALÓN
        </text>

        {/* Tables */}
        {[
          { x: 120, y: 70, n: '1' },
          { x: 170, y: 70, n: '2' },
          { x: 120, y: 170, n: '3' },
          { x: 170, y: 170, n: '4' },
          { x: 235, y: 170, n: '5' },
        ].map((t) => (
          <g key={t.n}>
            <circle cx={t.x} cy={t.y} r="8" fill="#ec4899" stroke="#08080c" strokeWidth="1.5" />
            <text x={t.x} y={t.y} fill="#fff" fontSize="7" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              {t.n}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // custom_open
  return (
    <svg
      viewBox="0 0 400 240"
      style={{
        width: '100%',
        height: '150px',
        background: '#07080f',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'block',
      }}
    >
      <defs>
        <pattern id="mini-grid-open" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="240" fill="url(#mini-grid-open)" />

      {/* Guide Stage Outline */}
      <rect
        x="110"
        y="25"
        width="180"
        height="32"
        rx="4"
        fill="rgba(255, 255, 255, 0.03)"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="200" y="45" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="800" letterSpacing="2" textAnchor="middle">
        ESCENARIO MODULAR
      </text>

      {/* Open Center Circle */}
      <circle cx="200" cy="135" r="50" fill="none" stroke="rgba(229, 181, 79, 0.25)" strokeWidth="1.5" strokeDasharray="5 5" />
      <text x="200" y="138" fill="var(--brand-gold, #e5b54f)" fontSize="9" fontWeight="800" letterSpacing="1" textAnchor="middle">
        LIENZO EN BLANCO
      </text>

      {/* Crosshairs at 4 quadrants */}
      {[
        { x: 40, y: 40 },
        { x: 360, y: 40 },
        { x: 40, y: 200 },
        { x: 360, y: 200 },
      ].map((p, i) => (
        <g key={i} stroke="rgba(229, 181, 79, 0.4)" strokeWidth="1">
          <line x1={p.x - 8} y1={p.y} x2={p.x + 8} y2={p.y} />
          <line x1={p.x} y1={p.y - 8} x2={p.x} y2={p.y + 8} />
        </g>
      ))}
    </svg>
  );
};

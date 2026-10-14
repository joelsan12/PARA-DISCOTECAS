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

  if (layoutType === 'macro_blueprint') {
    return (
      <svg
        viewBox="0 0 400 240"
        style={{
          width: '100%',
          height: '150px',
          background: '#090d16',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          display: 'block',
        }}
      >
        <defs>
          <pattern id="mini-cad-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="16" y2="0" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="240" fill="url(#mini-cad-grid)" />

        {/* Outer Architectural CAD Double Wall */}
        <rect x="40" y="20" width="320" height="195" rx="3" fill="none" stroke="#64748b" strokeWidth="1.8" />
        <rect x="44" y="24" width="312" height="187" rx="2" fill="none" stroke="#334155" strokeWidth="1" />

        {/* East Wall Staircase */}
        <g stroke="#64748b" strokeWidth="1" fill="#0d1422">
          <rect x="325" y="95" width="28" height="48" rx="2" />
          <line x1="325" y1="107" x2="353" y2="107" />
          <line x1="325" y1="119" x2="353" y2="119" />
          <line x1="325" y1="131" x2="353" y2="131" />
        </g>

        {/* Central Octagonal Railing & Sunken Arena */}
        <polygon
          points="130,65 255,65 290,95 290,145 255,175 130,175 95,145 95,95"
          fill="none"
          stroke="rgba(148, 163, 184, 0.55)"
          strokeWidth="1.6"
        />
        <polygon
          points="134,70 251,70 284,98 284,142 251,170 134,170 101,142 101,98"
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="1"
        />

        {/* Top North Row Tables */}
        {[
          { x: 105, color: '#10b981' },
          { x: 135, color: '#10b981' },
          { x: 165, color: '#10b981' },
          { x: 195, color: '#10b981' },
          { x: 225, color: '#f59e0b' },
          { x: 255, color: '#a855f7' },
          { x: 285, color: '#38bdf8' },
        ].map((t, idx) => (
          <g key={`t-north-${idx}`}>
            <rect x={t.x - 7} y="38" width="14" height="9" rx="2" fill={t.color} stroke="#090d16" strokeWidth="1" />
            <circle cx={t.x} cy="42" r="1.5" fill="#fff" />
          </g>
        ))}

        {/* West Wall Tables */}
        {[85, 120, 155].map((y, idx) => (
          <rect key={`t-west-${idx}`} x="58" y={y - 7} width="9" height="14" rx="2" fill="#10b981" stroke="#090d16" strokeWidth="1" />
        ))}

        {/* Central Arena Tables */}
        {[
          { x: 155, y: 88, color: '#10b981' },
          { x: 190, y: 88, color: '#f59e0b' },
          { x: 225, y: 88, color: '#f59e0b' },
          { x: 125, y: 110, color: '#10b981' },
          { x: 125, y: 135, color: '#10b981' },
          { x: 155, y: 152, color: '#f59e0b' },
          { x: 190, y: 152, color: '#f59e0b' },
          { x: 225, y: 152, color: '#38bdf8' },
          { x: 260, y: 110, color: '#38bdf8' },
          { x: 260, y: 135, color: '#38bdf8' },
        ].map((t, idx) => (
          <rect key={`t-center-${idx}`} x={t.x - 6} y={t.y - 5} width="12" height="10" rx="2" fill={t.color} stroke="#090d16" strokeWidth="1" />
        ))}

        {/* South Row Tables */}
        {[
          { x: 150, color: '#a855f7' },
          { x: 175, color: '#a855f7' },
          { x: 200, color: '#a855f7' },
          { x: 230, color: '#38bdf8' },
          { x: 260, color: '#38bdf8' },
          { x: 285, color: '#38bdf8' },
        ].map((t, idx) => (
          <rect key={`t-south-${idx}`} x={t.x - 6} y="185" width="12" height="9" rx="2" fill={t.color} stroke="#090d16" strokeWidth="1" />
        ))}

        {/* Mini Legend Indicator */}
        <g transform="translate(48, 168)">
          <rect width="36" height="36" rx="4" fill="rgba(10, 14, 24, 0.9)" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
          <circle cx="10" cy="11" r="3" fill="#10b981" />
          <circle cx="24" cy="11" r="3" fill="#f59e0b" />
          <circle cx="10" cy="24" r="3" fill="#a855f7" />
          <circle cx="24" cy="24" r="3" fill="#38bdf8" />
        </g>
      </svg>
    );
  }

  if (layoutType === 'arena_vip_3d') {
    return (
      <svg
        viewBox="0 0 400 240"
        style={{
          width: '100%',
          height: '150px',
          background: '#0d0f15',
          borderRadius: '8px',
          border: '1px solid rgba(229, 181, 79, 0.35)',
          display: 'block',
        }}
      >
        <defs>
          <radialGradient id="mini-a3d-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(229, 181, 79, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill="#0d0f15" />
        <rect width="400" height="240" fill="url(#mini-a3d-ambient)" />

        {/* 3D Extruded Outer Wall with Golden Neon Rim */}
        <polygon
          points="70,45 285,45 355,90 355,150 368,170 368,220 40,220 40,210 70,45"
          fill="#131620"
          stroke="#e5b54f"
          strokeWidth="2.2"
        />

        {/* Suites Divider (Top Left) */}
        <line x1="115" y1="45" x2="115" y2="82" stroke="#e5b54f" strokeWidth="1.5" />
        <line x1="160" y1="45" x2="160" y2="82" stroke="#e5b54f" strokeWidth="1.5" />
        <text x="138" y="58" fill="#cbd5e1" fontSize="7" fontWeight="800" textAnchor="middle">SUITES</text>

        {/* Cabina DJ Protruding Arc (Center Top) */}
        <path d="M 185,45 L 240,45 L 240,65 Q 212,78 185,65 Z" fill="#1b212e" stroke="#e5b54f" strokeWidth="1.8" />
        <text x="212" y="62" fill="#fff" fontSize="7" fontWeight="900" textAnchor="middle">DJ</text>

        {/* West Wall Boxes */}
        {[85, 112, 139, 166, 193].map((y, idx) => (
          <line key={`box-line-${idx}`} x1="50" y1={y} x2="95" y2={y} stroke="#e5b54f" strokeWidth="1.4" />
        ))}

        {/* East Palcos Balconies */}
        <g transform="translate(265, 75) rotate(28)">
          <rect x="0" y="0" width="55" height="25" rx="3" fill="#181e2b" stroke="#e5b54f" strokeWidth="1.4" />
          <text x="27" y="15" fill="#cbd5e1" fontSize="6.5" fontWeight="800" textAnchor="middle">PALCO</text>
        </g>
        <g transform="translate(290, 130)">
          <rect x="0" y="0" width="55" height="26" rx="3" fill="#181e2b" stroke="#e5b54f" strokeWidth="1.4" />
          <text x="27" y="16" fill="#cbd5e1" fontSize="6.5" fontWeight="800" textAnchor="middle">PALCO</text>
        </g>

        {/* Central Sunken Arena Pit with Golden Neon Steps */}
        <polygon
          points="115,88 260,88 295,118 295,168 260,198 115,198 85,168 85,118"
          fill="#0c0e14"
          stroke="#e5b54f"
          strokeWidth="2"
        />
        <polygon
          points="120,93 255,93 288,121 288,164 255,192 120,192 92,164 92,121"
          fill="#090a0f"
          stroke="rgba(229, 181, 79, 0.45)"
          strokeWidth="1"
        />

        {/* Crescent Golden Sofa Arc in Center */}
        <path d="M 155,130 A 18,18 0 0,1 155,160" fill="none" stroke="#e5b54f" strokeWidth="3" strokeLinecap="round" />

        {/* Sample Tables (Pills / Circles) */}
        <rect x="88" y="58" width="18" height="10" rx="4" fill="#10b981" />
        <rect x="130" y="58" width="18" height="10" rx="4" fill="#10b981" />
        <rect x="68" y="94" width="14" height="9" rx="3" fill="#e5b54f" />
        <rect x="68" y="121" width="14" height="9" rx="3" fill="#e5b54f" />
        <rect x="68" y="148" width="14" height="9" rx="3" fill="#e5b54f" />
        <rect x="175" y="98" width="22" height="10" rx="5" fill="#10b981" />
        <rect x="125" y="112" width="18" height="9" rx="4" fill="#10b981" />
        <rect x="180" y="172" width="22" height="10" rx="5" fill="#10b981" />

        {/* Top-Left UI Pill Badge */}
        <rect x="48" y="24" width="95" height="14" rx="4" fill="rgba(18, 22, 32, 0.9)" stroke="rgba(229, 181, 79, 0.4)" strokeWidth="0.8" />
        <text x="52" y="34" fill="#f5d38a" fontSize="5.5" fontWeight="800">3D ARCHITECTURAL</text>
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

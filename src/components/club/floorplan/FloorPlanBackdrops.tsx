import React from 'react';
import type { ClubLayoutType } from '../../../types';

export const FloorPlanBackdrops: React.FC<{ layoutType: ClubLayoutType }> = ({ layoutType }) => {
  if (layoutType === 'horseshoe_vip') {
    return (
      <g>
        <defs>
          <pattern id="editor-stripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="800" fill="url(#editor-stripes)" />
        <text x="400" y="85" fill="#ffffff" fontSize="28" fontWeight="800" textAnchor="middle" letterSpacing="6" fontFamily="var(--font-brand)">
          ZONA VIP
        </text>
        <g fill="none" stroke="#ffffff" strokeLinejoin="round" strokeLinecap="round">
          <polygon points="70,140 730,140 745,670 655,705 600,660 585,500 585,270 215,270 215,500 200,660 145,705 55,670" strokeWidth="5" />
          <polygon points="90,160 710,160 725,655 650,685 610,650 600,510 600,285 200,285 200,510 190,650 150,685 75,655" strokeWidth="2" opacity="0.8" />
          <line x1="200" y1="480" x2="260" y2="480" strokeWidth="2.5" />
          <line x1="200" y1="492" x2="260" y2="492" strokeWidth="2.5" />
          <line x1="200" y1="504" x2="260" y2="504" strokeWidth="2.5" />
          <line x1="540" y1="480" x2="600" y2="480" strokeWidth="2.5" />
          <line x1="540" y1="492" x2="600" y2="492" strokeWidth="2.5" />
          <line x1="540" y1="504" x2="600" y2="504" strokeWidth="2.5" />
          <path d="M 260,510 C 260,330 380,330 380,380 L 380,410 M 420,410 L 420,380 C 420,330 540,330 540,510 L 470,510 L 470,570 L 330,570 L 330,510 Z" strokeWidth="4.5" />
        </g>
        <rect x="360" y="525" width="80" height="42" rx="6" fill="#ffffff" />
        <text x="400" y="553" fill="#000000" fontSize="22" fontWeight="900" textAnchor="middle" fontFamily="var(--font-brand)" letterSpacing="2">
          DJ
        </text>
        <text x="400" y="735" fill="#ffffff" fontSize="28" fontWeight="800" textAnchor="middle" letterSpacing="6" fontFamily="var(--font-brand)">
          PISTA DE BAILE
        </text>
      </g>
    );
  }

  if (layoutType === 'u_amphitheater') {
    return (
      <g>
        <path
          d="M 100,45 L 185,45 L 185,460 A 115,115 0 0,0 415,460 L 415,45 L 500,45 L 500,460 A 200,200 0 0,1 100,460 Z"
          fill="#151b24"
        />
        <rect x="185" y="45" width="230" height="65" rx="14" fill="#252d3d" />
        <text
          x="300"
          y="85"
          fill="#ffffff"
          fontSize="19"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="3"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          ESCENARIO
        </text>
        <g>
          <rect x="185" y="115" width="230" height="215" fill="#1e2736" />
          <text
            x="300"
            y="230"
            fill="#ffffff"
            fontSize="22"
            fontWeight="800"
            textAnchor="middle"
            letterSpacing="4"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            PISTA
          </text>
          <g stroke="#2b3648" strokeWidth="2">
            <line x1="185" y1="336" x2="415" y2="336" />
            <line x1="185" y1="342" x2="415" y2="342" />
            <line x1="185" y1="348" x2="415" y2="348" />
            <line x1="185" y1="354" x2="415" y2="354" />
            <line x1="185" y1="360" x2="415" y2="360" />
          </g>
          <path
            d="M 185,368 L 415,368 L 415,460 A 115,115 0 0,1 185,460 Z"
            fill="#1e2736"
          />
          <text
            x="300"
            y="485"
            fill="#ffffff"
            fontSize="22"
            fontWeight="800"
            textAnchor="middle"
            letterSpacing="4"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            PISTA
          </text>
        </g>
      </g>
    );
  }

  if (layoutType === 'downtown_suites') {
    return (
      <g>
        <text x="170" y="70" fill="#ffffff" fontSize="24" fontWeight="900" letterSpacing="4" fontFamily="var(--font-brand)">
          SUITES URBANAS
        </text>
        <text x="170" y="88" fill="#94a3b8" fontSize="11" fontWeight="700" letterSpacing="4">
          QUITO
        </text>
        <polygon
          points="240,40 430,40 430,140 420,600 370,600 370,720 170,720 170,600 110,600 110,160 210,160"
          fill="#374151"
          opacity="0.85"
        />
        <text x="160" y="230" fill="#cbd5e1" fontSize="16" fontWeight="700" letterSpacing="4">
          SALÓN
        </text>
        <text x="310" y="380" fill="#cbd5e1" fontSize="16" fontWeight="700" letterSpacing="4">
          PISTA
        </text>
        <rect x="170" y="300" width="60" height="110" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="200" y="360" fill="#ec4899" fontSize="22" textAnchor="middle">🍸</text>
        <rect x="380" y="335" width="40" height="100" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="400" y="390" fill="#ec4899" fontSize="18" textAnchor="middle">🍸</text>
        <rect x="425" y="335" width="65" height="100" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="457" y="390" fill="#fff" fontSize="20" textAnchor="middle">🎧</text>
        <g stroke="#ec4899" strokeWidth="2" fill="#111827">
          <rect x="440" y="40" width="55" height="60" />
          <text x="467" y="70" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">SUITE 1</text>
          <rect x="440" y="105" width="55" height="50" />
          <text x="467" y="132" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">SUITE 2</text>
          <rect x="440" y="280" width="55" height="50" />
          <text x="467" y="307" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">SUITE 3</text>
          <rect x="440" y="440" width="55" height="40" fill="#ef4444" stroke="#ef4444" />
          <text x="467" y="464" fill="#fff" fontSize="9" fontWeight="900" textAnchor="middle">EVENTO VIP</text>
          <rect x="440" y="485" width="55" height="40" />
          <text x="467" y="509" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">SUITE 4</text>
        </g>
      </g>
    );
  }

  return (
    <g>
      <defs>
        <pattern id="editor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="800" y2="0" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="650" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="650" fill="url(#editor-grid)" />
      <rect x="240" y="25" width="320" height="55" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <text x="400" y="58" fill="#ffffff" fontSize="18" fontWeight="800" textAnchor="middle" letterSpacing="4" fontFamily="var(--font-brand)">
        ESCENARIO PRINCIPAL
      </text>
      <rect x="330" y="270" width="140" height="50" rx="8" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
      <text x="400" y="301" fill="#00f0ff" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="3" fontFamily="var(--font-brand)">
        CABINA DEL DJ
      </text>
      <circle cx="400" cy="295" r="140" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="2" strokeDasharray="6 6" />
      <text x="400" y="195" fill="rgba(255, 255, 255, 0.25)" fontSize="14" fontWeight="800" textAnchor="middle" letterSpacing="5" fontFamily="var(--font-brand)">
        PISTA CENTRAL
      </text>
      <rect x="40" y="220" width="45" height="150" rx="6" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="62" y="300" fill="#a78bfa" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(-90 62 300)" letterSpacing="2">
        BARRA LATERAL
      </text>
      <rect x="715" y="220" width="45" height="150" rx="6" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="737" y="300" fill="#a78bfa" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(90 737 300)" letterSpacing="2">
        BARRA VIP
      </text>
      <rect x="320" y="615" width="160" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <text x="400" y="632" fill="#64748b" fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="2">
        ENTRADA PRINCIPAL
      </text>
    </g>
  );
};

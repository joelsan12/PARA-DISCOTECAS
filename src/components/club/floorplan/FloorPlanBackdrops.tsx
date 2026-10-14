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
        {/* Gradas / Balcones exteriores del anfiteatro (arco exterior en U) */}
        <path
          d="M 80,35 L 165,35 L 165,340 A 135,95 0 0,0 435,340 L 435,35 L 520,35 L 520,340 A 220,185 0 0,1 80,340 Z"
          fill="#131722"
          stroke="rgba(229, 181, 79, 0.25)"
          strokeWidth="1.5"
        />

        {/* Escenario Principal */}
        <rect x="165" y="35" width="270" height="72" rx="14" fill="#222938" stroke="rgba(229, 181, 79, 0.45)" strokeWidth="1.5" />
        <rect x="171" y="39" width="258" height="6" rx="3" fill="#e5b54f" opacity="0.8" />
        <text
          x="300"
          y="78"
          fill="#ffffff"
          fontSize="22"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="5"
          style={{ fontFamily: 'var(--font-brand), system-ui, -apple-system, sans-serif' }}
        >
          ESCENARIO
        </text>

        {/* Pista Central */}
        <g>
          <rect x="165" y="110" width="270" height="200" fill="#18202d" />
          <text
            x="300"
            y="215"
            fill="rgba(255, 255, 255, 0.9)"
            fontSize="26"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="6"
            style={{ fontFamily: 'var(--font-brand), system-ui, -apple-system, sans-serif' }}
          >
            PISTA
          </text>

          {/* Gradas / Líneas de Nivel de Pista */}
          <g stroke="#263143" strokeWidth="2.5">
            <line x1="165" y1="315" x2="435" y2="315" />
            <line x1="165" y1="323" x2="435" y2="323" />
            <line x1="165" y1="331" x2="435" y2="331" />
            <line x1="165" y1="339" x2="435" y2="339" />
          </g>

          {/* Semicírculo de Pista Baja */}
          <path
            d="M 165,340 L 435,340 A 135,95 0 0,1 165,340 Z"
            fill="#18202d"
          />
          <text
            x="300"
            y="385"
            fill="rgba(255, 255, 255, 0.65)"
            fontSize="20"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="5"
            style={{ fontFamily: 'var(--font-brand), system-ui, -apple-system, sans-serif' }}
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
        <text x="200" y="360" fill="#ec4899" fontSize="13" fontWeight="800" letterSpacing="1" textAnchor="middle">BAR</text>
        <rect x="380" y="335" width="40" height="100" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="400" y="390" fill="#ec4899" fontSize="12" fontWeight="800" letterSpacing="1" textAnchor="middle">BAR</text>
        <rect x="425" y="335" width="65" height="100" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
        <text x="457" y="390" fill="#fff" fontSize="13" fontWeight="800" letterSpacing="1" textAnchor="middle">DJ</text>
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

  if (layoutType === 'macro_blueprint') {
    return (
      <g>
        <defs>
          {/* Technical Blueprint Grid Pattern */}
          <pattern id="mb-cad-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="30" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="1" />
          </pattern>
          {/* Subtle Glow Filters for Table Statuses in Blueprint */}
          <filter id="mb-glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="mb-glow-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="mb-glow-purple" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Blueprint Dark Base Background */}
        <rect width="1000" height="620" fill="#090d16" />
        <rect width="1000" height="620" fill="url(#mb-cad-grid)" />

        {/* Subtle Ambient Radial Lighting for VIP Areas */}
        <radialGradient id="mb-radial-center" cx="50%" cy="48%" r="40%">
          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.05)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
        </radialGradient>
        <rect width="1000" height="620" fill="url(#mb-radial-center)" pointerEvents="none" />

        {/* ── EXTERIOR BOUNDARY & ARCHITECTURAL CAD DOUBLE WALLS ── */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Outer Wall Boundary */}
          <path
            d="M 145,42 L 888,42 L 888,538 L 235,538 L 235,42 Z"
            fill="none"
            stroke="#64748b"
            strokeWidth="3.2"
          />
          {/* Inner Wall Boundary (Double-wall offset) */}
          <path
            d="M 153,50 L 880,50 L 880,530 L 243,530 L 243,50 Z"
            fill="none"
            stroke="#334155"
            strokeWidth="1.8"
          />

          {/* Top-Left Vestibule & Door Swing */}
          <path d="M 145,120 L 235,120" stroke="#64748b" strokeWidth="2.5" />
          <path d="M 235,42 L 235,82" stroke="#64748b" strokeWidth="2.5" />
          {/* Top-Left Door Leaf & Swing Arc */}
          <line x1="235" y1="82" x2="268" y2="55" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1.5" />
          <path d="M 235,82 A 38,38 0 0,0 271,44" fill="none" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="3 3" strokeWidth="1.2" />

          {/* Bottom-Left Door Swing */}
          <path d="M 235,498 L 235,538" stroke="#64748b" strokeWidth="2.5" />
          <line x1="235" y1="498" x2="268" y2="525" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1.5" />
          <path d="M 235,498 A 38,38 0 0,1 271,536" fill="none" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="3 3" strokeWidth="1.2" />

          {/* Bottom-Right Door Swing */}
          <path d="M 810,538 L 810,498" stroke="#64748b" strokeWidth="2.5" />
          <line x1="810" y1="498" x2="777" y2="525" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1.5" />
          <path d="M 810,498 A 38,38 0 0,0 774,536" fill="none" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="3 3" strokeWidth="1.2" />

          {/* Top-Right Door Swing into East Service Area */}
          <path d="M 810,42 L 810,82" stroke="#64748b" strokeWidth="2.5" />
          <line x1="810" y1="82" x2="777" y2="55" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1.5" />
          <path d="M 810,82 A 38,38 0 0,1 774,44" fill="none" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="3 3" strokeWidth="1.2" />
        </g>

        {/* ── EAST WALL COMPARTMENTS: STAIRS & SERVICE SUITES ── */}
        <g stroke="#64748b" strokeWidth="1.8" fill="none">
          {/* Top Service Alcove (Host VIP 01) */}
          <rect x="812" y="112" width="68" height="88" rx="2" stroke="#475569" strokeWidth="1.5" />
          {/* Desk & Chair Symbol */}
          <rect x="836" y="142" width="18" height="28" rx="3" fill="#131b29" stroke="#64748b" strokeWidth="1.2" />
          <rect x="858" y="132" width="22" height="48" rx="4" fill="#0d1422" stroke="#64748b" strokeWidth="1.5" />
          <line x1="812" y1="126" x2="812" y2="162" stroke="#090d16" strokeWidth="3" />
          <path d="M 812,126 A 26,26 0 0,1 838,152" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="2 2" strokeWidth="1" />

          {/* Middle Architectural Staircase with Hatching */}
          <rect x="822" y="235" width="58" height="95" rx="2" stroke="#64748b" strokeWidth="2" fill="#0d121f" />
          {/* Step Treads */}
          <line x1="822" y1="247" x2="880" y2="247" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="259" x2="880" y2="259" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="271" x2="880" y2="271" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="283" x2="880" y2="283" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="295" x2="880" y2="295" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="307" x2="880" y2="307" stroke="#475569" strokeWidth="1.2" />
          <line x1="822" y1="319" x2="880" y2="319" stroke="#475569" strokeWidth="1.2" />
          {/* Stair Direction Handrail & Arrow */}
          <line x1="851" y1="235" x2="851" y2="330" stroke="#94a3b8" strokeWidth="1.4" />
          <path d="M 851,245 L 847,253 M 851,245 L 855,253" stroke="#94a3b8" strokeWidth="1.4" />
          {/* Cut Line */}
          <line x1="822" y1="285" x2="880" y2="279" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Bottom Service Alcove (Host VIP 02) */}
          <rect x="812" y="365" width="68" height="88" rx="2" stroke="#475569" strokeWidth="1.5" />
          <rect x="836" y="395" width="18" height="28" rx="3" fill="#131b29" stroke="#64748b" strokeWidth="1.2" />
          <rect x="858" y="385" width="22" height="48" rx="4" fill="#0d1422" stroke="#64748b" strokeWidth="1.5" />
          <line x1="812" y1="379" x2="812" y2="415" stroke="#090d16" strokeWidth="3" />
          <path d="M 812,379 A 26,26 0 0,1 838,405" stroke="rgba(148, 163, 184, 0.35)" strokeDasharray="2 2" strokeWidth="1" />
        </g>

        {/* ── CAD SOFAS / FURNITURE BEHIND TABLES ── */}
        {/* Top North Row Sofas */}
        {/* Angled Corner Sofa (VIP-01) */}
        <g transform="translate(295, 96) rotate(-35)">
          <rect x="-28" y="-36" width="56" height="20" rx="5" fill="#111827" stroke="#64748b" strokeWidth="1.5" />
          <line x1="-18" y1="-36" x2="-18" y2="-16" stroke="#475569" strokeWidth="1" />
          <line x1="18" y1="-36" x2="18" y2="-16" stroke="#475569" strokeWidth="1" />
          {/* Glow Behind Emerald Table */}
          <ellipse cx="0" cy="0" rx="22" ry="14" fill="#10b981" opacity="0.35" filter="url(#mb-glow-green)" />
        </g>

        {/* Linear Sofas along North Wall (VIP-02 to VIP-07) */}
        {[
          { x: 370, color: '#10b981', filter: 'url(#mb-glow-green)' },
          { x: 445, color: '#10b981', filter: 'url(#mb-glow-green)' },
          { x: 515, color: '#10b981', filter: 'url(#mb-glow-green)' },
          { x: 590, color: '#f59e0b', filter: 'url(#mb-glow-amber)' },
          { x: 660, color: '#a855f7', filter: 'url(#mb-glow-purple)' },
          { x: 735, color: '#38bdf8', filter: '' },
        ].map((s, i) => (
          <g key={`north-sofa-${i}`} transform={`translate(${s.x}, 90)`}>
            {/* Sofa Backrest & Arms */}
            <rect x="-27" y="-32" width="54" height="18" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.5" />
            <line x1="-18" y1="-32" x2="-18" y2="-14" stroke="#334155" strokeWidth="1" />
            <line x1="18" y1="-32" x2="18" y2="-14" stroke="#334155" strokeWidth="1" />
            {/* Ambient Glow */}
            <ellipse cx="0" cy="0" rx="22" ry="12" fill={s.color} opacity="0.35" filter={s.filter} />
          </g>
        ))}

        {/* West Wall Sofas (VIP-08, VIP-09, VIP-10) */}
        {[180, 273, 360].map((y, i) => (
          <g key={`west-sofa-${i}`} transform={`translate(265, ${y})`}>
            {/* Vertical CAD Sofa */}
            <rect x="-35" y="-26" width="18" height="52" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.5" />
            <line x1="-35" y1="-17" x2="-17" y2="-17" stroke="#334155" strokeWidth="1" />
            <line x1="-35" y1="17" x2="-17" y2="17" stroke="#334155" strokeWidth="1" />
            {/* Glow */}
            <ellipse cx="0" cy="0" rx="14" ry="20" fill="#10b981" opacity="0.35" filter="url(#mb-glow-green)" />
          </g>
        ))}

        {/* Diagonal Service Bar Counter at Lower-Left */}
        <g transform="translate(290, 480) rotate(-35)">
          <rect x="-36" y="-12" width="72" height="24" rx="3" fill="#131b29" stroke="#64748b" strokeWidth="1.6" />
          <line x1="-24" y1="-12" x2="-24" y2="12" stroke="#475569" strokeWidth="1" />
          <line x1="24" y1="-12" x2="24" y2="12" stroke="#475569" strokeWidth="1" />
        </g>

        {/* ── CENTRAL OCTAGONAL RAILING & SUNKEN ARENA ── */}
        <g fill="none">
          {/* Outer Railing Boundary */}
          <polygon
            points="310,145 645,145 745,210 745,355 645,420 310,420 235,355 235,210"
            stroke="rgba(148, 163, 184, 0.55)"
            strokeWidth="2.6"
          />
          {/* Concentric Step 2 */}
          <polygon
            points="318,153 637,153 737,216 737,349 637,412 318,412 243,349 243,216"
            stroke="rgba(148, 163, 184, 0.38)"
            strokeWidth="1.6"
          />
          {/* Concentric Step 3 */}
          <polygon
            points="326,161 629,161 729,222 729,343 629,404 326,404 251,343 251,222"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1.2"
          />

          {/* Stepped Corner Braces / CAD Railing Posts */}
          <line x1="310" y1="145" x2="326" y2="161" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="645" y1="145" x2="629" y2="161" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="745" y1="210" x2="729" y2="222" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="745" y1="355" x2="729" y2="343" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="645" y1="420" x2="629" y2="404" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="310" y1="420" x2="326" y2="404" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="235" y1="355" x2="251" y2="343" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
          <line x1="235" y1="210" x2="251" y2="222" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
        </g>

        {/* Sofas & Glows for Central Arena Tables */}
        {/* West Central Sofas (ARENA-01, ARENA-02) */}
        {[242, 316].map((y, i) => (
          <g key={`inner-west-sofa-${i}`} transform={`translate(355, ${y})`}>
            <rect x="-32" y="-24" width="16" height="48" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.4" />
            <ellipse cx="0" cy="0" rx="14" ry="18" fill="#10b981" opacity="0.38" filter="url(#mb-glow-green)" />
          </g>
        ))}

        {/* North Central Sofas (ARENA-03, ARENA-04, ARENA-05) */}
        {[
          { x: 445, color: '#10b981', filter: 'url(#mb-glow-green)' },
          { x: 525, color: '#f59e0b', filter: 'url(#mb-glow-amber)' },
          { x: 605, color: '#f59e0b', filter: 'url(#mb-glow-amber)' },
        ].map((s, i) => (
          <g key={`inner-north-sofa-${i}`} transform={`translate(${s.x}, 192)`}>
            <rect x="-26" y="-28" width="52" height="16" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.4" />
            <ellipse cx="0" cy="0" rx="20" ry="12" fill={s.color} opacity="0.38" filter={s.filter} />
          </g>
        ))}

        {/* South Central Sofas (ARENA-06, ARENA-07, ARENA-08) */}
        {[
          { x: 445, color: '#f59e0b', filter: 'url(#mb-glow-amber)' },
          { x: 525, color: '#f59e0b', filter: 'url(#mb-glow-amber)' },
          { x: 605, color: '#38bdf8', filter: '' },
        ].map((s, i) => (
          <g key={`inner-south-sofa-${i}`} transform={`translate(${s.x}, 378)`}>
            <rect x="-26" y="12" width="52" height="16" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.4" />
            <ellipse cx="0" cy="0" rx="20" ry="12" fill={s.color} opacity="0.38" filter={s.filter} />
          </g>
        ))}

        {/* East Central Sofas (ARENA-09, ARENA-10) */}
        {[248, 322].map((y, i) => (
          <g key={`inner-east-sofa-${i}`} transform={`translate(705, ${y})`}>
            <rect x="16" y="-24" width="16" height="48" rx="4" fill="#0f1626" stroke="#475569" strokeWidth="1.4" />
            <ellipse cx="0" cy="0" rx="14" ry="18" fill="#38bdf8" opacity="0.25" />
          </g>
        ))}

        {/* ── SOUTH WALL LOUNGES & PARTITIONS ── */}
        {/* Utility shaft */}
        <rect x="375" y="475" width="24" height="52" rx="3" fill="#131b29" stroke="#475569" strokeWidth="1.5" />

        {/* South Lounge Sofas (VIP-11 to VIP-16) */}
        {[
          { x: 445, color: '#a855f7', filter: 'url(#mb-glow-purple)' },
          { x: 505, color: '#a855f7', filter: 'url(#mb-glow-purple)' },
          { x: 565, color: '#a855f7', filter: 'url(#mb-glow-purple)' },
          { x: 625, color: '#38bdf8', filter: '' },
          { x: 705, color: '#38bdf8', filter: '' },
          { x: 775, color: '#38bdf8', filter: '' },
        ].map((s, i) => (
          <g key={`south-sofa-${i}`} transform={`translate(${s.x}, 496)`}>
            {/* Outer Box Enclosure */}
            <rect x="-24" y="-18" width="48" height="42" rx="4" fill="#0d1422" stroke="#334155" strokeWidth="1.2" />
            {/* Sofa Backrest */}
            <rect x="-20" y="10" width="40" height="12" rx="3" fill="#111a2e" stroke="#475569" strokeWidth="1" />
            {/* Glow */}
            <ellipse cx="0" cy="0" rx="16" ry="12" fill={s.color} opacity="0.4" filter={s.filter} />
          </g>
        ))}

        {/* ── LOWER-LEFT BLUEPRINT LEGEND BOX ── */}
        <g transform="translate(30, 400)">
          {/* Glass Card */}
          <rect
            width="178"
            height="182"
            rx="12"
            fill="rgba(10, 14, 24, 0.92)"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="1.2"
          />
          {/* Swatch 1: En Sala */}
          <rect x="16" y="20" width="18" height="14" rx="4" fill="#10b981" filter="url(#mb-glow-green)" />
          <text x="44" y="32" fill="#e2e8f0" fontSize="12" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
            En Sala
          </text>

          {/* Swatch 2: Reservada/Hold */}
          <rect x="16" y="52" width="18" height="14" rx="4" fill="#f59e0b" filter="url(#mb-glow-amber)" />
          <text x="44" y="64" fill="#e2e8f0" fontSize="12" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
            Reservada/Hold
          </text>

          {/* Swatch 3: Cerrada */}
          <rect x="16" y="84" width="18" height="14" rx="4" fill="#a855f7" filter="url(#mb-glow-purple)" />
          <text x="44" y="96" fill="#e2e8f0" fontSize="12" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
            Cerrada
          </text>

          {/* Swatch 4: Slate Blue */}
          <rect x="16" y="116" width="18" height="14" rx="4" fill="#38bdf8" />
          <text x="44" y="128" fill="#94a3b8" fontSize="12" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
            Slate Blue
          </text>

          {/* Swatch 5: Slate Blue Dark */}
          <rect x="16" y="148" width="18" height="14" rx="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
          <text x="44" y="160" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
            Slate Blue
          </text>
        </g>

        {/* ── BOTTOM CENTER CAPTION ── */}
        <text
          x="540"
          y="592"
          fill="rgba(148, 163, 184, 0.45)"
          fontSize="12.5"
          fontWeight="500"
          letterSpacing="1.2"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Architectural interactive blueprint floor plan dimension
        </text>
      </g>
    );
  }

  if (layoutType === 'arena_vip_3d') {
    return (
      <g>
        <defs>
          {/* Intense Neon Amber / Gold Glow Filter */}
          <filter id="a3d-neon-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Amber Floor Lighting */}
          <radialGradient id="a3d-ambient-glow" cx="50%" cy="50%" r="45%">
            <stop offset="0%" stopColor="rgba(229, 181, 79, 0.12)" />
            <stop offset="60%" stopColor="rgba(217, 119, 6, 0.04)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>

          {/* DJ Stage Ambient Spotlight */}
          <radialGradient id="a3d-dj-spot" cx="53%" cy="28%" r="35%">
            <stop offset="0%" stopColor="rgba(245, 211, 138, 0.2)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>

          {/* 3D Extruded Wall Gradient */}
          <linearGradient id="a3d-wall-facet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252a38" />
            <stop offset="100%" stopColor="#10131b" />
          </linearGradient>
        </defs>

        {/* Dark Obsidian Base Floor */}
        <rect width="960" height="600" fill="#0d0f15" />
        <rect width="960" height="600" fill="url(#a3d-ambient-glow)" />
        <rect width="960" height="600" fill="url(#a3d-dj-spot)" />

        {/* ── 3D EXTRUDED PERIMETER WALLS (HAUTE NOCTURNE ANGLED CLUB) ── */}
        <g>
          {/* Wall Bottom Base Shadow / 3D Extrusion Depth */}
          <path
            d="M 180,115 L 690,115 L 865,220 L 865,370 L 895,420 L 895,560 L 95,560 L 95,530 L 180,115 Z"
            fill="#090a0f"
          />
          {/* Wall Vertical Face Facets (Isometric 3D Extrusion) */}
          <path
            d="M 95,560 L 95,530 L 180,105 L 188,105 L 105,530 L 105,560 Z"
            fill="url(#a3d-wall-facet)"
          />
          <path
            d="M 180,105 L 690,105 L 690,113 L 180,113 Z"
            fill="#1c212d"
          />
          <path
            d="M 690,105 L 865,210 L 865,218 L 690,113 Z"
            fill="#181d28"
          />
          <path
            d="M 865,210 L 865,365 L 865,373 L 865,218 Z"
            fill="#161a24"
          />
          <path
            d="M 865,365 L 895,415 L 895,423 L 865,373 Z"
            fill="#181d28"
          />
          <path
            d="M 895,415 L 895,555 L 895,560 L 895,423 Z"
            fill="#151922"
          />
          <path
            d="M 95,555 L 895,555 L 895,560 L 95,560 Z"
            fill="#12151e"
          />

          {/* Wall Top Crest Neon Gold Lighting Line */}
          <path
            d="M 95,530 L 180,105 L 690,105 L 865,210 L 865,365 L 895,415 L 895,555 L 95,555 Z"
            fill="none"
            stroke="#e5b54f"
            strokeWidth="2.8"
            filter="url(#a3d-neon-gold)"
            strokeLinejoin="round"
          />
        </g>

        {/* ── TOP ZONE: VIP SUITES (TOP LEFT) ── */}
        <g>
          {/* Suites Label */}
          <text
            x="345"
            y="130"
            fill="#cbd5e1"
            fontSize="14"
            fontWeight="800"
            letterSpacing="2.5"
            textAnchor="middle"
            fontFamily="var(--font-brand), system-ui, sans-serif"
          >
            Suites
          </text>

          {/* Suite 1 Enclosure (Left) */}
          <rect x="185" y="115" width="100" height="90" rx="3" fill="#11141c" stroke="#2a3040" strokeWidth="1.5" />
          {/* Suite 1 Wall Divider with Neon Rim */}
          <line x1="285" y1="115" x2="285" y2="205" stroke="#e5b54f" strokeWidth="2" filter="url(#a3d-neon-gold)" />
          {/* Suite 1 Plush U-Banquette */}
          <path
            d="M 200,195 L 200,135 L 270,135 L 270,195 L 255,195 L 255,150 L 215,150 L 215,195 Z"
            fill="#1c2230"
            stroke="rgba(229, 181, 79, 0.4)"
            strokeWidth="1.2"
          />

          {/* Suite 2 Enclosure (Right) */}
          <rect x="290" y="115" width="115" height="90" rx="3" fill="#11141c" stroke="#2a3040" strokeWidth="1.5" />
          {/* Suite 2 Wall Divider with Neon Rim */}
          <line x1="405" y1="115" x2="405" y2="205" stroke="#e5b54f" strokeWidth="2" filter="url(#a3d-neon-gold)" />
          {/* Suite 2 Plush U-Banquette */}
          <path
            d="M 305,195 L 305,135 L 390,135 L 390,195 L 375,195 L 375,150 L 320,150 L 320,195 Z"
            fill="#1c2230"
            stroke="rgba(229, 181, 79, 0.4)"
            strokeWidth="1.2"
          />

          {/* Suites Bottom Perimeter Neon Line */}
          <line x1="185" y1="205" x2="405" y2="205" stroke="#e5b54f" strokeWidth="2" filter="url(#a3d-neon-gold)" />
        </g>

        {/* ── TOP ZONE: CABINA DJ (CENTER TOP) ── */}
        <g>
          {/* DJ Protruding Curved Stage */}
          <path
            d="M 445,115 L 590,115 L 590,165 Q 517,195 445,165 Z"
            fill="#151a24"
            stroke="#2a3040"
            strokeWidth="1.5"
          />
          {/* DJ Stage Front Neon Strip */}
          <path
            d="M 445,165 Q 517,195 590,165"
            fill="none"
            stroke="#e5b54f"
            strokeWidth="3.2"
            filter="url(#a3d-neon-gold)"
          />

          {/* DJ Console Silhouette */}
          <rect x="475" y="140" width="85" height="24" rx="4" fill="#0b0e14" stroke="rgba(229, 181, 79, 0.6)" strokeWidth="1.4" />
          {/* DJ Text */}
          <text
            x="517"
            y="157"
            fill="#ffffff"
            fontSize="12.5"
            fontWeight="900"
            letterSpacing="2"
            textAnchor="middle"
            fontFamily="var(--font-brand), system-ui, sans-serif"
          >
            Cabina DJ
          </text>

          {/* Backstage Console / Bar to the Right */}
          <rect x="605" y="130" width="55" height="30" rx="6" fill="#131720" stroke="rgba(229, 181, 79, 0.5)" strokeWidth="1.6" filter="url(#a3d-neon-gold)" />
        </g>

        {/* ── WEST WALL: BOXES VIP EN FILA ── */}
        <g>
          {/* 5 Private Booth Compartments */}
          {[
            { y: 205, h: 62 },
            { y: 272, h: 62 },
            { y: 339, h: 62 },
            { y: 406, h: 62 },
            { y: 473, h: 62 },
          ].map((box, i) => (
            <g key={`box-bay-${i}`}>
              {/* Booth Floor Backing */}
              <rect x="125" y={box.y} width="110" height={box.h} fill="#11141c" stroke="#222734" strokeWidth="1.2" />
              {/* Divider Wall with Neon Golden Rim */}
              <line x1="125" y1={box.y} x2="235" y2={box.y} stroke="#e5b54f" strokeWidth="2.2" filter="url(#a3d-neon-gold)" />
              {/* Booth U-Sofa Backrest */}
              <path
                d={`M 140,${box.y + box.h - 8} L 140,${box.y + 12} L 220,${box.y + 12} L 220,${box.y + 24} L 154,${box.y + 24} L 154,${box.y + box.h - 8} Z`}
                fill="#1c212d"
                stroke="rgba(229, 181, 79, 0.35)"
                strokeWidth="1"
              />
            </g>
          ))}
          {/* Final Bottom Divider Wall for Box 5 */}
          <line x1="125" y1="535" x2="235" y2="535" stroke="#e5b54f" strokeWidth="2.2" filter="url(#a3d-neon-gold)" />

          {/* Lower-Left VIP Service Desk & Lamp */}
          <rect x="110" y="538" width="55" height="18" rx="3" fill="#181d28" stroke="rgba(229, 181, 79, 0.5)" strokeWidth="1.4" />
          <circle cx="155" cy="547" r="4" fill="#e5b54f" filter="url(#a3d-neon-gold)" />
        </g>

        {/* ── EAST ZONE: ANGLED PALCOS VIP (TERRACED BALCONIES) ── */}
        <g>
          {/* Palco 1 (Top East Balcony) */}
          <g transform="translate(645, 175) rotate(28)">
            <rect x="0" y="0" width="145" height="75" rx="6" fill="#131722" stroke="#272d3d" strokeWidth="1.4" />
            <line x1="0" y1="75" x2="145" y2="75" stroke="#e5b54f" strokeWidth="2.5" filter="url(#a3d-neon-gold)" />
            {/* Wrap-around Banquette */}
            <path
              d="M 12,12 L 133,12 L 133,63 L 118,63 L 118,24 L 27,24 L 27,63 L 12,63 Z"
              fill="#1d2332"
              stroke="rgba(229, 181, 79, 0.35)"
              strokeWidth="1"
            />
            <text x="72" y="44" fill="#cbd5e1" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="2">
              Palcos
            </text>
          </g>

          {/* Palco 2 (Middle East Balcony) */}
          <g transform="translate(710, 310)">
            <rect x="0" y="0" width="135" height="85" rx="6" fill="#131722" stroke="#272d3d" strokeWidth="1.4" />
            <line x1="0" y1="0" x2="0" y2="85" stroke="#e5b54f" strokeWidth="2.5" filter="url(#a3d-neon-gold)" />
            {/* Banquette */}
            <path
              d="M 12,12 L 123,12 L 123,73 L 108,73 L 108,24 L 27,24 L 27,73 L 12,73 Z"
              fill="#1d2332"
              stroke="rgba(229, 181, 79, 0.35)"
              strokeWidth="1"
            />
            <text x="67" y="48" fill="#cbd5e1" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="2">
              Palcos
            </text>
          </g>

          {/* Palco 3 (Lower East Lounge) */}
          <g transform="translate(640, 420) rotate(-24)">
            <rect x="0" y="0" width="135" height="75" rx="6" fill="#131722" stroke="#272d3d" strokeWidth="1.4" />
            <line x1="0" y1="0" x2="135" y2="0" stroke="#e5b54f" strokeWidth="2.5" filter="url(#a3d-neon-gold)" />
            {/* Banquette */}
            <path
              d="M 12,12 L 123,12 L 123,63 L 108,63 L 108,24 L 27,24 L 27,63 L 12,63 Z"
              fill="#1d2332"
              stroke="rgba(229, 181, 79, 0.35)"
              strokeWidth="1"
            />
            <text x="67" y="44" fill="#cbd5e1" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="2">
              Palcos
            </text>
          </g>
        </g>

        {/* ── CENTRAL SUNKEN ARENA (MULTI-TIERED PIT & GOLDEN STEPS) ── */}
        <g>
          {/* Tier 1 Outer Contour with Golden Neon Glow */}
          <polygon
            points="280,215 640,215 725,290 725,415 640,490 280,490 205,415 205,290"
            fill="#121620"
            stroke="#e5b54f"
            strokeWidth="3.4"
            filter="url(#a3d-neon-gold)"
          />
          {/* Tier 2 Middle Step Contour */}
          <polygon
            points="292,226 630,226 712,298 712,408 630,478 292,478 218,408 218,298"
            fill="#0f121a"
            stroke="rgba(229, 181, 79, 0.55)"
            strokeWidth="1.8"
          />
          {/* Tier 3 Sunken Dance Pit Floor */}
          <polygon
            points="304,237 620,237 698,306 698,400 620,466 304,466 232,400 232,306"
            fill="#0a0c12"
            stroke="rgba(229, 181, 79, 0.3)"
            strokeWidth="1.2"
          />

          {/* Golden Crescent Moon Accent Sofa in Pit Center */}
          <path
            d="M 385,325 A 40,40 0 0,1 385,395"
            fill="none"
            stroke="#e5b54f"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#a3d-neon-gold)"
          />

          {/* Luxury Curved Banquettes inside Pit */}
          {/* North Banquettes (Front of DJ) */}
          <rect x="435" y="238" width="105" height="32" rx="6" fill="#1b212e" stroke="rgba(229, 181, 79, 0.5)" strokeWidth="1.4" />
          {/* South Banquettes */}
          <rect x="425" y="425" width="115" height="34" rx="6" fill="#1b212e" stroke="rgba(229, 181, 79, 0.5)" strokeWidth="1.4" />

          {/* West Sunken Arena Banquette */}
          <path
            d="M 235,320 L 265,320 L 265,400 L 235,400 Z"
            fill="#1b212e"
            stroke="rgba(229, 181, 79, 0.5)"
            strokeWidth="1.4"
          />

          {/* Angled Sub-Station Console (Lower Right of Arena) */}
          <g transform="translate(585, 415) rotate(-32)">
            <rect x="0" y="0" width="55" height="20" rx="4" fill="#1b212e" stroke="#e5b54f" strokeWidth="1.6" filter="url(#a3d-neon-gold)" />
          </g>
        </g>

        {/* ── SOUTH WALL: LOUNGES EN FILA ── */}
        <g>
          {[270, 355, 440, 525].map((x, i) => (
            <g key={`south-lounge-${i}`}>
              <rect x={x} y="495" width="75" height="60" fill="#11141c" stroke="#222734" strokeWidth="1.2" />
              <line x1={x} y1="495" x2={x + 75} y2="495" stroke="#e5b54f" strokeWidth="2.2" filter="url(#a3d-neon-gold)" />
              {/* Backrest */}
              <rect x={x + 10} y="535" width="55" height="15" rx="3" fill="#1c212d" stroke="rgba(229, 181, 79, 0.4)" strokeWidth="1" />
            </g>
          ))}
          <line x1="600" y1="495" x2="600" y2="555" stroke="#e5b54f" strokeWidth="2.2" filter="url(#a3d-neon-gold)" />
        </g>

        {/* ── CAPTURE UI OVERLAYS (EXACT PILL BADGES FROM IMAGE 2) ── */}
        {/* Top-Left Pill: "Interactive Architectural 3D Blueprint" */}
        <g transform="translate(36, 26)">
          <rect
            width="295"
            height="38"
            rx="10"
            fill="rgba(18, 22, 32, 0.88)"
            stroke="rgba(229, 181, 79, 0.45)"
            strokeWidth="1.2"
          />
          <text
            x="18"
            y="24"
            fill="#f5d38a"
            fontSize="12.5"
            fontWeight="700"
            letterSpacing="0.4"
            fontFamily="var(--font-brand), system-ui, sans-serif"
          >
            Interactive Architectural 3D Blueprint
          </text>
        </g>

        {/* Top-Right Dropdown: "Select VIP Table reservation ⌄" */}
        <g transform="translate(680, 26)">
          <rect
            width="245"
            height="38"
            rx="10"
            fill="rgba(18, 22, 32, 0.88)"
            stroke="rgba(255, 255, 255, 0.14)"
            strokeWidth="1.2"
          />
          <text
            x="18"
            y="24"
            fill="#cbd5e1"
            fontSize="12.5"
            fontWeight="600"
            letterSpacing="0.3"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Select VIP Table reservation
          </text>
          <path d="M 220,21 L 225,26 L 230,21" stroke="#cbd5e1" strokeWidth="1.8" fill="none" strokeLinecap="round" />
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
      <rect x="330" y="270" width="140" height="50" rx="8" fill="#14141e" stroke="var(--brand-gold)" strokeWidth="2" />
      <text x="400" y="301" fill="var(--brand-gold)" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="3" fontFamily="var(--font-brand)">
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

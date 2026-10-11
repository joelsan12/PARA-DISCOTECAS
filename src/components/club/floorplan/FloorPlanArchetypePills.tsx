import React from 'react';
import type { ClubLayoutType } from '../../../types';

interface Props {
  layoutType: ClubLayoutType;
  onPresetChange: (preset: ClubLayoutType) => void;
}

const ARCHETYPE_OPTIONS: { id: ClubLayoutType; label: string }[] = [
  { id: 'horseshoe_vip', label: 'Herradura VIP' },
  { id: 'u_amphitheater', label: 'Anfiteatro en U' },
  { id: 'downtown_suites', label: 'Suites Urbanas' },
  { id: 'custom_open', label: 'Personalizado' },
];

export const FloorPlanArchetypePills: React.FC<Props> = ({ layoutType, onPresetChange }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Arquetipo:
      </span>
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bg-input, rgba(8, 8, 12, 0.85))',
          padding: '2px',
          borderRadius: '7px',
          border: '1px solid var(--border-light, rgba(229, 181, 79, 0.2))',
          gap: '2px',
        }}
      >
        {ARCHETYPE_OPTIONS.map((opt) => {
          const isActive = layoutType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPresetChange(opt.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                background: isActive ? 'var(--brand-gold, #e5b54f)' : 'transparent',
                border: 'none',
                color: isActive ? '#08080c' : 'var(--text-muted, #cbd5e1)',
                fontSize: '0.76rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

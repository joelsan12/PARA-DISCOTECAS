import React from 'react';
import type { ClubLayoutType } from '../../../types';
import { esLayout } from '../../../lib/esLabels';

interface Props {
  layoutType: ClubLayoutType;
  onPresetChange: (preset: ClubLayoutType) => void;
}

const ARCHETYPE_OPTIONS: { id: ClubLayoutType; label: string; icon: string; short: string }[] = [
  { id: 'horseshoe_vip', label: `${esLayout('horseshoe_vip')} y cabina del DJ`, short: esLayout('horseshoe_vip'), icon: '🏛️' },
  { id: 'u_amphitheater', label: `${esLayout('u_amphitheater')} de terciopelo`, short: esLayout('u_amphitheater'), icon: '🏟️' },
  { id: 'downtown_suites', label: `${esLayout('downtown_suites')} panorámicas`, short: esLayout('downtown_suites'), icon: '🍸' },
  { id: 'custom_open', label: 'Plano abierto y personalizado', short: esLayout('custom_open'), icon: '📐' }
];

export const FloorPlanArchetypePills: React.FC<Props> = ({ layoutType, onPresetChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Arquetipo:</span>
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '3px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        gap: '4px',
        flexWrap: 'wrap'
      }}>
        {ARCHETYPE_OPTIONS.map(opt => {
          const isActive = layoutType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPresetChange(opt.id)}
              style={{
                padding: '5px 11px',
                borderRadius: 'var(--radius-xs)',
                background: isActive ? 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)' : 'transparent',
                border: 'none',
                color: isActive ? '#040d1a' : '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

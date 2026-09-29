import React from 'react';
import type { ClubLayoutType } from '../../../types';
import { Sliders, Plus, Save, RotateCcw, Eye, CheckCircle2 } from 'lucide-react';
import { FloorPlanArchetypePills } from './FloorPlanArchetypePills';
import { formatUsd } from '../../../lib/formatUsd';

interface Props {
  layoutType: ClubLayoutType;
  tableCount: number;
  onPresetChange: (preset: ClubLayoutType) => void;
  onOpenArchetypesModal?: () => void;
  onOpenCustomRequestModal?: () => void;
  onOpenAddModal: () => void;
  onSaveFloorPlan: () => void;
  isSaving: boolean;
  onResetDefaults: () => void;
  onPreviewAsClient: () => void;
  saveToast: string | null;
}

export const FloorPlanToolbar: React.FC<Props> = ({
  layoutType,
  tableCount,
  onPresetChange,
  onOpenArchetypesModal,
  onOpenCustomRequestModal,
  onOpenAddModal,
  onSaveFloorPlan,
  isSaving,
  onResetDefaults,
  onPreviewAsClient,
  saveToast,
}) => {
  return (
    <>
      <div className="glass-card" style={{
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(9, 12, 20, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sliders size={18} color="#040d1a" />
            </span>
            <h2 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Diseñador de Plano &amp; Mesas
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(0, 240, 255, 0.15)',
              color: '#00f0ff',
              border: '1px solid rgba(0, 240, 255, 0.3)'
            }}>
              {tableCount} mesas activas
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 600
            }}>
              🟢 Auto-guardado activo
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Arrastra las mesas por el local, usa plantillas cenitales de arquetipos o solicita un plano a medida modelado por soporte.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Plantillas Cenitales Button */}
          {onOpenArchetypesModal && (
            <button
              type="button"
              onClick={onOpenArchetypesModal}
              title="Explorar galería de plantillas de arquetipos arquitectónicos"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(229, 181, 79, 0.12)',
                border: '1px solid rgba(229, 181, 79, 0.4)',
                color: '#e5b54f',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🏛️</span>
              <span>Plantillas Cenitales</span>
            </button>
          )}

          {/* Plano a Medida Button */}
          {onOpenCustomRequestModal && (
            <button
              type="button"
              onClick={onOpenCustomRequestModal}
              title={`Solicitar a soporte el modelado digital a medida de tu discoteca (cobro único de ${formatUsd(49)})`}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.25) 0%, rgba(20, 22, 34, 0.9) 100%)',
                border: '1px solid #e5b54f',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 14px rgba(229, 181, 79, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📐</span>
              <span>Plano a Medida</span>
              <span style={{
                fontSize: '0.62rem',
                background: '#e5b54f',
                color: '#08080c',
                padding: '1px 5px',
                borderRadius: '3px',
                fontWeight: 900
              }}>
                {formatUsd(49)}
              </span>
            </button>
          )}

          {/* Base Layout Archetype Selector (Extracted component) */}
          <FloorPlanArchetypePills layoutType={layoutType} onPresetChange={onPresetChange} />

          <button
            onClick={onOpenAddModal}
            className="btn-luxury-action"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Nueva Mesa
          </button>

          {/* Guardar Plano Button */}
          <button
            onClick={onSaveFloorPlan}
            disabled={isSaving}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={15} />
            {isSaving ? 'Guardando...' : 'Guardar Plano'}
          </button>

          {/* Restaurar Defaults */}
          <button
            onClick={onResetDefaults}
            title="Restaurar plantilla inicial de fábrica"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={13} /> Restaurar
          </button>

          <button
            onClick={onPreviewAsClient}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={15} color="var(--accent)" /> Probar como Cliente
          </button>
        </div>
      </div>

      {/* Save Toast Feedback */}
      {saveToast && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '12px 20px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={20} color="#34d399" />
          <span>{saveToast}</span>
        </div>
      )}
    </>
  );
};

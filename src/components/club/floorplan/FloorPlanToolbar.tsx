import React from 'react';
import type { ClubLayoutType } from '../../../types';
import { Plus, Save, RotateCcw, Eye, CheckCircle2, LayoutTemplate } from 'lucide-react';

interface Props {
  layoutType: ClubLayoutType;
  tableCount: number;
  onPresetChange?: (preset: ClubLayoutType) => void;
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
  tableCount,
  onOpenArchetypesModal,
  onOpenAddModal,
  onSaveFloorPlan,
  isSaving,
  onResetDefaults,
  onPreviewAsClient,
  saveToast,
}) => {
  return (
    <>
      <div
        className="glass-card floorplan-toolbar-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-glass-card, rgba(14, 14, 21, 0.94))',
          border: '1px solid var(--border-light, rgba(229, 181, 79, 0.2))',
          borderRadius: '12px',
        }}
      >
        {/* Izquierda: Título y estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--accent-subtle, rgba(229, 181, 79, 0.15))',
            border: '1px solid var(--border-light, rgba(229, 181, 79, 0.25))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <LayoutTemplate size={15} color="var(--brand-gold, #e5b54f)" />
          </div>

          <h2
            className="font-brand"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-high, #fff)',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            Diseñador de Plano
          </h2>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'var(--accent-subtle, rgba(229, 181, 79, 0.12))',
              color: 'var(--brand-gold, #e5b54f)',
              border: '1px solid var(--border-light, rgba(229, 181, 79, 0.25))',
            }}
          >
            {tableCount} {tableCount === 1 ? 'mesa activa' : 'mesas activas'}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              color: 'var(--state-success, #34d399)',
              background: 'var(--state-success-subtle, rgba(16, 185, 129, 0.08))',
              border: '1px solid var(--state-success-border, rgba(16, 185, 129, 0.25))',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--state-success, #34d399)',
                boxShadow: '0 0 6px var(--state-success, #34d399)',
              }}
            />
            <span>Guardado automático</span>
          </span>
        </div>

        {/* Derecha: Acciones principales limpias sin emojis ni anuncios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Botón + para agregar mesa */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-luxury-action"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              gap: '5px',
              fontWeight: 800,
            }}
          >
            <Plus size={15} />
            <span>Nueva Mesa</span>
          </button>

          {/* Botón de Plantillas donde se previsualiza antes de editarlas */}
          {onOpenArchetypesModal && (
            <button
              type="button"
              onClick={onOpenArchetypesModal}
              title="Previsualizar y cargar plantillas arquitectónicas"
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                gap: '6px',
                borderRadius: '6px',
                color: 'var(--brand-gold)',
                borderColor: 'var(--border-light, rgba(229, 181, 79, 0.3))',
              }}
            >
              <LayoutTemplate size={14} />
              <span>Plantillas</span>
            </button>
          )}

          {/* Vista Cliente */}
          <button
            type="button"
            onClick={onPreviewAsClient}
            title="Abrir vista de reserva del cliente"
            className="btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '0.78rem',
              gap: '6px',
              borderRadius: '6px',
            }}
          >
            <Eye size={14} color="var(--brand-gold)" />
            <span>Vista Cliente</span>
          </button>

          {/* Guardar Plano */}
          <button
            type="button"
            onClick={onSaveFloorPlan}
            disabled={isSaving}
            style={{
              padding: '6px 13px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Save size={14} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Plano'}</span>
          </button>

          {/* Restaurar */}
          <button
            type="button"
            onClick={onResetDefaults}
            title="Restaurar al último diseño guardado"
            className="btn-ghost"
            style={{
              padding: '6px 9px',
              fontSize: '0.76rem',
              gap: '5px',
              borderRadius: '6px',
            }}
          >
            <RotateCcw size={13} />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      {/* Save Toast Feedback */}
      {saveToast && (
        <div
          style={{
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
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <CheckCircle2 size={20} color="#34d399" />
          <span>{saveToast}</span>
        </div>
      )}
    </>
  );
};

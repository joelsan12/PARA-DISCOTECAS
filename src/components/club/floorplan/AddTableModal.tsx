import React from 'react';
import type { TableZone } from '../../../types';
import { Plus, X } from 'lucide-react';
import { AddTableFields } from './AddTableFields';
import { AddTableLivePreview } from './AddTableLivePreview';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTableCode: string;
  setNewTableCode: (code: string) => void;
  newTableBadge: string;
  setNewTableBadge: (badge: string) => void;
  newTableZone: TableZone;
  setNewTableZone: (zone: TableZone) => void;
  newTableCapacity: number;
  setNewTableCapacity: (cap: number) => void;
  newTableShape: 'circle' | 'pill' | 'square' | 'rect';
  setNewTableShape: (shape: 'circle' | 'pill' | 'square' | 'rect') => void;
  newTableColor: string;
  setNewTableColor: (color: string) => void;
  newTableMinSpend: number;
  setNewTableMinSpend: (spend: number) => void;
  newTableDeposit: number;
  setNewTableDeposit: (dep: number) => void;
}

export const AddTableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  newTableCode,
  setNewTableCode,
  newTableBadge,
  setNewTableBadge,
  newTableZone,
  setNewTableZone,
  newTableCapacity,
  setNewTableCapacity,
  newTableShape,
  setNewTableShape,
  newTableColor,
  setNewTableColor,
  newTableMinSpend,
  setNewTableMinSpend,
  newTableDeposit,
  setNewTableDeposit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={16} color="#040d1a" />
            </span>
            <h3 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Nueva Mesa VIP
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '20px' }}>
          <div>
            <AddTableFields
              newTableCode={newTableCode}
              setNewTableCode={setNewTableCode}
              newTableBadge={newTableBadge}
              setNewTableBadge={setNewTableBadge}
              newTableZone={newTableZone}
              setNewTableZone={setNewTableZone}
              newTableCapacity={newTableCapacity}
              setNewTableCapacity={setNewTableCapacity}
              newTableShape={newTableShape}
              setNewTableShape={setNewTableShape}
              newTableColor={newTableColor}
              setNewTableColor={setNewTableColor}
              newTableMinSpend={newTableMinSpend}
              setNewTableMinSpend={setNewTableMinSpend}
              newTableDeposit={newTableDeposit}
              setNewTableDeposit={setNewTableDeposit}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-luxury-action"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Insertar en Plano
              </button>
            </div>
          </div>

          {/* Right Column: Real-Time Preview */}
          <AddTableLivePreview
            newTableCode={newTableCode}
            newTableBadge={newTableBadge}
            newTableZone={newTableZone}
            newTableCapacity={newTableCapacity}
            newTableShape={newTableShape}
            newTableColor={newTableColor}
            newTableMinSpend={newTableMinSpend}
            newTableDeposit={newTableDeposit}
          />
        </form>
      </div>
    </div>
  );
};

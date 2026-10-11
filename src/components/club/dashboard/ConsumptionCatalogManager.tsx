import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Wine,
  Plus,
  Trash2,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import type { Club } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { callFunctions } from '../../../lib/functionsClient';
import type { ConsumptionCatalogItem } from '../../../types/saas';

interface Props {
  activeClub: Club;
  session?: AdminStaffSession;
}

const CATEGORIES = ['Tequila', 'Whisky', 'Gin', 'Vodka', 'Champagne', 'Mixers', 'Snacks', 'Vinos', 'Otros'];

export const ConsumptionCatalogManager: React.FC<Props> = ({ activeClub, session }) => {
  const [items, setItems] = useState<ConsumptionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // New item draft
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Tequila');

  const itemNameId = useId();
  const itemPriceId = useId();
  const itemCategoryId = useId();

  const isManagerOrOwner = session?.isSuperAdmin || session?.staffRole === 'manager' || session?.staffRole === 'owner';

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await callFunctions<{ items: ConsumptionCatalogItem[] }>('getConsumptionCatalog', {
        businessId: activeClub.id
      });
      setItems(res.items || []);
    } catch (err) {
      console.error('[CatalogManager] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClub.id]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFeedback({ kind: 'error', message: 'Precio inválido.' });
      return;
    }

    const skuDraft = `CAT-${newCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newItem: ConsumptionCatalogItem = {
      sku: skuDraft,
      name: newName.trim(),
      price: Math.round(priceNum * 100) / 100,
      category: newCategory
    };

    setItems(prev => [newItem, ...prev]);
    setNewName('');
    setNewPrice('');
    setFeedback(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCatalog = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await callFunctions('saveConsumptionCatalog', {
        businessId: activeClub.id,
        items
      });
      setFeedback({
        kind: 'success',
        message: 'Catálogo de consumo actualizado exitosamente en el servidor.'
      });
      await loadCatalog();
    } catch (err: unknown) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Error al guardar el catálogo.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.95) 0%, rgba(8, 10, 16, 0.98) 100%)',
      border: '1px solid rgba(229, 181, 79, 0.25)',
      borderRadius: '18px',
      padding: '28px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(229, 181, 79, 0.1)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e5b54f'
          }}>
            <Wine size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f4f1ea' }}>
                Catálogo de Consumo en Sala
              </h3>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(229, 181, 79, 0.12)',
                color: '#e5b54f',
                border: '1px solid rgba(229, 181, 79, 0.25)'
              }}>
                {items.length} PRODUCTOS
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Carta disponible para los meseros al registrar pedidos y comandas en mesas reservadas.
            </p>
          </div>
        </div>

        {isManagerOrOwner && (
          <button
            type="button"
            onClick={handleSaveCatalog}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
              color: '#0a0d14',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.84rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(229, 181, 79, 0.25)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Catálogo'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${feedback.kind === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.kind === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {feedback.kind === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Add New Item Row (Managers only) */}
      {isManagerOrOwner && (
        <form onSubmit={handleAddItem} style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) 110px auto',
          gap: '12px',
          alignItems: 'end'
        }}>
          <div>
            <label htmlFor={itemNameId} style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
              NOMBRE DEL PRODUCTO
            </label>
            <input
              id={itemNameId}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ej: Tequila Clase Azul Reposado 750ml"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f4f1ea',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor={itemCategoryId} style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
              CATEGORÍA
            </label>
            <select
              id={itemCategoryId}
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#f4f1ea',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={itemPriceId} style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
              PRECIO ($)
            </label>
            <input
              id={itemPriceId}
              type="number"
              step="0.01"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="180.00"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#f4f1ea',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px'
            }}
          >
            <Plus size={15} />
            <span>Añadir</span>
          </button>
        </form>
      )}

      {/* Catalog Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '0.84rem' }}>
          Cargando catálogo...
        </div>
      ) : (
        <div style={{
          maxHeight: '440px',
          overflowY: 'auto',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem' }}>PRODUCTO</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem' }}>CATEGORÍA</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem' }}>PRECIO VENTA</th>
                {isManagerOrOwner && <th style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem' }}>ACCIÓN</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr
                  key={`${it.sku}-${idx}`}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                  }}
                >
                  <td style={{ padding: '12px 16px', color: '#f4f1ea', fontWeight: 600 }}>
                    {it.name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                      {it.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e5b54f', fontWeight: 800, fontFamily: 'monospace' }}>
                    ${it.price.toFixed(2)}
                  </td>
                  {isManagerOrOwner && (
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px',
                          color: '#f87171',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

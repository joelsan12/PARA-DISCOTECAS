import React, { useState, useEffect } from 'react';
import type { ClubLayoutType, TableZone } from '../../types';
import { useClubStore } from '../../store/clubStore';
import { FloorPlanToolbar } from './floorplan/FloorPlanToolbar';
import { FloorPlanCanvas } from './floorplan/FloorPlanCanvas';
import { TablePropertiesSidebar } from './floorplan/TablePropertiesSidebar';
import { AddTableModal } from './floorplan/AddTableModal';
import { useFloorPlanDrag } from './floorplan/useFloorPlanDrag';
import { ArchetypePresetsModal } from './floorplan/ArchetypePresetsModal';
import { CustomFloorPlanRequestModal } from './floorplan/CustomFloorPlanRequestModal';
import { esLayout } from '../../lib/esLabels';

export const FloorPlanEditor: React.FC = () => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const layoutType: ClubLayoutType = activeClub.layout_type || 'horseshoe_vip';

  const clubTables = store.tables.filter(t => t.club_id === activeClub.id);
  const activeEvent = store.events.find(e => e.club_id === activeClub.id) || store.events[0];
  const eventPricings = store.eventPricing.filter(p => p.event_id === activeEvent?.id);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(clubTables[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isArchetypesModalOpen, setIsArchetypesModalOpen] = useState(false);
  const [isCustomRequestModalOpen, setIsCustomRequestModalOpen] = useState(false);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Add Table Form State
  const [newTableCode, setNewTableCode] = useState('');
  const [newTableBadge, setNewTableBadge] = useState('');
  const [newTableZone, setNewTableZone] = useState<TableZone>('VIP Stage');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(8);
  const [newTableShape, setNewTableShape] = useState<'circle' | 'pill' | 'square' | 'rect'>('circle');
  const [newTableColor, setNewTableColor] = useState<string>('#eab308');
  const [newTableMinSpend, setNewTableMinSpend] = useState<number>(800);
  const [newTableDeposit, setNewTableDeposit] = useState<number>(200);

  const {
    svgRef,
    isDragging,
    draggedTableId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useFloorPlanDrag({
    snapToGrid,
    onUpdateTablePosition: (id, x, y) => store.updateTable(id, { x, y }, undefined, true),
    onDragEnd: () => store.notify(),
  });

  const selectedTable = clubTables.find(t => t.id === selectedTableId) || null;
  const draggedTable = clubTables.find(t => t.id === draggedTableId) || null;
  const selectedPricing = selectedTable
    ? eventPricings.find(p => p.table_id === selectedTable.id)
    : null;

  const viewBoxWidth = layoutType === 'horseshoe_vip' ? 800 : layoutType === 'u_amphitheater' ? 600 : layoutType === 'downtown_suites' ? 600 : 800;
  const viewBoxHeight = layoutType === 'horseshoe_vip' ? 800 : layoutType === 'u_amphitheater' ? 780 : layoutType === 'downtown_suites' ? 960 : 650;

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newTableCode.trim() || `VIP-${clubTables.length + 1}`;
    const badge = newTableBadge.trim() || code;

    let spawnX = 50;
    let spawnY = layoutType === 'u_amphitheater' ? 48 : 50;
    const existingAtSpot = clubTables.some(t => Math.abs(t.x - spawnX) < 4 && Math.abs(t.y - spawnY) < 4);
    if (existingAtSpot) {
      spawnX = 48 + Math.floor(Math.random() * 8);
      spawnY = 46 + Math.floor(Math.random() * 8);
    }

    const newTbl = store.addTable(
      activeClub.id,
      {
        table_code: code,
        badge_number: badge,
        zone: newTableZone,
        capacity: Number(newTableCapacity),
        shape: newTableShape,
        tier_color: newTableColor,
        tier_name: newTableZone,
        x: spawnX,
        y: spawnY
      },
      {
        min_spend: Number(newTableMinSpend),
        deposit_required: Number(newTableDeposit),
        includes: [`${newTableCapacity} Pases VIP`, '1 Botella Premium']
      }
    );

    setSelectedTableId(newTbl.id);
    setIsAddModalOpen(false);
    setNewTableCode('');
    setNewTableBadge('');
    setSaveToast(`✨ ¡Mesa ${newTbl.table_code} creada con éxito! Arrástrala en el plano para ubicarla.`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleDeleteSelected = () => {
    if (!selectedTableId) return;

    if (confirmDeleteId === selectedTableId) {
      const tableCode = selectedTable?.table_code || 'Mesa';
      store.deleteTable(selectedTableId);
      setSelectedTableId(null);
      setConfirmDeleteId(null);
      setSaveToast(`🗑️ ${tableCode} eliminada correctamente.`);
      setTimeout(() => setSaveToast(null), 4000);
    } else {
      setConfirmDeleteId(selectedTableId);
      setTimeout(() => {
        setConfirmDeleteId(curr => (curr === selectedTableId ? null : curr));
      }, 4500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (selectedTableId) {
          e.preventDefault();
          const tableCode = selectedTable?.table_code || 'Mesa';
          store.deleteTable(selectedTableId);
          setSelectedTableId(null);
          setConfirmDeleteId(null);
          const keyLabel = e.key === 'Backspace' ? 'Retroceso' : 'Suprimir';
          setSaveToast(`🗑️ ${tableCode} eliminada (tecla ${keyLabel}).`);
          setTimeout(() => setSaveToast(null), 4000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableId, selectedTable, store]);

  const handleDuplicateSelected = () => {
    if (!selectedTableId) return;
    const copy = store.duplicateTable(selectedTableId);
    if (copy) {
      setSelectedTableId(copy.id);
    }
  };

  const handlePresetChange = (preset: ClubLayoutType) => {
    store.loadLayoutPreset(activeClub.id, preset);
    setSelectedTableId(null);
    setSaveToast(`✓ Arquetipo "${esLayout(preset)}" cargado y guardado.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveFloorPlan = () => {
    setIsSaving(true);
    store.persistNow();
    setTimeout(() => {
      setIsSaving(false);
      setSaveToast('✓ ¡Plano y arquetipo guardados con éxito en memoria persistente!');
      setTimeout(() => setSaveToast(null), 3500);
    }, 150);
  };

  const handleResetDefaults = () => {
    if (confirm(`¿Restaurar el plano de "${activeClub.name}" a los valores predeterminados de fábrica?`)) {
      store.resetToDefaults(activeClub.id);
      setSelectedTableId(null);
      setSaveToast('Plano restaurado a los valores originales.');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <FloorPlanToolbar
        layoutType={layoutType}
        tableCount={clubTables.length}
        onPresetChange={handlePresetChange}
        onOpenArchetypesModal={() => setIsArchetypesModalOpen(true)}
        onOpenCustomRequestModal={() => setIsCustomRequestModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onSaveFloorPlan={handleSaveFloorPlan}
        isSaving={isSaving}
        onResetDefaults={handleResetDefaults}
        onPreviewAsClient={() => {
          store.persistNow();
          const activeClub = store.clubs.find(c => c.id === store.activeClubId);
          const slug = activeClub?.slug || '';
          window.open(`http://localhost:5173/negocio/${slug}`, '_blank');
        }}
        saveToast={saveToast}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
        gap: '20px',
        alignItems: 'start'
      }}>
        <FloorPlanCanvas
          svgRef={svgRef}
          layoutType={layoutType}
          clubTables={clubTables}
          selectedTableId={selectedTableId}
          draggedTableId={draggedTableId}
          draggedTable={draggedTable}
          hoveredTableId={hoveredTableId}
          isDragging={isDragging}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          setHoveredTableId={setHoveredTableId}
          handlePointerDown={(table, e) => {
            setSelectedTableId(table.id);
            handlePointerDown(table, e);
          }}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
        />

        <TablePropertiesSidebar
          selectedTable={selectedTable}
          selectedPricing={selectedPricing}
          confirmDeleteId={confirmDeleteId}
          onDeleteSelected={handleDeleteSelected}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onDuplicateSelected={handleDuplicateSelected}
          onUpdateTable={(id, partial) => store.updateTable(id, partial)}
          onUpdatePricing={(tableId, minSpend, deposit) => {
            if (activeEvent) {
              store.updateEventTablePricing(activeEvent.id, tableId, minSpend, deposit);
            }
          }}
        />
      </div>

      <AddTableModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTableSubmit}
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

      <ArchetypePresetsModal
        isOpen={isArchetypesModalOpen}
        onClose={() => setIsArchetypesModalOpen(false)}
        currentLayout={layoutType}
        onSelectPreset={handlePresetChange}
        onRequestCustomPlan={() => setIsCustomRequestModalOpen(true)}
      />

      <CustomFloorPlanRequestModal
        isOpen={isCustomRequestModalOpen}
        onClose={() => setIsCustomRequestModalOpen(false)}
        clubName={activeClub.name}
        clubCity={activeClub.city}
      />
    </div>
  );
};

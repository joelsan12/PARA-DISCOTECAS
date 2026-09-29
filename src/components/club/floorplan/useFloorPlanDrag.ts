import { useState, useRef } from 'react';
import type { ClubTable } from '../../../types';

interface DragOptions {
  snapToGrid: boolean;
  onUpdateTablePosition: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
}

export function useFloorPlanDrag({ snapToGrid, onUpdateTablePosition, onDragEnd }: DragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    tableStartX: number;
    tableStartY: number;
    svgWidth: number;
    svgHeight: number;
  } | null>(null);

  const handlePointerDown = (table: ClubTable, e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      tableStartX: table.x,
      tableStartY: table.y,
      svgWidth: rect.width,
      svgHeight: rect.height
    };

    setIsDragging(true);
    setDraggedTableId(table.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !draggedTableId || !dragStartRef.current) return;

    const { startX, startY, tableStartX, tableStartY, svgWidth, svgHeight } = dragStartRef.current;
    if (svgWidth <= 0 || svgHeight <= 0) return;

    const deltaPixelX = e.clientX - startX;
    const deltaPixelY = e.clientY - startY;

    const deltaPctX = (deltaPixelX / svgWidth) * 100;
    const deltaPctY = (deltaPixelY / svgHeight) * 100;

    let targetX = tableStartX + deltaPctX;
    let targetY = tableStartY + deltaPctY;

    if (snapToGrid) {
      targetX = Math.round(targetX);
      targetY = Math.round(targetY);
    } else {
      targetX = Math.round(targetX * 10) / 10;
      targetY = Math.round(targetY * 10) / 10;
    }

    const clampedX = Math.max(3, Math.min(97, targetX));
    const clampedY = Math.max(3, Math.min(97, targetY));

    onUpdateTablePosition(draggedTableId, clampedX, clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      setIsDragging(false);
      setDraggedTableId(null);
      dragStartRef.current = null;
      onDragEnd();
    }
  };

  return {
    svgRef,
    isDragging,
    draggedTableId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

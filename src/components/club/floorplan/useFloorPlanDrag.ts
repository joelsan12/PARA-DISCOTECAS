import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClubTable } from '../../../types';

interface DragOptions {
  snapToGrid: boolean;
  onUpdateTablePosition: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
}

export function useFloorPlanDrag({ snapToGrid, onUpdateTablePosition, onDragEnd }: DragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const snapToGridRef = useRef(snapToGrid);
  const onUpdateTablePositionRef = useRef(onUpdateTablePosition);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    snapToGridRef.current = snapToGrid;
    onUpdateTablePositionRef.current = onUpdateTablePosition;
    onDragEndRef.current = onDragEnd;
  }, [snapToGrid, onUpdateTablePosition, onDragEnd]);

  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    tableStartX: number;
    tableStartY: number;
    svgWidth: number;
    svgHeight: number;
  } | null>(null);

  const draggedTableIdRef = useRef<string | null>(null);
  const latestCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((table: ClubTable, e: React.PointerEvent) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      tableStartX: table.x,
      tableStartY: table.y,
      svgWidth: rect.width,
      svgHeight: rect.height,
    };

    draggedTableIdRef.current = table.id;
    latestCoordsRef.current = { x: table.x, y: table.y };
    setDragCoords({ x: table.x, y: table.y });
    setDraggedTableId(table.id);
    setIsDragging(true);
  }, []);

  // Global window listeners while dragging to guarantee smooth 60fps movement anywhere on screen
  useEffect(() => {
    if (!isDragging) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current || !draggedTableIdRef.current) return;

      const { startX, startY, tableStartX, tableStartY, svgWidth, svgHeight } = dragStartRef.current;
      if (svgWidth <= 0 || svgHeight <= 0) return;

      const deltaPixelX = e.clientX - startX;
      const deltaPixelY = e.clientY - startY;

      const deltaPctX = (deltaPixelX / svgWidth) * 100;
      const deltaPctY = (deltaPixelY / svgHeight) * 100;

      let targetX = tableStartX + deltaPctX;
      let targetY = tableStartY + deltaPctY;

      if (snapToGridRef.current) {
        targetX = Math.round(targetX);
        targetY = Math.round(targetY);
      } else {
        targetX = Math.round(targetX * 10) / 10;
        targetY = Math.round(targetY * 10) / 10;
      }

      const clampedX = Math.max(2, Math.min(98, targetX));
      const clampedY = Math.max(2, Math.min(98, targetY));

      latestCoordsRef.current = { x: clampedX, y: clampedY };
      setDragCoords({ x: clampedX, y: clampedY });
      onUpdateTablePositionRef.current(draggedTableIdRef.current, clampedX, clampedY);
    };

    const onWindowPointerUp = () => {
      const finalId = draggedTableIdRef.current;
      const finalCoords = latestCoordsRef.current;

      if (finalId && finalCoords) {
        onUpdateTablePositionRef.current(finalId, finalCoords.x, finalCoords.y);
      }

      setIsDragging(false);
      setDraggedTableId(null);
      setDragCoords(null);
      dragStartRef.current = null;
      latestCoordsRef.current = null;

      onDragEndRef.current();
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [isDragging]);

  // Fallbacks for direct event handling on elements if needed
  const handlePointerMove = useCallback((_e: React.PointerEvent) => {
    // Handled by global window listener
  }, []);

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    // Handled by global window listener
  }, []);

  return {
    svgRef,
    isDragging,
    draggedTableId,
    dragCoords,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}


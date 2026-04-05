import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useTouchDrag } from './useTouchDrag';
import type { TouchDragHandlers } from './useTouchDrag';
import type { RefObject } from 'react';

export interface SlotTileDrag extends TouchDragHandlers {
  dragRef: RefObject<HTMLButtonElement | null>;
}

interface UseSlotTileDragOptions {
  /** ID of the tile currently in this slot. Null = slot is empty (drag disabled). */
  tileId: string | null;
  label: string | null;
  zoneIndex: number;
  /**
   * Called when the dragged tile is dropped on a target zone.
   * By this point REMOVE_TILE has already been dispatched, so the tile is back
   * in the bank and can be placed normally.
   */
  onDrop: (tileId: string, targetZoneIndex: number) => void;
}

/**
 * Enables an occupied slot tile to be dragged back to the bank or to another
 * slot. Works with both the HTML5 DnD (desktop) and pointer-events drag (touch).
 *
 * On drag start the tile is immediately returned to the bank via REMOVE_TILE so
 * that the subsequent PLACE_TILE from the drop target works with standard bank
 * tile logic.
 */
export const useSlotTileDrag = ({
  tileId,
  label,
  zoneIndex,
  onDrop,
}: UseSlotTileDragOptions): SlotTileDrag => {
  const dispatch = useAnswerGameDispatch();
  const dragRef = useRef<HTMLButtonElement>(null);

  // HTML5 DnD — desktop
  useEffect(() => {
    if (!tileId) return;
    const element = dragRef.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId }),
      onDragStart: () => dispatch({ type: 'REMOVE_TILE', zoneIndex }),
    });
  }, [tileId, zoneIndex, dispatch]);

  // Pointer-events drag — touch / mobile
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useTouchDrag({
      tileId: tileId ?? '',
      label: label ?? '',
      onDragStart: tileId
        ? () => dispatch({ type: 'REMOVE_TILE', zoneIndex })
        : undefined,
      onDrop,
    });

  return {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};

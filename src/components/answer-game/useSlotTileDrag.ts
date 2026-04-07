import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useCallback, useEffect, useRef } from 'react';
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
   * REMOVE_TILE is dispatched before this callback, so the tile is back
   * in the bank and can be placed normally.
   */
  onDrop: (tileId: string, targetZoneIndex: number) => void;
}

/**
 * Enables an occupied slot tile to be dragged back to the bank or to another
 * slot. Works with both the HTML5 DnD (desktop) and pointer-events drag (touch).
 *
 * On drag start the tile is marked active via SET_DRAG_ACTIVE so it remains
 * visible in the slot during the drag. On a confirmed drop, REMOVE_TILE is
 * dispatched first (returning the tile to the bank) then onDrop is called so
 * the drop target can place it normally. On cancel or missed drop, the tile
 * snaps back via SET_DRAG_ACTIVE with tileId: null.
 */
export const useSlotTileDrag = ({
  tileId,
  label,
  zoneIndex,
  onDrop,
}: UseSlotTileDragOptions): SlotTileDrag => {
  const dispatch = useAnswerGameDispatch();
  const dragRef = useRef<HTMLButtonElement>(null);

  // Keep a stable ref to onDrop so the HTML5 adapter closure stays current.
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  // HTML5 DnD — desktop
  useEffect(() => {
    if (!tileId) return;
    const element = dragRef.current;
    if (!element) return;
    const currentTileId = tileId;
    const currentZoneIndex = zoneIndex;
    return draggable({
      element,
      // Include sourceZoneIndex so the drop target can identify slot-tile drags
      // and defer placement to this hook's onDrop handler.
      getInitialData: () => ({
        tileId: currentTileId,
        sourceZoneIndex: currentZoneIndex,
      }),
      onDragStart: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: currentTileId }),
      onDrop: ({ location }) => {
        const targets = location.current.dropTargets;
        if (targets.length > 0) {
          // Confirmed drop on a zone: remove tile from source slot first,
          // then place via the onDrop callback.
          const targetZoneIndex = targets[0]?.data['zoneIndex'];
          if (typeof targetZoneIndex === 'number') {
            dispatch({
              type: 'REMOVE_TILE',
              zoneIndex: currentZoneIndex,
            });
            dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
            onDropRef.current(currentTileId, targetZoneIndex);
          } else {
            // Drop target exists but has no zoneIndex — treat as cancel.
            dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
          }
        } else {
          // No drop target — cancel, tile snaps back.
          dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        }
      },
    });
  }, [tileId, zoneIndex, dispatch]);

  // Wrap onDrop for the touch path: dispatch REMOVE_TILE before calling onDrop.
  const handleTouchDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      dispatch({ type: 'REMOVE_TILE', zoneIndex });
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      onDrop(droppedTileId, targetZoneIndex);
    },
    [dispatch, zoneIndex, onDrop],
  );

  // Pointer-events drag — touch / mobile
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useTouchDrag({
      tileId: tileId ?? '',
      label: label ?? '',
      onDragStart: tileId
        ? () => dispatch({ type: 'SET_DRAG_ACTIVE', tileId })
        : undefined,
      onDragCancel: tileId
        ? () => dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null })
        : undefined,
      onDrop: handleTouchDrop,
    });

  return {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};

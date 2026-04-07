import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
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
   * The caller (useSlotBehavior.handleDrop) is responsible for dispatching
   * REMOVE_TILE or SWAP_TILES as appropriate.
   */
  onDrop: (tileId: string, targetZoneIndex: number) => void;
  /**
   * Called immediately before REMOVE_TILE is dispatched when the tile
   * is returning to the bank (no valid drop target). Use this to trigger
   * the eject-return animation while the slot button is still in the DOM.
   */
  onBankReturn?: () => void;
}

/**
 * Enables an occupied slot tile to be dragged back to the bank or to another
 * slot. Works with both the HTML5 DnD (desktop) and pointer-events drag (touch).
 *
 * On drag start the tile is marked active via SET_DRAG_ACTIVE so it remains
 * visible in the slot during the drag.
 *
 * On confirmed drop on a valid zone: SET_DRAG_ACTIVE is cleared and onDrop is
 * called so the caller can dispatch SWAP_TILES or REMOVE_TILE+PLACE_TILE.
 *
 * On cancel or no valid drop target: onBankReturn is called (for animation),
 * then REMOVE_TILE + SET_DRAG_ACTIVE are dispatched to return the tile to bank.
 */
export const useSlotTileDrag = ({
  tileId,
  label,
  zoneIndex,
  onDrop,
  onBankReturn,
}: UseSlotTileDragOptions): SlotTileDrag => {
  const dispatch = useAnswerGameDispatch();
  const dragRef = useRef<HTMLButtonElement>(null);

  // Keep stable refs so the HTML5 adapter closure stays current.
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const onBankReturnRef = useRef(onBankReturn);
  useEffect(() => {
    onBankReturnRef.current = onBankReturn;
  }, [onBankReturn]);

  // HTML5 DnD — desktop
  useEffect(() => {
    if (!tileId) return;
    const element = dragRef.current;
    if (!element) return;
    const currentTileId = tileId;
    const currentZoneIndex = zoneIndex;
    return draggable({
      element,
      getInitialData: () => ({
        tileId: currentTileId,
        sourceZoneIndex: currentZoneIndex,
      }),
      onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element,
            input: location.current.input,
          }),
          render({ container }) {
            const rect = element.getBoundingClientRect();
            const ghost = document.createElement('div');
            // Copy full innerHTML so Tailwind classes (e.g. text-2xl) on
            // inner elements are preserved — avoids the shrunken-font issue
            // that occurs when reading fontSize from the button itself.
            ghost.innerHTML = element.innerHTML;
            Object.assign(ghost.style, {
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--card, #fff)',
              color: 'var(--card-foreground, #000)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              transform: 'scale(1.08)',
            });
            container.append(ghost);
            return () => ghost.remove();
          },
        });
      },
      onDragStart: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: currentTileId }),
      onDrop: ({ location }) => {
        const targets = location.current.dropTargets;
        const targetZoneIndex = targets[0]?.data['zoneIndex'];

        // Always clear drag state first.
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });

        if (targets.length > 0 && typeof targetZoneIndex === 'number') {
          // Confirmed drop on a valid slot — caller handles REMOVE_TILE / SWAP_TILES.
          onDropRef.current(currentTileId, targetZoneIndex);
        } else {
          // No valid slot target (dropped on bank or outside) — return to bank.
          onBankReturnRef.current?.();
          dispatch({
            type: 'REMOVE_TILE',
            zoneIndex: currentZoneIndex,
          });
        }
      },
    });
  }, [tileId, zoneIndex, dispatch]);

  // Wrap onDrop for the touch path: caller handles REMOVE_TILE / SWAP_TILES.
  const handleTouchDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      onDrop(droppedTileId, targetZoneIndex);
    },
    [dispatch, onDrop],
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
        ? () => {
            onBankReturnRef.current?.();
            dispatch({ type: 'REMOVE_TILE', zoneIndex });
            dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
          }
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

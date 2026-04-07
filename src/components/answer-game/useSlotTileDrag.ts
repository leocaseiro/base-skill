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
   * SWAP_TILES as appropriate.
   */
  onDrop: (tileId: string, targetZoneIndex: number) => void;
}

/**
 * Enables an occupied slot tile to be dragged to another slot.
 * Works with both the HTML5 DnD (desktop) and pointer-events drag (touch).
 *
 * Tiles can return to the bank by dropping on the bank container (REMOVE_TILE).
 *
 * On drag start the tile is marked active via SET_DRAG_ACTIVE so it remains
 * visible in the slot during the drag.
 *
 * On confirmed drop on a valid zone: SET_DRAG_ACTIVE is cleared and onDrop is
 * called so the caller can dispatch SWAP_TILES.
 *
 * On cancel or no valid drop target: SET_DRAG_ACTIVE is cleared and the tile
 * stays in its current slot (no-op).
 */
export const useSlotTileDrag = ({
  tileId,
  label,
  zoneIndex,
  onDrop,
}: UseSlotTileDragOptions): SlotTileDrag => {
  const dispatch = useAnswerGameDispatch();
  const dragRef = useRef<HTMLButtonElement>(null);

  // Keep stable refs so the HTML5 adapter closure stays current.
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
    return draggable({
      element,
      getInitialData: () => ({
        tileId: currentTileId,
        sourceZoneIndex: zoneIndex,
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
        const isBankTarget = targets[0]?.data['isBankTarget'];

        // Always clear drag state first.
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });

        if (targets.length > 0 && typeof targetZoneIndex === 'number') {
          // Confirmed drop on a valid slot — caller handles SWAP_TILES.
          onDropRef.current(currentTileId, targetZoneIndex);
        } else if (isBankTarget === true) {
          // Dropped on the tile bank — return tile to bank.
          dispatch({ type: 'REMOVE_TILE', zoneIndex });
        }
        // else: dropped outside a slot — tile stays put (no-op)
      },
    });
  }, [tileId, zoneIndex, dispatch]);

  // Wrap onDrop for the touch path: caller handles SWAP_TILES.
  const handleTouchDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      onDrop(droppedTileId, targetZoneIndex);
    },
    [dispatch, onDrop],
  );

  // Touch: dropped on the tile bank — return tile to bank.
  const handleTouchDropOnBank = useCallback(() => {
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
    dispatch({ type: 'REMOVE_TILE', zoneIndex });
  }, [dispatch, zoneIndex]);

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
            // Dropped outside all targets — tile stays in slot (no-op).
            dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
          }
        : undefined,
      onDrop: handleTouchDrop,
      onDropOnBank: handleTouchDropOnBank,
    });

  return {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};

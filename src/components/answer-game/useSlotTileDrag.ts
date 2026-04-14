import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
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
  onHoverZone?: (zoneIndex: number | null) => void;
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
  onHoverZone,
}: UseSlotTileDragOptions): SlotTileDrag => {
  const dispatch = useAnswerGameDispatch();
  const { bankTileIds } = useAnswerGameContext();
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
            // Build a FRESH div (not cloneNode). Copy the button's inner
            // markup so child styling (font-bold, tabular-nums, etc.) is
            // preserved via document-level stylesheets, and apply resolved
            // outer styles explicitly so the ghost is self-contained and
            // doesn't depend on ancestor CSS vars or `rounded-[inherit]`.
            const rect = element.getBoundingClientRect();
            const computed = getComputedStyle(element);
            const ghost = document.createElement('div');
            ghost.innerHTML = element.innerHTML;
            // border-radius shorthand can serialize to '' when set via
            // `inherit`; read longhands explicitly.
            const radius = [
              computed.borderTopLeftRadius,
              computed.borderTopRightRadius,
              computed.borderBottomRightRadius,
              computed.borderBottomLeftRadius,
            ].join(' ');
            Object.assign(ghost.style, {
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: computed.backgroundColor,
              backgroundImage: computed.backgroundImage,
              color: computed.color,
              borderRadius: radius,
              fontSize: computed.fontSize,
              fontFamily: computed.fontFamily,
              fontWeight: computed.fontWeight,
              border: '1px solid rgba(0,0,0,0.15)',
              boxSizing: 'border-box',
              transform: 'scale(1.08)',
              pointerEvents: 'none',
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
        const bankTileId = targets[0]?.data['bankTileId'];
        const isBankTarget = targets.some(
          (t) => t.data['isBankTarget'] === true,
        );

        // Always clear drag state first.
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: null });

        if (targets.length > 0 && typeof targetZoneIndex === 'number') {
          // Confirmed drop on a valid slot — caller handles SWAP_TILES.
          onDropRef.current(currentTileId, targetZoneIndex);
        } else if (typeof bankTileId === 'string') {
          // Dropped on a specific bank tile — swap slot tile ↔ bank tile.
          dispatch({ type: 'SWAP_SLOT_BANK', zoneIndex, bankTileId });
        } else if (isBankTarget) {
          // Dropped on the tile bank container (empty hole) — return tile.
          dispatch({ type: 'REMOVE_TILE', zoneIndex });
        }
        // else: dropped outside — tile stays put (no-op)
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

  // Touch: dropped on the tile bank (empty hole) — return tile to bank.
  const handleTouchDropOnBank = useCallback(() => {
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
    dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: null });
    dispatch({ type: 'REMOVE_TILE', zoneIndex });
  }, [dispatch, zoneIndex]);

  // Touch: dropped on a specific bank tile — swap slot tile ↔ bank tile.
  const handleTouchDropOnBankTile = useCallback(
    (bankTileId: string) => {
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: null });
      if (bankTileIds.includes(bankTileId)) {
        dispatch({ type: 'SWAP_SLOT_BANK', zoneIndex, bankTileId });
      } else {
        // bankTileId is not currently in the bank (edge case) — just return.
        dispatch({ type: 'REMOVE_TILE', zoneIndex });
      }
    },
    [dispatch, zoneIndex, bankTileIds],
  );

  // Touch: hovering over a bank tile hole during drag.
  const handleTouchHoverBankTile = useCallback(
    (bankTileId: string | null) => {
      dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: bankTileId });
    },
    [dispatch],
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
            // Dropped outside all targets — tile stays in slot (no-op).
            dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
          }
        : undefined,
      onDrop: handleTouchDrop,
      onDropOnBank: handleTouchDropOnBank,
      onDropOnBankTile: handleTouchDropOnBankTile,
      onHoverBankTile: handleTouchHoverBankTile,
      onHoverZone,
    });

  return {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};

import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useSlotTileDrag } from '../useSlotTileDrag';
import { useTileEvaluation } from '../useTileEvaluation';
import {
  triggerEjectReturn,
  triggerPop,
  triggerShake,
} from './slot-animations';
import type { RefObject } from 'react';
import { playSound } from '@/lib/audio/AudioFeedback';

export interface SlotRenderProps {
  label: string | null;
  tileId: string | null;
  isActive: boolean;
  isWrong: boolean;
  isLocked: boolean;
  isEmpty: boolean;
  showCursor: boolean;
  isPreview: boolean;
  previewLabel: string | null;
}

export interface UseSlotBehaviorReturn {
  renderProps: SlotRenderProps;
  /** Outer wrapper — registered as drop target, carries data-zone-index. */
  outerRef: RefObject<HTMLElement | null>;
  /** Inner visual div — used for animations (shake, pop, eject). */
  slotRef: RefObject<HTMLElement | null>;
  dragRef: RefObject<HTMLButtonElement | null>;
  handleClick: () => void;
  isBeingDragged: boolean;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  };
}

export const useSlotBehavior = (
  index: number,
): UseSlotBehaviorReturn => {
  const {
    zones,
    allTiles,
    bankTileIds,
    activeSlotIndex,
    config,
    dragActiveTileId,
    dragHoverZoneIndex,
  } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { placeTile } = useTileEvaluation();

  const zone = zones[index];
  const tileId = zone?.placedTileId ?? null;
  const tile = tileId ? allTiles.find((t) => t.id === tileId) : null;
  const label = tile?.label ?? null;
  const isWrong = zone?.isWrong ?? false;
  const isLocked = zone?.isLocked ?? false;
  const isEmpty = tileId === null;

  // Resolve interaction mode: explicit config or inferred from inputMethod
  const slotInteraction =
    config.slotInteraction ??
    (config.inputMethod === 'type' ? 'ordered' : 'free-swap');
  const isOrdered = slotInteraction === 'ordered';

  const isActive = isOrdered && activeSlotIndex === index;
  const showCursor =
    isActive && isEmpty && config.inputMethod !== 'drag';
  const isBeingDragged = tileId !== null && dragActiveTileId === tileId;

  // Preview derivation
  const isPreviewTarget =
    dragHoverZoneIndex === index && dragActiveTileId !== null;

  const draggedTile = dragActiveTileId
    ? allTiles.find((t) => t.id === dragActiveTileId)
    : null;

  let isPreview = false;
  let previewLabel: string | null = null;

  if (isPreviewTarget) {
    isPreview = true;
    previewLabel = draggedTile?.label ?? null;
  } else if (isBeingDragged && dragHoverZoneIndex !== null) {
    // This slot is the source of the active drag AND the drag is hovering over some target.
    isPreview = true;
    // Source slot shows what it will receive: the target's current tile label.
    const targetZone = zones[dragHoverZoneIndex];
    const targetTile = targetZone?.placedTileId
      ? allTiles.find((t) => t.id === targetZone.placedTileId)
      : null;
    previewLabel = targetTile?.label ?? null; // null means source will become empty
  }

  const outerRef = useRef<HTMLElement | null>(null);
  const slotRef = useRef<HTMLElement | null>(null);
  const prevIsWrongRef = useRef(isWrong);
  const prevTileIdRef = useRef(tileId);
  const prevDragActiveTileIdRef = useRef(dragActiveTileId);
  // Holds the startFade handle returned by triggerEjectReturn so we can call
  // it when EJECT_TILE fires and the tile is back in the bank.
  const startFadeRef = useRef<(() => void) | null>(null);

  // Drop target handler — choose evaluation or swap based on interaction mode
  const handleDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      const targetZone = zones[targetZoneIndex];
      if (!targetZone) return;

      // Always check for slot-to-slot drag first (regardless of interaction
      // mode) so that SWAP_TILES clears the source slot. Falling through to
      // placeTile for slot-to-slot would leave the source unchanged and
      // duplicate the tile.
      const sourceZoneIndex = zones.findIndex(
        (z) => z.placedTileId === droppedTileId,
      );
      if (sourceZoneIndex !== -1) {
        const droppedTile = allTiles.find(
          (t) => t.id === droppedTileId,
        );
        const displacedTile = targetZone.placedTileId
          ? allTiles.find((t) => t.id === targetZone.placedTileId)
          : null;
        const sourceZone = zones[sourceZoneIndex];
        const droppedCorrect =
          droppedTile?.value === targetZone.expectedValue;

        if (displacedTile) {
          // True swap: correct if either tile lands correctly
          const displacedCorrect =
            displacedTile.value === sourceZone?.expectedValue;
          playSound(
            droppedCorrect || displacedCorrect ? 'correct' : 'wrong',
          );
        } else {
          // Move to empty slot: evaluate only the moved tile
          playSound(droppedCorrect ? 'correct' : 'wrong');
        }

        dispatch({
          type: 'SWAP_TILES',
          fromZoneIndex: sourceZoneIndex,
          toZoneIndex: targetZoneIndex,
        });
        return;
      }
      placeTile(droppedTileId, targetZoneIndex);
    },
    [placeTile, zones, dispatch, allTiles],
  );

  // Register outerRef (the wrapper element, p-1.5 larger than the visual slot)
  // as the drop target so the hit area extends ~6 px beyond the visual slot on
  // all sides. getIsSticky keeps the target active once the pointer enters it,
  // matching the pragmatic-board card pattern.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getIsSticky: () => true,
      getData: () => ({ zoneIndex: index }),
      onDragEnter: () => {
        dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: index });
      },
      onDragLeave: () => {
        dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
      },
      onDrop: ({ source }) => {
        dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
        // Slot-tile drags (sourceZoneIndex present) handle their own
        // REMOVE_TILE + SET_DRAG_ACTIVE sequence via useSlotTileDrag's onDrop.
        if (typeof source.data['sourceZoneIndex'] === 'number') return;
        const sourceTileId = source.data['tileId'];
        if (typeof sourceTileId === 'string') {
          handleDrop(sourceTileId, index);
          // Clear drag active state here — the draggable component (bank tile)
          // unmounts when PLACE_TILE fires, so its own onDrop may never run.
          dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        }
      },
    });
  }, [index, handleDrop, dispatch]);

  const handleHoverZone = useCallback(
    (zoneIndex: number | null) => {
      dispatch({ type: 'SET_DRAG_HOVER', zoneIndex });
    },
    [dispatch],
  );

  // Drag source for filled slots
  const {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useSlotTileDrag({
    tileId,
    label,
    zoneIndex: index,
    onDrop: handleDrop,
    onHoverZone: handleHoverZone,
  });

  // Click handler: remove tile from slot (returns to bank)
  const handleClick = useCallback(() => {
    if (isEmpty) return;
    dispatch({ type: 'REMOVE_TILE', zoneIndex: index });
  }, [isEmpty, dispatch, index]);

  // Feedback animations: trigger on state transitions
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    const prevDragActiveTileId = prevDragActiveTileIdRef.current;
    prevDragActiveTileIdRef.current = dragActiveTileId;

    const wasWrong = prevIsWrongRef.current;
    prevIsWrongRef.current = isWrong;

    const prevTileId = prevTileIdRef.current;
    prevTileIdRef.current = tileId;
    const freshlyPlaced = tileId !== null && prevTileId === null;

    if (
      tileId !== null &&
      prevTileId !== null &&
      tileId !== prevTileId
    ) {
      // Tile swapped between slots — animate per zone; sound played once in handleDrop.
      if (isWrong) {
        triggerShake(el);
      } else {
        triggerPop(el);
      }
    } else if (isWrong && !wasWrong) {
      // Newly wrong via PLACE_TILE (sound already played by useTileEvaluation).
      triggerShake(el);

      if (config.wrongTileBehavior === 'lock-auto-eject') {
        // Start the eject animation after the shake settles.
        const animationTimerId = setTimeout(() => {
          const tileEl = dragRef.current;
          if (!tileEl) return;
          const { startFade } = triggerEjectReturn(
            tileEl,
            tileId,
            () => {},
          );
          startFadeRef.current = startFade;
        }, 350);
        return () => clearTimeout(animationTimerId);
      }
    } else if (freshlyPlaced && !isWrong) {
      // Correctly placed from bank (sound already played by useTileEvaluation).
      triggerPop(el);
    } else if (tileId === null && prevTileId !== null) {
      // Tile left this slot.
      // Suppress the sound only when the tile moved to another slot (swap/move),
      // where handleDrop already played the sound. If the tile went back to the
      // bank (REMOVE_TILE via drag), play 'tile-place' here.
      const movedToSlot =
        prevTileId === prevDragActiveTileId &&
        !bankTileIds.includes(prevTileId);
      if (!movedToSlot) {
        playSound('tile-place');
      }
      startFadeRef.current?.();
      startFadeRef.current = null;
    }
  }, [
    isWrong,
    tileId,
    bankTileIds,
    config.wrongTileBehavior,
    dragRef,
    dragActiveTileId,
  ]);

  // EJECT_TILE dispatch lives in its own effect (no DOM ref needed) so the
  // timer survives when the bank tile unmounts after PLACE_TILE. The animation
  // effect above also uses isWrong/tileId so both fire on the same transition.
  useEffect(() => {
    if (!isWrong || config.wrongTileBehavior !== 'lock-auto-eject')
      return;
    const timerId = setTimeout(() => {
      dispatch({ type: 'EJECT_TILE', zoneIndex: index });
    }, 1000);
    return () => clearTimeout(timerId);
  }, [isWrong, config.wrongTileBehavior, dispatch, index]);

  return {
    renderProps: {
      label,
      tileId,
      isActive,
      isWrong,
      isLocked,
      isEmpty,
      showCursor,
      isPreview,
      previewLabel,
    },
    outerRef,
    slotRef,
    dragRef,
    handleClick,
    isBeingDragged,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
};

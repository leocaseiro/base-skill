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
}

export interface UseSlotBehaviorReturn {
  renderProps: SlotRenderProps;
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
  const { zones, allTiles, activeSlotIndex, config, dragActiveTileId } =
    useAnswerGameContext();
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

  const slotRef = useRef<HTMLElement | null>(null);
  const prevIsWrongRef = useRef(isWrong);
  const prevTileIdRef = useRef(tileId);
  // Holds the startFade handle returned by triggerEjectReturn so we can call
  // it when EJECT_TILE fires and the tile is back in the bank.
  const startFadeRef = useRef<(() => void) | null>(null);

  // Drop target handler — choose evaluation or swap based on interaction mode
  const handleDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      if (isOrdered) {
        placeTile(droppedTileId, targetZoneIndex);
        return;
      }
      // free-swap: swap if target is occupied by a slot tile, otherwise place
      const targetZone = zones[targetZoneIndex];
      if (!targetZone) return;
      if (targetZone.placedTileId !== null) {
        const sourceZoneIndex = zones.findIndex(
          (z) => z.placedTileId === droppedTileId,
        );
        if (sourceZoneIndex !== -1) {
          dispatch({
            type: 'SWAP_TILES',
            fromZoneIndex: sourceZoneIndex,
            toZoneIndex: targetZoneIndex,
          });
          return;
        }
      }
      placeTile(droppedTileId, targetZoneIndex);
    },
    [isOrdered, placeTile, zones, dispatch],
  );

  // Register as drop target
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ zoneIndex: index }),
      onDrop: ({ source }) => {
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
      // Tile swapped between slots — animate and sound based on new correctness.
      if (isWrong) {
        triggerShake(el);
        playSound('wrong');
      } else {
        triggerPop(el);
        playSound('correct');
      }
    } else if (isWrong && !wasWrong) {
      // Newly wrong via PLACE_TILE (sound already played by useTileEvaluation).
      triggerShake(el);

      if (config.wrongTileBehavior === 'lock-auto-eject') {
        const timerId = setTimeout(() => {
          const tileEl = dragRef.current;
          if (!tileEl) return;
          const { startFade } = triggerEjectReturn(
            tileEl,
            tileId,
            () => {},
          );
          startFadeRef.current = startFade;
        }, 350);
        return () => clearTimeout(timerId);
      }
    } else if (freshlyPlaced && !isWrong) {
      // Correctly placed from bank (sound already played by useTileEvaluation).
      triggerPop(el);
    } else if (tileId === null && prevTileId !== null) {
      // Tile returned to bank (click, drag, or eject).
      playSound('tile-place');
      startFadeRef.current?.();
      startFadeRef.current = null;
    }
  }, [isWrong, tileId, config.wrongTileBehavior, dragRef]);

  return {
    renderProps: {
      label,
      tileId,
      isActive,
      isWrong,
      isLocked,
      isEmpty,
      showCursor,
    },
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

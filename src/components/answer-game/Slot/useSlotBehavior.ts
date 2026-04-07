import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useFreeSwap } from '../useFreeSwap';
import { useSlotTileDrag } from '../useSlotTileDrag';
import { useTileEvaluation } from '../useTileEvaluation';
import { triggerPop, triggerShake } from './slot-animations';
import type { RefObject } from 'react';

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
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

export const useSlotBehavior = (
  index: number,
): UseSlotBehaviorReturn => {
  const { zones, allTiles, activeSlotIndex, config } =
    useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { placeTile } = useTileEvaluation();
  const { swapOrPlace } = useFreeSwap();

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

  const slotRef = useRef<HTMLElement | null>(null);
  const prevIsWrongRef = useRef(isWrong);
  const prevTileIdRef = useRef(tileId);

  // Drop target handler — choose evaluation or swap based on interaction mode
  const handleDrop = useCallback(
    (droppedTileId: string, targetZoneIndex: number) => {
      if (isOrdered) {
        placeTile(droppedTileId, targetZoneIndex);
      } else {
        swapOrPlace(droppedTileId, targetZoneIndex);
      }
    },
    [isOrdered, placeTile, swapOrPlace],
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
        // REMOVE_TILE + placeTile sequence via useSlotTileDrag's onDrop.
        if (typeof source.data['sourceZoneIndex'] === 'number') return;
        const sourceTileId = source.data['tileId'];
        if (typeof sourceTileId === 'string') {
          handleDrop(sourceTileId, index);
        }
      },
    });
  }, [index, handleDrop]);

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

    if (isWrong && !wasWrong) {
      triggerShake(el);
    } else if (freshlyPlaced && !isWrong) {
      triggerPop(el);
    }
  }, [isWrong, tileId]);

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
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
};

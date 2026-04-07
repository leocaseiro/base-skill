import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useAutoNextSlot } from './useAutoNextSlot';
import { useGameTTS } from './useGameTTS';
import { useTileEvaluation } from './useTileEvaluation';
import { useTouchDrag } from './useTouchDrag';
import type { TileItem } from './types';
import type { TouchDragHandlers } from './useTouchDrag';
import type { RefObject } from 'react';

export interface DraggableTile extends TouchDragHandlers {
  ref: RefObject<HTMLButtonElement | null>;
  handleClick: () => void;
}

export const useDraggableTile = (tile: TileItem): DraggableTile => {
  const ref = useRef<HTMLButtonElement>(null);
  const dispatch = useAnswerGameDispatch();
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();
  const speakTileRef = useRef(speakTile);
  const { placeTile } = useTileEvaluation();

  useEffect(() => {
    speakTileRef.current = speakTile;
  }, [speakTile]);

  // HTML5 DnD — desktop (no SET_DRAG_ACTIVE to avoid browser snap-back fadeout)
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
      onDragStart: () => speakTileRef.current(tile.label),
    });
  }, [tile.id, tile.label]);

  // Pointer-events drag — touch / mobile
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useTouchDrag({
      tileId: tile.id,
      label: tile.label,
      onDragStart: () => {
        speakTileRef.current(tile.label);
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: tile.id });
      },
      onDragCancel: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
      onDrop: (droppedTileId, zoneIndex) => {
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        placeTile(droppedTileId, zoneIndex);
      },
    });

  const handleClick = () => {
    speakTile(tile.label);
    placeInNextSlot(tile.id);
  };

  return {
    ref,
    handleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};

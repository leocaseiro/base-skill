import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
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

  // HTML5 DnD — desktop
  // SET_DRAG_ACTIVE on start so slots can show a preview while the bank tile
  // is being dragged. Cleared on drop (slot handler also clears it on success,
  // so the double-clear here is idempotent).
  // Also registered as a drop target so slot tiles can be dropped onto this
  // bank tile to trigger SWAP_SLOT_BANK. onDragEnter sets the hover preview;
  // hover is cleared by SET_DRAG_ACTIVE(null) when the drag ends.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const cleanupDraggable = draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
      onDragStart: () => {
        speakTileRef.current(tile.label);
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: tile.id });
      },
      onDrop: () => dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
    });
    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: () => ({ bankTileId: tile.id, isBankTarget: true }),
      onDragEnter: () =>
        dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: tile.id }),
    });
    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [tile.id, tile.label, dispatch]);

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

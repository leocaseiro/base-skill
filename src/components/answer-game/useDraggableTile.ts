import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { triggerShake } from './Slot/slot-animations';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useAutoNextSlot } from './useAutoNextSlot';
import { useGameTTS } from './useGameTTS';
import { useTileEvaluation } from './useTileEvaluation';
import { useTouchDrag } from './useTouchDrag';
import type { TileItem } from './types';
import type { TouchDragHandlers } from './useTouchDrag';
import type { RefObject } from 'react';
import { playSound } from '@/lib/audio/AudioFeedback';
import { getGameEventBus } from '@/lib/game-event-bus';
import { resolveSkin } from '@/lib/skin';

export interface DraggableTile extends TouchDragHandlers {
  ref: RefObject<HTMLButtonElement | null>;
  handleClick: () => void;
}

export const useDraggableTile = (tile: TileItem): DraggableTile => {
  const ref = useRef<HTMLButtonElement>(null);
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  // Mirror state in a ref so onDragStart can read current gameId/roundIndex
  // without adding `state` to the draggable() effect's deps (which would
  // re-subscribe pragmatic-drag-and-drop on every game-state change).
  const stateRef = useRef(state);
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();
  const speakTileRef = useRef(speakTile);
  const { placeTile } = useTileEvaluation();
  const skin = resolveSkin(state.config.gameId, state.config.skin);

  useEffect(() => {
    speakTileRef.current = speakTile;
  }, [speakTile]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
        getGameEventBus().emit({
          type: 'game:drag-start',
          gameId: stateRef.current.config.gameId,
          sessionId: '',
          profileId: '',
          timestamp: Date.now(),
          roundIndex: stateRef.current.roundIndex,
          tileId: tile.id,
        });
      },
      onDrop: () => dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
    });
    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: () => ({ bankTileId: tile.id, isBankTarget: true }),
      onDragEnter: () =>
        dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: tile.id }),
      onDragLeave: () =>
        dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: null }),
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
        getGameEventBus().emit({
          type: 'game:drag-start',
          gameId: stateRef.current.config.gameId,
          sessionId: '',
          profileId: '',
          timestamp: Date.now(),
          roundIndex: stateRef.current.roundIndex,
          tileId: tile.id,
        });
      },
      onDragCancel: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
      onDrop: (droppedTileId, zoneIndex) => {
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        const { correct } = placeTile(droppedTileId, zoneIndex);
        if (
          !correct &&
          stateRef.current.config.wrongTileBehavior === 'reject' &&
          ref.current
        ) {
          requestAnimationFrame(() => {
            if (ref.current) {
              triggerShake(ref.current);
              ref.current.style.background =
                'var(--skin-wrong-bg, #f87171)';
              ref.current.style.borderColor =
                'var(--skin-wrong-border, #ef4444)';
              ref.current.addEventListener(
                'animationend',
                () => {
                  if (ref.current) {
                    ref.current.style.background = '';
                    ref.current.style.borderColor = '';
                  }
                },
                { once: true },
              );
            }
          });
        }
      },
      onDropOnBank: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
      onDropOnBankTile: () =>
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null }),
      onHoverZone: (zoneIndex) => {
        dispatch({ type: 'SET_DRAG_HOVER', zoneIndex });
        if (zoneIndex !== null) {
          getGameEventBus().emit({
            type: 'game:drag-over-zone',
            gameId: stateRef.current.config.gameId,
            sessionId: '',
            profileId: '',
            timestamp: Date.now(),
            roundIndex: stateRef.current.roundIndex,
            zoneIndex,
          });
        }
      },
    });

  const handleClick = () => {
    if (ref.current?.dataset.shaking) return;

    speakTile(tile.label);
    const result = placeInNextSlot(tile.id);

    if (result.rejected && ref.current) {
      ref.current.dataset.shaking = 'true';
      triggerShake(ref.current);
      const el = ref.current;
      el.style.background = 'var(--skin-wrong-bg, #f87171)';
      el.style.borderColor = 'var(--skin-wrong-border, #ef4444)';
      el.addEventListener(
        'animationend',
        () => {
          el.style.background = '';
          el.style.borderColor = '';
          delete el.dataset.shaking;
        },
        { once: true },
      );

      if (!skin.suppressDefaultSounds) {
        playSound('wrong', 0.8);
      }

      // Tap/click path only — drag rejects are handled in useTileEvaluation.placeTile
      dispatch({
        type: 'REJECT_TAP',
        tileId: tile.id,
        zoneIndex: result.zoneIndex,
      });

      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: state.config.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: state.roundIndex,
        answer: tile.id,
        correct: false,
        nearMiss: false,
        zoneIndex: result.zoneIndex,
        expected: state.zones[result.zoneIndex]?.expectedValue ?? '',
      });
    }
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

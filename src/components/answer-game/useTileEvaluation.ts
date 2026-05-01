import { nanoid } from 'nanoid';
import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { playSound } from '@/lib/audio/AudioFeedback';
import { getGameEventBus } from '@/lib/game-event-bus';
import { resolveSkin } from '@/lib/skin';

export interface TileEvaluation {
  placeTile: (
    tileId: string,
    zoneIndex: number,
  ) => { correct: boolean };
  /**
   * Place a free-typed value into a slot. Creates a virtual tile when
   * no matching bank tile exists. Used with lock-manual / lock-auto-eject
   * so the user sees immediate wrong-tile feedback for any keystroke.
   */
  typeTile: (value: string, zoneIndex: number) => void;
}

export function useTileEvaluation(): TileEvaluation {
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const skin = resolveSkin(state.config.gameId, state.config.skin);

  const placeTile = useCallback(
    (tileId: string, zoneIndex: number): { correct: boolean } => {
      const tile = state.allTiles.find((t) => t.id === tileId);
      const zone = state.zones[zoneIndex];
      if (!tile || !zone) return { correct: false };

      const correct = tile.value === zone.expectedValue;
      if (!skin.suppressDefaultSounds) {
        playSound(correct ? 'correct' : 'wrong', 0.8);
      }

      // Drag path only — tap/click rejects are handled in useDraggableTile.handleClick
      // (placeInNextSlot pre-validates and never calls placeTile on rejection)
      if (!correct && state.config.wrongTileBehavior === 'reject') {
        dispatch({ type: 'REJECT_TAP', tileId, zoneIndex });
      } else {
        dispatch({ type: 'PLACE_TILE', tileId, zoneIndex });
      }

      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: state.config.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: state.roundIndex,
        answer: tileId,
        correct,
        nearMiss: false,
        zoneIndex,
        expected: zone.expectedValue,
      });

      return { correct };
    },
    [state, dispatch, skin],
  );

  const typeTile = useCallback(
    (value: string, zoneIndex: number) => {
      const zone = state.zones[zoneIndex];
      if (!zone) return;

      const correct =
        value.toLowerCase() === zone.expectedValue.toLowerCase();
      if (!skin.suppressDefaultSounds) {
        playSound(correct ? 'correct' : 'wrong', 0.8);
      }
      dispatch({
        type: 'TYPE_TILE',
        tileId: `typed-${nanoid()}`,
        value,
        zoneIndex,
      });

      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: state.config.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: state.roundIndex,
        answer: value,
        correct,
        nearMiss: false,
        zoneIndex,
        expected: zone.expectedValue,
      });
    },
    [state, dispatch, skin],
  );

  return { placeTile, typeTile };
}

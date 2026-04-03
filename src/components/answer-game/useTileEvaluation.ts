import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { getGameEventBus } from '@/lib/game-event-bus';

const AUTO_EJECT_DELAY_MS = 1000;

export interface TileEvaluation {
  placeTile: (tileId: string, zoneIndex: number) => void;
}

export function useTileEvaluation(): TileEvaluation {
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const ejectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearEjectionTimer = useCallback(() => {
    if (ejectionTimerRef.current !== null) {
      clearTimeout(ejectionTimerRef.current);
      ejectionTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearEjectionTimer(), [clearEjectionTimer]);

  const placeTile = useCallback(
    (tileId: string, zoneIndex: number) => {
      clearEjectionTimer();

      const tile = state.allTiles.find((t) => t.id === tileId);
      const zone = state.zones[zoneIndex];
      if (!tile || !zone) return;

      const correct = tile.value === zone.expectedValue;
      dispatch({ type: 'PLACE_TILE', tileId, zoneIndex });

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
      });

      if (
        !correct &&
        state.config.wrongTileBehavior === 'lock-auto-eject'
      ) {
        ejectionTimerRef.current = setTimeout(() => {
          dispatch({ type: 'EJECT_TILE', zoneIndex });
          ejectionTimerRef.current = null;
        }, AUTO_EJECT_DELAY_MS);
      }
    },
    [state, dispatch, clearEjectionTimer],
  );

  return { placeTile };
}

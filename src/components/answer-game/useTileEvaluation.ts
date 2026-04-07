import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { playSound } from '@/lib/audio/AudioFeedback';
import { getGameEventBus } from '@/lib/game-event-bus';

export interface TileEvaluation {
  placeTile: (tileId: string, zoneIndex: number) => void;
}

export function useTileEvaluation(): TileEvaluation {
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  const placeTile = useCallback(
    (tileId: string, zoneIndex: number) => {
      const tile = state.allTiles.find((t) => t.id === tileId);
      const zone = state.zones[zoneIndex];
      if (!tile || !zone) return;

      const correct = tile.value === zone.expectedValue;
      playSound(correct ? 'correct' : 'wrong', 0.8);
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
    },
    [state, dispatch],
  );

  return { placeTile };
}

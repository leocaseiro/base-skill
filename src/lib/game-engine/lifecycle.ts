// src/lib/game-engine/lifecycle.ts
import { useReducer } from 'react';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  ResolvedGameConfig,
} from './types';

type InternalMove =
  | Move
  | {
      type: 'RESTORE_STATE';
      args: { _state: string };
      timestamp: number;
    };

function buildInitialState(
  _config: ResolvedGameConfig,
  override?: GameEngineState,
): GameEngineState {
  if (override) return override;
  return {
    phase: 'instructions',
    roundIndex: 0,
    score: 0,
    streak: 0,
    retryCount: 0,
    content: { rounds: [] },
    currentRound: { roundId: '', answer: null, hintsUsed: 0 },
  };
}

export function createReducer(
  config: ResolvedGameConfig,
  gameMovers: Record<string, MoveHandler>,
) {
  return function reducer(
    state: GameEngineState,
    action: InternalMove,
  ): GameEngineState {
    // RESTORE_STATE — force set (used for UNDO by provider)
    if (action.type === 'RESTORE_STATE') {
      return JSON.parse(
        action.args['_state'] as string,
      ) as GameEngineState;
    }

    // Apply game-specific handler first (if any)
    const gameHandler = gameMovers[action.type];
    const s = gameHandler ? gameHandler(state, action.args) : state;

    switch (action.type) {
      case 'SKIP_INSTRUCTIONS': {
        if (s.phase !== 'instructions') return s;
        return { ...s, phase: 'playing' };
      }

      case 'SUBMIT_ANSWER': {
        if (s.phase !== 'playing') return s;
        const roundDef = s.content.rounds[s.roundIndex];
        const correct =
          s.currentRound.answer === roundDef?.correctAnswer;
        const newScore = correct ? s.score + 1 : s.score;
        const newStreak = correct ? s.streak + 1 : 0;

        if (!correct && s.retryCount < config.maxRetries) {
          return {
            ...s,
            score: newScore,
            streak: newStreak,
            retryCount: s.retryCount + 1,
            phase: 'retry',
          };
        }

        const isLastRound = s.roundIndex >= config.maxRounds - 1;
        if (isLastRound) {
          return {
            ...s,
            score: newScore,
            streak: newStreak,
            phase: 'game-over',
          };
        }
        return {
          ...s,
          score: newScore,
          streak: newStreak,
          phase: 'next-round',
        };
      }

      case 'NEXT_ROUND': {
        if (s.phase !== 'next-round') return s;
        const nextIndex = s.roundIndex + 1;
        const nextRound = s.content.rounds[nextIndex];
        return {
          ...s,
          phase: 'playing',
          roundIndex: nextIndex,
          retryCount: 0,
          currentRound: {
            roundId: nextRound?.id ?? '',
            answer: null,
            hintsUsed: 0,
          },
        };
      }

      case 'RETRY': {
        if (s.phase !== 'retry') return s;
        return {
          ...s,
          phase: 'playing',
          currentRound: { ...s.currentRound, answer: null },
        };
      }

      case 'END_GAME': {
        if (s.phase !== 'game-over') return s;
        return { ...s, phase: 'idle' };
      }

      case 'REQUEST_HINT': {
        return {
          ...s,
          currentRound: {
            ...s.currentRound,
            hintsUsed: s.currentRound.hintsUsed + 1,
          },
        };
      }

      default: {
        return s;
      }
    }
  };
}

export function useGameLifecycle(
  config: ResolvedGameConfig,
  gameMovers: Record<string, MoveHandler>,
  initialState?: GameEngineState,
): [GameEngineState, (move: InternalMove) => void] {
  const reducer = createReducer(config, gameMovers);
  const [state, dispatch] = useReducer(
    reducer,
    buildInitialState(config, initialState),
  );
  return [state, dispatch];
}

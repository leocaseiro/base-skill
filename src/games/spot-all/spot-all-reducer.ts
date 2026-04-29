import type { SpotAllRound, SpotAllTile } from './types';

export type SpotAllPhase = 'playing' | 'round-complete' | 'game-over';
export type SpotAllFeedback = 'none' | 'correct' | 'incorrect';

export interface SpotAllState {
  rounds: SpotAllRound[];
  roundIndex: number;
  tiles: SpotAllTile[];
  selectedIds: Set<string>;
  phase: SpotAllPhase;
  feedback: SpotAllFeedback;
}

export type SpotAllAction =
  | { type: 'INIT_ROUNDS'; rounds: SpotAllRound[] }
  | { type: 'TOGGLE_TILE'; tileId: string }
  | { type: 'SUBMIT' }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'COMPLETE_GAME' };

export const createInitialSpotAllState = (
  rounds: SpotAllRound[],
): SpotAllState => ({
  rounds,
  roundIndex: 0,
  tiles: rounds[0]?.tiles ?? [],
  selectedIds: new Set<string>(),
  phase: 'playing',
  feedback: 'none',
});

const evaluateSelection = (state: SpotAllState): SpotAllState => {
  const correctIds = new Set(
    state.tiles.filter((tile) => tile.isCorrect).map((tile) => tile.id),
  );
  if (correctIds.size === 0 || state.selectedIds.size === 0) {
    return { ...state, feedback: 'incorrect', phase: 'playing' };
  }

  if (state.selectedIds.size !== correctIds.size) {
    return { ...state, feedback: 'incorrect', phase: 'playing' };
  }

  for (const selectedId of state.selectedIds) {
    if (!correctIds.has(selectedId)) {
      return { ...state, feedback: 'incorrect', phase: 'playing' };
    }
  }

  return { ...state, feedback: 'correct', phase: 'round-complete' };
};

export const spotAllReducer = (
  state: SpotAllState,
  action: SpotAllAction,
): SpotAllState => {
  switch (action.type) {
    case 'INIT_ROUNDS': {
      return createInitialSpotAllState(action.rounds);
    }
    case 'TOGGLE_TILE': {
      if (state.phase === 'game-over') return state;
      const nextSelected = new Set(state.selectedIds);
      if (nextSelected.has(action.tileId)) {
        nextSelected.delete(action.tileId);
      } else {
        nextSelected.add(action.tileId);
      }
      return {
        ...state,
        selectedIds: nextSelected,
        feedback: 'none',
        phase: 'playing',
      };
    }
    case 'SUBMIT': {
      if (state.phase === 'game-over') return state;
      return evaluateSelection(state);
    }
    case 'ADVANCE_ROUND': {
      if (state.phase !== 'round-complete') return state;
      const nextRoundIndex = state.roundIndex + 1;
      const nextRound = state.rounds[nextRoundIndex];
      if (!nextRound) {
        return {
          ...state,
          phase: 'game-over',
          feedback: 'none',
          selectedIds: new Set<string>(),
        };
      }
      return {
        ...state,
        roundIndex: nextRoundIndex,
        tiles: nextRound.tiles,
        selectedIds: new Set<string>(),
        phase: 'playing',
        feedback: 'none',
      };
    }
    case 'COMPLETE_GAME': {
      return {
        ...state,
        phase: 'game-over',
      };
    }
    default: {
      return state;
    }
  }
};

import type { SpotAllRound, SpotAllTile } from './types';

// SpotAll reducer ↔ GameDefinition engine phase mapping.
//
// Reviewers repeatedly flag "SpotAll's phases look different from answer-game's."
// They are not -- they are the same engine phases with a different reducer
// shape underneath. This table is the answer:
//
//   Engine phase        | SpotAll reducer state.phase | Action that transitions in
//   --------------------+-----------------------------+-----------------------------
//   playing             | 'playing'                   | INIT_ROUNDS / TAP_TILE
//   round-complete      | 'round-complete'            | TAP_TILE (last correct tap)
//   level-complete      | (n/a -- SpotAll has no levels)
//   game-over           | 'game-over'                  | ADVANCE_ROUND on last round
//
// Notable shape differences:
//   - SpotAll's rounds are pre-built at INIT_ROUNDS and advanced by
//     incrementing roundIndex. ADVANCE_ROUND has NO payload (unlike
//     answer-game's ADVANCE_ROUND which carries tiles + zones).
//   - There is no separate "next round" action; ADVANCE_ROUND routes to
//     game-over when state.roundIndex hits state.rounds.length - 1.
//   - There is no ADVANCE_LEVEL action; SpotAll does not model levels.
//
// Phase 1.b of the GameDefinition engine plan integrates this reducer
// behind useGameEngine. See docs/superpowers/plans/2026-05-07-game-definition-engine-design.md.
export type SpotAllPhase = 'playing' | 'round-complete' | 'game-over';

export interface SpotAllState {
  rounds: SpotAllRound[];
  roundIndex: number;
  tiles: SpotAllTile[];
  selectedIds: Set<string>;
  wrongCooldownIds: Set<string>;
  phase: SpotAllPhase;
  retryCount: number;
}

export type SpotAllAction =
  | { type: 'INIT_ROUNDS'; rounds: SpotAllRound[] }
  | { type: 'TAP_TILE'; tileId: string }
  | { type: 'CLEAR_WRONG_COOLDOWN'; tileId: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'COMPLETE_GAME' };

export const WRONG_COOLDOWN_MS = 600;
export const ROUND_ADVANCE_MS = 750;

export const createInitialSpotAllState = (
  rounds: SpotAllRound[],
): SpotAllState => ({
  rounds,
  roundIndex: 0,
  tiles: rounds[0]?.tiles ?? [],
  selectedIds: new Set<string>(),
  wrongCooldownIds: new Set<string>(),
  phase: 'playing',
  retryCount: 0,
});

export const spotAllReducer = (
  state: SpotAllState,
  action: SpotAllAction,
): SpotAllState => {
  switch (action.type) {
    case 'INIT_ROUNDS': {
      return createInitialSpotAllState(action.rounds);
    }
    case 'TAP_TILE': {
      if (state.phase !== 'playing') return state;
      if (state.wrongCooldownIds.has(action.tileId)) return state;

      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile) return state;

      if (tile.isCorrect && state.selectedIds.has(action.tileId)) {
        const next = new Set(state.selectedIds);
        next.delete(action.tileId);
        return { ...state, selectedIds: next };
      }

      if (tile.isCorrect) {
        const next = new Set(state.selectedIds);
        next.add(action.tileId);
        const allCorrect = state.tiles
          .filter((t) => t.isCorrect)
          .every((t) => next.has(t.id));
        return {
          ...state,
          selectedIds: next,
          phase: allCorrect ? 'round-complete' : 'playing',
        };
      }

      const cooldown = new Set(state.wrongCooldownIds);
      cooldown.add(action.tileId);
      return {
        ...state,
        wrongCooldownIds: cooldown,
        retryCount: state.retryCount + 1,
      };
    }
    case 'CLEAR_WRONG_COOLDOWN': {
      if (!state.wrongCooldownIds.has(action.tileId)) return state;
      const next = new Set(state.wrongCooldownIds);
      next.delete(action.tileId);
      return { ...state, wrongCooldownIds: next };
    }
    case 'ADVANCE_ROUND': {
      if (state.phase !== 'round-complete') return state;
      const nextIndex = state.roundIndex + 1;
      const nextRound = state.rounds[nextIndex];
      if (!nextRound) {
        return { ...state, phase: 'game-over' };
      }
      return {
        ...state,
        roundIndex: nextIndex,
        tiles: nextRound.tiles,
        selectedIds: new Set<string>(),
        wrongCooldownIds: new Set<string>(),
        phase: 'playing',
      };
    }
    case 'COMPLETE_GAME': {
      return { ...state, phase: 'game-over' };
    }
    default: {
      return state;
    }
  }
};

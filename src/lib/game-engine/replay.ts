// src/lib/game-engine/replay.ts
import type { GameEngineState, MoveHandler, MoveLog } from './types';

/**
 * Pure function — no React, no side effects, no RxDB.
 * Replays moves 0..stepIndex from log.initialState using provided move handlers.
 * UNDO moves are handled by re-replaying from initialState to the targetStep.
 */
export function replayToStep(
  log: MoveLog,
  stepIndex: number,
  moveHandlers: Record<string, MoveHandler>,
): GameEngineState {
  let state = log.initialState;

  for (let i = 0; i <= stepIndex && i < log.moves.length; i++) {
    const move = log.moves[i];

    if (move.type === 'UNDO') {
      const targetStep = move.args['targetStep'] as number;
      // Replay from initial state to targetStep (exclusive — gives state BEFORE targetStep was applied)
      state =
        targetStep > 0
          ? replayToStep(log, targetStep - 1, moveHandlers)
          : log.initialState;
    } else {
      const handler = moveHandlers[move.type];
      if (handler) {
        state = handler(state, move.args);
      }
    }
  }

  return state;
}

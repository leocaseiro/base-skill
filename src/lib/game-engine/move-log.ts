// src/lib/game-engine/move-log.ts
import { useCallback, useRef, useState } from 'react';
import type { Move } from './types';

export interface UseMoveLogReturn {
  moves: Move[];
  canUndo: boolean;
  appendMove: (move: Move) => boolean;
}

export function useMoveLog(
  maxUndoDepth: number | null,
): UseMoveLogReturn {
  const [moves, setMoves] = useState<Move[]>([]);
  const movesRef = useRef<Move[]>([]);

  const appendMove = useCallback(
    (move: Move): boolean => {
      if (move.type === 'UNDO') {
        if (maxUndoDepth === 0) return false;

        if (maxUndoDepth !== null) {
          const targetStep = move.args['targetStep'] as number;
          const depth = movesRef.current.length - targetStep;
          if (depth > maxUndoDepth) return false;
        }
      }

      movesRef.current = [...movesRef.current, move];
      setMoves(movesRef.current);
      return true;
    },
    [maxUndoDepth],
  );

  const canUndo = maxUndoDepth !== 0 && moves.length > 0;

  return { moves, canUndo, appendMove };
}

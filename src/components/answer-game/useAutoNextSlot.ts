import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';

export interface AutoNextSlot {
  placeInNextSlot: (tileId: string) => void;
}

export function useAutoNextSlot(): AutoNextSlot {
  const { activeSlotIndex } = useAnswerGameContext();
  const { placeTile } = useTileEvaluation();

  const placeInNextSlot = useCallback(
    (tileId: string) => {
      placeTile(tileId, activeSlotIndex);
    },
    [placeTile, activeSlotIndex],
  );

  return { placeInNextSlot };
}

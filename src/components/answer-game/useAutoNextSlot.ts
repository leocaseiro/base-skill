import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';

export interface AutoNextSlot {
  placeInNextSlot: (tileId: string) => void;
}

export const useAutoNextSlot = (): AutoNextSlot => {
  const { activeSlotIndex, zones } = useAnswerGameContext();
  const { placeTile } = useTileEvaluation();

  const placeInNextSlot = useCallback(
    (tileId: string) => {
      const targetIndex = zones.findIndex(
        (z, i) =>
          i >= activeSlotIndex &&
          z.placedTileId === null &&
          !z.isLocked,
      );
      if (targetIndex === -1) return;
      placeTile(tileId, targetIndex);
    },
    [placeTile, activeSlotIndex, zones],
  );

  return { placeInNextSlot };
};

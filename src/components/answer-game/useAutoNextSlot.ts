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
      // Guard: if the active slot is in a wrong state (e.g. a wrong tile was
      // just placed with lock-auto-eject), block further placements until it
      // clears. This prevents double/triple taps from skipping past the slot.
      if (zones[activeSlotIndex]?.isWrong) return;

      // Look for the next available slot from activeSlotIndex forward...
      let targetIndex = zones.findIndex(
        (z, i) =>
          i >= activeSlotIndex &&
          z.placedTileId === null &&
          !z.isLocked,
      );

      // ...and wrap around if needed. This handles out-of-order placements
      // (e.g. via drag) where earlier slots were left empty and activeSlotIndex
      // has already advanced past them.
      if (targetIndex === -1) {
        targetIndex = zones.findIndex(
          (z) => z.placedTileId === null && !z.isLocked,
        );
      }

      if (targetIndex === -1) return;
      placeTile(tileId, targetIndex);
    },
    [placeTile, activeSlotIndex, zones],
  );

  return { placeInNextSlot };
};

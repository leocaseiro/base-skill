import { useCallback, useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';

export interface PlaceResult {
  placed: boolean;
  zoneIndex: number;
  rejected: boolean;
}

export interface AutoNextSlot {
  placeInNextSlot: (tileId: string) => PlaceResult;
}

// Module-scoped: shared across all hook instances on the page (single AnswerGame
// instance assumed). For multi-instance support, lift to AnswerGameProvider context.
let pendingPlacements: Array<{ tileId: string; zoneIndex: number }> =
  [];

export const clearPendingPlacements = (): void => {
  pendingPlacements = [];
};

export const useAutoNextSlot = (): AutoNextSlot => {
  const state = useAnswerGameContext();
  const { zones, activeSlotIndex, config, allTiles, roundIndex } =
    state;
  const { placeTile } = useTileEvaluation();

  useEffect(() => {
    clearPendingPlacements();
  }, [roundIndex, zones.length]);

  const placeInNextSlot = useCallback(
    (tileId: string): PlaceResult => {
      pendingPlacements = pendingPlacements.filter(
        (entry) =>
          zones[entry.zoneIndex]?.placedTileId !== entry.tileId,
      );

      const claimedZones = new Set(
        pendingPlacements.map((e) => e.zoneIndex),
      );

      const isAvailable = (i: number) =>
        zones[i] &&
        !zones[i].placedTileId &&
        !zones[i].isLocked &&
        !claimedZones.has(i);

      let targetIndex = -1;
      for (let i = activeSlotIndex; i < zones.length; i++) {
        if (isAvailable(i)) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        for (let i = 0; i < activeSlotIndex; i++) {
          if (isAvailable(i)) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        return { placed: false, zoneIndex: -1, rejected: false };
      }

      if (config.wrongTileBehavior !== 'lock-manual') {
        const tile = allTiles.find((t) => t.id === tileId);
        const targetZone = zones[targetIndex];
        if (
          tile &&
          targetZone &&
          tile.value !== targetZone.expectedValue
        ) {
          return {
            placed: false,
            zoneIndex: targetIndex,
            rejected: true,
          };
        }
      }

      pendingPlacements.push({ tileId, zoneIndex: targetIndex });
      void placeTile(tileId, targetIndex);
      return { placed: true, zoneIndex: targetIndex, rejected: false };
    },
    [
      zones,
      activeSlotIndex,
      config.wrongTileBehavior,
      allTiles,
      placeTile,
    ],
  );

  return { placeInNextSlot };
};

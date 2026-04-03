import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useTileEvaluation } from './useTileEvaluation';

export interface FreeSwap {
  swapOrPlace: (tileId: string, targetZoneIndex: number) => void;
}

export function useFreeSwap(): FreeSwap {
  const { zones } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { placeTile } = useTileEvaluation();

  const swapOrPlace = useCallback(
    (tileId: string, targetZoneIndex: number) => {
      const targetZone = zones[targetZoneIndex];
      if (!targetZone) return;

      if (targetZone.placedTileId === null) {
        placeTile(tileId, targetZoneIndex);
      } else {
        const sourceZoneIndex = zones.findIndex(
          (z) => z.placedTileId === tileId,
        );
        if (sourceZoneIndex === -1) {
          placeTile(tileId, targetZoneIndex);
        } else {
          dispatch({
            type: 'SWAP_TILES',
            fromZoneIndex: sourceZoneIndex,
            toZoneIndex: targetZoneIndex,
          });
        }
      }
    },
    [zones, dispatch, placeTile],
  );

  return { swapOrPlace };
}

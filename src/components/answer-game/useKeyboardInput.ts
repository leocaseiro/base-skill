import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useTileEvaluation } from './useTileEvaluation';

export const useKeyboardInput = (): void => {
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { placeTile, typeTile } = useTileEvaluation();

  useEffect(() => {
    if (state.config.inputMethod === 'drag') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip all input/textarea targets — the hidden keyboard input
      // (useTouchKeyboardInput) handles those to avoid double-placement.
      if (event.target instanceof HTMLInputElement) return;
      if (event.target instanceof HTMLTextAreaElement) return;

      // Backspace / Delete: eject the most recently filled slot
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Search backwards from activeSlotIndex for a filled slot
        for (let i = state.activeSlotIndex; i >= 0; i--) {
          if (state.zones[i]?.placedTileId) {
            dispatch({ type: 'REMOVE_TILE', zoneIndex: i });
            return;
          }
        }
        return;
      }

      const char = event.key.toLowerCase();
      if (char.length !== 1) return;

      const matchingTile = state.allTiles.find(
        (t) =>
          state.bankTileIds.includes(t.id) &&
          t.value.toLowerCase() === char,
      );

      if (matchingTile) {
        placeTile(matchingTile.id, state.activeSlotIndex);
      } else {
        typeTile(char, state.activeSlotIndex);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () =>
      globalThis.removeEventListener('keydown', handleKeyDown);
  }, [
    state.config.inputMethod,
    state.allTiles,
    state.bankTileIds,
    state.zones,
    state.activeSlotIndex,
    dispatch,
    placeTile,
    typeTile,
  ]);
};

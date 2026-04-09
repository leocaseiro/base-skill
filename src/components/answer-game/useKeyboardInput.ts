import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';

export const useKeyboardInput = (): void => {
  const state = useAnswerGameContext();
  const { placeTile, typeTile } = useTileEvaluation();

  useEffect(() => {
    if (state.config.inputMethod === 'drag') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip all input/textarea targets — the hidden keyboard input
      // (useTouchKeyboardInput) handles those to avoid double-placement.
      if (event.target instanceof HTMLInputElement) return;
      if (event.target instanceof HTMLTextAreaElement) return;

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
    state.activeSlotIndex,
    placeTile,
    typeTile,
  ]);
};

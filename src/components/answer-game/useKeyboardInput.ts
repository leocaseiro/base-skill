import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';

export const useKeyboardInput = (): void => {
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  useEffect(() => {
    if (state.config.inputMethod !== 'type') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.target instanceof HTMLTextAreaElement) return;

      const char = event.key.toLowerCase();
      if (char.length !== 1) return;

      const matchingTile = state.allTiles.find(
        (t) =>
          state.bankTileIds.includes(t.id) &&
          t.value.toLowerCase() === char,
      );
      if (!matchingTile) return;

      dispatch({
        type: 'PLACE_TILE',
        tileId: matchingTile.id,
        zoneIndex: state.activeSlotIndex,
      });
    };

    globalThis.addEventListener('keypress', handleKeyPress);
    return () =>
      globalThis.removeEventListener('keypress', handleKeyPress);
  }, [
    state.config.inputMethod,
    state.allTiles,
    state.bankTileIds,
    state.activeSlotIndex,
    dispatch,
  ]);
};

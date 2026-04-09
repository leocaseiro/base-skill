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
      // Skip input/textarea targets for character keys — the hidden
      // keyboard input (useTouchKeyboardInput) handles those to avoid
      // double-placement. Backspace/Delete are allowed through because
      // an empty hidden input won't fire an input event for them.
      if (
        event.target instanceof HTMLInputElement &&
        event.key !== 'Backspace' &&
        event.key !== 'Delete' &&
        event.key !== 'Tab'
      )
        return;
      if (event.target instanceof HTMLTextAreaElement) return;

      // Tab / Shift+Tab: navigate between slots
      if (event.key === 'Tab') {
        event.preventDefault();
        const delta = event.shiftKey ? -1 : 1;
        const next = state.activeSlotIndex + delta;
        if (next >= 0 && next < state.zones.length) {
          dispatch({ type: 'SET_ACTIVE_SLOT', zoneIndex: next });
        }
        return;
      }

      // Backspace / Delete: eject the most recently filled *wrong* slot
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Search backwards from activeSlotIndex for a wrong/locked slot
        for (let i = state.activeSlotIndex; i >= 0; i--) {
          const zone = state.zones[i];
          if (zone?.placedTileId && (zone.isWrong || zone.isLocked)) {
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

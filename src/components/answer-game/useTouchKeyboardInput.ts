import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import type { RefObject } from 'react';

export interface TouchKeyboardInput {
  hiddenInputRef: RefObject<HTMLInputElement | null>;
  focusKeyboard: () => void;
}

export const useTouchKeyboardInput = (): TouchKeyboardInput => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  useEffect(() => {
    const input = hiddenInputRef.current;
    if (!input) return;

    const handleInput = (event: Event) => {
      const inputEvent = event as InputEvent;
      const raw =
        inputEvent.data ?? (event.target as HTMLInputElement).value;
      if (!raw) return;
      const data = raw.toLowerCase();

      const matchingTile = state.allTiles.find(
        (t) =>
          state.bankTileIds.includes(t.id) &&
          t.value.toLowerCase() === data,
      );

      if (matchingTile) {
        dispatch({
          type: 'PLACE_TILE',
          tileId: matchingTile.id,
          zoneIndex: state.activeSlotIndex,
        });
      }

      input.value = '';
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [
    state.allTiles,
    state.bankTileIds,
    state.activeSlotIndex,
    dispatch,
  ]);

  const focusKeyboard = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  return { hiddenInputRef, focusKeyboard };
};

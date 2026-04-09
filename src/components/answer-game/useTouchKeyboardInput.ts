import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';
import type { RefObject } from 'react';

export interface TouchKeyboardInput {
  hiddenInputRef: RefObject<HTMLInputElement | null>;
  focusKeyboard: () => void;
}

const NUMERIC_DEBOUNCE_MS = 400;

export const useTouchKeyboardInput = (): TouchKeyboardInput => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const state = useAnswerGameContext();
  const { placeTile } = useTileEvaluation();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const input = hiddenInputRef.current;
    if (!input) return;

    const isNumeric = state.config.touchKeyboardInputMode === 'numeric';

    const tryMatchAndPlace = (value: string) => {
      const data = value.toLowerCase();
      const matchingTile = state.allTiles.find(
        (t) =>
          state.bankTileIds.includes(t.id) &&
          t.value.toLowerCase() === data,
      );

      if (matchingTile) {
        placeTile(matchingTile.id, state.activeSlotIndex);
      }

      input.value = '';
    };

    const handleInput = (event: Event) => {
      const inputEvent = event as InputEvent;

      if (isNumeric) {
        // For numeric input, accumulate digits and debounce so multi-digit
        // numbers (e.g. "12") can be typed before matching.
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          const accumulated = input.value;
          if (accumulated) {
            tryMatchAndPlace(accumulated);
          }
        }, NUMERIC_DEBOUNCE_MS);
      } else {
        // For text input, match character-by-character (original behaviour).
        const raw =
          inputEvent.data ?? (event.target as HTMLInputElement).value;
        if (!raw) return;
        tryMatchAndPlace(raw);
      }
    };

    input.addEventListener('input', handleInput);
    return () => {
      input.removeEventListener('input', handleInput);
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    state.config.touchKeyboardInputMode,
    state.allTiles,
    state.bankTileIds,
    state.activeSlotIndex,
    placeTile,
  ]);

  const focusKeyboard = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  return { hiddenInputRef, focusKeyboard };
};

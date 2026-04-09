import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGameConfig } from './types';
import type { RefObject } from 'react';

interface HiddenKeyboardInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  inputMode: NonNullable<AnswerGameConfig['touchKeyboardInputMode']>;
}

export const HiddenKeyboardInput = ({
  inputRef,
  inputMode,
}: HiddenKeyboardInputProps) => {
  const { phase, activeSlotIndex } = useAnswerGameContext();

  // Auto-focus the hidden input on desktop so physical keyboard strokes
  // are captured without the user needing to tap a slot first. Re-focus
  // whenever the active slot changes (e.g. after a tile is placed) or
  // the game phase changes (e.g. returning to 'playing').
  useEffect(() => {
    if (phase !== 'playing') return;
    const el = inputRef.current;
    if (!el) return;
    // Only auto-focus when no other interactive element is focused,
    // so we don't steal focus from drag interactions.
    if (
      document.activeElement === document.body ||
      document.activeElement === null
    ) {
      el.focus();
    }
  }, [inputRef, activeSlotIndex, phase]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      data-touch-keyboard="true"
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
        width: 1,
        height: 1,
        top: 0,
        left: 0,
      }}
    />
  );
};

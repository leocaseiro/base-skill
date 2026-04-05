import type { AnswerGameConfig } from './types';
import type { RefObject } from 'react';

interface HiddenKeyboardInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  inputMode: NonNullable<AnswerGameConfig['touchKeyboardInputMode']>;
}

export const HiddenKeyboardInput = ({
  inputRef,
  inputMode,
}: HiddenKeyboardInputProps) => (
  <input
    ref={inputRef}
    type="text"
    inputMode={inputMode}
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

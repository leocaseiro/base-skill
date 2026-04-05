import { createContext, useContext } from 'react';

export const TouchKeyboardContext = createContext<(() => void) | null>(
  null,
);

export const useTouchKeyboard = (): (() => void) | null =>
  useContext(TouchKeyboardContext);

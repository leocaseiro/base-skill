import { use } from 'react';
import { AnswerGameStateContext } from './AnswerGameProvider';
import type { AnswerGameState } from './types';

export function useAnswerGameContext(): AnswerGameState {
  const ctx = use(AnswerGameStateContext);
  if (!ctx) {
    throw new Error(
      'useAnswerGameContext must be used inside AnswerGameProvider',
    );
  }
  return ctx;
}

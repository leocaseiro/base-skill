import { use } from 'react';
import { AnswerGameDispatchContext } from './AnswerGameProvider';
import type { AnswerGameAction } from './types';
import type { Dispatch } from 'react';

export function useAnswerGameDispatch(): Dispatch<AnswerGameAction> {
  const ctx = use(AnswerGameDispatchContext);
  if (!ctx) {
    throw new Error(
      'useAnswerGameDispatch must be used inside AnswerGameProvider',
    );
  }
  return ctx;
}

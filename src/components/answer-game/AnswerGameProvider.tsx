import { createContext, useReducer } from 'react';
import {
  answerGameReducer,
  makeInitialState,
} from './answer-game-reducer';
import type {
  AnswerGameAction,
  AnswerGameConfig,
  AnswerGameState,
} from './types';
import type { Dispatch, ReactNode } from 'react';

export const AnswerGameStateContext =
  createContext<AnswerGameState | null>(null);
export const AnswerGameDispatchContext =
  createContext<Dispatch<AnswerGameAction> | null>(null);

interface AnswerGameProviderProps {
  config: AnswerGameConfig;
  children: ReactNode;
}

export const AnswerGameProvider = ({
  config,
  children,
}: AnswerGameProviderProps) => {
  const [state, dispatch] = useReducer(
    answerGameReducer,
    config,
    makeInitialState,
  );

  return (
    <AnswerGameStateContext.Provider value={state}>
      <AnswerGameDispatchContext.Provider value={dispatch}>
        {children}
      </AnswerGameDispatchContext.Provider>
    </AnswerGameStateContext.Provider>
  );
};

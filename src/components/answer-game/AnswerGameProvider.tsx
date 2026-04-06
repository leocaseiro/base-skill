import { createContext, useEffect, useReducer } from 'react';
import {
  answerGameReducer,
  makeInitialState,
} from './answer-game-reducer';
import { HiddenKeyboardInput } from './HiddenKeyboardInput';
import { TouchKeyboardContext } from './TouchKeyboardContext';
import { useKeyboardInput } from './useKeyboardInput';
import { useTouchKeyboardInput } from './useTouchKeyboardInput';
import type {
  AnswerGameAction,
  AnswerGameConfig,
  AnswerGameState,
} from './types';
import type { Dispatch, ReactNode } from 'react';
import { GameRoundContext } from '@/lib/game-engine/GameRoundContext';

export const AnswerGameStateContext =
  createContext<AnswerGameState | null>(null);
export const AnswerGameDispatchContext =
  createContext<Dispatch<AnswerGameAction> | null>(null);

const KeyboardInputAdapter = () => {
  useKeyboardInput();
  return null;
};

const TouchKeyboardAdapter = ({
  inputMode,
  children,
}: {
  inputMode: NonNullable<AnswerGameConfig['touchKeyboardInputMode']>;
  children: ReactNode;
}) => {
  const { hiddenInputRef, focusKeyboard } = useTouchKeyboardInput();
  return (
    <TouchKeyboardContext.Provider value={focusKeyboard}>
      <HiddenKeyboardInput
        inputRef={hiddenInputRef}
        inputMode={inputMode}
      />
      {children}
    </TouchKeyboardContext.Provider>
  );
};

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

  useEffect(() => {
    const tiles = config.initialTiles;
    const zones = config.initialZones;
    if (tiles?.length && zones?.length) {
      dispatch({ type: 'INIT_ROUND', tiles, zones });
    }
  }, [config.gameId, config.initialTiles, config.initialZones]);

  const roundProgress = {
    current: state.roundIndex + 1,
    total: config.totalRounds,
  };

  const usesTouchKeyboard =
    navigator.maxTouchPoints > 0 && config.inputMethod !== 'drag';

  return (
    <GameRoundContext.Provider value={roundProgress}>
      <AnswerGameStateContext.Provider value={state}>
        <AnswerGameDispatchContext.Provider value={dispatch}>
          {usesTouchKeyboard ? (
            <TouchKeyboardAdapter
              inputMode={config.touchKeyboardInputMode ?? 'text'}
            >
              {children}
            </TouchKeyboardAdapter>
          ) : (
            <TouchKeyboardContext.Provider value={null}>
              <KeyboardInputAdapter />
              {children}
            </TouchKeyboardContext.Provider>
          )}
        </AnswerGameDispatchContext.Provider>
      </AnswerGameStateContext.Provider>
    </GameRoundContext.Provider>
  );
};

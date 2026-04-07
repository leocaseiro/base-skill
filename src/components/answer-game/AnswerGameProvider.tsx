import {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
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
  AnswerGameDraftState,
  AnswerGameState,
} from './types';
import type { Dispatch, ReactNode } from 'react';
import { GameRoundContext } from '@/lib/game-engine/GameRoundContext';
import { useAnswerGameDraftSync } from '@/lib/game-engine/useAnswerGameDraftSync';
import { DbContext } from '@/providers/DbProvider';

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
  /** When provided, state is restored from snapshot; INIT_ROUND effect is skipped. */
  initialState?: AnswerGameDraftState;
  /** Session ID used by useAnswerGameDraftSync to find the RxDB document. */
  sessionId?: string;
  children: ReactNode;
}

const buildStateFromDraft = (
  config: AnswerGameConfig,
  draft: AnswerGameDraftState,
): AnswerGameState => ({
  ...makeInitialState(config),
  ...draft,
  dragActiveTileId: null,
});

export const AnswerGameProvider = ({
  config,
  initialState,
  sessionId,
  children,
}: AnswerGameProviderProps) => {
  const [state, dispatch] = useReducer(
    answerGameReducer,
    initialState
      ? buildStateFromDraft(config, initialState)
      : makeInitialState(config),
  );

  // Mount draft sync — no-op if sessionId/db is absent (unit tests, Storybook)
  const dbCtx = useContext(DbContext);
  useAnswerGameDraftSync(state, sessionId ?? null, dbCtx?.db ?? null);

  useEffect(() => {
    // Skip INIT_ROUND when resuming from a snapshot
    if (initialState) return;
    const tiles = config.initialTiles;
    const zones = config.initialZones;
    if (tiles?.length && zones?.length) {
      dispatch({ type: 'INIT_ROUND', tiles, zones });
    }
  }, [
    config.gameId,
    config.initialTiles,
    config.initialZones,
    initialState,
  ]);

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

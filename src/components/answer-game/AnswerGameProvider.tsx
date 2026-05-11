import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
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
  /**
   * When provided, state is restored from the draft snapshot and the mount
   * effect dispatches `RESUME_ROUND` (instead of `INIT_ROUND`) so draft
   * progress is preserved on every re-render.
   */
  initialState?: AnswerGameDraftState;
  /** Session ID used by useAnswerGameDraftSync to find the RxDB document. */
  sessionId?: string;
  /**
   * PR 1a XState-first seam: when provided, every dispatch (both internal
   * INIT_ROUND/RESUME_ROUND and external PLACE_TILE/etc. from Slot,
   * NumeralTileBank, keyboard input) is mirrored to this callback so the
   * game's XState machine stays in sync with the reducer. PR 1c removes the
   * reducer; PR 1b/PR 1d add this prop to WordSpell + SortNumbers +
   * SpotAll.
   */
  engineDispatch?: (action: AnswerGameAction) => void;
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
  engineDispatch,
  children,
}: AnswerGameProviderProps) => {
  const [state, rawDispatch] = useReducer(
    answerGameReducer,
    initialState
      ? buildStateFromDraft(config, initialState)
      : makeInitialState(config),
  );

  // Stable ref to the latest engineDispatch so the wrapped dispatch keeps
  // a constant identity even when the engine's `send` is recreated each
  // state transition. Stable dispatch prevents the mount effect below from
  // re-firing INIT_ROUND/RESUME_ROUND when the engine changes.
  const engineDispatchRef = useRef<
    ((action: AnswerGameAction) => void) | undefined
  >(undefined);
  useEffect(() => {
    engineDispatchRef.current = engineDispatch;
  }, [engineDispatch]);

  const dispatch = useCallback((action: AnswerGameAction) => {
    rawDispatch(action);
    engineDispatchRef.current?.(action);
  }, []);

  // Mount draft sync — no-op if sessionId/db is absent (unit tests, Storybook)
  const dbCtx = useContext(DbContext);
  useAnswerGameDraftSync(state, sessionId ?? null, dbCtx?.db ?? null);

  useEffect(() => {
    // Hardened round init: route through the reducer on every mount AND
    // whenever the resumed draft changes. `RESUME_ROUND` preserves draft
    // progress (roundIndex, retryCount, levelIndex); `INIT_ROUND` starts
    // fresh. Both paths keep all round-state mutation inside the reducer
    // rather than relying on `useReducer`'s one-shot initial snapshot.
    // The dispatch is wrapped to mirror to engineDispatch (when provided),
    // so XState-first games receive INIT_ROUND/RESUME_ROUND alongside the
    // reducer.
    if (initialState) {
      dispatch({ type: 'RESUME_ROUND', draft: initialState });
      return;
    }
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
    dispatch,
  ]);

  const usesTyping = config.inputMethod !== 'drag';

  return (
    <AnswerGameStateContext.Provider value={state}>
      <AnswerGameDispatchContext.Provider value={dispatch}>
        {usesTyping ? (
          <TouchKeyboardAdapter
            inputMode={config.touchKeyboardInputMode ?? 'text'}
          >
            <KeyboardInputAdapter />
            {children}
          </TouchKeyboardAdapter>
        ) : (
          <TouchKeyboardContext.Provider value={null}>
            {children}
          </TouchKeyboardContext.Provider>
        )}
      </AnswerGameDispatchContext.Provider>
    </AnswerGameStateContext.Provider>
  );
};

// src/lib/game-engine/index.ts
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { createReducer, useGameLifecycle } from './lifecycle';
import { useMoveLog } from './move-log';
import { useSessionRecorder } from './session-recorder';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  SessionMeta,
} from './types';
import type { JSX, ReactNode } from 'react';
import { useRxDB } from '@/db/hooks/useRxDB';

// --- Contexts ---

const GameStateContext = createContext<GameEngineState | null>(null);
const GameDispatchContext = createContext<
  ((move: Move) => void) | null
>(null);

// --- Consumer hooks ---

export const useGameState = (): GameEngineState => {
  const ctx = useContext(GameStateContext);
  if (!ctx)
    throw new Error(
      'useGameState must be used within GameEngineProvider',
    );
  return ctx;
};

export const useGameDispatch = (): ((move: Move) => void) => {
  const ctx = useContext(GameDispatchContext);
  if (!ctx)
    throw new Error(
      'useGameDispatch must be used within GameEngineProvider',
    );
  return ctx;
};

// --- Inner component that calls useSessionRecorder once db is ready ---

interface RecorderProps {
  moves: Move[];
  sessionId: string;
  meta: SessionMeta;
  phase: string;
}

const SessionRecorderBridge = ({
  moves,
  sessionId,
  meta,
  phase,
}: RecorderProps): null => {
  const { db } = useRxDB();
  useSessionRecorder(
    moves,
    sessionId,
    meta,
    db as NonNullable<typeof db>,
    phase,
  );
  return null;
};

// Wrapper that only mounts SessionRecorderBridge once db is available
const SessionRecorderGate = (
  props: RecorderProps,
): JSX.Element | null => {
  const { db } = useRxDB();
  if (!db) return null;
  return <SessionRecorderBridge {...props} />;
};

// Helper: replay a MoveLog through the full lifecycle reducer
function replayLog(
  log: MoveLog,
  config: ResolvedGameConfig,
  gameMovers: Record<string, MoveHandler>,
): GameEngineState {
  const reducer = createReducer(config, gameMovers);
  let state = log.initialState;
  for (const move of log.moves) {
    state = reducer(state, move);
  }
  return state;
}

// --- Provider ---

interface GameEngineProviderProps {
  config: ResolvedGameConfig;
  moves: Record<string, MoveHandler>;
  initialState: GameEngineState;
  sessionId: string;
  meta: SessionMeta;
  initialLog?: MoveLog;
  children: ReactNode;
}

export const GameEngineProvider = ({
  config,
  moves: gameMovers,
  initialState,
  sessionId,
  meta,
  initialLog,
  children,
}: GameEngineProviderProps): JSX.Element => {
  // Compute resumed initial state if initialLog provided — run once on mount
  const resolvedInitialState = useMemo(() => {
    if (!initialLog || initialLog.moves.length === 0)
      return initialState;
    return replayLog(initialLog, config, gameMovers);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run once on mount; initialLog is treated as immutable
  }, []);

  const [state, lifecycleDispatch] = useGameLifecycle(
    config,
    gameMovers,
    resolvedInitialState,
  );

  const { moves, canUndo, appendMove } = useMoveLog(
    config.maxUndoDepth,
  );

  // Keep refs so dispatch closure stays stable across re-renders
  const movesRef = useRef<Move[]>(moves);
  movesRef.current = moves;
  const metaRef = useRef<SessionMeta>(meta);
  metaRef.current = meta;
  const canUndoRef = useRef<boolean>(canUndo);
  canUndoRef.current = canUndo;

  const dispatch = useCallback(
    (move: Move) => {
      if (move.type === 'UNDO') {
        if (!canUndoRef.current) return;
        const accepted = appendMove(move);
        if (!accepted) return;

        const targetStep = move.args['targetStep'] as number;
        // Replay all moves up to targetStep using full lifecycle reducer
        const currentMeta = metaRef.current;
        const tempLog: MoveLog = {
          gameId: currentMeta.gameId,
          sessionId,
          profileId: currentMeta.profileId,
          seed: currentMeta.seed,
          initialContent: currentMeta.initialContent,
          initialState,
          moves: movesRef.current.slice(0, targetStep),
        };
        const recoveredState = replayLog(tempLog, config, gameMovers);
        lifecycleDispatch({
          type: 'RESTORE_STATE',
          args: { _state: JSON.stringify(recoveredState) },
          timestamp: move.timestamp,
        });
        return;
      }

      appendMove(move);
      lifecycleDispatch(move);
    },
    [
      appendMove,
      sessionId,
      initialState,
      config,
      gameMovers,
      lifecycleDispatch,
    ],
  );

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        <SessionRecorderGate
          moves={moves}
          sessionId={sessionId}
          meta={meta}
          phase={state.phase}
        />
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
};

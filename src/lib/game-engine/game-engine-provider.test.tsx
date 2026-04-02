// src/lib/game-engine/game-engine-provider.test.tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GameEngineProvider,
  useGameDispatch,
  useGameState,
} from './index';
import type {
  GameEngineState,
  MoveHandler,
  MoveLog,
  ResolvedContent,
  ResolvedGameConfig,
} from './types';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
  ],
};

const config: ResolvedGameConfig = {
  gameId: 'test',
  title: { en: 'Test' },
  gradeBand: 'year1-2',
  maxRounds: 2,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: false,
  timerDurationSeconds: null,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'instructions',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

// Game handler that records answer
const submitHandler: MoveHandler = (state, args) => ({
  ...state,
  currentRound: {
    ...state.currentRound,
    answer: args['answer'] as string,
  },
});

const gameMovers: Record<string, MoveHandler> = {
  SUBMIT_ANSWER: submitHandler,
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function makeWrapper(sessionId: string) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      <GameEngineProvider
        config={config}
        moves={gameMovers}
        initialState={initialState}
        sessionId={sessionId}
        meta={{
          profileId: 'prof-provider',
          gameId: 'test',
          gradeBand: 'year1-2',
          seed: 'seed-provider',
          initialContent: content,
          initialState,
        }}
      >
        {children}
      </GameEngineProvider>
    </DbProvider>
  );
  Wrapper.displayName = `TestWrapper(${sessionId})`;
  return Wrapper;
}

describe('GameEngineProvider', () => {
  it('provides initial state via useGameState', () => {
    const { result } = renderHook(() => useGameState(), {
      wrapper: makeWrapper('sess-p-001'),
    });
    expect(result.current.phase).toBe('instructions');
    expect(result.current.score).toBe(0);
  });

  it('provides stable dispatch via useGameDispatch', () => {
    const { result, rerender } = renderHook(() => useGameDispatch(), {
      wrapper: makeWrapper('sess-p-002'),
    });
    const dispatch1 = result.current;
    rerender();
    const dispatch2 = result.current;
    expect(dispatch1).toBe(dispatch2); // stable reference
  });

  it('SKIP_INSTRUCTIONS transitions to playing', () => {
    const { result } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-004') },
    );

    act(() => {
      result.current.dispatch({
        type: 'SKIP_INSTRUCTIONS',
        args: {},
        timestamp: Date.now(),
      });
    });
    expect(result.current.state.phase).toBe('playing');
  });

  it('SUBMIT_ANSWER correct transitions to next-round and records in move log', async () => {
    const { result } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-005') },
    );

    act(() => {
      result.current.dispatch({
        type: 'SKIP_INSTRUCTIONS',
        args: {},
        timestamp: Date.now(),
      });
    });
    act(() => {
      result.current.dispatch({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'A' },
        timestamp: Date.now(),
      });
    });

    expect(result.current.state.phase).toBe('next-round');
    expect(result.current.state.score).toBe(1);

    // Verify move was written to RxDB
    await waitFor(async () => {
      const chunk = await db.session_history
        .findOne('sess-p-005-chunk-0')
        .exec();
      expect(chunk?.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('UNDO rolls back to previous state', () => {
    const { result } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-006') },
    );

    act(() => {
      result.current.dispatch({
        type: 'SKIP_INSTRUCTIONS',
        args: {},
        timestamp: Date.now(),
      }); // move 0
    });
    act(() => {
      result.current.dispatch({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'WRONG' },
        timestamp: Date.now(),
      }); // move 1
    });
    expect(result.current.state.phase).toBe('retry');

    act(() => {
      // UNDO back to after SKIP_INSTRUCTIONS (step 0 = after move 0 applied)
      result.current.dispatch({
        type: 'UNDO',
        args: { targetStep: 1 },
        timestamp: Date.now(),
      });
    });
    expect(result.current.state.phase).toBe('playing');
    expect(result.current.state.score).toBe(0);
  });

  it('resumes from initialLog when provided', () => {
    const resumeLog: MoveLog = {
      gameId: 'test',
      sessionId: 'sess-resume',
      profileId: 'prof-provider',
      seed: 'seed-provider',
      initialContent: content,
      initialState,
      moves: [
        {
          type: 'SKIP_INSTRUCTIONS',
          args: {},
          timestamp: Date.now(),
        },
        {
          type: 'SUBMIT_ANSWER',
          args: { answer: 'A' },
          timestamp: Date.now(),
        },
      ],
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <GameEngineProvider
          config={config}
          moves={gameMovers}
          initialState={initialState}
          sessionId="sess-resume"
          meta={{
            profileId: 'prof-provider',
            gameId: 'test',
            gradeBand: 'year1-2',
            seed: 'seed-provider',
            initialContent: content,
            initialState,
          }}
          initialLog={resumeLog}
        >
          {children}
        </GameEngineProvider>
      </DbProvider>
    );
    wrapper.displayName = 'ResumeWrapper';

    const { result } = renderHook(() => useGameState(), { wrapper });
    // After replaying 2 moves (SKIP_INSTRUCTIONS + SUBMIT_ANSWER correct), should be next-round
    expect(result.current.phase).toBe('next-round');
    expect(result.current.score).toBe(1);
  });
});

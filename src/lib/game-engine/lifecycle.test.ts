// src/lib/game-engine/lifecycle.test.ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGameLifecycle } from './lifecycle';
import type {
  GameEngineState,
  MoveHandler,
  ResolvedContent,
  ResolvedGameConfig,
} from './types';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
    { id: 'r3', prompt: { en: 'Q3' }, correctAnswer: 'C' },
  ],
};

const config: ResolvedGameConfig = {
  gameId: 'test',
  title: { en: 'Test Game' },
  gradeBand: 'year1-2',
  maxRounds: 3,
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

// A game handler that records the submitted answer in currentRound
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

describe('useGameLifecycle', () => {
  it('starts at instructions phase', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    expect(result.current[0].phase).toBe('instructions');
  });

  it('SKIP_INSTRUCTIONS: instructions → playing', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    act(() => {
      result.current[1]({
        type: 'SKIP_INSTRUCTIONS',
        args: {},
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('playing');
  });

  it('SUBMIT_ANSWER correct: playing → next-round, increments score and streak', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'A' },
        timestamp: 0,
      });
    });
    const state = result.current[0];
    expect(state.phase).toBe('next-round');
    expect(state.score).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.retryCount).toBe(0);
  });

  it('SUBMIT_ANSWER wrong with retries remaining: playing → retry, resets streak', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'WRONG' },
        timestamp: 0,
      });
    });
    const state = result.current[0];
    expect(state.phase).toBe('retry');
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.retryCount).toBe(1);
  });

  it('SUBMIT_ANSWER wrong with no retries remaining: playing → next-round', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
        retryCount: 1, // already used the 1 allowed retry
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'WRONG' },
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('next-round');
  });

  it('SUBMIT_ANSWER correct on last round: playing → game-over', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
        roundIndex: 2, // last of 3 rounds (maxRounds=3)
        currentRound: { roundId: 'r3', answer: null, hintsUsed: 0 },
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'C' },
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('game-over');
  });

  it('NEXT_ROUND: next-round → playing, increments roundIndex, resets retryCount', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'next-round',
        roundIndex: 0,
      }),
    );
    act(() => {
      result.current[1]({ type: 'NEXT_ROUND', args: {}, timestamp: 0 });
    });
    const state = result.current[0];
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(1);
    expect(state.retryCount).toBe(0);
    expect(state.currentRound.roundId).toBe('r2');
    expect(state.currentRound.answer).toBe(null);
  });

  it('RETRY: retry → playing, resets answer', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'retry',
        currentRound: { roundId: 'r1', answer: 'WRONG', hintsUsed: 0 },
      }),
    );
    act(() => {
      result.current[1]({ type: 'RETRY', args: {}, timestamp: 0 });
    });
    const state = result.current[0];
    expect(state.phase).toBe('playing');
    expect(state.currentRound.answer).toBe(null);
  });

  it('END_GAME: game-over → idle', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'game-over',
      }),
    );
    act(() => {
      result.current[1]({ type: 'END_GAME', args: {}, timestamp: 0 });
    });
    expect(result.current[0].phase).toBe('idle');
  });

  it('REQUEST_HINT: increments hintsUsed in currentRound', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'REQUEST_HINT',
        args: {},
        timestamp: 0,
      });
    });
    expect(result.current[0].currentRound.hintsUsed).toBe(1);
  });

  it('RESTORE_STATE: force sets state (used for UNDO)', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    const forcedState: GameEngineState = {
      ...initialState,
      phase: 'playing',
      score: 99,
    };
    act(() => {
      result.current[1]({
        type: 'RESTORE_STATE',
        args: { _state: JSON.stringify(forcedState) },
        timestamp: 0,
      });
    });
    expect(result.current[0].score).toBe(99);
    expect(result.current[0].phase).toBe('playing');
  });

  it('ignores invalid transitions (wrong phase guard)', () => {
    const { result } = renderHook(
      () => useGameLifecycle(config, gameMovers, initialState), // phase = instructions
    );
    // NEXT_ROUND is invalid from instructions phase
    act(() => {
      result.current[1]({ type: 'NEXT_ROUND', args: {}, timestamp: 0 });
    });
    expect(result.current[0].phase).toBe('instructions'); // unchanged
  });
});

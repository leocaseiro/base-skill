import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { setup } from 'xstate';
import {
  GameEngineContext,
  useGameEngine,
  useGameEngineContext,
} from './useGameEngine';
import type { GameDefinition } from './definition-types';
import type { SoundKey } from '@/lib/audio/AudioFeedback';
import type { ReactNode } from 'react';

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

interface TestRound {
  prompt: string;
}

const buildTestDefinition = (): GameDefinition<TestRound> => ({
  id: 'test-game',
  interaction: 'drag-to-slot',
  buildRound: (ctx) => ({ prompt: `round-${ctx.roundIndex}` }),
  machine: setup({
    types: {} as {
      context: {
        roundIndex: number;
        levelIndex: number;
        totalRounds: number;
      };
      events:
        | { type: 'ROUND_CORRECT' }
        | { type: 'ROUND_ERROR' }
        | { type: 'NEXT' }
        | { type: 'GAME_OVER' };
    },
    actions: {
      playSound: (_, _params: { sound: SoundKey }) => {},
    },
  }).createMachine({
    id: 'test-game',
    initial: 'playing',
    context: { roundIndex: 0, levelIndex: 0, totalRounds: 3 },
    states: {
      playing: {
        on: {
          ROUND_CORRECT: 'roundComplete',
          GAME_OVER: 'gameOver',
        },
      },
      roundComplete: {
        entry: [
          { type: 'playSound', params: { sound: 'round-complete' } },
        ],
        on: { NEXT: 'playing' },
      },
      gameOver: { type: 'final' },
    },
  }),
});

describe('useGameEngine', () => {
  it('starts in `playing` state', () => {
    const def = buildTestDefinition();
    const { result } = renderHook(() => useGameEngine(def));
    expect(result.current.phase).toBe('playing');
  });

  it('transitions on `send`', () => {
    const def = buildTestDefinition();
    const { result } = renderHook(() => useGameEngine(def));

    act(() => {
      result.current.send({ type: 'ROUND_CORRECT' });
    });
    expect(result.current.phase).toBe('roundComplete');

    act(() => {
      result.current.send({ type: 'NEXT' });
    });
    expect(result.current.phase).toBe('playing');
  });

  it('exposes definition through GameEngineContext', () => {
    const def = buildTestDefinition();

    const Wrapper = ({ children }: { children: ReactNode }) => {
      const engine = useGameEngine(def);
      return (
        <GameEngineContext.Provider value={{ definition: def, engine }}>
          {children}
        </GameEngineContext.Provider>
      );
    };

    const { result } = renderHook(() => useGameEngineContext(), {
      wrapper: Wrapper,
    });
    expect(result.current.definition.id).toBe('test-game');
  });

  it('returns `celebrating: null` in PR 1a (Spec Delta 2)', () => {
    const def = buildTestDefinition();
    const { result } = renderHook(() => useGameEngine(def));
    expect(result.current.celebrating).toBeNull();
  });

  it('fires playSound entry action with the typed sound key', async () => {
    const { playSound } = await import('@/lib/audio/AudioFeedback');
    const playSoundMock = vi.mocked(playSound);
    playSoundMock.mockClear();

    const def = buildTestDefinition();
    const { result } = renderHook(() => useGameEngine(def));

    act(() => {
      result.current.send({ type: 'ROUND_CORRECT' });
    });

    expect(playSoundMock).toHaveBeenCalledWith('round-complete');
  });

  it('reads roundIndex from machine context', () => {
    const def = buildTestDefinition();
    const { result } = renderHook(() => useGameEngine(def));
    expect(result.current.roundIndex).toBe(0);
    expect(result.current.totalRounds).toBe(3);
    expect(result.current.isLastRound).toBe(false);
  });
});

import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { __resetSkinRegistryForTests, registerSkin } from './registry';
import { useGameSkin } from './useGameSkin';
import type { GameSkin } from './game-skin';
import { getGameEventBus } from '@/lib/game-event-bus';

describe('useGameSkin', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the classic skin when no id is provided', () => {
    const { result } = renderHook(() => useGameSkin('sort-numbers'));
    expect(result.current.id).toBe('classic');
  });

  it('returns the registered skin when the id matches', () => {
    const dino: GameSkin = {
      id: 'dino',
      name: 'Dino',
      tokens: {},
    };
    registerSkin('sort-numbers', dino);
    const { result } = renderHook(() =>
      useGameSkin('sort-numbers', 'dino'),
    );
    expect(result.current).toBe(dino);
  });

  it('wires onCorrectPlace to game:evaluate with correct=true', () => {
    const onCorrectPlace = vi.fn();
    const skin: GameSkin = {
      id: 'snd',
      name: 'Snd',
      tokens: {},
      onCorrectPlace,
    };
    registerSkin('sort-numbers', skin);

    renderHook(() => useGameSkin('sort-numbers', 'snd'));

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: true,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).toHaveBeenCalledWith(2, '5');
  });

  it('does NOT call onCorrectPlace for wrong evaluations', () => {
    const onCorrectPlace = vi.fn();
    const onWrongPlace = vi.fn();
    registerSkin('sort-numbers', {
      id: 's',
      name: 'S',
      tokens: {},
      onCorrectPlace,
      onWrongPlace,
    });

    renderHook(() => useGameSkin('sort-numbers', 's'));

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: false,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).not.toHaveBeenCalled();
    expect(onWrongPlace).toHaveBeenCalledWith(2, '5');
  });

  it('forwards retryCount from GameEndEvent to skin.onGameOver', () => {
    const onGameOver = vi.fn();
    registerSkin('sort-numbers', {
      id: 'retry-test',
      name: 'Retry Test',
      tokens: {},
      onGameOver,
    });

    renderHook(() => useGameSkin('sort-numbers', 'retry-test'));

    act(() => {
      getGameEventBus().emit({
        type: 'game:end',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: 0,
        finalScore: 0,
        totalRounds: 1,
        correctCount: 1,
        durationMs: 100,
        retryCount: 3,
      });
    });

    expect(onGameOver).toHaveBeenCalledWith(3);
  });

  it('unsubscribes on unmount', () => {
    const onCorrectPlace = vi.fn();
    registerSkin('sort-numbers', {
      id: 's2',
      name: 'S2',
      tokens: {},
      onCorrectPlace,
    });

    const { unmount } = renderHook(() =>
      useGameSkin('sort-numbers', 's2'),
    );
    unmount();

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: true,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).not.toHaveBeenCalled();
  });
});

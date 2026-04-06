import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useGameSounds } from './useGameSounds';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

import { playSound } from '@/lib/audio/AudioFeedback';

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn().mockImplementation(() => Promise.resolve()),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const baseConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tiles: TileItem[] = [{ id: 't1', label: 'A', value: 'A' }];
const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('useGameSounds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not play a sound on initial render', () => {
    renderHook(() => useGameSounds(), {
      wrapper: createWrapper(baseConfig),
    });
    expect(playSound).not.toHaveBeenCalled();
  });

  it('plays "game-complete" when phase transitions to game-over via COMPLETE_GAME', () => {
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        useGameSounds();
        return dispatch;
      },
      { wrapper: createWrapper(baseConfig) },
    );
    act(() => {
      result.current({ type: 'INIT_ROUND', tiles, zones });
    });
    vi.clearAllMocks();
    act(() => {
      result.current({ type: 'COMPLETE_GAME' });
    });
    expect(playSound).toHaveBeenCalledWith('game-complete');
  });

  it('plays "round-complete" when phase transitions to round-complete via PLACE_TILE completing all zones', () => {
    const multiRoundConfig: AnswerGameConfig = {
      ...baseConfig,
      totalRounds: 2,
    };
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        useGameSounds();
        return dispatch;
      },
      { wrapper: createWrapper(multiRoundConfig) },
    );
    act(() => {
      result.current({ type: 'INIT_ROUND', tiles, zones });
    });
    vi.clearAllMocks();
    act(() => {
      result.current({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
    });
    expect(playSound).toHaveBeenCalledWith('round-complete');
  });

  it('confettiReady is false initially', () => {
    const { result } = renderHook(() => useGameSounds(), {
      wrapper: createWrapper(baseConfig),
    });
    expect(result.current.confettiReady).toBe(false);
  });

  it('confettiReady becomes true on next microtask when phase is round-complete', async () => {
    const multiRoundConfig: AnswerGameConfig = {
      ...baseConfig,
      totalRounds: 2,
    };
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        const sounds = useGameSounds();
        return { dispatch, sounds };
      },
      { wrapper: createWrapper(multiRoundConfig) },
    );
    act(() => {
      result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
    });
    await act(async () => {
      result.current.dispatch({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
    });

    expect(result.current.sounds.confettiReady).toBe(true);
  });

  it('confettiReady does not show when last round completes (goes straight to game-over)', () => {
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        const sounds = useGameSounds();
        return { dispatch, sounds };
      },
      { wrapper: createWrapper(baseConfig) },
    );
    act(() => {
      result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
    });
    act(() => {
      result.current.dispatch({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
    });

    expect(result.current.sounds.confettiReady).toBe(false);
    expect(playSound).toHaveBeenCalledWith('game-complete');
  });

  it('confettiReady resets to false when phase leaves round-complete', async () => {
    const multiRoundConfig: AnswerGameConfig = {
      ...baseConfig,
      totalRounds: 2,
    };
    const extraTile: TileItem = { id: 't2', label: 'B', value: 'B' };
    const extraZone: AnswerZone = {
      id: 'z1',
      index: 1,
      expectedValue: 'B',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    };

    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        const sounds = useGameSounds();
        return { dispatch, sounds };
      },
      { wrapper: createWrapper(multiRoundConfig) },
    );

    act(() => {
      result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
    });
    await act(async () => {
      result.current.dispatch({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
    });
    expect(result.current.sounds.confettiReady).toBe(true);

    await act(async () => {
      result.current.dispatch({
        type: 'ADVANCE_ROUND',
        tiles: [extraTile],
        zones: [extraZone],
      });
    });
    expect(result.current.sounds.confettiReady).toBe(false);
  });

  it('gameOverReady is false initially', () => {
    const { result } = renderHook(() => useGameSounds(), {
      wrapper: createWrapper(baseConfig),
    });
    expect(result.current.gameOverReady).toBe(false);
  });

  it('gameOverReady becomes true on next microtask when phase is game-over', async () => {
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        const sounds = useGameSounds();
        return { dispatch, sounds };
      },
      { wrapper: createWrapper(baseConfig) },
    );
    act(() => {
      result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
    });
    await act(async () => {
      result.current.dispatch({ type: 'COMPLETE_GAME' });
    });

    expect(result.current.sounds.gameOverReady).toBe(true);
  });
});

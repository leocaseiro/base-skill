import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useGameSounds } from './useGameSounds';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

import { queueSound } from '@/lib/audio/AudioFeedback';

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
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
    expect(queueSound).not.toHaveBeenCalled();
  });

  it('queues "game-complete" when phase transitions to game-over via COMPLETE_GAME', () => {
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
    expect(queueSound).toHaveBeenCalledWith('game-complete');
  });

  it('queues "round-complete" when phase transitions to round-complete via PLACE_TILE completing all zones', () => {
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
      result.current({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
    });
    expect(queueSound).toHaveBeenCalledWith('round-complete');
  });
});

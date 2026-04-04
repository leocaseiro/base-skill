import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useFreeSwap } from './useFreeSwap';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tileItems: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
];

const answerZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function useHarness() {
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  if (state.zones.length === 0)
    dispatch({
      type: 'INIT_ROUND',
      tiles: tileItems,
      zones: answerZones,
    });
  const { swapOrPlace } = useFreeSwap();
  return { state, dispatch, swapOrPlace };
}

const Wrapper = ({ children }: { children: ReactNode }) => (
  <AnswerGameProvider config={gameConfig}>
    {children}
  </AnswerGameProvider>
);

describe('useFreeSwap', () => {
  it('places tile in empty zone', () => {
    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => result.current.swapOrPlace('t1', 0));
    expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
  });

  it('swaps tiles when target zone is occupied', () => {
    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => {
      result.current.dispatch({
        type: 'PLACE_TILE',
        tileId: 't1',
        zoneIndex: 0,
      });
      result.current.dispatch({
        type: 'PLACE_TILE',
        tileId: 't2',
        zoneIndex: 1,
      });
    });
    act(() => result.current.swapOrPlace('t1', 1));
    expect(result.current.state.zones[0]?.placedTileId).toBe('t2');
    expect(result.current.state.zones[1]?.placedTileId).toBe('t1');
  });
});

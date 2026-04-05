import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useAutoNextSlot } from './useAutoNextSlot';
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
  const { placeInNextSlot } = useAutoNextSlot();
  return { state, placeInNextSlot };
}

const Wrapper = ({ children }: { children: ReactNode }) => (
  <AnswerGameProvider config={gameConfig}>
    {children}
  </AnswerGameProvider>
);

describe('useAutoNextSlot', () => {
  it('places tile in activeSlotIndex zone', () => {
    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => result.current.placeInNextSlot('t1'));
    expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
  });

  it('advances activeSlotIndex after correct placement', () => {
    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    expect(result.current.state.activeSlotIndex).toBe(0);
    act(() => result.current.placeInNextSlot('t1'));
    expect(result.current.state.activeSlotIndex).toBe(1);
  });

  it('skips locked zones when finding the next available slot', () => {
    const lockedZoneConfig: AnswerGameConfig = {
      ...gameConfig,
    };
    const lockedZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null,
        isWrong: false,
        isLocked: true,
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

    function useHarnessWithLockedZone() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({
          type: 'INIT_ROUND',
          tiles: tileItems,
          zones: lockedZones,
        });
      const { placeInNextSlot } = useAutoNextSlot();
      return { state, placeInNextSlot };
    }

    const LockedWrapper = ({ children }: { children: ReactNode }) => (
      <AnswerGameProvider config={lockedZoneConfig}>
        {children}
      </AnswerGameProvider>
    );

    const { result } = renderHook(() => useHarnessWithLockedZone(), {
      wrapper: LockedWrapper,
    });

    // Zone 0 is locked, so tile should go to zone 1
    // t2 has value 'A' which matches zone 1's expectedValue 'A'
    act(() => result.current.placeInNextSlot('t2'));
    expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
  });

  it('blocks placement when active slot is in wrong state (double-tap guard)', () => {
    // Scenario: wrong tile was just placed in zone 0 (lock-auto-eject) —
    // isWrong=true, placedTileId=null. A second tap should NOT advance to zone 1.
    const wrongZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null,
        isWrong: true,
        isLocked: true,
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

    function useHarnessWithWrongZone() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({
          type: 'INIT_ROUND',
          tiles: tileItems,
          zones: wrongZones,
        });
      const { placeInNextSlot } = useAutoNextSlot();
      return { state, placeInNextSlot };
    }

    const WrongWrapper = ({ children }: { children: ReactNode }) => (
      <AnswerGameProvider config={gameConfig}>
        {children}
      </AnswerGameProvider>
    );

    const { result } = renderHook(() => useHarnessWithWrongZone(), {
      wrapper: WrongWrapper,
    });

    act(() => result.current.placeInNextSlot('t2'));
    // Zone 1 must stay empty — the guard blocked the placement
    expect(result.current.state.zones[1]?.placedTileId).toBeNull();
  });

  it('wraps around to fill earlier empty slots after out-of-order drag placement', () => {
    // Replicates "cat" scenario: user drags 'a' to slot 1, taps 't' into slot 2,
    // then taps 'c' — activeSlotIndex is 2 (or beyond) but slot 0 is still empty.
    // placeInNextSlot must wrap around and place 'c' in zone 0.
    const threeZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null, // still empty
        isWrong: false,
        isLocked: false,
      },
      {
        id: 'z1',
        index: 1,
        expectedValue: 'A',
        placedTileId: 't2', // already filled out-of-order
        isWrong: false,
        isLocked: false,
      },
      {
        id: 'z2',
        index: 2,
        expectedValue: 'X',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];

    const threeItems: TileItem[] = [
      { id: 't1', label: 'C', value: 'C' },
      { id: 't2', label: 'A', value: 'A' },
      { id: 't3', label: 'X', value: 'X' },
    ];

    function useHarnessThreeZones() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0) {
        dispatch({
          type: 'INIT_ROUND',
          tiles: threeItems,
          zones: threeZones,
        });
        // Simulate activeSlotIndex already at 2 (as if zone 1 was filled via drag)
        dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      }
      const { placeInNextSlot } = useAutoNextSlot();
      return { state, placeInNextSlot };
    }

    const ThreeWrapper = ({ children }: { children: ReactNode }) => (
      <AnswerGameProvider config={gameConfig}>
        {children}
      </AnswerGameProvider>
    );

    const { result } = renderHook(() => useHarnessThreeZones(), {
      wrapper: ThreeWrapper,
    });

    // activeSlotIndex is 2; zones[2] is empty so first call fills zone 2
    act(() => result.current.placeInNextSlot('t3'));
    // Now zones[0] is still empty and activeSlotIndex should wrap around
    act(() => result.current.placeInNextSlot('t1'));
    expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import {
  clearPendingPlacements,
  useAutoNextSlot,
} from './useAutoNextSlot';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { PlaceResult } from './useAutoNextSlot';
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
  { id: 't3', label: 'T', value: 'T' },
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
  {
    id: 'z2',
    index: 2,
    expectedValue: 'T',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

beforeEach(() => {
  clearPendingPlacements();
});

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AutoNextSlotTestWrapper';
  return Wrapper;
}

function useHarness(
  tiles: TileItem[] = tileItems,
  zones: AnswerZone[] = answerZones,
) {
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  if (state.zones.length === 0)
    dispatch({ type: 'INIT_ROUND', tiles, zones });
  const { placeInNextSlot } = useAutoNextSlot();
  return { state, placeInNextSlot };
}

describe('useAutoNextSlot', () => {
  describe('basic placement', () => {
    it('places correct tile in activeSlotIndex zone', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t1');
      });

      expect(res).toEqual({
        placed: true,
        zoneIndex: 0,
        rejected: false,
      });
      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
    });

    it('advances activeSlotIndex after correct placement', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      expect(result.current.state.activeSlotIndex).toBe(0);
      act(() => result.current.placeInNextSlot('t1'));
      expect(result.current.state.activeSlotIndex).toBe(1);
    });

    it('skips locked zones when finding the next available slot', () => {
      const lockedZones: AnswerZone[] = [
        { ...answerZones[0]!, isLocked: true },
        answerZones[1]!,
        answerZones[2]!,
      ];

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tileItems, lockedZones),
        { wrapper: Wrapper },
      );

      act(() => result.current.placeInNextSlot('t2'));
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });
  });

  describe('pre-validation', () => {
    it('rejects wrong tile in lock-auto-eject mode', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({
        placed: false,
        zoneIndex: 0,
        rejected: true,
      });
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    });

    it('rejects wrong tile in reject mode', () => {
      const rejectConfig: AnswerGameConfig = {
        ...gameConfig,
        wrongTileBehavior: 'reject',
      };
      const Wrapper = createWrapper(rejectConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({
        placed: false,
        zoneIndex: 0,
        rejected: true,
      });
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    });

    it('allows wrong tile through in lock-manual mode (no pre-validation)', () => {
      const manualConfig: AnswerGameConfig = {
        ...gameConfig,
        wrongTileBehavior: 'lock-manual',
      };
      const Wrapper = createWrapper(manualConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({
        placed: true,
        zoneIndex: 0,
        rejected: false,
      });
      expect(result.current.state.zones[0]?.placedTileId).toBe('t2');
    });
  });

  describe('pending placements queue', () => {
    it('prevents double-placement on rapid taps (stale closure fix)', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.placeInNextSlot('t1');
        result.current.placeInNextSlot('t2');
      });

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });

    it('handles three rapid correct taps', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.placeInNextSlot('t1');
        result.current.placeInNextSlot('t2');
        result.current.placeInNextSlot('t3');
      });

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
      expect(result.current.state.zones[2]?.placedTileId).toBe('t3');
    });
  });

  describe('wrap-around', () => {
    it('wraps around to fill earlier empty slots', () => {
      const threeZones: AnswerZone[] = [
        { ...answerZones[0]!, placedTileId: null },
        { ...answerZones[1]!, placedTileId: 't2' },
        { ...answerZones[2]!, placedTileId: null },
      ];

      const Wrapper = createWrapper(gameConfig);

      function useHarnessWrap() {
        const dispatch = useAnswerGameDispatch();
        const state = useAnswerGameContext();
        if (state.zones.length === 0) {
          dispatch({
            type: 'INIT_ROUND',
            tiles: tileItems,
            zones: threeZones,
          });
          dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
        }
        const { placeInNextSlot } = useAutoNextSlot();
        return { state, placeInNextSlot };
      }

      const { result } = renderHook(() => useHarnessWrap(), {
        wrapper: Wrapper,
      });

      act(() => result.current.placeInNextSlot('t3'));
      act(() => result.current.placeInNextSlot('t1'));

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
    });
  });

  describe('isWrong guard removal', () => {
    it('places correct tile in next slot even when active slot is wrong (lock-auto-eject drag)', () => {
      const wrongZones: AnswerZone[] = [
        {
          ...answerZones[0]!,
          placedTileId: 'tX',
          isWrong: true,
          isLocked: true,
        },
        answerZones[1]!,
        answerZones[2]!,
      ];

      const tilesWithX: TileItem[] = [
        ...tileItems,
        { id: 'tX', label: 'X', value: 'X' },
      ];

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tilesWithX, wrongZones),
        { wrapper: Wrapper },
      );

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({
        placed: true,
        zoneIndex: 1,
        rejected: false,
      });
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });

    it('treats isWrong slot with no placedTileId as available (pre-validation supersedes guard)', () => {
      const wrongZones: AnswerZone[] = [
        {
          ...answerZones[0]!,
          placedTileId: null,
          isWrong: true,
          isLocked: false,
        },
        answerZones[1]!,
        answerZones[2]!,
      ];

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tileItems, wrongZones),
        { wrapper: Wrapper },
      );

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t1');
      });

      expect(res).toEqual({
        placed: true,
        zoneIndex: 0,
        rejected: false,
      });
      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
    });
  });

  describe('no slot available', () => {
    it('returns placed: false, zoneIndex: -1, rejected: false when all slots full', () => {
      const fullZones: AnswerZone[] = answerZones.map((z) => ({
        ...z,
        placedTileId: 'tX',
        isLocked: true,
      }));

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tileItems, fullZones),
        { wrapper: Wrapper },
      );

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t1');
      });

      expect(res).toEqual({
        placed: false,
        zoneIndex: -1,
        rejected: false,
      });
    });
  });
});

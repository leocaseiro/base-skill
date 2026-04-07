import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useSlotBehavior } from './useSlotBehavior';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  dropTargetForElements: vi.fn().mockReturnValue(() => {}),
  draggable: vi.fn().mockReturnValue(() => {}),
}));

const tiles: TileItem[] = [
  { id: 'tile-1', label: 'A', value: 'A' },
  { id: 'tile-2', label: 'B', value: 'B' },
];

const emptyZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'B',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const baseConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AnswerGameTestWrapper';
  return Wrapper;
}

function useHarness(index: number, zones: AnswerZone[] = emptyZones) {
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  useEffect(() => {
    if (state.zones.length === 0) {
      dispatch({ type: 'INIT_ROUND', tiles, zones });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tiles/zones are stable test fixtures; empty deps intentional
  }, []);
  const result = useSlotBehavior(index);
  return { state, result };
}

describe('useSlotBehavior', () => {
  it('returns empty state for an unfilled slot', () => {
    const { result } = renderHook(() => useHarness(0), {
      wrapper: createWrapper(baseConfig),
    });
    expect(result.current.result.renderProps.isEmpty).toBe(true);
    expect(result.current.result.renderProps.label).toBeNull();
  });

  it('returns filled state for a slot with a placed tile', () => {
    const filledZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'A',
        placedTileId: 'tile-1',
        isWrong: false,
        isLocked: false,
      },
      {
        id: 'z1',
        index: 1,
        expectedValue: 'B',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];

    const { result } = renderHook(() => useHarness(0, filledZones), {
      wrapper: createWrapper(baseConfig),
    });

    expect(result.current.result.renderProps.label).toBe('A');
    expect(result.current.result.renderProps.isEmpty).toBe(false);
  });

  it('marks slot as active when index matches activeSlotIndex in ordered mode', () => {
    const orderedConfig: AnswerGameConfig = {
      ...baseConfig,
      slotInteraction: 'ordered',
    };

    const { result } = renderHook(() => useHarness(0, emptyZones), {
      wrapper: createWrapper(orderedConfig),
    });

    // activeSlotIndex starts at 0, index is 0, ordered mode
    expect(result.current.result.renderProps.isActive).toBe(true);
  });

  it('never marks slot as active in free-swap mode', () => {
    const freeSwapConfig: AnswerGameConfig = {
      ...baseConfig,
      slotInteraction: 'free-swap',
    };

    const { result } = renderHook(() => useHarness(0, emptyZones), {
      wrapper: createWrapper(freeSwapConfig),
    });

    // Even though activeSlotIndex is 0 and index is 0, free-swap never marks active
    expect(result.current.result.renderProps.isActive).toBe(false);
  });

  it('shows cursor only in ordered mode with non-drag input method', () => {
    const orderedBothConfig: AnswerGameConfig = {
      ...baseConfig,
      slotInteraction: 'ordered',
      inputMethod: 'both',
    };

    const { result } = renderHook(() => useHarness(0, emptyZones), {
      wrapper: createWrapper(orderedBothConfig),
    });

    // Ordered, inputMethod !== 'drag', slot is empty, isActive === true
    expect(result.current.result.renderProps.showCursor).toBe(true);
  });

  it('does not show cursor when inputMethod is drag', () => {
    const orderedDragConfig: AnswerGameConfig = {
      ...baseConfig,
      slotInteraction: 'ordered',
      inputMethod: 'drag',
    };

    const { result } = renderHook(() => useHarness(0, emptyZones), {
      wrapper: createWrapper(orderedDragConfig),
    });

    expect(result.current.result.renderProps.showCursor).toBe(false);
  });

  it('returns correct tileId for filled slot', () => {
    const filledZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'A',
        placedTileId: 'tile-1',
        isWrong: false,
        isLocked: false,
      },
      {
        id: 'z1',
        index: 1,
        expectedValue: 'B',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];

    const { result } = renderHook(() => useHarness(0, filledZones), {
      wrapper: createWrapper(baseConfig),
    });

    expect(result.current.result.renderProps.tileId).toBe('tile-1');
  });

  it('returns isWrong and isLocked from zone state', () => {
    const wrongZones: AnswerZone[] = [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'A',
        placedTileId: 'tile-1',
        isWrong: true,
        isLocked: true,
      },
      {
        id: 'z1',
        index: 1,
        expectedValue: 'B',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];

    const { result } = renderHook(() => useHarness(0, wrongZones), {
      wrapper: createWrapper(baseConfig),
    });

    expect(result.current.result.renderProps.isWrong).toBe(true);
    expect(result.current.result.renderProps.isLocked).toBe(true);
  });
});

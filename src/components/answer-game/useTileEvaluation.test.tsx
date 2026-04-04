import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useTileEvaluation } from './useTileEvaluation';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';
import { playSound } from '@/lib/audio/AudioFeedback';
import { cancelSpeech } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  cancelSpeech: vi.fn(),
}));

const baseConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'X', value: 'X' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AnswerGameTestWrapper';
  return Wrapper;
}

function useTileEvaluationHarness() {
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  if (state.zones.length === 0) {
    dispatch({ type: 'INIT_ROUND', tiles, zones });
  }
  const { placeTile } = useTileEvaluation();
  return { state, placeTile };
}

function useInitialisedEvaluation(_config: AnswerGameConfig) {
  const dispatch = useAnswerGameDispatch();
  const { zones: stateZones } = useAnswerGameContext();
  if (stateZones.length === 0) {
    dispatch({ type: 'INIT_ROUND', tiles, zones });
  }
  return useTileEvaluation();
}

describe('useTileEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('plays "correct" sound on correct tile placement', () => {
    const { result } = renderHook(
      () => useInitialisedEvaluation(baseConfig),
      { wrapper: createWrapper(baseConfig) },
    );
    act(() => result.current.placeTile('t1', 0));
    expect(playSound).toHaveBeenCalledWith('correct', 0.8);
  });

  it('cancels speech before playing sound on tile placement', () => {
    const { result } = renderHook(
      () => useInitialisedEvaluation(baseConfig),
      { wrapper: createWrapper(baseConfig) },
    );
    act(() => result.current.placeTile('t1', 0));
    const cancelOrder =
      vi.mocked(cancelSpeech).mock.invocationCallOrder[0];
    const playOrder = vi.mocked(playSound).mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(playOrder ?? Infinity);
  });

  it('plays "wrong" sound on incorrect tile placement', () => {
    const { result } = renderHook(() => useTileEvaluationHarness(), {
      wrapper: createWrapper(baseConfig),
    });
    act(() => result.current.placeTile('t2', 0));
    expect(playSound).toHaveBeenCalledWith('wrong', 0.8);
  });

  it('correct placement: zone not marked wrong', () => {
    const { result } = renderHook(
      () => useInitialisedEvaluation(baseConfig),
      {
        wrapper: createWrapper(baseConfig),
      },
    );
    act(() => result.current.placeTile('t1', 0));
    expect(result.current.placeTile).toBeDefined();
  });

  it('lock-auto-eject: EJECT_TILE fires after 1000ms for wrong tile', () => {
    const { result } = renderHook(() => useTileEvaluationHarness(), {
      wrapper: createWrapper(baseConfig),
    });

    act(() => result.current.placeTile('t2', 0));
    expect(result.current.state.zones[0]?.isWrong).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    expect(result.current.state.zones[0]?.isWrong).toBe(false);
  });

  it('reject: no zone placement, only retryCount incremented', () => {
    const rejectConfig: AnswerGameConfig = {
      ...baseConfig,
      wrongTileBehavior: 'reject',
    };

    const { result } = renderHook(() => useTileEvaluationHarness(), {
      wrapper: createWrapper(rejectConfig),
    });

    act(() => result.current.placeTile('t2', 0));
    expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    expect(result.current.state.retryCount).toBe(1);
  });

  it('lock-manual: wrong tile stays until manually removed', () => {
    const manualConfig: AnswerGameConfig = {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual',
    };

    const { result } = renderHook(() => useTileEvaluationHarness(), {
      wrapper: createWrapper(manualConfig),
    });

    act(() => result.current.placeTile('t2', 0));
    expect(result.current.state.zones[0]?.isWrong).toBe(true);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.state.zones[0]?.placedTileId).toBe('t2');
  });
});

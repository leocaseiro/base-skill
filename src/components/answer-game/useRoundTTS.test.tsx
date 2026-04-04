import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import { useRoundTTS } from './useRoundTTS';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

const mockSpeakPrompt = vi.fn();

vi.mock('./useGameTTS', () => ({
  useGameTTS: () => ({
    speakTile: vi.fn(),
    speakPrompt: mockSpeakPrompt,
  }),
}));

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

const ttsConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 2,
  ttsEnabled: true,
};

const noTtsConfig: AnswerGameConfig = {
  ...ttsConfig,
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

describe('useRoundTTS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls speakPrompt on mount with the prompt', async () => {
    renderHook(() => useRoundTTS('cat'), {
      wrapper: createWrapper(ttsConfig),
    });
    await waitFor(() => {
      expect(mockSpeakPrompt).toHaveBeenCalledWith('cat');
    });
  });

  it('does NOT call speakPrompt when ttsEnabled is false', () => {
    renderHook(() => useRoundTTS('cat'), {
      wrapper: createWrapper(noTtsConfig),
    });
    expect(mockSpeakPrompt).not.toHaveBeenCalled();
  });

  it('calls speakPrompt again when roundIndex changes (ADVANCE_ROUND)', async () => {
    const { result } = renderHook(
      () => {
        const dispatch = useAnswerGameDispatch();
        useRoundTTS('cat');
        return dispatch;
      },
      { wrapper: createWrapper(ttsConfig) },
    );
    // First call on mount
    await waitFor(() => {
      expect(mockSpeakPrompt).toHaveBeenCalledTimes(1);
    });
    vi.clearAllMocks();

    act(() => {
      result.current({ type: 'INIT_ROUND', tiles, zones });
    });
    act(() => {
      result.current({ type: 'ADVANCE_ROUND', tiles, zones });
    });
    await waitFor(() => {
      expect(mockSpeakPrompt).toHaveBeenCalledWith('cat');
    });
  });
});

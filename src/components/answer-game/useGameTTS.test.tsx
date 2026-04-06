import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useGameTTS } from './useGameTTS';
import type { AnswerGameConfig } from './types';
import type { ReactNode } from 'react';

import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      speechRate: 1,
      volume: 0.8,
      preferredVoiceURI: undefined,
    },
    update: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const ttsConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const noTtsConfig: AnswerGameConfig = {
  ...ttsConfig,
  ttsEnabled: false,
};

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AnswerGameTestWrapper';
  return Wrapper;
}

describe('useGameTTS', () => {
  beforeEach(() => vi.clearAllMocks());

  it('speakTile calls speak() when ttsEnabled', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: createWrapper(ttsConfig),
    });
    result.current.speakTile('A');
    expect(speak).toHaveBeenCalledWith(
      'A',
      expect.objectContaining({ rate: 1, volume: 0.8 }),
    );
  });

  it('speakPrompt calls speak() when ttsEnabled', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: createWrapper(ttsConfig),
    });
    result.current.speakPrompt('What is this animal?');
    expect(speak).toHaveBeenCalledWith(
      'What is this animal?',
      expect.objectContaining({ rate: 1, volume: 0.8 }),
    );
  });

  it('speakTile is a no-op when speech is already active', () => {
    vi.mocked(isSpeechActive).mockReturnValue(true);
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: createWrapper(ttsConfig),
    });
    result.current.speakTile('A');
    expect(speak).not.toHaveBeenCalled();
  });

  it('speakTile is a no-op when ttsEnabled is false', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: createWrapper(noTtsConfig),
    });
    result.current.speakTile('A');
    expect(speak).not.toHaveBeenCalled();
  });

  it('speakPrompt is a no-op when ttsEnabled is false', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: createWrapper(noTtsConfig),
    });
    result.current.speakPrompt('Some prompt');
    expect(speak).not.toHaveBeenCalled();
  });
});

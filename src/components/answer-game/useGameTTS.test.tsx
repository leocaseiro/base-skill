import { renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useGameTTS } from './useGameTTS';
import type { AnswerGameConfig } from './types';
import type { ReactNode } from 'react';

import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));

const settingsMock = {
  speechRate: 1,
  volume: 0.8,
  preferredVoiceURI: undefined as string | undefined,
};

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: settingsMock,
    update: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const showVoiceDialog = vi.fn();

vi.mock('@/providers/VoiceUnavailableDialogProvider', () => ({
  useVoiceUnavailableDialog: () => ({ show: showVoiceDialog }),
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

const createWrapper = (config: AnswerGameConfig) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AnswerGameTestWrapper';
  return Wrapper;
};

describe('useGameTTS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSpeechActive).mockReturnValue(false);
    settingsMock.preferredVoiceURI = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  describe('preferred voice availability', () => {
    it('speakTile still calls speak() when preferred voice is unavailable (silent fallback)', () => {
      settingsMock.preferredVoiceURI = 'FakeVoice';
      vi.stubGlobal('speechSynthesis', {
        getVoices: vi.fn().mockReturnValue([{ name: 'Samantha' }]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const { result } = renderHook(() => useGameTTS(), {
        wrapper: createWrapper(ttsConfig),
      });
      result.current.speakTile('A');
      expect(showVoiceDialog).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledWith(
        'A',
        expect.objectContaining({ voiceName: 'FakeVoice' }),
      );
    });

    it('speakPromptOnDemand calls showVoiceDialog (not speak) when preferred voice is unavailable', () => {
      settingsMock.preferredVoiceURI = 'FakeVoice';
      vi.stubGlobal('speechSynthesis', {
        getVoices: vi.fn().mockReturnValue([{ name: 'Samantha' }]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const { result } = renderHook(() => useGameTTS(), {
        wrapper: createWrapper(ttsConfig),
      });
      result.current.speakPromptOnDemand('What is this animal?');
      expect(showVoiceDialog).toHaveBeenCalledWith('FakeVoice', 'en');
      expect(speak).not.toHaveBeenCalled();
    });

    it('speakPromptOnDemand calls speak when preferred voice IS in the loaded list', () => {
      settingsMock.preferredVoiceURI = 'Samantha';
      vi.stubGlobal('speechSynthesis', {
        getVoices: vi.fn().mockReturnValue([{ name: 'Samantha' }]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const { result } = renderHook(() => useGameTTS(), {
        wrapper: createWrapper(ttsConfig),
      });
      result.current.speakPromptOnDemand('What is this animal?');
      expect(showVoiceDialog).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledWith(
        'What is this animal?',
        expect.objectContaining({ voiceName: 'Samantha' }),
      );
    });

    it('speakPrompt still calls speak() when preferred voice is unavailable (graceful fallback)', () => {
      settingsMock.preferredVoiceURI = 'FakeVoice';
      vi.stubGlobal('speechSynthesis', {
        getVoices: vi.fn().mockReturnValue([{ name: 'Samantha' }]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const { result } = renderHook(() => useGameTTS(), {
        wrapper: createWrapper(ttsConfig),
      });
      result.current.speakPrompt('Some prompt');
      expect(showVoiceDialog).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledWith(
        'Some prompt',
        expect.objectContaining({
          voiceName: 'FakeVoice',
          lang: 'en-AU',
        }),
      );
    });

    it('speakPrompt resolves a region-less "en" UI language to en-AU', () => {
      settingsMock.preferredVoiceURI = undefined;
      const { result } = renderHook(() => useGameTTS(), {
        wrapper: createWrapper(ttsConfig),
      });
      result.current.speakPrompt('What is this animal?');
      expect(speak).toHaveBeenCalledWith(
        'What is this animal?',
        expect.objectContaining({ lang: 'en-AU' }),
      );
    });
  });
});

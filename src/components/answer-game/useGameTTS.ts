import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { speak } from '@/lib/speech/SpeechOutput';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakPrompt: (text: string) => void;
}

export const useGameTTS = (): GameTTS => {
  const { config } = useAnswerGameContext();
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  const speakTile = useCallback(
    (label: string) => {
      if (!config.ttsEnabled) return;
      speak(label, {
        rate: settings.speechRate ?? 1,
        volume: settings.volume ?? 0.8,
        voiceName: settings.preferredVoiceURI ?? undefined,
        lang: i18n.language,
      });
    },
    [
      config.ttsEnabled,
      settings.speechRate,
      settings.volume,
      settings.preferredVoiceURI,
      i18n.language,
    ],
  );

  const speakPrompt = useCallback(
    (text: string) => {
      if (!config.ttsEnabled) return;
      speak(text, {
        rate: settings.speechRate ?? 1,
        volume: settings.volume ?? 0.8,
        voiceName: settings.preferredVoiceURI ?? undefined,
        lang: i18n.language,
      });
    },
    [
      config.ttsEnabled,
      settings.speechRate,
      settings.volume,
      settings.preferredVoiceURI,
      i18n.language,
    ],
  );

  return { speakTile, speakPrompt };
};

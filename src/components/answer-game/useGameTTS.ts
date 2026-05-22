import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';
import { useVoiceUnavailableDialog } from '@/providers/VoiceUnavailableDialogProvider';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakPrompt: (text: string) => void;
  speakPromptOnDemand: (text: string) => void;
}

const getSynth = (): SpeechSynthesis | undefined =>
  (globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;

const isPreferredVoiceAvailable = (voiceName: string): boolean => {
  const synth = getSynth();
  if (!synth) return true;
  const voices = safeGetVoices(synth);
  if (voices.length === 0) return true;
  return voices.some((v) => v.name === voiceName);
};

export const useGameTTS = (): GameTTS => {
  const { config } = useAnswerGameContext();
  const { settings } = useSettings();
  const { i18n } = useTranslation();
  const { show: showVoiceDialog } = useVoiceUnavailableDialog();

  const speakTile = useCallback(
    (label: string) => {
      if (!config.ttsEnabled) return;
      if (isSpeechActive()) {
        console.debug(`[TTS] speakTile("${label}") — busy, skipped`);
        return;
      }
      if (
        settings.preferredVoiceURI &&
        !isPreferredVoiceAvailable(settings.preferredVoiceURI)
      ) {
        showVoiceDialog(settings.preferredVoiceURI, i18n.language);
        return;
      }
      speak(label, {
        rate: settings.speechRate ?? 1,
        volume: settings.voiceVolume ?? 0.8,
        voiceName: settings.preferredVoiceURI,
        lang: i18n.language,
      });
    },
    [
      config.ttsEnabled,
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
      showVoiceDialog,
    ],
  );

  const speakPrompt = useCallback(
    (text: string) => {
      if (!config.ttsEnabled) return;
      speak(text, {
        rate: settings.speechRate ?? 1,
        volume: settings.voiceVolume ?? 0.8,
        voiceName: settings.preferredVoiceURI,
        lang: i18n.language,
      });
    },
    [
      config.ttsEnabled,
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
    ],
  );

  const speakPromptOnDemand = useCallback(
    (text: string) => {
      if (!config.ttsEnabled) return;
      if (
        settings.preferredVoiceURI &&
        !isPreferredVoiceAvailable(settings.preferredVoiceURI)
      ) {
        showVoiceDialog(settings.preferredVoiceURI, i18n.language);
        return;
      }
      speak(text, {
        rate: settings.speechRate ?? 1,
        volume: settings.voiceVolume ?? 0.8,
        voiceName: settings.preferredVoiceURI,
        lang: i18n.language,
      });
    },
    [
      config.ttsEnabled,
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
      showVoiceDialog,
    ],
  );

  return { speakTile, speakPrompt, speakPromptOnDemand };
};

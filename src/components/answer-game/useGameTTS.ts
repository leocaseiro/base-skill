import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';
import { getSynth } from '@/lib/speech/synth-access';
import { isVoiceAvailableInList } from '@/lib/speech/voices';
import { useVoiceUnavailableDialog } from '@/providers/VoiceUnavailableDialogProvider';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakPrompt: (text: string) => void;
  speakPromptOnDemand: (text: string) => void;
}

const isPreferredVoiceAvailable = (voiceName: string): boolean => {
  const synth = getSynth();
  if (!synth) return true;
  const voices = safeGetVoices(synth);
  if (voices.length === 0) return true;
  return isVoiceAvailableInList(voiceName, voices);
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
    ],
  );

  const speakPrompt = useCallback(
    (text: string) => {
      if (!config.ttsEnabled) return;
      if (
        settings.preferredVoiceURI &&
        !isPreferredVoiceAvailable(settings.preferredVoiceURI)
      ) {
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
    ],
  );

  const speakPromptOnDemand = useCallback(
    (text: string) => {
      if (!config.ttsEnabled) return;
      // doSpeak: shared on-demand path — checks voice availability,
      // shows dialog when unavailable, otherwise speaks.
      const doSpeak = (input: string): void => {
        if (
          settings.preferredVoiceURI &&
          !isPreferredVoiceAvailable(settings.preferredVoiceURI)
        ) {
          showVoiceDialog(settings.preferredVoiceURI, i18n.language);
          return;
        }
        speak(input, {
          rate: settings.speechRate ?? 1,
          volume: settings.voiceVolume ?? 0.8,
          voiceName: settings.preferredVoiceURI,
          lang: i18n.language,
        });
      };
      doSpeak(text);
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

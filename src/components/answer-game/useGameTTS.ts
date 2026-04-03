import { useCallback } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { speak } from '@/lib/speech/SpeechOutput';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakPrompt: (text: string) => void;
}

export function useGameTTS(): GameTTS {
  const { config } = useAnswerGameContext();
  const { ttsEnabled } = config;

  const speakTile = useCallback(
    (label: string) => {
      if (ttsEnabled) speak(label);
    },
    [ttsEnabled],
  );

  const speakPrompt = useCallback(
    (text: string) => {
      if (ttsEnabled) speak(text);
    },
    [ttsEnabled],
  );

  return { speakTile, speakPrompt };
}

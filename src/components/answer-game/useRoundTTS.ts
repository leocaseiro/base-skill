import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useGameTTS } from './useGameTTS';
import { whenSoundEnds } from '@/lib/audio/AudioFeedback';

export const useRoundTTS = (prompt: string): void => {
  const { roundIndex, config } = useAnswerGameContext();
  const { speakPrompt } = useGameTTS();

  useEffect(() => {
    if (!config.ttsEnabled) return;
    if (!prompt) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakPrompt(prompt);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit speakPrompt and prompt to only re-speak on round change
  }, [roundIndex, config.ttsEnabled]);
};

import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useGameTTS } from './useGameTTS';
import { useSettings } from '@/db/hooks/useSettings';
import { whenSoundEnds } from '@/lib/audio/AudioFeedback';

export const useRoundTTS = (prompt: string): void => {
  const { roundIndex, config } = useAnswerGameContext();
  const { speakPrompt } = useGameTTS();
  const { isLoading } = useSettings();

  useEffect(() => {
    if (!config.ttsEnabled) return;
    if (!prompt) return;
    // Wait for RxDB so the saved voice is honoured. Speaking before settings
    // hydrate drops the preferred voice and falls back to the OS default.
    if (isLoading) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakPrompt(prompt);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit speakPrompt/prompt; re-speak only on round change or once settings finish loading
  }, [roundIndex, config.ttsEnabled, isLoading]);
};

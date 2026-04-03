import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useGameTTS } from './useGameTTS';

export const useRoundTTS = (prompt: string): void => {
  const { roundIndex, config } = useAnswerGameContext();
  const { speakPrompt } = useGameTTS();

  useEffect(() => {
    if (!config.ttsEnabled) return;
    if (!prompt) return;
    speakPrompt(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit speakPrompt and prompt to only re-speak on round change
  }, [roundIndex, config.ttsEnabled]);
};

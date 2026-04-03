import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): void => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === prev) return;

    if (phase === 'round-complete') {
      playSound('round-complete');
    } else if (phase === 'game-over') {
      playSound('game-complete');
    }
  }, [phase]);
};

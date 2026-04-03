import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { queueSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): void => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === prev) return;

    if (phase === 'round-complete') {
      queueSound('round-complete');
    } else if (phase === 'game-over') {
      queueSound('game-complete');
    }
  }, [phase]);
};

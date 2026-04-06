import { useEffect, useRef, useState } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): {
  confettiReady: boolean;
  gameOverReady: boolean;
} => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);
  const [confettiReady, setConfettiReady] = useState(false);
  const [gameOverReady, setGameOverReady] = useState(false);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === prev) return;

    let cancelled = false;

    if (phase === 'round-complete') {
      playSound('round-complete');
      void Promise.resolve().then(() => {
        if (!cancelled) setConfettiReady(true);
      });
    } else if (phase === 'game-over') {
      playSound('game-complete');
      void Promise.resolve().then(() => {
        if (!cancelled) setGameOverReady(true);
      });
    } else {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setConfettiReady(false);
          setGameOverReady(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [phase]);

  return { confettiReady, gameOverReady };
};

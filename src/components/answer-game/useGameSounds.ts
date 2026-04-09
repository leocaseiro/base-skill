import { useEffect, useRef, useState } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): {
  confettiReady: boolean;
  levelCompleteReady: boolean;
  gameOverReady: boolean;
} => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);
  const [confettiReady, setConfettiReady] = useState(false);
  const [levelCompleteReady, setLevelCompleteReady] = useState(false);
  const [gameOverReady, setGameOverReady] = useState(false);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === prev) return;

    let cancelled = false;

    switch (phase) {
      case 'round-complete': {
        playSound('round-complete');
        void Promise.resolve().then(() => {
          if (!cancelled) setConfettiReady(true);
        });

        break;
      }
      case 'level-complete': {
        playSound('level-complete');
        void Promise.resolve().then(() => {
          if (!cancelled) setLevelCompleteReady(true);
        });

        break;
      }
      case 'game-over': {
        playSound('game-complete');
        void Promise.resolve().then(() => {
          if (!cancelled) setGameOverReady(true);
        });

        break;
      }
      default: {
        void Promise.resolve().then(() => {
          if (!cancelled) {
            setConfettiReady(false);
            setLevelCompleteReady(false);
            setGameOverReady(false);
          }
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [phase]);

  return { confettiReady, levelCompleteReady, gameOverReady };
};

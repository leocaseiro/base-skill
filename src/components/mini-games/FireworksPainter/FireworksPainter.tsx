import { Fireworks } from '@fireworks-js/react';
import { useEffect, useRef, useState } from 'react';
import type { FireworksHandlers } from '@fireworks-js/react';

interface FireworksPainterProps {
  duration?: number;
  showHandHint?: boolean;
  onComplete?: (fireworkCount: number) => void;
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const EXPLOSION_SOUNDS = [
  `${base}/sounds/explosion0.mp3`,
  `${base}/sounds/explosion1.mp3`,
  `${base}/sounds/explosion2.mp3`,
];

export const FireworksPainter = ({
  duration = 10,
  showHandHint = true,
  onComplete,
}: FireworksPainterProps) => {
  const ref = useRef<FireworksHandlers>(null);
  const [fireworkCount, setFireworkCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isStarted, setIsStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const fireworkCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    fireworkCountRef.current = fireworkCount;
  }, [fireworkCount]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isStarted || isDone) return;

    const timer = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          setIsDone(true);
          onCompleteRef.current?.(fireworkCountRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      globalThis.clearInterval(timer);
    };
  }, [isStarted, isDone]);

  const handleClick = () => {
    if (isDone) return;
    setFireworkCount((prev) => prev + 1);
    if (!isStarted) setIsStarted(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const showHint = showHandHint && !isStarted && !isDone;

  return (
    <div
      role="button"
      aria-label="Tap to launch fireworks"
      tabIndex={0}
      className="fixed inset-0 select-none bg-black"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Fireworks
        ref={ref}
        options={{
          mouse: {
            click: true,
            move: true,
            max: 1,
          },
          sound: {
            enabled: true,
            files: EXPLOSION_SOUNDS,
            volume: { min: 4, max: 8 },
          },
          intensity: 1,
          traceSpeed: 95,
        }}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          position: 'fixed',
        }}
      />

      <div className="pointer-events-none absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-6">
        <span className="text-lg font-bold text-white drop-shadow-md">
          ⏱ {timeLeft}s
        </span>
        <span className="text-lg font-bold text-white drop-shadow-md">
          🎆 {fireworkCount}
        </span>
      </div>

      {showHint && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          aria-hidden="true"
        >
          <span className="animate-bounce text-6xl">👆</span>
          <span className="text-xl font-bold text-white drop-shadow-md">
            Tap anywhere!
          </span>
        </div>
      )}
    </div>
  );
};

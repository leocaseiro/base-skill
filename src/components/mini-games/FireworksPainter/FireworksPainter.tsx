import { Fireworks } from '@fireworks-js/react';
import { useEffect, useRef, useState } from 'react';
import type { FireworksHandlers } from '@fireworks-js/react';

interface FireworksPainterProps {
  duration?: number;
  showHandHint?: boolean;
  onComplete?: () => void;
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
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isStarted, setIsStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const onCompleteRef = useRef(onComplete);

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
          onCompleteRef.current?.();
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
            move: false,
            max: 1,
          },
          sound: {
            enabled: true,
            files: EXPLOSION_SOUNDS,
            volume: { min: 20, max: 90 },
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

      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-6">
        <span className="rounded-full bg-black/40 px-4 py-1 text-lg font-bold text-white drop-shadow-md">
          ⏱ {timeLeft}s
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

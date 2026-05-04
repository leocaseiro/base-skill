import { Fireworks } from '@fireworks-js/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FireworksHandlers } from '@fireworks-js/react';

interface FireworksPainterProps {
  duration?: number;
  showHandHint?: boolean;
  onComplete?: () => void;
}

interface Star {
  id: number;
  top: string;
  left: string;
  opacity: number;
  fontSize: string;
}

const generateStars = (): Star[] =>
  Array.from({ length: 25 }, (_, i) => {
    const seed1 = ((i * 137 + 11) % 97) / 97;
    const seed2 = ((i * 71 + 43) % 89) / 89;
    const seed3 = ((i * 53 + 17) % 61) / 61;
    const seed4 = ((i * 29 + 7) % 73) / 73;
    return {
      id: i,
      top: `${String(Math.round(seed1 * 90))}%`,
      left: `${String(Math.round(seed2 * 95))}%`,
      opacity: 0.4 + seed3 * 0.6,
      fontSize: seed4 > 0.6 ? '0.5rem' : '0.35rem',
    };
  });

const increment = (prev: number) => prev + 1;

const fireworkOptions = {
  mouse: { click: true, move: false, max: 1 },
  sound: { enabled: false },
  intensity: 30,
  traceSpeed: 3,
} as const;

export const FireworksPainter = ({
  duration = 30,
  showHandHint = true,
  onComplete,
}: FireworksPainterProps) => {
  const fireworksRef = useRef<FireworksHandlers>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const [fireworkCount, setFireworkCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showHint, setShowHint] = useState(showHandHint);
  const [isDone, setIsDone] = useState(false);

  const stars = useMemo(generateStars, []);

  useEffect(() => {
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

    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    if (showHandHint) {
      hintTimer = globalThis.setTimeout(() => {
        setShowHint(false);
      }, 3000);
    }

    return () => {
      globalThis.clearInterval(timer);
      if (hintTimer !== undefined) globalThis.clearTimeout(hintTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- duration and showHandHint are init-only
  }, []);

  useEffect(() => {
    if (isDone) fireworksRef.current?.stop();
  }, [isDone]);

  const handleContainerClick = () => {
    if (!isDone) setFireworkCount(increment);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDone) return;
    if (e.key === 'Enter' || e.key === ' ') {
      fireworksRef.current?.launch(1);
      setFireworkCount(increment);
    }
  };

  return (
    <div
      role="button"
      aria-label="Fireworks Painter game"
      tabIndex={0}
      className="relative flex h-full min-h-screen w-full cursor-crosshair select-none overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950"
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      {!isDone && (
        <Fireworks
          ref={fireworksRef}
          options={fireworkOptions}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {stars.map((star) => (
        <span
          key={star.id}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            fontSize: star.fontSize,
            color: 'white',
          }}
        >
          ✦
        </span>
      ))}

      <div className="pointer-events-none absolute left-0 right-0 top-4 flex items-center justify-between px-6">
        <span className="text-lg font-bold text-white drop-shadow-md">
          ⏱ {timeLeft}s
        </span>
        <span className="text-lg font-bold text-white drop-shadow-md">
          🎆 {fireworkCount}
        </span>
      </div>

      {showHint && !isDone && (
        <div
          className="pointer-events-none flex flex-col items-center gap-3"
          aria-hidden="true"
        >
          <span className="animate-bounce text-6xl">👆</span>
          <span className="text-xl font-bold text-white drop-shadow-md">
            Tap anywhere!
          </span>
        </div>
      )}

      {isDone && (
        <div
          className="pointer-events-none flex animate-[rise-in_600ms_ease-out_both] flex-col items-center gap-4"
          aria-live="polite"
          aria-label={`Amazing! You launched ${String(fireworkCount)} fireworks!`}
        >
          <span className="text-7xl">🎆</span>
          <p className="text-center text-3xl font-bold text-white drop-shadow-lg">
            Amazing!
          </p>
          <p className="text-center text-2xl font-bold text-yellow-300 drop-shadow-lg">
            {fireworkCount} fireworks!
          </p>
        </div>
      )}
    </div>
  );
};

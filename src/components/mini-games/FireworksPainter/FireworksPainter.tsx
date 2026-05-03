import confetti from 'canvas-confetti';
import { useEffect, useMemo, useState } from 'react';

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
    // Deterministic pseudo-random using index-based seed
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

export const FireworksPainter = ({
  duration = 30,
  showHandHint = true,
  onComplete,
}: FireworksPainterProps) => {
  const [fireworkCount, setFireworkCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showHint, setShowHint] = useState(showHandHint);
  const [isDone, setIsDone] = useState(false);

  const stars = useMemo(() => generateStars(), []);

  useEffect(() => {
    const timer = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timer);
          setIsDone(true);
          onComplete?.();
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
      confetti.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- duration and showHandHint are init-only; onComplete is intentionally excluded to avoid re-mounting the timer on every render
  }, []);

  const launchFirework = (origin: { x: number; y: number }) => {
    if (isDone) return;
    void confetti({
      particleCount: 80,
      spread: 60,
      origin,
      startVelocity: 35,
      gravity: 0.8,
      ticks: 200,
      colors: [
        '#ff0',
        '#f0f',
        '#0ff',
        '#f80',
        '#0f8',
        '#ff6b6b',
        '#ffd93d',
      ],
    });
    setFireworkCount((prev) => prev + 1);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    launchFirework({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      launchFirework({ x: 0.5, y: 0.5 });
    }
  };

  return (
    <div
      role="application"
      aria-label="Fireworks Painter game"
      tabIndex={0}
      className="relative flex h-full min-h-screen w-full cursor-crosshair select-none items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
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
          className="pointer-events-none flex flex-col items-center gap-3 transition-opacity duration-500"
          style={{ opacity: showHint ? 1 : 0 }}
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

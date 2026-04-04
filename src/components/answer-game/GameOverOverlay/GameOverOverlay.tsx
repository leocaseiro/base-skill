import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface GameOverOverlayProps {
  retryCount: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

const starsFromRetries = (retryCount: number): number => {
  if (retryCount === 0) return 5;
  if (retryCount <= 2) return 4;
  if (retryCount <= 4) return 3;
  if (retryCount <= 6) return 2;
  return 1;
};

export const GameOverOverlay = ({
  retryCount,
  onPlayAgain,
  onHome,
}: GameOverOverlayProps) => {
  const stars = starsFromRetries(retryCount);

  useEffect(() => {
    const duration = 2700;
    const end = Date.now() + duration;
    let rafId: number;

    const frame = () => {
      void confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      void confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
      if (Date.now() < end) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      confetti.reset();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Game complete"
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-background/95"
    >
      <span className="animate-bounce text-8xl" aria-hidden="true">
        🐨
      </span>

      <div
        aria-label={`You scored ${stars} out of 5 stars`}
        className="flex gap-2"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-4xl ${i < stars ? 'text-yellow-400' : 'text-muted-foreground'}`}
          >
            ★
          </span>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-md active:scale-95"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onHome}
          className="rounded-xl bg-muted px-8 py-4 text-lg font-bold active:scale-95"
        >
          Home
        </button>
      </div>
    </div>
  );
};

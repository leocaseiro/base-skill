import { useState } from 'react';
import { FireworksPainter } from '@/components/mini-games/FireworksPainter/FireworksPainter';

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
  const [miniGameDone, setMiniGameDone] = useState(false);

  return (
    <div
      role="dialog"
      aria-label="Game complete"
      className="fixed inset-0"
    >
      <FireworksPainter
        duration={10}
        onComplete={() => {
          setMiniGameDone(true);
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center gap-4">
        <span
          className="animate-bounce text-8xl drop-shadow-lg"
          aria-hidden="true"
        >
          🐨
        </span>

        <div
          aria-label={`You scored ${stars} out of 5 stars`}
          className="flex gap-2"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-4xl drop-shadow-lg ${i < stars ? 'text-yellow-400' : 'text-white/30'}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {miniGameDone && (
        <div className="absolute inset-x-0 bottom-12 z-20 flex animate-[rise-in_400ms_ease-out_both] justify-center gap-4">
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
      )}
    </div>
  );
};

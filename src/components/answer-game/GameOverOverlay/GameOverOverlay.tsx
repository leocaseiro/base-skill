import { Fireworks } from '@fireworks-js/react';

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

const fireworkOptions = {
  mouse: { click: false, move: false },
  sound: { enabled: false },
  intensity: 50,
  traceSpeed: 3,
} as const;

export const GameOverOverlay = ({
  retryCount,
  onPlayAgain,
  onHome,
}: GameOverOverlayProps) => {
  const stars = starsFromRetries(retryCount);

  return (
    <div
      role="dialog"
      aria-label="Game complete"
      className="fixed inset-0 bg-background/80"
    >
      <Fireworks
        options={fireworkOptions}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
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
    </div>
  );
};

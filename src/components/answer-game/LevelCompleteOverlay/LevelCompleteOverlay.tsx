import { Fireworks } from '@fireworks-js/react';

interface LevelCompleteOverlayProps {
  level: number;
  onNextLevel: () => void;
  onDone: () => void;
}

const fireworkOptions = {
  mouse: { click: false, move: false },
  sound: { enabled: false },
  intensity: 30,
  traceSpeed: 3,
} as const;

export const LevelCompleteOverlay = ({
  level,
  onNextLevel,
  onDone,
}: LevelCompleteOverlayProps) => (
  <div
    role="dialog"
    aria-label={`Level ${level} complete`}
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

      <p className="text-4xl font-bold text-foreground">
        Level {level} Complete!
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onNextLevel}
          className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-md active:scale-95"
        >
          Next Level
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-muted px-8 py-4 text-lg font-bold active:scale-95"
        >
          I&apos;m Done
        </button>
      </div>
    </div>
  </div>
);

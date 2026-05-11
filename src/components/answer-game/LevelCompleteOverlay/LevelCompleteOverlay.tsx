import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface LevelCompleteOverlayProps {
  level: number;
  onNextLevel: () => void;
  onDone: () => void;
  /**
   * Belt-and-suspenders gate from the XState engine phase
   * (`engine.phase === 'levelComplete'`). The overlay's own render
   * condition already keys on this, but skin overrides that animate in
   * (fade/scale) may briefly render the button before the canonical
   * state; setting `disabled` here prevents premature ADVANCE_LEVEL
   * dispatch during the 750 ms roundComplete after-timer.
   *
   * Defaults to `true` for backward-compat with non-XState callers.
   */
  nextLevelEnabled?: boolean;
}

export const LevelCompleteOverlay = ({
  level,
  onNextLevel,
  onDone,
  nextLevelEnabled = true,
}: LevelCompleteOverlayProps) => {
  useEffect(() => {
    void confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      ticks: 310,
    });

    return () => {
      confetti.reset();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label={`Level ${level} complete`}
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-background/95"
    >
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
          disabled={!nextLevelEnabled}
          className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
};

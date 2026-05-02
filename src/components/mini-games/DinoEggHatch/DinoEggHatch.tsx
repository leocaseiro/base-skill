import confetti from 'canvas-confetti';
import { useEffect, useRef, useState } from 'react';

type Animal =
  | 'dino'
  | 'turtle'
  | 'chicken'
  | 'bunny'
  | 'chick'
  | 'duck';

interface DinoEggHatchProps {
  animal?: Animal | 'random';
  tapsToHatch?: number;
  onComplete?: () => void;
}

const ANIMALS: Record<Animal, { emoji: string; name: string }> = {
  dino: { emoji: '🦕', name: 'Dinosaur' },
  turtle: { emoji: '🐢', name: 'Turtle' },
  chicken: { emoji: '🐔', name: 'Chicken' },
  bunny: { emoji: '🐰', name: 'Bunny' },
  chick: { emoji: '🐥', name: 'Chick' },
  duck: { emoji: '🦆', name: 'Duck' },
};

const ANIMAL_KEYS = Object.keys(ANIMALS) as Animal[];

const getShakeClass = (stage: number): string => {
  if (stage === 1) return 'animate-[shake_1s_ease-in-out_infinite]';
  if (stage === 2) return 'animate-[shake_0.5s_ease-in-out_infinite]';
  if (stage >= 3) return 'animate-[shake_0.25s_ease-in-out_infinite]';
  return '';
};

const CrackSvg = ({ stage }: { stage: number }) => {
  if (stage === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={
        stage >= 3
          ? { filter: 'drop-shadow(0 0 12px gold)' }
          : undefined
      }
      viewBox="0 0 160 160"
      aria-hidden="true"
    >
      {stage >= 1 && (
        <line
          x1="80"
          y1="40"
          x2="60"
          y2="90"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {stage >= 2 && (
        <line
          x1="90"
          y1="50"
          x2="110"
          y2="100"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {stage >= 3 && (
        <line
          x1="70"
          y1="80"
          x2="95"
          y2="130"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

const getProgressColor = (pct: number): string => {
  if (pct < 25) return 'bg-gray-400';
  if (pct < 50) return 'bg-yellow-400';
  if (pct < 75) return 'bg-orange-400';
  return 'bg-red-500';
};

export const DinoEggHatch = ({
  animal = 'random',
  tapsToHatch = 20,
  onComplete,
}: DinoEggHatchProps) => {
  const [chosenAnimal] = useState<Animal>(() => {
    if (animal === 'random') {
      const index = Math.floor(Math.random() * ANIMAL_KEYS.length);
      return ANIMAL_KEYS[index] ?? 'dino';
    }
    return animal;
  });

  const [tapCount, setTapCount] = useState(0);
  const [hatched, setHatched] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const crackStage = Math.min(
    4,
    Math.floor(tapCount / (tapsToHatch / 4)),
  );
  const progressPct = Math.min(100, (tapCount / tapsToHatch) * 100);

  const handleTap = () => {
    if (hatched) return;

    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= tapsToHatch) {
        setHatched(true);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!hatched) return;

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

    const timer = globalThis.setTimeout(() => {
      onCompleteRef.current?.();
    }, 3000);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [hatched]);

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const animalData = ANIMALS[chosenAnimal];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-950 to-purple-950">
      {hatched ? (
        <div className="flex flex-col items-center">
          <div className="animate-pop text-[10rem] leading-none">
            {animalData.emoji}
          </div>
          <p className="mt-4 text-4xl font-bold text-white">
            {"It's a " + animalData.name + '!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Egg area */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tap the egg to hatch it"
            className={[
              'relative cursor-pointer select-none',
              crackStage >= 3
                ? 'ring-4 ring-yellow-400 ring-opacity-75 rounded-full'
                : '',
              getShakeClass(crackStage),
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleTap();
            }}
          >
            <span className="text-[10rem] leading-none">🥚</span>
            <CrackSvg stage={crackStage} />
          </div>

          {/* Prompt text */}
          <p
            className={[
              'text-2xl font-semibold text-white',
              crackStage >= 3 ? 'animate-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            Tap the egg!
          </p>

          {/* Progress bar */}
          <div className="h-4 w-64 overflow-hidden rounded-full bg-white/20">
            <div
              className={[
                'h-full rounded-full transition-all duration-150',
                getProgressColor(progressPct),
              ].join(' ')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

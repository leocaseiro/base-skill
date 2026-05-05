import confetti from 'canvas-confetti';
import { useEffect, useRef, useState } from 'react';

import { SpriteFrame } from './SpriteFrame';
import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  EGG_FRAMES,
  eggFrameForStage,
  stripUrl,
} from './sprites';
import type { Animal } from './sprites';

interface DinoEggHatchProps {
  animal?: Animal | 'random';
  tapsToHatch?: number;
  onComplete?: () => void;
}

const SPRITE_DISPLAY_W = 240;
const SPRITE_DISPLAY_H = 268;

/** Per-frame delay of the post-hatch animal animation (frames 0 -> 3). */
const HATCH_FRAME_INTERVAL_MS = 280;

const getShakeClass = (stage: number): string => {
  if (stage === 1) return 'animate-[shake_1s_ease-in-out_infinite]';
  if (stage === 2) return 'animate-[shake_0.5s_ease-in-out_infinite]';
  if (stage >= 3) return 'animate-[shake_0.25s_ease-in-out_infinite]';
  return '';
};

const getProgressColor = (pct: number): string => {
  if (pct < 25) return 'bg-gray-400';
  if (pct < 50) return 'bg-yellow-400';
  if (pct < 75) return 'bg-orange-400';
  return 'bg-red-500';
};

const cleanupConfetti = () => void confetti.reset();
const confettiEffect = () => cleanupConfetti;

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
  const [hatchFrame, setHatchFrame] = useState(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

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

  // Confetti + onComplete timer when the egg breaks.
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

  // Step the animal sprite from frame 0 -> ANIMAL_FRAMES-1 once after hatch.
  // No reset to 0 here — `hatchFrame` already starts at 0 and the component
  // is mounted fresh per game session.
  useEffect(() => {
    if (!hatched) return;

    const id = globalThis.setInterval(() => {
      setHatchFrame((prev) => {
        if (prev >= ANIMAL_FRAMES - 1) {
          globalThis.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, HATCH_FRAME_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(id);
    };
  }, [hatched]);

  useEffect(confettiEffect, []);

  const animalData = ANIMALS[chosenAnimal];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#900192]">
      {hatched ? (
        <div className="flex flex-col items-center">
          <SpriteFrame
            src={stripUrl(chosenAnimal)}
            totalFrames={ANIMAL_FRAMES}
            frameIndex={hatchFrame}
            displayWidth={SPRITE_DISPLAY_W}
            displayHeight={SPRITE_DISPLAY_H}
            className="animate-pop"
            alt={animalData.name}
          />
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
              'cursor-pointer select-none',
              crackStage >= 3
                ? 'rounded-full ring-4 ring-yellow-400 ring-opacity-75'
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
            <SpriteFrame
              src={stripUrl('egg')}
              totalFrames={EGG_FRAMES}
              frameIndex={eggFrameForStage(crackStage)}
              displayWidth={SPRITE_DISPLAY_W}
              displayHeight={SPRITE_DISPLAY_H}
              alt="Egg"
            />
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

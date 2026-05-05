import confetti from 'canvas-confetti';
import { useEffect, useRef, useState } from 'react';

import { SpriteFrame } from './SpriteFrame';
import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  EGG_FRAMES,
  PRE_HATCH_STAGES,
  spriteForPreHatchStage,
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

/**
 * Map the 0..PRE_HATCH_STAGES-1 click stage to a shake speed. Faster shakes
 * cue the player that the egg is closer to hatching. Stage 0 (intact egg)
 * stays still.
 */
const getShakeClass = (stage: number): string => {
  if (stage <= 0) return '';
  if (stage <= 2) return 'animate-[shake_1s_ease-in-out_infinite]';
  if (stage <= 4) return 'animate-[shake_0.5s_ease-in-out_infinite]';
  return 'animate-[shake_0.25s_ease-in-out_infinite]';
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

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Six clickable stages — egg frames 0-2, then animal peek frames 0-2.
  // Stage 6 = hatched (animal frame 3, the free-standing celebration pose).
  const tapStage = Math.min(
    PRE_HATCH_STAGES,
    Math.floor(tapCount / (tapsToHatch / PRE_HATCH_STAGES)),
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

  useEffect(confettiEffect, []);

  const animalData = ANIMALS[chosenAnimal];
  const preHatch = spriteForPreHatchStage(tapStage);
  const preHatchSrc =
    preHatch.phase === 'egg' ? stripUrl('egg') : stripUrl(chosenAnimal);
  const preHatchTotalFrames =
    preHatch.phase === 'egg' ? EGG_FRAMES : ANIMAL_FRAMES;
  const preHatchAlt =
    preHatch.phase === 'egg'
      ? 'Egg'
      : `${animalData.name} hatching out of the egg`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#900192]">
      {hatched ? (
        <div className="flex flex-col items-center">
          <SpriteFrame
            src={stripUrl(chosenAnimal)}
            totalFrames={ANIMAL_FRAMES}
            frameIndex={ANIMAL_FRAMES - 1}
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
          {/* Egg area — clickable through every pre-hatch stage. */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tap the egg to hatch it"
            className={[
              'cursor-pointer select-none',
              getShakeClass(tapStage),
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleTap();
            }}
          >
            <SpriteFrame
              src={preHatchSrc}
              totalFrames={preHatchTotalFrames}
              frameIndex={preHatch.frameIndex}
              displayWidth={SPRITE_DISPLAY_W}
              displayHeight={SPRITE_DISPLAY_H}
              alt={preHatchAlt}
            />
          </div>

          {/* Prompt text — pulses in the final two stages when the animal
              is already mostly out of the shell. */}
          <p
            className={[
              'text-2xl font-semibold text-white',
              tapStage >= PRE_HATCH_STAGES - 2 ? 'animate-pulse' : '',
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

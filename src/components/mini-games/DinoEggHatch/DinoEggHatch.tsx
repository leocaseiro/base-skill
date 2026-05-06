import confetti from 'canvas-confetti';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SpriteFrame } from './SpriteFrame';
import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  CELEBRATE_SOUND_URL,
  CRACK_SOUND_URL,
  EGG_FRAMES,
  PRE_HATCH_STAGES,
  getDisplayTweak,
  spriteForPreHatchStage,
  stripUrl,
  tweakToTransform,
} from './sprites';
import type { Animal, DisplayTweak } from './sprites';
import { createLowLatencySound } from '@/lib/audio/lowLatencySound';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

interface DinoEggHatchProps {
  animal?: Animal | 'random';
  tapsToHatch?: number;
  onComplete?: () => void;
  /**
   * Minimum ms between crack-sound plays. Higher values prevent buzz on
   * rapid taps but make some taps silent. 0 disables throttling.
   * Default: 60 (~16 plays/sec — above realistic finger speed).
   */
  crackThrottleMs?: number;
  /**
   * Max simultaneous crack-sound voices. Layered plays sound natural up
   * to this cap; further plays are dropped until a voice frees. Default: 4.
   */
  crackMaxConcurrent?: number;
  /** Crack-sound volume in [0, 1]. Default: 0.8. */
  crackVolume?: number;
  /** Celebration-sound volume in [0, 1]. Default: 0.9. */
  celebrateVolume?: number;
  /**
   * Force the reduced-motion code path on/off, ignoring the user's OS
   * setting. Leave `undefined` (default) to honour `prefers-reduced-motion`.
   * Useful for Storybook to preview the a11y branch without tweaking macOS
   * System Settings.
   */
  forceReducedMotion?: boolean;
  /**
   * Background CSS color for the game stage. Accepts any valid CSS color
   * (hex, rgb, named). Default `#900192`.
   */
  backgroundColor?: string;
  /**
   * Per-asset render-time tweak overrides — see `DISPLAY_TWEAKS` in
   * sprites.ts for the shipped defaults. Each value can be either a bare
   * `number` (treated as `scale`) or a `DisplayTweak` object with
   * `scale`/`x`/`y`. The override is merged on top of the static default,
   * so partial overrides (e.g. just `{ x: 5 }`) preserve the rest.
   */
  scaleOverrides?: Partial<
    Record<Animal | 'egg', number | DisplayTweak>
  >;
}

const SPRITE_DISPLAY_W = 240;
const SPRITE_DISPLAY_H = 268;

/**
 * Map the 0..PRE_HATCH_STAGES-1 click stage to a shake speed. Faster shakes
 * cue the player that the egg is closer to hatching. Stage 0 (intact egg)
 * stays still. When `reducedMotion` is true we drop continuous shake — it's
 * a known vestibular trigger and a documented photosensitive-epilepsy risk.
 */
const getShakeClass = (
  stage: number,
  reducedMotion: boolean,
): string => {
  if (reducedMotion) return '';
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

export const DinoEggHatch = ({
  animal = 'random',
  tapsToHatch = 20,
  onComplete,
  crackThrottleMs = 60,
  crackMaxConcurrent = 4,
  crackVolume = 0.8,
  celebrateVolume = 0.9,
  forceReducedMotion,
  backgroundColor = '#900192',
  scaleOverrides,
}: DinoEggHatchProps) => {
  const systemReducedMotion = usePrefersReducedMotion();
  const reducedMotion = forceReducedMotion ?? systemReducedMotion;

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

  // Pre-decoded Web Audio sources. HTMLAudioElement adds 100-300ms decode
  // latency on Android per play; AudioBuffer playback fires on the next
  // sample. Throttle + maxConcurrent prevent buzz on held/rapid clicks.
  const crackSound = useMemo(
    () =>
      createLowLatencySound(CRACK_SOUND_URL, {
        throttleMs: crackThrottleMs,
        maxConcurrent: crackMaxConcurrent,
        volume: crackVolume,
      }),
    [crackThrottleMs, crackMaxConcurrent, crackVolume],
  );
  const celebrateSound = useMemo(
    () =>
      createLowLatencySound(CELEBRATE_SOUND_URL, {
        volume: celebrateVolume,
      }),
    [celebrateVolume],
  );

  // Preload both sounds and the chosen animal sprite immediately. The egg
  // sprite is shown first so the browser already has it; the animal strip
  // is what causes the perceived stall after stage 3 if it isn't warm.
  useEffect(() => {
    void crackSound.preload();
    void celebrateSound.preload();
    const img = new Image();
    img.src = stripUrl(chosenAnimal);
  }, [chosenAnimal, crackSound, celebrateSound]);

  const tapStage = Math.min(
    PRE_HATCH_STAGES,
    Math.floor(tapCount / (tapsToHatch / PRE_HATCH_STAGES)),
  );
  const progressPct = Math.min(100, (tapCount / tapsToHatch) * 100);

  const handleTap = () => {
    if (hatched) return;

    crackSound.play();

    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= tapsToHatch) {
        setHatched(true);
      }
      return next;
    });
  };

  // Confetti + celebrate sound + onComplete timer when the egg breaks.
  // Reduced-motion: skip the particle burst (it's a large repeating motion
  // pattern) but keep the audio so the moment still feels rewarding.
  useEffect(() => {
    if (!hatched) return;

    celebrateSound.play();

    if (!reducedMotion) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }

    const timer = globalThis.setTimeout(() => {
      onCompleteRef.current?.();
    }, 3000);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [hatched, reducedMotion, celebrateSound]);

  useEffect(() => () => void confetti.reset(), []);

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
  // Display-time CSS transform per asset. Resolution order:
  //   scaleOverrides[key].* → DISPLAY_TWEAKS[key].* → no transform
  // Edit DISPLAY_TWEAKS in sprites.ts to set defaults; pass scaleOverrides
  // (e.g. from a Storybook control) to preview different values.
  const resolveTweak = (key: Animal | 'egg') => {
    const baseTweak = getDisplayTweak(key);
    const override = scaleOverrides?.[key];
    if (override === undefined) return baseTweak;
    return typeof override === 'number'
      ? { ...baseTweak, scale: override }
      : { ...baseTweak, ...override };
  };
  const animalTransform = tweakToTransform(resolveTweak(chosenAnimal));
  const eggTransform = tweakToTransform(resolveTweak('egg'));
  const animalScaleStyle = animalTransform
    ? { transform: animalTransform }
    : undefined;
  const eggScaleStyle = eggTransform
    ? { transform: eggTransform }
    : undefined;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor }}
    >
      <div
        className={[
          'absolute left-1/2 top-1/2',
          hatched && !reducedMotion ? 'animate-sunburst-spin' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          background:
            'repeating-conic-gradient(from 212deg, #7e48c0 0deg 11.25deg, #bf8cff 11.25deg 22.5deg)',
          width: '300vmax',
          height: '300vmax',
          translate: '-50% -50%',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, #7e48c0cc 70%)',
          boxShadow: 'inset 0 0 120px 60px rgba(0,0,0,0.7)',
        }}
        aria-hidden="true"
      />
      {hatched ? (
        <div className="relative z-10 flex flex-col items-center">
          <div style={animalScaleStyle}>
            <SpriteFrame
              src={stripUrl(chosenAnimal)}
              totalFrames={ANIMAL_FRAMES}
              frameIndex={ANIMAL_FRAMES - 1}
              displayWidth={SPRITE_DISPLAY_W}
              displayHeight={SPRITE_DISPLAY_H}
              className={reducedMotion ? '' : 'animate-pop'}
              alt={animalData.name}
            />
          </div>
          <p
            className="mt-4 text-4xl font-bold text-white"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
          >
            {"It's a " + animalData.name + '!'}
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Egg area — clickable through every pre-hatch stage. */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tap the egg to hatch it"
            className={[
              'cursor-pointer select-none',
              getShakeClass(tapStage, reducedMotion),
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleTap();
            }}
          >
            <div
              style={
                preHatch.phase === 'animal'
                  ? animalScaleStyle
                  : eggScaleStyle
              }
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
          </div>

          {/* Prompt text — pulses in the final two stages when the animal
              is already mostly out of the shell. Pulse is gentle opacity
              fade, safe under prefers-reduced-motion. */}
          <p
            className={[
              'text-2xl font-semibold text-white',
              tapStage >= PRE_HATCH_STAGES - 2 && !reducedMotion
                ? 'animate-pulse'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
          >
            Tap the egg!
          </p>

          {/* Progress bar */}
          <div className="h-4 w-64 overflow-hidden rounded-full bg-black/40 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
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

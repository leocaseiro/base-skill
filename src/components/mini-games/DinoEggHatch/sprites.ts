/**
 * Sprite metadata for the egg-hatching mini-game.
 *
 * Source assets live under `public/sprites/egg-hatch/strips/` and are
 * generated from the painterly 3D sprite sheets in
 * `base-skill-resources/sprite-egg-hatching/` via
 * `scripts/sprite-build-atlas.py` (in worktree `claude/sleepy-hoover-a1ebdb`).
 *
 * Strip layout (per file):
 * - egg.png:    3 frames horizontal — intact, light crack, heavy crack
 * - <animal>:   4 frames horizontal — peeking, half-out, mostly-out, free
 *
 * Frame size in the asset: 480x535 (2x retina-friendly, downscaled from
 * native 600x669; pngquant'd lossy to ~200KB per strip).
 */

export const SPRITE_BASE = '/sprites/egg-hatch/strips';

export const EGG_FRAMES = 3;
export const ANIMAL_FRAMES = 4;

/** Native frame dimensions inside each strip PNG. */
export const FRAME_NATIVE_W = 480;
export const FRAME_NATIVE_H = 535;

export type Animal =
  | 'crocodile'
  | 'dino'
  | 'dragon-female'
  | 'dragon-male'
  | 'duck'
  | 'echidna'
  | 'owl'
  | 'parrot'
  | 'penguin'
  | 'pink-bird'
  | 'platypus'
  | 'snake'
  | 't-rex'
  | 'tortoise'
  | 'triceratops'
  | 'turtle'
  | 'yellow-bird'
  | 'blue-bird'
  | 'emu';

export const ANIMALS: Record<Animal, { name: string }> = {
  crocodile: { name: 'Crocodile' },
  dino: { name: 'Dinosaur' },
  'dragon-female': { name: 'Pink Dragon' },
  'dragon-male': { name: 'Green Dragon' },
  duck: { name: 'Duck' },
  echidna: { name: 'Echidna' },
  owl: { name: 'Owl' },
  parrot: { name: 'Parrot' },
  penguin: { name: 'Penguin' },
  'pink-bird': { name: 'Pink Bird' },
  platypus: { name: 'Platypus' },
  snake: { name: 'Snake' },
  't-rex': { name: 'T-Rex' },
  tortoise: { name: 'Tortoise' },
  triceratops: { name: 'Triceratops' },
  turtle: { name: 'Turtle' },
  'yellow-bird': { name: 'Chick' },
  'blue-bird': { name: 'Blue Bird' },
  emu: { name: 'Emu' },
};

export const ANIMAL_KEYS = Object.keys(ANIMALS) as Animal[];

/**
 * Total clickable stages before the egg hatches:
 *
 *   0 -> egg.png      frame 0 (intact)
 *   1 -> egg.png      frame 1 (hairline crack)
 *   2 -> egg.png      frame 2 (heavy crack)
 *   3 -> <animal>.png frame 0 (peeking)
 *   4 -> <animal>.png frame 1 (half-out)
 *   5 -> <animal>.png frame 2 (mostly-out)
 *
 * Stage 6 == hatched, where <animal>.png frame 3 (free standing) is shown
 * as a non-clickable celebration pose.
 */
export const PRE_HATCH_STAGES = EGG_FRAMES + (ANIMAL_FRAMES - 1);

export type SpritePhase = 'egg' | 'animal';

export interface PreHatchSprite {
  phase: SpritePhase;
  frameIndex: number;
}

/**
 * Map a 0..PRE_HATCH_STAGES-1 stage onto its sprite source + frame.
 *
 * Out-of-range stages clamp to the nearest valid value: negative stages
 * resolve to the intact egg (phase egg, frame 0); stages at or beyond
 * PRE_HATCH_STAGES resolve to the last clickable animal frame (phase
 * animal, frame 2). The hatched celebration frame (animal frame 3) is
 * not produced here — see DinoEggHatch's hatched branch.
 */
export const spriteForPreHatchStage = (
  stage: number,
): PreHatchSprite => {
  const clamped = Math.max(0, Math.min(PRE_HATCH_STAGES - 1, stage));
  if (clamped < EGG_FRAMES) {
    return { phase: 'egg', frameIndex: clamped };
  }
  return { phase: 'animal', frameIndex: clamped - EGG_FRAMES };
};

export const stripUrl = (name: Animal | 'egg'): string =>
  `${SPRITE_BASE}/${name}.png`;

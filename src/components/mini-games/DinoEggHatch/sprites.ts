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
 * Map a 0..3 crack stage to an egg sprite frame index (0..2).
 *
 * - Stage 0 (no taps yet)        -> frame 0 (intact)
 * - Stage 1 (light crack)         -> frame 1 (hairline crack)
 * - Stage 2 or 3 (heavy crack)    -> frame 2 (heavy jagged crack)
 *
 * The egg sequence ends at frame 2; from there the animal sprite plays.
 */
export const eggFrameForStage = (stage: number): number => {
  if (stage <= 0) return 0;
  if (stage === 1) return 1;
  return EGG_FRAMES - 1;
};

export const stripUrl = (name: Animal | 'egg'): string =>
  `${SPRITE_BASE}/${name}.png`;

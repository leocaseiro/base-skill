import { describe, expect, it } from 'vitest';

import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  EGG_FRAMES,
  SPRITE_BASE,
  eggFrameForStage,
  stripUrl,
} from './sprites';

describe('eggFrameForStage', () => {
  it('returns intact egg (frame 0) for stage 0 and below', () => {
    expect(eggFrameForStage(0)).toBe(0);
    expect(eggFrameForStage(-1)).toBe(0);
  });

  it('returns light crack (frame 1) for stage 1', () => {
    expect(eggFrameForStage(1)).toBe(1);
  });

  it('returns heavy crack (frame 2) for stages 2 and above', () => {
    expect(eggFrameForStage(2)).toBe(2);
    expect(eggFrameForStage(3)).toBe(2);
    expect(eggFrameForStage(99)).toBe(2);
  });

  it('never exceeds the available egg frames', () => {
    for (let stage = -5; stage <= 10; stage++) {
      expect(eggFrameForStage(stage)).toBeLessThan(EGG_FRAMES);
      expect(eggFrameForStage(stage)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('stripUrl', () => {
  it('builds a public path under /sprites/egg-hatch/strips/', () => {
    expect(stripUrl('egg')).toBe(`${SPRITE_BASE}/egg.png`);
    expect(stripUrl('owl')).toBe(`${SPRITE_BASE}/owl.png`);
    expect(stripUrl('t-rex')).toBe(`${SPRITE_BASE}/t-rex.png`);
  });
});

describe('ANIMALS catalogue', () => {
  it('has a display name for every animal key', () => {
    for (const key of ANIMAL_KEYS) {
      expect(ANIMALS[key]).toBeDefined();
      expect(ANIMALS[key].name).toMatch(/\S/);
    }
  });

  it('has 4 frames per animal (matching the asset strip layout)', () => {
    expect(ANIMAL_FRAMES).toBe(4);
  });
});

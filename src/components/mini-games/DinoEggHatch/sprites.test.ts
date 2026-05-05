import { describe, expect, it } from 'vitest';

import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  CRACK_SOUND_URL,
  EGG_FRAMES,
  PRE_HATCH_STAGES,
  SOUND_BASE,
  SPRITE_BASE,
  spriteForPreHatchStage,
  stripUrl,
} from './sprites';

describe('PRE_HATCH_STAGES', () => {
  it('covers every clickable frame: 3 egg + (4 animal - 1 celebration) = 6', () => {
    expect(PRE_HATCH_STAGES).toBe(EGG_FRAMES + (ANIMAL_FRAMES - 1));
    expect(PRE_HATCH_STAGES).toBe(6);
  });
});

describe('spriteForPreHatchStage', () => {
  it('returns egg frames for stages 0, 1, 2', () => {
    expect(spriteForPreHatchStage(0)).toEqual({
      phase: 'egg',
      frameIndex: 0,
    });
    expect(spriteForPreHatchStage(1)).toEqual({
      phase: 'egg',
      frameIndex: 1,
    });
    expect(spriteForPreHatchStage(2)).toEqual({
      phase: 'egg',
      frameIndex: 2,
    });
  });

  it('returns animal peek frames for stages 3, 4, 5', () => {
    expect(spriteForPreHatchStage(3)).toEqual({
      phase: 'animal',
      frameIndex: 0,
    });
    expect(spriteForPreHatchStage(4)).toEqual({
      phase: 'animal',
      frameIndex: 1,
    });
    expect(spriteForPreHatchStage(5)).toEqual({
      phase: 'animal',
      frameIndex: 2,
    });
  });

  it('never produces the celebration frame (animal frame 3)', () => {
    for (let stage = -5; stage <= 20; stage++) {
      const result = spriteForPreHatchStage(stage);
      if (result.phase === 'animal') {
        expect(result.frameIndex).toBeLessThan(ANIMAL_FRAMES - 1);
      }
    }
  });

  it('clamps below the range to the intact egg (phase egg, frame 0)', () => {
    expect(spriteForPreHatchStage(-1)).toEqual({
      phase: 'egg',
      frameIndex: 0,
    });
    expect(spriteForPreHatchStage(-99)).toEqual({
      phase: 'egg',
      frameIndex: 0,
    });
  });

  it('clamps above the range to the last clickable animal frame', () => {
    expect(spriteForPreHatchStage(PRE_HATCH_STAGES)).toEqual({
      phase: 'animal',
      frameIndex: 2,
    });
    expect(spriteForPreHatchStage(99)).toEqual({
      phase: 'animal',
      frameIndex: 2,
    });
  });

  it('returns frame indices within the source strip in every case', () => {
    for (let stage = -5; stage <= 20; stage++) {
      const { phase, frameIndex } = spriteForPreHatchStage(stage);
      const max = phase === 'egg' ? EGG_FRAMES : ANIMAL_FRAMES;
      expect(frameIndex).toBeGreaterThanOrEqual(0);
      expect(frameIndex).toBeLessThan(max);
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

describe('sound URLs', () => {
  it('points SOUND_BASE at the shared /sounds/ folder', () => {
    expect(SOUND_BASE).toMatch(/\/sounds$/);
    expect(SOUND_BASE).not.toMatch(/sprites\/egg-hatch/);
  });

  it('exposes CRACK_SOUND_URL pointing at crack.mp3 under SOUND_BASE', () => {
    expect(CRACK_SOUND_URL).toBe(`${SOUND_BASE}/crack.mp3`);
  });
});

describe('ANIMALS catalogue', () => {
  it('has a display name for every animal key', () => {
    for (const key of ANIMAL_KEYS) {
      expect(ANIMALS[key]).toBeDefined();
      expect(ANIMALS[key].name).toMatch(/\S/);
    }
  });
});

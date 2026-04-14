import { describe, expect, it } from 'vitest';
import { DEFAULT_SKIN_TIMING, resolveTiming } from './resolve-timing';
import type { GameSkin } from './game-skin';

const bareSkin: GameSkin = {
  id: 'bare',
  name: 'Bare',
  tokens: {},
};

describe('resolveTiming', () => {
  it('returns the default when skin and config provide nothing', () => {
    expect(resolveTiming('roundAdvanceDelay', bareSkin)).toBe(750);
    expect(resolveTiming('autoEjectDelay', bareSkin)).toBe(1000);
    expect(resolveTiming('levelCompleteDelay', bareSkin)).toBe(750);
  });

  it('uses the skin value when provided', () => {
    const skin: GameSkin = {
      ...bareSkin,
      timing: { roundAdvanceDelay: 1200 },
    };
    expect(resolveTiming('roundAdvanceDelay', skin)).toBe(1200);
    expect(resolveTiming('autoEjectDelay', skin)).toBe(1000);
  });

  it('config timing overrides skin timing', () => {
    const skin: GameSkin = {
      ...bareSkin,
      timing: { roundAdvanceDelay: 1200 },
    };
    const value = resolveTiming('roundAdvanceDelay', skin, {
      roundAdvanceDelay: 2000,
    });
    expect(value).toBe(2000);
  });

  it('DEFAULT_SKIN_TIMING is exported with expected shape', () => {
    expect(DEFAULT_SKIN_TIMING).toEqual({
      roundAdvanceDelay: 750,
      autoEjectDelay: 1000,
      levelCompleteDelay: 750,
    });
  });
});

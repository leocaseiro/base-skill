import { describe, expect, it } from 'vitest';
import { resolveHudFlags } from './resolve-hud-flags';

describe('resolveHudFlags', () => {
  it('returns dots + fraction + no level for classic mode with no config', () => {
    expect(resolveHudFlags(undefined, false)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: false,
    });
  });

  it('returns dots + level + no fraction for level mode with no config', () => {
    expect(resolveHudFlags(undefined, true)).toEqual({
      showDots: true,
      showFraction: false,
      showLevel: true,
    });
  });

  it('merges partial config on top of classic defaults', () => {
    expect(resolveHudFlags({ showLevel: true }, false)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: true,
    });
  });

  it('merges partial config on top of level-mode defaults', () => {
    expect(resolveHudFlags({ showFraction: true }, true)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: true,
    });
  });

  it('respects explicit false to disable a default-on flag', () => {
    expect(resolveHudFlags({ showDots: false }, false)).toEqual({
      showDots: false,
      showFraction: true,
      showLevel: false,
    });
  });

  it('returns all false when every flag is explicitly off', () => {
    expect(
      resolveHudFlags(
        { showDots: false, showFraction: false, showLevel: false },
        false,
      ),
    ).toEqual({
      showDots: false,
      showFraction: false,
      showLevel: false,
    });
  });
});

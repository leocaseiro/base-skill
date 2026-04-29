import { describe, expect, it } from 'vitest';
import { toWordSpellRound } from './adapters';
import type { WordHit } from './types';

describe('toWordSpellRound', () => {
  const base: WordHit = {
    word: 'cat',
    region: 'aus',
    level: 2,
    syllableCount: 1,
    provenance: 'shipped',
  };

  it('uses the raw word even when syllables are present', () => {
    const round = toWordSpellRound({
      ...base,
      word: 'sunset',
      syllables: ['sun', 'set'],
      syllableCount: 2,
    });
    expect(round.word).toBe('sunset');
  });

  it('uses the raw word when no syllables are present', () => {
    expect(toWordSpellRound(base).word).toBe('cat');
  });

  it('does not hyphenate multi-syllable words like "magic" or "liquid"', () => {
    expect(
      toWordSpellRound({
        ...base,
        word: 'magic',
        syllables: ['mag', 'ic'],
        syllableCount: 2,
      }).word,
    ).toBe('magic');
    expect(
      toWordSpellRound({
        ...base,
        word: 'liquid',
        syllables: ['liq', 'uid'],
        syllableCount: 2,
      }).word,
    ).toBe('liquid');
  });
});

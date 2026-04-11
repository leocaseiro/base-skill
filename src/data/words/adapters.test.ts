import { describe, expect, it } from 'vitest';
import { toWordSpellRound } from './adapters';
import type { WordHit } from './types';

describe('toWordSpellRound', () => {
  const base: WordHit = {
    word: 'cat',
    region: 'aus',
    level: 2,
    syllableCount: 1,
  };

  it('uses syllables joined by - when present', () => {
    const round = toWordSpellRound({
      ...base,
      word: 'sunset',
      syllables: ['sun', 'set'],
      syllableCount: 2,
    });
    expect(round.word).toBe('sun-set');
  });

  it('falls back to raw word when no syllables', () => {
    expect(toWordSpellRound(base).word).toBe('cat');
  });
});

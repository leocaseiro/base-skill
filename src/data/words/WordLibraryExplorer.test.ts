import { describe, expect, it } from 'vitest';
import {
  collectGraphemePairs,
  collectGraphemeStrings,
  collectPhonemeStrings,
} from './WordLibraryExplorer';
import type { WordHit } from './types';

const cat: WordHit = {
  word: 'cat',
  region: 'aus',
  level: 2,
  syllableCount: 1,
  graphemes: [
    { g: 'c', p: 'k' },
    { g: 'a', p: 'æ' },
    { g: 't', p: 't' },
  ],
};

const cell: WordHit = {
  word: 'cell',
  region: 'aus',
  level: 4,
  syllableCount: 1,
  graphemes: [
    { g: 'c', p: 's' },
    { g: 'e', p: 'e' },
    { g: 'l', p: 'l' },
    { g: 'l', p: 'l' },
  ],
};

const noGraphemes: WordHit = {
  word: 'mystery',
  region: 'aus',
  level: 5,
  syllableCount: 3,
};

describe('collectGraphemePairs', () => {
  it('returns deduped, sorted (g,p) tuples across hits', () => {
    const out = collectGraphemePairs([cat, cell, noGraphemes]);
    const labels = out.map((p) => p.label);
    expect(labels).toContain('c[k]');
    expect(labels).toContain('c[s]');
    expect(labels).toContain('a[æ]');
    expect(labels).toContain('e[e]');
    expect(labels).toContain('l[l]');
    expect(labels).toContain('t[t]');
    expect(new Set(labels).size).toBe(labels.length);
    const sorted = [...labels].toSorted((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });

  it('skips hits with no graphemes', () => {
    expect(collectGraphemePairs([noGraphemes])).toEqual([]);
  });
});

describe('collectGraphemeStrings', () => {
  it('returns deduped, sorted grapheme orthographies', () => {
    const out = collectGraphemeStrings([cat, cell]);
    expect(out).toEqual(['a', 'c', 'e', 'l', 't']);
  });
});

describe('collectPhonemeStrings', () => {
  it('returns deduped, sorted phonemes', () => {
    const out = collectPhonemeStrings([cat, cell]);
    expect(out).toContain('k');
    expect(out).toContain('s');
    expect(out).toContain('æ');
    expect(out).toContain('l');
    expect(out).toContain('e');
    expect(out).toContain('t');
    expect(new Set(out).size).toBe(out.length);
  });
});

import { describe, expect, it } from 'vitest';
import {
  collectGraphemePairs,
  collectGraphemeStrings,
  collectPhonemeStrings,
  matchesWordPrefix,
  pageRange,
  paginate,
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
  provenance: 'shipped',
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
  provenance: 'shipped',
};

const noGraphemes: WordHit = {
  word: 'mystery',
  region: 'aus',
  level: 5,
  syllableCount: 3,
  provenance: 'shipped',
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

describe('matchesWordPrefix', () => {
  it('returns true when prefix is empty', () => {
    expect(matchesWordPrefix(cat, '')).toBe(true);
  });

  it('returns true when prefix is only whitespace', () => {
    expect(matchesWordPrefix(cat, '   ')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesWordPrefix(cat, 'CA')).toBe(true);
    expect(matchesWordPrefix(cat, 'Ca')).toBe(true);
    expect(matchesWordPrefix(cat, 'ca')).toBe(true);
  });

  it('matches only at the start of the word', () => {
    expect(matchesWordPrefix(cat, 'c')).toBe(true);
    expect(matchesWordPrefix(cat, 'at')).toBe(false);
    expect(matchesWordPrefix(cat, 't')).toBe(false);
  });

  it('returns false when the word does not start with the prefix', () => {
    expect(matchesWordPrefix(cell, 'cat')).toBe(false);
  });

  it('returns true when the prefix equals the whole word', () => {
    expect(matchesWordPrefix(cat, 'cat')).toBe(true);
  });

  it('returns false when the prefix is longer than the word', () => {
    expect(matchesWordPrefix(cat, 'cats')).toBe(false);
  });
});

describe('paginate', () => {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  it('returns the first page slice', () => {
    expect(paginate(items, 1, 4)).toEqual([0, 1, 2, 3]);
  });

  it('returns a middle page slice', () => {
    expect(paginate(items, 2, 4)).toEqual([4, 5, 6, 7]);
  });

  it('returns the last (partial) page slice', () => {
    expect(paginate(items, 3, 4)).toEqual([8, 9]);
  });

  it('returns an empty slice when the page is past the end', () => {
    expect(paginate(items, 10, 4)).toEqual([]);
  });

  it('returns the whole list when pageSize exceeds total', () => {
    expect(paginate(items, 1, 100)).toEqual(items);
  });

  it('returns an empty slice for non-positive pageSize', () => {
    expect(paginate(items, 1, 0)).toEqual([]);
  });
});

describe('pageRange', () => {
  it('returns [1] for total of 1 or less', () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(1, 0)).toEqual([1]);
  });

  it('returns every page when total is 7 or fewer', () => {
    expect(pageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('elides with a leading ellipsis near the end', () => {
    expect(pageRange(10, 12)).toEqual([
      1,
      'ellipsis-left',
      9,
      10,
      11,
      12,
    ]);
  });

  it('elides with a trailing ellipsis near the start', () => {
    expect(pageRange(2, 12)).toEqual([1, 2, 3, 'ellipsis-right', 12]);
  });

  it('elides with ellipses on both sides when current is in the middle', () => {
    expect(pageRange(6, 12)).toEqual([
      1,
      'ellipsis-left',
      5,
      6,
      7,
      'ellipsis-right',
      12,
    ]);
  });
});

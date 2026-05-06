import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetChunkCacheForTests,
  entryMatches,
  filterWords,
  isLevelInFilter,
  loadShippedWordLevels,
} from './filter';
import type { WordHit } from './types';

const hit = (overrides: Partial<WordHit> = {}): WordHit => ({
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
  ...overrides,
});

describe('entryMatches', () => {
  it('matches by exact level', () => {
    expect(entryMatches(hit(), { region: 'aus', level: 2 })).toBe(true);
    expect(entryMatches(hit(), { region: 'aus', level: 3 })).toBe(
      false,
    );
  });

  it('matches by levels[]', () => {
    expect(
      entryMatches(hit(), { region: 'aus', levels: [1, 2, 3] }),
    ).toBe(true);
    expect(entryMatches(hit(), { region: 'aus', levels: [4, 5] })).toBe(
      false,
    );
  });

  it('matches by levelRange', () => {
    expect(
      entryMatches(hit(), { region: 'aus', levelRange: [1, 3] }),
    ).toBe(true);
    expect(
      entryMatches(hit(), { region: 'aus', levelRange: [3, 5] }),
    ).toBe(false);
  });

  it('matches syllableCountEq and syllableCountRange', () => {
    expect(
      entryMatches(hit(), { region: 'aus', syllableCountEq: 1 }),
    ).toBe(true);
    expect(
      entryMatches(hit({ syllableCount: 3 }), {
        region: 'aus',
        syllableCountRange: [2, 4],
      }),
    ).toBe(true);
  });

  it('graphemesAllowed: passes only when every grapheme pair is in the set', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        // missing { g: 't', p: 't' }
        graphemesAllowed: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
        ],
      }),
    ).toBe(false);
  });

  it('graphemesAllowed: rejects when grapheme matches but phoneme differs', () => {
    // city: c/s, i/ɪ, t/t, y/i — has 'c' but as /s/, not /k/
    const city: WordHit = {
      word: 'city',
      region: 'aus',
      level: 4,
      syllableCount: 2,
      graphemes: [
        { g: 'c', p: 's' },
        { g: 'i', p: 'ɪ' },
        { g: 't', p: 't' },
        { g: 'y', p: 'i' },
      ],
      provenance: 'shipped',
    };
    // Allowing c/k does NOT cover c/s — city must be excluded
    expect(
      entryMatches(city, {
        region: 'aus',
        graphemesAllowed: [
          { g: 'c', p: 'k' },
          { g: 'i', p: 'ɪ' },
          { g: 't', p: 't' },
          { g: 'y', p: 'i' },
        ],
      }),
    ).toBe(false);
  });

  it('graphemesRequired: passes when at least one required pair is present', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [{ g: 'c', p: 'k' }],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [{ g: 'sh', p: 'ʃ' }],
      }),
    ).toBe(false);
  });

  it('graphemesRequired: rejects when grapheme matches but phoneme differs', () => {
    // cat has c/k — requiring c/s (soft-c) must not match
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [{ g: 'c', p: 's' }],
      }),
    ).toBe(false);
  });

  it('empty graphemesRequired/graphemesAllowed arrays do not reject words', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: [],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [],
        graphemesAllowed: [],
      }),
    ).toBe(true);
  });

  it('phonemesAllowed + Required: "c making /k/" case', () => {
    // cat: c/k, a/æ, t/t
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: [{ g: 'c', p: 'k' }],
        phonemesRequired: ['k'],
      }),
    ).toBe(true);

    // city: c/s, i/ɪ, t/t, y/i — has 'c' but no /k/
    const city: WordHit = {
      word: 'city',
      region: 'aus',
      level: 4,
      syllableCount: 2,
      graphemes: [
        { g: 'c', p: 's' },
        { g: 'i', p: 'ɪ' },
        { g: 't', p: 't' },
        { g: 'y', p: 'i' },
      ],
      provenance: 'shipped',
    };
    expect(
      entryMatches(city, {
        region: 'aus',
        graphemesRequired: [{ g: 'c', p: 'k' }],
        phonemesRequired: ['k'],
      }),
    ).toBe(false);
  });

  it('excludes Tier-1-only words from Tier-2 filters', () => {
    const tier1: WordHit = {
      word: 'cat',
      region: 'aus',
      level: 2,
      syllableCount: 1,
      provenance: 'shipped',
      // no graphemes
    };
    expect(
      entryMatches(tier1, {
        region: 'aus',
        graphemesAllowed: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      }),
    ).toBe(false);
    expect(entryMatches(tier1, { region: 'aus', level: 2 })).toBe(true);
  });

  it('hasVisual: passes when emoji is set and hasVisual is true', () => {
    expect(
      entryMatches(hit({ emoji: '🐱' }), {
        region: 'aus',
        hasVisual: true,
      }),
    ).toBe(true);
  });

  it('hasVisual: passes when image is set and hasVisual is true', () => {
    expect(
      entryMatches(hit({ image: '/img/cat.svg' }), {
        region: 'aus',
        hasVisual: true,
      }),
    ).toBe(true);
  });

  it('hasVisual: rejects when neither emoji nor image is set', () => {
    expect(
      entryMatches(hit(), { region: 'aus', hasVisual: true }),
    ).toBe(false);
  });

  it('hasVisual: omitted → no visual filtering', () => {
    expect(entryMatches(hit(), { region: 'aus' })).toBe(true);
  });
});

describe('filterWords (integration against seeded chunks)', () => {
  beforeEach(() => __resetChunkCacheForTests());
  afterEach(() => __resetChunkCacheForTests());

  it('returns AUS level 1 hits', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits.length).toBeGreaterThan(0);
    for (const h of result.hits) {
      expect(h.level).toBe(1);
      expect(h.region).toBe('aus');
    }
    expect(result.usedFallback).toBeUndefined();
  });

  it('joins WordCore + CurriculumEntry (hit has syllableCount)', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits[0]!.syllableCount).toBeGreaterThanOrEqual(1);
  });

  it('propagates emoji from curriculum entry into WordHit', async () => {
    const result = await filterWords({
      region: 'aus',
      hasVisual: true,
    });
    const cat = result.hits.find((h) => h.word === 'cat');
    expect(cat).toBeDefined();
    expect(cat!.emoji).toBe('🐱');
  });

  it('Tier-2 filter excludes Tier-1-only words', async () => {
    const { GRAPHEMES_BY_LEVEL, cumulativeGraphemes } =
      await import('./levels');
    const allowedPairs = cumulativeGraphemes(2);
    const result = await filterWords({
      region: 'aus',
      levels: [1, 2],
      graphemesAllowed: allowedPairs,
    });
    const allowedKeys = new Set(
      allowedPairs.map((u) => `${u.g}|${u.p}`),
    );
    for (const h of result.hits) {
      for (const g of h.graphemes ?? []) {
        expect(allowedKeys.has(`${g.g}|${g.p}`)).toBe(true);
      }
    }
    // Sanity-check: the allowed set includes the L1+L2 graphemes
    const allGs = new Set(allowedPairs.map((u) => u.g));
    for (const g of GRAPHEMES_BY_LEVEL[1] ?? []) {
      expect(allGs.has(g.g)).toBe(true);
    }
  });

  it('falls back to AUS when UK has no data', async () => {
    const result = await filterWords({ region: 'uk', level: 1 });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.usedFallback).toEqual({ from: 'uk', to: 'aus' });
  });

  it('respects fallbackToAus: false', async () => {
    const result = await filterWords({
      region: 'uk',
      level: 1,
      fallbackToAus: false,
    });
    expect(result.hits).toHaveLength(0);
    expect(result.usedFallback).toBeUndefined();
  });
});

describe('isLevelInFilter', () => {
  it('returns true when no level filter is set', () => {
    expect(isLevelInFilter({ region: 'aus' }, 8)).toBe(true);
  });

  it('respects the exact `level` field', () => {
    expect(isLevelInFilter({ region: 'aus', level: 8 }, 8)).toBe(true);
    expect(isLevelInFilter({ region: 'aus', level: 1 }, 8)).toBe(false);
  });

  it('respects the `levels[]` field', () => {
    expect(
      isLevelInFilter({ region: 'aus', levels: [1, 2, 8] }, 8),
    ).toBe(true);
    expect(isLevelInFilter({ region: 'aus', levels: [1, 2] }, 8)).toBe(
      false,
    );
  });

  it('respects the `levelRange` field', () => {
    expect(
      isLevelInFilter({ region: 'aus', levelRange: [6, 8] }, 8),
    ).toBe(true);
    expect(
      isLevelInFilter({ region: 'aus', levelRange: [1, 3] }, 8),
    ).toBe(false);
  });
});

describe('loadShippedWordLevels', () => {
  beforeEach(() => __resetChunkCacheForTests());
  afterEach(() => __resetChunkCacheForTests());

  it('returns a word → level map for the region', async () => {
    const map = await loadShippedWordLevels('aus');
    expect(map.size).toBeGreaterThan(0);
    for (const level of map.values()) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(8);
    }
  });

  it('uses the lowest level for words that appear in multiple levels', async () => {
    const map = await loadShippedWordLevels('aus');
    const level1Result = await filterWords({ region: 'aus', level: 1 });
    for (const entry of level1Result.hits) {
      expect(map.get(entry.word)).toBe(1);
    }
  });

  it('returns a level outside the filter when the filter excludes it', async () => {
    const map = await loadShippedWordLevels('aus');
    const level1Result = await filterWords({ region: 'aus', level: 1 });
    const level1Words = new Set(level1Result.hits.map((h) => h.word));
    const outside = [...map.entries()].find(
      ([word, lvl]) => lvl > 1 && !level1Words.has(word),
    );
    expect(outside).toBeDefined();
    expect(outside![1]).toBeGreaterThan(1);
  });
});

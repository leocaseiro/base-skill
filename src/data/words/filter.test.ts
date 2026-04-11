import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetChunkCacheForTests,
  entryMatches,
  filterWords,
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

  it('graphemesAllowed: passes only when every grapheme is in the set', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: ['c', 'a', 't'],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: ['c', 'a'], // missing 't'
      }),
    ).toBe(false);
  });

  it('graphemesRequired: passes when at least one required is present', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['c'],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['sh'],
      }),
    ).toBe(false);
  });

  it('phonemesAllowed + Required: "c making /k/" case', () => {
    // cat: c/k, a/æ, t/t
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['c'],
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
    };
    expect(
      entryMatches(city, {
        region: 'aus',
        graphemesRequired: ['c'],
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
      // no graphemes
    };
    expect(
      entryMatches(tier1, {
        region: 'aus',
        graphemesAllowed: ['c', 'a', 't'],
      }),
    ).toBe(false);
    expect(entryMatches(tier1, { region: 'aus', level: 2 })).toBe(true);
  });
});

describe('filterWords (integration against seeded chunks)', () => {
  beforeEach(() => __resetChunkCacheForTests());
  afterEach(() => __resetChunkCacheForTests());

  it('returns AUS level 1 hits', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits.length).toBeGreaterThan(0);
    for (const hit of result.hits) {
      expect(hit.level).toBe(1);
      expect(hit.region).toBe('aus');
    }
    expect(result.usedFallback).toBeUndefined();
  });

  it('joins WordCore + CurriculumEntry (hit has syllableCount)', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits[0]!.syllableCount).toBeGreaterThanOrEqual(1);
  });

  it('Tier-2 filter excludes Tier-1-only words', async () => {
    const result = await filterWords({
      region: 'aus',
      levels: [1, 2],
      graphemesAllowed: [
        's',
        'a',
        't',
        'p',
        'i',
        'n',
        'm',
        'd',
        'g',
        'o',
      ],
    });
    for (const hit of result.hits) {
      for (const g of hit.graphemes ?? []) {
        expect([
          's',
          'a',
          't',
          'p',
          'i',
          'n',
          'm',
          'd',
          'g',
          'o',
        ]).toContain(g.g);
      }
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

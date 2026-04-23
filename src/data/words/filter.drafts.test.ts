import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { draftStore } from './authoring/draftStore';
import { __resetChunkCacheForTests, filterWords } from './filter';

beforeEach(async () => {
  await draftStore.__clearAllForTests();
  __resetChunkCacheForTests();
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('filterWords with draft merge', () => {
  it('tags shipped results with provenance: "shipped"', async () => {
    const { hits } = await filterWords({
      region: 'aus',
      levels: [1],
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.provenance).toBe('shipped');
    expect(hits[0]?.draftId).toBeUndefined();
  });

  it('includes drafts in results with provenance: "draft"', async () => {
    await draftStore.saveDraft({
      word: 'zzword',
      region: 'aus',
      level: 2,
      ipa: 'zɜːwɜːd',
      syllables: ['zz', 'word'],
      syllableCount: 2,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'word', p: 'wɜːd' },
      ],
      ritaKnown: false,
    });

    const { hits } = await filterWords({
      region: 'aus',
      levels: [2],
    });

    const draft = hits.find((h) => h.word === 'zzword');
    expect(draft).toBeDefined();
    expect(draft?.provenance).toBe('draft');
    expect(draft?.draftId).toBeTruthy();
  });

  it('applies syllable-count filters to drafts', async () => {
    await draftStore.saveDraft({
      word: 'zzone',
      region: 'aus',
      level: 3,
      ipa: 'zwʌn',
      syllables: ['zzone'],
      syllableCount: 1,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'o', p: 'ʌ' },
        { g: 'ne', p: 'n' },
      ],
      ritaKnown: false,
    });

    const match = await filterWords({
      region: 'aus',
      levels: [3],
      syllableCountEq: 1,
    });
    expect(match.hits.some((h) => h.word === 'zzone')).toBe(true);

    const miss = await filterWords({
      region: 'aus',
      levels: [3],
      syllableCountEq: 3,
    });
    expect(miss.hits.some((h) => h.word === 'zzone')).toBe(false);
  });

  it('sorts shipped + draft together by word', async () => {
    await draftStore.saveDraft({
      word: 'aaapple',
      region: 'aus',
      level: 1,
      ipa: 'ɑpəl',
      syllables: ['aaa', 'pple'],
      syllableCount: 2,
      graphemes: [
        { g: 'aaa', p: 'ɑ' },
        { g: 'pple', p: 'pəl' },
      ],
      ritaKnown: false,
    });

    const { hits } = await filterWords({
      region: 'aus',
      levels: [1],
    });
    const words = hits.map((h) => h.word);
    expect(words).toEqual(words.toSorted((a, b) => a.localeCompare(b)));
  });
});

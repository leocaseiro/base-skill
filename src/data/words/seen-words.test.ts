import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createInMemorySeenWordsStore,
  filterSignature,
  pickWithRecycling,
} from './seen-words';
import type { SeenWordsStore } from './seen-words';
import type { WordFilter, WordHit } from './types';

const hit = (word: string): WordHit => ({
  word,
  region: 'aus',
  level: 1,
  syllableCount: 1,
});

const pool = (words: string[]): WordHit[] => words.map((w) => hit(w));

describe('filterSignature', () => {
  it('produces identical signatures for structurally equal filters', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'aus', level: 2 };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('is order-insensitive for array fields', () => {
    const a: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a', 't'],
    };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['t', 'a', 's'],
    };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('produces different signatures for different levels', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'aus', level: 3 };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('produces different signatures for different regions', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'uk', level: 2 };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('produces different signatures when phonemes differ', () => {
    const a: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a'],
    };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a', 't'],
    };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('treats undefined array fields and empty arrays the same as omission', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: undefined,
    };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });
});

describe('createInMemorySeenWordsStore', () => {
  let store: SeenWordsStore;

  beforeEach(() => {
    store = createInMemorySeenWordsStore();
  });

  afterEach(() => {
    // nothing to clean up — each test gets a fresh store
  });

  it('returns an empty set when nothing is stored', async () => {
    expect(await store.get('sig-a')).toEqual(new Set());
  });

  it('accumulates words via addSeen', async () => {
    await store.addSeen('sig-a', ['cat', 'dog']);
    await store.addSeen('sig-a', ['cat', 'pig']);
    expect(await store.get('sig-a')).toEqual(
      new Set(['cat', 'dog', 'pig']),
    );
  });

  it('replaces the set via resetSeen', async () => {
    await store.addSeen('sig-a', ['cat', 'dog']);
    await store.resetSeen('sig-a', ['pig']);
    expect(await store.get('sig-a')).toEqual(new Set(['pig']));
  });

  it('isolates entries by signature', async () => {
    await store.addSeen('sig-a', ['cat']);
    await store.addSeen('sig-b', ['dog']);
    expect(await store.get('sig-a')).toEqual(new Set(['cat']));
    expect(await store.get('sig-b')).toEqual(new Set(['dog']));
  });
});

describe('pickWithRecycling', () => {
  let store: SeenWordsStore;

  beforeEach(() => {
    store = createInMemorySeenWordsStore();
  });

  it('samples limit distinct hits when the pool has enough unseen', async () => {
    const picked = await pickWithRecycling(
      pool(['a', 'b', 'c', 'd', 'e']),
      3,
      'sig',
      store,
      'seed-1',
    );
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((h) => h.word)).size).toBe(3);
  });

  it('excludes seen words on the next call when enough unseen remain', async () => {
    const hits = pool(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const first = await pickWithRecycling(
      hits,
      3,
      'sig',
      store,
      'seed-a',
    );
    const second = await pickWithRecycling(
      hits,
      3,
      'sig',
      store,
      'seed-b',
    );
    const firstWords = new Set(first.map((h) => h.word));
    const secondWords = second.map((h) => h.word);
    for (const w of secondWords) {
      expect(firstWords.has(w)).toBe(false);
    }
  });

  it('handles pool-exhaustion: 11 words, 5 rounds, 3 sessions — all plays have 5 distinct words', async () => {
    const hits = pool([
      'w1',
      'w2',
      'w3',
      'w4',
      'w5',
      'w6',
      'w7',
      'w8',
      'w9',
      'w10',
      'w11',
    ]);

    const play1 = await pickWithRecycling(hits, 5, 'sig', store, 's1');
    expect(new Set(play1.map((h) => h.word)).size).toBe(5);

    const play2 = await pickWithRecycling(hits, 5, 'sig', store, 's2');
    expect(new Set(play2.map((h) => h.word)).size).toBe(5);
    // play1 and play2 together used 10 distinct words → 1 unseen left.
    const afterTwo = await store.get('sig');
    expect(afterTwo.size).toBe(10);

    const play3 = await pickWithRecycling(hits, 5, 'sig', store, 's3');
    expect(new Set(play3.map((h) => h.word)).size).toBe(5);
    // Cycle rolled over: seen is reset to exactly the 5 words just played.
    const afterThree = await store.get('sig');
    expect(afterThree.size).toBe(5);
    expect(afterThree).toEqual(new Set(play3.map((h) => h.word)));
  });

  it('returns the whole pool when it is smaller than limit (silent cap)', async () => {
    const picked = await pickWithRecycling(
      pool(['a', 'b']),
      5,
      'sig',
      store,
      'seed',
    );
    expect(picked.map((h) => h.word).toSorted()).toEqual(['a', 'b']);
  });
});

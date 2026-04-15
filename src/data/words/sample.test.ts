import { describe, expect, it } from 'vitest';
import { sampleHits } from './sample';
import type { WordHit } from './types';

const hit = (word: string): WordHit => ({
  word,
  region: 'aus',
  level: 1,
  syllableCount: 1,
});

const pool = (n: number): WordHit[] =>
  Array.from({ length: n }, (_, i) => hit(`w${i}`));

describe('sampleHits', () => {
  it('returns min(limit, hits.length) items', () => {
    expect(sampleHits(pool(10), 3, 'seed')).toHaveLength(3);
    expect(sampleHits(pool(2), 5, 'seed')).toHaveLength(2);
  });

  it('returns distinct items', () => {
    const out = sampleHits(pool(20), 10, 'distinct');
    const words = new Set(out.map((h) => h.word));
    expect(words.size).toBe(10);
  });

  it('same seed produces same output', () => {
    const a = sampleHits(pool(20), 5, 'same-seed');
    const b = sampleHits(pool(20), 5, 'same-seed');
    expect(a.map((h) => h.word)).toEqual(b.map((h) => h.word));
  });

  it('different seeds produce different outputs', () => {
    const a = sampleHits(pool(20), 5, 'alpha');
    const b = sampleHits(pool(20), 5, 'beta');
    expect(a.map((h) => h.word)).not.toEqual(b.map((h) => h.word));
  });

  it('returns [] when the pool is empty', () => {
    expect(sampleHits([], 5, 'seed')).toEqual([]);
  });

  it('returns [] when limit is 0 or negative', () => {
    expect(sampleHits(pool(10), 0, 'seed')).toEqual([]);
    expect(sampleHits(pool(10), -3, 'seed')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = pool(5);
    const snapshot = input.map((h) => h.word);
    sampleHits(input, 3, 'no-mutate');
    expect(input.map((h) => h.word)).toEqual(snapshot);
  });
});

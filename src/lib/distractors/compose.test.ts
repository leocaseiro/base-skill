import { describe, expect, it } from 'vitest';
import { composeDistractors } from './compose';
import { confusablePairsSource } from './sources/confusable-pairs';
import { reversibleCharsSource } from './sources/reversible-chars';
import { seededRandom } from '@/lib/seeded-random';

describe('composeDistractors', () => {
  it('merges candidates from all sources', () => {
    const out = composeDistractors(
      [confusablePairsSource, reversibleCharsSource],
      '6',
      {
        selectedConfusablePairs: [
          { pair: ['6', '9'], type: 'rotation-180' },
        ],
        selectedReversibleChars: ['6'],
      },
      10,
    );
    expect(out.map((c) => c.sourceId).toSorted()).toEqual([
      'confusable-pairs',
      'reversible-chars',
    ]);
  });

  it('dedupes by (label, transform) pair', () => {
    const dupSource = {
      id: 'dup',
      getCandidates: () => [
        { label: 'X', sourceId: 'dup' },
        { label: 'X', sourceId: 'dup' }, // exact dup → drop
        {
          label: 'X',
          transform: 'scaleX(-1)' as const,
          sourceId: 'dup',
        }, // different transform → keep
      ],
    };
    const out = composeDistractors([dupSource], 'A', {}, 10);
    expect(out).toHaveLength(2);
  });

  it('caps to count', () => {
    const many = {
      id: 'many',
      getCandidates: () =>
        Array.from({ length: 20 }, (_, i) => ({
          label: `L${i}`,
          sourceId: 'many',
        })),
    };
    const out = composeDistractors([many], 'A', {}, 5);
    expect(out).toHaveLength(5);
  });

  it('is deterministic with a seeded rng', () => {
    const many = {
      id: 'many',
      getCandidates: () =>
        Array.from({ length: 8 }, (_, i) => ({
          label: `L${i}`,
          sourceId: 'many',
        })),
    };
    const a = composeDistractors(
      [many],
      'A',
      {},
      5,
      seededRandom('seed-1'),
    );
    const b = composeDistractors(
      [many],
      'A',
      {},
      5,
      seededRandom('seed-1'),
    );
    expect(a.map((c) => c.label)).toEqual(b.map((c) => c.label));
  });
});

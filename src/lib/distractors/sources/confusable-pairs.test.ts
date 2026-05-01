import { describe, expect, it } from 'vitest';
import { confusablePairsSource } from './confusable-pairs';

describe('confusablePairsSource', () => {
  it('returns the OTHER character of each pair containing the target, no CSS transform', () => {
    const candidates = confusablePairsSource.getCandidates('b', {
      selectedConfusablePairs: [
        { pair: ['b', 'd'], type: 'mirror-horizontal' },
        { pair: ['p', 'q'], type: 'mirror-horizontal' }, // target absent
      ],
    });
    expect(candidates).toEqual([
      {
        label: 'd',
        sourceId: 'confusable-pairs',
        meta: { relationshipType: 'mirror-horizontal' },
      },
    ]);
    expect(candidates[0]?.transform).toBeUndefined();
  });

  it('handles the target on the right side of the pair', () => {
    const candidates = confusablePairsSource.getCandidates('q', {
      selectedConfusablePairs: [
        { pair: ['p', 'q'], type: 'mirror-horizontal' },
      ],
    });
    expect(candidates.map((c) => c.label)).toEqual(['p']);
  });

  it('returns [] when no pair contains the target', () => {
    expect(
      confusablePairsSource.getCandidates('z', {
        selectedConfusablePairs: [
          { pair: ['b', 'd'], type: 'mirror-horizontal' },
        ],
      }),
    ).toEqual([]);
  });

  it('returns [] when selection is undefined or empty', () => {
    expect(confusablePairsSource.getCandidates('b', {})).toEqual([]);
    expect(
      confusablePairsSource.getCandidates('b', {
        selectedConfusablePairs: [],
      }),
    ).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { buildSentenceGapRound } from './build-sentence-gap-round';

describe('buildSentenceGapRound', () => {
  it('creates one zone per gap', () => {
    const { zones } = buildSentenceGapRound([
      { word: 'cat' },
      { word: 'mat' },
    ]);
    expect(zones).toHaveLength(2);
    expect(zones[0]!.expectedValue).toBe('cat');
    expect(zones[1]!.expectedValue).toBe('mat');
  });

  it('creates tiles from gap words', () => {
    const { tiles } = buildSentenceGapRound([{ word: 'cat' }]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.value).toBe('cat');
  });

  it('includes distractors in tiles', () => {
    const { tiles } = buildSentenceGapRound([
      { word: 'cat', distractors: ['dog', 'bat'] },
    ]);
    expect(tiles).toHaveLength(3);
    const values = tiles.map((t) => t.value).toSorted();
    expect(values).toEqual(['bat', 'cat', 'dog']);
  });

  it('includes distractors from multiple gaps', () => {
    const { tiles } = buildSentenceGapRound([
      { word: 'cat', distractors: ['dog'] },
      { word: 'mat', distractors: ['hat'] },
    ]);
    expect(tiles).toHaveLength(4);
    const values = tiles.map((t) => t.value).toSorted();
    expect(values).toEqual(['cat', 'dog', 'hat', 'mat']);
  });

  it('zones have sequential indices', () => {
    const { zones } = buildSentenceGapRound([
      { word: 'a' },
      { word: 'b' },
      { word: 'c' },
    ]);
    expect(zones.map((z) => z.index)).toEqual([0, 1, 2]);
  });

  it('zones start with empty state', () => {
    const { zones } = buildSentenceGapRound([{ word: 'cat' }]);
    expect(zones[0]!.placedTileId).toBeNull();
    expect(zones[0]!.isWrong).toBe(false);
    expect(zones[0]!.isLocked).toBe(false);
  });
});

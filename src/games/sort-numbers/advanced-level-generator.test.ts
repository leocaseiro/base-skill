import { describe, expect, it } from 'vitest';
import { createAdvancedLevelGenerator } from './advanced-level-generator';

describe('createAdvancedLevelGenerator', () => {
  it('produces tiles + zones sized to quantity', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 1, max: 10 },
      quantity: 4,
      skip: { mode: 'consecutive' },
      direction: 'ascending',
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 0 },
    });
    const level = gen(0);
    expect(level).not.toBeNull();
    expect(level!.zones).toHaveLength(4);
    expect(level!.tiles).toHaveLength(4);
  });

  it('respects "by" skip mode start/step', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 2, max: 20 },
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      direction: 'ascending',
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 0 },
    });
    const level = gen(0);
    expect(level).not.toBeNull();
    const values = level!.zones.map((z) => Number(z.expectedValue));
    expect(values).toEqual([2, 4, 6, 8, 10]);
  });

  it('adds distractors when tileBankMode is "distractors"', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 1, max: 10 },
      quantity: 3,
      skip: { mode: 'by', step: 2, start: 2 },
      direction: 'ascending',
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 'all' },
    });
    const level = gen(0);
    expect(level).not.toBeNull();
    expect(level!.tiles.length).toBeGreaterThan(level!.zones.length);
  });

  it('uses descending order when direction is "descending"', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 1, max: 10 },
      quantity: 4,
      skip: { mode: 'by', step: 1, start: 1 },
      direction: 'descending',
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 0 },
    });
    const level = gen(0);
    expect(level).not.toBeNull();
    const values = level!.zones.map((z) => Number(z.expectedValue));
    expect(values).toEqual([4, 3, 2, 1]);
  });
});

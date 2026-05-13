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

  it('gen(0) produces level 2 sequence after completing level 1 (by + numeric start)', () => {
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
    expect(values).toEqual([12, 14, 16, 18, 20]);
  });

  it('gen(1) produces level 3 sequence after completing level 2', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 2, max: 20 },
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      direction: 'ascending',
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 0 },
    });
    const level = gen(1);
    expect(level).not.toBeNull();
    const values = level!.zones.map((z) => Number(z.expectedValue));
    expect(values).toEqual([22, 24, 26, 28, 30]);
  });

  it('descending direction shifts AND reverses per level (by + numeric start)', () => {
    const gen = createAdvancedLevelGenerator({
      range: { min: 2, max: 10 },
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      direction: 'descending',
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 0 },
    });
    const level = gen(0);
    expect(level).not.toBeNull();
    const values = level!.zones.map((z) => Number(z.expectedValue));
    expect(values).toEqual([20, 18, 16, 14, 12]);
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

  it('uses descending order when direction is "descending" (level 2 = shifted + reversed)', () => {
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
    // shifted: start=1+(0+1)*4*1=5 → [5,6,7,8]; descending → [8,7,6,5]
    expect(values).toEqual([8, 7, 6, 5]);
  });
});

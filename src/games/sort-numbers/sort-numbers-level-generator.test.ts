import { describe, expect, it } from 'vitest';
import { createSortNumbersLevelGenerator } from './sort-numbers-level-generator';

describe('createSortNumbersLevelGenerator', () => {
  it('generates level 0 sequence correctly', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '2',
      '4',
      '6',
      '8',
      '10',
    ]);
  });

  it('generates level 1 continuing from where level 0 ended', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(1);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '12',
      '14',
      '16',
      '18',
      '20',
    ]);
  });

  it('generates level 2 continuing the pattern', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(2);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '22',
      '24',
      '26',
      '28',
      '30',
    ]);
  });

  it('descending direction reverses expected zone order', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 3,
      direction: 'descending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '6',
      '4',
      '2',
    ]);
  });

  it('generates correct number of tiles and zones', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 1,
      step: 3,
      quantity: 4,
      direction: 'ascending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.tiles).toHaveLength(4);
    expect(result.zones).toHaveLength(4);
  });

  it('includes distractors when configured', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 3,
      direction: 'ascending',
      distractor: {
        config: { source: 'gaps-only', count: 'all' },
        range: { min: 2, max: 6 },
      },
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.tiles.length).toBeGreaterThan(3);
    expect(result.zones).toHaveLength(3);
  });
});

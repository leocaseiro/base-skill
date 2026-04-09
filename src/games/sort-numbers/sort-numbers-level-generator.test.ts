import { describe, expect, it } from 'vitest';
import { createSortNumbersLevelGenerator } from './sort-numbers-level-generator';

describe('createSortNumbersLevelGenerator', () => {
  it('generate(0) produces level 1 sequence (after completing level 0)', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '12',
      '14',
      '16',
      '18',
      '20',
    ]);
  });

  it('generate(1) produces level 2 sequence (after completing level 1)', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(1);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '22',
      '24',
      '26',
      '28',
      '30',
    ]);
  });

  it('generate(2) produces level 3 sequence', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(2);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '32',
      '34',
      '36',
      '38',
      '40',
    ]);
  });

  it('descending direction reverses expected zone order', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 3,
      direction: 'descending',
    });
    // generate(0) = after completing level 0, generate level 1
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result.zones.map((z) => z.expectedValue)).toEqual([
      '12',
      '10',
      '8',
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

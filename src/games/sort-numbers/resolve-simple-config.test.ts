import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  canConvertToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';
import type { SortNumbersConfig } from './types';

describe('resolveSimpleConfig', () => {
  it('start=2, step=2, qty=5, distractors=false produces sequence [2,4,6,8,10] with 5 tiles exact mode', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
    expect(result.range).toEqual({ min: 2, max: 10 });
    expect(result.tileBankMode).toBe('exact');
    expect(result.skip).toEqual({ mode: 'by', step: 2, start: 2 });
    expect(result.configMode).toBe('simple');
  });

  it('start=2, step=2, qty=5, distractors=true produces gaps-only all distractors', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: true,
    });
    expect(result.rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
    expect(result.tileBankMode).toBe('distractors');
    expect(result.distractors).toEqual({
      source: 'gaps-only',
      count: 'all',
    });
  });

  it('start=5, step=3, qty=4, distractors=false produces sequence [5,8,11,14]', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 5,
      step: 3,
      quantity: 4,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([5, 8, 11, 14]);
    expect(result.range).toEqual({ min: 5, max: 14 });
    expect(result.quantity).toBe(4);
  });

  it('direction descending is passed through', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'descending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.direction).toBe('descending');
  });

  it('start=1, step=1, qty=5 (consecutive edge) produces [1,2,3,4,5]', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 1,
      step: 1,
      quantity: 5,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([1, 2, 3, 4, 5]);
    expect(result.range).toEqual({ min: 1, max: 5 });
  });

  it('sets sensible defaults for non-editable AnswerGameConfig fields', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.inputMethod).toBe('drag');
    expect(result.wrongTileBehavior).toBe('lock-manual');
    expect(result.ttsEnabled).toBe(true);
    expect(result.roundsInOrder).toBe(false);
    expect(result.totalRounds).toBe(1);
  });
});

describe('canConvertToSimple', () => {
  const base: SortNumbersConfig = {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
    direction: 'ascending',
    range: { min: 2, max: 10 },
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 2 },
    distractors: { source: 'random', count: 2 },
    rounds: [{ sequence: [2, 4, 6, 8, 10] }],
  };

  it('returns true for skip by with numeric start and exact mode', () => {
    expect(canConvertToSimple(base)).toBe(true);
  });

  it('returns true for skip by with numeric start and gaps-only all distractors', () => {
    expect(
      canConvertToSimple({
        ...base,
        tileBankMode: 'distractors',
        distractors: { source: 'gaps-only', count: 'all' },
      }),
    ).toBe(true);
  });

  it('returns false for skip mode random', () => {
    expect(
      canConvertToSimple({
        ...base,
        skip: { mode: 'random' },
      }),
    ).toBe(false);
  });

  it('returns false for skip by with string start', () => {
    expect(
      canConvertToSimple({
        ...base,
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(false);
  });

  it('returns false for distractors with source random', () => {
    expect(
      canConvertToSimple({
        ...base,
        tileBankMode: 'distractors',
        distractors: { source: 'random', count: 3 },
      }),
    ).toBe(false);
  });
});

describe('advancedToSimple', () => {
  const convertibleConfig: SortNumbersConfig = {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
    direction: 'descending',
    range: { min: 3, max: 9 },
    quantity: 4,
    skip: { mode: 'by', step: 2, start: 3 },
    distractors: { source: 'random', count: 2 },
    rounds: [{ sequence: [3, 5, 7, 9] }],
  };

  it('extracts simple fields from a convertible config', () => {
    const simple = advancedToSimple(convertibleConfig);
    expect(simple).toEqual({
      configMode: 'simple',
      direction: 'descending',
      start: 3,
      step: 2,
      quantity: 4,
      distractors: false,
    });
  });

  it('returns defaults when config is not convertible', () => {
    const simple = advancedToSimple({
      ...convertibleConfig,
      skip: { mode: 'random' },
    });
    expect(simple).toEqual({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  getAllSets,
  getConfusableSet,
  getConfusablesFor,
} from './query';

describe('confusable query utilities', () => {
  it('returns confusables for a member', () => {
    expect(getConfusablesFor('b').toSorted()).toEqual(['d', 'p', 'q']);
  });

  it('filters confusables by relationship type', () => {
    expect(
      getConfusablesFor('b', { type: 'mirror-horizontal' }),
    ).toEqual(['d']);
  });

  it('supports multi-character sequence members', () => {
    expect(getConfusablesFor('15')).toEqual(['51']);
  });

  it('returns empty results for unknown or empty input', () => {
    expect(getConfusablesFor('z')).toEqual([]);
    expect(getConfusablesFor('')).toEqual([]);
  });

  it('returns full set by id', () => {
    const set = getConfusableSet('bdpq');
    expect(set?.id).toBe('bdpq');
    expect(set?.members).toEqual(['b', 'd', 'p', 'q']);
    expect(set?.relationships.length).toBeGreaterThan(0);
  });

  it('returns undefined for missing set id', () => {
    expect(getConfusableSet('does-not-exist')).toBeUndefined();
  });

  it('returns all sets', () => {
    expect(getAllSets().length).toBeGreaterThanOrEqual(8);
  });
});

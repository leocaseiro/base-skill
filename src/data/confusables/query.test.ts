import { describe, expect, it } from 'vitest';
import {
  getAllReversibles,
  getAllSets,
  getConfusableSet,
  getConfusablesFor,
  getReversalTransform,
  isReversible,
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

describe('getAllReversibles', () => {
  it('returns the 9 R5b reversibles, all mirror-horizontal', () => {
    const all = getAllReversibles();
    expect(all).toHaveLength(9);
    expect(all.map((r) => r.char)).toEqual([
      '2',
      '3',
      '5',
      '6',
      '7',
      '9',
      'J',
      'S',
      'Z',
    ]);
    expect(all.every((r) => r.transform === 'mirror-horizontal')).toBe(
      true,
    );
  });

  it('returns a fresh array on each call (no shared mutation)', () => {
    const a = getAllReversibles();
    a.push({ char: 'X', transform: 'mirror-horizontal' });
    expect(getAllReversibles()).toHaveLength(9);
  });
});

describe('getReversalTransform', () => {
  it('returns the reversible record for a known char', () => {
    expect(getReversalTransform('2')).toEqual({
      char: '2',
      transform: 'mirror-horizontal',
    });
    expect(getReversalTransform('Z')).toEqual({
      char: 'Z',
      transform: 'mirror-horizontal',
    });
  });

  it('returns undefined for non-reversible chars', () => {
    expect(getReversalTransform('b')).toBeUndefined();
    expect(getReversalTransform('1')).toBeUndefined();
    expect(getReversalTransform('')).toBeUndefined();
  });
});

describe('isReversible', () => {
  it('returns true for known reversibles', () => {
    expect(isReversible('6')).toBe(true);
    expect(isReversible('J')).toBe(true);
  });

  it('returns false for non-reversibles', () => {
    expect(isReversible('b')).toBe(false);
    expect(isReversible('')).toBe(false);
  });
});

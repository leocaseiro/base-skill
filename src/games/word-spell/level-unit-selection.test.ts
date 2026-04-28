import { describe, expect, it } from 'vitest';
import {
  defaultSelection,
  toggleLevel,
  toggleUnit,
  triStateForLevel,
} from './level-unit-selection';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []) as LevelGraphemeUnit[];
const L2 = (GRAPHEMES_BY_LEVEL[2] ?? []) as LevelGraphemeUnit[];

describe('triStateForLevel', () => {
  it('returns "unchecked" when no L1 units are selected', () => {
    expect(triStateForLevel(1, [])).toBe('unchecked');
  });

  it('returns "checked" when every L1 unit is selected', () => {
    expect(triStateForLevel(1, [...L1])).toBe('checked');
  });

  it('returns "indeterminate" when some L1 units are selected', () => {
    expect(triStateForLevel(1, [L1[0]!])).toBe('indeterminate');
  });

  it('treats other levels independently', () => {
    expect(triStateForLevel(2, [...L1])).toBe('unchecked');
  });
});

describe('toggleLevel', () => {
  it('adds every unit at the level when next="checked"', () => {
    const result = toggleLevel(1, [], 'checked');
    expect(result).toHaveLength(L1.length);
  });

  it('removes every unit at the level when next="unchecked"', () => {
    const result = toggleLevel(1, [...L1, ...L2], 'unchecked');
    expect(result).toEqual(L2);
  });

  it('does not duplicate units already in the selection', () => {
    const result = toggleLevel(1, [L1[0]!], 'checked');
    expect(result).toHaveLength(L1.length);
  });
});

describe('toggleUnit', () => {
  it('adds the unit when absent', () => {
    const u = L1[0]!;
    expect(toggleUnit(u, [])).toEqual([u]);
  });

  it('removes the unit when present', () => {
    const u = L1[0]!;
    expect(toggleUnit(u, [u])).toEqual([]);
  });

  it('treats (g, p) as the identity — different grapheme, same phoneme stay independent', () => {
    const sL1 = { g: 's', p: 's' } as LevelGraphemeUnit;
    const cL4 = { g: 'c', p: 's' } as LevelGraphemeUnit;
    const after = toggleUnit(cL4, [sL1]);
    expect(after).toContainEqual(sL1);
    expect(after).toContainEqual(cL4);
  });
});

describe('defaultSelection', () => {
  it('returns every unit at level 1', () => {
    expect(defaultSelection()).toEqual(L1);
  });
});

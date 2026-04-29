import { describe, expect, it } from 'vitest';
import {
  defaultSelection,
  headerStateForLevel,
  toggleLevel,
  toggleUnit,
  unitLevel,
} from './level-unit-selection';
import type { LevelHeaderState } from './level-unit-selection';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []) as LevelGraphemeUnit[];
const L2 = (GRAPHEMES_BY_LEVEL[2] ?? []) as LevelGraphemeUnit[];

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

describe('unitLevel', () => {
  it('returns 1 for L1 unit { g: "s", p: "s" }', () => {
    expect(unitLevel({ g: 's', p: 's' })).toBe(1);
  });

  it('returns 4 for L4 unit { g: "sh", p: "ʃ" }', () => {
    expect(unitLevel({ g: 'sh', p: 'ʃ' })).toBe(4);
  });

  it('distinguishes same-grapheme-different-phoneme units across levels', () => {
    expect(unitLevel({ g: 'c', p: 'k' })).toBe(2);
    expect(unitLevel({ g: 'c', p: 's' })).toBe(4);
  });

  it('returns undefined for an unknown unit', () => {
    expect(unitLevel({ g: 'qq', p: 'qq' })).toBeUndefined();
  });
});

describe('headerStateForLevel', () => {
  const L1Local = (GRAPHEMES_BY_LEVEL[1] ?? []) as LevelGraphemeUnit[];
  const L4Local = (GRAPHEMES_BY_LEVEL[4] ?? []) as LevelGraphemeUnit[];

  it('returns "all-on" with counts when every L1 unit is selected and maxLevel >= 1', () => {
    const state: LevelHeaderState = headerStateForLevel(
      1,
      [...L1Local],
      1,
    );
    expect(state.kind).toBe('all-on');
    expect(state).toMatchObject({
      count: L1Local.length,
      total: L1Local.length,
    });
  });

  it('returns "partial" with counts when some chips are on', () => {
    const state: LevelHeaderState = headerStateForLevel(
      1,
      [L1Local[0]!, L1Local[1]!],
      1,
    );
    expect(state.kind).toBe('partial');
    expect(state).toMatchObject({ count: 2, total: L1Local.length });
  });

  it('returns "tiles-only" when level <= maxLevel but no chips are ticked at this level', () => {
    const sh = L4Local.find((u) => u.g === 'sh' && u.p === 'ʃ')!;
    const state: LevelHeaderState = headerStateForLevel(2, [sh], 4);
    expect(state.kind).toBe('tiles-only');
    const visibleL2 = (GRAPHEMES_BY_LEVEL[2] ?? []).filter(
      (u) => u.p !== '',
    );
    expect(state).toMatchObject({ total: visibleL2.length });
  });

  it('returns "not-in-scope" when level > maxLevel', () => {
    const state: LevelHeaderState = headerStateForLevel(
      5,
      [...L1Local],
      1,
    );
    expect(state.kind).toBe('not-in-scope');
    expect(state).toMatchObject({
      total: GRAPHEMES_BY_LEVEL[5]!.length,
    });
  });
});

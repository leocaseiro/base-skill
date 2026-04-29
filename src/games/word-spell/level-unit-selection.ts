import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

export type Tri = 'checked' | 'unchecked' | 'indeterminate';

const sameUnit = (
  a: LevelGraphemeUnit,
  b: LevelGraphemeUnit,
): boolean => a.g === b.g && a.p === b.p;

const unitsAt = (level: number): LevelGraphemeUnit[] =>
  (GRAPHEMES_BY_LEVEL[level] ?? []) as LevelGraphemeUnit[];

export const triStateForLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
): Tri => {
  const units = unitsAt(level);
  if (units.length === 0) return 'unchecked';
  const onCount = units.filter((u) =>
    selected.some((s) => sameUnit(s, u)),
  ).length;
  if (onCount === 0) return 'unchecked';
  if (onCount === units.length) return 'checked';
  return 'indeterminate';
};

export const toggleLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
  next: 'checked' | 'unchecked',
): LevelGraphemeUnit[] => {
  const units = unitsAt(level);
  const withoutLevel = selected.filter(
    (s) => !units.some((u) => sameUnit(u, s)),
  );
  return next === 'checked'
    ? [...withoutLevel, ...units]
    : withoutLevel;
};

export const toggleUnit = (
  unit: LevelGraphemeUnit,
  selected: readonly LevelGraphemeUnit[],
): LevelGraphemeUnit[] => {
  const present = selected.some((s) => sameUnit(s, unit));
  return present
    ? selected.filter((s) => !sameUnit(s, unit))
    : [...selected, unit];
};

export const defaultSelection = (): LevelGraphemeUnit[] => unitsAt(1);

export const unitLevel = (
  unit: LevelGraphemeUnit,
): number | undefined => {
  for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
    const units = unitsAt(lvl);
    if (units.some((u) => sameUnit(u, unit))) return lvl;
  }
  return undefined;
};

export type LevelHeaderState =
  | { kind: 'all-on'; count: number; total: number }
  | { kind: 'partial'; count: number; total: number }
  | { kind: 'tiles-only'; total: number }
  | { kind: 'not-in-scope'; total: number };

export const headerStateForLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
  maxLevel: number,
): LevelHeaderState => {
  const units = unitsAt(level).filter((u) => u.p !== '');
  const total = units.length;
  const count = units.filter((u) =>
    selected.some((s) => sameUnit(s, u)),
  ).length;

  if (count === total && total > 0)
    return { kind: 'all-on', count, total };
  if (count > 0) return { kind: 'partial', count, total };
  if (level <= maxLevel) return { kind: 'tiles-only', total };
  return { kind: 'not-in-scope', total };
};

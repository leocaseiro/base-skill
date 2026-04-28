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

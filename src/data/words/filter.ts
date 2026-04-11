// src/data/words/filter.ts
import type { WordFilter, WordHit } from './types';

const inRange = (
  n: number,
  [min, max]: readonly [number, number],
): boolean => n >= min && n <= max;

export const entryMatches = (
  hit: WordHit,
  filter: WordFilter,
): boolean => {
  if (hit.region !== filter.region) return false;

  if (filter.level !== undefined && hit.level !== filter.level)
    return false;
  if (filter.levels && !filter.levels.includes(hit.level)) return false;
  if (filter.levelRange && !inRange(hit.level, filter.levelRange))
    return false;

  if (
    filter.syllableCountEq !== undefined &&
    hit.syllableCount !== filter.syllableCountEq
  )
    return false;
  if (
    filter.syllableCountRange &&
    !inRange(hit.syllableCount, filter.syllableCountRange)
  )
    return false;

  const tier2Active =
    filter.graphemesAllowed !== undefined ||
    filter.graphemesRequired !== undefined ||
    filter.phonemesAllowed !== undefined ||
    filter.phonemesRequired !== undefined;

  if (tier2Active && !hit.graphemes) return false;

  if (hit.graphemes) {
    if (filter.graphemesAllowed) {
      const allowed = new Set(filter.graphemesAllowed);
      if (!hit.graphemes.every((g) => allowed.has(g.g))) return false;
    }
    if (filter.graphemesRequired) {
      const required = new Set(filter.graphemesRequired);
      if (!hit.graphemes.some((g) => required.has(g.g))) return false;
    }
    if (filter.phonemesAllowed) {
      const allowed = new Set(filter.phonemesAllowed);
      if (!hit.graphemes.every((g) => allowed.has(g.p))) return false;
    }
    if (filter.phonemesRequired) {
      const required = new Set(filter.phonemesRequired);
      if (!hit.graphemes.some((g) => required.has(g.p))) return false;
    }
  }

  return true;
};

import type { WordFilter } from './types';

export interface ActiveFilterPill {
  id: string;
  label: string;
  clear: string;
}

interface GraphemePair {
  g: string;
  p: string;
  label: string;
}

export const deriveActiveFilterPills = (
  filter: WordFilter,
  graphemePairs: readonly GraphemePair[],
  wordPrefix: string,
): ActiveFilterPill[] => {
  const pills: ActiveFilterPill[] = [];
  if (wordPrefix.trim() !== '') {
    pills.push({
      id: 'prefix',
      label: `starts: ${wordPrefix.trim()}`,
      clear: 'prefix',
    });
  }
  if (filter.levels && filter.levels.length > 0) {
    pills.push({
      id: 'levels',
      label: filter.levels.map((n) => `L${n}`).join(', '),
      clear: 'levels',
    });
  }
  if (filter.levelRange) {
    pills.push({
      id: 'level-range',
      label: `L${filter.levelRange[0]}–L${filter.levelRange[1]}`,
      clear: 'levelRange',
    });
  }
  if (filter.syllableCountEq !== undefined) {
    pills.push({
      id: 'syll-eq',
      label: `${filter.syllableCountEq} syl`,
      clear: 'syllableCountEq',
    });
  }
  if (filter.syllableCountRange) {
    pills.push({
      id: 'syll-range',
      label: `${filter.syllableCountRange[0]}–${filter.syllableCountRange[1]} syl`,
      clear: 'syllableCountRange',
    });
  }
  for (const p of graphemePairs) {
    pills.push({
      id: `pair:${p.label}`,
      label: p.label,
      clear: `pair:${p.label}`,
    });
  }
  return pills;
};

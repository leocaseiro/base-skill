import type { WordFilter } from './types';

const sortedCsv = (xs: readonly string[] | undefined): string =>
  xs && xs.length > 0 ? xs.toSorted().join(',') : '';

/**
 * Stable key derived from a `WordFilter`. Two filters with the same
 * content produce the same signature regardless of property order or
 * array ordering (we sort `phonemesAllowed` etc.). Used as the key
 * under which "seen words" are tracked.
 */
export const filterSignature = (filter: WordFilter): string => {
  const parts: string[] = [
    `region=${filter.region}`,
    `level=${filter.level ?? ''}`,
    `levels=${sortedCsv(filter.levels?.map(String))}`,
    `levelRange=${filter.levelRange ? filter.levelRange.join('-') : ''}`,
    `syllableCountEq=${filter.syllableCountEq ?? ''}`,
    `syllableCountRange=${
      filter.syllableCountRange
        ? filter.syllableCountRange.join('-')
        : ''
    }`,
    `phonemesAllowed=${sortedCsv(filter.phonemesAllowed)}`,
    `phonemesRequired=${sortedCsv(filter.phonemesRequired)}`,
    `graphemesAllowed=${sortedCsv(filter.graphemesAllowed)}`,
    `graphemesRequired=${sortedCsv(filter.graphemesRequired)}`,
  ];
  return parts.join('|');
};

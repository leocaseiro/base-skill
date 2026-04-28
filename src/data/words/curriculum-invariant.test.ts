import { describe, expect, it } from 'vitest';
import { filterWords } from './filter';
import { ALL_REGIONS, cumulativeGraphemes } from './levels';

const MIN_PLAYABLE_HITS = 4;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('curriculum invariant: every level has playable defaults', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L${level}: cumulative phonemes yield ≥ ${MIN_PLAYABLE_HITS} words`, async () => {
        const phonemesAllowed = [
          ...new Set(cumulativeGraphemes(level).map((u) => u.p)),
        ];
        const result = await filterWords({
          region,
          level,
          phonemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(
          MIN_PLAYABLE_HITS,
        );
      });
    }
  }
});

import { describe, expect, it } from 'vitest';
import { filterWords } from './filter';
import { ALL_REGIONS, GRAPHEMES_BY_LEVEL } from './levels';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const unitsThrough = (maxLevel: number) => {
  const out = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    out.push(...(GRAPHEMES_BY_LEVEL[lvl] ?? []));
  }
  return out;
};

const deriveFilter = (units: { g: string; p: string }[]) => ({
  phonemesAllowed: [...new Set(units.map((u) => u.p))],
  graphemesAllowed: [...new Set(units.map((u) => u.g))],
});

describe('curriculum invariant: cumulative selection at each level yields ≥ 4 words', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L1..${level}: cumulative yields ≥ 4 word(s)`, async () => {
        const units = unitsThrough(level);
        const result = await filterWords({
          region,
          ...deriveFilter(units),
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(4);
      });
    }
  }
});

describe('curriculum invariant: every level unlocks NEW playable words', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L${level}: adding this level produces words that use its graphemes`, async () => {
        const allUnits = unitsThrough(level);
        const thisLevel = GRAPHEMES_BY_LEVEL[level] ?? [];
        const thisLevelGraphemes = new Set(thisLevel.map((u) => u.g));

        const result = await filterWords({
          region,
          ...deriveFilter(allUnits),
        });

        const wordsUsingThisLevel = result.hits.filter((hit) =>
          hit.graphemes?.some((g) => thisLevelGraphemes.has(g.g)),
        );

        expect(
          wordsUsingThisLevel.length,
          `L${level} graphemes [${[...thisLevelGraphemes].join(', ')}] should appear in at least 1 word`,
        ).toBeGreaterThanOrEqual(1);
      });
    }
  }
});

describe('curriculum invariant: each level 3-8 adds words beyond the baseline', () => {
  for (const region of ALL_REGIONS) {
    const baseline = unitsThrough(2);

    for (const level of [3, 4, 5, 6, 7, 8] as const) {
      it(`${region} L${level}: L1+L2+L${level} yields strictly more words than L1+L2 alone`, async () => {
        const [baseResult, combinedResult] = await Promise.all([
          filterWords({ region, ...deriveFilter(baseline) }),
          filterWords({
            region,
            ...deriveFilter([
              ...baseline,
              ...(GRAPHEMES_BY_LEVEL[level] ?? []),
            ]),
          }),
        ]);

        expect(
          combinedResult.hits.length,
          `adding L${level} should unlock new words`,
        ).toBeGreaterThan(baseResult.hits.length);
      });
    }
  }
});

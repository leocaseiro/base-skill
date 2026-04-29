import { describe, expect, it } from 'vitest';
import { filterWords } from './filter';
import {
  ALL_REGIONS,
  GRAPHEMES_BY_LEVEL,
  cumulativeGraphemes,
} from './levels';
import type { GraphemePairFilter } from './types';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const unitsThrough = (maxLevel: number) => {
  const out = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    out.push(...(GRAPHEMES_BY_LEVEL[lvl] ?? []));
  }
  return out;
};

const deriveFilter = (units: { g: string; p: string }[]) => {
  const seen = new Set<string>();
  const graphemesAllowed: GraphemePairFilter[] = [];
  for (const u of units) {
    const key = `${u.g}|${u.p}`;
    if (!seen.has(key)) {
      seen.add(key);
      graphemesAllowed.push({ g: u.g, p: u.p });
    }
  }
  return {
    phonemesAllowed: [...new Set(units.map((u) => u.p))],
    graphemesAllowed,
  };
};

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

describe('curriculum invariant: cumulative graphemes + single-phoneme Y filter yields ≥ 1 hit per level', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      const units = GRAPHEMES_BY_LEVEL[level] ?? [];
      for (const unit of units) {
        it(`${region} L${level} chip ${unit.g} /${unit.p}/ → ≥ 1 hit`, async () => {
          const result = await filterWords({
            region,
            graphemesAllowed: cumulativeGraphemes(level),
            phonemesRequired: [unit.p],
          });
          expect(
            result.hits.length,
            `Single-chip selection ${unit.g} /${unit.p}/ at L${level} should produce at least one playable word`,
          ).toBeGreaterThanOrEqual(1);
        });
      }
    }
  }
});

describe('curriculum invariant: cumulative + Y filter excludes pure-prior-level words', () => {
  for (const region of ALL_REGIONS) {
    for (const level of [3, 4, 5, 6, 7, 8] as const) {
      it(`${region} L${level} all chips → result excludes pure-L1-only words`, async () => {
        const phonemes = (GRAPHEMES_BY_LEVEL[level] ?? []).map(
          (u) => u.p,
        );
        const result = await filterWords({
          region,
          graphemesAllowed: cumulativeGraphemes(level),
          phonemesRequired: [...new Set(phonemes)],
        });
        const l1Phonemes = new Set(
          (GRAPHEMES_BY_LEVEL[1] ?? []).map((u) => u.p),
        );
        for (const hit of result.hits) {
          const wordPhonemes = (hit.graphemes ?? []).map((g) => g.p);
          const usesAnyLNphoneme = wordPhonemes.some((p) =>
            phonemes.includes(p),
          );
          const usesOnlyL1 = wordPhonemes.every((p) =>
            l1Phonemes.has(p),
          );
          expect(
            usesAnyLNphoneme || !usesOnlyL1,
            `Word "${hit.word}" should either use an L${level} phoneme or have a non-L1 phoneme`,
          ).toBe(true);
        }
      });
    }
  }
});

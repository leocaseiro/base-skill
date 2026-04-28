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

describe('curriculum invariant: every level alone is playable', () => {
  for (const region of ALL_REGIONS) {
    for (const level of [1, 2] as const) {
      it(`${region} L${level}: standalone yields ≥ 1 word(s)`, async () => {
        const units = GRAPHEMES_BY_LEVEL[level] ?? [];
        const phonemesAllowed = [...new Set(units.map((u) => u.p))];
        const graphemesAllowed = [...new Set(units.map((u) => u.g))];
        const result = await filterWords({
          region,
          phonemesAllowed,
          graphemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(1);
      });
    }
  }
});

describe('curriculum invariant: every level adds playable content on top of L1+L2', () => {
  const baseline = unitsThrough(2);

  for (const region of ALL_REGIONS) {
    for (const level of [3, 4, 5, 6, 7, 8] as const) {
      it(`${region} L${level}: combined with L1+L2 yields ≥ 4 word(s)`, async () => {
        const added = GRAPHEMES_BY_LEVEL[level] ?? [];
        const combined = [...baseline, ...added];
        const phonemesAllowed = [...new Set(combined.map((u) => u.p))];
        const graphemesAllowed = [...new Set(combined.map((u) => u.g))];
        const result = await filterWords({
          region,
          phonemesAllowed,
          graphemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(4);
      });
    }
  }
});

describe('curriculum invariant: cumulative selection at each level yields ≥ 4 words', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L1..${level}: cumulative yields ≥ 4 word(s)`, async () => {
        const units = unitsThrough(level);
        const phonemesAllowed = [...new Set(units.map((u) => u.p))];
        const graphemesAllowed = [...new Set(units.map((u) => u.g))];
        const result = await filterWords({
          region,
          phonemesAllowed,
          graphemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(4);
      });
    }
  }
});

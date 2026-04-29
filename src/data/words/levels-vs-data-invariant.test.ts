import { describe, expect, it } from 'vitest';
import {
  ALL_REGIONS,
  GRAPHEMES_BY_LEVEL,
  cumulativeGraphemes,
} from './levels';
import type { CurriculumEntry, Region } from './types';

const curriculumChunks = import.meta.glob<{
  default: CurriculumEntry[];
}>('./curriculum/*/level*.json', { eager: true });

const filesByRegion = new Map<Region, Map<number, CurriculumEntry[]>>();
for (const [path, mod] of Object.entries(curriculumChunks)) {
  const match = /curriculum\/(\w+)\/level(\d+)\.json$/.exec(path);
  if (!match) continue;
  const region = match[1] as Region;
  if (!ALL_REGIONS.includes(region)) continue;
  const level = Number(match[2]);
  if (!filesByRegion.has(region)) filesByRegion.set(region, new Map());
  filesByRegion.get(region)!.set(level, mod.default);
}

const regionsWithData: Region[] = [...filesByRegion.keys()].filter(
  (r) => (filesByRegion.get(r)?.size ?? 0) > 0,
);

const usedAt = (region: Region, level: number): Set<string> => {
  const out = new Set<string>();
  const entries = filesByRegion.get(region)?.get(level) ?? [];
  for (const e of entries) {
    for (const g of e.graphemes) {
      out.add(`${g.g}|${g.p}`);
    }
  }
  return out;
};

const cumulativeKeys = (level: number): Set<string> => {
  const out = new Set<string>();
  for (const u of cumulativeGraphemes(level)) out.add(`${u.g}|${u.p}`);
  return out;
};

const newlyDeclaredAt = (level: number): Set<string> => {
  const cur = cumulativeKeys(level);
  const prev = cumulativeKeys(level - 1);
  const out = new Set<string>();
  for (const k of cur) if (!prev.has(k)) out.add(k);
  return out;
};

describe('levels vs data invariant: every (g,p) used at L_n is in cumulative declared L1..L_n', () => {
  for (const region of regionsWithData) {
    const levels = [...filesByRegion.get(region)!.keys()].toSorted(
      (a, b) => a - b,
    );
    for (const level of levels) {
      it(`${region} L${level}: used pairs are all declared by this level`, () => {
        const used = usedAt(region, level);
        const declared = cumulativeKeys(level);
        const missing = [...used].filter((k) => !declared.has(k));
        expect(
          missing,
          `L${level} uses pairs not in cumulative declared L1..${level}: ${missing.join(', ')}`,
        ).toEqual([]);
      });
    }
  }
});

describe('levels vs data invariant: every (g,p) newly declared at L_n is used by ≥ 1 word at L_n', () => {
  const allLevels = Object.keys(GRAPHEMES_BY_LEVEL)
    .map(Number)
    .toSorted((a, b) => a - b);
  for (const region of regionsWithData) {
    for (const level of allLevels) {
      const newly = newlyDeclaredAt(level);
      if (newly.size === 0) continue;
      it(`${region} L${level}: each newly-declared pair has ≥ 1 L${level} word using it`, () => {
        const used = usedAt(region, level);
        const unused = [...newly].filter((k) => !used.has(k));
        expect(
          unused,
          `L${level} declares pairs not used by any L${level} word: ${unused.join(', ')}`,
        ).toEqual([]);
      });
    }
  }
});

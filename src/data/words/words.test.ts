import { describe, expect, it } from 'vitest';
import { ALL_REGIONS } from './levels';
import type { CurriculumEntry, Region, WordCore } from './types';

const coreChunks = import.meta.glob<{ default: WordCore[] }>(
  './core/level*.json',
  { eager: true },
);
const curriculumChunks = import.meta.glob<{
  default: CurriculumEntry[];
}>('./curriculum/*/level*.json', { eager: true });

const coreByLevel: Record<number, WordCore[]> = {};
for (const [path, mod] of Object.entries(coreChunks)) {
  const match = /level(\d+)\.json$/.exec(path);
  if (!match) continue;
  coreByLevel[Number(match[1])] = mod.default;
}

interface CurriculumFile {
  region: Region;
  level: number;
  entries: CurriculumEntry[];
}

const curriculumFiles: CurriculumFile[] = [];
for (const [path, mod] of Object.entries(curriculumChunks)) {
  const match = /curriculum\/(\w+)\/level(\d+)\.json$/.exec(path);
  if (!match) continue;
  const region = match[1] as Region;
  if (!ALL_REGIONS.includes(region)) continue;
  curriculumFiles.push({
    region,
    level: Number(match[2]),
    entries: mod.default,
  });
}

describe('word library invariants', () => {
  it('has at most one core entry per (word, level)', () => {
    for (const [level, entries] of Object.entries(coreByLevel)) {
      const seen = new Set<string>();
      for (const e of entries) {
        expect(seen.has(e.word)).toBe(false);
        seen.add(e.word);
      }
      expect(level).toBeDefined();
    }
  });

  it('WordCore.syllables joins to word when present', () => {
    for (const entries of Object.values(coreByLevel)) {
      for (const e of entries) {
        if (e.syllables) {
          expect(e.syllables.join('')).toBe(e.word);
          expect(e.syllables.length).toBe(e.syllableCount);
        }
      }
    }
  });

  it('CurriculumEntry.graphemes joins to word', () => {
    for (const { entries } of curriculumFiles) {
      for (const e of entries) {
        const concat = e.graphemes
          .map((g) => g.g.replace('_', ''))
          .join('');
        expect(concat).toBe(e.word);
      }
    }
  });

  it('CurriculumEntry has a matching WordCore in the same level', () => {
    for (const { level, entries } of curriculumFiles) {
      const coreWords = new Set(
        (coreByLevel[level] ?? []).map((c) => c.word),
      );
      for (const e of entries) {
        expect(coreWords.has(e.word)).toBe(true);
      }
    }
  });

  it('CurriculumEntry.level matches the filename level', () => {
    for (const { level, entries } of curriculumFiles) {
      for (const e of entries) expect(e.level).toBe(level);
    }
  });

  it('variants are bidirectional', () => {
    const allCore = Object.values(coreByLevel).flat();
    const byWord = new Map(allCore.map((c) => [c.word, c]));
    for (const c of allCore) {
      for (const v of c.variants ?? []) {
        const linked = byWord.get(v);
        expect(linked, `variant "${v}" missing`).toBeDefined();
        expect(linked!.variants?.includes(c.word)).toBe(true);
      }
    }
  });

  it('no proper nouns (first letter must be lowercase)', () => {
    for (const entries of Object.values(coreByLevel)) {
      for (const e of entries) {
        expect(e.word[0]).toBe(e.word[0]!.toLowerCase());
      }
    }
  });
});

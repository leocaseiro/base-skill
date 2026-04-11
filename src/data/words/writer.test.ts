import { describe, expect, it } from 'vitest';
import {
  removeCurriculumEntry,
  removeWordCore,
  upsertCurriculumEntry,
  upsertWordCore,
} from './writer';
import type { CurriculumEntry, WordCore } from './types';

const e = (word: string, level: number): CurriculumEntry => ({
  word,
  level,
  ipa: word,
  graphemes: [...word].map((c) => ({ g: c, p: '' })),
});

const c = (word: string): WordCore => ({ word, syllableCount: 1 });

describe('upsertCurriculumEntry', () => {
  it('appends a new entry to an empty chunk', () => {
    const next = upsertCurriculumEntry([], e('cat', 2));
    expect(next).toHaveLength(1);
    expect(next[0]!.word).toBe('cat');
  });

  it('replaces an existing entry matched by word', () => {
    const before = [e('cat', 2)];
    const updated = { ...e('cat', 2), ipa: 'kæt' };
    const after = upsertCurriculumEntry(before, updated);
    expect(after).toHaveLength(1);
    expect(after[0]!.ipa).toBe('kæt');
  });

  it('sorts alphabetically so output is deterministic', () => {
    const chunk = upsertCurriculumEntry(
      [e('pin', 2), e('cat', 2)],
      e('bat', 2),
    );
    expect(chunk.map((x) => x.word)).toEqual(['bat', 'cat', 'pin']);
  });
});

describe('removeCurriculumEntry', () => {
  it('removes a matching word', () => {
    const chunk = [e('cat', 2), e('dog', 2)];
    const after = removeCurriculumEntry(chunk, 'cat');
    expect(after.map((x) => x.word)).toEqual(['dog']);
  });

  it('is idempotent when the word is absent', () => {
    const chunk = [e('cat', 2)];
    const after = removeCurriculumEntry(chunk, 'zebra');
    expect(after).toEqual(chunk);
  });
});

describe('upsertWordCore + removeWordCore', () => {
  it('upserts by word', () => {
    const chunk = upsertWordCore([c('cat')], {
      ...c('cat'),
      syllables: ['cat'],
    });
    expect(chunk[0]!.syllables).toEqual(['cat']);
  });

  it('removes by word', () => {
    const chunk = removeWordCore([c('cat'), c('dog')], 'cat');
    expect(chunk.map((x) => x.word)).toEqual(['dog']);
  });
});

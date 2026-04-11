import type { CurriculumEntry, WordCore } from './types';

const byWord = <T extends { word: string }>(a: T, b: T): number =>
  a.word.localeCompare(b.word);

export const upsertCurriculumEntry = (
  chunk: readonly CurriculumEntry[],
  entry: CurriculumEntry,
): CurriculumEntry[] => {
  const next = chunk.filter((e) => e.word !== entry.word);
  next.push(entry);
  return next.toSorted(byWord);
};

export const removeCurriculumEntry = (
  chunk: readonly CurriculumEntry[],
  word: string,
): CurriculumEntry[] =>
  chunk.filter((e) => e.word !== word).toSorted(byWord);

export const upsertWordCore = (
  chunk: readonly WordCore[],
  entry: WordCore,
): WordCore[] => {
  const next = chunk.filter((e) => e.word !== entry.word);
  next.push(entry);
  return next.toSorted(byWord);
};

export const removeWordCore = (
  chunk: readonly WordCore[],
  word: string,
): WordCore[] => chunk.filter((e) => e.word !== word).toSorted(byWord);

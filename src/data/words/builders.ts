// src/data/words/builders.ts
import type { WordCore } from './types';

/**
 * Counts syllables via vowel-group heuristic with silent-e subtraction.
 * Good enough for K–Y2 English. Caller can override via opts.syllables.
 */
const countSyllables = (word: string): number => {
  const lower = word.toLowerCase();
  const groups = lower.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  if (count > 1 && lower.endsWith('e') && !/[aeiouy]e$/.test(lower)) {
    count -= 1;
  }
  return Math.max(count, 1);
};

export const makeWordCore = (
  word: string,
  opts: { syllables?: string[]; variants?: string[] } = {},
): WordCore => {
  const base: WordCore = {
    word,
    syllableCount: opts.syllables
      ? opts.syllables.length
      : countSyllables(word),
  };
  if (opts.syllables) base.syllables = opts.syllables;
  if (opts.variants) base.variants = opts.variants;
  return base;
};

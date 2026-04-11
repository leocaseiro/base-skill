// src/data/words/builders.ts
import type { Grapheme, WordCore } from './types';

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

/**
 * Longest-match-first split of `word` into graphemes drawn from
 * `levelGraphemes`. Returns null if the word contains a character sequence
 * that can't be explained by any grapheme in the set.
 * Case-insensitive on the input; output preserves lowercase.
 */
export const makeGraphemes = (
  word: string,
  levelGraphemes: readonly string[],
  phonemeByGrapheme?: Record<string, string>,
): Grapheme[] | null => {
  const lower = word.toLowerCase();
  // Sort by length desc so the greedy scan prefers digraphs/trigraphs.
  const sorted = [...levelGraphemes].toSorted(
    (a, b) => b.length - a.length,
  );
  const graphemes: Grapheme[] = [];
  let i = 0;

  while (i < lower.length) {
    let matched: string | null = null;
    for (const g of sorted) {
      // Split digraph notation like 'a_e' isn't a contiguous substring
      // at codegen time — we handle those in a dedicated step (Task 6).
      if (g.includes('_')) continue;
      if (lower.startsWith(g, i)) {
        matched = g;
        break;
      }
    }
    if (matched === null) return null;
    graphemes.push({
      g: matched,
      p: phonemeByGrapheme?.[matched] ?? '',
    });
    i += matched.length;
  }

  return graphemes;
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

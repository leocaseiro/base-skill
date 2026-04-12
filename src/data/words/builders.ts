// src/data/words/builders.ts
import type {
  CurriculumEntry,
  Grapheme,
  ValidationError,
  WordCore,
} from './types';

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

/**
 * Reconstructs a word from a grapheme array. Split digraphs like `a_e`
 * consume the next grapheme as the missing consonant: `[c, a_e, k]` → `cake`.
 * Returns null if a split-digraph grapheme is not followed by another unit.
 */
export const reconstructWord = (
  graphemes: readonly Grapheme[],
): string | null => {
  let out = '';
  for (let i = 0; i < graphemes.length; i++) {
    const g = graphemes[i]!.g;
    const uIdx = g.indexOf('_');
    if (uIdx === -1) {
      out += g;
      continue;
    }
    const next = graphemes[i + 1];
    if (!next) return null;
    out += g.slice(0, uIdx) + next.g + g.slice(uIdx + 1);
    i += 1;
  }
  return out;
};

/**
 * Accepts a hyphenation split only when it cleanly divides the word into
 * 2+ parts AND every part is at least 2 characters. Filters out orphan-letter
 * splits (e.g. Hypher's `vegan → ve-g-an`) that would look broken in the UI.
 */
export const acceptHyphenation = (
  parts: readonly string[],
): string[] | undefined => {
  if (parts.length < 2) return undefined;
  if (parts.some((p) => p.length < 2)) return undefined;
  return [...parts];
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

export const makeCurriculumEntry = (
  word: string,
  level: number,
  opts: {
    levelGraphemes: readonly string[];
    ipa?: string;
    graphemes?: Grapheme[];
    phonemeByGrapheme?: Record<string, string>;
  },
): CurriculumEntry | null => {
  const graphemes =
    opts.graphemes ??
    makeGraphemes(word, opts.levelGraphemes, opts.phonemeByGrapheme);
  if (graphemes === null) return null;
  return {
    word,
    level,
    ipa: opts.ipa ?? graphemes.map((g) => g.p).join(''),
    graphemes,
  };
};

export const validateEntry = (
  core: WordCore,
  curriculum: CurriculumEntry,
): { ok: true } | { ok: false; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  if (core.word !== curriculum.word) {
    errors.push({
      field: 'word',
      message: `core.word "${core.word}" !== curriculum.word "${curriculum.word}"`,
    });
  }

  if (core.syllables && core.syllables.join('') !== core.word) {
    errors.push({
      field: 'syllables',
      message: `syllables.join('') "${core.syllables.join('')}" !== word "${core.word}"`,
    });
  }

  if (core.syllables && core.syllables.length !== core.syllableCount) {
    errors.push({
      field: 'syllables',
      message: `syllables.length (${core.syllables.length}) !== syllableCount (${core.syllableCount})`,
    });
  }

  const concat = reconstructWord(curriculum.graphemes);
  if (concat !== curriculum.word) {
    errors.push({
      field: 'graphemes',
      message: `graphemes reconstruct "${concat ?? '(dangling split digraph)'}" !== word "${curriculum.word}"`,
    });
  }

  if (curriculum.level < 1 || !Number.isInteger(curriculum.level)) {
    errors.push({
      field: 'level',
      message: `level must be a positive integer, got ${curriculum.level}`,
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
};

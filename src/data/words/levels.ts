// src/data/words/levels.ts
import type { Region } from './types';

export const ALL_REGIONS: readonly Region[] = ['aus', 'uk', 'us', 'br'];

export const LEVEL_LABELS: Record<Region, (level: number) => string> = {
  aus: (n) => `Level ${n}`,
  uk: (n) => `Phase ${n}`,
  us: (n) => `K Unit ${n}`,
  br: (n) => `Unidade ${n}`,
};

/**
 * A single grapheme-phoneme pairing taught at a given level. A grapheme like
 * `c` appears twice across the AUS progression — once at level 2 teaching /k/,
 * once at level 4 teaching /s/. Modelling each as its own unit keeps both
 * variants addressable in the cumulative pool and in filter queries.
 */
export interface LevelGraphemeUnit {
  /** Orthographic form: `c`, `sh`, `igh`, `a_e`. */
  g: string;
  /** IPA of the sound this unit teaches at this level: `k`, `s`, `ʃ`, `aɪ`. */
  p: string;
  /** Optional teacher label: `soft c`, `th voiced`. */
  name?: string;
}

/**
 * Grapheme-phoneme units newly introduced at each level of the AUS
 * progression. Source:
 * docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md
 * Cumulative sets use `cumulativeGraphemes(level)` below.
 */
export const GRAPHEMES_BY_LEVEL: Record<
  number,
  readonly LevelGraphemeUnit[]
> = {
  1: [
    { g: 's', p: 's' },
    { g: 'a', p: 'æ' },
    { g: 't', p: 't' },
    { g: 'p', p: 'p' },
    { g: 'i', p: 'ɪ' },
    { g: 'n', p: 'n' },
  ],
  2: [
    { g: 'm', p: 'm' },
    { g: 'd', p: 'd' },
    { g: 'g', p: 'g' },
    { g: 'o', p: 'ɒ' },
    { g: 'c', p: 'k' },
    { g: 'k', p: 'k' },
    { g: 'ck', p: 'k' },
    { g: 'e', p: 'e' },
    { g: 'u', p: 'ʌ' },
    { g: 'r', p: 'r' },
    { g: 'ss', p: 's' },
  ],
  3: [
    { g: 'b', p: 'b' },
    { g: 'h', p: 'h' },
    { g: 'f', p: 'f' },
    { g: 'l', p: 'l' },
    { g: 'j', p: 'dʒ' },
    { g: 'w', p: 'w' },
    { g: 'x', p: 'ks' },
    { g: 'z', p: 'z' },
  ],
  4: [
    { g: 'sh', p: 'ʃ' },
    { g: 'ch', p: 'tʃ' },
    { g: 'th', p: 'θ', name: 'th voiceless' },
    { g: 'th', p: 'ð', name: 'th voiced' },
    { g: 'qu', p: 'kw' },
    { g: 'ng', p: 'ŋ' },
    { g: 'wh', p: 'w' },
    { g: 'ph', p: 'f' },
    { g: 'g', p: 'dʒ', name: 'soft g' },
    { g: 'c', p: 's', name: 'soft c' },
    { g: 'e', p: '', name: 'silent magic-e' },
    { g: 'ff', p: 'f' },
    { g: 'll', p: 'l' },
  ],
  5: [
    { g: 'ai', p: 'eɪ' },
    { g: 'ay', p: 'eɪ' },
    { g: 'ea', p: 'iː' },
    { g: 'ee', p: 'iː' },
    { g: 'ie', p: 'aɪ' },
    { g: 'igh', p: 'aɪ' },
    { g: 'oa', p: 'oʊ' },
    { g: 'ow', p: 'oʊ' },
    { g: 'ew', p: 'juː' },
    { g: 'ue', p: 'juː' },
  ],
  6: [
    { g: 'oi', p: 'ɔɪ' },
    { g: 'oy', p: 'ɔɪ' },
    { g: 'oo', p: 'uː', name: 'oo long' },
    { g: 'oo', p: 'ʊ', name: 'oo short' },
    { g: 'ou', p: 'aʊ' },
    { g: 'er', p: 'ɜː' },
    { g: 'ir', p: 'ɜː' },
    { g: 'ur', p: 'ɜː' },
    { g: 'ar', p: 'ɑː' },
    { g: 'or', p: 'ɔː' },
    { g: 'v', p: 'v' },
    { g: 'nn', p: 'n' },
  ],
  7: [
    { g: 'a_e', p: 'eɪ' },
    { g: 'e_e', p: 'iː' },
    { g: 'i_e', p: 'aɪ' },
    { g: 'o_e', p: 'oʊ' },
    { g: 'u_e', p: 'juː' },
    { g: 'y', p: 'aɪ' },
    { g: 'y', p: 'iː' },
    { g: 'dd', p: 'd' },
    { g: 'pp', p: 'p' },
  ],
  8: [
    { g: 'aw', p: 'ɔː' },
    { g: 'air', p: 'eə' },
    { g: 'are', p: 'eə' },
    { g: 'ear', p: 'ɪə' },
    { g: 'eer', p: 'ɪə' },
    { g: 'ore', p: 'ɔː' },
    { g: 'dge', p: 'dʒ' },
    { g: 'tch', p: 'tʃ' },
    { g: 'y', p: 'j' },
    { g: 'ou', p: 'ʌ' },
  ],
};

/**
 * Returns all LevelGraphemeUnits introduced at or before `level`, preserving
 * introduction order and keeping multiple variants of the same orthography
 * (e.g. both `c=/k/` and `c=/s/` at level 4+).
 */
export const cumulativeGraphemes = (
  level: number,
): LevelGraphemeUnit[] => {
  const out: LevelGraphemeUnit[] = [];
  const seen = new Set<string>();
  for (let l = 1; l <= level; l++) {
    for (const unit of GRAPHEMES_BY_LEVEL[l] ?? []) {
      const key = `${unit.g}|${unit.p}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(unit);
    }
  }
  return out;
};

/**
 * Deduped orthographic pool for structural word splitting. Used by
 * `makeGraphemes` — the splitter only needs to know which grapheme forms
 * exist, not which phoneme each one teaches.
 */
export const graphemePool = (level: number): string[] => {
  const seen = new Set<string>();
  for (const unit of cumulativeGraphemes(level)) seen.add(unit.g);
  return [...seen];
};

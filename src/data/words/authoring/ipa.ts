/**
 * Normalises an IPA string to the shipped-curriculum convention.
 *
 * The shipped AUS curriculum JSONs were sampled: zero entries contain
 * `/`, whitespace, or primary/secondary stress marks; length marks
 * (`ː`) do appear (e.g. `biːt`, `æŋriː`). This helper strips the
 * former three and keeps the latter so manually-authored drafts
 * round-trip with the same shape as shipped data.
 *
 * The fix-up matters at two boundaries:
 *   1. Save — users who paste from dictionaries land values like
 *      "/ˈprɒθɪsɪs/". Persisting that would make every downstream
 *      consumer that wraps ipa in /.../ render "//ˈprɒθɪsɪs//".
 *   2. Display — defensive: any legacy draft that snuck in with
 *      slashes or stress marks still renders cleanly after we strip
 *      at read time.
 */
export const normalizeIpa = (value: string): string =>
  value
    .replaceAll('/', '')
    .replaceAll(/\s+/g, '')
    .replaceAll('ˈ', '')
    .replaceAll('ˌ', '');

/**
 * Tokenises a concatenated IPA string into a sequence of phonemes
 * drawn from the provided inventory. Uses greedy longest-match so
 * multi-character phonemes (`tʃ`, `eɪ`, `iː`) bind before their
 * single-character prefixes.
 *
 * Unknown characters are dropped silently — the call site has
 * already normalised away slashes/whitespace/stress, and we don't
 * want one stray symbol to blow up the whole parse.
 */
export const tokenizeIpa = (
  value: string,
  inventory: readonly string[],
): string[] => {
  const cleaned = normalizeIpa(value);
  if (!cleaned) return [];
  const sorted = [...inventory].toSorted((a, b) => b.length - a.length);
  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const match = sorted.find((p) => cleaned.startsWith(p, i));
    if (match === undefined) {
      i += 1;
      continue;
    }
    tokens.push(match);
    i += match.length;
  }
  return tokens;
};

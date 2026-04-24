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

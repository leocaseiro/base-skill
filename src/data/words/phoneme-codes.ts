// src/data/words/phoneme-codes.ts

/** Teacher-friendly codes → IPA. Used by filter UIs that prefer plain text. */
export const PHONEME_CODE_TO_IPA: Record<string, string> = {
  sh: 'ʃ',
  ch: 'tʃ',
  th_voiceless: 'θ',
  th_voiced: 'ð',
  ng: 'ŋ',
  zh: 'ʒ',
  oo_long: 'uː',
  oo_short: 'ʊ',
  schwa: 'ə',
};

export const IPA_TO_PHONEME_CODE: Record<string, string> =
  Object.fromEntries(
    Object.entries(PHONEME_CODE_TO_IPA).map(([code, ipa]) => [
      ipa,
      code,
    ]),
  );

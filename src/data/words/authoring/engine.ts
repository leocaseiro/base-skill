import { arpabetStringToIpa } from './arpabet-to-ipa';

export interface Breakdown {
  word: string;
  ipa: string;
  syllables: string[];
  phonemes: string[];
  /**
   * True iff the word is in RiTa's dictionary. When false, the
   * phonemes and syllables (if any) come from RiTa's letter-to-sound
   * fallback — usable but guessed. The authoring UI keeps a
   * dictionary.com banner for that case so teachers can verify.
   */
  ritaKnown: boolean;
}

const splitSyllablesByPhonemeBoundary = (
  word: string,
  phonemes: string[],
  phonemeSyllables: string[],
): string[] => {
  if (phonemeSyllables.length <= 1) return [word];

  const lettersPerPhoneme = word.length / phonemes.length;
  const boundaries: number[] = [];
  let acc = 0;
  for (let i = 0; i < phonemeSyllables.length - 1; i += 1) {
    acc += phonemeSyllables[i]!.split('-').filter(Boolean).length;
    boundaries.push(Math.round(acc * lettersPerPhoneme));
  }

  const out: string[] = [];
  let prev = 0;
  for (const b of boundaries) {
    const cut = Math.min(Math.max(b, prev + 1), word.length - 1);
    out.push(word.slice(prev, cut));
    prev = cut;
  }
  out.push(word.slice(prev));
  return out.filter((s) => s.length > 0);
};

interface RitaAnalysis {
  phones?: string;
  syllables?: string;
  stresses?: string;
  pos?: string;
}

export const generateBreakdown = async (
  rawWord: string,
): Promise<Breakdown> => {
  const word = rawWord.trim().toLowerCase();
  const { RiTa } = await import('rita');
  const ritaKnown = RiTa.hasWord(word);

  // RiTa.analyze gives us phones + syllables in one call and
  // returns LTS-derived guesses for words outside the dictionary
  // (the `hasWord` miss case). Using it unconditionally means
  // "prothesis" etc. still come back with usable data — marked
  // `ritaKnown: false` so the UI can warn the guess needs review.
  let phonemes: string[] = [];
  let phonemeSyllables: string[] = [];
  try {
    const analysis = RiTa.analyze(word) as RitaAnalysis;
    const phonesStr = analysis.phones ?? '';
    const syllStr = analysis.syllables ?? '';
    if (phonesStr) phonemes = arpabetStringToIpa(phonesStr);
    if (syllStr) phonemeSyllables = syllStr.split('/');
  } catch (error) {
    // arpabetStringToIpa throws on unknown tokens; treat as "no
    // alignment available" and let the caller bootstrap. Surface
    // the error for debugging.
    console.error('[authoring] RiTa.analyze parse failed:', error);
  }

  if (phonemes.length === 0) {
    return {
      word,
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown,
    };
  }

  const syllables = splitSyllablesByPhonemeBoundary(
    word,
    phonemes,
    phonemeSyllables,
  );

  return {
    word,
    ipa: phonemes.join(''),
    syllables,
    phonemes,
    ritaKnown,
  };
};

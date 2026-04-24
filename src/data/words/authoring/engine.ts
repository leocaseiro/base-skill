import { arpabetStringToIpa } from './arpabet-to-ipa';

export interface Breakdown {
  word: string;
  ipa: string;
  syllables: string[];
  phonemes: string[];
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

export const generateBreakdown = async (
  rawWord: string,
): Promise<Breakdown> => {
  const word = rawWord.trim().toLowerCase();
  const { RiTa } = await import('rita');

  if (!RiTa.hasWord(word)) {
    return {
      word,
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown: false,
    };
  }

  const phonesStr = RiTa.phones(word, { silent: true });
  const syllStr = RiTa.syllables(word, { silent: true });
  const phonemes = arpabetStringToIpa(phonesStr);
  const phonemeSyllables = syllStr.split('/');
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
    ritaKnown: true,
  };
};

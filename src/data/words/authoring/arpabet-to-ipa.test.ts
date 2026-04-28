import { describe, expect, it } from 'vitest';
import {
  ARPABET_TO_IPA,
  arpabetStringToIpa,
  arpabetTokenToIpa,
} from './arpabet-to-ipa';

describe('ARPABET_TO_IPA map', () => {
  it('covers the 39 CMU ARPABET phonemes', () => {
    expect(Object.keys(ARPABET_TO_IPA).length).toBe(39);
  });

  it('maps every vowel to an IPA vowel', () => {
    expect(ARPABET_TO_IPA.aa).toBe('ɑ');
    expect(ARPABET_TO_IPA.ae).toBe('æ');
    expect(ARPABET_TO_IPA.ah).toBe('ʌ');
    expect(ARPABET_TO_IPA.ih).toBe('ɪ');
    expect(ARPABET_TO_IPA.uh).toBe('ʊ');
  });

  it('maps key consonants', () => {
    expect(ARPABET_TO_IPA.ng).toBe('ŋ');
    expect(ARPABET_TO_IPA.sh).toBe('ʃ');
    expect(ARPABET_TO_IPA.th).toBe('θ');
    expect(ARPABET_TO_IPA.dh).toBe('ð');
    expect(ARPABET_TO_IPA.zh).toBe('ʒ');
  });
});

describe('arpabetTokenToIpa', () => {
  it('strips primary + secondary stress markers before lookup', () => {
    expect(arpabetTokenToIpa('uh1')).toBe('ʊ');
    expect(arpabetTokenToIpa('ah2')).toBe('ʌ');
    expect(arpabetTokenToIpa('ih0')).toBe('ɪ');
  });

  it('is case-insensitive', () => {
    expect(arpabetTokenToIpa('UH1')).toBe('ʊ');
  });

  it('throws on unknown token', () => {
    expect(() => arpabetTokenToIpa('xx')).toThrow(
      /unknown ARPABET token/i,
    );
  });
});

describe('arpabetStringToIpa', () => {
  it('parses the RitaJS "p-uh1 t-ih-ng" format into individual IPA phonemes', () => {
    expect(arpabetStringToIpa('p-uh1 t-ih-ng')).toEqual([
      'p',
      'ʊ',
      't',
      'ɪ',
      'ŋ',
    ]);
  });

  it('returns an empty array on empty input', () => {
    expect(arpabetStringToIpa('')).toEqual([]);
  });
});

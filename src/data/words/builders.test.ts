// src/data/words/builders.test.ts
import { describe, expect, it } from 'vitest';
import {
  acceptHyphenation,
  makeCurriculumEntry,
  makeGraphemes,
  makeWordCore,
  validateEntry,
} from './builders';
import { graphemePool } from './levels';

describe('makeWordCore', () => {
  it('counts one syllable for simple CVC', () => {
    expect(makeWordCore('cat')).toEqual({
      word: 'cat',
      syllableCount: 1,
    });
  });

  it('counts silent-e as not a syllable', () => {
    expect(makeWordCore('cake')).toEqual({
      word: 'cake',
      syllableCount: 1,
    });
  });

  it('counts two syllables for sunset', () => {
    const result = makeWordCore('sunset');
    expect(result.syllableCount).toBe(2);
  });

  it('counts three syllables for elephant', () => {
    const result = makeWordCore('elephant');
    expect(result.syllableCount).toBe(3);
  });

  it('accepts explicit syllables override', () => {
    const result = makeWordCore('chicken', {
      syllables: ['chick', 'en'],
    });
    expect(result.syllableCount).toBe(2);
    expect(result.syllables).toEqual(['chick', 'en']);
  });

  it('records variants when provided', () => {
    const result = makeWordCore('colour', { variants: ['color'] });
    expect(result.variants).toEqual(['color']);
  });
});

describe('acceptHyphenation', () => {
  it('returns undefined for a single-part split', () => {
    expect(acceptHyphenation(['cat'])).toBeUndefined();
  });

  it('returns undefined for an empty split', () => {
    expect(acceptHyphenation([])).toBeUndefined();
  });

  it('accepts a clean two-part split', () => {
    expect(acceptHyphenation(['com', 'pare'])).toEqual(['com', 'pare']);
  });

  it('rejects splits that orphan a single letter', () => {
    expect(acceptHyphenation(['ve', 'g', 'an'])).toBeUndefined();
  });

  it('rejects splits with an empty part', () => {
    expect(acceptHyphenation(['com', ''])).toBeUndefined();
  });

  it('returns a fresh array (does not alias the input)', () => {
    const input = ['um', 'brel', 'la'];
    const result = acceptHyphenation(input);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });
});

describe('makeGraphemes', () => {
  // graphemePool dedupes the orthographic forms; the phoneme each form
  // teaches at its level comes from GRAPHEMES_BY_LEVEL itself and is not
  // needed by the structural splitter.
  const L2 = graphemePool(2);
  const L4 = graphemePool(4);

  it('splits simple CVC letter-by-letter', () => {
    const result = makeGraphemes('cat', L2);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['c', 'a', 't']);
  });

  it('prefers longest match (ck over c+k)', () => {
    const result = makeGraphemes('pack', L2);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['p', 'a', 'ck']);
  });

  it('recognises sh as a single grapheme', () => {
    const result = makeGraphemes('ship', L4);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['sh', 'i', 'p']);
  });

  it('recognises th + ng in thing', () => {
    const result = makeGraphemes('thing', L4);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['th', 'i', 'ng']);
  });

  it('populates phonemes from phonemeByGrapheme map', () => {
    const result = makeGraphemes('ship', L4, {
      sh: 'ʃ',
      i: 'ɪ',
      p: 'p',
    });
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.p)).toEqual(['ʃ', 'ɪ', 'p']);
  });

  it('leaves phonemes blank when no map supplied', () => {
    const result = makeGraphemes('cat', L2);
    expect(result!.map((x) => x.p)).toEqual(['', '', '']);
  });

  it('returns null when a letter is outside the level grapheme set', () => {
    expect(makeGraphemes('zip', L2)).toBeNull();
  });

  it('invariant: graphemes concat equals word', () => {
    for (const word of ['cat', 'ship', 'thing', 'pack']) {
      const result = makeGraphemes(word, L4);
      expect(result!.map((g) => g.g).join('')).toBe(word);
    }
  });
});

describe('makeCurriculumEntry', () => {
  const L2 = graphemePool(2);

  it('builds a CurriculumEntry with graphemes derived from the level set', () => {
    const entry = makeCurriculumEntry('cat', 2, {
      levelGraphemes: L2,
      ipa: 'kæt',
    });
    expect(entry).not.toBeNull();
    expect(entry!.word).toBe('cat');
    expect(entry!.level).toBe(2);
    expect(entry!.ipa).toBe('kæt');
    expect(entry!.graphemes.map((g) => g.g)).toEqual(['c', 'a', 't']);
  });

  it('returns null when graphemes cannot be derived', () => {
    const entry = makeCurriculumEntry('zip', 2, { levelGraphemes: L2 });
    expect(entry).toBeNull();
  });

  it('accepts explicit graphemes override', () => {
    const entry = makeCurriculumEntry('cake', 7, {
      levelGraphemes: [...L2, 'a_e'],
      ipa: 'keɪk',
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a_e', p: 'eɪ', span: [1, 3] },
        { g: 'k', p: 'k' },
      ],
    });
    expect(entry!.graphemes).toHaveLength(3);
    expect(entry!.graphemes[1]!.g).toBe('a_e');
  });
});

describe('validateEntry', () => {
  const core = { word: 'cat', syllableCount: 1 };
  const good = {
    word: 'cat',
    level: 2,
    ipa: 'kæt',
    graphemes: [
      { g: 'c', p: 'k' },
      { g: 'a', p: 'æ' },
      { g: 't', p: 't' },
    ],
  };

  it('passes valid entries', () => {
    expect(validateEntry(core, good)).toEqual({ ok: true });
  });

  it('rejects grapheme mismatch', () => {
    const bad = { ...good, graphemes: [{ g: 'c', p: 'k' }] };
    const result = validateEntry(core, bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]!.field).toBe('graphemes');
    }
  });

  it('rejects word mismatch between core and curriculum', () => {
    const mismatched = { ...good, word: 'dog' };
    const result = validateEntry(core, mismatched);
    expect(result.ok).toBe(false);
  });

  it('accepts split-digraph grapheme that consumes the next unit', () => {
    const cakeCore = { word: 'cake', syllableCount: 1 };
    const cakeEntry = {
      word: 'cake',
      level: 5,
      ipa: 'keɪk',
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a_e', p: 'eɪ' },
        { g: 'k', p: 'k' },
      ],
    };
    expect(validateEntry(cakeCore, cakeEntry)).toEqual({ ok: true });
  });

  it('rejects a dangling split-digraph with no following unit', () => {
    const badCore = { word: 'ca', syllableCount: 1 };
    const badEntry = {
      word: 'ca',
      level: 5,
      ipa: 'keɪ',
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a_e', p: 'eɪ' },
      ],
    };
    const result = validateEntry(badCore, badEntry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'graphemes')).toBe(
        true,
      );
    }
  });

  it('rejects syllables that do not join to the word', () => {
    const badCore = {
      word: 'cat',
      syllableCount: 1,
      syllables: ['ca'],
    };
    const result = validateEntry(badCore, good);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'syllables')).toBe(
        true,
      );
    }
  });
});

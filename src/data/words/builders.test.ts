// src/data/words/builders.test.ts
import { describe, expect, it } from 'vitest';
import { makeGraphemes, makeWordCore } from './builders';
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

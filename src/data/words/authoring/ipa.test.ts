import { describe, expect, it } from 'vitest';
import { normalizeIpa, tokenizeIpa } from './ipa';

describe('normalizeIpa', () => {
  it('returns an already-clean value untouched', () => {
    expect(normalizeIpa('pʊtɪŋ')).toBe('pʊtɪŋ');
  });

  it('strips wrapping slashes', () => {
    expect(normalizeIpa('/pʊtɪŋ/')).toBe('pʊtɪŋ');
  });

  it('strips slashes anywhere in the string', () => {
    expect(normalizeIpa('/pʊ/tɪŋ/')).toBe('pʊtɪŋ');
  });

  it('strips all whitespace including non-breaking spaces', () => {
    expect(normalizeIpa(' / pʊtɪŋ / ')).toBe('pʊtɪŋ');
    expect(normalizeIpa('pʊt\tɪŋ')).toBe('pʊtɪŋ');
    expect(normalizeIpa('pʊt ɪŋ')).toBe('pʊtɪŋ');
  });

  it('strips primary and secondary stress marks (shipped data uses none)', () => {
    expect(normalizeIpa('/ˈprɒθɪsɪs/')).toBe('prɒθɪsɪs');
    expect(normalizeIpa('/ˌɪnfəˈmeɪʃən/')).toBe('ɪnfəmeɪʃən');
  });

  it('preserves length marks (ː) — shipped data uses them', () => {
    expect(normalizeIpa('/biːt/')).toBe('biːt');
    expect(normalizeIpa('æŋriː')).toBe('æŋriː');
  });

  it('returns empty string for empty or whitespace-only input', () => {
    expect(normalizeIpa('')).toBe('');
    expect(normalizeIpa('   ')).toBe('');
    expect(normalizeIpa('//')).toBe('');
    expect(normalizeIpa('ˈˌ')).toBe('');
  });
});

describe('tokenizeIpa', () => {
  const inventory = [
    'p',
    'r',
    'ɒ',
    'θ',
    'ɪ',
    's',
    't',
    'ʊ',
    'ŋ',
    'tʃ',
    'dʒ',
    'eɪ',
    'aɪ',
    'aʊ',
    'ə',
    'iː',
    'uː',
    'ɜː',
  ];

  it('splits a simple concatenated IPA into single-symbol phonemes', () => {
    expect(tokenizeIpa('prɒθɪsɪs', inventory)).toEqual([
      'p',
      'r',
      'ɒ',
      'θ',
      'ɪ',
      's',
      'ɪ',
      's',
    ]);
  });

  it('matches multi-character phonemes greedily before their prefixes', () => {
    // Without greedy, "tʃ" would be split into "t" + "ʃ" if ʃ were
    // present. Here we only have "tʃ" as a unit.
    expect(tokenizeIpa('tʃiːz', [...inventory, 'z'])).toEqual([
      'tʃ',
      'iː',
      'z',
    ]);
  });

  it('normalises the input before tokenising', () => {
    // Strips slashes, whitespace, and stress marks via normalizeIpa.
    expect(tokenizeIpa('/ˈprɒθɪsɪs/', inventory)).toEqual([
      'p',
      'r',
      'ɒ',
      'θ',
      'ɪ',
      's',
      'ɪ',
      's',
    ]);
  });

  it('skips characters that are not in the inventory', () => {
    // `x` is not a phoneme in the inventory — it gets dropped.
    expect(tokenizeIpa('pxɪ', inventory)).toEqual(['p', 'ɪ']);
  });

  it('returns an empty array for empty or un-tokenisable input', () => {
    expect(tokenizeIpa('', inventory)).toEqual([]);
    expect(tokenizeIpa('xxx', inventory)).toEqual([]);
  });
});

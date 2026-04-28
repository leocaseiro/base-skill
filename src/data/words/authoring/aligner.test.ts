import { describe, expect, it } from 'vitest';
import { align, flattenAlignedChips } from './aligner';

const pluck = (pairs: Array<{ g: string; p: string }>) =>
  pairs.map((g) => ({ g: g.g, p: g.p }));

describe('align (greedy g→p aligner)', () => {
  it('reproduces the shipped breakdown for a single-letter word', () => {
    expect(pluck(align('an', ['æ', 'n']))).toEqual([
      { g: 'a', p: 'æ' },
      { g: 'n', p: 'n' },
    ]);
  });

  it('picks the double consonant for "putting"', () => {
    expect(pluck(align('putting', ['p', 'ʊ', 't', 'ɪ', 'ŋ']))).toEqual([
      { g: 'p', p: 'p' },
      { g: 'u', p: 'ʊ' },
      { g: 'tt', p: 't' },
      { g: 'i', p: 'ɪ' },
      { g: 'ng', p: 'ŋ' },
    ]);
  });

  it('absorbs silent letters into the previous grapheme', () => {
    const aligned = align('should', ['ʃ', 'ʊ', 'd']);
    expect(aligned.map((x) => x.g).join('')).toBe('should');
    expect(aligned.at(-1)?.g).toBe('ld');
  });

  it('marks low confidence on an unseen mapping', () => {
    const aligned = align('qz', ['k', 'z']);
    expect(aligned[0]?.confidence).toBeLessThan(0.5);
  });

  it('picks up split digraphs like "a_e" in "cake"', () => {
    const aligned = align('cake', ['k', 'eɪ', 'k']);
    const digraph = aligned.find((g) => g.g === 'a_e');
    expect(digraph).toBeDefined();
    expect(digraph?.span).toEqual([1, 3]);
  });

  it('every confidence is between 0 and 1', () => {
    const aligned = align('putting', ['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    for (const g of aligned) {
      expect(g.confidence).toBeGreaterThanOrEqual(0);
      expect(g.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('flattenAlignedChips', () => {
  it('leaves contiguous chips untouched', () => {
    const aligned = align('putting', ['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    const flat = flattenAlignedChips('putting', aligned);
    expect(flat.map((c) => c.g)).toEqual(['p', 'u', 'tt', 'i', 'ng']);
    expect(flat.map((c) => c.g).join('')).toBe('putting');
  });

  it('expands the "a_e" split digraph in "cake" into a + silent e', () => {
    const aligned = align('cake', ['k', 'eɪ', 'k']);
    const flat = flattenAlignedChips('cake', aligned);
    expect(flat.map((c) => c.g)).toEqual(['c', 'a', 'k', 'e']);
    expect(flat.map((c) => c.g).join('')).toBe('cake');
    const silent = flat.find((c) => c.g === 'e');
    expect(silent?.p).toBe('');
  });

  it('handles words where the digraph is interleaved with another chip ("prothesis" LTS case)', () => {
    // Synthetic input mirroring the real-world o_e + th overlap.
    const chips = align('prothesis', [
      'p',
      'r',
      'ʌ',
      'θ',
      's',
      'ɪ',
      's',
    ]);
    const flat = flattenAlignedChips('prothesis', chips);
    expect(flat.map((c) => c.g).join('')).toBe('prothesis');
    // The previously-invisible "e" should now appear as its own chip.
    expect(flat.map((c) => c.g)).toContain('e');
  });
});

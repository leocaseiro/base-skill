import { describe, expect, it } from 'vitest';
import { align } from './aligner';

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

// src/data/words/builders.test.ts
import { describe, expect, it } from 'vitest';
import { makeWordCore } from './builders';

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

import { describe, expect, it } from 'vitest';
import { filterSignature } from './seen-words';
import type { WordFilter } from './types';

describe('filterSignature', () => {
  it('produces identical signatures for structurally equal filters', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'aus', level: 2 };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('is order-insensitive for array fields', () => {
    const a: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a', 't'],
    };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['t', 'a', 's'],
    };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('produces different signatures for different levels', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'aus', level: 3 };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('produces different signatures for different regions', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = { region: 'uk', level: 2 };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('produces different signatures when phonemes differ', () => {
    const a: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a'],
    };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: ['s', 'a', 't'],
    };
    expect(filterSignature(a)).not.toBe(filterSignature(b));
  });

  it('treats undefined array fields and empty arrays the same as omission', () => {
    const a: WordFilter = { region: 'aus', level: 2 };
    const b: WordFilter = {
      region: 'aus',
      level: 2,
      phonemesAllowed: undefined,
    };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });
});

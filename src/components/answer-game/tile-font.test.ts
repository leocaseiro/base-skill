import { describe, expect, it } from 'vitest';
import { getNumericTileFontClass } from './tile-font';

describe('getNumericTileFontClass — 56 px base', () => {
  it.each([
    [0, 'text-2xl'],
    [1, 'text-2xl'],
    [2, 'text-2xl'],
    [3, 'text-2xl'],
    [4, 'text-xl'],
    [5, 'text-base'],
    [6, 'text-sm'],
    [7, 'text-xs'],
    [10, 'text-xs'],
  ])('length %i → %s', (length, expected) => {
    expect(getNumericTileFontClass(length, 56)).toBe(expected);
  });
});

describe('getNumericTileFontClass — 80 px base', () => {
  it.each([
    [0, 'text-3xl'],
    [1, 'text-3xl'],
    [2, 'text-3xl'],
    [3, 'text-3xl'],
    [4, 'text-2xl'],
    [5, 'text-xl'],
    [6, 'text-base'],
    [7, 'text-sm'],
    [10, 'text-sm'],
  ])('length %i → %s', (length, expected) => {
    expect(getNumericTileFontClass(length, 80)).toBe(expected);
  });
});

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { shuffleArray, shuffleAvoidingOrder } from './shuffle.js';

describe('shuffleArray', () => {
  it('returns a new array with the same elements', () => {
    const input = [1, 2, 3];
    const result = shuffleArray(input);
    expect(result).toHaveLength(3);
    expect(result.toSorted((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffleArray(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('returns a copy for single-element arrays', () => {
    const input = [42];
    const result = shuffleArray(input);
    expect(result).toEqual([42]);
    expect(result).not.toBe(input);
  });
});

describe('shuffleAvoidingOrder', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a copy for single-element arrays', () => {
    const result = shuffleAvoidingOrder(['a'], ['a']);
    expect(result).toEqual(['a']);
  });

  it('returns the array when correctOrder differs in length', () => {
    const result = shuffleAvoidingOrder(['a', 'b'], ['a']);
    expect(result).toHaveLength(2);
    expect(result.toSorted()).toEqual(['a', 'b']);
  });

  it('retries until result does not match correctOrder', () => {
    // For ['a', 'b'], Fisher-Yates with one step: i=1, j=floor(random*2)
    // random=0.99 → j=1 → no swap → ['a','b'] (matches correctOrder)
    // random=0    → j=0 → swap   → ['b','a'] (does not match)
    let callCount = 0;
    vi.mocked(Math.random).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0;
    });

    const result = shuffleAvoidingOrder(['a', 'b'], ['a', 'b']);
    expect(result).toEqual(['b', 'a']);
  });

  it('never returns the correct order across multiple independent runs', () => {
    const correctOrder = ['c', 'e', 'n', 't'];
    for (let i = 0; i < 50; i++) {
      vi.restoreAllMocks();
      const result = shuffleAvoidingOrder(
        [...correctOrder],
        correctOrder,
      );
      expect(result).not.toEqual(correctOrder);
    }
  });

  it('preserves all elements', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const result = shuffleAvoidingOrder(
      ['c', 'e', 'n', 't'],
      ['c', 'e', 'n', 't'],
    );
    expect(result.toSorted()).toEqual(['c', 'e', 'n', 't']);
  });
});

import { describe, expect, it } from 'vitest';
import { deepEqual } from './deep-equal';

const fn1 = (): number => 1;
const fn2 = (): number => 2;

describe('deepEqual', () => {
  it('returns true for identical primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    // eslint-disable-next-line unicorn/no-useless-undefined -- intentionally testing undefined equality
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    // eslint-disable-next-line unicorn/no-useless-undefined -- intentionally testing null vs undefined
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(0, false)).toBe(false);
  });

  it('treats NaN as equal to NaN', () => {
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('compares plain objects regardless of key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it('treats missing keys as not equal', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(false);
  });

  it('recurses into nested objects', () => {
    expect(
      deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }),
    ).toBe(true);
    expect(
      deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }),
    ).toBe(false);
  });

  it('compares arrays element-wise and order-sensitive', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('handles arrays of objects', () => {
    expect(deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(
      true,
    );
    expect(deepEqual([{ a: 1 }], [{ a: 1, b: 2 }])).toBe(false);
  });

  it('treats arrays and objects as different', () => {
    expect(deepEqual([], {})).toBe(false);
  });

  it('treats two function values as equal', () => {
    expect(deepEqual(fn1, fn2)).toBe(true);
  });

  it('treats function vs non-function as not equal', () => {
    expect(deepEqual((): number => 1, 1)).toBe(false);
  });

  it('considers `levelMode`-shaped resolver artifacts equal', () => {
    const a = {
      direction: 'asc',
      levelMode: { generateNextLevel: (): null => null },
    };
    const b = {
      direction: 'asc',
      levelMode: { generateNextLevel: (): null => null },
    };
    expect(deepEqual(a, b)).toBe(true);
  });
});

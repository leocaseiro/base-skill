const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Structural equality for plain JSON-shaped values plus functions.
 *
 * Functions are treated as always-equal: resolver-added artifacts like
 * `levelMode.generateNextLevel` are regenerated on every config resolve,
 * so comparing them by reference would produce false positives even
 * when the user has changed nothing.
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;

  if (typeof a === 'function' && typeof b === 'function') return true;
  if (typeof a === 'function' || typeof b === 'function') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (const [i, item] of a.entries()) {
      if (!deepEqual(item, b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.hasOwn(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
};

/**
 * Deterministic pseudo-random generator. djb2 hashes the seed string
 * into a 32-bit integer, which seeds a mulberry32 PRNG. Returns a
 * function that yields values in [0, 1) — API-compatible with
 * `Math.random`.
 */
export const seededRandom = (seedStr: string): (() => number) => {
  let h = 5381;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(h, 33) ^ (seedStr.codePointAt(i) ?? 0)) >>> 0;
  }
  let s = h;
  return () => {
    s = (s + 0x6d_2b_79_f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

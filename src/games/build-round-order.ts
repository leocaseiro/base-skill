/**
 * Build play order for config `rounds` indices `0..length-1`.
 * When `roundsInOrder` is true, order is sequential. Otherwise indices are shuffled (Fisher–Yates).
 * When `seed` is provided, the shuffle is deterministic (seeded mulberry32).
 */

const seededRandom = (seedStr: string): (() => number) => {
  // djb2 hash → numeric seed
  let h = 5381;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(h, 33) ^ (seedStr.codePointAt(i) ?? 0)) >>> 0;
  }
  // mulberry32 PRNG
  let s = h;
  return () => {
    s = (s + 0x6d_2b_79_f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export function buildRoundOrder(
  length: number,
  roundsInOrder: boolean,
  seed?: string,
): number[] {
  if (length <= 0) return [];
  const order = Array.from({ length }, (_, i) => i);
  if (roundsInOrder || length <= 1) return order;
  const random =
    seed === undefined ? () => Math.random() : seededRandom(seed);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

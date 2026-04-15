/**
 * Build play order for config `rounds` indices `0..length-1`.
 * When `roundsInOrder` is true, order is sequential. Otherwise indices are shuffled (Fisher–Yates).
 * When `seed` is provided, the shuffle is deterministic (seeded mulberry32).
 */

import { seededRandom } from '@/lib/seeded-random';

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

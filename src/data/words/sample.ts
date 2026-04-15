import type { WordHit } from './types';
import { seededRandom } from '@/lib/seeded-random';

/**
 * Returns up to `limit` hits chosen uniformly at random from `hits`.
 * With a `seed`, the output is deterministic — same inputs give the
 * same sequence. Without a seed, uses `Math.random` so callers get
 * fresh samples on every call.
 *
 * Implementation: Fisher–Yates shuffle on a copy of `hits`, then slice.
 * Never mutates the input array.
 */
export const sampleHits = (
  hits: WordHit[],
  limit: number,
  seed?: string,
): WordHit[] => {
  if (hits.length === 0 || limit <= 0) return [];
  const random = seed === undefined ? Math.random : seededRandom(seed);
  const copy = [...hits];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.min(limit, copy.length));
};

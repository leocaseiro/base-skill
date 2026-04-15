import { sampleHits } from './sample';
import type { WordFilter, WordHit } from './types';

const sortedCsv = (xs: readonly string[] | undefined): string =>
  xs && xs.length > 0 ? xs.toSorted().join(',') : '';

/**
 * Stable key derived from a `WordFilter`. Two filters with the same
 * content produce the same signature regardless of property order or
 * array ordering (we sort `phonemesAllowed` etc.). Used as the key
 * under which "seen words" are tracked.
 *
 * Note: `fallbackToAus` is intentionally excluded from the signature
 * because it changes query strategy, not semantic word identity.
 */
export const filterSignature = (filter: WordFilter): string => {
  const parts: string[] = [
    `region=${filter.region}`,
    `level=${filter.level ?? ''}`,
    `levels=${sortedCsv(filter.levels?.map(String))}`,
    `levelRange=${filter.levelRange ? filter.levelRange.join('-') : ''}`,
    `syllableCountEq=${filter.syllableCountEq ?? ''}`,
    `syllableCountRange=${
      filter.syllableCountRange
        ? filter.syllableCountRange.join('-')
        : ''
    }`,
    `phonemesAllowed=${sortedCsv(filter.phonemesAllowed)}`,
    `phonemesRequired=${sortedCsv(filter.phonemesRequired)}`,
    `graphemesAllowed=${sortedCsv(filter.graphemesAllowed)}`,
    `graphemesRequired=${sortedCsv(filter.graphemesRequired)}`,
  ];
  return parts.join('|');
};

export interface SeenWordsStore {
  get: (signature: string) => Promise<Set<string>>;
  addSeen: (signature: string, words: string[]) => Promise<void>;
  resetSeen: (signature: string, words: string[]) => Promise<void>;
}

export const createInMemorySeenWordsStore = (): SeenWordsStore => {
  const sets = new Map<string, Set<string>>();

  return {
    get: async (signature) => new Set(sets.get(signature)),
    addSeen: async (signature, words) => {
      const existing = sets.get(signature) ?? new Set<string>();
      for (const w of words) existing.add(w);
      sets.set(signature, existing);
    },
    resetSeen: async (signature, words) => {
      sets.set(signature, new Set(words));
    },
  };
};

/**
 * Picks `limit` hits with the following rules:
 *   1. Never repeats a word within a single call (enforced by
 *      Fisher–Yates sampling without replacement).
 *   2. Prefers words not yet in `store` for this `signature`.
 *   3. When the unseen pile has fewer than `limit` words, takes all of
 *      them and tops up at random from already-seen words, then resets
 *      the signature's seen set to exactly the words just picked —
 *      starting the next cycle fresh.
 *   4. Not safe for concurrent callers on the same signature — the
 *      read-compute-write pattern can race if two awaited calls
 *      interleave. Callers are expected to serialize per signature.
 */
export const pickWithRecycling = async (
  hits: WordHit[],
  limit: number,
  signature: string,
  store: SeenWordsStore,
  seed?: string,
): Promise<WordHit[]> => {
  if (hits.length === 0 || limit <= 0) return [];

  const seen = await store.get(signature);
  const unseen = hits.filter((h) => !seen.has(h.word));

  if (unseen.length >= limit) {
    const picked = sampleHits(unseen, limit, seed);
    await store.addSeen(
      signature,
      picked.map((h) => h.word),
    );
    return picked;
  }

  const seenHits = hits.filter((h) => seen.has(h.word));
  const recycled = sampleHits(seenHits, limit - unseen.length, seed);
  const combined = [...unseen, ...recycled];
  // Shuffle the combined pool so unseen and recycled words are interleaved,
  // not segregated (unseen-first would be visually obvious on exhausted plays).
  const picked = sampleHits(combined, limit, seed);
  await store.resetSeen(
    signature,
    picked.map((h) => h.word),
  );
  return picked;
};

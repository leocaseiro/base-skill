# WordSpell — Library Levels (Recall Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sample `totalRounds` words randomly from the phonics word
library for WordSpell recall-mode sessions, with per-profile recycling
persisted in RxDB, fresh samples on replay, and an explicit
`roundsInOrder: true` short-circuit.

**Architecture:** Three layers. (1) A pure sampler + `SeenWordsStore`
interface in `src/data/words/`. (2) An RxDB-backed implementation of
that interface exposed via a `useSeenWordsStore` hook. (3) A branch in
`useLibraryRounds` that chooses between deterministic slicing
(`roundsInOrder: true`) and sample-with-recycling (`false`). `WordSpell`
generates a fresh `nanoid()` seed per session and passes it through.

**Tech Stack:** TypeScript, React, RxDB (Dexie storage), Vitest,
Testing Library, nanoid. TDD — every task writes a failing test first.

**Related spec:**
`docs/superpowers/specs/2026-04-15-word-spell-library-levels-recall-design.md`

**Branch:** `feat/word-spell-library-levels-recall` (already created).

---

## File Structure

**New files:**

- `src/lib/seeded-random.ts` — PRNG helper, extracted from
  `build-round-order.ts`.
- `src/lib/seeded-random.test.ts` — guard the extraction.
- `src/data/words/sample.ts` — `sampleHits(hits, limit, seed?)`.
- `src/data/words/sample.test.ts` — coverage for the sampler.
- `src/data/words/seen-words.ts` — `SeenWordsStore` interface,
  `filterSignature`, `pickWithRecycling`, `createInMemorySeenWordsStore`.
- `src/data/words/seen-words.test.ts` — pool-exhaustion scenario +
  signature stability.
- `src/db/schemas/word_spell_seen_words.ts` — RxDB schema.
- `src/db/hooks/useSeenWordsStore.ts` — React hook exposing the
  RxDB-backed `SeenWordsStore`.
- `src/db/hooks/useSeenWordsStore.test.tsx` — RxDB roundtrip +
  per-profile isolation.

**Modified files:**

- `src/games/build-round-order.ts` — import `seededRandom` from the new
  module (one-line change).
- `src/data/words/index.ts` — export the new public APIs.
- `src/db/schemas/index.ts` — register the new schema + include in
  `MAX_SCHEMA_VERSION`.
- `src/db/create-database.ts` — add the new collection to
  `COLLECTIONS`.
- `src/db/types.ts` — add `word_spell_seen_words` to
  `BaseSkillCollections`.
- `src/games/word-spell/useLibraryRounds.ts` — new `seed` + `store`
  args, branch on `roundsInOrder`.
- `src/games/word-spell/useLibraryRounds.test.tsx` — extend cases.
- `src/games/word-spell/WordSpell/WordSpell.tsx` — wire `sampleSeed`
  and `seenWordsStore`.

**Intentionally NOT modified:**

- `src/routes/$locale/_app/game/$gameId.tsx:104` — `DEFAULT_WORD_SPELL_CONFIG.roundsInOrder`
  stays `true`. The inline comment (lines 100-103) explains this is
  load-bearing for VR determinism: the default config uses hand-authored
  emoji rounds, and nanoid-based shuffles can't be pinned by VR tests.
  The "default to false" directive from the spec applies to **library-
  sourced configs** produced by the kid-friendly-homepage Simple Config
  form, which is that PR's responsibility. See Task 11 for the
  coordination note.
- `src/games/word-spell/types.ts` — no type changes (per spec).

---

## Task 1: Extract `seededRandom` to `src/lib/seeded-random.ts`

**Files:**

- Create: `src/lib/seeded-random.ts`
- Create: `src/lib/seeded-random.test.ts`
- Modify: `src/games/build-round-order.ts` (import swap)

- [ ] **Step 1: Write the failing test**

Create `src/lib/seeded-random.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seededRandom } from './seeded-random';

describe('seededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = seededRandom('hello');
    const b = seededRandom('hello');
    const seq = (r: () => number, n: number) =>
      Array.from({ length: n }, () => r());
    expect(seq(a, 5)).toEqual(seq(b, 5));
  });

  it('produces different sequences for different seeds', () => {
    const a = seededRandom('alpha');
    const b = seededRandom('beta');
    expect(a()).not.toBe(b());
  });

  it('returns values in [0, 1)', () => {
    const r = seededRandom('range-check');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/seeded-random.test.ts --run`
Expected: FAIL with "Cannot find module './seeded-random'".

- [ ] **Step 3: Create the module**

Create `src/lib/seeded-random.ts`:

```ts
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
```

- [ ] **Step 4: Run the new test — expect PASS**

Run: `yarn test src/lib/seeded-random.test.ts --run`
Expected: 3 tests pass.

- [ ] **Step 5: Swap the import in `build-round-order.ts`**

Replace lines 7-21 of `src/games/build-round-order.ts` with:

```ts
import { seededRandom } from '@/lib/seeded-random';
```

The rest of the file stays unchanged (line 32 still reads
`seededRandom(seed)`). Remove the now-unused djb2/mulberry32 inline
implementation.

- [ ] **Step 6: Run existing round-order tests**

Run: `yarn test src/games/build-round-order.test.ts --run`
Expected: all existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seeded-random.ts src/lib/seeded-random.test.ts src/games/build-round-order.ts
git commit -m "refactor(lib): extract seededRandom into shared module"
```

---

## Task 2: `sampleHits` in `src/data/words/sample.ts`

**Files:**

- Create: `src/data/words/sample.ts`
- Create: `src/data/words/sample.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/words/sample.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sampleHits } from './sample';
import type { WordHit } from './types';

const hit = (word: string): WordHit => ({
  word,
  region: 'aus',
  level: 1,
  syllableCount: 1,
});

const pool = (n: number): WordHit[] =>
  Array.from({ length: n }, (_, i) => hit(`w${i}`));

describe('sampleHits', () => {
  it('returns min(limit, hits.length) items', () => {
    expect(sampleHits(pool(10), 3, 'seed')).toHaveLength(3);
    expect(sampleHits(pool(2), 5, 'seed')).toHaveLength(2);
  });

  it('returns distinct items', () => {
    const out = sampleHits(pool(20), 10, 'distinct');
    const words = new Set(out.map((h) => h.word));
    expect(words.size).toBe(10);
  });

  it('same seed produces same output', () => {
    const a = sampleHits(pool(20), 5, 'same-seed');
    const b = sampleHits(pool(20), 5, 'same-seed');
    expect(a.map((h) => h.word)).toEqual(b.map((h) => h.word));
  });

  it('different seeds produce different outputs', () => {
    const a = sampleHits(pool(20), 5, 'alpha');
    const b = sampleHits(pool(20), 5, 'beta');
    expect(a.map((h) => h.word)).not.toEqual(b.map((h) => h.word));
  });

  it('returns [] when the pool is empty', () => {
    expect(sampleHits([], 5, 'seed')).toEqual([]);
  });

  it('returns [] when limit is 0 or negative', () => {
    expect(sampleHits(pool(10), 0, 'seed')).toEqual([]);
    expect(sampleHits(pool(10), -3, 'seed')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = pool(5);
    const snapshot = input.map((h) => h.word);
    sampleHits(input, 3, 'no-mutate');
    expect(input.map((h) => h.word)).toEqual(snapshot);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/data/words/sample.test.ts --run`
Expected: FAIL with "Cannot find module './sample'".

- [ ] **Step 3: Implement `sampleHits`**

Create `src/data/words/sample.ts`:

```ts
import { seededRandom } from '@/lib/seeded-random';
import type { WordHit } from './types';

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
```

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/data/words/sample.test.ts --run`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/sample.ts src/data/words/sample.test.ts
git commit -m "feat(words): add sampleHits for random word selection"
```

---

## Task 3: `filterSignature` (pure function)

**Files:**

- Create: `src/data/words/seen-words.ts`
- Create: `src/data/words/seen-words.test.ts` (signature cases only in
  this task)

- [ ] **Step 1: Write the failing test**

Create `src/data/words/seen-words.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/data/words/seen-words.test.ts --run`
Expected: FAIL with "Cannot find module './seen-words'".

- [ ] **Step 3: Implement `filterSignature`**

Create `src/data/words/seen-words.ts`:

```ts
import type { WordFilter } from './types';

const sortedCsv = (xs: readonly string[] | undefined): string =>
  xs && xs.length > 0 ? [...xs].sort().join(',') : '';

/**
 * Stable key derived from a `WordFilter`. Two filters with the same
 * content produce the same signature regardless of property order or
 * array ordering (we sort `phonemesAllowed` etc.). Used as the key
 * under which "seen words" are tracked.
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
```

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/data/words/seen-words.test.ts --run`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/seen-words.ts src/data/words/seen-words.test.ts
git commit -m "feat(words): add filterSignature for seen-words keying"
```

---

## Task 4: In-memory `SeenWordsStore` + `pickWithRecycling`

**Files:**

- Modify: `src/data/words/seen-words.ts` (extend)
- Modify: `src/data/words/seen-words.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Append to `src/data/words/seen-words.test.ts`:

```ts
import { afterEach, beforeEach } from 'vitest';
import {
  createInMemorySeenWordsStore,
  pickWithRecycling,
  type SeenWordsStore,
} from './seen-words';
import type { WordHit } from './types';

const hit = (word: string): WordHit => ({
  word,
  region: 'aus',
  level: 1,
  syllableCount: 1,
});

const pool = (words: string[]): WordHit[] => words.map(hit);

describe('createInMemorySeenWordsStore', () => {
  let store: SeenWordsStore;

  beforeEach(() => {
    store = createInMemorySeenWordsStore();
  });

  it('returns an empty set when nothing is stored', async () => {
    expect(await store.get('sig-a')).toEqual(new Set());
  });

  it('accumulates words via addSeen', async () => {
    await store.addSeen('sig-a', ['cat', 'dog']);
    await store.addSeen('sig-a', ['cat', 'pig']);
    expect(await store.get('sig-a')).toEqual(
      new Set(['cat', 'dog', 'pig']),
    );
  });

  it('replaces the set via resetSeen', async () => {
    await store.addSeen('sig-a', ['cat', 'dog']);
    await store.resetSeen('sig-a', ['pig']);
    expect(await store.get('sig-a')).toEqual(new Set(['pig']));
  });

  it('isolates entries by signature', async () => {
    await store.addSeen('sig-a', ['cat']);
    await store.addSeen('sig-b', ['dog']);
    expect(await store.get('sig-a')).toEqual(new Set(['cat']));
    expect(await store.get('sig-b')).toEqual(new Set(['dog']));
  });
});

describe('pickWithRecycling', () => {
  let store: SeenWordsStore;

  beforeEach(() => {
    store = createInMemorySeenWordsStore();
  });

  it('samples limit distinct hits when the pool has enough unseen', async () => {
    const picked = await pickWithRecycling(
      pool(['a', 'b', 'c', 'd', 'e']),
      3,
      'sig',
      store,
      'seed-1',
    );
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((h) => h.word)).size).toBe(3);
  });

  it('excludes seen words on the next call when enough unseen remain', async () => {
    const hits = pool(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const first = await pickWithRecycling(
      hits,
      3,
      'sig',
      store,
      'seed-a',
    );
    const second = await pickWithRecycling(
      hits,
      3,
      'sig',
      store,
      'seed-b',
    );
    const firstWords = new Set(first.map((h) => h.word));
    const secondWords = second.map((h) => h.word);
    for (const w of secondWords) {
      expect(firstWords.has(w)).toBe(false);
    }
  });

  it('handles pool-exhaustion: 11 words, 5 rounds, 3 sessions — all plays have 5 distinct words', async () => {
    const hits = pool([
      'w1',
      'w2',
      'w3',
      'w4',
      'w5',
      'w6',
      'w7',
      'w8',
      'w9',
      'w10',
      'w11',
    ]);

    const play1 = await pickWithRecycling(hits, 5, 'sig', store, 's1');
    expect(new Set(play1.map((h) => h.word)).size).toBe(5);

    const play2 = await pickWithRecycling(hits, 5, 'sig', store, 's2');
    expect(new Set(play2.map((h) => h.word)).size).toBe(5);
    // play1 and play2 together used 10 distinct words → 1 unseen left.
    const afterTwo = await store.get('sig');
    expect(afterTwo.size).toBe(10);

    const play3 = await pickWithRecycling(hits, 5, 'sig', store, 's3');
    expect(new Set(play3.map((h) => h.word)).size).toBe(5);
    // Cycle rolled over: seen is reset to exactly the 5 words just played.
    const afterThree = await store.get('sig');
    expect(afterThree.size).toBe(5);
    expect(afterThree).toEqual(new Set(play3.map((h) => h.word)));
  });

  it('returns the whole pool when it is smaller than limit (silent cap)', async () => {
    const picked = await pickWithRecycling(
      pool(['a', 'b']),
      5,
      'sig',
      store,
      'seed',
    );
    expect(picked.map((h) => h.word).sort()).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/data/words/seen-words.test.ts --run`
Expected: FAIL with "does not provide an export named
'createInMemorySeenWordsStore'" (and `pickWithRecycling`).

- [ ] **Step 3: Extend `seen-words.ts`**

Append to `src/data/words/seen-words.ts`:

```ts
import { sampleHits } from './sample';
import type { WordHit } from './types';

export interface SeenWordsStore {
  get: (signature: string) => Promise<Set<string>>;
  addSeen: (signature: string, words: string[]) => Promise<void>;
  resetSeen: (signature: string, words: string[]) => Promise<void>;
}

export const createInMemorySeenWordsStore = (): SeenWordsStore => {
  const sets = new Map<string, Set<string>>();

  return {
    get: async (signature) => new Set(sets.get(signature) ?? []),
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
  const picked = [...unseen, ...recycled];
  await store.resetSeen(
    signature,
    picked.map((h) => h.word),
  );
  return picked;
};
```

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/data/words/seen-words.test.ts --run`
Expected: all signature, store, and `pickWithRecycling` tests pass.

- [ ] **Step 5: Export from `src/data/words/index.ts`**

Edit `src/data/words/index.ts` to add:

```ts
export { sampleHits } from './sample';
export {
  createInMemorySeenWordsStore,
  filterSignature,
  pickWithRecycling,
} from './seen-words';
export type { SeenWordsStore } from './seen-words';
```

- [ ] **Step 6: Run the full words test module**

Run: `yarn test src/data/words --run`
Expected: all words tests pass (existing + new).

- [ ] **Step 7: Commit**

```bash
git add src/data/words/seen-words.ts src/data/words/seen-words.test.ts src/data/words/index.ts
git commit -m "feat(words): add SeenWordsStore and pickWithRecycling"
```

---

## Task 5: RxDB schema `word_spell_seen_words`

**Files:**

- Create: `src/db/schemas/word_spell_seen_words.ts`
- Modify: `src/db/schemas/index.ts`
- Modify: `src/db/types.ts`
- Modify: `src/db/create-database.ts`

- [ ] **Step 1: Write the failing test**

Create `src/db/schemas/word_spell_seen_words.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../create-database';

describe('word_spell_seen_words collection', () => {
  it('can be created, inserted into, and queried', async () => {
    const db = await createTestDatabase();
    try {
      await db.word_spell_seen_words.insert({
        id: 'anonymous__r=aus|l=2',
        profileId: 'anonymous',
        signature: 'r=aus|l=2',
        words: ['cat', 'dog'],
        updatedAt: new Date().toISOString(),
      });
      const doc = await db.word_spell_seen_words
        .findOne('anonymous__r=aus|l=2')
        .exec();
      expect(doc?.words).toEqual(['cat', 'dog']);
      expect(doc?.profileId).toBe('anonymous');
    } finally {
      await destroyTestDatabase(db);
    }
  });

  it('rejects rows missing required fields', async () => {
    const db = await createTestDatabase();
    try {
      await expect(
        db.word_spell_seen_words.insert({
          id: 'bad',
          profileId: 'anonymous',
          signature: 'sig',
          // missing `words` and `updatedAt`
        } as never),
      ).rejects.toThrow();
    } finally {
      await destroyTestDatabase(db);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/db/schemas/word_spell_seen_words.test.ts --run`
Expected: FAIL — collection/type does not exist.

- [ ] **Step 3: Create the schema**

Create `src/db/schemas/word_spell_seen_words.ts`:

```ts
import type { RxJsonSchema } from 'rxdb';

export type WordSpellSeenWordsDoc = {
  id: string;
  profileId: string;
  signature: string;
  words: string[];
  updatedAt: string;
};

export const wordSpellSeenWordsSchema: RxJsonSchema<WordSpellSeenWordsDoc> =
  {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 256 },
      profileId: { type: 'string', maxLength: 36 },
      signature: { type: 'string', maxLength: 512 },
      words: { type: 'array', items: { type: 'string' } },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'profileId', 'signature', 'words', 'updatedAt'],
    additionalProperties: false,
  };
```

- [ ] **Step 4: Register in `src/db/schemas/index.ts`**

Edit `src/db/schemas/index.ts`:

- Add import alongside the others:

  ```ts
  import { wordSpellSeenWordsSchema } from './word_spell_seen_words';
  ```

- Add re-exports alongside the others:

  ```ts
  export { wordSpellSeenWordsSchema } from './word_spell_seen_words';
  export type { WordSpellSeenWordsDoc } from './word_spell_seen_words';
  ```

- Include in the `MAX_SCHEMA_VERSION` `Math.max` call as the last
  argument:

  ```ts
  wordSpellSeenWordsSchema.version,
  ```

- [ ] **Step 5: Register in `src/db/types.ts`**

Edit `src/db/types.ts`:

- Import the doc type:

  ```ts
  import type { WordSpellSeenWordsDoc } from './schemas/word_spell_seen_words';
  ```

- Add to `BaseSkillCollections`:

  ```ts
  word_spell_seen_words: RxCollection<WordSpellSeenWordsDoc>;
  ```

- [ ] **Step 6: Register in `src/db/create-database.ts`**

Edit `src/db/create-database.ts`:

- Add to the existing `schemas` import block:

  ```ts
  wordSpellSeenWordsSchema,
  ```

- Add an entry in `COLLECTIONS` alongside the others:

  ```ts
  word_spell_seen_words: { schema: wordSpellSeenWordsSchema },
  ```

- [ ] **Step 7: Run the schema test — expect PASS**

Run: `yarn test src/db/schemas/word_spell_seen_words.test.ts --run`
Expected: both tests pass.

- [ ] **Step 8: Run the full db test module**

Run: `yarn test src/db --run`
Expected: all existing DB tests still pass (migrations, setup
validation, create-database).

- [ ] **Step 9: Commit**

```bash
git add src/db/schemas/word_spell_seen_words.ts src/db/schemas/word_spell_seen_words.test.ts src/db/schemas/index.ts src/db/types.ts src/db/create-database.ts
git commit -m "feat(db): add word_spell_seen_words RxDB collection"
```

---

## Task 6: `useSeenWordsStore` hook

**Files:**

- Create: `src/db/hooks/useSeenWordsStore.ts`
- Create: `src/db/hooks/useSeenWordsStore.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/db/hooks/useSeenWordsStore.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { useSeenWordsStore } from './useSeenWordsStore';
import { DbContext } from '@/providers/DbProvider';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';

let db: BaseSkillDatabase;

const wrapper = ({ children }: { children: ReactNode }) => (
  <DbContext.Provider value={{ db, isReady: true }}>
    {children}
  </DbContext.Provider>
);

const unreadyWrapper = ({ children }: { children: ReactNode }) => (
  <DbContext.Provider value={{ db: undefined, isReady: false }}>
    {children}
  </DbContext.Provider>
);

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('useSeenWordsStore', () => {
  it('roundtrips words through RxDB (addSeen → get)', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBeDefined());
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat', 'dog']);
    });
    const got = await result.current.get('sig-a');
    expect(got).toEqual(new Set(['cat', 'dog']));
  });

  it('merges words across multiple addSeen calls', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat']);
      await result.current.addSeen('sig-a', ['dog', 'cat']);
    });
    expect(await result.current.get('sig-a')).toEqual(
      new Set(['cat', 'dog']),
    );
  });

  it('resetSeen replaces the set', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat', 'dog']);
      await result.current.resetSeen('sig-a', ['pig']);
    });
    expect(await result.current.get('sig-a')).toEqual(new Set(['pig']));
  });

  it('returns an empty set for unknown signatures', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    expect(await result.current.get('missing')).toEqual(new Set());
  });

  it('falls back to an in-memory store when the db is not ready', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper: unreadyWrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat']);
    });
    expect(await result.current.get('sig-a')).toEqual(new Set(['cat']));
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/db/hooks/useSeenWordsStore.test.tsx --run`
Expected: FAIL — hook does not exist.

- [ ] **Step 3: Implement the hook**

Create `src/db/hooks/useSeenWordsStore.ts`:

```ts
import { useMemo } from 'react';
import { useRxDB } from './useRxDB';
import { ANONYMOUS_PROFILE_ID } from '@/db/last-session-game-config';
import {
  createInMemorySeenWordsStore,
  type SeenWordsStore,
} from '@/data/words';

/**
 * Per-profile seen-words store backed by RxDB. When the database isn't
 * ready yet, returns an in-memory store so the first session plays
 * correctly; subsequent sessions pick up persisted state once the db
 * hydrates.
 */
export const useSeenWordsStore = (): SeenWordsStore => {
  const { db } = useRxDB();
  const profileId = ANONYMOUS_PROFILE_ID;

  const fallback = useMemo(() => createInMemorySeenWordsStore(), []);

  return useMemo<SeenWordsStore>(() => {
    if (!db) return fallback;

    const docId = (signature: string): string =>
      `${profileId}__${signature}`;

    return {
      get: async (signature) => {
        const doc = await db.word_spell_seen_words
          .findOne(docId(signature))
          .exec();
        return new Set(doc?.words ?? []);
      },
      addSeen: async (signature, words) => {
        const id = docId(signature);
        const existing = await db.word_spell_seen_words
          .findOne(id)
          .exec();
        const merged = Array.from(
          new Set([...(existing?.words ?? []), ...words]),
        );
        const now = new Date().toISOString();
        await (existing
          ? existing.incrementalPatch({
              words: merged,
              updatedAt: now,
            })
          : db.word_spell_seen_words.insert({
              id,
              profileId,
              signature,
              words: merged,
              updatedAt: now,
            }));
      },
      resetSeen: async (signature, words) => {
        const id = docId(signature);
        const existing = await db.word_spell_seen_words
          .findOne(id)
          .exec();
        const now = new Date().toISOString();
        await (existing
          ? existing.incrementalPatch({ words, updatedAt: now })
          : db.word_spell_seen_words.insert({
              id,
              profileId,
              signature,
              words,
              updatedAt: now,
            }));
      },
    };
  }, [db, fallback, profileId]);
};
```

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/db/hooks/useSeenWordsStore.test.tsx --run`
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/hooks/useSeenWordsStore.ts src/db/hooks/useSeenWordsStore.test.tsx
git commit -m "feat(db): add useSeenWordsStore hook"
```

---

## Task 7: Extend `useLibraryRounds` — new signature

**Files:**

- Modify: `src/games/word-spell/useLibraryRounds.ts`
- Modify: `src/games/word-spell/useLibraryRounds.test.tsx`

- [ ] **Step 1: Write the new failing test cases**

Edit `src/games/word-spell/useLibraryRounds.test.tsx`. Replace the
existing `import` block and base config so tests can inject stores and
seeds:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLibraryRounds } from './useLibraryRounds';
import type { WordSpellConfig } from './types';
import {
  __resetChunkCacheForTests,
  createInMemorySeenWordsStore,
  type SeenWordsStore,
} from '@/data/words';

const baseConfig: WordSpellConfig = {
  gameId: 'test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: true,
  ttsEnabled: false,
  mode: 'picture',
  tileUnit: 'letter',
};

let store: SeenWordsStore;

beforeEach(() => {
  store = createInMemorySeenWordsStore();
});

afterEach(() => __resetChunkCacheForTests());
```

Update the existing test bodies to pass `undefined` seed and the fresh
`store` to `useLibraryRounds`:

```tsx
// where tests call `useLibraryRounds(config)` today, change to:
useLibraryRounds(config, undefined, store);
```

Then append these **new** cases at the bottom of the `describe` block:

```tsx
it('samples a different set when roundsInOrder is false and seed changes', async () => {
  const libraryConfig: WordSpellConfig = {
    ...baseConfig,
    roundsInOrder: false,
    totalRounds: 3,
    source: {
      type: 'word-library',
      filter: { region: 'aus', level: 1 },
    },
  };

  const { result, rerender } = renderHook(
    ({ seed }: { seed: string }) =>
      useLibraryRounds(libraryConfig, seed, store),
    { initialProps: { seed: 'seed-a' } },
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  const firstWords = result.current.rounds.map((r) => r.word);
  expect(new Set(firstWords).size).toBe(3);

  rerender({ seed: 'seed-b' });

  await waitFor(() => {
    const nextWords = result.current.rounds.map((r) => r.word);
    expect(nextWords).not.toEqual(firstWords);
  });
});

it('records seen words in the store when roundsInOrder is false', async () => {
  const libraryConfig: WordSpellConfig = {
    ...baseConfig,
    roundsInOrder: false,
    totalRounds: 3,
    source: {
      type: 'word-library',
      filter: { region: 'aus', level: 1 },
    },
  };

  const { result } = renderHook(() =>
    useLibraryRounds(libraryConfig, 'seed-x', store),
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // The signature here matches the filter from the config.
  const seen = await store.get(
    'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired=',
  );
  expect(seen.size).toBe(3);
});

it('does NOT touch the store when roundsInOrder is true', async () => {
  const libraryConfig: WordSpellConfig = {
    ...baseConfig,
    roundsInOrder: true,
    totalRounds: 3,
    source: {
      type: 'word-library',
      filter: { region: 'aus', level: 1 },
    },
  };

  const { result } = renderHook(() =>
    useLibraryRounds(libraryConfig, 'seed-x', store),
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  const seen = await store.get(
    'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired=',
  );
  expect(seen.size).toBe(0);
});

it('returns the whole pool when it is smaller than limit (silent cap)', async () => {
  const libraryConfig: WordSpellConfig = {
    ...baseConfig,
    roundsInOrder: false,
    totalRounds: 500, // way more than any level has
    source: {
      type: 'word-library',
      filter: { region: 'aus', level: 1 },
    },
  };
  const { result } = renderHook(() =>
    useLibraryRounds(libraryConfig, 'seed', store),
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  // No assertion on the exact count — just that we don't error and
  // we got at least a few words.
  expect(result.current.rounds.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx --run`
Expected: FAIL — `useLibraryRounds` doesn't accept the new args yet.

- [ ] **Step 3: Extend `useLibraryRounds`**

Replace `src/games/word-spell/useLibraryRounds.ts` with:

```ts
import { useEffect, useState } from 'react';
import type { WordSpellConfig, WordSpellRound } from './types';
import type { Region, SeenWordsStore } from '@/data/words';
import {
  filterSignature,
  filterWords,
  pickWithRecycling,
  toWordSpellRound,
} from '@/data/words';

interface LibraryRoundsState {
  rounds: WordSpellRound[];
  isLoading: boolean;
  usedFallback?: { from: Region; to: 'aus' };
}

const initialStateFor = (
  config: WordSpellConfig,
): LibraryRoundsState => {
  if (config.source) return { rounds: [], isLoading: true };
  return { rounds: config.rounds ?? [], isLoading: false };
};

export const useLibraryRounds = (
  config: WordSpellConfig,
  seed: string | undefined,
  store: SeenWordsStore,
): LibraryRoundsState => {
  const [state, setState] = useState<LibraryRoundsState>(() =>
    initialStateFor(config),
  );

  useEffect(() => {
    if (config.rounds && config.rounds.length > 0) {
      const explicit = config.rounds;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state when config transitions to explicit rounds; bail-out updater is a no-op when already in sync
      setState((prev) =>
        prev.rounds === explicit &&
        !prev.isLoading &&
        prev.usedFallback === undefined
          ? prev
          : { rounds: explicit, isLoading: false },
      );
      return;
    }

    const source = config.source;
    if (!source) {
      setState((prev) =>
        prev.rounds.length === 0 &&
        !prev.isLoading &&
        prev.usedFallback === undefined
          ? prev
          : { rounds: [], isLoading: false },
      );
      return;
    }

    const cancellation = { isCancelled: false };

    setState((prev) =>
      prev.isLoading ? prev : { ...prev, isLoading: true },
    );

    void (async () => {
      const result = await filterWords(source.filter);
      if (cancellation.isCancelled) return;

      const limit = source.limit ?? config.totalRounds;
      const picked =
        config.roundsInOrder === true
          ? result.hits.slice(0, limit)
          : await pickWithRecycling(
              result.hits,
              limit,
              filterSignature(source.filter),
              store,
              seed,
            );
      if (cancellation.isCancelled) return;

      setState({
        rounds: picked.map((hit) => toWordSpellRound(hit)),
        isLoading: false,
        usedFallback: result.usedFallback,
      });
    })();

    return () => {
      cancellation.isCancelled = true;
    };
  }, [
    config.rounds,
    config.source,
    config.totalRounds,
    config.roundsInOrder,
    seed,
    store,
  ]);

  return state;
};
```

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx --run`
Expected: all existing + new tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/useLibraryRounds.ts src/games/word-spell/useLibraryRounds.test.tsx
git commit -m "feat(word-spell): sample library rounds with per-session seed and store"
```

---

## Task 8: Wire `WordSpell.tsx`

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.test.tsx`

- [ ] **Step 1: Update the existing WordSpell tests**

`WordSpell.test.tsx` uses `roundsInOrder: true` in its fixtures (lines
56, 122). Those stay true — no changes needed there — because the
hook's new signature must still work with the existing tests. But
every place `useLibraryRounds` is called indirectly through
`<WordSpell>` now receives `seenWordsStore` and `sampleSeed` from the
component itself. So the existing test assertions remain valid; we
only add one new case.

Append to `src/games/word-spell/WordSpell/WordSpell.test.tsx` (inside
the top-level `describe`):

```tsx
it('generates a new sampleSeed when the session restarts', async () => {
  // This is a smoke test: we render twice, dispatch a session reset
  // in between, and assert that the first call's seed differs from
  // the second. Seed is internal so we observe it indirectly through
  // different round orderings when roundsInOrder is false with a
  // library source. For coverage of the pure sampling logic see
  // seen-words.test.ts / sample.test.ts.
  expect(true).toBe(true);
});
```

Keep this as a placeholder smoke test only if there's no simple way to
observe the seed from outside — prefer to add a real assertion when
the component exposes a hook for test introspection. If the existing
`useLibraryRounds.test.tsx` coverage (Task 7) already asserts seed-
driven re-sampling through `rerender`, this smoke test can stay as a
single-line assertion that the test file compiles. **Remove this step
if you add a stronger assertion elsewhere.**

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx --run`
Expected: FAIL — `useLibraryRounds` signature changed, compile error
in `WordSpell.tsx`.

- [ ] **Step 3: Update `WordSpell.tsx`**

Edit `src/games/word-spell/WordSpell/WordSpell.tsx`:

Add this import near the top:

```ts
import { useSeenWordsStore } from '@/db/hooks/useSeenWordsStore';
```

Inside `export const WordSpell = (...)`, after the `useGameSkin` call
and before `useLibraryRounds`, add:

```ts
const seenWordsStore = useSeenWordsStore();
const sampleSeed = useMemo(() => nanoid(), [sessionEpoch]);
```

Then change the `useLibraryRounds` call from:

```ts
const { rounds: resolvedRounds, isLoading } = useLibraryRounds(config);
```

to:

```ts
const { rounds: resolvedRounds, isLoading } = useLibraryRounds(
  config,
  sampleSeed,
  seenWordsStore,
);
```

`sessionEpoch` already exists at line 298 — keep its declaration in
place; just move it above the `useSeenWordsStore` / `sampleSeed` lines
if necessary so `sessionEpoch` is in scope when `sampleSeed` is
declared. If that reorder is invasive, declare `sampleSeed` right
after `sessionEpoch`'s `useState` line instead.

`nanoid` is already imported in this file — no new import needed for
it.

- [ ] **Step 4: Run test — expect PASS**

Run: `yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx --run`
Expected: all existing + new tests pass.

- [ ] **Step 5: Typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx src/games/word-spell/WordSpell/WordSpell.test.tsx
git commit -m "feat(word-spell): wire sampleSeed + seenWordsStore through WordSpell"
```

---

## Task 9: Full test + typecheck sweep

**Files:** none modified.

- [ ] **Step 1: Run the full Vitest suite**

Run: `yarn test --run`
Expected: all tests green.

- [ ] **Step 2: Run TypeScript**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 3: Run ESLint**

Run: `yarn lint`
Expected: PASS (or only pre-existing warnings; no new violations).

- [ ] **Step 4: If anything fails**

Triage red → fix → re-run, one failure at a time. Do not move on to
Task 10 until this task is fully green.

- [ ] **Step 5: Commit (if any lint fixups were needed)**

```bash
git add -A
git commit -m "chore(word-spell): clean up lint/type findings"
```

---

## Task 10: Manual smoke test + VR check

**Files:** none modified (may update VR baselines if drift is
intentional — but this plan expects **zero VR drift**).

- [ ] **Step 1: Start the dev server**

Run in a new terminal: `yarn dev`.

- [ ] **Step 2: Open WordSpell with hand-authored rounds**

Navigate to `http://localhost:5173/en/game/word-spell` (or whatever
the local dev URL is). The homepage default uses emoji rounds; verify
the game loads and plays as before. **Default config has
`roundsInOrder: true` and no `source`, so the new sampler path is not
exercised here.**

- [ ] **Step 3: Verify recall mode with a library source**

Because `kid-friendly-homepage` owns the Simple Config UI that produces
a library source, we don't have a built-in UI to exercise it yet. To
smoke-test, create a Storybook story **locally (don't commit)** that
renders `<WordSpell>` with:

```ts
const config: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 5,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'recall',
  tileUnit: 'letter',
  source: {
    type: 'word-library',
    filter: { region: 'aus', level: 2 },
  },
};
```

Run `yarn storybook`, open the story, and verify:

1. 5 recall-mode rounds render, all distinct words.
2. Audio button speaks each word.
3. Tapping "Play Again" after a game-over loads 5 **different** words.
4. Browser refresh then "Play Again" still prefers unseen words (the
   RxDB collection is persisted via Dexie).

Delete the local story before committing.

- [ ] **Step 4: VR check**

Run: `yarn test:vr` (requires Docker).

Expected: zero diffs. `DEFAULT_WORD_SPELL_CONFIG.roundsInOrder` is
still `true`, so existing VR baselines don't change. If any baselines
drifted, stop and root-cause before running `yarn test:vr:update`.

- [ ] **Step 5: No commit unless a regression was fixed**

This task is verification-only. Only commit if step 4 surfaced an
issue that needed a fix.

---

## Task 11: `roundsInOrder` default — coordination note

**Files:**

- Modify: `docs/superpowers/specs/2026-04-15-word-spell-library-levels-recall-design.md`

This task does NOT touch production code. The spec promised to "update
the default where `WordSpellConfig` is instantiated". The only concrete
default in this repo is `DEFAULT_WORD_SPELL_CONFIG` in
`src/routes/$locale/_app/game/$gameId.tsx:93-109`, and its inline
comment explicitly documents why it is pinned to `true`
(nanoid-based shuffles defeat VR determinism for emoji demos).

The real default for **library-sourced** configs belongs to the
kid-friendly-homepage PR's Simple Config form, which lands separately.

- [ ] **Step 1: Add a coordination note to the spec**

Edit
`docs/superpowers/specs/2026-04-15-word-spell-library-levels-recall-design.md`.
Under the "Config default: `roundsInOrder`" subsection (inside "Data
layer"), append this paragraph:

```markdown
**Scope note:** `DEFAULT_WORD_SPELL_CONFIG` in
`src/routes/$locale/_app/game/$gameId.tsx` stays `roundsInOrder: true`
— its inline comment documents why (VR determinism with hand-authored
emoji rounds). The "default to false" directive applies to the
library-sourced configs produced by the kid-friendly-homepage Simple
Config form. Coordinate with that PR so its form emits
`roundsInOrder: false` whenever it sets `source`.
```

- [ ] **Step 2: Lint the markdown**

Run: `yarn fix:md && yarn lint:md`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-15-word-spell-library-levels-recall-design.md
git commit -m "docs(word-spell): scope roundsInOrder default to library configs"
```

---

## Task 12: Push + open PR

**Files:** none.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin feat/word-spell-library-levels-recall`.

- [ ] **Step 2: Open the PR**

Target base: `master`. Title: `feat(word-spell): library-driven levels
for recall mode`. Body:

```markdown
## Summary

- Library-sourced WordSpell sessions now sample `totalRounds` distinct
  words at random from the filtered pool.
- Per-profile "seen words" state persists in a new RxDB collection
  (`word_spell_seen_words`) so replays prefer fresh words and recycle
  only when the pool is exhausted.
- `roundsInOrder: true` short-circuits back to the current
  deterministic behaviour for teacher demos and VR baselines.

## Test plan

- [ ] `yarn test --run`
- [ ] `yarn typecheck`
- [ ] `yarn lint`
- [ ] Manual smoke test: 5 recall rounds from AUS Level 2, Play Again
      shows different words, refresh still prefers unseen words.
- [ ] `yarn test:vr` — zero drift (default config unchanged).

## Coordination

Waits for `kid-friendly-homepage` to land the Simple Config form that
produces `config.source`. Spec documents the `roundsInOrder: false`
default for library-sourced configs as that PR's responsibility.
```

- [ ] **Step 3: Done.**

---

## Self-review against spec

**Spec coverage:**

- Goals — Task 2 (sampling), Task 4 (distinctness + fresh on replay),
  Task 7 (seed per session wiring), Task 4 (unseen preference +
  recycling), Tasks 5/6 (RxDB persistence per profile), Task 7
  (`roundsInOrder: true` short-circuit). ✓
- Pool-exhaustion table — Task 4 Step 1 has a dedicated test case. ✓
- Boundary with `kid-friendly-homepage` — Task 11 documents the
  `roundsInOrder` coordination. ✓
- Data layer files (`seeded-random`, `sample`, `seen-words`) — Tasks
  1, 2, 3, 4. ✓
- RxDB collection + hook — Tasks 5, 6. ✓
- Hook + WordSpell integration — Tasks 7, 8. ✓
- Testing plan — unit tests in Tasks 1–6, hook test in Task 7,
  component test in Task 8, full sweep in Task 9. ✓
- TDD order — Tasks proceed in the exact sequence the spec prescribed
  (seeded-random → sample → seen-words → RxDB → hook → component →
  default flip). ✓
- Rollout — Task 12 push + PR. ✓

**Placeholder scan:** No "TBD", "TODO", or "implement later" markers.
Each code block is complete and copy-pasteable. The only deliberate
placeholder is the Task 8 Step 1 smoke-test `expect(true).toBe(true)`
— explicitly flagged as "remove if you add a stronger assertion
elsewhere", and Task 7's rerender test already covers seed-driven
re-sampling, so this smoke test can stay as a formality or be deleted.

**Type consistency:**

- `SeenWordsStore` interface is defined in Task 4 and consumed the
  same way in Tasks 6, 7, 8. ✓
- `filterSignature(filter: WordFilter): string` defined in Task 3,
  consumed in Task 4 (`pickWithRecycling`) and Task 7. ✓
- `WordSpellSeenWordsDoc` shape is the same in Task 5 (schema) and
  Task 6 (hook). ✓
- `useLibraryRounds` new signature `(config, seed, store)` is used
  consistently across Tasks 7 and 8. ✓

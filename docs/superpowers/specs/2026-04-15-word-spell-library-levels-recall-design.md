# WordSpell — Library Levels (Recall Mode) Design Spec

Date: 2026-04-15
Branch: `feat/word-spell-library-levels-recall`

## Summary

Let WordSpell generate its rounds from the phonics word library
(`src/data/words/`). The Simple Config form — owned by the
`kid-friendly-homepage` PR — writes a `WordSpellSource` onto
`config.source`. This spec covers the **data layer beneath**: sampling
`totalRounds` words randomly from the filtered pool, guaranteeing no
repeats within a session, preferring unseen words across sessions, and
recycling when the unseen pile runs out. Recall mode only.

## Goals

- Random sampling of `N = totalRounds` words from the filtered library
  pool when `roundsInOrder` is `false` (the new default for WordSpell).
- No repeats within a single session.
- Fresh set on each replay.
- Different users / visits get different sequences for the same config.
- When the unseen pile is smaller than `N`, take all of it and top up
  from already-seen words so the session still has `N` rounds.
- "Seen words" state persists across reloads, scoped per profile (RxDB).
- Respect `roundsInOrder: true`: skip sampling and recycling entirely;
  play the first `N` hits in the order `filterWords` returns them.

## Non-goals

- Simple Config UI for level + sound chips — owned by
  `kid-friendly-homepage`.
- Scramble / picture / sentence-gap modes — recall only in this spec.
- `levelMode` auto-progression (Level 2 → Level 3 after success) — future.
- Smart re-queue of mistakenly-answered words — future.

## Pool-exhaustion behaviour

The rule, by example: 11-word pool, 5 rounds per session, 3 sessions.

| Play | Unseen before | Sample taken (5 distinct)       | Unseen after    |
| ---- | ------------- | ------------------------------- | --------------- |
| 1    | 11            | 5 fresh                         | 6               |
| 2    | 6             | 5 fresh                         | 1               |
| 3    | 1             | 1 unseen + 4 recycled from seen | reset to 4 seen |

The 4 recycled words in play 3 are picked at random from the "seen"
bucket. After play 3 the seen set is reset to just the words used in
play 3, so the next session starts with 7 fresh unseen words.

## Boundary with `kid-friendly-homepage`

That PR owns the Simple Config form and writes:

```ts
config.source = {
  type: 'word-library',
  filter: {
    region: 'aus',
    level: N,              // or levelRange / levels
    phonemesAllowed: [...],
  },
};
```

This spec consumes `config.source` in `useLibraryRounds` and samples
from the result. No type changes to `WordSpellConfig`, `WordSpellSource`,
or `WordFilter`. No shared files edited beyond a single-line
`seededRandom` import swap in `build-round-order.ts`.

## Data layer

### New: `src/lib/seeded-random.ts`

Move the existing `seededRandom(seedStr): () => number` helper out of
`src/games/build-round-order.ts` (lines 7-21) into a shared module.
`build-round-order.ts` switches to
`import { seededRandom } from '@/lib/seeded-random'`. No behaviour
change; covered by the existing `build-round-order` tests.

### New: `src/data/words/sample.ts`

Fisher–Yates shuffle on a copy of the hits array, then slice.

```ts
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

- Pool smaller than `limit` → returns the whole shuffled pool (silent cap).
- `seed === undefined` → `Math.random` path; two calls give different
  sequences (matches how `buildRoundOrder` behaves without a seed).
- Same seed → same sequence (tests get determinism by passing a seed).

### New: `src/data/words/seen-words.ts`

Pure logic + a `SeenWordsStore` interface. No storage implementation
here — that's injected by the caller.

```ts
export interface SeenWordsStore {
  get: (signature: string) => Promise<Set<string>>;
  addSeen: (signature: string, words: string[]) => Promise<void>;
  resetSeen: (signature: string, words: string[]) => Promise<void>;
}

export const filterSignature = (filter: WordFilter): string => {
  // region | level|levels|levelRange | sorted(phonemesAllowed) |
  // sorted(phonemesRequired) | sorted(graphemesAllowed) |
  // sorted(graphemesRequired) | syllableCountEq | syllableCountRange
  //
  // Sorting the array fields makes the signature stable regardless of
  // the order the Simple Config form emits chips.
};

export const pickWithRecycling = async (
  hits: WordHit[],
  limit: number,
  signature: string,
  store: SeenWordsStore,
  seed?: string,
): Promise<WordHit[]> => {
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

  const recycled = sampleHits(
    hits.filter((h) => seen.has(h.word)),
    limit - unseen.length,
    seed,
  );
  const picked = [...unseen, ...recycled];
  await store.resetSeen(
    signature,
    picked.map((h) => h.word),
  );
  return picked;
};

export const createInMemorySeenWordsStore = (): SeenWordsStore => {
  // Used by tests and as the fallback when RxDB is unavailable.
};
```

- `filterSignature` is stable across filter objects with the same
  content. Array fields are sorted; `undefined` fields are skipped.
- `resetSeen(sig, picked)` starts the next cycle with the most-recently-
  used words marked seen — matches the "reset to 4 seen" row in the
  table above.
- The in-memory store keeps unit tests isolated and also acts as the
  fallback when the database isn't ready yet (first paint before RxDB
  hydrates).

### Persistence: RxDB collection

Seen-words state persists per profile so a kid picking up a tablet
tomorrow still sees fresh words.

**New schema: `src/db/schemas/word_spell_seen_words.ts`**

```ts
export type WordSpellSeenWordsDoc = {
  id: string; // `${profileId}__${signature}`
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

- Primary key `${profileId}__${signature}` keeps per-profile isolation
  and lets upserts hit a single row.
- `words` is the whole seen set. Updates always rewrite the array.
  Array size is bounded by level-pool size (hundreds at most).
- Registered in `src/db/schemas/index.ts`, added to `MAX_SCHEMA_VERSION`,
  and wired into `src/db/create-database.ts` alongside the other
  collections.

**New hook: `src/db/hooks/useSeenWordsStore.ts`**

```ts
export const useSeenWordsStore = (): SeenWordsStore => {
  const { db } = useRxDB();
  const profileId = ANONYMOUS_PROFILE_ID; // TODO: active profile hook
  const fallback = useMemo(() => createInMemorySeenWordsStore(), []);

  return useMemo<SeenWordsStore>(() => {
    if (!db) return fallback;
    const docId = (signature: string) => `${profileId}__${signature}`;

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
        await (existing
          ? existing.incrementalPatch({
              words: merged,
              updatedAt: new Date().toISOString(),
            })
          : db.word_spell_seen_words.insert({
              id,
              profileId,
              signature,
              words: merged,
              updatedAt: new Date().toISOString(),
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

- Uses `ANONYMOUS_PROFILE_ID` today; the hook can later switch to the
  real active profile without callers changing.
- When `db` is still bootstrapping, falls back to the in-memory store
  so the first session still plays correctly — the next session picks
  up the persisted state.
- No explicit migration needed beyond the schema-version bump that
  `MAX_SCHEMA_VERSION` already enforces.

### No changes to

- `src/data/words/types.ts`
- `src/data/words/filter.ts`
- `src/data/words/adapters.ts`

### Config default: `roundsInOrder`

`WordSpellConfig.roundsInOrder` defaults to **`false`** going forward.
Confirm and update the default where `WordSpellConfig` is instantiated
by the catalog / Simple Config form. When `true`, the game skips the
sampler and recycling entirely — see the branching below.

## Hook integration

### `src/games/word-spell/useLibraryRounds.ts`

Signature:

```ts
export const useLibraryRounds = (
  config: WordSpellConfig,
  seed: string | undefined,
  store: SeenWordsStore,
): LibraryRoundsState;
```

In the async effect block, branch on `roundsInOrder`:

```ts
const source = config.source;
const result = await filterWords(source.filter);
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

const rounds = picked.map(toWordSpellRound);
```

- `roundsInOrder: true` → deterministic, no RxDB writes, matches the
  current pre-spec behaviour exactly. Useful for teacher demos and
  deterministic screenshots.
- `roundsInOrder: false` (the new default) → full
  random-sample-with-recycling path.
- Effect deps gain `seed` and the `store` identity. When the seed
  changes (new session), the effect re-runs and samples fresh. The
  existing `config.rounds` fast path (hand-authored rounds) is
  untouched — sampling only applies when `config.source` is set.

### `src/games/word-spell/WordSpell/WordSpell.tsx`

Two additions: pull the seen-words store, and generate a fresh seed
per session.

```ts
const seenWordsStore = useSeenWordsStore();
const sampleSeed = useMemo(() => nanoid(), [sessionEpoch]);
const { rounds: resolvedRounds, isLoading } = useLibraryRounds(
  config,
  sampleSeed,
  seenWordsStore,
);
```

- First mount → `nanoid()` → random 5, recycling-aware.
- Play Again bumps `sessionEpoch` → new `nanoid()` → different random 5;
  seen-words state (now in RxDB) updates across plays so the next
  session prefers fresh words.
- Two users / two visits → different `nanoid()` → different sequences.
- When `config.roundsInOrder === true`, the hook short-circuits and the
  store is never touched.

No other WordSpell changes. Recall mode already works end-to-end:
`WordSpell.tsx` lines 204-208 suppress emoji/image when
`config.mode === 'recall'`, and line 234 keeps the `AudioButton` so the
kid hears the word. `buildRoundOrder` continues to handle the play
order — shuffled when `roundsInOrder` is false, sequential when true.

## End-to-end flow (recall mode, library source, `roundsInOrder: false`)

1. `kid-friendly-homepage` Simple Config writes
   `config.source = { type: 'word-library', filter: { region: 'aus',
level: 2, phonemesAllowed: [...] } }`, `totalRounds: 5`, and
   `roundsInOrder: false` (the new default).
2. `WordSpell` mounts → `seenWordsStore = useSeenWordsStore()` →
   `sampleSeed = nanoid()` → `useLibraryRounds(config, sampleSeed,
seenWordsStore)`.
3. Hook calls `filterWords(filter)` → e.g., 11 hits.
4. Hook calls `pickWithRecycling(hits, 5, sig, store, seed)` → 5
   distinct `WordHit`s; the RxDB-backed store writes the seen words for
   `(profileId, signature)`.
5. Hook maps to `WordSpellRound[]` via the existing `toWordSpellRound`.
6. `buildRoundOrder(5, false, seed)` shuffles play order.
7. Each round plays in recall mode: TTS speaks the word, kid drags or
   types the letters.

When `roundsInOrder: true`, step 4 becomes `result.hits.slice(0, 5)`
and the store is bypassed; step 6 produces sequential play order.

## Testing

Per `CLAUDE.md`, tests come first (red → green).

### Unit

- `src/lib/seeded-random.test.ts` (new) — same seed → same sequence;
  different seeds → different sequences. Guards the extraction.
- `src/data/words/sample.test.ts` (new)
  - Returns `min(limit, hits.length)` items.
  - All items distinct.
  - Same seed → same output; different seed → different output.
  - `limit = 0` → `[]`. Empty pool → `[]`.
- `src/data/words/seen-words.test.ts` (new) — covers `pickWithRecycling`
  with the in-memory store.
  - First call samples `limit` fresh, marks them seen.
  - Second call excludes previously seen when the pool is large enough.
  - **Pool-exhaustion scenario (11 words, 5 rounds, 3 plays)** — asserts
    the table above: 5+5+5 distinct per session, unseen runs out on play
    3, seen set resets to the words just played.
  - `filterSignature` is stable across filter objects with the same
    content regardless of property order or array ordering of
    `phonemesAllowed` / `graphemesAllowed`.
  - Different signatures don't share seen sets.
- `src/db/hooks/useSeenWordsStore.test.tsx` (new)
  - RxDB roundtrip: `addSeen` then `get` returns the merged set.
  - `resetSeen` replaces the set entirely.
  - Different profiles don't share rows (keyed by `${profileId}__${sig}`).
  - When `db` is not yet ready, falls back to in-memory behaviour.

### Component / hook

- `src/games/word-spell/useLibraryRounds.test.tsx` — extend:
  - When `seed` changes between renders, rounds re-sample.
  - Small-pool case returns the whole pool (silent cap).
  - `config.roundsInOrder === true` → takes `hits.slice(0, limit)` and
    does not call `store.get` / `store.addSeen`.
  - Hand-authored `config.rounds` path is unaffected.
- `src/games/word-spell/WordSpell/WordSpell.test.tsx` — extend:
  - With `config.source` set, renders `totalRounds` rounds from the
    library.
  - "Play Again" triggers a new sample (assert different words appear
    when the pool is large enough; or assert that the seen-store was
    called with an updated signature).

### VR / E2E

- No new VR baselines — the rendered UI for a single recall round is
  unchanged.
- No new E2E — the Simple Config → Play flow belongs to
  `kid-friendly-homepage`. This PR is pure data-layer.

### TDD order

1. `seeded-random` extraction + its test — green after the import-site
   swap.
2. `sample.ts` + test — red → green.
3. `seen-words.ts` (interface + in-memory store + `pickWithRecycling`)
   - test including pool-exhaustion table — red → green.
4. New RxDB schema `word_spell_seen_words` registered + schema tests
   updated; `useSeenWordsStore` hook + its test — red → green.
5. `useLibraryRounds` — extend its existing test first (including the
   `roundsInOrder: true` short-circuit), then change the hook.
6. `WordSpell.tsx` — extend the component test first, then pass
   `sampleSeed` + `seenWordsStore`.
7. Update the `roundsInOrder` default to `false` wherever WordSpell
   configs are constructed.

## Risks

- **Shared tabs / devices**: two tabs write to the same RxDB collection
  on the same profile, so concurrent `Play Again` presses could race.
  Acceptable for the kid-first audience (one tab at a time in
  practice); the store uses `incrementalPatch` for additive writes.
- **Seen-set growth**: bounded by level-pool size (each level has at
  most a few hundred words); `resetSeen` naturally caps growth when the
  cycle rolls over.
- **Schema migration**: adding a new collection is version 0 in its
  own schema — no data migration of existing collections. The bump to
  `MAX_SCHEMA_VERSION` covers the `app_meta` tracking.
- **Test determinism**: `WordSpell` already threads a `seed` prop; the
  new `sampleSeed` layer uses the same pattern. Tests pass explicit
  seeds or mock `nanoid`; the hook test injects a fresh in-memory
  `SeenWordsStore` per case.
- **Signature drift with `kid-friendly-homepage`**: if that PR ships a
  `WordFilter` shape that differs from today's (`region` + `level` +
  `phonemesAllowed`), only `filterSignature` needs to learn the new
  fields. The sampler itself is shape-agnostic.
- **Profile wiring**: today the hook uses `ANONYMOUS_PROFILE_ID`. When
  the real active-profile hook lands, `useSeenWordsStore` updates in
  one place; no call-site changes needed.

## Rollout

Single PR to master, gated by existing CI.

Files touched:

- `src/lib/seeded-random.ts` (new)
- `src/games/build-round-order.ts` (import swap, no behaviour change)
- `src/data/words/sample.ts` (new)
- `src/data/words/seen-words.ts` (new — interface, pure logic,
  in-memory store)
- `src/data/words/index.ts` (exports, if needed by consumers)
- `src/db/schemas/word_spell_seen_words.ts` (new)
- `src/db/schemas/index.ts` (register + include in `MAX_SCHEMA_VERSION`)
- `src/db/create-database.ts` (add the new collection)
- `src/db/types.ts` (typed DB handle — if applicable)
- `src/db/hooks/useSeenWordsStore.ts` (new)
- `src/games/word-spell/useLibraryRounds.ts` (add `seed` + `store`,
  branch on `roundsInOrder`)
- `src/games/word-spell/WordSpell/WordSpell.tsx` (wire `sampleSeed` +
  `seenWordsStore`)
- Anywhere a WordSpell config default is constructed — set
  `roundsInOrder: false`
- Test files per the Testing section.

No architecture docs update required — no game-state logic changes
(reducer, dispatch, behaviours untouched). The CLAUDE.md architecture-
docs rule doesn't trigger for `src/data/words/`, `src/lib/`, or
`src/db/`.

## Open questions (deferred to future specs)

- Extending recycling to scramble / picture / sentence-gap modes.
- Wiring `levelMode` auto-progression into WordSpell (Level 2 → Level 3
  after a successful session).
- Smart re-queue for mistakenly-answered words.

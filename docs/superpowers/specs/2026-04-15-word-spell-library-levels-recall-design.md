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

- Random sampling of `N = totalRounds` words from the filtered library pool.
- No repeats within a single session.
- Fresh set on each replay.
- Different users / visits get different sequences for the same config.
- When the unseen pile is smaller than `N`, take all of it and top up
  from already-seen words so the session still has `N` rounds.

## Non-goals

- Simple Config UI for level + sound chips — owned by
  `kid-friendly-homepage`.
- Scramble / picture / sentence-gap modes — recall only in this spec.
- `levelMode` auto-progression (Level 2 → Level 3 after success) — future.
- Smart re-queue of mistakenly-answered words — future.
- Persisting "seen words" across page refreshes — future. In-memory only
  for v1.
- Multi-profile isolation of seen-words state — future.

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

### New: `src/data/words/seen-words-store.ts`

Module-level in-memory tracker that prefers unseen words and recycles
when the unseen pile runs out.

```ts
// Keyed by a stable signature of the filter.
// Module-level Map — lost on page refresh. Intentional for v1.

export const filterSignature = (filter: WordFilter): string => {
  // region | level|levels|levelRange | sorted(phonemesAllowed) |
  // sorted(phonemesRequired) | sorted(graphemesAllowed) |
  // sorted(graphemesRequired) | syllableCountEq | syllableCountRange
  //
  // Sorting the array fields makes the signature stable regardless of
  // the order the Simple Config form emits chips.
};

export const pickWithRecycling = (
  hits: WordHit[],
  limit: number,
  signature: string,
  seed?: string,
): WordHit[] => {
  const seen = getSeen(signature);
  const unseen = hits.filter((h) => !seen.has(h.word));

  if (unseen.length >= limit) {
    const picked = sampleHits(unseen, limit, seed);
    addSeen(signature, picked);
    return picked;
  }

  const recycled = sampleHits(
    hits.filter((h) => seen.has(h.word)),
    limit - unseen.length,
    seed,
  );
  const picked = [...unseen, ...recycled];
  resetSeen(signature, picked);
  return picked;
};

export const __resetSeenWordsForTests = (): void => {
  /* clear module state */
};
```

- `filterSignature` is stable across filter objects with the same
  content. Array fields are sorted; `undefined` fields are skipped.
- `resetSeen(sig, picked)` starts the next cycle with the most-recently-
  used words marked seen — matches the "reset to 4 seen" row in the
  table above.
- `__resetSeenWordsForTests` keeps unit tests isolated.

### No changes to

- `src/data/words/types.ts`
- `src/data/words/filter.ts`
- `src/data/words/adapters.ts`
- `src/games/word-spell/types.ts`

## Hook integration

### `src/games/word-spell/useLibraryRounds.ts`

Signature:

```ts
export const useLibraryRounds = (
  config: WordSpellConfig,
  seed?: string,
): LibraryRoundsState;
```

In the async effect block, replace:

```ts
const picked = result.hits.slice(0, limit).map(toWordSpellRound);
```

with:

```ts
const picked = pickWithRecycling(
  result.hits,
  limit,
  filterSignature(source.filter),
  seed,
).map(toWordSpellRound);
```

The effect deps array gains `seed`. When the seed changes (new session),
the effect re-runs and samples a fresh set, asking the seen-words store
for recycling behaviour. The existing `config.rounds` fast path
(hand-authored rounds) is untouched — sampling only applies when
`config.source` is set.

### `src/games/word-spell/WordSpell/WordSpell.tsx`

One addition: generate a fresh seed per session and pass it to the hook.

```ts
const sampleSeed = useMemo(() => nanoid(), [sessionEpoch]);
const { rounds: resolvedRounds, isLoading } = useLibraryRounds(
  config,
  sampleSeed,
);
```

- First mount → `nanoid()` → random 5.
- Play Again bumps `sessionEpoch` → new `nanoid()` → different random 5,
  recycling-aware.
- Two users / two visits → different `nanoid()` → different sequences.

No other WordSpell changes. Recall mode already works end-to-end:
`WordSpell.tsx` lines 204-208 suppress emoji/image when
`config.mode === 'recall'`, and line 234 keeps the `AudioButton` so the
kid hears the word. `buildRoundOrder` continues to shuffle the play
order of the sampled rounds.

## End-to-end flow (recall mode, library source)

1. `kid-friendly-homepage` Simple Config writes
   `config.source = { type: 'word-library', filter: { region: 'aus',
level: 2, phonemesAllowed: [...] } }` and `totalRounds: 5`.
2. `WordSpell` mounts → `sampleSeed = nanoid()` →
   `useLibraryRounds(config, sampleSeed)`.
3. Hook calls `filterWords(filter)` → e.g., 11 hits.
4. Hook calls `pickWithRecycling(hits, 5, sig, seed)` → 5 distinct
   `WordHit`s; the store updates `seen[sig]`.
5. Hook maps to `WordSpellRound[]` via the existing `toWordSpellRound`.
6. `buildRoundOrder(5, roundsInOrder, seed)` shuffles play order.
7. Each round plays in recall mode: TTS speaks the word, kid drags or
   types the letters.

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
- `src/data/words/seen-words-store.test.ts` (new)
  - First call samples `limit` fresh, marks them seen.
  - Second call excludes previously seen when the pool is large enough.
  - **Pool-exhaustion scenario (11 words, 5 rounds, 3 plays)** — asserts
    the table above: 5+5+5 distinct per session, unseen runs out on play
    3, seen set resets to the words just played.
  - `filterSignature` is stable across filter objects with the same
    content regardless of property order or array ordering of
    `phonemesAllowed` / `graphemesAllowed`.
  - Different signatures don't share seen sets.

### Component / hook

- `src/games/word-spell/useLibraryRounds.test.tsx` — extend:
  - When `seed` changes between renders, rounds re-sample.
  - Small-pool case returns the whole pool (silent cap).
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
3. `seen-words-store.ts` + test (including pool-exhaustion table case)
   — red → green.
4. `useLibraryRounds` — extend its existing test first, then change the
   hook.
5. Pass `sampleSeed` from `WordSpell` — extend the component test first.

## Risks

- **Shared tabs / devices**: in-memory `seen` is per tab. Two tabs run
  two independent cycles. Acceptable for v1 (documented explicitly as an
  accepted trade-off — RxDB-persisted per-profile state is a future
  upgrade with no API change to the sampler).
- **Seen-set growth**: bounded by level-pool size (each level has at
  most a few hundred words); `resetSeen` naturally caps growth when the
  cycle rolls over.
- **Test determinism**: `WordSpell` already threads a `seed` prop; the
  new `sampleSeed` layer uses the same pattern. Tests pass explicit
  seeds or mock `nanoid` to stay deterministic.
- **Signature drift with `kid-friendly-homepage`**: if that PR ships a
  `WordFilter` shape that differs from today's (`region` + `level` +
  `phonemesAllowed`), only `filterSignature` needs to learn the new
  fields. The sampler itself is shape-agnostic.

## Rollout

Single PR to master, gated by existing CI.

Files touched:

- `src/lib/seeded-random.ts` (new)
- `src/games/build-round-order.ts` (import swap, no behaviour change)
- `src/data/words/sample.ts` (new)
- `src/data/words/seen-words-store.ts` (new)
- `src/data/words/index.ts` (exports, if needed by consumers)
- `src/games/word-spell/useLibraryRounds.ts` (add `seed`, swap slice →
  `pickWithRecycling`)
- `src/games/word-spell/WordSpell/WordSpell.tsx` (two-line `sampleSeed`
  addition)
- Test files per the Testing section.

No architecture docs update required — no game-state logic changes
(reducer, dispatch, behaviours untouched). The CLAUDE.md architecture-
docs rule doesn't trigger for `src/data/words/` or `src/lib/`.

## Open questions (deferred to future specs)

- Persisting seen-words state per profile via RxDB.
- Extending recycling to scramble / picture / sentence-gap modes.
- Wiring `levelMode` auto-progression into WordSpell (Level 2 → Level 3
  after a successful session).
- Smart re-queue for mistakenly-answered words.

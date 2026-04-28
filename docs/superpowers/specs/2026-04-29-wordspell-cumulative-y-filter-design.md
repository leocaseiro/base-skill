# WordSpell — Cumulative Tile Pool, Y Phoneme Filter, and Mode-Driven Round Source

> Status: **Draft (design)** — supersedes
> `2026-04-28-wordspell-multi-level-units-design.md` for the UI selection
> model and filter contract. Migration design from the prior spec is
> retained.
> Date: 2026-04-29
> Owner: leocaseiro
> Related: PR #219 (issue #216)

## Background

PR #219 shipped a free-form multi-level chip picker for WordSpell. While
testing the picker against the
`docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md`
curriculum, three problems surfaced:

1. **The disjoint chip selection produces empty pools.** Picking only the
   Level-4 `sh` chip yields zero playable words because `i` and `p` are
   not in `graphemesAllowed` — the kid would not have the tiles to spell
   `ship`. The current contract requires the user to manually tick every
   prior-level chip too, which is a footgun.
2. **The mode-default leaks emoji words into recall mode.**
   `DEFAULT_WORD_SPELL_CONFIG` ships `mode: 'recall'` (correct) **and**
   `rounds: sliceWordSpellRounds(8)` (the `cat 🐱 / dog 🐶 / sun ☀️` pool).
   `useLibraryRounds` short-circuits to explicit rounds whenever
   `config.rounds.length > 0`, so the library is never queried in the
   default-saved-null path.
3. **No live preview of the selection.** The teacher can pick chips and
   levels but cannot see what words the player will actually receive
   without launching the game.

This spec keeps PR #219's `selectedUnits` data shape and the IndexedDB
migration from `2026-04-28-wordspell-multi-level-units-design.md`. It
replaces the filter contract, the chip-row interaction, the variant split
between Simple and Advanced, the mode default, and adds a preview bar.

## Goals

1. **Tiles always available.** A word never appears in a round unless the
   player has every grapheme tile needed to spell it. Selecting one chip
   anywhere should not strand the player without vowels.
2. **Y phoneme filter.** A word plays iff it contains **at least one**
   phoneme the user has explicitly ticked. This drops "easy" pure-prior-
   level words automatically when the user is focused on a higher-level
   sound.
3. **Group-click chip rows in both Simple and Advanced.** Clicking the
   level header bulk-toggles every chip in that row. Clicking an
   individual chip toggles one phoneme. No native checkboxes.
4. **One UI rendering.** Drop the `chips`/`checkbox-tree` variant split.
   Same component, same look, in Simple form and Advanced modal slot.
5. **Mode-driven default.** Recall default uses the word library; picture
   default uses the curated emoji pool. Neither default config carries
   the other mode's data.
6. **Live word preview.** A muted-background bar below the picker lists
   the words that would be in the round pool given the current selection.
   Mirrors the SortNumbers Simple form pattern.

## Non-goals

- **Curriculum data changes.** `GRAPHEMES_BY_LEVEL` and the per-level
  word JSON files are unchanged. The plan doc word lists in
  `2026-04-11-phonic-word-library_words-list.md` remain reference
  material; word selection is computed, not authored.
- **New round sources.** Picture mode keeps the existing
  `WORD_SPELL_ROUND_POOL`. Adding image-paired library words is out of
  scope.
- **Per-region tuning.** This change is region-agnostic — the same filter
  rule applies for `aus`, `uk`, `us`, `br`. Any region whose curriculum
  data is sparse simply yields a smaller pool.
- **Storybook visual baselines.** Stories whose snapshots include the
  affected forms are re-recorded as part of implementation, not designed
  here.

## What changes vs. PR #219

| PR #219 piece                                                                        | Status                                                                            |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `WordSpellLibrarySource` shell + registry slot                                       | Keep                                                                              |
| `getAdvancedHeaderRenderer` registry hook                                            | Keep                                                                              |
| `selectedUnits: LevelGraphemeUnit[]` config shape                                    | Keep                                                                              |
| `level-unit-selection.ts` pure helpers                                               | Keep `toggleLevel`, `toggleUnit`, `defaultSelection`; **drop** `triStateForLevel` |
| `migrateWordSpellConfig` + schema bumps (`saved_game_configs` v3, `custom_games` v1) | Keep unchanged                                                                    |
| `chips` vs `checkbox-tree` variant prop                                              | **Drop** — single rendering                                                       |
| Native `<input type="checkbox">` for level rows                                      | **Drop** — replaced by clickable header                                           |
| `cumulativeGraphemes` helper in `levels.ts`                                          | Keep — now used by `resolveSimpleConfig` for `graphemesAllowed`                   |
| `phonemesAllowed` field on `source.filter`                                           | **Drop** in derived filter — replaced by `phonemesRequired`                       |
| `DEFAULT_WORD_SPELL_CONFIG` carrying both `mode: 'recall'` and emoji `rounds`        | **Split** into `DEFAULT_RECALL_CONFIG` and `DEFAULT_PICTURE_CONFIG`               |
| `WORD_SPELL_ROUND_POOL`                                                              | Keep — only consulted for picture mode now                                        |
| `curriculum-invariant.test.ts` (per-level playability)                               | Keep, **extend** to assert the new cumulative + Y rule                            |
| `source-emits-playable.test.tsx`                                                     | **Rewrite** to drive the group-click UI and assert the new filter shape           |

## Selection model — unchanged data, new derivation

The authoritative selection state stays:

```ts
type LevelGraphemeUnit = { g: string; p: string };

type WordSpellSimpleConfig = {
  configMode: 'simple';
  selectedUnits: LevelGraphemeUnit[];
  region: Region;
  inputMethod: 'drag' | 'type' | 'both';
};
```

The migration helper `migrateWordSpellConfig` from the prior spec
populates `selectedUnits` from legacy `{level, phonemesAllowed}` docs
unchanged.

### What's new: how `selectedUnits` becomes a filter

```ts
// resolve-simple-config.ts (rewritten)
export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => {
  const units = readSelectedUnits(simple); // tolerant reader, falls back to defaults
  const maxLevel =
    units.length > 0 ? Math.max(...units.map(unitLevel)) : 1;
  const graphemesAllowed = cumulativeGraphemes(maxLevel).map(
    (u) => u.g,
  );
  const phonemesRequired = [...new Set(units.map((u) => u.p))];

  return {
    gameId: 'word-spell',
    component: 'WordSpell',
    configMode: 'simple',
    mode: 'recall',
    tileUnit: 'letter',
    inputMethod: simple.inputMethod,
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 4,
    tileBankMode: 'exact',
    source: {
      type: 'word-library',
      filter: {
        region: simple.region ?? 'aus',
        graphemesAllowed: [...new Set(graphemesAllowed)],
        phonemesRequired,
      },
    },
  };
};
```

`unitLevel(u)` is a small helper that returns the introduction level of a
`(g, p)` unit (looked up against `GRAPHEMES_BY_LEVEL`). It is
deterministic — `(g, p)` uniquely identifies a unit within the AUS
curriculum.

## Filter contract — `graphemesAllowed` ∧ `phonemesRequired`

`filterWords` and `entryMatches` are unchanged — they already implement
both fields with the right semantics:

- `graphemesAllowed`: every grapheme of a candidate word must be in the
  set. Guarantees the kid has every tile they need to spell the word.
- `phonemesRequired`: at least one of a candidate word's phonemes must
  be in the set. Implements the Y filter — drops easy words.

These are AND'd. A word plays iff:

```text
∀ g ∈ word.graphemes: g.g ∈ graphemesAllowed
∧ ∃ g ∈ word.graphemes: g.p ∈ phonemesRequired
```

`phonemesAllowed` is intentionally **not** set by the simple form. It
would over-constrain — e.g., picking only `sh` would block `ship`
because `/ɪ/` is not in `phonemesAllowed`. Players still get the
educational benefit because every word's phonemes are inherently
teachable (every grapheme they use was learned in some prior or current
level).

The `level` field on `WordFilter` is also intentionally not set — the
curriculum's `level` tag is informational only. A word tagged at L4 can
play for a player whose `selectedUnits` peak at L4, regardless of which
level the word was originally introduced at.

## UI — single rendering for both Simple and Advanced

Stacked rows, one per level (L1 through L8). Each row contains a
clickable header label and the level's `(g, p)` chips.

```text
┌───────────────────────────────────────────────────────────┐
│ ◐ Level 1     · 6 / 6 sounds                              │
│ [s /s/] [a /æ/] [t /t/] [p /p/] [i /ɪ/] [n /n/]            │
├───────────────────────────────────────────────────────────┤
│ ○ Level 2     · 0 / 8 sounds                              │
│ [m /m/] [d /d/] [g /g/] [o /ɒ/] [c, k, ck /k/]            │
│ [e /ɛ/] [u /ʌ/] [r /r/]                                    │
├───────────────────────────────────────────────────────────┤
│ ◯ Level 3     · partial 4 / 10 sounds                     │
│ [b /b/] [h /h/]·on  [f /f/]·on  [l /l/]·on  …              │
└───────────────────────────────────────────────────────────┘

Live preview: ship, shop, fish, dish, wish, lash, …       (47 words)
```

### Chip and header states

| Selection                | Header glyph | Header text                      | Header bg          | Chip variant          |
| ------------------------ | ------------ | -------------------------------- | ------------------ | --------------------- |
| All chips on             | ●            | "Level N · N / N sounds"         | filled accent      | green                 |
| Some chips on            | ◐            | "Level N · partial M / N sounds" | half-filled accent | mix of green and grey |
| No chips on, level ≤ max | ◯            | "Level N · tiles only"           | neutral grey       | grey-outlined         |
| No chips on, level > max | ○            | "Level N · not in scope"         | dimmed             | faded                 |

The "tiles only" state visualises the cumulative-grapheme cascade: the
row contributes its graphemes to the tile pool but no phonemes to the
Y filter. The "not in scope" state is identical visually but
semantically different — those graphemes are excluded from the tile pool
because no chip at or above that level is ticked.

### Interaction

- **Click level header** → bulk-toggle every chip in that row. Computed
  by `toggleLevel(level, selected, target)` where `target = 'unchecked'`
  if the row is currently `all-on`, else `'checked'`. Indeterminate rows
  go to all-on.
- **Click an individual chip** → toggle just that `(g, p)` unit.
  `toggleUnit(unit, selected)` (already exists).
- **Multi-grapheme chip** (e.g., L2 `c, k, ck /k/` — three graphemes,
  one phoneme) → toggling the chip toggles all three units atomically.
  The chip is "on" iff all three units are in `selectedUnits`.
- **Empty selection** (`selectedUnits.length === 0`) → form surfaces
  the existing "Pick at least one sound to play." validation message.
- **Headers in "not in scope" state remain clickable.** Clicking a
  header above the current `maxLevel` bulk-adds its chips and extends
  the cumulative tile pool — the "not in scope" tag is a passive cue,
  not a disabled state.

### Accessibility

The clickable header is rendered as a `<button>` with `aria-pressed`
reflecting the all-on / partial / off state. The header text includes
the count ("Level 4 · 1 / 10 sounds") so screen readers announce both
the level and selection state in one phrase.

Chips remain `<button>` elements with `aria-pressed` reflecting their
own toggled state. Keyboard navigation: tab through header, then
through chips in the row, with `Space` / `Enter` to toggle.

## Default state

- **First launch (no saved config):** `selectedUnits = all units in L1`
  (six units). Equivalent to "L1 row all-on, every other row off".
  Tile pool = L1 graphemes; Y filter = L1 phonemes; word pool = the
  ~45 words in `curriculum/aus/level1.json`.
- **Subsequent launches:** restore last-persisted selection from
  `last-session-game-config` (RxDB-backed; existing infrastructure).
- **Deep-link route loads** without a saved config still default to L1
  via `resolveWordSpellConfig`.

## Mode-driven round source (Fix B)

`DEFAULT_WORD_SPELL_CONFIG` is split into two non-overlapping defaults:

```ts
const DEFAULT_RECALL_CONFIG: WordSpellConfig = {
  // ...shared fields
  mode: 'recall',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      graphemesAllowed: cumulativeGraphemes(1).map((u) => u.g),
      phonemesRequired: defaultSelection().map((u) => u.p),
    },
  },
  // No `rounds` field — `useLibraryRounds` queries `source.filter`
};

const DEFAULT_PICTURE_CONFIG: WordSpellConfig = {
  // ...shared fields
  mode: 'picture',
  rounds: sliceWordSpellRounds(8),
  // No `source` — picture rounds are explicit emoji+word pairs
};
```

`resolveWordSpellConfig` picks the appropriate default by looking at the
saved config's mode (defaulting to `recall`):

```ts
export const resolveWordSpellConfig = (
  saved: Record<string, unknown> | null,
): WordSpellConfig => {
  const mode = saved?.mode === 'picture' ? 'picture' : 'recall';
  const base = mode === 'picture' ? DEFAULT_PICTURE_CONFIG : DEFAULT_RECALL_CONFIG;

  if (!saved || saved.component !== 'WordSpell') return base;

  if (saved.configMode === 'simple') {
    return resolveWordSpellSimpleConfig(...);
  }

  // Advanced merge — ensure the result obeys the mode invariant
  const merged: WordSpellConfig = { ...base, ...saved, gameId, component };

  if (merged.mode === 'recall' && merged.rounds) {
    delete merged.rounds; // recall must come from source
  }
  if (merged.mode === 'picture' && merged.source) {
    delete merged.source; // picture must come from rounds
    if (!merged.rounds) merged.rounds = sliceWordSpellRounds(8);
  }

  return merged;
};
```

This guarantees the shape invariant **mode = recall ⇒ source defined ∧
rounds undefined; mode = picture ⇒ rounds defined ∧ source undefined**.
`useLibraryRounds`'s short-circuit on `config.rounds.length > 0` becomes
unreachable in recall mode.

A new `mode-default-invariant.test.ts` asserts the invariant for every
mode flip path: simple → advanced, advanced toggle in modal, route
loader fallback.

## Live word preview (Fix C)

A new component `WordPreviewBar` lives below the chip rows in
`WordSpellLibrarySource`. It uses the same async filter pipeline that
the game itself uses:

```ts
const WordPreviewBar = ({ filter }: { filter: WordFilter }) => {
  const sig = filterSignature(filter);
  const result = useFilteredWords(filter); // useEffect + cancellation
  if (result.isLoading) return <Bar muted>Loading…</Bar>;
  if (result.hits.length === 0) {
    return <Bar danger>Pick at least one sound to play.</Bar>;
  }
  const preview = result.hits.slice(0, 24).map((h) => h.word).join(', ');
  const more = result.hits.length > 24 ? `, … (${result.hits.length} total)` : '';
  return <Bar muted>{preview}{more}</Bar>;
};
```

Visual: matches SortNumbers' preview row —
`rounded-lg bg-muted px-3 py-2 text-center font-mono text-sm`.
Truncation at 24 words keeps the bar to one line on most viewports;
total count is shown when truncated.

The `useFilteredWords` hook is a thin wrapper around `filterWords`. No
debounce — chip toggles are user-paced (≤ 1 call per click). The hook
cancels in-flight queries on unmount or signature change and caches
by `filterSignature` so repeated identical selections are free.

## Component API

`WordSpellLibrarySource` (existing file, internals rewritten):

```ts
type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};
```

The `variant` prop from PR #219 is removed. The Advanced modal hosts the
same component as the Simple form via the existing
`getAdvancedHeaderRenderer` registry slot — no styling difference.

The component:

- Reads `config.selectedUnits` (or applies default L1 selection if absent).
- Reads `config.region` (defaults to `'aus'`).
- Renders one row per level 1–8.
- Each row's chips are computed from `GRAPHEMES_BY_LEVEL[level]`,
  collapsing same-phoneme-same-level units into one chip
  (`c, k, ck /k/`).
- Header state is derived from how many of the level's chips are on.
- Renders `WordPreviewBar` below the rows.
- Dispatches `onChange` with the updated `selectedUnits` array on
  every toggle.

### Level-unit-selection helpers (small change)

`level-unit-selection.ts` keeps `toggleLevel`, `toggleUnit`,
`defaultSelection`. `triStateForLevel` is replaced by a richer state
descriptor used by the new header:

```ts
type LevelHeaderState =
  | { kind: 'all-on'; count: number; total: number }
  | { kind: 'partial'; count: number; total: number }
  | { kind: 'tiles-only'; total: number }   // no chips ticked, level ≤ max
  | { kind: 'not-in-scope'; total: number }; // no chips ticked, level > max

export const headerStateForLevel = (
  level: number,
  selected: LevelGraphemeUnit[],
  maxLevel: number,
): LevelHeaderState;
```

Pure function. Trivially unit-testable.

## Edge cases

| Case                                                    | Behaviour                                                                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User clears every chip                                  | `selectedUnits = []`, validation message shown                                                                                                                                                                           |
| User picks only one L8 chip                             | Tile pool = L1-8 cumulative, Y filter = 1 phoneme; preview may show < 4 words but pool is non-empty                                                                                                                      |
| User picks chips at L3 + L7 only                        | `maxLevel = 7`, tile pool = L1-7 cumulative, Y filter = chosen L3 + L7 phonemes                                                                                                                                          |
| Targeted struggle drill, e.g. `d, g, b, v` across L2/L3 | Each chip is independently toggleable. `maxLevel = 3`, tile pool = L1-3 cumulative, Y filter = `{/d/, /g/, /b/, /v/}` → words like `bad, big, dog, van, vet, bug, dad` play; pure-vowel-only words drop out              |
| Filter yields zero hits                                 | Preview bar shows "Pick at least one sound to play." (same copy as empty selection — rare in practice; would only happen if Y phonemes never co-occur with cumulative graphemes, which doesn't happen in AUS curriculum) |
| Picture mode toggled in Advanced                        | `source` is dropped, `rounds = WORD_SPELL_ROUND_POOL` is restored, picker is hidden                                                                                                                                      |
| Recall mode re-toggled                                  | `rounds` is dropped, last-known `selectedUnits` is restored, picker is shown                                                                                                                                             |

## Testing strategy

Three layers, mirroring PR #219's discipline:

### 1. Pure-logic unit tests

`src/games/word-spell/level-unit-selection.test.ts` (extend existing):

- `headerStateForLevel` returns `all-on` / `partial` / `tiles-only` /
  `not-in-scope` correctly across selection × maxLevel combinations.
- `toggleLevel` and `toggleUnit` continue to behave as in PR #219.

`src/games/word-spell/resolve-simple-config.test.ts` (extend existing):

- Empty `selectedUnits` → `maxLevel = 1`, default L1 graphemes, no
  `phonemesRequired` (or `phonemesRequired = []`).
- Single L4 unit (`{g:'sh', p:'ʃ'}`) → `graphemesAllowed = L1-4
cumulative graphemes`, `phonemesRequired = ['ʃ']`.
- Mixed L3 + L7 → `maxLevel = 7`, cumulative L1-7 graphemes, both
  phoneme sets in `phonemesRequired`.
- Multi-grapheme phoneme (`/k/` from L2) → `phonemesRequired` contains
  `'k'` once even though three units contributed it.

### 2. Component tests

`src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`
(rewrite):

- Renders 8 level rows.
- Default render shows L1 row in `all-on`, others in `not-in-scope`.
- Click level header → all chips in that row toggle on; subsequent
  click toggles them off.
- Click individual chip → toggles one phoneme; row state transitions
  correctly through `partial`.
- Multi-grapheme chip (`c, k, ck /k/` at L2) toggles all three units
  atomically.
- L1 `s /s/` and L4 `c /s/` are independent chips (do not co-toggle).
- `WordPreviewBar` renders the words for the current selection.
- Empty selection surfaces "Pick at least one sound to play."
- No `<input type="checkbox">` in the DOM (regression guard).

### 3. Curriculum invariant

`src/data/words/curriculum-invariant.test.ts` (extend):

- For every `(region, level)`, build `selectedUnits` from that level's
  units alone and assert `filterWords` returns ≥ `MIN_PLAYABLE_HITS`
  hits. Same as PR #219, but the filter now uses cumulative
  `graphemesAllowed` + Y `phonemesRequired`.
- New cross-level invariant: for every `(region, level N)`, picking
  the single highest-level chip at level N yields a non-empty pool
  (proves the cumulative-grapheme cascade keeps single-chip selections
  playable).

### 4. Form-emits-playable

`src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`
(rewrite):

- Render the new chip UI.
- For each level 1–8, click the level header (bulk-on) and assert the
  emitted `source.filter` is well-formed.
- Click individual chips and assert `phonemesRequired` updates.
- Verify the L1-only default produces non-empty `filterWords` results.
- Specifically test "only L4 sh" (the regression case from PR #219):
  emits `graphemesAllowed = L1-4 cumulative`, `phonemesRequired =
['ʃ']`, `filterWords` returns ≥ 4 hits.

### 5. Mode-default invariant

`src/games/word-spell/mode-default-invariant.test.ts` (new):

- `resolveWordSpellConfig(null)` returns recall + library source + no
  emoji `rounds`.
- `resolveWordSpellConfig({mode: 'picture'})` returns picture + emoji
  `rounds` + no `source`.
- Mode flip recall → picture → drops `source`, restores `rounds`.
- Mode flip picture → recall → drops `rounds`, restores `source`.
- Saved config with `configMode: 'simple'` always resolves to recall +
  library (Simple form has no picture mode).

## Risk & mitigation

**Saved Custom Games under the old shape break on read.** Addressed
already by the `migrateWordSpellConfig` migration from the prior spec —
unchanged. Belt-and-suspenders: `resolve-simple-config.ts` reads
`selectedUnits` with a fallback to deriving from legacy
`{level, phonemesAllowed}` if the migration somehow didn't run.

**`useFilteredWords` for the preview adds another query path.** The
filter signature is the same as the game's, so the existing
`pickWithRecycling` cache is reused. Worst case a no-op cache miss on
first render of the form.

**Visual regression in Storybook.** Plan re-records the affected stories
(`WordSpellSimpleConfigForm`, `AdvancedConfigModal` with WordSpell
header) and includes a manual diff review step. The chip UI looks
similar to PR #219 but with a different header — expect baseline drift.

**Performance — `filterWords` runs without a level prefilter.** The
phoneme test is a small Set lookup; the chunked indexes already load
lazily. PR #219 measured well under 50 ms for typical selections; this
spec adds at most one additional query (the preview), bounded the same
way.

**Drift between selection state and filter derivation.** Both Simple
form and resolveSimpleConfig derive their state purely from
`selectedUnits` — there is no cached intermediate. Test assertions
exercise the full round-trip.

## Implementation order (preview — full plan separate)

1. Replace `triStateForLevel` with `headerStateForLevel` in
   `level-unit-selection.ts`; tests.
2. Rewrite `WordSpellLibrarySource` component: drop variant prop,
   replace native checkbox with clickable header, render
   `WordPreviewBar`; component tests.
3. Drop the `getAdvancedHeaderRenderer` variant wrapper if any (the
   registry hook itself stays); ensure Advanced modal renders the
   same component.
4. Rewrite `resolve-simple-config.ts`: cumulative `graphemesAllowed` +
   `phonemesRequired`; no `level` field; tests.
5. Split `DEFAULT_WORD_SPELL_CONFIG` into recall and picture defaults;
   rewrite `resolveWordSpellConfig` for mode-driven default and
   invariant enforcement; new `mode-default-invariant.test.ts`.
6. Add `useFilteredWords` hook and `WordPreviewBar`; component test.
7. Extend `curriculum-invariant.test.ts` and rewrite
   `source-emits-playable.test.tsx` for the new contract.
8. Re-record Storybook baselines for affected stories; run VR.
9. Manual smoke test in dev server: pick "L4 + sh only" and confirm
   `ship, shop, fish, dish` play; switch to picture mode and confirm
   the emoji pool returns; switch back to recall and confirm library
   words return without an app reload.

## Open questions

None at this point. The selection model, filter contract, UI, defaults,
preview, and migration are all settled.

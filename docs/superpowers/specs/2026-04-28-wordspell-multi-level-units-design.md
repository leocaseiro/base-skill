# ~~WordSpell — Multi-Select Levels & Per-Unit Phoneme Toggles~~

> ⚠️ **SUPERSEDED on 2026-04-29** by
> [`2026-04-29-wordspell-cumulative-y-filter-design.md`](./2026-04-29-wordspell-cumulative-y-filter-design.md).
>
> The disjoint multi-level model below was retired after testing PR #219
> revealed two problems: (a) picking a single chip (e.g. only L4 `sh`)
> produced empty word pools because prior-level graphemes weren't in
> `graphemesAllowed`; (b) the design didn't address easy-word filtering
> for higher-level focus.
>
> **What survived from this spec:** the `selectedUnits: LevelGraphemeUnit[]`
> data shape, the `level-unit-selection.ts` helpers (toggle/default), and
> the IndexedDB migration (`migrateWordSpellConfig`, schema bumps).
>
> **What changed:** the filter contract (now cumulative graphemes +
> Y phoneme filter), the UI (group-click headers replace native
> checkboxes; single rendering for Simple and Advanced), and the
> mode-default invariant (recall ⇒ library source; picture ⇒ emoji
> rounds; never both).
>
> Read the new spec for the current decisions. The text below is kept
> for historical context.
>
> ~~Status: **Approved (design)** — implementation plan to follow.~~
> Date: 2026-04-28
> Owner: leocaseiro

## Background

PR #219 (issue #216) shipped a cumulative-phonemes Level picker for WordSpell.
Mid-review, two issues surfaced:

1. **Cumulative chips overwhelm the level focus.** Selecting Level 4 surfaces
   every phoneme from L1–L4 as a chip, so the "level" loses pedagogical
   meaning — a player on Level 4 should be drilling Level-4 sounds, not
   re-cycling through everything they already know.
2. **The Level field is a single dropdown.** Players can't say "I want Levels
   1, 2, and 4 (skipping 3)." A child mid-progression who hasn't covered L3 yet
   has no way to express that.

The phoneme data already supports a richer model — most levels have ~6–11
distinct `(grapheme, phoneme)` units, and 11 phonemes recur across levels via
different graphemes (e.g. `/s/` via `s` at L1 and `c` at L4). Treating each
unit as its own toggle, with levels as bulk-select presets, fits both the
data shape and the player's mental model.

## Goals

1. **Disjoint multi-level selection** — players can pick any subset of levels
   like `{L1, L2, L4}`. Skipping intermediate levels is allowed.
2. **Per-`(grapheme, phoneme)` unit toggles** — each chip / sub-checkbox is an
   independent unit. Toggling `s /s/` at L1 does not affect `c /s/` at L4.
3. **Level checkboxes as bulk-toggle presets** — checking a level row turns on
   all its units; unchecking turns them all off. The checkbox state itself is
   tri-state and **derived** from the unit selection.
4. **Phoneme-driven filter** — the curriculum's `level` tag is informational
   only. A word plays iff every one of its graphemes maps to a `(g, p)` pair
   in the player's `selectedUnits`.
5. **Last-used selection persists**; first-time launch defaults to `{L1}`.
6. **Visual symmetry, two renderings** — Simple form uses chip pills inside
   each level row; Advanced modal uses a nested `<ul>` of plain checkboxes.
   Same data model, same tri-state behaviour, different styling.

## Non-Goals

- Curriculum data changes. `GRAPHEMES_BY_LEVEL` and the per-level word lists
  are unchanged.
- Play-Again repeating sequence (issue #220). Tracked separately.
- Storybook visual baselines. Stories whose snapshots include the affected
  forms will be re-recorded as part of implementation.

## What changes vs. PR #219

PR #219 introduced the shared `WordSpellLibrarySource` shell and the
`getAdvancedHeaderRenderer` registry hook, plus several unrelated polish
changes. The architectural pieces survive; the form internals get rewritten:

| PR #219 piece                                   | Status                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `WordSpellLibrarySource` component shell + slot | Keep (rewrite internals)                                         |
| `getAdvancedHeaderRenderer` registry hook       | Keep                                                             |
| `cumulativeGraphemes` helper in `levels.ts`     | Keep (used by `graphemePool`)                                    |
| `levels.test.ts` (cumulativeGraphemes contract) | Keep                                                             |
| `curriculum-invariant.test.ts`                  | **Rewrite** — assert per-level playability instead of cumulative |
| `source-emits-playable.test.tsx`                | **Rewrite** — drive the new multi-select widget                  |
| `recall` default mode                           | Keep                                                             |
| `roundsInOrder: false` default                  | Keep                                                             |
| `scramble` mode removed                         | Keep                                                             |
| `distractorCount` field in Advanced             | Keep                                                             |
| Form's use of `cumulativeGraphemes`             | **Remove** — superseded by per-level unit lookups                |

## Selection model

The authoritative state is a list of `(grapheme, phoneme)` units the player
has opted into:

```ts
type LevelGraphemeUnit = { g: string; p: string };

type WordSpellSimpleConfig = {
  configMode: 'simple';
  selectedUnits: LevelGraphemeUnit[]; // ← replaces { level, phonemesAllowed }
  region: Region;
  inputMethod: 'drag' | 'type' | 'both';
};
```

Each unit comes from `GRAPHEMES_BY_LEVEL` and is uniquely identified by its
`(g, p)` pair. The order of units in the array is not significant.

### Why `(g, p)` and not just `p`

Eleven phonemes appear at multiple levels in the AUS curriculum via different
graphemes:

| phoneme | graphemes (and levels)            |
| ------- | --------------------------------- |
| `/s/`   | `s` (L1), `c` (L4)                |
| `/f/`   | `f` (L3), `ph` (L4)               |
| `/dʒ/`  | `j` (L3), `g` (L4), `dge` (L8)    |
| `/w/`   | `w` (L3), `wh` (L4)               |
| `/tʃ/`  | `ch` (L4), `tch` (L8)             |
| `/eɪ/`  | `ai` (L5), `ay` (L5), `a_e` (L7)  |
| `/iː/`  | `ea` (L5), `ee` (L5), `e_e` (L7)  |
| `/aɪ/`  | `ie` (L5), `igh` (L5), `i_e` (L7) |
| `/oʊ/`  | `oa` (L5), `ow` (L5), `o_e` (L7)  |
| `/juː/` | `ew` (L5), `ue` (L5), `u_e` (L7)  |
| `/ɔː/`  | `or` (L6), `aw` (L8), `ore` (L8)  |

A player who has learned `s` at L1 may not yet recognise `c` as also spelling
`/s/`. Toggling them as one unit would conflate two distinct teaching events.
The `(g, p)` pair is the smallest unit a player can identify with.

## Filter contract — phoneme-only, no level gate

`filterWords` derives both fields from `selectedUnits`:

```ts
const phonemesAllowed = [...new Set(selectedUnits.map((u) => u.p))];
const graphemesAllowed = [...new Set(selectedUnits.map((u) => u.g))];
```

A candidate word plays iff **every** one of its graphemes matches a
`(g, p)` pair in `selectedUnits` — equivalent to: the grapheme is in
`graphemesAllowed` AND the phoneme it teaches in this word is in
`phonemesAllowed`.

The curriculum's `level` tag is **not** part of the filter. A word tagged at
L4 can play for a player with only L1–L2 selected, provided the word happens
to use only L1–L2 phonemes (rare in practice — most "advanced" words feature
their level's headline phoneme, which won't be in the player's selection).

The existing `WordFilter` shape already supports both `graphemesAllowed` and
`phonemesAllowed`. The plan verifies they AND together correctly inside
`entryMatches` (`src/data/words/filter.ts:30`).

## UI — Simple form

Stacked rows, one per level (L1 through L8). Each row contains a tri-state
checkbox, a level label, and the level's `(g, p)` units rendered as toggleable
chip pills.

```text
☑ Level 1
  [s /s/] [a /æ/] [t /t/] [p /p/] [i /ɪ/] [n /n/]    ← all chips filled

▣ Level 2          ← indeterminate (some on, some off)
  [m /m/] [d /d/] [g /g/] [o /ɒ/]
  [c, k, ck /k/] [e /ɛ/] [u /ʌ/] [r /r/]

☐ Level 3          ← unchecked, row dimmed
  [b /b/] [h /h/] [f /f/] [l /l/] [j /dʒ/]
  [v /v/] [w /w/] [x /ks/] [y /j/] [z /z/] [qu /kw/]
```

### Interaction

- **Click row checkbox** → bulk-toggle every chip in that row.
- **Click a chip** → toggle just that `(g, p)` unit.
- **Tri-state derivation**: row is `checked` iff every unit in that level is
  in `selectedUnits`; `unchecked` iff none are; `indeterminate` otherwise.
- **Validation**: `selectedUnits` must be non-empty. The existing "Pick at
  least one sound to play." error surfaces when the form would otherwise
  emit an empty selection.

### Chip composition rules (within one level row)

- Multiple graphemes that teach the **same phoneme at the same level** still
  collapse into one chip — for example, L2 has `c`, `k`, and `ck` all teaching
  `/k/`, so the chip is labelled `c, k, ck /k/`. This preserves the existing
  per-level dedup behaviour and keeps the chip strip readable.
- Toggling a multi-grapheme chip toggles **all** of its `(g, p)` units as a
  single atomic operation (e.g. tapping `c, k, ck /k/` flips all three units
  on or off together).
- Across levels, multi-grapheme phonemes are separate chips: L1 `s /s/` and
  L4 `c /s/` are two independent chips, never collapsed.

## UI — Advanced modal

Same data model, plain rendering: nested checkbox list. Lives in the existing
`WordSpellLibrarySource` registry slot above the standard Advanced fields.

```html
<ul>
  <li>
    <input type="checkbox" id="lvl-1" /><label for="lvl-1">
      Level 1</label
    >
    <ul>
      <li>
        <label><input type="checkbox" /> s /s/</label>
      </li>
      <li>
        <label><input type="checkbox" /> a /æ/</label>
      </li>
      …
    </ul>
  </li>
  <li>
    <input type="checkbox" id="lvl-2" /><label for="lvl-2">
      Level 2</label
    >
    <ul>
      <li>
        <label><input type="checkbox" /> m /m/</label>
      </li>
      …
    </ul>
  </li>
  …
</ul>
```

- Top-level checkbox (`#lvl-N`) is the same tri-state as the Simple form's
  row checkbox: derived, bulk-toggle.
- Each leaf checkbox represents one `(g, p)` unit (or one collapsed
  multi-grapheme unit, same rule as Simple).
- No chip styling. Plain HTML lists with native checkboxes.

The component decides which rendering to use based on a `variant` prop
(`'chips' | 'checkbox-tree'`). `WordSpellSimpleConfigForm` passes
`variant="chips"`; the registry's `getAdvancedHeaderRenderer` returns a
wrapper that passes `variant="checkbox-tree"`.

## Defaults & persistence

- **First launch (no saved config):** `selectedUnits = all units in L1`.
  Equivalent to "L1 fully checked, all others unchecked".
- **Subsequent launches:** restore the last persisted selection from
  `last-session-game-config` (RxDB-backed; existing infrastructure).
- **Deep-link route loads** still default to L1 for first-time visitors —
  the per-route loader does not consult last-session state for the no-config
  fallback.
- `resolveSimpleConfig` builds `source.filter` from `selectedUnits` by
  computing `phonemesAllowed` and `graphemesAllowed` as derived fields.

## Component shape

`WordSpellLibrarySource` (existing file, internals rewritten):

```ts
type Variant = 'chips' | 'checkbox-tree';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  variant?: Variant; // default 'chips'
};
```

The component:

- Reads `config.selectedUnits` (or applies the default `{L1}` selection if
  absent).
- Renders one row per level 1–8.
- Within each row, computes the chip / sub-checkbox set from
  `GRAPHEMES_BY_LEVEL[level]`, applying the same-phoneme-same-level dedup.
- Derives the row checkbox state from the intersection between
  `selectedUnits` and the level's units.
- Dispatches `onChange` with an updated `selectedUnits` array on every
  toggle.

A small helper file `level-unit-selection.ts` (or co-located inside the
component file) holds the pure functions:

```ts
type Tri = 'checked' | 'unchecked' | 'indeterminate';

export const triStateForLevel = (
  level: number,
  selected: LevelGraphemeUnit[],
): Tri;

export const toggleLevel = (
  level: number,
  selected: LevelGraphemeUnit[],
  next: 'checked' | 'unchecked',
): LevelGraphemeUnit[];

export const toggleUnit = (
  unit: LevelGraphemeUnit,
  selected: LevelGraphemeUnit[],
): LevelGraphemeUnit[];

export const defaultSelection = (): LevelGraphemeUnit[]; // → L1 units
```

Pure functions; trivially unit-testable.

## IndexedDB migration

Existing players have WordSpell configs persisted in IndexedDB under the old
shape (`source.filter.{level, phonemesAllowed}` for full configs;
`{configMode: 'simple', level, phonemesAllowed}` for simple configs). The
new code reads `selectedUnits`. Without a migration, those rows would either
crash the form on read or fall back to defaults — both unacceptable per
"don't break current games."

### Affected collections

- `saved_game_configs` — schema **bumps to v3**. Holds the resume-last-session
  row (id `last:anonymous:<gameId>`) plus any legacy named saves not yet
  migrated to `custom_games`.
- `custom_games` — schema **bumps from v0 to v1** (first migration on this
  collection). Holds the user's named custom games. Same `config: object`
  shape as `saved_game_configs`.

`session_history_index` is NOT affected — it stores resolved rounds and round
order, not the simple config.

### Migration strategy (shared by both collections)

A pure helper, `migrateWordSpellConfig`, transforms a single doc's `config`
field. The RxDB `migrationStrategies[N]` per collection wraps it.

```ts
// src/db/migrations/word-spell-multi-level.ts
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

const buildSelectedUnits = (
  level: number,
  phonemesAllowed: readonly string[],
): LevelGraphemeUnit[] => {
  const units: LevelGraphemeUnit[] = [];
  // Scan levels 1..N (covers both pre-fix and cumulative-fix shapes from PR #219)
  for (let lvl = 1; lvl <= level; lvl++) {
    for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
      if (phonemesAllowed.includes(u.p)) units.push(u);
    }
  }
  return units;
};

export const migrateWordSpellConfig = (
  doc: Record<string, unknown>,
): Record<string, unknown> => {
  if (doc.gameId !== 'word-spell') return doc;

  const config = (doc.config as Record<string, unknown>) ?? {};
  if (Array.isArray(config.selectedUnits)) return doc; // already new shape

  // Simple-shape: { configMode: 'simple', level, phonemesAllowed }
  if (
    config.configMode === 'simple' &&
    typeof config.level === 'number' &&
    Array.isArray(config.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          config.level,
          config.phonemesAllowed as string[],
        ),
      },
    };
  }

  // Full-shape: { source: { filter: { level, phonemesAllowed } } }
  const source = config.source as
    | { filter?: { level?: number; phonemesAllowed?: string[] } }
    | undefined;
  if (
    source?.filter &&
    typeof source.filter.level === 'number' &&
    Array.isArray(source.filter.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          source.filter.level,
          source.filter.phonemesAllowed,
        ),
      },
    };
  }

  // Unrecognised shape (e.g. hand-authored rounds with no source) — leave alone.
  return doc;
};
```

### Schema bumps

In `src/db/create-database.ts`:

```ts
saved_game_configs: {
  schema: savedGameConfigsSchema, // version: 3
  migrationStrategies: {
    1: ...existing,
    2: ...existing,
    3: migrateWordSpellConfig,
  },
},
custom_games: {
  schema: customGamesSchema, // version: 1
  migrationStrategies: {
    1: migrateWordSpellConfig,
  },
},
```

The schema files (`savedGameConfigsSchema`, `customGamesSchema`) are updated
to set `version: 3` / `version: 1` respectively. The `config` field stays
typed as `Record<string, unknown>` — no schema-level field changes needed.

### Belt-and-suspenders: tolerant reader

`resolveSimpleConfig` and the new component's selection-derivation also
accept the legacy shape at read-time, falling back to `buildSelectedUnits`
if `selectedUnits` is missing. This protects against:

- A doc that escaped the migration (e.g. test fixtures, mocked DBs).
- Future schemas where the migration runs lazily.

In production code: prefer `selectedUnits`; fall back to deriving from
`level + phonemesAllowed`; default to L1 only if neither is present.

### Migration tests

`src/db/migrations/word-spell-multi-level.test.ts`:

- Migrates a simple-shape doc (`level=4`, `phonemesAllowed=['s','m']`) →
  `selectedUnits` contains every `(g, /s/)` unit and every `(g, /m/)` unit
  in L1–L4.
- Migrates a full-shape doc (`source.filter.{level, phonemesAllowed}`) →
  same result.
- Idempotent: a doc that already has `selectedUnits` is returned unchanged.
- Non-WordSpell doc returned unchanged.
- Hand-authored full config (no `source`) returned unchanged.
- Edge case: `phonemesAllowed=[]` → empty `selectedUnits` (the form will
  flag this as invalid on read, prompting the user to pick at least one).
- Cross-level phoneme: `phonemesAllowed=['/s/']` at `level=4` produces both
  `{g:'s',p:'s'}` (from L1) **and** `{g:'c',p:'s'}` (from L4) — preserves
  the player's previous reach.

`src/db/migrate-collections.test.ts` (or extension of the existing
collection-migration tests):

- Insert a v2 `saved_game_configs` doc with the legacy shape; bump to v3;
  re-read; assert `selectedUnits` is present and correct.
- Same for `custom_games` v0 → v1.

## Testing strategy

Three layers, mirroring the previous spec's discipline:

1. **Pure-logic unit tests** (`level-unit-selection.test.ts`)
   - `triStateForLevel` returns `checked` / `unchecked` / `indeterminate`
     correctly for empty, full, and partial selections.
   - `toggleLevel` adds / removes exactly the level's units.
   - `toggleUnit` toggles one unit, preserves others.
   - `defaultSelection` returns the L1 unit set.
2. **Component tests** (`WordSpellLibrarySource.test.tsx`)
   - Renders 8 level rows in `chips` mode.
   - Renders 8 level rows in `checkbox-tree` mode.
   - Tri-state checkbox reflects current selection.
   - Clicking a row checkbox bulk-toggles its chips.
   - Clicking a chip toggles one unit and updates the row checkbox.
   - L1 `s /s/` and L4 `c /s/` are independent chips.
   - Multi-grapheme dedup: L2 chip labelled `c, k, ck /k/` toggles all three
     graphemes atomically.
   - Empty `selectedUnits` surfaces the "Pick at least one sound to play."
     error.
3. **Curriculum invariant test**
   `src/data/words/curriculum-invariant.test.ts` rewritten to:
   - Parameterise over every `(region, level)`.
   - Build `selectedUnits` from that level's units alone.
   - Assert `filterWords` returns ≥ `MIN_PLAYABLE_HITS` (currently 4) hits.
   - Confirms each level is independently playable; previous version asserted
     cumulative selection only.
4. **Form-emits-playable** `source-emits-playable.test.tsx` rewritten to:
   - Render the new multi-select widget.
   - Toggle levels via the row checkbox; assert `source.filter` is well-formed.
   - Toggle individual chips; assert phonemes / graphemes match.
   - Verify the L1-only default produces non-empty `filterWords` results.

E2E coverage isn't expanded — the form-driven tests above exercise the
contract end-to-end up through `filterWords`. If a regression slips through,
the curriculum-invariant test catches the data side and the component test
catches the UI side.

## Risk & mitigation

**Saved Custom Games under the old shape break on read.** Addressed by the
RxDB migration above: `saved_game_configs` v3 and `custom_games` v1 both run
`migrateWordSpellConfig` on every legacy doc, populating `selectedUnits` from
the saved `level + phonemesAllowed`. `resolveSimpleConfig` also has a
read-time coercion fallback as belt-and-suspenders.

**Visual regression in Storybook.** Plan re-records affected baselines and
includes a manual diff review step.

**Performance — `filterWords` runs without a level prefilter.** The phoneme
test is fast; the existing chunked indexes already load lazily. Plan
benchmarks if any test exceeds 2s.

**Tri-state derivation drift when `GRAPHEMES_BY_LEVEL` changes.** Derived
from data on every render; no cached state.

## Implementation order (preview — full plan separate)

1. Add `level-unit-selection.ts` pure helpers + tests
2. Add `migrateWordSpellConfig` helper + unit tests; bump
   `saved_game_configs` schema to v3 and `custom_games` schema to v1; wire
   the migration strategies in `create-database.ts`; collection-level
   migration tests
3. Rewrite `WordSpellLibrarySource` with the `chips` variant; tests
4. Add the `checkbox-tree` variant; tests
5. Wire `getAdvancedHeaderRenderer` to pass `variant="checkbox-tree"`
6. Update `WordSpellSimpleConfig` and `resolveSimpleConfig` for
   `selectedUnits` (with read-time fallback to `level + phonemesAllowed`)
7. Rewrite `curriculum-invariant.test.ts` and `source-emits-playable.test.tsx`
8. Hook last-session-game-config restore for the simple form (verifies the
   migrated row drives the new UI on first read)
9. Re-record affected Storybook baselines; run VR
10. Manual smoke test in dev server, including a pre-seeded legacy doc that
    must round-trip through the migration without crashing or losing the
    user's selection

The plan elaborates each step into red-green TDD pairs with the exact files
to touch.

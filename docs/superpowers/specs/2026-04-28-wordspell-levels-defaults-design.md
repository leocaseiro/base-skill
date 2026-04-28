# WordSpell — Levels in Advanced + Defaults Overhaul

> Status: **Approved (design)** — implementation plan to follow.
> Date: 2026-04-28
> Owner: leocaseiro

## Background

WordSpell exposes two configuration surfaces:

- A **Simple** form (`WordSpellSimpleConfigForm`) with Level + Phonemes + Input Method
- An **Advanced** modal (`AdvancedConfigModal` driven by `wordSpellConfigFields`)
  with eight other fields

The two forms don't share fields, so Advanced lacks the most fundamental
content controls (which Level, which sounds). Several defaults also fight the
synthetic-phonics flow the curriculum is built around. And — discovered while
writing this spec — Levels 3+ are effectively broken: a filter-cumulativity
mismatch silently drops most words from the playable pool, so the player sees
"no rounds" or a tiny pool.

This spec covers the user-facing defaults overhaul, the Advanced-form parity
fix, the Level 3+ bug fix, and the regression coverage that prevents the bug
class from returning.

## Goals

1. **Fix Level 3+** — cumulative phoneme handling so library queries return
   playable word counts at every level.
2. **Advanced ⊇ Simple** — every option in the Simple form is also reachable
   from the Advanced form. Concretely, Advanced gains:
   - **Level** (currently Simple-only)
   - **Phonemes / sounds at this level** (currently Simple-only)
   - **`distractorCount`** — never exposed in WordSpell's Advanced even though
     the game uses distractor mode. NumberMatch already exposes this; WordSpell
     forgot to.
3. **`recall` becomes the default mode** — picture mode is a scaffold; recall
   is the synthetic-phonics target. Library-sourced rounds also have no
   image/emoji today, so picture mode silently degrades.
4. **Random rounds by default** (`roundsInOrder: false`).
5. **Remove the unused `scramble` mode.**
6. **Lock the bug class out of the codebase** with parameterized regression
   tests that fail loudly if any (region, level) ever drops below the playable
   minimum.

## Non-Goals

- No data migration for existing saved configs that use `mode: 'scramble'` —
  pre-launch / dev-only data is treated as throwaway.
- No new game modes; `picture`, `recall`, and `sentence-gap` stay.
- No curriculum content changes.
- No changes to `skin`, `hud`, `timing` exposure (consistent with other games).

## Findings (the why)

### Level 3+ is silently broken

`filterWords` requires that **every** grapheme of a candidate word's phoneme
mapping be present in `filter.phonemesAllowed` (`src/data/words/filter.ts`,
lines 70–73):

```ts
if (filter.phonemesAllowed) {
  const allowed = new Set(filter.phonemesAllowed);
  if (!hit.graphemes.every((g) => allowed.has(g.p))) return false;
}
```

`WordSpellSimpleConfigForm.setLevel(N)` populates `phonemesAllowed` with the
phonemes from level `N` only — not levels 1..N (`WordSpellSimpleConfigForm.tsx`
lines 39–52, 60–75):

```ts
const unitsAtLevel = GRAPHEMES_BY_LEVEL[level] ?? [];
// ...
const setLevel = (n: number) => {
  const available = [
    ...new Set((GRAPHEMES_BY_LEVEL[n] ?? []).map((u) => u.p)),
  ];
  // -> phonemesAllowed = level-N phonemes only
};
```

Consequence: a Level 3 word like `bat` uses three phonemes: `/b/` (level 3),
`/æ/` (level 1), and `/t/` (level 1). With `phonemesAllowed` containing only
level-3 phonemes, `/æ/` and `/t/` are not in the allowed set and the word is
rejected. Levels 1 and 2 worked by coincidence (level 2's phoneme set
contains enough overlap with level-1 sounds for some words to slip through).
Level 3+ effectively yields zero or near-zero hits.

The fix is to use `cumulativeGraphemes(level)` (already defined in
`src/data/words/levels.ts:130-144`) for both the chip pool and the default
`phonemesAllowed` set.

### Library rounds have no image / emoji

`toWordSpellRound` in `src/data/words/adapters.ts:4-6` only sets `word`. No
`emoji`, no `image`. So library-sourced rounds in `picture` mode show nothing
visual and silently behave like `recall` — except in `recall` we also disable
the placeholder, so the user gets a coherent UX. This is a second reason
`recall` is the right default for library-driven gameplay.

### Defaults bias toward "training wheels" instead of synthetic-phonics flow

| Default                                   | Today                       | Should be        |
| ----------------------------------------- | --------------------------- | ---------------- |
| `DEFAULT_WORD_SPELL_CONFIG.mode`          | `picture`                   | `recall`         |
| `DEFAULT_WORD_SPELL_CONFIG.roundsInOrder` | `true` (deliberate, for VR) | `false` (random) |
| `resolveSimpleConfig.mode`                | `scramble`                  | `recall`         |

Random rounds were avoided in defaults because the shuffler uses a
`crypto.getRandomValues` seed VR tests can't pin. Solution: deterministic
seed injection in test mode (see "VR stability" below) — keep the user-facing
default truly random.

### Advanced form gap

| Field                                     | In Advanced today | Action                               |
| ----------------------------------------- | ----------------- | ------------------------------------ |
| `inputMethod`                             | yes               | keep                                 |
| `wrongTileBehavior`                       | yes               | keep                                 |
| `tileBankMode`                            | yes               | keep                                 |
| `distractorCount`                         | no                | **add** (NumberMatch already has it) |
| `totalRounds`                             | yes               | keep                                 |
| `roundsInOrder`                           | yes               | keep                                 |
| `ttsEnabled`                              | yes               | keep                                 |
| `mode`                                    | yes               | keep (drop `scramble`)               |
| `tileUnit`                                | yes               | keep                                 |
| `source.filter.level` + `phonemesAllowed` | no                | **add** via shared sub-component     |
| `skin`                                    | no                | skip — managed by `SkinHarness`      |
| `hud` fields                              | no                | skip — not exposed by any game       |
| `timing` fields                           | no                | skip — not exposed by any game       |
| `slotInteraction`                         | no                | skip — derived from `mode`           |
| `touchKeyboardInputMode`                  | no                | skip — derived from `inputMethod`    |

### `scramble` mode is unused

Reference search shows `scramble` only in defaults, stories, and tests — not
in any user-visible flow the team uses. Removing it simplifies the slot-
interaction logic in `WordSpell.tsx:505-509` to a single `mode === 'sentence-gap'`
check.

## Approach

### A. Cumulative phonemes

In `WordSpellSimpleConfigForm.tsx`, replace `GRAPHEMES_BY_LEVEL[level] ?? []`
with `cumulativeGraphemes(level)`:

- Used to build the chip pool so users can toggle phonemes from levels 1..N.
- Used inside `setLevel(N)` to seed `phonemesAllowed` to all phonemes at
  levels 1..N (the natural "all sounds learned so far" default).

The chip-strip rendering (one chip per unique phoneme, listing all graphemes
that teach it) stays the same — it already collapses graphemes-per-phoneme.

### B. Shared `WordSpellLibrarySource` sub-component

Extract the Level select + Phonemes chip strip from `WordSpellSimpleConfigForm`
into a new component:

```text
src/games/word-spell/WordSpellLibrarySource/
├── WordSpellLibrarySource.tsx
└── WordSpellLibrarySource.test.tsx
```

The component owns `config.source` (`type: 'word-library'`, `filter.level`,
`filter.phonemesAllowed`, `filter.region`). It exposes the same
`{ config, onChange }` props every config form takes.

Both forms render it:

- `WordSpellSimpleConfigForm` renders `<WordSpellLibrarySource />` then the
  Input Method picker.
- `AdvancedConfigModal` renders it via a new registry hook
  (`getAdvancedHeaderRenderer(gameId)`) above the standard `ConfigFormFields`.

### C. Registry hook: `getAdvancedHeaderRenderer`

Add a third lookup to `src/games/config-fields-registry.ts`:

```ts
export const getAdvancedHeaderRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell':
      return WordSpellLibrarySource;
    default:
      return undefined;
  }
};
```

`AdvancedConfigModal.tsx` consults the hook; when a renderer exists it appears
above the existing `<ConfigFormFields>`. Other games are unaffected.

### D. Default mode = `recall`

- `src/routes/$locale/_app/game/$gameId.tsx:96-112` →
  `DEFAULT_WORD_SPELL_CONFIG.mode = 'recall'`.
- `src/games/word-spell/resolve-simple-config.ts:9` → `mode: 'recall'`.
- Stories / tests that hardcode `mode: 'picture'` or `mode: 'scramble'`
  updated where they describe the default; story scenarios that explicitly
  cover `picture` mode keep that mode.

### E. Random rounds by default + VR stability

- `DEFAULT_WORD_SPELL_CONFIG.roundsInOrder = false`.
- The engine's `buildRoundOrder` (or its underlying shuffler) gains a way to
  accept a seed. When `import.meta.env.MODE === 'test'` (or, more precisely,
  in the Storybook/VR setup file), inject a fixed seed so VR baselines stay
  pinned. Production runtime stays truly random.
- Plan note: confirm the exact seed-injection point during plan-writing
  (likely the nanoid-based shuffle inside the engine; might mean exposing a
  `roundOrderSeed` config option used only by tests).
- VR baselines re-recorded after the seed mechanism lands.

### F. Remove `scramble`

- Drop `'scramble'` from `WordSpellConfig['mode']` (`types.ts:38`).
- Drop the `scramble` option from `wordSpellConfigFields` mode select
  (`types.ts:88-94`).
- Simplify `WordSpell.tsx:505-509`:

  ```ts
  slotInteraction:
    resolvedConfig.mode === 'sentence-gap' ? 'free-swap' : 'ordered',
  ```

- Update or delete stories/tests referencing `scramble`.
- No migration: any saved config with `mode: 'scramble'` is throwaway dev data.

### G. Add `distractorCount` to Advanced

Add a new field with `visibleWhen` so it only appears when the user picks
`tileBankMode: 'distractors'`:

```ts
{
  type: 'number',
  key: 'distractorCount',
  label: 'Distractor count',
  min: 1,
  max: 10,
  visibleWhen: { key: 'tileBankMode', value: 'distractors' },
},
```

## Files Touched

| Path                                                                                   | Change                                               |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/games/word-spell/types.ts`                                                        | Drop `scramble`; add `distractorCount` field         |
| `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`         | Use cumulative; delegate to `WordSpellLibrarySource` |
| **NEW** `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`       | Shared Level + Phonemes UI                           |
| **NEW** `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`  | Sub-component tests                                  |
| `src/games/word-spell/resolve-simple-config.ts`                                        | `mode: 'recall'` default                             |
| `src/games/config-fields-registry.ts`                                                  | Add `getAdvancedHeaderRenderer`                      |
| `src/components/AdvancedConfigModal.tsx`                                               | Render header when registered                        |
| `src/routes/$locale/_app/game/$gameId.tsx`                                             | Defaults: `recall`, `roundsInOrder: false`           |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                                         | Drop `scramble` branch                               |
| Engine round-order shuffler (TBD in plan)                                              | Seed-injection for test mode                         |
| Stories / tests referencing `scramble` or old defaults                                 | Update or delete                                     |
| **NEW** `src/data/words/curriculum-invariant.test.ts`                                  | Parameterized (region, level) playability test       |
| **NEW** `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.ts` | Parameterized form-emits-playable test               |
| `src/games/word-spell/WordSpell/word-spell-initial-content.test.ts`                    | Update mode references                               |
| VR baselines                                                                           | Re-record after seed-injection                       |

## Testing Strategy

### Layer 1 — Curriculum invariant (the test that would have caught this)

`src/data/words/curriculum-invariant.test.ts`. Parameterized over every
`(region, level)` in `ALL_REGIONS × {1..8}`:

```ts
const MIN_PLAYABLE_HITS = 4; // one full round at the default totalRounds

describe('curriculum invariant: every level has playable defaults', () => {
  for (const region of ALL_REGIONS) {
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8]) {
      it(`${region} L${level}: cumulative phonemes yield ≥ ${MIN_PLAYABLE_HITS} words`, async () => {
        const phonemesAllowed = [
          ...new Set(cumulativeGraphemes(level).map((u) => u.p)),
        ];
        const result = await filterWords({
          region,
          level,
          phonemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(
          MIN_PLAYABLE_HITS,
        );
      });
    }
  }
});
```

This fails loudly if any future change (curriculum content, filter logic,
cumulativity helper) breaks the playable contract.

### Layer 2 — Form emits playable source

`src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.ts`.
Render the form, simulate `setLevel(N)` for each level, capture the emitted
`source.filter`, and assert `filterWords` returns ≥ 1 hit. Catches form-side
regressions even when the curriculum is fine.

### Layer 3 — Cumulative helper unit test

If `cumulativeGraphemes` doesn't already have direct test coverage, add a
short test asserting `cumulativeGraphemes(3)` includes phonemes from levels
1, 2, and 3 with no duplicates. Cheap, documents intent.

### Layer 4 — Existing-test updates

- `resolve-simple-config.test.ts`: default mode is `recall`.
- `useLibraryRounds.test.tsx`, `WordSpell.test.tsx`,
  `word-spell-initial-content.test.ts`: update hardcoded `mode: 'picture'`
  / `mode: 'scramble'` references that describe the default. Targeted-mode
  scenarios stay unchanged.
- New AdvancedConfigModal test: opening the modal for `gameId === 'word-spell'`
  shows Level + Phonemes controls.
- Skipped: full E2E "play through every level" — too slow, redundant with
  Layers 1+2.

## Acceptance Criteria

- Selecting any level 1..8 in the Simple form produces a playable round
  pool (≥ 4 words).
- Selecting a level shows the cumulative phoneme chips for levels 1..N,
  not just level N.
- The Advanced modal for WordSpell shows Level + Phonemes controls at the
  top, plus the existing 8 fields, plus a new `distractorCount` field
  that appears only when `tileBankMode === 'distractors'`.
- Saving from Simple and Advanced both produce equivalent
  `WordSpellConfig` objects when the same options are set.
- No-config WordSpell launch defaults to `mode: 'recall'`,
  `roundsInOrder: false`.
- Simple-form launch defaults to `mode: 'recall'`.
- No `scramble` references remain in production code; type union is
  narrowed to `'picture' | 'recall' | 'sentence-gap'`.
- `yarn typecheck`, `yarn lint`, `yarn test` pass.
- VR baselines stable (re-recorded once for the new defaults; subsequent
  runs match without drift).
- Curriculum-invariant test exists and passes for every
  `(region, level)`.

## Open Questions Deferred to Plan

- Exact seed-injection point for the round-order shuffler — confirm by
  reading `buildRoundOrder` and the engine `INIT_ROUND` / `RESUME_ROUND`
  paths.
- Whether to keep `WordSpellSimpleConfigForm` at all once Advanced has
  parity, or whether the Simple form remains as a streamlined onboarding
  view. Spec assumes the latter (status **quo).**

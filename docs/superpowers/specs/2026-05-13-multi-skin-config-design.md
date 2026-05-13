---
status: draft
date: 2026-05-13
branch: feat/multi-skin-config
follow-up-plan: docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md (TBD)
absorbs:
  - PR #358 (cave-dragon skin → ships as part of this PR)
---

# Multi-skin config support — Phase 1 (WordSpell + The Floor is Lava)

## Topic

Add multi-skin support to game configs so a user can pick a skin when
creating or editing a custom game. Use WordSpell as the proof point:
register the Dragon Cave skin in production, expose a skin radio in
WordSpell's simple and advanced config forms, and seed a default custom
game named **"The Floor is Lava"** that ships with the Dragon Cave skin
pre-selected.

This is **Phase 1** of a "multiple skins per game, user-pickable"
pattern. Future phases extend the same wiring to NumberMatch, SortNumbers,
SpotAll, and any further skins.

## Why

- The Dragon Cave skin is fully wired in the Storybook harness
  (`WordSpell.skin.stories.tsx` calls `registerSkin('word-spell', dragonCaveSkin)`)
  but **never registered in production code**. The real game route always
  resolves to the classic skin.
- A child has no way to encounter the skin in the actual app today.
- The current `useGameSkin('word-spell', config.skin)` plumbing already
  threads a skin id through the config — only the registration site and
  config-form UI are missing.
- Parent-PIN settings (PRD P-02) isn't built yet, so a stopgap that
  routes skin selection through the **existing custom-game flow** is
  cheaper than building a parallel skin-picker UI that will be replaced.

After this PR, a child can reach the Dragon Cave skin via two
paths:

1. **Discovery surface** — tap the seeded "The Floor is Lava"
   custom-game card on the home screen (visible at first launch and
   on any subsequent launch where the user hasn't deleted it).
2. **Resilient path** — open any WordSpell game's in-session
   settings (`InstructionsOverlay`) and select Dragon Cave from the
   skin radio. This path survives card deletions; it's always
   available as long as Dragon Cave is registered.

## Relationship to PR #358

PR #358 (the original `cave-dragon` skin work) is **absorbed into
this PR**. A Storybook-only skin doesn't ship anything user-visible
on its own, so #358 on its own is unlikely to merge as a standalone
PR. Combining the two avoids that stalemate — this PR delivers the
skin file, the asset folder, the registry wiring, the config-form
plumbing, and the seeded custom game in one shippable unit.

Mechanically, either:

- this branch rebases / cherry-picks PR #358's commits and #358 is
  closed (preferred — preserves authorship and history), or
- PR #358's branch is merged into `feat/multi-skin-config`.

The absorbed work uses the renamed identifiers from the start
(`dragon-cave` everywhere, not `cave-dragon`):

- Skin file: `src/games/word-spell/skins/dragon-cave-skin.tsx`
- Asset folder: `public/skins/word-spell/dragon-cave/`
- Const export: `dragonCaveSkin`
- Skin id: `'dragon-cave'` (this spec is authoritative on the name)
- Display name: `'Dragon Cave'`
- CSS class hooks: `.skin-dragon-cave`, `.dragon-cave-stone` (the
  stone class is intentionally unscoped — see #358's carry-forward
  decisions)
- Storybook ids / localStorage harness key
  (`skin-harness:selected-skin:word-spell` value updated to
  `'dragon-cave'`)

## Scope — in this PR

1. **Production registration of `dragonCaveSkin` for `word-spell`**
   via a bootstrap module imported once at app init.
2. **Per-game `SkinId` union types** for the three games that extend
   `AnswerGameConfig` (`WordSpellSkinId`, `NumberMatchSkinId`,
   `SortNumbersSkinId`). SpotAll is intentionally excluded — its
   config is structurally different (does not extend
   `AnswerGameConfig`) and `SpotAll.tsx` does not yet read
   `config.skin`. SpotAll's own future skin PR will add the union and
   wire `useGameSkin('spot-all', config.skin)` together.
3. **Add `skin?: <Game>SkinId`** to the three `AnswerGameConfig`-extending
   Config interfaces (only WordSpell has more than one skin today; the
   other two unions are single-member placeholders ready to extend).
4. **Skin radio in `WordSpellSimpleConfigForm`** — visible only when
   `getRegisteredSkins('word-spell').length >= 2`. Surfaces in
   `InstructionsOverlay` and `AdvancedConfigModal` (simple form).
5. **Skin field in word-spell's entry of `getAdvancedConfigFields`**
   — same options, same visibility gate, surfaces in
   `AdvancedConfigModal` (advanced form).
6. **Seed "The Floor is Lava" custom game** on first launch per profile.
   `gameId: 'word-spell'`, `name: 'The Floor is Lava'`, `config: { ...DEFAULT_RECALL_CONFIG, skin: 'dragon-cave' }`.
   Migration-flagged so it's not re-seeded if deleted.
7. **Default `wrongTileBehavior: 'lock-auto-eject'`** across all game
   defaults. Regression fix — recall mode was accidentally set to
   `'lock-manual'` in a prior PR. Same change for NumberMatch,
   SortNumbers, SpotAll defaults where applicable.
8. **Image optimization** for the Dragon Cave PNGs — sprite sheet,
   compressed PNGs, or SVG-where-possible. Decided during implementation
   based on which produces the largest payload reduction without
   degrading visual quality.
9. **Padding / UI tweaks** for the Dragon Cave scene — minor spacing
   adjustments around tiles and bank for the in-app context (the
   Storybook harness was tuned to its own viewport).

## Scope — explicitly out

- **No system-protected rows.** "The Floor is Lava" is a normal
  `custom_games` row once seeded. No `isSystem` flag. User can edit,
  rename, reskin, or delete; we don't restore it.
- **No skins for NumberMatch / SortNumbers / SpotAll** yet.
  NumberMatch and SortNumbers Config types get the `skin?` field for
  symmetry (they extend `AnswerGameConfig` and their components
  already read `config.skin`); no non-classic skin is registered, so
  the picker stays hidden. SpotAll is excluded from this PR entirely
  (see scope item 2 for rationale).
- **No URL `?skin=` parameter.** Selection lives in the config blob.
- **No parent-PIN settings UI.** P-02 lands separately.
- **No sound or celebration animation changes.** Confetti remains
  the celebration; round-complete sound is unchanged.
- **No tile-sizing math for long words.** The cliff layout doesn't
  yet adapt to wide words — separate ticket.
- **No drag-ghost helper consolidation** (issue #359). Separate refactor.
- **No retroactive update** of existing user-saved `WordSpellConfig`
  rows from `lock-manual` → `lock-auto-eject`. Defaults change; old
  saves keep whatever they had until the user re-saves.
- **No dynamic skin (un)registration.** Registration is a one-shot
  module-eval-time side effect. The visibility-gate evaluator is not
  reactive — forms read `getRegisteredSkins(...)` once at render time
  and assume the registry is stable for the form's lifetime. A future
  phase that wants lazy / async skin loading needs its own spec for
  the subscribe-and-rerender semantics.
- **Skins do not yet override behavioral config** (e.g.,
  `wrongTileBehavior`, `tileBankMode`, scoring rules). Skins in
  Phase 1 are visual-only — they pick artwork, sounds, and palette,
  but inherit whatever behavior the user's saved config carries.
  Making skins able to lock or default behavioral knobs is a separate
  follow-up; until that lands, cross-game default-config audits
  belong in their own PRs.

## Architecture

### Type system

All `AnswerGameConfig`-extending configs already inherit
`skin?: string` (declared on the base at
[components/answer-game/types.ts:24](src/components/answer-game/types.ts:24)). The per-game `SkinId`
unions narrow this inherited field rather than introduce a new one
— the base property stays as the cross-game seam used by generic
code (e.g., `useGameSkin(gameId, config.skin)`), while per-game
type-checking constrains authored values. Do not remove the base
declaration as part of this PR.

Each game owns its own `SkinId` union type, exported from its
`types.ts`. Adding a new skin requires adding it to the union AND
registering it in the runtime registry — both stay in lockstep,
enforced at compile time via the typed registry signature described
below.

```ts
// src/games/word-spell/types.ts
export type WordSpellSkinId = 'classic' | 'dragon-cave';

export interface WordSpellConfig {
  // ...existing fields
  skin?: WordSpellSkinId;
}
```

```ts
// src/games/number-match/types.ts
export type NumberMatchSkinId = 'classic';

export interface NumberMatchConfig {
  // ...existing fields
  skin?: NumberMatchSkinId;
}
```

Same shape for `SortNumbersSkinId`. SpotAll is not in this PR — see
scope item 2.

**Typed registry signature.** `registerSkin` becomes generic over a
per-game type-map so the registry call refuses an id outside the
game's union at compile time:

```ts
// src/lib/skin/registry.ts
export interface GameSkinIdMap {
  'word-spell': WordSpellSkinId;
  'number-match': NumberMatchSkinId;
  'sort-numbers': SortNumbersSkinId;
}

export function registerSkin<G extends keyof GameSkinIdMap>(
  gameId: G,
  skin: GameSkin & { id: GameSkinIdMap[G] },
): void;
```

Internally the registry's `Map<string, Map<string, GameSkin>>`
storage stays unchanged — the type-map only narrows the public call
signature. SpotAll is intentionally absent from `GameSkinIdMap` until
its own skin PR adds it.

The `useGameSkin(gameId, config.skin)` call site at
`WordSpell.tsx:362` already accepts the field — no component-level
change here.

### Production skin registration

New file:

```ts
// src/games/word-spell/skins/index.ts (or register.ts)
import { dragonCaveSkin } from './dragon-cave-skin';
import { registerSkin } from '@/lib/skin';

export const registerWordSpellSkins = (): void => {
  registerSkin('word-spell', dragonCaveSkin);
};
```

**Invariant — module-eval-time registration.** `registerWordSpellSkins()`
runs as a top-level side effect of
`src/games/word-spell/definition.ts` (the same module that exports
`wordSpellDefinition`). Importing the game's definition guarantees
skin registration. Forms only render after their game's definition
module is imported. Registration is synchronous, one-shot, and never
lazy — there is no in-session register/unregister path in Phase 1.

A unit test asserts
`getRegisteredSkins('word-spell').length === 2` immediately after
`import('@/games/word-spell/definition')` resolves, with no separate
bootstrap call.

Classic is implicit (registry's fallback) — no explicit register
required.

### UI — skin radio

#### Simple form

Add a `Skin` field to `WordSpellSimpleConfigForm`:

- Renders as a radio group (per agreement — not a select, not a card
  grid)
- Label: i18n key `games.instructions.skin` (default English
  `"Skin"`) — placed alongside existing form labels in
  [games.json](src/lib/i18n/locales/en/games.json) (`instructions.customGameNameLabel` is the nearest sibling). The
  plan may relocate to a `config.*` subsection if a cleaner namespace
  is preferred; RTL is handled by existing layout primitives (the
  radio group is vertical, no per-component RTL work)
- Options derived from `getRegisteredSkins('word-spell')` — each
  option's label is `skin.name`, value is `skin.id`
- Default selection: `'classic'` when `config.skin` is unset or
  unknown
- Writes to `config.skin` via the form's `onChange`
- **Visibility gate**: if `getRegisteredSkins('word-spell').length < 2`,
  the field is not rendered (avoids a single-option radio)
- **Keyboard:** arrow keys move between options within the group;
  `Tab` enters/exits the group (roving `tabindex`)
- **Focus:** uses the existing focus-ring token from the project's
  design system (matches sibling inputs in `WordSpellSimpleConfigForm`)
- **`disabled` state:** not needed in Phase 1 — no business rule
  disables a specific skin
- **Accessibility:** the group renders as `role="radiogroup"` with
  `aria-label` derived from the same i18n key as the visible label;
  each radio's visible label is its accessible name

This component is rendered inside `InstructionsOverlay` (in-session
config) and `AdvancedConfigModal` (simple tab from home-screen cog).
One implementation, two surfaces. The simple form is the
child-accessible surface — a child can pick the skin themselves from
the in-session `InstructionsOverlay` without parent involvement; the
advanced form is the parent-oriented surface for fuller
configuration.

#### Advanced form

Register a `Skin` field in word-spell's entry of
`getAdvancedConfigFields` (see [config-fields-registry.tsx](src/games/config-fields-registry.tsx); the actual `wordSpellConfigFields` array is in `src/games/word-spell/types.ts`):

- Same data source (`getRegisteredSkins('word-spell')`)
- Same visibility gate
- Renders via the existing `ConfigFormFields` component as a new
  `radio` variant (see below)

**Add a `radio` variant to `ConfigField`.** The existing
[ConfigField](src/lib/config-fields.ts) union supports
`select | number | nested-number | nested-select | nested-select-or-number | checkbox`
but not `radio`. To keep both forms visually consistent (the simple
form is a hand-rolled radio per the agreement above), this PR extends
`ConfigField` with a `radio` variant and adds a matching renderer to
`ConfigFormFields`. The renderer mirrors the simple form's radio
group so the two surfaces share visual language. Other games (and
future enum-style config fields) can reuse this primitive without a
follow-up refactor.

The `radio` variant declares
`optionsSource: () => Array<{ value: string; label: string }>`
rather than a static `options` array. `ConfigFormFields` calls
`optionsSource()` at render time and **hides the entire field when
the result has fewer than 2 entries** — that is how the visibility
gate is honored in the advanced form without baking a side-channel
filter into `getAdvancedConfigFields`. Resolving options at render
also avoids the static-vs-runtime trap: at module-load time the skin
registry may be empty, but by the time `ConfigFormFields` renders the
module-eval-time invariant (above) guarantees registration has
landed.

### Seeding "The Floor is Lava"

A one-time per-profile seed inserts a row into `custom_games`. The
seed flag follows the established pattern in
[migrate-custom-games.ts:15-41](src/db/migrate-custom-games.ts): the
existing `app_meta` collection is a singleton (`id: 'singleton'`,
`additionalProperties: false`) whose values are patched via
`meta.incrementalPatch(...)`. We extend the singleton with a
per-profile map rather than introducing key/value semantics.

**Schema change.** Add an optional `theFloorIsLavaSeeded?: Record<string, true>`
field to `AppMetaDoc` (keyed by `profileId`), bump
`appMetaSchema.version` from 1 → 2, and add a migrationStrategies
entry that initialises the field to `undefined` for existing
singletons.

```ts
// src/db/seed-the-floor-is-lava.ts (sketch)
export const seedTheFloorIsLavaIfNeeded = async (
  db: AppDatabase,
  profileId: string,
): Promise<void> => {
  const meta = await db.app_meta.findOne('singleton').exec();
  if (meta?.theFloorIsLavaSeeded?.[profileId]) return; // already seeded for this profile

  const cfg: WordSpellConfig = {
    ...DEFAULT_RECALL_CONFIG, // post-lock-auto-eject regression fix
    skin: 'dragon-cave',
  };

  await db.custom_games.insert({
    // Deterministic id — duplicate inserts (multi-tab race, refresh
    // mid-seed, partial failure on the flag write) reject at the
    // RxDB primary-key layer instead of producing duplicate rows.
    id: `seed:the-floor-is-lava:${profileId}`,
    profileId,
    gameId: 'word-spell',
    name: 'The Floor is Lava',
    config: cfg,
    color: 'amber', // or whichever fits the dragon-cave palette
    cover: {
      kind: 'image',
      // Placeholder for Phase 1: a cropped screenshot of the
      // Dragon Cave in-game scene (sourced from the new VR baseline
      // for the cliff layout). Final cover art lands in a follow-up.
      src: `${import.meta.env.BASE_URL}skins/word-spell/dragon-cave/cover-placeholder.png`,
      alt: 'A dragon perched on a cliff above bubbling lava',
      background: 'amber-glow',
    },
    createdAt: new Date().toISOString(),
  });

  await meta?.incrementalPatch({
    theFloorIsLavaSeeded: {
      ...(meta.theFloorIsLavaSeeded ?? {}),
      [profileId]: true,
    },
  });
};
```

Called from the route loader (or a one-time bootstrap hook) before
the home screen renders. If the user deletes the row, the per-profile
flag remains set → no re-seed. If the user edits the row, the edits
stick.

**Ordering:** the seeder must run after `checkVersionAndMigrate`
completes (see [create-database.ts:150,172](src/db/create-database.ts)) so the v2
schema is in place before the seeder touches `app_meta`.

**Call site.** The seeder is invoked from the home-route component
(`src/routes/$locale/_app/index.tsx`) once the active profile is
resolved — the same scope that powers the custom-games grid — not
from a TanStack route loader. Route loaders don't have the active
profile in scope, and binding the seeder to the home-route component
naturally re-runs on each profile's first home-screen render so the
per-profile flag works as documented in edge case 7.

**Home-grid placement.** The seeded row uses the home grid's default
sort behavior — no pinning, no badge, no `isSystem` flag, no special
chrome. At first launch the grid contains only this card, so
discoverability is natural; on subsequent launches the row behaves
exactly like any user-created custom game. If a "new" indicator
turns out to be desirable, it lands in a follow-up tied to the
per-profile seed flag.

### Default `wrongTileBehavior` change

`DEFAULT_RECALL_CONFIG` at [$gameId.tsx:82](src/routes/$locale/_app/game/$gameId.tsx:82)
currently sets `wrongTileBehavior: 'lock-manual'`. Change to
`'lock-auto-eject'`. Confirm `DEFAULT_PICTURE_CONFIG` is already
`'lock-auto-eject'` (it is, line 111).

Confirm `makeDefaultNumberMatchConfig()` is already
`'lock-auto-eject'` ([line 139](src/routes/$locale/_app/game/$gameId.tsx:139)). No change to NumberMatch.
SortNumbers and SpotAll default audits are **out of scope for this
PR** — see the out-of-scope list above for the "skin-owned behavior"
direction.

Seeded "The Floor is Lava" config is cloned from
`DEFAULT_RECALL_CONFIG` after the fix → automatically gets
`'lock-auto-eject'`.

### Image optimization

**Scope: lossless PNG compression only** (e.g., `pngquant`, `oxipng`).
Sprite sheets and SVG conversion are out of scope for Phase 1 — both
carry real visual-regression risk (non-integer-scale bleed for
sprites; texture loss for SVG of stone shapes) that VR baselines
updated in the same PR would silently absorb.

Dragon Cave PNGs in `public/skins/word-spell/dragon-cave/`:

- `bg-left.png`, `bg-middle.png`, `bg-right.png` (scene panels)
- `cliff-left.png`, `cliff-right.png` (cliff layers)
- `dragon.png` (foreground character)
- `lava-floor-tile.svg` (already SVG)

Lossless compression produces byte-identical decompressed output, so
the VR baselines from PR #358 remain valid as the comparison point.
Exit criterion: every PNG above is run through the chosen compressor;
record the before/after byte size in the PR description. Sprite-sheet
and SVG-conversion exploration become their own follow-up PR.

**Asset-path stability invariant.** Any future image-optimization or
rename PR must preserve the asset paths the seeder writes
(`cover-placeholder.png`, `dragon.png`, the cliff/scene panels) — or
include a `custom_games` migration that rewrites stale URLs in
existing rows. The seeder freezes a URL in IndexedDB on first launch
and the row is never re-seeded; the URL has to keep resolving.

### Padding / UI tweaks

**Scope: WordSpell rendered under the Dragon Cave skin only.** No
other game, no other skin, no shared-component padding changes — any
edits to `Slot` / `SlotRow` are skin-scoped via CSS (e.g.,
`.skin-dragon-cave .slot { ... }`) so the classic skin and other
games remain pixel-stable.

In-app rendering uses a different container width than the Storybook
harness. Audit the WordSpell page under the Dragon Cave skin and tune:

- Letter-tile padding inside the bank (`LetterTileBank`)
- Slot padding inside the answer row (`Slot`, `SlotRow`)
- Margin between scene background and tile band

Scope cap: visual parity with the harness on a 1024px / 768px / 414px
viewport. The cliff-tile-shift math for long words is **not** in this
PR.

**Exit criteria for the padding pass:**

1. **New VR baselines for the Dragon Cave skin** are added in this
   PR (at 1024 / 768 / 414 px) — Dragon Cave VR doesn't exist today.
2. **Classic-skin VR for WordSpell stays byte-stable.** Padding
   changes are skin-scoped (e.g., `.skin-dragon-cave .slot { ... }`);
   any change that would alter the classic-skin baseline fails the
   review.
3. **Other games' VR stays byte-stable.** No shared-component CSS is
   touched in a way that affects NumberMatch / SortNumbers / SpotAll
   baselines.

Together these mean the only VR baselines that move in this PR are
the new Dragon Cave entries.

## Components / files affected

```text
src/games/word-spell/types.ts                    # add WordSpellSkinId + skin? field
src/games/number-match/types.ts                  # add NumberMatchSkinId + skin? field
src/games/sort-numbers/types.ts                  # add SortNumbersSkinId + skin? field
# (SpotAll deferred — see scope item 2)

src/games/word-spell/skins/index.ts              # NEW — registerWordSpellSkins()
src/games/word-spell/definition.ts               # module-load side effect: registerWordSpellSkins()
src/games/word-spell/skins/dragon-cave-skin.tsx  # (post-#358 rename of cave-dragon-skin.tsx)

src/games/word-spell/WordSpellSimpleConfigForm/  # add Skin radio
  WordSpellSimpleConfigForm.tsx
src/games/word-spell/types.ts                    # add Skin field to wordSpellConfigFields
src/games/config-fields-registry.tsx             # registry barrel — confirm wiring
src/lib/config-fields.ts                         # add `radio` variant to ConfigField union
src/components/ConfigFormFields.tsx              # add radio renderer
src/lib/skin/registry.ts                         # generic registerSkin + GameSkinIdMap

src/routes/$locale/_app/game/$gameId.tsx         # DEFAULT_RECALL_CONFIG wrongTileBehavior
src/games/sort-numbers/resolve-simple-config.ts  # audit defaults if relevant
src/games/spot-all/resolve-simple-config.ts      # audit defaults if relevant

src/db/seed-the-floor-is-lava.ts                 # NEW — seeder
src/db/schemas/app-meta.ts                       # extend if needed for seed flag
src/db/create-database.ts                        # call seeder after DB ready
src/routes/$locale/_app/index.tsx                # ensure seed runs before home renders

public/skins/word-spell/dragon-cave/*            # optimized assets
src/games/word-spell/skins/dragon-cave-skin.tsx  # update asset paths if sprite

src/games/word-spell/WordSpell/                  # padding tweaks
  WordSpell.module.css (or equivalent)
src/games/word-spell/LetterTileBank/             # padding tweaks
src/components/answer-game/Slot/                 # padding tweaks if shared
```

Test files (added or updated):

```text
src/games/word-spell/WordSpellSimpleConfigForm/  # skin radio test
  WordSpellSimpleConfigForm.test.tsx
src/lib/skin/registry.test.ts                    # dragon-cave registration test
src/db/seed-the-floor-is-lava.test.ts            # NEW — one-time seed test
src/routes/$locale/_app/game/$gameId.test.tsx    # default config + seed integration
tests-e2e/the-floor-is-lava.e2e.ts               # NEW — full play-through with skin
tests-vr/word-spell-skin-picker.spec.ts          # NEW — skin radio VR
```

## Edge cases

1. **User deletes "The Floor is Lava".** Migration flag remains set
   → no re-seed. Accepted behavior.
2. **User renames "The Floor is Lava" to something else.** Edit goes
   through the normal custom-game update path. Saved config still has
   `skin: 'dragon-cave'`. Renders correctly.
3. **User reskins "The Floor is Lava" to classic.** Custom-game
   update sets `config.skin = 'classic'`. Next play uses classic.
   Skin radio still shows both options if both are registered.
4. **Saved config has `skin: 'unknown-skin-id'`.** `resolveSkin`
   already falls back to `classicSkin`. Form should normalize the
   selected option to `'classic'` on render.
5. **Existing saved configs predate this PR.** `config.skin` is
   `undefined` → resolves to classic, picker shows classic selected.
   No migration needed.
6. **A user's old saved config still has `wrongTileBehavior: 'lock-manual'`.**
   Honored as-is. Only the default for **new** saves changes. Users
   keep their explicit preference until they re-save. Existing users
   may notice that "The Floor is Lava" (seeded with the new default)
   behaves differently from their older WordSpell configs — the PR
   description / release notes should include a one-line hint: "If
   your saved WordSpell configs feel different from new ones, re-save
   them to pick up the latest defaults."
7. **Profile switching.** Seed flag is per profile (or per database
   if app_meta is global — confirm during impl). Each profile gets
   its own seeded "The Floor is Lava" on first launch.
8. **App reinstall / DB clear.** Seed flag is gone → seed re-runs.
   Acceptable.
9. **Single-skin game.** If `getRegisteredSkins(gameId).length === 1`,
   the picker stays hidden (no awkward "Skin: Classic" radio with one
   option).

## Testing strategy

- **Unit**: skin radio component renders given mocked registry; visibility
  gate; default selection logic; onChange writes to config.
- **Unit**: seeder is idempotent (call twice → one row), respects flag,
  honors profile boundary.
- **Integration (route test)**: route loader inserts seed → home screen
  shows "The Floor is Lava" card → tapping it loads with the dragon
  skin.
- **E2E**: full play-through of "The Floor is Lava" — open from home
  card, see Dragon Cave scene, place tiles, complete round, see
  celebration.
- **VR**: skin radio (with both options) under default theme; home
  screen with "The Floor is Lava" card; in-game scene under the skin
  at 1024 / 768 / 414 widths.

**Test isolation.** Every test that mounts a config form or otherwise
reads the skin registry calls
[`__resetSkinRegistryForTests()`](src/lib/skin/registry.ts) in
`beforeEach` and explicitly registers only the skins the test
expects. Without this, harness modules
(e.g., `WordSpell.skin.stories.tsx`) that call `registerSkin` at
module load can leak entries into adjacent tests and inflate
`getRegisteredSkins(...)` results unexpectedly.

## Open questions

1. ~~**Bootstrap site for `registerWordSpellSkins`**~~
   **Resolved (review round 1):** `src/games/word-spell/definition.ts`
   as a module-load side effect. See
   [Architecture → Production skin registration](#production-skin-registration).
2. **Cover image for "The Floor is Lava"** — Phase 1 ships with a
   placeholder cover (`cover-placeholder.png`) generated from a
   cropped Dragon Cave VR baseline. User will provide a final cover
   asset in a follow-up. Aspect ratio, `object-fit`, and
   broken-image fallback follow the existing custom-game card
   renderer's contract — plan author confirms against the renderer
   before implementation.
3. ~~**`app_meta` schema** — does it already support a key/value flag,
   or do we need a new schema version?~~ **Resolved (review round 1):**
   `app_meta` is a singleton with `additionalProperties: false`; this
   PR bumps `appMetaSchema.version` to 2 and adds a
   `theFloorIsLavaSeeded?: Record<profileId, true>` field. See
   [Architecture → Seeding "The Floor is Lava"](#seeding-the-floor-is-lava).
4. **Image-optimization strategy** — leave as "investigate and ship
   the biggest win that fits"; the plan can pick after measuring.
5. **Padding adjustment** — exact values come from a visual pass
   during implementation, not the spec.

## References

- PR [#357](https://github.com/leocaseiro/base-skill/pull/357) — XState
  migration of WordSpell + SortNumbers (merged)
- PR [#358](https://github.com/leocaseiro/base-skill/pull/358) —
  Cave-Dragon skin (open, to be renamed `dragon-cave`)
- Issue [#359](https://github.com/leocaseiro/base-skill/issues/359) —
  drag-ghost consolidation (separate refactor, not in this PR)
- Handoff: [worktrees/feat-word-spell-cave-dragon-skin/.claude/handoffs/2026-05-13-post-pr357-wire-skin-into-route.md](worktrees/feat-word-spell-cave-dragon-skin/.claude/handoffs/2026-05-13-post-pr357-wire-skin-into-route.md)
- Skin registry: [src/lib/skin/registry.ts](src/lib/skin/registry.ts)
- Skin hook: [src/lib/skin/useGameSkin.ts](src/lib/skin/useGameSkin.ts)
- Game catalog: [src/games/registry.ts](src/games/registry.ts)
- Custom games schema: [src/db/schemas/custom_games.ts](src/db/schemas/custom_games.ts)
- Advanced config modal: [src/components/AdvancedConfigModal.tsx](src/components/AdvancedConfigModal.tsx)

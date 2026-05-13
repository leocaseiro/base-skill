---
status: draft
date: 2026-05-13
branch: feat/multi-skin-config
follow-up-plan: docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md (TBD)
depends-on:
  - PR #358 (cave-dragon → dragon-cave rename lands there)
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

## Prerequisites

PR #358 (currently open, awaiting review) must land the `cave-dragon`
→ `dragon-cave` rename before this PR merges. Affected identifiers in
PR #358's diff:

- Skin file: `cave-dragon-skin.tsx` → `dragon-cave-skin.tsx`
- Asset folder: `public/skins/word-spell/cave-dragon/` →
  `public/skins/word-spell/dragon-cave/`
- Const export: `caveDragonSkin` → `dragonCaveSkin`
- Skin id: `'cave-dragon'` → `'dragon-cave'`
- Display name: `'Cave & Dragon'` → `'Dragon Cave'`
- CSS class hooks: `.skin-cave-dragon` → `.skin-dragon-cave`,
  `.cave-dragon-stone` → `.dragon-cave-stone` (note: the stone class is
  intentionally unscoped — see PR #358 carry-forward decisions)
- Storybook ids / localStorage harness key
  (`skin-harness:selected-skin:word-spell` value)

If PR #358 lands with `cave-dragon` still in place, this PR includes
the rename as its first commit and PR #358 carries the old identifier
into history. Either order works; PR #358's review thread should pick.

## Scope — in this PR

1. **Production registration of `dragonCaveSkin` for `word-spell`**
   via a bootstrap module imported once at app init.
2. **Per-game `SkinId` union types** (`WordSpellSkinId`,
   `NumberMatchSkinId`, `SortNumbersSkinId`, `SpotAllSkinId`).
3. **Add `skin?: <Game>SkinId`** to every game's `Config` interface
   (only WordSpell has more than one skin today; the other unions are
   single-member placeholders ready to extend).
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
- **No skins for NumberMatch / SortNumbers / SpotAll** yet. Their
  Config types get the `skin?` field for symmetry, but no non-classic
  skin is registered, so the picker stays hidden.
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

## Architecture

### Type system

Each game owns its own `SkinId` union type, exported from its
`types.ts`. Adding a new skin requires adding it to the union AND
registering it in the runtime registry — both stay in lockstep.

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

Same shape for `SortNumbersSkinId` and `SpotAllSkinId`. The runtime
registry (`src/lib/skin/registry.ts`) keeps using `Map<string, GameSkin>`;
the per-game unions only constrain authored config values.

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

Called once at app bootstrap. The most natural site is alongside
`wordSpellDefinition` in `src/games/word-spell/definition.ts`, or in
`src/main.tsx`. Decision deferred to implementation — both work; the
plan should pick whichever has a clearer "things that run at app start"
neighborhood.

Classic is implicit (registry's fallback) — no explicit register
required.

### UI — skin radio

#### Simple form

Add a `Skin` field to `WordSpellSimpleConfigForm`:

- Renders as a radio group (per agreement — not a select, not a card
  grid)
- Label: "Skin" (i18n key TBD, default English "Skin")
- Options derived from `getRegisteredSkins('word-spell')` — each
  option's label is `skin.name`, value is `skin.id`
- Default selection: `'classic'` when `config.skin` is unset or
  unknown
- Writes to `config.skin` via the form's `onChange`
- **Visibility gate**: if `getRegisteredSkins('word-spell').length < 2`,
  the field is not rendered (avoids a single-option radio)

This component is rendered inside `InstructionsOverlay` (in-session
config) and `AdvancedConfigModal` (simple tab from home-screen cog).
One implementation, two surfaces.

#### Advanced form

Register a `Skin` field in word-spell's entry of
`getAdvancedConfigFields` (see [config-fields-registry.ts](src/games/config-fields-registry.ts)):

- Same data source (`getRegisteredSkins('word-spell')`)
- Same visibility gate
- Renders via the existing `ConfigFormFields` component (radio
  primitive, if available, else a labelled select)

### Seeding "The Floor is Lava"

A one-time per-profile seed inserts a row into `custom_games`. Tracked
via a migration flag in `app_meta` (or whatever equivalent the
existing app_meta schema provides — confirm during implementation).

```ts
// src/db/seed-the-floor-is-lava.ts (sketch)
const SEED_FLAG = 'seeded:the-floor-is-lava:v1';

export const seedTheFloorIsLavaIfNeeded = async (
  db: AppDatabase,
  profileId: string,
): Promise<void> => {
  const flagDoc = await db.app_meta.findOne(SEED_FLAG).exec();
  if (flagDoc) return; // already seeded for this profile

  const cfg: WordSpellConfig = {
    ...DEFAULT_RECALL_CONFIG, // post-lock-auto-eject regression fix
    skin: 'dragon-cave',
  };

  await db.custom_games.insert({
    id: nanoid(),
    profileId,
    gameId: 'word-spell',
    name: 'The Floor is Lava',
    config: cfg,
    color: 'amber', // or whichever fits the dragon-cave palette
    cover: {
      kind: 'image',
      src: `${import.meta.env.BASE_URL}skins/word-spell/dragon-cave/dragon.png`,
      alt: 'A dragon perched on a cliff above bubbling lava',
      background: 'amber-glow',
    },
    createdAt: new Date().toISOString(),
  });

  await db.app_meta.insert({ id: SEED_FLAG, value: true });
};
```

Called from the route loader (or a one-time bootstrap hook) before
the home screen renders. If the user deletes the row, the flag remains
set → no re-seed. If the user edits the row, the edits stick.

The exact `app_meta` schema (or `localStorage` fallback if app_meta
doesn't exist with this shape yet) is settled during implementation.

### Default `wrongTileBehavior` change

`DEFAULT_RECALL_CONFIG` at [$gameId.tsx:82](src/routes/$locale/_app/game/$gameId.tsx:82)
currently sets `wrongTileBehavior: 'lock-manual'`. Change to
`'lock-auto-eject'`. Confirm `DEFAULT_PICTURE_CONFIG` is already
`'lock-auto-eject'` (it is, line 111).

Audit and align:

- `makeDefaultNumberMatchConfig()` — currently `'lock-auto-eject'`
  ([line 139](src/routes/$locale/_app/game/$gameId.tsx:139)). No change.
- `makeDefaultSortNumbersConfig()` — defers to
  `resolveSimpleConfig`. Confirm + align if the resolver bakes in a
  default.
- `makeDefaultSpotAllConfig()` — defers to
  `resolveSpotAllSimpleConfig`. Same audit.

Seeded "The Floor is Lava" config is cloned from
`DEFAULT_RECALL_CONFIG` after the fix → automatically gets
`'lock-auto-eject'`.

### Image optimization

Dragon Cave PNGs in `public/skins/word-spell/dragon-cave/`:

- `bg-left.png`, `bg-middle.png`, `bg-right.png` (scene panels)
- `cliff-left.png`, `cliff-right.png` (cliff layers)
- `dragon.png` (foreground character)
- `lava-floor-tile.svg` (already SVG)

Investigate during implementation:

- **Lossless PNG compression** (`pngquant`, `oxipng`) — biggest win
  per byte, no code change.
- **Sprite sheet** — combines the layered scene into one image
  composited via `background-position`. Cuts HTTP requests by ~5×,
  but increases authoring complexity and risks bleed at non-integer
  scales.
- **SVG conversion** where viable — `cliff-left.png` and
  `cliff-right.png` are geometric stone shapes; could be replaced
  with paths. Highest reward, biggest effort.

Pick the option(s) with the biggest payload reduction in the
implementation plan. Single-PR scope keeps the bar at "ship a
measurable improvement" — full sprite-sheet conversion is fine to
defer if it doesn't fit.

### Padding / UI tweaks

In-app rendering uses a different container width than the Storybook
harness. Audit the WordSpell page under the Dragon Cave skin and tune:

- Letter-tile padding inside the bank (`LetterTileBank`)
- Slot padding inside the answer row (`Slot`, `SlotRow`)
- Margin between scene background and tile band

Scope cap: visual parity with the harness on a 1024px / 768px / 414px
viewport. The cliff-tile-shift math for long words is **not** in this
PR.

## Components / files affected

```text
src/games/word-spell/types.ts                    # add WordSpellSkinId + skin? field
src/games/number-match/types.ts                  # add NumberMatchSkinId + skin? field
src/games/sort-numbers/types.ts                  # add SortNumbersSkinId + skin? field
src/games/spot-all/types.ts                      # add SpotAllSkinId + skin? field

src/games/word-spell/skins/index.ts              # NEW — registerWordSpellSkins()
src/games/word-spell/definition.ts               # call registerWordSpellSkins (or main.tsx)
src/games/word-spell/skins/dragon-cave-skin.tsx  # (post-#358 rename of cave-dragon-skin.tsx)

src/games/word-spell/WordSpellSimpleConfigForm/  # add Skin radio
  WordSpellSimpleConfigForm.tsx
src/games/config-fields-registry.ts              # add Skin field to word-spell entry

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
   keep their explicit preference until they re-save.
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

## Open questions

1. **Bootstrap site for `registerWordSpellSkins`** — `definition.ts`
   (same module as `wordSpellDefinition`) or `main.tsx`. Decided
   during plan, not spec.
2. **Cover image for "The Floor is Lava"** — `dragon.png` is the
   obvious candidate. Confirm during plan.
3. **`app_meta` schema** — does it already support a key/value flag,
   or do we need a new schema version? Confirm during plan.
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

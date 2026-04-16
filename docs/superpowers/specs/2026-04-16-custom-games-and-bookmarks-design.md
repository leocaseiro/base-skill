# Custom Games and Bookmarks — Design

**Status:** Draft — awaiting user review
**Date:** 2026-04-16
**Author:** Leo Caseiro (with Claude)

## Problem

Today's codebase uses "bookmark" to mean two different things conflated into one
concept: a **saved variation** of a game with custom settings. The code stores
these in a `saved_game_configs` RxDB collection, exposes them via the
`useSavedConfigs` hook, and labels them "bookmark" everywhere in UI and i18n
copy.

Two gaps follow from that conflation:

1. There is **no way to delete** a saved variation from the UI. `grep` across
   `src/**` for `onRemove|onDelete|removeConfig|deleteBookmark` returns zero
   hits for custom game deletion — the functionality simply isn't wired.
2. There is **no real bookmark concept**. A user can't mark a default game
   (e.g. Word Spell with default settings) as a favourite. The only way to
   "bookmark" anything is to save a customised variation, which changes the
   item's identity.

## Goals

- Rename the existing "bookmark" surface to **custom game** everywhere it
  leaks through: DB, types, hooks, components, props, CSS vars, i18n, and
  active docs. The collection stores customised copies of games — it should
  read that way.
- Add a **delete** action for custom games, with a confirmation step, so users
  can clean up variations they no longer want.
- Lay the groundwork for a future **bookmark** toggle (Phase 2, separate PR)
  that can mark either a default game or a custom game as a favourite. This
  design specifies Phase 2 but does not implement it.

## Non-goals

- Search or filter by bookmark — deferred until Phase 2 and beyond.
- Sharing or exporting custom games.
- Changing the simple/advanced config form layout.
- Renaming historical SpecStory entries (`.specstory/history/**` is an
  append-only record).

## Vocabulary

| Term             | Meaning                                                 | Creation                    | Deletion                | Bookmarkable (Phase 2) |
| ---------------- | ------------------------------------------------------- | --------------------------- | ----------------------- | ---------------------- |
| **Default game** | A catalog entry from `GAME_CATALOG`                     | From the registry           | Not possible            | Yes                    |
| **Custom game**  | A user-saved variation of a default game with a config  | Save in AdvancedConfigModal | User, with confirmation | Yes                    |
| **Bookmark**     | Per-item favourite flag, across both default and custom | Toggle                      | Toggle                  | —                      |

## Current state (post-rebase, master at `ba7480da`)

The rebase dropped `SavedConfigChip` and changed the card architecture. The
findings below reflect the current master.

### `src/components/GameCard.tsx`

Two discriminated variants: `default` and `bookmark`.

- Entire card body is a play button (calls `onPlay`).
- Cog (`SettingsIcon`) button, bottom-right → `onOpenCog`.
- On `variant: 'bookmark'`, a `BookmarkIcon` badge is rendered over the cover.
- No chips, no delete button, no inline creation form.

### `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`

- Title row shows `bookmarkName ?? gameTitle`; when a bookmark is active the
  game title appears as italic subtitle.
- Cog (`SettingsIcon`) in the title row → opens `AdvancedConfigModal`.
- Simple settings form (game-specific) is always expanded.
- `Let's go` button plays; if the current config is on a default game,
  `handlePlay` first opens a **save-on-play dialog** asking for a bookmark
  name.
- `🔖` emoji save button from older code is **gone** — no legacy residue here.

### `src/components/AdvancedConfigModal.tsx`

- Two modes: `{ kind: 'default' }` or `{ kind: 'bookmark', configId, name,
color, cover }`.
- Fields: cover picker, name input, color palette, advanced config fields.
- Buttons: Cancel, Update (bookmark mode only), Save as new.
- **No Delete button** — this is the gap Phase 1 closes.

### Data & hooks

- `src/db/schemas/saved_game_configs.ts` — RxJSON schema v1:
  `{ id, profileId, gameId, name, config, createdAt, color }`.
- `src/db/hooks/useSavedConfigs.ts` — returns
  `{ savedConfigs, gameIdsWithConfigs, save, remove, updateConfig,
persistLastSessionConfig }`. `remove` exists on the hook but **no UI surface
  calls it today**.
- `src/db/hooks/usePersistLastGameConfig.ts` — writes a hidden
  "last-session" doc per gameId via `lastSessionSavedConfigId(gameId)`.
- `src/db/last-session-game-config.ts` — key helper.
- `src/lib/bookmark-colors.ts` — `BookmarkColorKey`, `BOOKMARK_COLORS`,
  `BOOKMARK_COLOR_KEYS`, `DEFAULT_BOOKMARK_COLOR`.
- `src/lib/suggest-bookmark-name.ts` — name suggestion helper used in
  InstructionsOverlay save-on-play.

### i18n

`src/lib/i18n/locales/{en,pt-BR}/common.json` has bookmark-flavoured keys
(e.g. `saveConfig.*`, `saveAsNew`, `saveBookmarkLabel`, `updateBookmark`).
`games.json` contains `instructions.saveOnPlayTitle`, `saveOnPlayNameLabel`,
`nameRequired`, `nameDuplicate`, `saveAsNew`, `updateBookmark`,
`saveAndPlay`, `playWithoutSaving`, `cancel`.

### CSS utilities

`src/styles.css` defines `--bookmark-play`, `.bookmark-bg`,
`.bookmark-tag-bg`, `.bookmark-text`.

### Routes

`src/routes/$locale/_app/index.tsx` and
`src/routes/$locale/_app/game/$gameId.tsx` both consume the
`bookmark*` props and `useSavedConfigs` surface.

## Phase 1 — Rename + Delete

### Scope

Rename every non-historical "bookmark" reference to "custom game" (code,
types, hooks, props, CSS vars, i18n, active specs), migrate the RxDB
collection, swap the cover-badge icon to a **type indicator**, and add a
**Delete** action with confirmation.

### Naming decisions

**Domain term**: "Bookmark" → "Custom game".

**Database**:

- Collection `saved_game_configs` → `custom_games`.
- Doc type `SavedGameConfigDoc` → `CustomGameDoc`.
- Schema variable `savedGameConfigsSchema` → `customGamesSchema`.

**Hook (`src/db/hooks/useSavedConfigs.ts` → `useCustomGames.ts`)**:

- Return key `savedConfigs` → `customGames`.
- Return key `gameIdsWithConfigs` → `gameIdsWithCustomGames`.
- Return key `updateConfig` → `update`.
- `persistLastSessionConfig` keeps its name — it is about transient session
  state (resume with last-used settings), not about custom games.

**Session helpers**: `lastSessionSavedConfigId` → `lastSessionConfigId`.

**Library helpers**: `suggestBookmarkName` → `suggestCustomGameName`.

**Types**: `SaveBookmarkInput` → `SaveCustomGameInput`.
`AdvancedConfigModalMode.kind: 'bookmark'` → `'customGame'`.

**Component props** (`GameCard`, `InstructionsOverlay`, `AdvancedConfigModal`,
`GameGrid`, routes): `bookmarkId/Name/Color` → `customGameId/Name/Color`;
`onSaveBookmark`/`onUpdateBookmark` → `onSaveCustomGame`/`onUpdateCustomGame`;
`existingBookmarkNames` → `existingCustomGameNames`.

**Colors library** (`src/lib/bookmark-colors.ts` → `game-colors.ts`):

- `BookmarkColorKey` → `GameColorKey`.
- `BOOKMARK_COLORS` → `GAME_COLORS`.
- `BOOKMARK_COLOR_KEYS` → `GAME_COLOR_KEYS`.
- `DEFAULT_BOOKMARK_COLOR` → `DEFAULT_GAME_COLOR`.

**CSS**:

- Custom property `--bookmark-play` → `--game-play`.
- Utility classes `.bookmark-bg`, `.bookmark-tag-bg`, `.bookmark-text` →
  `.game-bg`, `.game-tag-bg`, `.game-text`.

**i18n keys**: `common.saveConfig.*` → `common.customGame.*`. Copy updates:

- "Save as new bookmark" → "Save as new custom game".
- "Update bookmark" → "Update custom game".
- "Bookmark name" → "Custom game name".
- "A bookmark with that name already exists." → "A custom game with that name
  already exists."

### DB migration

RxDB does not support renaming a collection in place. The migration is a
**one-shot copy-and-drop** at database init:

1. On `getOrCreateDatabase()` boot, check `app-meta` for a
   `custom_games_migrated` flag.
2. If absent:
   a. Create the new `custom_games` collection at schema version 1.
   b. Read every doc from `saved_game_configs` (excluding hidden last-session
   docs — they remain where they are to preserve resume-last-session
   behaviour, keyed off `gameId`).
   c. Insert copies into `custom_games`.
   d. On success, set `custom_games_migrated = true` in `app-meta`.
   e. Delete copied docs from `saved_game_configs` after the flag is set.
3. If the flag is set, skip migration entirely.
4. If the migration fails partway, the flag stays unset and the next boot
   retries. The copy is idempotent because `custom_games` IDs are identical
   to source IDs — use `upsert` (not `insert`) so re-running is a no-op on
   rows that were already copied.

Hidden last-session docs are identified by their id prefix from
`lastSessionSavedConfigId(gameId)` and are excluded from both the copy (step
2b) and the delete (step 2e). They stay in `saved_game_configs` under the
existing key scheme, preserving resume-last-session behaviour. Splitting
those into their own collection is tracked as a follow-up cleanup but not
part of Phase 1.

### Icon changes

Use `lucide-react` icons.

| Where                            | Before          | After             |
| -------------------------------- | --------------- | ----------------- |
| `GameCard` cover badge, default  | (none)          | `CircleDashed`    |
| `GameCard` cover badge, custom   | `BookmarkIcon`  | `CircleDot`       |
| `AdvancedConfigModal` delete btn | (did not exist) | `Trash2` (lucide) |
| `InstructionsOverlay` title cog  | `SettingsIcon`  | unchanged         |
| `GameCard` bottom-right cog      | `SettingsIcon`  | unchanged         |

The default-vs-custom badge is a **type indicator**, not an action. The cog
remains the single entry point for configuration and saving.

### Delete action

Add a **Delete** button to `AdvancedConfigModal` visible only when
`mode.kind === 'customGame'`.

- **Location**: left of the Cancel/Update/Save cluster in the footer, styled
  as a destructive secondary action (red text, outline button).
- **Flow**: click → open a confirmation `Dialog` nested inside or overlaying
  the modal:
  - Title: "Delete '<name>'?"
  - Body: "This custom game will be removed. You can't undo this."
  - Buttons: "Cancel" (default focus) and "Delete" (destructive).
- **On confirm**: call `useCustomGames().remove(id)`. Close the confirm
  dialog and the modal. If the delete was triggered from the game route
  (`/$locale/game/$gameId` with `configId=<id>`), strip `configId` from the
  search params so the user lands on the default variant of that game. If it
  was triggered from the home route, close the modal and stay on the home
  screen — the custom game card disappears via the RxDB reactive query.
- **On cancel**: close the confirm dialog, leave modal open.

### Creation flow

Unchanged. Custom games are created from the AdvancedConfigModal, which is
opened by the cog on either `GameCard` or `InstructionsOverlay`. The
save-on-play dialog in `InstructionsOverlay` continues to offer a quick "save
these settings" prompt when launching a default game with edited settings.

### Component interface map

- `GameCard.tsx` — replace `variant: 'bookmark'` → `variant: 'customGame'`;
  rename `bookmarkName` → `customGameName`, `bookmarkColor` →
  `customGameColor`. Cover badge swaps to `CircleDashed` / `CircleDot`.
- `AdvancedConfigModal.tsx` — mode discriminator `'bookmark'` →
  `'customGame'`; export type `AdvancedConfigModalMode` updated; add
  `onDelete?: (id: string) => Promise<void>` prop; add Delete button.
- `InstructionsOverlay.tsx` — rename props; `SaveBookmarkInput` →
  `SaveCustomGameInput`; save-on-play dialog copy updated.
- `GameGrid.tsx` — rename prop pass-through.
- `src/routes/$locale/_app/index.tsx` and
  `src/routes/$locale/_app/game/$gameId.tsx` — rename all local variables,
  imports, and prop pass-throughs. Hook `useSavedConfigs` → `useCustomGames`.

### Docs updates

- Rename in-place across `docs/**/*.md` where the concept is referenced.
  Keep SpecStory (`.specstory/history/**`) untouched.
- Historical PRD/specs referring to bookmark: add a one-line note at the top
  (e.g. "_Renamed 2026-04-16 — see `2026-04-16-custom-games-and-bookmarks-design.md`_")
  and replace in-body `bookmark` → `custom game` where the meaning is the
  saved variation. Leave other "bookmark" uses (browser bookmarks, analogies)
  alone.
- Architecture docs (co-located `.mdx` under
  `src/components/answer-game/`) updated if they reference the renamed
  symbols.

### Testing

- Unit tests renamed file-by-file alongside implementation
  (`useSavedConfigs.test.tsx` → `useCustomGames.test.tsx`, etc.). No
  behavioural drift expected.
- New unit test coverage for `useCustomGames().remove` called from the
  AdvancedConfigModal delete path.
- New component test for `AdvancedConfigModal` delete confirmation flow:
  button visible only for `customGame` mode, confirm dialog opens,
  cancel keeps modal, confirm calls `onDelete`.
- Migration test: seed an RxDB instance with `saved_game_configs` entries,
  run the boot migration, assert `custom_games` has the same rows and the
  flag is set. Re-run boot, assert no double-copy.
- E2E: Playwright flow — create a custom game, delete it, confirm it's gone
  from the home screen.
- VR: GameCard default + custom-variant covers should snapshot the new
  `CircleDashed` / `CircleDot` badges. Update baselines in the same PR.

### Open questions

None at spec-approval time. Any surprises surfaced during implementation are
resolved inline and captured in the plan's change log.

## Phase 2 — Bookmark toggle (separate PR, spec only)

### Data model

New RxDB collection `bookmarks`:

```ts
export type BookmarkDoc = {
  id: string; // `${profileId}:${targetType}:${targetId}`
  profileId: string;
  targetType: 'game' | 'customGame';
  targetId: string; // gameId for defaults, customGame.id for customs
  createdAt: string; // ISO 8601
};
```

Composite id gives us a natural upsert key and allows cheap `isBookmarked`
lookups without a query.

### UI surfaces

- **`GameCard`**: `Star` icon (filled = bookmarked, empty = not) in the
  cover corner. Clickable on both default and custom variants.
- **`InstructionsOverlay`**: `Star` button next to the title-row cog.
- **No deletion cascade**: un-bookmarking a default game does nothing to the
  catalog entry; un-bookmarking a custom game only removes the bookmark row,
  leaving the custom game intact.

### Hook

`useBookmarks()` exposing `{ bookmarks, isBookmarked(target), toggle(target),
add(target), remove(target) }` where `target` is
`{ targetType, targetId }`.

### Out of scope for Phase 2

- Search / filter by bookmark state — deferred.
- Bookmark ordering, folders, or multi-device sync semantics beyond RxDB
  defaults.

## Rollout

1. **PR 1 (Phase 1)**: rename + DB migration + delete. Merged behind no flag;
   the migration is idempotent and silent.
2. **PR 2 (Phase 2)**: new `bookmarks` collection + Star toggles, authored
   from the Phase 2 section of this spec.

## References

- Current state snapshot: master at `ba7480da` (v0.8.0).
- Smart pipelines: `docs/superpowers/specs/2026-04-14-smart-pipelines-design.md`
  — triggers unit/VR/e2e buckets based on touched files.
- Skin pattern (prior rollout): `docs/superpowers/specs/2026-04-13-game-skin-system-design.md`.

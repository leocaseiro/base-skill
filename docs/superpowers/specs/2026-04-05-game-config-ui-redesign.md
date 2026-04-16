# Game Config UI Redesign

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

Three related changes to how game configuration is presented and edited:

1. **Hide config panel during gameplay** — the floating `<details>/<summary>` overlay is removed from the game screen entirely.
2. **GameCard homepage redesign** — saved configs (custom games) show color-themed expandable chips with config tags and an inline editable form. Game description text is added to each card.
3. **Instructions screen redesign** — the instructions overlay gains a game-name chip, and a collapsible ⚙️ Settings chip below the "Let's go!" button that lets the user tweak and save config before starting.

---

## 1. Hide Config During Gameplay

The three `*ConfigPanel` components (`WordSpellConfigPanel`, `NumberMatchConfigPanel`, `SortNumbersConfigPanel`) are rendered as fixed overlays during gameplay inside `$locale/_app/game/$gameId.tsx`. They are removed entirely from the game body components (`WordSpellGameBody`, `NumberMatchGameBody`, `SortNumbersGameBody`).

`usePersistLastGameConfig` remains in each game body — config is still persisted to IndexedDB as the game runs, but the editing UI is gone from gameplay.

---

## 2. GameCard Homepage Redesign

### 2a. Game description

`GameCatalogEntry` in `src/games/registry.ts` gains a `descriptionKey: string` field (i18n key). Each game in `GAME_CATALOG` gets a short one-sentence description. The `GameCard` renders it as a `<p>` below the title, above the level badges.

### 2b. Custom game chip component — `SavedConfigChip`

A new shared component `src/components/SavedConfigChip.tsx` replaces the inline chip markup in `GameCard`. It handles both collapsed and expanded states.

**Collapsed state:**

- Header row: `min-height: 48px`, horizontally split into three zones:
  - **Name button** (flex-1): taps to toggle expand
  - **▶ Play button** (48×48): navigates directly to the game with this config
  - **✕ Delete button** (48×48): removes the custom game
- Below the header: a row of small config summary tags auto-generated from `config` (e.g., `drag`, `8 rounds`, `picture`, `TTS on`)
- Color is derived from the saved `color` field on the custom game doc

**Expanded state (editing):**

- Header turns solid with the custom game color, shows `▲` indicator
- Below the header: an inline form with game-specific fields (selects, number inputs, checkboxes), all `min-height: 48px`
- At the bottom of the form:
  - Editable name input
  - **Save** button (updates the custom game's name + config in RxDB)
  - **Cancel** button (reverts to collapsed without saving)
- Only one chip can be expanded at a time per card

### 2c. Custom game color

`SavedGameConfigDoc` gains a `color: string` field (one of 12 palette keys: `indigo`, `teal`, `rose`, `amber`, `sky`, `lime`, `purple`, `orange`, `pink`, `emerald`, `slate`, `cyan`). Each key maps to a `{ bg, border, tagBg, tagText, playBg, text }` token set.

The color is chosen in the **Save Config Dialog** (`SaveConfigDialog.tsx`), which is extended with:

- A 12-swatch color palette picker (circular 36px swatches, 48px tap area)
- A live preview chip showing name + color
- The existing name input and validation

### 2d. Snapshot last config on save

`onSaveConfig` in `src/routes/$locale/_app/index.tsx` currently passes `config: {}`. It is updated to:

1. Read the `last:anonymous:<gameId>` doc from `db.saved_game_configs` at save time
2. Pass that doc's `config` (or `{}` if not yet played) to `useSavedConfigs.save()`

This ensures custom games always start from the last-played state.

### 2e. Config summary tag generation

A pure function `configToTags(config: Record<string, unknown>): string[]` in a new `src/lib/config-tags.ts` file maps known config keys to human-readable short strings. Unknown keys are ignored. Used by `SavedConfigChip` collapsed view and the instructions screen chip.

---

## 3. Instructions Screen Redesign

`InstructionsOverlay` (`src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`) is redesigned. Its props are extended:

```ts
interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  // new:
  gameTitle: string;
  custom gameName?: string; // present when launched via a saved config
  custom gameColor?: string; // palette key, same as SavedConfigChip
  subject?: string; // shown as tag when no custom game
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveCustom game: (name: string, color: string) => Promise<void>;
  onUpdateCustom game?: (
    name: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  configFields: ConfigField[]; // game-specific field descriptors
}
```

### Layout (top to bottom, vertically centered, scrollable)

1. **Game name chip** — a display-only `GameNameChip` component (not `SavedConfigChip`). Visually identical to the `SavedConfigChip` collapsed header but has no tap-to-expand, no play button, and no delete button. Shows `custom gameName` badge if present; otherwise shows `subject` tag. Uses `custom gameColor` or neutral grey.

2. **Instructions text** — `text` prop, `font-size: 16px`, centered, `max-width: 280px`.

3. **"Let's go!" button** — `height: 56px`, full-width, primary color. Calls `onStart`.

4. **⚙️ Settings chip** — collapsible (collapsed by default). Uses the same `SavedConfigChip` expand/collapse pattern with neutral grey styling.
   - **Collapsed**: shows `⚙️ Settings` label + `▼` + config summary tags
   - **Expanded**: shows the game-specific form fields + a save section at the bottom:
     - If `custom gameName` present: editable name input, "Update `<name>`" button, "Save as new…" button
     - If no custom game: name input + 🔖 save button inline

### Config changes on the instructions screen

`onConfigChange` is called on every field change. The parent (`*GameBody`) updates its local config state. `usePersistLastGameConfig` continues to handle persistence — no extra save is needed for "just playing."

Saving/updating a custom game calls `onSaveCustom game` or `onUpdateCustom game` which write to RxDB via `useSavedConfigs`.

---

## 4. Data Model Change

`SavedGameConfigDoc` in `src/db/schemas/saved_game_configs.ts` gains:

```ts
color: string; // palette key, default 'indigo'
```

Schema version bumps from `0` to `1`. A migration adds `color: 'indigo'` to all existing docs.

---

## 5. Config Field Descriptors

A `ConfigField` type describes a single form field:

```ts
type ConfigField =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | {
      type: 'number';
      key: string;
      label: string;
      min: number;
      max: number;
    }
  | { type: 'checkbox'; key: string; label: string };
```

Each game defines and exports its own `configFields: ConfigField[]` array. This is passed down to both `SavedConfigChip` (for the inline form) and `InstructionsOverlay` (for the settings form), so the same field descriptors drive both UIs without duplication.

---

## 6. `useSavedConfigs` — new method

A new `updateConfig(id: string, config: Record<string, unknown>, name?: string): Promise<void>` method is added to `useSavedConfigs`. It finds the doc by id and patches `config` (and optionally `name`) via `incrementalPatch`. This is used by the "Update custom game" action on the instructions screen.

---

## 7. What Does Not Change

- `usePersistLastGameConfig` — unchanged, still debounce-writes last config to RxDB
- `loadGameConfig` / `config-loader.ts` — unchanged
- `GameShell` — unchanged
- The routing / loader logic in `$gameId.tsx` — unchanged except removing `*ConfigPanel` renders
- `useSavedConfigs.save()` / `remove()` / `rename()` — unchanged; `updateConfig` is additive

---

## Component Inventory

| New / Changed | File                                                                     | Notes                                                                     |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| New           | `src/components/SavedConfigChip.tsx`                                     | Collapsible custom game chip with inline form                             |
| New           | `src/components/GameNameChip.tsx`                                        | Display-only game name chip for instructions screen                       |
| New           | `src/lib/config-tags.ts`                                                 | `configToTags()` pure function                                            |
| Changed       | `src/components/GameCard.tsx`                                            | Add description, replace chip markup with `SavedConfigChip`               |
| Changed       | `src/components/SaveConfigDialog.tsx`                                    | Add color palette picker + live preview                                   |
| Changed       | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` | Full redesign per spec                                                    |
| Changed       | `src/games/registry.ts`                                                  | Add `descriptionKey` to `GameCatalogEntry`                                |
| Changed       | `src/db/schemas/saved_game_configs.ts`                                   | Add `color` field, bump schema version                                    |
| Changed       | `src/routes/$locale/_app/index.tsx`                                      | Snapshot last config on custom game save                                  |
| Changed       | `src/routes/$locale/_app/game/$gameId.tsx`                               | Remove `*ConfigPanel` components; pass new props to `InstructionsOverlay` |
| Changed       | Each game's config types                                                 | Export `configFields: ConfigField[]`                                      |

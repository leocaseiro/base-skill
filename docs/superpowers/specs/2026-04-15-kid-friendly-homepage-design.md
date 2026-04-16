# Kid-Friendly Homepage & Simple Config — Design Spec

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._

Date: 2026-04-15
Branch: `design/kid-friendly-homepage`

## Summary

Redesign the homepage, game cards, and instructions screen so that kids (PK–K
roughly, with parent assist) can find and launch games without reading
developer-style labels. The changes land in four areas:

1. **Game covers** — every game gets visual cover art (big emoji on a themed
   gradient for v1) so the homepage reads visually, not textually.
2. **Playful game titles** and kid-readable labels that still teach the
   academic term (e.g. "Going Up! _ascending_").
3. **Simple config forms** as the default for every game, made of chunky
   buttons, native-`<select>` dropdown cells, and +/− steppers. The existing
   dev-style "advanced" form moves behind an `Advanced ⚙️` link and stays
   unchanged.
4. **Saved custom games become first-class homepage cards** with a config chip
   strip, colored ribbon, and custom game icon — so parents set up presets once
   and kids just tap a card. Every custom game can also carry its **own cover**
   (emoji or image URL), falling back to the game's default when unset.
5. **Per-card cog opens a modal with the full Advanced form.** Saving from
   the modal updates the current custom game (if any) or creates a new one —
   it never overwrites a game default.

Audience pattern: **kid-first, parent-assist** (chosen in brainstorming). Kids
drive, parents tweak without leaving the page.

## Non-goals

- Game defaults stay emoji-based for v1. The cover type supports images
  (URL or asset path) so custom games can opt in today, but no game default
  ships with an image in this spec.
- No device file uploads — image covers accept a URL string only. A future
  upload flow can reuse the same `cover.src` field.
- No sectioned category layout (Favorites / Math / Reading). With only three
  games today, a flat grid is honest. Revisit when catalog grows past ~6
  games.
- No changes to the underlying game engines, move logs, or scoring.
- No changes to the existing advanced config form's content or field set.
- No new locales — all copy additions are `en` and `pt-BR`.
- No changes to the Parent route (`/$locale/_app/parent/*`) in this spec.

## Game renames

Source of truth: `src/lib/i18n/locales/{en,pt-BR}/games.json`.

| Current title | New title (en)        | Rationale                                       |
| ------------- | --------------------- | ----------------------------------------------- |
| Word Spell    | **Spell It!**         | Verb-forward, playful, suggests an action.      |
| Number Match  | **Match the Number!** | Adds a verb; "Number Match" reads like a label. |
| Sort Numbers  | **Count in Order**    | Teaches the underlying action (count + order).  |

### Count in Order — direction labels

The `sort-numbers-ui.ascending-label` / `descending-label` keys become
playful-first, school-vocabulary-second:

| Direction  | Big label          | Subtitle (smaller, italic) |
| ---------- | ------------------ | -------------------------- |
| ascending  | 🚀 **Going Up!**   | `ascending`                |
| descending | 🛝 **Going Down!** | `descending`               |

The big label is what the kid sees. The subtitle reinforces the academic term
so parents can tie the UI back to schoolwork.

## Covers (v1)

Covers are **per-config**, not just per-game. A saved custom game can carry its
own cover (e.g. 🦁 for "Zoo Words"); when none is set, it falls back to the
game's default cover. The underlying render supports a **hybrid** of emoji or
image so custom games can opt into real artwork without forcing the whole catalog
onto an image pipeline.

### Cover type

```ts
// src/games/cover.ts (new)
export type Cover =
  | { kind: 'emoji'; emoji: string; gradient?: [string, string] }
  | { kind: 'image'; src: string; alt?: string; background?: string };
```

- `emoji` covers keep the zero-art v1 story: a single large emoji on a themed
  two-stop gradient.
- `image` covers accept a URL or imported asset (PNG / WebP / SVG). `src` is
  stored as-is; `background` is an optional solid CSS colour used as a
  fallback while the image loads.

### GameCover component

`<GameCover cover={...} size="card" | "hero" />` renders either variant. The
component lives in `src/components/GameCover.tsx` and is the single consumer
of the `Cover` type. All callers (homepage cards, instructions hero, save-
config preview) go through it.

If `cover` is undefined, the component falls back to
`resolveDefaultCover(gameId)`.

### Per-game defaults

Each `GAME_CATALOG` entry carries a `defaultCover: Cover` (emoji for v1):

| Game              | Default emoji | Gradient                                 |
| ----------------- | ------------- | ---------------------------------------- |
| Spell It!         | 🔤            | `#fde68a → #fb923c` (warm yellow→orange) |
| Match the Number! | 🔢            | `#bae6fd → #6366f1` (sky blue→indigo)    |
| Count in Order    | 📊            | `#bbf7d0 → #10b981` (mint→emerald)       |

Any game default can later be swapped to an `image` cover by changing only
the registry entry.

### Per-custom game cover

`SavedGameConfigDoc` (see `src/db/schemas/saved_game_configs.ts`) gains an
optional `cover?: Cover` field. Unset means "inherit the game default".

Resolution order at render time:

1. If the custom game has `cover`, use it.
2. Otherwise, use the game's `defaultCover`.
3. The custom game's colored ribbon + icon + subtitle still differentiate it
   even when it inherits the game cover.

### Picking a cover (save / update custom game flow)

The custom game save dialog and the Instructions screen's "Update" flow both
show a small cover picker:

- **Emoji picker** — a curated palette of ~24 emojis grouped by theme
  (animals, food, nature, numbers, shapes). Tap an emoji + pick a gradient
  preset (same palette as the custom game color picker) → stored as
  `{ kind: 'emoji', emoji, gradient }`.
- **Image input** — a single text input labeled "Image URL (optional)". If
  filled, it overrides the emoji and stores `{ kind: 'image', src }`. Paste
  a public URL or a relative path to a file in `public/`.
- **"Use game default"** — clears the cover field, falling back to the
  game's `defaultCover`.

File upload from the device is **out of scope for v1** — we only accept a
URL string today. The data model supports a future upload flow without
schema changes (the `src` field is just a string).

## Homepage

Current: `src/routes/$locale/_app/index.tsx` renders a `LevelRow` + `GameGrid`
of text-forward `GameCard`s. Saved configs appear as inline chips under each
card.

New structure:

```text
┌───────────────────────────────────────────┐
│  BaseSkill logo                           │  ← compact topbar
├───────────────────────────────────────────┤
│  [cover]    [cover]    [cover]    [cover] │
│  Title  ⚙️  Title  ⚙️  Title  ⚙️  Title ⚙️│
│  chips      chips      chips      chips   │
│  [Play ]    [Play ]    [Play ]    [Play ] │
│                                            │
│  [cover ribbon ⚙️]  [cover ribbon ⚙️]  …
│  Title                                     │
│  "Custom game name"                           │
│  chips                                     │
│  [Play ]                                   │
└───────────────────────────────────────────┘
```

Each card carries its **own cog** (⚙️) in the top-right. Tapping the cog
opens the **advanced config modal** (see "Cog + advanced modal" below). No
global parent gear in the topbar — the per-card cog is the only advanced
surface on the homepage.

### Responsive grid

- Mobile (`< 640px`): 1 column
- `sm` (≥ 640px): 2 columns
- `lg` (≥ 1024px): 3 columns
- `xl` (≥ 1280px): 4 columns
- `2xl` (≥ 1536px): 5 columns

### Card shapes

Two card variants, both built on a single `GameCard` component:

**Default card** (one per `GAME_CATALOG` entry):

- Cover (emoji + gradient)
- Game title (e.g. "Spell It!")
- 2–3 **config chips** summarizing the game's current default simple-config
  values (see "Config chip rules" below)
- Big "Play" button

**Custom game card** (one per `SavedGameConfigDoc`):

- Cover: the custom game's own `cover` if set, otherwise the game default.
- **Colored top ribbon** matching the custom game color.
- **Custom game icon** in the top-right corner of the cover.
- Game title.
- **Custom game name** as a subtitle under the title (e.g. "My Words").
- 2–3 config chips reflecting **the custom game's config**, not the game default.
- Play button styled in the custom game's color.

Clicking a default card navigates to the game with no `configId`. Clicking a
custom game card navigates with `configId` (same behavior as today's
`handlePlayWithConfig`).

### Config chip rules

Chips surface the most salient values from the **simple config** (see
"Simple config forms" below). Verbose over tight — parents need to pick
custom games apart at a glance.

| Game              | Chips (in order, `·` separated)                                            |
| ----------------- | -------------------------------------------------------------------------- |
| Spell It!         | `Level {n}` · sounds csv (truncated `…` after ~3) · input (Drag/Type/Both) |
| Match the Number! | `{from} → {to}` pair · `{min}–{max}` range · input (Drag/Type/Both)        |
| Count in Order    | direction (Up/Down) · `{n} numbers` · `{step}s` · input (Drag/Type/Both)   |

Chips come from a pure `configToChips(gameId, config)` function so the card
and the instructions-screen summary stay in sync.

### Sort order

The card list is sorted:

1. **Last-played first** (game or custom game). Requires reading `session_history`
   for the current profile and taking the most-recent entry per
   `(gameId, configId)`.
2. Then **game defaults** in registry order.
3. Then **other custom games**, grouped by `gameId`.

### Level / subject filters

Removed from the homepage. Kids don't use them. Level is already a
per-game simple-config control (Spell It!), and subject is implicit in
the three-game catalog today. Parents can still access the full
`/$locale/_app/parent/*` route via the existing nav for bulk oversight.
Out of scope for this spec: redesigning the Parent route itself.

## Cog + advanced modal

Every card — default or custom game — shows a small **⚙️ cog** in its top-right
corner. Tapping it opens a modal that renders the **full advanced config
form** for that game (the existing `ConfigFormFields` output, unchanged).

The modal replaces what used to be an inline "Advanced ⚙️" link inside the
simple form. The simple form stays the kid-friendly default; the advanced
form lives entirely behind the cog.

### Modal entry points

- **Homepage card cog** — opens the modal pre-filled with that card's
  config (the game default for a default card; the custom game's config for a
  custom game card).
- **Instructions screen cog** — same modal, same behavior. Replaces the
  inline "Advanced ⚙️" link previously shown under the simple form.

### Modal contents

- Cover picker (emoji palette + image URL input + "Use game default").
- Custom game name field (required when saving as new; pre-filled for existing
  custom games).
- Custom game color picker (for "Save as new").
- **Full advanced form** (existing `ConfigFormFields` + `renderConfigForm`
  per game, no visual changes).
- Save bar:
  - If opened from a **custom game card**: `Update "{custom game name}"`
    (primary) + `Save as new custom game` (secondary) + `Cancel`.
  - If opened from a **default card**: `Save as new custom game` (primary
    only) + `Cancel`. There is no "Update default" button — **defaults are
    immutable**.

### Never overwrites defaults

Saving from the modal always either updates an existing custom game or
creates a new one. The `GAME_CATALOG` default config is never persisted
to; it is the immutable starting point. If a parent wants a different
"default-feeling" experience, they save a custom game — that custom game becomes
the card they and the kid tap.

## Simple config forms

Every game gets a `<SimpleConfigForm gameId>` component. This is the **default**
view for:

1. The Instructions screen's settings panel.
2. The custom game save/update dialog's config preview (inside the cog modal
   — see "Cog + advanced modal" above).

The simple form never exposes an inline "Advanced" link. The advanced form
is reachable only via the per-card cog. The persisted data model stays the
same — `SortNumbersSimpleConfig` uses the existing `configMode:
'simple' | 'advanced'` discriminator; Match the Number! and Spell It! gain
analogous simple-mode types.

### Shared UI primitives (new)

These primitives live in `src/components/config/` and are reused across all
simple forms:

- **`<ChunkGroup>`** — a row of chunky toggle buttons (big emoji + label +
  optional italic subtitle). Single-select or multi-select. Used for
  direction, input method, level selection.
- **`<CellSelect>`** — a styled cell wrapping a native `<select>`. Shows
  `preview` text and a small `hint` line. OS picker on mobile, accessible by
  default.
- **`<Stepper>`** — a `−`/value/`+` numeric stepper with `min` and `max`.
- **`<ChipStrip>`** — wrap-flow of small chip tags. Supports read-only and
  toggleable modes (for Spell It! sound filtering).

These are intentionally simple — no custom dropdowns or popovers. Native
`<select>` is the heavy lifter.

### Spell It! simple config

```
┌ Level ──────────────────────────────────┐
│ [CellSelect: "Level 2" / AUS progression]│
└──────────────────────────────────────────┘
┌ Sounds at this level (tap to toggle) ───┐
│ [ChipStrip: m /m/] [d /d/] [g /g/] [o /ɒ/]│
│ [c /k/] [k /k/] [ck /k/] [e /e/] ...      │
└──────────────────────────────────────────┘
┌ How do you answer? ──────────────────────┐
│ [ChunkGroup: ✋ Drag | ⌨️ Type | ✨ Both] │
└──────────────────────────────────────────┘
```

Notes:

- Region defaults to AUS; dropdown deferred until another region's word
  library is populated (UK/US/BR are `.gitkeep` today).
- `Sounds at this level` chips are **toggleable** — tap a chip to
  include/exclude. The selected set feeds `WordFilter.phonemesAllowed` (or
  `graphemesAllowed`) so the word pool is filtered to only words that use the
  selected sounds.
  - Default: all sounds at the current level selected.
  - If the user deselects all, the form shows an inline warning and the
    `Play` CTA is disabled until at least one sound is selected.
- Picture mode is removed from simple (and from the default). Library words
  have no guaranteed image, so the default mode is `scramble`.
- `WordSpellSource` usage: the form produces a `WordSpellSource = { type:
'word-library', filter: { region: 'aus', level: N, phonemesAllowed: [...] } }`
  and writes it to the config's `source` field.

### Match the Number! simple config

```
┌ What you see → What you match ──────────┐
│ [CellSelect: "5 / numeral"] → [CellSelect: "●●●●● / group"] │
└──────────────────────────────────────────┘
┌ Range (min/max) ─────────────────────────┐
│ Min [Stepper: 1]    Max [Stepper: 10]    │
└──────────────────────────────────────────┘
┌ How do you answer? ──────────────────────┐
│ [ChunkGroup: ✋ Drag | ⌨️ Type | ✨ Both] │
└──────────────────────────────────────────┘
┌ Extra wrong tiles ───────────────────────┐
│ [Stepper: 3]                             │
└──────────────────────────────────────────┘
```

Notes:

- Tile style is forced to `dots` (only supported style today). The other
  options in `tileStyle` (`objects`, `fingers`) remain reachable from the
  advanced form once those are supported.
- The two "from / to" cells expose the four primitives: `numeral`, `group`,
  `word`, `ordinal`. The pair is resolved to the existing
  `NumberMatchMode` union by a pure `pairToMode(from, to)` function. Invalid
  pairs (e.g. `numeral → numeral`) are prevented by:
  1. Filtering the second `<select>`'s options based on the first value.
  2. If the current "to" becomes invalid after a "from" change, it auto-
     updates to the first valid option.
- Range `min`/`max`: steppers with `min = 1` and **no upper cap** (clamping
  only to reasonable tile-render sane values via `max = 999` at the input
  level, but the UI offers no visible ceiling). Constraint: `max >= min`
  (adjusting `min` pushes `max` up; adjusting `max` below `min` pushes `min`
  down).
- `Extra wrong tiles` stepper is visible only when the pair mode supports
  distractors (all current modes do). 0–10. Writes to `distractorCount` and
  implicitly sets `tileBankMode` to `distractors` when > 0, `exact` when 0.

### Count in Order simple config

```
┌ Which way? ──────────────────────────────┐
│ [ChunkGroup: 🚀 Going Up! | 🛝 Going Down!]│
└──────────────────────────────────────────┘
┌ How many? ─── Start at ─── Skip by ──────┐
│ [Stepper 5]    [Stepper 2]   [Stepper 2] │
└──────────────────────────────────────────┘
┌ Preview ─────────────────────────────────┐
│ 2, 4, 6, 8, 10                            │
└──────────────────────────────────────────┘
┌ How do you answer? ──────────────────────┐
│ [ChunkGroup: ✋ Drag | ⌨️ Type | ✨ Both] │
└──────────────────────────────────────────┘
```

Notes:

- Stepper ranges: `quantity` 2–8, `start` 1–99, `step` 1–10 (larger values
  remain available via advanced).
- Preview line updates live: `sequence = Array.from({length: quantity}, (_, i)
=> start + i * step)` (reverse when descending). Uses the existing
  `resolveSimpleConfig` helper.
- Direction ChunkGroup stores `ascending` / `descending` as it does today.
- Distractors default OFF in simple (not shown). Parent enables via the
  advanced cog modal (see "Cog + advanced modal").

## Instructions screen

Current: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
already has the right structure (collapsible settings, save bar). Changes are
mostly content:

**Visible by default:**

- `← Back` affordance (new).
- **Cover** (new, replacing the text-only `GameNameChip` at the top).
- Game title + custom game badge (if launched from a custom game).
- **Cog ⚙️** in the header (matches the homepage card cog) — opens the
  advanced config modal.
- Instructions text + TTS speaker (unchanged).
- **Big "Let's go!" CTA** (styled bigger/more playful than today).
- Settings chevron (collapsed).

**Settings expanded:**

- `<SimpleConfigForm gameId>` — same component used by the cog modal's
  preview area (single source of truth for simple-mode rendering).
- **No inline Advanced link.** The advanced form lives exclusively behind
  the cog modal. The simple form stays focused on the kid-friendly
  controls.
- Save bar beneath:
  - If launched from a custom game: `Update "{custom game name}"` (primary) +
    `Save as new custom game` (secondary). Same behavior as today.
  - If launched from a default: `Save as new custom game` only (defaults are
    immutable — see "Cog + advanced modal").

## Data and typing changes

- `Cover` union type in `src/games/cover.ts` (new).
- `GAME_CATALOG` gains a `defaultCover: Cover` field per entry.
- `SavedGameConfigDoc` schema gains an optional `cover?: Cover`. RxDB
  migration bumps the `saved_game_configs` schema version and adds the new
  optional field — existing docs remain valid with `cover: undefined`.
- `resolveCover(doc, gameId): Cover` helper in `src/games/cover.ts`
  implements the fallback chain (custom game cover → game default).
- `WordSpellConfig` gains a `configMode?: 'simple' | 'advanced'` and a
  `WordSpellSimpleConfig` type mirroring `SortNumbersSimpleConfig`.
- `NumberMatchConfig` gains the same `configMode` + `NumberMatchSimpleConfig`
  type.
- `configToChips(gameId, config): string[]` utility in
  `src/games/config-chips.ts` (new), replacing ad-hoc chip logic in the card.
- Direction / input-method formatters live in
  `src/games/simple-labels.ts` so the homepage chips and the Instructions
  screen label render identically.
- `sortByLastPlayed` helper in `src/games/catalog-utils.ts` (extension),
  reading from `session_history`.

No breaking changes to existing saved configs: the advanced form still edits
the same underlying shape, and simple-mode configs are a superset (all fields
that simple doesn't touch keep their default values from the full shape).

## Localization

- All new UI copy lands in `src/lib/i18n/locales/en/*.json` and
  `src/lib/i18n/locales/pt-BR/*.json`.
- Game titles, direction labels, instruction settings labels, chunk labels
  ("Drag", "Type", "Both", "Going Up!", "Going Down!"), row labels, and the
  `Advanced ⚙️` / `Update` / `Save as new…` strings all get translation
  keys.
- Sound-chip phonetic transcriptions (`/m/`, `/d/`, etc.) are not
  translated; they come from the existing IPA metadata.

## Accessibility

- All ChunkGroup, CellSelect, and Stepper primitives ship with correct ARIA:
  `aria-pressed`, labeled groups, visible focus rings.
- Native `<select>` inside CellSelect is keyboard-operable without custom
  event plumbing.
- ChunkGroup uses radio semantics when single-select.
- Color-only differentiation of custom game ribbons is supplemented by the
  custom game icon and the subtitle name so colorblind users still disambiguate.
- Instructions screen keeps the existing `role="dialog"` behavior.

## Testing

- Unit tests for `configToChips`, `pairToMode`, `sortByLastPlayed`, and the
  "no sounds selected disables Play" edge case in Spell It! simple.
- Component tests for each `SimpleConfigForm` variant confirming:
  - Changing a control updates config correctly.
  - Advanced toggle reveals the existing form inline.
  - Preview / chips reflect current simple config.
- VR tests (new snapshots):
  - Homepage with: (a) defaults only, (b) defaults + custom games, (c)
    custom games only (edge case). Mobile and desktop widths.
  - Instructions screen for each game, settings collapsed and expanded.
- E2E: kid flow — open homepage → tap custom game card → see instructions →
  press "Let's go!" → game starts with custom game config applied.
- No changes to existing game-engine tests.

## Rollout

Single PR to master via the existing CI gating. Files likely touched:

- `src/routes/$locale/_app/index.tsx`
- `src/components/GameCard.tsx`, `src/components/GameGrid.tsx` (or split
  into `GameCoverCard` + `Custom gameCoverCard` if the size grows).
- `src/components/GameCover.tsx` (new)
- `src/components/CoverPicker.tsx` (new — emoji palette + image URL input)
- `src/games/cover.ts` (new — `Cover` type + `resolveCover` helper)
- `src/db/schemas/saved_game_configs.ts` (add optional `cover` field +
  migration bump)
- `src/components/config/{ChunkGroup,CellSelect,Stepper,ChipStrip}.tsx`
  (new)
- `src/games/{word-spell,number-match,sort-numbers}/*SimpleConfigForm.tsx`
  (new / replacing today's `SortNumbersConfigForm`)
- `src/games/config-chips.ts`, `src/games/simple-labels.ts` (new)
- `src/games/registry.ts` (cover field)
- `src/games/catalog-utils.ts` (sortByLastPlayed)
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
  (content replacement)
- Locale updates in `src/lib/i18n/locales/{en,pt-BR}/*.json`
- Architecture doc updates (per CLAUDE.md, if game-state logic changes — it
  doesn't in this spec, but touched files under `answer-game/` warrant a
  review).

Update `docs/architecture/*.mdx` co-located docs only if logic in
`answer-game/` changes materially during implementation.

## Open questions (to resolve in implementation plan)

- **Resolved:** editing a game default. Game defaults are **immutable**.
  Tapping a default card's cog opens the advanced modal with the default
  config pre-filled; the only save action is `Save as new custom game`. There
  is no in-place edit of defaults. The "personalized default" feel comes
  from a custom game the parent saves once and the kid taps thereafter.
- Cog affordance on small screens: whether the cog is always visible in
  the card's top-right corner or revealed by long-press. Default:
  always visible (a 28×28 tap target is fine alongside the Play button).
- Modal presentation on mobile: full-screen sheet vs. centered modal with
  backdrop. Default: full-screen sheet on `< sm`, centered dialog above.

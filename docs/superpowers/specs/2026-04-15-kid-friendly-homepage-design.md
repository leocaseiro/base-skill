# Kid-Friendly Homepage & Simple Config — Design Spec

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
4. **Saved bookmarks become first-class homepage cards** with a config chip
   strip, colored ribbon, and bookmark icon — so parents set up presets once
   and kids just tap a card.

Audience pattern: **kid-first, parent-assist** (chosen in brainstorming). Kids
drive, parents tweak without leaving the page.

## Non-goals

- No custom illustrations/AI art for v1 — covers stay emoji-based (Approach C
  from brainstorming). Swappable later via a `<GameCover gameId>` component.
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

Each game has a `GameCover` component that renders:

- A themed gradient background (rounded corners, ~4/3 aspect ratio).
- A single large emoji centered on top.

Gradients and emoji per game:

| Game              | Gradient                                 | Emoji |
| ----------------- | ---------------------------------------- | ----- |
| Spell It!         | `#fde68a → #fb923c` (warm yellow→orange) | 🔤    |
| Match the Number! | `#bae6fd → #6366f1` (sky blue→indigo)    | 🔢    |
| Count in Order    | `#bbf7d0 → #10b981` (mint→emerald)       | 📊    |

The component takes `gameId` and optionally a `size` variant (homepage card,
instructions hero, etc.). The emoji+gradient strategy is a one-line swap to
SVG or raster later, per game.

## Homepage

Current: `src/routes/$locale/_app/index.tsx` renders a `LevelRow` + `GameGrid`
of text-forward `GameCard`s. Saved configs appear as inline chips under each
card.

New structure:

```text
┌───────────────────────────────────────────┐
│  BaseSkill logo          ⚙️ Parent gear   │  ← compact topbar
├───────────────────────────────────────────┤
│  [cover]   [cover]   [cover]   [cover]    │
│  Title     Title     Title     Title      │
│  chips     chips     chips     chips      │
│  [Play ]   [Play ]   [Play ]   [Play ]    │
│                                            │
│  [cover with ribbon]   [cover with ribbon] …
│  Title                                     │
│  "Bookmark name"                           │
│  chips                                     │
│  [Play ]                                   │
└───────────────────────────────────────────┘
```

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

**Bookmark card** (one per `SavedGameConfigDoc`):

- Same cover, but with:
  - **Colored top ribbon** matching the bookmark color
  - **Bookmark icon** in the top-right corner of the cover
- Game title
- **Bookmark name** as a subtitle under the title (e.g. "My Words")
- 2–3 config chips reflecting **the bookmark's config**, not the game default
- Play button styled in the bookmark's color

Clicking a default card navigates to the game with no `configId`. Clicking a
bookmark card navigates with `configId` (same behavior as today's
`handlePlayWithConfig`).

### Config chip rules

Chips surface the most salient values from the **simple config** (see
"Simple config forms" below). Verbose over tight — parents need to pick
bookmarks apart at a glance.

| Game              | Chips (in order, `·` separated)                                            |
| ----------------- | -------------------------------------------------------------------------- |
| Spell It!         | `Level {n}` · sounds csv (truncated `…` after ~3) · input (Drag/Type/Both) |
| Match the Number! | `{from} → {to}` pair · `{min}–{max}` range · input (Drag/Type/Both)        |
| Count in Order    | direction (Up/Down) · `{n} numbers` · `{step}s` · input (Drag/Type/Both)   |

Chips come from a pure `configToChips(gameId, config)` function so the card
and the instructions-screen summary stay in sync.

### Sort order

The card list is sorted:

1. **Last-played first** (game or bookmark). Requires reading `session_history`
   for the current profile and taking the most-recent entry per
   `(gameId, configId)`.
2. Then **game defaults** in registry order.
3. Then **other bookmarks**, grouped by `gameId`.

### Level / subject filters

Removed from the homepage. Kids don't use them. Parents can find the same
filtering behavior behind the **⚙️ Parent** button in the topbar (a simple
sheet with level + subject selects, plus a link to the existing Parent
route). Out of scope for this spec: redesigning the Parent route itself.

## Simple config forms

Every game gets a `<SimpleConfigForm gameId>` component. This is the **default**
view for:

1. Editing a game's default config from the homepage (via a small edit
   affordance — exact flow picked during implementation).
2. The Instructions screen's settings panel.
3. The bookmark save/update dialog's config preview.

Below each simple form is an `Advanced ⚙️` link that reveals the existing
`ConfigFormFields` output for that game, unchanged. The persisted data model
stays the same — `SortNumbersSimpleConfig` uses the existing `configMode:
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
[Advanced ⚙️]
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
[Advanced ⚙️]
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
[Advanced ⚙️]
```

Notes:

- Stepper ranges: `quantity` 2–8, `start` 1–99, `step` 1–10 (larger values
  remain available via advanced).
- Preview line updates live: `sequence = Array.from({length: quantity}, (_, i)
=> start + i * step)` (reverse when descending). Uses the existing
  `resolveSimpleConfig` helper.
- Direction ChunkGroup stores `ascending` / `descending` as it does today.
- Distractors default OFF in simple (not shown). Parent enables via advanced.
- Advanced link reveals the existing `ConfigFormFields(sortNumbersConfigFields)`.

## Instructions screen

Current: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
already has the right structure (collapsible settings, save bar). Changes are
mostly content:

**Visible by default:**

- `← Back` affordance (new).
- **Cover** (new, replacing the text-only `GameNameChip` at the top).
- Game title + bookmark badge (if launched from a bookmark).
- Instructions text + TTS speaker (unchanged).
- **Big "Let's go!" CTA** (styled bigger/more playful than today).
- Settings chevron (collapsed).

**Settings expanded:**

- `<SimpleConfigForm gameId>` — same component as the homepage card's edit
  view (single source of truth).
- `Advanced ⚙️` link beneath the simple form reveals the existing advanced
  form (`ConfigFormFields` + `renderConfigForm`) inline. Toggling advanced
  on does **not** hide the simple form above — they stack so the user can
  see both and the advanced form is positioned as "extra controls", not a
  replacement.
- Save bar beneath:
  - If launched from a bookmark: `Update "{bookmark name}"` (primary) +
    `Save as new…` (secondary). Same behavior as today.
  - If launched from a default: `Save as new bookmark` flow with the
    existing bookmark-color picker.

## Data and typing changes

- `GAME_CATALOG` gains a `cover: { emoji: string; gradient: [string, string] }`
  field (or derivation via `getGameCover(gameId)` — implementation choice for
  the plan).
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
- Color-only differentiation of bookmark ribbons is supplemented by the
  bookmark icon and the subtitle name so colorblind users still disambiguate.
- Instructions screen keeps the existing `role="dialog"` behavior.

## Testing

- Unit tests for `configToChips`, `pairToMode`, `sortByLastPlayed`, and the
  "no sounds selected disables Play" edge case in Spell It! simple.
- Component tests for each `SimpleConfigForm` variant confirming:
  - Changing a control updates config correctly.
  - Advanced toggle reveals the existing form inline.
  - Preview / chips reflect current simple config.
- VR tests (new snapshots):
  - Homepage with: (a) defaults only, (b) defaults + bookmarks, (c)
    bookmarks only (edge case). Mobile and desktop widths.
  - Instructions screen for each game, settings collapsed and expanded.
- E2E: kid flow — open homepage → tap bookmark card → see instructions →
  press "Let's go!" → game starts with bookmark config applied.
- No changes to existing game-engine tests.

## Rollout

Single PR to master via the existing CI gating. Files likely touched:

- `src/routes/$locale/_app/index.tsx`
- `src/components/GameCard.tsx`, `src/components/GameGrid.tsx` (or split
  into `GameCoverCard` + `BookmarkCoverCard` if the size grows).
- `src/components/GameCover.tsx` (new)
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

- Exact homepage affordance for _editing a game default_ without saving a
  bookmark (long-press gear on the card vs. tapping the card's chips vs.
  tapping cover to enter a preview screen). Not blocking design approval.
- Whether the Parent gear in the top bar opens a lightweight sheet or
  navigates to `/parent`. Default: sheet with level/subject + link to full
  Parent route.

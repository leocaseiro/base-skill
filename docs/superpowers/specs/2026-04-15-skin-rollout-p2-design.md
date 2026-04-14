# Skin System Rollout — Plan 2 (WordSpell + NumberMatch + Token Consumption)

## Summary

Extend the skin system shipped in Plan 1 (PR #95) so that WordSpell and
NumberMatch become fully skinnable using the same contract that SortNumbers
uses. Address the two limitations Plan 1 explicitly deferred:

1. `--skin-*` tokens are not fully consumed by core components (Slot applies
   them only for non-classic skins; TileBank doesn't consume them at all;
   `skeuoStyle` is hardcoded on every tile button).
2. `onGameOver(retryCount)` always receives `0` because `GameEndEvent` does not
   carry the retry count.

At the end of Plan 2, a skin author can register a single `GameSkin` for any
of the three shipped games and re-theme tiles, slots, bank holes, hover
previews, question prompts, and game-specific surfaces (sentence gaps, domino
pips, word-mode tiles) through CSS tokens and optional render slots — without
forking game code.

## Terminology

Unchanged from Plan 1 spec. `--skin-*` tokens are scoped to a game instance
via an inline `style` on the game's wrapper `<div>`. `--bs-*` theme tokens are
global and unchanged.

## Goals

- Wire `useGameSkin` end-to-end in WordSpell and NumberMatch.
- Replace `skeuoStyle` on all tile buttons with `--skin-tile-*` tokens so the
  classic skin preserves today's visual but custom skins can override tile
  backgrounds, borders, shadows, radii, and font weight.
- Consume `--skin-slot-*` tokens on `Slot` for the classic skin too (not just
  custom skins), so state-driven styling and skin styling share a single code
  path.
- Add new shared tokens for surfaces that exist in the games but weren't in
  Plan 1's contract: bank holes, hover previews, question prompt components,
  sentence-with-gaps underlines.
- Fix `GameEndEvent` so skins receive the real retry count in `onGameOver`.
- Ship a `*.skin.stories.tsx` harness for each of the two new games, using the
  same `SkinHarness` component SortNumbers uses.

## Non-Goals

- No Bush Glider, no `baseskill-premium-cloud` bootstrap, no real themed skins
  (dino-eggs, caterpillar). Those are Plan 3.
- No config form UI skin picker. The skin is still selected via
  `config.skin = '<id>'` in code.
- No changes to `ThemeRuntimeProvider` or `--bs-*` tokens.
- No changes to interaction models (drag-and-drop, type input, tap).
- No new game primitives in `src/components/answer-game/` beyond token
  plumbing.
- No mid-session skin hot-swap.

## Background: Plan 1 limitations in detail

### Limitation 1 — Partial token consumption

The Plan 1 merge left `Slot.tsx` in a branching state:

```ts
const isCustomSkin = skin && skin.id !== 'classic';
const skinColors =
  isCustomSkin && !hasColorStateOverride
    ? {
        background: 'var(--skin-slot-bg)',
        borderColor: 'var(--skin-slot-border)',
      }
    : {};
```

Consequences:

- The classic skin never flows through the token path. If we add new shared
  tokens, classic gets inconsistent treatment (tokens defined in
  `classicSkin.tokens` are set on the wrapper but read by nothing for
  classic).
- `hasColorStateOverride` (wrong / preview) bypasses tokens entirely — a
  custom skin cannot retheme the "wrong" state; it will always fall back to
  `border-destructive bg-destructive/10 text-destructive`.
- `TileBank` components (`SortNumbersTileBank`, `LetterTileBank`,
  `NumeralTileBank`) render tile buttons with `style={skeuoStyle}`, which is
  a CSS object using its own `--skeuo-*` custom properties. Skins can't
  reach into it.

### Limitation 2 — `onGameOver` retry count

`GameEndEvent` carries `finalScore`, `totalRounds`, `correctCount`,
`durationMs` but not `retryCount`. `useGameSkin` calls
`skin.onGameOver?.(0)` as a placeholder. Skins that want to branch on retries
(e.g. "play a different celebration if the player retried") can't.

## Architecture

### Token contract — additions

Added to `classicSkin.tokens`; every skin inherits defaults and may override.

| Token                        | Purpose                                     | Classic default                                                          |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `--skin-tile-highlight`      | Skeuo top-highlight gradient stop           | `rgba(255,255,255,1)`                                                    |
| `--skin-tile-ring`           | Skeuo 1px outer ring                        | `rgba(0,0,0,0.08)`                                                       |
| `--skin-tile-inset-bottom`   | Skeuo inset bottom shadow                   | `rgba(0,0,0,0.08)`                                                       |
| `--skin-tile-inset-top`      | Skeuo inset top highlight                   | `rgba(255,255,255,0.5)`                                                  |
| `--skin-tile-text-shadow`    | Tile label text shadow color                | `rgba(0,0,0,0.12)`                                                       |
| `--skin-tile-surface`        | Tile body surface color (replaces `--card`) | `var(--card, #FAFAFA)`                                                   |
| `--skin-tile-active-scale`   | Active-state scale (`active:scale-*`)       | `0.95`                                                                   |
| `--skin-bank-hole-bg`        | Bank "hole" where a placed tile came from   | `rgb(from var(--muted) r g b / 0.6)` (matches current `bg-muted/60`)     |
| `--skin-bank-hole-shadow`    | Bank hole inner shadow                      | current `shadow-inner` equivalent                                        |
| `--skin-hover-border-color`  | Drop-target dashed border color             | `var(--bs-primary)`                                                      |
| `--skin-hover-border-style`  | Drop-target border style                    | `dashed`                                                                 |
| `--skin-correct-bg`          | Slot background on correct state            | `rgb(from var(--primary) r g b / 0.1)` (matches current `bg-primary/10`) |
| `--skin-correct-border`      | Slot border on correct state                | `var(--bs-primary)`                                                      |
| `--skin-wrong-bg`            | Slot background on wrong state              | `rgb(from var(--destructive) r g b / 0.1)`                               |
| `--skin-wrong-border`        | Slot border on wrong state                  | `var(--destructive)`                                                     |
| `--skin-question-bg`         | Question prompt background                  | `transparent`                                                            |
| `--skin-question-text`       | Question prompt text color                  | `inherit`                                                                |
| `--skin-question-radius`     | Question prompt border radius               | `0.75rem` (matches `rounded-xl`)                                         |
| `--skin-question-audio-bg`   | AudioButton background                      | `var(--bs-primary)`                                                      |
| `--skin-question-audio-fg`   | AudioButton icon/text color                 | `var(--bs-primary-foreground)`                                           |
| `--skin-sentence-gap-border` | `SentenceWithGaps` gap underline color      | `currentColor`                                                           |
| `--skin-sentence-gap-style`  | `SentenceWithGaps` gap underline style      | `dashed`                                                                 |

All additions are additive. Plan 1 tokens (`--skin-tile-bg`,
`--skin-slot-border`, feedback animations, etc.) are unchanged.

### Token contract — game-specific (not shared)

These live on each game's wrapper `<div>` and are read only by that game's
own components. They are NOT added to `classicSkin.tokens`.

| Game        | Token                        | Read by                      |
| ----------- | ---------------------------- | ---------------------------- |
| NumberMatch | `--skin-pip-color`           | `DominoTile` pip `<span>`    |
| NumberMatch | `--skin-pip-divider-color`   | `DominoTile` divider         |
| NumberMatch | `--skin-pip-divider-opacity` | `DominoTile` divider         |
| NumberMatch | `--skin-tile-word-bg`        | `NumeralTile` when word-mode |

No conflict with SortNumbers because SortNumbers does not render
`DominoTile` and does not set these tokens.

### Core component refactor (Limitation 1 fix)

#### `Slot.tsx`

- Remove the `isCustomSkin` branch.
- Always read state colors from tokens (`--skin-correct-*`, `--skin-wrong-*`,
  `--skin-slot-bg`, `--skin-slot-border`, `--skin-slot-active-border`).
- Replace Tailwind state classes (`border-primary bg-primary/10`,
  `border-destructive bg-destructive/10`) with class names that reference
  the tokens. Target: a single `style` object built from tokens, with state
  applying different token lookups (e.g. wrong-state sets
  `backgroundColor: 'var(--skin-wrong-bg)'`).
- Continue to emit the correct ARIA label and keep the dashed-preview
  animation. Preview border color and style move to `--skin-hover-border-*`.
- Keep `slotDecoration` and `skin` prop contract unchanged.

#### Tile components (`SortNumbersTileBank`, `LetterTileBank`, `NumeralTileBank`)

- Replace `style={skeuoStyle}` with a shared helper `tileStyle(skin)` that
  returns the same gradient/shadow/text-shadow values but reads
  `--skin-tile-surface`, `--skin-tile-highlight`, `--skin-tile-ring`,
  `--skin-tile-inset-*`, `--skin-tile-text-shadow`, and `--skin-tile-radius`.
- `skeuoStyle` is deleted; the old `--skeuo-*` / `--card` token fallbacks
  are removed from the CSS layer (confirmed not referenced elsewhere; if any
  remain, they get migrated).
- Bank hole `<div>` (the empty placeholder where a placed tile originated)
  reads `--skin-bank-hole-bg` and `--skin-bank-hole-shadow`.
- Hover-preview dashed border on the bank hole reads
  `--skin-hover-border-color` and `--skin-hover-border-style`.

#### Question components (`AudioButton`, `DotGroupQuestion`, `EmojiQuestion`, `ImageQuestion`, `TextQuestion`)

- Each button reads `--skin-question-bg`, `--skin-question-text`,
  `--skin-question-radius` from its wrapping game container.
- `AudioButton` additionally reads `--skin-question-audio-bg` and
  `--skin-question-audio-fg`.
- `DotGroupQuestion` keeps its per-dot interactive logic; dot colors move to
  tokens (`--skin-question-dot-bg`, `--skin-question-dot-assigned-bg`).
  Adding those two to the contract above — folding them in: `dot-bg` defaults
  to `var(--bs-muted)`; `dot-assigned-bg` defaults to `var(--bs-primary)`.
- `EmojiQuestion` / `ImageQuestion` / `TextQuestion` inherit
  `--skin-question-*` — they already use `rounded-xl`, which maps to
  `--skin-question-radius`.

#### `SentenceWithGaps`

- Gap underline reads `--skin-sentence-gap-border` and
  `--skin-sentence-gap-style`.

### Game integration — WordSpell

- Add `const skin = useGameSkin('word-spell', config.skin)` at the top of
  `WordSpellSession`.
- Wrap the root render of `WordSpell` in:

  ```tsx
  <div
    className={`game-container skin-${skin.id}`}
    style={skin.tokens as React.CSSProperties}
  >
    {skin.SceneBackground ? <skin.SceneBackground /> : null}
    <AnswerGame config={answerGameConfig}>
      <WordSpellSession … skin={skin} />
    </AnswerGame>
  </div>
  ```

- Inside `WordSpellSession`, render `skin.RoundCompleteEffect`,
  `skin.CelebrationOverlay`, `skin.LevelCompleteOverlay` with the existing
  `ScoreAnimation` / `GameOverOverlay` as defaults.
- Pass `skin` down to any `Slot` instances that need `slotDecoration` (same
  pattern as SortNumbers).
- Add `WordSpell.skin.stories.tsx` at
  `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx` with a pink
  demo skin registration and `SkinHarness` wrapper.

### Game integration — NumberMatch

- Same pattern as WordSpell, with two extras:
  1. `NumberMatch.skin.stories.tsx` demo skin includes
     `--skin-pip-color: #ec4899` so the demo proves pip recoloring works.
  2. `DominoTile` component reads the game-specific tokens listed above.
- Add `NumberMatch.skin.stories.tsx` at
  `src/games/number-match/NumberMatch/NumberMatch.skin.stories.tsx`.

### `GameEndEvent` retry count (Limitation 2 fix)

- Add `retryCount: number` to `GameEndEvent`.
- Every emitter (`useAnswerGameContext` / reducer-level end handler / game
  components that emit `game:end`) passes the current session's retry count.
- `useGameSkin`'s subscription forwards it:
  `skin.onGameOver?.(event.retryCount)`.
- Backwards-compat: this is a new required field on the event. Any
  subscriber reading `GameEndEvent` must be audited. A fast-follow check in
  the plan enumerates current emitters and subscribers.

## File Structure

### New files

| File                                                              | Responsibility                                             |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx`       | Skin harness story with a pink demo skin                   |
| `src/games/number-match/NumberMatch/NumberMatch.skin.stories.tsx` | Skin harness story with a pink demo skin + pip override    |
| `src/components/answer-game/styles.test.ts`                       | Snapshot of `tileStyle(skin)` output for regression safety |

### Modified files

| File                                                                 | Change                                                                                             |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/lib/skin/classic-skin.ts`                                       | Add the new shared tokens listed above                                                             |
| `src/types/game-events.ts`                                           | Add `retryCount` to `GameEndEvent`                                                                 |
| `src/lib/skin/useGameSkin.ts`                                        | Forward `event.retryCount` to `skin.onGameOver`                                                    |
| `src/components/answer-game/styles.ts`                               | Replace `skeuoStyle` with `tileStyle(skin)` helper reading `--skin-tile-*` tokens                  |
| `src/components/answer-game/Slot/Slot.tsx`                           | Remove `isCustomSkin` branch; always apply tokens; move state colors to `--skin-correct-*/wrong-*` |
| `src/components/answer-game/Slot/SentenceWithGaps.tsx`               | Gap underline reads `--skin-sentence-gap-*`                                                        |
| `src/components/questions/AudioButton/AudioButton.tsx`               | Reads `--skin-question-audio-*`                                                                    |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`     | Dot / assigned-dot read `--skin-question-dot-*`                                                    |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`           | Button reads `--skin-question-bg/text/radius`                                                      |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`           | Button reads `--skin-question-bg/text/radius`                                                      |
| `src/components/questions/TextQuestion/TextQuestion.tsx`             | Button reads `--skin-question-bg/text/radius`                                                      |
| `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` | Replace `skeuoStyle` with `tileStyle(skin)`; bank hole + hover read new tokens                     |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`             | Same                                                                                               |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`         | Same; `DominoTile` pips read `--skin-pip-*`                                                        |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                       | `useGameSkin`, wrapper div, render slots, pass `skin` to `Slot`                                    |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`                 | Same                                                                                               |
| `src/games/word-spell/types.ts`                                      | Confirm `skin?: string` exists via `AnswerGameConfig` inheritance (no change expected)             |
| `src/games/number-match/types.ts`                                    | Same                                                                                               |

### Tests

- Existing `registry.test.ts`, `resolve-timing.test.ts`,
  `useGameSkin.test.tsx` unchanged.
- Add focused tests:
  - `styles.test.ts` — assert `tileStyle(skin)` emits expected
    `var(--skin-tile-*)` references.
  - Extend `useGameSkin.test.tsx` with a case proving
    `skin.onGameOver` receives the `retryCount` from the event.

### Visual regression

VR baselines will drift because:

1. Classic skin now flows through the token path (visual should be
   identical, but pixel-level diffs are possible from how styles serialize).
2. Hover preview, bank hole, and state-override colors move from Tailwind
   classes to CSS variables.

Run `yarn test:vr:update` once at the end of the branch after manually
reviewing the diff PNGs. Unintentional drift (color shift, radius change)
gets fixed before the update; intentional drift (new token defaults are
equivalent but differently serialized) gets the baseline refresh.

## Testing

- **Unit**: token helper output, registry behavior, event payload fields.
- **Storybook**: three `*.skin.stories.tsx` files (SortNumbers existing,
  WordSpell new, NumberMatch new) each register a pink demo skin; the
  `SkinHarness` toolbar lets a reviewer toggle classic / demo and fire
  event buttons.
- **VR**: full suite refresh via Docker after manual diff review.
- **E2E**: no new tests needed — skin is transparent to gameplay.

## Risks and Mitigations

1. **Core component refactor leaks visual regressions across all three
   games.** Mitigation: run `yarn test:vr` early and often; don't update
   baselines until visuals are reviewed PNG by PNG.
2. **State-color token migration breaks the `wrong` / `preview` visuals the
   Plan 1 spec authors explicitly wanted preserved.** Mitigation:
   `--skin-wrong-bg` / `--skin-wrong-border` default to the exact colors
   Tailwind produces today (`rgb(from var(--destructive) r g b / 0.1)` and
   `var(--destructive)`).
3. **`skeuoStyle` deletion orphans an unused CSS token.** Mitigation:
   verify via grep nothing else references `--skeuo-*` or the imported
   `skeuoStyle` object; remove both only after the replacement lands.
4. **`GameEndEvent.retryCount` is a required new field.** Mitigation: audit
   every emitter before the plan lands; plan task inventories and updates
   all of them atomically.
5. **Question components are used outside games.** If any are rendered in
   routes without a game container, the `--skin-question-*` tokens resolve
   to nothing and the visuals change. Mitigation: grep usages; if any are
   outside a game container, either set the tokens on `:root` in
   `globals.css` as a fallback, or wrap them in a minimal token-setting
   context.
6. **Single PR size.** If diff balloons past reviewable size, split on the
   natural boundary (D + C → PR A; A + B → PR B). Confirm with user before
   splitting.

## Success Criteria

- All three games render identically to master with the classic skin (VR
  baselines refreshed only for token-serialization drift).
- Switching to each game's demo skin in the SkinHarness story visibly
  changes tile/slot/bank/question/hover colors without breaking interaction.
- `skin.onGameOver` in the SortNumbers harness logs the actual retry count
  after a player retries.
- `yarn lint` / `yarn typecheck` / `yarn test` / `yarn test:storybook`
  / `yarn test:vr` / `yarn test:e2e` all pass on the PR.

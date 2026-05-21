---
date: 2026-05-16
topic: unified-skin-token-architecture
---

# Unified Skin Token Architecture

## Summary

Introduces `data-tile-state` attributes with `@property`-registered tokens
(`--skin-tile-{state}-{property}`) across the full game UI. Normalizes
WordSpell, SortNumbers, and NumberMatch to the same token paths. XState drives
animation sequencing. New skins inherit all behavior by default — override only
what you change.

---

## Problem Frame

The skin system today entangles shape customization with state feedback. Dragon
Cave needs transparent backgrounds/borders because its visual boundary is an SVG
stone — but the same tokens (`--skin-wrong-bg`, `--skin-wrong-border`) also
drive bank-tile reject feedback. Setting them to transparent makes bank-reject
invisible. The result: 21 token overrides, 2 CSS hacks, and 2+ bugs — all
caused by one architectural gap (no separation between "slot container
appearance" and "state feedback colors/animations").

Meanwhile, animation sequencing lives in imperative JS chains
(`triggerShake → animationend → triggerEjectReturn → transitionend → cleanup`),
giving skins no declarative path to override motion. Bank tiles in
`lock-manual` mode have no fly-back animation at all — tiles just disappear
when tapped.

Cross-game consistency is fragile: SortNumbers retains a stale `isCustomSkin`
branch that Skin Rollout P2 deleted from Slot.tsx, and NumberMatch bank tiles
never receive the `skin` prop (missing `tileDecoration` entirely).

---

## Key Flows

- F1. Wrong tile placement (lock-auto-eject mode)
  - **Trigger:** Player drags tile to incorrect slot
  - **Steps:** Tile placed → wrong paint applied → shake animation (300ms) →
    XState timer fires → eject fly-back animation → fade → tile returns to bank
  - **Outcome:** Tile is back in bank (`data-tile-state="idle"`); slot
    transitions to `data-tile-state="empty"`
  - **Covered by:** R3, R4, R5, R8

- F2. Wrong tile placement (reject mode)
  - **Trigger:** Player drags tile to incorrect slot
  - **Steps:** Tile stays in bank → reject paint + shake animation (300ms) →
    returns to idle
  - **Outcome:** Tile never leaves bank; visual feedback confirms rejection
  - **Covered by:** R3, R4, R5, R6

- F3. Wrong tile removal (lock-manual mode)
  - **Trigger:** Player taps a wrong-locked tile in a slot
  - **Steps:** Tile in wrong state → player taps → XState transitions to
    ejecting → fly-back animation → tile returns to bank
  - **Outcome:** Tile is back in bank with fly-back animation (not instant
    disappear)
  - **Covered by:** R3, R5, R8

- F5. Correct tile placement
  - **Trigger:** Player drags tile to correct slot
  - **Steps:** Tile placed → `data-tile-state` set to `correct` → correct paint
    applied (background tint + border from `--skin-tile-correct-*` tokens) →
    tile locks in place
  - **Outcome:** Tile stays in slot with correct-state visual feedback
  - **Covered by:** R1, R2, R3

- F6. Tile pickup (drag start)
  - **Trigger:** Player begins dragging a tile from bank or lifting from slot
  - **Steps:** Tile picked up → `data-tile-state` set to `pickup` → pickup
    visual treatment applied (e.g., scale, elevation, opacity from
    `--skin-tile-pickup-*` tokens) → tile follows pointer
  - **Outcome:** Tile is visually "lifted" and tracks the drag position
  - **Covered by:** R3

- F4. New skin authoring
  - **Trigger:** Developer creates a new skin
  - **Steps:** Define skin object with only the tokens they want to change →
    all other tokens inherit from Classic via `:root` defaults →
    state feedback (colors, animations) works automatically
  - **Outcome:** Skin works with zero state-token overrides by default
  - **Covered by:** R1, R2, R7

---

## Requirements

**Token architecture**

- R1. Classic skin values are set on `:root`, using `var()` references to
  Bootstrap design-system variables freely. Animation tokens (durations,
  easing) are additionally registered via CSS `@property` with literal
  `initial-value` for typed inheritance. A skin that omits a token inherits
  Classic behavior via the CSS cascade.
- R2. Token naming follows `--skin-tile-{state}-{property}` kebab-case pattern.
  Existing tokens are renamed (e.g., `--skin-correct-bg` →
  `--skin-tile-correct-bg`). This pattern applies to state-feedback tokens.
  Non-state tokens (`--skin-bank-hole-*`, `--skin-hover-*`,
  `--skin-sentence-gap-*`, etc.) retain existing names.
- R3. Tile/slot elements expose a `data-tile-state` attribute with one of seven
  mutually exclusive values: `idle`, `empty`, `correct`, `wrong`, `reject`,
  `pickup`, `ejecting`. Bank tiles at rest and placed tiles not in any special
  state use `idle`. Both bank tiles and slot elements carry `data-tile-state`.
  CSS differentiates via component selector (e.g., `.bank-tile[data-tile-state]`
  vs `.slot[data-tile-state]`), but default token values are shared — changing
  the wrong-state color cascades to both surfaces via `var()` aliases (see
  R5/R6). Skins diverge only when they explicitly override a surface-specific
  token.
- R4. Orthogonal modifier attributes compose with primary state:
  `data-shaking` (shake animation window), `data-speaking` (TTS active),
  `data-drag-over` (slot is hover target). Modifiers are boolean presence
  attributes — set when `true`, removed when `false`. CSS targets presence:
  `[data-shaking]`. TypeScript types and ESLint enforce boolean-only values to
  prevent `data-shaking="false"` (which CSS would still match). Modifiers can
  co-occur; CSS specificity determines which visual wins when animations
  conflict.

**State feedback separation**

- R5. Shake motion is shared between bank-reject and slot-wrong-shake via the
  `data-shaking` modifier. One set of shake motion tokens, consumed by both
  surfaces. Appearance tokens (colors) remain in separate namespaces per R6;
  Classic defaults reject appearance to the same values as wrong via `var()`
  aliases.
- R6. Bank-reject has its own appearance token namespace
  (`--skin-tile-reject-*`) separate from slot-wrong (`--skin-tile-wrong-*`).
  Classic defaults reject values to the same as wrong values. Skins can diverge.
- R7. State feedback tokens (colors, animations) are independent of slot base
  appearance tokens (bg, border, radius). A skin can override slot base to
  transparent while inheriting full state feedback unchanged.

**Animation sequencing**

- R8. XState engine drives animation state transitions
  (wrongShake → ejecting → ejected). CSS reacts to `data-tile-state` attribute
  changes. No imperative `animationend` listener chains for state transitions.
  Pure CSS animations (no next step needed) require no JS coordination.
  Animations that trigger state changes or sequenced steps go through XState.
  _Depends on Spec 1a (XState migration for answer-game). Current codebase
  uses `useReducer` + imperative `setTimeout`/`animationend` chains._
- R9. Both manual-eject (lock-manual tap) and auto-eject route through the same
  `ejecting` XState state with fly-back animation. _Note: manual-eject has no
  animation today (`REMOVE_TILE` is instant). This is net-new animation
  infrastructure, not a refactor of existing behavior._
- R10. Five animations are tokenized: shake, pop, pulse-ring, eject-fly,
  eject-fade. Skins override motion via tokens without redefining keyframes.

  | State/Modifier             | Animation             | Purpose                                   |
  | -------------------------- | --------------------- | ----------------------------------------- |
  | `wrong` + `[data-shaking]` | shake                 | Wrong placement feedback                  |
  | `ejecting`                 | eject-fly, eject-fade | Tile returns to bank                      |
  | `correct`                  | pop                   | Correct placement confirmation            |
  | `pickup`                   | pulse-ring            | Drag-in-flight visual lift                |
  | `[data-speaking]`          | pop (TBC)             | TTS active indicator (reuses correct pop) |

**Cross-game normalization**

- R11. WordSpell, SortNumbers, and NumberMatch all consume skin tokens via the
  same code paths. No `isCustomSkin` branches.
- R12. All three games' bank tile components receive the `skin` prop and render
  `tileDecoration` when provided. _Note: NumberMatch's `NumeralTileBank`
  requires a structural refactor (skin interface, prop plumbing through
  component tree, decoration slot in domino/dice grid layout, style path
  alignment) — not just prop threading._

**Full game UI scope**

- R13. The `@property` inheritance model applies to all token namespaces:
  `--skin-tile-*`, `--skin-slot-*`, `--skin-hud-*`, `--skin-chrome-*`,
  `--skin-question-*`, `--skin-scene-*`, `--skin-bank-*`.

---

## Acceptance Examples

- AE1. **Covers R1, R7.** Given a new skin that defines only
  `--skin-slot-bg: transparent` and `--skin-slot-border: transparent`, when a
  wrong tile is placed, the wrong-state paint (red background tint + red border)
  still appears because `--skin-tile-wrong-*` tokens inherit Classic's `:root`
  defaults via the CSS cascade.

- AE2. **Covers R6.** Given Dragon Cave skin (slot wrong tokens set to
  visible red for SVG consumption), when a bank tile is rejected in reject mode,
  the bank tile shows visible red feedback because `--skin-tile-reject-*` tokens
  are separate from `--skin-tile-wrong-*` and inherit Classic's red values.

- AE3. **Covers R8, R9.** Given lock-manual mode with a wrong tile in a slot,
  when the player taps the tile to remove it, the tile flies back to its bank
  position with animation (not instant disappear) because manual-eject routes
  through the same XState `ejecting` state as auto-eject.

- AE5. **Covers R5.** Given any skin, when a bank tile is rejected AND when a
  slot tile is wrong, both elements have `[data-shaking]` set and the same
  shake CSS animation fires on both surfaces — confirming shared shake motion.

- AE4. **Covers R5, R4.** Given any skin, when a tile is shaking (either
  bank-reject or slot-wrong-shake), the element has both
  `data-tile-state="wrong"` (or `"reject"`) AND `data-shaking="true"`. CSS
  rules targeting `[data-shaking]` apply the shared shake motion regardless of
  which surface triggered it.

---

## Success Criteria

- A new rectangular skin can be authored with 3-4 color token overrides and
  zero state/animation overrides — all state feedback works via inheritance.
- Dragon Cave's token count drops from 21 (with 10 transparent/none nulls) to
  ~11-13 (shape + HUD palette only) with no visual regressions in state
  feedback.
- Bank-reject is visible in Dragon Cave without CSS hacks.
- Lock-manual mode has fly-back animation matching lock-auto-eject behavior.
- All three games (WordSpell, SortNumbers, NumberMatch) pass existing tests
  after migration with no `isCustomSkin` branches remaining.
- All seven token namespaces (tile, slot, hud, chrome, question, scene, bank)
  use tokens via `:root` defaults. Tests validate each namespace inherits
  correctly and skin overrides apply without regressions.

---

## Scope Boundaries

- Dragon Cave fullscreen issues and remaining polish (blocked by Phase 1;
  separate body of work)
- Ghost consolidation / same-component portal (S3 — follow-up PR)
- System-alias three-tier cascade (S5 — additive once two skins exercise the
  system)
- Skin scaffolder CLI tooling (S6 — when skin count > 2)
- Haptic taxonomy (GH issue to file separately)
- Dark mode removal (separate PR; spawned task already filed)
- SpotAll game (refactored separately using established pattern)
- Spec 1b speaking tokens (`data-speaking`, `--skin-tile-speaking-*`) — defined
  by PR #382, not this work. This work provides the attribute pattern that Spec
  1b follows.

---

## Key Decisions

- **Hybrid state enum over composed:** Bank-reject and slot-wrong get separate
  token namespaces because Dragon Cave already demonstrates divergent treatment
  needs. Shared behavior (shake motion) is a modifier, not a merged state.
- **Kebab-case over BEM for tokens:** CSS custom properties industry convention
  is kebab-case. BEM's `__`/`--` separators create visual ambiguity alongside
  the `--` custom property prefix.
- **XState drives sequencing:** Engine owns timers and broadcasts state changes.
  CSS reacts to attributes. Eliminates imperative animation chains and enables
  lock-manual fly-back animation as a free consequence.
- **Full game UI scope:** The token inheritance model covers all token
  namespaces (tile, slot, HUD, chrome, question, scene, bank), not just tiles.
  Color tokens use `:root` defaults with `var()` references to preserve the
  Bootstrap design-system cascade. `@property` registration is reserved for
  animation timing tokens where literal `initial-value` and typed syntax
  descriptors (`<time>`, `<number>`) enable CSS interpolation.
- **XState timers stay hardcoded; CSS tokens control visual side only:**
  XState state machine timers (e.g., `after: { 300: 'ejecting' }`) remain in
  JS config. CSS animation tokens (`--skin-tile-wrong-motion-duration`) control
  the visual duration/easing. Skins can adjust animation feel within XState's
  timer window but cannot extend the state machine's transition timing.
- **Token rename is a breaking change:** `--skin-correct-bg` →
  `--skin-tile-correct-bg`. Accepted within this migration; no backwards
  compatibility shim.

---

## Dependencies / Assumptions

- XState is available in the game engine (Spec 1a M1 introduces it; but the
  engine already uses XState via `useGameEngine` in NumberMatch).
- `@property` browser support is sufficient (baseline 2024 — Safari 16.4+,
  Chrome 85+, Firefox 128+). No polyfill needed for the project's target
  browsers.
- Slot.tsx `correctStyle` bug (`--skin-correct-border` used for `color`
  property at line 108) is fixed as part of migration, not as a separate fix.

---

## Outstanding Questions

### Deferred to Planning

- _(Affects R10, technical)_ Exact keyframe token shape: should animation tokens
  be full shorthand (`shake 300ms ease-in-out`) or decomposed
  (`--skin-tile-wrong-motion-name` + `--skin-tile-wrong-motion-duration`)?
- ~~_(Affects R8)_ XState timer ↔ CSS token bridge — resolved: timers stay
  hardcoded in JS; CSS tokens control visual side only (see Key Decisions).~~
- _(Affects R13, technical)_ Which chrome/overlay/question tokens need state
  attributes vs. which are simple appearance-only tokens that just inherit?

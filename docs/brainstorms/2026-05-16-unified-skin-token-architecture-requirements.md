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
invisible. The result: 17+ token overrides, 2 CSS hacks, and 2+ bugs — all
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
  - **Outcome:** Tile is back in bank; slot is empty
  - **Covered by:** R3, R4, R5, R8

- F2. Wrong tile placement (reject mode)
  - **Trigger:** Player drags tile to incorrect slot
  - **Steps:** Tile stays in bank → reject paint + shake animation (300ms) →
    returns to idle
  - **Outcome:** Tile never leaves bank; visual feedback confirms rejection
  - **Covered by:** R3, R4, R6

- F3. Wrong tile removal (lock-manual mode)
  - **Trigger:** Player taps a wrong-locked tile in a slot
  - **Steps:** Tile in wrong state → player taps → XState transitions to
    ejecting → fly-back animation → tile returns to bank
  - **Outcome:** Tile is back in bank with fly-back animation (not instant
    disappear)
  - **Covered by:** R3, R5, R8

- F4. New skin authoring
  - **Trigger:** Developer creates a new skin
  - **Steps:** Define skin object with only the tokens they want to change →
    all other tokens inherit from Classic via `@property` initial values →
    state feedback (colors, animations) works automatically
  - **Outcome:** Skin works with zero state-token overrides by default
  - **Covered by:** R1, R2, R7

---

## Requirements

**Token architecture**

- R1. Every skin token is registered via CSS `@property` with Classic skin
  values as `initial-value`. A skin that omits a token inherits Classic
  behavior.
- R2. Token naming follows `--skin-tile-{state}-{property}` kebab-case pattern.
  Existing tokens are renamed (e.g., `--skin-correct-bg` →
  `--skin-tile-correct-bg`).
- R3. Tile/slot elements expose a `data-tile-state` attribute with one of six
  mutually exclusive values: `empty`, `correct`, `wrong`, `reject`, `pickup`,
  `ejecting`.
- R4. Orthogonal modifier attributes compose with primary state:
  `data-shaking="true"` (shake animation window), `data-speaking="true"` (TTS
  active), `data-drag-over="true"` (slot is hover target).

**State feedback separation**

- R5. Shake animation and wrong paint are shared between bank-reject and
  slot-wrong-shake via the `data-shaking` modifier. One set of shake tokens,
  consumed by both surfaces.
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
- R9. Both manual-eject (lock-manual tap) and auto-eject route through the same
  `ejecting` XState state with fly-back animation.
- R10. Six animations are tokenized: shake, pop, pulse-ring, blink, eject-fly,
  eject-fade. Skins override motion via tokens without redefining keyframes.

**Cross-game normalization**

- R11. WordSpell, SortNumbers, and NumberMatch all consume skin tokens via the
  same code paths. No `isCustomSkin` branches.
- R12. All three games' bank tile components receive the `skin` prop and render
  `tileDecoration` when provided.

**Full game UI scope**

- R13. The `@property` inheritance model applies to all token namespaces:
  `--skin-tile-*`, `--skin-slot-*`, `--skin-hud-*`, `--skin-chrome-*`,
  `--skin-question-*`, `--skin-scene-*`, `--skin-bank-*`.

---

## Acceptance Examples

- AE1. **Covers R1, R7.** Given a new skin that defines only
  `--skin-slot-bg: transparent` and `--skin-slot-border: transparent`, when a
  wrong tile is placed, the wrong-state paint (red background tint + red border)
  still appears because `--skin-tile-wrong-*` tokens are inherited from Classic
  via `@property` initial values.

- AE2. **Covers R5, R6.** Given Dragon Cave skin (slot wrong tokens set to
  visible red for SVG consumption), when a bank tile is rejected in reject mode,
  the bank tile shows visible red feedback because `--skin-tile-reject-*` tokens
  are separate from `--skin-tile-wrong-*` and inherit Classic's red values.

- AE3. **Covers R8, R9.** Given lock-manual mode with a wrong tile in a slot,
  when the player taps the tile to remove it, the tile flies back to its bank
  position with animation (not instant disappear) because manual-eject routes
  through the same XState `ejecting` state as auto-eject.

- AE4. **Covers R5, R4.** Given any skin, when a tile is shaking (either
  bank-reject or slot-wrong-shake), the element has both
  `data-tile-state="wrong"` (or `"reject"`) AND `data-shaking="true"`. CSS
  rules targeting `[data-shaking]` apply the shared shake motion regardless of
  which surface triggered it.

---

## Success Criteria

- A new rectangular skin can be authored with 3-4 color token overrides and
  zero state/animation overrides — all state feedback works via inheritance.
- Dragon Cave's token count drops from 17+ (with 4 transparent nulls) to ~11
  (shape + HUD palette only) with no visual regressions in state feedback.
- Bank-reject is visible in Dragon Cave without CSS hacks.
- Lock-manual mode has fly-back animation matching lock-auto-eject behavior.
- All three games (WordSpell, SortNumbers, NumberMatch) pass existing tests
  after migration with no `isCustomSkin` branches remaining.

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
- **Full game UI scope:** The `@property` inheritance model covers all token
  namespaces (tile, slot, HUD, chrome, question, scene, bank), not just tiles.
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
- _(Affects R8, needs research)_ How does XState read CSS custom property values
  for timer durations? Does it need a JS bridge, or do timers stay hardcoded in
  the machine config with tokens only controlling the CSS side?
- _(Affects R13, technical)_ Which chrome/overlay/question tokens need state
  attributes vs. which are simple appearance-only tokens that just inherit?

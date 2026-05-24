---
date: 2026-05-15
topic: tile-customization-surface-catalog
focus: Exhaustive map of every tile/slot/bank customization surface, plus missing states from kids-game prior art
mode: repo-grounded
companion: 2026-05-15-skin-token-surface-and-ghost-consolidation-ideation.md
---

# Tile Customization Surface Catalog

Companion to the skin-token-surface ideation doc. This pass enumerates every visual + interaction surface on tiles (bank + slot) so the next ideation round has a complete map of what's customizable, what's hardcoded, and what states we don't model at all.

## Coverage snapshot

| Category     | Tokenized today | Hardcoded today | Total surfaces |
| ------------ | --------------- | --------------- | -------------- |
| Bank tile    | 10              | 8               | 18             |
| Slot tile    | 8               | 9               | 17             |
| HUD          | 12              | 4               | 16             |
| Animations   | 0               | 6               | 6              |
| Chrome       | 7               | 3               | 10             |
| Question     | 6               | 4               | 10             |
| Sentence-gap | 2               | 4               | 6              |
| **Total**    | **45**          | **38**          | **83**         |

~54% of catalogued surfaces have tokens; ~46% are hardcoded in component classNames, inline styles, or keyframes. Most of the hardcoded surfaces could become tokens cheaply.

## Surface catalog

### Bank container

| Surface         | Token / mechanism    | Hardcoded                                                     | Gap                                        |
| --------------- | -------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Background      | `--skin-bank-bg`     |                                                               |                                            |
| Border          | `--skin-bank-border` |                                                               |                                            |
| Layout          |                      | `flex flex-wrap justify-center gap-3` (LetterTileBank.tsx:72) | `--skin-bank-layout`, `--skin-bank-gap`    |
| Container width |                      | uncontrolled (children wrap)                                  | `--skin-bank-max-width` for narrow tablets |

### Bank hole (empty slot in the bank)

| Surface                | Token                                                    | Hardcoded                            | Gap                               |
| ---------------------- | -------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| Background             | `--skin-bank-hole-bg`                                    |                                      |                                   |
| Inner shadow           | `--skin-bank-hole-shadow`                                |                                      |                                   |
| Size                   |                                                          | `size-14` = 56px (LetterTileBank:96) | `--skin-bank-hole-size`           |
| Radius                 |                                                          | `rounded-xl` = 0.75rem               | `--skin-bank-hole-radius`         |
| Drag-over preview ring | `--skin-hover-border-color`, `--skin-hover-border-style` | duration/easing of transition        | `--skin-bank-hole-hover-duration` |

### Bank tile (letter/number button in the bank)

| Surface             | Token                                                     | Hardcoded                                                           | Gap                            |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Surface gradient    | `--skin-tile-surface`, `--skin-tile-highlight`            | gradient stops 70.48% / 93.62% (styles.ts:5)                        | `--skin-tile-gradient-spread`  |
| Skeuo inset shadows | `--skin-tile-ring`, `-inset-bottom`, `-inset-top`         |                                                                     |                                |
| Depth shadow        |                                                           | `0 2px 5px -1px rgb(0 0 0 / 0.05), 0 1px 3px -1px rgb(0 0 0 / 0.3)` | `--skin-tile-depth-shadow`     |
| Text shadow         | `--skin-tile-text-shadow`                                 |                                                                     |                                |
| Border-radius       | `--skin-tile-radius`                                      |                                                                     |                                |
| Text color          | (inherits)                                                |                                                                     | `--skin-tile-color`            |
| Font weight         | `--skin-tile-font-weight`                                 |                                                                     |                                |
| Font family         |                                                           | `inherit`                                                           | `--skin-tile-font-family`      |
| Font size           |                                                           | `text-2xl` in LetterTileBank:29 (game-specific)                     | `--skin-tile-font-size`        |
| Tile size           |                                                           | `size-14` (LetterTileBank:29)                                       | `--skin-tile-size`             |
| Active scale        | `--skin-tile-active-scale: 0.95` (defined but **unused**) | `active:scale-95` hardcoded                                         | wire the existing token        |
| Hover state         |                                                           | implicit `:hover` (no skin styling)                                 | `--skin-tile-hover-bg`         |
| Focus-visible ring  |                                                           | Tailwind defaults                                                   | `--skin-tile-focus-ring-color` |
| Drag-source opacity |                                                           | `opacity-30` when active drag                                       | `--skin-tile-dragging-opacity` |

### Bank tile reject feedback

| Surface              | Token                            | Hardcoded                                           | Gap                                            |
| -------------------- | -------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| Flash colors         | `--skin-wrong-bg/-border/-color` |                                                     |                                                |
| Shake animation      | `--skin-wrong-animation`         | shake keyframes ±4px/±3px/±2px (styles.css:428-442) | `--skin-shake-amplitude`, `--skin-shake-steps` |
| Shake duration       |                                  | 300ms ease-in-out (styles.css:472)                  | `--skin-shake-duration`, `--skin-shake-easing` |
| Inline-style restore |                                  | `flashBankTileRejectFeedback` 90-line ceremony      | survivor S4 (data-state) eliminates this       |

### Slot container

| Surface            | Token                                                                                    | Hardcoded                               | Gap                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Background         | `--skin-slot-bg`                                                                         |                                         |                                                         |
| Border             | `--skin-slot-border`                                                                     |                                         |                                                         |
| Border width       |                                                                                          | `border-2` = 2px                        | `--skin-slot-border-width`                              |
| Radius             | `--skin-slot-radius`                                                                     |                                         |                                                         |
| Hit area padding   |                                                                                          | `p-1.5` outer wrapper (Slot.tsx:131)    | `--skin-slot-hit-area-padding`                          |
| Active slot border | `--skin-slot-active-border` (defined but **unused** at slot level — see classic-skin:32) | none (only cursor signals active)       | wire the existing token + add `--skin-active-slot-ring` |
| Transition         |                                                                                          | `transition-all` (no duration / easing) | `--skin-slot-transition-duration`                       |

### Slot tile states

| State               | Token / mechanism                          | Hardcoded                                                                                                                    | Gap                                                                 |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Empty               | `--skin-slot-bg`, `--skin-slot-border`     |                                                                                                                              |                                                                     |
| Correct             | `--skin-correct-bg/-border`                | `color: var(--skin-correct-border)` (text color aliased to border, Slot.tsx:108)                                             | `--skin-correct-color` (already defined but text uses border token) |
| Wrong               | `--skin-wrong-bg/-border/-color`           | `ring-2 ring-destructive ring-offset-2` (Slot.tsx:71-73)                                                                     | `--skin-wrong-ring-color/-width/-offset`                            |
| Wrong-shake         | (uses Wrong state + `animate-shake` class) | shake keyframes hardcoded                                                                                                    | see Bank tile reject above                                          |
| Preview-target      | `--skin-hover-border-color/-style`         | `pulse-ring 1.5s ease-in-out infinite` (styles.css:459-468), ring expansion 6px, color `rgb(var(--primary) / 40%)` hardcoded | `--skin-preview-ring-color/-width/-duration`                        |
| Preview-source      |                                            | `opacity: 50%` for bold text (Slot.tsx:150)                                                                                  | `--skin-preview-source-opacity`                                     |
| Locked              | (read via `slotDecoration` zone snapshot)  | no built-in styling                                                                                                          | `--skin-locked-overlay` or `--skin-locked-bg`                       |
| Active              |                                            | NONE in classic skin (only cursor signals it)                                                                                | `--skin-active-slot-bg/-border/-ring`                               |
| Cursor (text-input) |                                            | `h-0.5 w-7 bg-primary animate-blink` (Slot.tsx:163)                                                                          | `--skin-cursor-color/-width/-height/-blink-duration`                |

### Slot tile content (button inside slot)

| Surface                                | Token                          | Hardcoded                                                      | Gap                                                            |
| -------------------------------------- | ------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Same as bank tile (uses `tileStyle()`) | (inherits all `--skin-tile-*`) |                                                                |                                                                |
| Text color                             |                                | `text-card-foreground` (Slot.tsx:184)                          | `--skin-slot-tile-color`                                       |
| Cursor (CSS)                           |                                | `cursor-grab active:cursor-grabbing`                           | `--skin-slot-tile-cursor`                                      |
| Pop on placement                       |                                | pop keyframes `scale(1 → 1.08 → 1)` 250ms (styles.css:445-457) | `--skin-pop-scale`, `--skin-pop-duration`, `--skin-pop-easing` |
| Eject fly                              |                                | transform 300ms ease-in (slot-animations:162)                  | `--skin-eject-fly-duration/-easing`                            |
| Eject fade                             |                                | opacity 200ms ease-out (slot-animations:130)                   | `--skin-eject-fade-duration/-easing`                           |

### Drag ghost (3 implementations after PR #358)

| Surface                | Token                                       | Hardcoded                                                            | Gap                                                            |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Background             | (cloned from source via `getComputedStyle`) |                                                                      |                                                                |
| Box-shadow             | (cloned from source)                        |                                                                      |                                                                |
| Font-size              | (cloned, scaled by visualScale)             |                                                                      |                                                                |
| z-index                |                                             | `9999` (slot-animations:102; useTouchDrag/useSlotTileDrag)           | `--skin-drag-ghost-z-index`                                    |
| Opacity                |                                             | `0.95` (useTouchDrag:72), no value in other two                      | `--skin-drag-ghost-opacity`                                    |
| Scale lift             |                                             | none (kept off after PR #358); decoration uses `filter: drop-shadow` | `--skin-drag-ghost-scale`                                      |
| Decoration carry-along | (cloned via `innerHTML`)                    | requires globally-scoped CSS class for decoration to apply           | survivor S3 (same-component portal) eliminates the requirement |

### HUD (ProgressHUD.tsx)

| Surface            | Token                                                                                        | Hardcoded                                                                   | Gap                                                              |
| ------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Container bg       | `--skin-hud-bg`                                                                              |                                                                             |                                                                  |
| Container radius   | `--skin-hud-radius`                                                                          |                                                                             |                                                                  |
| Container padding  | `--skin-hud-padding` (overridden by hardcoded `px-[0.75rem] py-[0.25rem]` in ProgressHUD:21) | dead token                                                                  | wire the existing token correctly                                |
| Container gap      | `--skin-hud-gap`                                                                             |                                                                             |                                                                  |
| Dot size           | `--skin-hud-dot-size`                                                                        |                                                                             |                                                                  |
| Dot fill           | `--skin-hud-dot-fill`                                                                        |                                                                             |                                                                  |
| Dot empty          | `--skin-hud-dot-empty`                                                                       |                                                                             |                                                                  |
| Dot border         | `--skin-hud-dot-border`                                                                      | border width `1px` for todo, `border-2` for current                         | `--skin-hud-dot-border-width`                                    |
| Current ring       | `--skin-hud-dot-current-border`                                                              | pulse ring expansion 6px, duration 1.5s, easing ease-in-out                 | `--skin-hud-dot-pulse-*`                                         |
| Fraction color     | `--skin-hud-fraction-color`                                                                  |                                                                             |                                                                  |
| Fraction sep color | `--skin-hud-fraction-sep-color`                                                              | `font-extrabold` weight, `mx-0.5` separator margin, `/` separator character | `--skin-hud-fraction-sep-margin`, `--skin-hud-fraction-sep-char` |
| Level color        | `--skin-hud-level-color`                                                                     | `font-extrabold tracking-widest`, "LEVEL" English prefix                    | `--skin-hud-level-tracking`, i18n "LEVEL" string                 |

### Chrome (GameShell buttons)

| Surface              | Token                                | Hardcoded                             | Gap                               |
| -------------------- | ------------------------------------ | ------------------------------------- | --------------------------------- |
| Button bg            | `--skin-chrome-button-bg`            |                                       |                                   |
| Button color         | `--skin-chrome-button-color`         |                                       |                                   |
| Button radius        | `--skin-chrome-button-radius`        |                                       |                                   |
| Button shadow        | `--skin-chrome-button-shadow`        |                                       |                                   |
| Button ring color    | `--skin-chrome-button-ring-color`    |                                       |                                   |
| Button opacity       | `--skin-chrome-button-opacity`       |                                       |                                   |
| Button hover opacity | `--skin-chrome-button-opacity-hover` |                                       |                                   |
| Wrapper bg           | `--skin-chrome-wrapper-bg`           |                                       |                                   |
| Button size          |                                      | `size-10` = 40px (GameShell:68)       | `--skin-chrome-button-size`       |
| Ring width           |                                      | `ring-1` rest, `ring-2` focus-visible | `--skin-chrome-button-ring-width` |

### Question (AnswerGame question zone)

| Surface                   | Token                                 | Hardcoded                                       | Gap                      |
| ------------------------- | ------------------------------------- | ----------------------------------------------- | ------------------------ |
| Tokens defined-but-unused | `--skin-question-bg/-text/-radius`    | `gap-4 px-4 py-6` hardcoded in AnswerGame:62-65 | wire the existing tokens |
| Audio button bg           | `--skin-question-audio-bg`            | game-delegated styling                          |                          |
| Audio button fg           | `--skin-question-audio-fg`            | game-delegated styling                          |                          |
| Question dot bg           | `--skin-question-dot-bg/-assigned-bg` |                                                 |                          |

### Sentence-with-gaps (SentenceWithGaps.tsx)

| Surface           | Token                               | Hardcoded                | Gap                             |
| ----------------- | ----------------------------------- | ------------------------ | ------------------------------- |
| Gap border bottom | `--skin-sentence-gap-border/-style` | `border-b-2` (2px width) | `--skin-sentence-gap-width`     |
| Gap min-width     |                                     | `min-w-16` = 64px        | `--skin-sentence-gap-min-width` |
| Gap margin        |                                     | `mx-1` = 4px each side   | `--skin-sentence-gap-margin`    |
| Gap padding       |                                     | `px-2` = 8px each side   | `--skin-sentence-gap-padding`   |

### Animations (global keyframes, styles.css)

| Animation        | Hardcoded values                                                                             | Gap                                                   |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `shake`          | 300ms ease-in-out; translateX ±4px/±3px/±2px in 5 steps                                      | `--skin-shake-{duration,easing,amplitude,steps}`      |
| `pop`            | 250ms ease-out; scale 1 → 1.08 → 1                                                           | `--skin-pop-{duration,easing,scale}`                  |
| `pulse-ring`     | 1.5s ease-in-out infinite; box-shadow 0 0 0 0 → 0 0 0 6px; color `rgb(var(--primary) / 40%)` | `--skin-pulse-ring-{duration,easing,expansion,color}` |
| `blink` (cursor) | 1s step-end infinite; opacity toggle                                                         | `--skin-blink-duration`                               |
| `eject-fly`      | transform 300ms ease-in (slot-animations:162)                                                | `--skin-eject-fly-{duration,easing}`                  |
| `eject-fade`     | opacity 200ms ease-out (slot-animations:130)                                                 | `--skin-eject-fade-{duration,easing}`                 |

## States we don't model

From prior-art research on kids' learning games (Endless Alphabet/Reader, Duolingo ABC, Teach Your Monster to Read, Toca Boca apps, Khan Academy Kids — see [companion ideation doc](2026-05-15-skin-token-surface-and-ghost-consolidation-ideation.md) sources):

| Missing state                 | Trigger                                                   | Example                                                            | Should we model?                                                           |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Pickup / in-hand              | Touch-down on bank tile (before drag)                     | Endless Alphabet — tile transforms to character on pickup          | Yes — Dragon Cave could use this hook                                      |
| Audio-playing-on-tile         | Tile is speaking its phoneme/letter (tap not drag)        | Endless Alphabet — narrated sound on tap                           | Yes — already a UX in WordSpell `speakTile`                                |
| Locked-correct                | Tile snapped + slot closed (distinct from placed-correct) | Endless Alphabet — per-tile dance                                  | Maybe — we have `isLocked` snapshot but no per-tile visual                 |
| Celebrate / whole-word        | All tiles placed; sequence-level win                      | Endless Alphabet — word-meaning animation; Duolingo — green banner | Yes — partly covered by GameOverOverlay, but per-tile choreography missing |
| Hint-prompted / glow          | Idle time exceeds threshold; tile pulses to cue           | Common across the genre; not isolated to one app                   | Future — we don't ship hints yet                                           |
| Acknowledged-wrong            | Child tapped "got it" after wrong, before retry           | Duolingo — `GOT IT` CTA state                                      | Maybe — depends on whether Phase 2 ships an explicit acknowledge step      |
| Needs-retry / struggle-marked | System detected repeated misses on this grapheme          | Teach Your Monster — adaptive grapheme reappearance                | Yes — converges with SRS roadmap (issue #343)                              |

## Behavior knobs (non-visual surfaces tied to skin feel)

| Knob                         | Today                                                                                    | Should it be skin-controlled?                              |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `wrongTileBehavior`          | `reject` / `lock-auto-eject` / `allow` — game config, not skin token                     | No — game decides, not skin                                |
| Auto-eject delay             | `skin.timing.autoEjectDelay` (1000ms default) — supported via skin config, not CSS token | Yes, but the path already exists                           |
| Sound suppression            | `skin.suppressDefaultSounds` boolean — all-or-nothing                                    | Yes — could be per-sound                                   |
| Sound choice                 | `playSound('correct')` / `playSound('wrong')` external API                               | Per-skin sound packs would be nice eventually              |
| Haptic feedback              | NONE in current code                                                                     | Yes — kids-genre uses pickup/snap/error haptics            |
| ARIA announcements per state | Generic; not state-aware                                                                 | Yes — accessibility floor                                  |
| `prefers-reduced-motion`     | `motion-safe:` Tailwind variant on pulse-ring only                                       | Should cascade across every animation token in survivor S5 |

## Implications for the survivors (S1-S6)

The new findings sharpen the survivors:

- **S1 (composite paint tokens)**: Confirmed direction. Add a `--skin-tile-pickup-paint` and `--skin-tile-audio-playing-paint` to the composite enum — the missing states fit cleanly without redesign.
- **S2 (Object Style decomposition)**: The 6 hardcoded animations table validates this — splitting motion into its own block lets a skin tokenize shake amplitude / pop scale / pulse duration independently. Subsumes ~10 missing tokens.
- **S3 (same-component portal'd ghost)**: Confirmed. Adds: pickup-state visuals can now apply at drag-start (the same tile node is portal'd, so any state token activates without re-cloning).
- **S4 (data-tile-state attribute)**: Even stronger now. The 7 missing states fit naturally as additional attribute values; no engine knob redesign needed when we add `data-tile-state="pickup"` or `data-tile-state="audio-playing"`.
- **S5 (system-alias layer + motion vocabulary)**: The 6 hardcoded animations all collapse to references into the vocabulary — `--skin-shake-motion: var(--bs-motion-shake-default)` etc. `prefers-reduced-motion` collapses every animation token in one place.
- **S6 (matrix story + scaffolder)**: The matrix grows from 5 states × N skins to 8-10 states × N skins — more cells but still a single canvas.

## Surfaces that are "ghost tokens" — defined but unused

These exist in classic-skin.ts but consumers ignore them:

1. `--skin-tile-active-scale: 0.95` — components use `active:scale-95` hardcoded instead.
2. `--skin-hud-padding: 0.25rem 0.75rem` — `ProgressHUD.tsx:21` overrides with `px-[0.75rem] py-[0.25rem]` hardcoded.
3. `--skin-question-bg/-text/-radius` family — `AnswerGame.tsx:62-65` hardcodes `gap-4 px-4 py-6` instead.
4. `--skin-slot-active-border` (classic-skin.ts:32) — no consumer reads it; slot has no visual active-state.
5. `--skin-question-audio-bg/-fg` — exist but no shared audio button component uses them.

These are low-effort wins for the PR — wire the tokens through the components and the surface coverage climbs ~5%.

## Cross-spec alignment: Instructions + TTS Lifecycle (Spec 1a/1b)

[Spec 1a — 2026-05-03-instructions-tts-lifecycle-design.md](../superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md) defines 11 canonical lifecycle events on the existing `GameEventBus`. **Most of the "missing states" enumerated above map directly to lifecycle events Spec 1a is already adding to the engine.** The skin-token work in this catalog and the TTS lifecycle work in Spec 1a are two sides of the same axis — Spec 1a says "when each moment happens and what's spoken"; this catalog says "how each moment looks."

### Mapping: missing tile states ↔ Spec 1a lifecycle events

| Missing state I named           | Spec 1a / 1b coverage                                                                                                                                   | Lives where                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Audio-playing-on-tile           | **Spec 1b §12**: `data-speaking="true"` attribute + `--skin-tile-speaking-{bg,fg,outline}` tokens; `round:tts-played` bus event emits on every playback | Spec 1b (deferred until first themed skin sets it)                                                  |
| Locked-correct (per-tile)       | Falls between `round.correct` (engine lifecycle) and `placedTileId/isLocked` (per-tile snapshot already in `slotDecoration`)                            | Skin-side — covered by S4 once we ratify per-tile data-state                                        |
| Celebrate / whole-word complete | **Spec 1a §4** `round.celebrate` event — engine emits it after `round.correct`, pre-advance                                                             | Spec 1a (M2) defines the event; we define the visual                                                |
| Hint-prompted glow              | **Spec 1a §4.2** `round.idle` event — engine fires it after 8s (pre-k/k) / 12s (year1-2) of no progress                                                 | Spec 1a (M2) defines the event; we define the visual                                                |
| Acknowledged-wrong              | No coverage — possibly Spec 2 (tour overlay) territory                                                                                                  | Open                                                                                                |
| Needs-retry / struggle-marked   | Not in TTS specs — SRS v2 territory (cf. [#343](https://github.com/leocaseiro/base-skill/issues/343) cluster)                                           | SRS-side                                                                                            |
| **Pickup / in-hand**            | **NOT covered** — Spec 1a only defines round/game lifecycle events; no `tile:pickup` event                                                              | New work — engine touches `SET_DRAG_ACTIVE` reducer action today, but it isn't broadcast on the bus |

### What this changes about the survivors

- **S4 (data-state attribute) is validated by independent convergence.** Spec 1b §12 plans `data-speaking="true"` on tile elements with skin tokens reading the attribute via CSS. That's the exact pattern S4 prescribes for `data-tile-state="wrong"`, applied to a single state.
- **Round/game state vs tile-scoped state are orthogonal axes.** A tile can simultaneously be `data-tile-state="wrong"` (driven by `round.error` lifecycle event) AND `data-speaking="true"` (driven by `round:tts-played`). Two attributes, not one multi-value attribute. Spec 1b's choice is correct.
- **S5 (motion vocabulary) needs to extend to speech-aware motion.** When TTS is playing a tile's phoneme (`data-speaking="true"`), the tile may pulse — that's another motion vocabulary entry (`--bs-motion-speaking-pulse`), composable with `prefers-reduced-motion`.
- **One genuinely new piece of work: tile-scoped lifecycle events.** Spec 1a only emits round/game-level events. For the "pickup" state and similar tile-local interactions (e.g., a tile being highlighted during `useExplainSequence` from Spec 1b), the engine needs to fire `tile:pickup`, `tile:drop`, `tile:speak-start`, `tile:speak-end` on the bus. This is additive to Spec 1a's event surface.

### Skin contract growth visible in Spec 1b §12

Spec 1b plans these additions to `GameSkin` for the speaking state:

- `--skin-tile-speaking-bg`
- `--skin-tile-speaking-fg`
- `--skin-tile-speaking-outline`

This is **the leaf-token shape today**, applied to a new state. Under S1+S2 the same coverage would be:

- `--skin-tile-speaking-appearance` (composite — replaces bg + fg + outline)
- `--skin-tile-speaking-motion` (animation name + duration, e.g. `var(--bs-motion-speaking-pulse)`)
- `--skin-tile-speaking-decoration` (shape/overlay slot — e.g. a microphone icon for accessibility)

Spec 1b can pick up either shape. If S1+S2 land first, Spec 1b ships in the new token shape. If Spec 1b lands first, S1+S2 absorb it during refactor. Either order works.

### Recommended next move

Sync the implementation plan for the skin-token work (post-`/ce-brainstorm`) with Spec 1a's M1/M2 milestones so the lifecycle events the engine starts emitting **also** drive the `data-tile-state` attribute writes. They're the same engine wiring, done once.

---
date: 2026-05-15
topic: skin-token-surface-and-ghost-consolidation
focus: Unified skin tokens for all tile visual states + drag-ghost consolidation
mode: repo-grounded
---

# Ideation: Skin Token Surface & Ghost Consolidation

## Grounding Context

### Codebase context

- **Stack.** React 19 + Vite + TS + Tailwind. Skin system applies CSS custom properties (`--skin-*`) per-game-instance via inline `style={skin.tokens}` on the game container. App theme uses `--bs-*` on `:root`. `GameSkin` contract: `{ id, name, tokens, tileDecoration?, slotDecoration?, SceneBackground? }`.
- **Classic skin** declares ~70 tokens. State tokens are paired quadruples: `--skin-correct-{bg,border,color,animation}` and `--skin-wrong-{bg,border,color,animation}`.
- **Dragon Cave** (first non-classic skin) sets correct/wrong tokens to `transparent` (4 redundant overrides per state) and re-paints state via a sibling SVG `slotDecoration` with state classes `.dragon-cave-stone-outline--{empty,correct,wrong}`. Strips tile background/border/shadow with `!important`. Has a one-off shake-emphasis CSS rule: `.skin-dragon-cave .animate-shake .dragon-cave-stone-outline--wrong { stroke-width: 32; filter: drop-shadow(0 0 6px var(--destructive)) }` (commit `ba958ccfe`).
- **Drag ghosts.** Three independent implementations: HTML5 mouse-drag ([useSlotTileDrag.ts](src/components/answer-game/useSlotTileDrag.ts) via `setCustomNativeDragPreview`), pointer-event touch-drag ([useTouchDrag.ts](src/components/answer-game/useTouchDrag.ts)), and eject fly-back ([slot-animations.ts](src/components/answer-game/Slot/slot-animations.ts) `triggerEjectReturn`). After PR #358 all three read `getComputedStyle(source).{background,boxShadow,fontSize}`, compute visual-scale compensation for parent transforms, and use property-by-property `Object.assign(style, …)` to defeat the jsdom `cssText` empty-value bug. They look consistent now, but the logic is triplicated — and a skin has no seam to say "ghost during drag should look different from ghost during eject."
- **Five tile states matter:** empty / placed-correct / placed-wrong (lock-manual) / placed-wrong-shake (lock-auto-eject) / bank-tile rejected. Plus secondary states: preview-target, preview-source, locked, active.

### Past learnings (from `docs/superpowers/specs/` + `docs/draggable-tile-ghost-consistency.md`)

- **Skin Rollout P2** (`2026-04-15-skin-rollout-p2-design.md`) already established the "compositional spread" pattern: `Slot` now spreads `{base, correct, wrong, preview, style}` so every state runs through the same code path. The `isCustomSkin` branch was deleted. The contract for the proposed work should mirror this discipline.
- **Dark-mode lesson** (`2026-04-07-dark-mode-a11y-vr-design.md`): inline styles beat class-selector specificity. Set INPUTS (palette, motion durations) inline; resolve DERIVATIONS (state-tinted colors, hover rings) via CSS rules that read those inputs — never inline state-derived values.
- **Animation canon:** shake = ±4px / 3 cycles / 300ms. Pop = scale 1→1.08→1 / 250ms. Auto-eject = ~1300ms total. Any new motion tokens must preserve these to keep classic VR pixel-stable.
- **Test isolation:** `__resetSkinRegistryForTests()` in `beforeEach` because `registerSkin` is a module-eval side effect.
- **Slot/tile escape hatch:** `slotDecoration(zone)` and `tileDecoration(tile)` are render-prop functions receiving `{ isEmpty, isWrong, isLocked, placedTileId }` — they are the proper escape when tokens can't express the visual.

### External grounding

- **Spectrum CSS** ships a `--system-*` alias layer between component leaves and theme overrides; a skin overrides one alias to retheme an entire variant family. Three-tier naming: `--spectrum-{component}-{property}-{state}`.
- **GitHub Primer** puts state last; base state is omitted (no `-rest` suffix). Variants encode semantics (`danger`, not `red`).
- **Polaris** exposes keyframe NAMES as tokens — `animation-name: var(--p-motion-keyframes-bounce)` — so authors override motion without redefining keyframes.
- **dnd-kit `DragOverlay`** is not a body-portal by default; portal is opt-in. The library's recommended "presentational component" pattern is: render the same component inside DragOverlay so token inheritance works by construction, not by DOM cloning.
- **CSS `@property`** registers a typed custom property with `syntax`, `inherits`, and `initial-value` — so undefined skin tokens resolve to the registered default instead of empty strings.

## Ranked Ideas

### 1. Composite paint tokens per state + `@property` typed fallback ladder

**Description:** Replace per-property state quadruples (`--skin-correct-{bg,border,color,animation}` × 5 states = 20 tokens) with one composite paint token per state — `--skin-tile-empty-paint`, `--skin-tile-correct-paint`, `--skin-tile-wrong-paint`, `--skin-tile-wrong-shake-paint`, `--skin-tile-bank-reject-paint`. Each composite is a single CSS value (e.g. a `background` shorthand, or a value the engine destructures into `background + border + color` via a registered shape). Register every token via `@property` with `syntax: '<color>'` or `'<custom-ident>'` and an `initial-value` matching classic-skin defaults — so a skin can list only the tokens it overrides and the rest resolve to typed defaults instead of empty strings.

**Warrant:** `direct:` Dragon Cave today sets `--skin-correct-bg`, `--skin-correct-border`, `--skin-wrong-bg`, `--skin-wrong-border` each individually to `transparent` ([dragon-cave-skin.tsx:807-810](src/games/word-spell/skins/dragon-cave-skin.tsx#L807-L810)) — four overrides for one "I'm painting elsewhere" decision. Plus the explicit `CRITICAL` comment at [dragon-cave-skin.tsx:822-829](src/games/word-spell/skins/dragon-cave-skin.tsx#L822-L829) about silently-undefined HUD tokens.

**Rationale:** Cuts a skin author's state-token surface from ~20 to ~5. Eliminates an entire class of bug ("you forgot to list `--skin-hud-dot-current-border` and it silently resolved to `''`"). The `@property` registration is the cheapest path to "list only what you override; fall through cleanly otherwise."

**Downsides:** Composite values complicate dynamic interpolation in some browsers (Safari < 16.4 has incomplete `@property` support; check baseline). If a skin wants to override only the border but not the background, they either accept the whole composite or we keep a leaf-level fallback for that case.

**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

---

### 2. Object Style decomposition: appearance / motion / decoration

**Description:** Decompose tile-state tokens into three orthogonal axes: **appearance** (paint — background, border, color), **motion** (animation-name, duration, easing), **decoration** (shape/mask/clip-path or a registered render-slot name). Each state has its own appearance + motion + decoration triplet. Skin overrides any block independently. Dragon Cave's shake-emphasis becomes a motion-block override (`--skin-tile-wrong-shake-motion-emphasis: …`), not a CSS hack tacked onto a state class.

**Warrant:** `direct:` Dragon Cave's shake-emphasis rule at [dragon-cave-skin.tsx:481-486](src/games/word-spell/skins/dragon-cave-skin.tsx#L481-L486) conflates appearance (red glow) and motion (timing-tied) under a single CSS selector — there's no contract slot for "motion overrides during wrong-shake." `external:` Adobe InDesign Object Styles split frame appearance, motion, and text into independently overridable blocks; this prevents the cross-coupling that creates "one-off CSS rule" backlog.

**Rationale:** Crystallizes what a "complete" tile contract means — appearance is the paint, motion is the choreography, decoration is the shape. Each gets its own override path. Subsumes the modulation-matrix idea (independent sources) and the gene-regulatory-modules analogy (complete slots prevent `!important`).

**Downsides:** API surface grows from per-state quadruples to per-state triplets-of-tokens — slightly more conceptual surface, though token count net-decreases. Requires clear docs so authors know which axis to reach for.

**Confidence:** 78%
**Complexity:** Medium
**Status:** Unexplored

---

### 3. Same-component portal'd ghost (no clone)

**Description:** Replace the three DOM-cloning ghost-builders with a `<DragOverlay>` overlay component that re-parents the actual `<Tile>` React node into an overlay layer via React portal. The tile and the ghost are the **same** rendered React subtree; on drag start, the original slot renders a placeholder while the tile node is portal'd to the overlay; on drop, it returns. All three legacy ghost call sites collapse into a single `useDragLayer({ kind: 'drag' | 'eject' })` hook.

**Warrant:** `direct:` Three triplicated builders at [slot-animations.ts:44-176](src/components/answer-game/Slot/slot-animations.ts#L44-L176) (`triggerEjectReturn`), [useTouchDrag.ts:12-82](src/components/answer-game/useTouchDrag.ts#L12-L82) (`buildGhost`), and [useSlotTileDrag.ts:73-132](src/components/answer-game/useSlotTileDrag.ts#L73-L132) (`onGenerateDragPreview`) all clone `innerHTML`, snapshot `getComputedStyle(source).{background, boxShadow, fontSize}`, and compute parent-transform visual-scale compensation. Each is ~50 lines of identical ceremony. `external:` dnd-kit's [DragOverlay docs](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) explicitly recommend the "presentational component" pattern as the canonical solution: same JSX in board and overlay, skin tokens cascade by construction.

**Rationale:** Answers the user's question "is there a reason ghosts look different?" with: no, they look the same now (PR #358's lockstep fixes), but the code is triplicated and there's no skin-author seam for "ghost during error-shake should glow red, ghost during drag should be subtle." Same-component portal removes the ceremony, makes the seam declarative, and lets the skin's `tileDecoration` automatically apply to the ghost — no globally-scoped class hack.

**Downsides:** The portal must propagate skin context — the overlay must live INSIDE the `.skin--<id>` wrapper, or carry the wrapper class on its mount point. dnd-kit-shaped overlays require some replumbing of the eject animation (which today is a `transform: translate(x,y)` on a fresh ghost, not a real drag); we'd implement eject as a "synthetic drag" through the same overlay.

**Confidence:** 75%
**Complexity:** High — biggest refactor of the set, but it's also the answer to the ghost question.

**Status:** Unexplored

---

### 4. DOM as state machine: `data-tile-state` attribute + scoped skin stylesheet

**Description:** Engine sets `data-tile-state="empty|correct|wrong|wrong-shake|bank-reject"` on the tile/slot element. Skins ship CSS rules keyed on `[data-tile-state="wrong-shake"]` — attribute selectors, not class swaps. Bank-reject becomes a state (set the attribute, CSS does the rest), not an imperative `flashBankTileRejectFeedback` JS animation. Engine continues to inline INPUTS (palette, motion durations) via `style={skin.tokens}`; state DERIVATIONS resolve via attribute-selector CSS so they can be overridden by `.skin-dragon-cave [data-tile-state="wrong"] { … }` without `!important`.

**Warrant:** `direct:` `bank-tile-reject-feedback.ts` is 90 lines of "snapshot inline → mutate → restore on `animationend`" choreography that exists only because state isn't a public attribute. `external:` Radix UI and shadcn/ui both use `data-state` on elements with CSS attribute-selectors as the canonical pattern; `:has()` and attribute selectors have full modern-browser support. `direct:` Memory `feedback_storybook_controls.md` documents project's preference for declarative state over imperative DOM mutation.

**Rationale:** Solves the `!important` arms race structurally. Today the cascade is **against** the skin author (inline styles win); tomorrow the cascade is **with** them (skin's stylesheet beats default attribute rules on equal-specificity ground). Bank-reject converges into the normal state machine. Storybook stories can demo every state by toggling the attribute in args.

**Downsides:** Requires migrating every `Slot`/`Tile` `wrongStyle`/`correctStyle` shard to an attribute pattern. The dark-mode-bug lesson means we still inline palette tokens — only state-DERIVATIONS move to CSS. Needs care in tests that assert specific inline styles to not regress.

**Confidence:** 82%
**Complexity:** Medium-High
**Status:** Unexplored

---

### 5. System-alias layer + tokenized motion vocabulary

**Description:** Three-tier cascade. **Leaves**: `--bs-primary`, `--bs-destructive`, `--bs-motion-shake` etc. on `:root`. **System aliases**: `--system-tile-correct-paint`, `--system-tile-wrong-paint`, `--system-tile-wrong-shake-motion` etc. — the engine reads these. **Skin overrides**: `--skin-tile-correct-paint` etc. set inline by the active skin. System aliases resolve `var(--skin-…, var(--bs-…))` — skin wins when present, theme leaves provide fallback. Plus a **motion vocabulary**: `--bs-motion-shake`, `--bs-motion-pop`, `--bs-motion-glow`, `--bs-motion-pulse` — five named animations registered globally; motion tokens reference them by name (`--skin-tile-wrong-shake-motion: var(--bs-motion-shake)`).

**Warrant:** `external:` Spectrum CSS's `--system-*` alias layer ([Spectrum migration wiki](https://github.com/adobe/spectrum-css/wiki/Migrating-a-component-to-Spectrum-Tokens)) is the production precedent for "override one alias, retheme a family." `external:` Polaris motion tokens ([Polaris motion docs](https://polaris-react.shopify.com/tokens/motion)) — `--p-motion-keyframes-*` are tokenized identifiers; `prefers-reduced-motion` can swap the vocabulary in one place.

**Rationale:** Compounds across the 10+ skins on the roadmap. Dark mode becomes a palette swap at the alias layer (one place). A11y audits run against ~20 system aliases, not the union of every skin's leaf overrides. `prefers-reduced-motion` collapses the motion vocabulary at the leaf layer — the entire system inherits.

**Downsides:** Adds a layer of indirection that's invisible until you debug it (`var(--system-…)` resolves through skin → theme → initial-value). DevTools experience worsens slightly unless we ship the dark-mode-style debug helper to dump resolved tokens.

**Confidence:** 85%
**Complexity:** Low-Medium (additive; doesn't require migrating consumers if we keep the existing `--skin-*` names as aliases pointing at the system layer)
**Status:** Unexplored

---

### 6. Visual-state matrix story + skin scaffolder

**Description:** Two paired tooling moves. **Matrix story:** one `SkinStateMatrix.stories.tsx` per game renders every (tile state × registered skin × game-context) cell on one canvas — empty/correct/wrong/wrong-shake/bank-reject × classic/dragon-cave × WordSpell. This becomes the canonical VR baseline for the skin system; a single Playwright screenshot diff catches any token or decoration regression across the whole matrix. **Scaffolder:** `yarn skin:new <game> <skin-id>` scaffolds a compliant skin from a JSON template + asset paths — `<skin-id>.tokens.json` (Partial<SkinTokens>), a registry entry, a Storybook story stub, asset-path placeholders. Skins compose from a strict shape; the scaffolder enforces conventions (story title PascalCase, file paths, test isolation) so quality stays consistent across the 10+ skins on the roadmap.

**Warrant:** `direct:` `STRATEGY.md` lists "collectables system (19 unlockable characters)" as a track — manually scaffolding 19 skins is friction. Project memory `project_skin_rollout.md` notes the system already propagates to WordSpell + NumberMatch. `reasoned:` Per-component VR scales O(components × skins); a matrix scales O(games). Cheap, durable leverage.

**Rationale:** This work is what makes the previous five ideas compound. Without a matrix story, every skin change becomes a manual VR review; without a scaffolder, the conventions decay across 10+ skins. With them, adding the 20th skin becomes "fill in a JSON file, regenerate stub, ship."

**Downsides:** Pure overhead until the second non-classic skin lands — the value is in the next 10 skins, not this one. Can be deferred if PR #375 needs to ship fast.

**Confidence:** 88%
**Complexity:** Low (additive tooling; doesn't touch the engine)
**Status:** Unexplored

## Recommended Slice for PR #375

Lockstep adoption is too big for one PR. Suggested split:

1. **Land in PR #375**: S1 (composite paint tokens, the slim subset Dragon Cave actually needs), S2 (Object Style decomposition for wrong + wrong-shake — the only states that hit the hack today), S4 (data-tile-state attribute + scoped CSS for those two states only). This is what un-hacks Dragon Cave and proves the pattern on one skin.
2. **Follow-up PR (still on #359)**: S3 (same-component portal'd ghost) — biggest change, deserves its own review window. Today's ghosts are NOT broken; this is a structural cleanup.
3. **Follow-up PR**: S5 (system-alias layer) — additive; doesn't change observable behavior. Best landed once two skins exist so the alias surface can be inferred from real overrides.
4. **Defer**: S6 (matrix + scaffolder) — value compounds with skin count, not blocking #375.

## Cross-spec alignment: Spec 1a (Instructions + TTS Lifecycle)

[Spec 1a — 2026-05-03-instructions-tts-lifecycle-design.md](../superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md) defines 11 canonical lifecycle events on the existing `GameEventBus`: `game.prepare / game.start / game.resume / round.start / round.idle / round.error / round.correct / round.celebrate / round.advance / level.complete / game.over`. **The lifecycle work and this skin-token work are the same engine wiring viewed from two angles.** Spec 1a says "when each moment happens and what's spoken"; this doc says "how each moment looks."

Key alignments:

- **S4 is validated by independent convergence.** Spec 1b §12 plans `data-speaking="true"` on tile elements with skin tokens reading the attribute (`--skin-tile-speaking-{bg,fg,outline}`). That is S4's pattern, applied to one state. We should ratify it as the system-wide pattern in this PR so Spec 1b ships into a coherent shape.
- **Round/game-state vs tile-scoped state are orthogonal.** A tile can simultaneously be `data-tile-state="wrong"` (driven by `round.error`) AND `data-speaking="true"` (driven by `round:tts-played`). Two attributes, not one multi-value enum. Spec 1b's choice is correct.
- **S5's motion vocabulary needs a "speaking pulse" entry** so the speaking state composes cleanly with `prefers-reduced-motion`.
- **One missing piece both proposals share: tile-scoped lifecycle events.** Spec 1a only emits round/game-level events on the bus. For pickup (drag-start) and Spec 1b's `useExplainSequence` per-tile highlighting, the engine needs `tile:pickup`, `tile:drop`, `tile:speak-start`, `tile:speak-end` on the bus. This is additive to Spec 1a's event surface — a small new section in the implementation plan.

Implication for the recommended slice:

- **PR #375 should align with Spec 1a's M1 milestone** so the `data-tile-state` attribute is written by the same lifecycle subscriber that Spec 1a is wiring. One subscriber, one source of truth.
- **Token shape for the "speaking" state should follow S1+S2** — if those land first, Spec 1b ships into the appearance/motion/decoration triplet shape; if Spec 1b lands first, we absorb its 3 leaf tokens during the S1+S2 refactor.

## Rejection Summary

| #    | Idea                                               | Reason Rejected                                                                       |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| F1.6 | Skin diff-cap linter                               | Premature — set the budget after S1/S2 stabilize the token surface                    |
| F1.7 | Drop inline tileStyle() to global stylesheet       | Subsumed by S4 (cascade-native architecture solves the specificity war structurally)  |
| F1.8 | XState skin-state machine                          | Conflates with in-flight XState migration; revisit once XState lands                  |
| F1.2 | Globally-scoped tile-decoration as first-class API | Subsumed by S3 — same-component ghost removes the "must be globally scoped" invariant |
| F2.1 | Adopt dnd-kit DragOverlay wholesale                | Subsumed by S3's lighter "same component, portal"                                     |
| F2.2 | Skins own the Tile component entirely              | Throws away the token surface that works for classic; over-corrects                   |
| F2.6 | Collapse tile/slot decoration into renderCell      | Worth discussing but not a 10x win; defer until S4 ships                              |
| F2.8 | Delete GameSkin entirely                           | Subject-replacement (abandons skinning)                                               |
| F3.3 | Skin as reducer plugin (invent state vocab)        | Out of scope per Phase 1 visual-only constraint                                       |
| F3.4 | Tokens as functions of continuous signals          | Over-engineered for current needs                                                     |
| F3.5 | Behavior as token                                  | Explicitly out of Phase 1 scope                                                       |
| F3.6 | Slot owns visual state, tile is payload            | Real insight but invasive; partially absorbed into S4                                 |
| F3.7 | Skins as Web Components                            | Framework swap; too radical                                                           |
| F3.8 | Theme + Personality split                          | Compelling but adds API surface; revisit when collectables ships                      |
| F4.1 | Token codegen with TS types                        | Subsumed by S5 (typed alias layer) + S1 (`@property` registration)                    |
| F4.7 | Per-game skin manifest                             | Useful but separate concern                                                           |
| F4.8 | Per-token a11y rubric                              | Compounds with S1+S5 but as follow-up tool, not blocking                              |
| F5.1 | Audio bus matrix                                   | Maps to S5 functionally; analogy adds no mechanism                                    |
| F5.2 | Pixar USD LayerStack                               | CSS dev tools already show cascade                                                    |
| F5.3 | Theatre cue stacks                                 | Subsumed by S2 (motion block) + S5 (motion vocabulary)                                |
| F5.6 | Synth modulation matrix                            | Subsumed by S2 (appearance/motion/decoration axes)                                    |
| F5.8 | Restaurant brigade station notes                   | Subsumed by S2 (named extension points)                                               |
| F6.1 | JSON-only skins                                    | Future leverage once S1+S2 contract is stable                                         |
| F6.3 | Strict 5-state contract, no escape hatch           | Too rigid; render-prop escape hatches are load-bearing                                |
| F6.6 | Per-state skin mixing                              | Future; cleanly enabled by S1+S4 but not for PR #375                                  |
| F6.7 | Engine-generated decorations                       | Too restrictive for irregular shapes (Dragon Cave)                                    |
| F6.8 | Skin on `body`, not game-instance                  | Game-scoped is intentional for multi-game                                             |

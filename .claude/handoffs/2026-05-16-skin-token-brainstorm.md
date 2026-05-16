# Handoff: Skin Token Surface Brainstorm

**Date:** 2026-05-16
**Branch:** feat/multi-skin-config
**Worktree:** worktrees/feat-multi-skin-config
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
**Git status:** clean, in sync with origin
**Last commit:** d4c23d976 docs(ideation): skin token surface + tile customization catalog
**PR:** [#375](https://github.com/leocaseiro/base-skill/pull/375) — OPEN
**Issue:** [#359](https://github.com/leocaseiro/base-skill/issues/359) — OPEN (body updated this session to reflect broadened scope)

## Resume command

```text
/resync
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
/ce-brainstorm  # seed with the ideation doc; goal: concrete token names + state enum + migration sequence
```

## Current state

**Task:** Unified skin token surface + drag-ghost consolidation for PR #375, Dragon Cave as canary skin.
**Phase:** transitioning ideation → brainstorm (this is the handoff to the new session)
**Progress:** Two ideation docs committed; issue #359 body updated; 5 scoping decisions locked; ready for design dialogue on actual token names.

## What we did

Ran `/ce-ideate` to produce a 6-survivor ranked design (S1–S6) plus an 83-surface customization catalog (54% tokenized, 46% hardcoded). Walked the scoping decisions section-by-section per `feedback_section_by_section_review.md`: pickup state in, all 5 dead tokens wired, all 6 animations tokenized (combined with fixing Dragon Cave shake bugs), haptics deferred (separate GH issue end of brainstorm), gentle-return skipped (no primary source). Updated issue #359 body to reflect broadened scope and link the ideation docs. Deferred PR vs Spec 1a M1 landing strategy to brainstorm.

## Decisions made

- **Dark mode removal** — yes, separate PR after #375 lands. Competitors don't ship it (Endless Alphabet, Khan Kids, Lingokids, ABCmouse, Duolingo ABC verified). Architectural lesson survives via `prefers-reduced-motion` and future `prefers-contrast`. (Spawned task chip already filed for next session.)
- **Pickup state in scope** — `tile:pickup` / `tile:drop` lifecycle events plus `data-tile-state="pickup"`. Engine dispatches `SET_DRAG_ACTIVE` today but doesn't broadcast on the bus. Adding broadcast unlocks future skins reacting to drag-start.
- **All 5 dead tokens wired in #375** — `--skin-tile-active-scale`, `--skin-hud-padding`, `--skin-question-bg/-text/-radius`, `--skin-slot-active-border`, `--skin-question-audio-bg/-fg`.
- **All 6 animations tokenized in #375** — shake / pop / pulse-ring / blink / eject-fly / eject-fade. Combined with fixing Dragon Cave shake bugs the user mentioned ("missing shakes ones that are not working as expected in dragon cave" — specifics still to enumerate).
- **Haptics deferred** — file a GH issue once brainstorm produces the per-state haptic taxonomy. Target: mobile browsers only (touch-device detection); skip desktop.
- **Gentle-return mode skipped** — couldn't cite a primary source for the pattern. The web-research claim attributing it to Toca Boca was unverified; user installed Endless Alphabet + Endless Learning Academy and confirmed both DO emit a wrong-feedback sound, contradicting the framing. Lesson: hedge web-research-derived claims unless primary-source verified.
- **S4 (data-tile-state attribute) validated by independent convergence** — Spec 1b §12 ([2026-05-03-instructions-tts-lifecycle-design.md](https://github.com/leocaseiro/base-skill/blob/master/docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md)) plans `data-speaking="true"` + `--skin-tile-speaking-{bg,fg,outline}` tokens. That's the S4 pattern applied to one state. Round/game state and tile-scoped state are orthogonal; two attributes, not one.
- **PR #375 vs Spec 1a M1 landing strategy — DEFERRED** to brainstorm. Both share the same engine bus subscriber path. Options on the table: sequence, co-merge, independent-with-shared-contract.

## Working notes / Ideation docs

- **Ideation (6 survivors):** [docs/ideation/2026-05-15-skin-token-surface-and-ghost-consolidation-ideation.md](https://github.com/leocaseiro/base-skill/blob/feat/multi-skin-config/docs/ideation/2026-05-15-skin-token-surface-and-ghost-consolidation-ideation.md)
- **Catalog (83 surfaces + missing states):** [docs/ideation/2026-05-15-tile-customization-surface-catalog.md](https://github.com/leocaseiro/base-skill/blob/feat/multi-skin-config/docs/ideation/2026-05-15-tile-customization-surface-catalog.md)
- **Spec 1a (TTS lifecycle, parallel work):** docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md
- **Skin foundation:** docs/superpowers/specs/2026-04-13-game-skin-system-design.md
- **Skin Rollout P2 (compositional spread pattern):** docs/superpowers/specs/2026-04-15-skin-rollout-p2-design.md
- **Multi-skin config (current branch's spec):** docs/superpowers/specs/2026-05-13-multi-skin-config-design.md

## The 6 ideation survivors (recap for brainstorm seed)

- **S1** — Composite paint tokens per state + `@property` typed fallback. One token per state instead of 4 paired sub-tokens. Conf 80% / Cx M.
- **S2** — Object Style decomposition (appearance / motion / decoration). Three orthogonal axes per state. Conf 78% / Cx M.
- **S3** — Same-component portal'd ghost (no clone). Tile and ghost are the same React subtree. Conf 75% / Cx H.
- **S4** — `data-tile-state` attribute + scoped skin stylesheet. **Validated by Spec 1b §12.** Conf 82% / Cx M-H.
- **S5** — System-alias layer + tokenized motion vocabulary. Three-tier cascade + named keyframes. Conf 85% / Cx L-M.
- **S6** — Visual-state matrix story + `yarn skin:new` scaffolder. Tooling layer. Conf 88% / Cx L.

Recommended slice for PR #375: S1 + S2 + S4 trio first. S3 ghost refactor as follow-up PR. S5 additive once two skins exist. S6 tooling once skin count > 2.

## Key files

- src/lib/skin/classic-skin.ts — 70+ tokens declared; canonical reference
- src/lib/skin/game-skin.ts — `GameSkin` contract: `{ id, name, tokens, tileDecoration?, slotDecoration?, SceneBackground? }`
- src/games/word-spell/skins/dragon-cave-skin.tsx:418-491 — `!important` paint-strips + one-off shake-emphasis hack (`ba958ccfe`)
- src/games/word-spell/skins/dragon-cave-skin.tsx:481-486 — the specific shake-emphasis rule S2 (Object Style decomposition) replaces
- src/components/answer-game/Slot/Slot.tsx — spreads `{base, correct, wrong, preview, style}` per Skin Rollout P2 discipline; data-state pattern hooks here
- src/components/answer-game/Slot/useSlotBehavior.ts:280-320 — `triggerShake(el)` on wrong-tile placement; where the engine writes future `data-tile-state`
- src/components/answer-game/Slot/slot-animations.ts:44-176 — `triggerEjectReturn` (ghost call site #1)
- src/components/answer-game/useTouchDrag.ts:12-82 — `buildGhost` (ghost call site #2)
- src/components/answer-game/useSlotTileDrag.ts:73-132 — HTML5 `onGenerateDragPreview` (ghost call site #3)
- src/components/answer-game/bank-tile-reject-feedback.ts — 90 lines of imperative animation that S4 replaces
- src/styles.css — 6 hardcoded animation keyframes (shake / pop / pulse-ring / blink / eject-fly / eject-fade) that get tokenized
- src/components/answer-game/styles.ts:3-12 — inline `tileStyle()` that creates the `!important`-arms-race with skins

## Open questions / blockers

- [ ] **Concrete token names.** S1 says "composite paint tokens per state" but doesn't pick the names. Brainstorm output should be the canonical name list (proposed shape: `--skin-tile-{state}-{appearance|motion|decoration}-*`).
- [ ] **State enum ratification.** Full list candidate: `empty`, `placed-correct`, `placed-wrong`, `wrong-shake`, `bank-reject`, `pickup`. Plus orthogonal attribute `data-speaking="true"`. Anything missing?
- [ ] **Dragon Cave shake bug enumeration.** User said "missing shakes ones that are not working as expected in dragon cave" — specific bugs not listed. Brainstorm should either start with the enumeration or hand off to /ce-plan for the listing.
- [ ] **PR #375 vs Spec 1a M1 landing.** Three options: sequence (you decide order), co-merge (big single PR), independent-with-shared-contract. Decide after concrete subscriber shape pins down.
- [ ] **Migration sequence inside PR #375.** Of S1+S2+S4 trio, which lands first? What's the rollout for Classic vs Dragon Cave?
- [ ] **Haptic taxonomy.** Once brainstorm pins it, file a GH issue for the deferred work.

## Next steps

1. [ ] Open a fresh Claude Code session in `/Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config/`
2. [ ] `/resync`
3. [ ] `/ce-brainstorm` seeded with the ideation doc — goal: token names + state enum + migration sequence
4. [ ] After brainstorm: `/ce-plan` for execution phasing of the S1+S2+S4 trio
5. [ ] Land PR #375 with the bounded scope
6. [ ] File the haptic taxonomy GH issue (output of brainstorm)
7. [ ] Pick up the spawned task chip (dark-mode removal) after #375 merges

## Context to remember

- **User has ADHD.** Section-by-section reviews with mandatory `[Q-§X.Y.ack]` AskUserQuestion per section. Recaps on resume (3 bullets: you were here / we decided / → Next). Clickable markdown links inside the worktree; plain code-block paths for outside-worktree files (`.claude/`, `~/.claude/`).
- **User prefers `/ce-*` skills over superpowers equivalents.** ce-ideate output shape (warrant-tagged ideas + rejection log) is the model brainstorm should mirror.
- **Commits = review checkpoints.** Commit often. Push freely for features; confirm before push for bug fixes. The Dragon Cave shake-bug fixes count as bug fixes → confirm before pushing those.
- **Worktree convention:** `<project-root>/worktrees/<branch>/`. NEVER `.claude/worktrees/<slug>/` — those trigger un-overridable permission prompts.
- **TDD strict for bug fixes** (Dragon Cave shake bugs qualify). Write failing test before touching production code. No bug-fix PR without a regression test.
- **After any `.md` edit, run `yarn fix:md`** before committing.
- **Web-research claims need primary-source verification.** This session caught one fabrication (gentle-return attributed to Toca Boca; user verified by installing the apps). Assume similar weakness on other web-research-derived facts in the catalog (Endless Alphabet pickup-transform, Duolingo "GOT IT" CTA, spring physics on correct) until verified.
- **`feedback_section_by_section_review.md`** is the user's preferred review flow. Every section ends with `[Q-§X.Y.ack]` even when no findings. 4-Q hard cap means split across turns.
- **AskUserQuestion padding rule** (CLAUDE.md): end text with `---` followed by two blank lines before calling AskUserQuestion; the input overlay obscures the last ~2 lines.
- **Spawned task pending** (chip 1): Remove dark mode from BaseSkill — after PR #375 lands. Includes the full motivation, surfaces to touch, verification commands, and user preferences. User has it queued and can start it any time.

# Handoff: Skin Token Architecture — Requirements Review

**Date:** 2026-05-16
**Branch:** feat/multi-skin-config
**Worktree:** worktrees/feat-multi-skin-config
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
**Git status:** clean, 2 commits ahead of origin
**Last commit:** 68572a0e4 docs(brainstorm): unified skin token architecture requirements
**PR:** [#375](https://github.com/leocaseiro/base-skill/pull/375) — OPEN
**Issue:** [#359](https://github.com/leocaseiro/base-skill/issues/359) — OPEN

## Resume command

```text
/resync
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
/ce-doc-review docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md
```

After review completes:

```text
/ce-plan docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md
```

## Current state

**Task:** Unified skin token architecture for PR #375.
**Phase:** Brainstorm complete → requirements doc written → pending doc review then planning.
**Progress:** Requirements doc committed. Ready for ce-doc-review, then ce-plan.

## What we did

Ran `/ce-brainstorm` seeded with the ideation doc. Resolved three deliverables
through collaborative dialogue:

1. **State enum:** Hybrid — 6 primary states (empty, correct, wrong, reject,
   pickup, ejecting) + 3 orthogonal modifiers (data-shaking, data-speaking,
   data-drag-over).
2. **Token naming:** `--skin-tile-{state}-{property}` kebab-case pattern. No
   BEM for CSS custom properties.
3. **Migration sequence:** Phase 1 = token definition + cross-game migration;
   Phase 2 = Dragon Cave refactor (blocked by Phase 1).

Also discovered and documented:

- Bank-reject is invisible in Dragon Cave (root cause: shared wrong tokens set
  to transparent)
- Lock-manual mode has no fly-back animation (tiles just disappear)
- SortNumbers has stale `isCustomSkin` branch
- NumberMatch bank tiles missing `skin` prop / `tileDecoration`
- Slot.tsx has a `correctStyle` bug (line 108: uses `--skin-correct-border` for
  `color`)

## Decisions made

- **Hybrid state enum over composed:** Bank-reject and slot-wrong get separate
  token namespaces. Shared shake motion is a modifier attribute.
- **Kebab-case tokens:** `--skin-tile-{state}-{property}`, not BEM.
- **XState drives animation sequencing:** Engine owns timers, broadcasts state
  changes, CSS reacts. Replaces imperative animationend chains.
- **Lock-manual gets fly-back animation:** Both manual and auto eject route
  through same XState `ejecting` state.
- **Full game UI scope:** @property inheritance covers all namespaces
  (tile/slot/hud/chrome/question/scene/bank).
- **Token rename is breaking:** `--skin-correct-bg` → `--skin-tile-correct-bg`.
  No backwards-compat shim.
- **Phase 1 before Dragon Cave:** Token infra + game migration first. DC
  refactor is blocked and has more issues (fullscreen, etc.).

## Key files

- docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md —
  the requirements doc to review
- docs/ideation/2026-05-15-skin-token-surface-and-ghost-consolidation-ideation.md —
  ideation doc (6 survivors)
- docs/ideation/2026-05-15-tile-customization-surface-catalog.md — 83-surface
  catalog
- src/lib/skin/classic-skin.ts — current 70+ token baseline
- src/lib/skin/game-skin.ts — GameSkin contract
- src/games/word-spell/skins/dragon-cave-skin.tsx — DC overrides + CSS hacks
- src/components/answer-game/Slot/Slot.tsx — state styling + correctStyle bug
- src/components/answer-game/bank-tile-reject-feedback.ts — imperative DOM
  surgery to replace
- src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx — stale
  isCustomSkin branch
- src/games/number-match/NumeralTileBank/NumeralTileBank.tsx — missing skin prop

## Open questions (deferred to planning)

- Exact keyframe token shape: full animation shorthand vs decomposed
  name/duration/easing?
- How does XState read CSS custom property values for timer durations? JS bridge
  or hardcoded in machine config?
- Which chrome/overlay/question tokens need data-state attributes vs
  appearance-only inheritance?

## Next steps

1. [ ] Open a fresh session in the feat-multi-skin-config worktree
2. [ ] `/resync`
3. [ ] `/ce-doc-review` on the requirements doc — fix coherence/feasibility
       issues
4. [ ] `/ce-plan` using the reviewed requirements doc — produce implementation
       plan for Phase 1
5. [ ] Execute Phase 1: token definition + cross-game migration
6. [ ] File haptic taxonomy GH issue (output of brainstorm, deferred)

## Context to remember

- **User has ADHD.** Section-by-section reviews, recaps on resume, clickable
  links inside worktree, plain paths outside.
- **Commits = review checkpoints.** Commit often, push freely for features.
- **TDD strict for bug fixes.** Dragon Cave shake bugs, bank-reject
  invisibility, lock-manual missing animation — all need failing tests first.
- **Worktree convention:** `<project-root>/worktrees/<branch>/`.
- **After any `.md` edit, run `yarn fix:md`** before committing.
- **Full game UI scope confirmed.** Not just tiles — chrome, overlays, question
  area, HUD all get @property inheritance.
- **XState-first.** Animation sequencing via engine state machine, not
  imperative JS chains.
- **PR #382 (TTS lifecycle) is independent.** Orthogonal attributes, no merge
  dependency.

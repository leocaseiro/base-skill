# Handoff: #343 SRS ship-cluster restructure — 10 tracking issues + Initiative milestone + Spec Delta

**Date:** 2026-05-13
**Status:** Done. Awaiting next-session plan work.
**Type:** Brainstorm + tracking-issue setup + design-doc Spec Delta.
**Initiative:** [#343 — Spec 1a M1 ship cluster](https://github.com/leocaseiro/base-skill/issues/343)

## What this session did

Restructured the `#343` ship cluster from "one big tracking issue + an implicit dependency chain" into a GitHub-native graph: **Initiative → Milestones → deliverable Issues**, with `sub-issue` parent links and `blocked-by` dependency edges expressed via GitHub Relationships (the August 2025 feature). Also corrected a design-doc claim that had implied SRS v1 was blocked on Phase 2; it isn't, because SRS v1 is WordSpell-only per its spec.

### Brainstorm outcome (Approach B — SRS-parallel)

Three approaches considered:

- **A. Linear chain** (handoff-literal). PR 1c → PR 1d → Phase 2 → SRS v1.
- **B. SRS-parallel** (chosen). PR 1c (engine cleanup) and SRS v1 (WordSpell) run on independent worktrees from day one. Phase 2 stays in the roadmap as the enabler for SRS v1.5 (multi-game adapters), not as a v1 blocker.
- **C. SRS-first** (paused engine cleanup). Rejected — engine cleanup ages and merge friction compounds.

Rationale: SRS v1 is **WordSpell-only** per `docs/superpowers/specs/2026-05-01-srs-v1-design.md` line 91. WordSpell is already XState-driven post-PR 1b, so its `round:*` event emission can land via `assign` actions in WordSpell's machine — no reducer unification needed for v1. The "two-reducer split forces special-casing" rationale only applies to **multi-game** SRS scope (v1.5+).

This corrects a stronger claim in the engine design doc — Spec Delta committed in this branch (see "Spec Delta" section below).

## GitHub state after this session

### Initiative layer (parents, all in new "Initiative — Spec 1a M1 Ship Cluster" milestone, labelled `initiative`)

```text
#229  Initiative: Instructions + Text to Speech changes
#257  Initiative: Generalise Slot with mode='tap-select' + extract useGameRound hook
#343  Initiative: Spec 1a M1 ship cluster — #229 + #257 + SRS v1 + #300
       └─ 10 deliverable sub-issues (see below)
```

### Deliverable issues (10 new, all sub-issues of `#343`)

```text
#363  343-SRS-1   PR 1c — Reducer Removal & Cleanup                          [P1 — Game Engine Phase 1 Cleanup]
#364  343-SRS-2a  SRS v1 — WordSpell implementation                          [P1 — SRS v1 — WordSpell]
#365  343-SRS-2b  M1 — TTS Lifecycle UX (resume PR #349)                     [Spec 1a M1]
#366  343-SRS-2c  Custom Game Options preset picker (#300)                   [P1 — Custom Game Options preset picker (#300)]
#367  343-SRS-3   CelebrationHost — engine foundation + answer-game migration[P1 — Game Engine Phase 1 Cleanup]
#368  343-SRS-4   PR 1d — SpotAll engine integration + celebration migration [P1 — Game Engine Phase 1 Cleanup]
#369  343-SRS-5   Phase 2 — Reducer Unification                              [P2 — Game Engine Phase 2 Unification]
#370  343-SRS-6a  SRS v1.5 — SortNumbers adapter                             [P3 — SRS v1.5 — Multi-game adapters]
#371  343-SRS-6b  SRS v1.5 — NumberMatch adapter                             [P3 — SRS v1.5 — Multi-game adapters]
#372  343-SRS-6c  SRS v1.5 — SpotAll adapter                                 [P3 — SRS v1.5 — Multi-game adapters]
```

### Blocked-by dependency edges (set via GitHub Relationships)

```text
#367 blocked-by #363                                  (CelebrationHost needs PR 1c done)
#368 blocked-by #367                                  (PR 1d needs CelebrationHost)
#369 blocked-by #368                                  (Phase 2 needs PR 1d)
#370 blocked-by #369, #364                            (SortNumbers SRS needs Phase 2 + SRS v1)
#371 blocked-by #369, #364                            (NumberMatch SRS needs Phase 2 + SRS v1)
#372 blocked-by #369, #364, #368                      (SpotAll SRS needs Phase 2 + SRS v1 + PR 1d)
```

Unblocked at session end: `#363`, `#364`, `#365`, `#366`. These four can all start in parallel.

### Milestones (9 total: 1 initiative + 1 closed + 1 existing + 6 new with P1/P2/P3 prefixes)

```text
#9 Initiative — Spec 1a M1 Ship Cluster      → #229, #257, #343
#1 Spec 1a M1 — Minimum TTS copy fix         → #365            (description refreshed)
#2 Spec 1a M2 — Lifecycle vocabulary + registry (CLOSED — Spec-Delta'd into GameDefinition.tts)
#3 P1 — Game Engine Phase 1 Cleanup          → #363, #367, #368
#4 P2 — Game Engine Phase 2 Unification      → #369
#5 P1 — SRS v1 — WordSpell                   → #364
#6 P3 — SRS v1.5 — Multi-game adapters       → #370, #371, #372
#7 P1 — Custom Game Options preset picker (#300) → #366
#8 P2 — Mini-games Phase 1 Integration       → #313, #317, #319
```

### Closed cleanup (superseded children of #257)

```text
#260 (WordSpell adopt useGameRound)   — superseded by PR 1b (#357 + #360)
#261 (NumberMatch adopt useGameRound) — superseded by PR 1a (#355)
#262 (SortNumbers adopt useGameRound) — superseded by PR 1b (#357 + #360)
```

The `useGameRound` hook itself was Spec-Delta'd to XState in PR #354.

### Mini-game work re-milestoned

`#313` (DinoEggHatch), `#317` (FireworksPainter), `#319` (mini-game catalogue) → assigned to the new `P2 — Mini-games Phase 1 Integration` milestone. They rebase onto `CelebrationHost` once `#367` (343-SRS-3) lands.

## Spec Delta committed in this branch

Branch `docs/spec-delta-srs-cluster-roadmap` contains one commit on top of `master`:

- `docs(engine): add Spec Delta — SRS v1 (WordSpell-only) is not blocked on Phase 2` — amends `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` to:
  - Soften the "SRS v1 is hard-blocked on Phase 2" claim to "SRS v1.5 (multi-game) is blocked on Phase 2; SRS v1 (WordSpell-only) is not."
  - Add an explicit `#### Spec Delta — SRS v1 scope clarification (2026-05-13)` block.
  - Mark two prior Open Questions as resolved: "Do-nothing baseline weakly defended for Phase 2" (P3, FYI) and "SRS v1 timeline opportunity cost is undersized" (P1).

## What's next (start of next session)

**Most natural next concrete step:** open `#363` (343-SRS-1 — PR 1c) and run `superpowers:writing-plans` to produce its implementation plan. The PR 1c worktree already exists at `worktrees/feat-spec-1a-pr1c-reducer-removal/` on branch `feat/spec-1a-pr1c-reducer-removal`, tracking `origin/master`. Baseline tests passing (192 files / 1949 tests).

The gap analysis I produced earlier in this session surfaced two concerns the plan must resolve:

1. **SessionRecorderGate wiring gap.** `GameEngineContext.Provider` is declared in `useGameEngine.ts` but only wrapped in `useGameEngine.test.tsx` — production code never publishes the engine into the context. Plan must decide: (a) lift engine ownership to `GameEngineProvider`, (b) move `SessionRecorderGate` inside each game, (c) phase-reporter shim, or (d) defer the SessionRecorder migration to Phase 2 (design doc line 210 explicitly allows).
2. **Vestigial `useGameState` / `useGameDispatch`.** Zero production consumers; only the provider test reads them. Plan decides decouple-only vs. full removal.

Other unblocked starting points the next session could pick instead of `#363`:

- `#364` (343-SRS-2a — SRS v1 WordSpell) — also needs a plan. Independent worktree; doesn't touch PR 1c files. Spec is at `docs/superpowers/specs/2026-05-01-srs-v1-design.md`.
- `#365` (343-SRS-2b — M1 TTS Lifecycle UX) — resume PR #349 work. Most plan exists in `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`; needs a rebase check against current master.
- `#366` (343-SRS-2c — #300 Custom Game Options preset picker) — needs a spec first (use `superpowers:brainstorming`).

## How to land this branch

This branch (`docs/spec-delta-srs-cluster-roadmap`) contains the Spec Delta and this handoff. Open a PR against master, e.g.:

```bash
gh pr create --base master --head docs/spec-delta-srs-cluster-roadmap \
  --title "docs(engine): Spec Delta — SRS v1 not blocked on Phase 2 + session handoff" \
  --body-file /dev/stdin <<'PR'
## Summary

- Amend engine design doc Phase 2 section: SRS v1 is WordSpell-only per its spec; it does not require Phase 2 reducer unification. Phase 2 stays as the enabler for SRS v1.5.
- Resolve two prior Open Questions on the same claim.
- Add session handoff documenting the #343 cluster restructure into 10 tracking issues (#363–#372) under an Initiative milestone.

## Test plan

- [ ] yarn lint:md passes
- [ ] npx prettier --check . passes
- [ ] GitHub renders the Spec Delta block correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PR
```

Worktree at `worktrees/docs-spec-delta-srs-roadmap/` can be removed after merge:

```bash
git worktree remove worktrees/docs-spec-delta-srs-roadmap
```

## Sources

- Engine design doc: `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md`
- SRS v1 spec: `docs/superpowers/specs/2026-05-01-srs-v1-design.md`
- This handoff: `.claude/handoffs/2026-05-13-srs-cluster-roadmap-and-issues.md`
- Initiative milestone: <https://github.com/leocaseiro/base-skill/milestone/9>
- Cluster tracker: <https://github.com/leocaseiro/base-skill/issues/343>

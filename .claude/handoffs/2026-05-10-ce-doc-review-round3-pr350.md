# Handoff: ce-doc-review round 3 on PR #350 — alignment applied, per-reviewer Open Questions deferred

**Date:** 2026-05-10
**Branch:** docs/game-definition-design
**Worktree:** worktrees/docs-game-definition-design
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/docs-game-definition-design
**Git status:** clean
**Last commit:** 2745e070f docs(plan): append PR 1a adversarial reviewer open questions (round 3)
**PR:** #350 — OPEN — <https://github.com/leocaseiro/base-skill/pull/350>

## Resume command

```text
/resync
cd worktrees/docs-game-definition-design
# Triage the per-reviewer Deferred / Open Questions sections in each plan doc.
# Decide which findings must be fixed before PR #350 merges vs. which ship to follow-up PRs.
```

## Current state

**Task:** ce-doc-review round 3 on PR #350 (3 docs: design, TTS lifecycle, PR 1a plan)
**Phase:** review (cross-doc alignment applied; per-doc internal findings deferred for later triage)
**Progress:** Cross-doc alignment 100% complete (11/11 findings A1–A11 applied + pushed). Per-doc findings appended to each doc as Deferred / Open Questions per reviewer for later triage.

## What we did

Ran `ce-doc-review` with 14 persona reviewer agents (5 on TTS plan, 5 on design doc, 4 on PR 1a plan) plus 1 cross-doc alignment agent. Synthesized ~65 distinct findings (~28 actionable at anchor 75/100 + ~37 advisory FYI). Applied all 11 cross-doc alignment findings (A1–A11) across 2 commits via per-finding interactive walk-through. Appended remaining per-doc internal findings as Deferred / Open Questions per (reviewer × doc) pair across 13 more commits — one per reviewer per doc — for granular review later. Total: 15 commits, all pushed to PR #350. CI green.

## Decisions made

- **`lifecycle:speak` ownership = PR 1a Task 3 (not TTS plan Task 2)** — both plans previously assumed the other added it; consolidated ownership to PR 1a since it's the foundational types module. TTS plan now only adds `game:prepare`. Pre-flight rescue path removed from PR 1a Task 5. (A2)
- **PR 1d label introduced** for SpotAll (renamed from `Phase 1.b` / `PR 1.b`) and explicitly sequenced **after** PR 1c (no longer "optional parallel"). SpotAll waits until XState + GameDefinition stable across the 3 answer games. Per-PR short labels added: GameEngine Foundation / Answer Game Migration / Consolidation & Cleanup / SpotAll Refactor. (A7)
- **Celebration overlay mounting transfer scoped to PR 1c only** (not Phase 1 broadly). PR 1a Spec Delta 1 keeps mounting in NumberMatch.tsx; design doc updated to match. (A5)
- **`buildRound` is a passthrough in PR 1a** — added Spec Delta 6. NumberMatch's existing `buildNumeralRound` factory closure stays in the React component; engine sees only round index. PR 1b lifts construction into definition.ts once the 3 games' shapes are known. (A4)
- **`UseGameEngineResult.phase` widened to `string` in PR 1a** — added Spec Delta 7. Plan to define a shared `GamePhase` literal union in PR 1c once all 3 games' state names settle. (A10)
- **XState state names normalized to camelCase in design prose** (`roundComplete`, `levelComplete`, `gameOver`); legacy reducer's kebab-case strings are bridged via `useEffect`. (A8)
- **Design doc's NumberMatch sample annotated as fully-featured** (PR 1a omits `levelComplete` per Spec Delta scope). (A6)
- **Open Questions appended per (reviewer, doc), one commit each** for granular review by the user later.

## Spec / Plan

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` — design doc (revised; Open Questions section now contains 5 reviewer subsections under "Deferred from ce-doc-review round 3")
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — TTS lifecycle plan (revised; new "Deferred / Open Questions" section at end with 5 reviewer subsections — most extensive of the 3 docs)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md` — PR 1a implementation plan (revised; now has 7 Spec Deltas; new "Deferred / Open Questions" section at end with 3 reviewer subsections — no coherence subsection because all coherence findings consolidated into A2)

## Key files

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md:808` — design doc Open Questions section starts here; `### Deferred from ce-doc-review round 3` follows the original 2 OQs.
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — final section `## Deferred / Open Questions (ce-doc-review round 3, 2026-05-10)` (highest-density review surface).
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md` — final section `## Deferred / Open Questions (ce-doc-review round 3, 2026-05-10)` before the Self-Review Checklist.

## Open questions / blockers

The deferred findings are tracked inline in each doc — see the "Deferred / Open Questions" section at the end of each plan. Highest-impact ones to triage first:

- [ ] **PR 1a Feasibility F1: WordSpell/SortNumbers visual regression from `useGameSounds` gate removal** [P0, anchor 100] — real PR 1a blocker. Either defer gate removal to PR 1b (when all 3 games migrate together) or add explicit replacement code for WordSpell/SortNumbers in PR 1a Task 10.
- [ ] **PR 1a Feasibility F2: Engine `context.roundIndex` never increments** [P0, anchor 100] — engine context surface is dead in PR 1a. Either add `assign({roundIndex: ctx => ctx + 1})` action or document as Spec Delta 8.
- [ ] **PR 1a Feasibility F3: Architecture MDX files already exist on disk** [P1, anchor 100] — Task 11 says "Create" but files exist with substantive content. Change to "Modify" before implementer overwrites legacy lifecycle docs.
- [ ] **TTS Feasibility F1: `bus.subscribe()` returns a function, not an object with `.unsubscribe()`** [P0, anchor 100] — verified runtime bug; will throw on first hook unmount.
- [ ] **TTS Feasibility F3+F4: `gradeBand`/`talkativeness`/`currentWord`/`currentCount` not on `AnswerGameConfig`** [P0, anchor 100] — Talkativeness preset is structurally non-functional for any user not in grade k; interpolation strings come out empty (M1's central feature broken).
- [ ] **TTS Feasibility F7: RxDB settings schema migration missing for `ttsEnabled` rename** [P1, anchor 100] — without it, app fails to load existing user databases.
- [ ] **Design doc Feasibility F6: `GameEngineProvider` reads legacy reducer's `state.phase`** [P2, anchor 75] — XState declared source of truth in Phase 1, but session recorder logs the (stale) reducer phase.

## Next steps

1. [ ] Review the per-reviewer Deferred / Open Questions sections in each of the 3 plan docs (start with TTS plan — most under-reviewed in prior rounds).
2. [ ] Triage which findings must be addressed before PR #350 merges vs. which ship to follow-up PRs (PR 1a, PR 1b, PR 1c, PR 1d).
3. [ ] For findings that block implementation (especially the 7 listed above), update the plan in place rather than leaving in Deferred. Commit each fix individually so they're reviewable.
4. [ ] Once Deferred sections are triaged, push updated plans and refresh the PR #350 description.

## Context to remember

- **Two prior ce-doc-review rounds covered design doc + PR 1a plan only.** The TTS plan was under-reviewed in those rounds — that's why round 3 surfaced more correctness bugs in the TTS plan than in the others.
- **15 commits live on PR #350 from this session:**
  - 2 cross-doc alignment commits: `ff1b8fbb2` (A1–A6), `e73b6ef03` (A7–A11)
  - 5 TTS plan reviewer Open Questions commits (`43343c09a` coherence, `54c08ddf0` feasibility, `7da285c57` scope-guardian, `9befa2da9` adversarial, `c02be48eb` design-lens)
  - 5 design doc reviewer Open Questions commits (`f713cc2ca` coherence, `26a0dd50b` feasibility, `fdaf5121d` scope-guardian, `d11e93798` adversarial, `f0462257a` product-lens)
  - 3 PR 1a plan reviewer Open Questions commits (`40c226860` feasibility, `64a2cbab3` scope-guardian, `2745e070f` adversarial — no coherence subsection because all coherence findings consolidated into A2)
- **`SKIP_PREPUSH=1` was used on per-reviewer commits** — minor checkpoint commits during walkthrough; docs only, no code. Push triggered full CI which passed (vitest 42 tests).
- **Anchor convention:** anchor 75 = high confidence (implementer/reader concretely hits this); anchor 100 = airtight (evidence directly confirms). Anchor 50 (advisory FYI) findings are also captured but lower priority.
- **PR 1a now has 7 declared Spec Deltas** (was 5 at session start) — Spec Delta 6 (`buildRound` passthrough) and Spec Delta 7 (`UseGameEngineResult.phase: string` widening) added during this round.
- **All commits include a leading `SKIP_PREPUSH=1` line in body** explaining the bypass — per CLAUDE.md, skip-flags must be documented.

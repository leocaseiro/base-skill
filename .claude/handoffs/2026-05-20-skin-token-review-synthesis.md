# Handoff: Skin Token Requirements — Review Synthesis Pending

**Date:** 2026-05-20
**Branch:** feat/multi-skin-config
**Worktree:** worktrees/feat-multi-skin-config
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
**Git status:** clean, rebased onto origin/master (0 behind)
**PR:** [#393](https://github.com/leocaseiro/base-skill/pull/393) — OPEN
**Issue:** [#359](https://github.com/leocaseiro/base-skill/issues/359) — OPEN

## Resume command

```text
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
```

Then synthesize the review findings:

```text
Read .claude/review-findings/2026-05-20-skin-token-requirements-review-round1.json
```

Follow the ce-doc-review synthesis pipeline (Phases 3-5) from
`references/synthesis-and-presentation.md` in the ce-doc-review skill.

After synthesis + user walk-through:

```text
/ce-plan docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md
```

## Current state

**Task:** Unified skin token architecture for PR #393.
**Phase:** Review round 1 complete (6/6 agents returned) → synthesis pending →
then planning.
**Progress:** All 6 reviewer agents completed. 36 raw findings saved. Need
dedup, cross-persona agreement promotion, tier routing, safe_auto application,
and user walk-through.

## What we did this session

1. **Resync:** Fetched origin, discovered local branch was 1,527 behind master
   due to a force-push rebase on origin. Reset to origin/feat/multi-skin-config,
   then rebased remaining 7 docs/chore commits. Now 0 behind master.

2. **Dispatched 6 review agents** on the requirements doc:
   - ce-coherence-reviewer (6 findings)
   - ce-feasibility-reviewer (6 findings)
   - ce-product-lens-reviewer (6 findings)
   - ce-design-lens-reviewer (8 findings)
   - ce-scope-guardian-reviewer (4 findings)
   - ce-adversarial-document-reviewer (6 findings)

3. **Saved raw findings** to
   `.claude/review-findings/2026-05-20-skin-token-requirements-review-round1.json`

## Top findings (pre-synthesis)

### P0 — Architectural blocker

- **@property initial-value cannot contain var() references.** Classic skin
  tokens use var() extensively. The core inheritance mechanism (R1) cannot work
  as described. Flagged independently by feasibility + adversarial reviewers
  (confidence 100).

### P1 — High-impact issues (cross-persona agreement)

- **R5 contradicts R6:** "shared" shake vs. separate reject namespace.
  Coherence + product-lens + adversarial all flagged this.
- **Correct tile flow missing:** No key flow for the primary success path.
  Design-lens + product-lens both flagged.
- **pickup state undefined:** One of six enumerated states with no flow, no
  tokens, no AE. Design-lens (confidence 100).
- **R13 scope creep:** 7 namespaces claimed but only tile/slot exercised by
  flows, AEs, and success criteria. Coherence + product-lens + scope-guardian.
- **Dragon Cave token count wrong:** 21 actual (not 17+), 10 transparent (not
  4). Feasibility + adversarial (confidence 100).
- **XState dependency ambiguous:** Already exists for NumberMatch, Spec 1a
  introduces it for others. Unclear if this work is blocked.
- **answer-game uses useReducer not XState:** R8 requires XState for animation
  transitions, but current codebase uses imperative setTimeout + animationend.
- **R8 conflicts with bank-reject pattern:** bank-tile-reject-feedback.ts uses
  imperative DOM mutation + animationend restore. R8 says no animationend
  listeners.
- **lock-manual has no eject animation today:** R9 says both manual and auto
  route through ejecting XState state, but handleClick just dispatches
  REMOVE_TILE with no animation.
- **NumberMatch bank tiles gap larger than stated:** NumeralTileBank has no skin
  interface at all, different DOM structure. Not just prop threading.

### safe_auto candidates

- **F2 missing R5 in coverage list:** Scope guardian flagged; straightforward
  fix.
- **Dragon Cave token counts:** Update 17+ → 21, 4 → 10 in Problem Frame and
  Success Criteria.

## Git sync recipe (for other worktrees)

If a worktree's local branch is massively diverged from its remote (both ahead
AND behind by hundreds) after `git fetch` shows `(forced update)`:

```bash
# 1. Verify same commits exist on both sides (messages match, SHAs differ)
git log --oneline -5 HEAD
git log --oneline -5 origin/<branch>

# 2. If messages match → remote was rebased. Jump to it:
git reset --hard origin/<branch>

# 3. Pick up remaining master commits:
git rebase origin/master

# 4. Verify:
git rev-list --count HEAD..origin/master  # should be 0
```

## Related PRs

- **PR #393** — this branch's PR (feat/multi-skin-config Phase 1 + Dragon Cave)
- **PR #392** — docs corrections from #375 execution (7 inaccuracies found
  during implementation). Stacked on #393. These are implementation-level
  corrections, not requirements-level, but worth reading before planning.

## Decisions made this session

- Rebased onto origin/master (was 1,527 behind, now 0)
- PR #375 → #393 (PR number changed; title now includes "Phase 1 + Dragon Cave")

## Open questions (from prior handoff, still deferred)

- Exact keyframe token shape: shorthand vs. decomposed?
- XState ↔ CSS custom property bridge for timer durations?
- Which chrome/overlay/question tokens need state attributes?

## Next steps

1. [ ] New session: synthesize findings from the JSON (dedup, cross-persona
       agreement, tier routing)
2. [ ] Apply safe_auto fixes (F2 coverage list, token counts)
3. [ ] Walk user through gated_auto + manual findings
4. [ ] Run `yarn fix:md` on any doc changes
5. [ ] Commit doc updates
6. [ ] `/ce-plan` on the updated requirements doc
7. [ ] Execute Phase 1

## Context to remember

- **User has ADHD.** Section-by-section reviews, recaps on resume, clickable
  links.
- **Commits = review checkpoints.** Commit often, push freely for features.
- **TDD strict for bug fixes.** Dragon Cave bugs need failing tests first.
- **Worktree convention:** `<project-root>/worktrees/<branch>/`.
- **After any `.md` edit, run `yarn fix:md`.**
- **XState-first.** Animation sequencing via engine state machine.
- **PR #382 (TTS lifecycle) is independent.** No merge dependency.
- **Voice notifications** were toggled on this session.

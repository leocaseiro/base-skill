# Handoff: Fast-tap queue implementation (#276)

**Date:** 2026-05-01
**Branch:** 276-fast-tap-queue
**Worktree:** worktrees/276-fast-tap-queue
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/276-fast-tap-queue
**Git status:** clean
**PR:** #282 — open

## Resume command

```
/resync
cd worktrees/276-fast-tap-queue
```

Then execute the plan using `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

## Current state

**Task:** Fix false error bounces on rapid Android taps (issue #276)
**Phase:** ready to implement
**Progress:** Design spec, implementation plan, and doc review all complete. Plan has 8 tasks (7 implementation + 1 architecture docs). 15 doc review findings were applied (14 walk-through + 1 auto-fix).

## What we did

1. Brainstormed, designed, and wrote a design spec. Spec was doc-reviewed by 4 personas — 6 findings applied, 1 deferred (screen reader a11y), 1 skipped.
2. Wrote an 8-task TDD implementation plan with full code blocks.
3. Plan was doc-reviewed by 4 personas (coherence, feasibility, scope-guardian, adversarial) — 15 findings applied across all severity levels. Key fixes:
   - Made `expected` field optional on `GameEvaluateEvent` (was required, broke 4+ existing emit sites)
   - Added `data-shaking` throttle attribute (replaced `classList.contains` TOCTOU guard)
   - Added CSS variable fallback values for red flash
   - Added `zones.length` to `useEffect` deps (fixes consecutive `INIT_ROUND`)
   - Added Task 8 for architecture docs update per CLAUDE.md
   - Merged Task 5/6 test mocks into forward-compatible definition
   - Added dispatch-ownership comments for REJECT_TAP invariant
   - Added UX change rationale for lock-auto-eject bank-shake
   - Added missing test cases (isWrong+null, no-slot-available)

## Decisions made

- **Pre-validate at bank, not in reducer** — for tap/click in `lock-auto-eject` and `reject` modes, check tile correctness before dispatching. Wrong tiles shake in the bank instead of traveling to a slot and bouncing back. `lock-manual` is unchanged.
- **Ref-based write-ahead log, not flushSync or debounce** — a shared `pendingPlacements` ref tracks claimed slots synchronously. Second tap sees slot 0 is claimed and targets slot 1.
- **Module-scoped pendingPlacements** — single-instance assumption documented. For multi-instance, lift to AnswerGameProvider context.
- **placeInNextSlot returns PlaceResult** — `{ placed: boolean; zoneIndex: number; rejected: boolean }`.
- **Throttle via data-shaking attribute** — robust to triggerShake's internal remove-reflow-add cycle (not classList.contains which has TOCTOU).
- **expected field is optional** — `expected?: string` on `GameEvaluateEvent`, matching spec's "non-breaking additive change" claim.
- **REJECT_TAP dispatch ownership** — tap/click dispatches in `handleClick`; drag dispatches in `placeTile`. Mutually exclusive, documented with comments.
- **Full reject feedback on all input methods** — `reject` mode gets shake + wrong sound + red flash on tap, click, AND drag.
- **REJECT_TAP reducer action** — increments `retryCount` only, no zone mutations.
- **Follow-up issue #280** — lock-manual sequential wrong tile blocking is a separate bug.

## Spec / Plan

- docs/superpowers/specs/2026-05-01-fast-tap-queue-design.md
- docs/superpowers/plans/2026-05-01-fast-tap-queue.md

## Key files

- `src/components/answer-game/useAutoNextSlot.ts` — core of the bug; pendingPlacements queue + pre-validation
- `src/components/answer-game/useDraggableTile.ts:129-132` — `handleClick` pre-validation + shake
- `src/components/answer-game/useTileEvaluation.ts:24-50` — `placeTile` with `expected` field and drag-reject
- `src/components/answer-game/answer-game-reducer.ts:119-125` — `REJECT_TAP` case
- `src/components/answer-game/types.ts` — `AnswerGameAction` union with `REJECT_TAP`
- `src/types/game-events.ts` — `GameEvaluateEvent` with optional `expected`
- `src/components/answer-game/AnswerGame/AnswerGame.flows.mdx` — architecture docs (Task 8)

## Open questions / blockers

- [ ] Screen reader announcements for rejected taps — deferred from doc review

## Next steps

1. [x] Invoke `superpowers:writing-plans` to create the implementation plan
2. [x] Doc review the plan (4 personas, 15 findings applied)
3. [ ] Execute plan using `superpowers:subagent-driven-development` or `superpowers:executing-plans`
4. [ ] Test on Android device to confirm the stale-closure race is resolved

## Context to remember

- Mouse clicks cannot reproduce the bug (insufficient speed) — only Android touch
- Drag-and-drop is unaffected (user targets a specific slot)
- The fix applies to SortNumbers too since it shares the answer-game layer
- `wrongTileBehavior` has three modes: `lock-auto-eject`, `lock-manual`, `reject`
- No iOS reproduction found, but fix is platform-agnostic
- CSS variables `--skin-wrong-bg` and `--skin-wrong-border` — verify they exist at game container scope; fallbacks added

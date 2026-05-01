# Handoff: Fast-tap queue design spec (#276)

**Date:** 2026-05-01
**Branch:** 276-fast-tap-queue
**Worktree:** worktrees/276-fast-tap-queue
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/276-fast-tap-queue
**Git status:** clean
**Last commit:** a307fb9f docs(spec): apply doc review findings to fast-tap queue design
**PR:** #282 — open

## Resume command

```
/resync
cd worktrees/276-fast-tap-queue
```

Then invoke `superpowers:writing-plans` against the spec to create the implementation plan.

## Current state

**Task:** Fix false error bounces on rapid Android taps (issue #276)
**Phase:** planning
**Progress:** Design spec complete and doc-reviewed; implementation plan not yet written

## What we did

Brainstormed, designed, and wrote a design spec for the fast-tap queue fix. The spec was doc-reviewed by 4 personas (coherence, feasibility, scope-guardian, adversarial) — 6 findings applied, 1 deferred to Open Questions (screen reader a11y), 1 skipped. Also raised follow-up issue #280 for the lock-manual sequential wrong tile blocking bug discovered during brainstorming.

## Decisions made

- **Pre-validate at bank, not in reducer** — for tap/click in `lock-auto-eject` and `reject` modes, check tile correctness before dispatching. Wrong tiles shake in the bank instead of traveling to a slot and bouncing back. `lock-manual` is unchanged (wrong tiles still go to slot).
- **Ref-based write-ahead log, not flushSync or debounce** — a shared `pendingPlacements` ref tracks claimed slots synchronously, bypassing React's batching delay. Second tap sees slot 0 is claimed and targets slot 1.
- **Shared ref scope** — the `pendingPlacements` ref must be shared across all hook instances (AnswerGameProvider context or module scope), not per-hook. Drain condition: `zones[entry.zoneIndex].placedTileId === entry.tileId`. Clear on `INIT_ROUND`/`ADVANCE_ROUND`/`ADVANCE_LEVEL`.
- **placeInNextSlot returns result object** — `{ placed: boolean; zoneIndex: number; rejected: boolean }` instead of void, so callers can branch on outcome.
- **Throttle re-taps during shake** — if `animate-shake` is already active, ignore subsequent taps. Prevents orphaned `animationend` listeners that would leave `is-wrong` class permanently applied.
- **Full reject feedback on all input methods** — `reject` mode gets shake + wrong sound + red flash on tap, click, AND drag (previously silent discard only).
- **`expected` field on GameEvaluateEvent** — additive, no IndexedDB migration needed. Provides confusion pair for future SRS/Anki implementation.
- **REJECT_TAP reducer action** — increments `retryCount` only, no zone mutations.
- **Follow-up issue #280** — lock-manual sequential wrong tile blocking is a separate bug, out of scope for this PR.

## Spec / Plan

- docs/superpowers/specs/2026-05-01-fast-tap-queue-design.md

## Key files

- `src/components/answer-game/useAutoNextSlot.ts` — core of the bug; `placeInNextSlot` reads stale `zones`/`activeSlotIndex` from closure
- `src/components/answer-game/useDraggableTile.ts:129-132` — `handleClick` where pre-validation + shake will be wired
- `src/components/answer-game/useTileEvaluation.ts:24-50` — `placeTile` where `expected` field gets added to game:evaluate emits
- `src/components/answer-game/answer-game-reducer.ts:119-125` — existing `reject` mode silent discard; new `REJECT_TAP` case goes here
- `src/components/answer-game/types.ts` — `AnswerGameAction` union type, add `REJECT_TAP`
- `src/types/game-events.ts` — `GameEvaluateEvent`, add `expected: string`
- `src/components/answer-game/Slot/slot-animations.ts` — `triggerShake` reused for bank tile shake

## Open questions / blockers

- [ ] Screen reader announcements for rejected taps — deferred from doc review (Open Questions in spec)

## Next steps

1. [ ] Invoke `superpowers:writing-plans` to create the implementation plan from the spec
2. [ ] Implement following TDD: write failing tests first, then production code
3. [ ] Test on Android device to confirm the stale-closure race is resolved

## Context to remember

- Mouse clicks cannot reproduce the bug (insufficient speed) — only Android touch
- Drag-and-drop is unaffected (user targets a specific slot)
- The fix applies to SortNumbers too since it shares the answer-game layer
- `wrongTileBehavior` has three modes: `lock-auto-eject`, `lock-manual`, `reject` — each behaves differently per the behavior matrix in the spec
- No iOS reproduction found, but fix is platform-agnostic

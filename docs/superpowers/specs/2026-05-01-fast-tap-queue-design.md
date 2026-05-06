# Fast-Tap Queue & Pre-Validation Design

**Issue:** [#276](https://github.com/leocaseiro/base-skill/issues/276)
**Date:** 2026-05-01

## Problem

On Android touch devices, tapping letter tiles quickly in the correct order
(e.g. C-A-T within ~100ms) causes false error bounces. React's click handlers
fire synchronously, but reducer dispatches are batched — the second tap reads
stale `activeSlotIndex` and `zones` from its closure before the first
`PLACE_TILE` has flushed.

Mouse clicks cannot reproduce the bug (insufficient speed). Drag-and-drop is
unaffected (user targets a specific slot).

## Solution: Pre-Validation at the Bank + Input Buffer

### Pre-validation on tap/click

When a bank tile is tapped (not dragged), check the tile's value against the
target slot's `expectedValue` **before** dispatching `PLACE_TILE`.
Pre-validation reads `expectedValue` from `zones[computedTargetIndex]`, where
`computedTargetIndex` is the next empty slot accounting for pending placements
in the ref (not the stale `activeSlotIndex` from the closure). Behavior
varies by `wrongTileBehavior`:

| `wrongTileBehavior` | Tap/click (new)                                          | Drag (unchanged)                                    |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `lock-auto-eject`   | Pre-validate at bank — wrong tile shakes in bank         | Lands in slot, auto-ejects after delay              |
| `lock-manual`       | **No change** — wrong tile goes to slot, stays locked    | Same — no change                                    |
| `reject`            | Shake + wrong sound + red flash on bank tile (all input) | Same shake + wrong sound + red flash (new feedback) |

For `reject` mode, the feedback applies to **all input methods** (tap, click,
and drag). The reducer already silently discards wrong tiles in this mode
(lines 119-125 of `answer-game-reducer.ts`); we add visual+audio feedback
where there was none.

### Input buffer for rapid correct taps

A shared ref-based pending-placements queue prevents the stale-closure race.
The ref must be shared across all hook instances — either lifted to
`AnswerGameProvider` context or stored at module scope — so that concurrent
taps from different tile components see each other's pending claims.

- Maintain a `pendingPlacements` ref (`Array<{ tileId: string; zoneIndex: number }>`)
- When `placeInNextSlot` is called, compute the target slot accounting for
  both current `zones` state AND pending placements in the ref
- Push the placement into the ref, then dispatch `PLACE_TILE`
- Drain condition: on re-render, remove entries where
  `zones[entry.zoneIndex].placedTileId === entry.tileId` (the reducer has
  applied them)
- Clear the ref entirely on `INIT_ROUND`, `ADVANCE_ROUND`, and
  `ADVANCE_LEVEL` to prevent stale entries across rounds

The ref is synchronous (no React batching delay) — a write-ahead log that
lets the second tap see slot 0 is claimed and correctly target slot 1. No
`flushSync`, no debounce timers.

### Bank tile shake animation

`triggerShake` from `slot-animations.ts` is called on the bank tile's
`<button>` ref when pre-validation rejects a tap. Same `animate-shake` CSS
class (300ms oscillate-X) — no new keyframes.

For the red flash: briefly apply a CSS class (`is-wrong`) to the bank tile
button for the duration of the shake animation (~300ms), using the existing
`--skin-wrong-bg` and `--skin-wrong-border` CSS variables so it matches the
slot wrong-tile styling. Remove the class on `animationend`. Add the
`.is-wrong` styles to the existing DraggableTile CSS module (co-located with
the component) — no new stylesheet needed.

**Throttle on rapid re-tap:** If the bank tile already has `animate-shake`
(a shake is in progress), ignore subsequent taps. This prevents restarting
the animation mid-cycle, which would orphan the `animationend` listener and
leave the `is-wrong` class permanently applied.

`useAutoNextSlot.placeInNextSlot` returns
`{ placed: boolean; zoneIndex: number; rejected: boolean }` instead of
`void`, so callers can branch on the outcome.

Flow in `useDraggableTile.handleClick`:

1. `speakTile(tile.label)` (unchanged)
2. Call `placeInNextSlot(tile.id)` — pre-validates tile value against
   `zones[computedTargetIndex].expectedValue`
3. If `rejected` and not `lock-manual`: `triggerShake(ref.current)`, play
   wrong sound, dispatch `REJECT_TAP` with `zoneIndex` from the result
4. If `placed`: tile is pushed to pending ref and `PLACE_TILE` dispatched

Pre-validation supersedes the existing `isWrong` early-return guard
(`if (zones[activeSlotIndex]?.isWrong) return`) for tap/click paths — the
tile is checked at the bank before reaching the reducer. The `isWrong` guard
remains active for drag and `lock-manual` paths where tiles still land in
slots.

### New `REJECT_TAP` reducer action

```typescript
{
  type: 'REJECT_TAP';
  tileId: string;
  zoneIndex: number;
}
```

Increments `retryCount` only. No zone mutations, no bank changes, no
`activeSlotIndex` movement.

### Add `expected` field to `game:evaluate` events

Add `expected: string` to the `GameEvaluateEvent` type, populated from
`zone.expectedValue` at all emit sites:

- `useTileEvaluation.placeTile`
- `useTileEvaluation.typeTile`
- Pre-validation reject path in `useDraggableTile.handleClick`

Non-breaking additive change. No IndexedDB migration needed — `game:evaluate`
events are in-memory only, and session history payloads use
`additionalProperties: true`.

Provides the confusion pair (`answer` vs `expected`) for future SRS (Anki
algorithm) implementation.

## Files to modify

| File                                                | Change                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/components/answer-game/types.ts`               | Add `REJECT_TAP` action                                                                    |
| `src/types/game-events.ts`                          | Add `expected` field to `GameEvaluateEvent`                                                |
| `src/components/answer-game/answer-game-reducer.ts` | Handle `REJECT_TAP` (increment retryCount)                                                 |
| `src/components/answer-game/useAutoNextSlot.ts`     | Add pending-placements ref, pre-validation logic                                           |
| `src/components/answer-game/useDraggableTile.ts`    | Pre-validate on click, shake on reject, emit event                                         |
| `src/components/answer-game/useTileEvaluation.ts`   | Add `expected` to all `game:evaluate` emits, add reject feedback for `reject` mode on drag |

## Scope

### In scope

- Pre-validate tile on tap/click path (`lock-auto-eject` and `reject` modes)
- Full reject feedback (shake, sound, red flash) for `reject` mode on all
  input methods
- Ref-based pending queue to prevent stale-closure races on rapid correct taps
- Shake animation on bank tile for wrong tap
- `REJECT_TAP` reducer action
- `expected` field on `GameEvaluateEvent` at all emit sites
- Unit tests for new paths (pre-validation, queue, reducer action)

### Not in scope

- `lock-manual` tap behavior (unchanged — wrong tiles go to slot)
- `lock-manual` sequential wrong tile blocking (separate bug, tracked in
  [#280](https://github.com/leocaseiro/base-skill/issues/280))
- Keyboard/type input path (`typeTile`)
- SRS consumer implementation (future — this ensures the data shape is ready)
- iOS-specific investigation (fix is platform-agnostic)

## Open Questions

- **Screen reader announcements for rejected taps:** Should the shake +
  red flash be accompanied by an `aria-live` announcement (e.g. "Wrong
  tile") so screen reader users get equivalent feedback? Deferred from
  doc review — not blocking for initial implementation.

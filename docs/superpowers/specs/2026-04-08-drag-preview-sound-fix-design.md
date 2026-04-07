# Drag Preview in Slots + Sound Bug Fix — Design Spec

## Overview

Two related improvements to the answer-game drag system:

1. **Drag preview** — while dragging a tile over a slot, show a visual preview
   of the final result before the user drops (full swap preview on both source
   and target slots)
2. **Sound bug fix** — correct the sound evaluation when moving a tile from a
   slot to an empty slot, and suppress the spurious `tile-place` sound from the
   source slot emptying

## Feature 1: Drag Preview

### State Changes

Add to `AnswerGameState` in `types.ts`:

```ts
dragHoverZoneIndex: number | null;
```

Add to `AnswerGameAction`:

```ts
| { type: 'SET_DRAG_HOVER'; zoneIndex: number | null }
```

The reducer sets `dragHoverZoneIndex` on `SET_DRAG_HOVER`. Initialized as
`null`, cleared on any drop/cancel alongside `SET_DRAG_ACTIVE` clearing.

**Belt-and-suspenders:** when `SET_DRAG_ACTIVE` sets `tileId` to `null`, the
reducer also clears `dragHoverZoneIndex` to `null`.

**Not persisted** — `buildDraft()` in `useAnswerGameDraftSync` (PR #29)
cherry-picks fields explicitly, so `dragHoverZoneIndex` is excluded
automatically.

### Hover Detection

#### HTML5 DnD Path

In `useSlotBehavior.ts`, extend the `dropTargetForElements` registration:

- `onDragEnter`: dispatch `SET_DRAG_HOVER` with the slot's zone index
- `onDragLeave`: dispatch `SET_DRAG_HOVER` with `null`

#### Touch Path

In `useTouchDrag.ts`, add a new callback to `UseTouchDragOptions`:

```ts
onHoverZone?: (zoneIndex: number | null) => void;
```

During `onPointerMove`, after the drag threshold is crossed, use
`elementsFromPoint` to find the zone under the pointer. Call `onHoverZone`
when the detected zone changes (track via a `lastHoverZoneRef` to avoid
redundant calls).

#### Cleanup

`SET_DRAG_HOVER` with `null` is dispatched on:

- `onDragLeave` (HTML5)
- `onDrop` / `onDragCancel` (both paths)
- `SET_DRAG_ACTIVE` clearing to `null` (auto-clear in reducer)

### Preview Rendering

#### Computed Preview State in useSlotBehavior

Each slot derives its preview state from context:

- `isPreviewTarget`: `dragHoverZoneIndex === index && dragActiveTileId !== null`
- `isPreviewSource`: this slot is the source of the active drag AND
  `dragHoverZoneIndex !== null` (i.e. the drag is hovering over some target)

Preview logic per scenario:

| Scenario             | Target slot shows  | Source slot shows      |
| -------------------- | ------------------ | ---------------------- |
| Bank → empty slot    | Dragged tile label | N/A (bank, not a slot) |
| Bank → occupied slot | Dragged tile label | N/A (bank, not a slot) |
| Slot → empty slot    | Dragged tile label | Empty                  |
| Slot → occupied slot | Dragged tile label | Target's current tile  |

#### New SlotRenderProps Fields

```ts
isPreview: boolean; // true when showing preview content
previewLabel: string | null; // label to render during preview
```

#### Visual Treatment in Slot.tsx

When `isPreview` is true:

- Border switches to `border-dashed`
- Tile label renders at `opacity-50`
- Slot gets a pulsing ring animation (CSS keyframes):

```css
@keyframes pulseRing {
  0%,
  100% {
    box-shadow: 0 0 0 3px hsla(221, 83%, 53%, 0.15);
  }
  50% {
    box-shadow: 0 0 0 5px hsla(221, 83%, 53%, 0.25);
  }
}
```

When `isPreview` is false, rendering is unchanged.

## Feature 2: Sound Bug Fix

### Root Cause

In `useSlotBehavior.ts`, `handleDrop` always dispatches `SWAP_TILES` for
slot-to-slot drags. Two bugs:

1. When the target is empty (a move, not a swap), `displacedTile` is null, so
   `displacedCorrect` defaults to `true` — plays "correct" even when the moved
   tile is wrong at the target
2. The animation effect (lines 201-203) fires `tile-place` when
   `tileId === null && prevTileId !== null` in the source slot, overriding the
   swap/move sound

### Fix

#### 1. handleDrop Sound Evaluation

When `displacedTile` is null (move to empty slot): evaluate only the moved
tile against the target zone's `expectedValue`. Play correct/wrong based on
that alone.

When both tiles exist (true swap): keep current logic — correct if either
lands correctly, wrong only if both are wrong.

#### 2. Suppress tile-place on Source Emptying During Swap/Move

The animation effect fires when `tileId === null && prevTileId !== null`.
Add a guard: skip the `tile-place` sound when the slot emptied because of a
`SWAP_TILES` dispatch. Track this by checking if `dragActiveTileId` was set
when the transition happened — if the tile left during an active drag, it is
a swap/move, not a manual removal.

#### 3. Animate Both Slots on Swap/Move

The existing swap animation (lines 169-179) handles the target. For the
source slot emptying during a swap/move: skip animation (no pop, no shake).
The source slot simply becomes empty or receives the swapped tile.

### Sound Rules

| Scenario                          | Sound        | Animation                                |
| --------------------------------- | ------------ | ---------------------------------------- |
| Swap, either tile correct         | `correct`    | Both slots: pop or shake per correctness |
| Swap, both tiles wrong            | `wrong`      | Both slots: shake                        |
| Move to empty slot, correct       | `correct`    | Target: pop                              |
| Move to empty slot, wrong         | `wrong`      | Target: shake                            |
| Return to bank                    | `tile-place` | Source: existing eject flow              |
| Source empties (during swap/move) | _none_       | _none_                                   |

## Compatibility with PR #29

PR #29 (service worker + game session resume) adds `AnswerGameDraftState` to
`types.ts` and `useAnswerGameDraftSync` for state persistence. This spec is
fully compatible:

- `dragHoverZoneIndex` is transient state, not included in `buildDraft()`
  (which cherry-picks fields)
- No overlapping file changes — PR #29 touches `AnswerGameProvider.tsx` and
  game components; this spec touches `useSlotBehavior.ts`, `Slot.tsx`,
  `answer-game-reducer.ts`, `useSlotTileDrag.ts`, and `useTouchDrag.ts`
- Types additions are in different sections of `types.ts` (clean merge)

## Testing

### Unit Tests

- `answer-game-reducer.test.ts` — `SET_DRAG_HOVER` action: sets
  `dragHoverZoneIndex`, clears on null, auto-clears when `SET_DRAG_ACTIVE`
  goes null
- `useSlotBehavior` sound tests — verify all six sound scenarios from the
  table above

### Storybook Interaction Tests

- Stories exercising drag preview states: slot in preview-target mode (dashed
  border, faded label, glow), slot in preview-source mode (showing incoming
  swap tile), and idle slot (unchanged)
- Visual state tests — set context values directly, no actual drag needed

### Visual Regression Tests

- New VR baselines for preview states across all four scenarios (bank→empty,
  bank→occupied, slot→empty, slot→swap)
- Both light and dark mode if dark mode is active on this branch

### Out of Scope

- E2E drag tests — drag interactions in Playwright are fragile and the
  existing E2E suite does not cover drag. Unit + Storybook + VR provide
  sufficient coverage.

## Key Files

| File                                  | Changes                                        |
| ------------------------------------- | ---------------------------------------------- |
| `answer-game/types.ts`                | Add `dragHoverZoneIndex` to state, new action  |
| `answer-game/answer-game-reducer.ts`  | Handle `SET_DRAG_HOVER`, auto-clear logic      |
| `answer-game/Slot/useSlotBehavior.ts` | Preview derivation, hover dispatch, sound fix  |
| `answer-game/Slot/Slot.tsx`           | Preview visual treatment                       |
| `answer-game/useSlotTileDrag.ts`      | Pass hover callbacks to touch drag             |
| `answer-game/useTouchDrag.ts`         | `onHoverZone` callback, zone detection on move |

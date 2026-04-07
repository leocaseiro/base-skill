# Drag Preview in Slots + Sound Bug Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual drag preview when hovering tiles over slots, and fix incorrect sound evaluation on slot-to-empty-slot moves.

**Architecture:** New `dragHoverZoneIndex` state drives preview rendering. Each slot derives `isPreview` / `previewLabel` from context. Sound fix corrects the `handleDrop` evaluation path for empty targets and suppresses spurious `tile-place` from source-slot emptying.

**Tech Stack:** React, Vitest, Pragmatic DnD (`@atlaskit/pragmatic-drag-and-drop`), Storybook, Tailwind CSS

---

## File Map

| File                                                          | Action | Responsibility                                             |
| ------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `src/components/answer-game/types.ts`                         | Modify | Add `dragHoverZoneIndex` to state, `SET_DRAG_HOVER` action |
| `src/components/answer-game/answer-game-reducer.ts`           | Modify | Handle `SET_DRAG_HOVER`, auto-clear on `SET_DRAG_ACTIVE`   |
| `src/components/answer-game/answer-game-reducer.test.ts`      | Modify | Tests for new reducer cases                                |
| `src/components/answer-game/Slot/useSlotBehavior.ts`          | Modify | Preview derivation, hover dispatch, sound fix              |
| `src/components/answer-game/Slot/Slot.tsx`                    | Modify | Preview visual treatment (dashed border, opacity, pulse)   |
| `src/components/answer-game/useSlotTileDrag.ts`               | Modify | Pass `onHoverZone` to touch drag                           |
| `src/components/answer-game/useTouchDrag.ts`                  | Modify | `onHoverZone` callback, zone detection during pointer move |
| `src/components/answer-game/Slot/Slot.stories.tsx`            | Modify | Add preview-state stories                                  |
| `e2e/answer-game/slot-preview.vr.spec.ts` (or similar naming) | Create | VR baselines for preview states                            |

---

## Task 1: Add `dragHoverZoneIndex` State and `SET_DRAG_HOVER` Action

**Files:**

- Modify: `src/components/answer-game/types.ts`
- Modify: `src/components/answer-game/answer-game-reducer.ts`
- Modify: `src/components/answer-game/answer-game-reducer.test.ts`

### Step 1.1: Write failing tests for SET_DRAG_HOVER

- [ ] Add tests to `answer-game-reducer.test.ts`:

```ts
it('SET_DRAG_HOVER sets dragHoverZoneIndex', () => {
  const state = makeInitialState(config);
  const next = answerGameReducer(state, {
    type: 'SET_DRAG_HOVER',
    zoneIndex: 2,
  });
  expect(next.dragHoverZoneIndex).toBe(2);
});

it('SET_DRAG_HOVER with null clears dragHoverZoneIndex', () => {
  let state = makeInitialState(config);
  state = answerGameReducer(state, {
    type: 'SET_DRAG_HOVER',
    zoneIndex: 1,
  });
  const next = answerGameReducer(state, {
    type: 'SET_DRAG_HOVER',
    zoneIndex: null,
  });
  expect(next.dragHoverZoneIndex).toBeNull();
});

it('SET_DRAG_ACTIVE clearing to null also clears dragHoverZoneIndex', () => {
  let state = makeInitialState(config);
  state = answerGameReducer(state, {
    type: 'SET_DRAG_HOVER',
    zoneIndex: 1,
  });
  state = answerGameReducer(state, {
    type: 'SET_DRAG_ACTIVE',
    tileId: null,
  });
  expect(state.dragHoverZoneIndex).toBeNull();
});
```

### Step 1.2: Run tests to verify they fail

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn vitest run src/components/answer-game/answer-game-reducer.test.ts`

Expected: FAIL — `dragHoverZoneIndex` does not exist on `AnswerGameState`, `SET_DRAG_HOVER` is not a valid action type.

### Step 1.3: Add types

- [ ] In `types.ts`, add `dragHoverZoneIndex` to `AnswerGameState` (after `dragActiveTileId`):

```ts
dragHoverZoneIndex: number | null;
```

- [ ] In `types.ts`, add `SET_DRAG_HOVER` to `AnswerGameAction` union:

```ts
| { type: 'SET_DRAG_HOVER'; zoneIndex: number | null }
```

### Step 1.4: Implement reducer cases

- [ ] In `answer-game-reducer.ts`, add `dragHoverZoneIndex: null` to `makeInitialState` return (after `dragActiveTileId: null`):

```ts
dragHoverZoneIndex: null,
```

- [ ] Add the `SET_DRAG_HOVER` case before the `default` case:

```ts
case 'SET_DRAG_HOVER': {
  return { ...state, dragHoverZoneIndex: action.zoneIndex };
}
```

- [ ] In the `SET_DRAG_ACTIVE` case, add belt-and-suspenders auto-clear when `tileId` is `null`:

```ts
case 'SET_DRAG_ACTIVE': {
  return {
    ...state,
    dragActiveTileId: action.tileId,
    dragHoverZoneIndex: action.tileId === null ? null : state.dragHoverZoneIndex,
  };
}
```

### Step 1.5: Run tests to verify they pass

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn vitest run src/components/answer-game/answer-game-reducer.test.ts`

Expected: ALL PASS

### Step 1.6: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/types.ts src/components/answer-game/answer-game-reducer.ts src/components/answer-game/answer-game-reducer.test.ts
git commit -m "feat(answer-game): add dragHoverZoneIndex state and SET_DRAG_HOVER action"
```

---

## Task 2: Hover Detection — HTML5 DnD Path

**Files:**

- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`

### Step 2.1: Dispatch SET_DRAG_HOVER from dropTargetForElements

- [ ] In `useSlotBehavior.ts`, extend the `dropTargetForElements` registration (the `useEffect` at line 116) to include `onDragEnter` and `onDragLeave`:

```ts
return dropTargetForElements({
  element: el,
  getData: () => ({ zoneIndex: index }),
  onDragEnter: () => {
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: index });
  },
  onDragLeave: () => {
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
  },
  onDrop: ({ source }) => {
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
    if (typeof source.data['sourceZoneIndex'] === 'number') return;
    const sourceTileId = source.data['tileId'];
    if (typeof sourceTileId === 'string') {
      handleDrop(sourceTileId, index);
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
    }
  },
});
```

### Step 2.2: Verify typecheck passes

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck`

Expected: PASS

### Step 2.3: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/Slot/useSlotBehavior.ts
git commit -m "feat(answer-game): dispatch SET_DRAG_HOVER from HTML5 DnD drop targets"
```

---

## Task 3: Hover Detection — Touch Path

**Files:**

- Modify: `src/components/answer-game/useTouchDrag.ts`
- Modify: `src/components/answer-game/useSlotTileDrag.ts`
- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`

### Step 3.1: Add `onHoverZone` to useTouchDrag

- [ ] In `useTouchDrag.ts`, add `onHoverZone` to `UseTouchDragOptions`:

```ts
interface UseTouchDragOptions {
  tileId: string;
  label: string;
  onDragStart?: () => void;
  onDragCancel?: () => void;
  onDrop: (tileId: string, zoneIndex: number) => void;
  onDropOnBank?: () => void;
  onHoverZone?: (zoneIndex: number | null) => void;
}
```

- [ ] Accept `onHoverZone` in the destructured params:

```ts
export const useTouchDrag = ({
  tileId,
  label,
  onDragStart,
  onDragCancel,
  onDrop,
  onDropOnBank,
  onHoverZone,
}: UseTouchDragOptions): TouchDragHandlers => {
```

- [ ] Add a ref to track the last hovered zone (after `cleanupInProgressRef`):

```ts
const lastHoverZoneRef = useRef<number | null>(null);
```

- [ ] Add a stable ref for `onHoverZone` (after the `onDragCancelRef` block):

```ts
const onHoverZoneRef = useRef(onHoverZone);
useEffect(() => {
  onHoverZoneRef.current = onHoverZone;
}, [onHoverZone]);
```

### Step 3.2: Detect zone under pointer during onPointerMove

- [ ] In the `onPointerMove` callback, after the ghost position update (`if (isDragging.current && ghostRef.current)`), add zone detection:

```ts
if (isDragging.current && ghostRef.current) {
  const { el, halfW, halfH } = ghostRef.current;
  el.style.left = `${e.clientX - halfW}px`;
  el.style.top = `${e.clientY - halfH}px`;

  // Detect zone under pointer for hover preview
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  let detectedZone: number | null = null;
  for (const elem of elements) {
    if (
      elem instanceof HTMLElement &&
      elem.dataset['zoneIndex'] !== undefined
    ) {
      const parsed = Number.parseInt(elem.dataset['zoneIndex'], 10);
      if (!Number.isNaN(parsed)) {
        detectedZone = parsed;
        break;
      }
    }
  }
  if (detectedZone !== lastHoverZoneRef.current) {
    lastHoverZoneRef.current = detectedZone;
    onHoverZoneRef.current?.(detectedZone);
  }
}
```

### Step 3.3: Clear hover zone on cleanup

- [ ] In the `cleanupGhost` function, after `isDragging.current = false;`, add:

```ts
lastHoverZoneRef.current = null;
```

### Step 3.4: Wire onHoverZone through useSlotTileDrag

- [ ] In `useSlotTileDrag.ts`, add `onHoverZone` to `UseSlotTileDragOptions`:

```ts
interface UseSlotTileDragOptions {
  tileId: string | null;
  label: string | null;
  zoneIndex: number;
  onDrop: (tileId: string, targetZoneIndex: number) => void;
  onHoverZone?: (zoneIndex: number | null) => void;
}
```

- [ ] Accept `onHoverZone` in the destructured params and pass it through to `useTouchDrag`:

```ts
export const useSlotTileDrag = ({
  tileId,
  label,
  zoneIndex,
  onDrop,
  onHoverZone,
}: UseSlotTileDragOptions): SlotTileDrag => {
```

- [ ] Pass `onHoverZone` to the `useTouchDrag` call:

```ts
const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
  useTouchDrag({
    tileId: tileId ?? '',
    label: label ?? '',
    onDragStart: tileId
      ? () => dispatch({ type: 'SET_DRAG_ACTIVE', tileId })
      : undefined,
    onDragCancel: tileId
      ? () => {
          dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        }
      : undefined,
    onDrop: handleTouchDrop,
    onDropOnBank: handleTouchDropOnBank,
    onHoverZone,
  });
```

### Step 3.5: Pass onHoverZone from useSlotBehavior

- [ ] In `useSlotBehavior.ts`, create a hover callback and pass it to `useSlotTileDrag`:

```ts
const handleHoverZone = useCallback(
  (zoneIndex: number | null) => {
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex });
  },
  [dispatch],
);
```

- [ ] Update the `useSlotTileDrag` call to include `onHoverZone`:

```ts
const {
  dragRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
} = useSlotTileDrag({
  tileId,
  label,
  zoneIndex: index,
  onDrop: handleDrop,
  onHoverZone: handleHoverZone,
});
```

### Step 3.6: Verify typecheck passes

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck`

Expected: PASS

### Step 3.7: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/useTouchDrag.ts src/components/answer-game/useSlotTileDrag.ts src/components/answer-game/Slot/useSlotBehavior.ts
git commit -m "feat(answer-game): add touch drag hover zone detection"
```

---

## Task 4: Preview Rendering in useSlotBehavior and Slot.tsx

**Files:**

- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`
- Modify: `src/components/answer-game/Slot/Slot.tsx`

### Step 4.1: Extend SlotRenderProps with preview fields

- [ ] In `useSlotBehavior.ts`, add `isPreview` and `previewLabel` to `SlotRenderProps`:

```ts
export interface SlotRenderProps {
  label: string | null;
  tileId: string | null;
  isActive: boolean;
  isWrong: boolean;
  isLocked: boolean;
  isEmpty: boolean;
  showCursor: boolean;
  isPreview: boolean;
  previewLabel: string | null;
}
```

### Step 4.2: Derive preview state in useSlotBehavior

- [ ] In `useSlotBehavior`, after the existing derived state (line ~64), read `dragHoverZoneIndex` from context and compute preview state:

```ts
const {
  zones,
  allTiles,
  activeSlotIndex,
  config,
  dragActiveTileId,
  dragHoverZoneIndex,
} = useAnswerGameContext();
```

Then after `const isBeingDragged = ...`:

```ts
// Preview derivation
const isPreviewTarget =
  dragHoverZoneIndex === index && dragActiveTileId !== null;

// This slot is the source of the active drag AND the drag is hovering over some target
const isPreviewSource = isBeingDragged && dragHoverZoneIndex !== null;

const draggedTile = dragActiveTileId
  ? allTiles.find((t) => t.id === dragActiveTileId)
  : null;

let isPreview = false;
let previewLabel: string | null = null;

if (isPreviewTarget) {
  isPreview = true;
  previewLabel = draggedTile?.label ?? null;
} else if (isPreviewSource) {
  isPreview = true;
  // Source slot shows what it will receive: the target's current tile label
  const targetZone =
    dragHoverZoneIndex !== null ? zones[dragHoverZoneIndex] : null;
  const targetTile = targetZone?.placedTileId
    ? allTiles.find((t) => t.id === targetZone.placedTileId)
    : null;
  previewLabel = targetTile?.label ?? null; // null means source will become empty
}
```

### Step 4.3: Include preview fields in renderProps return

- [ ] Update the return statement in `useSlotBehavior`:

```ts
return {
  renderProps: {
    label,
    tileId,
    isActive,
    isWrong,
    isLocked,
    isEmpty,
    showCursor,
    isPreview,
    previewLabel,
  },
  slotRef,
  dragRef,
  handleClick,
  isBeingDragged,
  pointerHandlers: {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  },
};
```

### Step 4.4: Render preview visual treatment in Slot.tsx

- [ ] In `Slot.tsx`, destructure `isPreview` and `previewLabel` from `renderProps`:

```ts
const {
  label,
  isEmpty,
  isWrong,
  isActive,
  showCursor,
  isPreview,
  previewLabel,
} = renderProps;
```

- [ ] Update `stateClasses` to apply dashed border when previewing:

```ts
const stateClasses = [
  'relative flex items-center justify-center border-2 transition-all overflow-hidden',
  isPreview
    ? 'border-dashed border-primary'
    : isEmpty && !isActive
      ? 'border-border'
      : isEmpty && isActive
        ? 'border-primary ring-2 ring-primary ring-offset-2'
        : isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-primary bg-primary/10 text-primary',
]
  .filter(Boolean)
  .join(' ');
```

- [ ] Add the pulse ring animation style. Add this inline style to the `<Tag>` when previewing:

```tsx
<Tag
  ref={slotRef as Ref<HTMLLIElement & HTMLSpanElement & HTMLDivElement>}
  aria-label={ariaLabel}
  data-zone-index={index}
  className={[stateClasses, className].filter(Boolean).join(' ')}
  style={
    isPreview
      ? { animation: 'pulseRing 1.5s ease-in-out infinite' }
      : undefined
  }
>
```

- [ ] For the preview content inside the filled branch, render `previewLabel` at half opacity when `isPreview` is true. Wrap children in a conditional:

```tsx
{
  isEmpty ? (
    <>
      {isPreview && previewLabel !== null ? (
        <span className="text-xl font-bold opacity-50">
          {previewLabel}
        </span>
      ) : (
        children(renderProps)
      )}
      {showCursor ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-sm bg-primary animate-blink"
        />
      ) : null}
    </>
  ) : (
    <>
      <div
        className="absolute inset-0 bg-muted/60 shadow-inner"
        aria-hidden="true"
      />
      <button
        ref={dragRef}
        type="button"
        className={`absolute inset-0 flex touch-none select-none cursor-grab items-center justify-center rounded-[inherit] text-card-foreground${isBeingDragged ? ' invisible pointer-events-none' : ''}${isPreview ? ' opacity-50' : ''}`}
        aria-hidden={isBeingDragged ? 'true' : undefined}
        style={skeuoStyle}
        onClick={handleClick}
        onPointerDown={pointerHandlers.onPointerDown}
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerUp={pointerHandlers.onPointerUp}
        onPointerCancel={pointerHandlers.onPointerCancel}
      >
        {isPreview && previewLabel !== null ? (
          <span className="text-xl font-bold">{previewLabel}</span>
        ) : (
          children(renderProps)
        )}
      </button>
    </>
  );
}
```

### Step 4.5: Add the pulseRing keyframes to global CSS

- [ ] Find the global CSS file (likely `src/index.css` or `src/globals.css`) and add:

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

### Step 4.6: Verify typecheck passes

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck`

Expected: PASS

### Step 4.7: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/Slot/useSlotBehavior.ts src/components/answer-game/Slot/Slot.tsx src/index.css
git commit -m "feat(answer-game): render drag preview in slots with dashed border and pulse"
```

---

## Task 5: Sound Bug Fix — handleDrop Evaluation

**Files:**

- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`

### Step 5.1: Fix sound evaluation for move-to-empty-slot

- [ ] In `useSlotBehavior.ts`, update the `handleDrop` callback's slot-to-slot branch. Replace the sound logic (lines 88–102) with:

```ts
if (sourceZoneIndex !== -1) {
  const droppedTile = allTiles.find((t) => t.id === droppedTileId);
  const displacedTile = targetZone.placedTileId
    ? allTiles.find((t) => t.id === targetZone.placedTileId)
    : null;
  const sourceZone = zones[sourceZoneIndex];
  const droppedCorrect =
    droppedTile?.value === targetZone.expectedValue;

  if (displacedTile) {
    // True swap: correct if either tile lands correctly
    const displacedCorrect =
      displacedTile.value === sourceZone?.expectedValue;
    playSound(droppedCorrect || displacedCorrect ? 'correct' : 'wrong');
  } else {
    // Move to empty slot: evaluate only the moved tile
    playSound(droppedCorrect ? 'correct' : 'wrong');
  }

  dispatch({
    type: 'SWAP_TILES',
    fromZoneIndex: sourceZoneIndex,
    toZoneIndex: targetZoneIndex,
  });
  return;
}
```

### Step 5.2: Verify typecheck passes

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck`

Expected: PASS

### Step 5.3: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/Slot/useSlotBehavior.ts
git commit -m "fix(answer-game): correct sound evaluation for slot-to-empty-slot moves"
```

---

## Task 6: Sound Bug Fix — Suppress tile-place on Source Emptying

**Files:**

- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`

### Step 6.1: Guard the tile-place sound in the animation effect

- [ ] In `useSlotBehavior.ts`, in the feedback animation effect (line ~158), update the `tileId === null && prevTileId !== null` branch to suppress `tile-place` when the slot emptied during an active drag (swap/move):

```ts
} else if (tileId === null && prevTileId !== null) {
  // Tile returned to bank (click, drag, or eject).
  // Suppress tile-place when the slot emptied due to a swap/move — the
  // swap sound was already played in handleDrop.
  if (dragActiveTileId === null) {
    playSound('tile-place');
  }
  startFadeRef.current?.();
  startFadeRef.current = null;
}
```

The key insight: when `dragActiveTileId` is still set (non-null), the source slot is emptying because of an in-progress drag — the swap/move sound was already played. When `dragActiveTileId` is null, it's a click removal or eject, so `tile-place` is correct.

**Wait** — `SET_DRAG_ACTIVE` clears to null in the same dispatch cycle as `SWAP_TILES`. So `dragActiveTileId` will already be null by the time the effect runs. We need a different signal.

- [ ] Instead, track whether the slot was emptied by a swap. Add a ref:

```ts
const swapInProgressRef = useRef(false);
```

- [ ] In `handleDrop`, set it before dispatching `SWAP_TILES`:

```ts
if (sourceZoneIndex !== -1) {
  // ... sound logic ...
  // Mark source slot so it doesn't play tile-place
  const sourceSlotIndex = sourceZoneIndex;
  // We can't set a ref on a different slot, so we use a module-level signal
  dispatch({
    type: 'SWAP_TILES',
    fromZoneIndex: sourceZoneIndex,
    toZoneIndex: targetZoneIndex,
  });
  return;
}
```

Actually, the simplest approach: compare `prevTileId` with the current `dragActiveTileId` at the point the effect fires. Since `SWAP_TILES` and `SET_DRAG_ACTIVE(null)` are dispatched together, we need to check: did the tile that left this slot match the tile that was being dragged?

- [ ] Use a ref to snapshot `dragActiveTileId` before state updates. Add after `prevTileIdRef`:

```ts
const prevDragActiveTileIdRef = useRef(dragActiveTileId);
```

- [ ] In the animation effect, capture and update it:

```ts
const prevDragActiveTileId = prevDragActiveTileIdRef.current;
prevDragActiveTileIdRef.current = dragActiveTileId;
```

- [ ] Update the empty-slot branch:

```ts
} else if (tileId === null && prevTileId !== null) {
  // Tile left this slot.
  // If the tile that left matches the previously-active drag tile, this is
  // a swap/move — the sound was already played in handleDrop.
  const wasSwapOrMove = prevTileId === prevDragActiveTileId;
  if (!wasSwapOrMove) {
    playSound('tile-place');
  }
  startFadeRef.current?.();
  startFadeRef.current = null;
}
```

- [ ] Add `dragActiveTileId` to the effect dependency array:

```ts
}, [isWrong, tileId, config.wrongTileBehavior, dragRef, dragActiveTileId]);
```

### Step 6.2: Verify typecheck passes

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck`

Expected: PASS

### Step 6.3: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/Slot/useSlotBehavior.ts
git commit -m "fix(answer-game): suppress spurious tile-place sound on source slot emptying during swap"
```

---

## Task 7: Storybook Preview Stories

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.stories.tsx`

### Step 7.1: Add PreviewTarget story

- [ ] Add a story that renders a slot in preview-target state by providing initial state where `dragHoverZoneIndex` and `dragActiveTileId` are set. Since state is controlled via context, use `initialZones` with a filled slot and override state:

```ts
// ---------------------------------------------------------------------------
// 7. PreviewTarget — slot showing drag preview (dashed border, faded label)
// ---------------------------------------------------------------------------

export const PreviewTarget: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-preview-target',
        initialTiles: [
          makeTile('t0', 'C'),
          makeTile('t1', 'A'),
          makeTile('t2', 'T'),
        ],
        initialZones: [makeZone(0), makeZone(1), makeZone(2)],
      }}
    >
      <PreviewTargetInner />
    </AnswerGameProvider>
  ),
};

const PreviewTargetInner = () => {
  const dispatch = useAnswerGameDispatch();
  React.useEffect(() => {
    // Simulate: tile t0 is being dragged over slot 1
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't0' });
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: 1 });
  }, [dispatch]);

  return (
    <SlotRow className="gap-2">
      <Slot index={0} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
      <Slot index={1} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
      <Slot index={2} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
    </SlotRow>
  );
};
```

- [ ] Add the required imports at the top of the file:

```ts
import React from 'react';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
```

### Step 7.2: Add PreviewSwap story (slot-to-occupied-slot)

- [ ] Add a story showing a swap preview where both source and target show previews:

```ts
// ---------------------------------------------------------------------------
// 8. PreviewSwap — slot-to-slot swap preview (source shows target's tile)
// ---------------------------------------------------------------------------

export const PreviewSwap: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-preview-swap',
        initialTiles: [
          makeTile('t0', 'C'),
          makeTile('t1', 'A'),
          makeTile('t2', 'T'),
        ],
        initialZones: [
          makeZone(0, 't0'),
          makeZone(1, 't1'),
          makeZone(2, 't2'),
        ],
      }}
    >
      <PreviewSwapInner />
    </AnswerGameProvider>
  ),
};

const PreviewSwapInner = () => {
  const dispatch = useAnswerGameDispatch();
  React.useEffect(() => {
    // Simulate: tile t0 (in slot 0) is being dragged over slot 1 (has t1)
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't0' });
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: 1 });
  }, [dispatch]);

  return (
    <SlotRow className="gap-2">
      <Slot index={0} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
      <Slot index={1} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
      <Slot index={2} className="size-14 rounded-lg">
        {(props) => <LetterContent {...props} />}
      </Slot>
    </SlotRow>
  );
};
```

### Step 7.3: Run Storybook to verify stories render

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn storybook` (verify visually in browser)

Expected: PreviewTarget shows slot 1 with dashed border and pulsing ring. PreviewSwap shows slot 0 and slot 1 both in preview state.

### Step 7.4: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add src/components/answer-game/Slot/Slot.stories.tsx
git commit -m "feat(storybook): add drag preview stories for Slot component"
```

---

## Task 8: Visual Regression Baselines

**Files:**

- Create: VR test file (find existing VR test location pattern first)

### Step 8.1: Locate existing VR test pattern

- [ ] Run: `find /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet -name '*.vr.spec.ts' | head -5` to determine naming and location conventions.

### Step 8.2: Write VR test for preview states

- [ ] Create the VR test file following the project's established pattern. Example (adjust path based on Step 8.1):

```ts
import { expect, test } from '@playwright/test';

test.describe('Slot drag preview', () => {
  test('preview target state', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=answer-game-slot--preview-target&viewMode=story',
    );
    await page.waitForSelector('[data-zone-index]');
    await expect(page.locator('.storybook-wrapper')).toHaveScreenshot(
      'slot-preview-target.png',
    );
  });

  test('preview swap state', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=answer-game-slot--preview-swap&viewMode=story',
    );
    await page.waitForSelector('[data-zone-index]');
    await expect(page.locator('.storybook-wrapper')).toHaveScreenshot(
      'slot-preview-swap.png',
    );
  });
});
```

### Step 8.3: Generate baselines

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn test:vr:update`

Expected: New baseline screenshots created.

### Step 8.4: Commit

- [ ] Commit:

```bash
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet
git add -A
git commit -m "test(vr): add visual regression baselines for slot drag preview"
```

---

## Task 9: Final Verification

### Step 9.1: Run full test suite

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn typecheck && yarn test && yarn lint`

Expected: ALL PASS

### Step 9.2: Run Storybook tests

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && START_STORYBOOK=1 yarn test:storybook`

Expected: ALL PASS

### Step 9.3: Run VR tests

- [ ] Run: `cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-chatelet && yarn test:vr`

Expected: ALL PASS (baselines match)

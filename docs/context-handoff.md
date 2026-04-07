# Context Handoff — Drag Improvements

## Branch

`claude/bold-chatelet` (worktree at `.claude/worktrees/bold-chatelet`)

## What was just fixed (committed, tests pass)

- **Swap preview bug** (`5f61208`): When dragging tile A from slot A over slot C,
  the source slot A was hidden (`invisible`) even when `isPreview=true`. Fixed by
  changing the button's class condition from `isBeingDragged` to
  `isBeingDragged && !isPreview` in `Slot.tsx`.

## What still needs to be designed and built

Three UX improvements to the drag system (brainstorming was in progress, not completed):

### 1. Preview from any tile (bank tiles not showing preview)

Currently `SET_DRAG_ACTIVE` is dispatched when dragging from a **slot**, so the
slot preview works. But dragging from the **tile bank** never dispatches
`SET_DRAG_ACTIVE` on the HTML5 DnD path (there's a comment in
`useDraggableTile.ts`: "no SET_DRAG_ACTIVE to avoid browser snap-back fadeout").
Also, `onHoverZone` is not passed to `useTouchDrag` in `useDraggableTile.ts`.

Fix needed in `useDraggableTile.ts`:

- HTML5: add `onDragStart` → `dispatch SET_DRAG_ACTIVE(tile.id)` and `onDrop`
  → `dispatch SET_DRAG_ACTIVE(null)`
- Touch: pass `onHoverZone: (zoneIndex) => dispatch SET_DRAG_HOVER(zoneIndex)`

### 2. Expanded drop zone / ghost overlap (both desktop and touch)

User wants the drop to trigger as soon as the ghost tile visually overlaps a slot
("just touching"), not just when the pointer is directly over it.

**Touch** (`useTouchDrag.ts`): Currently uses a single `elementsFromPoint(x, y)`.
Change to sample 5 points — the pointer center plus the 4 ghost corners at
`±halfW, ±halfH` — and use the first zone found.

**Desktop HTML5 DnD**: Slots use `dropTargetForElements` from
`@atlaskit/pragmatic-drag-and-drop`. The drop only fires when the **pointer** is
over the registered element. To expand: wrap the slot's inner content with an
invisible absolutely-positioned `div` that extends ~24–28 px beyond the visual
slot bounds, and register THAT as the drop target. Alternatively use
`monitorForElements` with expanded bounding-box checks.

There is an existing `magnetic-snap.ts` utility (`MAGNETIC_RADIUS=60`,
`MAGNETIC_STRENGTH=0.3`) that computes a lerp pull — could optionally be wired in
to visually pull the ghost toward the nearest slot during touch drag.

### 3. Bank hover display

When the ghost is dragged over the bank area, show visual feedback (subtle ring or
highlight) on the bank container.

State: add `dragHoverBankTarget: boolean` to `AnswerGameState`.

- Touch (`useTouchDrag.ts`): detect `data-tile-bank` in `elementsFromPoint` during
  `onPointerMove` and fire a new `onHoverBank` callback.
- Desktop: `useBankDropTarget` hook (find it or check `LetterTileBank.tsx`)—add
  `onDragEnter`/`onDragLeave`.

## Key files

- `src/components/answer-game/useDraggableTile.ts` — bank tile drag hook
- `src/components/answer-game/useTouchDrag.ts` — touch drag engine
- `src/components/answer-game/useSlotTileDrag.ts` — slot tile drag hook
- `src/components/answer-game/Slot/useSlotBehavior.ts` — slot state + drop registration
- `src/components/answer-game/Slot/Slot.tsx` — slot rendering
- `src/components/answer-game/types.ts` — state types
- `src/components/answer-game/answer-game-reducer.ts` — reducer
- `src/components/answer-game/magnetic-snap.ts` — existing (unused) snap utility
- `src/games/word-spell/LetterTileBank/LetterTileBank.tsx` — bank rendering

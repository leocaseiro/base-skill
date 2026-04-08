# Spec: Swap Slot ↔ Bank Tile on Drag

## Goal

When a user drags a tile from a slot and drops it onto a **visible bank tile** (not an
empty hole), the two tiles swap positions unconditionally — no evaluation, no sound,
no wrong-state. The slot tile goes to the bank; the bank tile goes to the slot.

Dropping on an **empty bank hole** (tile already placed in another slot) continues to
behave as today: `REMOVE_TILE` — the slot tile returns to the bank.

## New Reducer Action

```ts
| { type: 'SWAP_SLOT_BANK'; zoneIndex: number; bankTileId: string }
```

### Logic

```
guard: zones[zoneIndex].placedTileId !== null
guard: bankTileIds.includes(bankTileId)

slotTileId = zones[zoneIndex].placedTileId

newBankTileIds = bankTileIds
  .filter(id => id !== bankTileId)
  .concat(slotTileId)

newZones[zoneIndex] = {
  ...zone,
  placedTileId: bankTileId,
  isWrong:      false,
  isLocked:     false,
}

return { ...state, bankTileIds: newBankTileIds, zones: newZones, dragActiveTileId: null }
```

No `retryCount` change, no phase transition.

## Desktop HTML5 DnD

Register each bank tile button as a `dropTargetForElements` target (inside
`useDraggableTile`):

```ts
dropTargetForElements({
  element,
  getData: () => ({ bankTileId: tile.id, isBankTarget: true }),
});
```

In `useSlotTileDrag.onDrop`, check `targets[0]?.data['bankTileId']` before the
existing `isBankTarget` check:

```ts
const bankTileId = targets[0]?.data['bankTileId'];
if (typeof bankTileId === 'string') {
  dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
  dispatch({ type: 'SWAP_SLOT_BANK', zoneIndex, bankTileId });
  return;
}
// existing isBankTarget → REMOVE_TILE path
```

When the slot tile is dropped on an **empty hole**, no bank-tile drop target fires
(empty holes are plain divs with no `dropTargetForElements`), so `targets[0]` is the
bank container (`isBankTarget: true` only) → falls through to `REMOVE_TILE` ✓.

## Touch

### Detection

`data-tile-bank-hole={tile.id}` is already on every bank hole div (both visible and
empty). Add a helper to `useTouchDrag` that scans `elementsFromPoint` for this
attribute:

```ts
const findBankTileAt = (px, py): string | null => {
  for (const el of document.elementsFromPoint(px, py)) {
    if (el instanceof HTMLElement) {
      const holeId = el.dataset['tileBankHole'];
      if (holeId) return holeId;
    }
  }
  return null;
};
```

### New callback

Add to `UseTouchDragOptions`:

```ts
/** Called when the ghost is released over a specific bank tile's hole. */
onDropOnBankTile?: (bankTileId: string) => void;
```

### Priority in `onPointerUp`

Replace the bank-hit branches with:

```
if (bankTileId found at that point && onDropOnBankTile provided)
  → onDropOnBankTile(bankTileId)
else if (isBankAt)
  → onDropOnBank()
```

Apply this for both the **center** check (step 2) and the **corner** check (step 4).

### Caller wiring (`useSlotTileDrag`)

```ts
const handleTouchDropOnBankTile = useCallback(
  (bankTileId: string) => {
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
    if (bankTileIds.includes(bankTileId)) {
      dispatch({ type: 'SWAP_SLOT_BANK', zoneIndex, bankTileId });
    } else {
      // Dropped on empty hole → return to bank
      dispatch({ type: 'REMOVE_TILE', zoneIndex });
    }
  },
  [dispatch, zoneIndex, bankTileIds],
);
```

`useSlotTileDrag` needs to pull `bankTileIds` from `useAnswerGameContext`.

## Files to Change

| File                     | Change                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `types.ts`               | Add `SWAP_SLOT_BANK` action                                                                                   |
| `answer-game-reducer.ts` | Add `SWAP_SLOT_BANK` case                                                                                     |
| `useDraggableTile.ts`    | Register `dropTargetForElements` on bank tile button                                                          |
| `useSlotTileDrag.ts`     | Handle `bankTileId` in HTML5 `onDrop`; add touch `onDropOnBankTile` handler; import context for `bankTileIds` |
| `useTouchDrag.ts`        | Add `onDropOnBankTile` option + `findBankTileAt` helper; update bank-hit branches                             |

## Out of Scope

- No hover preview for the bank-tile swap target (could be added later).
- No sound or animation specific to this swap.
- No evaluation — the tile lands in the slot as-is (`isWrong: false, isLocked: false`).

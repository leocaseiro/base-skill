# Unified Slot Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `OrderedSlots` and `MatchingPairZones` with a single `<Slot>` compound component, add feedback animations, fix the mobile drag bug, and support sentence-gap inline slots.

**Architecture:** New `<Slot>` component built alongside existing components (parallel migration). A `useSlotBehavior` hook consolidates all drag/drop/click/keyboard logic and reads `slotInteraction` from config to choose between ordered evaluation and free-swap modes. Games migrate one at a time, old components are deleted last.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, @atlaskit/pragmatic-drag-and-drop, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-04-07-unified-slot-component-design.md`

---

## File Structure

### New Files

| File                                                              | Responsibility                                 |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `src/components/answer-game/Slot/Slot.tsx`                        | Unified slot component with render prop        |
| `src/components/answer-game/Slot/Slot.test.tsx`                   | Unit tests for Slot                            |
| `src/components/answer-game/Slot/SlotRow.tsx`                     | Layout wrapper (`<ol>` with flex)              |
| `src/components/answer-game/Slot/SlotRow.test.tsx`                | Unit tests for SlotRow                         |
| `src/components/answer-game/Slot/useSlotBehavior.ts`              | Hook: drag/drop/click/keyboard/animation logic |
| `src/components/answer-game/Slot/useSlotBehavior.test.ts`         | Hook tests                                     |
| `src/components/answer-game/Slot/slot-animations.ts`              | Shake, pop, auto-eject animation helpers       |
| `src/components/answer-game/Slot/slot-animations.test.ts`         | Animation helper tests                         |
| `src/components/answer-game/Slot/SentenceWithGaps.tsx`            | Template parser + inline slot renderer         |
| `src/components/answer-game/Slot/SentenceWithGaps.test.tsx`       | Parser + rendering tests                       |
| `src/components/answer-game/Slot/parse-sentence-template.ts`      | Pure function: `"The {0} sat"` → segments      |
| `src/components/answer-game/Slot/parse-sentence-template.test.ts` | Parser unit tests                              |
| `src/games/word-spell/build-sentence-gap-round.ts`                | Zone/tile generation from `GapDefinition[]`    |
| `src/games/word-spell/build-sentence-gap-round.test.ts`           | Round builder tests                            |

### Modified Files

| File                                                 | Change                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/answer-game/types.ts`                | Add `slotInteraction` to config, add `GapDefinition` type           |
| `src/components/answer-game/useTouchDrag.ts`         | Ghost cleanup on all terminal events, safety timeout                |
| `src/components/answer-game/useSlotTileDrag.ts`      | Deferred removal (SET_DRAG_ACTIVE on start, REMOVE_TILE on end)     |
| `src/styles.css`                                     | Add `shake`, `pop` keyframes and `--animate-shake`, `--animate-pop` |
| `src/games/word-spell/types.ts`                      | Add `gaps?: GapDefinition[]` to `WordSpellRound`                    |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` | Use `<SlotRow>` + `<Slot>` instead of `<NumberSequenceSlots>`       |
| `src/games/word-spell/WordSpell/WordSpell.tsx`       | Use `<SlotRow>` + `<Slot>` + `<SentenceWithGaps>`                   |
| `src/games/number-match/NumberMatch/NumberMatch.tsx` | Use `<SlotRow>` + `<Slot>` with dynamic sizing                      |

### Deleted Files (after migration)

| File                                          | Reason              |
| --------------------------------------------- | ------------------- |
| `src/components/answer-game/OrderedSlots/`    | Replaced by `Slot/` |
| `src/games/word-spell/OrderedLetterSlots/`    | No longer needed    |
| `src/games/sort-numbers/NumberSequenceSlots/` | No longer needed    |
| `src/games/number-match/MatchingPairZones/`   | No longer needed    |

---

## Phase 0: Foundation

### Task 1: Add `slotInteraction` to AnswerGameConfig and `GapDefinition` type

**Files:**

- Modify: `src/components/answer-game/types.ts`
- Modify: `src/games/word-spell/types.ts`

- [ ] **Step 1: Add `slotInteraction` to `AnswerGameConfig`**

In `src/components/answer-game/types.ts`, add the new field to the config interface:

```typescript
export interface AnswerGameConfig {
  gameId: string;
  inputMethod: 'drag' | 'type' | 'both';
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  tileBankMode: 'exact' | 'distractors';
  distractorCount?: number;
  totalRounds: number;
  roundsInOrder?: boolean;
  ttsEnabled: boolean;
  touchKeyboardInputMode?: 'text' | 'numeric' | 'none';
  initialTiles?: TileItem[];
  initialZones?: AnswerZone[];
  /** @default inferred: 'free-swap' for drag/both, 'ordered' for type */
  slotInteraction?: 'ordered' | 'free-swap';
}
```

- [ ] **Step 2: Add `GapDefinition` to word-spell types**

In `src/games/word-spell/types.ts`, add:

```typescript
export interface GapDefinition {
  word: string;
  distractors?: string[];
}

export interface WordSpellRound {
  word: string;
  emoji?: string;
  image?: string;
  /** Template with numbered gaps: "The {0} sat on the {1}." */
  sentence?: string;
  sceneImage?: string;
  audioOverride?: string;
  /** Gap definitions for sentence-gap mode. Each entry maps to a {N} placeholder. */
  gaps?: GapDefinition[];
}
```

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS (new fields are optional, no breaking changes)

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/types.ts src/games/word-spell/types.ts
git commit -m "feat: add slotInteraction config and GapDefinition type"
```

---

### Task 2: Add CSS keyframes for shake and pop animations

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1: Add keyframes and theme tokens**

In `src/styles.css`, add the keyframes after the existing `@keyframes blink` block:

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-4px);
  }

  40% {
    transform: translateX(4px);
  }

  60% {
    transform: translateX(-3px);
  }

  80% {
    transform: translateX(2px);
  }
}

@keyframes pop {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
  }
}
```

Inside the existing `@theme inline { ... }` block, add alongside `--animate-blink`:

```css
--animate-shake: shake 300ms ease-in-out;
--animate-pop: pop 250ms ease-out;
```

- [ ] **Step 2: Verify build**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat: add shake and pop CSS keyframes for slot feedback"
```

---

## Phase 1: Mobile Drag Bug Fix

### Task 3: Fix ghost element cleanup in useTouchDrag

**Files:**

- Modify: `src/components/answer-game/useTouchDrag.ts`

- [ ] **Step 1: Read the current useTouchDrag implementation**

Read the full file at `src/components/answer-game/useTouchDrag.ts` to understand the current ghost lifecycle.

- [ ] **Step 2: Add cleanup handlers for all terminal events**

The ghost element must be removed on `pointercancel`, `contextmenu`, `visibilitychange`, and `touchend` in addition to `pointerup`. Add a `cleanupGhost` function that:

1. Removes the ghost element from DOM
2. Releases pointer capture
3. Resets all drag state

Add a 5-second safety timeout that force-cleans the ghost if it still exists:

```typescript
// Inside the drag start logic, after creating the ghost:
const safetyTimer = globalThis.setTimeout(() => {
  cleanupGhost();
}, 5000);

// In cleanupGhost:
globalThis.clearTimeout(safetyTimer);
```

Register additional event listeners:

```typescript
document.addEventListener('contextmenu', cleanupGhost, { once: true });
document.addEventListener('visibilitychange', cleanupGhost, {
  once: true,
});
```

- [ ] **Step 3: Test on mobile simulator or device**

Verify: drag a tile from a slot, interrupt the gesture (switch tabs, receive notification), confirm no frozen ghost remains.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/useTouchDrag.ts
git commit -m "fix: clean up ghost element on all touch terminal events

Adds handlers for contextmenu, visibilitychange, and a 5s safety
timeout. Prevents frozen ghost tiles when touch gestures are
interrupted on mobile."
```

---

### Task 4: Defer tile removal in useSlotTileDrag

**Files:**

- Modify: `src/components/answer-game/useSlotTileDrag.ts`

- [ ] **Step 1: Read the current useSlotTileDrag implementation**

Read `src/components/answer-game/useSlotTileDrag.ts`. Note how `REMOVE_TILE` is dispatched immediately in `onDragStart`.

- [ ] **Step 2: Change to deferred removal**

Instead of dispatching `REMOVE_TILE` on drag start:

1. Dispatch `SET_DRAG_ACTIVE` with the `tileId` on drag start (keeps tile in slot visually but marks it as being dragged)
2. Dispatch `REMOVE_TILE` only on confirmed drag end (pointerup with successful drop or return)
3. If drag is cancelled, dispatch `SET_DRAG_ACTIVE` with `null` to restore the tile to its slot

```typescript
// On drag start:
dispatch({ type: 'SET_DRAG_ACTIVE', tileId });

// On successful drop (tile placed in another zone):
dispatch({ type: 'REMOVE_TILE', zoneIndex });
// Then place in new zone via placeTile callback

// On cancel/failed drop:
dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
```

- [ ] **Step 3: Run existing tests**

Run: `yarn test -- --run`
Expected: Some tests may need updates if they assert on immediate REMOVE_TILE behavior. Fix as needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/useSlotTileDrag.ts
git commit -m "fix: defer REMOVE_TILE dispatch to drag end

Dispatches SET_DRAG_ACTIVE on drag start instead of immediately
removing the tile. On cancel, the tile snaps back. Prevents
orphaned tiles when touch gestures are interrupted."
```

---

## Phase 2: Core Slot Component

### Task 5: Build SlotRow layout wrapper

**Files:**

- Create: `src/components/answer-game/Slot/SlotRow.tsx`
- Create: `src/components/answer-game/Slot/SlotRow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/answer-game/Slot/SlotRow.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SlotRow } from './SlotRow';

describe('SlotRow', () => {
  it('renders an ordered list with children', () => {
    render(
      <SlotRow>
        <li>Slot 1</li>
        <li>Slot 2</li>
      </SlotRow>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('applies className', () => {
    render(
      <SlotRow className="gap-4">
        <li>Slot</li>
      </SlotRow>,
    );
    const list = screen.getByRole('list');
    expect(list.className).toContain('gap-4');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/SlotRow.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/answer-game/Slot/SlotRow.tsx
import type { ReactNode } from 'react';

interface SlotRowProps {
  className?: string;
  children: ReactNode;
}

export const SlotRow = ({ className, children }: SlotRowProps) => (
  <ol
    className={['flex flex-wrap items-center justify-center', className]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </ol>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/SlotRow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/SlotRow.tsx src/components/answer-game/Slot/SlotRow.test.tsx
git commit -m "feat: add SlotRow layout wrapper component"
```

---

### Task 6: Build slot animation helpers

**Files:**

- Create: `src/components/answer-game/Slot/slot-animations.ts`
- Create: `src/components/answer-game/Slot/slot-animations.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/answer-game/Slot/slot-animations.test.ts
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { triggerShake, triggerPop } from './slot-animations';

describe('triggerShake', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('adds animate-shake class', () => {
    triggerShake(el);
    expect(el.classList.contains('animate-shake')).toBe(true);
  });

  it('removes class on animationend', () => {
    triggerShake(el);
    el.dispatchEvent(new Event('animationend'));
    expect(el.classList.contains('animate-shake')).toBe(false);
  });
});

describe('triggerPop', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('adds animate-pop class', () => {
    triggerPop(el);
    expect(el.classList.contains('animate-pop')).toBe(true);
  });

  it('removes class on animationend', () => {
    triggerPop(el);
    el.dispatchEvent(new Event('animationend'));
    expect(el.classList.contains('animate-pop')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/slot-animations.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/answer-game/Slot/slot-animations.ts

/** Adds animate-shake class, removes it on animationend. */
export const triggerShake = (el: HTMLElement): void => {
  el.classList.remove('animate-shake');
  // Force reflow to restart animation if already running
  void el.offsetWidth;
  el.classList.add('animate-shake');
  el.addEventListener(
    'animationend',
    () => el.classList.remove('animate-shake'),
    { once: true },
  );
};

/** Adds animate-pop class, removes it on animationend. */
export const triggerPop = (el: HTMLElement): void => {
  el.classList.remove('animate-pop');
  void el.offsetWidth;
  el.classList.add('animate-pop');
  el.addEventListener(
    'animationend',
    () => el.classList.remove('animate-pop'),
    { once: true },
  );
};

/**
 * Animates a tile sliding from its slot toward a target position,
 * then calls onComplete. Used for auto-eject return animation.
 */
export const triggerEjectReturn = (
  el: HTMLElement,
  targetEl: HTMLElement | null,
  onComplete: () => void,
): void => {
  if (!targetEl) {
    // Fallback: fade out in place
    el.style.transition = 'opacity 300ms ease-in';
    el.style.opacity = '0';
    el.addEventListener(
      'transitionend',
      () => {
        el.style.removeProperty('transition');
        el.style.removeProperty('opacity');
        onComplete();
      },
      { once: true },
    );
    return;
  }

  const slotRect = el.getBoundingClientRect();
  const bankRect = targetEl.getBoundingClientRect();
  const deltaX =
    bankRect.left +
    bankRect.width / 2 -
    (slotRect.left + slotRect.width / 2);
  const deltaY =
    bankRect.top +
    bankRect.height / 2 -
    (slotRect.top + slotRect.height / 2);

  el.style.transition =
    'transform 300ms ease-in, opacity 300ms ease-in';
  el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
  el.style.opacity = '0.7';

  el.addEventListener(
    'transitionend',
    () => {
      el.style.removeProperty('transition');
      el.style.removeProperty('transform');
      el.style.removeProperty('opacity');
      onComplete();
    },
    { once: true },
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/slot-animations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/slot-animations.ts src/components/answer-game/Slot/slot-animations.test.ts
git commit -m "feat: add slot animation helpers (shake, pop, eject return)"
```

---

### Task 7: Build useSlotBehavior hook

**Files:**

- Create: `src/components/answer-game/Slot/useSlotBehavior.ts`
- Create: `src/components/answer-game/Slot/useSlotBehavior.test.ts`

This is the core behavioral hook. It consolidates logic from `OrderedSlots` (drop target, drag source, click-to-remove, keyboard focus) and `MatchingPairZones` (free-swap drop handling).

- [ ] **Step 1: Write the failing tests**

Test the hook's returned state shape and behavior. Use `renderHook` with a mocked `AnswerGameContext`. Key tests:

```typescript
// src/components/answer-game/Slot/useSlotBehavior.test.ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSlotBehavior } from './useSlotBehavior';
// ... test wrapper setup with mocked AnswerGameProvider

describe('useSlotBehavior', () => {
  it('returns empty state for an unfilled slot', () => {
    // Render with zones[0].placedTileId = null
    // Assert: label === null, isEmpty === true, isWrong === false
  });

  it('returns filled state for a slot with a placed tile', () => {
    // Render with zones[0].placedTileId = 'tile-1'
    // Assert: label === 'A', isEmpty === false, tileId === 'tile-1'
  });

  it('marks slot as active when index matches activeSlotIndex in ordered mode', () => {
    // slotInteraction: 'ordered', activeSlotIndex: 0, index: 0
    // Assert: isActive === true
  });

  it('never marks slot as active in free-swap mode', () => {
    // slotInteraction: 'free-swap', activeSlotIndex: 0, index: 0
    // Assert: isActive === false
  });

  it('shows cursor only in ordered mode with type input', () => {
    // slotInteraction: 'ordered', inputMethod: 'both', empty slot, active
    // Assert: showCursor === true
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/useSlotBehavior.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

The hook reads all state from context and returns `SlotRenderProps` plus DOM refs and event handlers:

```typescript
// src/components/answer-game/Slot/useSlotBehavior.ts
import { useCallback, useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useTileEvaluation } from '../useTileEvaluation';
import { useFreeSwap } from '../useFreeSwap';
import { useSlotTileDrag } from '../useSlotTileDrag';
import { triggerShake, triggerPop } from './slot-animations';

export interface SlotRenderProps {
  label: string | null;
  tileId: string | null;
  isActive: boolean;
  isWrong: boolean;
  isLocked: boolean;
  isEmpty: boolean;
  showCursor: boolean;
}

interface UseSlotBehaviorReturn {
  renderProps: SlotRenderProps;
  slotRef: React.RefObject<HTMLElement | null>;
  tileRef: React.RefObject<HTMLButtonElement | null>;
  handleClick: () => void;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

export const useSlotBehavior = (
  index: number,
): UseSlotBehaviorReturn => {
  const { zones, allTiles, activeSlotIndex, config } =
    useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { placeTile } = useTileEvaluation();
  const { swapOrPlace } = useFreeSwap();

  const zone = zones[index];
  const tileId = zone?.placedTileId ?? null;
  const tile = tileId ? allTiles.find((t) => t.id === tileId) : null;
  const label = tile?.label ?? null;
  const isWrong = zone?.isWrong ?? false;
  const isLocked = zone?.isLocked ?? false;
  const isEmpty = tileId === null;

  // Resolve interaction mode: explicit config or inferred from inputMethod
  const slotInteraction =
    config.slotInteraction ??
    (config.inputMethod === 'type' ? 'ordered' : 'free-swap');
  const isOrdered = slotInteraction === 'ordered';

  const isActive = isOrdered && activeSlotIndex === index;
  const showCursor =
    isActive && isEmpty && config.inputMethod !== 'drag';

  const slotRef = useRef<HTMLElement | null>(null);
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const prevIsWrongRef = useRef(isWrong);

  // Drop target handler — choose evaluation or swap based on interaction mode
  const handleDrop = useCallback(
    (droppedTileId: string) => {
      if (isOrdered) {
        placeTile(droppedTileId, index);
      } else {
        swapOrPlace(droppedTileId, index);
      }
    },
    [isOrdered, placeTile, swapOrPlace, index],
  );

  // Register as drop target
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ zoneIndex: index }),
      onDrop: ({ source }) => {
        const sourceTileId = source.data['tileId'];
        if (typeof sourceTileId === 'string') {
          handleDrop(sourceTileId);
        }
      },
    });
  }, [index, handleDrop]);

  // Drag source for filled slots
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useSlotTileDrag({
      ref: tileRef,
      tileId,
      label,
      zoneIndex: index,
      onDrop: handleDrop,
    });

  // Click handler: remove tile from slot (returns to bank)
  const handleClick = useCallback(() => {
    if (isEmpty) return;
    dispatch({ type: 'REMOVE_TILE', zoneIndex: index });
  }, [isEmpty, dispatch, index]);

  // Feedback animations: trigger on state transitions
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    const wasWrong = prevIsWrongRef.current;
    prevIsWrongRef.current = isWrong;

    if (isWrong && !wasWrong) {
      triggerShake(el);
    } else if (!isEmpty && !isWrong && wasWrong) {
      // Transitioned from wrong to correct (unlikely but safe)
      triggerPop(el);
    } else if (!isEmpty && !isWrong && !wasWrong && label !== null) {
      // Freshly filled with correct tile
      triggerPop(el);
    }
  }, [isWrong, isEmpty, label]);

  return {
    renderProps: {
      label,
      tileId,
      isActive,
      isWrong,
      isLocked,
      isEmpty,
      showCursor,
    },
    slotRef,
    tileRef,
    handleClick,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
};
```

**Important:** The `triggerPop` on correct placement needs refinement — it should only fire when a tile is newly placed (not on re-render). Track previous `tileId` to detect fresh placements:

```typescript
const prevTileIdRef = useRef(tileId);
// In the useEffect:
const prevTileId = prevTileIdRef.current;
prevTileIdRef.current = tileId;
const freshlyPlaced = tileId !== null && prevTileId === null;
if (freshlyPlaced && !isWrong) {
  triggerPop(el);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/useSlotBehavior.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/useSlotBehavior.ts src/components/answer-game/Slot/useSlotBehavior.test.ts
git commit -m "feat: add useSlotBehavior hook with evaluation, free-swap, and animations"
```

---

### Task 8: Build the `<Slot>` component

**Files:**

- Create: `src/components/answer-game/Slot/Slot.tsx`
- Create: `src/components/answer-game/Slot/Slot.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/answer-game/Slot/Slot.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slot } from './Slot';
// ... test wrapper with mocked AnswerGameProvider

describe('Slot', () => {
  it('renders as li by default', () => {
    render(
      <Wrapper>
        <Slot index={0} className="size-14">
          {({ label }) => <span>{label ?? 'empty'}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('renders as span when as="span"', () => {
    render(
      <Wrapper>
        <Slot index={0} as="span" className="inline-block">
          {({ label }) => <span>{label ?? 'empty'}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows empty label for unfilled slot', () => {
    // zones[0].placedTileId = null
    render(
      <Wrapper>
        <Slot index={0} className="size-14">
          {({ label }) => <span>{label ?? 'empty'}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('shows tile label for filled slot', () => {
    // zones[0].placedTileId = 'tile-1', tile label = 'A'
    render(
      <Wrapper>
        <Slot index={0} className="size-14">
          {({ label }) => <span>{label}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies className to the slot element', () => {
    render(
      <Wrapper>
        <Slot index={0} className="size-14 rounded-lg">
          {({ label }) => <span>{label}</span>}
        </Slot>
      </Wrapper>,
    );
    const slot = screen.getByRole('listitem');
    expect(slot.className).toContain('size-14');
    expect(slot.className).toContain('rounded-lg');
  });

  it('has correct aria-label when empty', () => {
    render(
      <Wrapper>
        <Slot index={0} className="size-14">
          {({ label }) => <span>{label}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(screen.getByLabelText('Slot 1, empty')).toBeInTheDocument();
  });

  it('has correct aria-label when filled', () => {
    // zones[0].placedTileId = 'tile-1', tile label = 'A'
    render(
      <Wrapper>
        <Slot index={0} className="size-14">
          {({ label }) => <span>{label}</span>}
        </Slot>
      </Wrapper>,
    );
    expect(
      screen.getByLabelText('Slot 1, filled with A'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/answer-game/Slot/Slot.tsx
import type { ReactNode } from 'react';
import { useSlotBehavior } from './useSlotBehavior';
import type { SlotRenderProps } from './useSlotBehavior';

interface SlotProps {
  index: number;
  as?: 'li' | 'span' | 'div';
  className?: string;
  children: (props: SlotRenderProps) => ReactNode;
}

export const Slot = ({
  index,
  as: Tag = 'li',
  className,
  children,
}: SlotProps) => {
  const {
    renderProps,
    slotRef,
    tileRef,
    handleClick,
    pointerHandlers,
  } = useSlotBehavior(index);

  const { label, isEmpty, isWrong, isActive, showCursor } = renderProps;

  const ariaLabel = isEmpty
    ? `Slot ${index + 1}, empty`
    : `Slot ${index + 1}, filled with ${label}`;

  const stateClasses = [
    'relative flex items-center justify-center border-2 transition-all',
    isEmpty && !isActive
      ? 'border-border'
      : isEmpty && isActive
        ? 'border-primary ring-2 ring-primary ring-offset-2'
        : isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-primary bg-primary/10 text-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={slotRef as React.Ref<HTMLElement>}
      aria-label={ariaLabel}
      data-zone-index={index}
      className={[stateClasses, className].filter(Boolean).join(' ')}
    >
      {!isEmpty ? (
        <button
          ref={tileRef}
          type="button"
          className="flex size-full touch-none select-none cursor-grab items-center justify-center"
          onClick={handleClick}
          onPointerDown={pointerHandlers.onPointerDown}
          onPointerMove={pointerHandlers.onPointerMove}
          onPointerUp={pointerHandlers.onPointerUp}
          onPointerCancel={pointerHandlers.onPointerCancel}
        >
          {children(renderProps)}
        </button>
      ) : (
        <>
          {children(renderProps)}
          {showCursor ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-sm bg-primary animate-blink"
            />
          ) : null}
        </>
      )}
    </Tag>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `yarn test -- --run`
Expected: PASS (new component, no regressions)

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx src/components/answer-game/Slot/Slot.test.tsx
git commit -m "feat: add unified Slot component with compound render prop pattern"
```

---

## Phase 3: Skeuomorphic Drag Effects

### Task 9: Update ghost styling and add "hole" effect

**Files:**

- Modify: `src/components/answer-game/useTouchDrag.ts` (ghost styling)
- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx` (hole in bank)
- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` (hole in bank)
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` (hole in bank)

- [ ] **Step 1: Update ghost element styling in useTouchDrag**

In `buildGhost` function, update the shadow and scale to the skeuomorphic values:

```typescript
boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
transform: 'scale(1.08)',
opacity: '0.95',
```

- [ ] **Step 2: Add "hole" rendering in tile bank components**

Each tile bank should read `dragActiveTileId` from context. When a tile is being dragged, render a placeholder "hole" instead of hiding the tile:

```tsx
// In each TileBank component:
const { allTiles, bankTileIds, dragActiveTileId } =
  useAnswerGameContext();

// For each tile in the bank:
const isDragging = tile.id === dragActiveTileId;
if (isDragging) {
  return (
    <div
      key={tile.id}
      className="size-14 rounded-xl bg-muted/30 shadow-inner"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 3: Test visually**

Start storybook or dev server, drag a tile from the bank, verify:

- Ghost has deeper shadow and slight scale-up
- A subtle indent/hole appears where the tile was in the bank

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/useTouchDrag.ts src/games/word-spell/LetterTileBank/LetterTileBank.tsx src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
git commit -m "feat: add skeuomorphic drag effect with lift shadow and bank hole"
```

---

## Phase 4: Game Migration

### Task 10: Migrate SortNumbers to use `<Slot>`

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Read current SortNumbers implementation**

Read `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` to understand how `NumberSequenceSlots` is used.

- [ ] **Step 2: Replace NumberSequenceSlots with Slot + SlotRow**

In `SortNumbersSession`, replace:

```tsx
<AnswerGame.Answer>
  <NumberSequenceSlots />
</AnswerGame.Answer>
```

With:

```tsx
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';

// Inside the component:
const { zones } = useAnswerGameContext();

<AnswerGame.Answer>
  <SlotRow className="gap-2">
    {zones.map((zone, i) => (
      <Slot key={zone.id} index={i} className="size-14 rounded-lg">
        {({ label }) => (
          <span className="text-2xl font-bold">{label}</span>
        )}
      </Slot>
    ))}
  </SlotRow>
</AnswerGame.Answer>;
```

- [ ] **Step 3: Add `slotInteraction` to the config**

In the `answerGameConfig` useMemo:

```typescript
slotInteraction: 'free-swap' as const,
```

- [ ] **Step 4: Run existing SortNumbers tests**

Run: `yarn vitest run src/games/sort-numbers/`
Expected: PASS (behavior should be identical)

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "refactor: migrate SortNumbers to unified Slot component"
```

---

### Task 11: Migrate WordSpell to use `<Slot>`

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

- [ ] **Step 1: Replace OrderedLetterSlots with Slot + SlotRow**

In `WordSpellSession`, replace:

```tsx
<AnswerGame.Answer>
  <OrderedLetterSlots />
</AnswerGame.Answer>
```

With:

```tsx
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';

const { zones } = useAnswerGameContext();

<AnswerGame.Answer>
  <SlotRow className="gap-2">
    {zones.map((zone, i) => (
      <Slot key={zone.id} index={i} className="size-14 rounded-lg">
        {({ label }) => (
          <span className="text-2xl font-bold">{label}</span>
        )}
      </Slot>
    ))}
  </SlotRow>
</AnswerGame.Answer>;
```

- [ ] **Step 2: Set `slotInteraction` based on mode**

In the `answerGameConfig` useMemo:

```typescript
slotInteraction: config.mode === 'scramble' ? 'free-swap' : 'ordered',
```

- [ ] **Step 3: Run existing WordSpell tests**

Run: `yarn vitest run src/games/word-spell/`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "refactor: migrate WordSpell to unified Slot component"
```

---

### Task 12: Migrate NumberMatch to use `<Slot>` with dynamic sizing

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Replace MatchingPairZones with Slot + SlotRow**

In `NumberMatchSession`, replace `<MatchingPairZones />` with:

```tsx
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import {
  DiceFace,
  DominoTile,
} from '../NumeralTileBank/NumeralTileBank';

const { zones, allTiles } = useAnswerGameContext();

// Determine if any number exceeds 6 (domino format needed)
const allDice = allTiles.every((t) => {
  const n = Number.parseInt(t.value, 10);
  return !Number.isNaN(n) && n <= 6;
});
const slotClass = allDice
  ? 'size-20 rounded-2xl'
  : 'h-[72px] w-32 rounded-2xl';

<AnswerGame.Answer>
  <SlotRow className="gap-4">
    {zones.map((zone, i) => (
      <Slot key={zone.id} index={i} className={slotClass}>
        {({ label }) => {
          if (!label) return null;
          const n = Number.parseInt(label, 10);
          if (
            numberMatchConfig.tileStyle === 'dots' &&
            !Number.isNaN(n)
          ) {
            return n <= 6 ? (
              <DiceFace value={n} />
            ) : (
              <DominoTile value={n} />
            );
          }
          return (
            <span className="text-3xl font-bold tabular-nums">
              {label}
            </span>
          );
        }}
      </Slot>
    ))}
  </SlotRow>
</AnswerGame.Answer>;
```

- [ ] **Step 2: Set `slotInteraction` to `free-swap`**

In the `answerGameConfig` useMemo:

```typescript
slotInteraction: 'free-swap' as const,
```

- [ ] **Step 3: Run existing NumberMatch tests**

Run: `yarn vitest run src/games/number-match/`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "refactor: migrate NumberMatch to unified Slot with dynamic dice/domino sizing"
```

---

## Phase 5: Sentence-Gap Support

### Task 13: Build sentence template parser

**Files:**

- Create: `src/components/answer-game/Slot/parse-sentence-template.ts`
- Create: `src/components/answer-game/Slot/parse-sentence-template.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/answer-game/Slot/parse-sentence-template.test.ts
import { describe, expect, it } from 'vitest';
import { parseSentenceTemplate } from './parse-sentence-template';

describe('parseSentenceTemplate', () => {
  it('parses a single gap', () => {
    const result = parseSentenceTemplate('The {0} sat on the mat.');
    expect(result).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'gap', index: 0 },
      { type: 'text', value: ' sat on the mat.' },
    ]);
  });

  it('parses multiple gaps', () => {
    const result = parseSentenceTemplate('The {0} sat on the {1}.');
    expect(result).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'gap', index: 0 },
      { type: 'text', value: ' sat on the ' },
      { type: 'gap', index: 1 },
      { type: 'text', value: '.' },
    ]);
  });

  it('handles gap at start', () => {
    const result = parseSentenceTemplate('{0} is a cat.');
    expect(result).toEqual([
      { type: 'gap', index: 0 },
      { type: 'text', value: ' is a cat.' },
    ]);
  });

  it('handles gap at end', () => {
    const result = parseSentenceTemplate('I see a {0}');
    expect(result).toEqual([
      { type: 'text', value: 'I see a ' },
      { type: 'gap', index: 0 },
    ]);
  });

  it('handles no gaps (plain text)', () => {
    const result = parseSentenceTemplate('No gaps here.');
    expect(result).toEqual([{ type: 'text', value: 'No gaps here.' }]);
  });

  it('handles adjacent gaps', () => {
    const result = parseSentenceTemplate('{0}{1}');
    expect(result).toEqual([
      { type: 'gap', index: 0 },
      { type: 'gap', index: 1 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/parse-sentence-template.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/answer-game/Slot/parse-sentence-template.ts
export type TextSegment = { type: 'text'; value: string };
export type GapSegment = { type: 'gap'; index: number };
export type SentenceSegment = TextSegment | GapSegment;

const GAP_REGEX = /\{(\d+)\}/g;

export const parseSentenceTemplate = (
  template: string,
): SentenceSegment[] => {
  const segments: SentenceSegment[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(GAP_REGEX)) {
    const matchStart = match.index;
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        value: template.slice(lastIndex, matchStart),
      });
    }
    segments.push({
      type: 'gap',
      index: Number.parseInt(match[1]!, 10),
    });
    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'text', value: template.slice(lastIndex) });
  }

  return segments;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/parse-sentence-template.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/parse-sentence-template.ts src/components/answer-game/Slot/parse-sentence-template.test.ts
git commit -m "feat: add sentence template parser for {N} gap placeholders"
```

---

### Task 14: Build `<SentenceWithGaps>` component

**Files:**

- Create: `src/components/answer-game/Slot/SentenceWithGaps.tsx`
- Create: `src/components/answer-game/Slot/SentenceWithGaps.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/answer-game/Slot/SentenceWithGaps.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SentenceWithGaps } from './SentenceWithGaps';
// ... test wrapper with mocked AnswerGameProvider

describe('SentenceWithGaps', () => {
  it('renders text segments as spans', () => {
    // sentence: "The {0} sat."
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat." />
      </Wrapper>,
    );
    expect(screen.getByText('The')).toBeInTheDocument();
    expect(screen.getByText('sat.')).toBeInTheDocument();
  });

  it('renders gap slots inline', () => {
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat." />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Slot 1, empty')).toBeInTheDocument();
  });

  it('renders multiple gaps', () => {
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat on the {1}." />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Slot 1, empty')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 2, empty')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/SentenceWithGaps.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/answer-game/Slot/SentenceWithGaps.tsx
import { Slot } from './Slot';
import { parseSentenceTemplate } from './parse-sentence-template';

interface SentenceWithGapsProps {
  sentence: string;
  className?: string;
}

export const SentenceWithGaps = ({
  sentence,
  className,
}: SentenceWithGapsProps) => {
  const segments = parseSentenceTemplate(sentence);

  return (
    <p
      className={['text-lg leading-relaxed', className]
        .filter(Boolean)
        .join(' ')}
    >
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <Slot
            key={`gap-${String(seg.index)}`}
            index={seg.index}
            as="span"
            className="mx-1 inline-flex min-w-16 items-center justify-center border-b-2 border-dashed px-2 align-baseline"
          >
            {({ label }) => (
              <span className="text-lg font-bold">
                {label ?? '\u00A0'}
              </span>
            )}
          </Slot>
        ),
      )}
    </p>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/SentenceWithGaps.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/SentenceWithGaps.tsx src/components/answer-game/Slot/SentenceWithGaps.test.tsx
git commit -m "feat: add SentenceWithGaps component for inline gap slots"
```

---

### Task 15: Build `buildSentenceGapRound` helper

**Files:**

- Create: `src/games/word-spell/build-sentence-gap-round.ts`
- Create: `src/games/word-spell/build-sentence-gap-round.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/games/word-spell/build-sentence-gap-round.test.ts
import { describe, expect, it } from 'vitest';
import { buildSentenceGapRound } from './build-sentence-gap-round';

describe('buildSentenceGapRound', () => {
  it('creates one zone per gap', () => {
    const { zones } = buildSentenceGapRound([
      { word: 'cat' },
      { word: 'mat' },
    ]);
    expect(zones).toHaveLength(2);
    expect(zones[0]!.expectedValue).toBe('cat');
    expect(zones[1]!.expectedValue).toBe('mat');
  });

  it('creates tiles from gap words', () => {
    const { tiles } = buildSentenceGapRound([{ word: 'cat' }]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.value).toBe('cat');
  });

  it('includes distractors in tiles', () => {
    const { tiles } = buildSentenceGapRound([
      { word: 'cat', distractors: ['dog', 'bat'] },
    ]);
    expect(tiles).toHaveLength(3);
    const values = tiles.map((t) => t.value).sort();
    expect(values).toEqual(['bat', 'cat', 'dog']);
  });

  it('includes distractors from multiple gaps', () => {
    const { tiles } = buildSentenceGapRound([
      { word: 'cat', distractors: ['dog'] },
      { word: 'mat', distractors: ['hat'] },
    ]);
    expect(tiles).toHaveLength(4);
    const values = tiles.map((t) => t.value).sort();
    expect(values).toEqual(['cat', 'dog', 'hat', 'mat']);
  });

  it('zones have sequential indices', () => {
    const { zones } = buildSentenceGapRound([
      { word: 'a' },
      { word: 'b' },
      { word: 'c' },
    ]);
    expect(zones.map((z) => z.index)).toEqual([0, 1, 2]);
  });

  it('zones start with empty state', () => {
    const { zones } = buildSentenceGapRound([{ word: 'cat' }]);
    expect(zones[0]!.placedTileId).toBeNull();
    expect(zones[0]!.isWrong).toBe(false);
    expect(zones[0]!.isLocked).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/games/word-spell/build-sentence-gap-round.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/games/word-spell/build-sentence-gap-round.ts
import { nanoid } from 'nanoid';
import type { GapDefinition } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
}

export const buildSentenceGapRound = (
  gaps: GapDefinition[],
): { tiles: TileItem[]; zones: AnswerZone[] } => {
  const zones: AnswerZone[] = gaps.map((gap, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: gap.word,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));

  const allWords = [
    ...gaps.map((g) => g.word),
    ...gaps.flatMap((g) => g.distractors ?? []),
  ];

  shuffleInPlace(allWords);

  const tiles: TileItem[] = allWords.map((word) => ({
    id: nanoid(),
    label: word,
    value: word,
  }));

  return { tiles, zones };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/games/word-spell/build-sentence-gap-round.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/build-sentence-gap-round.ts src/games/word-spell/build-sentence-gap-round.test.ts
git commit -m "feat: add buildSentenceGapRound for sentence-gap zone/tile generation"
```

---

### Task 16: Wire sentence-gap mode in WordSpell

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

- [ ] **Step 1: Import SentenceWithGaps and buildSentenceGapRound**

```typescript
import { SentenceWithGaps } from '@/components/answer-game/Slot/SentenceWithGaps';
import { buildSentenceGapRound } from '../build-sentence-gap-round';
```

- [ ] **Step 2: Update buildTilesAndZones to handle gaps**

In `WordSpell.tsx`, update the initial setup to detect `gaps`:

```typescript
// In the outer WordSpell component, when computing tiles/zones:
const { tiles, zones } = useMemo(() => {
  if (!roundWord)
    return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };

  // Sentence-gap with gaps array: use gap-based generation
  const firstRound = round0;
  if (firstRound?.gaps && firstRound.gaps.length > 0) {
    return buildSentenceGapRound(firstRound.gaps);
  }

  // Default: letter/syllable/word spelling
  return buildTilesAndZones(roundWord, config.tileUnit);
}, [roundWord, config.tileUnit, round0]);
```

- [ ] **Step 3: Update the session rendering to use SentenceWithGaps when gaps exist**

In `WordSpellSession`, update the sentence-gap rendering:

```tsx
{
  wordSpellConfig.mode === 'sentence-gap' && round.sentence ? (
    round.gaps && round.gaps.length > 0 ? (
      // Interactive sentence with inline gap slots
      <SentenceWithGaps
        sentence={round.sentence}
        className="max-w-md text-center text-foreground"
      />
    ) : (
      // Fallback: static sentence text (backward compat)
      <p className="max-w-md text-center text-lg text-foreground">
        {round.sentence}
      </p>
    )
  ) : null;
}
```

When using `SentenceWithGaps`, the `<AnswerGame.Answer>` section with `<SlotRow>` should be conditionally hidden (gaps are inline in the sentence instead):

```tsx
<AnswerGame.Answer>
  {!(round.gaps && round.gaps.length > 0) ? (
    <SlotRow className="gap-2">
      {zones.map((zone, i) => (
        <Slot key={zone.id} index={i} className="size-14 rounded-lg">
          {({ label }) => (
            <span className="text-2xl font-bold">{label}</span>
          )}
        </Slot>
      ))}
    </SlotRow>
  ) : null}
</AnswerGame.Answer>
```

- [ ] **Step 4: Set `slotInteraction` for sentence-gap**

```typescript
slotInteraction:
  config.mode === 'scramble' || config.mode === 'sentence-gap'
    ? 'free-swap'
    : 'ordered',
```

- [ ] **Step 5: Update ADVANCE_ROUND logic for sentence-gap**

In the `useEffect` that handles round advancement, add gap-aware round building:

```typescript
if (nextRound?.gaps && nextRound.gaps.length > 0) {
  const { tiles, zones } = buildSentenceGapRound(nextRound.gaps);
  dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
} else {
  const { tiles, zones } = buildTilesAndZones(
    word,
    wordSpellConfig.tileUnit,
  );
  dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
}
```

- [ ] **Step 6: Run tests**

Run: `yarn vitest run src/games/word-spell/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat: wire sentence-gap mode with SentenceWithGaps and inline slots"
```

---

## Phase 6: Cleanup

### Task 17: Delete old slot components

**Files:**

- Delete: `src/components/answer-game/OrderedSlots/` (entire directory)
- Delete: `src/games/word-spell/OrderedLetterSlots/` (entire directory)
- Delete: `src/games/sort-numbers/NumberSequenceSlots/` (entire directory)
- Delete: `src/games/number-match/MatchingPairZones/` (entire directory)

- [ ] **Step 1: Verify no remaining imports of old components**

Run: `grep -r "OrderedSlots\|OrderedLetterSlots\|NumberSequenceSlots\|MatchingPairZones" src/ --include="*.ts" --include="*.tsx" -l`

Expected: No files should reference these components (only the files we're about to delete).

If any imports remain, update them first.

- [ ] **Step 2: Delete the directories**

```bash
rm -rf src/components/answer-game/OrderedSlots/
rm -rf src/games/word-spell/OrderedLetterSlots/
rm -rf src/games/sort-numbers/NumberSequenceSlots/
rm -rf src/games/number-match/MatchingPairZones/
```

- [ ] **Step 3: Run full test suite**

Run: `yarn test -- --run`
Expected: PASS

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 5: Run lint**

Run: `yarn lint`
Expected: PASS (knip should no longer flag unused exports)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove old OrderedSlots and MatchingPairZones components

Replaced by the unified Slot component in all three games."
```

---

## Phase 7: Storybook Stories

### Task 18: Add Storybook stories for Slot component

**Files:**

- Create: `src/components/answer-game/Slot/Slot.stories.tsx`

- [ ] **Step 1: Create stories covering all variants**

```tsx
// src/components/answer-game/Slot/Slot.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Slot } from './Slot';
import { SlotRow } from './SlotRow';
// ... AnswerGame wrapper with mock config

const meta: Meta = {
  title: 'AnswerGame/Slot',
  // decorators with AnswerGame provider
};

export default meta;

export const EmptyLetterSlots: StoryObj = {
  // 3 empty letter-sized slots
};

export const FilledLetterSlots: StoryObj = {
  // 3 slots with letters C, A, T
};

export const WrongPlacement: StoryObj = {
  // Slot with wrong tile (red/shake)
};

export const DiceSlots: StoryObj = {
  // NumberMatch-style 80px slots with dice faces
};

export const DominoSlots: StoryObj = {
  // NumberMatch-style rectangle slots with domino tiles
};

export const InlineSentenceGap: StoryObj = {
  // "The ___ sat on the mat." with inline gap slot
};
```

- [ ] **Step 2: Verify stories render**

Run: `yarn storybook` and verify all stories render correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/answer-game/Slot/Slot.stories.tsx
git commit -m "feat: add Storybook stories for unified Slot component"
```

---

## Verification

### Manual Testing Checklist

1. **WordSpell picture mode**: Letters fill left-to-right, cursor blinks, correct/wrong feedback with shake/pop
2. **WordSpell scramble mode**: Free-swap between slots, drag tiles back and forth
3. **WordSpell sentence-gap mode**: Inline gaps in sentence, drag words into gaps
4. **SortNumbers**: Drag numbers into order, free-swap between slots
5. **NumberMatch (≤6)**: All slots square (dice), drag to match
6. **NumberMatch (>6)**: All slots rectangular (domino), drag to match
7. **Mobile**: No frozen ghost tiles on interrupted drag
8. **Skeuomorphic**: Lift shadow on drag, hole in bank, consistent both directions
9. **Auto-eject**: Wrong → shake → red pause → slide back to bank
10. **Keyboard**: Type mode works in ordered slot interaction

### Automated Tests

```bash
yarn lint          # ESLint + Knip (no unused exports)
yarn typecheck     # TypeScript
yarn test -- --run # Vitest unit tests
```

### Test Files to Run

```bash
yarn vitest run src/components/answer-game/Slot/
yarn vitest run src/games/word-spell/
yarn vitest run src/games/sort-numbers/
yarn vitest run src/games/number-match/
```

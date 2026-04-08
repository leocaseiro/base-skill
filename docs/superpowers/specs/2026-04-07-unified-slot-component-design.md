# Unified Slot Component Design

**Date:** 2026-04-07
**Status:** Approved
**Approach:** New component, parallel migration (Approach A)

## Context

The answer-game framework has two slot components that serve nearly identical purposes:

- `OrderedSlots` (used by WordSpell and SortNumbers) — auto-advancing sequential slots with keyboard input support
- `MatchingPairZones` (used by NumberMatch) — free-swap slots, drag-only

These components share ~80% of their code (drag source, drop target, click-to-remove, state styling) but diverge on interaction mode and sizing. This duplication blocks reuse for upcoming features (scramble mode, sentence-gap) and makes it harder to deliver consistent animations and drag behavior across games.

Additionally, the current drag system has a mobile bug (frozen ghost tiles) and lacks visual polish (no feedback animations, inconsistent drag effects between bank↔slot directions).

## Goals

1. **Unify** `OrderedSlots` and `MatchingPairZones` into a single `<Slot>` compound component
2. **Add feedback animations** — shake on wrong, pop/bounce on correct, animated auto-eject return
3. **Fix mobile drag bug** — frozen ghost tiles when touch gestures are interrupted
4. **Skeuomorphic drag** — consistent "lift + hole" effect in both directions (bank→slot, slot→bank)
5. **Dynamic slot sizing** — slots adapt to content (letters, dice, dominoes, words)
6. **Sentence-gap support** — inline droppable gaps within sentence text, with multi-gap support

## 1. Unified Slot Component

### Location

`src/components/answer-game/Slot/`

### Pattern: Compound Component with Render Prop

The `<Slot>` component owns all behavior; the consumer controls visual content via a render function.

```tsx
// WordSpell — small square letter slots
<SlotRow className="gap-2">
  {zones.map((zone, i) => (
    <Slot key={zone.id} index={i} className="size-14 rounded-lg">
      {({ label }) => <span className="text-2xl font-bold">{label}</span>}
    </Slot>
  ))}
</SlotRow>

// NumberMatch — dice content inside larger slots
<SlotRow className="gap-4">
  {zones.map((zone, i) => (
    <Slot key={zone.id} index={i} className="size-20 rounded-2xl">
      {({ label }) =>
        label ? <DiceFace value={Number(label)} /> : null
      }
    </Slot>
  ))}
</SlotRow>

// Sentence-gap — inline slots within text
<p className="text-lg leading-relaxed">
  The{' '}
  <Slot index={0} as="span" className="inline-block min-w-16 border-b-2 border-dashed mx-1">
    {({ label }) => <span className="text-lg font-bold">{label ?? '\u00A0'}</span>}
  </Slot>
  {' '}sat on the mat.
</p>
```

### What `<Slot>` Owns (Behavior)

- Drop target registration (pragmatic DnD + touch via `useTouchDrag`)
- Drag source when filled (for removing/swapping)
- Click-to-remove handler
- Keyboard input focus (when `inputMethod` includes `'type'`)
- Correct/wrong state styling (border + background colors)
- Feedback animations (shake, pop, auto-eject return)
- Active slot cursor (blinking underline, only in `ordered` interaction mode)
- Accessibility (aria-labels, roles)

### What the Consumer Owns (Rendering)

- Inner content (letter, number, dice face, word, image) via render prop
- Size and shape via `className` (`size-14`, `size-20`, `h-[72px] w-32`, inline)
- HTML element via `as` prop (`li` default, `span` for inline gaps)

### Render Prop Signature

```tsx
interface SlotRenderProps {
  label: string | null; // placed tile's label, or null if empty
  tileId: string | null; // placed tile's ID
  isActive: boolean; // this slot is the current auto-advance target
  isWrong: boolean; // placed tile is incorrect
  isLocked: boolean; // tile is locked (wrong + lock mode)
  isEmpty: boolean; // no tile placed
  showCursor: boolean; // should show blinking cursor (type/both mode + ordered)
}

interface SlotProps {
  index: number;
  as?: 'li' | 'span' | 'div';
  className?: string;
  children: (props: SlotRenderProps) => React.ReactNode;
}
```

### `SlotRow` Wrapper

Optional layout wrapper for row-based slot arrangements:

```tsx
interface SlotRowProps {
  className?: string;
  children: React.ReactNode;
}

// Renders <ol> with flex layout, role="list"
```

### Config: `slotInteraction` (New Field)

Added to `AnswerGameConfig`:

```typescript
interface AnswerGameConfig {
  // ... existing fields ...
  slotInteraction: 'ordered' | 'free-swap';
}
```

- **`ordered`**: Active slot highlighted, auto-advances on placement. Used for letter-spelling (picture, recall modes).
- **`free-swap`**: No active slot, tiles can be swapped between any slots. Used for scramble, NumberMatch, SortNumbers.
- **Default**: `'free-swap'` when `inputMethod` is `'drag'` or `'both'`; `'ordered'` when `inputMethod` is `'type'`.

## 2. Feedback Animations

### Wrong Placement — Shake + Red Flash (~400ms)

1. Tile lands in slot → `wrong.mp3` plays
2. Slot border/bg turns `border-destructive bg-destructive/10 text-destructive`
3. CSS `animate-shake`: horizontal oscillation (±4px, 3 cycles, 300ms)
4. Brief red flash overlay fades out (100ms)
5. Behavior continues per `wrongTileBehavior` setting

### Correct Placement — Pop/Bounce (~250ms)

1. Tile lands in slot → `correct.mp3` plays
2. Slot scales up (`scale(1.08)`) then settles back (`scale(1)`) — spring-like ease
3. Border/bg transitions to `border-primary bg-primary/10 text-primary`

### CSS Keyframes

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

Added to `src/styles.css` alongside existing `animate-blink`.

## 3. Skeuomorphic Drag Effect

### Lift Effect (Both Directions)

When drag starts (from bank OR slot):

- **Touch ghost**: `boxShadow: 0 12px 32px rgba(0,0,0,0.3)`, `transform: scale(1.08)`, `opacity: 0.95`
- **Desktop**: Custom drag preview via pragmatic DnD `setCustomNativeDragPreview` with matching shadow/scale

### "Hole" Left Behind

Where the tile was picked up from:

- **In bank**: tile spot shows `bg-muted/30` + `shadow-inner` + `rounded-xl` — an indent/depression. Uses existing `dragActiveTileId` state (via `SET_DRAG_ACTIVE` action) to keep the tile's spot visible in the bank instead of removing it from the list.
- **In slot**: slot shows dashed border + `bg-muted/20` — slightly darker than normal empty to suggest "something was here"
- Hole disappears when tile is dropped (placed or returned)

### Consistency

Same lifted styling regardless of drag direction (bank→slot or slot→bank), same on desktop and mobile.

## 4. Auto-Eject Return Animation

### Sequence (~1300ms total)

| Time        | What happens                                                                                |
| ----------- | ------------------------------------------------------------------------------------------- |
| 0–300ms     | Shake animation plays (wrong feedback from Section 2)                                       |
| 300–1000ms  | Tile sits locked in slot with red styling (existing `AUTO_EJECT_DELAY_MS`)                  |
| 1000–1300ms | Tile animates back: slides toward tile bank center, `scale(0.8)`, `opacity: 0.7`, `ease-in` |
| 1300ms      | `EJECT_TILE` dispatched, tile reappears in bank at normal size                              |

### Implementation

- Before ejecting, measure slot position and bank container center
- Apply CSS transition with calculated `translate(deltaX, deltaY)` + scale + opacity
- On `transitionend` event, dispatch `EJECT_TILE`
- **Fallback**: if DOM measurement fails, fade out in place (graceful degradation)

## 5. Mobile Drag Bug Fix

### Root Cause

In `useSlotTileDrag.ts`, `REMOVE_TILE` dispatches immediately on drag start. If the touch gesture is interrupted (cancelled, leaves viewport, multi-touch conflict), the tile is removed from state but the ghost element lingers — creating frozen overlays (visible in the reported iPhone 17 screenshot with tiles 51 and 58).

### Fix (Three-Part)

1. **Ghost cleanup on all terminal events**: Register handlers for `pointercancel`, `pointerup`, `contextmenu`, `visibilitychange`, and `touchend` — all trigger ghost removal + pointer capture release.

2. **Deferred removal**: Instead of dispatching `REMOVE_TILE` on drag start, hold the tile in a visual "dragging" state. Only dispatch removal on successful drop or confirmed drag-end. If cancelled, tile snaps back to its original slot position.

3. **Safety net timeout**: If ghost element still exists after 5 seconds, force-clean it and restore tile to its slot. Prevents permanent frozen states from edge cases.

### Files Affected

- `src/components/answer-game/useTouchDrag.ts` — ghost lifecycle, event cleanup
- `src/components/answer-game/useSlotTileDrag.ts` — deferred removal logic

## 6. Dynamic Slot Sizing

Slot sizing is fully controlled by the consumer via `className`. The `<Slot>` component has no internal size opinions.

### Per-Game Sizing

| Game                          | Slot className                          | When                               |
| ----------------------------- | --------------------------------------- | ---------------------------------- |
| WordSpell (letters)           | `size-14 rounded-lg`                    | Always                             |
| WordSpell (syllables/words)   | `min-w-14 h-14 px-2 rounded-lg`         | Auto-width for longer content      |
| SortNumbers                   | `size-14 rounded-lg`                    | Always                             |
| NumberMatch (dice, all ≤ 6)   | `size-20 rounded-2xl`                   | `round.numbers.every(n => n <= 6)` |
| NumberMatch (domino, any > 6) | `h-[72px] w-32 rounded-2xl`             | `round.numbers.some(n => n > 6)`   |
| Sentence-gap                  | `inline-block min-w-16 px-2 border-b-2` | Always inline                      |

### NumberMatch Dice/Domino Rule

When **any** number in the round exceeds 6, **all** slots and tiles render in domino (rectangle) format for visual consistency. When all numbers are ≤ 6, all render as dice (square).

```tsx
const allDice = round.numbers.every((n) => n <= 6);
const slotClass = allDice
  ? 'size-20 rounded-2xl'
  : 'h-[72px] w-32 rounded-2xl';
```

## 7. Sentence-Gap Schema

### Template Syntax

Numbered placeholders `{0}`, `{1}`, etc. in the sentence string, mapped to a `gaps` array.

### Types

```typescript
interface GapDefinition {
  word: string; // expected answer for this gap
  distractors?: string[]; // extra wrong tile choices, per-gap
}

interface WordSpellRound {
  word: string;
  emoji?: string;
  image?: string;
  sceneImage?: string;
  sentence?: string; // "The {0} sat on the {1}."
  gaps?: GapDefinition[]; // one entry per numbered placeholder
  audioOverride?: string;
}
```

### Single Gap

```typescript
{
  sentence: "The {0} sat on the mat.",
  gaps: [{ word: "cat", distractors: ["dog", "bat"] }],
}
// → 1 zone (expectedValue: "cat")
// → 3 tiles: ["cat", "dog", "bat"] shuffled
```

### Multiple Gaps

```typescript
{
  sentence: "The {0} sat on the {1}.",
  gaps: [
    { word: "cat", distractors: ["dog"] },
    { word: "mat", distractors: ["hat"] },
  ],
}
// → 2 zones (expectedValue: "cat", expectedValue: "mat")
// → 4 tiles: ["cat", "mat", "dog", "hat"] shuffled
```

### Rendering

A `<SentenceWithGaps>` helper component parses the template and injects `<Slot>` components:

```tsx
const SentenceWithGaps = ({ sentence }: { sentence: string }) => {
  const segments = parseSentenceTemplate(sentence);
  // Splits "The {0} sat on the {1}." into:
  // [{ type:'text', value:'The ' }, { type:'gap', index:0 }, ...]

  return (
    <p className="text-lg leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <Slot
            key={seg.index}
            index={seg.index}
            as="span"
            className="inline-block min-w-16 border-b-2 border-dashed mx-1"
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

### Zone Generation

```typescript
const buildSentenceGapRound = (gaps: GapDefinition[]) => {
  const zones = gaps.map((gap, i) => ({
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
  const tiles = shuffle(allWords).map((word) => ({
    id: nanoid(),
    label: word,
    value: word,
  }));

  return { tiles, zones };
};
```

### Backward Compatibility

When `gaps` is undefined, fall back to existing behavior: generate zones from `round.word` and render letter-spelling slots below the sentence text.

## Migration Strategy

**Approach A: New component, parallel migration.**

1. Build `<Slot>`, `<SlotRow>`, and `<SentenceWithGaps>` in `src/components/answer-game/Slot/`
2. Add `slotInteraction` to `AnswerGameConfig` with backward-compatible defaults
3. Migrate games one at a time:
   - SortNumbers first (simplest — same as current OrderedSlots)
   - WordSpell second (adds keyboard/cursor support)
   - NumberMatch third (validates free-swap + dynamic sizing)
   - Sentence-gap last (new feature, validates inline rendering)
4. After all games migrated, delete `OrderedSlots/` and `MatchingPairZones/`
5. Update game-specific re-exports (`OrderedLetterSlots`, `NumberSequenceSlots`) to point to new component or remove

## Key Files

| File                                                   | Role                                                 |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `src/components/answer-game/Slot/Slot.tsx`             | New unified slot component                           |
| `src/components/answer-game/Slot/SlotRow.tsx`          | Row layout wrapper                                   |
| `src/components/answer-game/Slot/SentenceWithGaps.tsx` | Template parser + inline slot renderer               |
| `src/components/answer-game/Slot/useSlotBehavior.ts`   | Drag/drop/click/keyboard logic hook                  |
| `src/components/answer-game/Slot/slot-animations.ts`   | Shake, pop, auto-eject return animation helpers      |
| `src/components/answer-game/types.ts`                  | Add `slotInteraction` to config, add `GapDefinition` |
| `src/components/answer-game/useTouchDrag.ts`           | Bug fix: ghost cleanup + deferred removal            |
| `src/components/answer-game/useSlotTileDrag.ts`        | Bug fix: deferred removal logic                      |
| `src/styles.css`                                       | New keyframes: `shake`, `pop`                        |
| `src/games/word-spell/types.ts`                        | Add `gaps?: GapDefinition[]` to round type           |

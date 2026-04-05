# Touch Keyboard for Type Mode

**Date:** 2026-04-06
**Status:** Approved
**Affects:** WordSpell, SortNumbers (any game using `inputMethod: 'type'` or `'both'`)

## Problem

`inputMethod: 'type'` relies entirely on `useKeyboardInput`, which listens for hardware `keydown` events on `window`. On touch-only devices (tablets, phones) there is no physical keyboard, so the type mode is completely broken — nothing happens when the user taps a slot.

## Approach: Native Keyboard on Slot Focus

When the device is touch-capable, a visually hidden `<input>` element is rendered inside `AnswerGameProvider`. Tapping any answer slot focuses that input (in the same synchronous gesture handler, satisfying iOS's user-gesture requirement), which causes the device's native keyboard to slide up. Key presses are captured via the `input` event and dispatched into the existing game reducer.

Desktop behaviour is unchanged — `useKeyboardInput` continues to listen to the global `keydown` event as before.

## Scope

- Applies when `inputMethod === 'type'` or `inputMethod === 'both'`
- `'drag'` mode: no changes
- `'both'` mode on touch: drag tiles remain visible AND the keyboard is available via slot tap (both input methods work)

## Technical Design

### Touch Detection

```ts
const isTouchDevice = navigator.maxTouchPoints > 0;
```

Checked once on mount inside the new hook. This gates the entire touch-keyboard path.

### New Hook: `useTouchKeyboardInput`

Lives alongside `useKeyboardInput` in `src/components/answer-game/`.

Responsibilities:

- Creates a `ref` for the hidden `<input>` element
- Attaches an `input` event listener to the hidden input
- On each `input` event: reads `event.data`, finds a matching bank tile, dispatches `PLACE_TILE`, clears the input value
- Returns `{ hiddenInputRef, focusKeyboard }` — `focusKeyboard` is called by slot tap handlers

Uses `input` event (not `keydown`) because many mobile virtual keyboards do not fire `keydown` reliably.

```ts
// inputmode drives the keyboard type shown by the OS
// 'text' for WordSpell (letters), 'numeric' for SortNumbers (digits)
```

### `HiddenKeyboardInput` Component

A thin wrapper rendered inside `AnswerGameProvider` when the touch-keyboard path is active:

```tsx
<input
  ref={hiddenInputRef}
  type="text"
  inputMode={inputMode} // 'text' | 'numeric'
  data-touch-keyboard="true"
  aria-hidden="true"
  style={{
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    width: 1,
    height: 1,
    top: 0,
    left: 0,
  }}
/>
```

`opacity: 0` with a 1×1 pixel size (not `display:none` or `visibility:hidden`) keeps the element focusable on iOS.

### `AnswerGameProvider` changes

- Renders `<KeyboardInputAdapter />` (existing) on non-touch devices only
- Renders `<HiddenKeyboardInput />` on touch devices when `inputMethod !== 'drag'`
- Provides `focusKeyboard` via a new `TouchKeyboardContext` so slot components can call it

### `useKeyboardInput` guard update

The existing guard that ignores input elements:

```ts
if (event.target instanceof HTMLInputElement) return;
```

becomes:

```ts
if (
  event.target instanceof HTMLInputElement &&
  !(event.target as HTMLInputElement).dataset['touchKeyboard']
)
  return;
```

This is a no-op on touch (the hook doesn't run), but protects desktop behaviour if someone ever tests with a touch device attached to a keyboard.

### Slot Consolidation: `AnswerSlot` + `OrderedSlots`

`OrderedLetterSlots` (`src/games/word-spell/`) and `NumberSequenceSlots` (`src/games/sort-numbers/`) are character-for-character identical. Since both need the same touch keyboard changes, this is the right time to consolidate them into shared components in `src/components/answer-game/`:

- **`AnswerSlot`** — the shared `<li>` slot (replaces both `LetterSlot` and `NumberSlot`)
- **`OrderedSlots`** — the shared `<ol>` list (replaces both `OrderedLetterSlots` and `NumberSequenceSlots`)

The game files (`OrderedLetterSlots.tsx`, `NumberSequenceSlots.tsx`) become thin re-exports:

```tsx
export { OrderedSlots as OrderedLetterSlots } from '@/components/answer-game/OrderedSlots/OrderedSlots';
export { OrderedSlots as NumberSequenceSlots } from '@/components/answer-game/OrderedSlots/OrderedSlots';
```

This preserves the existing import paths used by `WordSpell` and `SortNumbers` with no further changes to those files.

The touch keyboard behaviour is implemented once in `AnswerSlot`:

- Empty slots render a `<li>` with an `onClick` that calls `focusKeyboard()` from `TouchKeyboardContext`. The call must happen in the synchronous click handler (not in a `useEffect`) so iOS allows the programmatic focus.
- Each slot has a `useEffect` that calls `ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })` when `isActive` becomes `true` and `window.visualViewport` is narrower than `window.innerHeight` by more than 150 px (a reliable proxy for the keyboard being open).

### `LetterTileBank` changes

When `inputMethod === 'type'` on a touch device: replace the "⌨️ Type the letters on your keyboard" message with "Tap a slot to type". On non-touch, the existing message is unchanged.

### `inputMode` per game

Each game passes `inputMode` to `AnswerGameConfig` (or it is derived from existing config):

| Game        | `inputMode` value |
| ----------- | ----------------- |
| WordSpell   | `'text'`          |
| SortNumbers | `'numeric'`       |
| NumberMatch | `'numeric'`       |

`AnswerGameConfig` gains an optional `touchKeyboardInputMode?: 'text' \| 'numeric' \| 'none'` field (defaults to `'text'`).

## Files Changed

| File                                                                 | Change                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/components/answer-game/useTouchKeyboardInput.ts`                | **New** - hook managing hidden input, input-event capture, PLACE_TILE dispatch |
| `src/components/answer-game/TouchKeyboardContext.ts`                 | **New** - context providing `focusKeyboard` function                           |
| `src/components/answer-game/HiddenKeyboardInput.tsx`                 | **New** - the hidden `<input>` component                                       |
| `src/components/answer-game/AnswerGameProvider.tsx`                  | Modified - render `HiddenKeyboardInput`, provide `TouchKeyboardContext`        |
| `src/components/answer-game/useKeyboardInput.ts`                     | Modified - update `HTMLInputElement` guard to allow `data-touch-keyboard`      |
| `src/components/answer-game/types.ts`                                | Modified - add optional `touchKeyboardInputMode` to `AnswerGameConfig`         |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`             | Modified - update type-mode hint for touch                                     |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                       | Modified - pass `touchKeyboardInputMode: 'text'`                               |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`                 | Modified - pass `touchKeyboardInputMode: 'numeric'`                            |
| `src/components/answer-game/OrderedSlots/OrderedSlots.tsx`           | **New** - shared `AnswerSlot` + `OrderedSlots`                                 |
| `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx`     | Modified - thin re-export of `OrderedSlots`                                    |
| `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx` | Modified - thin re-export of `OrderedSlots`                                    |

## Testing

- Unit: `useTouchKeyboardInput` — mock hidden input, fire `input` events, assert `PLACE_TILE` dispatched
- Unit: `useKeyboardInput` guard — assert `data-touch-keyboard` input is not silently swallowed
- E2E (touch emulation): Playwright with `hasTouch: true` device — tap slot, type letter, assert slot fills
- VR: screenshot of type-mode on a touch viewport to capture the hint text change

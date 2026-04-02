# DragDropGame — Shared Primitive Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Milestone:** 5 — Reference Games
**Depends on:** M4 (GameEngineProvider, ScoreAnimation, EncouragementAnnouncer, SpeechOutput, event bus)

---

## 1. Overview

`DragDropGame` is a shared React composition primitive that lives at
`src/components/drag-drop-game/`. It is **not a game** — it is the
infrastructure layer all drag-drop games in M5 (and beyond) are composed
from.

Games that use it: WordSpell, NumberMatch, SortNumbers (and any future
drag-drop game). Each game provides three named slot components
(`prompt`, `dropZones`, `tileBank`) and `DragDropGame` handles
everything else.

**DnD library:** [Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop) (shadow effect enabled during drag)

---

## 2. Responsibilities

`DragDropGame` owns — and individual games do **not** re-implement:

- Pragmatic DnD context (drag state, pointer capture, shadow effect)
- Magnetic snap logic (60 px radius lerp, per [ui-ux.md §8.1](../../ui-ux.md))
- Tap-or-drag / auto-next-slot / free-swap interaction modes
- Wrong-tile behaviour (`reject` / `lock-auto-eject` / `lock-manual`)
- TTS on tile tap (`useGameTTS`)
- Drop zone pulse animation while drag is in progress (per [ui-ux.md §8.3](../../ui-ux.md))
- Inline confetti burst on round completion (`ScoreAnimation` from M4)
- Full-screen game-over celebration (koala mascot + jingle)
- Koala mascot encouragement on wrong answer (`EncouragementAnnouncer`)
- Session event emission via M4 event bus
- Keyboard drag simulation (Space/Enter pick up, Arrow keys move, Escape cancel)

---

## 3. Slot API

```tsx
<DragDropGame
  config={config}
  prompt={<WordPrompt />} // what the child is trying to do
  dropZones={<OrderedLetterSlots />} // where tiles are placed
  tileBank={<LetterTileBank />} // source tiles to drag/tap
/>
```

Each slot component accesses shared state via `useDragDropContext()` — no
prop drilling. Slots can also call `useDragDropDispatch()` to fire
evaluation actions.

### How different games compose it

```tsx
// WordSpell
<DragDropGame config={config}
  prompt={<WordSpellPrompt mode={config.mode} promptType={config.promptType} />}
  dropZones={<OrderedLetterSlots tileUnit={config.tileUnit} />}
  tileBank={<LetterTileBank tileUnit={config.tileUnit} tileBankMode={config.tileBankMode} />}
/>

// NumberMatch
<DragDropGame config={config}
  prompt={<NumberGroupPrompt />}
  dropZones={<MatchingPairZones />}
  tileBank={<NumeralTileBank />}
/>

// SortNumbers (future)
<DragDropGame config={config}
  prompt={<SortInstruction direction={config.direction} />}
  dropZones={<SortableSequence />}
  tileBank={<NumberTileBank />}
/>
```

---

## 4. Interaction Modes

### 4.1 Auto-Next-Slot (default)

- Tiles fill drop zones left-to-right automatically.
- Child can **tap** a tile (fires into next slot) **or drag** it.
- Tapping an already-placed tile in a slot removes it and returns it to
  the bank (undo — drag/tap mode only; backspace is the undo in type mode).
- Active slot pulses (glowing ring + cursor blink) to guide the child.

### 4.2 Free-Swap

- Child drags to any slot; occupied slots swap tiles.
- Already-placed tiles can be dragged directly between slots.
- Used by scramble-style games (e.g. WordSpell scramble mode, SortNumbers).

### 4.3 Type Mode (`inputMethod: "type"`)

- Tile bank hidden; slots show faint letter hints.
- Keystrokes fill slots left-to-right with a spring-in animation.
- Backspace removes the last placed tile.
- Wrong key: slot flashes red.
- Compatible with all game modes.

### 4.4 Magnetic Snap (drag only)

CSS lerp-based pull activates within 60 px of any valid drop zone:

```
if (distanceToZoneCenter < 60px) {
  t = 1 - (distance / 60);
  itemX = lerp(currentX, zoneCenter.x, t * 0.3);
  itemY = lerp(currentY, zoneCenter.y, t * 0.3);
}
```

---

## 5. TTS Triggers

| Trigger                             | Behaviour                                             |
| ----------------------------------- | ----------------------------------------------------- |
| Tile tap / drag-start               | TTS speaks tile label immediately (no delay)          |
| Hint button (header)                | TTS reads the full prompt (word, number, instruction) |
| Wrong answer                        | TTS reads mascot encouragement message                |
| Round start (`promptType: "audio"`) | TTS auto-reads the prompt                             |

---

## 6. Wrong-Tile Behaviour

Configurable via `wrongTileBehavior`:

| Value             | Behaviour                                                       |
| ----------------- | --------------------------------------------------------------- |
| `lock-auto-eject` | Tile locks red → auto-returns to bank after ~1 000 ms (default) |
| `reject`          | Tile bounces back immediately, slot never fills                 |
| `lock-manual`     | Tile stays red; child drags it back manually                    |

On wrong placement: koala mascot appears with a supportive message, TTS reads it, then fades after 2 s.

---

## 7. Celebration

### Per-round (inline)

`ScoreAnimation` (M4): confetti + stars, CSS-only, ~2 s. Auto-advances to next round.

### Game-over (all rounds complete)

Full-screen overlay:

- Stars rain down (CSS animation)
- Animated koala mascot (inline SVG + CSS keyframe dance)
- Score stars (1–5) based on retry count
- Jingle plays once on enter (~2–3 s, CC0 audio asset)
- Buttons: "Play again" (restart same config) | "Home" (dashboard)

---

## 8. Layout

Stacked, portrait-first (works on landscape tablet and desktop):

```
┌──────────────────────────────┐
│ [Exit]  ● ● ○ ○ ○  [Hint 🔊] │  ← Game shell header
├──────────────────────────────┤
│       {prompt slot}          │  ← game-supplied
│       {dropZones slot}       │  ← game-supplied
├──────────────────────────────┤
│       {tileBank slot}        │  ← game-supplied
└──────────────────────────────┘
```

- Header: Exit (left), progress dots — gold = complete, grey = pending (centre), Hint TTS (right)
- Minimum touch target: 52×56 px per tile and slot

---

## 9. Base Config Type

```ts
// src/components/drag-drop-game/types.ts
interface DragDropGameConfig {
  gameId: string;
  inputMethod: 'drag' | 'type' | 'both'; // default: 'drag'
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject'; // default: 'lock-auto-eject'
  tileBankMode: 'exact' | 'distractors'; // default: 'exact'
  distractorCount?: number; // when tileBankMode='distractors'
}
```

Game-specific configs extend this base. See the WordSpell + NumberMatch spec for examples.

---

## 10. File Structure

```
src/components/drag-drop-game/
  DragDropGame.tsx              ← composition root, named slot props, layout
  DragDropGameProvider.tsx      ← context: drag state, evaluation, TTS
  useDragDropContext.ts          ← read shared drag state
  useDragDropDispatch.ts         ← fire evaluation actions
  useTileEvaluation.ts           ← wrong-tile behaviour, auto-eject timer
  useGameTTS.ts                  ← TTS triggers
  useAutoNextSlot.ts             ← auto-next-slot (B) interaction
  useFreeSwap.ts                 ← free-swap (C) interaction
  types.ts                       ← DragDropGameConfig, TileItem, DropZone
  DragDropGame.stories.tsx
```

---

## 11. Accessibility

- All tiles: `role="button"`, `aria-label="Letter A"` (or tile label).
- Drop zones container: `role="list"`, `aria-label="Answer slots"`.
- Each zone: `role="listitem"`, `aria-label="Slot 1, empty"` / `"Slot 1, filled with C"`.
- `aria-grabbed="true"` on dragged tile; `aria-dropeffect="move"` on valid zones.
- Keyboard drag simulation (per [ui-ux.md §8.5](../../ui-ux.md)):
  Space/Enter to pick up → Arrow keys to move → Space/Enter to drop → Escape to cancel.
- `prefers-reduced-motion`: disables scale animations; confetti replaced by a static star badge.
- All TTS via `SpeechOutput` service (M2) — honours parent voice selection and TTS on/off.
- Minimum contrast: tile labels 4.5:1 on tile background.

---

## 12. Session Recording

Standard M4 game events — no custom recording logic needed:

| Event                     | When                               |
| ------------------------- | ---------------------------------- |
| `game:start`              | Component mounts with config       |
| `game:instructions_shown` | TTS prompt fires on round start    |
| `game:action`             | Every tile placement attempt       |
| `game:evaluate`           | Per-tile evaluation result         |
| `game:hint`               | Hint TTS button tapped             |
| `game:score`              | Round completed                    |
| `game:retry`              | Wrong tile ejected                 |
| `game:end`                | All rounds complete or child exits |

Payload includes: `{ tileValue, slotIndex, roundIndex, inputMethod, correct }`.

---

## 13. Testing

| Layer       | What to test                                                           |
| ----------- | ---------------------------------------------------------------------- |
| Unit        | Magnetic snap lerp calculation at boundary values                      |
| Unit        | Auto-eject timer fires after 1 000 ms                                  |
| Unit        | Auto-next-slot advances on correct placement, stays on wrong           |
| Unit        | Free-swap exchanges two occupied slots                                 |
| Unit        | TTS fires on tile tap, not on drag-cancel                              |
| Integration | Full round via GameEngineProvider: place tiles → complete → next round |
| Integration | Wrong-tile all three behaviours                                        |
| Integration | Keyboard drag simulation: pick up → move → drop                        |
| Storybook   | All interaction modes × wrong-tile behaviours                          |
| Storybook   | Game-over celebration screen (koala + stars)                           |

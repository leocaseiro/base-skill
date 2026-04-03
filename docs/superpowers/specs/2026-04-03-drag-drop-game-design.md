# AnswerGame — Shared Primitive Design Spec

**Date:** 2026-04-03
**Status:** In Review
**Milestone:** 5 — Reference Games
**Depends on:** M4 (GameEngineProvider, ScoreAnimation, EncouragementAnnouncer, SpeechOutput, event bus)

---

## 1. Overview

`AnswerGame` is a shared React composition primitive that lives at
`src/components/answer-game/`. It is **not a game** — it is the
infrastructure layer all tile-based answer games in M5 (and beyond) are
composed from.

Games that use it: WordSpell, NumberMatch, SortNumbers (and any future
tile-based game). Each game provides three named slot components
(`Question`, `Answer`, `Choices`) and `AnswerGame` handles everything else.

**DnD library:** [Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop) (shadow effect enabled during drag)

---

## 2. Responsibilities

`AnswerGame` owns — and individual games do **not** re-implement:

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

## 3. Compound Component API

`AnswerGame` uses the **compound component pattern** — sub-components are
attached as static properties and act as layout-position wrappers. Slot
implementations are **prop-free**: they read all config via
`useAnswerGameContext()`.

```tsx
<AnswerGame config={config}>
  <AnswerGame.Question />
  <AnswerGame.Answer />
  <AnswerGame.Choices />
</AnswerGame>
```

`AnswerGame.Question/Answer/Choices` render their `children` inside the
correct layout zone. When used without children they render nothing (useful
for games that omit a zone, e.g. no choices in type-only mode).

### Slot naming

| Slot       | Purpose                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| `Question` | What is being asked — any question primitives from `src/components/questions/` |
| `Answer`   | Where the answer goes — drag targets or typed slots (input-method agnostic)    |
| `Choices`  | Source tiles the child picks from — hidden/absent in type-only mode            |

### Compound parts (layout wrappers only)

```tsx
// AnswerGame.tsx
AnswerGame.Question = ({ children }) => (
  <div className="game-question-zone">{children}</div>
);
AnswerGame.Answer = ({ children }) => (
  <div className="game-answer-zone">{children}</div>
);
AnswerGame.Choices = ({ children }) => (
  <div className="game-choices-zone">{children}</div>
);
```

### How different games compose it

```tsx
// WordSpell
function WordSpell({ config }: { config: WordSpellConfig }) {
  return (
    <AnswerGame config={config}>
      <AnswerGame.Question>
        {config.mode !== 'recall' && <ImageQuestion />}
        <AudioButton />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <OrderedLetterSlots />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <LetterTileBank />
      </AnswerGame.Choices>
    </AnswerGame>
  );
}

// NumberMatch
function NumberMatch({ config }: { config: NumberMatchConfig }) {
  return (
    <AnswerGame config={config}>
      <AnswerGame.Question>
        {config.mode.startsWith('numeral') ||
        config.mode === 'word-to-numeral' ? (
          <TextQuestion />
        ) : (
          <DotGroupQuestion />
        )}
        <AudioButton />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <MatchingPairZones />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <NumeralTileBank />
      </AnswerGame.Choices>
    </AnswerGame>
  );
}

// SortNumbers (future)
function SortNumbers({ config }: { config: SortNumbersConfig }) {
  return (
    <AnswerGame config={config}>
      <AnswerGame.Question>
        <TextQuestion />
        <AudioButton />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <SortableSequence />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <NumberTileBank />
      </AnswerGame.Choices>
    </AnswerGame>
  );
}
```

---

## 4. Question Primitives

Shared question primitives live at `src/components/questions/`. Each is
**prop-free** — they read config from `useAnswerGameContext()`. Any game can
use any combination.

### Primitives

| Component          | Renders                                        | Use case                              |
| ------------------ | ---------------------------------------------- | ------------------------------------- |
| `ImageQuestion`    | An image (Fluent Emoji or custom asset)        | Word picture mode, scene illustration |
| `AudioButton`      | A speaker button that triggers TTS             | Explicit "hear it" affordance         |
| `TextQuestion`     | Styled text (word, numeral, sentence with gap) | Recall mode, numeral-to-word          |
| `DotGroupQuestion` | Dot/object cluster visual                      | NumberMatch quantity display          |

### TTS on tap

All question primitives are **tappable-to-TTS by default**. `AudioButton`
is an explicit affordance for the same action. All call `useGameTTS()`,
which delegates to the `SpeechOutput` service (M2). `SpeechOutput` honours
the parent's TTS on/off setting per profile (PRD §5.6, user story C-10) —
no prop needed on the primitives.

```tsx
// Parent has TTS enabled → image tap and button both speak
// Parent has TTS disabled → both silently no-op
<AnswerGame.Question>
  <ImageQuestion /> {/* tappable → useGameTTS() */}
  <AudioButton /> {/* button → useGameTTS() */}
</AnswerGame.Question>
```

### File structure

```
src/components/questions/
  ImageQuestion.tsx
  AudioButton.tsx
  TextQuestion.tsx
  DotGroupQuestion.tsx
  index.ts
  questions.stories.tsx
```

---

## 5. Interaction Modes

### 5.1 Auto-Next-Slot (default)

- Tiles fill answer zones left-to-right automatically.
- Child can **tap** a tile (fires into next slot) **or drag** it.
- Tapping an already-placed tile in a slot removes it and returns it to
  choices (undo — drag/tap mode only; backspace is the undo in type mode).
- Active slot pulses (glowing ring + cursor blink) to guide the child.

### 5.2 Free-Swap

- Child drags to any slot; occupied slots swap tiles.
- Already-placed tiles can be dragged directly between slots.
- Used by scramble-style games (e.g. WordSpell scramble mode, SortNumbers).

### 5.3 Type Mode (`inputMethod: "type"`)

- Choices hidden; slots show faint letter hints.
- Keystrokes fill slots left-to-right with a spring-in animation.
- Backspace removes the last placed tile.
- Wrong key: slot flashes red.
- Compatible with all game modes.

### 5.4 Magnetic Snap (drag only)

CSS lerp-based pull activates within 60 px of any valid answer zone:

```
if (distanceToZoneCenter < 60px) {
  t = 1 - (distance / 60);
  itemX = lerp(currentX, zoneCenter.x, t * 0.3);
  itemY = lerp(currentY, zoneCenter.y, t * 0.3);
}
```

---

## 6. TTS Triggers

| Trigger                                  | Behaviour                                    |
| ---------------------------------------- | -------------------------------------------- |
| Tile tap / drag-start                    | TTS speaks tile label immediately (no delay) |
| Tap on `ImageQuestion` or `TextQuestion` | TTS reads the full prompt                    |
| `AudioButton` press                      | TTS reads the full prompt                    |
| Hint button (header)                     | TTS reads the full prompt                    |
| Wrong answer                             | TTS reads mascot encouragement message       |
| Round start (`inputMethod: "recall"`)    | TTS auto-reads the prompt                    |

---

## 7. Wrong-Tile Behaviour

Configurable via `wrongTileBehavior`:

| Value             | Behaviour                                                          |
| ----------------- | ------------------------------------------------------------------ |
| `lock-auto-eject` | Tile locks red → auto-returns to choices after ~1 000 ms (default) |
| `reject`          | Tile bounces back immediately, slot never fills                    |
| `lock-manual`     | Tile stays red; child drags it back manually                       |

On wrong placement: koala mascot appears with a supportive message, TTS reads it, then fades after 2 s.

---

## 8. Celebration

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

## 9. Layout

Stacked, portrait-first (works on landscape tablet and desktop):

```
┌──────────────────────────────┐
│ [Exit]  ● ● ○ ○ ○  [Hint 🔊] │  ← Game shell header
├──────────────────────────────┤
│       {Question slot}        │  ← game-supplied question primitives
│       {Answer slot}          │  ← game-supplied answer zones
├──────────────────────────────┤
│       {Choices slot}         │  ← game-supplied tiles (hidden in type mode)
└──────────────────────────────┘
```

- Header: Exit (left), progress dots — gold = complete, grey = pending (centre), Hint TTS (right)
- Minimum touch target: 52×56 px per tile and slot

---

## 10. Base Config Type

```ts
// src/components/answer-game/types.ts
interface AnswerGameConfig {
  gameId: string;
  inputMethod: 'drag' | 'type' | 'both'; // default: 'drag'
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject'; // default: 'lock-auto-eject'
  tileBankMode: 'exact' | 'distractors'; // default: 'exact'
  distractorCount?: number; // when tileBankMode='distractors'
}
```

Game-specific configs extend this base. See the WordSpell + NumberMatch spec for examples.

---

## 11. File Structure

Each UI component lives in its own directory alongside its test and story files.
Module-level files (hooks, provider, types) stay flat in the module directory.

```
src/components/answer-game/
  AnswerGame/
    AnswerGame.tsx              ← composition root, named slot wrappers, layout
    AnswerGame.stories.tsx
  AnswerGameProvider.tsx        ← context: drag state, evaluation, TTS
  useAnswerGameContext.ts        ← read shared game state
  useAnswerGameDispatch.ts       ← fire evaluation actions
  useTileEvaluation.ts           ← wrong-tile behaviour, auto-eject timer
  useGameTTS.ts                  ← TTS triggers
  useAutoNextSlot.ts             ← auto-next-slot interaction
  useFreeSwap.ts                 ← free-swap interaction
  types.ts                       ← AnswerGameConfig, TileItem, AnswerZone

src/components/questions/
  ImageQuestion/
    ImageQuestion.tsx
    ImageQuestion.test.tsx
    ImageQuestion.stories.tsx
  AudioButton/
    AudioButton.tsx
    AudioButton.test.tsx
    AudioButton.stories.tsx
  TextQuestion/
    TextQuestion.tsx
    TextQuestion.test.tsx
    TextQuestion.stories.tsx
  DotGroupQuestion/
    DotGroupQuestion.tsx
    DotGroupQuestion.test.tsx
    DotGroupQuestion.stories.tsx
  index.ts
```

---

## 12. Accessibility

- All tiles: `role="button"`, `aria-label="Letter A"` (or tile label).
- Answer zones container: `role="list"`, `aria-label="Answer slots"`.
- Each zone: `role="listitem"`, `aria-label="Slot 1, empty"` / `"Slot 1, filled with C"`.
- `aria-grabbed="true"` on dragged tile; `aria-dropeffect="move"` on valid zones.
- `ImageQuestion`: `role="button"`, `aria-label="[word] — tap to hear"`.
- `TextQuestion`: `role="button"`, `aria-label="[text] — tap to hear"`.
- `AudioButton`: `role="button"`, `aria-label="Hear the question"`.
- Keyboard drag simulation (per [ui-ux.md §8.5](../../ui-ux.md)):
  Space/Enter to pick up → Arrow keys to move → Space/Enter to drop → Escape to cancel.
- `prefers-reduced-motion`: disables scale animations; confetti replaced by a static star badge.
- All TTS via `SpeechOutput` service (M2) — honours parent voice selection and TTS on/off.
- Minimum contrast: tile labels 4.5:1 on tile background.

---

## 13. Session Recording

Standard M4 game events — no custom recording logic needed:

| Event                     | When                                      |
| ------------------------- | ----------------------------------------- |
| `game:start`              | Component mounts with config              |
| `game:instructions_shown` | TTS prompt fires on round start           |
| `game:action`             | Every tile placement attempt              |
| `game:evaluate`           | Per-tile evaluation result                |
| `game:hint`               | Hint TTS button tapped or question tapped |
| `game:score`              | Round completed                           |
| `game:retry`              | Wrong tile ejected                        |
| `game:end`                | All rounds complete or child exits        |

Payload includes: `{ tileValue, slotIndex, roundIndex, inputMethod, correct }`.

---

## 14. Testing

| Layer       | What to test                                                                    |
| ----------- | ------------------------------------------------------------------------------- |
| Unit        | Magnetic snap lerp calculation at boundary values                               |
| Unit        | Auto-eject timer fires after 1 000 ms                                           |
| Unit        | Auto-next-slot advances on correct placement, stays on wrong                    |
| Unit        | Free-swap exchanges two occupied slots                                          |
| Unit        | TTS fires on tile tap, question tap, and AudioButton; not on drag-cancel        |
| Unit        | TTS no-ops when SpeechOutput service has TTS disabled                           |
| Integration | Full round via GameEngineProvider: place tiles → complete → next round          |
| Integration | Wrong-tile all three behaviours                                                 |
| Integration | Keyboard drag simulation: pick up → move → drop                                 |
| Storybook   | All interaction modes × wrong-tile behaviours                                   |
| Storybook   | Question primitives: ImageQuestion, TextQuestion, DotGroupQuestion, AudioButton |
| Storybook   | Game-over celebration screen (koala + stars)                                    |

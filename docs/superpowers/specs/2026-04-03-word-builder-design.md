# Word Builder — Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Milestone:** 5 — Reference Games
**Depends on:** M4 (GameEngineProvider, DragAndDrop component, ScoreAnimation, EncouragementAnnouncer, SpeechOutput)

---

## 1. Overview

Word Builder is a drag-and-drop (or keyboard-type) spelling game for children in Kindergarten through Year 2. The child is given a prompt (image, scrambled tiles, audio, or sentence gap) and must assemble the correct word by placing letter/syllable/word tiles into answer slots.

`WordBuilder` is built on top of a shared `DragDropGame` composition primitive (also used by Number Match, Sort Numbers, and future drag-drop games). It is **not** a monolithic component driven by a fat config — instead it composes three slot components into the shared primitive. New drag-drop game types are created by composing new slot implementations, not by modifying `DragDropGame`.

---

## 1a. DragDropGame Composition Primitive

`DragDropGame` is a **shared primitive** that lives at `src/games/drag-drop/`. It owns:

- Pragmatic DnD context (drag state, pointer capture, shadow effect)
- Magnetic snap logic (60px radius lerp, per ui-ux.md §8.1)
- Tap-or-drag / auto-next-slot / free-swap interaction modes
- Wrong-tile behavior (reject / lock-auto-eject / lock-manual)
- TTS on tile tap (`useGameTTS`)
- Inline confetti + game-over celebration (`ScoreAnimation`)
- Koala mascot feedback (`EncouragementAnnouncer`)
- Session event emission (via M4 event bus)

It accepts **three named slots** and renders them in the stacked layout:

```tsx
<DragDropGame
  config={config}
  prompt={<WordPrompt />} // ← what the child is trying to do
  dropZones={<OrderedLetterSlots />} // ← where tiles are placed
  tileBank={<LetterTileBank />} // ← source tiles to drag/tap
/>
```

Each slot receives drag context via `useDragDropContext()` — no prop drilling.

### How different games compose it

```tsx
// Word Builder
<DragDropGame config={config}
  prompt={<WordPrompt mode={config.mode} promptType={config.promptType} />}
  dropZones={<OrderedLetterSlots tileUnit={config.tileUnit} />}
  tileBank={<LetterTileBank tileUnit={config.tileUnit} tileBankMode={config.tileBankMode} />}
/>

// Number Match (future M5 spec)
<DragDropGame config={config}
  prompt={<NumberGroupPrompt />}
  dropZones={<MatchingPairZones />}
  tileBank={<NumeralTileBank />}
/>

// Sort Numbers (future M5 spec)
<DragDropGame config={config}
  prompt={<SortInstruction direction={config.direction} />}
  dropZones={<SortableSequence />}   // free-swap reorderable row
  tileBank={<NumberTileBank />}
/>
```

### File structure

```
src/
  components/
    drag-drop-game/                 ← shared primitive (UI component + co-located hooks)
      DragDropGame.tsx              ← composition root + named slot props
      DragDropGameProvider.tsx      ← context: drag state, evaluation, TTS
      useDragDropContext.ts
      useTileEvaluation.ts          ← wrong-tile behavior, auto-eject timer
      useGameTTS.ts                 ← TTS triggers (tap, hint, round start)
      useAutoNextSlot.ts            ← auto-next-slot (B) interaction
      useFreeSwap.ts                ← free-swap (C) interaction
      types.ts                      ← DragDropGameConfig base, TileItem, DropZone
      DragDropGame.stories.tsx

  games/
    word-builder/                   ← Word Builder slot implementations
      WordBuilder.tsx               ← composes DragDropGame
      WordPrompt.tsx                ← picture / scramble / recall / sentence-gap
      OrderedLetterSlots.tsx        ← sequential letter/syllable slots
      LetterTileBank.tsx            ← letter / syllable / word tiles
      types.ts                      ← WordBuilderConfig extends DragDropGameConfig
      WordBuilder.stories.tsx

    number-match/                   ← future (own spec)
    sort-numbers/                   ← future (own spec)
```

**Target audience:** K–Year 2 (ages 5–8)  
**Subject:** Reading / Spelling  
**DnD library:** [Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop) (shadow effect enabled during drag)

---

## 2. Game Modes

Four modes, all using the same stacked layout and tile bank:

| Mode           | Prompt shown                                                          | Interaction model  | Best for |
| -------------- | --------------------------------------------------------------------- | ------------------ | -------- |
| `picture`      | Image of the word's referent + optional TTS button                    | Auto-next-slot (B) | K–Year 1 |
| `scramble`     | Jumbled reference tiles above slots + "hear it" TTS                   | Free-swap (C)      | Year 1–2 |
| `recall`       | TTS auto-plays on round start; word-length underscores shown          | Auto-next-slot (B) | Year 1–2 |
| `sentence-gap` | Scene image + sentence with blank (e.g. "The \_\_\_ sat on the mat.") | Auto-next-slot (B) | Year 1–2 |

Modes are set per game config. Individual rounds within a session all use the same mode.

---

## 3. Layout

**Stacked (portrait-first, works on landscape tablet and desktop):**

```
┌─────────────────────────────┐
│  [Exit]  ● ● ○ ○ ○  [Hint🔊]│  ← Game shell header
├─────────────────────────────┤
│                             │
│     [Target zone]           │  ← Image / scrambled tiles / sentence
│                             │
│   [_C_] [___] [___]         │  ← Answer slots
│                             │
├─────────────────────────────┤
│  Choose a letter            │
│  [A] [T] [B] [K] [R]        │  ← Tile bank
└─────────────────────────────┘
```

- **Header:** Exit button (left), progress dots (centre — gold = complete, grey = pending), Hint TTS button (right)
- **Target zone:** varies by mode (see §2)
- **Answer slots:** one slot per letter/syllable/word in the target word; active slot pulses (glowing ring + cursor blink)
- **Tile bank:** scrollable row of tiles; labelled "Choose a letter / syllable / word" depending on `tileUnit`

Touch targets: minimum 52×56px per tile and slot (exceeds WCAG 48×48px minimum).

---

## 4. Interaction Model

### 4.1 Default — Auto-Next-Slot (picture / recall / sentence-gap modes)

- Tiles fill left-to-right automatically.
- Child can **tap** a tile (fires it into next slot) **or drag** it (with Pragmatic DnD shadow + magnetic snap).
- Tapping an already-placed tile in a slot removes it and returns it to the bank (undo — drag/tap mode only; backspace is the undo in type mode).
- Active slot pulses to guide the child.

### 4.2 Scramble Mode — Free-Swap (C)

- Child drags a tile from the bank to any slot.
- If the target slot is occupied, the two tiles **swap** positions.
- Already-placed tiles can be dragged directly to another slot to reorder.
- No auto-next-slot — child chooses each position explicitly.

### 4.3 Type Mode (`inputMethod: "type"`)

- Tile bank is hidden; slots show faint letter hints.
- Keystrokes fill slots left-to-right with a spring-in animation.
- Backspace removes the last-placed letter.
- Wrong key: slot flashes red.
- Compatible with all four game modes.

### 4.4 Magnetic Snap (drag only)

Drag interactions use Pragmatic DnD with the shadow effect. Additionally, a CSS lerp-based magnetic pull activates within 60px of any valid drop zone (per [ui-ux.md §8.1](../../../ui-ux.md)):

```
if (distanceToZoneCenter < 60px) {
  t = 1 - (distance / 60);
  itemX = lerp(currentX, zoneCenter.x, t * 0.3);
  itemY = lerp(currentY, zoneCenter.y, t * 0.3);
}
```

Drop zones pulse (scale + opacity animation) while any drag is in progress (per ui-ux.md §8.3).

---

## 5. Per-Tile Feedback & Evaluation

### 5.1 TTS on tile interaction

- **Tile tap/drag-start:** TTS speaks the letter/syllable name immediately (`SpeechOutput`, no delay).
- **Image tap (picture mode):** TTS reads the full word.
- **Hint button (header):** TTS spells the word letter-by-letter with a short pause between letters.
- **Recall mode:** TTS auto-reads the word on round start; child can tap the TTS button to hear it again.

### 5.2 Correct tile placement

- Slot transitions from dashed border → solid green border + green background.
- Short spring-in scale animation (CSS, `prefers-reduced-motion` respected).
- TTS speaks the placed letter name (same as tap event — already fired).

### 5.3 Wrong tile placement (`wrongTileBehavior: "lock-auto-eject"` default)

- Tile locks into slot with red border + red background.
- Koala mascot appears with supportive message ("Almost! Try a different letter.") — TTS reads it.
- After ~1 000ms: tile animates back to its original position in the tile bank.
- Slot returns to active (pulsing) state.

Alternative behaviors (configurable):

- `"reject"` — tile bounces back immediately, slot never fills.
- `"lock-manual"` — tile stays red; child must drag it back manually.

### 5.4 Word completion (all slots correct)

- Inline confetti burst + star animation (`ScoreAnimation` from M4) plays over the game screen.
- TTS reads the completed word aloud.
- After ~2 000ms the game advances to the next round automatically.

---

## 6. Celebration

### 6.1 Per-word (inline)

- `ScoreAnimation` component (M4): confetti + stars, CSS-only, 2s duration.
- Fires on word completion, does not block interaction.

### 6.2 Game-over (all rounds complete)

Full-screen celebration:

```
┌─────────────────────────────┐
│                             │
│   🎊  ⭐ ⭐ ⭐  🎊           │  ← Stars rain down (CSS animation)
│                             │
│    [Koala dancing GIF]      │  ← Animated koala mascot
│                             │
│   "Amazing spelling! 🎉"    │
│                             │
│      ⭐ ⭐ ⭐ ⭐ ⭐            │  ← Score stars (1–5)
│                             │
│   [Play again]  [Home]      │
└─────────────────────────────┘
```

- Short jingle plays on enter (2–3s, plays once then stops — sourced from a free/CC0 audio library).
- Koala mascot: animated SVG or CSS sprite (not GIF — keeps bundle small).
- Buttons: "Play again" restarts with same config; "Home" returns to dashboard.

---

## 7. Config Schema

`WordBuilderConfig` extends the shared `DragDropGameConfig` base type:

```ts
// src/components/drag-drop-game/types.ts — shared base
interface DragDropGameConfig {
  gameId: string;
  inputMethod: 'drag' | 'type' | 'both'; // default: 'drag'
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject'; // default: 'lock-auto-eject'
  tileBankMode: 'exact' | 'distractors'; // default: 'exact'
  distractorCount?: number;
}

// src/games/word-builder/types.ts — extends shared base
interface WordBuilderConfig extends DragDropGameConfig {
  component: 'WordBuilder';

  // Interaction
  inputMethod: 'drag' | 'type' | 'both'; // default: 'drag'
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject'; // default: 'lock-auto-eject'

  // Mode
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';

  // Prompt
  promptType: 'image' | 'audio' | 'both'; // default: 'both'

  // Tile bank
  tileUnit: 'letter' | 'syllable' | 'word'; // default: 'letter'
  tileBankMode: 'exact' | 'distractors'; // default: 'exact'
  distractorCount?: number; // only when tileBankMode='distractors'

  // Rounds
  rounds: WordBuilderRound[];
}

interface WordBuilderRound {
  word: string; // the correct spelling
  image?: string; // asset path (Fluent Emoji SVG or custom)
  sentence?: string; // sentence-gap mode: "The ___ sat on the mat."
  sceneImage?: string; // sentence-gap mode: scene illustration
  audioOverride?: string; // optional custom audio file instead of TTS
}
```

Example config:

```json
{
  "gameId": "word-builder-animals-k-easy",
  "component": "WordBuilder",
  "inputMethod": "drag",
  "wrongTileBehavior": "lock-auto-eject",
  "mode": "picture",
  "promptType": "both",
  "tileUnit": "letter",
  "tileBankMode": "exact",
  "rounds": [
    { "word": "cat", "image": "fluent-emoji/cat-face.svg" },
    { "word": "dog", "image": "fluent-emoji/dog-face.svg" },
    { "word": "hen", "image": "fluent-emoji/chicken.svg" },
    { "word": "pig", "image": "fluent-emoji/pig-face.svg" },
    { "word": "cow", "image": "fluent-emoji/cow-face.svg" }
  ]
}
```

---

## 8. Game Presets & Bookmarks

A game can ship with named presets (difficulty variants of the same `gameId`):

```json
{
  "gameId": "word-builder-animals-k",
  "presets": [
    {
      "presetId": "easy",
      "label": "Easy",
      "tileBankMode": "exact",
      "promptType": "both"
    },
    {
      "presetId": "medium",
      "label": "Medium",
      "tileBankMode": "distractors",
      "promptType": "both",
      "distractorCount": 3
    },
    {
      "presetId": "hard",
      "label": "Hard",
      "tileBankMode": "distractors",
      "promptType": "audio",
      "distractorCount": 5
    }
  ]
}
```

**Bookmark UX:**

- On the dashboard game card: long-press (or ⋯ menu) → "Save as preset" → names the bookmark.
- Bookmark stored in RxDB `bookmarks` collection as `{ gameId, presetId, label }`.
- Bookmarked presets appear as badge variants on the game card.
- Child taps a preset badge to launch that exact config directly.
- Parent can create / rename / delete presets in Parent Settings → Game Overrides.

---

## 9. Image Assets

- **Primary source:** [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) — MIT license, 3D-style, 1500+ emoji covering common nouns.
- **Fallback:** [Twemoji](https://twemoji.twitter.com/) — CC BY 4.0, flat SVG vectors, consistent cross-platform.
- **Custom scenes (sentence-gap mode):** SVG illustrations, designed to match the active theme's colour palette.
- Assets referenced by relative path in round config; bundled per game via code-splitting.

---

## 10. Mascot (Koala)

Replaces the owl referenced in ui-ux.md for the Word Builder game (ui-ux.md default owl remains for other games).

- **Idle:** not shown during gameplay (distraction-free).
- **Wrong answer:** appears bottom-centre with speech bubble, supportive message + TTS. Fades out after 2s.
- **Word complete:** brief celebratory pose (spring-up animation), fades out as next round loads.
- **Game-over screen:** full animated pose (CSS keyframe dance).
- **Implementation:** Inline SVG with CSS animation classes swapped per state. No GIF — keeps bundle size predictable.

---

## 11. Accessibility

- All tiles: `role="button"`, `aria-label="Letter A"` (or syllable/word name).
- Answer slots: `role="listitem"`, `aria-label="Slot 1, empty"` / `"Slot 1, filled with C"`.
- Slots container: `role="list"`, `aria-label="Answer slots"`.
- `aria-grabbed="true"` on dragged tile; `aria-dropeffect="move"` on valid drop zones.
- Keyboard drag simulation (per ui-ux.md §8.5): Space/Enter to pick up, Arrow keys to move, Space/Enter to drop, Escape to cancel.
- Type mode is inherently keyboard-native.
- `prefers-reduced-motion`: disables scale animations; confetti replaced by a static star badge.
- All TTS interactions fire via `SpeechOutput` service (M2) — honours parent voice selection and TTS on/off setting.
- Minimum contrast: tile labels 4.5:1 on tile background.

---

## 12. Session Recording

Word Builder emits standard game events via the M4 event bus — no custom recording logic needed:

| Event                     | When                                            |
| ------------------------- | ----------------------------------------------- |
| `game:start`              | Component mounts with config                    |
| `game:instructions_shown` | TTS instructions fire on round start            |
| `game:action`             | Every tile placement attempt (correct or wrong) |
| `game:evaluate`           | Per-tile evaluation result                      |
| `game:hint`               | Hint TTS button tapped                          |
| `game:score`              | Word completed (round score)                    |
| `game:retry`              | Wrong tile auto-ejected (retry signal)          |
| `game:end`                | All rounds complete or child exits              |

Each action payload includes: `{ tileValue, slotIndex, word, roundIndex, inputMethod, correct }`.

---

## 13. Testing

| Layer            | What to test                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit             | Config validation, tile-bank generation (exact vs distractors), distractor deduplication, round sequencing |
| Unit             | Evaluation logic: correct/wrong detection, auto-eject timer, word-complete detection                       |
| Unit             | TTS trigger conditions (tile tap, image tap, hint, round start)                                            |
| Integration      | Full round lifecycle via GameEngineProvider: start → place tiles → complete word → next round → game-over  |
| Integration      | Scramble mode: free-swap reorder leads to correct evaluation                                               |
| Integration      | Type mode: keystrokes fill slots, backspace removes, wrong key flashes                                     |
| Storybook        | All 4 modes × `exact`/`distractors` × `inputMethod` variants                                               |
| Storybook        | Wrong-tile states (`reject`, `lock-manual`, `lock-auto-eject`)                                             |
| Storybook        | Game-over celebration screen                                                                               |
| E2E (Playwright) | Picture mode full game: drag tiles to complete 3 words, verify celebration screen                          |
| E2E              | Type mode: keyboard input completes a word                                                                 |
| VR               | Screenshot baselines for picture mode (mid-game) and celebration screen across all themes                  |

---

## 14. i18n

- `en` (English) and `pt-BR` (Portuguese-Brazilian) word lists required for all shipped game configs.
- Word, sentence, and image asset references are per-locale in the round config.
- TTS language follows the active profile language (`SpeechOutput` service handles this).
- UI strings ("Choose a letter", "Almost! Try a different letter.", etc.) live in `games` i18n namespace.

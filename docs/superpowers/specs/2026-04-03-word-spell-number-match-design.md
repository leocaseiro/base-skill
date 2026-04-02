# WordSpell + NumberMatch — Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Milestone:** 5 — Reference Games
**Depends on:** M4 (GameEngineProvider), DragDropGame primitive (see [drag-drop-game-design.md](2026-04-03-drag-drop-game-design.md))

---

## 1. Overview

WordSpell and NumberMatch are two M5 reference games built on top of the
shared `DragDropGame` primitive. They are specified together because their
slot implementations are structurally similar — each has a prompt, an
ordered or paired drop zone, and a tile bank.

|                 | WordSpell                                       | NumberMatch                   |
| --------------- | ----------------------------------------------- | ----------------------------- |
| **Grade**       | K–Year 2                                        | Pre-K / K                     |
| **Subject**     | Reading / Spelling                              | Math                          |
| **Tiles**       | Letters, syllables, words                       | Numerals, dot groups, objects |
| **Drop zones**  | Ordered letter slots (sequential)               | Matching pair zones           |
| **Interaction** | Auto-next-slot (B) + free-swap for scramble (C) | Tap-to-match or free-swap     |
| **TTS on tile** | Speaks letter / syllable / word name            | Speaks number name            |

---

## 2. WordSpell

### 2.1 Game Modes

| Mode           | Prompt                                          | Interaction    | Best for |
| -------------- | ----------------------------------------------- | -------------- | -------- |
| `picture`      | Image of the word's referent + 🔊 button        | Auto-next-slot | K–Year 1 |
| `scramble`     | Jumbled reference tiles above slots + "hear it" | Free-swap      | Year 1–2 |
| `recall`       | TTS auto-plays; word-length underscores shown   | Auto-next-slot | Year 1–2 |
| `sentence-gap` | Scene image + sentence with blank               | Auto-next-slot | Year 1–2 |

### 2.2 Slot Components

```
src/games/word-spell/
  WordSpell.tsx           ← composes DragDropGame
  WordSpellPrompt.tsx     ← renders picture / scramble / recall / sentence-gap target zone
  OrderedLetterSlots.tsx  ← sequential letter/syllable/word slots
  LetterTileBank.tsx      ← letter / syllable / word tiles
  types.ts                ← WordSpellConfig extends DragDropGameConfig
  WordSpell.stories.tsx
```

### 2.3 Composition

Slot implementations are prop-free — they read `config` via `useDragDropContext()`.

```tsx
function WordSpell({ config }: { config: WordSpellConfig }) {
  return (
    <DragDropGame config={config}>
      <DragDropGame.Prompt>
        <WordSpellPrompt />{' '}
        {/* reads config.mode, config.promptType from context */}
      </DragDropGame.Prompt>
      <DragDropGame.DropZones>
        <OrderedLetterSlots />{' '}
        {/* reads config.tileUnit from context */}
      </DragDropGame.DropZones>
      <DragDropGame.TileBank>
        <LetterTileBank />{' '}
        {/* reads config.tileBankMode from context */}
      </DragDropGame.TileBank>
    </DragDropGame>
  );
}
```

### 2.4 Config Schema

```ts
// src/games/word-spell/types.ts
interface WordSpellConfig extends DragDropGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  promptType: 'image' | 'audio' | 'both'; // default: 'both'
  tileUnit: 'letter' | 'syllable' | 'word'; // default: 'letter'
  rounds: WordSpellRound[];
}

interface WordSpellRound {
  word: string;
  image?: string; // Fluent Emoji SVG path or custom asset
  sentence?: string; // sentence-gap mode: "The ___ sat on the mat."
  sceneImage?: string; // sentence-gap mode scene illustration
  audioOverride?: string; // optional custom audio instead of TTS
}
```

### 2.5 Example Configs

```json
{
  "gameId": "word-spell-animals-k-easy",
  "component": "WordSpell",
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

```json
{
  "gameId": "word-spell-animals-k-hard",
  "component": "WordSpell",
  "inputMethod": "drag",
  "wrongTileBehavior": "lock-auto-eject",
  "mode": "picture",
  "promptType": "audio",
  "tileUnit": "letter",
  "tileBankMode": "distractors",
  "distractorCount": 4,
  "rounds": [
    { "word": "cat", "image": "fluent-emoji/cat-face.svg" },
    { "word": "frog", "image": "fluent-emoji/frog.svg" },
    { "word": "duck", "image": "fluent-emoji/duck.svg" }
  ]
}
```

---

## 3. NumberMatch

### 3.1 Game Modes

| Mode               | Prompt                        | Drop zones                 | Best for   |
| ------------------ | ----------------------------- | -------------------------- | ---------- |
| `numeral-to-group` | Numeral shown (e.g. "3")      | Object/dot groups to match | Pre-K / K  |
| `group-to-numeral` | Object group shown (e.g. ●●●) | Numeral tiles to match     | Pre-K / K  |
| `numeral-to-word`  | Numeral shown (e.g. "3")      | Word tiles ("three")       | K / Year 1 |
| `word-to-numeral`  | Word shown (e.g. "three")     | Numeral tiles              | K / Year 1 |

### 3.2 Slot Components

```
src/games/number-match/
  NumberMatch.tsx           ← composes DragDropGame
  NumberMatchPrompt.tsx     ← renders numeral / dot group / word prompt
  MatchingPairZones.tsx     ← pair targets (not sequential — match any tile to zone)
  NumeralTileBank.tsx       ← numeral / dot group / object cluster tiles
  types.ts                  ← NumberMatchConfig extends DragDropGameConfig
  NumberMatch.stories.tsx
```

### 3.3 Composition

```tsx
function NumberMatch({ config }: { config: NumberMatchConfig }) {
  return (
    <DragDropGame config={config}>
      <DragDropGame.Prompt>
        <NumberMatchPrompt /> {/* reads config.mode from context */}
      </DragDropGame.Prompt>
      <DragDropGame.DropZones>
        <MatchingPairZones />
      </DragDropGame.DropZones>
      <DragDropGame.TileBank>
        <NumeralTileBank /> {/* reads config.tileStyle from context */}
      </DragDropGame.TileBank>
    </DragDropGame>
  );
}
```

### 3.4 Config Schema

```ts
// src/games/number-match/types.ts
interface NumberMatchConfig extends DragDropGameConfig {
  component: 'NumberMatch';
  mode:
    | 'numeral-to-group'
    | 'group-to-numeral'
    | 'numeral-to-word'
    | 'word-to-numeral';
  tileStyle: 'dots' | 'objects' | 'fingers'; // visual style for quantity tiles
  range: { min: number; max: number }; // e.g. { min: 1, max: 5 }
  rounds: NumberMatchRound[];
}

interface NumberMatchRound {
  value: number; // the number this round targets
  objectImage?: string; // Fluent Emoji for object-style tiles (e.g. 🍎 for apples)
}
```

### 3.5 Example Configs

```json
{
  "gameId": "number-match-1-5-dots",
  "component": "NumberMatch",
  "inputMethod": "drag",
  "wrongTileBehavior": "lock-auto-eject",
  "mode": "numeral-to-group",
  "tileStyle": "dots",
  "tileBankMode": "exact",
  "range": { "min": 1, "max": 5 },
  "rounds": [
    { "value": 1 },
    { "value": 2 },
    { "value": 3 },
    { "value": 4 },
    { "value": 5 }
  ]
}
```

```json
{
  "gameId": "number-match-1-10-apples",
  "component": "NumberMatch",
  "inputMethod": "drag",
  "wrongTileBehavior": "lock-auto-eject",
  "mode": "group-to-numeral",
  "tileStyle": "objects",
  "tileBankMode": "distractors",
  "distractorCount": 3,
  "range": { "min": 1, "max": 10 },
  "rounds": [
    { "value": 3, "objectImage": "fluent-emoji/red-apple.svg" },
    { "value": 7, "objectImage": "fluent-emoji/star.svg" },
    { "value": 5, "objectImage": "fluent-emoji/balloon.svg" }
  ]
}
```

---

## 4. Shared: Game Presets and Bookmarks

Both games support named presets (difficulty variants of the same `gameId`):

```json
{
  "gameId": "word-spell-animals-k",
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

- Dashboard game card: long-press (or ⋯ menu) → "Save as preset" → child names it.
- Stored in RxDB `bookmarks` as `{ gameId, presetId, label }`.
- Preset badge appears on the game card; tap to launch that config directly.
- Parent can create / rename / delete presets in Parent Settings → Game Overrides.

---

## 5. Shared: Image Assets

- **Primary:** [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) — MIT, 3D-style, 1 500+ emoji.
- **Fallback:** [Twemoji](https://twemoji.twitter.com/) — CC BY 4.0, flat SVG.
- Assets referenced by relative path in round config; bundled per game via code-splitting.

---

## 6. Shared: i18n

- `en` and `pt-BR` word/number lists required for all shipped configs.
- Round content (word, sentence, objectImage) is per-locale in the config.
- TTS language follows the active profile language (`SpeechOutput` service).
- UI strings ("Choose a letter", "Almost! Try again.", etc.) in `games` i18n namespace.

---

## 7. Testing

| Layer                     | What to test                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Unit — WordSpell          | Config validation, tile-bank generation (exact vs distractors), distractor deduplication |
| Unit — WordSpell          | Evaluation: correct letter at position, auto-eject timer, word-complete detection        |
| Unit — WordSpell          | TTS triggers: tile tap, image tap, hint button, recall auto-play                         |
| Unit — NumberMatch        | Config validation, range generation, pair zone matching                                  |
| Unit — NumberMatch        | Evaluation: numeral ↔ group equivalence                                                  |
| Integration — WordSpell   | Full round lifecycle: start → place tiles → complete word → next round → game-over       |
| Integration — WordSpell   | Scramble mode: free-swap reorder leads to correct evaluation                             |
| Integration — NumberMatch | Tap tile to matching zone → correct → advance                                            |
| Integration — NumberMatch | Wrong match → auto-eject → retry                                                         |
| Storybook — WordSpell     | All 4 modes × exact/distractors × inputMethod                                            |
| Storybook — NumberMatch   | All 4 modes × tileStyle variants                                                         |
| E2E — WordSpell           | Picture mode: drag tiles to complete 3 words, verify celebration                         |
| E2E — WordSpell           | Type mode: keyboard input completes a word                                               |
| E2E — NumberMatch         | Drag numerals to matching dot groups, complete session                                   |
| VR                        | Mid-game and celebration screenshots for both games across all themes                    |

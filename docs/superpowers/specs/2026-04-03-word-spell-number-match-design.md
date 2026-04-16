# WordSpell + NumberMatch — Design Spec

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._

**Date:** 2026-04-03
**Status:** In Review
**Milestone:** 5 — Reference Games
**Depends on:** M4 (GameEngineProvider), AnswerGame primitive (see [drag-drop-game-design.md](2026-04-03-drag-drop-game-design.md))

---

## 1. Overview

WordSpell and NumberMatch are two M5 reference games built on top of the
shared `AnswerGame` primitive. They are specified together because their
slot implementations are structurally similar — each has a question, an
ordered or paired answer zone, and a choices bank.

Each game composes question primitives from `src/components/questions/`
directly in its root component. There are no per-game prompt wrapper files
(`WordSpellPrompt`, `NumberMatchPrompt`) — composition happens in JSX.

|                 | WordSpell                               | NumberMatch                   |
| --------------- | --------------------------------------- | ----------------------------- |
| **Grade**       | K–Year 2                                | Pre-K / K                     |
| **Subject**     | Reading / Spelling                      | Math                          |
| **Tiles**       | Letters, syllables, words               | Numerals, dot groups, objects |
| **Answer zone** | Ordered letter slots (sequential)       | Matching pair zones           |
| **Interaction** | Auto-next-slot + free-swap for scramble | Tap-to-match or free-swap     |
| **TTS on tile** | Speaks letter / syllable / word name    | Speaks number name            |

---

## 2. WordSpell

### 2.1 Game Modes

| Mode           | Question                                        | Interaction    | Best for |
| -------------- | ----------------------------------------------- | -------------- | -------- |
| `picture`      | Image of the word's referent + AudioButton      | Auto-next-slot | K–Year 1 |
| `scramble`     | Jumbled tiles above answer slots + AudioButton  | Free-swap      | Year 1–2 |
| `recall`       | AudioButton only; TTS auto-plays on round start | Auto-next-slot | Year 1–2 |
| `sentence-gap` | Scene image + sentence with blank + AudioButton | Auto-next-slot | Year 1–2 |

### 2.2 Slot Components

```
src/games/word-spell/
  WordSpell/
    WordSpell.tsx           ← composes AnswerGame + question primitives directly
    WordSpell.stories.tsx
  OrderedLetterSlots/
    OrderedLetterSlots.tsx  ← sequential letter/syllable/word answer zones
    OrderedLetterSlots.test.tsx
    OrderedLetterSlots.stories.tsx
  LetterTileBank/
    LetterTileBank.tsx      ← letter / syllable / word tiles
    LetterTileBank.test.tsx
    LetterTileBank.stories.tsx
  types.ts                  ← WordSpellConfig extends AnswerGameConfig
```

### 2.3 Composition

Slot implementations are prop-free — they read `config` via
`useAnswerGameContext()`. Question primitives are composed directly in the
game root.

```tsx
function WordSpell({ config }: { config: WordSpellConfig }) {
  return (
    <AnswerGame config={config}>
      <AnswerGame.Question>
        {/* picture and sentence-gap modes show the image */}
        {config.mode !== 'recall' && <ImageQuestion />}
        {/* all modes have an audio button */}
        <AudioButton />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <OrderedLetterSlots />{' '}
        {/* reads config.tileUnit from context */}
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <LetterTileBank />{' '}
        {/* reads config.tileBankMode from context */}
      </AnswerGame.Choices>
    </AnswerGame>
  );
}
```

### 2.4 Config Schema

```ts
// src/games/word-spell/types.ts
interface WordSpellConfig extends AnswerGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  tileUnit: 'letter' | 'syllable' | 'word'; // default: 'letter'
  rounds: WordSpellRound[];
}

interface WordSpellRound {
  word: string;
  image?: string; // Fluent Emoji SVG path or custom asset (picture/sentence-gap)
  sentence?: string; // sentence-gap mode: "The ___ sat on the mat."
  sceneImage?: string; // sentence-gap mode scene illustration
  audioOverride?: string; // optional custom audio instead of TTS
}
```

Note: `promptType` is removed. Which question primitives to render is
determined by `config.mode` directly in the composition JSX above.

### 2.5 Example Configs

```json
{
  "gameId": "word-spell-animals-k-easy",
  "component": "WordSpell",
  "inputMethod": "drag",
  "wrongTileBehavior": "lock-auto-eject",
  "mode": "picture",
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
  "mode": "recall",
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

| Mode               | Question                      | Answer zones               | Best for   |
| ------------------ | ----------------------------- | -------------------------- | ---------- |
| `numeral-to-group` | Numeral shown (e.g. "3")      | Object/dot groups to match | Pre-K / K  |
| `group-to-numeral` | Object group shown (e.g. ●●●) | Numeral tiles to match     | Pre-K / K  |
| `numeral-to-word`  | Numeral shown (e.g. "3")      | Word tiles ("three")       | K / Year 1 |
| `word-to-numeral`  | Word shown (e.g. "three")     | Numeral tiles              | K / Year 1 |

### 3.2 Slot Components

```
src/games/number-match/
  NumberMatch/
    NumberMatch.tsx           ← composes AnswerGame + question primitives directly
    NumberMatch.stories.tsx
  MatchingPairZones/
    MatchingPairZones.tsx     ← pair targets (not sequential — match any tile to zone)
    MatchingPairZones.test.tsx
    MatchingPairZones.stories.tsx
  NumeralTileBank/
    NumeralTileBank.tsx       ← numeral / dot group / object cluster tiles
    NumeralTileBank.test.tsx
    NumeralTileBank.stories.tsx
  types.ts                    ← NumberMatchConfig extends AnswerGameConfig
```

### 3.3 Composition

```tsx
function NumberMatch({ config }: { config: NumberMatchConfig }) {
  return (
    <AnswerGame config={config}>
      <AnswerGame.Question>
        {/* numeral and word modes show text; group modes show dots/objects */}
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
        <NumeralTileBank /> {/* reads config.tileStyle from context */}
      </AnswerGame.Choices>
    </AnswerGame>
  );
}
```

### 3.4 Config Schema

```ts
// src/games/number-match/types.ts
interface NumberMatchConfig extends AnswerGameConfig {
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

## 4. Shared: Game Presets and Custom games

Both games support named presets (difficulty variants of the same `gameId`):

```json
{
  "gameId": "word-spell-animals-k",
  "presets": [
    {
      "presetId": "easy",
      "label": "Easy",
      "tileBankMode": "exact",
      "mode": "picture"
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
      "mode": "recall",
      "tileBankMode": "distractors",
      "distractorCount": 5
    }
  ]
}
```

**Custom game UX:**

- Dashboard game card: long-press (or ⋯ menu) → "Save as preset" → child names it.
- Stored in RxDB `custom games` as `{ gameId, presetId, label }`.
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
| Unit — WordSpell          | TTS triggers: tile tap, image tap, AudioButton tap, recall auto-play                     |
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

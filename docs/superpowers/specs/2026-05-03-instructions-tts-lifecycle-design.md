# Instructions + TTS Lifecycle (Spec 1a)

> **Spec ID:** `2026-05-03-instructions-tts-lifecycle`
> **Issue:** [#229 — Instructions + Text to Speech changes](https://github.com/leocaseiro/base-skill/issues/229)
> **Related:** [#230](https://github.com/leocaseiro/base-skill/issues/230) (hidden override slot consumer), [#300](https://github.com/leocaseiro/base-skill/issues/300) (simplified-form preset picker — separate spec), Spec 1b (phoneme speech + round-end explain sequence — separate spec), Spec 2 (how-to-play tour + `?` icon — separate spec).

## 1. Summary

Replace the ad-hoc "speak the instruction text on the pre-game overlay, then speak only the bare answer at each round" model with a **lifecycle-driven TTS layer** that:

1. Renames `InstructionsOverlay` to a **Game Options panel** that no longer auto-speaks instructions.
2. Defines **12 canonical lifecycle events** (game.prepare, game.start, round.start, round.idle, round.error, round.correct, round.celebrate, round.advance, level.complete, game.pause, game.resume, game.over).
3. Introduces a **per-event verbosity model** (`off | brief | full`) with per-`(gameId, gradeBand)` defaults, customGame overrides, and skin-level themed copy overrides.
4. Adds a **per-game template registry** keyed by `(gameId, event, mode)` resolved through i18n.
5. Lays a **mobile-first inline AudioButton** layout (icon left of question text) that always re-explains in `full` mode regardless of the configured verbosity.
6. Splits the existing `ttsEnabled` flag into a clean **"auto-speak only" gate** so on-demand speech (the AudioButton) always works.

The design is wired to subscribe to the **existing `GameEventBus`** (`src/types/game-events.ts:133`); it does not introduce a parallel event system. New events are added to the bus as needed.

## 2. Goals

- Move the instructional speech _inside_ the game (after "Let's go") rather than the pre-game panel.
- Let parents configure how chatty the game is — per-event, per customGame.
- Provide game-level defaults that vary by `gradeBand` (pre-K, k, year1-2, year3-4, year5-6).
- Make the in-round AudioButton a reliable "explain-it-again" affordance, decoupled from the auto-speak setting.
- Reserve forward-compatible schema slots so future presets ([#230](https://github.com/leocaseiro/base-skill/issues/230)) and themed skins can override copy without re-architecting.
- Keep the changes wireable into existing `GameEventBus` infrastructure.

## 3. Non-Goals

The following items are explicitly **out of scope** for Spec 1a; they ship in subsequent specs:

| Item                                                                                                  | Lands in    |
| ----------------------------------------------------------------------------------------------------- | ----------- |
| WordSpell phoneme speech (replace letter-name speech with phonemes)                                   | **Spec 1b** |
| Round-end explain sequence (phoneme-by-phoneme highlight + whole word)                                | **Spec 1b** |
| How-to-play tour overlay (reactour-style or video)                                                    | **Spec 2**  |
| Persistent `?` help icon to revisit the tour                                                          | **Spec 2**  |
| Pre-custom configs UI ([#230](https://github.com/leocaseiro/base-skill/issues/230))                   | future      |
| Simplified per-customGame quick options ([#300](https://github.com/leocaseiro/base-skill/issues/300)) | separate    |
| SRS scoring impact of mid-game pause/resume                                                           | future      |

Spec 1a _reserves_ schema slots for these (e.g. `customGame.tts?`, `skin.tts?`) but does not implement their UI.

## 4. Lifecycle Event Vocabulary

Canonical events that the TTS subscriber listens for. Engine emits the engine-owned events; games may emit game-specific extras (`round.idle` re-cues are game-driven).

| Event             | Source | When                                                 | Notes                                                               |
| ----------------- | ------ | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `game.prepare`    | engine | Game Options panel mounts                            | Light cue ("{{gameName}}. Tap Let's go to start, or pick a level.") |
| `game.start`      | engine | "Let's go" clicked, AnswerGame mounts                | Full how-to-play replaces pre-game speech                           |
| `round.start`     | engine | First round mount and on each `roundIndex` change    | Today's `useRoundTTS` becomes the first consumer                    |
| `round.idle`      | game   | After N seconds with no progress (per game)          | Re-cue for stuck kids; verbosity `off` for older grades by default  |
| `round.error`     | engine | `game:evaluate` with `correct: false`                | Future: "Try again — the word is {{word}}."                         |
| `round.correct`   | engine | `game:evaluate` with `correct: true`                 | Triggers Spec 1b explain sequence in pre-K/K mode                   |
| `round.celebrate` | engine | After `round.correct`, post-explain, pre-advance     | Slot for mini-games + praise; reserved for Spec 1b orchestration    |
| `round.advance`   | engine | `ADVANCE_ROUND` dispatched                           | Lets older players hear just the next target ("now: ascending")     |
| `level.complete`  | engine | `LevelCompleteOverlay` mounts                        | Speak summary                                                       |
| `game.pause`      | engine | Pause action, app backgrounded, route navigated away | Default `off`; reserved hook                                        |
| `game.resume`     | engine | Refresh-mid-game, return-from-background             | **Aliases `game.start`** (see §6.4)                                 |
| `game.over`       | engine | `GameOverOverlay` mounts                             | Final summary                                                       |

### 4.1 Bus event additions

Map the lifecycle to the existing `GameEventBus` (`src/types/game-events.ts`):

| Lifecycle event   | Bus event                          | Action                 |
| ----------------- | ---------------------------------- | ---------------------- |
| `game.prepare`    | `game:prepare` (new)               | add to bus             |
| `game.start`      | `game:start`                       | reuse                  |
| `round.start`     | derived in subscriber              | wire from `roundIndex` |
| `round.idle`      | `game:round-idle` (new)            | add to bus             |
| `round.error`     | `game:evaluate` (`correct: false`) | reuse                  |
| `round.correct`   | `game:evaluate` (`correct: true`)  | reuse                  |
| `round.celebrate` | `game:round-celebrate` (new)       | add to bus             |
| `round.advance`   | `game:round-advance`               | reuse                  |
| `level.complete`  | `game:level-advance`               | reuse                  |
| `game.pause`      | `game:pause` (new)                 | add to bus             |
| `game.resume`     | `game:resume` (new)                | add to bus             |
| `game.over`       | `game:end`                         | reuse                  |

Five new bus events: `game:prepare`, `game:round-idle`, `game:round-celebrate`, `game:pause`, `game:resume`. Each follows the existing `BaseGameEvent` shape; no payload changes for now.

## 5. Verbosity Model & Resolution

Verbosity = how chatty the lifecycle event is.

```ts
type Verbosity = 'off' | 'brief' | 'full';
```

Two **independent** resolution chains: one for the verbosity choice, one for the spoken string.

### 5.1 Verbosity chain ("how chatty?")

```text
customGame.events[event]                        ← per-event override (form)
  ↓ if undefined
gameRegistry[gameId].byGradeBand[gradeBand][event]   ← per-game per-grade default
  ↓ if undefined
gameRegistry[gameId].default[event]                  ← per-game baseline default
```

There is **no engine-wide default**. Defaults live per-game.

### 5.2 Copy chain ("what is spoken")

Only consulted when verbosity is `'brief'` or `'full'` (not `'off'`).

```text
customGame.tts?.[event]?.[mode]                ← free-text override (hidden, #230 future)
  ↓ if undefined
skin.tts?.[event]?.[mode]                       ← themed override
  ↓ if undefined
gameRegistry[gameId].tts[event][mode]           ← i18n key (default)
```

Copy has **no grade dimension**. The grade picks the verbosity; the verbosity picks the cell. A single `brief` copy and a single `full` copy exist per `(gameId, event)`.

### 5.3 Worked example

WordSpell, year1-2 customGame, no overrides, default skin, on `round.start` with `word = "cat"`:

- Verbosity: `customGame.events['round.start']` → undefined → `gameRegistry['word-spell'].byGradeBand['year1-2']['round.start']` → `'full'`.
- Copy: `customGame.tts` undefined → `skin.tts` undefined → `gameRegistry['word-spell'].tts['round.start']['full']` → i18n key `tts.word-spell.round-start.full` → `"Spell the word {{word}}."` → speaks **"Spell the word cat."**

If parent flips `events['round.start'] = 'brief'`: same chain → `tts.word-spell.round-start.brief` → `"{{word}}"` → speaks **"cat"**.

If skin = `pirate` with `tts: { 'round.start': { full: 'tts.pirate.round-start.full' } }` and verbosity is `'full'`: speaks **"Spell the treasure word, cat!"** (or whatever the pirate skin defines).

## 6. Per-Game Template Registry

### 6.1 Type shape

```ts
type LifecycleEvent =
  | 'game.prepare'
  | 'game.start'
  | 'game.pause'
  | 'game.resume'
  | 'game.over'
  | 'round.start'
  | 'round.idle'
  | 'round.error'
  | 'round.correct'
  | 'round.celebrate'
  | 'round.advance'
  | 'level.complete';

type Verbosity = 'off' | 'brief' | 'full';

type EventTemplate =
  | { aliasOf: LifecycleEvent }
  | {
      tts: { brief: string; full: string }; // i18n keys
      byGradeBand: Record<GradeBand, Verbosity>;
      default: Verbosity;
    };

type GameLifecycleRegistryEntry = {
  events: Record<LifecycleEvent, EventTemplate>;
};

type GameLifecycleRegistry = Record<
  string /* gameId */,
  GameLifecycleRegistryEntry
>;
```

### 6.2 Example: WordSpell registry entry (illustrative defaults)

```ts
// src/lib/lifecycle-tts/registry/word-spell.ts
import type { GameLifecycleRegistryEntry } from '../types';

export const wordSpellRegistry: GameLifecycleRegistryEntry = {
  events: {
    'game.prepare': {
      tts: {
        brief: 'tts.word-spell.game-prepare.brief',
        full: 'tts.word-spell.game-prepare.full',
      },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'brief',
    },
    'game.start': {
      tts: {
        brief: 'tts.word-spell.game-start.brief',
        full: 'tts.word-spell.game-start.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'round.start': {
      tts: {
        brief: 'tts.word-spell.round-start.brief',
        full: 'tts.word-spell.round-start.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'round.idle': {
      /* … */ default: 'brief',
      byGradeBand: {
        /* … */
      },
    },
    'round.error': {
      /* … */ default: 'full',
      byGradeBand: {
        /* … */
      },
    },
    'round.correct': {
      /* … */ default: 'brief',
      byGradeBand: {
        /* … */
      },
    },
    'round.celebrate': {
      /* … */ default: 'brief',
      byGradeBand: {
        /* … */
      },
    },
    'round.advance': {
      /* … */ default: 'brief',
      byGradeBand: {
        /* … */
      },
    },
    'level.complete': {
      /* … */ default: 'full',
      byGradeBand: {
        /* … */
      },
    },
    'game.pause': {
      tts: { brief: '', full: '' },
      default: 'off',
      byGradeBand: {
        'pre-k': 'off',
        k: 'off',
        'year1-2': 'off',
        'year3-4': 'off',
        'year5-6': 'off',
      },
    },
    'game.resume': { aliasOf: 'game.start' },
    'game.over': {
      /* … */ default: 'full',
      byGradeBand: {
        /* … */
      },
    },
  },
};
```

The exact verbosity values per `(gameId, gradeBand)` are **placeholders** — game authors tune them. Storybook surfaces each game's table per stretch decision in §13.2 below.

### 6.3 Resolver

```ts
// src/lib/lifecycle-tts/resolve.ts
export const resolveLifecycle = (params: {
  gameId: string;
  event: LifecycleEvent;
  gradeBand: GradeBand;
  customGame: CustomGameTTSConfig | undefined;
  skin: GameSkin;
  registry: GameLifecycleRegistry;
}): { verbosity: Verbosity; i18nKey: string | null } => {
  /* walks the two chains; resolves aliasOf transparently */
};
```

### 6.4 `aliasOf` semantics

When `gameRegistry[gameId].events['game.resume']` is `{ aliasOf: 'game.start' }`, the resolver **redirects both chains** to `game.start`. CustomGame and skin overrides on `game.resume` are still consulted first; they only fall through to `game.start` when `game.resume` itself has no override.

This means a customGame that explicitly sets `events['game.resume'] = 'off'` will silence resume even if `game.start = 'full'`. That's correct — overrides are by-event.

## 7. CustomGame Schema Changes

### 7.1 New shape

```ts
// src/types/custom-game.ts (new file or augment existing)
import type {
  LifecycleEvent,
  Verbosity,
} from '@/lib/lifecycle-tts/types';

export interface CustomGameTTSConfig {
  /**
   * Per-event verbosity override. When undefined, the registry's
   * byGradeBand default is used.
   */
  events?: Partial<Record<LifecycleEvent, Verbosity>>;

  /**
   * Free-text copy override. Hidden from the form in Spec 1a.
   * Reserved for issue #230 (pre-custom configs).
   */
  tts?: Partial<
    Record<LifecycleEvent, { brief?: string; full?: string }>
  >;
}
```

This nests under the existing `customGame.config` blob.

### 7.2 `ttsEnabled` semantic change

The existing `ttsEnabled: boolean` flag on the customGame config currently gates **all** speech (auto-speak and AudioButton). The new contract:

| Setting             | Auto-speak (lifecycle events)  | On-demand AudioButton tap   |
| ------------------- | ------------------------------ | --------------------------- |
| `ttsEnabled: true`  | ✅ runs per resolved verbosity | ✅ always speaks `full`     |
| `ttsEnabled: false` | ❌ silenced everywhere         | ✅ **always speaks `full`** |

The button is the user-driven mercy escape and must always work. This is a deliberate behavior change and must be called out in the changelog.

**Migration / back-compat:** Existing customGames with `ttsEnabled: false` retain the silent auto-speak experience. The only observed change is that the AudioButton, which previously rendered `null` when `ttsEnabled=false`, now renders unconditionally. This is the _intended_ improvement.

### 7.3 i18n form labels

New `instructions.voiceAndInstructions.*` keys for the form (added in §10.4).

## 8. Skin Schema Changes

Augment `GameSkin` (`src/lib/skin/game-skin.ts`):

```ts
export interface GameSkin {
  // … existing fields …

  /**
   * Optional per-event copy override (i18n keys or raw strings).
   * Skins do not influence verbosity — only what is spoken.
   */
  tts?: Partial<
    Record<LifecycleEvent, { brief?: string; full?: string }>
  >;
}
```

The default `classicSkin` does not set `tts`. Skin-shipped TTS lands in future themed skins (e.g. pirate, dino).

## 9. UI Changes

### 9.1 Game Options panel (renamed from `InstructionsOverlay`)

**File / directory rename:**

- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` → `src/components/answer-game/GameOptions/GameOptionsOverlay.tsx`
- Same for `.test.tsx`, `.stories.tsx`, and any `useConfigDraft.ts` co-located file.
- Storybook title: `'AnswerGame/InstructionsOverlay'` → `'AnswerGame/GameOptions/GameOptionsOverlay'` (PascalCase per CLAUDE.md).
- Update all imports across the codebase (e.g. `routes/$locale/_app/game/$gameId.tsx`).

**Behavior change:**

- Remove the `useEffect(() => { if (ttsEnabled) speak(text); … }, [])` block (`InstructionsOverlay.tsx:173-179`). Pre-game panel **does not auto-speak how-to-play instructions**.
- Subscribe to `game:prepare` instead — speaks the resolved `game.prepare` copy (default `brief` = `"{{gameName}}"`).
- Drop the `text` prop's instructional role. The visible content shifts to game name + simple-form preset slot + "Let's go".
- **No `?` help icon in Spec 1a** (Spec 2 adds the tour and the icon together).

**Visible structure (target, simplified):**

```text
┌─────────────────────────────────────────────┐
│         [GameCover, hero]                   │
├─────────────────────────────────────────────┤
│  WordSpell                       [⭐][⚙]    │
│  ─────────────────────────────────────────  │
│  ( placeholder slot for #300 preset picker )│
│  ─────────────────────────────────────────  │
│  ▶︎ Let's go                                 │
└─────────────────────────────────────────────┘
```

### 9.2 In-round AudioButton: always inline, icon left

**Layout — same on all breakpoints:**

```text
[🔊]   <question text>
```

- Introduce `<QuestionRow>` wrapper at `src/components/questions/QuestionRow/QuestionRow.tsx` that lays AudioButton + question content inline (icon left, content right).
- NumberMatch (`NumberMatch.tsx:243-247`) and WordSpell (`WordSpell.tsx:216`) consume `<QuestionRow>` instead of stacking siblings.
- AudioButton renders **unconditionally** (no `if (!config.ttsEnabled) return null`) — see §7.2.

### 9.3 AudioButton always-full behavior

Update `AudioButton` (`src/components/questions/AudioButton/AudioButton.tsx`):

```tsx
export const AudioButton = ({ event = 'round.start' }: { event?: LifecycleEvent }) => {
  const { speakOnDemand } = useLifecycleTTS();

  return (
    <button
      type="button"
      aria-label={t('common.audio.replay', { defaultValue: 'Hear the question' })}
      onClick={() => speakOnDemand(event, { mode: 'full' })}
      …
    />
  );
};
```

The button no longer takes a raw `prompt` string. It takes a lifecycle event name (default `round.start`) and lets the resolver build the `full`-mode string from the per-game registry plus current round payload (e.g. word, count). Game callers stop passing prompt strings.

### 9.4 Voice & Instructions form

New section in `AdvancedConfigModal` titled **"Voice & Instructions"**. Grouped per phase, dropdowns per event:

```text
Voice & Instructions                              [Reset to grade defaults]

 GAME
  ▸ Game prepare        [Default ▾]   default for year1-2: brief
  ▸ Game start          [Default ▾]   default for year1-2: full
  ▸ Pause / Resume      [Default ▾]   default for year1-2: off / brief
  ▸ Game over           [Default ▾]   default for year1-2: full

 ROUND
  ▸ Round start         [Default ▾]   default for year1-2: full
  ▸ Round idle (re-cue) [Default ▾]   default for year1-2: brief
  ▸ Round error         [Default ▾]   default for year1-2: full
  ▸ Round correct       [Default ▾]   default for year1-2: brief
  ▸ Round celebrate     [Default ▾]   default for year1-2: brief
  ▸ Round advance       [Default ▾]   default for year1-2: brief

 LEVEL
  ▸ Level complete      [Default ▾]   default for year1-2: full
```

- Each dropdown: `Default | Off | Brief | Full`. `Default` means "do not store an override; fall through to gradeBand baseline".
- The "default for `<gradeBand>`" hint reflects the customGame's currently-resolved gradeBand.
- "Reset to grade defaults" clears `customGame.events` entirely.
- `customGame.tts` (free-text) is **not exposed** — Spec 1a stores `null`/undefined; #230 will surface it.

## 10. i18n Keys

Pattern: `tts.<game-id>.<event-kebab>.<mode>`.

Initial keys (illustrative):

```jsonc
// src/lib/i18n/locales/en/games.json (add top-level "tts" key)
{
  "tts": {
    "word-spell": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "brief": "Let's spell.",
        "full": "Let's spell some words. Drag the tiles to spell each word.",
      },
      "round-start": {
        "brief": "{{word}}",
        "full": "Spell the word {{word}}.",
      },
      "round-idle": {
        "brief": "{{word}}.",
        "full": "Drag a tile into a slot to spell {{word}}.",
      },
      "round-error": {
        "brief": "Try again.",
        "full": "Try again. The word is {{word}}.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — {{word}}!",
      },
      "round-advance": {
        "brief": "{{word}}",
        "full": "Now spell {{word}}.",
      },
      "level-complete": {
        "brief": "Level complete.",
        "full": "Level complete. You spelled {{count}} words.",
      },
      "game-over": {
        "brief": "Done.",
        "full": "Game over. You spelled {{count}} words.",
      },
    },
    "number-match": {
      "round-start": {
        "brief": "{{count}}",
        "full": "Find the matching number for {{count}}.",
      },
      // … same shape …
    },
    "sort-numbers": {
      "round-start": {
        "brief": "{{direction}} from {{from}} to {{to}}",
        "full": "Sort these numbers in {{direction}} order, skip by {{step}}.",
      },
      // … same shape …
    },
  },
}
```

Mirror keys exist in `pt-BR/games.json`. Translations are placeholder English at first; Portuguese values are filled by the translator in a follow-up.

The `instructions.*` keys remain (still used by the renamed Game Options panel for non-TTS labels: name dialogs, save prompts, etc.).

## 11. Implementation Plan Outline (file-level)

> Fine-grained sequencing lands in the implementation plan (writing-plans skill, next step). This section is the architecture map.

### 11.1 New files

```text
src/lib/lifecycle-tts/
├── types.ts                  # LifecycleEvent, Verbosity, registry types
├── resolve.ts                # verbosity + copy chains, aliasOf handling
├── useLifecycleTTS.ts        # hook: subscribes to GameEventBus, calls speech
├── registry/
│   ├── index.ts              # GameLifecycleRegistry assembly
│   ├── word-spell.ts
│   ├── number-match.ts
│   ├── sort-numbers.ts
│   └── spot-all.ts
└── lifecycle-tts.test.ts

src/components/questions/QuestionRow/
├── QuestionRow.tsx
├── QuestionRow.stories.tsx
└── QuestionRow.test.tsx
```

### 11.2 Renamed / moved files

```text
src/components/answer-game/InstructionsOverlay/
  → src/components/answer-game/GameOptions/
     ├── GameOptionsOverlay.tsx        (was InstructionsOverlay.tsx)
     ├── GameOptionsOverlay.stories.tsx
     ├── GameOptionsOverlay.test.tsx
     └── useConfigDraft.ts             (unchanged content)
```

Update all imports across the codebase.

### 11.3 Modified files

| File                                                   | Change                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                             | Add 5 new bus events (prepare, round-idle, round-celebrate, pause, resume).                       |
| `src/lib/skin/game-skin.ts`                            | Add optional `tts` field on `GameSkin`.                                                           |
| `src/lib/skin/classic-skin.ts`                         | (no change — leaves `tts` undefined)                                                              |
| `src/components/questions/AudioButton/AudioButton.tsx` | Switch from `prompt` prop to lifecycle-event prop; always speak `full`; remove `ttsEnabled` gate. |
| `src/games/word-spell/WordSpell/WordSpell.tsx`         | Use `<QuestionRow>`; pass event prop to AudioButton.                                              |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`   | Same.                                                                                             |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`   | Add `useLifecycleTTS` subscription (no AudioButton today).                                        |
| `src/games/spot-all/SpotAll/SpotAll.tsx`               | Same.                                                                                             |
| `src/components/answer-game/useGameTTS.ts`             | Split `speakAuto` (gated by `ttsEnabled`) and `speakOnDemand` (always).                           |
| `src/components/answer-game/useRoundTTS.ts`            | Becomes a thin wrapper over `useLifecycleTTS('round.start')`.                                     |
| `src/components/AdvancedConfigModal.tsx`               | Add "Voice & Instructions" section.                                                               |
| `src/lib/i18n/locales/{en,pt-BR}/games.json`           | Add `tts.*` keys + form labels under `instructions.*`.                                            |
| `src/routes/$locale/_app/game/$gameId.tsx`             | Update `InstructionsOverlay` import to `GameOptionsOverlay`.                                      |

### 11.4 Tests

- `lifecycle-tts.test.ts` — verbosity resolver, copy resolver, alias handling, missing-override fallthrough, `ttsEnabled` gate on auto-speak only.
- `useLifecycleTTS.test.tsx` — bus subscriptions, dedup of overlapping events.
- `GameOptionsOverlay.test.tsx` — no auto-speak; `game:prepare` emitted on mount.
- `AudioButton.test.tsx` — renders unconditionally; always calls `speakOnDemand` with mode `full`.
- `useRoundTTS.test.tsx` — extended to cover the lifecycle wrapper.
- New regression tests per the bug-fix discipline in CLAUDE.md (TDD).

### 11.5 Storybook stories

Per `write-storybook` skill conventions:

- `GameOptionsOverlay.stories.tsx` — Playground with config draft control.
- `QuestionRow.stories.tsx` — Playground with text + audio button slot.
- `AudioButton.stories.tsx` — extend Playground to flip `event` and `customGame.events` config.
- `LifecycleTTSExplorer.stories.tsx` (new at `src/lib/lifecycle-tts/LifecycleTTSExplorer.stories.tsx`) — surfaces the per-game registry tables visually so the "CMS later" path has a starting point.

### 11.6 Architecture docs

Game-state engine touch-points trigger `update-architecture-docs` (per CLAUDE.md): the AnswerGame reducer, `useRoundTTS`, and any Behavior/Drag files modified must update co-located `.mdx` docs in the same PR.

## 12. Spec 1b Preview (deferred — for awareness only)

Spec 1a explicitly does **not** ship these; calling them out so the lifecycle event vocabulary supports them when 1b lands.

1. **WordSpell phoneme speech.** `useGameTTS.speakTile` callers in WordSpell pass the phoneme `(p)` from word-data `(g, p)` pairs instead of letter names. No new data modeling — phoneme data already lives on word records (cf. WordFilter `graphemesAllowed` `(g, p)` contract).
2. **Round-end explain sequence.** On `round.correct` for `pre-k`/`k` verbosity ladder: for each placed grapheme cluster → highlight tile + speak phoneme → after final → highlight whole word + speak full word → fire `round.celebrate` (confetti).
3. **Highlight tokens.** Add `--skin-tile-speaking-bg`, `--skin-tile-speaking-fg`, and `--skin-tile-speaking-outline` skin tokens (default to `--skin-tile-bg` etc. so non-themed skins keep working). Tile component reads `data-speaking="true"`.
4. **Orchestration hook.** `useExplainSequence(word, phonemes)` driven by Web Speech `onstart`/`onend` events; returns `{ currentTileIndex, isWholeWord }` for tile components to consume.
5. **`round.error` "Try again — the word is X"** wiring: requires per-game error-detection contract that does not exist yet. Schema slot is already in 1a; behavior wiring is 1b or later.

Spec 1b will reference Spec 1a as the foundation contract.

## 13. Open Items / Future References

### 13.1 Issue cross-links

- Spec 1a depends on the existing `GameEventBus` infrastructure ([src/types/game-events.ts:133](src/types/game-events.ts:133)).
- The hidden `customGame.tts?` slot is reserved for [issue #230](https://github.com/leocaseiro/base-skill/issues/230). After the spec lands, comment on #230 noting the schema dependency.
- The simplified preset picker in the Game Options panel is a placeholder slot for [issue #300](https://github.com/leocaseiro/base-skill/issues/300).
- Spec 2 (tour + `?` icon) and Spec 1b (phoneme + round-end explain) are tracked separately under issue #229's umbrella.

### 13.2 Storybook surface for the registry

`LifecycleTTSExplorer.stories.tsx` (new) renders a table per gameId:

```text
WordSpell                                                    [Switch gradeBand: year1-2 ▾]

  Event              | Verbosity | brief                | full
  ------------------ | --------- | -------------------- | ------------------------------------
  game.prepare       | brief     | WordSpell            | WordSpell. Tap Let's go to start…
  game.start         | full      | Let's spell.         | Let's spell some words. Drag…
  round.start        | full      | cat                  | Spell the word cat.
  …
```

This is the "CMS later" surface: a future migration moves these JSON tables into a CMS without changing the runtime resolver.

### 13.3 SRS scoring on pause/resume

Out of scope for Spec 1a. Flagged here so that whoever wires `game.pause`/`game.resume` to scoring later knows the lifecycle hooks already exist.

## 14. Acceptance Criteria

Spec 1a is complete when:

- [ ] `InstructionsOverlay` is renamed to `GameOptionsOverlay` and **does not auto-speak** on mount.
- [ ] The 12 lifecycle events are subscribed via `useLifecycleTTS` (engine-driven for the canonical 9; game-driven for `round.idle`).
- [ ] Five new bus events are added to `GameEventBus`.
- [ ] CustomGame schema accepts `events?` and `tts?` overrides; only `events?` is surfaced in the Voice & Instructions form.
- [ ] `GameSkin` accepts an optional `tts?` field.
- [ ] AudioButton renders unconditionally and always speaks the resolved `full` copy for its event.
- [ ] `ttsEnabled: false` silences auto-speak only; AudioButton still works.
- [ ] `<QuestionRow>` renders inline (icon left, content right) on all breakpoints.
- [ ] Per-game registry entries exist for WordSpell, NumberMatch, SortNumbers, SpotAll with documented `byGradeBand` defaults.
- [ ] i18n keys for `tts.*` exist in `en` and `pt-BR` (Portuguese strings may be placeholder English pending translation).
- [ ] All tests pass; new TDD regression tests exist for verbosity resolution, copy resolution, alias handling, and `ttsEnabled` gate semantics.
- [ ] Storybook surfaces `LifecycleTTSExplorer` with the registry tables.
- [ ] Architecture docs (`.mdx`) co-located with modified game-state files are updated in the same PR per CLAUDE.md.

---

**Status:** Ready for implementation plan (writing-plans skill, next step).

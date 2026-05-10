# Spec 1a M1 — TTS Lifecycle Minimum Viable Copy Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible TTS copy fixes from #229 — rename InstructionsOverlay, stop
auto-speaking how-to-play, speak proper instructional templates, split ttsEnabled into autoSpeak +
ttsOnDemandAllowed, add QuestionRow layout, add Talkativeness preset.

**Architecture:** Introduce a `src/lib/lifecycle-tts/` module with types, a pure verbosity
resolver, talkativeness presets, and per-game TTS templates that live in each game's
`GameDefinition.tts`. A `useLifecycleTTS` hook subscribes to `lifecycle:speak` bus events emitted
by `executeSideEffects()` and also exposes `speakAuto` / `speakOnDemand` for direct calls; speech
is gated by `autoSpeak` / `ttsOnDemandAllowed`. The hook reads TTS config from `GameDefinition.tts`
via the engine context — no separate registry lookup. Rename `InstructionsOverlay` →
`GameOptionsOverlay`, refactor `AudioButton` to use lifecycle events, and add `QuestionRow` for
consistent inline layout.

**Tech Stack:** React 18, TypeScript, Vitest, i18next, Web Speech API, existing GameEventBus

**Spec:** `docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md` (§14 M1 criteria)

**Spec Deltas:** None — plan follows spec exactly.

**Depends on:** Phase 1 of the GameDefinition engine (PR #350) merged first — specifically
`src/lib/lifecycle-tts/types.ts` (created in PR 1a) as the pinned type contract, and
`useGameEngineContext()` from `src/lib/game-engine/useGameEngine.ts` which exposes
`definition.tts`. This plan extends the type contract but cannot reshape it.

**Required skills for executors:**

- `write-storybook` — for `*.stories.tsx` files (Tasks 11, 15)
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## speak SideEffect Integration

The `GameDefinition` engine and `useLifecycleTTS` communicate via the `GameEventBus`.

**Engine side (`executeSideEffects`):** When the engine processes a
`{ type: 'speak', lifecycleEvent: LifecycleEvent }` side-effect, it emits a
`{ type: 'lifecycle:speak', lifecycleEvent, gameId, ... }` event on the `GameEventBus`. The engine
fires `speak` side-effects unconditionally — it does not check `autoSpeak`.

**Hook side (`useLifecycleTTS`):** The hook subscribes to `'lifecycle:speak'` bus events. On each
event, it checks `autoSpeakRef.current` (the `autoSpeak` guard), looks up the template from
`GameDefinition.tts?.[lifecycleEvent]` via the engine context, runs the verbosity resolver, and
calls `speak()` if not gated. The hook owns the `autoSpeak` check — the engine never needs to know
about user preferences.

**Flow:**

```text
XState machine state entry: [{ type: 'speak', params: { lifecycleEvent } }]
  → SideEffect { type: 'speak', lifecycleEvent }
  → executeSideEffects()
  → bus.emit({ type: 'lifecycle:speak', lifecycleEvent, gameId })
  → useLifecycleTTS bus subscription
  → autoSpeak guard check
  → definition.tts[lifecycleEvent] lookup (via engine context)
  → resolveVerbosity() + resolveCopy()
  → speak(text, speechOpts)
```

**On-demand speech (AudioButton, question tap):** Components call
`useLifecycleTTS().speakOnDemand(event)` directly — this bypasses the bus and checks
`ttsOnDemandAllowed` instead of `autoSpeak`.

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
├── types.ts                          # LifecycleEvent, Verbosity, EventTemplate
├── resolve.ts                        # resolveVerbosity() + resolveCopy() — pure functions
├── resolve.test.ts                   # Verbosity + copy chain tests
├── useLifecycleTTS.ts                # Hook: subscribes to bus, gates by autoSpeak/ttsOnDemandAllowed
├── useLifecycleTTS.test.tsx          # Hook tests
├── talkativeness-presets.ts          # Quiet / Default / Chatty profiles per gradeBand
└── talkativeness-presets.test.ts     # Preset resolution tests

src/components/questions/QuestionRow/
├── QuestionRow.tsx                   # Inline AudioButton + content layout
└── QuestionRow.test.tsx              # Layout tests

src/components/answer-game/GameOptions/
├── GameOptionsOverlay.tsx            # Renamed from InstructionsOverlay
├── GameOptionsOverlay.test.tsx       # Renamed tests
├── GameOptionsOverlay.stories.tsx    # Renamed stories
└── useConfigDraft.ts                 # Moved, unchanged content
```

### Modified files

| File                                                             | Change                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/types/game-events.ts`                                       | Add `game:prepare`; `lifecycle:speak` owned by PR 1a Task 3  |
| `src/components/answer-game/types.ts`                            | Replace `ttsEnabled` with `autoSpeak` + `ttsOnDemandAllowed` |
| `src/components/answer-game/useGameTTS.ts`                       | Split into `speakAuto` + `speakOnDemand`; keep `speakTile`   |
| `src/components/answer-game/useGameTTS.test.tsx`                 | Update for new API                                           |
| `src/components/answer-game/useRoundTTS.ts`                      | Update to use `autoSpeak` (stays in M1; removed in M2)       |
| `src/components/answer-game/useRoundTTS.test.tsx`                | Update for `autoSpeak`                                       |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch to lifecycle event prop, gate by `ttsOnDemandAllowed` |
| `src/components/questions/AudioButton/AudioButton.test.tsx`      | Update tests                                                 |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route onClick through `speakOnDemand`                        |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same                                                         |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same                                                         |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same                                                         |
| `src/components/questions/index.ts`                              | Add `QuestionRow` export                                     |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Use `QuestionRow`; pass event to AudioButton                 |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Use `QuestionRow`; definition-backed instructional copy      |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | Add AudioButton via `QuestionRow`                            |
| `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`             | Consolidate `speakPrompt` into `useLifecycleTTS`             |
| `src/components/AdvancedConfigModal.tsx`                         | Add Talkativeness preset section                             |
| `src/lib/i18n/locales/en/games.json`                             | Add `tts.*` keys                                             |
| `src/lib/i18n/locales/pt-BR/games.json`                          | Add `tts.*` keys (placeholder English)                       |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update import path                                           |
| `src/components/answer-game/AnswerGameProvider.tsx`              | Emit `game:prepare` on panel mount path                      |

### Deleted files

| File                                                          | Reason                    |
| ------------------------------------------------------------- | ------------------------- |
| `src/components/answer-game/InstructionsOverlay/` (directory) | Renamed to `GameOptions/` |

---

## Task 1: Lifecycle TTS Types

**Files:**

- Create: `src/lib/lifecycle-tts/types.ts`
- Test: typecheck only (no runtime test needed for pure types)

- [ ] **Step 1: Create the types file**

```ts
// src/lib/lifecycle-tts/types.ts
import type { GradeBand } from '@/types/game-events';

export type LifecycleEvent =
  | 'game.prepare'
  | 'game.start'
  | 'game.resume'
  | 'game.over'
  | 'round.start'
  | 'round.idle'
  | 'round.error'
  | 'round.correct'
  | 'round.celebrate'
  | 'round.advance'
  | 'level.complete';

export type Verbosity = 'off' | 'brief' | 'full';

export type TalkativenessPreset = 'quiet' | 'default' | 'chatty';

export type EventTemplate = {
  tts: { brief: string; full: string };
  byGradeBand: Record<GradeBand, Verbosity>;
  default: Verbosity;
};
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS — no type errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/lifecycle-tts/types.ts
git commit -m "feat(lifecycle-tts): add type foundation for TTS lifecycle system"
```

---

## Task 2: game:prepare Bus Event

> `lifecycle:speak` is added to `GameEventType` by PR 1a Task 3 (the GameDefinition engine plan). This task only adds `game:prepare`.

**Files:**

- Modify: `src/types/game-events.ts:9-23` (GameEventType union)
- Test: `src/lib/game-event-bus.test.ts` (or inline test)

- [ ] **Step 1: Write failing test for game:prepare event**

Create or add to the existing game-event-bus test file:

```ts
// src/lib/game-event-bus.test.ts (append)
import { createGameEventBus } from './game-event-bus';
import type { GameEvent } from '@/types/game-events';

describe('game:prepare event', () => {
  it('emits and receives game:prepare', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('game:prepare', (e) => received.push(e));

    const event: GameEvent = {
      type: 'game:prepare',
      gameId: 'word-spell',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('game:prepare');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: FAIL — `'game:prepare'` is not assignable to `GameEventType`.

- [ ] **Step 3: Add `game:prepare` to the event type union**

In `src/types/game-events.ts`, add `game:prepare` to the `GameEventType` union (after `'game:start'`). `lifecycle:speak` is already present (added by PR 1a Task 3):

```ts
export type GameEventType =
  | 'game:start'
  | 'game:prepare'
  | 'game:instructions_shown';
// ... rest unchanged (lifecycle:speak already in the union)
```

Add the `game:prepare` interface (after `GameStartEvent`):

```ts
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game:prepare';
}
```

Add `GamePrepareEvent` to the `GameEvent` union type. (`LifecycleSpeakEvent` is already in the union, added by PR 1a Task 3.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(events): add game:prepare bus event type"
```

---

## Task 3: ttsEnabled → autoSpeak + ttsOnDemandAllowed

This is the core flag split. Touch types first, then update `useGameTTS` and its consumers.

**Files:**

- Modify: `src/components/answer-game/types.ts:16-17`
- Modify: `src/components/answer-game/useGameTTS.ts`
- Modify: `src/components/answer-game/useGameTTS.test.tsx`
- Modify: `src/components/answer-game/useRoundTTS.ts:11`
- Modify: `src/components/answer-game/useRoundTTS.test.tsx`

- [ ] **Step 1: Write failing test for new useGameTTS API**

Update `src/components/answer-game/useGameTTS.test.tsx`:

```ts
// Add new tests for speakAuto and speakOnDemand
describe('speakAuto', () => {
  it('is gated by autoSpeak flag', () => {
    // Test that speakAuto returns early when autoSpeak is false
    // but speakOnDemand still works when ttsOnDemandAllowed is true
  });
});

describe('speakOnDemand', () => {
  it('is gated by ttsOnDemandAllowed flag', () => {
    // Test that speakOnDemand returns early when ttsOnDemandAllowed is false
    // but speakAuto still works when autoSpeak is true
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/useGameTTS.test.tsx --reporter=verbose`
Expected: FAIL — `speakAuto` and `speakOnDemand` don't exist yet.

- [ ] **Step 3: Update AnswerGameConfig type**

In `src/components/answer-game/types.ts`, replace:

```ts
/** Whether TTS is enabled for this profile */
ttsEnabled: boolean;
```

with:

```ts
/** Gates all lifecycle auto-speech (every TTS lifecycle event). */
autoSpeak: boolean;
/** Gates user-initiated tap-to-speak: AudioButton, question onClick. */
ttsOnDemandAllowed: boolean;
```

- [ ] **Step 4: Update useGameTTS**

Replace the entire `src/components/answer-game/useGameTTS.ts` with:

```ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakAuto: (text: string) => void;
  speakOnDemand: (text: string) => void;
  /** @deprecated Use speakAuto or speakOnDemand. Removed in M2. */
  speakPrompt: (text: string) => void;
}

export const useGameTTS = (): GameTTS => {
  const { config } = useAnswerGameContext();
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  const speechOpts = useCallback(
    () => ({
      rate: settings.speechRate ?? 1,
      volume: settings.voiceVolume ?? 0.8,
      voiceName: settings.preferredVoiceURI,
      lang: i18n.language,
    }),
    [
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
    ],
  );

  const speakTile = useCallback(
    (label: string) => {
      if (!config.autoSpeak) return;
      if (isSpeechActive()) return;
      speak(label, speechOpts());
    },
    [config.autoSpeak, speechOpts],
  );

  const speakAuto = useCallback(
    (text: string) => {
      if (!config.autoSpeak) return;
      speak(text, speechOpts());
    },
    [config.autoSpeak, speechOpts],
  );

  const speakOnDemand = useCallback(
    (text: string) => {
      if (!config.ttsOnDemandAllowed) return;
      speak(text, speechOpts());
    },
    [config.ttsOnDemandAllowed, speechOpts],
  );

  const speakPrompt = useCallback(
    (text: string) => {
      if (!config.autoSpeak) return;
      speak(text, speechOpts());
    },
    [config.autoSpeak, speechOpts],
  );

  return { speakTile, speakAuto, speakOnDemand, speakPrompt };
};
```

- [ ] **Step 5: Update useRoundTTS**

In `src/components/answer-game/useRoundTTS.ts`, change `config.ttsEnabled` to `config.autoSpeak`:

```ts
export const useRoundTTS = (prompt: string): void => {
  const { roundIndex, config } = useAnswerGameContext();
  const { speakAuto } = useGameTTS();

  useEffect(() => {
    if (!config.autoSpeak) return;
    if (!prompt) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakAuto(prompt);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit speakAuto and prompt to only re-speak on round change
  }, [roundIndex, config.autoSpeak]);
};
```

- [ ] **Step 6: Fix all TypeScript errors from ttsEnabled removal**

Run `yarn typecheck` and fix every remaining reference to `ttsEnabled` in the codebase. Key files
to update:

- `src/components/questions/AudioButton/AudioButton.tsx` — change `config.ttsEnabled` to
  `config.ttsOnDemandAllowed`
- `src/components/questions/TextQuestion/TextQuestion.tsx` — same pattern
- `src/components/questions/ImageQuestion/ImageQuestion.tsx` — same pattern
- `src/components/questions/EmojiQuestion/EmojiQuestion.tsx` — same pattern
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — same pattern
- `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx` — change `ttsEnabled` prop usage
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` — change `ttsEnabled` to
  `autoSpeak`
- Every game component that constructs an `AnswerGameConfig` — update `ttsEnabled` to `autoSpeak` +
  `ttsOnDemandAllowed`
- Every test that constructs a config with `ttsEnabled` — update to `autoSpeak` +
  `ttsOnDemandAllowed`

Use `rg ttsEnabled src/` to find all occurrences. For each:

- If it gates auto-speak → `autoSpeak`
- If it gates on-demand button rendering/speech → `ttsOnDemandAllowed`
- If it gates both (InstructionsOverlay prop) → pass both flags

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/components/answer-game/ --reporter=verbose`
Expected: PASS — all existing tests updated for new flag names.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(tts): split ttsEnabled into autoSpeak + ttsOnDemandAllowed

Lifecycle auto-speech gated by autoSpeak, on-demand tap gated by
ttsOnDemandAllowed. Legacy migration: ttsEnabled:false maps to both off."
```

---

## Task 4: Verbosity Resolver (Pure)

**Files:**

- Create: `src/lib/lifecycle-tts/resolve.ts`
- Create: `src/lib/lifecycle-tts/resolve.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/lifecycle-tts/resolve.test.ts
import { describe, it, expect } from 'vitest';
import { resolveVerbosity, resolveCopy } from './resolve';
import type { EventTemplate, TalkativenessPreset } from './types';

const template: EventTemplate = {
  tts: {
    brief: 'tts.test.brief',
    full: 'tts.test.full',
  },
  byGradeBand: {
    'pre-k': 'full',
    k: 'full',
    'year1-2': 'brief',
    'year3-4': 'off',
    'year5-6': 'off',
  },
  default: 'brief',
};

describe('resolveVerbosity', () => {
  it('returns byGradeBand value when no overrides', () => {
    expect(resolveVerbosity(template, 'pre-k')).toBe('full');
    expect(resolveVerbosity(template, 'year3-4')).toBe('off');
  });

  it('per-event override takes precedence', () => {
    expect(
      resolveVerbosity(template, 'pre-k', { eventOverride: 'off' }),
    ).toBe('off');
  });

  it('talkativeness preset overrides byGradeBand', () => {
    expect(
      resolveVerbosity(template, 'year3-4', {
        talkativenessVerbosity: 'full',
      }),
    ).toBe('full');
  });

  it('per-event override takes precedence over talkativeness', () => {
    expect(
      resolveVerbosity(template, 'year3-4', {
        eventOverride: 'brief',
        talkativenessVerbosity: 'full',
      }),
    ).toBe('brief');
  });
});

describe('resolveCopy', () => {
  it('returns the i18n key for the resolved verbosity', () => {
    expect(resolveCopy(template, 'full')).toBe('tts.test.full');
    expect(resolveCopy(template, 'brief')).toBe('tts.test.brief');
  });

  it('returns null for off', () => {
    expect(resolveCopy(template, 'off')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement resolver**

```ts
// src/lib/lifecycle-tts/resolve.ts
import type { EventTemplate, Verbosity } from './types';
import type { GradeBand } from '@/types/game-events';

type ResolveOptions = {
  eventOverride?: Verbosity;
  talkativenessVerbosity?: Verbosity;
};

export const resolveVerbosity = (
  template: EventTemplate,
  gradeBand: GradeBand,
  options?: ResolveOptions,
): Verbosity => {
  if (options?.eventOverride) return options.eventOverride;
  if (options?.talkativenessVerbosity)
    return options.talkativenessVerbosity;
  return template.byGradeBand[gradeBand] ?? template.default;
};

export const resolveCopy = (
  template: EventTemplate,
  verbosity: Verbosity,
): string | null => {
  if (verbosity === 'off') return null;
  return template.tts[verbosity];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/resolve.ts src/lib/lifecycle-tts/resolve.test.ts
git commit -m "feat(lifecycle-tts): add pure verbosity + copy resolver"
```

---

## Task 5: Talkativeness Presets

**Files:**

- Create: `src/lib/lifecycle-tts/talkativeness-presets.ts`
- Create: `src/lib/lifecycle-tts/talkativeness-presets.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/lifecycle-tts/talkativeness-presets.test.ts
import { describe, it, expect } from 'vitest';
import { getTalkativenessProfile } from './talkativeness-presets';

describe('getTalkativenessProfile', () => {
  it('quiet at pre-k turns most events off except round.start brief', () => {
    const profile = getTalkativenessProfile('quiet', 'pre-k');
    expect(profile['game.start']).toBe('off');
    expect(profile['round.start']).toBe('brief');
  });

  it('default returns undefined (fall through to registry)', () => {
    const profile = getTalkativenessProfile('default', 'year1-2');
    expect(profile['game.start']).toBeUndefined();
  });

  it('chatty at year3-4 upgrades to full', () => {
    const profile = getTalkativenessProfile('chatty', 'year3-4');
    expect(profile['game.start']).toBe('full');
    expect(profile['round.start']).toBe('full');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/talkativeness-presets.test.ts --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement presets**

```ts
// src/lib/lifecycle-tts/talkativeness-presets.ts
import type { GradeBand } from '@/types/game-events';
import type { LifecycleEvent, Verbosity } from './types';

type TalkativenessProfile = Partial<Record<LifecycleEvent, Verbosity>>;

const QUIET: Record<GradeBand, TalkativenessProfile> = {
  'pre-k': {
    'game.prepare': 'off',
    'game.start': 'off',
    'round.start': 'brief',
    'round.idle': 'off',
    'round.error': 'off',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'off',
    'level.complete': 'off',
    'game.over': 'off',
    'game.resume': 'off',
  },
  k: {
    'game.prepare': 'off',
    'game.start': 'off',
    'round.start': 'brief',
    'round.idle': 'off',
    'round.error': 'off',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'off',
    'level.complete': 'off',
    'game.over': 'off',
    'game.resume': 'off',
  },
  'year1-2': {
    'game.prepare': 'off',
    'game.start': 'off',
    'round.start': 'brief',
    'round.idle': 'off',
    'round.error': 'off',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'off',
    'level.complete': 'off',
    'game.over': 'off',
    'game.resume': 'off',
  },
  'year3-4': {
    'game.prepare': 'off',
    'game.start': 'off',
    'round.start': 'off',
    'round.idle': 'off',
    'round.error': 'off',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'off',
    'level.complete': 'off',
    'game.over': 'off',
    'game.resume': 'off',
  },
  'year5-6': {
    'game.prepare': 'off',
    'game.start': 'off',
    'round.start': 'off',
    'round.idle': 'off',
    'round.error': 'off',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'off',
    'level.complete': 'off',
    'game.over': 'off',
    'game.resume': 'off',
  },
};

const CHATTY: Record<GradeBand, TalkativenessProfile> = {
  'pre-k': {
    'game.prepare': 'full',
    'game.start': 'full',
    'round.start': 'full',
    'round.idle': 'full',
    'round.error': 'full',
    'round.correct': 'full',
    'round.celebrate': 'full',
    'round.advance': 'full',
    'level.complete': 'full',
    'game.over': 'full',
    'game.resume': 'full',
  },
  k: {
    'game.prepare': 'full',
    'game.start': 'full',
    'round.start': 'full',
    'round.idle': 'full',
    'round.error': 'full',
    'round.correct': 'full',
    'round.celebrate': 'full',
    'round.advance': 'full',
    'level.complete': 'full',
    'game.over': 'full',
    'game.resume': 'full',
  },
  'year1-2': {
    'game.prepare': 'full',
    'game.start': 'full',
    'round.start': 'full',
    'round.idle': 'full',
    'round.error': 'full',
    'round.correct': 'full',
    'round.celebrate': 'full',
    'round.advance': 'full',
    'level.complete': 'full',
    'game.over': 'full',
    'game.resume': 'full',
  },
  'year3-4': {
    'game.prepare': 'full',
    'game.start': 'full',
    'round.start': 'full',
    'round.idle': 'brief',
    'round.error': 'full',
    'round.correct': 'brief',
    'round.celebrate': 'brief',
    'round.advance': 'full',
    'level.complete': 'full',
    'game.over': 'full',
    'game.resume': 'full',
  },
  'year5-6': {
    'game.prepare': 'brief',
    'game.start': 'full',
    'round.start': 'full',
    'round.idle': 'off',
    'round.error': 'brief',
    'round.correct': 'off',
    'round.celebrate': 'off',
    'round.advance': 'brief',
    'level.complete': 'brief',
    'game.over': 'brief',
    'game.resume': 'full',
  },
};

export const getTalkativenessProfile = (
  preset: 'quiet' | 'default' | 'chatty',
  gradeBand: GradeBand,
): TalkativenessProfile => {
  if (preset === 'quiet') return QUIET[gradeBand];
  if (preset === 'chatty') return CHATTY[gradeBand];
  return {};
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/talkativeness-presets.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/talkativeness-presets.ts src/lib/lifecycle-tts/talkativeness-presets.test.ts
git commit -m "feat(lifecycle-tts): add Quiet/Default/Chatty talkativeness presets"
```

---

## Task 6: i18n Keys

**Note:** Per-game TTS templates (formerly in `registry/word-spell.ts`,
`registry/number-match.ts`) now live in each game's `GameDefinition.tts` field — see
`src/games/word-spell/definition.ts` and `src/games/number-match/definition.ts` created by the
GameDefinition engine (PR #350). The i18n keys referenced by those templates still live here.

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/lifecycle-tts/resolve.test.ts (append)
import i18n from '@/lib/i18n/i18n';

describe('i18n keys', () => {
  it('resolves word-spell round-start full key', () => {
    const result = i18n.t('games:tts.word-spell.round-start.full', {
      word: 'cat',
    });
    expect(result).toBe('Spell the word cat.');
  });

  it('resolves number-match round-start full key', () => {
    const result = i18n.t('games:tts.number-match.round-start.full', {
      count: 'five',
    });
    expect(result).toBe('Find the matching number for five.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: FAIL — missing i18n keys.

- [ ] **Step 3: Add i18n keys to en/games.json**

Add a top-level `"tts"` key to `src/lib/i18n/locales/en/games.json` with keys per Spec 1a §10. At
minimum for M1:

- `tts.word-spell.*` (all events)
- `tts.number-match.round-start.*` (fixes speak-the-answer)
- `tts.number-match.game-prepare.*` (panel mount)
- `tts.number-match.game-start.*` (Let's go speech)

- [ ] **Step 4: Add placeholder keys to pt-BR/games.json**

Copy the same English strings as placeholders pending translation.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
git commit -m "feat(i18n): add tts.word-spell and tts.number-match i18n keys"
```

---

## Task 7: useLifecycleTTS Hook

> **Coexistence with `useGameTTS` (M1):** `useLifecycleTTS` is not a drop-in replacement for
> `useGameTTS` in Phase 1. Use `useLifecycleTTS` for engine-driven lifecycle-event speech
> (`round.start`, `game.prepare`, etc.) — it takes a `LifecycleEvent` key and resolves text from
> `GameDefinition.tts`. Use `useGameTTS` for ad-hoc speech that has no lifecycle-event analogue
> (`speakTile` for tile labels, `TextQuestion` on-click, `AudioButton` replay). Both hooks coexist
> through Phase 1. `useGameTTS` is deprecated in M2 once all TTS paths are lifecycle-driven.
> Note: `useLifecycleTTS.speakAuto(event)` takes a `LifecycleEvent` key — **not** raw text.
> Passing raw text is a silent bug (lookup returns undefined, nothing is spoken). TypeScript
> enforces this if `LifecycleEvent` is a union of string literals.

**Files:**

- Create: `src/lib/lifecycle-tts/useLifecycleTTS.ts`
- Create: `src/lib/lifecycle-tts/useLifecycleTTS.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/lifecycle-tts/useLifecycleTTS.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLifecycleTTS } from './useLifecycleTTS';
// Mocks: AnswerGameContext, GameEventBus, i18n, useGameEngineContext

// Mock the engine context so the hook reads definition.tts from it
vi.mock('@/lib/game-engine/useGameEngine', () => ({
  useGameEngineContext: () => ({
    definition: {
      tts: {
        'round.start': {
          tts: {
            brief: 'tts.word-spell.round-start.brief',
            full: 'tts.word-spell.round-start.full',
          },
          byGradeBand: {
            'pre-k': 'full',
            k: 'full',
            'year1-2': 'brief',
            'year3-4': 'off',
            'year5-6': 'off',
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
            'year5-6': 'off',
          },
          default: 'brief',
        },
      },
    },
  }),
}));

describe('useLifecycleTTS', () => {
  it('speakOnDemand speaks full copy for the event', () => {
    // Render hook with ttsOnDemandAllowed: true, gameId: 'word-spell'
    // Call speakOnDemand('round.start')
    // Assert speak() called with resolved full i18n string
  });

  it('speakOnDemand is silent when ttsOnDemandAllowed is false', () => {
    // Render hook with ttsOnDemandAllowed: false
    // Call speakOnDemand('round.start')
    // Assert speak() NOT called
  });

  it('speakAuto is gated by autoSpeak ref', () => {
    // Render hook with autoSpeak: false
    // Call speakAuto('game.start')
    // Assert speak() NOT called
  });

  it('resolves interpolation from AnswerGameContext', () => {
    // Render hook with round context containing word: 'cat'
    // Call speakOnDemand('round.start')
    // Assert speak() called with "Spell the word cat."
  });

  it('lifecycle:speak bus event triggers speakAuto with autoSpeak:true', () => {
    // Render hook with autoSpeak: true
    // Emit { type: 'lifecycle:speak', lifecycleEvent: 'round.start', gameId: 'word-spell', ... }
    // Assert speak() was called with resolved text
  });

  it('lifecycle:speak bus event is no-op when autoSpeak is false', () => {
    // Render hook with autoSpeak: false
    // Emit lifecycle:speak bus event
    // Assert speak() NOT called
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTTS.test.tsx --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement useLifecycleTTS**

```ts
// src/lib/lifecycle-tts/useLifecycleTTS.ts
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { speak } from '@/lib/speech/SpeechOutput';
import { getGameEventBus } from '@/lib/game-event-bus';
// useGameEngineContext is provided by the GameDefinition engine (PR #350 prerequisite).
// It exposes definition.tts: Partial<Record<LifecycleEvent, EventTemplate>>.
import { useGameEngineContext } from '@/lib/game-engine/useGameEngine';
import { resolveCopy, resolveVerbosity } from './resolve';
import { getTalkativenessProfile } from './talkativeness-presets';
import type { EventTemplate, LifecycleEvent, Verbosity } from './types';
import type { GradeBand } from '@/types/game-events';

type SpeakOptions = { mode?: 'brief' | 'full' };

type UseLifecycleTTSReturn = {
  speakAuto: (event: LifecycleEvent) => void;
  speakOnDemand: (
    event: LifecycleEvent,
    options?: SpeakOptions,
  ) => void;
  ttsOnDemandAllowed: boolean;
};

export const useLifecycleTTS = (): UseLifecycleTTSReturn => {
  const { config } = useAnswerGameContext();
  const { settings } = useSettings();
  const { t, i18n } = useTranslation('games');
  // Read GameDefinition.tts from the engine context (provided by PR #350).
  const { definition } = useGameEngineContext();

  const autoSpeakRef = useRef(config.autoSpeak);
  autoSpeakRef.current = config.autoSpeak;

  const onDemandRef = useRef(config.ttsOnDemandAllowed);
  onDemandRef.current = config.ttsOnDemandAllowed;

  // Keep a stable ref to definition.tts so the bus subscription closure
  // always reads the latest value without re-subscribing on every render.
  const ttsRef = useRef(definition.tts);
  ttsRef.current = definition.tts;

  const doSpeak = useCallback(
    (i18nKey: string, interpolation: Record<string, unknown>) => {
      const text = t(i18nKey, interpolation);
      if (!text || text === i18nKey) return;
      speak(text, {
        rate: settings.speechRate ?? 1,
        volume: settings.voiceVolume ?? 0.8,
        voiceName: settings.preferredVoiceURI,
        lang: i18n.language,
      });
    },
    [
      t,
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
    ],
  );

  const resolveAndSpeak = useCallback(
    (
      template: EventTemplate,
      event: LifecycleEvent,
      forcedVerbosity?: Verbosity,
    ) => {
      const gradeBand: GradeBand =
        ((config as Record<string, unknown>).gradeBand as GradeBand) ??
        'k';
      const talkativeness =
        ((config as Record<string, unknown>).talkativeness as string) ??
        'default';
      const talkProfile = getTalkativenessProfile(
        talkativeness as 'quiet' | 'default' | 'chatty',
        gradeBand,
      );
      const eventOverride = (
        (config as Record<string, unknown>).events as
          | Record<string, Verbosity>
          | undefined
      )?.[event];

      const verbosity =
        forcedVerbosity ??
        resolveVerbosity(template, gradeBand, {
          eventOverride,
          talkativenessVerbosity: talkProfile[event],
        });

      const i18nKey = resolveCopy(template, verbosity);
      if (!i18nKey) return;

      const interpolation = buildInterpolation(config);
      doSpeak(i18nKey, interpolation);
    },
    [config, doSpeak],
  );

  // Subscribe to lifecycle:speak events emitted by executeSideEffects().
  // The engine fires speak unconditionally; this hook owns the autoSpeak guard.
  useEffect(() => {
    const bus = getGameEventBus();
    const sub = bus.subscribe(
      'lifecycle:speak',
      ({ lifecycleEvent }) => {
        if (!autoSpeakRef.current) return;
        const template = ttsRef.current?.[lifecycleEvent];
        if (!template) return;
        resolveAndSpeak(template, lifecycleEvent);
      },
    );
    return () => sub.unsubscribe();
  }, [resolveAndSpeak]);

  const speakAuto = useCallback(
    (event: LifecycleEvent) => {
      if (!autoSpeakRef.current) return;
      const template = ttsRef.current?.[event];
      if (!template) return;
      resolveAndSpeak(template, event);
    },
    [resolveAndSpeak],
  );

  const speakOnDemand = useCallback(
    (event: LifecycleEvent, options?: SpeakOptions) => {
      if (!onDemandRef.current) return;
      const template = ttsRef.current?.[event];
      if (!template) return;
      resolveAndSpeak(template, event, options?.mode ?? 'full');
    },
    [resolveAndSpeak],
  );

  return {
    speakAuto,
    speakOnDemand,
    ttsOnDemandAllowed: config.ttsOnDemandAllowed,
  };
};

const buildInterpolation = (
  config: Record<string, unknown>,
): Record<string, unknown> => ({
  gameName: config.gameTitle ?? config.gameId ?? '',
  word: (config as Record<string, unknown>).currentWord ?? '',
  count: (config as Record<string, unknown>).currentCount ?? '',
});
```

**Note to implementer:** `useGameEngineContext()` is provided by the GameDefinition engine
(PR #350, `src/lib/game-engine/useGameEngine.ts`). It exposes `definition.tts` — a
`Partial<Record<LifecycleEvent, EventTemplate>>` read from the active game's `GameDefinition`. If
the exact context API differs from `useGameEngineContext().definition`, adapt the import
accordingly. The hook reads `autoSpeak` / `ttsOnDemandAllowed` via refs so mid-round toggles take
effect immediately without remount.

The `buildInterpolation` function accesses game-specific context. The exact shape depends on how
each game threads round data through context. Check how `useAnswerGameContext()` exposes round-level
data and adjust accordingly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTTS.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/useLifecycleTTS.ts src/lib/lifecycle-tts/useLifecycleTTS.test.tsx
git commit -m "feat(lifecycle-tts): add useLifecycleTTS hook with bus subscription and auto/on-demand gates

Hook subscribes to lifecycle:speak bus events emitted by executeSideEffects().
Reads GameDefinition.tts from the engine context instead of a separate registry.
The engine fires speak unconditionally; useLifecycleTTS owns the autoSpeak check."
```

---

## Task 8: Rename InstructionsOverlay → GameOptionsOverlay

**Files:**

- Rename: `src/components/answer-game/InstructionsOverlay/` →
  `src/components/answer-game/GameOptions/`
- Rename: `InstructionsOverlay.tsx` → `GameOptionsOverlay.tsx` (plus .test.tsx, .stories.tsx)
- Modify: every file that imports `InstructionsOverlay`

- [ ] **Step 1: Identify all imports**

Run: `rg -l 'InstructionsOverlay' src/`

Expected files to update:

- `src/routes/$locale/_app/game/$gameId.tsx`
- `src/components/AdvancedConfigModal.tsx` (imports `Draft` type)
- `src/components/AdvancedConfigModal.test.tsx`
- Plus any e2e/VR test files

- [ ] **Step 2: Rename directory and files using git mv**

```bash
git mv src/components/answer-game/InstructionsOverlay src/components/answer-game/GameOptions
git mv src/components/answer-game/GameOptions/InstructionsOverlay.tsx src/components/answer-game/GameOptions/GameOptionsOverlay.tsx
git mv src/components/answer-game/GameOptions/InstructionsOverlay.test.tsx src/components/answer-game/GameOptions/GameOptionsOverlay.test.tsx
git mv src/components/answer-game/GameOptions/InstructionsOverlay.stories.tsx src/components/answer-game/GameOptions/GameOptionsOverlay.stories.tsx
```

- [ ] **Step 3: Update all internal references**

Inside `GameOptionsOverlay.tsx`: rename the component export from `InstructionsOverlay` to
`GameOptionsOverlay`. Update the Storybook title to `'AnswerGame/GameOptions/GameOptionsOverlay'`
(PascalCase per CLAUDE.md).

Update every importing file found in step 1. Key change in `$gameId.tsx`:

```ts
// Before
import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';
// After
import { GameOptionsOverlay } from '@/components/answer-game/GameOptions/GameOptionsOverlay';
```

Also update `SaveCustomGameInput` type import if re-exported.

- [ ] **Step 4: Run typecheck + tests**

Run: `yarn typecheck && npx vitest run src/components/answer-game/GameOptions/ --reporter=verbose`
Expected: PASS — all renamed tests still pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename InstructionsOverlay → GameOptionsOverlay

Component, directory, tests, and stories all renamed. All imports updated.
Storybook title: AnswerGame/GameOptions/GameOptionsOverlay."
```

---

## Task 9: GameOptionsOverlay Behavior — No Auto-Speak + game:prepare

**Files:**

- Modify: `src/components/answer-game/GameOptions/GameOptionsOverlay.tsx:173-179`
- Modify: `src/components/answer-game/GameOptions/GameOptionsOverlay.test.tsx`

- [ ] **Step 1: Write failing test — no auto-speak on mount**

```ts
// In GameOptionsOverlay.test.tsx, add:
it('does not auto-speak instructions on mount', () => {
  // Render GameOptionsOverlay with autoSpeak: true
  // Assert speak() was NOT called
});

it('emits game:prepare on mount', () => {
  // Render GameOptionsOverlay
  // Assert getGameEventBus().emit was called with type: 'game:prepare'
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/GameOptions/GameOptionsOverlay.test.tsx --reporter=verbose`
Expected: FAIL — still auto-speaks on mount.

- [ ] **Step 3: Remove auto-speak useEffect, add game:prepare**

In `GameOptionsOverlay.tsx`, remove the useEffect at lines 173-179 that calls `speak(text)`.
Replace with a `game:prepare` emission:

```ts
useEffect(() => {
  getGameEventBus().emit({
    type: 'game:prepare',
    gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex: 0,
  });
  return () => {
    cancelSpeech();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- emit once on mount
}, []);
```

**Design note:** `useLifecycleTTS` does NOT subscribe to `game:prepare` directly. In the
XState-first approach, the `game.prepare` lifecycle event is emitted by the XState machine's
initial-state entry action as a `lifecycle:speak` bus event — the same path all other lifecycle
events use. `useLifecycleTTS`'s existing `lifecycle:speak` subscription handles it without any
additional subscription. The `game:prepare` bus event emitted here is for other potential
subscribers (e.g., analytics); the TTS path flows through XState → `lifecycle:speak` → hook.
This Task 9 interim pattern (direct `game:prepare` emission) will be superseded once the
GameDefinition engine is integrated into `GameOptionsOverlay`.

- [ ] **Step 4: Add game.start speech after "Let's go"**

In the `onStart` callback path (the "Let's go" button handler), add:

```ts
// After existing onStart() call:
lifecycleTTS.speakAuto('game.start');
```

This speaks the full how-to-play copy when the user taps "Let's go". The game component passes
`lifecycleTTS` from `useLifecycleTTS()`.

**Note:** Once the GameDefinition engine (PR #350) is integrated into each game component,
`game.start` speech may also be emitted as a side-effect of the `playing` phase's `onEnter` hook.
Verify there is no double-speak at integration time and remove the direct `speakAuto` call if the
engine covers it.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/GameOptions/GameOptionsOverlay.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/GameOptions/
git commit -m "feat(GameOptions): remove auto-speak, emit game:prepare on mount

Pre-game panel no longer speaks how-to-play instructions on mount.
game:prepare event emitted for lifecycle TTS to speak brief game name.
game.start speech triggered after Let's go button."
```

---

## Task 10: QuestionRow Component

**Files:**

- Create: `src/components/questions/QuestionRow/QuestionRow.tsx`
- Create: `src/components/questions/QuestionRow/QuestionRow.test.tsx`
- Modify: `src/components/questions/index.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/components/questions/QuestionRow/QuestionRow.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionRow } from './QuestionRow';

describe('QuestionRow', () => {
  it('renders audio button and content inline', () => {
    render(
      <QuestionRow audioSlot={<button>audio</button>}>
        <span>content</span>
      </QuestionRow>,
    );
    expect(screen.getByText('audio')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders without audio slot', () => {
    render(
      <QuestionRow>
        <span>content only</span>
      </QuestionRow>,
    );
    expect(screen.getByText('content only')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/QuestionRow/QuestionRow.test.tsx --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement QuestionRow**

```tsx
// src/components/questions/QuestionRow/QuestionRow.tsx
import type { ReactNode } from 'react';

interface QuestionRowProps {
  audioSlot?: ReactNode;
  children: ReactNode;
}

export const QuestionRow = ({
  audioSlot,
  children,
}: QuestionRowProps) => (
  <div className="flex items-center justify-center gap-3">
    {audioSlot}
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
```

- [ ] **Step 4: Add to questions index**

In `src/components/questions/index.ts`, add:

```ts
export { QuestionRow } from './QuestionRow/QuestionRow';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/questions/QuestionRow/QuestionRow.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/QuestionRow/ src/components/questions/index.ts
git commit -m "feat(QuestionRow): add inline AudioButton + content layout component"
```

---

## Task 11: AudioButton Refactor

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.test.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.stories.tsx`

- [ ] **Step 1: Write failing test**

```ts
// AudioButton.test.tsx — update existing tests
it('renders when ttsOnDemandAllowed is true', () => {
  // Render with ttsOnDemandAllowed: true
  // Assert button is in the document
});

it('returns null when ttsOnDemandAllowed is false', () => {
  // Render with ttsOnDemandAllowed: false
  // Assert button is NOT in the document
});

it('calls speakOnDemand with full mode on click', () => {
  // Click button
  // Assert speakOnDemand called with ('round.start', { mode: 'full' })
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: FAIL — old API.

- [ ] **Step 3: Refactor AudioButton**

```tsx
// src/components/questions/AudioButton/AudioButton.tsx
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLifecycleTTS } from '@/lib/lifecycle-tts/useLifecycleTTS';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';

interface AudioButtonProps {
  event?: LifecycleEvent;
}

export const AudioButton = ({
  event = 'round.start',
}: AudioButtonProps) => {
  const { speakOnDemand, ttsOnDemandAllowed } = useLifecycleTTS();
  const { t } = useTranslation('common');

  if (!ttsOnDemandAllowed) return null;

  return (
    <button
      type="button"
      aria-label={t('audio.replay', {
        defaultValue: 'Hear the question',
      })}
      className="flex size-14 shrink-0 items-center justify-center rounded-full shadow-md active:scale-95"
      style={{
        background: 'var(--skin-question-audio-bg)',
        color: 'var(--skin-question-audio-fg)',
      }}
      onClick={() => speakOnDemand(event, { mode: 'full' })}
    >
      <Volume2 size={24} aria-hidden="true" />
    </button>
  );
};
```

- [ ] **Step 4: Update stories**

Update `AudioButton.stories.tsx`: title `'Questions/AudioButton'` (PascalCase). Add `event`
control. Load `write-storybook` skill for conventions.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/AudioButton/
git commit -m "refactor(AudioButton): switch to lifecycle event prop, gate by ttsOnDemandAllowed

AudioButton no longer takes a prompt string. It calls speakOnDemand(event, { mode: 'full' })
from useLifecycleTTS. Renders only when ttsOnDemandAllowed is true."
```

---

## Task 12: Question Components — Honor ttsOnDemandAllowed

**Files:**

- Modify: `src/components/questions/TextQuestion/TextQuestion.tsx`
- Modify: `src/components/questions/ImageQuestion/ImageQuestion.tsx`
- Modify: `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`
- Modify: `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`

- [ ] **Step 1: Write failing test**

For each question component, add a test:

```ts
it('does not speak on click when ttsOnDemandAllowed is false', () => {
  // Render with ttsOnDemandAllowed: false
  // Click the question element
  // Assert speak() NOT called
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/ --reporter=verbose`
Expected: FAIL — components still call speakPrompt (which checks autoSpeak, not ttsOnDemandAllowed).

- [ ] **Step 3: Update each component**

In each component, change `speakPrompt` to `speakOnDemand`:

```ts
// TextQuestion.tsx
const { speakOnDemand } = useGameTTS();
// ...
onClick={() => speakOnDemand(text)}
```

Repeat for ImageQuestion, EmojiQuestion, DotGroupQuestion.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/questions/ --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/questions/
git commit -m "feat(questions): route onClick speech through speakOnDemand

All four question components now honor ttsOnDemandAllowed instead of autoSpeak
for user-initiated tap-to-speak interactions."
```

---

## Task 13: Game Integration — WordSpell + NumberMatch + SortNumbers

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Update WordSpell to use QuestionRow**

In `WordSpell.tsx`, wrap the question display area with `<QuestionRow>`:

```tsx
<QuestionRow audioSlot={<AudioButton event="round.start" />}>
  {/* existing question component rendering */}
</QuestionRow>
```

Remove the separate AudioButton rendering that currently sits alongside the question.

- [ ] **Step 2: Update NumberMatch to use QuestionRow**

Same pattern. The `GameDefinition.tts['round.start']` template now provides the instructional copy
(e.g., `"Find the matching number for {{count}}."`) instead of bare numeral speech. This is defined
in `src/games/number-match/definition.ts` (created by PR #350).

- [ ] **Step 3: Add AudioButton to SortNumbers**

SortNumbers currently has no AudioButton. Add:

```tsx
<QuestionRow audioSlot={<AudioButton event="round.start" />}>
  {/* existing direction label display */}
</QuestionRow>
```

- [ ] **Step 4: Run all game tests**

Run: `npx vitest run src/games/ --reporter=verbose`
Expected: PASS — all game tests pass with updated components.

- [ ] **Step 5: Commit**

```bash
git add src/games/
git commit -m "feat(games): adopt QuestionRow layout in WordSpell, NumberMatch, SortNumbers

SortNumbers gains AudioButton for the first time. All three games use
consistent inline AudioButton + question content layout."
```

---

## Task 14: SpotAllPrompt Consolidation

**Files:**

- Modify: `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`

- [ ] **Step 1: Write failing test**

```ts
it('uses useLifecycleTTS instead of local speak()', () => {
  // Render SpotAllPrompt with ttsOnDemandAllowed: true
  // Click audio button
  // Assert speakOnDemand called (not direct speak())
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — still uses local `speakPrompt` function.

- [ ] **Step 3: Consolidate into useLifecycleTTS**

Replace the local `speakPrompt` function and direct `speak()` call with `useLifecycleTTS`:

```tsx
export const SpotAllPrompt = ({
  target,
}: {
  target: string;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { speakOnDemand, ttsOnDemandAllowed } = useLifecycleTTS();
  const prompt = t('spot-all-ui.prompt', { target });

  return (
    <div className="flex items-center justify-center gap-3">
      <p className="text-center text-2xl font-semibold text-foreground">
        {prompt}
      </p>
      {ttsOnDemandAllowed && (
        <button
          type="button"
          aria-label={t('spot-all-ui.speak-prompt')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-md active:scale-95"
          style={{
            background: 'var(--skin-question-audio-bg)',
            color: 'var(--skin-question-audio-fg)',
          }}
          onClick={() => speakOnDemand('round.start', { mode: 'full' })}
        >
          <Volume2 size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
```

Remove the `ttsEnabled` prop — the hook reads flags from context. Remove the auto-speak useEffect
(lifecycle TTS handles that). Remove direct `speak()` and `useSettings()` imports.

**Note:** The parent `SpotAll` component that passes `ttsEnabled` to SpotAllPrompt must be updated
to stop passing it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/spot-all/ --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/spot-all/
git commit -m "refactor(SpotAll): consolidate SpotAllPrompt speech into useLifecycleTTS

Remove local speakPrompt function and ttsEnabled prop. SpotAllPrompt now
uses the shared lifecycle TTS API for on-demand speech."
```

---

## Task 15: Talkativeness in AdvancedConfigModal

**Files:**

- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`
- Modify: `src/lib/i18n/locales/en/games.json` (add form labels)

- [ ] **Step 1: Write failing test**

```ts
it('renders Voice & Instructions section with talkativeness preset', () => {
  // Render AdvancedConfigModal
  // Assert "Voice & Instructions" heading exists
  // Assert three radio buttons: Quiet, Default, Chatty
});

it('persists talkativeness selection to config draft', () => {
  // Select "Chatty"
  // Assert onChange called with { talkativeness: 'chatty' }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/AdvancedConfigModal.test.tsx --reporter=verbose`
Expected: FAIL — no "Voice & Instructions" section.

- [ ] **Step 3: Add Talkativeness section**

In `AdvancedConfigModal.tsx`, add a new section before the ConfigFormFields section:

```tsx
{
  /* Voice & Instructions */
}
<div className="space-y-2">
  <h4 className="text-sm font-medium">
    {t('instructions.voiceAndInstructions.title')}
  </h4>
  <div className="flex gap-4">
    {(['quiet', 'default', 'chatty'] as const).map((preset) => (
      <label key={preset} className="flex items-center gap-1.5">
        <input
          type="radio"
          name="talkativeness"
          value={preset}
          checked={(value.talkativeness ?? 'default') === preset}
          onChange={() => onChange({ talkativeness: preset })}
        />
        <span className="text-sm capitalize">
          {t(`instructions.voiceAndInstructions.${preset}`)}
        </span>
      </label>
    ))}
  </div>
</div>;
```

Add i18n keys:

```json
"instructions": {
  "voiceAndInstructions": {
    "title": "Voice & Instructions",
    "quiet": "Quiet",
    "default": "Default",
    "chatty": "Chatty"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/AdvancedConfigModal.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx src/lib/i18n/locales/
git commit -m "feat(config): add Talkativeness preset (Quiet/Default/Chatty) to AdvancedConfigModal"
```

---

## Task 16: ARIA Live Regions

**Files:**

- Modify: `src/components/answer-game/AnswerGameProvider.tsx` or the AnswerGame container
  component
- Test: accessibility test

- [ ] **Step 1: Write failing test**

```ts
it('announces round outcome via ARIA live region regardless of TTS setting', () => {
  // Render AnswerGame with autoSpeak: false
  // Complete a round (correct answer)
  // Assert aria-live="polite" element contains outcome text
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — no ARIA live region exists.

- [ ] **Step 3: Add ARIA live region**

Add a visually hidden `<div aria-live="polite">` that announces round outcomes (e.g. "Correct!",
"Try again") based on phase transitions. This element renders text independently of the TTS layer —
it always runs.

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {ariaAnnouncement}
</div>
```

The `ariaAnnouncement` state updates when `phase` transitions to `'round-complete'` or on wrong
placement.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/ --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/
git commit -m "feat(a11y): add ARIA live region for round outcomes independent of TTS"
```

---

## Task 17: Final Integration + Smoke Test

- [ ] **Step 1: Run full typecheck**

Run: `yarn typecheck`
Expected: PASS — zero errors.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: PASS — all tests pass.

- [ ] **Step 3: Run lint**

Run: `yarn fix:md && yarn lint`
Expected: PASS

- [ ] **Step 4: Start dev server and manually verify**

Run: `yarn dev`

Verify:

- Game Options panel does NOT auto-speak on mount
- "Let's go" triggers full how-to-play speech
- AudioButton appears on all four games (including SortNumbers)
- Tapping AudioButton speaks full instructional text
- NumberMatch says "Find the matching number for five" (not just "5")
- Quiet/Default/Chatty preset works in Advanced Config
- Setting autoSpeak: false silences auto-speech but AudioButton still works
- Setting ttsOnDemandAllowed: false hides AudioButton

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final integration fixes for Spec 1a M1"
```

---

## Deferred / Open Questions (ce-doc-review round 3, 2026-05-10)

> Round 3 of `ce-doc-review` ran on 2026-05-10 across all three PR #350 docs (this TTS plan, the GameDefinition engine design, and the PR 1a plan). Cross-doc alignment findings (A1–A11) were applied in commits `ff1b8fbb2` and `e73b6ef03`. The findings below are per-doc internal issues deferred for follow-up review or implementation-time resolution.
>
> Format: `**Title** [severity, anchor]` followed by section, why, suggested fix, evidence quote. Anchor 75 = high confidence; 100 = airtight.

### From coherence reviewer (TTS plan)

- **Task 11 imports `useLifecycleTTS` before Task 7 creates it** [P1, anchor 100]
  - Section: Task 11 — AudioButton Refactor
  - Why: Sequential execution fails at Task 11 Step 5 because the module Task 11 imports doesn't exist until Task 7 ships.
  - Fix: Reorder so Task 7 (useLifecycleTTS) executes immediately after Task 6 (i18n keys), before Task 8–11.
  - Evidence: Task 11 Step 3: `const { speakOnDemand, ttsOnDemandAllowed } = useLifecycleTTS();` while Task 7 is the one that creates `src/lib/lifecycle-tts/useLifecycleTTS.ts`.

- **Task 9 calls `lifecycleTTS.speakAuto(...)` without importing or initializing the hook** [P1, anchor 100]
  - Section: Task 9 — GameOptionsOverlay Behavior, Step 4
  - Why: The component has no prior `const lifecycleTTS = useLifecycleTTS();` declaration; the call is undefined at runtime.
  - Fix: Add explicit instruction: import `useLifecycleTTS` at top; call `const lifecycleTTS = useLifecycleTTS();` inside the component; then `lifecycleTTS.speakAuto('game.start');`.
  - Evidence: Task 9 Step 4: `lifecycleTTS.speakAuto('game.start');` — no prior declaration in the shown code block.

- **Task 12 routes question-component speech through `useGameTTS`, contradicting the lifecycle architecture** [P0, anchor 100]
  - Section: Task 12 — Question Components — Honor ttsOnDemandAllowed, Step 3
  - Why: Architecture (lines 12–13) says `useLifecycleTTS` exposes `speakOnDemand` for direct calls; Task 7 explicitly notes question taps should flow through the lifecycle system. Task 12 instead uses `useGameTTS().speakOnDemand(text)`, which is the wrong hook with an incompatible signature (raw text vs LifecycleEvent literal).
  - Fix: Change Task 12 Step 3 to `const { speakOnDemand } = useLifecycleTTS();` and pass a LifecycleEvent (e.g., `'round.start'`), not raw text.
  - Evidence: Task 12 Step 3: `const { speakOnDemand } = useGameTTS();` and `onClick={() => speakOnDemand(text)}`.

- **SpotAllPrompt hardcodes `speakOnDemand('round.start', ...)` for a custom per-target prompt** [P1, anchor 75]
  - Section: Task 14 — SpotAllPrompt Consolidation, Step 3
  - Why: SpotAll's prompt is "Find the X" — target-specific, not a generic round-start. Routing it through the lifecycle system with `'round.start'` will speak the wrong template (or silently fail per Task 7 note "Passing raw text is a silent bug").
  - Fix: Either (a) add a `'spotall.prompt'` LifecycleEvent + per-game template, or (b) acknowledge SpotAll is an exception and use a hybrid local lookup for the prompt text.
  - Evidence: Task 14 Step 3: `onClick={() => speakOnDemand('round.start', { mode: 'full' })}`.

- **Task 13 doesn't verify per-game `GameDefinition.tts` setup before assuming it exists** [P2, anchor 50, FYI]
  - Section: Task 13 — Game Integration, Step 2
  - Why: Task 13 assumes each game's `definition.ts` already has `tts['round.start']` defined; if PR #350 ships without one, NumberMatch loses speech with no alarm bell other than the smoke test.
  - Fix: Add a Task 13 Step 0 verification check that prints which games have which `tts.*` keys defined.

- **`speakPrompt` semantics conflict between Task 3 implementation and Task 7 usage notes** [P2, anchor 75]
  - Section: Task 3 vs Task 7 coexistence
  - Why: Task 3 implements `speakPrompt` gated by `autoSpeak`. Task 7 says "Use useGameTTS for ad-hoc speech … TextQuestion on-click, AudioButton replay" — those are on-demand, not auto. The implementation gates the wrong flag for the documented usage.
  - Fix: Either change `speakPrompt` to gate on `ttsOnDemandAllowed` (matching its usage) or remove `speakPrompt` and route question taps through `useLifecycleTTS().speakOnDemand`.
  - Evidence: Task 3 Step 4: `if (!config.autoSpeak) return;` inside `speakPrompt`.

- **i18n keys in Task 6 are vaguely enumerated** [P1, anchor 75]
  - Section: Task 6 — i18n Keys, Step 3
  - Why: "tts.word-spell.\* (all events)" is not enumerated. The LifecycleEvent union has 11 members × 2 verbosities (brief/full) × ≥3 games = ~66 keys. Without the explicit list, executors will miss keys at runtime.
  - Fix: Inline the full key list per game in Task 6, or reference Spec 1a §10 directly with a copy of the table in this plan.

- **Task 14 SpotAllPrompt risks the "silent bug" warned about in Task 7** [P1, anchor 75]
  - Section: Task 14 Step 3
  - Why: Hardcoded `speakOnDemand('round.start')` for SpotAll's custom prompt is the exact pattern Task 7 flags: "Passing raw text is a silent bug — lookup returns undefined, nothing is spoken."
  - Fix: Same as the SpotAllPrompt finding above — add a custom event or use local lookup.

- **GameDefinition engine API contract is not pinned in this plan** [P1, anchor 75]
  - Section: Introduction (lines 24–27) + Task 7 (lines 1009–1011)
  - Why: The plan assumes `useGameEngineContext()` returns `{ definition: { tts: Partial<Record<LifecycleEvent, EventTemplate>> } }` but that API shape lives in PR #350 and is not pinned here. If the API differs, Task 7 tests and Task 13 game integration fail at integration time.
  - Fix: Add a "GameDefinition Engine API Contract" subsection to the introduction documenting the expected shape; verify against PR #350 before beginning Task 7.

### From feasibility reviewer (TTS plan)

- **`bus.subscribe()` returns a cleanup function, NOT an object with `.unsubscribe()`** [P0, anchor 100]
  - Section: Task 7 — useLifecycleTTS Hook, Step 3
  - Why: Verified in `src/lib/game-event-bus.ts`: `subscribe()` returns a `() => void` cleanup function. The plan's hook does `const sub = bus.subscribe(...)` then `return () => sub.unsubscribe();` — calling `.unsubscribe()` on a function will throw `TypeError` at unmount.
  - Fix: Change to `const off = bus.subscribe('lifecycle:speak', (event) => { ... }); return () => off();`. Match the pattern in `src/lib/game-event-bus.test.ts`.

- **Bus handler destructures `{ lifecycleEvent }` from the `GameEvent` union without narrowing** [P0, anchor 100]
  - Section: Task 7 — useLifecycleTTS Hook, Step 3
  - Why: The handler receives `GameEvent` (the discriminated union), not the narrowed `LifecycleSpeakEvent`. Destructuring `{ lifecycleEvent }` without narrowing fails TypeScript: the field isn't on most union variants.
  - Fix: Narrow first: `(event) => { if (event.type !== 'lifecycle:speak') return; const { lifecycleEvent } = event; ... }`.

- **Plan reads `gradeBand` and `talkativeness` via unsafe casts; neither field exists on `AnswerGameConfig`** [P0, anchor 100]
  - Section: Task 7 — useLifecycleTTS Hook, `resolveAndSpeak`
  - Why: `(config as Record<string, unknown>).gradeBand ?? 'k'` silently defaults gradeBand to `'k'` for every user; same for `talkativeness ?? 'default'`. Verified: `src/components/answer-game/types.ts` `AnswerGameConfig` does NOT have these fields. The Talkativeness preset feature (M1 goal) is structurally non-functional for any user not in grade k.
  - Fix: Add `gradeBand?: GradeBand` and `talkativeness?: TalkativenessPreset` to `AnswerGameConfig` in Task 3; thread them from the resolved config or profile settings into every game's `useMemo<AnswerGameConfig>(...)` constructor.

- **`buildInterpolation` reads `currentWord`, `currentCount`, `gameTitle` — none exist on `AnswerGameConfig`** [P0, anchor 100]
  - Section: Task 7 — useLifecycleTTS Hook, `buildInterpolation`
  - Why: The hook reads `config.currentWord ?? ''` and `config.currentCount ?? ''` via unsafe casts. These fields aren't declared anywhere. The user hears "Spell the word ." instead of "Spell the word cat." — the central feature of M1.
  - Fix: Define the interpolation contract: introduce a `useRoundContext()` (or extend an existing context) that exposes `{ currentWord, currentCount, ... }` populated by each game; update `buildInterpolation` to read from it; add to file structure list.

- **Task 9 calls `useLifecycleTTS()` outside `GameEngineProvider` context** [P0, anchor 75]
  - Section: Task 9 Step 4
  - Why: `useLifecycleTTS` calls `useGameEngineContext()` (per PR 1a). `GameOptionsOverlay` renders at the route level (`src/routes/$locale/_app/game/$gameId.tsx:529`), outside the engine provider. The hook will throw "must be used within GameEngineProvider" or return null.
  - Fix: Either (a) move `lifecycleTTS.speakAuto('game.start')` into a component rendered inside `GameEngineProvider` (e.g., the game's main panel keyed on a 'just-started' phase), or (b) make `useGameEngineContext()` return a nullable fallback so the hook works outside the provider.

- **Spec referenced (`2026-05-03-instructions-tts-lifecycle-design.md`) is not in this worktree** [P2, anchor 100]
  - Section: Header — Spec field
  - Why: The plan cites the spec for §10 (i18n keys) and §14 (M1 acceptance criteria) but the file is not in `docs/superpowers/specs/` of this worktree. Executor cannot resolve references.
  - Fix: Add a Task 0 to commit/copy the spec into this worktree's `specs/` directory before any implementation tasks, OR inline §10 + §14 content into the plan body.

- **RxDB settings schema migration not addressed for `ttsEnabled` rename** [P1, anchor 100]
  - Section: Task 3 — ttsEnabled split
  - Why: `ttsEnabled` is persisted in RxDB at `src/db/schemas/settings.ts:10,46` with `additionalProperties: false` and schema `version: 3`. Renaming requires a schema migration (version bump + `migrationStrategies` entry) for existing user data — without it, the app fails to load existing user databases or silently loses the setting.
  - Fix: Add a sub-step under Task 3: bump settings schema to version 4, add `migrationStrategies[4]` mapping `ttsEnabled → { autoSpeak: ttsEnabled, ttsOnDemandAllowed: ttsEnabled }`, update `SettingsDoc` type, and update any UI that reads/writes `settings.ttsEnabled`.

- **Two coexisting hooks both export `speakOnDemand` with incompatible signatures** [P2, anchor 75]
  - Section: Task 7 callout + Task 12 routing
  - Why: `useGameTTS.speakOnDemand(text: string)` and `useLifecycleTTS.speakOnDemand(event: LifecycleEvent)`. Autocomplete-driven import errors silently no-op (i18n lookup of raw text returns undefined).
  - Fix: Rename `useGameTTS.speakOnDemand` → `speakRawOnDemand` so the ambient `speakOnDemand` is exclusively the lifecycle-event variant.

- **Hard dependency on open PR #350 not staged in this plan's tasks** [P1, anchor 75]
  - Section: Header — "Depends on"
  - Why: Plan declares dependency on PR #350 but doesn't tell executors what to do if PR #350 is mid-merge. Tasks 1–6 might be runnable independently; Task 7+ hard-depend on `useGameEngineContext()`.
  - Fix: Either mark Task 7+ as blocked until PR #350 merges, or include a stubbed `useGameEngineContext()` so earlier tasks can land independently.

- **`TalkativenessPreset` defined in `types.ts` but not imported by `talkativeness-presets.ts`** [P3, anchor 50, FYI]
  - Section: Task 5 — Talkativeness Presets, Step 3
  - Why: Implementation hardcodes the union `'quiet' | 'default' | 'chatty'` instead of importing `TalkativenessPreset` from `./types`. Cosmetic but encourages drift.
  - Fix: Change the function signature to `(preset: TalkativenessPreset, gradeBand: GradeBand)` and import from `./types`.

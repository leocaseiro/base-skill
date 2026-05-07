# Spec 1a M1 — TTS Lifecycle Minimum Viable Copy Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible TTS copy fixes from #229 — rename InstructionsOverlay, stop auto-speaking how-to-play, speak proper instructional templates, split ttsEnabled into autoSpeak + ttsOnDemandAllowed, add QuestionRow layout, add Talkativeness preset.

**Architecture:** Introduce a `src/lib/lifecycle-tts/` module with types, a pure verbosity resolver, talkativeness presets, and per-game registry entries. A `useLifecycleTTS` hook subscribes to the `GameEventBus` and gates speech by `autoSpeak` / `ttsOnDemandAllowed`. Rename `InstructionsOverlay` → `GameOptionsOverlay`, refactor `AudioButton` to use lifecycle events, and add `QuestionRow` for consistent inline layout.

**Tech Stack:** React 18, TypeScript, Vitest, i18next, Web Speech API, existing GameEventBus

**Spec:** `docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md` (§14 M1 criteria)

**Spec Deltas:** None — plan follows spec exactly.

**Required skills for executors:**

- `write-storybook` — for `*.stories.tsx` files (Tasks 12, 16)
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
├── types.ts                          # LifecycleEvent, Verbosity, EventTemplate, registry types
├── resolve.ts                        # resolveVerbosity() + resolveCopy() — pure functions
├── resolve.test.ts                   # Verbosity + copy chain tests
├── useLifecycleTTS.ts                # Hook: subscribes to bus, gates by autoSpeak/ttsOnDemandAllowed
├── useLifecycleTTS.test.tsx          # Hook tests
├── talkativeness-presets.ts          # Quiet / Default / Chatty profiles per gradeBand
├── talkativeness-presets.test.ts     # Preset resolution tests
├── registry/
│   ├── index.ts                      # GameLifecycleRegistry assembly
│   ├── word-spell.ts                 # WordSpell registry entry
│   ├── number-match.ts              # NumberMatch registry entry (fixes speak-the-answer)
│   ├── sort-numbers.ts              # SortNumbers registry entry (minimal)
│   └── spot-all.ts                  # SpotAll registry entry (minimal, on-demand only)
├── LifecycleTTSExplorer.stories.tsx  # Interactive Storybook explorer

src/components/questions/QuestionRow/
├── QuestionRow.tsx                   # Inline AudioButton + content layout
├── QuestionRow.test.tsx              # Layout tests
└── QuestionRow.stories.tsx           # Storybook stories

src/components/answer-game/GameOptions/
├── GameOptionsOverlay.tsx            # Renamed from InstructionsOverlay
├── GameOptionsOverlay.test.tsx       # Renamed tests
├── GameOptionsOverlay.stories.tsx    # Renamed stories
└── useConfigDraft.ts                 # Moved, unchanged content
```

### Modified files

| File                                                             | Change                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/speech/SpeechOutput.ts`                                 | Add `onEnd` callback to `SpeakOptions` (backward compatible)                                 |
| `src/types/game-events.ts`                                       | Add `game:prepare` event type + interface                                                    |
| `src/components/answer-game/types.ts`                            | Replace `ttsEnabled` with `autoSpeak` + `ttsOnDemandAllowed` + `gradeBand` + `talkativeness` |
| `src/games/spot-all/types.ts`                                    | Same flag split for SpotAllConfig                                                            |
| `src/components/answer-game/useGameTTS.ts`                       | Split into `speakAuto` + `speakOnDemand`; keep `speakTile`                                   |
| `src/components/answer-game/useGameTTS.test.tsx`                 | Update for new API                                                                           |
| `src/components/answer-game/useRoundTTS.ts`                      | Thin wrapper delegating to `useLifecycleTTS` (stays in M1; removed in M2)                    |
| `src/components/answer-game/useRoundTTS.test.tsx`                | Update for `autoSpeak`                                                                       |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch to lifecycle event prop, gate by `ttsOnDemandAllowed`, add `isSpeaking` + ARIA        |
| `src/components/questions/AudioButton/AudioButton.test.tsx`      | Update tests                                                                                 |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route onClick through `speakOnDemand`                                                        |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same                                                                                         |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same                                                                                         |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same                                                                                         |
| `src/components/questions/index.ts`                              | Add `QuestionRow` export                                                                     |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Use `QuestionRow`; pass event to AudioButton                                                 |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Use `QuestionRow`; registry-backed instructional copy                                        |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | Add AudioButton via `QuestionRow`                                                            |
| `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`             | Consolidate into `useLifecycleTTS` + `AudioButton` + `QuestionRow`                           |
| `src/components/AdvancedConfigModal.tsx`                         | Add Talkativeness preset section                                                             |
| `src/lib/i18n/locales/en/games.json`                             | Add `tts.*` keys                                                                             |
| `src/lib/i18n/locales/pt-BR/games.json`                          | Add `tts.*` keys (placeholder English)                                                       |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update import path                                                                           |
| `src/components/answer-game/AnswerGameProvider.tsx`              | Emit `game:prepare` on panel mount path                                                      |

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
  | 'game:prepare'
  | 'game:start'
  | 'game:resume'
  | 'game:over'
  | 'round:start'
  | 'round:idle'
  | 'round:error'
  | 'round:correct'
  | 'round:celebrate'
  | 'round:advance'
  | 'round:tts-played'
  | 'level:complete';

export type Verbosity = 'off' | 'brief' | 'full';

export type TalkativenessPreset = 'quiet' | 'default' | 'chatty';

export type EventTemplate = {
  tts: { brief: string; full: string };
  byGradeBand: Record<GradeBand, Verbosity>;
  default: Verbosity;
};

export type GameLifecycleRegistryEntry = {
  /** M1: Partial — games only register events they handle. M2: tighten to required once all events are wired. */
  events: Partial<Record<LifecycleEvent, EventTemplate>>;
};

export type GameLifecycleRegistry = Record<
  string,
  GameLifecycleRegistryEntry
>;
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

- [ ] **Step 3: Add game:prepare to the event type union**

In `src/types/game-events.ts`, add `'game:prepare'` to the `GameEventType` union (after line 10, before `'game:instructions_shown'`):

```ts
export type GameEventType =
  | 'game:start'
  | 'game:prepare'
  | 'game:instructions_shown';
// ... rest unchanged
```

Add the interface (after `GameStartEvent`):

```ts
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game:prepare';
}
```

Add `GamePrepareEvent` to the `GameEvent` union type:

```ts
export type GameEvent =
  | GameStartEvent
  | GamePrepareEvent
  | GameInstructionsShownEvent;
// ... rest unchanged
```

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

This is the core flag split. Touch types first, then update `useGameTTS` and its consumers. Also adds `gradeBand` and `talkativeness` to config types (needed by the verbosity resolver in Task 4).

**Files:**

- Modify: `src/components/answer-game/types.ts:16-17`
- Modify: `src/games/spot-all/types.ts:36` (SpotAllConfig has its own `ttsEnabled`)
- Modify: `src/components/answer-game/useGameTTS.ts`
- Modify: `src/components/answer-game/useGameTTS.test.tsx`
- Modify: `src/components/answer-game/useRoundTTS.ts:11`
- Modify: `src/components/answer-game/useRoundTTS.test.tsx`
- Modify: `useConfigDraft` draft type (must mirror new config fields)

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
/** Grade band for verbosity resolution — maps to talkativeness profiles. */
gradeBand: GradeBand;
/** Talkativeness preset — controls how verbose auto-speech is. */
talkativeness: TalkativenessPreset;
```

Import the types at the top of the file:

```ts
import type { GradeBand } from '@/types/game-events';
import type { TalkativenessPreset } from '@/lib/lifecycle-tts/types';
```

Also apply the same split to `SpotAllConfig` in `src/games/spot-all/types.ts:36` — replace `ttsEnabled: boolean` with the same four fields (`autoSpeak`, `ttsOnDemandAllowed`, `gradeBand`, `talkativeness`). Update SpotAll's `resolveSimpleConfig` and reducer to handle the new fields.

Also update the `useConfigDraft` draft type to include `talkativeness` with a default value of `'default'` and `gradeBand` with a default of `'k'`. The draft → config → hook data flow requires all three types to agree on available fields.

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

  return { speakTile, speakAuto, speakOnDemand };
};
```

- [ ] **Step 5: Update useRoundTTS as thin wrapper**

In M1, `useRoundTTS` becomes a thin wrapper that delegates to `useLifecycleTTS` rather than calling `speak()` directly. Full removal is deferred to M2 to avoid breaking callers that aren't yet migrated. In `src/components/answer-game/useRoundTTS.ts`:

```ts
import { useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { whenSoundEnds } from '@/lib/speech/SpeechOutput';
import { useLifecycleTTS } from '@/lib/lifecycle-tts/useLifecycleTTS';

export const useRoundTTS = (prompt: string): void => {
  const { roundIndex, config } = useAnswerGameContext();
  const { speakAuto } = useLifecycleTTS({
    gameId: config.gameId,
    autoSpeak: config.autoSpeak,
    ttsOnDemandAllowed: config.ttsOnDemandAllowed,
    gradeBand: config.gradeBand,
    talkativeness: config.talkativeness,
  });

  useEffect(() => {
    if (!config.autoSpeak) return;
    if (!prompt) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakAuto('round:start');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit speakAuto and prompt to only re-speak on round change
  }, [roundIndex, config.autoSpeak]);
};
```

**M2 TODO:** Remove `useRoundTTS` entirely once all callers use `useLifecycleTTS` directly.

- [ ] **Step 6: Migrate all ttsEnabled references (~159 occurrences)**

Run `rg ttsEnabled src/` to get the full list. There are approximately 159 references across the codebase. Classify each by usage context:

**Classification guide:**

| Pattern                                | Maps to                                 | Reason                        |
| -------------------------------------- | --------------------------------------- | ----------------------------- |
| Gates auto-speak on mount/round change | `autoSpeak`                             | Lifecycle auto-speech         |
| Gates AudioButton rendering            | `ttsOnDemandAllowed`                    | User-initiated tap-to-speak   |
| Gates question onClick speech          | `ttsOnDemandAllowed`                    | User-initiated tap-to-speak   |
| Config construction / form value       | both `autoSpeak` + `ttsOnDemandAllowed` | Config needs both flags       |
| Test fixture / mock config             | both `autoSpeak` + `ttsOnDemandAllowed` | Must match config type        |
| SpotAllConfig field                    | both (same split as AnswerGameConfig)   | Unified TTS flag contract     |
| Settings/reducer toggle                | both flags (legacy toggle sets both)    | Backward-compatible migration |

**Key files by category:**

Buttons/on-demand (→ `ttsOnDemandAllowed`):

- `src/components/questions/AudioButton/AudioButton.tsx`
- `src/components/questions/TextQuestion/TextQuestion.tsx`
- `src/components/questions/ImageQuestion/ImageQuestion.tsx`
- `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`
- `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`

Auto-speech (→ `autoSpeak`):

- `src/components/answer-game/useRoundTTS.ts`
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`

Config construction (→ both):

- `src/routes/$locale/_app/game/$gameId.tsx` (all game body components)
- `src/games/spot-all/resolve-simple-config.ts`
- Every test that constructs a config with `ttsEnabled`
- Every story file that provides config fixtures

Run `yarn typecheck` after migration — zero errors expected.

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
    expect(profile['game:start']).toBe('off');
    expect(profile['round:start']).toBe('brief');
  });

  it('default returns undefined (fall through to registry)', () => {
    const profile = getTalkativenessProfile('default', 'year1-2');
    expect(profile['game:start']).toBeUndefined();
  });

  it('chatty at year3-4 upgrades to full', () => {
    const profile = getTalkativenessProfile('chatty', 'year3-4');
    expect(profile['game:start']).toBe('full');
    expect(profile['round:start']).toBe('full');
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
    'game:prepare': 'off',
    'game:start': 'off',
    'round:start': 'brief',
    'round:idle': 'off',
    'round:error': 'off',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'off',
    'level:complete': 'off',
    'game:over': 'off',
    'game:resume': 'off',
  },
  k: {
    'game:prepare': 'off',
    'game:start': 'off',
    'round:start': 'brief',
    'round:idle': 'off',
    'round:error': 'off',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'off',
    'level:complete': 'off',
    'game:over': 'off',
    'game:resume': 'off',
  },
  'year1-2': {
    'game:prepare': 'off',
    'game:start': 'off',
    'round:start': 'brief',
    'round:idle': 'off',
    'round:error': 'off',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'off',
    'level:complete': 'off',
    'game:over': 'off',
    'game:resume': 'off',
  },
  'year3-4': {
    'game:prepare': 'off',
    'game:start': 'off',
    'round:start': 'off',
    'round:idle': 'off',
    'round:error': 'off',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'off',
    'level:complete': 'off',
    'game:over': 'off',
    'game:resume': 'off',
  },
  'year5-6': {
    'game:prepare': 'off',
    'game:start': 'off',
    'round:start': 'off',
    'round:idle': 'off',
    'round:error': 'off',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'off',
    'level:complete': 'off',
    'game:over': 'off',
    'game:resume': 'off',
  },
};

const CHATTY: Record<GradeBand, TalkativenessProfile> = {
  'pre-k': {
    'game:prepare': 'full',
    'game:start': 'full',
    'round:start': 'full',
    'round:idle': 'full',
    'round:error': 'full',
    'round:correct': 'full',
    'round:celebrate': 'full',
    'round:advance': 'full',
    'level:complete': 'full',
    'game:over': 'full',
    'game:resume': 'full',
  },
  k: {
    'game:prepare': 'full',
    'game:start': 'full',
    'round:start': 'full',
    'round:idle': 'full',
    'round:error': 'full',
    'round:correct': 'full',
    'round:celebrate': 'full',
    'round:advance': 'full',
    'level:complete': 'full',
    'game:over': 'full',
    'game:resume': 'full',
  },
  'year1-2': {
    'game:prepare': 'full',
    'game:start': 'full',
    'round:start': 'full',
    'round:idle': 'full',
    'round:error': 'full',
    'round:correct': 'full',
    'round:celebrate': 'full',
    'round:advance': 'full',
    'level:complete': 'full',
    'game:over': 'full',
    'game:resume': 'full',
  },
  'year3-4': {
    'game:prepare': 'full',
    'game:start': 'full',
    'round:start': 'full',
    'round:idle': 'brief',
    'round:error': 'full',
    'round:correct': 'brief',
    'round:celebrate': 'brief',
    'round:advance': 'full',
    'level:complete': 'full',
    'game:over': 'full',
    'game:resume': 'full',
  },
  'year5-6': {
    'game:prepare': 'brief',
    'game:start': 'full',
    'round:start': 'full',
    'round:idle': 'off',
    'round:error': 'brief',
    'round:correct': 'off',
    'round:celebrate': 'off',
    'round:advance': 'brief',
    'level:complete': 'brief',
    'game:over': 'brief',
    'game:resume': 'full',
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

## Task 6: Per-Game Registry (All Four Games)

**Files:**

- Create: `src/lib/lifecycle-tts/registry/word-spell.ts`
- Create: `src/lib/lifecycle-tts/registry/number-match.ts`
- Create: `src/lib/lifecycle-tts/registry/sort-numbers.ts`
- Create: `src/lib/lifecycle-tts/registry/spot-all.ts`
- Create: `src/lib/lifecycle-tts/registry/index.ts`

- [ ] **Step 1: Write failing test for registry lookup**

```ts
// src/lib/lifecycle-tts/resolve.test.ts (append)
import { getRegistry } from './registry';

describe('getRegistry', () => {
  it('returns word-spell registry entry', () => {
    const entry = getRegistry('word-spell');
    expect(entry).toBeDefined();
    expect(entry!.events['game:start'].tts.full).toBe(
      'tts.word-spell.game-start.full',
    );
  });

  it('returns number-match registry entry', () => {
    const entry = getRegistry('number-match');
    expect(entry).toBeDefined();
    expect(entry!.events['round:start']?.tts.full).toBe(
      'tts.number-match.round-start.full',
    );
  });

  it('returns sort-numbers registry entry', () => {
    const entry = getRegistry('sort-numbers');
    expect(entry).toBeDefined();
    expect(entry!.events['game:prepare']).toBeDefined();
  });

  it('returns spot-all registry entry', () => {
    const entry = getRegistry('spot-all');
    expect(entry).toBeDefined();
    expect(entry!.events['round:start']).toBeDefined();
  });

  it('returns undefined for unknown gameId', () => {
    expect(getRegistry('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Create word-spell registry entry**

Create `src/lib/lifecycle-tts/registry/word-spell.ts` following the exact structure from Spec 1a §6.2. Every event gets `tts.brief` and `tts.full` i18n keys in the pattern `tts.word-spell.<event-kebab>.<mode>`, and `byGradeBand` defaults per spec.

- [ ] **Step 4: Create number-match registry entry**

Create `src/lib/lifecycle-tts/registry/number-match.ts` — key entry is `round:start` which uses `"Find the matching number for {{count}}."` instead of bare numeral. This fixes the speak-the-answer bug.

- [ ] **Step 5: Create sort-numbers registry entry**

Create `src/lib/lifecycle-tts/registry/sort-numbers.ts` — minimal entry for M1. Only register templates for events that actually fire:

- `game:prepare` — instructional speech: "Sort the numbers from smallest to largest."
- `round:start` — optional round prompt

Other events are omitted (Partial registry — see Task 1 types).

- [ ] **Step 6: Create spot-all registry entry**

Create `src/lib/lifecycle-tts/registry/spot-all.ts` — minimal entry for M1. Only register:

- `round:start` — on-demand prompt: "Find all the {{target}}"

SpotAll has no auto-speak in M1, so no `game:prepare` template needed.

- [ ] **Step 7: Create registry index**

```ts
// src/lib/lifecycle-tts/registry/index.ts
import type {
  GameLifecycleRegistry,
  GameLifecycleRegistryEntry,
} from '../types';
import { wordSpellRegistry } from './word-spell';
import { numberMatchRegistry } from './number-match';
import { sortNumbersRegistry } from './sort-numbers';
import { spotAllRegistry } from './spot-all';

const registry: GameLifecycleRegistry = {
  'word-spell': wordSpellRegistry,
  'number-match': numberMatchRegistry,
  'sort-numbers': sortNumbersRegistry,
  'spot-all': spotAllRegistry,
};

export const getRegistry = (
  gameId: string,
): GameLifecycleRegistryEntry | undefined => registry[gameId];
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/lifecycle-tts/registry/
git commit -m "feat(lifecycle-tts): add WordSpell + NumberMatch registry entries

NumberMatch round-start uses instructional template instead of bare numeral,
fixing the speak-the-answer bug (#229)."
```

---

## Task 7: i18n Keys

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

Add a top-level `"tts"` key to `src/lib/i18n/locales/en/games.json` with keys per Spec 1a §10. At minimum for M1:

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

## Task 8: useLifecycleTTS Hook

**Important:** This hook takes explicit parameters — it does NOT read from `AnswerGameContext`. This makes it usable by any game, including SpotAll which has its own state management. Each game passes its own config values.

**Files:**

- Modify: `src/lib/speech/SpeechOutput.ts` (add `onEnd` to `SpeakOptions`)
- Create: `src/lib/lifecycle-tts/useLifecycleTTS.ts`
- Create: `src/lib/lifecycle-tts/useLifecycleTTS.test.tsx`

- [ ] **Step 0: Add onEnd callback to SpeakOptions (prerequisite)**

The existing `speak()` returns `void` and doesn't expose the `SpeechSynthesisUtterance`. Instead of changing the return type, add an optional `onEnd` callback to `SpeakOptions` — backward compatible, existing callers unchanged.

In `src/lib/speech/SpeechOutput.ts`:

```ts
export interface SpeakOptions {
  rate?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
  onEnd?: () => void;
}
```

In `buildUtterance()`, add before `return u`:

```ts
if (options.onEnd) u.onend = options.onEnd;
```

Run: `yarn typecheck`
Expected: PASS — no existing callers break (onEnd is optional).

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/lifecycle-tts/useLifecycleTTS.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLifecycleTTS } from './useLifecycleTTS';
import type { UseLifecycleTTSParams } from './useLifecycleTTS';
import * as SpeechOutput from '@/lib/speech/SpeechOutput';
import { createGameEventBus } from '@/lib/game-event-bus';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));

const defaultParams: UseLifecycleTTSParams = {
  gameId: 'word-spell',
  autoSpeak: true,
  ttsOnDemandAllowed: true,
  gradeBand: 'k',
  talkativeness: 'default',
  roundData: { target: 'cat' },
};

describe('useLifecycleTTS', () => {
  it('speakOnDemand speaks full copy for the event', () => {
    const { result } = renderHook(() => useLifecycleTTS(defaultParams));
    act(() => result.current.speakOnDemand('round:start'));
    expect(SpeechOutput.speak).toHaveBeenCalledWith(
      expect.stringContaining('cat'),
      expect.any(Object),
    );
  });

  it('speakOnDemand is silent when ttsOnDemandAllowed is false', () => {
    const { result } = renderHook(() =>
      useLifecycleTTS({ ...defaultParams, ttsOnDemandAllowed: false }),
    );
    act(() => result.current.speakOnDemand('round:start'));
    expect(SpeechOutput.speak).not.toHaveBeenCalled();
  });

  it('speakAuto is gated by autoSpeak', () => {
    const { result } = renderHook(() =>
      useLifecycleTTS({ ...defaultParams, autoSpeak: false }),
    );
    act(() => result.current.speakAuto('game:start'));
    expect(SpeechOutput.speak).not.toHaveBeenCalled();
  });

  it('auto-speaks on game:prepare bus event when autoSpeak is true', () => {
    const bus = createGameEventBus();
    const { result } = renderHook(() =>
      useLifecycleTTS({ ...defaultParams, eventBus: bus }),
    );
    act(() =>
      bus.emit({
        type: 'game:prepare',
        gameId: 'word-spell',
        sessionId: 'test',
        profileId: 'test',
        timestamp: Date.now(),
        roundIndex: 0,
      }),
    );
    expect(SpeechOutput.speak).toHaveBeenCalled();
  });

  it('emits round:tts-played after speech completes', () => {
    // Test that the hook emits round:tts-played on the bus
    // after SpeechSynthesisUtterance.onend fires
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
import { useSettings } from '@/db/hooks/useSettings';
import { speak } from '@/lib/speech/SpeechOutput';
import { getGameEventBus } from '@/lib/game-event-bus';
import { getRegistry } from './registry';
import { resolveCopy, resolveVerbosity } from './resolve';
import { getTalkativenessProfile } from './talkativeness-presets';
import type {
  LifecycleEvent,
  TalkativenessPreset,
  Verbosity,
} from './types';
import type { GradeBand, GameEventBus } from '@/types/game-events';

type SpeakOptions = { mode?: 'brief' | 'full' };

export type UseLifecycleTTSParams = {
  gameId: string;
  autoSpeak: boolean;
  ttsOnDemandAllowed: boolean;
  gradeBand: GradeBand;
  talkativeness: TalkativenessPreset;
  /** Game-specific round data for template interpolation. */
  roundData?: Record<string, string | number>;
  /** Optional — defaults to the process-wide singleton. */
  eventBus?: GameEventBus;
};

type UseLifecycleTTSReturn = {
  speakAuto: (event: LifecycleEvent) => void;
  speakOnDemand: (
    event: LifecycleEvent,
    options?: SpeakOptions,
  ) => void;
  ttsOnDemandAllowed: boolean;
  /** Status string for ARIA live region. */
  status: string;
};

export const useLifecycleTTS = (
  params: UseLifecycleTTSParams,
): UseLifecycleTTSReturn => {
  const {
    gameId,
    autoSpeak,
    ttsOnDemandAllowed,
    gradeBand,
    talkativeness,
    roundData = {},
  } = params;
  const bus = params.eventBus ?? getGameEventBus();
  const { settings } = useSettings();
  const { t, i18n } = useTranslation('games');

  const autoSpeakRef = useRef(autoSpeak);
  autoSpeakRef.current = autoSpeak;

  const statusRef = useRef('');

  const buildInterpolation = useCallback(
    (): Record<string, string | number> => ({
      gameName: gameId,
      ...roundData,
    }),
    [gameId, roundData],
  );

  const doSpeak = useCallback(
    (
      i18nKey: string,
      interpolation: Record<string, string | number>,
    ) => {
      const text = t(i18nKey, interpolation);
      if (!text || text === i18nKey) return;
      statusRef.current = text;
      speak(text, {
        rate: settings.speechRate ?? 1,
        volume: settings.voiceVolume ?? 0.8,
        voiceName: settings.preferredVoiceURI,
        lang: i18n.language,
        onEnd: () => {
          bus.emit({
            type: 'round:tts-played' as any,
            gameId,
            sessionId: '',
            profileId: '',
            timestamp: Date.now(),
            roundIndex: 0,
          });
          statusRef.current = '';
        },
      });
    },
    [
      t,
      settings.speechRate,
      settings.voiceVolume,
      settings.preferredVoiceURI,
      i18n.language,
      bus,
      gameId,
    ],
  );

  const resolveAndSpeak = useCallback(
    (event: LifecycleEvent, forcedVerbosity?: Verbosity) => {
      const entry = getRegistry(gameId);
      if (!entry) return;
      const template = entry.events[event];
      if (!template) return;

      const talkProfile = getTalkativenessProfile(
        talkativeness,
        gradeBand,
      );

      const verbosity =
        forcedVerbosity ??
        resolveVerbosity(template, gradeBand, {
          talkativenessVerbosity: talkProfile[event],
        });

      const i18nKey = resolveCopy(template, verbosity);
      if (!i18nKey) return;

      doSpeak(i18nKey, buildInterpolation());
    },
    [gameId, gradeBand, talkativeness, doSpeak, buildInterpolation],
  );

  const speakAuto = useCallback(
    (event: LifecycleEvent) => {
      if (!autoSpeakRef.current) return;
      resolveAndSpeak(event);
    },
    [resolveAndSpeak],
  );

  const speakOnDemand = useCallback(
    (event: LifecycleEvent, options?: SpeakOptions) => {
      if (!ttsOnDemandAllowed) return;
      resolveAndSpeak(event, options?.mode ?? 'full');
    },
    [ttsOnDemandAllowed, resolveAndSpeak],
  );

  // Subscribe to game:prepare on the bus and auto-speak when it fires.
  useEffect(() => {
    const unsub = bus.subscribe('game:prepare', () => {
      speakAuto('game:prepare');
    });
    return unsub;
  }, [bus, speakAuto]);

  return {
    speakAuto,
    speakOnDemand,
    ttsOnDemandAllowed,
    status: statusRef.current,
  };
};
```

**Key design decisions:**

- **Explicit params, no AnswerGameContext dependency** — any game (including SpotAll) passes its own config values. This aligns with the cross-game reuse direction.
- **`roundData` parameter** — each game passes round-specific interpolation data (e.g., WordSpell passes `{ target: currentWord }`, NumberMatch passes `{ count: currentNumber }`). See game integration tasks for what each game passes.
- **Event bus subscription** — `useEffect` subscribes to `game:prepare` and auto-speaks. Cleanup on unmount.
- **`round:tts-played` emission** — emitted on `utterance.onend` callback after speech completes. Analytics/SRS systems can subscribe to track that speech played.
- **`status` return** — string for ARIA `aria-live="polite"` regions. Empty when not speaking.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTTS.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/useLifecycleTTS.ts src/lib/lifecycle-tts/useLifecycleTTS.test.tsx
git commit -m "feat(lifecycle-tts): add useLifecycleTTS hook with auto/on-demand gates"
```

---

## Task 9: Rename InstructionsOverlay → GameOptionsOverlay

**Files:**

- Rename: `src/components/answer-game/InstructionsOverlay/` → `src/components/answer-game/GameOptions/`
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

Inside `GameOptionsOverlay.tsx`: rename the component export from `InstructionsOverlay` to `GameOptionsOverlay`. Update the Storybook title to `'AnswerGame/GameOptions/GameOptionsOverlay'` (PascalCase per CLAUDE.md).

Update every importing file found in step 1. Key change in `$gameId.tsx`:

```ts
// Before
import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';
// After
import { GameOptionsOverlay } from '@/components/answer-game/GameOptions/GameOptionsOverlay';
```

Also update `SaveCustomGameInput` type import if re-exported.

Additionally, update all `useConfigDraft` imports from the old path:

```bash
rg -l 'useConfigDraft' src/
```

Change each from `…/InstructionsOverlay/useConfigDraft` to `…/GameOptions/useConfigDraft`. Known importers: the route file (`$gameId.tsx`) and `AdvancedConfigModal.tsx`.

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

## Task 10: GameOptionsOverlay Behavior — No Auto-Speak + game:prepare

**Prerequisites:** Tasks 3 (flag split) and 9 (rename) must be complete before this task.

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

In `GameOptionsOverlay.tsx`, remove the useEffect at lines 173-179 that calls `speak(text)`. Replace with a `game:prepare` emission:

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

The `useLifecycleTTS` hook in the parent game component will subscribe to `game:prepare` and speak the brief `"{{gameName}}"` copy.

- [ ] **Step 4: Add game.start speech after "Let's go"**

In the `onStart` callback path (the "Let's go" button handler), add:

```ts
// After existing onStart() call:
lifecycleTTS.speakAuto('game:start');
```

This speaks the full how-to-play copy when the user taps "Let's go". The exact wiring depends on how `onStart` flows through to the game component — the game component's `useLifecycleTTS` call handles the speech.

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

## Task 11: QuestionRow Component

**Files:**

- Create: `src/components/questions/QuestionRow/QuestionRow.tsx`
- Create: `src/components/questions/QuestionRow/QuestionRow.test.tsx`
- Create: `src/components/questions/QuestionRow/QuestionRow.stories.tsx`
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

- [ ] **Step 6: Add QuestionRow stories**

Create `src/components/questions/QuestionRow/QuestionRow.stories.tsx` with title `'Questions/QuestionRow'` (PascalCase). Load `write-storybook` skill for conventions. Include variants:

1. **With AudioButton** — shows the inline audio + content layout
2. **Without AudioButton** — content only, no audioSlot
3. **Long Content** — verifies overflow/wrapping behavior with long text

- [ ] **Step 7: Commit**

```bash
git add src/components/questions/QuestionRow/ src/components/questions/index.ts
git commit -m "feat(QuestionRow): add inline AudioButton + content layout component with stories"
```

---

## Task 12: AudioButton Refactor

**Prerequisites:** Tasks 11-15 (game integrations) must update all AudioButton callers in the same PR. The old AudioButton API is not preserved — all callers switch to the new API together.

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
  // Assert speakOnDemand called with ('round:start', { mode: 'full' })
});

it('shows speaking indicator and disables click while speaking', () => {
  // Render with isSpeaking: true
  // Assert button has aria-busy="true"
  // Assert button is visually indicated as speaking (e.g., pulsing class)
});

it('has accessible aria-label', () => {
  // Render button
  // Assert aria-label is "Listen to question" or similar
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: FAIL — old API.

- [ ] **Step 3: Refactor AudioButton**

```tsx
// src/components/questions/AudioButton/AudioButton.tsx
import { useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';

interface AudioButtonProps {
  event?: LifecycleEvent;
  speakOnDemand: (
    event: LifecycleEvent,
    options?: { mode?: 'brief' | 'full' },
  ) => void;
  ttsOnDemandAllowed: boolean;
}

export const AudioButton = ({
  event = 'round:start',
  speakOnDemand,
  ttsOnDemandAllowed,
}: AudioButtonProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { t } = useTranslation('common');

  const handleClick = useCallback(() => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    speakOnDemand(event, { mode: 'full' });
    // Reset after utterance ends — the hook's onend callback
    // fires round:tts-played; we use a timeout fallback.
    const fallback = setTimeout(() => setIsSpeaking(false), 5000);
    // Ideally subscribe to round:tts-played to clear,
    // but timeout fallback prevents permanent stuck state.
    return () => clearTimeout(fallback);
  }, [isSpeaking, speakOnDemand, event]);

  if (!ttsOnDemandAllowed) return null;

  return (
    <button
      type="button"
      aria-label={t('audio.replay', {
        defaultValue: 'Listen to question',
      })}
      aria-busy={isSpeaking}
      disabled={isSpeaking}
      className={`flex size-14 shrink-0 items-center justify-center rounded-full shadow-md active:scale-95 ${
        isSpeaking ? 'animate-pulse opacity-70' : ''
      }`}
      style={{
        background: 'var(--skin-question-audio-bg)',
        color: 'var(--skin-question-audio-fg)',
      }}
      onClick={handleClick}
    >
      <Volume2 size={24} aria-hidden="true" />
    </button>
  );
};
```

**Note:** AudioButton now receives `speakOnDemand` and `ttsOnDemandAllowed` as props from the parent (which calls `useLifecycleTTS`). This avoids AudioButton needing to know about game-specific params. The parent passes the hook's returns directly.

- [ ] **Step 4: Update stories**

Update `AudioButton.stories.tsx`: title `'Questions/AudioButton'` (PascalCase). Add `event` control. Load `write-storybook` skill for conventions.

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

## Task 13: Question Components — Honor ttsOnDemandAllowed

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

## Task 14: Game Integration — WordSpell + NumberMatch + SortNumbers

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Update WordSpell to use QuestionRow**

In `WordSpell.tsx`, wrap the question display area with `<QuestionRow>`:

```tsx
<QuestionRow audioSlot={<AudioButton event="round:start" />}>
  {/* existing question component rendering */}
</QuestionRow>
```

Remove the separate AudioButton rendering that currently sits alongside the question.

- [ ] **Step 2: Update NumberMatch to use QuestionRow**

Same pattern. The registry-backed instructional copy replaces the bare numeral speech.

- [ ] **Step 3: Add AudioButton to SortNumbers**

SortNumbers currently has no AudioButton. Add:

```tsx
<QuestionRow audioSlot={<AudioButton event="round:start" />}>
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

## Task 15: SpotAllPrompt Consolidation

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

- [ ] **Step 3: Consolidate into useLifecycleTTS + shared components**

Replace the local `speakPrompt` function, direct `speak()` call, and hardcoded button with `useLifecycleTTS` + shared `AudioButton` + `QuestionRow` for consistent UX:

```tsx
import { useTranslation } from 'react-i18next';
import { useLifecycleTTS } from '@/lib/lifecycle-tts/useLifecycleTTS';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { QuestionRow } from '@/components/questions/QuestionRow/QuestionRow';

interface SpotAllPromptProps {
  target: string;
  config: {
    autoSpeak: boolean;
    ttsOnDemandAllowed: boolean;
    gradeBand: GradeBand;
    talkativeness: TalkativenessPreset;
  };
}

export const SpotAllPrompt = ({
  target,
  config,
}: SpotAllPromptProps): JSX.Element => {
  const { t } = useTranslation('games');
  const { speakOnDemand, ttsOnDemandAllowed } = useLifecycleTTS({
    gameId: 'spot-all',
    autoSpeak: config.autoSpeak,
    ttsOnDemandAllowed: config.ttsOnDemandAllowed,
    gradeBand: config.gradeBand,
    talkativeness: config.talkativeness,
    roundData: { target },
  });
  const prompt = t('spot-all-ui.prompt', { target });

  return (
    <QuestionRow
      audioSlot={
        <AudioButton
          event="round:start"
          speakOnDemand={speakOnDemand}
          ttsOnDemandAllowed={ttsOnDemandAllowed}
        />
      }
    >
      <p className="text-center text-2xl font-semibold text-foreground">
        {prompt}
      </p>
    </QuestionRow>
  );
};
```

Remove the old `ttsEnabled` prop, the auto-speak `useEffect`, direct `speak()` and `useSettings()` imports, and the inline `<button>`. The parent `SpotAll` component passes config values (from `SpotAllConfig`) instead of the old `ttsEnabled` boolean.

**Note:** The parent `SpotAll` component must be updated to pass `config` instead of `ttsEnabled`.

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

## Task 16: Talkativeness in AdvancedConfigModal

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

## Task 17: ARIA Live Regions

**Files:**

- Modify: `src/components/answer-game/AnswerGameProvider.tsx` or the AnswerGame container component
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

Add a visually hidden `<div aria-live="polite">` that announces round outcomes (e.g. "Correct!", "Try again") based on phase transitions. This element renders text independently of the TTS layer — it always runs.

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {ariaAnnouncement}
</div>
```

The `ariaAnnouncement` state updates when `phase` transitions to `'round-complete'` or on wrong placement.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/ --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/
git commit -m "feat(a11y): add ARIA live region for round outcomes independent of TTS"
```

---

## Task 18: Final Integration + Smoke Test

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

## Task 19: LifecycleTTSExplorer Story

**Files:**

- Create: `src/lib/lifecycle-tts/LifecycleTTSExplorer.stories.tsx`

- [ ] **Step 1: Create the explorer story**

Create `src/lib/lifecycle-tts/LifecycleTTSExplorer.stories.tsx` with title `'LifecycleTTS/Explorer'` (PascalCase). Load `write-storybook` skill for conventions.

The explorer is a wrapper component that lets QA manually test the TTS lifecycle system:

```tsx
// Storybook controls:
// - gameId: select from 'word-spell' | 'number-match' | 'sort-numbers' | 'spot-all'
// - gradeBand: select from GradeBand values
// - talkativeness: select from 'quiet' | 'default' | 'chatty'
// - autoSpeak: boolean toggle
// - ttsOnDemandAllowed: boolean toggle

// Renders:
// - AudioButton for on-demand speech
// - Buttons to manually trigger each lifecycle event (game:prepare, game:start, round:start, etc.)
// - Display of resolved verbosity + i18n key for current settings
// - Event log showing what was emitted on the bus
```

Each button calls `speakAuto(event)` or `speakOnDemand(event)` from the hook. The story should show what template resolves for the current game + gradeBand + talkativeness combination.

- [ ] **Step 2: Verify story renders in Storybook**

Run: `yarn storybook` and navigate to `LifecycleTTS/Explorer`. Verify controls work and speech fires.

- [ ] **Step 3: Commit**

```bash
git add src/lib/lifecycle-tts/LifecycleTTSExplorer.stories.tsx
git commit -m "feat(storybook): add LifecycleTTSExplorer for interactive TTS testing"
```

---

## Task 20: Architecture Docs Update

Per CLAUDE.md, modifications to game state logic require co-located `.mdx` docs updates.

**Files:**

- Modify: relevant `.mdx` files under game state architecture docs

- [ ] **Step 1: Run /update-architecture-docs skill**

This guides you through which sections need updating.

- [ ] **Step 2: Update docs to reflect:**

1. The new `game:prepare` event in the event flow
2. The lifecycle TTS module's role (`src/lib/lifecycle-tts/`)
3. The `ttsEnabled` → `autoSpeak` / `ttsOnDemandAllowed` migration
4. The talkativeness preset system
5. How `useLifecycleTTS` takes explicit params (no AnswerGameContext dependency)

- [ ] **Step 3: Run markdown lint**

Run: `yarn fix:md`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: update architecture docs for lifecycle TTS module and flag split"
```

---

## Open Questions

- **Task 14 AudioButton missing required props:** Task 14 renders
  `<AudioButton event="round:start" />` without passing the required
  `speakOnDemand` and `ttsOnDemandAllowed` props. Each game component
  (WordSpell, NumberMatch, SortNumbers) needs a `useLifecycleTTS` call
  and prop wiring, matching the pattern shown in Task 15 (SpotAllPrompt).
  Executor must resolve before implementation.

- **`round:tts-played` not in GameEventType union:** Task 8 emits
  `round:tts-played` with an `as any` cast because the event isn't in
  the `GameEventType` union. Task 2 adds `game:prepare` to the union but
  not `round:tts-played`. Either add it to the union in Task 2 for
  type safety, or accept the cast as a known M1 shortcut to be cleaned
  up in M4 when all lifecycle events are formalized.

- **`speakOnDemand` dual API pattern:** `useLifecycleTTS` returns
  `speakOnDemand` which the parent passes as a prop to AudioButton.
  This means the parent _could_ also call it directly (programmatic
  triggers). Consider whether AudioButton should own its own
  `useLifecycleTTS` call instead of receiving the function as a prop,
  or confirm the prop-drilling is intentional for keeping AudioButton
  generic.

- **Persisted config migration (`configFields` / `ttsEnabled` →
  `autoSpeak`):** The plan introduces `autoSpeak` and
  `ttsOnDemandAllowed` as new config fields but doesn't show how
  existing saved configs with `ttsEnabled: true` get migrated. If
  schema defaults don't cover this, a migration or defaulting step is
  needed so `config.autoSpeak` doesn't read `undefined`.

- **AudioButton `handleClick` dead code:** The `return () =>
clearTimeout(fallback)` inside `useCallback` in Task 12's
  AudioButton is dead code — `useCallback` ignores return values.
  The timeout still fires and resets `isSpeaking`, so the consequence
  is minor (a never-cleared timeout ref), but it signals the executor
  might misunderstand the intent. Consider removing or replacing with
  a `useEffect` cleanup pattern.

- **`useRoundTTS` task dependency ordering:** Task 3 Step 5 makes
  `useRoundTTS` delegate to `useLifecycleTTS`, but `useLifecycleTTS`
  isn't defined until Task 8. The executor must either reorder or
  stub the import. Clarify intended build order.

- **161 `ttsEnabled` references remain:** The plan migrates 12 files
  from `speakPrompt` → `speakAuto`/`speakOnDemand`, but `ttsEnabled`
  still appears in ~161 locations across the codebase. Confirm
  whether M1 only touches the specific files listed or needs a
  broader rename pass (may be M2/M3 scope).

- **No persisted config migration path:** Related to the
  `configFields` question — if game configs are stored in IndexedDB
  via Dexie, a version bump or `upgrade()` handler may be needed.
  Verify whether Dexie schema defaults handle `undefined` → `true`
  or if explicit migration is required.

- **`game:start` wiring ambiguity:** Task 3 Step 3 wires
  `useLifecycleTTS` to fire on `game:start`, but it's unclear whether
  this means the existing `game:start` GameEvent or the new
  lifecycle-level `game:start` LifecycleEvent. Clarify which bus/event
  triggers the initial TTS.

- **Talkativeness placement:** The `talkativeness` preset
  (`FULL`/`BRIEF`/`QUIET`) is resolved inside `useLifecycleTTS` but
  stored on the game config. Consider whether it belongs at the
  settings level (user preference) or game level (per-game override),
  and document the precedence.

- **ARIA `aria-label` content in AudioButton:** Task 12 uses
  `t('audio.replay', { defaultValue: 'Listen to question' })`. Verify
  this key exists in the `common` namespace and that the label is
  appropriate for all contexts (not just "questions" — e.g.,
  SortNumbers uses it for directions).

- **Settings-level `ttsEnabled` interaction:** The app has a
  global `settings.ttsEnabled` (in `useSettings`). The plan adds
  per-game `autoSpeak`/`ttsOnDemandAllowed`. Document the
  precedence: does the global switch override per-game flags, or
  vice versa?

- **QUIET preset duplication:** The `QUIET` talkativeness preset
  disables auto-speak, which is the same as `autoSpeak: false`.
  Clarify whether `QUIET` is redundant with the flag or carries
  additional semantics (e.g., suppresses on-demand too).

- **Task 16 data path:** Task 16 references a data file path that
  may not match the actual registry/curriculum file location. Executor
  should verify the import path against the actual file structure.

- **"After migration" ambiguity:** Multiple tasks reference actions
  to be done "after migration" without specifying which migration
  (the config field rename, the `speakPrompt` → `speakAuto` call-site
  migration, or the DB schema migration). Clarify which is meant in
  each context.

- **`useConfigDraft` missing code:** Task references
  `useConfigDraft` but doesn't show its implementation. If it already
  exists, reference the file. If new, add a task or step that
  creates it.

- **SpotAll `resolveSimpleConfig` gap:** Task 15 references a
  `resolveSimpleConfig` helper for SpotAll but the plan doesn't show
  where it's defined or what it returns. Executor needs the full
  signature and file path.

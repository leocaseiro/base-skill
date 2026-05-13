# Spec 1a M1 — TTS Lifecycle Minimum Viable Copy Fix (XState rewrite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible TTS copy fixes from #229 — rename InstructionsOverlay, stop auto-speaking how-to-play, fix NumberMatch's "speak the answer" bug, split `ttsEnabled` into `autoSpeak` + `ttsOnDemandAllowed`, add an inline QuestionRow + AudioButton on the three XState-migrated games (WordSpell, NumberMatch, SortNumbers), and add a Talkativeness preset to AdvancedConfigModal.

**Architecture:** Build the `src/lib/lifecycle-tts/` module whose forward-reference the engine already imports (`GameDefinition.tts`, `SideEffect 'speak'`). Each game's `src/games/<id>/definition.ts` carries its own `tts:` block — there is no parallel registry directory. The XState machine emits `{ type: 'speak', params: { lifecycleEvent } }` actions at the right transitions; `useGameEngine` routes those through `executeSideEffects` which emits a single `lifecycle:speak` bus event. The new `useLifecycleTTS` hook subscribes to that one event, looks up the active game's `definition.tts[lifecycleEvent]`, resolves verbosity (talkativeness preset → registry default), interpolates the i18n template, and calls `speak()` — gated by `autoSpeak`. On-demand surfaces (AudioButton, question onClick) call `speakOnDemand` directly — gated by `ttsOnDemandAllowed`.

**Tech Stack:** React 18, TypeScript, xstate@5, @xstate/react@5, Vitest, i18next, Web Speech API, existing GameEventBus.

**Spec:** `docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md` (§14 M1 acceptance criteria).

**Supersedes:** The plan in closed PR #349 (`docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`) — pre-dates PR 1a/1b XState engine, prescribed a parallel registry that conflicts with the engine's `GameDefinition.tts` contract.

**Required skills for executors:**

- `write-storybook` — for any `*.stories.tsx` files (Tasks 9, 12, 13, 16)
- `update-architecture-docs` — for `.mdx` changes co-located with `src/components/answer-game/` and `src/lib/game-engine/` (Task 19)
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## Spec Deltas

The spec was written before PR 1a/1b shipped. Three deviations from spec §11/§14 are required:

1. **SpotAll deferred from M1.** Spec §14 M1 requires "AudioButton on all 4 games" and "SpotAllPrompt consolidates into useLifecycleTTS." SpotAll is not on the XState engine yet (still uses `src/games/spot-all/spot-all-reducer.ts`). PR 1d (#368) migrates SpotAll; that PR will add the AudioButton + consolidation as a follow-up. M1 ships TTS for WordSpell, NumberMatch, and SortNumbers only.
2. **Per-game registry lives in `definition.ts`, not in a separate `src/lib/lifecycle-tts/registry/` directory.** Spec §11.1 prescribed a directory of registry files. PR 1a/1b already extended `GameDefinition` with `tts?: Partial<Record<LifecycleEvent, EventTemplate>>` (`src/lib/game-engine/definition-types.ts:39`). M1 populates that field on each definition — no parallel directory.
3. **`useLifecycleTTS` subscribes to a single `lifecycle:speak` bus event, not 10+ per-event subscriptions.** Spec §4.1 mapped lifecycle events to bus events 1:1. PR 1a/1b's `executeSideEffects` (`src/lib/game-engine/side-effects.ts:26-34`) already emits a unified `lifecycle:speak` event with the `lifecycleEvent` payload. M1's hook subscribes once and switches on the payload.

These three deltas reduce M1 scope and align the implementation with what the engine already expects. They are tracked here so M2 (registry / full event surface) inherits the same conventions.

---

## How TTS flows (after M1)

```text
[ XState machine in definition.ts ]
   entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]
                              │
                              ▼
[ useGameEngine.ts:150 `speak` action provider ]
   executeSideEffects([{ type: 'speak', lifecycleEvent }], envelope)
                              │
                              ▼
[ side-effects.ts:26-34 ]
   bus.emit({ type: 'lifecycle:speak', lifecycleEvent, ...envelope })
                              │
                              ▼
[ useLifecycleTTS subscriber (NEW) ]
   resolveVerbosity(definition.tts, lifecycleEvent, gradeBand, talkativeness)
     → 'off' | 'brief' | 'full'
   if 'off' or !autoSpeak: return
   resolveCopy(definition.tts, lifecycleEvent, verbosity)
     → i18n key
   interpolate i18n key with AnswerGameContext snapshot
     → speakable string
   speak(string, { rate, volume, voiceName, lang })

Tap-to-speak path (AudioButton, question onClick):
[ <AudioButton event="round.start" /> ]
   const { speakOnDemand } = useLifecycleTTS()
   onClick: speakOnDemand('round.start')
   if !ttsOnDemandAllowed: return
   resolve + interpolate + speak (always 'full' mode)
```

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
├── types.ts                       # LifecycleEvent, Verbosity, EventTemplate, TalkativenessPreset
├── talkativeness-presets.ts       # Quiet / Default / Chatty profiles per gradeBand
├── talkativeness-presets.test.ts
├── resolve.ts                     # resolveVerbosity() + resolveCopy() — pure functions
├── resolve.test.ts
├── useLifecycleTTS.tsx            # Subscribes to lifecycle:speak, gates by autoSpeak, exposes speakOnDemand
├── useLifecycleTTS.test.tsx

src/components/questions/QuestionRow/
├── QuestionRow.tsx                # Inline AudioButton + content layout (icon left)
├── QuestionRow.test.tsx
├── QuestionRow.stories.tsx

src/components/answer-game/GameOptions/
├── GameOptionsOverlay.tsx         # Renamed from InstructionsOverlay; no auto-speak; emits game:prepare
├── GameOptionsOverlay.test.tsx
├── GameOptionsOverlay.stories.tsx
└── useConfigDraft.ts              # Moved unchanged from InstructionsOverlay/
```

### Modified files

<!-- markdownlint-disable MD060 -->

| File                                                             | Change                                                                                                                                                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                                       | Add `game:prepare` to `GameEventType` union + `GamePrepareEvent` interface. (`lifecycle:speak` already exists at line 29.)                                                                                     |
| `src/components/answer-game/types.ts`                            | Split `ttsEnabled: boolean` (line 17) into `autoSpeak: boolean` + `ttsOnDemandAllowed: boolean`; add `gradeBand: GradeBand` and `talkativeness: TalkativenessPreset`.                                          |
| `src/games/spot-all/types.ts`                                    | Same split for `SpotAllConfig.ttsEnabled`. (SpotAll's `speakPrompt` consolidation is deferred per Spec Delta 1 — only the type changes here so the config blob stays consistent.)                              |
| `src/components/answer-game/useGameTTS.ts`                       | Replace `speakPrompt` with `speakAuto` (gated by `autoSpeak`) and `speakOnDemand` (gated by `ttsOnDemandAllowed`); `speakTile` stays as-is but switches its gate from `ttsEnabled` to `autoSpeak`.             |
| `src/components/answer-game/useGameTTS.test.tsx`                 | Update tests for new API; verify gate ref-read works after toggle.                                                                                                                                             |
| `src/components/answer-game/useRoundTTS.ts`                      | **DELETE.** All three XState games drive round-start speech via `entry: [speak({ lifecycleEvent: 'round.start' })]` on the machine's `playing` state. No callers remain after Tasks 9, 10, 11.                 |
| `src/components/answer-game/useRoundTTS.test.tsx`                | **DELETE** alongside the source file.                                                                                                                                                                          |
| `src/games/number-match/definition.ts`                           | Add `tts:` block (matches `Partial<Record<LifecycleEvent, EventTemplate>>` from `definition-types.ts:39`); add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to `playing` state.     |
| `src/games/word-spell/definition.ts`                             | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                        |
| `src/games/sort-numbers/definition.ts`                           | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                        |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Replace stacked numeral + question siblings with `<QuestionRow>`; pass `event="round.start"` to AudioButton.                                                                                                   |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Same — `<QuestionRow>` wrap; pass `event` prop.                                                                                                                                                                |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | **Add AudioButton** (currently has none) via `<QuestionRow>`; pass `event="round.start"`.                                                                                                                      |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch `prompt: string` prop to `event: LifecycleEvent`; gate by `ttsOnDemandAllowed`; call `useLifecycleTTS().speakOnDemand(event)` (mode is always full for on-demand — fixed inside the hook).              |
| `src/components/questions/AudioButton/AudioButton.test.tsx`      | Update tests for new prop API + gate.                                                                                                                                                                          |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route `onClick` speech through `useLifecycleTTS().speakOnDemand`; honor `ttsOnDemandAllowed`.                                                                                                                  |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same.                                                                                                                                                                                                          |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same.                                                                                                                                                                                                          |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same.                                                                                                                                                                                                          |
| `src/components/questions/index.ts`                              | Add `QuestionRow` export.                                                                                                                                                                                      |
| `src/components/AdvancedConfigModal.tsx`                         | Add "Voice & Instructions" section with single Talkativeness preset radio (Quiet / Default / Chatty); read/write `config.talkativeness`.                                                                       |
| `src/components/AdvancedConfigModal.test.tsx`                    | Add test that selecting a preset writes `talkativeness` to config draft.                                                                                                                                       |
| `src/lib/i18n/locales/en/games.json`                             | Add `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*` keys (events: `game-prepare`, `game-start`, `round-start`, `round-error`, `round-correct`, `round-advance`, `level-complete`, `game-over`). |
| `src/lib/i18n/locales/pt-BR/games.json`                          | Mirror keys (placeholder English values; Portuguese translations follow-up).                                                                                                                                   |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update `InstructionsOverlay` import + JSX to `GameOptionsOverlay`.                                                                                                                                             |
| `src/components/answer-game/AnswerGameProvider.tsx`              | (No change needed in M1 — `game:prepare` is emitted by `GameOptionsOverlay` on mount, not the provider. M2 may centralise this.)                                                                               |
| `src/components/answer-game/GameEngine.flows.mdx`                | Document new TTS data flow (Task 19).                                                                                                                                                                          |
| `src/components/answer-game/GameEngine.reference.mdx`            | Document `useLifecycleTTS` hook + `GameDefinition.tts` field + how to add TTS to a new game (Task 19).                                                                                                         |

<!-- markdownlint-enable MD060 -->

### Renamed (moved) files

```text
src/components/answer-game/InstructionsOverlay/
  → src/components/answer-game/GameOptions/
     ├── GameOptionsOverlay.tsx          (was InstructionsOverlay.tsx; behavior change: no auto-speak)
     ├── GameOptionsOverlay.test.tsx     (was InstructionsOverlay.test.tsx)
     ├── GameOptionsOverlay.stories.tsx  (was InstructionsOverlay.stories.tsx; title → 'AnswerGame/GameOptions/GameOptionsOverlay')
     └── useConfigDraft.ts               (moved unchanged; the .test.tsx file moves too)
```

### Deleted files

<!-- markdownlint-disable MD060 -->

| File                                              | Reason                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/answer-game/useRoundTTS.ts`       | Replaced by `useLifecycleTTS` + per-game machine `entry: [speak]` actions. No remaining callers after Tasks 9–11 wire the machines. |
| `src/components/answer-game/useRoundTTS.test.tsx` | Same.                                                                                                                               |

<!-- markdownlint-enable MD060 -->

### Out of scope for M1 (tracked elsewhere)

- **SpotAll AudioButton + speakPrompt consolidation.** Follow-up tied to PR 1d (#368). Open as `M1 follow-up: SpotAll AudioButton` once #368 lands.
- **Per-event `customConfig.events` override surface.** Code-only — game designers set it on customConfigs. M2 work.
- **`LifecycleTTSExplorer.stories.tsx`.** M2 — the registry-table viewer is for game-designer review of `byGradeBand` defaults across multiple games. Deferred until M2 expands the event vocabulary.
- **ARIA live region implementation.** Spec §7.3. M2 — ARIA live regions for round outcomes are decoupled from TTS and ship separately.
- **`round.idle` timer + per-game predicate.** M2 — spec §4.2.
- **Queue policy (cancel-on-new, drop-debounce for repeated errors).** M2 — spec §4.3. Web Speech's default cancel-on-new behavior covers the common case in M1.
- **`game:resume` event emission.** M2 — requires `AnswerGameProvider` remount-detection logic.

---

## Task 1: Lifecycle TTS Types (satisfy engine forward reference)

**Files:**

- Create: `src/lib/lifecycle-tts/types.ts`
- Verify: `src/lib/game-engine/definition-types.ts:1-7` (already imports these types)

- [ ] **Step 1: Create the types module**

Create `src/lib/lifecycle-tts/types.ts`:

```ts
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
  /** i18n keys, one per verbosity mode. Spec §6.1. */
  tts: { brief: string; full: string };
  byGradeBand: Record<GradeBand, Verbosity>;
  default: Verbosity;
};

export type GameTTSConfig = Partial<
  Record<LifecycleEvent, EventTemplate>
>;
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn typecheck`
Expected: PASS — the engine's `definition-types.ts:8` and `useGameEngine.ts:11` imports resolve. No type errors anywhere.

- [ ] **Step 3: Commit**

```bash
git add src/lib/lifecycle-tts/types.ts
git commit -m "feat(lifecycle-tts): add types module — satisfies engine forward reference"
```

---

## Task 2: Talkativeness Presets

**Files:**

- Create: `src/lib/lifecycle-tts/talkativeness-presets.ts`
- Create: `src/lib/lifecycle-tts/talkativeness-presets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/talkativeness-presets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolvePresetVerbosity } from './talkativeness-presets';

describe('resolvePresetVerbosity', () => {
  it('Default at pre-k speaks round.start full', () => {
    expect(
      resolvePresetVerbosity('default', 'pre-k', 'round.start'),
    ).toBe('full');
  });

  it('Quiet at year3-4 turns round.correct off', () => {
    expect(
      resolvePresetVerbosity('quiet', 'year3-4', 'round.correct'),
    ).toBe('off');
  });

  it('Chatty at year5-6 still speaks round.start brief', () => {
    expect(
      resolvePresetVerbosity('chatty', 'year5-6', 'round.start'),
    ).toBe('brief');
  });

  it('returns undefined for unmapped (preset, event) pairs to fall through to registry default', () => {
    // round.idle has no preset opinion — falls through.
    expect(
      resolvePresetVerbosity('default', 'k', 'round.idle'),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/talkativeness-presets.test.ts --reporter=verbose`
Expected: FAIL — `resolvePresetVerbosity` not exported.

- [ ] **Step 3: Implement the presets module**

Create `src/lib/lifecycle-tts/talkativeness-presets.ts`:

```ts
import type {
  LifecycleEvent,
  TalkativenessPreset,
  Verbosity,
} from './types';
import type { GradeBand } from '@/types/game-events';

type PresetProfile = Partial<
  Record<GradeBand, Partial<Record<LifecycleEvent, Verbosity>>>
>;

/**
 * Quiet / Default / Chatty profiles. Each profile maps (gradeBand, event)
 * pairs to a verbosity. Unmapped pairs return undefined so the caller
 * falls through to `definition.tts[event].byGradeBand` / `.default`.
 *
 * Spec §5.1 + §5.3.
 */
const PRESETS: Record<TalkativenessPreset, PresetProfile> = {
  quiet: {
    'pre-k': {
      'game.start': 'brief',
      'round.start': 'brief',
      'round.error': 'brief',
      'round.correct': 'off',
      'level.complete': 'brief',
      'game.over': 'brief',
    },
    k: {
      'game.start': 'brief',
      'round.start': 'brief',
      'round.error': 'brief',
      'round.correct': 'off',
      'level.complete': 'brief',
      'game.over': 'brief',
    },
    'year1-2': {
      'game.start': 'off',
      'round.start': 'brief',
      'round.error': 'brief',
      'round.correct': 'off',
      'level.complete': 'off',
      'game.over': 'brief',
    },
    'year3-4': {
      'game.start': 'off',
      'round.start': 'off',
      'round.error': 'brief',
      'round.correct': 'off',
      'level.complete': 'off',
      'game.over': 'off',
    },
    'year5-6': {
      'game.start': 'off',
      'round.start': 'off',
      'round.error': 'off',
      'round.correct': 'off',
      'level.complete': 'off',
      'game.over': 'off',
    },
  },
  default: {
    // Undefined for every (gradeBand, event) — falls through to registry.
  },
  chatty: {
    'pre-k': {
      'game.prepare': 'full',
      'game.start': 'full',
      'round.start': 'full',
      'round.error': 'full',
      'round.correct': 'full',
      'round.advance': 'full',
      'level.complete': 'full',
      'game.over': 'full',
    },
    k: {
      'game.prepare': 'full',
      'game.start': 'full',
      'round.start': 'full',
      'round.error': 'full',
      'round.correct': 'full',
      'round.advance': 'full',
      'level.complete': 'full',
      'game.over': 'full',
    },
    'year1-2': {
      'game.start': 'full',
      'round.start': 'full',
      'round.error': 'full',
      'round.correct': 'full',
      'level.complete': 'full',
    },
    'year3-4': {
      'round.start': 'brief',
      'round.error': 'full',
      'level.complete': 'brief',
    },
    'year5-6': {
      'round.start': 'brief',
      'round.error': 'brief',
    },
  },
};

export const resolvePresetVerbosity = (
  preset: TalkativenessPreset,
  gradeBand: GradeBand,
  event: LifecycleEvent,
): Verbosity | undefined => {
  return PRESETS[preset][gradeBand]?.[event];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/talkativeness-presets.test.ts --reporter=verbose`
Expected: PASS — all four tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/talkativeness-presets.ts src/lib/lifecycle-tts/talkativeness-presets.test.ts
git commit -m "feat(lifecycle-tts): add Quiet/Default/Chatty talkativeness presets"
```

---

## Task 3: Verbosity + Copy Resolver

**Files:**

- Create: `src/lib/lifecycle-tts/resolve.ts`
- Create: `src/lib/lifecycle-tts/resolve.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/resolve.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveCopy, resolveVerbosity } from './resolve';
import type { EventTemplate, GameTTSConfig } from './types';

const wordSpellRoundStart: EventTemplate = {
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
};

const tts: GameTTSConfig = {
  'round.start': wordSpellRoundStart,
};

describe('resolveVerbosity', () => {
  it('uses preset override when present', () => {
    expect(
      resolveVerbosity({
        tts,
        event: 'round.start',
        gradeBand: 'pre-k',
        talkativeness: 'quiet',
      }),
    ).toBe('brief');
  });

  it('falls through preset → registry byGradeBand → default', () => {
    expect(
      resolveVerbosity({
        tts,
        event: 'round.start',
        gradeBand: 'year3-4',
        talkativeness: 'default',
      }),
    ).toBe('brief');
  });

  it('returns off when event has no template at all', () => {
    expect(
      resolveVerbosity({
        tts,
        event: 'round.idle',
        gradeBand: 'pre-k',
        talkativeness: 'default',
      }),
    ).toBe('off');
  });
});

describe('resolveCopy', () => {
  it('returns the brief i18n key when verbosity is brief', () => {
    expect(
      resolveCopy({ tts, event: 'round.start', verbosity: 'brief' }),
    ).toBe('tts.word-spell.round-start.brief');
  });

  it('returns null when verbosity is off', () => {
    expect(
      resolveCopy({ tts, event: 'round.start', verbosity: 'off' }),
    ).toBeNull();
  });

  it('returns null when event has no template', () => {
    expect(
      resolveCopy({ tts, event: 'round.idle', verbosity: 'full' }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: FAIL — `resolveVerbosity` / `resolveCopy` not exported.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/lifecycle-tts/resolve.ts`:

```ts
import { resolvePresetVerbosity } from './talkativeness-presets';
import type {
  GameTTSConfig,
  LifecycleEvent,
  TalkativenessPreset,
  Verbosity,
} from './types';
import type { GradeBand } from '@/types/game-events';

export interface ResolveVerbosityInput {
  tts: GameTTSConfig | undefined;
  event: LifecycleEvent;
  gradeBand: GradeBand;
  talkativeness: TalkativenessPreset;
}

/**
 * Resolution chain (spec §5.1, simplified for M1 — no customConfig.events
 * surface yet, that lands in M2):
 *
 *   1. talkativeness preset override         ← parent/teacher form (M1)
 *   2. definition.tts[event].byGradeBand     ← per-game default
 *   3. definition.tts[event].default         ← per-game baseline
 *   4. 'off'                                 ← no template = silent
 */
export const resolveVerbosity = ({
  tts,
  event,
  gradeBand,
  talkativeness,
}: ResolveVerbosityInput): Verbosity => {
  const presetOverride = resolvePresetVerbosity(
    talkativeness,
    gradeBand,
    event,
  );
  if (presetOverride !== undefined) return presetOverride;

  const template = tts?.[event];
  if (!template) return 'off';

  return template.byGradeBand[gradeBand] ?? template.default;
};

export interface ResolveCopyInput {
  tts: GameTTSConfig | undefined;
  event: LifecycleEvent;
  verbosity: Verbosity;
}

/**
 * Returns the i18n key for the resolved verbosity, or null when nothing
 * should be spoken (verbosity off, or no template registered).
 */
export const resolveCopy = ({
  tts,
  event,
  verbosity,
}: ResolveCopyInput): string | null => {
  if (verbosity === 'off') return null;
  const template = tts?.[event];
  if (!template) return null;
  return template.tts[verbosity];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: PASS — all six tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/resolve.ts src/lib/lifecycle-tts/resolve.test.ts
git commit -m "feat(lifecycle-tts): add pure verbosity + copy resolvers"
```

---

## Task 4: `game:prepare` Bus Event

**Files:**

- Modify: `src/types/game-events.ts` (add to `GameEventType` union + `GameEvent` discriminated union)
- Test: `src/lib/game-event-bus.test.ts` (append)

`lifecycle:speak` is already declared in `GameEventType` at line 29 (`src/types/game-events.ts`) — no work needed for that event. Only `game:prepare` is new in M1.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/game-event-bus.test.ts`:

```ts
import { getGameEventBus } from './game-event-bus';
import type { GamePrepareEvent } from '@/types/game-events';

describe('game:prepare event', () => {
  it('emits and receives a typed game:prepare event', () => {
    const bus = getGameEventBus();
    const received: GamePrepareEvent[] = [];
    const unsub = bus.subscribe('game:prepare', (e) =>
      received.push(e as GamePrepareEvent),
    );

    const event: GamePrepareEvent = {
      type: 'game:prepare',
      gameId: 'word-spell',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('game:prepare');
    unsub();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: FAIL — `GamePrepareEvent` not exported, `'game:prepare'` not assignable to `GameEventType`.

- [ ] **Step 3: Add the event to game-events.ts**

In `src/types/game-events.ts`, add `'game:prepare'` to the `GameEventType` union (after `'game:start'`, before `'lifecycle:speak'`):

```ts
export type GameEventType =
  | 'game:start'
  | 'game:prepare'
  // ... existing entries unchanged
  | 'lifecycle:speak';
```

Add the interface (group it with the other game-level events, near `GameStartEvent`):

```ts
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game:prepare';
}
```

Add `GamePrepareEvent` to the `GameEvent` discriminated union (locate the union definition and add the new member):

```ts
export type GameEvent =
  | GameStartEvent
  | GamePrepareEvent
  // ... existing entries unchanged
  | LifecycleSpeakEvent;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(events): add game:prepare bus event"
```

---

## Task 5: Split `ttsEnabled` → `autoSpeak` + `ttsOnDemandAllowed` + `gradeBand` + `talkativeness`

This is the load-bearing config refactor. Plan it in three sub-steps: types, callers, defaults/migration. All in one task because the type change cascades through **164 references across 85 files** (verified via `rg --count-matches ttsEnabled src/`) and must compile clean at task end.

**Files:**

- Modify: `src/components/answer-game/types.ts` (line 17)
- Modify: `src/games/spot-all/types.ts` (line ~36 — `SpotAllConfig.ttsEnabled`)
- Modify: every consumer of `config.ttsEnabled` (run `rg ttsEnabled src/` for the full list)
- Modify: every test fixture / mock config (run `rg ttsEnabled src/ -t ts -t tsx` to enumerate)

- [ ] **Step 1: Inventory current `ttsEnabled` references**

Run: `rg --count-matches ttsEnabled src/ | sort -rn -t: -k2 | head -25`

Capture the file list. This drives Step 4. Expected: **164 references across 85 files** (verified via `rg --count-matches ttsEnabled src/` on origin/master HEAD `694797af9`). The full file set spans config types, hook gates, button rendering, question onClick handlers, test fixtures, story files, per-game `ConfigField` arrays, `src/lib/config-tags.ts`, and the RxDB schema at `src/db/schemas/settings.ts`.

- [ ] **Step 2: Write failing test that pins the new config shape**

Add to `src/components/answer-game/AnswerGameProvider.test.tsx` (or create a new `config-shape.test.tsx`):

```ts
import { describe, expect, it } from 'vitest';
import type { AnswerGameConfig } from './types';

describe('AnswerGameConfig TTS flags (M1 split)', () => {
  it('accepts autoSpeak, ttsOnDemandAllowed, gradeBand, talkativeness', () => {
    const cfg: AnswerGameConfig = {
      gameId: 'word-spell',
      inputMethod: 'drag',
      wrongTileBehavior: 'reject',
      tileBankMode: 'exact',
      totalRounds: 5,
      autoSpeak: true,
      ttsOnDemandAllowed: true,
      gradeBand: 'k',
      talkativeness: 'default',
    };
    expect(cfg.autoSpeak).toBe(true);
    expect(cfg.ttsOnDemandAllowed).toBe(true);
    expect(cfg.gradeBand).toBe('k');
    expect(cfg.talkativeness).toBe('default');
  });

  it('rejects the legacy ttsEnabled field at the type level', () => {
    // @ts-expect-error — ttsEnabled removed in M1
    const _legacy: AnswerGameConfig = {
      gameId: 'word-spell',
      inputMethod: 'drag',
      wrongTileBehavior: 'reject',
      tileBankMode: 'exact',
      totalRounds: 5,
      ttsEnabled: true,
    };
    expect(_legacy).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/AnswerGameProvider.test.tsx --reporter=verbose`
Expected: FAIL on the first test (fields not on type); the second test passes the `@ts-expect-error` because `ttsEnabled` is still present, which is the inverse of what we want — that part flips green after Step 4.

Also run: `yarn typecheck` — expect failures across the codebase from the inventory in Step 1.

- [ ] **Step 4: Update the types**

In `src/components/answer-game/types.ts`, replace line 17:

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
/** Grade band — selects per-event verbosity from the registry. */
gradeBand: GradeBand;
/** Talkativeness preset — overrides registry verbosity. */
talkativeness: TalkativenessPreset;
```

Add imports at the top of the file:

```ts
import type { GradeBand } from '@/types/game-events';
import type { TalkativenessPreset } from '@/lib/lifecycle-tts/types';
```

In `src/games/spot-all/types.ts` (find the `ttsEnabled: boolean` field on `SpotAllConfig`), apply the same four-field swap. Add the same two imports. SpotAll's `speakPrompt` consolidation is deferred (Spec Delta 1), but the config shape must stay consistent with the unified TTS contract — its existing reducer/form continues to read these flags, just under their new names.

- [ ] **Step 5: Update each consumer (auto-fix + manual review)**

Use this classification when migrating each `ttsEnabled` reference. Don't grep-replace blindly — the semantics differ by call site.

<!-- markdownlint-disable MD060 -->

| Pattern in caller                                                                      | Replaces `ttsEnabled` with                                                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `if (!ttsEnabled) return` inside a useEffect that auto-speaks on mount or round change | `autoSpeak`                                                                                                                                             |
| `if (!ttsEnabled) return null` inside AudioButton / question onClick branches          | `ttsOnDemandAllowed`                                                                                                                                    |
| `disabled={!ttsEnabled}` on a button or input that drives on-demand speech             | `ttsOnDemandAllowed`                                                                                                                                    |
| Default config construction (e.g. `{ ttsEnabled: true }`)                              | `{ autoSpeak: true, ttsOnDemandAllowed: true, gradeBand: 'k', talkativeness: 'default' }`                                                               |
| Test fixture / mock config                                                             | Same as default config construction                                                                                                                     |
| Form value binding (`ConfigFormFields`, `useConfigDraft`)                              | Bind the two new boolean fields + add `talkativeness` select + `gradeBand` select                                                                       |
| Legacy migration path (RxDB `customGame.config` load)                                  | Map `{ ttsEnabled: false }` → `{ autoSpeak: false, ttsOnDemandAllowed: false }`; map missing `gradeBand` → `'k'`; missing `talkativeness` → `'default'` |

<!-- markdownlint-enable MD060 -->

Per-file checklist (derived from `rg ttsEnabled src/` Step 1):

- `src/components/answer-game/useGameTTS.ts` — `speakTile` gate flips to `autoSpeak`; `speakPrompt` is removed in Task 6
- `src/components/answer-game/useRoundTTS.ts` — file is deleted in Task 11; no migration needed
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx:174` — file is rewritten in Task 16; no per-line migration needed
- `src/components/questions/AudioButton/AudioButton.tsx` — `ttsOnDemandAllowed` (Task 13)
- `src/components/questions/TextQuestion/TextQuestion.tsx` — `ttsOnDemandAllowed` (Task 14)
- `src/components/questions/ImageQuestion/ImageQuestion.tsx` — `ttsOnDemandAllowed` (Task 14)
- `src/components/questions/EmojiQuestion/EmojiQuestion.tsx` — `ttsOnDemandAllowed` (Task 14)
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — `ttsOnDemandAllowed` (Task 14)
- `src/components/AdvancedConfigModal.tsx` — bind to both flags + `talkativeness` + `gradeBand` (Task 17)
- `src/components/answer-game/useDraggableTile.ts` + `.test.tsx` — likely `autoSpeak` (tile pickup speech)
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — likely `autoSpeak` for in-game speech
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — likely `autoSpeak`
- `src/games/word-spell/WordSpell/WordSpell.tsx` — likely `autoSpeak`
- All `*.config-form.stories.tsx` story files — update mock configs to use both new flags
- All `*.test.tsx` files — update fixtures

For each file: edit, run its test file (`npx vitest run <file>.test.tsx`), confirm green, move to the next. Don't batch — small commits per file or per logical group.

- [ ] **Step 6: Run the full test suite + typecheck**

```bash
yarn typecheck
npx vitest run
```

Expected: PASS / 0 errors. If any file still references `ttsEnabled`, fix it before the task closes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(answer-game): split ttsEnabled into autoSpeak + ttsOnDemandAllowed + add gradeBand + talkativeness"
```

---

## Task 6: useGameTTS — speakAuto / speakOnDemand split

**Files:**

- Modify: `src/components/answer-game/useGameTTS.ts`
- Modify: `src/components/answer-game/useGameTTS.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the test bodies in `src/components/answer-game/useGameTTS.test.tsx` (keep the existing setup harness — `renderHook`, mock provider) and add the new cases:

```ts
describe('speakAuto', () => {
  it('speaks when autoSpeak is true', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper({
        config: { autoSpeak: true, ttsOnDemandAllowed: true },
      }),
    });
    result.current.speakAuto('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('does not speak when autoSpeak is false (even if ttsOnDemandAllowed is true)', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper({
        config: { autoSpeak: false, ttsOnDemandAllowed: true },
      }),
    });
    result.current.speakAuto('Hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('speakOnDemand', () => {
  it('speaks when ttsOnDemandAllowed is true', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper({
        config: { autoSpeak: false, ttsOnDemandAllowed: true },
      }),
    });
    result.current.speakOnDemand('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('does not speak when ttsOnDemandAllowed is false', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper({
        config: { autoSpeak: true, ttsOnDemandAllowed: false },
      }),
    });
    result.current.speakOnDemand('Hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('speakTile (regression)', () => {
  it('flips its gate from ttsEnabled (removed) to autoSpeak', () => {
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper({
        config: { autoSpeak: true, ttsOnDemandAllowed: false },
      }),
    });
    result.current.speakTile('A');
    expect(speakSpy).toHaveBeenCalledWith('A', expect.any(Object));
  });
});
```

(If the test harness doesn't already accept a `config` override, add one to `makeWrapper` so the tests can inject the flag combination.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/answer-game/useGameTTS.test.tsx --reporter=verbose`
Expected: FAIL — `speakAuto` / `speakOnDemand` do not exist; `speakTile` still gates on `ttsEnabled`.

- [ ] **Step 3: Replace useGameTTS implementation**

Replace `src/components/answer-game/useGameTTS.ts` with:

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
      if (isSpeechActive()) {
        console.debug(`[TTS] speakTile("${label}") — busy, skipped`);
        return;
      }
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/useGameTTS.test.tsx --reporter=verbose`
Expected: PASS — all new tests green; legacy `speakPrompt` callers (if any survived Task 5) become typecheck errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/useGameTTS.ts src/components/answer-game/useGameTTS.test.tsx
git commit -m "feat(answer-game): split useGameTTS into speakAuto + speakOnDemand"
```

---

## Task 7: useLifecycleTTS hook

This is the centerpiece — subscribes to the unified `lifecycle:speak` bus event, resolves verbosity + copy, interpolates with `AnswerGameContext` snapshot, and calls `speak()`. Also exposes a `speakOnDemand(event)` callable for AudioButton / question onClick.

**Files:**

- Create: `src/lib/lifecycle-tts/useLifecycleTTS.tsx`
- Create: `src/lib/lifecycle-tts/useLifecycleTTS.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/useLifecycleTTS.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLifecycleTTS } from './useLifecycleTTS';
import type { GameTTSConfig } from './types';
import type { ReactNode } from 'react';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
}));
import { speak as speakMock } from '@/lib/speech/SpeechOutput';

// Minimal test-only AnswerGameContext provider — pass through the bits the
// hook reads (gameId, config flags, currentRound for interpolation).
const makeWrapper = (contextValue: {
  autoSpeak: boolean;
  ttsOnDemandAllowed: boolean;
  gradeBand: 'k';
  talkativeness: 'default';
  gameId: 'word-spell';
  tts: GameTTSConfig;
}) => {
  return ({ children }: { children: ReactNode }) => (
    <TestAnswerGameContext value={contextValue}>
      {children}
    </TestAnswerGameContext>
  );
};

const tts: GameTTSConfig = {
  'round.start': {
    tts: {
      brief: 'tts.word-spell.round-start.brief',
      full: 'tts.word-spell.round-start.full',
    },
    byGradeBand: {
      'pre-k': 'full',
      k: 'full',
      'year1-2': 'brief',
      'year3-4': 'brief',
      'year5-6': 'brief',
    },
    default: 'full',
  },
};

describe('useLifecycleTTS — auto-speak subscriber', () => {
  it('speaks the resolved copy when a lifecycle:speak event fires and autoSpeak is true', () => {
    renderHook(() => useLifecycleTTS(), {
      wrapper: makeWrapper({
        autoSpeak: true,
        ttsOnDemandAllowed: true,
        gradeBand: 'k',
        talkativeness: 'default',
        gameId: 'word-spell',
        tts,
      }),
    });

    emitLifecycleSpeak('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock).toHaveBeenCalledWith(
      expect.stringContaining('Spell the word'),
      expect.any(Object),
    );
  });

  it('does not speak when autoSpeak is false', () => {
    renderHook(() => useLifecycleTTS(), {
      wrapper: makeWrapper({
        autoSpeak: false,
        ttsOnDemandAllowed: true,
        gradeBand: 'k',
        talkativeness: 'default',
        gameId: 'word-spell',
        tts,
      }),
    });

    emitLifecycleSpeak('round.start');
    expect(speakMock).not.toHaveBeenCalled();
  });
});

describe('useLifecycleTTS — speakOnDemand', () => {
  it('speaks the full copy regardless of autoSpeak when ttsOnDemandAllowed is true', () => {
    const { result } = renderHook(() => useLifecycleTTS(), {
      wrapper: makeWrapper({
        autoSpeak: false,
        ttsOnDemandAllowed: true,
        gradeBand: 'k',
        talkativeness: 'default',
        gameId: 'word-spell',
        tts,
      }),
    });

    result.current.speakOnDemand('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  it('does not speak when ttsOnDemandAllowed is false', () => {
    const { result } = renderHook(() => useLifecycleTTS(), {
      wrapper: makeWrapper({
        autoSpeak: true,
        ttsOnDemandAllowed: false,
        gradeBand: 'k',
        talkativeness: 'default',
        gameId: 'word-spell',
        tts,
      }),
    });

    result.current.speakOnDemand('round.start');
    expect(speakMock).not.toHaveBeenCalled();
  });
});
```

If the project doesn't already expose a test-only `AnswerGameContext` provider, create a thin one inline in the test file (or in a shared `lifecycle-tts/test-utils.tsx`) that supplies the four context values the hook reads. `emitLifecycleSpeak` is a helper that calls `getGameEventBus().emit({ type: 'lifecycle:speak', lifecycleEvent, ...envelope })`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTTS.test.tsx --reporter=verbose`
Expected: FAIL — `useLifecycleTTS` not exported.

- [ ] **Step 3: Implement the hook**

Create `src/lib/lifecycle-tts/useLifecycleTTS.tsx`:

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveCopy, resolveVerbosity } from './resolve';
import type { LifecycleEvent } from './types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useSettings } from '@/db/hooks/useSettings';
import { getGameEventBus } from '@/lib/game-event-bus';
import { speak } from '@/lib/speech/SpeechOutput';
import type { LifecycleSpeakEvent } from '@/types/game-events';

export interface LifecycleTTS {
  speakOnDemand: (event: LifecycleEvent) => void;
}

const buildInterpolationContext = (
  ctx: ReturnType<typeof useAnswerGameContext>,
): Record<string, string | number> => {
  // Pulls per-game template variables from AnswerGameContext.
  // Spec §6.5. Per-game required vars:
  //   WordSpell:   {{word}}, {{gameName}}
  //   NumberMatch: {{count}}, {{gameName}}
  //   SortNumbers: {{direction}}, {{from}}, {{to}}, {{step}}, {{gameName}}
  // M1 reads from currentRound + config; M2 may add more accessors.
  const round = ctx.currentRound ?? {};
  return {
    gameName: ctx.config.gameId,
    word: (round as { word?: string }).word ?? '',
    count: (round as { value?: number }).value ?? 0,
    direction: (round as { direction?: string }).direction ?? '',
    from: (round as { from?: number }).from ?? 0,
    to: (round as { to?: number }).to ?? 0,
    step: (round as { step?: number }).step ?? 1,
  };
};

export const useLifecycleTTS = (): LifecycleTTS => {
  const ctx = useAnswerGameContext();
  const { settings } = useSettings();
  const { t, i18n } = useTranslation();

  // Refs so the bus handler sees current values without resubscribing.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const speakResolved = useCallback(
    (event: LifecycleEvent, modeOverride?: 'full') => {
      const current = ctxRef.current;
      const ttsConfig = current.gameDefinition?.tts ?? undefined;

      const verbosity =
        modeOverride ??
        resolveVerbosity({
          tts: ttsConfig,
          event,
          gradeBand: current.config.gradeBand,
          talkativeness: current.config.talkativeness,
        });

      const key = resolveCopy({
        tts: ttsConfig,
        event,
        verbosity,
      });
      if (!key) return;

      const interpolated = t(key, buildInterpolationContext(current));
      const opts = {
        rate: settingsRef.current.speechRate ?? 1,
        volume: settingsRef.current.voiceVolume ?? 0.8,
        voiceName: settingsRef.current.preferredVoiceURI,
        lang: i18n.language,
      };
      speak(interpolated, opts);
    },
    [t, i18n.language],
  );

  // Subscribe once; the handler reads fresh state from refs.
  useEffect(() => {
    const bus = getGameEventBus();
    const unsub = bus.subscribe('lifecycle:speak', (e) => {
      const current = ctxRef.current;
      if (!current.config.autoSpeak) return;
      const { lifecycleEvent } = e as LifecycleSpeakEvent;
      speakResolved(lifecycleEvent);
    });
    return unsub;
  }, [speakResolved]);

  const speakOnDemand = useCallback(
    (event: LifecycleEvent) => {
      if (!ctxRef.current.config.ttsOnDemandAllowed) return;
      // Always 'full' for on-demand — spec §9.3.
      speakResolved(event, 'full');
    },
    [speakResolved],
  );

  return { speakOnDemand };
};
```

**Note on `gameDefinition` on context.** `useLifecycleTTS` needs the active game's `definition.tts` block. Three options for sourcing it:

1. **(Preferred)** Extend `useAnswerGameContext` to expose the resolved `GameDefinition` for the active game. The XState engine already needs the definition (passed to `useGameEngine`), so threading it through the context is a small change.
2. Look up via a `gameRegistry` (a `Record<gameId, GameDefinition>` exported from `src/games/index.ts`). Simpler but couples the hook to a global registry.
3. Pass the `tts` block in via the route component (e.g. `<UseLifecycleTTSProvider tts={numberMatchDefinition.tts} />`). Most explicit but adds boilerplate.

Pick option 1 during implementation (smallest code change, fewest moving parts). If `useAnswerGameContext` doesn't already accept a `gameDefinition` prop on its provider, this task includes that wiring change in `AnswerGameProvider.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTTS.test.tsx --reporter=verbose`
Expected: PASS — all four cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/useLifecycleTTS.tsx src/lib/lifecycle-tts/useLifecycleTTS.test.tsx src/components/answer-game/useAnswerGameContext.ts src/components/answer-game/AnswerGameProvider.tsx
git commit -m "feat(lifecycle-tts): add useLifecycleTTS hook + thread gameDefinition through AnswerGameContext"
```

---

## Task 8: Mount useLifecycleTTS in the active route

`useLifecycleTTS` is a singleton subscriber per active game — it must be mounted exactly once per session. The natural mount point is the game route or `AnswerGameProvider`.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx` OR `src/components/answer-game/AnswerGameProvider.tsx` (pick whichever already wraps the game UI)

- [ ] **Step 1: Write the failing test**

Add to the chosen file's existing test (e.g. `AnswerGameProvider.test.tsx`):

```ts
it('emits lifecycle:speak → speak() is called once per autoSpeak event', async () => {
  // Render with autoSpeak: true; emit lifecycle:speak; assert speak was called.
  // Render with autoSpeak: false; emit; assert speak was NOT called.
});
```

Expected: FAIL — there's no subscriber mounted yet.

- [ ] **Step 2: Mount the hook**

In `AnswerGameProvider.tsx`, add a child component that mounts the hook:

```tsx
const LifecycleTTSBridge = (): null => {
  useLifecycleTTS();
  return null;
};

// Inside AnswerGameProvider's JSX:
<AnswerGameContext.Provider value={...}>
  <LifecycleTTSBridge />
  {children}
</AnswerGameContext.Provider>
```

This guarantees a single subscriber per game session and the hook lives inside the context it needs.

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/AnswerGameProvider.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/AnswerGameProvider.tsx src/components/answer-game/AnswerGameProvider.test.tsx
git commit -m "feat(answer-game): mount useLifecycleTTS subscriber in AnswerGameProvider"
```

---

## Task 9: NumberMatch — `tts:` block + machine `speak` entry (fixes "speak the answer" bug)

**Files:**

- Modify: `src/games/number-match/definition.ts:631-639` (add `tts:` field to the exported definition)
- Modify: `src/games/number-match/definition.ts:571-595` (add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to the `playing` state)
- Modify: `src/games/number-match/definition.test.ts` (add test for new entry action)

The current behavior at `NumberMatch.tsx` reads the bare numeral aloud (the "5" bug). After this task, the machine's `playing` state entry fires `speak({ lifecycleEvent: 'round.start' })`, which resolves to the registered template (`"Find the matching number for {{count}}."`).

- [ ] **Step 1: Write the failing test**

Add to `src/games/number-match/definition.test.ts`:

```ts
import { createActor } from 'xstate';
import { describe, expect, it, vi } from 'vitest';
import { numberMatchDefinition } from './definition';

describe('NumberMatch machine — TTS entry actions', () => {
  it('fires speak({ lifecycleEvent: round.start }) on entry to playing', () => {
    const speakSpy = vi.fn();
    const machine = numberMatchDefinition.machine.provide({
      actions: {
        speak: speakSpy,
        // Stub the other engine-injected actions for the test.
        playSound: () => {},
        completeGame: () => {},
        emit: () => {},
      },
      guards: {
        isLastRound: () => false,
        isMidLevelRound: () => false,
        isLastRoundOfLevel: () => false,
      },
    });
    const actor = createActor(machine, {
      input: {
        totalRounds: 3,
        maxLevels: null,
        wrongTileBehavior: 'reject',
      },
    });
    actor.start();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lifecycleEvent: 'round.start' }),
    );
  });

  it('definition.tts has a round.start template', () => {
    expect(numberMatchDefinition.tts).toBeDefined();
    expect(numberMatchDefinition.tts?.['round.start']).toBeDefined();
    expect(numberMatchDefinition.tts?.['round.start']?.tts.full).toBe(
      'tts.number-match.round-start.full',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/number-match/definition.test.ts --reporter=verbose`
Expected: FAIL — `playing` state has no `entry`; `definition.tts` is undefined.

- [ ] **Step 3: Add the `tts:` block to the definition**

In `src/games/number-match/definition.ts`, modify the exported definition (replace lines 631–639):

```ts
import type { GameTTSConfig } from '@/lib/lifecycle-tts/types';

const numberMatchTTS: GameTTSConfig = {
  'game.prepare': {
    tts: {
      brief: 'tts.number-match.game-prepare.brief',
      full: 'tts.number-match.game-prepare.full',
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
      brief: 'tts.number-match.game-start.brief',
      full: 'tts.number-match.game-start.full',
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
      brief: 'tts.number-match.round-start.brief',
      full: 'tts.number-match.round-start.full',
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
  'round.error': {
    tts: {
      brief: 'tts.number-match.round-error.brief',
      full: 'tts.number-match.round-error.full',
    },
    byGradeBand: {
      'pre-k': 'full',
      k: 'full',
      'year1-2': 'brief',
      'year3-4': 'brief',
      'year5-6': 'off',
    },
    default: 'brief',
  },
  'round.correct': {
    tts: {
      brief: 'tts.number-match.round-correct.brief',
      full: 'tts.number-match.round-correct.full',
    },
    byGradeBand: {
      'pre-k': 'full',
      k: 'brief',
      'year1-2': 'brief',
      'year3-4': 'off',
      'year5-6': 'off',
    },
    default: 'brief',
  },
  'level.complete': {
    tts: {
      brief: 'tts.number-match.level-complete.brief',
      full: 'tts.number-match.level-complete.full',
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
  'game.over': {
    tts: {
      brief: 'tts.number-match.game-over.brief',
      full: 'tts.number-match.game-over.full',
    },
    byGradeBand: {
      'pre-k': 'full',
      k: 'full',
      'year1-2': 'full',
      'year3-4': 'full',
      'year5-6': 'brief',
    },
    default: 'full',
  },
};

export const numberMatchDefinition: GameDefinition = {
  id: 'number-match',
  interaction: 'drag-to-slot',
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  machine: numberMatchMachine,
  tts: numberMatchTTS,
};
```

- [ ] **Step 4: Add the `speak` entry action to the `playing` state**

In `src/games/number-match/definition.ts`, modify the `playing` state (the block at line 572 ish — the current `playing` state has `always` + `on` but no `entry`):

```ts
playing: {
  entry: [
    { type: 'speak', params: { lifecycleEvent: 'round.start' } },
  ],
  always: [{ guard: 'allFilledCorrectly', target: 'roundComplete' }],
  on: {
    // ... unchanged
  },
},
```

Also add `speak` entries at the appropriate transitions for the other events the registry handles. Minimum set for M1:

- `roundComplete` state (already has `playSound`): also add `{ type: 'speak', params: { lifecycleEvent: 'round.correct' } }`.
- Optional: track `round.error` via an `assign` + `entry`-like pattern on `placeTile` actions — defer to M2 if the wiring is non-trivial; M1's must-haves are `round.start` (fixes the "5" bug) + `game.over` (already present at line 624).

- [ ] **Step 4b: Remove the legacy `useRoundTTS` caller from NumberMatch**

The machine now drives round-start speech via the `entry: [speak]` action; the legacy `useRoundTTS(String(round?.value ?? ''))` call at `src/games/number-match/NumberMatch/NumberMatch.tsx:131` and its import at line 38 must be removed in the SAME commit as the machine wiring to avoid double-speech (machine emit + legacy hook would both fire). Run `rg useRoundTTS src/games/number-match/` to verify zero callers remain after the edit.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/games/number-match/definition.test.ts src/games/number-match/NumberMatch/NumberMatch.test.tsx --reporter=verbose`
Expected: PASS — TTS entries fire; existing NumberMatch tests still pass.

- [ ] **Step 6: Run the full game test in dev to confirm the "5" bug is gone**

Run dev server (`yarn dev`), open NumberMatch in a browser, play one round with `autoSpeak: true`. Confirm that the speech says "Find the matching number for five." (or similar) instead of just "Five." This is a user-visible acceptance criterion — automated tests alone cannot prove the fix.

- [ ] **Step 7: Commit**

```bash
git add src/games/number-match/definition.ts src/games/number-match/definition.test.ts src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "fix(number-match): replace bare-numeral readout with registry-backed round.start template; remove legacy useRoundTTS caller — fixes #229 'speak the answer' bug"
```

---

## Task 10: WordSpell — `tts:` block + machine `speak` entry

**Files:**

- Modify: `src/games/word-spell/definition.ts`
- Modify: `src/games/word-spell/definition.test.ts`

Mirror the shape of Task 9, but with WordSpell template variables (`{{word}}` instead of `{{count}}`).

- [ ] **Step 1: Write the failing test**

Add to `src/games/word-spell/definition.test.ts`:

```ts
import { createActor } from 'xstate';
import { describe, expect, it, vi } from 'vitest';
import { wordSpellDefinition } from './definition';

describe('WordSpell machine — TTS entry actions', () => {
  it('fires speak({ lifecycleEvent: round.start }) on entry to playing', () => {
    const speakSpy = vi.fn();
    const machine = wordSpellDefinition.machine.provide({
      actions: {
        speak: speakSpy,
        playSound: () => {},
        completeGame: () => {},
        emit: () => {},
      },
      guards: {
        isLastRound: () => false,
        isMidLevelRound: () => false,
        isLastRoundOfLevel: () => false,
      },
    });
    const actor = createActor(machine, {
      input: {
        /* fill in WordSpell-specific input — copy from existing tests */
      },
    });
    actor.start();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lifecycleEvent: 'round.start' }),
    );
  });

  it('definition.tts has a round.start template using {{word}}', () => {
    expect(wordSpellDefinition.tts?.['round.start']?.tts.full).toBe(
      'tts.word-spell.round-start.full',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/games/word-spell/definition.test.ts --reporter=verbose`
Expected: FAIL.

- [ ] **Step 3: Add the `tts:` block + entry action**

Add the `wordSpellTTS` constant before the exported definition (same structure as Task 9 but with `word-spell` i18n keys), and add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to the `playing` state. Use the WordSpell template values from spec §6.2 as a starting point.

- [ ] **Step 3b: Remove the legacy `useRoundTTS` caller from WordSpell**

Remove `useRoundTTS(round?.word ?? '')` at `src/games/word-spell/WordSpell/WordSpell.tsx:99` and its import at line 40 in the SAME commit as the machine wiring to avoid double-speech. Run `rg useRoundTTS src/games/word-spell/` to verify zero callers remain.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/games/word-spell/ --reporter=verbose`
Expected: PASS — TTS entries fire; existing WordSpell tests unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/definition.ts src/games/word-spell/definition.test.ts src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat(word-spell): add TTS registry + round.start speak entry to machine; remove legacy useRoundTTS caller"
```

---

## Task 11: SortNumbers — `tts:` block + machine `speak` entry; delete useRoundTTS

**Files:**

- Modify: `src/games/sort-numbers/definition.ts`
- Modify: `src/games/sort-numbers/definition.test.ts`
- Delete: `src/components/answer-game/useRoundTTS.ts`
- Delete: `src/components/answer-game/useRoundTTS.test.tsx`

By the end of this task, all three XState-migrated games drive round-start speech via the machine. `useRoundTTS` has no remaining callers and is deleted.

- [ ] **Step 1: Add the `tts:` block + entry action**

Same shape as Task 9/10 but with SortNumbers template values (uses `{{direction}}`, `{{from}}`, `{{to}}`, `{{step}}` per spec §6.5). Reference SortNumbers' `round.start` template from spec §10.

- [ ] **Step 1b: Remove the legacy `useRoundTTS` caller from SortNumbers**

Remove `useRoundTTS(directionLabel)` at `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:91` and its import at line 32. This is the final caller — after this edit, `rg useRoundTTS src/games/` should return zero matches across all three migrated games.

- [ ] **Step 2: Confirm no other code references useRoundTTS**

Run: `rg useRoundTTS src/`
Expected: only `useRoundTTS.ts` / `.test.tsx` themselves should match (callers in NumberMatch/WordSpell/SortNumbers were removed in Tasks 9 Step 4b, 10 Step 3b, and 11 Step 1b respectively). If any caller still imports it, migrate to `useLifecycleTTS` (the auto-speak path is now machine-driven; tap-to-speak goes through AudioButton in Task 13).

- [ ] **Step 3: Delete useRoundTTS**

```bash
git rm src/components/answer-game/useRoundTTS.ts src/components/answer-game/useRoundTTS.test.tsx
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn typecheck && npx vitest run`
Expected: PASS — no references to `useRoundTTS` left; all SortNumbers tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/definition.ts src/games/sort-numbers/definition.test.ts src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(sort-numbers): add TTS registry + round.start speak entry; remove legacy useRoundTTS caller + module"
```

---

## Task 12: QuestionRow Component

Inline AudioButton (icon left) + content (right) wrapper. Used by WordSpell, NumberMatch, SortNumbers in Task 15.

**REQUIRED SKILL:** `write-storybook` (for `QuestionRow.stories.tsx`).

**Files:**

- Create: `src/components/questions/QuestionRow/QuestionRow.tsx`
- Create: `src/components/questions/QuestionRow/QuestionRow.test.tsx`
- Create: `src/components/questions/QuestionRow/QuestionRow.stories.tsx`
- Modify: `src/components/questions/index.ts` (export `QuestionRow`)

- [ ] **Step 1: Write the failing test**

Create `src/components/questions/QuestionRow/QuestionRow.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionRow } from './QuestionRow';

describe('QuestionRow', () => {
  it('renders the audio slot on the left and content on the right', () => {
    render(
      <QuestionRow
        audio={<button data-testid="audio">A</button>}
        content={<span data-testid="content">cat</span>}
      />,
    );
    const row = screen.getByTestId('audio').parentElement;
    expect(row).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('wraps content to a new line without truncating long text', () => {
    render(
      <QuestionRow
        audio={<button>A</button>}
        content={
          <span>
            Sort these numbers in ascending order from one hundred to
            five hundred, skipping by ten.
          </span>
        }
      />,
    );
    const content = screen.getByText(/Sort these numbers/);
    expect(content).toBeInTheDocument();
    // CSS-based wrap verification belongs in VR, not unit; this asserts
    // text is not truncated by ellipsis.
    expect(content.textContent?.length).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/QuestionRow/QuestionRow.test.tsx --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement QuestionRow**

Create `src/components/questions/QuestionRow/QuestionRow.tsx`:

```tsx
import type { JSX, ReactNode } from 'react';
import styles from './QuestionRow.module.css';

export interface QuestionRowProps {
  /** Audio button (or other left-aligned control). */
  audio: ReactNode;
  /** Question text or visual content. */
  content: ReactNode;
}

export const QuestionRow = ({
  audio,
  content,
}: QuestionRowProps): JSX.Element => (
  <div className={styles['row']} role="group">
    <div className={styles['audio']}>{audio}</div>
    <div className={styles['content']}>{content}</div>
  </div>
);
```

Create `src/components/questions/QuestionRow/QuestionRow.module.css`:

```css
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  min-height: 44px; /* tap-target floor per WCAG */
  flex-wrap: wrap;
}

.audio {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.content {
  flex: 1 1 0;
  min-width: 0;
  word-break: break-word;
}
```

Add to `src/components/questions/index.ts`:

```ts
export { QuestionRow } from './QuestionRow/QuestionRow';
export type { QuestionRowProps } from './QuestionRow/QuestionRow';
```

- [ ] **Step 4: Create the Storybook story**

Create `src/components/questions/QuestionRow/QuestionRow.stories.tsx` following `write-storybook` conventions (load that skill before authoring). Single Playground story, controls for `audio` and `content`, decorator providing theme. Title: `'Questions/QuestionRow'`.

- [ ] **Step 5: Run tests + storybook smoke test**

Run: `npx vitest run src/components/questions/QuestionRow/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/QuestionRow/ src/components/questions/index.ts
git commit -m "feat(questions): add QuestionRow inline layout wrapper"
```

---

## Task 13: AudioButton refactor — lifecycle event prop

**REQUIRED SKILL:** `write-storybook` (Storybook update).

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.test.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.stories.tsx`

- [ ] **Step 1: Write the failing test**

Update `src/components/questions/AudioButton/AudioButton.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';

const speakOnDemand = vi.fn();
vi.mock('@/lib/lifecycle-tts/useLifecycleTTS', () => ({
  useLifecycleTTS: () => ({ speakOnDemand }),
}));

describe('AudioButton', () => {
  beforeEach(() => speakOnDemand.mockClear());

  it('renders when ttsOnDemandAllowed is true', () => {
    renderWithCtx({ ttsOnDemandAllowed: true });
    expect(
      screen.getByRole('button', { name: /hear/i }),
    ).toBeInTheDocument();
  });

  it('returns null when ttsOnDemandAllowed is false', () => {
    renderWithCtx({ ttsOnDemandAllowed: false });
    expect(screen.queryByRole('button', { name: /hear/i })).toBeNull();
  });

  it('calls speakOnDemand with the lifecycle event when clicked', () => {
    renderWithCtx({ ttsOnDemandAllowed: true });
    fireEvent.click(screen.getByRole('button'));
    expect(speakOnDemand).toHaveBeenCalledWith('round.start');
  });
});

const renderWithCtx = (overrides: { ttsOnDemandAllowed: boolean }) =>
  render(
    <TestAnswerGameProvider
      config={{ ttsOnDemandAllowed: overrides.ttsOnDemandAllowed }}
    >
      <AudioButton event="round.start" />
    </TestAnswerGameProvider>,
  );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: FAIL — current AudioButton takes `prompt: string`, not `event: LifecycleEvent`.

- [ ] **Step 3: Refactor AudioButton**

Replace `src/components/questions/AudioButton/AudioButton.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useLifecycleTTS } from '@/lib/lifecycle-tts/useLifecycleTTS';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';
import type { JSX } from 'react';

export interface AudioButtonProps {
  event: LifecycleEvent;
}

export const AudioButton = ({
  event,
}: AudioButtonProps): JSX.Element | null => {
  const { config } = useAnswerGameContext();
  const { speakOnDemand } = useLifecycleTTS();
  const { t } = useTranslation();

  if (!config.ttsOnDemandAllowed) return null;

  return (
    <button
      type="button"
      aria-label={t('common.audio.replay', {
        defaultValue: 'Hear the question',
      })}
      onClick={() => speakOnDemand(event)}
    >
      🔊
    </button>
  );
};
```

(Replace the emoji with whatever icon component the existing AudioButton uses; preserve existing styling classnames.)

- [ ] **Step 4: Update Storybook story per write-storybook skill**

`event` becomes the primary control (a select with all `LifecycleEvent` values). Title stays `'Questions/AudioButton'`. Add a decorator that wraps in `TestAnswerGameProvider` so the gate reads correctly.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/components/questions/AudioButton/ && yarn typecheck`
Expected: PASS — old `prompt`-based callers (if any survived) become typecheck errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/AudioButton/
git commit -m "feat(audio-button): switch from prompt prop to lifecycle event + ttsOnDemandAllowed gate"
```

---

## Task 14: Question components — gate onClick speech by ttsOnDemandAllowed

**Files:**

- Modify: `src/components/questions/TextQuestion/TextQuestion.tsx`
- Modify: `src/components/questions/ImageQuestion/ImageQuestion.tsx`
- Modify: `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`
- Modify: `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`
- Modify: each component's `.test.tsx` file

Each of the four question components today reads `config.ttsEnabled` for its onClick speech. Task 5 already migrated those reads to `autoSpeak`/`ttsOnDemandAllowed`. This task is the targeted re-classification: onClick speech is _on-demand_, so the right gate is `ttsOnDemandAllowed`. Also routes the speech call through `useLifecycleTTS.speakOnDemand` for SRS observability parity (the `round:tts-played` emission lands in M2 — for M1 just use the same code path).

- [ ] **Step 1: Write the failing test (per question component)**

For `TextQuestion`, add or update:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextQuestion } from './TextQuestion';

const speakOnDemand = vi.fn();
vi.mock('@/lib/lifecycle-tts/useLifecycleTTS', () => ({
  useLifecycleTTS: () => ({ speakOnDemand }),
}));

describe('TextQuestion onClick speech', () => {
  beforeEach(() => speakOnDemand.mockClear());

  it('speaks when ttsOnDemandAllowed is true', () => {
    render(
      <TestAnswerGameProvider
        config={{ ttsOnDemandAllowed: true, autoSpeak: false }}
      >
        <TextQuestion text="cat" />
      </TestAnswerGameProvider>,
    );
    fireEvent.click(screen.getByText('cat'));
    expect(speakOnDemand).toHaveBeenCalledTimes(1);
  });

  it('does not speak when ttsOnDemandAllowed is false', () => {
    render(
      <TestAnswerGameProvider
        config={{ ttsOnDemandAllowed: false, autoSpeak: true }}
      >
        <TextQuestion text="cat" />
      </TestAnswerGameProvider>,
    );
    fireEvent.click(screen.getByText('cat'));
    expect(speakOnDemand).not.toHaveBeenCalled();
  });
});
```

Repeat for `ImageQuestion`, `EmojiQuestion`, `DotGroupQuestion` with their respective click targets.

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — components still gate by `ttsEnabled` (or the wrong new flag from Task 5's bulk migration).

- [ ] **Step 3: Update each component**

In each of the four files, locate the onClick handler that calls `speak()` or `useGameTTS().speakPrompt()`, and replace with:

```tsx
const { speakOnDemand } = useLifecycleTTS();

const handleClick = () => {
  // Existing behavior: only on-demand if the flag allows it.
  speakOnDemand('round.start');
};
```

`speakOnDemand` internally gates by `ttsOnDemandAllowed`; the components no longer need their own gate check.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/questions/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/questions/
git commit -m "feat(questions): route onClick speech through useLifecycleTTS.speakOnDemand"
```

---

## Task 15: Wire QuestionRow + AudioButton into the three games

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
- Update their `*.test.tsx` files

- [ ] **Step 1: Write the failing test (per game)**

For each game, add a test that asserts an AudioButton is rendered when `ttsOnDemandAllowed: true`. Example for SortNumbers:

```tsx
it('renders an inline AudioButton when ttsOnDemandAllowed is true', () => {
  render(<SortNumbersWithCfg ttsOnDemandAllowed />);
  expect(
    screen.getByRole('button', { name: /hear/i }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — SortNumbers has no AudioButton today; the others may use a different layout.

- [ ] **Step 3: Replace the prompt block with QuestionRow + AudioButton**

In each game component, find the JSX block that currently renders the question (numeral, word display, or direction prompt) and wrap it:

```tsx
import { QuestionRow } from '@/components/questions';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';

// inside the JSX:
<QuestionRow
  audio={<AudioButton event="round.start" />}
  content={/* existing question content */}
/>;
```

Remove any pre-existing standalone AudioButton wiring that passed `prompt` strings — `event` carries everything now.

- [ ] **Step 4: Run tests + VR smoke**

```bash
npx vitest run src/games/word-spell src/games/number-match src/games/sort-numbers
yarn test:vr   # if Docker is available — otherwise note SKIP_VR in the commit
```

VR baselines will need updating for the layout change (Tasks 15 + 16 likely both move pixels). Update baselines after eyeballing the diff images: `yarn test:vr:update`.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/WordSpell/ src/games/number-match/NumberMatch/ src/games/sort-numbers/SortNumbers/ tests-vr/
git commit -m "feat(games): inline QuestionRow + AudioButton on word-spell, number-match, sort-numbers"
```

---

## Task 16: Rename InstructionsOverlay → GameOptionsOverlay; remove auto-speak; emit game:prepare

**REQUIRED SKILL:** `write-storybook` (the moved file gets a new title: `'AnswerGame/GameOptions/GameOptionsOverlay'`).

**Files:**

- Move: `src/components/answer-game/InstructionsOverlay/` → `src/components/answer-game/GameOptions/`
- Rename inside the directory: `InstructionsOverlay.tsx` → `GameOptionsOverlay.tsx` (plus `.test.tsx`, `.stories.tsx`)
- Move (unchanged): `useConfigDraft.ts` and `useConfigDraft.test.tsx`
- Modify (behavior): `GameOptionsOverlay.tsx` — remove the `useEffect(() => { if (ttsEnabled) speak(text); ... }, [])` block at line 173–174; replace with bus emit of `game:prepare`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx` — update import + JSX

- [ ] **Step 1: Move the files via git**

```bash
git mv src/components/answer-game/InstructionsOverlay src/components/answer-game/GameOptions
cd src/components/answer-game/GameOptions
git mv InstructionsOverlay.tsx GameOptionsOverlay.tsx
git mv InstructionsOverlay.test.tsx GameOptionsOverlay.test.tsx
git mv InstructionsOverlay.stories.tsx GameOptionsOverlay.stories.tsx
```

- [ ] **Step 2: Write the failing test (no auto-speak on mount; emits game:prepare)**

Update `GameOptionsOverlay.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameOptionsOverlay } from './GameOptionsOverlay';
import { getGameEventBus } from '@/lib/game-event-bus';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
}));
import { speak as speakMock } from '@/lib/speech/SpeechOutput';

describe('GameOptionsOverlay (renamed from InstructionsOverlay)', () => {
  beforeEach(() => speakMock.mockClear());

  it('does NOT auto-speak the how-to-play text on mount', () => {
    render(<GameOptionsOverlay text="How to play …" autoSpeak />);
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('emits game:prepare on mount', () => {
    const received: string[] = [];
    const unsub = getGameEventBus().subscribe('game:prepare', (e) =>
      received.push(e.gameId),
    );
    render(
      <GameOptionsOverlay text="How to play …" gameId="word-spell" />,
    );
    expect(received).toEqual(['word-spell']);
    unsub();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Expected: FAIL — auto-speak useEffect still fires; no `game:prepare` emit.

- [ ] **Step 4: Update GameOptionsOverlay**

In `GameOptionsOverlay.tsx`:

- Rename the exported component: `InstructionsOverlay` → `GameOptionsOverlay`.
- Delete the `useEffect` block at lines 173–174 that calls `speak(text)`.
- Add a new `useEffect(() => { ... }, [])` that emits `game:prepare`:

```tsx
useEffect(() => {
  getGameEventBus().emit({
    type: 'game:prepare',
    gameId,
    sessionId,
    profileId,
    timestamp: Date.now(),
    roundIndex: 0,
  });
}, [gameId, sessionId, profileId]);
```

- Drop the `ttsEnabled` prop (replaced by `game:prepare` flowing through `useLifecycleTTS`).
- Update the Storybook title to `'AnswerGame/GameOptions/GameOptionsOverlay'`.
- The visible content stays the same for M1 — the `text` prop still renders, but it's no longer spoken aloud unless the resolved `game:prepare` template says so.

- [ ] **Step 5: Update the route**

In `src/routes/$locale/_app/game/$gameId.tsx`, replace the `InstructionsOverlay` import at line 24 AND each of the four `<InstructionsOverlay />` JSX usages at lines 529, 676, 822, 964 (one per game: word-spell, number-match, sort-numbers, spot-all) with `<GameOptionsOverlay />`. Drop the legacy `ttsEnabled` prop from each call site (replaced by the autoSpeak/ttsOnDemandAllowed split landed in Task 5).

- [ ] **Step 6: Run tests + typecheck**

```bash
yarn typecheck
npx vitest run src/components/answer-game/GameOptions/ src/routes/$locale/_app/game/
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(answer-game): rename InstructionsOverlay → GameOptionsOverlay; remove auto-speak; emit game:prepare on mount"
```

---

## Task 17: Talkativeness preset in AdvancedConfigModal

**REQUIRED SKILL:** `write-storybook` (if the existing modal has a story, update it).

**Files:**

- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `AdvancedConfigModal.test.tsx`:

```tsx
it('renders the Talkativeness preset with Quiet/Default/Chatty', () => {
  render(<AdvancedConfigModal {...defaultProps} />);
  expect(
    screen.getByRole('radio', { name: /quiet/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /default/i })).toBeChecked();
  expect(
    screen.getByRole('radio', { name: /chatty/i }),
  ).toBeInTheDocument();
});

it('writes talkativeness to the config draft on selection', () => {
  const onChange = vi.fn();
  render(<AdvancedConfigModal {...defaultProps} onChange={onChange} />);
  fireEvent.click(screen.getByRole('radio', { name: /chatty/i }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ talkativeness: 'chatty' }),
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — no preset radio rendered.

- [ ] **Step 3: Add the Voice & Instructions section**

In `AdvancedConfigModal.tsx`, add a new section:

```tsx
<section aria-labelledby="voice-instructions-heading">
  <h3 id="voice-instructions-heading">
    {t('config.voiceAndInstructions.heading')}
  </h3>
  <fieldset>
    <legend>{t('config.voiceAndInstructions.talkativeness')}</legend>
    {(['quiet', 'default', 'chatty'] as const).map((preset) => (
      <label key={preset}>
        <input
          type="radio"
          name="talkativeness"
          value={preset}
          checked={config.talkativeness === preset}
          onChange={() =>
            onChange({ ...config, talkativeness: preset })
          }
        />
        {t(`config.voiceAndInstructions.preset.${preset}`)}
      </label>
    ))}
  </fieldset>
</section>
```

Add the corresponding i18n keys in Task 18.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/AdvancedConfigModal.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(advanced-config): add Talkativeness preset (Quiet/Default/Chatty)"
```

---

## Task 18: i18n keys (en + pt-BR)

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Add the top-level `tts` key (en/games.json)**

Add to `src/lib/i18n/locales/en/games.json`:

```jsonc
{
  // ... existing keys
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
      "round-error": {
        "brief": "Try again.",
        "full": "Try again. The word is {{word}}.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — {{word}}!",
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
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "brief": "Let's match.",
        "full": "Let's match numbers. Find the matching number for the dots.",
      },
      "round-start": {
        "brief": "Find {{count}}.",
        "full": "Find the matching number for {{count}}.",
      },
      "round-error": {
        "brief": "Try again.",
        "full": "Try again. Count the dots.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — that's {{count}}!",
      },
      "level-complete": {
        "brief": "Level complete.",
        "full": "Level complete.",
      },
      "game-over": {
        "brief": "Done.",
        "full": "Game over. Great job!",
      },
    },
    "sort-numbers": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "brief": "Let's sort.",
        "full": "Let's sort numbers. Drag them into the right order.",
      },
      "round-start": {
        "brief": "{{direction}} from {{from}} to {{to}}.",
        "full": "Sort these numbers in {{direction}} order, skip by {{step}}.",
      },
      "round-error": {
        "brief": "Not quite.",
        "full": "That's not in {{direction}} order yet. Try again.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — sorted!",
      },
      "level-complete": {
        "brief": "Level complete.",
        "full": "Level complete.",
      },
      "game-over": {
        "brief": "Done.",
        "full": "Game over. Great job!",
      },
    },
  },
}
```

Also add the Voice & Instructions form labels under an existing `config` key (or wherever AdvancedConfigModal's labels live):

```jsonc
{
  "config": {
    // ... existing keys
    "voiceAndInstructions": {
      "heading": "Voice & Instructions",
      "talkativeness": "Talkativeness",
      "preset": {
        "quiet": "Quiet",
        "default": "Default",
        "chatty": "Chatty",
      },
    },
  },
}
```

- [ ] **Step 2: Mirror in pt-BR/games.json**

Copy the same JSON structure into `src/lib/i18n/locales/pt-BR/games.json`. Values may stay as English placeholders for M1 — Portuguese translations land in a follow-up issue (open one and reference it in the commit).

- [ ] **Step 3: Run lint + typecheck**

```bash
yarn fix:md      # if any docs touched
yarn typecheck
```

Expected: PASS.

- [ ] **Step 4: Run the game in dev to verify keys resolve**

`yarn dev`, open each game with `autoSpeak: true`, confirm speech matches the registered templates.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/locales/
git commit -m "i18n: add tts.* keys for word-spell, number-match, sort-numbers + Voice & Instructions form labels"
```

---

## Task 19: Architecture docs

**REQUIRED SKILL:** `update-architecture-docs` (load before editing the `.mdx` files).

**Files:**

- Modify: `src/components/answer-game/GameEngine.flows.mdx`
- Modify: `src/components/answer-game/GameEngine.reference.mdx`
- Modify: `src/lib/game-engine/GameEngine.flows.mdx` (references `useRoundTTS` — must update post-Task 11 deletion)
- Modify: `src/lib/game-engine/debugging.mdx` (references `useRoundTTS` in the TTS-over-sound-effects debugging row and the speech-queue prose)

This task is gated by CLAUDE.md's architecture-docs policy: "When modifying game state logic — any file in `src/components/answer-game/`, `src/lib/game-engine/`, or any file matching `*reducer*`, `*dispatch*`, `*Behavior*`, `*Drag*` — update the co-located `.mdx` docs in the same PR." Tasks 5, 6, 7, 8, 11, 16 all touch those directories.

- [ ] **Step 1: Run /update-architecture-docs (or follow its skill manually)**

The skill walks through what sections need updating. Expect to cover:

- New TTS data flow (machine → `speak` action → bus → `useLifecycleTTS`)
- `GameDefinition.tts` field — how to add TTS to a new game
- `useLifecycleTTS` hook — auto vs on-demand surfaces
- The `autoSpeak` / `ttsOnDemandAllowed` flag split
- The removal of `useRoundTTS`
- The InstructionsOverlay → GameOptionsOverlay rename + behavior change

- [ ] **Step 2: Run `yarn fix:md` on the touched docs**

Run: `yarn fix:md`
Expected: clean output, no remaining markdownlint or Prettier violations.

- [ ] **Step 3: Commit**

```bash
git add src/components/answer-game/*.mdx
git commit -m "docs(architecture): document TTS lifecycle data flow + GameDefinition.tts contract"
```

---

## Self-Review Checklist (run before opening the PR)

- [ ] **Spec coverage.** Re-read spec §14 M1 acceptance criteria. Confirm each item has at least one task that implements it. Items deferred to follow-ups are listed in "Out of scope for M1" with the issue/PR they track.
- [ ] **Placeholder scan.** Search this plan for `TBD`, `TODO`, `implement later`, `similar to`. Should be zero (architecture-docs `TODO(PR …)` comments aside).
- [ ] **Type consistency.** `LifecycleEvent`, `GameTTSConfig`, `Verbosity`, `TalkativenessPreset` are defined in Task 1 and used identically throughout. `EventTemplate` shape matches `definition-types.ts:7`.
- [ ] **NumberMatch "speak the answer" bug.** Task 9 includes both the registry entry (`tts.number-match.round-start.full`) and the machine `entry: [speak]` wiring. The dev-server smoke test in Task 9 Step 6 is the user-visible acceptance gate.
- [ ] **No `useRoundTTS` survivors.** `rg useRoundTTS src/` after Task 11 returns nothing.
- [ ] **No `ttsEnabled` survivors.** `rg ttsEnabled src/` after Task 5 returns nothing (or only in migration code paths that map legacy values).
- [ ] **CLAUDE.md compliance.** `yarn fix:md` clean; Storybook titles PascalCase; full worktree paths in commit messages and PR body.
- [ ] **VR baselines.** Any layout-affecting tasks (12, 15, 16) include a `yarn test:vr:update` step with diff review.

---

## Acceptance Criteria (M1, this plan)

- [ ] `src/lib/lifecycle-tts/types.ts` exists and satisfies the forward reference at `src/lib/game-engine/definition-types.ts:8`.
- [ ] `InstructionsOverlay` → `GameOptionsOverlay` rename complete; **does not auto-speak** how-to-play on mount.
- [ ] `game:prepare` bus event added; emitted by `GameOptionsOverlay` on mount.
- [ ] `game.start` lifecycle event speaks the registered full-mode copy after "Let's go" (via the XState machine's entry action on the `playing` state — implemented per-game in Tasks 9–11).
- [ ] NumberMatch's "speak the answer" bug fixed — bare-numeral readout replaced by `tts.number-match.round-start.full` ("Find the matching number for {{count}}.").
- [ ] `ttsEnabled` removed; `autoSpeak` + `ttsOnDemandAllowed` + `gradeBand` + `talkativeness` added to `AnswerGameConfig`; migration maps legacy `ttsEnabled: false` → `autoSpeak: false, ttsOnDemandAllowed: false`.
- [ ] `AudioButton` renders when `ttsOnDemandAllowed: true`; always speaks the resolved `full` copy for its `event` prop.
- [ ] The three question components used by the XState-migrated games (TextQuestion, ImageQuestion, EmojiQuestion) honor `ttsOnDemandAllowed` via `useLifecycleTTS.speakOnDemand`. (DotGroupQuestion is a SpotAll surface and migrates with the SpotAll follow-up — see Spec Delta 1.)
- [ ] `<QuestionRow>` renders inline (icon left, content right) on all breakpoints; AudioButton ≥ 44×44 px; content wraps to extra lines.
- [ ] WordSpell, NumberMatch, SortNumbers each have an inline AudioButton via `<QuestionRow>`.
- [ ] **SpotAll deferred per Spec Delta 1** — tracked in a follow-up issue gated on PR 1d (#368).
- [ ] Talkativeness preset (Quiet / Default / Chatty) lands in `AdvancedConfigModal`.
- [ ] WordSpell, NumberMatch, SortNumbers each have a `tts:` block on their `GameDefinition`.
- [ ] i18n keys for `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*` and `config.voiceAndInstructions.*` exist in `en` and `pt-BR` (pt-BR may be English placeholders).
- [ ] `useRoundTTS` removed; all round-start auto-speech goes through the XState machine `entry` actions.
- [ ] Architecture docs (`GameEngine.flows.mdx`, `GameEngine.reference.mdx`) updated to document the new TTS data flow.

## Out of scope for M1 (deferred — tracked separately)

- SpotAll AudioButton + `speakPrompt` consolidation → follow-up tied to PR 1d (#368).
- Per-event `customConfig.events` override surface → M2.
- `LifecycleTTSExplorer.stories.tsx` registry-table viewer → M2.
- ARIA live regions for round outcomes → M2.
- `round.idle` timer + per-game predicate → M2.
- Queue policy (cancel-on-new, drop-debounce) beyond Web Speech default → M2.
- `game:resume` event emission → M2.
- `round:tts-played` SRS event emission from speakOnDemand path → M2 (SRS recorder hook).

---

**Status:** Plan ready for execution. Pick `superpowers:subagent-driven-development` (recommended — fresh subagent per task) or `superpowers:executing-plans` (inline batch). **Read the Deferred / Open Questions section below before starting — three P0 architectural calls await resolution at execution time.**

---

## Deferred / Open Questions

### From 2026-05-13 ce-doc-review

A multi-persona review (coherence, feasibility, product-lens, design-lens, scope-guardian, adversarial) surfaced findings that were deferred during the review pass. They require resolution during execution or in a follow-up review. The reviewer that surfaced each finding is noted in parentheses. Convergent findings (multiple reviewers flagged the same concern) are marked with a count.

#### P0 — implementation blockers (must resolve before or during execution)

- **P0 — `useLifecycleTTS` reads `gameDefinition` + `currentRound` from a context that doesn't expose them** (coherence + scope-guardian + feasibility + adversarial — 4-way). Task 7's hook reads `current.gameDefinition?.tts` and `current.currentRound`. `AnswerGameState` (`src/components/answer-game/types.ts:81-99`) has neither. The plan's "Pick option 1" note is prose, not a concrete sub-step; option 2's premise is false (`src/games/registry.ts` only has metadata). **Resolution at execution:** pick one of (a) mount `useLifecycleTTS` inside each game component where `gameDefinition` and `round` are in scope (recommended — avoids context surgery + sidesteps PR 1c divergence), (b) thread `gameDefinition` through `AnswerGameProvider` and update ~12 call sites. Commit the choice as a Spec Delta in the implementation PR.
- **P0 — `{{count}}` / `{{word}}` / `{{direction}}` interpolation reads `currentRound` but no machine populates `lastRoundOutput`** (adversarial). The headline NumberMatch "speak the answer" fix would render `"Find the matching number for 0"` instead of `"...for five"` — same shape as the bug it's meant to fix. Verified: `numberMatchMachine.context` (definition.ts:543-560) has no `lastRoundOutput`; round data lives in `NumberMatch.tsx:127` (`roundOrder[engineRoundIndex]`). **Resolution at execution:** if P0 above picks "mount in game component", interpolation reads `round` from the same closure that already computes it — no extra change. If P0 picks "thread through context", each of the three machines must add `assign({ lastRoundOutput: <derived> })` on `INIT_ROUND` / `ADVANCE_ROUND`.
- **P0 — Task 1 is misframed as "create types.ts"; file already exists on origin/master** (scope-guardian + adversarial — 2-way). `src/lib/lifecycle-tts/types.ts` was committed at `a653cf284` as a forward-reference pin. Contains `LifecycleEvent`, `Verbosity`, `TalkativenessPreset`, `EventTemplate` — **missing `GameTTSConfig`** that Tasks 3 and 7 import. **Resolution at execution:** restructure Task 1 as "verify-and-extend": read existing file, add single missing export `export type GameTTSConfig = Partial<Record<LifecycleEvent, EventTemplate>>`, typecheck, commit `feat(lifecycle-tts): add GameTTSConfig type for per-game registry blocks`.
- **P0 — `game.start` and `game.prepare` speech paths are unwired** (post-review spec-coverage check, 2026-05-13). Spec §14 M1 acceptance criteria #2 (`game:prepare` speaks `{{gameName}}` brief on overlay mount) and #3 (`game.start` speaks the full how-to-play after "Let's go") are both unimplementable as written. The plan adds the `game:prepare` bus event (Task 4) and emits it from `GameOptionsOverlay` (Task 16 Step 4), and i18n has `tts.<game>.game-start.full` keys (Task 18), but Task 7's `useLifecycleTTS` only subscribes to the single `lifecycle:speak` bus event — nothing translates `game:prepare` or `game:start` bus emissions into `lifecycle:speak` payloads, and no task emits `lifecycle:speak { lifecycleEvent: 'game.start' }` at any flow point (the XState machines' `playing`-state entry fires `round.start`, not `game.start`). User flow goes overlay → silence → `round.start` speech, skipping both the brief game-name cue and the full "Let's spell some words" how-to-play. The plan's own acceptance criterion that says "game.start speaks the full how-to-play copy after 'Let's go' (via the XState machine's entry action on the playing state — implemented per-game in Tasks 9–11)" is **factually wrong** — playing-state entry is `round.start`. **Resolution at execution:** pick one of (a) extend `useLifecycleTTS` to also subscribe to `game:prepare`, `game:start`, `game:end` bus events and translate each into a `speakResolved(<matching lifecycleEvent>)` call inline (smallest code change, single hook stays the integration surface); (b) have each non-machine emitter (`GameOptionsOverlay` for game.prepare, `AnswerGameProvider` for game.start) emit BOTH the original bus event AND a `lifecycle:speak` event with the matching payload (duplicates emission logic but keeps the hook simple); (c) add a dedicated bridge component (e.g. `LifecycleSpeakBridge`) mounted alongside `LifecycleTTSBridge` that listens for non-machine bus events and re-emits as `lifecycle:speak` (separation of concerns but adds a moving part). Whichever path is chosen, add an explicit task ("Wire game.start + game.prepare speech paths"), correct the misleading acceptance-criterion claim about the playing-state entry, and add a TDD test that asserts the brief speaks on overlay mount and the full how-to-play speaks after "Let's go".

#### P1 — implementability gaps (resolve during execution, document choice in PR)

- **P1 — `entry: [speak({lifecycleEvent: 'round.start'})]` on `playing` state fires on initial entry BEFORE `INIT_ROUND` populates the round** (adversarial). The machine starts in `playing` (definition.ts:542); the speak action fires the moment `actor.start()` runs, before `AnswerGameProvider`'s mount effect dispatches `INIT_ROUND`. Round 0's speech misfires with empty context. Subsequent rounds work (waitingForNext → playing re-fires entry after ADVANCE_ROUND populates zones). **Resolution:** either gate the `speak` entry on a `hasRound` guard (`always: [{ guard: 'hasRound', target: 'playing' }]`), introduce an `idle` initial state that transitions to `playing` on first `INIT_ROUND`, or runtime-check the round is ready inside the speak action provider. Add an explicit test for round 0 timing.
- **P1 — RxDB `Settings.ttsEnabled` schema migration missing** (adversarial). `src/db/schemas/settings.ts:46` declares `ttsEnabled: boolean` at schema version 3 with `additionalProperties: false`. Removing the field requires bumping `version` to 4 and adding a `migrationStrategies` entry — otherwise existing users' IndexedDB documents fail to load. Task 5's per-file checklist doesn't list `src/db/schemas/settings.ts` or `src/db/hooks/useSettings.ts`. **Resolution:** add explicit sub-task to Task 5 bumping schema version + migrationStrategies splitting `ttsEnabled` into `autoSpeak` + `ttsOnDemandAllowed` (or keeping the legacy field with `@deprecated` JSDoc + read-only consumer). Also clarify the relationship: is `Settings.ttsEnabled` the source of truth that `AnswerGameConfig.ttsEnabled` inherits, or independent?
- **P1 — `AdvancedConfigModal.onChange` is `Partial<Draft>`; Task 17 prescribes spread-the-whole-config** (feasibility). Actual signature is `(patch: Partial<Draft>) => void` (`src/components/AdvancedConfigModal.tsx:40`). All existing call sites pass single-key patches. Plan's `onChange({ ...config, talkativeness: preset })` uses a `config` variable not in scope (modal works against `Draft`, not `AnswerGameConfig`) and spreads incorrectly. **Resolution:** replace Task 17's onChange snippet with `onChange({ config: { ...value.config, talkativeness: preset } })` and confirm `Draft.config` is the right home OR extend `Draft` with a top-level `talkativeness` field.
- **P1 — `gradeBand` is added as a required field on `AnswerGameConfig` but no form input writes it** (scope-guardian). The plan adds `gradeBand: GradeBand` to the config type and defaults to `'k'` in the migration table. No UI in M1 lets the user set it. Verbosity resolution (spec §5.1) uses `gradeBand` as the discriminator — so older kids (year3-4, year5-6) get the wrong verbosity by default. **Resolution:** make `gradeBand` optional with a default inferred from the active profile's grade setting (if exists) or default to `'pre-k'` (safest — always speaks). Add an explicit note in Out-of-Scope: gradeBand write path deferred to the Profile grade feature.
- **P1 — `sessionId` / `profileId` props missing on `GameOptionsOverlay`** (design-lens + feasibility — 2-way). Task 16 Step 4 emits `game:prepare` with required `BaseGameEvent` envelope fields (`gameId, sessionId, profileId, timestamp, roundIndex`). Current `InstructionsOverlay` props (lines 87-114) have neither `sessionId` nor `profileId`. Caller at four sites in `$gameId.tsx` (lines 529, 676, 822, 964) doesn't pass them. `profileId` is hardcoded as `'default'` inside `savePlayedDraft` callbacks (lines 1228+). **Resolution:** add `sessionId: string` and `profileId: string` to `GameOptionsOverlayProps`; thread from the four route call sites; document `profileId = 'default'` as a temporary default until parent-PIN profiles ship.
- **P1 — Per-game `ConfigField` descriptors + `src/lib/config-tags.ts` not in Task 5 checklist** (design-lens + adversarial — 2-way). Each of `number-match/types.ts:138`, `sort-numbers/types.ts:168`, `word-spell/types.ts:124`, `spot-all/types.ts` exports a `*ConfigFields: ConfigField[]` array containing `{ type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' }`. `src/lib/config-tags.ts:10` has `['ttsEnabled', (v) => (v === true ? 'TTS on' : null)]` and `src/lib/config-tags.test.ts` has 5 references. None listed in Task 5's per-file checklist. **Resolution:** add to the checklist: per-game `types.ts` ConfigField arrays (replace `ttsEnabled` checkbox with `autoSpeak` + `ttsOnDemandAllowed` checkboxes + `talkativeness` select, or remove the checkbox in favor of the AdvancedConfigModal Talkativeness preset); `src/lib/config-tags.ts` + `.test.ts` (map both new fields, or remove the tag).
- **P1 — Task 5 commit size: single `git add -A` for 164 references across 85 files** (scope-guardian + feasibility — 2-way). Plan's Step 5 says "small commits per file or per logical group" but Step 7 says `git add -A`. Contradicts CLAUDE.md baby-step convention and the user's `feedback_commit_as_checkpoint` preference. **Resolution:** split Task 5 into sub-commits — (5a) types + `AnswerGameConfig`/`SpotAllConfig`, (5b) hook gates (`useGameTTS`, `useDraggableTile`), (5c) component gates (AudioButton + four question components), (5d) game runtime (NumberMatch/WordSpell/SortNumbers/SpotAll), (5e) `AdvancedConfigModal` + `ConfigFormFields`, (5f) stories + tests.
- **P1 — `AudioButton` has no specified visual state while TTS is actively speaking** (design-lens). Plan prescribes button shape + aria-label, no in-progress indicator. Pre-K/K children spam-tap when speech synthesis startup-lags, triggering interrupted overlapping speech. **Resolution:** add `speaking` state to AudioButton: read `isSpeechActive()` (already exported from `SpeechOutput.ts`) and reflect as CSS state or `aria-pressed='true'`. Document the three visual states: idle, speaking, disabled (hidden when `ttsOnDemandAllowed: false`).
- **P1 — SpotAll cross-game UX inconsistency during the M1 → PR 1d window** (product-lens). M1 ships TTS for 3 games; SpotAll continues to auto-speak the prompt on target change via its legacy `useEffect` (SpotAllPrompt.tsx:29-39). Families using the same Talkativeness preset get different chattiness across the catalog. **Resolution:** add an explicit acceptance criterion calling out the inconsistency window: "SpotAll continues to auto-speak the prompt on target change during the M1 → PR 1d window. Track in #-TBD; PR 1d must close the gap before M2 ships." Open the follow-up tracking issue before this PR merges.
- **P1 — SpotAllPrompt prop migration underspecified (autoSpeak vs ttsOnDemandAllowed split silently picked)** (product-lens). SpotAllPrompt currently reads a single `ttsEnabled` prop and gates BOTH the auto-speak `useEffect` (line 30) AND the conditional render of the tap-to-speak button (line 46). Task 5 only says "existing reducer/form continues to read these flags, just under their new names." **Resolution:** add to Task 5 Step 5 — SpotAllPrompt's `useEffect` auto-speak gate → `autoSpeak`; conditional button render at line 46 → `ttsOnDemandAllowed`; update SpotAll.tsx caller at line 158 to pass both new props.
- **P1 — Tasks 9-11 `playing` state entry should be tested for repeated fire on round-advance** (scope-guardian). `playing` is the machine's initial state AND the target of `target: 'playing'` after each round advance. The `entry: [speak]` action fires on every round (intentional, matches spec §4 "round.start fires on each roundIndex change"), but Tasks 9-11 tests only assert speak fires on `actor.start()`. **Resolution:** add a test assertion to each of Tasks 9, 10, 11: after advancing to round 2 (fire `ADVANCE_ROUND` or equivalent), confirm `speakSpy` is called again with `{ lifecycleEvent: 'round.start' }`. Also clarify in the task prose that the playing-state entry is intentionally per-round.
- **P1 — Spec Delta 1 (SpotAll deferred) contradicts Task 5 modifying SpotAll/types.ts** (coherence). Plan says SpotAll is deferred; Task 5 lists `src/games/spot-all/types.ts` as modified. Either SpotAll is in M1 (contradicts Spec Delta) or only its type changes are in scope (clarify). **Resolution:** add a note to Task 5: SpotAll's `types.ts` config-shape changes land in M1 to keep the unified TTS contract consistent; SpotAll's component wiring (AudioButton + speakPrompt consolidation) is deferred to PR 1d (#368).

#### P2 — quality / scope decisions (~12 — execution-time triage)

- **P2 — ARIA live region deferred to M2 contradicts spec §14 M1 acceptance criterion** (product-lens + design-lens — 2-way). Spec §14 line 863 lists `ARIA live region announces round outcomes independently of TTS` as an M1 criterion. Plan demotes to M2 without flagging as Spec Delta. Users with `autoSpeak: false` (Quiet preset, classroom no-audio) get no round-outcome announcement. Resolution: either promote to Spec Delta 4 with explicit acknowledgement OR add a minimal `<div role="status" aria-live="polite">` wrapper around round outcomes in the three game components.
- **P2 — Talkativeness "Default" preset semantics ambiguous in parent-facing UI** (product-lens). Default profile is empty (falls through to per-game registry). Parents see Default as a third opinionated mode but it varies per game. Resolution: add helper text `"Default uses each game's recommended verbosity for your child's grade level. Quiet reduces speech; Chatty increases it."` Add the i18n key in Task 18.
- **P2 — Per-game `definition.ts` placement (Spec Delta 2) makes cross-game tuning harder** (product-lens). Spec §13.2's `LifecycleTTSExplorer` (deferred to M2) reads from 3-4 scattered definition files instead of one registry directory. Resolution: add a sentence to Spec Delta 2 documenting the trade-off explicitly: "per-game definition.ts files become large and mix machine code with copy templates; cross-game review via LifecycleTTSExplorer in M2 will read from import statements. Acceptable because game-designer tuning is expected to be low-frequency once defaults are validated."
- **P2 — pt-BR English placeholders ship to a real locale without a tracked follow-up** (product-lens). Task 18 Step 2 says English-as-placeholder pt-BR values, "open an issue and reference it in the commit." Historically becomes "never tracked." Resolution: pre-create the i18n translation tracking issue before opening the implementation PR; reference it in the PR body's Follow-ups section.
- **P2 — `useLifecycleTTS` mounted for SpotAll has no defined behavior during M1 → PR 1d gap** (product-lens). If P0 above picks "thread through AnswerGameContext", the hook reads `current.gameDefinition?.tts` for SpotAll — but SpotAll has no `definition.ts` in M1. Plan doesn't specify what `gameDefinition` resolves to for SpotAll. Resolution: if mount-in-game-component (recommended P0 resolution), SpotAll is naturally excluded — no fix needed. If thread-through-context, accept `gameDefinition: GameDefinition | null` and short-circuit on null; PR 1d removes the null branch.
- **P2 — `gradeBand` and `talkativeness` have no UI surface in Game Options panel** (design-lens). `autoSpeak` defaults to true so OOTB works, but a parent finding the audio too chatty must discover the Talkativeness preset inside AdvancedConfigModal. Plan never describes the navigation path. Resolution: specify in Task 17 where in AdvancedConfigModal the "Voice & Instructions" section appears (top, bottom, after difficulty?), and confirm the existing gear icon in GameOptionsOverlay is the intended entry point.
- **P2 — QuestionRow stacked-layout trigger ("exceeds 3 lines on mobile") not implementable without measurement** (design-lens). Spec §9.2 says stacked layout only when single-line wrap exceeds 3 lines. CSS flex-wrap alone doesn't count visual lines. Resolution: pick (a) CSS-only via breakpoint threshold (specify the value) or (b) JS-measured via ResizeObserver. Task 12 should commit to one.
- **P2 — Talkativeness presets include events deferred to M2 (round.idle, round.celebrate, round.advance)** (scope-guardian). M1's stated goal is minimum viable copy fix. Plan ships full preset tables for events whose bus wiring is deferred. Resolution: trim preset tables to only the events that have `definition.tts` entries + active bus wiring in M1 (game.prepare, game.start, round.start, round.error, round.correct, level.complete, game.over).
- **P2 — Test snippets reference undefined helpers (TestAnswerGameProvider, emitLifecycleSpeak, makeWrapper)** (adversarial). Tasks 6/7/13/14 use helpers that don't exist; plan has a parenthetical "create inline if not present." Resolution: front-load Task 6.5 — create `src/lib/lifecycle-tts/test-utils.tsx` exporting the shared helpers; subsequent tests import from there. Or rewrite snippets to use existing `<AnswerGameProvider config={...}>` patterns.
- **P2 — `AnswerGameProvider` PR 1c divergence risk** (feasibility). Provider still uses `useReducer(answerGameReducer)`; PR 1c (#363) deletes the reducer. Task 7-8 wiring assumes the reducer-based context shape. Resolution: declare an ordering dependency in the PR — either M1 lands before PR 1c (and Task 7-8 explicitly notes a follow-up rebase) or M1 rebases on PR 1c first (and Task 7-8 specifies the post-1c surface, likely `useGameEngineContext()`).
- **P2 — Task 8 mount point ambiguous between `AnswerGameProvider` and route component** (coherence). Task 8 line 1272 says "OR" but Step 2 hard-codes the choice. Resolution: matches P0 above — pick the mount strategy explicitly (recommended: mount inside each game component per P0 resolution, which makes Task 8 unnecessary).
- **P2 — Task 14 hard-codes `speakOnDemand('round.start')` for question onClick without spec justification** (coherence). Spec doesn't prescribe which lifecycle event a question click maps to. Resolution: clarify in Task 14 Step 3 — either justify why `round.start` is correct as a re-prompt, define a new `round.explain` event, or add a comment explaining the choice.
- **P2 — ARIA live region defer is an undeclared Spec Delta** (post-review spec-coverage check, 2026-05-13). Spec §14 M1 acceptance criterion #14 (`ARIA live region announces round outcomes independently of TTS`) is demoted to M2 by the plan's "Out of scope for M1" list (line 160), but the plan's `## Spec Deltas` section only declares 3 deltas — ARIA is not among them. Users with `autoSpeak: false` (Quiet preset, classroom no-audio environment, accessibility-driven silent mode) get NO round-outcome announcement in M1 — neither spoken nor announced via assistive tech — regressing against the spec's explicit decoupling promise (§7.3: "ARIA + visual cues are independent of the TTS layer; they always run regardless of `autoSpeak` and `ttsOnDemandAllowed`"). **Resolution:** either (a) promote ARIA to Spec Delta 4 with explicit rationale in the plan's preamble (acknowledging the M1 regression for autoSpeak:false users and naming the mitigation — visual confetti + color change — as the M1 fallback), OR (b) add a minimal Task 19.5: "Wrap the round-outcome string in `<div role='status' aria-live='polite'>` in the three migrated game components" (~5 lines of JSX per game, closes the accessibility gap during M1 with no architectural cost).

#### FYI observations (5 — no action required, anchor 50)

- **FYI** — Bus singleton subscriber risk in tests/Storybook (feasibility). Multiple AnswerGameProvider renders without bus reset → multiple subscribers. Add `__resetBus` helper or `beforeEach` to test setup.
- **FYI** — `useLifecycleTTS` useEffect deps include `i18n.language` → subscription churns on language change (feasibility). Refactor to read `t`/`i18n.language` from refs to keep subscription stable.
- **FYI** — `ctxRef.current` stale-read window during synchronous XState transition (adversarial). Speech may interpolate previous round's data. Web Speech cancel-on-new masks most cases in M1; M2 queue policy handles fully.
- **FYI** — Inversion: NumberMatch fix may feel partial to SpotAll-heavy users (product-lens). M1 ships speak-the-answer fix on NumberMatch only; SpotAll's prompt continues to auto-speak. Bound the user-visible win in the PR description.
- **FYI** — Task 7 "Pick option 1" advisory tone too soft (coherence). Resolved by the P0 architectural decision above — once "mount in game component" is committed, the soft advisory disappears.

### Review provenance

- Reviewers: ce-coherence-reviewer (7 findings), ce-feasibility-reviewer (11), ce-product-lens-reviewer (8), ce-design-lens-reviewer (6), ce-scope-guardian-reviewer (6), ce-adversarial-document-reviewer (12).
- Total raw findings: 50. After cross-persona dedup + merging: ~32 unique. Applied silently (safe_auto at anchor 100): 5. Applied via walk-through (P0-1 — caller removal in Tasks 9-11): 1. Deferred to this section: ~26 actionable + 5 FYI.
- Critical convergences: (1) `gameDefinition` / `currentRound` context wiring (4-way), (2) Task 5 ttsEnabled scope (3-way: 164 refs / 85 files / `git add -A` violation), (3) SpotAll scope underspecification (multi-way), (4) `sessionId` / `profileId` props missing (2-way), (5) per-game `ConfigField` descriptors gap (2-way), (6) ARIA live region defer (2-way), (7) `types.ts` exists / `GameTTSConfig` missing (2-way, verified).

<!-- markdownlint-disable MD060 -->

# Lifecycle TTS XState — Spec 1a Revised

> **Spec ID:** `2026-05-16-lifecycle-tts-xstate`
> **Issue:** [#365 — M1 TTS lifecycle (XState rewrite)](https://github.com/leocaseiro/base-skill/issues/365)
> **Supersedes:** [`2026-05-03-instructions-tts-lifecycle-design.md`](2026-05-03-instructions-tts-lifecycle-design.md) (pre-XState design) and the in-flight plan [#374](https://github.com/leocaseiro/base-skill/pull/374) which will be closed without merge.
> **Related:** PR 1a [#354](https://github.com/leocaseiro/base-skill/pull/354) (game engine, merged), [#229](https://github.com/leocaseiro/base-skill/issues/229) (Instructions + TTS umbrella), [SRS v1 spec](2026-05-01-srs-v1-design.md) (parallel — shares bus events), [#257](https://github.com/leocaseiro/base-skill/issues/257) (`useGameRound` extraction + bus namespace).
> **Status:** Draft. Ready for `ce-doc-review`.

## 1. Summary

Replace the ad-hoc speech model (component-local `SpeechSynthesisUtterance` calls, per-tree hooks, direct `playSound()` dispatches) with a **single XState actor that owns all game audio** — both text-to-speech (TTS) and sound effects (SFX) — coordinated through the existing `GameEventBus`.

Five user-visible shifts in M1:

1. **Rename** `InstructionsOverlay` → `GameOptionsOverlay`. The renamed panel **does not auto-speak how-to-play** on mount; it emits a brief `game.prepare` event instead.
2. **`ttsEnabled` flag splits** into a single user-facing **Talkativeness slider** (`on-demand | helpful | chatty`) and a separate **`processLocally`** privacy toggle.
3. **Fix NumberMatch's bare-numeral speech bug** by routing through registry-backed instructional templates (`"Find the matching number for {{count}}."`).
4. **Add a `<QuestionRow>`** layout primitive (speaker-icon left, question text right) used by all four games.
5. **Centralize Chrome speech-synthesis workarounds** (keepalive timer, end-event watchdog, `voiceschanged` cache, rAF cancel guard) in one `WebSpeechSpeaker` adapter.

The infrastructure shift underneath:

- **Singleton XState actor** at the React Provider root — solves the "multiple `useLifecycleTTS` instances cause N-fold speech repetition" class of bugs that plan-365's adversarial review flagged.
- **Two parallel sub-machines** (speech + SFX) — independent channels that overlap or sequence per per-event mode.
- **Priority + throttle queue** for speech; throttle-only for SFX.
- **Bus pub/sub for lifecycle events** (engine-emitted); **direct `useLifecycleTts()` send** for UI-tap actions.
- **`lifecycle.tts.played` event** for state-machine flow control (game machines can gate transitions on speech completion — enables Spec 1b's phoneme explain sequence without further engine churn).
- **Same speak/played events drive UI animation** via a `subject` payload field — highlight tiles in sync with speech.

Audience: **parents** and **teachers** for configuration; **game designers** for code-only template overrides.

## 2. Goals & Non-Goals

### Goals

- Move instructional speech _inside_ the game (after "Let's go"), not on the pre-game panel.
- Centralize all game audio (TTS + SFX) through one XState actor so coordination is deterministic.
- Let parents control verbosity via a single slider, with code-only per-event overrides for game designers.
- Make in-round on-demand speech a reliable "explain-it-again" affordance.
- Keep every TTS playback observable for SRS via bus events.
- Eliminate the "restart Chrome" speech freeze that current production hits.

### Non-Goals (deferred)

| Item                                                                      | Lands in                   |
| ------------------------------------------------------------------------- | -------------------------- |
| WordSpell phoneme speech (letter names → phonemes)                        | **Spec 1b**                |
| Round-end phoneme-by-phoneme explain sequence with tile highlights        | **Spec 1b**                |
| How-to-play tour overlay                                                  | **Spec 2**                 |
| Persistent `?` help icon                                                  | **Spec 2**                 |
| Skin TTS overrides (`GameSkin.tts?`)                                      | **M3 + first themed skin** |
| Free-text `customConfig.tts?` UI                                          | **M3 + #230**              |
| Real mini-game machines (DinoEggHatch, FireworksPainter, BubblePop, etc.) | **PR 1b+**                 |
| `CelebrationHost` engine-mounted overlay                                  | **PR 1c+**                 |
| Per-event verbosity matrix per gradeBand (Quiet/Default/Chatty profiles)  | **M2**                     |
| `LifecycleTTSExplorer` Storybook for designer review                      | **M2**                     |
| pt-BR translation pass (fallback to en in M1)                             | **Follow-up PR**           |
| Rate/pitch sliders for speech                                             | **M2+**                    |
| Pre-synthesized MP3 fallback for offline                                  | **M3+**                    |
| Cross-tab muting via `BroadcastChannel`                                   | **Backlog**                |
| Composition layer (`parent()` / `event()` template helpers)               | **M3**                     |

## 3. Architecture Overview

### 3.1 The three ingress paths

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     GameEventBus (existing, master)                      │
│                                                                          │
│   ┌───────────────────────────────┐    ┌──────────────────────────────┐ │
│   │ Path A — Engine-emitted       │    │ Path B — UI lifecycle moment │ │
│   │                               │    │                              │ │
│   │ Game machine state.entry      │    │ Component useEffect          │ │
│   │   → SideEffect 'speak'        │    │   → bus.emit('lifecycle.speak') │
│   │   → executeSideEffects()      │    │                              │ │
│   │   → bus.emit('lifecycle.speak') │  │                              │ │
│   └───────────┬───────────────────┘    └──────────────┬───────────────┘ │
│               │                                       │                  │
│               └───────────────┬───────────────────────┘                  │
│                               ▼                                          │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │  Subscribers (each independent):                              │     │
│   │    • LifecycleTtsProvider → relays to actor as SPEAK_AUTO     │     │
│   │    • SRS recorder        → counts plays                       │     │
│   │    • Analytics / debug   → telemetry                          │     │
│   └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘

       ┌───────────────────────────────────────────────────────────────┐
       │ Path C — UI user action (speaker button tap, NOT via bus)     │
       │                                                                │
       │   Component onClick                                            │
       │     → useLifecycleTts().send({ type: 'SPEAK_USER', ... })       │
       │     → actor receives directly (bus uninvolved, SRS uninvolved)  │
       └───────────────────────────────────────────────────────────────┘
                                  │
                                  ▼

                  ┌──────────────────────────────────────┐
                  │      lifecycleTtsMachine actor       │
                  │      (singleton, parallel states)    │
                  │                                       │
                  │  ┌──────────────┐  ┌──────────────┐  │
                  │  │ Speech       │  │ SoundEffect  │  │
                  │  │  idle ↔      │  │  idle ↔      │  │
                  │  │  speaking    │  │  playing     │  │
                  │  └──────┬───────┘  └──────┬───────┘  │
                  └─────────┼─────────────────┼──────────┘
                            ▼                 ▼
                    ┌────────────────┐ ┌──────────────────────┐
                    │ WebSpeech-     │ │ HtmlAudio-           │
                    │  Speaker       │ │  SoundEffectPlayer   │
                    │  (speechSynth) │ │  (<audio> element)    │
                    └────────────────┘ └──────────────────────┘
```

### 3.2 Bus rationale (kept under XState)

The bus is **not** pre-XState legacy. It serves the **broadcast-to-N-subscribers** pattern: when a game machine fires `round.correct`, the audio actor, SRS recorder, and future analytics all care. Each consumer subscribes independently — the game machine doesn't grow a reference per consumer.

XState's `sendTo` / `spawn` / `invoke` solves a different problem: **point-to-point** coordination between actors that know about each other. Inside the audio actor, the Speaker is invoked via `invoke`. Settings flow in via `sendTo`. These are point-to-point.

**Rule:** any lifecycle event consumed by 2+ subsystems flows through the bus. Actor-to-actor or UI-to-actor calls use XState directly.

### 3.3 Why singleton actor

`useLifecycleTTS` as a per-tree hook (the pre-XState design) had four review-flagged failure modes:

| Class                               | Failure                                             | Singleton actor's answer                             |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Multi-instance speech repetition    | Each consumer hook registers its own bus subscriber | One Provider, one subscription, one queue            |
| Provider-context unavailable        | Hook called outside engine context throws           | Actor's own Provider — no engine dependency          |
| Subscription churn on config change | `useEffect` dep array recreates handler             | Settings flow via `SETTINGS_CHANGED` event, no churn |
| Two emit paths (`speakAuto` + bus)  | Duplicate logic, divergence risk                    | One bus path for auto; one direct path for user-tap  |

## 4. Lifecycle Event Taxonomy

### 4.1 The 17 events

```ts
// src/lib/lifecycle-tts/types.ts
export type LifecycleEvent =
  // Game-level
  | 'game.prepare' // Game Options panel mount
  | 'game.start' // "Let's go" tapped, engine mount
  | 'game.resume' // Browser refresh / return-to-tab into active session
  | 'game.end' // Game over (renamed from canon's 'game.over')
  // Round-level
  | 'round.start' // First round mount and on each roundIndex change
  | 'round.idle' // Per-game timeout, kid is stuck
  | 'round.error' // Definitive round failure
  | 'round.correct' // Round won
  | 'round.celebrate' // Post-correct, pre-advance (slot for celebrations; M2+ usage)
  | 'round.advance' // Moving to next round
  | 'level.complete' // Level boundary
  // Turn-level
  | 'turn.error' // Single wrong tap/keypress within a round
  | 'turn.correct' // Single right tap/keypress within a round
  | 'turn.action' // Tile pickup/place — interaction feedback, SFX only
  // Mini-game-level (reserved in M1, fired in PR 1b+)
  | 'mini-game.start'
  | 'mini-game.complete'
  | 'mini-game.skip';
```

### 4.2 Event semantics + trigger points

| Event                | Trigger                                                      | Default priority | Default speech throttle (ms) | Default SFX throttle (ms) |
| -------------------- | ------------------------------------------------------------ | ---------------- | ---------------------------- | ------------------------- |
| `game.prepare`       | `GameOptionsOverlay` mount                                   | 2                | 0                            | —                         |
| `game.start`         | Game machine `loading.entry`                                 | 2                | 0                            | —                         |
| `game.resume`        | `AnswerGameProvider` remount-into-active-session detection   | 2                | 0                            | —                         |
| `game.end`           | Engine `gameOver.entry`                                      | 3                | 0                            | —                         |
| `round.start`        | `playingRound.entry`                                         | 2                | 0                            | —                         |
| `round.idle`         | gradeBand timer fires in `playingRound` (8s pre-K, 12s y1-2) | 2                | 0                            | —                         |
| `round.error`        | `ROUND_FAILED` transition action (definitive)                | 2                | 1500                         | 400                       |
| `round.correct`      | `ROUND_CORRECT` transition action                            | 3                | 0                            | 400                       |
| `round.celebrate`    | (Reserved — M1 doesn't fire; M2+ fires on celebration entry) | 3                | 0                            | 0                         |
| `round.advance`      | `ADVANCE_ROUND` transition action                            | 2                | 0                            | —                         |
| `level.complete`     | `levelTransition.entry`                                      | 3                | 0                            | —                         |
| `turn.error`         | Wrong tap/keypress (every occurrence within a round)         | 1                | 800                          | 150                       |
| `turn.correct`       | Right tap/keypress                                           | 2                | 400                          | 100                       |
| `turn.action`        | Tile pickup/place (every drag interaction)                   | 0                | 0 (no speech)                | 50                        |
| `mini-game.start`    | (Reserved — PR 1b+ when first mini-game lands)               | 2                | 0                            | 0                         |
| `mini-game.complete` | (Reserved)                                                   | 2                | 0                            | 0                         |
| `mini-game.skip`     | (Reserved)                                                   | 1                | 0                            | 0                         |

Priorities and throttles are overridable per game/skin/customConfig via the same resolution chain as templates (see §9.2).

### 4.3 Bus event additions

```ts
// src/types/game-events.ts (additive)
export interface LifecycleSpeakEvent extends BaseGameEvent {
  type: 'lifecycle.speak';
  lifecycleEvent: LifecycleEvent;
  subject?: string | number; // optional ID for animation matching (e.g. tileId)
}

export interface LifecycleTtsPlayedEvent extends BaseGameEvent {
  type: 'lifecycle.tts.played';
  lifecycleEvent: LifecycleEvent;
  subject?: string | number;
  source: 'auto' | 'user';
  variant: Talkativeness;
  durationMs: number;
}

export interface LifecycleCancelEvent extends BaseGameEvent {
  type: 'lifecycle.cancel';
}
```

The `subject` field enables UI animation sync (§10.3): emitters set it to identify the visual target (`tileId`, `phonemeKey`, `wordIndex`); UI subscribers match on it to highlight/un-highlight.

### 4.4 Bus event naming — dot-style locked

All bus event types use dots, not colons. Refactor in commits 1–4 of PR B (§11.4):

- `game:start` → `game.start`
- `game:end` → `game.end`
- `game:round-advance` → `game.round-advance`
- `celebration:start` → `celebration.start`
- `lifecycle:speak` → `lifecycle.speak`
- `round:shown` (#257) → `round.shown`

`bus.subscribe('game:*')` wildcard becomes `bus.subscribe('game.*')`. The `*` semantics survive.

## 5. Settings Model + Talkativeness + Gates

### 5.1 Settings shape

```ts
// src/lib/settings/types.ts (additive)
export type Talkativeness = 'on-demand' | 'helpful' | 'chatty';

export interface AudioSettings {
  /** Single user-facing control. Drives autoSpeak + variant resolution. */
  talkativeness: Talkativeness;
  /** Locale for voice selection. Falls back to Settings.activeLanguage. */
  voiceLocale?: string;
  /** Optional specific voice resolved via getVoices() at speak time. */
  voiceName?: string;
  /** Speech volume 0..1. Threaded per-utterance from settings. */
  voiceVolume: number;
  /** SFX volume 0..1. Threaded per-play. */
  soundEffectsVolume: number;
  /** Privacy: when true, filter voices to localService === true only. */
  processLocally: boolean;
}

export interface Settings {
  activeLanguage: string; // existing — default 'en-AU'
  audio: AudioSettings;
  // ... other existing fields
}
```

### 5.2 Defaults

```ts
export const defaultAudioSettings: AudioSettings = {
  talkativeness: 'helpful', // safe middle
  voiceLocale: undefined, // → activeLanguage → 'en-AU'
  voiceName: undefined, // → first local voice for the locale
  voiceVolume: 0.8,
  soundEffectsVolume: 0.8,
  processLocally: true, // privacy-safe default
};
```

### 5.3 What each `Talkativeness` value means

- `'on-demand'` — `autoSpeak: false`, variant `'on-demand'`. Game stays silent. Speaker button still works.
- `'helpful'` — `autoSpeak: true`, variant `'helpful'`. Game reads the question + brief confirmations.
- `'chatty'` — `autoSpeak: true`, variant `'chatty'`. Game gives full encouragement + verbose context.

`autoSpeak` is **derived**, not stored: `autoSpeak = talkativeness !== 'on-demand'`. The two flags can't drift apart.

**Speaker taps default to `'helpful'` variant** (the helpful template is the right balance for an explicit "say it again" tap). Games can override per tap via `useSpeakButton({ variant })` — the escalation pattern (3 helpful taps + 1 chatty after idle or after N errors) is **game-level state**, not actor state.

### 5.4 No hard-mute

The OS volume slider is the escape hatch for "completely silent." We do not model `(autoSpeak: false, ttsOnDemandAllowed: false)` as a distinct setting. Speaker taps always play; the tooltip on the Talkativeness slider explains.

### 5.5 Reactivity — actor receives `SETTINGS_CHANGED`

Single subscription wired in the Provider relays settings changes:

```tsx
useEffect(() => {
  return settingsStore.subscribe((settings) => {
    actorRef.send({ type: 'SETTINGS_CHANGED', settings });
  });
}, [actorRef]);
```

No subscription churn — the actor's settings live in machine context, not in a hook's dep array. Eliminates plan-365's P2 "bus subscription churns on every config change" finding.

### 5.6 Talkativeness change mid-flight

| Transition                       | Behavior                                                          |
| -------------------------------- | ----------------------------------------------------------------- |
| `helpful → chatty` or vice versa | Cancel current; re-fire same event with new variant; drop queue.  |
| Any → `on-demand`                | Cancel current; do NOT re-fire (silence is the goal); drop queue. |
| `on-demand → helpful` / `chatty` | Nothing playing. Future events use new variant.                   |

`SPEAK_USER` utterances in flight finish as-is — the caller passed an explicit variant; settings shouldn't override it retroactively.

### 5.7 `processLocally` privacy semantics

- `voice.localService === true` → voice operates entirely on-device.
- `voice.localService === false` → voice may route audio data to a cloud TTS service (Google, Microsoft, etc.).
- `processLocally: true` filters the voice picker to local-only voices.
- `processLocally: false` shows all voices (after privacy modal confirmation).

The `localService` field is **browser-reported and not fully reliable** across browsers — some over-report or under-report. The setting is **best-effort privacy**, not a guarantee. Modal copy explicitly acknowledges this.

### 5.8 RxDB schema migration v3 → v4

```ts
// src/db/schemas/settings.ts
version: 4,
properties: {
  // ... existing
  talkativeness:  { type: 'string', enum: ['on-demand', 'helpful', 'chatty'] },
  processLocally: { type: 'boolean' },
  voiceLocale:    { type: 'string' },
  // ttsEnabled removed — see migration
}

migrationStrategies: {
  4: (oldDoc) => ({
    ...oldDoc,
    talkativeness: oldDoc.ttsEnabled === false ? 'on-demand' : 'helpful',
    processLocally: true,
    voiceLocale: undefined,
    ttsEnabled: undefined, // drop
  }),
}
```

Existing users with `ttsEnabled: false` migrate to `talkativeness: 'on-demand'` (preserves silence intent; taps still work). Migration test mirrors `src/db/migrations/word-spell-multi-level.collection.test.ts`.

## 6. XState Machine + Queue Policy

### 6.1 Two parallel sub-machines

```ts
// src/lib/lifecycle-tts/machine.ts
import { setup, fromPromise, assign } from 'xstate';

export const lifecycleTtsMachine = setup({
  types: {} as {
    context: TtsContext;
    input: { settings: Settings };
    events:
      | { type: 'SPEAK_AUTO'; event: LifecycleEvent; payload: SpeakPayload; subject?: string | number }
      | { type: 'SPEAK_USER'; event: LifecycleEvent; payload: SpeakPayload; variant: Talkativeness; subject?: string | number }
      | { type: 'SETTINGS_CHANGED'; settings: Settings }
      | { type: 'CANCEL' };
  },
  actors: {
    speaker: fromPromise<void, SpeechUtterance>(async ({ input }) => speakerAdapter.speak(input)),
    soundEffectPlayer: fromPromise<void, SoundEffectRequest>(async ({ input }) => soundEffectAdapter.play(input)),
  },
  guards: {
    autoAllowed: ({ context }) => context.settings.audio.talkativeness !== 'on-demand',
    speechNotThrottled: ({ context, event }) => /* see §6.4 */,
    sfxNotThrottled: ({ context, event }) => /* see §6.4 */,
    hasQueuedSpeech: ({ context }) => context.queuedSpeech !== null,
    speechHasBinding: ({ context, event }) => /* resolved binding has tts != null */,
    sfxHasBinding: ({ context, event }) => /* resolved binding has soundEffect != null */,
  },
}).createMachine({
  id: 'lifecycleTts',
  context: ({ input }) => ({
    settings: input.settings,
    currentSpeech: null,
    queuedSpeech: null,
    currentSoundEffect: null,
    lastSpeechEnqueueAt: {},
    lastSoundEffectAt: {},
  }),
  type: 'parallel',
  states: {
    speech: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            SPEAK_AUTO: { guard: 'autoAllowed', actions: 'resolveAndDispatchSpeech', target: 'speaking' },
            SPEAK_USER: { actions: 'resolveAndDispatchSpeech', target: 'speaking' },
          },
        },
        speaking: {
          invoke: {
            src: 'speaker',
            input: ({ context }) => context.currentSpeech!,
            onDone: [
              { guard: 'hasQueuedSpeech', actions: ['emitTtsPlayed', 'promoteQueued'], target: 'speaking', reenter: true },
              { actions: ['emitTtsPlayed', 'clearSpeech'], target: 'idle' },
            ],
            onError: { actions: 'clearSpeech', target: 'idle' },
          },
          on: {
            SPEAK_AUTO: { actions: 'resolveAndDispatchSpeech' /* may preempt or queue per §6.4 */ },
            SPEAK_USER: { actions: ['cancelSpeech', 'resolveAndDispatchSpeech'], target: 'speaking', reenter: true },
            CANCEL: { actions: ['cancelSpeech', 'clearSpeech'], target: 'idle' },
          },
        },
      },
    },
    soundEffect: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            SPEAK_AUTO: { guard: 'sfxHasBinding', actions: 'dispatchSoundEffect', target: 'playing' },
            SPEAK_USER: { guard: 'sfxHasBinding', actions: 'dispatchSoundEffect', target: 'playing' },
          },
        },
        playing: {
          invoke: {
            src: 'soundEffectPlayer',
            input: ({ context }) => context.currentSoundEffect!,
            onDone: { actions: 'clearSoundEffect', target: 'idle' },
            onError: { actions: 'clearSoundEffect', target: 'idle' },
          },
          on: {
            SPEAK_AUTO: { guard: 'sfxBindingAndNotThrottled', actions: ['cancelSoundEffect', 'dispatchSoundEffect'], target: 'playing', reenter: true },
            SPEAK_USER: { guard: 'sfxHasBinding', actions: ['cancelSoundEffect', 'dispatchSoundEffect'], target: 'playing', reenter: true },
            CANCEL: { actions: ['cancelSoundEffect', 'clearSoundEffect'], target: 'idle' },
          },
        },
      },
    },
  },
  on: {
    SETTINGS_CHANGED: { actions: 'handleSettingsChange' },
  },
});
```

### 6.2 Why parallel sub-machines

- **Independent channels**: speech doesn't block SFX, SFX doesn't block speech.
- **Per-event `mode: 'parallel' | 'sequenced'`** governs whether the channels coordinate for that event. Implementation: sequenced mode emits an internal event when SFX finishes; speech action waits for it before firing.
- **No-overlap enforcement is automatic within each channel** by the state machine — never two simultaneous speech utterances; never two simultaneous SFX.

### 6.3 Single-current + single-queued speech slot

Speech has **one current + at most one queued** utterance:

- `idle` → play immediately.
- `speaking`, queue empty → enqueue (waits for current to finish).
- `speaking`, queue full, same priority → replace queued slot (latest within-priority wins for same event type).
- `speaking`, queue full, higher priority → replace current — cancel and play new.

`SPEAK_USER` always preempts (cancels current, drops queue, plays now).

SFX has **no queue** — only throttle. Latest SFX request within throttle window is dropped; outside the window, it cancels the current SFX and plays new.

### 6.4 Replace policy (speech) with priority + throttle

```ts
export const eventPriority: Record<LifecycleEvent, number> = {
  'turn.action': 0,
  'turn.error': 1,
  'mini-game.skip': 1,
  'round.error': 2,
  'round.start': 2,
  'round.idle': 2,
  'round.advance': 2,
  'turn.correct': 2,
  'game.prepare': 2,
  'game.start': 2,
  'game.resume': 2,
  'mini-game.start': 2,
  'mini-game.complete': 2,
  'round.correct': 3,
  'round.celebrate': 3,
  'level.complete': 3,
  'game.end': 3,
};

export const speechThrottleMs: Record<LifecycleEvent, number> = {
  'turn.action': 0,
  'turn.error': 800,
  'turn.correct': 400,
  'round.error': 1500,
  'round.idle': 0,
  // remaining events: 0
} as const satisfies Record<LifecycleEvent, number>;

export const soundEffectThrottleMs: Record<LifecycleEvent, number> = {
  'turn.action': 50,
  'turn.error': 150,
  'turn.correct': 100,
  'round.error': 400,
  'round.correct': 400,
  // remaining events: 0
} as const satisfies Record<LifecycleEvent, number>;
```

`resolveAndDispatchSpeech` algorithm:

1. Look up `lastSpeechEnqueueAt[event]`. If `now - last < speechThrottleMs[event]`, drop.
2. Compute incoming priority.
3. If `incoming.priority > current.priority` → cancel current, set current = incoming, drop queued.
4. Else if `incoming.priority > queued?.priority` → replace queued.
5. Else if `incoming.priority === queued?.priority && same event type` → replace queued.
6. Else → drop incoming.
7. Update `lastSpeechEnqueueAt[event] = now`.

`SPEAK_USER` skips priority comparison: always preempts, always uses caller's variant.

### 6.5 Worked example — 5 rapid `turn.error`, then `round.correct`

Chatty mode, WordSpell:

```text
t=0     turn.error #1   → current = error #1, plays. lastSpeechEnqueueAt['turn.error'] = 0
t=200   turn.error #2   → 200 - 0 < 800, throttled, dropped.
t=450   turn.error #3   → 450 - 0 < 800, dropped.
t=700   turn.error #4   → dropped.
t=900   turn.error #5   → dropped.
t=1500  round.correct   → priority(3) > current.priority(1) → cancel current, play.
                            "Hmm, not quite. Try again." cut off; "Yes — frog!" plays.
```

User hears **one** error speech (interrupted), then **one** correct speech. The four duplicate errors silently drop. The desired UX from your scenario description.

### 6.6 Settings-change drain rule

On `SETTINGS_CHANGED` where `talkativeness` actually changes:

1. If `currentSpeech.source === 'auto'`:
   - Cancel current speech.
   - If new talkativeness !== `'on-demand'`: re-fire `SPEAK_AUTO` with same event + payload + subject (new variant resolves from new settings).
2. If `currentSpeech.source === 'user'`: let it finish (caller's variant choice is sacred).
3. Drop queued speech in all cases (stale variant).

### 6.7 `lifecycle.tts.played` emission

After each successful speaker resolve, the actor emits on the bus:

```ts
bus.emit({
  type: 'lifecycle.tts.played',
  lifecycleEvent: utterance.event,
  subject: utterance.subject,
  source: utterance.source, // 'auto' | 'user'
  variant: utterance.variant,
  durationMs: now - utterance.enqueuedAt,
  gameId,
  sessionId,
  profileId,
  roundIndex,
  timestamp: now,
});
```

This signal lets game machines gate transitions on speech completion (§10.2) and lets UI animations un-highlight in sync (§10.3). SRS records every `tts.played` as an attempt-context signal.

## 7. Speaker + SoundEffectPlayer Adapters

### 7.1 Adapter interfaces

```ts
// src/lib/lifecycle-tts/speaker.ts
export interface Speaker {
  speak(utterance: SpeechUtterance): Promise<void>; // resolves on natural end
  cancel(): void; // sync; rejects in-flight promise with 'cancelled'
  updateSettings(next: AudioSettings): void; // for voice + volume changes
  dispose(): void; // cleanup timers + listeners
}

// src/lib/lifecycle-tts/sound-effect-player.ts
export interface SoundEffectPlayer {
  play(req: SoundEffectRequest): Promise<void>; // resolves on audio 'ended'
  cancel(): void; // stops current; rejects in-flight
}

export interface SoundEffectRequest {
  key: SoundKey; // matches AudioFeedback's SoundKey
  volume: number; // 0..1, threaded from settings per-call
}
```

### 7.2 `WebSpeechSpeaker` — Chrome workarounds and watchdogs

```ts
// src/lib/lifecycle-tts/web-speech-speaker.ts
const SPEECH_WATCHDOG_MS = 30_000;
const KEEPALIVE_INTERVAL_MS = 10_000;

export class WebSpeechSpeaker implements Speaker {
  private synth: SpeechSynthesis = window.speechSynthesis;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentResolve: (() => void) | null = null;
  private currentReject: ((err: Error) => void) | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval>;
  private settings: AudioSettings;

  constructor(settings: AudioSettings) {
    this.settings = settings;
    this.warmVoiceCache();
    this.keepaliveTimer = setInterval(
      () => this.tickKeepalive(),
      KEEPALIVE_INTERVAL_MS,
    );
  }

  updateSettings(next: AudioSettings) {
    this.settings = next;
  }

  private tickKeepalive() {
    // Workaround for Chromium issue 40747712: speechSynthesis worker is GC'd
    // after ~15s, freezing all subsequent speak() calls. Periodic pause+resume
    // keeps it warm. Costs nothing if not speaking.
    if (this.synth.speaking) {
      this.synth.pause();
      this.synth.resume();
    }
  }

  speak(utterance: SpeechUtterance): Promise<void> {
    this.cancel(); // always own the channel
    if (this.synth.paused) this.synth.resume(); // un-stick Chrome if needed

    return new Promise<void>((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(utterance.text);
      const voice = this.pickVoice(
        utterance.locale,
        utterance.voiceName,
      );
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang; // REQUIRED on Chrome Android — voice alone is not enough
      } else {
        u.lang = utterance.locale;
      }
      u.volume = this.settings.voiceVolume;
      u.rate = 1;
      u.pitch = 1;
      u.onend = () => this.finalize(resolve);
      u.onerror = (e) =>
        this.finalize(() =>
          reject(new Error(e.error ?? 'speech-error')),
        );

      this.currentUtterance = u;
      this.currentResolve = resolve;
      this.currentReject = reject;

      requestAnimationFrame(() => {
        if (this.currentUtterance !== u) return; // cancelled in the meantime
        this.synth.speak(u);
        this.watchdogTimer = setTimeout(() => {
          this.finalize(() => reject(new Error('speech-timeout')));
          this.synth.cancel();
        }, SPEECH_WATCHDOG_MS);
      });
    });
  }

  cancel(): void {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
    if (!this.currentUtterance) {
      this.synth.cancel(); // defensive — clear stale browser-side queue
      return;
    }
    this.currentUtterance.onend = null;
    this.currentUtterance.onerror = null;
    const reject = this.currentReject;
    this.currentUtterance = null;
    this.currentResolve = null;
    this.currentReject = null;
    this.synth.cancel();
    if (reject) reject(new Error('cancelled'));
  }

  private finalize(done: () => void) {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
    this.currentUtterance = null;
    this.currentResolve = null;
    this.currentReject = null;
    done();
  }

  dispose() {
    clearInterval(this.keepaliveTimer);
    this.cancel();
  }

  private warmVoiceCache() {
    const load = () => {
      const voices = safeGetVoices(this.synth); // existing util src/lib/speech/safe-get-voices.ts
      this.voiceCache.clear();
      voices.forEach((v) =>
        this.voiceCache.set(`${v.lang}::${v.name}`, v),
      );
    };
    load();
    this.synth.addEventListener('voiceschanged', load);
  }

  private pickVoice(
    locale: string,
    voiceName: string | undefined,
  ): SpeechSynthesisVoice | undefined {
    const candidates = [...this.voiceCache.values()].filter((v) =>
      this.settings.processLocally ? v.localService === true : true,
    );
    if (voiceName) {
      const exact = candidates.find(
        (v) =>
          v.name === voiceName &&
          v.lang.startsWith(locale.split('-')[0]),
      );
      if (exact) return exact;
    }
    return (
      candidates.find((v) => v.lang === locale) ??
      candidates.find((v) => v.lang.startsWith(locale.split('-')[0]))
    );
  }
}
```

Browser-quirk mitigations summary:

- Chromium 40747712 — synth freezes after ~15s → `tickKeepalive()` pause+resume every 10s while speaking.
- Chrome Android — `voice` alone doesn't apply locale → `u.lang = voice.lang` always set when voice is picked.
- `onend` never fires on some Linux/Chrome builds → `SPEECH_WATCHDOG_MS = 30000` force-finalize timer.
- Chrome — cancel→speak too fast silently drops → `requestAnimationFrame` defers `synth.speak()` one frame.
- `getVoices()` returns `[]` before `voiceschanged` → `warmVoiceCache()` + `voiceschanged` listener via `safeGetVoices`.
- iOS Brave returns broken voice objects → `safeGetVoices()` filters them (already on master).
- Stale handlers fire after unmount → `finalize()` clears all listeners; `dispose()` clears keepalive.

### 7.3 `HtmlAudioSoundEffectPlayer`

```ts
// src/lib/lifecycle-tts/html-audio-sound-effect-player.ts
import { SOUND_PATHS, SoundKey } from '@/lib/audio/AudioFeedback'; // reuse path map only

export class HtmlAudioSoundEffectPlayer implements SoundEffectPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private currentReject: ((err: Error) => void) | null = null;

  play(req: SoundEffectRequest): Promise<void> {
    this.cancel();
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(SOUND_PATHS[req.key]);
      audio.volume = req.volume;
      this.currentAudio = audio;
      this.currentReject = reject;
      const cleanup = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentReject = null;
        }
      };
      audio.addEventListener(
        'ended',
        () => {
          cleanup();
          resolve();
        },
        { once: true },
      );
      audio.addEventListener(
        'error',
        () => {
          cleanup();
          reject(new Error('sfx-error'));
        },
        { once: true },
      );
      void audio.play().catch((err) => {
        cleanup();
        reject(
          err instanceof Error ? err : new Error('sfx-play-rejected'),
        );
      });
    });
  }

  cancel(): void {
    if (!this.currentAudio) return;
    this.currentAudio.pause();
    this.currentAudio.currentTime = 0;
    const reject = this.currentReject;
    this.currentAudio = null;
    this.currentReject = null;
    if (reject) reject(new Error('cancelled'));
  }
}
```

Reuses `SOUND_PATHS` map from `src/lib/audio/AudioFeedback.ts` as the single source of truth for SFX asset paths. Does not reuse `playSound` / `queueSound` — those have wrong promise semantics (resolves on start, not end) and limited cancel control. The legacy functions get `@deprecated` JSDoc + dev-mode `console.warn` so no new callers slip in.

### 7.4 Volume threading

Two volumes, two paths. Both flow through `SETTINGS_CHANGED` into the actor.

- **Speech volume**: applied at `speak()` time (`u.volume = settings.voiceVolume`). Web Speech API doesn't support live volume change for in-flight utterances. Next utterance picks up new volume.
- **SFX volume**: passed per-call in `SoundEffectRequest`. `<audio>` element supports live volume changes (`audio.volume = newVolume`) for in-flight SFX — but most SFX clips are short enough (<1.5s) that the live change is rarely noticed. Either way, the next play uses fresh settings.

Multi-turn scenario: user drags `soundEffectsVolume` from 0.8 → 0.3 mid-round. `turn.error #1` already finished at 0.8. `turn.error #2` plays at 0.3. **Works exactly as expected.**

## 8. SettingsPanel + GameOptionsOverlay

### 8.1 SettingsPanel changes

| Setting | Today's UI | After M1 |
| ------- | ---------- | -------- |

- `voiceVolume` — today: 0–100% slider (default 80). M1: unchanged.
- `soundEffectsVolume` — today: 0–100% slider (default 80). M1: unchanged.
- `voiceName` — today: voice picker dropdown. M1: filtered by `voice.localService` when `processLocally: true`.
- `voiceLocale` — today: absent. M1: new dropdown (locale before voice picker); defaults to `activeLanguage`.
- `talkativeness` — today: absent (was `ttsEnabled` toggle). M1: 3-stop slider replaces `ttsEnabled` — Shhh 🤫 / Talk a bit 💬 / Talk a lot 🗣️.
- `processLocally` — today: absent. M1: new toggle below voice picker; toggling off triggers privacy modal.

### 8.2 Talkativeness slider

```tsx
<div className="settings-row">
  <Label>How much should the game talk?</Label>
  <Slider
    min={0}
    max={2}
    step={1}
    value={[idx]}
    onValueChange={([i]) => update({ talkativeness: SLIDER_VALUES[i] })}
  />
  <div className="slider-labels">
    <span>🤫 Shhh</span>
    <span>💬 Talk a bit</span>
    <span>🗣️ Talk a lot</span>
  </div>
  <Tooltip>
    The speaker button always works. This setting only controls how much
    the game talks on its own.
  </Tooltip>
</div>;

const SLIDER_VALUES: Talkativeness[] = [
  'on-demand',
  'helpful',
  'chatty',
];
```

Storybook control uses `argTypes` radio (`'on-demand' | 'helpful' | 'chatty'`) per project convention — slider is the user-facing UI, radio is the dev surface.

### 8.3 `processLocally` toggle + cloud-voice modal

Toggle ON → OFF triggers a confirmation modal with browser-specific privacy doc links. Modal copy via i18n keys (`settings.cloudVoiceTitle`, `settings.cloudVoiceBody`); links open in new tab. Default action `Cancel` leaves setting at `true`. `Yes, allow` flips to `false` and unhides cloud voices in the picker.

Toggle OFF → ON (privacy-strengthening) does NOT require confirmation. If the active voice was a cloud voice, the speaker falls back to the first available local voice for the locale + logs `console.warn` for dogfooders.

Caveats documented in the modal body:

- `voice.localService` is browser-reported and not fully reliable.
- iOS Safari: all voices are local; toggle has no visible effect.
- Chrome Android: many voices are cloud-by-default; toggling on may leave a very short list.

### 8.4 `InstructionsOverlay` → `GameOptionsOverlay` rename

Path changes:

```text
src/components/answer-game/InstructionsOverlay/
  → src/components/answer-game/GameOptions/
     ├── GameOptionsOverlay.tsx          (was InstructionsOverlay.tsx)
     ├── GameOptionsOverlay.test.tsx
     ├── GameOptionsOverlay.stories.tsx
     └── useConfigDraft.ts               (unchanged)
```

Storybook title: `'AnswerGame/InstructionsOverlay'` → `'AnswerGame/GameOptions/GameOptionsOverlay'` (PascalCase per CLAUDE.md).

### 8.5 Behavior change — drop auto-speak, emit `game.prepare` to bus

```tsx
// src/components/answer-game/GameOptions/GameOptionsOverlay.tsx (post-rename)
const GameOptionsOverlay: React.FC<Props> = ({ gameId, gameName }) => {
  const bus = useGameEventBus();
  const profile = useCurrentProfile();
  const session = useCurrentSession();

  useEffect(() => {
    bus.emit({
      type: 'lifecycle.speak',
      lifecycleEvent: 'game.prepare',
      gameId,
      sessionId: session.id,
      profileId: profile.id,
      roundIndex: 0,
      timestamp: Date.now(),
    });
    // No CANCEL on unmount — game.prepare is short, just let it finish.
  }, [bus, gameId, session.id, profile.id]);

  return (
    <div className="game-options-overlay">{/* visual content */}</div>
  );
};
```

What disappears from the file:

- All `SpeechSynthesisUtterance` references.
- All `onend` / `onerror` handlers.
- The `useEffect` that called `speak(text)`.
- The `text` prop's role as a speech source (still rendered visually).

Visible structure for M1:

```text
┌─────────────────────────────────────────────┐
│         [GameCover, hero]                   │
├─────────────────────────────────────────────┤
│  WordSpell                       [⭐][⚙]    │
│  ─────────────────────────────────────────  │
│  ( today's SimpleConfigForm — until #300 )  │
│  ─────────────────────────────────────────  │
│  ▶︎ Let's go                                 │
└─────────────────────────────────────────────┘
```

### 8.6 `<QuestionRow>` layout

```tsx
// src/components/questions/QuestionRow/QuestionRow.tsx
export interface QuestionRowProps {
  audioEvent?: LifecycleEvent;
  children: ReactNode; // the question content
}

export const QuestionRow: React.FC<QuestionRowProps> = ({
  audioEvent = 'round.start',
  children,
}) => (
  <div className="question-row">
    <AudioButton event={audioEvent} />
    <div className="question-row__content">{children}</div>
  </div>
);
```

- AudioButton minimum tap target: 44 × 44 px (WCAG).
- Content wraps to additional lines if it exceeds available width — no truncation.
- Inline layout on all breakpoints (icon left, content right).
- Stacked layout (button above content) only when single-line wrap exceeds 3 lines on mobile.

Each game consumes it:

| Game        | Layout                                                               |
| ----------- | -------------------------------------------------------------------- |
| WordSpell   | AudioButton left, word display right; inline single line             |
| NumberMatch | AudioButton top-left, large numeral / dot group centered             |
| SortNumbers | AudioButton left, direction prompt right ("Sort ascending: 1 to 10") |
| SpotAll     | AudioButton left, "Find all the {{target}}" right                    |

### 8.7 `AudioButton` refactor

```tsx
// src/components/questions/AudioButton/AudioButton.tsx
export interface AudioButtonProps {
  event?: LifecycleEvent;
  variant?: Talkativeness;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  event = 'round.start',
  variant = 'helpful',
}) => {
  const round = useRoundContext();
  const speak = useSpeakButton({ event, payload: { round }, variant });

  return (
    <button
      type="button"
      aria-label={t('common.audio.replay', {
        defaultValue: 'Hear the question',
      })}
      onClick={speak}
      className="audio-button"
    >
      <SpeakerIcon />
    </button>
  );
};
```

The button takes a lifecycle event name (default `round.start`) and lets `useSpeakButton` build the variant template at speak time. Game callers stop passing raw prompt strings — that pattern was a silent-bug source (`speakOnDemand('cat')` would fail i18n lookup and silently no-op).

## 9. Template Resolver + RoundContext + i18n

### 9.1 Resolver shape

```ts
// src/lib/lifecycle-tts/resolve.ts
export interface ResolveInput {
  event: LifecycleEvent;
  variant: Talkativeness;
  gameId: string;
  layers: ResolutionLayers;
  roundContext: RoundContextValue;
  t: (key: string, vars?: Record<string, string | number>) => string;
  i18n: { exists: (key: string) => boolean };
}

export interface ResolveOutput {
  text: string | null;
  soundEffect: { key: SoundKey; mode: 'parallel' | 'sequenced' } | null;
}

export const resolveTemplate = (input: ResolveInput): ResolveOutput => {
  /* pure function — see §9.3 */
};
```

Pure function: no flags awareness (`autoSpeak`, `processLocally` gate before/after), no subscriptions, no side effects.

### 9.2 Layer chain

Four layers, walked top to bottom. First non-`undefined` binding wins.

```text
1. customConfig.events[event]   — per-game-config code-only override
2. skin.tts?.[event]            — themed skin override (M3+, unused in M1)
3. definition.tts[event]        — game's canonical binding
4. defaults.tts[event]          — global fallback (mostly INHERITED)
```

```ts
export interface ResolutionLayers {
  customConfig?: EventBindingsMap;
  skin?: EventBindingsMap;
  definition: EventBindingsMap; // required — every game has one
  defaults: EventBindingsMap;
}

type EventBindingsMap = Partial<Record<LifecycleEvent, EventBindings>>;
```

### 9.3 `INHERITED` / `DONT_SPEAK` sentinel constants

```ts
// src/lib/lifecycle-tts/sentinel-values.ts
/**
 * Sentinel: this binding has no opinion — fall through to next layer.
 */
export const INHERITED = undefined;

/**
 * Sentinel: this binding explicitly says "do not speak" — stops the chain.
 */
export const DONT_SPEAK = null;
```

Usage:

```ts
'round.error': {
  tts: {
    'on-demand': DONT_SPEAK, // never speak on-demand
    helpful: 'tts.word-spell.round-error.helpful',
    chatty: 'tts.word-spell.round-error.chatty',
  },
  soundEffect: { key: 'wrong', mode: 'parallel' },
}
```

The resolver respects:

- Layer doesn't define event (`undefined`) → fall through.
- `tts: INHERITED` → fall through for tts.
- `tts: { helpful: INHERITED }` → fall through for this variant.
- `tts: { helpful: DONT_SPEAK }` → **stop — no speech for this variant**.
- `tts: { helpful: 'tts.foo.bar' }` → look up i18n key, interpolate, return.
- i18n key doesn't exist → return `null` + dev `console.warn`.
- i18n key exists but `{{var}}` not interpolated → return `null` + dev warn.

### 9.4 i18n key convention

```text
tts.<game-id>.<event-kebab>.<variant>
```

Examples:

```text
tts.word-spell.round-start.helpful   → "Spell the word {{word}}."
tts.word-spell.round-start.chatty    → "Let's spell. Spell the word {{word}}. You can do it!"
tts.number-match.turn-correct.helpful → "Yes."
tts.number-match.turn-correct.chatty → "Yes, that's {{count}}!"
tts.number-match.game-end.helpful    → "Game over. You got {{correctCount}} of {{totalRounds}}."
```

Files:

- `/Users/leocaseiro/Sites/base-skill/src/lib/i18n/locales/en/games.json` (~64 keys for M1)
- `/Users/leocaseiro/Sites/base-skill/src/lib/i18n/locales/pt-BR/games.json` (not updated in M1; falls back to en via `fallbackLng`)

### 9.5 Missing-key handling — `i18n.exists()`

```ts
const safeTranslate = (
  key: string,
  vars: Record<string, string | number>,
  i18n: { exists: (k: string) => boolean; t: typeof i18nLib.t },
): string | null => {
  if (!i18n.exists(key)) {
    if (import.meta.env.DEV)
      console.warn(`[lifecycle-tts] Missing translation key: ${key}`);
    return null;
  }
  return i18n.t(key, vars);
};
```

Replaces the brittle `text === key` heuristic (plan-365 adversarial review finding).

### 9.6 Variable interpolation + `RoundContext`

```ts
// src/lib/lifecycle-tts/round-context.tsx
export interface RoundContextValue {
  // Universal (every game populates)
  currentTarget: string; // generic answer label — "frog" / "5" / "ascending 1-10" / "cat"
  gameName: string;
  correctCount: number;
  totalRounds: number;

  // Game-specific (one-of populated, rest undefined)
  currentWord?: string; // WordSpell
  currentCount?: number; // NumberMatch
  currentDirection?: 'ascending' | 'descending'; // SortNumbers
  currentFrom?: number; // SortNumbers
  currentTo?: number; // SortNumbers
  currentStep?: number; // SortNumbers
  // currentTarget covers SpotAll
}

const RoundContext = createContext<RoundContextValue | null>(null);

export const RoundContextProvider: React.FC<{ value: RoundContextValue; children: ReactNode }> = ({ value, children }) => (
  <RoundContext.Provider value={value}>{children}</RoundContext.Provider>
);

export const useRoundContext = (): RoundContextValue => {
  const ctx = useContext(RoundContext);
  if (!ctx) throw new Error('useRoundContext requires <RoundContextProvider>');
  return ctx;
};
```

Hybrid shape: game-specific fields for template authoring naturalness, plus universal `currentTarget` for SRS and cross-game tooling.

Per-game `currentTarget` value:

| Game        | `currentTarget`                         |
| ----------- | --------------------------------------- |
| WordSpell   | the word being spelled (`"frog"`)       |
| NumberMatch | the numeral (`"5"`)                     |
| SortNumbers | `"ascending 1 to 10 step 1"` or similar |
| SpotAll     | the target object name (`"red star"`)   |

### 9.7 Interpolation

```ts
const buildInterpolation = (
  roundContext: RoundContextValue,
  gameId: string,
) => ({
  word: roundContext.currentWord ?? '',
  count: roundContext.currentCount ?? '',
  target: roundContext.currentTarget,
  direction: roundContext.currentDirection ?? '',
  from: roundContext.currentFrom ?? '',
  to: roundContext.currentTo ?? '',
  step: roundContext.currentStep ?? '',
  gameName: roundContext.gameName ?? gameId,
  correctCount: roundContext.correctCount ?? 0,
  totalRounds: roundContext.totalRounds ?? 0,
});
```

Missing required variable → resolver returns `null` (no speech) + dev warn. Detection: after interpolation, if the result still contains `{{` or `}}`, a variable wasn't substituted.

### 9.8 i18n M1 scope — 64 keys

4 games × 8 user-visible events × 2 variants (helpful + chatty) = 64 keys.

User-visible M1 events (have keys): `game.prepare`, `game.start`, `round.start`, `round.error`, `round.correct`, `turn.error`, `turn.correct`, `level.complete`, `game.end`. Roughly 9 events × 2 variants × 4 games = 72 keys actually — call it ~64–72 depending on which events each game implements.

`on-demand` variant defaults to `DONT_SPEAK` for most events (no keys). Game definitions may override per event.

Deferred events without M1 keys (`game.resume`, `round.idle`, `round.celebrate`, `round.advance`, `turn.action`, all `mini-game.*`) get keys in M2 or later phases.

## 10. round.idle + Animation Sync + Mini-Game Reservations

### 10.1 `round.idle` gradeBand-aware timer

Per canon §4.2, adopted directly:

```ts
// src/lib/lifecycle-tts/idle-timeout.ts
export const idleTimeoutMs: Record<GradeBand, number> = {
  'pre-k': 8000,
  k: 8000,
  'year1-2': 12000,
  'year3-4': 0, // disabled
  'year5-6': 0, // disabled
};
```

`0` means never fire. Timer lives in the game machine (not in lifecycle-tts):

```ts
playingRound: {
  entry: ['speakRoundStart', 'startIdleTimer'],
  after: {
    IDLE_TIMEOUT: {
      guard: 'noProgressYet',
      actions: 'speakRoundIdle',
      target: 'playingRound',
      reenter: false,
    },
  },
  on: {
    TURN_CORRECT: { actions: 'cancelIdleTimer' },
    TURN_WRONG: { actions: 'restartIdleTimerOnce' },
  },
}
```

Trigger predicate per canon: fires once per round, N seconds after `round.start`, if no zone has received a correct placement AND no tile has been picked up. Cancelled on first correct placement; restarted once on first wrong placement; never restarted again that round.

### 10.2 `lifecycle.tts.played` as state-machine flow control

Game machines listen for `lifecycle.tts.played` matching `gameId + lifecycleEvent + subject` to gate transitions. Enables sequenced speech (Spec 1b phoneme explain) without engine changes:

```ts
// Future Spec 1b sequence
states: {
  'explaining.phoneme1': {
    entry: 'speakPhoneme1', // emits lifecycle.speak { subject: 'tile-k' }
    on: {
      LIFECYCLE_TTS_PLAYED: {
        guard: 'matchesPhoneme1', // event.subject === 'tile-k'
        target: 'explaining.phoneme2',
      },
    },
  },
  'explaining.phoneme2': { /* ... */ },
  'explaining.whole': { /* ... */ },
  'roundTransitionExit': { /* ... */ },
}
```

The mechanism ships in M1 (engine recognizes `LIFECYCLE_TTS_PLAYED` as a transition signal). Phoneme content + CSS classes ship in Spec 1b.

### 10.3 Animation sync via `subject` field

Same speak/played events drive UI animation. Emitter populates `subject`; UI subscribers match on it:

```tsx
// src/games/word-spell/use-tile-highlight.ts
const useTileHighlight = (tileId: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bus = useGameEventBus();

  useEffect(() => {
    const offSpeak = bus.subscribe('lifecycle.speak', (event) => {
      if (event.type !== 'lifecycle.speak') return;
      if (event.subject === tileId) setIsSpeaking(true);
    });
    const offPlayed = bus.subscribe('lifecycle.tts.played', (event) => {
      if (event.type !== 'lifecycle.tts.played') return;
      if (event.subject === tileId) setIsSpeaking(false);
    });
    return () => {
      offSpeak();
      offPlayed();
    };
  }, [bus, tileId]);

  return isSpeaking;
};
```

CSS class toggle (`tile--speaking`) is applied from speak start to played end. No race conditions: even if Web Speech API onend lags, the watchdog (§7.2) emits `tts.played` and un-highlight fires.

### 10.4 Mini-game reservations

Mini-games (DinoEggHatch, FireworksPainter, BubblePop, IceCreamPop, CoinTap) are PR 1b+ scope. M1 reserves the event taxonomy:

```ts
// In LifecycleEvent union, but never fired in M1
| 'mini-game.start'
| 'mini-game.complete'
| 'mini-game.skip'
```

Mini-games have their own state machines, their own templates (`tts.dino-egg-hatch.mini-game-start.helpful`), and emit through the same audio actor by `gameId`. **No celebration sub-state in M1's game machine** — `round.correct → round.advance` is direct in M1.

Real mini-games dismiss via `bus.emit({ type: 'lifecycle.cancel' })` from their Play Again / Go Home button handlers. **No timeout** — if user does nothing, mini-game sits idle (possibly using its own `round.idle`-style hints internally).

## 11. File Inventory + PR Slicing

### 11.1 Single combined PR

One PR, ~80 files, 25 commits for per-commit review. Commits 1–4 are the bus colon→dot rename (mechanical, low-risk); commits 5–25 are the M1 functional work.

### 11.2 New files

```text
src/lib/lifecycle-tts/
├── types.ts                              # LifecycleEvent, Talkativeness, EventBindings, RoundContextValue
├── sentinel-values.ts                    # INHERITED, DONT_SPEAK constants
├── machine.ts                            # XState parallel sub-machines
├── machine.test.ts                       # ~20 tests
├── Provider.tsx                          # LifecycleTtsProvider + bus subscription
├── Provider.test.tsx                     # multi-instance guard tests
├── speaker.ts                            # Speaker interface
├── web-speech-speaker.ts                 # WebSpeechSpeaker impl + Chrome workarounds
├── web-speech-speaker.test.ts
├── sound-effect-player.ts                # SoundEffectPlayer interface
├── html-audio-sound-effect-player.ts
├── html-audio-sound-effect-player.test.ts
├── resolve.ts                            # pure resolver function
├── resolve.test.ts
├── i18n-template-coverage.test.ts        # CI: every {{var}} matches RoundContextValue field
├── round-context.tsx                     # Provider + hook
├── round-context.test.tsx
├── use-lifecycle-tts.ts                  # hook returning actor ref
├── use-speak-button.ts                   # hook for SPEAK_USER taps
├── use-speak-button.test.tsx
├── idle-timeout.ts                       # gradeBand → ms table
├── grade-band.ts                         # gradeLevel → GradeBand mapping
└── defaults.ts                           # default EventBindings (mostly INHERITED)

src/components/answer-game/GameOptions/   # renamed from InstructionsOverlay/
├── GameOptionsOverlay.tsx
├── GameOptionsOverlay.test.tsx
├── GameOptionsOverlay.stories.tsx
└── useConfigDraft.ts                     # unchanged content

src/components/questions/QuestionRow/
├── QuestionRow.tsx
├── QuestionRow.stories.tsx
└── QuestionRow.test.tsx

src/components/SettingsPanel/
└── CloudVoiceModal.tsx                   # privacy modal

src/db/migrations/
└── lifecycle-tts-settings-v4.collection.test.ts
```

### 11.3 Modified files

- `src/types/game-events.ts` — add 3 new event interfaces + 17 `LifecycleEvent` values + `subject` field; rename colon types to dots.
- `src/lib/game-event-bus.ts` — wildcard match supports `'game.*'` etc.
- `src/db/schemas/settings.ts` — v3 → v4 schema bump; add `talkativeness`, `processLocally`, `voiceLocale`; migration strategy.
- `src/db/create-database.ts` — schema version bump.
- `src/components/answer-game/answer-game-reducer.ts` — emit `lifecycle.speak` for `round.*` + `game.*` events via SideEffect.
- `src/components/answer-game/AnswerGameProvider.tsx` — emit `lifecycle.speak` for `game.start`, `game.resume` (remount detect).
- `src/components/answer-game/types.ts` — `AnswerGameConfig` gains `gradeBand`, `talkativeness`; drop `ttsEnabled`.
- `src/components/answer-game/useGameTTS.ts` — deprecate; route to lifecycle-tts where applicable.
- `src/components/answer-game/useRoundTTS.ts` — **removed**; callers migrate to `useLifecycleTts` / `useSpeakButton`.
- `src/components/questions/AudioButton/AudioButton.tsx` — switch from `prompt` string prop to `event: LifecycleEvent` prop; default variant `helpful`.
- `src/components/questions/TextQuestion/TextQuestion.tsx` — route onClick speech through `useSpeakButton`.
- `src/components/questions/ImageQuestion/ImageQuestion.tsx` — same.
- `src/components/questions/EmojiQuestion/EmojiQuestion.tsx` — same.
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — same.
- `src/games/word-spell/WordSpell/WordSpell.tsx` — wrap in `RoundContextProvider`; use `<QuestionRow>`; pass `event` prop to AudioButton.
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — wrap in `RoundContextProvider`; use `<QuestionRow>`; **fix bare-numeral bug** via registry template.
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — wrap in `RoundContextProvider`; **add AudioButton** (currently missing) via `<QuestionRow>`.
- `src/games/spot-all/SpotAll/SpotAll.tsx` — wrap in `RoundContextProvider`.
- `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx` — consolidate local `speakPrompt` into `useSpeakButton`.
- `src/games/word-spell/definition.ts` — add `tts` `EventBindings` per event with sentinel constants.
- `src/games/number-match/definition.ts` — same.
- `src/games/sort-numbers/definition.ts` — same.
- `src/games/spot-all/definition.ts` — same.
- `src/components/SettingsPanel/SettingsPanel.tsx` — Talkativeness slider, `processLocally` toggle + modal, voice picker filter.
- `src/lib/audio/AudioFeedback.ts` — `@deprecated` JSDoc + dev-mode `console.warn` on legacy functions.
- `src/lib/i18n/locales/en/games.json` — add `tts.*` namespace (~64 keys).
- `src/lib/i18n/i18n.ts` — ensure `fallbackLng: 'en'` + missing-key handler.
- `src/routes/$locale/_app/game/$gameId.tsx` — import path: `InstructionsOverlay` → `GameOptionsOverlay`.
- `src/lib/srs/recorder.ts` — subscription strings updated to dot-style; subscribe to `lifecycle.tts.played` for play-count signal.
- `src/lib/game-engine/execute-side-effects.ts` — emit `lifecycle.speak` for `speak` side-effects.
- `e2e/tests/*.spec.ts` — event-string assertions updated to dot-style.

### 11.4 Commit slicing within PR (25 commits)

```text
 1. chore(bus): replace colon separator with dot in GameEventType union
 2. chore(bus): update game-event-bus wildcard match for dotted namespaces
 3. chore(bus): update all emit/subscribe call sites across codebase
 4. chore(bus): update test fixtures and e2e assertions
 5. feat(lifecycle-tts): types + sentinel constants
 6. feat(lifecycle-tts): resolver (pure function) + tests
 7. feat(lifecycle-tts): WebSpeechSpeaker + Chrome workarounds + tests
 8. feat(lifecycle-tts): HtmlAudioSoundEffectPlayer + tests
 9. feat(lifecycle-tts): XState machine (speech + soundEffect parallel) + tests
10. feat(lifecycle-tts): Provider + hooks + tests
11. feat(lifecycle-tts): RoundContext provider/hook + tests
12. feat(settings): RxDB schema v4 migration + tests
13. feat(settings): Talkativeness slider, processLocally toggle, cloud-voice modal
14. feat(answer-game): rename InstructionsOverlay → GameOptionsOverlay, drop auto-speak
15. feat(answer-game): QuestionRow component + breakpoints
16. feat(answer-game): split ttsEnabled → autoSpeak + talkativeness in AnswerGameConfig
17. feat(answer-game): emit lifecycle.speak from reducer + AnswerGameProvider
18. feat(audio): @deprecated tags on AudioFeedback + dev-mode warn
19. feat(questions): refactor AudioButton + 4 question components to useSpeakButton
20. feat(word-spell): RoundContextProvider + tts bindings
21. feat(number-match): RoundContextProvider + tts bindings + fix bare-numeral bug
22. feat(sort-numbers): RoundContextProvider + tts bindings + add AudioButton
23. feat(spot-all): RoundContextProvider + tts bindings + consolidate speakPrompt
24. feat(i18n): add tts.* namespace (~64 en keys)
25. chore: smoke-test integration + e2e coverage
```

Each commit leaves CI green. Reviewer scans commit-by-commit.

## 12. Tests + Acceptance Criteria

### 12.1 Test inventory

**Machine** (`machine.test.ts`):

- `SPEAK_AUTO turn.error` while `helpful` mode → SFX fires (if bound), speech fires (if bound).
- SFX channel and speech channel run in parallel.
- 5 rapid `SPEAK_AUTO turn.error` → SFX fires once (throttled), speech fires once (throttled).
- `round.correct` (p=3) while `turn.error` (p=1) in flight → preempts speech.
- Bus `'lifecycle.speak'` → actor receives `SPEAK_AUTO`.
- Settings change `chatty → helpful` mid-utterance → cancel current, re-fire helpful.
- Speech `invoke.onError` → idle, queue cleared.
- SFX `invoke.onError` → idle, doesn't affect speech.
- `lifecycle.tts.played` emitted after successful speak.

**Speaker** (`web-speech-speaker.test.ts`):

- `speak()` resolves on `onend`.
- `speak()` rejects with `'cancelled'` on `cancel()`.
- `speak()` rejects with `'speech-timeout'` after `SPEECH_WATCHDOG_MS`.
- Voice cache + `voiceschanged` refresh.
- `pickVoice('en-AU')` filters by `localService` when `processLocally: true`.
- Chrome Android: `u.lang = voice.lang` always set with voice.
- Pre-speak `synth.paused === true` → `resume()` called.
- Keepalive: while `synth.speaking === true`, `pause/resume` every 10s.

**Sound effect player** (`html-audio-sound-effect-player.test.ts`):

- `play()` resolves on `audio.ended`.
- `play()` rejects on `audio.error`.
- `cancel()` mid-play rejects with `'cancelled'`.
- Volume threading: `play({ volume: 0.5 })` sets `audio.volume = 0.5`.

**Resolver** (`resolve.test.ts`):

- Single-layer lookup.
- Fall-through (customConfig undefined → skin undefined → definition defined).
- `DONT_SPEAK` suppression at any layer.
- Variant select (helpful vs chatty).
- Missing i18n key → null + dev warn.
- Missing `{{var}}` substitution → null + dev warn.
- SFX without TTS.
- TTS without SFX.

**Provider** (`Provider.test.tsx`):

- Multi-instance Provider mount → throws in DEV, warns in prod.
- Bus subscription wired on mount, unsubscribed on unmount.
- Settings subscription routes to `SETTINGS_CHANGED`.

**GameOptionsOverlay** (`GameOptionsOverlay.test.tsx`):

- Mount → emits `lifecycle.speak { lifecycleEvent: 'game.prepare' }`.
- No `SpeechSynthesisUtterance` ever instantiated.
- Visual structure: game name, simple-form preset, "Let's go".

**Settings migration** (`lifecycle-tts-settings-v4.collection.test.ts`):

- RxDB v3 with `ttsEnabled: true` → v4 `talkativeness: 'helpful'`, `processLocally: true`.
- RxDB v3 with `ttsEnabled: false` → v4 `talkativeness: 'on-demand'`.

**`processLocally` UI**:

- Toggle ON → OFF → modal appears; cancel reverts.
- Toggle ON → OFF → confirm flips to `false`; picker shows cloud voices.
- Toggle OFF → ON → no modal; picker re-filters; warn if active voice now hidden.

**E2E smoke**:

- WordSpell: opening Game Options panel speaks `game.prepare` brief once.
- WordSpell: tapping "Let's go" speaks `game.start` full.
- NumberMatch: round prompt speaks `"Find the matching number for {{count}}."` (not bare numeral).
- SortNumbers: AudioButton present and functional.
- Settings: Talkativeness slider switches between three positions; `on-demand` makes auto-speech silent but tap still works.

### 12.2 M1 acceptance criteria

- [ ] `InstructionsOverlay` renamed to `GameOptionsOverlay`; does NOT auto-speak how-to-play on mount.
- [ ] `lifecycle.speak { lifecycleEvent: 'game.prepare' }` emitted on overlay mount.
- [ ] `game.start` speaks full how-to-play after "Let's go".
- [ ] NumberMatch's bare-numeral speech bug fixed.
- [ ] `ttsEnabled` migrated to `talkativeness` via RxDB v4.
- [ ] AudioButton renders when `talkativeness !== 'on-demand'` ... wait, button always renders. AudioButton always available; uses `helpful` variant on tap.
- [ ] All four games use `<QuestionRow>` with AudioButton.
- [ ] SortNumbers gains AudioButton (currently missing).
- [ ] SpotAllPrompt consolidates into `useSpeakButton`.
- [ ] Talkativeness slider lives in `SettingsPanel` with tooltip.
- [ ] `processLocally` toggle lives in `SettingsPanel` with confirmation modal.
- [ ] All four game definitions have `tts` `EventBindings` for user-visible events.
- [ ] ~64 i18n keys exist in en; pt-BR falls back via `fallbackLng`.
- [ ] WebSpeechSpeaker keepalive resolves Chromium 40747712 freeze.
- [ ] `lifecycle.tts.played` emitted after each successful play.
- [ ] No `useRoundTTS` in codebase; all callers migrated.
- [ ] Singleton Provider guard throws in DEV, warns in prod.
- [ ] Bus event types use dots, not colons.
- [ ] AudioFeedback functions carry `@deprecated` JSDoc + dev warn.
- [ ] All TDD regression tests exist and pass.

### 12.3 Risks + rollback

| Risk                                                    | Mitigation                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Settings v4 migration corrupts user data                | Migration regression test mirroring existing pattern       |
| Keepalive interferes with other `speechSynthesis` users | Singleton actor; deprecation warn catches stragglers       |
| `useRoundTTS` removal breaks a missed caller            | `rg useRoundTTS` before merge; ESLint guard                |
| Bus rename breaks SRS recorder                          | SRS tests cover all event types                            |
| Chrome speech regression in less-tested locale          | Dogfood en-AU + en-US; pt-BR fallback mitigates locale gap |

Rollback: bus rename is mechanical revert (no data). Settings migration is one-way (v3 → v4) but additive fields — keeping v4 migration in place after roll-back is safe.

## 13. Open Questions / Deferred to Follow-up

Filed as GH issues when this spec's M1 plan PR opens (per [Q-§7.8.1] lock):

| #   | Title                                                                   | Phase     |
| --- | ----------------------------------------------------------------------- | --------- |
| 1   | gradeBand verbosity matrix (Quiet/Default/Chatty per-event per-grade)   | M2        |
| 2   | Composition layer for skin/customConfig TTS overrides                   | M3        |
| 3   | ESLint rule: enforce `INHERITED`/`DONT_SPEAK` in tts bindings           | Post-M1   |
| 4   | Mini-game scope finalization (`mini-game.*` events, celebration wiring) | PR 1b+    |
| 5   | LifecycleTTSExplorer Storybook for designer review                      | M2        |
| 6   | pt-BR i18n translation pass                                             | Follow-up |
| 7   | Phoneme explain sequence (Spec 1b)                                      | Spec 1b   |
| 8   | Comment on #230 noting M3 dependency on `customConfig.tts?` UI          | Follow-up |

## 14. References

- [Canon pre-XState spec (superseded)](2026-05-03-instructions-tts-lifecycle-design.md)
- [PR 1a (game engine, merged) — #354](https://github.com/leocaseiro/base-skill/pull/354)
- [PR 1a plan](../plans/2026-05-10-spec-1a-pr1a-game-engine.md)
- [SRS v1 spec (parallel)](2026-05-01-srs-v1-design.md)
- [#229 — Instructions + TTS umbrella issue](https://github.com/leocaseiro/base-skill/issues/229)
- [#365 — M1 TTS XState rewrite issue](https://github.com/leocaseiro/base-skill/issues/365)
- [Chromium issue 40747712 — speechSynthesis freezes](https://issues.chromium.org/issues/40747712)
- [Brave Browser issue 45423](https://github.com/brave/brave-browser/issues/45423)
- [Stack Overflow — speechSynthesis stops after a few seconds](https://stackoverflow.com/questions/42875726/speechsynthesis-speak-in-web-speech-api-always-stops-after-a-few-seconds-in-go)

---

**Status:** Ready for `ce-doc-review` walk-through in a separate session.

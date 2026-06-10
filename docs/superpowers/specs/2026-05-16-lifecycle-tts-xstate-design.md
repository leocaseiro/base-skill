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
2. **`ttsEnabled` flag splits** into a single user-facing **Talkativeness slider** (`on-demand | helpful | chatty`) and a separate **`useOfflineVoicesOnly`** privacy toggle.
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

### 2.1 ADR — i18n key indirection is a deliberate forward-looking investment

M1 routes all lifecycle speech through i18n keys resolved by the 4-layer chain
(§9.2) rather than inline strings. This is heavier than M1's single-locale
(en-AU) needs today, but it is a deliberate investment per the M1 "done once,
done right" directive:

- It enables **M3 skin TTS overrides** (`GameSkin.tts?`, goal G-2) to swap copy
  via translated keys without touching the resolver.
- It enables any **future locale rollout** (pt-BR and beyond) with no resolver
  rewrite — only new translation files.

Locale-shipping schedule is **TBD** and there is **no kill criterion**: the
indirection stays regardless of when additional locales ship. Paying for the
indirection now avoids a forced rewrite when G-2 or additional locales land.

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

### 3.4 Bus access pattern

Components, hooks, the engine, and tests reach the bus through the existing
`getGameEventBus()` module singleton from
[src/lib/game-event-bus.ts](../../../src/lib/game-event-bus.ts). **There is no
`useGameEventBus` hook** — calling the singleton directly keeps the access path
identical everywhere:

```ts
import { getGameEventBus } from '@/lib/game-event-bus';

const bus = getGameEventBus();
bus.emit({ type: 'lifecycle.speak' /* … */ });
```

Tests mock the module:
`vi.mock('@/lib/game-event-bus', () => ({ getGameEventBus: () => fakeBus }))`.
Spec samples that previously showed a `useGameEventBus()` hook (§8.5, §10.3) call
`getGameEventBus()` directly.

## 4. Lifecycle Event Taxonomy

### 4.1 The 19 events

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
  | 'mini-game.skip'
  // Privacy / availability signals (added 2026-05-23 per §13.1.D #19 lock)
  | 'lifecycle.tts.unavailable' // No voice available under user's privacy settings
  | 'lifecycle.tts.cloud-fallback'; // System default cloud voice in use (useOfflineVoicesOnly: false)
```

### 4.2 Event semantics + trigger points

| Event                          | Trigger                                                                                                   | Default priority | Default speech throttle (ms) | Default SFX throttle (ms) |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------- | ------------------------- |
| `game.prepare`                 | `GameOptionsOverlay` mount                                                                                | 2                | 0                            | —                         |
| `game.start`                   | Game machine `loading.entry`                                                                              | 2                | 0                            | —                         |
| `game.resume`                  | Game machine `loading.entry` when `initialState` present (see §4.2.1)                                     | 2                | 0                            | —                         |
| `game.end`                     | Engine `gameOver.entry`                                                                                   | 3                | 0                            | —                         |
| `round.start`                  | `playingRound.entry`                                                                                      | 2                | 0                            | —                         |
| `round.idle`                   | gradeBand timer fires in `playingRound` (8s pre-K, 12s y1-2)                                              | 2                | 0                            | —                         |
| `round.error`                  | `ROUND_FAILED` transition action (definitive)                                                             | 2                | 1500                         | 400                       |
| `round.correct`                | `ROUND_CORRECT` transition action                                                                         | 3                | 0                            | 400                       |
| `round.celebrate`              | (Reserved — M1 doesn't fire; M2+ fires on celebration entry)                                              | 3                | 0                            | 0                         |
| `round.advance`                | `ADVANCE_ROUND` transition action                                                                         | 2                | 0                            | —                         |
| `level.complete`               | `levelTransition.entry`                                                                                   | 3                | 0                            | —                         |
| `turn.error`                   | Wrong tap/keypress (every occurrence within a round)                                                      | 1                | 800                          | 150                       |
| `turn.correct`                 | Right tap/keypress                                                                                        | 2                | 400                          | 100                       |
| `turn.action`                  | Tile pickup/place (every drag interaction)                                                                | 0                | 0 (no speech)                | 50                        |
| `mini-game.start`              | (Reserved — PR 1b+ when first mini-game lands)                                                            | 2                | 0                            | 0                         |
| `mini-game.complete`           | (Reserved)                                                                                                | 2                | 0                            | 0                         |
| `mini-game.skip`               | (Reserved)                                                                                                | 1                | 0                            | 0                         |
| `lifecycle.tts.unavailable`    | `pickVoice()` returns no candidate under `useOfflineVoicesOnly: true` (privacy fail-closed; see §5.7)     | —                | —                            | —                         |
| `lifecycle.tts.cloud-fallback` | `pickVoice()` returns no candidate under `useOfflineVoicesOnly: false` (browser default in use; see §5.7) | —                | —                            | —                         |

Priorities and throttles are overridable per game/skin/customConfig via the same resolution chain as templates (see §9.2). The two `lifecycle.tts.*` signal events (last rows) are emitted by the speaker, not the actor — they are observability signals, not speech triggers, so priority/throttle don't apply.

### 4.2.1 `game.start` / `game.resume` emission contract

> **Amended 2026-06-10** (plan PR #394 round 2, finding C3a / plan Spec
> Delta 5). The original text prescribed an "engine `loading.entry` action"
> — that seam does not exist: per-game machines start `initial: 'playing'`,
> there is no shared engine machine, no `loading` state, and
> `executeSideEffects` has no `initialState`. The single-emit-site
> **contract** is unchanged; the **seam** is the `useGameEngine` mount
> effect — the one hook every game passes through.

The `useGameEngine` mount effect is the **single emit site** for BOTH
`game.start` and `game.resume`. `AnswerGameProvider` MUST NOT emit either —
there is exactly one emit site so the events can never double-fire on mount.
The two are distinguished by the new optional
`UseGameEngineOptions.initialState` (a persisted session snapshot; the
session-resume feature is post-M1, so M1 callers never pass it): absent →
`game.start`, present → `game.resume`.

```ts
// src/lib/game-engine/useGameEngine.ts — mount effect (single emit site)
useEffect(() => {
  const lifecycleEvent = options?.initialState
    ? 'game.resume'
    : 'game.start';
  getGameEventBus().emit({
    type: 'lifecycle.speak',
    lifecycleEvent,
    gameId: envelope.gameId,
    sessionId: envelope.sessionId,
    profileId: envelope.profileId,
    timestamp: Date.now(),
    // roundIndex omitted — game.* are non-round events (see §4.3 two-tier)
  });
  // React StrictMode double-invokes mount effects in dev; the duplicate
  // SPEAK_AUTO is dropped by the §6.4 replace policy (equal priority,
  // same event, nothing queued → drop incoming).
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 4.3 Bus event additions

`subject` is a **branded opaque token** — never user input — enforced at the
type system layer (§13.1.D #21 lock):

```ts
// src/lib/lifecycle-tts/types.ts
declare const __lifecycleSubject: unique symbol;
export type LifecycleSubject = string & {
  readonly [__lifecycleSubject]: 'LifecycleSubject';
};

export const subjectToken = (raw: string): LifecycleSubject =>
  raw as LifecycleSubject;
```

**Subject invariant:** `subject` is an opaque token — tile ID, phoneme key, or
word ID, max 64 chars. It MUST NEVER carry free-form user input (kid's spelling
answer, prompt text, locale-translated string, etc.). The branded type + factory
enforce intent at compile time; a follow-up issue will add an ESLint rule
enforcing factory-only construction so raw strings can't slip through.

`subject` is `string` only — no `number` variant. Callers convert numerics via
`subjectToken(String(id))`. This keeps log/test/match semantics single-typed.

Event interfaces:

```ts
// src/types/game-events.ts (additive)
export interface LifecycleSpeakEvent extends BaseGameEvent {
  type: 'lifecycle.speak';
  lifecycleEvent: LifecycleEvent;
  subject?: LifecycleSubject; // optional ID for animation matching (e.g. tileId)
}

export interface LifecycleTtsPlayedEvent extends BaseGameEvent {
  type: 'lifecycle.tts.played';
  lifecycleEvent: LifecycleEvent;
  subject: LifecycleSubject | null; // REQUIRED, no undefined — boundary coerces ?? null (see §6.7)
  source: 'auto' | 'user';
  variant: Talkativeness;
  durationMs: number;
}

export interface LifecycleCancelEvent extends BaseGameEvent {
  type: 'lifecycle.cancel';
}

// Privacy / availability signals (§5.7)
export interface LifecycleTtsUnavailableEvent extends BaseGameEvent {
  type: 'lifecycle.tts.unavailable';
  subject: LifecycleSubject; // the locale that failed to resolve, e.g. subjectToken('en-AU')
}

export interface LifecycleTtsCloudFallbackEvent extends BaseGameEvent {
  type: 'lifecycle.tts.cloud-fallback';
  subject: LifecycleSubject; // the locale that fell back to browser default
}
```

The `subject` field enables UI animation sync (§10.3): emitters set it to identify
the visual target (`tileId`, `phonemeKey`, `wordIndex`); UI subscribers match on
it via `isSubjectMatch(event, expected)` (§10.3) to highlight/un-highlight.

#### 4.3.1 `GameEventType` literals + two-tier `BaseGameEvent` (issue #38, #40)

Two `game-events.ts` changes land with these events:

**(a) Four new `GameEventType` literals** (dot-style per §4.4) and four union
members:

```ts
// src/types/game-events.ts
export type GameEventType =
  | /* …existing… */
  | 'lifecycle.cancel'
  | 'lifecycle.tts.played'
  | 'lifecycle.tts.unavailable'
  | 'lifecycle.tts.cloud-fallback';

export type GameEvent =
  | /* …existing… */
  | LifecycleCancelEvent
  | LifecycleTtsPlayedEvent
  | LifecycleTtsUnavailableEvent
  | LifecycleTtsCloudFallbackEvent;
```

**(b) `roundIndex` moves off the base envelope into a round-scoped tier.**
`roundIndex` was required on every event, forcing non-round events
(`game.start`, `game.end`, `celebration.*`, `level.advance`, `lifecycle.speak`
for game-level verbs) to fabricate a meaningless value. Only one consumer reads
the envelope field (`useGameSkin.ts` `onRoundComplete`). Split the base:

```ts
// src/types/game-events.ts
export interface BaseGameEvent {
  type: GameEventType;
  gameId: string;
  sessionId: string;
  profileId: string;
  timestamp: number;
  // roundIndex REMOVED from base
}

export interface RoundScopedGameEvent extends BaseGameEvent {
  roundIndex: number;
}
```

Classification:

- **Round-scoped** (`extends RoundScopedGameEvent`): `game.action`,
  `game.evaluate`, `game.score`, `game.hint`, `game.retry`, `game.time_up`,
  `game.round-advance`, `game.drag-start`, `game.drag-over-zone`,
  `game.tile-ejected`.
- **Non-round** (`extends BaseGameEvent`): `game.start`,
  `game.instructions_shown`, `game.end`, `game.level-advance`,
  `celebration.start`, `celebration.complete`, `celebration.skip`.
- **Dual-natured** (`extends BaseGameEvent` with its own optional
  `roundIndex?: number`): `LifecycleSpeakEvent` — its `lifecycleEvent` spans both
  round verbs (`round.start`, `round.error`) and non-round verbs
  (`game.prepare`, `game.start`, `level.complete`), so `roundIndex` is set only
  for the round-scoped verbs.

The discriminated union makes TypeScript enumerate every emit/consume site that
needs updating — the migration is compiler-guided. `game.prepare` therefore
carries **no** `roundIndex` (it is pre-round); the §8.5 sample is updated
accordingly (remove the `roundIndex: 0` line).

### 4.4 Bus event naming — dot-style locked

All bus event types use dots, not colons. Refactor in commits 1–4 of PR B (§11.4):

- `game:start` → `game.start`
- `game:end` → `game.end`
- `game:round-advance` → `game.round-advance`
- `celebration:start` → `celebration.start`
- `lifecycle:speak` → `lifecycle.speak`
- `round:shown` (#257) → `round.shown`

`bus.subscribe('game:*')` wildcard becomes `bus.subscribe('game.*')`. The `*` semantics survive **and are sharpened to segment-prefix match**:

- `'game.*'` matches `'game.start'`, `'game.round-advance'`, `'game.end'` — any event whose type begins with `game.` followed by a single segment.
- `'game.*'` does **not** match `'mini-game.start'` (different top-level namespace) — `mini-game.` is its own segment, not a `game.` sub-segment.
- The `*` does not cross dot boundaries: `'game.*'` does not match `'game.round.deeper.path'` (would require `'game.**'` if we ever need recursive matching — not in M1).

**Implementation gap:** master's `TypedGameEventBus` ([src/lib/game-event-bus.ts](../../../src/lib/game-event-bus.ts)) currently treats `'game:*'` as a single literal magic string (`this.wildcards` is a flat `Set`). Commit 2 in §11.4 (`chore(bus): update game-event-bus wildcard match for dotted namespaces`) must replace the literal check with a segment-prefix matcher that handles arbitrary `<namespace>.*` subscriptions (`game.*`, `lifecycle.*`, `celebration.*`, `mini-game.*`, etc.). SRS recorder + any new namespace subscribers benefit.

**No data migration.** The colon→dot rename touches runtime code only. The one
durable event log — `session_history.events[].action`
([src/db/schemas/session_history.ts](../../../src/db/schemas/session_history.ts))
— stores `Move.type` (`'SUBMIT_ANSWER' | 'REQUEST_HINT' | …`, UPPER_SNAKE), a
namespace entirely separate from the colon-style `GameEventType`. No persisted
RxDB row holds a bus event-type string, so no migration is required.

## 5. Settings Model + Talkativeness + Gates

### 5.1 Settings shape — flat extension of existing SettingsDoc

M1 extends the **existing flat `SettingsDoc`** ([src/db/schemas/settings.ts](../../../src/db/schemas/settings.ts)). There is **no** `audio: {}` nesting wrapper — all new fields live at the top level alongside `speechRate`, `voiceVolume`, `preferredVoiceURI`, etc. Master's schema declares `additionalProperties: false`, which would reject nested-object additions anyway; flatness is enforced by the schema, not a convention.

**Breaking-change note for readers of the canon (pre-XState) design:**

The two-axis model (`Verbosity = 'off' | 'brief' | 'full'` + `TalkativenessPreset = 'quiet' | 'default' | 'chatty'`) is **removed in M1**. M1 collapses to a single axis:

```ts
// src/lib/settings/types.ts (additive — M1 introduces only this one type)
export type Talkativeness = 'on-demand' | 'helpful' | 'chatty';
```

Migration mapping from canon `TalkativenessPreset` values:

| Canon value | M1 value      | Change                                                                                                                         |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `'quiet'`   | `'on-demand'` | **Semantic shift** — canon's `quiet` allowed brief auto-speech at y1-2; M1's `on-demand` means NO auto-speech ever, taps only. |
| `'default'` | `'helpful'`   | Kid-friendly rename, no semantic change.                                                                                       |
| `'chatty'`  | `'chatty'`    | Unchanged.                                                                                                                     |

**Flat `SettingsDoc` shape after M1 (v4):**

```ts
// src/db/schemas/settings.ts — v4 (additive over master v3, all flat top-level fields)
export type SettingsDoc = {
  // === Existing v3 fields, preserved exactly ===
  id: string;
  profileId: string;
  soundEffectsVolume?: number; // existing — 0..1, default 0.8
  voiceVolume?: number; // existing — 0..1, default 0.8
  speechRate?: number; // existing — 0.5..2, default 1 (PRESERVE — consumed by useGameTTS.ts:25,33,44,52 + SettingsPanel slider)
  activeLanguage?: string; // existing — default 'en-AU'; provides voice-locale fallback (no separate voiceLocale field)
  showSubtitles?: boolean;
  themeId?: string;
  preferredVoiceURI?: string; // existing — voice picker dropdown selection (replaces canon's `voiceName`)
  preferredVoiceDeviceId?: string; // existing — preserved
  tapForgivenessThreshold?: number;
  tapForgivenessTimeMs?: number;
  updatedAt: string;
  // === REMOVED in v4 ===
  // ttsEnabled?: boolean  — migrated to `talkativeness` (see §5.8)
  // === NEW in v4 ===
  talkativeness?: Talkativeness; // NEW — single-axis user control (see §5.3)
  useOfflineVoicesOnly?: boolean; // NEW — privacy gate filtering the voice picker (see §5.7)
};
```

**Field naming follows master, not canon.** Canon used `voiceName` and `voiceLocale`; master already had `preferredVoiceURI` (voice picker) and `activeLanguage` (locale). M1 reuses both — **no `voiceName` or `voiceLocale` fields are added**.

**Focused subset type for TTS/audio consumers** (avoids importing the full SettingsDoc into every audio file). All fields are **non-optional** (`Required<>`) — defaults are applied at the boundary in `pickTtsSettings()` (§5.5), so downstream consumers never see `undefined` and never need scattered `?? N` fallbacks:

```ts
// src/lib/lifecycle-tts/types.ts
export type TtsSettings = Required<
  Pick<
    SettingsDoc,
    | 'talkativeness'
    | 'useOfflineVoicesOnly'
    | 'speechRate'
    | 'voiceVolume'
    | 'soundEffectsVolume'
    | 'preferredVoiceURI'
    | 'preferredVoiceDeviceId'
    | 'activeLanguage'
  >
>;
```

The machine, speaker, and sound-effect player consume `TtsSettings`, not the full `SettingsDoc`. The Provider extracts `TtsSettings` from the `useSettings()` result via `pickTtsSettings()` (§5.5) before passing to the actor — the boundary coerces `undefined` fields to privacy-safe defaults so the rest of the system can rely on every field being defined.

### 5.2 Defaults

Existing v3 field defaults are preserved by master's per-field `default:` JSON-schema entries (`soundEffectsVolume: 0.8`, `voiceVolume: 0.8`, `speechRate: 1`, `tapForgivenessThreshold: 17`, `tapForgivenessTimeMs: 150`, `showSubtitles: true`, etc.) — M1 inherits them as-is.

M1 introduces defaults only for the two new fields:

```ts
// src/db/schemas/settings.ts (v4 — additive default entries on new fields)
properties: {
  // ... existing v3 property defaults preserved
  talkativeness:  { type: 'string', enum: ['on-demand', 'helpful', 'chatty'], default: 'helpful' },
  useOfflineVoicesOnly: { type: 'boolean', default: true }, // privacy-safe default
}
```

The `useSettings()` hook ([src/db/hooks/useSettings.ts](../../../src/db/hooks/useSettings.ts)) already merges schema defaults with a `DEFAULT_SETTINGS` constant — M1 adds the new defaults there as well so first-paint (before RxDB resolves) carries the same values:

```ts
// useSettings.ts DEFAULT_SETTINGS — add M1 fields
const DEFAULT_SETTINGS: Omit<SettingsDoc, 'updatedAt'> = {
  // ... existing
  talkativeness: 'helpful',
  useOfflineVoicesOnly: true,
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

### 5.5 Reactivity — actor receives `SETTINGS_CHANGED` via the canonical `useSettings()` hook

Reuse the existing canonical hook at [src/db/hooks/useSettings.ts](../../../src/db/hooks/useSettings.ts) — it wraps `db.settings.findOne(ANONYMOUS_SETTINGS_ID).$` (RxDB observable) in `useRxQuery`, merges defaults with the live doc, and returns `{ settings, update }`. **Do not invent a new subscription pattern.**

The Provider extracts a `TtsSettings` slice (§5.1) via `pickTtsSettings()` and forwards it to the actor whenever it changes:

```tsx
// src/lib/lifecycle-tts/Provider.tsx
import { useSettings } from '@/db/hooks/useSettings';
import { pickTtsSettings } from './pick-tts-settings';

const LifecycleTtsProvider = ({ children }: PropsWithChildren) => {
  const { settings } = useSettings();
  const actorRef = useActorRef(lifecycleTtsMachine, {
    input: { settings: pickTtsSettings(settings) },
  });

  useEffect(() => {
    actorRef.send({
      type: 'SETTINGS_CHANGED',
      settings: pickTtsSettings(settings),
    });
  }, [actorRef, settings]);

  return (
    <LifecycleTtsContext.Provider value={actorRef}>
      {children}
    </LifecycleTtsContext.Provider>
  );
};
```

`pickTtsSettings()` lives in its own file and applies privacy-safe defaults at
the boundary — every `TtsSettings` field becomes non-optional after this call:

```ts
// src/lib/lifecycle-tts/pick-tts-settings.ts
import type { UseSettingsResult } from '@/db/hooks/useSettings';
import type { TtsSettings } from './types';
import { DEFAULT_SETTINGS } from '@/db/hooks/useSettings';

export const pickTtsSettings = (
  s: UseSettingsResult['settings'],
): TtsSettings => ({
  speechRate: s?.speechRate ?? DEFAULT_SETTINGS.speechRate ?? 1,
  voiceVolume: s?.voiceVolume ?? DEFAULT_SETTINGS.voiceVolume ?? 0.8,
  soundEffectsVolume:
    s?.soundEffectsVolume ?? DEFAULT_SETTINGS.soundEffectsVolume ?? 0.8,
  preferredVoiceURI:
    s?.preferredVoiceURI ?? DEFAULT_SETTINGS.preferredVoiceURI ?? '',
  preferredVoiceDeviceId:
    s?.preferredVoiceDeviceId ??
    DEFAULT_SETTINGS.preferredVoiceDeviceId ??
    '',
  activeLanguage:
    s?.activeLanguage ?? DEFAULT_SETTINGS.activeLanguage ?? 'en-AU',
  talkativeness:
    s?.talkativeness ?? DEFAULT_SETTINGS.talkativeness ?? 'helpful',
  useOfflineVoicesOnly:
    s?.useOfflineVoicesOnly ??
    DEFAULT_SETTINGS.useOfflineVoicesOnly ??
    true,
});
```

**Privacy-safe boundary defaults:** `useSettings()` never returns `undefined` —
it merges `DEFAULT_SETTINGS` with the live doc internally — but a partial doc may
still lack individual fields, so `pickTtsSettings()` applies the same defaults at
the boundary: `useOfflineVoicesOnly: true` and `talkativeness: 'helpful'`. The
system can never accidentally route audio through a cloud voice. `DEFAULT_SETTINGS`
in `useSettings.ts` (§5.2) is kept in sync so the two layers agree.

No subscription churn beyond the RxDB observable that `useSettings()` already manages — the actor's settings live in machine context, not in a per-hook dep array elsewhere. Eliminates plan-365's P2 "bus subscription churns on every config change" finding.

### 5.5.1 Provider mount site

> **Amended 2026-06-10** (plan PR #394 round 2, finding C3f / plan Spec
> Delta 4). The original text prescribed `__root.tsx`, but that file is the
> bare document shell: above `DbProvider`, `useSettings()` silently degrades
> to static defaults (commit `76dc53e36`), making the Talkativeness slider
> inert — and the resolver's i18n plus the unavailable-dialog handler would
> equally lack their contexts.

`LifecycleTtsProvider` mounts once in
[src/routes/$locale/\_app.tsx](../../../src/routes/$locale/_app.tsx) —
inside `AppLayoutInner`, nested within `DbProvider` → `I18nextProvider` →
`VoiceUnavailableDialogProvider` — so a single actor instance spans every
speakable route (games, settings, parent pages; including SettingsPanel
previews) with live settings, working i18n, and a reachable
unavailable-dialog. Coverage is unchanged versus a root mount: outside
`$locale/_app/` only the `/` → `/$locale` redirect exists, and it never
speaks. The actor remounts when the `$locale` param changes — acceptable,
speech re-initializes in the new language. In development a
context-existence guard warns if a second `LifecycleTtsProvider` is ever mounted
(`useContext(LifecycleTtsContext)` returning non-null at Provider mount =
duplicate), catching accidental double-mounts.

### 5.6 Talkativeness change mid-flight

| Transition                       | Behavior                                                          |
| -------------------------------- | ----------------------------------------------------------------- |
| `helpful → chatty` or vice versa | Cancel current; re-fire same event with new variant; drop queue.  |
| Any → `on-demand`                | Cancel current; do NOT re-fire (silence is the goal); drop queue. |
| `on-demand → helpful` / `chatty` | Nothing playing. Future events use new variant.                   |

`SPEAK_USER` utterances in flight finish as-is — the caller passed an explicit variant; settings shouldn't override it retroactively.

#### 5.6.1 Kid-facing transition cue when flipping to `on-demand` mid-attempt

When `talkativeness` flips to `'on-demand'` mid-attempt (auto-speech goes silent from the kid's perspective), the AudioButton **pulses once on the next `round.start`** to advertise the tap-to-speak handoff. The pulse uses the `.audio-button--restart-flash` class (reuses the 200ms flash keyframe from §8.7 — visually distinct enough at one-off cadence). Implementation: `useSpeakButton` watches for `talkativeness` transitions to `'on-demand'` and fires the pulse on next `round.start` (~5 lines CSS keyframe + 1 `useEffect` in the hook). The pulse advertises: "the game just got quieter; tap me if you need to hear the question."

See §12.2 for the new acceptance criterion covering this behavior.

### 5.7 `useOfflineVoicesOnly` privacy semantics — deterministic ladder

`useOfflineVoicesOnly: true` is enforced via a deterministic fallback ladder in
`WebSpeechSpeaker.pickVoice()`. There is no silent cloud fallback when the
user has opted into local-only voices.

**Pick order:**

1. If `voiceURI` provided and lang prefix matches → use it.
2. Filter to local-only (`voice.localService !== false`) when
   `useOfflineVoicesOnly: true` (see Firefox note below — treat `undefined`
   as "may be local").
3. Exact locale match → return it.
4. Language-prefix match (`'en-AU'` matches `'en'`) → return it.
5. If candidates set is empty after step 4 **and** `useOfflineVoicesOnly: true`:
   - Emit `lifecycle.tts.unavailable` with `{ subject: locale }`.
   - Throw `LocalVoiceUnavailableError(locale)` from `speak()`.
   - A handler at the Provider tree (sibling of `LifecycleTtsProvider`) subscribes
     to the event and triggers PR #409's existing
     `VoiceUnavailableDialogProvider` AlertDialog (see §7.2 integration note).
6. If candidates empty and `useOfflineVoicesOnly: false`:
   - Emit `lifecycle.tts.cloud-fallback` (system default in use).
   - Return `undefined`; browser picks default voice. Best-effort.

The `voice.localService` flag is browser-reported and inconsistent across
Chrome / Safari / Firefox. Treat `localService !== false` as "may be local"
when the field is undefined (Firefox case).

**Privacy invariant:** under `useOfflineVoicesOnly: true`, no utterance is ever
spoken via a voice with `localService === false`. Step 5 enforces this by
failing closed, not falling back open.

### 5.8 RxDB schema migration v3 → v4 — full schema

Because master enforces `additionalProperties: false`, the v4 schema must declare **every** field (existing + new) explicitly. Shown in full:

```ts
// src/db/schemas/settings.ts
export const settingsSchema: RxJsonSchema<SettingsDoc> = {
  version: 4, // bumped from 3
  primaryKey: 'id',
  type: 'object',
  properties: {
    // === Preserved from v3 (verbatim) ===
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    soundEffectsVolume: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 0.8,
    },
    voiceVolume: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 0.8,
    },
    speechRate: {
      type: 'number',
      minimum: 0.5,
      maximum: 2,
      default: 1,
    }, // PRESERVE
    activeLanguage: { type: 'string' },
    showSubtitles: { type: 'boolean', default: true },
    themeId: { type: 'string' },
    preferredVoiceURI: { type: 'string' },
    preferredVoiceDeviceId: { type: 'string' },
    tapForgivenessThreshold: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      default: 17,
    },
    tapForgivenessTimeMs: {
      type: 'number',
      minimum: 0,
      maximum: 500,
      default: 150,
    },
    updatedAt: { type: 'string', format: 'date-time' },
    // === NEW in v4 ===
    talkativeness: {
      type: 'string',
      enum: ['on-demand', 'helpful', 'chatty'],
      default: 'helpful',
    },
    useOfflineVoicesOnly: { type: 'boolean', default: true },
    // === REMOVED in v4 ===
    // ttsEnabled was removed; see migrationStrategies[4]
  },
  required: ['id', 'profileId', 'updatedAt'],
  additionalProperties: false,
};

export const settingsMigrations = {
  // v3 → v4 — explicit field allowlist; no `{ ...rest }` spread.
  // `additionalProperties: false` in the v4 schema would reject any
  // legacy field that leaked through, so we enumerate every v3 field
  // that survives. See §5.9 for the general rule.
  4: (oldDoc: SettingsDocV3): SettingsDoc => ({
    id: oldDoc.id,
    profileId: oldDoc.profileId,
    updatedAt: oldDoc.updatedAt,
    soundEffectsVolume: oldDoc.soundEffectsVolume,
    voiceVolume: oldDoc.voiceVolume,
    speechRate: oldDoc.speechRate,
    activeLanguage: oldDoc.activeLanguage,
    showSubtitles: oldDoc.showSubtitles,
    themeId: oldDoc.themeId,
    preferredVoiceURI: oldDoc.preferredVoiceURI,
    preferredVoiceDeviceId: oldDoc.preferredVoiceDeviceId,
    tapForgivenessThreshold: oldDoc.tapForgivenessThreshold,
    tapForgivenessTimeMs: oldDoc.tapForgivenessTimeMs,
    // === NEW v4 fields ===
    talkativeness:
      oldDoc.ttsEnabled === false ? 'on-demand' : 'helpful',
    useOfflineVoicesOnly: true, // privacy-safe default
    // `ttsEnabled` is intentionally dropped — replaced by `talkativeness`.
    // Any other unknown legacy field on `oldDoc` is also dropped because
    // this allowlist never references it.
  }),
};
```

**Migration semantics:**

- `ttsEnabled: false` (v3) → `talkativeness: 'on-demand'` (v4) — preserves the user's intent for silence; speaker taps still work (taps are not gated by `talkativeness`).
- `ttsEnabled: true` or absent (v3) → `talkativeness: 'helpful'` (v4) — the safe default; auto-speech enabled at the kid-friendly middle position.
- All other existing v3 fields (`speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId`, `voiceVolume`, `soundEffectsVolume`, etc.) are passed through by **explicit enumeration** — never `{ ...rest }` spread (see §5.9 for why).
- `useOfflineVoicesOnly` defaults to `true` for privacy.

**Non-leakage unit test (REQUIRED).** Migration test mirrors
[src/db/migrations/word-spell-multi-level.collection.test.ts](../../../src/db/migrations/word-spell-multi-level.collection.test.ts)
and asserts both branches of the `ttsEnabled` ternary, untouched-field
preservation, AND that an unknown legacy field on the source doc is dropped
from the target doc:

```ts
// In settings-migration.test.ts
it('drops unknown legacy fields during v3 → v4 migration', () => {
  const v3Doc = {
    id: 'anonymous',
    profileId: 'anonymous',
    updatedAt: '2026-05-23T00:00:00.000Z',
    speechRate: 1.2,
    ttsEnabled: false,
    legacyDebugFlag: 'leaked' as any,
  } satisfies SettingsDocV3 & { legacyDebugFlag: string };
  const v4Doc = settingsMigrations[4](v3Doc);
  expect(v4Doc).not.toHaveProperty('legacyDebugFlag');
  expect(v4Doc.talkativeness).toBe('on-demand');
});
```

### 5.8.1 Migration failure recovery

If `settingsMigrations[4]` throws (e.g., a v3 doc shape so malformed it can't
be coerced), `useSettings()` returns `DEFAULT_SETTINGS` (its EMPTY-observable
fallback per [src/db/hooks/useSettings.ts](../../../src/db/hooks/useSettings.ts)).
The user sees first-run defaults — privacy-safe `useOfflineVoicesOnly: true`,
`talkativeness: 'helpful'`. No crash, no broken UI.

Log to `console.error` with the migration error for dogfooding visibility.

### 5.9 Migration safety rule (applies to all future RxDB migrations under `additionalProperties: false`)

All future migrations on schemas with `additionalProperties: false` MUST use
explicit field allowlist (enumerate every target field by name from the source
doc), never destructure-and-spread (`{ ...rest, newField }`). The spread carries
unknown fields that the schema will then reject during validation.

Test contract: every migration MUST include a unit test asserting that an
unknown legacy field on the source doc is dropped from the target doc (see
§5.8 for an example).

## 6. XState Machine + Queue Policy

### 6.1 Two parallel sub-machines

```ts
// src/lib/lifecycle-tts/machine.ts
import { setup, fromPromise, assign } from 'xstate';

export const lifecycleTtsMachine = setup({
  types: {} as {
    context: TtsContext;
    input: { settings: TtsSettings; speaker: Speaker; bus: GameEventBus }; // speaker + bus injected by Provider (§7.2.1)
    events:
      | { type: 'SPEAK_AUTO'; event: LifecycleEvent; payload: SpeakPayload; subject?: LifecycleSubject }
      | { type: 'SPEAK_USER'; event: LifecycleEvent; payload: SpeakPayload; variant: Talkativeness; subject?: LifecycleSubject }
      | { type: 'SETTINGS_CHANGED'; settings: TtsSettings }
      | { type: 'CANCEL' };
  },
  actors: {
    speaker: fromPromise<void, SpeechUtterance>(async ({ input }) => speakerAdapter.speak(input)), // speaker from context (§7.2.1)
    soundEffectPlayer: fromPromise<void, SoundEffectRequest>(async ({ input }) => soundEffectAdapter.play(input)),
  },
  guards: {
    autoAllowed: ({ context }) => context.settings.talkativeness !== 'on-demand',
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

### 6.1.1 Hook contracts

`useLifecycleTts()` and `useSpeakButton()` follow the existing
`useAnswerGameContext()` convention — React 19 `use(Context)` + throw on missing
provider:

```ts
// src/lib/lifecycle-tts/use-lifecycle-tts.ts
export function useLifecycleTts(): LifecycleTtsActorRef {
  const ref = use(LifecycleTtsContext);
  if (!ref)
    throw new Error(
      'useLifecycleTts must be used inside LifecycleTtsProvider',
    );
  return ref;
}
```

- **Missing-provider behaviour: throw.** The Provider is root-mounted (§5.5.1),
  so the throw can never fire in-app; it only fires in a Storybook story or test
  that forgot the decorator — a loud, actionable signal. (No noop, no Suspense:
  there is nothing async to await — the actor is created synchronously.)
- **Storybook:** stories that render hook consumers add a named decorator
  `withLifecycleTts` (new file `tests/storybook/with-lifecycle-tts.tsx`),
  mirroring existing `withSettings`/`withRouter` decorators. Stories testing the
  missing-context branch simply omit it.
- **`useSpeakButton(explicit?)` empty-payload fallback.** It resolves the
  payload `explicit ?? roundToPayload(round) ?? PREVIEW_PAYLOAD`. SettingsPanel
  renders `AudioButton` with an explicit payload
  (`{ text: t('settings.voicePreview'), subject: 'preview', lang: settings.activeLanguage }`),
  exactly like today's `AudioButton({ prompt })`, so the voice preview works
  without a `RoundContext`. In-game, the round payload is used; `PREVIEW_PAYLOAD`
  is the last-resort constant.

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

After each successful speaker resolve, the actor emits on the bus. `subject` is
coerced to `null` at the boundary so downstream consumers (animation sync, SRS
recorder, tests) only ever see `LifecycleSubject | null`, never `undefined`:

```ts
bus.emit({
  type: 'lifecycle.tts.played',
  lifecycleEvent: utterance.event,
  subject: utterance.subject ?? null, // boundary coercion — never undefined
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

This signal lets game machines gate transitions on speech completion (§10.2) and lets UI animations un-highlight in sync (§10.3) via the `isSubjectMatch()` helper (§10.3). SRS records every `tts.played` as an attempt-context signal, **without persisting `subject`** (see §10.2.5).

The `?? null` coercion stays **inline at this single emit site** — there is only
one place `lifecycle.tts.played` is produced, so a `createTtsPlayedEvent()`
factory would be premature. Read-side null discipline is already centralized in
`isSubjectMatch()` (§10.3).

## 7. Speaker + SoundEffectPlayer Adapters

### 7.1 Adapter interfaces

```ts
// src/lib/lifecycle-tts/speaker.ts
export interface Speaker {
  speak(utterance: SpeechUtterance): Promise<void>; // resolves on natural end
  cancel(): void; // sync; rejects in-flight promise with 'cancelled'
  updateSettings(next: TtsSettings): void; // for voice + volume + rate changes
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
  private settings: TtsSettings;

  constructor(
    settings: TtsSettings,
    private bus: TypedGameEventBus,
  ) {
    // Constructor now takes the bus too — pickVoice() emits
    // lifecycle.tts.unavailable / lifecycle.tts.cloud-fallback per §5.7.
    this.settings = settings;
    this.warmVoiceCache();
    this.keepaliveTimer = setInterval(
      () => this.tickKeepalive(),
      KEEPALIVE_INTERVAL_MS,
    );
  }

  updateSettings(next: TtsSettings) {
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
      // pickVoice() throws LocalVoiceUnavailableError under useOfflineVoicesOnly: true
      // with no candidates — let it propagate to reject this promise (§5.7 step 5).
      let voice: SpeechSynthesisVoice | undefined;
      try {
        voice = this.pickVoice(utterance.locale, utterance.voiceURI);
      } catch (err) {
        reject(err as Error);
        return;
      }
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang; // REQUIRED on Chrome Android — voice alone is not enough
      } else {
        // useOfflineVoicesOnly: false, ladder step 6 — browser picks default;
        // cloud-fallback event already emitted by pickVoice().
        u.lang = utterance.locale;
      }
      // No `?? N` fallbacks — TtsSettings is Required<Pick<...>> (§5.1);
      // pickTtsSettings() (§5.5) applies defaults at the boundary so every
      // field is guaranteed defined here.
      u.volume = this.settings.voiceVolume;
      u.rate = this.settings.speechRate; // PRESERVE existing speechRate (range 0.5..2)
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
    voiceURI: string | undefined,
  ): SpeechSynthesisVoice | undefined {
    // Step 2: filter to local-only voices when useOfflineVoicesOnly: true.
    // Treat `localService !== false` as "may be local" (Firefox returns
    // undefined for the field — fail open per §5.7 note).
    const candidates = [...this.voiceCache.values()].filter((v) =>
      this.settings.useOfflineVoicesOnly
        ? v.localService !== false
        : true,
    );
    // Step 1: explicit voiceURI match with lang-prefix sanity check.
    if (voiceURI) {
      const exact = candidates.find(
        (v) =>
          v.voiceURI === voiceURI &&
          v.lang.startsWith(locale.split('-')[0]),
      );
      if (exact) return exact;
    }
    // Steps 3-4: exact locale, then language-prefix match.
    const localeMatch =
      candidates.find((v) => v.lang === locale) ??
      candidates.find((v) => v.lang.startsWith(locale.split('-')[0]));
    if (localeMatch) return localeMatch;
    // Step 5: privacy-mode empty set — fail closed.
    if (this.settings.useOfflineVoicesOnly) {
      this.bus.emit({
        type: 'lifecycle.tts.unavailable',
        subject: subjectToken(locale),
      });
      throw new LocalVoiceUnavailableError(locale);
    }
    // Step 6: cloud-fallback path — emit signal, return undefined so
    // browser picks its default voice. Best-effort.
    this.bus.emit({
      type: 'lifecycle.tts.cloud-fallback',
      subject: subjectToken(locale),
    });
    return undefined;
  }
}
```

`LocalVoiceUnavailableError` lives in
[`src/lib/lifecycle-tts/errors.ts`](../../../src/lib/lifecycle-tts/errors.ts) (new file):

```ts
// src/lib/lifecycle-tts/errors.ts
export class LocalVoiceUnavailableError extends Error {
  constructor(public readonly locale: string) {
    super(
      `No local voice available for locale '${locale}' under useOfflineVoicesOnly: true`,
    );
    this.name = 'LocalVoiceUnavailableError';
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

> **Integration with `VoiceUnavailableDialogProvider` (added 2026-05-23 after PR #409 shipped):**
> PR [#409](https://github.com/leocaseiro/base-skill/pull/409) shipped
> [`src/providers/VoiceUnavailableDialogProvider.tsx`](../../../src/providers/VoiceUnavailableDialogProvider.tsx)
> (AlertDialog when on-demand TTS lacks an available voice) and
> [`src/components/VoiceUnavailableWarning.tsx`](../../../src/components/VoiceUnavailableWarning.tsx)
> (global banner). M1's `WebSpeechSpeaker` MUST integrate with these surfaces
> rather than inventing its own dialog: when `pickVoice()` returns no candidate
> _and_ `settings.useOfflineVoicesOnly === true`, the speaker emits
> `lifecycle.tts.unavailable` on the bus (new event, see [§13.1.D #19](#13-open-questions--deferred-to-follow-up)
> for the lock); a thin handler at the Provider tree (sibling of
> `LifecycleTtsProvider`) subscribes and triggers the existing
> `VoiceUnavailableDialogProvider` AlertDialog. This keeps voice-availability
> surfaces consistent across on-demand (`speakPromptOnDemand` from #409) and
> lifecycle-driven speech (this spec's XState actor).

### 7.2.1 Speaker lifecycle

The `WebSpeechSpeaker` is constructed **inside `LifecycleTtsProvider`** and
handed to the machine via input — it is not a module global:

```tsx
// inside LifecycleTtsProvider (§5.5)
const bus = getGameEventBus();
const speaker = useMemo(
  () => new WebSpeechSpeaker(pickTtsSettings(settings), bus),
  [],
);
const actorRef = useActorRef(lifecycleTtsMachine, {
  input: { settings: pickTtsSettings(settings), speaker, bus },
});
```

- **Settings forwarding:** on every `SETTINGS_CHANGED` the machine runs a
  `forwardSettings` action that calls `speaker.updateSettings(next)`. The actor
  stays the single source of truth; the speaker is a pure adapter. Ordering
  relative to the §6.6 drain rule is therefore a machine assertion, not a race.
- **Unavailable handling:** a named sibling hook
  `useLifecycleTtsUnavailableHandler` (new file) subscribes to
  `lifecycle.tts.unavailable` on the bus and drives PR #409's
  `VoiceUnavailableDialogProvider` (§7.2). Keeping it a discrete hook (not inline
  in the Provider, not a machine action) keeps the engine free of React dialog
  coupling and makes the listener unit-testable in isolation.
- **Cleanup:** the Provider's effect calls `speaker.dispose()` (§7.1) on unmount.

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

Settings list (today → after M1):

- `voiceVolume` — today: 0–100% slider (default 80). M1: unchanged.
- `soundEffectsVolume` — today: 0–100% slider (default 80). M1: unchanged.
- `activeLanguage` — today: locale selector exists. M1: ensure the voice picker re-filters when this changes; no new `voiceLocale` field is added (the existing `activeLanguage` is the source of truth for voice locale).
- `talkativeness` — today: absent (was `ttsEnabled` toggle). M1: 3-stop slider replaces `ttsEnabled` — Shhh 🤫 / Talk a bit 💬 / Talk a lot 🗣️.

**Offline voices** (new dedicated subsection, rendered ABOVE the voice picker):

- **Offline voices only** — when on, the game uses only voices already on your device. Cloud voices won't appear in the voice picker.
- `useOfflineVoicesOnly` — today: absent. M1: new toggle (default `true`); a `(?)` info-button next to the label surfaces browser caveats (see §8.3); toggling in either direction triggers the confirmation modal.
- `preferredVoiceURI` (voice picker dropdown) — today: voice picker dropdown. M1: filtered by `voice.localService` when `useOfflineVoicesOnly: true`. (No rename — reuse master's existing field; canon's proposed `voiceName` is dropped.) The picker re-filters live whenever the offline-only toggle flips.

### 8.2 Talkativeness slider

```tsx
<div className="settings-row">
  <Label>How much should the game talk?</Label>
  <Slider
    min={0}
    max={2}
    step={1}
    value={[idx]}
    aria-valuetext={t(
      `settings.talkativeness.descriptor.${SLIDER_VALUES[idx]}`,
    )}
    onValueChange={([i]) => update({ talkativeness: SLIDER_VALUES[i] })}
  />
  <div className="slider-labels">
    <span>
      <span aria-hidden="true">🤫</span> Shhh
    </span>
    <span>
      <span aria-hidden="true">💬</span> Talk a bit
    </span>
    <span>
      <span aria-hidden="true">🗣️</span> Talk a lot
    </span>
  </div>
  <p className="settings-row__descriptor">
    {t(`settings.talkativeness.descriptor.${SLIDER_VALUES[idx]}`)}
  </p>
  <Tooltip>
    Pick how much help your child needs. Quiet focus / Read along /
    Coach me through it.
  </Tooltip>
</div>;

const SLIDER_VALUES: Talkativeness[] = [
  'on-demand',
  'helpful',
  'chatty',
];
```

**Persistent current-state descriptor below the slider.** Always rendered (not tooltip-gated) so the user sees the meaning of the selected value without hovering:

| Value       | Descriptor (i18n key `settings.talkativeness.descriptor.<value>`) |
| ----------- | ----------------------------------------------------------------- |
| `on-demand` | "Game stays quiet. Tap the speaker button to hear questions."     |
| `helpful`   | "Game speaks the question and key tips."                          |
| `chatty`    | "Game talks through every round."                                 |

The descriptor copy also drives the Slider's `aria-valuetext`, so screen-reader users hear the same description live as they move the slider — no separate copy track.

**Tooltip framing.** Intent-framed (parents pick by need, not by volume):

> _"Pick how much help your child needs. Quiet focus / Read along / Coach me through it."_

Existing emoji labels (`🤫 Shhh`, `💬 Talk a bit`, `🗣️ Talk a lot`) stay — no new label keys.

**Emoji a11y pattern.** Wrap the emoji in `aria-hidden="true"`, keep the text outside; do NOT add `aria-label` on the parent (avoids double-announce risk on NVDA/VoiceOver):

```tsx
<span>
  <span aria-hidden="true">🤫</span> Shhh
</span>
```

Repeat for all 3 labels. Screen readers announce only the text ("Shhh" / "Talk a bit" / "Talk a lot"); the emoji is decorative.

**3 new i18n keys** added per §9.8: `settings.talkativeness.descriptor.on-demand`, `.helpful`, `.chatty`. See §9.8 for the updated key count.

Storybook control uses `argTypes` radio (`'on-demand' | 'helpful' | 'chatty'`) per project convention — slider is the user-facing UI, radio is the dev surface.

`talkativeness` is a **single user setting** — there is no per-game override
(§13.1.B #11). Game definitions tune verbosity per event via `EventBindings`
(§9), not via a competing per-game talkativeness value.

### 8.3 `useOfflineVoicesOnly` toggle + cloud-voice modal

**Any toggle change triggers the confirmation modal** (both `false → true` and `true → false`). Rationale: kid-tap protection — a child accidentally tapping the toggle in either direction shouldn't silently re-route audio. The modal asks for parent confirmation in both directions.

**Modal copy (neutral; mentions both online + offline):**

- Title (`settings.cloudVoiceTitle`): `"Use online voices too?"`
- Body (`settings.cloudVoiceBody`): `"Online voices need an internet connection — they won't work when you're offline. Turning this on lets the game also use voices from a cloud service in addition to the voices already on your device."`
- Actions: `Cancel` (default; leaves setting unchanged) / `Yes, allow` (flips the toggle).

When confirming `true → false` (enabling cloud voices): unhides cloud voices in the picker.

When confirming `false → true` (re-enabling offline-only): if the active voice was a cloud voice, the speaker falls back to the first available local voice for the locale + logs `console.warn` for dogfooders.

**Browser caveats live in a `(?)` info-button next to the toggle label — NOT in the modal body.** Tap/hover surfaces a tooltip with the 3 caveats. i18n key `settings.cloudVoiceCaveats` carries the bullets:

- `voice.localService` is browser-reported and not fully reliable.
- iOS Safari: all voices are local; toggle has no visible effect.
- Chrome Android: many voices are cloud-by-default; toggling on may leave a very short list.

Rationale for moving caveats out of the modal: most parents don't need the browser-quirk detail to make the decision; the modal copy stays scannable. The info-button keeps the detail one tap away for users who want it.

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

> **M1 acceptance — auto-speak removal is a behavior regression.** Today the panel auto-speaks the how-to-play text on mount; M1 stops doing that. We accept this regression in M1 because the app is in beta with no production users yet — no one is relying on the old behavior. Post-launch the same change would need a migration toast or first-N-sessions taper to soften the surprise. We are NOT shipping migration UX in M1.

```tsx
// src/components/answer-game/GameOptions/GameOptionsOverlay.tsx (post-rename)
const GameOptionsOverlay: React.FC<Props> = ({ gameId, gameName }) => {
  const bus = getGameEventBus();
  const profile = useCurrentProfile();
  const session = useCurrentSession();

  useEffect(() => {
    bus.emit({
      type: 'lifecycle.speak',
      lifecycleEvent: 'game.prepare',
      gameId,
      sessionId: session.id,
      profileId: profile.id,
      timestamp: Date.now(),
    });
    // No CANCEL on unmount — game.prepare is short, just let it finish.
  }, [bus, gameId, session.id, profile.id]);

  return (
    <div className="game-options-overlay">{/* visual content */}</div>
  );
};
```

`game.prepare` sources its envelope from `useCurrentProfile()` /
`useCurrentSession()` (option A1) because it fires pre-engine; `game.start` /
`game.resume` source theirs from engine context (option A2, §4.2.1).

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
  const { speak, isSpeaking } = useSpeakButton({
    event,
    payload: { round },
    variant,
  });
  const [restartFlash, setRestartFlash] = useState(false);

  const handleClick = () => {
    if (isSpeaking) {
      // Re-tap preempts current utterance — visualize the restart.
      setRestartFlash(true);
      window.setTimeout(() => setRestartFlash(false), 200);
    }
    speak();
  };

  return (
    <button
      type="button"
      aria-label={t(
        isSpeaking ? 'audio.replay.playing' : 'audio.replay.idle',
      )}
      onClick={handleClick}
      className={[
        'audio-button',
        isSpeaking && 'audio-button--playing',
        restartFlash && 'audio-button--restart-flash',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <SpeakerIcon className={isSpeaking ? 'pulse' : undefined} />
    </button>
  );
};
```

The button takes a lifecycle event name (default `round.start`) and lets `useSpeakButton` build the variant template at speak time. Game callers stop passing raw prompt strings — that pattern was a silent-bug source (`speakOnDemand('cat')` would fail i18n lookup and silently no-op).

**Three interaction states.** Per §6, `SPEAK_USER` always preempts in-flight speech, so the button never refuses a tap — every state below is reachable from every other.

| State                        | Icon                                | `aria-label`                                                                          | Class                                      | Animation                                                                              |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `idle`                       | `<SpeakerIcon />`                   | `t('audio.replay.idle')` → "Hear the question"                                        | `audio-button`                             | none                                                                                   |
| `playing`                    | `<SpeakerIcon className="pulse" />` | `t('audio.replay.playing')` → "Playing question — tap to replay"                      | `audio-button audio-button--playing`       | Steady-state pulsing ring keyframe on `.audio-button--playing` (loops while speaking)  |
| `briefly-paused-after-retap` | `<SpeakerIcon />`                   | unchanged (transient — no aria flicker, screen readers re-read on next tap if needed) | `audio-button audio-button--restart-flash` | One-shot 200ms bg flash + icon scale-down on `.audio-button--restart-flash` (keyframe) |

**`useSpeakButton` hook signature change** — now returns `{ speak, isSpeaking }` (was `() => speak`):

```ts
// src/lib/lifecycle-tts/use-speak-button.ts
export interface UseSpeakButtonResult {
  speak: () => void;
  isSpeaking: boolean;
}

export const useSpeakButton = (
  opts: UseSpeakButtonOpts,
): UseSpeakButtonResult => {
  const actor = useLifecycleTts();
  const expectedSubject = useMemo(
    () => subjectToken(opts.event, opts.payload),
    [opts.event, opts.payload],
  );

  // Track playing state by subscribing to lifecycle.tts.played matching this
  // button's expected subject. The actor emits `tts.played` on both speak-end
  // and speak-cancel — both transition us back to idle.
  const isSpeaking = useSelector(
    actor,
    (snapshot) =>
      snapshot.context.current?.lifecycleEvent === opts.event &&
      isSubjectMatch(
        { subject: snapshot.context.current?.subject },
        expectedSubject,
      ),
  );

  const speak = useCallback(() => {
    actor.send({
      type: 'SPEAK_USER',
      event: opts.event,
      payload: opts.payload,
      variant: opts.variant,
    });
  }, [actor, opts.event, opts.payload, opts.variant]);

  return { speak, isSpeaking };
};
```

`isSpeaking` is derived by subscribing to the machine and matching the in-flight utterance's `lifecycleEvent + subject` against this button's expected subject (`isSubjectMatch()` from §10.3). It flips back to `false` automatically when the actor's `current` slot clears (on speak end, cancel, or preempt).

**Re-tap preemption visualization.** Per §6, `SPEAK_USER` always preempts. The 200ms one-shot flash + icon scale-down (`.audio-button--restart-flash`) is distinct from the steady-state pulsing ring (`.audio-button--playing`) so the user sees the restart, not just the continued playback. The flash auto-clears via `setTimeout` (200ms); the pulsing ring continues as long as the new utterance plays. No aria change on the flash — screen readers re-announce on next tap if needed; an aria-live ping on every re-tap would over-announce.

**Two new i18n keys** added per §9.8: `audio.replay.idle` ("Hear the question") and `audio.replay.playing` ("Playing question — tap to replay"). See §9.8 for the updated key count.

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

Pure function: no flags awareness (`autoSpeak`, `useOfflineVoicesOnly` gate before/after), no subscriptions, no side effects.

### 9.2 Layer chain

Four layers, walked top to bottom. First non-`undefined` binding wins.

```text
1. customConfig.events[event]   — per-game-config code-only override
2. skin.tts?.[event]            — themed skin override (M3+, unused in M1)
3. definition.tts[event]        — game's canonical binding
4. defaults.tts[event]          — global fallback (mostly INHERITED)
```

**In M1, `layers.skin` is always `undefined`** (no themed skins ship yet); the resolver fall-through cost for layer 2 is one branch in a hot-path function that is already pure, already memoizable, and already needed for layer 1 (`customConfig`). Reserving the layer in the resolver + type now means the M3 skin feature is purely additive (no resolver refactor, no type-shape change, no migration). See §13 follow-up #2 for the M3 work.

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

### 9.8 i18n M1 scope — ~70 keys

Baseline: 4 games × 8 user-visible events × 2 variants (helpful + chatty) ≈ 64 game-event keys. M1 additions push the total to ~70:

- **+6** `round.idle` nudges (per §10.1.1) — WordSpell / NumberMatch / SortNumbers × 2 variants (SpotAll skipped per G-6).
- **+2** AudioButton aria-labels (per §8.7) — `audio.replay.idle`, `audio.replay.playing`.
- **+3** Talkativeness descriptors (per §8.2) — `settings.talkativeness.descriptor.on-demand` / `.helpful` / `.chatty`.
- **+1** Cloud-voice caveats tooltip (per §8.3) — `settings.cloudVoiceCaveats` (bullets).
- (Existing in §8.3) `settings.cloudVoiceTitle`, `settings.cloudVoiceBody` — already locked.

User-visible M1 events (have keys): `game.prepare`, `game.start`, `round.start`, `round.idle` (promoted from deferred in M1, see §10.1.1), `round.error`, `round.correct`, `turn.error`, `turn.correct`, `level.complete`, `game.end`. Roughly 10 events × 2 variants × 4 games (minus SpotAll's `round.idle`) plus the settings/audio keys above lands the total in the ~70 range.

`on-demand` variant defaults to `DONT_SPEAK` for most events (no keys). Game definitions may override per event.

Still-deferred events without M1 keys (`game.resume`, `round.celebrate`, `round.advance`, `turn.action`, all `mini-game.*`) get keys in M2 or later phases.

## 10. round.idle + Animation Sync + Mini-Game Reservations

> **Reviewer note — M1 scope philosophy.** This section (and the spec generally) deliberately includes more architectural rationale, forward-looking examples, and pattern-locked decisions than a minimal-M1 spec would. M1 is greenfield foundational work for **four explicit goals**: (1) migrate 100% to XState, (2) allow every game to be fully customised by skin (less repetition), (3) prepare for SRS, (4) integrate mini-games between rounds/levels. Reviewers should expect §10.2 (state-machine flow-control example for Spec 1b phoneme explain), §10.3 (animation-sync example for `useTileHighlight`), §10.4 (mini-game taxonomy reservations), and §9.2's `skin.tts?` resolution layer to be present **by design** even when no M1 consumer exists yet. These surfaces are ADRs locking the architecture so PR 1b+/SRS v1/M3 work doesn't relitigate dismissal contracts, payload shapes, event names, or resolver layers under time pressure. PR size and review difficulty are not reasons to cut.

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

#### 10.1.1 `round.idle` template content (M1)

Per §9.8's previously-deferred i18n key list — `round.idle` is **no longer deferred in M1**. Kid-friendly nudge copy per game × variant:

| Game        | `helpful` key                         | `helpful` copy                                                  | `chatty` key                         | `chatty` copy                                         |
| ----------- | ------------------------------------- | --------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| WordSpell   | `tts.word-spell.round-idle.helpful`   | "Take your time. Tap the speaker if you need to hear it again." | `tts.word-spell.round-idle.chatty`   | "No rush — try one of the letters when you're ready." |
| NumberMatch | `tts.number-match.round-idle.helpful` | "Take your time. Which numbers match?"                          | `tts.number-match.round-idle.chatty` | "Tap a number when you're ready."                     |
| SortNumbers | `tts.sort-numbers.round-idle.helpful` | "Take your time. Drag the numbers in order."                    | `tts.sort-numbers.round-idle.chatty` | "No rush — start with the smallest one."              |
| SpotAll     | _skipped per G-6_                     | _skipped (game will be redone)_                                 | _skipped per G-6_                    | _skipped (game will be redone)_                       |

`on-demand` variant remains `DONT_SPEAK` (round.idle is auto-speech; silent-mode users tap the speaker to hear the question instead). SpotAll skipped per G-6 (will be redone). ~6 new keys added; §9.8 key count updated.

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

### 10.2.5 SRS recorder constraint (issue #364)

The SRS recorder (issue #364, not built in M1; ships alongside SRS v1 per
the P1 milestone) subscribes to `lifecycle.tts.played` for play-count signal —
how many times has each phoneme/word been spoken to the user?

**The recorder MUST NOT persist `event.subject` to RxDB.**

Recorder reads `subject` in memory only — for matching against the active
attempt via `isSubjectMatch()` (§10.3) — but stores only:

- `lifecycleEvent` (the verb fired: `round.start` / `round.error` / ...)
- `durationMs` (timing signal for SRS scheduling)
- the active attempt key (the SRS row already keyed by phoneme/word)

This preserves the privacy invariant established in §4.3: `subject` is an
opaque token, never user input — but even opaque tokens shouldn't be routed
to durable storage via the observability path. SRS already keys its rows
by phoneme/word independently; storing `subject` would be redundant data
carrying privacy risk.

### 10.3 Animation sync via `subject` field

Same speak/played events drive UI animation. Emitter populates `subject` (a
branded `LifecycleSubject`, §4.3); UI subscribers match via the
`isSubjectMatch()` helper to keep the null/string discipline in one place:

```ts
// src/lib/lifecycle-tts/subject-utils.ts (new file)
import type { LifecycleSubject } from './types';
import type {
  LifecycleTtsPlayedEvent,
  LifecycleSpeakEvent,
} from '@/types/game-events';

export const isSubjectMatch = (
  event:
    | { subject: LifecycleSubject | null }
    | { subject?: LifecycleSubject },
  expected: LifecycleSubject,
): boolean => {
  const s = (event as { subject?: LifecycleSubject | null }).subject;
  return s !== null && s !== undefined && s === expected;
};
```

```tsx
// src/games/word-spell/use-tile-highlight.ts
import { isSubjectMatch } from '@/lib/lifecycle-tts/subject-utils';
import { subjectToken } from '@/lib/lifecycle-tts/types';

const useTileHighlight = (tileId: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bus = getGameEventBus();
  const expected = useMemo(() => subjectToken(tileId), [tileId]);

  useEffect(() => {
    const offSpeak = bus.subscribe('lifecycle.speak', (event) => {
      if (event.type !== 'lifecycle.speak') return;
      if (isSubjectMatch(event, expected)) setIsSpeaking(true);
    });
    const offPlayed = bus.subscribe('lifecycle.tts.played', (event) => {
      if (event.type !== 'lifecycle.tts.played') return;
      if (isSubjectMatch(event, expected)) setIsSpeaking(false);
    });
    return () => {
      offSpeak();
      offPlayed();
    };
  }, [bus, expected]);

  return isSpeaking;
};
```

CSS class toggle (`tile--speaking`) is applied from speak start to played end. No race conditions: even if Web Speech API onend lags, the watchdog (§7.2) emits `tts.played` and un-highlight fires.

### 10.4 Mini-game reservations

**Why M1 ships the reservations even with no firing code.** Mini-game integration between rounds/levels is one of the **four M1 core goals** (see §10 preamble). The taxonomy + dismissal contract are locked here so PR 1b+ adds firing code without re-litigating event names, dismissal flow (`bus.emit({ type: 'lifecycle.cancel' })`), default priorities, or whether the game machine needs a `roundTransition.celebrate` sub-state (it doesn't — confirmed M1 decision). PR 1b+ work happens under different time pressure than this spec session; locking the contract now preserves coherence across the gap.

Mini-games (DinoEggHatch, FireworksPainter, BubblePop, IceCreamPop, CoinTap) are PR 1b+ scope. M1 reserves the event taxonomy:

```ts
// In LifecycleEvent union, but never fired in M1
| 'mini-game.start'
| 'mini-game.complete'
| 'mini-game.skip'
```

Mini-games have their own state machines, their own templates (`tts.dino-egg-hatch.mini-game-start.helpful`), and emit through the same audio actor by `gameId`. **No celebration sub-state in M1's game machine** — `round.correct → round.advance` is direct in M1.

Real mini-games dismiss via `bus.emit({ type: 'lifecycle.cancel' })` from their Play Again / Go Home button handlers. **No timeout** — if user does nothing, mini-game sits idle (possibly using its own `round.idle`-style hints internally).

**Escape hatch.** Event NAMES are locked (downstream consumers must not rename `mini-game.start` / `mini-game.complete` / `mini-game.skip`); semantic refinements — priorities, throttle values, dismissal flow nuance — may happen via the first mini-game's PR in PR 1b+ without breaking change. Per `project_m1_six_goals` the contract is forward-looking; per the §10 preamble, refinements are expected as consumers materialize.

## 11. File Inventory + PR Slicing

### 11.1 Single combined PR

One PR, ~80 files, 25 commits for per-commit review. Commits 1–4 are the bus colon→dot rename (mechanical, low-risk); commits 5–25 are the M1 functional work.

The rename is **bundled** into this PR rather than split into a prerequisite PR. Rationale: the rename is mechanical (no semantic change beyond the segment-prefix wildcard upgrade in commit 2 — see §4.4), each of the 25 commits leaves CI green, and splitting would force a rebase of all 21 functional commits the moment a prerequisite rename PR merges. Per-commit review handles the "large PR" cognitive-load concern: every `chore(bus):`-prefixed commit (1–4) is visually distinct from `feat(*):` commits (5–25), so a reviewer can skim or skip the mechanical commits as one unit. This is consistent with the M1 scope philosophy in the §10 preamble: PR size and review difficulty are not reasons to split work that belongs together.

### 11.2 New files

```text
src/lib/lifecycle-tts/
├── types.ts                              # LifecycleEvent, Talkativeness, EventBindings, RoundContextValue, LifecycleSubject + subjectToken
├── sentinel-values.ts                    # INHERITED, DONT_SPEAK constants
├── errors.ts                             # LocalVoiceUnavailableError (§5.7, §7.2)
├── pick-tts-settings.ts                  # boundary coercion + privacy-safe defaults (§5.5)
├── subject-utils.ts                      # isSubjectMatch() helper (§10.3)
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
├── use-lifecycle-tts-unavailable-handler.ts   # bus → VoiceUnavailableDialogProvider bridge (§7.2.1)
├── use-current-profile.ts                # current profile (ANONYMOUS_PROFILE_ID fallback) for game.prepare envelope (§8.5)
├── use-current-session.ts                # current session via RxDB sessions.findOne() for game.prepare envelope (§8.5)
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

tests/storybook/
└── with-lifecycle-tts.tsx                # Storybook decorator mounting LifecycleTtsProvider (§6.1.1)
```

### 11.3 Modified files

- `src/types/game-events.ts` — add 3 new event interfaces + 17 `LifecycleEvent` values + `subject` field; rename colon types to dots.
- `src/lib/game-event-bus.ts` — wildcard match supports `'game.*'` etc.
- `src/db/schemas/settings.ts` — v3 → v4 schema bump; add **flat top-level** `talkativeness` + `useOfflineVoicesOnly`; preserve `speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId` exactly; remove `ttsEnabled` via migration. Full v4 schema shown in §5.8 (every field declared explicitly because `additionalProperties: false`).
- `src/db/hooks/useSettings.ts` — extend `DEFAULT_SETTINGS` with `talkativeness: 'helpful'` + `useOfflineVoicesOnly: true` so first-paint matches the v4 schema defaults (no code-path change; same RxJS observable wrapping pattern reused).
- `src/db/create-database.ts` — schema version bump.
- `src/components/answer-game/answer-game-reducer.ts` — emit `lifecycle.speak` for `round.*` + `game.*` events via SideEffect.
- `src/components/answer-game/AnswerGameProvider.tsx` — no lifecycle emit; `game.start`/`game.resume` are emitted solely by the engine `loading.entry` action (see §4.2.1).
- `src/routes/__root.tsx` — mount `LifecycleTtsProvider` (inside `ServiceWorkerProvider`, outside route outlet) per §5.5.1.
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
- `src/components/SettingsPanel/SettingsPanel.tsx` — Talkativeness slider, `useOfflineVoicesOnly` toggle + modal, voice picker filter.
- `src/lib/audio/AudioFeedback.ts` — `@deprecated` JSDoc + dev-mode `console.warn` on legacy functions.
- `src/lib/i18n/locales/en/games.json` — add `tts.*` namespace (~64 keys).
- `src/lib/i18n/i18n.ts` — ensure `fallbackLng: 'en'` + missing-key handler.
- `src/routes/$locale/_app/game/$gameId.tsx` — import path: `InstructionsOverlay` → `GameOptionsOverlay`.
- `src/lib/srs/recorder.ts` — subscription strings updated to dot-style; subscribe to `lifecycle.tts.played` for play-count signal.
- `src/lib/game-engine/execute-side-effects.ts` — emit `lifecycle.speak` for `speak` side-effects.
- `e2e/tests/*.spec.ts` — event-string assertions updated to dot-style.

### 11.4 Commit slicing within PR (25 commits)

Each commit carries a **goal tier** (`§13.1.F #31` done-once shield) mapping it to
one of the M1 goals (G-1 XState · G-2 Skin · G-3 Mini-games · G-4 SRS · G-5
Distractions · G-6 SpotAll-exempt) or to `foundation` / `polish`. The tier makes
scope **negotiable without cutting**: a reviewer can see what each commit buys
rather than treating the PR as one indivisible block.

```text
 1. chore(bus): replace colon separator with dot in GameEventType union          · foundation (indirect G-1/G-3)
 2. chore(bus): update game-event-bus wildcard match for dotted namespaces        · foundation (indirect G-1/G-3)
 3. chore(bus): update all emit/subscribe call sites across codebase              · foundation (indirect G-1/G-3)
 4. chore(bus): update test fixtures and e2e assertions                           · foundation (indirect G-1/G-3)
 5. feat(lifecycle-tts): types + sentinel constants                               · G-1
 6. feat(lifecycle-tts): resolver (pure function) + tests                         · G-1 · enables G-2
 7. feat(lifecycle-tts): WebSpeechSpeaker + Chrome workarounds + tests            · G-1
 8. feat(lifecycle-tts): HtmlAudioSoundEffectPlayer + tests                       · G-1
 9. feat(lifecycle-tts): XState machine (speech + soundEffect parallel) + tests   · G-1
10. feat(lifecycle-tts): Provider + hooks + tests                                 · G-1
11. feat(lifecycle-tts): RoundContext provider/hook + tests                       · G-1
12. feat(settings): RxDB schema v4 migration + tests                             · foundation
13. feat(settings): Talkativeness slider, useOfflineVoicesOnly toggle, modal     · G-1
14. feat(answer-game): rename InstructionsOverlay → GameOptionsOverlay, no auto   · G-1
15. feat(answer-game): QuestionRow component + breakpoints                        · polish
16. feat(answer-game): split ttsEnabled → autoSpeak + talkativeness              · G-1
17. feat(answer-game): emit lifecycle.speak from reducer + AnswerGameProvider     · G-1
18. feat(audio): @deprecated tags on AudioFeedback + dev-mode warn                · polish
19. feat(questions): refactor AudioButton + 4 question components to useSpeakBtn   · G-1
20. feat(word-spell): RoundContextProvider + tts bindings                         · G-1
21. feat(number-match): RoundContextProvider + tts bindings + fix bare-numeral    · G-1
22. feat(sort-numbers): RoundContextProvider + tts bindings + add AudioButton     · G-1
23. feat(spot-all): RoundContextProvider + tts bindings + consolidate speakPrompt · G-6 (exempt)
24. feat(i18n): add tts.* + audio.* + settings.* namespaces (~70 en keys)        · G-1 · enables G-2
25. chore: smoke-test integration + e2e coverage                                 · polish
```

Each commit leaves CI green. Reviewer scans commit-by-commit. **Tier legend:**
`G-1` = XState lifecycle/audio substrate · `foundation` = shared infra (bus
rename, settings schema) enabling multiple goals · `polish` = layout, deprecation,
test coverage · `G-6 (exempt)` = SpotAll bindings (game slated for redo).

> **§13.1.F #31 Part B (skipped):** the §10 "comprehensive over YAGNI" preamble
> phrasing is unchanged — the durable directive lives in the `project_m1_six_goals`
> memory, so no spec churn is needed there.

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
- `pickVoice('en-AU')` filters by `localService` when `useOfflineVoicesOnly: true`.
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

- RxDB v3 with `ttsEnabled: true` → v4 `talkativeness: 'helpful'`, `useOfflineVoicesOnly: true`.
- RxDB v3 with `ttsEnabled: false` → v4 `talkativeness: 'on-demand'`.

**`useOfflineVoicesOnly` UI**:

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
- [ ] Mid-round Talkativeness change to `'on-demand'` triggers AudioButton pulse on next `round.start` (per §5.6.1). Verifiable via unit test on `useSpeakButton`.
- [ ] All four games use `<QuestionRow>` with AudioButton.
- [ ] SortNumbers gains AudioButton (currently missing).
- [ ] SpotAllPrompt consolidates into `useSpeakButton`.
- [ ] Talkativeness slider lives in `SettingsPanel` with tooltip.
- [ ] `useOfflineVoicesOnly` toggle lives in `SettingsPanel` with confirmation modal.
- [ ] All four game definitions have `tts` `EventBindings` for user-visible events.
- [ ] ~70 i18n keys exist in en (~64 game-event keys + 6 round.idle nudges + 2 AudioButton aria-labels + 3 Talkativeness descriptors + 1 cloud-voice caveats); pt-BR falls back via `fallbackLng`.
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

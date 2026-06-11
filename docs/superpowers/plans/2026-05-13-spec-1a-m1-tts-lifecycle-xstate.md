# Spec 1a M1 — TTS Lifecycle Minimum Viable Copy Fix (XState rewrite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible TTS copy fixes from #229 — rename InstructionsOverlay, stop auto-speaking how-to-play, fix NumberMatch's "speak the answer" bug, add `talkativeness` (`on-demand | helpful | chatty`) to the user-level `SettingsDoc` (v3→v4 RxDB migration), add `gradeBand` to per-game `AnswerGameConfig`, deprecate `ttsEnabled`, add an inline QuestionRow + AudioButton on the three XState-migrated games (WordSpell, NumberMatch, SortNumbers), and surface the Talkativeness slider in `SettingsPanel`.

**Architecture:** Build the `src/lib/lifecycle-tts/` module whose forward-reference the engine already imports (`GameDefinition.tts`, `SideEffect 'speak'`). Each game's `src/games/<id>/definition.ts` carries its own `tts:` block — there is no parallel registry directory. A **single `lifecycleTtsMachine` XState actor** is mounted once at the app layout (`$locale/_app.tsx`, Spec Delta 4) via `LifecycleTtsProvider`; it owns all game audio (speech + SFX) through two parallel sub-machines, a priority/throttle/single-queued speech policy, and the injected `WebSpeechSpeaker` + `HtmlAudioSoundEffectPlayer` adapters. Game machines emit `{ type: 'speak', params: { lifecycleEvent } }` actions; `useGameEngine` → `executeSideEffects` emits a single `lifecycle.speak` bus event; the actor is the **one** bus subscriber and relays it as `SPEAK_AUTO`, resolving copy via the pure `resolveTemplate()` (spec §9): the 4-layer chain (customConfig → skin → definition → defaults) selects the i18n key for the user's `talkativeness` variant (forwarded via `SETTINGS_CHANGED`, spec §5.5), honoring `INHERITED`/`DONT_SPEAK` sentinels, interpolating `{{var}}`s from the active `RoundContext`, and invoking the speaker — auto-speech suppressed when `talkativeness === 'on-demand'` per spec §6.1's `autoAllowed` guard. On-demand surfaces (AudioButton, question onClick) call `useSpeakButton().speak()` → `SPEAK_USER` directly on the actor (bus uninvolved) — taps **always** speak per spec §5.4 (no hard-mute); the OS volume slider is the escape hatch.

**Tech Stack:** React 19, TypeScript, xstate@5, @xstate/react@5, Vitest, i18next, Web Speech API, existing GameEventBus.

**Spec:** [docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md](../specs/2026-05-16-lifecycle-tts-xstate-design.md) (M1 XState rewrite; supersedes the 2026-05-03 canon spec). §12.2 M1 acceptance criteria. §13.1.A-C locks (closed 2026-05-23) drive the Talkativeness vocab, settings shape, and bus rename below — Phase 0 is the executor's first step.

**Supersedes:** The plan in closed PR #349 (`docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`) — pre-dates PR 1a/1b XState engine, prescribed a parallel registry that conflicts with the engine's `GameDefinition.tts` contract.

**Required skills for executors:**

- `write-storybook` — for any `*.stories.tsx` files (Tasks 9, 12, 13, 16)
- `update-architecture-docs` — for `.mdx` changes co-located with `src/components/answer-game/` and `src/lib/game-engine/` (Task 19)
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## Spec Deltas

Refreshed against the 2026-05-16 spec (which now incorporates the deltas previously logged here against the 2026-05-03 canon). After the refresh, **only one true delta remains** — the rest aligned with spec text and are dropped.

1. **SpotAll deferred from M1.** Spec §12.2 M1 includes "AudioButton on all 4 games" and "SpotAllPrompt consolidates into useLifecycleTts." SpotAll is not on the XState engine yet (still uses `src/games/spot-all/spot-all-reducer.ts`). PR 1d (#368) migrates SpotAll; that PR will add the AudioButton + consolidation as a follow-up. M1 ships TTS for WordSpell, NumberMatch, and SortNumbers only. **Status:** still a real delta — spec §12.2 lists SpotAll inclusion as an M1 criterion that we are knowingly missing pending PR 1d.

**Re-verified and dropped (no longer deltas vs the 2026-05-16 spec):**

- ~~Per-game registry lives in `definition.ts` not a separate directory.~~ Spec §11.3 (Modified files) now prescribes adding `tts` `EventBindings` directly to each game's `definition.ts`. This matches the plan — no divergence, no delta.
- ~~`useLifecycleTts` subscribes to a single `lifecycle.speak` event, not per-event.~~ Spec §3.1 (Architecture Overview, Path A/B) and §11.3 (`src/lib/game-engine/execute-side-effects.ts` emits unified `lifecycle.speak`) both prescribe a single bus event. Matches the plan — no delta.

**New delta vs the 2026-05-13 plan draft (closed by §13.1.B #11 lock, 2026-05-23):**

1. **Spec Delta 2 — `talkativeness` moved from per-game `AnswerGameConfig` to user-level `SettingsDoc`.** The 2026-05-13 plan draft placed `talkativeness` on per-game `AnswerGameConfig` alongside `autoSpeak`/`ttsOnDemandAllowed`/`gradeBand`. The 2026-05-16 spec §5.5 + §13.1.B #11 locks it on the user-level `SettingsDoc` accessed via the existing `useSettings()` hook — so one custom game cannot override the parent's chosen verbosity. Per-game `AnswerGameConfig` keeps only `gradeBand` (per-level tuning, not per-user). The `autoSpeak` / `ttsOnDemandAllowed` flags from the draft are dropped entirely:
   - `autoSpeak` is **derived**, not stored: `autoSpeak = talkativeness !== 'on-demand'` (§5.3). Two flags can't drift apart.
   - `ttsOnDemandAllowed` is rejected by spec §5.4 (no hard-mute). Taps always speak. OS volume slider is the escape hatch.

   This delta is **applied throughout the plan below** — Task 5 migrates `talkativeness` into `SettingsDoc` (RxDB v3→v4) and adds `gradeBand` to per-game config; the actor (Tasks 6–8.5) reads `talkativeness` via the `LifecycleTtsProvider`'s `useSettings()` and gates only auto-speech (`autoAllowed`, not on-demand).

**New deltas from the 2026-06-10 decision round (PR #394 round 2 — D2 + C3a):**

1. **Spec Delta 4 — `LifecycleTtsProvider` mounts in `$locale/_app.tsx`, not `__root.tsx`.** Spec §5.5.1 prescribes `__root.tsx`, but on master that file is the bare document shell. Everything the Provider depends on mounts lower, in `src/routes/$locale/_app.tsx`: `DbProvider` (above it `useSettings()` silently degrades to static defaults — commit `76dc53e36` — making the Talkativeness slider inert), `I18nextProvider` (the resolver's `t` / `i18n.exists`), and `VoiceUnavailableDialogProvider` (the unavailable-handler's `show()`). Mounting inside all three loses zero coverage — every speakable route lives under `$locale/_app/`; outside it only the `/` → `/$locale` redirect exists. Cost: the actor remounts on `$locale` change (acceptable — speech re-initializes in the new language). A one-paragraph §5.5.1 correction is queued on spec PR #391.
2. **Spec Delta 5 — `game.start` / `game.resume` emit from the `useGameEngine` mount effect, not a `loading.entry` action.** Spec §4.2.1's "engine `loading.entry`" has no implementable seam on master: per-game machines start `initial: 'playing'`; there is no shared engine machine, no `loading` state, and no `initialState` input anywhere. The single-emit-site contract is preserved at the one hook every game passes through — `useGameEngine`'s mount effect, with the new optional `UseGameEngineOptions.initialState` (future session-resume) picking the verb. §4.2.1 correction queued on spec PR #391. See Task 8.6.

These deltas are tracked here so M2 (full event surface, customConfig override layer) inherits the same conventions.

---

## Cross-goal alignment notes (2026-05-23)

M1 is the foundation for **six durable project goals** (per user directive 2026-05-23). This plan stays inside G-1 (TTS XState lifecycle) but must reserve seams + event taxonomy that the other five build on. Reviewer YAGNI on these reservations is **categorically rejected** — they are ADRs, not speculative scaffolding.

### G-1 — 100% XState migration

Owned by this plan. The spec §6.1 XState actor (parallel speech + soundEffect sub-machines) ships **in M1**, not in a follow-up PR. A singleton `lifecycleTtsMachine` actor is mounted once at the app layout via `LifecycleTtsProvider` (Spec Delta 4 — in `src/routes/$locale/_app.tsx`, nested inside `DbProvider` → `I18nextProvider` → `VoiceUnavailableDialogProvider` so live settings, i18n, and the unavailable-dialog are all reachable); the `WebSpeechSpeaker` class + `HtmlAudioSoundEffectPlayer` are injected into the machine as `invoke`d actors. `useLifecycleTts()` returns the actor ref via Context; the bus subscriber relays `lifecycle.speak` into the actor as `SPEAK_AUTO`. The actor receives `SETTINGS_CHANGED` (spec §5.5) whenever `useSettings()` changes, and the machine's `forwardSettings` action calls `speaker.updateSettings(next)` — no refs, no per-hook re-read. **Bus** is **only** used for the broadcast-to-N-subscribers pattern (`lifecycle.speak` → audio actor + SRS recorder + future analytics). Actor-to-actor / UI-to-actor calls use XState `sendTo` directly. Spec §3.2 is the rationale.

### G-2 — Game Skins (alignment with `worktrees/feat-multi-skin-config` / PR #393)

Read [`worktrees/feat-multi-skin-config/docs/context-handoff.md`](../../../feat-multi-skin-config/docs/context-handoff.md) for the active skin-token work. The skin PR scope is **visual tokens** (tile states, animations, drag-ghost) — it does **not** touch TTS. M1 reserves the **`skin.tts?` resolver layer** as Layer 2 in the four-layer chain (spec §9.2):

```text
1. customConfig.events[event]   ← per-game-config code-only override (M2)
2. skin.tts?[event]             ← themed skin override (M3+, reserved in M1)
3. definition.tts[event]        ← game's canonical binding (M1)
4. defaults.tts[event]          ← global fallback (M1)
```

In M1, Layer 2 is **always `undefined`** (no themed skin ships TTS templates yet); the resolver still walks the layer so M3 work is purely additive (no resolver refactor needed when Dragon Cave or future skins gain `tts?` overrides). **No conflicts** with the active skin PR — different files, different scope. The token-rename work in `feat/multi-skin-config` does not touch any file modified by this plan.

### G-3 — Mini Games (between rounds and levels)

M1 ships the **mini-game event reservations** (spec §10.4) — `mini-game.start | mini-game.complete | mini-game.skip` are baked into the bus type union in **Phase 0 Commit 4** and listed in spec §4.1's 19-member `LifecycleEvent` union (17 lifecycle moments + 2 availability signals), but **no firing code lands in M1**. PR 1b+ adds real mini-game machines (DinoEggHatch, FireworksPainter, BubblePop, etc.) and the firing-side wiring; the dismissal contract (`bus.emit({ type: 'lifecycle.cancel' })`) is locked here so PR 1b+ doesn't re-litigate it.

**Phase 0 Commit 4 covers this** — `'mini-game.*'` is registered as its own top-level namespace (segment-prefix wildcards don't conflate it with `'game.*'` per spec §4.4 / §13.1.A #9).

### G-4 — SRS recorder (M1 consumer of `lifecycle.tts.played`)

Spec §6.7 + §13.1.C #16 lock the `lifecycle.tts.played` event as the SRS recorder's M1 consumer:

```ts
// emitTtsPlayed action — runs on speaker invoke.onDone (spec §6.7)
bus.emit({
  type: 'lifecycle.tts.played',
  lifecycleEvent: utterance.event,
  subject: utterance.subject ?? null, // boundary coercion — never undefined (§4.3)
  source: utterance.source, // 'auto' | 'user'
  variant: utterance.variant, // Talkativeness
  durationMs: now - utterance.enqueuedAt, // real elapsed time (§6.7)
  gameId,
  sessionId,
  profileId,
  roundIndex,
  timestamp: now,
});
```

This plan emits the event **from the XState actor — on each speaker `invoke.onDone` resolve, the machine's `emitTtsPlayed` action calls `bus.emit` with a real `durationMs` (`now − enqueuedAt`, spec §6.7)**. The SRS recorder lives in a separate spec ([2026-05-01-srs-v1-design.md](../specs/2026-05-01-srs-v1-design.md)) and a separate plan ([#364](https://github.com/leocaseiro/base-skill/issues/364)); this plan **does not** implement the recorder. M1's responsibility is **just emit the event with the correct payload shape** — the `subject: LifecycleSubject | null` field (boundary-coerced from `undefined`, spec §4.3) is the only payload field SRS reads beyond the base envelope.

The producer is the `lifecycleTtsMachine` actor built in the lifecycle-tts module tasks (`emitTtsPlayed` on speaker resolve, spec §6.7); the SRS recorder PR #364 subscribes. M1 owns the producer.

### G-5 — Distractions reused across games (forward-looking note)

No M1 code changes — but a forward-looking framing: the 19-member `LifecycleEvent` taxonomy (spec §4.1) is designed to be **emitter-agnostic**. `round.error` / `round.correct` / `round.advance` fire from any game's XState machine (not just answer-game), which means a future "distractions" data source can emit the same events and trigger the same TTS + UI animation paths. The plan's resolver (Task 3) does not bake assumptions about emitter identity — it just reads `gameId` + `lifecycleEvent` from the bus envelope. SpotAll (G-6) is exempt from this plan but its distractions strategy seeds G-5.

### G-6 — SpotAll exempt (will be redone from scratch)

Spec Delta 1 documents the M1 exclusion. SpotAll continues to use its legacy `useEffect`-driven `speakPrompt` during the M1 → PR 1d window. Tracked in the Deferred section P1 ("SpotAll cross-game UX inconsistency during the M1 → PR 1d window") — open a follow-up issue tracking the consistency gap before this PR merges. No further M1 work on SpotAll itself; the distractions strategy from SpotAll seeds G-5 design but isn't itself in scope.

---

## Phase 0: Bus colon→dot rename (M1 PR commits 1–4)

Per spec §11.4 (rename strategy) + §13.1.A #9 (segment-prefix wildcard semantics) + §13.1.C #17 (bundling rationale), M1 begins with a bundled mechanical rename of all bus event names from `:`-style to `.`-style. Tasks 1–19 below assume this state.

- [ ] **Commit 1 — `chore(bus): rename lifecycle:* → lifecycle.*`** in [src/types/game-events.ts](../../src/types/game-events.ts) and all callers ([src/lib/game-engine/side-effects.ts](../../src/lib/game-engine/side-effects.ts), [src/lib/game-event-bus.ts](../../src/lib/game-event-bus.ts) subscribers).
- [ ] **Commit 2 — `chore(bus): rename game:* → game.* + segment-prefix wildcards`** — rename `game:start` / `game:resume` / `game:over` → dot-style _and_ replace the literal `'game:*'` magic string in [src/lib/game-event-bus.ts](../../src/lib/game-event-bus.ts) with real segment-prefix matching (`'<namespace>.*'` resolution per §13.1.A #9). `'game.*'` matches `'game.start'` and `'game.round-advance'`; does NOT cross dot boundaries or match `'mini-game.start'`.
- [ ] **Commit 3 — `chore(bus): rename cross-cutting test + per-game references`** — sweep test fixtures, mock buses, and any per-game wiring still using colon-style; ensure CI green after each step.
- [ ] **Commit 4 — `chore(bus): final colon→dot sweep + reserved mini-game event names`** — grep for residual `:`-style bus events; bake the §10.4 mini-game reserved events (`mini-game.start | mini-game.complete | mini-game.skip`) as dot-style from inception (no firing code yet — reservation only).

Justification (per §13.1.C #17): rename is mechanical (no semantic change beyond the segment-prefix wildcard upgrade in Commit 2); each commit leaves CI green; splitting Phase 0 from the rest would force rebase of 21 functional commits. `chore(bus):` prefix visually distinguishes from `feat(*):`.

**No RxDB migration (runtime-only rename).** The colon→dot rename touches runtime bus event-type strings only. The one durable event log — `session_history.events[].action` ([src/db/schemas/session_history.ts](../../src/db/schemas/session_history.ts)) — stores `Move.type` (`'SUBMIT_ANSWER' | 'REQUEST_HINT' | …`, UPPER_SNAKE), a namespace entirely separate from the colon-style `GameEventType`. No persisted RxDB row holds a bus event-type string, so Phase 0 requires **no schema bump and no migration** (spec §4.4). The only RxDB migration in this plan is the unrelated `SettingsDoc` v3→v4 in Task 5.

---

## How TTS flows (after M1)

Three ingress paths feed **one** app-mounted `lifecycleTtsMachine` actor (spec §3.1). Auto-speech (Paths A + B) flows through the bus; UI taps (Path C) call the actor directly.

```text
Path A — engine-emitted (game machine state entry)
[ XState game machine in definition.ts ]
   entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]
                              │
                              ▼
[ useGameEngine `speak` action provider → executeSideEffects() ]
                              │
                              ▼
[ src/lib/game-engine/side-effects.ts ]
   getGameEventBus().emit({ type: 'lifecycle.speak', lifecycleEvent, ...envelope })
   // game.start / game.resume come from the useGameEngine mount-effect SINGLE emit-site (Spec Delta 5)

Path B — UI lifecycle moment (component useEffect)
[ GameOptionsOverlay mount ]
   getGameEventBus().emit({ type: 'lifecycle.speak', lifecycleEvent: 'game.prepare', ...envelope })

        Path A and Path B both land on the bus:
                              │
                              ▼
[ lifecycleTtsMachine actor — the single bus subscriber (app-mounted, §5.5.1) ]
   bus.subscribe('lifecycle.speak') → actor.send({ type: 'SPEAK_AUTO', event, payload, subject })
   guard autoAllowed: settings.talkativeness !== 'on-demand'   // §6.1 — drops auto-speech in on-demand
   resolveAndDispatchSpeech (priority + throttle + single-queued slot, §6.4)
                              │
                              ▼
[ invoke speaker: WebSpeechSpeaker.speak({ text, locale, voiceURI }) ]   // §7.2
   onDone → emitTtsPlayed: bus.emit('lifecycle.tts.played', { durationMs: now - enqueuedAt, … })  // §6.7
   (SRS recorder #364 + UI animation sync subscribe to lifecycle.tts.played)

Path C — UI user action (speaker tap / question onClick) — NOT via bus
[ <AudioButton event="round.start" /> ]
   const { speak } = useSpeakButton({ event, payload, variant })
   onClick: speak()  →  actor.send({ type: 'SPEAK_USER', event, payload, variant })
   // SPEAK_USER is NEVER gated by talkativeness — taps always speak per §5.4 (no hard-mute);
   //   always preempts in-flight speech (§6.3). OS volume slider is the "completely silent" escape hatch.
   // Voice-availability: WebSpeechSpeaker.pickVoice() fails closed under useOfflineVoicesOnly,
   //   emitting lifecycle.tts.unavailable → useLifecycleTtsUnavailableHandler → PR #409 dialog (§7.2.1).
```

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
├── types.ts                       # LifecycleEvent, Talkativeness, EventBindings + EventBindingsMap, ResolutionLayers, RoundContextValue, LifecycleSubject + subjectToken, TtsSettings
├── sentinel-values.ts             # INHERITED / DONT_SPEAK sentinel constants (§9.3)
├── defaults.ts                    # global defaults layer — mostly INHERITED (§9.2 layer 4)
├── defaults.test.ts
├── round-context.tsx              # RoundContextProvider + useRoundContext + module-level mirror (§9.6)
├── round-context.test.tsx
├── resolve.ts                     # resolveTemplate() — single pure resolver: layer chain + sentinels + i18n.exists + interpolation + soundEffect (§9.1–§9.7)
├── resolve.test.ts
├── i18n-template-coverage.test.ts # CI: every {{var}} in tts.* keys ∈ §9.7 interpolation table (§11.2)
├── idle-timeout.ts                # gradeBand → ms table for round.idle (§10.1)
├── idle-timeout.test.ts
├── grade-band.ts                  # gradeLevel → GradeBand mapping (§11.2)
├── grade-band.test.ts
├── errors.ts                      # LocalVoiceUnavailableError (§7.2)
├── pick-tts-settings.ts           # pickTtsSettings() — boundary-coerces SettingsDoc → Required<TtsSettings> (§5.5)
├── speaker.ts                     # Speaker + SoundEffectPlayer interfaces, SpeechUtterance + SoundEffectRequest types (§7.1)
├── web-speech-speaker.ts          # WebSpeechSpeaker class — Speaker impl + Chrome watchdogs + pickVoice() offline ladder (§7.2)
├── web-speech-speaker.test.ts
├── html-audio-sound-effect-player.ts   # HtmlAudioSoundEffectPlayer — SoundEffectPlayer impl (§7.3)
├── html-audio-sound-effect-player.test.ts
├── lifecycle-tts-machine.ts       # lifecycleTtsMachine — XState parallel speech+SFX actor, queue/priority/throttle, emitTtsPlayed (§6)
├── lifecycle-tts-machine.test.ts
├── lifecycle-tts-context.ts       # LifecycleTtsContext (React Context carrying the actor ref)
├── lifecycle-tts-provider.tsx     # LifecycleTtsProvider — useMemo speaker, useActorRef, forwardSettings, dispose on unmount, DEV duplicate guard (§5.5 + §7.2.1)
├── lifecycle-tts-provider.test.tsx
├── use-lifecycle-tts.ts           # useLifecycleTts() = use(LifecycleTtsContext) + throw (§6.1.1)
├── use-lifecycle-tts.test.ts
├── use-speak-button.ts            # useSpeakButton(explicit?) → SPEAK_USER; explicit ?? roundToPayload(round) ?? PREVIEW_PAYLOAD (§6.1.1)
├── use-speak-button.test.tsx
├── use-lifecycle-tts-unavailable-handler.ts   # bus lifecycle.tts.unavailable → PR #409 VoiceUnavailableDialogProvider bridge (§7.2.1)
├── use-lifecycle-tts-unavailable-handler.test.tsx
├── use-current-profile.ts         # current profile (ANONYMOUS_PROFILE_ID fallback) for game.prepare envelope (§8.5)
├── use-current-session.ts         # current session via RxDB sessions.findOne() for game.prepare envelope (§8.5)
├── subject-utils.ts               # isSubjectMatch() — null/string discipline in one place (§10.3)
└── subject-utils.test.ts

tests/storybook/
└── with-lifecycle-tts.tsx         # Storybook decorator mounting LifecycleTtsProvider (§6.1.1)

src/components/questions/QuestionRow/
├── QuestionRow.tsx                # Inline AudioButton + content layout (icon left)
├── QuestionRow.module.css
├── QuestionRow.test.tsx
├── QuestionRow.stories.tsx

src/components/answer-game/GameOptions/
├── GameOptionsOverlay.tsx         # Renamed from InstructionsOverlay; no auto-speak; emits game.prepare
├── GameOptionsOverlay.test.tsx
├── GameOptionsOverlay.stories.tsx
└── useConfigDraft.ts              # Moved unchanged from InstructionsOverlay/

src/db/migrations/
├── lifecycle-tts-settings-v4.ts   # v3→v4 allowlist migration (§5.8/§5.9)
└── lifecycle-tts-settings-v4.collection.test.ts

src/components/SettingsPanel/
└── CloudVoiceModal.tsx            # §8.3 parent-confirmation modal (Sub-task 17C)
```

### Modified files

<!-- markdownlint-disable MD060 -->

| File                                                             | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                                       | **Two-tier `BaseGameEvent` restructure** (`roundIndex` moves to new `RoundScopedGameEvent`); add `game.prepare` + 4 lifecycle literals (`lifecycle.cancel`, `lifecycle.tts.played`, `lifecycle.tts.unavailable`, `lifecycle.tts.cloud-fallback`) to `GameEventType`; add `GamePrepareEvent` + 4 new lifecycle event interfaces; extend the `GameEvent` union. Full set per Task 4 Step 3. (`lifecycle.speak` already exists.)                                                                 |
| `src/lib/game-engine/definition-types.ts`                        | Rename the forward-reference import `EventTemplate` → `EventBindings`; `GameDefinition.tts` becomes `tts?: EventBindingsMap` (spec §9.2). The `SideEffect` `'speak'` member stays flat: `{ type: 'speak'; lifecycleEvent }`.                                                                                                                                                                                                                                                                  |
| `src/components/answer-game/types.ts`                            | Add `gradeBand: GradeBand` to per-game `AnswerGameConfig`. **Drop `ttsEnabled`.** `talkativeness` lives on user `SettingsDoc`, NOT on per-game config (spec §5.5, §13.1.B #11) — access via `useSettings()`.                                                                                                                                                                                                                                                                                  |
| `src/games/spot-all/types.ts`                                    | Drop `ttsEnabled`; add `gradeBand: GradeBand` to `SpotAllConfig`. (SpotAll's `speakPrompt` consolidation is deferred per Spec Delta 1 — only the type changes here so the config blob stays consistent.)                                                                                                                                                                                                                                                                                      |
| `src/db/schemas/settings.ts`                                     | **v3 → v4 RxDB schema migration.** Add `talkativeness: 'on-demand' \| 'helpful' \| 'chatty'` (default `'helpful'`) + `useOfflineVoicesOnly: boolean` (default `true`) at the top level. Drop `ttsEnabled`. Full v4 schema per spec §5.8 — every field declared because master enforces `additionalProperties: false`. Preserve `speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId`, `activeLanguage`, all volume fields, etc. exactly.                                                |
| `src/db/create-database.ts`                                      | Register `4: migrateSettingsV4` in `settings.migrationStrategies` (Task 5) — without this the v4 migration never runs.                                                                                                                                                                                                                                                                                                                                                                        |
| `src/db/hooks/useSettings.ts`                                    | Extend `DEFAULT_SETTINGS` with `talkativeness: 'helpful'` + `useOfflineVoicesOnly: true` so first-paint (before RxDB resolves) matches v4 defaults. No code-path change — reuse the existing `useRxQuery` wrapping.                                                                                                                                                                                                                                                                           |
| `src/components/answer-game/useGameTTS.ts`                       | **Deprecated / superseded by the actor.** Auto-speech vs on-demand is now decided in the `lifecycleTtsMachine` (`SPEAK_AUTO` gated by the `autoAllowed` guard `talkativeness !== 'on-demand'`; `SPEAK_USER` never gated, §6.1). `speakTile`'s legacy `config.ttsEnabled` gate flips to the user-level `talkativeness` gate during the Task 5 `ttsEnabled` sweep; remaining call sites migrate to `useLifecycleTts()` / `useSpeakButton()`. Add `@deprecated` JSDoc so no new callers slip in. |
| `src/components/answer-game/useGameTTS.test.tsx`                 | Update tests for the talkativeness-gated `speakTile`; mock `useSettings()`.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/components/answer-game/useRoundTTS.ts`                      | **DELETE.** All three XState games drive round-start speech via `entry: [speak({ lifecycleEvent: 'round.start' })]` on the machine's `playing` state. No callers remain after Tasks 9, 10, 11.                                                                                                                                                                                                                                                                                                |
| `src/components/answer-game/useRoundTTS.test.tsx`                | **DELETE** alongside the source file.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/games/number-match/definition.ts`                           | Add `tts:` block (`EventBindingsMap` — per-variant i18n keys + `DONT_SPEAK` / `INHERITED` sentinels, spec §9.3); add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to `playing` state.                                                                                                                                                                                                                                                                              |
| `src/games/word-spell/definition.ts`                             | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/games/sort-numbers/definition.ts`                           | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Replace stacked numeral + question siblings with `<QuestionRow>`; pass `event="round.start"` to AudioButton.                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Same — `<QuestionRow>` wrap; pass `event` prop.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | **Add AudioButton** (currently has none) via `<QuestionRow>`; pass `event="round.start"`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch `prompt: string` prop to `event: LifecycleEvent` (+ optional `variant`); use `useSpeakButton({ event, payload, variant })` → `SPEAK_USER` (spec §8.7), surfacing `{ speak, isSpeaking }`. **No `talkativeness` gate** — taps always speak per spec §5.4. Button always renders (was: hidden when `ttsEnabled: false`).                                                                                                                                                                 |
| `src/components/questions/AudioButton/AudioButton.test.tsx`      | Update tests for new prop API + "always renders" behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route `onClick` speech through `useSpeakButton(...).speak` (`SPEAK_USER`). No `talkativeness` gate — taps always speak (§5.4).                                                                                                                                                                                                                                                                                                                                                                |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/index.ts`                              | Add `QuestionRow` export.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/components/SettingsPanel/SettingsPanel.tsx`                 | Add 3-stop Talkativeness slider (`on-demand` \| `helpful` \| `chatty`) replacing the legacy `ttsEnabled` toggle; read/write via `useSettings()`. Tooltip explains "The speaker button always works." Spec §8.2.                                                                                                                                                                                                                                                                               |
| `src/components/AdvancedConfigModal.tsx`                         | Add `gradeBand` select to per-game config form (no Talkativeness here — it lives in SettingsPanel as a user-level setting per §13.1.B #11).                                                                                                                                                                                                                                                                                                                                                   |
| `src/components/AdvancedConfigModal.test.tsx`                    | Add test that selecting a gradeBand writes to the config draft.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/lib/i18n/locales/en/games.json`                             | Add `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*` keys — per-variant `tts.<game-id>.<event-kebab>.helpful` / `.chatty` (spec §9.4); `on-demand` defaults to `DONT_SPEAK`, so it gets no keys (§9.8).                                                                                                                                                                                                                                                                         |
| `src/lib/i18n/locales/pt-BR/games.json`                          | Mirror keys (placeholder English values; Portuguese translations follow-up).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update `InstructionsOverlay` import + JSX to `GameOptionsOverlay`.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/routes/$locale/_app.tsx`                                    | **Mount `LifecycleTtsProvider` once** — inside `AppLayoutInner`, nested within `VoiceUnavailableDialogProvider` (Spec Delta 4) — so a single actor spans every speakable route with live `useSettings()`, working i18n, and a reachable unavailable-dialog. A sibling `useLifecycleTtsUnavailableHandler` bridge subscribes to `lifecycle.tts.unavailable` and drives PR #409's `VoiceUnavailableDialogProvider`.                                                                             |
| `src/lib/game-engine/useGameEngine.ts`                           | **Single emit-site for `game.start` / `game.resume`** — the hook's mount effect is the SOLE emitter, distinguished by the new optional `UseGameEngineOptions.initialState` (absent → `game.start`, present → `game.resume`). Spec Delta 5 (spec §4.2.1's `loading.entry` has no implementable seam). See Task 8.6.                                                                                                                                                                            |
| `src/components/answer-game/AnswerGameProvider.tsx`              | **MUST NOT emit `game.start` or `game.resume`** — both come solely from the `useGameEngine` mount-effect single emit-site (Spec Delta 5), so they can never double-fire on mount. `game.prepare` is emitted by `GameOptionsOverlay` on mount, not the provider.                                                                                                                                                                                                                               |
| `src/components/answer-game/GameEngine.flows.mdx`                | Document new TTS data flow (Task 19).                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/lib/audio/AudioFeedback.ts`                                 | Export `SOUND_PATHS` (single source of truth for SFX paths, §7.3); add `@deprecated` JSDoc + dev warn to `playSound` / `queueSound` (Task 7).                                                                                                                                                                                                                                                                                                                                                 |
| `src/lib/game-engine/GameEngine.flows.mdx`                       | Update — references `useRoundTTS`, deleted in Task 11 (Task 19).                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/lib/game-engine/debugging.mdx`                              | Update — `useRoundTTS` debugging row + speech-queue prose (Task 19).                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/components/answer-game/GameEngine.reference.mdx`            | Document `useLifecycleTts` hook + `GameDefinition.tts` field + how to add TTS to a new game (Task 19).                                                                                                                                                                                                                                                                                                                                                                                        |

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
| `src/components/answer-game/useRoundTTS.ts`       | Replaced by `useLifecycleTts` + per-game machine `entry: [speak]` actions. No remaining callers after Tasks 9–11 wire the machines. |
| `src/components/answer-game/useRoundTTS.test.tsx` | Same.                                                                                                                               |

<!-- markdownlint-enable MD060 -->

### Out of scope for M1 (tracked elsewhere)

- **SpotAll AudioButton + speakPrompt consolidation.** Follow-up tied to PR 1d (#368). Open as `M1 follow-up: SpotAll AudioButton` once #368 lands.
- **Per-event `customConfig.events` override surface.** Code-only — game designers set it on customConfigs. M2 work.
- **`LifecycleTTSExplorer.stories.tsx`.** M2 — the registry-table viewer is for game-designer review of per-variant `EventBindings` across multiple games. Deferred until M2 expands the event vocabulary.
- ~~ARIA live region implementation.~~ **Promoted into M1** (Task 15.5, closes 2026-06-09 C6): minimal `<div role="status" aria-live="polite">` wrapper around round outcomes in the three migrated games — an M1 criterion in spec §12.2 (added 2026-06-10 on PR #391), ~5 lines of JSX per game.

---

## Task 1: Lifecycle TTS Types (satisfy engine forward reference)

**Files:**

- Create: `src/lib/lifecycle-tts/types.ts` (overwrites the pre-spec forward-reference pin from `a653cf284`)
- Modify: `src/lib/game-engine/definition-types.ts` (`EventTemplate` → `EventBindingsMap`)

- [ ] **Step 1: Create the types module**

Create `src/lib/lifecycle-tts/types.ts`. This overwrites the pre-spec pin: the legacy `Verbosity`, `EventTemplate`, and `TalkativenessPreset` exports are **deleted** — their only consumer is the engine forward reference, updated in Step 2:

```ts
import type { SoundKey } from '@/lib/audio/AudioFeedback';

// Full 19-event lifecycle surface (spec §4.1). The actor's priority/throttle
// tables (Task 8) and bus union (Task 4) are keyed on this exact set.
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
  // Privacy / availability signals (spec §13.1.D #19 lock)
  | 'lifecycle.tts.unavailable' // No voice available under user's privacy settings
  | 'lifecycle.tts.cloud-fallback'; // System default cloud voice in use (useOfflineVoicesOnly: false)

export type Talkativeness = 'on-demand' | 'helpful' | 'chatty';

// --- Event bindings (spec §9.2 + §9.3) --------------------------------------
// Sentinel semantics (constants live in ./sentinel-values.ts, Task 2):
//   string    → i18n key to speak for this variant
//   null      → DONT_SPEAK: explicit "do not speak" — stops the layer chain
//   undefined → INHERITED: no opinion — fall through to the next layer
export type TtsBindings = Partial<Record<Talkativeness, string | null>>;

export type EventBindings = {
  /** `null` = DONT_SPEAK for every variant; absent = INHERITED. */
  tts?: TtsBindings | null;
  soundEffect?: {
    key: SoundKey;
    mode: 'parallel' | 'sequenced';
  } | null;
};

export type EventBindingsMap = Partial<
  Record<LifecycleEvent, EventBindings>
>;

// 4-layer resolution chain (spec §9.2), walked top to bottom; first
// non-INHERITED binding wins per field. In M1 `skin` is always undefined
// (reserved for M3) and `customConfig` has no write surface yet (M2) — the
// resolver supports both so those phases are purely additive.
export interface ResolutionLayers {
  customConfig?: EventBindingsMap;
  skin?: EventBindingsMap;
  definition: EventBindingsMap; // required — every game has one
  defaults: EventBindingsMap;
}

// --- RoundContext value (spec §9.6) -----------------------------------------
// Hybrid shape: universal fields every game populates + game-specific
// fields for template-authoring naturalness. The React Provider + hook +
// module-level mirror live in ./round-context.tsx (Task 3.5).
export interface RoundContextValue {
  currentTarget: string; // generic answer label — "frog" / "5" / "ascending 1-10"
  gameName: string;
  correctCount: number;
  totalRounds: number;
  currentWord?: string; // WordSpell
  currentCount?: number; // NumberMatch
  currentDirection?: 'ascending' | 'descending'; // SortNumbers
  currentFrom?: number; // SortNumbers
  currentTo?: number; // SortNumbers
  currentStep?: number; // SortNumbers
  // currentTarget covers SpotAll
}

// --- Branded subject token (spec §4.3) -------------------------------------
// `subject` is an opaque ID (tile ID, phoneme key, word ID, locale, max 64
// chars) — NEVER free-form user input. The branded type + factory enforce
// intent at compile time.
declare const __lifecycleSubject: unique symbol;
export type LifecycleSubject = string & {
  readonly [__lifecycleSubject]: 'LifecycleSubject';
};

export const subjectToken = (raw: string): LifecycleSubject =>
  raw as LifecycleSubject;

// --- TTS settings slice (spec §5.1) ----------------------------------------
// Focused, all-non-optional settings shape for audio consumers. Defaults are
// applied at the boundary by pickTtsSettings() (Task 8.5), so downstream code
// never sees `undefined` and never needs scattered `?? N`.
// Deliberately a STANDALONE shape, not Pick<SettingsDoc, …>: SettingsDoc
// (exported from `@/db/schemas/settings`, not `@/types/game-events`) only
// gains `talkativeness` / `useOfflineVoicesOnly` in Task 5 — a Pick here
// would make Task 1's typecheck gate depend on Task 5. Task 5's config-shape
// test asserts the two shapes stay in sync.
export type TtsSettings = {
  talkativeness: Talkativeness;
  useOfflineVoicesOnly: boolean;
  speechRate: number;
  voiceVolume: number;
  soundEffectsVolume: number;
  preferredVoiceURI: string;
  preferredVoiceDeviceId: string;
  activeLanguage: string;
};

// --- Speak payload (derived from spec §6 / §9 usage) -----------------------
// The voice-routing data SPEAK_AUTO / SPEAK_USER carry into the actor.
// `event` deliberately omitted — it rides on the SPEAK_* event itself.
// `text` present = explicit utterance (e.g. SettingsPanel voice preview,
// spec §6.1.1): the actor speaks it verbatim and skips the resolver
// (Task 8, resolveAndDispatchSpeech step 0).
export type SpeakPayload = {
  text?: string;
  subject?: LifecycleSubject;
  lang?: string;
};
```

- [ ] **Step 2: Update the engine forward reference**

In `src/lib/game-engine/definition-types.ts`, swap the import and the `tts` field to the spec §9.2 map shape:

```ts
import type {
  EventBindingsMap,
  LifecycleEvent,
} from '@/lib/lifecycle-tts/types';

// …

export interface GameDefinition<TRound = unknown> {
  // …unchanged fields…
  tts?: EventBindingsMap;
}
```

`SideEffect`'s `'speak'` member is already flat (`{ type: 'speak'; lifecycleEvent: LifecycleEvent }`) — leave it untouched. Every machine snippet in this plan uses the matching flat params shape (see the Task 9 integration note).

- [ ] **Step 3: Verify typecheck**

Run: `yarn typecheck`
Expected: PASS — the engine's `definition-types.ts` and `useGameEngine.ts:11` imports resolve. No type errors anywhere.

- [ ] **Step 4: Commit**

```bash
git add src/lib/lifecycle-tts/types.ts src/lib/game-engine/definition-types.ts
git commit -m "feat(lifecycle-tts): spec §9 EventBindings types — replaces pre-spec EventTemplate pin"
```

---

## Task 2: Sentinel Values + Global Defaults Layer

The Talkativeness→Verbosity preset tables are gone — under spec §9 the user's `talkativeness` **is** the variant key inside each `EventBindings`, so there is no mapping layer to build. What remains of "global tuning" is layer 4 of the §9.2 chain: the `defaults` map (mostly `INHERITED`) plus the sentinel constants every layer uses.

**Files:**

- Create: `src/lib/lifecycle-tts/sentinel-values.ts`
- Create: `src/lib/lifecycle-tts/defaults.ts`
- Create: `src/lib/lifecycle-tts/defaults.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/defaults.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_BINDINGS } from './defaults';
import { DONT_SPEAK, INHERITED } from './sentinel-values';

describe('sentinel values', () => {
  it('DONT_SPEAK and INHERITED are distinct sentinels (null vs undefined)', () => {
    // The resolver branches on this distinction (§9.3) — guard it.
    expect(DONT_SPEAK).toBeNull();
    expect(INHERITED).toBeUndefined();
  });
});

describe('DEFAULT_EVENT_BINDINGS', () => {
  it('turn.action is SFX-only: tts DONT_SPEAK, soundEffect bound', () => {
    expect(DEFAULT_EVENT_BINDINGS['turn.action']?.tts).toBeNull();
    expect(
      DEFAULT_EVENT_BINDINGS['turn.action']?.soundEffect?.key,
    ).toBe('tile-place');
  });

  it('round.start is INHERITED — each game owns its round.start copy', () => {
    expect(DEFAULT_EVENT_BINDINGS['round.start']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/defaults.test.ts --reporter=verbose`
Expected: FAIL — modules not created yet.

- [ ] **Step 3: Implement sentinels + defaults**

Create `src/lib/lifecycle-tts/sentinel-values.ts` (verbatim from spec §9.3):

```ts
/**
 * Sentinel: this binding has no opinion — fall through to next layer.
 */
export const INHERITED = undefined;

/**
 * Sentinel: this binding explicitly says "do not speak" — stops the chain.
 */
export const DONT_SPEAK = null;
```

Create `src/lib/lifecycle-tts/defaults.ts` — layer 4 of the §9.2 chain. Mostly `INHERITED` (i.e. absent): each game owns its own copy via `definition.tts`; the global layer only carries cross-game SFX-only events:

```ts
import { DONT_SPEAK } from './sentinel-values';
import type { EventBindingsMap } from './types';

/**
 * Global fallback layer (§9.2 layer 4). Mostly INHERITED — an event absent
 * here means "no global opinion". `turn.action` is the one cross-game
 * default in M1: tile pickup/place is interaction feedback — SFX only,
 * never spoken (§4.1).
 */
export const DEFAULT_EVENT_BINDINGS: EventBindingsMap = {
  'turn.action': {
    tts: DONT_SPEAK,
    soundEffect: { key: 'tile-place', mode: 'parallel' },
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/defaults.test.ts --reporter=verbose`
Expected: PASS — all three tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/sentinel-values.ts src/lib/lifecycle-tts/defaults.ts src/lib/lifecycle-tts/defaults.test.ts
git commit -m "feat(lifecycle-tts): INHERITED/DONT_SPEAK sentinels + global defaults layer (spec §9.2–§9.3)"
```

---

## Task 3: `resolveTemplate` — Single Pure Resolver (spec §9.1–§9.7)

One pure function replaces the old `resolveVerbosity` + `resolveCopy` pair: it walks the 4-layer chain (customConfig → skin → definition → defaults) with **per-field fall-through** (tts and soundEffect resolve independently), respects the `INHERITED` / `DONT_SPEAK` sentinels, guards missing i18n keys via `i18n.exists()` (§9.5), interpolates `{{var}}`s from `RoundContextValue` (§9.6–§9.7), and returns `{ text, soundEffect }`. No flags awareness (`talkativeness === 'on-demand'` and `useOfflineVoicesOnly` gate before/after in the actor), no subscriptions, no side effects.

**Files:**

- Create: `src/lib/lifecycle-tts/resolve.ts`
- Create: `src/lib/lifecycle-tts/resolve.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/resolve.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { resolveTemplate } from './resolve';
import { DONT_SPEAK } from './sentinel-values';
import type { ResolutionLayers, RoundContextValue } from './types';

const roundContext: RoundContextValue = {
  currentTarget: 'frog',
  gameName: 'Word Spell',
  correctCount: 2,
  totalRounds: 10,
  currentWord: 'frog',
};

const en: Record<string, string> = {
  'tts.word-spell.round-start.helpful': 'Spell the word {{word}}.',
  'tts.word-spell.round-start.chatty':
    "Let's spell. Spell the word {{word}}. You can do it!",
  'custom.round-start.helpful': 'Custom: {{word}}!',
  'tts.word-spell.round-start.broken': 'Spell {{notAVar}}.',
};

const t = (key: string, vars?: Record<string, string | number>) =>
  Object.entries(vars ?? {}).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    en[key] ?? key,
  );
const i18n = { exists: (key: string) => key in en };

const base = (
  definition: ResolutionLayers['definition'],
): ResolutionLayers => ({ definition, defaults: {} });

const WORD_SPELL_ROUND_START: ResolutionLayers['definition'] = {
  'round.start': {
    tts: {
      helpful: 'tts.word-spell.round-start.helpful',
      chatty: 'tts.word-spell.round-start.chatty',
    },
    soundEffect: { key: 'tile-place', mode: 'parallel' },
  },
};

describe('resolveTemplate', () => {
  it('resolves the definition key for the active variant and interpolates {{word}}', () => {
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: base(WORD_SPELL_ROUND_START),
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBe('Spell the word frog.');
    expect(out.soundEffect).toEqual({
      key: 'tile-place',
      mode: 'parallel',
    });
  });

  it('customConfig (layer 1) overrides definition (layer 3)', () => {
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: {
        ...base(WORD_SPELL_ROUND_START),
        customConfig: {
          'round.start': {
            tts: { helpful: 'custom.round-start.helpful' },
          },
        },
      },
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBe('Custom: frog!');
  });

  it('variant INHERITED in customConfig falls through to definition', () => {
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'chatty',
      gameId: 'word-spell',
      layers: {
        ...base(WORD_SPELL_ROUND_START),
        customConfig: {
          'round.start': {
            tts: { helpful: 'custom.round-start.helpful' },
          },
        },
      },
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBe(
      "Let's spell. Spell the word frog. You can do it!",
    );
  });

  it('DONT_SPEAK at a higher layer stops the chain', () => {
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: {
        ...base(WORD_SPELL_ROUND_START),
        customConfig: {
          'round.start': { tts: { helpful: DONT_SPEAK } },
        },
      },
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBeNull();
  });

  it('returns null text + null soundEffect when no layer binds the event', () => {
    const out = resolveTemplate({
      event: 'round.idle',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: base(WORD_SPELL_ROUND_START),
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBeNull();
    expect(out.soundEffect).toBeNull();
  });

  it('missing i18n key → null + dev warn (§9.5)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: base({
        'round.start': {
          tts: { helpful: 'tts.word-spell.round-start.nope' },
        },
      }),
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('leftover {{var}} after interpolation → null + dev warn (§9.7)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = resolveTemplate({
      event: 'round.start',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: base({
        'round.start': {
          tts: { helpful: 'tts.word-spell.round-start.broken' },
        },
      }),
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('soundEffect resolves independently of tts (SFX-only binding still plays)', () => {
    const out = resolveTemplate({
      event: 'turn.action',
      variant: 'helpful',
      gameId: 'word-spell',
      layers: base({
        'turn.action': {
          tts: DONT_SPEAK,
          soundEffect: { key: 'tile-place', mode: 'parallel' },
        },
      }),
      roundContext,
      t,
      i18n,
    });
    expect(out.text).toBeNull();
    expect(out.soundEffect?.key).toBe('tile-place');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: FAIL — `resolveTemplate` not exported.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/lifecycle-tts/resolve.ts` (spec §9.1 signature; §9.5 `safeTranslate` semantics; §9.7 interpolation table):

```ts
import type { SoundKey } from '@/lib/audio/AudioFeedback';
import type {
  EventBindingsMap,
  LifecycleEvent,
  ResolutionLayers,
  RoundContextValue,
  Talkativeness,
} from './types';

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

const devWarn = (msg: string): void => {
  if (import.meta.env.DEV) console.warn(`[lifecycle-tts] ${msg}`);
};

// §9.7 — every {{var}} a template may reference, from RoundContextValue.
// After interpolation, leftover `{{`/`}}` means a var wasn't substituted.
const buildInterpolation = (
  rc: RoundContextValue,
  gameId: string,
): Record<string, string | number> => ({
  word: rc.currentWord ?? '',
  count: rc.currentCount ?? '',
  target: rc.currentTarget,
  direction: rc.currentDirection ?? '',
  from: rc.currentFrom ?? '',
  to: rc.currentTo ?? '',
  step: rc.currentStep ?? '',
  gameName: rc.gameName ?? gameId,
  correctCount: rc.correctCount ?? 0,
  totalRounds: rc.totalRounds ?? 0,
});

/** Walk the chain for the tts field: i18n key | DONT_SPEAK | INHERITED. */
const resolveTtsKey = (
  inOrder: (EventBindingsMap | undefined)[],
  event: LifecycleEvent,
  variant: Talkativeness,
): string | null | undefined => {
  for (const layer of inOrder) {
    const binding = layer?.[event];
    if (binding === undefined) continue; // event INHERITED at this layer
    const tts = binding.tts;
    if (tts === undefined) continue; // tts INHERITED at this layer
    if (tts === null) return null; // DONT_SPEAK for all variants — stop
    const v = tts[variant];
    if (v === undefined) continue; // this variant INHERITED — fall through
    return v; // i18n key, or null = DONT_SPEAK for this variant — stop
  }
  return undefined; // no layer bound it
};

/** Walk the chain for the soundEffect field, independently of tts (§9.3). */
const resolveSoundEffect = (
  inOrder: (EventBindingsMap | undefined)[],
  event: LifecycleEvent,
): ResolveOutput['soundEffect'] => {
  for (const layer of inOrder) {
    const binding = layer?.[event];
    if (binding === undefined) continue;
    if (binding.soundEffect === undefined) continue; // INHERITED
    return binding.soundEffect; // bound, or null = explicit silence — stop
  }
  return null;
};

/**
 * Pure function (spec §9.1): no flags awareness, no subscriptions, no side
 * effects beyond the DEV warn. Layer order per §9.2; `skin` is always
 * undefined in M1 (M3 reservation) — one cheap branch.
 */
export const resolveTemplate = (input: ResolveInput): ResolveOutput => {
  const { event, variant, gameId, layers, roundContext, t, i18n } =
    input;
  const inOrder = [
    layers.customConfig,
    layers.skin,
    layers.definition,
    layers.defaults,
  ];

  const soundEffect = resolveSoundEffect(inOrder, event);

  const key = resolveTtsKey(inOrder, event, variant);
  if (key === null || key === undefined)
    return { text: null, soundEffect };

  if (!i18n.exists(key)) {
    devWarn(`Missing translation key: ${key}`);
    return { text: null, soundEffect };
  }

  const text = t(key, buildInterpolation(roundContext, gameId));
  if (text.includes('{{') || text.includes('}}')) {
    devWarn(`Uninterpolated variable in: ${key}`);
    return { text: null, soundEffect };
  }

  return { text, soundEffect };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/resolve.test.ts --reporter=verbose`
Expected: PASS — all eight tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/resolve.ts src/lib/lifecycle-tts/resolve.test.ts
git commit -m "feat(lifecycle-tts): resolveTemplate — 4-layer pure resolver with sentinels + interpolation (spec §9)"
```

---

## Task 3.5: `RoundContext` — Provider + Hook + Module-Level Mirror (spec §9.6)

Closes 2026-06-09 finding C3c: Tasks 8.5 and 13 consume `useRoundContext` / `roundToPayload(…)`, but no task created the context. The module exports four things:

1. **`RoundContextProvider`** — React provider each game component mounts around its playing tree, fed from the same closure that already computes the round (e.g. `roundOrder[engineRoundIndex]` in `NumberMatch.tsx:127`). Mount sites are wired in Task 15 alongside `QuestionRow`.
2. **`useRoundContext()`** — throwing hook for in-tree consumers (AudioButton payloads, Task 13).
3. **`roundToPayload(rc)`** — maps a `RoundContextValue | null` to a `SpeakPayload | null` for tap-to-speak surfaces (§6.1.1): the subject comes from the live round's `currentTarget`; `text` stays undefined so the actor resolves copy via `resolveTemplate`.
4. **A module-level mirror** — `getActiveRoundContext(): RoundContextValue | null`, updated by the provider and cleared on unmount. The app-level actor (Tasks 8/8.5) is mounted **above** the games and cannot call hooks; the Provider injects this getter into the machine input so `resolveAndDispatchSpeech` can resolve with current round data — including the §6.6 re-fire after `SETTINGS_CHANGED`, which must re-interpolate against the live round. Exactly one game is active at a time, so a single slot is safe (same singleton rationale as the bus).

**Files:**

- Create: `src/lib/lifecycle-tts/round-context.tsx`
- Create: `src/lib/lifecycle-tts/round-context.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/round-context.test.tsx` asserting: (a) `useRoundContext` throws outside the provider; (b) returns the value inside it; (c) `getActiveRoundContext()` mirrors the latest provider value; (d) returns `null` again after the provider unmounts; (e) `roundToPayload(null)` is `null` and `roundToPayload(rc)` carries `subjectToken(rc.currentTarget)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/round-context.test.tsx --reporter=verbose`
Expected: FAIL — module not created.

- [ ] **Step 3: Implement**

```tsx
import {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from 'react';
import { subjectToken } from './types';
import type { RoundContextValue, SpeakPayload } from './types';

const RoundContext = createContext<RoundContextValue | null>(null);

// Module-level mirror for the app-level actor, which mounts above the
// games and cannot read React context. One game is active at a time, so
// a single slot is safe (same singleton rationale as the bus).
let activeRoundContext: RoundContextValue | null = null;
export const getActiveRoundContext = (): RoundContextValue | null =>
  activeRoundContext;

export const RoundContextProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: RoundContextValue }>) => {
  useEffect(() => {
    activeRoundContext = value;
  }, [value]);
  useEffect(
    () => () => {
      activeRoundContext = null;
    },
    [],
  );
  return (
    <RoundContext.Provider value={value}>
      {children}
    </RoundContext.Provider>
  );
};

export const useRoundContext = (): RoundContextValue => {
  const ctx = useContext(RoundContext);
  if (!ctx)
    throw new Error('useRoundContext requires <RoundContextProvider>');
  return ctx;
};

// §6.1.1 — tap payloads derive their subject from the live round; `text`
// stays undefined so the actor resolves copy via resolveTemplate.
export const roundToPayload = (
  rc: RoundContextValue | null,
): SpeakPayload | null =>
  rc ? { subject: subjectToken(rc.currentTarget) } : null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/round-context.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/round-context.tsx src/lib/lifecycle-tts/round-context.test.tsx
git commit -m "feat(lifecycle-tts): RoundContext provider + hook + actor-readable mirror (spec §9.6)"
```

---

## Task 4: `game.prepare` + lifecycle bus events — two-tier `BaseGameEvent` restructure

This task lands the full bus-event surface the actor runtime needs (spec §4.3 + §4.3.1, issues #38 / #40):

- a new `game.prepare` event (non-round, emitted by `GameOptionsOverlay`);
- four new lifecycle event literals/interfaces (`lifecycle.cancel`, `lifecycle.tts.played`, `lifecycle.tts.unavailable`, `lifecycle.tts.cloud-fallback`);
- the **two-tier `BaseGameEvent` restructure** — `roundIndex` moves off the base envelope into a new `RoundScopedGameEvent` tier so non-round events stop fabricating a meaningless value.

`lifecycle.speak` already exists in `GameEventType` — no work needed for that event.

**Files:**

- Modify: `src/types/game-events.ts` (two-tier base + new `GameEventType` literals + new event interfaces + `GameEvent` union members)
- Modify: every emit/consume site the discriminated-union split surfaces as a typecheck error (compiler-guided migration — only `useGameSkin.ts` `onRoundComplete` reads the envelope `roundIndex` today, but the union change forces each non-round emit site to drop the fabricated `roundIndex`)
- Test: `src/lib/game-event-bus.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/lib/game-event-bus.test.ts`. Note `GamePrepareEvent extends BaseGameEvent` — it is **non-round**, so the literal carries **no** `roundIndex` (two-tier `BaseGameEvent` reclassification, Step 3):

```ts
import { getGameEventBus } from './game-event-bus';
import type { GamePrepareEvent } from '@/types/game-events';

describe('game.prepare event', () => {
  it('emits and receives a typed game.prepare event', () => {
    const bus = getGameEventBus();
    const received: GamePrepareEvent[] = [];
    const unsub = bus.subscribe('game.prepare', (e) =>
      received.push(e as GamePrepareEvent),
    );

    const event: GamePrepareEvent = {
      type: 'game.prepare',
      gameId: 'word-spell',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      // no roundIndex — game.prepare is non-round (spec §4.3.1)
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('game.prepare');
    unsub();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: FAIL — `GamePrepareEvent` not exported, `'game.prepare'` not assignable to `GameEventType`.

- [ ] **Step 3: Apply the two-tier base + new events to `game-events.ts`**

Apply all of the following to `src/types/game-events.ts` (spec §4.3 + §4.3.1). `LifecycleEvent`, `LifecycleSubject`, `Talkativeness` come from `@/lib/lifecycle-tts/types`.

```ts
// src/types/game-events.ts

// (a) Two-tier base — #40
export interface BaseGameEvent {
  type: GameEventType;
  gameId: string;
  sessionId: string;
  profileId: string;
  timestamp: number;
  // roundIndex REMOVED from base — see RoundScopedGameEvent below
}

export interface RoundScopedGameEvent extends BaseGameEvent {
  roundIndex: number;
}

// (b) Reclassify:
//   - Round-scoped (extends RoundScopedGameEvent): game.action, game.evaluate, game.score,
//     game.hint, game.retry, game.time_up, game.round-advance, game.drag-start,
//     game.drag-over-zone, game.tile-ejected
//   - Non-round (extends BaseGameEvent): game.start, game.instructions_shown, game.end,
//     game.level-advance, celebration.start, celebration.complete, celebration.skip
//   - Dual-natured (extends BaseGameEvent + own optional roundIndex?): LifecycleSpeakEvent

// (c) GameEventType — add 4 new lifecycle literals (#38)
export type GameEventType =
  | 'game.start'
  | 'game.prepare' // Task 4 addition
  | /* …existing entries unchanged… */
  | 'lifecycle.speak'
  | 'lifecycle.cancel' // NEW
  | 'lifecycle.tts.played' // NEW
  | 'lifecycle.tts.unavailable' // NEW
  | 'lifecycle.tts.cloud-fallback'; // NEW

// (d) game.prepare — non-round, no roundIndex
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game.prepare';
}

// (e) New lifecycle event interfaces
export interface LifecycleCancelEvent extends BaseGameEvent {
  type: 'lifecycle.cancel';
}

export interface LifecycleTtsPlayedEvent extends BaseGameEvent {
  type: 'lifecycle.tts.played';
  lifecycleEvent: LifecycleEvent;
  subject: LifecycleSubject | null;
  source: 'auto' | 'user';
  variant: Talkativeness;
  durationMs: number;
  roundIndex?: number; // dual-natured (round verbs only)
}

// Availability SIGNALS, not game events: emitted by the speaker (Task 6),
// which has no game envelope in scope — deliberately do NOT extend
// BaseGameEvent (no gameId/sessionId/profileId/roundIndex). `subject`
// carries the locale that failed or fell back (§4.3).
export interface LifecycleTtsUnavailableEvent {
  type: 'lifecycle.tts.unavailable';
  subject: LifecycleSubject;
  timestamp: number;
}

export interface LifecycleTtsCloudFallbackEvent {
  type: 'lifecycle.tts.cloud-fallback';
  subject: LifecycleSubject;
  timestamp: number;
}

// (f) GameEvent discriminated union — add new members
export type GameEvent =
  | GameStartEvent
  | GamePrepareEvent
  | /* …existing entries unchanged… */
  | LifecycleSpeakEvent
  | LifecycleCancelEvent
  | LifecycleTtsPlayedEvent
  | LifecycleTtsUnavailableEvent
  | LifecycleTtsCloudFallbackEvent;
```

The discriminated union makes TypeScript enumerate every emit/consume site that needs updating — the migration is compiler-guided. Walk each typecheck error: non-round emit sites drop the fabricated `roundIndex`; round-scoped events that previously relied on the base field now `extends RoundScopedGameEvent`. `LifecycleSpeakEvent` becomes **dual-natured** — `extends BaseGameEvent` with its own optional `roundIndex?: number`, set only for round verbs (`round.start`, `round.error`), absent for game-level verbs (`game.prepare`, `game.start`, `level.complete`).

- [ ] **Step 4: Run test + typecheck to verify they pass**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose && yarn typecheck`
Expected: PASS — `game.prepare` round-trips; the two-tier split typechecks across every emit/consume site (fix each compiler error per Step 3).

- [ ] **Step 5: Commit**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(events): two-tier BaseGameEvent + game.prepare + lifecycle event interfaces (#38, #40)"
```

---

## Task 5: Add `talkativeness` to `SettingsDoc` (v4 migration) + `gradeBand` to per-game config

This is the load-bearing settings refactor. Two parallel changes, **kept in one task** because they together replace the legacy `ttsEnabled` field everywhere (164 references across 85 files via `rg --count-matches ttsEnabled src/` on master HEAD `694797af9`):

1. **User-level `SettingsDoc` gains `talkativeness`** (spec §5.1 + §5.5) — RxDB v3→v4 migration. Read via the canonical `useSettings()` hook ([src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts)); written via the existing `update()` helper. Spec §13.1.B #11 lock — talkativeness is a **user setting, not a per-game knob** — one custom game cannot override the parent's chosen verbosity.
2. **Per-game `AnswerGameConfig` gains `gradeBand`** (per-level tuning, not per-user). The legacy `ttsEnabled` field is dropped here too — auto-speech is now derived from `talkativeness !== 'on-demand'` (§5.3); on-demand speech (taps) is **never gated** by `talkativeness` per §5.4 (no hard-mute — OS volume slider is the escape hatch).

**Why no `autoSpeak` or `ttsOnDemandAllowed` fields** (vs the 2026-05-13 plan draft): `autoSpeak` is derived (`talkativeness !== 'on-demand'`) so storing it duplicates state. `ttsOnDemandAllowed` is rejected by §5.4 — there is no setting that disables tap-to-speak. See Spec Delta 2.

**Files:**

- Modify: `src/db/schemas/settings.ts` — full v4 schema per §5.8
- Create: `src/db/migrations/lifecycle-tts-settings-v4.ts` — allowlist migration (§5.8/§5.9)
- Modify: `src/db/create-database.ts` — register strategy `4:` (without this the migration never runs)
- Modify: `src/db/hooks/useSettings.ts` — extend `DEFAULT_SETTINGS`
- Modify: `src/components/answer-game/types.ts` — drop `ttsEnabled`, add `gradeBand: GradeBand`
- Modify: `src/games/spot-all/types.ts` — same shape change on `SpotAllConfig`
- Modify: every consumer of `config.ttsEnabled` (run `rg ttsEnabled src/` for the full list)
- Modify: every test fixture / mock config
- Create: `src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts` (mirror existing `word-spell-multi-level.collection.test.ts`)

### Sub-task 5A: `SettingsDoc` v4 migration (talkativeness + useOfflineVoicesOnly)

- [ ] **Step 1: Write the failing migration test**

Create `src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts` mirroring the pattern in [src/db/migrations/word-spell-multi-level.collection.test.ts](../../src/db/migrations/word-spell-multi-level.collection.test.ts). Assert:

```ts
// v3 doc with ttsEnabled: false migrates to v4 talkativeness: 'on-demand'
expect(migrated.talkativeness).toBe('on-demand');
expect(migrated.useOfflineVoicesOnly).toBe(true);
// 'ttsEnabled' must be gone from the v4 doc
expect(
  (migrated as Record<string, unknown>).ttsEnabled,
).toBeUndefined();

// v3 doc with ttsEnabled: true migrates to v4 talkativeness: 'helpful'
expect(migrated2.talkativeness).toBe('helpful');

// Untouched fields preserved
expect(migrated.speechRate).toBe(1.2);
expect(migrated.preferredVoiceURI).toBe('Karen');

// Non-leakage (REQUIRED by spec §5.8/§5.9): an unknown legacy field on
// the v3 source doc is dropped by the allowlist — it never reaches v4,
// where additionalProperties: false would reject it.
const v3WithLeak = {
  ...v3Doc,
  legacyDebugFlag: 'leaked',
} as SettingsDocV3 & { legacyDebugFlag: string };
const migrated3 = migrateSettingsV4(v3WithLeak);
expect(migrated3).not.toHaveProperty('legacyDebugFlag');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts --reporter=verbose`
Expected: FAIL — schema is still v3.

- [ ] **Step 3: Implement v4 schema + migration**

In `src/db/schemas/settings.ts`, replace the v3 schema with the v4 schema from spec §5.8 in full. Because master enforces `additionalProperties: false`, **every field must be declared explicitly**. Preserve `speechRate` (range 0.5..2, default 1), `preferredVoiceURI`, `preferredVoiceDeviceId`, `activeLanguage` (default `'en-AU'` per [project_default_language_en_au](../../../../.claude/projects/-Users-leocaseiro-Sites-base-skill/memory/project_default_language_en_au.md)), all volume fields, `tapForgivenessThreshold/TimeMs`, `showSubtitles`, `themeId`, etc. Drop `ttsEnabled`. Add `talkativeness` (enum `['on-demand', 'helpful', 'chatty']`, default `'helpful'`) and `useOfflineVoicesOnly` (boolean, default `true`).

Create `src/db/migrations/lifecycle-tts-settings-v4.ts` exporting the migration as a named, unit-testable function — **explicit field allowlist, never `{ ...rest }` spread** (spec §5.9: under `additionalProperties: false`, a spread leaks unknown legacy fields that the v4 schema then rejects at validation). Spec §5.8 verbatim:

```ts
// src/db/migrations/lifecycle-tts-settings-v4.ts
import type { SettingsDoc, SettingsDocV3 } from '@/db/schemas/settings';

// v3 → v4 — explicit field allowlist; no `{ ...rest }` spread (§5.9).
// `additionalProperties: false` in the v4 schema would reject any legacy
// field that leaked through, so we enumerate every v3 field that survives.
export const migrateSettingsV4 = (
  oldDoc: SettingsDocV3,
): SettingsDoc => ({
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
  talkativeness: oldDoc.ttsEnabled === false ? 'on-demand' : 'helpful',
  useOfflineVoicesOnly: true, // privacy-safe default
  // `ttsEnabled` is intentionally dropped — replaced by `talkativeness`.
  // Any other unknown legacy field on `oldDoc` is also dropped because
  // this allowlist never references it.
});
```

Bump the schema version: `version: 4` (was `3`).

**Register the migration in `src/db/create-database.ts`** — without this it never runs and existing IndexedDB docs fail to load. Strategies 1–3 live inline under `settings.migrationStrategies`; follow the `migrateWordSpellConfig` import pattern for the testable v4:

```ts
// src/db/create-database.ts
import { migrateSettingsV4 } from '@/db/migrations/lifecycle-tts-settings-v4';

// … in the collections map:
settings: {
  schema: settingsSchema,
  migrationStrategies: {
    1: /* unchanged */,
    2: /* unchanged */,
    3: /* unchanged */,
    4: migrateSettingsV4,
  },
},
```

- [ ] **Step 4: Extend `DEFAULT_SETTINGS` in `useSettings.ts` + export it and `UseSettingsResult`**

In `src/db/hooks/useSettings.ts`, update `DEFAULT_SETTINGS` so first-paint (before RxDB resolves the live doc) carries v4 defaults. **Also add the `export` keyword to both `DEFAULT_SETTINGS` and the `UseSettingsResult` type** — Task 8.5's `src/lib/lifecycle-tts/pick-tts-settings.ts` imports both (`import { DEFAULT_SETTINGS } from '@/db/hooks/useSettings'` for boundary defaults and `import type { UseSettingsResult } from '@/db/hooks/useSettings'` for the `settings` slice type). They are module-private on master, so the import would fail to compile without this change:

```ts
// const DEFAULT_SETTINGS  →  export const DEFAULT_SETTINGS
export const DEFAULT_SETTINGS: Omit<SettingsDoc, 'updatedAt'> = {
  // ... existing
  talkativeness: 'helpful',
  useOfflineVoicesOnly: true,
};

// type UseSettingsResult  →  export type UseSettingsResult
// (the existing return-type alias of useSettings; just add `export`)
export type UseSettingsResult = {
  settings: SettingsDoc;
  update: (patch: Partial<SettingsDoc>) => Promise<void>;
};
```

Drop `ttsEnabled: true` from the default block. The `useSettings()` hook's API (`{ settings, update }`) is unchanged — consumers just read `settings.talkativeness` instead of `settings.ttsEnabled`. (If `useSettings.ts` does not currently declare a named `UseSettingsResult` alias, extract its inline return type into one and export it; reconcile the exact field shape against the existing implementation.)

- [ ] **Step 5: Verify migration test passes**

Run: `npx vitest run src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts --reporter=verbose`
Expected: PASS (both `ttsEnabled: true/false` branches + untouched-field preservation).

### Sub-task 5B: Per-game `AnswerGameConfig` — drop `ttsEnabled`, add `gradeBand`

- [ ] **Step 6: Write the failing config-shape test**

Add to `src/components/answer-game/AnswerGameProvider.test.tsx` (or create a new `config-shape.test.tsx`):

```ts
import { describe, expect, it } from 'vitest';
import type { AnswerGameConfig } from './types';

describe('AnswerGameConfig shape (M1)', () => {
  it('accepts gradeBand (per-game tuning)', () => {
    const cfg: AnswerGameConfig = {
      gameId: 'word-spell',
      inputMethod: 'drag',
      wrongTileBehavior: 'reject',
      tileBankMode: 'exact',
      totalRounds: 5,
      gradeBand: 'pre-k',
    };
    expect(cfg.gradeBand).toBe('pre-k');
  });

  it('rejects the legacy ttsEnabled field at the type level', () => {
    // @ts-expect-error — ttsEnabled removed in M1 (talkativeness moved to SettingsDoc)
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

  it('does NOT carry talkativeness on per-game config (it lives on SettingsDoc)', () => {
    // @ts-expect-error — talkativeness is user-level, not per-game (spec §5.5, §13.1.B #11)
    const _wrong: AnswerGameConfig = {
      gameId: 'word-spell',
      inputMethod: 'drag',
      wrongTileBehavior: 'reject',
      tileBankMode: 'exact',
      totalRounds: 5,
      talkativeness: 'helpful',
    };
    expect(_wrong).toBeDefined();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/AnswerGameProvider.test.tsx --reporter=verbose`
Expected: FAIL on the first test (`gradeBand` not on type); the `@ts-expect-error` cases need the field absent — flips after Step 8.

Also run: `yarn typecheck` — expect failures across the codebase from the inventory in the sub-task 5C below.

- [ ] **Step 8: Update `AnswerGameConfig` types**

In `src/components/answer-game/types.ts`, **delete** line 17 (`ttsEnabled: boolean`) and add:

```ts
/** Grade band — drives round.idle nudge timing (spec §10.1) and future per-band tuning. Not part of copy resolution (§9 resolves per-variant). */
gradeBand: GradeBand;
```

Add import at the top of the file:

```ts
import type { GradeBand } from '@/types/game-events';
```

**Do NOT add `talkativeness`, `autoSpeak`, or `ttsOnDemandAllowed` fields here** — `talkativeness` lives on `SettingsDoc` (sub-task 5A); auto-speech is derived from `talkativeness !== 'on-demand'`; on-demand speech is never gated per §5.4. See Spec Delta 2.

In `src/games/spot-all/types.ts` (find the `ttsEnabled: boolean` field on `SpotAllConfig`), apply the same change — drop `ttsEnabled`, add `gradeBand: GradeBand`, add the import.

### Sub-task 5C: Migrate all `ttsEnabled` consumers

- [ ] **Step 9: Inventory current `ttsEnabled` references**

Run: `rg --count-matches ttsEnabled src/ | sort -rn -t: -k2 | head -25`

Expected: **164 references across 85 files** (verified on origin/master HEAD `694797af9`). Spans config types, hook gates, button rendering, question onClick handlers, test fixtures, story files, per-game `ConfigField` arrays, `src/lib/config-tags.ts`, and the RxDB schema.

- [ ] **Step 10: Update each consumer (use this classification)**

Don't grep-replace blindly — the semantics differ by call site.

<!-- markdownlint-disable MD060 -->

| Pattern in caller                                                                      | Replaces `ttsEnabled` with                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `if (!ttsEnabled) return` inside a useEffect that auto-speaks on mount or round change | `useSettings().settings.talkativeness !== 'on-demand'` (auto-speech is gated only by user-level talkativeness)                                                                                                             |
| `if (!ttsEnabled) return null` inside AudioButton / question onClick branches          | **Remove the gate entirely** — taps always speak per §5.4. Button always renders.                                                                                                                                          |
| `disabled={!ttsEnabled}` on a button/input that drives on-demand speech                | **Remove the disabled prop** — taps always speak per §5.4.                                                                                                                                                                 |
| Default per-game config construction (e.g. `{ ttsEnabled: true }`)                     | Replace with `{ gradeBand: 'pre-k' }` (spec §5.3 safest default — drop `ttsEnabled`; auto-speech now comes from user-level talkativeness).                                                                                 |
| Test fixture / mock config                                                             | Same as default config construction; talkativeness is mocked at the `useSettings()` level, not per-game.                                                                                                                   |
| Form value binding (`ConfigFormFields`, `useConfigDraft`)                              | Replace `ttsEnabled` checkbox with `gradeBand` select. Talkativeness slider is added separately in `SettingsPanel`, NOT in per-game form (§8.2, §13.1.B #11).                                                              |
| Legacy migration path (RxDB `customGame.config` load)                                  | Map `{ ttsEnabled: false }` to `{ gradeBand: 'pre-k' }` (drop tts field; user-level migration to `talkativeness: 'on-demand'` is handled by the schema migration in sub-task 5A — config-form values do not duplicate it). |

<!-- markdownlint-enable MD060 -->

Per-file checklist (derived from Step 9):

- `src/components/answer-game/useGameTTS.ts` — `speakTile`'s `if (!config.ttsEnabled) return` becomes `if (settings.talkativeness === 'on-demand') return` (read via `useSettings()`). This hook is **deprecated/superseded by the actor** (Tasks 6–8.5) — flip the gate here for any surviving callers and add `@deprecated` JSDoc; remaining call sites migrate to `useLifecycleTts()` / `useSpeakButton()`.
- `src/components/answer-game/useRoundTTS.ts` — file is deleted in Task 11; no migration needed.
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx:174` — file is rewritten in Task 16; no per-line migration needed.
- `src/components/questions/AudioButton/AudioButton.tsx` — **drop the gate entirely** (Task 13); button always renders.
- `src/components/questions/TextQuestion/TextQuestion.tsx` — drop the `if (!ttsEnabled) return` on onClick (Task 14).
- `src/components/questions/ImageQuestion/ImageQuestion.tsx` — same.
- `src/components/questions/EmojiQuestion/EmojiQuestion.tsx` — same.
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — same.
- `src/components/SettingsPanel/SettingsPanel.tsx` — add the Talkativeness slider per §8.2 (3 stops: 🤫 Shhh / 💬 Talk a bit / 🗣️ Talk a lot) wired via `useSettings().update({ talkativeness })`. The legacy `ttsEnabled` toggle is removed.
- `src/components/AdvancedConfigModal.tsx` — bind `gradeBand` select. **No Talkativeness here** (it lives in SettingsPanel).
- `src/components/answer-game/useDraggableTile.ts` + `.test.tsx` — auto-speech gates flip to `settings.talkativeness !== 'on-demand'`.
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — same.
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — same.
- `src/games/word-spell/WordSpell/WordSpell.tsx` — same.
- Per-game `*ConfigFields: ConfigField[]` arrays (`number-match/types.ts:138`, `sort-numbers/types.ts:168`, `word-spell/types.ts:124`, `spot-all/types.ts`) — replace `ttsEnabled` checkbox with `gradeBand` select.
- `src/lib/config-tags.ts:10` + `src/lib/config-tags.test.ts` — replace the `ttsEnabled` tag (`'TTS on'` / `null`) with the new tagging convention (drop the tag, or map to `gradeBand`).
- All `*.config-form.stories.tsx` story files — update mock configs (drop `ttsEnabled`, add `gradeBand`).
- All `*.test.tsx` files — update fixtures. Talkativeness mocks go on `useSettings()` mocks.

For each file: edit, run its test file (`npx vitest run <file>.test.tsx`), confirm green, move to the next. **Split sub-task 5C into baby-step commits per logical group** (per CLAUDE.md baby-step convention + user's `feedback_commit_as_checkpoint` preference): (5c.1) hook gates (useGameTTS + useDraggableTile), (5c.2) component gates (AudioButton + 4 question components — these become unconditional taps), (5c.3) game runtime (NumberMatch/WordSpell/SortNumbers/SpotAll), (5c.4) SettingsPanel + AdvancedConfigModal + ConfigFormFields, (5c.5) stories + tests + `config-tags.ts`.

- [ ] **Step 11: Run the full test suite + typecheck**

```bash
yarn typecheck
npx vitest run
```

Expected: PASS / 0 errors. If any file still references `ttsEnabled`, fix it before the task closes (or document it as a known follow-up in the task's commit message).

- [ ] **Step 12: Commit (multi-commit per sub-task per baby-step convention)**

Suggested commit sequence (one commit per sub-task above):

```bash
# 5A — schema + DEFAULT_SETTINGS
git add src/db/schemas/settings.ts src/db/create-database.ts src/db/hooks/useSettings.ts src/db/migrations/lifecycle-tts-settings-v4.ts src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts
git commit -m "feat(settings): add talkativeness + useOfflineVoicesOnly to SettingsDoc; v3→v4 RxDB migration"

# 5B — per-game type + gradeBand
git add src/components/answer-game/types.ts src/games/spot-all/types.ts src/components/answer-game/AnswerGameProvider.test.tsx
git commit -m "feat(answer-game): add gradeBand to AnswerGameConfig; drop ttsEnabled (moved to user SettingsDoc)"

# 5C.1 — hook gates
git add src/components/answer-game/useGameTTS.ts src/components/answer-game/useGameTTS.test.tsx src/components/answer-game/useDraggableTile.ts src/components/answer-game/useDraggableTile.test.tsx
git commit -m "refactor(answer-game): hook auto-speech gates read talkativeness from useSettings()"

# 5C.2 — question components (drop on-demand gates)
git add src/components/questions/
git commit -m "refactor(questions): drop ttsEnabled gate on AudioButton + 4 question components (taps always speak per spec §5.4)"

# 5C.3 — game runtime
git add src/games/
git commit -m "refactor(games): NumberMatch/WordSpell/SortNumbers/SpotAll auto-speech gates read talkativeness from useSettings()"

# 5C.4 — settings + advanced config
git add src/components/SettingsPanel/ src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(settings-panel): add Talkativeness slider; drop ttsEnabled toggle; AdvancedConfigModal gains gradeBand select"

# 5C.5 — stories + tests + config-tags
git add 'src/**/*.stories.tsx' 'src/**/*.test.tsx' src/lib/config-tags.ts src/lib/config-tags.test.ts
git commit -m "chore(test+story): migrate ttsEnabled fixtures to talkativeness + gradeBand"
```

---

## Task 6: `WebSpeechSpeaker` — Speaker adapter + Chrome watchdogs

The actor invokes a `Speaker` to perform speech. `WebSpeechSpeaker` is the Web Speech API implementation: it centralizes every Chrome/Safari/Firefox workaround (keepalive timer, end-event watchdog, `voiceschanged` cache, rAF cancel guard) and implements the §5.7 offline-voice ladder in `pickVoice()`. It is constructed **inside `LifecycleTtsProvider`** (Task 8.5) and handed to the machine via input — never a module global.

**Files:**

- Create: `src/lib/lifecycle-tts/speaker.ts` (the `Speaker` + `SoundEffectPlayer` interfaces, spec §7.1)
- Create: `src/lib/lifecycle-tts/errors.ts` (`LocalVoiceUnavailableError`)
- Create: `src/lib/lifecycle-tts/web-speech-speaker.ts`
- Create: `src/lib/lifecycle-tts/web-speech-speaker.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/web-speech-speaker.test.ts`. The matrix covers the spec §12.1 Speaker inventory: resolve on `onend`, reject on `cancel()`, watchdog timeout, voice cache + `voiceschanged`, the offline-voice ladder (filter by `localService`, fail-closed under `useOfflineVoicesOnly: true`, cloud-fallback signal when `false`), Chrome Android `u.lang = voice.lang`, and pre-speak `resume()`:

```ts
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { WebSpeechSpeaker } from './web-speech-speaker';
import { LocalVoiceUnavailableError } from './errors';
import type { TtsSettings } from './types';

const baseSettings: TtsSettings = {
  talkativeness: 'helpful',
  useOfflineVoicesOnly: true,
  speechRate: 1,
  voiceVolume: 0.8,
  soundEffectsVolume: 0.8,
  preferredVoiceURI: '',
  preferredVoiceDeviceId: '',
  activeLanguage: 'en-AU',
};

const makeVoice = (
  over: Partial<SpeechSynthesisVoice>,
): SpeechSynthesisVoice =>
  ({
    name: 'Karen',
    lang: 'en-AU',
    voiceURI: 'Karen',
    localService: true,
    default: false,
    ...over,
  }) as SpeechSynthesisVoice;

let utter: {
  onend?: () => void;
  onerror?: (e: unknown) => void;
} | null;
const synth = {
  speaking: false,
  paused: false,
  speak: vi.fn((u: typeof utter) => {
    utter = u;
  }),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [makeVoice({})]),
  addEventListener: vi.fn(),
};

const fakeBus = { emit: vi.fn() };

beforeEach(() => {
  utter = null;
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      lang = '';
      volume = 1;
      rate = 1;
      pitch = 1;
      onend: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    cb();
    return 1;
  });
  vi.useFakeTimers();
  synth.speak.mockClear();
  synth.cancel.mockClear();
  synth.resume.mockClear();
  fakeBus.emit.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('WebSpeechSpeaker', () => {
  it('resolves the speak() promise on utterance onend', async () => {
    const speaker = new WebSpeechSpeaker(
      baseSettings,
      fakeBus as never,
    );
    const p = speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    utter?.onend?.();
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects the in-flight promise with "cancelled" on cancel()', async () => {
    const speaker = new WebSpeechSpeaker(
      baseSettings,
      fakeBus as never,
    );
    const p = speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    speaker.cancel();
    await expect(p).rejects.toThrow('cancelled');
  });

  it('rejects with "speech-timeout" after the watchdog fires', async () => {
    const speaker = new WebSpeechSpeaker(
      baseSettings,
      fakeBus as never,
    );
    const p = speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    vi.advanceTimersByTime(30_000);
    await expect(p).rejects.toThrow('speech-timeout');
  });

  it('fails closed (throws LocalVoiceUnavailableError) when no local voice + useOfflineVoicesOnly: true', async () => {
    synth.getVoices.mockReturnValueOnce([
      makeVoice({ lang: 'fr-FR', localService: true }),
    ]);
    const speaker = new WebSpeechSpeaker(
      baseSettings,
      fakeBus as never,
    );
    const p = speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    await expect(p).rejects.toBeInstanceOf(LocalVoiceUnavailableError);
    expect(fakeBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lifecycle.tts.unavailable' }),
    );
  });

  it('emits cloud-fallback and returns no voice when empty + useOfflineVoicesOnly: false', async () => {
    synth.getVoices.mockReturnValueOnce([
      makeVoice({ lang: 'fr-FR', localService: false }),
    ]);
    const speaker = new WebSpeechSpeaker(
      { ...baseSettings, useOfflineVoicesOnly: false },
      fakeBus as never,
    );
    const p = speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    utter?.onend?.();
    await expect(p).resolves.toBeUndefined();
    expect(fakeBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lifecycle.tts.cloud-fallback' }),
    );
  });

  it('calls synth.resume() before speaking when paused', () => {
    synth.paused = true;
    const speaker = new WebSpeechSpeaker(
      baseSettings,
      fakeBus as never,
    );
    void speaker.speak({
      text: 'hi',
      locale: 'en-AU',
      voiceURI: undefined,
    });
    expect(synth.resume).toHaveBeenCalled();
    synth.paused = false;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/web-speech-speaker.test.ts --reporter=verbose`
Expected: FAIL — `WebSpeechSpeaker` / `LocalVoiceUnavailableError` not exported.

- [ ] **Step 3: Implement the adapter interfaces + error**

Create `src/lib/lifecycle-tts/speaker.ts` (spec §7.1):

```ts
// src/lib/lifecycle-tts/speaker.ts
import type { TtsSettings } from './types';
import type { SoundKey } from '@/lib/audio/AudioFeedback';

export interface SpeechUtterance {
  text: string;
  locale: string;
  voiceURI: string | undefined;
}

export interface Speaker {
  speak(utterance: SpeechUtterance): Promise<void>; // resolves on natural end
  cancel(): void; // sync; rejects in-flight promise with 'cancelled'
  updateSettings(next: TtsSettings): void; // for voice + volume + rate changes
  dispose(): void; // cleanup timers + listeners
}

export interface SoundEffectRequest {
  key: SoundKey; // matches AudioFeedback's SoundKey
  volume: number; // 0..1, threaded from settings per-call
}

export interface SoundEffectPlayer {
  play(req: SoundEffectRequest): Promise<void>; // resolves on audio 'ended'
  cancel(): void; // stops current; rejects in-flight
}
```

Create `src/lib/lifecycle-tts/errors.ts` (spec §7.2):

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

- [ ] **Step 4: Implement `WebSpeechSpeaker`**

Create `src/lib/lifecycle-tts/web-speech-speaker.ts` (spec §7.2 verbatim — the bus is injected so `pickVoice()` can emit the §5.7 signals; `subjectToken` brands the locale string):

```ts
// src/lib/lifecycle-tts/web-speech-speaker.ts
import { LocalVoiceUnavailableError } from './errors';
import type { Speaker, SpeechUtterance } from './speaker';
import { subjectToken } from './types';
import type { TtsSettings } from './types';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
import type { TypedGameEventBus } from '@/lib/game-event-bus';

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
        timestamp: Date.now(),
      });
      throw new LocalVoiceUnavailableError(locale);
    }
    // Step 6: cloud-fallback path — emit signal, return undefined so
    // browser picks its default voice. Best-effort.
    this.bus.emit({
      type: 'lifecycle.tts.cloud-fallback',
      subject: subjectToken(locale),
      timestamp: Date.now(),
    });
    return undefined;
  }
}
```

Browser-quirk mitigations summary (spec §7.2):

- Chromium 40747712 — synth freezes after ~15s → `tickKeepalive()` pause+resume every 10s while speaking.
- Chrome Android — `voice` alone doesn't apply locale → `u.lang = voice.lang` always set when voice is picked.
- `onend` never fires on some Linux/Chrome builds → `SPEECH_WATCHDOG_MS = 30000` force-finalize timer.
- Chrome — cancel→speak too fast silently drops → `requestAnimationFrame` defers `synth.speak()` one frame.
- `getVoices()` returns `[]` before `voiceschanged` → `warmVoiceCache()` + `voiceschanged` listener via `safeGetVoices`.
- iOS Brave returns broken voice objects → `safeGetVoices()` filters them (already on master).
- Stale handlers fire after unmount → `finalize()` clears all listeners; `dispose()` clears keepalive.

The bus emits at the §5.7 ladder are how M1 integrates with PR #409's `VoiceUnavailableDialogProvider`: the speaker emits `lifecycle.tts.unavailable`; the `useLifecycleTtsUnavailableHandler` hook (Task 8.5) subscribes and drives the existing AlertDialog. The speaker never owns a dialog.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/web-speech-speaker.test.ts --reporter=verbose`
Expected: PASS — all Speaker cases green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/lifecycle-tts/speaker.ts src/lib/lifecycle-tts/errors.ts src/lib/lifecycle-tts/web-speech-speaker.ts src/lib/lifecycle-tts/web-speech-speaker.test.ts
git commit -m "feat(lifecycle-tts): WebSpeechSpeaker adapter + Chrome watchdogs + offline-voice ladder (spec §7.1, §7.2)"
```

---

## Task 7: `HtmlAudioSoundEffectPlayer` — sound-effect adapter

The actor's second `invoke`d adapter. Plays SFX clips via a fresh `<audio>` element, resolving on `ended` and rejecting on `cancel()` — the promise semantics the machine's parallel SFX channel needs.

**Files:**

- Create: `src/lib/lifecycle-tts/html-audio-sound-effect-player.ts`
- Create: `src/lib/lifecycle-tts/html-audio-sound-effect-player.test.ts`
- Modify: `src/lib/audio/AudioFeedback.ts` — add `export` to `SOUND_PATHS` (module-private on master) + `@deprecated` JSDoc and dev-mode `console.warn` on `playSound` / `queueSound` (§7.3)

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/html-audio-sound-effect-player.test.ts` (spec §12.1 sound-effect inventory: resolve on `ended`, reject on `error`, cancel mid-play rejects, volume threading):

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlAudioSoundEffectPlayer } from './html-audio-sound-effect-player';

class FakeAudio {
  volume = 1;
  currentTime = 0;
  src: string;
  listeners: Record<string, () => void> = {};
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());
  constructor(src: string) {
    this.src = src;
  }
  addEventListener(type: string, cb: () => void) {
    this.listeners[type] = cb;
  }
  fire(type: string) {
    this.listeners[type]?.();
  }
}

let lastAudio: FakeAudio | null = null;

beforeEach(() => {
  lastAudio = null;
  vi.stubGlobal(
    'Audio',
    vi.fn((src: string) => {
      lastAudio = new FakeAudio(src);
      return lastAudio;
    }),
  );
});

describe('HtmlAudioSoundEffectPlayer', () => {
  it('resolves play() on audio "ended"', async () => {
    const player = new HtmlAudioSoundEffectPlayer();
    const p = player.play({ key: 'correct', volume: 0.5 });
    await Promise.resolve();
    lastAudio?.fire('ended');
    await expect(p).resolves.toBeUndefined();
  });

  it('threads volume onto the audio element', async () => {
    const player = new HtmlAudioSoundEffectPlayer();
    void player.play({ key: 'correct', volume: 0.3 });
    await Promise.resolve();
    expect(lastAudio?.volume).toBe(0.3);
  });

  it('rejects play() on audio "error"', async () => {
    const player = new HtmlAudioSoundEffectPlayer();
    const p = player.play({ key: 'correct', volume: 0.5 });
    await Promise.resolve();
    lastAudio?.fire('error');
    await expect(p).rejects.toThrow('sfx-error');
  });

  it('cancel() mid-play rejects the in-flight promise with "cancelled"', async () => {
    const player = new HtmlAudioSoundEffectPlayer();
    const p = player.play({ key: 'correct', volume: 0.5 });
    await Promise.resolve();
    player.cancel();
    await expect(p).rejects.toThrow('cancelled');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/html-audio-sound-effect-player.test.ts --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the player**

Create `src/lib/lifecycle-tts/html-audio-sound-effect-player.ts` (spec §7.3 verbatim):

```ts
// src/lib/lifecycle-tts/html-audio-sound-effect-player.ts
import type { SoundEffectPlayer, SoundEffectRequest } from './speaker';
import { SOUND_PATHS } from '@/lib/audio/AudioFeedback'; // reuse path map only

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

Reuses the `SOUND_PATHS` map from `src/lib/audio/AudioFeedback.ts` as the single source of truth for SFX asset paths. Does **not** reuse `playSound` / `queueSound` — those resolve on start, not end, and have limited cancel control. Give the legacy functions `@deprecated` JSDoc + a dev-mode `console.warn` so no new callers slip in (spec §7.3).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/html-audio-sound-effect-player.test.ts --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/html-audio-sound-effect-player.ts src/lib/lifecycle-tts/html-audio-sound-effect-player.test.ts
git commit -m "feat(lifecycle-tts): HtmlAudioSoundEffectPlayer adapter (spec §7.3)"
```

---

## Task 8: `lifecycleTtsMachine` — XState parallel speech + SFX actor

The coordination core. A singleton machine with two **parallel** sub-machines (speech + soundEffect), a single-current/single-queued speech slot, priority + throttle replace policy, the settings-change drain rule, and `emitTtsPlayed` on speaker resolve with a real `durationMs`. This is where the talkativeness gating lives: `SPEAK_AUTO` is guarded by `autoAllowed` (`talkativeness !== 'on-demand'`, spec §6.1); `SPEAK_USER` is **never** guarded (taps always speak, §5.4).

**Files:**

- Create: `src/lib/lifecycle-tts/lifecycle-tts-machine.ts`
- Create: `src/lib/lifecycle-tts/lifecycle-tts-machine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/lifecycle-tts-machine.test.ts`. Matrix per spec §12.1 Machine inventory — `SPEAK_AUTO` gated by `autoAllowed`; `SPEAK_USER` always preempts; 5 rapid `turn.error` throttle to one speech; higher-priority `round.correct` preempts in-flight `turn.error`; bus `lifecycle.tts.played` emitted on resolve; `SETTINGS_CHANGED chatty → helpful` cancels + re-fires:

```ts
import { createActor } from 'xstate';
import { describe, expect, it, vi } from 'vitest';
import { lifecycleTtsMachine } from './lifecycle-tts-machine';
import type { Speaker } from './speaker';
import type { TtsSettings } from './types';

const settings = (
  talkativeness: TtsSettings['talkativeness'],
): TtsSettings => ({
  talkativeness,
  useOfflineVoicesOnly: true,
  speechRate: 1,
  voiceVolume: 0.8,
  soundEffectsVolume: 0.8,
  preferredVoiceURI: '',
  preferredVoiceDeviceId: '',
  activeLanguage: 'en-AU',
});

const makeSpeaker = (): {
  speaker: Speaker;
  resolveCurrent: () => void;
} => {
  let resolveCurrent = () => {};
  const speaker: Speaker = {
    speak: () =>
      new Promise<void>((res) => {
        resolveCurrent = res;
      }),
    cancel: vi.fn(),
    updateSettings: vi.fn(),
    dispose: vi.fn(),
  };
  return { speaker, resolveCurrent };
};

const fakeBus = { emit: vi.fn(), subscribe: vi.fn() };

// Resolver stub — resolution itself is covered by resolve.test.ts (Task 3).
const stubResolve = () => ({
  text: 'Spell the word cat.',
  soundEffect: null,
});

describe('lifecycleTtsMachine — speech channel gating', () => {
  it('SPEAK_AUTO speaks when talkativeness is helpful (autoAllowed)', () => {
    const { speaker } = makeSpeaker();
    const speakSpy = vi.spyOn(speaker, 'speak');
    const actor = createActor(lifecycleTtsMachine, {
      input: {
        settings: settings('helpful'),
        speaker,
        bus: fakeBus as never,
        resolve: stubResolve,
      },
    }).start();
    actor.send({
      type: 'SPEAK_AUTO',
      event: 'round.start',
      payload: { text: 'Spell the word cat.', lang: 'en-AU' },
    });
    expect(speakSpy).toHaveBeenCalledTimes(1);
  });

  it('SPEAK_AUTO is suppressed when talkativeness is on-demand', () => {
    const { speaker } = makeSpeaker();
    const speakSpy = vi.spyOn(speaker, 'speak');
    const actor = createActor(lifecycleTtsMachine, {
      input: {
        settings: settings('on-demand'),
        speaker,
        bus: fakeBus as never,
        resolve: stubResolve,
      },
    }).start();
    actor.send({
      type: 'SPEAK_AUTO',
      event: 'round.start',
      payload: { text: 'Spell the word cat.', lang: 'en-AU' },
    });
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('SPEAK_USER always speaks even when talkativeness is on-demand (no hard-mute)', () => {
    const { speaker } = makeSpeaker();
    const speakSpy = vi.spyOn(speaker, 'speak');
    const actor = createActor(lifecycleTtsMachine, {
      input: {
        settings: settings('on-demand'),
        speaker,
        bus: fakeBus as never,
        resolve: stubResolve,
      },
    }).start();
    actor.send({
      type: 'SPEAK_USER',
      event: 'round.start',
      payload: { text: 'Spell the word cat.', lang: 'en-AU' },
      variant: 'helpful',
    });
    expect(speakSpy).toHaveBeenCalledTimes(1);
  });

  it('emits lifecycle.tts.played on the bus when the speaker resolves', async () => {
    const { speaker, resolveCurrent } = makeSpeaker();
    fakeBus.emit.mockClear();
    const actor = createActor(lifecycleTtsMachine, {
      input: {
        settings: settings('helpful'),
        speaker,
        bus: fakeBus as never,
        resolve: stubResolve,
      },
    }).start();
    actor.send({
      type: 'SPEAK_AUTO',
      event: 'round.start',
      payload: { text: 'Spell the word cat.', lang: 'en-AU' },
    });
    resolveCurrent();
    await Promise.resolve();
    expect(fakeBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'lifecycle.tts.played',
        lifecycleEvent: 'round.start',
        source: 'auto',
        variant: 'helpful',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lifecycle-tts/lifecycle-tts-machine.test.ts --reporter=verbose`
Expected: FAIL — `lifecycleTtsMachine` not exported.

- [ ] **Step 3: Implement the machine**

Create `src/lib/lifecycle-tts/lifecycle-tts-machine.ts`. The machine skeleton is spec §6.1 verbatim; fill the guard/action bodies from the §6.3 single-current/single-queued slot, the §6.4 priority/throttle tables + `resolveAndDispatchSpeech` algorithm, the §6.6 settings-change drain rule, and the §6.7 `emitTtsPlayed`:

```ts
// src/lib/lifecycle-tts/lifecycle-tts-machine.ts
import { and, setup, fromPromise, assign } from 'xstate';
import type { ResolveOutput } from './resolve';
import type {
  SoundEffectRequest,
  Speaker,
  SpeechUtterance,
} from './speaker';
import type {
  LifecycleEvent,
  LifecycleSubject,
  SpeakPayload,
  Talkativeness,
  TtsSettings,
} from './types';
import type { TypedGameEventBus } from '@/lib/game-event-bus';

// Machine context — §6.3 single-current/single-queued slots + §6.4
// throttle bookkeeping.
type SpeechSlot = {
  payload: SpeakPayload;
  event: LifecycleEvent;
  subject: LifecycleSubject | null;
  source: 'auto' | 'user';
  variant: Talkativeness;
  enqueuedAt: number;
};

type TtsContext = {
  settings: TtsSettings;
  currentSpeech: SpeechSlot | null;
  queuedSpeech: SpeechSlot | null;
  currentSoundEffect: SoundEffectRequest | null;
  lastSpeechEnqueueAt: Partial<Record<LifecycleEvent, number>>;
  lastSoundEffectAt: Partial<Record<LifecycleEvent, number>>;
};

export const lifecycleTtsMachine = setup({
  types: {} as {
    context: TtsContext;
    input: {
      settings: TtsSettings;
      speaker: Speaker;
      bus: TypedGameEventBus;
      // Pre-bound resolver closure (built in Task 8.5): wraps Task 3's
      // resolveTemplate with the registry layers for the event's gameId,
      // DEFAULT_EVENT_BINDINGS, i18n (t + exists), and Task 3.5's
      // getActiveRoundContext() — so the machine stays free of React and
      // i18n imports, and the §6.6 re-fire re-resolves with live data.
      resolve: (
        gameId: string,
        event: LifecycleEvent,
        variant: Talkativeness,
      ) => ResolveOutput;
    }; // all injected by Provider (§7.2.1)
    events:
      | {
          type: 'SPEAK_AUTO';
          event: LifecycleEvent;
          payload: SpeakPayload;
          subject?: LifecycleSubject;
        }
      | {
          type: 'SPEAK_USER';
          event: LifecycleEvent;
          payload: SpeakPayload;
          variant: Talkativeness;
          subject?: LifecycleSubject;
        }
      | { type: 'SETTINGS_CHANGED'; settings: TtsSettings }
      | { type: 'CANCEL' };
  },
  actors: {
    speaker: fromPromise<void, SpeechUtterance>(
      async ({ input }) => speakerAdapter.speak(input),
    ), // speaker from context (§7.2.1)
    soundEffectPlayer: fromPromise<void, SoundEffectRequest>(
      async ({ input }) => soundEffectAdapter.play(input),
    ),
  },
  guards: {
    autoAllowed: ({ context }) =>
      context.settings.talkativeness !== 'on-demand',
    speechNotThrottled: ({ context, event }) => /* see §6.4 */,
    sfxNotThrottled: ({ context, event }) => /* see §6.4 */,
    hasQueuedSpeech: ({ context }) => context.queuedSpeech !== null,
    speechHasBinding: ({ context, event }) =>
      /* resolved binding has tts != null */,
    sfxHasBinding: ({ context, event }) =>
      /* resolved binding has soundEffect != null */,
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
            SPEAK_AUTO: {
              guard: 'autoAllowed',
              actions: 'resolveAndDispatchSpeech',
              target: 'speaking',
            },
            SPEAK_USER: {
              actions: 'resolveAndDispatchSpeech',
              target: 'speaking',
            },
          },
        },
        speaking: {
          invoke: {
            src: 'speaker',
            input: ({ context }) => context.currentSpeech!,
            onDone: [
              {
                guard: 'hasQueuedSpeech',
                actions: ['emitTtsPlayed', 'promoteQueued'],
                target: 'speaking',
                reenter: true,
              },
              {
                actions: ['emitTtsPlayed', 'clearSpeech'],
                target: 'idle',
              },
            ],
            onError: { actions: 'clearSpeech', target: 'idle' },
          },
          on: {
            SPEAK_AUTO: {
              actions: 'resolveAndDispatchSpeech' /* may preempt or queue per §6.4 */,
            },
            SPEAK_USER: {
              actions: ['cancelSpeech', 'resolveAndDispatchSpeech'],
              target: 'speaking',
              reenter: true,
            },
            CANCEL: {
              actions: ['cancelSpeech', 'clearSpeech'],
              target: 'idle',
            },
          },
        },
      },
    },
    soundEffect: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            SPEAK_AUTO: {
              guard: 'sfxHasBinding',
              actions: 'dispatchSoundEffect',
              target: 'playing',
            },
            SPEAK_USER: {
              guard: 'sfxHasBinding',
              actions: 'dispatchSoundEffect',
              target: 'playing',
            },
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
            SPEAK_AUTO: {
              guard: and(['sfxHasBinding', 'sfxNotThrottled']),
              actions: ['cancelSoundEffect', 'dispatchSoundEffect'],
              target: 'playing',
              reenter: true,
            },
            SPEAK_USER: {
              guard: 'sfxHasBinding',
              actions: ['cancelSoundEffect', 'dispatchSoundEffect'],
              target: 'playing',
              reenter: true,
            },
            CANCEL: {
              actions: ['cancelSoundEffect', 'clearSoundEffect'],
              target: 'idle',
            },
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

**Single-current + single-queued speech slot (§6.3).** Speech has one current + at most one queued utterance:

- `idle` → play immediately.
- `speaking`, queue empty → enqueue (waits for current to finish).
- `speaking`, queue full, same priority → replace queued slot (latest within-priority wins for same event type).
- `speaking`, queue full, higher priority → replace current — cancel and play new.
- `SPEAK_USER` always preempts (cancels current, drops queue, plays now).
- SFX has **no queue** — only throttle. Latest SFX request within the throttle window is dropped; outside it, cancel current SFX and play new.

**Priority + throttle tables (§6.4).** Define these module-level maps and consume them in `resolveAndDispatchSpeech` / the SFX throttle guard:

```ts
// Partial — events absent here (e.g. the two availability signals)
// read as priority 2 via `eventPriority[event] ?? 2`.
export const eventPriority: Partial<Record<LifecycleEvent, number>> = {
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
} as const satisfies Partial<Record<LifecycleEvent, number>>;

export const soundEffectThrottleMs: Record<LifecycleEvent, number> = {
  'turn.action': 50,
  'turn.error': 150,
  'turn.correct': 100,
  'round.error': 400,
  'round.correct': 400,
  // remaining events: 0
} as const satisfies Partial<Record<LifecycleEvent, number>>;
```

`resolveAndDispatchSpeech` algorithm (§6.4):

0. If the incoming `payload.text` is set (explicit utterance — SettingsPanel voice preview, §6.1.1), speak it verbatim and skip resolution. Otherwise resolve the copy via the injected closure: `resolve(gameId, event, context.settings.talkativeness)` → `{ text, soundEffect }` (Task 3's `resolveTemplate`; `SPEAK_USER` passes the caller's explicit `variant` instead). If `text` is null and `soundEffect` is null → drop (the `speechHasBinding` / `sfxHasBinding` guards read this result).
1. Look up `lastSpeechEnqueueAt[event]`. If `now - last < (speechThrottleMs[event] ?? 0)`, drop.
2. Compute incoming priority (`eventPriority[event] ?? 2`).
3. If `incoming.priority > current.priority` → cancel current, set current = incoming, drop queued.
4. Else if `incoming.priority > queued?.priority` → replace queued.
5. Else if `incoming.priority === queued?.priority && same event type` → replace queued.
6. Else → drop incoming.
7. Update `lastSpeechEnqueueAt[event] = now`.

`SPEAK_USER` skips the priority comparison: always preempts, always uses the caller's variant.

**Settings-change drain rule (§6.6).** On `SETTINGS_CHANGED` where `talkativeness` actually changes, the `handleSettingsChange` action also runs `forwardSettings` (calls `speaker.updateSettings(next)` so the speaker is a pure adapter, §7.2.1) and then:

1. If `currentSpeech.source === 'auto'`:
   - Cancel current speech.
   - If new talkativeness !== `'on-demand'`: re-fire `SPEAK_AUTO` with the same event + payload + subject (new variant resolves from new settings).
2. If `currentSpeech.source === 'user'`: let it finish (caller's variant choice is sacred).
3. Drop queued speech in all cases (stale variant).

**`emitTtsPlayed` (§6.7).** After each successful speaker resolve, the action emits on the bus with `subject` coerced to `null` and a real elapsed `durationMs`:

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

The `?? null` coercion stays inline at this single emit site — there is only one place `lifecycle.tts.played` is produced, so a `createTtsPlayedEvent()` factory would be premature. Read-side null discipline is centralized in `isSubjectMatch()` (§10.3). This signal also lets game machines gate transitions on speech completion (§10.2) and lets UI animations un-highlight in sync (§10.3).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lifecycle-tts/lifecycle-tts-machine.test.ts --reporter=verbose`
Expected: PASS — gating + preemption + throttle + `emitTtsPlayed` all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/lifecycle-tts-machine.ts src/lib/lifecycle-tts/lifecycle-tts-machine.test.ts
git commit -m "feat(lifecycle-tts): XState parallel speech+SFX machine — queue/priority/throttle/drain/emitTtsPlayed (spec §6)"
```

---

## Task 8.5: `LifecycleTtsProvider` + `LifecycleTtsContext` + hooks

Mount the singleton actor at the app layout (`$locale/_app.tsx`, Spec Delta 4) and expose it through Context + hooks. The Provider builds the `WebSpeechSpeaker` via `useMemo`, creates the actor via `useActorRef`, forwards settings on change, disposes the speaker on unmount, and warns on duplicate mounts in DEV. The hooks (`useLifecycleTts`, `useSpeakButton`, `useLifecycleTtsUnavailableHandler`) and the `withLifecycleTts` Storybook decorator complete the surface.

**Files:**

- Create: `src/lib/lifecycle-tts/lifecycle-tts-context.ts`
- Create: `src/lib/lifecycle-tts/pick-tts-settings.ts`
- Create: `src/lib/lifecycle-tts/lifecycle-tts-provider.tsx`
- Create: `src/lib/lifecycle-tts/lifecycle-tts-provider.test.tsx`
- Create: `src/lib/lifecycle-tts/use-lifecycle-tts.ts`
- Create: `src/lib/lifecycle-tts/use-lifecycle-tts.test.ts`
- Create: `src/lib/lifecycle-tts/use-speak-button.ts`
- Create: `src/lib/lifecycle-tts/use-speak-button.test.tsx`
- Create: `src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.ts`
- Create: `src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.test.tsx`
- Create: `src/lib/lifecycle-tts/subject-utils.ts`
- Create: `src/lib/lifecycle-tts/subject-utils.test.ts`
- Create: `src/lib/lifecycle-tts/use-current-profile.ts`
- Create: `src/lib/lifecycle-tts/use-current-session.ts`
- Create: `tests/storybook/with-lifecycle-tts.tsx`
- Modify: `src/routes/$locale/_app.tsx` (mount `LifecycleTtsProvider` inside `AppLayoutInner`, within `VoiceUnavailableDialogProvider`; mount the `useLifecycleTtsUnavailableHandler` bridge as a sibling — Spec Delta 4)

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/lifecycle-tts-provider.test.tsx` (spec §12.1 Provider inventory — DEV duplicate-mount guard, bus→`SPEAK_AUTO` relay, settings→`SETTINGS_CHANGED`, `speaker.dispose()` on unmount) and `src/lib/lifecycle-tts/use-lifecycle-tts.test.ts` (throw outside Provider):

```tsx
// lifecycle-tts-provider.test.tsx
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LifecycleTtsProvider } from './lifecycle-tts-provider';
import { useLifecycleTts } from './use-lifecycle-tts';

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { talkativeness: 'helpful', activeLanguage: 'en-AU' },
    update: vi.fn(),
  }),
  DEFAULT_SETTINGS: { talkativeness: 'helpful' },
}));

const Consumer = (): null => {
  useLifecycleTts();
  return null;
};

describe('LifecycleTtsProvider', () => {
  it('provides an actor ref to descendants (no throw)', () => {
    expect(() =>
      render(
        <LifecycleTtsProvider>
          <Consumer />
        </LifecycleTtsProvider>,
      ),
    ).not.toThrow();
  });

  it('useLifecycleTts throws outside the Provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      /must be used inside LifecycleTtsProvider/,
    );
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/lifecycle-tts/lifecycle-tts-provider.test.tsx src/lib/lifecycle-tts/use-lifecycle-tts.test.ts --reporter=verbose`
Expected: FAIL — `LifecycleTtsProvider` / `useLifecycleTts` not exported.

- [ ] **Step 3: Implement the Context + `pickTtsSettings`**

Create `src/lib/lifecycle-tts/lifecycle-tts-context.ts`:

```ts
// src/lib/lifecycle-tts/lifecycle-tts-context.ts
import { createContext } from 'react';
import type { ActorRefFrom } from 'xstate';
import type { lifecycleTtsMachine } from './lifecycle-tts-machine';

export type LifecycleTtsActorRef = ActorRefFrom<
  typeof lifecycleTtsMachine
>;

export const LifecycleTtsContext =
  createContext<LifecycleTtsActorRef | null>(null);
```

Create `src/lib/lifecycle-tts/pick-tts-settings.ts` (spec §5.5 — boundary coercion so every `TtsSettings` field is defined downstream):

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

- [ ] **Step 4: Implement the Provider**

Create `src/lib/lifecycle-tts/lifecycle-tts-provider.tsx` (spec §5.5 + §5.5.1 + §7.2.1 — `useMemo` speaker, `useActorRef`, `forwardSettings` via `SETTINGS_CHANGED`, `speaker.dispose()` on unmount, DEV duplicate-mount guard):

```tsx
// src/lib/lifecycle-tts/lifecycle-tts-provider.tsx
import { useEffect, useMemo, type PropsWithChildren } from 'react';
import { useActorRef } from '@xstate/react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_EVENT_BINDINGS } from './defaults';
import { LifecycleTtsContext } from './lifecycle-tts-context';
import { lifecycleTtsMachine } from './lifecycle-tts-machine';
import { pickTtsSettings } from './pick-tts-settings';
import { resolveTemplate } from './resolve';
import { getActiveRoundContext } from './round-context';
import type { LifecycleEvent, Talkativeness } from './types';
import { WebSpeechSpeaker } from './web-speech-speaker';
import { useSettings } from '@/db/hooks/useSettings';
import { getGameEventBus } from '@/lib/game-event-bus';
import { getGameDefinition } from '@/games/registry';

const EMPTY_ROUND_CONTEXT = {
  currentTarget: '',
  gameName: '',
  correctCount: 0,
  totalRounds: 0,
};

// Module-level DEV mount counter (closes FYI F-2): a context read only
// detects an ANCESTOR Provider — a sibling double-mount would slip past.
// StrictMode's mount/cleanup/mount sequence never exceeds 1 concurrently.
let mountedProviders = 0;

export const LifecycleTtsProvider = ({
  children,
}: PropsWithChildren) => {
  useEffect(() => {
    mountedProviders += 1;
    if (import.meta.env.DEV && mountedProviders > 1) {
      console.error(
        'Duplicate LifecycleTtsProvider mounted — there must be exactly one (app-mounted per §5.5.1).',
      );
    }
    return () => {
      mountedProviders -= 1;
    };
  }, []);

  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const bus = getGameEventBus();
  const speaker = useMemo(
    () => new WebSpeechSpeaker(pickTtsSettings(settings), bus),
    // Constructed once — settings flow in via SETTINGS_CHANGED, not re-construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Pre-bound resolver closure injected into the machine (Task 8 input.resolve):
  // wraps Task 3's pure resolveTemplate with the layer lookup + i18n + the
  // Task 3.5 round-context mirror. Game-prepare and other pre-round events
  // resolve against an empty RoundContext (their templates use {{gameName}}
  // only). Add a `getGameDefinition(gameId)` helper to src/games/registry.ts
  // if one does not already exist.
  const resolve = useMemo(
    () =>
      (gameId: string, event: LifecycleEvent, variant: Talkativeness) =>
        resolveTemplate({
          event,
          variant,
          gameId,
          layers: {
            definition: getGameDefinition(gameId)?.tts ?? {},
            defaults: DEFAULT_EVENT_BINDINGS,
          },
          roundContext: getActiveRoundContext() ?? {
            ...EMPTY_ROUND_CONTEXT,
            gameName: gameId,
          },
          t,
          i18n: { exists: (key: string) => i18n.exists(key) },
        }),
    [t, i18n],
  );

  const actorRef = useActorRef(lifecycleTtsMachine, {
    input: {
      settings: pickTtsSettings(settings),
      speaker,
      bus,
      resolve,
    },
  });

  // Forward settings on every change — the machine's forwardSettings action
  // calls speaker.updateSettings(next) (§7.2.1).
  useEffect(() => {
    actorRef.send({
      type: 'SETTINGS_CHANGED',
      settings: pickTtsSettings(settings),
    });
  }, [actorRef, settings]);

  // Cleanup: dispose the speaker (timers + listeners) on unmount (§7.2.1).
  useEffect(() => () => speaker.dispose(), [speaker]);

  return (
    <LifecycleTtsContext.Provider value={actorRef}>
      {children}
    </LifecycleTtsContext.Provider>
  );
};
```

Mount it once in `src/routes/$locale/_app.tsx` — inside `AppLayoutInner`, nested within `VoiceUnavailableDialogProvider` (Spec Delta 4) — so a single actor instance spans every speakable route (games, settings, parent pages; including SettingsPanel previews) with live `useSettings()`, working i18n, and a reachable unavailable-dialog. Above `DbProvider`, `useSettings()` silently degrades to static defaults (commit `76dc53e36`) and the Talkativeness slider would be inert — that is why `__root.tsx` (spec §5.5.1 as written) cannot be the mount site. Mount `useLifecycleTtsUnavailableHandler()` via a tiny bridge component as a sibling of the Provider's children so the unavailable signal reaches PR #409's dialog:

```tsx
// src/routes/$locale/_app.tsx — inside AppLayoutInner
<ThemeRuntimeProvider>
  <VoiceUnavailableDialogProvider>
    <LifecycleTtsProvider>
      {/* …existing layout (Header / OfflineIndicator / Outlet / Footer)… */}
    </LifecycleTtsProvider>
  </VoiceUnavailableDialogProvider>
</ThemeRuntimeProvider>
```

The actor remounts when the `$locale` param changes — acceptable: speech re-initializes in the new language anyway.

- [ ] **Step 5: Implement the hooks + decorator**

Also create in this step (consumed by Task 16's `game.prepare` emit — spec §8.5 A1 + §11.2): `use-current-profile.ts` (active profile with `ANONYMOUS_PROFILE_ID` fallback), `use-current-session.ts` (current session via RxDB `sessions.findOne()`), and `subject-utils.test.ts` covering `isSubjectMatch()` null/string discipline (§10.3).

Create `src/lib/lifecycle-tts/use-lifecycle-tts.ts` (spec §6.1.1 — `use(Context)` + throw):

```ts
// src/lib/lifecycle-tts/use-lifecycle-tts.ts
import { use } from 'react';
import { LifecycleTtsContext } from './lifecycle-tts-context';
import type { LifecycleTtsActorRef } from './lifecycle-tts-context';

export function useLifecycleTts(): LifecycleTtsActorRef {
  const ref = use(LifecycleTtsContext);
  if (!ref)
    throw new Error(
      'useLifecycleTts must be used inside LifecycleTtsProvider',
    );
  return ref;
}
```

Missing-provider behaviour is **throw** (not noop, not Suspense): the Provider is app-mounted, so the throw can only fire in a Storybook story or test that forgot the decorator — a loud, actionable signal.

Create `src/lib/lifecycle-tts/use-speak-button.ts` (spec §6.1.1 + §8.7 — `SPEAK_USER` send; `explicit ?? roundToPayload(round) ?? PREVIEW_PAYLOAD`; `isSpeaking` derived via `useSelector` + `isSubjectMatch`):

```ts
// src/lib/lifecycle-tts/use-speak-button.ts
import { useCallback } from 'react';
import { useSelector } from '@xstate/react';
import { getActiveRoundContext, roundToPayload } from './round-context';
import { isSubjectMatch } from './subject-utils';
import { subjectToken } from './types';
import { useLifecycleTts } from './use-lifecycle-tts';
import type { LifecycleEvent, Talkativeness } from './types';
import type { SpeakPayload } from './types';

export interface UseSpeakButtonOpts {
  event: LifecycleEvent;
  /** Explicit payload (e.g. SettingsPanel voice preview). Omit in-game —
   *  the hook derives it from the RoundContext mirror (§6.1.1). */
  payload?: SpeakPayload;
  variant?: Talkativeness;
}

export interface UseSpeakButtonResult {
  speak: () => void;
  isSpeaking: boolean;
}

// Last-resort constant when there is no RoundContext (e.g. SettingsPanel preview).
export const PREVIEW_PAYLOAD: SpeakPayload = {
  text: '',
  subject: subjectToken('preview'),
  lang: 'en-AU',
};

export const useSpeakButton = (
  opts: UseSpeakButtonOpts,
): UseSpeakButtonResult => {
  const actor = useLifecycleTts();
  // §6.1.1 fallback chain: explicit ?? roundToPayload(mirror) ?? preview.
  // Reads the mirror (not useRoundContext) so the hook never throws
  // outside a game — SettingsPanel preview works without a provider.
  const payload =
    opts.payload ??
    roundToPayload(getActiveRoundContext()) ??
    PREVIEW_PAYLOAD;
  // Match THIS button's utterance by the real payload subject (§8.7 —
  // closes FYI F-3): branding the event name as the subject would make
  // two buttons for the same event light up together.
  const expectedSubject = payload.subject ?? null;

  // Track playing state by matching this button's expected subject against the
  // in-flight utterance. The actor clears `current` on speak-end and cancel —
  // both transition us back to idle.
  const isSpeaking = useSelector(
    actor,
    (snapshot) =>
      snapshot.context.currentSpeech?.event === opts.event &&
      isSubjectMatch(
        { subject: snapshot.context.currentSpeech?.subject ?? null },
        expectedSubject,
      ),
  );

  const speak = useCallback(() => {
    actor.send({
      type: 'SPEAK_USER',
      event: opts.event,
      payload,
      variant: opts.variant ?? 'helpful',
    });
  }, [actor, opts.event, payload, opts.variant]);

  return { speak, isSpeaking };
};
```

`useSpeakButton` resolves the payload `opts.payload ?? roundToPayload(getActiveRoundContext()) ?? PREVIEW_PAYLOAD` (`roundToPayload` from Task 3.5). SettingsPanel renders the voice-preview button with an explicit payload (`{ text: t('settings.voicePreview'), subject: 'preview', lang: settings.activeLanguage }`), so the preview works without a `RoundContext`; in-game the round payload is used.

Create `src/lib/lifecycle-tts/subject-utils.ts` (spec §10.3 — single place for null/string discipline):

```ts
// src/lib/lifecycle-tts/subject-utils.ts
import type { LifecycleSubject } from './types';

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

Create `src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.ts` (spec §7.2.1 — bus `lifecycle.tts.unavailable` → PR #409 `VoiceUnavailableDialogProvider`). Keeping it a discrete hook (not inline in the Provider, not a machine action) keeps the engine free of React dialog coupling and makes the listener unit-testable in isolation:

```ts
// src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.ts
import { useEffect } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';
import { useVoiceUnavailableDialog } from '@/providers/VoiceUnavailableDialogProvider';
import type { LifecycleTtsUnavailableEvent } from '@/types/game-events';

export const useLifecycleTtsUnavailableHandler = (): void => {
  // PR #409's VoiceUnavailableDialogProvider exposes `show`, not `open`.
  // Signature: show(voiceName: string, locale: string). The unavailable
  // event's `subject` carries the locale that failed to resolve (spec §4.3),
  // so pass '' for the (unknown) voice name and the subject as the locale.
  const { show } = useVoiceUnavailableDialog();
  useEffect(() => {
    const bus = getGameEventBus();
    const unsub = bus.subscribe('lifecycle.tts.unavailable', (e) => {
      show('', (e as LifecycleTtsUnavailableEvent).subject);
    });
    return unsub;
  }, [show]);
};
```

Create `tests/storybook/with-lifecycle-tts.tsx` (spec §6.1.1 — Storybook decorator mirroring existing `withSettings` / `withRouter`):

```tsx
// tests/storybook/with-lifecycle-tts.tsx
import type { Decorator } from '@storybook/react';
import { LifecycleTtsProvider } from '@/lib/lifecycle-tts/lifecycle-tts-provider';

export const withLifecycleTts: Decorator = (Story) => (
  <LifecycleTtsProvider>
    <Story />
  </LifecycleTtsProvider>
);
```

Stories that render hook consumers add `withLifecycleTts`; stories testing the missing-context branch simply omit it.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/lib/lifecycle-tts/ --reporter=verbose && yarn typecheck`
Expected: PASS — Provider provides the actor; `useLifecycleTts` throws outside it; settings forward to the machine.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lifecycle-tts/lifecycle-tts-context.ts src/lib/lifecycle-tts/pick-tts-settings.ts src/lib/lifecycle-tts/lifecycle-tts-provider.tsx src/lib/lifecycle-tts/lifecycle-tts-provider.test.tsx src/lib/lifecycle-tts/use-lifecycle-tts.ts src/lib/lifecycle-tts/use-lifecycle-tts.test.ts src/lib/lifecycle-tts/use-speak-button.ts src/lib/lifecycle-tts/use-speak-button.test.tsx src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.ts src/lib/lifecycle-tts/use-lifecycle-tts-unavailable-handler.test.tsx src/lib/lifecycle-tts/subject-utils.ts src/lib/lifecycle-tts/subject-utils.test.ts src/lib/lifecycle-tts/use-current-profile.ts src/lib/lifecycle-tts/use-current-session.ts tests/storybook/with-lifecycle-tts.tsx src/routes/\$locale/_app.tsx
git commit -m "feat(lifecycle-tts): app-mounted LifecycleTtsProvider + Context + hooks + Storybook decorator (Spec Delta 4, spec §6.1.1, §7.2.1)"
```

---

## Task 8.6: Single emit-site for `game.start` / `game.resume` (`useGameEngine` mount effect)

**Spec Delta 5 (closes 2026-06-09 finding C3a).** Spec §4.2.1 prescribed an "engine `loading.entry` action" — that seam does not exist on master: per-game machines start `initial: 'playing'`, there is no shared engine machine, no `loading` state, and `executeSideEffects` has no `initialState`. The single-emit-site **contract** survives at the one hook every game passes through: `useGameEngine`'s mount effect is the sole emitter. The two verbs are distinguished by the new optional `UseGameEngineOptions.initialState` (absent → `game.start`, present → `game.resume`). **`AnswerGameProvider` MUST NOT emit either** (TP8 contract — see the Modified-files row for `AnswerGameProvider.tsx`). A §4.2.1 correction is queued on spec PR #391.

M1 note: no caller passes `initialState` (session-resume is a future feature), so `game.resume` is a dormant branch — and it has no M1 i18n key, so it resolves to `null` (intentional silence, documented in Task 18). The test still covers both branches.

This event flows to the app-mounted actor (Tasks 6–8.5) on the bus exactly like every other `lifecycle.speak`; the actor's `autoAllowed` guard gates the auto-speech.

**Files:**

- Modify: `src/lib/game-engine/useGameEngine.ts` — add optional `initialState` to `UseGameEngineOptions` + the mount-once emit
- Modify: `src/lib/game-engine/useGameEngine.test.tsx` — assert both verb branches; assert exactly one emit per mount

- [ ] **Step 1: Write the failing test**

Add to `src/lib/game-engine/useGameEngine.test.tsx` (renderHook against a minimal definition, bus mocked):

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/game-event-bus', () => {
  const emit = vi.fn();
  return { getGameEventBus: () => ({ emit }) };
});
import { getGameEventBus } from '@/lib/game-event-bus';

describe('useGameEngine mount-effect single emit-site (Spec Delta 5)', () => {
  it('emits lifecycle.speak { game.start } exactly once when initialState is absent', () => {
    const emit = getGameEventBus().emit as ReturnType<typeof vi.fn>;
    emit.mockClear();
    renderHook(() => useGameEngine(testDefinition, { totalRounds: 3 }));
    const speaks = emit.mock.calls.filter(
      ([e]) => e.type === 'lifecycle.speak',
    );
    expect(speaks).toHaveLength(1);
    expect(speaks[0][0]).toMatchObject({
      lifecycleEvent: 'game.start',
    });
  });

  it('emits lifecycle.speak { game.resume } when initialState is present', () => {
    const emit = getGameEventBus().emit as ReturnType<typeof vi.fn>;
    emit.mockClear();
    renderHook(() =>
      useGameEngine(testDefinition, {
        totalRounds: 3,
        initialState: { roundIndex: 3 },
      }),
    );
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'lifecycle.speak',
        lifecycleEvent: 'game.resume',
      }),
    );
  });
});
```

(Reuse the file's existing `testDefinition` fixture; create a minimal one if absent.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose`
Expected: FAIL — no mount emit yet.

- [ ] **Step 3: Add the single emit-site**

In `src/lib/game-engine/useGameEngine.ts`: add `initialState?: unknown` to `UseGameEngineOptions` (JSDoc: persisted session snapshot for the future session-resume feature; M1 callers never pass it), then add the mount effect after the `useMachine` call:

```ts
// useGameEngine.ts — single emit-site for game.start / game.resume
// (Spec Delta 5). Mount-once: the engine hook mounts once per game
// session. React StrictMode double-invokes effects in dev — the duplicate
// SPEAK_AUTO is dropped by the actor's §6.4 replace policy (equal
// priority, same event, nothing queued → drop incoming).
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Confirm `AnswerGameProvider.tsx` does **not** also emit `game.start` / `game.resume` (delete any such emit if present) — the single-emit-site contract requires exactly one producer.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose && yarn typecheck`
Expected: PASS — both branches emit the correct verb; exactly one emit per mount.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/useGameEngine.ts src/lib/game-engine/useGameEngine.test.tsx src/components/answer-game/AnswerGameProvider.tsx
git commit -m "feat(game-engine): single emit-site for game.start/game.resume in useGameEngine mount effect (Spec Delta 5)"
```

---

## Task 8.7: `LIFECYCLE_TTS_PLAYED` bus→machine forwarding rail (spec §10.2)

Closes 2026-06-09 finding C3b: Tasks 9–11 assert the §10.2 transition-gate rail "ships in M1", but no task wired it. This task builds the forwarding: `useGameEngine` subscribes to `lifecycle.tts.played` on the bus and forwards matching events (same `gameId`) into the running machine as `LIFECYCLE_TTS_PLAYED`. M1 game machines declare no `LIFECYCLE_TTS_PLAYED` transitions — XState ignores unhandled events, so M1 behavior is unchanged — but Spec 1b's phoneme-explain sequence (and the SRS recorder's play-count signal, §10.2.5) drop in with zero engine churn.

**Files:**

- Modify: `src/lib/game-engine/useGameEngine.ts` — bus subscription + forward
- Modify: `src/lib/game-engine/useGameEngine.test.tsx` — forwarding + gameId-filter tests

- [ ] **Step 1: Write the failing test**

Build a test definition whose machine declares a `LIFECYCLE_TTS_PLAYED` transition (e.g. `assign({ lastPlayed: ({ event }) => event.lifecycleEvent })`), render `useGameEngine` with it, emit `lifecycle.tts.played` on the bus with the matching `gameId`, and assert the machine consumed it. Emit again with a different `gameId` and assert it was ignored.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose`
Expected: FAIL — no forwarding yet.

- [ ] **Step 3: Implement the forward**

```ts
// useGameEngine.ts — LIFECYCLE_TTS_PLAYED rail (spec §10.2, Task 8.7)
useEffect(() => {
  return getGameEventBus().subscribe('lifecycle.tts.played', (e) => {
    if (e.gameId !== envelope.gameId) return;
    send({
      type: 'LIFECYCLE_TTS_PLAYED',
      lifecycleEvent: e.lifecycleEvent,
      // subject is null-coerced at the single emit site (§6.7);
      // machines match it via isSubjectMatch() (§10.3).
      subject: e.subject,
    });
  });
}, [send, envelope.gameId]);
```

(Match the bus's actual subscribe signature — Task 4's `bus.subscribe('game.prepare', …)` shows the per-type form; return its unsubscribe from the effect.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose && yarn typecheck`
Expected: PASS — matching events forwarded, foreign `gameId` ignored, M1 machines unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/useGameEngine.ts src/lib/game-engine/useGameEngine.test.tsx
git commit -m "feat(game-engine): forward lifecycle.tts.played into machines as LIFECYCLE_TTS_PLAYED (spec §10.2 rail)"
```

---

## Task 9: NumberMatch — `tts:` block + machine `speak` entry (fixes "speak the answer" bug)

**Files:**

- Modify: `src/games/number-match/definition.ts:631-639` (add `tts:` field to the exported definition)
- Modify: `src/games/number-match/definition.ts:571-595` (add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to the `playing` state)
- Modify: `src/games/number-match/definition.test.ts` (add test for new entry action)

The current behavior at `NumberMatch.tsx` reads the bare numeral aloud (the "5" bug). After this task, the machine's `playing` state entry fires `speak({ lifecycleEvent: 'round.start' })`, which resolves to the registered template (`"Find the matching number for {{count}}."`).

> **Integration note (applies to Tasks 9–11).** The machine `entry: [{ type: 'speak', … }]` action is **not** wired to any hook. The engine's `speak` side-effect provider (`useGameEngine` → `executeSideEffects`, in [src/lib/game-engine/side-effects.ts](../../src/lib/game-engine/side-effects.ts)) emits a single `lifecycle.speak` bus event; the **app-mounted `lifecycleTtsMachine` actor** (Tasks 6–8.5) is the bus subscriber that relays it as `SPEAK_AUTO` and performs the speech via `WebSpeechSpeaker`. There is no `useLifecycleTts` per-game subscriber and no `useRoundTTS` — the per-game machine emits to the bus, the single actor consumes. Auto-speech stays gated by the actor's `autoAllowed` guard (`talkativeness !== 'on-demand'`, §6.1); the game machine never reads settings.
>
> **Two layers, two shapes (closes 2026-06-09 C4, shape half).** Machine entries use the XState **action-descriptor** form `{ type: 'speak', params: { lifecycleEvent } }`; the engine-provided `speak` action then executes the flat `SideEffect` object `{ type: 'speak', lifecycleEvent }` (`definition-types.ts`). Snippets showing `params` are the XState layer — the `SideEffect` itself is always flat. Do not "fix" one into the other.
>
> **`LIFECYCLE_TTS_PLAYED` transition-gate rail (spec §10.2, ships in M1).** The engine recognizes `LIFECYCLE_TTS_PLAYED` as a state-machine transition signal: a game machine can gate a transition on `lifecycle.tts.played` matching `gameId + lifecycleEvent + subject`, so a sequenced speech flow advances only after the prior utterance resolves. **This mechanism (the engine wiring that turns the `lifecycle.tts.played` bus event into a machine-consumable `LIFECYCLE_TTS_PLAYED` event) ships in M1 — built by Task 8.7** — so Spec 1b's phoneme-explain sequence drops in with **zero engine churn**. The phoneme **content** (the `explaining.phoneme*` states + CSS classes) is **Spec 1b**, not this PR. Example of the future shape M1 enables:
>
> ```ts
> // Future Spec 1b sequence — rail exists in M1, content lands in 1b
> states: {
>   'explaining.phoneme1': {
>     entry: 'speakPhoneme1', // emits lifecycle.speak { subject: 'tile-k' }
>     on: {
>       LIFECYCLE_TTS_PLAYED: {
>         guard: 'matchesPhoneme1', // event.subject === 'tile-k'
>         target: 'explaining.phoneme2',
>       },
>     },
>   },
>   'explaining.phoneme2': {
>     /* ... */
>   },
>   'explaining.whole': {
>     /* ... */
>   },
> }
> ```

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

  it('definition.tts has a round.start binding for both spoken variants', () => {
    expect(numberMatchDefinition.tts).toBeDefined();
    expect(
      numberMatchDefinition.tts?.['round.start']?.tts?.helpful,
    ).toBe('tts.number-match.round-start.helpful');
    expect(
      numberMatchDefinition.tts?.['round.start']?.tts?.chatty,
    ).toBe('tts.number-match.round-start.chatty');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/number-match/definition.test.ts --reporter=verbose`
Expected: FAIL — `playing` state has no `entry`; `definition.tts` is undefined.

- [ ] **Step 3: Add the `tts:` block to the definition**

In `src/games/number-match/definition.ts`, modify the exported definition (replace lines 631–639):

```ts
import { DONT_SPEAK } from '@/lib/lifecycle-tts/sentinel-values';
import type { EventBindingsMap } from '@/lib/lifecycle-tts/types';

// Per-variant bindings (spec §9.3 + §9.4). Two deliberate omissions:
// - `on-demand` keys are omitted (INHERITED): no lower layer binds these
//   events in M1, so the chain resolves to silence — and auto-speech is
//   additionally gated by the actor's `autoAllowed` guard (§6.1). The one
//   explicit DONT_SPEAK (round.error) mirrors the spec §9.3 example and
//   stays silent even if a global default for round.error appears later.
// - `soundEffect` is omitted in M1 — SFX stays on the machines' existing
//   `playSound` actions; actor-driven SFX migrates in M2 (avoids
//   double-play while both paths exist).
const numberMatchTTS: EventBindingsMap = {
  'game.prepare': {
    tts: {
      helpful: 'tts.number-match.game-prepare.helpful',
      chatty: 'tts.number-match.game-prepare.chatty',
    },
  },
  'game.start': {
    tts: {
      helpful: 'tts.number-match.game-start.helpful',
      chatty: 'tts.number-match.game-start.chatty',
    },
  },
  'round.start': {
    tts: {
      helpful: 'tts.number-match.round-start.helpful',
      chatty: 'tts.number-match.round-start.chatty',
    },
  },
  'round.error': {
    tts: {
      'on-demand': DONT_SPEAK,
      helpful: 'tts.number-match.round-error.helpful',
      chatty: 'tts.number-match.round-error.chatty',
    },
  },
  'round.idle': {
    tts: {
      'on-demand': DONT_SPEAK, // idle nudge is auto-speech only (§10.1.1)
      helpful: 'tts.number-match.round-idle.helpful',
      chatty: 'tts.number-match.round-idle.chatty',
    },
  },
  'turn.correct': {
    tts: {
      helpful: 'tts.number-match.turn-correct.helpful',
      chatty: 'tts.number-match.turn-correct.chatty',
    },
  },
  'turn.error': {
    tts: {
      'on-demand': DONT_SPEAK,
      helpful: 'tts.number-match.turn-error.helpful',
      chatty: 'tts.number-match.turn-error.chatty',
    },
  },
  'round.correct': {
    tts: {
      helpful: 'tts.number-match.round-correct.helpful',
      chatty: 'tts.number-match.round-correct.chatty',
    },
  },
  'level.complete': {
    tts: {
      helpful: 'tts.number-match.level-complete.helpful',
      chatty: 'tts.number-match.level-complete.chatty',
    },
  },
  'game.end': {
    tts: {
      helpful: 'tts.number-match.game-end.helpful',
      chatty: 'tts.number-match.game-end.chatty',
    },
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
- Where the machine already distinguishes right/wrong placement actions, add `speak` with `turn.correct` / `turn.error` (F-38 — §9.8 lists both as M1 user-visible; the actor's §6.4 throttles, 400/800 ms, absorb rapid-fire). Skip if a machine has no such action seam — do not invent one.
- Optional: track `round.error` via an `assign` + `entry`-like pattern on `placeTile` actions — defer to M2 if the wiring is non-trivial; M1's must-haves are `round.start` (fixes the "5" bug) + `game.end` (already present at line 624).

- [ ] **Step 4b: Remove the legacy `useRoundTTS` caller from NumberMatch**

The machine now drives round-start speech via the `entry: [speak]` action; the legacy `useRoundTTS(String(round?.value ?? ''))` call at `src/games/number-match/NumberMatch/NumberMatch.tsx:131` and its import at line 38 must be removed in the SAME commit as the machine wiring to avoid double-speech (machine emit + legacy hook would both fire). Run `rg useRoundTTS src/games/number-match/` to verify zero callers remain after the edit.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/games/number-match/definition.test.ts src/games/number-match/NumberMatch/NumberMatch.test.tsx --reporter=verbose`
Expected: PASS — TTS entries fire; existing NumberMatch tests still pass.

- [ ] **Step 6: Run the full game test in dev to confirm the "5" bug is gone**

Run dev server (`yarn dev`), open NumberMatch in a browser, play one round with the user-level Talkativeness set to `helpful` (or `chatty`) in SettingsPanel. Confirm that the speech says "Find the matching number for five." (or similar) instead of just "Five." This is a user-visible acceptance criterion — automated tests alone cannot prove the fix.

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

Mirror the shape of Task 9, but with WordSpell template variables (`{{word}}` instead of `{{count}}`). The same **integration note** and **`LIFECYCLE_TTS_PLAYED` transition-gate rail** from Task 9 apply: the `speak` entry emits `lifecycle.speak` to the app-mounted actor (no per-game hook), and the engine's `LIFECYCLE_TTS_PLAYED` rail (spec §10.2) ships in M1 via Task 8.7.

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

  it('definition.tts has a round.start binding using {{word}}', () => {
    expect(wordSpellDefinition.tts?.['round.start']?.tts?.helpful).toBe(
      'tts.word-spell.round-start.helpful',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/games/word-spell/definition.test.ts --reporter=verbose`
Expected: FAIL.

- [ ] **Step 3: Add the `tts:` block + entry action**

Add the `wordSpellTTS` constant before the exported definition (same structure as Task 9 but with `word-spell` i18n keys), and add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to the `playing` state. Use the WordSpell template values from spec §9.4 (i18n key convention examples) as a starting point.

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

By the end of this task, all three XState-migrated games drive round-start speech via the machine — the `speak` entry emits `lifecycle.speak` to the app-mounted actor (Task 9 integration note), consumed by the single `lifecycleTtsMachine`. `useRoundTTS` has no remaining callers and is deleted; its old per-tree subscription model is fully replaced by the actor. The `LIFECYCLE_TTS_PLAYED` transition-gate rail (spec §10.2) ships in M1 as part of the engine (Task 8.7), not the per-game machine.

- [ ] **Step 1: Add the `tts:` block + entry action**

Same shape as Task 9/10 but with SortNumbers template values (uses `{{direction}}`, `{{from}}`, `{{to}}`, `{{step}}` per spec §9.7 interpolation table). Reference SortNumbers' `round.start` template from spec §9.4 (i18n key conventions).

- [ ] **Step 1b: Remove the legacy `useRoundTTS` caller from SortNumbers**

Remove `useRoundTTS(directionLabel)` at `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:91` and its import at line 32. This is the final caller — after this edit, `rg useRoundTTS src/games/` should return zero matches across all three migrated games.

- [ ] **Step 2: Confirm no other code references useRoundTTS**

Run: `rg useRoundTTS src/`
Expected: only `useRoundTTS.ts` / `.test.tsx` themselves should match (callers in NumberMatch/WordSpell/SortNumbers were removed in Tasks 9 Step 4b, 10 Step 3b, and 11 Step 1b respectively). If any caller still imports it, migrate to `useLifecycleTts` (the auto-speak path is now machine-driven; tap-to-speak goes through AudioButton in Task 13).

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

## Task 11.5: `round.idle` — gradeBand-aware idle nudge (spec §10.1 + §10.1.1)

Closes F-38 (decision 2026-06-12): spec §10.1.1 promotes `round.idle` into M1 — the plan's former M2 deferral is reversed. The timer lives in **each game machine**, not in lifecycle-tts: it fires once per round, `idleTimeoutMs[gradeBand]` ms after round start, only while no zone has a correct placement AND no tile has been picked up; it is cancelled on the first correct placement, restarted **once** on the first wrong placement, and never restarted again that round. `0` disables it (year3-4 / year5-6).

**Files:**

- Create: `src/lib/lifecycle-tts/idle-timeout.ts` + `idle-timeout.test.ts`
- Create: `src/lib/lifecycle-tts/grade-band.ts` + `grade-band.test.ts`
- Modify: `src/games/number-match/definition.ts`, `src/games/word-spell/definition.ts`, `src/games/sort-numbers/definition.ts` (timer wiring + `round.idle` binding)

- [ ] **Step 1: Write the failing tests**

`idle-timeout.test.ts`: the §10.1 table verbatim — `pre-k`/`k` → 8000, `year1-2` → 12000, `year3-4`/`year5-6` → 0. `grade-band.test.ts`: the gradeLevel → `GradeBand` mapping covers every grade the profile model can hold. Per-machine (extend each definition.test.ts): with fake timers, entering `playing` and advancing by the band's timeout with no progress fires `speak({ lifecycleEvent: 'round.idle' })` exactly once; a correct placement before the timeout cancels it; a wrong placement restarts it once (advance again → second fire), but never a third time; `gradeBand: 'year3-4'` never fires.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement the table + mapping**

`src/lib/lifecycle-tts/idle-timeout.ts` (spec §10.1 verbatim):

```ts
import type { GradeBand } from '@/types/game-events';

export const idleTimeoutMs: Record<GradeBand, number> = {
  'pre-k': 8000,
  k: 8000,
  'year1-2': 12000,
  'year3-4': 0, // disabled
  'year5-6': 0, // disabled
};
```

`src/lib/lifecycle-tts/grade-band.ts`: `gradeLevelToGradeBand(level)` mapping the profile grade field onto the five bands (spec §11.2 annotation).

- [ ] **Step 4: Wire the timer into the three machines**

Per the spec §10.1 state sketch — XState `after` with a dynamic delay (`delays: { IDLE_TIMEOUT: ({ context }) => idleTimeoutMs[context.gradeBand] }`), a `noProgressYet` guard, plus an `idleEnabled` guard so a `0` delay never fires; cancel on first correct placement, restart once on first wrong placement (a `idleRestartsUsed` counter in context). The `speak` action is the engine-provided one (Task 9 integration note) — `round.idle` flows to the actor like every other `lifecycle.speak`; `on-demand` stays silent via the binding's `DONT_SPEAK`.

- [ ] **Step 5: Run tests + typecheck — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/lib/lifecycle-tts/idle-timeout.ts src/lib/lifecycle-tts/idle-timeout.test.ts src/lib/lifecycle-tts/grade-band.ts src/lib/lifecycle-tts/grade-band.test.ts src/games/*/definition.ts src/games/*/definition.test.ts
git commit -m "feat(lifecycle-tts): gradeBand-aware round.idle nudge timer in the three game machines (spec §10.1)"
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
import { describe, expect, it, vi } from 'vitest';
import { QuestionRow } from './QuestionRow';

// AudioButton needs the actor context; stub the hook like Task 13's tests.
vi.mock('@/lib/lifecycle-tts/use-speak-button', () => ({
  useSpeakButton: () => ({ speak: vi.fn(), isSpeaking: false }),
}));

describe('QuestionRow', () => {
  it('renders the AudioButton on the left and children on the right', () => {
    render(
      <QuestionRow audioEvent="round.start">
        <span data-testid="content">cat</span>
      </QuestionRow>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument(); // AudioButton
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('defaults audioEvent to round.start when omitted', () => {
    render(
      <QuestionRow>
        <span>cat</span>
      </QuestionRow>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('wraps children to a new line without truncating long text', () => {
    render(
      <QuestionRow>
        <span>
          Sort these numbers in ascending order from one hundred to five
          hundred, skipping by ten.
        </span>
      </QuestionRow>,
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

Prop contract is spec §8.6 verbatim (`audioEvent` + `children` — closes FYI F-1): the row owns its `AudioButton`, callers only say which lifecycle event a tap re-speaks.

```tsx
import type { JSX, ReactNode } from 'react';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';
import styles from './QuestionRow.module.css';

export interface QuestionRowProps {
  /** Lifecycle event a tap re-speaks. Defaults to round.start (§8.6). */
  audioEvent?: LifecycleEvent;
  /** Question text or visual content. */
  children: ReactNode;
}

export const QuestionRow = ({
  audioEvent = 'round.start',
  children,
}: QuestionRowProps): JSX.Element => (
  <div className={styles['row']} role="group">
    <div className={styles['audio']}>
      <AudioButton event={audioEvent} />
    </div>
    <div className={styles['content']}>{children}</div>
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

Create `src/components/questions/QuestionRow/QuestionRow.stories.tsx` following `write-storybook` conventions (load that skill before authoring). Single Playground story, `audioEvent` as a select control over the `LifecycleEvent` union, `children` as text; decorators provide theme + the `withLifecycleTts` actor decorator (Task 8.5). Title: `'Questions/QuestionRow'`.

- [ ] **Step 5: Run tests + storybook smoke test**

Run: `npx vitest run src/components/questions/QuestionRow/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/QuestionRow/ src/components/questions/index.ts
git commit -m "feat(questions): add QuestionRow inline layout wrapper"
```

---

## Task 13: AudioButton refactor — lifecycle event prop (always renders)

**REQUIRED SKILL:** `write-storybook` (Storybook update).

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.test.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.stories.tsx`

Spec §5.4 ("no hard-mute"): the button **always renders** when the game UI is visible. There is no setting that hides it — `talkativeness` only gates auto-speech, not taps. The legacy `ttsEnabled: false → hidden` behavior is gone.

**Also in scope (closes 2026-06-09 C6, AudioButton half):**

1. **Re-tap restart flash (§8.7).** `SPEAK_USER` always preempts; on re-tap while speaking, apply the one-shot `.audio-button--restart-flash` class (200ms background flash + icon scale-down keyframe, auto-cleared via `setTimeout`), visually distinct from the steady `.audio-button--playing` pulsing ring so the user sees the restart. No aria change on the flash (over-announcement). Add a test: re-tap while `isSpeaking` → flash class applied, removed after the timeout.
2. **Talkativeness→`on-demand` transition pulse (§5.6.1).** `useSpeakButton` watches for `talkativeness` transitions to `'on-demand'` and fires the same flash class **once on the next `round.start`** — advertising "the game just got quieter; tap me to hear the question." ~5 lines CSS keyframe + 1 `useEffect` in the hook. Add a test: flip settings to `on-demand`, fire `round.start`, assert the one-shot pulse.

- [ ] **Step 1: Write the failing test**

Update `src/components/questions/AudioButton/AudioButton.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';

// Taps go through useSpeakButton → SPEAK_USER (spec §8.7), not a
// useLifecycleTts().speakOnDemand callable. Mock the hook to capture the send.
const speak = vi.fn();
vi.mock('@/lib/lifecycle-tts/use-speak-button', () => ({
  useSpeakButton: () => ({ speak, isSpeaking: false }),
}));
describe('AudioButton', () => {
  beforeEach(() => speak.mockClear());

  // Talkativeness no longer affects whether the button renders OR whether a tap
  // speaks — the actor's autoAllowed guard only gates SPEAK_AUTO; SPEAK_USER
  // (taps) is never gated (§5.4). So the button always renders and always sends.
  it('always renders the button', () => {
    render(<AudioButton event="round.start" />);
    expect(
      screen.getByRole('button', { name: /hear/i }),
    ).toBeInTheDocument();
  });

  it('sends SPEAK_USER (speak()) when clicked — taps always speak (§5.4)', () => {
    render(<AudioButton event="round.start" />);
    fireEvent.click(screen.getByRole('button'));
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
```

The talkativeness-by-render assertions from the pre-actor draft are dropped: render and tap-speak no longer depend on `talkativeness` (the gate lives in the actor's `autoAllowed` guard and only affects `SPEAK_AUTO`). `isSpeaking` is exercised by the `useSpeakButton` unit test (Task 8.5), not here.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: FAIL — current AudioButton takes `prompt: string`, not `event: LifecycleEvent`, and has a `ttsEnabled` gate.

- [ ] **Step 3: Refactor AudioButton**

Replace `src/components/questions/AudioButton/AudioButton.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { useSpeakButton } from '@/lib/lifecycle-tts/use-speak-button';
import type {
  LifecycleEvent,
  Talkativeness,
} from '@/lib/lifecycle-tts/types';
import type { JSX } from 'react';

export interface AudioButtonProps {
  event?: LifecycleEvent;
  variant?: Talkativeness;
}

// AudioButton always renders. Spec §5.4: no hard-mute — taps always speak,
// regardless of the user's Talkativeness setting. OS volume slider is the
// escape hatch for "completely silent".
//
// Taps go through useSpeakButton → SPEAK_USER (spec §8.7); `isSpeaking` is
// derived from the actor so the button can show a pulse + restart-flash.
export const AudioButton = ({
  event = 'round.start',
  variant = 'helpful',
}: AudioButtonProps): JSX.Element => {
  // No payload — useSpeakButton derives it from the RoundContext mirror
  // (roundToPayload, Task 3.5) and falls back to PREVIEW_PAYLOAD outside
  // a game, so AudioButton renders anywhere without a provider.
  const { speak, isSpeaking } = useSpeakButton({ event, variant });
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={t(
        isSpeaking ? 'audio.replay.playing' : 'audio.replay.idle',
      )}
      onClick={speak}
      className={['audio-button', isSpeaking && 'audio-button--playing']
        .filter(Boolean)
        .join(' ')}
    >
      🔊
    </button>
  );
};
```

Full state table (idle / playing / briefly-paused-after-retap) + the `.audio-button--restart-flash` keyframe live in spec §8.7 — implement them per that section; `SPEAK_USER` always preempts in-flight speech (§6.3), so the button never refuses a tap. Replace the emoji with the icon component the existing AudioButton uses; preserve existing styling classnames.

- [ ] **Step 4: Update Storybook story per write-storybook skill**

`event` becomes the primary control (a select with all `LifecycleEvent` values). Title stays `'Questions/AudioButton'`. No gate variants in stories (button always renders).

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/components/questions/AudioButton/ && yarn typecheck`
Expected: PASS — old `prompt`-based and `ttsEnabled`-gated callers become typecheck errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/questions/AudioButton/
git commit -m "feat(audio-button): switch to lifecycle event prop; always renders (spec §5.4 no hard-mute)"
```

---

## Task 14: Question components — drop onClick speech gate (taps always speak)

**Files:**

- Modify: `src/components/questions/TextQuestion/TextQuestion.tsx`
- Modify: `src/components/questions/ImageQuestion/ImageQuestion.tsx`
- Modify: `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`
- Modify: `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`
- Modify: each component's `.test.tsx` file

Each of the four question components today reads `config.ttsEnabled` for its onClick speech. Per spec §5.4 (no hard-mute), **the gate is removed entirely** — clicks always send `SPEAK_USER` to the actor (via `useSpeakButton`). Voice availability is handled centrally: the speaker's `pickVoice()` fails closed and emits `lifecycle.tts.unavailable`, which `useLifecycleTtsUnavailableHandler` routes to PR #409's `VoiceUnavailableDialogProvider`. There is no in-component gate.

Routing taps through the actor (`SPEAK_USER`) gives SRS observability parity for free — the actor's `emitTtsPlayed` fires `lifecycle.tts.played` on every speaker resolve, including user taps (spec §6.7).

- [ ] **Step 1: Write the failing test (per question component)**

For `TextQuestion`, add or update:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextQuestion } from './TextQuestion';

// Question clicks send SPEAK_USER via useSpeakButton (spec §8.7); taps are
// never gated by talkativeness (§5.4), so a single click-speaks test suffices.
const speak = vi.fn();
vi.mock('@/lib/lifecycle-tts/use-speak-button', () => ({
  useSpeakButton: () => ({ speak, isSpeaking: false }),
}));

describe('TextQuestion onClick speech — taps always speak (spec §5.4)', () => {
  beforeEach(() => speak.mockClear());

  it('sends SPEAK_USER (speak()) when clicked', () => {
    render(<TextQuestion text="cat" />);
    fireEvent.click(screen.getByText('cat'));
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
```

Repeat for `ImageQuestion`, `EmojiQuestion`, `DotGroupQuestion` with their respective click targets.

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — components still gate by `ttsEnabled` (or no longer route clicks through `useSpeakButton`).

- [ ] **Step 3: Update each component**

In each of the four files, locate the onClick handler that calls `speak()` or `useGameTTS().speakPrompt()`, and replace with a `useSpeakButton` tap (spec §8.7):

```tsx
// payload omitted — useSpeakButton derives it from the live RoundContext
// mirror (roundToPayload), falling back to PREVIEW_PAYLOAD (Task 8.5).
const { speak } = useSpeakButton({ event: 'round.start' });

const handleClick = () => {
  // No gate — taps always speak per spec §5.4 (no hard-mute).
  speak(); // → SPEAK_USER to the actor
};
```

Remove any `if (config.ttsEnabled)` / `if (!config.ttsOnDemandAllowed)` branches around the click handler. (Per Task 14 Q-§5.2 follow-up: the hardcoded `'round.start'` lifecycle event for question clicks is M1's chosen mapping; a dedicated `round.explain` event is deferred to M2.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/questions/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/questions/
git commit -m "feat(questions): drop ttsEnabled gate on onClick speech (spec §5.4 no hard-mute)"
```

---

## Task 15: Wire QuestionRow + AudioButton into the three games

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
- Update their `*.test.tsx` files

- [ ] **Step 1: Write the failing test (per game)**

For each game, add a test that asserts an AudioButton is always rendered (no gate — spec §5.4). Example for SortNumbers:

```tsx
it('renders an inline AudioButton (always — no talkativeness gate)', () => {
  render(<SortNumbersWithCfg />);
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

// inside the JSX (QuestionRow owns the AudioButton — spec §8.6):
<QuestionRow audioEvent="round.start">
  {/* existing question content */}
</QuestionRow>;
```

Remove any pre-existing standalone AudioButton wiring that passed `prompt` strings — `audioEvent` carries everything now. This is also where each game mounts its `RoundContextProvider` (Task 3.5) around the playing tree, fed from the closure that already computes the round.

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

## Task 15.5: ARIA live region for round outcomes (spec §12.2)

Closes 2026-06-09 finding C6 (ARIA half): the superseded 2026-05-03 canon spec promised ARIA + visual cues independent of the TTS layer, and the criterion is now in spec §12.2 (added 2026-06-10 on PR #391 alongside the §4.2.1/§5.5.1 amendments). Without it, a family on the quiet `on-demand` preset (or any assistive-tech user) gets **no** round-outcome announcement at all. The fix is deliberately minimal — no architecture, just markup.

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
- Modify: the corresponding `.test.tsx` files

- [ ] **Step 1: Write the failing tests**

In each game's test file: render a round-complete state and assert `screen.getByRole('status')` contains the outcome text (e.g. `/correct|well done/i`); assert the element exists even when `talkativeness` is `'on-demand'` (announcement is independent of TTS).

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Wrap the round-outcome string in each game**

~5 lines of JSX per game, where the round outcome already renders:

```tsx
<div role="status" aria-live="polite">
  {roundOutcomeText}
</div>
```

`role="status"` implies `aria-live="polite"` + `aria-atomic="true"` in modern browsers; keep the explicit attribute for older AT combos. Do NOT put the live region on confetti/animation wrappers — text node only, so screen readers read exactly the outcome.

- [ ] **Step 4: Run tests + typecheck — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx src/games/word-spell/WordSpell/WordSpell.tsx src/games/sort-numbers/SortNumbers/SortNumbers.tsx src/games/*/**/*.test.tsx
git commit -m "feat(a11y): ARIA live region announces round outcomes independently of TTS (spec §7.3/§12.2)"
```

---

## Task 16: Rename InstructionsOverlay → GameOptionsOverlay; remove auto-speak; emit game.prepare

**REQUIRED SKILL:** `write-storybook` (the moved file gets a new title: `'AnswerGame/GameOptions/GameOptionsOverlay'`).

**Files:**

- Move: `src/components/answer-game/InstructionsOverlay/` → `src/components/answer-game/GameOptions/`
- Rename inside the directory: `InstructionsOverlay.tsx` → `GameOptionsOverlay.tsx` (plus `.test.tsx`, `.stories.tsx`)
- Move (unchanged): `useConfigDraft.ts` and `useConfigDraft.test.tsx`
- Modify (behavior): `GameOptionsOverlay.tsx` — remove the `useEffect(() => { if (ttsEnabled) speak(text); ... }, [])` block at line 173–174; replace with bus emit of `game.prepare` whose envelope (`profileId` / `sessionId`) comes from `useCurrentProfile()` / `useCurrentSession()` (created in Task 8.5; spec §8.5 A1 path)
- Modify: `src/routes/$locale/_app/game/$gameId.tsx` — update import + JSX

- [ ] **Step 1: Move the files via git**

```bash
git mv src/components/answer-game/InstructionsOverlay src/components/answer-game/GameOptions
cd src/components/answer-game/GameOptions
git mv InstructionsOverlay.tsx GameOptionsOverlay.tsx
git mv InstructionsOverlay.test.tsx GameOptionsOverlay.test.tsx
git mv InstructionsOverlay.stories.tsx GameOptionsOverlay.stories.tsx
```

- [ ] **Step 2: Write the failing test (no auto-speak on mount; emits game.prepare)**

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

  it('does NOT auto-speak the how-to-play text on mount (regardless of user talkativeness)', () => {
    render(<GameOptionsOverlay text="How to play …" />);
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('emits lifecycle.speak { game.prepare } on mount', () => {
    const received: string[] = [];
    const unsub = getGameEventBus().subscribe(
      'lifecycle.speak',
      (e) => {
        if (e.lifecycleEvent === 'game.prepare')
          received.push(e.gameId);
      },
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

Expected: FAIL — auto-speak useEffect still fires; no `lifecycle.speak` emit.

- [ ] **Step 4: Update GameOptionsOverlay**

In `GameOptionsOverlay.tsx`:

- Rename the exported component: `InstructionsOverlay` → `GameOptionsOverlay`.
- Delete the `useEffect` block at lines 173–174 that calls `speak(text)`.
- Add a new `useEffect(() => { ... }, [])` that emits `lifecycle.speak` with `lifecycleEvent: 'game.prepare'`.

**The emit MUST be `lifecycle.speak`, not a bare `game.prepare` event** (closes 2026-06-09 finding C4): the actor is the single bus subscriber and it subscribes **only** to `lifecycle.speak` — a bare `game.prepare` emit would be silently dropped and the Game Options speech would never play. (Task 4's `GamePrepareEvent` type still exists on the bus union for future analytics/SRS consumers; the TTS path is `lifecycle.speak`.)

**Envelope source** (spec §8.5 — A1 pre-engine path). `GameOptionsOverlay` reads `profileId` and `sessionId` for the bus envelope from the two new hooks (it fires pre-engine, so it cannot source them from engine context):

```tsx
// inside GameOptionsOverlay.tsx
const profile = useCurrentProfile();
const session = useCurrentSession();
useEffect(() => {
  getGameEventBus().emit({
    type: 'lifecycle.speak',
    lifecycleEvent: 'game.prepare',
    gameId,
    sessionId: session.id,
    profileId: profile.id,
    timestamp: Date.now(),
    // no roundIndex — `game.prepare` is non-round (spec §4.3.1)
  });
}, [gameId, session.id, profile.id]);
```

`game.start` / `game.resume` are emitted by the `useGameEngine` mount effect (single emit-site contract, Spec Delta 5) — not by the provider or overlay.

- Drop the `ttsEnabled` prop (replaced by `game.prepare` flowing through the actor on the bus).
- Update the Storybook title to `'AnswerGame/GameOptions/GameOptionsOverlay'`.
- The visible content stays the same for M1 — the `text` prop still renders, but it's no longer spoken aloud unless the resolved `game.prepare` template says so.

- [ ] **Step 5: Update the route**

In `src/routes/$locale/_app/game/$gameId.tsx`, replace the `InstructionsOverlay` import at line 24 AND each of the four `<InstructionsOverlay />` JSX usages at lines 529, 676, 822, 964 (one per game: word-spell, number-match, sort-numbers, spot-all) with `<GameOptionsOverlay />`. Drop the legacy `ttsEnabled` prop from each call site (no replacement — auto-speak gating now lives on user-level `talkativeness` accessed via `useSettings()`, not on per-call-site props).

- [ ] **Step 6: Run tests + typecheck**

```bash
yarn typecheck
npx vitest run src/components/answer-game/GameOptions/ src/routes/$locale/_app/game/
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(answer-game): rename InstructionsOverlay → GameOptionsOverlay; remove auto-speak; emit game.prepare on mount"
```

---

## Task 17: Talkativeness slider in SettingsPanel + gradeBand select in AdvancedConfigModal

**Why split:** spec §13.1.B #11 lock — `talkativeness` is a **user-level** setting (lives on `SettingsDoc`, accessed via `useSettings()`), not per-game. It belongs in **SettingsPanel** so it's set once per user. The per-game `AdvancedConfigModal` only gets `gradeBand` (which IS per-game tuning). The legacy `ttsEnabled` toggle in SettingsPanel is removed (replaced by the slider; Task 5 sub-task 5A bumps the schema).

**REQUIRED SKILL:** `write-storybook` (if the existing modal/panel has a story, update it).

**Files:**

- Modify: `src/components/SettingsPanel/SettingsPanel.tsx`
- Modify: `src/components/SettingsPanel/SettingsPanel.test.tsx`
- Create: `src/components/SettingsPanel/CloudVoiceModal.tsx` (Sub-task 17C, spec §8.3)
- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`

### Sub-task 17A: SettingsPanel — add Talkativeness slider (user-level)

- [ ] **Step 1: Write the failing test**

Add to `SettingsPanel.test.tsx`:

```tsx
it('renders the Talkativeness slider with three positions', () => {
  render(<SettingsPanel {...defaultProps} />);
  // The 3-stop slider per spec §8.2: 🤫 Shhh / 💬 Talk a bit / 🗣️ Talk a lot.
  expect(screen.getByText(/shhh/i)).toBeInTheDocument();
  expect(screen.getByText(/talk a bit/i)).toBeInTheDocument();
  expect(screen.getByText(/talk a lot/i)).toBeInTheDocument();
});

it('writes talkativeness to user settings on slider change', async () => {
  const updateMock = vi.fn();
  (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
    settings: { talkativeness: 'helpful' },
    update: updateMock,
  });
  render(<SettingsPanel {...defaultProps} />);
  // Simulate slider drag to position 2 ('chatty').
  fireEvent.change(screen.getByRole('slider'), {
    target: { value: '2' },
  });
  await waitFor(() => {
    expect(updateMock).toHaveBeenCalledWith({
      talkativeness: 'chatty',
    });
  });
});

it('does NOT render a ttsEnabled toggle anymore (replaced by the slider)', () => {
  render(<SettingsPanel {...defaultProps} />);
  expect(screen.queryByRole('checkbox', { name: /tts/i })).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — slider not rendered; legacy `ttsEnabled` toggle still present.

- [ ] **Step 3: Add the Talkativeness slider per spec §8.2**

In `SettingsPanel.tsx`, replace the legacy `ttsEnabled` toggle row with:

```tsx
const SLIDER_VALUES: Talkativeness[] = [
  'on-demand',
  'helpful',
  'chatty',
];

const { settings, update } = useSettings();
const idx = SLIDER_VALUES.indexOf(settings.talkativeness ?? 'helpful');

<div className="settings-row">
  <Label htmlFor="talkativeness-slider">
    How much should the game talk?
  </Label>
  <Slider
    id="talkativeness-slider"
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
```

Copy is spec §8.2 **verbatim and locked**: the heading label, the three stop labels, and the intent-framed tooltip stay literal — "no new label keys"; the emoji sit in `aria-hidden` spans (no `aria-label` on the parent — NVDA/VoiceOver double-announce risk). The **only** new §8.2 i18n keys are the three descriptors (`settings.talkativeness.descriptor.*`, Task 18), which drive both the persistent below-slider `<p>` and the slider's `aria-valuetext` — one copy track. The Storybook control uses `argTypes` radio (per project convention — slider is the user-facing UI, radio is the dev surface).

- [ ] **Step 3b: Persistent descriptor + `aria-valuetext` (spec §8.2 — closes FYI F-7)**

The Step 3 snippet already renders the persistent descriptor `<p>` and wires `aria-valuetext` (spec §8.2 — the descriptor strings drive both, no separate copy track). This step adds the test coverage: assert the descriptor text changes when the slider moves, and the slider exposes the matching `aria-valuetext`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/SettingsPanel/SettingsPanel.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel/
git commit -m "feat(settings-panel): replace ttsEnabled toggle with Talkativeness slider (spec §8.2)"
```

### Sub-task 17B: AdvancedConfigModal — add `gradeBand` select (per-game)

`gradeBand` is per-level / per-game tuning — it drives the `round.idle` nudge timing (spec §10.1) and future per-band behavior; copy selection itself is per-variant (§9) — appropriate for the per-game modal.

- [ ] **Step 6: Write the failing test**

Add to `AdvancedConfigModal.test.tsx`:

```tsx
it('renders a gradeBand select with pre-k / k / year1-2 / year3-4 / year5-6', () => {
  render(<AdvancedConfigModal {...defaultProps} />);
  const select = screen.getByLabelText(/grade band/i);
  expect(select).toBeInTheDocument();
  // Default selection: 'pre-k' — spec §5.3 safest default (F-8).
  expect(select).toHaveValue('pre-k');
});

it('writes gradeBand to the config draft on selection', () => {
  const onChange = vi.fn();
  render(<AdvancedConfigModal {...defaultProps} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/grade band/i), {
    target: { value: 'year3-4' },
  });
  // P1-fix from 2026-05-13 review: onChange takes Partial<Draft>; pass single-key patch.
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({ gradeBand: 'year3-4' }),
    }),
  );
});

it('does NOT render a Talkativeness control in the per-game modal (user-level setting)', () => {
  render(<AdvancedConfigModal {...defaultProps} />);
  expect(screen.queryByRole('radio', { name: /chatty/i })).toBeNull();
  expect(
    screen.queryByRole('slider', { name: /talkativeness/i }),
  ).toBeNull();
});
```

- [ ] **Step 7: Run tests to verify they fail**

Expected: FAIL — `gradeBand` not in the form yet.

- [ ] **Step 8: Add the gradeBand select to the modal**

In `AdvancedConfigModal.tsx`, add a new field within the per-game config form:

```tsx
<label>
  {t('config.gradeBand.label', { defaultValue: 'Grade band' })}
  <select
    value={value.config.gradeBand ?? 'pre-k'}
    onChange={(e) =>
      // P1-fix: onChange signature is (patch: Partial<Draft>) — pass single-key patch.
      onChange({
        config: {
          ...value.config,
          gradeBand: e.target.value as GradeBand,
        },
      })
    }
  >
    <option value="pre-k">{t('config.gradeBand.preK')}</option>
    <option value="k">{t('config.gradeBand.k')}</option>
    <option value="year1-2">{t('config.gradeBand.year1to2')}</option>
    <option value="year3-4">{t('config.gradeBand.year3to4')}</option>
    <option value="year5-6">{t('config.gradeBand.year5to6')}</option>
  </select>
</label>
```

**Do NOT add a Talkativeness control here** — that lives in SettingsPanel (sub-task 17A above) per §13.1.B #11.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/AdvancedConfigModal.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(advanced-config): add gradeBand select to per-game config (talkativeness lives in SettingsPanel)"
```

---

### Sub-task 17C: `useOfflineVoicesOnly` toggle + `CloudVoiceModal` (spec §8.3)

Closes 2026-06-09 finding C6 (privacy half): the v4 schema ships `useOfflineVoicesOnly` (Task 5) but no task gave it a UI. Spec §8.3: **any** toggle change (both directions) triggers a parent-confirmation modal — kid-tap protection so a child can't silently re-route audio.

- [ ] **Step 11: Write the failing tests**

Add to `SettingsPanel.test.tsx`: (a) toggling `useOfflineVoicesOnly` in either direction opens the modal and does NOT flip the setting yet; (b) `Cancel` leaves the setting unchanged; (c) `Yes, allow` flips it via `useSettings().update`.

- [ ] **Step 12: Run tests to verify they fail**

- [ ] **Step 13: Implement the toggle + modal**

Create `src/components/SettingsPanel/CloudVoiceModal.tsx` (reuse the project's existing AlertDialog primitives). Copy from spec §8.3 verbatim, via i18n keys (Task 18 adds them):

- Title `settings.cloudVoiceTitle`: "Use online voices too?"
- Body `settings.cloudVoiceBody`: "Online voices need an internet connection — they won't work when you're offline. Turning this on lets the game also use voices from a cloud service in addition to the voices already on your device."
- Actions: `Cancel` (default; leaves setting unchanged) / `Yes, allow` (flips the toggle).

Wire the toggle in `SettingsPanel.tsx`: tap → open modal → confirm → `update({ useOfflineVoicesOnly: next })`. When confirming `true` (re-enabling offline-only) while the active voice is a cloud voice, the speaker falls back to the first local voice for the locale + `console.warn` (spec §8.3; the speaker-side fallback already lands in Task 6's `pickVoice` ladder).

Browser caveats go in a `(?)` info-button tooltip next to the toggle label (key `settings.cloudVoiceCaveats`), NOT in the modal body — §8.3 rationale: modal copy stays scannable.

- [ ] **Step 14: Run tests + typecheck — PASS**

- [ ] **Step 15: Commit**

```bash
git add src/components/SettingsPanel/SettingsPanel.tsx src/components/SettingsPanel/SettingsPanel.test.tsx src/components/SettingsPanel/CloudVoiceModal.tsx
git commit -m "feat(settings): useOfflineVoicesOnly toggle with CloudVoiceModal parent confirmation (spec §8.3)"
```

---

## Task 18: i18n keys (en + pt-BR)

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Add the top-level `tts` key (en/games.json)**

Add to `src/lib/i18n/locales/en/games.json`:

Key shape is `tts.<game-id>.<event-kebab>.<variant>` (spec §9.4) — variants are `helpful` and `chatty`; `on-demand` gets **no keys** because it defaults to `DONT_SPEAK` (§9.8). `helpful` is the complete instructional line; `chatty` adds encouragement around it:

```jsonc
{
  // ... existing keys
  "tts": {
    "word-spell": {
      "game-prepare": {
        "helpful": "{{gameName}}. Tap Let's go to start, or pick a level.",
        "chatty": "{{gameName}}! Ready to play? Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "helpful": "Let's spell some words. Drag the tiles to spell each word.",
        "chatty": "Let's spell some words! Drag the tiles to spell each word. You can do it!",
      },
      "round-start": {
        "helpful": "Spell the word {{word}}.",
        "chatty": "Let's spell. Spell the word {{word}}. You can do it!",
      },
      "round-error": {
        "helpful": "Try again. The word is {{word}}.",
        "chatty": "Almost! Try again — the word is {{word}}.",
      },
      "round-idle": {
        "helpful": "Take your time. Tap the speaker if you need to hear it again.",
        "chatty": "No rush — try one of the letters when you're ready.",
      },
      "turn-correct": {
        "helpful": "Yes.",
        "chatty": "Great — keep going!",
      },
      "turn-error": {
        "helpful": "Not that one.",
        "chatty": "Not that one — try another letter.",
      },
      "round-correct": {
        "helpful": "Yes — {{word}}!",
        "chatty": "Yes! You spelled {{word}}! Amazing!",
      },
      "level-complete": {
        "helpful": "Level complete. You spelled {{correctCount}} words.",
        "chatty": "Level complete! You spelled {{correctCount}} words. Keep going!",
      },
      "game-end": {
        "helpful": "Game over. You spelled {{correctCount}} words.",
        "chatty": "Game over! You spelled {{correctCount}} words. Great job!",
      },
    },
    "number-match": {
      "game-prepare": {
        "helpful": "{{gameName}}. Tap Let's go to start, or pick a level.",
        "chatty": "{{gameName}}! Ready? Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "helpful": "Let's match numbers. Find the matching number for the dots.",
        "chatty": "Let's match numbers! Count the dots and find the matching number. Here we go!",
      },
      "round-start": {
        "helpful": "Find the matching number for {{count}}.",
        "chatty": "Count the dots! Find the matching number for {{count}}. You can do it!",
      },
      "round-error": {
        "helpful": "Try again. Count the dots.",
        "chatty": "Not quite! Count the dots one by one, then try again.",
      },
      "round-idle": {
        "helpful": "Take your time. Which numbers match?",
        "chatty": "Tap a number when you're ready.",
      },
      "turn-correct": {
        "helpful": "Yes.",
        "chatty": "Yes, that's {{count}}!",
      },
      "turn-error": {
        "helpful": "Not that one.",
        "chatty": "Not that one — count the dots again.",
      },
      "round-correct": {
        "helpful": "Yes — that's {{count}}!",
        "chatty": "Yes! That's {{count}}! Well counted!",
      },
      "level-complete": {
        "helpful": "Level complete.",
        "chatty": "Level complete! Keep it up!",
      },
      "game-end": {
        "helpful": "Game over. You got {{correctCount}} of {{totalRounds}}.",
        "chatty": "Game over! You got {{correctCount}} of {{totalRounds}}. Great job!",
      },
    },
    "sort-numbers": {
      "game-prepare": {
        "helpful": "{{gameName}}. Tap Let's go to start, or pick a level.",
        "chatty": "{{gameName}}! Ready to sort? Tap Let's go to start.",
      },
      "game-start": {
        "helpful": "Let's sort numbers. Drag them into the right order.",
        "chatty": "Let's sort numbers! Drag them into the right order. Here we go!",
      },
      "round-start": {
        "helpful": "Sort these numbers in {{direction}} order, skip by {{step}}.",
        "chatty": "Sort these numbers in {{direction}} order from {{from}} to {{to}}, skip by {{step}}. You can do it!",
      },
      "round-error": {
        "helpful": "That's not in {{direction}} order yet. Try again.",
        "chatty": "Almost! That's not in {{direction}} order yet. Check each number and try again.",
      },
      "round-idle": {
        "helpful": "Take your time. Drag the numbers in order.",
        "chatty": "No rush — start with the smallest one.",
      },
      "turn-correct": {
        "helpful": "Yes.",
        "chatty": "Yes — keep sorting!",
      },
      "turn-error": {
        "helpful": "Not there.",
        "chatty": "Not there — where does it belong?",
      },
      "round-correct": {
        "helpful": "Yes — sorted!",
        "chatty": "Yes! All sorted! Nice work!",
      },
      "level-complete": {
        "helpful": "Level complete.",
        "chatty": "Level complete! Keep going!",
      },
      "game-end": {
        "helpful": "Game over. Great job!",
        "chatty": "Game over! You sorted them all. Great job!",
      },
    },
  },
}
```

Every `{{var}}` above must exist in the §9.7 interpolation table (`word`, `count`, `target`, `direction`, `from`, `to`, `step`, `gameName`, `correctCount`, `totalRounds`) — the resolver returns `null` + dev-warns on any leftover `{{`.

Also add the Talkativeness slider labels (used by SettingsPanel — Task 17A) and the per-game gradeBand labels (used by AdvancedConfigModal — Task 17B):

```jsonc
{
  "settings": {
    // ... existing keys
    // §8.2: slider label / stop labels / tooltip stay literal in the
    // component ("no new label keys") — the three descriptors are the
    // only new §8.2 keys; they drive the <p> descriptor AND aria-valuetext.
    "talkativeness": {
      "descriptor": {
        "on-demand": "Game stays quiet. Tap the speaker button to hear questions.",
        "helpful": "Game speaks the question and key tips.",
        "chatty": "Game talks through every round.",
      },
    },
    "cloudVoiceTitle": "Use online voices too?",
    "cloudVoiceBody": "Online voices need an internet connection — they won't work when you're offline. Turning this on lets the game also use voices from a cloud service in addition to the voices already on your device.",
    "cloudVoiceCaveats": "Voice lists are reported by your browser and not always accurate. On iPhone and iPad all voices are already on-device. On Android, turning this off may leave a very short voice list.",
  },
  "audio": {
    // §8.7 AudioButton aria-labels (counted in the §9.8 ~70-key total).
    "replay": {
      "idle": "Hear the question",
      "playing": "Playing — tap to replay",
    },
  },
  "config": {
    // ... existing keys
    "gradeBand": {
      "label": "Grade band",
      "preK": "Pre-K",
      "k": "Kindergarten",
      "year1to2": "Year 1–2",
      "year3to4": "Year 3–4",
      "year5to6": "Year 5–6",
    },
  },
}
```

- [ ] **Step 2: Mirror in pt-BR/games.json**

Copy the same JSON structure into `src/lib/i18n/locales/pt-BR/games.json`. Values may stay as English placeholders for M1 — Portuguese translations land in a follow-up issue (open one and reference it in the commit).

- [ ] **Step 3: Create the template-coverage CI test (spec §11.2 — closes FYI F-6)**

Create `src/lib/lifecycle-tts/i18n-template-coverage.test.ts`: walk every `tts.*` leaf string in `en/games.json`, extract each `{{var}}`, and assert it is in the §9.7 interpolation table. This is the CI guard against template/`RoundContextValue` drift — it would have caught the `{{count}}`-in-word-spell bug fixed in this plan's round 2.

```ts
import { describe, expect, it } from 'vitest';
import en from '@/lib/i18n/locales/en/games.json';

// Must mirror buildInterpolation() in resolve.ts (§9.7).
const INTERPOLATION_VARS = new Set([
  'word',
  'count',
  'target',
  'direction',
  'from',
  'to',
  'step',
  'gameName',
  'correctCount',
  'totalRounds',
]);

const leafStrings = (node: unknown): string[] =>
  typeof node === 'string'
    ? [node]
    : Object.values(node ?? {}).flatMap(leafStrings);

describe('i18n template coverage (spec §11.2)', () => {
  it('every {{var}} in tts.* templates exists in the §9.7 interpolation table', () => {
    const templates = leafStrings((en as Record<string, unknown>).tts);
    expect(templates.length).toBeGreaterThan(0);
    for (const template of templates) {
      for (const [, varName] of template.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(
          INTERPOLATION_VARS.has(varName),
          `unknown var {{${varName}}} in "${template}"`,
        ).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 4: Run tests + typecheck**

```bash
npx vitest run src/lib/lifecycle-tts/i18n-template-coverage.test.ts --reporter=verbose
yarn typecheck
```

Expected: PASS. (JSON + one test file — no markdown touched, nothing to `lint:md`.)

- [ ] **Step 5: Run the game in dev to verify keys resolve**

`yarn dev`, open each game with the user-level Talkativeness set to `helpful` or `chatty` in SettingsPanel, confirm speech matches the registered templates.

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/locales/ src/lib/lifecycle-tts/i18n-template-coverage.test.ts
git commit -m "i18n: add per-variant tts.* keys + template-coverage CI test (spec §9.4, §11.2)"
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

- New TTS data flow (machine → `speak` action → bus → `useLifecycleTts`)
- `GameDefinition.tts` field — how to add TTS to a new game
- `useLifecycleTts` hook — auto vs on-demand surfaces; auto-speech gate is user-level `talkativeness` (read via `useSettings()`), on-demand surfaces are ungated per §5.4
- User-level `talkativeness` on `SettingsDoc` (RxDB v3→v4) vs per-game `gradeBand` on `AnswerGameConfig`
- The removal of `useRoundTTS`
- The InstructionsOverlay → GameOptionsOverlay rename + behavior change

- [ ] **Step 2: Format + lint the touched docs (check-only — never `--fix`)**

Run: `npx prettier --write <touched .mdx files> && yarn lint:md`
Expected: clean output. Per issue #420, `yarn fix:md` / `markdownlint --fix` corrupt code spans in agent-authored docs — use Prettier for formatting and markdownlint **check-only**; fix any remaining violations by hand.

- [ ] **Step 3: Commit**

```bash
git add src/components/answer-game/*.mdx src/lib/game-engine/*.mdx
git commit -m "docs(architecture): document TTS lifecycle data flow + GameDefinition.tts contract"
```

---

## Self-Review Checklist (run before opening the PR)

- [ ] **Spec coverage.** Re-read spec §12.2 M1 acceptance criteria. Confirm each item has at least one task that implements it. Items deferred to follow-ups are listed in "Out of scope for M1" with the issue/PR they track.
- [ ] **Placeholder scan.** Search this plan for `TBD`, `TODO`, `implement later`, `similar to`. Should be zero (architecture-docs `TODO(PR …)` comments aside).
- [ ] **Type consistency.** `LifecycleEvent`, `Talkativeness`, `EventBindings`, `EventBindingsMap`, `ResolutionLayers`, `RoundContextValue` are defined in Task 1 and used identically throughout. `GameDefinition.tts?: EventBindingsMap` matches `definition-types.ts` after Task 1 Step 2.
- [ ] **NumberMatch "speak the answer" bug.** Task 9 includes both the binding (`tts.number-match.round-start.helpful`) and the machine `entry: [speak]` wiring. The dev-server smoke test in Task 9 Step 6 is the user-visible acceptance gate.
- [ ] **No `useRoundTTS` survivors.** `rg useRoundTTS src/` after Task 11 returns nothing.
- [ ] **No `ttsEnabled` survivors.** `rg ttsEnabled src/` after Task 5 returns nothing (or only in migration code paths that map legacy values).
- [ ] **CLAUDE.md compliance.** `yarn lint:md` + `npx prettier --check` clean (never `yarn fix:md` / `markdownlint --fix` on plan/spec docs — issue #420); Storybook titles PascalCase; full worktree paths in commit messages and PR body.
- [ ] **VR baselines.** Any layout-affecting tasks (12, 15, 16) include a `yarn test:vr:update` step with diff review.

---

## Acceptance Criteria (M1, this plan)

- [ ] `src/lib/lifecycle-tts/types.ts` exists and satisfies the forward reference at `src/lib/game-engine/definition-types.ts:8`.
- [ ] `InstructionsOverlay` → `GameOptionsOverlay` rename complete; **does not auto-speak** how-to-play on mount.
- [ ] `lifecycle.speak { lifecycleEvent: 'game.prepare' }` emitted by `GameOptionsOverlay` on mount (C4 — the bare `GamePrepareEvent` type exists for future analytics consumers only).
- [ ] `game.start` lifecycle event speaks the registered helpful/chatty copy after "Let's go" (via the `useGameEngine` mount-effect single emit-site — Task 8.6, Spec Delta 5 — which emits `lifecycle.speak { lifecycleEvent: 'game.start' }` to the app-mounted actor). **Not** the `playing`-state entry: that fires `round.start`, not `game.start`.
- [ ] NumberMatch's "speak the answer" bug fixed — bare-numeral readout replaced by `tts.number-match.round-start.helpful` ("Find the matching number for {{count}}.").
- [ ] `ttsEnabled` removed from both `AnswerGameConfig` (per-game) and `SettingsDoc` (user). User-level `talkativeness: 'on-demand' | 'helpful' | 'chatty'` added to `SettingsDoc` via RxDB v3→v4 migration (default `'helpful'`; legacy `ttsEnabled: false` maps to `'on-demand'`). Per-game `gradeBand: GradeBand` added to `AnswerGameConfig` (default `'pre-k'`, spec §5.3 safest).
- [ ] `AudioButton` **always renders** (spec §5.4 no hard-mute); a tap speaks the copy resolved for the `helpful` variant by default (overridable via `useSpeakButton({ variant })`, spec §8.7 + §12.2).
- [ ] The three question components used by the XState-migrated games (TextQuestion, ImageQuestion, EmojiQuestion) route onClick speech through `useSpeakButton().speak()` (`SPEAK_USER`) with **no gate** (taps always speak per §5.4). (DotGroupQuestion is a SpotAll surface and migrates with the SpotAll follow-up — see Spec Delta 1.)
- [ ] `<QuestionRow>` renders inline (icon left, content right) on all breakpoints; AudioButton ≥ 44×44 px; content wraps to extra lines.
- [ ] WordSpell, NumberMatch, SortNumbers each have an inline AudioButton via `<QuestionRow>`.
- [ ] **SpotAll deferred per Spec Delta 1** — tracked in a follow-up issue gated on PR 1d (#368).
- [ ] User-level **Talkativeness slider** (🤫 Shhh / 💬 Talk a bit / 🗣️ Talk a lot) lands in `SettingsPanel` (spec §8.2); per-game `gradeBand` select lands in `AdvancedConfigModal`. Legacy `ttsEnabled` toggle in SettingsPanel removed.
- [ ] **G-4 SRS producer**: `lifecycle.tts.played` event emitted by the actor's `emitTtsPlayed` action on each speaker `invoke.onDone` resolve (spec §6.7) with the correct payload shape (`source: 'auto' | 'user'`, `variant: Talkativeness`, real `durationMs = now - enqueuedAt`, `subject: LifecycleSubject | null`, full envelope). SRS recorder ([#364](https://github.com/leocaseiro/base-skill/issues/364)) consumes it in a separate PR.
- [ ] **G-3 mini-game reservations**: `mini-game.start | mini-game.complete | mini-game.skip` baked into the `LifecycleEvent` union + bus event type (Phase 0 Commit 4); no firing code in M1.
- [ ] **G-2 skin resolver layer**: `skin.tts?` layer is Layer 2 of the four-layer resolver chain (Task 3 resolver — always `undefined` in M1, present in type + walked by resolver so M3 work is purely additive).
- [ ] WordSpell, NumberMatch, SortNumbers each have a `tts:` block on their `GameDefinition`.
- [ ] i18n keys for `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*`, `settings.talkativeness.*`, and `config.gradeBand.*` exist in `en` and `pt-BR` (pt-BR may be English placeholders).
- [ ] `useRoundTTS` removed; all round-start auto-speech goes through the XState machine `entry` actions.
- [ ] ARIA live region (`role="status"`) announces round outcomes in all three migrated games, independently of TTS settings (Task 15.5, spec §12.2).
- [ ] `round.idle` nudge fires per spec §10.1 semantics (once per round, gradeBand-timed, cancel-on-correct, one restart on wrong, disabled at year3-4+) in all three migrated games (Task 11.5).
- [ ] `useOfflineVoicesOnly` toggle ships with the `CloudVoiceModal` parent confirmation in both directions (Sub-task 17C, spec §8.3).
- [ ] AudioButton shows the §8.7 restart flash on re-tap preemption and the §5.6.1 one-shot pulse on the first `round.start` after `talkativeness` flips to `on-demand` (Task 13).
- [ ] `LIFECYCLE_TTS_PLAYED` forwarding rail live in the engine (Task 8.7, spec §10.2) — M1 machines unaffected, Spec 1b drops in with zero engine churn.
- [ ] Known, documented gap (FYI F-11): `round.error` machine wiring in Task 9 is best-effort — the binding + i18n keys ship, but the firing path may defer to M2 if non-trivial (Task 9 Step 4). Not silent: errors keep their visual cue, and `turn.error` SFX still fires.
- [ ] Architecture docs (`GameEngine.flows.mdx`, `GameEngine.reference.mdx`) updated to document the new TTS data flow.

## Out of scope for M1 (deferred — tracked separately)

- SpotAll AudioButton + `speakPrompt` consolidation → follow-up tied to PR 1d (#368).
- Per-event `customConfig.events` override surface → M2.
- `LifecycleTTSExplorer.stories.tsx` registry-table viewer → M2.

---

**Status:** Plan ready for execution. Pick `superpowers:subagent-driven-development` (recommended — fresh subagent per task) or `superpowers:executing-plans` (inline batch). **The former P0 architectural calls (C2 resolver model, C3a emit seam, C3f mount site) were RESOLVED 2026-06-10 and are folded into the plan body — do not re-litigate them from the Deferred / Open Questions history below; the history quotes superseded models on purpose.**

---

## Deferred / Open Questions

### Status note (2026-05-23) — many P1/P2 findings superseded by §13.1.B locks

The findings below were captured by the 2026-05-13 ce-doc-review pass against the 2026-05-13 plan draft (which used the 4-flag `autoSpeak`/`ttsOnDemandAllowed`/`gradeBand`/`talkativeness` per-game scheme). Several have been **resolved or superseded** by the §13.1.B locks closed 2026-05-23 + the Phase B restructure of this plan:

- **P1 — RxDB Settings.ttsEnabled schema migration missing** — **RESOLVED.** Task 5 sub-task 5A now includes the v3→v4 schema migration with full schema declaration (every field, because `additionalProperties: false`) and `settingsMigrations[4]` mapping per spec §5.8. Migration test file path included.
- **P1 — AdvancedConfigModal.onChange signature** — **RESOLVED.** Task 17B's snippet now uses `onChange({ config: { ...value.config, gradeBand } })` (single-key patch shape).
- **P1 — Per-game ConfigField descriptors + config-tags.ts not in Task 5 checklist** — **RESOLVED.** Task 5 sub-task 5C per-file checklist now includes `*ConfigFields` arrays, `config-tags.ts`, and `config-tags.test.ts`.
- **P1 — AudioButton has no specified visual state while speaking** — **STILL DEFERRED** (M2 follow-up; documented as Out-of-scope). The "disabled (hidden when ttsOnDemandAllowed: false)" third state is **gone** per §5.4 (no hard-mute) — only the speaking-indicator P1 (idle vs speaking) remains.
- **P1 — SpotAllPrompt prop migration underspecified** — **PARTIALLY RESOLVED.** With the §5.4 no-hard-mute lock, SpotAllPrompt's conditional render no longer needs an `ttsOnDemandAllowed` gate — it always renders. The auto-speak `useEffect` gate flips to `useSettings().talkativeness !== 'on-demand'`. PR 1d (#368) still owns the full SpotAll wiring.
- **P1 — Task 5 commit size: single `git add -A`** — **RESOLVED.** Task 5 sub-tasks now have explicit per-sub-task commit instructions following the baby-step convention.
- **P2 — ARIA live region** — **STILL OPEN.** See §13.1.D #19 / Task 19.5 candidate; documented as a known gap. The pre-Phase-B framing referenced `autoSpeak: false` (a dropped field); the gap itself is real and unchanged — accessibility-driven silent mode users get no round-outcome announcement in M1.
- **P2 — Talkativeness "Default" semantics ambiguous** — **MOOT.** §13.1.A renamed the values to `on-demand | helpful | chatty` (no "Default" label). The new labels are self-explanatory.
- **P2 — gradeBand / talkativeness have no UI surface in Game Options panel** — **PARTIALLY RESOLVED.** `talkativeness` now lives in **SettingsPanel** (Task 17A) where it is reachable via the settings gear; `gradeBand` is in `AdvancedConfigModal` (Task 17B).
- **P2 — Talkativeness presets include events deferred to M2** — **STILL OPEN.** Task 2's preset table currently covers all events; trimming to M1-active events is a low-priority polish task.

The remaining findings below are kept verbatim from the 2026-05-13 review for traceability. Read each one with the §13.1.B lock context in mind — references to `autoSpeak`/`ttsOnDemandAllowed` should be mentally translated to the new model (`talkativeness !== 'on-demand'` for auto-speech; no gate for taps).

### From 2026-05-13 ce-doc-review

A multi-persona review (coherence, feasibility, product-lens, design-lens, scope-guardian, adversarial) surfaced findings that were deferred during the review pass. They require resolution during execution or in a follow-up review. The reviewer that surfaced each finding is noted in parentheses. Convergent findings (multiple reviewers flagged the same concern) are marked with a count.

> **⚠️ Pre-actor-rewrite findings (annotated 2026-06-05).** Several findings below were captured against the original **hook-based** architecture (2026-05-13 review) and are partially or fully **superseded by the actor rewrite**. Any finding premised on _"Task 7's hook reads `gameDefinition` / `currentRound` from context"_, the per-tree `useLifecycleTts` mount, or the _"mount in game component vs thread through `AnswerGameProvider`"_ choice no longer applies — the runtime is now a single app-mounted `lifecycleTtsMachine` actor (Tasks 6–8.5), and each game machine supplies its own interpolation payload in the `lifecycle.speak` event (Tasks 9–11). Re-evaluate each finding against the actor model at execution; the `game.start` / `game.prepare` P0 is already marked **RESOLVED** below.

#### P0 — implementation blockers (must resolve before or during execution)

- **P0 — `useLifecycleTts` reads `gameDefinition` + `currentRound` from a context that doesn't expose them** (coherence + scope-guardian + feasibility + adversarial — 4-way). Task 7's hook reads `current.gameDefinition?.tts` and `current.currentRound`. `AnswerGameState` (`src/components/answer-game/types.ts:81-99`) has neither. The plan's "Pick option 1" note is prose, not a concrete sub-step; option 2's premise is false (`src/games/registry.ts` only has metadata). **Resolution at execution:** pick one of (a) mount `useLifecycleTts` inside each game component where `gameDefinition` and `round` are in scope (recommended — avoids context surgery + sidesteps PR 1c divergence), (b) thread `gameDefinition` through `AnswerGameProvider` and update ~12 call sites. Commit the choice as a Spec Delta in the implementation PR.
- **P0 — `{{count}}` / `{{word}}` / `{{direction}}` interpolation reads `currentRound` but no machine populates `lastRoundOutput`** (adversarial). The headline NumberMatch "speak the answer" fix would render `"Find the matching number for 0"` instead of `"...for five"` — same shape as the bug it's meant to fix. Verified: `numberMatchMachine.context` (definition.ts:543-560) has no `lastRoundOutput`; round data lives in `NumberMatch.tsx:127` (`roundOrder[engineRoundIndex]`). **Resolution at execution:** if P0 above picks "mount in game component", interpolation reads `round` from the same closure that already computes it — no extra change. If P0 picks "thread through context", each of the three machines must add `assign({ lastRoundOutput: <derived> })` on `INIT_ROUND` / `ADVANCE_ROUND`.
- **P0 — Task 1 is misframed as "create types.ts"; file already exists on origin/master** (scope-guardian + adversarial — 2-way). `src/lib/lifecycle-tts/types.ts` was committed at `a653cf284` as a forward-reference pin. Contains `LifecycleEvent`, `Verbosity`, `Talkativeness`, `EventTemplate` — **missing `GameTTSConfig`** that Tasks 3 and 7 import. **Resolution at execution:** restructure Task 1 as "verify-and-extend": read existing file, add single missing export `export type GameTTSConfig = Partial<Record<LifecycleEvent, EventTemplate>>`, typecheck, commit `feat(lifecycle-tts): add GameTTSConfig type for per-game registry blocks`.
- **P0 — `game.start` and `game.prepare` speech paths are unwired** — **RESOLVED by the actor rewrite.** All three lifecycle moments now emit a single `lifecycle.speak` bus event consumed by the app-mounted `lifecycleTtsMachine` actor (Tasks 6–8.5): (1) `game.prepare` is emitted by `GameOptionsOverlay` on mount, envelope sourced from `useCurrentProfile()` / `useCurrentSession()` (Task 16 Step 4, spec §8.5 A1 path); (2) `game.start` / `game.resume` are emitted by the engine `loading.entry` **single emit-site**, distinguished by `initialState` (Task 8.6, spec §4.2.1); (3) `round.*` verbs are emitted by each game machine's `entry: [speak]` actions (Tasks 9–11). There is no per-game `useLifecycleTts` subscriber to "translate" events — the actor is the one bus subscriber and resolves verbosity + copy itself. The earlier false acceptance-criterion (claiming `game.start` speaks via the `playing`-state entry) is corrected in the M1 acceptance list above: `playing`-state entry fires `round.start`; `game.start` comes from `loading.entry`. The Task 8.6 + Task 16 TDD steps assert the brief speaks on overlay mount and the full how-to-play speaks after "Let's go".

#### P1 — implementability gaps (resolve during execution, document choice in PR)

- **P1 — `entry: [speak({lifecycleEvent: 'round.start'})]` on `playing` state fires on initial entry BEFORE `INIT_ROUND` populates the round** (adversarial). The machine starts in `playing` (definition.ts:542); the speak action fires the moment `actor.start()` runs, before `AnswerGameProvider`'s mount effect dispatches `INIT_ROUND`. Round 0's speech misfires with empty context. Subsequent rounds work (waitingForNext → playing re-fires entry after ADVANCE_ROUND populates zones). **Resolution:** either gate the `speak` entry on a `hasRound` guard (`always: [{ guard: 'hasRound', target: 'playing' }]`), introduce an `idle` initial state that transitions to `playing` on first `INIT_ROUND`, or runtime-check the round is ready inside the speak action provider. Add an explicit test for round 0 timing.
- **P1 — RxDB `Settings.ttsEnabled` schema migration missing** (adversarial). `src/db/schemas/settings.ts:46` declares `ttsEnabled: boolean` at schema version 3 with `additionalProperties: false`. Removing the field requires bumping `version` to 4 and adding a `migrationStrategies` entry — otherwise existing users' IndexedDB documents fail to load. Task 5's per-file checklist doesn't list `src/db/schemas/settings.ts` or `src/db/hooks/useSettings.ts`. **Resolution:** add explicit sub-task to Task 5 bumping schema version + migrationStrategies splitting `ttsEnabled` into `autoSpeak` + `ttsOnDemandAllowed` (or keeping the legacy field with `@deprecated` JSDoc + read-only consumer). Also clarify the relationship: is `Settings.ttsEnabled` the source of truth that `AnswerGameConfig.ttsEnabled` inherits, or independent?
- **P1 — `AdvancedConfigModal.onChange` is `Partial<Draft>`; Task 17 prescribes spread-the-whole-config** (feasibility). Actual signature is `(patch: Partial<Draft>) => void` (`src/components/AdvancedConfigModal.tsx:40`). All existing call sites pass single-key patches. Plan's `onChange({ ...config, talkativeness: preset })` uses a `config` variable not in scope (modal works against `Draft`, not `AnswerGameConfig`) and spreads incorrectly. **Resolution:** replace Task 17's onChange snippet with `onChange({ config: { ...value.config, talkativeness: preset } })` and confirm `Draft.config` is the right home OR extend `Draft` with a top-level `talkativeness` field.
- **P1 — `gradeBand` is added as a required field on `AnswerGameConfig` but no form input writes it** (scope-guardian). The plan adds `gradeBand: GradeBand` to the config type and defaults to `'k'` in the migration table. No UI in M1 lets the user set it. Verbosity resolution (spec §5.1) uses `gradeBand` as the discriminator — so older kids (year3-4, year5-6) get the wrong verbosity by default. **Resolution:** make `gradeBand` optional with a default inferred from the active profile's grade setting (if exists) or default to `'pre-k'` (safest — always speaks). Add an explicit note in Out-of-Scope: gradeBand write path deferred to the Profile grade feature.
- **P1 — `sessionId` / `profileId` props missing on `GameOptionsOverlay`** (design-lens + feasibility — 2-way). Task 16 Step 4 emits `game.prepare` with required `BaseGameEvent` envelope fields (`gameId, sessionId, profileId, timestamp, roundIndex`). Current `InstructionsOverlay` props (lines 87-114) have neither `sessionId` nor `profileId`. Caller at four sites in `$gameId.tsx` (lines 529, 676, 822, 964) doesn't pass them. `profileId` is hardcoded as `'default'` inside `savePlayedDraft` callbacks (lines 1228+). **Resolution:** add `sessionId: string` and `profileId: string` to `GameOptionsOverlayProps`; thread from the four route call sites; document `profileId = 'default'` as a temporary default until parent-PIN profiles ship.
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
- **P2 — `useLifecycleTts` mounted for SpotAll has no defined behavior during M1 → PR 1d gap** (product-lens). If P0 above picks "thread through AnswerGameContext", the hook reads `current.gameDefinition?.tts` for SpotAll — but SpotAll has no `definition.ts` in M1. Plan doesn't specify what `gameDefinition` resolves to for SpotAll. Resolution: if mount-in-game-component (recommended P0 resolution), SpotAll is naturally excluded — no fix needed. If thread-through-context, accept `gameDefinition: GameDefinition | null` and short-circuit on null; PR 1d removes the null branch.
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
- **FYI** — `useLifecycleTts` useEffect deps include `i18n.language` → subscription churns on language change (feasibility). Refactor to read `t`/`i18n.language` from refs to keep subscription stable.
- **FYI** — `ctxRef.current` stale-read window during synchronous XState transition (adversarial). Speech may interpolate previous round's data. Web Speech cancel-on-new masks most cases in M1; M2 queue policy handles fully.
- **FYI** — Inversion: NumberMatch fix may feel partial to SpotAll-heavy users (product-lens). M1 ships speak-the-answer fix on NumberMatch only; SpotAll's prompt continues to auto-speak. Bound the user-visible win in the PR description.
- **FYI** — Task 7 "Pick option 1" advisory tone too soft (coherence). Resolved by the P0 architectural decision above — once "mount in game component" is committed, the soft advisory disappears.

### Review provenance

- Reviewers: ce-coherence-reviewer (7 findings), ce-feasibility-reviewer (11), ce-product-lens-reviewer (8), ce-design-lens-reviewer (6), ce-scope-guardian-reviewer (6), ce-adversarial-document-reviewer (12).
- Total raw findings: 50. After cross-persona dedup + merging: ~32 unique. Applied silently (safe_auto at anchor 100): 5. Applied via walk-through (P0-1 — caller removal in Tasks 9-11): 1. Deferred to this section: ~26 actionable + 5 FYI.
- Critical convergences: (1) `gameDefinition` / `currentRound` context wiring (4-way), (2) Task 5 ttsEnabled scope (3-way: 164 refs / 85 files / `git add -A` violation), (3) SpotAll scope underspecification (multi-way), (4) `sessionId` / `profileId` props missing (2-way), (5) per-game `ConfigField` descriptors gap (2-way), (6) ARIA live region defer (2-way), (7) `types.ts` exists / `GameTTSConfig` missing (2-way, verified).

### From 2026-06-09 ce-doc-review

**Round-2 resolution note (2026-06-10).** All eight non-compile-blocker clusters below are now RESOLVED in the plan body: D1 = spec-wins §9 rewrite (Tasks 1–3.5, commits `8c1358185` + `0eb9d5921`); D2 = mount in `$locale/_app.tsx` (Spec Delta 4); C3a = `useGameEngine` mount-effect seam (Spec Delta 5, Task 8.6); C3b = Task 8.7 forwarding rail; C3c = Task 3.5 RoundContext; C4 = `lifecycle.speak` emit + two-layer shape note; C5 = allowlist migration registered in `create-database.ts`; C6 = Task 13 additions + Task 15.5 ARIA + Sub-task 17C CloudVoiceModal. Spec §4.2.1 + §5.5.1 amended on PR #391 (`86a8a7c1f`). The FYI/P2 list below was triaged 2026-06-10 (all 12 applied/moot — see the per-item statuses). F-38 (round.idle M1 promotion, found by the 2026-06-10 consistency sweep) was decided 2026-06-12: implement in M1 → Task 11.5 + turn.\* keys/bindings.

Second multi-persona pass (coherence, feasibility, scope, design, adversarial) against the **actor-rewrite** plan. Findings are grouped into clusters C1–C7 plus an FYI/P2 list. The compile-blocker clusters (C1, C3d, C3e, C7) were fixed in the 2026-06-09 commit that lands this subsection; the rest are tracked here for resolution at execution. Entry format: `Cn — severity — status — Title — why it matters — fix — flagged by`.

- **C1 — P0 — RESOLVED 2026-06-09 (compile-blocker fix) — Task 1 `LifecycleEvent` 11→19 + `game.over`→`game.end` + missing type exports** — the 11-member union, the stale `game.over` literal, and the absent `SpeakPayload` / `TtsSettings` / `LifecycleSubject` / `subjectToken` exports made Tasks 6/8/8.5 fail to typecheck against `./types`. — fix: expanded Task 1 to the spec §4.1 19-event set, renamed `game.over`→`game.end` (+ `game-over`→`game-end` i18n keys) across Tasks 2/9–11/18 + the Modified-files table, and added the four missing type definitions (`LifecycleSubject` + `subjectToken` verbatim from §4.3, `TtsSettings` as a `Required<Pick<SettingsDoc, …>>`, `SpeakPayload` derived from §6/§9). — flagged by: coherence, feasibility, scope, adversarial.
- **C2 — P0 — RESOLVED 2026-06-10 (DECISION D1 = spec-wins) — Resolver model diverges from spec §9** — the plan's `EventTemplate{brief,full}` / `Verbosity` / `byGradeBand` resolver (Tasks 1–3) does not match spec §9's `EventBindings{'on-demand',helpful,chatty}` / `Talkativeness` / `INHERITED` / `DONT_SPEAK` / 4-layer model, and `resolveCopy` returns only an i18n key (no `{{var}}` interpolation, no `soundEffect` output), so the two models cannot both be the source of truth. — fix: **DECISION D1** — either rewrite Tasks 1–3 to spec §9 (spec-wins) OR keep the Verbosity model, declare a Spec Delta, and map Talkativeness→Verbosity at the actor boundary. — flagged by: coherence, scope, adversarial.
- **C3a — P0 — RESOLVED 2026-06-10 (Spec Delta 5) — Task 8.6 `loading.entry` single-emit-site has no machine to attach to** — per-game machines start `initial: 'playing'` with no shared engine machine and no `loading` state, and `executeSideEffects` has no `initialState`, so the prescribed `game.start`/`game.resume` single emit-site has nowhere to live. — fix: at execution, locate or introduce the engine-level `loading` state (or relocate the emit to the real mount seam) and thread `initialState`; reconcile against the actual engine surface after PR 1c. — flagged by: feasibility, adversarial.
- **C3b — P1 — RESOLVED 2026-06-10 (Task 8.7 added) — `LIFECYCLE_TTS_PLAYED` transition-gate rail asserted "ships in M1" but unimplemented** — Tasks 10/11 claim the bus→machine forwarding rail (spec §10.2) ships in M1, but no task wires `lifecycle.tts.played` back into the game machines. — fix: either add an explicit task implementing the bus→machine forward or downgrade the "ships in M1" claim to a reservation. — flagged by: feasibility, adversarial.
- **C3c — P1 — RESOLVED 2026-06-10 (Task 3.5 added) — `RoundContext` / `round-context.tsx` consumed but never created** — Tasks 13/8.5 call `useRoundContext` (via `roundToPayload(round)`), but no task creates `RoundContext` or specifies its mount site, so the in-game payload path is unbuildable as written. — fix: add a task creating `round-context.tsx` + provider and name its mount site (likely inside each game component, aligning with the C2/2026-05-13 P0 mount decision). — flagged by: feasibility, scope, design.
- **C3d — P0 — RESOLVED 2026-06-09 (compile-blocker fix) — `pick-tts-settings.ts` imported non-exported `DEFAULT_SETTINGS` / `UseSettingsResult`** — Task 8.5's `pick-tts-settings.ts` imports both symbols from `@/db/hooks/useSettings`, but they are module-private on master, so the import fails to compile. — fix: Task 5 Step 4 now adds `export` to `const DEFAULT_SETTINGS` and `type UseSettingsResult` (extracting the inline return type into a named alias if needed). — flagged by: feasibility.
- **C3e — P0 — RESOLVED 2026-06-09 (compile-blocker fix) — Unavailable-handler called `open(subject)` vs provider `show(voiceName, locale)`** — PR #409's `VoiceUnavailableDialogProvider` exposes `{ show }` with signature `show(voiceName: string, locale: string)`, not `open`, so the handler in Task 8.5 would not compile and would pass the wrong argument shape. — fix: changed to `const { show } = useVoiceUnavailableDialog()` and `show('', (e as LifecycleTtsUnavailableEvent).subject)` (subject carries the locale per §4.3); dep array updated to `[show]`. — flagged by: feasibility.
- **C3f — P1 — RESOLVED 2026-06-10 (DECISION D2 = mount in `$locale/_app.tsx`; Spec Delta 4) — `LifecycleTtsProvider` root-mount sits above `DbProvider`** — mounting in `__root.tsx` (per §5.5.1) places the Provider above `DbProvider` (mounted at `_app.tsx`), so `useSettings()` degrades to defaults (commit 76dc53e36) → the actor never sees live settings and the Talkativeness slider is inert. — fix: **DECISION D2** — either mount `LifecycleTtsProvider` below `DbProvider` (deviate from spec §5.5.1 and fix the spec) OR hoist `DbProvider` to the root. — flagged by: feasibility.
- **C4 — P1 — RESOLVED 2026-06-10 — Task 16 emits a bare `game.prepare` bus event, not `lifecycle.speak`** — the actor subscribes only to `lifecycle.speak`, so a raw `game.prepare` emit is silently dropped and the Game Options speech never plays; relatedly, the engine `speak` SideEffect is flat `{ type, lifecycleEvent }`, not `{ type, params: { lifecycleEvent } }` as some machine snippets show. — fix: emit `{ type: 'lifecycle.speak', lifecycleEvent: 'game.prepare', … }` from Task 16, and reconcile the `speak` SideEffect shape across the engine + machine snippets to one form. — flagged by: scope, coherence, feasibility, adversarial.
- **C5 — P1 — RESOLVED 2026-06-10 — Task 5 v4 migration never wired into `create-database.ts`; uses forbidden spread** — the migration is defined but not registered in `src/db/create-database.ts`, so it never runs and existing docs fail to load; it also uses `{ ...rest }` spread, which spec §5.9 forbids under `additionalProperties: false`. — fix: register `settingsMigrations[4]` in `create-database.ts` and rewrite the migration to an explicit field allowlist (no spread) per §5.8/§5.9. — flagged by: feasibility, scope, adversarial.
- **C6 — P1 — RESOLVED 2026-06-10 — M1 acceptance criteria with no implementing task** — several spec-mandated M1 behaviors have no task: §5.6.1 AudioButton pulse on talkativeness→`on-demand`; `CloudVoiceModal` + `useOfflineVoicesOnly` confirmation (§8.3); ARIA live region for round outcomes (§7.3/§12.2); AudioButton `restart-flash` re-tap handler (§8.7) missing from Task 13 code. — fix: add minimal tasks for each (or declare each an explicit Spec Delta), e.g. wrap round outcomes in `<div role="status" aria-live="polite">` and add the pulse `useEffect` to `useSpeakButton`. — flagged by: scope, design.
- **C7 — P1 — RESOLVED 2026-06-09 (compile-blocker fix) — Task 2 `PRESETS` keys `quiet`/`default` vs `Talkativeness` `on-demand`/`helpful`** — the `Record<Talkativeness, PresetProfile>` map used legacy keys `quiet:` / `default:`, which do not satisfy the `Talkativeness` union (`'on-demand' | 'helpful' | 'chatty'`), so the object fails to typecheck. — fix: renamed the map keys `quiet:`→`'on-demand':` and `default:`→`helpful:` (kept `chatty:`); preset contents unchanged. — flagged by: feasibility, scope.

#### FYI / P2 (2026-06-09 — DEFERRED, triage at execution)

- **RESOLVED 2026-06-10 — QuestionRow prop API mismatch** — plan uses `{ audio, content }`; spec §8.6 uses `{ audioEvent, children }`. Reconcile to the spec shape in Task 12.
- **RESOLVED 2026-06-10 — Provider DEV duplicate-guard misses sibling providers** — `use(Context)` only detects an ancestor Provider, not a sibling double-mount; use a module-level mount counter instead.
- **RESOLVED 2026-06-10 — `useSpeakButton` `isSpeaking` brands subject as the event name** — matching on `subjectToken(event)` breaks multi-button match; use the real payload `subject` per §8.7.
- **MOOT 2026-06-10 (D1 deleted the preset tables) — Talkativeness presets gate events with no M1 wiring** — `round.advance` / `round.celebrate`, `game.resume`, `turn.action` appear in presets but have no firing path in M1; trim or annotate.
- **RESOLVED 2026-06-10 — Task 5A migration test lacks the unknown-field-drop assertion** — §5.8 requires asserting an unknown legacy field is dropped (non-leakage); the current Step 1 asserts only the `ttsEnabled` branches + field preservation.
- **RESOLVED 2026-06-10 (Task 18 Step 3) — `i18n-template-coverage.test.ts` (§11.2) has no task** — the spec's template-coverage test is unowned; add a task or note the gap.
- **RESOLVED 2026-06-10 (17A Step 3b) — Talkativeness slider missing persistent descriptor + `aria-valuetext`** — §8.2 requires a below-slider text descriptor and `aria-valuetext`; Task 17 omits both.
- **RESOLVED 2026-06-10 ('pre-k' applied) — `gradeBand` default `'k'` vs spec §5.3 safest `'pre-k'`** — the migration/default uses `'k'`; spec §5.3 prefers `'pre-k'` (always speaks) as the safe default.
- **RESOLVED 2026-06-10 (Sub-task 17C: local-voice fallback + console.warn per §8.3) — `useOfflineVoicesOnly` re-enable active-cloud-voice fallback UI unspecified** — §8.3's feedback when re-enabling offline-only while a cloud voice is active is not described in any task.
- **RESOLVED 2026-06-10 (Sub-task 17C + `settings.cloudVoiceCaveats` key) — `(?)` info-button caveats tooltip not in Task 17** — the settings info-button tooltip copy is unspecified.
- **RESOLVED 2026-06-10 (acceptance-criteria note added) — `round.error` entry wiring deferred in Task 9 with no acceptance note** — the optional `round.error` tracking is deferred to M2 without an explicit acceptance criterion documenting the gap.
- **RESOLVED 2026-06-10 (Task 8.6 documents intentional silence) — `game.resume` emitted (Task 8.6) but has no M1 i18n key / tts block** — on refresh, `game.resume` resolves to `null` because no game registers a `game.resume` template; add a key/block or document the intentional silence.

# Spec 1a M1 — TTS Lifecycle Minimum Viable Copy Fix (XState rewrite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible TTS copy fixes from #229 — rename InstructionsOverlay, stop auto-speaking how-to-play, fix NumberMatch's "speak the answer" bug, add `talkativeness` (`on-demand | helpful | chatty`) to the user-level `SettingsDoc` (v3→v4 RxDB migration), add `gradeBand` to per-game `AnswerGameConfig`, deprecate `ttsEnabled`, add an inline QuestionRow + AudioButton on the three XState-migrated games (WordSpell, NumberMatch, SortNumbers), and surface the Talkativeness slider in `SettingsPanel`.

**Architecture:** Build the `src/lib/lifecycle-tts/` module whose forward-reference the engine already imports (`GameDefinition.tts`, `SideEffect 'speak'`). Each game's `src/games/<id>/definition.ts` carries its own `tts:` block — there is no parallel registry directory. The XState machine emits `{ type: 'speak', params: { lifecycleEvent } }` actions at the right transitions; `useGameEngine` routes those through `executeSideEffects` which emits a single `lifecycle.speak` bus event. The new `useLifecycleTts` hook subscribes to that one event, looks up the active game's `definition.tts[lifecycleEvent]`, resolves verbosity from the user's `talkativeness` (read via `useSettings()` per spec §5.5) and the per-game `gradeBand`, interpolates the i18n template, and calls `speak()` — auto-speech suppressed when `talkativeness === 'on-demand'` per spec §6.1's `autoAllowed` guard. On-demand surfaces (AudioButton, question onClick) call `speakOnDemand` directly — taps **always** speak per spec §5.4 (no hard-mute); the OS volume slider is the escape hatch.

**Tech Stack:** React 18, TypeScript, xstate@5, @xstate/react@5, Vitest, i18next, Web Speech API, existing GameEventBus.

**Spec:** [docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md](../specs/2026-05-16-lifecycle-tts-xstate-design.md) (M1 XState rewrite; supersedes the 2026-05-03 canon spec). §14 M1 acceptance criteria. §13.1.A-C locks (closed 2026-05-23) drive the Talkativeness vocab, settings shape, and bus rename below — Phase 0 is the executor's first step.

**Supersedes:** The plan in closed PR #349 (`docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`) — pre-dates PR 1a/1b XState engine, prescribed a parallel registry that conflicts with the engine's `GameDefinition.tts` contract.

**Required skills for executors:**

- `write-storybook` — for any `*.stories.tsx` files (Tasks 9, 12, 13, 16)
- `update-architecture-docs` — for `.mdx` changes co-located with `src/components/answer-game/` and `src/lib/game-engine/` (Task 19)
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## Spec Deltas

Refreshed against the 2026-05-16 spec (which now incorporates the deltas previously logged here against the 2026-05-03 canon). After the refresh, **only one true delta remains** — the rest aligned with spec text and are dropped.

1. **SpotAll deferred from M1.** Spec §14 M1 includes "AudioButton on all 4 games" and "SpotAllPrompt consolidates into useLifecycleTts." SpotAll is not on the XState engine yet (still uses `src/games/spot-all/spot-all-reducer.ts`). PR 1d (#368) migrates SpotAll; that PR will add the AudioButton + consolidation as a follow-up. M1 ships TTS for WordSpell, NumberMatch, and SortNumbers only. **Status:** still a real delta — spec §14 lists SpotAll inclusion as an M1 criterion that we are knowingly missing pending PR 1d.

**Re-verified and dropped (no longer deltas vs the 2026-05-16 spec):**

- ~~Per-game registry lives in `definition.ts` not a separate directory.~~ Spec §11.3 (Modified files) now prescribes adding `tts` `EventBindings` directly to each game's `definition.ts`. This matches the plan — no divergence, no delta.
- ~~`useLifecycleTts` subscribes to a single `lifecycle.speak` event, not per-event.~~ Spec §3.1 (Architecture Overview, Path A/B) and §11.3 (`src/lib/game-engine/execute-side-effects.ts` emits unified `lifecycle.speak`) both prescribe a single bus event. Matches the plan — no delta.

**New delta vs the 2026-05-13 plan draft (closed by §13.1.B #11 lock, 2026-05-23):**

1. **`talkativeness` moved from per-game `AnswerGameConfig` to user-level `SettingsDoc`.** The 2026-05-13 plan draft placed `talkativeness` on per-game `AnswerGameConfig` alongside `autoSpeak`/`ttsOnDemandAllowed`/`gradeBand`. The 2026-05-16 spec §5.5 + §13.1.B #11 locks it on the user-level `SettingsDoc` accessed via the existing `useSettings()` hook — so one custom game cannot override the parent's chosen verbosity. Per-game `AnswerGameConfig` keeps only `gradeBand` (per-level tuning, not per-user). The `autoSpeak` / `ttsOnDemandAllowed` flags from the draft are dropped entirely:
   - `autoSpeak` is **derived**, not stored: `autoSpeak = talkativeness !== 'on-demand'` (§5.3). Two flags can't drift apart.
   - `ttsOnDemandAllowed` is rejected by spec §5.4 (no hard-mute). Taps always speak. OS volume slider is the escape hatch.

   This delta is **applied throughout the plan below** — Task 5 migrates `talkativeness` into `SettingsDoc` (RxDB v3→v4) and adds `gradeBand` to per-game config; Task 7's hook reads `talkativeness` via `useSettings()` and gates only auto-speech (not on-demand).

These deltas are tracked here so M2 (full event surface, customConfig override layer) inherits the same conventions.

---

## Cross-goal alignment notes (2026-05-23)

M1 is the foundation for **six durable project goals** (per user directive 2026-05-23). This plan stays inside G-1 (TTS XState lifecycle) but must reserve seams + event taxonomy that the other five build on. Reviewer YAGNI on these reservations is **categorically rejected** — they are ADRs, not speculative scaffolding.

### G-1 — 100% XState migration

Owned by this plan. The spec §6.1 XState actor (parallel speech + soundEffect sub-machines) ships **in M1**, not in a follow-up PR. A singleton `lifecycleTtsMachine` actor is mounted once at the React root via `LifecycleTtsProvider` (spec §5.5.1, in [src/routes/\_\_root.tsx](../../src/routes/__root.tsx) inside `ServiceWorkerProvider`); the `WebSpeechSpeaker` class + `HtmlAudioSoundEffectPlayer` are injected into the machine as `invoke`d actors. `useLifecycleTts()` returns the actor ref via Context; the bus subscriber relays `lifecycle.speak` into the actor as `SPEAK_AUTO`. The actor receives `SETTINGS_CHANGED` (spec §5.5) whenever `useSettings()` changes, and the machine's `forwardSettings` action calls `speaker.updateSettings(next)` — no refs, no per-hook re-read. **Bus** is **only** used for the broadcast-to-N-subscribers pattern (`lifecycle.speak` → audio actor + SRS recorder + future analytics). Actor-to-actor / UI-to-actor calls use XState `sendTo` directly. Spec §3.2 is the rationale.

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

M1 ships the **mini-game event reservations** (spec §10.4) — `mini-game.start | mini-game.complete | mini-game.skip` are baked into the bus type union in **Phase 0 Commit 4** and listed in spec §4.1's 17-event `LifecycleEvent` type, but **no firing code lands in M1**. PR 1b+ adds real mini-game machines (DinoEggHatch, FireworksPainter, BubblePop, etc.) and the firing-side wiring; the dismissal contract (`bus.emit({ type: 'lifecycle.cancel' })`) is locked here so PR 1b+ doesn't re-litigate it.

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

No M1 code changes — but a forward-looking framing: the 17-event `LifecycleEvent` taxonomy (spec §4.1) is designed to be **emitter-agnostic**. `round.error` / `round.correct` / `round.advance` fire from any game's XState machine (not just answer-game), which means a future "distractions" data source can emit the same events and trigger the same TTS + UI animation paths. The plan's resolver (Task 3) does not bake assumptions about emitter identity — it just reads `gameId` + `lifecycleEvent` from the bus envelope. SpotAll (G-6) is exempt from this plan but its distractions strategy seeds G-5.

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
   bus.emit({ type: 'lifecycle.speak', lifecycleEvent, ...envelope })
                              │
                              ▼
[ useLifecycleTts subscriber (NEW) ]
   const { settings } = useSettings()                  // user-level (RxDB)
   if (settings.talkativeness === 'on-demand') return  // §6.1 autoAllowed guard
   resolveVerbosity(definition.tts, lifecycleEvent, config.gradeBand, settings.talkativeness)
     → 'off' | 'brief' | 'full'
   if 'off': return
   resolveCopy(definition.tts, lifecycleEvent, verbosity)
     → i18n key
   interpolate i18n key with AnswerGameContext snapshot
     → speakable string
   speak(string, { rate, volume, voiceURI, lang })

Tap-to-speak path (AudioButton, question onClick):
[ <AudioButton event="round.start" /> ]
   const { speakOnDemand } = useLifecycleTts()
   onClick: speakOnDemand('round.start')
   // NO talkativeness gate — taps always speak per §5.4 (no hard-mute).
   // OS volume slider is the escape hatch for "completely silent".
   // Future: gate on voice-availability via VoiceUnavailableDialogProvider
   //        (PR #409); see Task 7 for the integration sketch.
   resolve + interpolate + speak (always 'full' mode)
```

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
├── types.ts                       # LifecycleEvent, Verbosity, EventTemplate, Talkativeness, GameTTSConfig, LifecycleSubject + subjectToken, TtsSettings
├── talkativeness-presets.ts       # Quiet / Default / Chatty profiles per gradeBand
├── talkativeness-presets.test.ts
├── resolve.ts                     # resolveVerbosity() + resolveCopy() — pure functions
├── resolve.test.ts
├── errors.ts                      # LocalVoiceUnavailableError (§7.2)
├── pick-tts-settings.ts           # pickTtsSettings() — boundary-coerces SettingsDoc → Required<TtsSettings> (§5.5)
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
├── QuestionRow.test.tsx
├── QuestionRow.stories.tsx

src/components/answer-game/GameOptions/
├── GameOptionsOverlay.tsx         # Renamed from InstructionsOverlay; no auto-speak; emits game.prepare
├── GameOptionsOverlay.test.tsx
├── GameOptionsOverlay.stories.tsx
└── useConfigDraft.ts              # Moved unchanged from InstructionsOverlay/
```

### Modified files

<!-- markdownlint-disable MD060 -->

| File                                                             | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                                       | **Two-tier `BaseGameEvent` restructure** (`roundIndex` moves to new `RoundScopedGameEvent`); add `game.prepare` + 4 lifecycle literals (`lifecycle.cancel`, `lifecycle.tts.played`, `lifecycle.tts.unavailable`, `lifecycle.tts.cloud-fallback`) to `GameEventType`; add `GamePrepareEvent` + 4 new lifecycle event interfaces; extend the `GameEvent` union. Full set per **Chunk D** in Task 4. (`lifecycle.speak` already exists.)                                                         |
| `src/components/answer-game/types.ts`                            | Add `gradeBand: GradeBand` to per-game `AnswerGameConfig`. **Drop `ttsEnabled`.** `talkativeness` lives on user `SettingsDoc`, NOT on per-game config (spec §5.5, §13.1.B #11) — access via `useSettings()`.                                                                                                                                                                                                                                                                                  |
| `src/games/spot-all/types.ts`                                    | Drop `ttsEnabled`; add `gradeBand: GradeBand` to `SpotAllConfig`. (SpotAll's `speakPrompt` consolidation is deferred per Spec Delta 1 — only the type changes here so the config blob stays consistent.)                                                                                                                                                                                                                                                                                      |
| `src/db/schemas/settings.ts`                                     | **v3 → v4 RxDB schema migration.** Add `talkativeness: 'on-demand' \| 'helpful' \| 'chatty'` (default `'helpful'`) + `processLocally: boolean` (default `true`) at the top level. Drop `ttsEnabled`. Full v4 schema per spec §5.8 — every field declared because master enforces `additionalProperties: false`. Preserve `speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId`, `activeLanguage`, all volume fields, etc. exactly.                                                      |
| `src/db/hooks/useSettings.ts`                                    | Extend `DEFAULT_SETTINGS` with `talkativeness: 'helpful'` + `processLocally: true` so first-paint (before RxDB resolves) matches v4 defaults. No code-path change — reuse the existing `useRxQuery` wrapping.                                                                                                                                                                                                                                                                                 |
| `src/components/answer-game/useGameTTS.ts`                       | **Deprecated / superseded by the actor.** Auto-speech vs on-demand is now decided in the `lifecycleTtsMachine` (`SPEAK_AUTO` gated by the `autoAllowed` guard `talkativeness !== 'on-demand'`; `SPEAK_USER` never gated, §6.1). `speakTile`'s legacy `config.ttsEnabled` gate flips to the user-level `talkativeness` gate during the Task 5 `ttsEnabled` sweep; remaining call sites migrate to `useLifecycleTts()` / `useSpeakButton()`. Add `@deprecated` JSDoc so no new callers slip in. |
| `src/components/answer-game/useGameTTS.test.tsx`                 | Update tests for the talkativeness-gated `speakTile`; mock `useSettings()`.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/components/answer-game/useRoundTTS.ts`                      | **DELETE.** All three XState games drive round-start speech via `entry: [speak({ lifecycleEvent: 'round.start' })]` on the machine's `playing` state. No callers remain after Tasks 9, 10, 11.                                                                                                                                                                                                                                                                                                |
| `src/components/answer-game/useRoundTTS.test.tsx`                | **DELETE** alongside the source file.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/games/number-match/definition.ts`                           | Add `tts:` block (matches `Partial<Record<LifecycleEvent, EventTemplate>>` from `definition-types.ts:39`); add `entry: [{ type: 'speak', params: { lifecycleEvent: 'round.start' } }]` to `playing` state.                                                                                                                                                                                                                                                                                    |
| `src/games/word-spell/definition.ts`                             | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/games/sort-numbers/definition.ts`                           | Same shape — `tts:` block + `speak` entry on `playing`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Replace stacked numeral + question siblings with `<QuestionRow>`; pass `event="round.start"` to AudioButton.                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Same — `<QuestionRow>` wrap; pass `event` prop.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | **Add AudioButton** (currently has none) via `<QuestionRow>`; pass `event="round.start"`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch `prompt: string` prop to `event: LifecycleEvent`; call `useLifecycleTts().speakOnDemand(event)`. **No `talkativeness` gate** — taps always speak per spec §5.4. Button always renders (was: hidden when `ttsEnabled: false`).                                                                                                                                                                                                                                                          |
| `src/components/questions/AudioButton/AudioButton.test.tsx`      | Update tests for new prop API + "always renders" behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route `onClick` speech through `useLifecycleTts().speakOnDemand`. No `talkativeness` gate — taps always speak (§5.4).                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/questions/index.ts`                              | Add `QuestionRow` export.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/components/SettingsPanel/SettingsPanel.tsx`                 | Add 3-stop Talkativeness slider (`on-demand` \| `helpful` \| `chatty`) replacing the legacy `ttsEnabled` toggle; read/write via `useSettings()`. Tooltip explains "The speaker button always works." Spec §8.2.                                                                                                                                                                                                                                                                               |
| `src/components/AdvancedConfigModal.tsx`                         | Add `gradeBand` select to per-game config form (no Talkativeness here — it lives in SettingsPanel as a user-level setting per §13.1.B #11).                                                                                                                                                                                                                                                                                                                                                   |
| `src/components/AdvancedConfigModal.test.tsx`                    | Add test that selecting a gradeBand writes to the config draft.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/lib/i18n/locales/en/games.json`                             | Add `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*` keys (events: `game-prepare`, `game-start`, `round-start`, `round-error`, `round-correct`, `round-advance`, `level-complete`, `game-over`).                                                                                                                                                                                                                                                                                |
| `src/lib/i18n/locales/pt-BR/games.json`                          | Mirror keys (placeholder English values; Portuguese translations follow-up).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update `InstructionsOverlay` import + JSX to `GameOptionsOverlay`.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/routes/__root.tsx`                                          | **Mount `LifecycleTtsProvider` once** — inside `ServiceWorkerProvider`, outside the route outlet — so a single actor spans every route (spec §5.5.1). A sibling `useLifecycleTtsUnavailableHandler` subscribes to `lifecycle.tts.unavailable` and drives PR #409's `VoiceUnavailableDialogProvider`.                                                                                                                                                                                          |
| `src/lib/game-engine/side-effects.ts`                            | **Single emit-site for `game.start` / `game.resume`** — the engine `loading.entry` action is the SOLE emitter, distinguished by `initialState` (absent → `game.start`, present → `game.resume`). Spec §4.2.1. See TP8 task step.                                                                                                                                                                                                                                                              |
| `src/components/answer-game/AnswerGameProvider.tsx`              | **MUST NOT emit `game.start` or `game.resume`** — both come solely from the engine `loading.entry` single emit-site (spec §4.2.1), so they can never double-fire on mount. `game.prepare` is emitted by `GameOptionsOverlay` on mount, not the provider.                                                                                                                                                                                                                                      |
| `src/components/answer-game/GameEngine.flows.mdx`                | Document new TTS data flow (Task 19).                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
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
- **`LifecycleTTSExplorer.stories.tsx`.** M2 — the registry-table viewer is for game-designer review of `byGradeBand` defaults across multiple games. Deferred until M2 expands the event vocabulary.
- **ARIA live region implementation.** M2 — ARIA live regions for round outcomes are decoupled from TTS and ship separately. Known gap surfaced by 2026-05-13 review (P2); see Deferred / Open Questions below. (The new 2026-05-16 spec carries ARIA under §12.2 acceptance criteria but not as a dedicated section.)
- **`round.idle` timer + per-game predicate.** M2 — spec §10.1.
- **Queue policy (cancel-on-new, drop-debounce for repeated errors).** M2 — spec §6.3 + §6.4. Web Speech's default cancel-on-new behavior covers the common case in M1.
- **`game.resume` event emission.** M2 — requires `AnswerGameProvider` remount-detection logic.

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

export type Talkativeness = 'on-demand' | 'helpful' | 'chatty';

export type EventTemplate = {
  /** i18n keys, one per verbosity mode. Spec §9.3 + §9.4. */
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
      resolvePresetVerbosity('helpful', 'pre-k', 'round.start'),
    ).toBe('full');
  });

  it('Quiet at year3-4 turns round.correct off', () => {
    expect(
      resolvePresetVerbosity('on-demand', 'year3-4', 'round.correct'),
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
      resolvePresetVerbosity('helpful', 'k', 'round.idle'),
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
import type { LifecycleEvent, Talkativeness, Verbosity } from './types';
import type { GradeBand } from '@/types/game-events';

type PresetProfile = Partial<
  Record<GradeBand, Partial<Record<LifecycleEvent, Verbosity>>>
>;

/**
 * Quiet / Default / Chatty profiles. Each profile maps (gradeBand, event)
 * pairs to a verbosity. Unmapped pairs return undefined so the caller
 * falls through to `definition.tts[event].byGradeBand` / `.default`.
 *
 * Spec §5.3 (Talkativeness vocabulary) + §9.2 (layer chain).
 */
const PRESETS: Record<Talkativeness, PresetProfile> = {
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
  preset: Talkativeness,
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
        talkativeness: 'on-demand',
      }),
    ).toBe('brief');
  });

  it('falls through preset → registry byGradeBand → default', () => {
    expect(
      resolveVerbosity({
        tts,
        event: 'round.start',
        gradeBand: 'year3-4',
        talkativeness: 'helpful',
      }),
    ).toBe('brief');
  });

  it('returns off when event has no template at all', () => {
    expect(
      resolveVerbosity({
        tts,
        event: 'round.idle',
        gradeBand: 'pre-k',
        talkativeness: 'helpful',
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
  Talkativeness,
  Verbosity,
} from './types';
import type { GradeBand } from '@/types/game-events';

export interface ResolveVerbosityInput {
  tts: GameTTSConfig | undefined;
  event: LifecycleEvent;
  gradeBand: GradeBand;
  talkativeness: Talkativeness;
}

/**
 * Resolution chain (spec §9.2, simplified for M1 — no customConfig.events
 * surface yet, that lands in M2; skin.tts? layer reserved for M3):
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

## Task 4: `game.prepare` Bus Event

**Files:**

- Modify: `src/types/game-events.ts` (add to `GameEventType` union + `GameEvent` discriminated union)
- Test: `src/lib/game-event-bus.test.ts` (append)

`lifecycle.speak` is already declared in `GameEventType` at line 29 (`src/types/game-events.ts`) — no work needed for that event. Only `game.prepare` is new in M1.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/game-event-bus.test.ts`:

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
      roundIndex: 0,
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

- [ ] **Step 3: Add the event to game-events.ts**

In `src/types/game-events.ts`, add `'game.prepare'` to the `GameEventType` union (after `'game.start'`, before `'lifecycle.speak'`):

```ts
export type GameEventType =
  | 'game.start'
  | 'game.prepare'
  // ... existing entries unchanged
  | 'lifecycle.speak';
```

Add the interface (group it with the other game-level events, near `GameStartEvent`):

```ts
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game.prepare';
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
git commit -m "feat(events): add game.prepare bus event"
```

---

## Task 5: Add `talkativeness` to `SettingsDoc` (v4 migration) + `gradeBand` to per-game config

This is the load-bearing settings refactor. Two parallel changes, **kept in one task** because they together replace the legacy `ttsEnabled` field everywhere (164 references across 85 files via `rg --count-matches ttsEnabled src/` on master HEAD `694797af9`):

1. **User-level `SettingsDoc` gains `talkativeness`** (spec §5.1 + §5.5) — RxDB v3→v4 migration. Read via the canonical `useSettings()` hook ([src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts)); written via the existing `update()` helper. Spec §13.1.B #11 lock — talkativeness is a **user setting, not a per-game knob** — one custom game cannot override the parent's chosen verbosity.
2. **Per-game `AnswerGameConfig` gains `gradeBand`** (per-level tuning, not per-user). The legacy `ttsEnabled` field is dropped here too — auto-speech is now derived from `talkativeness !== 'on-demand'` (§5.3); on-demand speech (taps) is **never gated** by `talkativeness` per §5.4 (no hard-mute — OS volume slider is the escape hatch).

**Why no `autoSpeak` or `ttsOnDemandAllowed` fields** (vs the 2026-05-13 plan draft): `autoSpeak` is derived (`talkativeness !== 'on-demand'`) so storing it duplicates state. `ttsOnDemandAllowed` is rejected by §5.4 — there is no setting that disables tap-to-speak. See Spec Delta 2.

**Files:**

- Modify: `src/db/schemas/settings.ts` — full v4 schema per §5.8
- Modify: `src/db/hooks/useSettings.ts` — extend `DEFAULT_SETTINGS`
- Modify: `src/components/answer-game/types.ts` — drop `ttsEnabled`, add `gradeBand: GradeBand`
- Modify: `src/games/spot-all/types.ts` — same shape change on `SpotAllConfig`
- Modify: every consumer of `config.ttsEnabled` (run `rg ttsEnabled src/` for the full list)
- Modify: every test fixture / mock config
- Create: `src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts` (mirror existing `word-spell-multi-level.collection.test.ts`)

### Sub-task 5A: `SettingsDoc` v4 migration (talkativeness + processLocally)

- [ ] **Step 1: Write the failing migration test**

Create `src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts` mirroring the pattern in [src/db/migrations/word-spell-multi-level.collection.test.ts](../../src/db/migrations/word-spell-multi-level.collection.test.ts). Assert:

```ts
// v3 doc with ttsEnabled: false migrates to v4 talkativeness: 'on-demand'
expect(migrated.talkativeness).toBe('on-demand');
expect(migrated.processLocally).toBe(true);
// 'ttsEnabled' must be gone from the v4 doc
expect(
  (migrated as Record<string, unknown>).ttsEnabled,
).toBeUndefined();

// v3 doc with ttsEnabled: true migrates to v4 talkativeness: 'helpful'
expect(migrated2.talkativeness).toBe('helpful');

// Untouched fields preserved
expect(migrated.speechRate).toBe(1.2);
expect(migrated.preferredVoiceURI).toBe('Karen');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts --reporter=verbose`
Expected: FAIL — schema is still v3.

- [ ] **Step 3: Implement v4 schema + migration**

In `src/db/schemas/settings.ts`, replace the v3 schema with the v4 schema from spec §5.8 in full. Because master enforces `additionalProperties: false`, **every field must be declared explicitly**. Preserve `speechRate` (range 0.5..2, default 1), `preferredVoiceURI`, `preferredVoiceDeviceId`, `activeLanguage` (default `'en-AU'` per [project_default_language_en_au](../../../../.claude/projects/-Users-leocaseiro-Sites-base-skill/memory/project_default_language_en_au.md)), all volume fields, `tapForgivenessThreshold/TimeMs`, `showSubtitles`, `themeId`, etc. Drop `ttsEnabled`. Add `talkativeness` (enum `['on-demand', 'helpful', 'chatty']`, default `'helpful'`) and `processLocally` (boolean, default `true`).

Add `settingsMigrations[4]` mapping:

```ts
4: (oldDoc: SettingsDocV3 & Record<string, unknown>): SettingsDoc => {
  const { ttsEnabled, ...rest } = oldDoc;
  return {
    ...rest,
    talkativeness: ttsEnabled === false ? 'on-demand' : 'helpful',
    processLocally: true,
  } as SettingsDoc;
},
```

Bump the schema version: `version: 4` (was `3`).

- [ ] **Step 4: Extend `DEFAULT_SETTINGS` in `useSettings.ts`**

In `src/db/hooks/useSettings.ts`, update `DEFAULT_SETTINGS` so first-paint (before RxDB resolves the live doc) carries v4 defaults:

```ts
const DEFAULT_SETTINGS: Omit<SettingsDoc, 'updatedAt'> = {
  // ... existing
  talkativeness: 'helpful',
  processLocally: true,
};
```

Drop `ttsEnabled: true` from the default block. The `useSettings()` hook's API (`{ settings, update }`) is unchanged — consumers just read `settings.talkativeness` instead of `settings.ttsEnabled`.

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
      gradeBand: 'k',
    };
    expect(cfg.gradeBand).toBe('k');
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
/** Grade band — selects per-event verbosity from `definition.tts[event].byGradeBand`. */
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

| Pattern in caller                                                                      | Replaces `ttsEnabled` with                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `if (!ttsEnabled) return` inside a useEffect that auto-speaks on mount or round change | `useSettings().settings.talkativeness !== 'on-demand'` (auto-speech is gated only by user-level talkativeness)                                                                                                         |
| `if (!ttsEnabled) return null` inside AudioButton / question onClick branches          | **Remove the gate entirely** — taps always speak per §5.4. Button always renders.                                                                                                                                      |
| `disabled={!ttsEnabled}` on a button/input that drives on-demand speech                | **Remove the disabled prop** — taps always speak per §5.4.                                                                                                                                                             |
| Default per-game config construction (e.g. `{ ttsEnabled: true }`)                     | Replace with `{ gradeBand: 'k' }` (drop `ttsEnabled`; auto-speech now comes from user-level talkativeness).                                                                                                            |
| Test fixture / mock config                                                             | Same as default config construction; talkativeness is mocked at the `useSettings()` level, not per-game.                                                                                                               |
| Form value binding (`ConfigFormFields`, `useConfigDraft`)                              | Replace `ttsEnabled` checkbox with `gradeBand` select. Talkativeness slider is added separately in `SettingsPanel`, NOT in per-game form (§8.2, §13.1.B #11).                                                          |
| Legacy migration path (RxDB `customGame.config` load)                                  | Map `{ ttsEnabled: false }` to `{ gradeBand: 'k' }` (drop tts field; user-level migration to `talkativeness: 'on-demand'` is handled by the schema migration in sub-task 5A — config-form values do not duplicate it). |

<!-- markdownlint-enable MD060 -->

Per-file checklist (derived from Step 9):

- `src/components/answer-game/useGameTTS.ts` — `speakTile`'s `if (!config.ttsEnabled) return` becomes `if (settings.talkativeness === 'on-demand') return` (read via `useSettings()` — see Task 6 for the full rewrite).
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
git add src/db/schemas/settings.ts src/db/hooks/useSettings.ts src/db/migrations/lifecycle-tts-settings-v4.collection.test.ts
git commit -m "feat(settings): add talkativeness + processLocally to SettingsDoc; v3→v4 RxDB migration"

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

## Task 6: useGameTTS — speakAuto / speakOnDemand split (driven by user `talkativeness`)

**Files:**

- Modify: `src/components/answer-game/useGameTTS.ts`
- Modify: `src/components/answer-game/useGameTTS.test.tsx`

Auto-speech is gated by the user-level `talkativeness !== 'on-demand'` (spec §6.1 `autoAllowed` guard, read via `useSettings()`). On-demand speech (`speakOnDemand`) has **no `talkativeness` gate** — taps always speak per spec §5.4 (no hard-mute). OS volume slider is the user's escape hatch.

- [ ] **Step 1: Write the failing tests**

Replace the test bodies in `src/components/answer-game/useGameTTS.test.tsx` (keep the existing setup harness — `renderHook`, mock provider) and add the new cases. Talkativeness is mocked at the `useSettings()` level (the hook reads it from user settings, not per-game config):

```ts
import { vi } from 'vitest';

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));
import { useSettings } from '@/db/hooks/useSettings';

const mockSettings = (overrides: {
  talkativeness: 'on-demand' | 'helpful' | 'chatty';
}) => {
  (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
    settings: {
      talkativeness: overrides.talkativeness,
      speechRate: 1,
      voiceVolume: 0.8,
      preferredVoiceURI: undefined,
      activeLanguage: 'en-AU',
      processLocally: true,
    },
    update: vi.fn(),
  });
};

describe('speakAuto', () => {
  it('speaks when talkativeness is helpful', () => {
    mockSettings({ talkativeness: 'helpful' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakAuto('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('speaks when talkativeness is chatty', () => {
    mockSettings({ talkativeness: 'chatty' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakAuto('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('does NOT speak when talkativeness is on-demand', () => {
    mockSettings({ talkativeness: 'on-demand' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakAuto('Hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('speakOnDemand — never gated by talkativeness (spec §5.4 no hard-mute)', () => {
  it('speaks when talkativeness is helpful', () => {
    mockSettings({ talkativeness: 'helpful' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakOnDemand('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('STILL speaks when talkativeness is on-demand (taps always work)', () => {
    mockSettings({ talkativeness: 'on-demand' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakOnDemand('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('STILL speaks when talkativeness is chatty', () => {
    mockSettings({ talkativeness: 'chatty' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakOnDemand('Hello');
    expect(speakSpy).toHaveBeenCalledWith('Hello', expect.any(Object));
  });
});

describe('speakTile (regression)', () => {
  it('flips its gate from ttsEnabled (removed) to user talkativeness', () => {
    mockSettings({ talkativeness: 'helpful' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakTile('A');
    expect(speakSpy).toHaveBeenCalledWith('A', expect.any(Object));
  });

  it('does NOT speak when talkativeness is on-demand', () => {
    mockSettings({ talkativeness: 'on-demand' });
    const { result } = renderHook(() => useGameTTS(), {
      wrapper: makeWrapper(),
    });
    result.current.speakTile('A');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/answer-game/useGameTTS.test.tsx --reporter=verbose`
Expected: FAIL — `speakAuto` / `speakOnDemand` do not exist; `speakTile` still gates on `config.ttsEnabled` (removed in Task 5).

- [ ] **Step 3: Replace useGameTTS implementation**

Replace `src/components/answer-game/useGameTTS.ts` with:

```ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/db/hooks/useSettings';
import { isSpeechActive, speak } from '@/lib/speech/SpeechOutput';

export interface GameTTS {
  speakTile: (label: string) => void;
  speakAuto: (text: string) => void;
  speakOnDemand: (text: string) => void;
}

export const useGameTTS = (): GameTTS => {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  const autoAllowed = settings.talkativeness !== 'on-demand';

  const speechOpts = useCallback(
    () => ({
      rate: settings.speechRate ?? 1,
      volume: settings.voiceVolume ?? 0.8,
      voiceURI: settings.preferredVoiceURI,
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
      if (!autoAllowed) return; // Talkativeness gate (auto-speech).
      if (isSpeechActive()) {
        console.debug(`[TTS] speakTile("${label}") — busy, skipped`);
        return;
      }
      speak(label, speechOpts());
    },
    [autoAllowed, speechOpts],
  );

  const speakAuto = useCallback(
    (text: string) => {
      if (!autoAllowed) return; // Talkativeness gate (auto-speech).
      speak(text, speechOpts());
    },
    [autoAllowed, speechOpts],
  );

  const speakOnDemand = useCallback(
    (text: string) => {
      // NO talkativeness gate — taps always speak per spec §5.4 (no hard-mute).
      // OS volume slider is the user's escape hatch for "completely silent".
      speak(text, speechOpts());
    },
    [speechOpts],
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
git commit -m "feat(answer-game): useGameTTS — speakAuto gated by user talkativeness; speakOnDemand ungated (spec §5.4 no hard-mute)"
```

---

## Task 7: useLifecycleTts hook

This is the centerpiece — subscribes to the unified `lifecycle.speak` bus event, resolves verbosity + copy, interpolates with `AnswerGameContext` snapshot, and calls `speak()`. Also exposes a `speakOnDemand(event)` callable for AudioButton / question onClick.

**Gating model:**

- **Auto-speech (bus subscriber):** gated by **user-level** `useSettings().settings.talkativeness !== 'on-demand'` (spec §6.1 `autoAllowed` guard). The hook also sends `SETTINGS_CHANGED` to the XState actor per spec §5.5 when settings change, so the machine re-evaluates verbosity on the fly.
- **On-demand (`speakOnDemand`):** **never gated by `talkativeness`** — taps always speak per §5.4 (no hard-mute). The only gates are voice availability (integrate with [`VoiceUnavailableDialogProvider`](../../src/providers/VoiceUnavailableDialogProvider.tsx) from PR [#409](https://github.com/leocaseiro/base-skill/pull/409), see spec §7.2's forward-looking note) and active settings via `useSettings()`. OS volume slider is the user's escape hatch.

**Files:**

- Create: `src/lib/lifecycle-tts/useLifecycleTts.tsx`
- Create: `src/lib/lifecycle-tts/useLifecycleTts.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/lifecycle-tts/useLifecycleTts.test.tsx`. The test matrix is the three Talkativeness values × {auto-speech via bus, tap via speakOnDemand}:

```tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLifecycleTts } from './useLifecycleTts';
import type { GameTTSConfig, Talkativeness } from './types';
import type { ReactNode } from 'react';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
}));
import { speak as speakMock } from '@/lib/speech/SpeechOutput';

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));
import { useSettings } from '@/db/hooks/useSettings';

const mockTalkativeness = (talkativeness: Talkativeness) => {
  (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
    settings: {
      talkativeness,
      speechRate: 1,
      voiceVolume: 0.8,
      preferredVoiceURI: undefined,
      activeLanguage: 'en-AU',
      processLocally: true,
    },
    update: vi.fn(),
  });
};

// Minimal test-only AnswerGameContext provider — supplies gameId, per-game
// `gradeBand`, currentRound for interpolation, and the game's tts block.
const makeWrapper = (contextValue: {
  gradeBand: 'k';
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

const wrapper = makeWrapper({
  gradeBand: 'k',
  gameId: 'word-spell',
  tts,
});

describe('useLifecycleTts — auto-speech subscriber (gated by user talkativeness)', () => {
  it('speaks when talkativeness is helpful', () => {
    mockTalkativeness('helpful');
    renderHook(() => useLifecycleTts(), { wrapper });
    emitLifecycleSpeak('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock).toHaveBeenCalledWith(
      expect.stringContaining('Spell the word'),
      expect.any(Object),
    );
  });

  it('speaks when talkativeness is chatty (more verbose template)', () => {
    mockTalkativeness('chatty');
    renderHook(() => useLifecycleTts(), { wrapper });
    emitLifecycleSpeak('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT speak when talkativeness is on-demand (spec §6.1 autoAllowed guard)', () => {
    mockTalkativeness('on-demand');
    renderHook(() => useLifecycleTts(), { wrapper });
    emitLifecycleSpeak('round.start');
    expect(speakMock).not.toHaveBeenCalled();
  });
});

describe('useLifecycleTts — speakOnDemand (NEVER gated by talkativeness, spec §5.4)', () => {
  it('speaks when talkativeness is helpful', () => {
    mockTalkativeness('helpful');
    const { result } = renderHook(() => useLifecycleTts(), { wrapper });
    result.current.speakOnDemand('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  it('STILL speaks when talkativeness is on-demand — taps always work (no hard-mute)', () => {
    mockTalkativeness('on-demand');
    const { result } = renderHook(() => useLifecycleTts(), { wrapper });
    result.current.speakOnDemand('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  it('STILL speaks when talkativeness is chatty', () => {
    mockTalkativeness('chatty');
    const { result } = renderHook(() => useLifecycleTts(), { wrapper });
    result.current.speakOnDemand('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);
  });
});

describe('useLifecycleTts — settings reactivity', () => {
  it('re-reads talkativeness when user changes the slider mid-session', () => {
    mockTalkativeness('helpful');
    const { rerender } = renderHook(() => useLifecycleTts(), {
      wrapper,
    });
    emitLifecycleSpeak('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1);

    mockTalkativeness('on-demand');
    rerender();
    emitLifecycleSpeak('round.start');
    expect(speakMock).toHaveBeenCalledTimes(1); // not 2 — silenced after switch
  });
});
```

If the project doesn't already expose a test-only `AnswerGameContext` provider, create a thin one inline in the test file (or in a shared `lifecycle-tts/test-utils.tsx`) that supplies the context values the hook reads. `emitLifecycleSpeak` is a helper that calls `getGameEventBus().emit({ type: 'lifecycle.speak', lifecycleEvent, ...envelope })`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTts.test.tsx --reporter=verbose`
Expected: FAIL — `useLifecycleTts` not exported.

- [ ] **Step 3: Implement the hook**

Create `src/lib/lifecycle-tts/useLifecycleTts.tsx`:

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
  // Spec §9.6 + §9.7. Per-game required vars:
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

export const useLifecycleTts = (): LifecycleTTS => {
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
      const currentSettings = settingsRef.current;
      const ttsConfig = current.gameDefinition?.tts ?? undefined;

      const verbosity =
        modeOverride ??
        resolveVerbosity({
          tts: ttsConfig,
          event,
          gradeBand: current.config.gradeBand,
          talkativeness: currentSettings.talkativeness ?? 'helpful',
        });

      const key = resolveCopy({
        tts: ttsConfig,
        event,
        verbosity,
      });
      if (!key) return;

      const interpolated = t(key, buildInterpolationContext(current));
      const opts = {
        rate: currentSettings.speechRate ?? 1,
        volume: currentSettings.voiceVolume ?? 0.8,
        voiceURI: currentSettings.preferredVoiceURI,
        lang: i18n.language,
      };
      speak(interpolated, opts);
    },
    [t, i18n.language],
  );

  // Subscribe once; the handler reads fresh state from refs.
  // Auto-speech is gated by user-level talkativeness (spec §6.1 autoAllowed).
  useEffect(() => {
    const bus = getGameEventBus();
    const unsub = bus.subscribe('lifecycle.speak', (e) => {
      const autoAllowed =
        (settingsRef.current.talkativeness ?? 'helpful') !==
        'on-demand';
      if (!autoAllowed) return;
      const { lifecycleEvent } = e as LifecycleSpeakEvent;
      speakResolved(lifecycleEvent);
    });
    return unsub;
  }, [speakResolved]);

  // On-demand: NEVER gated by talkativeness (spec §5.4 no hard-mute).
  // Future integration with VoiceUnavailableDialogProvider (PR #409 / spec §7.2)
  // is the only on-demand gate — when no voice is available, surface the dialog
  // instead of silently no-op'ing.
  const speakOnDemand = useCallback(
    (event: LifecycleEvent) => {
      // Always 'full' for on-demand — spec §9.3 ("speaker tap default is helpful
      // variant but full mode" — the resolver picks helpful template at full verbosity).
      speakResolved(event, 'full');
    },
    [speakResolved],
  );

  return { speakOnDemand };
};
```

**Note on `gameDefinition` on context.** `useLifecycleTts` needs the active game's `definition.tts` block. Three options for sourcing it:

1. **(Preferred)** Extend `useAnswerGameContext` to expose the resolved `GameDefinition` for the active game. The XState engine already needs the definition (passed to `useGameEngine`), so threading it through the context is a small change.
2. Look up via a `gameRegistry` (a `Record<gameId, GameDefinition>` exported from `src/games/index.ts`). Simpler but couples the hook to a global registry.
3. Pass the `tts` block in via the route component (e.g. `<UseLifecycleTTSProvider tts={numberMatchDefinition.tts} />`). Most explicit but adds boilerplate.

Pick option 1 during implementation (smallest code change, fewest moving parts). If `useAnswerGameContext` doesn't already accept a `gameDefinition` prop on its provider, this task includes that wiring change in `AnswerGameProvider.tsx`.

**Settings reactivity** (spec §5.5): when the user moves the Talkativeness slider, RxDB pushes the new settings doc through `useSettings()`; React re-renders the Provider; the refs in this hook update to the new value before the next bus event. No subscription churn — the bus subscription is stable across settings changes. This matches the spec's "actor receives `SETTINGS_CHANGED`" pattern (we forward fresh settings via refs rather than dispatching to a separate actor in M1; the XState actor in spec §6.1 lands in a follow-up PR that promotes this hook into a full Provider).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTts.test.tsx --reporter=verbose`
Expected: PASS — all seven cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-tts/useLifecycleTts.tsx src/lib/lifecycle-tts/useLifecycleTts.test.tsx src/components/answer-game/useAnswerGameContext.ts src/components/answer-game/AnswerGameProvider.tsx
git commit -m "feat(lifecycle-tts): useLifecycleTts gated by user talkativeness; speakOnDemand always speaks (spec §5.4)"
```

---

## Task 8: Mount useLifecycleTts in the active route

`useLifecycleTts` is a singleton subscriber per active game — it must be mounted exactly once per session. The natural mount point is the game route or `AnswerGameProvider`.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx` OR `src/components/answer-game/AnswerGameProvider.tsx` (pick whichever already wraps the game UI)

- [ ] **Step 1: Write the failing test**

Add to the chosen file's existing test (e.g. `AnswerGameProvider.test.tsx`):

```ts
it('emits lifecycle.speak → speak() called once when user talkativeness !== on-demand', async () => {
  // Render with mocked useSettings → talkativeness: 'helpful'; emit lifecycle.speak; assert speak was called.
  // Update mock → talkativeness: 'on-demand'; rerender; emit; assert speak was NOT called.
});
```

Expected: FAIL — there's no subscriber mounted yet.

- [ ] **Step 2: Mount the hook**

In `AnswerGameProvider.tsx`, add a child component that mounts the hook:

```tsx
const LifecycleTTSBridge = (): null => {
  useLifecycleTts();
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
git commit -m "feat(answer-game): mount useLifecycleTts subscriber in AnswerGameProvider"
```

---

## Task 8.5: Emit `lifecycle.tts.played` after each successful speak (SRS recorder producer — G-4)

Per spec §6.7 + §13.1.C #16 lock, every successful `speak()` resolution emits a `lifecycle.tts.played` bus event. The **SRS recorder** ([#364](https://github.com/leocaseiro/base-skill/issues/364), separate plan) subscribes to this event as its M1 attempt-context signal. This plan is the **producer** — the recorder is built in #364.

**Files:**

- Modify: `src/lib/lifecycle-tts/useLifecycleTts.tsx` (extend the hook from Task 7)
- Modify: `src/lib/lifecycle-tts/useLifecycleTts.test.tsx`
- Modify: `src/types/game-events.ts` (add `LifecycleTtsPlayedEvent` interface per spec §4.3)

- [ ] **Step 1: Write the failing test**

Append to `useLifecycleTts.test.tsx`:

```tsx
describe('useLifecycleTts — emits lifecycle.tts.played for SRS', () => {
  it('emits lifecycle.tts.played after successful auto-speech', async () => {
    mockTalkativeness('helpful');
    renderHook(() => useLifecycleTts(), { wrapper });

    const playedEvents: LifecycleTtsPlayedEvent[] = [];
    const unsub = getGameEventBus().subscribe(
      'lifecycle.tts.played',
      (e) => playedEvents.push(e as LifecycleTtsPlayedEvent),
    );

    emitLifecycleSpeak('round.start');
    await waitFor(() => expect(speakMock).toHaveBeenCalled());

    // Simulate speak() resolving (mock returns undefined immediately for M1).
    expect(playedEvents).toHaveLength(1);
    expect(playedEvents[0]).toMatchObject({
      type: 'lifecycle.tts.played',
      lifecycleEvent: 'round.start',
      source: 'auto',
      variant: 'helpful',
    });
    expect(playedEvents[0].durationMs).toBeGreaterThanOrEqual(0);

    unsub();
  });

  it('emits lifecycle.tts.played after on-demand tap', async () => {
    mockTalkativeness('on-demand');
    const { result } = renderHook(() => useLifecycleTts(), { wrapper });

    const playedEvents: LifecycleTtsPlayedEvent[] = [];
    const unsub = getGameEventBus().subscribe(
      'lifecycle.tts.played',
      (e) => playedEvents.push(e as LifecycleTtsPlayedEvent),
    );

    result.current.speakOnDemand('round.start');
    await waitFor(() => expect(speakMock).toHaveBeenCalled());

    expect(playedEvents).toHaveLength(1);
    expect(playedEvents[0].source).toBe('user');
    unsub();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTts.test.tsx --reporter=verbose`
Expected: FAIL — no `lifecycle.tts.played` emission wired.

- [ ] **Step 3: Add the `LifecycleTtsPlayedEvent` interface**

In `src/types/game-events.ts`, add per spec §4.3:

```ts
export interface LifecycleTtsPlayedEvent extends BaseGameEvent {
  type: 'lifecycle.tts.played';
  lifecycleEvent: LifecycleEvent;
  subject?: string | number;
  source: 'auto' | 'user';
  variant: Talkativeness;
  durationMs: number;
}
```

Add `'lifecycle.tts.played'` to the `GameEventType` union.

- [ ] **Step 4: Wire the emission in `useLifecycleTts`**

In `speakResolved`, capture the start time, call `speak()`, then emit on success. M1 uses a fire-and-forget pattern (the speak callable in `src/lib/speech/SpeechOutput.ts` returns synchronously today — the spec §6 XState actor will use a `Promise<void>` per `Speaker.speak` and emit on `onDone`). For M1, emit right after `speak()` returns:

```ts
const speakResolved = useCallback(
  (
    event: LifecycleEvent,
    modeOverride?: 'full',
    source: 'auto' | 'user' = 'auto',
  ) => {
    const current = ctxRef.current;
    const currentSettings = settingsRef.current;
    // ... resolve verbosity + interpolation (unchanged) ...

    const enqueuedAt = Date.now();
    speak(interpolated, opts);

    // Emit lifecycle.tts.played for SRS recorder (G-4) per spec §6.7.
    getGameEventBus().emit({
      type: 'lifecycle.tts.played',
      lifecycleEvent: event,
      source,
      variant: currentSettings.talkativeness ?? 'helpful',
      durationMs: Date.now() - enqueuedAt,
      gameId: current.config.gameId,
      sessionId: current.sessionId ?? 'unknown',
      profileId: current.profileId ?? 'default',
      roundIndex: current.roundIndex ?? 0,
      timestamp: Date.now(),
    });
  },
  [t, i18n.language],
);
```

Update the bus subscriber and `speakOnDemand` callers to pass `'auto'` / `'user'`:

```ts
// Auto-speech (bus subscriber):
speakResolved(lifecycleEvent, undefined, 'auto');

// On-demand:
speakResolved(event, 'full', 'user');
```

**Note on `durationMs`:** the M1 hook emits immediately after calling `speak()` (which returns synchronously today), so `durationMs` is effectively 0 in M1. The full duration tracking lands when the XState actor in the follow-up PR moves to a `Promise<void>` Speaker.speak() and emits on `onDone`. SRS recorder #364 must handle `durationMs: 0` as "duration unknown" until the actor PR lands.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/lifecycle-tts/useLifecycleTts.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/lifecycle-tts/useLifecycleTts.tsx src/lib/lifecycle-tts/useLifecycleTts.test.tsx src/types/game-events.ts
git commit -m "feat(lifecycle-tts): emit lifecycle.tts.played after speak() — SRS recorder producer (spec §6.7)"
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

By the end of this task, all three XState-migrated games drive round-start speech via the machine. `useRoundTTS` has no remaining callers and is deleted.

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

## Task 13: AudioButton refactor — lifecycle event prop (always renders)

**REQUIRED SKILL:** `write-storybook` (Storybook update).

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.test.tsx`
- Modify: `src/components/questions/AudioButton/AudioButton.stories.tsx`

Spec §5.4 ("no hard-mute"): the button **always renders** when the game UI is visible. There is no setting that hides it — `talkativeness` only gates auto-speech, not taps. The legacy `ttsEnabled: false → hidden` behavior is gone.

- [ ] **Step 1: Write the failing test**

Update `src/components/questions/AudioButton/AudioButton.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';

const speakOnDemand = vi.fn();
vi.mock('@/lib/lifecycle-tts/useLifecycleTts', () => ({
  useLifecycleTts: () => ({ speakOnDemand }),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));
import { useSettings } from '@/db/hooks/useSettings';

const withTalkativeness = (
  talkativeness: 'on-demand' | 'helpful' | 'chatty',
) => {
  (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
    settings: { talkativeness },
    update: vi.fn(),
  });
};

describe('AudioButton', () => {
  beforeEach(() => speakOnDemand.mockClear());

  it('renders when talkativeness is helpful', () => {
    withTalkativeness('helpful');
    render(<AudioButton event="round.start" />);
    expect(
      screen.getByRole('button', { name: /hear/i }),
    ).toBeInTheDocument();
  });

  it('STILL renders when talkativeness is on-demand — spec §5.4 (no hard-mute)', () => {
    withTalkativeness('on-demand');
    render(<AudioButton event="round.start" />);
    expect(
      screen.getByRole('button', { name: /hear/i }),
    ).toBeInTheDocument();
  });

  it('STILL renders when talkativeness is chatty', () => {
    withTalkativeness('chatty');
    render(<AudioButton event="round.start" />);
    expect(
      screen.getByRole('button', { name: /hear/i }),
    ).toBeInTheDocument();
  });

  it('calls speakOnDemand with the lifecycle event when clicked (any talkativeness)', () => {
    withTalkativeness('on-demand');
    render(<AudioButton event="round.start" />);
    fireEvent.click(screen.getByRole('button'));
    expect(speakOnDemand).toHaveBeenCalledWith('round.start');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/questions/AudioButton/AudioButton.test.tsx --reporter=verbose`
Expected: FAIL — current AudioButton takes `prompt: string`, not `event: LifecycleEvent`, and has a `ttsEnabled` gate.

- [ ] **Step 3: Refactor AudioButton**

Replace `src/components/questions/AudioButton/AudioButton.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { useLifecycleTts } from '@/lib/lifecycle-tts/useLifecycleTts';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';
import type { JSX } from 'react';

export interface AudioButtonProps {
  event: LifecycleEvent;
}

// AudioButton always renders. Spec §5.4: no hard-mute — taps always speak,
// regardless of the user's Talkativeness setting. OS volume slider is the
// escape hatch for "completely silent".
//
// A future P1 visual-state addition (speaking indicator via isSpeechActive())
// is tracked in the Deferred section.
export const AudioButton = ({
  event,
}: AudioButtonProps): JSX.Element => {
  const { speakOnDemand } = useLifecycleTts();
  const { t } = useTranslation();

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

Each of the four question components today reads `config.ttsEnabled` for its onClick speech. Per spec §5.4 (no hard-mute), **the gate is removed entirely** — clicks always invoke `speakOnDemand`. The hook handles voice availability via `VoiceUnavailableDialogProvider` (PR #409); there is no in-component gate.

Routes the speech call through `useLifecycleTts.speakOnDemand` for SRS observability parity (the `lifecycle.tts.played` emission for the SRS recorder lands via the bus path in Task 7's hook — see spec §6.7).

- [ ] **Step 1: Write the failing test (per question component)**

For `TextQuestion`, add or update:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextQuestion } from './TextQuestion';

const speakOnDemand = vi.fn();
vi.mock('@/lib/lifecycle-tts/useLifecycleTts', () => ({
  useLifecycleTts: () => ({ speakOnDemand }),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));
import { useSettings } from '@/db/hooks/useSettings';

const withTalkativeness = (
  talkativeness: 'on-demand' | 'helpful' | 'chatty',
) => {
  (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
    settings: { talkativeness },
    update: vi.fn(),
  });
};

describe('TextQuestion onClick speech — taps always speak (spec §5.4)', () => {
  beforeEach(() => speakOnDemand.mockClear());

  it('speaks when talkativeness is helpful', () => {
    withTalkativeness('helpful');
    render(<TextQuestion text="cat" />);
    fireEvent.click(screen.getByText('cat'));
    expect(speakOnDemand).toHaveBeenCalledTimes(1);
  });

  it('STILL speaks when talkativeness is on-demand (no hard-mute)', () => {
    withTalkativeness('on-demand');
    render(<TextQuestion text="cat" />);
    fireEvent.click(screen.getByText('cat'));
    expect(speakOnDemand).toHaveBeenCalledTimes(1);
  });

  it('STILL speaks when talkativeness is chatty', () => {
    withTalkativeness('chatty');
    render(<TextQuestion text="cat" />);
    fireEvent.click(screen.getByText('cat'));
    expect(speakOnDemand).toHaveBeenCalledTimes(1);
  });
});
```

Repeat for `ImageQuestion`, `EmojiQuestion`, `DotGroupQuestion` with their respective click targets.

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — components still gate by `ttsEnabled` (or no longer call speakOnDemand at all).

- [ ] **Step 3: Update each component**

In each of the four files, locate the onClick handler that calls `speak()` or `useGameTTS().speakPrompt()`, and replace with:

```tsx
const { speakOnDemand } = useLifecycleTts();

const handleClick = () => {
  // No gate — taps always speak per spec §5.4 (no hard-mute).
  speakOnDemand('round.start');
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

## Task 16: Rename InstructionsOverlay → GameOptionsOverlay; remove auto-speak; emit game.prepare

**REQUIRED SKILL:** `write-storybook` (the moved file gets a new title: `'AnswerGame/GameOptions/GameOptionsOverlay'`).

**Files:**

- Move: `src/components/answer-game/InstructionsOverlay/` → `src/components/answer-game/GameOptions/`
- Rename inside the directory: `InstructionsOverlay.tsx` → `GameOptionsOverlay.tsx` (plus `.test.tsx`, `.stories.tsx`)
- Move (unchanged): `useConfigDraft.ts` and `useConfigDraft.test.tsx`
- Modify (behavior): `GameOptionsOverlay.tsx` — remove the `useEffect(() => { if (ttsEnabled) speak(text); ... }, [])` block at line 173–174; replace with bus emit of `game.prepare`
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

  it('emits game.prepare on mount', () => {
    const received: string[] = [];
    const unsub = getGameEventBus().subscribe('game.prepare', (e) =>
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

Expected: FAIL — auto-speak useEffect still fires; no `game.prepare` emit.

- [ ] **Step 4: Update GameOptionsOverlay**

In `GameOptionsOverlay.tsx`:

- Rename the exported component: `InstructionsOverlay` → `GameOptionsOverlay`.
- Delete the `useEffect` block at lines 173–174 that calls `speak(text)`.
- Add a new `useEffect(() => { ... }, [])` that emits `game.prepare`:

```tsx
useEffect(() => {
  getGameEventBus().emit({
    type: 'game.prepare',
    gameId,
    sessionId,
    profileId,
    timestamp: Date.now(),
    roundIndex: 0,
  });
}, [gameId, sessionId, profileId]);
```

- Drop the `ttsEnabled` prop (replaced by `game.prepare` flowing through `useLifecycleTts`).
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
    {t('settings.talkativeness.label')}
  </Label>
  <Slider
    id="talkativeness-slider"
    min={0}
    max={2}
    step={1}
    value={[idx]}
    onValueChange={([i]) => update({ talkativeness: SLIDER_VALUES[i] })}
  />
  <div className="slider-labels">
    <span>🤫 {t('settings.talkativeness.onDemand')}</span>
    <span>💬 {t('settings.talkativeness.helpful')}</span>
    <span>🗣️ {t('settings.talkativeness.chatty')}</span>
  </div>
  <Tooltip>
    {t('settings.talkativeness.tooltip', {
      defaultValue:
        'The speaker button always works. This setting only controls how much the game talks on its own.',
    })}
  </Tooltip>
</div>;
```

The Storybook control uses `argTypes` radio (per project convention — slider is the user-facing UI, radio is the dev surface). i18n keys land in Task 18.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/SettingsPanel/SettingsPanel.test.tsx --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel/
git commit -m "feat(settings-panel): replace ttsEnabled toggle with Talkativeness slider (spec §8.2)"
```

### Sub-task 17B: AdvancedConfigModal — add `gradeBand` select (per-game)

`gradeBand` is per-level / per-game tuning (it selects the verbosity row from `definition.tts[event].byGradeBand`) — appropriate for the per-game modal.

- [ ] **Step 6: Write the failing test**

Add to `AdvancedConfigModal.test.tsx`:

```tsx
it('renders a gradeBand select with pre-k / k / year1-2 / year3-4 / year5-6', () => {
  render(<AdvancedConfigModal {...defaultProps} />);
  const select = screen.getByLabelText(/grade band/i);
  expect(select).toBeInTheDocument();
  // Default selection per spec §5.3 (helpful at k).
  expect(select).toHaveValue('k');
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
    value={value.config.gradeBand ?? 'k'}
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

Also add the Talkativeness slider labels (used by SettingsPanel — Task 17A) and the per-game gradeBand labels (used by AdvancedConfigModal — Task 17B):

```jsonc
{
  "settings": {
    // ... existing keys
    "talkativeness": {
      "label": "How much should the game talk?",
      "onDemand": "Shhh",
      "helpful": "Talk a bit",
      "chatty": "Talk a lot",
      "tooltip": "The speaker button always works. This setting only controls how much the game talks on its own.",
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

- [ ] **Step 3: Run lint + typecheck**

```bash
yarn fix:md      # if any docs touched
yarn typecheck
```

Expected: PASS.

- [ ] **Step 4: Run the game in dev to verify keys resolve**

`yarn dev`, open each game with the user-level Talkativeness set to `helpful` or `chatty` in SettingsPanel, confirm speech matches the registered templates.

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

- New TTS data flow (machine → `speak` action → bus → `useLifecycleTts`)
- `GameDefinition.tts` field — how to add TTS to a new game
- `useLifecycleTts` hook — auto vs on-demand surfaces; auto-speech gate is user-level `talkativeness` (read via `useSettings()`), on-demand surfaces are ungated per §5.4
- User-level `talkativeness` on `SettingsDoc` (RxDB v3→v4) vs per-game `gradeBand` on `AnswerGameConfig`
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
- [ ] **Type consistency.** `LifecycleEvent`, `GameTTSConfig`, `Verbosity`, `Talkativeness` are defined in Task 1 and used identically throughout. `EventTemplate` shape matches `definition-types.ts:7`.
- [ ] **NumberMatch "speak the answer" bug.** Task 9 includes both the registry entry (`tts.number-match.round-start.full`) and the machine `entry: [speak]` wiring. The dev-server smoke test in Task 9 Step 6 is the user-visible acceptance gate.
- [ ] **No `useRoundTTS` survivors.** `rg useRoundTTS src/` after Task 11 returns nothing.
- [ ] **No `ttsEnabled` survivors.** `rg ttsEnabled src/` after Task 5 returns nothing (or only in migration code paths that map legacy values).
- [ ] **CLAUDE.md compliance.** `yarn fix:md` clean; Storybook titles PascalCase; full worktree paths in commit messages and PR body.
- [ ] **VR baselines.** Any layout-affecting tasks (12, 15, 16) include a `yarn test:vr:update` step with diff review.

---

## Acceptance Criteria (M1, this plan)

- [ ] `src/lib/lifecycle-tts/types.ts` exists and satisfies the forward reference at `src/lib/game-engine/definition-types.ts:8`.
- [ ] `InstructionsOverlay` → `GameOptionsOverlay` rename complete; **does not auto-speak** how-to-play on mount.
- [ ] `game.prepare` bus event added; emitted by `GameOptionsOverlay` on mount.
- [ ] `game.start` lifecycle event speaks the registered full-mode copy after "Let's go" (via the XState machine's entry action on the `playing` state — implemented per-game in Tasks 9–11).
- [ ] NumberMatch's "speak the answer" bug fixed — bare-numeral readout replaced by `tts.number-match.round-start.full` ("Find the matching number for {{count}}.").
- [ ] `ttsEnabled` removed from both `AnswerGameConfig` (per-game) and `SettingsDoc` (user). User-level `talkativeness: 'on-demand' | 'helpful' | 'chatty'` added to `SettingsDoc` via RxDB v3→v4 migration (default `'helpful'`; legacy `ttsEnabled: false` maps to `'on-demand'`). Per-game `gradeBand: GradeBand` added to `AnswerGameConfig` (default `'k'`).
- [ ] `AudioButton` **always renders** (spec §5.4 no hard-mute); always speaks the resolved `full` copy for its `event` prop when tapped.
- [ ] The three question components used by the XState-migrated games (TextQuestion, ImageQuestion, EmojiQuestion) route onClick speech through `useLifecycleTts.speakOnDemand` with **no gate** (taps always speak per §5.4). (DotGroupQuestion is a SpotAll surface and migrates with the SpotAll follow-up — see Spec Delta 1.)
- [ ] `<QuestionRow>` renders inline (icon left, content right) on all breakpoints; AudioButton ≥ 44×44 px; content wraps to extra lines.
- [ ] WordSpell, NumberMatch, SortNumbers each have an inline AudioButton via `<QuestionRow>`.
- [ ] **SpotAll deferred per Spec Delta 1** — tracked in a follow-up issue gated on PR 1d (#368).
- [ ] User-level **Talkativeness slider** (🤫 Shhh / 💬 Talk a bit / 🗣️ Talk a lot) lands in `SettingsPanel` (spec §8.2); per-game `gradeBand` select lands in `AdvancedConfigModal`. Legacy `ttsEnabled` toggle in SettingsPanel removed.
- [ ] **G-4 SRS producer**: `lifecycle.tts.played` event emitted after each successful `speak()` (spec §6.7) with the correct payload shape (`source: 'auto' | 'user'`, `variant: Talkativeness`, `durationMs`, full envelope). SRS recorder ([#364](https://github.com/leocaseiro/base-skill/issues/364)) consumes it in a separate PR.
- [ ] **G-3 mini-game reservations**: `mini-game.start | mini-game.complete | mini-game.skip` baked into the `LifecycleEvent` union + bus event type (Phase 0 Commit 4); no firing code in M1.
- [ ] **G-2 skin resolver layer**: `skin.tts?` layer is Layer 2 of the four-layer resolver chain (Task 3 resolver — always `undefined` in M1, present in type + walked by resolver so M3 work is purely additive).
- [ ] WordSpell, NumberMatch, SortNumbers each have a `tts:` block on their `GameDefinition`.
- [ ] i18n keys for `tts.word-spell.*`, `tts.number-match.*`, `tts.sort-numbers.*`, `settings.talkativeness.*`, and `config.gradeBand.*` exist in `en` and `pt-BR` (pt-BR may be English placeholders).
- [ ] `useRoundTTS` removed; all round-start auto-speech goes through the XState machine `entry` actions.
- [ ] Architecture docs (`GameEngine.flows.mdx`, `GameEngine.reference.mdx`) updated to document the new TTS data flow.

## Out of scope for M1 (deferred — tracked separately)

- SpotAll AudioButton + `speakPrompt` consolidation → follow-up tied to PR 1d (#368).
- Per-event `customConfig.events` override surface → M2.
- `LifecycleTTSExplorer.stories.tsx` registry-table viewer → M2.
- ARIA live regions for round outcomes → M2.
- `round.idle` timer + per-game predicate → M2.
- Queue policy (cancel-on-new, drop-debounce) beyond Web Speech default → M2.
- `game.resume` event emission → M2.
- `round:tts-played` SRS event emission from speakOnDemand path → M2 (SRS recorder hook).

---

**Status:** Plan ready for execution. Pick `superpowers:subagent-driven-development` (recommended — fresh subagent per task) or `superpowers:executing-plans` (inline batch). **Read the Deferred / Open Questions section below before starting — three P0 architectural calls await resolution at execution time.**

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

#### P0 — implementation blockers (must resolve before or during execution)

- **P0 — `useLifecycleTts` reads `gameDefinition` + `currentRound` from a context that doesn't expose them** (coherence + scope-guardian + feasibility + adversarial — 4-way). Task 7's hook reads `current.gameDefinition?.tts` and `current.currentRound`. `AnswerGameState` (`src/components/answer-game/types.ts:81-99`) has neither. The plan's "Pick option 1" note is prose, not a concrete sub-step; option 2's premise is false (`src/games/registry.ts` only has metadata). **Resolution at execution:** pick one of (a) mount `useLifecycleTts` inside each game component where `gameDefinition` and `round` are in scope (recommended — avoids context surgery + sidesteps PR 1c divergence), (b) thread `gameDefinition` through `AnswerGameProvider` and update ~12 call sites. Commit the choice as a Spec Delta in the implementation PR.
- **P0 — `{{count}}` / `{{word}}` / `{{direction}}` interpolation reads `currentRound` but no machine populates `lastRoundOutput`** (adversarial). The headline NumberMatch "speak the answer" fix would render `"Find the matching number for 0"` instead of `"...for five"` — same shape as the bug it's meant to fix. Verified: `numberMatchMachine.context` (definition.ts:543-560) has no `lastRoundOutput`; round data lives in `NumberMatch.tsx:127` (`roundOrder[engineRoundIndex]`). **Resolution at execution:** if P0 above picks "mount in game component", interpolation reads `round` from the same closure that already computes it — no extra change. If P0 picks "thread through context", each of the three machines must add `assign({ lastRoundOutput: <derived> })` on `INIT_ROUND` / `ADVANCE_ROUND`.
- **P0 — Task 1 is misframed as "create types.ts"; file already exists on origin/master** (scope-guardian + adversarial — 2-way). `src/lib/lifecycle-tts/types.ts` was committed at `a653cf284` as a forward-reference pin. Contains `LifecycleEvent`, `Verbosity`, `Talkativeness`, `EventTemplate` — **missing `GameTTSConfig`** that Tasks 3 and 7 import. **Resolution at execution:** restructure Task 1 as "verify-and-extend": read existing file, add single missing export `export type GameTTSConfig = Partial<Record<LifecycleEvent, EventTemplate>>`, typecheck, commit `feat(lifecycle-tts): add GameTTSConfig type for per-game registry blocks`.
- **P0 — `game.start` and `game.prepare` speech paths are unwired** (post-review spec-coverage check, 2026-05-13). Spec §14 M1 acceptance criteria #2 (`game.prepare` speaks `{{gameName}}` brief on overlay mount) and #3 (`game.start` speaks the full how-to-play after "Let's go") are both unimplementable as written. The plan adds the `game.prepare` bus event (Task 4) and emits it from `GameOptionsOverlay` (Task 16 Step 4), and i18n has `tts.<game>.game-start.full` keys (Task 18), but Task 7's `useLifecycleTts` only subscribes to the single `lifecycle.speak` bus event — nothing translates `game.prepare` or `game.start` bus emissions into `lifecycle.speak` payloads, and no task emits `lifecycle.speak { lifecycleEvent: 'game.start' }` at any flow point (the XState machines' `playing`-state entry fires `round.start`, not `game.start`). User flow goes overlay → silence → `round.start` speech, skipping both the brief game-name cue and the full "Let's spell some words" how-to-play. The plan's own acceptance criterion that says "game.start speaks the full how-to-play copy after 'Let's go' (via the XState machine's entry action on the playing state — implemented per-game in Tasks 9–11)" is **factually wrong** — playing-state entry is `round.start`. **Resolution at execution:** pick one of (a) extend `useLifecycleTts` to also subscribe to `game.prepare`, `game.start`, `game.end` bus events and translate each into a `speakResolved(<matching lifecycleEvent>)` call inline (smallest code change, single hook stays the integration surface); (b) have each non-machine emitter (`GameOptionsOverlay` for game.prepare, `AnswerGameProvider` for game.start) emit BOTH the original bus event AND a `lifecycle.speak` event with the matching payload (duplicates emission logic but keeps the hook simple); (c) add a dedicated bridge component (e.g. `LifecycleSpeakBridge`) mounted alongside `LifecycleTTSBridge` that listens for non-machine bus events and re-emits as `lifecycle.speak` (separation of concerns but adds a moving part). Whichever path is chosen, add an explicit task ("Wire game.start + game.prepare speech paths"), correct the misleading acceptance-criterion claim about the playing-state entry, and add a TDD test that asserts the brief speaks on overlay mount and the full how-to-play speaks after "Let's go".

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

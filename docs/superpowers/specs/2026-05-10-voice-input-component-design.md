# Voice Input Component — Design

**Date:** 2026-05-10
**Status:** Reviewed — incorporates ce-doc-review (2026-05-10) decisions; ready for implementation plan

**Related work:**

- `src/lib/speech/SpeechInput.ts` — existing thin wrapper around `SpeechRecognition` / `webkitSpeechRecognition`. **Extended in this PR** to expose `abort`, `onspeechend`, `onstart`, `onaudiostart`, `onnomatch`, and `maxAlternatives`, plus a typed `SpeechRecognitionErrorEvent`. The new hook imports the constructor + extended types from it; the wrapper remains the only place that types `window.SpeechRecognition`.
- `src/lib/speech/SpeechInput.demo.tsx` and `SpeechInput.mdx` — original Storybook demo. Replaced by the new component and removed in the implementation PR.
- `src/components/answer-game/useGameTTS.ts` — pattern reference for the hook shape and `i18n.language` integration. The new shared `getRecognitionLang()` helper (see Public API) lifts the BCP-47 normalization out of both consumers.
- `/Users/leocaseiro/Sites/ipa-phonemes-recorder/ui/audio.js` — external reference for the AudioContext + AnalyserNode pattern.

> **PRD/game-engine.md alignment:** This spec deviates from PRD section 5.6 and `game-engine.md` 7.4's "no complex waveform rendering required" guidance. Per the user decision during ce-doc-review, the upstream docs are being updated to reflect the new design (waveform shipped). Voice-input games are also documented as an exception to the PRD's "Offline by default" contract — STT requires connectivity on cloud-STT browsers and no offline fallback is provided.
>
> **State-machine substrate:** The two state machines documented below are implementation-neutral diagrams. Per the project's XState-first commitment for Phase 1, the implementation PR uses XState charts directly — the diagrams here translate one-to-one to chart definitions (states, transitions, parallel regions for recognition × ambient).

---

## Problem

Read Aloud — the PRD-designated STT-using game (`game_id: 'read_aloud'`, primary sub-component `SpeechInput`) — needs a reusable, observable speech-input surface. The existing `SpeechInput.ts` is a low-level browser-API wrapper with a one-shot demo; there is no reusable React component, no live audio feedback, no per-word streaming, and no integration path for games. Children speaking aloud need clear visual feedback that the app is listening, a clean turn-boundary signal, and graceful failure modes when their voice doesn't reach the engine.

This spec covers the v1 component scoped to **Read Aloud as the v1 consumer**. Future answer-style games (WordSpell, NumberMatch) become candidate consumers once the digit-conversion and homophone follow-ups (see Follow-ups) land — without those normalization helpers they cannot consume the component meaningfully.

## Goals

- Reusable React component with mic button + live amplitude feedback for the **Read Aloud game (v1 consumer)**. Subsequent answer-style games (WordSpell, NumberMatch) can adopt once the digit/homophone follow-ups land.
- Press-to-talk with automatic end-of-speech detection. User can also cancel mid-utterance.
- Words queued as the user speaks; consumer receives the full array (plus error context) at turn end via the `onTurnEnd` callback (see Public API).
- Optional ambient voice activity detection (VAD) that nudges the user when they appear to be speaking without having pressed the button. Off-ramp via app settings.
- Works on desktop and modern mobile browsers; degrades gracefully where unsupported.
- **Voice-input games require connectivity on cloud-STT browsers (Chrome, Edge, Android).** This trade-off is accepted; no offline fallback is provided. The component renders the `unsupported` visual when offline + cloud-STT browser detected.

## Non-goals

- No number-word to digit conversion ("seven" → "7"). Tracked as follow-up.
- No homophone resolution ("for" / "four"). Tracked as follow-up.
- No game wiring. Storybook-only landing; games consume in later PRs.
- No `SpeechGrammarList` constraints (sparsely supported).
- No persistence of recognized words across page refresh — `onTurnEnd` fires once per turn and the consumer persists.
- No offline-mode fallback for voice-input. PRD's "offline by default" principle does not extend to STT-using games (paralleling cloud-STT browser limits documented in Browser STT support).

## Decisions captured during brainstorming

| Decision          | Choice                                                                                              | Rationale                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| v1 consumer       | Read Aloud (PRD-designated STT game)                                                                | Aligns with PRD section 5.6; later answer-style games gated on digit/homophone follow-ups.                                 |
| Recognition mode  | Continuous + interim, final-only word queue                                                         | User can speak single or multiple words; queue lets consumer parse either.                                                 |
| End-of-speech     | Anchor on `onend`; `onspeechend` triggers `recognition.stop()`; cursor frozen after `onend`         | Eliminates the timer-vs-late-finals race; `onend` is the engine's authoritative termination signal.                        |
| Turn-end signal   | `onTurnEnd({ words, error })` fires exactly once per turn (success or empty)                        | Single subscription point for consumers; no asymmetric `onResult`-vs-`error` observation contract.                         |
| Cancel            | `recognition.abort()` discards pending interim, no `onTurnEnd`                                      | Distinct from graceful stop; the turn was abandoned, not concluded.                                                        |
| Waveform          | Real amplitude, mic open while listening                                                            | Honest visual feedback. PRD/game-engine.md updated in this PR to reflect the new design (see Related work).                |
| VAD               | Opt-in via setting, only after first non-empty internal `words` array                               | Avoids surprising users with the persistent mic indicator; gates on the cursor, not the optional consumer callback.        |
| VAD response      | Pulse the mic button when ambient speech detected                                                   | User stays in control; no auto-arming.                                                                                     |
| API shape         | Hook + presentational component, optional `VoiceInputContext` for tests/Storybook                   | Hook earns its place via the testing seam (`VoiceInputProvider`); React-only — no vanilla-JS obligation.                   |
| Language          | `options.lang` → `Settings.activeLanguage` → `'en-AU'` via `getRecognitionLang()` helper            | Project default is `en-AU` (Australian accent differs materially from US/UK). Helper shared across STT and TTS.            |
| Setting key       | `voiceInputAmbientVADEnabled`, default `true`                                                       | Verbose, scoped, matches existing camelCase RxDB keys. Setting toggle lives in `SettingsPanel.tsx` for now (see Settings). |
| First-record gate | In-memory only, resets on tab close. Flips on first non-empty internal `words` array.               | Decoupled from consumer callback choice; permission grant + first real recording is the privacy boundary.                  |
| Visibility        | `visibilitychange` to hidden while listening/processing aborts recognition; analyser pauses too     | Avoids stuck state on iOS Safari and silent cloud-STT relay on Chrome when tab is backgrounded.                            |
| Visual style      | Minimal — round mic button, ring pulse, 8 vertical bars                                             | Selected from three mockups (see Visual Design section).                                                                   |
| Touch target      | `sm = 44 px` (WCAG 2.5.5 floor), `md = 56 px` (default), `lg = 72 px`                               | All variants satisfy WCAG 2.5.5; `lg` for Pre-K / large-touch contexts.                                                    |
| Error vocabulary  | `error.kind` covers all `SpeechRecognitionErrorEvent` codes + `getUserMedia` `DOMException` mapping | Implementer needs full coverage to render actionable copy (e.g., `language-not-supported` vs generic).                     |
| Cloud STT consent | Browser-aware disclosure + `voiceInputEnabled` profile flag, off by default                         | Children's voices reach Google/Microsoft on Chrome+Edge; PRD "privacy is non-negotiable" requires explicit consent.        |

---

## Architecture

### File layout

```text
src/lib/speech/SpeechInput.ts          # existing, untouched
src/lib/speech/SpeechInput.demo.tsx    # DELETE (superseded)
src/lib/speech/SpeechInput.mdx         # DELETE (superseded)

src/components/VoiceInput/
  useVoiceInput.ts                     # hook: state machine, recognition, audio, VAD
  useVoiceInput.test.ts                # unit tests with mocked SpeechRecognition + AudioContext
  VoiceInputButton.tsx                 # presentational: button + ring pulse + bar meter + interim text
  VoiceInputButton.test.tsx
  VoiceInputButton.stories.tsx         # single Playground per `write-storybook` skill
  VoiceInputButton.mdx                 # MDX docs page
  index.ts                             # barrel export
```

### Boundaries

- `SpeechInput.ts` is the only place that types `window.SpeechRecognition`. Extended in this PR (see Related work). The hook imports `createSpeechRecognition`, `isSpeechInputAvailable`, and the extended event/error types from it.
- `useVoiceInput` is the only place that touches `getUserMedia`, `AudioContext` and `AnalyserNode`. The component never sees raw audio — it reads `meterLevel` (0–1) and `interim` strings off the hook.
- The component is purely presentational. The hook layer exists so Storybook (and unit tests) can inject mock state via `VoiceInputProvider` without fragile DOM-driven mocking. Future React consumers may emerge but a vanilla-JS / framework-agnostic API is **not** a goal — the project is React-only.
- Storybook title: `'Services/VoiceInput/VoiceInputButton'` (PascalCase per the project rule in `CLAUDE.md`).

### Test seam — `VoiceInputContext`

The hook checks `useContext(VoiceInputContext)` at entry; absent context, it falls back to real browser APIs. This replaces the earlier `process.env.STORYBOOK` gating, which would not fire in this Vite-based codebase (`import.meta.env`-only). The context shape:

```ts
type VoiceInputContextValue = {
  // when present, useVoiceInput reads mock state from here instead of
  // calling getUserMedia / new SpeechRecognition().
  mockStatus?: VoiceInputStatus;
  mockMeterLevel?: number;
  mockIsSpeaking?: boolean;
  mockInterim?: string;
  mockAmbientHint?: boolean;
  mockError?: VoiceInputError | null;
};

export const VoiceInputContext: React.Context<VoiceInputContextValue | null>;
export const VoiceInputProvider: React.FC<{
  value: VoiceInputContextValue;
  children: React.ReactNode;
}>;
```

The Storybook decorator wraps stories in `<VoiceInputProvider value={...}>`; production code never instantiates the provider.

### Settings

Two new RxDB settings keys:

```ts
voiceInputEnabled?: boolean             // default false — profile-level voice-input opt-in
voiceInputAmbientVADEnabled?: boolean   // default true — ambient detection toggle
```

`voiceInputEnabled` is a profile-level switch added by the cloud-STT consent flow (see "Before first mic activation" in Error and permission UX). `voiceInputAmbientVADEnabled` controls ambient detection within an enabled profile.

`SettingsPanel.tsx` gets a new toggle row for `voiceInputAmbientVADEnabled` — placed in the regular settings panel for **dev-state access** (the parent-PIN-gated `/$locale/parent` settings route is not yet built). A follow-up TODO is filed to migrate the toggle to the parent-gated route once that route lands (see Follow-ups). The hook itself stays decoupled from RxDB — the component reads the setting and forwards `ambientVAD` as a prop.

#### Settings schema migration (mandatory)

Adding the new keys requires the four standard RxDB schema-bump steps. Without these, RxDB rejects writes containing the new fields, or refuses to open the DB on existing-user data.

1. Bump `settingsSchema.version` from `3` → `4` in `src/db/schemas/settings.ts`. Add both new properties to `properties` and update the `SettingsDoc` TypeScript type.
2. Register `migrationStrategies[4]: (oldDoc) => oldDoc` in `src/db/create-database.ts` — no-op migration since both fields are optional.
3. Extend `DEFAULT_SETTINGS` in `src/db/hooks/useSettings.ts`: `voiceInputEnabled: false`, `voiceInputAmbientVADEnabled: true`.
4. Confirm `MAX_SCHEMA_VERSION` recomputes automatically (`src/db/schemas/index.ts:42`).

---

## Public API

### Hook

```ts
type VoiceInputStatus =
  | 'unsupported' // SpeechRecognition or getUserMedia missing
  | 'idle' // ready, not listening
  | 'requesting' // awaiting mic permission
  | 'listening' // armed and capturing
  | 'processing' // onspeechend fired, finalizing
  | 'denied' // user blocked mic
  | 'error';

type VoiceInputError =
  | { kind: 'no-speech' }
  | {
      kind: 'audio-capture';
      subKind: 'not-found' | 'in-use' | 'constraints';
    }
  | { kind: 'network' }
  | { kind: 'aborted' }
  | { kind: 'not-allowed' }
  | { kind: 'service-not-allowed' }
  | { kind: 'language-not-supported' }
  | { kind: 'unknown'; message: string };

type VoiceInputTurnResult = {
  words: string[]; // empty for silent turns
  error: VoiceInputError | null; // populated for empty/network/etc.
};

type UseVoiceInputOptions = {
  lang?: string; // default: getRecognitionLang() — see Recognition config
  ambientVAD?: boolean; // default: true (controlled by voiceInputAmbientVADEnabled setting)
  onTurnEnd?: (result: VoiceInputTurnResult) => void; // unified end-of-turn signal
  onAmbientSpeech?: () => void;
  // vadThreshold / vadSustainMs are intentionally NOT in the public API at v1.
  // They live as internal constants in the hook and are exposed only via Storybook
  // controls for visual tuning. Lift to public options once a real consumer needs override.
};

type UseVoiceInputReturn = {
  status: VoiceInputStatus;
  words: string[];
  interim: string;
  meterLevel: number; // 0–1, smoothed
  isSpeaking: boolean; // meterLevel > vadThreshold sustained
  ambientHint: boolean;
  error: VoiceInputError | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  reset: () => void;
};

export const useVoiceInput: (
  options?: UseVoiceInputOptions,
) => UseVoiceInputReturn;

// Shared helper hoisted for use by both useVoiceInput and useGameTTS.
// Falls back: options.lang -> Settings.activeLanguage -> 'en-AU'.
export const getRecognitionLang: (lang?: string) => string;
```

The `error.kind` enum maps every documented `SpeechRecognitionErrorEvent.error` value plus `getUserMedia` `DOMException` codes:

| Source                                               | `error.kind` (+ `subKind`)              |
| ---------------------------------------------------- | --------------------------------------- |
| `SpeechRecognitionErrorEvent.no-speech`              | `no-speech`                             |
| `SpeechRecognitionErrorEvent.aborted`                | `aborted`                               |
| `SpeechRecognitionErrorEvent.audio-capture`          | `audio-capture` (subKind `in-use`)      |
| `SpeechRecognitionErrorEvent.network`                | `network`                               |
| `SpeechRecognitionErrorEvent.not-allowed`            | `not-allowed`                           |
| `SpeechRecognitionErrorEvent.service-not-allowed`    | `service-not-allowed`                   |
| `SpeechRecognitionErrorEvent.language-not-supported` | `language-not-supported`                |
| `getUserMedia` `NotFoundError`                       | `audio-capture` (subKind `not-found`)   |
| `getUserMedia` `NotReadableError`                    | `audio-capture` (subKind `in-use`)      |
| `getUserMedia` `OverconstrainedError`                | `audio-capture` (subKind `constraints`) |
| `getUserMedia` `SecurityError`                       | `not-allowed`                           |
| `getUserMedia` `AbortError`                          | `aborted`                               |
| anything else                                        | `unknown` (carries `message`)           |

### Component

```ts
type VoiceInputButtonProps = {
  lang?: string;
  ambientVAD?: boolean; // default reads from settings via useSettings()
  showInterim?: boolean; // default true
  showMeter?: boolean; // default true
  size?: 'sm' | 'md' | 'lg'; // sm=44px, md=56px (default), lg=72px — all WCAG 2.5.5-compliant
  className?: string;
  ariaLabel?: string; // default i18n
  onTurnEnd?: (result: VoiceInputTurnResult) => void;
  onAmbientSpeech?: () => void;
};

export const VoiceInputButton: React.FC<VoiceInputButtonProps>;
```

### Notes

- `start()` is async because permission grant + AudioContext resume are async. Calling `start()` while `status !== 'idle'` is a no-op (a dev-mode warning logs).
- `stop()` calls `recognition.stop()` (graceful — pending finals emit, then `onTurnEnd` fires once). `cancel()` calls `recognition.abort()`, clears interim, and does **not** fire `onTurnEnd`.
- `onTurnEnd` fires exactly once per turn — on graceful stop, on `onspeechend` auto-stop, or on a recoverable mid-turn error (network, track-ended). It does not fire on `cancel()`.
- `meterLevel` is normalized RMS scaled by an internal gain (4×) and smoothed via `AnalyserNode.smoothingTimeConstant`. Component never re-smooths.
- `error` is sticky until `reset()` or the next `start()`.

### `reset()` semantics — defined for every state

| Calling state                   | Behavior                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `idle`, `denied`, `unsupported` | Clear `error` / `words` / `interim`. No-op for recognition/audio.                            |
| `requesting`                    | Cancel the in-flight permission request best-effort; clear state; transition to `idle`.      |
| `listening`, `processing`       | Implicitly call `cancel()` first (`recognition.abort()`, no `onTurnEnd`); clear state; idle. |
| `error`                         | Clear `error` / `words` / `interim`; transition to `idle`.                                   |

Consumers can call `reset()` from any state without state-aware guards.

---

## State machine

Two orthogonal machines: **recognition** (press-to-talk lifecycle) and **ambient** (post-first-record VAD monitor).

### Recognition machine

```text
        ┌──────────────┐
        │ unsupported  │  (terminal)
        └──────────────┘

  ┌──── idle ────────────────────────────────────┐
  │      │                                       │
  │      │ start()                               │ reset()
  │      ▼                                       │
  │  requesting ── permission denied ──► denied  │
  │      │                                       │
  │      │ permission granted                    │ start() (re-prompt)
  │      ▼                                       │
  │  listening ── onresult / onspeechend ─► processing
  │      │                                       │
  │      │ cancel() / abort                      │ onResult fired,
  │      │                                       │ recognition.onend
  │      ▼                                       ▼
  │   idle (interim cleared)                  idle (words preserved)
  │
  │  any state ── error event ──► error ── reset() ──► idle
  └───────────────────────────────────────────────┘
```

### Ambient machine

```text
        ┌──── ambient-off (initial) ─────────┐
        │                                    │
        │ first successful onResult          │ disabled in settings,
        │ AND voiceInputAmbientVADEnabled    │ component unmount,
        │ AND status === 'idle'              │ status !== 'idle'
        │                                    │
        ▼                                    │
   ambient-armed                             │
   (analyser polling at 10 Hz, 0–1 RMS)      │
        │                                    │
        │ rms > vadThreshold for vadSustainMs│
        │                                    │
        ▼                                    │
   ambient-triggered (ambientHint = true)    │
        │                                    │
        │ status flips to 'listening'        │
        │ OR rms drops below threshold ~1.5s │
        │ OR 3s timeout (clears stale hint)  │
        │                                    │
        ▼                                    │
   ambient-armed ◄────────────────────────────
```

### Invariants

- The ambient machine pauses while recognition is non-idle.
- The hook itself opens at most one `getUserMedia` stream. The Web Speech API engine opens its own internal capture during `recognition.start()` — we do not control that and rely on the browser to deduplicate the system mic indicator. The invariant the hook enforces is: **at most one explicit `getUserMedia` call alive at any time**, regardless of recognition lifecycle.
- First-record gate is in-memory per session. Flips on first non-empty internal `words` array (decoupled from optional consumer callback). Tab close resets it.
- `ambientHint` clears the moment `start()` is called, or after 3 s if the user does not engage.
- `no-speech` is reported as `error: { kind: 'no-speech' }` with `status: 'idle'`, AND `onTurnEnd({ words: [], error })` fires. The UI renders "Didn't catch that" and the user can retry.

### Mid-turn failure modes

| Trigger                                                     | Behavior                                                                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `recognition.onerror` `network` mid-listening               | Fire `onTurnEnd({ words: words.slice(), error: { kind: 'network' } })`; status → `error`. Recoverable.                            |
| Media track ended (`stream.getTracks()[0].onended`)         | Abort recognition; status → `error`; `error: { kind: 'audio-capture', subKind: 'in-use' or 'not-found' }` based on initial probe. |
| `visibilitychange` to hidden (status: listening/processing) | Call `cancel()` (abort, no `onTurnEnd`); status → `idle`. Analyser pauses too.                                                    |
| `start()` re-entered while `status !== 'idle'`              | No-op. Dev-mode `console.warn`. No state change.                                                                                  |
| `service-not-allowed` (insecure-context, autoplay policy)   | Fire `error: { kind: 'service-not-allowed' }`; status → `error`. UI directs to permissions/HTTPS.                                 |
| `language-not-supported`                                    | Fire `error: { kind: 'language-not-supported' }`; status → `error`. UI suggests changing language in Settings.                    |

---

## Word queue and end-of-speech

### Recognition config

```ts
recognition.lang = getRecognitionLang(options.lang);
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 1;
```

`getRecognitionLang(lang?)` resolves the BCP-47 tag for SpeechRecognition. `i18n.language` returns the region-less `'en'` in this codebase (`src/lib/i18n/i18n.ts:13` initializes `lng: 'en'`), which Chrome handles inconsistently across platforms. The fallback chain:

1. `options.lang` if explicitly passed (e.g., `'pt-BR'`, `'en-AU'`).
2. `Settings.activeLanguage` from `useSettings()` if present.
3. `'en-AU'` (project default; Australian accent differs materially from US/UK).

The helper is shared with `useGameTTS` so STT and TTS resolve languages identically.

### Final-only parsing

The hook tracks a cursor — the index of the next un-emitted final result. On every `onresult`:

1. Walk `results[cursor..end]`.
2. For each `isFinal` entry: split `alt[0].transcript` on `/\s+/`, trim, drop empties, push each token onto `words`. Advance the cursor.
3. Concatenate trimmed text of all remaining (non-final) entries into `interim` (overwrite, not append).

This means:

- Final words are pushed exactly once each, regardless of how Chrome batches them.
- Interim flickers are absorbed naturally — finals replace interim text.
- Punctuation: leading/trailing `.,!?` is stripped per token. Casing is preserved; the consumer normalizes.

### End-of-speech path — anchor on `onend`, not on a timer

`onspeechend` fires when the engine detects sustained silence (browser-tuned, typically 1–2 s). The lifecycle anchors on `recognition.onend` — the engine's authoritative termination signal — not on a wall-clock timer. The 600 ms timer is a backstop only.

1. `status: 'listening' → 'processing'`.
2. Call `recognition.stop()` immediately.
3. Start a 600 ms backstop timer; if `onend` has not fired by then, force-call `recognition.abort()`.
4. On `recognition.onend`:
   - **Freeze the cursor** — any `onresult` arriving after this point is ignored.
   - If `words.length > 0`: fire `onTurnEnd({ words: words.slice(), error: null })`; `status → 'idle'`.
   - If `words.length === 0`: fire `onTurnEnd({ words: [], error: { kind: 'no-speech' } })`; `status → 'idle'`; `error` set as documented.
5. The decision to fire `onTurnEnd` happens in `onend` exactly once.

This eliminates the timer-vs-late-finals race where finals arrive after the consumer was already told the turn ended.

### Cancel path

`cancel()` calls `recognition.abort()`, clears `interim`, leaves `words` as-is, **does not** fire `onTurnEnd`. `status → 'idle'`.

### Stop path

`stop()` is user-initiated graceful end-of-speech. Same path as `onspeechend` (steps 1–5 above) — fires `onTurnEnd` with whatever has been finalized.

---

## Audio plumbing

### Single shared graph

One hook-managed `getUserMedia` stream, one `AudioContext`, one `AnalyserNode`. Used for both the live meter (during press-to-talk) and the ambient VAD monitor. The hook never opens its `getUserMedia` twice. The Web Speech engine opens its own internal capture during `recognition.start()` — that is browser-controlled and outside the hook's scope; some browsers may briefly show two mic indicators while recognition is active.

### `meterLevel` computation

```ts
// Internal constants (not exposed in public API at v1; lifted via Storybook controls)
const VAD_GAIN = 4; // brings typical conversational voice into [0.1, 0.6]
const VAD_THRESHOLD = 0.08; // RMS, after gain
const VAD_SUSTAIN_MS = 600;

meterLevel = clamp01(rms * VAD_GAIN); // gain disambiguated from CSS --bar-spread-gain
isSpeaking = meterLevel > VAD_THRESHOLD sustained (VAD_SUSTAIN_MS / 2);
```

The CSS spread factor for inter-bar amplitude variation is renamed to `--bar-spread-gain` so JS `gain` and CSS spread are not conflated.

### Audio-graph state machine

The audio-graph lifecycle is a small parallel region alongside the recognition machine. Detailed state transitions (and the route-change teardown rule from finding 12.2) are deferred to the implementation chart — see `## Deferred / Open Questions` below for the full machine to be drawn during XState chart authoring.

High-level lifecycle:

```text
1. First start() call:
     getUserMedia({ audio: true }) → MediaStream stored on a ref
     new AudioContext(), source = ctx.createMediaStreamSource(stream)
     analyser = ctx.createAnalyser(), fftSize=2048, smoothingTimeConstant=0.3
     source.connect(analyser)

2. recognition.start() (engine opens its own internal stream; we do not control it)

3. RAF loop reads analyser.getFloatTimeDomainData → computes RMS, peak
     → meterLevel = clamp01(rms * VAD_GAIN), exposed on hook
     → isSpeaking = meterLevel > VAD_THRESHOLD sustained

4. After first non-empty internal `words` array AND voiceInputAmbientVADEnabled:
     drop RAF loop to setInterval at 100 ms (10 Hz polling)
     same RMS computation
     if rms > VAD_THRESHOLD for VAD_SUSTAIN_MS → ambientHint = true

5. Recording starts again from ambient mode: switch back to RAF, keep stream open.

6. Teardown order (component unmount, setting flips false, OR route-change teardown):
     a. set torn-down ref flag (RAF/interval callbacks check at entry, return early)
     b. cancelAnimationFrame / clearInterval
     c. stream.getTracks().forEach(t => t.stop())
     d. await audioContext.close() (catch state errors if already closed)
     e. null the refs
```

While the analyser stream is held open in ambient-armed state, the component renders a small persistent in-app mic-on indicator (see Visual design — state visuals "Idle (ambient armed)" row) so users see the open-mic posture without relying on the OS-level browser indicator alone.

### Browser quirks

- iOS Safari: `AudioContext` must be created or resumed inside a user gesture. `start()` is always button-triggered, so this works.
- Mobile background tabs: browsers throttle / suspend `AudioContext` when backgrounded. On `visibilitychange` to hidden while listening/processing, the hook calls `cancel()` to abort recognition cleanly (avoids iOS stuck state and Chrome silent cloud-relay) and pauses the analyser loop. On visible again, no auto-restart — the user re-presses the mic.
- iOS Safari Web Speech API: works on iOS 14.5+ but requires a user gesture for every `recognition.start()`. Press-to-talk satisfies this; auto-arming on ambient detection would not — another reason ambient hints only pulse the button rather than auto-record. Some iOS builds do not fire `onend` after `abort()`; the 600 ms backstop in End-of-speech path doubles as a watchdog.
- Some browsers show two mic indicators briefly while recognition is active (analyser's `getUserMedia` + the engine's internal stream). This is browser UI, not double-permission.

---

## Visual design

Selected style: **Minimal — round mic button (56 px) + ring pulse + 8 vertical bars + interim text**. The other two proposals (prominent pill, compact icon) become future variants via the `size` prop.

### State visuals

Color tokens referenced below resolve to CSS custom properties. A new `--voice-input-ambient` token is added (light + dark mode values) for the ambient-hint glow; reuse existing project focus-ring / status tokens elsewhere.

| State                                                                                    | Ring pulse                                                                | Bars                                                                            | Interim                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| Idle                                                                                     | none                                                                      | dimmed, soft idle breath                                                        | empty                                         |
| Idle (ambient armed)                                                                     | none on button; small persistent mic-on indicator next to / on the button | dimmed                                                                          | empty                                         |
| Requesting (permission)                                                                  | spinner replaces mic icon after 300 ms                                    | dimmed (same as idle)                                                           | tooltip "Allow mic access…"                   |
| Listening + silent                                                                       | steady pulse 1.6 s loop                                                   | small idle breath (max ~25 %)                                                   | "" or last interim fading                     |
| Listening + speaking                                                                     | steady pulse, opacity scales with meter                                   | heights driven by `meterLevel` with per-bar `--bar-spread-gain` for wave-spread | live transcript                               |
| Processing                                                                               | pulse fades out                                                           | bars settle to idle                                                             | last interim freezes briefly                  |
| Ambient hint                                                                             | `--voice-input-ambient` box-shadow ring pulses                            | none                                                                            | "Looks like you're talking — tap to record"   |
| Denied                                                                                   | mic icon greyed + slash overlay; tooltip points to browser settings       | hidden                                                                          | inline error + "How to allow" affordance link |
| Error (audio-capture / network / service-not-allowed / language-not-supported / unknown) | none                                                                      | dimmed (same as idle)                                                           | inline error text per `error.kind` (see i18n) |
| Unsupported                                                                              | component renders `null` (or `fallback` slot)                             | —                                                                               | —                                             |

### Focus, hover, keyboard

The mic button is the primary interactive element and must be keyboard-accessible. WCAG 2.1 SC 2.4.7 (Visible Focus) is non-negotiable.

- `:focus-visible` — 2 px contrast-checked outline at 2 px offset using the project focus-ring token (or define a new `--voice-input-focus` token if no shared one exists).
- `:hover` — slight scale (`transform: scale(1.04)`) or ring-opacity bump; respect `prefers-reduced-motion` (drop the scale, keep ring opacity).
- `:active` / pressed — `aria-pressed={status === 'listening'}` PLUS a visual indicator (ring opacity peak) — does not rely on color alone.
- All three states meet the 3:1 non-text contrast requirement against background.

### CSS-only animation

The component contains zero JS animation logic. React re-renders only when `status`, `meterLevel`, `isSpeaking`, or `interim` change. CSS handles smoothing and idle motion:

```tsx
<div
  className="meter"
  data-speaking={isSpeaking}
  style={{ '--meter': meterLevel }}
>
  {Array.from({ length: 8 }).map((_, i) => (
    <span style={{ '--phase': i / 8 }} />
  ))}
</div>
```

```css
.meter span {
  transform: scaleY(
    calc(0.18 + var(--meter) * var(--bar-spread-gain, 1))
  );
  transition:
    transform 60ms linear,
    opacity 60ms linear;
}
.meter[data-speaking='false'] span {
  animation: vi-idle-breath 2.4s ease-in-out infinite;
  transform: none;
}

/*
 * Reduced motion: bars hold a fixed height; opacity scales with meterLevel
 * instead of scaleY. Opacity changes are less vestibular-triggering than
 * height jumps. The button's ring pulse and ambient-glow animations also stop.
 */
@media (prefers-reduced-motion: reduce) {
  .meter span {
    animation: none;
    transition: opacity 200ms linear;
    transform: scaleY(0.5); /* fixed height */
    opacity: calc(0.3 + var(--meter) * 0.7);
  }
  .pulse-ring,
  .ambient-pulse {
    animation: none;
    transition: none;
  }
}
```

`meterLevel` writes throttled to ~30 fps in the hook to avoid React thrash. CSS `transition: transform 60ms linear` smooths the gap between writes; under reduced motion, opacity transitions replace transform jumps.

---

## Error and permission UX

### Before first mic activation — cloud-STT consent gate

For a children's product where Chrome and Edge relay audio to Google/Microsoft cloud STT, the spec adds a consent gate before voice input is enabled on a child profile. The flow:

1. **Browser detection** — runtime check classifies the engine as `cloud` (Chrome desktop/Android, Edge, Safari with unsupported language) or `on-device` (Safari with supported language).
2. **Profile-level toggle** — `voiceInputEnabled` setting is `false` by default. The first-run prompt to enable lives behind the parent flow (when the parent-PIN route lands; until then, in `SettingsPanel` per the dev-state note in Settings).
3. **Disclosure copy** — when enabling on a `cloud` browser, the parent-facing prompt reads: `On this browser, spoken audio is sent to Google or Microsoft for recognition. Audio leaves the device.` On `on-device`, the prompt reads: `On this browser, audio is processed on-device.`
4. **Settings copy** — the toggle's help text in `SettingsPanel` mirrors the disclosure: `Audio is processed on Google/Microsoft servers when using Chrome or Edge.` (or on-device equivalent).

The component renders `unsupported` if `voiceInputEnabled === false` regardless of browser capability.

### Scenario table

| Scenario                                  | `status`      | `error.kind`                             | Component renders                                                                                   | Recoverable?             |
| ----------------------------------------- | ------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------ |
| API not in browser                        | `unsupported` | —                                        | `null` (or `fallback` slot)                                                                         | No                       |
| `voiceInputEnabled === false`             | `unsupported` | —                                        | `null` (or `fallback` slot)                                                                         | After parent enables     |
| Settings disable ambient VAD              | (any)         | —                                        | VAD machinery never runs; press-to-talk still works                                                 | n/a                      |
| First press, prompt shown                 | `requesting`  | —                                        | mic dimmed, "Allow mic access…" tooltip; spinner replaces icon after 300 ms                         | —                        |
| User clicks Block                         | `denied`      | `not-allowed`                            | greyed mic + slash + tooltip "Open browser settings to allow"; "How to allow" affordance link below | Settings change required |
| No microphone detected                    | `error`       | `audio-capture` (`subKind: not-found`)   | inline "No microphone detected."                                                                    | Plug in a mic            |
| Mic in use elsewhere                      | `error`       | `audio-capture` (`subKind: in-use`)      | inline "Microphone in use by another app."                                                          | Yes                      |
| Mic constraints unsupported               | `error`       | `audio-capture` (`subKind: constraints`) | inline "Microphone configuration not supported."                                                    | Yes                      |
| Engine cannot reach service               | `error`       | `network`                                | inline "Couldn't reach the voice service. Check your connection and try again."                     | Yes                      |
| Service not allowed (insecure context)    | `error`       | `service-not-allowed`                    | inline "Voice input requires a secure connection."                                                  | Page must be HTTPS       |
| Engine doesn't support requested language | `error`       | `language-not-supported`                 | inline "Voice doesn't support this language. Try changing it in Settings."                          | Switch language          |
| Silence the whole turn                    | `idle`        | `no-speech`                              | inline "Didn't catch that — try again."                                                             | Yes                      |
| User cancels                              | `idle`        | `aborted`                                | no message; consumer can branch on `error`                                                          | Yes                      |
| Anything else                             | `error`       | `unknown`                                | inline "Voice input failed. Try again."                                                             | Yes                      |

### Notes

- Errors render **inline below the button** in a region with `role="alert"` (assertive aria-live) so screen readers announce them without queueing.
- Interim transcript renders in a separate region with `role="status"` (polite aria-live) so the two channels don't collide.
- We always call `getUserMedia` **before** `recognition.start()` so the denied state is detected explicitly.
- `start()` always clears `error` first — pressing the button is unambiguous retry intent.
- `reset()` clears `error`, `words`, `interim` per the table in Public API. From a non-idle state, it implicitly cancels first.
- Pressing the mic button while in `denied` state is informational only; tapping shows the tooltip / focuses the "How to allow" affordance, not a re-prompt (browsers don't re-prompt once permanently blocked).

### Browser STT support reality

Network handling is conservative because offline behaviour varies:

| Browser / platform              | Offline STT | Notes                                          |
| ------------------------------- | ----------- | ---------------------------------------------- |
| Chrome (desktop, Android)       | No          | Cloud STT — `network` error when offline.      |
| Edge                            | No          | Cloud STT.                                     |
| Safari (iOS 14.5+, macOS 14.5+) | Often yes   | On-device dictation for English + some others. |
| Safari, unsupported language    | No          | Falls back to cloud.                           |
| Firefox                         | n/a         | Web Speech API not shipped in stable.          |

The `network` error fires only when the engine itself reports the failure, so Safari users with offline dictation will not see it for English. Chrome users always need internet.

### i18n

New namespace `voiceInput.json` per locale. Both `en` and `pt-BR` translations must be authored in this PR — the project does not ship locale-incomplete namespaces.

**Registration steps:**

1. Create `src/lib/i18n/locales/en/voiceInput.json` and `src/lib/i18n/locales/pt-BR/voiceInput.json`.
2. Import both in `src/lib/i18n/i18n.ts` and register in the `resources` map.
3. Consumers call `useTranslation('voiceInput')`.

**Keys (English; pt-BR translates each):**

```json
{
  "label.tapToSpeak": "Tap to speak",
  "label.listening": "Listening…",
  "label.processing": "Processing…",
  "label.howToAllow": "How to allow",
  "error.notAllowed": "Mic access blocked. Open browser settings to allow.",
  "error.audioCapture.notFound": "No microphone detected.",
  "error.audioCapture.inUse": "Microphone in use by another app.",
  "error.audioCapture.constraints": "Microphone configuration not supported.",
  "error.network": "Couldn't reach the voice service. Check your connection and try again.",
  "error.serviceNotAllowed": "Voice input requires a secure connection.",
  "error.languageNotSupported": "Voice doesn't support this language. Try changing it in Settings.",
  "error.noSpeech": "Didn't catch that — try again.",
  "error.unknown": "Voice input failed. Try again.",
  "ambient.hint": "Looks like you're talking — tap to record.",
  "consent.cloudDisclosure": "On this browser, spoken audio is sent to Google or Microsoft for recognition. Audio leaves the device.",
  "consent.onDeviceDisclosure": "On this browser, audio is processed on-device.",
  "settings.voiceInputLabel": "Voice input",
  "settings.voiceInputHelp": "Audio is processed on Google/Microsoft servers when using Chrome or Edge.",
  "settings.ambientVadLabel": "Detect speech without pressing the mic",
  "settings.ambientVadHelp": "Pulses the mic button when you start talking. Requires mic permission."
}
```

---

## Storybook

Single Playground per `write-storybook` skill. Title: `'Services/VoiceInput/VoiceInputButton'`.

### Mock decorator

Real `SpeechRecognition` and `getUserMedia` cannot run reliably inside Storybook. The decorator wraps each story in `<VoiceInputProvider value={...}>` (see Architecture / Test seam). The hook checks `useContext(VoiceInputContext)` at entry; when present, it reads mock state from the provider instead of calling browser APIs. This replaces the earlier `process.env.STORYBOOK` check, which doesn't run in this Vite-based codebase.

### Args and argTypes

```ts
type StoryArgs = VoiceInputButtonProps & {
  mockStatus: VoiceInputStatus;
  mockMeterLevel: number;
  mockIsSpeaking: boolean;
  mockInterim: string;
  mockAmbientHint: boolean;
  mockErrorKind: VoiceInputError['kind'] | 'none';
  // Internal VAD constants surfaced as Storybook controls so we can tune
  // the right defaults visually without committing them to public API.
  vadThreshold: number;
  vadSustainMs: number;
  vadGain: number;
};

argTypes: {
  size:           { control: { type: 'radio' },  options: ['sm', 'md', 'lg'] },
  showInterim:    { control: 'boolean' },
  showMeter:      { control: 'boolean' },
  lang:           { control: { type: 'select' }, options: ['en-AU', 'en-US', 'en-GB', 'pt-BR'] }, // en-AU first — project default
  mockStatus:     { control: { type: 'select' }, options: ['idle','requesting','listening','processing','denied','error','unsupported'] },
  mockMeterLevel: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  mockIsSpeaking: { control: 'boolean' },
  mockInterim:    { control: 'text' },
  mockAmbientHint:{ control: 'boolean' },
  mockErrorKind:  { control: { type: 'select' }, options: ['none','no-speech','audio-capture','network','aborted','not-allowed','service-not-allowed','language-not-supported','unknown'] },
  vadThreshold:   { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } }, // tune defaults visually
  vadSustainMs:   { control: { type: 'range', min: 100, max: 2000, step: 50 } },
  vadGain:        { control: { type: 'range', min: 1, max: 10, step: 0.5 } },
  onTurnEnd:      { action: 'onTurnEnd' },
  onAmbientSpeech:{ action: 'onAmbientSpeech' },
}
```

No raw JSON controls (per `feedback_storybook_controls.md`).

### MDX page covers

1. What the component does and when to use it (Read Aloud as v1 consumer).
2. The `useVoiceInput` hook signature, `onTurnEnd` contract, and `getRecognitionLang` helper.
3. Browser-support matrix (the table above) plus the cloud-STT consent flow ("Before first mic activation").
4. The `voiceInputEnabled` and `voiceInputAmbientVADEnabled` settings, current SettingsPanel placement, and parent-PIN migration TODO.
5. Follow-up TODOs for game-side helpers (number-words, match-words, homophones, onWord, persistKey, calibration).
6. Embedded Playground via `<Canvas of={...} />` covering all visual states (idle, ambient-armed, requesting, listening + silent, listening + speaking, processing, ambient-hint, denied, error variants, unsupported).
7. A11y notes — focus-visible, role split (alert vs status), reduced-motion behaviour, "How to allow" affordance.

### A11y

- Button: `aria-pressed={status === 'listening'}` so screen readers announce the toggle state.
- Button: `aria-label` from `ariaLabel` prop, defaults from i18n. Visible focus ring via `:focus-visible` (see Visual design — Focus, hover, keyboard).
- Live region for interim transcript: `<div role="status" aria-live="polite">{interim}</div>`.
- Live region for errors: separate region with `role="alert"` (assertive) so error announcements interrupt cleanly without colliding with interim updates.
- Pulsing ring is `aria-hidden="true"` (decorative).
- `prefers-reduced-motion: reduce` disables ring pulse and bar idle-breath. Speaking-driven feedback remains: bars hold a fixed height, opacity scales with `meterLevel` (less vestibular-triggering than scaleY jumps).
- "How to allow" affordance in `denied` state is keyboard-reachable and labelled `label.howToAllow` from i18n.
- a11y addon must pass with no violations.

---

## Testing strategy

### Hook unit tests (`useVoiceInput.test.ts`)

Covered with mocked `SpeechRecognition` and `AudioContext`:

- Final results are queued exactly once even when Chrome batches them.
- Interim results overwrite, do not append.
- End-of-speech anchors on `onend`: late `onresult` after `onend` does NOT alter `words` or fire `onTurnEnd` again (cursor frozen).
- Empty turn fires `onTurnEnd({ words: [], error: { kind: 'no-speech' } })` exactly once.
- Non-empty turn fires `onTurnEnd({ words: [...], error: null })` exactly once.
- `cancel()` aborts and does NOT fire `onTurnEnd`.
- `reset()` from `listening` / `processing` implicitly cancels first, then transitions to `idle`.
- `start()` while `status !== 'idle'` is a no-op (logs dev warning).
- Permission denial yields `status: 'denied'`, `error: { kind: 'not-allowed' }`.
- `getUserMedia` `NotFoundError` yields `error: { kind: 'audio-capture', subKind: 'not-found' }`; `NotReadableError` yields `subKind: 'in-use'`.
- `language-not-supported` and `service-not-allowed` map to their distinct `error.kind` values.
- First non-empty internal `words` flips the ambient gate (decoupled from optional consumer callback).
- Ambient threshold trigger fires `onAmbientSpeech` and sets `ambientHint`.
- `voiceInputAmbientVADEnabled = false` keeps the analyser closed when idle.
- `visibilitychange` to hidden while listening aborts recognition (no `onTurnEnd`) AND pauses analyser.
- Network error mid-listening fires `onTurnEnd` with finalized `words` plus `error: { kind: 'network' }`.
- Media track ended (`stream.getTracks()[0].onended`) aborts recognition with `audio-capture`.
- Teardown order: torn-down flag set first, then RAF cancelled, then track stop, then `audioContext.close()` awaited; late RAF callbacks return early.
- `getRecognitionLang` resolves: explicit `options.lang` → `Settings.activeLanguage` → `'en-AU'`.

### Component unit tests (`VoiceInputButton.test.tsx`)

- Renders correct visual class set per `status` — including new `requesting` and `error` rows from the state-visuals table.
- Forwards `mockStatus` from the story decorator (verifies the test wiring itself works) — including ambient-armed indicator visibility.
- Reads `voiceInputEnabled` and `voiceInputAmbientVADEnabled` from `useSettings()` and forwards to the hook; `voiceInputEnabled === false` renders the unsupported fallback.
- Renders inline error text matching `error.kind` (and `subKind` for `audio-capture`).
- Errors render in `role="alert"` region, interim in `role="status"` region — the two are separate elements.
- Reduced-motion media query swaps bar `scaleY` for `opacity`-only amplitude.
- `:focus-visible` outline renders when the button receives keyboard focus.
- Denied state surfaces "How to allow" affordance link as a focusable target; pressing the button while denied does not call `start()`.
- All three `size` variants (44 / 56 / 72 px) render with the documented dimensions.

### VR

A new VR story (or extension of the Playground) covers each visual state combination through the mock decorator. Standard Docker workflow.

### Manual / out of scope for tests

- Real-browser STT correctness (mocked in unit tests).
- iOS Safari microphone gesture quirks.
- Cross-browser engine behaviour differences.

---

## Follow-ups (out of scope, to be filed as GitHub issues)

```text
TODO(voice-input/follow-up): src/lib/speech/words-to-digits.ts
  Converts spoken number words to digit strings. NumberMatch consumer.
  e.g. ['seven', 'three', 'twenty', 'one'] → ['7', '3', '21']
  Handles compound numbers ('twenty one'), zero/oh, and locale via i18n.

TODO(voice-input/follow-up): src/lib/speech/match-words.ts
  Fuzzy match a spoken-words array against an expected answer set.
  Options: { caseInsensitive, stripPunctuation, allowHomophones }.
  Returns { matched: boolean, normalized: string[], confidence: number }.
  WordSpell consumer.

TODO(voice-input/follow-up): src/lib/speech/homophones.ts
  Locale-keyed homophone map (en-AU, en-US, pt-BR, ...).
  Used by match-words.ts when allowHomophones is true.
  e.g. { 'four': ['for', 'fore'], 'two': ['to', 'too'] }

TODO(voice-input/follow-up): useVoiceInput onWord callback
  Streaming per-word callback for incremental persistence.
  Add { onWord?: (word: string) => void } to UseVoiceInputOptions.

TODO(voice-input/follow-up): useVoiceInput persistKey option
  When set, mirror words queue to sessionStorage under the given key
  so refresh-mid-turn does not lose finalized words.

TODO(voice-input/follow-up): move VAD toggle to parent-PIN-gated settings
  Once the parent settings route (/$locale/parent) lands per PRD P-02,
  migrate voiceInputAmbientVADEnabled and voiceInputEnabled from the
  current SettingsPanel placement to the parent-gated route. Currently
  in SettingsPanel for dev-state access (parent route not yet built).

TODO(voice-input/follow-up): post-launch VAD threshold calibration
  Estimate ambient noise floor over the first ~1 s after first start()
  and adapt VAD_GAIN / VAD_THRESHOLD to device. Current defaults
  (VAD_GAIN=4, VAD_THRESHOLD=0.08) are tuned on a MacBook Air built-in
  mic; classroom mics and bone-conduction headsets will need
  per-device adjustment. Track real-user telemetry for tuning.

TODO(voice-input/follow-up): lift vadThreshold/vadSustainMs/vadGain to public API
  Once a consumer needs to override the internal VAD constants, promote
  them from internal constants to UseVoiceInputOptions. Currently
  exposed only via Storybook controls for visual tuning.
```

These will be filed as separate GitHub issues when this PR is opened. Each follow-up is small and game-specific; building them speculatively without a real consumer would violate the project's YAGNI bar.

---

## Deferred / Open Questions

### From 2026-05-10 ce-doc-review

- **Audio-graph state machine — full transition table.** The Audio plumbing section sketches the lifecycle (steps 1–6) but the formal parallel-region state machine (audio-graph × recognition × ambient) is deferred to the XState chart authoring phase. Specifically: precise transition rules between the analyser RAF/setInterval modes, the `cancel`/`stop` → ambient-armed re-arming behaviour, the `setting flips false` mid-session rebuild path, and the `tab visible after hidden` re-arm sequence. To be drawn as an XState chart in the implementation PR; the chart IS the spec at that point.

### Reviewer-deferred (none from this round beyond the above)

The 2026-05-10 review covered coherence, feasibility, product-lens, design-lens, security-lens, scope-guardian, and adversarial. All other surfaced findings were either applied in this revision or deliberately skipped (see PR description for the decision log).

### Cross-doc edits required (executed alongside this PR)

- `docs/prd.md` section 5.6 — remove "no complex waveform rendering required" guidance; align with the waveform design shipped here.
- `docs/prd.md` section 1 / C-07 — note that STT-using games are an acknowledged exception to the "Offline by default" principle.
- `docs/game-engine.md` 7.4 — same waveform realignment as PRD section 5.6.

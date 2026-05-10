# Voice Input Component — Design

**Date:** 2026-05-10
**Status:** Draft — pending review

**Related work:**

- `src/lib/speech/SpeechInput.ts` — existing thin wrapper around `SpeechRecognition` / `webkitSpeechRecognition`. Kept untouched; the new hook imports from it.
- `src/lib/speech/SpeechInput.demo.tsx` and `SpeechInput.mdx` — original Storybook demo. Replaced by the new component and removed in the implementation PR.
- `src/components/answer-game/useGameTTS.ts` — pattern reference for the hook shape and `i18n.language` integration.
- `/Users/leocaseiro/Sites/ipa-phonemes-recorder/ui/audio.js` — external reference for the AudioContext + AnalyserNode pattern.

---

## Problem

WordSpell, NumberMatch and other answer-style games currently accept input via typing or tile-dragging. Children using these games would benefit from a voice option: speak the answer instead of typing or dragging. The existing `SpeechInput.ts` is a low-level browser-API wrapper with a one-shot demo — there is no reusable React component, no live audio feedback, no per-word streaming, and no integration path for games.

This spec covers a Storybook-only component (no game integration yet) that any future game can drop in. Game-specific normalization (number-words to digits, homophone matching) is **out of scope** and tracked as follow-ups.

## Goals

- Reusable React component with mic button + live amplitude feedback that any answer-style game can adopt later.
- Press-to-talk with automatic end-of-speech detection. User can also cancel mid-utterance.
- Words queued as the user speaks; consumer receives the full array on turn end.
- Optional ambient voice activity detection (VAD) that nudges the user when they appear to be speaking without having pressed the button. Off-ramp via app settings.
- Works on desktop and modern mobile browsers; degrades gracefully where unsupported.

## Non-goals

- No number-word to digit conversion ("seven" → "7"). Tracked as follow-up.
- No homophone resolution ("for" / "four"). Tracked as follow-up.
- No game wiring. Storybook-only landing; games consume in later PRs.
- No `SpeechGrammarList` constraints (sparsely supported).
- No persistence of recognized words across page refresh — `onResult` callback fires once per turn and the consumer persists.

## Decisions captured during brainstorming

| Decision          | Choice                                                        | Rationale                                                                  |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Recognition mode  | Continuous + interim, final-only word queue                   | User can speak single or multiple words; queue lets consumer parse either. |
| End-of-speech     | Auto-stop on `onspeechend`, emit `onResult(words[])`          | Press-to-talk model with clear turn boundaries.                            |
| Cancel            | `recognition.abort()` discards pending interim, no `onResult` | Distinct from graceful stop.                                               |
| Waveform          | Real amplitude, mic open while listening                      | Honest visual feedback; AnalyserNode is shared with VAD.                   |
| VAD               | Opt-in via setting, only after first successful record        | Avoids surprising users with the persistent mic indicator.                 |
| VAD response      | Pulse the mic button when ambient speech detected             | User stays in control; no auto-arming.                                     |
| API shape         | Hook + presentational component                               | Mirrors `useGameTTS`; games can use either layer.                          |
| Language          | Default `i18n.language`, `lang` prop overrides                | Mirrors `useGameTTS` (`src/components/answer-game/useGameTTS.ts:28`).      |
| Setting key       | `voiceInputAmbientVADEnabled`, default `true`                 | Verbose, scoped, matches existing camelCase RxDB keys.                     |
| First-record gate | In-memory only, resets on tab close                           | Simple and matches user mental model.                                      |
| Visual style      | Minimal — round mic button, ring pulse, 8 vertical bars       | Selected from three mockups (see Visual Design section).                   |

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

- `SpeechInput.ts` (existing) remains the only place that touches `window.SpeechRecognition`. The hook imports `createSpeechRecognition` and `isSpeechInputAvailable`.
- `useVoiceInput` is the only place that touches `getUserMedia`, `AudioContext` and `AnalyserNode`. The component never sees raw audio — it reads `meterLevel` (0–1) and `interim` strings off the hook.
- The component is purely presentational. Games that want headless behaviour import `useVoiceInput` directly.
- Storybook title: `'Services/VoiceInput/VoiceInputButton'` (PascalCase per the project rule in `CLAUDE.md`).

### Settings

A new RxDB settings key:

```ts
voiceInputAmbientVADEnabled?: boolean   // default true
```

`SettingsPanel.tsx` gets a new toggle row reading and writing this key via `useSettings()`. The hook itself stays decoupled from RxDB — the component reads the setting and forwards `ambientVAD` as a prop.

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
  | { kind: 'audio-capture' }
  | { kind: 'network' }
  | { kind: 'aborted' }
  | { kind: 'not-allowed' }
  | { kind: 'unknown'; message: string };

type UseVoiceInputOptions = {
  lang?: string; // default: i18n.language
  ambientVAD?: boolean; // default: true
  vadThreshold?: number; // default: 0.08 (RMS, 0–1)
  vadSustainMs?: number; // default: 600
  onResult?: (words: string[]) => void;
  onAmbientSpeech?: () => void;
};

type UseVoiceInputReturn = {
  status: VoiceInputStatus;
  words: string[];
  interim: string;
  meterLevel: number; // 0–1
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
```

### Component

```ts
type VoiceInputButtonProps = {
  lang?: string;
  ambientVAD?: boolean; // default reads from settings via useSettings()
  showInterim?: boolean; // default true
  showMeter?: boolean; // default true
  size?: 'sm' | 'md' | 'lg'; // default 'md'
  className?: string;
  ariaLabel?: string; // default i18n
  onResult?: (words: string[]) => void;
  onAmbientSpeech?: () => void;
};

export const VoiceInputButton: React.FC<VoiceInputButtonProps>;
```

### Notes

- `start()` is async because permission grant + AudioContext resume are async.
- `stop()` calls `recognition.stop()` (graceful — pending finals emit). `cancel()` calls `recognition.abort()` and clears interim.
- `meterLevel` is normalized RMS, smoothed in the hook. Component never re-smooths.
- `error` is sticky until `reset()` or the next `start()`.

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

- The ambient machine pauses while recognition is non-idle. The same `getUserMedia` stream and `AudioContext` are reused — never two open mic streams.
- First-record gate is in-memory per session. Tab close resets it.
- `ambientHint` clears the moment `start()` is called, or after 3 s if the user does not engage.
- `no-speech` is reported as `error: { kind: 'no-speech' }` with `status: 'idle'`. It is not a hard error — the UI can render "Didn't catch that" and the user can retry.

---

## Word queue and end-of-speech

### Recognition config

```ts
recognition.lang = options.lang ?? i18n.language;
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 1;
```

### Final-only parsing

The hook tracks a cursor — the index of the next un-emitted final result. On every `onresult`:

1. Walk `results[cursor..end]`.
2. For each `isFinal` entry: split `alt[0].transcript` on `/\s+/`, trim, drop empties, push each token onto `words`. Advance the cursor.
3. Concatenate trimmed text of all remaining (non-final) entries into `interim` (overwrite, not append).

This means:

- Final words are pushed exactly once each, regardless of how Chrome batches them.
- Interim flickers are absorbed naturally — finals replace interim text.
- Punctuation: leading/trailing `.,!?` is stripped per token. Casing is preserved; the consumer normalizes.

### End-of-speech path

`onspeechend` fires when the engine detects sustained silence (browser-tuned, typically 1–2 s):

1. `status: 'listening' → 'processing'`.
2. Wait up to 600 ms for any trailing `onresult` flush.
3. Call `recognition.stop()`.
4. On `recognition.onend`: fire `onResult(words.slice())`, `status → 'idle'`.
5. If `words` is empty, **do not** fire `onResult`; set `error: { kind: 'no-speech' }` instead.

### Cancel path

`cancel()` calls `recognition.abort()`, clears `interim`, leaves `words` as-is, **does not** fire `onResult`. `status → 'idle'`.

### Stop path

`stop()` is the same as `onspeechend` but user-initiated. Fires `onResult` with whatever has been finalized.

---

## Audio plumbing

### Single shared graph

One `getUserMedia` stream, one `AudioContext`, one `AnalyserNode`. Used for both the live meter (during press-to-talk) and the ambient VAD monitor. The hook never opens the mic twice.

### Lifecycle

```text
1. First start() call:
     getUserMedia({ audio: true }) → MediaStream stored on a ref
     new AudioContext(), source = ctx.createMediaStreamSource(stream)
     analyser = ctx.createAnalyser(), fftSize=2048, smoothingTimeConstant=0.3
     source.connect(analyser)

2. recognition.start() (engine manages its own internal stream — fine, browsers share permission)

3. RAF loop reads analyser.getFloatTimeDomainData → computes RMS, peak
     → meterLevel = clamp01(rms * gain), exposed on hook
     → isSpeaking = meterLevel > vadThreshold sustained (vadSustainMs / 2)

4. After first successful onResult AND voiceInputAmbientVADEnabled:
     drop RAF loop to setInterval at 100 ms (10 Hz polling)
     same RMS computation
     if rms > vadThreshold for vadSustainMs → ambientHint = true

5. When recording starts again from ambient mode: switch back to RAF, keep stream open.

6. Component unmount OR setting flips false:
     cancelAnimationFrame / clearInterval
     stream.getTracks().forEach(t => t.stop())
     audioContext.close(), nullify refs
```

### Browser quirks

- iOS Safari: `AudioContext` must be created or resumed inside a user gesture. `start()` is always button-triggered, so this works.
- Mobile background tabs: browsers throttle / suspend `AudioContext` when backgrounded. The hook listens for `visibilitychange` and pauses / resumes the analyser loop accordingly.
- iOS Safari Web Speech API: works on iOS 14.5+ but requires a user gesture for every `recognition.start()`. Press-to-talk satisfies this; auto-arming on ambient detection would not — another reason ambient hints only pulse the button rather than auto-record.

---

## Visual design

Selected style: **Minimal — round mic button (56 px) + ring pulse + 8 vertical bars + interim text**. The other two proposals (prominent pill, compact icon) become future variants via the `size` prop.

### State visuals

| State                | Ring pulse                                    | Bars                                                                        | Interim                                     |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| Idle                 | none                                          | dimmed, soft idle breath                                                    | empty                                       |
| Listening + silent   | steady pulse 1.6 s loop                       | small idle breath (max ~25 %)                                               | "" or last interim fading                   |
| Listening + speaking | steady pulse, opacity scales with meter       | heights driven by `meterLevel` with per-bar `--gain` factor for wave-spread | live transcript                             |
| Processing           | pulse fades out                               | bars settle to idle                                                         | last interim freezes briefly                |
| Ambient hint         | yellow box-shadow ring pulses on the button   | none                                                                        | "Looks like you're talking — tap to record" |
| Denied               | mic icon greyed + slash overlay               | hidden                                                                      | inline error message                        |
| Unsupported          | component renders `null` (or `fallback` slot) | —                                                                           | —                                           |

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
  transform: scaleY(calc(0.18 + var(--meter) * var(--gain, 1)));
  transition: transform 60ms linear;
}
.meter[data-speaking='false'] span {
  animation: vi-idle-breath 2.4s ease-in-out infinite;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .meter span,
  .pulse-ring,
  .ambient-pulse {
    animation: none;
    transition: none;
  }
}
```

`meterLevel` writes throttled to ~30 fps in the hook to avoid React thrash. CSS `transition: transform 60ms linear` smooths the gap between writes.

---

## Error and permission UX

| Scenario                    | `status`      | `error.kind`    | Component renders                                                               | Recoverable?                  |
| --------------------------- | ------------- | --------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| API not in browser          | `unsupported` | —               | `null` (or `fallback` slot)                                                     | No                            |
| Settings disable VAD        | (any)         | —               | VAD machinery never runs; press-to-talk still works                             | n/a                           |
| First press, prompt shown   | `requesting`  | —               | mic dimmed, "Allow mic access…" tooltip; spinner replaces icon after 300 ms     | —                             |
| User clicks Block           | `denied`      | `not-allowed`   | greyed mic + slash + inline message; button retryable                           | After browser-settings change |
| Mic in use elsewhere        | `error`       | `audio-capture` | inline "Microphone in use by another app."                                      | Yes                           |
| Engine cannot reach service | `error`       | `network`       | inline "Couldn't reach the voice service. Check your connection and try again." | Yes                           |
| Silence the whole turn      | `idle`        | `no-speech`     | inline "Didn't catch that — try again."                                         | Yes                           |
| User cancels                | `idle`        | `aborted`       | no message; consumer can branch on `error`                                      | Yes                           |
| Anything else               | `error`       | `unknown`       | inline "Voice input failed. Try again."                                         | Yes                           |

### Notes

- Errors render **inline below the button** (same slot as interim transcript). Not a global toast.
- `aria-live="polite"` so screen readers announce errors without interrupting other speech.
- We always call `getUserMedia` **before** `recognition.start()` so the denied state is detected explicitly.
- `start()` always clears `error` first — pressing the button is unambiguous retry intent.
- `reset()` clears `error`, `words`, `interim` without starting recognition.

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

New namespace `voiceInput.json` per locale:

```json
{
  "label.tapToSpeak": "Tap to speak",
  "label.listening": "Listening…",
  "label.processing": "Processing…",
  "error.notAllowed": "Mic access blocked. Open browser settings to allow.",
  "error.audioCapture": "Microphone in use by another app.",
  "error.network": "Couldn't reach the voice service. Check your connection and try again.",
  "error.noSpeech": "Didn't catch that — try again.",
  "error.unknown": "Voice input failed. Try again.",
  "ambient.hint": "Looks like you're talking — tap to record.",
  "settings.ambientVadLabel": "Detect speech without pressing the mic",
  "settings.ambientVadHelp": "Pulses the mic button when you start talking. Requires mic permission."
}
```

---

## Storybook

Single Playground per `write-storybook` skill. Title: `'Services/VoiceInput/VoiceInputButton'`.

### Mock decorator

Real `SpeechRecognition` and `getUserMedia` cannot run reliably inside Storybook. The story registers a `VoiceInputContext.Provider` consumed by the hook only when `process.env.STORYBOOK === 'true'`. The decorator wires Storybook controls to mock state so every visual permutation is exercisable without browser permissions.

### Args and argTypes

```ts
type StoryArgs = VoiceInputButtonProps & {
  mockStatus: VoiceInputStatus;
  mockMeterLevel: number;
  mockIsSpeaking: boolean;
  mockInterim: string;
  mockAmbientHint: boolean;
  mockErrorKind: VoiceInputError['kind'] | 'none';
};

argTypes: {
  size:           { control: { type: 'radio' },  options: ['sm', 'md', 'lg'] },
  showInterim:    { control: 'boolean' },
  showMeter:      { control: 'boolean' },
  lang:           { control: { type: 'select' }, options: ['en-US', 'en-AU', 'en-GB', 'pt-BR'] },
  mockStatus:     { control: { type: 'select' }, options: ['idle','listening','processing','denied','error','unsupported'] },
  mockMeterLevel: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  mockIsSpeaking: { control: 'boolean' },
  mockInterim:    { control: 'text' },
  mockAmbientHint:{ control: 'boolean' },
  mockErrorKind:  { control: { type: 'select' }, options: ['none','no-speech','audio-capture','network','aborted','not-allowed','unknown'] },
  onResult:       { action: 'onResult' },
  onAmbientSpeech:{ action: 'onAmbientSpeech' },
}
```

No raw JSON controls (per `feedback_storybook_controls.md`).

### MDX page covers

1. What the component does and when to use it.
2. The `useVoiceInput` hook signature for headless consumers.
3. Browser-support matrix (the table above).
4. The `voiceInputAmbientVADEnabled` setting and where to find it.
5. Follow-up TODOs for game-side helpers (number-words, match-words, homophones).
6. Embedded Playground via `<Canvas of={...} />`.

### A11y

- Button: `aria-pressed={status === 'listening'}` so screen readers announce the toggle state.
- Button: `aria-label` from `ariaLabel` prop, defaults from i18n.
- Live region for interim transcript: `<div role="status" aria-live="polite">{interim}</div>`.
- Live region for errors: same slot, `aria-live="polite"`.
- Pulsing ring is `aria-hidden="true"` (decorative).
- `prefers-reduced-motion: reduce` disables the ring pulse and bar idle-breath; speaking-driven bar heights remain (informational, not decorative).
- a11y addon must pass with no violations.

---

## Testing strategy

### Hook unit tests (`useVoiceInput.test.ts`)

Covered with mocked `SpeechRecognition` and `AudioContext`:

- Final results are queued exactly once even when Chrome batches them.
- Interim results overwrite, do not append.
- `onspeechend` triggers stop after the 600 ms safety window.
- Empty turn yields `error: { kind: 'no-speech' }` and skips `onResult`.
- `cancel()` aborts and does not fire `onResult`.
- Permission denial yields `status: 'denied'`, `error: { kind: 'not-allowed' }`.
- First successful turn flips the ambient gate.
- Ambient threshold trigger fires `onAmbientSpeech` and sets `ambientHint`.
- `voiceInputAmbientVADEnabled = false` keeps the analyser closed when idle.
- `visibilitychange` pauses / resumes the analyser loop.

### Component unit tests (`VoiceInputButton.test.tsx`)

- Renders correct visual class set per `status`.
- Forwards `mockStatus` from the story decorator (verifies the test wiring itself works).
- Reads `voiceInputAmbientVADEnabled` from `useSettings()` and forwards to the hook.
- Renders inline error text matching `error.kind`.
- Reduced-motion media query disables animation classes.

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
  Locale-keyed homophone map (en-US, en-AU, pt-BR, ...).
  Used by match-words.ts when allowHomophones is true.
  e.g. { 'four': ['for', 'fore'], 'two': ['to', 'too'] }

TODO(voice-input/follow-up): useVoiceInput onWord callback
  Streaming per-word callback for incremental persistence.
  Add { onWord?: (word: string) => void } to UseVoiceInputOptions.

TODO(voice-input/follow-up): useVoiceInput persistKey option
  When set, mirror words queue to sessionStorage under the given key
  so refresh-mid-turn does not lose finalized words.
```

These will be filed as separate GitHub issues when this PR is opened. Each follow-up is small and game-specific; building them speculatively without a real consumer would violate the project's YAGNI bar.

---

## Open questions

None at the time of writing. Reviewers should flag anything ambiguous before the implementation plan is written.

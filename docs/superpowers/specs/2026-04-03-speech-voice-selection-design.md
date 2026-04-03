# Speech Voice Selection Design

**Date:** 2026-04-03

## Overview

Add voice selection to the `speak()` utility so users can choose which TTS voice is used. The selected voice is persisted in user settings. Daniel is the default voice.

## Architecture

Three areas of change, all small and self-contained:

1. **`src/lib/speech/voices.ts`** — new `getVoiceByName` helper
2. **`src/lib/speech/SpeechOutput.ts`** — optional `voiceName` parameter on `speak()`
3. **`src/routes/$locale/_app/settings.tsx`** — voice picker UI

No new files. No changes to the DB schema (`preferredVoiceURI` already exists in `SettingsDoc`).

## Components

### `getVoiceByName(name: string): SpeechSynthesisVoice | undefined`

Added to `voices.ts` alongside the existing `getVoicesForLanguage`. Calls `synth.getVoices()` and returns the first voice where `v.name === name`, or `undefined` if not found or `speechSynthesis` is unavailable.

### `speak(text: string, voiceName?: string): void`

Updated signature. When `voiceName` is provided, calls `getVoiceByName(voiceName)` and assigns the result to `utterance.voice`. If the named voice isn't found, `utterance.voice` is left unset (browser default). Default value for `voiceName` is `'Daniel'`.

### Settings voice picker

A new `<Select>` in `settings.tsx` below the existing language picker:

- Populated by calling `speechSynthesis.getVoices()` on mount (via `useState` + `useEffect`, triggered by the `voiceschanged` event for async loading)
- Pre-selects `settings.preferredVoiceURI ?? 'Daniel'`
- On change: `update({ preferredVoiceURI: selectedVoiceName })`
- Stores the voice **name** (not URI) in `preferredVoiceURI` — the field is reused as-is from the existing schema

## Data Flow

```
User picks voice in Settings
  → update({ preferredVoiceURI: voiceName })
  → saved to RxDB

Component calls speak(text, settings.preferredVoiceURI ?? 'Daniel')
  → getVoiceByName(voiceName)
  → utterance.voice = resolvedVoice ?? null
  → synth.speak(utterance)
```

## Error Handling

- `speechSynthesis` unavailable: `speak()` returns early (existing behaviour), voice picker is hidden or disabled
- Named voice not found: `utterance.voice` left unset, browser picks default — no error thrown
- Empty voices list (e.g. voices not yet loaded): picker shows a loading state or is disabled

## Testing

- **`voices.test.ts`** (new): unit tests for `getVoiceByName` — found, not found, unavailable `speechSynthesis`
- **`SpeechOutput.test.ts`** (updated): verify `utterance.voice` is set when `voiceName` is provided; verify default falls back to `'Daniel'`; verify graceful fallback when voice not found
- Settings UI: no new tests — `useSettings` is already tested; the voice picker is a straightforward controlled `<Select>`

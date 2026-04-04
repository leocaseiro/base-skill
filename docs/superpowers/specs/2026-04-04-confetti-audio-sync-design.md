# Confetti / Audio Sync Design

**Date:** 2026-04-04  
**Branch:** `feat-word-spell-number-match`  
**Status:** Approved

## Problem

When a round completes, `phase` transitions to `'round-complete'` and two things happen simultaneously:

1. `queueSound('round-complete')` is called — queues `round-complete.mp3` behind the already-playing `correct.mp3`
2. `ScoreAnimation` receives `visible={true}` — fires confetti immediately

Confetti fires before `correct.mp3` has finished, and well before `round-complete.mp3` starts. The desired timing is: confetti and `round-complete.mp3` fire together, after `correct.mp3` ends.

## Approach

**Approach A** — `queueSound` returns a "starts" promise; `useGameSounds` exposes `confettiReady`.

`queueSound` snapshots `queueTail` before appending the new sound. That snapshot resolves exactly when the queued sound starts. `useGameSounds` awaits this promise and sets `confettiReady = true` when it resolves. Game components pass `confettiReady` to `ScoreAnimation` instead of `phase === 'round-complete'`. `ScoreAnimation` is unchanged.

## Changes

### 1. `AudioFeedback.ts`

`queueSound` returns `Promise<void>` that resolves when the queued sound **starts** (not ends).

```ts
export function queueSound(key: SoundKey, volume = 0.8): Promise<void> {
  const startsAt = queueTail;
  queueTail = startsAt.then(() => playSoundInternal(key, volume));
  return startsAt;
}
```

- `whenSoundEnds()` is unchanged.
- All callers that ignore the return value are unaffected.

### 2. `useGameSounds.ts`

Returns `{ confettiReady: boolean }` instead of `void`.

- On `phase === 'round-complete'`: calls `queueSound('round-complete')`, awaits the returned "starts" promise, then sets `confettiReady = true`.
- On any other phase: resets `confettiReady = false`.
- `game-over` path is unchanged (still calls `queueSound('game-complete')`, ignores the return).

### 3. Game components (NumberMatch, WordSpell, SortNumbers)

Each component already calls `useGameSounds()`. They destructure `confettiReady` from the return value and pass it to `ScoreAnimation`:

```tsx
const { confettiReady } = useGameSounds();
// ...
<ScoreAnimation visible={confettiReady} />;
```

### 4. `ScoreAnimation.tsx`

No changes. The component fires confetti when `visible` flips `false → true`, regardless of what controls that prop.

## Tests

### `useGameSounds.test.tsx` — new cases

1. `confettiReady` is `false` initially and before the "starts" promise resolves.
2. `confettiReady` becomes `true` after the "starts" promise resolves.
3. `confettiReady` resets to `false` when phase leaves `round-complete`.

The existing mock `queueSound: vi.fn()` must return `Promise.resolve()` by default (currently returns `undefined`). One-line fix in the mock setup.

### `ScoreAnimation.test.tsx`

No changes — the `visible` bool contract is unchanged.

### `AudioFeedback.ts`

No dedicated unit tests today. The new return value is covered via the `useGameSounds` mock. No new test file needed.

## Out of Scope

- `game-over` confetti or overlay timing (not reported as broken).
- Changes to `ScoreAnimation` internals.
- Any new animation or visual design for the round-complete transition.

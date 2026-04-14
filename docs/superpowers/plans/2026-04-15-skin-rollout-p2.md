# Skin Rollout P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship end-to-end skin integration for WordSpell and NumberMatch, fix Plan 1's two deferred limitations (partial token consumption, `onGameOver` retry count), and unify the classic skin with custom skins through a single token-driven code path.

**Architecture:** Replace `skeuoStyle` with a `tileStyle(skin)` helper that reads `--skin-tile-*` tokens. Drop the `isCustomSkin` branch in `Slot` so state colors (correct, wrong, preview) flow through tokens too. Add new shared tokens to `classicSkin.tokens` for bank holes, hover previews, question prompts, and sentence gaps. Extend `GameEndEvent` with `retryCount` and move emission from `session-recorder` (which lacks access to game state) into each game component where the retry counter lives. Mirror the SortNumbers skin-wiring pattern in WordSpell and NumberMatch, each gaining its own `*.skin.stories.tsx` harness.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, Storybook 10, Tailwind 4. Follow existing patterns: named exports only (no `export default`), React components as `const` arrow functions, utility/hook functions as `function` declarations.

**Spec:** `docs/superpowers/specs/2026-04-15-skin-rollout-p2-design.md`

**Branch:** `feat/skin-rollout-p2` (already created off `origin/master`).

---

## Phase A — Foundation: Event payload + tokens

### Task 1: Extend `GameEndEvent` with `retryCount`

**Files:**

- Modify: `src/types/game-events.ts`

- [ ] **Step 1: Add the field**

Edit `src/types/game-events.ts`, update `GameEndEvent`:

```ts
export interface GameEndEvent extends BaseGameEvent {
  type: 'game:end';
  finalScore: number;
  totalRounds: number;
  correctCount: number;
  durationMs: number;
  /** Number of retries the player used before finishing. */
  retryCount: number;
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: fails in `src/lib/game-engine/session-recorder.ts` (missing `retryCount`) and possibly `SkinHarness.tsx`. These are fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/game-events.ts
git commit -m "feat(skin): add retryCount to GameEndEvent"
```

---

### Task 2: Forward `retryCount` in `useGameSkin`

**Files:**

- Modify: `src/lib/skin/useGameSkin.ts`
- Modify: `src/lib/skin/useGameSkin.test.tsx`

- [ ] **Step 1: Update the subscription**

In `src/lib/skin/useGameSkin.ts`, replace:

```ts
bus.subscribe('game:end', (event) => {
  if (event.type !== 'game:end') return;
  if (event.gameId !== gameId) return;
  skin.onGameOver?.(0); // retryCount not yet wired through event
}),
```

with:

```ts
bus.subscribe('game:end', (event) => {
  if (event.type !== 'game:end') return;
  if (event.gameId !== gameId) return;
  skin.onGameOver?.(event.retryCount);
}),
```

- [ ] **Step 2: Add a test case**

In `src/lib/skin/useGameSkin.test.tsx`, find the existing `onGameOver` test (or add one if missing) and assert the forwarded count:

```ts
it('forwards retryCount from GameEndEvent to skin.onGameOver', () => {
  const onGameOver = vi.fn();
  const skin: GameSkin = {
    id: 'retry-test',
    name: 'Retry Test',
    tokens: {},
    onGameOver,
  };
  registerSkin('sort-numbers', skin);

  renderHook(() => useGameSkin('sort-numbers', 'retry-test'));

  getGameEventBus().emit({
    type: 'game:end',
    gameId: 'sort-numbers',
    sessionId: 's',
    profileId: 'p',
    timestamp: Date.now(),
    roundIndex: 0,
    finalScore: 0,
    totalRounds: 1,
    correctCount: 1,
    durationMs: 100,
    retryCount: 3,
  });

  expect(onGameOver).toHaveBeenCalledWith(3);
});
```

- [ ] **Step 3: Run the test**

Run: `yarn test src/lib/skin/useGameSkin.test.tsx`
Expected: pass.

- [ ] **Step 4: Fix `SkinHarness.tsx`**

The `onGameOver` button in `src/lib/skin/SkinHarness.tsx` emits a `game:end` event without `retryCount`. Add it (use any value, e.g. `retryCount: 0`, since this is a manual testing harness):

```ts
onClick={() =>
  emit('game:end', {
    finalScore: 0,
    totalRounds: 1,
    correctCount: 1,
    durationMs: 100,
    retryCount: 0,
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/skin/useGameSkin.ts src/lib/skin/useGameSkin.test.tsx src/lib/skin/SkinHarness.tsx
git commit -m "feat(skin): forward GameEndEvent.retryCount to skin.onGameOver"
```

---

### Task 3: Move `game:end` emission out of session-recorder into game components

**Background:** `session-recorder.ts` emits `game:end` but has no access to `retryCount` (it lives in `AnswerGame` reducer state, one provider deeper). The emission currently uses placeholder data (`finalScore: 0, correctCount: 0`) anyway. Moving emission into the game components (inside `AnswerGame` provider) gives us real retry count plus real score/correct data if we wire them in follow-ups.

**Files:**

- Modify: `src/lib/game-engine/session-recorder.ts`
- Modify: `src/lib/game-engine/session-recorder.test.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Remove the emission from session-recorder**

In `src/lib/game-engine/session-recorder.ts`, inside the `useEffect` that runs when `phase === 'game-over'`, delete the entire block that creates `endEvent` and calls `bus.emit(endEvent)`. Keep the DB `incrementalPatch` logic. Also remove now-unused imports (`GameEndEvent`, `getGameEventBus`).

- [ ] **Step 2: Update session-recorder tests**

In `src/lib/game-engine/session-recorder.test.tsx`, any test that asserted `game:end` was emitted by the recorder must be removed or converted to assert the emission no longer happens. Run `yarn test src/lib/game-engine/session-recorder.test.tsx` and fix failures by removing the stale assertions (not by re-adding the emission).

- [ ] **Step 3: Emit `game:end` from SortNumbers**

In `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`, inside `SortNumbersSession`, add a new effect that fires exactly once when `phase === 'game-over'`:

```ts
useEffect(() => {
  if (phase !== 'game-over') return;
  getGameEventBus().emit({
    type: 'game:end',
    gameId: sortNumbersConfig.gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex,
    finalScore: 0,
    totalRounds: roundOrder.length,
    correctCount: 0,
    durationMs: 0,
    retryCount,
  });
}, [
  phase,
  sortNumbersConfig.gameId,
  roundIndex,
  roundOrder.length,
  retryCount,
]);
```

Ensure `retryCount` is destructured from `useAnswerGameContext()` at the top of `SortNumbersSession` — it already is on master.

- [ ] **Step 4: Run full test suite**

Run: `yarn test`
Expected: all pass. If session-recorder tests still fail, they're asserting the old emission path — delete those assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/session-recorder.ts src/lib/game-engine/session-recorder.test.tsx src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "refactor(skin): emit game:end from game components so retryCount is available"
```

---

### Task 4: Add new shared tokens to `classicSkin`

**Files:**

- Modify: `src/lib/skin/classic-skin.ts`

- [ ] **Step 1: Extend the tokens object**

Edit `src/lib/skin/classic-skin.ts`. Replace the `tokens` object with:

```ts
tokens: {
  // ── Tile tokens (existing) ─────────────────────────────────────
  '--skin-tile-bg': 'var(--bs-primary)',
  '--skin-tile-text': 'var(--bs-surface)',
  '--skin-tile-radius': '0.75rem',
  '--skin-tile-border': 'transparent',
  '--skin-tile-shadow': '0 2px 4px rgb(0 0 0 / 10%)',
  '--skin-tile-font-weight': '700',

  // ── Tile surface / skeuo tokens (new — replaces --skeuo-* / --card) ──
  '--skin-tile-surface': 'var(--card, #FAFAFA)',
  '--skin-tile-highlight': 'rgba(255,255,255,1)',
  '--skin-tile-ring': 'rgba(0,0,0,0.08)',
  '--skin-tile-inset-bottom': 'rgba(0,0,0,0.08)',
  '--skin-tile-inset-top': 'rgba(255,255,255,0.5)',
  '--skin-tile-text-shadow': 'rgba(0,0,0,0.12)',
  '--skin-tile-active-scale': '0.95',

  // ── Slot tokens (existing) ─────────────────────────────────────
  '--skin-slot-bg': 'var(--bs-surface)',
  '--skin-slot-border': 'var(--bs-accent)',
  '--skin-slot-radius': '0.75rem',
  '--skin-slot-active-border': 'var(--bs-primary)',

  // ── State tokens (new — replaces Tailwind state classes) ───────
  '--skin-correct-bg': 'rgb(from var(--primary) r g b / 0.1)',
  '--skin-correct-border': 'var(--bs-primary)',
  '--skin-wrong-bg': 'rgb(from var(--destructive) r g b / 0.1)',
  '--skin-wrong-border': 'var(--destructive)',

  // ── Bank-hole tokens (new) ─────────────────────────────────────
  '--skin-bank-hole-bg': 'rgb(from var(--muted) r g b / 0.6)',
  '--skin-bank-hole-shadow': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // ── Hover-preview tokens (new) ─────────────────────────────────
  '--skin-hover-border-color': 'var(--bs-primary)',
  '--skin-hover-border-style': 'dashed',

  // ── Feedback animations (existing) ─────────────────────────────
  '--skin-correct-color': 'var(--bs-success)',
  '--skin-wrong-color': 'var(--bs-error)',
  '--skin-correct-animation': 'pop 250ms ease-out',
  '--skin-wrong-animation': 'shake 300ms ease-in-out',

  // ── Scene / bank container tokens (existing) ───────────────────
  '--skin-scene-bg': 'transparent',
  '--skin-bank-bg': 'transparent',
  '--skin-bank-border': 'transparent',

  // ── Celebration tokens (existing) ──────────────────────────────
  '--skin-celebration-emoji': "'🐨'",

  // ── Question component tokens (new) ────────────────────────────
  '--skin-question-bg': 'transparent',
  '--skin-question-text': 'inherit',
  '--skin-question-radius': '0.75rem',
  '--skin-question-audio-bg': 'var(--bs-primary)',
  '--skin-question-audio-fg': 'var(--bs-primary-foreground)',
  '--skin-question-dot-bg': 'var(--bs-muted)',
  '--skin-question-dot-assigned-bg': 'var(--bs-primary)',

  // ── Sentence-with-gaps tokens (new) ────────────────────────────
  '--skin-sentence-gap-border': 'currentColor',
  '--skin-sentence-gap-style': 'dashed',
},
```

- [ ] **Step 2: Typecheck + test**

Run: `yarn typecheck && yarn test src/lib/skin`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/classic-skin.ts
git commit -m "feat(skin): add bank-hole, hover, state, question, sentence tokens to classicSkin"
```

---

## Phase B — Core component refactor

### Task 5: Replace `skeuoStyle` with `tileStyle(skin)`

**Files:**

- Modify: `src/components/answer-game/styles.ts`
- Create: `src/components/answer-game/styles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/answer-game/styles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tileStyle } from './styles';

describe('tileStyle', () => {
  it('returns a style object that references --skin-tile-* tokens', () => {
    const style = tileStyle();
    expect(style.background).toContain('var(--skin-tile-surface');
    expect(style.background).toContain('var(--skin-tile-highlight');
    expect(style.boxShadow).toContain('var(--skin-tile-ring');
    expect(style.boxShadow).toContain('var(--skin-tile-inset-bottom');
    expect(style.boxShadow).toContain('var(--skin-tile-inset-top');
    expect(style.textShadow).toContain('var(--skin-tile-text-shadow');
  });
});
```

- [ ] **Step 2: Run — should fail (tileStyle not exported yet)**

Run: `yarn test src/components/answer-game/styles.test.ts`
Expected: fail.

- [ ] **Step 3: Replace `skeuoStyle` with `tileStyle`**

Edit `src/components/answer-game/styles.ts` fully:

```ts
import type { CSSProperties } from 'react';

/**
 * Skeuomorphic tile button style, token-driven. Reads --skin-tile-* custom
 * properties set by the game's wrapper div. Classic skin keeps today's look;
 * custom skins override the tokens to re-theme tiles.
 */
export function tileStyle(): CSSProperties {
  return {
    background:
      'linear-gradient(180deg, transparent 70.48%, var(--skin-tile-highlight, rgba(255,255,255,1)) 93.62%, transparent 100%), var(--skin-tile-surface, #FAFAFA)',
    boxShadow:
      'var(--skin-tile-ring, rgba(0,0,0,0.08)) 0 0 0 1px, var(--skin-tile-inset-bottom, rgba(0,0,0,0.08)) 0 -2px 1px 0 inset, var(--skin-tile-inset-top, rgba(255,255,255,0.5)) 0 2px 1px 0 inset, 0 2px 5px -1px rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.3)',
    textShadow:
      '0px 1px 1px var(--skin-tile-text-shadow, rgba(0,0,0,0.12))',
  };
}
```

Note: removed the `skeuoStyle` export. Callers must be updated in the next steps.

- [ ] **Step 4: Update all 4 call sites**

For each of the following files, replace `import { skeuoStyle } from '...styles'` with `import { tileStyle } from '...styles'` and replace each `style={skeuoStyle}` with `style={tileStyle()}`; where `skeuoStyle` is spread (`...skeuoStyle`), replace with `...tileStyle()`:

- `src/components/answer-game/Slot/Slot.tsx` (line 1 import, line 174 usage)
- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` (line 2 import, line 116 usage)
- `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` (line 3 import, lines 28 + 37 usage in the `isCustomSkin` branch)
- `src/games/word-spell/LetterTileBank/LetterTileBank.tsx` (line 2 import, line 23 usage)

For `SortNumbersTileBank.tsx` specifically, the `isCustomSkin` branch also spreads `--skin-tile-bg`, `--skin-tile-text`, etc. overrides — keep those overrides, they still make sense since they control tile color independently of the skeuo layer. Just change the base from `...skeuoStyle` to `...tileStyle()`.

- [ ] **Step 5: Run typecheck + tests**

Run: `yarn typecheck && yarn test src/components/answer-game/styles.test.ts`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/styles.ts src/components/answer-game/styles.test.ts src/components/answer-game/Slot/Slot.tsx src/games/number-match/NumeralTileBank/NumeralTileBank.tsx src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx src/games/word-spell/LetterTileBank/LetterTileBank.tsx
git commit -m "refactor(skin): replace skeuoStyle with token-driven tileStyle helper"
```

---

### Task 6: Unify `Slot` state styling on tokens

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.tsx`

**Goal:** remove the `isCustomSkin` branch so classic and custom skins share one token-driven code path. State colors (correct, wrong, preview) become token overrides rather than Tailwind classes that can't be themed.

- [ ] **Step 1: Refactor the style resolution**

In `src/components/answer-game/Slot/Slot.tsx`, replace the block starting at `const isCustomSkin = skin && skin.id !== 'classic';` down through `const finalStyle: ... ;` with:

```ts
// Token-driven slot styling. Base colors come from --skin-slot-*.
// State overrides (wrong, preview) come from --skin-wrong-*,
// --skin-hover-border-*. Classic skin's tokens match the pre-refactor
// Tailwind defaults, so the visual is preserved.
const baseStyle: React.CSSProperties = {
  background: 'var(--skin-slot-bg)',
  borderColor: 'var(--skin-slot-border)',
  borderRadius: 'var(--skin-slot-radius)',
};

const wrongStyle: React.CSSProperties = isWrong
  ? {
      background: 'var(--skin-wrong-bg)',
      borderColor: 'var(--skin-wrong-border)',
      color: 'var(--skin-wrong-color)',
    }
  : {};

const previewStyle: React.CSSProperties = isPreview
  ? {
      borderColor: 'var(--skin-hover-border-color)',
      borderStyle:
        'var(--skin-hover-border-style)' as React.CSSProperties['borderStyle'],
      animation: 'pulse-ring 1.5s ease-in-out infinite',
    }
  : {};

const correctStyle: React.CSSProperties =
  !isEmpty && !isWrong && !isPreview
    ? {
        background: 'var(--skin-correct-bg)',
        borderColor: 'var(--skin-correct-border)',
        color: 'var(--skin-correct-border)',
      }
    : {};

const finalStyle: React.CSSProperties = {
  ...baseStyle,
  ...correctStyle,
  ...wrongStyle,
  ...previewStyle,
};
```

Then update `stateClasses` to remove the color classes that are now token-driven. Keep the structural classes (`relative flex items-center justify-center border-2 transition-all overflow-hidden`). Drop:

- `border-dashed border-primary` (replaced by `previewStyle`)
- `border-border`
- `border-destructive bg-destructive/10 text-destructive`
- `border-primary bg-primary/10 text-primary`

Keep the focus-ring logic (`showCursor` with `ring-*`) as Tailwind classes — those are focus-visible states that don't need skin overrides in Plan 2.

- [ ] **Step 2: Remove the `skin` prop's role in the style decision**

The `skin` prop is still used for `slotDecoration`. The style no longer branches on `skin.id`; every skin (including classic) resolves via the tokens on the wrapper div.

- [ ] **Step 3: Run tests**

Run: `yarn test src/components/answer-game`
Expected: pass. If any test snapshots HTML class strings that included `border-primary bg-primary/10`, those snapshots must be updated (the state now comes from inline style, not classes).

- [ ] **Step 4: Run Storybook tests**

Run: `yarn storybook` in one terminal, then `yarn test:storybook` in another. Or use `START_STORYBOOK=1 SKIP_UNIT=1 SKIP_VR=1 SKIP_E2E=1 git push --dry-run` to dry-run the hook. Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx
git commit -m "refactor(skin): unify Slot state styling on CSS tokens (removes isCustomSkin branch)"
```

---

### Task 7: Tile-bank hole + hover tokens

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.tsx`
- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`
- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`

**Goal:** move the hardcoded `bg-muted/60 shadow-inner` bank hole and `border-2 border-dashed border-primary` hover preview to tokens.

- [ ] **Step 1: Update Slot bank-hole markup**

In `Slot.tsx`, the hole div that currently renders `<div className="absolute inset-0 bg-muted/60 shadow-inner" aria-hidden="true" />` becomes:

```tsx
<div
  className="absolute inset-0"
  style={{
    background: 'var(--skin-bank-hole-bg)',
    boxShadow: 'var(--skin-bank-hole-shadow)',
    borderRadius: 'inherit',
  }}
  aria-hidden="true"
/>
```

- [ ] **Step 2: Update `LetterTileBank` bank holes**

In `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`, the two `<div>` elements that render `bg-muted/60 shadow-inner` (the "inBank" hole and the standalone hole) both become:

```tsx
<div
  /* ...existing refs/data attrs/aria-hidden... */
  className="size-14 rounded-xl"
  style={{
    background: 'var(--skin-bank-hole-bg)',
    boxShadow: 'var(--skin-bank-hole-shadow)',
  }}
/>
```

For the hover-target variants that add `border-2 border-dashed border-primary`, drop those classes and add:

```ts
style={{
  background: 'var(--skin-bank-hole-bg)',
  boxShadow: 'var(--skin-bank-hole-shadow)',
  border: '2px var(--skin-hover-border-style) var(--skin-hover-border-color)',
}}
```

(Only when `isHoverTarget`.)

- [ ] **Step 3: Update `NumeralTileBank` and `SortNumbersTileBank`**

Both files have analogous bank-hole and hover-preview markup. Apply the same token substitutions: replace any `bg-muted/60 shadow-inner` with the `--skin-bank-hole-*` style; replace any `border-2 border-dashed border-primary` with the `--skin-hover-border-*` style. Grep each file for those exact class strings to locate every site.

Run: `grep -n "bg-muted/60\|border-dashed border-primary" src/games/*/**/*.tsx`
Expected after edits: no matches.

- [ ] **Step 4: Typecheck + test**

Run: `yarn typecheck && yarn test`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx src/games/word-spell/LetterTileBank/LetterTileBank.tsx src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
git commit -m "refactor(skin): move bank-hole and hover-preview styling to CSS tokens"
```

---

### Task 8: `SentenceWithGaps` gap underline tokens

**Files:**

- Modify: `src/components/answer-game/Slot/SentenceWithGaps.tsx`

- [ ] **Step 1: Replace hardcoded underline classes with tokens**

Change the gap `<Slot>` className from `mx-1 inline-flex min-w-16 items-center justify-center border-b-2 border-dashed px-2 align-baseline` to `mx-1 inline-flex min-w-16 items-center justify-center border-b-2 px-2 align-baseline` and add inline style:

```tsx
<Slot
  /* ...existing props... */
  className="mx-1 inline-flex min-w-16 items-center justify-center border-b-2 px-2 align-baseline"
>
```

Wait — `Slot` accepts `className` but not a per-instance style. Check `SlotProps`: only `className` and `children`. So we can't inject style via `Slot`. Instead: wrap the `Slot` in a span that sets CSS variables, OR extend `Slot` with a `style` prop. Prefer extending `Slot` with an optional `style?: CSSProperties` prop (forward it onto the inner element alongside `finalStyle`).

So Task 8 has a dependency: add `style?: CSSProperties` to `SlotProps` first.

- [ ] **Step 2: Add `style` prop to `Slot`**

In `src/components/answer-game/Slot/Slot.tsx`, extend the interface:

```ts
interface SlotProps {
  // ...existing fields...
  style?: React.CSSProperties;
}
```

Destructure it: `const { index, as: Tag = 'li', className, children, renderPreview, skin, style } = props;` and merge it into `finalStyle`:

```ts
const finalStyle: React.CSSProperties = {
  ...baseStyle,
  ...correctStyle,
  ...wrongStyle,
  ...previewStyle,
  ...style,
};
```

- [ ] **Step 3: Use it in `SentenceWithGaps`**

In `src/components/answer-game/Slot/SentenceWithGaps.tsx`:

```tsx
<Slot
  key={`gap-${String(seg.index)}`}
  index={seg.index}
  as="span"
  className="mx-1 inline-flex min-w-16 items-center justify-center border-b-2 px-2 align-baseline"
  style={{
    borderBottomColor: 'var(--skin-sentence-gap-border)',
    borderBottomStyle: 'var(--skin-sentence-gap-style)' as React.CSSProperties['borderBottomStyle'],
  }}
>
```

- [ ] **Step 4: Run tests**

Run: `yarn typecheck && yarn test`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx src/components/answer-game/Slot/SentenceWithGaps.tsx
git commit -m "refactor(skin): drive SentenceWithGaps gap underline from tokens"
```

---

## Phase C — Question component tokens

### Task 9: Token-drive `AudioButton`

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`

- [ ] **Step 1: Replace hardcoded styles with tokens**

Replace the button className and add inline style:

```tsx
<button
  type="button"
  aria-label="Hear the question"
  className="flex size-14 items-center justify-center rounded-full shadow-md active:scale-95"
  style={{
    background: 'var(--skin-question-audio-bg)',
    color: 'var(--skin-question-audio-fg)',
  }}
  onClick={() => speakPrompt(prompt)}
>
```

Removes `bg-primary text-primary-foreground`.

- [ ] **Step 2: Commit**

```bash
git add src/components/questions/AudioButton/AudioButton.tsx
git commit -m "refactor(skin): drive AudioButton background/fg from tokens"
```

---

### Task 10: Token-drive `TextQuestion`, `EmojiQuestion`, `ImageQuestion`

**Files:**

- Modify: `src/components/questions/TextQuestion/TextQuestion.tsx`
- Modify: `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`
- Modify: `src/components/questions/ImageQuestion/ImageQuestion.tsx`

- [ ] **Step 1: `TextQuestion`**

Replace the button with:

```tsx
<button
  type="button"
  aria-label={`${text} — tap to hear`}
  className="px-6 py-3 text-4xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
  style={{
    background: 'var(--skin-question-bg)',
    color: 'var(--skin-question-text)',
    borderRadius: 'var(--skin-question-radius)',
  }}
  onClick={() => speakPrompt(text)}
>
  {text}
</button>
```

- [ ] **Step 2: `EmojiQuestion`**

Replace the button with:

```tsx
<button
  type="button"
  aria-label={`${prompt} — tap to hear`}
  className="p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
  style={{
    background: 'var(--skin-question-bg)',
    color: 'var(--skin-question-text)',
    borderRadius: 'var(--skin-question-radius)',
  }}
  onClick={() => speakPrompt(prompt)}
>
```

Keep the inner `<span>` emoji markup unchanged.

- [ ] **Step 3: `ImageQuestion`**

Replace the button with:

```tsx
<button
  type="button"
  aria-label={`${prompt} — tap to hear`}
  className="focus-visible:outline-2 focus-visible:outline-offset-2"
  style={{
    background: 'var(--skin-question-bg)',
    color: 'var(--skin-question-text)',
    borderRadius: 'var(--skin-question-radius)',
    overflow: 'hidden',
  }}
  onClick={() => speakPrompt(prompt)}
>
  <img
    src={src}
    alt={prompt}
    className="size-40 object-contain"
    style={{ borderRadius: 'var(--skin-question-radius)' }}
  />
</button>
```

- [ ] **Step 4: Typecheck + tests**

Run: `yarn typecheck && yarn test src/components/questions`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/questions/TextQuestion src/components/questions/EmojiQuestion src/components/questions/ImageQuestion
git commit -m "refactor(skin): drive Text/Emoji/Image question prompts from tokens"
```

---

### Task 11: Token-drive `DotGroupQuestion`

**Files:**

- Modify: `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`

- [ ] **Step 1: Read the current dot styling**

Open the file, identify the dot `<button>` or `<div>` that currently uses Tailwind classes like `bg-muted` or `bg-primary` to indicate assigned vs unassigned dots.

- [ ] **Step 2: Replace dot classes with tokens**

For the unassigned dot markup, replace any `bg-muted` with `style={{ background: 'var(--skin-question-dot-bg)' }}`. For the assigned dot, replace `bg-primary` with `style={{ background: 'var(--skin-question-dot-assigned-bg)' }}`.

If the current component uses conditional class names, convert to conditional inline style. Keep size/shape classes (`rounded-full size-*`) as Tailwind.

- [ ] **Step 3: Typecheck + test**

Run: `yarn typecheck && yarn test src/components/questions/DotGroupQuestion`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx
git commit -m "refactor(skin): drive DotGroupQuestion dot colors from tokens"
```

---

## Phase D — WordSpell integration

### Task 12: Wire `useGameSkin` into WordSpell

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

**Reference:** `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` lines 263 (`useGameSkin` call), 332–338 (wrapper div), 218–246 (render slot overrides). Mirror the same pattern.

- [ ] **Step 1: Import skin APIs**

Add to the top of `WordSpell.tsx`:

```ts
import type { GameSkin } from '@/lib/skin';
import { useGameSkin } from '@/lib/skin';
import { getGameEventBus } from '@/lib/game-event-bus';
```

- [ ] **Step 2: Resolve skin in the outer `WordSpell` component**

At the top of the outer `WordSpell` component (the one that mounts `AnswerGame`), call:

```ts
const skin = useGameSkin('word-spell', config.skin);
```

- [ ] **Step 3: Wrap the root render with tokens + SceneBackground**

Replace the outer JSX that currently renders `<AnswerGame config={answerGameConfig}>...</AnswerGame>` with:

```tsx
<div
  className={`game-container skin-${skin.id}`}
  style={skin.tokens as React.CSSProperties}
>
  {skin.SceneBackground ? <skin.SceneBackground /> : null}
  <AnswerGame config={answerGameConfig}>
    <WordSpellSession
      wordSpellConfig={config}
      /* ...existing props... */
      skin={skin}
    />
  </AnswerGame>
</div>
```

- [ ] **Step 4: Thread skin into `WordSpellSession`**

Add `skin: GameSkin` to `WordSpellSession`'s props interface. Inside, destructure it. Pass it to every `<Slot>` (mirroring SortNumbers). Replace the existing `ScoreAnimation` / `GameOverOverlay` / any `LevelCompleteOverlay` with the skin render slots:

```tsx
{
  skin.RoundCompleteEffect ? (
    <skin.RoundCompleteEffect visible={confettiReady} />
  ) : (
    <ScoreAnimation visible={confettiReady} />
  );
}

{
  gameOverReady ? (
    skin.CelebrationOverlay ? (
      <skin.CelebrationOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    ) : (
      <GameOverOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    )
  ) : null;
}
```

If WordSpell doesn't currently render a `LevelCompleteOverlay`, only add the skin slot if the existing code renders one; otherwise skip the overlay block.

- [ ] **Step 5: Emit `game:end` with retryCount**

Add the same effect Task 3 added to SortNumbers, adapted for WordSpell:

```ts
useEffect(() => {
  if (phase !== 'game-over') return;
  getGameEventBus().emit({
    type: 'game:end',
    gameId: wordSpellConfig.gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex,
    finalScore: 0,
    totalRounds: roundOrder.length,
    correctCount: 0,
    durationMs: 0,
    retryCount,
  });
}, [
  phase,
  wordSpellConfig.gameId,
  roundIndex,
  roundOrder.length,
  retryCount,
]);
```

Ensure `retryCount` is pulled from `useAnswerGameContext()`.

- [ ] **Step 6: Typecheck + test**

Run: `yarn typecheck && yarn test src/games/word-spell`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat(word-spell): integrate skin system (useGameSkin, wrapper, render slots)"
```

---

### Task 13: `WordSpell.skin.stories.tsx` with demo skin

**Files:**

- Create: `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx`

**Reference:** `src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx` — mirror structure.

- [ ] **Step 1: Create the story file**

```tsx
import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness, registerSkin } from '@/lib/skin';

/**
 * Demo skin to prove the harness wires callbacks and tokens end-to-end.
 */
const demoSkin: GameSkin = {
  id: 'demo',
  name: 'Demo Pink',
  tokens: {
    '--skin-tile-bg': '#ec4899',
    '--skin-tile-text': '#fff',
    '--skin-tile-radius': '50%',
    '--skin-slot-bg': '#fdf2f8',
    '--skin-slot-border': '#f472b6',
    '--skin-slot-radius': '50%',
    '--skin-sentence-gap-border': '#ec4899',
    '--skin-question-audio-bg': '#ec4899',
  },
  onCorrectPlace: (zoneIndex, value) => {
    console.log(`[word-spell demo] correct @ ${zoneIndex}: ${value}`);
  },
  onWrongPlace: (zoneIndex, value) => {
    console.log(`[word-spell demo] wrong @ ${zoneIndex}: ${value}`);
  },
};

registerSkin('word-spell', demoSkin);

const baseConfig: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 2,
  roundsInOrder: true,
  ttsEnabled: false,
  tileUnit: 'letter',
  mode: 'emoji',
  rounds: [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
  ],
};

const WordSpellWithHarness = ({
  config,
}: {
  config: WordSpellConfig;
}) => (
  <SkinHarness gameId="word-spell">
    {({ skin }) => <WordSpell config={{ ...config, skin: skin.id }} />}
  </SkinHarness>
);

const meta: Meta<typeof WordSpellWithHarness> = {
  title: 'Games/WordSpell/Skin Harness',
  component: WordSpellWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof WordSpellWithHarness>;

export const Default: Story = {};
```

> **Note:** The `baseConfig` shape must match `WordSpellConfig`. If fields like `tileUnit` or `mode` have different names in the current codebase, read `src/games/word-spell/types.ts` and adjust. The goal is a minimal, renderable config — reuse whatever the main `WordSpell.stories.tsx` already uses as a baseline.

- [ ] **Step 2: Storybook test**

Run: `START_STORYBOOK=1 SKIP_UNIT=1 SKIP_VR=1 SKIP_E2E=1 SKIP_LINT=1 SKIP_TYPECHECK=1 yarn test:storybook` (or start `yarn storybook` manually and run `yarn test:storybook` in a second terminal).
Expected: the new story renders without errors.

- [ ] **Step 3: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx
git commit -m "feat(word-spell): add skin harness Storybook story with pink demo skin"
```

---

## Phase E — NumberMatch integration

### Task 14: Wire `useGameSkin` into NumberMatch

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Mirror Task 12 steps for NumberMatch**

Apply the same pattern: import skin APIs, call `useGameSkin('number-match', config.skin)` in the outer `NumberMatch` component, wrap the root render with the `game-container skin-${skin.id}` div and inline `skin.tokens`, render `skin.SceneBackground` / `RoundCompleteEffect` / `CelebrationOverlay` / `LevelCompleteOverlay` as overrides, pass `skin` to every `<Slot>`, add the `game:end` emission effect.

- [ ] **Step 2: Typecheck + test**

Run: `yarn typecheck && yarn test src/games/number-match`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "feat(number-match): integrate skin system (useGameSkin, wrapper, render slots)"
```

---

### Task 15: Token-drive `DominoTile` pips

**Files:**

- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` (contains `DominoTile`, `DiceFace`)

- [ ] **Step 1: Replace pip color with token**

In `DiceFace`, each pip `<span>` currently uses `bg-current` when filled. Change to:

```tsx
<span
  key={i}
  data-cell=""
  data-pip={pips.includes(i) ? '' : undefined}
  className={[
    'size-2.5 rounded-full',
    pips.includes(i) ? '' : 'bg-transparent',
  ].join(' ')}
  style={
    pips.includes(i)
      ? { background: 'var(--skin-pip-color, currentColor)' }
      : undefined
  }
/>
```

- [ ] **Step 2: Replace divider styling**

In `DominoTile`, change the divider span from `h-px w-11 shrink-0 bg-current opacity-30` to use tokens:

```tsx
<span
  data-divider=""
  className="h-px w-11 shrink-0"
  style={{
    background: 'var(--skin-pip-divider-color, currentColor)',
    opacity:
      'var(--skin-pip-divider-opacity, 0.3)' as React.CSSProperties['opacity'],
  }}
/>
```

- [ ] **Step 3: Typecheck + test**

Run: `yarn typecheck && yarn test src/games/number-match`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
git commit -m "refactor(number-match): drive DominoTile pips and divider from skin tokens"
```

---

### Task 16: `NumberMatch.skin.stories.tsx` with demo skin

**Files:**

- Create: `src/games/number-match/NumberMatch/NumberMatch.skin.stories.tsx`

- [ ] **Step 1: Create the story file**

Mirror `WordSpell.skin.stories.tsx` (Task 13). Key differences:

- `gameId: 'number-match'`
- Demo skin tokens include `--skin-pip-color: '#ec4899'` to prove pip recoloring works
- `baseConfig` matches `NumberMatchConfig` — read `src/games/number-match/types.ts` and the existing `NumberMatch.stories.tsx` for a minimal valid config

```tsx
const demoSkin: GameSkin = {
  id: 'demo',
  name: 'Demo Pink',
  tokens: {
    '--skin-tile-bg': '#ec4899',
    '--skin-tile-text': '#fff',
    '--skin-tile-radius': '50%',
    '--skin-slot-bg': '#fdf2f8',
    '--skin-slot-border': '#f472b6',
    '--skin-slot-radius': '50%',
    '--skin-pip-color': '#ec4899',
    '--skin-pip-divider-color': '#ec4899',
    '--skin-question-audio-bg': '#ec4899',
  },
  onCorrectPlace: (zoneIndex, value) => {
    console.log(`[number-match demo] correct @ ${zoneIndex}: ${value}`);
  },
};

registerSkin('number-match', demoSkin);
```

And wrap with `<SkinHarness gameId="number-match">`.

- [ ] **Step 2: Storybook check**

Run Storybook, confirm the story renders, toggle skin, click event buttons.

- [ ] **Step 3: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.skin.stories.tsx
git commit -m "feat(number-match): add skin harness Storybook story with pink demo skin"
```

---

## Phase F — Validation + VR + PR

### Task 17: Full local validation

- [ ] **Step 1: Lint**

Run: `yarn lint`
Expected: pass. Fix any issues.

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: pass.

- [ ] **Step 3: Unit tests**

Run: `yarn test`
Expected: all pass.

- [ ] **Step 4: Storybook tests**

Run: `yarn storybook` in one terminal; `yarn test:storybook` in another.
Expected: pass.

---

### Task 18: Visual regression — review and refresh baselines

**Background:** the Slot / TileBank / question / sentence refactors almost certainly produce pixel-level baseline drift even though colors match. Review intentional drift and update baselines.

- [ ] **Step 1: Ensure Docker is running**

Run: `docker ps`
Expected: Docker daemon responds. If not, start Docker Desktop (ask user if running remotely).

- [ ] **Step 2: Run VR tests**

Run: `yarn test:vr`
Expected: failures with diff PNG paths printed.

- [ ] **Step 3: Review each diff**

For each failing test, read the diff PNG (use the `Read` tool — Claude can view images). For each diff:

- If the colors and shapes match the pre-refactor classic look (token-driven serialization difference): accept as intentional drift.
- If anything looks visually different (wrong color, missing border, shifted layout): do NOT update baselines — fix the bug first, then re-run VR.

- [ ] **Step 4: Update baselines**

Once every diff is reviewed and understood:

Run: `yarn test:vr:update`
Expected: updated baselines in `src/**/__screenshots__/`.

- [ ] **Step 5: Re-run to confirm clean**

Run: `yarn test:vr`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add '**/__screenshots__/*.png'
git commit -m "test(vr): refresh baselines after skin token refactor"
```

---

### Task 19: Update architecture docs (co-located `.mdx`)

**Background:** CLAUDE.md requires updating architecture docs when modifying game state logic. The skin rollout touches `Slot`, tile banks, and game components — check each for a co-located `.mdx`.

- [ ] **Step 1: Run the helper**

Run: `/update-architecture-docs`
Expected: prompts listing files that need mdx updates.

- [ ] **Step 2: Update each mdx**

Update the listed `.mdx` files with a short note that the component now reads `--skin-*` tokens; reference the classic-skin token contract in `src/lib/skin/classic-skin.ts`.

- [ ] **Step 3: Fix markdown formatting**

Run: `yarn fix:md`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/**/*.mdx
git commit -m "docs: note skin token consumption in affected component mdx"
```

---

### Task 20: Push and open PR

- [ ] **Step 1: Pre-push gate**

Run: `git push --set-upstream origin feat/skin-rollout-p2`
Expected: the Husky pre-push hook runs lint, typecheck, unit, storybook, VR, e2e. All pass.

If Storybook tests fail because the server wasn't running:

Run: `START_STORYBOOK=1 git push --set-upstream origin feat/skin-rollout-p2`

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat(skin): roll skin system out to WordSpell + NumberMatch (Plan 2)" --body "$(cat <<'EOF'
## Summary

- Wires the Plan 1 skin system end-to-end in WordSpell and NumberMatch.
- Unifies the classic skin and custom skins on a single token-driven code path — drops the `isCustomSkin` branch in `Slot`; replaces `skeuoStyle` with a token-driven `tileStyle()`; moves bank-hole, hover-preview, question prompts, and sentence-gap styling to `--skin-*` tokens.
- Fixes Plan 1 limitation #2 (`onGameOver` retry count) by extending `GameEndEvent` with `retryCount` and moving emission from `session-recorder` (where retry count is unreachable) to the game components.
- Adds `*.skin.stories.tsx` skin-harness stories for WordSpell and NumberMatch (mirrors the SortNumbers pattern).

## Spec / plan

- Spec: `docs/superpowers/specs/2026-04-15-skin-rollout-p2-design.md`
- Plan: `docs/superpowers/plans/2026-04-15-skin-rollout-p2.md`

## Test plan

- [ ] `yarn lint` passes
- [ ] `yarn typecheck` passes
- [ ] `yarn test` passes
- [ ] `yarn test:storybook` passes (three skin harness stories render)
- [ ] `yarn test:vr` passes (baselines refreshed after manual diff review)
- [ ] `yarn test:e2e` passes
- [ ] Storybook manual: switch each game's harness between `classic` and `demo`; verify tile/slot/bank/hover/question colors change
- [ ] Storybook manual: click `onGameOver` button in SortNumbers harness after toggling `demo`; verify the console logs the retry count from the event

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Watch CI**

Run: `gh pr checks --watch`
Expected: all checks green. If any fail, investigate, push fix commits, iterate.

- [ ] **Step 4: Confirm PR is green but NOT merged**

Run: `gh pr view --json state,mergeable,statusCheckRollup`
Expected: `state: OPEN`, `mergeable: MERGEABLE`, all checks `SUCCESS`. Do NOT merge.

---

## Post-plan

- Update `project_skin_rollout.md` memory:
  - Remove the incorrect "don't add a separate `.skin.stories.tsx`" claim.
  - Note Plan 2 is shipped (PR number), Plan 3 is the `baseskill-premium-cloud` bootstrap.

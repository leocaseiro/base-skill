# Game Tile Auto Font Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make numeric game tiles auto-shrink their font to fit long labels while keeping tile size constant (touch-friendly), and stop 10-slot rows from wrapping to two lines on desktop.

**Architecture:** One shared pure utility `getNumericTileFontClass(labelLength, base)` returns a Tailwind `text-*` class from a tier table. SortNumbers and NumberMatch call it at exactly two places each (slot render-prop and tile bank render). The outer game container widens from `max-w-2xl` to `max-w-4xl` so 10 tiles fit on one line at desktop widths. `SlotRow`'s existing `flex-wrap` remains as the mobile fallback. No container queries, no JS measurement, no prop drilling.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS, Vitest for unit tests, Storybook 8 for interaction tests, Playwright for visual regression.

**Spec:** [docs/superpowers/specs/2026-04-11-game-tile-auto-font-sizing-design.md](../specs/2026-04-11-game-tile-auto-font-sizing-design.md)

**Working directory for all tasks:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat-game-tile-auto-font-sizing`

All `yarn` commands below assume this directory.

---

## Task 1: Shared font-sizing utility (TDD)

**Files:**

- Create: `src/components/answer-game/tile-font.ts`
- Create: `src/components/answer-game/tile-font.test.ts`

### Step 1: Write the failing test

- [ ] Create `src/components/answer-game/tile-font.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { getNumericTileFontClass } from './tile-font';

describe('getNumericTileFontClass — 56 px base', () => {
  it.each([
    [0, 'text-2xl'],
    [1, 'text-2xl'],
    [2, 'text-2xl'],
    [3, 'text-2xl'],
    [4, 'text-xl'],
    [5, 'text-base'],
    [6, 'text-sm'],
    [7, 'text-xs'],
    [10, 'text-xs'],
  ])('length %i → %s', (length, expected) => {
    expect(getNumericTileFontClass(length, 56)).toBe(expected);
  });
});

describe('getNumericTileFontClass — 80 px base', () => {
  it.each([
    [0, 'text-3xl'],
    [1, 'text-3xl'],
    [2, 'text-3xl'],
    [3, 'text-3xl'],
    [4, 'text-2xl'],
    [5, 'text-xl'],
    [6, 'text-base'],
    [7, 'text-sm'],
    [10, 'text-sm'],
  ])('length %i → %s', (length, expected) => {
    expect(getNumericTileFontClass(length, 80)).toBe(expected);
  });
});
```

### Step 2: Run the test to verify it fails

- [ ] Run:

```bash
yarn test src/components/answer-game/tile-font.test.ts
```

Expected: FAIL with "Cannot find module './tile-font'" (module does not exist yet).

### Step 3: Write the minimal implementation

- [ ] Create `src/components/answer-game/tile-font.ts` with:

```ts
export type TileFontBase = 56 | 80;

const CLASS_BY_BASE_AND_LENGTH: Record<
  TileFontBase,
  readonly string[]
> = {
  56: [
    'text-2xl',
    'text-2xl',
    'text-2xl',
    'text-2xl',
    'text-xl',
    'text-base',
    'text-sm',
    'text-xs',
  ],
  80: [
    'text-3xl',
    'text-3xl',
    'text-3xl',
    'text-3xl',
    'text-2xl',
    'text-xl',
    'text-base',
    'text-sm',
  ],
};

export const getNumericTileFontClass = (
  labelLength: number,
  base: TileFontBase,
): string => {
  const tiers = CLASS_BY_BASE_AND_LENGTH[base];
  const safeLength = Math.max(0, Math.floor(labelLength));
  const index = Math.min(safeLength, tiers.length - 1);
  return tiers[index] ?? tiers[tiers.length - 1]!;
};
```

Index meaning: `tiers[0..3]` cover lengths 0-3 (all use the 1-3 tier), `tiers[4]` is length 4, `tiers[5]` is length 5, `tiers[6]` is length 6, `tiers[7]` is the 7+ floor.

### Step 4: Run the test to verify it passes

- [ ] Run:

```bash
yarn test src/components/answer-game/tile-font.test.ts
```

Expected: PASS — 18 passed (9 for each base).

### Step 5: Typecheck

- [ ] Run:

```bash
yarn typecheck
```

Expected: no errors.

### Step 6: Commit

- [ ] Run:

```bash
git add src/components/answer-game/tile-font.ts src/components/answer-game/tile-font.test.ts
git commit -m "feat(answer-game): add getNumericTileFontClass utility

Pure function that returns a Tailwind text-* class from a tier table
based on label length and tile base size (56 or 80 px). Used by
SortNumbers and NumberMatch to auto-shrink font for long labels while
keeping tile size constant for touch targets."
```

---

## Task 2: SortNumbers — widen container and auto-size slot font

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

### Step 1: Widen the outer container

- [ ] In `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`, line 158, change:

```tsx
<div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
```

to:

```tsx
<div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6">
```

### Step 2: Import the utility

- [ ] At the top of the same file, add to the imports (alphabetical order within the `@/components/answer-game/*` block):

```tsx
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
```

### Step 3: Auto-size the slot label font

- [ ] In the same file, replace the Slot children render-prop (currently at lines 172-174):

```text
{({ label }) => (
  <span className="text-2xl font-bold">{label}</span>
)}
```

with:

```text
{({ label }) => (
  <span
    className={`${getNumericTileFontClass(label.length, 56)} font-bold tabular-nums`}
  >
    {label}
  </span>
)}
```

`tabular-nums` is added so the digit widths are consistent across rounds. `font-bold` is preserved.

### Step 4: Typecheck

- [ ] Run:

```bash
yarn typecheck
```

Expected: no errors.

### Step 5: Lint

- [ ] Run:

```bash
yarn lint
```

Expected: no errors.

### Step 6: Commit

- [ ] Run:

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(sort-numbers): auto-size slot font and widen container

- Outer wrapper max-w-2xl -> max-w-4xl so 10-slot rows fit on one line
  at desktop widths.
- Slot label uses getNumericTileFontClass(label.length, 56) with
  tabular-nums so long labels (1000, 10000) no longer clip."
```

---

## Task 3: SortNumbersTileBank — auto-size tile and preview font

**Files:**

- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`

### Step 1: Import the utility

- [ ] At the top of `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`, add:

```tsx
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
```

### Step 2: Auto-size the NumberTile button font

- [ ] Replace the `NumberTile` component's button `className` attribute (currently at line 22):

```text
className="flex size-14 touch-none select-none cursor-grab items-center justify-center rounded-xl text-2xl font-bold transition-transform active:scale-95 active:cursor-grabbing"
```

with:

```text
className={`flex size-14 touch-none select-none cursor-grab items-center justify-center rounded-xl ${getNumericTileFontClass(tile.label.length, 56)} font-bold tabular-nums transition-transform active:scale-95 active:cursor-grabbing`}
```

### Step 3: Auto-size the hover-preview span font

- [ ] In the same file, replace the hover-target preview span (currently at lines 96-100):

```text
<span className="absolute inset-0 flex items-center justify-center text-2xl font-bold opacity-50">
  {tile.label}
</span>
```

with:

```text
<span
  className={`absolute inset-0 flex items-center justify-center ${getNumericTileFontClass(tile.label.length, 56)} font-bold tabular-nums opacity-50`}
>
  {tile.label}
</span>
```

### Step 4: Run the existing tile bank tests

- [ ] Run:

```bash
yarn test src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.test.tsx
```

Expected: PASS (no regressions; tests should not depend on the specific class name).

### Step 5: Typecheck and lint

- [ ] Run:

```bash
yarn typecheck && yarn lint
```

Expected: no errors.

### Step 6: Commit

- [ ] Run:

```bash
git add src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx
git commit -m "feat(sort-numbers): auto-size tile-bank font by label length

NumberTile button and hover-preview span both use
getNumericTileFontClass so long numeric labels no longer overflow
the 56 px tile. tabular-nums added for consistent digit widths."
```

---

## Task 4: SortNumbers long-label Storybook story

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`

### Step 1: Add a long-label story

- [ ] At the bottom of `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`, add a new exported story:

```tsx
export const TenSlotsLongLabels: Story = {
  args: {
    config: {
      ...baseConfig,
      totalRounds: 1,
      range: { min: 1000, max: 10000 },
      distractors: { source: 'random', count: 0 },
      rounds: [
        {
          sequence: [
            1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
          ],
        },
      ],
    },
  },
};
```

This story has 10 slots with mixed 4- and 5-digit labels. It exercises both the widened container and the font tier change (`text-xl` for 4-digit, `text-base` for 5-digit).

### Step 2: Start Storybook and visually verify

- [ ] In one terminal, run:

```bash
yarn storybook
```

Wait for "Storybook 8.x.x for react-vite started" on port 6006, then open `http://localhost:6006/?path=/story/games-sort-numbers-sortnumbers--ten-slots-long-labels` in a browser.

Verify:

- All 10 slots render on a single line (no wrap).
- `10000` fits inside its tile without clipping.
- Tile size looks the same as other stories (56 px, not shrunk).

If any of these fail, fix the implementation before continuing — do not move on.

- [ ] Stop the Storybook dev server with Ctrl-C once verified.

### Step 3: Run Storybook interaction tests

- [ ] In one terminal start Storybook in the background:

```bash
yarn storybook
```

- [ ] In another terminal run:

```bash
yarn test:storybook
```

Expected: all stories mount successfully, including `TenSlotsLongLabels`.

- [ ] Stop Storybook with Ctrl-C.

### Step 4: Commit

- [ ] Run:

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
git commit -m "test(sort-numbers): add ten-slot long-label story

Story covers the 10-slot single-line layout and the 4/5-digit font
tiers introduced by getNumericTileFontClass."
```

---

## Task 5: NumberMatch — widen container and auto-size slot font

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

### Step 1: Widen the outer container

- [ ] In `src/games/number-match/NumberMatch/NumberMatch.tsx`, line 205, change:

```tsx
<div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
```

to:

```tsx
<div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6">
```

### Step 2: Import the utility

- [ ] Add to the imports near the top (alphabetical within the `@/components/answer-game/*` block):

```tsx
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
```

### Step 3: Auto-size the numeric slot children font

- [ ] Replace the numeric-slot fallback inside the Slot children render-prop (currently at lines 279-283):

```tsx
return <span className="text-3xl font-bold tabular-nums">{label}</span>;
```

with:

```tsx
return (
  <span
    className={`${getNumericTileFontClass(label.length, 80)} font-bold tabular-nums`}
  >
    {label}
  </span>
);
```

### Step 4: Auto-size the numeric preview span font

- [ ] In the same file, replace the numeric-slot fallback inside `renderPreview` (currently at lines 252-256):

```tsx
return (
  <span className="text-3xl font-bold tabular-nums opacity-50">
    {previewLabel}
  </span>
);
```

with:

```tsx
return (
  <span
    className={`${getNumericTileFontClass(previewLabel.length, 80)} font-bold tabular-nums opacity-50`}
  >
    {previewLabel}
  </span>
);
```

### Step 5: Typecheck and lint

- [ ] Run:

```bash
yarn typecheck && yarn lint
```

Expected: no errors.

### Step 6: Commit

- [ ] Run:

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "feat(number-match): auto-size numeric slot font and widen container

- Outer wrapper max-w-2xl -> max-w-4xl (parity with SortNumbers).
- Numeric slot label and preview use getNumericTileFontClass with
  base 80 so 4/5+-digit numerals stop clipping in the 80 px tile.
- Word-mode and dots-domino branches are untouched."
```

---

## Task 6: NumeralTileBank — auto-size numeric tile and preview font

**Files:**

- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`

### Step 1: Import the utility

- [ ] At the top of `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`, add:

```tsx
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
```

### Step 2: Auto-size the numeric tile font

- [ ] Replace the numeric-tile fallback branch of `NumeralTile` (currently at lines 133-137):

```tsx
) : (
  <span className="text-3xl font-bold tabular-nums leading-none">
    {tile.label}
  </span>
)}
```

with:

```tsx
) : (
  <span
    className={`${getNumericTileFontClass(tile.label.length, 80)} font-bold tabular-nums leading-none`}
  >
    {tile.label}
  </span>
)}
```

### Step 3: Auto-size the numeric hover-preview span font

- [ ] In the same file, replace the numeric hover-target preview branch (currently at lines 258-262):

```tsx
) : (
  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-bold opacity-50">
    {tile.label}
  </span>
))}
```

with:

```tsx
) : (
  <span
    className={`pointer-events-none absolute inset-0 flex items-center justify-center ${getNumericTileFontClass(tile.label.length, 80)} font-bold tabular-nums opacity-50`}
  >
    {tile.label}
  </span>
))}
```

Note: `tabular-nums` is added so hover-preview digits match the final render.

### Step 4: Run the existing NumeralTileBank tests

- [ ] Run:

```bash
yarn test src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx
```

Expected: PASS.

### Step 5: Typecheck and lint

- [ ] Run:

```bash
yarn typecheck && yarn lint
```

Expected: no errors.

### Step 6: Commit

- [ ] Run:

```bash
git add src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
git commit -m "feat(number-match): auto-size numeric tile-bank font

NumeralTile numeric branch and hover-preview both use
getNumericTileFontClass(length, 80). Dots/domino and word branches
are untouched."
```

---

## Task 7: NumberMatch long-label Storybook story

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.stories.tsx`

### Step 1: Add a long-numeral story

- [ ] At the bottom of `src/games/number-match/NumberMatch/NumberMatch.stories.tsx`, add a new exported story:

```tsx
export const NumeralToGroupLongLabels: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-group',
      tileStyle: 'dots',
      tileBankMode: 'distractors',
      distractorCount: 3,
      range: { min: 10000, max: 99999 },
      rounds: [{ value: 10002 }, { value: 19467 }, { value: 99999 }],
    },
  },
};
```

This story renders 5-digit numerals. Numeric tiles and slots should now show them at `text-xl` (20 px) instead of the clipped `text-3xl` (30 px).

### Step 2: Start Storybook and visually verify

- [ ] Run:

```bash
yarn storybook
```

Open `http://localhost:6006/?path=/story/games-number-match-numbermatch--numeral-to-group-long-labels` in a browser.

Verify:

- 5-digit numerals fit inside their 80 px tiles without clipping.
- Tile size is unchanged compared to the short-label stories.
- The question and tile bank area layout still looks correct in the widened container.

- [ ] Stop Storybook with Ctrl-C once verified.

### Step 3: Run Storybook interaction tests

- [ ] Start Storybook in one terminal:

```bash
yarn storybook
```

- [ ] In another terminal run:

```bash
yarn test:storybook
```

Expected: all stories mount successfully, including `NumeralToGroupLongLabels`.

- [ ] Stop Storybook with Ctrl-C.

### Step 4: Commit

- [ ] Run:

```bash
git add src/games/number-match/NumberMatch/NumberMatch.stories.tsx
git commit -m "test(number-match): add 5-digit numeral long-label story

Story exercises the NumberMatch 80 px tile font tiers with 5-digit
values (text-xl instead of text-3xl)."
```

---

## Task 8: Visual regression baseline update

**Files:**

- Modify: Playwright VR baselines under the VR screenshot directory.

**Requires:** Docker running on the host so VR tests match CI.

### Step 1: Run VR tests and inspect diffs

- [ ] Run:

```bash
yarn test:vr
```

Expected: FAIL with diffs on the SortNumbers and NumberMatch stories (and possibly on any story that uses the widened container). The hook prints paths to the diff PNGs.

- [ ] For each diff PNG, open it with the Read tool or an image viewer and confirm the change is the intended font-size/container update. If any diff looks unintended (e.g. broken layout, wrong colors), STOP and fix the implementation before continuing.

### Step 2: Regenerate baselines

- [ ] Run:

```bash
yarn test:vr:update
```

Expected: baselines updated in-place. The command should exit 0.

### Step 3: Re-run VR tests to confirm they pass

- [ ] Run:

```bash
yarn test:vr
```

Expected: PASS.

### Step 4: Commit the updated baselines

- [ ] Run:

```bash
git add .
git status
```

Verify only VR baseline PNG files (and nothing else) are staged. Then commit:

```bash
git commit -m "test(vr): update baselines for tile auto font sizing

Baselines regenerated after widening game containers to max-w-4xl
and auto-sizing numeric tile/slot fonts via getNumericTileFontClass."
```

---

## Task 9: Full gate run and push

### Step 1: Run the full test suite locally (pre-push dry-run)

- [ ] Run each check explicitly to surface failures early:

```bash
yarn lint
yarn typecheck
yarn test
```

Expected: all PASS.

### Step 2: Run Storybook and VR via the pre-push hook

- [ ] With Storybook available (either running in another terminal with `yarn storybook` or via `START_STORYBOOK=1`) and Docker running, push the branch:

```bash
git push -u origin feat/game-tile-auto-font-sizing
```

The `.husky/pre-push` hook will run lint, typecheck, unit, storybook, VR, and e2e in order. All must pass.

- [ ] If E2E is not practical locally and it fails unrelated to this change, document the skip in the PR description and re-run with:

```bash
SKIP_E2E=1 git push -u origin feat/game-tile-auto-font-sizing
```

Only do this if the E2E failure is clearly pre-existing and unrelated. Otherwise, investigate and fix first.

### Step 3: Open the PR

- [ ] Run:

```bash
gh pr create --base master --title "Auto-size game tile fonts by label length" --body "$(cat <<'EOF'
## Summary

- Adds shared `getNumericTileFontClass(length, base)` utility that returns a Tailwind `text-*` class from a tier table (56 px and 80 px base tile sizes).
- SortNumbers and NumberMatch use it for both slots and tile-bank tiles (numeric branches), so long labels (1000, 10000, 10002) stop clipping.
- Widens game outer container from `max-w-2xl` to `max-w-4xl` so 10-slot rows fit on a single line at desktop widths.
- Mobile wrap is preserved via the existing `SlotRow` `flex-wrap` (graceful fallback at narrow viewports).
- New long-label Storybook stories for both games; VR baselines regenerated.

## Design

See [docs/superpowers/specs/2026-04-11-game-tile-auto-font-sizing-design.md](docs/superpowers/specs/2026-04-11-game-tile-auto-font-sizing-design.md).

## Test plan

- [x] `yarn lint`
- [x] `yarn typecheck`
- [x] `yarn test` (unit, including new `tile-font.test.ts`)
- [x] `yarn test:storybook` (new long-label stories mount)
- [x] `yarn test:vr` (baselines regenerated via `yarn test:vr:update`)
- [x] Manual: Storybook spot-check of long-label stories in a browser
EOF
)"
```

- [ ] Return the PR URL to the user.

---

## Self-review

### Spec coverage

- **Goal: long labels don't clip** → Tasks 1, 2, 3, 5, 6.
- **Goal: 10-slot rows stay single-line on desktop** → Tasks 2, 5 (max-w widening).
- **Goal: tiles never shrink below touch floor** → enforced by keeping `size-14` / `size-20`; no task removes them.
- **Non-goal respected: no WordSpell changes** → not touched in any task.
- **Non-goal respected: no NumberMatch word-mode changes** → Task 5 only touches the numeric fallback branch after the `wordMode` guard.
- **Non-goal respected: no Slot/SlotRow refactor** → not touched.
- **Unit tests per spec** → Task 1 covers both tier tables and the `labelLength === 0` edge case.
- **Storybook stories per spec** → Tasks 4 and 7.
- **VR baseline update** → Task 8.

### Placeholder scan

No TBD/TODO in steps. Every code edit shows the before and after verbatim. Every command has expected output. No "similar to Task N" references.

### Type consistency

- `getNumericTileFontClass(labelLength, base)` is the only exported symbol; every call site uses this exact signature.
- `TileFontBase = 56 | 80` is consistent across all call sites (56 for SortNumbers, 80 for NumberMatch).
- Every call passes `label.length` or `tile.label.length` as the first argument (both are `string.length`, a number).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-11-game-tile-auto-font-sizing.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

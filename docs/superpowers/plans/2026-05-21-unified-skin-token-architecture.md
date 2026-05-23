# Unified Skin Token Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the skin token system to `:root`-based CSS inheritance so new
skins work by overriding only what they change, state feedback tokens are
independent of base appearance, and all three games consume tokens uniformly.

**Architecture:** Classic-skin token values move from JS
(`Record<string, string>` applied via inline styles) to CSS `:root`
declarations. Skins override tokens on the game container scope — the CSS
cascade handles inheritance. State-feedback tokens get their own
`--skin-tile-{state}-*` namespace. `data-tile-state` attributes on DOM
elements enable CSS-driven state styling. `@property` is used only for
animation timing tokens where typed interpolation is needed.

**Tech Stack:** CSS custom properties, CSS `@property`, HTML data attributes,
React, TypeScript, Vitest

**Requirements covered:** R1-R7, R10-R13 from
`docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md`

**Not covered (gated on Spec 1a — XState migration):** R8, R9 (imperative
animation chain → XState-driven sequencing). A follow-up plan will address
these after Spec 1a lands.

**Disabled during migration:** `SpotAllTile` (`src/components/SpotAllTile.tsx`)
currently hard-references `var(--skin-correct-bg)` and `var(--skin-wrong-bg)`.
This component needs broader refactoring beyond token renames — disable it
during this migration and re-enable in a follow-up PR that addresses the full
refactor.

---

## Scope Check

This plan covers one coherent subsystem: the token infrastructure and its
consumers. R8/R9 (XState animation sequencing) are a separate subsystem gated
on Spec 1a and will be a follow-up plan.

---

## File Structure

### New files

| File                                                    | Responsibility                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/skin-tokens.css`                                   | `:root` defaults for all 63 skin tokens; `@property` registrations for animation timing |
| `src/lib/skin/skin-tokens.ts`                           | Canonical token name constants (single source of truth for TS + CSS)                    |
| `src/lib/skin/skin-tokens.test.ts`                      | Tests: `:root` tokens resolve, skin overrides cascade, `@property` types                |
| `src/components/answer-game/tile-state.ts`              | `data-tile-state` value enum, attribute setter helpers                                  |
| `src/components/answer-game/tile-state.test.ts`         | Tests for tile-state helpers                                                            |
| `src/components/answer-game/Slot/slot-state-styles.css` | CSS rules targeting `[data-tile-state]` and modifier attributes                         |

### Modified files

| File                                                                 | Changes                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/styles.css`                                                     | Import `skin-tokens.css`                                                                   |
| `src/lib/skin/classic-skin.ts`                                       | `tokens` becomes `{}` (all defaults in `:root`)                                            |
| `src/components/answer-game/styles.ts`                               | `tileStyle()` simplified to use single token vars                                          |
| `src/components/answer-game/styles.test.ts`                          | Updated assertions                                                                         |
| `src/components/answer-game/Slot/Slot.tsx`                           | State styling via `data-tile-state` + CSS; fix `correctStyle` bug; add modifier attributes |
| `src/components/answer-game/Slot/Slot.test.tsx`                      | Tests for `data-tile-state` attribute values                                               |
| `src/components/answer-game/Slot/slot-animations.ts`                 | Set `data-shaking` modifier during animation                                               |
| `src/components/answer-game/Slot/slot-animations.test.ts`            | Test `data-shaking` modifier                                                               |
| `src/components/answer-game/bank-tile-reject-feedback.ts`            | Use `--skin-tile-reject-*` tokens; set `data-shaking`                                      |
| `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` | Remove `isCustomSkin` branches; add `data-tile-state`                                      |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`         | Add `skin` prop; add `tileDecoration`; add `data-tile-state`                               |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`                 | Thread `skin` to `NumeralTileBank`                                                         |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`             | Add `data-tile-state`                                                                      |
| `src/games/word-spell/skins/dragon-cave-skin.tsx`                    | Migrate to new token names; remove state-feedback overrides                                |

---

## Task 1: Create `skin-tokens.css` with `:root` defaults

Extracts all Classic token values from `classic-skin.ts` into CSS `:root`
declarations. This is the foundation — after this task, tokens are available
everywhere via the cascade without inline styles.

**Files:**

- Create: `src/skin-tokens.css`
- Modify: `src/styles.css` (add import)
- Test: `src/lib/skin/skin-tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/skin/skin-tokens.test.ts
import { describe, expect, it } from 'vitest';

describe('skin-tokens.css :root defaults', () => {
  it('provides --skin-slot-bg from :root', () => {
    const el = document.createElement('div');
    document.body.append(el);
    const value =
      getComputedStyle(el).getPropertyValue('--skin-slot-bg');
    el.remove();
    // jsdom doesn't process CSS files — this test verifies the import chain
    // doesn't break. Visual verification via Storybook/browser.
    expect(value).toBeDefined();
  });
});
```

> **Note:** jsdom does not evaluate CSS files, so `:root` tokens won't resolve
> in unit tests. This test is a smoke-test for the import chain. Real
> verification is visual (Storybook, dev server). For token value correctness,
> we'll test in integration (Storybook VR) and by confirming Dragon Cave's
> token count drops.
>
> **jsdom limitation (applies to all tasks):** Unit tests verify DOM structure
> (attribute presence, token string values, function return shapes) but cannot
> verify CSS cascade, specificity, or computed styles. Visual correctness of
> `[data-tile-state]` rules is verified by: (1) Task 14 manual visual
> verification across all three games, and (2) VR tests (post-migration
> baseline update) which catch regressions in CI. If a CSS rule change passes
> unit tests but looks wrong in the browser, the unit test was never designed
> to catch it — check the CSS file directly.

- [ ] **Step 2: Run test to verify baseline**

Run: `yarn vitest run src/lib/skin/skin-tokens.test.ts`

- [ ] **Step 3: Create `src/skin-tokens.css`**

Extract every token from `classic-skin.ts` into `:root` declarations. State-
feedback tokens use the new `--skin-tile-{state}-*` naming convention (R2).

```css
/* src/skin-tokens.css
 * Classic skin defaults — the CSS cascade provides these to all elements.
 * Skins override individual tokens on the game container scope via
 * style={skin.tokens}, and the cascade does the rest.
 */

:root {
  /* ── Tile appearance ─────────────────────────────────────── */
  --skin-tile-bg:
    linear-gradient(
      180deg,
      transparent 70.48%,
      var(--skin-tile-highlight) 93.62%,
      transparent 100%
    ),
    var(--skin-tile-surface);
  --skin-tile-text: var(--bs-surface);
  --skin-tile-radius: 0.75rem;
  --skin-tile-border: transparent;
  --skin-tile-shadow:
    var(--skin-tile-ring) 0 0 0 1px,
    var(--skin-tile-inset-bottom) 0 -2px 1px 0 inset,
    var(--skin-tile-inset-top) 0 2px 1px 0 inset,
    0 2px 5px -1px rgba(0, 0, 0, 0.05),
    0 1px 3px -1px rgba(0, 0, 0, 0.3);
  --skin-tile-font-weight: 700;
  --skin-tile-text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.12);

  /* Sub-tokens for Classic's skeuomorphic tile surface */
  --skin-tile-surface: var(--card, #fafafa);
  --skin-tile-highlight: rgba(255, 255, 255, 1);
  --skin-tile-ring: rgba(0, 0, 0, 0.08);
  --skin-tile-inset-bottom: rgba(0, 0, 0, 0.08);
  --skin-tile-inset-top: rgba(255, 255, 255, 0.5);
  --skin-tile-active-scale: 0.95;

  /* ── Slot appearance ─────────────────────────────────────── */
  --skin-slot-bg: var(--bs-surface);
  --skin-slot-border: var(--bs-accent);
  --skin-slot-radius: 0.75rem;
  --skin-slot-active-border: var(--bs-primary);

  /* ── State-feedback tokens (R2: --skin-tile-{state}-*) ──── */
  --skin-tile-correct-bg: rgb(from var(--primary) r g b / 0.1);
  --skin-tile-correct-border: var(--bs-primary);
  --skin-tile-correct-color: var(--bs-success);
  --skin-tile-correct-animation: pop 250ms ease-out;

  --skin-tile-wrong-bg: rgb(from var(--destructive) r g b / 0.1);
  --skin-tile-wrong-border: var(--destructive);
  --skin-tile-wrong-color: var(--bs-error);
  --skin-tile-wrong-animation: shake 300ms ease-in-out;

  /* R6: Reject namespace — aliases to wrong by default */
  --skin-tile-reject-bg: var(--skin-tile-wrong-bg);
  --skin-tile-reject-border: var(--skin-tile-wrong-border);
  --skin-tile-reject-color: var(--skin-tile-wrong-color);

  /* R5: Motion states (pickup, ejecting) */
  --skin-tile-pickup-opacity: 0.3;
  --skin-tile-pickup-scale: 0.95;
  --skin-tile-pickup-shadow: var(--skin-tile-shadow);
  --skin-tile-ejecting-animation: eject-return 200ms ease-out;

  /* ── Effective-bg indirection (Finding 1: specificity) ──── */
  --skin-tile-effective-bg: var(--skin-tile-bg);

  /* ── Bank-hole tokens ────────────────────────────────────── */
  --skin-bank-hole-bg: rgb(from var(--muted) r g b / 0.6);
  --skin-bank-hole-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* ── Hover-preview tokens ────────────────────────────────── */
  --skin-hover-border-color: var(--bs-primary);
  --skin-hover-border-style: dashed;

  /* ── Scene / bank container tokens ───────────────────────── */
  --skin-scene-bg: transparent;
  --skin-bank-bg: transparent;
  --skin-bank-border: transparent;

  /* ── Celebration tokens ──────────────────────────────────── */
  --skin-celebration-emoji: '🐨';

  /* ── Question component tokens ───────────────────────────── */
  --skin-question-bg: transparent;
  --skin-question-text: inherit;
  --skin-question-radius: 0.75rem;
  --skin-question-audio-bg: var(--bs-primary);
  --skin-question-audio-fg: var(--primary-foreground);
  --skin-question-dot-bg: var(--bs-primary);
  --skin-question-dot-assigned-bg: var(--bs-primary);

  /* ── Sentence-with-gaps tokens ───────────────────────────── */
  --skin-sentence-gap-border: currentColor;
  --skin-sentence-gap-style: dashed;

  /* ── Domino pip tokens ───────────────────────────────────── */
  --skin-pip-color: currentColor;
  --skin-pip-divider-color: currentColor;
  --skin-pip-divider-opacity: 0.3;

  /* ── HUD tokens ──────────────────────────────────────────── */
  --skin-hud-bg: transparent;
  --skin-hud-gap: 0.5rem;
  --skin-hud-padding: 0.25rem 0.75rem;
  --skin-hud-radius: 9999px;
  --skin-hud-dot-size: 0.875rem;
  --skin-hud-dot-fill: var(--bs-primary);
  --skin-hud-dot-empty: var(--bs-surface);
  --skin-hud-dot-border: var(--bs-border);
  --skin-hud-dot-current-border: var(--skin-slot-border);
  --skin-hud-fraction-color: var(--bs-foreground);
  --skin-hud-fraction-sep-color: var(--skin-hud-dot-fill);
  --skin-hud-level-color: var(--bs-primary);

  /* ── Chrome tokens (GameShell buttons/wrapper) ───────────── */
  --skin-chrome-button-radius: 9999px;
  --skin-chrome-button-bg: var(--background);
  --skin-chrome-button-color: var(--foreground);
  --skin-chrome-button-opacity: 0.8;
  --skin-chrome-button-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --skin-chrome-button-ring-color: var(--border);
  --skin-chrome-button-opacity-hover: 1;
  --skin-chrome-wrapper-bg: transparent;

  /* ── Visual variation tokens (cross-game palette) ────────── */
  --skin-variation-1: var(--bs-primary);
  --skin-variation-2: var(--destructive);
  --skin-variation-3: var(--bs-success);
  --skin-variation-4: oklch(54% 0.22 295);
  --skin-variation-5: oklch(63% 0.18 35);
  --skin-variation-6: var(--skin-tile-text);
}
```

> **`--skin-tile-bg` promotion note:** In `classic-skin.ts`, `--skin-tile-bg`
> is currently a flat color (`var(--bs-primary)`). This plan intentionally
> promotes it to a gradient in `:root`. This is a deliberate visual refinement,
> not a bug — the gradient was previously composed inline by `tileStyle()`.
> After Task 2 simplifies `tileStyle()`, the gradient moves to the token.
>
> **Reconciliation:** Run `grep -c '^\s*--skin-' src/skin-tokens.css` and
> compare against `Object.keys(classicSkin.tokens).length` from the current
> `classic-skin.ts` (expected: 63). Document any delta (renamed, merged, or
> dropped tokens) in the commit message.

- [ ] **Step 4: Import skin-tokens.css from styles.css**

Add to the top of `src/styles.css` (after the existing `@import` lines):

```css
@import './skin-tokens.css';
```

- [ ] **Step 5: Run tests**

Run: `yarn vitest run src/lib/skin/skin-tokens.test.ts`
Expected: PASS (smoke test passes; import chain doesn't break)

- [ ] **Step 6: Commit**

```bash
git add src/skin-tokens.css src/styles.css src/lib/skin/skin-tokens.test.ts
git commit -m "feat(skin): add skin-tokens.css with :root defaults (R1)

Classic token values now live in CSS :root declarations. State-feedback
tokens use the new --skin-tile-{state}-* naming convention (R2). Reject
namespace aliases to wrong by default (R6)."
```

---

## Task 1b: Create `src/lib/skin/skin-tokens.ts` — canonical token name registry

Single source of truth for skin token names. TS code references
`SKIN_TOKENS.*` instead of repeating raw `'--skin-*'` strings.

**Files:**

- Create: `src/lib/skin/skin-tokens.ts`

- [ ] **Step 1: Create the token registry**

```ts
// src/lib/skin/skin-tokens.ts
export const SKIN_TOKENS = {
  tileBg: '--skin-tile-bg',
  tileBgFrom: '--skin-tile-bg-from',
  tileBgTo: '--skin-tile-bg-to',
  tileBorder: '--skin-tile-border',
  tileText: '--skin-tile-text',
  tileShadow: '--skin-tile-shadow',
  tileEffectiveBg: '--skin-tile-effective-bg',
  correctBg: '--skin-correct-bg',
  correctBgFrom: '--skin-correct-bg-from',
  correctBgTo: '--skin-correct-bg-to',
  wrongBg: '--skin-wrong-bg',
  chromeShellBg: '--skin-chrome-shell-bg',
  chromeShellBorder: '--skin-chrome-shell-border',
  // ... all 63 tokens — mirror the :root declarations from Task 1
} as const;

export type SkinTokenName =
  (typeof SKIN_TOKENS)[keyof typeof SKIN_TOKENS];
export const SKIN_TOKEN_NAMES: readonly SkinTokenName[] =
  Object.values(SKIN_TOKENS);
```

> **Acceptance check:** `SKIN_TOKEN_NAMES.length` must equal the
> `grep -c '^\s*--skin-' src/skin-tokens.css` count from Task 1 (expected: 63).

- [ ] **Step 2: Update imports in registry.ts**

Replace hardcoded `'--skin-tile-bg'` strings in `registry.ts` and
`registry.test.ts` with `SKIN_TOKENS.tileBg` imports.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/skin-tokens.ts src/lib/skin/registry.ts src/lib/skin/registry.test.ts
git commit -m "feat(skin): add skin-tokens.ts canonical token name registry

Single source of truth for TS + CSS token names. Replaces hardcoded
'--skin-*' magic strings in registry.ts with SKIN_TOKENS.* constants."
```

---

## Task 2: Simplify `tileStyle()` to use single-token vars

Currently `tileStyle()` builds complex CSS values from sub-tokens. After Task 1,
the `:root` already composes these into `--skin-tile-bg`, `--skin-tile-shadow`,
and `--skin-tile-text-shadow`. Simplify the function to use the composed tokens.

> **Specificity fix (P0):** `tileStyle()` returns inline styles, which have
> higher specificity than any `[data-tile-state]` CSS selector. To allow
> state-feedback rules to override tile background, `tileStyle()` must
> reference `--skin-tile-effective-bg` (not `--skin-tile-bg` directly). The
> `:root` sets `--skin-tile-effective-bg: var(--skin-tile-bg)` as default;
> `[data-tile-state='correct']` overrides it to `var(--skin-tile-correct-bg)`.
> This indirection lets state-feedback win without `!important`.

**Files:**

- Modify: `src/components/answer-game/styles.ts`
- Modify: `src/components/answer-game/styles.test.ts`

- [ ] **Step 1: Update the test**

```ts
// src/components/answer-game/styles.test.ts
import { describe, expect, it } from 'vitest';
import { tileStyle } from './styles';

describe('tileStyle', () => {
  it('returns an object with background, boxShadow, and textShadow using skin tokens', () => {
    const style = tileStyle();
    expect(style.background).toBe('var(--skin-tile-bg)');
    expect(style.boxShadow).toBe('var(--skin-tile-shadow)');
    expect(style.textShadow).toBe('var(--skin-tile-text-shadow)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/styles.test.ts`
Expected: FAIL — current `tileStyle()` returns hardcoded gradient, not
`var(--skin-tile-bg)`

- [ ] **Step 3: Simplify tileStyle()**

```ts
// src/components/answer-game/styles.ts
import type { CSSProperties } from 'react';

export function tileStyle(): CSSProperties {
  return {
    background: 'var(--skin-tile-bg)',
    boxShadow: 'var(--skin-tile-shadow)',
    textShadow: 'var(--skin-tile-text-shadow)',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/styles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/styles.ts src/components/answer-game/styles.test.ts
git commit -m "refactor(skin): simplify tileStyle() to use composed token vars

tileStyle() now references --skin-tile-bg, --skin-tile-shadow, and
--skin-tile-text-shadow directly. The complex gradient/shadow composition
lives in :root declarations (skin-tokens.css)."
```

---

## Task 3: Migrate classic-skin to empty tokens + rename state-feedback references

> **Atomic commit:** Tasks 3 and 4 are merged into one commit. Emptying
> classic-skin tokens while consumers still reference old token names creates a
> window where both sides are wrong. Doing both in one commit keeps the
> codebase consistent at every commit boundary.

Now that `:root` provides all defaults, Classic's `tokens` object becomes `{}`.
Simultaneously, rename all `--skin-correct-*`/`--skin-wrong-*` consumer
references to the new `--skin-tile-{state}-*` names and wire `--skin-tile-reject-*`
(R6).

**Files:**

- Modify: `src/lib/skin/classic-skin.ts`
- Modify: `src/components/answer-game/Slot/Slot.tsx`
- Modify: `src/components/answer-game/bank-tile-reject-feedback.ts`
- Test: existing `src/lib/skin/registry.test.ts` (must still pass)

- [ ] **Step 1: Write a failing test for empty tokens**

Add to `src/lib/skin/registry.test.ts`:

```ts
it('classic skin has empty tokens (defaults live in :root CSS)', () => {
  expect(Object.keys(classicSkin.tokens)).toHaveLength(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn vitest run src/lib/skin/registry.test.ts`
Expected: FAIL — classic skin currently has 63 tokens

- [ ] **Step 3: Empty the tokens object**

```ts
// src/lib/skin/classic-skin.ts
import type { GameSkin } from './game-skin';

export const classicSkin: GameSkin = {
  id: 'classic',
  name: 'Classic',
  tokens: {},
};
```

- [ ] **Step 4: Update Slot.tsx token references**

In `src/components/answer-game/Slot/Slot.tsx`, replace old token names with
new ones in the style objects (lines 85-109):

| Old reference                | New reference                     |
| ---------------------------- | --------------------------------- |
| `var(--skin-wrong-bg)`       | `var(--skin-tile-wrong-bg)`       |
| `var(--skin-wrong-border)`   | `var(--skin-tile-wrong-border)`   |
| `var(--skin-wrong-color)`    | `var(--skin-tile-wrong-color)`    |
| `var(--skin-correct-bg)`     | `var(--skin-tile-correct-bg)`     |
| `var(--skin-correct-border)` | `var(--skin-tile-correct-border)` |

Also fix the **correctStyle bug** at line 107:

```ts
// BEFORE (bug: uses border color for text):
color: 'var(--skin-correct-border)',

// AFTER (fix: uses correct color token):
color: 'var(--skin-tile-correct-color)',
```

The full updated style blocks in Slot.tsx:

```ts
const wrongStyle: React.CSSProperties = isWrong
  ? {
      background: 'var(--skin-tile-wrong-bg)',
      borderColor: 'var(--skin-tile-wrong-border)',
      color: 'var(--skin-tile-wrong-color)',
    }
  : {};

const correctStyle: React.CSSProperties =
  !isEmpty && !isWrong && !isPreview
    ? {
        background: 'var(--skin-tile-correct-bg)',
        borderColor: 'var(--skin-tile-correct-border)',
        color: 'var(--skin-tile-correct-color)',
      }
    : {};
```

- [ ] **Step 5: Update bank-tile-reject-feedback.ts**

Replace `--skin-wrong-*` with `--skin-tile-reject-*` (R6 — reject has its
own namespace):

```ts
// In flashBankTileRejectFeedback, lines 79-84:
el.style.borderWidth = '2px';
el.style.borderStyle = 'solid';
el.style.borderColor = 'var(--skin-tile-reject-border)';
el.style.background = 'var(--skin-tile-reject-bg)';
el.style.color = 'var(--skin-tile-reject-color)';
el.style.boxShadow = 'none';
```

- [ ] **Step 6: Run all tests**

Run: `yarn vitest run`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/skin/classic-skin.ts src/lib/skin/registry.test.ts \
  src/components/answer-game/Slot/Slot.tsx \
  src/components/answer-game/bank-tile-reject-feedback.ts
git commit -m "refactor(skin): empty classic tokens + rename state tokens (R1, R2, R6, R7)

Atomic commit — both changes must land together to keep the codebase
consistent. Classic is now the zero-override skin. All default token values
come from skin-tokens.css :root. State-feedback tokens renamed:
--skin-correct-* → --skin-tile-correct-*, --skin-wrong-* → --skin-tile-wrong-*.
Fix correctStyle bug: color used border token, now uses color token.
bank-tile-reject-feedback uses --skin-tile-reject-* namespace (R6)."
```

---

## Task 5: Remove `isCustomSkin` from SortNumbers (R11)

The `isCustomSkin` branch in `SortNumbersTileBank` was a workaround for
classic-skin's `tileStyle()` not using token vars for all properties. Now that
`tileStyle()` reads from `:root` tokens (Task 2), the branch is unnecessary.

**Files:**

- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`

- [ ] **Step 1: Remove `isCustomSkin` from NumberTile (lines 25-37)**

Replace the conditional with `tileStyle()` directly:

```tsx
const NumberTile = ({
  tile,
  skin,
}: {
  tile: TileItem;
  skin?: GameSkin;
}) => {
  const {
    ref,
    handleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDraggableTile(tile);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={`flex size-14 touch-none select-none cursor-grab items-center justify-center rounded-xl ${getNumericTileFontClass(tile.label.length, 56)} font-bold tabular-nums transition-transform active:scale-95 active:cursor-grabbing`}
      style={tileStyle()}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {tile.label}
      {skin?.tileDecoration?.(tile)}
    </button>
  );
};
```

- [ ] **Step 2: Remove `isCustomSkin` holeRadiusStyle (lines 76-79)**

Delete the `isCustomSkin` check and `holeRadiusStyle` variable. The hole
already has `rounded-xl` which matches the default tile radius. For custom
skins that change `--skin-tile-radius`, the hole's border-radius should be
set via the token:

Replace all `{...holeRadiusStyle}` spreads with:
`borderRadius: 'var(--skin-tile-radius)'`

Apply this to the four places `holeRadiusStyle` was spread (hole div, in-bank
wrapper, hover indicator, empty hole).

- [ ] **Step 3: Run SortNumbers tests**

Run: `yarn vitest run --testPathPattern sort-numbers`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx
git commit -m "refactor(skin): remove isCustomSkin branches from SortNumbers (R11)

tileStyle() now reads all properties from :root tokens, so the
isCustomSkin workaround is unnecessary. Hole border-radius always
uses var(--skin-tile-radius) for consistency."
```

---

## Task 6: Add skin prop to NumberMatch `NumeralTileBank` (R12)

NumberMatch bank tiles are the only game where the skin prop doesn't reach the
bank. This task threads the skin prop through and adds `tileDecoration`.

**Files:**

- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Update NumeralTileBankProps**

```ts
export interface NumeralTileBankProps {
  tileStyle: TileStyle;
  tilesShowGroup: boolean;
  skin?: GameSkin;
}
```

Add `import type { GameSkin } from '@/lib/skin';` to the imports.

- [ ] **Step 2: Thread skin to NumeralTile**

Update `NumeralTile` component to accept `skin` and render `tileDecoration`:

```tsx
const NumeralTile = ({
  tile,
  tileStyle,
  tilesShowGroup,
  skin,
}: {
  tile: TileItem;
  tileStyle: TileStyle;
  tilesShowGroup: boolean;
  skin?: GameSkin;
}) => {
  // ... existing code ...
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={/* existing */}
      style={tileSurfaceStyle()}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {showDomino ? (
        <DominoTile value={numericValue} />
      ) : isWordTile ? (
        <span className={/* existing */}>{tile.label}</span>
      ) : (
        <span className={/* existing */}>{tile.label}</span>
      )}
      {skin?.tileDecoration?.(tile)}
    </button>
  );
};
```

Update the `NumeralTile` render call inside `NumeralTileBank` to pass `skin`:

```tsx
<NumeralTile
  tile={tile}
  tileStyle={tileStyle}
  tilesShowGroup={tilesShowGroup}
  skin={skin}
/>
```

- [ ] **Step 3: Thread skin from NumberMatch game component**

In `src/games/number-match/NumberMatch/NumberMatch.tsx`, find where
`NumeralTileBank` is rendered (around line 301-304) and add the `skin` prop:

```tsx
<NumeralTileBank
  tileStyle={tileStyle}
  tilesShowGroup={tilesShowGroup}
  skin={skin}
/>
```

The `skin` prop is already available in `NumberMatchSession` (passed from
`NumberMatch` which calls `useGameSkin`). Pass it to `NumeralTileBank`.

- [ ] **Step 4: Run NumberMatch tests**

Run: `yarn vitest run --testPathPattern number-match`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/number-match/NumeralTileBank/NumeralTileBank.tsx src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "feat(skin): thread skin prop to NumberMatch NumeralTileBank (R12)

NumeralTile now receives the skin prop and renders tileDecoration,
matching WordSpell and SortNumbers. Closes the last cross-game
normalization gap."
```

---

## Task 7: Add `data-tile-state` attribute to Slot (R3)

Add a `data-tile-state` attribute to the slot's inner element that reflects the
current state. Values: `idle`, `empty`, `correct`, `wrong`, `pickup`,
`ejecting`. (The `reject` value applies only to bank tiles, not slots.)

**Files:**

- Create: `src/components/answer-game/tile-state.ts`
- Create: `src/components/answer-game/tile-state.test.ts`
- Modify: `src/components/answer-game/Slot/Slot.tsx`
- Modify: `src/components/answer-game/Slot/Slot.test.tsx`

- [ ] **Step 1: Create the tile-state helper**

```ts
// src/components/answer-game/tile-state.ts

export type TileState =
  | 'idle'
  | 'empty'
  | 'correct'
  | 'wrong'
  | 'reject'
  | 'pickup'
  | 'ejecting';

export const TILE_STATE_ATTR = 'data-tile-state' as const;
```

- [ ] **Step 2: Write test for Slot data-tile-state**

Add to `src/components/answer-game/Slot/Slot.test.tsx`:

```ts
it('sets data-tile-state="empty" on an empty slot', () => {
  // Render a Slot with no placed tile
  // Assert: inner element has data-tile-state="empty"
});

it('sets data-tile-state="wrong" on a wrong slot', () => {
  // Render a Slot with isWrong=true
  // Assert: inner element has data-tile-state="wrong"
});

it('sets data-tile-state="correct" on a filled correct slot', () => {
  // Render a Slot with a correct tile
  // Assert: inner element has data-tile-state="correct"
});
```

> **Note:** The exact test setup depends on the existing test harness in
> `Slot.test.tsx`. The executor should follow the existing patterns for
> rendering Slot with different states. The key assertion is:
> `expect(innerEl).toHaveAttribute('data-tile-state', expectedValue)`

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: FAIL — Slot doesn't set `data-tile-state` yet

- [ ] **Step 4: Add data-tile-state to Slot's inner element**

In `Slot.tsx`, compute the tile state from `renderProps` and set it on the
`InnerTag`:

```tsx
import { TILE_STATE_ATTR } from '../tile-state';
import type { TileState } from '../tile-state';

// Inside the Slot component, before the return:
const tileState: TileState = isEmpty
  ? 'empty'
  : isWrong
    ? 'wrong'
    : 'correct';

// On the InnerTag element, add the attribute:
<InnerTag
  ref={slotRef as Ref<HTMLDivElement>}
  className={[stateClasses, className].filter(Boolean).join(' ')}
  style={finalStyle}
  {...{ [TILE_STATE_ATTR]: tileState }}
>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: PASS

- [ ] **Step 6: Wire dynamic pickup and ejecting states**

The `pickup` and `ejecting` states are transient — they exist during drag and
eject animations respectively:

- **Pickup:** In `useSlotBehavior.ts`, when `dragActiveTileId` matches this
  slot's tile, set `data-tile-state="pickup"` on the slot element. When drag
  ends, revert to the underlying state (correct/wrong/empty).

- **Ejecting:** In `useSlotBehavior.ts`, when the eject animation starts
  (around line 302 where `triggerEjectReturn` is called), set
  `data-tile-state="ejecting"` on the slot element. When `EJECT_TILE`
  dispatches and the tile leaves, the slot returns to `empty`.

> **Implementation note:** The executor should read `useSlotBehavior.ts`
> carefully. The `isBeingDragged` flag already tracks pickup state. The eject
> flow starts at line 302 (setTimeout after shake). Both transitions are
> imperative today — when Spec 1a lands, XState will drive these transitions
> declaratively, but the attribute-setting pattern established here will be
> reused.

- [ ] **Step 7: Commit**

```bash
git add src/components/answer-game/tile-state.ts src/components/answer-game/tile-state.test.ts src/components/answer-game/Slot/Slot.tsx src/components/answer-game/Slot/Slot.test.tsx
git commit -m "feat(skin): add data-tile-state attribute to Slot (R3)

Slot inner element now carries data-tile-state with values empty, wrong,
correct, pickup, or ejecting based on current zone/drag state. Enables
CSS-driven state styling."
```

---

## Task 8: Add `data-tile-state` to bank tile components (R3)

Bank tiles use `data-tile-state="idle"` as their initial state. All three
bank components get the attribute. The `reject` state transition is wired
in Task 10 via `bank-tile-reject-feedback.ts`.

**Files:**

- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`
- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`

- [ ] **Step 1: Add data-tile-state to LetterTile button**

In `LetterTileBank.tsx`, add `data-tile-state="idle"` to the LetterTile
button element:

```tsx
<button
  ref={ref}
  type="button"
  data-tile-state="idle"
  aria-label={`Letter ${tile.label}`}
  // ... rest of props
>
```

- [ ] **Step 2: Add data-tile-state to NumberTile button (SortNumbers)**

Same pattern in `SortNumbersTileBank.tsx`:

```tsx
<button
  ref={ref}
  type="button"
  data-tile-state="idle"
  aria-label={`Number ${tile.label}`}
  // ...
>
```

- [ ] **Step 3: Add data-tile-state to NumeralTile button (NumberMatch)**

Same pattern in `NumeralTileBank.tsx`:

```tsx
<button
  ref={ref}
  type="button"
  data-tile-state="idle"
  aria-label={`Number ${tile.label}`}
  // ...
>
```

- [ ] **Step 4: Run all game tests**

Run: `yarn vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/LetterTileBank/LetterTileBank.tsx src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
git commit -m "feat(skin): add data-tile-state to bank tile buttons (R3)

All three games' bank tiles now carry data-tile-state='idle' on their
button elements. Reject state transition wired in Task 10."
```

---

## Task 9: Move slot state styling from inline styles to CSS rules (R3)

With `data-tile-state` in place, move the conditional inline styles (wrong,
correct) to CSS rules targeting the attribute. This eliminates the JS-computed
style objects and lets CSS do the work.

**Files:**

- Create: `src/components/answer-game/Slot/slot-state-styles.css`
- Modify: `src/components/answer-game/Slot/Slot.tsx`

- [ ] **Step 1: Create CSS rules for slot states**

```css
/* src/components/answer-game/Slot/slot-state-styles.css
 * Intentionally unscoped — selectors target both slot tiles and bank tiles
 * that carry the data-tile-state attribute.
 */

[data-tile-state='wrong'] {
  background: var(--skin-tile-wrong-bg);
  border-color: var(--skin-tile-wrong-border);
  color: var(--skin-tile-wrong-color);
}

[data-tile-state='correct'] {
  background: var(--skin-tile-correct-bg);
  border-color: var(--skin-tile-correct-border);
  color: var(--skin-tile-correct-color);
}

[data-tile-state='reject'] {
  background: var(--skin-tile-reject-bg);
  border-color: var(--skin-tile-reject-border);
  color: var(--skin-tile-reject-color);
}

[data-tile-state='pickup'] {
  opacity: var(--skin-tile-pickup-opacity);
  transform: scale(var(--skin-tile-pickup-scale));
  box-shadow: var(--skin-tile-pickup-shadow);
  transition:
    opacity 120ms ease-out,
    transform 120ms ease-out;
}

[data-tile-state='ejecting'] {
  animation: var(--skin-tile-ejecting-animation);
}
```

- [ ] **Step 2: Import the CSS file**

Add to `src/styles.css`:

```css
@import './components/answer-game/Slot/slot-state-styles.css';
```

- [ ] **Step 3: Remove inline state style objects from Slot.tsx**

Delete the `wrongStyle`, `correctStyle` variables and their spreads into
`finalStyle`. The `baseStyle` and `previewStyle` remain (they're slot-specific,
not state-driven).

The `finalStyle` computation becomes:

```ts
const finalStyle: React.CSSProperties = {
  ...baseStyle,
  ...previewStyle,
  ...style,
};
```

- [ ] **Step 4: Run Slot tests**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/slot-state-styles.css src/styles.css src/components/answer-game/Slot/Slot.tsx
git commit -m "refactor(skin): move slot state styling to CSS rules (R3)

State-feedback styles (wrong bg/border, correct bg/border) now live in
CSS rules targeting [data-tile-state] instead of JS-computed inline
styles. Removes wrongStyle/correctStyle variables from Slot.tsx."
```

---

## Task 10: Add `data-shaking` modifier attribute (R4, R5)

The `data-shaking` modifier fires on both bank-reject and slot-wrong-shake,
providing shared shake motion (R5).

**Files:**

- Modify: `src/components/answer-game/Slot/slot-animations.ts`
- Modify: `src/components/answer-game/Slot/slot-animations.test.ts`
- Modify: `src/components/answer-game/Slot/slot-state-styles.css`
- Modify: `src/components/answer-game/bank-tile-reject-feedback.ts`

> `bank-tile-reject-feedback.ts` already calls `triggerShake()` and gets the
> `data-shaking` modifier automatically — no source changes needed for
> the shake attribute itself. However, this task also refactors the reject
> flow to use `data-tile-state="reject"` (see Step 5b below).

- [ ] **Step 1: Write failing test for data-shaking**

Add to `src/components/answer-game/Slot/slot-animations.test.ts`:

```ts
describe('triggerShake — data-shaking modifier', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.append(el);
  });

  afterEach(() => el.remove());

  it('sets data-shaking during animation', () => {
    triggerShake(el);
    expect(el.hasAttribute('data-shaking')).toBe(true);
  });

  it('removes data-shaking on animationend', () => {
    triggerShake(el);
    el.dispatchEvent(new Event('animationend'));
    expect(el.hasAttribute('data-shaking')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/Slot/slot-animations.test.ts`
Expected: FAIL — `data-shaking` not set

- [ ] **Step 3: Update triggerShake to set data-shaking**

```ts
// src/components/answer-game/Slot/slot-animations.ts

export const triggerShake = (el: HTMLElement): void => {
  el.classList.remove('animate-shake');
  void el.offsetWidth;
  el.classList.add('animate-shake');
  el.setAttribute('data-shaking', '');
  el.addEventListener(
    'animationend',
    () => {
      el.classList.remove('animate-shake');
      el.removeAttribute('data-shaking');
    },
    { once: true },
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/Slot/slot-animations.test.ts`
Expected: PASS

- [ ] **Step 5: Add CSS rule for shared shake**

Add to `slot-state-styles.css`:

```css
[data-shaking] {
  animation: var(--skin-tile-wrong-animation);
}
```

- [ ] **Step 5b: Refactor bank-tile-reject-feedback.ts to use data-tile-state**

Replace the snapshot/restore inline-style pattern (lines 24-41) with
`data-tile-state` attribute set/unset. The old pattern saves and restores
inline styles, which fights CSS-driven state feedback (inline styles have
higher specificity than `[data-tile-state]` selectors).

New reject flow:

1. Set `data-tile-state="reject"` on the bank tile element
2. `triggerShake(el)` sets `data-shaking` (Step 3 handles this)
3. On `animationend`, remove `data-tile-state="reject"` (revert to `idle`)
4. Remove the snapshot/restore block entirely — CSS handles all visual states

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/Slot/slot-animations.ts \
  src/components/answer-game/Slot/slot-animations.test.ts \
  src/components/answer-game/bank-tile-reject-feedback.ts \
  src/components/answer-game/Slot/slot-state-styles.css
git commit -m "feat(skin): add data-shaking modifier + refactor reject flow (R4, R5)

triggerShake() now sets/removes data-shaking boolean attribute. CSS
targets [data-shaking] for shared shake motion across bank-reject
and slot-wrong-shake surfaces.
bank-tile-reject-feedback: replaces snapshot/restore inline-style
pattern with data-tile-state='reject' set/unset — CSS handles visual
state, eliminating specificity conflicts."
```

---

## Task 11: Add `data-drag-over` modifier attribute (R4)

The `data-drag-over` modifier is set on the slot when it's the active hover
target during a drag. It's removed synchronously before the resulting state
(correct/wrong/reject/cancel) is applied.

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.tsx`
- Modify: `src/components/answer-game/Slot/slot-state-styles.css`

- [ ] **Step 1: Set data-drag-over based on isPreview**

In `Slot.tsx`, the `isPreview` flag already tracks drag-over state. Set the
attribute on the `InnerTag`:

```tsx
<InnerTag
  ref={slotRef as Ref<HTMLDivElement>}
  className={[stateClasses, className].filter(Boolean).join(' ')}
  style={finalStyle}
  {...{
    [TILE_STATE_ATTR]: tileState,
    ...(isPreview ? { 'data-drag-over': '' } : {}),
  }}
>
```

- [ ] **Step 2: Move preview styling to CSS**

Add to `slot-state-styles.css`:

```css
[data-drag-over] {
  border-color: var(--skin-hover-border-color);
  border-style: var(--skin-hover-border-style);
  animation: pulse-ring var(--skin-anim-pulse-ring-duration)
    var(--skin-anim-pulse-ring-easing) infinite;
}
```

Remove `previewStyle` from Slot.tsx (the CSS rule handles it now).

- [ ] **Step 3: Run Slot tests**

Run: `yarn vitest run src/components/answer-game/Slot/Slot.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx src/components/answer-game/Slot/slot-state-styles.css
git commit -m "feat(skin): add data-drag-over modifier to Slot (R4)

Slot now sets/removes data-drag-over boolean attribute during drag
hover. Preview styling (border, pulse-ring) moved to CSS rule."
```

---

## Task 12: Tokenize animation timing (R10)

Define CSS custom properties for animation duration and easing for all 5
animations. Register timing tokens via `@property` for typed interpolation.

**Files:**

- Modify: `src/skin-tokens.css`
- Modify: `src/styles.css` (keyframe references)

- [ ] **Step 1: Add animation timing tokens to skin-tokens.css**

Append to the `:root` block in `src/skin-tokens.css`:

```css
/* ── Animation timing tokens (R10) ────────────────────────── */
--skin-anim-shake-duration: 300ms;
--skin-anim-shake-easing: ease-in-out;
--skin-anim-pop-duration: 250ms;
--skin-anim-pop-easing: ease-out;
--skin-anim-pulse-ring-duration: 1.5s;
--skin-anim-pulse-ring-easing: ease-in-out;
--skin-anim-eject-fly-duration: 300ms;
--skin-anim-eject-fly-easing: ease-in;
--skin-anim-eject-fade-duration: 200ms;
--skin-anim-eject-fade-easing: ease-out;
```

- [ ] **Step 2: Register `@property` for animation timing tokens**

Add `@property` declarations to `src/skin-tokens.css` (before the `:root`
block):

```css
@property --skin-anim-shake-duration {
  syntax: '<time>';
  initial-value: 300ms;
  inherits: true;
}

@property --skin-anim-shake-easing {
  syntax: '*';
  inherits: true;
}

@property --skin-anim-pop-duration {
  syntax: '<time>';
  initial-value: 250ms;
  inherits: true;
}

@property --skin-anim-pop-easing {
  syntax: '*';
  inherits: true;
}

@property --skin-anim-eject-fly-duration {
  syntax: '<time>';
  initial-value: 300ms;
  inherits: true;
}

@property --skin-anim-eject-fly-easing {
  syntax: '*';
  inherits: true;
}

@property --skin-anim-eject-fade-duration {
  syntax: '<time>';
  initial-value: 200ms;
  inherits: true;
}

@property --skin-anim-eject-fade-easing {
  syntax: '*';
  inherits: true;
}

@property --skin-anim-pulse-ring-duration {
  syntax: '<time>';
  initial-value: 1.5s;
  inherits: true;
}

@property --skin-anim-pulse-ring-easing {
  syntax: '*';
  inherits: true;
}
```

> **Note:** `@property` with `syntax: '*'` for easing strings allows
> inheritance but no typed interpolation. Duration tokens get `<time>` for
> typed transition/animation interpolation.
>
> **Re-assembly patterns (three sites):** Decomposed timing tokens are
> re-assembled differently depending on context: (1) `@theme inline`
> shorthand for Tailwind utility classes (Step 3), (2) CSS token
> composition for `--skin-tile-*-animation` state-feedback tokens (Step 4),
> (3) `getComputedStyle` read for imperative JS transitions like eject
> (Step 5). Each pattern suits its consumer — CSS shorthand for declarative
> use, JS read for imperative transitions.

- [ ] **Step 3: Update theme animation shorthand**

In `src/styles.css`, update the `@theme inline` block:

```css
--animate-shake: shake var(--skin-anim-shake-duration)
  var(--skin-anim-shake-easing);
--animate-pop: pop var(--skin-anim-pop-duration)
  var(--skin-anim-pop-easing);
```

- [ ] **Step 4: Update state-feedback animation tokens**

In `src/skin-tokens.css`, update the state-feedback animation tokens to use
the timing tokens:

```css
--skin-tile-correct-animation: pop var(--skin-anim-pop-duration)
  var(--skin-anim-pop-easing);
--skin-tile-wrong-animation: shake var(--skin-anim-shake-duration)
  var(--skin-anim-shake-easing);
```

- [ ] **Step 5: Update slot-animations.ts eject timing**

In `triggerEjectReturn`, use a helper to read the CSS token value for eject
timings. Since these are runtime values, read from `getComputedStyle`:

```ts
// At the top of triggerEjectReturn, after getting ghost element:
const rootStyle = getComputedStyle(document.documentElement);
const flyDuration =
  rootStyle.getPropertyValue('--skin-anim-eject-fly-duration').trim() ||
  '300ms';
const flyEasing =
  rootStyle.getPropertyValue('--skin-anim-eject-fly-easing').trim() ||
  'ease-in';
const fadeDuration =
  rootStyle
    .getPropertyValue('--skin-anim-eject-fade-duration')
    .trim() || '200ms';
const fadeEasing =
  rootStyle.getPropertyValue('--skin-anim-eject-fade-easing').trim() ||
  'ease-out';

// Use in transitions:
ghost.style.transition = `transform ${flyDuration} ${flyEasing}`;
// ...
ghost.style.transition = `opacity ${fadeDuration} ${fadeEasing}`;
```

- [ ] **Step 6: Run tests**

Run: `yarn vitest run src/components/answer-game/Slot/slot-animations.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/skin-tokens.css src/styles.css src/components/answer-game/Slot/slot-animations.ts
git commit -m "feat(skin): tokenize animation timing with @property (R10)

Five animations (shake, pop, pulse-ring, eject-fly, eject-fade) now
have CSS custom property tokens for duration and easing. @property
registers timing tokens with <time> syntax for typed interpolation.
Skins override motion feel without redefining keyframes."
```

---

## Task 13: Migrate Dragon Cave skin to new tokens

> **Prerequisite:** Task 2 must land first. Dragon Cave's `!important` on
> `background` currently overrides `tileStyle()`'s complex inline gradient.
> Removing `!important` is only safe after Task 2 simplifies `tileStyle()` to
> `var(--skin-tile-bg)`.

Update Dragon Cave to use the new token naming convention and remove overrides
that the new architecture eliminates.

**Files:**

- Modify: `src/games/word-spell/skins/dragon-cave-skin.tsx`

- [ ] **Step 1: Update token names in Dragon Cave**

In `dragon-cave-skin.tsx` (lines ~802-845), rename state-feedback tokens and
remove tokens that `:root` inheritance now handles:

**Remove** (R7 — state feedback inherits from `:root`):

- `'--skin-correct-bg': 'transparent'` — no longer needed; correct-state
  tokens are independent of slot base
- `'--skin-correct-border': 'transparent'` — same
- `'--skin-wrong-bg': 'transparent'` — same
- `'--skin-wrong-border': 'transparent'` — same
- `'--skin-hover-border-color': 'transparent'` — R7 separation means hover
  tokens inherit from `:root`
- `'--skin-hover-border-style': 'none'` — same

**Keep** (genuine shape/appearance overrides):

```ts
tokens: {
  '--skin-bank-hole-bg': 'transparent',
  '--skin-bank-hole-shadow': 'none',
  '--skin-slot-bg': 'transparent',
  '--skin-slot-border': 'transparent',
  '--skin-tile-bg': 'transparent',
  '--skin-tile-shadow': 'none',
  '--skin-tile-text-shadow': 'none',
  '--skin-question-audio-bg': '#f7d168',
  '--skin-question-audio-fg': '#000000',
  '--skin-hud-gap': '0.3rem',
  '--skin-hud-dot-size': '15px',
  '--skin-hud-dot-fill': '#F6C562',
  '--skin-hud-dot-empty': '#ffffff',
  '--skin-hud-dot-border': '#ffffff',
  '--skin-hud-dot-current-border': '#F6C562',
  '--skin-hud-fraction-color': '#ffffff',
  '--skin-hud-fraction-sep-color': '#ffffff',
  '--skin-hud-level-color': '#ffffff',
},
```

> **Token count target:** ~15 tokens, down from 21. The 6 removed tokens were
> state-feedback transparent overrides that R7 eliminates.

- [ ] **Step 1b: Remove obsolete inheritance comment**

Remove the CRITICAL comment block in `dragon-cave-skin.tsx` (lines ~822-828)
that warns classic-skin tokens are NOT inherited by other skins. The `:root`
architecture makes this warning obsolete — all tokens now inherit from `:root`
by default, and skins override only what they change.

- [ ] **Step 2: Review `!important` overrides**

Several `!important` declarations in Dragon Cave's scoped CSS can now use
token overrides instead:

**Container-level `!important` (lines ~various):**

- `background: transparent !important` → handled by
  `--skin-tile-bg: transparent` (token override on container scope)
- `box-shadow: none !important` → handled by
  `--skin-tile-shadow: none`
- `border: 0 !important` → handled by `--skin-tile-border: transparent`

**Button-level `!important` (lines ~418-427):**

- Button `background: ... !important` → convert to token override via
  `--skin-tile-bg` scoped to Dragon Cave's container
- Button `border: ... !important` → handled by `--skin-tile-border`

> **Critical:** Any `!important` on `background`, `border-color`, `color`, or
> `box-shadow` of tile elements (buttons) MUST be removed — these are the
> exact properties that `[data-tile-state]` rules target. Leaving them blocks
> state feedback entirely.

Update the scoped CSS string to remove these `!important` declarations where
the token system now handles them. Keep `!important` only for properties that
genuinely need to override component-level styles (e.g., stone texture
`background-image` on `.dragon-cave-stone` which must override the tile
`background`).

- [ ] **Step 2b: Update `.animate-shake` selector to `[data-shaking]`**

Dragon Cave's scoped CSS (lines ~481-485) targets `.animate-shake` class for
shake styling. Task 10 migrated to `[data-shaking]` attribute instead. Update
the selector in the scoped CSS string from `.animate-shake` to `[data-shaking]`.

- [ ] **Step 3: Run existing tests**

Run: `yarn vitest run`
Expected: ALL PASS

- [ ] **Step 4: Visual verification**

Start the dev server and verify Dragon Cave skin in the browser:

1. Bank-reject is visible (red feedback on rejected tiles)
2. Correct-state paint shows on correct tiles
3. Wrong-state paint shows on wrong tiles
4. Stone tile textures render correctly
5. HUD styling matches pre-migration appearance
6. Scene background (cave, lava, dragon) renders correctly

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/skins/dragon-cave-skin.tsx
git commit -m "refactor(skin): migrate Dragon Cave to new token architecture

Removes 6 state-feedback transparent overrides (R7 makes them
unnecessary). Token count: 21 → ~15. Bank-reject now visible without
CSS hacks. Reduces !important usage where token cascade handles it."
```

---

## Task 14: Full integration verification

Verify the entire migration end-to-end across all three games.

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `yarn vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: No errors

- [ ] **Step 3: Run linters**

Run: `yarn fix:md && yarn lint:md`

- [ ] **Step 4: Visual verification in browser**

Start dev server (`yarn dev`) and test each game:

**WordSpell (Classic skin):**

- Empty slots have Classic styling
- Correct tiles show green tint + pop animation
- Wrong tiles show red tint + shake animation
- Bank-reject shows red flash + shake
- Drag preview shows dashed border + pulse-ring
- HUD dots render correctly

**WordSpell (Dragon Cave skin):**

- Slots are transparent (SVG stone background visible)
- State feedback (correct/wrong) uses Classic `:root` colors (not transparent)
- Bank-reject is visible (was previously invisible — this is the key fix)
- Stone tile textures render correctly

**SortNumbers (Classic skin):**

- No `isCustomSkin` visual regressions
- Tiles use token-driven styling uniformly

**NumberMatch (Classic skin):**

- Bank tiles accept skin prop
- Domino/dice tiles render correctly
- tileDecoration works if a skin provides it

- [ ] **Step 5: Push and verify CI**

```bash
git push
```

Expected: All CI checks pass (Lint, Type Check, Unit Tests, Build)

---

## Deferred: XState Animation Sequencing (R8, R9)

These requirements depend on Spec 1a (XState migration for answer-game) and
will be addressed in a follow-up plan.

**R8:** Replace imperative `animationend`/`transitionend` listener chains in
`slot-animations.ts` and `bank-tile-reject-feedback.ts` with XState-driven
state transitions. XState engine broadcasts state changes; CSS reacts to
`data-tile-state` attribute changes.

**R9:** Route both manual-eject (lock-manual tap) and auto-eject through the
same XState `ejecting` state with fly-back animation.

**Migration scope:** 8 imperative `addEventListener` calls across 3 files:

- `slot-animations.ts`: triggerShake animationend, triggerPop animationend,
  triggerEjectReturn with 3 transitionend listeners
- `bank-tile-reject-feedback.ts`: animationend for style restore

**Timer sync invariant:** CSS animation duration and XState timer must stay in
sync. The sync mechanism will be decided in the follow-up plan.

---

## Outstanding Questions (from requirements doc)

These were deferred from the requirements review and should be resolved during
or after implementation:

1. **Keyframe token shape:** This plan uses decomposed tokens
   (`--skin-anim-shake-duration` + `--skin-anim-shake-easing`) rather than
   full shorthand. This gives skins finer control.

2. **Which non-tile tokens need state attributes:** This plan treats non-tile
   tokens (HUD, chrome, question, scene, bank) as appearance-only — they
   inherit from `:root` without needing `data-*` state attributes. If a future
   skin needs state-driven non-tile styling, the pattern established here
   (attribute + CSS rule) extends naturally.

3. **Timer sync mechanism:** Deferred to the XState follow-up plan. Current
   plan tokenizes CSS timing but doesn't address JS/CSS sync.

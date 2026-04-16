# Dark Mode Fix, A11Y Colour Enforcement & VR Tests

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._

**Date:** 2026-04-07  
**Branch strategy:** Single PR (`feat/dark-mode-a11y-vr`)  
**Status:** Approved — ready for implementation plan

---

## Problem Summary

1. **Dark mode backgrounds invisible** — `InstructionsOverlay` (ocean + forest themes) shows a near-white overlay in dark mode. Game config form inputs show white backgrounds with unreadable text.
2. **Root cause** — `ThemeRuntimeProvider` sets shadcn CSS vars (`--background`, `--primary`, etc.) as **inline styles** on `<html>`. Inline styles have higher specificity than the `.dark` class, so dark mode overrides in `styles.css` never apply.
3. **Hardcoded colours** — `BOOKMARK_COLORS` (12 palettes, all light-mode hex values), plus two isolated spots in `InstructionsOverlay` and `SavedConfigChip`.
4. **No enforcement** — nothing prevents new hardcoded colours being added to CSS or TSX inline styles.
5. **No dark-mode VR coverage** — all 4 existing E2E visual tests are light-mode only. `SortNumbers` has no VR tests at all.

---

## Section 1 — CSS Variable Architecture Fix

### Approach

Stop setting shadcn/Tailwind vars inline in the runtime. Only `--bs-*` vars are applied inline. CSS derives shadcn vars from `--bs-*` in the `:root` block; the `.dark` class then correctly wins via cascade order.

### Changes

**`src/lib/theme/css-vars.ts`** — remove these keys from the returned object:

- `--background`, `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--border`, `--ring`

**`src/lib/theme/default-tokens.ts`** — remove the same keys.

**`src/styles.css`** — add to the existing `:root` block:

```css
/* Wire shadcn vars from theme bs-* tokens (inline style sets bs-* only; dark class overrides these) */
--foreground: var(--bs-text);
--background: var(--bs-background);
--primary: var(--bs-primary);
--primary-foreground: var(--bs-surface);
--secondary: var(--bs-secondary);
--secondary-foreground: var(--bs-surface);
--border: var(--bs-accent);
--ring: var(--bs-primary);
```

The `.dark {}` block (already present, already correct) now wins — no changes needed there.

### Result

- `InstructionsOverlay`'s `bg-background/95` goes dark automatically.
- `ConfigFormFields` inputs' `bg-background` go dark automatically.
- Zero component-level changes needed for this fix.

---

## Section 2 — BOOKMARK_COLORS Dark Mode

### Approach

`playBg` (strong saturated hex) is the single source of truth. Pale `bg`/`tagBg` tokens are replaced by CSS using `color-mix` to create transparent overlays from `playBg`. Text uses `playBg` directly (saturated colours read on both light and dark surfaces).

### Changes

**`src/lib/custom game-colors.ts`** — remove `bg`, `tagBg`, `tagText`, `headerText` from `ColorTokens`. Keep `border` and `playBg`.

```ts
export type ColorTokens = {
  border: string; // used for selected ring in colour picker
  playBg: string; // primary colour — all other uses derived from this
};
```

**`src/styles.css`** — add utility classes:

```css
.custom game-bg {
  background: color-mix(
    in srgb,
    var(--custom game-play) 12%,
    transparent
  );
}
.dark .custom game-bg {
  background: color-mix(
    in srgb,
    var(--custom game-play) 20%,
    transparent
  );
}

.custom game-tag-bg {
  background: color-mix(
    in srgb,
    var(--custom game-play) 18%,
    transparent
  );
}
.dark .custom game-tag-bg {
  background: color-mix(
    in srgb,
    var(--custom game-play) 25%,
    transparent
  );
}

.custom game-text {
  color: var(--custom game-play);
}
```

**Components to update** — set `style={{ '--custom game-play': colors.playBg } as React.CSSProperties}` and replace inline background/color with the new utility classes:

- `src/components/GameNameChip.tsx`
- `src/components/SavedConfigChip.tsx`
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- `src/components/SaveConfigDialog.tsx`

---

## Section 3 — Hardcoded Colour Cleanup

| File                      | Location | Current value             | Replacement                     |
| ------------------------- | -------- | ------------------------- | ------------------------------- |
| `InstructionsOverlay.tsx` | line 124 | `'rgba(255,255,255,0.7)'` | Tailwind `text-white/70` class  |
| `SavedConfigChip.tsx`     | line 99  | `'rgb(254 226 226)'`      | `bg-bs-error/15` Tailwind class |

---

## Section 4 — Linting Enforcement

### Stylelint (CSS files)

Add to `.stylelintrc`:

```yaml
color-named: 'never'
declaration-property-value-disallowed-list:
  - {
      '/^(color|background|background-color|border-color|outline-color|fill|stroke)$/':
        ['/^#/', '/^rgb/', '/^rgba/', '/^hsl/', '/^oklch/'],
    }
```

Allowlist exceptions: `transparent`, `inherit`, `currentColor`, `none` — these are not matched by the patterns above.

Run via existing `yarn lint:css` command.

### ESLint (TSX inline styles)

Add to `eslint.config.js` using `no-restricted-syntax` (no new package needed):

```js
{
  selector:
    'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke)$/i] > Literal[value=/^(#|rgb|rgba|hsl|oklch)/i]',
  message:
    'Use a CSS variable (var(--...)) instead of a hardcoded colour in inline styles.',
}
```

**Exemption:** `src/lib/custom game-colors.ts` is a constants file (not a JSX file), so the JSX rule does not apply. `playBg`/`border` hex values there remain the canonical palette definitions.

---

## Section 5 — VR Tests

### E2E Playwright (`e2e/visual.spec.ts`)

Add helper:

```ts
async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  });
}
```

**Test matrix:**

| Screen                                | Light    | Dark |
| ------------------------------------- | -------- | ---- |
| Home                                  | existing | new  |
| Game shell                            | existing | new  |
| WordSpell mid-game                    | existing | new  |
| NumberMatch mid-game                  | existing | new  |
| SortNumbers mid-game                  | new      | new  |
| InstructionsOverlay (before Let's go) | new      | new  |

Total snapshots: 12 (up from 4). All chromium-only (matching existing baseline approach).

**InstructionsOverlay test:** navigate to `/en/game/sort-numbers`, wait for the overlay's "Let's go" button to appear, screenshot — do not click.

**SortNumbers test:** navigate to `/en/game/sort-numbers`, click "Let's go", wait for tile bank to appear, screenshot.

### Storybook VR (component-level)

Add `withDarkMode` decorator in `.storybook/decorators.tsx`:

```tsx
export const withDarkMode: Decorator = (Story) => (
  <div
    className="dark"
    style={{ background: 'oklch(14.5% 0 0)', padding: '1rem' }}
  >
    <Story />
  </div>
);
```

**New/updated story files:**

| File                                            | Stories to add                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `InstructionsOverlay.stories.tsx` (new)         | `Default`, `SettingsExpanded`, `DefaultDark`, `SettingsExpandedDark` |
| `ConfigFormFields.stories.tsx` (new)            | `AllFieldTypes`, `AllFieldTypesDark`                                 |
| `GameNameChip.stories.tsx` (update existing)    | `*Dark` variants for each existing story                             |
| `SavedConfigChip.stories.tsx` (update existing) | `*Dark` variants                                                     |
| `SortNumbersTileBank.stories.tsx` (new)         | `Default`, `DefaultDark`                                             |
| `NumberSequenceSlots.stories.tsx` (new)         | `Default`, `DefaultDark`                                             |

---

## A11Y Contrast Requirement

All colours used by the design system must meet **WCAG AA** (4.5:1 for text, 3:1 for UI components) in both light and dark mode. The `--bs-*` palette in `src/styles.css` and `src/db/seed-themes.ts` already meets AA for the ocean and forest presets (documented in existing comments). New dark-mode colour additions (e.g. `color-mix` overlays for custom games) must be validated before merging — the VR tests serve as the visual gate; contrast ratio checks are a PR checklist item.

---

## Files Changed Summary

| File                                                                     | Change type                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/styles.css`                                                         | Add `:root` shadcn-from-bs derivations; add custom game utility classes |
| `src/lib/theme/css-vars.ts`                                              | Remove shadcn vars from inline set                                      |
| `src/lib/theme/default-tokens.ts`                                        | Remove shadcn vars from inline set                                      |
| `src/lib/custom game-colors.ts`                                          | Slim `ColorTokens` to `border` + `playBg`                               |
| `src/components/GameNameChip.tsx`                                        | Switch to `--custom game-play` + utility classes                        |
| `src/components/SavedConfigChip.tsx`                                     | Switch to `--custom game-play` + utility classes; fix hardcoded red     |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` | Switch to `--custom game-play`; fix hardcoded white/70                  |
| `src/components/SaveConfigDialog.tsx`                                    | Switch to `--custom game-play` + utility classes                        |
| `.stylelintrc`                                                           | Add `color-named` + `declaration-property-value-disallowed-list`        |
| `eslint.config.js`                                                       | Add `no-restricted-syntax` inline colour rule                           |
| `e2e/visual.spec.ts`                                                     | Add dark variants + SortNumbers + InstructionsOverlay                   |
| `.storybook/decorators.tsx`                                              | New `withDarkMode` decorator                                            |
| 6x story files                                                           | New/updated with dark variants                                          |

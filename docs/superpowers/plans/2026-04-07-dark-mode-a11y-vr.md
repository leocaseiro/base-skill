# Dark Mode Fix, A11Y Colour Enforcement & VR Tests Implementation Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dark mode CSS variable specificity, replace hardcoded custom game colours with CSS utility classes, add Stylelint/ESLint colour enforcement, expand VR test coverage to include dark mode and SortNumbers screens, and add a Storybook theme showcase page with 4 locked-theme VR snapshots (Ocean/Forest × light/dark).

**Architecture:** CSS-first fix — inline styles only set `--bs-*` vars; shadcn vars derive from `--bs-*` in `:root` so the `.dark` class cascade wins. Custom game colours collapse to two tokens (`border`, `playBg`); CSS utility classes using `color-mix` handle all other tints. Components set `--custom game-play` as a CSS custom property and use utility classes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS `color-mix()`, Playwright E2E, Storybook 10, Vitest.

---

## File Map

| Action | Path                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| Modify | `src/styles.css`                                                                 |
| Modify | `src/lib/theme/css-vars.ts`                                                      |
| Modify | `src/lib/theme/default-tokens.ts`                                                |
| Modify | `src/lib/custom game-colors.ts`                                                  |
| Modify | `src/components/GameNameChip.tsx`                                                |
| Modify | `src/components/SavedConfigChip.tsx`                                             |
| Modify | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`         |
| Modify | `src/components/SaveConfigDialog.tsx`                                            |
| Modify | `.stylelintrc.yaml`                                                              |
| Modify | `eslint.config.js`                                                               |
| Modify | `e2e/visual.spec.ts`                                                             |
| Create | `.storybook/decorators.tsx`                                                      |
| Create | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx` |
| Create | `src/components/ConfigFormFields.stories.tsx`                                    |
| Create | `src/components/GameNameChip.stories.tsx`                                        |
| Create | `src/components/SavedConfigChip.stories.tsx`                                     |
| Create | `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.stories.tsx`     |
| Create | `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.stories.tsx`     |
| Modify | `.storybook/decorators/withTheme.tsx`                                            |
| Modify | `.storybook/preview.tsx`                                                         |
| Create | `src/stories/ThemeShowcase.stories.tsx`                                          |

---

## Task 1: Worktree Setup

**Files:**

- None (git plumbing only)

- [ ] **Step 1: Create worktree from project root**

Run from `/Users/leocaseiro/Sites/base-skill`:

```bash
git worktree add ./worktrees/feat-dark-mode-a11y-vr -b feat/dark-mode-a11y-vr
cd ./worktrees/feat-dark-mode-a11y-vr && yarn install
```

Expected: `Preparing worktree (new branch 'feat/dark-mode-a11y-vr')` — no errors.

---

## Task 2: CSS Variable Architecture Fix

The root cause of dark mode not working: `ThemeRuntimeProvider` sets shadcn CSS vars (`--background`, `--primary`, etc.) as inline styles on `<html>`, which have higher specificity than the `.dark` class in `styles.css`. Fix: only set `--bs-*` vars inline; derive shadcn vars from `--bs-*` in the `:root` block so the cascade works correctly.

**Files:**

- Modify: `src/styles.css`
- Modify: `src/lib/theme/css-vars.ts`
- Modify: `src/lib/theme/default-tokens.ts`

- [ ] **Step 1: Run TypeScript check to confirm it currently passes (baseline)**

```bash
yarn typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Add shadcn-from-bs derivations to `:root` in `src/styles.css`**

Find the `:root` block (ends around line 83 with `--bs-font-weight-default`). Add inside that block, before the closing `}`:

```css
/* Wire shadcn vars from --bs-* tokens; inline style only sets --bs-*, so .dark class wins */
--foreground: var(--bs-text);
--background: var(--bs-background);
--primary: var(--bs-primary);
--primary-foreground: var(--bs-surface);
--secondary: var(--bs-secondary);
--secondary-foreground: var(--bs-surface);
--border: var(--bs-accent);
--ring: var(--bs-primary);
```

- [ ] **Step 3: Remove shadcn vars from `src/lib/theme/css-vars.ts`**

Replace the entire `themeDocToCssVars` function body so it only returns `--bs-*` keys:

```ts
import { defaultThemeCssVars as defaultThemeCssVariables } from './default-tokens';
import type { ThemeDoc } from '@/db/schemas/themes';

export function themeDocToCssVars(
  document_: ThemeDoc,
): Record<string, string> {
  const { primary, secondary, background, surface, text, accent } =
    document_.colors;
  return {
    '--bs-primary': primary,
    '--bs-secondary': secondary,
    '--bs-background': background,
    '--bs-surface': surface,
    '--bs-text': text,
    '--bs-accent': accent,
    '--bs-success': defaultThemeCssVariables['--bs-success']!,
    '--bs-warning': defaultThemeCssVariables['--bs-warning']!,
    '--bs-error': defaultThemeCssVariables['--bs-error']!,
  };
}

export function applyThemeCssVars(
  element: HTMLElement,
  variables: Record<string, string>,
): void {
  for (const [k, v] of Object.entries(variables)) {
    element.style.setProperty(k, v);
  }
}
```

- [ ] **Step 4: Remove shadcn vars from `src/lib/theme/default-tokens.ts`**

Replace the entire file content:

```ts
/**
 * Static UI tokens when RxDB has no active theme (anonymous / first paint).
 * Matches `theme_ocean_preset` in seed-themes so hydration matches the default
 * settings theme and primary/foreground pairs meet WCAG AA (avoids candy #FF6B6B
 * + white failing axe in slower engines before DB is ready).
 */
export const defaultThemeCssVars: Record<string, string> = {
  '--bs-primary': '#0077B6',
  '--bs-secondary': '#00B4D8',
  '--bs-background': '#CAF0F8',
  '--bs-surface': '#FFFFFF',
  '--bs-text': '#03045E',
  '--bs-accent': '#F77F00',
  '--bs-success': '#6BCB77',
  '--bs-warning': '#F4A261',
  '--bs-error': '#E63946',
};
```

- [ ] **Step 5: Run TypeScript check — must pass**

```bash
yarn typecheck
```

Expected: 0 errors. If errors appear in `withTheme.tsx` or similar, those files referenced the old shadcn keys — update them to remove any references to removed keys.

- [ ] **Step 6: Run unit tests**

```bash
yarn test
```

Expected: all pass (CSS change has no effect on unit tests; `themeDocToCssVars` change only removes returned keys).

- [ ] **Step 7: Commit**

```bash
git add src/styles.css src/lib/theme/css-vars.ts src/lib/theme/default-tokens.ts
git commit -m "fix(theme): wire shadcn vars from --bs-* in CSS so .dark class wins"
```

---

## Task 3: Custom game CSS Utility Classes + Slim ColorTokens Type

Replace the 6-token `ColorTokens` type with 2 tokens (`border`, `playBg`). All light/dark tints now come from CSS utility classes using `color-mix`.

**Files:**

- Modify: `src/styles.css`
- Modify: `src/lib/custom game-colors.ts`

- [ ] **Step 1: Add custom game utility classes to `src/styles.css`**

After the `.dark {}` media query block (after line ~151), add:

```css
/* Custom game colour utilities — derived from --custom game-play set per-component */
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

- [ ] **Step 2: Slim `ColorTokens` in `src/lib/custom game-colors.ts`**

Replace the `ColorTokens` type and all palette entries:

```ts
// src/lib/custom game-colors.ts
export const BOOKMARK_COLOR_KEYS = [
  'indigo',
  'teal',
  'rose',
  'amber',
  'sky',
  'lime',
  'purple',
  'orange',
  'pink',
  'emerald',
  'slate',
  'cyan',
] as const;

export type Custom gameColorKey = (typeof BOOKMARK_COLOR_KEYS)[number];

export type ColorTokens = {
  border: string; // used for selected ring in colour picker
  playBg: string; // primary colour — all other uses derived from this via CSS utility classes
};

export const BOOKMARK_COLORS: Record<Custom gameColorKey, ColorTokens> = {
  indigo: { border: '#c7d2fe', playBg: '#6366f1' },
  teal: { border: '#99f6e4', playBg: '#14b8a6' },
  rose: { border: '#fecdd3', playBg: '#f43f5e' },
  amber: { border: '#fde68a', playBg: '#f59e0b' },
  sky: { border: '#bae6fd', playBg: '#0ea5e9' },
  lime: { border: '#d9f99d', playBg: '#84cc16' },
  purple: { border: '#e9d5ff', playBg: '#a855f7' },
  orange: { border: '#fed7aa', playBg: '#f97316' },
  pink: { border: '#fbcfe8', playBg: '#ec4899' },
  emerald: { border: '#a7f3d0', playBg: '#10b981' },
  slate: { border: '#cbd5e1', playBg: '#64748b' },
  cyan: { border: '#a5f3fc', playBg: '#06b6d4' },
};

export const DEFAULT_BOOKMARK_COLOR: Custom gameColorKey = 'indigo';
```

- [ ] **Step 3: Run TypeScript check — expect failures in 4 component files**

```bash
yarn typecheck
```

Expected: TypeScript errors in `GameNameChip.tsx`, `SavedConfigChip.tsx`, `InstructionsOverlay.tsx`, `SaveConfigDialog.tsx` (accessing removed properties `bg`, `tagBg`, `tagText`, `headerText`). This is the "failing test" — proceed to Task 4 to fix.

---

## Task 4: Update All Components to Use Custom game Utility Classes

Fix TypeScript failures from Task 3 by updating all 4 components to use `--custom game-play` CSS var + utility classes. Also fixes the two hardcoded colours (Section 3 of spec).

**Files:**

- Modify: `src/components/GameNameChip.tsx`
- Modify: `src/components/SavedConfigChip.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/SaveConfigDialog.tsx`

- [ ] **Step 1: Update `src/components/GameNameChip.tsx`**

Full file replacement:

```tsx
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import type { JSX } from 'react';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/custom game-colors';

type GameNameChipProps = {
  title: string;
  custom gameName?: string;
  custom gameColor?: Custom gameColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  custom gameName,
  custom gameColor = DEFAULT_BOOKMARK_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = custom gameName
    ? BOOKMARK_COLORS[custom gameColor]
    : BOOKMARK_COLORS.slate;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={
        {
          borderColor: colors.border,
          '--custom game-play': colors.playBg,
        } as React.CSSProperties
      }
    >
      <div className="custom game-bg flex min-h-12 items-center gap-2 px-3">
        <span className="custom game-text text-sm font-bold">{title}</span>
        {custom gameName && (
          <span
            className="custom game-bg custom game-text rounded border px-2 py-0.5 text-xs font-semibold"
            style={{ borderColor: colors.border }}
          >
            {custom gameName}
          </span>
        )}
        {!custom gameName && subject && (
          <span className="custom game-bg rounded px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {subject}
          </span>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update `src/components/SavedConfigChip.tsx`**

Full file replacement:

```tsx
// src/components/SavedConfigChip.tsx
import { useState } from 'react';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import type { ConfigField } from '@/lib/config-fields';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { BOOKMARK_COLORS } from '@/lib/custom game-colors';
import { configToTags } from '@/lib/config-tags';

type SavedConfigChipProps = {
  doc: SavedGameConfigDoc;
  configFields: ConfigField[];
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (
    id: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
};

export const SavedConfigChip = ({
  doc,
  configFields,
  onPlay,
  onDelete,
  onSave,
}: SavedConfigChipProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [editConfig, setEditConfig] = useState(doc.config);
  const [editName, setEditName] = useState(doc.name);

  const colorKey = doc.color as Custom gameColorKey;
  const colors = BOOKMARK_COLORS[colorKey];
  const tags = configToTags(doc.config);

  const handleCancel = () => {
    setEditConfig(doc.config);
    setEditName(doc.name);
    setExpanded(false);
  };

  const handleSave = async () => {
    await onSave(doc.id, editConfig, editName);
    setExpanded(false);
  };

  return (
    <div
      className="overflow-hidden rounded-xl border-2"
      style={
        {
          '--custom game-play': colors.playBg,
          borderColor: expanded ? colors.playBg : colors.border,
          boxShadow: expanded
            ? `0 0 0 3px color-mix(in srgb, var(--custom game-play) 12%, transparent)`
            : undefined,
        } as React.CSSProperties
      }
    >
      {/* Header row */}
      <div
        className={`flex min-h-12 items-stretch ${!expanded ? 'custom game-tag-bg' : ''}`}
        style={
          expanded ? { background: 'var(--custom game-play)' } : undefined
        }
      >
        <button
          type="button"
          aria-label={`Expand ${doc.name}`}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-12 flex-1 items-center gap-2 px-3 text-left"
        >
          <span
            className={`text-sm font-semibold ${expanded ? 'text-white' : 'custom game-text'}`}
          >
            {doc.name}
          </span>
          <span
            className={`ml-auto text-xs ${expanded ? 'text-white/70' : 'custom game-text'}`}
          >
            {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Play ${doc.name}`}
          onClick={() => onPlay(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center text-sm text-white"
          style={{ background: 'var(--custom game-play)' }}
        >
          ▶
        </button>
        <button
          type="button"
          aria-label={`Delete ${doc.name}`}
          onClick={() => onDelete(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center border-l border-destructive/20 text-sm text-destructive"
          style={{
            background:
              'color-mix(in srgb, var(--bs-error) 15%, transparent)',
          }}
        >
          ✕
        </button>
      </div>

      {/* Collapsed: config summary tags */}
      {!expanded && (
        <div className="custom game-bg flex flex-wrap gap-1 px-3 pb-2 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="custom game-tag-bg custom game-text rounded px-2 py-0.5 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: inline form */}
      {expanded && (
        <div className="custom game-bg flex flex-col gap-3 p-3">
          <ConfigFormFields
            fields={configFields}
            config={editConfig}
            onChange={setEditConfig}
          />
          <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
            Custom game name
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Save"
              onClick={() => void handleSave()}
              className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Save
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={handleCancel}
              className="h-12 flex-1 rounded-xl border border-input bg-background text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Update `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`**

Key changes:

- Add `'--custom game-play': settingsColors.playBg` to settings section div
- Replace `style={{ background: settingsColors.playBg }}` with `style={{ background: 'var(--custom game-play)' }}`
- Replace `color: settingsOpen ? 'rgba(255,255,255,0.7)' : undefined` with `className` conditional
- `bg-background/95` on the dialog div already works after Task 2

Full file replacement:

```tsx
// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import type { ConfigField } from '@/lib/config-fields';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameNameChip } from '@/components/GameNameChip';
import {
  BOOKMARK_COLORS,
  BOOKMARK_COLOR_KEYS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/custom game-colors';
import { configToTags } from '@/lib/config-tags';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  custom gameName?: string;
  custom gameColor?: Custom gameColorKey;
  subject?: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveCustom game: (
    name: string,
    color: Custom gameColorKey,
  ) => Promise<void>;
  onUpdateCustom game?: (
    name: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  configFields: ConfigField[];
}

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  custom gameName,
  custom gameColor = DEFAULT_BOOKMARK_COLOR,
  subject,
  config,
  onConfigChange,
  onSaveCustom game,
  onUpdateCustom game,
  configFields,
}: InstructionsOverlayProps) => {
  const { t } = useTranslation('games');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newCustom gameName, setNewCustom gameName] = useState('');
  const [newCustom gameColor, setNewCustom gameColor] =
    useState<Custom gameColorKey>(DEFAULT_BOOKMARK_COLOR);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = BOOKMARK_COLORS[custom gameColor];
  const tags = configToTags(config);

  return createPortal(
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 flex flex-col items-center justify-start overflow-y-auto bg-background/95 px-5 pb-8 pt-20"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        {/* 1. Game name chip */}
        <div className="w-full">
          <GameNameChip
            title={gameTitle}
            custom gameName={custom gameName}
            custom gameColor={custom gameColor}
            subject={subject}
          />
        </div>

        {/* 2. Instructions text */}
        <p className="max-w-xs text-center text-base font-semibold text-foreground leading-relaxed">
          {text}
        </p>

        {/* 3. Let's go button */}
        <button
          type="button"
          onClick={onStart}
          className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
        >
          {t('instructions.lets-go')}
        </button>

        {/* 4. Settings chip (collapsed by default) */}
        <div
          className="w-full overflow-hidden rounded-xl border border-border"
          style={
            {
              '--custom game-play': settingsColors.playBg,
            } as React.CSSProperties
          }
        >
          {/* Settings header */}
          <button
            type="button"
            aria-label={t('instructions.settings')}
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex min-h-12 w-full items-center gap-2 bg-muted px-3 text-left"
            style={
              settingsOpen
                ? { background: 'var(--custom game-play)' }
                : undefined
            }
          >
            <span
              className={`flex-1 text-sm font-semibold ${settingsOpen ? 'text-white' : ''}`}
            >
              {t('instructions.settings')}
            </span>
            <span
              className={`text-xs ${settingsOpen ? 'text-white/70' : ''}`}
            >
              {settingsOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Collapsed: config summary tags */}
          {!settingsOpen && (
            <div className="flex flex-wrap gap-1 bg-muted/50 px-3 pb-2 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded: form + save actions */}
          {settingsOpen && (
            <div className="flex flex-col gap-3 bg-muted/30 p-3">
              <ConfigFormFields
                fields={configFields}
                config={config}
                onChange={onConfigChange}
              />

              <div className="border-t border-border pt-3 flex flex-col gap-2">
                {custom gameName && onUpdateCustom game ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                      Custom game name
                      <input
                        type="text"
                        defaultValue={custom gameName}
                        id="instructions-custom game-name"
                        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Update ${custom gameName}`}
                      onClick={() => {
                        const el =
                          document.querySelector<HTMLInputElement>(
                            '#instructions-custom game-name',
                          );
                        void onUpdateCustom game(
                          el?.value ?? custom gameName,
                          config,
                        );
                      }}
                      className="h-12 w-full rounded-xl font-bold text-white text-sm"
                      style={{ background: 'var(--custom game-play)' }}
                    >
                      {t('instructions.updateCustom game', {
                        name: custom gameName,
                        defaultValue: `Update "${custom gameName}"`,
                      })}
                    </button>
                    <button
                      type="button"
                      aria-label="Save as new custom game"
                      onClick={() => setSettingsOpen(false)}
                      className="h-12 w-full rounded-xl border border-input bg-background text-sm font-semibold text-primary"
                    >
                      {t('instructions.saveAsNew', {
                        defaultValue: 'Save as new custom game…',
                      })}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {t('common:saveConfig.saveCustom gameLabel', {
                        defaultValue: 'Save as custom game',
                      })}
                    </span>
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                      role="group"
                      aria-label="Custom game color"
                    >
                      {BOOKMARK_COLOR_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-label={key}
                          aria-pressed={newCustom gameColor === key}
                          onClick={() => setNewCustom gameColor(key)}
                          className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            background: BOOKMARK_COLORS[key].playBg,
                            borderColor:
                              newCustom gameColor === key
                                ? BOOKMARK_COLORS[key].playBg
                                : 'transparent',
                            outline:
                              newCustom gameColor === key
                                ? '3px solid white'
                                : undefined,
                            outlineOffset:
                              newCustom gameColor === key
                                ? '-4px'
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustom gameName}
                        onChange={(e) =>
                          setNewCustom gameName(e.target.value)
                        }
                        placeholder="e.g. Easy Mode"
                        className="h-12 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Save custom game"
                        onClick={() => {
                          if (newCustom gameName.trim()) {
                            void onSaveCustom game(
                              newCustom gameName.trim(),
                              newCustom gameColor,
                            );
                            setNewCustom gameName('');
                          }
                        }}
                        className="h-12 w-12 flex-shrink-0 rounded-lg bg-primary text-lg text-primary-foreground"
                      >
                        🔖
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
```

- [ ] **Step 4: Update `src/components/SaveConfigDialog.tsx`**

The preview section uses `previewColors.tagBg` and `previewColors.headerText` — replace with custom game utility classes. Set `--custom game-play` on the preview container.

Replace the preview `<div className="flex flex-col gap-1">` block (lines ~120–144) with:

```tsx
{
  /* Preview */
}
<div className="flex flex-col gap-1">
  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
    Preview
  </span>
  <div
    className="inline-flex overflow-hidden rounded-lg border"
    style={
      {
        borderColor: previewColors.border,
        '--custom game-play': previewColors.playBg,
      } as React.CSSProperties
    }
  >
    <div className="custom game-tag-bg custom game-text px-3 py-2 text-sm font-semibold">
      {name || t('saveConfig.placeholder')}
    </div>
    <div
      className="flex w-10 items-center justify-center text-sm text-white"
      style={{ background: 'var(--custom game-play)' }}
    >
      ▶
    </div>
  </div>
</div>;
```

Also remove the `previewColors` variable (since we no longer access `previewColors.tagBg` / `previewColors.headerText`). Keep `previewColors.border` and `previewColors.playBg`.

The `const previewColors = BOOKMARK_COLORS[color];` line stays — only `border` and `playBg` are now used.

- [ ] **Step 5: Run TypeScript check — must pass (0 errors)**

```bash
yarn typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Run unit tests**

```bash
yarn test
```

Expected: all pass (existing tests check DOM content and interactions, not inline styles).

- [ ] **Step 7: Commit**

```bash
git add src/lib/custom game-colors.ts src/styles.css \
  src/components/GameNameChip.tsx src/components/SavedConfigChip.tsx \
  src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx \
  src/components/SaveConfigDialog.tsx
git commit -m "feat(custom game): replace hardcoded colour tokens with CSS utility classes"
```

---

## Task 5: Linting Enforcement

Prevent future hardcoded colours via Stylelint (CSS files) and ESLint `no-restricted-syntax` (JSX inline styles).

**Files:**

- Modify: `.stylelintrc.yaml`
- Modify: `eslint.config.js`

- [ ] **Step 1: Update `.stylelintrc.yaml`**

Replace entire file:

```yaml
extends:
  - stylelint-config-standard
rules:
  at-rule-no-unknown:
    - true
    - ignoreAtRules:
        - theme
        - plugin
        - custom-variant
        - apply
        - layer
        - tailwind
        - utility
        - variant
        - source
  import-notation: string
  property-no-unknown: true
  color-no-invalid-hex: true
  declaration-block-no-duplicate-properties: true
  color-named: 'never'
  declaration-property-value-disallowed-list:
    - '/^(color|background|background-color|border-color|outline-color|fill|stroke)$/':
        - '/^#/'
        - '/^rgb/'
        - '/^rgba/'
        - '/^hsl/'
        - '/^oklch/'
```

Allowlist note: `transparent`, `inherit`, `currentColor`, `none` are not matched by the patterns above, so they remain allowed.

- [ ] **Step 2: Run Stylelint to check for violations**

```bash
yarn lint:css
```

If violations appear in `src/styles.css` (the `--bs-*` definitions use `#hex` values in `:root`), these are CSS variable definitions, not `color:` or `background:` property assignments, so they should NOT be caught by `declaration-property-value-disallowed-list`. If they are caught, add them to an `ignoreProperties` allowlist for the `:root` block, or scope the rule to exclude variable definitions.

Expected: 0 violations (the `--bs-*` definitions are custom property declarations, not colour properties).

- [ ] **Step 3: Add `no-restricted-syntax` rule to `eslint.config.js`**

Find the rules object in the second config block (starting around line 46, containing `unicorn/filename-case`). Add the inline-colour rule inside that `rules` object:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke)$/i] > Literal[value=/^(#|rgb|rgba|hsl|oklch)/i]',
          message:
            'Use a CSS variable (var(--...)) instead of a hardcoded colour in inline styles.',
        },
      ],
```

- [ ] **Step 4: Run ESLint to check for violations**

```bash
yarn lint
```

Expected: 0 errors. The `BOOKMARK_COLORS` object in `src/lib/custom game-colors.ts` is NOT a JSX file, so the JSX selector rule doesn't apply there. The `playBg`/`border` hex values in that file remain as the canonical palette definitions.

- [ ] **Step 5: Commit**

```bash
git add .stylelintrc.yaml eslint.config.js
git commit -m "feat(lint): enforce no hardcoded colours in CSS or JSX inline styles"
```

---

## Task 6: E2E VR Tests — Dark Mode, SortNumbers, InstructionsOverlay

Expand from 4 light-mode screenshots to 12: add dark variants for all existing screens, plus SortNumbers (light + dark) and InstructionsOverlay (light + dark).

**Files:**

- Modify: `e2e/visual.spec.ts`

- [ ] **Step 1: Replace `e2e/visual.spec.ts` with expanded test matrix**

```ts
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  });
}

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

// ── Home ────────────────────────────────────────────────────────────────────

test('@visual home page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('@visual home page dark', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('home-dark.png', {
    fullPage: true,
  });
});

// ── Game shell ───────────────────────────────────────────────────────────────

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', {
    fullPage: true,
  });
});

test('@visual game shell layout dark', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('game-shell-dark.png', {
    fullPage: true,
  });
});

// ── WordSpell ────────────────────────────────────────────────────────────────

test('@visual WordSpell picture mode mid-game layout', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('word-spell-picture-mode.png', {
    fullPage: true,
  });
});

test('@visual WordSpell picture mode mid-game layout dark', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'word-spell-picture-mode-dark.png',
    {
      fullPage: true,
    },
  );
});

// ── NumberMatch ──────────────────────────────────────────────────────────────

test('@visual NumberMatch numeral-to-group layout', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group.png',
    { fullPage: true },
  );
});

test('@visual NumberMatch numeral-to-group layout dark', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group-dark.png',
    { fullPage: true },
  );
});

// ── SortNumbers ──────────────────────────────────────────────────────────────

test('@visual SortNumbers mid-game layout', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('sort-numbers.png', {
    fullPage: true,
  });
});

test('@visual SortNumbers mid-game layout dark', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('sort-numbers-dark.png', {
    fullPage: true,
  });
});

// ── InstructionsOverlay ──────────────────────────────────────────────────────

test('@visual InstructionsOverlay before start', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('instructions-overlay.png', {
    fullPage: true,
  });
});

test('@visual InstructionsOverlay before start dark', async ({
  page,
}) => {
  await page.goto('/en/game/sort-numbers');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('instructions-overlay-dark.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
yarn typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add e2e/visual.spec.ts
git commit -m "test(vr): add dark mode + SortNumbers + InstructionsOverlay E2E screenshots"
```

- [ ] **Step 4: Update VR baselines (requires Docker + dev server running)**

```bash
# Terminal 1: start dev server
yarn dev

# Terminal 2: update baselines
yarn test:vr:update
```

Expected: new baseline PNGs generated in `e2e/` or `playwright-snapshots/` (wherever the existing baselines live). Review the generated images — dark backgrounds should be visible, overlays should be dark.

- [ ] **Step 5: Commit updated baselines**

```bash
git add e2e/**/*.png
git commit -m "test(vr): update baselines for dark mode and new screens"
```

---

## Task 7: Storybook `withDarkMode` Decorator

Create a component-level dark mode decorator that wraps a story in a `.dark` div, so individual story variants can show the dark appearance without switching the global Storybook theme.

**Files:**

- Create: `.storybook/decorators.tsx`

- [ ] **Step 1: Create `.storybook/decorators.tsx`**

```tsx
import type { Decorator } from '@storybook/react';

/**
 * Wraps the story in a dark-mode container.
 * Use on individual stories that should always render dark,
 * independently of the global Storybook theme switcher.
 *
 * Tailwind v4 @custom-variant dark (&:is(.dark *)) means any
 * .dark ancestor enables dark utility classes on descendants.
 */
export const withDarkMode: Decorator = (Story) => (
  <div
    className="dark"
    style={{ background: 'oklch(14.5% 0 0)', padding: '1rem' }}
  >
    <Story />
  </div>
);
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add .storybook/decorators.tsx
git commit -m "feat(storybook): add withDarkMode component-level decorator"
```

---

## Task 8: Storybook Story Files

Create/update 6 story files with dark variants. All use named exports (no `export default` → `export default meta` is the CSF convention, exempted by eslint.config.js).

**Files:**

- Create: `src/components/GameNameChip.stories.tsx`
- Create: `src/components/SavedConfigChip.stories.tsx`
- Create: `src/components/ConfigFormFields.stories.tsx`
- Create: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`
- Create: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.stories.tsx`
- Create: `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.stories.tsx`

- [ ] **Step 1: Create `src/components/GameNameChip.stories.tsx`**

```tsx
import { withDarkMode } from '../../../.storybook/decorators';
import { GameNameChip } from './GameNameChip';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameNameChip> = {
  component: GameNameChip,
  tags: ['autodocs'],
  args: {
    title: 'Word Spell',
  },
};
export default meta;

type Story = StoryObj<typeof GameNameChip>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};

export const WithCustom game: Story = {
  args: {
    custom gameName: 'Easy Mode',
    custom gameColor: 'indigo',
  },
};

export const WithCustom gameDark: Story = {
  args: {
    custom gameName: 'Easy Mode',
    custom gameColor: 'indigo',
  },
  decorators: [withDarkMode],
};

export const WithSubject: Story = {
  args: { subject: 'reading' },
};

export const WithSubjectDark: Story = {
  args: { subject: 'reading' },
  decorators: [withDarkMode],
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(
        [
          'indigo',
          'teal',
          'rose',
          'amber',
          'sky',
          'lime',
          'purple',
          'orange',
          'pink',
          'emerald',
          'slate',
          'cyan',
        ] as const
      ).map((color) => (
        <GameNameChip
          key={color}
          title="Word Spell"
          custom gameName={color}
          custom gameColor={color}
        />
      ))}
    </div>
  ),
};

export const AllColorsDark: Story = {
  ...AllColors,
  decorators: [withDarkMode],
};
```

- [ ] **Step 2: Create `src/components/SavedConfigChip.stories.tsx`**

```tsx
import { withDarkMode } from '../../../.storybook/decorators';
import { SavedConfigChip } from './SavedConfigChip';
import type { Meta, StoryObj } from '@storybook/react';
import type { ConfigField } from '@/lib/config-fields';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';

const mockDoc: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: { inputMethod: 'drag', totalRounds: 8, mode: 'picture' },
  createdAt: new Date().toISOString(),
  color: 'indigo',
};

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'Drag' },
      { value: 'type', label: 'Type' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
];

const meta: Meta<typeof SavedConfigChip> = {
  component: SavedConfigChip,
  tags: ['autodocs'],
  args: {
    doc: mockDoc,
    configFields: fields,
    onPlay: () => {},
    onDelete: () => {},
    onSave: async () => {},
  },
  argTypes: {
    onPlay: { action: 'played' },
    onDelete: { action: 'deleted' },
    onSave: { action: 'saved' },
  },
};
export default meta;

type Story = StoryObj<typeof SavedConfigChip>;

export const Collapsed: Story = {};

export const CollapsedDark: Story = {
  decorators: [withDarkMode],
};

export const TealColor: Story = {
  args: { doc: { ...mockDoc, color: 'teal' } },
};

export const TealColorDark: Story = {
  args: { doc: { ...mockDoc, color: 'teal' } },
  decorators: [withDarkMode],
};
```

- [ ] **Step 3: Create `src/components/ConfigFormFields.stories.tsx`**

```tsx
import { withDarkMode } from '../../.storybook/decorators';
import { ConfigFormFields } from './ConfigFormFields';
import type { Meta, StoryObj } from '@storybook/react';
import type { ConfigField } from '@/lib/config-fields';

const allFields: ConfigField[] = [
  {
    type: 'select',
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'picture', label: 'Picture' },
      { value: 'text', label: 'Text' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'checkbox',
    key: 'ttsEnabled',
    label: 'Text-to-speech',
  },
];

const meta: Meta<typeof ConfigFormFields> = {
  component: ConfigFormFields,
  tags: ['autodocs'],
  args: {
    fields: allFields,
    config: { mode: 'picture', totalRounds: 8, ttsEnabled: true },
    onChange: () => {},
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
};
export default meta;

type Story = StoryObj<typeof ConfigFormFields>;

export const AllFieldTypes: Story = {};

export const AllFieldTypesDark: Story = {
  decorators: [withDarkMode],
};
```

- [ ] **Step 4: Create `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`**

`InstructionsOverlay` renders via `createPortal` into `document.body`. Use a `render` override to contain it visually.

```tsx
import { withDarkMode } from '../../../../.storybook/decorators';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const baseArgs = {
  text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  custom gameColor: 'indigo' as const,
  config: { totalRounds: 8 },
  onConfigChange: () => {},
  onSaveCustom game: async () => {},
  configFields: [
    {
      type: 'number' as const,
      key: 'totalRounds',
      label: 'Total rounds',
      min: 1,
      max: 20,
    },
  ],
};

const meta: Meta<typeof InstructionsOverlay> = {
  component: InstructionsOverlay,
  tags: ['autodocs'],
  args: baseArgs,
  argTypes: {
    onStart: { action: 'started' },
    onSaveCustom game: { action: 'custom gameSaved' },
    onUpdateCustom game: { action: 'custom gameUpdated' },
  },
  parameters: {
    // InstructionsOverlay is fixed-position and full-screen via portal —
    // use a full viewport frame to see it correctly.
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof InstructionsOverlay>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};

export const SettingsExpanded: Story = {
  args: {
    ...baseArgs,
    custom gameName: 'Easy Mode',
  },
};

export const SettingsExpandedDark: Story = {
  args: {
    ...baseArgs,
    custom gameName: 'Easy Mode',
  },
  decorators: [withDarkMode],
};
```

- [ ] **Step 5: Create `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.stories.tsx`**

`SortNumbersTileBank` reads from `AnswerGameContext`. Wrap it in `AnswerGameProvider` with pre-seeded tiles.

```tsx
import { withDarkMode } from '../../../../.storybook/decorators';
import { SortNumbersTileBank } from './SortNumbersTileBank';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'sort-numbers-story',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: [
    { id: 't1', label: '3', value: '3' },
    { id: 't2', label: '7', value: '7' },
    { id: 't3', label: '1', value: '1' },
    { id: 't4', label: '5', value: '5' },
  ],
  initialZones: [
    {
      id: 'z1',
      index: 0,
      expectedValue: '1',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 1,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z3',
      index: 2,
      expectedValue: '5',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z4',
      index: 3,
      expectedValue: '7',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
};

const withProvider = (Story: React.ComponentType) => (
  <AnswerGameProvider config={config}>
    <Story />
  </AnswerGameProvider>
);

const meta: Meta<typeof SortNumbersTileBank> = {
  component: SortNumbersTileBank,
  tags: ['autodocs'],
  decorators: [withProvider],
};
export default meta;

type Story = StoryObj<typeof SortNumbersTileBank>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};
```

- [ ] **Step 6: Create `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.stories.tsx`**

`NumberSequenceSlots` is a re-export of `OrderedSlots`, which also requires `AnswerGameContext`.

```tsx
import { withDarkMode } from '../../../../.storybook/decorators';
import { NumberSequenceSlots } from './NumberSequenceSlots';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'sort-numbers-slots-story',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: [
    { id: 't1', label: '1', value: '1' },
    { id: 't2', label: '3', value: '3' },
    { id: 't3', label: '5', value: '5' },
  ],
  initialZones: [
    {
      id: 'z1',
      index: 0,
      expectedValue: '1',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 1,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z3',
      index: 2,
      expectedValue: '5',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
};

const withProvider = (Story: React.ComponentType) => (
  <AnswerGameProvider config={config}>
    <Story />
  </AnswerGameProvider>
);

const meta: Meta<typeof NumberSequenceSlots> = {
  component: NumberSequenceSlots,
  tags: ['autodocs'],
  decorators: [withProvider],
};
export default meta;

type Story = StoryObj<typeof NumberSequenceSlots>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};
```

- [ ] **Step 7: Run TypeScript check**

```bash
yarn typecheck
```

Expected: 0 errors. If there are import path issues with the decorator, check the relative path from each file.

- [ ] **Step 8: Commit story files**

```bash
git add \
  src/components/GameNameChip.stories.tsx \
  src/components/SavedConfigChip.stories.tsx \
  src/components/ConfigFormFields.stories.tsx \
  src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx \
  src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.stories.tsx \
  src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.stories.tsx
git commit -m "feat(storybook): add dark mode story variants for custom game and sort-numbers components"
```

---

## Task 9: Pre-push Verification

- [ ] **Step 1: Run full lint + typecheck + unit test suite**

```bash
yarn lint && yarn typecheck && yarn test
```

Expected: all pass.

- [ ] **Step 2: Run Storybook interaction tests**

```bash
# Option A — start storybook then push
yarn storybook
# In second terminal:
yarn test:storybook

# Option B — let the hook handle it
START_STORYBOOK=1 git push
```

Expected: all pass.

- [ ] **Step 3: Update and verify VR baselines, then push**

```bash
# Ensure Docker is running, then:
yarn test:vr
```

If failures: review diff images, run `yarn test:vr:update` if changes are intentional.

```bash
SKIP_E2E=1 git push
```

(E2E tests are skipped because they require a running dev server — verify manually or in CI.)

---

## Task 10: Theme Showcase Page + 4 VR Stories

A full-page Storybook story that stacks the app shell chrome with the key custom game components below it. Four story exports — one per theme × mode combination — each locking its theme via `parameters.globals` so the VR test runner always captures the correct palette regardless of the toolbar selection.

**Why `parameters.globals` instead of a custom decorator:** The `withTheme` decorator already reads `context.globals.theme` and applies CSS vars + dark class globally. Locking `globals` per story is the standard Storybook pattern for this — no new decorator machinery needed.

**Files:**

- Modify: `.storybook/decorators/withTheme.tsx`
- Modify: `.storybook/preview.tsx`
- Create: `src/stories/ThemeShowcase.stories.tsx`

- [ ] **Step 1: Add forest theme vars to `.storybook/decorators/withTheme.tsx`**

Forest colours come from `src/db/seed-themes.ts` `forestPreset`.

Replace the entire file:

```tsx
import { useEffect } from 'react';
import { applyThemeCssVars } from '../../src/lib/theme/css-vars';
import { defaultThemeCssVars } from '../../src/lib/theme/default-tokens';
import type { Decorator } from '@storybook/react';

type DecoratorStory = Parameters<Decorator>[0];

const THEME_VARS: Record<string, Record<string, string>> = {
  light: defaultThemeCssVars,
  dark: {
    '--bs-primary': '#48CAE4',
    '--bs-secondary': '#90E0EF',
    '--bs-background': '#03045E',
    '--bs-surface': '#0077B6',
    '--bs-text': '#CAF0F8',
    '--bs-accent': '#FFB703',
    '--bs-success': '#2DC653',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'forest-light': {
    '--bs-primary': '#2D6A4F',
    '--bs-secondary': '#52B788',
    '--bs-background': '#F0F7F0',
    '--bs-surface': '#FFFFFF',
    '--bs-text': '#1A3A2A',
    '--bs-accent': '#D4A017',
    '--bs-success': '#6BCB77',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'forest-dark': {
    '--bs-primary': '#52B788',
    '--bs-secondary': '#95D5B2',
    '--bs-background': '#1A2E1F',
    '--bs-surface': '#243B2A',
    '--bs-text': '#D8F3DC',
    '--bs-accent': '#F4C842',
    '--bs-success': '#2DC653',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'high-contrast': {
    '--bs-primary': '#FFFF00',
    '--bs-secondary': '#00FFFF',
    '--bs-background': '#000000',
    '--bs-surface': '#111111',
    '--bs-text': '#FFFFFF',
    '--bs-accent': '#FF8C00',
    '--bs-success': '#00FF00',
    '--bs-warning': '#FF8C00',
    '--bs-error': '#FF0000',
  },
};

const DARK_THEMES = new Set(['dark', 'forest-dark']);

const WithThemeInner = ({
  Story,
  themeKey,
}: {
  Story: DecoratorStory;
  themeKey: string | undefined;
}) => {
  const theme = themeKey ?? 'light';

  useEffect(() => {
    const vars = THEME_VARS[theme] ?? defaultThemeCssVars;
    applyThemeCssVars(document.documentElement, vars);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(
      DARK_THEMES.has(theme) ? 'dark' : 'light',
    );
  }, [theme]);

  return Story();
};

export const withTheme: Decorator = (Story, context) => (
  <WithThemeInner
    Story={Story}
    themeKey={context.globals['theme'] as string | undefined}
  />
);
```

- [ ] **Step 2: Add forest themes to toolbar in `.storybook/preview.tsx`**

Replace the `theme` globalType toolbar items array from:

```ts
items: ['light', 'dark', 'high-contrast'],
```

to:

```ts
items: [
  { value: 'light',          title: 'Ocean Light' },
  { value: 'dark',           title: 'Ocean Dark' },
  { value: 'forest-light',   title: 'Forest Light' },
  { value: 'forest-dark',    title: 'Forest Dark' },
  { value: 'high-contrast',  title: 'High Contrast' },
],
```

- [ ] **Step 3: Run TypeScript check**

```bash
yarn typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Create `src/stories/ThemeShowcase.stories.tsx`**

The page stacks the GameShell chrome (for app shell context) with a scrollable body of the key custom game components. `GameShell` needs `withDb` + `withRouter` decorators. The custom game section below uses `GameNameChip`, `SavedConfigChip`, and `ConfigFormFields` so both the shell theme and the component colours are visible in one frame.

Each of the 4 exports locks its theme via `parameters.globals` — the `withTheme` decorator reads this and applies the correct CSS vars.

```tsx
import { withDb } from '../../.storybook/decorators/withDb';
import { withRouter } from '../../.storybook/decorators/withRouter';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameNameChip } from '@/components/GameNameChip';
import { SavedConfigChip } from '@/components/SavedConfigChip';
import { GameShell } from '@/components/game/GameShell';
import type {
  GameEngineState,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { ConfigField } from '@/lib/config-fields';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { Meta, StoryObj } from '@storybook/react';

// ── GameShell fixture data ────────────────────────────────────────────────

const content: ResolvedContent = {
  rounds: [
    {
      id: 'r1',
      prompt: { en: 'Sort the numbers' },
      correctAnswer: '1',
    },
  ],
};

const shellConfig: ResolvedGameConfig = {
  gameId: 'theme-showcase',
  title: { en: 'Theme Showcase' },
  gradeBand: 'year1-2',
  maxRounds: 3,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: true,
  timerDurationSeconds: 60,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

const sessionMeta: SessionMeta = {
  profileId: 'storybook-user',
  gameId: 'theme-showcase',
  gradeBand: 'year1-2',
  seed: 'storybook-seed',
  initialContent: content,
  initialState,
};

// ── Custom game component fixture data ──────────────────────────────────────

const savedDoc: SavedGameConfigDoc = {
  id: 'cfg-showcase',
  profileId: 'anonymous',
  gameId: 'sort-numbers',
  name: 'Easy Numbers',
  config: { totalRounds: 8, inputMethod: 'drag' },
  createdAt: new Date().toISOString(),
  color: 'teal',
};

const configFields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'Drag' },
      { value: 'type', label: 'Type' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'checkbox',
    key: 'ttsEnabled',
    label: 'Text-to-speech',
  },
];

// ── Story body ────────────────────────────────────────────────────────────

const ShowcaseBody = () => (
  <div className="flex flex-col gap-4 p-4">
    <GameNameChip
      title="Sort Numbers"
      custom
      gameName="Easy Numbers"
      custom
      gameColor="teal"
    />
    <GameNameChip title="Word Spell" subject="reading" />
    <SavedConfigChip
      doc={savedDoc}
      configFields={configFields}
      onPlay={() => {}}
      onDelete={() => {}}
      onSave={async () => {}}
    />
    <ConfigFormFields
      fields={configFields}
      config={{ inputMethod: 'drag', totalRounds: 8, ttsEnabled: true }}
      onChange={() => {}}
    />
  </div>
);

// ── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof GameShell> = {
  component: GameShell,
  title: 'Pages/ThemeShowcase',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    config: shellConfig,
    moves: {},
    initialState,
    sessionId: 'showcase-session',
    meta: sessionMeta,
    children: <ShowcaseBody />,
  },
};
export default meta;

type Story = StoryObj<typeof GameShell>;

// ── 4 locked-theme VR stories ─────────────────────────────────────────────

export const OceanLight: Story = {
  parameters: { globals: { theme: 'light' } },
};

export const OceanDark: Story = {
  parameters: { globals: { theme: 'dark' } },
};

export const ForestLight: Story = {
  parameters: { globals: { theme: 'forest-light' } },
};

export const ForestDark: Story = {
  parameters: { globals: { theme: 'forest-dark' } },
};
```

- [ ] **Step 5: Run TypeScript check**

```bash
yarn typecheck
```

Expected: 0 errors. If `GameShell` props differ from what's shown, check `src/components/game/GameShell.tsx` for the current prop shape and adjust the fixture args to match.

- [ ] **Step 6: Smoke-test in Storybook browser**

```bash
yarn storybook
```

Navigate to **Pages → ThemeShowcase** and cycle through OceanLight, OceanDark, ForestLight, ForestDark. Verify:

- App shell chrome (header, score bar, timer) picks up each palette
- `GameNameChip` custom game tint is visible
- `SavedConfigChip` border/play button uses the teal custom game colour
- `ConfigFormFields` inputs use `bg-background` (dark in dark mode)
- Dark stories show dark backgrounds throughout

- [ ] **Step 7: Commit**

```bash
git add .storybook/decorators/withTheme.tsx .storybook/preview.tsx src/stories/ThemeShowcase.stories.tsx
git commit -m "feat(storybook): add forest theme variants and 4-theme showcase VR page"
```

---

## Self-Review Against Spec

**Section 1 — CSS Variable Architecture Fix:** ✅ Covered in Task 2 (`css-vars.ts`, `default-tokens.ts`, `styles.css :root` additions).

**Section 2 — BOOKMARK_COLORS Dark Mode:** ✅ Covered in Tasks 3–4 (slim `ColorTokens`, custom game utility classes, all 4 components updated).

**Section 3 — Hardcoded Colour Cleanup:**

- `InstructionsOverlay.tsx` line 124 `rgba(255,255,255,0.7)` → `text-white/70` ✅ (Task 4 Step 3)
- `SavedConfigChip.tsx` line 99 `rgb(254 226 226)` → CSS variable approach ✅ (Task 4 Step 2)

**Section 4 — Linting Enforcement:** ✅ Covered in Task 5 (Stylelint + ESLint).

**Section 5 — VR Tests:** ✅ Covered in Task 6 (12 screenshots: 6 light + 6 dark).

**Section 5 — Storybook VR:** ✅ Covered in Tasks 7–8 (`withDarkMode` decorator + 6 story files with dark variants).

**Theme Showcase (addition):** ✅ Covered in Task 10 — `withTheme.tsx` extended with `forest-light`/`forest-dark` entries, toolbar updated in `preview.tsx`, `ThemeShowcase.stories.tsx` provides 4 locked-theme VR snapshots (OceanLight, OceanDark, ForestLight, ForestDark).

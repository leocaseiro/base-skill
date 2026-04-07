# Dark Mode Fix, A11Y Colour Enforcement & VR Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dark mode CSS variable specificity, replace hardcoded bookmark colours with CSS utility classes, add Stylelint/ESLint colour enforcement, and expand VR test coverage to include dark mode and SortNumbers screens.

**Architecture:** CSS-first fix — inline styles only set `--bs-*` vars; shadcn vars derive from `--bs-*` in `:root` so the `.dark` class cascade wins. Bookmark colours collapse to two tokens (`border`, `playBg`); CSS utility classes using `color-mix` handle all other tints. Components set `--bookmark-play` as a CSS custom property and use utility classes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS `color-mix()`, Playwright E2E, Storybook 10, Vitest.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/styles.css` |
| Modify | `src/lib/theme/css-vars.ts` |
| Modify | `src/lib/theme/default-tokens.ts` |
| Modify | `src/lib/bookmark-colors.ts` |
| Modify | `src/components/GameNameChip.tsx` |
| Modify | `src/components/SavedConfigChip.tsx` |
| Modify | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` |
| Modify | `src/components/SaveConfigDialog.tsx` |
| Modify | `.stylelintrc.yaml` |
| Modify | `eslint.config.js` |
| Modify | `e2e/visual.spec.ts` |
| Create | `.storybook/decorators.tsx` |
| Create | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx` |
| Create | `src/components/ConfigFormFields.stories.tsx` |
| Create | `src/components/GameNameChip.stories.tsx` |
| Create | `src/components/SavedConfigChip.stories.tsx` |
| Create | `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.stories.tsx` |
| Create | `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.stories.tsx` |

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

## Task 3: Bookmark CSS Utility Classes + Slim ColorTokens Type

Replace the 6-token `ColorTokens` type with 2 tokens (`border`, `playBg`). All light/dark tints now come from CSS utility classes using `color-mix`.

**Files:**
- Modify: `src/styles.css`
- Modify: `src/lib/bookmark-colors.ts`

- [ ] **Step 1: Add bookmark utility classes to `src/styles.css`**

After the `.dark {}` media query block (after line ~151), add:

```css
/* Bookmark colour utilities — derived from --bookmark-play set per-component */
.bookmark-bg {
  background: color-mix(in srgb, var(--bookmark-play) 12%, transparent);
}
.dark .bookmark-bg {
  background: color-mix(in srgb, var(--bookmark-play) 20%, transparent);
}

.bookmark-tag-bg {
  background: color-mix(in srgb, var(--bookmark-play) 18%, transparent);
}
.dark .bookmark-tag-bg {
  background: color-mix(in srgb, var(--bookmark-play) 25%, transparent);
}

.bookmark-text {
  color: var(--bookmark-play);
}
```

- [ ] **Step 2: Slim `ColorTokens` in `src/lib/bookmark-colors.ts`**

Replace the `ColorTokens` type and all palette entries:

```ts
// src/lib/bookmark-colors.ts
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

export type BookmarkColorKey = (typeof BOOKMARK_COLOR_KEYS)[number];

export type ColorTokens = {
  border: string; // used for selected ring in colour picker
  playBg: string; // primary colour — all other uses derived from this via CSS utility classes
};

export const BOOKMARK_COLORS: Record<BookmarkColorKey, ColorTokens> = {
  indigo:  { border: '#c7d2fe', playBg: '#6366f1' },
  teal:    { border: '#99f6e4', playBg: '#14b8a6' },
  rose:    { border: '#fecdd3', playBg: '#f43f5e' },
  amber:   { border: '#fde68a', playBg: '#f59e0b' },
  sky:     { border: '#bae6fd', playBg: '#0ea5e9' },
  lime:    { border: '#d9f99d', playBg: '#84cc16' },
  purple:  { border: '#e9d5ff', playBg: '#a855f7' },
  orange:  { border: '#fed7aa', playBg: '#f97316' },
  pink:    { border: '#fbcfe8', playBg: '#ec4899' },
  emerald: { border: '#a7f3d0', playBg: '#10b981' },
  slate:   { border: '#cbd5e1', playBg: '#64748b' },
  cyan:    { border: '#a5f3fc', playBg: '#06b6d4' },
};

export const DEFAULT_BOOKMARK_COLOR: BookmarkColorKey = 'indigo';
```

- [ ] **Step 3: Run TypeScript check — expect failures in 4 component files**

```bash
yarn typecheck
```

Expected: TypeScript errors in `GameNameChip.tsx`, `SavedConfigChip.tsx`, `InstructionsOverlay.tsx`, `SaveConfigDialog.tsx` (accessing removed properties `bg`, `tagBg`, `tagText`, `headerText`). This is the "failing test" — proceed to Task 4 to fix.

---

## Task 4: Update All Components to Use Bookmark Utility Classes

Fix TypeScript failures from Task 3 by updating all 4 components to use `--bookmark-play` CSS var + utility classes. Also fixes the two hardcoded colours (Section 3 of spec).

**Files:**
- Modify: `src/components/GameNameChip.tsx`
- Modify: `src/components/SavedConfigChip.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/SaveConfigDialog.tsx`

- [ ] **Step 1: Update `src/components/GameNameChip.tsx`**

Full file replacement:

```tsx
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';

type GameNameChipProps = {
  title: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = bookmarkName
    ? BOOKMARK_COLORS[bookmarkColor]
    : BOOKMARK_COLORS.slate;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: colors.border,
        '--bookmark-play': colors.playBg,
      } as React.CSSProperties}
    >
      <div className="bookmark-bg flex min-h-12 items-center gap-2 px-3">
        <span className="bookmark-text text-sm font-bold">{title}</span>
        {bookmarkName && (
          <span
            className="bookmark-bg bookmark-text rounded border px-2 py-0.5 text-xs font-semibold"
            style={{ borderColor: colors.border }}
          >
            {bookmarkName}
          </span>
        )}
        {!bookmarkName && subject && (
          <span className="bookmark-bg rounded px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { BOOKMARK_COLORS } from '@/lib/bookmark-colors';
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

  const colorKey = doc.color as BookmarkColorKey;
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
      style={{
        '--bookmark-play': colors.playBg,
        borderColor: expanded ? colors.playBg : colors.border,
        boxShadow: expanded
          ? `0 0 0 3px color-mix(in srgb, var(--bookmark-play) 12%, transparent)`
          : undefined,
      } as React.CSSProperties}
    >
      {/* Header row */}
      <div
        className={`flex min-h-12 items-stretch ${!expanded ? 'bookmark-tag-bg' : ''}`}
        style={expanded ? { background: 'var(--bookmark-play)' } : undefined}
      >
        <button
          type="button"
          aria-label={`Expand ${doc.name}`}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-12 flex-1 items-center gap-2 px-3 text-left"
        >
          <span
            className={`text-sm font-semibold ${expanded ? 'text-white' : 'bookmark-text'}`}
          >
            {doc.name}
          </span>
          <span
            className={`ml-auto text-xs ${expanded ? 'text-white/70' : 'bookmark-text'}`}
          >
            {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Play ${doc.name}`}
          onClick={() => onPlay(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center text-sm text-white"
          style={{ background: 'var(--bookmark-play)' }}
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
        <div className="bookmark-bg flex flex-wrap gap-1 px-3 pb-2 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bookmark-tag-bg bookmark-text rounded px-2 py-0.5 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: inline form */}
      {expanded && (
        <div className="bookmark-bg flex flex-col gap-3 p-3">
          <ConfigFormFields
            fields={configFields}
            config={editConfig}
            onChange={setEditConfig}
          />
          <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
            Bookmark name
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
- Add `'--bookmark-play': settingsColors.playBg` to settings section div
- Replace `style={{ background: settingsColors.playBg }}` with `style={{ background: 'var(--bookmark-play)' }}`
- Replace `color: settingsOpen ? 'rgba(255,255,255,0.7)' : undefined` with `className` conditional
- `bg-background/95` on the dialog div already works after Task 2

Full file replacement:

```tsx
// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameNameChip } from '@/components/GameNameChip';
import {
  BOOKMARK_COLORS,
  BOOKMARK_COLOR_KEYS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import { configToTags } from '@/lib/config-tags';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveBookmark: (
    name: string,
    color: BookmarkColorKey,
  ) => Promise<void>;
  onUpdateBookmark?: (
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
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
  config,
  onConfigChange,
  onSaveBookmark,
  onUpdateBookmark,
  configFields,
}: InstructionsOverlayProps) => {
  const { t } = useTranslation('games');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [newBookmarkColor, setNewBookmarkColor] =
    useState<BookmarkColorKey>(DEFAULT_BOOKMARK_COLOR);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = BOOKMARK_COLORS[bookmarkColor];
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
            bookmarkName={bookmarkName}
            bookmarkColor={bookmarkColor}
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
          style={{
            '--bookmark-play': settingsColors.playBg,
          } as React.CSSProperties}
        >
          {/* Settings header */}
          <button
            type="button"
            aria-label={t('instructions.settings')}
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex min-h-12 w-full items-center gap-2 bg-muted px-3 text-left"
            style={
              settingsOpen
                ? { background: 'var(--bookmark-play)' }
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
                {bookmarkName && onUpdateBookmark ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                      Bookmark name
                      <input
                        type="text"
                        defaultValue={bookmarkName}
                        id="instructions-bookmark-name"
                        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Update ${bookmarkName}`}
                      onClick={() => {
                        const el =
                          document.querySelector<HTMLInputElement>(
                            '#instructions-bookmark-name',
                          );
                        void onUpdateBookmark(
                          el?.value ?? bookmarkName,
                          config,
                        );
                      }}
                      className="h-12 w-full rounded-xl font-bold text-white text-sm"
                      style={{ background: 'var(--bookmark-play)' }}
                    >
                      {t('instructions.updateBookmark', {
                        name: bookmarkName,
                        defaultValue: `Update "${bookmarkName}"`,
                      })}
                    </button>
                    <button
                      type="button"
                      aria-label="Save as new bookmark"
                      onClick={() => setSettingsOpen(false)}
                      className="h-12 w-full rounded-xl border border-input bg-background text-sm font-semibold text-primary"
                    >
                      {t('instructions.saveAsNew', {
                        defaultValue: 'Save as new bookmark…',
                      })}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {t('common:saveConfig.saveBookmarkLabel', {
                        defaultValue: 'Save as bookmark',
                      })}
                    </span>
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                      role="group"
                      aria-label="Bookmark color"
                    >
                      {BOOKMARK_COLOR_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-label={key}
                          aria-pressed={newBookmarkColor === key}
                          onClick={() => setNewBookmarkColor(key)}
                          className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            background: BOOKMARK_COLORS[key].playBg,
                            borderColor:
                              newBookmarkColor === key
                                ? BOOKMARK_COLORS[key].playBg
                                : 'transparent',
                            outline:
                              newBookmarkColor === key
                                ? '3px solid white'
                                : undefined,
                            outlineOffset:
                              newBookmarkColor === key
                                ? '-4px'
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBookmarkName}
                        onChange={(e) =>
                          setNewBookmarkName(e.target.value)
                        }
                        placeholder="e.g. Easy Mode"
                        className="h-12 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Save bookmark"
                        onClick={() => {
                          if (newBookmarkName.trim()) {
                            void onSaveBookmark(
                              newBookmarkName.trim(),
                              newBookmarkColor,
                            );
                            setNewBookmarkName('');
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

The preview section uses `previewColors.tagBg` and `previewColors.headerText` — replace with bookmark utility classes. Set `--bookmark-play` on the preview container.

Replace the preview `<div className="flex flex-col gap-1">` block (lines ~120–144) with:

```tsx
          {/* Preview */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Preview
            </span>
            <div
              className="inline-flex overflow-hidden rounded-lg border"
              style={{
                borderColor: previewColors.border,
                '--bookmark-play': previewColors.playBg,
              } as React.CSSProperties}
            >
              <div className="bookmark-tag-bg bookmark-text px-3 py-2 text-sm font-semibold">
                {name || t('saveConfig.placeholder')}
              </div>
              <div
                className="flex w-10 items-center justify-center text-sm text-white"
                style={{ background: 'var(--bookmark-play)' }}
              >
                ▶
              </div>
            </div>
          </div>
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
git add src/lib/bookmark-colors.ts src/styles.css \
  src/components/GameNameChip.tsx src/components/SavedConfigChip.tsx \
  src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx \
  src/components/SaveConfigDialog.tsx
git commit -m "feat(bookmark): replace hardcoded colour tokens with CSS utility classes"
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

Expected: 0 errors. The `BOOKMARK_COLORS` object in `src/lib/bookmark-colors.ts` is NOT a JSX file, so the JSX selector rule doesn't apply there. The `playBg`/`border` hex values in that file remain as the canonical palette definitions.

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
  await expect(page).toHaveScreenshot('home-dark.png', { fullPage: true });
});

// ── Game shell ───────────────────────────────────────────────────────────────

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', { fullPage: true });
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

test('@visual WordSpell picture mode mid-game layout', async ({ page }) => {
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
  await expect(page).toHaveScreenshot('word-spell-picture-mode-dark.png', {
    fullPage: true,
  });
});

// ── NumberMatch ──────────────────────────────────────────────────────────────

test('@visual NumberMatch numeral-to-group layout', async ({ page }) => {
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

test('@visual NumberMatch numeral-to-group layout dark', async ({ page }) => {
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
  await expect(page).toHaveScreenshot('sort-numbers.png', { fullPage: true });
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

test('@visual InstructionsOverlay before start dark', async ({ page }) => {
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

export const WithBookmark: Story = {
  args: {
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'indigo',
  },
};

export const WithBookmarkDark: Story = {
  args: {
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'indigo',
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
      {(['indigo', 'teal', 'rose', 'amber', 'sky', 'lime', 'purple', 'orange', 'pink', 'emerald', 'slate', 'cyan'] as const).map(
        (color) => (
          <GameNameChip
            key={color}
            title="Word Spell"
            bookmarkName={color}
            bookmarkColor={color}
          />
        ),
      )}
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
  text: "Listen to each number and drag it into the correct slot to sort from smallest to biggest.",
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  bookmarkColor: 'indigo' as const,
  config: { totalRounds: 8 },
  onConfigChange: () => {},
  onSaveBookmark: async () => {},
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
    onSaveBookmark: { action: 'bookmarkSaved' },
    onUpdateBookmark: { action: 'bookmarkUpdated' },
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
    bookmarkName: 'Easy Mode',
  },
};

export const SettingsExpandedDark: Story = {
  args: {
    ...baseArgs,
    bookmarkName: 'Easy Mode',
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
    { id: 'z1', index: 0, expectedValue: '1', placedTileId: null, isWrong: false, isLocked: false },
    { id: 'z2', index: 1, expectedValue: '3', placedTileId: null, isWrong: false, isLocked: false },
    { id: 'z3', index: 2, expectedValue: '5', placedTileId: null, isWrong: false, isLocked: false },
    { id: 'z4', index: 3, expectedValue: '7', placedTileId: null, isWrong: false, isLocked: false },
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
    { id: 'z1', index: 0, expectedValue: '1', placedTileId: null, isWrong: false, isLocked: false },
    { id: 'z2', index: 1, expectedValue: '3', placedTileId: null, isWrong: false, isLocked: false },
    { id: 'z3', index: 2, expectedValue: '5', placedTileId: null, isWrong: false, isLocked: false },
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
git commit -m "feat(storybook): add dark mode story variants for bookmark and sort-numbers components"
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

## Self-Review Against Spec

**Section 1 — CSS Variable Architecture Fix:** ✅ Covered in Task 2 (`css-vars.ts`, `default-tokens.ts`, `styles.css :root` additions).

**Section 2 — BOOKMARK_COLORS Dark Mode:** ✅ Covered in Tasks 3–4 (slim `ColorTokens`, bookmark utility classes, all 4 components updated).

**Section 3 — Hardcoded Colour Cleanup:**
- `InstructionsOverlay.tsx` line 124 `rgba(255,255,255,0.7)` → `text-white/70` ✅ (Task 4 Step 3)
- `SavedConfigChip.tsx` line 99 `rgb(254 226 226)` → CSS variable approach ✅ (Task 4 Step 2)

**Section 4 — Linting Enforcement:** ✅ Covered in Task 5 (Stylelint + ESLint).

**Section 5 — VR Tests:** ✅ Covered in Task 6 (12 screenshots: 6 light + 6 dark).

**Section 5 — Storybook VR:** ✅ Covered in Tasks 7–8 (`withDarkMode` decorator + 6 story files with dark variants).

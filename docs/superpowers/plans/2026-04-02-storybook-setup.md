# Storybook Setup Implementation Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install and configure Storybook 10.3+ with full component/service stories, visual regression testing, a11y CI, GitHub Pages deployment at `/base-skill/docs/`, and agent-facing Storybook MCP.

**Architecture:** Storybook runs as a separate static site built with `@storybook/react-vite`, sharing the same Vite config plugins (tsconfigPaths, tailwindcss). Stories are co-located with their source files. The Storybook build output (`storybook-static/`) is merged into `dist/client/docs/` before GitHub Pages upload. A `withTheme` decorator calls `applyThemeCssVars()` from the existing `src/lib/theme/css-vars.ts` — no theme code is duplicated. A `withRouter` decorator provides TanStack Router context for components that call `useParams`/`useNavigate`.

**Tech Stack:** Storybook 10.3+ (`@storybook/addon-mcp` requirement), `@storybook/react-vite`, `@storybook/test-runner` (Playwright), `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/addon-mcp`, CSF 3.0, MDX 3, `fake-indexeddb`

---

## File Structure

**New files (Storybook config):**

- `.storybook/main.ts` — addon list + `viteFinal` to set `base: '/base-skill/docs/'`
- `.storybook/preview.ts` — CSS import, global decorators, viewport params, i18n init, global toolbar types
- `.storybook/decorators/withTheme.tsx` — injects CSS vars from toolbar theme selection
- `.storybook/decorators/withRouter.tsx` — TanStack Router `RouterProvider` for components needing `useParams`/`useNavigate`

**New files (UI primitive stories):**

- `src/components/ui/button.stories.tsx`
- `src/components/ui/card.stories.tsx`
- `src/components/ui/input.stories.tsx`
- `src/components/ui/label.stories.tsx`
- `src/components/ui/select.stories.tsx`
- `src/components/ui/slider.stories.tsx`
- `src/components/ui/alert-dialog.stories.tsx`
- `src/components/ui/dropdown-menu.stories.tsx`
- `src/components/ui/sheet.stories.tsx`
- `src/components/ui/sonner.stories.tsx`

**New files (component stories):**

- `src/components/GameCard.stories.tsx`
- `src/components/GameGrid.stories.tsx`
- `src/components/LevelRow.stories.tsx`
- `src/components/Header.stories.tsx`
- `src/components/Footer.stories.tsx`
- `src/components/OfflineIndicator.stories.tsx`
- `src/components/ThemeToggle.stories.tsx`

**New files (service stories — MDX + interactive demo):**

- `src/lib/speech/SpeechOutput.stories.mdx`
- `src/lib/speech/SpeechOutput.demo.tsx`
- `src/lib/speech/SpeechInput.stories.mdx`
- `src/lib/speech/SpeechInput.demo.tsx`
- `src/lib/game-event-bus.stories.mdx`
- `src/lib/game-event-bus.demo.tsx`
- `src/db/hooks/useSettings.stories.mdx`
- `src/db/hooks/useSettings.demo.tsx`
- `src/db/hooks/useCustom games.stories.mdx`
- `src/db/hooks/useCustom games.demo.tsx`
- `src/db/hooks/useRxQuery.stories.mdx`
- `src/db/hooks/useRxQuery.demo.tsx`

**New files (pure utility docs — MDX only):**

- `src/lib/theme/css-vars.stories.mdx`
- `src/games/catalog-utils.stories.mdx`
- `src/lib/i18n/i18n.stories.mdx`

**New files (tooling):**

- `.mcp.json` — Playwright MCP (Task 9) plus Storybook HTTP MCP registration via `mcp-add` (Task 28) for local AI-assisted development
- `knip.json` — Knip config to mark `.demo.tsx` files as entry points

**Modified files:**

- `package.json` — add `storybook`, `build-storybook`, `test:storybook` scripts
- `playwright.config.ts` — change `trace: 'on-first-retry'` → `trace: 'retain-on-failure'`
- `src/components/Header.tsx` — add "Docs" link pointing to `/base-skill/docs/`
- `.github/workflows/deploy.yml` — add Storybook build + `cp -r storybook-static/. dist/client/docs` step
- `.github/workflows/ci.yml` — add `storybook-test` job

---

## Task 1: Create worktree

- **Step 1: Create the worktree from the project root**

```bash
git worktree add ./worktrees/milestone-storybook-setup -b milestone-storybook-setup
```

- **Step 2: Install dependencies in the worktree**

```bash
cd ./worktrees/milestone-storybook-setup && yarn install
```

- **Step 3: Confirm clean baseline**

```bash
cd ./worktrees/milestone-storybook-setup && yarn typecheck
```

Expected: exits 0 with no errors.

---

## Task 2: Install Storybook 10 packages

**Files:**

- Modify: `package.json`

Pin **Storybook 10.3+** so `@storybook/addon-mcp` (Task 28) is always installable without a separate upgrade step.

- **Step 1: Add Storybook packages as devDependencies**

Run from the worktree root:

```bash
yarn add --dev \
  storybook@^10.3.0 \
  @storybook/react-vite@^10.3.0 \
  @storybook/addon-essentials@^10.3.0 \
  @storybook/addon-a11y@^10.3.0 \
  @storybook/addon-themes@^10.3.0 \
  @storybook/test-runner@^10.3.0 \
  @storybook/test@^10.3.0 \
  @mdx-js/react@^3.0.0
```

- **Step 2: Verify packages were added**

```bash
node -e "const p = require('./package.json'); console.log(p.devDependencies['storybook'])"
```

Expected: prints the version string (e.g. `^10.3.0`).

- **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: install Storybook 10 packages"
```

---

## Task 3: Add package.json scripts

**Files:**

- Modify: `package.json`
- **Step 1: Add three scripts to the `scripts` section of `package.json`**

Open `package.json` and add these three entries to the `scripts` object (place them after `test:e2e:a11y`):

```json
"storybook": "storybook dev --port 6006",
"build-storybook": "storybook build",
"test:storybook": "test-storybook"
```

- **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add storybook, build-storybook, test:storybook scripts"
```

---

## Task 4: Create `.storybook/main.ts`

**Files:**

- Create: `.storybook/main.ts`
- **Step 1: Create the directory and config file**

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  viteFinal: async (config) => {
    return {
      ...config,
      base: '/base-skill/docs/',
    };
  },
};

export default config;
```

- **Step 2: Verify TypeScript compiles the config**

```bash
yarn typecheck
```

Expected: exits 0. If `@storybook/react-vite` types are missing, verify the package was installed in Task 2.

- **Step 3: Commit**

```bash
git add .storybook/main.ts
git commit -m "chore(storybook): add main.ts config with react-vite builder"
```

---

## Task 5: Create `withTheme` and `withRouter` decorators

**Files:**

- Create: `.storybook/decorators/withTheme.tsx`
- Create: `.storybook/decorators/withRouter.tsx`
- **Step 1: Create the `withTheme` decorator**

```tsx
// .storybook/decorators/withTheme.tsx
import React, { useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import { applyThemeCssVars } from '../src/lib/theme/css-vars';
import { defaultThemeCssVars } from '../src/lib/theme/default-tokens';

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

export const withTheme: Decorator = (Story, context) => {
  const theme =
    (context.globals['theme'] as string | undefined) ?? 'light';

  useEffect(() => {
    const vars = THEME_VARS[theme] ?? defaultThemeCssVars;
    applyThemeCssVars(document.documentElement, vars);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(
      theme === 'dark' ? 'dark' : 'light',
    );
  }, [theme]);

  return <Story />;
};
```

- **Step 2: Create the `withRouter` decorator**

This decorator wraps stories in a TanStack Router `RouterProvider` with a memory history starting at `/en`. This gives `useParams({ from: '/$locale' })` and `useNavigate()` a working context. A new router is created per story (via `React.useMemo` keyed to `Story`) to avoid stale state.

```tsx
// .storybook/decorators/withRouter.tsx
import React from 'react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import type { Decorator } from '@storybook/react';

export const withRouter: Decorator = (Story) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = React.useMemo(() => {
    const rootRoute = createRootRoute({ component: Outlet });
    const localeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/$locale',
      component: Story as React.ComponentType,
    });
    return createRouter({
      routeTree: rootRoute.addChildren([localeRoute]),
      history: createMemoryHistory({ initialEntries: ['/en'] }),
    });
    // Story reference changes between stories; recreate router each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Story]);

  return <RouterProvider router={router} />;
};
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 4: Commit**

```bash
git add .storybook/decorators/
git commit -m "chore(storybook): add withTheme and withRouter decorators"
```

---

## Task 6: Create `.storybook/preview.ts`

**Files:**

- Create: `.storybook/preview.ts`
- **Step 1: Create the preview config**

```typescript
// .storybook/preview.ts
import '../src/styles.css';
import '../src/lib/i18n/i18n';
import type { Preview } from '@storybook/react';
import { withTheme } from './decorators/withTheme';

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark', 'high-contrast'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [withTheme],
  parameters: {
    viewport: {
      viewports: {
        mobileSm: {
          name: 'Phone S (360×640)',
          styles: { width: '360px', height: '640px' },
        },
        mobileLg: {
          name: 'Phone L (390×844)',
          styles: { width: '390px', height: '844px' },
        },
        tabletPortrait: {
          name: 'Tablet Portrait (768×1024)',
          styles: { width: '768px', height: '1024px' },
        },
        tabletLandscape: {
          name: 'Tablet Landscape (1024×768)',
          styles: { width: '1024px', height: '768px' },
        },
        desktop: {
          name: 'Desktop (1280×800)',
          styles: { width: '1280px', height: '800px' },
        },
      },
      defaultViewport: 'tabletLandscape',
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
};

export default preview;
```

- **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 3: Start Storybook and verify it loads (no stories yet, just the welcome screen)**

```bash
yarn storybook &
# Wait ~10 seconds, then open http://localhost:6006
```

Kill the process after verification (`fg` then Ctrl+C, or `kill %1`).

- **Step 4: Commit**

```bash
git add .storybook/preview.ts
git commit -m "chore(storybook): add preview.ts with viewports, theme toolbar, and i18n"
```

---

## Task 7: Add knip.json for demo file entry points

Knip's default config recognizes `.stories.tsx` files as Storybook entry points. The `.demo.tsx` files are imported from `.stories.mdx` — they need to be explicitly declared as entry points or knip will flag them as unused exports.

**Files:**

- Create: `knip.json`
- **Step 1: Create `knip.json`**

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/**/*.demo.tsx"],
  "ignore": [".storybook/**"]
}
```

- **Step 2: Verify knip passes**

```bash
yarn lint
```

Expected: exits 0. If knip still flags files, add the specific paths to `entry`.

- **Step 3: Commit**

```bash
git add knip.json
git commit -m "chore: add knip.json to declare .demo.tsx as entry points"
```

---

## Task 8: Update `playwright.config.ts` trace setting

**Files:**

- Modify: `playwright.config.ts`
- **Step 1: Change the `trace` option from `'on-first-retry'` to `'retain-on-failure'`**

In `playwright.config.ts`, locate the `use` block and update:

```typescript
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
```

- **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "chore(playwright): use retain-on-failure trace for easier debugging"
```

---

## Task 9: Create `.mcp.json`

**Files:**

- Create: `.mcp.json`
- **Step 1: Create the MCP config**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

- **Step 2: Commit**

```bash
git add .mcp.json
git commit -m "chore: add .mcp.json with Playwright MCP server for local AI tooling"
```

---

## Task 10: Add "Docs" link to Header

**Files:**

- Modify: `src/components/Header.tsx`
- **Step 1: Add the Docs `<a>` link to the Header component**

In `src/components/Header.tsx`, locate the header's inner `<div>` that contains the app name `<Link>`. Add the Docs anchor **after** the app name Link and **before** the flex-1 search div:

```tsx
<a
  href="/base-skill/docs/"
  className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
  target="_blank"
  rel="noreferrer"
>
  Docs
</a>
```

The full inner div after the change:

```tsx
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
        >
          {t('appName')}
        </Link>

        <a
          href="/base-skill/docs/"
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>

        <div className="flex flex-1 items-center gap-2">
```

- **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Docs link to Header pointing to /base-skill/docs/"
```

---

## Task 11: shadcn/ui Button and Card stories

**Files:**

- Create: `src/components/ui/button.stories.tsx`
- Create: `src/components/ui/card.stories.tsx`
- **Step 1: Write `button.stories.tsx`**

```tsx
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button', variant: 'default' },
};

export const Outline: Story = {
  args: { children: 'Outline', variant: 'outline' },
};

export const Secondary: Story = {
  args: { children: 'Secondary', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'Ghost', variant: 'ghost' },
};

export const Destructive: Story = {
  args: { children: 'Delete', variant: 'destructive' },
};

export const Link: Story = {
  args: { children: 'Link', variant: 'link' },
};

export const Small: Story = {
  args: { children: 'Small', size: 'sm' },
};

export const Large: Story = {
  args: { children: 'Large', size: 'lg' },
};

export const Icon: Story = {
  args: { children: '★', size: 'icon', 'aria-label': 'Star' },
};

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};
```

- **Step 2: Write `card.stories.tsx`**

```tsx
// src/components/ui/card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card body content.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card className="w-72" size="sm">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Compact variant.</p>
      </CardContent>
    </Card>
  ),
};
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0. If `CardDescription`/`CardFooter` exports don't exist in your `card.tsx`, remove them from the story — check the file's named exports first.

- **Step 4: Commit**

```bash
git add src/components/ui/button.stories.tsx src/components/ui/card.stories.tsx
git commit -m "docs(storybook): add Button and Card stories"
```

---

## Task 12: shadcn/ui Input, Label, Select, and Slider stories

**Files:**

- Create: `src/components/ui/input.stories.tsx`
- Create: `src/components/ui/label.stories.tsx`
- Create: `src/components/ui/select.stories.tsx`
- Create: `src/components/ui/slider.stories.tsx`
- **Step 1: Write `input.stories.tsx`**

```tsx
// src/components/ui/input.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Enter text…' },
};

export const WithValue: Story = {
  args: { defaultValue: 'Hello world', placeholder: 'Enter text…' },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled input' },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'Bad value' },
};
```

- **Step 2: Write `label.stories.tsx`**

```tsx
// src/components/ui/label.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Input } from './input';

const meta: Meta<typeof Label> = {
  component: Label,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Your name" />
    </div>
  ),
};
```

- **Step 3: Write `select.stories.tsx`**

```tsx
// src/components/ui/select.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithPreselected: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
};
```

- **Step 4: Write `slider.stories.tsx`**

```tsx
// src/components/ui/slider.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  component: Slider,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
  },
};

export const Volume: Story = {
  args: {
    defaultValue: [80],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Volume',
  },
};

export const SpeechRate: Story = {
  args: {
    defaultValue: [10],
    min: 5,
    max: 20,
    step: 1,
    className: 'w-64',
    'aria-label': 'Speech rate',
  },
};
```

- **Step 5: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 6: Commit**

```bash
git add src/components/ui/input.stories.tsx src/components/ui/label.stories.tsx src/components/ui/select.stories.tsx src/components/ui/slider.stories.tsx
git commit -m "docs(storybook): add Input, Label, Select, and Slider stories"
```

---

## Task 13: shadcn/ui AlertDialog, DropdownMenu, Sheet, and Sonner stories

**Files:**

- Create: `src/components/ui/alert-dialog.stories.tsx`
- Create: `src/components/ui/dropdown-menu.stories.tsx`
- Create: `src/components/ui/sheet.stories.tsx`
- Create: `src/components/ui/sonner.stories.tsx`
- **Step 1: Write `alert-dialog.stories.tsx`**

Check the named exports in `src/components/ui/alert-dialog.tsx` first. The standard shadcn/ui exports are: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`.

```tsx
// src/components/ui/alert-dialog.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';

const meta: Meta<typeof AlertDialog> = {
  component: AlertDialog,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
```

- **Step 2: Write `dropdown-menu.stories.tsx`**

```tsx
// src/components/ui/dropdown-menu.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
```

- **Step 3: Write `sheet.stories.tsx`**

```tsx
// src/components/ui/sheet.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { Button } from './button';

const meta: Meta<typeof Sheet> = {
  component: Sheet,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Sheet>;

export const FromRight: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet description here.</SheetDescription>
        </SheetHeader>
        <p className="p-4 text-sm">Sheet body content.</p>
      </SheetContent>
    </Sheet>
  ),
};

export const FromLeft: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
```

- **Step 4: Write `sonner.stories.tsx`**

Check what `src/components/ui/sonner.tsx` exports. It typically exports a `Toaster` component. Stories for Sonner show the toast system.

```tsx
// src/components/ui/sonner.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Toaster } from './sonner';
import { Button } from './button';

const meta: Meta<typeof Toaster> = {
  component: Toaster,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast('Event registered!')}>
      Show toast
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success('Saved successfully')}>
      Show success
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button onClick={() => toast.error('Something went wrong')}>
      Show error
    </Button>
  ),
};
```

- **Step 5: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 6: Commit**

```bash
git add src/components/ui/alert-dialog.stories.tsx src/components/ui/dropdown-menu.stories.tsx src/components/ui/sheet.stories.tsx src/components/ui/sonner.stories.tsx
git commit -m "docs(storybook): add AlertDialog, DropdownMenu, Sheet, and Sonner stories"
```

---

## Task 14: GameCard stories

**Files:**

- Create: `src/components/GameCard.stories.tsx`

`GameCard` props: `entry: GameCatalogEntry`, `isCustom gameed: boolean`, `onCustom gameToggle: (gameId: string) => void`, `onPlay: (gameId: string) => void`. It uses `useTranslation` — i18n is already initialised in `preview.ts`.

- **Step 1: Write `GameCard.stories.tsx`**

```tsx
// src/components/GameCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { GameCard } from './GameCard';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    entry: {
      id: 'math-addition',
      titleKey: 'math-addition',
      levels: ['1', '2'],
      subject: 'math',
    },
    isCustom gameed: false,
  },
  argTypes: {
    onCustom gameToggle: { action: 'custom gameToggled' },
    onPlay: { action: 'played' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {};

export const Custom gameed: Story = {
  args: { isCustom gameed: true },
};

export const MultiLevel: Story = {
  args: {
    entry: {
      id: 'math-subtraction',
      titleKey: 'math-subtraction',
      levels: ['1', '2', '3'],
      subject: 'math',
    },
  },
};

export const LettersGame: Story = {
  args: {
    entry: {
      id: 'placeholder-game',
      titleKey: 'placeholder-game',
      levels: ['PK', 'K'],
      subject: 'letters',
    },
  },
};
```

- **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 3: Commit**

```bash
git add src/components/GameCard.stories.tsx
git commit -m "docs(storybook): add GameCard stories"
```

---

## Task 15: GameGrid stories

**Files:**

- Create: `src/components/GameGrid.stories.tsx`

`GameGrid` props: `entries`, `custom gameedIds`, `onCustom gameToggle`, `onPlay`, `page`, `totalPages`, `onPageChange`.

- **Step 1: Write `GameGrid.stories.tsx`**

```tsx
// src/components/GameGrid.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { GameGrid } from './GameGrid';

const SAMPLE_ENTRIES = [
  {
    id: 'math-addition',
    titleKey: 'math-addition',
    levels: ['1', '2'] as const,
    subject: 'math' as const,
  },
  {
    id: 'math-subtraction',
    titleKey: 'math-subtraction',
    levels: ['1', '2', '3'] as const,
    subject: 'math' as const,
  },
  {
    id: 'placeholder-game',
    titleKey: 'placeholder-game',
    levels: ['PK', 'K'] as const,
    subject: 'letters' as const,
  },
];

const meta: Meta<typeof GameGrid> = {
  component: GameGrid,
  tags: ['autodocs'],
  args: {
    entries: SAMPLE_ENTRIES,
    custom gameedIds: new Set<string>(),
    page: 1,
    totalPages: 1,
  },
  argTypes: {
    onCustom gameToggle: { action: 'custom gameToggled' },
    onPlay: { action: 'played' },
    onPageChange: { action: 'pageChanged' },
  },
};
export default meta;

type Story = StoryObj<typeof GameGrid>;

export const Default: Story = {};

export const WithCustom games: Story = {
  args: {
    custom gameedIds: new Set(['math-addition']),
  },
};

export const Paginated: Story = {
  args: {
    page: 2,
    totalPages: 5,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
```

- **Step 2: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 3: Commit**

```bash
git add src/components/GameGrid.stories.tsx
git commit -m "docs(storybook): add GameGrid stories"
```

---

## Task 16: LevelRow, ThemeToggle, and OfflineIndicator stories

**Files:**

- Create: `src/components/LevelRow.stories.tsx`
- Create: `src/components/ThemeToggle.stories.tsx`
- Create: `src/components/OfflineIndicator.stories.tsx`
- **Step 1: Write `LevelRow.stories.tsx`**

`LevelRow` props: `currentLevel: GameLevel | ''`, `onLevelChange: (level: GameLevel | '') => void`.

```tsx
// src/components/LevelRow.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { LevelRow } from './LevelRow';

const meta: Meta<typeof LevelRow> = {
  component: LevelRow,
  tags: ['autodocs'],
  args: {
    currentLevel: '',
  },
  argTypes: {
    onLevelChange: { action: 'levelChanged' },
  },
};
export default meta;

type Story = StoryObj<typeof LevelRow>;

export const AllSelected: Story = {
  args: { currentLevel: '' },
};

export const KindergartenSelected: Story = {
  args: { currentLevel: 'K' },
};

export const Grade3Selected: Story = {
  args: { currentLevel: '3' },
};
```

- **Step 2: Write `ThemeToggle.stories.tsx`**

```tsx
// src/components/ThemeToggle.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
```

- **Step 3: Write `OfflineIndicator.stories.tsx`**

`OfflineIndicator` reads `navigator.onLine` on mount. We use a decorator to override `navigator.onLine` so the offline state is visible in a story without disconnecting the network.

```tsx
// src/components/OfflineIndicator.stories.tsx
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { OfflineIndicator } from './OfflineIndicator';

const withOffline: Decorator = (Story) => {
  Object.defineProperty(navigator, 'onLine', {
    value: false,
    writable: true,
  });
  return <Story />;
};

const meta: Meta<typeof OfflineIndicator> = {
  component: OfflineIndicator,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof OfflineIndicator>;

export const Online: Story = {};

export const Offline: Story = {
  decorators: [withOffline],
};
```

- **Step 4: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 5: Commit**

```bash
git add src/components/LevelRow.stories.tsx src/components/ThemeToggle.stories.tsx src/components/OfflineIndicator.stories.tsx
git commit -m "docs(storybook): add LevelRow, ThemeToggle, and OfflineIndicator stories"
```

---

## Task 17: Header and Footer stories

`Header` and `Footer` both call `useParams({ from: '/$locale' })` and `useNavigate()`. They need the `withRouter` decorator defined in Task 5. Neither component takes props (they pull everything from hooks), so no `args` are needed.

**Files:**

- Create: `src/components/Header.stories.tsx`
- Create: `src/components/Footer.stories.tsx`
- **Step 1: Write `Header.stories.tsx`**

```tsx
// src/components/Header.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from '../../.storybook/decorators/withRouter';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  component: Header,
  tags: ['autodocs'],
  decorators: [withRouter],
};
export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
```

- **Step 2: Write `Footer.stories.tsx`**

```tsx
// src/components/Footer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from '../../.storybook/decorators/withRouter';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  component: Footer,
  tags: ['autodocs'],
  decorators: [withRouter],
};
export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 4: Start Storybook and visually verify Header and Footer render**

```bash
yarn storybook &
# Open http://localhost:6006 → Components/Header → Default
# Verify header renders with search input and buttons
# Open Components/Footer → Default
# Verify footer renders with language selector
```

Kill storybook after verifying.

- **Step 5: Commit**

```bash
git add src/components/Header.stories.tsx src/components/Footer.stories.tsx
git commit -m "docs(storybook): add Header and Footer stories with router decorator"
```

---

## Task 18: SpeechOutput MDX + interactive demo

**Files:**

- Create: `src/lib/speech/SpeechOutput.stories.mdx`
- Create: `src/lib/speech/SpeechOutput.demo.tsx`

`SpeechOutput` exports: `speak(text: string): void`, `cancelSpeech(): void`, `isSpeechOutputAvailable(): boolean`. The demo provides a button that calls `speak()`. When running in jsdom (no `speechSynthesis`), `isSpeechOutputAvailable()` returns false — the demo should show a "not available" message in that case.

- **Step 1: Write `SpeechOutput.demo.tsx`**

```tsx
// src/lib/speech/SpeechOutput.demo.tsx
import { useState } from 'react';
import {
  cancelSpeech,
  isSpeechOutputAvailable,
  speak,
} from './SpeechOutput';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';

export const SpeechOutputDemo = () => {
  const [text, setText] = useState('Hello, world!');

  if (!isSpeechOutputAvailable()) {
    return (
      <p className="text-sm text-muted-foreground">
        Speech synthesis is not available in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Text to speak"
        aria-label="Text to speak"
      />
      <div className="flex gap-2">
        <Button onClick={() => speak(text)}>Speak</Button>
        <Button variant="outline" onClick={cancelSpeech}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
```

- **Step 2: Write `SpeechOutput.stories.mdx`**

```mdx
{/* src/lib/speech/SpeechOutput.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { SpeechOutputDemo } from './SpeechOutput.demo';

<Meta title="Services/SpeechOutput" />

# SpeechOutput

Wraps the browser's `SpeechSynthesis` API. Gracefully degrades when the API is unavailable.

## API

| Function                  | Signature                | Description                                            |
| ------------------------- | ------------------------ | ------------------------------------------------------ |
| `speak`                   | `(text: string) => void` | Cancels any current speech, then speaks the given text |
| `cancelSpeech`            | `() => void`             | Stops any in-progress speech                           |
| `isSpeechOutputAvailable` | `() => boolean`          | Returns `true` if `window.speechSynthesis` exists      |

## Interactive Demo

<SpeechOutputDemo />
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 4: Commit**

```bash
git add src/lib/speech/SpeechOutput.stories.mdx src/lib/speech/SpeechOutput.demo.tsx
git commit -m "docs(storybook): add SpeechOutput MDX story and interactive demo"
```

---

## Task 19: SpeechInput MDX + interactive demo

**Files:**

- Create: `src/lib/speech/SpeechInput.stories.mdx`
- Create: `src/lib/speech/SpeechInput.demo.tsx`

`SpeechInput` exports: `createSpeechRecognition(): SpeechRecognitionLike | null`, `isSpeechInputAvailable(): boolean`. The demo creates a recognition instance, starts/stops listening, and shows transcribed text.

- **Step 1: Write `SpeechInput.demo.tsx`**

```tsx
// src/lib/speech/SpeechInput.demo.tsx
import { useState } from 'react';
import {
  createSpeechRecognition,
  isSpeechInputAvailable,
} from './SpeechInput';
import type { SpeechRecognitionLike } from './SpeechInput';
import { Button } from '#/components/ui/button';

export const SpeechInputDemo = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);

  if (!isSpeechInputAvailable()) {
    return (
      <p className="text-sm text-muted-foreground">
        Speech recognition is not available in this browser.
      </p>
    );
  }

  const start = () => {
    const recognition = createSpeechRecognition();
    if (!recognition) return;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (ev: unknown) => {
      const event = ev as SpeechRecognitionEvent;
      const result = event.results[0]?.[0];
      if (result) setTranscript(result.transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <Button onClick={start} disabled={listening}>
        {listening ? 'Listening…' : 'Start listening'}
      </Button>
      {transcript && (
        <p className="rounded border p-2 text-sm">
          <strong>Heard:</strong> {transcript}
        </p>
      )}
    </div>
  );
};
```

- **Step 2: Write `SpeechInput.stories.mdx`**

```mdx
{/* src/lib/speech/SpeechInput.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { SpeechInputDemo } from './SpeechInput.demo';

<Meta title="Services/SpeechInput" />

# SpeechInput

Wraps the browser's `SpeechRecognition` / `webkitSpeechRecognition` API. Returns `null` when unavailable.

## API

| Function                  | Signature                             | Description                                                 |
| ------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `createSpeechRecognition` | `() => SpeechRecognitionLike \| null` | Creates a recognition instance, or `null` if API is missing |
| `isSpeechInputAvailable`  | `() => boolean`                       | Returns `true` if the API is available                      |

## Interactive Demo

<SpeechInputDemo />
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0.

- **Step 4: Commit**

```bash
git add src/lib/speech/SpeechInput.stories.mdx src/lib/speech/SpeechInput.demo.tsx
git commit -m "docs(storybook): add SpeechInput MDX story and interactive demo"
```

---

## Task 20: game-event-bus MDX + interactive demo

**Files:**

- Create: `src/lib/game-event-bus.stories.mdx`
- Create: `src/lib/game-event-bus.demo.tsx`

The demo creates a `TypedGameEventBus` instance, lets the user pick an event type and emit it, and shows a live log of received events.

- **Step 1: Write `game-event-bus.demo.tsx`**

```tsx
// src/lib/game-event-bus.demo.tsx
import { useEffect, useRef, useState } from 'react';
import { createGameEventBus } from './game-event-bus';
import type { GameEvent } from '#/types/game-events';
import { Button } from '#/components/ui/button';

export const GameEventBusDemo = () => {
  const busRef = useRef(createGameEventBus());
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = busRef.current.subscribe(
      'game:*',
      (event: GameEvent) => {
        setLog((prev) => [
          `[${event.type}] ${JSON.stringify(event)}`,
          ...prev.slice(0, 9),
        ]);
      },
    );
    return unsubscribe;
  }, []);

  const emit = (type: GameEvent['type']) => {
    busRef.current.emit({ type } as GameEvent);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => emit('game:start')}>
          Emit game:start
        </Button>
        <Button size="sm" onClick={() => emit('game:end')}>
          Emit game:end
        </Button>
        <Button size="sm" onClick={() => emit('game:answer')}>
          Emit game:answer
        </Button>
      </div>
      <div className="rounded border p-2 font-mono text-xs">
        {log.length === 0 ? (
          <span className="text-muted-foreground">
            No events yet — click a button above.
          </span>
        ) : (
          log.map((entry, i) => <div key={i}>{entry}</div>)
        )}
      </div>
    </div>
  );
};
```

> **Note:** `GameEvent['type']` values must exist in `src/types/game-events.ts`. Check that file and use valid event types. Replace `'game:start'`, `'game:end'`, `'game:answer'` with actual types if they differ.

- **Step 2: Write `game-event-bus.stories.mdx`**

```mdx
{/* src/lib/game-event-bus.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { GameEventBusDemo } from './game-event-bus.demo';

<Meta title="Services/GameEventBus" />

# GameEventBus

A typed pub/sub event bus for coordinating game engine events.

## API

| Function             | Signature            | Description                        |
| -------------------- | -------------------- | ---------------------------------- |
| `createGameEventBus` | `() => GameEventBus` | Creates a new event bus instance   |
| `getGameEventBus`    | `() => GameEventBus` | Returns the process-wide singleton |

### `GameEventBus` interface

- `emit(event: GameEvent): void` — broadcasts to all wildcard + type-specific subscribers
- `subscribe(type: GameEventType | 'game:*', handler): () => void` — returns unsubscribe function

## Interactive Demo

<GameEventBusDemo />
```

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
```

Expected: exits 0. If `GameEvent` types differ, update the event names in `game-event-bus.demo.tsx`.

- **Step 4: Commit**

```bash
git add src/lib/game-event-bus.stories.mdx src/lib/game-event-bus.demo.tsx
git commit -m "docs(storybook): add GameEventBus MDX story and interactive demo"
```

---

## Task 21: useSettings MDX + interactive demo

`useSettings` reads from RxDB via `useRxDB` (requires `DbProvider`). In Storybook, wrap with a `DbProvider` that uses `fake-indexeddb`.

**Files:**

- Create: `src/db/hooks/useSettings.stories.mdx`
- Create: `src/db/hooks/useSettings.demo.tsx`
- **Step 1: Write `useSettings.demo.tsx`**

```tsx
// src/db/hooks/useSettings.demo.tsx
import { IDBFactory } from 'fake-indexeddb';
import { DbProvider } from '#/providers/DbProvider';
import { getOrCreateDatabase } from '#/db';
import { useSettings } from './useSettings';

const openFakeDatabase = () => {
  // Each demo render gets a fresh in-memory IDB.
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
  return getOrCreateDatabase();
};

const SettingsInner = () => {
  const settings = useSettings();

  if (!settings) {
    return (
      <p className="text-sm text-muted-foreground">Loading settings…</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 font-mono text-sm">
      <div>volume: {settings.volume}</div>
      <div>speechRate: {settings.speechRate}</div>
      <div>ttsEnabled: {String(settings.ttsEnabled)}</div>
      <div>showSubtitles: {String(settings.showSubtitles)}</div>
    </div>
  );
};

export const UseSettingsDemo = () => (
  <DbProvider openDatabase={openFakeDatabase}>
    <SettingsInner />
  </DbProvider>
);
```

> **Note:** If `useSettings` returns something other than `SettingsDoc | null`, adjust the destructuring. Check `src/db/hooks/useSettings.ts` for the exact return type.

- **Step 2: Write `useSettings.stories.mdx`**

````mdx
{/* src/db/hooks/useSettings.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { UseSettingsDemo } from './useSettings.demo';

<Meta title="DB Hooks/useSettings" />

# useSettings

Reactive hook that subscribes to the anonymous profile's settings document in RxDB.

## Return value

Returns `SettingsDoc | null`. `null` while the DB is loading or when no settings document exists yet.

```ts
type SettingsDoc = {
  id: string;
  profileId: string;
  volume: number;
  speechRate: number;
  ttsEnabled: boolean;
  showSubtitles: boolean;
  updatedAt: string;
};
```
````

## Interactive Demo

The demo below uses `fake-indexeddb` — no real IndexedDB storage is touched.

````

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
````

Expected: exits 0.

- **Step 4: Commit**

```bash
git add src/db/hooks/useSettings.stories.mdx src/db/hooks/useSettings.demo.tsx
git commit -m "docs(storybook): add useSettings MDX story and fake-indexeddb demo"
```

---

## Task 22: useCustom games MDX + interactive demo

**Files:**

- Create: `src/db/hooks/useCustom games.stories.mdx`
- Create: `src/db/hooks/useCustom games.demo.tsx`
- **Step 1: Write `useCustom games.demo.tsx`**

```tsx
// src/db/hooks/useCustom games.demo.tsx
import { IDBFactory } from 'fake-indexeddb';
import { DbProvider } from '#/providers/DbProvider';
import { getOrCreateDatabase } from '#/db';
import { useCustom games } from './useCustom games';
import { Button } from '#/components/ui/button';

const GAME_IDS = [
  'math-addition',
  'math-subtraction',
  'placeholder-game',
];

const openFakeDatabase = () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
  return getOrCreateDatabase();
};

const Custom gamesInner = () => {
  const { custom gameedIds, toggle } = useCustom games();

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        Custom gameed:{' '}
        {custom gameedIds.size === 0
          ? 'none'
          : [...custom gameedIds].join(', ')}
      </p>
      <div className="flex flex-wrap gap-2">
        {GAME_IDS.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={custom gameedIds.has(id) ? 'default' : 'outline'}
            onClick={() => void toggle(id)}
          >
            {custom gameedIds.has(id) ? '★' : '☆'} {id}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const UseCustom gamesDemo = () => (
  <DbProvider openDatabase={openFakeDatabase}>
    <Custom gamesInner />
  </DbProvider>
);
```

- **Step 2: Write `useCustom games.stories.mdx`**

````mdx
{/* src/db/hooks/useCustom games.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { UseCustom gamesDemo } from './useCustom games.demo';

<Meta title="DB Hooks/useCustom games" />

# useCustom games

Reactive hook that tracks the anonymous profile's custom gameed game IDs in RxDB.

## Return value

```ts
type UseCustom gamesResult = {
  custom gameedIds: Set<string>;
  toggle: (gameId: string) => Promise<void>;
};
```
````

## Interactive Demo

Click the buttons to toggle custom games. State is reactive — changes persist within the demo session and are reflected immediately via RxDB's observable queries. Uses `fake-indexeddb` (no real storage).

````

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
````

Expected: exits 0.

- **Step 4: Commit**

```bash
git add src/db/hooks/useCustom games.stories.mdx src/db/hooks/useCustom games.demo.tsx
git commit -m "docs(storybook): add useCustom games MDX story and fake-indexeddb demo"
```

---

## Task 23: useRxQuery MDX + interactive demo

**Files:**

- Create: `src/db/hooks/useRxQuery.stories.mdx`
- Create: `src/db/hooks/useRxQuery.demo.tsx`

`useRxQuery<T>(source: Observable<T>, initialValue: T): T` — subscribes to an RxJS observable. The demo creates a `Subject` that emits values when a button is clicked.

- **Step 1: Write `useRxQuery.demo.tsx`**

```tsx
// src/db/hooks/useRxQuery.demo.tsx
import { useRef } from 'react';
import { Subject } from 'rxjs';
import { useRxQuery } from './useRxQuery';
import { Button } from '#/components/ui/button';

const CounterDemo = ({ subject$ }: { subject$: Subject<number> }) => {
  const count = useRxQuery(subject$.asObservable(), 0);
  return <p className="text-2xl font-bold tabular-nums">{count}</p>;
};

export const UseRxQueryDemo = () => {
  const subjectRef = useRef(new Subject<number>());
  const countRef = useRef(0);

  const increment = () => {
    countRef.current += 1;
    subjectRef.current.next(countRef.current);
  };

  const reset = () => {
    countRef.current = 0;
    subjectRef.current.next(0);
  };

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <CounterDemo subject$={subjectRef.current} />
      <div className="flex gap-2">
        <Button onClick={increment}>Increment</Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
};
```

- **Step 2: Write `useRxQuery.stories.mdx`**

````mdx
{/* src/db/hooks/useRxQuery.stories.mdx */}
import { Meta } from '@storybook/blocks';
import { UseRxQueryDemo } from './useRxQuery.demo';

<Meta title="DB Hooks/useRxQuery" />

# useRxQuery

Generic hook that subscribes to an RxJS `Observable<T>` and returns the latest emitted value.

## Signature

```ts
function useRxQuery<T>(source: Observable<T>, initialValue: T): T;
```
````

Unsubscribes automatically on unmount or when `source` changes.

## Interactive Demo

The counter below is driven by a `Subject<number>`. Clicking "Increment" emits a new value; `useRxQuery` re-renders with the latest count.

````

- **Step 3: Verify TypeScript**

```bash
yarn typecheck
````

Expected: exits 0.

- **Step 4: Commit**

```bash
git add src/db/hooks/useRxQuery.stories.mdx src/db/hooks/useRxQuery.demo.tsx
git commit -m "docs(storybook): add useRxQuery MDX story and interactive demo"
```

---

## Task 24: Pure utility MDX docs (css-vars, catalog-utils, i18n)

**Files:**

- Create: `src/lib/theme/css-vars.stories.mdx`
- Create: `src/games/catalog-utils.stories.mdx`
- Create: `src/lib/i18n/i18n.stories.mdx`
- **Step 1: Write `css-vars.stories.mdx`**

```mdx
{/* src/lib/theme/css-vars.stories.mdx */}
import { Meta } from '@storybook/blocks';

<Meta title="Theme/CSS Variables" />

# CSS Variables

Utilities for applying theme CSS custom properties to DOM elements.

## API

### `themeDocToCssVars(doc: ThemeDoc): Record<string, string>`

Converts a RxDB `ThemeDoc` (user-defined colors) into a CSS vars map, filling in
static tokens (`--bs-success`, `--bs-warning`, `--bs-error`) from `defaultThemeCssVars`.

### `applyThemeCssVars(element: HTMLElement, vars: Record<string, string>): void`

Calls `element.style.setProperty(key, value)` for each entry. Used by the app's theme
init script and the Storybook `withTheme` decorator.

## Token Reference

| Variable          | Default (light) | Role                  |
| ----------------- | --------------- | --------------------- |
| `--bs-primary`    | `#0077B6`       | Primary action colour |
| `--bs-secondary`  | `#00B4D8`       | Secondary / accent    |
| `--bs-background` | `#EAF6FB`       | Page background       |
| `--bs-surface`    | `#FFFFFF`       | Card / panel surface  |
| `--bs-text`       | `#023E57`       | Body text             |
| `--bs-accent`     | `#FFB703`       | Highlight / badge     |
| `--bs-success`    | `#2DC653`       | Success state         |
| `--bs-warning`    | `#F4A261`       | Warning state         |
| `--bs-error`      | `#E63946`       | Error / destructive   |
```

- **Step 2: Write `catalog-utils.stories.mdx`**

````mdx
{/* src/games/catalog-utils.stories.mdx */}
import { Meta } from '@storybook/blocks';

<Meta title="Utils/CatalogUtils" />

# CatalogUtils

Pure filter and pagination utilities for the game catalog. No side effects, no DB required.

## API

### `filterCatalog(catalog: GameCatalogEntry[], filter: CatalogFilter): GameCatalogEntry[]`

Filters by `level`, `subject`, and `search` (case-insensitive substring match on `titleKey`).
All filter fields are optional — empty string or empty value means "no filter".

```ts
type CatalogFilter = {
  search: string;
  level: GameLevel | '';
  subject: GameSubject | '';
};
```
````

### `paginateCatalog<T>(items: T[], page: number, pageSize: number): PaginateResult<T>`

Returns a page slice. `page` is 1-indexed and clamped to `[1, totalPages]`.

```ts
type PaginateResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};
```

````

- [ ] **Step 3: Write `i18n.stories.mdx`**

```mdx
{/* src/lib/i18n/i18n.stories.mdx */}
import { Meta } from '@storybook/blocks';

<Meta title="Utils/i18n" />

# i18n

Internationalisation setup using `i18next` + `react-i18next`.

## Supported locales

| Code | Language |
|---|---|
| `en` | English (default) |
| `pt-BR` | Brazilian Portuguese |

## Namespaces

| Namespace | Keys |
|---|---|
| `common` | App name, nav labels, pagination, search, levels, offline banner |
| `games` | Game title keys (e.g. `math-addition`) |
| `settings` | Settings page labels |
| `encouragements` | Positive feedback messages |

## Usage in components

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
// t('appName') → 'BaseSkill'
// t('levels.K') → 'Kindergarten'
````

The locale is driven by the URL parameter `/$locale`. Components call `useTranslation` directly;
they do not read the locale from i18next config at runtime — the router renders the right locale subtree.

````

- [ ] **Step 4: Verify TypeScript**

```bash
yarn typecheck
````

Expected: exits 0.

- **Step 5: Commit**

```bash
git add src/lib/theme/css-vars.stories.mdx src/games/catalog-utils.stories.mdx src/lib/i18n/i18n.stories.mdx
git commit -m "docs(storybook): add MDX docs for css-vars, catalog-utils, and i18n"
```

---

## Task 25: Full Storybook smoke test

Before touching CI, verify the complete Storybook build works.

- **Step 1: Build Storybook**

```bash
yarn build-storybook
```

Expected: exits 0. Output is in `storybook-static/`.

- **Step 2: Serve and run the test runner**

```bash
npx http-server storybook-static --port 6006 &
sleep 5
yarn test:storybook --url http://localhost:6006
```

Expected: all stories pass a11y checks. Fix any `axe-core` violations before proceeding. Common fixes:

- Missing `aria-label` on icon buttons → add `aria-label` prop in the story's `args`
- Color contrast failures → these are CSS issues, note them and continue (they won't block CI if `continue-on-error` is set)

Kill the server after the run.

- **Step 3: Commit any a11y fixes made during this task**

```bash
git add -p  # stage only the story/component fixes
git commit -m "fix(a11y): fix accessibility violations found during Storybook test run"
```

---

## Task 26: Update `deploy.yml` for Storybook build + merge

**Files:**

- Modify: `.github/workflows/deploy.yml`

The current workflow uploads `dist/client/` as the Pages artifact. Storybook should be built and merged into `dist/client/docs/` before that upload. Add two steps **after** "SPA fallback for GitHub Pages" and **before** "Stamp version.json":

- **Step 1: Add Storybook build and merge steps to the `build` job in `deploy.yml`**

After the `SPA fallback for GitHub Pages (history routing)` step, add:

```yaml
- name: Build Storybook
  run: yarn build-storybook --output-dir storybook-static

- name: Merge Storybook into dist
  run: mkdir -p dist/client/docs && cp -r storybook-static/. dist/client/docs
```

- **Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML OK"
```

Expected: prints `YAML OK`.

- **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build Storybook and merge into dist/client/docs on deploy"
```

---

## Task 27: Add `storybook-test` CI job to `ci.yml`

**Files:**

- Modify: `.github/workflows/ci.yml`

Add a new `storybook-test` job that builds Storybook, serves it, and runs `test-storybook`. It runs in parallel with the other jobs (not `needs` anything).

- **Step 1: Add the `storybook-test` job to `.github/workflows/ci.yml`**

Append this job to the `jobs:` section (after the `build:` job):

```yaml
storybook-test:
  name: Storybook Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc'
        cache: yarn

    - name: Install dependencies
      run: yarn install --frozen-lockfile

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Build Storybook
      run: yarn build-storybook --output-dir storybook-static

    - name: Serve Storybook
      run: npx http-server storybook-static --port 6006 &

    - name: Wait for Storybook
      run: npx wait-on http://localhost:6006 --timeout 60000

    - name: Run Storybook tests
      run: yarn test:storybook --url http://localhost:6006

    - name: Upload Playwright traces on failure
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: storybook-playwright-traces
        path: test-results/
        retention-days: 7
```

- **Step 2: Add `wait-on` package (needed for the wait step)**

```bash
yarn add --dev wait-on
```

- **Step 3: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML OK"
```

Expected: prints `YAML OK`.

- **Step 4: Commit**

```bash
git add .github/workflows/ci.yml package.json yarn.lock
git commit -m "ci: add storybook-test job with a11y assertions and trace upload"
```

---

## Task 28: Install `@storybook/addon-mcp` and register Storybook MCP for agents

The `@storybook/addon-mcp` addon requires Storybook 10.3+ (satisfied by Task 2). Task 2 pins `^10.3.0`; use Step 1 below as a safety check if the lockfile was edited manually.

**Prerequisite for using the HTTP MCP endpoint:** With the addon installed, run `yarn storybook` so Storybook serves on port **6006**. Agent clients only reach `http://localhost:6006/mcp` while dev is running; this is not available from CI-only workflows.

**Files:**

- Modify: `package.json`
- Modify: `.storybook/main.ts`
- Modify: `.mcp.json`
- **Step 1: Check the installed Storybook version**

```bash
node -e "console.log(require('./node_modules/storybook/package.json').version)"
```

Expected: `10.3.x` or higher. If the version is below `10.3.0`, run `npx storybook@latest upgrade` (or bump Task 2 ranges), then reinstall — do not skip the addon without fixing the version.

- **Step 2: Add the addon via the Storybook CLI**

```bash
npx storybook add @storybook/addon-mcp
```

This command updates both `package.json` and `.storybook/main.ts` automatically. Verify it was added to the `addons` array in `main.ts`.

- **Step 3: Verify Storybook still starts**

```bash
yarn build-storybook 2>&1 | tail -5
```

Expected: build succeeds (exits 0).

- **Step 4: Commit the addon**

```bash
git add package.json yarn.lock .storybook/main.ts
git commit -m "chore(storybook): add @storybook/addon-mcp for AI-assisted story authoring"
```

- **Step 5: Register the Storybook HTTP MCP server in the project MCP config**

Per the [Storybook MCP for React](https://storybook.js.org/blog/storybook-mcp-for-react/) setup, wire the IDE/agent client to the addon’s endpoint:

```bash
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

- **Step 6: Merge check on `.mcp.json`**

Open `.mcp.json` and confirm it still includes the `**playwright**` server from Task 9 **and** the new Storybook HTTP entry. If `mcp-add` replaced the file or dropped `playwright`, restore the Task 9 block manually so both servers remain configured.

- **Step 7: Commit MCP client registration**

```bash
git add .mcp.json
git commit -m "chore: register Storybook MCP HTTP endpoint for agent tooling"
```

---

## Task 29: Open pull request

- **Step 1: Push the branch**

```bash
git push -u origin milestone-storybook-setup
```

- **Step 2: Open the PR**

```bash
gh pr create \
  --title "feat(storybook): add Storybook 10.3+ with full component stories, a11y CI, Pages deploy, and Storybook MCP" \
  --body "$(cat <<'EOF'
## Summary

- Installs Storybook 10.3+ (`@storybook/react-vite`) with essentials, a11y, themes, test-runner, and `@storybook/addon-mcp`
- Registers [Storybook MCP for React](https://storybook.js.org/blog/storybook-mcp-for-react/) in `.mcp.json` (`mcp-add` HTTP → `http://localhost:6006/mcp`) alongside Playwright MCP so agents get component metadata, story context, and test hooks when `yarn storybook` is running
- Adds stories for all existing components (`src/components/`), shadcn/ui primitives, and all services/hooks in `src/lib/` and `src/db/hooks/`
- Configures `withTheme` decorator (reuses `applyThemeCssVars`) and `withRouter` decorator (TanStack Router memory history)
- Deploys Storybook as a static site at `/base-skill/docs/` via the existing GitHub Pages pipeline
- Adds `storybook-test` CI job with Playwright a11y assertions and trace upload on failure

## Test plan

- [ ] `yarn storybook` starts on port 6006, all stories visible
- [ ] Theme toolbar switches CSS vars correctly
- [ ] Header and Footer stories render without router errors
- [ ] `yarn build-storybook` exits 0
- [ ] `yarn test:storybook` exits 0 (no a11y violations)
- [ ] CI `storybook-test` job passes
- [ ] With `yarn storybook` running, agent MCP client can reach Storybook MCP (`.mcp.json` includes HTTP entry per Task 28)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage check:**

| Spec requirement                                                                                                                           | Covered in task                |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Storybook 10.3+, `@storybook/react-vite`                                                                                                   | Task 2, 4                      |
| `viteFinal` sets `base: '/base-skill/docs/'`                                                                                               | Task 4                         |
| `preview.ts` — CSS import, i18n, viewports, theme toolbar                                                                                  | Task 6                         |
| `withTheme` decorator — reuses `applyThemeCssVars`                                                                                         | Task 5                         |
| `export default meta` allowed in `.stories.`\* files                                                                                       | Documented in all story tasks  |
| shadcn/ui primitive stories                                                                                                                | Tasks 11–13                    |
| All component stories (GameCard, GameGrid, etc.)                                                                                           | Tasks 14–17                    |
| Service stories with demos (Speech, EventBus)                                                                                              | Tasks 18–20                    |
| RxDB hook demos wrapped in `DbProvider` + `fake-indexeddb`                                                                                 | Tasks 21–23                    |
| Pure util MDX docs                                                                                                                         | Task 24                        |
| Docs link in Header                                                                                                                        | Task 10                        |
| `playwright.config.ts` trace: retain-on-failure                                                                                            | Task 8                         |
| `.mcp.json` with `@playwright/mcp`                                                                                                         | Task 9                         |
| `@storybook/addon-mcp`                                                                                                                     | Task 28                        |
| Storybook MCP client registration (`mcp-add` + merged `.mcp.json`, [announcement](https://storybook.js.org/blog/storybook-mcp-for-react/)) | Task 28                        |
| Deploy: Storybook merged into `dist/client/docs/`                                                                                          | Task 26                        |
| CI: `storybook-test` job with a11y + trace upload                                                                                          | Task 27                        |
| `viewport` default: `tabletLandscape`                                                                                                      | Task 6                         |
| `defaultViewport: 'tabletLandscape'`                                                                                                       | Task 6                         |
| `tags: ['autodocs']` on all component stories                                                                                              | All story tasks                |
| Callbacks as Actions                                                                                                                       | All story tasks with callbacks |

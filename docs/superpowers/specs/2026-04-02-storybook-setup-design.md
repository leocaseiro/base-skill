# Storybook Setup Design

**Date:** 2026-04-02
**Status:** Approved

---

## Overview

Set up Storybook 10 as a fully integrated component documentation and visual regression testing tool for BaseSkill. Storybook deploys as a static site at `/base-skill/docs/` alongside the main app on GitHub Pages, sharing the same GitHub Actions deploy pipeline.

---

## Architecture & Deployment

Storybook 10 uses the `@storybook/react-vite` builder. It is a fully separate static site that merges into the main app's GitHub Pages deploy artifact.

**Config structure:**

```
.storybook/
  main.ts               ← addon list, viteFinal sets base: '/base-skill/docs/'
  preview.ts            ← global decorators (theme, i18n, providers), viewport config, CSS import
  decorators/
    withTheme.tsx       ← injects CSS vars from toolbar theme selection
```

`styles.css` is imported directly in `preview.ts` via `import '../src/styles.css'` — the standard Vite approach. No `preview-head.html` needed.

**Build output merging:**

```
dist/                   → https://leocaseiro.github.io/base-skill/
dist/docs/              → https://leocaseiro.github.io/base-skill/docs/
```

Storybook builds to `storybook-static/`, then CI copies it to `dist/docs/` after the main app builds. One `gh-pages` branch, one deploy step, two static apps.

**Development:** Storybook runs on port 6006 (`yarn storybook`) alongside the main app on port 3000 (`yarn dev`). No conflicts.

**App navigation:** A "Docs" link in the app header points to `/base-skill/docs/`. No TanStack route is needed — the browser loads Storybook's own `index.html`, which handles all internal navigation via query params (`?path=/story/...`). Deep links are bookmarkable and shareable.

---

## Story Conventions

Stories use CSF 3.0, co-located with their source file:

```
src/components/GameCard.tsx
src/components/GameCard.stories.tsx      ← component stories

src/lib/speech/SpeechOutput.ts
src/lib/speech/SpeechOutput.stories.mdx ← MDX for services
src/lib/speech/SpeechOutput.demo.tsx    ← interactive demo component
```

**Standard component story structure:**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { GameCard } from './GameCard';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    isBookmarked: false,
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = { args: { ... } };
export const Bookmarked: Story = { args: { isBookmarked: true } };
```

**Rules:**

- All component stories get `tags: ['autodocs']` — auto-generates a docs page with prop table and live examples
- Callbacks (`onPlay`, `onBookmarkToggle`, etc.) are wired via `argTypes` as Actions so clicks log in the Actions panel
- Each meaningful visual state gets its own named export (`Default`, `Bookmarked`, `Loading`, `Empty`, etc.)
- shadcn/ui primitives (`button.tsx`, `card.tsx`, `input.tsx`, etc.) also get stories — they are the VR baselines for the design system
- `export default meta` is required by Storybook's CSF format — `.stories.tsx` files and all `.storybook/` config files are treated as framework config files, exempt from the project's no-default-export rule

---

## Theme Decorator & Toolbar

A global decorator in `preview.ts` calls the same `injectCssVars()` function from `src/lib/theme/css-vars.ts` that the app already uses. No duplication — theme changes in the app automatically reflect in Storybook.

A "Theme" dropdown in the Storybook toolbar is populated from `src/lib/theme/default-tokens.ts`. Selecting a theme applies its CSS variables to the story wrapper element.

```ts
// .storybook/preview.ts
export const globalTypes = {
  theme: {
    name: 'Theme',
    toolbar: {
      icon: 'paintbrush',
      items: ['light', 'dark', 'high-contrast'],
      dynamicTitle: true,
    },
  },
};

export const decorators = [withTheme];
```

The `withTheme` decorator also toggles the `<html>` class (`light`/`dark`) to match the app's `THEME_INIT_SCRIPT` behaviour, ensuring dark mode CSS rules apply correctly in stories.

---

## Service & Utility Stories

Non-visual modules use MDX files with interactive demo components where the service can run in the browser.

**Pattern for services with side effects:**

```
src/lib/speech/SpeechOutput.stories.mdx   ← API docs + embedded demo
src/lib/speech/SpeechOutput.demo.tsx      ← minimal interactive React component
```

The `.demo.tsx` file is Storybook-only — not a test, not production code. It provides just enough UI to exercise the service interactively.

**RxDB hooks** (`useSettings`, `useBookmarks`, `useRxQuery`) wrap their demos in a `<DbProvider>` backed by `fake-indexeddb` (already a dev dependency) so reactive state changes are visible live without touching real storage.

**Pure utils** (`css-vars.ts`, `catalog-utils.ts`, `i18n`) get MDX-only documentation — no interactive demo where output is not visual.

**Services covered in this milestone:**

| Module           | Story type | Interactive?                |
| ---------------- | ---------- | --------------------------- |
| `SpeechOutput`   | MDX + demo | Yes — speak button          |
| `SpeechInput`    | MDX + demo | Yes — listen button         |
| `game-event-bus` | MDX + demo | Yes — emit/subscribe UI     |
| `useSettings`    | MDX + demo | Yes — wrapped in DbProvider |
| `useBookmarks`   | MDX + demo | Yes — wrapped in DbProvider |
| `useRxQuery`     | MDX + demo | Yes — wrapped in DbProvider |
| `css-vars`       | MDX only   | No                          |
| `catalog-utils`  | MDX only   | No                          |
| `i18n`           | MDX only   | No                          |

---

## Viewport Configuration

Default viewport is **Tablet Landscape** — the primary device orientation for children using this app.

```ts
export const parameters = {
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
};
```

---

## Visual Regression & Accessibility Testing

**Tooling:** `@storybook/test-runner` + Playwright. No cloud services.

**VR screenshots** are captured at three viewports per story:

- `mobileLg` (390×844)
- `tabletPortrait` (768×1024)
- `tabletLandscape` (1024×768)

Desktop screenshots are taken only for parent-facing stories (`parent/`, `settings`).

Baseline screenshots are committed to `src/**/__snapshots__/` alongside stories, consistent with the existing Playwright convention.

**Accessibility:** `@storybook/addon-a11y` runs in the browser during development. In CI, `@storybook/test-runner` asserts zero `axe-core` violations per story, using the same `axe-core` library already present via `@axe-core/playwright`.

**Trace recording:** Playwright traces are enabled with `trace: 'retain-on-failure'` in `playwright.config.ts`. The test-runner respects this config, so any failed story test (VR diff, a11y violation, crash) produces a `.zip` trace file. Traces are uploaded as a CI artifact and can be replayed locally with:

```bash
npx playwright show-trace trace.zip
```

This allows step-by-step reproduction of any failing test without needing to re-run CI.

---

## CI Integration

Two additions to the GitHub Actions workflow:

**`storybook-build` step** (after main app build, before deploy):

```yaml
- name: Build Storybook
  run: yarn build-storybook --output-dir storybook-static

- name: Merge into dist
  run: mkdir -p dist/docs && cp -r storybook-static/. dist/docs
```

**`storybook-test` step** (separate job, runs against built output):

```yaml
- name: Serve Storybook
  run: npx http-server storybook-static --port 6006 &

- name: Run Storybook tests
  run: yarn test-storybook --url http://localhost:6006

- name: Upload Playwright traces on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: storybook-playwright-traces
    path: test-results/
    retention-days: 7
```

**New `package.json` scripts:**

```json
"storybook": "storybook dev --port 6006",
"build-storybook": "storybook build",
"test:storybook": "test-storybook"
```

---

## Addons

| Addon                         | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `@storybook/addon-essentials` | Actions, Controls, Docs, Viewport, Backgrounds, Toolbars     |
| `@storybook/addon-a11y`       | Accessibility panel + CI assertions                          |
| `@storybook/addon-themes`     | Theme toolbar integration                                    |
| `@storybook/test-runner`      | Playwright-based story test runner (VR + a11y CI)            |
| `@storybook/addon-mcp`        | MCP server for AI-assisted story authoring (Storybook 10.3+) |

---

## MCP Developer Tooling

Two MCP servers are configured to enable AI-assisted development with Claude Code against the running Storybook instance.

**`@storybook/addon-mcp`** — installed as a Storybook addon. When `yarn storybook` runs, it auto-starts an MCP server at `http://localhost:6006/mcp`. Claude Code can use it to query the component catalog, inspect story metadata, and trigger test execution without leaving the editor. Install via:

```bash
npx storybook add @storybook/addon-mcp
```

Register the HTTP endpoint in the project MCP config so the agent client connects to the running dev server (Storybook must be up on port 6006 for the tools to respond):

```bash
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

Keep this entry alongside the Playwright server in `.mcp.json`; if `mcp-add` overwrites the file, restore the `playwright` block from the plan. For teams that do not run Storybook locally, [Chromatic can publish a remote Storybook MCP](https://storybook.js.org/blog/storybook-mcp-for-react/) — optional and out of scope for this milestone.

**`@playwright/mcp`** — configured in the project's `.mcp.json` as a local MCP server. Gives Claude Code a live browser to navigate Storybook, interact with Controls, take screenshots, and replay failing VR tests visually. Config:

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

**How they complement each other during development:**

| Task                                   | Tool                                                      |
| -------------------------------------- | --------------------------------------------------------- |
| "What props does `GameCard` accept?"   | Storybook MCP — queries story metadata                    |
| "Show me the Bookmarked variant"       | Storybook MCP — previews story live                       |
| "Why is this VR test failing?"         | Playwright MCP — navigates browser, takes screenshot      |
| "Write a story for this new component" | Storybook MCP — provides component context for generation |

Neither MCP server is used in CI — they are local dev tooling only.

---

## Scope for This Milestone

This milestone establishes the framework. Stories are written for **all currently existing components and services** in `src/`:

- `src/components/` — all components including shadcn/ui primitives
- `src/lib/` — speech, theme, i18n, game-event-bus
- `src/db/hooks/` — useSettings, useBookmarks, useRxQuery, useRxDB

Stories for **M4 game engine components** (`DragAndDrop`, `LetterTracer`, `MultipleChoice`, etc.) are written as part of M4 implementation, following the conventions established here.

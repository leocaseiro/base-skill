# Fix: Storybook / VR / E2E Test Failures

Branch: `feat/word-spell-number-match`
Date: 2026-04-04
Status: **Diagnosis complete — fixes not yet applied**

---

## Root Cause

`AnswerGameProvider` now calls `useGameTTS` → `useSettings` → `useRxDB`, which requires
a `DbProvider` context. No story that renders `AnswerGameProvider` (or a full game
component) provides that context, so all of them crash with:

> **`useRxDB must be used within DbProvider`**

Additionally, `WordSpell.tsx` and `NumberMatch.tsx` now call `useNavigate`/`useParams`
directly, which produces `useRouter must be used inside a <RouterProvider>` warnings.
Those warnings are non-fatal on their own, but the stories still fail because of the
`DbProvider` issue above.

---

## What needs to be done

### Step 1 — Create shared `withDb` decorator

Create `.storybook/decorators/withDb.tsx` (mirror the pattern from `withRouter.tsx`):

```tsx
import { createStorybookDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import type { Decorator } from '@storybook/react';

export const withDb: Decorator = (Story) => (
  <DbProvider openDatabase={createStorybookDatabase}>
    <Story />
  </DbProvider>
);
```

Reference: see how `GameShell.stories.tsx` defines `withDb` locally (lines 14-18).

---

### Step 2 — Add `withDb` to all 9 failing stories

All these need `withDb` in their `meta.decorators` array (or at story level if needed):

| Story file                                                               | Current decorators             | Add                     |
| ------------------------------------------------------------------------ | ------------------------------ | ----------------------- |
| `src/components/questions/AudioButton/AudioButton.stories.tsx`           | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.stories.tsx` | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/components/questions/TextQuestion/TextQuestion.stories.tsx`         | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/components/questions/ImageQuestion/ImageQuestion.stories.tsx`       | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx`         | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx`     | `[AnswerGameProvider wrapper]` | `withDb`                |
| `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`           | none                           | `withDb`                |
| `src/games/word-spell/WordSpell/WordSpell.stories.tsx`                   | none                           | `withDb` + `withRouter` |
| `src/games/number-match/NumberMatch/NumberMatch.stories.tsx`             | none                           | `withDb` + `withRouter` |

For the stories that wrap in `AnswerGameProvider`, `withDb` should come **before** the
`AnswerGameProvider` wrapper in the array so it is the outermost provider:

```tsx
decorators: [
  withDb,
  (Story) => (
    <AnswerGameProvider config={storyConfig}>
      <Story />
    </AnswerGameProvider>
  ),
],
```

For `AnswerGame.stories.tsx`, `WordSpell.stories.tsx`, `NumberMatch.stories.tsx` which
had no decorators, add them at the meta level:

```tsx
// WordSpell / NumberMatch (need both)
decorators: [withDb, withRouter],

// AnswerGame (only needs db)
decorators: [withDb],
```

---

### Step 3 — Update the `write-storybook` skill

Add `withDb` to the decorators table in
`.claude/skills/write-storybook/index.md` (or wherever the skill lives):

| Needs                                                   | Decorator                                            |
| ------------------------------------------------------- | ---------------------------------------------------- |
| TanStack Router (`useNavigate`, `Link`, params)         | `withRouter` from `.storybook/decorators/withRouter` |
| Database / RxDB (`useSettings`, `useRxDB`, any DB hook) | `withDb` from `.storybook/decorators/withDb`         |
| Theme toggle                                            | `withTheme` — already applied globally               |
| ThemeProvider                                           | Already applied globally — do NOT add again          |

---

### Step 4 — VR tests

VR failures are likely downstream of the Storybook failures (VR snapshots the same
stories). Once Storybook tests pass, run:

```bash
yarn test:vr
```

If diffs are intentional (new UI components), update baselines:

```bash
yarn test:vr:update
```

---

### Step 5 — E2E tests

Check what specific E2E tests are failing:

```bash
yarn test:e2e 2>&1 | head -80
```

Two recent commits addressed E2E issues:

- `fix(e2e): use different port for VR tests on local`
- `fix(e2e): include withRouter decorator`

May need further investigation after Storybook passes.

---

## Verified Evidence

- `yarn test --run` → **203 tests pass** (unit tests are clean)
- `yarn test:storybook` → **29 failed / 70 passed** in 9 suites
- Every failure: `useRxDB must be used within DbProvider`
- `WordSpell`/`NumberMatch` also log `useRouter` warnings (non-fatal)

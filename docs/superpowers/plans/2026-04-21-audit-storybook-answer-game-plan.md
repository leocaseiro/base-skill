# Audit `src/components/answer-game/*` Stories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit the 8 `src/components/answer-game/*.stories.tsx` files to the Controls Policy and Required Variants gates. Three files are upgraded beyond minimal compliance into genuine interactive playgrounds (AnswerGame, InstructionsOverlay, Slot).

**Architecture:** Tiered execution. Tier 1 (Slot, AnswerGame, InstructionsOverlay) runs subagent-driven with per-file two-stage review. Tier 2 (EncouragementAnnouncer, GameOverOverlay, LevelCompleteOverlay, ProgressHUD, ScoreAnimation) runs as a single consolidated implementer with one end-of-tier review. One commit per story file. After all commits land, a single end-of-PR task verifies typecheck, lint, lint:md, and the full Storybook test-runner.

**Tech Stack:** Storybook 10.3.3 (`@storybook/react-vite`), `storybook/test` subpath (exposes `userEvent`, `within`, `expect`, `fn`, `waitFor`), `@storybook/addon-a11y` (global `a11y.test: 'error'`), Radix primitives (portals into `document.body` for `Dialog` / `AdvancedConfigModal`), `vitest` (`vi.useFakeTimers` is available in `play()` because the Storybook test-runner shares the Vitest runtime), `@tanstack/react-router` (InstructionsOverlay uses `useNavigate` — requires `withRouter` decorator).

**Spec:** `docs/superpowers/specs/2026-04-21-audit-storybook-answer-game-design.md` — the per-file audit section is authoritative.

---

## Shared Conventions (applies to every task)

- **Worktree:** all work happens in `worktrees/storybook-audit-batch-2-answer-game/` on branch `audit/storybook-batch-2-answer-game`. Never touch `master`.
- **Import source for test helpers:** `import { userEvent, within, expect, fn, waitFor } from 'storybook/test';` — the subpath, NOT `@storybook/test`.
- **Radix portal gotcha:** `InstructionsOverlay` renders its entire content through `createPortal(..., document.body)`, and its `AdvancedConfigModal` + save-on-play `Dialog` are Radix-portaled. Queries scoped to `within(canvasElement)` will miss all of it. Use `within(document.body)` for every assertion. Wrap `toBeVisible()` and `queryByRole(...).toBeNull()` in `waitFor()` to tolerate animation races.
- **No manual action wiring:** `.storybook/preview.tsx` sets a global `actions.argTypesRegex`, but react-docgen does not expand DOM-extended prop types — so the regex matches nothing for most handler props. Always wire `args: { onFoo: fn() }` from `storybook/test` explicitly. Never use `argTypes: { onFoo: { action: 'xxx' } }`.
- **Controls map:** enum/union → `control: { type: 'select' }` + `options`; boolean → `control: 'boolean'`; bounded number → `control: { type: 'range', min, max, step }`; free text → `control: 'text'`. Callbacks get `table: { disable: true }` in argTypes. JSX nodes get `control: false`.
- **Story names:** PascalCase, describe state/flow: `AutoDismissesAfter2s`, `ClicksPlayAgain`, `TogglesBookmark`. No combinatorial names.
- **Import order (ESLint `import/order` as enforced in this repo):** value imports alphabetical → relative imports → `storybook/test` → `@storybook/react` type import last → `react` type import. See `src/components/ui/alert-dialog.stories.tsx` for a canonical pilot example.
- **`export default meta`** is the one allowed default export (framework config exception).
- **StoryArgs-wrapper components** (Complex Object Props pattern): extend `StoryArgs` with handler fields, thread through `render`, hide from Controls with `argTypes: { onFoo: { table: { disable: true } } }`. Cast the `component` field with `as unknown as ComponentType<StoryArgs>` (see pilot alert-dialog pattern).
- **Per-task verification** (always run before committing):
  - `yarn typecheck` → exit 0
  - `yarn lint` → exit 0
  - Do NOT run `yarn test:storybook` per task — too slow. Task 9 (end-of-PR) covers it.
- **Commit message shape:** `stories(answer-game/<name>): retrofit per controls policy` with a body listing which gates were applied. If any `play()` was dropped, explain why.
- **Reference files when in doubt:**
  - Pilot retrofitted example with fn() + waitFor: `src/components/ui/alert-dialog.stories.tsx`
  - Complex Object Props pattern: `src/components/ui/card.stories.tsx`
  - Real-game composition (AnswerGame wiring for the Tier-1 playground): `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
  - Slot internals: `src/components/answer-game/Slot/Slot.tsx`, `src/components/answer-game/Slot/SlotRow.tsx`, `src/components/answer-game/Slot/useSlotBehavior.ts`
  - Game colours enum: `src/lib/game-colors.ts` (exports `GAME_COLORS` and `GameColorKey`)

---

## Tier 1 — Complex (subagent-driven, Sonnet implementer + two-stage Haiku review per task)

### Task 1: Retrofit `Slot.stories.tsx` — collapse 8 scenes into a single Playground story

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.stories.tsx`
- Read (for context): `src/components/answer-game/Slot/Slot.tsx`, `src/components/answer-game/Slot/SlotRow.tsx`, `src/components/answer-game/Slot/SentenceWithGaps.tsx`, `src/components/answer-game/Slot/useSlotBehavior.ts`, `src/components/answer-game/AnswerGameProvider.tsx`, `src/components/answer-game/useAnswerGameDispatch.ts`, `src/components/answer-game/types.ts`

**Gates applied (from spec §8):**

- Controls: `variant` select, `label` text, `filled` boolean, `isWrong` boolean, `dragPreview` select.
- `fn()` cleanup: N/A — no handlers.
- State variants: single `Playground` story replaces all 8 existing scenes.
- `play()`: N/A — drag state is simulated via dispatch, not user events.

**Steps:**

- [ ] **Step 1: Delete the existing file contents** and replace with the new `Playground`-only structure.

Full file:

```tsx
import { useEffect } from 'react';

import { withDb } from '../../../../.storybook/decorators/withDb';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { SentenceWithGaps } from './SentenceWithGaps';
import { Slot } from './Slot';
import { SlotRow } from './SlotRow';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { SlotRenderProps } from './useSlotBehavior';
import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

type SlotVariant = 'letter' | 'dice' | 'domino' | 'inline-gap';
type DragPreview = 'none' | 'target-empty' | 'target-swap';

interface StoryArgs {
  variant: SlotVariant;
  label: string;
  filled: boolean;
  isWrong: boolean;
  dragPreview: DragPreview;
}

const baseConfig: AnswerGameConfig = {
  gameId: 'slot-storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const makeTile = (id: string, label: string): TileItem => ({
  id,
  label,
  value: label,
});

const makeZone = (
  index: number,
  placedTileId: string | null = null,
  isWrong = false,
): AnswerZone => ({
  id: `z${String(index)}`,
  index,
  expectedValue: String(index),
  placedTileId,
  isWrong,
  isLocked: false,
});

const variantConfig: Record<
  SlotVariant,
  { slotClass: string; contentClass: string }
> = {
  letter: {
    slotClass: 'size-14 rounded-lg',
    contentClass: 'text-xl font-bold',
  },
  dice: {
    slotClass: 'size-20 rounded-xl',
    contentClass: 'text-2xl font-bold',
  },
  domino: {
    slotClass: 'h-[72px] w-32 rounded-xl',
    contentClass: 'text-3xl font-bold',
  },
  'inline-gap': { slotClass: '', contentClass: '' },
};

const PlaygroundInner = ({
  variant,
  dragPreview,
  contentClass,
  slotClass,
}: {
  variant: SlotVariant;
  dragPreview: DragPreview;
  contentClass: string;
  slotClass: string;
}) => {
  const dispatch = useAnswerGameDispatch();

  useEffect(() => {
    if (dragPreview === 'none') {
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
      return;
    }
    // Both previews drag tile t0 over zone 1.
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't0' });
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: 1 });
  }, [dispatch, dragPreview]);

  if (variant === 'inline-gap') {
    return (
      <div className="p-4">
        <SentenceWithGaps sentence="The {0} sat on the mat." />
      </div>
    );
  }

  const renderContent = ({ label }: SlotRenderProps) => (
    <span className={contentClass}>{label ?? ''}</span>
  );

  return (
    <SlotRow className="gap-3">
      {[0, 1, 2].map((i) => (
        <Slot key={i} index={i} className={slotClass}>
          {(props) => renderContent(props)}
        </Slot>
      ))}
    </SlotRow>
  );
};

const meta: Meta<StoryArgs> = {
  component: SlotRow as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/Slot',
  tags: ['autodocs'],
  decorators: [withDb],
  args: {
    variant: 'letter',
    label: 'A',
    filled: true,
    isWrong: false,
    dragPreview: 'none',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'letter',
        'dice',
        'domino',
        'inline-gap',
      ] satisfies SlotVariant[],
    },
    label: { control: 'text' },
    filled: { control: 'boolean' },
    isWrong: { control: 'boolean' },
    dragPreview: {
      control: { type: 'select' },
      options: [
        'none',
        'target-empty',
        'target-swap',
      ] satisfies DragPreview[],
    },
  },
  render: ({ variant, label, filled, isWrong, dragPreview }) => {
    const { slotClass, contentClass } = variantConfig[variant];

    // Build tiles/zones depending on variant + flags.
    const tiles: TileItem[] =
      variant === 'inline-gap'
        ? [makeTile('s0', label || 'cat')]
        : dragPreview === 'target-swap'
          ? [
              makeTile('t0', label || 'A'),
              makeTile('t1', 'B'),
              makeTile('t2', 'C'),
            ]
          : [
              makeTile('t0', label || 'A'),
              makeTile('t1', 'B'),
              makeTile('t2', 'C'),
            ];

    const zones: AnswerZone[] =
      variant === 'inline-gap'
        ? [makeZone(0, filled ? 's0' : null, isWrong)]
        : dragPreview === 'target-swap'
          ? [
              makeZone(0, 't0'),
              makeZone(1, 't1', isWrong),
              makeZone(2, 't2'),
            ]
          : [
              makeZone(0, filled ? 't0' : null, isWrong),
              makeZone(1),
              makeZone(2),
            ];

    return (
      <AnswerGameProvider
        config={{
          ...baseConfig,
          gameId: `slot-${variant}-${String(filled)}-${dragPreview}`,
          initialTiles: tiles,
          initialZones: zones,
        }}
      >
        <PlaygroundInner
          variant={variant}
          dragPreview={dragPreview}
          contentClass={contentClass}
          slotClass={slotClass}
        />
      </AnswerGameProvider>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
```

- [ ] **Step 2: Run `yarn typecheck` — expect exit 0.**

Run: `yarn typecheck`. If the `SlotRenderProps` import path or any other symbol doesn't match, fix by reading the referenced source file.

- [ ] **Step 3: Run `yarn lint` — expect exit 0.**

Run: `yarn lint`. Common failures: `import/order` (fix by regrouping to match the Shared Conventions rule); unused imports (remove).

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/Slot/Slot.stories.tsx
git commit -m "stories(answer-game/Slot): retrofit per controls policy

Collapse 8 bespoke scene stories into a single Playground story with
args-driven variant / label / filled / isWrong / dragPreview controls.
Remove the bare 'import React from \"react\"'.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Retrofit `AnswerGame.stories.tsx` — real interactive playground

**Files:**

- Modify: `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`
- Read (for context): `src/components/answer-game/AnswerGame/AnswerGame.tsx`, `src/components/answer-game/AnswerGameProvider.tsx`, `src/components/answer-game/types.ts`, `src/components/answer-game/useAnswerGameContext.ts`, `src/components/answer-game/useAnswerGameDispatch.ts`, `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` (authoritative wiring reference — the playground mirrors its shape)

**Gates applied (from spec §7):**

- Controls: `StoryArgs` breaks `config` into `inputMethod` select, `wrongTileBehavior` select, `tileBankMode` select, `totalRounds` range, `ttsEnabled` boolean.
- `fn()` cleanup: N/A — AnswerGame has no direct handlers.
- `play()`: skipped — HTML5 DnD is unreliable in jsdom.
- State variants: `Default`, `TextQuestionMode`, `RejectMode`, `LockManualMode`.
- Decorator: `withDb`.

**Architecture note for the implementer:** `AnswerGame` itself is a shell (wraps `AnswerGameProvider`, renders `ProgressHUDRoot` + children). The playground stories render children (`AnswerGame.Question`, `AnswerGame.Answer`, `AnswerGame.Choices`) with real primitives:

- `AnswerGame.Question`: a simple prompt string.
- `AnswerGame.Answer`: real `SlotRow` + `Slot`s driven by `zones` from `useAnswerGameContext`.
- `AnswerGame.Choices`: a minimal tap-to-place tile bank (click a bank tile → `dispatch({ type: 'PLACE_TILE', tileId, zoneIndex: <next empty zone> })`).

The tap-to-place bank is a local component defined inside the story file — do not extract it. Keep all non-trivial wiring inside the file so future story edits don't need to hunt for helpers.

**Steps:**

- [ ] **Step 1: Read the reference wiring.** Open `src/games/sort-numbers/SortNumbers/SortNumbersSession.tsx` (the function component defined inline in `SortNumbers.tsx`) — note how it (a) reads `zones` from `useAnswerGameContext()`, (b) renders `SlotRow` + `Slot` inside `AnswerGame.Answer`, (c) renders a tile bank inside `AnswerGame.Choices`.

- [ ] **Step 2: Replace `AnswerGame.stories.tsx` with the playground structure.**

Full file:

```tsx
import { withDb } from '../../../../.storybook/decorators/withDb';
import { AnswerGame } from './AnswerGame';
import { Slot } from '../Slot/Slot';
import { SlotRow } from '../Slot/SlotRow';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

type InputMethod = 'drag' | 'type' | 'both';
type WrongTileBehavior = 'reject' | 'lock-manual' | 'lock-auto-eject';
type TileBankMode = 'exact' | 'distractors';

interface StoryArgs {
  inputMethod: InputMethod;
  wrongTileBehavior: WrongTileBehavior;
  tileBankMode: TileBankMode;
  totalRounds: number;
  ttsEnabled: boolean;
}

const initialTiles: TileItem[] = [
  { id: 'c', label: 'C', value: 'C' },
  { id: 'a', label: 'A', value: 'A' },
  { id: 't', label: 'T', value: 'T' },
];

const initialZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 'T',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const TapToPlaceBank = () => {
  const { allTiles, bankTileIds, zones } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  const nextEmptyZoneIndex = zones.findIndex(
    (z) => z.placedTileId === null,
  );

  return (
    <div className="flex gap-2">
      {bankTileIds.map((tileId) => {
        const tile = allTiles.find((t) => t.id === tileId);
        if (!tile) return null;
        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => {
              if (nextEmptyZoneIndex === -1) return;
              dispatch({
                type: 'PLACE_TILE',
                tileId: tile.id,
                zoneIndex: nextEmptyZoneIndex,
              });
            }}
            className="flex size-14 items-center justify-center rounded-lg border-2 border-primary bg-background text-xl font-bold shadow-sm active:scale-95"
          >
            {tile.label}
          </button>
        );
      })}
    </div>
  );
};

const PlayableScene = () => {
  const { zones } = useAnswerGameContext();

  return (
    <>
      <AnswerGame.Question>
        <p className="text-center text-lg font-semibold text-foreground">
          Spell CAT
        </p>
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <SlotRow className="gap-2">
          {zones.map((zone, i) => (
            <Slot
              key={zone.id}
              index={i}
              className="size-14 rounded-lg"
            >
              {({ label }) => (
                <span className="text-xl font-bold">{label ?? ''}</span>
              )}
            </Slot>
          ))}
        </SlotRow>
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <TapToPlaceBank />
      </AnswerGame.Choices>
    </>
  );
};

const meta: Meta<StoryArgs> = {
  component: AnswerGame as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: [withDb],
  args: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    ttsEnabled: false,
  },
  argTypes: {
    inputMethod: {
      control: { type: 'select' },
      options: ['drag', 'type', 'both'] satisfies InputMethod[],
    },
    wrongTileBehavior: {
      control: { type: 'select' },
      options: [
        'reject',
        'lock-manual',
        'lock-auto-eject',
      ] satisfies WrongTileBehavior[],
    },
    tileBankMode: {
      control: { type: 'select' },
      options: ['exact', 'distractors'] satisfies TileBankMode[],
    },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    ttsEnabled: { control: 'boolean' },
  },
  render: ({
    inputMethod,
    wrongTileBehavior,
    tileBankMode,
    totalRounds,
    ttsEnabled,
  }) => {
    const config: AnswerGameConfig = {
      gameId: 'storybook-answer-game',
      inputMethod,
      wrongTileBehavior,
      tileBankMode,
      totalRounds,
      ttsEnabled,
      initialTiles,
      initialZones,
    };
    return (
      <AnswerGame config={config}>
        <PlayableScene />
      </AnswerGame>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const TextQuestionMode: Story = {
  args: { inputMethod: 'type' },
};

export const RejectMode: Story = {
  args: { wrongTileBehavior: 'reject' },
};

export const LockManualMode: Story = {
  args: { wrongTileBehavior: 'lock-manual' },
};
```

- [ ] **Step 3: Run `yarn typecheck` — expect exit 0.**

If the `useAnswerGameContext` return shape differs from what's assumed (e.g., the hook exposes fields with different names), read the hook source file and adjust. The plan assumed `{ allTiles, bankTileIds, zones }` — verify before adjusting.

- [ ] **Step 4: Run `yarn lint` — expect exit 0.**

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/AnswerGame/AnswerGame.stories.tsx
git commit -m "stories(answer-game/AnswerGame): retrofit per controls policy

Rebuild as a real interactive playground — StoryArgs breaks config into
individual controls, render wires a real AnswerGameProvider + real Slot
row + a minimal tap-to-place tile bank (dispatch PLACE_TILE).

play() skipped: HTML5 drag-and-drop is unreliable in jsdom; interactive
correctness of DnD is covered at the e2e layer.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Retrofit `InstructionsOverlay.stories.tsx` — actually clickable stories

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`
- Read (for context): `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, `src/lib/game-colors.ts`, `.storybook/decorators/withRouter.tsx`, `.storybook/decorators/withDb.tsx`, `src/components/AdvancedConfigModal.tsx` (skim — to know the dialog role/name for portal assertions)

**Gates applied (from spec §6):**

- Controls: `StoryArgs` exposes `text`, `gameTitle`, `gameId`, `customGameColor` select (options from `GAME_COLORS`), `ttsEnabled` boolean, `isBookmarked` boolean, `config.totalRounds` range, `customGameName` text, `customGameId` text.
- `fn()` cleanup: replace all `{ action: '…' }` entries with `args: { onStart: fn(), onSaveCustomGame: fn(), onUpdateCustomGame: fn(), onToggleBookmark: fn(), onConfigChange: fn() }`.
- Decorators: `withDb` + `withRouter`.
- State variants (re-typed against `StoryArgs`): `Default`, `WithCustomGame`, `WordSpellDefault`, `NotBookmarked`, `Bookmarked`, `NotBookmarkedCustomGame`, `BookmarkedCustomGame`.
- `play()`: `StartsGame`, `TogglesBookmark`, `OpensSettings`.
- TTS guard: every story uses `ttsEnabled: false`.

**Steps:**

- [ ] **Step 1: Replace `InstructionsOverlay.stories.tsx`** with the new structure.

Full file (the `GAME_COLOR_OPTIONS` array below mirrors `GAME_COLOR_KEYS` from `src/lib/game-colors.ts` as of `origin/master`; if that file has been updated since the plan was written, align before proceeding):

```tsx
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { SaveCustomGameInput } from './InstructionsOverlay';
import type { GameColorKey } from '@/lib/game-colors';
import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface StoryArgs {
  text: string;
  gameTitle: string;
  gameId: string;
  customGameColor: GameColorKey;
  ttsEnabled: boolean;
  isBookmarked: boolean;
  totalRounds: number;
  customGameId: string;
  customGameName: string;
  onStart: () => void;
  onSaveCustomGame: (input: SaveCustomGameInput) => Promise<string>;
  onUpdateCustomGame: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: unknown; color?: GameColorKey },
  ) => Promise<void>;
  onToggleBookmark: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
}

const GAME_COLOR_OPTIONS = [
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
] as const satisfies readonly GameColorKey[];

const meta: Meta<StoryArgs> = {
  component: InstructionsOverlay as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: { layout: 'fullscreen' },
  args: {
    text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
    gameTitle: 'Sort Numbers',
    gameId: 'sort-numbers',
    customGameColor: 'indigo' as GameColorKey,
    ttsEnabled: false,
    isBookmarked: false,
    totalRounds: 5,
    customGameId: '',
    customGameName: '',
    onStart: fn(),
    onSaveCustomGame: fn(async () => 'stub-id'),
    onUpdateCustomGame: fn(async () => {}),
    onToggleBookmark: fn(),
    onConfigChange: fn(),
  },
  argTypes: {
    text: { control: 'text' },
    gameTitle: { control: 'text' },
    gameId: { control: 'text' },
    customGameColor: {
      control: { type: 'select' },
      options: GAME_COLOR_OPTIONS,
    },
    ttsEnabled: { control: 'boolean' },
    isBookmarked: { control: 'boolean' },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    customGameId: { control: 'text' },
    customGameName: { control: 'text' },
    onStart: { table: { disable: true } },
    onSaveCustomGame: { table: { disable: true } },
    onUpdateCustomGame: { table: { disable: true } },
    onToggleBookmark: { table: { disable: true } },
    onConfigChange: { table: { disable: true } },
  },
  render: ({
    text,
    gameTitle,
    gameId,
    customGameColor,
    ttsEnabled,
    isBookmarked,
    totalRounds,
    customGameId,
    customGameName,
    onStart,
    onSaveCustomGame,
    onUpdateCustomGame,
    onToggleBookmark,
    onConfigChange,
  }) => (
    <InstructionsOverlay
      text={text}
      gameTitle={gameTitle}
      gameId={gameId}
      customGameColor={customGameColor}
      ttsEnabled={ttsEnabled}
      isBookmarked={isBookmarked}
      config={{ totalRounds }}
      customGameId={customGameId || undefined}
      customGameName={customGameName || undefined}
      onStart={onStart}
      onSaveCustomGame={onSaveCustomGame}
      onUpdateCustomGame={onUpdateCustomGame}
      onToggleBookmark={onToggleBookmark}
      onConfigChange={onConfigChange}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const WithCustomGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal' as GameColorKey,
  },
};

export const WordSpellDefault: Story = {
  args: {
    text: 'Drag the letters to spell the word.',
    gameTitle: 'Word Spell',
    gameId: 'word-spell',
    totalRounds: 8,
  },
};

export const NotBookmarked: Story = {
  args: { isBookmarked: false },
};

export const Bookmarked: Story = {
  args: { isBookmarked: true },
};

export const NotBookmarkedCustomGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal' as GameColorKey,
    isBookmarked: false,
  },
};

export const BookmarkedCustomGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal' as GameColorKey,
    isBookmarked: true,
  },
};

export const StartsGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
  },
  play: async ({ args }) => {
    // InstructionsOverlay renders into document.body via createPortal.
    const portal = within(document.body);
    await userEvent.click(
      await portal.findByRole('button', { name: /let/i }),
    );
    await waitFor(() => {
      expect(args.onStart).toHaveBeenCalled();
    });
  },
};

export const TogglesBookmark: Story = {
  args: { isBookmarked: false },
  play: async ({ args }) => {
    const portal = within(document.body);
    const bookmarkButton = await portal.findByRole('button', {
      name: /bookmark/i,
    });
    await userEvent.click(bookmarkButton);
    await waitFor(() => {
      expect(args.onToggleBookmark).toHaveBeenCalledTimes(1);
    });
  },
};

export const OpensSettings: Story = {
  play: async () => {
    const portal = within(document.body);
    const settingsButton = await portal.findByRole('button', {
      name: /configure/i,
    });
    await userEvent.click(settingsButton);
    await waitFor(() => {
      expect(portal.getByRole('dialog')).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(portal.queryByRole('dialog')).toBeNull();
    });
  },
};
```

- [ ] **Step 2: Verify decorator paths.** Confirm `'../../../../.storybook/decorators/withRouter'` resolves — the same 4-level `../` depth that `withDb` uses. If the `withRouter` decorator file doesn't exist, check `.storybook/decorators/` and adjust the import.

- [ ] **Step 3: Run `yarn typecheck` — expect exit 0.**

If `onSaveCustomGame`/`onUpdateCustomGame` type arguments don't match (component signature tweaks or mocking the async return), import the exact `SaveCustomGameInput` type from the component and align.

- [ ] **Step 4: Run `yarn lint` — expect exit 0.**

- [ ] **Step 5: Check accessible names.** If during Step 3/4 you notice a role/name mismatch in the portal queries (e.g., the bookmark button's aria-label differs between translation keys — `Remove bookmark` vs `Add bookmark` are both present in `HeaderActions`), adjust the regex to match what the component actually renders.

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx
git commit -m "stories(answer-game/InstructionsOverlay): retrofit per controls policy

Rebuild as an interactive story — StoryArgs exposes text, gameTitle,
gameId, customGameColor select, ttsEnabled, isBookmarked,
config.totalRounds range, customGameId/Name. All handlers wired to
fn() spies. Decorators: withDb + withRouter.

Three play() flows: StartsGame, TogglesBookmark, OpensSettings (portal-
scoped, Escape-close). ttsEnabled: false throughout to avoid the TTS
crash path.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

**If `OpensSettings` proves brittle** (portal animation races that `waitFor` can't tame, focus flicker, Radix version quirks), drop that specific story and add a line to the commit body: `Dropped OpensSettings: <specific reason>`. The two remaining `play()` stories still satisfy the interactive-component gate.

---

## Tier 2 — Simple (consolidated single implementer, one end-of-tier review)

Tasks 4–8 run as a sequence in one session. The implementer writes each file, runs `yarn typecheck` + `yarn lint`, commits, then moves to the next. After Task 8, a single Haiku code-quality reviewer reviews all five commits at once.

### Task 4: Retrofit `EncouragementAnnouncer.stories.tsx`

**Files:**

- Modify: `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx`
- Read (for context): `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.tsx`

**Steps:**

- [ ] **Step 1: Replace the file** with:

```tsx
import { useState } from 'react';
import { vi } from 'vitest';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { EncouragementAnnouncer } from './EncouragementAnnouncer';
import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface StoryArgs {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const ShowTrigger = ({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setVisible(true)}
        disabled={visible}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        Show encouragement
      </button>
      <EncouragementAnnouncer
        visible={visible}
        message={message}
        onDismiss={() => {
          setVisible(false);
          onDismiss();
        }}
      />
    </>
  );
};

const meta: Meta<StoryArgs> = {
  component:
    EncouragementAnnouncer as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    message: 'Keep trying!',
    visible: false,
    onDismiss: fn(),
  },
  argTypes: {
    message: { control: 'text' },
    visible: { control: 'boolean' },
    onDismiss: { table: { disable: true } },
  },
  render: ({ message, visible, onDismiss }) => (
    <EncouragementAnnouncer
      message={message}
      visible={visible}
      onDismiss={onDismiss}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Hidden: Story = {
  args: { visible: false, message: 'Keep trying!' },
};

export const Visible: Story = {
  args: { visible: true, message: 'Almost! Try again.' },
};

export const ReplayTrigger: Story = {
  args: { message: 'Great job!' },
  render: ({ message, onDismiss }) => (
    <ShowTrigger message={message} onDismiss={onDismiss} />
  ),
};

export const AutoDismissesAfter2s: Story = {
  args: { message: 'Keep trying!' },
  render: ({ message, onDismiss }) => (
    <ShowTrigger message={message} onDismiss={onDismiss} />
  ),
  play: async ({ args, canvasElement }) => {
    vi.useFakeTimers();
    try {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole('button', { name: /show encouragement/i }),
      );
      await waitFor(() => {
        expect(canvas.getByText(/keep trying/i)).toBeVisible();
      });
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(args.onDismiss).toHaveBeenCalled();
      });
    } finally {
      vi.useRealTimers();
    }
  },
};
```

- [ ] **Step 2: `yarn typecheck` — exit 0.**
- [ ] **Step 3: `yarn lint` — exit 0.**
- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx
git commit -m "stories(answer-game/EncouragementAnnouncer): retrofit per controls policy

StoryArgs: message text, visible boolean. onDismiss wired to fn() spy.
ReplayTrigger story adds a button wrapper so the story is actually
interactive. AutoDismissesAfter2s play() asserts the 2s auto-dismiss
via vi.useFakeTimers / advanceTimersByTime(2000).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Retrofit `GameOverOverlay.stories.tsx`

**Files:**

- Modify: `src/components/answer-game/GameOverOverlay/GameOverOverlay.stories.tsx`

**Steps:**

- [ ] **Step 1: Replace the file** with:

```tsx
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { GameOverOverlay } from './GameOverOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameOverOverlay> = {
  component: GameOverOverlay,
  tags: ['autodocs'],
  args: {
    retryCount: 0,
    onPlayAgain: fn(),
    onHome: fn(),
  },
  argTypes: {
    retryCount: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
    },
    onPlayAgain: { table: { disable: true } },
    onHome: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof GameOverOverlay>;

export const FiveStars: Story = { args: { retryCount: 0 } };
export const FourStars: Story = { args: { retryCount: 1 } };
export const ThreeStars: Story = { args: { retryCount: 3 } };
export const TwoStars: Story = { args: { retryCount: 5 } };
export const OneStar: Story = { args: { retryCount: 8 } };

export const ClicksPlayAgain: Story = {
  args: { retryCount: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /play again/i }),
    );
    await waitFor(() => {
      expect(args.onPlayAgain).toHaveBeenCalledTimes(1);
    });
  },
};

export const ClicksHome: Story = {
  args: { retryCount: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /home/i }),
    );
    await waitFor(() => {
      expect(args.onHome).toHaveBeenCalledTimes(1);
    });
  },
};
```

If the component uses a different accessible name for either button (e.g., i18n keys produce a different label), update the regex in the `play()` story to match what the component actually renders (read `GameOverOverlay.tsx` to confirm).

- [ ] **Step 2: `yarn typecheck` — exit 0.**
- [ ] **Step 3: `yarn lint` — exit 0.**
- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/GameOverOverlay/GameOverOverlay.stories.tsx
git commit -m "stories(answer-game/GameOverOverlay): retrofit per controls policy

StoryArgs: retryCount range. onPlayAgain/onHome wired to fn() spies.
One story per visible star count (Five/Four/Three/Two/One).
ClicksPlayAgain and ClicksHome play() stories assert spies.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Retrofit `LevelCompleteOverlay.stories.tsx`

**Files:**

- Modify: `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx`

**Steps:**

- [ ] **Step 1: Replace the file** with:

```tsx
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelCompleteOverlay> = {
  component: LevelCompleteOverlay,
  tags: ['autodocs'],
  args: {
    level: 1,
    onNextLevel: fn(),
    onDone: fn(),
  },
  argTypes: {
    level: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    onNextLevel: { table: { disable: true } },
    onDone: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof LevelCompleteOverlay>;

export const Level1: Story = { args: { level: 1 } };
export const Level3: Story = { args: { level: 3 } };
export const Level10: Story = { args: { level: 10 } };

export const ClicksNextLevel: Story = {
  args: { level: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /next level/i }),
    );
    await waitFor(() => {
      expect(args.onNextLevel).toHaveBeenCalledTimes(1);
    });
  },
};

export const ClicksDone: Story = {
  args: { level: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /done/i }),
    );
    await waitFor(() => {
      expect(args.onDone).toHaveBeenCalledTimes(1);
    });
  },
};
```

Same caveat as Task 5 — adjust `{ name: /.../ }` regex if the actual button labels differ.

- [ ] **Step 2: `yarn typecheck` — exit 0.**
- [ ] **Step 3: `yarn lint` — exit 0.**
- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx
git commit -m "stories(answer-game/LevelCompleteOverlay): retrofit per controls policy

StoryArgs: level range. onNextLevel/onDone wired to fn() spies.
ClicksNextLevel and ClicksDone play() stories assert spies.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Retrofit `ProgressHUD.stories.tsx`

**Files:**

- Modify: `src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx`

**Steps:**

- [ ] **Step 1: Replace the file** with:

```tsx
import { ProgressHUD } from './ProgressHUD';
import type { AnswerGamePhase } from '../types';
import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface StoryArgs {
  roundIndex: number;
  totalRounds: number;
  totalRoundsIsNull: boolean;
  levelIndex: number;
  isLevelMode: boolean;
  phase: AnswerGamePhase;
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}

const meta: Meta<StoryArgs> = {
  component: ProgressHUD as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/ProgressHUD',
  parameters: { layout: 'centered' },
  args: {
    roundIndex: 2,
    totalRounds: 5,
    totalRoundsIsNull: false,
    levelIndex: 0,
    isLevelMode: false,
    phase: 'playing',
    showDots: true,
    showFraction: true,
    showLevel: false,
  },
  argTypes: {
    roundIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
    },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    totalRoundsIsNull: { control: 'boolean' },
    levelIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
    },
    isLevelMode: { control: 'boolean' },
    phase: {
      control: { type: 'select' },
      options: [
        'playing',
        'round-complete',
        'level-complete',
        'game-over',
      ] satisfies AnswerGamePhase[],
    },
    showDots: { control: 'boolean' },
    showFraction: { control: 'boolean' },
    showLevel: { control: 'boolean' },
  },
  render: ({
    roundIndex,
    totalRounds,
    totalRoundsIsNull,
    levelIndex,
    isLevelMode,
    phase,
    showDots,
    showFraction,
    showLevel,
  }) => (
    <ProgressHUD
      roundIndex={roundIndex}
      totalRounds={totalRoundsIsNull ? null : totalRounds}
      levelIndex={levelIndex}
      isLevelMode={isLevelMode}
      phase={phase}
      showDots={showDots}
      showFraction={showFraction}
      showLevel={showLevel}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Classic_Round3Of5: Story = {};

export const Classic_LastRound: Story = {
  args: { roundIndex: 4, totalRounds: 5 },
};

export const DotsOnly: Story = {
  args: { showFraction: false, showLevel: false },
};

export const FractionOnly: Story = {
  args: { showDots: false, showLevel: false },
};

export const LevelMode_Level3: Story = {
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 2,
    showFraction: false,
    showLevel: true,
  },
};

export const LevelMode_Level10: Story = {
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 9,
    showFraction: false,
    showLevel: true,
  },
};

export const Mixed_LevelPlusFraction: Story = {
  args: {
    isLevelMode: true,
    totalRounds: 5,
    levelIndex: 2,
    showFraction: true,
    showLevel: true,
  },
};

export const RoundCompletePhase: Story = {
  args: { phase: 'round-complete' },
};

export const AllFlagsOff: Story = {
  args: { showDots: false, showFraction: false, showLevel: false },
};
```

The import was `@storybook/react-vite` before — this task switches it to `@storybook/react` to match the project convention used everywhere else.

- [ ] **Step 2: `yarn typecheck` — exit 0.**
- [ ] **Step 3: `yarn lint` — exit 0.**
- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx
git commit -m "stories(answer-game/ProgressHUD): retrofit per controls policy

StoryArgs with explicit controls for every prop (ranges, selects,
booleans). Preserves all 9 existing stories. Fix import from
@storybook/react-vite → @storybook/react to match project convention.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Retrofit `ScoreAnimation.stories.tsx`

**Files:**

- Modify: `src/components/answer-game/ScoreAnimation/ScoreAnimation.stories.tsx`

**Steps:**

- [ ] **Step 1: Replace the file** with:

```tsx
import { ScoreAnimation } from './ScoreAnimation';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ScoreAnimation> = {
  component: ScoreAnimation,
  tags: ['autodocs'],
  args: { visible: false },
  argTypes: {
    visible: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof ScoreAnimation>;

export const Playing: Story = { args: { visible: false } };
export const Complete: Story = { args: { visible: true } };
```

- [ ] **Step 2: `yarn typecheck` — exit 0.**
- [ ] **Step 3: `yarn lint` — exit 0.**
- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/ScoreAnimation/ScoreAnimation.stories.tsx
git commit -m "stories(answer-game/ScoreAnimation): retrofit per controls policy

StoryArgs: visible boolean. Pure-display component — no play() story.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: End-of-PR verification

**Goal:** Prove nothing regressed across the whole Storybook and that every in-scope file passes its gates.

- [ ] **Step 1: Run typecheck, lint, and markdown lint.**

```bash
yarn typecheck
yarn lint
yarn lint:md
```

All three must exit 0.

- [ ] **Step 2: Start Storybook on a free port and run the test-runner.**

```bash
PORT=6006
while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
yarn storybook --port $PORT --ci &
STORYBOOK_PID=$!
until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done

yarn test:storybook --url http://127.0.0.1:$PORT
TEST_EXIT=$?

if [ $TEST_EXIT -eq 0 ]; then
  kill $STORYBOOK_PID
fi

exit $TEST_EXIT
```

Expected: every story (not just `answer-game/*`) passes a11y + `play()`.

- If a non-`answer-game/*` story fails, treat it as pre-existing and out of scope — log it in the PR description; do not fix here (spec Risks row 6).
- If an `answer-game/*` `play()` fails, fix the specific story and recommit. The most likely culprit is the `InstructionsOverlay.OpensSettings` portal flow — if it proves irreducibly flaky, delete that single story, amend the Task 3 commit's body to document the drop reason, and re-run.

- [ ] **Step 3: Verify branch log**

```bash
git log --oneline origin/master..HEAD
```

Expected: the spec-corrective commit (`docs(spec): correct tileBankMode enum values`), the initial spec commit (`docs(spec): audit batch 2 for src/components/answer-game/* stories`), 8 `stories(answer-game/*): retrofit per controls policy` commits, plus any fix-up commits the review loop required.

- [ ] **Step 4: Update issue #125.** Tick the 8 Batch 2 checkboxes in the tracking issue body.

```bash
gh issue view 125 --json body --jq '.body'    # read current body
# ... tick the 8 relevant lines ...
gh issue edit 125 --body-file <(...)          # post updated body
```

- [ ] **Step 5: Open the PR.**

Title: `stories(answer-game): audit retrofit per new controls policy`.

Body must include:

- Link to `.claude/skills/write-storybook/SKILL.md`.
- The per-file audit summary table from the spec (reviewer orientation).
- List of any `play()` stories dropped and why.
- List of any pre-existing out-of-scope test failures surfaced by the test-runner.
- Link to issue #125.

```bash
gh pr create --base master --title "stories(answer-game): audit retrofit per new controls policy" --body "$(cat <<'EOF'
## Summary

Batch 2 of the Storybook controls audit rollout — retrofits the 8
`src/components/answer-game/*.stories.tsx` files to the Controls Policy
and Required Variants gates in
[`.claude/skills/write-storybook/SKILL.md`](../blob/master/.claude/skills/write-storybook/SKILL.md).

Three files upgraded beyond minimal compliance:

- `AnswerGame` — real interactive playground (live `AnswerGameProvider`
  + real `Slot` row + tap-to-place tile bank).
- `InstructionsOverlay` — actually clickable (three `play()` flows).
- `Slot` — 8 scene stories collapsed to one args-driven `Playground`.

Closes part of #125.

## Per-file audit

_(paste the summary table from `docs/superpowers/specs/2026-04-21-audit-storybook-answer-game-design.md`)_

## Test plan

- [ ] `yarn typecheck` green
- [ ] `yarn lint` green
- [ ] `yarn lint:md` green
- [ ] `yarn test:storybook` green (all stories)
- [ ] Storybook Controls panel actually drives the 3 upgraded stories
EOF
)"
```

---

## Post-plan

After the PR merges:

- Remove the worktree: `git worktree remove worktrees/storybook-audit-batch-2-answer-game`
- Tick Batch 2 boxes in issue #125.
- Next batches (on #125 tracker): `questions/*`, `games/*`, component roots.

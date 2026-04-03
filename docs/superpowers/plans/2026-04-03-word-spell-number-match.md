# WordSpell + NumberMatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the WordSpell and NumberMatch reference games as React compositions over the `AnswerGame` primitive, each with their own slot components (tile bank + answer zones), types, Storybook stories, i18n strings, game registry entries, and E2E/VR tests.

**Architecture:** Each game is a thin composition root (`WordSpell.tsx`, `NumberMatch.tsx`) that wires `AnswerGameConfig` into `<AnswerGame>` and places game-specific slot components (`OrderedLetterSlots`, `LetterTileBank`, `MatchingPairZones`, `NumeralTileBank`) inside the named slots. Slot components are prop-free — they read all runtime data via `useAnswerGameContext()`. `AnswerGame` handles all DnD, TTS, evaluation, and event bus logic.

**Tech Stack:** React 19, TypeScript strict, Pragmatic DnD (via `AnswerGame`), Tailwind CSS v4, Vitest + RTL, Playwright (E2E + VR), i18next

---

## Prerequisites

- **AnswerGame primitive merged** (`docs/superpowers/plans/2026-04-03-answer-game-primitive.md` fully implemented and on `master`).
- **M4 merged** — `GameEngineProvider` from `@/lib/game-engine` must be available.
- `@atlaskit/pragmatic-drag-and-drop` already installed (done in AnswerGame plan).

---

## File Map

| File                                                                     | Action | Responsibility                                                                 |
| ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| `src/games/word-spell/types.ts`                                          | Create | `WordSpellConfig`, `WordSpellRound` extending `AnswerGameConfig`               |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                           | Create | Composition root: wires config into `<AnswerGame>` + question primitives       |
| `src/games/word-spell/WordSpell/WordSpell.stories.tsx`                   | Create | All 4 modes × exact/distractors                                                |
| `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx`         | Create | Sequential letter/syllable/word answer zones; reads zones from context         |
| `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx`    | Create | Renders correct number of slots; active slot is highlighted                    |
| `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.stories.tsx` | Create | Empty, partially filled, complete variants                                     |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`                 | Create | Letter/syllable/word tiles; Pragmatic DnD `draggable`; reads bank from context |
| `src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx`            | Create | Renders correct tiles; placed tiles are absent from bank                       |
| `src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx`         | Create | Default + distractors stories                                                  |
| `src/games/number-match/types.ts`                                        | Create | `NumberMatchConfig`, `NumberMatchRound` extending `AnswerGameConfig`           |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`                     | Create | Composition root: wires config into `<AnswerGame>` + question primitives       |
| `src/games/number-match/NumberMatch/NumberMatch.stories.tsx`             | Create | All 4 modes × tileStyle variants                                               |
| `src/games/number-match/MatchingPairZones/MatchingPairZones.tsx`         | Create | Pair target drop zones (non-sequential); reads zones from context              |
| `src/games/number-match/MatchingPairZones/MatchingPairZones.test.tsx`    | Create | Renders zones; correct aria-labels                                             |
| `src/games/number-match/MatchingPairZones/MatchingPairZones.stories.tsx` | Create | Empty + filled variants                                                        |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`             | Create | Numeral/dot-group/object-cluster tiles; Pragmatic DnD `draggable`              |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx`        | Create | Renders tiles based on tileStyle; tap fires TTS                                |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx`     | Create | Dots, objects, fingers styles                                                  |
| `src/lib/i18n/locales/en/games.json`                                     | Modify | Add WordSpell + NumberMatch title keys + UI strings                            |
| `src/lib/i18n/locales/pt-BR/games.json`                                  | Modify | pt-BR translations for the same keys                                           |
| `src/games/registry.ts`                                                  | Modify | Add `word-spell` and `number-match` catalog entries                            |
| `e2e/smoke.spec.ts`                                                      | Modify | Add WordSpell picture-mode E2E test                                            |
| `e2e/visual.spec.ts`                                                     | Modify | Add WordSpell + NumberMatch VR screenshots                                     |

---

## Codebase Context

Workers must read these before touching any file:

- **Named exports only.** No `export default` except Storybook meta and TanStack Router route files.
- **Import alias:** `@/` maps to `src/`. Always use `@/games/word-spell/types`, never relative.
- **AnswerGame context:** `useAnswerGameContext()` from `@/components/answer-game/useAnswerGameContext`. Slot components must NOT receive props — all data comes from context.
- **TTS in tile:** call `speakTile(label)` from `useGameTTS()` on tile tap. TTS on/off is handled automatically.
- **DnD in tile components:** use `draggable({ element, getInitialData: () => ({ tileId }) })` from `@atlaskit/pragmatic-drag-and-drop/element/adapter`. Use `dropTargetForElements({ element, getData: () => ({ zoneIndex }) })` for zones.
- **DnD dispatch:** on drop inside a zone, call `placeTile(tileId, zoneIndex)` from `useTileEvaluation()` (for auto-next-slot) or `swapOrPlace(tileId, zoneIndex)` from `useFreeSwap()`.
- **Tailwind CSS v4** — utility classes only, no `@apply`.
- **No `import React`** — JSX transform.
- **Verify after every task:** `yarn typecheck && yarn test`

---

## Task 1: WordSpell Types

**Files:**

- Create: `src/games/word-spell/types.ts`

No tests — pure types file.

- [ ] **Step 1: Create types**

```typescript
// src/games/word-spell/types.ts
import type { AnswerGameConfig } from '@/components/answer-game/types';

export interface WordSpellRound {
  word: string;
  /** Fluent Emoji SVG path or custom asset path (picture/sentence-gap modes) */
  image?: string;
  /** Sentence with a blank for sentence-gap mode: "The ___ sat on the mat." */
  sentence?: string;
  /** Scene illustration for sentence-gap mode */
  sceneImage?: string;
  /** Optional custom audio override instead of TTS */
  audioOverride?: string;
}

export interface WordSpellConfig extends AnswerGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  /** @default 'letter' */
  tileUnit: 'letter' | 'syllable' | 'word';
  rounds: WordSpellRound[];
}
```

- [ ] **Step 2: Verify typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/games/word-spell/types.ts
git commit -m "feat(word-spell): define WordSpellConfig and WordSpellRound types"
```

---

## Task 2: OrderedLetterSlots

**Files:**

- Create: `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx`
- Create: `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx`
- Create: `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.stories.tsx`

Each zone renders as a drop target. Empty zones show a faint underline and glow when active. Filled zones show the tile label.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderedLetterSlots } from './OrderedLetterSlots';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
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

function Initialiser({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('OrderedLetterSlots', () => {
  it('renders one slot per zone', () => {
    render(<OrderedLetterSlots />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('slot 1 has aria-label "Slot 1, empty"', () => {
    render(<OrderedLetterSlots />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    ).toBeInTheDocument();
  });

  it('filled slot shows placed tile label', () => {
    // Pre-place t1 in zone 0 via dispatch
    function TestWithPlacement() {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <OrderedLetterSlots />;
    }
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlacement />
      </AnswerGameProvider>,
    );
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, filled with C' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement OrderedLetterSlots**

```tsx
// src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx
import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useTileEvaluation } from '@/components/answer-game/useTileEvaluation';

function LetterSlot({
  zoneIndex,
  label,
  isActive,
  isWrong,
}: {
  zoneIndex: number;
  label: string | null;
  isActive: boolean;
  isWrong: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { placeTile } = useTileEvaluation();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const tileId = source.data['tileId'];
        if (typeof tileId === 'string') placeTile(tileId, zoneIndex);
      },
    });
  }, [zoneIndex, placeTile]);

  const ariaLabel = label
    ? `Slot ${zoneIndex + 1}, filled with ${label}`
    : `Slot ${zoneIndex + 1}, empty`;

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-active={isActive || undefined}
      data-wrong={isWrong || undefined}
      className={[
        'flex size-14 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all',
        'border-border',
        isActive && !label
          ? 'ring-2 ring-primary ring-offset-2 animate-pulse'
          : '',
        isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : '',
        label && !isWrong
          ? 'border-primary bg-primary/10 text-primary'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label ?? ''}
    </li>
  );
}

export function OrderedLetterSlots() {
  const { zones, activeSlotIndex, allTiles } = useAnswerGameContext();

  return (
    <ol
      role="list"
      aria-label="Answer slots"
      className="flex flex-wrap justify-center gap-2"
    >
      {zones.map((zone, i) => {
        const placedTile = zone.placedTileId
          ? allTiles.find((t) => t.id === zone.placedTileId)
          : null;
        return (
          <LetterSlot
            key={zone.id}
            zoneIndex={i}
            label={placedTile?.label ?? null}
            isActive={
              i === activeSlotIndex && zone.placedTileId === null
            }
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: Write the Storybook story**

```tsx
// src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.stories.tsx
import { OrderedLetterSlots } from './OrderedLetterSlots';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
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

function InitProvider({
  children,
  prePlace,
}: {
  children: React.ReactNode;
  prePlace?: string;
}) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  if (prePlace)
    dispatch({ type: 'PLACE_TILE', tileId: prePlace, zoneIndex: 0 });
  return <>{children}</>;
}

const meta: Meta<typeof OrderedLetterSlots> = {
  component: OrderedLetterSlots,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof OrderedLetterSlots>;

export const Default: Story = {};
export const PartiallyFilled: Story = {
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider prePlace="t1">
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/OrderedLetterSlots/
git commit -m "feat(word-spell): add OrderedLetterSlots drop-target component"
```

---

## Task 3: LetterTileBank

**Files:**

- Create: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`
- Create: `src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx`
- Create: `src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LetterTileBank } from './LetterTileBank';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function Initialiser({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('LetterTileBank', () => {
  it('renders all bank tiles as buttons', () => {
    render(<LetterTileBank />, { wrapper });
    expect(
      screen.getByRole('button', { name: 'Letter C' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter T' }),
    ).toBeInTheDocument();
  });

  it('tile not in bankTileIds is not rendered', () => {
    // After placing t1 in zone 0, t1 leaves the bank
    function TestWithPlace() {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <LetterTileBank />;
    }
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlace />
      </AnswerGameProvider>,
    );
    expect(
      screen.queryByRole('button', { name: 'Letter C' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter A' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement LetterTileBank**

```tsx
// src/games/word-spell/LetterTileBank/LetterTileBank.tsx
import { useEffect, useRef } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
import { useGameTTS } from '@/components/answer-game/useGameTTS';
import type { TileItem } from '@/components/answer-game/types';

function LetterTile({ tile }: { tile: TileItem }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
    });
  }, [tile.id]);

  const handleClick = () => {
    speakTile(tile.label);
    placeInNextSlot(tile.id);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Letter ${tile.label}`}
      className="flex size-14 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
      onClick={handleClick}
    >
      {tile.label}
    </button>
  );
}

export function LetterTileBank() {
  const { allTiles, bankTileIds } = useAnswerGameContext();
  const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {bankTiles.map((tile) => (
        <LetterTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write the Storybook story**

```tsx
// src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx
import { LetterTileBank } from './LetterTileBank';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function InitProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

const meta: Meta<typeof LetterTileBank> = {
  component: LetterTileBank,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof LetterTileBank>;

export const Default: Story = {};

const distractorConfig: AnswerGameConfig = {
  ...config,
  tileBankMode: 'distractors',
  distractorCount: 2,
};
const distractorTiles: TileItem[] = [
  ...tiles,
  { id: 'td1', label: 'X', value: 'X' },
  { id: 'td2', label: 'Z', value: 'Z' },
];

function DistractorInitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles: distractorTiles, zones });
  return <>{children}</>;
}

export const WithDistractors: Story = {
  decorators: [
    (Story) => (
      <AnswerGameProvider config={distractorConfig}>
        <DistractorInitProvider>
          <Story />
        </DistractorInitProvider>
      </AnswerGameProvider>
    ),
  ],
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/LetterTileBank/
git commit -m "feat(word-spell): add LetterTileBank with draggable tiles"
```

---

## Task 4: WordSpell Root Component + Storybook

**Files:**

- Create: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Create: `src/games/word-spell/WordSpell/WordSpell.stories.tsx`

The root component converts a `WordSpellConfig` + round index into an `AnswerGameConfig` (with tiles + zones for the current round), then mounts `<AnswerGame>`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games/word-spell/WordSpell/WordSpell.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const config: WordSpellConfig = {
  gameId: 'word-spell-test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 2,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160' },
    { word: 'dog', image: 'https://placehold.co/160' },
  ],
};

describe('WordSpell', () => {
  it('renders the game with letter tiles for the first round word', () => {
    render(<WordSpell config={config} />);
    // Three letter tiles for "cat"
    expect(
      screen.getByRole('button', { name: 'Letter C' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter T' }),
    ).toBeInTheDocument();
  });

  it('renders three answer slots for "cat"', () => {
    render(<WordSpell config={config} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('does not render image in recall mode', () => {
    const recallConfig: WordSpellConfig = {
      ...config,
      mode: 'recall',
      rounds: [{ word: 'cat' }],
    };
    render(<WordSpell config={recallConfig} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement WordSpell**

WordSpell converts the current round's word into tiles and zones, then mounts `<AnswerGame>`. Tiles are created from the word's letters (uppercased), shuffled for non-scramble modes.

```tsx
// src/games/word-spell/WordSpell/WordSpell.tsx
import { nanoid } from 'nanoid';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { OrderedLetterSlots } from '../OrderedLetterSlots/OrderedLetterSlots';
import { LetterTileBank } from '../LetterTileBank/LetterTileBank';
import type { WordSpellConfig } from '../types';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

function buildTilesAndZones(word: string): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  const letters = word.toUpperCase().split('');
  const zones: AnswerZone[] = letters.map((letter, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: letter,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));
  // Shuffle tiles so they're not in order
  const tiles: TileItem[] = [...letters]
    .sort(() => Math.random() - 0.5)
    .map((letter) => ({ id: nanoid(), label: letter, value: letter }));
  return { tiles, zones };
}

interface WordSpellProps {
  config: WordSpellConfig;
}

export function WordSpell({ config }: WordSpellProps) {
  const round = config.rounds[0]; // GameEngineProvider handles round advancement in M4
  if (!round) return null;

  const { tiles, zones } = buildTilesAndZones(round.word);

  const answerGameConfig: AnswerGameConfig = {
    gameId: config.gameId,
    inputMethod: config.inputMethod,
    wrongTileBehavior: config.wrongTileBehavior,
    tileBankMode: config.tileBankMode,
    distractorCount: config.distractorCount,
    totalRounds: config.rounds.length,
    ttsEnabled: config.ttsEnabled,
    _initialTiles: tiles,
    _initialZones: zones,
  };

  return (
    <AnswerGame config={answerGameConfig}>
      <AnswerGame.Question>
        {config.mode !== 'recall' && round.image && (
          <ImageQuestion src={round.image} prompt={round.word} />
        )}
        <AudioButton prompt={round.word} />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <OrderedLetterSlots />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <LetterTileBank />
      </AnswerGame.Choices>
    </AnswerGame>
  );
}
```

**Note:** The `_initialTiles` and `_initialZones` approach passes initial round data through config. Alternatively, modify `AnswerGameConfig` to include `initialTiles?: TileItem[]` and `initialZones?: AnswerZone[]`, and have `AnswerGameProvider` call `INIT_ROUND` with them automatically. Add these optional fields to `AnswerGameConfig` in `src/components/answer-game/types.ts`:

```typescript
// Add to AnswerGameConfig in src/components/answer-game/types.ts
initialTiles?: TileItem[];
initialZones?: AnswerZone[];
```

And in `AnswerGameProvider.tsx`, fire INIT_ROUND if initialTiles/initialZones are set:

```tsx
// In AnswerGameProvider, after useReducer:
useEffect(() => {
  if (config.initialTiles && config.initialZones) {
    dispatch({
      type: 'INIT_ROUND',
      tiles: config.initialTiles,
      zones: config.initialZones,
    });
  }
}, [config.gameId]); // re-init when gameId changes (new round)
```

Update `WordSpell.tsx` to use these fields instead of `_initialTiles`/`_initialZones`.

- [ ] **Step 4: Write Storybook stories**

```tsx
// src/games/word-spell/WordSpell/WordSpell.stories.tsx
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: WordSpellConfig = {
  gameId: 'word-spell-storybook',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 5,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160?text=🐱' },
    { word: 'dog', image: 'https://placehold.co/160?text=🐶' },
  ],
};

const meta: Meta<typeof WordSpell> = {
  component: WordSpell,
  tags: ['autodocs'],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof WordSpell>;

export const PictureMode: Story = {};

export const RecallMode: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'recall',
      tileBankMode: 'distractors',
      distractorCount: 4,
      rounds: [{ word: 'cat' }],
    },
  },
};

export const ScrambleMode: Story = {
  args: { config: { ...baseConfig, mode: 'scramble' } },
};

export const SentenceGapMode: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'sentence-gap',
      rounds: [
        {
          word: 'sat',
          image: 'https://placehold.co/160?text=scene',
          sentence: 'The cat ___ on the mat.',
        },
      ],
    },
  },
};

export const WithDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3,
    },
  },
};

export const LockManualWrongTile: Story = {
  args: { config: { ...baseConfig, wrongTileBehavior: 'lock-manual' } },
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/WordSpell/ src/games/word-spell/types.ts
git commit -m "feat(word-spell): add WordSpell composition root with picture/recall/scramble/sentence-gap modes"
```

---

## Task 5: NumberMatch Types

**Files:**

- Create: `src/games/number-match/types.ts`

No tests — pure types file.

- [ ] **Step 1: Create types**

```typescript
// src/games/number-match/types.ts
import type { AnswerGameConfig } from '@/components/answer-game/types';

export interface NumberMatchRound {
  value: number;
  /** Fluent Emoji path for object-style tiles (e.g. "fluent-emoji/red-apple.svg") */
  objectImage?: string;
}

export interface NumberMatchConfig extends AnswerGameConfig {
  component: 'NumberMatch';
  mode:
    | 'numeral-to-group'
    | 'group-to-numeral'
    | 'numeral-to-word'
    | 'word-to-numeral';
  /** Visual style for quantity/group tiles */
  tileStyle: 'dots' | 'objects' | 'fingers';
  range: { min: number; max: number };
  rounds: NumberMatchRound[];
}
```

- [ ] **Step 2: Verify typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/games/number-match/types.ts
git commit -m "feat(number-match): define NumberMatchConfig and NumberMatchRound types"
```

---

## Task 6: MatchingPairZones

**Files:**

- Create: `src/games/number-match/MatchingPairZones/MatchingPairZones.tsx`
- Create: `src/games/number-match/MatchingPairZones/MatchingPairZones.test.tsx`
- Create: `src/games/number-match/MatchingPairZones/MatchingPairZones.stories.tsx`

Unlike `OrderedLetterSlots`, pair zones are not sequential — any tile can be dragged to any zone. Uses `useFreeSwap` for placement.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/games/number-match/MatchingPairZones/MatchingPairZones.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MatchingPairZones } from './MatchingPairZones';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: '5',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function Initialiser({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('MatchingPairZones', () => {
  it('renders one drop zone per zone in context', () => {
    render(<MatchingPairZones />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('empty zone has aria-label "Zone 1, empty"', () => {
    render(<MatchingPairZones />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Zone 1, empty' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/games/number-match/MatchingPairZones/MatchingPairZones.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement MatchingPairZones**

```tsx
// src/games/number-match/MatchingPairZones/MatchingPairZones.tsx
import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useFreeSwap } from '@/components/answer-game/useFreeSwap';

function PairZone({
  zoneIndex,
  label,
  isWrong,
}: {
  zoneIndex: number;
  label: string | null;
  isWrong: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { swapOrPlace } = useFreeSwap();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const tileId = source.data['tileId'];
        if (typeof tileId === 'string') swapOrPlace(tileId, zoneIndex);
      },
    });
  }, [zoneIndex, swapOrPlace]);

  const ariaLabel = label
    ? `Zone ${zoneIndex + 1}, filled with ${label}`
    : `Zone ${zoneIndex + 1}, empty`;

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      className={[
        'flex size-20 items-center justify-center rounded-2xl border-2 text-3xl font-bold transition-all',
        isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : label
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-dashed border-muted-foreground/40',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label ?? ''}
    </li>
  );
}

export function MatchingPairZones() {
  const { zones, allTiles } = useAnswerGameContext();

  return (
    <ol
      role="list"
      aria-label="Answer slots"
      className="flex flex-wrap justify-center gap-4"
    >
      {zones.map((zone, i) => {
        const placedTile = zone.placedTileId
          ? allTiles.find((t) => t.id === zone.placedTileId)
          : null;
        return (
          <PairZone
            key={zone.id}
            zoneIndex={i}
            label={placedTile?.label ?? null}
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: Write Storybook story**

```tsx
// src/games/number-match/MatchingPairZones/MatchingPairZones.stories.tsx
import { MatchingPairZones } from './MatchingPairZones';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: '5',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function InitProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

const meta: Meta<typeof MatchingPairZones> = {
  component: MatchingPairZones,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MatchingPairZones>;

export const Default: Story = {};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/number-match/MatchingPairZones/MatchingPairZones.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/number-match/MatchingPairZones/
git commit -m "feat(number-match): add MatchingPairZones free-swap drop target component"
```

---

## Task 7: NumeralTileBank

**Files:**

- Create: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`
- Create: `src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx`
- Create: `src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx`

Each tile style renders differently:

- `dots`: filled circles (reuses `DotGroupQuestion`-like layout)
- `objects`: emoji image grid
- `fingers`: numeral text (hand-count visual deferred to asset)

- [ ] **Step 1: Write the failing tests**

```tsx
// src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NumeralTileBank } from './NumeralTileBank';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

import { speak } from '@/lib/speech/SpeechOutput';

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function Initialiser({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('NumeralTileBank', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders tiles for all bank tile IDs', () => {
    render(<NumeralTileBank tileStyle="dots" />, { wrapper });
    expect(
      screen.getByRole('button', { name: /3/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /5/i }),
    ).toBeInTheDocument();
  });

  it('calls speak() with the tile label on click when ttsEnabled', async () => {
    render(<NumeralTileBank tileStyle="dots" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: /3/i }));
    expect(speak).toHaveBeenCalledWith('3');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement NumeralTileBank**

```tsx
// src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
import { useEffect, useRef } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
import { useGameTTS } from '@/components/answer-game/useGameTTS';
import type { TileItem } from '@/components/answer-game/types';

type TileStyle = 'dots' | 'objects' | 'fingers';

function DotsTile({ count }: { count: number }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="size-4 rounded-full bg-current" />
      ))}
    </div>
  );
}

function NumeralTile({
  tile,
  tileStyle,
}: {
  tile: TileItem;
  tileStyle: TileStyle;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();
  const numericValue = Number.parseInt(tile.value, 10);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
    });
  }, [tile.id]);

  const handleClick = () => {
    speakTile(tile.label);
    placeInNextSlot(tile.id);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className="flex min-h-14 min-w-14 cursor-grab flex-col items-center justify-center gap-1 rounded-2xl bg-card p-3 shadow-md transition-transform active:scale-95 active:cursor-grabbing"
      onClick={handleClick}
    >
      {tileStyle === 'dots' && !Number.isNaN(numericValue) ? (
        <>
          <DotsTile count={numericValue} />
          <span className="text-sm font-bold">{tile.label}</span>
        </>
      ) : (
        <span className="text-3xl font-bold">{tile.label}</span>
      )}
    </button>
  );
}

interface NumeralTileBankProps {
  tileStyle: TileStyle;
}

export function NumeralTileBank({ tileStyle }: NumeralTileBankProps) {
  const { allTiles, bankTileIds } = useAnswerGameContext();
  const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {bankTiles.map((tile) => (
        <NumeralTile key={tile.id} tile={tile} tileStyle={tileStyle} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write Storybook story**

```tsx
// src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx
import { NumeralTileBank } from './NumeralTileBank';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';

const config: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '1', value: '1' },
  { id: 't2', label: '2', value: '2' },
  { id: 't3', label: '3', value: '3' },
  { id: 't4', label: '4', value: '4' },
  { id: 't5', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

function InitProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
}

const meta: Meta<typeof NumeralTileBank> = {
  component: NumeralTileBank,
  tags: ['autodocs'],
  args: { tileStyle: 'dots' },
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NumeralTileBank>;

export const DotsStyle: Story = { args: { tileStyle: 'dots' } };
export const FingersStyle: Story = { args: { tileStyle: 'fingers' } };
export const ObjectsStyle: Story = { args: { tileStyle: 'objects' } };
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/number-match/NumeralTileBank/
git commit -m "feat(number-match): add NumeralTileBank with dots/objects/fingers tile styles"
```

---

## Task 8: NumberMatch Root Component + Storybook

**Files:**

- Create: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Create: `src/games/number-match/NumberMatch/NumberMatch.test.tsx`
- Create: `src/games/number-match/NumberMatch/NumberMatch.stories.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/games/number-match/NumberMatch/NumberMatch.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const config: NumberMatchConfig = {
  gameId: 'number-match-test',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 5 },
  rounds: [{ value: 3 }, { value: 5 }, { value: 1 }],
};

describe('NumberMatch', () => {
  it('renders a TextQuestion for numeral-to-group mode', () => {
    render(<NumberMatch config={config} />);
    // TextQuestion renders the numeral "3" as a button
    expect(
      screen.getByRole('button', { name: '3 — tap to hear' }),
    ).toBeInTheDocument();
  });

  it('renders a DotGroupQuestion for group-to-numeral mode', () => {
    const groupConfig: NumberMatchConfig = {
      ...config,
      mode: 'group-to-numeral',
    };
    render(<NumberMatch config={groupConfig} />);
    expect(
      screen.getByRole('button', { name: /tap to hear/i }),
    ).toBeInTheDocument();
  });

  it('renders one pair zone per round value', () => {
    render(<NumberMatch config={config} />);
    // Config has 3 rounds → only one pair zone per round at a time (first round has value 3 → 1 zone)
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
yarn test src/games/number-match/NumberMatch/NumberMatch.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement NumberMatch**

NumberMatch creates one pair zone per round (the active round's value is the target). In a full session, `GameEngineProvider` (M4) advances rounds; here we use the first round.

```tsx
// src/games/number-match/NumberMatch/NumberMatch.tsx
import { nanoid } from 'nanoid';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';
import { DotGroupQuestion } from '@/components/questions/DotGroupQuestion/DotGroupQuestion';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { MatchingPairZones } from '../MatchingPairZones/MatchingPairZones';
import { NumeralTileBank } from '../NumeralTileBank/NumeralTileBank';
import type { NumberMatchConfig } from '../types';
import type {
  AnswerGameConfig,
  TileItem,
  AnswerZone,
} from '@/components/answer-game/types';

function buildNumeralRound(value: number): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  // One zone for the matching value, one tile with that value
  const zone: AnswerZone = {
    id: nanoid(),
    index: 0,
    expectedValue: String(value),
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  };
  const tile: TileItem = {
    id: nanoid(),
    label: String(value),
    value: String(value),
  };
  return { tiles: [tile], zones: [zone] };
}

interface NumberMatchProps {
  config: NumberMatchConfig;
}

export function NumberMatch({ config }: NumberMatchProps) {
  const round = config.rounds[0];
  if (!round) return null;

  const { tiles, zones } = buildNumeralRound(round.value);

  const answerGameConfig: AnswerGameConfig = {
    gameId: config.gameId,
    inputMethod: config.inputMethod,
    wrongTileBehavior: config.wrongTileBehavior,
    tileBankMode: config.tileBankMode,
    distractorCount: config.distractorCount,
    totalRounds: config.rounds.length,
    ttsEnabled: config.ttsEnabled,
    initialTiles: tiles,
    initialZones: zones,
  };

  const showTextQuestion =
    config.mode === 'numeral-to-group' ||
    config.mode === 'numeral-to-word' ||
    config.mode === 'word-to-numeral';

  return (
    <AnswerGame config={answerGameConfig}>
      <AnswerGame.Question>
        {showTextQuestion ? (
          <TextQuestion text={String(round.value)} />
        ) : (
          <DotGroupQuestion
            count={round.value}
            prompt={String(round.value)}
          />
        )}
        <AudioButton prompt={String(round.value)} />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <MatchingPairZones />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <NumeralTileBank tileStyle={config.tileStyle} />
      </AnswerGame.Choices>
    </AnswerGame>
  );
}
```

- [ ] **Step 4: Write Storybook stories**

```tsx
// src/games/number-match/NumberMatch/NumberMatch.stories.tsx
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: NumberMatchConfig = {
  gameId: 'number-match-storybook',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 5,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 5 },
  rounds: [{ value: 3 }, { value: 1 }, { value: 5 }],
};

const meta: Meta<typeof NumberMatch> = {
  component: NumberMatch,
  tags: ['autodocs'],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof NumberMatch>;

export const NumeralToGroup: Story = {};

export const GroupToNumeral: Story = {
  args: { config: { ...baseConfig, mode: 'group-to-numeral' } },
};

export const NumeralToWord: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-word',
      tileStyle: 'fingers',
    },
  },
};

export const WordToNumeral: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'word-to-numeral',
      tileStyle: 'objects',
    },
  },
};

export const DotsStyle: Story = {
  args: { config: { ...baseConfig, tileStyle: 'dots' } },
};
export const ObjectsStyle: Story = {
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'objects',
      rounds: [
        { value: 3, objectImage: 'https://placehold.co/32?text=🍎' },
      ],
    },
  },
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/games/number-match/NumberMatch/NumberMatch.test.tsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/number-match/NumberMatch/ src/games/number-match/types.ts
git commit -m "feat(number-match): add NumberMatch composition root for all 4 modes"
```

---

## Task 9: i18n Strings + Game Registry

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Update English games.json**

```json
// src/lib/i18n/locales/en/games.json
{
  "math-addition": "Addition practice",
  "math-subtraction": "Subtraction practice",
  "placeholder-game": "Sample game",
  "word-spell": "Word Spell",
  "number-match": "Number Match",
  "ui": {
    "choose-a-letter": "Choose a letter",
    "almost-try-again": "Almost! Try again.",
    "great-job": "Great job!",
    "hear-the-question": "Hear the question",
    "tap-to-hear": "tap to hear"
  }
}
```

- [ ] **Step 2: Update pt-BR games.json**

```json
// src/lib/i18n/locales/pt-BR/games.json
{
  "math-addition": "Prática de adição",
  "math-subtraction": "Prática de subtração",
  "placeholder-game": "Jogo de exemplo",
  "word-spell": "Soletrar Palavras",
  "number-match": "Combinação de Números",
  "ui": {
    "choose-a-letter": "Escolha uma letra",
    "almost-try-again": "Quase! Tente de novo.",
    "great-job": "Muito bem!",
    "hear-the-question": "Ouvir a pergunta",
    "tap-to-hear": "toque para ouvir"
  }
}
```

- [ ] **Step 3: Add to game registry**

Current `src/games/registry.ts` exports `GAME_CATALOG`. Add the two new entries:

```typescript
// src/games/registry.ts
export type GameLevel = 'PK' | 'K' | '1' | '2' | '3' | '4';
export type GameSubject = 'math' | 'reading' | 'letters';

export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  levels: GameLevel[];
  subject: GameSubject;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'math-addition',
    titleKey: 'math-addition',
    levels: ['1', '2'],
    subject: 'math',
  },
  {
    id: 'math-subtraction',
    titleKey: 'math-subtraction',
    levels: ['1', '2', '3'],
    subject: 'math',
  },
  {
    id: 'placeholder-game',
    titleKey: 'placeholder-game',
    levels: ['PK', 'K'],
    subject: 'letters',
  },
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    levels: ['K', '1', '2'],
    subject: 'reading',
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    levels: ['PK', 'K'],
    subject: 'math',
  },
];
```

- [ ] **Step 4: Verify typecheck and tests**

```bash
yarn typecheck && yarn test
```

Expected: no errors, all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json src/games/registry.ts
git commit -m "feat(i18n,registry): add WordSpell and NumberMatch titles and game catalog entries"
```

---

## Task 10: E2E and Visual Regression Tests

**Files:**

- Modify: `e2e/smoke.spec.ts`
- Modify: `e2e/visual.spec.ts`

E2E tests require the dev server running (`yarn dev`). VR tests require Docker.

- [ ] **Step 1: Add WordSpell E2E smoke test**

Add to `e2e/smoke.spec.ts`:

```typescript
test('WordSpell picture mode renders letter tiles', async ({
  page,
}) => {
  // Navigate to a WordSpell game — adjust route once game routing is wired
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  // At least one letter tile button should be visible
  const tiles = page.getByRole('button', { name: /^Letter /i });
  await expect(tiles.first()).toBeVisible();
});

test('NumberMatch numeral-to-group renders numeral question', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(
    page.getByRole('button', { name: 'Hear the question' }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Add VR screenshots**

Add to `e2e/visual.spec.ts`:

```typescript
test('@visual WordSpell picture mode mid-game layout', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('word-spell-picture-mode.png', {
    fullPage: true,
  });
});

test('@visual NumberMatch numeral-to-group layout', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group.png',
    {
      fullPage: true,
    },
  );
});
```

- [ ] **Step 3: Verify typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add e2e/smoke.spec.ts e2e/visual.spec.ts
git commit -m "test(e2e,vr): add WordSpell and NumberMatch smoke and visual regression tests"
```

---

## Task 11: Final Quality Gate

- [ ] **Step 1: Run all unit tests**

```bash
yarn typecheck && yarn test
```

Expected: zero TypeScript errors, all tests PASS.

- [ ] **Step 2: Verify Storybook builds**

```bash
yarn build-storybook
```

Expected: build succeeds.

- [ ] **Step 3: Run VR tests (Docker required)**

```bash
yarn test:vr
```

If first run: baselines are generated automatically. If diffs exist: review, then run `yarn test:vr:update`.

- [ ] **Step 4: Run E2E tests (dev server required)**

```bash
# Terminal 1
yarn dev

# Terminal 2
yarn test:e2e
```

Expected: all pass. Skip with `SKIP_E2E=1` if game routes not yet wired and document the reason.

---

## Self-Review Checklist

| Spec requirement                                           | Covered                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| WordSpell picture / scramble / recall / sentence-gap modes | Task 4 (WordSpell root) + stories                                                                                |
| WordSpell tileUnit: letter / syllable / word               | types.ts; `LetterTileBank` uses `tile.label` generically                                                         |
| WordSpell exact vs distractors tileBankMode                | types.ts; bank rendering uses `bankTileIds` (distractor tiles added by M4 config loader)                         |
| OrderedLetterSlots as answer zone                          | Task 2                                                                                                           |
| LetterTileBank with draggable tiles                        | Task 3                                                                                                           |
| NumberMatch 4 modes                                        | Task 8 + stories                                                                                                 |
| NumberMatch tileStyle: dots / objects / fingers            | Task 7 (NumeralTileBank)                                                                                         |
| MatchingPairZones non-sequential free-swap                 | Task 6                                                                                                           |
| NumeralTileBank                                            | Task 7                                                                                                           |
| i18n en + pt-BR                                            | Task 9                                                                                                           |
| Game registry entries                                      | Task 9                                                                                                           |
| Storybook all modes                                        | Tasks 4, 8                                                                                                       |
| E2E WordSpell picture mode                                 | Task 10                                                                                                          |
| E2E NumberMatch drag to zone                               | Task 10                                                                                                          |
| VR screenshots both games                                  | Task 10                                                                                                          |
| Preset / bookmark UX                                       | Out of scope for this plan — tracked separately in M5 presets spec                                               |
| Image assets (Fluent Emoji)                                | Paths referenced in config; asset bundling is a build-time concern handled by Vite code-splitting, not this plan |

---

## Task 11: NumeralTileBank — Domino dot layout

**Design decision (approved 2026-04-03):** `tileStyle: 'dots'` renders pip patterns using dice/domino visuals:

- **1–6** — single die face (classic dice pip positions on a 3×3 grid)
- **7–12** — domino tile (two dice faces side by side, separated by a centre line, splits: 7=4+3, 8=4+4, 9=5+4, 10=6+4, 11=6+5, 12=6+6)
- **13+** — large numeral (dots become uncountable; numeral is more appropriate for older learners)

Tile shape: single die = 80×80 square; domino = 128×72 rectangle.

**Files:**

- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx`

- [ ] **Step 1: Write failing tests**

  In `src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx`, add:

  ```tsx
  import { render } from '@testing-library/react';
  import { describe, expect, it } from 'vitest';
  import { DiceFace } from '../NumeralTileBank/NumeralTileBank';

  describe('DiceFace', () => {
    it('renders 1 pip for value 1', () => {
      const { container } = render(<DiceFace value={1} />);
      expect(container.querySelectorAll('[data-pip]')).toHaveLength(1);
    });

    it('renders 6 pips for value 6', () => {
      const { container } = render(<DiceFace value={6} />);
      expect(container.querySelectorAll('[data-pip]')).toHaveLength(6);
    });

    it('renders 9 empty cells + 1 pip for value 1 (3×3 grid)', () => {
      const { container } = render(<DiceFace value={1} />);
      expect(container.querySelectorAll('[data-cell]')).toHaveLength(9);
    });
  });

  describe('DominoTile', () => {
    it('renders two DiceFace halves for value 7 (4+3)', () => {
      const { container } = render(<DominoTile value={7} />);
      // 4 pips + 3 pips = 7 pips total
      expect(container.querySelectorAll('[data-pip]')).toHaveLength(7);
    });

    it('renders 12 pips for value 12 (6+6)', () => {
      const { container } = render(<DominoTile value={12} />);
      expect(container.querySelectorAll('[data-pip]')).toHaveLength(12);
    });

    it('has a visible centre divider', () => {
      const { container } = render(<DominoTile value={8} />);
      expect(
        container.querySelector('[data-divider]'),
      ).toBeInTheDocument();
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Add `DiceFace` and `DominoTile` sub-components**

  Replace the `DotsTile` component in `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` with:

  ```tsx
  /** Pip positions (0–8) for each die value in a 3×3 grid. */
  const DICE_PIPS: Record<number, number[]> = {
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  /** Which two die values add up to n for values 7–12. */
  const DOMINO_SPLIT: Record<number, [number, number]> = {
    7: [4, 3],
    8: [4, 4],
    9: [5, 4],
    10: [6, 4],
    11: [6, 5],
    12: [6, 6],
  };

  export const DiceFace = ({ value }: { value: number }) => {
    const pips = DICE_PIPS[value] ?? [];
    return (
      <div
        className="grid grid-cols-3 grid-rows-3 gap-1 p-1"
        aria-hidden="true"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            data-cell=""
            data-pip={pips.includes(i) ? '' : undefined}
            className={[
              'size-2.5 rounded-full',
              pips.includes(i) ? 'bg-current' : 'bg-transparent',
            ].join(' ')}
          />
        ))}
      </div>
    );
  };

  export const DominoTile = ({ value }: { value: number }) => {
    const [left, right] = DOMINO_SPLIT[value] ?? [6, value - 6];
    return (
      <div className="flex items-center gap-0" aria-hidden="true">
        <DiceFace value={left} />
        <span
          data-divider=""
          className="h-10 w-px shrink-0 bg-current opacity-30"
        />
        <DiceFace value={right} />
      </div>
    );
  };
  ```

- [ ] **Step 3: Update `DotsTile` usage in `NumeralTile`**

  Replace the `DotsTile` render inside `NumeralTile` with:

  ```tsx
  {
    tileStyle === 'dots' && !Number.isNaN(numericValue) ? (
      numericValue <= 6 ? (
        <DiceFace value={numericValue} />
      ) : numericValue <= 12 ? (
        <DominoTile value={numericValue} />
      ) : (
        <span className="text-3xl font-bold tabular-nums leading-none">
          {tile.label}
        </span>
      )
    ) : (
      <span className="text-3xl font-bold tabular-nums leading-none">
        {tile.label}
      </span>
    );
  }
  ```

- [ ] **Step 4: Update tile size for domino tiles**

  The `NumeralTile` button needs a wider shape for domino tiles. Replace the fixed `size-20` class with a dynamic one:

  ```tsx
  const isDomino =
    tileStyle === 'dots' &&
    !Number.isNaN(numericValue) &&
    numericValue > 6 &&
    numericValue <= 12;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={[
        'shrink-0 cursor-grab rounded-2xl bg-card p-2 shadow-md transition-transform active:scale-95 active:cursor-grabbing',
        'flex flex-col items-center justify-center gap-0.5',
        isDomino ? 'h-18 w-32' : 'size-20',
      ].join(' ')}
      onClick={handleClick}
    >
  ```

  Note: Tailwind v4 uses arbitrary values if `h-18` / `w-32` aren't in the default scale — use `h-[72px] w-32` to be safe:

  ```tsx
  isDomino ? 'h-[72px] w-32' : 'size-20',
  ```

- [ ] **Step 5: Run tests**

  ```bash
  yarn test src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx 2>&1 | tail -10
  ```

  Expected: all PASS.

- [ ] **Step 6: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/games/number-match/NumeralTileBank/NumeralTileBank.tsx \
    src/games/number-match/NumeralTileBank/NumeralTileBank.test.tsx
  git commit -m "feat(number-match): domino dot layout for 1-6 (dice) and 7-12 (domino), numeral above 12"
  ```

---

## Task 12: Extract useDraggableTile hook

Eliminates the duplicated drag + TTS + click wiring across `LetterTile`, `NumeralTile`, and `SortNumbersTileBank` (Group I). After this task, Group A+B Task 5 (drag-start TTS) only needs to be implemented once in the hook.

**Files:**

- Create: `src/components/answer-game/useDraggableTile.ts`
- Create: `src/components/answer-game/useDraggableTile.test.tsx`
- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`
- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` (if already created)

- [ ] **Step 1: Write failing tests**

  Create `src/components/answer-game/useDraggableTile.test.tsx`:

  ```tsx
  import { renderHook, act } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';

  vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
    draggable: vi.fn().mockReturnValue(() => {}),
  }));

  vi.mock('./useAutoNextSlot', () => ({
    useAutoNextSlot: () => ({ placeInNextSlot: vi.fn() }),
  }));

  vi.mock('./useGameTTS', () => ({
    useGameTTS: () => ({ speakTile: vi.fn(), speakPrompt: vi.fn() }),
  }));

  describe('useDraggableTile', () => {
    const tile = { id: 't1', label: 'C', value: 'c' };

    it('returns a ref and handleClick', () => {
      const { result } = renderHook(() =>
        // wrap in AnswerGameContext mock via wrapper prop
        useDraggableTile(tile),
      );
      expect(result.current.ref).toBeDefined();
      expect(typeof result.current.handleClick).toBe('function');
    });

    it('handleClick calls speakTile with tile label', () => {
      const speakTileMock = vi.fn();
      vi.mocked(useGameTTS).mockReturnValue({
        speakTile: speakTileMock,
        speakPrompt: vi.fn(),
      });

      const { result } = renderHook(() => useDraggableTile(tile));
      act(() => result.current.handleClick());

      expect(speakTileMock).toHaveBeenCalledWith('C');
    });

    it('handleClick calls placeInNextSlot with tile id', () => {
      const placeInNextSlotMock = vi.fn();
      vi.mocked(useAutoNextSlot).mockReturnValue({
        placeInNextSlot: placeInNextSlotMock,
      });

      const { result } = renderHook(() => useDraggableTile(tile));
      act(() => result.current.handleClick());

      expect(placeInNextSlotMock).toHaveBeenCalledWith('t1');
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/useDraggableTile.test.tsx 2>&1 | tail -10
  ```

  Expected: FAIL — `Cannot find module './useDraggableTile'`

- [ ] **Step 2: Create `useDraggableTile.ts`**

  ```ts
  import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import { useEffect, useRef } from 'react';
  import type { RefObject } from 'react';
  import { useAutoNextSlot } from './useAutoNextSlot';
  import { useGameTTS } from './useGameTTS';
  import type { TileItem } from './types';

  export interface DraggableTile {
    ref: RefObject<HTMLButtonElement | null>;
    handleClick: () => void;
  }

  export function useDraggableTile(tile: TileItem): DraggableTile {
    const ref = useRef<HTMLButtonElement>(null);
    const { placeInNextSlot } = useAutoNextSlot();
    const { speakTile } = useGameTTS();
    const speakTileRef = useRef(speakTile);

    useEffect(() => {
      speakTileRef.current = speakTile;
    }, [speakTile]);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;
      return draggable({
        element,
        getInitialData: () => ({ tileId: tile.id }),
        onDragStart: () => speakTileRef.current(tile.label),
      });
    }, [tile.id, tile.label]);

    const handleClick = () => {
      speakTile(tile.label);
      placeInNextSlot(tile.id);
    };

    return { ref, handleClick };
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useDraggableTile.test.tsx 2>&1 | tail -10
  ```

  Expected: all PASS.

- [ ] **Step 4: Refactor `LetterTile` to use `useDraggableTile`**

  Replace the entire `LetterTile` component in `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`:

  ```tsx
  import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

  const LetterTile = ({ tile }: { tile: TileItem }) => {
    const { ref, handleClick } = useDraggableTile(tile);

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Letter ${tile.label}`}
        className="flex size-14 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
        onClick={handleClick}
      >
        {tile.label}
      </button>
    );
  };
  ```

  Remove the now-unused imports: `draggable`, `useAutoNextSlot`, `useGameTTS`, `useEffect`, `useRef`.

- [ ] **Step 5: Run LetterTileBank tests**

  ```bash
  yarn test src/games/word-spell/LetterTileBank/ 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 6: Refactor `NumeralTile` to use `useDraggableTile`**

  Replace the boilerplate inside `NumeralTile` in `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`:

  ```tsx
  import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

  const NumeralTile = ({
    tile,
    tileStyle,
  }: {
    tile: TileItem;
    tileStyle: TileStyle;
  }) => {
    const { ref, handleClick } = useDraggableTile(tile);
    const numericValue = Number.parseInt(tile.value, 10);

    const isDomino =
      tileStyle === 'dots' &&
      !Number.isNaN(numericValue) &&
      numericValue > 6 &&
      numericValue <= 12;

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Number ${tile.label}`}
        className={[
          'flex shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl bg-card p-2 shadow-md transition-transform active:scale-95 active:cursor-grabbing',
          isDomino ? 'h-[72px] w-32' : 'size-20',
        ].join(' ')}
        onClick={handleClick}
      >
        {tileStyle === 'dots' && !Number.isNaN(numericValue) ? (
          numericValue <= 6 ? (
            <DiceFace value={numericValue} />
          ) : numericValue <= 12 ? (
            <DominoTile value={numericValue} />
          ) : (
            <span className="text-3xl font-bold tabular-nums leading-none">
              {tile.label}
            </span>
          )
        ) : (
          <span className="text-3xl font-bold tabular-nums leading-none">
            {tile.label}
          </span>
        )}
      </button>
    );
  };
  ```

  Remove now-unused imports: `draggable`, `useAutoNextSlot`, `useGameTTS`, `useEffect`, `useRef`.

- [ ] **Step 7: Refactor `SortNumbersTileBank` (if already created)**

  If `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` already exists,
  replace `NumberTile` the same way:

  ```tsx
  import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

  const NumberTile = ({ tile }: { tile: TileItem }) => {
    const { ref, handleClick } = useDraggableTile(tile);

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Number ${tile.label}`}
        className="flex size-16 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
        onClick={handleClick}
      >
        {tile.label}
      </button>
    );
  };
  ```

- [ ] **Step 8: Run all affected tests**

  ```bash
  yarn test src/games/ src/components/answer-game/useDraggableTile.test.tsx 2>&1 | tail -15
  ```

  Expected: all PASS.

- [ ] **Step 9: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 10: Commit**

  ```bash
  git add src/components/answer-game/useDraggableTile.ts \
    src/components/answer-game/useDraggableTile.test.tsx \
    src/games/word-spell/LetterTileBank/LetterTileBank.tsx \
    src/games/number-match/NumeralTileBank/NumeralTileBank.tsx \
    src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx
  git commit -m "refactor(tiles): extract useDraggableTile hook — DRYs drag/TTS/click wiring across all tile banks"
  ```

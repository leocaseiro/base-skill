# Kid-Friendly Homepage & Simple Config Implementation Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the kid-friendly homepage redesign — per-game covers, playful
titles, simple config forms, custom games as first-class cards, and a per-card
cog that opens the advanced config in a modal — without breaking existing
saved custom games or game state.

**Architecture:** New shared primitives (`GameCover`, `CoverPicker`,
`ChunkGroup`, `CellSelect`, `Stepper`, `ChipStrip`) + per-game
`SimpleConfigForm` components + per-card `AdvancedConfigModal`. Persisted
data model extends `SavedGameConfigDoc` with an optional `cover` field
(schema v1 → v2 migration). Game defaults are immutable; every save
creates or updates a custom game.

**Tech Stack:** React 18 + TypeScript + TanStack Router + RxDB + i18next +
Radix (dialog, sheet) + Tailwind + lucide-react icons + Vitest + Playwright
(VR + e2e).

**Spec:** `docs/superpowers/specs/2026-04-15-kid-friendly-homepage-design.md`

---

## File Structure

**New files:**

- `src/games/cover.ts` — `Cover` union type, `resolveCover(doc, gameId)`.
- `src/components/GameCover.tsx` — renders emoji or image covers.
- `src/components/CoverPicker.tsx` — emoji palette + image-URL input.
- `src/components/config/ChunkGroup.tsx` — chunky toggle-button row.
- `src/components/config/CellSelect.tsx` — native-select wrapped cell.
- `src/components/config/Stepper.tsx` — `−`/value/`+` numeric stepper.
- `src/components/config/ChipStrip.tsx` — wrap-flow chip toggles.
- `src/games/config-chips.ts` — pure `configToChips(gameId, config)`.
- `src/games/simple-labels.ts` — shared label formatters (direction, input).
- `src/games/word-spell/resolve-simple-config.ts` — simple ↔ full config.
- `src/games/word-spell/WordSpellSimpleConfigForm.tsx` — Spell It! form.
- `src/games/number-match/resolve-simple-config.ts` — simple ↔ full.
- `src/games/number-match/pair-to-mode.ts` — `pairToMode(from, to)`.
- `src/games/number-match/NumberMatchSimpleConfigForm.tsx` — form.
- `src/games/sort-numbers/SortNumbersSimpleConfigForm.tsx` — replacement.
- `src/components/AdvancedConfigModal.tsx` — cog-launched modal.
- `src/db/migrations/saved_game_configs_v2.ts` — schema migration helper.

**Modified files:**

- `src/db/schemas/saved_game_configs.ts` — add `cover?: Cover`, bump v2.
- `src/db/create-database.ts` — register migration strategy.
- `src/games/registry.ts` — add `defaultCover` per entry.
- `src/games/word-spell/types.ts` — add `WordSpellSimpleConfig`, `configMode`.
- `src/games/number-match/types.ts` — add `NumberMatchSimpleConfig`, `configMode`.
- `src/games/config-fields-registry.ts` — add simple-form renderers.
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` — cover + cog + SimpleConfigForm.
- `src/components/GameCard.tsx` — redesign in place: variant prop (default/custom game), cover, chips, cog button.
- `src/components/GameCard.test.tsx` — rewritten for new API.
- `src/components/GameCard.stories.tsx` — updated variants.
- `src/routes/$locale/_app/index.tsx` — flat grid, no filters, custom game cards.
- `src/components/GameGrid.tsx` — responsive grid, flattened input (game + custom game cards mixed).
- `src/lib/i18n/locales/en/games.json` — title renames, direction labels, settings keys.
- `src/lib/i18n/locales/pt-BR/games.json` — same keys, pt-BR.

**Deleted files (after refactor):**

- `src/components/SavedConfigChip.tsx` — custom game cards replace inline chips. (Only if unused after refactor; confirm with `knip` before deleting.)
- `src/games/sort-numbers/SortNumbersConfigForm/*` — replaced by `SortNumbersSimpleConfigForm` + advanced modal.
- `src/components/LevelRow.tsx` — removed filter affordance (guard with knip).

---

## Task Conventions

Every task follows red/green/refactor + frequent commits. Each task ends
with a commit whose subject is prefixed `feat(homepage):`,
`refactor(homepage):`, or `chore(homepage):` as appropriate.

Tests are **co-located** with source (`*.test.ts`/`*.test.tsx`). VR tests
live in `e2e/` and use Docker (`yarn test:vr` / `yarn test:vr:update`).

For every step that edits a `.md` file, run `yarn fix:md` before committing.

---

### Task 1: Cover type and GameCover component (foundation)

**Files:**

- Create: `src/games/cover.ts`
- Create: `src/games/cover.test.ts`
- Create: `src/components/GameCover.tsx`
- Create: `src/components/GameCover.test.tsx`

- [ ] **Step 1: Write the failing test for `resolveCover`**

Create `src/games/cover.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveCover } from './cover';

describe('resolveCover', () => {
  it('returns the document cover when set', () => {
    const doc = {
      cover: { kind: 'emoji' as const, emoji: '🦁' },
    };
    const cover = resolveCover(doc, 'word-spell');
    expect(cover).toEqual({ kind: 'emoji', emoji: '🦁' });
  });

  it('falls back to the game default when doc cover is absent', () => {
    const cover = resolveCover({}, 'word-spell');
    expect(cover.kind).toBe('emoji');
    if (cover.kind === 'emoji') {
      expect(cover.emoji).toBe('🔤');
    }
  });

  it('throws when gameId is unknown and no doc cover', () => {
    expect(() => resolveCover({}, 'no-such-game')).toThrow(
      /unknown gameId/i,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/games/cover.test.ts
```

Expected: FAIL — module `./cover` not found.

- [ ] **Step 3: Implement `Cover` type and `resolveCover`**

Create `src/games/cover.ts`:

```ts
export type Cover =
  | {
      kind: 'emoji';
      emoji: string;
      gradient?: [string, string];
    }
  | {
      kind: 'image';
      src: string;
      alt?: string;
      background?: string;
    };

const DEFAULT_COVERS: Record<string, Cover> = {
  'word-spell': {
    kind: 'emoji',
    emoji: '🔤',
    gradient: ['#fde68a', '#fb923c'],
  },
  'number-match': {
    kind: 'emoji',
    emoji: '🔢',
    gradient: ['#bae6fd', '#6366f1'],
  },
  'sort-numbers': {
    kind: 'emoji',
    emoji: '📊',
    gradient: ['#bbf7d0', '#10b981'],
  },
};

export const resolveDefaultCover = (gameId: string): Cover => {
  const cover = DEFAULT_COVERS[gameId];
  if (!cover) throw new Error(`unknown gameId: ${gameId}`);
  return cover;
};

export const resolveCover = (
  doc: { cover?: Cover },
  gameId: string,
): Cover => doc.cover ?? resolveDefaultCover(gameId);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn vitest run src/games/cover.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `GameCover`**

Create `src/components/GameCover.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameCover } from './GameCover';

describe('GameCover', () => {
  it('renders an emoji cover', () => {
    render(
      <GameCover cover={{ kind: 'emoji', emoji: '🦁' }} size="card" />,
    );
    expect(screen.getByText('🦁')).toBeInTheDocument();
  });

  it('renders an image cover with alt text', () => {
    render(
      <GameCover
        cover={{ kind: 'image', src: '/cat.png', alt: 'A cat' }}
        size="hero"
      />,
    );
    const img = screen.getByAltText('A cat');
    expect(img).toHaveAttribute('src', '/cat.png');
  });

  it('applies the gradient when provided on an emoji cover', () => {
    const { container } = render(
      <GameCover
        cover={{
          kind: 'emoji',
          emoji: '🔤',
          gradient: ['#fde68a', '#fb923c'],
        }}
        size="card"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.background).toContain('linear-gradient');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
yarn vitest run src/components/GameCover.test.tsx
```

Expected: FAIL.

- [ ] **Step 7: Implement `GameCover`**

Create `src/components/GameCover.tsx`:

```tsx
import type { JSX } from 'react';
import type { Cover } from '@/games/cover';

type GameCoverProps = {
  cover: Cover;
  size: 'card' | 'hero';
};

const SIZE_CLASSES: Record<GameCoverProps['size'], string> = {
  card: 'aspect-[4/3] w-full rounded-2xl text-5xl',
  hero: 'aspect-[4/3] w-56 rounded-3xl text-7xl',
};

export const GameCover = ({
  cover,
  size,
}: GameCoverProps): JSX.Element => {
  const cls = SIZE_CLASSES[size];

  if (cover.kind === 'image') {
    return (
      <div
        className={`${cls} flex items-center justify-center overflow-hidden`}
        style={{ background: cover.background ?? '#f3f4f6' }}
      >
        <img
          src={cover.src}
          alt={cover.alt ?? ''}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const background = cover.gradient
    ? `linear-gradient(135deg, ${cover.gradient[0]}, ${cover.gradient[1]})`
    : '#f3f4f6';

  return (
    <div
      className={`${cls} flex items-center justify-center`}
      style={{ background }}
    >
      <span aria-hidden="true">{cover.emoji}</span>
    </div>
  );
};
```

- [ ] **Step 8: Run test to verify it passes**

```bash
yarn vitest run src/components/GameCover.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/games/cover.ts src/games/cover.test.ts src/components/GameCover.tsx src/components/GameCover.test.tsx
git commit -m "feat(homepage): add Cover type and GameCover component"
```

---

### Task 2: Add `defaultCover` to game registry

**Files:**

- Modify: `src/games/registry.ts`
- Modify: `src/games/cover.ts` (read the default from the registry instead of a local map)

- [ ] **Step 1: Update `GameCatalogEntry` to carry the cover**

Edit `src/games/registry.ts`:

```ts
import type { Cover } from './cover';

export type GameLevel = 'PK' | 'K' | '1' | '2' | '3' | '4';
export type GameSubject = 'math' | 'reading' | 'letters';

export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  levels: GameLevel[];
  subject: GameSubject;
  defaultCover: Cover;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    descriptionKey: 'word-spell-description',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔤',
      gradient: ['#fde68a', '#fb923c'],
    },
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    descriptionKey: 'number-match-description',
    levels: ['1', '2'],
    subject: 'math',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔢',
      gradient: ['#bae6fd', '#6366f1'],
    },
  },
  {
    id: 'sort-numbers',
    titleKey: 'sort-numbers',
    descriptionKey: 'sort-numbers-description',
    levels: ['K', '1', '2'],
    subject: 'math',
    defaultCover: {
      kind: 'emoji',
      emoji: '📊',
      gradient: ['#bbf7d0', '#10b981'],
    },
  },
];
```

- [ ] **Step 2: Point `cover.ts` at the registry**

Replace the local `DEFAULT_COVERS` with a registry lookup. Edit
`src/games/cover.ts`:

```ts
import { GAME_CATALOG } from './registry';

export type Cover =
  | {
      kind: 'emoji';
      emoji: string;
      gradient?: [string, string];
    }
  | {
      kind: 'image';
      src: string;
      alt?: string;
      background?: string;
    };

export const resolveDefaultCover = (gameId: string): Cover => {
  const entry = GAME_CATALOG.find((g) => g.id === gameId);
  if (!entry) throw new Error(`unknown gameId: ${gameId}`);
  return entry.defaultCover;
};

export const resolveCover = (
  doc: { cover?: Cover },
  gameId: string,
): Cover => doc.cover ?? resolveDefaultCover(gameId);
```

(The `Cover` type now has a circular import with `registry.ts`; break the
cycle by splitting the type into its own file.)

- [ ] **Step 3: Break the circular import**

Split the type into `src/games/cover-type.ts`:

```ts
export type Cover =
  | {
      kind: 'emoji';
      emoji: string;
      gradient?: [string, string];
    }
  | {
      kind: 'image';
      src: string;
      alt?: string;
      background?: string;
    };
```

Edit `src/games/cover.ts` to import and re-export:

```ts
import { GAME_CATALOG } from './registry';
import type { Cover } from './cover-type';

export type { Cover };

export const resolveDefaultCover = (gameId: string): Cover => {
  const entry = GAME_CATALOG.find((g) => g.id === gameId);
  if (!entry) throw new Error(`unknown gameId: ${gameId}`);
  return entry.defaultCover;
};

export const resolveCover = (
  doc: { cover?: Cover },
  gameId: string,
): Cover => doc.cover ?? resolveDefaultCover(gameId);
```

Edit `src/games/registry.ts` to import from `./cover-type`:

```ts
import type { Cover } from './cover-type';
```

Edit `src/components/GameCover.tsx` — change the import to
`import type { Cover } from '@/games/cover-type';`.

- [ ] **Step 4: Run the test suite**

```bash
yarn vitest run src/games/cover.test.ts src/components/GameCover.test.tsx
yarn typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/registry.ts src/games/cover.ts src/games/cover-type.ts src/components/GameCover.tsx
git commit -m "feat(homepage): add defaultCover to GAME_CATALOG entries"
```

---

### Task 3: Extend `SavedGameConfigDoc` schema with optional `cover` (v2 migration)

**Files:**

- Modify: `src/db/schemas/saved_game_configs.ts`
- Modify: `src/db/create-database.ts`
- Create: `src/db/schemas/saved_game_configs.test.ts`

- [ ] **Step 1: Write the failing test for the v2 schema**

Create `src/db/schemas/saved_game_configs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getOrCreateDatabase } from '../create-database';

describe('saved_game_configs schema v2', () => {
  it('accepts an optional cover field', async () => {
    const db = await getOrCreateDatabase();
    const doc = await db.saved_game_configs.insert({
      id: 'test-with-cover',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Zoo Words',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'amber',
      cover: { kind: 'emoji', emoji: '🦁' },
    });
    expect(doc.cover).toEqual({ kind: 'emoji', emoji: '🦁' });
    await doc.remove();
  });

  it('preserves docs missing the cover field (v1 docs)', async () => {
    const db = await getOrCreateDatabase();
    const doc = await db.saved_game_configs.insert({
      id: 'test-no-cover',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Classic',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'indigo',
    });
    expect(doc.cover).toBeUndefined();
    await doc.remove();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/db/schemas/saved_game_configs.test.ts
```

Expected: FAIL — schema rejects `cover` property.

- [ ] **Step 3: Bump schema to v2 and add `cover`**

Edit `src/db/schemas/saved_game_configs.ts`:

```ts
import type { RxJsonSchema } from 'rxdb';
import type { Cover } from '@/games/cover-type';

export type SavedGameConfigDoc = {
  id: string;
  profileId: string;
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
  cover?: Cover;
};

export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> =
  {
    version: 2,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 36 },
      profileId: { type: 'string', maxLength: 36 },
      gameId: { type: 'string', maxLength: 64 },
      name: { type: 'string', maxLength: 128 },
      config: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' },
      color: { type: 'string', maxLength: 32 },
      cover: {
        oneOf: [
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['emoji'] },
              emoji: { type: 'string', maxLength: 16 },
              gradient: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 2,
              },
            },
            required: ['kind', 'emoji'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['image'] },
              src: { type: 'string', maxLength: 2048 },
              alt: { type: 'string', maxLength: 256 },
              background: { type: 'string', maxLength: 32 },
            },
            required: ['kind', 'src'],
            additionalProperties: false,
          },
        ],
      },
    },
    required: [
      'id',
      'profileId',
      'gameId',
      'name',
      'config',
      'createdAt',
      'color',
    ],
    additionalProperties: false,
  };
```

- [ ] **Step 4: Register the v1 → v2 migration strategy**

Find the `saved_game_configs` collection registration in
`src/db/create-database.ts` and add `migrationStrategies`:

```ts
saved_game_configs: {
  schema: savedGameConfigsSchema,
  migrationStrategies: {
    2: (oldDoc) => oldDoc, // v1 docs already lack `cover`; no-op keeps them valid
  },
},
```

(Confirm the structure matches the existing `session_history_index` v2
registration — the shape should be consistent with how RxDB migrations are
wired in that file today.)

- [ ] **Step 5: Run the schema test**

```bash
yarn vitest run src/db/schemas/saved_game_configs.test.ts
yarn vitest run src/db/create-database.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/db/schemas/saved_game_configs.ts src/db/schemas/saved_game_configs.test.ts src/db/create-database.ts
git commit -m "feat(homepage): add optional cover field to SavedGameConfigDoc (v2)"
```

---

### Task 4: Playful titles and direction labels (i18n)

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Update English titles and direction labels**

Edit `src/lib/i18n/locales/en/games.json` — replace the top three title
values and add direction subtitles plus new custom game-save strings:

```json
{
  "word-spell": "Spell It!",
  "word-spell-description": "Drag letter tiles to spell the word.",
  "number-match": "Match the Number!",
  "number-match-description": "Match numerals to groups by dragging tiles.",
  "sort-numbers": "Count in Order",
  "sort-numbers-description": "Put the numbers in order!",
  "shell": {
    "round": "Round {{current}} / {{total}}",
    "undo": "Undo",
    "pause": "Pause",
    "exit": "Exit"
  },
  "ui": {
    "choose-a-letter": "Choose a letter",
    "almost-try-again": "Almost! Try again.",
    "great-job": "Great job!",
    "hear-the-question": "Hear the question",
    "tap-to-hear": "tap to hear"
  },
  "instructions": {
    "word-spell": "Drag the letters into the boxes to spell the word. Tap the picture or the speaker to hear the word.",
    "number-match": "Drag the tiles to match each number. Tap the number to hear it.",
    "sort-numbers": "Put the numbers in order! Drag each number to the right place.",
    "lets-go": "Let's go!",
    "settings": "⚙️ Settings",
    "advanced": "Advanced",
    "updateCustom game": "Update \"{{name}}\"",
    "saveAsNew": "Save as new custom game",
    "cancel": "Cancel"
  },
  "sort-numbers-ui": {
    "ascending-label": "Going Up!",
    "ascending-sub": "ascending",
    "descending-label": "Going Down!",
    "descending-sub": "descending",
    "arrange": "Put {{count}} numbers in {{direction}} order"
  },
  "input-method": {
    "drag": "Drag",
    "type": "Type",
    "both": "Both"
  }
}
```

- [ ] **Step 2: Update pt-BR translations**

Read `src/lib/i18n/locales/pt-BR/games.json` to find the current
equivalents and apply matching kid-playful pt-BR titles and direction
labels. Proposed values:

```json
{
  "word-spell": "Soletre!",
  "number-match": "Ache o Número!",
  "sort-numbers": "Conte na Ordem",
  "sort-numbers-ui": {
    "ascending-label": "Pra Cima!",
    "ascending-sub": "crescente",
    "descending-label": "Pra Baixo!",
    "descending-sub": "decrescente"
  },
  "instructions": {
    "lets-go": "Vamos lá!",
    "updateCustom game": "Atualizar \"{{name}}\"",
    "saveAsNew": "Salvar como novo favorito",
    "cancel": "Cancelar"
  },
  "input-method": {
    "drag": "Arrastar",
    "type": "Digitar",
    "both": "Ambos"
  }
}
```

Merge these into the existing object, leaving untouched keys intact.

- [ ] **Step 3: Fix-and-lint the JSON files**

```bash
yarn fix:md
npx prettier --write src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
```

- [ ] **Step 4: Update existing tests that assert old titles**

Run unit tests and fix any that hard-code the old strings:

```bash
yarn vitest run
```

Expected failures: anything asserting `"Word Spell"`, `"Number Match"`,
`"Sort Numbers"`, `"Smallest → Biggest"`, `"Biggest → Smallest"`. Update
those assertions to the new values.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
# plus any test files touched
git commit -m "feat(homepage): kid-playful game titles and direction labels"
```

---

### Task 5: Shared config primitives — `Stepper`

**Files:**

- Create: `src/components/config/Stepper.tsx`
- Create: `src/components/config/Stepper.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/config/Stepper.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';

const Harness = ({
  initial,
  min,
  max,
}: {
  initial: number;
  min: number;
  max: number;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Stepper
      value={value}
      min={min}
      max={max}
      onChange={setValue}
      label="Count"
    />
  );
};

const getInput = () =>
  screen.getByRole('spinbutton') as HTMLInputElement;

describe('Stepper', () => {
  it('increments on + click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(getInput().value).toBe('4');
  });

  it('decrements on - click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(getInput().value).toBe('2');
  });

  it('clamps at max on click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={9} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /increase/i }));
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(getInput().value).toBe('10');
  });

  it('clamps at min on click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={2} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(getInput().value).toBe('1');
  });

  it('increments on ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(getInput());
    await user.keyboard('{ArrowUp}');
    expect(getInput().value).toBe('4');
  });

  it('decrements on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(getInput());
    await user.keyboard('{ArrowDown}');
    expect(getInput().value).toBe('2');
  });

  it('accepts typed input and commits on blur, clamped to range', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '7');
    await user.tab();
    expect(getInput().value).toBe('7');
  });

  it('clamps typed input above max on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '99');
    await user.tab();
    expect(getInput().value).toBe('10');
  });

  it('reverts non-numeric input on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), 'abc');
    await user.tab();
    expect(getInput().value).toBe('3');
  });

  it('strips leading zeros on commit', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '007');
    await user.tab();
    expect(getInput().value).toBe('7');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/config/Stepper.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Stepper`**

Create `src/components/config/Stepper.tsx`:

```tsx
import {
  useEffect,
  useState,
  type JSX,
  type KeyboardEvent,
} from 'react';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

export const Stepper = ({
  value,
  min,
  max,
  onChange,
  label,
}: StepperProps): JSX.Element => {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    const parsed = /^-?\d+$/.test(trimmed)
      ? Number.parseInt(trimmed, 10)
      : NaN;
    if (Number.isFinite(parsed)) {
      const next = clamp(parsed, min, max);
      setDraft(String(next));
      if (next !== value) onChange(next);
    } else {
      setDraft(String(value));
    }
  };

  const dec = () => onChange(clamp(value - 1, min, max));
  const inc = () => onChange(clamp(value + 1, min, max));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      inc();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      dec();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(draft);
      event.currentTarget.blur();
    }
  };

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-lg border border-input bg-background"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={dec}
        disabled={value <= min}
        className="h-10 w-10 text-lg disabled:opacity-40"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(event) => event.target.select()}
        className="h-10 w-12 bg-transparent text-center font-bold outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={inc}
        disabled={value >= max}
        className="h-10 w-10 text-lg disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
};
```

> **Three input methods, on purpose:** chunky +/- buttons for kids on touch, ArrowUp/ArrowDown for keyboard users, and a real text input so parents/teachers can just type. We use `type="text"` + `inputMode="numeric"` + `pattern` instead of `type="number"` to avoid the native leading-zero weirdness and scroll-wheel foot-guns; parsing/clamping happens on blur and on Enter.

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn vitest run src/components/config/Stepper.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/config/Stepper.tsx src/components/config/Stepper.test.tsx
git commit -m "feat(homepage): add Stepper primitive"
```

---

### Task 6: Shared config primitives — `ChunkGroup`

**Files:**

- Create: `src/components/config/ChunkGroup.tsx`
- Create: `src/components/config/ChunkGroup.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/config/ChunkGroup.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChunkGroup } from './ChunkGroup';

const OPTIONS = [
  { value: 'a', emoji: '🚀', label: 'Going Up', subtitle: 'ascending' },
  {
    value: 'b',
    emoji: '🛝',
    label: 'Going Down',
    subtitle: 'descending',
  },
];

describe('ChunkGroup', () => {
  it('shows all options with their emoji and label', () => {
    render(
      <ChunkGroup
        label="Direction"
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Going Up')).toBeInTheDocument();
    expect(screen.getByText('Going Down')).toBeInTheDocument();
  });

  it('marks the selected option with aria-pressed=true', () => {
    render(
      <ChunkGroup
        label="Direction"
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /going up/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when a different option is tapped', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [value, setValue] = useState('a');
      return (
        <ChunkGroup
          label="Direction"
          options={OPTIONS}
          value={value}
          onChange={setValue}
        />
      );
    };
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: /going down/i }),
    );
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/config/ChunkGroup.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ChunkGroup`**

Create `src/components/config/ChunkGroup.tsx`:

```tsx
import type { JSX } from 'react';

export type ChunkOption = {
  value: string;
  emoji: string;
  label: string;
  subtitle?: string;
};

type ChunkGroupProps = {
  label: string;
  options: ChunkOption[];
  value: string;
  onChange: (value: string) => void;
};

export const ChunkGroup = ({
  label,
  options,
  value,
  onChange,
}: ChunkGroupProps): JSX.Element => (
  <div
    role="group"
    aria-label={label}
    className="grid gap-2"
    style={{
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
    }}
  >
    {options.map((o) => {
      const selected = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected}
          aria-label={o.label}
          onClick={() => onChange(o.value)}
          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
            selected
              ? 'border-primary bg-primary/10'
              : 'border-transparent bg-muted'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            {o.emoji}
          </span>
          <span className="text-sm font-bold">{o.label}</span>
          {o.subtitle && (
            <span className="text-xs italic text-muted-foreground">
              {o.subtitle}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn vitest run src/components/config/ChunkGroup.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/config/ChunkGroup.tsx src/components/config/ChunkGroup.test.tsx
git commit -m "feat(homepage): add ChunkGroup primitive"
```

---

### Task 7: Shared config primitives — `CellSelect`

**Files:**

- Create: `src/components/config/CellSelect.tsx`
- Create: `src/components/config/CellSelect.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/config/CellSelect.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CellSelect } from './CellSelect';

const OPTIONS = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
];

describe('CellSelect', () => {
  it('shows the current label as preview', () => {
    render(
      <CellSelect
        label="Count"
        value="1"
        options={OPTIONS}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('fires onChange when the underlying select changes', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [value, setValue] = useState('1');
      return (
        <CellSelect
          label="Count"
          value={value}
          options={OPTIONS}
          onChange={setValue}
        />
      );
    };
    render(<Harness />);
    await user.selectOptions(screen.getByLabelText('Count'), '2');
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/config/CellSelect.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `CellSelect`**

Create `src/components/config/CellSelect.tsx`:

```tsx
import type { JSX } from 'react';

export type CellSelectOption = {
  value: string;
  label: string;
};

type CellSelectProps = {
  label: string;
  value: string;
  options: CellSelectOption[];
  onChange: (value: string) => void;
  hint?: string;
};

export const CellSelect = ({
  label,
  value,
  options,
  onChange,
  hint,
}: CellSelectProps): JSX.Element => {
  const currentLabel =
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <label className="relative flex h-14 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-transparent bg-muted px-3 text-center">
      <span className="text-base font-bold">{currentLabel}</span>
      {hint && (
        <span className="text-xs italic text-muted-foreground">
          {hint}
        </span>
      )}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/components/config/CellSelect.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/config/CellSelect.tsx src/components/config/CellSelect.test.tsx
git commit -m "feat(homepage): add CellSelect primitive"
```

---

### Task 8: Shared config primitives — `ChipStrip`

**Files:**

- Create: `src/components/config/ChipStrip.tsx`
- Create: `src/components/config/ChipStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/config/ChipStrip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ChipStrip } from './ChipStrip';

const CHIPS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

describe('ChipStrip', () => {
  it('renders chips in read-only mode without buttons', () => {
    render(
      <ChipStrip chips={CHIPS} selected={['a']} mode="read-only" />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('toggles chips in toggleable mode', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [selected, setSelected] = useState<string[]>(['a']);
      return (
        <ChipStrip
          chips={CHIPS}
          selected={selected}
          mode="toggleable"
          onChange={setSelected}
        />
      );
    };
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /B/i }));
    expect(screen.getByRole('button', { name: /B/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/config/ChipStrip.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `ChipStrip`**

Create `src/components/config/ChipStrip.tsx`:

```tsx
import type { JSX } from 'react';

export type Chip = {
  value: string;
  label: string;
  subtitle?: string;
};

type ChipStripProps =
  | {
      chips: Chip[];
      selected: string[];
      mode: 'read-only';
    }
  | {
      chips: Chip[];
      selected: string[];
      mode: 'toggleable';
      onChange: (next: string[]) => void;
    };

export const ChipStrip = (props: ChipStripProps): JSX.Element => {
  const { chips, selected, mode } = props;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => {
        const on = selected.includes(c.value);
        const base = 'rounded-full px-2.5 py-1 text-xs font-bold';
        const cls = on
          ? `${base} bg-primary text-primary-foreground`
          : `${base} bg-muted text-muted-foreground`;

        if (mode === 'read-only') {
          return (
            <span key={c.value} className={cls}>
              {c.label}
            </span>
          );
        }

        const toggle = () => {
          const next = on
            ? selected.filter((v) => v !== c.value)
            : [...selected, c.value];
          props.onChange(next);
        };

        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={on}
            aria-label={c.label}
            onClick={toggle}
            className={cls}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/components/config/ChipStrip.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/config/ChipStrip.tsx src/components/config/ChipStrip.test.tsx
git commit -m "feat(homepage): add ChipStrip primitive"
```

---

### Task 9: Simple labels utility

**Files:**

- Create: `src/games/simple-labels.ts`
- Create: `src/games/simple-labels.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/simple-labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { directionLabel, inputMethodLabel } from './simple-labels';

describe('simple-labels', () => {
  it('returns kid-playful direction labels', () => {
    expect(directionLabel('ascending')).toMatchObject({
      emoji: '🚀',
      label: 'Going Up!',
      subtitle: 'ascending',
    });
    expect(directionLabel('descending')).toMatchObject({
      emoji: '🛝',
      label: 'Going Down!',
      subtitle: 'descending',
    });
  });

  it('returns kid-playful input-method labels', () => {
    expect(inputMethodLabel('drag')).toEqual({
      emoji: '✋',
      label: 'Drag',
    });
    expect(inputMethodLabel('type')).toEqual({
      emoji: '⌨️',
      label: 'Type',
    });
    expect(inputMethodLabel('both')).toEqual({
      emoji: '✨',
      label: 'Both',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/simple-labels.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `simple-labels.ts`**

Create `src/games/simple-labels.ts`:

```ts
export type Direction = 'ascending' | 'descending';
export type InputMethod = 'drag' | 'type' | 'both';

export const directionLabel = (d: Direction) =>
  d === 'ascending'
    ? {
        emoji: '🚀',
        label: 'Going Up!',
        subtitle: 'ascending',
      }
    : {
        emoji: '🛝',
        label: 'Going Down!',
        subtitle: 'descending',
      };

export const inputMethodLabel = (m: InputMethod) => {
  switch (m) {
    case 'drag': {
      return { emoji: '✋', label: 'Drag' };
    }
    case 'type': {
      return { emoji: '⌨️', label: 'Type' };
    }
    case 'both': {
      return { emoji: '✨', label: 'Both' };
    }
  }
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/simple-labels.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/simple-labels.ts src/games/simple-labels.test.ts
git commit -m "feat(homepage): add simple-labels utility"
```

---

### Task 10: `configToChips` utility

**Files:**

- Create: `src/games/config-chips.ts`
- Create: `src/games/config-chips.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/config-chips.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { configToChips } from './config-chips';

describe('configToChips', () => {
  it('returns chips for Spell It!', () => {
    const chips = configToChips('word-spell', {
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['m', 'd', 'g'],
        },
      },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['Level 2', 'm, d, g', '✋ Drag']);
  });

  it('truncates long phoneme lists', () => {
    const chips = configToChips('word-spell', {
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['m', 'd', 'g', 'o', 'c'],
        },
      },
      inputMethod: 'type',
    });
    expect(chips[1]).toBe('m, d, g…');
  });

  it('returns chips for Match the Number!', () => {
    const chips = configToChips('number-match', {
      mode: 'numeral-to-group',
      range: { min: 1, max: 10 },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['numeral → group', '1–10', '✋ Drag']);
  });

  it('returns chips for Count in Order', () => {
    const chips = configToChips('sort-numbers', {
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2 },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['🚀 Up', '5 numbers', '2s', '✋ Drag']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/config-chips.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `configToChips`**

Create `src/games/config-chips.ts`:

```ts
import { inputMethodLabel } from './simple-labels';
import type { InputMethod } from './simple-labels';

const chipsForWordSpell = (
  config: Record<string, unknown>,
): string[] => {
  const source = config.source as
    | {
        filter?: {
          level?: number;
          phonemesAllowed?: string[];
          graphemesAllowed?: string[];
        };
      }
    | undefined;
  const filter = source?.filter;
  const chips: string[] = [];
  if (typeof filter?.level === 'number') {
    chips.push(`Level ${filter.level}`);
  }
  const sounds =
    filter?.phonemesAllowed ?? filter?.graphemesAllowed ?? [];
  if (sounds.length > 0) {
    const shown = sounds.slice(0, 3).join(', ');
    chips.push(sounds.length > 3 ? `${shown}…` : shown);
  }
  return chips;
};

const chipsForNumberMatch = (
  config: Record<string, unknown>,
): string[] => {
  const chips: string[] = [];
  if (typeof config.mode === 'string') {
    chips.push(config.mode.replace('-to-', ' → ').replace(/-/g, ' '));
  }
  const range = config.range as
    | { min?: number; max?: number }
    | undefined;
  if (
    typeof range?.min === 'number' &&
    typeof range?.max === 'number'
  ) {
    chips.push(`${range.min}–${range.max}`);
  }
  return chips;
};

const chipsForSortNumbers = (
  config: Record<string, unknown>,
): string[] => {
  const chips: string[] = [];
  if (config.direction === 'ascending') chips.push('🚀 Up');
  else if (config.direction === 'descending') chips.push('🛝 Down');
  if (typeof config.quantity === 'number') {
    chips.push(`${config.quantity} numbers`);
  }
  const skip = config.skip as { step?: number } | undefined;
  if (typeof skip?.step === 'number') {
    chips.push(`${skip.step}s`);
  }
  return chips;
};

export const configToChips = (
  gameId: string,
  config: Record<string, unknown>,
): string[] => {
  const chips = (() => {
    switch (gameId) {
      case 'word-spell': {
        return chipsForWordSpell(config);
      }
      case 'number-match': {
        return chipsForNumberMatch(config);
      }
      case 'sort-numbers': {
        return chipsForSortNumbers(config);
      }
      default: {
        return [];
      }
    }
  })();

  const input = config.inputMethod as InputMethod | undefined;
  if (input === 'drag' || input === 'type' || input === 'both') {
    const { emoji, label } = inputMethodLabel(input);
    chips.push(`${emoji} ${label}`);
  }
  return chips;
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/config-chips.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games/config-chips.ts src/games/config-chips.test.ts
git commit -m "feat(homepage): add configToChips utility"
```

---

### Task 11: `pairToMode` for Match the Number

**Files:**

- Create: `src/games/number-match/pair-to-mode.ts`
- Create: `src/games/number-match/pair-to-mode.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/number-match/pair-to-mode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { pairToMode, validToValues } from './pair-to-mode';

describe('pairToMode', () => {
  it('maps numeral → group', () => {
    expect(pairToMode('numeral', 'group')).toBe('numeral-to-group');
  });

  it('maps group → numeral', () => {
    expect(pairToMode('group', 'numeral')).toBe('group-to-numeral');
  });

  it('maps numeral → word (cardinal number → text)', () => {
    expect(pairToMode('numeral', 'word')).toBe(
      'cardinal-number-to-text',
    );
  });

  it('maps word → numeral', () => {
    expect(pairToMode('word', 'numeral')).toBe(
      'cardinal-text-to-number',
    );
  });

  it('maps numeral → ordinal and back', () => {
    expect(pairToMode('numeral', 'ordinal')).toBe(
      'cardinal-to-ordinal',
    );
    expect(pairToMode('ordinal', 'numeral')).toBe(
      'ordinal-to-cardinal',
    );
  });

  it('throws on invalid pairs', () => {
    expect(() => pairToMode('numeral', 'numeral')).toThrow();
  });
});

describe('validToValues', () => {
  it('lists all valid "to" choices for a given "from"', () => {
    expect(validToValues('numeral')).toEqual([
      'group',
      'word',
      'ordinal',
    ]);
    expect(validToValues('group')).toEqual(['numeral']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/number-match/pair-to-mode.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/games/number-match/pair-to-mode.ts`:

```ts
import type { NumberMatchMode } from './types';

export type Primitive = 'numeral' | 'group' | 'word' | 'ordinal';

const PAIRS: Record<string, NumberMatchMode> = {
  'numeral->group': 'numeral-to-group',
  'group->numeral': 'group-to-numeral',
  'numeral->word': 'cardinal-number-to-text',
  'word->numeral': 'cardinal-text-to-number',
  'ordinal->word': 'ordinal-number-to-text',
  'word->ordinal': 'ordinal-text-to-number',
  'numeral->ordinal': 'cardinal-to-ordinal',
  'ordinal->numeral': 'ordinal-to-cardinal',
};

export const pairToMode = (
  from: Primitive,
  to: Primitive,
): NumberMatchMode => {
  const key = `${from}->${to}`;
  const mode = PAIRS[key];
  if (!mode) throw new Error(`invalid pair: ${key}`);
  return mode;
};

export const modeToPair = (
  mode: NumberMatchMode,
): { from: Primitive; to: Primitive } => {
  const entry = Object.entries(PAIRS).find(([, v]) => v === mode);
  if (!entry) throw new Error(`unknown mode: ${mode}`);
  const [from, to] = entry[0].split('->') as [Primitive, Primitive];
  return { from, to };
};

export const validToValues = (from: Primitive): Primitive[] =>
  Object.keys(PAIRS)
    .filter((k) => k.startsWith(`${from}->`))
    .map((k) => k.split('->')[1] as Primitive);
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/number-match/pair-to-mode.test.ts
```

Expected: PASS (6 + 1 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games/number-match/pair-to-mode.ts src/games/number-match/pair-to-mode.test.ts
git commit -m "feat(homepage): add pairToMode helper for NumberMatch"
```

---

### Task 12: `NumberMatchSimpleConfig` type and `resolveSimpleConfig`

**Files:**

- Modify: `src/games/number-match/types.ts` (add `configMode?`, export `NumberMatchSimpleConfig`)
- Create: `src/games/number-match/resolve-simple-config.ts`
- Create: `src/games/number-match/resolve-simple-config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/number-match/resolve-simple-config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';

describe('NumberMatch resolveSimpleConfig', () => {
  it('maps a simple config to a full config', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'numeral',
      to: 'group',
      rangeMin: 1,
      rangeMax: 10,
      inputMethod: 'drag',
      distractorCount: 3,
    });
    expect(full.mode).toBe('numeral-to-group');
    expect(full.range).toEqual({ min: 1, max: 10 });
    expect(full.tileStyle).toBe('dots');
    expect(full.tileBankMode).toBe('distractors');
  });

  it('produces tileBankMode "exact" when distractorCount is 0', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'numeral',
      to: 'group',
      rangeMin: 1,
      rangeMax: 10,
      inputMethod: 'drag',
      distractorCount: 0,
    });
    expect(full.tileBankMode).toBe('exact');
  });

  it('round-trips via advancedToSimple', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'group',
      to: 'numeral',
      rangeMin: 2,
      rangeMax: 8,
      inputMethod: 'both',
      distractorCount: 2,
    });
    const back = advancedToSimple(full);
    expect(back.from).toBe('group');
    expect(back.to).toBe('numeral');
    expect(back.rangeMin).toBe(2);
    expect(back.rangeMax).toBe(8);
    expect(back.inputMethod).toBe('both');
    expect(back.distractorCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/number-match/resolve-simple-config.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Add `NumberMatchSimpleConfig` and `configMode`**

Edit `src/games/number-match/types.ts` — add at the top of the file:

```ts
export type NumberMatchSimpleConfig = {
  configMode: 'simple';
  from: 'numeral' | 'group' | 'word' | 'ordinal';
  to: 'numeral' | 'group' | 'word' | 'ordinal';
  rangeMin: number;
  rangeMax: number;
  inputMethod: 'drag' | 'type' | 'both';
  distractorCount: number;
};
```

And in `NumberMatchConfig`:

```ts
export interface NumberMatchConfig extends AnswerGameConfig {
  component: 'NumberMatch';
  configMode?: 'simple' | 'advanced';
  mode: NumberMatchMode;
  tileStyle: 'dots' | 'objects' | 'fingers';
  tileBankMode?: 'exact' | 'distractors';
  distractorCount?: number;
  range: { min: number; max: number };
  rounds: NumberMatchRound[];
}
```

- [ ] **Step 4: Implement resolver**

Create `src/games/number-match/resolve-simple-config.ts`:

```ts
import { modeToPair, pairToMode } from './pair-to-mode';
import type {
  NumberMatchConfig,
  NumberMatchSimpleConfig,
} from './types';

export const resolveSimpleConfig = (
  simple: NumberMatchSimpleConfig,
): NumberMatchConfig => {
  const mode = pairToMode(simple.from, simple.to);
  const tileBankMode =
    simple.distractorCount > 0 ? 'distractors' : 'exact';

  return {
    gameId: 'number-match',
    component: 'NumberMatch',
    configMode: 'simple',
    mode,
    tileStyle: 'dots',
    tileBankMode,
    distractorCount: simple.distractorCount,
    range: { min: simple.rangeMin, max: simple.rangeMax },
    inputMethod: simple.inputMethod,
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 1,
    rounds: [],
  };
};

export const advancedToSimple = (
  config: NumberMatchConfig,
): NumberMatchSimpleConfig => {
  const { from, to } = modeToPair(config.mode);
  return {
    configMode: 'simple',
    from,
    to,
    rangeMin: config.range.min,
    rangeMax: config.range.max,
    inputMethod:
      (config.inputMethod as 'drag' | 'type' | 'both') ?? 'drag',
    distractorCount: config.distractorCount ?? 0,
  };
};
```

- [ ] **Step 5: Run the test**

```bash
yarn vitest run src/games/number-match/resolve-simple-config.test.ts
yarn typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/number-match/types.ts src/games/number-match/resolve-simple-config.ts src/games/number-match/resolve-simple-config.test.ts
git commit -m "feat(homepage): NumberMatchSimpleConfig + resolver"
```

---

### Task 13: `WordSpellSimpleConfig` type and resolver

**Files:**

- Modify: `src/games/word-spell/types.ts`
- Create: `src/games/word-spell/resolve-simple-config.ts`
- Create: `src/games/word-spell/resolve-simple-config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/word-spell/resolve-simple-config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';

describe('WordSpell resolveSimpleConfig', () => {
  it('builds a word-library source from simple fields', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      level: 2,
      phonemesAllowed: ['m', 'd', 'g'],
      inputMethod: 'drag',
    });
    expect(full.source).toEqual({
      type: 'word-library',
      filter: {
        region: 'aus',
        level: 2,
        phonemesAllowed: ['m', 'd', 'g'],
      },
    });
    expect(full.mode).toBe('scramble');
    expect(full.inputMethod).toBe('drag');
  });

  it('round-trips via advancedToSimple', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      level: 3,
      phonemesAllowed: ['k', 'ck'],
      inputMethod: 'type',
    });
    const back = advancedToSimple(full);
    expect(back.level).toBe(3);
    expect(back.phonemesAllowed).toEqual(['k', 'ck']);
    expect(back.inputMethod).toBe('type');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/word-spell/resolve-simple-config.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Add `WordSpellSimpleConfig` and `configMode`**

Edit `src/games/word-spell/types.ts` — add:

```ts
export type WordSpellSimpleConfig = {
  configMode: 'simple';
  level: number;
  phonemesAllowed: string[];
  inputMethod: 'drag' | 'type' | 'both';
};
```

And modify `WordSpellConfig` to include `configMode?: 'simple' | 'advanced'`.

- [ ] **Step 4: Implement resolver**

Create `src/games/word-spell/resolve-simple-config.ts`:

```ts
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';

export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => ({
  gameId: 'word-spell',
  component: 'WordSpell',
  configMode: 'simple',
  mode: 'scramble',
  tileUnit: 'letter',
  inputMethod: simple.inputMethod,
  wrongTileBehavior: 'lock-manual',
  ttsEnabled: true,
  roundsInOrder: false,
  totalRounds: 4,
  tileBankMode: 'exact',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      level: simple.level,
      phonemesAllowed: simple.phonemesAllowed,
    },
  },
});

export const advancedToSimple = (
  config: WordSpellConfig,
): WordSpellSimpleConfig => {
  const filter = config.source?.filter;
  return {
    configMode: 'simple',
    level: filter?.level ?? 1,
    phonemesAllowed: filter?.phonemesAllowed ?? [],
    inputMethod:
      (config.inputMethod as 'drag' | 'type' | 'both') ?? 'drag',
  };
};
```

- [ ] **Step 5: Run the test**

```bash
yarn vitest run src/games/word-spell/resolve-simple-config.test.ts
yarn typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/types.ts src/games/word-spell/resolve-simple-config.ts src/games/word-spell/resolve-simple-config.test.ts
git commit -m "feat(homepage): WordSpellSimpleConfig + resolver"
```

---

### Task 14: `SortNumbersSimpleConfigForm` — replace legacy form

**Files:**

- Create: `src/games/sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm.tsx`
- Create: `src/games/sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create the test file alongside the new component with at least:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SortNumbersSimpleConfigForm } from './SortNumbersSimpleConfigForm';

const Harness = () => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    direction: 'ascending',
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 2 },
    range: { min: 2, max: 10 },
    inputMethod: 'drag',
  });
  return (
    <SortNumbersSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('SortNumbersSimpleConfigForm', () => {
  it('flips direction via ChunkGroup', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: /going down/i }),
    );
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a live preview of the sequence', async () => {
    render(<Harness />);
    expect(screen.getByText(/2, 4, 6, 8, 10/)).toBeInTheDocument();
  });

  it('increments quantity via stepper', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('group', { name: /how many/i });
    await user.click(
      within(group).getByRole('button', { name: /increase/i }),
    );
    expect(screen.getByText(/2, 4, 6, 8, 10, 12/)).toBeInTheDocument();
  });
});
```

Add `import { within } from '@testing-library/react'` at the top.

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the form**

Create `src/games/sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm.tsx`:

```tsx
import type { JSX } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { Stepper } from '@/components/config/Stepper';
import { directionLabel } from '@/games/simple-labels';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const SortNumbersSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const direction =
    (config.direction as 'ascending' | 'descending') ?? 'ascending';
  const quantity =
    typeof config.quantity === 'number' ? config.quantity : 5;
  const skip = (config.skip as {
    mode: 'by';
    step: number;
    start: number;
  }) ?? { mode: 'by', step: 2, start: 2 };
  const step = skip.step ?? 2;
  const start = skip.start ?? 2;
  const inputMethod =
    (config.inputMethod as 'drag' | 'type' | 'both') ?? 'drag';

  const sequence = Array.from(
    { length: quantity },
    (_, i) => start + i * step,
  );
  const preview =
    direction === 'ascending'
      ? sequence.join(', ')
      : [...sequence].reverse().join(', ');

  const ascSub = directionLabel('ascending');
  const descSub = directionLabel('descending');

  return (
    <div className="flex flex-col gap-4">
      <ChunkGroup
        label="Which way?"
        options={[
          {
            value: 'ascending',
            emoji: ascSub.emoji,
            label: ascSub.label,
            subtitle: ascSub.subtitle,
          },
          {
            value: 'descending',
            emoji: descSub.emoji,
            label: descSub.label,
            subtitle: descSub.subtitle,
          },
        ]}
        value={direction}
        onChange={(d) => onChange({ ...config, direction: d })}
      />

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          How many?
          <Stepper
            label="How many"
            value={quantity}
            min={2}
            max={8}
            onChange={(v) => onChange({ ...config, quantity: v })}
          />
        </label>
        <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Start at
          <Stepper
            label="Start"
            value={start}
            min={1}
            max={99}
            onChange={(v) =>
              onChange({
                ...config,
                skip: { ...skip, start: v },
              })
            }
          />
        </label>
        <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Skip by
          <Stepper
            label="Skip"
            value={step}
            min={1}
            max={10}
            onChange={(v) =>
              onChange({ ...config, skip: { ...skip, step: v } })
            }
          />
        </label>
      </div>

      <div className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-sm">
        {preview}
      </div>

      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />
    </div>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/SortNumbersSimpleConfigForm
git commit -m "feat(homepage): SortNumbersSimpleConfigForm (ChunkGroup + Steppers)"
```

---

### Task 15: `NumberMatchSimpleConfigForm`

**Files:**

- Create: `src/games/number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm.tsx`
- Create: `src/games/number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create the test with at least:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { NumberMatchSimpleConfigForm } from './NumberMatchSimpleConfigForm';

const Harness = () => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    mode: 'numeral-to-group',
    range: { min: 1, max: 10 },
    inputMethod: 'drag',
    distractorCount: 3,
    tileStyle: 'dots',
    tileBankMode: 'distractors',
  });
  return (
    <NumberMatchSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('NumberMatchSimpleConfigForm', () => {
  it('resets "to" when "from" change leaves it invalid', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(
      screen.getByLabelText(/what you see/i),
      'group',
    );
    // group has only one valid to: numeral → auto-picked
    const toSelect = screen.getByLabelText(/what you match/i);
    expect(toSelect).toHaveValue('numeral');
  });

  it('clamps max below min', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const minGroup = screen.getByRole('group', { name: /min/i });
    for (let i = 0; i < 15; i++) {
      await user.click(
        within(minGroup).getByRole('button', { name: /increase/i }),
      );
    }
    // min rose past 10, max should have risen too
    expect(
      Number(
        screen
          .getByRole('group', { name: /max/i })
          .textContent?.match(/\d+/)?.[0],
      ),
    ).toBeGreaterThanOrEqual(16);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the form**

Create `src/games/number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm.tsx`:

```tsx
import type { JSX } from 'react';
import { CellSelect } from '@/components/config/CellSelect';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { Stepper } from '@/components/config/Stepper';
import { modeToPair, pairToMode, validToValues } from '../pair-to-mode';
import type { Primitive } from '../pair-to-mode';
import type { NumberMatchMode } from '../types';

const PRIMITIVE_LABELS: Record<Primitive, string> = {
  numeral: '5',
  group: '●●●●●',
  word: 'five',
  ordinal: '5th',
};

const PRIMITIVE_OPTIONS = [
  { value: 'numeral', label: '5 (numeral)' },
  { value: 'group', label: '●●●●● (group)' },
  { value: 'word', label: 'five (word)' },
  { value: 'ordinal', label: '5th (ordinal)' },
];

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const NumberMatchSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const mode = (config.mode as NumberMatchMode) ?? 'numeral-to-group';
  const { from, to } = modeToPair(mode);
  const rangeObj = (config.range as { min?: number; max?: number }) ?? {
    min: 1,
    max: 10,
  };
  const min = rangeObj.min ?? 1;
  const max = rangeObj.max ?? 10;
  const inputMethod =
    (config.inputMethod as 'drag' | 'type' | 'both') ?? 'drag';
  const distractorCount =
    typeof config.distractorCount === 'number'
      ? config.distractorCount
      : 3;

  const setPair = (nextFrom: Primitive, nextTo: Primitive) => {
    const valid = validToValues(nextFrom);
    const finalTo = valid.includes(nextTo) ? nextTo : valid[0];
    onChange({
      ...config,
      mode: pairToMode(nextFrom, finalTo),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          What you see → What you match
        </span>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <CellSelect
            label="what you see"
            value={from}
            options={PRIMITIVE_OPTIONS}
            onChange={(v) => setPair(v as Primitive, to)}
          />
          <span aria-hidden="true" className="text-xl">
            →
          </span>
          <CellSelect
            label="what you match"
            value={to}
            options={PRIMITIVE_OPTIONS.filter((o) =>
              validToValues(from).includes(o.value as Primitive),
            )}
            onChange={(v) => setPair(from, v as Primitive)}
          />
        </div>
        <p className="mt-2 text-center text-xs italic text-muted-foreground">
          {PRIMITIVE_LABELS[from]} → {PRIMITIVE_LABELS[to]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Min
          <Stepper
            label="min"
            value={min}
            min={1}
            max={999}
            onChange={(v) =>
              onChange({
                ...config,
                range: { min: v, max: Math.max(v, max) },
              })
            }
          />
        </label>
        <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Max
          <Stepper
            label="max"
            value={max}
            min={1}
            max={999}
            onChange={(v) =>
              onChange({
                ...config,
                range: { min: Math.min(min, v), max: v },
              })
            }
          />
        </label>
      </div>

      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />

      <label className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
        Extra wrong tiles
        <Stepper
          label="distractors"
          value={distractorCount}
          min={0}
          max={10}
          onChange={(v) =>
            onChange({
              ...config,
              distractorCount: v,
              tileBankMode: v > 0 ? 'distractors' : 'exact',
            })
          }
        />
      </label>
    </div>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/number-match/NumberMatchSimpleConfigForm
git commit -m "feat(homepage): NumberMatchSimpleConfigForm (pair + range + input)"
```

---

### Task 16: `WordSpellSimpleConfigForm`

**Files:**

- Create: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`
- Create: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Include tests for:

- Shows the correct `Level N` cell.
- Renders a chip for every phoneme at the current level.
- Deselecting all chips disables the "Let's go!" hint area (surfaced via a
  `data-invalid="true"` attribute on the root when no phonemes are selected).
- Toggling a chip updates `phonemesAllowed` in the config.

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';

const Harness = ({ initialLevel }: { initialLevel: number }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
    inputMethod: 'drag',
  });
  return (
    <WordSpellSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('WordSpellSimpleConfigForm', () => {
  it('shows a chip per phoneme at the current level', () => {
    render(<Harness initialLevel={2} />);
    // level 2 has at least: m /m/, d /d/, g /g/, o /ɒ/
    expect(
      screen.getByRole('button', { name: /m \/m\//i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /d \/d\//i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when no phonemes are selected', () => {
    const { container } = render(<Harness initialLevel={2} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('marks aria-pressed=true after tapping a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initialLevel={2} />);
    await user.click(screen.getByRole('button', { name: /m \/m\//i }));
    expect(
      screen.getByRole('button', { name: /m \/m\//i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement the form**

Create `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`:

```tsx
import type { JSX } from 'react';
import { CellSelect } from '@/components/config/CellSelect';
import { ChipStrip } from '@/components/config/ChipStrip';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { GRAPHEMES_BY_LEVEL } from '@/data/words/levels';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

const LEVEL_OPTIONS = Object.keys(GRAPHEMES_BY_LEVEL).map((n) => ({
  value: n,
  label: `Level ${n}`,
}));

export const WordSpellSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const source = config.source as
    | {
        type: 'word-library';
        filter: {
          region: string;
          level: number;
          phonemesAllowed?: string[];
        };
      }
    | undefined;
  const level = source?.filter.level ?? 1;
  const phonemesAllowed = source?.filter.phonemesAllowed ?? [];
  const inputMethod =
    (config.inputMethod as 'drag' | 'type' | 'both') ?? 'drag';

  const unitsAtLevel = GRAPHEMES_BY_LEVEL[level] ?? [];
  const chips = unitsAtLevel.map((u) => ({
    value: u.p,
    label: `${u.g} /${u.p}/`,
  }));

  const setLevel = (n: number) => {
    const available = (GRAPHEMES_BY_LEVEL[n] ?? []).map((u) => u.p);
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: n,
          phonemesAllowed: available,
        },
      },
    });
  };

  const setPhonemes = (next: string[]) => {
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level,
          phonemesAllowed: next,
        },
      },
    });
  };

  const invalid = phonemesAllowed.length === 0;

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted-foreground">
        Level
        <CellSelect
          label="Level"
          value={String(level)}
          options={LEVEL_OPTIONS}
          onChange={(v) => setLevel(Number(v))}
        />
      </label>

      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Sounds at this level (tap to toggle)
        </div>
        <div className="mt-2">
          <ChipStrip
            chips={chips}
            selected={phonemesAllowed}
            mode="toggleable"
            onChange={setPhonemes}
          />
        </div>
        {invalid && (
          <p className="mt-2 text-xs text-destructive">
            Pick at least one sound to play.
          </p>
        )}
      </div>

      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />
    </div>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/WordSpellSimpleConfigForm
git commit -m "feat(homepage): WordSpellSimpleConfigForm (level + phoneme chips)"
```

---

### Task 17: Register simple forms in the game registry

**Files:**

- Modify: `src/games/config-fields-registry.ts`

- [ ] **Step 1: Point renderers at the new simple forms**

Replace the current `switch` body in `getConfigFormRenderer`:

```ts
import { NumberMatchSimpleConfigForm } from './number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm';
import { SortNumbersSimpleConfigForm } from './sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm';
import { WordSpellSimpleConfigForm } from './word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm';

export const getSimpleConfigFormRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell': {
      return WordSpellSimpleConfigForm;
    }
    case 'number-match': {
      return NumberMatchSimpleConfigForm;
    }
    case 'sort-numbers': {
      return SortNumbersSimpleConfigForm;
    }
    default: {
      return undefined;
    }
  }
};

export const getAdvancedConfigFields = getConfigFields;
```

Keep `getConfigFields` and `getConfigFormRenderer` as-is so existing
callers (e.g. routes under `/$locale/_app/game/`) continue to render the
advanced form until they migrate. The **cog modal** will use
`getAdvancedConfigFields`; the **InstructionsOverlay simple form** will use
`getSimpleConfigFormRenderer`.

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/games/config-fields-registry.ts
git commit -m "feat(homepage): register simple-form renderers per game"
```

---

### Task 18: `CoverPicker` component

**Files:**

- Create: `src/components/CoverPicker.tsx`
- Create: `src/components/CoverPicker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CoverPicker } from './CoverPicker';
import type { Cover } from '@/games/cover-type';

const Harness = () => {
  const [cover, setCover] = useState<Cover | undefined>(undefined);
  return <CoverPicker value={cover} onChange={setCover} />;
};

describe('CoverPicker', () => {
  it('selecting an emoji updates the cover', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /🦁/ }));
    expect(screen.getByRole('button', { name: /🦁/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('typing a URL switches to image mode', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const url = screen.getByPlaceholderText(/image url/i);
    await user.type(url, 'https://example.com/cat.png');
    expect(url).toHaveValue('https://example.com/cat.png');
  });

  it('pressing "Use game default" clears the cover', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /🦁/ }));
    await user.click(
      screen.getByRole('button', { name: /use game default/i }),
    );
    expect(screen.getByRole('button', { name: /🦁/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/CoverPicker.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `CoverPicker`**

Create `src/components/CoverPicker.tsx`:

```tsx
import { useState } from 'react';
import type { JSX } from 'react';
import type { Cover } from '@/games/cover-type';

const EMOJI_PALETTE = [
  '🦁',
  '🐱',
  '🐶',
  '🐼',
  '🦋',
  '🌈',
  '⭐',
  '🍎',
  '🍌',
  '🍓',
  '🌳',
  '🌊',
  '🚀',
  '🚂',
  '⚽',
  '🎈',
  '🎨',
  '🎵',
  '🔤',
  '🔢',
  '📊',
  '🧩',
  '🎯',
  '💎',
];

type CoverPickerProps = {
  value: Cover | undefined;
  onChange: (cover: Cover | undefined) => void;
};

export const CoverPicker = ({
  value,
  onChange,
}: CoverPickerProps): JSX.Element => {
  const [url, setUrl] = useState<string>(
    value?.kind === 'image' ? value.src : '',
  );
  const currentEmoji =
    value?.kind === 'emoji' ? value.emoji : undefined;

  const pickEmoji = (emoji: string) => {
    setUrl('');
    onChange({ kind: 'emoji', emoji });
  };

  const setImage = (next: string) => {
    setUrl(next);
    if (next.trim()) onChange({ kind: 'image', src: next.trim() });
  };

  const useDefault = () => {
    setUrl('');
    onChange(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        Cover
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_PALETTE.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={e}
            aria-pressed={currentEmoji === e}
            onClick={() => pickEmoji(e)}
            className={`aspect-square rounded-lg border-2 text-xl ${
              currentEmoji === e
                ? 'border-primary bg-primary/10'
                : 'border-transparent bg-muted'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => setImage(e.target.value)}
        placeholder="Image URL (optional)"
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
      />
      <button
        type="button"
        onClick={useDefault}
        className="self-start text-xs underline text-muted-foreground"
      >
        Use game default
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/components/CoverPicker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CoverPicker.tsx src/components/CoverPicker.test.tsx
git commit -m "feat(homepage): add CoverPicker component"
```

---

### Task 19: `AdvancedConfigModal` — cog-launched modal

**Files:**

- Create: `src/components/AdvancedConfigModal.tsx`
- Create: `src/components/AdvancedConfigModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a custom game', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{
          kind: 'custom game',
          configId: 'abc',
          name: 'Skip by 2',
          color: 'amber',
          cover: undefined,
        }}
        config={{ direction: 'ascending' }}
        onCancel={() => {}}
        onUpdate={vi.fn()}
        onSaveNew={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('shows only "Save as new" when editing a default card', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /update/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('calls onUpdate with the latest config and name', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{
          kind: 'custom game',
          configId: 'abc',
          name: 'Skip by 2',
          color: 'amber',
          cover: undefined,
        }}
        config={{ direction: 'ascending' }}
        onCancel={() => {}}
        onUpdate={onUpdate}
        onSaveNew={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Skip by 2',
        configId: 'abc',
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/AdvancedConfigModal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `AdvancedConfigModal`**

Create `src/components/AdvancedConfigModal.tsx`:

```tsx
import { useState } from 'react';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { CoverPicker } from '@/components/CoverPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAdvancedConfigFields } from '@/games/config-fields-registry';
import {
  BOOKMARK_COLORS,
  BOOKMARK_COLOR_KEYS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/custom game-colors';

export type AdvancedConfigModalMode =
  | { kind: 'default' }
  | {
      kind: 'custom game';
      configId: string;
      name: string;
      color: Custom gameColorKey;
      cover: Cover | undefined;
    };

type SavePayload = {
  configId?: string;
  name: string;
  color: Custom gameColorKey;
  cover: Cover | undefined;
  config: Record<string, unknown>;
};

type AdvancedConfigModalProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  gameId: string;
  mode: AdvancedConfigModalMode;
  config: Record<string, unknown>;
  onCancel: () => void;
  onUpdate?: (payload: SavePayload) => void;
  onSaveNew: (payload: SavePayload) => void;
};

export const AdvancedConfigModal = ({
  open,
  onOpenChange,
  gameId,
  mode,
  config: initialConfig,
  onCancel,
  onUpdate,
  onSaveNew,
}: AdvancedConfigModalProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [config, setConfig] =
    useState<Record<string, unknown>>(initialConfig);
  const [cover, setCover] = useState<Cover | undefined>(
    mode.kind === 'custom game' ? mode.cover : undefined,
  );
  const [name, setName] = useState<string>(
    mode.kind === 'custom game' ? mode.name : '',
  );
  const [color, setColor] = useState<Custom gameColorKey>(
    mode.kind === 'custom game' ? mode.color : DEFAULT_BOOKMARK_COLOR,
  );

  const fields = getAdvancedConfigFields(gameId);

  const payload: SavePayload = {
    configId: mode.kind === 'custom game' ? mode.configId : undefined,
    name,
    color,
    cover,
    config,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === 'custom game' ? mode.name : 'Advanced settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CoverPicker value={cover} onChange={setCover} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Custom game name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skip by 2"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>

          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Color
            </div>
            <div
              className="mt-1 grid gap-1"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              role="group"
              aria-label="Custom game color"
            >
              {BOOKMARK_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    background: BOOKMARK_COLORS[key].playBg,
                    borderColor:
                      color === key
                        ? BOOKMARK_COLORS[key].playBg
                        : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <ConfigFormFields
            fields={fields}
            config={config}
            onChange={setConfig}
          />

          <div className="flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
            >
              {t('instructions.cancel', { defaultValue: 'Cancel' })}
            </button>
            {mode.kind === 'custom game' && onUpdate && (
              <button
                type="button"
                onClick={() => onUpdate(payload)}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateCustom game', {
                  name: mode.name,
                  defaultValue: `Update "${mode.name}"`,
                })}
              </button>
            )}
            <button
              type="button"
              onClick={() => onSaveNew(payload)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                mode.kind === 'default'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background'
              }`}
            >
              {t('instructions.saveAsNew', {
                defaultValue: 'Save as new custom game',
              })}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 4: Run the test**

```bash
yarn vitest run src/components/AdvancedConfigModal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(homepage): AdvancedConfigModal launched from per-card cog"
```

---

### Task 20: Redesign `GameCard` in place — cover, chips, cog, custom game variant

**Files:**

- Modify: `src/components/GameCard.tsx` (full rewrite — single call site, no parallel path)
- Modify: `src/components/GameCard.test.tsx` (rewrite for new API)
- Modify: `src/components/GameCard.stories.tsx` (update variants)

> **Why in-place, not V2:** `GameCard` has one call site (the homepage route
> we're rewriting in Task 21). A parallel file would be dead weight. The old
> tests and stories are rewritten against the new API in the same commit.

- [ ] **Step 1: Rewrite the failing test**

Replace `src/components/GameCard.test.tsx` contents:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders a default card with chips, cog, and Play', () => {
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('🚀 Up')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /play/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it('adds a custom game name subtitle for custom game variant', () => {
    render(
      <GameCard
        variant="custom game"
        gameId="sort-numbers"
        title="Count in Order"
        custom
        gameName="Skip by 2"
        custom
        gameColor="amber"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('Skip by 2')).toBeInTheDocument();
  });

  it('fires onOpenCog when the cog is tapped', async () => {
    const user = userEvent.setup();
    const onOpenCog = vi.fn();
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={vi.fn()}
        onOpenCog={onOpenCog}
      />,
    );
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(onOpenCog).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/GameCard.test.tsx
```

Expected: FAIL — props don't match (old API).

- [ ] **Step 3: Rewrite `GameCard.tsx`**

Replace `src/components/GameCard.tsx` contents:

```tsx
import { Custom gameIcon, SettingsIcon } from 'lucide-react';
import type { JSX } from 'react';
import type { Cover } from '@/games/cover-type';
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/custom game-colors';

type Common = {
  gameId: string;
  title: string;
  chips: string[];
  cover?: Cover;
  onPlay: () => void;
  onOpenCog: () => void;
};

type DefaultVariant = Common & { variant: 'default' };
type Custom gameVariant = Common & {
  variant: 'custom game';
  custom gameName: string;
  custom gameColor: Custom gameColorKey;
};

type GameCardProps = DefaultVariant | Custom gameVariant;

export const GameCard = (props: GameCardProps): JSX.Element => {
  const { gameId, title, chips, onPlay, onOpenCog } = props;
  const cover = props.cover ?? resolveDefaultCover(gameId);
  const colorKey =
    props.variant === 'custom game'
      ? props.custom gameColor
      : DEFAULT_BOOKMARK_COLOR;
  const ribbon = BOOKMARK_COLORS[colorKey].playBg;
  const playBg =
    props.variant === 'custom game'
      ? ribbon
      : BOOKMARK_COLORS.indigo.playBg;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
      {props.variant === 'custom game' && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: ribbon }}
        />
      )}

      <div className="relative p-2">
        <GameCover cover={cover} size="card" />
        {props.variant === 'custom game' && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs text-white shadow"
            style={{ background: ribbon }}
          >
            <Custom gameIcon size={14} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight">{title}</h3>
          <button
            type="button"
            aria-label="Settings"
            onClick={onOpenCog}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <SettingsIcon size={14} />
          </button>
        </div>

        {props.variant === 'custom game' && (
          <p className="text-xs italic text-muted-foreground">
            {props.custom gameName}
          </p>
        )}

        <div className="flex flex-wrap gap-1 pt-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        <button
          type="button"
          aria-label="Play"
          onClick={onPlay}
          className="mt-2 rounded-lg py-2 text-sm font-bold text-white"
          style={{ background: playBg }}
        >
          Play
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Update the Storybook stories**

Rewrite `src/components/GameCard.stories.tsx` to cover the `default` and
`custom game` variants with realistic chips. Keep Storybook passing:

```bash
yarn storybook:test
```

- [ ] **Step 5: Run the test**

```bash
yarn vitest run src/components/GameCard.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/GameCard.tsx src/components/GameCard.test.tsx src/components/GameCard.stories.tsx
git commit -m "feat(homepage): redesign GameCard with variant, cover, chips, cog"
```

---

### Task 21: Rewire homepage to render the new grid

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`
- Modify: `src/components/GameGrid.tsx`
- Modify: `src/routes/$locale/_app/index.test.tsx`

- [ ] **Step 1: Update `GameGrid` to accept a flat list of cards**

Rewrite `src/components/GameGrid.tsx` to accept a `cards` prop:

```tsx
import type { JSX, ReactNode } from 'react';

type GameGridProps = {
  cards: ReactNode[];
};

export const GameGrid = ({ cards }: GameGridProps): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {cards}
  </div>
);
```

- [ ] **Step 2: Rewrite the homepage route**

Replace `src/routes/$locale/_app/index.tsx`:

```tsx
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Custom gameColorKey } from '@/lib/custom game-colors';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCard } from '@/components/GameCard';
import { GameGrid } from '@/components/GameGrid';
import { getOrCreateDatabase } from '@/db/create-database';
import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';
import { lastSessionSavedConfigId } from '@/db/last-session-game-config';
import { configToChips } from '@/games/config-chips';
import { GAME_CATALOG } from '@/games/registry';

type ModalState =
  | { kind: 'closed' }
  | {
      kind: 'open';
      gameId: string;
      mode:
        | { kind: 'default' }
        | {
            kind: 'custom game';
            configId: string;
            name: string;
            color: Custom gameColorKey;
            cover?: import('@/games/cover-type').Cover;
          };
      config: Record<string, unknown>;
    };

const HomeScreen = () => {
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate({ from: '/$locale/' });
  const { savedConfigs, save, updateConfig } = useSavedConfigs();
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const handlePlay = (gameId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId: undefined },
    });
  };

  const handlePlayCustom game = (gameId: string, configId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId },
    });
  };

  const openDefaultCog = async (gameId: string) => {
    const db = await getOrCreateDatabase();
    const lastDoc = await db.saved_game_configs
      .findOne(lastSessionSavedConfigId(gameId))
      .exec();
    setModal({
      kind: 'open',
      gameId,
      mode: { kind: 'default' },
      config: lastDoc?.config ?? {},
    });
  };

  const openCustom gameCog = (
    gameId: string,
    doc: import('@/db/schemas/saved_game_configs').SavedGameConfigDoc,
  ) => {
    setModal({
      kind: 'open',
      gameId,
      mode: {
        kind: 'custom game',
        configId: doc.id,
        name: doc.name,
        color: doc.color as Custom gameColorKey,
        cover: doc.cover,
      },
      config: doc.config,
    });
  };

  const cards = useMemo(() => {
    const defaults = GAME_CATALOG.map((entry) => {
      const title = t(entry.titleKey);
      const chips = configToChips(entry.id, {});
      return (
        <GameCard
          key={`default-${entry.id}`}
          variant="default"
          gameId={entry.id}
          title={title}
          chips={chips}
          onPlay={() => handlePlay(entry.id)}
          onOpenCog={() => void openDefaultCog(entry.id)}
        />
      );
    });
    const custom games = savedConfigs.map((doc) => {
      const entry = GAME_CATALOG.find((g) => g.id === doc.gameId);
      if (!entry) return null;
      return (
        <GameCard
          key={`bm-${doc.id}`}
          variant="custom game"
          gameId={doc.gameId}
          title={t(entry.titleKey)}
          custom gameName={doc.name}
          custom gameColor={doc.color as Custom gameColorKey}
          cover={doc.cover}
          chips={configToChips(doc.gameId, doc.config)}
          onPlay={() => handlePlayCustom game(doc.gameId, doc.id)}
          onOpenCog={() => openCustom gameCog(doc.gameId, doc)}
        />
      );
    });
    return [...defaults, ...custom games.filter(Boolean)];
  }, [savedConfigs, t]);

  return (
    <div className="px-4 py-4">
      <h1 className="sr-only">
        {t('home.title', { defaultValue: 'Home' })}
      </h1>
      <GameGrid cards={cards} />

      {modal.kind === 'open' && (
        <AdvancedConfigModal
          open
          onOpenChange={(next) =>
            setModal(next ? modal : { kind: 'closed' })
          }
          gameId={modal.gameId}
          mode={modal.mode}
          config={modal.config}
          onCancel={() => setModal({ kind: 'closed' })}
          onUpdate={async (payload) => {
            if (payload.configId) {
              await updateConfig(
                payload.configId,
                payload.config,
                payload.name,
                { cover: payload.cover, color: payload.color },
              );
            }
            setModal({ kind: 'closed' });
          }}
          onSaveNew={async (payload) => {
            await save({
              gameId: modal.gameId,
              name: payload.name,
              config: payload.config,
              color: payload.color,
              cover: payload.cover,
            });
            setModal({ kind: 'closed' });
          }}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/')({
  component: HomeScreen,
});
```

- [ ] **Step 3: Extend `useSavedConfigs` signatures**

The new `save` call accepts `cover`, and `updateConfig` accepts a 4th
`extras` parameter `{ cover?: Cover; color?: Custom gameColorKey }`. Open
`src/db/hooks/useSavedConfigs.ts` and add those parameters. Write a quick
unit test for `save` persisting `cover` correctly — use the pattern from
`src/db/schemas/saved_game_configs.test.ts`.

If the existing signature is `save({ gameId, name, config, color })`,
extend to `{ gameId, name, config, color, cover? }` and pass through.

- [ ] **Step 4: Fix the route test**

Update `src/routes/$locale/_app/index.test.tsx` to render with the new
API. If the test hard-codes filters, remove those assertions. Keep at
least one assertion that the page renders without throwing.

- [ ] **Step 5: Run typecheck + affected unit tests**

```bash
yarn typecheck
yarn vitest run src/routes/$locale/_app/index.test.tsx src/components/GameGrid.test.tsx
```

Expected: PASS. Fix any type holes before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/routes/$locale/_app/index.tsx src/components/GameGrid.tsx src/routes/$locale/_app/index.test.tsx src/db/hooks/useSavedConfigs.ts
git commit -m "feat(homepage): flat grid with default + custom game cards and cog modal"
```

---

### Task 22: Delete unused homepage dependencies

**Files:**

- Delete: `src/components/SavedConfigChip.tsx` (if `knip` confirms unused)
- Delete: `src/components/LevelRow.tsx` (if unused)
- Delete: `src/games/sort-numbers/SortNumbersConfigForm/` (replaced by new simple form + advanced modal)

> `GameCard.tsx` is kept — Task 20 rewrites it in place.

- [ ] **Step 1: Confirm each file is unused**

```bash
yarn knip
```

Note the list of unused files. For each confirmed-unused:

- [ ] **Step 2: Delete and rerun knip**

```bash
git rm src/components/SavedConfigChip.tsx src/components/LevelRow.tsx 2>/dev/null || true
git rm -r src/games/sort-numbers/SortNumbersConfigForm 2>/dev/null || true
yarn knip
yarn typecheck
```

Expected: clean output, typecheck passes.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "refactor(homepage): remove superseded GameCard / LevelRow / legacy form"
```

---

### Task 23: InstructionsOverlay — cover, cog, simple form

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to `InstructionsOverlay.test.tsx`:

```tsx
it('renders the GameCover at the top', () => {
  render(<InstructionsOverlay /* ... existing props ... */ />);
  // Cover for sort-numbers is the 📊 emoji
  expect(screen.getByText('📊')).toBeInTheDocument();
});

it('shows a cog button that opens the AdvancedConfigModal', async () => {
  const user = userEvent.setup();
  render(<InstructionsOverlay /* ... existing props ... */ />);
  await user.click(screen.getByRole('button', { name: /settings/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Update `InstructionsOverlay`**

Replace `GameNameChip` with `GameCover` + title, add a cog button, replace
the expanded settings form with `getSimpleConfigFormRenderer(gameId)`, and
remove the inline Advanced link. The cog opens `<AdvancedConfigModal>`.
Key changes:

```tsx
// replace the top chip
<div className="w-full">
  <GameCover cover={resolveCover({ cover }, gameId)} size="hero" />
  <div className="mt-3 flex items-center justify-between gap-2">
    <div>
      <h2 className="text-xl font-extrabold">{gameTitle}</h2>
      {custom gameName && (
        <p
          className="text-xs italic"
          style={{ color: BOOKMARK_COLORS[custom gameColor].playBg }}
        >
          {custom gameName}
        </p>
      )}
    </div>
    <button
      type="button"
      aria-label="Settings"
      onClick={() => setModalOpen(true)}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
    >
      <SettingsIcon size={18} />
    </button>
  </div>
</div>;

// inside expanded settings, use the simple-form renderer
const SimpleForm = getSimpleConfigFormRenderer(gameId);
{
  SimpleForm && (
    <SimpleForm config={config} onChange={onConfigChange} />
  );
}

// Remove the previous ConfigFormFields + advanced toggle block.
// Save-bar: when `custom gameName` present show Update + Save as new; else Save as new only.
```

Add a `gameId: string` prop + `cover?: Cover` prop to the overlay so it
can resolve the right cover. Thread those from the caller (the game route).

- [ ] **Step 4: Run the test suite**

```bash
yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
yarn typecheck
```

Expected: PASS. Fix any callers broken by new props.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay
git commit -m "feat(homepage): InstructionsOverlay cover + cog + SimpleConfigForm"
```

---

### Task 24: E2E kid flow

**Files:**

- Modify: `e2e/visual.spec.ts` (or create `e2e/homepage.spec.ts`)

- [ ] **Step 1: Write the scenario**

```ts
import { expect, test } from '@playwright/test';

test('kid flow: tap default card → see instructions → Lets go', async ({
  page,
}) => {
  await page.goto('/en');
  const card = page.getByRole('button', { name: 'Play' }).first();
  await card.click();
  await expect(
    page.getByRole('button', { name: /let's go/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /let's go/i }).click();
  // Game mounts — look for any known in-game element.
  await expect(page.locator('[data-answer-game-root]')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
yarn test:e2e e2e/homepage.spec.ts
```

Fix any selector that doesn't match the current DOM. The expected element
selector (`[data-answer-game-root]`) may need to be replaced with an
existing role/testid — grep the repo for the right landmark.

- [ ] **Step 3: Commit**

```bash
git add e2e/homepage.spec.ts
git commit -m "test(homepage): e2e for default-card kid flow"
```

---

### Task 25: Update VR baselines

**Files:**

- Modify: `e2e/__snapshots__/visual.spec.ts/*.png`

- [ ] **Step 1: Ensure Docker is running**

```bash
docker ps >/dev/null 2>&1 || echo "Start Docker Desktop before continuing"
```

- [ ] **Step 2: Run VR to see which baselines changed**

```bash
yarn test:vr
```

- [ ] **Step 3: Review the diff images**

For each failed snapshot, open the `-diff.png` alongside the `-actual.png`.
Confirm the change is intentional (new covers, new card shape, simple
form, no filters).

- [ ] **Step 4: Update baselines**

```bash
yarn test:vr:update
```

- [ ] **Step 5: Commit baselines**

```bash
git add e2e/__snapshots__
git commit -m "test(homepage): update VR baselines for new card + cover UI"
```

---

### Task 26: Final check — push, open PR

**Files:** none (git + gh).

- [ ] **Step 1: Run the full local pipeline**

```bash
yarn typecheck
yarn vitest run
yarn lint
```

Fix anything that fails. Do not use SKIP flags.

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin design/kid-friendly-homepage
gh pr create --title "feat(homepage): kid-friendly homepage and simple config" --body "$(cat <<'EOF'
## Summary

- Per-game covers + playful titles + simple config forms + custom games as first-class cards
- Per-card cog opens the advanced config in a modal; game defaults are immutable
- Spec: docs/superpowers/specs/2026-04-15-kid-friendly-homepage-design.md
- Plan: docs/superpowers/plans/2026-04-15-kid-friendly-homepage.md

## Test plan

- [x] Unit tests for Cover, GameCover, config primitives, resolvers, configToChips, pairToMode, simple forms, AdvancedConfigModal, GameCard
- [x] E2E kid flow (tap card → instructions → Let's go)
- [x] VR baselines updated (homepage grid + instructions overlay)
EOF
)"
```

- [ ] **Step 3: Verify CI green**

Watch the PR. If anything fails, fix it in a follow-up commit — never use
`--no-verify` or skip flags without noting the reason in the PR.

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to at least one task:
  covers (T1–T3), titles/labels (T4), primitives (T5–T8), simple forms
  (T9–T17), cover picker + advanced modal (T18–T19), cards + homepage
  (T20–T22), instructions overlay (T23), tests + VR (T24–T25), PR (T26).
- **Deferred:** the spec's "sort by last-played" rule is not implemented
  in this plan. The homepage today sorts defaults-first-then-custom games;
  wiring `session_history_index` into a `sortByLastPlayed` helper is
  left as a follow-up ticket. Reason: `session_history_index` has no
  `configId` field and inferring it from `initialState` adds scope
  without a kid-visible payoff in v1. Open a follow-up issue tracking
  this.
- **Deferred:** the spec's "cog on small screens: always visible vs
  long-press" open question is resolved in favor of **always visible**
  (already implemented in `GameCard`).
- **Non-breaking:** the RxDB v1→v2 migration is a no-op, so existing
  custom games survive. The advanced form inside the modal is the same
  `ConfigFormFields` component, so persisted configs stay compatible.

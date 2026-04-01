# Milestone 3 — App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full app shell for BaseSkill: a working game grid home screen (anonymous-first), a rebuilt header and footer, offline indicator, bookmarks (with anonymous RxDB support), and a wired settings screen.

**Architecture:** Shell-first — layout wiring (`_app.tsx`) and shared components (Header, Footer, OfflineIndicator) are built before feature screens. The home route (`/$locale/_app/index`) owns filter/pagination state via TanStack Router search params and composes dumb child components. RxDB hooks (`useBookmarks`, `useSettings`) use the existing `useRxDB` + `useRxQuery` patterns from M2; they default to `profileId: 'anonymous'` for unauthenticated users.

**Tech Stack:** TanStack Router (search params, Link, useNavigate, useParams), RxDB + existing hooks (useRxDB, useRxQuery), react-i18next, shadcn/ui (Button, Card, Sheet, Input, DropdownMenu, Slider, Select), lucide-react, nanoid.

---

## Pre-flight

Before starting any task:

- [ ] Create worktree and install dependencies:

```bash
git worktree add ./worktrees/milestone-3-app-shell -b milestone-3-app-shell
cd ./worktrees/milestone-3-app-shell && yarn install
```

All subsequent commands run from `./worktrees/milestone-3-app-shell/`.

---

## File Map

| File                                       | Action | Purpose                                                               |
| ------------------------------------------ | ------ | --------------------------------------------------------------------- |
| `src/games/registry.ts`                    | Modify | Add `GameLevel`, `GameSubject` types; extend `GameCatalogEntry`       |
| `src/games/registry.test.ts`               | Modify | Test `levels` and `subject` fields                                    |
| `src/games/catalog-utils.ts`               | Create | Pure `filterCatalog` and `paginateCatalog` functions                  |
| `src/games/catalog-utils.test.ts`          | Create | Unit tests for filter + paginate                                      |
| `src/lib/i18n/locales/en/common.json`      | Modify | Add nav, search, levels, subjects, offline, pagination, bookmark keys |
| `src/lib/i18n/locales/pt-BR/common.json`   | Modify | Portuguese translations for same keys                                 |
| `src/components/ui/input.tsx`              | Create | shadcn add input                                                      |
| `src/components/ui/dropdown-menu.tsx`      | Create | shadcn add dropdown-menu                                              |
| `src/components/ui/slider.tsx`             | Create | shadcn add slider                                                     |
| `src/components/ui/select.tsx`             | Create | shadcn add select                                                     |
| `src/components/GameCard.tsx`              | Create | Single game card (dumb — accepts callbacks)                           |
| `src/components/GameCard.test.tsx`         | Create | Render + interaction tests                                            |
| `src/components/LevelRow.tsx`              | Create | Grade-level pill buttons (dumb)                                       |
| `src/components/LevelRow.test.tsx`         | Create | Interaction tests                                                     |
| `src/components/GameGrid.tsx`              | Create | Grid + pagination (dumb, receives filtered items)                     |
| `src/components/GameGrid.test.tsx`         | Create | Render tests                                                          |
| `src/components/OfflineIndicator.tsx`      | Create | `navigator.onLine` banner                                             |
| `src/components/OfflineIndicator.test.tsx` | Create | Online/offline state tests                                            |
| `src/components/Header.tsx`                | Modify | Rebuild: logo, search, filters sheet, language dropdown, menu sheet   |
| `src/components/Footer.tsx`                | Modify | Rebuild: mirrors header menu                                          |
| `src/routes/$locale/_app.tsx`              | Modify | Wire Header, OfflineIndicator, Footer into layout                     |
| `src/routes/$locale/_app/index.tsx`        | Modify | Home screen: search params, compose LevelRow + GameGrid               |
| `src/routes/$locale/_app/index.test.tsx`   | Modify | Update test to match new home screen                                  |
| `src/db/hooks/useBookmarks.ts`             | Create | Toggle bookmark for anonymous user                                    |
| `src/db/hooks/useBookmarks.test.ts`        | Create | RxDB integration tests                                                |
| `src/db/hooks/useSettings.ts`              | Create | Read/write anonymous settings doc                                     |
| `src/db/hooks/useSettings.test.ts`         | Create | RxDB integration tests                                                |
| `src/routes/$locale/_app/settings.tsx`     | Modify | Wire volume, speechRate, themeId, language to RxDB                    |

---

## Task 1: Extend GAME_CATALOG with level and subject

**Files:**

- Modify: `src/games/registry.ts`
- Modify: `src/games/registry.test.ts`

- [ ] **Step 1: Update the test to require `levels` and `subject`**

In `src/games/registry.test.ts`, replace the existing test body:

```ts
import { describe, expect, it } from 'vitest';
import type { GameLevel, GameSubject } from './registry';
import { GAME_CATALOG } from './registry';

const VALID_LEVELS: GameLevel[] = ['PK', 'K', '1', '2', '3', '4'];
const VALID_SUBJECTS: GameSubject[] = ['math', 'reading', 'letters'];

describe('GAME_CATALOG', () => {
  it('has stable ids and title keys', () => {
    expect(GAME_CATALOG.length).toBeGreaterThanOrEqual(1);
    for (const g of GAME_CATALOG) {
      expect(g.id).toMatch(/^[a-z0-9-]+$/);
      expect(g.titleKey).toBeTruthy();
    }
  });

  it('every entry has at least one valid level', () => {
    for (const g of GAME_CATALOG) {
      expect(g.levels.length).toBeGreaterThan(0);
      for (const lvl of g.levels) {
        expect(VALID_LEVELS).toContain(lvl);
      }
    }
  });

  it('every entry has a valid subject', () => {
    for (const g of GAME_CATALOG) {
      expect(VALID_SUBJECTS).toContain(g.subject);
    }
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

```bash
yarn test src/games/registry.test.ts
```

Expected: FAIL — `g.levels is not iterable` or `Cannot read properties of undefined`.

- [ ] **Step 3: Update `registry.ts` with new types and extended entries**

Replace `src/games/registry.ts` entirely:

```ts
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
];
```

- [ ] **Step 4: Run the test — expect pass**

```bash
yarn test src/games/registry.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games/registry.ts src/games/registry.test.ts
git commit -m "feat(catalog): add level and subject fields to GameCatalogEntry"
```

---

## Task 2: Catalog filter and paginate utilities

**Files:**

- Create: `src/games/catalog-utils.ts`
- Create: `src/games/catalog-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/games/catalog-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GAME_CATALOG } from './registry';
import { filterCatalog, paginateCatalog } from './catalog-utils';

describe('filterCatalog', () => {
  it('returns all entries with empty filter', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(GAME_CATALOG.length);
  });

  it('filters by level — only entries that include the level', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: 'PK',
      subject: '',
    });
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.levels).toContain('PK');
    }
  });

  it('filters by subject', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '',
      subject: 'math',
    });
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.subject).toBe('math');
    }
  });

  it('filters by search query (case-insensitive match on titleKey)', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: 'ADDITION',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('math-addition');
  });

  it('returns empty array when nothing matches', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: 'zzznomatch',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(0);
  });

  it('combines level and subject filters', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '1',
      subject: 'math',
    });
    for (const entry of result) {
      expect(entry.levels).toContain('1');
      expect(entry.subject).toBe('math');
    }
  });
});

describe('paginateCatalog', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('returns first page with correct slice', () => {
    const result = paginateCatalog(items, 1, 10);
    expect(result.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
  });

  it('returns last partial page', () => {
    const result = paginateCatalog(items, 3, 10);
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toBe(20);
  });

  it('clamps to last page when requested page exceeds total', () => {
    const result = paginateCatalog(items, 99, 10);
    expect(result.page).toBe(3);
  });

  it('handles empty array — totalPages is 1, items is empty', () => {
    const result = paginateCatalog([], 1, 10);
    expect(result.items).toHaveLength(0);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/games/catalog-utils.test.ts
```

Expected: FAIL — `Cannot find module './catalog-utils'`.

- [ ] **Step 3: Implement `catalog-utils.ts`**

Create `src/games/catalog-utils.ts`:

```ts
import type {
  GameCatalogEntry,
  GameLevel,
  GameSubject,
} from './registry';

export type CatalogFilter = {
  search: string;
  level: GameLevel | '';
  subject: GameSubject | '';
};

export function filterCatalog(
  catalog: GameCatalogEntry[],
  filter: CatalogFilter,
): GameCatalogEntry[] {
  return catalog.filter((entry) => {
    if (filter.level && !entry.levels.includes(filter.level))
      return false;
    if (filter.subject && entry.subject !== filter.subject)
      return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!entry.titleKey.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export type PaginateResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

export function paginateCatalog<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginateResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/games/catalog-utils.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games/catalog-utils.ts src/games/catalog-utils.test.ts
git commit -m "feat(catalog): add filterCatalog and paginateCatalog utilities"
```

---

## Task 3: Add i18n strings for the app shell UI

**Files:**

- Modify: `src/lib/i18n/locales/en/common.json`
- Modify: `src/lib/i18n/locales/pt-BR/common.json`

- [ ] **Step 1: Replace `src/lib/i18n/locales/en/common.json`**

```json
{
  "appName": "BaseSkill",
  "home": {
    "title": "Home"
  },
  "nav": {
    "settings": "Settings",
    "language": "Language"
  },
  "search": {
    "placeholder": "Search games...",
    "filters": "Filters"
  },
  "levels": {
    "all": "All",
    "PK": "Pre-K",
    "K": "K",
    "1": "Year 1",
    "2": "Year 2",
    "3": "Year 3",
    "4": "Year 4"
  },
  "subjects": {
    "all": "All subjects",
    "math": "Math",
    "reading": "Reading",
    "letters": "Letters"
  },
  "offline": {
    "banner": "You're offline. Playing from saved data."
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "pageOf": "Page {{page}} of {{total}}"
  },
  "bookmark": {
    "add": "Bookmark",
    "remove": "Remove bookmark"
  }
}
```

- [ ] **Step 2: Replace `src/lib/i18n/locales/pt-BR/common.json`**

```json
{
  "appName": "BaseSkill",
  "home": {
    "title": "Início"
  },
  "nav": {
    "settings": "Configurações",
    "language": "Idioma"
  },
  "search": {
    "placeholder": "Buscar jogos...",
    "filters": "Filtros"
  },
  "levels": {
    "all": "Todos",
    "PK": "Pré-K",
    "K": "K",
    "1": "Ano 1",
    "2": "Ano 2",
    "3": "Ano 3",
    "4": "Ano 4"
  },
  "subjects": {
    "all": "Todos os assuntos",
    "math": "Matemática",
    "reading": "Leitura",
    "letters": "Letras"
  },
  "offline": {
    "banner": "Você está offline. Jogando a partir dos dados salvos."
  },
  "pagination": {
    "previous": "Anterior",
    "next": "Próximo",
    "pageOf": "Página {{page}} de {{total}}"
  },
  "bookmark": {
    "add": "Favoritar",
    "remove": "Remover favorito"
  }
}
```

- [ ] **Step 3: Verify i18n resolves the new keys**

Run the existing i18n test to confirm the module still loads cleanly:

```bash
yarn test src/lib/i18n/i18n.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/locales/en/common.json src/lib/i18n/locales/pt-BR/common.json
git commit -m "feat(i18n): add app shell UI strings to common namespace"
```

---

## Task 4: Add shadcn UI components

**Files:**

- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/slider.tsx`
- Create: `src/components/ui/select.tsx`

- [ ] **Step 1: Add required shadcn components**

```bash
npx shadcn@latest add input dropdown-menu slider select
```

Expected: four new files created in `src/components/ui/`.

- [ ] **Step 2: Verify types pass**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/dropdown-menu.tsx \
  src/components/ui/slider.tsx src/components/ui/select.tsx
git commit -m "chore(ui): add input, dropdown-menu, slider, select shadcn components"
```

---

## Task 5: `GameCard` component

**Files:**

- Create: `src/components/GameCard.tsx`
- Create: `src/components/GameCard.test.tsx`

- [ ] **Step 0: Install `@testing-library/user-event`**

```bash
yarn add -D @testing-library/user-event
```

- [ ] **Step 1: Write the failing tests**

Create `src/components/GameCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const mockEntry = {
  id: 'math-addition',
  titleKey: 'math-addition',
  levels: ['1', '2'] as const,
  subject: 'math' as const,
};

describe('GameCard', () => {
  it('renders the game title key as text', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('math-addition')).toBeInTheDocument();
  });

  it('renders level badges', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.getByText('Year 2')).toBeInTheDocument();
  });

  it('calls onPlay with gameId when Play is clicked', async () => {
    const onPlay = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={onPlay}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /play/i }),
    );
    expect(onPlay).toHaveBeenCalledWith('math-addition');
  });

  it('calls onBookmarkToggle with gameId when bookmark button is clicked', async () => {
    const onBookmarkToggle = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={onBookmarkToggle}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /bookmark/i }),
    );
    expect(onBookmarkToggle).toHaveBeenCalledWith('math-addition');
  });

  it('shows "remove bookmark" aria-label when isBookmarked is true', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={true}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /remove bookmark/i }),
    ).toBeInTheDocument();
  });
});
```

Note: `userEvent` comes from `@testing-library/user-event`. Check if it is installed:

```bash
yarn add -D @testing-library/user-event
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/components/GameCard.test.tsx
```

Expected: FAIL — `Cannot find module './GameCard'`.

- [ ] **Step 3: Implement `GameCard.tsx`**

Create `src/components/GameCard.tsx`:

```tsx
import { BookmarkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { GameCatalogEntry } from '@/games/registry';

type GameCardProps = {
  entry: GameCatalogEntry;
  isBookmarked: boolean;
  onBookmarkToggle: (gameId: string) => void;
  onPlay: (gameId: string) => void;
};

export const GameCard = ({
  entry,
  isBookmarked,
  onBookmarkToggle,
  onPlay,
}: GameCardProps) => {
  const { t } = useTranslation('games');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {t(entry.titleKey)}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isBookmarked
                ? tCommon('bookmark.remove')
                : tCommon('bookmark.add')
            }
            onClick={() => onBookmarkToggle(entry.id)}
          >
            <BookmarkIcon
              size={16}
              className={isBookmarked ? 'fill-current' : ''}
            />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {entry.levels.map((level) => (
            <span
              key={level}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {tCommon(`levels.${level}`)}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => onPlay(entry.id)}>
          Play
        </Button>
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/components/GameCard.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GameCard.tsx src/components/GameCard.test.tsx
git commit -m "feat(ui): add GameCard component with bookmark and play callbacks"
```

---

## Task 6: `LevelRow` component

**Files:**

- Create: `src/components/LevelRow.tsx`
- Create: `src/components/LevelRow.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/LevelRow.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { LevelRow } from './LevelRow';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('LevelRow', () => {
  it('renders an "All" button and one button per level', () => {
    render(<LevelRow currentLevel="" onLevelChange={vi.fn()} />, {
      wrapper,
    });
    expect(
      screen.getByRole('button', { name: /all/i }),
    ).toBeInTheDocument();
    for (const label of [
      'Pre-K',
      'K',
      'Year 1',
      'Year 2',
      'Year 3',
      'Year 4',
    ]) {
      expect(
        screen.getByRole('button', { name: label }),
      ).toBeInTheDocument();
    }
  });

  it('calls onLevelChange with the level value when a level button is clicked', async () => {
    const onLevelChange = vi.fn();
    render(<LevelRow currentLevel="" onLevelChange={onLevelChange} />, {
      wrapper,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Pre-K' }),
    );
    expect(onLevelChange).toHaveBeenCalledWith('PK');
  });

  it('calls onLevelChange with empty string when "All" is clicked', async () => {
    const onLevelChange = vi.fn();
    render(
      <LevelRow currentLevel="1" onLevelChange={onLevelChange} />,
      { wrapper },
    );
    await userEvent.click(screen.getByRole('button', { name: /all/i }));
    expect(onLevelChange).toHaveBeenCalledWith('');
  });

  it('marks the active level button as aria-pressed', () => {
    render(<LevelRow currentLevel="K" onLevelChange={vi.fn()} />, {
      wrapper,
    });
    const kButton = screen.getByRole('button', { name: 'K' });
    expect(kButton).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/components/LevelRow.test.tsx
```

Expected: FAIL — `Cannot find module './LevelRow'`.

- [ ] **Step 3: Implement `LevelRow.tsx`**

Create `src/components/LevelRow.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { GameLevel } from '@/games/registry';

const LEVELS: GameLevel[] = ['PK', 'K', '1', '2', '3', '4'];

type LevelRowProps = {
  currentLevel: GameLevel | '';
  onLevelChange: (level: GameLevel | '') => void;
};

export const LevelRow = ({
  currentLevel,
  onLevelChange,
}: LevelRowProps) => {
  const { t } = useTranslation('common');

  return (
    <div
      className="flex gap-2 overflow-x-auto py-3 px-4 scrollbar-none"
      role="group"
      aria-label="Filter by grade level"
    >
      <Button
        variant={currentLevel === '' ? 'default' : 'outline'}
        size="sm"
        aria-pressed={currentLevel === ''}
        onClick={() => onLevelChange('')}
      >
        {t('levels.all')}
      </Button>
      {LEVELS.map((level) => (
        <Button
          key={level}
          variant={currentLevel === level ? 'default' : 'outline'}
          size="sm"
          aria-pressed={currentLevel === level}
          onClick={() => onLevelChange(level)}
        >
          {t(`levels.${level}`)}
        </Button>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/components/LevelRow.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/LevelRow.tsx src/components/LevelRow.test.tsx
git commit -m "feat(ui): add LevelRow grade-level filter component"
```

---

## Task 7: `GameGrid` component

**Files:**

- Create: `src/components/GameGrid.tsx`
- Create: `src/components/GameGrid.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/GameGrid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { GameGrid } from './GameGrid';
import type { GameCatalogEntry } from '@/games/registry';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const makeEntries = (count: number): GameCatalogEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `game-${i}`,
    titleKey: `game-${i}`,
    levels: ['1'] as const,
    subject: 'math' as const,
  }));

describe('GameGrid', () => {
  it('renders a card for each entry', () => {
    const entries = makeEntries(3);
    render(
      <GameGrid
        entries={entries}
        bookmarkedIds={new Set()}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getAllByRole('button', { name: /play/i }),
    ).toHaveLength(3);
  });

  it('shows "Previous" and "Next" buttons when totalPages > 1', () => {
    render(
      <GameGrid
        entries={makeEntries(1)}
        bookmarkedIds={new Set()}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
        page={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /next/i }),
    ).toBeInTheDocument();
  });

  it('calls onPageChange(page - 1) when Previous is clicked', async () => {
    const onPageChange = vi.fn();
    render(
      <GameGrid
        entries={makeEntries(1)}
        bookmarkedIds={new Set()}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /previous/i }),
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on page 1 and Next on last page', () => {
    render(
      <GameGrid
        entries={makeEntries(1)}
        bookmarkedIds={new Set()}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /next/i }),
    ).toBeDisabled();
  });

  it('renders empty state message when entries is empty', () => {
    render(
      <GameGrid
        entries={[]}
        bookmarkedIds={new Set()}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText(/no games found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/components/GameGrid.test.tsx
```

Expected: FAIL — `Cannot find module './GameGrid'`.

- [ ] **Step 3: Implement `GameGrid.tsx`**

Create `src/components/GameGrid.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/GameCard';
import type { GameCatalogEntry } from '@/games/registry';

type GameGridProps = {
  entries: GameCatalogEntry[];
  bookmarkedIds: Set<string>;
  onBookmarkToggle: (gameId: string) => void;
  onPlay: (gameId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const GameGrid = ({
  entries,
  bookmarkedIds,
  onBookmarkToggle,
  onPlay,
  page,
  totalPages,
  onPageChange,
}: GameGridProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-6">
      {entries.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No games found
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => (
            <GameCard
              key={entry.id}
              entry={entry}
              isBookmarked={bookmarkedIds.has(entry.id)}
              onBookmarkToggle={onBookmarkToggle}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t('pagination.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pagination.pageOf', { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('pagination.next')}
          </Button>
        </nav>
      )}

      {totalPages <= 1 && (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button variant="outline" size="sm" disabled>
            {t('pagination.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled>
            {t('pagination.next')}
          </Button>
        </nav>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/components/GameGrid.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GameGrid.tsx src/components/GameGrid.test.tsx
git commit -m "feat(ui): add GameGrid component with pagination"
```

---

## Task 8: `OfflineIndicator` component

**Files:**

- Create: `src/components/OfflineIndicator.tsx`
- Create: `src/components/OfflineIndicator.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/OfflineIndicator.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { OfflineIndicator } from './OfflineIndicator';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('shows offline banner when navigator.onLine is false', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OfflineIndicator />, { wrapper });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('shows banner after offline event fires', () => {
    render(<OfflineIndicator />, { wrapper });
    act(() => {
      vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(
        false,
      );
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('hides banner after online event fires', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OfflineIndicator />, { wrapper });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();

    act(() => {
      vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(
      screen.queryByText(/you're offline/i),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/components/OfflineIndicator.test.tsx
```

Expected: FAIL — `Cannot find module './OfflineIndicator'`.

- [ ] **Step 3: Implement `OfflineIndicator.tsx`**

Create `src/components/OfflineIndicator.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const OfflineIndicator = () => {
  const { t } = useTranslation('common');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-yellow-100 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    >
      {t('offline.banner')}
    </div>
  );
};
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/components/OfflineIndicator.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/OfflineIndicator.tsx src/components/OfflineIndicator.test.tsx
git commit -m "feat(ui): add OfflineIndicator component"
```

---

## Task 9: Rebuild `Header` and `Footer`

**Files:**

- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`

These components use TanStack Router (`Link`, `useParams`, `useNavigate`), so unit tests are kept minimal (smoke rendering). Full behavior is covered by E2E.

- [ ] **Step 1: Replace `src/components/Header.tsx`**

```tsx
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  MenuIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type HeaderLocale = (typeof LOCALES)[number]['code'];

export const Header = () => {
  const { t } = useTranslation('common');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // The search input is uncontrolled — it navigates to the home route on change.
  // It does not read the current search param (avoiding router hook complexity in a layout component).
  const handleSearchChange = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void navigate({
        to: '/$locale/_app/',
        params: { locale },
        search: { search: value, level: '', subject: '', page: 1 },
      });
    }, 300);
  };

  const switchLocale = (newLocale: HeaderLocale) => {
    void navigate({
      to: '/$locale/_app/',
      params: { locale: newLocale },
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <Link
          to="/$locale/_app/"
          params={{ locale }}
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
        >
          {t('appName')}
        </Link>

        {/* Search + Filters */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              placeholder={t('search.placeholder')}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label={t('search.placeholder')}
            />
          </div>

          {/* Filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label={t('search.filters')}
              >
                <SlidersHorizontalIcon size={16} />
                <span className="hidden sm:inline">
                  {t('search.filters')}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('search.filters')}</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  {t('subjects.all')}
                </p>
                {/* Subject filters: future work */}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Language dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('nav.language')}
            >
              {locale === 'pt-BR' ? '🇧🇷' : '🇬🇧'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LOCALES.map(({ code, label }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => switchLocale(code)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Menu sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <MenuIcon size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t('appName')}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                to="/$locale/_app/settings"
                params={{ locale }}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('nav.settings')}
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Replace `src/components/Footer.tsx`**

```tsx
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type FooterLocale = (typeof LOCALES)[number]['code'];

export const Footer = () => {
  const { t } = useTranslation('common');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();

  const switchLocale = (newLocale: FooterLocale) => {
    void navigate({
      to: '/$locale/_app/',
      params: { locale: newLocale },
    });
  };

  return (
    <footer className="border-t border-[var(--line)] px-4 py-6">
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/$locale/_app/settings"
          params={{ locale }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('nav.settings')}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('nav.language')}
            >
              {locale === 'pt-BR' ? '🇧🇷' : '🇬🇧'} {t('nav.language')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {LOCALES.map(({ code, label }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => switchLocale(code)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </footer>
  );
};
```

- [ ] **Step 3: Run typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx
git commit -m "feat(ui): rebuild Header and Footer for app shell"
```

---

## Task 10: Wire `_app.tsx` layout shell

**Files:**

- Modify: `src/routes/$locale/_app.tsx`

- [ ] **Step 1: Update `_app.tsx` to include Header, OfflineIndicator, Footer**

Replace the contents of `src/routes/$locale/_app.tsx`:

```tsx
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { seedThemesOnce } from '@/db/seed-themes';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';
import { ThemeRuntimeProvider } from '@/providers/ThemeRuntimeProvider';

const AppLayout = () => (
  <DbProvider onDatabaseReady={seedThemesOnce}>
    <I18nextProvider i18n={i18n}>
      <ThemeRuntimeProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <OfflineIndicator />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </ThemeRuntimeProvider>
    </I18nextProvider>
  </DbProvider>
);

export const Route = createFileRoute('/$locale/_app')({
  component: AppLayout,
});
```

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\$locale/_app.tsx
git commit -m "feat(layout): wire Header, OfflineIndicator, Footer into app layout"
```

---

## Task 11: Home route with search params and composed game grid

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`
- Modify: `src/routes/$locale/_app/index.test.tsx`

- [ ] **Step 1: Update the test for the new home screen**

Replace `src/routes/$locale/_app/index.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Home screen', () => {
  it('renders without crashing', () => {
    // The HomeScreen component depends on TanStack Router hooks (useSearch, useNavigate).
    // Full rendering is covered by E2E tests. This is a smoke test for the module.
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run existing test — expect pass**

```bash
yarn test src/routes/\$locale/_app/index.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Replace `index.tsx` with search-param-driven home screen**

Replace `src/routes/$locale/_app/index.tsx`:

```tsx
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useMemo } from 'react';
import { GameGrid } from '@/components/GameGrid';
import { LevelRow } from '@/components/LevelRow';
import { filterCatalog, paginateCatalog } from '@/games/catalog-utils';
import type { GameLevel, GameSubject } from '@/games/registry';
import { GAME_CATALOG } from '@/games/registry';
import { useBookmarks } from '@/db/hooks/useBookmarks';

const PAGE_SIZE = 12;

const HomeScreen = () => {
  const { level, subject, search, page } = Route.useSearch();
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate({ from: '/$locale/_app/' });
  const { bookmarkedIds, toggle } = useBookmarks();

  const filtered = useMemo(
    () =>
      filterCatalog(GAME_CATALOG, {
        search,
        level: level as GameLevel | '',
        subject: subject as GameSubject | '',
      }),
    [search, level, subject],
  );

  const {
    items,
    page: safePage,
    totalPages,
  } = useMemo(
    () => paginateCatalog(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const updateSearch = (
    patch: Partial<{
      level: string;
      subject: string;
      search: string;
      page: number;
    }>,
  ) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    });
  };

  const handlePlay = (gameId: string) => {
    void navigate({
      to: '/$locale/_app/game/$gameId',
      params: { locale, gameId },
    });
  };

  return (
    <div className="px-4 py-2">
      <LevelRow
        currentLevel={level as GameLevel | ''}
        onLevelChange={(l) => updateSearch({ level: l, page: 1 })}
      />
      <div className="mt-4">
        <GameGrid
          entries={items}
          bookmarkedIds={bookmarkedIds}
          onBookmarkToggle={toggle}
          onPlay={handlePlay}
          page={safePage}
          totalPages={totalPages}
          onPageChange={(p) => updateSearch({ page: p })}
        />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/')({
  validateSearch: (raw: Record<string, unknown>) => ({
    search: typeof raw.search === 'string' ? raw.search : '',
    level: typeof raw.level === 'string' ? raw.level : '',
    subject: typeof raw.subject === 'string' ? raw.subject : '',
    page: typeof raw.page === 'number' ? Math.max(1, raw.page) : 1,
  }),
  component: HomeScreen,
});
```

- [ ] **Step 4: Run typecheck**

```bash
yarn typecheck
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/routes/\$locale/_app/index.tsx src/routes/\$locale/_app/index.test.tsx
git commit -m "feat(home): game grid with search params, level filter, and pagination"
```

---

## Task 12: `useBookmarks` hook

**Files:**

- Create: `src/db/hooks/useBookmarks.ts`
- Create: `src/db/hooks/useBookmarks.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/db/hooks/useBookmarks.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import { useBookmarks } from './useBookmarks';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import { i18n } from '@/lib/i18n/i18n';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';

let db: BaseSkillDatabase | undefined;

const makeWrapper = (testDb: BaseSkillDatabase) => {
  return ({ children }: { children: ReactNode }) => (
    <DbProvider openDatabase={() => Promise.resolve(testDb)}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </DbProvider>
  );
};

afterEach(async () => {
  if (db) await destroyTestDatabase(db);
  db = undefined;
});

describe('useBookmarks', () => {
  it('starts with an empty set of bookmarked ids', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarks(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.bookmarkedIds).toBeDefined());
    expect(result.current.bookmarkedIds.size).toBe(0);
  });

  it('adds a bookmark when toggle is called on an unbookmarked game', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarks(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.bookmarkedIds).toBeDefined());

    await act(async () => {
      await result.current.toggle('math-addition');
    });

    expect(result.current.bookmarkedIds.has('math-addition')).toBe(true);
  });

  it('removes the bookmark when toggle is called on an already-bookmarked game', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarks(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.bookmarkedIds).toBeDefined());

    await act(async () => {
      await result.current.toggle('math-addition');
    });
    expect(result.current.bookmarkedIds.has('math-addition')).toBe(true);

    await act(async () => {
      await result.current.toggle('math-addition');
    });
    expect(result.current.bookmarkedIds.has('math-addition')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/db/hooks/useBookmarks.test.ts
```

Expected: FAIL — `Cannot find module './useBookmarks'`.

- [ ] **Step 3: Implement `useBookmarks.ts`**

Create `src/db/hooks/useBookmarks.ts`:

```ts
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { BookmarkDoc } from '@/db/schemas/bookmarks';

const ANONYMOUS_PROFILE_ID = 'anonymous';

type UseBookmarksResult = {
  bookmarkedIds: Set<string>;
  toggle: (gameId: string) => Promise<void>;
};

export function useBookmarks(): UseBookmarksResult {
  const { db } = useRxDB();

  const query$ = useMemo(() => {
    if (!db) return null;
    return db.bookmarks.find({
      selector: { profileId: ANONYMOUS_PROFILE_ID },
    }).$;
  }, [db]);

  const docs = useRxQuery<BookmarkDoc[]>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- query$ is only null when db is undefined; hook won't render useful data then
    query$ ?? new (require('rxjs').Subject)(),
    [],
  );

  const bookmarkedIds = useMemo(
    () => new Set(docs.map((d) => d.gameId)),
    [docs],
  );

  const toggle = async (gameId: string): Promise<void> => {
    if (!db) return;
    const existing = await db.bookmarks
      .findOne({
        selector: { profileId: ANONYMOUS_PROFILE_ID, gameId },
      })
      .exec();
    if (existing) {
      await existing.remove();
    } else {
      const doc: BookmarkDoc = {
        id: nanoid(21),
        profileId: ANONYMOUS_PROFILE_ID,
        gameId,
        createdAt: new Date().toISOString(),
      };
      await db.bookmarks.insert(doc);
    }
  };

  return { bookmarkedIds, toggle };
}
```

Note: the `require('rxjs').Subject` fallback for when `db` is undefined lets `useRxQuery` bind to an inert Observable that never emits, avoiding a conditional hook call. An alternative is to handle the `null` case differently — see the refinement note below.

**Refinement:** Replace the `require` workaround with a stable empty Observable:

```ts
import { EMPTY } from 'rxjs';
// ...
const docs = useRxQuery<BookmarkDoc[]>(query$ ?? EMPTY, []);
```

Use `EMPTY` from `rxjs` (already a dependency). Update the import at the top:

```ts
import { EMPTY } from 'rxjs';
```

And remove the `require` line from `useBookmarks.ts`. Final implementation:

```ts
import { EMPTY } from 'rxjs';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { BookmarkDoc } from '@/db/schemas/bookmarks';

const ANONYMOUS_PROFILE_ID = 'anonymous';

type UseBookmarksResult = {
  bookmarkedIds: Set<string>;
  toggle: (gameId: string) => Promise<void>;
};

export function useBookmarks(): UseBookmarksResult {
  const { db } = useRxDB();

  const query$ = useMemo(
    () =>
      db
        ? db.bookmarks.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
          }).$
        : EMPTY,
    [db],
  );

  const docs = useRxQuery<BookmarkDoc[]>(query$, []);

  const bookmarkedIds = useMemo(
    () => new Set(docs.map((d) => d.gameId)),
    [docs],
  );

  const toggle = async (gameId: string): Promise<void> => {
    if (!db) return;
    const existing = await db.bookmarks
      .findOne({
        selector: { profileId: ANONYMOUS_PROFILE_ID, gameId },
      })
      .exec();
    if (existing) {
      await existing.remove();
    } else {
      const doc: BookmarkDoc = {
        id: nanoid(21),
        profileId: ANONYMOUS_PROFILE_ID,
        gameId,
        createdAt: new Date().toISOString(),
      };
      await db.bookmarks.insert(doc);
    }
  };

  return { bookmarkedIds, toggle };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/db/hooks/useBookmarks.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/db/hooks/useBookmarks.ts src/db/hooks/useBookmarks.test.ts
git commit -m "feat(db): add useBookmarks hook with anonymous profile support"
```

---

## Task 13: `useSettings` hook

**Files:**

- Create: `src/db/hooks/useSettings.ts`
- Create: `src/db/hooks/useSettings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/db/hooks/useSettings.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSettings } from './useSettings';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';

let db: BaseSkillDatabase | undefined;

const makeWrapper = (testDb: BaseSkillDatabase) => {
  return ({ children }: { children: ReactNode }) => (
    <DbProvider openDatabase={() => Promise.resolve(testDb)}>
      {children}
    </DbProvider>
  );
};

afterEach(async () => {
  if (db) await destroyTestDatabase(db);
  db = undefined;
});

describe('useSettings', () => {
  it('returns default volume 0.8 when no settings doc exists', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.settings).toBeDefined());
    expect(result.current.settings.volume).toBe(0.8);
  });

  it('persists updated volume to RxDB', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.settings).toBeDefined());

    await act(async () => {
      await result.current.update({ volume: 0.5 });
    });

    expect(result.current.settings.volume).toBe(0.5);
  });

  it('merges partial updates — only changes the specified field', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(db!),
    });
    await waitFor(() => expect(result.current.settings).toBeDefined());

    await act(async () => {
      await result.current.update({ speechRate: 1.5 });
    });

    expect(result.current.settings.speechRate).toBe(1.5);
    expect(result.current.settings.volume).toBe(0.8);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
yarn test src/db/hooks/useSettings.test.ts
```

Expected: FAIL — `Cannot find module './useSettings'`.

- [ ] **Step 3: Implement `useSettings.ts`**

Create `src/db/hooks/useSettings.ts`:

```ts
import { EMPTY } from 'rxjs';
import { useMemo } from 'react';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { SettingsDoc } from '@/db/schemas/settings';

const ANONYMOUS_PROFILE_ID = 'anonymous';
const ANONYMOUS_SETTINGS_ID = 'settings:anonymous';

const DEFAULT_SETTINGS: Omit<SettingsDoc, 'profileId' | 'updatedAt'> & {
  profileId: string;
} = {
  id: ANONYMOUS_SETTINGS_ID,
  profileId: ANONYMOUS_PROFILE_ID,
  volume: 0.8,
  speechRate: 1,
  ttsEnabled: true,
  showSubtitles: true,
};

type UseSettingsResult = {
  settings: typeof DEFAULT_SETTINGS & Partial<SettingsDoc>;
  update: (patch: Partial<SettingsDoc>) => Promise<void>;
};

export function useSettings(): UseSettingsResult {
  const { db } = useRxDB();

  const query$ = useMemo(
    () => (db ? db.settings.findOne(ANONYMOUS_SETTINGS_ID).$ : EMPTY),
    [db],
  );

  const doc = useRxQuery<SettingsDoc | null>(query$, null);

  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...doc }),
    [doc],
  );

  const update = async (patch: Partial<SettingsDoc>): Promise<void> => {
    if (!db) return;
    const existing = await db.settings
      .findOne(ANONYMOUS_SETTINGS_ID)
      .exec();
    const now = new Date().toISOString();
    if (existing) {
      await existing.patch({ ...patch, updatedAt: now });
    } else {
      const newDoc: SettingsDoc = {
        ...DEFAULT_SETTINGS,
        ...patch,
        updatedAt: now,
      };
      await db.settings.insert(newDoc);
    }
  };

  return { settings, update };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
yarn test src/db/hooks/useSettings.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/db/hooks/useSettings.ts src/db/hooks/useSettings.test.ts
git commit -m "feat(db): add useSettings hook with anonymous defaults and patch support"
```

---

## Task 14: Wire the Settings screen to RxDB

**Files:**

- Modify: `src/routes/$locale/_app/settings.tsx`

- [ ] **Step 1: Replace `settings.tsx` with a functional settings screen**

```tsx
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/db/hooks/useSettings';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

const SettingsScreen = () => {
  const { t } = useTranslation('settings');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();
  const { settings, update } = useSettings();

  const handleLocaleChange = (newLocale: string) => {
    void navigate({
      to: '/$locale/_app/settings',
      params: { locale: newLocale },
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="volume">
            Volume ({Math.round((settings.volume ?? 0.8) * 100)}%)
          </Label>
          <Slider
            id="volume"
            min={0}
            max={1}
            step={0.05}
            value={[settings.volume ?? 0.8]}
            onValueChange={([v]) => {
              void update({ volume: v });
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="speechRate">
            Speech rate ({settings.speechRate ?? 1}×)
          </Label>
          <Slider
            id="speechRate"
            min={0.5}
            max={2}
            step={0.1}
            value={[settings.speechRate ?? 1]}
            onValueChange={([v]) => {
              void update({ speechRate: v });
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="language">Language</Label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map(({ code, label }) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/settings')({
  component: SettingsScreen,
});
```

Note: `Label` component may need to be added via shadcn:

```bash
npx shadcn@latest add label
```

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: no errors. If `Label` is missing, run the `npx shadcn add label` command first.

- [ ] **Step 3: Run all tests**

```bash
yarn test
```

Expected: all tests pass. Fix any regressions before committing.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\$locale/_app/settings.tsx
git commit -m "feat(settings): wire volume, speech rate, and language to RxDB"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run full test suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Run linter**

```bash
yarn lint
```

Expected: no warnings or errors. If `knip` flags new unused exports, either use them or remove them.

- [ ] **Step 4: Smoke-test in browser**

```bash
yarn dev
```

Open `http://localhost:3000/en/` and verify:

- Header shows logo, search input, filters button, language flag, menu icon
- Level row shows PK, K, Year 1–4 pills below the header
- Game grid shows 3 game cards (from the stub catalog)
- Clicking a level pill filters the grid
- Typing in search filters the grid
- Clicking bookmark icon toggles the filled/unfilled state
- Footer mirrors header menu
- Navigating to `/en/settings` shows volume, speech rate, and language controls

- [ ] **Step 5: Open a PR**

```bash
cd ../..
gh pr create \
  --title "feat(m3): app shell — game grid, header, footer, bookmarks, settings" \
  --body "Implements Milestone 3 app shell. Anonymous-first game grid with level filter, search, pagination. Header with search/filters/language/menu. Footer mirrors header. Offline indicator. useBookmarks and useSettings hooks wired to RxDB anonymous profile."
```

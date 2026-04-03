# Group J: Saved Game Configurations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple bookmark system with saved game configurations — each "bookmark" is a named snapshot of game settings; games with saved configs sort to the top of the catalog; config chips on each card let users launch directly with saved settings.

**Architecture:** `SavedGameConfigDoc` replaces `BookmarkDoc` in RxDB. A new `useSavedConfigs` hook replaces `useBookmarks`. `GameCard` gains config chips (one per saved config) that launch the game with that config via a `?configId=` search param. A `SaveConfigDialog` handles naming + duplicate validation. `sortByHasSavedConfigs` in `catalog-utils.ts` moves games with configs to the top (absorbs Group H).

**Tech Stack:** TypeScript, RxDB, React 19, TanStack Router v1, Vitest + RTL

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/db/schemas/saved_game_configs.ts` | Create | `SavedGameConfigDoc` type + RxDB schema |
| `src/db/schemas/bookmarks.ts` | Delete | Replaced by saved_game_configs |
| `src/db/schemas/index.ts` | Modify | Swap bookmark exports for saved_game_configs |
| `src/db/types.ts` | Modify | Swap `bookmarks` collection for `saved_game_configs` |
| `src/db/create-database.ts` | Modify | Register new collection, remove bookmarks |
| `src/db/hooks/useSavedConfigs.ts` | Create | CRUD + name validation (replaces useBookmarks) |
| `src/db/hooks/useSavedConfigs.test.ts` | Create | Unit tests for hook |
| `src/db/hooks/useBookmarks.ts` | Delete | Replaced by useSavedConfigs |
| `src/games/catalog-utils.ts` | Modify | Add `sortByHasSavedConfigs` (absorbs Group H) |
| `src/games/catalog-utils.test.ts` | Modify | Tests for `sortByHasSavedConfigs` |
| `src/components/SaveConfigDialog.tsx` | Create | Name input modal with duplicate validation |
| `src/components/SaveConfigDialog.test.tsx` | Create | Tests for dialog |
| `src/components/GameCard.tsx` | Modify | Config chips, bookmark → save-config behavior |
| `src/components/GameCard.test.tsx` | Modify | Update tests for new props |
| `src/components/GameGrid.tsx` | Modify | Pass savedConfigs + handlers |
| `src/routes/$locale/_app/index.tsx` | Modify | Use `useSavedConfigs`, sort catalog |
| `src/routes/$locale/_app/game/$gameId.tsx` | Modify | Accept `configId` search param, load saved config |

---

## Task 1: SavedGameConfigDoc schema + DB wiring

**Files:**
- Create: `src/db/schemas/saved_game_configs.ts`
- Modify: `src/db/schemas/index.ts`
- Modify: `src/db/types.ts`
- Modify: `src/db/create-database.ts`
- Delete: `src/db/schemas/bookmarks.ts`
- Delete: `src/db/hooks/useBookmarks.ts`

- [ ] **Step 1: Create the schema file**

  Create `src/db/schemas/saved_game_configs.ts`:

  ```ts
  import type { RxJsonSchema } from 'rxdb';

  export type SavedGameConfigDoc = {
    id: string;
    profileId: string;
    gameId: string;
    name: string;
    config: Record<string, unknown>;
    createdAt: string;
  };

  export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 36 },
      profileId: { type: 'string', maxLength: 36 },
      gameId: { type: 'string', maxLength: 64 },
      name: { type: 'string', maxLength: 128 },
      config: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'profileId', 'gameId', 'name', 'config', 'createdAt'],
    additionalProperties: false,
  };
  ```

- [ ] **Step 2: Update `src/db/schemas/index.ts`**

  Replace all `bookmarks` references with `saved_game_configs`:

  ```ts
  import { appMetaSchema } from './app-meta';
  import { gameConfigOverridesSchema } from './game_config_overrides';
  import { profilesSchema } from './profiles';
  import { progressSchema } from './progress';
  import { savedGameConfigsSchema } from './saved_game_configs';
  import { sessionHistorySchema } from './session_history';
  import { sessionHistoryIndexSchema } from './session_history_index';
  import { settingsSchema } from './settings';
  import { syncMetaSchema } from './sync_meta';
  import { themesSchema } from './themes';

  export { appMetaSchema } from './app-meta';
  export type { AppMetaDoc } from './app-meta';
  export { gameConfigOverridesSchema } from './game_config_overrides';
  export type { GameConfigOverridesDoc } from './game_config_overrides';
  export { profilesSchema } from './profiles';
  export type { ProfileDoc } from './profiles';
  export { progressSchema } from './progress';
  export type { ProgressDoc } from './progress';
  export { savedGameConfigsSchema } from './saved_game_configs';
  export type { SavedGameConfigDoc } from './saved_game_configs';
  export { sessionHistoryIndexSchema } from './session_history_index';
  export type { SessionHistoryIndexDoc } from './session_history_index';
  export { sessionHistorySchema } from './session_history';
  export type { SessionHistoryDoc } from './session_history';
  export { settingsSchema } from './settings';
  export type { SettingsDoc } from './settings';
  export { syncMetaSchema } from './sync_meta';
  export type { SyncMetaDoc } from './sync_meta';
  export { themesSchema } from './themes';
  export type { ThemeDoc } from './themes';

  export const MAX_SCHEMA_VERSION = Math.max(
    appMetaSchema.version,
    gameConfigOverridesSchema.version,
    profilesSchema.version,
    progressSchema.version,
    savedGameConfigsSchema.version,
    sessionHistoryIndexSchema.version,
    sessionHistorySchema.version,
    settingsSchema.version,
    syncMetaSchema.version,
    themesSchema.version,
  );
  ```

- [ ] **Step 3: Update `src/db/types.ts`**

  Replace `bookmarks` with `saved_game_configs`:

  ```ts
  import type { AppMetaDoc } from './schemas/app-meta';
  import type { GameConfigOverridesDoc } from './schemas/game_config_overrides';
  import type { ProfileDoc } from './schemas/profiles';
  import type { ProgressDoc } from './schemas/progress';
  import type { SavedGameConfigDoc } from './schemas/saved_game_configs';
  import type { SessionHistoryDoc } from './schemas/session_history';
  import type { SessionHistoryIndexDoc } from './schemas/session_history_index';
  import type { SettingsDoc } from './schemas/settings';
  import type { SyncMetaDoc } from './schemas/sync_meta';
  import type { ThemeDoc } from './schemas/themes';
  import type { RxCollection, RxDatabase } from 'rxdb';

  export type BaseSkillCollections = {
    app_meta: RxCollection<AppMetaDoc>;
    profiles: RxCollection<ProfileDoc>;
    progress: RxCollection<ProgressDoc>;
    settings: RxCollection<SettingsDoc>;
    game_config_overrides: RxCollection<GameConfigOverridesDoc>;
    saved_game_configs: RxCollection<SavedGameConfigDoc>;
    themes: RxCollection<ThemeDoc>;
    session_history: RxCollection<SessionHistoryDoc>;
    session_history_index: RxCollection<SessionHistoryIndexDoc>;
    sync_meta: RxCollection<SyncMetaDoc>;
  };

  export type BaseSkillDatabase = RxDatabase<BaseSkillCollections>;

  export type CollectionName = keyof BaseSkillCollections;
  ```

- [ ] **Step 4: Update `src/db/create-database.ts`**

  Replace `bookmarks` import and collection with `saved_game_configs`:

  ```ts
  import { nanoid } from 'nanoid';
  import { addRxPlugin, createRxDatabase } from 'rxdb';
  import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
  import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
  import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
  import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
  import { checkVersionAndMigrate } from './migrations';
  import {
    appMetaSchema,
    gameConfigOverridesSchema,
    profilesSchema,
    progressSchema,
    savedGameConfigsSchema,
    sessionHistoryIndexSchema,
    sessionHistorySchema,
    settingsSchema,
    syncMetaSchema,
    themesSchema,
  } from './schemas';
  import type { BaseSkillCollections, BaseSkillDatabase } from './types';
  import type { RxDatabase } from 'rxdb';

  addRxPlugin(RxDBMigrationSchemaPlugin);

  const DB_NAME = 'baseskill-data-test';
  const PRODUCTION_DB_NAME = 'baseskill-data';

  const COLLECTIONS = {
    app_meta: { schema: appMetaSchema },
    profiles: { schema: profilesSchema },
    progress: { schema: progressSchema },
    settings: { schema: settingsSchema },
    game_config_overrides: { schema: gameConfigOverridesSchema },
    saved_game_configs: { schema: savedGameConfigsSchema },
    themes: { schema: themesSchema },
    session_history: { schema: sessionHistorySchema },
    session_history_index: {
      schema: sessionHistoryIndexSchema,
      migrationStrategies: {
        1: (oldDoc: Record<string, unknown>) => ({
          ...oldDoc,
          status: 'completed',
          seed: '',
          initialContent: { rounds: [] },
          initialState: {},
        }),
      },
    },
    sync_meta: { schema: syncMetaSchema },
  } as const;

  async function addBaseSkillCollections(
    db: RxDatabase<BaseSkillCollections>,
  ): Promise<BaseSkillDatabase> {
    await db.addCollections(COLLECTIONS);
    return db as BaseSkillDatabase;
  }

  /** Memory storage for unit tests; does not run migrations. */
  export async function createTestDatabase(): Promise<BaseSkillDatabase> {
    const db = await createRxDatabase<BaseSkillDatabase>({
      name: `${DB_NAME}-${nanoid()}`,
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageMemory(),
      }),
      multiInstance: false,
    });
    return addBaseSkillCollections(db);
  }

  const STORYBOOK_DB_PREFIX = 'baseskill-storybook';

  export async function createStorybookDatabase(): Promise<BaseSkillDatabase> {
    const db = await createRxDatabase<BaseSkillDatabase>({
      name: `${STORYBOOK_DB_PREFIX}-${nanoid()}`,
      storage: getRxStorageMemory(),
      multiInstance: false,
    });
    const withCols = await addBaseSkillCollections(db);
    await checkVersionAndMigrate(withCols);
    return withCols;
  }

  let productionDbPromise: Promise<BaseSkillDatabase> | undefined;

  export async function getOrCreateDatabase(): Promise<BaseSkillDatabase> {
    if (typeof indexedDB === 'undefined') {
      throw new TypeError(
        'getOrCreateDatabase is only available in a browser with IndexedDB',
      );
    }
    productionDbPromise ??= (async () => {
      const db = await createRxDatabase<BaseSkillDatabase>({
        name: PRODUCTION_DB_NAME,
        storage: getRxStorageDexie(),
        multiInstance: false,
      });
      const withCols = await addBaseSkillCollections(db);
      await checkVersionAndMigrate(withCols);
      return withCols;
    })();
    return productionDbPromise;
  }

  export async function destroyTestDatabase(
    db?: BaseSkillDatabase,
  ): Promise<void> {
    if (db) await db.remove();
  }
  ```

- [ ] **Step 5: Delete old files**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  rm src/db/schemas/bookmarks.ts
  rm src/db/hooks/useBookmarks.ts
  ```

- [ ] **Step 6: Run typecheck to confirm no broken references**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn typecheck 2>&1 | tail -20
  ```

  Expected: errors only from files that still import `useBookmarks` (will be fixed in later tasks). No errors from `create-database.ts`, `types.ts`, or `schemas/index.ts`.

- [ ] **Step 7: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/db/schemas/saved_game_configs.ts \
          src/db/schemas/index.ts \
          src/db/types.ts \
          src/db/create-database.ts
  git rm src/db/schemas/bookmarks.ts src/db/hooks/useBookmarks.ts
  git commit -m "feat(db): replace BookmarkDoc with SavedGameConfigDoc schema"
  ```

---

## Task 2: useSavedConfigs hook

**Files:**
- Create: `src/db/hooks/useSavedConfigs.ts`
- Create: `src/db/hooks/useSavedConfigs.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `src/db/hooks/useSavedConfigs.test.ts`:

  ```ts
  import { renderHook, act } from '@testing-library/react';
  import { afterEach, beforeEach, describe, expect, it } from 'vitest';
  import { useSavedConfigs } from './useSavedConfigs';
  import {
    createTestDatabase,
    destroyTestDatabase,
  } from '@/db/create-database';
  import { RxDBProvider } from '@/db/hooks/useRxDB';
  import type { BaseSkillDatabase } from '@/db/types';
  import type { ReactNode } from 'react';

  let db: BaseSkillDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await destroyTestDatabase(db);
  });

  const makeWrapper =
    (database: BaseSkillDatabase) =>
    ({ children }: { children: ReactNode }) => (
      <RxDBProvider db={database}>{children}</RxDBProvider>
    );

  describe('useSavedConfigs', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      expect(result.current.savedConfigs).toEqual([]);
    });

    it('save() inserts a new saved config', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: { totalRounds: 3 },
        });
      });
      expect(result.current.savedConfigs).toHaveLength(1);
      expect(result.current.savedConfigs[0].name).toBe('Easy Mode');
      expect(result.current.savedConfigs[0].gameId).toBe('word-spell');
    });

    it('save() throws when name already exists for same gameId', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
      });
      await expect(
        act(async () => {
          await result.current.save({
            gameId: 'word-spell',
            name: 'Easy Mode',
            config: {},
          });
        }),
      ).rejects.toThrow('already exists');
    });

    it('save() allows same name for different gameId', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
        await result.current.save({
          gameId: 'number-match',
          name: 'Easy Mode',
          config: {},
        });
      });
      expect(result.current.savedConfigs).toHaveLength(2);
    });

    it('remove() deletes a saved config by id', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
      });
      const id = result.current.savedConfigs[0].id;
      await act(async () => {
        await result.current.remove(id);
      });
      expect(result.current.savedConfigs).toHaveLength(0);
    });

    it('rename() changes the name of a saved config', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
      });
      const id = result.current.savedConfigs[0].id;
      await act(async () => {
        await result.current.rename(id, 'Hard Mode');
      });
      expect(result.current.savedConfigs[0].name).toBe('Hard Mode');
    });

    it('rename() throws when new name already exists for same gameId', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
        await result.current.save({
          gameId: 'word-spell',
          name: 'Hard Mode',
          config: {},
        });
      });
      const id = result.current.savedConfigs[0].id;
      await expect(
        act(async () => {
          await result.current.rename(id, 'Hard Mode');
        }),
      ).rejects.toThrow('already exists');
    });

    it('getByGameId() returns only configs for the given gameId', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'WS Config',
          config: {},
        });
        await result.current.save({
          gameId: 'number-match',
          name: 'NM Config',
          config: {},
        });
      });
      const wsConfigs = result.current.getByGameId('word-spell');
      expect(wsConfigs).toHaveLength(1);
      expect(wsConfigs[0].gameId).toBe('word-spell');
    });

    it('gameIdsWithConfigs is a Set of gameIds that have at least one config', async () => {
      const { result } = renderHook(() => useSavedConfigs(), {
        wrapper: makeWrapper(db),
      });
      await act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'WS Config',
          config: {},
        });
      });
      expect(result.current.gameIdsWithConfigs.has('word-spell')).toBe(true);
      expect(result.current.gameIdsWithConfigs.has('number-match')).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Run to confirm FAIL**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/db/hooks/useSavedConfigs.test.ts 2>&1 | tail -10
  ```

  Expected: FAIL — `useSavedConfigs is not exported`.

- [ ] **Step 3: Implement `useSavedConfigs`**

  Create `src/db/hooks/useSavedConfigs.ts`:

  ```ts
  import { nanoid } from 'nanoid';
  import { useMemo } from 'react';
  import { EMPTY } from 'rxjs';
  import { useRxDB } from './useRxDB';
  import { useRxQuery } from './useRxQuery';
  import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';

  const ANONYMOUS_PROFILE_ID = 'anonymous';

  type SaveInput = {
    gameId: string;
    name: string;
    config: Record<string, unknown>;
  };

  type UseSavedConfigsResult = {
    savedConfigs: SavedGameConfigDoc[];
    gameIdsWithConfigs: Set<string>;
    getByGameId: (gameId: string) => SavedGameConfigDoc[];
    save: (input: SaveInput) => Promise<void>;
    remove: (id: string) => Promise<void>;
    rename: (id: string, newName: string) => Promise<void>;
  };

  export const useSavedConfigs = (): UseSavedConfigsResult => {
    const { db } = useRxDB();

    const query$ = useMemo(
      () =>
        db
          ? db.saved_game_configs.find({
              selector: { profileId: ANONYMOUS_PROFILE_ID },
              sort: [{ createdAt: 'asc' }],
            }).$
          : EMPTY,
      [db],
    );

    const docs = useRxQuery<SavedGameConfigDoc[]>(query$, []);

    const gameIdsWithConfigs = useMemo(
      () => new Set(docs.map((d) => d.gameId)),
      [docs],
    );

    const getByGameId = (gameId: string): SavedGameConfigDoc[] =>
      docs.filter((d) => d.gameId === gameId);

    const save = async ({ gameId, name, config }: SaveInput): Promise<void> => {
      if (!db) return;
      const trimmed = name.trim();
      const namesForGame = docs
        .filter((d) => d.gameId === gameId)
        .map((d) => d.name);
      if (namesForGame.includes(trimmed)) {
        throw new Error(
          `A saved config named "${trimmed}" already exists for this game`,
        );
      }
      const doc: SavedGameConfigDoc = {
        id: nanoid(21),
        profileId: ANONYMOUS_PROFILE_ID,
        gameId,
        name: trimmed,
        config,
        createdAt: new Date().toISOString(),
      };
      await db.saved_game_configs.insert(doc);
    };

    const remove = async (id: string): Promise<void> => {
      if (!db) return;
      const doc = await db.saved_game_configs.findOne(id).exec();
      if (doc) await doc.remove();
    };

    const rename = async (id: string, newName: string): Promise<void> => {
      if (!db) return;
      const doc = await db.saved_game_configs.findOne(id).exec();
      if (!doc) return;
      const trimmed = newName.trim();
      const namesForGame = docs
        .filter((d) => d.gameId === doc.gameId && d.id !== id)
        .map((d) => d.name);
      if (namesForGame.includes(trimmed)) {
        throw new Error(
          `A saved config named "${trimmed}" already exists for this game`,
        );
      }
      await doc.incrementalPatch({ name: trimmed });
    };

    return { savedConfigs: docs, gameIdsWithConfigs, getByGameId, save, remove, rename };
  };
  ```

- [ ] **Step 4: Run tests to confirm PASS**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/db/hooks/useSavedConfigs.test.ts 2>&1 | tail -10
  ```

  Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/db/hooks/useSavedConfigs.ts src/db/hooks/useSavedConfigs.test.ts
  git commit -m "feat(db): add useSavedConfigs hook (replaces useBookmarks)"
  ```

---

## Task 3: sortByHasSavedConfigs in catalog-utils

**Files:**
- Modify: `src/games/catalog-utils.ts`
- Modify: `src/games/catalog-utils.test.ts`

- [ ] **Step 1: Write failing tests**

  Open `src/games/catalog-utils.test.ts` and add:

  ```ts
  import { sortByHasSavedConfigs } from './catalog-utils';

  describe('sortByHasSavedConfigs', () => {
    const entries = [
      { id: 'alpha', titleKey: 'alpha', levels: ['K' as const], subject: 'math' as const },
      { id: 'beta',  titleKey: 'beta',  levels: ['K' as const], subject: 'math' as const },
      { id: 'gamma', titleKey: 'gamma', levels: ['K' as const], subject: 'math' as const },
    ];

    it('moves entries with saved configs to the front', () => {
      const result = sortByHasSavedConfigs(entries, new Set(['gamma']));
      expect(result[0].id).toBe('gamma');
      expect(result[1].id).toBe('alpha');
      expect(result[2].id).toBe('beta');
    });

    it('preserves original order within each group', () => {
      const result = sortByHasSavedConfigs(entries, new Set(['beta']));
      expect(result[0].id).toBe('beta');
      expect(result[1].id).toBe('alpha');
      expect(result[2].id).toBe('gamma');
    });

    it('preserves original order among multiple entries with configs', () => {
      const result = sortByHasSavedConfigs(entries, new Set(['gamma', 'alpha']));
      expect(result[0].id).toBe('alpha');
      expect(result[1].id).toBe('gamma');
      expect(result[2].id).toBe('beta');
    });

    it('returns original order when no gameIds have configs', () => {
      const result = sortByHasSavedConfigs(entries, new Set());
      expect(result.map((e) => e.id)).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('does not mutate the input array', () => {
      const copy = [...entries];
      sortByHasSavedConfigs(entries, new Set(['beta']));
      expect(entries).toEqual(copy);
    });
  });
  ```

- [ ] **Step 2: Run to confirm FAIL**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/games/catalog-utils.test.ts 2>&1 | tail -10
  ```

  Expected: FAIL — `sortByHasSavedConfigs is not exported`.

- [ ] **Step 3: Add `sortByHasSavedConfigs` to `catalog-utils.ts`**

  Append to `src/games/catalog-utils.ts`:

  ```ts
  export const sortByHasSavedConfigs = <T extends { id: string }>(
    entries: T[],
    gameIdsWithConfigs: Set<string>,
  ): T[] => {
    if (gameIdsWithConfigs.size === 0) return entries;
    return [...entries].sort((a, b) => {
      const aHas = gameIdsWithConfigs.has(a.id) ? 0 : 1;
      const bHas = gameIdsWithConfigs.has(b.id) ? 0 : 1;
      return aHas - bHas;
    });
  };
  ```

- [ ] **Step 4: Run tests to confirm PASS**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/games/catalog-utils.test.ts 2>&1 | tail -10
  ```

  Expected: all tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/games/catalog-utils.ts src/games/catalog-utils.test.ts
  git commit -m "feat(catalog): add sortByHasSavedConfigs (absorbs group-h)"
  ```

---

## Task 4: SaveConfigDialog component

**Files:**
- Create: `src/components/SaveConfigDialog.tsx`
- Create: `src/components/SaveConfigDialog.test.tsx`

- [ ] **Step 1: Write failing tests**

  Create `src/components/SaveConfigDialog.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { I18nextProvider } from 'react-i18next';
  import { describe, expect, it, vi } from 'vitest';
  import { SaveConfigDialog } from './SaveConfigDialog';
  import { i18n } from '@/lib/i18n/i18n';

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  describe('SaveConfigDialog', () => {
    it('renders with suggested name pre-filled', () => {
      render(
        <SaveConfigDialog
          open={true}
          suggestedName="Word Spell #2"
          existingNames={[]}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
        { wrapper },
      );
      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).value).toBe('Word Spell #2');
    });

    it('calls onSave with the name when form is submitted', async () => {
      const onSave = vi.fn();
      render(
        <SaveConfigDialog
          open={true}
          suggestedName="Word Spell"
          existingNames={[]}
          onSave={onSave}
          onCancel={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).toHaveBeenCalledWith('Word Spell');
    });

    it('shows error and does not call onSave when name is empty', async () => {
      const onSave = vi.fn();
      render(
        <SaveConfigDialog
          open={true}
          suggestedName=""
          existingNames={[]}
          onSave={onSave}
          onCancel={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.clear(screen.getByRole('textbox'));
      await userEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows error and does not call onSave when name is a duplicate', async () => {
      const onSave = vi.fn();
      render(
        <SaveConfigDialog
          open={true}
          suggestedName="Easy Mode"
          existingNames={['Easy Mode']}
          onSave={onSave}
          onCancel={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', async () => {
      const onCancel = vi.fn();
      render(
        <SaveConfigDialog
          open={true}
          suggestedName="Word Spell"
          existingNames={[]}
          onSave={vi.fn()}
          onCancel={onCancel}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalled();
    });

    it('does not render when open is false', () => {
      render(
        <SaveConfigDialog
          open={false}
          suggestedName="Word Spell"
          existingNames={[]}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
        { wrapper },
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run to confirm FAIL**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/components/SaveConfigDialog.test.tsx 2>&1 | tail -10
  ```

  Expected: FAIL — `SaveConfigDialog is not exported`.

- [ ] **Step 3: Implement `SaveConfigDialog`**

  Create `src/components/SaveConfigDialog.tsx`:

  ```tsx
  import { useEffect, useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { Button } from '@/components/ui/button';
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';

  type SaveConfigDialogProps = {
    open: boolean;
    suggestedName: string;
    existingNames: string[];
    onSave: (name: string) => void;
    onCancel: () => void;
  };

  export const SaveConfigDialog = ({
    open,
    suggestedName,
    existingNames,
    onSave,
    onCancel,
  }: SaveConfigDialogProps) => {
    const { t } = useTranslation('common');
    const [name, setName] = useState(suggestedName);
    const [error, setError] = useState('');

    useEffect(() => {
      if (open) {
        setName(suggestedName);
        setError('');
      }
    }, [open, suggestedName]);

    const handleSave = () => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError(t('saveConfig.errorEmpty'));
        return;
      }
      if (existingNames.includes(trimmed)) {
        setError(t('saveConfig.errorDuplicate', { name: trimmed }));
        return;
      }
      onSave(trimmed);
    };

    if (!open) return null;

    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('saveConfig.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t('saveConfig.placeholder')}
              aria-label={t('saveConfig.nameLabel')}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              {t('saveConfig.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('saveConfig.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  ```

- [ ] **Step 4: Add i18n keys**

  Open `src/lib/i18n/locales/en/common.json` and add under a `saveConfig` key:

  ```json
  "saveConfig": {
    "title": "Save configuration",
    "nameLabel": "Configuration name",
    "placeholder": "e.g. Easy Mode",
    "save": "Save",
    "cancel": "Cancel",
    "errorEmpty": "Please enter a name",
    "errorDuplicate": "A configuration named \"{{name}}\" already exists"
  }
  ```

  Open `src/lib/i18n/locales/pt-BR/common.json` and add:

  ```json
  "saveConfig": {
    "title": "Salvar configuração",
    "nameLabel": "Nome da configuração",
    "placeholder": "ex: Fácil",
    "save": "Salvar",
    "cancel": "Cancelar",
    "errorEmpty": "Por favor, insira um nome",
    "errorDuplicate": "Já existe uma configuração chamada \"{{name}}\""
  }
  ```

- [ ] **Step 5: Run tests to confirm PASS**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/components/SaveConfigDialog.test.tsx 2>&1 | tail -10
  ```

  Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/components/SaveConfigDialog.tsx \
          src/components/SaveConfigDialog.test.tsx \
          src/lib/i18n/locales/en/common.json \
          src/lib/i18n/locales/pt-BR/common.json
  git commit -m "feat(ui): add SaveConfigDialog with name validation"
  ```

---

## Task 5: Update GameCard — config chips + save behavior

**Files:**
- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/GameCard.test.tsx`

The updated GameCard:
- No longer receives `isBookmarked: boolean` or `onBookmarkToggle`
- Receives `savedConfigs: SavedGameConfigDoc[]` (pre-filtered to this game's configs)
- Bookmark icon: filled when `savedConfigs.length > 0`; clicking opens `SaveConfigDialog`
- Config chips: one per saved config, clicking the chip calls `onPlayWithConfig(entry.id, config.id)`; an `×` button on each chip calls `onRemoveConfig(config.id)`

- [ ] **Step 1: Write failing tests**

  Replace the entire content of `src/components/GameCard.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { I18nextProvider } from 'react-i18next';
  import { describe, expect, it, vi } from 'vitest';
  import { GameCard } from './GameCard';
  import type { GameCatalogEntry } from '@/games/registry';
  import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
  import { i18n } from '@/lib/i18n/i18n';

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  const mockEntry: GameCatalogEntry = {
    id: 'word-spell',
    titleKey: 'word-spell',
    levels: ['1', '2'],
    subject: 'reading',
  };

  const mockConfig: SavedGameConfigDoc = {
    id: 'cfg-1',
    profileId: 'anonymous',
    gameId: 'word-spell',
    name: 'Easy Mode',
    config: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  describe('GameCard', () => {
    it('renders the game title', () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      expect(screen.getByText('Word spell')).toBeInTheDocument();
    });

    it('renders level badges', () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      expect(screen.getByText('Year 1')).toBeInTheDocument();
      expect(screen.getByText('Year 2')).toBeInTheDocument();
    });

    it('calls onPlay with gameId when Play button is clicked', async () => {
      const onPlay = vi.fn();
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={onPlay}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /^play$/i }));
      expect(onPlay).toHaveBeenCalledWith('word-spell');
    });

    it('bookmark icon is not filled when savedConfigs is empty', () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      const icon = screen.getByRole('button', { name: /save configuration/i });
      expect(icon.querySelector('svg')).not.toHaveClass('fill-current');
    });

    it('bookmark icon is filled when savedConfigs has entries', () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[mockConfig]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      const icon = screen.getByRole('button', { name: /save configuration/i });
      expect(icon.querySelector('svg')).toHaveClass('fill-current');
    });

    it('renders a chip for each saved config', () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[mockConfig]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      expect(screen.getByText('Easy Mode')).toBeInTheDocument();
    });

    it('calls onPlayWithConfig when a config chip is clicked', async () => {
      const onPlayWithConfig = vi.fn();
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[mockConfig]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={onPlayWithConfig}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /easy mode/i }));
      expect(onPlayWithConfig).toHaveBeenCalledWith('word-spell', 'cfg-1');
    });

    it('calls onRemoveConfig when the × button on a chip is clicked', async () => {
      const onRemoveConfig = vi.fn();
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[mockConfig]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={onRemoveConfig}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: /remove easy mode/i }));
      expect(onRemoveConfig).toHaveBeenCalledWith('cfg-1');
    });

    it('opens SaveConfigDialog when bookmark icon is clicked', async () => {
      render(
        <GameCard
          entry={mockEntry}
          savedConfigs={[]}
          onSaveConfig={vi.fn()}
          onRemoveConfig={vi.fn()}
          onPlay={vi.fn()}
          onPlayWithConfig={vi.fn()}
        />,
        { wrapper },
      );
      await userEvent.click(
        screen.getByRole('button', { name: /save configuration/i }),
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run to confirm FAIL**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/components/GameCard.test.tsx 2>&1 | tail -10
  ```

  Expected: FAIL — prop type mismatches.

- [ ] **Step 3: Implement updated `GameCard`**

  Replace the entire content of `src/components/GameCard.tsx`:

  ```tsx
  import { BookmarkIcon, XIcon } from 'lucide-react';
  import { useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import type { GameCatalogEntry } from '@/games/registry';
  import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
  import { SaveConfigDialog } from '@/components/SaveConfigDialog';
  import { Button } from '@/components/ui/button';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

  type GameCardProps = {
    entry: GameCatalogEntry;
    savedConfigs: SavedGameConfigDoc[];
    onSaveConfig: (gameId: string, name: string) => Promise<void>;
    onRemoveConfig: (configId: string) => Promise<void>;
    onPlay: (gameId: string) => void;
    onPlayWithConfig: (gameId: string, configId: string) => void;
  };

  const suggestConfigName = (
    gameTitle: string,
    existingNames: string[],
  ): string => {
    if (!existingNames.includes(gameTitle)) return gameTitle;
    let n = 2;
    while (existingNames.includes(`${gameTitle} #${n}`)) n++;
    return `${gameTitle} #${n}`;
  };

  export const GameCard = ({
    entry,
    savedConfigs,
    onSaveConfig,
    onRemoveConfig,
    onPlay,
    onPlayWithConfig,
  }: GameCardProps) => {
    const { t } = useTranslation('games');
    const { t: tCommon } = useTranslation('common');
    const [dialogOpen, setDialogOpen] = useState(false);

    const gameTitle = t(entry.titleKey);
    const existingNames = savedConfigs.map((c) => c.name);
    const suggestedName = suggestConfigName(gameTitle, existingNames);
    const hasConfigs = savedConfigs.length > 0;

    const handleSave = async (name: string) => {
      await onSaveConfig(entry.id, name);
      setDialogOpen(false);
    };

    return (
      <>
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">
                {gameTitle}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tCommon('saveConfig.title')}
                onClick={() => setDialogOpen(true)}
              >
                <BookmarkIcon
                  size={16}
                  className={hasConfigs ? 'fill-current' : ''}
                />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {entry.levels.map((level) => (
                <span
                  key={level}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                >
                  {tCommon(`levels.${level}`)}
                </span>
              ))}
            </div>

            {hasConfigs && (
              <div className="flex flex-wrap gap-1 pt-2">
                {savedConfigs.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center gap-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary"
                  >
                    <button
                      className="pl-2 pr-1 py-0.5"
                      onClick={() => onPlayWithConfig(entry.id, sc.id)}
                      aria-label={sc.name}
                    >
                      {sc.name}
                    </button>
                    <button
                      className="pr-1.5 py-0.5"
                      onClick={() => void onRemoveConfig(sc.id)}
                      aria-label={tCommon('saveConfig.remove', { name: sc.name })}
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <Button className="w-full" onClick={() => onPlay(entry.id)}>
              {tCommon('play')}
            </Button>
          </CardContent>
        </Card>

        <SaveConfigDialog
          open={dialogOpen}
          suggestedName={suggestedName}
          existingNames={existingNames}
          onSave={(name) => void handleSave(name)}
          onCancel={() => setDialogOpen(false)}
        />
      </>
    );
  };
  ```

- [ ] **Step 4: Add missing i18n keys**

  In `src/lib/i18n/locales/en/common.json`, add:

  ```json
  "play": "Play",
  ```

  And inside `saveConfig`:

  ```json
  "remove": "Remove {{name}}"
  ```

  In `src/lib/i18n/locales/pt-BR/common.json`, add:

  ```json
  "play": "Jogar",
  ```

  And inside `saveConfig`:

  ```json
  "remove": "Remover {{name}}"
  ```

- [ ] **Step 5: Run tests to confirm PASS**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn test src/components/GameCard.test.tsx 2>&1 | tail -10
  ```

  Expected: all tests PASS.

- [ ] **Step 6: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/components/GameCard.tsx \
          src/components/GameCard.test.tsx \
          src/lib/i18n/locales/en/common.json \
          src/lib/i18n/locales/pt-BR/common.json
  git commit -m "feat(ui): GameCard with saved config chips and save dialog"
  ```

---

## Task 6: Wire GameGrid + HomeScreen

**Files:**
- Modify: `src/components/GameGrid.tsx`
- Modify: `src/routes/$locale/_app/index.tsx`

- [ ] **Step 1: Update `GameGrid`**

  Replace the entire content of `src/components/GameGrid.tsx`:

  ```tsx
  import { useTranslation } from 'react-i18next';
  import type { GameCatalogEntry } from '@/games/registry';
  import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
  import { GameCard } from '@/components/GameCard';
  import { Button } from '@/components/ui/button';

  type GameGridProps = {
    entries: GameCatalogEntry[];
    savedConfigs: SavedGameConfigDoc[];
    onSaveConfig: (gameId: string, name: string) => Promise<void>;
    onRemoveConfig: (configId: string) => Promise<void>;
    onPlay: (gameId: string) => void;
    onPlayWithConfig: (gameId: string, configId: string) => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };

  export const GameGrid = ({
    entries,
    savedConfigs,
    onSaveConfig,
    onRemoveConfig,
    onPlay,
    onPlayWithConfig,
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
                savedConfigs={savedConfigs.filter((c) => c.gameId === entry.id)}
                onSaveConfig={onSaveConfig}
                onRemoveConfig={onRemoveConfig}
                onPlay={onPlay}
                onPlayWithConfig={onPlayWithConfig}
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

- [ ] **Step 2: Update `HomeScreen` in `src/routes/$locale/_app/index.tsx`**

  Replace the entire file:

  ```tsx
  import {
    createFileRoute,
    useNavigate,
    useParams,
  } from '@tanstack/react-router';
  import { useMemo } from 'react';
  import { useTranslation } from 'react-i18next';
  import type { GameLevel, GameSubject } from '@/games/registry';
  import type { ValidatorAdapter } from '@tanstack/react-router';
  import { GameGrid } from '@/components/GameGrid';
  import { LevelRow } from '@/components/LevelRow';
  import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';
  import { filterCatalog, paginateCatalog, sortByHasSavedConfigs } from '@/games/catalog-utils';
  import { GAME_CATALOG } from '@/games/registry';

  type CatalogSearchInput = {
    search?: string;
    level?: string;
    subject?: string;
    page?: number | string;
  };

  type CatalogSearchOutput = {
    search: string;
    level: string;
    subject: string;
    page: number;
  };

  const catalogSearchValidator: ValidatorAdapter<
    CatalogSearchInput,
    CatalogSearchOutput
  > = {
    types: {
      input: {} as CatalogSearchInput,
      output: {} as CatalogSearchOutput,
    },
    parse: (input: unknown) => {
      const raw = (input ?? {}) as Record<string, unknown>;
      const pageRaw =
        typeof raw.page === 'number' && Number.isFinite(raw.page)
          ? raw.page
          : Number.parseInt(String(raw.page ?? '1'), 10) || 1;
      return {
        search: typeof raw.search === 'string' ? raw.search : '',
        level: typeof raw.level === 'string' ? raw.level : '',
        subject: typeof raw.subject === 'string' ? raw.subject : '',
        page: Math.max(1, pageRaw),
      };
    },
  };

  const PAGE_SIZE = 12;

  const HomeScreen = () => {
    const { t } = useTranslation('common');
    const { level, subject, search, page } = Route.useSearch();
    const { locale } = useParams({ from: '/$locale' });
    const navigate = useNavigate({ from: '/$locale/' });
    const { savedConfigs, gameIdsWithConfigs, save, remove } = useSavedConfigs();

    const filtered = useMemo(
      () => {
        const result = filterCatalog(GAME_CATALOG, {
          search,
          level: level as GameLevel | '',
          subject: subject as GameSubject | '',
        });
        return sortByHasSavedConfigs(result, gameIdsWithConfigs);
      },
      [search, level, subject, gameIdsWithConfigs],
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
        to: '/$locale/game/$gameId',
        params: { locale, gameId },
      });
    };

    const handlePlayWithConfig = (gameId: string, configId: string) => {
      void navigate({
        to: '/$locale/game/$gameId',
        params: { locale, gameId },
        search: { configId },
      });
    };

    const handleSaveConfig = async (gameId: string, name: string) => {
      await save({ gameId, name, config: {} });
    };

    return (
      <div className="px-4 py-2">
        <h1 className="sr-only">{t('home.title')}</h1>
        <LevelRow
          currentLevel={level as GameLevel | ''}
          onLevelChange={(l) => updateSearch({ level: l, page: 1 })}
        />
        <div className="mt-4">
          <GameGrid
            entries={items}
            savedConfigs={savedConfigs}
            onSaveConfig={handleSaveConfig}
            onRemoveConfig={remove}
            onPlay={handlePlay}
            onPlayWithConfig={handlePlayWithConfig}
            page={safePage}
            totalPages={totalPages}
            onPageChange={(p) => updateSearch({ page: p })}
          />
        </div>
      </div>
    );
  };

  export const Route = createFileRoute('/$locale/_app/')({
    validateSearch: catalogSearchValidator,
    component: HomeScreen,
  });
  ```

- [ ] **Step 3: Run typecheck + tests**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn typecheck 2>&1 | tail -10
  yarn test src/routes/ 2>&1 | tail -10
  ```

  Expected: no type errors; tests pass.

- [ ] **Step 4: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add src/components/GameGrid.tsx "src/routes/\$locale/_app/index.tsx"
  git commit -m "feat(home): wire saved configs to GameGrid and HomeScreen"
  ```

---

## Task 7: Game route — load saved config via configId search param

**Files:**
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

When the user taps a config chip, the URL becomes `/$locale/game/word-spell?configId=abc`. The route loader reads this, fetches the saved config from RxDB, and passes it to `GameBody` as `gameSpecificConfig`.

- [ ] **Step 1: Add `validateSearch` and update loader**

  In `src/routes/$locale/_app/game/$gameId.tsx`, add `validateSearch` to the route and update the loader + types to carry `gameSpecificConfig`. Replace the relevant sections:

  ```tsx
  // src/routes/$locale/_app/game/$gameId.tsx
  import { createFileRoute } from '@tanstack/react-router';
  import { nanoid } from 'nanoid';
  import type { NumberMatchConfig } from '@/games/number-match/types';
  import type { WordSpellConfig } from '@/games/word-spell/types';
  import type {
    GameEngineState,
    MoveLog,
    ResolvedContent,
    ResolvedGameConfig,
    SessionMeta,
  } from '@/lib/game-engine/types';
  import type { JSX } from 'react';
  import { GameShell } from '@/components/game/GameShell';
  import { getOrCreateDatabase } from '@/db/create-database';
  import { NumberMatch } from '@/games/number-match/NumberMatch/NumberMatch';
  import { WordSpell } from '@/games/word-spell/WordSpell/WordSpell';
  import { loadGameConfig } from '@/lib/game-engine/config-loader';
  import { findInProgressSession } from '@/lib/game-engine/session-finder';

  const STUB_CONTENT: ResolvedContent = {
    rounds: [
      { id: 'r1', prompt: { en: 'Question 1' }, correctAnswer: 'A' },
      { id: 'r2', prompt: { en: 'Question 2' }, correctAnswer: 'B' },
      { id: 'r3', prompt: { en: 'Question 3' }, correctAnswer: 'C' },
    ],
  };

  const makeDefaultConfig = (gameId: string): ResolvedGameConfig => ({
    gameId,
    title: { en: gameId },
    gradeBand: 'year1-2',
    maxRounds: 3,
    maxRetries: 1,
    maxUndoDepth: 3,
    timerVisible: false,
    timerDurationSeconds: null,
    difficulty: 'medium',
  });

  interface GameRouteLoaderData {
    config: ResolvedGameConfig;
    initialLog: MoveLog | null;
    sessionId: string;
    meta: SessionMeta;
    gameSpecificConfig: Record<string, unknown> | null;
  }

  const NUMBER_MATCH_RANGE = { min: 1, max: 12 } as const;

  const generateRandomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const generateXRounds = (min: number, max: number, x: number): number[] =>
    Array.from({ length: x }, () => generateRandomNumber(min, max));

  const WORD_SPELL_DEFAULT_CONFIG: WordSpellConfig = {
    gameId: 'word-spell',
    component: 'WordSpell',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    roundsInOrder: false,
    ttsEnabled: true,
    mode: 'picture',
    tileUnit: 'letter',
    rounds: [
      { word: 'cat', emoji: '🐱' },
      { word: 'dog', emoji: '🐶' },
      { word: 'sun', emoji: '☀️' },
      { word: 'pin', emoji: '📌' },
      { word: 'sad', emoji: '☹️' },
      { word: 'ant', emoji: '🐜' },
      { word: 'can', emoji: '🥫' },
      { word: 'mum', emoji: '🤱' },
    ],
  };

  const NUMBER_MATCH_DEFAULT_CONFIG: NumberMatchConfig = {
    gameId: 'number-match',
    component: 'NumberMatch',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'distractors',
    distractorCount: 5,
    totalRounds: 3,
    roundsInOrder: false,
    ttsEnabled: true,
    mode: 'numeral-to-group',
    tileStyle: 'dots',
    range: { min: NUMBER_MATCH_RANGE.min, max: NUMBER_MATCH_RANGE.max },
    rounds: generateXRounds(NUMBER_MATCH_RANGE.min, NUMBER_MATCH_RANGE.max, 3).map(
      (value) => ({ value }),
    ),
  };

  const GameBody = ({
    gameId,
    gameSpecificConfig,
  }: {
    gameId: string;
    gameSpecificConfig: Record<string, unknown> | null;
  }): JSX.Element => {
    if (gameId === 'word-spell') {
      const config =
        (gameSpecificConfig as WordSpellConfig | null) ?? WORD_SPELL_DEFAULT_CONFIG;
      return <WordSpell config={config} />;
    }
    if (gameId === 'number-match') {
      const config =
        (gameSpecificConfig as NumberMatchConfig | null) ?? NUMBER_MATCH_DEFAULT_CONFIG;
      return <NumberMatch config={config} />;
    }
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Game component placeholder — real game in M5</p>
      </div>
    );
  };

  export const GameRoute = ({
    config,
    initialLog,
    sessionId,
    meta,
    gameSpecificConfig,
  }: GameRouteLoaderData): JSX.Element => (
    <GameShell
      config={config}
      moves={{}}
      initialState={meta.initialState}
      sessionId={sessionId}
      meta={meta}
      initialLog={initialLog ?? undefined}
    >
      <GameBody gameId={config.gameId} gameSpecificConfig={gameSpecificConfig} />
    </GameShell>
  );

  const RouteComponent = (): JSX.Element => {
    const data = Route.useLoaderData();
    return <GameRoute {...data} />;
  };

  export const Route = createFileRoute('/$locale/_app/game/$gameId')({
    validateSearch: (search: Record<string, unknown>) => ({
      configId:
        typeof search.configId === 'string' ? search.configId : undefined,
    }),
    loader: async ({ params, search }): Promise<GameRouteLoaderData> => {
      const { gameId } = params;
      const profileId = 'default';

      const db = await getOrCreateDatabase();
      const defaultConfig = makeDefaultConfig(gameId);
      const config = await loadGameConfig(
        gameId,
        profileId,
        defaultConfig.gradeBand,
        db,
        defaultConfig,
      );

      const initialLog = await findInProgressSession(profileId, gameId, db);

      let gameSpecificConfig: Record<string, unknown> | null = null;
      if (search.configId) {
        const savedDoc = await db.saved_game_configs
          .findOne(search.configId)
          .exec();
        if (savedDoc) gameSpecificConfig = savedDoc.config;
      }

      const sessionId = initialLog?.sessionId ?? nanoid();
      const seed = initialLog?.seed ?? nanoid();
      const initialContent = initialLog?.initialContent ?? STUB_CONTENT;
      const initialState: GameEngineState = initialLog?.initialState ?? {
        phase: 'instructions',
        roundIndex: 0,
        score: 0,
        streak: 0,
        retryCount: 0,
        content: initialContent,
        currentRound: {
          roundId: initialContent.rounds[0]?.id ?? '',
          answer: null,
          hintsUsed: 0,
        },
      };

      const meta: SessionMeta = {
        profileId,
        gameId,
        gradeBand: config.gradeBand,
        seed,
        initialContent,
        initialState,
      };

      return { config, initialLog, sessionId, meta, gameSpecificConfig };
    },
    component: RouteComponent,
  });
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn typecheck 2>&1 | tail -10
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  git add "src/routes/\$locale/_app/game/\$gameId.tsx"
  git commit -m "feat(route): load saved game config via configId search param"
  ```

---

## Task 8: Final quality gate

- [ ] **Step 1: Run full lint + typecheck + tests**

  ```bash
  cd ./worktrees/feat-word-spell-number-match
  yarn lint 2>&1 | tail -15
  yarn typecheck 2>&1 | tail -10
  yarn test 2>&1 | tail -15
  ```

  Expected: lint clean, no type errors, all tests PASS.

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en`:

  1. Game cards show empty bookmark icons — no configs yet
  2. Click the bookmark icon on "Word Spell" — `SaveConfigDialog` opens with suggested name "Word spell"
  3. Accept or rename, click Save — dialog closes, bookmark icon fills, a chip appears on the card
  4. Click the chip — navigates to `/en/game/word-spell?configId=<id>`, game loads
  5. Click the × on the chip — chip disappears, bookmark icon empties
  6. Save two configs on different games — both appear at the top of the catalog (sorted above unbookmarked games)


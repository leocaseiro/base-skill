# Custom Games and Bookmarks — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the existing "bookmark" concept to "custom game" across the codebase, add a delete action (with confirmation) for custom games, swap the cover badges to a default-vs-custom type indicator, and migrate the RxDB collection from `saved_game_configs` to `custom_games` — all without user-visible data loss.

**Architecture:** Each task either (a) performs a codebase-wide rename with `Edit { replace_all: true }` followed by a typecheck/test gate, or (b) adds genuinely new behaviour (DB schema, boot migration, Delete button, confirmation dialog) using red-green-refactor TDD. The `saved_game_configs` collection remains alive to host `last:*` session-resume docs; only the named variations move to the new `custom_games` collection, and only that rename is user-visible.

**Tech Stack:** React + TypeScript, TanStack Router, RxDB (Dexie in browser, memory in tests), Vitest + Testing Library, Playwright (E2E + VR), lucide-react icons, i18next, Tailwind CSS.

**Scope note:** Phase 2 (the `bookmarks` collection + Star toggles) is spec-only and deferred to a separate PR. This plan implements Phase 1 exclusively.

---

## Pre-flight

Before starting:

- [ ] **Verify worktree.** Confirm `pwd` ends with `worktrees/spec-custom-games-and-bookmarks`. If not, cd into it. All work in this plan happens on the branch `spec/custom-games-and-bookmarks`; never edit or commit on `master`.
- [ ] **Sync.** Run `git fetch origin master && git log --oneline -1 origin/master` to confirm the base is `ba7480da` or later.
- [ ] **Install.** Run `yarn install` if `node_modules` is missing.
- [ ] **Baseline green.** Run `yarn typecheck` and `yarn test` once to confirm master is passing before changes start. Abort and debug if anything fails.

---

## Task 1: Rename `bookmark-colors` → `game-colors`

Pure rename. No behaviour change. The library is imported by many components, so the rename cascades — use `replace_all` across the codebase, then typecheck.

**Files:**

- Rename: `src/lib/bookmark-colors.ts` → `src/lib/game-colors.ts`
- Modify (import + symbol rename): `src/components/AdvancedConfigModal.tsx`, `src/components/GameCard.tsx`, `src/components/GameNameChip.tsx`, `src/components/SaveConfigDialog.tsx`, `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, `src/db/hooks/useSavedConfigs.ts`, `src/routes/$locale/_app/index.tsx`, `src/routes/$locale/_app/game/$gameId.tsx`, `src/stories/ThemeShowcase.stories.tsx`
- Modify (tests referencing the type): `src/components/GameCard.stories.tsx`, `src/components/GameCard.test.tsx`, `src/components/AdvancedConfigModal.test.tsx`, `src/components/GameNameChip.stories.tsx`, `src/components/GameNameChip.test.tsx`

- [ ] **Step 1: Move the file.**

```bash
git mv src/lib/bookmark-colors.ts src/lib/game-colors.ts
```

- [ ] **Step 2: Rename symbols in the moved file.**

Replace the full contents of `src/lib/game-colors.ts` with:

```ts
// src/lib/game-colors.ts
export const GAME_COLOR_KEYS = [
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

export type GameColorKey = (typeof GAME_COLOR_KEYS)[number];

export type ColorTokens = {
  border: string; // used for selected ring in colour picker
  playBg: string; // primary colour — all other uses derived from this via CSS utility classes
  text: string; // contrast-safe colour for text on light card backgrounds (≥3:1 large bold)
};

export const GAME_COLORS: Record<GameColorKey, ColorTokens> = {
  indigo: { border: '#c7d2fe', playBg: '#6366f1', text: '#4338ca' },
  teal: { border: '#99f6e4', playBg: '#14b8a6', text: '#0f766e' },
  rose: { border: '#fecdd3', playBg: '#f43f5e', text: '#be123c' },
  amber: { border: '#fde68a', playBg: '#f59e0b', text: '#b45309' },
  sky: { border: '#bae6fd', playBg: '#0ea5e9', text: '#0369a1' },
  lime: { border: '#d9f99d', playBg: '#84cc16', text: '#4d7c0f' },
  purple: { border: '#e9d5ff', playBg: '#a855f7', text: '#7e22ce' },
  orange: { border: '#fed7aa', playBg: '#f97316', text: '#c2410c' },
  pink: { border: '#fbcfe8', playBg: '#ec4899', text: '#be185d' },
  emerald: { border: '#a7f3d0', playBg: '#10b981', text: '#047857' },
  slate: { border: '#cbd5e1', playBg: '#64748b', text: '#334155' },
  cyan: { border: '#a5f3fc', playBg: '#06b6d4', text: '#0e7490' },
};

export const DEFAULT_GAME_COLOR: GameColorKey = 'indigo';
```

- [ ] **Step 3: Codebase-wide replace import paths.**

Run `Grep` for `@/lib/bookmark-colors` across `src/` to list every importer. For each importer, use `Edit` with `replace_all: true` to rewrite the import path:

- `'@/lib/bookmark-colors'` → `'@/lib/game-colors'`

- [ ] **Step 4: Codebase-wide replace symbol names.**

For each of the files listed under "Modify" above, use `Edit` with `replace_all: true` for each symbol (run them all — missing instances will silently stay on the old name and break typecheck). Apply in this exact order so strings like `BOOKMARK_COLORS` don't partially match before the longer identifier is swapped:

1. `DEFAULT_BOOKMARK_COLOR` → `DEFAULT_GAME_COLOR`
2. `BOOKMARK_COLOR_KEYS` → `GAME_COLOR_KEYS`
3. `BOOKMARK_COLORS` → `GAME_COLORS`
4. `BookmarkColorKey` → `GameColorKey`

- [ ] **Step 5: Typecheck.**

Run: `yarn typecheck`
Expected: PASS (exit 0).

If any TS error like `Cannot find name 'BOOKMARK_COLORS'` appears, grep the file for the old name and repeat Step 4 on it.

- [ ] **Step 6: Run unit tests that touch these files.**

Run:

```bash
yarn vitest run src/components/AdvancedConfigModal.test.tsx src/components/GameCard.test.tsx src/components/GameNameChip.test.tsx src/db/hooks/useSavedConfigs.test.tsx
```

Expected: all PASS.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "refactor(lib): rename bookmark-colors to game-colors

Pure rename — no behavioural change. First step of the custom-games
renaming sweep (see docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md)."
```

---

## Task 2: Rename `suggest-bookmark-name` → `suggest-custom-game-name`

Pure rename of the one-function helper used by `InstructionsOverlay` for the save-on-play dialog.

**Files:**

- Rename: `src/lib/suggest-bookmark-name.ts` → `src/lib/suggest-custom-game-name.ts`
- Rename: `src/lib/suggest-bookmark-name.test.ts` → `src/lib/suggest-custom-game-name.test.ts`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`

- [ ] **Step 1: Move files.**

```bash
git mv src/lib/suggest-bookmark-name.ts src/lib/suggest-custom-game-name.ts
git mv src/lib/suggest-bookmark-name.test.ts src/lib/suggest-custom-game-name.test.ts
```

- [ ] **Step 2: Rename the function in the moved module.**

Replace the body of `src/lib/suggest-custom-game-name.ts` with:

```ts
export const suggestCustomGameName = (
  gameTitle: string,
  existing: readonly string[],
): string => {
  const base = `My ${gameTitle}`;
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} #${n}`)) n++;
  return `${base} #${n}`;
};
```

- [ ] **Step 3: Update the test to import and call the new name.**

In `src/lib/suggest-custom-game-name.test.ts`, use `Edit` with `replace_all: true` to rewrite:

- `from './suggest-bookmark-name'` → `from './suggest-custom-game-name'`
- `suggestBookmarkName` → `suggestCustomGameName`
- `describe('suggestBookmarkName',` → `describe('suggestCustomGameName',`

- [ ] **Step 4: Update the one consumer.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, use `Edit` with `replace_all: true`:

- `from '@/lib/suggest-bookmark-name'` → `from '@/lib/suggest-custom-game-name'`
- `suggestBookmarkName` → `suggestCustomGameName`

- [ ] **Step 5: Run tests and typecheck.**

```bash
yarn vitest run src/lib/suggest-custom-game-name.test.ts
yarn typecheck
```

Expected: test PASSES, typecheck PASSES.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "refactor(lib): rename suggest-bookmark-name to suggest-custom-game-name"
```

---

## Task 3: Rename `lastSessionSavedConfigId` helpers

The key helper for last-session docs keeps its persistence location (`saved_game_configs` collection) but drops `SavedConfig` from its identifier name. The collection-level id prefix `last:…` is unchanged — this is a pure symbol rename.

**Files:**

- Modify: `src/db/last-session-game-config.ts`
- Modify (importers): `src/db/hooks/useSavedConfigs.ts`, `src/db/hooks/useSavedConfigs.test.tsx`, `src/routes/$locale/_app/index.tsx`, `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Rename the symbols in the helper module.**

Replace the full contents of `src/db/last-session-game-config.ts` with:

```ts
/** Matches `useCustomGames` / saved_game_configs.profileId for anonymous play */
export const ANONYMOUS_PROFILE_ID = 'anonymous';

/** Reserved primary key — excluded from custom-game queries, kept in saved_game_configs for resume-last-session. */
export const lastSessionConfigId = (gameId: string): string =>
  `last:${ANONYMOUS_PROFILE_ID}:${gameId}`;

export const isLastSessionConfigId = (id: string): boolean =>
  id.startsWith('last:');
```

- [ ] **Step 2: Replace usages across importers.**

For each importer listed, use `Edit` with `replace_all: true`:

- `lastSessionSavedConfigId` → `lastSessionConfigId`
- `isLastSessionSavedConfigId` → `isLastSessionConfigId`

- [ ] **Step 3: Typecheck + relevant tests.**

```bash
yarn typecheck
yarn vitest run src/db/hooks/useSavedConfigs.test.tsx
```

Expected: both PASS.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "refactor(db): rename lastSessionSavedConfigId helpers to lastSessionConfigId"
```

---

## Task 4: Add the `custom_games` collection

Add the new RxDB collection and its schema. Wire it into `create-database.ts` so it exists in both `createTestDatabase()` and `getOrCreateDatabase()`. Nothing else uses it yet — this task is pure scaffolding validated by schema tests.

**Files:**

- Create: `src/db/schemas/custom_games.ts`
- Create: `src/db/schemas/custom_games.test.ts`
- Modify: `src/db/schemas/index.ts` (re-export), `src/db/types.ts` (collection map), `src/db/create-database.ts` (collection registration), `src/db/create-database.test.ts` (expected collection names)

- [ ] **Step 1: Write the failing schema test.**

Create `src/db/schemas/custom_games.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('custom_games schema v1', () => {
  it('inserts a doc with all required fields', async () => {
    const doc = await db.custom_games.insert({
      id: 'test-id',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Zoo Words',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'amber',
    });
    expect(doc.name).toBe('Zoo Words');
    expect(doc.color).toBe('amber');
  });

  it('accepts an optional cover field', async () => {
    const doc = await db.custom_games.insert({
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
  });

  it('rejects a doc missing required fields', async () => {
    await expect(
      db.custom_games.insert({
        id: 'bad',
        profileId: 'p1',
        gameId: 'word-spell',
        // name, config, createdAt, color missing
      } as unknown as Parameters<typeof db.custom_games.insert>[0]),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `yarn vitest run src/db/schemas/custom_games.test.ts`
Expected: FAIL with something like `Cannot read properties of undefined (reading 'insert')` or `db.custom_games is undefined`.

- [ ] **Step 3: Create the schema file.**

Write `src/db/schemas/custom_games.ts`:

```ts
import type { Cover } from '@/games/cover-type';
import type { JsonSchema, RxJsonSchema } from 'rxdb';

export type CustomGameDoc = {
  id: string;
  profileId: string;
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
  cover?: Cover;
};

export const customGamesSchema: RxJsonSchema<CustomGameDoc> = {
  version: 1,
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
            kind: { type: 'string', const: 'emoji' } as JsonSchema,
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
            kind: { type: 'string', const: 'image' } as JsonSchema,
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

Version is `1` (not `0`) to reserve v0 for any legacy migration hook; we will not actually migrate user data through RxDB's version machinery for this collection — the one-shot copy in Task 5 does that instead.

- [ ] **Step 4: Re-export from the schema barrel.**

In `src/db/schemas/index.ts`, add alongside the other imports and exports (keep alphabetical order within the file — place right below the `saved_game_configs` entries):

```ts
import { customGamesSchema } from './custom_games';
// ...
export { customGamesSchema } from './custom_games';
export type { CustomGameDoc } from './custom_games';
```

And update the `MAX_SCHEMA_VERSION` reducer to include `customGamesSchema.version`:

```ts
export const MAX_SCHEMA_VERSION = Math.max(
  appMetaSchema.version,
  customGamesSchema.version,
  gameConfigOverridesSchema.version,
  // … rest unchanged …
);
```

- [ ] **Step 5: Add the collection to the `BaseSkillCollections` type.**

In `src/db/types.ts`, add the import and map entry:

```ts
import type { CustomGameDoc } from './schemas/custom_games';
// ...
export type BaseSkillCollections = {
  app_meta: RxCollection<AppMetaDoc>;
  custom_games: RxCollection<CustomGameDoc>;
  profiles: RxCollection<ProfileDoc>;
  // … rest unchanged …
};
```

- [ ] **Step 6: Register the collection in `create-database.ts`.**

In `src/db/create-database.ts`, import `customGamesSchema` from the barrel and add the entry to the `COLLECTIONS` object between `app_meta` and `profiles`:

```ts
const COLLECTIONS = {
  app_meta: { schema: appMetaSchema },
  custom_games: { schema: customGamesSchema },
  profiles: { schema: profilesSchema },
  // … existing entries unchanged (including saved_game_configs) …
} as const;
```

- [ ] **Step 7: Extend `create-database.test.ts` to assert the new collection exists.**

In `src/db/create-database.test.ts`, add `'custom_games'` to the `names` array in the `adds all collections` test:

```ts
const names = [
  'app_meta',
  'custom_games',
  'profiles',
  // … existing unchanged …
] as const;
```

- [ ] **Step 8: Run both test files to verify green.**

```bash
yarn vitest run src/db/schemas/custom_games.test.ts src/db/create-database.test.ts
```

Expected: all PASS.

- [ ] **Step 9: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat(db): add custom_games collection and schema

Collection exists and validates, but nothing writes to it yet — the boot
migration in the next commit populates it from saved_game_configs."
```

---

## Task 5: Boot migration — copy + delete

Populate `custom_games` from `saved_game_configs` on first boot, then delete the copied docs from the source. The `last:*` session-resume docs stay in `saved_game_configs` because the simple-mode "resume with last-used settings" flow still reads them from there.

The migration is idempotent: `upsert` on copy, then delete — if the process crashes between steps, a fresh boot re-runs both with no double-insert and no harm.

The `app_meta` schema gains an optional `customGamesMigrated` flag, bumping its version from 0 to 1.

**Files:**

- Modify: `src/db/schemas/app-meta.ts`
- Modify: `src/db/create-database.ts` (migrationStrategies for app_meta)
- Create: `src/db/migrate-custom-games.ts`
- Create: `src/db/migrate-custom-games.test.ts`
- Modify: `src/db/migrations.ts` (call the new migrator inside `checkVersionAndMigrate`)

- [ ] **Step 1: Write the failing migration test.**

Create `src/db/migrate-custom-games.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import {
  ANONYMOUS_PROFILE_ID,
  lastSessionConfigId,
} from '@/db/last-session-game-config';
import { ensureAppMetaSingleton } from '@/db/migrations';
import { migrateCustomGames } from './migrate-custom-games';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  await ensureAppMetaSingleton(db);
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

async function seedSavedConfig(
  id: string,
  overrides: Partial<{ gameId: string; name: string }> = {},
) {
  await db.saved_game_configs.insert({
    id,
    profileId: ANONYMOUS_PROFILE_ID,
    gameId: overrides.gameId ?? 'word-spell',
    name: overrides.name ?? `Config ${id}`,
    config: { totalRounds: 3 },
    color: 'indigo',
    createdAt: new Date().toISOString(),
  });
}

describe('migrateCustomGames', () => {
  it('copies non-last-session docs into custom_games and deletes them from saved_game_configs', async () => {
    await seedSavedConfig('a');
    await seedSavedConfig('b', { name: 'Config b' });
    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id).sort()).toEqual(['a', 'b']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining).toHaveLength(0);
  });

  it('leaves last-session docs (id starts with "last:") in saved_game_configs', async () => {
    await seedSavedConfig('a');
    await db.saved_game_configs.insert({
      id: lastSessionConfigId('word-spell'),
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: '__last_session__',
      config: { totalRounds: 5 },
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id)).toEqual(['a']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining.map((d) => d.id)).toEqual([
      lastSessionConfigId('word-spell'),
    ]);
  });

  it('sets app_meta.customGamesMigrated = true after success', async () => {
    await seedSavedConfig('a');
    await migrateCustomGames(db);
    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta?.customGamesMigrated).toBe(true);
  });

  it('skips work on a second run (idempotent)', async () => {
    await seedSavedConfig('a');
    await migrateCustomGames(db);

    // Re-seed a source doc with the SAME id — if the migration re-ran it would
    // delete this new row. If it skips, the row survives.
    await db.saved_game_configs.insert({
      id: 'a',
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: 'Reinserted',
      config: {},
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining.map((d) => d.id)).toEqual(['a']);
  });

  it('is safe to run repeatedly even if the flag has not yet been set (crash recovery)', async () => {
    await seedSavedConfig('a');
    await seedSavedConfig('b');

    // Pretend we ran copy but not delete + flag — upsert-then-delete is
    // idempotent, so a subsequent full run converges to the same state.
    await db.custom_games.upsert({
      id: 'a',
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: 'Config a',
      config: { totalRounds: 3 },
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id).sort()).toEqual(['a', 'b']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/db/migrate-custom-games.test.ts`
Expected: FAIL (`Cannot find module './migrate-custom-games'` or similar).

- [ ] **Step 3: Extend the `app_meta` schema to include the flag.**

Replace the full contents of `src/db/schemas/app-meta.ts` with:

```ts
import type { RxJsonSchema } from 'rxdb';

export type AppMetaDoc = {
  id: 'singleton';
  appVersion: string;
  rxdbSchemaVersion: number;
  lastMigrationAt: string | null;
  installId: string;
  customGamesMigrated?: boolean;
};

export const appMetaSchema: RxJsonSchema<AppMetaDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    appVersion: {
      type: 'string',
      // eslint-disable-next-line unicorn/prefer-string-raw -- regex is not a string
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
    rxdbSchemaVersion: {
      type: 'integer',
      minimum: 0,
      multipleOf: 1,
    },
    lastMigrationAt: {
      oneOf: [
        { type: 'string', format: 'date-time' },
        { type: 'null' },
      ],
    },
    installId: {
      type: 'string',
      maxLength: 64,
    },
    customGamesMigrated: {
      type: 'boolean',
    },
  },
  required: ['id', 'appVersion', 'rxdbSchemaVersion', 'installId'],
  additionalProperties: false,
};
```

- [ ] **Step 4: Add the migration strategy for app_meta v1.**

In `src/db/create-database.ts`, update the `app_meta` entry in `COLLECTIONS`:

```ts
app_meta: {
  schema: appMetaSchema,
  migrationStrategies: {
    1: (oldDoc: Record<string, unknown>) => oldDoc,
  },
},
```

- [ ] **Step 5: Write the migration function.**

Create `src/db/migrate-custom-games.ts`:

```ts
import { isLastSessionConfigId } from './last-session-game-config';
import type { BaseSkillDatabase } from './types';

/**
 * One-shot migration: copy every non-last-session doc from
 * saved_game_configs into custom_games, then delete it from the source.
 *
 * Idempotent — safe to call on every boot. The flag on app_meta short-
 * circuits subsequent runs; upsert-then-delete makes the flag-unset case
 * safe to retry after a crash.
 */
export async function migrateCustomGames(
  db: BaseSkillDatabase,
): Promise<void> {
  const meta = await db.app_meta.findOne('singleton').exec();
  if (!meta) return; // ensureAppMetaSingleton should have created this — skip quietly
  if (meta.customGamesMigrated === true) return;

  const sourceDocs = await db.saved_game_configs.find().exec();
  const migratable = sourceDocs.filter(
    (d) => !isLastSessionConfigId(d.id),
  );

  for (const source of migratable) {
    await db.custom_games.upsert({
      id: source.id,
      profileId: source.profileId,
      gameId: source.gameId,
      name: source.name,
      config: source.config,
      createdAt: source.createdAt,
      color: source.color,
      ...(source.cover ? { cover: source.cover } : {}),
    });
  }

  for (const source of migratable) {
    await source.remove();
  }

  await meta.incrementalPatch({ customGamesMigrated: true });
}
```

- [ ] **Step 6: Wire the migration into boot.**

In `src/db/migrations.ts`, extend `checkVersionAndMigrate` to call `migrateCustomGames`:

```ts
import { nanoid } from 'nanoid';
import { migrateCustomGames } from './migrate-custom-games';
import { MAX_SCHEMA_VERSION } from './schemas';
import type { BaseSkillDatabase } from './types';

function getAppVersion(): string {
  const v: string = import.meta.env.VITE_APP_VERSION;
  if (typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v)) {
    return v;
  }
  return '0.1.0';
}

export async function ensureAppMetaSingleton(
  db: BaseSkillDatabase,
): Promise<void> {
  const existing = await db.app_meta.findOne('singleton').exec();
  if (existing) {
    return;
  }
  await db.app_meta.insert({
    id: 'singleton',
    appVersion: getAppVersion(),
    rxdbSchemaVersion: MAX_SCHEMA_VERSION,
    lastMigrationAt: null,
    installId: `dev_${nanoid()}`,
  });
}

export async function checkVersionAndMigrate(
  db: BaseSkillDatabase,
): Promise<void> {
  await ensureAppMetaSingleton(db);
  const meta = await db.app_meta.findOne('singleton').exec();
  if (!meta) {
    return;
  }
  if (meta.rxdbSchemaVersion < MAX_SCHEMA_VERSION) {
    await meta.incrementalPatch({
      rxdbSchemaVersion: MAX_SCHEMA_VERSION,
      lastMigrationAt: new Date().toISOString(),
      appVersion: getAppVersion(),
    });
  }
  await migrateCustomGames(db);
}
```

- [ ] **Step 7: Run the migration tests — expect green.**

```bash
yarn vitest run src/db/migrate-custom-games.test.ts
```

Expected: all five tests PASS.

- [ ] **Step 8: Run the wider DB tests to confirm no regressions.**

```bash
yarn vitest run src/db
```

Expected: all PASS. If `migrations.test.ts` fails because `checkVersionAndMigrate` now expects `custom_games` to exist, add a call to `ensureAppMetaSingleton` inside the test (or allow the newly-added migration to no-op on the absent flag).

- [ ] **Step 9: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat(db): migrate saved_game_configs to custom_games on boot

Idempotent copy-and-delete; last:* session docs remain in
saved_game_configs to preserve resume-last-session behaviour."
```

---

## Task 6: Add the `useCustomGames` hook (alongside `useSavedConfigs`)

Create a new hook that queries the new `custom_games` collection and continues to use `saved_game_configs` for `persistLastSessionConfig` + `lastSessionConfigs`. Keep `useSavedConfigs` alive for now — Tasks 7–11 migrate its consumers over, and Task 12 deletes the old hook.

**Files:**

- Create: `src/db/hooks/useCustomGames.ts`
- Create: `src/db/hooks/useCustomGames.test.tsx`

- [ ] **Step 1: Write the failing hook test.**

Create `src/db/hooks/useCustomGames.test.tsx` as a near-copy of `useSavedConfigs.test.tsx`, renamed throughout. The full body:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRxDB } from './useRxDB';
import { useCustomGames } from './useCustomGames';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { lastSessionConfigId } from '@/db/last-session-game-config';
import { DbProvider } from '@/providers/DbProvider';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

const makeWrapper = (testDb: BaseSkillDatabase) => {
  const TestProviders = ({ children }: { children: ReactNode }) => {
    const openDatabase = useCallback(() => Promise.resolve(testDb), []);
    return (
      <DbProvider openDatabase={openDatabase}>{children}</DbProvider>
    );
  };
  return TestProviders;
};

function useCustomGamesReady() {
  const { isReady } = useRxDB();
  const result = useCustomGames();
  return { isReady, ...result };
}

describe('useCustomGames', () => {
  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.customGames).toEqual([]);
  });

  it('save() inserts a new custom game', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: { totalRounds: 3 },
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    expect(result.current.customGames[0]!.name).toBe('Easy Mode');
    expect(result.current.customGames[0]!.gameId).toBe('word-spell');
  });

  it('save() throws when name already exists for same gameId', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
        color: 'indigo',
      });
    });
    await expect(
      act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
          color: 'indigo',
        });
      }),
    ).rejects.toThrow('already exists');
  });

  it('remove() deletes a custom game by id', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    const id = result.current.customGames[0]!.id;
    await act(async () => {
      await result.current.remove(id);
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(0),
    );
  });

  it('update() patches config and optionally renames', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: { totalRounds: 5 },
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    const id = result.current.customGames[0]!.id;
    await act(async () => {
      await result.current.update(
        id,
        { totalRounds: 8 },
        'Easy Mode v2',
      );
    });
    await waitFor(() =>
      expect(result.current.customGames[0]?.name).toBe('Easy Mode v2'),
    );
    expect(result.current.customGames[0]?.config).toEqual({
      totalRounds: 8,
    });
  });

  it('gameIdsWithCustomGames is a Set of gameIds that have at least one custom game', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'WS Config',
        config: {},
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(
        result.current.gameIdsWithCustomGames.has('word-spell'),
      ).toBe(true),
    );
    expect(
      result.current.gameIdsWithCustomGames.has('number-match'),
    ).toBe(false);
  });

  it('persistLastSessionConfig upserts a hidden doc in saved_game_configs and omits it from customGames', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.persistLastSessionConfig('word-spell', {
        mode: 'picture',
      });
    });
    expect(result.current.customGames).toHaveLength(0);
    const raw = await db.saved_game_configs
      .findOne(lastSessionConfigId('word-spell'))
      .exec();
    expect(raw?.config).toMatchObject({ mode: 'picture' });
  });
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/db/hooks/useCustomGames.test.tsx`
Expected: FAIL (`Cannot find module './useCustomGames'`).

- [ ] **Step 3: Implement the hook.**

Create `src/db/hooks/useCustomGames.ts`:

```ts
import { nanoid } from 'nanoid';
import { useCallback, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { CustomGameDoc } from '@/db/schemas/custom_games';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import {
  ANONYMOUS_PROFILE_ID,
  isLastSessionConfigId,
  lastSessionConfigId,
} from '@/db/last-session-game-config';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';

type SaveInput = {
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  color: string;
  cover?: Cover;
};

type UpdateExtras = {
  cover?: Cover;
  color?: GameColorKey;
};

type UseCustomGamesResult = {
  customGames: CustomGameDoc[];
  gameIdsWithCustomGames: Set<string>;
  getByGameId: (gameId: string) => CustomGameDoc[];
  lastSessionConfigs: Record<string, Record<string, unknown>>;
  save: (input: SaveInput) => Promise<string>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  update: (
    id: string,
    config: Record<string, unknown>,
    name?: string,
    extras?: UpdateExtras,
  ) => Promise<void>;
  persistLastSessionConfig: (
    gameId: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
};

export const useCustomGames = (): UseCustomGamesResult => {
  const { db } = useRxDB();

  const customGamesQuery$ = useMemo(
    () =>
      db
        ? db.custom_games.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
            sort: [{ createdAt: 'asc' }],
          }).$
        : EMPTY,
    [db],
  );

  const savedGameConfigsQuery$ = useMemo(
    () =>
      db
        ? db.saved_game_configs.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
          }).$
        : EMPTY,
    [db],
  );

  const customGames = useRxQuery<CustomGameDoc[]>(
    customGamesQuery$,
    [],
  );
  const sessionDocs = useRxQuery<SavedGameConfigDoc[]>(
    savedGameConfigsQuery$,
    [],
  );

  const lastSessionConfigs = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const d of sessionDocs) {
      if (isLastSessionConfigId(d.id)) map[d.gameId] = d.config;
    }
    return map;
  }, [sessionDocs]);

  const gameIdsWithCustomGames = useMemo(
    () => new Set(customGames.map((d) => d.gameId)),
    [customGames],
  );

  const getByGameId = (gameId: string): CustomGameDoc[] =>
    customGames.filter((d) => d.gameId === gameId);

  const save = async ({
    gameId,
    name,
    config,
    color,
    cover,
  }: SaveInput): Promise<string> => {
    if (!db) throw new Error('Database not ready');
    const trimmed = name.trim();
    const namesForGame = customGames
      .filter((d) => d.gameId === gameId)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A custom game named "${trimmed}" already exists for this game`,
      );
    }
    const doc: CustomGameDoc = {
      id: nanoid(21),
      profileId: ANONYMOUS_PROFILE_ID,
      gameId,
      name: trimmed,
      // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone throws on functions; we want them silently dropped
      config: JSON.parse(JSON.stringify(config)) as Record<
        string,
        unknown
      >,
      color,
      createdAt: new Date().toISOString(),
      ...(cover ? { cover } : {}),
    };
    await db.custom_games.insert(doc);
    return doc.id;
  };

  const remove = async (id: string): Promise<void> => {
    if (!db) return;
    const doc = await db.custom_games.findOne(id).exec();
    if (doc) await doc.remove();
  };

  const rename = async (id: string, newName: string): Promise<void> => {
    if (!db) return;
    const doc = await db.custom_games.findOne(id).exec();
    if (!doc) return;
    const trimmed = newName.trim();
    const namesForGame = customGames
      .filter((d) => d.gameId === doc.gameId && d.id !== id)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A custom game named "${trimmed}" already exists for this game`,
      );
    }
    await doc.incrementalPatch({ name: trimmed });
  };

  const update = useCallback(
    async (
      id: string,
      config: Record<string, unknown>,
      name?: string,
      extras?: UpdateExtras,
    ): Promise<void> => {
      if (!db) return;
      const doc = await db.custom_games.findOne(id).exec();
      if (!doc) return;
      const patch: Partial<CustomGameDoc> = {
        // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone throws on functions; we want them silently dropped
        config: JSON.parse(JSON.stringify(config)) as Record<
          string,
          unknown
        >,
      };
      if (name !== undefined) {
        const trimmed = name.trim();
        const siblings = await db.custom_games
          .find({
            selector: {
              gameId: doc.gameId,
              id: { $ne: id },
            },
          })
          .exec();
        const namesForGame = siblings.map((d) => d.name);
        if (namesForGame.includes(trimmed)) {
          throw new Error(
            `A custom game named "${trimmed}" already exists for this game`,
          );
        }
        patch.name = trimmed;
      }
      if (extras?.cover !== undefined) {
        patch.cover = extras.cover;
      }
      if (extras?.color !== undefined) {
        patch.color = extras.color;
      }
      await doc.incrementalPatch(patch);
    },
    [db],
  );

  const persistLastSessionConfig = useCallback(
    async (gameId: string, config: Record<string, unknown>) => {
      if (!db) return;
      const id = lastSessionConfigId(gameId);
      const now = new Date().toISOString();
      const existing = await db.saved_game_configs.findOne(id).exec();
      await (existing
        ? existing.incrementalPatch({ config, createdAt: now })
        : db.saved_game_configs.insert({
            id,
            profileId: ANONYMOUS_PROFILE_ID,
            gameId,
            name: '__last_session__',
            config,
            color: 'indigo',
            createdAt: now,
          }));
    },
    [db],
  );

  return {
    customGames,
    gameIdsWithCustomGames,
    getByGameId,
    lastSessionConfigs,
    save,
    remove,
    rename,
    update,
    persistLastSessionConfig,
  };
};
```

- [ ] **Step 4: Run the hook test — expect green.**

```bash
yarn vitest run src/db/hooks/useCustomGames.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Typecheck.**

Run: `yarn typecheck`
Expected: PASS (the old hook still exists and is still referenced, so everything compiles).

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "feat(db): add useCustomGames hook

Parallels useSavedConfigs but queries the new custom_games collection.
Callers migrate to the new hook in the next commits."
```

---

## Task 7: Migrate `GameCard` to the `customGame` variant + new badge icons

Swap the discriminator `variant: 'bookmark'` to `variant: 'customGame'`, rename props, and replace the cover badge: default cards gain a `CircleDashed` icon; custom-game cards gain `CircleDot` (replacing `BookmarkIcon`). The cog button is untouched.

**Files:**

- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/GameCard.test.tsx`
- Modify: `src/components/GameCard.stories.tsx`

- [ ] **Step 1: Update the failing test to target the new API.**

Replace the full contents of `src/components/GameCard.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders a default card with chips, cog, Play, and the default type badge', () => {
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
    // Default type indicator: CircleDashed icon
    expect(
      document.querySelector('[data-card-type="default"]'),
    ).not.toBeNull();
  });

  it('renders a custom-game variant with the custom type badge and the saved name as heading', () => {
    render(
      <GameCard
        variant="customGame"
        gameId="sort-numbers"
        title="Count in Order"
        customGameName="Skip by 2"
        customGameColor="amber"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('Skip by 2')).toBeInTheDocument();
    expect(
      document.querySelector('[data-card-type="custom"]'),
    ).not.toBeNull();
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

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/components/GameCard.test.tsx`
Expected: FAIL. The old code still has `variant: 'bookmark'`, so TypeScript compilation of the test should fail on `variant="customGame"` and `customGameName`/`customGameColor`.

- [ ] **Step 3: Replace the full contents of `src/components/GameCard.tsx` with:**

```tsx
import { CircleDashed, CircleDot, SettingsIcon } from 'lucide-react';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';
import { GAME_COLORS } from '@/lib/game-colors';

type Common = {
  gameId: string;
  title: string;
  chips: string[];
  cover?: Cover;
  onPlay: () => void;
  onOpenCog: () => void;
};

type DefaultVariant = Common & { variant: 'default' };
type CustomGameVariant = Common & {
  variant: 'customGame';
  customGameName: string;
  customGameColor: GameColorKey;
};

type GameCardProps = DefaultVariant | CustomGameVariant;

export const GameCard = (props: GameCardProps): JSX.Element => {
  const { gameId, title, chips, onPlay, onOpenCog } = props;
  const cover =
    props.cover === undefined
      ? resolveDefaultCover(gameId)
      : props.cover;

  const isCustom = props.variant === 'customGame';
  const headingText = isCustom ? props.customGameName : title;
  const subtitleText = isCustom ? title : undefined;
  const badgeBg = isCustom
    ? GAME_COLORS[props.customGameColor].playBg
    : undefined;

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm"
      data-card-type={isCustom ? 'custom' : 'default'}
    >
      <button
        type="button"
        aria-label={`Play ${headingText}`}
        onClick={onPlay}
        className="flex flex-col text-left active:scale-[0.98]"
      >
        <div className="relative p-2">
          <GameCover cover={cover} size="card" />
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs shadow"
            style={{
              background: badgeBg ?? 'rgb(255 255 255 / 70%)',
              color: isCustom ? 'white' : 'var(--muted-foreground)',
            }}
          >
            {isCustom ? (
              <CircleDot size={14} />
            ) : (
              <CircleDashed size={14} />
            )}
          </span>
        </div>

        <div className="flex flex-col gap-1 px-3 pb-3">
          <h2 className="text-sm font-bold leading-tight text-foreground">
            {headingText}
          </h2>
          {subtitleText && (
            <p className="text-xs italic text-muted-foreground">
              {subtitleText}
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
        </div>
      </button>

      <button
        type="button"
        aria-label="Settings"
        onClick={onOpenCog}
        className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow"
      >
        <SettingsIcon size={14} />
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Update the stories file.**

Replace the full contents of `src/components/GameCard.stories.tsx` with:

```tsx
import { GameCard } from './GameCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    gameId: 'sort-numbers',
    title: 'Count in Order',
    chips: ['🚀 Up', '5 numbers', '2s'],
  },
  argTypes: {
    onPlay: { action: 'played' },
    onOpenCog: { action: 'cogOpened' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const CustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
  },
};

export const CustomGamePurple: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Big to Small',
    customGameColor: 'purple',
    chips: ['⬇️ Down', '10 numbers', '3s'],
  },
};
```

- [ ] **Step 5: Run the test — expect green.**

Run: `yarn vitest run src/components/GameCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck.**

Run: `yarn typecheck`

Expected: FAIL. `src/routes/$locale/_app/index.tsx` still passes `variant="bookmark"` and `bookmarkName`/`bookmarkColor`. Tasks 10/11 fix those; for now, comment out the broken JSX or leave the typecheck failing — but do NOT commit until it's green. Instead, finish Steps 7–8 below to patch the one remaining consumer just enough to compile.

- [ ] **Step 7: Patch `src/routes/$locale/_app/index.tsx` to compile.**

Use `Edit` with `replace_all: true` inside `src/routes/$locale/_app/index.tsx`:

- `variant="bookmark"` → `variant="customGame"`
- `bookmarkName=` → `customGameName=`
- `bookmarkColor=` → `customGameColor=`

Leave the rest of that file alone — the full route migration happens in Task 10.

- [ ] **Step 8: Typecheck + unit tests.**

```bash
yarn typecheck
yarn vitest run src/components/GameCard.test.tsx
```

Expected: both PASS.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "refactor(game-card): replace bookmark variant with customGame

New default/custom type indicator uses CircleDashed / CircleDot from
lucide-react. Home route consumers use the new prop names."
```

---

## Task 8: Migrate `AdvancedConfigModal` mode + add Delete button with confirmation

Three things happen here:

1. Rename `mode.kind: 'bookmark'` to `'customGame'`, and rename every prop/variable that says "bookmark" to "customGame".
2. Add an `onDelete` prop + a visible Delete button (destructive outline, lucide `Trash2`) only when `mode.kind === 'customGame'`.
3. Open a nested confirmation `Dialog` when Delete is clicked; on confirm, call `onDelete(configId)` and close both dialogs.

**Files:**

- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`

- [ ] **Step 1: Extend the failing test to cover the new behaviour.**

Replace the full contents of `src/components/AdvancedConfigModal.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const customGameMode = {
  kind: 'customGame' as const,
  configId: 'abc',
  name: 'Skip by 2',
  color: 'amber' as const,
  cover: undefined,
};

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a custom game', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{ direction: 'ascending' }}
        onCancel={() => {}}
        onUpdate={vi.fn()}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
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
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /update/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('does not save with an empty name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        config={{}}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please enter a custom game name/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/skip by 2/i)).toHaveFocus();
  });

  it('does not save with a duplicate name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        config={{}}
        existingCustomGameNames={['Skip by 2']}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    const input = screen.getByPlaceholderText(/skip by 2/i);
    await user.type(input, 'Skip by 2');
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/custom game with that name already exists/i),
    ).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('allows "Update" to keep the same name without flagging a duplicate', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{ direction: 'ascending' }}
        existingCustomGameNames={['Skip by 2', 'Other']}
        onCancel={() => {}}
        onUpdate={onUpdate}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    );
    expect(onUpdate).toHaveBeenCalled();
  });

  it('does NOT render a Delete button for default mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /^delete$/i }),
    ).toBeNull();
  });

  it('renders a Delete button for customGame mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it('opens a confirmation dialog when Delete is clicked; Cancel keeps the modal open and does not call onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(
      screen.getByText(/delete "skip by 2"\?/i),
    ).toBeInTheDocument();
    await user.click(
      screen
        .getByRole('button', { name: /^cancel$/i })
        .closest('button') ??
        screen.getByRole('button', { name: /^cancel$/i }),
    );
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete with the configId and closes the modal on Confirm', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={onOpenChange}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    // Confirmation dialog's destructive button has label "Delete"
    const confirms = screen.getAllByRole('button', {
      name: /^delete$/i,
    });
    // The second "Delete" is the confirmation button inside the nested dialog
    await user.click(confirms[confirms.length - 1]!);
    expect(onDelete).toHaveBeenCalledWith('abc');
  });
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: FAIL. Type errors on `mode={{ kind: 'customGame', … }}` and `existingCustomGameNames`, plus the three new Delete tests.

- [ ] **Step 3: Rewrite `src/components/AdvancedConfigModal.tsx`.**

Replace the full contents with:

```tsx
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
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
  DEFAULT_GAME_COLOR,
  GAME_COLOR_KEYS,
  GAME_COLORS,
} from '@/lib/game-colors';

export type AdvancedConfigModalMode =
  | { kind: 'default' }
  | {
      kind: 'customGame';
      configId: string;
      name: string;
      color: GameColorKey;
      cover: Cover | undefined;
    };

type SavePayload = {
  configId?: string;
  name: string;
  color: GameColorKey;
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
  /** Invoked when the user confirms deletion of the current custom game. */
  onDelete?: (configId: string) => Promise<void> | void;
  /** Names of existing custom games for this game — used to surface duplicate-name errors inline. */
  existingCustomGameNames?: readonly string[];
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
  onDelete,
  existingCustomGameNames = [],
}: AdvancedConfigModalProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [config, setConfig] =
    useState<Record<string, unknown>>(initialConfig);
  const [cover, setCover] = useState<Cover | undefined>(
    mode.kind === 'customGame' ? mode.cover : undefined,
  );
  const [name, setName] = useState<string>(
    mode.kind === 'customGame' ? mode.name : '',
  );
  const [color, setColor] = useState<GameColorKey>(
    mode.kind === 'customGame' ? mode.color : DEFAULT_GAME_COLOR,
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fields = getAdvancedConfigFields(gameId);

  const trimmedName = name.trim();
  const currentCustomGameName =
    mode.kind === 'customGame' ? mode.name : null;
  const namesTaken = new Set(
    existingCustomGameNames.filter((n) => n !== currentCustomGameName),
  );

  const nameError: string | null = (() => {
    if (trimmedName === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a custom game name.',
      });
    if (namesTaken.has(trimmedName))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A custom game with that name already exists.',
      });
    return null;
  })();

  const saveNewInvalid = nameError !== null;
  const updateIsRename =
    currentCustomGameName !== null &&
    trimmedName !== currentCustomGameName;
  const updateInvalid = updateIsRename && nameError !== null;
  const showNameError = submitAttempted && nameError !== null;

  const payload: SavePayload = {
    configId: mode.kind === 'customGame' ? mode.configId : undefined,
    name: trimmedName,
    color,
    cover,
    config,
  };

  const handleSaveNew = () => {
    setSubmitAttempted(true);
    if (saveNewInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onSaveNew(payload);
  };

  const handleUpdate = () => {
    if (!onUpdate) return;
    setSubmitAttempted(true);
    if (updateInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onUpdate(payload);
  };

  const handleConfirmDelete = () => {
    if (mode.kind !== 'customGame' || !onDelete) return;
    void (async () => {
      try {
        await onDelete(mode.configId);
      } finally {
        setConfirmDeleteOpen(false);
        onOpenChange(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === 'customGame'
              ? mode.name
              : 'Advanced settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CoverPicker value={cover} onChange={setCover} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {t('instructions.customGameNameLabel', {
                defaultValue: 'Custom game name',
              })}
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skip by 2"
              aria-invalid={showNameError}
              aria-describedby={
                showNameError ? 'custom-game-name-error' : undefined
              }
              className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                showNameError ? 'border-destructive' : 'border-input'
              }`}
            />
            {showNameError && (
              <span
                id="custom-game-name-error"
                role="alert"
                className="text-xs font-semibold text-destructive"
              >
                {nameError}
              </span>
            )}
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
              {GAME_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: GAME_COLORS[key].playBg,
                    borderColor:
                      color === key
                        ? GAME_COLORS[key].playBg
                        : 'transparent',
                    outline:
                      color === key ? '3px solid white' : undefined,
                    outlineOffset: color === key ? '-4px' : undefined,
                    boxShadow:
                      color === key
                        ? `0 0 0 2px ${GAME_COLORS[key].playBg}`
                        : undefined,
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

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {mode.kind === 'customGame' && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-destructive bg-background px-3 py-2 text-sm font-semibold text-destructive"
              >
                <Trash2 size={14} aria-hidden="true" />
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
            >
              {t('instructions.cancel', { defaultValue: 'Cancel' })}
            </button>
            {mode.kind === 'customGame' && onUpdate && (
              <button
                type="button"
                onClick={handleUpdate}
                aria-disabled={updateInvalid}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateCustomGame', {
                  name: mode.name,
                  defaultValue: `Update "${mode.name}"`,
                })}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveNew}
              aria-disabled={saveNewInvalid}
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

      {mode.kind === 'customGame' && onDelete && (
        <Dialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('instructions.deleteConfirmTitle', {
                  name: mode.name,
                  defaultValue: `Delete "${mode.name}"?`,
                })}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t('instructions.deleteConfirmBody', {
                defaultValue:
                  "This custom game will be removed. You can't undo this.",
              })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
              >
                {t('instructions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground"
              >
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
```

- [ ] **Step 4: Run the test — expect green.**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: all 9 tests PASS.

- [ ] **Step 5: Typecheck.**

Run: `yarn typecheck`

Expected: FAIL because `InstructionsOverlay`, `index.tsx`, and `$gameId.tsx` all still pass `mode.kind === 'bookmark'` / `existingBookmarkNames`. Tasks 9–11 fix those.

- [ ] **Step 6: Minimal patches so the project compiles.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, use `Edit` with `replace_all: true`:

- `kind: 'bookmark'` → `kind: 'customGame'`
- `existingBookmarkNames=` → `existingCustomGameNames=`
- `existingBookmarkNames={` → `existingCustomGameNames={`

In `src/routes/$locale/_app/index.tsx`, use `Edit` with `replace_all: true`:

- `kind: 'bookmark'` → `kind: 'customGame'`
- `existingBookmarkNames=` → `existingCustomGameNames=`
- `existingBookmarkNames:` → `existingCustomGameNames:`

These renames are minimal — the deeper prop migration happens in Tasks 9–11.

- [ ] **Step 7: Typecheck + full test suite on touched files.**

```bash
yarn typecheck
yarn vitest run src/components/AdvancedConfigModal.test.tsx src/components/GameCard.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add -A
git commit -m "feat(modal): customGame mode + Delete action with confirmation

Adds onDelete prop and a nested confirmation dialog; Delete button is
visible only when editing an existing custom game."
```

---

## Task 9: Migrate `InstructionsOverlay` props and copy

Rename all `bookmark*` props to `customGame*`, rename `SaveBookmarkInput` → `SaveCustomGameInput`, rename `onSaveBookmark`/`onUpdateBookmark` → `onSaveCustomGame`/`onUpdateCustomGame`, and update the save-on-play dialog copy.

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`

- [ ] **Step 1: Update the failing test fixture first.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`, use `Edit` with `replace_all: true`:

- `onSaveBookmark:` → `onSaveCustomGame:`
- `onSaveBookmark=` → `onSaveCustomGame=`
- `'instructions.saveOnPlayTitle':` leaves key unchanged, but update the default copy string:
  - `'Save these settings as a bookmark?'` → `'Save these settings as a custom game?'`
- `'instructions.saveOnPlayNameLabel':` string value:
  - `'Bookmark name'` → `'Custom game name'`
- `'instructions.saveAsNew':` value:
  - `'Save as new bookmark'` → `'Save as new custom game'`

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: FAIL (missing export `onSaveCustomGame`, etc.).

- [ ] **Step 3: Rewrite the overlay props + usages.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, use `Edit` (sometimes with `replace_all: true`, sometimes targeted when unique) to apply the following renames in order. Each rename is independent; typecheck after all are applied.

Type-level renames:

- `SaveBookmarkInput` → `SaveCustomGameInput`

Prop renames (apply both as identifier usages and destructuring keys):

- `bookmarkId` → `customGameId`
- `bookmarkName` → `customGameName`
- `bookmarkColor` → `customGameColor`
- `onSaveBookmark` → `onSaveCustomGame`
- `onUpdateBookmark` → `onUpdateCustomGame`
- `existingBookmarkNames` → `existingCustomGameNames`

Copy-string renames inside `t(...)` default-value fallbacks:

- `'Please enter a bookmark name.'` → `'Please enter a custom game name.'`
- `'A bookmark with that name already exists.'` → `'A custom game with that name already exists.'`
- `'Save these settings as a bookmark?'` → `'Save these settings as a custom game?'`
- `'Bookmark name'` → `'Custom game name'`
- `'Save as new bookmark'` → `'Save as new custom game'`

Colour lookup rename (already imported under the new name from Task 1):

- `settingsColors` continues to come from `GAME_COLORS[customGameColor]`.

- [ ] **Step 4: Update the stories file.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`, apply the same prop renames via `Edit` with `replace_all: true`.

- [ ] **Step 5: Run the test — expect green.**

```bash
yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Typecheck.**

Run: `yarn typecheck`

Expected: FAIL because `$gameId.tsx` still passes `bookmarkId`/`bookmarkName` etc. Patch it minimally now.

- [ ] **Step 7: Minimal patch of `src/routes/$locale/_app/game/$gameId.tsx`.**

Use `Edit` with `replace_all: true`:

- `bookmarkId` → `customGameId`
- `bookmarkName` → `customGameName`
- `bookmarkColor` → `customGameColor`
- `bookmarkCover` → `customGameCover`
- `onSaveBookmark` → `onSaveCustomGame`
- `onUpdateBookmark` → `onUpdateCustomGame`
- `existingBookmarkNames` → `existingCustomGameNames`

The full loader / wiring refactor happens in Task 11; this is only enough to typecheck.

- [ ] **Step 8: Typecheck + targeted tests.**

```bash
yarn typecheck
yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "refactor(instructions-overlay): rename bookmark props to customGame"
```

---

## Task 10: Migrate the home route

Swap `useSavedConfigs` → `useCustomGames`; rename the local `bookmarks` list → `customGameCards`; rename `openBookmarkCog` / `handlePlayBookmark`; wire the new `onDelete` prop on `AdvancedConfigModal`.

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`

- [ ] **Step 1: Rewrite the file.**

Replace the full contents of `src/routes/$locale/_app/index.tsx` with:

```tsx
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomGameDoc } from '@/db/schemas/custom_games';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCard } from '@/components/GameCard';
import { GameGrid } from '@/components/GameGrid';
import { getOrCreateDatabase } from '@/db/create-database';
import { useCustomGames } from '@/db/hooks/useCustomGames';
import { lastSessionConfigId } from '@/db/last-session-game-config';
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
            kind: 'customGame';
            configId: string;
            name: string;
            color: GameColorKey;
            cover: Cover | undefined;
          };
      config: Record<string, unknown>;
    };

const HomeScreen = (): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate({ from: '/$locale/' });
  const { customGames, save, update, remove, lastSessionConfigs } =
    useCustomGames();
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const handlePlayDefault = (gameId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId: undefined },
    });
  };

  const handlePlayCustomGame = (gameId: string, configId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId },
    });
  };

  const openDefaultCog = async (gameId: string) => {
    const db = await getOrCreateDatabase();
    const lastDoc = await db.saved_game_configs
      .findOne(lastSessionConfigId(gameId))
      .exec();
    setModal({
      kind: 'open',
      gameId,
      mode: { kind: 'default' },
      config: lastDoc?.config ?? {},
    });
  };

  const openCustomGameCog = (gameId: string, doc: CustomGameDoc) => {
    setModal({
      kind: 'open',
      gameId,
      mode: {
        kind: 'customGame',
        configId: doc.id,
        name: doc.name,
        color: doc.color as GameColorKey,
        cover: doc.cover,
      },
      config: doc.config,
    });
  };

  const defaults = GAME_CATALOG.map((entry) => (
    <GameCard
      key={`default-${entry.id}`}
      variant="default"
      gameId={entry.id}
      title={t(entry.titleKey)}
      chips={configToChips(
        entry.id,
        lastSessionConfigs[entry.id] ?? {},
      )}
      onPlay={() => handlePlayDefault(entry.id)}
      onOpenCog={() => void openDefaultCog(entry.id)}
    />
  ));
  const customCards = customGames.flatMap((doc) => {
    const entry = GAME_CATALOG.find((g) => g.id === doc.gameId);
    if (!entry) return [];
    return [
      <GameCard
        key={`custom-${doc.id}`}
        variant="customGame"
        gameId={doc.gameId}
        title={t(entry.titleKey)}
        customGameName={doc.name}
        customGameColor={doc.color as GameColorKey}
        cover={doc.cover}
        chips={configToChips(doc.gameId, doc.config)}
        onPlay={() => handlePlayCustomGame(doc.gameId, doc.id)}
        onOpenCog={() => openCustomGameCog(doc.gameId, doc)}
      />,
    ];
  });
  const cards = [...defaults, ...customCards];

  return (
    <div className="px-4 py-4">
      <h1 className="sr-only">{t('common:home.title')}</h1>
      <GameGrid cards={cards} />

      {modal.kind === 'open' && (
        <AdvancedConfigModal
          open
          onOpenChange={(next) => {
            if (!next) setModal({ kind: 'closed' });
          }}
          gameId={modal.gameId}
          mode={modal.mode}
          config={modal.config}
          existingCustomGameNames={customGames
            .filter((d) => d.gameId === modal.gameId)
            .map((d) => d.name)}
          onCancel={() => setModal({ kind: 'closed' })}
          onUpdate={async (payload) => {
            if (payload.configId) {
              await update(
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
          onDelete={async (configId) => {
            await remove(configId);
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

- [ ] **Step 2: Typecheck.**

Run: `yarn typecheck`

Expected: FAIL — the game route still imports `useSavedConfigs`. That gets fixed in Task 11. For now, confirm the error is ONLY in `src/routes/$locale/_app/game/$gameId.tsx`, not in this file.

- [ ] **Step 3: Commit.**

```bash
git add -A
git commit -m "refactor(home-route): swap useSavedConfigs for useCustomGames + wire onDelete"
```

---

## Task 11: Migrate the game route

Swap `useSavedConfigs` → `useCustomGames`; rename every `bookmark*` local variable in the loader + body components to `customGame*`; wire Delete on the game route so that confirming from `/$locale/game/$gameId?configId=X` strips `configId` from search params (dropping the user back on the default variant) after the RxDB row is removed.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.test.tsx`

- [ ] **Step 1: Replace the three game-body components + the loader.**

In `src/routes/$locale/_app/game/$gameId.tsx`, apply these renames via `Edit`:

Hook + API:

- `import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';` → `import { useCustomGames } from '@/db/hooks/useCustomGames';`
- `useSavedConfigs()` → `useCustomGames()`
- `const { save, updateConfig, savedConfigs } = …` → `const { save, update, remove, customGames } = …`
- `savedConfigs` → `customGames` (everywhere)
- `updateConfig(` → `update(`

Helper rename:

- `lastSessionSavedConfigId(` → `lastSessionConfigId(` (already done in Task 3 but double-check)

Loader field types — rewrite the `GameRouteLoaderData` interface and the return type at the bottom:

```ts
interface GameRouteLoaderData {
  config: ResolvedGameConfig;
  initialLog: MoveLog | null;
  draftState: AnswerGameDraftState | null;
  sessionId: string;
  seed: string;
  meta: SessionMeta;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
}
```

Loader source rows — where it reads from `db.saved_game_configs` with a `deps.configId`, route that read through `db.custom_games`:

```ts
if (deps.configId) {
  const savedDoc = await db.custom_games.findOne(deps.configId).exec();
  if (savedDoc) {
    gameSpecificConfig = savedDoc.config;
    customGameId = savedDoc.id;
    customGameName = savedDoc.name;
    customGameColor = savedDoc.color;
    customGameCover = savedDoc.cover ?? null;
  }
}
```

(The `lastSessionConfigId` branch keeps reading `db.saved_game_configs` — last-session docs stay there.)

Body-component prop rename:

- `bookmarkId` → `customGameId`
- `bookmarkName` → `customGameName`
- `bookmarkColor` → `customGameColor`
- `bookmarkCover` → `customGameCover`

Add a `handleDelete` prop pass-through. Each of the three body components (`SortNumbersGameBody`, `WordSpellGameBody`, `NumberMatchGameBody`) already accepts `customGameId`. Pass the route `navigate` + `remove` down so each can satisfy the `onDelete` prop on `InstructionsOverlay`. Implementation: on deletion, call `await remove(customGameId)` and then `await navigate({ search: (prev) => ({ ...prev, configId: undefined }) })`.

The `InstructionsOverlay` accepts a new optional prop `onDeleteCustomGame?: (configId: string) => Promise<void>` wired through to `AdvancedConfigModal.onDelete`. Add this prop now in `InstructionsOverlay.tsx`:

```tsx
// In InstructionsOverlayProps:
onDeleteCustomGame?: (configId: string) => Promise<void>;

// When rendering <AdvancedConfigModal …>:
onDelete={
  customGameId && onDeleteCustomGame
    ? (id) => onDeleteCustomGame(id)
    : undefined
}
```

In each body component (SortNumbers, WordSpell, NumberMatch), wire the new prop:

```tsx
onDeleteCustomGame={
  customGameId
    ? async (id) => {
        await remove(id);
        await navigate({
          search: (prev) => ({ ...prev, configId: undefined }),
        });
      }
    : undefined
}
```

Keep `navigate` created with `useNavigate({ from: '/$locale/game/$gameId' })`.

- [ ] **Step 2: Patch the game-route unit test.**

In `src/routes/$locale/_app/game/$gameId.test.tsx`, use `Edit` with `replace_all: true`:

- `bookmarkId` → `customGameId`
- `bookmarkName` → `customGameName`
- `bookmarkColor` → `customGameColor`
- `bookmarkCover` → `customGameCover`

If the test used `db.saved_game_configs.insert` with a non-last-session id (e.g. a test fixture bookmark doc), change it to `db.custom_games.insert` to match the new loader source.

- [ ] **Step 3: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 4: Run the game-route test.**

```bash
yarn vitest run 'src/routes/**/*.test.*'
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "refactor(game-route): swap useSavedConfigs for useCustomGames + strip configId on delete"
```

---

## Task 12: Remove the old `useSavedConfigs` hook + clean up residual references

The old hook is no longer imported by any route or component. Remove it together with its test, and update the remaining bookmark-labelled consumers that still compile (they only reference the colour lib, not the hook).

**Files:**

- Delete: `src/db/hooks/useSavedConfigs.ts`
- Delete: `src/db/hooks/useSavedConfigs.test.tsx`
- Modify: `src/db/hooks/usePersistLastGameConfig.ts` (switch import)
- Modify: `src/components/GameNameChip.tsx` and `src/components/GameNameChip.test.tsx` / `.stories.tsx` (rename `bookmarkName`/`bookmarkColor` → `customGameName`/`customGameColor`; types already renamed in Task 1)
- Modify: `src/components/SaveConfigDialog.tsx` (rename `BookmarkColorKey` references — already renamed in Task 1; confirm the file now uses the new names)

- [ ] **Step 1: Confirm no route/component still imports `useSavedConfigs`.**

```bash
yarn grep -l "useSavedConfigs" src/ || true
```

Expected: prints only `src/db/hooks/useSavedConfigs.ts`, `src/db/hooks/useSavedConfigs.test.tsx`, and `src/db/hooks/usePersistLastGameConfig.ts`.

- [ ] **Step 2: Update `usePersistLastGameConfig.ts` to use `useCustomGames`.**

Replace the full contents with:

```ts
import { useEffect, useRef } from 'react';
import { useCustomGames } from './useCustomGames';

/**
 * Debounced write of the current in-game settings to IndexedDB so "Play" from
 * the home screen without a named save restores the last panel state. Also
 * flushes the latest config when the game body unmounts (e.g. navigating home).
 */
export const usePersistLastGameConfig = (
  gameId: string,
  config: Record<string, unknown>,
): void => {
  const { persistLastSessionConfig } = useCustomGames();
  const latestRef = useRef({ gameId, config });

  const serialized = JSON.stringify(config);

  useEffect(() => {
    latestRef.current = {
      gameId,
      config: JSON.parse(serialized) as Record<string, unknown>,
    };
  }, [gameId, serialized]);

  useEffect(() => {
    const payload = JSON.parse(serialized) as Record<string, unknown>;
    const handle = globalThis.setTimeout(() => {
      void persistLastSessionConfig(gameId, payload);
    }, 300);

    return () => globalThis.clearTimeout(handle);
  }, [gameId, serialized, persistLastSessionConfig]);

  useEffect(
    () => () => {
      const { gameId: gid, config: latest } = latestRef.current;
      void persistLastSessionConfig(gid, latest);
    },
    [gameId, persistLastSessionConfig],
  );
};
```

- [ ] **Step 3: Rename props in `GameNameChip`.**

In `src/components/GameNameChip.tsx`, use `Edit` with `replace_all: true`:

- `bookmarkName` → `customGameName`
- `bookmarkColor` → `customGameColor`
- `GameNameChipProps.bookmarkName` descriptor stays the same since prop renames cascade.

Apply the same renames to `src/components/GameNameChip.test.tsx` and `src/components/GameNameChip.stories.tsx`.

- [ ] **Step 4: Delete the old hook and its test.**

```bash
git rm src/db/hooks/useSavedConfigs.ts src/db/hooks/useSavedConfigs.test.tsx
```

- [ ] **Step 5: Typecheck + run tests.**

```bash
yarn typecheck
yarn vitest run src/db src/components
```

Expected: all PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "refactor(db): drop useSavedConfigs in favour of useCustomGames

usePersistLastGameConfig now pulls persistLastSessionConfig from the new
hook. GameNameChip prop names follow the customGame* convention."
```

---

## Task 13: Rename CSS custom property + utility classes

Swap the `--bookmark-play` variable and `.bookmark-{bg,tag-bg,text}` utility classes to `--game-play` and `.game-{bg,tag-bg,text}`. Update the two consumers (`GameNameChip`, `SaveConfigDialog`).

**Files:**

- Modify: `src/styles.css`
- Modify: `src/components/GameNameChip.tsx`
- Modify: `src/components/SaveConfigDialog.tsx`

- [ ] **Step 1: Rewrite the stylesheet block.**

In `src/styles.css`, replace the block from line 565 to line 593 (the `/* Bookmark colour utilities */` block) with:

```css
/* Game colour utilities — derived from --game-play set per-component */
.game-bg {
  background: color-mix(in srgb, var(--game-play) 12%, transparent);
}

.dark .game-bg {
  background: color-mix(in srgb, var(--game-play) 20%, transparent);
}

.game-tag-bg {
  background: color-mix(in srgb, var(--game-play) 18%, transparent);
}

.dark .game-tag-bg {
  background: color-mix(in srgb, var(--game-play) 25%, transparent);
}

.game-text {
  /* Darken the game colour so it meets WCAG AA 4.5:1 against the lightly-tinted
   * game-bg (which is 12–20 % of the same colour on a light background). */
  color: color-mix(in srgb, var(--game-play) 60%, #000);
}

.dark .game-text {
  /* Lighten for dark backgrounds so the mix-against-transparent game-bg
   * still provides sufficient contrast. */
  color: color-mix(in srgb, var(--game-play) 60%, #fff);
}
```

- [ ] **Step 2: Update the two consumers.**

In `src/components/GameNameChip.tsx` and `src/components/SaveConfigDialog.tsx`, use `Edit` with `replace_all: true`:

- `--bookmark-play` → `--game-play`
- `bookmark-bg` → `game-bg`
- `bookmark-tag-bg` → `game-tag-bg`
- `bookmark-text` → `game-text`

- [ ] **Step 3: Typecheck + lint the CSS.**

```bash
yarn typecheck
yarn stylelint "src/**/*.css"
```

Expected: both PASS.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "refactor(css): rename --bookmark-play / .bookmark-* utilities to --game-play / .game-*"
```

---

## Task 14: i18n key and copy renames

Rename the `common.saveConfig.*` namespace to `common.customGame.*`, update values that still say "bookmark" to "custom game" in both English and Brazilian Portuguese, and add the new keys used by the delete confirmation (`instructions.delete`, `instructions.deleteConfirmTitle`, `instructions.deleteConfirmBody`, `instructions.customGameNameLabel`, `instructions.updateCustomGame`).

**Files:**

- Modify: `src/lib/i18n/locales/en/common.json`
- Modify: `src/lib/i18n/locales/pt-BR/common.json`
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`
- Modify: `src/components/SaveConfigDialog.tsx` (namespace change from `saveConfig.*` → `customGame.*`)

- [ ] **Step 1: Replace the `common.json` namespace (English).**

In `src/lib/i18n/locales/en/common.json`, replace the `saveConfig` block:

```json
"customGame": {
  "title": "Save configuration",
  "nameLabel": "Configuration name",
  "placeholder": "e.g. Easy Mode",
  "save": "Save",
  "cancel": "Cancel",
  "remove": "Remove {{name}}",
  "errorEmpty": "Please enter a name",
  "errorDuplicate": "A configuration named \"{{name}}\" already exists",
  "colorLabel": "Colour",
  "update": "Update \"{{name}}\"",
  "saveAsNew": "Save as new custom game…",
  "saveCustomGameLabel": "Save as custom game",
  "saveCustomGamePlaceholder": "e.g. Easy Mode"
}
```

(Delete the old `saveConfig` block.)

- [ ] **Step 2: Replace the same block in `pt-BR/common.json`.**

Use the previous translations but rename the namespace + update the two "favorito" strings:

```json
"customGame": {
  "title": "Salvar configuração",
  "nameLabel": "Nome da configuração",
  "placeholder": "ex: Fácil",
  "save": "Salvar",
  "cancel": "Cancelar",
  "remove": "Remover {{name}}",
  "errorEmpty": "Por favor, insira um nome",
  "errorDuplicate": "Já existe uma configuração chamada \"{{name}}\"",
  "colorLabel": "Cor",
  "update": "Actualizar \"{{name}}\"",
  "saveAsNew": "Salvar como novo jogo personalizado…",
  "saveCustomGameLabel": "Salvar como jogo personalizado",
  "saveCustomGamePlaceholder": "ex: Modo Fácil"
}
```

- [ ] **Step 3: Extend the `games.json` `instructions` map in English.**

Replace the `instructions` block in `src/lib/i18n/locales/en/games.json` with the following (existing keys preserved, new keys added, "bookmark" renamed in values):

```json
"instructions": {
  "word-spell": "Drag the letters into the boxes to spell the word. Tap the picture or the speaker to hear the word.",
  "number-match": "Drag the tiles to match each number. Tap the number to hear it.",
  "sort-numbers": "Put the numbers in order! Drag each number to the right place.",
  "lets-go": "Let's go!",
  "settings": "⚙️ Settings",
  "advanced": "Advanced",
  "updateCustomGame": "Update \"{{name}}\"",
  "saveAsNew": "Save as new custom game",
  "cancel": "Cancel",
  "delete": "Delete",
  "deleteConfirmTitle": "Delete \"{{name}}\"?",
  "deleteConfirmBody": "This custom game will be removed. You can't undo this.",
  "customGameNameLabel": "Custom game name",
  "nameRequired": "Please enter a custom game name.",
  "nameDuplicate": "A custom game with that name already exists.",
  "saveOnPlayTitle": "Save these settings as a custom game?",
  "saveOnPlayNameLabel": "Custom game name",
  "saveAndPlay": "Save & play",
  "playWithoutSaving": "Play without saving",
  "configure": "Configure"
}
```

- [ ] **Step 4: Mirror the same structure in pt-BR `games.json`.**

```json
"instructions": {
  "word-spell": "Arraste as letras para as caixas e forme a palavra. Toque na imagem ou no alto-falante para ouvir a palavra.",
  "number-match": "Arraste as peças para combinar cada número. Toque no número para ouvir.",
  "sort-numbers": "Coloque os números em ordem! Arraste cada número para o lugar certo.",
  "lets-go": "Vamos lá!",
  "advanced": "Avançado",
  "settings": "⚙️ Configurações",
  "updateCustomGame": "Atualizar \"{{name}}\"",
  "saveAsNew": "Salvar como novo jogo personalizado",
  "cancel": "Cancelar",
  "delete": "Excluir",
  "deleteConfirmTitle": "Excluir \"{{name}}\"?",
  "deleteConfirmBody": "Este jogo personalizado será removido. Essa ação não pode ser desfeita.",
  "customGameNameLabel": "Nome do jogo personalizado",
  "nameRequired": "Por favor, insira um nome para o jogo personalizado.",
  "nameDuplicate": "Já existe um jogo personalizado com esse nome.",
  "saveOnPlayTitle": "Salvar essas configurações como um jogo personalizado?",
  "saveOnPlayNameLabel": "Nome do jogo personalizado",
  "saveAndPlay": "Salvar e jogar",
  "playWithoutSaving": "Jogar sem salvar",
  "configure": "Configurar"
}
```

- [ ] **Step 5: Update `SaveConfigDialog` to the new namespace.**

In `src/components/SaveConfigDialog.tsx`, use `Edit` with `replace_all: true`:

- `t('saveConfig.` → `t('customGame.`

- [ ] **Step 6: Run fix + lint on the markdown/JSON.**

```bash
npx prettier --write "src/lib/i18n/locales/**/*.json"
yarn typecheck
yarn vitest run src/components
```

Expected: all PASS.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "i18n(custom-game): rename saveConfig namespace + update copy (en, pt-BR)

Adds instructions.delete, deleteConfirmTitle, deleteConfirmBody,
customGameNameLabel, updateCustomGame, and rewrites the save-on-play
prompt to use 'custom game' wording."
```

---

## Task 15: Update active docs (not SpecStory)

The spec directs us to keep `.specstory/history/**` untouched but rename "bookmark" to "custom game" elsewhere and add a one-line note at the top of each pre-existing file that referenced the term.

**Files (all under `docs/`, excluding `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`):**

- `docs/architecture.md`, `docs/data-model.md`, `docs/prd.md`, `docs/project-scope.md`, `docs/testing-strategy.md`, `docs/ui-ux.md`, `docs/2026-03-31-milestone-2-data-layer.md`, `docs/baseskill_milestone_breakdown_85146c93.plan.md`, `docs/brainstorms/2026-03-31-milestone-2-brainstorm.md`
- All `docs/superpowers/specs/*.md` and `docs/superpowers/plans/*.md` that reference the old term (see `Grep "bookmark" docs/ -l` output).

- [ ] **Step 1: List every affected file.**

Run Grep:

```text
Grep pattern="bookmark" path="docs" output_mode="files_with_matches" -i=true
```

Capture the list. Exclude `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md` (the Phase 1 spec itself, which is correct to keep using both terms).

- [ ] **Step 2: Add a rename note at the top of each historical doc.**

For every file in the list EXCEPT live architecture docs (`architecture.md`, `data-model.md`, `prd.md`, `project-scope.md`, `testing-strategy.md`, `ui-ux.md`, `brainstorms/*`), insert this one-liner immediately under the first `#` heading:

```markdown
> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
```

- [ ] **Step 3: Replace in-body occurrences.**

For each of the above files, use `Edit` with `replace_all: true` to rewrite these strings (in this order):

1. `"bookmark"` (quoted) → `"custom game"`
2. `Bookmark` → `Custom game`
3. `bookmark` → `custom game`

Manually review diff chunks in files that discuss OS browser bookmarks or analogies (e.g. `docs/ui-ux.md` may mention “like a browser bookmark” — revert any rename that introduces nonsense).

- [ ] **Step 4: Run markdown fix + lint.**

```bash
yarn fix:md
yarn lint:md
npx prettier --check "docs/**/*.md"
```

Expected: all PASS. If `lint:md` flags anything, fix manually and re-run.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "docs: rename bookmark to custom game across active docs

Historical docs get a one-line rename note pointing at the new design
spec. SpecStory history is untouched."
```

---

## Task 16: E2E — create then delete a custom game

Add a Playwright flow that proves the end-to-end happy path: open a default game's cog, save settings as a named custom game, return to home to see the new card, open its cog, delete it, confirm, and verify the card disappears.

**Files:**

- Create: `e2e/custom-game-delete.spec.ts`

- [ ] **Step 1: Write the E2E test.**

Create `e2e/custom-game-delete.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('create and delete a custom game', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Open the first default card's cog (settings gear, bottom-right of the card).
  await page
    .getByRole('button', { name: /^settings$/i })
    .first()
    .click();

  // Save as a new custom game with a unique name.
  const uniqueName = `E2E Custom ${Date.now()}`;
  await page.getByPlaceholder(/skip by 2/i).fill(uniqueName);
  await page
    .getByRole('button', { name: /save as new custom game/i })
    .click();

  // Card for the new custom game appears on the home grid.
  const customCard = page.getByRole('button', {
    name: new RegExp(`play ${uniqueName}`, 'i'),
  });
  await expect(customCard).toBeVisible();

  // Open its cog, delete, confirm.
  const cogs = page.getByRole('button', { name: /^settings$/i });
  // The custom-card cog is the last one (custom cards render after defaults).
  await cogs.last().click();

  await page.getByRole('button', { name: /^delete$/i }).click();

  // Nested confirm dialog.
  await expect(
    page.getByText(new RegExp(`delete "${uniqueName}"\\?`, 'i')),
  ).toBeVisible();
  // The destructive "Delete" button inside the confirm dialog.
  await page
    .getByRole('button', { name: /^delete$/i })
    .last()
    .click();

  // Card is gone after the RxDB reactive query re-emits.
  await expect(customCard).toHaveCount(0);
});
```

- [ ] **Step 2: Run the E2E test.**

```bash
yarn test:e2e --grep "create and delete a custom game"
```

Expected: PASS. If the test fails because of an IndexedDB state leak between runs, add `await page.context().clearCookies()` and `await page.evaluate(() => indexedDB.deleteDatabase('baseskill-data'))` in `beforeEach`. (Playwright already isolates storage per test, so this is usually unnecessary.)

- [ ] **Step 3: Commit.**

```bash
git add -A
git commit -m "test(e2e): cover create + delete of a custom game"
```

---

## Task 17: Update VR baselines for the new type-indicator badges

Only `@visual home page` and `@visual home page dark` are affected — they snapshot the card grid. The new `CircleDashed` (default) and `CircleDot` (custom) icons differ from the old blank / `BookmarkIcon` pair, so baselines MUST be regenerated.

**Files:**

- Update: `e2e/__snapshots__/visual.spec.ts.snapshots/home*.png`

- [ ] **Step 1: Confirm Docker is running.**

Run: `docker info | head -1`
Expected: prints the Docker server info line. If Docker isn't running, start Docker Desktop (or ask the user to). VR baselines MUST be regenerated in Docker so they match CI's Linux/Chromium rendering.

- [ ] **Step 2: Regenerate the baselines.**

```bash
yarn test:vr:update
```

Expected: the two `home.png` / `home-dark.png` baselines update; no other snapshots change. If any non-home snapshot changes, investigate — the rename should only affect the two home-page shots.

- [ ] **Step 3: Review the new baselines.**

Open `e2e/__snapshots__/visual.spec.ts.snapshots/home.png` and `home-dark.png` and confirm each card shows:

- Default cards: a muted, dashed-circle icon in the top-right of the cover.
- Custom cards: a solid filled colour circle with a dot (`CircleDot`) in the top-right of the cover.

If they look right, proceed. If not, the icon wiring in Task 7 is off — revisit `GameCard.tsx`.

- [ ] **Step 4: Re-run VR to confirm green.**

```bash
yarn test:vr
```

Expected: all snapshots match.

- [ ] **Step 5: Commit the baselines.**

```bash
git add -A
git commit -m "test(vr): regenerate home-grid baselines for new card type badges"
```

---

## Task 18: Final verification — lint, typecheck, test, build

Run the full pre-push gate locally and fix anything that surfaces.

- [ ] **Step 1: Run the pre-push check set.**

```bash
yarn typecheck
yarn lint
yarn lint:md
yarn test
yarn build
```

Expected: all PASS. The smart-pipelines `Triggered checks:` output at pre-push time should list `prettier, eslint, stylelint, markdownlint, actionlint, shellcheck, knip, typecheck, unit, build` — everything relevant to this PR.

- [ ] **Step 2: Confirm no lingering old identifiers.**

Grep the codebase (excluding SpecStory and the spec itself):

```text
Grep pattern="BookmarkColorKey|BOOKMARK_COLORS|BOOKMARK_COLOR_KEYS|DEFAULT_BOOKMARK_COLOR|SavedGameConfigDoc|savedGameConfigsSchema|useSavedConfigs|lastSessionSavedConfigId|isLastSessionSavedConfigId|suggestBookmarkName|SaveBookmarkInput|existingBookmarkNames|onSaveBookmark|onUpdateBookmark|bookmarkName|bookmarkColor|bookmarkId|bookmarkCover|--bookmark-play|bookmark-bg|bookmark-tag-bg|bookmark-text" path="src"
```

Expected: zero hits in `src/`. If hits appear, fix them.

Also confirm `docs/` has no unintended "bookmark" references (aside from the 2026-04-16 design spec and any SpecStory history file, which is untouched):

```text
Grep pattern="bookmark" path="docs" -i=true
```

Expected: only `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md` and any file where the term legitimately refers to browser bookmarks.

- [ ] **Step 3: Push and open the PR.**

```bash
git push -u origin spec/custom-games-and-bookmarks
gh pr create --base master --title "feat: custom games and bookmarks — Phase 1 (rename + delete)" \
  --body "$(cat <<'EOF'
## Summary

- Renames the "bookmark" surface to "custom game" across DB, types, hooks, components, CSS, and i18n.
- Adds a Delete action (with confirmation) to `AdvancedConfigModal` for existing custom games.
- Swaps the cover badge to a default-vs-custom type indicator using lucide `CircleDashed` / `CircleDot`.
- Introduces an idempotent boot migration that copies non-last-session docs from `saved_game_configs` → new `custom_games` collection.

Phase 2 (Star/bookmark toggle) is spec-only and remains deferred.

## Test plan

- [x] `yarn typecheck`
- [x] `yarn lint`
- [x] `yarn lint:md`
- [x] `yarn test` (unit)
- [x] `yarn test:vr` (Docker baselines refreshed)
- [x] `yarn test:e2e --grep "create and delete a custom game"`
- [x] `yarn build`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR opens against `master`. CI runs the full smart-pipeline. Share the PR URL with the user.

---

## Self-review notes (author → future executor)

**Spec coverage check** — every section of
`docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md` maps to a task:

- Vocabulary table → Tasks 1, 2, 3, 7, 8, 9, 10, 11 (rename cascade).
- DB rename decisions → Tasks 4, 6, 11 (`CustomGameDoc`, `customGamesSchema`, `useCustomGames`).
- Hook API renames (`customGames`, `gameIdsWithCustomGames`, `update`) → Task 6.
- Session helper renames → Task 3.
- Library helpers (`suggestCustomGameName`, game-colors) → Tasks 1, 2.
- Type renames (`SaveCustomGameInput`, `AdvancedConfigModalMode.kind: 'customGame'`) → Tasks 8, 9.
- Component prop renames → Tasks 7, 8, 9.
- CSS custom property + utility classes → Task 13.
- i18n renames + copy updates → Task 14.
- DB migration (copy + delete, idempotent, last-session docs preserved) → Task 5.
- Icon changes (CircleDashed/CircleDot cover badge, Trash2 delete button) → Tasks 7, 8.
- Delete action (button location, confirmation flow, configId strip on game route) → Tasks 8, 10, 11.
- Creation flow preserved (cog entry point, save-on-play dialog) → unchanged; verified in Tasks 8–11.
- Docs updates (rename in active docs, leave SpecStory) → Task 15.
- Testing plan (unit + migration + component + E2E + VR) → Tasks 4, 5, 6, 7, 8, 9, 16, 17.
- Rollout (PR 1 = Phase 1, idempotent migration, no flag) → Task 18.

**Placeholder scan** — no "TODO", "TBD", or "similar to Task N" anywhere. Every code step shows the full code.

**Type consistency** — identifiers used in later tasks match earlier ones:
`CustomGameDoc` (defined Task 4), `GameColorKey` (Task 1), `useCustomGames` (Task 6),
`customGames` / `update` / `remove` / `persistLastSessionConfig` (Task 6),
`lastSessionConfigId` (Task 3), `customGameName` / `customGameColor` (Task 7),
`kind: 'customGame'` / `existingCustomGameNames` / `onDelete` (Task 8),
`SaveCustomGameInput` / `onSaveCustomGame` / `onUpdateCustomGame` / `onDeleteCustomGame` (Tasks 9, 11).

# Milestone 2 — Data Layer and Core Infrastructure Implementation Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use @superpowers/subagent-driven-development (recommended) or @superpowers/executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship RxDB (all collections, migrations, React hooks), document the TanStack Query decision, and deliver internal event bus, locale-prefixed i18n, RxDB-backed theme engine with static default, speech wrappers, plus a static game registry — matching [docs/brainstorms/2026-03-31-milestone-2-brainstorm.md](../brainstorms/2026-03-31-milestone-2-brainstorm.md) and [docs/data-model.md](../data-model.md).

**Architecture:** Single IndexedDB-backed RxDB database (`baseskill-data`) owns all persisted user data. React accesses data through a `DbProvider` and small reactive hooks (no `@tanstack/react-query` in M2). Locale lives in the URL (`/en`, `/pt-BR`); default redirect from `/` → `/en`. Built-in CSS variables provide default theme before DB; RxDB `themes` collection seeds **exactly two** preset rows for M2 (expand later); runtime injection for signed-in users. Event bus is an in-process typed pub/sub aligned with `docs/game-engine.md`, internal-only in M2.

**Tech Stack:** React 19, TanStack Router (hash history), Vite 7, Vitest + RTL, RxDB with **Dexie-backed persistence** (`rxdb` + `dexie` + `rxdb/plugins/storage-dexie`) for the browser, **getRxStorageMemory()** for unit tests, `react-i18next`, `nanoid` (if not already present), `fake-indexeddb` (devDep for tests).

**Git discipline (mandatory):** After **each** numbered step below that creates or edits files, **`git add` those paths and `git commit`** with a focused message **before** starting the next step. Pure verification steps (`yarn test`, `yarn typecheck`, manual smoke) need **no** commit if the tree is still clean; if you fix files to get green, **commit the fix** immediately. **Do not** batch multiple steps into one commit.

**Persistence choice:** RxDB’s **native IndexedDB storage plugin is premium**; this project stays on the **free** stack. **Always use Dexie** as the IndexedDB layer via the official Dexie storage plugin. That still satisfies `docs/data-model.md` (“IndexedDB via RxDB”) — Dexie is the implementation path, not a duplicate store. Note in `docs/architecture.md` that we intentionally use Dexie storage rather than RxDB’s premium IndexedDB adapter.

**Spec / context to keep open while coding:** [docs/data-model.md](../data-model.md), [docs/game-engine.md](../game-engine.md) §3 (event bus), [docs/i18n.md](../i18n.md), [docs/ui-ux.md](../ui-ux.md) (theme tokens), [docs/testing-strategy.md](../testing-strategy.md), [docs/architecture.md](../architecture.md).

---

## File structure (create / modify)

| Path                                            | Responsibility                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                  | Add `rxdb`, `dexie`, `react-i18next`, `i18next`; devDeps `fake-indexeddb`, `@types/`\* if needed; `nanoid` if missing.                                                        |
| `src/db/types.ts`                               | Exported `BaseSkillDatabase` / collection name union.                                                                                                                         |
| `src/db/schemas/*.ts`                           | One module per collection: RxDB-compatible `RxJsonSchema` literals transcribed from `docs/data-model.md` §2.1–2.10.                                                           |
| `src/db/schemas/index.ts`                       | Re-exports + `MAX_SCHEMA_VERSION` helper (see data-model §6).                                                                                                                 |
| `src/db/create-database.ts`                     | `createRxDatabase`, `addCollections`; tests = memory; production = `wrappedDexieStorage` / `getRxStorageDexie` (exact API per installed `rxdb`).                              |
| `src/db/migrations.ts`                          | `checkVersionAndMigrate(db)`: ensure `app_meta` singleton, run RxDB migration strategies, update `rxdbSchemaVersion` / `lastMigrationAt`.                                     |
| `src/db/seed-themes.ts`                         | Insert 2 preset `themes` docs if missing (ids stable; match `docs/ui-ux.md`).                                                                                                 |
| `src/db/index.ts`                               | Public factory: `getOrCreateDatabase(): Promise<BaseSkillDatabase>`.                                                                                                          |
| `src/providers/DbProvider.tsx`                  | React context: db instance, `isReady`, error state.                                                                                                                           |
| `src/db/hooks/useRxDB.ts`                       | Consume context.                                                                                                                                                              |
| `src/db/hooks/useRxQuery.ts`                    | Generic hook: subscribe to RxDB `Observable` / `.subscribe`, cleanup on unmount (use `useSyncExternalStore` or subscription + `useState`).                                    |
| `src/lib/game-event-bus.ts`                     | `GameEventBus` implementation + `createGameEventBus()` singleton.                                                                                                             |
| `src/types/game-events.ts`                      | `GameEvent`, `GameEventType`, narrow event interfaces (subset OK for M2; expand in M4).                                                                                       |
| `src/lib/game-event-bus.md`                     | Short “future public API” note (internal-only M2).                                                                                                                            |
| `src/lib/i18n/i18n.ts`                          | `i18next` instance, resources, default `lng`.                                                                                                                                 |
| `src/lib/i18n/locales/en/*.json`                | Namespace files: `common`, `games`, `settings`, `encouragements`.                                                                                                             |
| `src/lib/i18n/locales/pt-BR/*.json`             | Same keys as `en` (real or stub translations).                                                                                                                                |
| `src/routes/index.tsx`                          | Root index: `redirect` to `/$locale` with `locale: 'en'`.                                                                                                                     |
| `src/routes/$locale/route.tsx`                  | Layout: `beforeLoad` validate `locale ∈ { en, 'pt-BR' }`, sync `i18n.changeLanguage`, `<Outlet />`.                                                                           |
| `src/routes/$locale/_app.tsx`                   | Moved from `src/routes/_app.tsx`; fix `createFileRoute` path.                                                                                                                 |
| `src/routes/$locale/_app/*`                     | Move entire `src/routes/_app/` tree here; update every `createFileRoute('...')` string to new route id (run dev to regenerate `routeTree.gen.ts`).                            |
| `src/lib/theme/css-vars.ts`                     | Map RxDB theme document → `--bs-*` / `--sea-*` assignments on `document.documentElement`.                                                                                     |
| `src/lib/theme/default-tokens.ts`               | Static fallback map when DB empty or anonymous.                                                                                                                               |
| `src/providers/ThemeRuntimeProvider.tsx`        | Subscribe to active theme (from settings/profile when present; else default), call `applyThemeCssVars`.                                                                       |
| `src/lib/speech/SpeechOutput.ts`                | TTS wrapper: `speak`, `cancel`, feature detect.                                                                                                                               |
| `src/lib/speech/SpeechInput.ts`                 | STT wrapper: `start`/`stop`, permissions, feature detect.                                                                                                                     |
| `src/lib/speech/voices.ts`                      | Enumerate voices filtered by language.                                                                                                                                        |
| `src/games/registry.ts`                         | Static `{ id, titleKey, ... }[]` for catalog (i18n keys into `games` namespace).                                                                                              |
| `docs/adrs/0001-rxdb-without-tanstack-query.md` | Decision record: defer Query until M6; hooks pattern summary.                                                                                                                 |
| `docs/architecture.md`                          | Short delta: bootstrap exceptions (URL locale, static theme), DbProvider, event bus location, **RxDB persistence via Dexie** (free tier; premium IndexedDB adapter not used). |
| `src/routes/__root.tsx`                         | Trim `THEME_INIT_SCRIPT` localStorage usage per brainstorm; keep minimal `prefers-color-scheme` class for first paint if still needed, or delegate to static tokens only.     |
| `src/components/ThemeToggle.tsx`                | Stop persisting theme to `localStorage`; wire to runtime provider / “auto” vs stored preference rules from `docs/ui-ux.md`.                                                   |
| `src/test-setup.ts`                             | Register `fake-indexeddb/auto` before tests.                                                                                                                                  |
| `vitest.config.ts`                              | Unchanged unless test globs need `src/db/**/*.test.ts`.                                                                                                                       |
| `e2e/smoke.spec.ts`                             | Assert navigation under `#/en/...` (hash router).                                                                                                                             |

---

## Dependency order

1. **SYNC:** deps → schemas → `create-database` + migrations → `DbProvider` + hooks → ADR.
2. **ASYNC (after DB creates successfully in dev):** event bus, i18n + routes, theme + seed, speech, game registry — can parallelize across agents once `src/db/index.ts` API is stable.
3. **Integration last:** compose providers in root layout, fix E2E.

---

### Task 1: Dependencies and test IndexedDB shim

**Files:**

- Modify: `package.json`
- Modify: `src/test-setup.ts`
- Test: `src/db/setup-validation.test.ts` (new)
- **Step 1: Add packages**

Run:

```bash
cd /Users/leocaseiro/Sites/base-skill && yarn add rxdb dexie react-i18next i18next nanoid
yarn add -D fake-indexeddb
```

Expected: `yarn.lock` updates; no peer warnings unresolved (resolve per Yarn output).

**Commit:**

```bash
git add package.json yarn.lock
git commit -m "chore(deps): add rxdb, dexie, i18n, nanoid, fake-indexeddb"
```

- **Step 2: Register fake IndexedDB globally for Vitest**

In `src/test-setup.ts`, prepend:

```typescript
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
```

**Commit:**

```bash
git add src/test-setup.ts
git commit -m "chore(test): register fake-indexeddb in vitest setup"
```

- **Step 3: Add IndexedDB smoke test**

Create `src/db/setup-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('test environment', () => {
  it('indexedDB is available', () => {
    expect(indexedDB).toBeDefined();
  });
});
```

**Commit:**

```bash
git add src/db/setup-validation.test.ts
git commit -m "test(db): assert indexedDB available in test env"
```

- **Step 4: Run test**

Run: `yarn test src/db/setup-validation.test.ts`  
Expected: **PASS** (no commit if clean).

---

### Task 2: RxDB database factory (memory in tests) + first collection

**Files:**

- Create: `src/db/types.ts`
- Create: `src/db/schemas/app-meta.ts`
- Create: `src/db/create-database.ts`
- Create: `src/db/index.ts`
- Test: `src/db/create-database.test.ts`

Use **memory storage** in this task. **Dexie** is wired in **Task 5** for production (verify import paths against installed `rxdb` version).

- **Step 1: Write failing test — create DB and add `app_meta`**

`src/db/create-database.test.ts`:

```typescript
import { afterEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from './create-database';

describe('createTestDatabase', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  afterEach(async () => {
    if (db) await destroyTestDatabase(db);
    db = undefined;
  });

  it('creates app_meta collection', async () => {
    db = await createTestDatabase();
    expect(db.app_meta).toBeDefined();
  });
});
```

Export `createTestDatabase` / `destroyTestDatabase` from `create-database.ts` using **memory storage** for unit tests only; production path uses Dexie.

Run: `yarn test src/db/create-database.test.ts`  
Expected: **FAIL** (module missing). No commit if nothing new to save; if you add a temporary stub to compile, **commit that stub** before Step 2.

**Commit** (failing test + **minimal** `create-database.ts` / `index.ts` stubs so the test file type-checks and Vitest can collect it — e.g. `createTestDatabase` missing or throwing until Step 3):

```bash
git add src/db/create-database.test.ts src/db/create-database.ts src/db/schemas/app-meta.ts src/db/types.ts src/db/index.ts
git commit -m "test(db): failing test for createTestDatabase with app_meta"
```

- **Step 2: Implement minimal `app_meta` schema**

Transcribe `docs/data-model.md` §2.10 into `src/db/schemas/app-meta.ts` as `export const appMetaSchema = { ... }` with `version: 0`, `primaryKey: 'id'`, `type: 'object'`, `properties` / `required` matching the doc. No `additionalProperties` if RxDB version disallows — follow RxDB json-schema rules.

**Commit:**

```bash
git add src/db/schemas/app-meta.ts
git commit -m "feat(db): add app_meta RxJSON schema"
```

- **Step 3: Implement `createTestDatabase` only** (`getOrCreateDatabase` + Dexie in Task 5)

`src/db/create-database.ts` skeleton:

```typescript
import {
  createRxDatabase,
  type RxDatabase,
  type RxCollection,
} from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { appMetaSchema } from './schemas/app-meta';

export type AppMetaDoc = {
  id: 'singleton';
  appVersion: string;
  rxdbSchemaVersion: number;
  lastMigrationAt: string | null;
  installId: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- RxDB collection map
type Collections = {
  app_meta: RxCollection<AppMetaDoc>;
};

export type BaseSkillDatabase = RxDatabase<Collections>;

const DB_NAME = 'baseskill-data-test';

export async function createTestDatabase(): Promise<BaseSkillDatabase> {
  const db = await createRxDatabase<BaseSkillDatabase>({
    name: DB_NAME + Math.random(),
    storage: getRxStorageMemory(),
    multiInstance: false,
    ignoreDuplicate: true,
  });
  await db.addCollections({
    app_meta: { schema: appMetaSchema },
  });
  return db;
}

export async function destroyTestDatabase(
  db?: BaseSkillDatabase,
): Promise<void> {
  if (db) await db.remove();
}
```

**Note:** Replace imports with the exact APIs from your installed `rxdb` version (use `@plugin-compound-engineering-context7` / RxDB docs if build fails).

Run: `yarn test src/db/create-database.test.ts`  
Expected: **PASS**

**Commit:**

```bash
git add src/db/create-database.ts src/db/types.ts src/db/index.ts
git commit -m "feat(db): createTestDatabase with memory storage and app_meta"
```

- **Step 4: `yarn typecheck`**

Run: `yarn typecheck`  
Expected: **PASS** (commit any type fixes immediately if you touched files).

---

### Task 3: All remaining collection schemas + `addCollections`

**Files:**

- Create: `src/db/schemas/profiles.ts` … `sync-meta.ts` (one file per collection from data-model §2.1–2.9)
- Create: `src/db/schemas/index.ts`
- Modify: `src/db/create-database.ts`
- Modify: `src/db/types.ts`
- Test: extend `src/db/create-database.test.ts`
- **Step 1: Transcribe schemas** from `docs/data-model.md` for `profiles`, `progress`, `settings`, `game_config_overrides`, `custom games`, `themes`, `session_history`, `session_history_index`, `sync_meta`. Export `MAX_SCHEMA_VERSION` in `schemas/index.ts` using the same formula as the doc §6.

**Commit:**

```bash
git add src/db/schemas/
git commit -m "feat(db): add RxJSON schemas for remaining collections"
```

- **Step 2: Register collections** in `create-database.ts` / `types.ts` and extend `create-database.test.ts` with `it('adds all collections', …)` asserting each `db[collectionName]` exists.

**Commit:**

```bash
git add src/db/create-database.ts src/db/types.ts src/db/create-database.test.ts
git commit -m "feat(db): register all collections in createTestDatabase"
```

- **Step 3: Run tests**

Run: `yarn test src/db/create-database.test.ts`  
Expected: **PASS** (commit any fixes before continuing).

---

### Task 4: Migrations + `app_meta` bootstrap

**Files:**

- Create: `src/db/migrations.ts`
- Modify: `src/db/create-database.ts` (call migrations after `addCollections`)
- Test: `src/db/migrations.test.ts`
- **Step 1: Write failing test**

`migrations.test.ts`: after `createTestDatabase()`, call `ensureAppMetaSingleton(db)`, then `findOne('singleton')` returns doc with `rxdbSchemaVersion === MAX_SCHEMA_VERSION` and non-empty `installId`.

Run: `yarn test src/db/migrations.test.ts` — expect **FAIL**.

**Commit:**

```bash
git add src/db/migrations.test.ts
git commit -m "test(db): failing tests for app_meta bootstrap and migrations"
```

- **Step 2: Implement** per `docs/data-model.md` §6–9: RxDB `migrationStrategies` on each collection (start with identity `old => old` for version 0 only). `ensureAppMetaSingleton` inserts row if missing using `package.json` version for `appVersion`.

**Commit:**

```bash
git add src/db/migrations.ts src/db/create-database.ts
git commit -m "feat(db): app_meta bootstrap and migration framework"
```

- **Step 3: Run tests + typecheck**

Run: `yarn test src/db/migrations.test.ts && yarn typecheck`  
Expected: **PASS** (commit any fixes immediately).

---

### Task 5: Production database entry + Dexie storage

**Files:**

- Modify: `src/db/create-database.ts`
- Modify: `src/db/index.ts`
- Test: optional `src/db/production-database.browser.test.ts` (skip in CI if flaky; or manual QA step documented)
- **Step 1: Export `getOrCreateDatabase()`** using **fixed** `name: 'baseskill-data'`, `wrappedDexieStorage` / `getRxStorageDexie` for browser, `multiInstance: false`.

**Commit:**

```bash
git add src/db/create-database.ts src/db/index.ts
git commit -m "feat(db): production Dexie storage and getOrCreateDatabase"
```

- **Step 2: Manual smoke** — `yarn dev`, confirm IndexedDB in DevTools. Remove any temporary `console.log` (or guard with `import.meta.env.DEV`); **commit** if that edit touched files.

---

### Task 6: `DbProvider` + `useRxDB`

**Files:**

- Create: `src/providers/DbProvider.tsx`
- Create: `src/db/hooks/useRxDB.ts`
- Test: `src/providers/DbProvider.test.tsx`
- **Step 1: Write failing test** — render provider with mocked `getOrCreateDatabase`, assert children see ready state.

**Commit:**

```bash
git add src/providers/DbProvider.test.tsx
git commit -m "test(db): failing tests for DbProvider"
```

- **Step 2: Implement** provider: `useEffect` calls `getOrCreateDatabase`, sets state, provides `{ db, error, isReady }`; add `useRxDB`.

**Commit:**

```bash
git add src/providers/DbProvider.tsx src/db/hooks/useRxDB.ts
git commit -m "feat(db): DbProvider and useRxDB context"
```

- **Step 3: Run**

Run: `yarn test src/providers/DbProvider.test.tsx`  
Expected: **PASS** (commit fixes if any).

---

### Task 7: Reactive `useRxQuery` hook

**Files:**

- Create: `src/db/hooks/useRxQuery.ts`
- Test: `src/db/hooks/useRxQuery.test.tsx`
- **Step 1: Write test** — insert doc into `themes` via memory db, hook subscribes to `find().$`, assert UI updates after second insert.

**Commit:**

```bash
git add src/db/hooks/useRxQuery.test.tsx
git commit -m "test(db): useRxQuery reactive subscription"
```

- **Step 2: Implement** hook with proper cleanup (`subscription.unsubscribe()`).

**Commit:**

```bash
git add src/db/hooks/useRxQuery.ts
git commit -m "feat(db): useRxQuery hook"
```

- **Step 3: Run**

Run: `yarn test src/db/hooks/useRxQuery.test.tsx`  
Expected: **PASS** (commit fixes if any).

---

### Task 8: ADR — TanStack Query deferred

**Files:**

- Create: `docs/adrs/0001-rxdb-without-tanstack-query.md`
- Modify: `docs/architecture.md` (link ADR; 1 short paragraph on data access)
- **Step 1: Write ADR** — Context, Decision (defer `@tanstack/react-query` until M6 network layer), Consequences (hooks-only pattern, no duplicate cache).

**Commit:**

```bash
git add docs/adrs/0001-rxdb-without-tanstack-query.md
git commit -m "docs: ADR defer TanStack Query until cloud sync milestone"
```

- **Step 2: Update `docs/architecture.md`** — link ADR; short paragraph on data access + Dexie persistence.

**Commit:**

```bash
git add docs/architecture.md
git commit -m "docs(architecture): link RxDB ADR and persistence notes"
```

---

### Task 9: Game event bus (internal)

**Files:**

- Create: `src/types/game-events.ts`
- Create: `src/lib/game-event-bus.ts`
- Create: `src/lib/game-event-bus.md`
- Test: `src/lib/game-event-bus.test.ts`
- **Step 1: Add `game-events` types + failing tests** — `emit` delivers to exact type subscribers; `game:*` receives all; unsubscribe stops delivery.

**Commit:**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "test(events): GameEventBus failing tests"
```

- **Step 2: Implement** typed bus (sync dispatch is fine for M2) + `game-event-bus.md`.

**Commit:**

```bash
git add src/lib/game-event-bus.ts src/lib/game-event-bus.md
git commit -m "feat(events): internal GameEventBus with wildcard subscribe"
```

- **Step 3: Run**

Run: `yarn test src/lib/game-event-bus.test.ts`  
Expected: **PASS** (commit fixes if any).

---

### Task 10: i18n resources + instance

**Files:**

- Create: `src/lib/i18n/i18n.ts`
- Create: `src/lib/i18n/locales/en/common.json` (etc.)
- Create: `src/lib/i18n/locales/pt-BR/common.json` (etc.)
- Test: `src/lib/i18n/i18n.test.ts`
- **Step 1: Write test** — `i18n.t('common:appName')` returns string for both langs (test may fail until Step 2 fills resources).

**Commit:**

```bash
git add src/lib/i18n/i18n.test.ts
git commit -m "test(i18n): assert translations resolve for en and pt-BR"
```

- **Step 2: Add** `i18n.ts` + namespace JSON files (minimal keys: `appName`, `home.title`, a few game titles).

**Commit:**

```bash
git add src/lib/i18n/
git commit -m "feat(i18n): react-i18next setup with en and pt-BR namespaces"
```

- **Step 3: Run**

Run: `yarn test src/lib/i18n/i18n.test.ts`  
Expected: **PASS** (commit fixes if any).

---

### Task 11: Locale route segment + move `_app` tree

**Files:**

- Create: `src/routes/index.tsx`
- Create: `src/routes/$locale/route.tsx`
- Move: `src/routes/_app.tsx` → `src/routes/$locale/_app.tsx`
- Move: `src/routes/_app/`** → `src/routes/$locale/\_app/**`
- Delete: empty `src/routes/_app/` if unused
- Modify: every moved route’s `createFileRoute(...)` path (TanStack will error until paths match; use `yarn dev` to see expected ids)
- Test: update `src/routes/_app/index.test.tsx` path → `src/routes/$locale/_app/index.test.tsx`; fix imports
- Modify: `src/routes/__root.test.tsx` if fullPath assertions exist
- **Step 1: Add root redirect**

`src/routes/index.tsx`:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$locale',
      params: { locale: 'en' },
      replace: true,
    });
  },
});
```

**Commit:**

```bash
git add src/routes/index.tsx
git commit -m "feat(router): redirect / to default locale en"
```

- **Step 2: Locale layout** validates param and sets language:

```typescript
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import i18n from '@/lib/i18n/i18n'

const LOCALES = ['en', 'pt-BR'] as const
export type AppLocale = (typeof LOCALES)[number]

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!LOCALES.includes(params.locale as AppLocale)) {
      throw redirect({ to: '/$locale', params: { locale: 'en' }, replace: true })
    }
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useParams()
  void i18n.changeLanguage(locale)
  return <Outlet />
}
```

**Commit:**

```bash
git add 'src/routes/$locale/route.tsx'
git commit -m "feat(router): locale layout and i18n sync"
```

- **Step 3: Move `src/routes/\_app/**`→`src/routes/$locale/\_app/**`**; fix every `createFileRoute('…')` id; update tests (`__root.test.tsx`, etc.); run `yarn dev` to regenerate `routeTree.gen.ts`.

**Commit:**

```bash
git add src/routes/ src/routeTree.gen.ts
git commit -m "feat(router): nest app routes under locale segment"
```

- **Step 4: Verify**

Run: `yarn typecheck && yarn test`  
Expected: **PASS** (commit any fixes immediately).

---

### Task 12: Wire `I18nextProvider` + `DbProvider` in app shell

**Files:**

- Modify: `src/routes/$locale/_app.tsx` (or `src/routes/__root.tsx` — prefer `_app` so `html lang` can stay dynamic via a tiny effect setting `document.documentElement.lang`)
- Modify: app entry if needed (`src/start.ts` / router mount — follow existing TanStack Start pattern)
- **Step 1: Wrap** `<Outlet />` with `I18nextProvider` and `DbProvider` (order: `DbProvider` outer if games read DB from shell later).

**Commit:**

```bash
git add 'src/routes/$locale/_app.tsx'
git commit -m "feat(app): compose DbProvider and I18nextProvider in shell"
```

- **Step 2: Test** smoke render in `src/routes/$locale/_app.test.tsx` (optional).

**Commit** (skip if you did not add/change files):

```bash
git add 'src/routes/$locale/_app.test.tsx'
git commit -m "test(app): smoke render with providers"
```

- **Step 3: Run**

Run: `yarn test` (scoped to new test if needed)  
Expected: **PASS** (commit fixes if any).

---

### Task 13: Theme seed + runtime CSS variables

**Files:**

- Create: `src/db/seed-themes.ts`
- Create: `src/lib/theme/default-tokens.ts`
- Create: `src/lib/theme/css-vars.ts`
- Create: `src/providers/ThemeRuntimeProvider.tsx`
- Modify: `src/providers/DbProvider.tsx` or `_app.tsx` — call `seedThemesOnce(db)` after ready
- Modify: `src/routes/__root.tsx` — reduce/remove `localStorage` theme script per brainstorm
- Modify: `src/components/ThemeToggle.tsx`
- Test: `src/lib/theme/css-vars.test.ts`
- **Step 1: Test** — `applyThemeCssVars` sets `--bs-background` (or your token names from `src/styles.css`) on a detached `HTMLElement`.

**Commit:**

```bash
git add src/lib/theme/css-vars.test.ts
git commit -m "test(theme): applyThemeCssVars maps tokens to element"
```

- **Step 2: Implement** `css-vars.ts` + `default-tokens.ts` (static fallback when DB empty / anonymous).

**Commit:**

```bash
git add src/lib/theme/css-vars.ts src/lib/theme/default-tokens.ts
git commit -m "feat(theme): CSS variable application and default tokens"
```

- **Step 3: Seed presets** — `src/db/seed-themes.ts` inserts **exactly two** preset `themes` documents if missing (stable ids; derived from `docs/ui-ux.md` / `src/styles.css`). **Do not** add more presets in M2.

**Commit:**

```bash
git add src/db/seed-themes.ts
git commit -m "feat(theme): seed two preset themes in RxDB"
```

- **Step 4: Runtime provider + shell** — `ThemeRuntimeProvider`; call `seedThemesOnce(db)` after DB ready; trim `__root.tsx` theme script; update `ThemeToggle.tsx`.

**Commit:**

```bash
git add src/providers/ThemeRuntimeProvider.tsx src/providers/DbProvider.tsx src/routes/__root.tsx src/components/ThemeToggle.tsx 'src/routes/$locale/_app.tsx'
git commit -m "feat(theme): runtime provider, seed on init, toggle without localStorage mirror"
```

- **Step 5: Run**

Run: `yarn test src/lib/theme/`  
Expected: **PASS** (commit fixes if any).

---

### Task 14: Speech wrappers

**Files:**

- Create: `src/lib/speech/SpeechOutput.ts`
- Create: `src/lib/speech/SpeechInput.ts`
- Create: `src/lib/speech/voices.ts`
- Test: `src/lib/speech/SpeechOutput.test.ts` (mock `speechSynthesis` per `docs/testing-strategy.md`)
- **Step 1: Tests first** — when `speechSynthesis` undefined, `speak` no-ops without throw.

**Commit:**

```bash
git add src/lib/speech/SpeechOutput.test.ts
git commit -m "test(speech): SpeechOutput safe when API missing"
```

- **Step 2: Implement** `SpeechOutput.ts`, `SpeechInput.ts`, `voices.ts`.

**Commit:**

```bash
git add src/lib/speech/
git commit -m "feat(speech): TTS and STT wrappers with safe fallbacks"
```

- **Step 3: Run**

Run: `yarn test src/lib/speech/`  
Expected: **PASS** (commit fixes if any).

---

### Task 15: Static game registry

**Files:**

- Create: `src/games/registry.ts`
- Test: `src/games/registry.test.ts`
- **Step 1: Test** — minimal assertion on `GAME_CATALOG` length / shape.

**Commit:**

```bash
git add src/games/registry.test.ts
git commit -m "test(games): static game catalog shape"
```

- **Step 2: Implement** `GAME_CATALOG` with stable `id` and `titleKey` for i18n.

**Commit:**

```bash
git add src/games/registry.ts
git commit -m "feat(games): static catalog registry for anonymous browsing"
```

- **Step 3: Run**

Run: `yarn test src/games/registry.test.ts`  
Expected: **PASS** (commit fixes if any).

---

### Task 16: Homepage uses catalog + i18n (minimal M2 vertical slice)

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`
- **Step 1: Render** list from `GAME_CATALOG` with `useTranslation('games')`.

**Commit:**

```bash
git add 'src/routes/$locale/_app/index.tsx'
git commit -m "feat(home): show static game list with i18n under locale route"
```

- **Step 2: Run**

Run: `yarn test` (and any route tests)  
Expected: **PASS** (commit fixes if any).

---

### Task 17: E2E and lint gate

**Files:**

- Modify: `e2e/smoke.spec.ts`, `e2e/a11y.spec.ts` if URLs assumed `/`
- **Step 1: Update** Playwright paths to `/#/en` or full hash paths your router uses.

**Commit:**

```bash
git add e2e/
git commit -m "test(e2e): align Playwright with locale-prefixed routes"
```

- **Step 2: Full gate**

Run:

```bash
yarn lint && yarn typecheck && yarn test && yarn test:e2e
```

Expected: all **PASS** (commit any lint/type fixes immediately if needed).

---

## Post-plan review (recommended)

1. Dispatch a **plan-document-reviewer** subagent with: this file path + brainstorm path `docs/brainstorms/2026-03-31-milestone-2-brainstorm.md`.
2. Fix any gaps (e.g. missing `session_history` indexes from data-model §10).
3. Max 3 review iterations, then ask a human.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-31-milestone-2-data-layer.md`.**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks: use @superpowers/subagent-driven-development.

**2. Inline Execution** — Batch tasks in this session with checkpoints: use @superpowers/executing-plans.

**Which approach do you want?**

---

## Notes

- **Git:** The **Git discipline** paragraph at the top is binding; each file-changing step below ends with an explicit **Commit** block — follow it in order.
- **Milestone 3 prep:** Brainstorm requires anonymous homepage + full game list without profile; this plan only adds **static** catalog UI. Removing profile-first `beforeLoad` guards is **explicitly M3** work — do not block M2 on redesigning all M3 routes.
- **RxDB API drift:** If imports fail, consult current RxDB docs (`rxdb` version in `yarn.lock`) and adjust `create-database.ts` in one focused commit.
- **Dexie vs premium IndexedDB:** Do not adopt RxDB’s premium IndexedDB-only adapter; Dexie + `storage-dexie` is the supported **free** persistence path for this repo.
- **Regenerated files:** Never hand-edit `src/routeTree.gen.ts`; fix file-route paths and run dev/build.

# BaseSkill Testing Strategy

## 1. Overview and Philosophy

BaseSkill is a free, open-source, offline-first educational PWA for children. Every change merged to `main` must leave the codebase in a fully verified state. The testing philosophy is:

- **Every commit has passing CI**: lint + type-check + unit + E2E must all be green before merge
- **No `any` in TypeScript**: enforced by ESLint and `tsc --noEmit` in CI — no exceptions
- **Right tool for the right layer**: unit tests own logic, component tests own UI behaviour, E2E tests own user flows
- **Real RxDB in tests**: test data is seeded into an in-memory RxDB instance — the storage layer is never mocked
- **Zero accessibility violations**: axe-core runs automatically on every E2E test; a single violation fails the build

The stack is: **TanStack Start + TanStack Router + React + TypeScript (strict) + RxDB + Vitest + React Testing Library + Playwright**.

---

## 2. Test Runner Setup

### Vitest

Vitest is the unit and component test runner. It is chosen over Jest because it runs natively on Vite (same config, same transforms), supports native ESM without additional Babel plugins, and is significantly faster for watch-mode development.

**`vitest.config.ts`**

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['app/**/*.{ts,tsx}'],
        exclude: ['app/**/*.d.ts', 'app/routes/**'],
        thresholds: {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
      },
    },
  }),
)
```

### React Testing Library

`@testing-library/react` with `@testing-library/user-event` is used for all component tests. `userEvent` (v14+) is always preferred over `fireEvent` because it simulates real browser interaction sequences (pointer events, focus, keyboard).

```
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### Global Setup File

**`tests/setup.ts`** — imported by Vitest before every test file:

```typescript
import '@testing-library/jest-dom'

// Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({})),
})

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
})

// IndexedDB — provided by fake-indexeddb for RxDB memory adapter
import 'fake-indexeddb/auto'

// matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

---

## 3. TypeScript Strictness Enforcement

TypeScript strictness is a first-class CI requirement. The following settings are non-negotiable.

### `tsconfig.json` (excerpt)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint rules (excerpt from `eslint.config.ts`)

```typescript
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
  }
}
```

### CI steps (in order)

```yaml
- name: Type check
  run: tsc --noEmit

- name: Lint (zero warnings)
  run: eslint . --max-warnings 0
```

Both steps must pass before any test step is allowed to run. A type error or lint warning blocks the entire pipeline.

---

## 4. Unit Tests (Vitest)

Unit tests live in `tests/unit/` and test pure logic functions in isolation from UI and storage.

### Coverage Targets

| Module | Target |
|--------|--------|
| Game logic (override merging, session recorder, chunking) | 100% |
| RxDB schema definitions | 100% |
| Event bus (emit, on, off, cleanup) | 100% |
| Theme engine (CSS variable injection, clone logic) | 90% |
| i18n utilities (language detection, grade formatting) | 90% |
| Speech utilities (voice selection, fallback) | 85% |

### Key Test Files

#### `tests/unit/game-config-resolver.test.ts`

Tests the 4-level override merging hierarchy: `global-defaults → game-defaults → grade-level → profile`.

```typescript
describe('resolveGameConfig', () => {
  it('returns global defaults when no overrides exist', () => { /* ... */ })
  it('game-default overrides win over global defaults', () => { /* ... */ })
  it('grade-level overrides win over game defaults', () => { /* ... */ })
  it('profile overrides win over grade-level', () => { /* ... */ })
  it('profile overrides win over all other levels', () => { /* ... */ })
  it('partial profile override only replaces specified keys', () => { /* ... */ })
  it('null override values are preserved (intentional unset)', () => { /* ... */ })
})
```

#### `tests/unit/session-recorder.test.ts`

Tests event recording, chunk rollover, and session index creation.

```typescript
describe('SessionRecorder', () => {
  it('records events published on the event bus', () => { /* ... */ })
  it('creates a new chunk doc when 200 events are reached', () => { /* ... */ })
  it('creates a new chunk doc when serialised size reaches ~50KB', () => { /* ... */ })
  it('increments chunkIndex correctly across rollovers', () => { /* ... */ })
  it('writes session_history_index doc on game:end', () => { /* ... */ })
  it('totalChunks in index matches actual chunk count', () => { /* ... */ })
  it('stops recording and unsubscribes on teardown', () => { /* ... */ })
})
```

#### `tests/unit/event-bus.test.ts`

Tests the typed event bus used throughout the app.

```typescript
describe('EventBus', () => {
  it('delivers event to subscriber', () => { /* ... */ })
  it('delivers to multiple subscribers for same event', () => { /* ... */ })
  it('does not deliver after unsubscribe', () => { /* ... */ })
  it('does not leak after off() removes the last subscriber', () => { /* ... */ })
  it('cleanup() removes all subscribers', () => { /* ... */ })
  it('type-safe: cannot emit unknown event keys (compile-time check)', () => { /* ... */ })
})
```

#### `tests/unit/rxdb-schemas.test.ts`

Validates all 10 collection schemas against sample documents using `ajv` or `jsonschema`.

```typescript
const collections = [
  'profiles',
  'progress',
  'settings',
  'game_config_overrides',
  'bookmarks',
  'themes',
  'session_history_chunks',
  'session_history_index',
  'sync_queue',
  'parent_settings',
]

describe.each(collections)('RxDB schema: %s', (collection) => {
  it('is a valid JSON Schema Draft-7 document', () => { /* validate schema itself */ })
  it('accepts a conforming sample document', () => { /* validate fixture doc */ })
  it('rejects a document missing required fields', () => { /* ... */ })
  it('rejects a document with wrong field types', () => { /* ... */ })
})
```

---

## 5. Component Tests (Vitest + React Testing Library)

Component tests live in `tests/components/` and mirror the structure of `app/components/`. They test rendered output, user interaction, ARIA attributes, and event emissions — not implementation details.

### Coverage Target

85% line coverage for all files under `app/components/`.

### Key Component Tests

#### `DragAndDrop.test.tsx`

```typescript
it('renders draggable items', () => { /* ... */ })
it('simulates pointer down + move + up (drag gesture)', async () => { /* ... */ })
it('snaps to drop zone when within threshold', async () => { /* ... */ })
it('does not snap when outside threshold', async () => { /* ... */ })
it('emits drop event with correct item id and zone id', async () => { /* ... */ })
it('is accessible: draggable items have aria-grabbed attribute', () => { /* ... */ })
```

#### `MultipleChoice.test.tsx`

```typescript
it('renders all options', () => { /* ... */ })
it('selects option on click', async () => { /* ... */ })
it('navigates options with arrow keys', async () => { /* ... */ })
it('confirms selection with Enter key', async () => { /* ... */ })
it('announces selection via aria-live region', async () => { /* ... */ })
it('correct ARIA role on option buttons (role="radio")', () => { /* ... */ })
it('aria-checked reflects selected state', async () => { /* ... */ })
```

#### `LetterTracer.test.tsx`

```typescript
it('renders canvas element with accessible label', () => { /* ... */ })
it('activates tap-to-place mode when prop is set', async () => { /* ... */ })
it('canvas has aria-label describing the current letter', () => { /* ... */ })
```

#### `Timer.test.tsx`

```typescript
it('counts down from initial value', async () => { /* vi.useFakeTimers() */ })
it('does not render when hidden prop is true', () => { /* ... */ })
it('emits time_up event when countdown reaches zero', async () => { /* ... */ })
it('pauses when paused prop is set', async () => { /* ... */ })
```

#### `EncouragementAnnouncer.test.tsx`

```typescript
it('renders correct message on correct answer', async () => { /* ... */ })
it('renders near-miss message when near-miss prop is set', async () => { /* ... */ })
it('calls window.speechSynthesis.speak with message text', async () => { /* ... */ })
it('does not call TTS when speech is disabled in settings', async () => { /* ... */ })
```

#### `OfflineIndicator.test.tsx`

```typescript
it('does not render when navigator.onLine is true', () => { /* ... */ })
it('renders offline banner when navigator.onLine is false', () => { /* ... */ })
it('hides banner when online event fires', async () => { /* ... */ })
it('banner has role="status" and aria-live="polite"', () => { /* ... */ })
```

#### `ProfilePicker.test.tsx`

```typescript
it('renders profiles from RxDB fixture', async () => { /* uses db-factory */ })
it('selects profile on click and redirects to dashboard', async () => { /* ... */ })
it('renders add-profile button', () => { /* ... */ })
```

### Mocking Strategy

| Dependency | Strategy |
|------------|----------|
| Web Speech API | Mocked globally in `tests/setup.ts` |
| RxDB | Real RxDB with `rxdb-adapter-memory` — never mocked |
| TanStack Router | `createMemoryRouter` / `RouterProvider` with test routes |
| `navigator.onLine` | `Object.defineProperty` per test to control value |
| Timers | `vi.useFakeTimers()` / `vi.useRealTimers()` per test |

---

## 6. E2E Tests (Playwright)

E2E tests live in `tests/e2e/` and exercise complete user flows against a running dev or preview server.

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['github']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['iPhone 12'] } },
    { name: 'mobile-safari', use: { ...devices['iPad (gen 7)'] } },
  ],
})
```

### Critical User Flows (one file per flow)

#### `tests/e2e/profile-creation.spec.ts`
Create a new profile, select an avatar, set grade level, verify the dashboard loads for that profile.

#### `tests/e2e/game-play.spec.ts`
Select a game from the dashboard, play through one full round, verify a `progress` document is written to RxDB with the correct score.

#### `tests/e2e/progress-saving.spec.ts`
Play a game, hard-refresh the page, verify that progress (score, last played timestamp) persists from IndexedDB.

#### `tests/e2e/profile-switching.spec.ts`
Create two profiles, accumulate progress on profile A, switch to profile B, verify profile B has no progress, switch back to A, verify progress is intact.

#### `tests/e2e/bookmarks.spec.ts`
Bookmark a game via the star button, verify the game appears in the "Bookmarked" row on the dashboard, unbookmark it, verify it disappears.

#### `tests/e2e/recents.spec.ts`
Play a game, return to the dashboard, verify the game appears in the "Recently Played" row with a last-played timestamp.

#### `tests/e2e/offline-mode.spec.ts`
Load the app fully, call `context.setOffline(true)`, verify the offline banner appears within 500ms, navigate to a game, verify the game is playable without network access.

#### `tests/e2e/online-restore.spec.ts`
Simulate going offline, then call `context.setOffline(false)`, verify the offline banner dismisses automatically.

#### `tests/e2e/parent-pin.spec.ts`
Navigate to parent settings, enter the correct PIN, verify access is granted. Enter an incorrect PIN, verify access is denied with an error message.

#### `tests/e2e/session-history.spec.ts`
Play a game to completion, navigate to Parent > History, verify the session appears as the most recent entry with correct game name and timestamp. Expand the row and verify event data is loaded.

#### `tests/e2e/data-cleanup.spec.ts`
Accumulate session history over several games, trigger "Clear History" in parent settings, verify all session_history_chunks and session_history_index documents are removed, verify profile and progress documents are unaffected.

#### `tests/e2e/theme-change.spec.ts`
Switch from the default theme to a different theme in child settings, verify the correct CSS custom properties are applied to `:root` in the DOM.

---

## 7. Visual Regression Tests

Visual regression tests are Playwright screenshot comparisons that detect unintended UI changes.

### Scope

Screenshots are captured for the following screens × theme combinations:

**Screens:**
- Profile Picker
- Dashboard
- Game Shell (Letter Tracing loaded)
- Child Settings
- Parent Settings — General tab
- Parent Settings — History tab
- Parent Settings — Data tab
- Offline banner state (Dashboard with banner visible)

**Themes:** Ocean · Forest · Space · Rainbow · Sunset · Night

**Viewports:**
- `1280x800` — desktop
- `768x1024` — iPad portrait
- `390x844` — iPhone 14

### Configuration

Visual regression tests live in `tests/e2e/visual/`. Each file loads a page, sets the theme, and calls `expect(page).toHaveScreenshot()`.

```typescript
// tests/e2e/visual/dashboard.spec.ts
for (const theme of THEMES) {
  test(`dashboard - ${theme} - desktop`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate((t) => setTheme(t), theme)
    await expect(page).toHaveScreenshot(`dashboard-${theme}-desktop.png`, {
      maxDiffPixelRatio: 0.001,
    })
  })
}
```

### Commands

```bash
# Update baselines (run after intentional design changes)
pnpm playwright test tests/e2e/visual --update-snapshots

# Run visual regression in CI (fails on diff > 0.1%)
pnpm playwright test tests/e2e/visual
```

### CI Policy

Pixel diff threshold: **0.1%** (`maxDiffPixelRatio: 0.001`). Any diff above this value fails the build. Baseline images are committed to the repository under `tests/e2e/visual/__snapshots__/`.

---

## 8. Accessibility Tests

### Automated axe-core on Every E2E Test

`@axe-core/playwright` is installed and integrated into a shared Playwright fixture so that every E2E test automatically runs an axe audit after the page loads.

```typescript
// tests/e2e/fixtures.ts
import AxeBuilder from '@axe-core/playwright'
import { test as base } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page)
    // Run axe audit after every test
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  },
})
```

All E2E test files import `test` from `tests/e2e/fixtures.ts` rather than from `@playwright/test` directly.

### Dedicated Accessibility Spec

`tests/e2e/accessibility.spec.ts` runs a thorough axe audit on every named route:

```typescript
const routes = ['/', '/dashboard', '/settings', '/settings/parent', '/game/letter-tracing']

for (const route of routes) {
  test(`no axe violations on ${route}`, async ({ page }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}
```

### Keyboard Navigation Tests

```typescript
test('can tab through all interactive elements on Dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  // Tab through all focusable elements and verify each receives visible focus
})

test('can tab through all interactive elements on Game Shell', async ({ page }) => {
  await page.goto('/game/letter-tracing')
  // Tab through game controls and verify focus order is logical
})
```

---

## 9. Offline Tests

Offline simulation uses Playwright's built-in network control via `context.setOffline(true/false)`.

### Test: Offline Banner Timing

```typescript
test('offline banner appears within 500ms of going offline', async ({ context, page }) => {
  await page.goto('/dashboard')
  await context.setOffline(true)
  await expect(page.getByRole('status', { name: /offline/i })).toBeVisible({ timeout: 500 })
})
```

### Test: Game Playable Offline

```typescript
test('game plays without network access', async ({ context, page }) => {
  await page.goto('/game/multiple-choice')
  await context.setOffline(true)
  // Interact with game — expect no error state, expect answer submission works
  await page.getByRole('button', { name: 'Cat' }).click()
  await expect(page.getByRole('status', { name: /correct/i })).toBeVisible()
})
```

### Test: Score Saved While Offline

```typescript
test('score is saved to RxDB while offline', async ({ context, page }) => {
  await page.goto('/game/multiple-choice')
  await context.setOffline(true)
  // Complete one round
  await page.evaluate(async () => {
    const db = await getDb()
    const progress = await db.progress.findOne().exec()
    expect(progress).not.toBeNull()
  })
})
```

### Test: Sync Queue Has Pending Mutations While Offline

```typescript
test('sync queue accumulates mutations while offline', async ({ context, page }) => {
  await page.goto('/dashboard')
  await context.setOffline(true)
  // Trigger a write operation (e.g. bookmark a game)
  await page.evaluate(async () => {
    const db = await getDb()
    const queueItems = await db.sync_queue.find().exec()
    expect(queueItems.length).toBeGreaterThan(0)
  })
})
```

### Test: Banner Dismisses and Sync Resumes

```typescript
test('banner dismisses and sync resumes on going online', async ({ context, page }) => {
  await page.goto('/dashboard')
  await context.setOffline(true)
  await expect(page.getByRole('status', { name: /offline/i })).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole('status', { name: /offline/i })).toBeHidden({ timeout: 2000 })
})
```

---

## 10. i18n Tests

### Snapshot Tests

Each supported locale is tested by rendering the full app with the locale set and comparing output to a known-good snapshot. This catches regressions where a string changes or a key goes missing.

```typescript
describe('i18n snapshots', () => {
  it('renders dashboard in en', async () => {
    const { container } = render(<App locale="en" />)
    expect(container).toMatchSnapshot()
  })

  it('renders dashboard in pt-BR', async () => {
    const { container } = render(<App locale="pt-BR" />)
    expect(container).toMatchSnapshot()
  })
})
```

### Missing Key CI Check

A Node.js script runs in CI to compare translation files and fail if any key present in `en` is absent in any other locale.

```typescript
// scripts/check-i18n-completeness.ts
import enKeys from '../app/i18n/locales/en.json'
import ptBrKeys from '../app/i18n/locales/pt-BR.json'

function getMissingKeys(reference: object, target: object, prefix = ''): string[] { /* ... */ }

const missing = getMissingKeys(enKeys, ptBrKeys)
if (missing.length > 0) {
  console.error('Missing pt-BR keys:', missing)
  process.exit(1)
}
```

CI step:

```yaml
- name: Check i18n completeness
  run: tsx scripts/check-i18n-completeness.ts
```

### Grade Name Formatting

```typescript
describe('formatGrade', () => {
  it('formats pre-k correctly in en', () => {
    expect(formatGrade('pre-k', 'en')).toBe('Pre-K')
  })
  it('formats year-2 correctly in en', () => {
    expect(formatGrade('year-2', 'en')).toBe('Year 2')
  })
  it('formats pre-k correctly in pt-BR', () => {
    expect(formatGrade('pre-k', 'pt-BR')).toBe('Pré-K')
  })
})
```

---

## 11. Session History Tests

### Unit Tests (`tests/unit/session-recorder.test.ts`)

```typescript
describe('SessionRecorder — event recording', () => {
  it('records events published on the event bus', async () => {
    const { recorder, eventBus, db } = await createTestRecorder()
    eventBus.emit('answer:submitted', { isCorrect: true, itemId: 'q1' })
    await waitForDbWrite()
    const chunks = await db.session_history_chunks.find().exec()
    expect(chunks[0].events).toHaveLength(1)
  })
})

describe('SessionRecorder — chunk rollover', () => {
  it('creates a new chunk after 200 events', async () => {
    const { recorder, eventBus, db } = await createTestRecorder()
    for (let i = 0; i < 201; i++) {
      eventBus.emit('answer:submitted', { isCorrect: true, itemId: `q${i}` })
    }
    await waitForDbWrite()
    const chunks = await db.session_history_chunks.find().exec()
    expect(chunks).toHaveLength(2)
    expect(chunks[1].chunkIndex).toBe(1)
  })

  it('creates a new chunk when serialised size reaches ~50KB', async () => {
    const { recorder, eventBus, db } = await createTestRecorder()
    // Emit events with large payloads until ~50KB
    // Verify second chunk is created before 200 event threshold
  })

  it('increments chunkIndex correctly across multiple rollovers', async () => {
    // Emit 600+ events, verify chunks have chunkIndex 0, 1, 2
  })
})

describe('SessionRecorder — session index', () => {
  it('writes session_history_index doc on game:end', async () => {
    const { recorder, eventBus, db } = await createTestRecorder()
    eventBus.emit('game:end', { score: 10, totalItems: 10 })
    await waitForDbWrite()
    const index = await db.session_history_index.findOne().exec()
    expect(index).not.toBeNull()
    expect(index!.gameId).toBeDefined()
  })

  it('totalChunks in index matches actual chunk count', async () => {
    // Overflow past 200 events, emit game:end, verify index.totalChunks === chunks.length
  })
})
```

### E2E Tests (`tests/e2e/session-history.spec.ts`)

```typescript
test('history viewer shows sessions in newest-first order', async ({ page }) => {
  // Play two games, navigate to parent > history
  // Verify second game appears above first
})

test('expanding a session row lazy-loads event data', async ({ page }) => {
  // Play game, navigate to history, click expand on session row
  // Verify event list is shown and correct
})

test('filtering by game narrows results', async ({ page }) => {
  // Play two different games, filter by one game's name
  // Verify only that game's sessions are shown
})

test('cascade delete: clearing history removes all chunks', async ({ page }) => {
  // Play game that produces 3 chunks (>400 events)
  // Clear history in parent settings
  // Verify session_history_chunks and session_history_index are empty
  // Verify profiles and progress are unaffected
})
```

---

## 12. Test Data Fixtures

All fixtures live in `tests/fixtures/`. They export typed constant objects that satisfy the corresponding RxDB schema types.

### Files

| File | Contents |
|------|----------|
| `profiles.ts` | 3 profiles: alice (Pre-K), bob (Year 2), parent account |
| `progress.ts` | Sample progress docs for multiple games per profile |
| `settings.ts` | Sample settings per profile |
| `game_config_overrides.ts` | Sample overrides at each scope level |
| `bookmarks.ts` | Sample bookmarks |
| `themes.ts` | All 6 preset themes + 1 cloned custom theme |
| `session_history.ts` | 2 sessions: one with 1 chunk, one with 3 chunks |
| `session_history_index.ts` | Corresponding index documents |
| `db-factory.ts` | Helper that creates an in-memory RxDB instance pre-seeded with all fixture data |

### Fixture Format

```typescript
// tests/fixtures/profiles.ts
import type { Profile } from '../../app/db/schemas/profiles'

export const aliceProfile = {
  id: 'profile-alice-001',
  name: 'Alice',
  avatar: 'owl',
  gradeLevel: 'pre-k',
  language: 'en',
  themeId: 'theme-ocean',
  parentPinHash: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const satisfies Profile

export const bobProfile = {
  id: 'profile-bob-001',
  name: 'Bob',
  avatar: 'lion',
  gradeLevel: 'year-2',
  language: 'pt-BR',
  themeId: 'theme-forest',
  parentPinHash: null,
  isActive: false,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
} as const satisfies Profile

export const parentProfile = {
  id: 'profile-parent-001',
  name: 'Parent',
  avatar: 'star',
  gradeLevel: null,
  language: 'en',
  themeId: 'theme-ocean',
  parentPinHash: '$argon2id$v=19$m=65536,t=3,p=4$...', // bcrypt of '1234'
  isActive: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const satisfies Profile

export const allProfiles = [aliceProfile, bobProfile, parentProfile]
```

### `db-factory.ts`

```typescript
// tests/fixtures/db-factory.ts
import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { allCollections } from '../../app/db/collections'
import { allProfiles } from './profiles'
import { allProgress } from './progress'
// ... other fixture imports

export async function createTestDb() {
  const db = await createRxDatabase({
    name: `test-db-${Math.random()}`,
    storage: getRxStorageMemory(),
  })

  await db.addCollections(allCollections)

  await db.profiles.bulkInsert(allProfiles)
  await db.progress.bulkInsert(allProgress)
  // ... seed other collections

  return db
}
```

---

## 13. Coverage Targets Summary

| Category | Target |
|----------|--------|
| Game logic (override merging, session recorder) | 100% |
| RxDB schemas | 100% |
| Event bus | 100% |
| Theme engine | 90% |
| i18n utilities | 90% |
| Speech utilities | 85% |
| UI components (`app/components/`) | 85% line |
| E2E critical flows | 100% flow coverage |
| Accessibility (axe) | Zero violations |
| i18n completeness | Zero missing keys |
| Visual regression | Pixel-perfect baselines (< 0.1% diff) |

---

## 14. CI Pipeline Summary

```yaml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: tsc --noEmit

      - name: Lint (zero warnings)
        run: eslint . --max-warnings 0

      - name: i18n completeness
        run: tsx scripts/check-i18n-completeness.ts

      - name: Unit + component tests
        run: vitest run --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps

      - name: Build
        run: pnpm build

      - name: E2E tests
        run: pnpm exec playwright test

      - name: Visual regression tests
        run: pnpm exec playwright test tests/e2e/visual

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

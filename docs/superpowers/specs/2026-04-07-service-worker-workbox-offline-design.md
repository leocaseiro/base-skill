# Service Worker, Workbox & Offline-First Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Branch:** feat/service-worker-workbox-offline-setup

---

## 1. Overview

This spec delivers three tightly related capabilities as a single offline-first milestone:

1. **Game session resume** — `AnswerGameState` (tiles, zones, round position) persisted to RxDB so a page refresh silently resumes mid-game. Uses a hybrid approach: event log (`MoveLog`) for parent replay viewer, snapshot for fast reload.
2. **Service worker hardening** — completes the existing `vite-plugin-pwa` setup with `navigateFallback`, cache cleanup, SW update notification (non-intrusive banner when not in a game; deferred to natural game exit when mid-game).
3. **Version + Beta display** — app version and "Beta" badge in the header (all users) and in Parent Settings > About (with install ID and schema version detail).

**Out of scope:** cloud sync (M6), full parent replay viewer (M7), PWA install prompt (M8).

**Design decisions:**

| Decision            | Choice                                                             |
| ------------------- | ------------------------------------------------------------------ |
| Resume UX           | Silent instant resume — no prompt, skip instructions overlay       |
| SW update mid-game  | Defer banner until natural exit (back/game-over)                   |
| SW update elsewhere | Non-intrusive banner: "New version available — tap to update"      |
| Version display     | Header (all users) + Parent Settings > About                       |
| Game state storage  | Snapshot on `session_history_index.draftState` (no new collection) |
| Replay history      | Existing `MoveLog` event sourcing (unchanged)                      |

---

## 2. Game Session Resume

### 2.1 Architecture

Two parallel persistence layers serve different purposes:

```
AnswerGameProvider dispatch
  │
  ├── answerGameReducer → new AnswerGameState
  │       │
  │       └── useAnswerGameDraftSync (debounced 500ms)
  │               └── RxDB session_history_index.draftState  ← fast resume
  │
  └── GameEngineProvider (existing)
          └── useSessionRecorder → session_history chunks    ← parent replay
```

On page reload:

```
Route loader
  ├── findInProgressSession() → MoveLog (existing, for GameEngineProvider)
  └── findInProgressSession() → draftState (new, for AnswerGameProvider)
        │
        ├── initialLog → GameEngineProvider (score / phase replay)
        └── draftState → AnswerGameProvider (tile / zone visual state)
```

### 2.2 Schema change — `session_history_index` version 1 → 2

Add optional `draftState` field to the existing `session_history_index` schema.

```ts
// src/db/schemas/session_history_index.ts
// version bump: 1 → 2

interface AnswerGameDraftState {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  phase: 'playing' | 'round-complete'; // never 'game-over'
  roundIndex: number;
  retryCount: number;
}

// Added to schema:
draftState: AnswerGameDraftState | null;
```

`dragActiveTileId` is excluded — transient drag UI state cannot survive a refresh.

Migration: existing documents get `draftState: null` (no data loss, optional field).

### 2.3 `useAnswerGameDraftSync` hook

New hook mounted inside `AnswerGameProvider`. Writes the current `AnswerGameState` snapshot to `session_history_index.draftState` after significant state changes.

**Write triggers:**

- Debounced 500ms after every `AnswerGameState` change
- Flush immediately on `visibilitychange → hidden` (browser may close)
- Write `null` when `phase === 'game-over'` (clear draft on completion)
- Write `null` when `status === 'abandoned'` (player exits via back button)

**What it writes:**

```ts
{
  allTiles: state.allTiles,
  bankTileIds: state.bankTileIds,
  zones: state.zones,
  activeSlotIndex: state.activeSlotIndex,
  phase: state.phase,
  roundIndex: state.roundIndex,
  retryCount: state.retryCount,
}
```

**Location:** `src/lib/game-engine/useAnswerGameDraftSync.ts`

### 2.4 `findInProgressSession` return type extension

```ts
// src/lib/game-engine/session-finder.ts

interface InProgressSession {
  log: MoveLog;
  draftState: AnswerGameDraftState | null;
}

export async function findInProgressSession(
  profileId: string,
  gameId: string,
  db: BaseSkillDatabase,
): Promise<InProgressSession | null>;
```

Returns both `log` (existing) and `draftState` (new). Callers already destructure the result.

### 2.5 `AnswerGameProvider` changes

Accepts new optional prop `initialState?: AnswerGameDraftState`:

```ts
interface AnswerGameProviderProps {
  config: AnswerGameConfig;
  initialState?: AnswerGameDraftState; // NEW
  children: ReactNode;
}
```

When `initialState` is provided:

- `useReducer` initialises from `initialState` directly (not `makeInitialState(config)`)
- The `INIT_ROUND` `useEffect` is guarded — only fires if `initialState` is absent

```ts
// Before
const [state, dispatch] = useReducer(
  answerGameReducer,
  config,
  makeInitialState,
);

// After
const [state, dispatch] = useReducer(
  answerGameReducer,
  initialState ?? makeInitialState(config),
);
```

`useAnswerGameDraftSync(state, sessionId, db)` is mounted unconditionally inside `AnswerGameProvider`.

### 2.6 Game body changes (WordSpell, NumberMatch, SortNumbers)

The route loader already calls `findInProgressSession()`. The result now includes `draftState`.

`GameRouteLoaderData` gains:

```ts
interface GameRouteLoaderData {
  // existing fields...
  draftState: AnswerGameDraftState | null; // NEW
}
```

Each game body component (`WordSpellGameBody`, `NumberMatchGameBody`, `SortNumbersGameBody`) receives `draftState` as a prop and:

1. Passes it to `AnswerGameProvider` as `initialState`
2. Initialises `showInstructions` to `false` when `draftState !== null` (skip instructions overlay on resume)

```ts
const [showInstructions, setShowInstructions] = useState(
  draftState === null, // true = fresh session, false = resuming
);
```

### 2.7 Resume scenario (WordSpell "cat" example)

1. User loads WordSpell for "cat" — fresh session, instructions shown
2. User places `c` and `a` — `AnswerGameState` has `bankTileIds: ['t-tile-id']`, zones have `c` and `a` placed
3. `useAnswerGameDraftSync` writes snapshot to `session_history_index.draftState`
4. User refreshes browser
5. Route loader calls `findInProgressSession()` — finds `draftState`
6. `AnswerGameProvider` initialises from snapshot — same tiles, same zones
7. `showInstructions = false` — user lands directly in game
8. User sees `ca<slot>` with `t` tile in the bank

### 2.8 Stale session handling

Existing 24-hour staleness check in `findInProgressSession` applies to both `log` and `draftState`. If stale: marks `abandoned`, returns `null` for both, fresh session starts.

---

## 3. Service Worker & Offline Hardening

### 3.1 Current gaps

| Gap                        | Impact                                           |
| -------------------------- | ------------------------------------------------ |
| No `navigateFallback`      | SPA routes show browser offline error on refresh |
| No `cleanupOutdatedCaches` | Old SW caches accumulate                         |
| `injectRegister: 'auto'`   | No hook for SW update events                     |
| No update notification UI  | Users never know a new version is available      |

### 3.2 Workbox configuration changes (`vite.config.ts`)

```ts
VitePWA({
  registerType: 'prompt', // changed from 'autoUpdate' — manual control
  strategies: 'generateSW',
  injectRegister: null, // changed — register manually via useServiceWorker
  workbox: {
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/\/api\//],
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      // existing Google Fonts entries unchanged
    ],
  },
  manifest: false, // unchanged — manifest.json in public/
});
```

`registerType: 'prompt'` + `injectRegister: null` gives full control over SW registration and update lifecycle from application code.

### 3.3 `useServiceWorker` hook

**Location:** `src/lib/service-worker/useServiceWorker.ts`

```ts
interface UseServiceWorkerReturn {
  updateAvailable: boolean;
  applyUpdate: () => void;
}

export const useServiceWorker = (): UseServiceWorkerReturn
```

Registers the SW using `workbox-window` (already installed) on first mount. Listens for the `waiting` event to set `updateAvailable = true`. `applyUpdate()` posts `SKIP_WAITING` to the waiting SW then reloads the page.

**Registration is called once** from `__root.tsx` via a `useEffect`. The returned `updateAvailable` state is passed down via context or lifted to `_app.tsx`.

### 3.4 `ServiceWorkerContext`

**Location:** `src/lib/service-worker/ServiceWorkerContext.ts`

Thin context exposing `{ updateAvailable, applyUpdate }` to the component tree. Provided at the root level (`__root.tsx`).

### 3.5 `UpdateBanner` component

**Location:** `src/components/UpdateBanner.tsx`

Non-intrusive strip rendered inside `_app.tsx` above `<Outlet>` but below `<OfflineIndicator>`:

```
┌─────────────────────────────────────────────────┐
│  🔄 New version available — tap to update    [✕] │
└─────────────────────────────────────────────────┘
```

- Reads `updateAvailable` from `ServiceWorkerContext`
- Renders only when `updateAvailable === true`
- **Suppressed on game routes** — checks current route path, hides on `*/game/*`
- Tap calls `applyUpdate()` — posts `SKIP_WAITING`, page reloads
- Dismiss `[✕]` hides for current session without applying update

### 3.6 Mid-game deferred update

When `updateAvailable` becomes true while on a game route:

- Banner is suppressed
- On navigation away from the game route (back button, game-over), the pending SW activates on next page load naturally (browser handles this via `registerType: 'prompt'` lifecycle)
- No code needed beyond suppressing the banner on game routes

### 3.7 SW registration in `__root.tsx`

```ts
// src/routes/__root.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/base-skill/sw.js');
    // set up waiting listener → updateAvailable
    wb.register();
  }
}, []);
```

Wrapped in the `ServiceWorkerProvider` component.

### 3.8 Offline fallback guarantee

After this change, the offline behaviour is:

| Scenario                                       | Before                     | After                          |
| ---------------------------------------------- | -------------------------- | ------------------------------ |
| Refresh on `/en/game/word-spell` offline       | Browser offline error      | App loads from cache ✓         |
| Open app cold offline (first visit was online) | Depends on route           | App loads from cache ✓         |
| First ever load offline                        | Not possible (cache empty) | Not possible (cache empty)     |
| New game assets (first play of new game)       | Online required            | Online required for new assets |

**Constraint:** first load must always be online. This is fundamental to service worker architecture and cannot be changed.

---

## 4. Version Display

### 4.1 Header (`Header.tsx`)

Version + Beta badge added to the existing `Header` component. Always visible.

```
┌──────────────────────────────────────────────┐
│  BaseSkill   [Beta] v0.1.0              ☰    │
└──────────────────────────────────────────────┘
```

- Version: `import.meta.env.VITE_APP_VERSION` (already injected from `package.json`)
- "Beta" badge: controlled by `IS_BETA` constant in `src/lib/version.ts`
- Styling: small, muted text — not competing with game content or child-facing UI

```ts
// src/lib/version.ts
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const IS_BETA = true; // flip to false when exiting beta
```

### 4.2 Parent Settings > About

New section on the existing `parent/index.tsx` page (no new route needed). Reads from `app_meta` singleton document.

| Field               | Source                                              |
| ------------------- | --------------------------------------------------- |
| App version         | `APP_VERSION` constant                              |
| Channel             | `IS_BETA ? 'Beta' : 'Stable'`                       |
| Install ID          | `app_meta.installId` (UUID, already stored)         |
| RxDB schema version | `app_meta.rxdbSchemaVersion` (already stored)       |
| Last updated        | SW registration timestamp (from `useServiceWorker`) |

Install ID is useful for user support ("what's your install ID?") without exposing any PII.

### 4.3 `UpdateBanner` placement in layout

```
_app.tsx
  ├── <OfflineIndicator />
  ├── <UpdateBanner />      ← NEW (suppressed on /game/ routes)
  └── <Outlet />
```

---

## 5. Files to Create / Modify

### New files

| File                                               | Purpose                                 |
| -------------------------------------------------- | --------------------------------------- |
| `src/lib/version.ts`                               | `APP_VERSION`, `IS_BETA` constants      |
| `src/lib/service-worker/useServiceWorker.ts`       | SW registration + update detection hook |
| `src/lib/service-worker/ServiceWorkerContext.ts`   | Context for update state                |
| `src/lib/service-worker/ServiceWorkerProvider.tsx` | Provider wrapping root                  |
| `src/lib/game-engine/useAnswerGameDraftSync.ts`    | Draft state persistence hook            |
| `src/components/UpdateBanner.tsx`                  | SW update notification UI               |

### Modified files

| File                                                   | Change                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                                       | Add `navigateFallback`, `cleanupOutdatedCaches`, `registerType: 'prompt'`, `injectRegister: null` |
| `src/db/schemas/session_history_index.ts`              | Add `draftState` field, version 1 → 2                                                             |
| `src/db/migrations.ts`                                 | Migration for `session_history_index` v1 → v2 (`draftState: null`)                                |
| `src/lib/game-engine/session-finder.ts`                | Return `draftState` alongside `MoveLog`                                                           |
| `src/components/answer-game/AnswerGameProvider.tsx`    | Accept `initialState` prop, guard `INIT_ROUND` effect                                             |
| `src/components/answer-game/AnswerGame/AnswerGame.tsx` | Pass `initialState` through to `AnswerGameProvider`                                               |
| `src/components/answer-game/types.ts`                  | Export `AnswerGameDraftState` type                                                                |
| `src/routes/$locale/_app/game/$gameId.tsx`             | Pass `draftState` from loader; skip instructions on resume                                        |
| `src/routes/__root.tsx`                                | Mount `ServiceWorkerProvider`                                                                     |
| `src/routes/$locale/_app.tsx`                          | Render `UpdateBanner` above `<Outlet>`                                                            |
| `src/components/Header.tsx`                            | Add version + Beta badge                                                                          |
| `src/routes/$locale/_app/parent/index.tsx`             | Add About section                                                                                 |

---

## 6. Testing Strategy

### Unit (Vitest)

- `useAnswerGameDraftSync`: writes to RxDB on state change; flushes on visibility hidden; writes null on game-over
- `findInProgressSession`: returns `draftState` when present; returns `null` when stale
- `session_history_index` migration: existing docs gain `draftState: null`
- `AnswerGameProvider` with `initialState`: renders correct tiles/zones from snapshot; skips `INIT_ROUND` effect

### Integration (Vitest + RTL)

- `WordSpellGameBody` with `draftState`: renders mid-game state (correct tiles placed, bank tile visible), `showInstructions = false`
- `UpdateBanner`: renders when `updateAvailable = true`, hidden on game routes, calls `applyUpdate` on tap

### E2E (Playwright)

- **Resume:** Play WordSpell, place 2 tiles → `page.reload()` → assert same tiles placed, instructions not shown
- **Offline navigation:** go offline (`context.setOffline(true)`) → reload game route → assert app loads (not browser error)
- **Version display:** assert `v0.1.0` and `Beta` visible in header

### Manual verification

- Build (`yarn build`) → serve `dist/` → go offline in DevTools → reload — app must load
- Open Chrome DevTools > Application > Service Workers — confirm SW registered and caching

---

## 7. Constraints & Decisions

| Constraint                       | Detail                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| First load requires internet     | Fundamental SW limitation — cannot be changed                                                                        |
| SW only activates in production  | `vite-plugin-pwa` does not register SW in dev mode by design                                                         |
| `draftState` is best-effort      | If the browser is killed before the 500ms debounce fires, the last tile move may not be saved — acceptable trade-off |
| `IS_BETA` is a code constant     | Not a feature flag or environment variable — flip it and deploy when exiting beta                                    |
| Resume skips instructions always | If a user refreshes mid-instructions, they skip to playing — acceptable, instructions are optional                   |

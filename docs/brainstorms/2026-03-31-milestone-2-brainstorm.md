# Brainstorm: Milestone 2 — Data Layer and Core Infrastructure

**Date:** 2026-03-31  
**Source:** [baseskill_milestone_breakdown_85146c93.plan.md](../baseskill_milestone_breakdown_85146c93.plan.md) (Milestone 2)  
**Status:** Implementation plan captured — see [docs/superpowers/plans/2026-03-31-milestone-2-data-layer.md](../superpowers/plans/2026-03-31-milestone-2-data-layer.md).

---

## What We're Building

Milestone 2 establishes the **local-first data plane** and **cross-cutting services** everything else depends on.

**SYNC (ordered):**

1. **RxDB** — All collections from `docs/data-model.md`: `profiles`, `progress`, `settings`, `game_config_overrides`, `bookmarks`, `themes`, `session_history`, `session_history_index`, `sync_meta`, `app_meta`; IndexedDB storage; schemas aligned with JSON Schema + version fields.
2. **Migrations** — Framework driven by `app_meta` (and RxDB migration hooks) so schema changes are explicit and testable.
3. **React integration** — Hooks (or thin wrappers) so UI subscribes reactively to queries and collections without leaking RxDB types into every component.
4. **TanStack Query decision** — Document whether Query adds value on top of RxDB for this app, or whether custom hooks over RxDB observables are sufficient through Milestone 6+.

**ASYNC (after RxDB is initialized; can parallelize across people/agents):**

- **Event bus / plugin hooks** — Pub/sub for **first-party** core + games only in M2; **document** future extension points without committing to a stable third-party API yet (see `docs/game-engine.md` / `docs/architecture.md`).
- **i18n** — `en` + `pt-BR`, namespaces (`common`, `games`, `settings`, `encouragements`); **locale in the URL** (e.g. `/en/...`, `/pt-BR/...`) via TanStack Router, aligned with shareable links and history.
- **Theme engine** — Themes loaded from RxDB `themes` collection; seed **two** presets for M2 (more later); CSS variable injection; clone/edit flows for custom themes. **Anonymous users** still get a **built-in default theme** (static design tokens) before/without RxDB hydration.
- **Speech** — `SpeechOutput` (TTS), `SpeechInput` (STT), voice enumeration, graceful degradation when APIs are missing or denied.

**Repo reality today:** No `rxdb` in `package.json` yet; `src/routes/__root.tsx` and `ThemeToggle` use `localStorage` for light/dark. `docs/data-model.md` states user-facing data must go through RxDB — M2 should **replace or narrow** localStorage usage so it does not contradict the authoritative data model (system/bootstrap exceptions should be explicit and minimal).

**Product constraint (pre-profile):** Users are **not** required to pick a profile (“signed in”) to see a **usable homepage with the full game list**. Locale and theme must have **sensible defaults** so that screen is fully styled and translated. Profile (and RxDB-backed settings) gate **per-child** features (progress, bookmarks, parent overrides), not casual browsing. _Note:_ `docs/baseskill_milestone_breakdown_85146c93.plan.md` / `docs/ui-ux.md` currently lean profile-first in places; **Milestone 3 routing and guards** should be updated during planning so they match this constraint.

---

## Why This Approach

- **Single local source of truth** matches the PRD/architecture path to offline-first and later cloud sync (M6): investing in correct schemas and migrations now avoids rework.
- **Ordered SYNC** reduces risk: hooks and the TanStack Query decision depend on stable DB shape and migration story.
- **Parallel ASYNC** after DB init improves throughput without blocking the critical path, as long as shared contracts (e.g. event names, theme token shape) are agreed early from `docs/ui-ux.md` / `docs/game-engine.md`.

---

## Approaches: TanStack Query vs RxDB-Only (M2 decision)

| Approach                         | Summary                                                                                                                                 | Pros                                                                                          | Cons                                                                                                                                       | Best when                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **A — RxDB-first hooks**         | Custom hooks wrap observables / `toObservable` patterns; components subscribe via React state or small `useSyncExternalStore` adapters. | Fewer deps; model matches “live” data; no duplicate cache layer; aligns with `data-model.md`. | Team must own hook patterns and testing recipes.                                                                                           | **Default recommendation** for BaseSkill through M5: almost all state is local and reactive.                    |
| **B — TanStack Query as façade** | `useQuery` + `queryFn` snapshots from RxDB, or experimental observable integration where available.                                     | Familiar async/cache API for developers coming from server-first apps.                        | RxDB is already reactive; double bookkeeping and stale closure bugs unless carefully designed; poor fit for high-frequency session events. | Large app with heavy server fetch mix **after** M6; not needed for pure local RxDB in M2–M5.                    |
| **C — Hybrid boundary**          | RxDB hooks for local collections; TanStack Query reserved for **network** (OAuth, Drive/OneDrive metadata later).                       | Clear separation: local reactive vs remote request/response.                                  | Two mental models; need lint/docs so local data never goes only through Query.                                                             | **Adopt at M6** when cloud APIs land; optionally add `@tanstack/react-query` then, not as a prerequisite in M2. |

**Recommendation:** **Approach A** for Milestone 2–5; capture the decision in a short ADR or `docs/architecture.md` delta. Revisit **C** when implementing Milestone 6 cloud sync if remote calls benefit from Query’s request deduplication and status surfaces.

---

## Key Decisions

1. **Data access:** Implement **RxDB-only** reactive reads/writes per `docs/data-model.md` for **persisted** profile/settings/theme/bookmarks/progress. **Exceptions (documented in architecture):** (a) **URL locale** is authoritative for language segment (`/en/…`, `/pt-BR/…`); **default locale `en`** when navigating from `/` (redirect to `/en/…` or equivalent). (b) **Built-in default theme** via static CSS variables / app shell so the UI is correct before RxDB opens. (c) Optional tiny allowlist later (e.g. migration flags) — avoid duplicating RxDB fields in `localStorage` for signed-in users.
2. **TanStack Query:** **Defer** adding `@tanstack/react-query` until cloud/network features justify it; M2 “evaluate” step = written decision + hook conventions, not necessarily a new dependency.
3. **Theme transition:** Plan explicit cutover from current `localStorage` theme mode to **RxDB-backed themes** + CSS variables for users with persisted settings, while keeping a **static default theme** for anonymous and first-paint. Preserve `prefers-color-scheme` / “auto” behavior per `docs/ui-ux.md` where product still requires it.
4. **Event bus:** Implement as **separate module** from RxDB (events are not a substitute for persisted state); align with game-engine spec for session recording. **M2 scope:** **internal-only** (core + bundled games); extension points **documented** for later; **no** versioned third-party registration API in this milestone.
5. **Testing:** Follow `docs/testing-strategy.md` — real RxDB in tests where practical, `fake-indexeddb`, speech API mocks for speech services.
6. **i18n routing:** **Locale in the URL** (`/en/...`, `/pt-BR/...`); `react-i18next` (or chosen stack) stays in sync with the active route segment. **Default language `en`:** e.g. root path redirects into `/en/...` so unauthenticated users always land on a defined locale without RxDB.
7. **Anonymous browsing:** **Homepage + full game catalog** available **without** an active profile; game list comes from the **static registry** (or equivalent) until/unless product later ties visibility to RxDB. Profile required only for per-child flows (progress, session history, parent settings, etc.).

---

## Open Questions

_None._

---

## Resolved Questions

1. **Milestone 2 “done” scope:** **Full scope (A).** All SYNC items and all four ASYNC areas (event bus, i18n, theme engine, speech) ship in the same milestone closure.
2. **Locale in URLs:** **A — locale in the path.** Use URL segments for `en` and `pt-BR` (shareable links, clearer navigation); integrate with TanStack Router and i18n.
3. **Bootstrap / defaults:** **Default theme** = built-in static tokens (full UI before RxDB). **Default language** = `en` via routing (redirect from `/` into `/en/...`). **No profile required** to view homepage and full game list; RxDB holds per-profile data when the user engages deeper. Persisted theme/language preferences live in RxDB when tied to profiles/families; do not mirror them in `localStorage` for signed-in users.
4. **Plugin / event-bus surface:** **A — simple for now.** M2 is **internal-only**; document where a public plugin API might land later; defer stable third-party contracts.

---

## Next Steps

Use **`/writing-plans`** (or the saved plan) for execution. Plan: [docs/superpowers/plans/2026-03-31-milestone-2-data-layer.md](../superpowers/plans/2026-03-31-milestone-2-data-layer.md). Reconcile **Milestone 3** route guards and `docs/ui-ux.md` with **anonymous homepage + game catalog** when implementing M3.

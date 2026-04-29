# Debug Panel — Per-Game Settings & Round Inspector

> Status: **Approved (design)** — autonomous implementation via AO
> Date: 2026-04-29
> Issue: [#233](https://github.com/leocaseiro/base-skill/issues/233)

## Background

Custom games and saved configs flow through several layers before they reach
the active game:

1. The route loader at `src/routes/$locale/_app/game/$gameId.tsx` fetches the
   raw saved config from RxDB (`custom_games` keyed by `configId`, or the
   per-game `saved_game_configs` "last session" doc as a fallback).
2. Each game body (`WordSpellGameBody`, `NumberMatchGameBody`,
   `SortNumbersGameBody`) runs the raw config through a `resolve*Config`
   function that fills in defaults and migrates legacy shapes.
3. The resolved config drives the live game; rounds (questions/answers) are
   either taken directly from the config or sampled from the word library.
4. An in-progress session (`session_history_index`) carries `initialLog`,
   `draftState`, and `persistedContent` for resume flows.

When something goes wrong — a tile mode mismatch, a stale local-storage
config, a resume that picks up the wrong state, a level filter that yields
zero words — there is currently no in-app way to see what the game actually
received. We have to attach a debugger or read RxDB by hand.

## Goals

1. Add an opt-in **Debug Panel** that exposes everything a developer or QA
   user needs to verify the game is running with the expected settings.
2. Trigger via a query parameter so it never ships to a regular play
   session and never affects layout for users who do not opt in.
3. Work uniformly across all three games (`word-spell`, `number-match`,
   `sort-numbers`) and across both Simple and Advanced config modes.
4. Survive page refresh — i.e. it reads live state, so reloading the tab
   shows whatever the route loader + resolver hydrated this time.

## Non-Goals

- No mutation of state from the panel. This release is read-only. (Editing
  config from the panel is a possible follow-up but multiplies test surface.)
- No persistence of "is the panel open" — open/close state is per-render.
- No production telemetry, no metrics, no error reporting.

## Trigger

Add `debug` to the `validateSearch` of the existing game route:

```ts
debug: search.debug === '1' || search.debug === 'true' ? true : false,
```

Both `?debug=1` and `?debug=true` activate the panel. Anything else (absent,
`?debug=0`, `?debug=false`) leaves it off. The flag is parsed once and
passed into `GameBody` alongside the other loader data.

The query param survives navigation within the route (TanStack Router keeps
unmodified search params) and survives full reload (it's in the URL).

## UI

A floating, fixed-position panel anchored to the bottom-right of the
viewport, above the game canvas:

- **Collapsed:** a single chip "🛠️ Debug" that the user clicks to expand.
- **Expanded:** a card (max-height 80vh, scrollable, max-width 480px on
  desktop / full-width minus 16px on mobile) with sectioned content.

Sections (each independently collapsible, all collapsed by default except
**Resolved Config**):

1. **Resolved Config** — the `cfg` state from the game body, i.e. the
   exact object passed to `<WordSpell />` / `<NumberMatch />` /
   `<SortNumbers />`. Rendered as a syntax-highlighted JSON tree.
2. **Raw Saved Config** — the `gameSpecificConfig` returned from the route
   loader (the unmigrated, unresolved RxDB doc). Helps spot
   migration-vs-resolve bugs.
3. **Custom Game** — `customGameId`, `customGameName`, `customGameColor`,
   `customGameCover`. Empty section if not a custom game.
4. **Session** — `sessionId`, `seed`, whether `draftState` is present,
   whether `persistedContent` is present, and the in-progress phase if
   resumed.
5. **Rounds (Questions & Answers)** — table of every round in
   `cfg.rounds` (or the resolved/sampled rounds for library-sourced
   WordSpell). Columns vary per game:
   - WordSpell: index, word, emoji, mode hint
   - NumberMatch: index, value, range, tile style
   - SortNumbers: index, sequence, direction, skip
6. **Storage Snapshot** — keys & sizes for `localStorage` and the IndexedDB
   collections that affect this game (`custom_games`, `saved_game_configs`,
   `session_history_index`, `session_logs`). Shows count + sample IDs, not
   full payloads (those live in the other sections).

The panel is rendered through a portal so it sits above any game overlay
(InstructionsOverlay, GameOverOverlay) but **below** the global app
header (z-index between overlay layer and modal layer).

## Implementation

### Files

```text
src/components/DebugPanel/
  DebugPanel.tsx          — the panel UI, takes a fully-typed snapshot prop
  DebugPanel.test.tsx     — vitest unit tests
  format-rounds.ts        — per-game round → row mapper
  format-rounds.test.ts
  index.ts                — barrel
```

### Wiring

`src/routes/$locale/_app/game/$gameId.tsx`:

- Extend `validateSearch` with `debug`.
- Read it via `Route.useSearch()` inside `RouteComponent`, pass it into
  `GameRoute`.
- `GameRoute` passes it down to `GameBody`, which passes it to each
  `*GameBody`.
- Each `*GameBody` renders `<DebugPanel … />` after the game body when
  `debug` is true.

The DebugPanel signature:

```ts
interface DebugPanelProps {
  gameId: string;
  resolvedConfig: Record<string, unknown>;
  rawSavedConfig: Record<string, unknown> | null;
  customGame: {
    id: string | null;
    name: string | null;
    color: string | null;
    cover: Cover | null;
  };
  session: {
    sessionId: string;
    seed: string;
    hasDraftState: boolean;
    hasPersistedContent: boolean;
  };
  rounds: Array<Record<string, unknown>>;
}
```

The host (route) is responsible for assembling this snapshot — the panel
itself does not subscribe to RxDB or read from the loader. This keeps it
testable and avoids the panel diverging from what the game sees.

### Storage snapshot

`localStorage` is read synchronously on render. IndexedDB collection
counts come from a small async `useStorageSnapshot` hook that opens the
existing database via `getOrCreateDatabase()` and reads the count of each
collection. The hook lives next to DebugPanel and is **only invoked when
`debug` is true** so production renders pay zero cost.

### Styling

Tailwind utility classes consistent with the rest of the codebase. Reuse
the existing `Card` / `Button` UI primitives (`src/components/ui/`).
`<details>`/`<summary>` for the collapsible sections — semantic, no
extra state, keyboard-accessible by default.

## Compatibility

- **Simple mode** configs are first run through `resolve*Config` and only
  then snapshotted, so the Resolved Config section always shows the
  fully-hydrated shape. Raw Saved Config shows the simple-form payload
  unchanged.
- **Advanced mode** is the same code path; nothing special.
- **WordSpell library-sourced configs** show the resolved rounds the
  library returned this render. If the library returns zero (the bug
  class motivating this issue), the Rounds section shows an empty table
  with a "(library returned 0 words)" note rather than the raw fallback
  emoji rounds.
- **Resume / refresh** — because the panel reads live `cfg` state, a
  reload that hydrates a different shape (e.g. an old saved config that
  doesn't migrate cleanly) is immediately visible.

## Testing

`DebugPanel.test.tsx`:

- Renders nothing when `debug={false}` is implied by parent (the route
  conditional gates the render — covered as an integration smoke).
- Collapsed → expanded toggle.
- Sections render with provided data.
- Custom Game section is empty when `customGame.id` is null.
- Rounds table renders WordSpell / NumberMatch / SortNumbers shapes via
  `format-rounds`.

`format-rounds.test.ts`:

- WordSpell rounds with and without emoji.
- NumberMatch rounds.
- SortNumbers rounds.
- Empty rounds → empty array.

Route-level integration is covered by adding a single test to
`$gameId.test.tsx` that asserts the panel renders when `?debug=1` is in
the URL.

## Out of scope (follow-ups)

- Editing config from the panel (mutating `cfg` and persisting back).
- Exporting the snapshot as JSON.
- Recording a play session for replay.

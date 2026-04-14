# Architecture Documentation System — Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Audience:** Developers + AI agents contributing to BaseSkill

---

## 1. Goal

Create living architecture documentation that:

- Is co-located with the source code it describes
- Renders in Storybook (with Mermaid diagrams)
- Renders on GitHub and in VS Code without extra tooling
- Has a skill + CLAUDE.md rule to keep it updated as the codebase evolves
- Serves as both a quick reference for agents and an onboarding guide for developers

This is Milestone 1 of a larger documentation effort. Later milestones will extend coverage to
the full app (routing, DB layer, theme, service worker).

---

## 2. Scope (Milestone 1)

Two domains:

| Domain        | Source files                  | What it covers                                         |
| ------------- | ----------------------------- | ------------------------------------------------------ |
| `answer-game` | `src/components/answer-game/` | Game state reducer, 14 actions, hook composition layer |
| `game-engine` | `src/lib/game-engine/`        | Session lifecycle, move log, draft sync, round context |

---

## 3. File Structure

### Convention

Each domain gets two MDX files co-located with its source code, following the existing
`ComponentName.suffix.ext` pattern (e.g. `AnswerGame.stories.tsx`):

```
src/components/answer-game/AnswerGame/
├── AnswerGame.tsx
├── AnswerGame.stories.tsx
├── AnswerGame.test.tsx
├── AnswerGame.reference.mdx     ← state, actions, hooks catalog
└── AnswerGame.flows.mdx         ← event chains, Mermaid diagrams

src/lib/game-engine/
├── index.tsx
├── GameEngine.reference.mdx     ← lifecycle state, context API, session recording
└── GameEngine.flows.mdx         ← session lifecycle, move log, undo flows
```

Storybook auto-discovers all `*.mdx` files under `src/` (configured in `.storybook/main.ts`
line 20: `'../src/**/*.mdx'`). No additional wiring required.

### Existing docs

`docs/architecture.md` and `docs/game-engine.md` are historical design documents written
before implementation. They are **not replaced** — they remain as design intent records.
The new co-located `.mdx` files are "as-built" documentation that describe the actual
implementation today.

---

## 4. Document Content

### `AnswerGame.reference.mdx`

1. **State shape** — `AnswerGameState` interface with per-field descriptions, including
   `phase`, `zones`, `bankTileIds`, drag state fields
2. **Action catalog** — table of all 14 actions with: type, payload shape, dispatched by
   (hook/component), and effect on state
3. **Hook index** — each custom hook with: purpose, what it dispatches, what it composes,
   file path
4. **Context API** — `AnswerGameStateContext`, `AnswerGameDispatchContext`, and the
   `useAnswerGameContext` / `useAnswerGameDispatch` consumer hooks
5. **Config options** — `wrongTileBehavior`, `inputMethod`, `interactionMode` and how each
   changes reducer/hook behavior

### `AnswerGame.flows.mdx`

1. **Tile placement** — bank tile click/drag → `PLACE_TILE` → evaluation → phase transition
   (Mermaid sequence diagram)
2. **Wrong tile + auto-eject** — `PLACE_TILE` → `isWrong` → shake animation timer (350ms) →
   `EJECT_TILE` (Mermaid sequence diagram)
3. **Drag-and-drop** — `SET_DRAG_ACTIVE` → hover states → drop →
   `SWAP_TILES` / `PLACE_TILE` (Mermaid flowchart)
4. **Keyboard / touch input** — keydown / hidden input → `SET_ACTIVE_SLOT` /
   `REMOVE_TILE` / `TYPE_TILE` (Mermaid sequence diagram)
5. **Level progression** (SortNumbers only) — `ADVANCE_LEVEL` → `COMPLETE_GAME` (Mermaid
   state diagram)
6. **Round progression** — `phase: 'round-complete'` → delay → `ADVANCE_ROUND` or
   `COMPLETE_GAME` — **not yet implemented; placeholder section with status note**

### `GameEngine.reference.mdx`

1. **Provider API** — `GameEngineProvider` props, `GameStateContext`,
   `GameDispatchContext`, `GameRoundContext`
2. **Session recording** — `SessionRecorderGate`, `SessionRecorderBridge`, move log
   structure, RxDB persistence
3. **Draft sync** — `useAnswerGameDraftSync` — how in-progress state survives a page refresh
4. **Round context** — `GameRoundContext` shape `{ current, total }` and consumers

### `GameEngine.flows.mdx`

1. **Session lifecycle** — game start → play → complete → persist to RxDB (Mermaid sequence
   diagram)
2. **Move log & replay** — how moves are recorded and replayed on resume (Mermaid sequence
   diagram)
3. **Draft sync flow** — `useAnswerGameDraftSync` save/restore on mount/unmount (Mermaid
   sequence diagram)

---

## 5. Mermaid Rendering

Mermaid diagrams must render correctly in three environments:

| Environment | Solution                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub      | Natively supported — no setup needed                                                                                                   |
| VS Code     | `bierner.markdown-mermaid` extension (recommended via `.vscode/extensions.json`)                                                       |
| Storybook   | Client-side `<Mermaid>` component that renders via `mermaid` JS library; plugs into the existing MDX pipeline as a code-block override |

### Storybook implementation

A small shared component at `src/components/ui/Mermaid.tsx`:

```tsx
// Lazy-loads mermaid.js, renders the diagram client-side
// Used as a code-block override in .storybook/preview.tsx:
// components: { code: MermaidCodeBlock }
```

`MermaidCodeBlock` wraps `<Mermaid>` only when the code block language is `mermaid`;
all other code blocks render normally. This avoids patching the remark/rehype pipeline
and keeps the Storybook build fast (no headless browser / SSR Mermaid rendering).

### `.vscode/extensions.json`

```json
{
  "recommendations": ["bierner.markdown-mermaid"]
}
```

---

## 6. Agent Update System

### CLAUDE.md addition

A new section added to the root `CLAUDE.md`:

```markdown
## Architecture Documentation

When modifying game state logic — any file in `src/components/answer-game/`,
`src/lib/game-engine/`, or any file matching `*reducer*`, `*dispatch*`,
`*Behavior*`, `*Drag*` — update the co-located `.mdx` docs in the same PR.

Run `/update-architecture-docs` to get guided prompts for what to check.
```

### `/update-architecture-docs` skill

Location: `.claude/skills/update-architecture-docs/`

**Behavior:**

1. Reads `git diff --name-only HEAD` to identify changed files
2. Maps changed files to their relevant `.mdx` doc(s) using a lookup table
3. Reads the current `.mdx` files
4. Checks each section against the actual source code:
   - New action types added to the reducer → add to action catalog
   - Hooks added/removed/renamed → update hook index
   - State fields changed → update state shape section
   - New dispatch sites → update "dispatched by" column
   - Mermaid diagrams may need updating if flow changed
5. Edits the `.mdx` files with the necessary updates
6. Runs `yarn fix:md` to lint/format
7. Reports a summary: which sections were updated and why

**Skill file map** (lookup table inside the skill):

| Changed file pattern                      | Doc(s) to update                                                 |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `answer-game-reducer.ts`                  | `AnswerGame.reference.mdx` (action catalog, state shape)         |
| `use*Behavior*`, `use*Drag*`, `use*Tile*` | `AnswerGame.reference.mdx` (hook index) + `AnswerGame.flows.mdx` |
| `AnswerGameProvider.tsx`                  | `AnswerGame.reference.mdx` (context API)                         |
| `game-engine/index.tsx`                   | `GameEngine.reference.mdx` + `GameEngine.flows.mdx`              |
| `useAnswerGameDraftSync*`                 | `GameEngine.reference.mdx` (draft sync) + `GameEngine.flows.mdx` |

---

## 7. Out of Scope (Later Milestones)

- Routing layer (`src/routes/`) documentation
- DB layer (`src/db/`) documentation
- Theme / service worker documentation
- Per-game documentation (`src/games/word-spell/`, etc.)
- A top-level `src/APP_OVERVIEW.mdx` that links all domain docs together

---

## 8. Success Criteria

- [ ] `AnswerGame.reference.mdx` and `AnswerGame.flows.mdx` exist, render in Storybook,
      render on GitHub, and are accurate to the current implementation
- [ ] `GameEngine.reference.mdx` and `GameEngine.flows.mdx` exist and render correctly
- [ ] Mermaid diagrams render in Storybook (client-side component approach)
- [ ] `.vscode/extensions.json` recommends `bierner.markdown-mermaid`
- [ ] `CLAUDE.md` includes the update rule
- [ ] `/update-architecture-docs` skill exists and can identify stale sections
- [ ] `yarn lint:md` passes on all new `.mdx` files

# Update Architecture Docs

When this skill is invoked, follow these steps to check and update the co-located
architecture documentation.

## Step 1 — Find changed files

Run:

```bash
git diff --name-only HEAD
```

Note every changed file.

## Step 2 — Map changed files to docs

Use this lookup table to identify which doc files may be stale:

| Changed file pattern | Doc(s) to check |
| --- | --- |
| `answer-game-reducer.ts` | `src/components/answer-game/AnswerGame/AnswerGame.reference.mdx` — action catalog, state shape |
| `types.ts` (answer-game) | `AnswerGame.reference.mdx` — state shape, action catalog, config options |
| `use*Behavior*`, `use*Drag*`, `use*Tile*`, `useFreeSwap*`, `useAutoNextSlot*` | `AnswerGame.reference.mdx` (hook index) + `AnswerGame.flows.mdx` |
| `AnswerGameProvider.tsx` | `AnswerGame.reference.mdx` — context API section |
| `useAnswerGameDraftSync*` | `src/lib/game-engine/GameEngine.reference.mdx` (draft sync) + `GameEngine.flows.mdx` |
| `src/lib/game-engine/index.tsx` | `GameEngine.reference.mdx` + `GameEngine.flows.mdx` |
| `src/lib/game-engine/types.ts` | `GameEngine.reference.mdx` — state shape, move types |
| `src/lib/game-engine/lifecycle*` | `GameEngine.flows.mdx` — session lifecycle diagram |

## Step 3 — Read the relevant doc files

Read each doc file identified above.

## Step 4 — Check each section against the source code

For each doc file, check:

- **Action catalog**: does it list all current actions in `AnswerGameAction`? Are payload
  shapes correct? Is "dispatched by" still accurate?
- **State shape**: do all fields in `AnswerGameState` / `GameEngineState` appear in the
  table with correct types?
- **Hook index**: are all hooks present? Have any been added, removed, or renamed?
- **Config options**: do all `AnswerGameConfig` fields appear with correct types/defaults?
- **Mermaid diagrams**: do the dispatch sequences still match the hook implementations?
  Check timer durations, callback chains, and conditional branches.

## Step 5 — Edit stale sections

Update only the sections that are actually stale. Do not rewrite sections that are
accurate.

## Step 6 — Lint and format

```bash
yarn fix:md
```

## Step 7 — Report

List every section that was updated and why (e.g. "added SWAP_SLOT_BANK to action
catalog — was missing from table").

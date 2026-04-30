# Simple ↔ Advanced Config State Sync — Design

**Issue:** [#254](https://github.com/leocaseiro/base-skill/issues/254)
**Date:** 2026-04-30
**Games in scope:** WordSpell, SortNumbers, NumberMatch

## Problem

The simple form (rendered in `InstructionsOverlay`) and the advanced form
(rendered in `AdvancedConfigModal`) currently keep separate copies of the
game config. Three concrete bugs follow from that fork:

1. **Simple → advanced direction is broken.** `AdvancedConfigModal`
   initializes its local state with `useState(initialConfig)`, which only
   runs once at mount. Because the modal is always rendered (just toggled
   by `open`), edits made in the simple form before the cog is pressed
   never reach the modal's view.
2. **Cancel does not reset modal-local state.** Reopening the modal after
   a cancel still shows the previous in-flight edits, not the canonical
   config.
3. **Custom-game Play silently overwrites.** When a custom game is
   loaded, `handlePlay` calls `onUpdateCustomGame` without confirmation.
   In advanced mode the user always has the choice to update, save as
   new, or discard — Play should match.

There is also no concept of "dirty" today: every keystroke flows through
`onConfigChange` and into a debounced last-session write, so the auto-
persistence quietly mutates the saved baseline.

## Goals

- One shared draft (`config + name + color + cover`) between simple and
  advanced views, with deterministic open/cancel/save semantics.
- Apply the model uniformly to all three current games.
- Confirm the user's intent on Play whenever the draft differs from the
  saved baseline; skip the prompt when nothing changed.
- Surface persistence errors instead of swallowing them.

## Non-goals

- `configMode` lifecycle (when 'simple' flips to 'advanced' or back) is
  preserved as today: the modal still stamps `'advanced'` on save;
  simple-form edits do not change `configMode`.
- No visual redesign of the overlay or modal.
- No new "Reset to defaults" / "Revert to saved" button — Discard is
  enough.
- No changes to per-game config types or simple-resolvers.
- No RxDB schema changes; storage shape unchanged.
- No server-side or cross-device sync.

## Architecture

The shared draft lives in `InstructionsOverlay`. `AdvancedConfigModal`
becomes a controlled component (no internal `useState` for the four
draft fields). A new hook `useConfigDraft` encapsulates the state
machine.

```text
GameBody (route)
└── <InstructionsOverlay>
      ├── useConfigDraft({ initialConfig, initialName, initialColor, initialCover })
      │     → { draft, savedBaseline, isDirty,
      │         setDraft, openModalSnapshot, discard, commitSaved }
      ├── <SimpleForm config={draft.config} onChange={cfg => setDraft({config: cfg})} />
      └── <AdvancedConfigModal
            open={modalOpen}
            value={draft}
            onChange={setDraft}
            onCancel={discard}        // restores snapshot + closes
            onSaveNew={...commitSaved} // persists, then commits
            onUpdate={...commitSaved}
          />
```

The route component (`WordSpellGameBody`, `SortNumbersGameBody`,
`NumberMatchGameBody`) keeps its current job: load the persisted config,
hand it to `InstructionsOverlay`. It no longer holds the editing draft.
The route's existing `cfg` becomes "what the engine should run when the
game starts" — it is updated only on commit.

## State machine

```ts
type Draft = {
  config: Record<string, unknown>;
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
};

type ConfigDraftApi = {
  draft: Draft;
  savedBaseline: Draft;
  isDirty: boolean; // !deepEqual(draft, savedBaseline)
  setDraft: (patch: Partial<Draft>) => void;
  openModalSnapshot: () => void;
  discard: () => void;
  commitSaved: (next: Draft) => void;
};
```

| Trigger                            | Effect                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Simple form `onChange`             | `setDraft({config: …})`                                                        |
| Modal field edits                  | `setDraft({config\|name\|color\|cover: …})`                                    |
| Modal opens (cog)                  | `openModalSnapshot()` — `snapshotRef = structuredClone(draft)`                 |
| Modal Cancel / Esc / outside-click | `discard()` — `draft = snapshotRef`; `snapshotRef = null`                      |
| Modal Save as new (success)        | `commitSaved(persistedDraft)` — `draft = baseline = persistedDraft`            |
| Modal Update (success)             | `commitSaved(persistedDraft)`                                                  |
| Route loader returns new data      | Hook re-initializes via stable identity key (e.g. `customGameId ?? 'default'`) |

**Re-init key.** When the loaded values change identity (custom game A →
B, or arriving on the route for a different custom game), `useConfigDraft`
resets `draft` and `savedBaseline` to the new initial values.

**Dirty check.** Deep-equal across all four fields. Implemented via a
small in-house helper in `src/lib/deep-equal.ts` (~25 lines covering
plain objects, arrays, and primitives — the only shapes our config
holds). Order-of-keys safe; covered by its own unit test.

**Edge cases.**

- Modal opens without changes → Cancel: snapshot equals current draft;
  no-op revert.
- User edits simple form while modal is open: changes apply to the
  shared draft; Discard reverts those too because the snapshot was
  taken before they were made. This matches the agreed "Discard reverts
  to the modal-open state" semantics.
- Update / Save as new failure: `commitSaved` is not called; the modal
  stays open with edits intact (see Error handling).

## Play flow

```text
handlePlay():
  if not isDirty:
    persistLastSession(gameId, draft.config)
    onStart()
    return

  if customGameId:
    openPlayPrompt({ kind: 'customGame' })   // 3 actions
  else:
    openPlayPrompt({ kind: 'default' })      // 2 actions
```

**Custom-game prompt (3 actions):**

| Action              | Effect                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Update "<name>"     | `update(customGameId, draft.config, draft.name, {color, cover})` → on success `commitSaved(draft)` → `onStart()`                                        |
| Save as new         | Reuse existing save-name sub-dialog (seeded by `suggestCustomGameName`); on success `commitSaved(newRow)` → `navigate({configId: newId})` → `onStart()` |
| Play without saving | `persistLastSession(gameId, draft.config)` → `onStart()` (no `custom_games` write)                                                                      |

**Default prompt (2 actions):** existing save-on-play dialog stays
unchanged in shape: `Save & play` and `Play without saving`. The Save &
play path also calls `persistLastSession` before `onStart()` so behavior
matches the other variants.

**`persistLastSession` replaces `usePersistLastGameConfig`.** The
debounced auto-write is removed. `persistLastSessionConfig(gameId,
config)` (already exposed from `useCustomGames`) is called explicitly
in:

- `handlePlay` clean path
- "Play without saving" action (both variants)
- The Save & play / Save as new / Update success paths (so that opening
  the default-game URL after editing a loaded custom game shows the
  most recent draft state)

## Error handling

| Failure path                                                    | UX                                                                                                                                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal **Update** fails                                          | Modal stays open, edits intact. Inline error banner at the bottom (mirrors `nameError` styling): "Couldn't update — try again." Plus `toast.error` from `sonner`. No `commitSaved`. |
| Modal **Save as new** fails                                     | Same as above. (Duplicate-name is caught client-side and never reaches this path.)                                                                                                  |
| Play prompt **Update** fails                                    | Prompt dialog stays open, edits intact. Inline error + toast. User can retry or pick another option.                                                                                |
| Play prompt **Save as new** fails                               | Reuses existing save-name sub-dialog with its existing inline error treatment + toast.                                                                                              |
| Play prompt **Play without saving** \— last-session write fails | Non-blocking: log + `toast.error` ("Couldn't remember settings"), still call `onStart()`.                                                                                           |
| Modal **Delete** fails (already exists)                         | Adds a `toast.error` while we are in the file; behavior otherwise unchanged.                                                                                                        |

A small `errorMessage` state lives on the modal and on the play prompt;
cleared on next attempt, on dialog close, or on success.

## Testing strategy

The issue mandates "verified, and unit tested for all current games."

**New unit tests:**

| File                                                                    | Covers                                                                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/deep-equal.test.ts`                                            | primitives, nested objects, arrays, key-order independence, null/undefined, NaN handling                                    |
| `src/components/answer-game/InstructionsOverlay/useConfigDraft.test.ts` | `setDraft` merges; `openModalSnapshot` captures; `discard` reverts; `commitSaved` clears dirty; prop-change re-init via key |

**Updated tests:**

| File                                                                          | Updates                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/AdvancedConfigModal.test.tsx`                                 | Switch from `config={…}` to controlled `value={…} / onChange`. Preserve all existing assertions (configMode stamp, name validation, delete flow, level rows, distractorCount visibility). Add: parent updates to `value` propagate to rendered fields. |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` | Extend with the matrix below.                                                                                                                                                                                                                          |

**InstructionsOverlay matrix.** Run via `describe.each` over
`['word-spell', 'sort-numbers', 'number-match']`.

| #   | Scenario                                               | Setup                                             | Assertion                                                                                  |
| --- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Simple → advanced sync                                 | Edit a field in simple form, then open modal      | Modal field reflects the simple-form value                                                 |
| 2   | Advanced → simple sync (Update)                        | Open modal, edit, click Update                    | After modal closes, simple form reflects the new advanced value                            |
| 3   | Advanced → simple sync (Save as new)                   | Open modal, edit, Save as new with a valid name   | Saved doc reflects edits; simple form reflects edits; URL has new configId                 |
| 4   | Discard reverts both views                             | Edit simple, open modal, edit advanced, Discard   | Both simple and advanced fields revert to the modal-open snapshot                          |
| 5   | Clean play, no prompt                                  | Load custom game, no edits, click Play            | `onStart` called immediately; no prompt                                                    |
| 6   | Dirty + custom-game prompt                             | Load custom game, edit simple, click Play         | Prompt with three buttons: `Update "X"`, `Save as new`, `Play without saving`              |
| 7   | Dirty + default-game prompt                            | No customGameId, edit, click Play                 | Existing two-button prompt: `Save & play`, `Play without saving`                           |
| 8   | Update from prompt persists then plays                 | Scenario 6 → click Update                         | `update()` called with draft; `onStart()` called; dirty cleared                            |
| 9   | "Play without saving" persists last-session and starts | Scenario 6 → click Play without saving            | `persistLastSessionConfig` called once with draft; `update` not called; `onStart()` called |
| 10a | Update DB error from play prompt                       | Scenario 6 → click Update → mock `update` rejects | Prompt stays open, inline error visible, `toast.error` fired, `onStart` not called         |
| 10b | Update DB error from advanced modal                    | Open modal → edit → click Update → mock rejects   | Modal stays open, edits intact, inline error + toast, `commitSaved` not called             |
| 11a | Save as new DB error from play prompt                  | Scenario 6 → Save as new → mock `save` rejects    | Save sub-dialog stays open, inline error + toast, `onStart` not called                     |
| 11b | Save as new DB error from advanced modal               | Open modal → fill name → Save as new → rejects    | Modal stays open, inline error + toast, `commitSaved` not called                           |
| 12  | Re-init on configId change (custom game A → B)         | Render with A, then change customGameId prop to B | Modal/simple form reflect B's values; dirty=false                                          |

**Existing simple-form unit tests:** no behavior change expected for
`WordSpellSimpleConfigForm.test.tsx`, `SortNumbersSimpleConfigForm.test.tsx`,
`NumberMatchSimpleConfigForm.test.tsx` — they already test the
`onChange` contract.

**TDD discipline.** Per CLAUDE.md, every behavior change is
red→green→refactor: write the failing test, watch it fail for the right
reason, write minimal code, watch it pass.

## Rollout

- Single PR off `feat/issue-254` against `master`.
- Multiple commits per project rule (baby-step):
  1. `deepEqual` helper + tests.
  2. `useConfigDraft` hook + tests.
  3. `AdvancedConfigModal` controlled refactor + updated tests + storybook props.
  4. `InstructionsOverlay` integration + extended tests.
  5. Per-game route cleanup of `usePersistLastGameConfig` (replace with explicit calls).
  6. Error-handling polish (toasts, inline banners).
- Each commit independently green on `yarn typecheck && yarn lint && yarn test`.
- VR baselines re-checked locally with Docker before push.
- PR description links #254 with `Closes #254`.

## Risks

- `usePersistLastGameConfig` is referenced by all three game bodies;
  removal touches all three. The replacement keeps the same effective
  behavior on Play.
- Existing storybook stories that render `<AdvancedConfigModal config={…}>`
  directly need their props updated to the controlled shape.
- Tests for `InstructionsOverlay` that mock `useCustomGames` may need a
  small extension to expose `persistLastSessionConfig` for assertions.
- Worktree note: AO placed this session in `~/.worktrees/base-skill/bs-14`
  rather than `<project-root>/worktrees/<branch>` per project convention.
  Branch (`feat/issue-254`) is correct; only the location differs.
  Cosmetic for this PR; the git branch and PR target are unaffected.

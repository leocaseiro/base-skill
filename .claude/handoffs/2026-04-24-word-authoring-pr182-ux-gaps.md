# Handoff: Word Authoring PR #182 — ship-ready tasks + open UX gaps

**Date:** 2026-04-24
**Branch:** `claude/bold-sinoussi-60d7fa`
**Worktree:** `worktrees/bold-sinoussi-60d7fa`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-sinoussi-60d7fa`
**Git status:** clean
**Unpushed commits:** 1 ahead of `origin/claude/bold-sinoussi-60d7fa`
**Last commit (local, unpushed):** `6c81e6c8 fix(word-authoring): call RiTa.hasWord, not a non-existent isKnownWord`
**PR:** [#182](https://github.com/leocaseiro/base-skill/pull/182) — OPEN
**Related open issues:** [#183](https://github.com/leocaseiro/base-skill/issues/183) (CLAUDE.md/AGENTS.md rule), [#184](https://github.com/leocaseiro/base-skill/issues/184) (Storybook Playground refactor)

## Resume command

```bash
/resync
cd .claude/worktrees/bold-sinoussi-60d7fa
# Read this file + PR #182 + issues #183, #184 before starting
```

Then decide the order from the **Next steps** list below. User preference: commit at every reviewable checkpoint; `SKIP_*` flags allowed for minor intermediate commits (see `feedback_skip_hooks_minor.md`).

## Current state

**Task:** Word Authoring feature — PR #182 is open; the main 17-task plan landed, plus two follow-up fixes since then. Several UX gaps surfaced during manual browser testing and need addressing.

**Phase:** implementation + polish (feature complete, UX debt accumulating)

**Progress:** PR #182 raised; Rita-runtime bug fixed locally but unpushed awaiting user browser verification; three UX fixes bundled and ready but unstarted.

## What we did in this session

1. Executed the 17-task Word Authoring plan end-to-end via superpowers:subagent-driven-development.
2. Raised PR #182 against master with full test plan + known architectural concerns.
3. Opened issues #183 (systemic: plans must consult project skills) and #184 (Storybook refactor to Playground).
4. Diagnosed and fixed a production bug where `RiTa.isKnownWord` was a phantom method (augmented into the type but not on the real runtime). Added `console.error` catch in the debounced hook so the next silent failure surfaces in devtools.

## Decisions made (with reasoning)

- **Dynamic import of `draftStore` in `filter.ts`** — kept as-is. Root cause is a Dexie version conflict (RxDB bundles 4.0.10, we added ^4.4.2). The proper fix (`yarn resolutions`) affects RxDB globally and wants human sign-off; left as a reviewer note on the PR.
- **Did not add mobile entry points for `+ New word` / `Drafts (N)`** — out of scope for the plan, flagged on the PR.
- **Deleted `rita-augment.d.ts`** — rita's shipped `.d.ts` already covers `hasWord`, `phones`, `syllables`. The augment was wrong (invented `isKnownWord`) and redundant. Removal prevents similar runtime mismatches going forward.
- **Tests changed from `isKnownWord` mock to `hasWord`** as the TDD red-step / regression guard.
- **Conversion of IPA input to "concatenated symbols, no slashes / no spaces / no stress"** — decided by reading shipped curriculum JSONs (e.g. `level3.json` uses `pʊtɪŋ`-style strings). UI does no normalisation today — flagged as a gap.

## Spec / Plan

- `docs/superpowers/specs/2026-04-23-word-authoring-design.md`
- `docs/superpowers/plans/2026-04-24-word-authoring-implementation.md`

## Key files touched this session (beyond the plan's commits)

- `src/data/words/authoring/engine.ts:44` — `RiTa.hasWord(word)` (was `isKnownWord`)
- `src/data/words/authoring/engine.test.ts` — mock renamed to `hasWord` / `mockHasWord`
- `src/data/words/authoring/rita-augment.d.ts` — **deleted**
- `src/data/words/authoring/AuthoringPanel.tsx` (~line 116) — added `catch (error) { console.error(...) }` block around the debounced breakdown call

## Open questions / blockers

- [ ] **Browser verification of commit `6c81e6c8` before push.** User opened the Storybook playground (`http://localhost:6798/?path=/story/data-wordlibraryexplorer--playground`), typed `putting`, and IPA/chips/syllables didn't populate. The rita fix should resolve it, but needs visual confirmation before pushing to origin and adding to PR #182.
- [ ] **UX bundle not yet started.** User approved direction but hasn't green-lit applying: (a) conditional-mount in `WordLibraryExplorer.tsx` to fix state-leak across open/close, (b) delete-chip button + `deleteChip` helper, (c) selected-chip ring style, (d) instructional line above chip row.
- [ ] **Design decision pending** for non-Rita word authoring: do we require chips+syllables for every draft (and build `+ Add chip` / syllable input UI), or loosen the CLI Zod schema to allow chipless drafts? Affects issue scope below.

## Next steps (in suggested order)

1. [ ] **Push `6c81e6c8` once user verifies browser flow** — attaches the Rita fix to PR #182.
2. [ ] **Apply the UX bundle** (one commit on this branch, no push until user reviews):
   - Conditional mount in `WordLibraryExplorer.tsx`: `{authoringWord !== null && <AuthoringPanel ... />}` — fixes state leaking across re-opens.
   - Add `deleteChip(i)` helper in `AuthoringPanel.tsx` + 🗑 Delete button in the chip editor popover. Must give removed chip's letters to the previous chip (or next, if `i===0`) to preserve the `chips.map(c => c.g).join('') === word` invariant.
   - Selected-chip style: add `ring-2 ring-sky-500 ring-offset-1` when `i === editingIndex`; keep amber underneath for low-confidence.
   - Instructional line above chip row: e.g. `Click a chip to change its phoneme or rebalance letters. Selected chip has a blue ring; amber chips are low-confidence guesses.`
   - TDD: new test `deletes a chip via the editor` in `AuthoringPanel.test.tsx`; new test `resets form state when opened with a different word` in `WordLibraryExplorer.authoring.test.tsx`.
3. [ ] **Open a follow-up issue** titled roughly: _"Manual chip + syllable authoring for non-Rita words; align CLI import schema"_. Must cover:
   - `+ Add chip` affordance when `chips.length === 0` (or always)
   - Syllable input (slash/comma separated, parsed with `join('') === word` invariant)
   - Decision on CLI schema: keep `graphemes: min(1)` + require manual authoring, OR loosen to allow chipless drafts. Currently `yarn words:import` will reject unknown-word drafts because the panel saves them with `graphemes: []`.
4. [ ] **Open a follow-up issue** for IPA field normalisation/validation: strip `/`, spaces, `ˈ`, `ˌ` (and possibly `ː`) on save, or show an inline hint. The Zod schema only checks `min(1)`, so polluted values round-trip unchecked.
5. [ ] **Deferred items from the original PR** (copied from PR #182 body for visibility):
   - VR baselines — start Docker, `yarn test:vr:update`, commit baselines, `yarn test:vr` green
   - Manual spec §13 acceptance walkthrough against `yarn dev`
   - `yarn resolutions` for Dexie (reviewer sign-off required)
   - Mobile entry points for `+ New word` / `Drafts (N)`
   - `phoneme-audio` fetch stub band-aid in tests
   - CLI exit semantics (`process.exitCode` vs `throw`)
   - Storybook Playground refactor — tracked in #184

## Context to remember

- **User preferences (memory entries exist):**
  - Named exports only (no `export default` except framework configs).
  - TDD required for every bug fix — write failing test first.
  - Commit freely; push freely for features, **confirm before push for bug fixes**.
  - `SKIP_*` pre-commit flags allowed for minor/polish commits (document the skip in the commit body).
  - PRs always target master.
  - Storybook must follow the Playground pattern (the authoring stories don't — tracked in #184).
- **Do NOT start directly on master.** Always work inside this worktree.
- **Dexie v4.4.2 vs 4.0.10 (from rxdb)** — expect `"Two different versions of Dexie loaded"` if you import `draftStore` statically into `filter.ts`. The existing dynamic import works around it; adding a `yarn resolutions` entry is the proper fix.
- **`react-hooks/set-state-in-effect`** is enforced by the React Compiler plugin. Use the `.then()` + `ignore` flag pattern, or fold state into a hook that wraps async work — don't just `useEffect(() => { fetch().then(setX) })`.
- **Architecture note on the debounced hook:** `useDebouncedBreakdown` in `AuthoringPanel.tsx` owns `breakdown / chips / ipa / level` state together because seeding happens in the async callback. Keep any new derived state (syllables-from-breakdown, suggestion) as render-time derivations, not state.
- **IPA user-edit guard:** `ipaEditedRef` in the hook prevents a late-arriving debounce result from overwriting a fast typist's manual IPA edits. Don't remove it when refactoring.
- **TypeScript strict checks:** `noUncheckedIndexedAccess` is on. Expect `arr[i]` to be `T | undefined`; handle with guards, optional chaining, or `!` where the index is loop-guarded.
- **Pre-commit hook is bucket-gated** (`scripts/detect-buckets.mjs`). Individual commits may not trigger typecheck/lint even if they introduce errors; always run `yarn lint && yarn typecheck` locally before trusting a clean session.

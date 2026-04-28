# Handoff: Word Authoring — two minor UX bugs to fix on PR #182

**Date:** 2026-04-24
**Branch:** `claude/bold-sinoussi-60d7fa`
**Worktree:** `worktrees/bold-sinoussi-60d7fa`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/.claude/worktrees/bold-sinoussi-60d7fa`
**Git status:** clean
**Unpushed commits:** 18 ahead of `origin/claude/bold-sinoussi-60d7fa`
**Last commit:** `e9cba303 feat(word-authoring): edit shipped entries as draft overrides`
**PR:** [#182](https://github.com/leocaseiro/base-skill/pull/182) — OPEN (all the commits below are still local-only; push when the user green-lights a review)

## Resume command

```bash
/resync
cd .claude/worktrees/bold-sinoussi-60d7fa
# Read this file and the previous handoff (2026-04-24-word-authoring-pr182-ux-gaps.md) before starting.
# Then TDD the two bugs listed under Next steps.
```

User preference reminder (memory): commit at every reviewable checkpoint, `SKIP_*` flags allowed for minor/polish commits. **Do not push** — explicit user sign-off required. Bug fixes need a failing test first (`feedback_tdd_for_bug_fixes.md`).

## Current state

**Task:** Word Authoring UX polish on top of PR #182. Last session added the full authoring surface (chips/syllables editors with 5 directional buttons, IPA→chip align, shipped override, reference links, phoneme inventory fix, play button, LTS fallback via `RiTa.analyze`). Two small UX bugs remain.

**Phase:** polish — feature complete, bugfix pass.

**Progress:** 18 commits local, unpushed, all green locally (lint + typecheck + `yarn vitest related`). Last user verification round passed for every shipped commit except these two bugs.

## What we did in this session (summary)

18 commits addressing every UX gap from the previous handoff plus several that surfaced during manual testing. The stack (newest first):

| Commit     | Summary                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `e9cba303` | Edit shipped entries as draft overrides (ResultCard Edit, filter dedup) |
| `b999112b` | Dictionary / Vocabulary / HowManySyllables links under the Word input   |
| `d845d0ae` | Chip + syllable editors get five directional buttons (‹ « ✂ » ›)        |
| `43c23df9` | Flatten split-digraphs + `→ Align chips` IPA button                     |
| `7bc78366` | Stateful syllables with split/delete/editor                             |
| `c1000945` | `RiTa.analyze` + LTS fallback (prothesis etc. now aligned)              |
| `ea1cf994` | Phoneme dropdown offers all 44 AUS phonemes (was 9)                     |
| `00ce84ce` | Play-phoneme button next to the Phoneme label                           |
| `e1cce964` | Bootstrap chip for rita-unknown words                                   |
| `14fbcaa6` | Split button added to the chip editor                                   |
| `915d8bde` | Chip delete + selection ring + hint                                     |
| `0c0d9463` | Normalise IPA on save + render                                          |
| `8ecf13ac` | Editing a draft pre-fills the form and saves in place                   |
| `324b9ea9` | Empty-state copy omits level when level filter isn't the blocker        |
| `d81ba24d` | Level-aware empty-state when shipped word is filtered out               |

Also raised one issue: [#186](https://github.com/leocaseiro/base-skill/issues/186) — compose compound words from existing parts (sun + day → sunday).

## Decisions made (with reasoning)

- **`RiTa.analyze` replaces `hasWord`-gated `phones`/`syllables`.** Analyze works for any word (LTS fallback for dictionary misses); `hasWord` is kept purely to drive the amber "this is a guess" banner.
- **Split-digraphs flattened in `AuthoringPanel` post-alignment.** `aligner.ts` still emits `a_e` / `o_e` symbolic chips with non-contiguous `span`, but the new `flattenAlignedChips(word, chips)` helper expands them into literal letters + a silent-e chip so `chips.map(c => c.g).join('') === word` holds. Keeps the aligner's teaching semantics intact for other callers.
- **Five directional buttons over the old `− + Delete`.** Move / Join separate letter-boundary rebalancing from chip-count changes, which closes the single-letter-chip merge gap. Syllables use the same five buttons.
- **Shipped edits land as drafts with `id: ''` seeds, not in-place JSON mutations.** The filter dedupes so a shipped word with a same-word draft shows exactly once (draft wins). Promotes via the existing `yarn words:import` CLI. Curriculum JSON is never mutated at runtime.
- **`ipa.ts` strips slashes, whitespace, and stress marks** (`ˈ` / `ˌ`) on save and render; length marks (`ː`) pass through. Matches zero instances of slash/space/stress in shipped AUS JSON (length marks present). Also exposes `tokenizeIpa` (greedy longest-match over a phoneme inventory).

## Spec / Plan

- Prior handoff: `.claude/handoffs/2026-04-24-word-authoring-pr182-ux-gaps.md`
- Design spec: `docs/superpowers/specs/2026-04-23-word-authoring-design.md`
- Plan (largely superseded by the commits above): `docs/superpowers/plans/2026-04-24-word-authoring-implementation.md`

## Key files

- `src/data/words/authoring/AuthoringPanel.tsx` — form state (`useDebouncedBreakdown`), chip + syllable editors, save path (routes on `initialDraft.id` truthiness), shipped-override banner
- `src/data/words/authoring/aligner.ts` — `align` (unchanged) + `flattenAlignedChips` (new, expands split-digraphs)
- `src/data/words/authoring/engine.ts` — `RiTa.analyze` entry point, catches LTS parse errors
- `src/data/words/authoring/ipa.ts` — `normalizeIpa`, `tokenizeIpa`
- `src/data/words/filter.ts` — `loadShippedWordLevels`, `isLevelInFilter`, draft-shadows-shipped dedupe in `filterWords`
- `src/data/words/WordLibraryExplorer.tsx` — `handleEditHit` synthesises the draft seed (`id: ''` for shipped, live DraftEntry lookup for drafts); `ResultCard` now takes an `onEdit` prop; grid renders each word once thanks to filter dedupe

## Open questions / blockers

- [ ] The two bugs below — scope of this handoff.
- [ ] Dexie resolutions (`yarn resolutions` for Dexie 4.0.10 from rxdb vs 4.4.2 from us). User said "don't worry for the dexie and so on for now, this should be in a gh ticket, and I think already is". **Action for next session:** verify an open issue exists; if not, open one. `gh issue list --state open` as of today shows only #178, #183, #184, #186 (none Dexie-specific) — you may need to create one.
- [ ] All 18 commits are unpushed. User has been verifying each in-browser locally. When the two bugs below are fixed, ask about pushing to PR #182.

## Next steps (in suggested order)

1. [ ] **Bug 1: Stale list after save/delete in the Drafts panel.** After saving / updating / deleting a draft, the `WordLibraryExplorer` grid and the Drafts panel list don't refresh — user has to reload the page.
   - **Likely cause:** the `filterWords` effect in `WordLibraryExplorer.tsx:617` depends on `[filter]` only. When `authoringWord` / `editingDraft` transitions to `null` on save, we refresh `draftCount` (line 610) but not the result grid. The `DraftsPanel` has its own `refresh` that fires on `[open]` (see `src/data/words/authoring/DraftsPanel.tsx:54`) so it only updates when the panel is re-opened.
   - **Simplest fix:** add a `draftVersion: number` state in `WordLibraryExplorer` that bumps on every save/delete (pass a setter or a callback down). Include it in the `filterWords` effect's deps. Pass a similar callback into `DraftsPanel` so it re-refreshes after its own delete. TDD: write a failing test that renders the explorer, saves a draft via the panel, closes the panel, and asserts the new draft appears in the grid without a re-render.
   - **Alternative:** broadcast via a tiny Dexie `liveQuery` or a hook on `draftStore` that emits on mutations. Heavier, but decouples the two views.
2. [ ] **Bug 2: Word field shouldn't be editable in edit mode; add a "Re-generate from RitaJS" button.** User's phrasing: _"In Edit mode, we can't change the word, so we can make the field disable. With that, we should instead, have a button to re-generate from RitaJS. It should be optional when the field is no longer empty after the first blur."_
   - **Intent (my read — confirm with user if unsure):**
     - In edit mode (`initialDraft` is set, either truthy `id` for an existing draft or `''` for a shipped override) → the Word input is disabled; a Re-generate button is always visible.
     - In new-word mode (`initialDraft === undefined`) → the Word input stays editable while the user is composing. Once the field is non-empty AND has been blurred once, disable it and show the Re-generate button. The button is optional ("optional" = the user can choose to press it or keep their manual edits; it's not required to make progress).
   - **Why disable the Word in edit mode:** editing the word itself is effectively a rename, which `draftStore` doesn't support (unique `[region+word]` index, and no migration for the row). Safer to force the user to cancel and re-create.
   - **Re-generate button behaviour:** calls `generateBreakdown(word)` again (same path as the debounced first run), then re-seeds chips / IPA / syllables / level from the result. Prompt to confirm when the form is dirty so the user doesn't silently lose edits.
   - **TDD:** (a) edit-mode test: rendering with `initialDraft` makes the Word input have `disabled`; (b) new-word test: type a word, don't blur, input stays enabled; blur once while non-empty, input becomes disabled and a "Re-generate" button appears; (c) clicking Re-generate invokes `generateBreakdown` and updates the chips/syllables (easiest to assert via the mock engine in `AuthoringPanel.test.tsx`).
   - **Location:** `src/data/words/authoring/AuthoringPanel.tsx` — Word input around the `{word.trim() && (...)}` reference-links block (currently around line 596). Add an `onBlur` handler on the input that flips a `wordCommitted` boolean once `word.trim() !== ''`. For edit mode, treat `wordCommitted` as initially `true`.

## Context to remember

- **User preferences (memory entries):**
  - Named exports only (no `export default` except framework configs).
  - TDD required for every bug fix — failing test first, commit includes the test.
  - Commit freely; push only with explicit confirmation (bug-fix flow).
  - `SKIP_*` pre-commit flags allowed on minor/polish commits; document the skip in the message body.
  - PRs always target master.
- **Do not start on master.** All work stays inside this worktree until push.
- **Dexie version conflict** (4.0.10 from rxdb vs 4.4.2 from our `draftStore`) — don't touch in this session; user says there's a ticket (verify via `gh issue list` first thing).
- **Word is an immutable key for drafts.** The `[region+word]` unique index in `draftStore` (`src/data/words/authoring/draftStore.ts:15`) means changing `word` on an existing draft would require a delete + save pair, which breaks referential integrity with any consumers that pinned `draftId`. Hence Bug 2's "disable word in edit mode" framing.
- **Shipped-override flow is working end-to-end.** Any code you add must not break the `initialDraft.id === ''` discriminator — `WordLibraryExplorer.handleEditHit` synthesises this for shipped hits, and `AuthoringPanel.handleSave` routes on the same check.
- **`flattenAlignedChips` is required on every alignment site.** If you add a new path that calls `align(word, phonemes)` (e.g. IPA re-align → yes, already does), flatten before setting chips, or the grapheme-chip invariant breaks and Split/Join misbehave silently.
- **Pre-commit hook is bucket-gated** (`scripts/detect-buckets.mjs`). A single file edit may not trigger typecheck/lint. Always `yarn lint && yarn typecheck` locally before a commit you intend to push.

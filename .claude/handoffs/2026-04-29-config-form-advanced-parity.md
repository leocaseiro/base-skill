---
name: ConfigForm advanced-form parity
description: Pick up the per-game ConfigForm Storybook work — extend the advanced preview to match the in-app `AdvancedConfigModal` more closely
---

# Handoff: ConfigForm advanced-form parity

**Date:** 2026-04-29
**Branch:** `feat/issue-153`
**Worktree:** `~/.worktrees/base-skill/bs-1` _(AO default — not the project's
`<root>/worktrees/<name>` convention; see Notes)_
**Worktree path:** `/Users/leocaseiro/.worktrees/base-skill/bs-1`
**Git status:** 1 unpushed commit; `.claude/settings.json` modified (pre-existing,
not mine), `.claude/metadata-updater.sh` untracked (also not mine)
**Last commit:** `974803bf fix(storybook): render WordSpell advanced header in ConfigForm story (#153)`
**PR:** [#214](https://github.com/leocaseiro/base-skill/pull/214) — open

## Resume command

```bash
/resync
cd ~/.worktrees/base-skill/bs-1
# Decide whether to push 974803bf as-is, amend it, or extend the advanced
# preview further (see "Next steps" below) before pushing.
```

## Current state

**Task:** Issue #153 — per-game ConfigForm stories. The "add stories + simple/
advanced toggle" work is committed; the latest commit also makes the WordSpell
advanced preview render its header (`WordSpellLibrarySource`) the same way the
real `AdvancedConfigModal` does.
**Phase:** review / extend
**Progress:** PR #214 has 5 commits; the user paused before pushing the 5th
(`974803bf`) to look at the advanced form and decide if more parity work is
needed before shipping.

## What we did this session

- Standardised every Storybook sidebar `title:` to PascalCase segments
  (`AnswerGame/X`, `Games/SortNumbers/X`, `UI/X`, etc.). Documented the rule in
  `CLAUDE.md → Storybook Sidebar Titles` and the write-storybook skill; saved
  `feedback_storybook_title_pascalcase.md` in Claude memory.
- Added a `mode: 'simple' | 'advanced'` radio control to all 3 per-game
  ConfigForm stories. `scenario` is conditionally hidden when `mode === 'simple'`
  via `if: { arg: 'mode', eq: 'advanced' }`. `onChange` is hidden from the
  controls table (`table.disable: true`) — the `fn()` spy still wires into the
  Actions panel.
- Discovered the WordSpell advanced preview was missing the
  `WordSpellLibrarySource` header that `AdvancedConfigModal` renders above
  `<ConfigFormFields>`. Last commit pulls the renderer via
  `getAdvancedHeaderRenderer('word-spell')` and renders it above the field list,
  matching the app.

## Decisions made

- **PascalCase sidebar titles, not filesystem mirror.** User explicitly chose
  option B on 2026-04-28: filesystem stays kebab-case (runtime `gameId` /
  registry keys); Storybook is presentation. Saved as feedback memory so future
  sessions don't re-derive.
- **Use `getAdvancedHeaderRenderer` from the registry, not a hand-maintained
  copy in the story.** Matches `AdvancedConfigModal` line 87 — keeps the story
  in sync if more games register headers later.
- **Hoist the registry call to module scope** to satisfy
  `react-hooks/static-components` (calling it inside the harness component
  triggers the lint rule).

## Spec / Plan

- Issue [#153](https://github.com/leocaseiro/base-skill/issues/153) — add
  per-game ConfigForm scenarios out of `ConfigFormFields.stories.tsx`.
- Reference component: `src/components/AdvancedConfigModal.tsx` — canonical
  shape of what the advanced flow looks like in the app. The per-game ConfigForm
  story should mirror its **field area** (header + ConfigFormFields), not the
  modal chrome (CoverPicker, name input, color picker, save buttons).

## Key files

- `src/games/word-spell/WordSpell.config-form.stories.tsx:79–88` —
  `AdvancedHeader` hoisted at module scope; rendered above `<ConfigFormFields>`
  when `mode === 'advanced'`.
- `src/games/sort-numbers/SortNumbers.config-form.stories.tsx`,
  `src/games/number-match/NumberMatch.config-form.stories.tsx` — simple/advanced
  toggle wired but **no header** (the registry returns `undefined` for these
  games today).
- `src/games/config-fields-registry.tsx:58–71` —
  `getAdvancedHeaderRenderer(gameId)`. Only `word-spell` registers a header
  (`WordSpellAdvancedHeader` → `WordSpellLibrarySource`).
- `src/components/AdvancedConfigModal.tsx:240–247` — reference render: header
  → `<ConfigFormFields>`. The story should match this stack ordering.
- `CLAUDE.md → Storybook Sidebar Titles` — the PascalCase title rule, written
  this session.

## Open questions

- [ ] Does the user want the story to render **more** of `AdvancedConfigModal`
      (e.g. `<CoverPicker>`, the custom-game name input, the color picker)? Or is
      "header + fields" enough? The intent of the `/handoff` ("to make the advanced
      form after") suggests they want to keep iterating.
- [ ] Should NumberMatch and SortNumbers stories also call
      `getAdvancedHeaderRenderer(gameId)` (no-op today) for consistency, or leave
      them lean? Symmetric pattern would survive a future header registration.
- [ ] Is there a Storybook decorator missing for the WordSpell library source
      (it imports `GRAPHEMES_BY_LEVEL` from `@/data/words` — pure module, but worth
      confirming nothing depends on a runtime data fetch).

## Next steps

1. [ ] Pull this branch, restart Storybook, open `Games/WordSpell/ConfigForm`
       in advanced mode and confirm the header renders correctly end-to-end.
2. [ ] If parity looks good as-is, `git push` to ship the 5th commit on PR #214.
3. [ ] If more parity is wanted, extend the harnesses (likely WordSpell first)
       to render additional `AdvancedConfigModal` slots in a separate commit on the
       same PR (or a follow-up PR).
4. [ ] Audit NumberMatch and SortNumbers — do they have any pieces of advanced
       UI in the app that the story currently skips? (`AdvancedConfigModal` is
       shared, but the per-game `getAdvancedHeaderRenderer` is the only per-game
       slot today; if other slots are added later, mirror them in the stories.)

## Context to remember

- **Worktree location:** This worktree was created by AO under `~/.worktrees/`
  rather than the project's `<root>/worktrees/<branch>` convention. Existing
  feedback memory `feedback_worktree_location.md` documents the user's
  preference to keep worktrees inside the project root. Ask before moving an
  in-flight branch — don't silently relocate a worktree with a live PR.
- **PR #214 cadence:** User explicitly OK'd baby-step commits and pushing
  features without confirmation, but **rejected** the push of `974803bf`
  mid-flight to review the advanced form first. Treat that as a signal to ask
  before re-pushing — don't auto-resume.
- **AO orchestrator force-rebases the PR branch** while you're working —
  expect `git push` to be rejected and need a `git pull --rebase
origin feat/issue-153` cycle. Stash `.claude/settings.json` first; it's a
  pre-existing local mod that gets in the way of rebase.
- **No `Default` story; use `Playground`.** Project-wide rule from PR #208 —
  the write-storybook skill enforces it.
